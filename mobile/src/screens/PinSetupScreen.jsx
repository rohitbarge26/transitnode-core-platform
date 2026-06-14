import React, { useState } from 'react';
import TouchButton from '../components/Common/TouchButton';

// 4-digit rapid security pin configuration view
const PinSetupScreen = () => {
  const [pin, setPin] = useState('');

  const handleSetup = () => {
    // Setup PIN logic
  };

  return (
    <div className="p-6 h-full flex flex-col justify-center">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Setup Fast PIN</h2>
      <input
        type="password"
        className="w-full bg-gray-800 text-white rounded-xl px-5 py-4 border border-gray-700 mb-6 text-center text-3xl tracking-[1em]"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />
      <TouchButton onClick={handleSetup}>Save PIN</TouchButton>
    </div>
  );
};

export default PinSetupScreen;
