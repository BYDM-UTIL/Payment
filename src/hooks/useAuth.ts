import { useEffect, useState } from 'react'
import { onAuthChange, getUserProfile } from '@/services/firebase/auth.service'
import { useAppStore } from '@/store/useAppStore'

export function useAuth() {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          if (profile) {
            setUser(profile)
          } else {
            // If profile doesn't exist, create a minimal one
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'משתמש',
              role: 'admin' as const,
              defaultLanguage: 'he' as const,
              createdAt: new Date().toISOString()
            }
            setUser(newProfile)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Set minimal profile on error
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'משתמש',
            role: 'admin' as const,
            defaultLanguage: 'he' as const,
            createdAt: new Date().toISOString()
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [setUser])

  return { user, loading, isAdmin: user?.role === 'admin' }
}
