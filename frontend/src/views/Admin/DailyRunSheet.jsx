import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DailyRunSheet = ({ workspaces = [], suppliers = [] }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sourceHubName: '',
    vendor: '',
    vehicleNumber: '',
    vehicleType: '',
    parentVehicleNumber: '',
    supplier: '',
    vehicleOwnershipType: 'Adhoc',
    driverType: 'Contract',
    startOdometer: '',
    endOdometer: '',
    distanceTravelled: 0,
    movementType: '',
    freight: '',
    dcmCharges: '',
    tollAmt: '',
    totalAmt: 0,
    transport: ''
  });

  const [logs, setLogs] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [exportFileName, setExportFileName] = useState('');
  
  const getMonthYearString = () => {
    const d = new Date();
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${month}${year}-Data`;
  };

  // Fetch run sheets on mount
  useEffect(() => {
    const fetchRunSheets = async () => {
      try {
        const url = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/runsheets`;
        const res = await axios.get(url);
        setLogs(res.data.runSheets || []);
      } catch (error) {
        console.error("Error fetching run sheets:", error);
      }
    };
    fetchRunSheets();
  }, []);

  // Auto-calculate Distance Travelled
  useEffect(() => {
    const start = parseFloat(formData.startOdometer) || 0;
    const end = parseFloat(formData.endOdometer) || 0;
    if (end >= start && end > 0) {
      setFormData(prev => ({ ...prev, distanceTravelled: end - start }));
    } else {
      setFormData(prev => ({ ...prev, distanceTravelled: 0 }));
    }
  }, [formData.startOdometer, formData.endOdometer]);

  // Auto-calculate Total Amount
  useEffect(() => {
    const freight = parseFloat(formData.freight) || 0;
    const dcm = parseFloat(formData.dcmCharges) || 0;
    const toll = parseFloat(formData.tollAmt) || 0;
    setFormData(prev => ({ ...prev, totalAmt: freight + dcm + toll }));
  }, [formData.freight, formData.dcmCharges, formData.tollAmt]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/runsheets`;
      const res = await axios.post(url, formData);
      setLogs(prev => [res.data.runSheet, ...prev]);
      alert('Run sheet entry saved successfully!');
      // Reset form while keeping current date
      setFormData({
        date: formData.date,
        sourceHubName: '',
        vendor: '',
        supplier: '',
        vehicleNumber: '',
        vehicleType: '',
        parentVehicleNumber: '',
        transport: '',
        vehicleOwnershipType: 'Adhoc',
        driverType: 'Contract',
        startOdometer: '',
        endOdometer: '',
        distanceTravelled: 0,
        movementType: '',
        freight: '',
        dcmCharges: '',
        tollAmt: '',
        totalAmt: 0
      });
    } catch (error) {
      console.error("Error saving run sheet:", error);
      alert('Failed to save run sheet entry.');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterStartDate && log.date < filterStartDate) return false;
    if (filterEndDate && log.date > filterEndDate) return false;
    return true;
  });

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      alert("No data to export! Please adjust filters or add entries.");
      return;
    }
    
    const headers = [
      'Date', 'Source Hub Name', 'Client Name', 'Supplier Name', 'Movement Type', 
      'Vehicle Number', 'Vehicle Type', 'Parent Vehicle Number', 'Vendor Name', 
      'Vehicle Ownership', 'Driver Type', 'Start Odo', 'End Odo', 'Distance', 
      'Freight', 'DCM Charges', 'Toll Amt', 'Total Amt'
    ];
    
    const csvRows = [headers.join(',')];
    
    filteredLogs.forEach(log => {
      const row = [
        log.date,
        `"${log.sourceHubName || ''}"`,
        `"${log.vendor || ''}"`,
        `"${log.supplier || ''}"`,
        `"${log.movementType || ''}"`,
        `"${log.vehicleNumber || ''}"`,
        `"${log.vehicleType || ''}"`,
        `"${log.parentVehicleNumber || ''}"`,
        `"${log.transport || ''}"`,
        `"${log.vehicleOwnershipType || ''}"`,
        `"${log.driverType || ''}"`,
        log.startOdometer,
        log.endOdometer,
        log.distanceTravelled,
        log.freight,
        log.dcmCharges,
        log.tollAmt,
        log.totalAmt
      ];
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const finalName = exportFileName.trim() || getMonthYearString();
    a.download = `${finalName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Daily Run Sheets / Trip Logs</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800">New Trip Entry</h3>
          <p className="text-sm text-slate-500 mt-1">Log vehicle movement, odometer readings, and vendor expenses.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Trip & Vehicle Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Trip & Operational Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Hub Name</label>
                <input type="text" name="sourceHubName" required placeholder="e.g. Bhiwandi Hub" value={formData.sourceHubName} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
                <select name="vendor" required value={formData.vendor} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white">
                  <option value="">-- Select Client --</option>
                  {workspaces.map(ws => (
                    <option key={ws._id} value={ws.companyName}>{ws.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name</label>
                <select name="supplier" value={formData.supplier} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white">
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(sup => (
                    <option key={sup._id} value={sup.supplierName}>{sup.supplierName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type</label>
                <input type="text" name="movementType" placeholder="e.g. Linehaul, First Mile" value={formData.movementType} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Number</label>
                <input type="text" name="vehicleNumber" required placeholder="MH04XX1234" value={formData.vehicleNumber} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white uppercase" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type</label>
                <input type="text" name="vehicleType" placeholder="e.g. 20FT, 32FT MXL" value={formData.vehicleType} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Vehicle No (Optional)</label>
                <input type="text" name="parentVehicleNumber" placeholder="If attached" value={formData.parentVehicleNumber} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white uppercase" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Name</label>
                <input type="text" name="transport" placeholder="Vendor Code or Name" value={formData.transport} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Ownership</label>
                <select name="vehicleOwnershipType" value={formData.vehicleOwnershipType} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white">
                  <option value="Adhoc">Adhoc</option>
                  <option value="Regular">Regular</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Type</label>
                <select name="driverType" value={formData.driverType} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-indigo-500 bg-white">
                  <option value="Contract">Contract / Vendor Driver</option>
                  <option value="Payroll">Company Payroll</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 2: Odometer */}
            <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
              <h4 className="text-sm font-bold text-sky-800 uppercase tracking-wider mb-4 border-b border-sky-200 pb-2">Odometer Log</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Odometer (Meters/KM)</label>
                  <input type="number" min="0" name="startOdometer" required placeholder="0" value={formData.startOdometer} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-sky-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Odometer (Meters/KM)</label>
                  <input type="number" min="0" name="endOdometer" required placeholder="0" value={formData.endOdometer} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-sky-500 bg-white" />
                </div>
                <div className="col-span-2 mt-2 bg-sky-100 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-bold text-sky-900">Total Distance Travelled:</span>
                  <span className="text-lg font-black text-sky-700">{formData.distanceTravelled} units</span>
                </div>
              </div>
            </div>

            {/* Section 3: Financials */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4 border-b border-emerald-200 pb-2">Vendor Billing & Charges</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Freight (₹)</label>
                  <input type="number" min="0" name="freight" required placeholder="0" value={formData.freight} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-emerald-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">DCM Charges (₹)</label>
                  <input type="number" min="0" name="dcmCharges" placeholder="0" value={formData.dcmCharges} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-emerald-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Toll Amount (₹)</label>
                  <input type="number" min="0" name="tollAmt" placeholder="0" value={formData.tollAmt} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 text-sm border focus:ring-emerald-500 bg-white" />
                </div>
                <div className="col-span-2 mt-2 bg-emerald-100 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-900">Total Payout Amount:</span>
                  <span className="text-lg font-black text-emerald-700">₹{formData.totalAmt}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md text-sm">
              Save Run Sheet Entry
            </button>
          </div>
        </form>
      </div>

      {/* Recent Logs Table */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6 overflow-hidden mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Recent Entries</h3>
              <p className="text-sm text-slate-500">Showing {filteredLogs.length} of {logs.length} entries</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="border-slate-300 rounded-md p-1.5 text-sm border focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="border-slate-300 rounded-md p-1.5 text-sm border focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Export File Name</label>
                <input type="text" placeholder={getMonthYearString()} value={exportFileName} onChange={e => setExportFileName(e.target.value)} className="border-slate-300 rounded-md p-1.5 text-sm border focus:ring-indigo-500 bg-white w-48" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-transparent mb-1">Export</label>
                <button onClick={handleExport} className="block w-full bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-slate-50 transition shadow-sm">
                  Export Data
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hub</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dist.</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">{log.date}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-900 font-bold">{log.vehicleNumber}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-700">{log.vendor}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-700">{log.transport}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-700">{log.sourceHubName}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-sky-700 font-medium">{log.distanceTravelled}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-emerald-700 font-bold">₹{log.totalAmt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyRunSheet;
