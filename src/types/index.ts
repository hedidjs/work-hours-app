export interface Bonus {
  id: string;
  name: string;           // שם התוספת
  amount: number;         // מחיר התוספת
}

export interface Employer {
  id: string;
  name: string;
  dailyRate: number;      // מחיר יומית (עד 12 שעות)
  kmRate: number;         // מחיר לקילומטר
  overtimeRate: number;   // מחיר שעה נוספת
  vatPercent: number;     // אחוז מע"מ
  bonuses: Bonus[];       // רשימת תוספות
}

export interface WorkSegment {
  id: string;
  location: string;
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  customDailyRate?: number;   // מחיר יומית מותאם לנקודה (אופציונלי)
  selectedBonuses?: string[]; // תוספות לנקודה זו
}

export interface WorkDay {
  id: string;
  employerId: string;
  date: string;           // YYYY-MM-DD
  location: string;       // מיקום ראשי (לתאימות לאחור)
  startTime: string;      // HH:mm (לתאימות לאחור)
  endTime: string;        // HH:mm (לתאימות לאחור)
  kilometers: number;
  selectedBonuses: string[];  // מזהי התוספות שנבחרו
  customDailyRate?: number;   // מחיר יומית מותאם לאירוע (אופציונלי)
  // תמיכה במספר נקודות עבודה:
  segments?: WorkSegment[];   // נקודות עבודה נוספות
  calculationMode?: 'combined' | 'separate';  // אופן חישוב: ביחד או בנפרד
  // מחושבים:
  regularHours: number;
  overtimeHours: number;
  totalBeforeVat: number;
  totalWithVat: number;
}

export interface BusinessDetails {
  logo: string;           // base64
  name: string;
  businessNumber: string; // מספר עוסק/ח.פ.
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
}

export interface AppData {
  employers: Employer[];
  workDays: WorkDay[];
  businessDetails: BusinessDetails;
}
