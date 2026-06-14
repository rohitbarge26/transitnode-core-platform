import React from 'react';
import TouchButton from '../components/Common/TouchButton';

// Google Maps deep-link launch coordinator console
const NavigationScreen = () => {
  const openMaps = () => {
    // Launch google maps intent
  };

  return (
    <div className="p-6 h-full flex flex-col justify-center bg-gray-900">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🗺️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Drive?</h2>
        <p className="text-gray-400">Mumbai Terminal, Maharashtra</p>
      </div>
      <TouchButton onClick={openMaps}>Open in Google Maps</TouchButton>
    </div>
  );
};

export default NavigationScreen;
