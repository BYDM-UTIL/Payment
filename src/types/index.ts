// ─── Users & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'employer' | 'employee'

export interface AppUser {
  uid: string
  displayName: string
  email: string
  role: UserRole
  employeeId?: string
  employeeProfileCompleted: boolean
  createdAt: string
  defaultLanguage: 'he' | 'ru' | 'en'
}

// ─── Employer ────────────────────────────────────────────────────────────────

export interface Employer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  createdBy: string
  createdAt: string
}

// ─── Employee ─────────────────────────────────────────────────────────────────

export interface Employee {
  id: string
  employerId: string
  userId?: string
  firstName?: string
  lastName?: string
  fullName: string
  passport?: string
  phone?: string
  address?: string
  startDate: string
  bankDetails?: string
  baseSalary: number
  pocketMoney: number
  shabbatRate: number
  vacationDayRate: number
  holidayRate: number
  partialDayRate: number
  pensionRate: number
  active: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Year Settings ────────────────────────────────────────────────────────────

export interface YearSettings {
  id: string
  year: number
  baseSalary: number
  pocketMoney: number
  shabbatRate: number
  vacationDayRate: number
  holidayRate: number
  partialDayRate: number
  pensionRate: number
  recuperationDayRate: number
  recuperationDays: number
  createdAt: string
  updatedAt: string
}

// ─── Payment Status ───────────────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'partial' | 'pending' | 'empty'

// ─── Monthly Payment ──────────────────────────────────────────────────────────

export interface MonthlyPayment {
  id: string
  month: number
  year: number
  baseSalary: number
  pocketMoney: number
  shabbatAmount: number
  vacationAmount: number
  holidayAmount: number
  grossTotal: number
  cashPaid: number
  payslipPaid: number
  bankTransferPaid: number
  totalPaid: number
  balanceDue: number
  hasPayslip: boolean
  paymentStatus: PaymentStatus
  paymentDate?: string
  notes?: string
  signed?: boolean
  employeeSignatureUrl?: string
  signedAt?: string
  signedBy?: string
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

// ─── Pension Payment ──────────────────────────────────────────────────────────

export interface PensionPayment {
  id: string
  month: number
  year: number
  baseSalary: number
  requiredPensionAmount: number
  amountPaid: number
  balanceDue: number
  paymentDate?: string
  paymentProvider?: string
  notes?: string
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditAction = 'create' | 'update' | 'delete' | 'sign'
export type AuditEntityType = 'payment' | 'pension' | 'employee' | 'settings'

export interface AuditLog {
  id: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  userId: string
  createdAt: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  annualGrossTotal: number
  annualTotalPaid: number
  annualBalanceDue: number
  pensionBalanceDue: number
  monthsPaid: number
  monthsWithDebt: number
  missingSignatures: number
  missingAttachments: number
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportType =
  | 'monthly'
  | 'annual'
  | 'excel'
  | 'signed'
  | 'pension'
  | 'balances'
  | 'termination'

// ─── Form Inputs ──────────────────────────────────────────────────────────────

export interface MonthlyPaymentInput {
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

export interface PensionPaymentInput {
  baseSalary: number
  amountPaid: number
  paymentDate?: string
  paymentProvider?: string
  notes?: string
}

export interface EmployeeInput {
  fullName: string
  startDate: string
  baseSalary: number
  pocketMoney: number
  shabbatRate: number
  vacationDayRate: number
  holidayRate: number
  partialDayRate: number
  pensionRate: number
  notes?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export type Language = 'he' | 'ru' | 'en'

export interface SelectOption<T = string> {
  value: T
  label: string
}
