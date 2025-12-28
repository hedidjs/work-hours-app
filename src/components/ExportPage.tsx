'use client'

import { useState, useMemo } from 'react'
import type { WorkDay, Employer, BusinessDetails } from '@/lib/api'
import { formatDate, formatCurrency, formatHours, getWorkDayLocations } from '@/lib/calculations'
import { generatePDF } from '@/lib/pdfGenerator'

interface ExportPageProps {
  workDays: WorkDay[]
  employers: Employer[]
  businessDetails: BusinessDetails
}

export function ExportPage({ workDays, employers, businessDetails }: ExportPageProps) {
  const [selectedEmployer, setSelectedEmployer] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // הנחה
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed')
  const [discountValue, setDiscountValue] = useState<string>('')
  const [discountReason, setDiscountReason] = useState<string>('')

  const filteredWorkDays = useMemo(() => {
    // תיקון אוטומטי אם התאריכים הפוכים
    let fromDate = startDate
    let toDate = endDate
    if (startDate && endDate && startDate > endDate) {
      fromDate = endDate
      toDate = startDate
    }

    return workDays
      .filter(day => {
        if (selectedEmployer && day.employerId !== selectedEmployer) return false
        if (fromDate && day.date < fromDate) return false
        if (toDate && day.date > toDate) return false
        return true
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [workDays, selectedEmployer, startDate, endDate])

  const totals = useMemo(() => {
    return filteredWorkDays.reduce(
      (acc, day) => ({
        hours: acc.hours + day.regularHours + day.overtimeHours,
        km: acc.km + day.kilometers,
        beforeVat: acc.beforeVat + day.totalBeforeVat,
        withVat: acc.withVat + day.totalWithVat,
      }),
      { hours: 0, km: 0, beforeVat: 0, withVat: 0 }
    )
  }, [filteredWorkDays])

  const selectedEmployerData = useMemo(() => {
    return employers.find(e => e.id === selectedEmployer)
  }, [employers, selectedEmployer])

  // חישוב הנחה וסכומים סופיים
  const discountedTotals = useMemo(() => {
    const discountNum = parseFloat(discountValue) || 0
    let discountAmount = 0

    if (discountNum > 0) {
      if (discountType === 'fixed') {
        discountAmount = discountNum
      } else {
        // אחוזים - מחושב על הסכום לפני מע"מ
        discountAmount = (totals.beforeVat * discountNum) / 100
      }
    }

    const beforeVatAfterDiscount = totals.beforeVat - discountAmount
    const vatPercent = selectedEmployerData?.vatPercent || 17
    const vatAmount = beforeVatAfterDiscount * (vatPercent / 100)
    const withVatAfterDiscount = beforeVatAfterDiscount + vatAmount

    return {
      discountAmount,
      beforeVat: beforeVatAfterDiscount,
      vatAmount,
      withVat: withVatAfterDiscount,
    }
  }, [totals.beforeVat, discountType, discountValue, selectedEmployerData])

  const handleExport = async () => {
    if (filteredWorkDays.length === 0) {
      alert('אין נתונים לייצוא')
      return
    }

    // תיקון התאריכים אם הפוכים
    let fromDate = startDate
    let toDate = endDate
    if (startDate && endDate && startDate > endDate) {
      fromDate = endDate
      toDate = startDate
    }

    setIsGenerating(true)
    console.log('Starting PDF generation...')
    try {
      await generatePDF({
        workDays: filteredWorkDays,
        employer: selectedEmployerData,
        businessDetails,
        totals,
        startDate: fromDate,
        endDate: toDate,
        discount: discountedTotals.discountAmount > 0 ? {
          type: discountType,
          value: parseFloat(discountValue) || 0,
          amount: discountedTotals.discountAmount,
          reason: discountReason,
        } : undefined,
        finalTotals: discountedTotals,
      })
      console.log('PDF generation completed successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('שגיאה ביצירת ה-PDF: ' + (error instanceof Error ? error.message : String(error)))
    }
    setIsGenerating(false)
  }

  return (
    <div className="pb-4">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">ייצוא דוח</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors mb-4 md:mb-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">בחירת נתונים לייצוא</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מעסיק</label>
            <select
              value={selectedEmployer}
              onChange={(e) => setSelectedEmployer(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל המעסיקים</option>
              {employers.map(employer => (
                <option key={employer.id} value={employer.id}>
                  {employer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מתאריך</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">עד תאריך</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* הנחה */}
        {filteredWorkDays.length > 0 && (
          <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6 bg-orange-50 dark:bg-orange-900/20">
            <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-3 text-sm md:text-base">הנחה (אופציונלי)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סוג הנחה</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percent')}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="fixed">סכום קבוע (₪)</option>
                  <option value="percent">אחוזים (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {discountType === 'fixed' ? 'סכום הנחה (₪)' : 'אחוז הנחה (%)'}
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'fixed' ? '0' : '0'}
                  min="0"
                  step={discountType === 'fixed' ? '1' : '0.1'}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סיבת ההנחה</label>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="לדוגמה: הנחת לקוח קבוע"
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            {discountedTotals.discountAmount > 0 && (
              <div className="mt-3 text-sm text-orange-700 dark:text-orange-400">
                סכום ההנחה: {formatCurrency(discountedTotals.discountAmount)}
              </div>
            )}
          </div>
        )}

        {/* תצוגה מקדימה */}
        {filteredWorkDays.length > 0 ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3 text-sm md:text-base">תצוגה מקדימה ({filteredWorkDays.length} ימים)</h4>

            {/* Mobile cards view */}
            <div className="md:hidden space-y-2">
              {filteredWorkDays.map(day => (
                <div key={day.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{formatDate(day.date)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{getWorkDayLocations(day) || '-'}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm text-green-600 dark:text-green-400">{formatCurrency(day.totalWithVat)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatHours(day.regularHours + day.overtimeHours)} שעות</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">תאריך</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">מיקום</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">שעות</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">נוספות</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">ק&quot;מ</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">סכום</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredWorkDays.map(day => (
                    <tr key={day.id}>
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{formatDate(day.date)}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{getWorkDayLocations(day) || '-'}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{formatHours(day.regularHours + day.overtimeHours)}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{day.overtimeHours > 0 ? formatHours(day.overtimeHours) : '-'}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{day.kilometers > 0 ? day.kilometers : '-'}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{formatCurrency(day.totalBeforeVat)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700 font-medium">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-gray-900 dark:text-white">סה&quot;כ</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{formatHours(totals.hours)}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">-</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{totals.km > 0 ? totals.km : '-'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{formatCurrency(totals.beforeVat)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-3 md:mt-4 text-xs md:text-sm bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">סה&quot;כ לפני מע&quot;מ:</span>
                  <span className="font-medium mr-1 md:mr-2 text-gray-900 dark:text-white">{formatCurrency(totals.beforeVat)}</span>
                </div>
                {discountedTotals.discountAmount > 0 && (
                  <div>
                    <span className="text-orange-600 dark:text-orange-400">הנחה:</span>
                    <span className="font-medium mr-1 md:mr-2 text-orange-600 dark:text-orange-400">-{formatCurrency(discountedTotals.discountAmount)}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">מע&quot;מ:</span>
                  <span className="font-medium mr-1 md:mr-2 text-gray-900 dark:text-white">{formatCurrency(discountedTotals.vatAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">סה&quot;כ לתשלום:</span>
                  <span className="font-medium mr-1 md:mr-2 text-green-600 dark:text-green-400">{formatCurrency(discountedTotals.withVat)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 md:p-8 text-center text-gray-500 dark:text-gray-400 mb-4 md:mb-6">
            אין נתונים לייצוא לפי הסינון שנבחר
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={filteredWorkDays.length === 0 || isGenerating}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              יוצר PDF...
            </>
          ) : (
            <>
              📄 ייצוא ל-PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}
