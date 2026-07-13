import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LorryReceiptModal from '../../components/LorryReceiptModal';

const IntakeDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentShipments, setRecentShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [generatedShipment, setGeneratedShipment] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [formData, setFormData] = useState({
    senderName: '', senderPhone: '',
    senderAddress: '', senderGstin: '', senderPostalCode: '', senderDropOff: false,
    receiverName: '', receiverPhone: '',
    receiverAddress: '', receiverGstin: '', receiverPostalCode: '', receiverSelfCollect: false, receiverClientCode: '',
    vehicleNumber: '', vehicleType: '14-Ft Container',
    driverName: '', driverPhone: '',
    origin: '', destination: '',
    commodityType: '',
    actualWeight: '', chargedWeight: '',
    dimensions: '', packingType: 'BOX', fragile: false,
    invoiceNo: '', invoiceDate: new Date().toISOString().split('T')[0], invoiceValue: '', ewayBillNo: '',
    riskCoverage: 'OWNERS'
  });

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [exceptionForm, setExceptionForm] = useState({ issueType: 'BREAKDOWN', description: '' });
  const [uploadingLr, setUploadingLr] = useState(false);
  const [viewingLrShipment, setViewingLrShipment] = useState(null);

  const isFlipkartSelected = formData.receiverName && (
    formData.receiverName.toLowerCase().includes('flipkart') ||
    formData.receiverName.toLowerCase().includes('fliptkart')
  );

  useEffect(() => {
    fetchRecentShipments();
    fetchDrivers();
    fetchFleet();
    fetchSuppliers();
    fetchWorkspaces();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateLrOnline = async (trackingId) => {
    setUploadingLr(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/shipments/${trackingId}/generate-lr`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchRecentShipments();
      setSelectedShipment(response.data.shipment);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to generate online Lorry Receipt.');
    } finally {
      setUploadingLr(false);
    }
  };

  const handleUploadLr = async (trackingId, file) => {
    if (!file) return;
    setUploadingLr(true);
    setError('');
    
    const uploadData = new FormData();
    uploadData.append('lrCopy', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/shipments/${trackingId}/upload-lr`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchRecentShipments();
      setSelectedShipment(response.data.shipment);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload Lorry Receipt copy.');
    } finally {
      setUploadingLr(false);
    }
  };

  const handleLogException = async (trackingId) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/shipments/${trackingId}/log-exception`, exceptionForm, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setExceptionForm({ issueType: 'BREAKDOWN', description: '' });
      await fetchRecentShipments();
      setSelectedShipment(response.data.shipment);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to log exception ticket.');
    }
  };

  const handleResolveException = async (trackingId, exceptionId) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/shipments/${trackingId}/resolve-exception/${exceptionId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchRecentShipments();
      setSelectedShipment(response.data.shipment);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to resolve exception ticket.');
    }
  };

  const handleExportCSV = () => {
    if (recentShipments.length === 0) return;
    const headers = [
      'Tracking Number', 'Status', 'Sender Name', 'Sender Phone', 
      'Receiver Name', 'Receiver Phone', 'Origin', 'Destination', 
      'Vehicle Number', 'Vehicle Type', 'Driver Name', 'Driver Phone', 
      'Commodity Description', 'Base Rate (INR)', 'POD Status'
    ];
    const rows = recentShipments.map(ship => [
      ship.trackingNumber,
      ship.status,
      ship.logistics?.sender?.name || '',
      ship.logistics?.sender?.phone || '',
      ship.logistics?.receiver?.name || '',
      ship.logistics?.receiver?.phone || '',
      ship.logistics?.transport?.origin || '',
      ship.logistics?.transport?.destination || '',
      ship.logistics?.transport?.vehicleNumber || '',
      ship.logistics?.transport?.vehicleType || '',
      ship.logistics?.transport?.driverName || '',
      ship.logistics?.transport?.driverPhone || '',
      ship.logistics?.transport?.commodityType || '',
      ship.accounting?.baseRateApplied || 0,
      ship.podStatus || 'PENDING'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_manifest_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchRecentShipments = async () => {
    try {
      const response = await axios.get('/api/shipments');
      setRecentShipments(response.data.shipments || []);
    } catch (err) {
      console.error("Error fetching shipments", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/transports/drivers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDrivers(response.data.drivers || []);
    } catch (err) {
      console.error("Error fetching drivers", err);
    }
  };

  const fetchFleet = async () => {
    try {
      const response = await axios.get('/api/transports/fleet', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Filter vehicles that are 'YARD' (idle and ready for dispatch)
      setFleet(response.data.fleet?.filter(v => v.status === 'YARD') || []);
    } catch (err) {
      console.error("Error fetching fleet", err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/admin/suppliers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuppliers(response.data || []);
    } catch (err) {
      console.error("Error fetching suppliers", err);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get('/api/companies/my-workspaces', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWorkspaces(response.data.workspaces || []);
    } catch (err) {
      console.error("Error fetching workspaces", err);
    }
  };

  const handleDriverSelection = (e) => {
    const selectedDriverId = e.target.value;
    if (!selectedDriverId) {
      setFormData({
        ...formData,
        driverName: '',
        driverPhone: '',
        vehicleNumber: '',
        vehicleType: '14-Ft Container'
      });
      return;
    }
    const selectedDriver = drivers.find(d => d._id === selectedDriverId);
    if (selectedDriver) {
      const assignedVehicle = selectedDriver.assignedVehicle;
      const vehicleObj = fleet.find(f => f.vehicleRegistration === assignedVehicle);
      
      setFormData({
        ...formData,
        driverName: selectedDriver.name,
        driverPhone: selectedDriver.phone || '',
        vehicleNumber: assignedVehicle || formData.vehicleNumber,
        vehicleType: vehicleObj ? vehicleObj.vehicleType : formData.vehicleType
      });
    }
  };

  const handleVehicleSelection = (e) => {
    const selectedVehicleReg = e.target.value;
    if (!selectedVehicleReg) {
      setFormData({
        ...formData,
        vehicleNumber: '',
        vehicleType: '14-Ft Container',
        driverName: '',
        driverPhone: ''
      });
      return;
    }
    const selectedVehicle = fleet.find(f => f.vehicleRegistration === selectedVehicleReg);
    if (selectedVehicle) {
      // Find if this vehicle is assigned to a driver
      const assignedDriver = drivers.find(d => d.assignedVehicle === selectedVehicleReg || d.phone === selectedVehicle.driverPhone);
      
      setFormData({
        ...formData,
        vehicleNumber: selectedVehicleReg,
        vehicleType: selectedVehicle.vehicleType || '14-Ft Container',
        driverName: assignedDriver ? assignedDriver.name : (selectedVehicle.driverName || ''),
        driverPhone: assignedDriver ? assignedDriver.phone : (selectedVehicle.driverPhone || '')
      });
    }
  };

  const formatVehicleNumber = (val) => {
    let clean = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length === 0) return '';
    let res = clean.substring(0, 2);
    if (clean.length > 2) res += ' ' + clean.substring(2, 4);
    if (clean.length > 4) {
      let remaining = clean.substring(4);
      let letters = '';
      let numbers = '';
      for(let i=0; i<remaining.length; i++) {
        if (/[A-Z]/.test(remaining[i]) && numbers.length === 0) {
          letters += remaining[i];
        } else if (/[0-9]/.test(remaining[i])) {
          numbers += remaining[i];
        }
      }
      if (letters.length > 0) res += ' ' + letters.substring(0, 3);
      if (numbers.length > 0) res += ' ' + numbers.substring(0, 4);
    }
    return res;
  };

  const handleSenderSelection = (e) => {
    const name = e.target.value;
    const workspace = workspaces.find(w => w.companyName === name);
    
    let extractedPostalCode = '400703';
    if (workspace && workspace.address) {
      const match = workspace.address.match(/\b\d{6}\b/);
      if (match) {
        extractedPostalCode = match[0];
      }
    }

    setFormData(prev => ({
      ...prev,
      senderName: name,
      senderPhone: workspace ? workspace.contactNumber || '' : prev.senderPhone,
      senderAddress: workspace ? workspace.address || '' : prev.senderAddress,
      senderGstin: workspace ? workspace.gstin || '' : prev.senderGstin,
      senderPostalCode: workspace ? workspace.postalCode || extractedPostalCode : prev.senderPostalCode
    }));
  };

  const handleReceiverSelection = (e) => {
    const name = e.target.value;
    const supplier = suppliers.find(s => s.supplierName === name);

    let extractedPostalCode = '380001';
    if (supplier && supplier.address) {
      const match = supplier.address.match(/\b\d{6}\b/);
      if (match) {
        extractedPostalCode = match[0];
      }
    }

    setFormData(prev => ({
      ...prev,
      receiverName: name,
      receiverPhone: supplier ? supplier.contactNumber || '' : prev.receiverPhone,
      receiverAddress: supplier ? supplier.address || '' : prev.receiverAddress,
      receiverGstin: supplier ? supplier.gstin || '' : prev.receiverGstin,
      receiverPostalCode: supplier ? supplier.postalCode || extractedPostalCode : prev.receiverPostalCode
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (name === 'vehicleNumber') {
      val = formatVehicleNumber(value);
    }
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isFlipkartSelected && !formData.receiverClientCode?.trim()) {
      setError('Store Code is required when Flipkart is selected as the supplier.');
      setLoading(false);
      return;
    }

    try {
      const selectedWorkspace = workspaces.find(w => w.companyName === formData.senderName);
      const workspaceId = selectedWorkspace ? selectedWorkspace._id : 'MAIN';

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/shipments/create', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': workspaceId
        }
      });
      
      setGeneratedShipment(response.data.shipment);
      setFormData({
        senderName: '', senderPhone: '',
        senderAddress: '', senderGstin: '', senderPostalCode: '', senderDropOff: false,
        receiverName: '', receiverPhone: '',
        receiverAddress: '', receiverGstin: '', receiverPostalCode: '', receiverSelfCollect: false, receiverClientCode: '',
        vehicleNumber: '', vehicleType: '14-Ft Container',
        driverName: '', driverPhone: '',
        origin: '', destination: '',
        commodityType: '',
        actualWeight: '', chargedWeight: '',
        dimensions: '', packingType: 'BOX', fragile: false,
        invoiceNo: '', invoiceDate: new Date().toISOString().split('T')[0], invoiceValue: '', ewayBillNo: '',
        riskCoverage: 'OWNERS'
      });
      fetchRecentShipments();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = (fieldName) => `
    w-full bg-[#0B0E14] border-2 rounded-xl px-4 py-3 text-white transition-all duration-300
    ${focusedField === fieldName ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-gray-700 hover:border-gray-500'}
    focus:outline-none
  `;

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 animate-fade-in pb-6 sm:pb-8 md:pb-12">
      
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
            Intake Terminal
          </h1>
          <p className="text-gray-400 mt-2">Log new shipments and generate instant tracking labels.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="hidden md:flex items-center gap-2 bg-gray-900 bg-opacity-50 px-4 py-2 rounded-full border border-gray-800">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">System Online</span>
          </div>
          <div className="text-right bg-[#111827] border border-gray-700 px-4 py-2 rounded-xl shadow-lg">
            <p className="text-cyan-400 font-mono font-bold text-lg tracking-widest">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dynamic Intake Form */}
        <div className="lg:col-span-2 relative group">
          {/* Glowing background effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative bg-[#111827] border border-gray-700 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl">
            {error && (
              <div className="bg-red-500 bg-opacity-10 border-l-4 border-red-500 text-red-400 p-4 rounded mb-8 animate-slide-in">
                <p className="font-bold">Transmission Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sender Section */}
                <div className="space-y-4 bg-gray-800 bg-opacity-30 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700/50 hover:bg-opacity-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-cyan-500 bg-opacity-20 rounded-md text-cyan-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Consignor (Sender)</h3>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-cyan-400">Branch / Company Name</label>
                    <select name="senderName" value={formData.senderName} onChange={handleSenderSelection} required 
                      className={inputClasses('senderName')} onFocus={() => setFocusedField('senderName')} onBlur={() => setFocusedField(null)}>
                      <option value="">-- Select Branch --</option>
                      {workspaces.map(w => (
                        <option key={w._id} value={w.companyName}>{w.companyName} {w.state ? `(${w.state})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-cyan-400">Address</label>
                    <input type="text" name="senderAddress" value={formData.senderAddress} onChange={handleChange} required 
                      className={inputClasses('senderAddress')} onFocus={() => setFocusedField('senderAddress')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-cyan-400">GST No. (Optional)</label>
                      <input type="text" name="senderGstin" value={formData.senderGstin} onChange={handleChange} 
                        className={inputClasses('senderGstin')} onFocus={() => setFocusedField('senderGstin')} onBlur={() => setFocusedField(null)} />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-cyan-400">Postal Code</label>
                      <input type="text" name="senderPostalCode" value={formData.senderPostalCode} onChange={handleChange} required 
                        className={inputClasses('senderPostalCode')} onFocus={() => setFocusedField('senderPostalCode')} onBlur={() => setFocusedField(null)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="senderDropOff" name="senderDropOff" checked={formData.senderDropOff} onChange={handleChange} className="w-4 h-4 accent-cyan-400 cursor-pointer" />
                    <label htmlFor="senderDropOff" className="text-xs text-gray-300 font-bold select-none cursor-pointer">Drop-off Cargo</label>
                  </div>
                </div>

                {/* Receiver Section */}
                <div className="space-y-4 bg-gray-800 bg-opacity-30 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700/50 hover:bg-opacity-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-purple-500 bg-opacity-20 rounded-md text-purple-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Consignee (Receiver)</h3>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Supplier Name</label>
                    <select name="receiverName" value={formData.receiverName} onChange={handleReceiverSelection} required 
                      className={inputClasses('receiverName')} onFocus={() => setFocusedField('receiverName')} onBlur={() => setFocusedField(null)}>
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s.supplierName}>{s.supplierName} {s.state ? `(${s.state})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Address</label>
                    <input type="text" name="receiverAddress" value={formData.receiverAddress} onChange={handleChange} required 
                      className={inputClasses('receiverAddress')} onFocus={() => setFocusedField('receiverAddress')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">GST No. (Optional)</label>
                      <input type="text" name="receiverGstin" value={formData.receiverGstin} onChange={handleChange} 
                        className={inputClasses('receiverGstin')} onFocus={() => setFocusedField('receiverGstin')} onBlur={() => setFocusedField(null)} />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Postal Code</label>
                      <input type="text" name="receiverPostalCode" value={formData.receiverPostalCode} onChange={handleChange} required 
                        className={inputClasses('receiverPostalCode')} onFocus={() => setFocusedField('receiverPostalCode')} onBlur={() => setFocusedField(null)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Receiver Phone / Gate Contact</label>
                      <input type="text" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} required 
                        className={inputClasses('receiverPhone')} onFocus={() => setFocusedField('receiverPhone')} onBlur={() => setFocusedField(null)} placeholder="e.g. 9876543210" />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[8px] font-bold text-purple-400">
                        Client / Store Code {isFlipkartSelected && <span className="text-red-500">*</span>}
                      </label>
                      <input type="text" name="receiverClientCode" value={formData.receiverClientCode} onChange={handleChange} 
                        required={isFlipkartSelected}
                        className={inputClasses('receiverClientCode')} onFocus={() => setFocusedField('receiverClientCode')} onBlur={() => setFocusedField(null)} 
                        placeholder={isFlipkartSelected ? "Compulsory for Flipkart" : "Optional"} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="receiverSelfCollect" name="receiverSelfCollect" checked={formData.receiverSelfCollect} onChange={handleChange} className="w-4 h-4 accent-purple-400 cursor-pointer" />
                    <label htmlFor="receiverSelfCollect" className="text-xs text-gray-300 font-bold select-none cursor-pointer">Self Collect</label>
                  </div>
                </div>
              </div>

              {/* Transport Logistics */}
              <div className="bg-gray-800 bg-opacity-30 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700/50 hover:bg-opacity-50 transition-all duration-300">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-1.5 bg-blue-500 bg-opacity-20 rounded-md text-blue-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Transport Logistics</h3>
                  </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-cyan-400">Vehicle Registration Number</label>
                    <select name="vehicleNumber" value={formData.vehicleNumber} onChange={handleVehicleSelection} required 
                      className={inputClasses('vehicleNumber')} onFocus={() => setFocusedField('vehicleNumber')} onBlur={() => setFocusedField(null)}>
                      <option value="">-- Select Available Vehicle --</option>
                      {fleet.map((v) => (
                        <option key={v._id} value={v.vehicleRegistration}>
                          {v.vehicleRegistration}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-cyan-400">Vehicle Type</label>
                    <input 
                      type="text" 
                      list="intake-vehicle-types"
                      name="vehicleType" 
                      value={formData.vehicleType} 
                      onChange={handleChange} 
                      required
                      className={inputClasses('vehicleType')} 
                      onFocus={() => setFocusedField('vehicleType')} 
                      onBlur={() => setFocusedField(null)} 
                      placeholder="Select or type..."
                    />
                    <datalist id="intake-vehicle-types">
                      {[...new Set(['14-Ft Container', '19-Ft Container', '22-Ft Open', 'Pickup', 'Trailer', ...fleet.map(a => a.vehicleType).filter(Boolean)])].map(type => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-blue-400">Driver Name</label>
                    <select 
                      value={drivers.find(d => d.name === formData.driverName)?._id || ''} 
                      onChange={handleDriverSelection} required
                      className={inputClasses('driverSelection')} onFocus={() => setFocusedField('driverSelection')} onBlur={() => setFocusedField(null)}>
                      <option value="">-- Select Driver --</option>
                      {drivers.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-blue-400">Driver Mobile</label>
                    <input type="text" name="driverPhone" value={formData.driverPhone} placeholder="Auto-filled" readOnly 
                      className={`${inputClasses('driverPhone')} opacity-60 cursor-not-allowed`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-purple-400">Origin Terminal / City</label>
                    <input type="text" name="origin" value={formData.origin} onChange={handleChange} required 
                      className={inputClasses('origin')} onFocus={() => setFocusedField('origin')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-purple-400">Destination City</label>
                    <input type="text" name="destination" value={formData.destination} onChange={handleChange} required 
                      className={inputClasses('destination')} onFocus={() => setFocusedField('destination')} onBlur={() => setFocusedField(null)} />
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-pink-400">Type of Goods / Cargo Description (Said to Contain)</label>
                  <textarea name="commodityType" value={formData.commodityType} onChange={handleChange} required rows="2"
                    className={inputClasses('commodityType')} onFocus={() => setFocusedField('commodityType')} onBlur={() => setFocusedField(null)} placeholder="e.g. 50 Boxes of Electronics"></textarea>
                </div>

              </div>

              {/* Cargo & Invoices Specifications Block */}
              <div className="bg-gray-800 bg-opacity-30 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700/50 hover:bg-opacity-50 transition-all duration-300 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-pink-500 bg-opacity-20 rounded-md text-pink-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Weight & Invoices</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-pink-400">Actual Wt. (kg)</label>
                    <input type="number" name="actualWeight" value={formData.actualWeight} onChange={handleChange} required 
                      className={inputClasses('actualWeight')} onFocus={() => setFocusedField('actualWeight')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-pink-400">Charged Wt. (kg)</label>
                    <input type="number" name="chargedWeight" value={formData.chargedWeight} onChange={handleChange} required 
                      className={inputClasses('chargedWeight')} onFocus={() => setFocusedField('chargedWeight')} onBlur={() => setFocusedField(null)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-pink-400">Packing Type</label>
                    <select name="packingType" value={formData.packingType} onChange={handleChange} required 
                      className={inputClasses('packingType')} onFocus={() => setFocusedField('packingType')} onBlur={() => setFocusedField(null)}>
                      <option value="BOX">BOX</option>
                      <option value="CARTON">CARTON</option>
                      <option value="PALLET">PALLET</option>
                      <option value="BAG">BAG</option>
                      <option value="CRATE">CRATE</option>
                      <option value="LOOSE">LOOSE</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-pink-400">Risk Coverage</label>
                    <select name="riskCoverage" value={formData.riskCoverage} onChange={handleChange} required 
                      className={inputClasses('riskCoverage')} onFocus={() => setFocusedField('riskCoverage')} onBlur={() => setFocusedField(null)}>
                      <option value="OWNERS">Owner's Risk</option>
                      <option value="CARRIERS">Carrier's Risk</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="fragile" name="fragile" checked={formData.fragile} onChange={handleChange} className="w-4 h-4 accent-pink-400 cursor-pointer" />
                    <label htmlFor="fragile" className="text-xs text-gray-300 font-bold select-none cursor-pointer">Fragile Cargo</label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-700/30">
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-pink-400">Invoice No.</label>
                    <input type="text" name="invoiceNo" value="(Auto-generated)" disabled 
                      className={`${inputClasses('invoiceNo')} opacity-60 cursor-not-allowed`} />
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-pink-400">Invoice Date</label>
                    <input type="date" name="invoiceDate" value={formData.invoiceDate || new Date().toISOString().split('T')[0]} disabled 
                      className={`${inputClasses('invoiceDate')} opacity-60 cursor-not-allowed`} />
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-pink-400">Invoice Value (INR)</label>
                    <input type="number" name="invoiceValue" value={formData.invoiceValue} onChange={handleChange} required 
                      className={inputClasses('invoiceValue')} onFocus={() => setFocusedField('invoiceValue')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div className="relative">
                    <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-[10px] font-bold text-pink-400">E-way Bill No.</label>
                    <input type="text" name="ewayBillNo" value={formData.ewayBillNo} onChange={handleChange} required 
                      className={inputClasses('ewayBillNo')} onFocus={() => setFocusedField('ewayBillNo')} onBlur={() => setFocusedField(null)} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} 
                className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-black rounded-xl text-white transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 ${loading ? 'bg-gray-600 cursor-wait' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(34,211,238,0.4)]'}`}>
                {loading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing Transmission...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center gap-2">
                    Launch Intake & Generate Manifest
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </span>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Dynamic Sidebar */}
        <div className="flex flex-col max-h-[850px]">
          <div className="bg-[#111827] border border-gray-700 p-3 sm:p-4 md:p-6 rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  Active Manifests
                </h2>
                <span className="bg-gray-800 text-[10px] font-bold text-cyan-400 px-3 py-1 rounded-full mt-1 inline-block">{recentShipments.length} logged</span>
              </div>
              {recentShipments.length > 0 && (
                <button 
                  onClick={handleExportCSV}
                  className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-2 rounded-xl transition"
                >
                  Export CSV
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {recentShipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                  <svg className="w-10 h-10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p>Awaiting transmissions...</p>
                </div>
              ) : (
                recentShipments.map((ship, index) => {
                  const isSelected = selectedShipment?._id === ship._id;
                  const openExceptions = ship.exceptions?.filter(e => e.status === 'OPEN') || [];
                  const hasOpenExceptions = openExceptions.length > 0;

                  return (
                    <div 
                      key={ship._id} 
                      style={{ animationDelay: `${index * 50}ms` }} 
                      onClick={() => setSelectedShipment(isSelected ? null : ship)}
                      className={`bg-gray-800 bg-opacity-40 p-4 rounded-xl border transition-all duration-300 animate-slide-up group cursor-pointer ${
                        isSelected ? 'border-cyan-400 bg-gray-800/80 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-cyan-400 font-black tracking-wider text-sm group-hover:text-cyan-300 transition-colors">{ship.trackingNumber}</span>
                        <div className="flex items-center gap-2">
                          {hasOpenExceptions && (
                            <span className="text-[9px] font-bold tracking-widest bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                              ⚠️ {openExceptions.length} EXP
                            </span>
                          )}
                          <span className="text-[10px] font-bold tracking-widest bg-[#0B0E14] text-gray-300 px-2 py-1 rounded border border-gray-700">{ship.status}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-400">
                          <span className="w-10 font-bold text-gray-500">FROM</span>
                          <span className="truncate text-white">{ship.logistics?.sender?.name}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <span className="w-10 font-bold text-gray-500">TO</span>
                          <span className="truncate text-white">{ship.logistics?.receiver?.name}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <span className="w-10 font-bold text-gray-500">POD</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                            ship.podStatus === 'VERIFIED' ? 'bg-green-500/20 text-green-400' :
                            ship.podStatus === 'COLLECTED' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>{ship.podStatus || 'PENDING'}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4" onClick={(e) => e.stopPropagation()}>
                          {/* Lorry Receipt Digital Generation */}
                          <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Lorry Receipt (LR) POD</h4>
                            {ship.lrCopyUrl ? (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                                  ✓ LR Generated
                                </span>
                                {ship.lrCopyUrl === 'ONLINE' ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingLrShipment(ship)}
                                    className="text-xs text-cyan-400 hover:underline font-bold bg-transparent border-0 cursor-pointer p-0"
                                  >
                                    View Digital LR
                                  </button>
                                ) : (
                                  <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${ship.lrCopyUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline font-bold">
                                    View Uploaded LR
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[10px] text-gray-400">Generate a digital, legally-compliant Lorry Receipt online.</p>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateLrOnline(ship.trackingNumber)}
                                  disabled={uploadingLr}
                                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition duration-300 shadow-md hover:shadow-indigo-500/20 cursor-pointer"
                                >
                                  {uploadingLr ? 'Generating Digital LR...' : 'Generate Digital LR Copy'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Exceptions Logging & History */}
                          <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Exceptions Ledger</h4>
                            
                            {/* Log Exception Form */}
                            <form onSubmit={(e) => { e.preventDefault(); handleLogException(ship.trackingNumber); }} className="space-y-2 mb-3">
                              <div className="flex gap-2">
                                <select 
                                  value={exceptionForm.issueType}
                                  onChange={(e) => setExceptionForm({ ...exceptionForm, issueType: e.target.value })}
                                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white flex-1 focus:outline-none focus:border-cyan-500"
                                >
                                  <option value="BREAKDOWN">Breakdown</option>
                                  <option value="TRAFFIC">Traffic Delay</option>
                                  <option value="WEATHER">Weather Delay</option>
                                  <option value="ACCIDENT">Accident</option>
                                  <option value="OTHER">Other Issue</option>
                                </select>
                                <button type="submit" className="bg-red-900/60 border border-red-700/50 hover:bg-red-800/80 text-red-200 text-xs font-bold px-3 py-1 rounded">
                                  Report
                                </button>
                              </div>
                              <textarea 
                                value={exceptionForm.description}
                                onChange={(e) => setExceptionForm({ ...exceptionForm, description: e.target.value })}
                                placeholder="Describe exception details..."
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                rows="2"
                                required
                              />
                            </form>

                            {/* Exceptions History List */}
                            {ship.exceptions?.length > 0 && (
                              <div className="border-t border-gray-800 pt-2 space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {ship.exceptions.map((exc) => (
                                  <div key={exc._id} className="flex justify-between items-start text-[11px] bg-black/30 p-2 rounded">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${exc.status === 'OPEN' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                                        <span className="font-bold text-gray-300">{exc.issueType}</span>
                                        <span className="text-[9px] text-gray-500">({new Date(exc.reportedAt).toLocaleDateString()})</span>
                                      </div>
                                      <p className="text-gray-400 mt-1 pl-3">{exc.description}</p>
                                    </div>
                                    {exc.status === 'OPEN' && (
                                      <button 
                                        onClick={() => handleResolveException(ship.trackingNumber, exc._id)}
                                        className="bg-green-900/30 hover:bg-green-800/50 text-green-400 border border-green-700/30 text-[9px] font-bold px-1.5 py-0.5 rounded"
                                      >
                                        Resolve
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {generatedShipment && (
        <LorryReceiptModal shipment={generatedShipment} onClose={() => setGeneratedShipment(null)} />
      )}
      {viewingLrShipment && (
        <LorryReceiptModal shipment={viewingLrShipment} onClose={() => setViewingLrShipment(null)} />
      )}
    </div>
  );
};

export default IntakeDashboard;
