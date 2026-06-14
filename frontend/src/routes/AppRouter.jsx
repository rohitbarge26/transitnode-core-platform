import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TenantBrandingContext } from '../context/TenantBrandingContext';
import axios from 'axios';

// Lazy load pages for better performance
const Login = React.lazy(() => import('../views/Login'));
const Dashboard = React.lazy(() => import('../views/Dashboard'));
const PublicTracker = React.lazy(() => import('../views/PublicTracker'));
const AdminDashboard = React.lazy(() => import('../views/Admin/AdminDashboard'));
const PricingPortal = React.lazy(() => import('../views/LandingPage/PricingPortal'));
const MagicLogin = React.lazy(() => import('../views/MagicLogin'));
import YardArrivals from '../views/GateOperations/YardArrivals';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRouter = () => {
  const { user, logout } = useContext(AuthContext);
  const { tenantState, errorDetails } = useContext(TenantBrandingContext);
  
  React.useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn('Unauthorized request. Logging out...');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  if (tenantState === 'LOADING') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 mb-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-slate-600 font-medium">Resolving Workspace...</span>
        </div>
      </div>
    );
  }

  if (tenantState === 'ERROR') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fef2f2' }}>
        <div className="text-center p-8 bg-white rounded-2xl border border-red-200 shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-red-600">{errorDetails}</p>
          <button onClick={() => window.location.href = '/'} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">Return to Home</button>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}><span className="text-slate-500 font-medium">Loading Interface...</span></div>}>
      <Routes>
        <Route path="/" element={
          tenantState === 'MAIN_LANDING_PAGE' ? (
             user ? <Navigate to="/dashboard" /> : <PricingPortal />
          ) : (
             user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          )
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/magic-login/:token" element={<MagicLogin />} />
        <Route path="/tracker/:trackingId" element={<PublicTracker />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/yard-arrivals" element={
          <ProtectedRoute>
            <YardArrivals />
          </ProtectedRoute>
        } />
      </Routes>
    </React.Suspense>
  );
};

export default AppRouter;
