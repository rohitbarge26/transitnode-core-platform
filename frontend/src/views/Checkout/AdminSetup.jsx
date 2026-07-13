import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { TenantBrandingContext } from '../../context/TenantBrandingContext';

const AdminSetup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { logout } = useContext(AuthContext);
  const { tenantProfile } = useContext(TenantBrandingContext);
  const navigate = useNavigate();

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/users/setup-admin', {
        username,
        password,
        tenantId: tenantProfile?.tenantId
      });

      // Setup complete. Force logout so they use their new credentials
      logout();
      // Use window.location.href to force a hard reload so the TenantBrandingContext fetches the updated adminSetupComplete status
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to setup admin credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Secure Your Workspace</h2>
          <p className="text-slate-500 text-sm">
            Welcome to {tenantProfile?.companyName || 'PROHIT CoreTech'}! Set up your permanent admin credentials before entering the dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Admin Username</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
              placeholder="admin_doe" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
              placeholder="••••••••" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? 'Securing...' : 'Complete Setup & Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSetup;
