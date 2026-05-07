import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type { AppUser } from '@/types'

function normalizeUserProfile(uid: string, data: Record<string, unknown>): AppUser {
  const rawRole = data.role
  // Map legacy 'admin' role to 'employer'
  const role: 'employer' | 'employee' = rawRole === 'employer' ? 'employer' : 'employee'

  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : 'משתמש',
    role,
    employeeId: typeof data.employeeId === 'string' ? data.employeeId : undefined,
    employeeProfileCompleted: typeof data.employeeProfileCompleted === 'boolean' ? data.employeeProfileCompleted : false,
    defaultLanguage:
      data.defaultLanguage === 'ru' || data.defaultLanguage === 'en' ? data.defaultLanguage : 'he',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
  }
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return normalizeUserProfile(uid, snap.data())
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
