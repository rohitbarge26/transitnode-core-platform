import React from 'react';
import Barcode from 'react-barcode';

const InvoiceTemplate = ({ data, orientation = 'landscape' }) => {
  if (!data) return null;

  const {
    trackingNumber,
    logistics
  } = data;

  const issueDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: ${orientation}; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>
      <div className="w-full bg-white text-black p-6 relative font-sans print:p-2 print:h-auto">
      
      {/* MANIFEST Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
        <div className="text-9xl font-black text-gray-800 tracking-widest transform -rotate-45">
          MANIFEST
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-gray-900 pb-4 mb-4 print:pb-2 print:mb-2">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900">TransitNode<span className="text-blue-600">ERP</span></h1>
            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Loading Slip / Transport Manifest</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black font-mono text-gray-900">{trackingNumber}</h2>
            <p className="text-sm text-gray-500 mt-1 font-mono">Issued: {issueDate}</p>
          </div>
        </div>

        {/* Barcode */}
        <div className="flex justify-center mb-6 print:mb-3">
          <Barcode 
            value={trackingNumber} 
            height={50} 
            width={2} 
            fontSize={14} 
            margin={0} 
            displayValue={false} 
          />
        </div>

        {/* Route Details */}
        <div className="flex justify-between mb-6 print:mb-3 bg-gray-50 p-4 border border-gray-300 rounded-lg">
          <div className="w-1/2 pr-4 border-r border-gray-300">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Origin Terminal</h3>
            <p className="font-black text-xl text-gray-800 uppercase">{logistics?.transport?.origin || 'N/A'}</p>
          </div>
          <div className="w-1/2 pl-4 text-right">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Destination City</h3>
            <p className="font-black text-xl text-gray-800 uppercase">{logistics?.transport?.destination || 'N/A'}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="flex justify-between mb-6 print:mb-3">
          <div className="w-1/2 pr-4">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Consignor (Sender)</h3>
            <p className="font-bold text-gray-800">{logistics?.sender?.name}</p>
            <p className="text-sm text-gray-600">Ph: {logistics?.sender?.phone}</p>
          </div>
          <div className="w-1/2 pl-4 border-l border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Consignee (Receiver)</h3>
            <p className="font-bold text-gray-800">{logistics?.receiver?.name}</p>
            <p className="text-sm text-gray-600">Ph: {logistics?.receiver?.phone}</p>
          </div>
        </div>

        {/* Transport & Vehicle Grid */}
        <div className="mb-6 print:mb-3 border-2 border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-800 flex text-xs font-bold text-white uppercase tracking-wider border-b-2 border-gray-800">
            <div className="w-1/2 py-2 px-4 border-r border-gray-700">Vehicle Details</div>
            <div className="w-1/2 py-2 px-4">Driver Assignment</div>
          </div>
          
          <div className="flex text-sm text-gray-800">
            <div className="w-1/2 p-4 border-r border-gray-300">
              <div className="mb-3">
                <span className="block text-xs text-gray-500 uppercase font-bold">Registration Plate</span>
                <span className="font-mono font-black text-lg">{logistics?.transport?.vehicleNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase font-bold">Vehicle Type</span>
                <span className="font-bold">{logistics?.transport?.vehicleType || 'N/A'}</span>
              </div>
            </div>
            
            <div className="w-1/2 p-4">
              <div className="mb-3">
                <span className="block text-xs text-gray-500 uppercase font-bold">Driver Name</span>
                <span className="font-bold text-lg">{logistics?.transport?.driverName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase font-bold">Contact Number</span>
                <span className="font-mono">{logistics?.transport?.driverPhone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Description Block */}
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mb-6 print:mb-3">
          <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2 border-b border-gray-200 pb-2 print:mb-1 print:pb-1">Cargo / Commodity Declaration</h3>
          <p className="font-mono text-sm text-gray-800 whitespace-pre-wrap">{logistics?.transport?.commodityType || 'GENERAL CARGO'}</p>
        </div>

        {/* Commercial Financials (Rendered only if calculated data exists) */}
        {data.calculated && (
          <div className="mb-6 print:mb-3 border-2 border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-800 flex justify-between text-xs font-bold text-white uppercase tracking-wider py-2 px-4">
              <span>Freight Financial Statement</span>
              {data.calculated.rcmApplied && <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px]">RCM APPLIED (TAX PAYABLE BY CONSIGNEE)</span>}
            </div>
            
            <div className="p-4 bg-white">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                <span className="text-sm font-bold text-gray-700">Base Freight Cost</span>
                <span className="font-mono text-gray-900 font-bold">₹{data.calculated.baseFreightRate?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              
              <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
                <span>Driver Advance Cash</span>
                <span className="font-mono text-red-600">- ₹{data.calculated.driverAdvanceCash?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
                <span>Fuel Voucher Allocation</span>
                <span className="font-mono text-red-600">- ₹{data.calculated.fuelVoucherAmount?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 text-sm text-gray-600">
                <span>Toll Allowance</span>
                <span className="font-mono text-red-600">- ₹{data.calculated.tollAllowance?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              
              <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
                <span>CGST ({data.calculated.rcmApplied ? '2.5%' : '9%'})</span>
                <span className="font-mono">₹{data.calculated.cgst?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-gray-800 text-sm text-gray-600">
                <span>SGST ({data.calculated.rcmApplied ? '2.5%' : '9%'})</span>
                <span className="font-mono">₹{data.calculated.sgst?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Final Corporate</span>
                  <span className="block text-sm font-black text-gray-900 uppercase">Balance Due</span>
                </div>
                <span className="text-2xl font-black font-mono text-gray-900">₹{data.calculated.grandTotal?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-10 print:mt-6 flex justify-between px-8">
          <div className="text-center">
            <div className="w-48 border-b border-gray-400 mb-2 print:mb-1"></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Driver Signature</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-gray-400 mb-2 print:mb-1"></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Authorized Signatory</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 print:mt-4 pt-4 print:pt-2 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Official Loading Slip for TransitNode Freight Transport.</p>
          <p>TransitNode Logistics • www.transitnode.com • +91 800 123 4567</p>
        </div>
      </div>
      </div>
    </>
  );
};

export default InvoiceTemplate;
