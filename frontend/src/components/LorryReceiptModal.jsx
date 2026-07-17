import React from 'react';
import { createPortal } from 'react-dom';
import Barcode from 'react-barcode';

const LorryReceiptModal = ({ shipment, onClose, workspaces = [] }) => {
  if (!shipment) return null;

  const {
    trackingNumber,
    logistics,
    accounting,
    metadata
  } = shipment;

  const bookingDate = new Date(metadata?.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  
  const bookingTime = new Date(metadata?.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const SarthakLRTemplate = () => {
    const hasFinanceData = accounting?.paymentStatus === 'PAID' || accounting?.billingCycle === 'MONTHLY';

    // Extract base calculations from database record
    const baseFreight = hasFinanceData ? (accounting?.baseRateApplied || 0) : "";
    const processingCharge = hasFinanceData ? (accounting?.processingCharge !== undefined ? accounting.processingCharge : 150) : "";
    const fuelSurcharge = hasFinanceData ? (accounting?.fuelSurcharge !== undefined ? accounting.fuelSurcharge : 0) : "";
    const rovCharge = hasFinanceData ? (accounting?.rovCharge !== undefined ? accounting.rovCharge : 0) : "";
    const fodCharge = hasFinanceData ? (accounting?.fodCharge !== undefined ? accounting.fodCharge : 0) : "";
    const handlingCharge = hasFinanceData ? (accounting?.handlingCharge !== undefined ? accounting.handlingCharge : 200) : "";
    const codDodCharge = hasFinanceData ? (accounting?.codDodCharge !== undefined ? accounting.codDodCharge : 0) : "";
    const specialDeliveryCharge = hasFinanceData ? (accounting?.specialDeliveryCharge !== undefined ? accounting.specialDeliveryCharge : 0) : "";
    const otherCharges = hasFinanceData ? (accounting?.otherCharges !== undefined ? accounting.otherCharges : 0) : "";
    
    const subTotal = hasFinanceData ? (baseFreight + processingCharge + fuelSurcharge + rovCharge + fodCharge + handlingCharge + codDodCharge + specialDeliveryCharge + otherCharges) : "";
    
    // Check if GST is calculated in database, otherwise default to 12%
    const gstAmount = hasFinanceData ? (accounting?.tax?.gstAmount !== undefined ? accounting.tax.gstAmount : Math.round(subTotal * 0.12)) : "";
    const grandTotal = hasFinanceData ? (accounting?.grandTotal !== undefined ? accounting.grandTotal : (subTotal + gstAmount)) : "";
    
    const paymentType = hasFinanceData ? (accounting?.paymentType || 'CREDIT') : "";
    const modeOfPayment = hasFinanceData ? (accounting?.modeOfPayment || 'NEFT_RTGS') : "";
    const bankName = hasFinanceData ? (accounting?.bankName || 'HDFC Bank Ltd') : "";

    // Split tracking ID to get a short numeric serial number for the stamp
    const shortSerialNumber = trackingNumber.split('-').pop() || '4113';
    const chequeNeftNo = hasFinanceData ? (accounting?.chequeNeftNo || `TXN-${shortSerialNumber}`) : "";

    const senderName = logistics?.sender?.company || logistics?.sender?.name || 'Sarthak Enterprises';
    const initials = senderName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const nameParts = senderName.split(' ');
    const firstName = nameParts[0] || 'SARTHAK';
    const lastName = nameParts.slice(1).join(' ') || 'ENTERPRISES';

    const companyObj = workspaces?.find(w => w.companyName === logistics?.sender?.company);
    const finalCompanyAddress = logistics?.sender?.companyAddress || companyObj?.address || logistics?.sender?.address || 'V1032, Krushi Wholesale Mart, Opp. Akshar Complex, Sector 19, Vashi, Navi Mumbai - 400703.';

    return (
      <div className="w-full bg-white text-black p-4 font-sans text-[11px] leading-tight border border-gray-400 print:border-none print:p-0">
        
        {/* Main Grid Container */}
        <div className="border-[1.5px] border-black grid grid-cols-1 md:grid-cols-12">
          
          {/* HEADER SECTION */}
          {/* Brand Logo & Name */}
          <div className="col-span-4 border-b border-r border-black p-2 flex items-center gap-2">
            <div className="bg-black text-white p-1 rounded font-black text-xs tracking-tighter">
              {initials}
            </div>
            <div>
              <div className="text-sm font-black tracking-tight leading-none uppercase text-black">{firstName}</div>
              <p className="text-[10px] font-bold tracking-widest text-gray-700 uppercase leading-none mt-0.5">{lastName}</p>
            </div>
          </div>
          
          {/* Address & Contacts */}
          <div className="col-span-4 border-b border-r border-black p-2 text-[9px] leading-tight">
            <p className="font-bold">{finalCompanyAddress}</p>
            <p>Mob.: +91 {logistics?.sender?.phone || '9867416154'}</p>
            {senderName.toLowerCase().includes('sarthak') ? (
              <p>Email: suhas.bhoite123@gmail.com</p>
            ) : (
              <p>Email: contact@{senderName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</p>
            )}
          </div>
          
          {/* Booking Info */}
          <div className="col-span-2 border-b border-r border-black grid grid-rows-2">
            <div className="p-1 border-b border-black font-bold text-[9px] uppercase bg-gray-50">Booking Date & Time</div>
            <div className="p-1 grid grid-cols-1 sm:grid-cols-2 text-[10px]">
              <div>DATE: <span className="font-bold font-mono">{bookingDate}</span></div>
              <div className="border-l border-black pl-1">TIME: <span className="font-bold font-mono">{bookingTime}</span></div>
            </div>
          </div>

          {/* Mode of Transport */}
          <div className="col-span-1 border-b border-r border-black p-1 text-[9px]">
            <p className="font-bold uppercase mb-1">Mode of Transport</p>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 cursor-default">
                <input type="checkbox" checked={true} readOnly className="w-2.5 h-2.5 accent-black" />
                <span>SURFACE</span>
              </label>
              <label className="flex items-center gap-1 cursor-default">
                <input type="checkbox" checked={false} readOnly className="w-2.5 h-2.5 accent-black" />
                <span>AIR</span>
              </label>
            </div>
          </div>

          {/* Lorry Receipt Number Stamp */}
          <div className="col-span-1 border-b border-black p-2 flex flex-col items-center justify-center relative bg-red-50/50">
            <span className="text-[8px] font-bold text-gray-500 uppercase text-center block leading-none">Lorry Receipt No.</span>
            <span className="text-base font-extrabold text-red-600 font-mono tracking-tighter mt-1 border-2 border-dashed border-red-500 px-1 py-0.5 rounded rotate-3">
              {shortSerialNumber}
            </span>
          </div>

          {/* SHIPPER & RECIPIENT DETAILS */}
          {/* Shipper Details (Consignor) */}
          <div className="col-span-6 border-b border-r border-black grid grid-cols-1 md:grid-cols-12">
            <div className="col-span-12 bg-gray-100 p-1 font-bold border-b border-black uppercase text-[9px]">
              SHIPPER'S DETAILS (Consignor)
            </div>
            
            <div className="col-span-8 p-1 border-b border-r border-black">
              <span className="text-[8px] block text-gray-500 uppercase">Name</span>
              <span className="font-bold uppercase text-[10px]">{logistics?.sender?.name || 'N/A'}</span>
            </div>
            <div className="col-span-4 p-1 border-b border-black">
              <span className="text-[8px] block text-gray-500 uppercase">From City</span>
              <span className="font-bold uppercase text-[10px]">{logistics?.transport?.origin || 'N/A'}</span>
            </div>

            <div className="col-span-8 p-1 border-b border-r border-black">
              <span className="text-[8px] block text-gray-500 uppercase">Phone No</span>
              <span className="font-bold font-mono">{logistics?.sender?.phone || 'N/A'}</span>
            </div>
            <div className="col-span-4 p-1 border-b border-black">
              <span className="text-[8px] block text-gray-500 uppercase">Postal Code</span>
              <span className="font-bold font-mono">
                {(() => {
                  const savedCode = logistics?.sender?.postalCode;
                  const address = logistics?.sender?.address;
                  if (savedCode && savedCode !== '400703') return savedCode;
                  if (address) {
                    const match = address.match(/\b\d{6}\b/);
                    if (match) return match[0];
                  }
                  return savedCode || 'N/A';
                })()}
              </span>
            </div>

            <div className="col-span-12 p-1 border-b border-black min-h-[30px]">
              <span className="text-[8px] block text-gray-500 uppercase">Address</span>
              <span className="text-[9px]">{logistics?.sender?.address || 'N/A'}</span>
            </div>

            <div className="col-span-8 p-1 border-r border-black">
              <span className="text-[8px] block text-gray-500 uppercase">GST No.</span>
              <span className="font-mono text-[9px]">{logistics?.sender?.gstin || 'N/A'}</span>
            </div>
            <div className="col-span-4 p-1 flex items-center justify-center">
              <label className="flex items-center gap-1 cursor-default">
                <input type="checkbox" checked={logistics?.sender?.dropOff || false} readOnly className="w-2.5 h-2.5 accent-black" />
                <span className="text-[9px] font-bold">Drop-off</span>
              </label>
            </div>
          </div>

          {/* Recipient Details (Consignee) */}
          <div className="col-span-6 border-b border-black grid grid-cols-1 md:grid-cols-12">
            <div className="col-span-12 bg-gray-100 p-1 font-bold border-b border-black uppercase text-[9px]">
              RECIPIENT'S DETAILS (Consignee)
            </div>
            
            <div className="col-span-8 p-1 border-b border-r border-black">
              <span className="text-[8px] block text-gray-500 uppercase">Name</span>
              <span className="font-bold uppercase text-[10px]">{logistics?.receiver?.name || 'N/A'}</span>
            </div>
            <div className="col-span-4 p-1 border-b border-black">
              <span className="text-[8px] block text-gray-500 uppercase">To City</span>
              <span className="font-bold uppercase text-[10px]">{logistics?.transport?.destination || 'N/A'}</span>
            </div>

            <div className="col-span-8 p-1 border-b border-r border-black">
              <span className="text-[8px] block text-gray-500 uppercase">Phone Number</span>
              <span className="font-bold font-mono">{logistics?.receiver?.phone || 'N/A'}</span>
            </div>
            <div className="col-span-4 p-1 border-b border-black">
              <span className="text-[8px] block text-gray-500 uppercase">Postal Code</span>
              <span className="font-bold font-mono">
                {(() => {
                  const savedCode = logistics?.receiver?.postalCode;
                  const address = logistics?.receiver?.address;
                  if (savedCode && savedCode !== '380001') return savedCode;
                  if (address) {
                    const match = address.match(/\b\d{6}\b/);
                    if (match) return match[0];
                  }
                  return savedCode || 'N/A';
                })()}
              </span>
            </div>

            <div className="col-span-12 p-1 border-b border-black min-h-[30px]">
              <span className="text-[8px] block text-gray-500 uppercase">Address</span>
              <span className="text-[9px]">{logistics?.receiver?.address || 'N/A'}</span>
            </div>

            <div className="col-span-8 p-1 border-r border-black">
              <span className="text-[8px] block text-gray-500 uppercase">GST No.</span>
              <span className="font-mono text-[9px]">{logistics?.receiver?.gstin || 'N/A'}</span>
            </div>
            <div className="col-span-4 p-1 flex items-center justify-center">
              <label className="flex items-center gap-1 cursor-default">
                <input type="checkbox" checked={logistics?.receiver?.selfCollect || false} readOnly className="w-2.5 h-2.5 accent-black" />
                <span className="text-[9px] font-bold">Self Collect</span>
              </label>
            </div>
          </div>

          {/* CARGO & PHYSICAL SPECIFICATIONS */}
          {/* Weight details */}
          <div className="col-span-4 border-b border-r border-black grid grid-cols-1 sm:grid-cols-2">
            <div className="p-1 border-r border-black">
              <span className="text-[8px] block text-gray-500 uppercase">Actual Wt. (kg)</span>
              <span className="font-bold text-xs font-mono">{logistics?.package?.actualWeight || logistics?.package?.weight_kg || 'N/A'}</span>
            </div>
            <div className="p-1">
              <span className="text-[8px] block text-gray-500 uppercase">Charged Wt. (kg)</span>
              <span className="font-bold text-xs font-mono">{logistics?.package?.chargedWeight || logistics?.package?.weight_kg || 'N/A'}</span>
            </div>
          </div>

          {/* Payment Type */}
          <div className="col-span-4 border-b border-r border-black p-1 pb-2">
            <span className="text-[8px] block text-gray-500 uppercase mb-1 font-bold">Payment Type</span>
            <div className="flex gap-4 items-center mt-0.5">
              <label className="flex items-center gap-1 cursor-default">
                <input type="checkbox" checked={paymentType === 'CREDIT'} readOnly className="w-2.5 h-2.5 accent-black" />
                <span className="font-bold text-[9px]">CREDIT</span>
              </label>
              <label className="flex items-center gap-1 cursor-default">
                <input type="checkbox" checked={paymentType === 'PAID'} readOnly className="w-2.5 h-2.5 accent-black" />
                <span className="font-bold text-[9px]">PAID</span>
              </label>
              <label className="flex items-center gap-1 cursor-default">
                <input type="checkbox" checked={paymentType === 'FOD'} readOnly className="w-2.5 h-2.5 accent-black" />
                <span className="font-bold text-[9px]">FOD</span>
              </label>
            </div>
          </div>

          {/* Client Reference Code */}
          <div className="col-span-4 border-b border-black p-1 text-[9px]">
            <span className="text-[8px] block text-gray-500 uppercase">Client / Store / Address Code</span>
            <span className="font-mono font-bold uppercase">{logistics?.receiver?.clientCode || trackingNumber}</span>
          </div>

          {/* MAIN LOWER BODY: PACKAGE INFO & CHARGES DETAILS */}
          {/* Package Info Table */}
          <div className="col-span-8 border-r border-black grid grid-cols-1 md:grid-cols-12">
            <div className="col-span-12 bg-gray-100 p-1 font-bold border-b border-black uppercase text-[9px]">
              Package Information
            </div>
            
            {/* Headers */}
            <div className="col-span-1 border-b border-r border-black p-0.5 font-bold text-[8px] text-center uppercase bg-gray-50">Inv. No</div>
            <div className="col-span-2 border-b border-r border-black p-0.5 font-bold text-[8px] text-center uppercase bg-gray-50">Inv. Date</div>
            <div className="col-span-2 border-b border-r border-black p-0.5 font-bold text-[8px] text-center uppercase bg-gray-50">Inv. Value</div>
            <div className="col-span-4 border-b border-r border-black p-0.5 font-bold text-[8px] text-center uppercase bg-gray-50">E-way bill</div>
            <div className="col-span-1 border-b border-r border-black p-0.5 font-bold text-[8px] text-center uppercase bg-gray-50">Fragile</div>
            <div className="col-span-2 border-b border-black p-0.5 font-bold text-[8px] text-center uppercase bg-gray-50">Risk</div>

            {/* Row Content */}
            <div className="col-span-1 border-b border-r border-black p-1 font-mono text-center truncate">{logistics?.package?.invoiceNo || 'N/A'}</div>
            <div className="col-span-2 border-b border-r border-black p-1 font-mono text-center truncate">
              {logistics?.package?.invoiceDate ? new Date(logistics.package.invoiceDate).toLocaleDateString('en-IN') : 'N/A'}
            </div>
            <div className="col-span-2 border-b border-r border-black p-1 font-mono text-right truncate">
              ₹{logistics?.package?.invoiceValue ? logistics.package.invoiceValue.toLocaleString('en-IN') : '0'}
            </div>
            <div className="col-span-4 border-b border-r border-black p-1 font-mono text-center truncate">{logistics?.package?.ewayBillNo || 'N/A'}</div>
            <div className="col-span-1 border-b border-r border-black p-1 flex justify-center">
              <input type="checkbox" checked={logistics?.package?.fragile || false} readOnly className="w-2 h-2 accent-black" />
            </div>
            <div className="col-span-2 border-b border-black p-1 text-[8px] flex flex-col justify-center">
              <label className="flex items-center gap-0.5"><input type="checkbox" checked={logistics?.package?.riskCoverage !== 'CARRIERS'} readOnly className="w-2 h-2" /><span>Owner's</span></label>
              <label className="flex items-center gap-0.5"><input type="checkbox" checked={logistics?.package?.riskCoverage === 'CARRIERS'} readOnly className="w-2 h-2" /><span>Carrier</span></label>
            </div>

            {/* Cargo Declaration / Said to Contain */}
            <div className="col-span-12 p-2 border-b border-black min-h-[45px] bg-gray-50/30">
              <span className="text-[8px] block text-gray-500 uppercase font-bold">Said to Contain (Cargo Description)</span>
              <p className="font-mono text-[10px] text-gray-800 font-bold whitespace-pre-wrap">{logistics?.transport?.commodityType || 'GENERAL COMMODITY'}</p>
            </div>

            {/* Terms and Signatures grid */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-12">
              
              {/* Retail Terms & Conditions */}
              <div className="col-span-4 p-2 border-r border-b border-black text-[7px] leading-tight">
                <h4 className="font-bold uppercase text-[8px] mb-1">Terms & Conditions</h4>
                <p>We verify the contents of this consignment note and agree to terms set out. Consignor declares waybill contents are true and correct.</p>
              </div>

              {/* COD Panel */}
              <div className="col-span-4 p-2 border-r border-b border-black grid grid-rows-2 text-[8px]">
                <div className="flex gap-2">
                  <label className="flex items-center gap-0.5"><input type="checkbox" checked={false} readOnly className="w-2 h-2" /><span>Cash</span></label>
                  <label className="flex items-center gap-0.5"><input type="checkbox" checked={false} readOnly className="w-2 h-2" /><span>Cheque</span></label>
                </div>
                <div className="border-t border-gray-200 pt-1">
                  <span>COD Amt: </span>
                  <span className="font-mono font-bold">₹0.00</span>
                </div>
              </div>

              {/* Vehicle No Box */}
              <div className="col-span-4 p-2 border-b border-black flex flex-col justify-center items-center bg-gray-50">
                <span className="text-[8px] font-bold text-gray-500 uppercase">Vehicle No.</span>
                <span className="font-mono font-black text-sm tracking-widest text-black border-2 border-black px-2 py-0.5 bg-white rounded mt-1 shadow-sm">
                  {logistics?.transport?.vehicleNumber || 'N/A'}
                </span>
              </div>

              {/* Signature Blocks */}
              <div className="col-span-4 p-2 border-r border-black min-h-[50px] flex flex-col justify-between">
                <span className="text-[7px] text-gray-500 uppercase block">Consumer Signature</span>
                <div className="w-full border-t border-dotted border-gray-400"></div>
              </div>

              <div className="col-span-4 p-2 border-r border-black min-h-[50px] flex flex-col justify-between">
                <span className="text-[7px] text-gray-500 uppercase block">Pick-up Agent Signature</span>
                <div>
                  <p className="text-[8px] font-bold">{logistics?.transport?.driverName || 'N/A'}</p>
                  <div className="w-full border-t border-dotted border-gray-400 mt-1"></div>
                </div>
              </div>

              {/* Large Stamp/Consignee Box */}
              <div className="col-span-4 border-black p-2 min-h-[60px] flex flex-col justify-between relative bg-yellow-50/20">
                <span className="text-[7px] text-gray-400 uppercase block">Consignee Stamp & Signature</span>
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="text-[12px] font-bold border-2 border-dashed border-indigo-600 text-indigo-600 p-1 rotate-12 uppercase">Consignee Seal</div>
                </div>
                <div className="w-full border-t border-dotted border-gray-400"></div>
              </div>

            </div>

          </div>

          {/* Right Charges Sidebar Column */}
          <div className="col-span-4 grid grid-cols-1 text-[9px]">
            <div className="bg-gray-900 text-white p-1 font-bold text-center uppercase tracking-wider text-[8px] border-b border-black">
              Charges (Retail Pick-ups)
            </div>

            <div className="border-b border-black p-1 flex justify-between">
              <span>Base Freight:</span>
              <span className="font-mono font-bold">{baseFreight !== "" ? `₹${baseFreight.toLocaleString('en-IN')}` : ""}</span>
            </div>
            
            <div className="border-b border-black p-1 flex justify-between">
              <span>Processing Charge:</span>
              <span className="font-mono">{processingCharge !== "" ? `₹${processingCharge}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between">
              <span>Fuel Surcharge:</span>
              <span className="font-mono">{fuelSurcharge !== "" ? `₹${fuelSurcharge}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between">
              <span>ROV Charge:</span>
              <span className="font-mono">{rovCharge !== "" ? `₹${rovCharge}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between">
              <span>FOD Charge:</span>
              <span className="font-mono">{fodCharge !== "" ? `₹${fodCharge}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between">
              <span>Handling Charge:</span>
              <span className="font-mono">{handlingCharge !== "" ? `₹${handlingCharge}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between">
              <span>COD/DOD Charge:</span>
              <span className="font-mono">{codDodCharge !== "" ? `₹${codDodCharge}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between">
              <span>Special Delivery:</span>
              <span className="font-mono">{specialDeliveryCharge !== "" ? `₹${specialDeliveryCharge}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between">
              <span>Other Charges:</span>
              <span className="font-mono">{otherCharges !== "" ? `₹${otherCharges}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between bg-gray-50 font-bold">
              <span>Sub-total:</span>
              <span className="font-mono">{subTotal !== "" ? `₹${subTotal.toLocaleString('en-IN')}` : ""}</span>
            </div>

            <div className="border-b border-black p-1 flex justify-between text-gray-700 bg-gray-50 font-semibold">
              <span>GST of 12%:</span>
              <span className="font-mono">{gstAmount !== "" ? `₹${gstAmount.toLocaleString('en-IN')}` : ""}</span>
            </div>

            <div className="p-1 flex justify-between bg-indigo-50 font-black text-xs text-indigo-900">
              <span>Grand Total:</span>
              <span className="font-mono">{grandTotal !== "" ? `₹${grandTotal.toLocaleString('en-IN')}` : ""}</span>
            </div>
            
            {/* Mode of Payment & Details inside Charges Column block */}
            <div className="border-t border-black p-1 bg-gray-100 text-[8px]">
              <span className="font-bold uppercase block mb-1">Mode of Payment</span>
              <div className="flex gap-2 mb-1">
                <label className="flex items-center gap-0.5"><input type="checkbox" checked={modeOfPayment === 'CASH'} readOnly className="w-1.5 h-1.5" /><span>Cash</span></label>
                <label className="flex items-center gap-0.5"><input type="checkbox" checked={modeOfPayment === 'CHEQUE_DD'} readOnly className="w-1.5 h-1.5" /><span>Cheque</span></label>
                <label className="flex items-center gap-0.5"><input type="checkbox" checked={modeOfPayment === 'NEFT_RTGS'} readOnly className="w-1.5 h-1.5" /><span>NEFT/RTGS</span></label>
              </div>
              <div className="text-[7px] leading-tight text-gray-600 border-t border-gray-300 pt-1 space-y-0.5">
                <p>Bank: <span className="font-bold text-black">{bankName}</span></p>
                <p>NEFT/Chq No: <span className="font-mono text-black font-semibold">{chequeNeftNo}</span></p>
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic Verification Seal footer */}
        <div className="mt-2 flex justify-between items-center text-[8px] text-gray-400 px-1 print:hidden">
          <span>Official Lorry Receipt Generated Electronically • Verified {senderName} Platform</span>
          <span>Hash ID: {trackingNumber}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 print:static print:p-0 print:block print:bg-transparent animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white text-black rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative print:static print:overflow-visible print:max-w-none print:shadow-none print:w-full">
        
        {/* Header - Not printed */}
        <div className="bg-gray-900 text-white px-3 sm:px-4 md:px-6 py-4 flex justify-between items-center print:hidden">
          <div>
            <h3 className="text-base font-bold">Lorry Receipt (LR) Consignment Note</h3>
            <p className="text-xs text-gray-400 mt-0.5">Online generated manifest for tracking ID: {trackingNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition focus:outline-none text-lg"
          >
            ✕
          </button>
        </div>

        {/* Preview Scroll Area */}
        <div className="max-h-[80vh] overflow-y-auto bg-gray-50 p-3 sm:p-4 md:p-6 print:p-0 print:bg-white print:max-h-none print:overflow-visible">
          <SarthakLRTemplate />
        </div>

        {/* PRINT PORTAL - Rendered exclusively for print mode */}
        {createPortal(
          <div id="printable-lr" className="hidden print:block bg-white print:w-full print:h-auto printable-portal">
            <SarthakLRTemplate />
          </div>,
          document.body
        )}

        {/* Footer Actions - Not printed */}
        <div className="px-3 sm:px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-4 print:hidden">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition text-sm font-semibold"
          >
            Close
          </button>
          <button 
            onClick={() => {
              const originalTitle = document.title;
              const consigneeName = logistics?.receiver?.name ? logistics.receiver.name.replace(/\s+/g, '_') : 'Unknown';
              document.title = `LR_${trackingNumber}_${consigneeName}`;
              window.print();
              document.title = originalTitle;
            }}
            className="px-3 sm:px-4 md:px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Lorry Receipt
          </button>
        </div>

      </div>
    </div>
  );
};

export default LorryReceiptModal;
