import { useEffect, useRef, useState } from 'react'
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
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import type { MonthlyPayment } from '@/types'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// Default settings (ideally from Firestore year settings)
const DEFAULT_SETTINGS = {
  baseSalary: 6400,
  pocketMoney: 400,
  shabbatRate: 426,
}

interface PaymentsPageProps {
  mode?: 'employer' | 'employee'
}

function isPaymentSigned(payment: MonthlyPayment | null) {
  return payment?.signed === true || Boolean(payment?.employeeSignatureUrl)
}

export function PaymentsPage({ mode = 'employer' }: PaymentsPageProps) {
  const { t } = useTranslation()
  const { user, currentEmployeeId, currentYear, setCurrentYear } = useAppStore()
  const effectiveEmployeeId = mode === 'employee' ? user?.employeeId ?? null : currentEmployeeId
  const { loading, save, sign, addAttachment, getPaymentByMonth, summary } =
    usePayments(effectiveEmployeeId, currentYear)

  const [editMonth, setEditMonth] = useState<number | null>(null)
  const [viewMonth, setViewMonth] = useState<number | null>(null)
  const [signMonth, setSignMonth] = useState<number | null>(null)
  const [viewSigMonth, setViewSigMonth] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachMonth, setAttachMonth] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const editPayment = editMonth ? getPaymentByMonth(editMonth) : null
  const viewPayment = viewMonth ? getPaymentByMonth(viewMonth) : null
  const viewSigPayment = viewSigMonth ? getPaymentByMonth(viewSigMonth) : null
  const employeePayments = MONTHS.map((month) => getPaymentByMonth(month)).filter(
    (payment): payment is MonthlyPayment => Boolean(payment)
  )

  useEffect(() => {
    setSuccessMessage('')
    setErrorMessage('')
  }, [currentYear, effectiveEmployeeId])

  async function handleSavePayment(data: Parameters<typeof save>[1]) {
    if (!editMonth) return
    await save(editMonth, data)
  }

  async function handleSignSave(dataUrl: string) {
    if (!signMonth || !effectiveEmployeeId || !user) return

    try {
      setErrorMessage('')
      const payment = getPaymentByMonth(signMonth)
      if (isPaymentSigned(payment)) {
        setErrorMessage(t('payments.alreadySigned'))
        setSignMonth(null)
        return
      }

      const url = await uploadSignature(effectiveEmployeeId, currentYear, signMonth, dataUrl)
      await sign(signMonth, url, user.uid)
      setSuccessMessage(t('payments.signatureSaved'))
      setSignMonth(null)
    } catch (error) {
      console.error('Error saving signature:', error)
      setErrorMessage(t('common.error'))
    }
  }

  function handleAttachClick(month: number) {
    if (mode === 'employee') return
    setAttachMonth(month)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !attachMonth || !effectiveEmployeeId || mode === 'employee') return
    const attachment = await uploadFile(
      `attachments/${effectiveEmployeeId}/${currentYear}/${attachMonth}`,
      file,
      user?.uid ?? effectiveEmployeeId
    )
    await addAttachment(attachMonth, attachment)
    e.target.value = ''
    setAttachMonth(null)
  }

  if (!effectiveEmployeeId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg">{mode === 'employee' ? t('payments.noPaymentsToShow') : t('employees.noEmployees')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'employee' ? t('payments.myPaymentsTitle') : t('payments.title')}
        </h1>
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

      {successMessage && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {errorMessage}
        </div>
      )}

      {mode === 'employer' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label={t('dashboard.annualGross')} value={summary.annualGrossTotal} color="blue" isCurrency />
          <KpiCard label={t('dashboard.annualPaid')} value={summary.annualTotalPaid} color="green" isCurrency />
          <KpiCard label={t('dashboard.annualBalance')} value={summary.annualBalanceDue} color={summary.annualBalanceDue > 0 ? 'red' : 'green'} isCurrency />
          <KpiCard label={t('dashboard.monthsPaid')} value={`${summary.monthsPaid}/12`} color="gray" />
        </div>
      )}

      {mode === 'employer' ? (
        <>
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
                    t('payments.signatureStatus'),
                    '',
                  ].map((h) => (
                    <th key={h} className="text-start py-2 px-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((month) => {
                  const payment = getPaymentByMonth(month)
                  const signed = isPaymentSigned(payment)

                  return (
                    <tr key={month} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-2 font-medium">{t(`months.${month}`)}</td>
                      <td className="py-2 px-2">{payment ? formatCurrency(payment.baseSalary) : '—'}</td>
                      <td className="py-2 px-2">{payment ? formatCurrency(payment.pocketMoney) : '—'}</td>
                      <td className="py-2 px-2">{payment ? formatCurrency(payment.shabbatAmount) : '—'}</td>
                      <td className="py-2 px-2">{payment ? formatCurrency(payment.vacationAmount) : '—'}</td>
                      <td className="py-2 px-2">{payment ? formatCurrency(payment.holidayAmount) : '—'}</td>
                      <td className="py-2 px-2 font-semibold">{payment ? formatCurrency(payment.grossTotal) : '—'}</td>
                      <td className="py-2 px-2">{payment ? formatCurrency(payment.cashPaid) : '—'}</td>
                      <td className="py-2 px-2">
                        {payment ? (
                          <span>
                            {formatCurrency(payment.payslipPaid)}
                            {!payment.hasPayslip && <span className="text-warning-500 ms-1 text-xs">✗</span>}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-2">{payment ? formatCurrency(payment.bankTransferPaid) : '—'}</td>
                      <td className="py-2 px-2 text-green-700 font-medium">{payment ? formatCurrency(payment.totalPaid) : '—'}</td>
                      <td className="py-2 px-2 font-medium" style={{ color: payment?.balanceDue ? '#dc2626' : '#16a34a' }}>
                        {payment ? formatCurrency(payment.balanceDue) : '—'}
                      </td>
                      <td className="py-2 px-2">
                        <StatusBadge status={payment?.paymentStatus ?? 'empty'} size="sm" />
                      </td>
                      <td className="py-2 px-2">
                        {payment?.grossTotal ? (
                          <div className="flex flex-col gap-1 text-xs">
                            <span className={signed ? 'text-blue-700' : 'text-gray-500'}>
                              {signed ? t('payments.signedStatus') : t('payments.notSignedStatus')}
                            </span>
                            {signed ? (
                              <button onClick={() => setViewSigMonth(month)} className="text-blue-700 underline text-start">
                                {t('common.view')}
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
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
                  onAttach={() => handleAttachClick(month)}
                  onViewSignature={() => setViewSigMonth(month)}
                />
              ))
            )}
          </div>
        </>
      ) : loading ? (
        <div className="text-center text-gray-400 py-8">{t('common.loading')}</div>
      ) : employeePayments.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          {t('payments.noPaymentsToShow')}
        </div>
      ) : (
        <div className="grid gap-4">
          {employeePayments.map((payment) => {
            const signed = isPaymentSigned(payment)

            return (
              <div key={payment.id} className="card flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t(`months.${payment.month}`)}</h2>
                    <p className="text-sm text-gray-500">{payment.paymentDate || '—'}</p>
                  </div>
                  <div className="rounded-2xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800">
                    {formatCurrency(payment.totalPaid || payment.grossTotal)}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">{t('payments.month')}</p>
                    <p className="mt-1 font-medium text-gray-900">{t(`months.${payment.month}`)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">{t('payments.totalPaid')}</p>
                    <p className="mt-1 font-medium text-gray-900">{formatCurrency(payment.totalPaid || payment.grossTotal)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">{t('payments.paymentDate')}</p>
                    <p className="mt-1 font-medium text-gray-900">{payment.paymentDate || '—'}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">{t('payments.signatureStatus')}</p>
                    <p className={`mt-1 font-medium ${signed ? 'text-blue-700' : 'text-gray-700'}`}>
                      {signed ? t('payments.signedStatus') : t('payments.notSignedStatus')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMonth(payment.month)}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-800 hover:bg-primary-100"
                  >
                    <Eye size={16} />
                    {t('common.view')}
                  </button>
                  {!signed && (
                    <button
                      type="button"
                      onClick={() => setSignMonth(payment.month)}
                      className="btn-primary"
                    >
                      {t('payments.signMonth')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mode === 'employer' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

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

      {viewMonth && viewPayment && (
        <PaymentModal
          open={!!viewMonth}
          onClose={() => setViewMonth(null)}
          onSave={handleSavePayment}
          month={viewMonth}
          year={currentYear}
          existing={viewPayment}
          defaults={DEFAULT_SETTINGS}
          readOnly
        />
      )}

      {signMonth && (
        <SignatureModal
          open={!!signMonth}
          onClose={() => setSignMonth(null)}
          onSave={handleSignSave}
        />
      )}

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
