import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import IntakeDashboard from './Receptionist/IntakeDashboard';
import BillingDashboard from './Accountant/BillingDashboard';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ activeShipments: 0, pendingInvoices: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/shipments/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch system stats:", err);
      }
    };
    fetchStats();
    // Poll for updates every 10 seconds
    const intervalId = setInterval(fetchStats, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const renderRoleSpecificContent = () => {
    switch (user?.role) {
      case 'ADMIN':
        return (
          <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--accent-purple)' }}>Admin Controls</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You have full access to manage users, roles, and system configurations.</p>
          </div>
        );
      case 'RECEPTIONIST':
        return <IntakeDashboard />;
      case 'ACCOUNTANT':
        return <BillingDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Welcome, {user?.name || 'User'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Role: <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{user?.role}</span>
          </p>
        </div>
        <button 
          onClick={logout}
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid var(--glass-border)', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Universal Stats Widget */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>System Overview</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '16px', borderRadius: '8px', flex: 1 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)' }}>Active Shipments</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '8px' }}>{stats.activeShipments}</p>
            </div>
            <div style={{ background: 'rgba(176, 38, 255, 0.1)', padding: '16px', borderRadius: '8px', flex: 1 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--accent-purple)' }}>Pending Invoices</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '8px' }}>{stats.pendingInvoices}</p>
            </div>
          </div>
        </div>

      </div>

      {renderRoleSpecificContent()}
      
    </div>
  );
};

export default Dashboard;
