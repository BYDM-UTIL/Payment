import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppStore } from '@/store/useAppStore'
import { getEmployees, createEmployee, updateEmployee } from '@/services/firebase/firestore.service'
import { Modal } from '@/components/Modal'
import { FormField, Input, Textarea } from '@/components/FormField'
import { employeeSchema } from '@/utils/validation'
import type { Employee } from '@/types'
import type { z } from 'zod'
import { Plus, Pencil, UserCheck, UserX } from 'lucide-react'

type EmployeeFormData = z.infer<typeof employeeSchema>

const defaultEmployeeValues: EmployeeFormData = {
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
}

export function EmployeesPage() {
  const { t } = useTranslation()
  const { user, currentEmployeeId, setCurrentEmployeeId } = useAppStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [submitError, setSubmitError] = useState('')

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EmployeeFormData>({
      resolver: zodResolver(employeeSchema),
      mode: 'onChange',
      defaultValues: defaultEmployeeValues,
    })

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getEmployees(user.uid).then((data) => {
      setEmployees(data)
      if (data.length > 0 && !currentEmployeeId) {
        setCurrentEmployeeId(data[0].id)
      }
      setLoading(false)
    })
  }, [user, currentEmployeeId, setCurrentEmployeeId])

  function openAdd() {
    setEditEmployee(null)
    setSubmitError('')
    reset(defaultEmployeeValues)
    setModalOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditEmployee(emp)
    setSubmitError('')
    reset({
      fullName: emp.fullName,
      startDate: emp.startDate,
      baseSalary: emp.baseSalary,
      pocketMoney: emp.pocketMoney,
      shabbatRate: emp.shabbatRate,
      vacationDayRate: emp.vacationDayRate,
      holidayRate: emp.holidayRate,
      partialDayRate: emp.partialDayRate,
      pensionRate: emp.pensionRate,
      notes: emp.notes ?? '',
    })
    setModalOpen(true)
  }

  async function onSubmit(data: EmployeeFormData) {
    setSubmitError('')
    try {
      if (!user) {
        setSubmitError(t('common.error'))
        return
      }
      
      if (editEmployee) {
        await updateEmployee(editEmployee.id, { ...data, updatedAt: new Date().toISOString() })
        setEmployees((prev) => prev.map((e) => e.id === editEmployee.id ? { ...e, ...data } : e))
      } else {
        const id = await createEmployee({ ...data, employerId: user.uid, active: true })
        const newEmp: Employee = {
          id,
          employerId: user.uid,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        }
        setEmployees((prev) => [...prev, newEmp])
        setCurrentEmployeeId(id)
      }
      setModalOpen(false)
      reset(defaultEmployeeValues)
    } catch (error) {
      console.error('Error saving employee:', error)
      setSubmitError(error instanceof Error ? error.message : t('common.error'))
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('employees.title')}</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('employees.add')}
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">{t('common.loading')}</p>
      ) : employees.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-lg mb-4">{t('employees.noEmployees')}</p>
          <button onClick={openAdd} className="btn-primary">{t('employees.add')}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`card flex items-start sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                currentEmployeeId === emp.id ? 'border-primary-300 bg-primary-50' : ''
              }`}
              onClick={() => setCurrentEmployeeId(emp.id)}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{emp.fullName}</span>
                  {emp.active ? (
                    <UserCheck size={16} className="text-success-500" />
                  ) : (
                    <UserX size={16} className="text-gray-400" />
                  )}
                  {currentEmployeeId === emp.id && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">פעיל</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>{t('employees.startDate')}: {emp.startDate}</span>
                  <span>{t('employees.baseSalary')}: ₪{emp.baseSalary.toLocaleString()}</span>
                  <span>{t('employees.pensionRate')}: {emp.pensionRate}%</span>
                </div>
                {emp.notes && <p className="text-xs text-gray-400">{emp.notes}</p>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(emp) }}
                className="btn-secondary !px-3 !py-2 shrink-0"
              >
                <Pencil size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEmployee ? t('employees.edit') : t('employees.add')}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {submitError && (
            <p className="text-sm text-danger-600 bg-danger-50 rounded-xl px-3 py-2">{submitError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('employees.fullName')} required error={errors.fullName?.message}>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => <Input type="text" {...field} error={!!errors.fullName} />}
              />
            </FormField>
            <FormField label={t('employees.startDate')} required error={errors.startDate?.message}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => <Input type="date" {...field} error={!!errors.startDate} />}
              />
            </FormField>
            <FormField label={t('employees.baseSalary')} required error={errors.baseSalary?.message}>
              <Controller
                name="baseSalary"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    error={!!errors.baseSalary}
                  />
                )}
              />
            </FormField>
            <FormField label={t('employees.pocketMoney')} error={errors.pocketMoney?.message}>
              <Controller
                name="pocketMoney"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    error={!!errors.pocketMoney}
                  />
                )}
              />
            </FormField>
            <FormField label={t('employees.shabbatRate')} error={errors.shabbatRate?.message}>
              <Controller
                name="shabbatRate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    error={!!errors.shabbatRate}
                  />
                )}
              />
            </FormField>
            <FormField label={t('employees.vacationDayRate')} error={errors.vacationDayRate?.message}>
              <Controller
                name="vacationDayRate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    error={!!errors.vacationDayRate}
                  />
                )}
              />
            </FormField>
            <FormField label={t('employees.holidayRate')} error={errors.holidayRate?.message}>
              <Controller
                name="holidayRate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    error={!!errors.holidayRate}
                  />
                )}
              />
            </FormField>
            <FormField label={t('employees.partialDayRate')} error={errors.partialDayRate?.message}>
              <Controller
                name="partialDayRate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    error={!!errors.partialDayRate}
                  />
                )}
              />
            </FormField>
            <FormField label={t('employees.pensionRate')} error={errors.pensionRate?.message}>
              <Controller
                name="pensionRate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.1"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    error={!!errors.pensionRate}
                  />
                )}
              />
            </FormField>
          </div>
          <FormField label={t('employees.notes')}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => <Textarea {...field} value={field.value ?? ''} />}
            />
          </FormField>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
