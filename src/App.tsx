import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { ThemeProvider } from './components/ThemeProvider';

// Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AppSettings from './pages/AppSettings';
import MemberList from './pages/MemberList';
import MemberDetail from './pages/MemberDetail';
import EditProfile from './pages/EditProfile';
import Security from './pages/Security';
import SingleDeposit from './pages/SingleDeposit';
import BulkDeposit from './pages/BulkDeposit';
import Notifications from './pages/Notifications';
import SavingsHistory from './pages/SavingsHistory';
import ManageSomobay from './pages/ManageSomobay';
import MySomobay from './pages/MySomobay';
import { ProtectedRoute } from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
    useSettingsStore.getState().fetchSettings();
  }, [initialize]);

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/pending" element={<PendingApproval />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/app-settings" element={<AppSettings />} />
            <Route path="/members" element={<MemberList />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/settings/profile" element={<EditProfile />} />
            <Route path="/settings/security" element={<Security />} />
            <Route path="/savings" element={<SavingsHistory />} />
            <Route path="/savings/deposit" element={<SingleDeposit />} />
            <Route path="/savings/bulk" element={<BulkDeposit />} />
            <Route path="/somobay/manage" element={<ManageSomobay />} />
            <Route path="/somobay/my" element={<MySomobay />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
