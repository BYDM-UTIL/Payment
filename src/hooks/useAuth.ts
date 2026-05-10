import { useEffect, useState } from 'react'
import { onAuthChange, getUserProfile, createUserProfile } from '@/services/firebase/auth.service'
import { useAppStore } from '@/store/useAppStore'

async function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function getUserProfileWithRetry(uid: string, retries = 5, delayMs = 250) {
  for (let i = 0; i < retries; i++) {
    const profile = await getUserProfile(uid)
    if (profile) return profile
    if (i < retries - 1) {
      await sleep(delayMs)
    }
  }
  return null
}

export function useAuth() {
  const { user, setUser, clearSession } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadingTimeout = window.setTimeout(() => {
      setLoading(false)
    }, 5000)

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfileWithRetry(firebaseUser.uid)
          if (profile) {
            setUser(profile)
          } else {
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'משתמש',
              role: 'employee' as const,
              employeeProfileCompleted: false,
              defaultLanguage: 'he' as const,
              createdAt: new Date().toISOString()
            }
            await createUserProfile(firebaseUser.uid, {
              email: newProfile.email,
              displayName: newProfile.displayName,
              role: newProfile.role,
              employeeProfileCompleted: newProfile.employeeProfileCompleted,
              defaultLanguage: newProfile.defaultLanguage,
              createdAt: newProfile.createdAt,
            })
            setUser(newProfile)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'משתמש',
            role: 'employee' as const,
            employeeProfileCompleted: false,
            defaultLanguage: 'he' as const,
            createdAt: new Date().toISOString()
          })
        }
      } else {
        clearSession()
      }
      window.clearTimeout(loadingTimeout)
      setLoading(false)
    })

    return () => {
      window.clearTimeout(loadingTimeout)
      unsubscribe()
    }
  }, [clearSession, setUser])

  return {
    user,
    loading,
    isEmployer: user?.role === 'employer',
    isEmployee: user?.role === 'employee',
  }
}
