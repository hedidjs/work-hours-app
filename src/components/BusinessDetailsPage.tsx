'use client'

import { useState } from 'react'
import type { BusinessDetails } from '@/lib/api'

interface BusinessDetailsPageProps {
  businessDetails: BusinessDetails
  onSave: (details: BusinessDetails) => void
  onChangePassword: (newPassword: string) => Promise<boolean>
  onLogout: () => void
}

export function BusinessDetailsPage({ businessDetails, onSave, onChangePassword, onLogout }: BusinessDetailsPageProps) {
  const [formData, setFormData] = useState<BusinessDetails>(businessDetails)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const compressImage = (file: File, maxWidth: number = 300, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedDataUrl)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const compressedLogo = await compressImage(file, 300, 0.8)
        setFormData({ ...formData, logo: compressedLogo })
      } catch (error) {
        console.error('Error compressing image:', error)
        alert('שגיאה בטעינת התמונה')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    await onSave(formData)
    setIsSaving(false)
    alert('פרטי העסק נשמרו בהצלחה!')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('הסיסמאות לא תואמות')
      return
    }
    if (newPassword.length < 4) {
      alert('הסיסמה חייבת להכיל לפחות 4 תווים')
      return
    }

    const success = await onChangePassword(newPassword)
    if (success) {
      alert('הסיסמה שונתה בהצלחה!')
      setShowPasswordForm(false)
      setNewPassword('')
      setConfirmPassword('')
    } else {
      alert('שגיאה בשינוי הסיסמה')
    }
  }

  const handleLogout = () => {
    if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
      onLogout()
    }
  }

  return (
    <div className="pb-4">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">פרטי העסק</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors mb-4 md:mb-6">
        {/* לוגו */}
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">לוגו העסק</label>
          <div className="flex items-center gap-4">
            {formData.logo ? (
              <img src={formData.logo} alt="לוגו" className="w-20 h-20 object-contain rounded border" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded border flex items-center justify-center text-gray-400">
                אין לוגו
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                בחר תמונה
              </label>
              {formData.logo && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logo: '' })}
                  className="mr-2 text-red-500 hover:text-red-700 text-sm"
                >
                  הסר
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם העסק</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="שם העסק"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מספר עוסק / ח.פ.</label>
            <input
              type="text"
              value={formData.businessNumber}
              onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="מספר עוסק"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">כתובת</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="כתובת העסק"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">טלפון</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="טלפון"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">אימייל</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com"
            />
          </div>
        </div>

        {/* פרטי בנק */}
        <div className="mt-4 md:mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">פרטי העברה בנקאית</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם הבנק</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="שם הבנק"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מספר סניף</label>
              <input
                type="text"
                value={formData.bankBranch}
                onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="מספר סניף"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מספר חשבון</label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="מספר חשבון"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 md:py-2 rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'שומר...' : 'שמירה'}
          </button>
        </div>
      </form>

      {/* הגדרות אבטחה */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">הגדרות אבטחה</h3>

        {showPasswordForm ? (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סיסמה חדשה</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="סיסמה חדשה"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">אימות סיסמה</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="הזן שוב את הסיסמה"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                שמור
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium"
              >
                ביטול
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => setShowPasswordForm(true)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🔑 שינוי סיסמה
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🚪 התנתקות
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
