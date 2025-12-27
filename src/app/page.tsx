'use client'

import { useState, useEffect, useCallback } from 'react'
import * as api from '@/lib/api'
import type { Employer, WorkDay, BusinessDetails } from '@/lib/api'

// Components
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/components/LoginPage'
import { HomePage } from '@/components/HomePage'
import { AddWorkDay } from '@/components/AddWorkDay'
import { Employers } from '@/components/Employers'
import { BusinessDetailsPage } from '@/components/BusinessDetailsPage'
import { Statistics } from '@/components/Statistics'
import { ExportPage } from '@/components/ExportPage'

const initialBusinessDetails: BusinessDetails = {
  logo: '',
  name: '',
  businessNumber: '',
  address: '',
  phone: '',
  email: '',
  bankName: '',
  bankBranch: '',
  bankAccount: '',
}

export default function App() {
  // Auth state - stored in localStorage for persistence
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [currentPassword, setCurrentPassword] = useState<string>('')

  // Data state
  const [employers, setEmployers] = useState<Employer[]>([])
  const [workDays, setWorkDays] = useState<WorkDay[]>([])
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>(initialBusinessDetails)
  const [isLoading, setIsLoading] = useState(true)

  // Navigation state
  const [currentPage, setCurrentPage] = useState<string>('home')
  const [editingWorkDayId, setEditingWorkDayId] = useState<string | null>(null)

  // Check auth on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem('work-hours-password')
    if (savedPassword) {
      setCurrentPassword(savedPassword)
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  // Fetch data when authenticated
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    try {
      const [employersData, workDaysData, businessData] = await Promise.all([
        api.getEmployers(),
        api.getWorkDays(),
        api.getBusinessDetails()
      ])
      setEmployers(employersData)
      setWorkDays(workDaysData)
      setBusinessDetails(businessData)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setIsLoading(false)
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, fetchData])

  // Auth handlers
  const handleLogin = async (password: string): Promise<boolean> => {
    const success = await api.login(password)
    if (success) {
      localStorage.setItem('work-hours-password', password)
      setCurrentPassword(password)
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    localStorage.removeItem('work-hours-password')
    setCurrentPassword('')
    setIsAuthenticated(false)
  }

  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
    const success = await api.changePassword(currentPassword, newPassword)
    if (success) {
      localStorage.setItem('work-hours-password', newPassword)
      setCurrentPassword(newPassword)
      return true
    }
    return false
  }

  // Employer handlers
  const saveEmployer = async (employer: Employer) => {
    try {
      const exists = employers.find(e => e.id === employer.id)
      if (exists) {
        const updated = await api.updateEmployer(employer.id, employer)
        setEmployers(prev => prev.map(e => e.id === employer.id ? updated : e))
      } else {
        const created = await api.createEmployer(employer)
        setEmployers(prev => [...prev, created])
      }
    } catch (error) {
      console.error('Error saving employer:', error)
      alert('שגיאה בשמירת המעסיק')
    }
  }

  const handleDeleteEmployer = async (id: string) => {
    try {
      await api.deleteEmployer(id)
      setEmployers(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      console.error('Error deleting employer:', error)
      alert('שגיאה במחיקת המעסיק')
    }
  }

  // Work day handlers
  const saveWorkDay = async (workDay: WorkDay) => {
    try {
      const exists = workDays.find(w => w.id === workDay.id)
      if (exists) {
        const updated = await api.updateWorkDay(workDay.id, workDay)
        setWorkDays(prev => prev.map(w => w.id === workDay.id ? updated : w))
      } else {
        const created = await api.createWorkDay(workDay)
        setWorkDays(prev => [...prev, created])
      }
      setCurrentPage('home')
      setEditingWorkDayId(null)
    } catch (error) {
      console.error('Error saving work day:', error)
      alert('שגיאה בשמירת יום העבודה')
    }
  }

  const handleDeleteWorkDay = async (id: string) => {
    try {
      await api.deleteWorkDay(id)
      setWorkDays(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      console.error('Error deleting work day:', error)
      alert('שגיאה במחיקת יום העבודה')
    }
  }

  // Business details handlers
  const saveBusinessDetails = async (details: BusinessDetails) => {
    try {
      const updated = await api.updateBusinessDetails(details)
      setBusinessDetails(updated)
    } catch (error) {
      console.error('Error saving business details:', error)
      alert('שגיאה בשמירת פרטי העסק')
    }
  }

  // Navigation handlers
  const navigate = (page: string, workDayId?: string) => {
    setCurrentPage(page)
    setEditingWorkDayId(workDayId || null)
  }

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">טוען...</div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Render current page
  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500 dark:text-gray-400">טוען נתונים...</div>
        </div>
      )
    }

    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            workDays={workDays}
            employers={employers}
            onDelete={handleDeleteWorkDay}
            onNavigate={navigate}
          />
        )
      case 'add':
      case 'edit':
        return (
          <AddWorkDay
            employers={employers}
            workDays={workDays}
            onSave={saveWorkDay}
            editingId={editingWorkDayId}
            onCancel={() => navigate('home')}
          />
        )
      case 'employers':
        return (
          <Employers
            employers={employers}
            onSave={saveEmployer}
            onDelete={handleDeleteEmployer}
          />
        )
      case 'business':
        return (
          <BusinessDetailsPage
            businessDetails={businessDetails}
            onSave={saveBusinessDetails}
            onChangePassword={handleChangePassword}
            onLogout={handleLogout}
          />
        )
      case 'statistics':
        return (
          <Statistics
            workDays={workDays}
            employers={employers}
          />
        )
      case 'export':
        return (
          <ExportPage
            workDays={workDays}
            employers={employers}
            businessDetails={businessDetails}
          />
        )
      default:
        return null
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  )
}
