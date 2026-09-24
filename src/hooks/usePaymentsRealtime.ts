import { useEffect, useState } from 'react'
import { subscribeToPayments } from '@/services/firebase/firestore.service'
import type { PaymentRecord } from '@/types'

// Realtime shared payment state for both admin and caregiver.
export function usePaymentsRealtime(caregiverId: string | null) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!caregiverId) {
      setPayments([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToPayments(caregiverId, (records) => {
      setPayments(records)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [caregiverId])

  return { payments, loading }
}
