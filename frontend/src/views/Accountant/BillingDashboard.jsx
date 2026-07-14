import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InvoiceModal from '../../components/InvoiceModal';
import ConsolidatedInvoiceModal from '../../components/ConsolidatedInvoiceModal';
import AccountantInvoiceForm from '../../components/AccountantInvoiceForm';
import AccountantMasterInvoiceForm from '../../components/AccountantMasterInvoiceForm';

const getApiUrl = (path) => {
  const backendBase = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    if (host.includes(':')) {
      const hostWithoutPort = host.split(':')[0];
      return `${protocol}//${hostWithoutPort}:3000${path}`;
    } else {
      return `${protocol}//${host}${path}`;
    }
  }
  return `${backendBase}${path}`;
};

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
  const [printMasterInvoice, setPrintMasterInvoice] = useState(null);

  // Sarthak LR Specific Charges
  const [processingCharge, setProcessingCharge] = useState(150);
  const [fuelSurcharge, setFuelSurcharge] = useState(0);
  const [rovCharge, setRovCharge] = useState(0);
  const [fodCharge, setFodCharge] = useState(0);
  const [handlingCharge, setHandlingCharge] = useState(200);
  const [codDodCharge, setCodDodCharge] = useState(0);
  const [specialDeliveryCharge, setSpecialDeliveryCharge] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paymentType, setPaymentType] = useState('CREDIT');
  const [modeOfPayment, setModeOfPayment] = useState('NEFT_RTGS');
  const [chequeNeftNo, setChequeNeftNo] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');

  // Consolidated Billing State
  const [viewMode, setViewMode] = useState('DAILY'); // 'DAILY', 'MONTHLY_GEN', 'CONSOLIDATED'
  
  const [monthlySuppliers, setMonthlySuppliers] = useState([]);
  const [billedInvoices, setBilledInvoices] = useState([]);
  const [selectedBilledInvoice, setSelectedBilledInvoice] = useState(null);
  const [selectedMonthlySupplier, setSelectedMonthlySupplier] = useState(null);
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [masterBaseRate, setMasterBaseRate] = useState(0);

  const [consolidatedInvoices, setConsolidatedInvoices] = useState([]);
  const [selectedConsolidated, setSelectedConsolidated] = useState(null);

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

  const fetchMonthlySuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/invoices/consolidated/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMonthlySuppliers(res.data.suppliers || []);
    } catch (err) {
      console.error('Failed to fetch monthly suppliers:', err);
    }
  };

  const fetchConsolidatedInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/invoices/consolidated', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setConsolidatedInvoices(res.data.invoices);
    } catch (err) {
      console.error('Failed to fetch consolidated invoices:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchMonthlySuppliers();
    fetchConsolidatedInvoices();
    fetchBilledInvoices();
  }, []);

  // Reset form inputs when a new shipment is selected
  useEffect(() => {
    if (selectedInvoice) {
      setBaseFreightRate(selectedInvoice.accounting?.baseRateApplied ?? 0);
      setDriverAdvanceCash(selectedInvoice.accounting?.driverAdvanceCash || 0);
      setFuelVoucherAmount(selectedInvoice.accounting?.fuelVoucherAmount || 0);
      setTollAllowance(selectedInvoice.accounting?.tollAllowance || 0);
      setRcmApplied(selectedInvoice.accounting?.tax?.rcmApplied || false);
      setPaymentMethod(selectedInvoice.accounting?.paymentMethod || 'SYSTEM');
      
      setProcessingCharge(selectedInvoice.accounting?.processingCharge || 150);
      setFuelSurcharge(selectedInvoice.accounting?.fuelSurcharge || 0);
      setRovCharge(selectedInvoice.accounting?.rovCharge || 0);
      setFodCharge(selectedInvoice.accounting?.fodCharge || 0);
      setHandlingCharge(selectedInvoice.accounting?.handlingCharge || 200);
      setCodDodCharge(selectedInvoice.accounting?.codDodCharge || 0);
      setSpecialDeliveryCharge(selectedInvoice.accounting?.specialDeliveryCharge || 0);
      setOtherCharges(selectedInvoice.accounting?.otherCharges || 0);
      setPaymentType(selectedInvoice.accounting?.paymentType || 'CREDIT');
      setModeOfPayment(selectedInvoice.accounting?.modeOfPayment || 'NEFT_RTGS');
      setChequeNeftNo(selectedInvoice.accounting?.chequeNeftNo || '');
      setBankName(selectedInvoice.accounting?.bankName || 'HDFC Bank Ltd');
    }
  }, [selectedInvoice]);

  // B2B Freight Calculation Utility
  const baseRate = Number(baseFreightRate) || 0;
  const templateType = selectedInvoice?.companyId?.invoiceTemplateType;
  const hasExplicitCompany = !!selectedInvoice?.companyId;
  const hasGstin = selectedInvoice?.companyId?.gstin && selectedInvoice.companyId.gstin.trim() !== "";
  const isNonGst = templateType === 'BILL_OF_SUPPLY' || templateType === 'SIMPLIFIED_3_COL' || (hasExplicitCompany && !hasGstin);

  const subTotal = baseRate + Number(processingCharge) + Number(fuelSurcharge) + Number(rovCharge) + Number(fodCharge) + Number(handlingCharge) + Number(codDodCharge) + Number(specialDeliveryCharge) + Number(otherCharges);
  const gstRate = isNonGst ? 0 : (templateType === 'TAX_INVOICE' || !templateType ? 0.12 : (rcmApplied ? 0.05 : 0.18));
  const gstAmount = subTotal * gstRate;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  
  const grandTotal = subTotal + gstAmount;

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
        paymentMethod,
        
        processingCharge: Number(processingCharge),
        fuelSurcharge: Number(fuelSurcharge),
        rovCharge: Number(rovCharge),
        fodCharge: Number(fodCharge),
        handlingCharge: Number(handlingCharge),
        codDodCharge: Number(codDodCharge),
        specialDeliveryCharge: Number(specialDeliveryCharge),
        otherCharges: Number(otherCharges),
        paymentType,
        modeOfPayment,
        chequeNeftNo,
        bankName
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
          grandTotal,
          
          processingCharge: Number(processingCharge),
          fuelSurcharge: Number(fuelSurcharge),
          rovCharge: Number(rovCharge),
          fodCharge: Number(fodCharge),
          handlingCharge: Number(handlingCharge),
          codDodCharge: Number(codDodCharge),
          specialDeliveryCharge: Number(specialDeliveryCharge),
          otherCharges: Number(otherCharges),
          paymentType,
          modeOfPayment,
          chequeNeftNo,
          bankName
        }
      });
      // Refresh queue after successful patch
      fetchInvoices();
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Failed to settle invoice', err);
      alert('Settlement failed. Check inputs.');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsMonthly = async () => {
    if (!selectedInvoice) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/invoices/monthly/${selectedInvoice.trackingNumber}`, {
        baseRateApplied: baseRate
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchInvoices();
      fetchMonthlySuppliers();
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Failed to mark as monthly', err);
      alert('Failed to mark shipment for monthly billing.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateConsolidated = async () => {
    if (!selectedMonthlySupplier) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/invoices/consolidated', {
        supplierName: selectedMonthlySupplier.supplierName,
        companyId: selectedMonthlySupplier.company?._id,
        taxPercentage: taxPercentage,
        overrideSubtotal: masterBaseRate
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSelectedMonthlySupplier(null);
      fetchMonthlySuppliers();
      fetchConsolidatedInvoices();
      setViewMode('CONSOLIDATED');
      alert('Master invoice generated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate master invoice.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSettleConsolidated = async () => {
    if (!selectedConsolidated) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/invoices/consolidated/${selectedConsolidated._id}/settle`, {
        paymentMethod
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSelectedConsolidated(null);
      fetchConsolidatedInvoices();
      alert('Master invoice settled successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to settle master invoice.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportConsolidated = async () => {
    if (!selectedConsolidated) return;
    try {
      const token = localStorage.getItem('token');
      const url = `/api/invoices/consolidated/${selectedConsolidated._id}/export`;
      
      const res = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `master_invoice_${selectedConsolidated.invoiceId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Failed to generate Excel export.');
    }
  };

  const fetchBilledInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/accounting/billed-invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBilledInvoices(res.data.invoices || []);
    } catch (err) {
      console.error('Failed to fetch billed invoices:', err);
    }
  };

  const handleUpdatePortalStatus = async (id, status, refId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/accounting/billed-invoices/${id}/portal-status`, {
        portalStatus: status,
        portalRefId: refId
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchBilledInvoices();
      alert('Portal upload status updated successfully!');
    } catch (err) {
      console.error('Failed to update portal status:', err);
      alert('Failed to update portal upload status.');
    }
  };

  return (
    <div className="mt-8 flex gap-6 h-[80vh]">
      
      {/* LEFT PANE: Audit Queue */}
      <div className="w-1/3 glass-panel p-3 sm:p-4 md:p-6 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Billing Queue</h3>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => setViewMode('DAILY')} 
                className={`text-[10px] px-3 py-1 rounded-full font-bold transition ${viewMode === 'DAILY' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                Unbilled Daily
              </button>
              <button 
                onClick={() => setViewMode('MONTHLY_GEN')} 
                className={`text-[10px] px-3 py-1 rounded-full font-bold transition ${viewMode === 'MONTHLY_GEN' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                EOM Generation
              </button>
              <button 
                onClick={() => setViewMode('CONSOLIDATED')} 
                className={`text-[10px] px-3 py-1 rounded-full font-bold transition ${viewMode === 'CONSOLIDATED' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                Master Invoices
              </button>
              <button 
                onClick={() => setViewMode('PORTAL_TRACKER')} 
                className={`text-[10px] px-3 py-1 rounded-full font-bold transition ${viewMode === 'PORTAL_TRACKER' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                Portal Tracker
              </button>
            </div>
          </div>
        </div>
        
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="text-gray-500 text-sm animate-pulse">Loading ledgers...</div>
          ) : viewMode === 'DAILY' ? (
            invoices.length === 0 ? (
              <div className="text-gray-500 text-sm text-center mt-10">Queue is empty</div>
            ) : (
              <>
                {invoices.map(inv => (
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
                    <div className="text-xs text-gray-300 truncate font-bold">{inv.logistics?.receiver?.name || 'Unknown Supplier'}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{inv.logistics?.transport?.origin} → {inv.logistics?.transport?.destination}</div>
                  </div>
                ))}
              </>
            )
          ) : viewMode === 'MONTHLY_GEN' ? (
            monthlySuppliers.length === 0 ? (
              <div className="text-gray-500 text-sm text-center mt-10">No pending monthly shipments</div>
            ) : (
              monthlySuppliers.map((sup, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedMonthlySupplier(sup);
                    setMasterBaseRate(sup.estimatedSubtotal);
                    const tType = sup.company?.invoiceTemplateType;
                    const hasExplicitCompany = !!sup.company;
                    const hasGst = sup.company?.gstin && sup.company.gstin.trim() !== "";
                    if (tType === 'BILL_OF_SUPPLY' || tType === 'SIMPLIFIED_3_COL' || (hasExplicitCompany && !hasGst)) {
                      setTaxPercentage(0);
                    } else {
                      setTaxPercentage(18);
                    }
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedMonthlySupplier?.supplierName === sup.supplierName 
                    ? 'bg-yellow-900/40 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                    : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-yellow-400">{sup.supplierName}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold mb-1 border-b border-gray-700/50 pb-1">via {sup.company?.companyName || 'UNKNOWN COMPANY'}</div>
                  <div className="text-xs text-gray-300 mt-2">Pending Shipments: <span className="font-bold">{sup.shipmentCount}</span></div>
                  <div className="text-[10px] text-gray-400 mt-1">Est. Subtotal: ₹{sup.estimatedSubtotal.toLocaleString('en-IN')}</div>
                </div>
              ))
            )
          ) : viewMode === 'CONSOLIDATED' ? (
            consolidatedInvoices.length === 0 ? (
              <div className="text-gray-500 text-sm text-center mt-10">No master invoices found</div>
            ) : (
              consolidatedInvoices.map(inv => (
                <div 
                  key={inv._id}
                  onClick={() => setSelectedConsolidated(inv)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedConsolidated?._id === inv._id 
                    ? 'bg-purple-900/40 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.2)]' 
                    : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-sm font-bold text-purple-400">{inv.invoiceId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${inv.status === 'PAID' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 truncate font-bold">{inv.supplierName}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{inv.shipmentIds.length} Shipments | ₹{inv.financials.grandTotal.toLocaleString('en-IN')}</div>
                </div>
              ))
            )
          ) : (
            billedInvoices.length === 0 ? (
              <div className="text-gray-500 text-sm text-center mt-10">No billed invoices found</div>
            ) : (
              billedInvoices.map(inv => (
                <div 
                  key={inv.id}
                  onClick={() => setSelectedBilledInvoice(inv)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedBilledInvoice?.id === inv.id 
                    ? 'bg-pink-900/40 border-pink-500/50 shadow-[0_0_15px_rgba(219,39,119,0.2)]' 
                    : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-sm font-bold text-pink-400">{inv.invoiceId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      inv.portalStatus === 'UPLOADED' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                        : inv.portalStatus === 'DISPUTED' 
                        ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }`}>
                      {inv.portalStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 truncate font-bold">{inv.clientName}</div>
                  <div className="text-[10px] text-gray-400 mt-1">₹{inv.amount.toLocaleString('en-IN')} | {inv.type === 'CONSOLIDATED' ? 'MONTHLY' : 'DAILY'}</div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* RIGHT PANE: Calculation Workspace */}
      <div className="w-2/3 glass-panel p-3 sm:p-4 md:p-6 flex flex-col h-full overflow-y-auto">
        {viewMode === 'DAILY' ? (
          !selectedInvoice ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p>Select a single shipment to bill immediately, or select multiple checkboxes to generate a Master Invoice.</p>
            </div>
          ) : (
          <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
            <div className="flex justify-between items-start border-b border-gray-700/50 pb-4 no-print">
              <div>
                <h3 className="text-2xl font-bold text-white">Invoice Engine</h3>
                <p className="text-blue-400 font-mono mt-1">{selectedInvoice.trackingNumber}</p>
              </div>
              {/* Actions relocated to top */}
              <div className="flex gap-4">
                <button 
                  onClick={handleMarkAsMonthly}
                  disabled={processing}
                  className={`px-3 sm:px-4 md:px-6 py-2 rounded-xl font-bold text-white transition-all duration-300 flex justify-center items-center gap-2 ${
                    processing 
                    ? 'bg-yellow-600/50 cursor-not-allowed' 
                    : 'bg-yellow-600 hover:bg-yellow-500 shadow-[0_0_20px_rgba(202,138,4,0.4)]'
                  }`}
                >
                  Mark for End-of-Month
                </button>

                <button 
                  onClick={handleSettle}
                  disabled={processing}
                  className={`px-3 sm:px-4 md:px-6 py-2 rounded-xl font-bold text-white transition-all duration-300 flex justify-center items-center gap-2 ${
                    processing 
                    ? 'bg-blue-600/50 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  }`}
                >
                  {processing ? 'Processing...' : 'Settle Now'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-white text-black shadow-lg rounded-md overflow-x-auto min-w-[700px]">
              <AccountantInvoiceForm 
                invoice={selectedInvoice}
                baseFreightRate={baseFreightRate}
                setBaseFreightRate={setBaseFreightRate}
                processingCharge={processingCharge}
                setProcessingCharge={setProcessingCharge}
                fuelSurcharge={fuelSurcharge}
                setFuelSurcharge={setFuelSurcharge}
                rovCharge={rovCharge}
                setRovCharge={setRovCharge}
                fodCharge={fodCharge}
                setFodCharge={setFodCharge}
                handlingCharge={handlingCharge}
                setHandlingCharge={setHandlingCharge}
                codDodCharge={codDodCharge}
                setCodDodCharge={setCodDodCharge}
                specialDeliveryCharge={specialDeliveryCharge}
                setSpecialDeliveryCharge={setSpecialDeliveryCharge}
                otherCharges={otherCharges}
                setOtherCharges={setOtherCharges}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                modeOfPayment={modeOfPayment}
                setModeOfPayment={setModeOfPayment}
                chequeNeftNo={chequeNeftNo}
                setChequeNeftNo={setChequeNeftNo}
                bankName={bankName}
                setBankName={setBankName}
                subTotal={subTotal}
                gstAmount={gstAmount}
                cgst={cgst}
                sgst={sgst}
                grandTotal={grandTotal}
                rcmApplied={rcmApplied}
                setRcmApplied={setRcmApplied}
                companyName={selectedInvoice?.companyId?.companyName || undefined}
                companyAddress={selectedInvoice?.companyId ? (selectedInvoice.companyId.address || "N/A") : undefined}
                companyGstin={selectedInvoice?.companyId ? (selectedInvoice.companyId.gstin || "N/A") : undefined}
                companyPan={selectedInvoice?.companyId ? (selectedInvoice.companyId.pan || "N/A") : undefined}
                receiverAddress={selectedInvoice?.supplierDetails?.address || selectedInvoice?.logistics?.receiver?.address || undefined}
                receiverGstin={selectedInvoice?.supplierDetails?.gstin || undefined}
                receiverPan={selectedInvoice?.supplierDetails?.pan || undefined}
                templateType={selectedInvoice?.companyId?.invoiceTemplateType}
              />
            </div>




          </div>
          )
        ) : viewMode === 'MONTHLY_GEN' ? (
          !selectedMonthlySupplier ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <p>Select a Supplier to generate their Master Invoice</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
              <div className="border-b border-gray-700/50 pb-4 no-print flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">Generate Master Invoice</h3>
                  <p className="text-yellow-400 font-bold mt-1 text-xl">{selectedMonthlySupplier.supplierName}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMonthlySupplier.identifierType && (
                      <span className="px-2 py-1 bg-purple-900/50 border border-purple-500/30 text-purple-300 text-[10px] uppercase font-bold rounded-md">
                        {selectedMonthlySupplier.identifierType}
                      </span>
                    )}
                    {selectedMonthlySupplier.supportedBillingCycles?.length > 0 && (
                      <span className="px-2 py-1 bg-blue-900/50 border border-blue-500/30 text-blue-300 text-[10px] uppercase font-bold rounded-md">
                        Cycles: {selectedMonthlySupplier.supportedBillingCycles.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleGenerateConsolidated}
                  disabled={processing}
                  className={`px-4 sm:px-6 md:px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 flex justify-center items-center gap-2 ${
                    processing 
                    ? 'bg-purple-600/50 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                  }`}
                >
                  {processing ? 'Generating...' : `Create Master Invoice`}
                </button>
              </div>

              <div className="p-4 bg-white text-black shadow-lg rounded-md overflow-x-auto min-w-[700px]">
                <AccountantMasterInvoiceForm 
                  masterInvoiceId="PENDING GENERATION"
                  companyName={selectedMonthlySupplier.company?.companyName || undefined}
                  companyAddress={selectedMonthlySupplier.company ? (selectedMonthlySupplier.company.address || "N/A") : undefined}
                  companyGstin={selectedMonthlySupplier.company ? (selectedMonthlySupplier.company.gstin || "N/A") : undefined}
                  companyPan={selectedMonthlySupplier.company ? (selectedMonthlySupplier.company.pan || "N/A") : undefined}
                  templateType={selectedMonthlySupplier.company?.invoiceTemplateType || 'TAX_INVOICE'}
                  supplierName={selectedMonthlySupplier.supplierName}
                  receiverAddress={selectedMonthlySupplier.address || "Address Not Available"}
                  receiverGstin={selectedMonthlySupplier.gstin || "N/A"}
                  receiverPan={selectedMonthlySupplier.pan || "N/A"}
                  shipmentCount={selectedMonthlySupplier.shipmentCount}
                  baseRate={masterBaseRate}
                  rcmApplied={taxPercentage === 5}
                  setRcmApplied={(val) => setTaxPercentage(val ? 5 : 18)}
                  cgst={(masterBaseRate * (taxPercentage / 100)) / 2}
                  sgst={(masterBaseRate * (taxPercentage / 100)) / 2}
                  grandTotal={masterBaseRate + (masterBaseRate * (taxPercentage / 100))}
                  isEditable={false}
                />
              </div>

            </div>
          )
        ) : viewMode === 'CONSOLIDATED' ? (
          !selectedConsolidated ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <p>Select a Master Invoice from the queue</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
              <div className="flex justify-between items-start border-b border-gray-700/50 pb-4 no-print">
                <div>
                  <h3 className="text-2xl font-bold text-white">Master Invoice</h3>
                  <p className="text-purple-400 font-mono mt-1">{selectedConsolidated.invoiceId}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPrintMasterInvoice(selectedConsolidated)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print Summary
                  </button>
                  <button 
                    onClick={handleExportConsolidated}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-[0_0_15px_rgba(22,163,74,0.3)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                    Export Excel
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white text-black shadow-lg rounded-md overflow-x-auto min-w-[700px]">
                <AccountantMasterInvoiceForm 
                  masterInvoiceId={selectedConsolidated.invoiceId}
                  companyName={selectedConsolidated.companyId?.companyName || undefined}
                  companyAddress={selectedConsolidated.companyId ? (selectedConsolidated.companyId.address || "N/A") : undefined}
                  companyGstin={selectedConsolidated.companyId ? (selectedConsolidated.companyId.gstin || "N/A") : undefined}
                  companyPan={selectedConsolidated.companyId ? (selectedConsolidated.companyId.pan || "N/A") : undefined}
                  templateType={selectedConsolidated.companyId?.invoiceTemplateType || 'TAX_INVOICE'}
                  supplierName={selectedConsolidated.supplierName}
                  receiverAddress={selectedConsolidated.supplierAddress || "Address Not Available"}
                  receiverGstin={selectedConsolidated.supplierGstin || "N/A"}
                  receiverPan={selectedConsolidated.supplierPan || "N/A"}
                  shipmentCount={selectedConsolidated.shipmentIds.length}
                  baseRate={selectedConsolidated.financials.subtotal}
                  rcmApplied={selectedConsolidated.financials.taxAmount < (selectedConsolidated.financials.subtotal * 0.18)}
                  cgst={selectedConsolidated.financials.taxAmount / 2}
                  sgst={selectedConsolidated.financials.taxAmount / 2}
                  grandTotal={selectedConsolidated.financials.grandTotal}
                  isEditable={false}
                  invoiceDate={new Date(selectedConsolidated.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                  invoicePeriod={new Date(selectedConsolidated.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                />
              </div>

              {selectedConsolidated.status === 'PENDING' && (
                <div className="no-print">
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-400 tracking-wider">PAYMENT METHOD</span>
                    <select 
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleSettleConsolidated}
                    disabled={processing}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex justify-center items-center gap-2 ${
                      processing 
                      ? 'bg-purple-600/50 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                    }`}
                  >
                    {processing ? 'Processing...' : 'Record Payment & Settle Batch'}
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          !selectedBilledInvoice ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <p>Select a billed invoice from the list to track its portal upload status.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-700/50 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">Portal Upload Status</h3>
                  <p className="text-pink-400 font-mono mt-1">{selectedBilledInvoice.invoiceId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedBilledInvoice.portalStatus === 'UPLOADED' 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                    : selectedBilledInvoice.portalStatus === 'DISPUTED' 
                    ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                    : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                }`}>
                  {selectedBilledInvoice.portalStatus.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/20 border border-gray-700/50 rounded-xl p-3 sm:p-4 md:p-6 space-y-4">
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider text-pink-400">Invoice Details</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Client:</span><span className="text-white font-bold">{selectedBilledInvoice.clientName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Total Billed:</span><span className="text-white font-mono font-bold">₹{selectedBilledInvoice.amount.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Billing Date:</span><span className="text-white font-mono">{new Date(selectedBilledInvoice.date).toLocaleDateString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Billing Mode:</span><span className="text-white font-bold">{selectedBilledInvoice.type === 'CONSOLIDATED' ? 'Consolidated EOM' : 'Daily LR'}</span></div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Status:</span>
                      <span className={`font-bold ${selectedBilledInvoice.paymentStatus === 'PAID' ? 'text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded text-[10px]' : 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded text-[10px]'}`}>
                        {selectedBilledInvoice.paymentStatus || 'PENDING'}
                      </span>
                    </div>
                    {selectedBilledInvoice.portalUploadedAt && (
                      <div className="flex justify-between"><span className="text-gray-400">Uploaded On:</span><span className="text-white font-mono">{new Date(selectedBilledInvoice.portalUploadedAt).toLocaleString('en-IN')}</span></div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-700/50 flex gap-2">
                    {selectedBilledInvoice.type === 'DAILY_LR' ? (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const res = await axios.get(`/api/shipments/${selectedBilledInvoice.invoiceId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              const ship = res.data.shipment;
                              setPrintData({
                                ...ship,
                                calculated: {
                                  baseFreightRate: ship.accounting?.baseRateApplied || 0,
                                  driverAdvanceCash: ship.accounting?.driverAdvanceCash || 0,
                                  fuelVoucherAmount: ship.accounting?.fuelVoucherAmount || 0,
                                  tollAllowance: ship.accounting?.tollAllowance || 0,
                                  rcmApplied: ship.accounting?.tax?.rcmApplied || false,
                                  gstAmount: ship.accounting?.tax?.gstAmount || 0,
                                  grandTotal: ship.accounting?.grandTotal || 0,
                                  
                                  processingCharge: ship.accounting?.processingCharge || 0,
                                  fuelSurcharge: ship.accounting?.fuelSurcharge || 0,
                                  rovCharge: ship.accounting?.rovCharge || 0,
                                  fodCharge: ship.accounting?.fodCharge || 0,
                                  handlingCharge: ship.accounting?.handlingCharge || 0,
                                  codDodCharge: ship.accounting?.codDodCharge || 0,
                                  specialDeliveryCharge: ship.accounting?.specialDeliveryCharge || 0,
                                  otherCharges: ship.accounting?.otherCharges || 0,
                                  paymentType: ship.accounting?.paymentType || 'CREDIT',
                                  modeOfPayment: ship.accounting?.modeOfPayment || 'NEFT_RTGS',
                                  chequeNeftNo: ship.accounting?.chequeNeftNo || '',
                                  bankName: ship.accounting?.bankName || ''
                                }
                              });
                            } catch (e) {
                              console.error('Failed to load invoice details for print:', e);
                              alert('Failed to load invoice details.');
                            }
                          }}
                          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[10px] transition duration-300 flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2v-4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print Copy
                        </button>
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            window.open(getApiUrl(`/api/invoices/${selectedBilledInvoice.invoiceId}/generate-pdf?token=${token}`), '_blank');
                          }}
                          className="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-[10px] transition duration-300 flex items-center justify-center gap-1.5"
                        >
                          PDF
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            const master = consolidatedInvoices.find(c => c.invoiceId === selectedBilledInvoice.invoiceId);
                            if (master) {
                              setPrintMasterInvoice(master);
                            } else {
                              alert('Master invoice details not cached. Please refresh.');
                            }
                          }}
                          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-[10px] transition duration-300 flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Master
                        </button>
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            const master = consolidatedInvoices.find(c => c.invoiceId === selectedBilledInvoice.invoiceId);
                            if (master) {
                              window.open(getApiUrl(`/api/invoices/consolidated/${master._id}/export?token=${token}`), '_blank');
                            } else {
                              alert('Master invoice details not cached.');
                            }
                          }}
                          className="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-[10px] transition duration-300 flex items-center justify-center gap-1.5"
                        >
                          Excel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="glass-panel p-3 sm:p-4 md:p-6">
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider text-pink-400 mb-4">Update Portal Entry</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Upload Status</label>
                      <select 
                        value={selectedBilledInvoice.portalStatus}
                        onChange={e => setSelectedBilledInvoice({ ...selectedBilledInvoice, portalStatus: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-semibold text-xs focus:border-pink-500 focus:outline-none"
                      >
                        <option value="NOT_UPLOADED">Pending Upload</option>
                        <option value="UPLOADED">Uploaded Successfully</option>
                        <option value="DISPUTED">Disputed by Client</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Portal Reference Number</label>
                      <input 
                        type="text"
                        placeholder={`e.g. ${selectedBilledInvoice.supplierName?.toUpperCase()?.replace(/\s+/g, '-') || 'PORTAL'}-TXN-90218`}
                        value={selectedBilledInvoice.portalRefId}
                        onChange={e => setSelectedBilledInvoice({ ...selectedBilledInvoice, portalRefId: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-pink-500 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleUpdatePortalStatus(selectedBilledInvoice.id, selectedBilledInvoice.portalStatus, selectedBilledInvoice.portalRefId)}
                      className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs transition duration-300 shadow-[0_0_15px_rgba(219,39,119,0.3)] hover:scale-[1.02]"
                    >
                      Save Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
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

      {/* Modal for Master Invoice Print Preview */}
      {printMasterInvoice && (
        <ConsolidatedInvoiceModal 
          invoice={printMasterInvoice} 
          onClose={() => setPrintMasterInvoice(null)} 
        />
      )}
    </div>
  );
};

export default BillingDashboard;
