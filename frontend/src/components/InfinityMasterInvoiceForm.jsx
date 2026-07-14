import React from 'react';

const InfinityMasterInvoiceForm = ({
  masterInvoiceId,
  supplierName = "Flipkart India Private Limited",
  baseRate,
  companyName = "INFINITY GREEN LOGISTICS & SERVICES LLP",
  invoiceDate: propInvoiceDate,
  invoicePeriod: propInvoicePeriod
}) => {
  const invoiceDate = propInvoiceDate || new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const invoicePeriod = propInvoicePeriod || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="w-full bg-white text-black font-sans border-2 border-black text-sm print:border-2">
      
      {/* Main Header */}
      <div className="text-center font-bold text-xl uppercase py-2 border-b-2 border-black tracking-wide">
        {companyName}
      </div>
      <div className="text-center font-bold text-base py-1 border-b-2 border-black">
        BILL OF SUPPLY
      </div>

      {/* Top Section - Split 50/50 */}
      <div className="flex border-b-2 border-black">
        
        {/* Left Column (Billed From & Billed To) */}
        <div className="w-1/2 border-r-2 border-black flex flex-col">
          
          {/* Billed From Header */}
          <div className="text-center font-bold border-b border-black py-1">
            Billed From
          </div>
          
          {/* Billed From Data */}
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">Supplier</div>
            <div className="w-3/4 p-1">{companyName}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">GSTIN</div>
            <div className="w-3/4 p-1">27AAKFI1710K1ZE</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">Address</div>
            <div className="w-3/4 p-1">Room No. 202, Plot No. 4/B, Vardhman Dham CHS., JCI Kamothe, EDSO Road, Kamothe, Navi Mumbai - 410209</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">State</div>
            <div className="w-3/4 p-1">Maharashtra</div>
          </div>
          <div className="flex border-b-2 border-black">
            <div className="w-1/4 p-1 border-r border-black">State Code</div>
            <div className="w-3/4 p-1">27</div>
          </div>

          {/* Billed To Header */}
          <div className="text-center font-bold border-b border-black py-1">
            Billed To
          </div>

          {/* Billed To Data */}
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">Supplier</div>
            <div className="w-3/4 p-1">{supplierName}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">GSTIN</div>
            <div className="w-3/4 p-1">27AABCF8078M1Z1</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">Address</div>
            <div className="w-3/4 p-1">Block No. B6 & B8, Acron Warehouse and Logistics Park, Opp. Dive Petrol Pump, NH - 3 Mumbai Nashik Highway Bhiwandi, Dive Anjur Village, Bhiwandi - 421302</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">Location Code</div>
            <div className="w-3/4 p-1">2700554</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/4 p-1 border-r border-black">State</div>
            <div className="w-3/4 p-1">Maharashtra</div>
          </div>
          <div className="flex">
            <div className="w-1/4 p-1 border-r border-black">State Code</div>
            <div className="w-3/4 p-1">27</div>
          </div>
          
        </div>

        {/* Right Column (Bill of Supply Details) */}
        <div className="w-1/2 flex flex-col">
          <div className="text-center font-bold border-b border-black py-1">
            Bill of Supply Details
          </div>
          
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 border-r border-black">Date</div>
            <div className="w-1/2 p-1">{invoiceDate}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 border-r border-black">Bill of Supply No.</div>
            <div className="w-1/2 p-1 font-bold">{masterInvoiceId || 'PENDING'}</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 border-r border-black">Nature of Supply</div>
            <div className="w-1/2 p-1">Interstate</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 border-r border-black">Nature of Transcation</div>
            <div className="w-1/2 p-1">Service</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 border-r border-black">Place of Supply</div>
            <div className="w-1/2 p-1">Maharashtra</div>
          </div>
          <div className="flex border-b border-black">
            <div className="w-1/2 p-1 border-r border-black">Invoice Period</div>
            <div className="w-1/2 p-1">{invoicePeriod}</div>
          </div>
          {/* Empty Space filler for the rest of the right column */}
          <div className="flex-1"></div>
        </div>
      </div>

      {/* Main Table Headers */}
      <div className="flex font-bold text-center border-b-2 border-black">
        <div className="w-[10%] p-2 border-r border-black">Sr. No.</div>
        <div className="w-[15%] p-2 border-r border-black">SAC Code</div>
        <div className="w-[45%] p-2 border-r border-black">Description of Service</div>
        <div className="w-[15%] p-2 border-r border-black flex flex-col justify-center"><span>Billing</span><span>Type</span></div>
        <div className="w-[15%] p-2 flex flex-col justify-center">Value of Supply</div>
      </div>

      {/* Main Table Content */}
      <div className="flex min-h-[150px] border-b-2 border-black text-center">
        <div className="w-[10%] p-2 border-r border-black">1</div>
        <div className="w-[15%] p-2 border-r border-black">996601</div>
        <div className="w-[45%] p-2 border-r border-black flex flex-col items-start text-left">
          <span className="font-bold">Consolidated Freight Services</span>
          <span className="mt-2 text-xs italic text-gray-600">Note: Please refer to the attached Excel Export for detailed tracking numbers, origins, destinations, and vehicle breakdowns.</span>
        </div>
        <div className="w-[15%] p-2 border-r border-black flex flex-col font-bold justify-center items-center">
          <span>Consolidated</span>
        </div>
        <div className="w-[15%] p-2 font-bold text-right">
          {Number(baseRate).toLocaleString('en-IN', {minimumFractionDigits: 2})}
        </div>
      </div>

      {/* Total Amount Row */}
      <div className="flex border-b-2 border-black">
        <div className="w-[85%] p-1 font-bold border-r border-black">Total Amount (in INR) :</div>
        <div className="w-[15%] p-1 text-right font-bold">
          {Number(baseRate).toLocaleString('en-IN', {minimumFractionDigits: 2})}
        </div>
      </div>

      {/* Payment Terms & Signature Container */}
      <div className="flex border-b-2 border-black min-h-[8rem]">
        
        {/* Payment Terms (Left) */}
        <div className="w-1/2 border-r-2 border-black flex flex-col">
          <div className="text-center font-bold border-b border-black py-1">Payment Terms</div>
          
          <div className="flex flex-1">
            <div className="w-1/3 flex flex-col border-r border-black font-bold">
              <div className="p-1 border-b border-black flex-1">In Fvaour of</div>
              <div className="p-1 border-b border-black flex-1">Bank & Branch</div>
              <div className="p-1 border-b border-black flex-1">Account No.</div>
              <div className="p-1 flex-1">IFSC Code</div>
            </div>
            <div className="w-2/3 flex flex-col">
              <div className="p-1 border-b border-black flex-1">{companyName}</div>
              <div className="p-1 border-b border-black flex-1">HDFC Bank, Airoli Navi Mumbai</div>
              <div className="p-1 border-b border-black flex-1">50200094621081</div>
              <div className="p-1 flex-1">HDFC0004024</div>
            </div>
          </div>
        </div>

        {/* Signature (Right) */}
        <div className="w-1/2 relative flex flex-col justify-between p-2">
          <div className="text-center font-bold">For {companyName}</div>
          <div className="text-center font-bold absolute bottom-2 w-full left-0">Authorized Signatory</div>
        </div>

      </div>

      {/* Terms & Conditions */}
      <div className="text-center py-2 font-bold">
        Terms & Conditions
      </div>

    </div>
  );
};

export default InfinityMasterInvoiceForm;
