import React from 'react';

const numberToWords = (num) => {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() ? str.trim() + ' Only' : 'Zero Only';
};

const SarthakInvoiceForm = ({
  invoice,
  baseFreightRate, setBaseFreightRate,
  rcmApplied, setRcmApplied,
  cgst, sgst, grandTotal,
  companyName = "SARTHAK ENTERPRISES",
  companyAddress = "AL3/11/15, Nandavan Society, Sector - 19, Airoli, Navi Mumbai, Maharashtra - 400708",
  companyGstin = "27ABJHS2600A1ZL",
  companyPan = "ABJHS2600A",
  receiverAddress = "F1, Block 1-7, Antriksh Warehousing Complex, Village Dahole, Off. Mumbai Nashik Highway, Bhiwandi - 421302",
  receiverGstin = "N/A",
  receiverPan = "N/A",
  invoiceDate: propInvoiceDate,
  invoicePeriod: propInvoicePeriod
}) => {
  const invoiceDate = propInvoiceDate || new Date(invoice.metadata?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const invoicePeriod = propInvoicePeriod || new Date(invoice.metadata?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const grandTotalInWords = numberToWords(Math.round(grandTotal || 0));

  return (
    <div className="w-full bg-white text-black font-sans border-2 border-black print:border-0 text-sm">
      {/* Header */}
      <div className="text-center font-bold text-xl uppercase py-2 border-b-2 border-black">
        {companyName}
      </div>
      <div className="text-center font-bold text-lg py-1 border-b-2 border-black">
        TAX INVOICE
      </div>

      {/* Top Details Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-black">
        <div className="border-r-2 border-black">
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 font-bold">Tax Invoice No. :</div>
            <div className="w-1/2 p-1">{invoice.trackingNumber}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 font-bold">Invoice Date :</div>
            <div className="w-1/2 p-1">{invoiceDate}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 font-bold">HSN/CODE Code :</div>
            <div className="w-1/2 p-1">996601</div>
          </div>
          <div className="flex bg-gray-100">
            <div className="w-1/2 p-1 font-bold border-r border-black">Billed From :</div>
            <div className="w-1/2 p-1 font-bold text-center">{companyName}</div>
          </div>
        </div>
        <div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 font-bold">Credit Terms :</div>
            <div className="w-1/2 p-1 text-center">30 Days</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 font-bold">Nature of Supply :</div>
            <div className="w-1/2 p-1 text-center">Services</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 font-bold">Invoice period :</div>
            <div className="w-1/2 p-1 text-center">{invoicePeriod}</div>
          </div>
          <div className="flex bg-gray-100">
            <div className="w-1/2 p-1 font-bold border-r border-black">Billed to :</div>
            <div className="w-1/2 p-1 font-bold text-center">{invoice.logistics?.receiver?.name || 'Customer'}</div>
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-black text-center text-xs">
        <div className="p-2 border-r-2 border-black whitespace-pre-wrap">
          {companyAddress}
        </div>
        <div className="p-2 whitespace-pre-wrap">
          {receiverAddress}
        </div>
      </div>

      {/* GSTIN & PAN Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-black font-mono text-xs font-bold">
        <div className="border-r-2 border-black">
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1">GSTIN :</div>
            <div className="w-3/4 p-1">{companyGstin}</div>
          </div>
          <div className="flex">
            <div className="w-1/4 p-1">PAN :</div>
            <div className="w-3/4 p-1">{companyPan}</div>
          </div>
        </div>
        <div>
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1">GSTIN :</div>
            <div className="w-3/4 p-1">{receiverGstin}</div>
          </div>
          <div className="flex">
            <div className="w-1/4 p-1">PAN :</div>
            <div className="w-3/4 p-1">{receiverPan}</div>
          </div>
        </div>
      </div>

      {/* Main Table Headers */}
      <div className="flex font-bold text-center border-b-2 border-black">
        <div className="w-1/6 p-1 border-r-2 border-black">DATE</div>
        <div className="w-4/6 p-1 border-r-2 border-black">PARTICULARS</div>
        <div className="w-1/6 p-1">TOTAL AMOUNT RS.</div>
      </div>

      {/* Main Table Content */}
      <div className="flex min-h-[250px] border-b-2 border-black">
        <div className="w-1/6 p-2 border-r-2 border-black">
          {invoiceDate}
        </div>
        <div className="w-4/6 p-4 border-r-2 border-black space-y-1">
          <p className="font-bold uppercase underline mb-2">TRANSPORTATION CHARGES INVOICE</p>
          <p><strong>From:</strong> {invoice.logistics?.transport?.origin}  <strong>To:</strong> {invoice.logistics?.transport?.destination}</p>
          <p><strong>Vehicle Number:</strong> {invoice.logistics?.transport?.vehicleNumber || 'Not Assigned'}</p>
          <p><strong>Tracking Number:</strong> {invoice.trackingNumber}</p>
          <br/>
          {/* Internal Input Controls hidden from print */}
          <div className="mt-4 p-2 bg-gray-100 rounded border border-gray-300 print:hidden text-xs text-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Accountant Controls:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span>RCM Applied (5%)</span>
                <input type="checkbox" checked={rcmApplied} onChange={() => setRcmApplied(!rcmApplied)} className="w-4 h-4" />
              </label>
            </div>
          </div>
        </div>
        <div className="w-1/6 border-black flex flex-col justify-start">
          <div className="p-2 h-full print:hidden">
            <input 
              type="number" 
              value={baseFreightRate}
              onChange={e => setBaseFreightRate(Number(e.target.value))}
              className="w-full border-b border-gray-400 text-right font-bold text-lg outline-none bg-yellow-50"
              placeholder="0.00"
            />
          </div>
          <div className="p-2 h-full hidden print:block text-right font-bold">
            {baseFreightRate.toLocaleString('en-IN', {minimumFractionDigits: 2})}
          </div>
        </div>
      </div>

      {/* Totals Box */}
      <div className="flex border-b-2 border-black">
        <div className="w-4/6 p-1 text-right font-bold border-r-2 border-black">
          TOTAL AMT. RS.
        </div>
        <div className="w-1/6 p-1 text-right font-bold">
          -
        </div>
      </div>

      <div className="flex border-b-2 border-black">
        <div className="w-4/6 flex-1 flex flex-col justify-end p-2 border-r-2 border-black text-xs">
          <p>Total Amount in Word Rs. :</p>
          <p className="font-bold">{grandTotalInWords}</p>
        </div>
        
        <div className="w-2/6">
          <div className="flex border-b border-black">
            <div className="w-[58%] p-1 border-r border-black">Net Amount Rs.</div>
            <div className="w-[42%] p-1 text-right">{baseFreightRate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-[58%] p-1 border-r border-black">CGST @{cgst === 0 ? '0%' : (rcmApplied ? '2.5%' : '9%')}</div>
            <div className="w-[42%] p-1 text-right">{cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-[58%] p-1 border-r border-black">SGST @{sgst === 0 ? '0%' : (rcmApplied ? '2.5%' : '9%')}</div>
            <div className="w-[42%] p-1 text-right">{sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-[58%] p-1 border-r border-black font-bold">Gross Total Amt. Rs.</div>
            <div className="w-[42%] p-1 text-right font-bold">{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div className="flex">
            <div className="w-[58%] p-1 border-r border-black">Rounded off Amt. Rs.</div>
            <div className="w-[42%] p-1 text-right">-</div>
          </div>
        </div>
      </div>

      {/* Bank Details & Signature */}
      <div className="flex h-32">
        <div className="w-1/2 p-2 border-r-2 border-black text-xs space-y-1">
          <div className="font-bold border-b border-black text-center w-32 pb-1 mb-2">Bank Details</div>
          <div className="flex"><div className="w-32">Account Name</div><div>{companyName}</div></div>
          <div className="flex"><div className="w-32">Bank Name</div><div>HDFC Bank</div></div>
          <div className="flex"><div className="w-32">A/c. No.</div><div>50200078725750</div></div>
          <div className="flex"><div className="w-32">IFS Code</div><div>HDFC0004024</div></div>
          <div className="flex"><div className="w-32">Bank Branch</div><div>Airoli, Navi Mumbai</div></div>
        </div>
        <div className="w-1/2 p-2 relative flex flex-col items-center">
          <div className="font-bold absolute top-2 right-4">For {companyName}</div>
          <div className="font-bold absolute bottom-2 right-4">Authorized Signatory</div>
        </div>
      </div>

    </div>
  );
};

export default SarthakInvoiceForm;
