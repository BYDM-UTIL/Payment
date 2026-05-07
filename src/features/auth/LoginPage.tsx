import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { loginWithEmail, registerWithEmail, createUserProfile, getUserProfile } from '@/services/firebase/auth.service'
import { Input, FormField } from '@/components/FormField'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

type AuthMode = 'login' | 'register'

const ADMIN_CREATION_PASSWORD = (import.meta.env.VITE_ADMIN_CREATION_PASSWORD ?? '').trim()

function getAuthErrorMessage() {
  return 'שגיאה בביצוע הפעולה. בדוק את הפרטים ונסה שוב.'
}

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showEmployerOption, setShowEmployerOption] = useState(false)
  const [registerAsEmployer, setRegisterAsEmployer] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function resetAuthError() {
    if (error) setError('')
  }

  function validateRegisterForm() {
    if (!displayName.trim()) return 'שם מלא הוא שדה חובה.'
    if (password.length < 6) return 'הסיסמה חייבת להכיל לפחות 6 תווים.'
    if (password !== confirmPassword) return 'אימות הסיסמה לא תואם.'

    if (registerAsEmployer) {
      if (!ADMIN_CREATION_PASSWORD) {
        return 'לא הוגדרה סיסמת יצירת מעסיק במערכת (VITE_ADMIN_CREATION_PASSWORD).'
      }
      if (!adminPassword.trim()) return 'ליצירת משתמש מעסיק יש להזין סיסמת אדמין.'
      if (adminPassword.trim() !== ADMIN_CREATION_PASSWORD) return 'סיסמת האדמין שגויה.'
    }

    return null
  }

  async function handleLoginSubmit() {
    const result = await loginWithEmail(email, password)
    const uid = result.user.uid
    const existingProfile = await getUserProfile(uid)

    if (!existingProfile) {
      await createUserProfile(uid, {
        email: result.user.email || email,
        displayName: result.user.displayName || 'משתמש',
        role: 'employer',
        employeeProfileCompleted: true,
        defaultLanguage: 'he',
        createdAt: new Date().toISOString(),
      })
    }
  }

  async function handleRegisterSubmit() {
    const validationError = validateRegisterForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const result = await registerWithEmail(email, password)
    const uid = result.user.uid

    // If registering as employer (with valid admin password), create employer user
    // Otherwise, create employee user who must complete profile
    const role = registerAsEmployer ? 'employer' : 'employee'
    const profileCompleted = registerAsEmployer

    await createUserProfile(uid, {
      email: result.user.email || email,
      displayName: displayName.trim(),
      role,
      employeeProfileCompleted: profileCompleted,
      defaultLanguage: 'he',
      createdAt: new Date().toISOString(),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetAuthError()
    setLoading(true)

    try {
      if (mode === 'login') {
        await handleLoginSubmit()
      } else {
        await handleRegisterSubmit()
      }
      navigate('/')
    } catch {
      setError(getAuthErrorMessage())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.22),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(244,63,94,0.16),_transparent_30%),linear-gradient(180deg,_#fffaf5_0%,_#fff7ed_100%)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white">
            <LogIn className="text-primary-700" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t('app.name')}</h1>
          <p className="text-gray-600 mt-1 text-sm">מעקב תשלומים לעובדת זרה</p>
        </div>

        <div className="card">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white text-primary-800 shadow-sm' : 'text-gray-600'}`}
              onClick={() => {
                setMode('login')
                resetAuthError()
                setShowEmployerOption(false)
                setRegisterAsEmployer(false)
              }}
            >
              התחברות
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-white text-primary-800 shadow-sm' : 'text-gray-600'}`}
              onClick={() => {
                setMode('register')
                resetAuthError()
                setShowEmployerOption(false)
                setRegisterAsEmployer(false)
              }}
            >
              משתמש חדש
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <FormField label="שם מלא" required>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value)
                    resetAuthError()
                  }}
                  placeholder="שם משתמש"
                  autoComplete="name"
                  required
                />
              </FormField>
            )}

            <FormField label="אימייל" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  resetAuthError()
                }}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </FormField>

            <FormField label="סיסמה" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  resetAuthError()
                }}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </FormField>

            {mode === 'register' && (
              <>
                <FormField label="אימות סיסמה" required>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      resetAuthError()
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </FormField>

                {!showEmployerOption && (
                  <button
                    type="button"
                    onClick={() => setShowEmployerOption(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 underline text-right"
                  >
                    נרשם כמעסיק?
                  </button>
                )}

                {showEmployerOption && (
                  <>
                    <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={registerAsEmployer}
                          onChange={(e) => {
                            setRegisterAsEmployer(e.target.checked)
                            resetAuthError()
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">רשום כמעסיק עם סיסמת אדמין</span>
                      </label>
                    </div>

                    {registerAsEmployer && (
                      <FormField label="סיסמת אדמין" required>
                        <Input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => {
                            setAdminPassword(e.target.value)
                            resetAuthError()
                          }}
                          placeholder="הזן סיסמת אדמין"
                          autoComplete="off"
                          required
                        />
                      </FormField>
                    )}
                  </>
                )}
              </>
            )}

            {error && (
              <p className="text-sm text-danger-600 bg-danger-50 rounded-xl px-3 py-2">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? t('common.loading') : mode === 'login' ? 'כניסה למערכת' : 'יצירת משתמש חדש'}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-4">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
