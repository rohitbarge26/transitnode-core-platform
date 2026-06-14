import React, { useState } from 'react';
import { useTenantBranding } from '../../context/TenantBrandingContext';
// import axios from 'axios';

const TenantBrandingConfigurator = () => {
  const { branding, setBranding } = useTenantBranding();
  const [hexColor, setHexColor] = useState(branding.dominantHexColor);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // In a real application, make a request to update the branding options on the backend
      // await axios.post('/api/saas/update-branding', { dominantHexColor: hexColor, logoUrl });
      
      setBranding({ dominantHexColor: hexColor, logoUrl });
      setMessage('Branding updated successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Failed to update branding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-slate-900 min-h-screen text-slate-100 font-sans">
      <h2 className="text-3xl font-bold mb-8">Workspace Branding Configuration</h2>
      
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
        <form onSubmit={handleSave} className="space-y-8">
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Corporate Dominant Hex Color</label>
            <div className="flex items-center space-x-4">
              <input 
                type="color" 
                value={hexColor} 
                onChange={(e) => setHexColor(e.target.value)} 
                className="w-16 h-16 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input 
                type="text" 
                value={hexColor} 
                onChange={(e) => setHexColor(e.target.value)} 
                className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 font-mono"
                placeholder="#3b82f6"
              />
            </div>
            <p className="mt-2 text-sm text-slate-400">Used for primary action buttons, highlights, and active states.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Corporate Logo URL</label>
            <input 
              type="url" 
              value={logoUrl} 
              onChange={(e) => setLogoUrl(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="https://example.com/logo.png"
            />
            <p className="mt-2 text-sm text-slate-400">Provide a direct URL to a hosted logo image. (Alternatively, you could add file upload logic here).</p>
          </div>

          {logoUrl && (
            <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-lg inline-block">
              <p className="text-sm text-slate-400 mb-2">Preview:</p>
              <img src={logoUrl} alt="Logo Preview" className="max-h-16 object-contain" />
            </div>
          )}

          <div className="pt-4 border-t border-slate-700">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
              style={{ backgroundColor: hexColor }}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
            {message && (
              <span className={`ml-4 text-sm ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                {message}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantBrandingConfigurator;
