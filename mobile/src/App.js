import React, { useState, useEffect, createContext, useContext } from 'react';
import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';

const dictionaries = { en, mr, hi };

export const I18nContext = createContext();
export const DriverAuthContext = createContext();

export const MobileDriverApp = () => {
  const [lang, setLang] = useState(() => localStorage.getItem('driverLang') || 'en');
  const [driverToken, setDriverToken] = useState(() => localStorage.getItem('driverToken'));
  const [driverData, setDriverData] = useState(() => {
    try {
      const saved = localStorage.getItem('driverData');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // When token or data changes, persist them or remove them on logout
  useEffect(() => {
    if (driverToken) {
      localStorage.setItem('driverToken', driverToken);
      if (driverData) localStorage.setItem('driverData', JSON.stringify(driverData));
    } else {
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverData');
    }
  }, [driverToken, driverData]);

  useEffect(() => {
    localStorage.setItem('driverLang', lang);
  }, [lang]);

  useEffect(() => {
    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('change-lang', handleLangChange);
    return () => window.removeEventListener('change-lang', handleLangChange);
  }, []);

  const t = (key) => dictionaries[lang][key] || key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      <DriverAuthContext.Provider value={{ driverToken, setDriverToken, driverData, setDriverData }}>
        <div className="w-full min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 text-white font-sans overflow-x-hidden selection:bg-indigo-500/30 pb-20">
          {!driverToken ? (
            <LoginScreen />
          ) : (
            <DashboardScreen />
          )}
        </div>
      </DriverAuthContext.Provider>
    </I18nContext.Provider>
  );
};

export default MobileDriverApp;
