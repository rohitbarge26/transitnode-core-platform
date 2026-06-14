import React from 'react';

const SalarySlipTemplate = ({ data }) => {
  if (!data) return null;

  const {
    employeeName,
    employeeId,
    role,
    paymentMonth,
    baseSalary,
    totalAdvances,
    netPay,
    status,
    paidAt
  } = data;

  const dateStr = paidAt ? new Date(paidAt).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>
      <div className="bg-white text-black p-8 font-sans w-full max-w-5xl mx-auto border border-gray-200 print:border-none print:shadow-none">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-gray-800 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tighter">TransitNode Logistics</h1>
          <p className="text-gray-600 mt-1">123 Transport Hub, Mumbai, MH 400001</p>
          <p className="text-gray-600">GSTIN: 27AADCP8383C1Z5 | Phone: +91 9876543210</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest">SALARY SLIP</h2>
          <p className="text-gray-600 font-mono mt-1 text-lg">Month: {paymentMonth}</p>
        </div>
      </div>

      {/* Employee Details */}
      <div className="flex justify-between mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="space-y-2">
          <p><span className="text-gray-500 font-semibold w-32 inline-block">Employee Name:</span> <span className="font-bold text-lg">{employeeName}</span></p>
          <p><span className="text-gray-500 font-semibold w-32 inline-block">Employee ID:</span> <span className="font-mono">{employeeId.substring(0, 8).toUpperCase()}</span></p>
          <p><span className="text-gray-500 font-semibold w-32 inline-block">Designation:</span> <span className="font-semibold">{role}</span></p>
        </div>
        <div className="space-y-2 text-right">
          <p><span className="text-gray-500 font-semibold mr-2">Status:</span> <span className={`font-bold ${status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>{status}</span></p>
          <p><span className="text-gray-500 font-semibold mr-2">Payment Date:</span> <span className="font-mono">{dateStr}</span></p>
        </div>
      </div>

      {/* Salary Breakdown Table */}
      <div className="mb-10">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="py-3 px-4 text-left border border-gray-300">Earnings</th>
              <th className="py-3 px-4 text-right border border-gray-300 w-1/4">Amount (₹)</th>
              <th className="py-3 px-4 text-left border border-gray-300">Deductions</th>
              <th className="py-3 px-4 text-right border border-gray-300 w-1/4">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-4 px-4 border border-gray-300">Base Salary</td>
              <td className="py-4 px-4 border border-gray-300 text-right font-mono">{baseSalary.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td className="py-4 px-4 border border-gray-300">Driver Advances & Expenses</td>
              <td className="py-4 px-4 border border-gray-300 text-right font-mono text-red-600">{totalAdvances.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td className="py-4 px-4 border border-gray-300 text-gray-400 italic">Incentives / Overtime</td>
              <td className="py-4 px-4 border border-gray-300 text-right font-mono text-gray-400">0.00</td>
              <td className="py-4 px-4 border border-gray-300 text-gray-400 italic">TDS / Other Deductions</td>
              <td className="py-4 px-4 border border-gray-300 text-right font-mono text-gray-400">0.00</td>
            </tr>
            <tr className="bg-gray-50 font-bold">
              <td className="py-3 px-4 border border-gray-300 text-right">Gross Earnings:</td>
              <td className="py-3 px-4 border border-gray-300 text-right font-mono">{baseSalary.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td className="py-3 px-4 border border-gray-300 text-right">Total Deductions:</td>
              <td className="py-3 px-4 border border-gray-300 text-right font-mono text-red-600">{totalAdvances.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Pay Calculation */}
      <div className="flex justify-end mb-16">
        <div className="w-1/2 border-2 border-gray-800 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-gray-800">NET PAYABLE:</span>
            <span className="text-3xl font-black font-mono text-gray-900">₹ {netPay.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-20 flex justify-between items-end px-8">
        <div className="text-center">
          <div className="w-48 border-b border-gray-400 mb-2"></div>
          <p className="text-gray-600 font-semibold">Employee Signature</p>
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-gray-400 mb-2"></div>
          <p className="text-gray-600 font-semibold">Authorized Signatory</p>
          <p className="text-gray-400 text-sm">TransitNode Logistics</p>
        </div>
      </div>
      
      <div className="mt-16 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        This is a system generated document and does not require a physical signature if transmitted electronically.
      </div>

      </div>
    </>
  );
};

export default SalarySlipTemplate;
