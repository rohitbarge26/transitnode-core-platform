import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookkeepingDashboard = () => {
  const [subTab, setSubTab] = useState('EXPENSES'); // 'EXPENSES' or 'PURCHASES'
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'PETTY_CASH',
    amount: '',
    paymentMethod: 'CASH',
    paidTo: '',
    description: ''
  });

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    vendorName: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    subtotal: '',
    taxAmount: '0',
    grandTotal: '',
    paymentStatus: 'PENDING',
    paymentMethod: 'BANK_TRANSFER'
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('/api/accounting/expenses', getHeaders());
      setExpenses(res.data.expenses || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expenses');
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await axios.get('/api/accounting/purchases', getHeaders());
      setPurchases(res.data.purchases || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch purchase invoices');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    if (subTab === 'EXPENSES') {
      await fetchExpenses();
    } else {
      await fetchPurchases();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [subTab]);

  // Expenses Submit
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.paidTo) {
      alert('Please fill out all required fields');
      return;
    }
    try {
      await axios.post('/api/accounting/expenses', expenseForm, getHeaders());
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        category: 'PETTY_CASH',
        amount: '',
        paymentMethod: 'CASH',
        paidTo: '',
        description: ''
      });
      fetchExpenses();
      alert('Expense recorded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save expense');
    }
  };

  // Expenses Delete
  const handleExpenseDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await axios.delete(`/api/accounting/expenses/${id}`, getHeaders());
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
    }
  };

  // Purchases Submit
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseForm.vendorName || !purchaseForm.invoiceNumber || !purchaseForm.grandTotal) {
      alert('Please fill out all required fields');
      return;
    }
    try {
      await axios.post('/api/accounting/purchases', purchaseForm, getHeaders());
      setPurchaseForm({
        vendorName: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        subtotal: '',
        taxAmount: '0',
        grandTotal: '',
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER'
      });
      fetchPurchases();
      alert('Purchase invoice recorded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save purchase invoice');
    }
  };

  // Purchases Delete
  const handlePurchaseDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase invoice?')) return;
    try {
      await axios.delete(`/api/accounting/purchases/${id}`, getHeaders());
      fetchPurchases();
    } catch (err) {
      console.error(err);
      alert('Failed to delete purchase invoice');
    }
  };

  // Update Status
  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/accounting/purchases/${id}/status`, { paymentStatus: status }, getHeaders());
      fetchPurchases();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  // Live total calculation for purchase form
  const handlePurchaseSubtotalChange = (val) => {
    const sub = Number(val) || 0;
    const tax = Number(purchaseForm.taxAmount) || 0;
    setPurchaseForm({
      ...purchaseForm,
      subtotal: val,
      grandTotal: sub + tax
    });
  };

  const handlePurchaseTaxChange = (val) => {
    const sub = Number(purchaseForm.subtotal) || 0;
    const tax = Number(val) || 0;
    setPurchaseForm({
      ...purchaseForm,
      taxAmount: val,
      grandTotal: sub + tax
    });
  };

  return (
    <div className="mt-4">
      {/* Sub Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700/50 pb-2">
        <button
          onClick={() => setSubTab('EXPENSES')}
          className={`pb-2 text-sm font-bold transition-all ${
            subTab === 'EXPENSES'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          General Expenses & Petty Cash
        </button>
        <button
          onClick={() => setSubTab('PURCHASES')}
          className={`pb-2 text-sm font-bold transition-all ${
            subTab === 'PURCHASES'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Vendor Purchase Invoices
        </button>
      </div>

      {error && <div className="text-red-400 bg-red-400/10 p-3 rounded mb-4 border border-red-400/30">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Container */}
        <div className="lg:col-span-1 glass-panel p-3 sm:p-4 md:p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="p-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs">📝</span>
            {subTab === 'EXPENSES' ? 'Record Expense' : 'Record Purchase'}
          </h4>

          {subTab === 'EXPENSES' ? (
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-semibold text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-semibold text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="PETTY_CASH">Petty Cash</option>
                  <option value="FUEL">Fuel Log</option>
                  <option value="MAINTENANCE">Maintenance & Spares</option>
                  <option value="OFFICE_EXPENSE">Office Expense</option>
                  <option value="UTILITIES">Utilities / Rent</option>
                  <option value="OTHER">Other Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm focus:border-purple-500 focus:outline-none"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Paid To / Recipient</label>
                <input
                  type="text"
                  placeholder="e.g. Suhas Enterprises"
                  value={expenseForm.paidTo}
                  onChange={e => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Payment Method</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-semibold text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other / Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notes / Description</label>
                <textarea
                  placeholder="Additional context/remarks..."
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white text-sm focus:border-purple-500 focus:outline-none h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
              >
                Save Expense Entry
              </button>
            </form>
          ) : (
            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bharat Petroleum Corporation"
                  value={purchaseForm.vendorName}
                  onChange={e => setPurchaseForm({ ...purchaseForm, vendorName: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g. BPCL/INV/2311"
                  value={purchaseForm.invoiceNumber}
                  onChange={e => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={purchaseForm.date}
                    onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={purchaseForm.dueDate}
                    onChange={e => setPurchaseForm({ ...purchaseForm, dueDate: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Subtotal (₹)</label>
                  <input
                    type="number"
                    placeholder="Subtotal"
                    value={purchaseForm.subtotal}
                    onChange={e => handlePurchaseSubtotalChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tax Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Tax"
                    value={purchaseForm.taxAmount}
                    onChange={e => handlePurchaseTaxChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Grand Total (₹)</label>
                <input
                  type="number"
                  placeholder="Total amount"
                  value={purchaseForm.grandTotal}
                  onChange={e => setPurchaseForm({ ...purchaseForm, grandTotal: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl p-2.5 text-white font-mono font-bold text-sm bg-purple-500/10 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                  <select
                    value={purchaseForm.paymentStatus}
                    onChange={e => setPurchaseForm({ ...purchaseForm, paymentStatus: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-semibold text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIALLY_PAID">Partial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Method</label>
                  <select
                    value={purchaseForm.paymentMethod}
                    onChange={e => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-semibold text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                Save Purchase Invoice
              </button>
            </form>
          )}
        </div>

        {/* List Container */}
        <div className="lg:col-span-2 glass-panel p-3 sm:p-4 md:p-6 flex flex-col h-[65vh]">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>List of Records</span>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">
              {subTab === 'EXPENSES' ? `${expenses.length} Expenses` : `${purchases.length} Invoices`}
            </span>
          </h4>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500 animate-pulse">Loading ledgers...</div>
            ) : subTab === 'EXPENSES' ? (
              expenses.length === 0 ? (
                <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500">No expenses recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div key={exp._id} className="flex justify-between items-center bg-gray-800/30 hover:bg-gray-800/60 p-4 rounded-xl border border-gray-700/50 transition-all duration-200">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {exp.category.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(exp.date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-white text-sm font-semibold truncate">Paid to: {exp.paidTo}</p>
                        {exp.description && <p className="text-gray-400 text-xs mt-1 truncate italic">"{exp.description}"</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white font-mono font-bold">₹{exp.amount.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{exp.paymentMethod}</p>
                        </div>
                        <button
                          onClick={() => handleExpenseDelete(exp._id)}
                          className="p-2 text-red-400 hover:bg-red-500/15 rounded-lg border border-transparent hover:border-red-500/30 transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : purchases.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500">No purchase invoices recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {purchases.map((pur) => (
                  <div key={pur._id} className="flex justify-between items-center bg-gray-800/30 hover:bg-gray-800/60 p-4 rounded-xl border border-gray-700/50 transition-all duration-200">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {pur.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(pur.date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="text-white text-sm font-semibold truncate">{pur.vendorName}</p>
                      {pur.dueDate && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          Due: {new Date(pur.dueDate).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-mono font-bold">₹{pur.grandTotal.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{pur.paymentMethod}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <select
                          value={pur.paymentStatus}
                          onChange={(e) => handleUpdateStatus(pur._id, e.target.value)}
                          className={`text-[10px] font-bold rounded px-2 py-1 border outline-none cursor-pointer ${
                            pur.paymentStatus === 'PAID'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : pur.paymentStatus === 'PARTIALLY_PAID'
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}
                        >
                          <option value="PENDING" className="bg-gray-900 text-white">Pending</option>
                          <option value="PARTIALLY_PAID" className="bg-gray-900 text-white">Partial</option>
                          <option value="PAID" className="bg-gray-900 text-white">Paid</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handlePurchaseDelete(pur._id)}
                        className="p-2 text-red-400 hover:bg-red-500/15 rounded-lg border border-transparent hover:border-red-500/30 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookkeepingDashboard;
