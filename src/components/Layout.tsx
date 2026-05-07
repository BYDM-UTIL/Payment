import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  CreditCard,
  Coins,
  Users,
  FileText,
  Settings,
  BookOpen,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAppStore } from '@/store/useAppStore'
import clsx from 'clsx'

const navItems = [
  { to: '/',           labelKey: 'nav.dashboard', Icon: LayoutDashboard },
  { to: '/payments',   labelKey: 'nav.payments',  Icon: CreditCard },
  { to: '/pension',    labelKey: 'nav.pension',   Icon: Coins },
  { to: '/employees',  labelKey: 'nav.employees', Icon: Users },
  { to: '/reports',    labelKey: 'nav.reports',   Icon: FileText },
  { to: '/settings',   labelKey: 'nav.settings',  Icon: Settings },
  { to: '/guide',      labelKey: 'nav.guide',     Icon: BookOpen },
]

export function Layout() {
  const { t } = useTranslation()
  const { user } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-primary-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-xl hover:bg-primary-700 transition-colors sm:hidden"
          >
            <Menu size={22} />
          </button>
          <span className="font-bold text-base sm:text-lg">{t('app.shortName')}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user && (
            <span className="hidden sm:block text-sm opacity-80">{user.displayName}</span>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden sm:flex flex-col w-56 bg-white border-e border-gray-200 shadow-sm py-4 shrink-0">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map(({ to, labelKey, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                <Icon size={18} />
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
            <aside className="absolute start-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col py-4 safe-top">
              <div className="flex items-center justify-between px-4 mb-4">
                <span className="font-bold text-primary-800">{t('app.name')}</span>
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col gap-1 px-2">
                {navItems.map(({ to, labelKey, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      )
                    }
                  >
                    <Icon size={18} />
                    {t(labelKey)}
                  </NavLink>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 start-0 end-0 bg-white border-t border-gray-200 flex safe-bottom z-40">
        {navItems.slice(0, 5).map(({ to, labelKey, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                isActive ? 'text-primary-700' : 'text-gray-500'
              )
            }
          >
            <Icon size={20} />
            <span className="text-[10px]">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
