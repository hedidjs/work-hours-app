import { useState, useEffect, useRef } from 'react';
import type { BusinessDetails as BusinessDetailsType } from '../types';

interface BusinessDetailsProps {
  businessDetails: BusinessDetailsType;
  onSave: (details: BusinessDetailsType) => void;
  onChangePassword?: (newPassword: string) => void;
  onLogout?: () => void;
  onExportData?: () => void;
  onImportData?: (data: string) => boolean;
}

const emptyDetails: BusinessDetailsType = {
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

export function BusinessDetails({ businessDetails, onSave, onChangePassword, onLogout, onExportData, onImportData }: BusinessDetailsProps) {
  const [formData, setFormData] = useState<BusinessDetailsType>(emptyDetails);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Import state
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    setFormData(businessDetails);
  }, [businessDetails]);

  const compressImage = (file: File, maxWidth: number = 300, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // שמירה על יחס גובה-רוחב
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // דחיסת התמונה אוטומטית
        const compressedLogo = await compressImage(file, 300, 0.8);
        setFormData({ ...formData, logo: compressedLogo });
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('שגיאה בטעינת התמונה');
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = () => {
    setPasswordError('');

    if (newPassword.length < 4) {
      setPasswordError('הסיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('הסיסמאות לא תואמות');
      return;
    }

    if (onChangePassword) {
      onChangePassword(newPassword);
      setPasswordSaved(true);
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (onImportData && onImportData(content)) {
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('שגיאה בייבוא הנתונים');
        }
      } catch {
        setImportError('קובץ לא תקין');
      }
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-4">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">פרטי העסק</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors">
        {/* לוגו */}
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">לוגו</label>
          <div className="flex flex-col md:flex-row items-start gap-4">
            {formData.logo ? (
              <div className="relative">
                <img
                  src={formData.logo}
                  alt="לוגו"
                  className="w-32 h-32 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                אין לוגו
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium inline-block transition-colors"
              >
                העלאת לוגו
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">התמונה תידחס אוטומטית</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* פרטי עסק */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 text-sm md:text-base">פרטי עסק</h3>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">כתובת</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="כתובת"
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
          <div className="space-y-3 md:space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 text-sm md:text-base">פרטי העברה בנקאית</h3>

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

        <div className="mt-4 md:mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:py-2 rounded-lg font-medium transition-colors"
          >
            שמירה
          </button>
          {saved && (
            <span className="text-green-600 dark:text-green-400 font-medium text-center">נשמר בהצלחה!</span>
          )}
        </div>
      </form>

      {/* אבטחה */}
      {(onChangePassword || onLogout) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors mt-4 md:mt-6">
          <h3 className="font-medium text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 mb-4 text-sm md:text-base">אבטחה</h3>

          {onChangePassword && (
            <div className="mb-4">
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  🔑 שינוי סיסמה
                </button>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-sm">שינוי סיסמה</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סיסמה חדשה</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="הזן סיסמה חדשה"
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
                    {passwordError && (
                      <p className="text-red-500 text-sm">{passwordError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handlePasswordChange}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        שמור סיסמה
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                        }}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {passwordSaved && (
                <p className="text-green-600 dark:text-green-400 font-medium text-sm mt-2">הסיסמה שונתה בהצלחה!</p>
              )}
            </div>
          )}

          {onLogout && (
            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
                    onLogout();
                  }
                }}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                🚪 התנתקות
              </button>
            </div>
          )}
        </div>
      )}

      {/* גיבוי נתונים */}
      {(onExportData || onImportData) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors mt-4 md:mt-6">
          <h3 className="font-medium text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 mb-4 text-sm md:text-base">גיבוי והעברת נתונים</h3>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs mb-4">ייצא את הנתונים כדי לגבות או להעביר למכשיר/דפדפן אחר</p>

          <div className="flex flex-col md:flex-row gap-3">
            {onExportData && (
              <button
                onClick={onExportData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                📥 ייצוא נתונים
              </button>
            )}

            {onImportData && (
              <div>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                  id="import-data"
                />
                <label
                  htmlFor="import-data"
                  className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors inline-block"
                >
                  📤 ייבוא נתונים
                </label>
              </div>
            )}
          </div>

          {importSuccess && (
            <p className="text-green-600 dark:text-green-400 font-medium text-sm mt-3">הנתונים יובאו בהצלחה! הדף יתרענן...</p>
          )}
          {importError && (
            <p className="text-red-500 text-sm mt-3">{importError}</p>
          )}
        </div>
      )}
    </div>
  );
}
