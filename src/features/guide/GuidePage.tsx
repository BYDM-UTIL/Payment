import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

const guideKeys = [
  'howToAdd',
  'howToChooseMethod',
  'howSignature',
  'howPension',
  'howColors',
  'howShabbat',
  'howVacation',
  'howHoliday',
  'howAttach',
  'howExport',
] as const

export function GuidePage() {
  const { t } = useTranslation()
  const [openItem, setOpenItem] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4 pb-20 sm:pb-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('guide.title')}</h1>

      <div className="flex flex-col gap-2">
        {guideKeys.map((key) => {
          const isOpen = openItem === key
          return (
            <div key={key} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between text-start"
                onClick={() => setOpenItem(isOpen ? null : key)}
              >
                <span className="font-medium text-gray-800">{t(`guide.${key}`)}</span>
                {isOpen ? (
                  <ChevronUp size={18} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400 shrink-0" />
                )}
              </button>
              <div
                className={clsx(
                  'overflow-hidden transition-all duration-200',
                  isOpen ? 'max-h-96 mt-3' : 'max-h-0'
                )}
              >
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t(`guide.${key}_content`)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Color legend */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">{t('guide.howColors')}</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-success-500" />
            <span>{t('status.paid')} – {t('guide.howColors_content').split('.')[0]}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-danger-500" />
            <span>{t('status.partial')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-warning-500" />
            <span>{t('status.pending')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-gray-300" />
            <span>{t('status.empty')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
