import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { updateUserProfile } from '@/services/firebase/auth.service'
import { createEmployee } from '@/services/firebase/firestore.service'
import { FormField, Input, Textarea } from '@/components/FormField'
import { CheckCircle } from 'lucide-react'

const profileSchema = z.object({
  firstName: z.string().min(1, 'validation.required'),
  lastName: z.string().min(1, 'validation.required'),
  passport: z.string().min(1, 'validation.required'),
  phone: z.string().min(1, 'validation.required'),
  address: z.string().min(1, 'validation.required'),
  startDate: z.string().min(1, 'validation.required'),
  bankDetails: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

// Default values for salary/rates when creating employee
const DEFAULT_SALARY_VALUES = {
  baseSalary: 6400,
  pocketMoney: 400,
  shabbatRate: 426,
  vacationDayRate: 250,
  holidayRate: 426,
  partialDayRate: 256,
  pensionRate: 12.5,
}

export function CompleteEmployeeProfilePage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      passport: '',
      phone: '',
      address: '',
      startDate: '',
      bankDetails: '',
    },
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    navigate('/login')
    return null
  }

  async function onSubmit(data: ProfileFormData) {
    setSubmitError('')
    setIsSubmitting(true)

    try {
      if (!user) throw new Error('User not found')

      // Create employee record
      const fullName = `${data.firstName} ${data.lastName}`
      const employeeId = await createEmployee({
        employerId: user.uid,
        userId: user.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        passport: data.passport,
        phone: data.phone,
        address: data.address,
        startDate: data.startDate,
        bankDetails: data.bankDetails || undefined,
        ...DEFAULT_SALARY_VALUES,
        active: true,
        notes: '',
      })

      // Update user profile with employeeId and set employeeProfileCompleted to true
      await updateUserProfile(user.uid, {
        employeeId,
        employeeProfileCompleted: true,
      })

      // Redirect to payments page
      navigate('/my-payments')
    } catch (err) {
      console.error('Error completing profile:', err)
      setSubmitError('שגיאה בעת שמירת הפרטים. בדוק את הנתונים ונסה שוב.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.22),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(244,63,94,0.16),_transparent_30%),linear-gradient(180deg,_#fffaf5_0%,_#fff7ed_100%)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white">
            <CheckCircle className="text-primary-700" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">השלמת פרטי עובד</h1>
          <p className="text-gray-600 mt-2">לפני שתוכל להשתמש במערכת, עליך להשלים את פרטיך</p>
        </div>

        <div className="card max-w-md mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="שם פרטי" required>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="דוגמה"
                      autoComplete="given-name"
                      required
                    />
                  )}
                />
                {errors.firstName && <p className="text-xs text-danger-600 mt-1">{errors.firstName.message}</p>}
              </FormField>

              <FormField label="שם משפחה" required>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="כהן"
                      autoComplete="family-name"
                      required
                    />
                  )}
                />
                {errors.lastName && <p className="text-xs text-danger-600 mt-1">{errors.lastName.message}</p>}
              </FormField>
            </div>

            <FormField label="מספר דרכון / ID" required>
              <Controller
                name="passport"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="001234567"
                    autoComplete="off"
                    required
                  />
                )}
              />
              {errors.passport && <p className="text-xs text-danger-600 mt-1">{errors.passport.message}</p>}
            </FormField>

            <FormField label="טלפון" required>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="tel"
                    placeholder="050-1234567"
                    autoComplete="tel"
                    required
                  />
                )}
              />
              {errors.phone && <p className="text-xs text-danger-600 mt-1">{errors.phone.message}</p>}
            </FormField>

            <FormField label="כתובת" required>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="רחוב 123, בנין 4, דירה 5"
                    autoComplete="street-address"
                    required
                  />
                )}
              />
              {errors.address && <p className="text-xs text-danger-600 mt-1">{errors.address.message}</p>}
            </FormField>

            <FormField label="תאריך תחילת עבודה" required>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    required
                  />
                )}
              />
              {errors.startDate && <p className="text-xs text-danger-600 mt-1">{errors.startDate.message}</p>}
            </FormField>

            <FormField label="פרטי חשבון בנק" required={false}>
              <Controller
                name="bankDetails"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="מספר חשבון, סניף, בנק..."
                    rows={2}
                  />
                )}
              />
              {errors.bankDetails && <p className="text-xs text-danger-600 mt-1">{errors.bankDetails.message}</p>}
            </FormField>

            {submitError && (
              <p className="text-sm text-danger-600 bg-danger-50 rounded-xl px-3 py-2">{submitError}</p>
            )}

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'שומר...' : 'שמור פרטים והמשך'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-2">
              הפרטים שלך מוגנים ומשמשים רק לניהול תשלומים ברמת האבטחה הגבוהה ביותר
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
