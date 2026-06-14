import React, { useContext } from 'react';
import { DriverAuthContext } from '../../context/DriverAuthContext';

// High-contrast pills for instant language changes
const LanguageButton = ({ langCode, label }) => {
  const { language, setLanguage } = useContext(DriverAuthContext);
  
  const isActive = language === langCode;

  return (
    <button
      onClick={() => setLanguage(langCode)}
      className={`px-4 py-2 rounded-full font-bold text-sm transition-colors duration-200 ${
        isActive ? 'bg-cyan-500 text-white shadow-lg' : 'bg-gray-800 text-gray-400'
      }`}
    >
      {label}
    </button>
  );
};

export default LanguageButton;
