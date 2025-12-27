import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { WorkDay, Employer } from '../types';
import { formatDate, formatCurrency, formatHours } from '../utils/calculations';

interface HomePageProps {
  workDays: WorkDay[];
  employers: Employer[];
  onDelete: (id: string) => void;
}

export function HomePage({ workDays, employers, onDelete }: HomePageProps) {
  const [filterEmployer, setFilterEmployer] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const getEmployerName = (employerId: string) => {
    const employer = employers.find(e => e.id === employerId);
    return employer?.name || 'לא ידוע';
  };

  const filteredWorkDays = useMemo(() => {
    return workDays
      .filter(day => {
        if (filterEmployer && day.employerId !== filterEmployer) return false;
        if (filterStartDate && day.date < filterStartDate) return false;
        if (filterEndDate && day.date > filterEndDate) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [workDays, filterEmployer, filterStartDate, filterEndDate]);

  const totals = useMemo(() => {
    return filteredWorkDays.reduce(
      (acc, day) => ({
        hours: acc.hours + day.regularHours + day.overtimeHours,
        km: acc.km + day.kilometers,
        beforeVat: acc.beforeVat + day.totalBeforeVat,
        withVat: acc.withVat + day.totalWithVat,
      }),
      { hours: 0, km: 0, beforeVat: 0, withVat: 0 }
    );
  }, [filteredWorkDays]);

  const handleDelete = (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק יום עבודה זה?')) {
      onDelete(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">ימי עבודה</h2>
        <Link
          to="/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 rounded-lg font-medium transition-colors text-sm md:text-base"
        >
          + הוספה
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-4 transition-colors">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center justify-between w-full text-gray-700 dark:text-gray-300 font-medium"
        >
          <span>סינון</span>
          <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`${showFilters ? 'block mt-3' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מעסיק</label>
              <select
                value={filterEmployer}
                onChange={(e) => setFilterEmployer(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">כל המעסיקים</option>
                {employers.map((employer) => (
                  <option key={employer.id} value={employer.id}>
                    {employer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מתאריך</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">עד תאריך</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {filteredWorkDays.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 md:p-4 mb-4 transition-colors">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2 text-sm">סיכום ({filteredWorkDays.length} ימים)</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-4 text-sm text-gray-900 dark:text-gray-100">
            <div>
              <span className="text-blue-600 dark:text-blue-400">שעות:</span> {formatHours(totals.hours)}
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">ק"מ:</span> {totals.km}
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">לפני מע"מ:</span> {formatCurrency(totals.beforeVat)}
            </div>
            <div className="font-medium">
              <span className="text-blue-600 dark:text-blue-400">סה"כ:</span> {formatCurrency(totals.withVat)}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredWorkDays.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
          {workDays.length === 0 ? (
            <>
              <p className="mb-4">אין ימי עבודה עדיין</p>
              <Link
                to="/add"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                הוסף יום עבודה ראשון
              </Link>
            </>
          ) : (
            <p>לא נמצאו תוצאות לפי הסינון שנבחר</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredWorkDays.map((day) => (
              <div key={day.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{formatDate(day.date)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{getEmployerName(day.employerId)}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(day.totalWithVat)}</div>
                  </div>
                </div>

                {day.location && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">📍 {day.location}</div>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">⏱ {day.startTime}-{day.endTime}</span>
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{formatHours(day.regularHours + day.overtimeHours)} שעות</span>
                  {day.overtimeHours > 0 && (
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded">+{formatHours(day.overtimeHours)} נוספות</span>
                  )}
                  {day.kilometers > 0 && (
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{day.kilometers} ק"מ</span>
                  )}
                </div>

                <div className="flex gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    to={`/edit/${day.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    עריכה
                  </Link>
                  <button
                    onClick={() => handleDelete(day.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                  >
                    מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">תאריך</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">מעסיק</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">מיקום</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">שעות</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">נוספות</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ק"מ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">סה"כ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">פעולות</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredWorkDays.map((day) => (
                    <tr key={day.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(day.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{getEmployerName(day.employerId)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{day.location}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatHours(day.regularHours)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {day.overtimeHours > 0 ? formatHours(day.overtimeHours) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{day.kilometers}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(day.totalWithVat)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Link
                            to={`/edit/${day.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            עריכה
                          </Link>
                          <button
                            onClick={() => handleDelete(day.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            מחיקה
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
