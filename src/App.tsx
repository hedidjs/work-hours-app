import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AddWorkDay } from './pages/AddWorkDay';
import { Employers } from './pages/Employers';
import { BusinessDetails } from './pages/BusinessDetails';
import { Statistics } from './pages/Statistics';
import { ExportPage } from './pages/ExportPage';
import { LoginPage } from './pages/LoginPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Employer, WorkDay, BusinessDetails as BusinessDetailsType } from './types';
import './index.css';

const DEFAULT_PASSWORD = '2Lol.net';

const initialBusinessDetails: BusinessDetailsType = {
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

function App() {
  const [employers, setEmployers] = useLocalStorage<Employer[]>('work-hours-employers', []);
  const [workDays, setWorkDays] = useLocalStorage<WorkDay[]>('work-hours-workdays', []);
  const [businessDetails, setBusinessDetails] = useLocalStorage<BusinessDetailsType>('work-hours-business', initialBusinessDetails);
  const [storedPassword, setStoredPassword] = useLocalStorage<string>('work-hours-password', DEFAULT_PASSWORD);
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('work-hours-auth', false);

  const handleLogin = (password: string): boolean => {
    if (password === storedPassword) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleChangePassword = (newPassword: string) => {
    setStoredPassword(newPassword);
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const saveEmployer = (employer: Employer) => {
    setEmployers(prev => {
      const exists = prev.find(e => e.id === employer.id);
      if (exists) {
        return prev.map(e => e.id === employer.id ? employer : e);
      }
      return [...prev, employer];
    });
  };

  const deleteEmployer = (id: string) => {
    setEmployers(prev => prev.filter(e => e.id !== id));
  };

  const saveWorkDay = (workDay: WorkDay) => {
    setWorkDays(prev => {
      const exists = prev.find(w => w.id === workDay.id);
      if (exists) {
        return prev.map(w => w.id === workDay.id ? workDay : w);
      }
      return [...prev, workDay];
    });
  };

  const deleteWorkDay = (id: string) => {
    setWorkDays(prev => prev.filter(w => w.id !== id));
  };

  const saveBusinessDetails = (details: BusinessDetailsType) => {
    setBusinessDetails(details);
  };

  // Export all data to JSON file
  const handleExportData = () => {
    const data = {
      employers,
      workDays,
      businessDetails,
      exportDate: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-hours-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data from JSON file
  const handleImportData = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);

      if (data.employers && Array.isArray(data.employers)) {
        setEmployers(data.employers);
      }
      if (data.workDays && Array.isArray(data.workDays)) {
        setWorkDays(data.workDays);
      }
      if (data.businessDetails && typeof data.businessDetails === 'object') {
        setBusinessDetails(data.businessDetails);
      }

      // Refresh the page after import to update all components
      setTimeout(() => window.location.reload(), 1500);
      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  };

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                workDays={workDays}
                employers={employers}
                onDelete={deleteWorkDay}
              />
            }
          />
          <Route
            path="/add"
            element={
              <AddWorkDay
                employers={employers}
                workDays={workDays}
                onSave={saveWorkDay}
              />
            }
          />
          <Route
            path="/edit/:id"
            element={
              <AddWorkDay
                employers={employers}
                workDays={workDays}
                onSave={saveWorkDay}
              />
            }
          />
          <Route
            path="/employers"
            element={
              <Employers
                employers={employers}
                onSave={saveEmployer}
                onDelete={deleteEmployer}
              />
            }
          />
          <Route
            path="/business"
            element={
              <BusinessDetails
                businessDetails={businessDetails}
                onSave={saveBusinessDetails}
                onChangePassword={handleChangePassword}
                onLogout={handleLogout}
                onExportData={handleExportData}
                onImportData={handleImportData}
              />
            }
          />
          <Route
            path="/statistics"
            element={
              <Statistics
                workDays={workDays}
                employers={employers}
              />
            }
          />
          <Route
            path="/export"
            element={
              <ExportPage
                workDays={workDays}
                employers={employers}
                businessDetails={businessDetails}
              />
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
