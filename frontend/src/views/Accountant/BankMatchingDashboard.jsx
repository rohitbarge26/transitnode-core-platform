import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatINR } from '../../utils/currency';

const BankMatchingDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [unbilledInvoices, setUnbilledInvoices] = useState([]);
  const [masterInvoices, setMasterInvoices] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState('');

  // Selected for matching
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // { id, trackingNumber / invoiceId, amount, type: 'DAILY_LR' / 'CONSOLIDATED' }

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchBankTransactions = async () => {
    try {
      const res = await axios.get('/api/accounting/bank-transactions', getHeaders());
      // Show UNMATCHED first, then sorted by date
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch transactions');
    }
  };

  const fetchUnbilledInvoices = async () => {
    try {
      const res = await axios.get('/api/accounting/receivables', getHeaders());
      setUnbilledInvoices(res.data.receivables || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMasterInvoices = async () => {
    try {
      const res = await axios.get('/api/invoices/consolidated', getHeaders());
      setMasterInvoices(res.data.invoices || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    await Promise.all([
      fetchBankTransactions(),
      fetchUnbilledInvoices(),
      fetchMasterInvoices()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Demo Statement Importer
  const handleLoadDemoStatement = async () => {
    const demoTxs = [
      {
        date: new Date().toISOString(),
        description: "CR: FT DIRECT DEP FLIPKART INDIA PVT LTD",
        refNo: "TXN-FTR-908122",
        amount: 86400,
        balance: 245000
      },
      {
        date: new Date(Date.now() - 86400000).toISOString(),
        description: "CR: IMPS NEFT FROM SARTHAK ENTP",
        refNo: "TXN-IMP-109283",
        amount: 14500,
        balance: 158600
      },
      {
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        description: "CR: CHEQUE DEP SUHAS BHOITE",
        refNo: "CHQ-008129",
        amount: 2200,
        balance: 144100
      },
      {
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        description: "DR: MANDATE BAZAZ FINANCE OUTLAY",
        refNo: "TXN-DEB-441209",
        amount: -8500,
        balance: 141900
      },
      {
        date: new Date(Date.now() - 4 * 86400000).toISOString(),
        description: "CR: FT DIRECT DEP AMAZON SELLER IN",
        refNo: "TXN-FTR-882103",
        amount: 104500,
        balance: 150400
      }
    ];

    try {
      setLoading(true);
      await axios.post('/api/accounting/bank-transactions/import', { transactions: demoTxs }, getHeaders());
      await fetchBankTransactions();
      alert('Loaded 5 demo statement entries successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to import statement');
    } finally {
      setLoading(false);
    }
  };

  // Match Action
  const handleMatch = async () => {
    if (!selectedTx || !selectedInvoice) return;
    setReconciling(true);
    try {
      await axios.post('/api/accounting/bank-transactions/match', {
        transactionId: selectedTx._id,
        invoiceId: selectedInvoice.id,
        invoiceType: selectedInvoice.type
      }, getHeaders());

      setSelectedTx(null);
      setSelectedInvoice(null);
      await loadData();
      alert('Reconciliation match logged successfully!');
    } catch (err) {
      console.error(err);
      alert('Matching failed. Please verify transaction details.');
    } finally {
      setReconciling(false);
    }
  };

  // Parse CSV File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const parsed = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(',');

        // Expected CSV structure: Date, Description, Reference, Amount, Balance
        if (columns.length >= 4) {
          parsed.push({
            date: columns[0],
            description: columns[1],
            refNo: columns[2],
            amount: Number(columns[3]) || 0,
            balance: Number(columns[4]) || 0
          });
        }
      }

      if (parsed.length === 0) {
        alert('Could not parse any rows. Ensure CSV uses format: Date, Description, Reference, Amount, Balance');
        return;
      }

      try {
        setLoading(true);
        await axios.post('/api/accounting/bank-transactions/import', { transactions: parsed }, getHeaders());
        await fetchBankTransactions();
        alert(`Successfully imported ${parsed.length} statement rows!`);
      } catch (err) {
        console.error(err);
        alert('Failed to import CSV statement');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Filter lists
  const unmatchedTxs = transactions.filter(t => t.status === 'UNMATCHED');
  const matchedTxs = transactions.filter(t => t.status === 'MATCHED');

  // We want to match:
  // - Pending daily LRs
  const matchableLrs = unbilledInvoices;

  // - Pending Master Consolidated Invoices
  const matchableMasters = masterInvoices
    .filter(inv => inv.status === 'PENDING')
    .map(inv => ({
      id: inv._id,
      label: inv.invoiceId,
      client: inv.supplierName,
      amount: inv.financials?.grandTotal,
      date: inv.createdAt,
      type: 'CONSOLIDATED'
    }));

  const allMatchableInvoices = [...matchableLrs, ...matchableMasters];

  return (
    <div className="mt-4">
      {/* Top Banner / Actions */}
      <div className="glass-panel p-3 sm:p-4 md:p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Bank Feed Reconciliation</h3>
          <p className="text-gray-400 text-sm mt-1">Upload bank statements or import bank feed, then match deposits directly to sales invoices.</p>
        </div>
        <div className="flex gap-4">
          <label className="px-4 py-2 border border-indigo-500/50 text-indigo-400 rounded-xl text-sm font-bold bg-indigo-500/5 hover:bg-indigo-500/15 transition cursor-pointer flex items-center gap-2">
            <span>📤 Upload CSV Statement</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleLoadDemoStatement}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            ⚡ Load Demo Feed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[68vh]">
        
        {/* LEFT COLUMN: Bank Feed */}
        <div className="lg:col-span-5 glass-panel p-3 sm:p-4 md:p-6 flex flex-col h-full overflow-hidden">
          <h4 className="text-base font-bold text-white mb-4 flex justify-between items-center">
            <span>Bank statement (Unmatched)</span>
            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
              {unmatchedTxs.length} Pending
            </span>
          </h4>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500 animate-pulse">Loading statements...</div>
            ) : unmatchedTxs.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500 text-sm">
                No unmatched bank feed transactions. Upload a CSV or load the demo feed to test.
              </div>
            ) : (
              unmatchedTxs.map((tx) => (
                <div
                  key={tx._id}
                  onClick={() => setSelectedTx(selectedTx?._id === tx._id ? null : tx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedTx?._id === tx._id
                      ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(tx.date).toLocaleDateString('en-IN')}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? `+ ₹${tx.amount.toLocaleString('en-IN')}` : `- ₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <p className="text-white text-xs font-semibold truncate uppercase">{tx.description}</p>
                  {tx.refNo && <p className="text-[9px] text-gray-500 font-mono mt-1">Ref: {tx.refNo}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MIDDLE RECONCILE COLUMN */}
        <div className="lg:col-span-2 flex flex-col justify-center items-center gap-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/10 p-4">
          <div className="text-center">
            <span className="text-3xl">🔗</span>
            <h5 className="text-sm font-bold text-white mt-2">Link Invoice</h5>
          </div>

          <div className="w-full space-y-3 bg-gray-900/50 p-3 rounded-xl border border-gray-800 text-center">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Transaction Selected</span>
              <span className="text-xs text-indigo-400 font-mono font-bold truncate block max-w-full">
                {selectedTx ? `₹${formatINR(selectedTx.amount)}` : 'None'}
              </span>
            </div>
            <div className="border-t border-gray-800 pt-2">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Invoice Selected</span>
              <span className="text-xs text-indigo-400 font-mono font-bold truncate block max-w-full">
                {selectedInvoice ? `${selectedInvoice.label} (₹${formatINR(selectedInvoice.amount)})` : 'None'}
              </span>
            </div>
          </div>

          <button
            onClick={handleMatch}
            disabled={!selectedTx || !selectedInvoice || reconciling}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              selectedTx && selectedInvoice && !reconciling
                ? 'bg-[#6366f1] text-white hover:bg-[#5053e1] hover:scale-[1.02] shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {reconciling ? 'Linking...' : 'Match & Settle'}
          </button>
        </div>

        {/* RIGHT COLUMN: Outstanding Sales Invoices */}
        <div className="lg:col-span-5 glass-panel p-3 sm:p-4 md:p-6 flex flex-col h-full overflow-hidden">
          <h4 className="text-base font-bold text-white mb-4 flex justify-between items-center">
            <span>Pending Receivables</span>
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30">
              {allMatchableInvoices.length} Pending
            </span>
          </h4>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500 animate-pulse">Loading receivables...</div>
            ) : allMatchableInvoices.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500 text-sm">
                No pending/unpaid invoices found in the system.
              </div>
            ) : (
              allMatchableInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(selectedInvoice?.id === inv.id ? null : inv)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedInvoice?.id === inv.id
                      ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${inv.type === 'CONSOLIDATED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' : 'bg-blue-500/20 text-blue-300 border border-blue-500/20'}`}>
                      {inv.type === 'CONSOLIDATED' ? 'CONSOLIDATED' : 'DAILY LR'}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      ₹{inv.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <div>
                      <p className="text-white text-xs font-semibold">{inv.client}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{inv.label}</p>
                    </div>
                    <span className="text-[9px] text-gray-500">
                      {new Date(inv.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BankMatchingDashboard;
