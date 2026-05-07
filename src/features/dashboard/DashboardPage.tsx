import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { usePayments } from '@/hooks/usePayments'
import { usePension } from '@/hooks/usePension'
import { KpiCard } from '@/components/KpiCard'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/utils/calculations'
import { currentMonth } from '@/utils/dates'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Plus, Bell, AlertCircle } from 'lucide-react'

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentEmployeeId, currentYear } = useAppStore()
  const { payments, summary } = usePayments(currentEmployeeId, currentYear)
  const { summary: pensionSummary } = usePension(currentEmployeeId, currentYear)

  const thisMonth = currentMonth()

  // Build chart data for all 12 months
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const p = payments.find((pay) => pay.month === m)
    return {
      name: t(`months.${m}`).slice(0, 3),
      gross: p?.grossTotal ?? 0,
      paid: p?.totalPaid ?? 0,
      balance: p?.balanceDue ?? 0,
    }
  })

  const reminders: string[] = []
  payments.forEach((p) => {
    if (p.paymentStatus === 'pending' || p.paymentStatus === 'partial') {
      reminders.push(t('dashboard.reminderUnpaidMonth', { month: t(`months.${p.month}`) }))
    }
    if (p.grossTotal > 0 && !p.employeeSignatureUrl) {
      reminders.push(t('dashboard.reminderMissingSignature', { month: t(`months.${p.month}`) }))
    }
  })

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('dashboard.year')}: {currentYear}</p>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('dashboard.quickAdd')}</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label={t('dashboard.annualGross')}
          value={summary.annualGrossTotal}
          color="blue"
          isCurrency
        />
        <KpiCard
          label={t('dashboard.annualPaid')}
          value={summary.annualTotalPaid}
          color="green"
          isCurrency
        />
        <KpiCard
          label={t('dashboard.annualBalance')}
          value={summary.annualBalanceDue}
          color={summary.annualBalanceDue > 0 ? 'red' : 'green'}
          isCurrency
        />
        <KpiCard
          label={t('dashboard.pensionBalance')}
          value={pensionSummary.totalBalance}
          color={pensionSummary.totalBalance > 0 ? 'orange' : 'green'}
          isCurrency
        />
        <KpiCard label={t('dashboard.monthsPaid')} value={summary.monthsPaid} color="green" />
        <KpiCard label={t('dashboard.monthsDebt')} value={summary.monthsWithDebt} color={summary.monthsWithDebt > 0 ? 'red' : 'gray'} />
        <KpiCard label={t('dashboard.missingSignatures')} value={summary.missingSignatures} color={summary.missingSignatures > 0 ? 'orange' : 'gray'} />
        <KpiCard label={t('dashboard.missingAttachments')} value={0} color="gray" />
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{t('payments.yearlyOverview')}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="gross" name={t('payments.grossTotal')} fill="#c2410c" radius={[4,4,0,0]} />
            <Bar dataKey="paid" name={t('payments.totalPaid')} fill="#2563eb" radius={[4,4,0,0]} />
            <Bar dataKey="balance" name={t('payments.balance')} fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Current month summary */}
      {payments.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">{t('dashboard.currentMonth')}</h2>
          {(() => {
            const current = payments.find((p) => p.month === thisMonth)
            if (!current) {
              return (
                <div className="text-gray-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {t('payments.noData')}
                </div>
              )
            }
            return (
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <p className="text-xs text-gray-500">{t('payments.grossTotal')}</p>
                  <p className="font-semibold text-gray-800">{formatCurrency(current.grossTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('payments.totalPaid')}</p>
                  <p className="font-semibold text-green-700">{formatCurrency(current.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('payments.balance')}</p>
                  <p className="font-semibold text-red-600">{formatCurrency(current.balanceDue)}</p>
                </div>
                <StatusBadge status={current.paymentStatus} />
              </div>
            )
          })()}
        </div>
      )}

      {/* Reminders */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Bell size={18} />
          {t('dashboard.reminders')}
        </h2>
        {reminders.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('dashboard.noReminders')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reminders.map((r, i) => (
              <li key={i} className="text-sm text-warning-700 bg-warning-50 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlertCircle size={14} />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
