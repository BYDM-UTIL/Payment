import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { Employee, MonthlyPayment, PensionPayment, YearSettings, AuditLog } from '@/types'
import {
  calculateGrossTotal,
  calculateTotalPaid,
  calculateBalanceDue,
  calculatePaymentStatus,
  calculatePensionRequired,
  calculatePensionBalance,
} from '@/utils/calculations'
import { isoNow } from '@/utils/dates'

// ─── Employees ────────────────────────────────────────────────────────────────

export async function getEmployees(employerId: string): Promise<Employee[]> {
  const q = query(collection(db, 'employees'), where('employerId', '==', employerId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Employee)
}

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  const snap = await getDoc(doc(db, 'employees', employeeId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Employee
}

export async function createEmployee(
  data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'employees'), {
    ...data,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  })
  return ref.id
}

export async function updateEmployee(id: string, data: Partial<Employee>) {
  await updateDoc(doc(db, 'employees', id), { ...data, updatedAt: isoNow() })
}

export async function deleteEmployee(id: string) {
  await deleteDoc(doc(db, 'employees', id))
}

// ─── Year Settings ────────────────────────────────────────────────────────────

export async function getYearSettings(
  employeeId: string,
  year: number
): Promise<YearSettings | null> {
  const snap = await getDoc(doc(db, 'employees', employeeId, 'years', String(year)))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as YearSettings
}

export async function setYearSettings(employeeId: string, year: number, data: Partial<YearSettings>) {
  await setDoc(
    doc(db, 'employees', employeeId, 'years', String(year)),
    { ...data, year, updatedAt: isoNow() },
    { merge: true }
  )
}

// ─── Monthly Payments ─────────────────────────────────────────────────────────

export async function getMonthlyPayments(employeeId: string, year: number): Promise<MonthlyPayment[]> {
  const q = query(
    collection(db, 'employees', employeeId, 'years', String(year), 'monthlyPayments'),
    orderBy('month')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MonthlyPayment)
}

export function subscribeToMonthlyPayments(
  employeeId: string,
  year: number,
  callback: (payments: MonthlyPayment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'employees', employeeId, 'years', String(year), 'monthlyPayments'),
    orderBy('month')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MonthlyPayment))
  })
}

export async function saveMonthlyPayment(
  employeeId: string,
  year: number,
  month: number,
  input: {
    baseSalary: number
    pocketMoney: number
    shabbatAmount: number
    vacationAmount: number
    holidayAmount: number
    cashPaid: number
    payslipPaid: number
    bankTransferPaid: number
    hasPayslip: boolean
    paymentDate?: string
    notes?: string
  }
): Promise<void> {
  const grossTotal = calculateGrossTotal(input)
  const totalPaid = calculateTotalPaid(input)
  const balanceDue = calculateBalanceDue(grossTotal, totalPaid)
  const paymentStatus = calculatePaymentStatus(grossTotal, totalPaid, true)

  const ref = doc(db, 'employees', employeeId, 'years', String(year), 'monthlyPayments', String(month))
  await setDoc(
    ref,
    {
      ...input,
      month,
      year,
      grossTotal,
      totalPaid,
      balanceDue,
      paymentStatus,
      updatedAt: isoNow(),
    },
    { merge: true }
  )
}

export async function saveSignature(
  employeeId: string,
  year: number,
  month: number,
  signatureUrl: string,
  signedBy: string
): Promise<void> {
  const ref = doc(db, 'employees', employeeId, 'years', String(year), 'monthlyPayments', String(month))
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    throw new Error('payment-not-found')
  }

  const existing = snap.data()
  if (existing.signed === true || existing.employeeSignatureUrl) {
    throw new Error('payment-already-signed')
  }

  await setDoc(
    ref,
    {
      signed: true,
      employeeSignatureUrl: signatureUrl,
      signedAt: isoNow(),
      signedBy,
      updatedAt: isoNow(),
    },
    { merge: true }
  )
}

export async function addAttachmentToPayment(
  employeeId: string,
  year: number,
  month: number,
  attachment: { id: string; name: string; url: string; type: string; size: number; uploadedAt: string; uploadedBy: string }
): Promise<void> {
  const ref = doc(db, 'employees', employeeId, 'years', String(year), 'monthlyPayments', String(month))
  const snap = await getDoc(ref)
  const existing = snap.exists() ? (snap.data().attachments ?? []) : []
  await setDoc(ref, { attachments: [...existing, attachment], updatedAt: isoNow() }, { merge: true })
}

// ─── Pension Payments ─────────────────────────────────────────────────────────

export async function getPensionPayments(employeeId: string, year: number): Promise<PensionPayment[]> {
  const q = query(
    collection(db, 'employees', employeeId, 'years', String(year), 'pensionPayments'),
    orderBy('month')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PensionPayment)
}

export function subscribeToPensionPayments(
  employeeId: string,
  year: number,
  callback: (payments: PensionPayment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'employees', employeeId, 'years', String(year), 'pensionPayments'),
    orderBy('month')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PensionPayment))
  })
}

export async function savePensionPayment(
  employeeId: string,
  year: number,
  month: number,
  input: {
    baseSalary: number
    amountPaid: number
    pensionRate: number
    paymentDate?: string
    paymentProvider?: string
    notes?: string
  }
): Promise<void> {
  const requiredPensionAmount = calculatePensionRequired(input.baseSalary, input.pensionRate)
  const balanceDue = calculatePensionBalance(requiredPensionAmount, input.amountPaid)

  const ref = doc(db, 'employees', employeeId, 'years', String(year), 'pensionPayments', String(month))
  await setDoc(
    ref,
    {
      month,
      year,
      baseSalary: input.baseSalary,
      requiredPensionAmount,
      amountPaid: input.amountPaid,
      balanceDue,
      paymentDate: input.paymentDate ?? null,
      paymentProvider: input.paymentProvider ?? null,
      notes: input.notes ?? null,
      attachments: [],
      updatedAt: isoNow(),
    },
    { merge: true }
  )
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function addAuditLog(employeeId: string, log: Omit<AuditLog, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'employees', employeeId, 'auditLog'), {
    ...log,
    createdAt: isoNow(),
  })
}

export async function getAuditLog(employeeId: string): Promise<AuditLog[]> {
  const q = query(
    collection(db, 'employees', employeeId, 'auditLog'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog)
}
