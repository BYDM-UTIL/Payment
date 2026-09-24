import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/Modal'
import { FormField, Input, Textarea } from '@/components/FormField'
import { formatCurrency, calculatePaymentTotalDue } from '@/utils/calculations'
import { formatIsraeliDate } from '@/utils/dates'
import type { PaymentMethod, PaymentRecord } from '@/types'

export interface PaymentEditorData {
  paymentDate: string
  monthlySalary: number
  saturdayPayment: number
  holidayPayment: number
  otherPayment: number
  totalPaid: number
  paymentMethod: PaymentMethod
  bankReference?: string
  note?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: PaymentEditorData) => Promise<void>
  existing?: PaymentRecord | null
  year: number
  month: number
  defaultSalary: number
}

export function PaymentEditorModal({ open, onClose, onSave, existing, year, month, defaultSalary }: Props) {
  const { t } = useTranslation()
  const [paymentDate, setPaymentDate] = useState('')
  const [monthlySalary, setMonthlySalary] = useState(0)
  const [saturdayPayment, setSaturdayPayment] = useState(0)
  const [holidayPayment, setHolidayPayment] = useState(0)
  const [otherPayment, setOtherPayment] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bankTransfer')
  const [bankReference, setBankReference] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPaymentDate(existing?.paymentDate ?? `${year}-${String(month).padStart(2, '0')}-01`)
    setMonthlySalary(existing?.monthlySalary ?? defaultSalary)
    setSaturdayPayment(existing?.saturdayPayment ?? 0)
    setHolidayPayment(existing?.holidayPayment ?? 0)
    setOtherPayment(existing?.otherPayment ?? 0)
    setTotalPaid(existing?.totalPaid ?? 0)
    setPaymentMethod(existing?.paymentMethod ?? 'bankTransfer')
    setBankReference(existing?.bankReference ?? '')
    setNote(existing?.note ?? '')
    setError('')
  }, [existing, month, year, defaultSalary, open])

  const totalDue = calculatePaymentTotalDue({ monthlySalary, saturdayPayment, holidayPayment, otherPayment })

  async function markPaid() {
    setTotalPaid(totalDue)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        paymentDate,
        monthlySalary,
        saturdayPayment,
        holidayPayment,
        otherPayment,
        totalPaid,
        paymentMethod,
        bankReference: paymentMethod === 'bankTransfer' ? bankReference.trim() || undefined : undefined,
        note: note.trim() || undefined,
      })
      onClose()
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : ''
      setError(message.includes('already-signed') ? t('payment.errors.alreadySigned') : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? t('payment.editPayment') : t('payment.addPayment')} size="md">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField label={t('payment.paymentDate')} required>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
          <p className="text-xs text-gray-500 mt-1">{formatIsraeliDate(paymentDate)}</p>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('payment.monthlySalary')}><Input type="number" min="0" value={monthlySalary} onChange={(e) => setMonthlySalary(Number(e.target.value))} /></FormField>
          <FormField label={t('payment.saturday')}><Input type="number" min="0" value={saturdayPayment} onChange={(e) => setSaturdayPayment(Number(e.target.value))} /></FormField>
          <FormField label={t('payment.holiday')}><Input type="number" min="0" value={holidayPayment} onChange={(e) => setHolidayPayment(Number(e.target.value))} /></FormField>
          <FormField label={t('payment.other')}><Input type="number" min="0" value={otherPayment} onChange={(e) => setOtherPayment(Number(e.target.value))} /></FormField>
        </div>
        <div className="rounded-xl bg-gray-50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('payment.total')}</span>
          <strong className="text-lg">{formatCurrency(totalDue)}</strong>
        </div>
        <FormField label={t('payment.paymentMethod')} required>
          <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            <option value="cash">{t('payment.cash')}</option>
            <option value="bankTransfer">{t('payment.bankTransfer')}</option>
          </select>
        </FormField>
        {paymentMethod === 'bankTransfer' && <FormField label={t('payment.bankReference')}><Input value={bankReference} onChange={(e) => setBankReference(e.target.value)} /></FormField>}
        <FormField label={t('payment.totalPaid')} required>
          <div className="flex gap-2">
            <Input type="number" min="0" value={totalPaid} onChange={(e) => setTotalPaid(Number(e.target.value))} required />
            <button type="button" className="btn-secondary whitespace-nowrap" onClick={markPaid}>{t('payment.markPaid')}</button>
          </div>
        </FormField>
        <FormField label={t('payment.note')}><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></FormField>
        {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
        <div className="flex gap-2"><button type="button" className="btn-secondary flex-1" onClick={onClose}>{t('common.cancel')}</button><button className="btn-primary flex-1" disabled={saving}>{saving ? t('common.loading') : t('payment.savePayment')}</button></div>
      </form>
    </Modal>
  )
}
