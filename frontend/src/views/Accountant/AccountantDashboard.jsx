import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AccountantDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [processing, setProcessing] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/shipments/invoices/pending');
      setInvoices(res.data.invoices);
      setError('');
    } catch (err) {
      setError('Failed to load pending invoices.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    setProcessing(true);
    try {
      await axios.post(`/api/shipments/${selectedInvoice.trackingNumber}/pay`, {
        gstPercentage: Number(gstPercentage)
      });
      // Refresh list and close modal
      await fetchInvoices();
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Payment failed', err);
      alert('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate live totals for the modal
  const subtotal = selectedInvoice?.accounting?.subtotal || 0;
  const liveGstAmount = subtotal * (gstPercentage / 100);
  const liveGrandTotal = subtotal + liveGstAmount;

  return (
    <div className="mt-8">
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#4ade80]">Financial Ledger</h3>
            <p className="text-gray-400 text-sm mt-1">Review pending shipments, apply taxes, and capture payments.</p>
          </div>
          <div className="flex items-center space-x-2 text-sm bg-[#4ade80]/10 text-[#4ade80] px-3 py-1 rounded-full border border-[#4ade80]/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]"></span>
            </span>
            <span>Accounting System Online</span>
          </div>
        </div>

        {error && <div className="text-red-400 bg-red-400/10 p-3 rounded mb-4 border border-red-400/30">{error}</div>}

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-700/50 pb-2 px-4 text-xs font-bold text-gray-500 tracking-wider">
            <div className="w-1/4">TRACKING ID</div>
            <div className="w-1/4">SENDER</div>
            <div className="w-1/4">SUBTOTAL</div>
            <div className="w-1/4 text-right">ACTION</div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 animate-pulse">Loading ledgers...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/20 rounded-xl border border-gray-700/30">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400">All invoices are paid. No pending shipments.</p>
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv._id} className="flex justify-between items-center bg-gray-800/30 hover:bg-gray-800/60 p-4 rounded-xl border border-gray-700/50 transition-all duration-300">
                <div className="w-1/4">
                  <span className="text-[#4ade80] font-mono font-bold">{inv.trackingNumber}</span>
                </div>
                <div className="w-1/4">
                  <p className="text-white text-sm">{inv.logistics?.sender?.name}</p>
                  <p className="text-gray-500 text-xs">{inv.logistics?.package?.weight_kg} kg • {inv.logistics?.package?.dimensions}</p>
                </div>
                <div className="w-1/4">
                  <span className="text-gray-300 font-mono">${(inv.accounting?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="w-1/4 text-right">
                  <button 
                    onClick={() => setSelectedInvoice(inv)}
                    className="bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] border border-[#4ade80]/50 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]"
                  >
                    Generate Invoice
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Processing Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-[#0B0E14] text-white rounded-2xl shadow-2xl w-full max-w-md border border-[#4ade80]/30 overflow-hidden animate-slide-up">
            
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-b border-gray-700/50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Process Payment</h2>
                  <p className="text-[#4ade80] font-mono">{selectedInvoice.trackingNumber}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="text-gray-500 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Financial Breakdown */}
              <div className="space-y-3 bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Subtotal ({selectedInvoice.logistics?.package?.weight_kg}kg)</span>
                  <span className="font-mono text-gray-200">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Tax / GST (%)</span>
                  <input 
                    type="number" 
                    value={gstPercentage} 
                    onChange={(e) => setGstPercentage(e.target.value)}
                    className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-right focus:outline-none focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] font-mono"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax Amount</span>
                  <span className="font-mono text-gray-200">+ ${liveGstAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-700/50 pt-3 flex justify-between items-end">
                  <span className="text-gray-300 font-bold">Grand Total</span>
                  <span className="text-2xl font-mono font-bold text-[#4ade80]">${liveGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <button 
                onClick={handleProcessPayment}
                disabled={processing}
                className={`w-full py-4 rounded-xl font-bold text-black transition-all duration-300 flex justify-center items-center gap-2 ${
                  processing ? 'bg-[#4ade80]/50 cursor-not-allowed' : 'bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:scale-[1.02]'
                }`}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Capturing Payment...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Capture Payment & Dispatch
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">Shipment will instantly upgrade to READY_FOR_DISPATCH</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
