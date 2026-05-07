import { useEffect, useState, useCallback } from 'react'
import {
  subscribeToPensionPayments,
  savePensionPayment,
} from '@/services/firebase/firestore.service'
import type { PensionPayment } from '@/types'
import { calculateAnnualPensionSummary } from '@/utils/calculations'

export function usePension(employeeId: string | null, year: number, pensionRate = 12.5) {
  const [payments, setPayments] = useState<PensionPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) {
      setPayments([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeToPensionPayments(employeeId, year, (data) => {
      setPayments(data)
      setLoading(false)
    })
    return unsub
  }, [employeeId, year])

  const save = useCallback(
    async (month: number, input: Omit<Parameters<typeof savePensionPayment>[3], 'pensionRate'>) => {
      if (!employeeId) return
      await savePensionPayment(employeeId, year, month, { ...input, pensionRate })
    },
    [employeeId, year, pensionRate]
  )

  const getByMonth = useCallback(
    (month: number) => payments.find((p) => p.month === month) ?? null,
    [payments]
  )

  const summary = calculateAnnualPensionSummary(payments)

  return { payments, loading, save, getByMonth, summary }
}
