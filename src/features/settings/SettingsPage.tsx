import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { FormField, Input } from '@/components/FormField'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useEffect, useState } from 'react'
import { getYearSettings, setYearSettings, getEmployee, updateEmployee } from '@/services/firebase/firestore.service'

interface RateSettings {
  baseSalary: number
  pocketMoney: number
  shabbatRate: number
  vacationDayRate: number
  holidayRate: number
  pensionRate: number
  recuperationDayRate: number
  recuperationDays: number
}

const DEFAULT_RATES: RateSettings = {
  baseSalary: 6400,
  pocketMoney: 400,
  shabbatRate: 426,
  vacationDayRate: 250,
  holidayRate: 426,
  pensionRate: 12.5,
  recuperationDayRate: 378,
  recuperationDays: 6,
}

export function SettingsPage() {
  const { t } = useTranslation()
  const { currentYear, setCurrentYear, currentEmployeeId } = useAppStore()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rates, setRates] = useState<RateSettings>(DEFAULT_RATES)
  const [employeeName, setEmployeeName] = useState('')

  // Load persisted year settings + employee name from Firestore
  useEffect(() => {
    let active = true
    async function load() {
      if (!currentEmployeeId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const [settings, employee] = await Promise.all([
          getYearSettings(currentEmployeeId, currentYear),
          getEmployee(currentEmployeeId),
        ])
        if (!active) return
        if (settings) {
          setRates({
            baseSalary: settings.baseSalary ?? DEFAULT_RATES.baseSalary,
            pocketMoney: settings.pocketMoney ?? DEFAULT_RATES.pocketMoney,
            shabbatRate: settings.shabbatRate ?? DEFAULT_RATES.shabbatRate,
            vacationDayRate: settings.vacationDayRate ?? DEFAULT_RATES.vacationDayRate,
            holidayRate: settings.holidayRate ?? DEFAULT_RATES.holidayRate,
            pensionRate: settings.pensionRate ?? DEFAULT_RATES.pensionRate,
            recuperationDayRate: settings.recuperationDayRate ?? DEFAULT_RATES.recuperationDayRate,
            recuperationDays: settings.recuperationDays ?? DEFAULT_RATES.recuperationDays,
          })
        }
        if (employee) setEmployeeName(employee.fullName ?? '')
      } catch (err) {
        console.error('[Settings] Failed to load settings:', err)
        if (active) setError(t('settings.loadError'))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [currentEmployeeId, currentYear, t])

  async function handleSave() {
    if (!currentEmployeeId) {
      setError(t('settings.noEmployee'))
      return
    }
    setSaving(true)
    setError('')
    try {
      await setYearSettings(currentEmployeeId, currentYear, rates)
      if (employeeName.trim()) {
        await updateEmployee(currentEmployeeId, { fullName: employeeName.trim() })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('[Settings] Failed to save settings:', err)
      setError(t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const rateFields: { label: string; key: keyof RateSettings }[] = [
    { label: t('settings.baseSalary'), key: 'baseSalary' },
    { label: t('settings.pocketMoney'), key: 'pocketMoney' },
    { label: t('settings.shabbatRate'), key: 'shabbatRate' },
    { label: t('settings.vacationRate'), key: 'vacationDayRate' },
    { label: t('settings.holidayRate'), key: 'holidayRate' },
    { label: t('settings.pensionRate'), key: 'pensionRate' },
    { label: t('settings.recuperationRate'), key: 'recuperationDayRate' },
    { label: t('settings.recuperationDays'), key: 'recuperationDays' },
  ]

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
        {loading ? (
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {rateFields.map(({ label, key }) => (
              <FormField key={key} label={label}>
                <Input
                  type="number"
                  step="0.1"
                  value={rates[key]}
                  onChange={(e) =>
                    setRates((s) => ({ ...s, [key]: Number(e.target.value) }))
                  }
                />
              </FormField>
            ))}
          </div>
        )}
      </div>

      {/* Employee */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{t('settings.employeeDetails')}</h2>
        <FormField label={t('employees.fullName')}>
          <Input
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
          />
        </FormField>
      </div>

      {error && (
        <p className="text-sm text-danger-600 bg-danger-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Save button */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving || loading || !currentEmployeeId}
          className="btn-primary w-full sm:w-auto px-8 disabled:opacity-50"
        >
          {saving ? t('common.loading') : saved ? `✓ ${t('settings.saved')}` : t('settings.save')}
        </button>
        {!currentEmployeeId && (
          <p className="text-xs text-gray-500 mt-2">{t('settings.noEmployee')}</p>
        )}
      </div>
    </div>
  )
}
