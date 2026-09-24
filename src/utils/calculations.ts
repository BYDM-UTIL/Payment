import type { MonthlyPayment, PaymentStatus, PensionPayment } from '@/types'

// ─── Payment Calculations ─────────────────────────────────────────────────────

export interface GrossTotalInput {
  baseSalary: number
  pocketMoney: number
  shabbatAmount: number
  vacationAmount: number
  holidayAmount: number
}

export function calculateGrossTotal(input: GrossTotalInput): number {
  return (
    input.baseSalary +
    input.pocketMoney +
    input.shabbatAmount +
    input.vacationAmount +
    input.holidayAmount
  )
}

export interface TotalPaidInput {
  cashPaid: number
  payslipPaid: number
  bankTransferPaid: number
}

export function calculateTotalPaid(input: TotalPaidInput): number {
  return input.cashPaid + input.payslipPaid + input.bankTransferPaid
}

export function calculateBalanceDue(grossTotal: number, totalPaid: number): number {
  return Math.max(0, grossTotal - totalPaid)
}

// Amount paid beyond what was due; kept separate so overpayment is never silently erased.
export function calculateOverpaid(grossTotal: number, totalPaid: number): number {
  return Math.max(0, totalPaid - grossTotal)
}

export function calculatePaymentStatus(
  grossTotal: number,
  totalPaid: number,
  hasData: boolean
): PaymentStatus {
  if (!hasData || grossTotal === 0) return 'empty'
  const balance = grossTotal - totalPaid
  if (balance < 0) return 'overpaid'
  if (balance === 0) return 'paid'
  if (totalPaid > 0) return 'partial'
  return 'pending'
}

// ─── Pension Calculations ─────────────────────────────────────────────────────

export function calculatePensionRequired(baseSalary: number, pensionRate: number): number {
  return Number(((baseSalary * pensionRate) / 100).toFixed(2))
}

export function calculatePensionBalance(required: number, paid: number): number {
  return Math.max(0, required - paid)
}

// ─── Recuperation ─────────────────────────────────────────────────────────────

export function calculateRecuperationPay(days: number, rate: number): number {
  return days * rate
}

// ─── Annual Summary ───────────────────────────────────────────────────────────

export interface AnnualPaymentSummary {
  annualGrossTotal: number
  annualTotalPaid: number
  annualBalanceDue: number
  monthsPaid: number
  monthsWithDebt: number
  missingSignatures: number
}

export function calculateAnnualPaymentSummary(payments: MonthlyPayment[]): AnnualPaymentSummary {
  const filled = payments.filter((p) => p.grossTotal > 0)
  return {
    annualGrossTotal: filled.reduce((acc, p) => acc + p.grossTotal, 0),
    annualTotalPaid: filled.reduce((acc, p) => acc + p.totalPaid, 0),
    annualBalanceDue: filled.reduce((acc, p) => acc + p.balanceDue, 0),
    monthsPaid: payments.filter(
      (p) => p.paymentStatus === 'paid' || p.paymentStatus === 'overpaid'
    ).length,
    monthsWithDebt: payments.filter(
      (p) => p.paymentStatus === 'partial' || p.paymentStatus === 'pending'
    ).length,
    missingSignatures: filled.filter((p) => !p.employeeSignatureUrl).length,
  }
}

export interface AnnualPensionSummary {
  totalRequired: number
  totalPaid: number
  totalBalance: number
}

export function calculateAnnualPensionSummary(payments: PensionPayment[]): AnnualPensionSummary {
  return {
    totalRequired: payments.reduce((acc, p) => acc + p.requiredPensionAmount, 0),
    totalPaid: payments.reduce((acc, p) => acc + p.amountPaid, 0),
    totalBalance: payments.reduce((acc, p) => acc + p.balanceDue, 0),
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, locale = 'he-IL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('he-IL').format(amount)
}

// ─── Shared Payment Model ─────────────────────────────────────────────────────

export interface PaymentComponents {
  monthlySalary: number
  saturdayPayment: number
  holidayPayment: number
  otherPayment: number
}

export function calculatePaymentTotalDue(components: PaymentComponents): number {
  return (
    (components.monthlySalary || 0) +
    (components.saturdayPayment || 0) +
    (components.holidayPayment || 0) +
    (components.otherPayment || 0)
  )
}

export function calculateMoneyStatus(totalDue: number, totalPaid: number): 'paid' | 'partiallyPaid' | 'unpaid' {
  if (totalPaid <= 0) return 'unpaid'
  if (totalPaid >= totalDue) return 'paid'
  return 'partiallyPaid'
}

// Single source of truth for the combined payment + signature label key.
export function paymentStateLabelKey(paymentStatus: string, signatureStatus: string): string {
  if (paymentStatus === 'paid' && signatureStatus === 'signed') return 'payment.state.paidAndSigned'
  if (paymentStatus === 'paid' && signatureStatus === 'pendingSignature') return 'payment.state.paidWaitingSignature'
  if (paymentStatus === 'partiallyPaid') return 'payment.state.partiallyPaid'
  return 'payment.state.unpaid'
}

