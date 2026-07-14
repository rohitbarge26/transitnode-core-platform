import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import AccountantMasterInvoiceForm from './AccountantMasterInvoiceForm';

const ConsolidatedInvoiceModal = ({ invoice, onClose }) => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = localStorage.getItem('token');
        // We can just fetch the shipments or pass them from the parent. 
        // We'll hit the standard GET /api/shipments endpoint and filter, or we can just fetch the data.
        // Actually, since this is a summary, we can just print the master invoice stats.
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchShipments();
  }, [invoice]);

  if (!invoice) return null;

  const content = (
    <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto text-black font-sans bg-white print:m-0 print:p-0 print:w-full print:max-w-full print:min-h-0">
      <AccountantMasterInvoiceForm 
        masterInvoiceId={invoice.invoiceId}
        companyName={invoice.companyId?.companyName || invoice.companyName || invoice.billedFrom || undefined}
        companyAddress={invoice.companyId ? (invoice.companyId.address || "N/A") : undefined}
        companyGstin={invoice.companyId ? (invoice.companyId.gstin || "N/A") : undefined}
        companyPan={invoice.companyId ? (invoice.companyId.pan || "N/A") : undefined}
        templateType={invoice.companyId?.invoiceTemplateType || 'TAX_INVOICE'}
        supplierName={invoice.supplierName}
        receiverAddress={invoice.supplierAddress || "Address Not Available"}
        receiverGstin={invoice.supplierGstin || "N/A"}
        receiverPan={invoice.supplierPan || "N/A"}
        shipmentCount={invoice.shipmentIds.length}
        baseRate={invoice.financials.subtotal}
        rcmApplied={invoice.financials.taxAmount < (invoice.financials.subtotal * 0.18)}
        cgst={invoice.financials.taxAmount / 2}
        sgst={invoice.financials.taxAmount / 2}
        grandTotal={invoice.financials.grandTotal}
        isEditable={false}
        invoiceDate={new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
        invoicePeriod={new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      />
      <div className="text-center text-sm text-gray-500 mt-12 pt-4 sm:pt-6 md:pt-8 border-t border-gray-200 print:hidden">
        <p>This is a computer generated master invoice and does not require a signature.</p>
        <p className="mt-1">For detailed shipment breakdown, please refer to the attached Excel Export.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 print:static print:p-0 print:block print:bg-transparent">
      <div className="bg-gray-100 text-black rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col relative print:static print:overflow-visible print:max-h-none print:max-w-none print:shadow-none print:w-full print:bg-white print:border-none">
        
        <div className="px-3 sm:px-4 md:px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white print:hidden">
          <h2 className="text-xl font-bold text-gray-800">Print Master Invoice</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50 print:p-0 print:overflow-visible print:bg-white">
          <div className="bg-white shadow-md mx-auto max-w-full overflow-hidden print:hidden" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
            {content}
          </div>
        </div>

        {createPortal(
          <div id="printable-master-invoice" className="hidden print:block print:w-full print:m-0 print:p-0 print:relative">
            {content}
          </div>,
          document.body
        )}

        <div className="px-3 sm:px-4 md:px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-4 print:hidden shrink-0">
          <button onClick={onClose} className="px-3 sm:px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors">Cancel</button>
          <button 
            onClick={() => {
              const originalTitle = document.title;
              document.title = `TNE_MASTER_${invoice.invoiceId}_${invoice.supplierName}`;
              window.print();
              document.title = originalTitle;
            }}
            className="px-3 sm:px-4 md:px-6 py-2 bg-[#00a651] text-white rounded-md hover:bg-[#008f45] font-bold shadow-md hover:shadow-lg transition-all"
          >
            Print Master Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedInvoiceModal;
