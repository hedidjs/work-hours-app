import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
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

// יצירת HTML לכותרת
function createHeaderHTML(businessDetails: BusinessDetails, startDate: string, endDate: string, employer?: Employer, isFirstPage = true, currentPage = 1, totalPages = 1): string {
  let periodText = ''
  if (startDate && endDate) {
    periodText = `${formatDate(startDate)} - ${formatDate(endDate)}`
  } else if (startDate) {
    periodText = `מ-${formatDate(startDate)}`
  } else if (endDate) {
    periodText = `עד ${formatDate(endDate)}`
  } else {
    periodText = 'כל התקופה'
  }

  if (isFirstPage) {
    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; direction: ltr;">
        ${businessDetails.logo ? `<img src="${businessDetails.logo}" style="max-width: 120px; max-height: 80px;" />` : '<div></div>'}
        <div style="text-align: right; direction: rtl;">
          <h1 style="margin: 0; font-size: 24px; color: #1a202c;">דוח שעות עבודה</h1>
          <div style="margin-top: 10px; font-size: 12px; color: #4a5568;">
            ${businessDetails.name ? `<div style="font-weight: bold; font-size: 14px;">${businessDetails.name}</div>` : ''}
            ${businessDetails.businessNumber ? `<div>ע.מ. / ח.פ.: ${businessDetails.businessNumber}</div>` : ''}
            ${businessDetails.address ? `<div>${businessDetails.address}</div>` : ''}
            ${businessDetails.phone ? `<div>טלפון: ${businessDetails.phone}</div>` : ''}
            ${businessDetails.email ? `<div>${businessDetails.email}</div>` : ''}
          </div>
        </div>
      </div>
      <div style="background: #f3f4f6; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="font-size: 12px;">תקופה: ${periodText}</div>
        ${employer ? `<div style="font-size: 12px;">מעסיק: ${employer.name}</div>` : ''}
      </div>
    `
  } else {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; direction: ltr;">
        ${businessDetails.logo ? `<img src="${businessDetails.logo}" style="max-width: 80px; max-height: 50px;" />` : '<div></div>'}
        <div style="text-align: right; direction: rtl;">
          <div style="font-size: 16px; font-weight: bold; color: #1a202c;">דוח שעות עבודה - המשך</div>
          ${employer ? `<div style="font-size: 11px; color: #718096;">${employer.name} | ${periodText}</div>` : ''}
        </div>
      </div>
    `
  }
}

// יצירת HTML לכותרת טבלה
function createTableHeaderHTML(): string {
  return `
    <tr style="background: #3b82f6; color: white;">
      <th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold;">תאריך</th>
      <th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold;">מיקום</th>
      <th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold;">שעות</th>
      <th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold;">סה"כ</th>
      <th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold;">נוספות</th>
      <th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold;">ק"מ</th>
      <th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold;">תוספות</th>
      <th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold;">סכום</th>
    </tr>
  `
}

// יצירת HTML לשורת נתונים
function createDataRowHTML(day: WorkDay, employer?: Employer, isAlternate = false): string {
  const bgColor = isAlternate ? '#f9fafb' : '#ffffff'
  return `
    <tr style="background: ${bgColor};">
      <td style="padding: 6px; text-align: center; font-size: 10px; border-bottom: 1px solid #e5e7eb;">${formatDate(day.date)}</td>
      <td style="padding: 6px; text-align: center; font-size: 10px; border-bottom: 1px solid #e5e7eb; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${getWorkDayLocations(day) || '-'}</td>
      <td style="padding: 6px; text-align: center; font-size: 9px; border-bottom: 1px solid #e5e7eb;">${getWorkDayTimeRanges(day)}</td>
      <td style="padding: 6px; text-align: center; font-size: 10px; border-bottom: 1px solid #e5e7eb;">${formatHours(day.regularHours + day.overtimeHours)}</td>
      <td style="padding: 6px; text-align: center; font-size: 10px; border-bottom: 1px solid #e5e7eb;">${day.overtimeHours > 0 ? formatHours(day.overtimeHours) : '-'}</td>
      <td style="padding: 6px; text-align: center; font-size: 10px; border-bottom: 1px solid #e5e7eb;">${day.kilometers > 0 ? day.kilometers : '-'}</td>
      <td style="padding: 6px; text-align: center; font-size: 9px; border-bottom: 1px solid #e5e7eb; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${getBonusesText(day, employer)}</td>
      <td style="padding: 6px; text-align: center; font-size: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formatCurrency(day.totalBeforeVat)}</td>
    </tr>
  `
}

// יצירת HTML לשורת סיכום
function createTotalRowHTML(totals: PDFData['totals']): string {
  return `
    <tr style="background: #e5e7eb; font-weight: bold;">
      <td style="padding: 8px 6px; text-align: center; font-size: 11px;">סה"כ</td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px;"></td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px;"></td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px;">${formatHours(totals.hours)}</td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px;">-</td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px;">${totals.km > 0 ? totals.km : '-'}</td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px;"></td>
      <td style="padding: 8px 6px; text-align: center; font-size: 11px;">${formatCurrency(totals.beforeVat)}</td>
    </tr>
  `
}

// יצירת HTML לסיכום כספי
function createFinancialSummaryHTML(totals: PDFData['totals'], discount?: PDFData['discount'], finalTotals?: PDFData['finalTotals']): string {
  return `
    <div style="background: linear-gradient(to right, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin-top: 15px;">
      <div style="font-size: 12px; margin-bottom: 5px;">סה"כ לפני מע"מ: ${formatCurrency(totals.beforeVat)}</div>
      ${discount && discount.amount > 0 ? `
        <div style="font-size: 12px; color: #ea580c; margin-bottom: 5px;">
          הנחה${discount.reason ? ` (${discount.reason})` : ''}: -${formatCurrency(discount.amount)}
        </div>
        <div style="font-size: 12px; margin-bottom: 5px;">סה"כ אחרי הנחה: ${formatCurrency(finalTotals?.beforeVat || totals.beforeVat - discount.amount)}</div>
      ` : ''}
      <div style="font-size: 12px; margin-bottom: 8px;">מע"מ: ${formatCurrency(finalTotals?.vatAmount || totals.withVat - totals.beforeVat)}</div>
      <div style="font-size: 18px; font-weight: bold; color: #059669;">סה"כ לתשלום: ${formatCurrency(finalTotals?.withVat || totals.withVat)}</div>
    </div>
  `
}

// יצירת HTML לתעריפים
function createRatesHTML(employer: Employer): string {
  return `
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-top: 15px;">
      <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px;">תעריפים:</div>
      <div style="font-size: 11px; margin-bottom: 5px;">
        יומית (עד ${employer.dailyHours || 12} שעות): ${formatCurrency(employer.dailyRate)} |
        שעה נוספת: ${formatCurrency(employer.overtimeRate)} |
        קילומטר: ${formatCurrency(employer.kmRate)} |
        מע"מ: ${employer.vatPercent}%
      </div>
      ${employer.bonuses && employer.bonuses.length > 0 ? `
        <div style="font-weight: bold; font-size: 11px; margin-top: 8px;">תוספות אפשריות:</div>
        <div style="font-size: 11px;">${employer.bonuses.map(b => `${b.name}: ${formatCurrency(b.amount)}`).join(' | ')}</div>
      ` : ''}
    </div>
  `
}

// יצירת HTML לפרטי בנק
function createBankDetailsHTML(businessDetails: BusinessDetails): string {
  if (!businessDetails.bankName && !businessDetails.bankBranch && !businessDetails.bankAccount) return ''

  const details = []
  if (businessDetails.bankName) details.push(`בנק: ${businessDetails.bankName}`)
  if (businessDetails.bankBranch) details.push(`סניף: ${businessDetails.bankBranch}`)
  if (businessDetails.bankAccount) details.push(`חשבון: ${businessDetails.bankAccount}`)

  return `
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-top: 15px;">
      <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">פרטי העברה בנקאית:</div>
      <div style="font-size: 11px;">${details.join(' | ')}</div>
    </div>
  `
}

// יצירת HTML לפוטר עם מספור עמודים
function createFooterHTML(currentPage: number, totalPages: number): string {
  return `
    <div style="text-align: center; font-size: 10px; color: #9ca3af; margin-top: auto; padding-top: 10px;">
      עמוד ${currentPage} מתוך ${totalPages}
    </div>
  `
}

export async function generatePDF(data: PDFData): Promise<void> {
  const { workDays, employer, businessDetails, totals, startDate, endDate, discount, finalTotals } = data

  console.log('PDF: Starting generation with', workDays.length, 'work days')

  // חישוב מספר שורות לכל עמוד
  const ROWS_FIRST_PAGE = 12 // פחות שורות בעמוד הראשון בגלל הכותרת הגדולה
  const ROWS_OTHER_PAGES = 18 // יותר שורות בעמודים הבאים

  // חישוב כמה עמודים צריך
  let totalPages = 1
  let remainingRows = workDays.length

  if (remainingRows > ROWS_FIRST_PAGE) {
    remainingRows -= ROWS_FIRST_PAGE
    totalPages += Math.ceil(remainingRows / ROWS_OTHER_PAGES)
  }

  // בדיקה אם צריך עמוד נוסף לסיכום
  const lastPageRows = workDays.length <= ROWS_FIRST_PAGE
    ? workDays.length
    : ((workDays.length - ROWS_FIRST_PAGE) % ROWS_OTHER_PAGES) || ROWS_OTHER_PAGES

  // אם אין מספיק מקום לסיכום בעמוד האחרון, נוסיף עמוד
  const needsSummaryPage = lastPageRows > (workDays.length <= ROWS_FIRST_PAGE ? ROWS_FIRST_PAGE - 5 : ROWS_OTHER_PAGES - 5)
  if (needsSummaryPage && workDays.length > 5) {
    totalPages++
  }

  console.log('PDF: Total pages:', totalPages)

  // יצירת PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm

  // יצירת אלמנטים לכל עמוד
  let currentRowIndex = 0

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const isFirstPage = pageNum === 1
    const isLastPage = pageNum === totalPages

    // חישוב שורות לעמוד הזה
    const rowsThisPage = isFirstPage
      ? Math.min(workDays.length, ROWS_FIRST_PAGE)
      : Math.min(workDays.length - currentRowIndex, ROWS_OTHER_PAGES)

    // בניית HTML לעמוד
    let pageHTML = `
      <div style="
        width: 595px;
        min-height: 842px;
        padding: 30px;
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
        direction: rtl;
        background: white;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      ">
        ${createHeaderHTML(businessDetails, startDate, endDate, employer, isFirstPage, pageNum, totalPages)}

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            ${createTableHeaderHTML()}
          </thead>
          <tbody>
    `

    // הוספת שורות נתונים
    for (let i = 0; i < rowsThisPage && currentRowIndex < workDays.length; i++) {
      pageHTML += createDataRowHTML(workDays[currentRowIndex], employer, i % 2 === 1)
      currentRowIndex++
    }

    // אם זה העמוד האחרון עם נתונים או עמוד הסיכום
    if (currentRowIndex >= workDays.length && !needsSummaryPage) {
      pageHTML += createTotalRowHTML(totals)
    } else if (isLastPage && needsSummaryPage && currentRowIndex >= workDays.length) {
      pageHTML += createTotalRowHTML(totals)
    }

    pageHTML += `
          </tbody>
        </table>
    `

    // הוספת סיכום כספי בעמוד האחרון
    if (isLastPage || (currentRowIndex >= workDays.length && !needsSummaryPage)) {
      pageHTML += createFinancialSummaryHTML(totals, discount, finalTotals)
      if (employer) {
        pageHTML += createRatesHTML(employer)
      }
      pageHTML += createBankDetailsHTML(businessDetails)
    }

    // הוספת פוטר עם מספור
    pageHTML += createFooterHTML(pageNum, totalPages)

    pageHTML += '</div>'

    // יצירת אלמנט זמני
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = pageHTML
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    document.body.appendChild(tempDiv)

    // המתנה קצרה לרינדור
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // יצירת canvas מהאלמנט
      const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      // הוספת עמוד ל-PDF (חוץ מהעמוד הראשון)
      if (pageNum > 1) {
        pdf.addPage()
      }

      // הוספת התמונה ל-PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)

      console.log('PDF: Page', pageNum, 'rendered')
    } catch (err) {
      console.error('PDF: Error rendering page', pageNum, err)
    } finally {
      // ניקוי האלמנט הזמני
      document.body.removeChild(tempDiv)
    }
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
