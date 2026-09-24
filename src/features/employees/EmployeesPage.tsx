import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { createEmployee, getEmployees, updateEmployee } from '@/services/firebase/firestore.service'
import {
  createCaregiverAuthAccount,
  createUserProfile,
  createUsernameMapping,
  updateUserProfile,
} from '@/services/firebase/auth.service'
import { FormField, Input, Textarea } from '@/components/FormField'
import { Modal } from '@/components/Modal'
import type { Employee } from '@/types'
import { Plus, Pencil, UserCheck, UserX } from 'lucide-react'

const DEFAULT_VALUES = {
  fullName: '',
  startDate: '',
  baseSalary: 6400,
  pocketMoney: 400,
  shabbatRate: 426,
  vacationDayRate: 250,
  holidayRate: 426,
  partialDayRate: 256,
  pensionRate: 12.5,
  notes: '',
  active: true,
}

type FormValues = typeof DEFAULT_VALUES

export function EmployeesPage() {
  const { t } = useTranslation()
  const { user, currentEmployeeId, setCurrentEmployeeId } = useAppStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [form, setForm] = useState<FormValues>(DEFAULT_VALUES)
  const [username, setUsername] = useState('')
  const [initialPassword, setInitialPassword] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState<'he' | 'en' | 'ru'>('he')
  const [editing, setEditing] = useState<Employee | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getEmployees(user.uid)
      .then((data) => {
        setEmployees(data)
        if (data.length && !currentEmployeeId) setCurrentEmployeeId(data[0].id)
      })
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false))
  }, [currentEmployeeId, setCurrentEmployeeId, t, user])

  function updateField<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    setEditing(null)
    setForm(DEFAULT_VALUES)
    setUsername('')
    setInitialPassword('')
    setPreferredLanguage('he')
    setError('')
    setModalOpen(true)
  }

  function openEdit(employee: Employee) {
    setEditing(employee)
    setForm({
      fullName: employee.fullName,
      startDate: employee.startDate,
      baseSalary: employee.baseSalary,
      pocketMoney: employee.pocketMoney,
      shabbatRate: employee.shabbatRate,
      vacationDayRate: employee.vacationDayRate,
      holidayRate: employee.holidayRate,
      partialDayRate: employee.partialDayRate,
      pensionRate: employee.pensionRate,
      notes: employee.notes ?? '',
      active: employee.active,
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!user || !form.fullName.trim() || !form.startDate) return
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateEmployee(editing.id, form)
        if (editing.userId) await updateUserProfile(editing.userId, { active: form.active })
        setEmployees((current) => current.map((item) => item.id === editing.id ? { ...item, ...form } : item))
      } else {
        if (!username.trim() || initialPassword.length < 6) {
          throw new Error(t('auth.caregiverCredentialsRequired'))
        }
        const account = await createCaregiverAuthAccount(username, initialPassword)
        await createUsernameMapping(username, account.localId, 'caregiver')
        await createUserProfile(account.localId, {
          email: `${username.trim().toLowerCase()}@worker.payment.local`,
          username: username.trim(),
          usernameNormalized: username.trim().toLowerCase(),
          displayName: form.fullName.trim(),
          role: 'caregiver',
          employeeProfileCompleted: true,
          preferredLanguage,
          defaultLanguage: preferredLanguage,
          active: true,
          createdAt: new Date().toISOString(),
        })
        const id = await createEmployee({ ...form, employerId: user.uid, userId: account.localId, active: true })
        await updateUserProfile(account.localId, { employeeId: id })
        const employee: Employee = {
          id,
          employerId: user.uid,
          userId: account.localId,
          ...form,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setEmployees((current) => [...current, employee])
        setCurrentEmployeeId(id)
      }
      setModalOpen(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const numericFields: Array<{ key: keyof FormValues; label: string }> = [
    { key: 'baseSalary', label: t('employees.baseSalary') },
    { key: 'pocketMoney', label: t('employees.pocketMoney') },
    { key: 'shabbatRate', label: t('employees.shabbatRate') },
    { key: 'vacationDayRate', label: t('employees.vacationDayRate') },
    { key: 'holidayRate', label: t('employees.holidayRate') },
    { key: 'partialDayRate', label: t('employees.partialDayRate') },
    { key: 'pensionRate', label: t('employees.pensionRate') },
  ]

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('employees.title')}</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={18} />{t('employees.add')}</button>
      </div>

      {loading ? <p className="text-center text-gray-400 py-8">{t('common.loading')}</p> : (
        <div className="flex flex-col gap-3">
          {employees.length === 0 && <div className="card text-center text-gray-500">{t('employees.noEmployees')}</div>}
          {employees.map((employee) => (
            <div key={employee.id} className={`card flex items-center justify-between gap-3 ${currentEmployeeId === employee.id ? 'border-primary-300 bg-primary-50' : ''}`} onClick={() => setCurrentEmployeeId(employee.id)}>
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  {employee.fullName}
                  {employee.active ? <UserCheck size={16} className="text-success-500" /> : <UserX size={16} className="text-gray-400" />}
                </div>
                <p className="text-xs text-gray-500">{t('employees.startDate')}: {employee.startDate}</p>
              </div>
              <button className="btn-secondary !px-3 !py-2" onClick={(event) => { event.stopPropagation(); openEdit(employee) }}><Pencil size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('employees.edit') : t('employees.add')} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-danger-600 bg-danger-50 rounded-xl px-3 py-2">{error}</p>}
          {!editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('auth.username')} required><Input value={username} onChange={(event) => setUsername(event.target.value)} autoCapitalize="none" required /></FormField>
              <FormField label={t('auth.initialPassword')} required><Input type="password" value={initialPassword} onChange={(event) => setInitialPassword(event.target.value)} minLength={6} autoComplete="new-password" required /></FormField>
              <FormField label={t('auth.preferredLanguage')}>
                <select className="input" value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value as 'he' | 'en' | 'ru')}>
                  <option value="he">עברית</option><option value="en">English</option><option value="ru">Русский</option>
                </select>
              </FormField>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('employees.fullName')} required><Input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} required /></FormField>
            <FormField label={t('employees.startDate')} required><Input type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} required /></FormField>
            {numericFields.map(({ key, label }) => <FormField key={key} label={label}><Input type="number" step="0.1" value={form[key] as number} onChange={(event) => updateField(key, Number(event.target.value))} /></FormField>)}
          </div>
          {editing && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => updateField('active', event.target.checked)} />{t('auth.activeAccount')}</label>}
          <FormField label={t('employees.notes')}><Textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} /></FormField>
          <div className="flex gap-2"><button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button><button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? t('common.loading') : t('common.save')}</button></div>
        </form>
      </Modal>
    </div>
  )
}
