import type { PaymentStatus } from '@/types'

export interface SeedMonthlyPayment {
  month: number
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
}

export interface SeedPensionPayment {
  month: number
  baseSalary: number
  requiredPensionAmount: number
  amountPaid: number
  balanceDue: number
}

export const SEED_2026 = {
  year: 2026,
  employer: {
    name: 'דותן זיוה / Dotan Ziva',
  },
  employee: {
    fullName: 'KABULOVA MOKHCHEKHRA',
    startDate: '2026-01-05',
    baseSalary: 6400,
    pocketMoney: 400,
    shabbatRate: 426,
    vacationDayRate: 250,
    holidayRate: 426,
    partialDayRate: 256,
    pensionRate: 12.5,
    active: true,
    notes: 'Seeded from provided Excel values',
  },
  yearSettings: {
    year: 2026,
    baseSalary: 6400,
    pocketMoney: 400,
    shabbatRate: 426,
    vacationDayRate: 250,
    holidayRate: 426,
    partialDayRate: 256,
    pensionRate: 12.5,
    recuperationDayRate: 378,
    recuperationDays: 6,
  },
  monthlyPayments: [
    {
      month: 1,
      baseSalary: 5632,
      pocketMoney: 400,
      shabbatAmount: 1704,
      vacationAmount: 0,
      holidayAmount: 0,
      grossTotal: 7736,
      cashPaid: 320,
      payslipPaid: 2157,
      bankTransferPaid: 5259,
      totalPaid: 7736,
      balanceDue: 0,
      hasPayslip: true,
      paymentStatus: 'paid',
    },
    {
      month: 2,
      baseSalary: 6400,
      pocketMoney: 400,
      shabbatAmount: 1704,
      vacationAmount: 0,
      holidayAmount: 426,
      grossTotal: 8930,
      cashPaid: 2786,
      payslipPaid: 2157,
      bankTransferPaid: 3987,
      totalPaid: 8930,
      balanceDue: 0,
      hasPayslip: true,
      paymentStatus: 'paid',
    },
    {
      month: 3,
      baseSalary: 6400,
      pocketMoney: 400,
      shabbatAmount: 1704,
      vacationAmount: 0,
      holidayAmount: 426,
      grossTotal: 8930,
      cashPaid: 2050,
      payslipPaid: 3620,
      bankTransferPaid: 3260,
      totalPaid: 8930,
      balanceDue: 0,
      hasPayslip: true,
      paymentStatus: 'paid',
    },
    {
      month: 4,
      baseSalary: 6400,
      pocketMoney: 400,
      shabbatAmount: 1704,
      vacationAmount: 0,
      holidayAmount: 426,
      grossTotal: 8930,
      cashPaid: 200,
      payslipPaid: 0,
      bankTransferPaid: 8730,
      totalPaid: 8930,
      balanceDue: 0,
      hasPayslip: false,
      paymentStatus: 'paid',
    },
  ] as SeedMonthlyPayment[],
  pensionPayments: [
    { month: 1, baseSalary: 5632, requiredPensionAmount: 704, amountPaid: 305.2, balanceDue: 398.8 },
    { month: 2, baseSalary: 6400, requiredPensionAmount: 800, amountPaid: 305.2, balanceDue: 494.8 },
    { month: 3, baseSalary: 6400, requiredPensionAmount: 800, amountPaid: 512, balanceDue: 288 },
    { month: 4, baseSalary: 6400, requiredPensionAmount: 800, amountPaid: 0, balanceDue: 800 },
    { month: 5, baseSalary: 6400, requiredPensionAmount: 800, amountPaid: 0, balanceDue: 800 },
    { month: 6, baseSalary: 6400, requiredPensionAmount: 800, amountPaid: 0, balanceDue: 800 },
    { month: 7, baseSalary: 6400, requiredPensionAmount: 800, amountPaid: 0, balanceDue: 800 },
  ] as SeedPensionPayment[],
}
