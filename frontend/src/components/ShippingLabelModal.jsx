import React from 'react';
import { createPortal } from 'react-dom';
import InvoiceTemplate from './InvoiceTemplate';

const ShippingLabelModal = ({ shipment, onClose }) => {
  if (!shipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 print:static print:p-0 print:block print:bg-transparent">
      {/* Modal Container */}
      <div className="bg-white text-black rounded-lg shadow-2xl w-full max-w-lg overflow-hidden relative print:static print:overflow-visible print:max-w-none print:shadow-none print:w-full">
        
        {/* Header - Not printed */}
        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200 print:hidden">
          <h3 className="text-lg font-bold text-gray-800">Print Shipping Label</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* UI PREVIEW - Visible on screen, hidden during print */}
        <div className="bg-white w-full h-auto print:hidden">
          <InvoiceTemplate data={shipment} />
        </div>

        {/* PRINT PORTAL - Hidden on screen, portaled to document body for perfect print isolation */}
        {createPortal(
          <div id="printable-label" className="hidden print:block bg-white print:w-full print:h-auto printable-portal">
            <InvoiceTemplate data={shipment} />
          </div>,
          document.body
        )}

        {/* Footer Actions - Not printed */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-4 print:hidden">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              const originalTitle = document.title;
              const consigneeName = shipment.logistics?.receiver?.name ? shipment.logistics.receiver.name.replace(/\s+/g, '_') : 'Unknown';
              document.title = `TNE_${shipment.trackingNumber}_${consigneeName}_${Date.now()}`;
              window.print();
              document.title = originalTitle;
            }}
            className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 transition"
          >
            Print Label
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShippingLabelModal;
