import React from 'react';

const InvoiceTemplate = ({ data }) => {
  if (!data) return null;

  const {
    trackingNumber,
    logistics,
    calculated
  } = data;

  const invoiceDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="w-full h-full bg-white text-black p-8 relative font-sans">
      
      {/* PAID Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0">
        <div className="text-9xl font-black text-green-600 tracking-widest transform -rotate-45">
          PAID
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900">TransitNode<span className="text-blue-600">ERP</span></h1>
            <p className="text-sm font-bold text-gray-500 mt-1">COMMERCIAL TAX INVOICE</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold font-mono text-gray-800">{trackingNumber}</h2>
            <p className="text-sm text-gray-500 mt-1">Date: {invoiceDate}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex justify-between mb-8">
          <div className="w-1/2 pr-4">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Billed To (Sender)</h3>
            <p className="font-bold text-gray-800">{logistics?.sender?.name}</p>
            <p className="text-sm text-gray-600">Ph: {logistics?.sender?.phone}</p>
          </div>
          <div className="w-1/2 pl-4 border-l border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Consignee (Receiver)</h3>
            <p className="font-bold text-gray-800">{logistics?.receiver?.name}</p>
            <p className="text-sm text-gray-600">Ph: {logistics?.receiver?.phone}</p>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="mb-8 border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 flex text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-300">
            <div className="w-1/3 py-2 px-4">Metric</div>
            <div className="w-1/3 py-2 px-4 text-center">Details</div>
            <div className="w-1/3 py-2 px-4 text-right">Value</div>
          </div>
          <div className="flex text-sm text-gray-800 border-b border-gray-200">
            <div className="w-1/3 py-3 px-4 font-semibold">Actual Weight</div>
            <div className="w-1/3 py-3 px-4 text-center">-</div>
            <div className="w-1/3 py-3 px-4 text-right font-mono">{calculated?.actualWeight?.toFixed(2)} kg</div>
          </div>
          <div className="flex text-sm text-gray-800 border-b border-gray-200 bg-gray-50">
            <div className="w-1/3 py-3 px-4 font-semibold">Volumetric Weight</div>
            <div className="w-1/3 py-3 px-4 text-center text-gray-500 text-xs">Dims: {logistics?.package?.dimensions}</div>
            <div className="w-1/3 py-3 px-4 text-right font-mono">{calculated?.volumetricWeight?.toFixed(2)} kg</div>
          </div>
          <div className="flex text-sm text-gray-900 border-b border-gray-300 bg-blue-50/50">
            <div className="w-1/3 py-3 px-4 font-bold text-blue-800">Billable Weight</div>
            <div className="w-1/3 py-3 px-4 text-center text-blue-600/70 text-xs">(Max of Actual vs Volumetric)</div>
            <div className="w-1/3 py-3 px-4 text-right font-mono font-bold text-blue-800">{calculated?.billableWeight?.toFixed(2)} kg</div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="flex justify-end">
          <div className="w-1/2 border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">Base Freight (₹{calculated?.baseRate}/kg)</span>
              <span className="font-mono">₹{calculated?.baseSubtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">Fuel Surcharge</span>
              <span className="font-mono">₹{calculated?.fuelSurcharge?.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 my-2 pt-2 flex justify-between mb-2 text-sm">
              <span className="text-gray-600">CGST (9%)</span>
              <span className="font-mono">₹{calculated?.cgst?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm">
              <span className="text-gray-600">SGST (9%)</span>
              <span className="font-mono">₹{calculated?.sgst?.toFixed(2)}</span>
            </div>
            
            <div className="border-t-2 border-gray-800 pt-3 flex justify-between items-end">
              <span className="font-black text-gray-900">GRAND TOTAL</span>
              <span className="text-2xl font-black font-mono text-gray-900">₹{calculated?.grandTotal?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>This is a computer-generated commercial invoice. Payment received with thanks.</p>
          <p>TransitNode Logistics • www.transitnode.com • +91 800 123 4567</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
