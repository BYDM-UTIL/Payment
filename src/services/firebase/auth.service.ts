import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type { AppUser } from '@/types'

export function normalizeUsername(username: string) {
  return username.trim().normalize('NFKC').toLocaleLowerCase('en-US')
}

function internalEmailForUsername(username: string) {
  return `${normalizeUsername(username).replace(/[^a-z0-9._-]/g, '')}@worker.payment.local`
}

function normalizeUserProfile(uid: string, data: Record<string, unknown>): AppUser {
  const rawRole = data.role
  const role: 'admin' | 'caregiver' =
    rawRole === 'admin' || rawRole === 'employer' ? 'admin' : 'caregiver'

  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    username: typeof data.username === 'string' ? data.username : undefined,
    usernameNormalized: typeof data.usernameNormalized === 'string' ? data.usernameNormalized : undefined,
    displayName: typeof data.displayName === 'string' ? data.displayName : 'משתמש',
    role,
    employeeId: typeof data.employeeId === 'string' ? data.employeeId : undefined,
    employeeProfileCompleted: typeof data.employeeProfileCompleted === 'boolean' ? data.employeeProfileCompleted : true,
    preferredLanguage: data.preferredLanguage === 'ru' || data.preferredLanguage === 'en' ? data.preferredLanguage : 'he',
    active: typeof data.active === 'boolean' ? data.active : true,
    defaultLanguage:
      data.defaultLanguage === 'ru' || data.defaultLanguage === 'en' ? data.defaultLanguage : 'he',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
  }
}

export async function loginWithUsername(username: string, password: string) {
  const normalized = normalizeUsername(username)
  if (!normalized) throw new Error('auth/invalid-username')

  const mapping = await getDoc(doc(db, 'usernameMappings', normalized))
  if (!mapping.exists()) throw new Error('auth/invalid-credential')
  const data = mapping.data()
  if (data.active === false) throw new Error('auth/user-disabled')
  const internalEmail = typeof data.internalEmail === 'string'
    ? data.internalEmail
    : internalEmailForUsername(username)
  return signInWithEmailAndPassword(auth, internalEmail, password)
}

export async function createCaregiverAuthAccount(username: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: internalEmailForUsername(username), password, returnSecureToken: false }),
    }
  )
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(typeof payload?.error?.message === 'string' ? payload.error.message : 'auth/create-failed')
  }
  return response.json() as Promise<{ localId: string }>
}

export async function logout() {
  return signOut(auth)
}

export async function changeOwnPassword(password: string) {
  if (!auth.currentUser) throw new Error('auth/not-signed-in')
  await updatePassword(auth.currentUser, password)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return normalizeUserProfile(uid, snap.data())
}

export async function createUsernameMapping(
  username: string,
  uid: string,
  role: 'admin' | 'caregiver',
  active = true,
) {
  const usernameNormalized = normalizeUsername(username)
  await setDoc(doc(db, 'usernameMappings', usernameNormalized), {
    username,
    usernameNormalized,
    uid,
    role,
    active,
    internalEmail: internalEmailForUsername(username),
  })
}

export async function createUserProfile(uid: string, data: Omit<AppUser, 'uid'>) {
  await setDoc(doc(db, 'users', uid), data)
}

export async function updateUserProfile(uid: string, data: Partial<Omit<AppUser, 'uid'>>) {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export async function updateUserLanguage(uid: string, language: string) {
  await setDoc(doc(db, 'users', uid), { defaultLanguage: language }, { merge: true })
}
