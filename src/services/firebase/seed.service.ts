import { writeBatch, doc } from 'firebase/firestore'
import { db } from './config'
import { isoNow } from '@/utils/dates'
import { SEED_2026 } from '@/data/seed2026'
import { calculatePensionRequired } from '@/utils/calculations'

interface SeedContext {
  userId: string
  employerId?: string
  employeeId?: string
}

export async function seedInitial2026Data(context: SeedContext) {
  const now = isoNow()
  const employerId = context.employerId ?? 'seed-employer-2026'
  const employeeId = context.employeeId ?? 'seed-employee-2026'

  const batch = writeBatch(db)

  // User profile defaults to employer role for seed usage
  batch.set(doc(db, 'users', context.userId), {
    displayName: 'Seed User',
    email: '',
    role: 'employer',
    createdAt: now,
    defaultLanguage: 'he',
  }, { merge: true })

  // Employer
  batch.set(doc(db, 'employers', employerId), {
    name: SEED_2026.employer.name,
    phone: '',
    email: '',
    address: '',
    createdBy: context.userId,
    createdAt: now,
  }, { merge: true })

  // Employee
  batch.set(doc(db, 'employees', employeeId), {
    employerId,
    ...SEED_2026.employee,
    createdAt: now,
    updatedAt: now,
  }, { merge: true })

  // Year settings
  batch.set(doc(db, 'employees', employeeId, 'years', String(SEED_2026.year)), {
    ...SEED_2026.yearSettings,
    createdAt: now,
    updatedAt: now,
  }, { merge: true })

  // Monthly payments Jan-Apr (provided)
  for (const p of SEED_2026.monthlyPayments) {
    batch.set(doc(db, 'employees', employeeId, 'years', String(SEED_2026.year), 'monthlyPayments', String(p.month)), {
      ...p,
      year: SEED_2026.year,
      paymentDate: null,
      notes: '',
      employeeSignatureUrl: null,
      signedAt: null,
      signedBy: null,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    }, { merge: true })
  }

  // Open months May-Dec
  for (let month = 5; month <= 12; month += 1) {
    batch.set(doc(db, 'employees', employeeId, 'years', String(SEED_2026.year), 'monthlyPayments', String(month)), {
      month,
      year: SEED_2026.year,
      baseSalary: 6400,
      pocketMoney: 400,
      shabbatAmount: 0,
      vacationAmount: 0,
      holidayAmount: 0,
      grossTotal: 0,
      cashPaid: 0,
      payslipPaid: 0,
      bankTransferPaid: 0,
      totalPaid: 0,
      balanceDue: 0,
      hasPayslip: false,
      paymentStatus: 'empty',
      paymentDate: null,
      notes: '',
      employeeSignatureUrl: null,
      signedAt: null,
      signedBy: null,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    }, { merge: true })
  }

  // Pension payments Jan-Jul (provided)
  for (const p of SEED_2026.pensionPayments) {
    batch.set(doc(db, 'employees', employeeId, 'years', String(SEED_2026.year), 'pensionPayments', String(p.month)), {
      ...p,
      year: SEED_2026.year,
      paymentDate: null,
      paymentProvider: 'מתן חן / external',
      notes: '',
      attachments: [],
      createdAt: now,
      updatedAt: now,
    }, { merge: true })
  }

  // Pension open months Aug-Dec
  for (let month = 8; month <= 12; month += 1) {
    const baseSalary = 6400
    const requiredPensionAmount = calculatePensionRequired(baseSalary, 12.5)
    batch.set(doc(db, 'employees', employeeId, 'years', String(SEED_2026.year), 'pensionPayments', String(month)), {
      month,
      year: SEED_2026.year,
      baseSalary,
      requiredPensionAmount,
      amountPaid: 0,
      balanceDue: requiredPensionAmount,
      paymentDate: null,
      paymentProvider: '',
      notes: '',
      attachments: [],
      createdAt: now,
      updatedAt: now,
    }, { merge: true })
  }

  // Seed audit event
  batch.set(doc(db, 'employees', employeeId, 'auditLog', `seed-${Date.now()}`), {
    action: 'create',
    entityType: 'settings',
    entityId: `year-${SEED_2026.year}`,
    before: null,
    after: { seeded: true, source: 'excel-values' },
    userId: context.userId,
    createdAt: now,
  })

  await batch.commit()

  return { employerId, employeeId, year: SEED_2026.year }
}
