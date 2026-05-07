import type { PaymentStatus } from '@/types'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

const statusClasses: Record<PaymentStatus, string> = {
  paid:    'badge-paid',
  partial: 'badge-partial',
  pending: 'badge-pending',
  empty:   'badge-empty',
}

interface Props {
  status: PaymentStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const { t } = useTranslation()
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        statusClasses[status]
      )}
    >
      {t(`status.${status}`)}
    </span>
  )
}
