import React, { useState, useContext } from 'react';
import axios from 'axios';
import { I18nContext, DriverAuthContext } from '../App';

const LoginScreen = () => {
  const { lang, setLang, t } = useContext(I18nContext);
  const { setDriverToken, setDriverData } = useContext(DriverAuthContext);
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Enforce 10 digit number
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://192.168.29.237:3000/api/auth/login', {
        email: `${phone}@transitnode.demo`, // Mock email mapping if needed, or backend auth takes phone
        password: password
      });
      
      if (response.data.token) {
        setDriverToken(response.data.token);
        setDriverData(response.data.user);
      } else {
        setError('Login failed: Invalid response from server');
      }
    } catch (err) {
      if (err.response) {
        // The server responded with a status code that falls out of the range of 2xx
        setError(`Server Error [${err.response.status}]: ${err.response.data?.message || JSON.stringify(err.response.data)}`);
        console.error("Login Server Error:", err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        setError(`Network Error: Cannot reach backend. ${err.message}`);
        console.error("Login Network Error:", err.message);
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`App Error: ${err.message}`);
        console.error("Login App Error:", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-12 justify-center relative z-10">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

      {/* Translation Toggles */}
      <div className="flex justify-center gap-4 mb-12 relative z-20">
        <button 
          onClick={() => setLang('en')}
          className={`px-5 py-2.5 rounded-full font-bold text-sm backdrop-blur-md border transition-all duration-300 ${lang === 'en' ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
        >
          English
        </button>
        <button 
          onClick={() => setLang('mr')}
          className={`px-5 py-2.5 rounded-full font-bold text-sm backdrop-blur-md border transition-all duration-300 ${lang === 'mr' ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
        >
          मराठी
        </button>
        <button 
          onClick={() => setLang('hi')}
          className={`px-5 py-2.5 rounded-full font-bold text-sm backdrop-blur-md border transition-all duration-300 ${lang === 'hi' ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
        >
          हिंदी
        </button>
      </div>

      <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl relative z-20">
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
             <span className="text-2xl font-black text-white">TN</span>
           </div>
        </div>
        <h1 className="text-3xl font-extrabold text-center mb-8 bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
          {t('login_title')}
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 tracking-wide">
              {t('username_label')}
            </label>
            <div className="relative">
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 tracking-wide">
              {t('password_label')}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-sm text-center font-medium backdrop-blur-sm">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 transition-all flex justify-center items-center overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            <span className="relative z-10 flex items-center">
              {loading ? (
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Secure Login'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
