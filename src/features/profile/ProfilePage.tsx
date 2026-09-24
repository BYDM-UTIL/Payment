import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { changeOwnPassword, updateUserProfile } from '@/services/firebase/auth.service'
import { useAppStore } from '@/store/useAppStore'
import { Input, FormField } from '@/components/FormField'

export function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAppStore()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 6 || password !== confirmation) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setSaving(true)
    try {
      await changeOwnPassword(password)
      if (user) await updateUserProfile(user.uid, { displayName: user.displayName })
      setPassword('')
      setConfirmation('')
      setMessage(t('auth.passwordChanged'))
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg flex flex-col gap-6 pb-20 sm:pb-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
      <div className="card">
        <p className="font-semibold text-gray-800 mb-1">{user?.displayName}</p>
        <p className="text-sm text-gray-500 mb-6">{user?.username}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label={t('auth.newPassword')} required><Input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></FormField>
          <FormField label={t('auth.confirmPassword')} required><Input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required /></FormField>
          {error && <p className="text-sm text-danger-600 bg-danger-50 rounded-xl px-3 py-2">{error}</p>}
          {message && <p className="text-sm text-success-700 bg-success-50 rounded-xl px-3 py-2">{message}</p>}
          <button className="btn-primary" disabled={saving}>{saving ? t('common.loading') : t('auth.changePassword')}</button>
        </form>
      </div>
    </div>
  )
}
