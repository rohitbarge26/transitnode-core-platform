import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShipmentTransactions = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('day');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/shipments?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedShipments = res.data.shipments || [];
      
      // Inject Demo Shipments for Client Demo
      const demoShipments = [
        {
          _id: 'demo1', trackingNumber: 'TR-DEMO-10001', status: 'PENDING',
          logistics: { transport: { origin: 'Mumbai', destination: 'Pune', vehicleNumber: 'MH 12 AB 1234', driverName: 'Rajesh Kumar' }, sender: { name: 'Acme Corp' }, receiver: { name: 'Beta Logistics' } },
          accounting: { grandTotal: 15400, paymentStatus: 'PENDING' }, metadata: { createdAt: new Date().toISOString() }
        },
        {
          _id: 'demo2', trackingNumber: 'TR-DEMO-10002', status: 'READY_FOR_DISPATCH',
          logistics: { transport: { origin: 'Delhi', destination: 'Jaipur', vehicleNumber: 'DL 1C 4567', driverName: 'Suresh Singh' }, sender: { name: 'Global Traders' }, receiver: { name: 'City Mart' } },
          accounting: { grandTotal: 28500, paymentStatus: 'PAID' }, metadata: { createdAt: new Date(Date.now() - 86400000).toISOString() }
        },
        {
          _id: 'demo3', trackingNumber: 'TR-DEMO-10003', status: 'IN_TRANSIT',
          logistics: { transport: { origin: 'Bangalore', destination: 'Chennai', vehicleNumber: 'KA 01 XY 9876', driverName: 'Ramesh Patel' }, sender: { name: 'Tech Solutions' }, receiver: { name: 'Electro Hub' } },
          accounting: { grandTotal: 42000, paymentStatus: 'PAID' }, metadata: { createdAt: new Date(Date.now() - 172800000).toISOString() }
        },
        {
          _id: 'demo4', trackingNumber: 'TR-DEMO-10004', status: 'DELIVERED',
          logistics: { transport: { origin: 'Kochi', destination: 'Trivandrum', vehicleNumber: 'KL 01 EF 5555', driverName: 'Mohan Das' }, sender: { name: 'Spice Exports' }, receiver: { name: 'Port Authority' } },
          accounting: { grandTotal: 18250, paymentStatus: 'PAID' }, metadata: { createdAt: new Date(Date.now() - 432000000).toISOString() }
        }
      ];

      setShipments([...demoShipments, ...fetchedShipments]);
      setError('');
    } catch (err) {
      console.error('Failed to load shipments:', err);
      setError('Failed to load shipment transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [timeRange]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded-md text-xs font-bold">PENDING</span>;
      case 'READY_FOR_DISPATCH':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-md text-xs font-bold">DISPATCH READY</span>;
      case 'IN_TRANSIT':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">IN TRANSIT</span>;
      case 'DELIVERED':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md text-xs font-bold">DELIVERED</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 px-2 py-1 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Shipment Transactions Ledger</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time view of all generated trips, transport statuses, and billing values.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium transition-all cursor-pointer"
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
              <th className="p-4">Status</th>
              <th className="p-4">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400 animate-pulse">Loading transaction records...</td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">No shipments found in the ledger.</td>
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
                    <div className={`text-xs mt-1 font-bold ${ship.accounting?.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {ship.accounting?.paymentStatus || 'UNPAID'}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    {getStatusBadge(ship.status)}
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
