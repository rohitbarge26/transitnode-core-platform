import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FlipkartMisEntry = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sourceHubName: '',
    companyName: '',
    vehicleNumber: '',
    vehicleType: '14-Ft Container',
    parentVehicleNumber: '',
    vehicleOwnershipType: 'Owned',
    driverType: 'Regular',
    inTime: '',
    outTime: '',
    manualStartOdometer: '',
    manualEndOdometer: '',
    movementType: 'Line Haul',
    zone: '',
    businessEntity: 'Flipkart India Private Limited',
    vendorName: ''
  });

  // Derived / calculated values
  const [workingHours, setWorkingHours] = useState('00:00');
  const [transitTime, setTransitTime] = useState('0.00');
  const [distance, setDistance] = useState('0.000');

  useEffect(() => {
    // Calculate transit time and working hours
    if (formData.inTime && formData.outTime) {
      const inDate = new Date(formData.inTime);
      const outDate = new Date(formData.outTime);
      const diffMs = outDate - inDate;

      if (diffMs >= 0) {
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        setWorkingHours(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
        setTransitTime((diffMs / (1000 * 60 * 60)).toFixed(2));
      } else {
        setWorkingHours('00:00');
        setTransitTime('0.00');
      }
    } else {
      setWorkingHours('00:00');
      setTransitTime('0.00');
    }
  }, [formData.inTime, formData.outTime]);

  useEffect(() => {
    // Calculate distance
    const start = parseInt(formData.manualStartOdometer, 10);
    const end = parseInt(formData.manualEndOdometer, 10);

    if (!isNaN(start) && !isNaN(end) && end >= start) {
      setDistance(((end - start) / 1000).toFixed(3));
    } else {
      setDistance('0.000');
    }
  }, [formData.manualStartOdometer, formData.manualEndOdometer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'vehicleNumber' ? value.toUpperCase().trim() : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Extra validations
    const inDate = new Date(formData.inTime);
    const outDate = new Date(formData.outTime);
    if (outDate < inDate) {
      setError('Out Time must be after or equal to In Time.');
      setLoading(false);
      return;
    }

    const startOdo = parseInt(formData.manualStartOdometer, 10);
    const endOdo = parseInt(formData.manualEndOdometer, 10);
    if (endOdo < startOdo) {
      setError('End Odometer must be greater than or equal to Start Odometer.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/flipkart-mis', formData);
      setSuccess('Flipkart MIS record created successfully!');
      
      // Reset form (keep static selections)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        sourceHubName: '',
        companyName: '',
        vehicleNumber: '',
        vehicleType: '14-Ft Container',
        parentVehicleNumber: '',
        vehicleOwnershipType: 'Owned',
        driverType: 'Regular',
        inTime: '',
        outTime: '',
        manualStartOdometer: '',
        manualEndOdometer: '',
        movementType: 'Line Haul',
        zone: '',
        businessEntity: 'Flipkart India Private Limited',
        vendorName: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit record.');
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
    <div className="w-full max-w-4xl mx-auto mt-6 animate-fade-in pb-6 sm:pb-8 md:pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
          Flipkart MIS Data Entry
        </h1>
        <p className="text-gray-400 mt-2">Log individual trip details for Flipkart MIS reporting.</p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-[#111827] border border-gray-700 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl">
          
          {error && (
            <div className="bg-red-500 bg-opacity-10 border-l-4 border-red-500 text-red-400 p-4 rounded mb-6">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500 bg-opacity-10 border-l-4 border-green-500 text-green-400 p-4 rounded mb-6">
              <p className="font-bold">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* General Trip Info */}
            <div className="bg-gray-800 bg-opacity-20 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700/50 space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest border-b border-gray-700 pb-2">1. General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} required 
                    className={inputClasses('date')} onFocus={() => setFocusedField('date')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Source Hub Name</label>
                  <input type="text" name="sourceHubName" value={formData.sourceHubName} onChange={handleChange} required placeholder="e.g. WMLR" 
                    className={inputClasses('sourceHubName')} onFocus={() => setFocusedField('sourceHubName')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Company Name</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required placeholder="e.g. TransitNode" 
                    className={inputClasses('companyName')} onFocus={() => setFocusedField('companyName')} onBlur={() => setFocusedField(null)} />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="bg-gray-800 bg-opacity-20 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700/50 space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest border-b border-gray-700 pb-2">2. Vehicle & Driver Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Vehicle Number</label>
                  <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required placeholder="e.g. MH12AB1234" 
                    className={inputClasses('vehicleNumber')} onFocus={() => setFocusedField('vehicleNumber')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Vehicle Type</label>
                  <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} required 
                    className={inputClasses('vehicleType')} onFocus={() => setFocusedField('vehicleType')} onBlur={() => setFocusedField(null)}>
                    <option value="14-Ft Container">14-Ft Container</option>
                    <option value="19-Ft Container">19-Ft Container</option>
                    <option value="20-Ft Container">20-Ft Container</option>
                    <option value="32-Ft Single Axle">32-Ft Single Axle</option>
                    <option value="32-Ft Multi Axle">32-Ft Multi Axle</option>
                    <option value="Pickup / Tata Ace">Pickup / Tata Ace</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Parent Vehicle Number (Optional)</label>
                  <input type="text" name="parentVehicleNumber" value={formData.parentVehicleNumber} onChange={handleChange} placeholder="e.g. MH12AB5678" 
                    className={inputClasses('parentVehicleNumber')} onFocus={() => setFocusedField('parentVehicleNumber')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Vehicle Ownership Type</label>
                  <select name="vehicleOwnershipType" value={formData.vehicleOwnershipType} onChange={handleChange} required 
                    className={inputClasses('vehicleOwnershipType')} onFocus={() => setFocusedField('vehicleOwnershipType')} onBlur={() => setFocusedField(null)}>
                    <option value="Market">Market</option>
                    <option value="Attached">Attached</option>
                    <option value="Owned">Owned</option>
                  </select>
                </div>
                <div className="relative md:col-span-2">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Driver Type</label>
                  <select name="driverType" value={formData.driverType} onChange={handleChange} required 
                    className={inputClasses('driverType')} onFocus={() => setFocusedField('driverType')} onBlur={() => setFocusedField(null)}>
                    <option value="Regular">Regular</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Ad-hoc">Ad-hoc</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Time & Odometer calculations */}
            <div className="bg-gray-800 bg-opacity-20 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700/50 space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest border-b border-gray-700 pb-2">3. Time & Distance Calculations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">In Time</label>
                  <input type="datetime-local" name="inTime" value={formData.inTime} onChange={handleChange} required 
                    className={inputClasses('inTime')} onFocus={() => setFocusedField('inTime')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Out Time</label>
                  <input type="datetime-local" name="outTime" value={formData.outTime} onChange={handleChange} required 
                    className={inputClasses('outTime')} onFocus={() => setFocusedField('outTime')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative bg-[#0B0E14] border border-gray-800 px-4 py-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold">Working Hours (HH:MM)</span>
                  <span className="text-cyan-400 font-mono font-bold">{workingHours}</span>
                </div>
                <div className="relative bg-[#0B0E14] border border-gray-800 px-4 py-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold">Actual Transit Time (Hours)</span>
                  <span className="text-cyan-400 font-mono font-bold">{transitTime} hr</span>
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Manual Start Odometer (meters)</label>
                  <input type="number" name="manualStartOdometer" value={formData.manualStartOdometer} onChange={handleChange} required placeholder="e.g. 100000" 
                    className={inputClasses('manualStartOdometer')} onFocus={() => setFocusedField('manualStartOdometer')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Manual End Odometer (meters)</label>
                  <input type="number" name="manualEndOdometer" value={formData.manualEndOdometer} onChange={handleChange} required placeholder="e.g. 150000" 
                    className={inputClasses('manualEndOdometer')} onFocus={() => setFocusedField('manualEndOdometer')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative md:col-span-2 bg-[#0B0E14] border border-gray-800 px-4 py-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold">Manual Distance Travelled (Calculated)</span>
                  <span className="text-purple-400 font-mono font-bold">{distance} KM</span>
                </div>
              </div>
            </div>

            {/* Movement & Entity */}
            <div className="bg-gray-800 bg-opacity-20 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700/50 space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest border-b border-gray-700 pb-2">4. Movement & Business Entity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Movement Type</label>
                  <select name="movementType" value={formData.movementType} onChange={handleChange} required 
                    className={inputClasses('movementType')} onFocus={() => setFocusedField('movementType')} onBlur={() => setFocusedField(null)}>
                    <option value="Line Haul">Line Haul</option>
                    <option value="Local Run">Local Run</option>
                    <option value="Intra-Zone">Intra-Zone</option>
                    <option value="Inter-Zone">Inter-Zone</option>
                    <option value="Ad-hoc">Ad-hoc</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Zone</label>
                  <input type="text" name="zone" value={formData.zone} onChange={handleChange} required placeholder="e.g. West" 
                    className={inputClasses('zone')} onFocus={() => setFocusedField('zone')} onBlur={() => setFocusedField(null)} />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Business Entity</label>
                  <select name="businessEntity" value={formData.businessEntity} onChange={handleChange} required 
                    className={inputClasses('businessEntity')} onFocus={() => setFocusedField('businessEntity')} onBlur={() => setFocusedField(null)}>
                    <option value="Flipkart India Private Limited">Flipkart India Private Limited</option>
                    <option value="Flipkart Internet Private Limited">Flipkart Internet Private Limited</option>
                    <option value="Instakart Services Private Limited">Instakart Services Private Limited</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-[#111827] px-2 text-[10px] font-bold text-purple-400">Vendor (Purchase) Name</label>
                  <input type="text" name="vendorName" value={formData.vendorName} onChange={handleChange} required placeholder="e.g. Vendor Corp" 
                    className={inputClasses('vendorName')} onFocus={() => setFocusedField('vendorName')} onBlur={() => setFocusedField(null)} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Submitting Record...' : 'Submit Flipkart MIS Record'}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default FlipkartMisEntry;
