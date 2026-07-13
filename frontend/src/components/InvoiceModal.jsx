import React from 'react';
import { createPortal } from 'react-dom';
import AccountantInvoiceForm from './AccountantInvoiceForm';

const InvoiceModal = ({ invoice, orientation = 'landscape', onClose }) => {
  if (!invoice) return null;

  const baseRate = invoice.calculated?.baseFreightRate || invoice.accounting?.baseRateApplied || invoice.accounting?.subtotal || 0;
  const rcmApplied = invoice.calculated?.rcmApplied || invoice.accounting?.tax?.rcmApplied || false;
  const cgst = invoice.calculated?.cgst || ((invoice.accounting?.tax?.gstAmount || 0) / 2);
  const sgst = invoice.calculated?.sgst || ((invoice.accounting?.tax?.gstAmount || 0) / 2);
  const gstAmount = invoice.calculated?.gstAmount || invoice.accounting?.tax?.gstAmount || 0;
  const grandTotal = invoice.calculated?.grandTotal || invoice.accounting?.grandTotal || 0;

  const processingCharge = invoice.calculated?.processingCharge || invoice.accounting?.processingCharge || 0;
  const fuelSurcharge = invoice.calculated?.fuelSurcharge || invoice.accounting?.fuelSurcharge || 0;
  const rovCharge = invoice.calculated?.rovCharge || invoice.accounting?.rovCharge || 0;
  const fodCharge = invoice.calculated?.fodCharge || invoice.accounting?.fodCharge || 0;
  const handlingCharge = invoice.calculated?.handlingCharge || invoice.accounting?.handlingCharge || 0;
  const codDodCharge = invoice.calculated?.codDodCharge || invoice.accounting?.codDodCharge || 0;
  const specialDeliveryCharge = invoice.calculated?.specialDeliveryCharge || invoice.accounting?.specialDeliveryCharge || 0;
  const otherCharges = invoice.calculated?.otherCharges || invoice.accounting?.otherCharges || 0;

  const paymentType = invoice.calculated?.paymentType || invoice.accounting?.paymentType || 'CREDIT';
  const modeOfPayment = invoice.calculated?.modeOfPayment || invoice.accounting?.modeOfPayment || 'NEFT_RTGS';
  const chequeNeftNo = invoice.calculated?.chequeNeftNo || invoice.accounting?.chequeNeftNo || '';
  const bankName = invoice.calculated?.bankName || invoice.accounting?.bankName || '';

  const subTotal = baseRate + Number(processingCharge) + Number(fuelSurcharge) + Number(rovCharge) + Number(fodCharge) + Number(handlingCharge) + Number(codDodCharge) + Number(specialDeliveryCharge) + Number(otherCharges);

  const formProps = {
    invoice,
    baseFreightRate: baseRate,
    setBaseFreightRate: () => {},
    processingCharge,
    setProcessingCharge: () => {},
    fuelSurcharge,
    setFuelSurcharge: () => {},
    rovCharge,
    setRovCharge: () => {},
    fodCharge,
    setFodCharge: () => {},
    handlingCharge,
    setHandlingCharge: () => {},
    codDodCharge,
    setCodDodCharge: () => {},
    specialDeliveryCharge,
    setSpecialDeliveryCharge: () => {},
    otherCharges,
    setOtherCharges: () => {},
    paymentType,
    setPaymentType: () => {},
    modeOfPayment,
    setModeOfPayment: () => {},
    chequeNeftNo,
    setChequeNeftNo: () => {},
    bankName,
    setBankName: () => {},
    subTotal,
    gstAmount,
    cgst,
    sgst,
    grandTotal,
    rcmApplied,
    setRcmApplied: () => {},
    companyName: invoice.companyId?.companyName || undefined,
    companyAddress: invoice.companyId ? (invoice.companyId.address || "N/A") : undefined,
    companyGstin: invoice.companyId ? (invoice.companyId.gstin || "N/A") : undefined,
    companyPan: invoice.companyId ? (invoice.companyId.pan || "N/A") : undefined,
    receiverAddress: invoice.supplierDetails?.address || invoice.logistics?.receiver?.address || undefined,
    receiverGstin: invoice.supplierDetails?.gstin || undefined,
    receiverPan: invoice.supplierDetails?.pan || undefined,
    templateType: invoice.companyId?.invoiceTemplateType || 'TAX_INVOICE',
    isEditable: false
  };

  const content = (
    <div className="w-full mx-auto text-black font-sans bg-white print:m-0 print:p-0 print:w-full print:max-w-full print:min-h-0">
      <AccountantInvoiceForm {...formProps} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 print:static print:p-0 print:block print:bg-transparent">
      {/* Modal Container */}
      <div className="bg-gray-100 text-black rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col relative print:static print:overflow-visible print:max-w-none print:shadow-none print:w-full print:bg-white">
        
        {/* Header - Not printed */}
        <div className="px-3 sm:px-4 md:px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white print:hidden">
          <h2 className="text-xl font-bold text-gray-800">Print Invoice</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50 print:p-0 print:overflow-visible print:bg-white">
          {/* UI PREVIEW - Visible on screen, hidden during print */}
          <div className="bg-white shadow-md mx-auto max-w-full overflow-hidden print:hidden" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
            {content}
          </div>
        </div>

        {/* PRINT PORTAL - Hidden on screen, portaled to document body for perfect print isolation */}
        {createPortal(
          <div id="printable-label" className="hidden print:block print:w-full print:m-0 print:p-0 print:relative">
            {content}
          </div>,
          document.body
        )}

        {/* Footer Actions - Not printed */}
        <div className="px-3 sm:px-4 md:px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-4 print:hidden shrink-0">
          <button 
            onClick={onClose}
            className="px-3 sm:px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              const originalTitle = document.title;
              const trackingStr = invoice.trackingNumber || 'Invoice';
              document.title = `TNE_${trackingStr}_${Date.now()}`;
              window.print();
              document.title = originalTitle;
            }}
            className="px-3 sm:px-4 md:px-6 py-2 bg-[#00a651] text-white rounded-md hover:bg-[#008f45] font-bold shadow-md hover:shadow-lg transition-all"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
