import React, { useState, useContext } from 'react';
import axios from 'axios';
import { I18nContext, DriverAuthContext } from '../../App';

const ReceiptUploader = ({ tripId }) => {
  const { t } = useContext(I18nContext);
  const { driverToken } = useContext(DriverAuthContext);
  
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleCapture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('targetId', tripId); // Using Trip ID as the target
    formData.append('targetType', 'VEHICLE');
    formData.append('documentType', 'FUEL_TOLL_SLIP');
    formData.append('expiryDate', new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]); // Dummy expiry 1 year from now

    try {
      await axios.post('http://192.168.29.237:3000/api/admin/compliance/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${driverToken}`
        }
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative group">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        onChange={handleCapture}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        disabled={uploading}
      />
      
      <div className={`w-full h-full flex flex-col items-center justify-center p-3 rounded-[1.5rem] border-2 border-dashed transition-all duration-300 ${success ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : error ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300 group-hover:border-indigo-400 group-hover:bg-indigo-500/10'}`}>
        <div className="relative">
          {uploading ? (
            <svg className="animate-spin h-8 w-8 text-indigo-400 mb-2 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : success ? (
            <svg className="w-8 h-8 mb-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-8 h-8 mb-2 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          )}
        </div>
        
        <span className="text-[0.7rem] font-bold text-center uppercase tracking-wider mt-1">
          {uploading ? 'Uploading...' : success ? 'Uploaded!' : error ? error : t('upload_slip')}
        </span>
      </div>
    </div>
  );
};

export default ReceiptUploader;
