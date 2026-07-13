import React from 'react';

const AccountantLRForm = ({
  invoice,
  baseFreightRate, setBaseFreightRate,
  processingCharge, setProcessingCharge,
  fuelSurcharge, setFuelSurcharge,
  rovCharge, setRovCharge,
  fodCharge, setFodCharge,
  handlingCharge, setHandlingCharge,
  codDodCharge, setCodDodCharge,
  specialDeliveryCharge, setSpecialDeliveryCharge,
  otherCharges, setOtherCharges,
  paymentType, setPaymentType,
  modeOfPayment, setModeOfPayment,
  chequeNeftNo, setChequeNeftNo,
  bankName, setBankName,
  subTotal, gstAmount, grandTotal
}) => {
  if (!invoice) return null;

  const bookingDate = new Date(invoice.metadata?.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  
  const bookingTime = new Date(invoice.metadata?.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const shortSerialNumber = invoice.trackingNumber.split('-').pop() || '4113';

  const senderName = invoice.logistics?.sender?.name || 'Sarthak Enterprises';
  const initials = senderName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const nameParts = senderName.split(' ');
  const firstName = nameParts[0] || 'SARTHAK';
  const lastName = nameParts.slice(1).join(' ') || 'ENTERPRISES';

  return (
    <div className="w-full bg-white text-black p-4 font-sans text-[11px] leading-tight border border-gray-400">
      <div className="mb-2 bg-indigo-50 border border-indigo-200 text-indigo-900 p-2 rounded-lg text-xs font-bold flex justify-between items-center">
        <span>💡 Accountant Mode: Modify charges below. Sub-total, GST, and Grand Total will calculate live.</span>
      </div>

      <div className="border-[1.5px] border-black grid grid-cols-1 md:grid-cols-12">
        {/* HEADER SECTION */}
        <div className="col-span-4 border-b border-r border-black p-2 flex items-center gap-2">
          <div className="bg-black text-white p-1 rounded font-black text-xs tracking-tighter">
            {initials}
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none uppercase">{firstName}</h1>
            <p className="text-[10px] font-bold tracking-widest text-gray-700 uppercase leading-none mt-0.5">{lastName}</p>
          </div>
        </div>
        
        <div className="col-span-4 border-b border-r border-black p-2 text-[9px] leading-tight">
          <p className="font-bold">{invoice.logistics?.sender?.address || 'V1032, Krushi Wholesale Mart, Opp. Akshar Complex, Sector 19, Vashi, Navi Mumbai - 400703.'}</p>
          <p>Mob.: +91 {invoice.logistics?.sender?.phone || '9867416154'}</p>
          {senderName.toLowerCase().includes('sarthak') ? (
            <p>Email: suhas.bhoite123@gmail.com</p>
          ) : (
            <p>Email: contact@{senderName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</p>
          )}
        </div>
        
        <div className="col-span-2 border-b border-r border-black grid grid-rows-2">
          <div className="p-1 border-b border-black font-bold text-[9px] uppercase bg-gray-50">Booking Date & Time</div>
          <div className="p-1 grid grid-cols-1 sm:grid-cols-2 text-[10px]">
            <div>DATE: <span className="font-bold font-mono">{bookingDate}</span></div>
            <div className="border-l border-black pl-1">TIME: <span className="font-bold font-mono">{bookingTime}</span></div>
          </div>
        </div>

        <div className="col-span-1 border-b border-r border-black p-1 text-[9px]">
          <p className="font-bold uppercase mb-1">Mode</p>
          <div className="flex flex-col gap-0.5">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={true} readOnly className="w-2.5 h-2.5 accent-black" />
              <span>SURFACE</span>
            </label>
          </div>
        </div>

        <div className="col-span-1 border-b border-black p-2 flex flex-col items-center justify-center bg-red-50/20">
          <span className="text-[8px] font-bold text-gray-500 uppercase text-center block leading-none">LR No.</span>
          <span className="text-[11px] font-black text-red-600 font-mono tracking-tighter mt-1">
            {shortSerialNumber}
          </span>
        </div>

        {/* SHIPPER & RECIPIENT DETAILS */}
        <div className="col-span-6 border-b border-r border-black grid grid-cols-1 md:grid-cols-12">
          <div className="col-span-12 bg-gray-100 p-1 font-bold border-b border-black uppercase text-[9px]">
            SHIPPER'S DETAILS (Consignor)
          </div>
          
          <div className="col-span-8 p-1 border-b border-r border-black">
            <span className="text-[8px] block text-gray-500 uppercase">Name</span>
            <span className="font-bold uppercase text-[10px]">{invoice.logistics?.sender?.name || 'N/A'}</span>
          </div>
          <div className="col-span-4 p-1 border-b border-black">
            <span className="text-[8px] block text-gray-500 uppercase">From City</span>
            <span className="font-bold uppercase text-[10px]">{invoice.logistics?.transport?.origin || 'N/A'}</span>
          </div>

          <div className="col-span-8 p-1 border-b border-r border-black">
            <span className="text-[8px] block text-gray-500 uppercase">Phone No</span>
            <span className="font-bold font-mono">{invoice.logistics?.sender?.phone || 'N/A'}</span>
          </div>
          <div className="col-span-4 p-1 border-b border-black">
            <span className="text-[8px] block text-gray-500 uppercase">Postal Code</span>
            <span className="font-bold font-mono">
              {(() => {
                const savedCode = invoice.logistics?.sender?.postalCode;
                const address = invoice.logistics?.sender?.address;
                if (savedCode && savedCode !== '400703') return savedCode;
                if (address) {
                  const match = address.match(/\b\d{6}\b/);
                  if (match) return match[0];
                }
                return savedCode || '400703';
              })()}
            </span>
          </div>

          <div className="col-span-12 p-1 border-b border-black min-h-[30px]">
            <span className="text-[8px] block text-gray-500 uppercase">Address</span>
            <span className="text-[9px]">{invoice.logistics?.sender?.address || 'Vashi Industrial Area, Navi Mumbai, Maharashtra'}</span>
          </div>

          <div className="col-span-8 p-1 border-r border-black">
            <span className="text-[8px] block text-gray-500 uppercase">GST No.</span>
            <span className="font-mono text-[9px]">{invoice.logistics?.sender?.gstin || '27AAAAA1111A1Z1'}</span>
          </div>
          <div className="col-span-4 p-1 flex items-center justify-center">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={invoice.logistics?.sender?.dropOff || false} readOnly className="w-2.5 h-2.5 accent-indigo-600" />
              <span className="text-[9px] font-bold">Drop-off</span>
            </label>
          </div>
        </div>

        <div className="col-span-6 border-b border-black grid grid-cols-1 md:grid-cols-12">
          <div className="col-span-12 bg-gray-100 p-1 font-bold border-b border-black uppercase text-[9px]">
            RECIPIENT'S DETAILS (Consignee)
          </div>
          
          <div className="col-span-8 p-1 border-b border-r border-black">
            <span className="text-[8px] block text-gray-500 uppercase">Name</span>
            <span className="font-bold uppercase text-[10px]">{invoice.logistics?.receiver?.name || 'N/A'}</span>
          </div>
          <div className="col-span-4 p-1 border-b border-black">
            <span className="text-[8px] block text-gray-500 uppercase">To City</span>
            <span className="font-bold uppercase text-[10px]">{invoice.logistics?.transport?.destination || 'N/A'}</span>
          </div>

          <div className="col-span-8 p-1 border-b border-r border-black">
            <span className="text-[8px] block text-gray-500 uppercase">Phone Number</span>
            <span className="font-bold font-mono">{invoice.logistics?.receiver?.phone || 'N/A'}</span>
          </div>
          <div className="col-span-4 p-1 border-b border-black">
            <span className="text-[8px] block text-gray-500 uppercase">Postal Code</span>
            <span className="font-bold font-mono">
              {(() => {
                const savedCode = invoice.logistics?.receiver?.postalCode;
                const address = invoice.logistics?.receiver?.address;
                if (savedCode && savedCode !== '380001') return savedCode;
                if (address) {
                  const match = address.match(/\b\d{6}\b/);
                  if (match) return match[0];
                }
                return savedCode || '380001';
              })()}
            </span>
          </div>

          <div className="col-span-12 p-1 border-b border-black min-h-[30px]">
            <span className="text-[8px] block text-gray-500 uppercase">Address</span>
            <span className="text-[9px]">{invoice.logistics?.receiver?.address || 'Central Goods Terminal, Destination Hub'}</span>
          </div>

          <div className="col-span-8 p-1 border-r border-black">
            <span className="text-[8px] block text-gray-500 uppercase">GST No.</span>
            <span className="font-mono text-[9px]">{invoice.logistics?.receiver?.gstin || '24BBBBB2222B2Z2'}</span>
          </div>
          <div className="col-span-4 p-1 flex items-center justify-center">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={invoice.logistics?.receiver?.selfCollect || false} readOnly className="w-2.5 h-2.5 accent-indigo-600" />
              <span className="text-[9px] font-bold">Self Collect</span>
            </label>
          </div>
        </div>

        {/* CARGO & PHYSICAL SPECIFICATIONS */}
        <div className="col-span-4 border-b border-r border-black grid grid-cols-1 sm:grid-cols-2">
          <div className="p-1 border-r border-black">
            <span className="text-[8px] block text-gray-500 uppercase">Actual Wt. (kg)</span>
            <span className="font-bold text-xs font-mono">{invoice.logistics?.package?.actualWeight || invoice.logistics?.package?.weight_kg || '1800'}</span>
          </div>
          <div className="p-1">
            <span className="text-[8px] block text-gray-500 uppercase">Charged Wt. (kg)</span>
            <span className="font-bold text-xs font-mono">{invoice.logistics?.package?.chargedWeight || invoice.logistics?.package?.weight_kg || '1800'}</span>
          </div>
        </div>

        {/* Payment Type Selection */}
        <div className="col-span-4 border-b border-r border-black p-1 bg-yellow-50/30">
          <span className="text-[8px] block text-gray-500 uppercase mb-1 font-bold text-indigo-700">Payment Type</span>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-1 cursor-pointer">
              <input 
                type="radio" 
                name="paymentType" 
                checked={paymentType === 'CREDIT'} 
                onChange={() => setPaymentType('CREDIT')} 
                className="w-3 h-3 accent-indigo-600"
              />
              <span className="font-bold text-[9px]">CREDIT</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input 
                type="radio" 
                name="paymentType" 
                checked={paymentType === 'PAID'} 
                onChange={() => setPaymentType('PAID')} 
                className="w-3 h-3 accent-indigo-600"
              />
              <span className="font-bold text-[9px]">PAID</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input 
                type="radio" 
                name="paymentType" 
                checked={paymentType === 'FOD'} 
                onChange={() => setPaymentType('FOD')} 
                className="w-3 h-3 accent-indigo-600"
              />
              <span className="font-bold text-[9px]">FOD</span>
            </label>
          </div>
        </div>

        {/* Client Reference Code */}
        <div className="col-span-4 border-b border-black p-1 text-[9px]">
          <span className="text-[8px] block text-gray-500 uppercase">Client / Store Code</span>
          <span className="font-mono font-bold uppercase">{invoice.logistics?.receiver?.clientCode || invoice.trackingNumber}</span>
        </div>

        {/* LOWER BODY */}
        <div className="col-span-8 border-r border-black grid grid-cols-1 md:grid-cols-12">
          <div className="col-span-12 bg-gray-100 p-1 font-bold border-b border-black uppercase text-[9px]">
            Package Information
          </div>
          
          <div className="col-span-1 border-b border-r border-black p-0.5 font-bold text-[7px] text-center bg-gray-50">Inv. No</div>
          <div className="col-span-2 border-b border-r border-black p-0.5 font-bold text-[7px] text-center bg-gray-50">Inv. Date</div>
          <div className="col-span-2 border-b border-r border-black p-0.5 font-bold text-[7px] text-center bg-gray-50">Inv. Value</div>
          <div className="col-span-4 border-b border-r border-black p-0.5 font-bold text-[7px] text-center bg-gray-50">E-way bill</div>
          <div className="col-span-1 border-b border-r border-black p-0.5 font-bold text-[7px] text-center bg-gray-50">Fragile</div>
          <div className="col-span-2 border-b border-black p-0.5 font-bold text-[7px] text-center bg-gray-50">Risk</div>

          <div className="col-span-1 border-b border-r border-black p-1 font-mono text-[9px] text-center truncate">{invoice.logistics?.package?.invoiceNo || 'N/A'}</div>
          <div className="col-span-2 border-b border-r border-black p-1 font-mono text-[9px] text-center truncate">
            {invoice.logistics?.package?.invoiceDate ? new Date(invoice.logistics.package.invoiceDate).toLocaleDateString('en-IN') : 'N/A'}
          </div>
          <div className="col-span-2 border-b border-r border-black p-1 font-mono text-[9px] text-right truncate">
            ₹{invoice.logistics?.package?.invoiceValue ? invoice.logistics.package.invoiceValue.toLocaleString('en-IN') : '0'}
          </div>
          <div className="col-span-4 border-b border-r border-black p-1 font-mono text-[9px] text-center truncate">{invoice.logistics?.package?.ewayBillNo || 'N/A'}</div>
          <div className="col-span-1 border-b border-r border-black p-1 flex justify-center items-center">
            <input type="checkbox" checked={invoice.logistics?.package?.fragile || false} readOnly className="w-2 h-2 accent-indigo-600" />
          </div>
          <div className="col-span-2 border-b border-black p-1 text-[8px] flex flex-col justify-center">
            <span className="font-bold text-indigo-700">{invoice.logistics?.package?.riskCoverage || 'OWNERS'}</span>
          </div>

          <div className="col-span-12 p-1.5 border-b border-black min-h-[40px] bg-gray-50/20">
            <span className="text-[8px] block text-gray-500 uppercase font-bold">Said to Contain</span>
            <p className="font-mono text-[9px] text-gray-800 font-bold">{invoice.logistics?.transport?.commodityType || 'N/A'}</p>
          </div>

          <div className="col-span-12 grid grid-cols-1 md:grid-cols-12">
            <div className="col-span-4 p-2 border-r border-b border-black text-[7px] leading-tight">
              <h4 className="font-bold uppercase text-[8px] mb-1">Terms</h4>
              <p>Subject to local transport terms and conditions.</p>
            </div>

            <div className="col-span-4 p-2 border-r border-b border-black grid grid-rows-2 text-[8px]">
              <div className="flex gap-2">
                <label className="flex items-center gap-0.5"><input type="checkbox" checked={false} readOnly className="w-2 h-2" /><span>Cash</span></label>
                <label className="flex items-center gap-0.5"><input type="checkbox" checked={false} readOnly className="w-2 h-2" /><span>Cheque</span></label>
              </div>
              <div className="border-t border-gray-200 pt-1 font-bold">COD: ₹0.00</div>
            </div>

            <div className="col-span-4 p-2 border-b border-black flex flex-col justify-center items-center bg-gray-50">
              <span className="text-[8px] font-bold text-gray-500 uppercase">Vehicle No.</span>
              <span className="font-mono font-black text-xs text-black border border-black px-1.5 py-0.5 bg-white rounded mt-0.5">
                {invoice.logistics?.transport?.vehicleNumber || 'N/A'}
              </span>
            </div>

            {/* Signature blocks (Not relevant for input but visual) */}
            <div className="col-span-6 p-2 border-r border-black min-h-[40px] flex flex-col justify-between">
              <span className="text-[7px] text-gray-400 block">Shipper Sign</span>
              <div className="w-full border-t border-dotted border-gray-300"></div>
            </div>

            <div className="col-span-6 p-2 min-h-[40px] flex flex-col justify-between">
              <span className="text-[7px] text-gray-400 block">Agent Signature</span>
              <div>
                <p className="text-[8px] font-bold">{invoice.logistics?.transport?.driverName || 'N/A'}</p>
                <div className="w-full border-t border-dotted border-gray-300"></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CHARGES COLUMN - EDITABLE FOR ACCOUNTANT */}
        <div className="col-span-4 grid grid-cols-1 text-[9px] bg-yellow-50/10">
          <div className="bg-gray-900 text-white p-1 font-bold text-center uppercase tracking-wider text-[8px] border-b border-black">
            Charges (Retail Pick-ups)
          </div>

          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/40">
            <span className="font-bold text-indigo-900">Base Freight:</span>
            <input 
              type="number" 
              value={baseFreightRate}
              onChange={e => setBaseFreightRate(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-bold font-mono text-[10px] outline-none focus:border-indigo-500"
            />
          </div>
          
          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/20">
            <span>Processing Charge:</span>
            <input 
              type="number" 
              value={processingCharge}
              onChange={e => setProcessingCharge(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px] outline-none"
            />
          </div>

          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/20">
            <span>Fuel Surcharge:</span>
            <input 
              type="number" 
              value={fuelSurcharge}
              onChange={e => setFuelSurcharge(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px] outline-none"
            />
          </div>

          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/20">
            <span>ROV Charge:</span>
            <input 
              type="number" 
              value={rovCharge}
              onChange={e => setRovCharge(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px] outline-none"
            />
          </div>

          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/20">
            <span>FOD Charge:</span>
            <input 
              type="number" 
              value={fodCharge}
              onChange={e => setFodCharge(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px] outline-none"
            />
          </div>

          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/20">
            <span>Handling Charge:</span>
            <input 
              type="number" 
              value={handlingCharge}
              onChange={e => setHandlingCharge(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px] outline-none"
            />
          </div>

          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/20">
            <span>COD/DOD Charge:</span>
            <input 
              type="number" 
              value={codDodCharge}
              onChange={e => setCodDodCharge(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px] outline-none"
            />
          </div>

          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/20">
            <span>Special Delivery:</span>
            <input 
              type="number" 
              value={specialDeliveryCharge}
              onChange={e => setSpecialDeliveryCharge(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px] outline-none"
            />
          </div>

          <div className="border-b border-black p-1 flex justify-between items-center bg-yellow-50/20">
            <span>Other Charges:</span>
            <input 
              type="number" 
              value={otherCharges}
              onChange={e => setOtherCharges(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px] outline-none"
            />
          </div>

          <div className="border-b border-black p-1.5 flex justify-between bg-gray-100 font-bold">
            <span>Sub-total:</span>
            <span className="font-mono text-[10px] font-black text-gray-900">₹{subTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="border-b border-black p-1.5 flex justify-between bg-gray-100 text-gray-700 font-bold">
            <span>GST of 12%:</span>
            <span className="font-mono text-[10px] font-black text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-1.5 flex justify-between bg-indigo-50 font-black text-[11px] text-indigo-900 border-b border-black">
            <span>Grand Total:</span>
            <span className="font-mono text-[11px]">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
          
          {/* Mode of Payment Selection */}
          <div className="p-2 bg-gray-50 text-[8px] space-y-1.5 border-t border-black">
            <span className="font-bold uppercase block text-[8px] text-indigo-700">Mode of Payment</span>
            <div className="flex gap-2">
              <label className="flex items-center gap-0.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="modeOfPayment" 
                  checked={modeOfPayment === 'CASH'} 
                  onChange={() => setModeOfPayment('CASH')} 
                  className="w-2.5 h-2.5 accent-indigo-600"
                />
                <span>Cash</span>
              </label>
              <label className="flex items-center gap-0.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="modeOfPayment" 
                  checked={modeOfPayment === 'CHEQUE_DD'} 
                  onChange={() => setModeOfPayment('CHEQUE_DD')} 
                  className="w-2.5 h-2.5 accent-indigo-600"
                />
                <span>Cheque/DD</span>
              </label>
              <label className="flex items-center gap-0.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="modeOfPayment" 
                  checked={modeOfPayment === 'NEFT_RTGS'} 
                  onChange={() => setModeOfPayment('NEFT_RTGS')} 
                  className="w-2.5 h-2.5 accent-indigo-600"
                />
                <span>NEFT/RTGS</span>
              </label>
            </div>
            
            <div className="space-y-1 mt-1 border-t border-gray-200 pt-1 text-[8px]">
              <div>
                <span className="block text-[7px] text-gray-500 uppercase">Bank Name</span>
                <input 
                  type="text" 
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-[8px] font-semibold"
                  placeholder="e.g. HDFC Bank Ltd"
                />
              </div>
              <div>
                <span className="block text-[7px] text-gray-500 uppercase">Cheque / Reference No.</span>
                <input 
                  type="text" 
                  value={chequeNeftNo}
                  onChange={e => setChequeNeftNo(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 font-mono text-[8px]"
                  placeholder="e.g. TXN-12345"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AccountantLRForm;
