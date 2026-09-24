import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, History, Pencil, Plus, RefreshCw, PenLine, CheckCircle2, Clock } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getActiveEmployees, getEmployee, getPaymentAudit, upsertMonthlyPayment, signPayment, getCurrentEmploymentTerms, paymentDocId } from '@/services/firebase/firestore.service'
import { usePaymentsRealtime } from '@/hooks/usePaymentsRealtime'
import { formatCurrency, paymentStateLabelKey } from '@/utils/calculations'
import { formatDateTime, formatIsraeliDate } from '@/utils/dates'
import { PaymentEditorModal, type PaymentEditorData } from './PaymentEditorModal'
import { ReviewSignModal } from './ReviewSignModal'
import type { Employee, EmploymentTerms, PaymentAuditEntry, PaymentRecord } from '@/types'

interface Props { mode?: 'employer' | 'employee' }

export function PaymentsPage({ mode = 'employer' }: Props) {
  const { t } = useTranslation()
  const { user, currentEmployeeId, setCurrentEmployeeId } = useAppStore()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [employeeLoading, setEmployeeLoading] = useState(true)
  const [terms, setTerms] = useState<EmploymentTerms | null>(null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [editorOpen, setEditorOpen] = useState(false)
  const [signTarget, setSignTarget] = useState<PaymentRecord | null>(null)
  const [history, setHistory] = useState<PaymentAuditEntry[] | null>(null)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const { payments, loading } = usePaymentsRealtime(employee?.id ?? null)
  const signedSnapshot = useRef<Record<string, string>>({})

  useEffect(() => {
    let active = true
    async function loadEmployee() {
      if (!user) return
      setEmployeeLoading(true)
      try {
        let selected: Employee | null = null
        if (mode === 'employee' && user.employeeId) {
          selected = await getEmployee(user.employeeId)
        } else {
          const list = await getActiveEmployees(user.uid)
          selected = list.find((item) => item.id === currentEmployeeId) ?? list[0] ?? null
        }
        if (!active) return
        setEmployee(selected)
        if (selected) {
          if (mode === 'employer') setCurrentEmployeeId(selected.id)
          getCurrentEmploymentTerms(selected.id).then(setTerms).catch(() => undefined)
        }
      } finally {
        if (active) setEmployeeLoading(false)
      }
    }
    loadEmployee().catch(() => active && setError(t('common.error')))
    return () => { active = false }
  }, [currentEmployeeId, mode, refreshKey, setCurrentEmployeeId, t, user])

  // Admin realtime toast when a caregiver signs.
  useEffect(() => {
    if (mode !== 'employer') return
    const previous = signedSnapshot.current
    const next: Record<string, string> = {}
    for (const payment of payments) {
      next[payment.id] = payment.signatureStatus
      if (previous[payment.id] && previous[payment.id] !== 'signed' && payment.signatureStatus === 'signed') {
        setToast(t('payment.toastSigned', { name: payment.signedByName ?? payment.caregiverName, month: t(`months.${payment.month}`), year: payment.year }))
        setTimeout(() => setToast(''), 6000)
      }
    }
    signedSnapshot.current = next
  }, [payments, mode, t])

  const monthPayment = useMemo(() => payments.find((p) => p.id === paymentDocId(year, month)) ?? null, [payments, month, year])
  const totalDue = monthPayment?.totalDue ?? terms?.monthlySalary ?? employee?.baseSalary ?? 0
  const totalPaid = monthPayment?.totalPaid ?? 0

  const pendingSignatures = useMemo(
    () => payments.filter((p) => p.paymentStatus === 'paid' && p.signatureStatus === 'pendingSignature'),
    [payments],
  )
  const signedPayments = useMemo(() => payments.filter((p) => p.signatureStatus === 'signed'), [payments])

  async function savePayment(data: PaymentEditorData) {
    if (!employee || !user) return
    await upsertMonthlyPayment(
      { ...data, caregiverId: employee.id, caregiverName: employee.fullName, employerId: employee.employerId, month, year },
      user.uid,
      user.displayName,
    )
  }

  async function handleSign(signatureData: string) {
    if (!employee || !user || !signTarget) return
    await signPayment(employee.id, signTarget.id, signatureData, user.uid, user.displayName, signTarget.version)
  }

  async function showHistory(payment: PaymentRecord) {
    if (!employee) return
    setHistory(await getPaymentAudit(employee.id, payment.id))
  }

  function shiftMonth(delta: number) {
    const next = month + delta
    if (next < 1) { setMonth(12); setYear(year - 1) }
    else if (next > 12) { setMonth(1); setYear(year + 1) }
    else setMonth(next)
  }

  if (employeeLoading) return <div className="card text-center py-12 text-gray-500">{t('common.loading')}</div>
  if (!employee) return <div className="card text-center py-12"><p className="text-gray-600">{t('payment.noActiveCaregiver')}</p><button className="btn-primary mt-4" onClick={() => window.location.assign('/employees')}>{t('payment.manageCaregivers')}</button></div>

  // ─── Caregiver view ─────────────────────────────────────────────────────────
  if (mode === 'employee') {
    return (
      <div className="flex flex-col gap-5 pb-24 sm:pb-4">
        {toast && <div className="rounded-xl bg-success-50 px-4 py-3 text-sm text-success-800">{toast}</div>}
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{t('payment.myPayments')}</h1><button className="btn-secondary !p-2" onClick={() => setRefreshKey((v) => v + 1)} aria-label={t('payment.refresh')}><RefreshCw size={18} /></button></div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t('payment.waitingForConfirmation')}</h2>
          {loading ? <p className="text-gray-500">{t('common.loading')}</p> : pendingSignatures.length === 0 ? (
            <div className="card text-center text-gray-500">{t('payment.noPendingConfirmation')}</div>
          ) : pendingSignatures.map((payment) => (
            <div key={payment.id} className="card border-s-4 border-warning-400 flex flex-col gap-3">
              <div className="flex justify-between"><strong>{t(`months.${payment.month}`)} {payment.year}</strong><span className="badge-pending inline-flex items-center rounded-full px-3 py-1 text-sm"><Clock size={14} className="me-1" />{t('payment.waitingForSignature')}</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {payment.monthlySalary > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('payment.monthlySalary')}</span><span>{formatCurrency(payment.monthlySalary)}</span></div>}
                {payment.saturdayPayment > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('payment.saturday')}</span><span>{formatCurrency(payment.saturdayPayment)}</span></div>}
                {payment.holidayPayment > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('payment.holiday')}</span><span>{formatCurrency(payment.holidayPayment)}</span></div>}
                {payment.otherPayment > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('payment.other')}</span><span>{formatCurrency(payment.otherPayment)}</span></div>}
              </div>
              <div className="flex justify-between font-bold border-t pt-2"><span>{t('payment.totalReceived')}</span><span>{formatCurrency(payment.totalPaid)}</span></div>
              <button className="btn-primary flex items-center justify-center gap-2" onClick={() => setSignTarget(payment)}><PenLine size={18} />{t('payment.reviewAndSign')}</button>
            </div>
          ))}
        </section>

        {terms && (
          <section className="card"><h2 className="font-bold mb-3">{t('payment.currentTerms')}</h2><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-gray-500">{t('payment.monthlySalary')}</p><strong>{formatCurrency(terms.monthlySalary)}</strong></div><div><p className="text-gray-500">{t('payment.employmentStart')}</p><strong>{formatIsraeliDate(terms.employmentStartDate)}</strong></div></div></section>
        )}

        <section className="card">
          <h2 className="font-bold mb-3">{t('payment.paymentHistory')}</h2>
          {signedPayments.length === 0 ? <p className="text-gray-500 text-sm">{t('payment.noSignedPayments')}</p> : signedPayments.map((payment) => (
            <button key={payment.id} className="w-full flex justify-between border-b py-3 last:border-0 text-start" onClick={() => setSignTarget(payment)}>
              <span>{t(`months.${payment.month}`)} {payment.year}<span className="block text-xs text-success-700">{t('payment.state.paidAndSigned')} · {payment.signedAt ? formatIsraeliDate(payment.signedAt) : ''}</span></span>
              <strong>{formatCurrency(payment.totalPaid)}</strong>
            </button>
          ))}
        </section>

        {signTarget && signTarget.signatureStatus !== 'signed' && (
          <ReviewSignModal open onClose={() => setSignTarget(null)} payment={signTarget} onSign={handleSign} />
        )}
        {signTarget && signTarget.signatureStatus === 'signed' && (
          <SignedView payment={signTarget} onClose={() => setSignTarget(null)} />
        )}
      </div>
    )
  }

  // ─── Admin view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-20 sm:pb-4">
      {toast && <div className="rounded-xl bg-success-50 px-4 py-3 text-sm text-success-800">{toast}</div>}
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm text-gray-500">{t('payment.tracking')}</p><h1 className="text-2xl font-bold text-gray-900">{`${t('payment.tracking')} – ${employee.fullName}`}</h1></div>
        <div className="flex gap-2"><button className="btn-secondary !p-2" onClick={() => setRefreshKey((v) => v + 1)} aria-label={t('payment.refresh')}><RefreshCw size={18} /></button><button className="btn-primary flex items-center gap-2" onClick={() => setEditorOpen(true)}><Plus size={18} />{monthPayment ? t('payment.editPayment') : t('payment.addPayment')}</button></div>
      </div>

      <div className="card flex items-center justify-between gap-2"><button className="btn-secondary !px-3" onClick={() => shiftMonth(-1)}><ChevronRight size={18} /></button><div className="text-center"><p className="font-bold text-lg">{t(`months.${month}`)} {year}</p><p className="text-sm text-gray-500">{formatIsraeliDate(`${year}-${String(month).padStart(2, '0')}-01`)}</p></div><button className="btn-secondary !px-3" onClick={() => shiftMonth(1)}><ChevronLeft size={18} /></button></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card"><p className="text-xs text-gray-500">{t('payment.total')}</p><p className="mt-1 text-xl font-bold">{formatCurrency(totalDue)}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{t('payment.paid')}</p><p className="mt-1 text-xl font-bold text-success-700">{formatCurrency(totalPaid)}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{t('payment.remaining')}</p><p className="mt-1 text-xl font-bold">{formatCurrency(Math.max(0, totalDue - totalPaid))}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{t('payment.status')}</p><p className="mt-2 font-semibold text-sm">{monthPayment ? t(paymentStateLabelKey(monthPayment.paymentStatus, monthPayment.signatureStatus)) : t('payment.state.unpaid')}</p></div>
      </div>

      {monthPayment && (
        <div className="card flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {monthPayment.monthlySalary > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('payment.monthlySalary')}</span><span>{formatCurrency(monthPayment.monthlySalary)}</span></div>}
            {monthPayment.saturdayPayment > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('payment.saturday')}</span><span>{formatCurrency(monthPayment.saturdayPayment)}</span></div>}
            {monthPayment.holidayPayment > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('payment.holiday')}</span><span>{formatCurrency(monthPayment.holidayPayment)}</span></div>}
            {monthPayment.otherPayment > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('payment.other')}</span><span>{formatCurrency(monthPayment.otherPayment)}</span></div>}
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            {monthPayment.signatureStatus === 'signed' ? (
              <span className="inline-flex items-center gap-2 text-success-700 text-sm"><CheckCircle2 size={16} />{t('payment.signedBy', { name: monthPayment.signedByName ?? monthPayment.caregiverName })} · {monthPayment.signedAt ? formatDateTime(monthPayment.signedAt) : ''}</span>
            ) : (
              <span className="inline-flex items-center gap-2 text-warning-600 text-sm"><Clock size={16} />{t('payment.waitingForCaregiverSignature')}</span>
            )}
            <div className="flex gap-1">
              <button className="btn-secondary !p-2" onClick={() => setEditorOpen(true)} disabled={monthPayment.signatureStatus === 'signed'}><Pencil size={16} /></button>
              <button className="btn-secondary !p-2" onClick={() => showHistory(monthPayment)}><History size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</p>}

      {editorOpen && (
        <PaymentEditorModal open onClose={() => setEditorOpen(false)} onSave={savePayment} existing={monthPayment} year={year} month={month} defaultSalary={terms?.monthlySalary ?? employee.baseSalary} />
      )}

      {history && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setHistory(null)}>
          <div className="card w-full max-w-lg max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between"><h2 className="text-lg font-bold">{t('payment.history')}</h2><button onClick={() => setHistory(null)}>×</button></div>
            {history.length === 0 ? <p className="text-gray-500 text-sm mt-3">{t('payment.noHistory')}</p> : history.map((entry) => (
              <div key={entry.id} className="border-s-2 border-primary-300 ps-3 py-3 mt-3"><p className="font-semibold">{t(`payment.audit.${entry.action}`)}</p><p className="text-xs text-gray-500">{formatDateTime(entry.timestamp)} · {entry.performedByName}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SignedView({ payment, onClose }: { payment: PaymentRecord; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3"><h2 className="text-lg font-bold">{t(`months.${payment.month}`)} {payment.year}</h2><button onClick={onClose}>×</button></div>
        <div className="flex justify-between font-bold"><span>{t('payment.totalReceived')}</span><span>{formatCurrency(payment.totalPaid)}</span></div>
        <p className="text-sm text-success-700 mt-2">{t('payment.state.paidAndSigned')} · {payment.signedAt ? formatIsraeliDate(payment.signedAt) : ''}</p>
        {payment.signatureData && <img src={payment.signatureData} alt="signature" className="border rounded-xl mt-3 max-w-full" />}
        <button className="btn-secondary w-full mt-4" onClick={onClose}>{t('common.close')}</button>
      </div>
    </div>
  )
}
