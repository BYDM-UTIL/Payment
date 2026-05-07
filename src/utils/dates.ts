import { format, parseISO } from 'date-fns'

export function formatDate(dateStr: string, pattern = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(dateStr), pattern)
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm')
  } catch {
    return dateStr
  }
}

export function currentYear(): number {
  return new Date().getFullYear()
}

export function currentMonth(): number {
  return new Date().getMonth() + 1
}

export function isoNow(): string {
  return new Date().toISOString()
}

export function monthYearKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}
