// API helper functions

export interface Bonus {
  id: string;
  name: string;
  amount: number;
}

export interface Employer {
  id: string;
  name: string;
  dailyRate: number;
  dailyHours: number; // כמה שעות ביומית (ברירת מחדל 12)
  kmRate: number;
  overtimeRate: number;
  vatPercent: number;
  bonuses: Bonus[];
}

export interface WorkSegment {
  id: string;
  location: string;
  startTime: string;
  endTime: string;
  customDailyRate?: number;
  selectedBonuses?: string[];
}

export interface WorkDay {
  id: string;
  employerId: string;
  date: string;
  location: string;
  startTime: string;
  endTime: string;
  kilometers: number;
  selectedBonuses: string[];
  customDailyRate?: number;
  segments?: WorkSegment[];
  calculationMode?: 'combined' | 'separate';
  regularHours: number;
  overtimeHours: number;
  totalBeforeVat: number;
  totalWithVat: number;
}

export interface BusinessDetails {
  logo: string;
  name: string;
  businessNumber: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
}

// Auth
export async function login(password: string): Promise<boolean> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  const data = await res.json()
  return data.success === true
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const res = await fetch('/api/auth', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  })
  return res.ok
}

// Employers
export async function getEmployers(): Promise<Employer[]> {
  const res = await fetch('/api/employers')
  if (!res.ok) throw new Error('Failed to fetch employers')
  return res.json()
}

export async function createEmployer(employer: Omit<Employer, 'id'>): Promise<Employer> {
  const res = await fetch('/api/employers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employer)
  })
  if (!res.ok) throw new Error('Failed to create employer')
  return res.json()
}

export async function updateEmployer(id: string, employer: Omit<Employer, 'id'>): Promise<Employer> {
  const res = await fetch(`/api/employers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employer)
  })
  if (!res.ok) throw new Error('Failed to update employer')
  return res.json()
}

export async function deleteEmployer(id: string): Promise<void> {
  const res = await fetch(`/api/employers/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete employer')
}

// Work Days
export async function getWorkDays(): Promise<WorkDay[]> {
  const res = await fetch('/api/workdays')
  if (!res.ok) throw new Error('Failed to fetch work days')
  return res.json()
}

export async function createWorkDay(workDay: Omit<WorkDay, 'id'>): Promise<WorkDay> {
  const res = await fetch('/api/workdays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workDay)
  })
  if (!res.ok) throw new Error('Failed to create work day')
  return res.json()
}

export async function updateWorkDay(id: string, workDay: Omit<WorkDay, 'id'>): Promise<WorkDay> {
  const res = await fetch(`/api/workdays/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workDay)
  })
  if (!res.ok) throw new Error('Failed to update work day')
  return res.json()
}

export async function deleteWorkDay(id: string): Promise<void> {
  const res = await fetch(`/api/workdays/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete work day')
}

// Business Details
export async function getBusinessDetails(): Promise<BusinessDetails> {
  const res = await fetch('/api/business')
  if (!res.ok) throw new Error('Failed to fetch business details')
  return res.json()
}

export async function updateBusinessDetails(details: BusinessDetails): Promise<BusinessDetails> {
  const res = await fetch('/api/business', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details)
  })
  if (!res.ok) throw new Error('Failed to update business details')
  return res.json()
}
