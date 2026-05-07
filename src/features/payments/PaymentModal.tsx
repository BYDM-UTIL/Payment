import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/Modal'
import { FormField, Input, Textarea } from '@/components/FormField'
import { paymentSchema } from '@/utils/validation'
import { calculateGrossTotal, calculateTotalPaid, calculateBalanceDue, formatCurrency } from '@/utils/calculations'
import type { MonthlyPayment } from '@/types'
import type { z } from 'zod'

type FormData = z.infer<typeof paymentSchema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
  month: number
  year: number
  existing?: MonthlyPayment | null
  defaults: { baseSalary: number; pocketMoney: number; shabbatRate: number }
  readOnly?: boolean
}

export function PaymentModal({ open, onClose, onSave, month, year, existing, defaults, readOnly = false }: Props) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      baseSalary: defaults.baseSalary,
      pocketMoney: defaults.pocketMoney,
      shabbatAmount: 0,
      vacationAmount: 0,
      holidayAmount: 0,
      cashPaid: 0,
      payslipPaid: 0,
      bankTransferPaid: 0,
      hasPayslip: true,
    },
  })

  // Populate existing data
  useEffect(() => {
    if (existing) {
      reset({
        baseSalary: existing.baseSalary,
        pocketMoney: existing.pocketMoney,
        shabbatAmount: existing.shabbatAmount,
        vacationAmount: existing.vacationAmount,
        holidayAmount: existing.holidayAmount,
        cashPaid: existing.cashPaid,
        payslipPaid: existing.payslipPaid,
        bankTransferPaid: existing.bankTransferPaid,
        hasPayslip: existing.hasPayslip,
        paymentDate: existing.paymentDate,
        notes: existing.notes,
      })
    } else {
      reset({
        baseSalary: defaults.baseSalary,
        pocketMoney: defaults.pocketMoney,
        shabbatAmount: 0,
        vacationAmount: 0,
        holidayAmount: 0,
        cashPaid: 0,
        payslipPaid: 0,
        bankTransferPaid: 0,
        hasPayslip: true,
      })
    }
  }, [existing, defaults, reset, open])

  const values = watch()
  const grossTotal = calculateGrossTotal({
    baseSalary: Number(values.baseSalary) || 0,
    pocketMoney: Number(values.pocketMoney) || 0,
    shabbatAmount: Number(values.shabbatAmount) || 0,
    vacationAmount: Number(values.vacationAmount) || 0,
    holidayAmount: Number(values.holidayAmount) || 0,
  })
  const totalPaid = calculateTotalPaid({
    cashPaid: Number(values.cashPaid) || 0,
    payslipPaid: Number(values.payslipPaid) || 0,
    bankTransferPaid: Number(values.bankTransferPaid) || 0,
  })
  const balance = calculateBalanceDue(grossTotal, totalPaid)
  const overpaid = totalPaid > grossTotal && grossTotal > 0

  async function onSubmit(data: FormData) {
    await onSave(data)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${readOnly ? t('common.view') : t('payments.editPayment')} – ${t(`months.${month}`)} ${year}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Income section */}
        <div className="bg-blue-50 rounded-2xl p-3">
          <p className="text-sm font-semibold text-blue-800 mb-3">{t('payments.grossTotal')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormField label={t('payments.baseSalary')} error={errors.baseSalary?.message}>
              <Input type="number" disabled={readOnly} {...register('baseSalary', { valueAsNumber: true })} error={!!errors.baseSalary} />
            </FormField>
            <FormField label={t('payments.pocketMoney')} error={errors.pocketMoney?.message}>
              <Input type="number" disabled={readOnly} {...register('pocketMoney', { valueAsNumber: true })} error={!!errors.pocketMoney} />
            </FormField>
            <FormField label={t('payments.shabbat')} error={errors.shabbatAmount?.message}>
              <Input type="number" disabled={readOnly} {...register('shabbatAmount', { valueAsNumber: true })} error={!!errors.shabbatAmount} />
            </FormField>
            <FormField label={t('payments.vacation')} error={errors.vacationAmount?.message}>
              <Input type="number" disabled={readOnly} {...register('vacationAmount', { valueAsNumber: true })} error={!!errors.vacationAmount} />
            </FormField>
            <FormField label={t('payments.holiday')} error={errors.holidayAmount?.message}>
              <Input type="number" disabled={readOnly} {...register('holidayAmount', { valueAsNumber: true })} error={!!errors.holidayAmount} />
            </FormField>
          </div>
          <div className="mt-2 text-sm font-semibold text-blue-800">
            {t('payments.grossTotal')}: {formatCurrency(grossTotal)}
          </div>
        </div>

        {/* Payment section */}
        <div className="bg-green-50 rounded-2xl p-3">
          <p className="text-sm font-semibold text-green-800 mb-3">{t('payments.totalPaid')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormField label={t('payments.cash')} error={errors.cashPaid?.message}>
              <Input type="number" disabled={readOnly} {...register('cashPaid', { valueAsNumber: true })} error={!!errors.cashPaid} />
            </FormField>
            <FormField label={t('payments.payslip')} error={errors.payslipPaid?.message}>
              <Input type="number" disabled={readOnly} {...register('payslipPaid', { valueAsNumber: true })} error={!!errors.payslipPaid} />
            </FormField>
            <FormField label={t('payments.bankTransfer')} error={errors.bankTransferPaid?.message}>
              <Input type="number" disabled={readOnly} {...register('bankTransferPaid', { valueAsNumber: true })} error={!!errors.bankTransferPaid} />
            </FormField>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold text-green-800">
            <span>{t('payments.totalPaid')}: {formatCurrency(totalPaid)}</span>
            <span className={balance > 0 ? 'text-red-600' : 'text-green-700'}>
              {t('payments.balance')}: {formatCurrency(balance)}
            </span>
          </div>
          {overpaid && (
            <p className="text-xs text-warning-600 mt-1">{t('common.overpaidWarning')}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('payments.paymentDate')}>
            <Input type="date" disabled={readOnly} {...register('paymentDate')} />
          </FormField>
          <FormField label="">
            <label className="flex items-center gap-2 cursor-pointer mt-5">
              <input type="checkbox" disabled={readOnly} {...register('hasPayslip')} className="w-4 h-4 rounded" />
              <span className="text-sm">{t('payments.hasPayslip')}</span>
            </label>
          </FormField>
        </div>

        <FormField label={t('payments.notes')}>
          <Textarea disabled={readOnly} {...register('notes')} />
        </FormField>

        {existing?.signedAt && (
          <div className="rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-sm text-gray-700">
            <p>{t('common.signedOn')}: {existing.signedAt}</p>
            {existing.signedBy && <p>{t('common.signedBy')}: {existing.signedBy}</p>}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            {readOnly ? t('common.close') : t('common.cancel')}
          </button>
          {!readOnly && (
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('payments.savePayment')}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
