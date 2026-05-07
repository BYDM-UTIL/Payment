import { formatCurrency } from '@/utils/calculations'
import clsx from 'clsx'

interface Props {
  label: string
  value: number | string
  color?: 'blue' | 'green' | 'red' | 'orange' | 'gray'
  isCurrency?: boolean
  icon?: React.ReactNode
}

const colorMap = {
  blue:   'bg-primary-50 text-primary-800 border-primary-200',
  green:  'bg-success-50 text-success-700 border-success-200',
  red:    'bg-danger-50 text-danger-700 border-danger-200',
  orange: 'bg-warning-50 text-warning-700 border-warning-200',
  gray:   'bg-gray-50 text-gray-600 border-gray-200',
}

export function KpiCard({ label, value, color = 'blue', isCurrency = false, icon }: Props) {
  const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value

  return (
    <div className={clsx('card border flex flex-col gap-1', colorMap[color])}>
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-xl font-bold">{displayValue}</p>
    </div>
  )
}
