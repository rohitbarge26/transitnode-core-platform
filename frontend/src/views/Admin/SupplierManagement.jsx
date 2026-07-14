import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    supplierName: '',
    gstin: '',
    pan: '',
    address: '',
    locationCode: '',
    state: '',
    stateCode: '',
    mobileNumber: '',
    emailId: '',
    identifierType: '',
    supportedBillingCycles: [],
    supportedInvoiceTypes: []
  });

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('/api/admin/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e, fieldName) => {
    const value = e.target.value;
    setFormData((prev) => {
      const currentList = prev[fieldName];
      if (e.target.checked) {
        return { ...prev, [fieldName]: [...currentList, value] };
      } else {
        return { ...prev, [fieldName]: currentList.filter(item => item !== value) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        await axios.put(`/api/admin/suppliers/${editingId}`, formData);
      } else {
        await axios.post('/api/admin/suppliers/create', formData);
      }
      setFormData({
        supplierName: '', gstin: '', pan: '', address: '', locationCode: '', state: '', stateCode: '',
        mobileNumber: '', emailId: '', identifierType: '', supportedBillingCycles: [], supportedInvoiceTypes: []
      });
      setShowForm(false);
      setEditingId(null);
      fetchSuppliers();
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError(err.response.data.error || 'Access Denied: Please upgrade your plan.');
      } else {
        setError(`Failed to ${editingId ? 'update' : 'create'} supplier. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      supplierName: supplier.supplierName || '',
      gstin: supplier.gstin || '',
      pan: supplier.pan || '',
      address: supplier.address || '',
      locationCode: supplier.locationCode || '',
      state: supplier.state || '',
      stateCode: supplier.stateCode || '',
      mobileNumber: supplier.mobileNumber || '',
      emailId: supplier.emailId || '',
      identifierType: supplier.identifierType || '',
      supportedBillingCycles: supplier.supportedBillingCycles || [],
      supportedInvoiceTypes: supplier.supportedInvoiceTypes || []
    });
    setEditingId(supplier._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await axios.delete(`/api/admin/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError(err.response.data.error || 'Access Denied.');
      } else {
        setError('Failed to delete supplier. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 md:p-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Supplier Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your corporate vendors and suppliers</p>
        </div>
        <button 
          onClick={() => { 
            setShowForm(!showForm); 
            setError(null); 
            if (showForm) {
              setEditingId(null);
              setFormData({
                supplierName: '', gstin: '', pan: '', address: '', locationCode: '', state: '', stateCode: '',
                mobileNumber: '', emailId: '', identifierType: '', supportedBillingCycles: [], supportedInvoiceTypes: []
              });
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Supplier'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Feature Restricted:</strong> {error}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-50 p-3 sm:p-4 md:p-6 rounded-lg mb-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">{editingId ? 'Update Supplier Details' : 'New Supplier Details'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name *</label>
              <input required name="supplierName" value={formData.supplierName} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" placeholder="e.g. Flipkart India Private Limited" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
              <input name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" placeholder="e.g. 27AABCF8078M1Z1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PAN</label>
              <input name="pan" value={formData.pan} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" placeholder="e.g. AABCF8078M" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location Code</label>
              <input name="locationCode" value={formData.locationCode} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" placeholder="e.g. 2700554" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
              <input name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" placeholder="e.g. 9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label>
              <input name="emailId" type="email" value={formData.emailId} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" placeholder="e.g. vendor@company.com" />
            </div>
            
            {/* Dynamic Config Fields */}
            <div className="md:col-span-2 border-t border-slate-200 mt-2 pt-4">
              <h4 className="text-md font-semibold text-slate-800 mb-3">Dynamic Configuration</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Identifier Type</label>
              <select name="identifierType" value={formData.identifierType} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900">
                <option value="">-- No specific identifier --</option>
                <option value="Store Code">Store Code</option>
                <option value="Hub Name">Hub Name</option>
                <option value="Vendor Code">Vendor Code</option>
                <option value="Client / Store Code">Client / Store Code</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supported Billing Cycles</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center text-sm text-slate-700">
                  <input type="checkbox" value="DAILY" checked={formData.supportedBillingCycles.includes('DAILY')} onChange={(e) => handleCheckboxChange(e, 'supportedBillingCycles')} className="mr-2" />
                  Daily
                </label>
                <label className="flex items-center text-sm text-slate-700">
                  <input type="checkbox" value="MONTHLY" checked={formData.supportedBillingCycles.includes('MONTHLY')} onChange={(e) => handleCheckboxChange(e, 'supportedBillingCycles')} className="mr-2" />
                  Monthly
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supported Invoice Types</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center text-sm text-slate-700">
                  <input type="checkbox" value="LR_COPY" checked={formData.supportedInvoiceTypes.includes('LR_COPY')} onChange={(e) => handleCheckboxChange(e, 'supportedInvoiceTypes')} className="mr-2" />
                  LR Copy
                </label>
                <label className="flex items-center text-sm text-slate-700">
                  <input type="checkbox" value="MONTHLY_INVOICE" checked={formData.supportedInvoiceTypes.includes('MONTHLY_INVOICE')} onChange={(e) => handleCheckboxChange(e, 'supportedInvoiceTypes')} className="mr-2" />
                  Monthly Invoice
                </label>
              </div>
            </div>
            {/* End Dynamic Config Fields */}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" rows="3" placeholder="Block No. B6 & B8, Acron Warehouse..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <input name="state" value={formData.state} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" placeholder="e.g. Maharashtra" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State Code</label>
              <input name="stateCode" value={formData.stateCode} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white text-slate-900" placeholder="e.g. 27" />
            </div>
            
            <div className="md:col-span-2 mt-4 flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium">Cancel</button>
              <button type="submit" disabled={loading} className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {loading ? 'Saving...' : (editingId ? 'Update Supplier' : 'Save Supplier')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suppliers List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Supplier Name</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GSTIN</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">State</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mobile Number</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 text-center text-sm text-slate-500">No suppliers found. Click "+ Add Supplier" to create one.</td>
              </tr>
            ) : (
              suppliers.map(s => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.supplierName}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.gstin || '-'}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.state || '-'}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.mobileNumber || '-'}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(s)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierManagement;
