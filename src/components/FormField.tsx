import clsx from 'clsx'
import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
  hint?: string
}

export function FormField({ label, error, children, required, hint }: Props) {
  const { t } = useTranslation()
  const displayError = error ? t(error) : undefined

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-danger-500 ms-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {displayError && <p className="text-xs text-danger-600">{displayError}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={clsx('input', error && 'input-error', className)}
      {...props}
    />
  )
})

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={clsx('input', error && 'input-error', className)}
      {...props}
    >
      {children}
    </select>
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(function Textarea({ error, className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={3}
      className={clsx('input resize-none', error && 'input-error', className)}
      {...props}
    />
  )
})
