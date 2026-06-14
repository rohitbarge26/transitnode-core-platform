import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const MagicLogin = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  const [status, setStatus] = useState('Verifying Secure Link...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const authenticateMagicLink = async () => {
      try {
        const response = await axios.post('/api/auth/magic-login', { token });
        
        // Log the user in via AuthContext
        login(response.data.token, response.data.user);
        
        setStatus('Authentication Successful. Redirecting...');
        
        // Short delay for UX
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } catch (err) {
        console.error('Magic link error:', err);
        setStatus('Authentication Failed');
        setError(err.response?.data?.message || 'This magic link is invalid or has expired.');
      }
    };

    if (token) {
      authenticateMagicLink();
    }
  }, [token, login, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        {error ? (
          <div>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Go to Standard Login
            </button>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="animate-spin w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Authenticating</h2>
            <p className="text-slate-600">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicLogin;
