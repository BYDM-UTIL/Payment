import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { usePayments } from '@/hooks/usePayments'
import { MonthCard } from './MonthCard'
import { PaymentModal } from './PaymentModal'
import { SignatureModal } from './SignatureModal'
import { uploadSignature, uploadFile } from '@/services/firebase/storage.service'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/utils/calculations'
import { KpiCard } from '@/components/KpiCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// Default settings (ideally from Firestore year settings)
const DEFAULT_SETTINGS = {
  baseSalary: 6400,
  pocketMoney: 400,
  shabbatRate: 426,
}

export function PaymentsPage() {
  const { t } = useTranslation()
  const { currentEmployeeId, currentYear, setCurrentYear } = useAppStore()
  const { loading, save, sign, addAttachment, getPaymentByMonth, summary } =
    usePayments(currentEmployeeId, currentYear)

  const [editMonth, setEditMonth] = useState<number | null>(null)
  const [signMonth, setSignMonth] = useState<number | null>(null)
  const [viewSigMonth, setViewSigMonth] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachMonth, setAttachMonth] = useState<number | null>(null)

  const editPayment = editMonth ? getPaymentByMonth(editMonth) : null
  const viewSigPayment = viewSigMonth ? getPaymentByMonth(viewSigMonth) : null

  async function handleSavePayment(data: Parameters<typeof save>[1]) {
    if (!editMonth) return
    await save(editMonth, data)
  }

  async function handleSignSave(dataUrl: string) {
    if (!signMonth || !currentEmployeeId) return
    const url = await uploadSignature(currentEmployeeId, currentYear, signMonth, dataUrl)
    await sign(signMonth, url, 'Employee')
    setSignMonth(null)
  }

  function handleAttachClick(month: number) {
    setAttachMonth(month)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !attachMonth || !currentEmployeeId) return
    const attachment = await uploadFile(
      `attachments/${currentEmployeeId}/${currentYear}/${attachMonth}`,
      file,
      currentEmployeeId
    )
    await addAttachment(attachMonth, attachment)
    e.target.value = ''
    setAttachMonth(null)
  }

  if (!currentEmployeeId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg">{t('employees.noEmployees')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-4">
      {/* Header with year navigator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('payments.title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentYear(currentYear - 1)} className="btn-secondary !px-2 !py-2">
            <ChevronRight size={18} />
          </button>
          <span className="font-semibold text-gray-800 w-16 text-center">{currentYear}</span>
          <button onClick={() => setCurrentYear(currentYear + 1)} className="btn-secondary !px-2 !py-2">
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Annual summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label={t('dashboard.annualGross')} value={summary.annualGrossTotal} color="blue" isCurrency />
        <KpiCard label={t('dashboard.annualPaid')} value={summary.annualTotalPaid} color="green" isCurrency />
        <KpiCard label={t('dashboard.annualBalance')} value={summary.annualBalanceDue} color={summary.annualBalanceDue > 0 ? 'red' : 'green'} isCurrency />
        <KpiCard label={t('dashboard.monthsPaid')} value={`${summary.monthsPaid}/12`} color="gray" />
      </div>

      {/* Desktop table */}
      <div className="desktop-table card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500 text-xs">
              {[
                t('payments.month'),
                t('payments.baseSalary'),
                t('payments.pocketMoney'),
                t('payments.shabbat'),
                t('payments.vacation'),
                t('payments.holiday'),
                t('payments.grossTotal'),
                t('payments.cash'),
                t('payments.payslip'),
                t('payments.bankTransfer'),
                t('payments.totalPaid'),
                t('payments.balance'),
                t('payments.status'),
                t('payments.signature'),
                '',
              ].map((h) => (
                <th key={h} className="text-start py-2 px-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month) => {
              const p = getPaymentByMonth(month)
              return (
                <tr key={month} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-2 font-medium">{t(`months.${month}`)}</td>
                  <td className="py-2 px-2">{p ? formatCurrency(p.baseSalary) : '—'}</td>
                  <td className="py-2 px-2">{p ? formatCurrency(p.pocketMoney) : '—'}</td>
                  <td className="py-2 px-2">{p ? formatCurrency(p.shabbatAmount) : '—'}</td>
                  <td className="py-2 px-2">{p ? formatCurrency(p.vacationAmount) : '—'}</td>
                  <td className="py-2 px-2">{p ? formatCurrency(p.holidayAmount) : '—'}</td>
                  <td className="py-2 px-2 font-semibold">{p ? formatCurrency(p.grossTotal) : '—'}</td>
                  <td className="py-2 px-2">{p ? formatCurrency(p.cashPaid) : '—'}</td>
                  <td className="py-2 px-2">
                    {p ? (
                      <span>
                        {formatCurrency(p.payslipPaid)}
                        {!p.hasPayslip && <span className="text-warning-500 ms-1 text-xs">✗</span>}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2">{p ? formatCurrency(p.bankTransferPaid) : '—'}</td>
                  <td className="py-2 px-2 text-green-700 font-medium">{p ? formatCurrency(p.totalPaid) : '—'}</td>
                  <td className="py-2 px-2 font-medium" style={{ color: p?.balanceDue ? '#dc2626' : '#16a34a' }}>
                    {p ? formatCurrency(p.balanceDue) : '—'}
                  </td>
                  <td className="py-2 px-2">
                    <StatusBadge status={p?.paymentStatus ?? 'empty'} size="sm" />
                  </td>
                  <td className="py-2 px-2">
                    {p?.employeeSignatureUrl ? (
                      <button onClick={() => setViewSigMonth(month)} className="text-xs text-green-600 underline">✓</button>
                    ) : p?.grossTotal ? (
                      <button onClick={() => setSignMonth(month)} className="text-xs text-primary-600 underline">{t('payments.signMonth')}</button>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2">
                    <button onClick={() => setEditMonth(month)} className="text-primary-600 hover:text-primary-800 text-xs underline">
                      {t('common.edit')}
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
          <div className="text-center text-gray-400 py-8">{t('common.loading')}</div>
        ) : (
          MONTHS.map((month) => (
            <MonthCard
              key={month}
              month={month}
              payment={getPaymentByMonth(month)}
              onEdit={() => setEditMonth(month)}
              onSign={() => setSignMonth(month)}
              onAttach={() => handleAttachClick(month)}
              onViewSignature={() => setViewSigMonth(month)}
            />
          ))
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Payment Modal */}
      {editMonth && (
        <PaymentModal
          open={!!editMonth}
          onClose={() => setEditMonth(null)}
          onSave={handleSavePayment}
          month={editMonth}
          year={currentYear}
          existing={editPayment}
          defaults={DEFAULT_SETTINGS}
        />
      )}

      {/* Signature Modal – sign */}
      {signMonth && (
        <SignatureModal
          open={!!signMonth}
          onClose={() => setSignMonth(null)}
          onSave={handleSignSave}
        />
      )}

      {/* Signature Modal – view */}
      {viewSigMonth && (
        <SignatureModal
          open={!!viewSigMonth}
          onClose={() => setViewSigMonth(null)}
          onSave={() => {}}
          existingUrl={viewSigPayment?.employeeSignatureUrl}
        />
      )}
    </div>
  )
}
