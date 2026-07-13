import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OutstandingDashboard = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOutstandingReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/accounting/reports/outstanding', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReport(res.data.report || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch outstanding report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutstandingReport();
  }, []);

  // Calculate totals
  const totalReceivables = report.reduce((sum, r) => sum + r.totalOutstanding, 0);
  const totalOverdue30 = report.reduce((sum, r) => sum + r.aging31to60 + r.aging61to90 + r.aging90Plus, 0);
  
  // Find top debtor
  const topDebtorObj = report.reduce((top, r) => {
    return (r.totalOutstanding > (top?.totalOutstanding || 0)) ? r : top;
  }, null);

  const handleSimulateReminder = (client) => {
    alert(`📧 Simulated Outstanding Payment Reminder Sent to ${client}!`);
  };

  return (
    <div className="mt-4">
      {error && <div className="text-red-400 bg-red-400/10 p-3 rounded mb-4 border border-red-400/30">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-panel p-3 sm:p-4 md:p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Total Outstanding</span>
          <h3 className="text-3xl font-mono font-bold text-white mt-2">
            ₹{totalReceivables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Across all unbilled daily LRs and consolidated invoices</p>
        </div>

        <div className="glass-panel p-3 sm:p-4 md:p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Overdue (&gt; 30 Days)</span>
          <h3 className="text-3xl font-mono font-bold text-red-400 mt-2">
            ₹{totalOverdue30.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Outstanding amounts aged beyond 30-day billing cycle</p>
        </div>

        <div className="glass-panel p-3 sm:p-4 md:p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Top Debtor</span>
          <h3 className="text-xl font-bold text-white mt-2 truncate">
            {topDebtorObj ? topDebtorObj.clientName : 'N/A'}
          </h3>
          <p className="text-xs text-indigo-400 font-mono font-bold mt-1">
            {topDebtorObj ? `₹${topDebtorObj.totalOutstanding.toLocaleString('en-IN')}` : '₹0.00'}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel p-3 sm:p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Client Aging Report</h3>
            <p className="text-gray-400 text-xs mt-1">Breakdown of outstanding invoices categorized by elapsed days.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-700/50 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            🖨️ Print Statement
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500 animate-pulse">Building outstanding aging ledger...</div>
        ) : report.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500">No outstanding customer invoices found. All settled!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-700/50 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">0 - 30 Days</th>
                  <th className="py-3 px-4 text-right">31 - 60 Days</th>
                  <th className="py-3 px-4 text-right">61 - 90 Days</th>
                  <th className="py-3 px-4 text-right text-red-400">90+ Days</th>
                  <th className="py-3 px-4 text-right font-black text-white">Total Outstanding</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {report.map((client, idx) => (
                  <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4 text-white font-bold">{client.clientName}</td>
                    <td className="py-4 px-4 text-center font-semibold text-gray-400">{client.itemsCount}</td>
                    <td className="py-4 px-4 text-right font-mono text-gray-300">
                      {client.aging0to30 > 0 ? `₹${client.aging0to30.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-gray-300">
                      {client.aging31to60 > 0 ? `₹${client.aging31to60.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-gray-300">
                      {client.aging61to90 > 0 ? `₹${client.aging61to90.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-red-400 font-bold">
                      {client.aging90Plus > 0 ? `₹${client.aging90Plus.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-black text-yellow-400 text-sm">
                      ₹{client.totalOutstanding.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleSimulateReminder(client.clientName)}
                        className="px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/25 text-yellow-400 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition text-[10px] font-bold"
                      >
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingDashboard;
