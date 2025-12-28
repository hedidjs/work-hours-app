import type { Employer } from './api'

export function calculateHours(startTime: string, endTime: string, dailyHours: number = 12): { totalHours: number; regularHours: number; overtimeHours: number } {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  let startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM

  // אם שעת הסיום קטנה משעת ההתחלה, זה אומר שעברנו יום
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  const totalMinutes = endMinutes - startMinutes
  const totalHours = totalMinutes / 60

  const regularHours = Math.min(totalHours, dailyHours)
  const overtimeHours = Math.max(0, totalHours - dailyHours)

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100
  }
}

export function calculatePayment(
  regularHours: number,
  overtimeHours: number,
  kilometers: number,
  employer: Employer,
  selectedBonuses: string[] = [],
  customDailyRate?: number
): { totalBeforeVat: number; totalWithVat: number; bonusesTotal: number } {
  // יומית עבודה (אם עבד לפחות שעה אחת, מקבל יומית מלאה)
  // אם יש מחיר יומית מותאם, משתמשים בו, אחרת לוקחים מהמעסיק
  const dailyRate = customDailyRate !== undefined ? customDailyRate : employer.dailyRate
  const dailyPay = regularHours > 0 ? dailyRate : 0

  // שעות נוספות
  const overtimePay = overtimeHours * employer.overtimeRate

  // נסיעות
  const kmPay = kilometers * employer.kmRate

  // תוספות
  const bonusesTotal = (employer.bonuses || [])
    .filter(b => selectedBonuses.includes(b.id))
    .reduce((sum, b) => sum + b.amount, 0)

  const totalBeforeVat = dailyPay + overtimePay + kmPay + bonusesTotal
  const totalWithVat = totalBeforeVat * (1 + employer.vatPercent / 100)

  return {
    totalBeforeVat: Math.round(totalBeforeVat * 100) / 100,
    totalWithVat: Math.round(totalWithVat * 100) / 100,
    bonusesTotal: Math.round(bonusesTotal * 100) / 100
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS'
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

export function formatHours(hours: number): string {
  // מציג שעות כמספר עשרוני: 10 או 13.5 (לא כפורמט שעה)
  if (hours === Math.floor(hours)) {
    return hours.toString()
  }
  return hours.toFixed(1).replace(/\.0$/, '')
}

// מחזיר את כל המיקומים מיום עבודה (מכל הנקודות)
export function getWorkDayLocations(day: { location: string; segments?: { location: string }[] }): string {
  // אם יש נקודות עבודה, נלקח את המיקומים מהן
  if (day.segments && day.segments.length > 0) {
    const locations = day.segments
      .map(seg => seg.location)
      .filter(loc => loc && loc.trim() !== '')

    // הסר כפילויות
    const uniqueLocations = [...new Set(locations)]

    if (uniqueLocations.length > 0) {
      return uniqueLocations.join(', ')
    }
  }

  // אחרת, נחזיר את המיקום הראשי
  return day.location || ''
}

// חישוב שעות עם תמיכה במספר נקודות עבודה
export interface SegmentForCalc {
  startTime: string
  endTime: string
  customDailyRate?: number
  selectedBonuses?: string[]
}

export function calculateMultiSegmentHours(
  segments: SegmentForCalc[],
  _mode: 'combined' | 'separate',
  dailyHours: number = 12
): { totalHours: number; regularHours: number; overtimeHours: number } {
  if (segments.length === 0) {
    return { totalHours: 0, regularHours: 0, overtimeHours: 0 }
  }

  // תמיד מחשבים את סכום השעות בפועל מכל הנקודות
  // ההבדל בין "ביחד" ל"בנפרד" הוא רק במספר היומיות, לא בחישוב השעות
  let totalHours = 0

  for (const segment of segments) {
    const hours = calculateHours(segment.startTime, segment.endTime, dailyHours)
    totalHours += hours.totalHours
  }

  const regularHours = Math.min(totalHours, dailyHours)
  const overtimeHours = Math.max(0, totalHours - dailyHours)

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100
  }
}

// חישוב תשלום עם תמיכה במספר נקודות עבודה
export function calculateMultiSegmentPayment(
  segments: SegmentForCalc[],
  mode: 'combined' | 'separate',
  kilometers: number,
  employer: Employer
): { totalBeforeVat: number; totalWithVat: number; bonusesTotal: number; regularHours: number; overtimeHours: number } {
  if (segments.length === 0) {
    return { totalBeforeVat: 0, totalWithVat: 0, bonusesTotal: 0, regularHours: 0, overtimeHours: 0 }
  }

  const dailyHours = employer.dailyHours || 12
  const hours = calculateMultiSegmentHours(segments, mode, dailyHours)

  let dailyPay = 0

  if (mode === 'separate') {
    // בחישוב נפרד: כל נקודה עם יומית משלה
    for (const segment of segments) {
      const segmentHours = calculateHours(segment.startTime, segment.endTime, dailyHours)
      if (segmentHours.totalHours > 0) {
        // בודקים null וגם undefined
        const rate = (segment.customDailyRate != null && segment.customDailyRate > 0)
          ? segment.customDailyRate
          : employer.dailyRate
        dailyPay += rate
      }
    }
  } else {
    // בחישוב ביחד:
    // אם יש יומיות מותאמות בנקודות - סוכמים את כולן
    // אם אין - משתמשים ביומית אחת של המעסיק
    if (hours.regularHours > 0) {
      const hasAnyCustomRate = segments.some(seg => seg.customDailyRate != null && seg.customDailyRate > 0)

      if (hasAnyCustomRate) {
        // יש לפחות נקודה אחת עם יומית מותאמת - סוכמים את כל היומיות
        for (const segment of segments) {
          const segmentHours = calculateHours(segment.startTime, segment.endTime, dailyHours)
          if (segmentHours.totalHours > 0) {
            const rate = (segment.customDailyRate != null && segment.customDailyRate > 0)
              ? segment.customDailyRate
              : employer.dailyRate
            dailyPay += rate
          }
        }
      } else {
        // אין יומיות מותאמות - יומית אחת של המעסיק
        dailyPay = employer.dailyRate
      }
    }
  }

  // שעות נוספות
  const overtimePay = hours.overtimeHours * employer.overtimeRate

  // נסיעות
  const kmPay = kilometers * employer.kmRate

  // תוספות - איסוף מכל הנקודות
  let bonusesTotal = 0
  for (const segment of segments) {
    const segmentBonuses = segment.selectedBonuses || []
    const segmentBonusAmount = (employer.bonuses || [])
      .filter(b => segmentBonuses.includes(b.id))
      .reduce((sum, b) => sum + b.amount, 0)
    bonusesTotal += segmentBonusAmount
  }

  const totalBeforeVat = dailyPay + overtimePay + kmPay + bonusesTotal
  const totalWithVat = totalBeforeVat * (1 + employer.vatPercent / 100)

  return {
    totalBeforeVat: Math.round(totalBeforeVat * 100) / 100,
    totalWithVat: Math.round(totalWithVat * 100) / 100,
    bonusesTotal: Math.round(bonusesTotal * 100) / 100,
    regularHours: hours.regularHours,
    overtimeHours: hours.overtimeHours
  }
}
