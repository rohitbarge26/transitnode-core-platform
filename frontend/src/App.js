import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantBrandingProvider } from './context/TenantBrandingContext';
import AppRouter from './routes/AppRouter';
import './index.css';

const App = () => {
  return (
    <AuthProvider>
      <TenantBrandingProvider>
        <Router>
          <AppRouter />
        </Router>
      </TenantBrandingProvider>
    </AuthProvider>
  );
};

export default App;
