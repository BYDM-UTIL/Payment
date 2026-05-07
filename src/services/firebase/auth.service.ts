import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type { AppUser } from '@/types'

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
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
  return { uid, ...snap.data() } as AppUser
}

export async function createUserProfile(uid: string, data: Omit<AppUser, 'uid'>) {
  await setDoc(doc(db, 'users', uid), data)
}

export async function updateUserLanguage(uid: string, language: string) {
  await setDoc(doc(db, 'users', uid), { defaultLanguage: language }, { merge: true })
}
