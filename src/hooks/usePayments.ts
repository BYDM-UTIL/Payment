import { useEffect, useState, useCallback } from 'react'
import {
  subscribeToMonthlyPayments,
  saveMonthlyPayment,
  saveSignature,
  addAttachmentToPayment,
} from '@/services/firebase/firestore.service'
import type { MonthlyPayment } from '@/types'
import { calculateAnnualPaymentSummary } from '@/utils/calculations'

export function usePayments(employeeId: string | null, year: number) {
  const [payments, setPayments] = useState<MonthlyPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) {
      setPayments([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeToMonthlyPayments(employeeId, year, (data) => {
      setPayments(data)
      setLoading(false)
    })
    return unsub
  }, [employeeId, year])

  const save = useCallback(
    async (
      month: number,
      input: Parameters<typeof saveMonthlyPayment>[3]
    ) => {
      if (!employeeId) return
      await saveMonthlyPayment(employeeId, year, month, input)
    },
    [employeeId, year]
  )

  const sign = useCallback(
    async (month: number, signatureUrl: string, signedBy: string) => {
      if (!employeeId) return
      await saveSignature(employeeId, year, month, signatureUrl, signedBy)
    },
    [employeeId, year]
  )

  const addAttachment = useCallback(
    async (month: number, attachment: Parameters<typeof addAttachmentToPayment>[3]) => {
      if (!employeeId) return
      await addAttachmentToPayment(employeeId, year, month, attachment)
    },
    [employeeId, year]
  )

  const getPaymentByMonth = useCallback(
    (month: number) => payments.find((p) => p.month === month) ?? null,
    [payments]
  )

  const summary = calculateAnnualPaymentSummary(payments)

  return { payments, loading, save, sign, addAttachment, getPaymentByMonth, summary }
}
