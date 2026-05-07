import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { usePayments } from '@/hooks/usePayments'
import { usePension } from '@/hooks/usePension'
import { formatCurrency } from '@/utils/calculations'
import { FileDown, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

export function ReportsPage() {
  const { t } = useTranslation()
  const { currentEmployeeId, currentYear } = useAppStore()
  const { payments, summary } = usePayments(currentEmployeeId, currentYear)
  const { payments: pensionPayments, summary: pensionSummary } = usePension(currentEmployeeId, currentYear)
  const [generating, setGenerating] = useState<string | null>(null)

  async function generateAnnualPDF() {
    setGenerating('annual')
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(18)
    doc.text(`דוח תשלומים שנתי - ${currentYear}`, 14, 20)

    const rows = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const p = payments.find((pay) => pay.month === m)
      return [
        MONTHS_HE[i],
        p?.baseSalary?.toLocaleString() ?? '—',
        p?.pocketMoney?.toLocaleString() ?? '—',
        p?.shabbatAmount?.toLocaleString() ?? '—',
        p?.grossTotal?.toLocaleString() ?? '—',
        p?.cashPaid?.toLocaleString() ?? '—',
        p?.payslipPaid?.toLocaleString() ?? '—',
        p?.bankTransferPaid?.toLocaleString() ?? '—',
        p?.totalPaid?.toLocaleString() ?? '—',
        p?.balanceDue?.toLocaleString() ?? '—',
        p?.paymentStatus ? t(`status.${p.paymentStatus}`) : t('status.empty'),
      ]
    })

    autoTable(doc, {
      head: [['חודש', 'שכר בסיס', 'דמי כיס', 'שבת', 'ברוטו', 'מזומן', 'תלוש', 'בנק', 'שולם', 'יתרה', 'סטטוס']],
      body: rows,
      startY: 30,
    })

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 150
    doc.setFontSize(11)
    doc.text(`סה"כ ברוטו: ${formatCurrency(summary.annualGrossTotal)}`, 14, finalY + 10)
    doc.text(`סה"כ שולם: ${formatCurrency(summary.annualTotalPaid)}`, 14, finalY + 18)
    doc.text(`יתרה: ${formatCurrency(summary.annualBalanceDue)}`, 14, finalY + 26)

    doc.save(`payments_${currentYear}.pdf`)
    setGenerating(null)
  }

  async function generatePensionPDF() {
    setGenerating('pension')
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`דוח פנסיה שנתי - ${currentYear}`, 14, 20)

    const rows = pensionPayments.map((p) => [
      MONTHS_HE[p.month - 1],
      p.baseSalary.toLocaleString(),
      p.requiredPensionAmount.toLocaleString(),
      p.amountPaid.toLocaleString(),
      p.balanceDue.toLocaleString(),
      p.paymentDate ?? '—',
      p.paymentProvider ?? '—',
    ])

    autoTable(doc, {
      head: [['חודש', 'שכר בסיס', 'חובה 12.5%', 'שולם', 'יתרה', 'תאריך', 'גורם']],
      body: rows,
      startY: 30,
    })

    doc.save(`pension_${currentYear}.pdf`)
    setGenerating(null)
  }

  async function generateExcel() {
    setGenerating('excel')
    const wsData = [
      ['חודש', 'שכר בסיס', 'דמי כיס', 'שבת', 'חופש', 'חג', 'ברוטו', 'מזומן', 'תלוש', 'בנק', 'שולם', 'יתרה', 'סטטוס'],
      ...Array.from({ length: 12 }, (_, i) => {
        const m = i + 1
        const p = payments.find((pay) => pay.month === m)
        return [
          MONTHS_HE[i],
          p?.baseSalary ?? 0,
          p?.pocketMoney ?? 0,
          p?.shabbatAmount ?? 0,
          p?.vacationAmount ?? 0,
          p?.holidayAmount ?? 0,
          p?.grossTotal ?? 0,
          p?.cashPaid ?? 0,
          p?.payslipPaid ?? 0,
          p?.bankTransferPaid ?? 0,
          p?.totalPaid ?? 0,
          p?.balanceDue ?? 0,
          p ? t(`status.${p.paymentStatus}`) : t('status.empty'),
        ]
      }),
      [],
      ['', '', '', '', '', '', 'סה"כ ברוטו', '', '', '', 'סה"כ שולם', 'יתרה'],
      ['', '', '', '', '', '', summary.annualGrossTotal, '', '', '', summary.annualTotalPaid, summary.annualBalanceDue],
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, `תשלומים ${currentYear}`)

    // Pension sheet
    const pensionData = [
      ['חודש', 'שכר בסיס', 'חובה 12.5%', 'שולם', 'יתרה', 'תאריך', 'גורם'],
      ...pensionPayments.map((p) => [
        MONTHS_HE[p.month - 1],
        p.baseSalary,
        p.requiredPensionAmount,
        p.amountPaid,
        p.balanceDue,
        p.paymentDate ?? '',
        p.paymentProvider ?? '',
      ]),
      [],
      ['', 'סה"כ', pensionSummary.totalRequired, pensionSummary.totalPaid, pensionSummary.totalBalance],
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(pensionData)
    XLSX.utils.book_append_sheet(wb, ws2, `פנסיה ${currentYear}`)

    XLSX.writeFile(wb, `worker_payments_${currentYear}.xlsx`)
    setGenerating(null)
  }

  const reports = [
    { key: 'annual', label: t('reports.annual'), action: generateAnnualPDF, icon: '📄' },
    { key: 'pension', label: t('reports.pension'), action: generatePensionPDF, icon: '🏦' },
    { key: 'excel', label: t('reports.excel'), action: generateExcel, icon: '📊' },
  ]

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(({ key, label, action, icon }) => (
          <div key={key} className="card flex flex-col gap-3">
            <div className="text-3xl">{icon}</div>
            <p className="font-semibold text-gray-800">{label}</p>
            <button
              onClick={action}
              disabled={!!generating}
              className="btn-primary flex items-center justify-center gap-2 mt-auto"
            >
              {generating === key ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('reports.generating')}
                </>
              ) : (
                <>
                  <FileDown size={16} />
                  {t('reports.generate')}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Summary for reference */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">{t('payments.yearlyOverview')} – {currentYear}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.annualGross')}</p>
            <p className="font-bold text-gray-800">{formatCurrency(summary.annualGrossTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.annualPaid')}</p>
            <p className="font-bold text-green-700">{formatCurrency(summary.annualTotalPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.annualBalance')}</p>
            <p className="font-bold text-red-600">{formatCurrency(summary.annualBalanceDue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.pensionBalance')}</p>
            <p className="font-bold text-amber-700">{formatCurrency(pensionSummary.totalBalance)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
