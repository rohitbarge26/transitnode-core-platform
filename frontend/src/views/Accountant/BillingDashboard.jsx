import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InvoiceModal from '../../components/InvoiceModal';

const BillingDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Freight Calculation State
  const [baseFreightRate, setBaseFreightRate] = useState(45000);
  const [driverAdvanceCash, setDriverAdvanceCash] = useState(0);
  const [fuelVoucherAmount, setFuelVoucherAmount] = useState(0);
  const [tollAllowance, setTollAllowance] = useState(0);
  const [rcmApplied, setRcmApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [processing, setProcessing] = useState(false);
  const [printData, setPrintData] = useState(null);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/invoices/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setInvoices(res.data.invoices);
      setError('');
    } catch (err) {
      setError('Failed to load audit queue.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async () => {
    // Global rates are less relevant here, but keeping for compatibility if needed.
    // We default baseFreightRate to 45000 for transport.
  };

  useEffect(() => {
    fetchInvoices();
    fetchRates();
  }, []);

  // Reset form inputs when a new shipment is selected
  useEffect(() => {
    if (selectedInvoice) {
      setBaseFreightRate(45000);
      setDriverAdvanceCash(0);
      setFuelVoucherAmount(0);
      setTollAllowance(0);
      setRcmApplied(false);
      setPaymentMethod('CASH');
    }
  }, [selectedInvoice]);

  // B2B Freight Calculation Utility
  const baseRate = Number(baseFreightRate) || 0;
  const gstRate = rcmApplied ? 0.05 : 0.18;
  const gstAmount = baseRate * gstRate;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  
  const grandTotal = baseRate + gstAmount;

  const handleSettle = async () => {
    if (!selectedInvoice) return;
    setProcessing(true);
    try {
      const payload = {
        baseFreightRate: baseRate,
        driverAdvanceCash: Number(driverAdvanceCash),
        fuelVoucherAmount: Number(fuelVoucherAmount),
        tollAllowance: Number(tollAllowance),
        rcmApplied,
        gstAmount,
        grandTotalToClient: grandTotal,
        paymentMethod
      };
      
      const token = localStorage.getItem('token');
      await axios.patch(`/api/invoices/settle/${selectedInvoice.trackingNumber}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Save data for print
      setPrintData({
        ...selectedInvoice,
        calculated: {
          baseFreightRate: baseRate,
          driverAdvanceCash: Number(driverAdvanceCash),
          fuelVoucherAmount: Number(fuelVoucherAmount),
          tollAllowance: Number(tollAllowance),
          rcmApplied,
          cgst,
          sgst,
          gstAmount,
          grandTotal
        }
      });
      // Refresh queue after successful patch
      fetchInvoices();

    } catch (err) {
      console.error('Failed to settle invoice', err);
      alert('Settlement failed. Check inputs.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mt-8 flex gap-6 h-[80vh]">
      
      {/* LEFT PANE: Audit Queue */}
      <div className="w-1/3 glass-panel p-6 flex flex-col h-full overflow-hidden">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Audit Queue</h3>
          <p className="text-xs text-gray-400 mt-1">Pending shipments awaiting final billing</p>
        </div>
        
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="text-gray-500 text-sm animate-pulse">Scanning ledgers...</div>
          ) : invoices.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-10">Queue is empty</div>
          ) : (
            invoices.map(inv => (
              <div 
                key={inv.trackingNumber}
                onClick={() => setSelectedInvoice(inv)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedInvoice?.trackingNumber === inv.trackingNumber 
                  ? 'bg-blue-900/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                  : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-sm font-bold text-blue-400">{inv.trackingNumber}</span>
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30">PENDING</span>
                </div>
                <div className="text-xs text-gray-300 truncate font-bold">{inv.logistics?.transport?.origin || 'Unknown'} → {inv.logistics?.transport?.destination || 'Unknown'}</div>
                <div className="text-[10px] text-gray-400 mt-1">{inv.logistics?.transport?.vehicleType || 'Unknown Vehicle'} | {inv.logistics?.transport?.vehicleNumber || 'Unregistered'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE: Calculation Workspace */}
      <div className="w-2/3 glass-panel p-6 flex flex-col h-full overflow-y-auto">
        {!selectedInvoice ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p>Select a shipment from the audit queue</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-start border-b border-gray-700/50 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Invoice Engine</h3>
                <p className="text-blue-400 font-mono mt-1">{selectedInvoice.trackingNumber}</p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Freight Financials */}
              <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-400 tracking-wider">FREIGHT FINANCIALS</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">RCM APPLIED (5%)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={rcmApplied} onChange={() => setRcmApplied(!rcmApplied)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">Base Freight Rate (₹)</span>
                  <input 
                    type="number" 
                    value={baseFreightRate}
                    onChange={e => setBaseFreightRate(e.target.value)}
                    className="w-32 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-right focus:border-blue-500 focus:outline-none font-mono text-white text-lg font-bold"
                  />
                </div>
              </div>

              {/* Expense Editor */}
              <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 space-y-4">
                <h4 className="text-sm font-bold text-gray-400 tracking-wider">TRIP EXPENSES (DRIVER ALLOCATION)</h4>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Driver Advance Cash (₹)</span>
                  <input 
                    type="number" 
                    value={driverAdvanceCash}
                    onChange={e => setDriverAdvanceCash(e.target.value)}
                    className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-right focus:border-blue-500 focus:outline-none font-mono text-white"
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Fuel Voucher Amount (₹)</span>
                  <input 
                    type="number" 
                    value={fuelVoucherAmount}
                    onChange={e => setFuelVoucherAmount(e.target.value)}
                    className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-right focus:border-blue-500 focus:outline-none font-mono text-white"
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Toll Allocation (₹)</span>
                  <input 
                    type="number" 
                    value={tollAllowance}
                    onChange={e => setTollAllowance(e.target.value)}
                    className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-right focus:border-blue-500 focus:outline-none font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Grand Total Breakdown */}
            <div className="bg-[#0B0E14] p-5 rounded-xl border border-gray-700 shadow-inner space-y-3">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Taxable Amount (Base Freight)</span>
                <span className="font-mono">₹{baseRate.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>CGST ({rcmApplied ? '2.5%' : '9%'})</span>
                <span className="font-mono">+ ₹{cgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>SGST ({rcmApplied ? '2.5%' : '9%'})</span>
                <span className="font-mono">+ ₹{sgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between items-end">
                <span className="text-lg font-bold text-white">Grand Total</span>
                <span className="text-3xl font-mono font-bold text-green-400">₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-400 tracking-wider">PAYMENT METHOD</span>
              <select 
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CORPORATE_ACCOUNT">Corporate Account</option>
              </select>
            </div>

            {/* Action */}
            <button 
              onClick={handleSettle}
              disabled={processing}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex justify-center items-center gap-2 ${
                processing 
                ? 'bg-blue-600/50 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              }`}
            >
              {processing ? 'Processing...' : 'Finalize & Settle Invoice'}
            </button>
            
          </div>
        )}
      </div>

      {/* Modal for Invoice Print Preview */}
      {printData && (
        <InvoiceModal 
          invoice={printData} 
          orientation="portrait"
          onClose={() => {
            setPrintData(null);
            setSelectedInvoice(null);
          }} 
        />
      )}
    </div>
  );
};

export default BillingDashboard;
