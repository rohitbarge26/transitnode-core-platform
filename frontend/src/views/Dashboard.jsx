import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import IntakeDashboard from './Receptionist/IntakeDashboard';
import BillingDashboard from './Accountant/BillingDashboard';
import AccountantPayroll from './Accountant/AccountantPayroll';
import YardArrivals from './GateOperations/YardArrivals';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ activeShipments: 0, pendingInvoices: 0 });
  const [receptionistTab, setReceptionistTab] = useState('INTAKE');
  const [accountantTab, setAccountantTab] = useState('BILLING');

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
        return <Navigate to="/admin" replace />;
      case 'RECEPTIONIST':
        return (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <button 
                onClick={() => setReceptionistTab('INTAKE')}
                style={{
                  background: receptionistTab === 'INTAKE' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                  border: receptionistTab === 'INTAKE' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                  color: receptionistTab === 'INTAKE' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: receptionistTab === 'INTAKE' ? 'bold' : 'normal'
                }}
              >
                Shipment Intake
              </button>
              <button 
                onClick={() => setReceptionistTab('YARD')}
                style={{
                  background: receptionistTab === 'YARD' ? 'rgba(176, 38, 255, 0.2)' : 'transparent',
                  border: receptionistTab === 'YARD' ? '1px solid var(--accent-purple)' : '1px solid transparent',
                  color: receptionistTab === 'YARD' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: receptionistTab === 'YARD' ? 'bold' : 'normal'
                }}
              >
                Yard Arrivals & OTP
              </button>
            </div>
            {receptionistTab === 'INTAKE' ? <IntakeDashboard /> : <YardArrivals />}
          </div>
        );
      case 'ACCOUNTANT':
        return (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <button 
                onClick={() => setAccountantTab('BILLING')}
                style={{
                  background: accountantTab === 'BILLING' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                  border: accountantTab === 'BILLING' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                  color: accountantTab === 'BILLING' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: accountantTab === 'BILLING' ? 'bold' : 'normal'
                }}
              >
                Freight Billing
              </button>
              <button 
                onClick={() => setAccountantTab('PAYROLL')}
                style={{
                  background: accountantTab === 'PAYROLL' ? 'rgba(74, 222, 128, 0.2)' : 'transparent',
                  border: accountantTab === 'PAYROLL' ? '1px solid #4ade80' : '1px solid transparent',
                  color: accountantTab === 'PAYROLL' ? '#4ade80' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: accountantTab === 'PAYROLL' ? 'bold' : 'normal'
                }}
              >
                Payroll & Salary Slips
              </button>
            </div>
            {accountantTab === 'BILLING' ? <BillingDashboard /> : <AccountantPayroll />}
          </div>
        );
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
