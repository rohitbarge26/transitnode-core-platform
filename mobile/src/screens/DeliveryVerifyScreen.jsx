import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { I18nContext, DriverAuthContext } from '../App';

const DeliveryVerifyScreen = ({ tripId, currentStatus }) => {
  const { t } = useContext(I18nContext);
  const { driverToken } = useContext(DriverAuthContext);
  
  const [isArrived, setIsArrived] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // In a real environment, we'd connect to Socket.io here:
    // const socket = io('http://localhost:3000');
    // socket.on('vehicle-location-update', (data) => {
    //    if(data.geofenceStatus === 'ARRIVED') setIsArrived(true);
    // });
    
    // For demo/fallback, we provide a secret developer override or check status
    if (currentStatus === 'ARRIVED') {
      setIsArrived(true);
    }

    // Auto-trigger arrival for demo purposes after 30 seconds ONLY if the trip has actually started
    let timer;
    if (currentStatus === 'IN_TRANSIT') {
      timer = setTimeout(() => {
        if(!isArrived && !completed) setIsArrived(true);
      }, 30000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentStatus]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      await axios.post('http://192.168.29.237:3000/api/transports/verify-delivery', {
        tripId,
        otp
      }, {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      
      setCompleted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (currentStatus === 'DELIVERED') return null;

  if (completed) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-bounce">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-3xl font-black text-white text-center mb-2">Delivery Confirmed!</h2>
        <p className="text-gray-400 text-center">The asset has been logged into the yard.</p>
        <button onClick={() => {
          // Instead of reloading, we dispatch an event that the Dashboard listens to
          const event = new CustomEvent('delivery-completed');
          window.dispatchEvent(event);
        }} className="mt-12 text-emerald-400 font-bold bg-emerald-400/10 px-6 py-3 rounded-xl w-full">Return to Dashboard</button>
      </div>
    );
  }

  if (!isArrived) {
    return (
      <div className="fixed inset-x-0 bottom-0 p-6 z-40 bg-slate-900/40 backdrop-blur-xl border-t border-white/10 pointer-events-none shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 text-gray-300">
          <div className="relative">
             <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20"></div>
             <svg className="w-6 h-6 text-rose-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <span className="text-sm font-semibold tracking-wide">OTP Locked. Proceed to Destination Geofence.</span>
        </div>
      </div>
    );
  }

  // ARRIVED STATE
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-50 flex flex-col justify-end animate-in slide-in-from-bottom-full duration-500">
      <div className="bg-slate-900/80 w-full h-full sm:h-auto rounded-t-[2.5rem] p-8 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/20 rounded-full filter blur-3xl -translate-y-1/2 -translate-x-1/3"></div>

        <div className="flex justify-center mb-8 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-full flex items-center justify-center animate-pulse ring-1 ring-white/20 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-md">
            <svg className="w-12 h-12 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
        </div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 text-center mb-3 relative z-10">{t('arrival_alert')}</h2>
        <p className="text-indigo-200/70 text-center mb-10 text-sm font-medium relative z-10">Please collect the 6-digit verification pin from the yard manager to authorize drop-off.</p>

        <form onSubmit={handleVerify} className="space-y-6 flex-grow flex flex-col justify-end pb-8 relative z-10">
          <div>
            <label className="block text-center text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] mb-4">{t('enter_otp')}</label>
            <input 
              type="text"
              pattern="\d*"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-black/40 border-2 border-indigo-500/30 rounded-[1.5rem] px-4 py-6 text-white text-4xl text-center tracking-[1em] focus:ring-4 focus:ring-indigo-500/30 focus:border-cyan-400 outline-none transition-all placeholder-white/10 font-mono shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
              placeholder="------"
              autoComplete="off"
            />
          </div>
          
          {error && <div className="text-rose-300 text-sm text-center font-bold bg-rose-500/20 border border-rose-500/30 p-4 rounded-xl backdrop-blur-sm">{error}</div>}

          <button 
            type="submit" 
            disabled={verifying || otp.length !== 6}
            className={`w-full font-bold text-xl py-5 rounded-[1.5rem] shadow-[0_0_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all flex justify-center items-center overflow-hidden relative group ${otp.length === 6 ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-white/10' : 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'}`}
          >
             {otp.length === 6 && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
            <span className="relative z-10 flex items-center">
              {verifying ? (
                <svg className="animate-spin h-7 w-7 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Confirm Delivery'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeliveryVerifyScreen;
