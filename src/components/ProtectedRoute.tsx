import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute = () => {
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);
  const loading = useAuthStore(state => state.loading);
  const initialized = useAuthStore(state => state.initialized);
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Limited access for pending users
  const allowedForPending = ['/pending', '/settings/profile', '/settings/security'];
  if (profile?.role === 'pending' && !allowedForPending.includes(location.pathname)) {
    return <Navigate to="/pending" replace />;
  }

  // Deny access to admin routes for members
  const adminOnlyRoutes = [
    '/members',
    '/members/', // for subroutes like /members/:id
    '/admin/app-settings',
    '/savings/deposit',
    '/savings/bulk'
  ];

  const isMember = profile?.role === 'member';
  if (isMember) {
    const isTryingAdminRoute = adminOnlyRoutes.some(route => 
      location.pathname === route || (route.endsWith('/') && location.pathname.startsWith(route))
    );
    
    if (isTryingAdminRoute) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};
