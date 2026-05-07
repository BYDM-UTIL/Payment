import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppUser } from '@/types'
import type { SupportedLanguage } from '@/i18n'

interface AppState {
  // Auth
  user: AppUser | null
  setUser: (user: AppUser | null) => void

  // Current employee & year
  currentEmployeeId: string | null
  setCurrentEmployeeId: (id: string | null) => void

  currentYear: number
  setCurrentYear: (year: number) => void

  // Language
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      currentEmployeeId: null,
      setCurrentEmployeeId: (id) => set({ currentEmployeeId: id }),

      currentYear: new Date().getFullYear(),
      setCurrentYear: (year) => set({ currentYear: year }),

      language: 'he',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        currentEmployeeId: state.currentEmployeeId,
        currentYear: state.currentYear,
        language: state.language,
      }),
    }
  )
)
