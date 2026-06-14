import React, { createContext, useState, useEffect } from 'react';

export const DriverAuthContext = createContext();

export const DriverAuthProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [token, setToken] = useState(null);
  const [language, setLanguage] = useState('en');

  // Holds driver JWT session, profile info, and custom PINs
  const loginDriver = (sessionToken, driverProfile) => {
    setToken(sessionToken);
    setDriver(driverProfile);
  };

  const logoutDriver = () => {
    setToken(null);
    setDriver(null);
  };

  return (
    <DriverAuthContext.Provider value={{ driver, token, language, setLanguage, loginDriver, logoutDriver }}>
      {children}
    </DriverAuthContext.Provider>
  );
};
