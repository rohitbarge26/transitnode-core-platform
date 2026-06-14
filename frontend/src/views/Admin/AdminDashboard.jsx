import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import MapView from '../../components/MapView';
import ComplianceVault from './ComplianceVault';
import ShipmentTransactions from './ShipmentTransactions';
import FinancialLedger from './FinancialLedger';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // ANALYTICS, MANAGEMENT, DRIVER_MANAGEMENT, MAP
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [timeRange, setTimeRange] = useState('daily');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    netFleetMargin: 0,
    activeFleet: 0,
    maintenanceFleet: 0
  });
  const [charts, setCharts] = useState({
    revenueOverTime: [],
    statusData: [],
    paymentMethodsData: []
  });
  const [loading, setLoading] = useState(true);

  // Map / Fleet State
  const [vehicles, setVehicles] = useState({});
  const [vehicleHistory, setVehicleHistory] = useState({});
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMapConnected, setIsMapConnected] = useState(false);
  const socketRef = useRef(null);

  // Forms State
  const [userForm, setUserForm] = useState({ name: '', email: '', mobileNumber: '', password: '', role: 'RECEPTIONIST' });
  const [rateForm, setRateForm] = useState({ basePricePerKg: '', volumetricDivisor: '', fuelSurchargeRate: '' });
  const [deviceForm, setDeviceForm] = useState({ 
    vehicleNumber: '', 
    vehicleType: '14-Ft Container', 
    customVehicleType: '',
    hardwareIMEI: '', 
    driverId: '', 
    fitnessExpiry: '', 
    currentStatus: 'YARD',
    document: null
  });
  const [driverForm, setDriverForm] = useState({ 
    name: '', phone: '', licenseNumber: '', licenseExpiryDate: '', status: 'AVAILABLE', assignedVehicle: '',
    username: '', password: '', document: null
  });
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: '', employeeName: '', aadhaar: null, pan: null, addressProof: null
  });
  
  const [drivers, setDrivers] = useState([]);
  const [fleetAssets, setFleetAssets] = useState([]);

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchAnalytics();
    fetchRates();
    fetchDrivers();
    fetchFleetAssets();

    // Socket Initialization
    socketRef.current = io('http://localhost:3000');

    socketRef.current.on('connect', () => {
      setIsMapConnected(true);
    });

    socketRef.current.on('telemetry_update', (data) => {
      setVehicles((prev) => ({
        ...prev,
        [data.imei]: data
      }));
      setVehicleHistory((prev) => {
        const currentHistory = prev[data.imei] || [];
        return {
          ...prev,
          [data.imei]: [...currentHistory, [data.location.lat, data.location.lng]]
        };
      });
    });

    socketRef.current.on('location-update', (data) => {
      if (data.status === 'YARD') {
        setVehicles(prev => {
          const updated = { ...prev };
          const imei = Object.keys(updated).find(key => updated[key].vehicleRegistration === data.vehicleId);
          if (imei) {
            delete updated[imei];
          }
          return updated;
        });
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsMapConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, user, navigate]);

  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3000/api/admin/analytics/revenue?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(res.data.metrics);
      setCharts(res.data.charts);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/rates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRateForm({
        basePricePerKg: res.data.basePricePerKg || '',
        volumetricDivisor: res.data.volumetricDivisor || '',
        fuelSurchargeRate: res.data.fuelSurchargeRate || ''
      });
    } catch (error) {
      console.error('Failed to fetch rates', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/drivers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers(res.data.drivers || []);
    } catch (error) {
      console.error('Failed to fetch drivers', error);
    }
  };

  const fetchFleetAssets = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/fleet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFleetAssets(res.data.assets || []);
    } catch (error) {
      console.error('Failed to fetch fleet assets', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || (!userForm.email && !userForm.mobileNumber) || !userForm.password) {
      alert("Name, Password, and either Email or Mobile Number are required.");
      return;
    }
    try {
      await axios.post('http://localhost:3000/api/admin/users/create', userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User created successfully');
      setUserForm({ name: '', email: '', mobileNumber: '', password: '', role: 'RECEPTIONIST' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:3000/api/admin/rates/update', rateForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Rates updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update rates');
    }
  };

  const handleRegisterFleet = async (e) => {
    e.preventDefault();
    if (!deviceForm.vehicleNumber || !deviceForm.hardwareIMEI) {
      alert("Vehicle Number and IMEI are required.");
      return;
    }
    try {
      const formData = new FormData();
      Object.keys(deviceForm).forEach(key => {
        if (key === 'customVehicleType') return; // Skip it
        if (key === 'vehicleType' && deviceForm.vehicleType === 'Other') {
          formData.append(key, deviceForm.customVehicleType);
          return;
        }
        if (deviceForm[key] !== null) {
          formData.append(key, deviceForm[key]);
        }
      });
      await axios.post('http://localhost:3000/api/admin/fleet/register', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert('Fleet asset registered successfully');
      setDeviceForm({ vehicleNumber: '', vehicleType: '14-Ft Container', customVehicleType: '', hardwareIMEI: '', driverId: '', fitnessExpiry: '', currentStatus: 'YARD', document: null });
      fetchAnalytics();
      fetchFleetAssets();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register fleet asset');
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    if (!driverForm.name || !driverForm.phone || !driverForm.licenseNumber || !driverForm.username || !driverForm.password) {
      alert("All fields including Username and Password are required for Driver Onboarding.");
      return;
    }
    if (driverForm.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (!/^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(driverForm.licenseNumber)) {
      alert("License number must match the standard 15-character Indian DL format (e.g., MH1220260089421).");
      return;
    }
    try {
      const formData = new FormData();
      Object.keys(driverForm).forEach(key => {
        if (driverForm[key] !== null) {
          formData.append(key, driverForm[key]);
        }
      });
      await axios.post('http://localhost:3000/api/admin/drivers/create', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert('Driver created successfully');
      setDriverForm({ 
        name: '', phone: '', licenseNumber: '', licenseExpiryDate: '', status: 'AVAILABLE', assignedVehicle: '',
        username: '', password: '', document: null
      });
      fetchDrivers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create driver');
    }
  };

  const handleVerifyEmployee = async (e) => {
    e.preventDefault();
    if (!employeeForm.employeeId || !employeeForm.employeeName || !employeeForm.aadhaar || !employeeForm.pan || !employeeForm.addressProof) {
      alert("All fields and all 3 documents are mandatory.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('employeeId', employeeForm.employeeId);
      formData.append('employeeName', employeeForm.employeeName);
      formData.append('aadhaar', employeeForm.aadhaar);
      formData.append('pan', employeeForm.pan);
      formData.append('addressProof', employeeForm.addressProof);
      
      await axios.post('http://localhost:3000/api/admin/employee/verify', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert('Employee verified and documents uploaded successfully');
      setEmployeeForm({ employeeId: '', employeeName: '', aadhaar: null, pan: null, addressProof: null });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify employee');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver and their login access?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/admin/drivers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      alert('Failed to delete driver');
    }
  };

  const handleDeleteFleet = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fleet asset?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/admin/fleet/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Fleet asset deleted successfully');
      fetchFleetAssets();
      fetchAnalytics();
    } catch (error) {
      alert('Failed to delete fleet asset');
    }
  };

  const handleAssignVehicle = async (driverId, vehicleRegistration) => {
    try {
      await axios.put(`http://localhost:3000/api/admin/drivers/${driverId}/assign-vehicle`, 
        { vehicleRegistration }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Vehicle assigned to driver successfully');
      fetchDrivers();
      fetchFleetAssets(); // Refresh assignments
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign vehicle');
    }
  };

  const toggleDemoMode = async () => {
    try {
      const newState = !isDemoActive;
      await axios.post('http://localhost:3000/api/admin/demo/toggle', { active: newState }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsDemoActive(newState);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle demo mode');
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

  const getStatusBadge = (expiryDate) => {
    if (!expiryDate) return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded">N/A</span>;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">EXPIRED</span>;
    } else if (diffDays <= 30) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">EXPIRING SOON</span>;
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">VALID</span>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">TransitNode</h1>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Command Center</p>
        </div>
        
        <nav className="flex-1 mt-6">
          <div className="px-4 space-y-2">
            <button 
              onClick={() => setActiveTab('ANALYTICS')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab('MANAGEMENT')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'MANAGEMENT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              User & Rates
            </button>
            <button 
              onClick={() => setActiveTab('DRIVER_MANAGEMENT')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'DRIVER_MANAGEMENT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Driver Management
            </button>
            <button 
              onClick={() => setActiveTab('FLEET_MANAGEMENT')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'FLEET_MANAGEMENT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Fleet Management
            </button>
            <button 
              onClick={() => setActiveTab('MAP')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'MAP' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Live Fleet Map
            </button>
            <button 
              onClick={() => setActiveTab('COMPLIANCE')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'COMPLIANCE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Compliance Vault
            </button>
            <button 
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'TRANSACTIONS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Shipment Ledger
            </button>
            <button 
              onClick={() => setActiveTab('FINANCE')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'FINANCE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Financial Engine
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">A</div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full py-2 px-4 bg-slate-800 hover:bg-red-500 hover:text-white transition-colors rounded text-sm text-center">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          
          {/* Demo Mode Toggle & Banner */}
          <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${isDemoActive ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={toggleDemoMode}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${isDemoActive ? 'translate-x-6' : ''}`}></div>
              </div>
              <span className="font-bold text-slate-800">⚡ Activate System Demo Mode</span>
            </div>
          </div>

          {isDemoActive && (
            <div className="mb-6 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-xl shadow-sm animate-pulse flex items-center">
              <span className="mr-2">⚠️</span>
              <p className="font-medium">System running in simulated environment. Mocking live tracking streams.</p>
            </div>
          )}

          {/* Top Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col transition-all hover:shadow-md">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Gross Trip Revenue</span>
              <span className="text-3xl font-bold text-slate-900">₹{metrics.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col transition-all hover:shadow-md">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Net Fleet Margin</span>
              <span className="text-3xl font-bold text-emerald-600">{metrics.netFleetMargin}%</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col transition-all hover:shadow-md">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Active Fleet on Road</span>
              <span className="text-3xl font-bold text-indigo-600">{metrics.activeFleet}</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col transition-all hover:shadow-md">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">In Maintenance</span>
              <span className="text-3xl font-bold text-amber-500">{metrics.maintenanceFleet}</span>
            </div>
          </div>

          {/* Views */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800">Analytics Overview</h2>
                <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  {['daily', 'weekly', 'monthly', 'yearly', 'all'].map(tr => (
                    <button
                      key={tr}
                      onClick={() => setTimeRange(tr)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${timeRange === tr ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Line Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Net Profitability by Route</h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.revenueOverTime} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#64748B', fontSize: 12}} 
                          angle={-45} 
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip 
                          formatter={(value) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Payment Methods</h3>
                  <div className="h-72">
                    <PieChart width={300} height={250}>
                      <Pie
                        data={charts.paymentMethodsData}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {charts.paymentMethodsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Fleet Utilization</h3>
                  <div className="h-72">
                    <BarChart width={900} height={250} data={charts.statusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                      <Tooltip cursor={{fill: '#F1F5F9'}} />
                      <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MANAGEMENT' && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-800">Management Controls</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User & Employee Column */}
                <div className="space-y-8">
                  {/* User Provisioning */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Provision New User</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                    </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                        <input type="text" value={userForm.mobileNumber} onChange={e => setUserForm({...userForm, mobileNumber: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white">
                          <option value="RECEPTIONIST">Receptionist</option>
                          <option value="ACCOUNTANT">Accountant</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium">Create User</button>
                    </form>
                  </div>

                  {/* Employee Verification Form */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Employee Verification</h3>
                    <form onSubmit={handleVerifyEmployee} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                        <input type="text" required value={employeeForm.employeeId} onChange={e => setEmployeeForm({...employeeForm, employeeId: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm p-2 border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name</label>
                        <input type="text" required value={employeeForm.employeeName} onChange={e => setEmployeeForm({...employeeForm, employeeName: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm p-2 border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Aadhaar Card (Compulsory)</label>
                        <input type="file" required onChange={e => setEmployeeForm({...employeeForm, aadhaar: e.target.files[0]})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">PAN Card (Compulsory)</label>
                        <input type="file" required onChange={e => setEmployeeForm({...employeeForm, pan: e.target.files[0]})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address Proof (e.g. Light Bill - Compulsory)</label>
                        <input type="file" required onChange={e => setEmployeeForm({...employeeForm, addressProof: e.target.files[0]})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition font-medium">Verify & Upload</button>
                    </form>
                  </div>
                </div>

                {/* Rates config */}
                <div className="space-y-8">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Rate Card Configuration</h3>
                    <form onSubmit={handleUpdateRates} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Base Price Per KG (₹)</label>
                        <input type="number" required value={rateForm.basePricePerKg} onChange={e => setRateForm({...rateForm, basePricePerKg: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Volumetric Divisor</label>
                        <input type="number" required value={rateForm.volumetricDivisor} onChange={e => setRateForm({...rateForm, volumetricDivisor: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Surcharge Rate (%)</label>
                        <input type="number" required value={rateForm.fuelSurchargeRate} onChange={e => setRateForm({...rateForm, fuelSurchargeRate: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium">Update Rates</button>
                    </form>
                  </div>

                </div>
              </div>
            </div>
          )}

          {activeTab === 'FLEET_MANAGEMENT' && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-800">Fleet Management</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Fleet Asset Form */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Register Fleet Asset</h3>
                  <form onSubmit={handleRegisterFleet} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Registration Number</label>
                      <input type="text" required placeholder="e.g. MH 12 AB 1234" value={deviceForm.vehicleNumber} onChange={e => setDeviceForm({...deviceForm, vehicleNumber: formatVehicleNumber(e.target.value)})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border uppercase font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                      <select 
                        required
                        value={deviceForm.vehicleType} 
                        onChange={e => setDeviceForm({...deviceForm, vehicleType: e.target.value})} 
                        className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white"
                      >
                        {[...new Set(['14-Ft Container', '19-Ft Container', '22-Ft Open', 'Pickup', 'Trailer', ...fleetAssets.map(a => a.vehicleType).filter(Boolean)])].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                        <option value="Other">Other (Type below)</option>
                      </select>
                      {deviceForm.vehicleType === 'Other' && (
                        <input 
                          type="text" 
                          required 
                          placeholder="Type custom vehicle type..." 
                          value={deviceForm.customVehicleType} 
                          onChange={e => setDeviceForm({...deviceForm, customVehicleType: e.target.value})} 
                          className="w-full mt-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" 
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hardware IMEI</label>
                      <input type="text" required value={deviceForm.hardwareIMEI} onChange={e => setDeviceForm({...deviceForm, hardwareIMEI: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Driver</label>
                      <select value={deviceForm.driverId} onChange={e => setDeviceForm({...deviceForm, driverId: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white">
                        <option value="">-- None / Unassigned --</option>
                        {drivers.filter(d => d.status === 'AVAILABLE' && !d.assignedVehicle).map(d => (
                          <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fitness Expiry Date</label>
                      <input type="date" value={deviceForm.fitnessExpiry} onChange={e => setDeviceForm({...deviceForm, fitnessExpiry: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Document (e.g. Insurance/Permit)</label>
                      <input type="file" onChange={e => setDeviceForm({...deviceForm, document: e.target.files[0]})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Current Status</label>
                      <select value={deviceForm.currentStatus} onChange={e => setDeviceForm({...deviceForm, currentStatus: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white">
                        <option value="YARD">YARD (Idle)</option>
                        <option value="ON_TRIP">ON_TRIP (Active)</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition font-medium">Register Asset</button>
                  </form>
                </div>
                
                {/* Fleet List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Fleet Asset Roster</h3>
                    <button onClick={fetchFleetAssets} className="text-slate-500 hover:text-indigo-600 transition bg-slate-100 hover:bg-indigo-50 p-2 rounded-md" title="Refresh Fleet">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-sm">
                          <th className="py-3 px-4 font-bold">Registration</th>
                          <th className="py-3 px-4 font-bold">Type</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fleetAssets.length > 0 ? (
                          fleetAssets.map(asset => (
                            <tr key={asset._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-800">{asset.vehicleRegistration}</td>
                              <td className="py-3 px-4 text-slate-600">{asset.vehicleType}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${asset.status === 'YARD' ? 'bg-emerald-100 text-emerald-700' : asset.status === 'ON_TRIP' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {asset.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button onClick={() => handleDeleteFleet(asset._id)} className="text-rose-500 hover:text-rose-700 transition p-2 hover:bg-rose-50 rounded-md" title="Delete Fleet Asset">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-8 text-center text-slate-400">No fleet assets found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'DRIVER_MANAGEMENT' && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-800">Driver Management</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Driver Form */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Onboard New Driver</h3>
                  <form onSubmit={handleCreateDriver} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input type="text" required value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                      <input type="text" required value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                      <input 
                        type="text" 
                        required 
                        value={driverForm.licenseNumber} 
                        onChange={e => {
                          const val = e.target.value.replace(/[\s\W_]+/g, '').toUpperCase();
                          setDriverForm({...driverForm, licenseNumber: val});
                        }} 
                        className={`w-full rounded-md shadow-sm sm:text-sm p-2 border font-mono ${
                          driverForm.licenseNumber.length > 0 && !/^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(driverForm.licenseNumber) 
                            ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500' 
                            : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                        }`} 
                        placeholder="e.g. MH1220260089421"
                        maxLength="15"
                      />
                      {driverForm.licenseNumber.length > 0 && !/^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(driverForm.licenseNumber) && (
                        <p className="mt-1 text-xs font-medium text-rose-500">
                          Format error: [State Code (2 Letters)][RTO Code (2 Digits)][Issue Year (4 Digits)][Unique ID (7 Digits)]
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">License Expiry Date</label>
                      <input 
                        type="date" 
                        required 
                        value={driverForm.licenseExpiryDate} 
                        onChange={e => setDriverForm({...driverForm, licenseExpiryDate: e.target.value})} 
                        className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                      <input type="text" required value={driverForm.username} onChange={e => setDriverForm({...driverForm, username: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                      <input type="password" required value={driverForm.password} onChange={e => setDriverForm({...driverForm, password: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Driver Document (e.g. License)</label>
                      <input type="file" onChange={e => setDriverForm({...driverForm, document: e.target.files[0]})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Initial Status</label>
                      <select value={driverForm.status} onChange={e => setDriverForm({...driverForm, status: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white">
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="ON_TRIP">ON_TRIP</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Assign Vehicle (Optional)</label>
                      <select value={driverForm.assignedVehicle} onChange={e => setDriverForm({...driverForm, assignedVehicle: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white">
                        <option value="">-- None --</option>
                        {fleetAssets.filter(f => {
                          if (f.status !== 'YARD') return false;
                          const isAssigned = drivers.some(otherD => otherD.assignedVehicle === f.vehicleRegistration);
                          return !isAssigned;
                        }).map(asset => (
                          <option key={asset._id} value={asset.vehicleRegistration}>
                            {asset.vehicleRegistration} ({asset.vehicleType})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium">Add Driver</button>
                  </form>
                </div>

                {/* Driver List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Driver Roster</h3>
                    <button onClick={fetchDrivers} className="text-slate-500 hover:text-indigo-600 transition bg-slate-100 hover:bg-indigo-50 p-2 rounded-md" title="Refresh Drivers">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-sm">
                          <th className="py-3 px-4 font-bold">Name</th>
                          <th className="py-3 px-4 font-bold">Phone</th>
                          <th className="py-3 px-4 font-bold">License</th>
                          <th className="py-3 px-4 font-bold">Expiry</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold">Assigned Vehicle</th>
                          <th className="py-3 px-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drivers.length > 0 ? (
                          drivers.map(d => (
                            <tr key={d._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-medium text-slate-800">{d.name}</td>
                              <td className="py-3 px-4 text-slate-600">{d.phone}</td>
                              <td className="py-3 px-4 text-slate-600 font-mono text-xs">{d.licenseNumber}</td>
                              <td className="py-3 px-4">
                                {getStatusBadge(d.licenseExpiryDate)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${d.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : d.status === 'ON_TRIP' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {d.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <select 
                                  value={d.assignedVehicle || ''} 
                                  onChange={(e) => handleAssignVehicle(d._id, e.target.value)}
                                  className="w-full text-sm border border-slate-300 rounded p-1 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                  <option value="">-- Unassigned --</option>
                                  {fleetAssets.filter(asset => {
                                    // Include if it's assigned to THIS driver
                                    if (asset.vehicleRegistration === d.assignedVehicle) return true;
                                    // Otherwise, only include if NO OTHER driver has it assigned
                                    const isAssignedToOther = drivers.some(otherD => 
                                      otherD._id !== d._id && otherD.assignedVehicle === asset.vehicleRegistration
                                    );
                                    return !isAssignedToOther;
                                  }).map(asset => (
                                    <option key={asset._id} value={asset.vehicleRegistration}>
                                      {asset.vehicleRegistration} ({asset.vehicleType})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button onClick={() => handleDeleteDriver(d._id)} className="text-rose-500 hover:text-rose-700 transition p-2 hover:bg-rose-50 rounded-md" title="Delete Driver">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="py-8 text-center text-slate-400">No drivers found. Add one to get started.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MAP' && (
            <div className="flex h-[calc(100vh-14rem)] gap-6">
              {/* Left Sidebar */}
              <div className="w-1/4 min-w-[320px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 mb-3">Live Fleet Status</h3>
                  <input 
                    type="text" 
                    placeholder="Search by Vehicle Plate or Driver..." 
                    className="w-full text-sm p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {Object.values(vehicles).filter(v => 
                    v.vehicleRegistration.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    v.driverName.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(v => {
                    const isSelected = selectedVehicleId === v.imei;
                    const isMoving = v.speed > 0;
                    return (
                      <div 
                        key={v.imei}
                        onClick={() => setSelectedVehicleId(v.imei)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-800">{v.vehicleRegistration}</span>
                          <div className="relative flex h-3 w-3">
                            {isMoving && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isMoving ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{v.driverName}</span>
                          <span className="font-medium text-slate-800">{v.speed} km/h</span>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(vehicles).length === 0 && (
                    <div className="p-4 text-center text-slate-500 text-sm">Waiting for telemetry data...</div>
                  )}
                </div>
              </div>
              
              {/* Right Content Area */}
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
                <MapView 
                  vehicles={vehicles} 
                  vehicleHistory={vehicleHistory} 
                  selectedVehicleId={selectedVehicleId} 
                  isConnected={isMapConnected} 
                />
              </div>
            </div>
          )}

          {activeTab === 'COMPLIANCE' && (
            <div className="w-full h-full">
              <ComplianceVault />
            </div>
          )}

          {activeTab === 'TRANSACTIONS' && (
            <div className="w-full h-full animate-fade-in">
              <ShipmentTransactions />
            </div>
          )}

          {activeTab === 'FINANCE' && (
            <div className="w-full h-full animate-fade-in">
              <FinancialLedger />
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
