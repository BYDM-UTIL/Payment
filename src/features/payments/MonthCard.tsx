import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/utils/calculations'
import type { MonthlyPayment } from '@/types'
import { Pencil, PenLine, Paperclip, Eye } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  month: number
  payment: MonthlyPayment | null
  onEdit: () => void
  onSign: () => void
  onAttach: () => void
  onViewSignature: () => void
}

export function MonthCard({ month, payment, onEdit, onSign, onAttach, onViewSignature }: Props) {
  const { t } = useTranslation()
  const status = payment?.paymentStatus ?? 'empty'

  const borderColor = {
    paid:    'border-l-success-500',
    partial: 'border-l-danger-500',
    pending: 'border-l-warning-500',
    empty:   'border-l-gray-300',
  }[status]

  return (
    <div className={clsx('card border-s-4', borderColor, 'flex flex-col gap-3')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">{t(`months.${month}`)}</span>
          <StatusBadge status={status} size="sm" />
          {payment && !payment.hasPayslip && (
            <span className="text-xs text-warning-600 bg-warning-50 px-2 py-0.5 rounded-full border border-warning-200">
              {t('payments.noPayslip')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {payment?.employeeSignatureUrl ? (
            <button onClick={onViewSignature} className="p-2 text-success-600 hover:bg-success-50 rounded-xl" title={t('payments.viewSignature')}>
              <Eye size={16} />
            </button>
          ) : payment?.grossTotal ? (
            <button onClick={onSign} className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl" title={t('payments.signMonth')}>
              <PenLine size={16} />
            </button>
          ) : null}
          <button onClick={onAttach} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl" title={t('payments.uploadFile')}>
            <Paperclip size={16} />
          </button>
          <button onClick={onEdit} className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl" title={t('common.edit')}>
            <Pencil size={16} />
          </button>
        </div>
      </div>

      {/* Amounts */}
      {payment?.grossTotal ? (
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-500">{t('payments.grossTotal')}</p>
            <p className="font-semibold text-gray-800">{formatCurrency(payment.grossTotal)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-500">{t('payments.totalPaid')}</p>
            <p className="font-semibold text-green-700">{formatCurrency(payment.totalPaid)}</p>
          </div>
          <div className={clsx('rounded-xl p-2 text-center', payment.balanceDue > 0 ? 'bg-red-50' : 'bg-green-50')}>
            <p className="text-xs text-gray-500">{t('payments.balance')}</p>
            <p className={clsx('font-semibold', payment.balanceDue > 0 ? 'text-red-600' : 'text-green-700')}>
              {formatCurrency(payment.balanceDue)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-2">{t('status.empty')}</p>
      )}

      {/* Payment breakdown */}
      {payment && (payment.cashPaid > 0 || payment.payslipPaid > 0 || payment.bankTransferPaid > 0) && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {payment.cashPaid > 0 && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{t('payments.cash')}: {formatCurrency(payment.cashPaid)}</span>}
          {payment.payslipPaid > 0 && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{t('payments.payslip')}: {formatCurrency(payment.payslipPaid)}</span>}
          {payment.bankTransferPaid > 0 && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{t('payments.bankTransfer')}: {formatCurrency(payment.bankTransferPaid)}</span>}
        </div>
      )}

      {/* Attachments */}
      {payment?.attachments && payment.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {payment.attachments.map((att) => (
            <a
              key={att.id}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline flex items-center gap-1 bg-primary-50 px-2 py-0.5 rounded-full"
            >
              <Paperclip size={10} />
              {att.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
