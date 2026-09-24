import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/Modal'
import { FormField, Input, Textarea } from '@/components/FormField'
import type { PaymentCategory, PaymentMethod, PaymentRecord } from '@/types'
import { formatIsraeliDate } from '@/utils/dates'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: { paymentDate: string; amount: number; paymentMethod: PaymentMethod; bankReference?: string; category: PaymentCategory; note?: string }) => Promise<void>
  existing?: PaymentRecord | null
  year: number
  month: number
}

const categories: PaymentCategory[] = ['monthlySalary', 'holiday', 'vacation', 'sickLeave', 'bonus', 'advance', 'reimbursement', 'other']

export function PaymentMovementModal({ open, onClose, onSave, existing, year, month }: Props) {
  const { t } = useTranslation()
  const [paymentDate, setPaymentDate] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bankTransfer')
  const [bankReference, setBankReference] = useState('')
  const [category, setCategory] = useState<PaymentCategory>('monthlySalary')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPaymentDate(existing?.paymentDate ?? `${year}-${String(month).padStart(2, '0')}-01`)
    setAmount(existing ? String(existing.amount) : '')
    setPaymentMethod(existing?.paymentMethod ?? 'bankTransfer')
    setBankReference(existing?.bankReference ?? '')
    setCategory(existing?.category ?? 'monthlySalary')
    setNote(existing?.note ?? '')
  }, [existing, month, year, open])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave({
        paymentDate,
        amount: Number(amount),
        paymentMethod,
        bankReference: paymentMethod === 'bankTransfer' ? bankReference.trim() || undefined : undefined,
        category,
        note: note.trim() || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? t('payments.editMovement') : t('payments.addMovement')} size="md">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField label={t('payments.paymentDate')} required><Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required /></FormField>
        <FormField label={t('payments.amount')} required><Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></FormField>
        <FormField label={t('payments.paymentMethod')} required>
          <select className="input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
            <option value="cash">{t('payments.cash')}</option>
            <option value="bankTransfer">{t('payments.bankTransfer')}</option>
          </select>
        </FormField>
        {paymentMethod === 'bankTransfer' && <FormField label={t('payments.bankReference')}><Input value={bankReference} onChange={(event) => setBankReference(event.target.value)} /></FormField>}
        <FormField label={t('payments.category')} required>
          <select className="input" value={category} onChange={(event) => setCategory(event.target.value as PaymentCategory)}>
            {categories.map((item) => <option key={item} value={item}>{t(`payments.categories.${item}`)}</option>)}
          </select>
        </FormField>
        <FormField label={t('payments.note')}><Textarea value={note} onChange={(event) => setNote(event.target.value)} /></FormField>
        <p className="text-xs text-gray-500">{formatIsraeliDate(paymentDate)}</p>
        <div className="flex gap-2"><button type="button" className="btn-secondary flex-1" onClick={onClose}>{t('common.cancel')}</button><button className="btn-primary flex-1" disabled={saving}>{saving ? t('common.loading') : t('payments.savePayment')}</button></div>
      </form>
    </Modal>
  )
}
