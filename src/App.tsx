import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole } from '@/types'
import { getLanguageDir } from '@/i18n'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { PensionPage } from '@/features/pension/PensionPage'
import { EmployeesPage } from '@/features/employees/EmployeesPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { GuidePage } from '@/features/guide/GuidePage'

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

function getDefaultPath(role: UserRole) {
  return role === 'employee' ? '/my-payments' : '/'
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <LoadingScreen />
  )
  if (!user) return <Navigate to="/login" replace />
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

function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'employee') return <Navigate to="/my-payments" replace />
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
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeRoute />} />
          <Route path="payments" element={<RoleRoute roles={['employer']}><PaymentsPage mode="employer" /></RoleRoute>} />
          <Route path="my-payments" element={<RoleRoute roles={['employee']}><PaymentsPage mode="employee" /></RoleRoute>} />
          <Route path="pension" element={<RoleRoute roles={['employer']}><PensionPage /></RoleRoute>} />
          <Route path="employees" element={<RoleRoute roles={['employer']}><EmployeesPage /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute roles={['employer']}><ReportsPage /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute roles={['employer']}><SettingsPage /></RoleRoute>} />
          <Route path="guide" element={<RoleRoute roles={['employer']}><GuidePage /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
