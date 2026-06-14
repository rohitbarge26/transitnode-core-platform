import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { I18nContext, DriverAuthContext } from '../App';
import ReceiptUploader from '../components/Mobile/ReceiptUploader';
import DeliveryVerifyScreen from './DeliveryVerifyScreen';

const DashboardScreen = () => {
  const { t } = useContext(I18nContext);
  const { driverToken, setDriverToken, driverData, setDriverData } = useContext(DriverAuthContext);
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActiveTrip = async () => {
    try {
      const res = await axios.get('http://192.168.29.237:3000/api/transports/active-trip', {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      setTrip(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch active trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // We try to fetch the active trip. If the backend route isn't built yet, we mock the data to show the layout.
    fetchActiveTrip();
    
    const handleDeliveryCompleted = () => {
      setTrip(prev => prev ? { ...prev, status: 'DELIVERED' } : { trackingCode: 'TR-2026-10492', origin: 'Mumbai Hub', destination: 'Chennai Hub', commodity: 'Electronics & Textiles', destinationCoords: '13.0827,80.2707', advanceCash: 15000, status: 'DELIVERED' });
    };
    
    window.addEventListener('delivery-completed', handleDeliveryCompleted);
    return () => window.removeEventListener('delivery-completed', handleDeliveryCompleted);
  }, []);

  // Fallback to "Completed" state if no active trip is found
  const displayTrip = trip || {
    trackingCode: 'N/A',
    origin: '',
    destination: '',
    commodity: '',
    destinationCoords: '',
    advanceCash: 0,
    status: 'DELIVERED'
  };

  const [showSettings, setShowSettings] = useState(false);
  const [driverNameInput, setDriverNameInput] = useState(driverData?.name || 'Driver');

  const handleSaveSettings = () => {
    setDriverData(prev => ({ ...prev, name: driverNameInput }));
    setShowSettings(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = driverData?.name || 'Driver';
    if (hour < 12) return `${t('good_morning')}, ${name}!`;
    if (hour < 18) return `${t('good_afternoon')}, ${name}!`;
    return `${t('good_evening')}, ${name}!`;
  };

  const handleStartTrip = async () => {
    try {
      await axios.post('http://192.168.29.237:3000/api/transports/driver/start-trip', {
        trackingNumber: displayTrip.trackingCode
      }, {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      
      // Update local state to reflect it's now in transit
      setTrip(prev => ({ ...prev, status: 'IN_TRANSIT' }));
    } catch (err) {
      console.error('Error starting trip:', err);
    }
  };

  const handleLaunchMaps = () => {
    if (displayTrip.destinationCoords) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${displayTrip.destinationCoords}`, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-white">Loading Trip Data...</div>;

  return (
    <div className="relative min-h-screen pb-32 w-full max-w-2xl mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 sm:p-6 shadow-2xl rounded-b-[2rem] border-b border-white/10 mb-6 flex justify-between items-center backdrop-blur-xl">
        <div className="flex-1 min-w-0">
          <p className="text-emerald-300 font-bold text-sm mb-1">{getGreeting()}</p>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 truncate">{t('active_trip')}</h2>
          <p className="text-indigo-200 text-xs sm:text-sm font-semibold tracking-wide mt-1 truncate">{displayTrip.trackingCode}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <button onClick={() => setShowSettings(true)} className="text-white hover:text-cyan-300 bg-white/5 hover:bg-white/10 p-2 sm:px-4 sm:py-2 rounded-xl transition-all border border-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span className="hidden sm:inline">{t('settings')}</span>
          </button>
          <button onClick={() => setDriverToken(null)} className="text-rose-400 hover:text-white text-xs sm:text-sm font-bold bg-rose-500/10 hover:bg-rose-500/30 px-3 py-2 sm:px-4 rounded-xl transition-all border border-rose-500/20">{t('logout')}</button>
        </div>
      </div>

      {displayTrip.status === 'DELIVERED' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
          <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 relative shadow-[0_0_50px_rgba(16,185,129,0.3)]">
             <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
             <svg className="w-16 h-16 text-emerald-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 mb-4">{t('trip_completed') || 'Trip Completed!'}</h2>
          <p className="text-indigo-200 text-lg font-medium leading-relaxed max-w-sm">{t('trip_completed_desc') || 'You have successfully delivered the cargo. Please wait for the dispatcher to assign your next route.'}</p>
        </div>
      ) : (
        <div className="px-4 sm:px-5 space-y-6 flex-1 animate-in fade-in duration-500">
          {/* Manifest Card */}
          <div className="bg-slate-900/60 rounded-[2rem] p-5 sm:p-7 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">{t('manifest_payload')}</span>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-5 mb-6 relative z-10">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-400 ring-4 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.6)] z-10"></div>
                <div className="w-1 h-10 sm:h-12 bg-gradient-to-b from-indigo-500 to-cyan-500 my-1 rounded-full opacity-50"></div>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.6)] z-10"></div>
              </div>
              <div className="flex flex-col gap-4 sm:gap-6 w-full">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-indigo-300 font-medium mb-1 uppercase tracking-wider">{t('origin')}</p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">{displayTrip.origin}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-cyan-300 font-medium mb-1 uppercase tracking-wider">{t('destination')}</p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">{displayTrip.destination}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 sm:p-5 border border-white/5 relative z-10">
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-1 sm:mb-2 uppercase tracking-wider">{t('commodity')}</p>
              <p className="text-white font-semibold text-base sm:text-lg truncate">{displayTrip.commodity}</p>
            </div>
          </div>

          {/* Action: Google Maps & Start Trip */}
          <div className="flex flex-col gap-4 flex-shrink-0">
            {displayTrip.status === 'READY_FOR_DISPATCH' ? (
              <button 
                onClick={handleStartTrip}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-lg sm:text-xl py-4 sm:py-5 rounded-[2rem] shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex justify-center items-center gap-3 border border-white/10 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative z-10 flex items-center gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {t('start_trip') || 'Start Trip'}
                </span>
              </button>
            ) : (
              <button 
                onClick={handleLaunchMaps}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-lg sm:text-xl py-4 sm:py-5 rounded-[2rem] shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 transition-all flex justify-center items-center gap-3 border border-white/10 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative z-10 flex items-center gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {t('launch_nav') || 'Launch Navigation'}
                </span>
              </button>
            )}
          </div>

          {/* Ledger & Utilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-shrink-0">
            <div className="bg-slate-900/60 rounded-[2rem] p-5 sm:p-6 border border-white/10 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl flex flex-col justify-center items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full filter blur-xl -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-[10px] sm:text-xs text-emerald-300 font-medium mb-1 sm:mb-2 uppercase tracking-wider relative z-10">{t('pocket_advance')}</p>
              <p className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 relative z-10">₹{displayTrip.advanceCash?.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/60 rounded-[2rem] p-4 border border-white/10 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl h-full relative overflow-hidden min-h-[120px]">
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full filter blur-xl translate-y-1/2 -translate-x-1/2"></div>
               <div className="relative z-10 w-full h-full flex items-center justify-center">
                 <ReceiptUploader tripId={displayTrip.trackingCode} />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Geofence Lock Screen Overlay */}
      <DeliveryVerifyScreen tripId={displayTrip.trackingCode} currentStatus={displayTrip.status} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-[2rem] w-full max-w-sm relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-cyan-300">{t('driver_settings')}</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('your_name')}</label>
                <input 
                  type="text" 
                  value={driverNameInput}
                  onChange={(e) => setDriverNameInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('language')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => window.dispatchEvent(new CustomEvent('change-lang', {detail: 'en'}))} className="bg-white/5 border border-white/10 rounded-lg py-2 text-sm text-white hover:bg-indigo-500/30">EN</button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('change-lang', {detail: 'hi'}))} className="bg-white/5 border border-white/10 rounded-lg py-2 text-sm text-white hover:bg-indigo-500/30">HI</button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('change-lang', {detail: 'mr'}))} className="bg-white/5 border border-white/10 rounded-lg py-2 text-sm text-white hover:bg-indigo-500/30">MR</button>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold py-3 rounded-xl mt-4 active:scale-95 transition-transform"
              >
                {t('save_preferences')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardScreen;
