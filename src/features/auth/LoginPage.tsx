import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { loginWithUsername } from '@/services/firebase/auth.service'
import { Input, FormField } from '@/components/FormField'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithUsername(username, password)
      navigate('/', { replace: true })
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : ''
      if (message.includes('user-disabled')) {
        setError(t('auth.accountInactive'))
      } else if (message.includes('invalid-credential') || message.includes('INVALID_LOGIN_CREDENTIALS')) {
        setError(t('auth.invalidCredentials'))
      } else {
        setError(t('auth.loginError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.22),_transparent_34%),linear-gradient(180deg,_#fffaf5_0%,_#fff7ed_100%)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white">
            <LogIn className="text-primary-700" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t('app.name')}</h1>
          <p className="text-gray-600 mt-1 text-sm">{t('auth.loginSubtitle')}</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label={t('auth.username')} required>
              <Input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                required
              />
            </FormField>
            <FormField label={t('auth.password')} required>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </FormField>
            {error && <p className="text-sm text-danger-600 bg-danger-50 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? t('common.loading') : t('auth.login')}
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
