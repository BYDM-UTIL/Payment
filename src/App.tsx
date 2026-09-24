import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole } from '@/types'
import { getLanguageDir } from '@/i18n'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/features/auth/LoginPage'
import { CompleteEmployeeProfilePage } from '@/features/onboarding/CompleteEmployeeProfilePage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { PensionPage } from '@/features/pension/PensionPage'
import { EmployeesPage } from '@/features/employees/EmployeesPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { GuidePage } from '@/features/guide/GuidePage'
import { ProfilePage } from '@/features/profile/ProfilePage'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p>טוען...</p>
      </div>
    </div>
  )
}

function InactiveAccountScreen() {
  const { t } = useTranslation()
  return <div className="min-h-screen flex items-center justify-center p-6 text-center"><p className="text-lg text-gray-700">{t('auth.accountInactive')}</p></div>
}

function getDefaultPath(role: UserRole) {
  return role === 'caregiver' ? '/my-payments' : '/'
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <LoadingScreen />
  )
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'caregiver' && user.active === false) return <InactiveAccountScreen />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={getDefaultPath(user.role)} replace />
  return <>{children}</>
}

function RoleRoute({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={getDefaultPath(user.role)} replace />
  return <>{children}</>
}

function EmployeeProfileCompletionRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  // If employee and profile not completed, redirect to completion page
  if (user.role === 'caregiver' && user.employeeProfileCompleted === false) {
    return <Navigate to="/complete-employee-profile" replace />
  }
  return <>{children}</>
}

function ProfileCompletionRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  // Only allow incomplete employees to access this page
  if (user.role === 'caregiver' && user.employeeProfileCompleted === false) {
    return <>{children}</>
  }
  // If already completed or is employer, redirect to default path
  return <Navigate to={getDefaultPath(user.role)} replace />
}

function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  // If employee with incomplete profile, redirect to profile completion
  if (user.role === 'caregiver' && user.employeeProfileCompleted === false) {
    return <Navigate to="/complete-employee-profile" replace />
  }
  if (user.role === 'caregiver') return <Navigate to="/my-payments" replace />
  return <DashboardPage />
}

export function App() {
  const { language } = useAppStore()

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = getLanguageDir(language)
  }, [language])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/complete-employee-profile" element={<ProfileCompletionRoute><CompleteEmployeeProfilePage /></ProfileCompletionRoute>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeRoute />} />
          <Route path="payments" element={<RoleRoute roles={['admin']}><PaymentsPage mode="employer" /></RoleRoute>} />
          <Route path="my-payments" element={<EmployeeProfileCompletionRoute><RoleRoute roles={['caregiver']}><PaymentsPage mode="employee" /></RoleRoute></EmployeeProfileCompletionRoute>} />
          <Route path="profile" element={<RoleRoute roles={['caregiver']}><ProfilePage /></RoleRoute>} />
          <Route path="pension" element={<RoleRoute roles={['admin']}><PensionPage /></RoleRoute>} />
          <Route path="employees" element={<RoleRoute roles={['admin']}><EmployeesPage /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute roles={['admin']}><ReportsPage /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute roles={['admin']}><SettingsPage /></RoleRoute>} />
          <Route path="guide" element={<RoleRoute roles={['admin']}><GuidePage /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
