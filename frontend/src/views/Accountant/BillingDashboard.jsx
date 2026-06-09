import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InvoiceTemplate from '../../components/InvoiceTemplate';

const BillingDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Calculation State
  const [baseRate, setBaseRate] = useState(50);
  const [fuelSurcharge, setFuelSurcharge] = useState(0);
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

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Volumetric Calculation Utility
  let actualWeight = 0;
  let volumetricWeight = 0;
  let billableWeight = 0;

  if (selectedInvoice) {
    actualWeight = selectedInvoice.logistics?.package?.weight_kg || 0;
    
    // Parse dimensions (e.g. "10x20x30")
    const dims = selectedInvoice.logistics?.package?.dimensions || '0x0x0';
    const [l, w, h] = dims.split('x').map(n => Number(n) || 0);
    volumetricWeight = (l * w * h) / 5000;
    
    // If dimensions are 0 (e.g., missing), fallback to actual weight completely
    if (l === 0 && w === 0 && h === 0) {
      volumetricWeight = 0;
    }
    
    billableWeight = Math.max(actualWeight, volumetricWeight);
  }

  const baseSubtotal = billableWeight * Number(baseRate || 0);
  const surcharge = Number(fuelSurcharge || 0);
  const taxableAmount = baseSubtotal + surcharge;
  
  const gstAmount = taxableAmount * 0.18;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  
  const grandTotal = taxableAmount + gstAmount;

  const handleSettle = async () => {
    if (!selectedInvoice) return;
    setProcessing(true);
    try {
      const payload = {
        baseRateApplied: Number(baseRate),
        subtotal: baseSubtotal,
        fuelSurcharge: surcharge,
        gstAmount,
        grandTotal
      };
      
      const token = localStorage.getItem('token');
      await axios.patch(`/api/invoices/settle/${selectedInvoice.trackingNumber}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Save data for print
      setPrintData({
        ...selectedInvoice,
        calculated: {
          actualWeight,
          volumetricWeight,
          billableWeight,
          baseRate: Number(baseRate),
          baseSubtotal,
          fuelSurcharge: surcharge,
          cgst,
          sgst,
          grandTotal
        }
      });

      // Timeout allows React to render the InvoiceTemplate before calling print
      setTimeout(() => {
        window.print();
        // Clear selection and refresh queue
        setSelectedInvoice(null);
        setPrintData(null);
        fetchInvoices();
      }, 500);

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
                <div className="text-xs text-gray-300 truncate">{inv.logistics?.sender?.name} → {inv.logistics?.receiver?.name}</div>
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
              
              {/* Volumetric Section */}
              <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 space-y-4">
                <h4 className="text-sm font-bold text-gray-400 tracking-wider">WEIGHT ANALYSIS</h4>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Actual Weight</span>
                  <span className="font-mono text-white">{actualWeight.toFixed(2)} kg</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Dimensions (LxWxH)</span>
                  <span className="font-mono text-white">{selectedInvoice.logistics?.package?.dimensions || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Volumetric Weight</span>
                  <span className="font-mono text-white">{volumetricWeight.toFixed(2)} kg</span>
                </div>

                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-400">Billable Weight</span>
                  <span className="font-mono font-bold text-lg text-blue-400">{billableWeight.toFixed(2)} kg</span>
                </div>
              </div>

              {/* Financial Editor */}
              <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 space-y-4">
                <h4 className="text-sm font-bold text-gray-400 tracking-wider">BILLING MODIFIERS</h4>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Base Rate (₹/kg)</span>
                  <input 
                    type="number" 
                    value={baseRate}
                    onChange={e => setBaseRate(e.target.value)}
                    className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-right focus:border-blue-500 focus:outline-none font-mono text-white"
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Base Subtotal</span>
                  <span className="font-mono text-white">₹{baseSubtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Fuel Surcharge (₹)</span>
                  <input 
                    type="number" 
                    value={fuelSurcharge}
                    onChange={e => setFuelSurcharge(e.target.value)}
                    className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-right focus:border-blue-500 focus:outline-none font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Grand Total Breakdown */}
            <div className="bg-[#0B0E14] p-5 rounded-xl border border-gray-700 shadow-inner space-y-3">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Taxable Amount</span>
                <span className="font-mono">₹{taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>CGST (9%)</span>
                <span className="font-mono">+ ₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>SGST (9%)</span>
                <span className="font-mono">+ ₹{sgst.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between items-end">
                <span className="text-lg font-bold text-white">Grand Total</span>
                <span className="text-3xl font-mono font-bold text-green-400">₹{grandTotal.toFixed(2)}</span>
              </div>
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

      {/* Hidden printable invoice container */}
      {printData && (
        <div id="printable-label" className="hidden print:block absolute inset-0 bg-white">
          <InvoiceTemplate data={printData} />
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;
