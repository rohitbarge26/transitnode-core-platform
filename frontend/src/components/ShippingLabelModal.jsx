import React from 'react';
import Barcode from 'react-barcode';

const ShippingLabelModal = ({ shipment, onClose }) => {
  if (!shipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      {/* Modal Container */}
      <div className="bg-white text-black rounded-lg shadow-2xl w-full max-w-lg overflow-hidden relative">
        
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

        {/* The Label Area to be Printed */}
        <div id="printable-label" className="p-8 bg-white print:p-0 print:w-full print:h-full">
          {/* Label Border */}
          <div className="border-4 border-black p-6 rounded-md">
            
            {/* Tracking Header */}
            <div className="text-center border-b-4 border-black pb-4 mb-4">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-1">TransitNode Express</p>
              <h1 className="text-5xl font-black tracking-tight">{shipment.trackingNumber}</h1>
            </div>

            {/* Addresses */}
            <div className="flex justify-between border-b-2 border-black pb-4 mb-4">
              <div className="w-1/2 pr-4 border-r-2 border-black">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">From</p>
                <p className="font-bold text-gray-800">{shipment.logistics?.sender?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">{shipment.logistics?.sender?.phone || 'N/A'}</p>
              </div>
              <div className="w-1/2 pl-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">To</p>
                <p className="font-bold text-gray-800 text-lg">{shipment.logistics?.receiver?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">{shipment.logistics?.receiver?.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Details */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm"><span className="font-bold">Weight:</span> {shipment.logistics?.package?.weight_kg || 1} kg</p>
                <p className="text-sm"><span className="font-bold">Dims:</span> {shipment.logistics?.package?.dimensions || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase">Date Issued</p>
                <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Live Generated Barcode */}
            <div className="w-full flex items-center justify-center mt-2">
              <Barcode 
                value={shipment.trackingNumber} 
                height={65} 
                width={2} 
                fontSize={16} 
                margin={0} 
                displayValue={false} 
              />
            </div>

          </div>
        </div>

        {/* Footer Actions - Not printed */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-4 print:hidden">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => window.print()}
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
