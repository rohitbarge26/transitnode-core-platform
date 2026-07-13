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

const ShreepatiMasterInvoiceForm = ({
  masterInvoiceId,
  supplierName = "Parekh Integrated Services Pvt Ltd",
  baseRate,
  grandTotal
}) => {
  const invoiceDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  const servicePeriod = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  const totalInWords = numberToWords(Math.round(grandTotal || baseRate || 0));

  return (
    <div className="w-full bg-white text-black font-sans border-2 border-black text-sm print:border-2">
      {/* Header */}
      <div className="text-center font-bold text-2xl uppercase pt-2 pb-1 border-b-2 border-black tracking-wide">
        SHREEPATI TRANSPORT
      </div>
      <div className="text-center text-xs py-1 border-b-2 border-black">
        <div>AL3/11/15, NANDANVAN SOCIETY SECTOR -19 AIROLI NAVI MUMBAI - 400 708</div>
        <div>CONTACT NO. - 9867416154</div>
      </div>
      
      {/* Blank Rows */}
      <div className="h-4 border-b border-black"></div>
      <div className="h-4 border-b-2 border-black"></div>

      {/* Details Grid */}
      <div className="flex border-b-2 border-black text-xs font-bold py-2 px-2">
        <div className="flex flex-col w-1/2 space-y-4">
          <div className="flex w-4/5">
            <div className="w-1/3">INVOICE NO :-</div>
            <div className="w-2/3 border border-black px-1 text-center">{masterInvoiceId || 'ST - 009/2026 -2027'}</div>
          </div>
          <div className="flex w-full">
            <div className="w-[26%]">BILL TO :-</div>
            <div className="w-[74%] border border-black px-1 text-center">{supplierName}</div>
          </div>
        </div>
        <div className="flex flex-col w-1/2 space-y-4 justify-end items-end">
          <div className="flex w-[70%]">
            <div className="w-1/2 text-right pr-2">INVOICE DATE :-</div>
            <div className="w-1/2 border border-black px-1 text-center">{invoiceDate}</div>
          </div>
          <div className="flex w-[70%]">
            <div className="w-1/2 text-right pr-2">SERVICE PERIOD :-</div>
            <div className="w-1/2 border border-black px-1 text-center">{servicePeriod}</div>
          </div>
        </div>
      </div>

      {/* Blank Space below details */}
      <div className="h-24 border-b-2 border-black"></div>

      {/* Main Table Headers */}
      <div className="flex font-bold text-center border-b-2 border-black">
        <div className="w-[15%] p-1 border-r-2 border-black">Date</div>
        <div className="w-[65%] p-1 border-r-2 border-black">particulers</div>
        <div className="w-[20%] p-1">Rate</div>
      </div>

      {/* Main Table Content */}
      <div className="flex min-h-[300px] border-b-2 border-black">
        
        {/* Date */}
        <div className="w-[15%] p-2 border-r-2 border-black text-center pt-4 sm:pt-6 md:pt-8 font-bold">
          {servicePeriod}
        </div>
        
        {/* Particulars */}
        <div className="w-[65%] border-r-2 border-black flex flex-col justify-between">
          <div className="text-center pt-2">
            <div>TRANSPORTATION CHARGES INVOICE</div>
            <div className="text-left px-4 mt-2 font-bold">Consolidated Freight Services</div>
            <div className="text-left px-4 mt-2">Total Shipments Included: <strong>{masterInvoiceId ? 'Multiple' : 'Pending'}</strong></div>
            <div className="text-left px-4 mt-2 text-xs italic text-gray-600">Note: Please refer to the attached Excel Export for detailed tracking numbers, origins, destinations, and vehicle breakdowns.</div>
          </div>
          
          {/* Internal totals alignment */}
          <div className="flex flex-col border-t-2 border-black mt-12 w-1/2 ml-auto">
            <div className="p-1 text-left border-b border-black">TOTAL AMT :-</div>
            <div className="p-1 h-6 border-b border-black"></div>
            <div className="p-1 h-6 border-b border-black"></div>
            <div className="p-1 h-6 border-b border-black"></div>
            <div className="p-1 text-center">Rounded Amt.</div>
          </div>
        </div>

        {/* Rate Column */}
        <div className="w-[20%] flex flex-col justify-between">
          <div className="text-right p-2 pt-[4.5rem]">
            {Number(baseRate).toLocaleString('en-IN', {minimumFractionDigits: 2})}
          </div>

          <div className="flex flex-col border-t-2 border-black text-right">
            <div className="p-1 border-b border-black">{Number(baseRate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            <div className="p-1 border-b border-black text-center">-</div>
            <div className="p-1 border-b border-black text-center">-</div>
            <div className="p-1 border-b border-black text-center">-</div>
            <div className="p-1">{Number(grandTotal || baseRate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
        </div>

      </div>

      {/* Total Amount in Words */}
      <div className="font-bold border-b-2 border-black p-1 text-xs px-2">
        Total Amt. in word :-{totalInWords}.
      </div>

      {/* Signatures */}
      <div className="flex h-40">
        <div className="w-1/2"></div>
        <div className="w-1/2 flex flex-col justify-between items-center p-4">
          <div>For Shreepati Transport</div>
          <div>Authorized Signatory</div>
        </div>
      </div>

    </div>
  );
};

export default ShreepatiMasterInvoiceForm;
