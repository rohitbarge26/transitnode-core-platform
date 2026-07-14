import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TenantBrandingContext } from '../context/TenantBrandingContext';
import IntakeDashboard from './Receptionist/IntakeDashboard';
import BillingDashboard from './Accountant/BillingDashboard';
import AccountantPayroll from './Accountant/AccountantPayroll';
import BookkeepingDashboard from './Accountant/BookkeepingDashboard';
import BankMatchingDashboard from './Accountant/BankMatchingDashboard';
import OutstandingDashboard from './Accountant/OutstandingDashboard';
import YardArrivals from './GateOperations/YardArrivals';
import { Navigate } from 'react-router-dom';
import DailyRunSheet from './Admin/DailyRunSheet';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { tenantProfile } = useContext(TenantBrandingContext);
  const [stats, setStats] = useState({ activeShipments: 0, pendingInvoices: 0 });
  const [receptionistTab, setReceptionistTab] = useState('INTAKE');
  const [accountantTab, setAccountantTab] = useState('BILLING');
  
  // Data for Daily Run Sheet
  const [workspaces, setWorkspaces] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

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
    
    // Fetch dropdown data for Daily Run Sheet if Operator
    if (user?.role === 'OPERATION' || user?.role === 'OPERATION_EXECUTIVE') {
      const fetchDropdowns = async () => {
        try {
          const res1 = await axios.get('/api/companies/my-workspaces');
          setWorkspaces(res1.data.workspaces || []);
          const res2 = await axios.get('/api/admin/suppliers');
          setSuppliers(res2.data || []);
        } catch (err) {
          console.error("Failed to fetch dropdowns:", err);
        }
      };
      fetchDropdowns();
    }

    // Poll for updates every 10 seconds
    const intervalId = setInterval(fetchStats, 10000);
    return () => clearInterval(intervalId);
  }, [user]);

  const renderRoleSpecificContent = () => {
    switch (user?.role) {
      case 'ADMIN':
        if (tenantProfile?.planType === 'LIFETIME' && tenantProfile?.customSubdomain === 'masteradmin') {
          return <Navigate to="/master-admin" replace />;
        }
        return <Navigate to="/admin" replace />;
      case 'OPERATION':
      case 'OPERATION_EXECUTIVE':
        return (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
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
              <button 
                onClick={() => setReceptionistTab('RUN_SHEET')}
                style={{
                  background: receptionistTab === 'RUN_SHEET' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
                  border: receptionistTab === 'RUN_SHEET' ? '1px solid #eab308' : '1px solid transparent',
                  color: receptionistTab === 'RUN_SHEET' ? '#facc15' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: receptionistTab === 'RUN_SHEET' ? 'bold' : 'normal'
                }}
              >
                Daily Run Sheet
              </button>
            </div>
            {receptionistTab === 'INTAKE' && <IntakeDashboard />}
            {receptionistTab === 'YARD' && <YardArrivals />}
            {receptionistTab === 'RUN_SHEET' && <DailyRunSheet workspaces={workspaces} suppliers={suppliers} isOperator={true} />}
          </div>
        );
      case 'ACCOUNTANT':
        return (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
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
                Billing & Invoices
              </button>
              <button 
                onClick={() => setAccountantTab('BOOKKEEPING')}
                style={{
                  background: accountantTab === 'BOOKKEEPING' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                  border: accountantTab === 'BOOKKEEPING' ? '1px solid #a855f7' : '1px solid transparent',
                  color: accountantTab === 'BOOKKEEPING' ? '#c084fc' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: accountantTab === 'BOOKKEEPING' ? 'bold' : 'normal'
                }}
              >
                Expense & Bookkeeping
              </button>
              <button 
                onClick={() => setAccountantTab('BANK_MATCHING')}
                style={{
                  background: accountantTab === 'BANK_MATCHING' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: accountantTab === 'BANK_MATCHING' ? '1px solid #6366f1' : '1px solid transparent',
                  color: accountantTab === 'BANK_MATCHING' ? '#818cf8' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: accountantTab === 'BANK_MATCHING' ? 'bold' : 'normal'
                }}
              >
                Bank & Matching
              </button>
              <button 
                onClick={() => setAccountantTab('OUTSTANDING')}
                style={{
                  background: accountantTab === 'OUTSTANDING' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  border: accountantTab === 'OUTSTANDING' ? '1px solid #f59e0b' : '1px solid transparent',
                  color: accountantTab === 'OUTSTANDING' ? '#fbbf24' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: accountantTab === 'OUTSTANDING' ? 'bold' : 'normal'
                }}
              >
                Outstanding
              </button>
              {/* Commented out Payroll & Salary Slips as requested
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
              */}
              {/* Flipkart MIS removed */}
            </div>
            {accountantTab === 'BILLING' && <BillingDashboard />}
            {accountantTab === 'BOOKKEEPING' && <BookkeepingDashboard />}
            {accountantTab === 'BANK_MATCHING' && <BankMatchingDashboard />}
            {accountantTab === 'OUTSTANDING' && <OutstandingDashboard />}
            {/* Commented out Payroll & Salary Slips as requested
            {accountantTab === 'PAYROLL' && <AccountantPayroll />}
            */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0 }}>Welcome, {user?.name || 'User'}</h2>
            {tenantProfile?.planType && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm ${
                tenantProfile.planType === 'LIFETIME' ? 'bg-amber-500 text-white shadow-amber-500/30' :
                tenantProfile.planType === 'PLATINUM' ? 'bg-indigo-600 text-white' : 
                tenantProfile.planType === 'SILVER' ? 'bg-slate-200 text-slate-800' : 
                'bg-teal-500 text-white'
              }`}>
                {tenantProfile.planType} PLAN
              </span>
            )}
          </div>
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
