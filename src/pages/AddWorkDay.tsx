import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { WorkDay, Employer, WorkSegment } from '../types';
import { calculateMultiSegmentPayment, formatCurrency } from '../utils/calculations';

interface AddWorkDayProps {
  employers: Employer[];
  workDays: WorkDay[];
  onSave: (workDay: WorkDay) => void;
}

interface FormSegment {
  id: string;
  location: string;
  startTime: string;
  endTime: string;
  customDailyRate: number | undefined;
  useCustomDailyRate: boolean;
  selectedBonuses: string[];
}

export function AddWorkDay({ employers, workDays, onSave }: AddWorkDayProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const existingWorkDay = useMemo(() => {
    if (id) {
      return workDays.find(w => w.id === id);
    }
    return null;
  }, [id, workDays]);

  const [formData, setFormData] = useState({
    employerId: '',
    date: new Date().toISOString().split('T')[0],
    kilometers: 0,
    calculationMode: 'combined' as 'combined' | 'separate',
  });

  const [segments, setSegments] = useState<FormSegment[]>([
    {
      id: uuidv4(),
      location: '',
      startTime: '08:00',
      endTime: '17:00',
      customDailyRate: undefined,
      useCustomDailyRate: false,
      selectedBonuses: [],
    }
  ]);

  useEffect(() => {
    if (existingWorkDay) {
      setFormData({
        employerId: existingWorkDay.employerId,
        date: existingWorkDay.date,
        kilometers: existingWorkDay.kilometers,
        calculationMode: existingWorkDay.calculationMode || 'combined',
      });

      // טעינת נקודות עבודה
      if (existingWorkDay.segments && existingWorkDay.segments.length > 0) {
        setSegments(existingWorkDay.segments.map(seg => ({
          id: seg.id,
          location: seg.location,
          startTime: seg.startTime,
          endTime: seg.endTime,
          customDailyRate: seg.customDailyRate,
          useCustomDailyRate: seg.customDailyRate !== undefined,
          selectedBonuses: seg.selectedBonuses || [],
        })));
      } else {
        // תאימות לאחור - יום עבודה ישן עם נקודה אחת
        setSegments([{
          id: uuidv4(),
          location: existingWorkDay.location,
          startTime: existingWorkDay.startTime,
          endTime: existingWorkDay.endTime,
          customDailyRate: existingWorkDay.customDailyRate,
          useCustomDailyRate: existingWorkDay.customDailyRate !== undefined,
          selectedBonuses: existingWorkDay.selectedBonuses || [],
        }]);
      }
    }
  }, [existingWorkDay]);

  const selectedEmployer = useMemo(() => {
    return employers.find(e => e.id === formData.employerId);
  }, [employers, formData.employerId]);

  const calculations = useMemo(() => {
    if (!selectedEmployer || segments.length === 0) {
      return null;
    }

    const segmentsForCalc = segments.map(seg => ({
      startTime: seg.startTime,
      endTime: seg.endTime,
      customDailyRate: seg.useCustomDailyRate ? seg.customDailyRate : undefined,
      selectedBonuses: seg.selectedBonuses,
    }));

    return calculateMultiSegmentPayment(
      segmentsForCalc,
      formData.calculationMode,
      formData.kilometers,
      selectedEmployer
    );
  }, [formData, segments, selectedEmployer]);

  const handleBonusToggle = (segmentId: string, bonusId: string) => {
    setSegments(segments.map(seg => {
      if (seg.id !== segmentId) return seg;
      return {
        ...seg,
        selectedBonuses: seg.selectedBonuses.includes(bonusId)
          ? seg.selectedBonuses.filter(id => id !== bonusId)
          : [...seg.selectedBonuses, bonusId],
      };
    }));
  };

  const addSegment = () => {
    const lastSegment = segments[segments.length - 1];
    setSegments([...segments, {
      id: uuidv4(),
      location: '',
      startTime: lastSegment?.endTime || '08:00',
      endTime: '23:00',
      customDailyRate: undefined,
      useCustomDailyRate: false,
      selectedBonuses: [],
    }]);
  };

  const removeSegment = (segmentId: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter(s => s.id !== segmentId));
    }
  };

  const updateSegment = (segmentId: string, updates: Partial<FormSegment>) => {
    setSegments(segments.map(seg =>
      seg.id === segmentId ? { ...seg, ...updates } : seg
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployer || !calculations) {
      alert('נא לבחור מעסיק');
      return;
    }

    // המרת נקודות לפורמט השמירה
    const workSegments: WorkSegment[] = segments.map(seg => ({
      id: seg.id,
      location: seg.location,
      startTime: seg.startTime,
      endTime: seg.endTime,
      customDailyRate: seg.useCustomDailyRate ? seg.customDailyRate : undefined,
      selectedBonuses: seg.selectedBonuses,
    }));

    // איסוף כל התוספות מכל הנקודות (לתאימות לאחור)
    const allBonuses = segments.flatMap(seg => seg.selectedBonuses);

    const workDay: WorkDay = {
      id: id || uuidv4(),
      employerId: formData.employerId,
      date: formData.date,
      // שמירת הנקודה הראשונה גם בשדות הישנים לתאימות לאחור
      location: segments[0]?.location || '',
      startTime: segments[0]?.startTime || '08:00',
      endTime: segments[segments.length - 1]?.endTime || '17:00',
      kilometers: formData.kilometers,
      selectedBonuses: allBonuses,
      customDailyRate: segments[0]?.useCustomDailyRate ? segments[0]?.customDailyRate : undefined,
      segments: workSegments,
      calculationMode: formData.calculationMode,
      regularHours: calculations.regularHours,
      overtimeHours: calculations.overtimeHours,
      totalBeforeVat: calculations.totalBeforeVat,
      totalWithVat: calculations.totalWithVat,
    };

    onSave(workDay);
    navigate('/');
  };

  if (employers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors">
        <p className="text-gray-600 dark:text-gray-400 mb-4">יש להוסיף מעסיק לפני הוספת יום עבודה</p>
        <button
          onClick={() => navigate('/employers')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          הוספת מעסיק
        </button>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        {isEditing ? 'עריכת יום עבודה' : 'הוספת יום עבודה'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* מעסיק */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              מעסיק <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.employerId}
              onChange={(e) => {
                setFormData({ ...formData, employerId: e.target.value });
                // איפוס תוספות בכל הנקודות כשמחליפים מעסיק
                setSegments(segments.map(seg => ({ ...seg, selectedBonuses: [] })));
              }}
              required
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">בחר מעסיק</option>
              {employers.map((employer) => (
                <option key={employer.id} value={employer.id}>
                  {employer.name}
                </option>
              ))}
            </select>
          </div>

          {/* תאריך */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              תאריך <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* קילומטרים */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">קילומטרים</label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.kilometers}
              onChange={(e) => setFormData({ ...formData, kilometers: Number(e.target.value) })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* אופן חישוב */}
          {segments.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">אופן חישוב שעות</label>
              <select
                value={formData.calculationMode}
                onChange={(e) => setFormData({ ...formData, calculationMode: e.target.value as 'combined' | 'separate' })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="combined">ביחד (מהתחלה הראשונה עד הסוף האחרון)</option>
                <option value="separate">בנפרד (כל נקודה עם יומית משלה)</option>
              </select>
            </div>
          )}
        </div>

        {/* נקודות עבודה */}
        <div className="border-t pt-4 md:pt-6">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm md:text-base">נקודות עבודה</h3>
            <button
              type="button"
              onClick={addSegment}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + הוספת נקודה
            </button>
          </div>

          <div className="space-y-3 md:space-y-4">
            {segments.map((segment, index) => (
              <div key={segment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4">
                <div className="flex justify-between items-center mb-2 md:mb-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm md:text-base">נקודה {index + 1}</h4>
                  {segments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(segment.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      הסרה
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {/* מיקום */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מיקום</label>
                    <input
                      type="text"
                      value={segment.location}
                      onChange={(e) => updateSegment(segment.id, { location: e.target.value })}
                      placeholder="הכנס מיקום"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* שעת התחלה */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      שעת התחלה <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={segment.startTime}
                      onChange={(e) => updateSegment(segment.id, { startTime: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* שעת סיום */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      שעת סיום <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={segment.endTime}
                      onChange={(e) => updateSegment(segment.id, { endTime: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* מחיר יומית מותאם */}
                  {selectedEmployer && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={segment.useCustomDailyRate}
                          onChange={(e) => updateSegment(segment.id, {
                            useCustomDailyRate: e.target.checked,
                            customDailyRate: e.target.checked ? (segment.customDailyRate || selectedEmployer.dailyRate) : undefined
                          })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        יומית מותאמת
                      </label>
                      {segment.useCustomDailyRate ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={segment.customDailyRate ?? selectedEmployer.dailyRate}
                          onChange={(e) => updateSegment(segment.id, { customDailyRate: Number(e.target.value) })}
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">{formatCurrency(selectedEmployer.dailyRate)}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* תוספות לנקודה */}
                {selectedEmployer && selectedEmployer.bonuses && selectedEmployer.bonuses.length > 0 && (
                  <div className="col-span-2 lg:col-span-4 mt-2 md:mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <h5 className="text-xs md:text-sm font-medium text-gray-700 mb-2">תוספות לנקודה זו:</h5>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {selectedEmployer.bonuses.map((bonus) => (
                        <label
                          key={bonus.id}
                          className="flex items-center gap-1.5 md:gap-2 cursor-pointer bg-white px-2 md:px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300"
                        >
                          <input
                            type="checkbox"
                            checked={segment.selectedBonuses.includes(bonus.id)}
                            onChange={() => handleBonusToggle(segment.id, bonus.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs md:text-sm text-gray-700">{bonus.name}</span>
                          <span className="text-xs md:text-sm text-green-600 dark:text-green-400 font-medium">{formatCurrency(bonus.amount)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* חישובים */}
        {calculations && (
          <div className="mt-4 md:mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4">
            <h3 className="font-medium text-gray-900 mb-2 md:mb-3 text-sm md:text-base">סיכום</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">שעות רגילות:</span>
                <p className="font-medium">{calculations.regularHours} שעות</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">שעות נוספות:</span>
                <p className="font-medium">{calculations.overtimeHours} שעות</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">לפני מע"מ:</span>
                <p className="font-medium">{formatCurrency(calculations.totalBeforeVat)}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">כולל מע"מ:</span>
                <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(calculations.totalWithVat)}</p>
              </div>
            </div>
            {calculations.bonusesTotal > 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                כולל תוספות: {formatCurrency(calculations.bonusesTotal)}
              </p>
            )}
            {segments.length > 1 && (
              <p className="mt-2 text-sm text-blue-600">
                {formData.calculationMode === 'combined'
                  ? `חישוב ביחד: ${segments.length} נקודות, יומית אחת`
                  : `חישוב בנפרד: ${segments.length} יומיות`}
              </p>
            )}
          </div>
        )}

        {/* כפתורים */}
        <div className="mt-4 md:mt-6 flex flex-col md:flex-row gap-3 md:gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:py-2 rounded-lg font-medium transition-colors text-base"
          >
            {isEditing ? 'עדכון' : 'שמירה'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 md:py-2 rounded-lg font-medium transition-colors text-base"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
