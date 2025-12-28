import jsPDF from 'jspdf'
import type { WorkDay, Employer, BusinessDetails } from './api'
import { formatDate, formatCurrency, formatHours, getWorkDayLocations, getWorkDayTimeRanges } from './calculations'

interface PDFData {
  workDays: WorkDay[]
  employer?: Employer
  businessDetails: BusinessDetails
  totals: {
    hours: number
    km: number
    beforeVat: number
    withVat: number
  }
  startDate: string
  endDate: string
  discount?: {
    type: 'fixed' | 'percent'
    value: number
    amount: number
    reason: string
  }
  finalTotals?: {
    discountAmount: number
    beforeVat: number
    vatAmount: number
    withVat: number
  }
}

// פונקציה להצגת תוספות של יום עבודה
function getBonusesText(day: WorkDay, employer?: Employer): string {
  if (!employer || !employer.bonuses || employer.bonuses.length === 0) return '-'

  // איסוף תוספות מכל הנקודות
  let allSelectedBonuses: string[] = []

  if (day.segments && day.segments.length > 0) {
    for (const segment of day.segments) {
      if (segment.selectedBonuses) {
        allSelectedBonuses = [...allSelectedBonuses, ...segment.selectedBonuses]
      }
    }
  } else {
    allSelectedBonuses = day.selectedBonuses || []
  }

  if (allSelectedBonuses.length === 0) return '-'

  const bonusNames = employer.bonuses
    .filter(b => allSelectedBonuses.includes(b.id))
    .map(b => b.name)

  // הסרת כפילויות
  const uniqueBonusNames = [...new Set(bonusNames)]
  return uniqueBonusNames.length > 0 ? uniqueBonusNames.join(', ') : '-'
}

export async function generatePDF(data: PDFData): Promise<void> {
  const { workDays, employer, businessDetails, totals, startDate, endDate, discount, finalTotals } = data

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // טעינת פונט עברי (אם יש)
  // נשתמש בכיוון RTL ידני

  // חישוב מספר העמודים הנדרש
  const rowHeight = 8
  const headerHeight = 85 // גובה הכותרת והלוגו
  const footerHeight = 15 // גובה הפוטר
  const tableHeaderHeight = 10
  const availableHeightFirstPage = pageHeight - margin - headerHeight - footerHeight - tableHeaderHeight
  const availableHeightOtherPages = pageHeight - margin - 40 - footerHeight - tableHeaderHeight // 40 = כותרת קטנה

  const rowsFirstPage = Math.floor(availableHeightFirstPage / rowHeight)
  const rowsOtherPages = Math.floor(availableHeightOtherPages / rowHeight)

  const totalDataRows = workDays.length + 1 // +1 לשורת סיכום

  let totalPages = 1
  if (totalDataRows > rowsFirstPage) {
    totalPages = 1 + Math.ceil((totalDataRows - rowsFirstPage) / rowsOtherPages)
  }

  // הוספת דפי סיכום אם צריך
  const needsSummaryPage = totalPages === 1 && totalDataRows > rowsFirstPage - 8

  let currentPage = 1
  let currentRowIndex = 0
  let y = margin

  // פונקציה לציור כותרת
  const drawHeader = (isFirstPage: boolean) => {
    y = margin

    if (isFirstPage) {
      // כותרת ראשית
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('דוח שעות עבודה', pageWidth - margin, y + 5, { align: 'right' })

      // לוגו (אם יש)
      if (businessDetails.logo) {
        try {
          pdf.addImage(businessDetails.logo, 'PNG', margin, y, 40, 25)
        } catch (e) {
          console.log('Could not add logo:', e)
        }
      }

      y += 30

      // פרטי עסק
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      if (businessDetails.name) {
        pdf.setFont('helvetica', 'bold')
        pdf.text(businessDetails.name, pageWidth - margin, y, { align: 'right' })
        y += 5
        pdf.setFont('helvetica', 'normal')
      }
      if (businessDetails.businessNumber) {
        pdf.text(`ע.מ. / ח.פ.: ${businessDetails.businessNumber}`, pageWidth - margin, y, { align: 'right' })
        y += 4
      }
      if (businessDetails.address) {
        pdf.text(businessDetails.address, pageWidth - margin, y, { align: 'right' })
        y += 4
      }
      if (businessDetails.phone) {
        pdf.text(`טלפון: ${businessDetails.phone}`, pageWidth - margin, y, { align: 'right' })
        y += 4
      }
      if (businessDetails.email) {
        pdf.text(businessDetails.email, pageWidth - margin, y, { align: 'right' })
        y += 4
      }

      y += 5

      // תקופה ומעסיק
      pdf.setFillColor(243, 244, 246)
      pdf.rect(margin, y, contentWidth, 15, 'F')
      y += 5
      pdf.setFontSize(10)

      let periodText = 'תקופה: '
      if (startDate && endDate) {
        periodText += `${formatDate(startDate)} - ${formatDate(endDate)}`
      } else if (startDate) {
        periodText += `מ-${formatDate(startDate)}`
      } else if (endDate) {
        periodText += `עד ${formatDate(endDate)}`
      } else {
        periodText += 'כל התקופה'
      }
      pdf.text(periodText, pageWidth - margin - 5, y, { align: 'right' })
      y += 5

      if (employer) {
        pdf.text(`מעסיק: ${employer.name}`, pageWidth - margin - 5, y, { align: 'right' })
      }
      y += 10

    } else {
      // כותרת לדפים נוספים
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('דוח שעות עבודה - המשך', pageWidth - margin, y + 5, { align: 'right' })

      if (businessDetails.logo) {
        try {
          pdf.addImage(businessDetails.logo, 'PNG', margin, y, 30, 18)
        } catch (e) {
          console.log('Could not add logo:', e)
        }
      }

      y += 25
    }
  }

  // פונקציה לציור כותרת טבלה
  const drawTableHeader = () => {
    const colWidths = [22, 35, 35, 15, 15, 15, 25, 22]
    const headers = ['תאריך', 'מיקום', 'שעות', 'סה"כ', 'נוספות', 'ק"מ', 'תוספות', 'סכום']

    pdf.setFillColor(59, 130, 246)
    pdf.setTextColor(255, 255, 255)
    pdf.rect(margin, y, contentWidth, 8, 'F')

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')

    let x = pageWidth - margin
    for (let i = 0; i < headers.length; i++) {
      x -= colWidths[i]
      pdf.text(headers[i], x + colWidths[i] / 2, y + 5.5, { align: 'center' })
    }

    pdf.setTextColor(0, 0, 0)
    y += 8
  }

  // פונקציה לציור שורת נתונים
  const drawDataRow = (day: WorkDay, isAlternate: boolean) => {
    const colWidths = [22, 35, 35, 15, 15, 15, 25, 22]

    if (isAlternate) {
      pdf.setFillColor(249, 250, 251)
      pdf.rect(margin, y, contentWidth, rowHeight, 'F')
    }

    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')

    const rowData = [
      formatDate(day.date),
      getWorkDayLocations(day) || '-',
      getWorkDayTimeRanges(day),
      formatHours(day.regularHours + day.overtimeHours),
      day.overtimeHours > 0 ? formatHours(day.overtimeHours) : '-',
      day.kilometers > 0 ? day.kilometers.toString() : '-',
      getBonusesText(day, employer),
      formatCurrency(day.totalBeforeVat).replace('₪', '') + ' ₪'
    ]

    let x = pageWidth - margin
    for (let i = 0; i < rowData.length; i++) {
      x -= colWidths[i]
      // קיצור טקסט ארוך
      let text = rowData[i]
      if (text.length > 15 && i !== 2) { // לא מקצרים שעות
        text = text.substring(0, 14) + '..'
      }
      pdf.text(text, x + colWidths[i] / 2, y + 5.5, { align: 'center' })
    }

    y += rowHeight
  }

  // פונקציה לציור שורת סיכום
  const drawTotalRow = () => {
    const colWidths = [22, 35, 35, 15, 15, 15, 25, 22]

    pdf.setFillColor(229, 231, 235)
    pdf.rect(margin, y, contentWidth, rowHeight, 'F')

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')

    const totalData = [
      'סה"כ',
      '',
      '',
      formatHours(totals.hours),
      '-',
      totals.km > 0 ? totals.km.toString() : '-',
      '',
      formatCurrency(totals.beforeVat).replace('₪', '') + ' ₪'
    ]

    let x = pageWidth - margin
    for (let i = 0; i < totalData.length; i++) {
      x -= colWidths[i]
      pdf.text(totalData[i], x + colWidths[i] / 2, y + 5.5, { align: 'center' })
    }

    y += rowHeight
  }

  // פונקציה לציור סיכום כספי
  const drawFinancialSummary = () => {
    y += 5

    pdf.setFillColor(240, 253, 244)
    pdf.setDrawColor(134, 239, 172)
    pdf.rect(margin, y, contentWidth, discount && discount.amount > 0 ? 45 : 35, 'FD')

    y += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    pdf.text(`סה"כ לפני מע"מ: ${formatCurrency(totals.beforeVat)}`, pageWidth - margin - 5, y, { align: 'right' })
    y += 6

    if (discount && discount.amount > 0) {
      pdf.setTextColor(234, 88, 12)
      const discountText = discount.reason
        ? `הנחה (${discount.reason}): -${formatCurrency(discount.amount)}`
        : `הנחה: -${formatCurrency(discount.amount)}`
      pdf.text(discountText, pageWidth - margin - 5, y, { align: 'right' })
      y += 6

      pdf.setTextColor(0, 0, 0)
      pdf.text(`סה"כ אחרי הנחה: ${formatCurrency(finalTotals?.beforeVat || totals.beforeVat - discount.amount)}`, pageWidth - margin - 5, y, { align: 'right' })
      y += 6
    }

    pdf.text(`מע"מ: ${formatCurrency(finalTotals?.vatAmount || totals.withVat - totals.beforeVat)}`, pageWidth - margin - 5, y, { align: 'right' })
    y += 8

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(5, 150, 105)
    pdf.text(`סה"כ לתשלום: ${formatCurrency(finalTotals?.withVat || totals.withVat)}`, pageWidth - margin - 5, y, { align: 'right' })
    pdf.setTextColor(0, 0, 0)

    y += 10
  }

  // פונקציה לציור תעריפים
  const drawRates = () => {
    if (!employer) return

    y += 5
    pdf.setFillColor(240, 249, 255)
    pdf.setDrawColor(186, 230, 253)
    pdf.rect(margin, y, contentWidth, 35, 'FD')

    y += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('תעריפים:', pageWidth - margin - 5, y, { align: 'right' })
    y += 6

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    const ratesText = `יומית (עד ${employer.dailyHours || 12} שעות): ${formatCurrency(employer.dailyRate)}  |  שעה נוספת: ${formatCurrency(employer.overtimeRate)}  |  קילומטר: ${formatCurrency(employer.kmRate)}  |  מע"מ: ${employer.vatPercent}%`
    pdf.text(ratesText, pageWidth - margin - 5, y, { align: 'right' })
    y += 8

    if (employer.bonuses && employer.bonuses.length > 0) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('תוספות אפשריות:', pageWidth - margin - 5, y, { align: 'right' })
      y += 5
      pdf.setFont('helvetica', 'normal')
      const bonusesText = employer.bonuses.map(b => `${b.name}: ${formatCurrency(b.amount)}`).join('  |  ')
      pdf.text(bonusesText, pageWidth - margin - 5, y, { align: 'right' })
    }

    y += 10
  }

  // פונקציה לציור פרטי בנק
  const drawBankDetails = () => {
    if (!businessDetails.bankName && !businessDetails.bankBranch && !businessDetails.bankAccount) return

    y += 5
    pdf.setFillColor(249, 250, 251)
    pdf.setDrawColor(229, 231, 235)
    pdf.rect(margin, y, contentWidth, 25, 'FD')

    y += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('פרטי העברה בנקאית:', pageWidth - margin - 5, y, { align: 'right' })
    y += 6

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    const bankDetails = []
    if (businessDetails.bankName) bankDetails.push(`בנק: ${businessDetails.bankName}`)
    if (businessDetails.bankBranch) bankDetails.push(`סניף: ${businessDetails.bankBranch}`)
    if (businessDetails.bankAccount) bankDetails.push(`חשבון: ${businessDetails.bankAccount}`)
    pdf.text(bankDetails.join('  |  '), pageWidth - margin - 5, y, { align: 'right' })
  }

  // פונקציה לציור מספור עמודים
  const drawPageNumber = (page: number, total: number) => {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(128, 128, 128)
    pdf.text(`עמוד ${page} מתוך ${total}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    pdf.setTextColor(0, 0, 0)
  }

  // ציור הדף הראשון
  drawHeader(true)
  drawTableHeader()

  const rowsOnFirstPage = Math.min(workDays.length, rowsFirstPage)

  for (let i = 0; i < rowsOnFirstPage; i++) {
    drawDataRow(workDays[i], i % 2 === 1)
    currentRowIndex++
  }

  // אם כל השורות נכנסו לדף הראשון, נוסיף את שורת הסיכום והסיכום הכספי
  if (currentRowIndex >= workDays.length) {
    drawTotalRow()

    // בדיקה אם יש מקום לסיכום הכספי
    if (y + 100 < pageHeight - footerHeight) {
      drawFinancialSummary()
      drawRates()
      drawBankDetails()
    } else {
      // נעבור לדף חדש לסיכום
      drawPageNumber(currentPage, totalPages + 1)
      pdf.addPage()
      currentPage++
      totalPages++
      drawHeader(false)
      drawFinancialSummary()
      drawRates()
      drawBankDetails()
    }
  }

  drawPageNumber(currentPage, totalPages)

  // דפים נוספים אם צריך
  while (currentRowIndex < workDays.length) {
    pdf.addPage()
    currentPage++
    drawHeader(false)
    drawTableHeader()

    const rowsThisPage = Math.min(workDays.length - currentRowIndex, rowsOtherPages)

    for (let i = 0; i < rowsThisPage; i++) {
      drawDataRow(workDays[currentRowIndex], i % 2 === 1)
      currentRowIndex++
    }

    // אם זה הדף האחרון עם נתונים
    if (currentRowIndex >= workDays.length) {
      drawTotalRow()

      // בדיקה אם יש מקום לסיכום הכספי
      if (y + 100 < pageHeight - footerHeight) {
        drawFinancialSummary()
        drawRates()
        drawBankDetails()
      } else {
        // נעבור לדף חדש לסיכום
        drawPageNumber(currentPage, totalPages + 1)
        pdf.addPage()
        currentPage++
        totalPages++
        drawHeader(false)
        drawFinancialSummary()
        drawRates()
        drawBankDetails()
      }
    }

    drawPageNumber(currentPage, totalPages)
  }

  // שמירת הקובץ
  const fileName = employer
    ? `דוח_שעות_${employer.name}_${new Date().toISOString().split('T')[0]}.pdf`
    : `דוח_שעות_${new Date().toISOString().split('T')[0]}.pdf`

  console.log('PDF: Saving file:', fileName)

  // יצירת blob ופתיחה בחלון חדש
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)

  const newWindow = window.open(url, '_blank')

  if (!newWindow) {
    console.log('PDF: Window blocked, trying direct download')
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  setTimeout(() => URL.revokeObjectURL(url), 5000)
  console.log('PDF: Generation completed')
}
