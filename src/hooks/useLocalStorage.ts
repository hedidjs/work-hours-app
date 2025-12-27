import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // קריאה מ-localStorage רק פעם אחת בטעינה
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item);
        console.log(`[localStorage] Loaded "${key}":`, parsed);
        return parsed;
      }
      // אם אין ערך, שמור את הערך ההתחלתי
      window.localStorage.setItem(key, JSON.stringify(initialValue));
      console.log(`[localStorage] Initialized "${key}" with:`, initialValue);
      return initialValue;
    } catch (error) {
      console.error(`[localStorage] Error reading "${key}":`, error);
      return initialValue;
    }
  });

  // פונקציה לעדכון הערך - שומרת ישירות ל-localStorage
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prevValue => {
      // חישוב הערך החדש
      const newValue = value instanceof Function ? value(prevValue) : value;

      // שמירה ל-localStorage
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
        console.log(`[localStorage] Saved "${key}":`, newValue);
      } catch (error) {
        console.error(`[localStorage] Error saving "${key}":`, error);
      }

      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
