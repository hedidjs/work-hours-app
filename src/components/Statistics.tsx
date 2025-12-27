'use client'

import { useState, useMemo } from 'react'
import type { WorkDay, Employer } from '@/lib/api'
import { formatCurrency, formatHours } from '@/lib/calculations'

interface StatisticsProps {
  workDays: WorkDay[]
  employers: Employer[]
}

export function Statistics({ workDays, employers }: StatisticsProps) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)
  const [selectedEmployer, setSelectedEmployer] = useState<string>('')

  const months = useMemo(() => {
    const monthSet = new Set<string>()
    workDays.forEach(day => {
      monthSet.add(day.date.slice(0, 7))
    })
    return Array.from(monthSet).sort().reverse()
  }, [workDays])

  const filteredWorkDays = useMemo(() => {
    return workDays.filter(day => {
      if (selectedMonth && !day.date.startsWith(selectedMonth)) return false
      if (selectedEmployer && day.employerId !== selectedEmployer) return false
      return true
    })
  }, [workDays, selectedMonth, selectedEmployer])

  const stats = useMemo(() => {
    const totalHours = filteredWorkDays.reduce((sum, day) => sum + day.regularHours + day.overtimeHours, 0)
    const regularHours = filteredWorkDays.reduce((sum, day) => sum + day.regularHours, 0)
    const overtimeHours = filteredWorkDays.reduce((sum, day) => sum + day.overtimeHours, 0)
    const totalKm = filteredWorkDays.reduce((sum, day) => sum + day.kilometers, 0)
    const totalBeforeVat = filteredWorkDays.reduce((sum, day) => sum + day.totalBeforeVat, 0)
    const totalWithVat = filteredWorkDays.reduce((sum, day) => sum + day.totalWithVat, 0)
    const workDaysCount = filteredWorkDays.length

    return {
      totalHours,
      regularHours,
      overtimeHours,
      totalKm,
      totalBeforeVat,
      totalWithVat,
      workDaysCount,
    }
  }, [filteredWorkDays])

  const employerStats = useMemo(() => {
    const byEmployer: Record<string, { name: string; total: number; days: number }> = {}

    filteredWorkDays.forEach(day => {
      if (!byEmployer[day.employerId]) {
        const employer = employers.find(e => e.id === day.employerId)
        byEmployer[day.employerId] = {
          name: employer?.name || 'לא ידוע',
          total: 0,
          days: 0,
        }
      }
      byEmployer[day.employerId].total += day.totalWithVat
      byEmployer[day.employerId].days += 1
    })

    return Object.values(byEmployer).sort((a, b) => b.total - a.total)
  }, [filteredWorkDays, employers])

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
    return `${months[parseInt(month) - 1]} ${year}`
  }

  return (
    <div className="pb-4">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">סטטיסטיקות</h2>

      {/* פילטרים */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">חודש</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל התקופה</option>
              {months.map(month => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </div>
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
        </div>
      </div>

      {filteredWorkDays.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
          אין נתונים להצגה
        </div>
      ) : (
        <>
          {/* כרטיסי סטטיסטיקה */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">ימי עבודה</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.workDaysCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">שעות עבודה</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatHours(stats.totalHours)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 hidden md:block">
                רגילות: {formatHours(stats.regularHours)} | נוספות: {formatHours(stats.overtimeHours)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">קילומטרים</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalKm}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">סה&quot;כ הכנסות</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalWithVat)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 hidden md:block">לפני מע&quot;מ: {formatCurrency(stats.totalBeforeVat)}</p>
            </div>
          </div>

          {/* פירוט לפי מעסיק */}
          {employerStats.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 transition-colors">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">פירוט לפי מעסיק</h3>
              <div className="space-y-2 md:space-y-3">
                {employerStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{stat.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.days} ימים</p>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(stat.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
