import { writeBatch, doc } from 'firebase/firestore'
import { db } from './config'
import { isoNow } from '@/utils/dates'
import { SEED_2026 } from '@/data/seed2026'

interface SeedContext {
  userId: string
  employerId?: string
  employeeId?: string
}

export async function seedInitial2026Data(context: SeedContext) {
  const now = isoNow()
  const employerId = context.employerId ?? 'demo-employer-2026'
  const employeeId = context.employeeId ?? 'demo-employee-2026'

  const batch = writeBatch(db)

  // User profile defaults to employer role for seed usage
  batch.set(doc(db, 'users', context.userId), {
    displayName: 'Demo Workspace',
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

  // Monthly payments full year
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

  // Pension payments full year
  for (const p of SEED_2026.pensionPayments) {
    batch.set(doc(db, 'employees', employeeId, 'years', String(SEED_2026.year), 'pensionPayments', String(p.month)), {
      ...p,
      year: SEED_2026.year,
      paymentDate: null,
      paymentProvider: 'Demo Pension Fund',
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
    after: { seeded: true, source: 'full-demo-2026' },
    userId: context.userId,
    createdAt: now,
  })

  await batch.commit()

  return { employerId, employeeId, year: SEED_2026.year }
}
