import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ShippingLabelModal from '../../components/ShippingLabelModal';

const IntakeDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentShipments, setRecentShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [generatedShipment, setGeneratedShipment] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [formData, setFormData] = useState({
    senderName: '', senderPhone: '',
    receiverName: '', receiverPhone: '',
    vehicleNumber: '', vehicleType: '14-Ft Container',
    driverName: '', driverPhone: '',
    origin: '', destination: '',
    commodityType: ''
  });

  useEffect(() => {
    fetchRecentShipments();
    fetchDrivers();
    fetchFleet();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'vehicleNumber') {
      formattedValue = formatVehicleNumber(value);
    }
    setFormData({ ...formData, [name]: formattedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/shipments/create', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setGeneratedShipment(response.data.shipment);
      setFormData({
        senderName: '', senderPhone: '',
        receiverName: '', receiverPhone: '',
        vehicleNumber: '', vehicleType: '14-Ft Container',
        driverName: '', driverPhone: '',
        origin: '', destination: '',
        commodityType: ''
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
    <div className="w-full max-w-7xl mx-auto mt-6 animate-fade-in pb-12">
      
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
          
          <div className="relative bg-[#111827] border border-gray-700 p-8 rounded-2xl shadow-2xl">
            {error && (
              <div className="bg-red-500 bg-opacity-10 border-l-4 border-red-500 text-red-400 p-4 rounded mb-8 animate-slide-in">
                <p className="font-bold">Transmission Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sender Section */}
                <div className="space-y-5 bg-gray-800 bg-opacity-30 p-6 rounded-xl border border-gray-700/50 hover:bg-opacity-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-cyan-500 bg-opacity-20 rounded-md text-cyan-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Sender Profile</h3>
                  </div>
                  <div>
                    <input type="text" name="senderName" placeholder="Full Name" value={formData.senderName} onChange={handleChange} required 
                      className={inputClasses('senderName')} onFocus={() => setFocusedField('senderName')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div>
                    <input type="text" name="senderPhone" placeholder="Phone Number" value={formData.senderPhone} onChange={handleChange} required 
                      className={inputClasses('senderPhone')} onFocus={() => setFocusedField('senderPhone')} onBlur={() => setFocusedField(null)} />
                  </div>
                </div>

                {/* Receiver Section */}
                <div className="space-y-5 bg-gray-800 bg-opacity-30 p-6 rounded-xl border border-gray-700/50 hover:bg-opacity-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-purple-500 bg-opacity-20 rounded-md text-purple-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Receiver Profile</h3>
                  </div>
                  <div>
                    <input type="text" name="receiverName" placeholder="Full Name" value={formData.receiverName} onChange={handleChange} required 
                      className={inputClasses('receiverName')} onFocus={() => setFocusedField('receiverName')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div>
                    <input type="text" name="receiverPhone" placeholder="Phone Number" value={formData.receiverPhone} onChange={handleChange} required 
                      className={inputClasses('receiverPhone')} onFocus={() => setFocusedField('receiverPhone')} onBlur={() => setFocusedField(null)} />
                  </div>
                </div>
              </div>

              {/* Transport Logistics */}
              <div className="bg-gray-800 bg-opacity-30 p-6 rounded-xl border border-gray-700/50 hover:bg-opacity-50 transition-all duration-300">
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
                  <label className="absolute -top-3 left-4 bg-[#111827] px-2 text-xs font-bold text-pink-400">Type of Goods / Cargo Description</label>
                  <textarea name="commodityType" value={formData.commodityType} onChange={handleChange} required rows="2"
                    className={inputClasses('commodityType')} onFocus={() => setFocusedField('commodityType')} onBlur={() => setFocusedField(null)}></textarea>
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
          <div className="bg-[#111827] border border-gray-700 p-6 rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                Active Manifests
              </h2>
              <span className="bg-gray-800 text-xs font-bold text-cyan-400 px-3 py-1 rounded-full">{recentShipments.length} logged</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {recentShipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                  <svg className="w-10 h-10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p>Awaiting transmissions...</p>
                </div>
              ) : (
                recentShipments.map((ship, index) => (
                  <div key={ship._id} style={{ animationDelay: `${index * 50}ms` }} className="bg-gray-800 bg-opacity-40 p-4 rounded-xl border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800 transition-all duration-300 animate-slide-up group cursor-default">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-cyan-400 font-black tracking-wider text-sm group-hover:text-cyan-300 transition-colors">{ship.trackingNumber}</span>
                      <span className="text-[10px] font-bold tracking-widest bg-[#0B0E14] text-gray-300 px-2 py-1 rounded border border-gray-700">{ship.status}</span>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {generatedShipment && (
        <ShippingLabelModal shipment={generatedShipment} onClose={() => setGeneratedShipment(null)} />
      )}
    </div>
  );
};

export default IntakeDashboard;
