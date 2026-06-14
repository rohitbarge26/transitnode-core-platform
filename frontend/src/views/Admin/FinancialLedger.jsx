import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FinancialLedger = () => {
  const [trialBalance, setTrialBalance] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('LEDGER'); // LEDGER or PAYROLL
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));
  
  // Export states
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const fetchFinanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [tbRes, pnlRes] = await Promise.all([
        axios.get('http://localhost:3000/api/finance/ledger', { headers }),
        axios.get('http://localhost:3000/api/finance/pnl', { headers })
      ]);
      setTrialBalance(tbRes.data.data || []);
      setPnl(pnlRes.data.data || null);
    } catch (err) {
      console.error('Failed to fetch finance data', err);
    }
  };

  const fetchPayroll = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/payroll', { headers: { Authorization: `Bearer ${token}` } });
      setPayrollData(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch payroll', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchFinanceData();
      await fetchPayroll();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleExport = (format) => {
    let url = `http://localhost:3000/api/finance/export?format=${format}`;
    if (exportStartDate) url += `&startDate=${exportStartDate}`;
    if (exportEndDate) url += `&endDate=${exportEndDate}`;
    
    // Create an invisible anchor tag to trigger download cleanly
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'xml' ? 'tally_export.xml' : 'freight_sales_register.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCalculatePayroll = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3000/api/payroll/calculate?month=${currentMonth}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchPayroll();
      alert('Payroll calculated successfully!');
    } catch (err) {
      alert('Failed to calculate payroll');
    }
  };

  const handleDisbursePayroll = async (ids) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/payroll/disburse', { ids }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchPayroll();
      alert('Payroll disbursed!');
    } catch (err) {
      alert('Failed to disburse payroll');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1117] text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Financial Engine...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-8 text-white font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-900/50 p-8 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Financial Engine
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Real-time ledger, P&L, and accounting sync</p>
          </div>
        </div>
        
        {/* Financial Data Synchronization Console */}
        <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30 flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Data Synchronization Console</h2>
                <p className="text-gray-400 text-sm">Export transactions for external accounting software</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-800/50 border border-white/5 rounded-xl p-2 px-3">
                <input 
                  type="date" 
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:ring-0 outline-none w-32"
                  style={{ colorScheme: 'dark' }}
                />
                <span className="text-gray-500 text-sm font-medium">to</span>
                <input 
                  type="date" 
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:ring-0 outline-none w-32"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleExport('xml')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  Tally XML
                </button>
                <button 
                  onClick={() => handleExport('excel')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Excel Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab('LEDGER')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'LEDGER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Ledger & P&L
          </button>
          <button 
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'PAYROLL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Payroll Processing
          </button>
        </div>

        {/* Ledger View */}
        {activeTab === 'LEDGER' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Trial Balance Table */}
            <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
              <h2 className="text-2xl font-bold mb-6 text-indigo-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                Live Trial Balance
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="py-3 px-4 font-medium">Account</th>
                      <th className="py-3 px-4 font-medium text-right">Debit (₹)</th>
                      <th className="py-3 px-4 font-medium text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalance.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-gray-200">{item.account}</td>
                        <td className="py-3 px-4 text-right text-emerald-400">{item.debit > 0 ? item.debit.toLocaleString() : '-'}</td>
                        <td className="py-3 px-4 text-right text-rose-400">{item.credit > 0 ? item.credit.toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* P&L Snapshot */}
            <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
              <h2 className="text-2xl font-bold mb-6 text-rose-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                Profit & Loss Snapshot
              </h2>
              {pnl ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-gray-400">Gross Revenue</span>
                    <span className="text-xl font-bold text-emerald-400">₹{pnl.revenue.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-3 px-4">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>- Fuel Expenses</span>
                      <span>₹{pnl.expenses.fuel.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>- Toll Expenses</span>
                      <span>₹{pnl.expenses.toll.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>- Payroll (Salary Expense)</span>
                      <span>₹{pnl.expenses.payroll ? pnl.expenses.payroll.toLocaleString() : '0'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-gradient-to-r from-emerald-900/40 to-transparent p-4 rounded-xl border-l-4 border-emerald-500">
                    <span className="font-semibold text-gray-300">Net Profit</span>
                    <span className="text-3xl font-black text-emerald-500">₹{pnl.netProfit.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">No data available.</div>
              )}
            </div>
          </div>
        )}

        {/* Payroll View */}
        {activeTab === 'PAYROLL' && (
          <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filter and Actions Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Payroll Processing
              </h2>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-gray-800 border border-white/10 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                >
                  <option value="All">All Months</option>
                  {[...new Set([new Date().toISOString().substring(0, 7), ...payrollData.map(r => r.paymentMonth)])].sort().reverse().map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <button 
                  onClick={handleCalculatePayroll}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                >
                  Run Monthly Calculation
                </button>
              </div>
            </div>

            {/* Dynamic Summary Cards */}
            {(() => {
              const filteredData = selectedMonth === 'All' ? payrollData : payrollData.filter(r => r.paymentMonth === selectedMonth);
              const totalNetPay = filteredData.reduce((sum, r) => sum + r.netPay, 0);
              const totalPaid = filteredData.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.netPay, 0);
              const totalPending = filteredData.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.netPay, 0);

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <p className="text-gray-400 text-sm font-medium mb-1">Total Net Pay</p>
                      <p className="text-2xl font-bold text-white">₹{totalNetPay.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
                      <p className="text-emerald-400/80 text-sm font-medium mb-1">Total Disbursed (Paid)</p>
                      <p className="text-2xl font-bold text-emerald-400">₹{totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                      <p className="text-amber-400/80 text-sm font-medium mb-1">Total Outstanding (Pending)</p>
                      <p className="text-2xl font-bold text-amber-400">₹{totalPending.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                          <th className="py-3 px-4 font-medium">Employee</th>
                          <th className="py-3 px-4 font-medium">Role</th>
                          {selectedMonth === 'All' && <th className="py-3 px-4 font-medium">Month</th>}
                          <th className="py-3 px-4 font-medium text-right">Base Salary</th>
                          <th className="py-3 px-4 font-medium text-right text-rose-400">- Advances</th>
                          <th className="py-3 px-4 font-medium text-right text-emerald-400">Net Pay</th>
                          <th className="py-3 px-4 font-medium text-center">Status</th>
                          <th className="py-3 px-4 font-medium text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length > 0 ? (
                          filteredData.map((record) => (
                            <tr key={record._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-medium">{record.employeeName || record.employeeId}</td>
                              <td className="py-3 px-4 text-sm text-gray-400">{record.role}</td>
                              {selectedMonth === 'All' && <td className="py-3 px-4 text-sm">{record.paymentMonth}</td>}
                              <td className="py-3 px-4 text-right">₹{record.baseSalary.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-rose-400 font-medium">₹{record.totalAdvances.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-emerald-400 font-bold">₹{record.netPay.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {record.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {record.status === 'PENDING' && (
                                  <button 
                                    onClick={() => handleDisbursePayroll([record._id])}
                                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition-colors shadow"
                                  >
                                    Disburse
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={selectedMonth === 'All' ? 8 : 7} className="py-8 text-center text-gray-500">
                              No payroll records found for this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialLedger;
