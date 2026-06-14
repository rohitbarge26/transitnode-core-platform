import React, { useContext } from 'react';
import { DriverAuthContext } from '../../context/DriverAuthContext';

// Top navigation bar showing battery, tracker health, and status
const DriverHeader = () => {
  const { driver } = useContext(DriverAuthContext);

  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-cyan-900 rounded-full flex items-center justify-center text-cyan-400 font-bold border border-cyan-800">
          {driver?.name ? driver.name.charAt(0).toUpperCase() : 'D'}
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg leading-tight">{driver?.name || 'Driver'}</h2>
          <p className="text-cyan-500 text-xs font-medium tracking-wide">● ON DUTY</p>
        </div>
      </div>
      <div className="flex space-x-2 text-gray-400">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-gray-500">Tracker</span>
          <span className="text-green-400 text-xs font-bold">100%</span>
        </div>
      </div>
    </div>
  );
};

export default DriverHeader;
