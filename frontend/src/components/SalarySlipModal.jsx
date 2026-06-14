import React from 'react';
import { createPortal } from 'react-dom';
import SalarySlipTemplate from './SalarySlipTemplate';

const SalarySlipModal = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 print:static print:p-0 print:block print:bg-transparent">
      {/* Modal Container */}
      <div className="bg-gray-100 text-black rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col relative print:static print:overflow-visible print:max-w-none print:shadow-none print:w-full print:bg-white">
        
        {/* Header - Not printed */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white print:hidden">
          <h2 className="text-xl font-bold text-gray-800">Print Salary Slip</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 print:p-0 print:overflow-visible print:bg-white">
          {/* UI PREVIEW - Visible on screen, hidden during print */}
          <div className="bg-white shadow-md mx-auto max-w-full overflow-hidden print:hidden" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
            <SalarySlipTemplate data={record} />
          </div>
        </div>

        {/* PRINT PORTAL - Hidden on screen, portaled to document body for perfect print isolation */}
        {createPortal(
          <div id="printable-salary-slip" className="hidden print:block absolute inset-0 bg-white printable-portal">
            <SalarySlipTemplate data={record} />
          </div>,
          document.body
        )}

        {/* Footer Actions - Not printed */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-4 print:hidden shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              const originalTitle = document.title;
              document.title = `SalarySlip_${record.employeeName.replace(/\s+/g, '_')}_${record.paymentMonth}_${Date.now()}`;
              window.print();
              document.title = originalTitle;
            }}
            className="px-6 py-2 bg-[#00a651] text-white rounded-md hover:bg-[#008f45] font-bold shadow-md hover:shadow-lg transition-all"
          >
            Print Salary Slip
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalarySlipModal;
