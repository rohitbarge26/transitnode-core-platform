import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantBrandingProvider } from './context/TenantBrandingContext.jsx';
import AppRouter from './routes/AppRouter.jsx';
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
