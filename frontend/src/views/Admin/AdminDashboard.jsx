import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import MapView from '../../components/MapView';
import ComplianceVault from './ComplianceVault';
import ShipmentTransactions from './ShipmentTransactions';
import FinancialLedger from './FinancialLedger';
import SupplierManagement from './SupplierManagement';
import DailyRunSheet from './DailyRunSheet';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === 'ACCOUNTANT') return 'FINANCE';
    if (user?.role === 'OPERATION' || user?.role === 'OPERATION_EXECUTIVE') return 'MAP';
    return 'ANALYTICS';
  }); // ANALYTICS, MANAGEMENT, DRIVER_MANAGEMENT, MAP
  const [expandedMenu, setExpandedMenu] = useState('DASHBOARD');
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
  
  // Sister Companies / Workspaces State
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [sisterCompanyForm, setSisterCompanyForm] = useState({ companyName: '', gstin: '', pan: '', address: '', state: '', stateCode: '', contactNumber: '', invoiceTemplate: null });
  const [sisterCompanyLoading, setSisterCompanyLoading] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [editWorkspaceForm, setEditWorkspaceForm] = useState({ companyName: '', gstin: '', pan: '', address: '', state: '', stateCode: '', contactNumber: '', logoUrl: '', logoFile: null, dominantHexColor: '', requireDriverMobileApp: false });
  const [editWorkspaceLoading, setEditWorkspaceLoading] = useState(false);

  // Subscription State
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutTab, setCheckoutTab] = useState('card');

  // Map / Fleet State
  const [vehicles, setVehicles] = useState({});
  const [vehicleHistory, setVehicleHistory] = useState({});
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMapConnected, setIsMapConnected] = useState(false);
  const socketRef = useRef(null);
  const activeRequestsRef = useRef(0);

  // Forms State
  const [userForm, setUserForm] = useState({ name: '', email: '', mobileNumber: '', password: '', role: 'OPERATION_EXECUTIVE' });
  const [managementSubTab, setManagementSubTab] = useState('USERS'); // 'USERS', 'VENDOR_RATES', 'CLIENT_RATES'
  const [selectedCompanyId, setSelectedCompanyId] = useState('MAIN');
  const [selectedSupplierId, setSelectedSupplierId] = useState('NONE');
  const [templateType, setTemplateType] = useState('TEMPLATE_A');
  const [rows, setRows] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadedRateCard, setLoadedRateCard] = useState(null);
  const [workingRows, setWorkingRows] = useState({ TEMPLATE_A: [], TEMPLATE_B: [], TEMPLATE_D: [] });
  
  const initialTemplateAForm = { from: '', to: '', vehicleType: 'Van (or Eeco)', billingType: 'Fixed', fixedKms: '', rate12h: '', rate24h: '', extraKmRate: '', extraHourRate: '', detentionCharges: '' };
  const initialTemplateBForm = { storeCode: '', storeName: '', location: '', city: '', state: '', zone: '', tataAceRate: '', tata407Rate: '', rate14ft: '', rate17ft: '', rate20ft: '', rate32ft7ton: '', rate32ft9ton: '', rate32ft10ton: '', rate32ft15ton: '', detentionCostPerDay: '', localPointCharges: '', outOfStatePointCharges: '' };
  const initialTemplateDForm = { 
    // Original Fields
    buVertical: '', 
    rateType: 'Regular', 
    origin: '', 
    fuelRate: '', 
    agreedDays: '26', 
    deploymentHour: '12', 
    fixKm: '', 
    rateAtFixKm: '', 
    extraKmRate: '', 
    extraHourRate: '', 
    startEffectiveDate: '', 
    expiryDate: '',
    // New fields
    date: '', 
    sourceHubName: '', 
    clientName: '', 
    supplierName: '', 
    movementType: '', 
    vehicleNumber: '', 
    vehicleType: 'TATA Ace', 
    parentVehicleNo: '', 
    vendorName: '', 
    vehicleOwnership: 'Adhoc', 
    driverType: 'Contract / Vendor Driver',
    startOdometer: '0', 
    endOdometer: '0', 
    freight: '0', 
    dcmCharges: '0', 
    tollAmount: '0' 
  };
  const [templateAForm, setTemplateAForm] = useState(initialTemplateAForm);
  const [templateBForm, setTemplateBForm] = useState(initialTemplateBForm);
  const [templateDForm, setTemplateDForm] = useState(initialTemplateDForm);
  const [editingRowIndex, setEditingRowIndex] = useState(null);

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
    name: '', phone: '', licenseNumber: '', licenseExpiryDate: '', status: 'AVAILABLE', assignedVehicle: '', document: null
  });
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: '', employeeName: '', aadhaar: null, pan: null, addressProof: null
  });
  const [vendorRateCardForm, setVendorRateCardForm] = useState({
    vendorName: '',
    vehicleType: '14-Ft Container',
    baseRate: '',
    tollCharge: '',
    dcmCharge: '',
    totalRate: '',
    vehicleDetails: '',
    rcDocument: null,
    insuranceDocument: null,
    driverName: '',
    driverLicenseDocument: null,
    driverIdDocument: null
  });
  const [profileForm, setProfileForm] = useState({
    name: '', email: '', username: '', mobileNumber: '', password: ''
  });
  
  const [drivers, setDrivers] = useState([]);
  const [fleetAssets, setFleetAssets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [vendorRateCards, setVendorRateCards] = useState([]);

  useEffect(() => {
    const allowedRoles = ['ADMIN', 'ACCOUNTANT', 'OPERATION', 'OPERATION_EXECUTIVE'];
    if (!token || !allowedRoles.includes(user?.role)) {
      navigate('/login');
      return;
    }
    if (user?.role === 'ADMIN') {
      fetchUsersList();
      fetchSubscription();
      fetchWorkspaces();
      fetchSuppliers();
    }

    // Socket Initialization
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');

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

  // Inject Workspace Context & Global API Loader
  useEffect(() => {
    const allowedRoles = ['ADMIN', 'ACCOUNTANT', 'OPERATION', 'OPERATION_EXECUTIVE'];
    if (!token || !allowedRoles.includes(user?.role)) return;

    const showLoader = () => {
      activeRequestsRef.current++;
      setGlobalLoading(true);
    };

    const hideLoader = () => {
      activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
      if (activeRequestsRef.current === 0) {
        setGlobalLoading(false);
      }
    };
    
    const reqInterceptor = axios.interceptors.request.use(config => {
      showLoader();

      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('x-workspace-id', activeWorkspace || 'MAIN');
      } else {
        config.headers['x-workspace-id'] = activeWorkspace || 'MAIN';
      }
      return config;
    }, error => {
      hideLoader();
      return Promise.reject(error);
    });

    const resInterceptor = axios.interceptors.response.use(response => {
      hideLoader();
      return response;
    }, error => {
      hideLoader();
      return Promise.reject(error);
    });

    if (user?.role === 'ADMIN') {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
    fetchDrivers();
    fetchFleetAssets();

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [activeWorkspace, timeRange, token, user]);

  // Sync selectedCompanyId with activeWorkspace
  useEffect(() => {
    setSelectedCompanyId(activeWorkspace && activeWorkspace !== 'MAIN' ? activeWorkspace : 'MAIN');
  }, [activeWorkspace]);

  // Fetch rates when selectedCompanyId or selectedSupplierId changes
  useEffect(() => {
    if (token) {
      fetchRates(selectedCompanyId, selectedSupplierId);
    }
  }, [selectedCompanyId, selectedSupplierId, token]);



  useEffect(() => {
    if (activeTab === 'PROFILE') {
      fetchProfile();
    } else if (activeTab === 'RATE_CARD') {
      fetchVendorRateCards();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileForm({
        name: res.data.user.name || '',
        email: res.data.user.email || '',
        username: res.data.user.username || '',
        mobileNumber: res.data.user.mobileNumber || '',
        password: '' // Keep blank for security
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...profileForm };
      if (!payload.password) delete payload.password; // Don't update if empty

      await axios.put(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/users/${user.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully! Some changes may require re-login to take full effect.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/analytics/revenue?timeRange=${timeRange}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-workspace-id': activeWorkspace || 'MAIN'
        }
      });
      setMetrics(res.data.metrics);
      setCharts(res.data.charts);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async (compId, supId) => {
    const targetCompId = compId || selectedCompanyId || 'MAIN';
    const targetSupId = supId || selectedSupplierId || 'NONE';
    try {
      const url = user?.role === 'ADMIN'
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/rates`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/invoices/rates`;
      const res = await axios.get(url, {
        params: { companyId: targetCompId, supplierId: targetSupId },
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-workspace-id': activeWorkspace || 'MAIN'
        }
      });
      setLoadedRateCard(res.data);
      const activeTemplate = res.data.templateType || 'TEMPLATE_A';
      setTemplateType(activeTemplate);

      let rowsA = [];
      let rowsB = [];
      let rowsD = [];
      if (res.data.rows) {
        if (Array.isArray(res.data.rows)) {
          if (activeTemplate === 'TEMPLATE_A') rowsA = res.data.rows;
          if (activeTemplate === 'TEMPLATE_B') rowsB = res.data.rows;
          if (activeTemplate === 'TEMPLATE_D') rowsD = res.data.rows;
        } else {
          rowsA = res.data.rows.TEMPLATE_A || [];
          rowsB = res.data.rows.TEMPLATE_B || [];
          rowsD = res.data.rows.TEMPLATE_D || [];
        }
      }
      setWorkingRows({ TEMPLATE_A: rowsA, TEMPLATE_B: rowsB, TEMPLATE_D: rowsD });
      setRows(activeTemplate === 'TEMPLATE_A' ? rowsA : activeTemplate === 'TEMPLATE_B' ? rowsB : activeTemplate === 'TEMPLATE_D' ? rowsD : []);
    } catch (error) {
      console.error('Failed to fetch rates', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/drivers`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-workspace-id': activeWorkspace || 'MAIN'
        }
      });
      setDrivers(res.data.drivers || []);
    } catch (error) {
      console.error('Failed to fetch drivers', error);
    }
  };

  const fetchFleetAssets = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/fleet`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-workspace-id': activeWorkspace || 'MAIN'
        }
      });
      setFleetAssets(res.data.assets || []);
    } catch (error) {
      console.error('Failed to fetch fleet assets', error);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Exclude drivers from this list since they have a dedicated tab
      const nonDrivers = (res.data.users || []).filter(u => u.role !== 'DRIVER');
      setUsersList(nonDrivers);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptionDetails(res.data);
    } catch (error) {
      console.error('Failed to fetch subscription', error);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/companies/my-workspaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkspaces(res.data.workspaces || []);
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
    }
  };

  const handleCreateSisterCompany = async (e) => {
    e.preventDefault();
    if (!sisterCompanyForm.companyName || !sisterCompanyForm.address) {
      alert("Company Name and Address are required.");
      return;
    }
    setSisterCompanyLoading(true);
    try {
      const formData = new FormData();
      Object.keys(sisterCompanyForm).forEach(key => {
        if (key !== 'invoiceTemplate' && sisterCompanyForm[key]) {
          formData.append(key, sisterCompanyForm[key]);
        }
      });
      if (sisterCompanyForm.invoiceTemplate) {
        formData.append('invoiceTemplate', sisterCompanyForm.invoiceTemplate);
      }

      await axios.post(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/companies/add-sister`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Sister company created successfully');
      setSisterCompanyForm({ companyName: '', gstin: '', pan: '', address: '', state: '', stateCode: '', contactNumber: '', invoiceTemplate: null });
      fetchWorkspaces();
      const fileInput = document.getElementById('sisterInvoiceTemplate');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create sister company');
    } finally {
      setSisterCompanyLoading(false);
    }
  };

  const handleUpdateInvoiceFormat = async (workspaceId, file, isPrimary) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('invoiceTemplate', file);
      const url = isPrimary 
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/saas/tenant-profile/invoice-format`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/companies/workspace/${workspaceId}/invoice-format`;
        
      await axios.put(url, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Invoice format updated successfully');
      fetchWorkspaces();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update invoice format');
    }
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    setEditWorkspaceLoading(true);
    try {
      if (editingWorkspace.isPrimary) {
        const formData = new FormData();
        Object.keys(editWorkspaceForm).forEach(key => {
          if (key !== 'logoFile' && editWorkspaceForm[key] !== null && editWorkspaceForm[key] !== undefined) {
            formData.append(key, editWorkspaceForm[key]);
          }
        });
        if (editWorkspaceForm.logoFile) {
          formData.append('logoFile', editWorkspaceForm.logoFile);
        }
        await axios.put(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/saas/tenant-profile`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        fetchSubscription();
      } else {
        await axios.put(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/companies/${editingWorkspace._id}`, editWorkspaceForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchWorkspaces();
      }
      alert('Workspace updated successfully');
      setEditingWorkspace(null);
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to update workspace');
    } finally {
      setEditWorkspaceLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm("Are you sure you want to delete this Sister Company? This action cannot be undone.")) return;
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/companies/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Workspace deleted successfully');
      fetchWorkspaces();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete workspace');
    }
  };

  const handleUpgradePlan = async (newPlan) => {
    setPendingUpgradePlan(newPlan);
  };

  const processUpgradeCheckout = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    try {
      const amount = getUpgradePrice(pendingUpgradePlan);
      await axios.put(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/subscription/upgrade`, { planType: pendingUpgradePlan, amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Payment successful! Successfully upgraded to ${pendingUpgradePlan} plan!`);
      setPendingUpgradePlan(null);
      fetchSubscription();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update plan');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getUpgradePrice = (plan) => {
    if (plan === 'LIFETIME') return 500000;
    if (plan === 'PLATINUM') return 100000;
    if (plan === 'SILVER') return 50000;
    return 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || (!userForm.email && !userForm.mobileNumber) || !userForm.password) {
      alert("Name, Password, and either Email or Mobile Number are required.");
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/users/create`, userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User created successfully');
      setUserForm({ name: '', email: '', mobileNumber: '', password: '', role: 'OPERATION_EXECUTIVE' });
      fetchUsersList();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleTemplateTypeChange = (newType) => {
    setTemplateType(newType);
    setEditingRowIndex(null);
    setTemplateAForm(initialTemplateAForm);
    setTemplateBForm(initialTemplateBForm);
    setTemplateDForm(initialTemplateDForm);
    if (newType === 'TEMPLATE_A') {
      setRows(workingRows.TEMPLATE_A || []);
    } else if (newType === 'TEMPLATE_B') {
      setRows(workingRows.TEMPLATE_B || []);
    } else if (newType === 'TEMPLATE_D') {
      setRows(workingRows.TEMPLATE_D || []);
    } else {
      setRows([]);
    }
  };

  const handleTemplateAFormChange = (e) => {
    const { name, value } = e.target;
    setTemplateAForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateBFormChange = (e) => {
    const { name, value } = e.target;
    setTemplateBForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateDFormChange = (e) => {
    const { name, value } = e.target;
    setTemplateDForm(prev => ({ ...prev, [name]: value }));
  };

  const addOrUpdateRowTemplateA = () => {
    if (!templateAForm.from || !templateAForm.to) {
      alert("From and To are required.");
      return;
    }
    const updated = [...rows];
    if (editingRowIndex !== null) {
      updated[editingRowIndex] = templateAForm;
      setEditingRowIndex(null);
    } else {
      updated.push(templateAForm);
    }
    setRows(updated);
    setWorkingRows(prev => ({ ...prev, TEMPLATE_A: updated }));
    setTemplateAForm(initialTemplateAForm);
    saveRatesToBackend(updated);
  };

  const addOrUpdateRowTemplateB = () => {
    if (!templateBForm.storeCode || !templateBForm.storeName) {
      alert("Store Code and Store Name are required.");
      return;
    }
    const updated = [...rows];
    if (editingRowIndex !== null) {
      updated[editingRowIndex] = templateBForm;
      setEditingRowIndex(null);
    } else {
      updated.push(templateBForm);
    }
    setRows(updated);
    setWorkingRows(prev => ({ ...prev, TEMPLATE_B: updated }));
    setTemplateBForm(initialTemplateBForm);
    saveRatesToBackend(updated);
  };

  const addOrUpdateRowTemplateD = () => {
    if (!templateDForm.origin) {
      alert("Origin is required.");
      return;
    }
    
    const startOdo = parseFloat(templateDForm.startOdometer) || 0;
    const endOdo = parseFloat(templateDForm.endOdometer) || 0;
    const totalDistance = endOdo > startOdo ? endOdo - startOdo : 0;
    
    const freight = parseFloat(templateDForm.freight) || 0;
    const dcm = parseFloat(templateDForm.dcmCharges) || 0;
    const toll = parseFloat(templateDForm.tollAmount) || 0;
    const totalPayoutAmount = freight + dcm + toll;

    const finalForm = {
      ...templateDForm,
      totalDistance,
      totalPayoutAmount
    };

    const updated = [...rows];
    if (editingRowIndex !== null) {
      updated[editingRowIndex] = finalForm;
      setEditingRowIndex(null);
    } else {
      updated.push(finalForm);
    }
    setRows(updated);
    setWorkingRows(prev => ({ ...prev, TEMPLATE_D: updated }));
    setTemplateDForm(initialTemplateDForm);
    saveRatesToBackend(updated);
  };



  const editRow = (index) => {
    if (templateType === 'TEMPLATE_A') {
      setTemplateAForm(rows[index]);
    } else if (templateType === 'TEMPLATE_B') {
      setTemplateBForm(rows[index]);
    } else if (templateType === 'TEMPLATE_D') {
      setTemplateDForm(rows[index]);
    }
    setEditingRowIndex(index);
  };

  const cancelEdit = () => {
    setEditingRowIndex(null);
    setTemplateAForm(initialTemplateAForm);
    setTemplateBForm(initialTemplateBForm);
    setTemplateDForm(initialTemplateDForm);
  };

  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    setWorkingRows(prev => ({
      ...prev,
      [templateType]: updated
    }));
    if (editingRowIndex === index) cancelEdit();
    saveRatesToBackend(updated);
  };

  const saveRatesToBackend = async (currentRows) => {
    // Validation
    if (templateType === 'TEMPLATE_A') {
      // Validate non-negative numbers
      for (const r of currentRows) {
        // Skip validating completely empty rows since they will be stripped
        if (!r.from && !r.to) continue;
        if (
          Number(r.fixedKms) < 0 || Number(r.rate12h) < 0 || Number(r.rate24h) < 0 ||
          Number(r.extraKmRate) < 0 || Number(r.extraHourRate) < 0 || Number(r.detentionCharges) < 0
        ) {
          alert('All rates, KMS, and charges must be non-negative numbers.');
          return;
        }
      }
    } else if (templateType === 'TEMPLATE_B') {
      // Validate non-negative numbers
      for (const r of currentRows) {
        if (!r.storeCode && !r.storeName && !r.location) continue;
        if (
          Number(r.tataAceRate) < 0 || Number(r.tata407Rate) < 0 || Number(r.rate14ft) < 0 || Number(r.rate17ft) < 0 ||
          Number(r.rate20ft) < 0 || Number(r.rate32ft7ton) < 0 || Number(r.rate32ft9ton) < 0 || 
          Number(r.rate32ft10ton) < 0 || Number(r.rate32ft15ton) < 0 || Number(r.detentionCostPerDay) < 0 ||
          Number(r.localPointCharges) < 0 || Number(r.outOfStatePointCharges) < 0
        ) {
          alert('All rates, costs, and charges must be non-negative numbers.');
          return;
        }
      }
    } else if (templateType === 'TEMPLATE_D') {
      // Validate non-negative numbers
      for (const r of currentRows) {
        if (!r.origin) continue;
        if (
          Number(r.fuelRate) < 0 || Number(r.agreedDays) < 0 || Number(r.deploymentHour) < 0 ||
          Number(r.fixKm) < 0 || Number(r.rateAtFixKm) < 0 || Number(r.extraKmRate) < 0 || Number(r.extraHourRate) < 0
        ) {
          alert('All rates, KMS, and hours must be non-negative numbers.');
          return;
        }
      }
    }

    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/rates/update`, {
        companyId: selectedCompanyId,
        supplierId: selectedSupplierId,
        templateType,
        rows: currentRows
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Rates updated successfully');
      fetchRates(selectedCompanyId, selectedSupplierId);
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
      await axios.post(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/fleet/register`, formData, {
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
    if (!driverForm.name || !driverForm.phone || !driverForm.licenseNumber) {
      alert("All fields are required for Driver Onboarding.");
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
      await axios.post(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/drivers/create`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert('Driver created successfully');
      setDriverForm({ 
        name: '', phone: '', licenseNumber: '', licenseExpiryDate: '', status: 'AVAILABLE', assignedVehicle: '', document: null
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
      
      await axios.post(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/employee/verify`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert('Employee verified and documents uploaded successfully');
      setEmployeeForm({ employeeId: '', employeeName: '', aadhaar: null, pan: null, addressProof: null });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify employee');
    }
  };

  const handleCreateVendorRateCard = async (e) => {
    e.preventDefault();
    if (!vendorRateCardForm.vendorName || !vendorRateCardForm.vehicleType) {
      alert("Vendor Name and Vehicle Type are required.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('vendorName', vendorRateCardForm.vendorName);
      formData.append('vehicleType', vendorRateCardForm.vehicleType);
      formData.append('baseRate', vendorRateCardForm.baseRate || 0);
      formData.append('tollCharge', vendorRateCardForm.tollCharge || 0);
      formData.append('dcmCharge', vendorRateCardForm.dcmCharge || 0);
      const computedTotal = vendorRateCardForm.totalRate !== '' ? vendorRateCardForm.totalRate : (Number(vendorRateCardForm.tollCharge || 0) + Number(vendorRateCardForm.dcmCharge || 0) + Number(vendorRateCardForm.baseRate || 0));
      formData.append('totalRate', computedTotal);
      formData.append('vehicleDetails', vendorRateCardForm.vehicleDetails || '');
      formData.append('driverName', vendorRateCardForm.driverName || '');
      if (vendorRateCardForm.rcDocument) formData.append('rcDocument', vendorRateCardForm.rcDocument);
      if (vendorRateCardForm.insuranceDocument) formData.append('insuranceDocument', vendorRateCardForm.insuranceDocument);
      if (vendorRateCardForm.driverLicenseDocument) formData.append('driverLicenseDocument', vendorRateCardForm.driverLicenseDocument);
      if (vendorRateCardForm.driverIdDocument) formData.append('driverIdDocument', vendorRateCardForm.driverIdDocument);

      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/vendor-rate-card`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert('Vendor Rate Card created successfully!');
      setVendorRateCardForm({
        vendorName: '', vehicleType: '14-Ft Container', baseRate: '', tollCharge: '', dcmCharge: '', totalRate: '',
        vehicleDetails: '', rcDocument: null, insuranceDocument: null, driverName: '', driverLicenseDocument: null, driverIdDocument: null
      });
      fetchVendorRateCards();
    } catch (error) {
      console.error('Vendor Rate Card creation error:', error);
      alert(error.response?.data?.message || 'Failed to save Vendor Rate Card');
    }
  };

  const fetchVendorRateCards = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/vendor-rate-card`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendorRateCards(res.data.rateCards || []);
    } catch (error) {
      console.error('Failed to fetch vendor rate cards', error);
    }
  };

  const handleDeleteVendorRateCard = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor rate card and its uploaded documents?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/vendor-rate-card/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Vendor Rate Card deleted successfully!');
      fetchVendorRateCards();
    } catch (error) {
      alert('Failed to delete Vendor Rate Card');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver and their login access?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/drivers/${id}`, {
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
      await axios.delete(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/fleet/${id}`, {
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
      await axios.put(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/drivers/${driverId}/assign-vehicle`, 
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
      await axios.post(`${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/demo/toggle`, { active: newState }, {
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
      {/* Global Loader Overlay */}
      {globalLoading && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[9999] flex justify-center items-center pointer-events-auto">
          <div className="bg-white p-5 rounded-2xl shadow-xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="text-sm font-semibold text-slate-700">Processing Request...</p>
          </div>
        </div>
      )}
      {/* Mobile Sidebar Toggle */}
      <input type="checkbox" id="mobile-menu" className="hidden peer" />
      <label htmlFor="mobile-menu" className="md:hidden fixed top-4 right-4 z-[100] p-2 bg-indigo-600 text-white rounded-lg shadow-lg cursor-pointer flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </label>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 transform -translate-x-full peer-checked:translate-x-0 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-slate-900 text-white flex flex-col shadow-xl flex-shrink-0 max-h-screen overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">TransitNode</h1>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Command Center</p>
          
          <select 
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
            value={activeWorkspace || 'MAIN'}
            onChange={(e) => setActiveWorkspace(e.target.value === 'MAIN' ? null : e.target.value)}
          >
            <option value="MAIN">{subscriptionDetails?.companyName || 'Primary Workspace'}</option>
            {workspaces.filter(ws => !ws.isMainTenant).map(ws => (
              <option key={ws._id} value={ws._id}>{ws.companyName}</option>
            ))}
          </select>
        </div>
        
        <nav className="flex-1 mt-6">
          <div className="px-4 space-y-2">
            {/* Dashboard */}
            {user?.role === 'ADMIN' && (
              <div>
                <button 
                  onClick={() => { setExpandedMenu('DASHBOARD'); setActiveTab('ANALYTICS'); }}
                  className={`w-full flex justify-between items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <span>Dashboard</span>
                </button>
              </div>
            )}

            {/* Fleet Operations */}
            {(user?.role === 'ADMIN' || user?.role === 'OPERATION' || user?.role === 'OPERATION_EXECUTIVE') && (
              <div>
                <button 
                  onClick={() => setExpandedMenu(expandedMenu === 'FLEET' ? '' : 'FLEET')}
                  className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-slate-300 hover:bg-slate-800"
                >
                  <span>Fleet Operations</span>
                  <svg className={`w-4 h-4 transform transition-transform ${expandedMenu === 'FLEET' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {expandedMenu === 'FLEET' && (
                  <div className="pl-4 mt-1 space-y-1">
                    <button onClick={() => setActiveTab('MAP')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'MAP' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Live Fleet Map</button>
                    <button onClick={() => setActiveTab('FLEET_MANAGEMENT')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'FLEET_MANAGEMENT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Fleet Management</button>
                    <button onClick={() => setActiveTab('DRIVER_MANAGEMENT')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'DRIVER_MANAGEMENT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Driver Management</button>
                    <button onClick={() => setActiveTab('DAILY_RUN_SHEET')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'DAILY_RUN_SHEET' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Daily Run Sheets</button>
                  </div>
                )}
              </div>
            )}

            {/* Finance & Ledgers */}
            {(user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
              <div>
                <button 
                  onClick={() => setExpandedMenu(expandedMenu === 'FINANCE' ? '' : 'FINANCE')}
                  className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-slate-300 hover:bg-slate-800"
                >
                  <span>Finance & Ledgers</span>
                  <svg className={`w-4 h-4 transform transition-transform ${expandedMenu === 'FINANCE' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {expandedMenu === 'FINANCE' && (
                  <div className="pl-4 mt-1 space-y-1">
                    <button onClick={() => setActiveTab('FINANCE')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'FINANCE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Financial Engine</button>
                    <button onClick={() => setActiveTab('TRANSACTIONS')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'TRANSACTIONS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Shipment Ledger</button>
                    <button onClick={() => setActiveTab('SUPPLIERS')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'SUPPLIERS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Suppliers</button>
                  </div>
                )}
              </div>
            )}

            {/* Admin & Compliance */}
            {user?.role === 'ADMIN' && (
              <div>
                <button 
                  onClick={() => setExpandedMenu(expandedMenu === 'ADMIN' ? '' : 'ADMIN')}
                  className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-slate-300 hover:bg-slate-800"
                >
                  <span>Admin & Compliance</span>
                  <svg className={`w-4 h-4 transform transition-transform ${expandedMenu === 'ADMIN' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {expandedMenu === 'ADMIN' && (
                  <div className="pl-4 mt-1 space-y-1">
                    <button onClick={() => setActiveTab('COMPLIANCE')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'COMPLIANCE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Compliance Vault</button>
                    <button onClick={() => setActiveTab('MANAGEMENT')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'MANAGEMENT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>User & Rates</button>
                    <button onClick={() => setActiveTab('SUBSCRIPTION')} className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'SUBSCRIPTION' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Subscription</button>
                  </div>
                )}
              </div>
            )}

          </div>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div 
            onClick={() => setActiveTab('PROFILE')} 
            className="flex items-center space-x-3 mb-4 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
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
        <div className="p-4 sm:p-6 md:p-8">
          
          {/* Demo Mode Toggle & Banner */}
          {user?.role === 'ADMIN' && (
            <>
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
            </>
          )}

          {/* Top Metrics Bar */}
          {user?.role === 'ADMIN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6 flex flex-col transition-all hover:shadow-md">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Gross Trip Revenue</span>
                <span className="text-3xl font-bold text-slate-900">₹{metrics.totalRevenue?.toLocaleString('en-IN') || 0}</span>
                <div className="mt-3 text-xs font-medium text-slate-400 flex justify-between border-t border-slate-100 pt-2">
                  <span>Daily/Cash: <span className="text-slate-600 font-bold">₹{metrics.dailyRevenue?.toLocaleString('en-IN') || 0}</span></span>
                  <span>Monthly: <span className="text-indigo-600 font-bold">₹{metrics.monthlyRevenue?.toLocaleString('en-IN') || 0}</span></span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6 flex flex-col transition-all hover:shadow-md">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Net Fleet Margin</span>
                <span className="text-3xl font-bold text-emerald-600">{metrics.netFleetMargin}%</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6 flex flex-col transition-all hover:shadow-md">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Active Fleet on Road</span>
                <span className="text-3xl font-bold text-indigo-600">{metrics.activeFleet}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6 flex flex-col transition-all hover:shadow-md">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">In Maintenance</span>
                <span className="text-3xl font-bold text-amber-500">{metrics.maintenanceFleet}</span>
              </div>
            </div>
          )}

          {/* Views */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input type="text" required value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                      <input type="text" required value={profileForm.username} onChange={e => setProfileForm({...profileForm, username: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                      <input type="text" value={profileForm.mobileNumber} onChange={e => setProfileForm({...profileForm, mobileNumber: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white text-slate-900" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">New Password (leave blank to keep current)</label>
                      <input type="password" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} placeholder="Enter new password" className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white text-slate-900" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full md:w-auto bg-indigo-600 text-white py-2 px-3 sm:px-4 md:px-6 rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                      Save Profile Updates
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
                
                {/* Area Chart - Full Width Top Row */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider flex items-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                    Net Profitability by Route
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts.revenueOverTime} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} 
                          angle={-25} 
                          textAnchor="end"
                          dy={15}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} tickFormatter={(value) => `₹${value/1000}k`} />
                        <Tooltip 
                          cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3'}}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white/80 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow-lg ring-1 ring-slate-900/5">
                                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                                  <p className="text-indigo-600 text-lg font-black">
                                    ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" activeDot={{r: 6, strokeWidth: 0, fill: '#4F46E5'}} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar Chart - Bottom Left */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6 relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-blue-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider flex items-center">
                    <span className="w-2 h-2 rounded-full bg-sky-500 mr-2"></span>
                    Fleet Utilization
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                        <Tooltip 
                          cursor={{fill: '#F8FAFC'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#0EA5E9" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Chart - Bottom Right */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6 relative overflow-hidden flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider w-full flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                    Payment Methods
                  </h3>
                  <div className="h-64 w-full flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.paymentMethodsData}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {charts.paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DAILY_RUN_SHEET' && (
            <DailyRunSheet workspaces={workspaces} suppliers={suppliers} />
          )}

          {activeTab === 'MANAGEMENT' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header & Sub-Tab Widget Selector */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin & Compliance Controls</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage user provisioning, vendor rate cards, document vault, and client pricing matrices.</p>
                  </div>
                </div>

                {/* Tabbed Widget Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setManagementSubTab('USERS')}
                    className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                      managementSubTab === 'USERS'
                        ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/60 border border-slate-200/50 scale-[1.01]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="text-lg">👥</span>
                    <span>User Management</span>
                    <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-extrabold ${
                      managementSubTab === 'USERS' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {usersList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManagementSubTab('VENDOR_RATES')}
                    className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                      managementSubTab === 'VENDOR_RATES'
                        ? 'bg-white text-emerald-600 shadow-md shadow-slate-200/60 border border-slate-200/50 scale-[1.01]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="text-lg">🚚</span>
                    <span>Vendor Rate Cards & Vault</span>
                    <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-extrabold ${
                      managementSubTab === 'VENDOR_RATES' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {vendorRateCards.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManagementSubTab('CLIENT_RATES')}
                    className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                      managementSubTab === 'CLIENT_RATES'
                        ? 'bg-white text-blue-600 shadow-md shadow-slate-200/60 border border-slate-200/50 scale-[1.01]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="text-lg">📊</span>
                    <span>Client Rate Configurations</span>
                    <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-extrabold ${
                      managementSubTab === 'CLIENT_RATES' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      Matrix
                    </span>
                  </button>
                </div>
              </div>

              {/* SUB-TAB 1: USER MANAGEMENT */}
              {managementSubTab === 'USERS' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* User KPI Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">{usersList.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Admins</div>
                      <div className="text-2xl font-black text-purple-900 mt-1">
                        {usersList.filter(u => u.role === 'ADMIN').length}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Accountants</div>
                      <div className="text-2xl font-black text-blue-900 mt-1">
                        {usersList.filter(u => u.role === 'ACCOUNTANT').length}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-bold text-green-600 uppercase tracking-wider">Ops Executives</div>
                      <div className="text-2xl font-black text-green-900 mt-1">
                        {usersList.filter(u => u.role === 'OPERATION_EXECUTIVE' || u.role === 'OPERATION').length}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Provisioning Form (1 col) */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
                      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-base font-bold">👤</span>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Provision New User</h3>
                          <p className="text-xs text-slate-500">Create access account for staff</p>
                        </div>
                      </div>
                      <form onSubmit={handleCreateUser} className="space-y-4" autoComplete="off">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                          <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input type="email" autoComplete="new-email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                          <input type="text" value={userForm.mobileNumber} onChange={e => setUserForm({...userForm, mobileNumber: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                          <input type="password" required autoComplete="new-password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                          <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white">
                            <option value="OPERATION_EXECUTIVE">Operation Executive</option>
                            <option value="ACCOUNTANT">Accountant</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition font-bold text-sm shadow-sm">Create User</button>
                      </form>
                    </div>

                    {/* Current Users List Table (2 cols) */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Current Platform Users</h3>
                          <p className="text-xs text-slate-500">All registered system users and assigned roles</p>
                        </div>
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                          {usersList.length} Active Accounts
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead>
                            <tr>
                              <th className="px-3 sm:px-4 md:px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mobile</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {usersList.map((usr) => (
                              <tr key={usr._id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{usr.name}</td>
                                <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${usr.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : usr.role === 'ACCOUNTANT' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                                    {usr.role}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{usr.email || '-'}</td>
                                <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600">{usr.mobileNumber || '-'}</td>
                              </tr>
                            ))}
                            {usersList.length === 0 && (
                              <tr>
                                <td colSpan="4" className="px-3 sm:px-4 md:px-6 py-8 text-center text-sm text-slate-400 font-medium">No platform users found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: VENDOR RATE CARDS & VAULT */}
              {managementSubTab === 'VENDOR_RATES' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Vendor Rate Card Form (1 col) */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-base font-bold">🚚</span>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">Vendor Rate Card</h3>
                            <p className="text-xs text-slate-500">Set rates & upload compliance documents</p>
                          </div>
                        </div>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-100">Rate Setup</span>
                      </div>
                      <form onSubmit={handleCreateVendorRateCard} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Enter Vendor Name" 
                            value={vendorRateCardForm.vendorName} 
                            onChange={e => setVendorRateCardForm({...vendorRateCardForm, vendorName: e.target.value})} 
                            className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm" 
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                          <select 
                            value={vendorRateCardForm.vehicleType} 
                            onChange={e => setVendorRateCardForm({...vendorRateCardForm, vehicleType: e.target.value})} 
                            className="w-full border-slate-300 rounded-md shadow-sm p-2 border bg-white text-sm"
                          >
                            {['14-Ft Container', '19-Ft Container', '22-Ft Open', 'Pickup', 'Trailer', 'TATA Ace', 'Van (or Eeco)', '32-Ft MX Container', '32-Ft SXL Container', 'Other'].map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Rate Breakdown</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Toll Charge (₹)</label>
                              <input 
                                type="number" 
                                placeholder="0" 
                                value={vendorRateCardForm.tollCharge} 
                                onChange={e => setVendorRateCardForm({...vendorRateCardForm, tollCharge: e.target.value})} 
                                className="w-full border-slate-300 rounded-md p-2 border text-sm bg-white" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">DCM Charge (₹)</label>
                              <input 
                                type="number" 
                                placeholder="0" 
                                value={vendorRateCardForm.dcmCharge} 
                                onChange={e => setVendorRateCardForm({...vendorRateCardForm, dcmCharge: e.target.value})} 
                                className="w-full border-slate-300 rounded-md p-2 border text-sm bg-white" 
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Total Rate (₹)</label>
                            <input 
                              type="number" 
                              placeholder="Calculated automatically" 
                              value={vendorRateCardForm.totalRate !== '' ? vendorRateCardForm.totalRate : (Number(vendorRateCardForm.tollCharge || 0) + Number(vendorRateCardForm.dcmCharge || 0))} 
                              onChange={e => setVendorRateCardForm({...vendorRateCardForm, totalRate: e.target.value})} 
                              className="w-full border-slate-300 rounded-md p-2 border text-sm font-semibold bg-white text-emerald-700" 
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">Vehicle Details & Documents</label>
                          <input 
                            type="text" 
                            placeholder="Vehicle Reg No (e.g. MH-12-AB-1234)" 
                            value={vendorRateCardForm.vehicleDetails} 
                            onChange={e => setVendorRateCardForm({...vendorRateCardForm, vehicleDetails: e.target.value})} 
                            className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm" 
                          />
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Registration Certificate (RC)</label>
                              <input 
                                type="file" 
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={e => setVendorRateCardForm({...vendorRateCardForm, rcDocument: e.target.files[0]})} 
                                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Insurance Policy</label>
                              <input 
                                type="file" 
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={e => setVendorRateCardForm({...vendorRateCardForm, insuranceDocument: e.target.files[0]})} 
                                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">Driver Details & Documents</label>
                          <input 
                            type="text" 
                            placeholder="Driver Full Name" 
                            value={vendorRateCardForm.driverName} 
                            onChange={e => setVendorRateCardForm({...vendorRateCardForm, driverName: e.target.value})} 
                            className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm" 
                          />
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Commercial Driving Licence (DL)</label>
                              <input 
                                type="file" 
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={e => setVendorRateCardForm({...vendorRateCardForm, driverLicenseDocument: e.target.files[0]})} 
                                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Aadhaar Card / PAN Card</label>
                              <input 
                                type="file" 
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={e => setVendorRateCardForm({...vendorRateCardForm, driverIdDocument: e.target.files[0]})} 
                                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                              />
                            </div>
                          </div>
                        </div>

                        <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition font-bold text-sm shadow-sm">Save Vendor Rate Card</button>
                      </form>
                    </div>

                    {/* Saved Vendor Rate Cards & Documents Vault Table (2 cols) */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Saved Vendor Rate Cards & Compliance Vault</h3>
                          <p className="text-xs text-slate-500">View vendor rates & verified vehicle/driver certificates</p>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                          {vendorRateCards.length} Saved Cards
                        </span>
                      </div>

                      {vendorRateCards.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          No Vendor Rate Cards saved yet. Fill out the form to add vendor rates and documents.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                                <th className="p-3">Vendor / Vehicle</th>
                                <th className="p-3">Vehicle Reg & Docs</th>
                                <th className="p-3">Driver Details & Docs</th>
                                <th className="p-3">Rate Breakdown</th>
                                <th className="p-3 text-right">Total Rate</th>
                                <th className="p-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {vendorRateCards.map(card => (
                                <tr key={card._id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-medium text-slate-900">
                                    <div className="font-bold text-slate-900">{card.vendorName}</div>
                                    <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded mt-1 border border-slate-200">
                                      {card.vehicleType}
                                    </span>
                                  </td>

                                  <td className="p-3 text-slate-700">
                                    <div className="font-semibold text-slate-800 mb-1">
                                      {card.vehicleDetails || 'N/A'}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {card.rcDocumentUrl ? (
                                        <a
                                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${card.rcDocumentUrl}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold transition"
                                        >
                                          📄 RC
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">No RC</span>
                                      )}

                                      {card.insuranceDocumentUrl ? (
                                        <a
                                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${card.insuranceDocumentUrl}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold transition"
                                        >
                                          🛡️ Insurance
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">No Insurance</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="p-3 text-slate-700">
                                    <div className="font-semibold text-slate-800 mb-1">
                                      {card.driverName || 'N/A'}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {card.driverLicenseDocumentUrl ? (
                                        <a
                                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${card.driverLicenseDocumentUrl}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-semibold transition"
                                        >
                                          🪪 Commercial DL
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">No DL</span>
                                      )}

                                      {card.driverIdDocumentUrl ? (
                                        <a
                                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${card.driverIdDocumentUrl}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold transition"
                                        >
                                          🆔 Aadhaar/PAN
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">No ID</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="p-3 text-slate-600 text-xs">
                                    <div>Base: ₹{card.baseRate || 0}</div>
                                    <div>Toll: ₹{card.tollCharge || 0} | DCM: ₹{card.dcmCharge || 0}</div>
                                  </td>

                                  <td className="p-3 text-right font-black text-slate-900 text-base">
                                    ₹{(card.totalRate || 0).toLocaleString('en-IN')}
                                  </td>

                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => handleDeleteVendorRateCard(card._id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                                      title="Delete Vendor Rate Card"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: CLIENT RATE CONFIGURATIONS */}
              {managementSubTab === 'CLIENT_RATES' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-6">
                    <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Client Rate Card Matrix Configuration</h3>
                        <p className="text-sm text-slate-500 mt-1">Configure client-specific pricing tables for automated billing workflows.</p>
                      </div>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                        {templateType === 'TEMPLATE_A' ? 'Point-to-Point Route Pricing' : templateType === 'TEMPLATE_B' ? 'Store Hub / Zone Matrix' : 'Fixed Vehicle Rate'}
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">1. Select Client / Company</label>
                          <select 
                            value={selectedCompanyId} 
                            onChange={e => setSelectedCompanyId(e.target.value)} 
                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border bg-white font-medium text-slate-800"
                          >
                            <option value="MAIN">{subscriptionDetails?.companyName || 'Primary Workspace'} (Main HQ)</option>
                            {workspaces.filter(ws => !ws.isMainTenant).map(ws => (
                              <option key={ws._id} value={ws._id}>{ws.companyName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">2. Select Supplier</label>
                          <select 
                            value={selectedSupplierId} 
                            onChange={e => setSelectedSupplierId(e.target.value)} 
                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border bg-white font-medium text-slate-800"
                          >
                            <option value="NONE">-- No Supplier --</option>
                            {suppliers.map(sup => (
                              <option key={sup._id} value={sup._id}>{sup.supplierName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">3. Rate Card Template Type</label>
                          <select 
                            value={templateType} 
                            onChange={e => handleTemplateTypeChange(e.target.value)} 
                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border bg-white font-medium text-slate-800"
                          >
                            <option value="TEMPLATE_A">Route-Based Pricing (Point-to-Point)</option>
                            <option value="TEMPLATE_B">Store Hub / Zone Matrix Pricing</option>
                            <option value="TEMPLATE_D">Fix Vehicle Rate</option>
                          </select>
                        </div>
                      </div>

                      {/* Render Template A */}
                      {templateType === 'TEMPLATE_A' && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-md font-semibold text-slate-700">{editingRowIndex !== null ? 'Edit Route Row' : 'Add Route Row'}</h4>
                              {editingRowIndex !== null && (
                                <button type="button" onClick={cancelEdit} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded">
                                  Cancel Edit
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">From Origin</label>
                                <input type="text" placeholder="e.g. Mumbai" value={templateAForm.from} onChange={e => setTemplateAForm({...templateAForm, from: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">To Destination</label>
                                <input type="text" placeholder="e.g. Pune" value={templateAForm.to} onChange={e => setTemplateAForm({...templateAForm, to: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Type</label>
                                <select value={templateAForm.vehicleType} onChange={e => setTemplateAForm({...templateAForm, vehicleType: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border bg-white text-sm">
                                  {['Van (or Eeco)', 'TATA Ace', '14-Ft Container', '19-Ft Container', '22-Ft Open', 'Pickup', 'Trailer', '32-Ft MX Container', '32-Ft SXL Container'].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Billing Type</label>
                                <select value={templateAForm.billingType} onChange={e => setTemplateAForm({...templateAForm, billingType: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border bg-white text-sm">
                                  <option value="Fixed">Fixed Rate</option>
                                  <option value="Per KM">Per KM</option>
                                  <option value="Per Ton">Per Ton</option>
                                  <option value="Package">Package</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Fixed Kms</label>
                                <input type="number" placeholder="80" value={templateAForm.fixedKms} onChange={e => setTemplateAForm({...templateAForm, fixedKms: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Rate 12h (₹)</label>
                                <input type="number" placeholder="2500" value={templateAForm.rate12h} onChange={e => setTemplateAForm({...templateAForm, rate12h: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Rate 24h (₹)</label>
                                <input type="number" placeholder="4000" value={templateAForm.rate24h} onChange={e => setTemplateAForm({...templateAForm, rate24h: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Extra KM Rate (₹)</label>
                                <input type="number" placeholder="18" value={templateAForm.extraKmRate} onChange={e => setTemplateAForm({...templateAForm, extraKmRate: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Extra Hour Rate (₹)</label>
                                <input type="number" placeholder="150" value={templateAForm.extraHourRate} onChange={e => setTemplateAForm({...templateAForm, extraHourRate: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                            </div>

                            <button type="button" onClick={addOrUpdateRowTemplateA} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded text-sm transition">
                              {editingRowIndex !== null ? 'Update Route Row' : 'Add Route to Table'}
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-slate-200 text-xs sm:text-sm">
                              <thead className="bg-slate-100 font-semibold text-slate-700">
                                <tr>
                                  <th className="p-2 border">From</th>
                                  <th className="p-2 border">To</th>
                                  <th className="p-2 border">Vehicle</th>
                                  <th className="p-2 border">Billing Type</th>
                                  <th className="p-2 border">Fixed KM</th>
                                  <th className="p-2 border">12h Rate</th>
                                  <th className="p-2 border">24h Rate</th>
                                  <th className="p-2 border">Extra KM</th>
                                  <th className="p-2 border">Extra Hr</th>
                                  <th className="p-2 border text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 border-b">
                                    <td className="p-2 border">{row.from}</td>
                                    <td className="p-2 border">{row.to}</td>
                                    <td className="p-2 border">{row.vehicleType}</td>
                                    <td className="p-2 border">{row.billingType}</td>
                                    <td className="p-2 border">{row.fixedKms}</td>
                                    <td className="p-2 border font-medium text-slate-800">₹{row.rate12h}</td>
                                    <td className="p-2 border font-medium text-slate-800">₹{row.rate24h}</td>
                                    <td className="p-2 border">₹{row.extraKmRate}</td>
                                    <td className="p-2 border">₹{row.extraHourRate}</td>
                                    <td className="p-2 border text-center space-x-2">
                                      <button type="button" onClick={() => editRow(idx)} className="text-indigo-600 hover:underline">Edit</button>
                                      <button type="button" onClick={() => removeRow(idx)} className="text-red-600 hover:underline">Remove</button>
                                    </td>
                                  </tr>
                                ))}
                                {rows.length === 0 && (
                                  <tr>
                                    <td colSpan="10" className="p-4 text-center text-slate-400">No route rows configured. Use the form above to add pricing lines.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Render Template B */}
                      {templateType === 'TEMPLATE_B' && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-md font-semibold text-slate-700">{editingRowIndex !== null ? 'Edit Store Hub / Zone Row' : 'Add Store Hub / Zone Row'}</h4>
                              {editingRowIndex !== null && (
                                <button type="button" onClick={cancelEdit} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded">
                                  Cancel Edit
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Store Code</label>
                                <input type="text" placeholder="ST-101" value={templateBForm.storeCode} onChange={e => setTemplateBForm({...templateBForm, storeCode: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Store Name</label>
                                <input type="text" placeholder="Andheri Hub" value={templateBForm.storeName} onChange={e => setTemplateBForm({...templateBForm, storeName: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Location / Address</label>
                                <input type="text" placeholder="MIDC Zone" value={templateBForm.location} onChange={e => setTemplateBForm({...templateBForm, location: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                                <input type="text" placeholder="Mumbai" value={templateBForm.city} onChange={e => setTemplateBForm({...templateBForm, city: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">State</label>
                                <input type="text" placeholder="Maharashtra" value={templateBForm.state} onChange={e => setTemplateBForm({...templateBForm, state: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Zone</label>
                                <input type="text" placeholder="Zone-1" value={templateBForm.zone} onChange={e => setTemplateBForm({...templateBForm, zone: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">TATA Ace Rate (₹)</label>
                                <input type="number" placeholder="1200" value={templateBForm.tataAceRate} onChange={e => setTemplateBForm({...templateBForm, tataAceRate: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">TATA 407 Rate (₹)</label>
                                <input type="number" placeholder="2200" value={templateBForm.tata407Rate} onChange={e => setTemplateBForm({...templateBForm, tata407Rate: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">14-Ft Rate (₹)</label>
                                <input type="number" placeholder="3200" value={templateBForm.rate14ft} onChange={e => setTemplateBForm({...templateBForm, rate14ft: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">17-Ft Rate (₹)</label>
                                <input type="number" placeholder="3800" value={templateBForm.rate17ft} onChange={e => setTemplateBForm({...templateBForm, rate17ft: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">20-Ft Rate (₹)</label>
                                <input type="number" placeholder="4500" value={templateBForm.rate20ft} onChange={e => setTemplateBForm({...templateBForm, rate20ft: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">32-Ft MX Rate (₹)</label>
                                <input type="number" placeholder="6500" value={templateBForm.rate32ft7ton} onChange={e => setTemplateBForm({...templateBForm, rate32ft7ton: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                            </div>

                            <button type="button" onClick={addOrUpdateRowTemplateB} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded text-sm transition">
                              {editingRowIndex !== null ? 'Update Zone Row' : 'Add Zone Row to Table'}
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-slate-200 text-xs sm:text-sm">
                              <thead className="bg-slate-100 font-semibold text-slate-700">
                                <tr>
                                  <th className="p-2 border">Store Code</th>
                                  <th className="p-2 border">Store Name</th>
                                  <th className="p-2 border">Location</th>
                                  <th className="p-2 border">City</th>
                                  <th className="p-2 border">Zone</th>
                                  <th className="p-2 border">Ace Rate</th>
                                  <th className="p-2 border">14FT Rate</th>
                                  <th className="p-2 border">32FT Rate</th>
                                  <th className="p-2 border text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 border-b">
                                    <td className="p-2 border font-medium text-slate-800">{row.storeCode}</td>
                                    <td className="p-2 border">{row.storeName}</td>
                                    <td className="p-2 border">{row.location}</td>
                                    <td className="p-2 border">{row.city}</td>
                                    <td className="p-2 border">{row.zone}</td>
                                    <td className="p-2 border font-medium text-slate-800">₹{row.tataAceRate}</td>
                                    <td className="p-2 border font-medium text-slate-800">₹{row.rate14ft}</td>
                                    <td className="p-2 border font-medium text-slate-800">₹{row.rate32ft7ton}</td>
                                    <td className="p-2 border text-center space-x-2">
                                      <button type="button" onClick={() => editRow(idx)} className="text-indigo-600 hover:underline">Edit</button>
                                      <button type="button" onClick={() => removeRow(idx)} className="text-red-600 hover:underline">Remove</button>
                                    </td>
                                  </tr>
                                ))}
                                {rows.length === 0 && (
                                  <tr>
                                    <td colSpan="9" className="p-4 text-center text-slate-400">No store hub / zone rows configured. Use the form above to add pricing lines.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Render Template D */}
                      {templateType === 'TEMPLATE_D' && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-md font-semibold text-slate-700">{editingRowIndex !== null ? 'Edit Fixed Vehicle Rate Line' : 'Add Fixed Vehicle Rate Line'}</h4>
                              {editingRowIndex !== null && (
                                <button type="button" onClick={cancelEdit} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded">
                                  Cancel Edit
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">BU / Vertical</label>
                                <input type="text" placeholder="e.g. Retail Logistics" value={templateDForm.buVertical} onChange={e => setTemplateDForm({...templateDForm, buVertical: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Rate Type</label>
                                <select value={templateDForm.rateType} onChange={e => setTemplateDForm({...templateDForm, rateType: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border bg-white text-sm">
                                  <option value="Regular">Regular</option>
                                  <option value="Adhoc">Adhoc</option>
                                  <option value="Seasonal">Seasonal</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Origin / Hub</label>
                                <input type="text" placeholder="e.g. Bhiwandi Hub" value={templateDForm.origin} onChange={e => setTemplateDForm({...templateDForm, origin: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Type</label>
                                <select value={templateDForm.vehicleType} onChange={e => setTemplateDForm({...templateDForm, vehicleType: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border bg-white text-sm">
                                  {['TATA Ace', 'Van (or Eeco)', '14-Ft Container', '19-Ft Container', '22-Ft Open', 'Pickup', 'Trailer', '32-Ft MX Container', '32-Ft SXL Container'].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Fixed KM Allowance</label>
                                <input type="number" placeholder="1500" value={templateDForm.fixKm} onChange={e => setTemplateDForm({...templateDForm, fixKm: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Rate at Fixed KM (₹)</label>
                                <input type="number" placeholder="45000" value={templateDForm.rateAtFixKm} onChange={e => setTemplateDForm({...templateDForm, rateAtFixKm: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm font-semibold text-emerald-700" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Extra KM Rate (₹)</label>
                                <input type="number" placeholder="16" value={templateDForm.extraKmRate} onChange={e => setTemplateDForm({...templateDForm, extraKmRate: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Extra Hour Rate (₹)</label>
                                <input type="number" placeholder="120" value={templateDForm.extraHourRate} onChange={e => setTemplateDForm({...templateDForm, extraHourRate: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Agreed Days / Month</label>
                                <input type="number" placeholder="26" value={templateDForm.agreedDays} onChange={e => setTemplateDForm({...templateDForm, agreedDays: e.target.value})} className="w-full border-slate-300 rounded-md p-2 border text-sm" />
                              </div>
                            </div>

                            <button type="button" onClick={addOrUpdateRowTemplateD} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded text-sm transition">
                              {editingRowIndex !== null ? 'Update Fixed Rate Line' : 'Add Fixed Rate Line'}
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-slate-200 text-xs sm:text-sm">
                              <thead className="bg-slate-100 font-semibold text-slate-700">
                                <tr>
                                  <th className="p-2 border">BU / Vertical</th>
                                  <th className="p-2 border">Rate Type</th>
                                  <th className="p-2 border">Origin</th>
                                  <th className="p-2 border">Vehicle Type</th>
                                  <th className="p-2 border">Fix KM</th>
                                  <th className="p-2 border">Rate at Fix KM</th>
                                  <th className="p-2 border">Extra KM</th>
                                  <th className="p-2 border">Extra Hr</th>
                                  <th className="p-2 border text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 border-b">
                                    <td className="p-2 border font-medium text-slate-800">{row.buVertical}</td>
                                    <td className="p-2 border">{row.rateType}</td>
                                    <td className="p-2 border">{row.origin}</td>
                                    <td className="p-2 border">{row.vehicleType}</td>
                                    <td className="p-2 border">{row.fixKm}</td>
                                    <td className="p-2 border font-bold text-emerald-700">₹{row.rateAtFixKm}</td>
                                    <td className="p-2 border">₹{row.extraKmRate}</td>
                                    <td className="p-2 border">₹{row.extraHourRate}</td>
                                    <td className="p-2 border text-center space-x-2">
                                      <button type="button" onClick={() => editRow(idx)} className="text-indigo-600 hover:underline">Edit</button>
                                      <button type="button" onClick={() => removeRow(idx)} className="text-red-600 hover:underline">Remove</button>
                                    </td>
                                  </tr>
                                ))}
                                {rows.length === 0 && (
                                  <tr>
                                    <td colSpan="9" className="p-4 text-center text-slate-400">No fixed vehicle rate lines configured. Use the form above to add pricing lines.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Save Rate Card Configuration Button */}
                      <div className="pt-4 border-t border-slate-200 flex justify-end">
                        <button 
                          type="button" 
                          onClick={handleSaveRateCard} 
                          disabled={globalLoading} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-3 px-8 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {globalLoading ? 'Saving Rate Card Matrix...' : '💾 Save Rate Card Matrix'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'FLEET_MANAGEMENT' && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-800">Fleet Management</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Fleet Asset Form */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6">
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6">
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
                            <td colSpan="4" className="py-4 sm:py-6 md:py-8 text-center text-slate-400">No fleet assets found.</td>
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6">
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
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6">
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
                            <td colSpan="7" className="py-4 sm:py-6 md:py-8 text-center text-slate-400">No drivers found. Add one to get started.</td>
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
              <FinancialLedger planType={subscriptionDetails?.planType} />
            </div>
          )}

          {activeTab === 'SUPPLIERS' && (
            <div className="w-full h-full animate-fade-in">
              <SupplierManagement />
            </div>
          )}

          {activeTab === 'SUBSCRIPTION' && subscriptionDetails && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Your Subscription Plan</h2>
                  <p className="text-slate-500 mt-1">Manage your billing and access levels.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-bold">Current Plan</p>
                  <span className={`inline-block px-4 py-1 mt-1 rounded-full text-sm font-bold tracking-wide shadow-sm 
                    ${subscriptionDetails.planType === 'LIFETIME' ? 'bg-amber-500 text-white shadow-amber-500/30' :
                      subscriptionDetails.planType === 'PLATINUM' ? 'bg-indigo-600 text-white' : 
                      subscriptionDetails.planType === 'SILVER' ? 'bg-slate-200 text-slate-800' : 
                      'bg-emerald-100 text-emerald-800'}`}>
                    {subscriptionDetails.planType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Plan Details</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company Name</span>
                      <span className="font-medium text-slate-900">{subscriptionDetails.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">License Expires On</span>
                      <span className="font-medium text-slate-900">
                        {subscriptionDetails.planType === 'LIFETIME' 
                          ? 'Never Expires' 
                          : new Date(subscriptionDetails.licenseExpiresAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Users</span>
                      <span className="font-medium text-slate-900">{subscriptionDetails.currentUserCount} {subscriptionDetails.planType === 'TRIAL' ? '/ 3' : subscriptionDetails.planType === 'SILVER' ? '/ 10' : '(Unlimited)'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Included Features</h3>
                  <ul className="space-y-3">
                    {subscriptionDetails.planType === 'TRIAL' && (
                      <>
                        <li className="flex items-center text-slate-700"><span className="text-emerald-500 mr-2">✓</span> Up to 3 Administrative Users</li>
                        <li className="flex items-center text-slate-700"><span className="text-emerald-500 mr-2">✓</span> Basic Fleet Tracking</li>
                        <li className="flex items-center text-slate-700"><span className="text-emerald-500 mr-2">✓</span> Standard Rate Config</li>
                        <li className="flex items-center text-slate-400"><span className="mr-2">✗</span> Payroll Management</li>
                      </>
                    )}
                    {subscriptionDetails.planType === 'SILVER' && (
                      <>
                        <li className="flex items-center text-slate-700"><span className="text-emerald-500 mr-2">✓</span> Up to 10 Administrative Users</li>
                        <li className="flex items-center text-slate-700"><span className="text-emerald-500 mr-2">✓</span> Advanced Fleet Tracking</li>
                        <li className="flex items-center text-slate-700"><span className="text-emerald-500 mr-2">✓</span> Payroll & Invoicing</li>
                        <li className="flex items-center text-slate-400"><span className="mr-2">✗</span> Dedicated Account Manager</li>
                      </>
                    )}
                    {subscriptionDetails.planType === 'PLATINUM' && (
                      <>
                        <li className="flex items-center text-slate-700"><span className="text-indigo-600 font-bold mr-2">✦</span> Unlimited Users</li>
                        <li className="flex items-center text-slate-700"><span className="text-indigo-600 font-bold mr-2">✦</span> Full Analytics Suite & Custom Domains</li>
                        <li className="flex items-center text-slate-700"><span className="text-indigo-600 font-bold mr-2">✦</span> Financial Engine & Compliance Vault</li>
                        <li className="flex items-center text-slate-700"><span className="text-indigo-600 font-bold mr-2">✦</span> 24/7 Priority Support</li>
                      </>
                    )}
                    {subscriptionDetails.planType === 'LIFETIME' && (
                      <>
                        <li className="flex items-center text-slate-700"><span className="text-amber-500 font-bold mr-2">★</span> Infinite Users</li>
                        <li className="flex items-center text-slate-700"><span className="text-amber-500 font-bold mr-2">★</span> No Recurring Fees Ever</li>
                        <li className="flex items-center text-slate-700"><span className="text-amber-500 font-bold mr-2">★</span> Lifetime Platinum Features</li>
                        <li className="flex items-center text-slate-700"><span className="text-amber-500 font-bold mr-2">★</span> VIP White-Glove Onboarding</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {subscriptionDetails.planType === 'LIFETIME' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6 mt-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Add Sister Company (Lifetime Feature)</h3>
                  <form onSubmit={handleCreateSisterCompany} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sister Company Name *</label>
                        <input type="text" required value={sisterCompanyForm.companyName} onChange={e => setSisterCompanyForm({...sisterCompanyForm, companyName: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="e.g. PROHIT Logistics Pvt Ltd" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                        <input type="text" value={sisterCompanyForm.gstin} onChange={e => setSisterCompanyForm({...sisterCompanyForm, gstin: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="e.g. 27AAKFI1710K1ZE" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">PAN</label>
                        <input type="text" value={sisterCompanyForm.pan} onChange={e => setSisterCompanyForm({...sisterCompanyForm, pan: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="e.g. AAKFI1710K" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                        <textarea required value={sisterCompanyForm.address} onChange={e => setSisterCompanyForm({...sisterCompanyForm, address: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" rows="2" placeholder="Full Registered Address" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                        <input type="text" value={sisterCompanyForm.state} onChange={e => setSisterCompanyForm({...sisterCompanyForm, state: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="e.g. Maharashtra" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State Code</label>
                        <input type="text" value={sisterCompanyForm.stateCode} onChange={e => setSisterCompanyForm({...sisterCompanyForm, stateCode: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="e.g. 27" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                        <input type="text" value={sisterCompanyForm.contactNumber} onChange={e => setSisterCompanyForm({...sisterCompanyForm, contactNumber: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="Primary Contact" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Custom Invoice Template (PDF) - Optional</label>
                        <input type="file" id="sisterInvoiceTemplate" accept=".pdf" onChange={e => setSisterCompanyForm({...sisterCompanyForm, invoiceTemplate: e.target.files[0]})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-1.5 border bg-white" />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button type="submit" disabled={sisterCompanyLoading} className="bg-indigo-600 text-white py-2 px-3 sm:px-4 md:px-6 rounded-md hover:bg-indigo-700 transition font-medium disabled:opacity-50">
                        {sisterCompanyLoading ? 'Creating Workspace...' : 'Create Workspace'}
                      </button>
                    </div>
                  </form>
                  <p className="text-xs text-slate-500 mt-2">You can register up to 3 distinct corporate workspaces under your tenant profile.</p>
                </div>
              )}

              {/* WORKSPACE DIRECTORY */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 mt-6 overflow-hidden">
                <div className="p-3 sm:p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">Workspace Directory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase font-medium">
                      <tr>
                        <th className="px-3 sm:px-4 md:px-6 py-4">Workspace Name</th>
                        <th className="px-3 sm:px-4 md:px-6 py-4">Type</th>
                        <th className="px-3 sm:px-4 md:px-6 py-4">GSTIN</th>
                        <th className="px-3 sm:px-4 md:px-6 py-4">Contact</th>
                        <th className="px-3 sm:px-4 md:px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Primary Workspace */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 sm:px-4 md:px-6 py-4 font-medium text-slate-900 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                          {subscriptionDetails.companyName}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-4"><span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded">Primary</span></td>
                        <td className="px-3 sm:px-4 md:px-6 py-4 text-slate-500">{subscriptionDetails.gstin || '-'}</td>
                        <td className="px-3 sm:px-4 md:px-6 py-4 text-slate-500">{subscriptionDetails.contactNumber || subscriptionDetails.registeredMobile || '-'}</td>
                        <td className="px-3 sm:px-4 md:px-6 py-4 text-right">
                          <button onClick={() => {
                            setEditingWorkspace({...subscriptionDetails, isPrimary: true});
                            setEditWorkspaceForm({
                              companyName: subscriptionDetails.companyName || '',
                              gstin: subscriptionDetails.gstin || '',
                              pan: subscriptionDetails.pan || '',
                              address: subscriptionDetails.address || '',
                              state: subscriptionDetails.state || '',
                              stateCode: subscriptionDetails.stateCode || '',
                              contactNumber: (subscriptionDetails.contactNumber && subscriptionDetails.contactNumber.trim() !== '') ? subscriptionDetails.contactNumber : (subscriptionDetails.registeredMobile || ''),
                              logoUrl: subscriptionDetails.brandingOptions?.logoUrl || '',
                              logoFile: null,
                              dominantHexColor: subscriptionDetails.brandingOptions?.dominantHexColor || '#3b82f6',
                              requireDriverMobileApp: subscriptionDetails.requireDriverMobileApp || false
                            });
                          }} className="text-indigo-600 hover:text-indigo-900 font-medium mr-4">Edit</button>
                        </td>
                      </tr>
                      {/* Sister Companies */}
                      {workspaces.slice(1).map(ws => (
                        <tr key={ws._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 sm:px-4 md:px-6 py-4 font-medium text-slate-700 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>
                            {ws.companyName}
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-4"><span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded">Sister</span></td>
                          <td className="px-3 sm:px-4 md:px-6 py-4 text-slate-500">{ws.gstin || '-'}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-4 text-slate-500">{ws.contactNumber || '-'}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-4 text-right">
                            <button onClick={() => {
                              setEditingWorkspace({...ws, isPrimary: false});
                              setEditWorkspaceForm({
                                companyName: ws.companyName || '',
                                gstin: ws.gstin || '',
                                pan: ws.pan || '',
                                address: ws.address || '',
                                state: ws.state || '',
                                stateCode: ws.stateCode || '',
                                contactNumber: (ws.contactNumber && ws.contactNumber.trim() !== '') ? ws.contactNumber : (subscriptionDetails.registeredMobile || ''),
                                requireDriverMobileApp: ws.requireDriverMobileApp || false
                              });
                            }} className="text-indigo-600 hover:text-indigo-900 font-medium mr-4">Edit</button>
                            <button onClick={() => handleDeleteWorkspace(ws._id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Workspace Modal */}
              {editingWorkspace && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-3 sm:p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Edit Workspace</h3>
                        <p className="text-sm text-slate-500">Updating details for {editingWorkspace.companyName}</p>
                      </div>
                      <button onClick={() => setEditingWorkspace(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-light">&times;</button>
                    </div>
                    <div className="p-3 sm:p-4 md:p-6 overflow-y-auto">
                      <form id="editWorkspaceForm" onSubmit={handleUpdateWorkspace} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                            <input type="text" required value={editWorkspaceForm.companyName} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, companyName: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                            <input type="text" value={editWorkspaceForm.gstin} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, gstin: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">PAN</label>
                            <input type="text" value={editWorkspaceForm.pan} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, pan: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                            <textarea required value={editWorkspaceForm.address} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, address: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" rows="2" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                            <input type="text" value={editWorkspaceForm.state} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, state: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">State Code</label>
                            <input type="text" value={editWorkspaceForm.stateCode} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, stateCode: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                            <input type="text" value={editWorkspaceForm.contactNumber} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, contactNumber: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                          </div>
                        </div>
                        {editingWorkspace.isPrimary && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-800 mb-3">Branding Options</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Corporate Logo</label>
                                <div className="flex flex-col gap-2">
                                  <input type="url" placeholder="URL: https://example.com/logo.png" value={editWorkspaceForm.logoUrl} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, logoUrl: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                                  <span className="text-xs text-slate-500 text-center">- OR UPLOAD -</span>
                                  <input type="file" accept="image/*" onChange={e => setEditWorkspaceForm({...editWorkspaceForm, logoFile: e.target.files[0]})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Theme Hex Color</label>
                                <div className="flex gap-2">
                                  <input type="color" value={editWorkspaceForm.dominantHexColor} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, dominantHexColor: e.target.value})} className="h-9 w-9 rounded border-0 p-0 cursor-pointer" />
                                  <input type="text" placeholder="#3b82f6" value={editWorkspaceForm.dominantHexColor} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, dominantHexColor: e.target.value})} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Require Driver App Flag (Only for Primary Workspace as requested) */}
                        {editingWorkspace.isPrimary && (
                          <div className="mt-4 flex items-center space-x-3">
                            <input type="checkbox" id="editRequireDriverApp" checked={editWorkspaceForm.requireDriverMobileApp || false} onChange={e => setEditWorkspaceForm({...editWorkspaceForm, requireDriverMobileApp: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                            <label htmlFor="editRequireDriverApp" className="text-sm font-medium text-slate-700 cursor-pointer">Require driver Mobile app</label>
                          </div>
                        )}
                        {subscriptionDetails.planType === 'LIFETIME' && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Custom Invoice Template (PDF)</label>
                            <div className="flex gap-2 items-center">
                              <input type="file" accept=".pdf" onChange={e => {
                                if (e.target.files[0]) {
                                  handleUpdateInvoiceFormat(editingWorkspace._id, e.target.files[0], editingWorkspace.isPrimary);
                                }
                              }} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-1.5 border" />
                            </div>
                            {editingWorkspace.customInvoiceTemplateUrl && (
                              <p className="text-xs text-green-600 mt-1">A custom template is currently active.</p>
                            )}
                          </div>
                        )}
                      </form>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button type="button" onClick={() => setEditingWorkspace(null)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Cancel</button>
                      <button type="submit" form="editWorkspaceForm" disabled={editWorkspaceLoading} className="bg-indigo-600 text-white py-2 px-3 sm:px-4 md:px-6 rounded-md hover:bg-indigo-700 transition font-medium disabled:opacity-50">
                        {editWorkspaceLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {subscriptionDetails.planType !== 'LIFETIME' ? (
                <div className="bg-slate-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 text-center mt-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>
                  
                  <h3 className="text-2xl font-bold mb-2 relative z-10">Ready for more?</h3>
                  <p className="text-slate-300 mb-8 max-w-2xl mx-auto relative z-10">Upgrade your plan at any time to instantly unlock higher user limits and premium operations capabilities.</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                    {/* Free Trial is Rank 1, so no upgrades to Free Trial */}
                    
                    {/* Upgrade to Silver (Rank 2) - Only show if current is Rank 1 (TRIAL) */}
                    {subscriptionDetails.planType === 'TRIAL' && (
                      <button onClick={() => handleUpgradePlan('SILVER')} className="px-3 sm:px-4 md:px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-lg transition-colors shadow-md">
                        Upgrade to Silver Plan
                      </button>
                    )}

                    {/* Upgrade to Platinum (Rank 3) - Only show if current is Rank 1 or 2 */}
                    {(subscriptionDetails.planType === 'TRIAL' || subscriptionDetails.planType === 'SILVER') && (
                      <button onClick={() => handleUpgradePlan('PLATINUM')} className="px-4 sm:px-6 md:px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/30">
                        Go PLATINUM (Unlimited)
                      </button>
                    )}

                    {/* Upgrade to Lifetime (Rank 4) - Always show unless already on Lifetime */}
                    <button onClick={() => handleUpgradePlan('LIFETIME')} className="px-4 sm:px-6 md:px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/30">
                      Unlock LIFETIME
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 sm:p-6 md:p-8 text-center mt-8 relative overflow-hidden">
                  <h3 className="text-2xl font-bold mb-2 text-amber-600">Lifetime Member</h3>
                  <p className="text-amber-700/80 max-w-2xl mx-auto">You have unlocked the absolute highest tier. Thank you for your infinite commitment to PROHIT CoreTech!</p>
                </div>
              )}
            </div>
          )}

          {/* Upgrade Checkout Modal */}
          {pendingUpgradePlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex">
                  {/* Left Side: Order Summary */}
                  <div className="w-1/2 p-4 sm:p-6 md:p-8 bg-slate-50 border-r border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Upgrade Order</h3>
                    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                      <h4 className="font-bold text-slate-800 text-lg">{pendingUpgradePlan} Plan</h4>
                      <p className="text-slate-500 text-sm mb-4">PROHIT CoreTech Enterprise Access</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600">Base Price</span>
                        <span className="font-medium text-slate-900">₹{getUpgradePrice(pendingUpgradePlan).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-600">GST (18%)</span>
                        <span className="font-medium text-slate-900">₹{(getUpgradePrice(pendingUpgradePlan) * 0.18).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xl font-bold text-slate-900">
                        <span>Total Payable</span>
                        <span className="text-teal-600">₹{(getUpgradePrice(pendingUpgradePlan) * 1.18).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600">
                      <li className="flex items-center"><span className="text-teal-500 mr-2">✓</span> Instant access to new features</li>
                      <li className="flex items-center"><span className="text-teal-500 mr-2">✓</span> Pro-rated license extension</li>
                      <li className="flex items-center"><span className="text-teal-500 mr-2">✓</span> Secure 256-bit encrypted transaction</li>
                    </ul>
                  </div>

                  {/* Right Side: Payment Form */}
                  <div className="w-1/2 p-4 sm:p-6 md:p-8 relative">
                    <button onClick={() => setPendingUpgradePlan(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Payment Details</h3>
                    
                    <div className="flex space-x-2 border-b border-slate-200 mb-6">
                      <button type="button" onClick={() => setCheckoutTab('card')} className={`pb-3 px-4 font-semibold text-sm transition-colors relative ${checkoutTab === 'card' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Credit Card
                        {checkoutTab === 'card' && <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-500 rounded-t-full"></div>}
                      </button>
                      <button type="button" onClick={() => setCheckoutTab('upi')} className={`pb-3 px-4 font-semibold text-sm transition-colors relative ${checkoutTab === 'upi' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        UPI
                        {checkoutTab === 'upi' && <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-500 rounded-t-full"></div>}
                      </button>
                    </div>

                    <form onSubmit={processUpgradeCheckout}>
                      {checkoutTab === 'card' ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cardholder Name</label>
                            <input type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Jane Doe" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                            <input type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="**** **** **** 4242" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                              <input type="text" autoComplete="off" maxLength="5" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="MM/YY" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">CVV</label>
                              <input type="text" autoComplete="off" maxLength="4" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="***" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-slate-700 mb-1">UPI ID</label>
                          <input type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="username@upi" />
                        </div>
                      )}

                      <button type="submit" disabled={checkoutLoading} className="w-full mt-8 bg-teal-600 hover:bg-teal-500 text-white font-bold text-lg py-3 rounded-xl transition-all shadow-lg flex justify-center items-center disabled:opacity-70">
                        {checkoutLoading ? 'Processing...' : `Pay ₹${(getUpgradePrice(pendingUpgradePlan) * 1.18).toLocaleString('en-IN', {minimumFractionDigits: 2})}`}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
