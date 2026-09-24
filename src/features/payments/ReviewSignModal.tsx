import { useRef, useState } from 'react'
import ReactSignatureCanvas from 'react-signature-canvas'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/Modal'
import { formatCurrency } from '@/utils/calculations'
import { formatIsraeliDate } from '@/utils/dates'
import type { PaymentRecord } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  payment: PaymentRecord
  onSign: (signatureData: string) => Promise<void>
}

export function ReviewSignModal({ open, onClose, payment, onSign }: Props) {
  const { t } = useTranslation()
  const canvasRef = useRef<ReactSignatureCanvas>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const rows: { label: string; value: number }[] = [
    { label: t('payment.monthlySalary'), value: payment.monthlySalary },
    { label: t('payment.saturday'), value: payment.saturdayPayment },
    { label: t('payment.holiday'), value: payment.holidayPayment },
    { label: t('payment.other'), value: payment.otherPayment },
  ].filter((row) => row.value > 0)

  async function submit() {
    setError('')
    if (!confirmed) { setError(t('payment.mustConfirm')); return }
    if (!canvasRef.current || canvasRef.current.isEmpty()) { setError(t('common.signatureRequired')); return }
    setSaving(true)
    try {
      await onSign(canvasRef.current.toDataURL('image/png'))
      onClose()
    } catch (signError) {
      const message = signError instanceof Error ? signError.message : ''
      if (message.includes('version-changed')) setError(t('payment.errors.versionChanged'))
      else if (message.includes('already-signed')) setError(t('payment.errors.alreadySigned'))
      else setError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('payment.reviewAndSign')} size="md">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b bg-gray-50 flex justify-between"><span className="font-semibold">{t(`months.${payment.month}`)} {payment.year}</span><span className="text-sm text-gray-500">{formatIsraeliDate(payment.paymentDate)}</span></div>
          <div className="p-4 flex flex-col gap-2">
            {rows.map((row) => <div key={row.label} className="flex justify-between text-sm"><span className="text-gray-600">{row.label}</span><span>{formatCurrency(row.value)}</span></div>)}
            <div className="flex justify-between border-t pt-2 mt-1 font-bold"><span>{t('payment.totalReceived')}</span><span>{formatCurrency(payment.totalPaid)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>{t('payment.paymentMethod')}</span><span>{t(`payment.${payment.paymentMethod}`)}{payment.bankReference ? ` · ${payment.bankReference}` : ''}</span></div>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          <span>{t('payment.confirmReceipt')}</span>
        </label>

        <div>
          <p className="text-sm text-gray-600 mb-1">{t('common.signatureRequired')}</p>
          <ReactSignatureCanvas ref={canvasRef} canvasProps={{ className: 'signature-canvas w-full', style: { width: '100%', height: 180, touchAction: 'none' } }} backgroundColor="rgba(250,250,250,1)" />
        </div>

        {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => canvasRef.current?.clear()}>{t('common.clearSignature')}</button>
          <button type="button" className="btn-primary flex-1" disabled={saving} onClick={submit}>{saving ? t('common.loading') : t('payment.confirmAndSign')}</button>
        </div>
      </div>
    </Modal>
  )
}
