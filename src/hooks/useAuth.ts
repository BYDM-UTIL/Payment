import { useEffect, useState } from 'react'
import { onAuthChange, getUserProfile } from '@/services/firebase/auth.service'
import { useAppStore } from '@/store/useAppStore'

export function useAuth() {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [setUser])

  return { user, loading, isAdmin: user?.role === 'admin' }
}
