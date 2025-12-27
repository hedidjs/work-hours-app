'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Employer, Bonus } from '@/lib/api'
import { formatCurrency } from '@/lib/calculations'

interface EmployersProps {
  employers: Employer[]
  onSave: (employer: Employer) => void
  onDelete: (id: string) => void
}

const emptyEmployer: Omit<Employer, 'id'> = {
  name: '',
  dailyRate: 0,
  kmRate: 0,
  overtimeRate: 0,
  vatPercent: 17,
  bonuses: [],
}

export function Employers({ employers, onSave, onDelete }: EmployersProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Employer, 'id'>>(emptyEmployer)

  // מצב להוספת תוספת חדשה
  const [showBonusForm, setShowBonusForm] = useState(false)
  const [newBonusName, setNewBonusName] = useState('')
  const [newBonusAmount, setNewBonusAmount] = useState(0)

  const handleEdit = (employer: Employer) => {
    setEditingId(employer.id)
    setFormData({
      name: employer.name,
      dailyRate: employer.dailyRate,
      kmRate: employer.kmRate,
      overtimeRate: employer.overtimeRate,
      vatPercent: employer.vatPercent,
      bonuses: employer.bonuses || [],
    })
    setIsEditing(true)
  }

  const handleAdd = () => {
    setEditingId(null)
    setFormData(emptyEmployer)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormData(emptyEmployer)
    setShowBonusForm(false)
    setNewBonusName('')
    setNewBonusAmount(0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('נא להזין שם מעסיק')
      return
    }

    const employer: Employer = {
      id: editingId || uuidv4(),
      ...formData,
    }

    onSave(employer)
    handleCancel()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מעסיק זה?')) {
      onDelete(id)
    }
  }

  // הוספת תוספת
  const handleAddBonus = () => {
    if (!newBonusName.trim()) {
      alert('נא להזין שם לתוספת')
      return
    }
    if (newBonusAmount <= 0) {
      alert('נא להזין מחיר לתוספת')
      return
    }

    const newBonus: Bonus = {
      id: uuidv4(),
      name: newBonusName,
      amount: newBonusAmount,
    }

    setFormData({
      ...formData,
      bonuses: [...formData.bonuses, newBonus],
    })

    setNewBonusName('')
    setNewBonusAmount(0)
    setShowBonusForm(false)
  }

  // מחיקת תוספת
  const handleDeleteBonus = (bonusId: string) => {
    setFormData({
      ...formData,
      bonuses: formData.bonuses.filter(b => b.id !== bonusId),
    })
  }

  return (
    <div className="pb-4">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">מעסיקים</h2>
        {!isEditing && employers.length < 10 && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 rounded-lg font-medium transition-colors text-sm md:text-base"
          >
            + הוספה
          </button>
        )}
      </div>

      {/* טופס */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors mb-4 md:mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">
            {editingId ? 'עריכת מעסיק' : 'הוספת מעסיק חדש'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                שם המעסיק <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="שם המעסיק"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                מחיר יומית (עד 12 שעות)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.dailyRate}
                onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                מחיר שעה נוספת
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.overtimeRate}
                onChange={(e) => setFormData({ ...formData, overtimeRate: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                מחיר לקילומטר
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.kmRate}
                onChange={(e) => setFormData({ ...formData, kmRate: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                אחוז מע&quot;מ
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.vatPercent}
                onChange={(e) => setFormData({ ...formData, vatPercent: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="17"
              />
            </div>
          </div>

          {/* אזור תוספות */}
          <div className="mt-4 md:mt-6 border-t pt-3 md:pt-4">
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm md:text-base">תוספות</h4>
              {!showBonusForm && (
                <button
                  type="button"
                  onClick={() => setShowBonusForm(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + הוספת תוספת
                </button>
              )}
            </div>

            {/* טופס הוספת תוספת */}
            {showBonusForm && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      שם התוספת
                    </label>
                    <input
                      type="text"
                      value={newBonusName}
                      onChange={(e) => setNewBonusName(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="לדוגמה: ציוד מיוחד"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      מחיר
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newBonusAmount}
                      onChange={(e) => setNewBonusAmount(Number(e.target.value))}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddBonus}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                  >
                    הוסף
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBonusForm(false)
                      setNewBonusName('')
                      setNewBonusAmount(0)
                    }}
                    className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-1.5 rounded-lg text-sm font-medium"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* רשימת תוספות */}
            {formData.bonuses.length > 0 ? (
              <div className="space-y-2">
                {formData.bonuses.map((bonus) => (
                  <div
                    key={bonus.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2"
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{bonus.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 mr-2">-</span>
                      <span className="text-green-600 dark:text-green-400">{formatCurrency(bonus.amount)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBonus(bonus.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">אין תוספות</p>
            )}
          </div>

          <div className="mt-4 md:mt-6 flex flex-col md:flex-row gap-3 md:gap-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:py-2 rounded-lg font-medium transition-colors"
            >
              {editingId ? 'עדכון' : 'שמירה'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-6 py-3 md:py-2 rounded-lg font-medium transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* רשימת מעסיקים */}
      {employers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors text-gray-500 dark:text-gray-400">
          <p className="mb-4">אין מעסיקים עדיין</p>
          {!isEditing && (
            <button
              onClick={handleAdd}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              הוסף מעסיק ראשון
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employers.map((employer) => (
            <div key={employer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors">
              <h3 className="font-medium text-gray-900 dark:text-white text-lg mb-3">{employer.name}</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="text-gray-500 dark:text-gray-400">יומית:</span> {formatCurrency(employer.dailyRate)}
                </p>
                <p>
                  <span className="text-gray-500 dark:text-gray-400">שעה נוספת:</span> {formatCurrency(employer.overtimeRate)}
                </p>
                <p>
                  <span className="text-gray-500 dark:text-gray-400">קילומטר:</span> {formatCurrency(employer.kmRate)}
                </p>
                <p>
                  <span className="text-gray-500 dark:text-gray-400">מע&quot;מ:</span> {employer.vatPercent}%
                </p>
                {employer.bonuses && employer.bonuses.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-500 dark:text-gray-400">תוספות:</span>
                    <div className="mt-1 space-y-1">
                      {employer.bonuses.map((bonus) => (
                        <div key={bonus.id} className="text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                          {bonus.name}: {formatCurrency(bonus.amount)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(employer)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  עריכה
                </button>
                <button
                  onClick={() => handleDelete(employer.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
