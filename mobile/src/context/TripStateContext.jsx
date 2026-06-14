import React, { createContext, useState } from 'react';

export const TripStateContext = createContext();

export const TripStateProvider = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState(null);
  const [isGeofenceUnlocked, setIsGeofenceUnlocked] = useState(false);

  // Listens to real-time socket updates for geofence ingress
  
  return (
    <TripStateContext.Provider value={{ activeTrip, setActiveTrip, isGeofenceUnlocked, setIsGeofenceUnlocked }}>
      {children}
    </TripStateContext.Provider>
  );
};
