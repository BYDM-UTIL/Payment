import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { FormField, Input } from '@/components/FormField'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useState } from 'react'

export function SettingsPage() {
  const { t } = useTranslation()
  const { currentYear, setCurrentYear } = useAppStore()
  const [saved, setSaved] = useState(false)

  // Local form state (in a real app this comes from Firestore year settings)
  const [settings, setSettings] = useState({
    baseSalary: 6400,
    pocketMoney: 400,
    shabbatRate: 426,
    vacationRate: 250,
    holidayRate: 426,
    pensionRate: 12.5,
    recuperationRate: 378,
    recuperationDays: 6,
    employerName: 'דותן זיוה',
    employerPhone: '',
    employerEmail: '',
    employeeName: 'KABULOVA MOKHCHEKHRA',
  })

  function handleSave() {
    // In production: save to Firestore year settings
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>

      {/* Language */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">{t('settings.language')}</h2>
        <LanguageSwitcher />
      </div>

      {/* Year */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">{t('settings.year')}</h2>
        <div className="w-40">
          <Input
            type="number"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            min={2020}
            max={2030}
          />
        </div>
      </div>

      {/* Rates */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{t('dashboard.year')} – {currentYear}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: t('settings.baseSalary'), key: 'baseSalary' },
            { label: t('settings.pocketMoney'), key: 'pocketMoney' },
            { label: t('settings.shabbatRate'), key: 'shabbatRate' },
            { label: t('settings.vacationRate'), key: 'vacationRate' },
            { label: t('settings.holidayRate'), key: 'holidayRate' },
            { label: t('settings.pensionRate'), key: 'pensionRate' },
            { label: t('settings.recuperationRate'), key: 'recuperationRate' },
            { label: t('settings.recuperationDays'), key: 'recuperationDays' },
          ].map(({ label, key }) => (
            <FormField key={key} label={label}>
              <Input
                type="number"
                step="0.1"
                value={(settings as Record<string, number | string>)[key] as number}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, [key]: Number(e.target.value) }))
                }
              />
            </FormField>
          ))}
        </div>
      </div>

      {/* Employer */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{t('settings.employerDetails')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('settings.employerName')}>
            <Input
              type="text"
              value={settings.employerName}
              onChange={(e) => setSettings((s) => ({ ...s, employerName: e.target.value }))}
            />
          </FormField>
          <FormField label={t('settings.employerPhone')}>
            <Input
              type="tel"
              value={settings.employerPhone}
              onChange={(e) => setSettings((s) => ({ ...s, employerPhone: e.target.value }))}
            />
          </FormField>
          <FormField label={t('settings.employerEmail')}>
            <Input
              type="email"
              value={settings.employerEmail}
              onChange={(e) => setSettings((s) => ({ ...s, employerEmail: e.target.value }))}
            />
          </FormField>
        </div>
      </div>

      {/* Employee */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{t('settings.employeeDetails')}</h2>
        <FormField label={t('employees.fullName')}>
          <Input
            type="text"
            value={settings.employeeName}
            onChange={(e) => setSettings((s) => ({ ...s, employeeName: e.target.value }))}
          />
        </FormField>
      </div>

      {/* Save button */}
      <div>
        <button onClick={handleSave} className="btn-primary w-full sm:w-auto px-8">
          {saved ? `✓ ${t('settings.saved')}` : t('settings.save')}
        </button>
      </div>
    </div>
  )
}
