import { useState } from 'react';

interface LoginPageProps {
  onLogin: (password: string) => boolean;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    // Small delay for UX
    setTimeout(() => {
      const success = onLogin(password);
      if (!success) {
        setError(true);
        setPassword('');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">ניהול שעות עבודה</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">הזן סיסמה כדי להיכנס</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
                error ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="הזן סיסמה"
              autoFocus
              autoComplete="current-password"
            />
            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">סיסמה שגויה, נסה שוב</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  );
}
