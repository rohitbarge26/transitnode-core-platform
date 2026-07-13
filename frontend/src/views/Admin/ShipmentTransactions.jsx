import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShipmentTransactions = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('day');
  const [billingCycle, setBillingCycle] = useState('ALL');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/shipments?timeRange=${timeRange}&billingCycle=${billingCycle}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedShipments = res.data.shipments || [];
      
      setShipments(fetchedShipments);
      setError('');
    } catch (err) {
      console.error('Failed to load shipments:', err);
      setError('Failed to load shipment transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (shipments.length === 0) return;
    const headers = [
      'Tracking Number', 'Status', 'Sender Name', 'Receiver Name', 
      'Origin', 'Destination', 'Vehicle Number', 'Driver Name', 
      'Base Rate (INR)', 'Grand Total (INR)', 'Billing Cycle', 'Payment Status', 'Created Date'
    ];
    const rows = shipments.map(ship => [
      ship.trackingNumber,
      ship.status,
      ship.logistics?.sender?.name || '',
      ship.logistics?.receiver?.name || '',
      ship.logistics?.transport?.origin || '',
      ship.logistics?.transport?.destination || '',
      ship.logistics?.transport?.vehicleNumber || '',
      ship.logistics?.transport?.driverName || '',
      ship.accounting?.baseRateApplied || 0,
      ship.accounting?.grandTotal || ship.accounting?.subtotal || 0,
      ship.accounting?.billingCycle || 'DAILY',
      ship.accounting?.paymentStatus || 'UNPAID',
      new Date(ship.metadata?.createdAt).toLocaleDateString('en-IN')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shipment_ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchShipments();
  }, [timeRange, billingCycle]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="p-3 sm:p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Shipment Transactions Ledger</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time view of all generated trips, transport statuses, and billing values.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="appearance-none bg-indigo-50 text-indigo-700 border border-indigo-200 py-2 pl-4 pr-5 sm:pr-8 md:pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-bold tracking-wide transition-all cursor-pointer"
            >
              <option value="ALL">All Ledgers</option>
              <option value="DAILY">Daily / Cash Trips</option>
              <option value="MONTHLY">Monthly Billing Trips</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-5 sm:pr-8 md:pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium transition-all cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="day">Last 24 Hours</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="6month">Past 6 Months</option>
              <option value="year">Past Year</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <button 
            onClick={handleExportCSV} 
            disabled={shipments.length === 0} 
            className={`p-2 text-slate-500 hover:text-indigo-600 bg-white border border-slate-300 rounded-lg shadow-sm transition-colors ${shipments.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} 
            title="Export CSV to Spreadsheet"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button onClick={fetchShipments} className="p-2 text-slate-500 hover:text-indigo-600 bg-white border border-slate-300 rounded-lg shadow-sm transition-colors" title="Refresh list">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="p-4">Tracking ID</th>
              <th className="p-4">Route Details</th>
              <th className="p-4">Vehicle & Driver</th>
              <th className="p-4">Financials</th>
              <th className="p-4">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-4 sm:p-6 md:p-8 text-center text-slate-400 animate-pulse">Loading transaction records...</td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 sm:p-6 md:p-8 text-center text-slate-500">No shipments found in the ledger.</td>
              </tr>
            ) : (
              shipments.map(ship => (
                <tr key={ship._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 align-top">
                    <a href={`/tracker/${ship.trackingNumber}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors flex items-center gap-1">
                      {ship.trackingNumber}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                  <td className="p-4 align-top text-sm">
                    <div className="font-bold text-slate-800">{ship.logistics?.transport?.origin || 'Unknown'} <span className="text-slate-400 font-normal">to</span> {ship.logistics?.transport?.destination || 'Unknown'}</div>
                    <div className="text-xs text-slate-500 mt-1">{ship.logistics?.sender?.name} → {ship.logistics?.receiver?.name}</div>
                  </td>
                  <td className="p-4 align-top text-sm">
                    <div className="font-bold text-slate-700">{ship.logistics?.transport?.vehicleNumber || 'Unassigned'}</div>
                    <div className="text-xs text-slate-500 mt-1">{ship.logistics?.transport?.driverName || 'No Driver'}</div>
                  </td>
                  <td className="p-4 align-top text-sm">
                    <div className="font-bold font-mono text-slate-800">
                      ₹{(ship.accounting?.grandTotal || ship.accounting?.subtotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ship.accounting?.billingCycle === 'MONTHLY' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {ship.accounting?.billingCycle === 'MONTHLY' ? 'MONTHLY' : 'DAILY'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ship.accounting?.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {ship.accounting?.paymentStatus || 'UNPAID'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-top text-sm text-slate-500 font-mono">
                    {new Date(ship.metadata?.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShipmentTransactions;
