import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SalarySlipModal from '../../components/SalarySlipModal';

const AccountantPayroll = () => {
  const getCurrentMonth = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [printData, setPrintData] = useState(null);

  const fetchPayroll = async () => {
    try {
      // Re-using the same payroll endpoint the admin uses
      const res = await axios.get('http://localhost:3000/api/payroll');
      setPayrollData(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch payroll', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handlePrintSlip = (record) => {
    setPrintData(record);
  };

  const filteredData = selectedMonth === 'All' ? payrollData : payrollData.filter(r => r.paymentMonth === selectedMonth);

  const today = new Date();
  const currentMonthStr = getCurrentMonth();
  const isAfter10th = today.getDate() > 10;

  return (
    <div className="mt-8">
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#4ade80]">Payroll & Salary Slips</h3>
            <p className="text-gray-400 text-sm mt-1">Review payroll ledger and generate monthly driver salary slips.</p>
          </div>
          
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-gray-800 border border-white/10 text-white text-sm rounded-lg focus:ring-[#4ade80] focus:border-[#4ade80] block p-2.5"
          >
            <option value="All">All Months</option>
            {[...new Set(payrollData.map(r => r.paymentMonth))].sort().reverse().map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Loading payroll records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700/50 text-gray-400">
                  <th className="py-3 px-4 font-medium">Employee Name</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Month</th>
                  <th className="py-3 px-4 font-medium text-right">Net Pay (₹)</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((record) => (
                    <tr key={record._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{record.employeeName}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">{record.role}</td>
                      <td className="py-3 px-4 text-sm font-mono">{record.paymentMonth}</td>
                      <td className="py-3 px-4 text-right text-[#4ade80] font-mono font-bold">
                        {record.netPay.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${record.status === 'PAID' ? 'bg-[#4ade80]/20 text-[#4ade80]' : 'bg-yellow-500/20 text-yellow-500'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {record.paymentMonth === currentMonthStr && !isAfter10th ? (
                          <span className="text-xs text-gray-500 italic px-2">Unlocks on 11th</span>
                        ) : (
                          <button 
                            onClick={() => handlePrintSlip(record)}
                            className="text-xs bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] border border-[#4ade80]/50 px-3 py-1.5 rounded transition-all duration-300"
                          >
                            Generate Slip
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No payroll records found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Salary Slip Print Preview */}
      {printData && (
        <SalarySlipModal 
          record={printData} 
          onClose={() => setPrintData(null)} 
        />
      )}
    </div>
  );
};

export default AccountantPayroll;
