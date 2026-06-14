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
      
      // We identify main domain patterns. (Vercel wildcard is typically *.domain.com)
      const isMainDomain = 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === 'transitnode.in' || 
        hostname === 'www.transitnode.in' ||
        hostname === 'corematrix.in' ||
        hostname === 'www.corematrix.in';

      if (isMainDomain) {
        setTenantState('MAIN_LANDING_PAGE');
        return;
      }

      // Extract leftmost subdomain token
      const subdomain = hostname.split('.')[0];
      
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
