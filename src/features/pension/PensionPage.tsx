import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppStore } from '@/store/useAppStore'
import { usePension } from '@/hooks/usePension'
import { Modal } from '@/components/Modal'
import { FormField, Input, Textarea } from '@/components/FormField'
import { KpiCard } from '@/components/KpiCard'
import { pensionPaymentSchema } from '@/utils/validation'
import { formatCurrency, calculatePensionRequired } from '@/utils/calculations'
import { calculateRecuperationPay } from '@/utils/calculations'
import type { z } from 'zod'
import { Pencil, ChevronLeft, ChevronRight } from 'lucide-react'

type PensionFormData = z.infer<typeof pensionPaymentSchema>

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const PENSION_RATE = 12.5
const RECUPERATION_RATE = 378
const RECUPERATION_DAYS = 6

export function PensionPage() {
  const { t } = useTranslation()
  const { currentEmployeeId, currentYear, setCurrentYear } = useAppStore()
  const { loading, save, getByMonth, summary } = usePension(
    currentEmployeeId,
    currentYear,
    PENSION_RATE
  )

  const [editMonth, setEditMonth] = useState<number | null>(null)
  const editPayment = editMonth ? getByMonth(editMonth) : null

  const recuperationTotal = calculateRecuperationPay(RECUPERATION_DAYS, RECUPERATION_RATE)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<PensionFormData>({
      resolver: zodResolver(pensionPaymentSchema),
      defaultValues: { baseSalary: 6400, amountPaid: 0 },
    })

  function openEdit(month: number) {
    const p = getByMonth(month)
    reset({
      baseSalary: p?.baseSalary ?? 6400,
      amountPaid: p?.amountPaid ?? 0,
      paymentDate: p?.paymentDate ?? '',
      paymentProvider: p?.paymentProvider ?? '',
      notes: p?.notes ?? '',
    })
    setEditMonth(month)
  }

  async function onSubmit(data: PensionFormData) {
    if (!editMonth) return
    await save(editMonth, data)
    setEditMonth(null)
  }

  if (!currentEmployeeId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p>{t('employees.noEmployees')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('pension.title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentYear(currentYear - 1)} className="btn-secondary !px-2 !py-2">
            <ChevronRight size={18} />
          </button>
          <span className="font-semibold w-16 text-center">{currentYear}</span>
          <button onClick={() => setCurrentYear(currentYear + 1)} className="btn-secondary !px-2 !py-2">
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Annual Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label={t('pension.totalRequired')} value={summary.totalRequired} color="blue" isCurrency />
        <KpiCard label={t('pension.totalPaid')} value={summary.totalPaid} color="green" isCurrency />
        <KpiCard label={t('pension.totalBalance')} value={summary.totalBalance} color={summary.totalBalance > 0 ? 'red' : 'green'} isCurrency />
      </div>

      {/* Recuperation note */}
      <div className="card bg-amber-50 border-amber-200 border">
        <p className="font-semibold text-amber-800 mb-1">{t('pension.recuperationNote')}</p>
        <p className="text-sm text-amber-700">
          {t('pension.recuperationFormula', {
            days: RECUPERATION_DAYS,
            rate: RECUPERATION_RATE,
            total: recuperationTotal,
          })}
        </p>
      </div>

      {/* Desktop table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500 text-xs">
              {[
                t('pension.month'),
                t('pension.baseSalary'),
                t('pension.required'),
                t('pension.paid'),
                t('pension.balance'),
                t('pension.paymentDate'),
                t('pension.provider'),
                '',
              ].map((h) => (
                <th key={h} className="text-start py-2 px-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month) => {
              const p = getByMonth(month)
              const required = p
                ? p.requiredPensionAmount
                : calculatePensionRequired(6400, PENSION_RATE)
              return (
                <tr key={month} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-2 font-medium">{t(`months.${month}`)}</td>
                  <td className="py-2 px-2">{formatCurrency(p?.baseSalary ?? 6400)}</td>
                  <td className="py-2 px-2 font-medium text-blue-700">{formatCurrency(required)}</td>
                  <td className="py-2 px-2 text-green-700">{formatCurrency(p?.amountPaid ?? 0)}</td>
                  <td className="py-2 px-2 font-semibold" style={{ color: (p?.balanceDue ?? required) > 0 ? '#dc2626' : '#16a34a' }}>
                    {formatCurrency(p?.balanceDue ?? required)}
                  </td>
                  <td className="py-2 px-2 text-gray-500">{p?.paymentDate ?? '—'}</td>
                  <td className="py-2 px-2 text-gray-500">{p?.paymentProvider ?? '—'}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => openEdit(month)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-cards flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-gray-400 py-8">{t('common.loading')}</p>
        ) : (
          MONTHS.map((month) => {
            const p = getByMonth(month)
            const required = p ? p.requiredPensionAmount : calculatePensionRequired(6400, PENSION_RATE)
            const balance = p ? p.balanceDue : required
            return (
              <div key={month} className="card flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-800">{t(`months.${month}`)}</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-blue-700">{t('pension.required')}: {formatCurrency(required)}</span>
                    <span className="text-green-700">{t('pension.paid')}: {formatCurrency(p?.amountPaid ?? 0)}</span>
                    <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>{t('pension.balance')}: {formatCurrency(balance)}</span>
                  </div>
                </div>
                <button onClick={() => openEdit(month)} className="btn-secondary !px-3 !py-2 text-xs">
                  {t('common.edit')}
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Termination Summary */}
      <div className="card border-2 border-primary-200">
        <h2 className="font-bold text-primary-800 mb-3">{t('pension.terminationSummary')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">{t('pension.totalRequired')}</p>
            <p className="font-semibold text-gray-800">{formatCurrency(summary.totalRequired)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t('pension.totalPaid')}</p>
            <p className="font-semibold text-green-700">{formatCurrency(summary.totalPaid)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t('pension.totalBalance')}</p>
            <p className="font-semibold text-red-600">{formatCurrency(summary.totalBalance)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t('pension.recuperationNote')}</p>
            <p className="font-semibold text-amber-700">{formatCurrency(recuperationTotal)}</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editMonth && (
        <Modal
          open={!!editMonth}
          onClose={() => setEditMonth(null)}
          title={`${t('pension.editPayment')} – ${t(`months.${editMonth}`)} ${currentYear}`}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label={t('pension.baseSalary')} error={errors.baseSalary?.message}>
              <Input type="number" {...register('baseSalary', { valueAsNumber: true })} error={!!errors.baseSalary} />
            </FormField>
            <div className="bg-blue-50 rounded-xl px-3 py-2 text-sm text-blue-800">
              {t('pension.required')}: {formatCurrency(calculatePensionRequired(
                Number(editPayment?.baseSalary ?? 6400),
                PENSION_RATE
              ))}
            </div>
            <FormField label={t('pension.paid')} error={errors.amountPaid?.message}>
              <Input type="number" {...register('amountPaid', { valueAsNumber: true })} error={!!errors.amountPaid} />
            </FormField>
            <FormField label={t('pension.paymentDate')}>
              <Input type="date" {...register('paymentDate')} />
            </FormField>
            <FormField label={t('pension.provider')}>
              <Input type="text" {...register('paymentProvider')} />
            </FormField>
            <FormField label={t('pension.notes')}>
              <Textarea {...register('notes')} />
            </FormField>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setEditMonth(null)}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
