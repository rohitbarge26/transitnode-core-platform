import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const TenantBrandingContext = createContext();

export const TenantBrandingProvider = ({ children }) => {
  const [tenantState, setTenantState] = useState('LOADING'); // 'LOADING', 'MAIN_LANDING_PAGE', 'TENANT_RESOLVED', 'ERROR'
  const [tenantProfile, setTenantProfile] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const initializeTenant = async () => {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      const isMainDomain = 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        subdomain === 'masteradmin' ||
        hostname.startsWith('masteradmin.') ||
        hostname === 'transitnode.in' || 
        hostname === 'www.transitnode.in' ||
        hostname === 'corematrix.in' ||
        hostname === 'www.corematrix.in' ||
        hostname === 'prohitcoretech.in' ||
        hostname === 'www.prohitcoretech.in' ||
        hostname === 'prohitcoretech.com' ||
        hostname === 'www.prohitcoretech.com' ||
        hostname === 'transitnode.prohitcoretech.com' ||
        hostname === 'www.transitnode.prohitcoretech.com' ||
        hostname.endsWith('.vercel.app');

      if (isMainDomain) {
        setTenantState('MAIN_LANDING_PAGE');
        return;
      }

      if (!subdomain || subdomain === 'www') {
        setTenantState('MAIN_LANDING_PAGE');
        return;
      }

      try {
        const response = await axios.get(`/api/saas/tenant-profile?subdomain=${subdomain}`);
        const profileData = response.data;
        
        // Dynamically apply hex code to root CSS variables for instant skinning
        if (profileData.themeColorHex) {
          document.documentElement.style.setProperty('--color-tenant-primary', profileData.themeColorHex);
          document.documentElement.style.setProperty('--tenant-primary', profileData.themeColorHex);
        }
        
        setTenantProfile(profileData);
        setTenantState('TENANT_RESOLVED');
      } catch (error) {
        console.error('Failed to resolve tenant profile', error);
        setErrorDetails(error.response?.data?.error || 'Tenant Resolution Failed');
        setTenantState('ERROR');
      }
    };

    initializeTenant();
  }, []);

  return (
    <TenantBrandingContext.Provider value={{ tenantState, tenantProfile, errorDetails }}>
      {children}
    </TenantBrandingContext.Provider>
  );
};
