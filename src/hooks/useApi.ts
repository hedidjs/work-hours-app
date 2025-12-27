import { useState, useEffect, useCallback } from 'react';
import type { Employer, WorkDay, BusinessDetails, AppData } from '../types';

const API_URL = 'http://localhost:3001/api';

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
};

export function useApi() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>(initialBusinessDetails);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // טעינת נתונים
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/data`);
      if (response.ok) {
        const data: AppData = await response.json();
        setEmployers(data.employers || []);
        setWorkDays(data.workDays || []);
        setBusinessDetails(data.businessDetails || initialBusinessDetails);
        setError(null);
      } else {
        throw new Error('Failed to load data');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('לא ניתן להתחבר לשרת. וודא שהשרת רץ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // שמירת מעסיק
  const saveEmployer = useCallback(async (employer: Employer) => {
    try {
      const response = await fetch(`${API_URL}/employers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employer),
      });
      if (response.ok) {
        setEmployers(prev => {
          const exists = prev.find(e => e.id === employer.id);
          if (exists) {
            return prev.map(e => e.id === employer.id ? employer : e);
          }
          return [...prev, employer];
        });
      }
    } catch (err) {
      console.error('Error saving employer:', err);
    }
  }, []);

  // מחיקת מעסיק
  const deleteEmployer = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/employers/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEmployers(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Error deleting employer:', err);
    }
  }, []);

  // שמירת יום עבודה
  const saveWorkDay = useCallback(async (workDay: WorkDay) => {
    try {
      const response = await fetch(`${API_URL}/workdays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workDay),
      });
      if (response.ok) {
        setWorkDays(prev => {
          const exists = prev.find(w => w.id === workDay.id);
          if (exists) {
            return prev.map(w => w.id === workDay.id ? workDay : w);
          }
          return [...prev, workDay];
        });
      }
    } catch (err) {
      console.error('Error saving work day:', err);
    }
  }, []);

  // מחיקת יום עבודה
  const deleteWorkDay = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/workdays/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWorkDays(prev => prev.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error('Error deleting work day:', err);
    }
  }, []);

  // שמירת פרטי עסק
  const saveBusinessDetails = useCallback(async (details: BusinessDetails) => {
    try {
      const response = await fetch(`${API_URL}/business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (response.ok) {
        setBusinessDetails(details);
      }
    } catch (err) {
      console.error('Error saving business details:', err);
    }
  }, []);

  return {
    employers,
    workDays,
    businessDetails,
    loading,
    error,
    saveEmployer,
    deleteEmployer,
    saveWorkDay,
    deleteWorkDay,
    saveBusinessDetails,
    reload: loadData,
  };
}
