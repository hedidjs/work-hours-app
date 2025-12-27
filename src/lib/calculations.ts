import type { Employer } from './api'

export function calculateHours(startTime: string, endTime: string): { totalHours: number; regularHours: number; overtimeHours: number } {
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

  const regularHours = Math.min(totalHours, 12)
  const overtimeHours = Math.max(0, totalHours - 12)

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
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
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
  _mode: 'combined' | 'separate'
): { totalHours: number; regularHours: number; overtimeHours: number } {
  if (segments.length === 0) {
    return { totalHours: 0, regularHours: 0, overtimeHours: 0 }
  }

  // תמיד מחשבים את סכום השעות בפועל מכל הנקודות
  // ההבדל בין "ביחד" ל"בנפרד" הוא רק במספר היומיות, לא בחישוב השעות
  let totalHours = 0

  for (const segment of segments) {
    const hours = calculateHours(segment.startTime, segment.endTime)
    totalHours += hours.totalHours
  }

  const regularHours = Math.min(totalHours, 12)
  const overtimeHours = Math.max(0, totalHours - 12)

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

  const hours = calculateMultiSegmentHours(segments, mode)

  let dailyPay = 0

  if (mode === 'separate') {
    // בחישוב נפרד: כל נקודה עם יומית משלה
    for (const segment of segments) {
      const segmentHours = calculateHours(segment.startTime, segment.endTime)
      if (segmentHours.totalHours > 0) {
        const rate = segment.customDailyRate !== undefined ? segment.customDailyRate : employer.dailyRate
        dailyPay += rate
      }
    }
  } else {
    // בחישוב ביחד: יומית אחת (עם מחיר מותאם אם יש בנקודה הראשונה)
    if (hours.regularHours > 0) {
      const customRate = segments[0]?.customDailyRate
      dailyPay = customRate !== undefined ? customRate : employer.dailyRate
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
