import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { LANGUAGES, getLanguageDir, type SupportedLanguage } from '@/i18n'
import { updateUserLanguage } from '@/services/firebase/auth.service'
import { useEffect } from 'react'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { language, setLanguage, user } = useAppStore()

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = getLanguageDir(language)
    i18n.changeLanguage(language)
  }, [language, i18n])

  async function handleChange(code: SupportedLanguage) {
    setLanguage(code)
    localStorage.setItem('i18nextLng', code)
    if (user) await updateUserLanguage(user.uid, code)
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100/90 rounded-xl p-1 border border-white">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code as SupportedLanguage)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            language === lang.code
              ? 'bg-white text-primary-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
