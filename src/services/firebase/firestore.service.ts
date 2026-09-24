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
  runTransaction,
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
  PaymentMethod,
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

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T
}

function paymentCollection(employeeId: string) {
  return collection(db, 'employees', employeeId, 'payments')
}

function paymentAuditCollection(employeeId: string, paymentId: string) {
  return collection(db, 'employees', employeeId, 'payments', paymentId, 'audit')
}

// One shared payment record per (year, month) so admin and caregiver read/write the same doc.
export function paymentDocId(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
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

// Realtime subscription to all of a caregiver's payments (admin + caregiver share this).
export function subscribeToPayments(
  employeeId: string,
  callback: (payments: PaymentRecord[]) => void,
): Unsubscribe {
  return onSnapshot(paymentCollection(employeeId), (snap) => {
    const payments = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as PaymentRecord)
      .filter((record) => record.deleted !== true)
      .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate))
    callback(payments)
  })
}

export async function getPaymentAudit(employeeId: string, paymentId: string): Promise<PaymentAuditEntry[]> {
  const snap = await getDocs(query(paymentAuditCollection(employeeId, paymentId), orderBy('timestamp', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentAuditEntry)
}

interface MonthlyPaymentInput {
  caregiverId: string
  caregiverName: string
  employerId: string
  month: number
  year: number
  paymentDate: string
  monthlySalary: number
  saturdayPayment: number
  holidayPayment: number
  otherPayment: number
  totalPaid: number
  paymentMethod: PaymentMethod
  bankReference?: string
  note?: string
}

// Admin create/edit. Increments version and recomputes money status; resets to pending signature.
export async function upsertMonthlyPayment(input: MonthlyPaymentInput, performedBy: string, performedByName: string): Promise<string> {
  const id = paymentDocId(input.year, input.month)
  const ref = doc(paymentCollection(input.caregiverId), id)
  const snap = await getDoc(ref)
  const totalDue =
    (input.monthlySalary || 0) + (input.saturdayPayment || 0) + (input.holidayPayment || 0) + (input.otherPayment || 0)
  const paymentStatus = input.totalPaid <= 0 ? 'unpaid' : input.totalPaid >= totalDue ? 'paid' : 'partiallyPaid'

  if (snap.exists()) {
    const before = snap.data() as Record<string, unknown>
    if (before.signatureStatus === 'signed') throw new Error('payment-already-signed')
    const nextVersion = (Number(before.version) || 1) + 1
    const after = withoutUndefined({
      ...input,
      totalDue,
      paymentStatus,
      signatureStatus: 'pendingSignature',
      version: nextVersion,
      updatedAt: isoNow(),
      updatedBy: performedBy,
    })
    await updateDoc(ref, after)
    await addPaymentAudit(input.caregiverId, id, 'updated', performedBy, performedByName, before, after)
    return id
  }

  const record = withoutUndefined({
    ...input,
    totalDue,
    paymentStatus,
    signatureStatus: 'pendingSignature',
    version: 1,
    deleted: false,
    createdAt: isoNow(),
    createdBy: performedBy,
    updatedAt: isoNow(),
    updatedBy: performedBy,
  })
  await setDoc(ref, record)
  await addPaymentAudit(input.caregiverId, id, 'created', performedBy, performedByName, undefined, record as Record<string, unknown>)
  return id
}

// Caregiver signature. Transaction validates version to avoid signing stale data; only signature fields change.
export async function signPayment(
  employeeId: string,
  paymentId: string,
  signatureData: string,
  signedBy: string,
  signedByName: string,
  expectedVersion: number,
): Promise<void> {
  const ref = doc(paymentCollection(employeeId), paymentId)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('payment-not-found')
    const data = snap.data()
    if (data.signatureStatus === 'signed') throw new Error('payment-already-signed')
    if (Number(data.version) !== expectedVersion) throw new Error('payment-version-changed')
    tx.update(ref, {
      signatureStatus: 'signed',
      signedAt: isoNow(),
      signedBy,
      signedByName,
      signatureData,
      signedVersion: expectedVersion,
      updatedAt: isoNow(),
    })
    const auditRef = doc(paymentAuditCollection(employeeId, paymentId))
    tx.set(auditRef, {
      paymentId,
      caregiverId: employeeId,
      action: 'payment_signed',
      performedBy: signedBy,
      performedByName: signedByName,
      timestamp: isoNow(),
      serverTime: serverTimestamp(),
      before: null,
      after: { signatureStatus: 'signed', signedVersion: expectedVersion },
      changedFields: ['signatureStatus'],
    })
  })
}

export async function softDeletePayment(employeeId: string, paymentId: string, performedBy: string, performedByName: string) {
  const ref = doc(paymentCollection(employeeId), paymentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('payment-not-found')
  const before = snap.data() as Record<string, unknown>
  await updateDoc(ref, { deleted: true, deletedAt: isoNow(), deletedBy: performedBy, updatedAt: isoNow(), updatedBy: performedBy })
  await addPaymentAudit(employeeId, paymentId, 'deleted', performedBy, performedByName, before, { ...before, deleted: true })
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
