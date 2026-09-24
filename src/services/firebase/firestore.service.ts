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
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db, auth } from './config'
import type {
  Employee,
  MonthlyPayment,
  PensionPayment,
  YearSettings,
  AuditLog,
  PaymentRecord,
  PaymentAuditEntry,
  PaymentAuditAction,
  EmploymentTerms,
} from '@/types'
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

export async function getActiveEmployees(employerId: string): Promise<Employee[]> {
  const q = query(collection(db, 'employees'), where('employerId', '==', employerId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Employee).filter((employee) => employee.active)
}

export async function createEmployee(
  data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Remove undefined fields to prevent Firestore validation errors
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  )
  
  console.log('[Firestore] Creating employee with data:', cleanData)
  
  try {
    const ref = await addDoc(collection(db, 'employees'), {
      ...cleanData,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    })
    console.log('[Firestore] Employee created successfully with ID:', ref.id)
    return ref.id
  } catch (error) {
    console.error('[Firestore] Error creating employee:', error)
    throw error
  }
}

export async function updateEmployee(id: string, data: Partial<Employee>) {
  await updateDoc(doc(db, 'employees', id), { ...data, updatedAt: isoNow() })
}

export async function deleteEmployee(id: string) {
  await deleteDoc(doc(db, 'employees', id))
}

type PaymentRecordInput = Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt' | 'deletedBy'>

function paymentCollection(employeeId: string) {
  return collection(db, 'employees', employeeId, 'payments')
}

function paymentAuditCollection(employeeId: string, paymentId: string) {
  return collection(db, 'employees', employeeId, 'payments', paymentId, 'audit')
}

async function addPaymentAudit(
  employeeId: string,
  paymentId: string,
  action: PaymentAuditAction,
  performedBy: string,
  performedByName: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
) {
  const changedFields = before && after
    ? Object.keys({ ...before, ...after }).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    : undefined
  await addDoc(paymentAuditCollection(employeeId, paymentId), {
    paymentId,
    caregiverId: employeeId,
    action,
    performedBy,
    performedByName,
    timestamp: isoNow(),
    before: before ?? null,
    after: after ?? null,
    changedFields: changedFields ?? [],
  })
}

export async function getPaymentRecords(employeeId: string, year: number, month?: number): Promise<PaymentRecord[]> {
  const snap = await getDocs(paymentCollection(employeeId))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as PaymentRecord)
    .filter((record) => record.year === year && record.deleted !== true && (!month || record.month === month))
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate))
}

export async function createPaymentRecord(input: PaymentRecordInput, performedByName: string): Promise<string> {
  const ref = await addDoc(paymentCollection(input.caregiverId), {
    ...input,
    deleted: false,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  })
  await addPaymentAudit(input.caregiverId, ref.id, 'created', input.createdBy, performedByName, undefined, input as unknown as Record<string, unknown>)
  return ref.id
}

export async function updatePaymentRecord(
  employeeId: string,
  paymentId: string,
  data: Partial<PaymentRecordInput>,
  performedBy: string,
  performedByName: string,
) {
  const ref = doc(paymentCollection(employeeId), paymentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('payment-not-found')
  const before = snap.data() as Record<string, unknown>
  const after = { ...before, ...data, updatedAt: isoNow(), updatedBy: performedBy }
  await updateDoc(ref, after)
  await addPaymentAudit(employeeId, paymentId, 'updated', performedBy, performedByName, before, after)
}

export async function softDeletePayment(employeeId: string, paymentId: string, performedBy: string, performedByName: string) {
  const ref = doc(paymentCollection(employeeId), paymentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('payment-not-found')
  const before = snap.data() as Record<string, unknown>
  const after = { ...before, deleted: true, deletedAt: isoNow(), deletedBy: performedBy }
  await updateDoc(ref, { deleted: true, deletedAt: after.deletedAt, deletedBy: performedBy, updatedAt: isoNow(), updatedBy: performedBy })
  await addPaymentAudit(employeeId, paymentId, 'deleted', performedBy, performedByName, before, after)
}

export async function getPaymentAudit(employeeId: string, paymentId: string): Promise<PaymentAuditEntry[]> {
  const snap = await getDocs(query(paymentAuditCollection(employeeId, paymentId), orderBy('timestamp', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentAuditEntry)
}

export async function getCurrentEmploymentTerms(employeeId: string): Promise<EmploymentTerms | null> {
  const snap = await getDocs(query(collection(db, 'employees', employeeId, 'employmentTerms'), where('active', '==', true)))
  const terms = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as EmploymentTerms))
  return terms.sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0] ?? null
}

export async function createEmploymentTerms(terms: Omit<EmploymentTerms, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'employees', terms.caregiverId, 'employmentTerms'), { ...terms, createdAt: isoNow() })
  return ref.id
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
  const prev = await getDoc(ref)
  const isCreate = !prev.exists()

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

  await writeAuditSafe(employeeId, {
    action: isCreate ? 'create' : 'update',
    entityType: 'payment',
    entityId: `${year}-${month}`,
    after: { grossTotal, totalPaid, balanceDue, paymentStatus },
  })
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

  // Couple the signature and its audit entry in a single atomic batch.
  const batch = writeBatch(db)
  batch.set(
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
  const auditRef = doc(collection(db, 'employees', employeeId, 'auditLog'))
  batch.set(auditRef, {
    action: 'sign',
    entityType: 'payment',
    entityId: `${year}-${month}`,
    userId: signedBy,
    createdAt: isoNow(),
    serverTime: serverTimestamp(),
  })
  await batch.commit()
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

  await writeAuditSafe(employeeId, {
    action: 'update',
    entityType: 'pension',
    entityId: `${year}-${month}`,
    after: { requiredPensionAmount, amountPaid: input.amountPaid, balanceDue },
  })
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

// Best-effort audit write for non-atomic events. Uses the current auth uid.
async function writeAuditSafe(
  employeeId: string,
  log: { action: AuditLog['action']; entityType: AuditLog['entityType']; entityId: string; before?: Record<string, unknown>; after?: Record<string, unknown> }
) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await addDoc(collection(db, 'employees', employeeId, 'auditLog'), {
      ...log,
      userId: uid,
      createdAt: isoNow(),
      serverTime: serverTimestamp(),
    })
  } catch (err) {
    console.warn('[Audit] Failed to write audit log:', err)
  }
}

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
