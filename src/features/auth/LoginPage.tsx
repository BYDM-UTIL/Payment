import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { loginWithEmail, createUserProfile, getUserProfile } from '@/services/firebase/auth.service'
import { Input, FormField } from '@/components/FormField'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await loginWithEmail(email, password)
      const uid = result.user.uid
      
      // Check if user profile exists, if not create it
      const existingProfile = await getUserProfile(uid)
      if (!existingProfile) {
        await createUserProfile(uid, {
          email: result.user.email || email,
          displayName: result.user.displayName || 'משתמש',
          role: 'employer',
          defaultLanguage: 'he',
          createdAt: new Date().toISOString()
        })
      }
      
      navigate('/')
    } catch {
      setError('שגיאה בכניסה. בדוק את הפרטים ונסה שוב.')
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="אימייל" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </FormField>
            <FormField label="סיסמה" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </FormField>
            {error && (
              <p className="text-sm text-danger-600 bg-danger-50 rounded-xl px-3 py-2">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? t('common.loading') : 'כניסה למערכת'}
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
