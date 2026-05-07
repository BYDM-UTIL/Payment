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

export function calculatePaymentStatus(
  grossTotal: number,
  totalPaid: number,
  hasData: boolean
): PaymentStatus {
  if (!hasData || grossTotal === 0) return 'empty'
  const balance = grossTotal - totalPaid
  if (balance <= 0) return 'paid'
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
    monthsPaid: payments.filter((p) => p.paymentStatus === 'paid').length,
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
