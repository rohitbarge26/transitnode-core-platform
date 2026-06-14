import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ComplianceVault = () => {
  const token = localStorage.getItem('token');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    targetType: 'VEHICLE',
    targetId: '',
    documentType: 'INSURANCE',
    expiryDate: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/admin/compliance/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please attach a document file.");
      return;
    }
    if (!form.expiryDate) {
      alert("Expiry date is mandatory.");
      return;
    }
    if (!form.targetId) {
      alert("Target ID is required.");
      return;
    }

    const formData = new FormData();
    formData.append('targetType', form.targetType);
    formData.append('targetId', form.targetId);
    formData.append('documentType', form.documentType);
    formData.append('expiryDate', form.expiryDate);
    formData.append('document', file);

    try {
      await axios.post('http://localhost:3000/api/admin/compliance/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Document uploaded successfully!');
      setForm({
        ...form,
        targetId: '',
        expiryDate: ''
      });
      setFile(null);
      fetchDocuments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload document');
    }
  };

  const getStatusBadge = (expiryDate) => {
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

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(false);

  const handleDocClick = async (doc) => {
    setSelectedDoc(doc);
    if (doc.documentType === 'FUEL_TOLL_SLIP' && doc.targetId.startsWith('TR-')) {
      setLoadingTrip(true);
      try {
        const res = await axios.get(`http://localhost:3000/api/finance/trips/${doc.targetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTripDetails(res.data.data);
      } catch (err) {
        console.error('Failed to fetch trip details', err);
        setTripDetails(null);
      } finally {
        setLoadingTrip(false);
      }
    } else {
      setTripDetails(null);
    }
  };

  const getDocIcon = (type) => {
    switch (type) {
      case 'FUEL_TOLL_SLIP': return '⛽';
      case 'INSURANCE': return '🛡️';
      case 'DL': return '🪪';
      case 'PUC': return '🍃';
      case 'NATIONAL_PERMIT': return '📜';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-8 relative">
      <h2 className="text-xl font-bold text-slate-800">Compliance Document Vault</h2>

      {/* Upload Portal */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Upload New Document</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Entity</label>
              <select 
                value={form.targetType} 
                onChange={(e) => setForm({...form, targetType: e.target.value})}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white"
              >
                <option value="VEHICLE">Vehicle Asset</option>
                <option value="SHIPMENT">Shipment Log</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {form.targetType === 'VEHICLE' ? 'Vehicle Registration Number' : 'Shipment ID'}
              </label>
              <input 
                type="text" 
                required 
                value={form.targetId}
                onChange={(e) => setForm({...form, targetId: e.target.value})}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" 
                placeholder={form.targetType === 'VEHICLE' ? "e.g., MH 04 AB 1234" : "e.g., DRV-001"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Category</label>
              <select 
                value={form.documentType} 
                onChange={(e) => setForm({...form, documentType: e.target.value})}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white"
              >
                <option value="INSURANCE">Insurance Policy</option>
                <option value="DL">Driving License</option>
                <option value="NATIONAL_PERMIT">National Permit</option>
                <option value="PUC">Pollution (PUC)</option>
                <option value="FUEL_TOLL_SLIP">Fuel / Toll Slip</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
              <input 
                type="date" 
                required 
                value={form.expiryDate}
                onChange={(e) => setForm({...form, expiryDate: e.target.value})}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" 
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <label className="block text-sm font-medium text-slate-700 mb-2">Attach Document (PDF, JPG, PNG)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:border-indigo-500 transition-colors bg-slate-50 relative">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none px-1">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">
                  {file ? file.name : 'PNG, JPG, PDF up to 10MB'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                type="submit" 
                className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition font-bold shadow-md"
                disabled={loading}
              >
                Secure & Upload Document
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Audit Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Document Audit Matrix</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Target</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Document Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-indigo-50 cursor-pointer transition-colors" onClick={() => handleDocClick(doc)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline">{doc.targetId}</div>
                      <div className="text-xs text-slate-500">{doc.targetType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-medium flex items-center gap-2">
                        <span className="text-lg">{getDocIcon(doc.documentType)}</span>
                        {doc.documentType.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{new Date(doc.expiryDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(doc.expiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocClick(doc);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100 transition-colors"
                      >
                        Quick View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                    No compliance documents found in the vault.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Panel */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDoc(null)} />
          
          <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
            <div className="w-full h-full bg-white shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span>{getDocIcon(selectedDoc.documentType)}</span>
                  Document Details
                </h2>
                <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Document Viewer */}
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative group">
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`http://localhost:3000${selectedDoc.fileUrl}`} target="_blank" rel="noreferrer" className="bg-white/90 backdrop-blur text-indigo-600 p-2 rounded-lg shadow font-bold text-xs hover:bg-indigo-50 border border-slate-200">
                      Open Full Size
                    </a>
                  </div>
                  <img src={`http://localhost:3000${selectedDoc.fileUrl}`} alt="Document" className="w-full h-64 object-cover cursor-pointer" onClick={() => window.open(`http://localhost:3000${selectedDoc.fileUrl}`, '_blank')} />
                </div>

                {/* Document Metadata */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Type</p>
                      <p className="font-medium text-slate-800">{selectedDoc.targetType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target ID</p>
                      <p className="font-bold text-indigo-600">{selectedDoc.targetId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Document Type</p>
                      <p className="font-medium text-slate-800">{selectedDoc.documentType.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expiry Date</p>
                      <p className="font-medium text-slate-800">{new Date(selectedDoc.expiryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Context (If applicable) */}
                {selectedDoc.documentType === 'FUEL_TOLL_SLIP' && (
                  <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl overflow-hidden">
                    <div className="bg-indigo-100/50 px-4 py-3 border-b border-indigo-100">
                      <h3 className="font-bold text-indigo-800 text-sm uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        Trip Context
                      </h3>
                    </div>
                    <div className="p-4">
                      {loadingTrip ? (
                        <div className="flex justify-center items-center py-8">
                          <svg className="animate-spin h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                      ) : tripDetails ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-1 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-md shadow-sm">
                              {tripDetails.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                              <div className="w-0.5 h-6 bg-indigo-200"></div>
                              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-bold text-slate-800">{tripDetails.logistics?.transport?.origin || 'Unknown'}</p>
                              <p className="text-sm font-bold text-slate-800">{tripDetails.logistics?.transport?.destination || 'Unknown'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-100">
                            <div>
                              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Driver</p>
                              <p className="text-sm font-medium text-slate-800">{tripDetails.logistics?.transport?.driverName || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Vehicle</p>
                              <p className="text-sm font-medium text-slate-800">{tripDetails.logistics?.transport?.vehicleNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Commodity</p>
                              <p className="text-sm font-medium text-slate-800">{tripDetails.logistics?.transport?.commodityType || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Pocket Advance</p>
                              <p className="text-sm font-bold text-emerald-600">₹{tripDetails.accounting?.driverAdvanceCash || 0}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">No trip details available for this ID.</p>
                      )}
                    </div>
                  </div>
                )}

              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComplianceVault;
