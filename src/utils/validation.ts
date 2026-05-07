import { z } from 'zod'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

export const paymentSchema = z.object({
  baseSalary: z.number().min(0, 'validation.positiveNumber'),
  pocketMoney: z.number().min(0, 'validation.positiveNumber'),
  shabbatAmount: z.number().min(0, 'validation.positiveNumber'),
  vacationAmount: z.number().min(0, 'validation.positiveNumber'),
  holidayAmount: z.number().min(0, 'validation.positiveNumber'),
  cashPaid: z.number().min(0, 'validation.positiveNumber'),
  payslipPaid: z.number().min(0, 'validation.positiveNumber'),
  bankTransferPaid: z.number().min(0, 'validation.positiveNumber'),
  hasPayslip: z.boolean(),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
})

export const pensionPaymentSchema = z.object({
  baseSalary: z.number().min(0, 'validation.positiveNumber'),
  amountPaid: z.number().min(0, 'validation.positiveNumber'),
  paymentDate: z.string().optional(),
  paymentProvider: z.string().optional(),
  notes: z.string().optional(),
})

export const employeeSchema = z.object({
  fullName: z.string().min(1, 'validation.required'),
  startDate: z.string().min(1, 'validation.required'),
  baseSalary: z.number().positive('validation.positiveNumber'),
  pocketMoney: z.number().min(0, 'validation.positiveNumber'),
  shabbatRate: z.number().min(0, 'validation.positiveNumber'),
  vacationDayRate: z.number().min(0, 'validation.positiveNumber'),
  holidayRate: z.number().min(0, 'validation.positiveNumber'),
  partialDayRate: z.number().min(0, 'validation.positiveNumber'),
  pensionRate: z.number().min(0).max(100),
  notes: z.string().optional(),
})

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'validation.maxFileSize'
  if (!ALLOWED_TYPES.includes(file.type)) return 'validation.allowedFileTypes'
  return null
}
