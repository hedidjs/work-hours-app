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

  const selectedBonuses = day.selectedBonuses || []
  if (selectedBonuses.length === 0) return '-'

  const bonusNames = employer.bonuses
    .filter(b => selectedBonuses.includes(b.id))
    .map(b => b.name)

  return bonusNames.length > 0 ? bonusNames.join(', ') : '-'
}

export async function generatePDF(data: PDFData): Promise<void> {
  const { workDays, employer, businessDetails, totals, startDate, endDate, discount, finalTotals } = data

  // Dynamic import of html2canvas to avoid SSR issues
  const html2canvas = (await import('html2canvas')).default

  // יצירת אלמנט HTML זמני עם כל התוכן
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 40px;
    background: white;
    font-family: 'Heebo', Arial, sans-serif;
    direction: rtl;
    box-sizing: border-box;
  `

  // בניית תקופה
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

  // חישוב מע"מ
  const vatAmount = totals.withVat - totals.beforeVat

  // בניית טבלה
  const tableRows = workDays.map(day => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatDate(day.date)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${getWorkDayLocations(day) || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${getWorkDayTimeRanges(day)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatHours(day.regularHours + day.overtimeHours)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${day.overtimeHours > 0 ? formatHours(day.overtimeHours) : '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${day.kilometers > 0 ? day.kilometers : '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${getBonusesText(day, employer)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatCurrency(day.totalBeforeVat)}</td>
    </tr>
  `).join('')

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
      <div style="flex: 1;">
        <h1 style="font-size: 24px; color: #1f2937; margin: 0 0 20px 0;">דוח שעות עבודה</h1>
      </div>
      ${businessDetails.logo ? `
        <div style="margin-right: 20px;">
          <img src="${businessDetails.logo}" style="max-width: 200px; max-height: 120px; object-fit: contain;" />
        </div>
      ` : ''}
    </div>

    <div style="margin-bottom: 20px; font-size: 14px; color: #374151;">
      ${businessDetails.name ? `<div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${businessDetails.name}</div>` : ''}
      ${businessDetails.businessNumber ? `<div>ע.מ. / ח.פ.: ${businessDetails.businessNumber}</div>` : ''}
      ${businessDetails.address ? `<div>${businessDetails.address}</div>` : ''}
      ${businessDetails.phone ? `<div>טלפון: ${businessDetails.phone}</div>` : ''}
      ${businessDetails.email ? `<div>${businessDetails.email}</div>` : ''}
    </div>

    <div style="margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 6px;">
      <div style="font-size: 14px;">${periodText}</div>
      ${employer ? `<div style="font-size: 14px; margin-top: 5px;">מעסיק: ${employer.name}</div>` : ''}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
      <thead>
        <tr style="background: #3b82f6; color: white;">
          <th style="border: 1px solid #3b82f6; padding: 6px; text-align: center;">תאריך</th>
          <th style="border: 1px solid #3b82f6; padding: 6px; text-align: center;">מיקום</th>
          <th style="border: 1px solid #3b82f6; padding: 6px; text-align: center;">משעה-עד</th>
          <th style="border: 1px solid #3b82f6; padding: 6px; text-align: center;">שעות</th>
          <th style="border: 1px solid #3b82f6; padding: 6px; text-align: center;">נוספות</th>
          <th style="border: 1px solid #3b82f6; padding: 6px; text-align: center;">ק"מ</th>
          <th style="border: 1px solid #3b82f6; padding: 6px; text-align: center;">תוספות</th>
          <th style="border: 1px solid #3b82f6; padding: 6px; text-align: center;">סכום</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
      <tfoot>
        <tr style="background: #e5e7eb; font-weight: bold;">
          <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">סה"כ</td>
          <td style="border: 1px solid #ddd; padding: 6px; text-align: center;"></td>
          <td style="border: 1px solid #ddd; padding: 6px; text-align: center;"></td>
          <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${formatHours(totals.hours)}</td>
          <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">-</td>
          <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${totals.km > 0 ? totals.km : '-'}</td>
          <td style="border: 1px solid #ddd; padding: 6px; text-align: center;"></td>
          <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${formatCurrency(totals.beforeVat)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-bottom: 20px; text-align: left; font-size: 14px; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #86efac;">
      <div style="margin-bottom: 8px;">סה"כ לפני מע"מ: <strong>${formatCurrency(totals.beforeVat)}</strong></div>
      ${discount && discount.amount > 0 ? `
        <div style="margin-bottom: 8px; color: #ea580c;">
          הנחה${discount.reason ? ` (${discount.reason})` : ''}:
          <strong>-${formatCurrency(discount.amount)}</strong>
          ${discount.type === 'percent' ? `<span style="font-size: 12px; color: #9a3412;"> (${discount.value}%)</span>` : ''}
        </div>
        <div style="margin-bottom: 8px;">סה"כ אחרי הנחה: <strong>${formatCurrency(finalTotals?.beforeVat || totals.beforeVat - discount.amount)}</strong></div>
      ` : ''}
      <div style="margin-bottom: 8px;">מע"מ: <strong>${formatCurrency(finalTotals?.vatAmount || vatAmount)}</strong></div>
      <div style="font-weight: bold; font-size: 18px; color: #059669; padding-top: 8px; border-top: 1px solid #86efac;">סה"כ לתשלום: ${formatCurrency(finalTotals?.withVat || totals.withVat)}</div>
    </div>

    ${employer ? `
      <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 6px; border: 1px solid #bae6fd;">
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">תעריפים:</div>
        <div style="font-size: 13px; color: #374151; display: flex; gap: 30px; flex-wrap: wrap;">
          <div>יומית (עד ${employer.dailyHours || 12} שעות): ${formatCurrency(employer.dailyRate)}</div>
          <div>שעה נוספת: ${formatCurrency(employer.overtimeRate)}</div>
          <div>קילומטר: ${formatCurrency(employer.kmRate)}</div>
          <div>מע"מ: ${employer.vatPercent}%</div>
        </div>
        ${employer.bonuses && employer.bonuses.length > 0 ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #bae6fd;">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">תוספות אפשריות:</div>
            <div style="font-size: 13px; color: #374151; display: flex; gap: 20px; flex-wrap: wrap;">
              ${employer.bonuses.map(bonus => `<div>${bonus.name}: ${formatCurrency(bonus.amount)}</div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${(businessDetails.bankName || businessDetails.bankBranch || businessDetails.bankAccount) ? `
      <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">פרטי העברה בנקאית:</div>
        <div style="font-size: 13px; color: #374151;">
          ${businessDetails.bankName ? `<div>בנק: ${businessDetails.bankName}</div>` : ''}
          ${businessDetails.bankBranch ? `<div>סניף: ${businessDetails.bankBranch}</div>` : ''}
          ${businessDetails.bankAccount ? `<div>חשבון: ${businessDetails.bankAccount}</div>` : ''}
        </div>
      </div>
    ` : ''}
  `

  document.body.appendChild(container)
  console.log('PDF: Container added to document')

  try {
    // המתנה לטעינת התמונות
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log('PDF: Starting html2canvas')

    // יצירת canvas מהHTML
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    console.log('PDF: Canvas created', canvas.width, 'x', canvas.height)

    // יצירת PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // חישוב רוחב התמונה כך שתתאים לרוחב הדף
    const imgWidth = pdfWidth - 10 // שוליים של 5 מ"מ מכל צד
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // אם התמונה גבוהה מדף אחד, נחלק לעמודים
    if (imgHeight <= pdfHeight - 10) {
      // מתאים לדף אחד
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', 5, 5, imgWidth, imgHeight)
    } else {
      // צריך מספר עמודים
      const pageHeight = pdfHeight - 10 // גובה אפקטיבי לדף (עם שוליים)
      const totalPages = Math.ceil(imgHeight / pageHeight)

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage()
        }

        // חישוב איזה חלק מהתמונה להציג
        const sourceY = (page * pageHeight * canvas.width) / imgWidth
        const sourceHeight = Math.min(
          (pageHeight * canvas.width) / imgWidth,
          canvas.height - sourceY
        )

        // יצירת canvas חלקי לעמוד הנוכחי
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = sourceHeight
        const ctx = pageCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY,
            canvas.width, sourceHeight,
            0, 0,
            canvas.width, sourceHeight
          )

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95)
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width
          pdf.addImage(pageImgData, 'JPEG', 5, 5, imgWidth, pageImgHeight)
        }
      }
    }

    // שמירה
    const fileName = employer
      ? `דוח_שעות_${employer.name}_${new Date().toISOString().split('T')[0]}.pdf`
      : `דוח_שעות_${new Date().toISOString().split('T')[0]}.pdf`

    console.log('PDF: Saving file:', fileName)

    // יצירת blob ופתיחה בחלון חדש (עובד טוב יותר בדפדפנים שונים)
    const blob = pdf.output('blob')
    const url = URL.createObjectURL(blob)

    // פתיחת ה-PDF בחלון/טאב חדש
    const newWindow = window.open(url, '_blank')

    if (!newWindow) {
      // אם הדפדפן חסם פתיחת חלון, ננסה להוריד ישירות
      console.log('PDF: Window blocked, trying direct download')
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // שחרור ה-URL אחרי זמן קצר
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    console.log('PDF: Save completed')
  } catch (error) {
    console.error('PDF: Error during generation:', error)
    throw error
  } finally {
    document.body.removeChild(container)
    console.log('PDF: Cleanup done')
  }
}
