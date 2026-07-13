import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FlipkartMisAccountant = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/flipkart-mis');
      setRecords(res.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch Flipkart MIS records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/flipkart-mis/export', {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Flipkart_MIS_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export Flipkart MIS Excel file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    'Date',
    'Source Hub Name',
    'Company Name',
    'Vehicle Number',
    'Vehicle Type',
    'Parent Vehicle Number',
    'Vehicle Ownership Type',
    'Driver Type',
    'In Time',
    'Out Time',
    'Working Hours (HH:MM)',
    'Actual Transit Time (In Hours)',
    'Manual Start Odometer (in meters)',
    'Manual End Odometer (in meters)',
    'Manual Distance Travelled (in KM)',
    'Movement Type',
    'Zone',
    'Business Entity',
    'Vendor (Purchae) Name'
  ];

  return (
    <div className="w-full mt-6 animate-fade-in pb-6 sm:pb-8 md:pb-12">
      {/* Header Panel */}
      <div className="glass-panel p-3 sm:p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Flipkart MIS Portal</h2>
          <p className="text-gray-400 text-sm mt-1">Review operational log history and export structured MIS report documents.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || records.length === 0}
          className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900 font-bold px-3 sm:px-4 md:px-6 py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'Generating Excel...' : 'Export Flipkart MIS Excel File'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-10 border-l-4 border-red-500 text-red-400 p-4 rounded-xl mb-6">
          <p className="font-bold">Error Loading Records</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Grid Table Container */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-15 transition duration-1000"></div>
        <div className="relative bg-[#111827] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-400 text-sm">Fetching operational records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center">
              <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-base">No Flipkart MIS records found.</p>
              <p className="text-gray-500 text-xs mt-1">Operational data entry logs will appear here once submitted by operators.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-gray-800/80 border-b border-gray-700 text-gray-300 font-bold uppercase tracking-wider">
                    <th className="p-3 text-center border-r border-gray-700 min-w-[50px]">#</th>
                    {columns.map((col, idx) => (
                      <th key={idx} className="p-3 border-r border-gray-700 whitespace-nowrap min-w-[150px]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {records.map((rec, rIdx) => (
                    <tr key={rec._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-3 text-center font-mono border-r border-gray-800 text-gray-500">{rIdx + 1}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.date ? new Date(rec.date).toISOString().split('T')[0] : ''}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.sourceHubName}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.companyName}</td>
                      <td className="p-3 border-r border-gray-800 font-mono font-bold text-cyan-400 whitespace-nowrap">{rec.vehicleNumber}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.vehicleType}</td>
                      <td className="p-3 border-r border-gray-800 font-mono whitespace-nowrap">{rec.parentVehicleNumber || '-'}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.vehicleOwnershipType === 'Owned' ? 'bg-green-500/20 text-green-400' :
                          rec.vehicleOwnershipType === 'Attached' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {rec.vehicleOwnershipType}
                        </span>
                      </td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.driverType}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.inTime ? new Date(rec.inTime).toLocaleString() : ''}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.outTime ? new Date(rec.outTime).toLocaleString() : ''}</td>
                      <td className="p-3 border-r border-gray-800 font-mono text-cyan-400 whitespace-nowrap">{rec.workingHours}</td>
                      <td className="p-3 border-r border-gray-800 font-mono text-right whitespace-nowrap">{rec.actualTransitTime.toFixed(2)} hr</td>
                      <td className="p-3 border-r border-gray-800 font-mono text-right whitespace-nowrap">{rec.manualStartOdometer.toLocaleString()} m</td>
                      <td className="p-3 border-r border-gray-800 font-mono text-right whitespace-nowrap">{rec.manualEndOdometer.toLocaleString()} m</td>
                      <td className="p-3 border-r border-gray-800 font-mono text-right text-purple-400 whitespace-nowrap">{rec.manualDistanceTravelled.toFixed(3)} KM</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.movementType}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.zone}</td>
                      <td className="p-3 border-r border-gray-800 whitespace-nowrap">{rec.businessEntity}</td>
                      <td className="p-3 whitespace-nowrap">{rec.vendorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipkartMisAccountant;
