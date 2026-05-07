import clsx from 'clsx'

interface Props {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
  hint?: string
}

export function FormField({ label, error, children, required, hint }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-danger-500 ms-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={clsx('input', error && 'input-error', className)}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <select
      className={clsx('input', error && 'input-error', className)}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ error, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      rows={3}
      className={clsx('input resize-none', error && 'input-error', className)}
      {...props}
    />
  )
}
