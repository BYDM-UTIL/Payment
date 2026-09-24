import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, History, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getActiveEmployees, getEmployee, getPaymentAudit, getPaymentRecords, createPaymentRecord, updatePaymentRecord, softDeletePayment, getCurrentEmploymentTerms } from '@/services/firebase/firestore.service'
import { formatCurrency, calculatePaymentStatus } from '@/utils/calculations'
import { formatDateTime, formatIsraeliDate } from '@/utils/dates'
import { StatusBadge } from '@/components/StatusBadge'
import { PaymentMovementModal } from './PaymentMovementModal'
import type { Employee, EmploymentTerms, PaymentAuditEntry, PaymentRecord } from '@/types'

interface Props { mode?: 'employer' | 'employee' }
type MovementData = { paymentDate: string; amount: number; paymentMethod: 'cash' | 'bankTransfer'; bankReference?: string; category: PaymentRecord['category']; note?: string }

export function PaymentsPage({ mode = 'employer' }: Props) {
  const { t } = useTranslation()
  const { user, currentEmployeeId, setCurrentEmployeeId } = useAppStore()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [terms, setTerms] = useState<EmploymentTerms | null>(null)
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentRecord | null>(null)
  const [history, setHistory] = useState<PaymentAuditEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadEmployee() {
      if (!user) return
      const list = mode === 'employer' ? await getActiveEmployees(user.uid) : []
      const selected = mode === 'employee' && user.employeeId
        ? await getEmployee(user.employeeId)
        : list.find((item) => item.id === currentEmployeeId) ?? (list.length === 1 ? list[0] : null)
      if (selected && active) {
        setEmployee(selected)
        getCurrentEmploymentTerms(selected.id).then(setTerms).catch(() => undefined)
        if (mode === 'employer') setCurrentEmployeeId(selected.id)
      }
    }
    loadEmployee().catch(() => active && setError(t('common.error')))
    return () => { active = false }
  }, [currentEmployeeId, mode, setCurrentEmployeeId, t, user])

  useEffect(() => {
    if (!employee) return
    setLoading(true)
    getPaymentRecords(employee.id, year)
      .then(setRecords)
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false))
  }, [employee, t, year])

  const monthRecords = useMemo(() => records.filter((record) => record.month === month && !record.deleted), [month, records])
  const totalPaid = monthRecords.reduce((sum, record) => sum + record.amount, 0)
  const totalDue = terms?.monthlySalary ?? employee?.baseSalary ?? 0
  const status = calculatePaymentStatus(totalDue, totalPaid, totalDue > 0)

  async function saveMovement(data: MovementData) {
    if (!employee || !user) return
    if (editing) {
      await updatePaymentRecord(employee.id, editing.id, data, user.uid, user.displayName)
    } else {
      await createPaymentRecord({ ...data, caregiverId: employee.id, employerId: employee.employerId, month, year, createdBy: user.uid, updatedBy: user.uid }, user.displayName)
    }
    setRecords(await getPaymentRecords(employee.id, year))
  }

  async function showHistory(record: PaymentRecord) {
    if (!employee) return
    setHistory(await getPaymentAudit(employee.id, record.id))
    setHistoryOpen(true)
  }

  async function remove(record: PaymentRecord) {
    if (!employee || !user || !window.confirm(t('payments.confirmDelete'))) return
    await softDeletePayment(employee.id, record.id, user.uid, user.displayName)
    setRecords((current) => current.filter((item) => item.id !== record.id))
  }

  function shiftMonth(delta: number) {
    const next = month + delta
    if (next < 1) { setMonth(12); setYear(year - 1) }
    else if (next > 12) { setMonth(1); setYear(year + 1) }
    else setMonth(next)
  }

  if (!employee) return <div className="card text-center py-12"><p className="text-gray-600">{t('payments.noActiveCaregiver')}</p><button className="btn-primary mt-4" onClick={() => window.location.assign('/employees')}>{t('payments.manageCaregivers')}</button></div>

  return (
    <div className="flex flex-col gap-5 pb-20 sm:pb-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm text-gray-500">{mode === 'employee' ? t('payments.myPaymentsTitle') : t('payments.tracking')}</p><h1 className="text-2xl font-bold text-gray-900">{mode === 'employee' ? employee.fullName : `${t('payments.tracking')} – ${employee.fullName}`}</h1></div>
        {mode === 'employer' && <button className="btn-primary flex items-center gap-2" onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={18} />{t('payments.addPayment')}</button>}
      </div>
      <div className="card flex items-center justify-between gap-2"><button className="btn-secondary !px-3" onClick={() => shiftMonth(-1)}><ChevronRight size={18} /></button><div className="text-center"><p className="font-bold text-lg">{t(`months.${month}`)} {year}</p><p className="text-sm text-gray-500">{formatIsraeliDate(`${year}-${String(month).padStart(2, '0')}-01`)}</p></div><button className="btn-secondary !px-3" onClick={() => shiftMonth(1)}><ChevronLeft size={18} /></button></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="card"><p className="text-xs text-gray-500">{t('payments.monthlySalary')}</p><p className="mt-1 text-xl font-bold">{formatCurrency(employee.baseSalary)}</p></div><div className="card"><p className="text-xs text-gray-500">{t('payments.totalPaid')}</p><p className="mt-1 text-xl font-bold text-success-700">{formatCurrency(totalPaid)}</p></div><div className="card"><p className="text-xs text-gray-500">{t('payments.remaining')}</p><p className="mt-1 text-xl font-bold">{formatCurrency(Math.max(0, totalDue - totalPaid))}</p></div><div className="card"><p className="text-xs text-gray-500">{t('payments.status')}</p><div className="mt-2"><StatusBadge status={status} /></div></div></div>
      {error && <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</p>}
      <section className="flex flex-col gap-3"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{t('payments.movements')}</h2>{mode === 'employer' && <button className="text-sm text-primary-700" onClick={() => { setEditing(null); setModalOpen(true) }}>{t('payments.addPayment')}</button>}</div>{loading ? <p className="text-gray-500">{t('common.loading')}</p> : monthRecords.length === 0 ? <div className="card text-center text-gray-500">{t('payments.noPaymentsToShow')}</div> : monthRecords.map((record) => <div key={record.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{formatIsraeliDate(record.paymentDate)} · {t(`payments.categories.${record.category}`)}</p><p className="text-sm text-gray-500">{t(`payments.methods.${record.paymentMethod}`)}{record.bankReference ? ` · ${t('payments.bankReference')}: ${record.bankReference}` : ''}</p>{record.note && <p className="text-sm text-gray-500">{record.note}</p>}</div><div className="flex items-center justify-between gap-3"><strong className="text-lg">{formatCurrency(record.amount)}</strong>{mode === 'employer' && <div className="flex gap-1"><button className="btn-secondary !p-2" onClick={() => { setEditing(record); setModalOpen(true) }}><Pencil size={16} /></button><button className="btn-secondary !p-2" onClick={() => showHistory(record)}><History size={16} /></button><button className="btn-secondary !p-2 text-danger-700" onClick={() => remove(record)}><Trash2 size={16} /></button></div>}</div></div>)}</section>
      {mode === 'employee' && <section className="card"><h2 className="font-bold mb-3">{t('payments.paymentHistory')}</h2>{records.filter((record) => !record.deleted).map((record) => <div key={record.id} className="flex justify-between border-b py-3 last:border-0"><span>{formatIsraeliDate(record.paymentDate)} · {t(`payments.categories.${record.category}`)}</span><strong>{formatCurrency(record.amount)}</strong></div>)}</section>}
      {mode === 'employee' && <section className="card"><h2 className="font-bold mb-3">{t('payments.currentTerms')}</h2><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-gray-500">{t('payments.monthlySalary')}</p><strong>{formatCurrency(terms?.monthlySalary ?? employee.baseSalary)}</strong></div><div><p className="text-gray-500">{t('payments.employmentStart')}</p><strong>{formatIsraeliDate(terms?.employmentStartDate ?? employee.startDate)}</strong></div>{terms?.paymentDay && <div><p className="text-gray-500">{t('payments.paymentDay')}</p><strong>{terms.paymentDay}</strong></div>}{terms?.weeklyRestDay && <div><p className="text-gray-500">{t('payments.restDay')}</p><strong>{terms.weeklyRestDay}</strong></div>}</div></section>}
      <PaymentMovementModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={saveMovement} existing={editing} year={year} month={month} />
      {historyOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setHistoryOpen(false)}><div className="card w-full max-w-lg max-h-[80vh] overflow-auto" onClick={(event) => event.stopPropagation()}><div className="flex justify-between"><h2 className="text-lg font-bold">{t('payments.history')}</h2><button onClick={() => setHistoryOpen(false)}>×</button></div>{history.map((entry) => <div key={entry.id} className="border-s-2 border-primary-300 ps-3 py-3 mt-3"><p className="font-semibold">{t(`payments.audit.${entry.action}`)}</p><p className="text-xs text-gray-500">{formatDateTime(entry.timestamp)} · {entry.performedByName}</p>{entry.changedFields?.map((field) => <p key={field} className="text-sm">{field}: {String(entry.before?.[field] ?? '—')} → {String(entry.after?.[field] ?? '—')}</p>)}</div>)}</div></div>}
    </div>
  )
}
