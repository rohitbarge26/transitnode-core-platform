import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TenantBrandingContext } from '../context/TenantBrandingContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const { tenantProfile } = useContext(TenantBrandingContext);
  const navigate = useNavigate();

  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  const isMasterAdminPortal = subdomain.toLowerCase() === 'masteradmin';

  // Redirect to Admin Setup if workspace payment is complete but admin setup is pending
  useEffect(() => {
    if (tenantProfile && tenantProfile.adminSetupComplete === false && !isMasterAdminPortal && subdomain && subdomain !== 'www') {
      navigate('/setup-admin');
    }
  }, [tenantProfile, isMasterAdminPortal, subdomain, navigate]);

  const [successMessage, setSuccessMessage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('payment_success') === 'true'
      ? 'Payment successful! Your workspace has been activated. Please check your registered mobile/email for the magic login link.'
      : '';
  });

  const handleInitMasterUser = async () => {
    if (!window.confirm('Are you sure you want to initialize the Master Admin tenant and user? This will create master@transitnode.com with the default password.')) {
      return;
    }
    setInitLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.post('/api/master-admin/setup-first-user', {}, {
        headers: {
          'x-master-admin-key': process.env.REACT_APP_MASTER_KEY || 'c3cb4790ebc7043b5db97c106c88e5dc93f8c8717f8e90f5cc967f885d0d47eb'
        }
      });
      setSuccessMessage(`${response.data.message}. You can now sign in with username: ${response.data.email} and password: ${response.data.password}`);
    } catch (err) {
      if (err.response) {
        setError(`Initialization Failed: ${err.response.data?.error || 'Unknown error'}`);
      } else {
        setError(`Network Error: ${err.message}`);
      }
    } finally {
      setInitLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Proxied request
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        subdomain: isMasterAdminPortal ? undefined : subdomain
      });

      const token = response.data.token;
      const user = response.data.user;

      login(token, user);
      
      // Route based on subdomain first, then role
      // Master admin portal lives on the "masteradmin" subdomain
      if (subdomain === 'masteradmin') {
        navigate('/master-admin');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response) {
        setError(`Error ${err.response.status}: ${err.response.data?.message || 'Unknown server error'}`);
      } else {
        setError(`Network/Proxy Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>TransitNode</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Logistics Management System</p>
        </div>

        {successMessage && (
          <div style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', color: '#2dd4bf', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.875rem' }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.3)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Email Address or Mobile Number</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="admin@transitnode.com or 9876543210"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {isMasterAdminPortal && (
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              style={{
                width: '100%',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px dashed #eab308',
                color: '#facc15',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                transition: 'all 0.3s ease'
              }}
              disabled={initLoading || loading}
              onClick={handleInitMasterUser}
            >
              {initLoading ? 'Initializing Master User...' : 'Initialize Master User'}
            </button>
          </div>
        )}

        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', letterSpacing: '0.02em', opacity: 0.6 }}>
            © 2026 PROHIT CoreTech — All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
