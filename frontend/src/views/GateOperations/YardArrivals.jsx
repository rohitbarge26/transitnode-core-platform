import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const YardArrivals = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('token');
      // For gate clerk, we can just fetch all shipments and filter locally for now
      // A dedicated endpoint would be better, but we can reuse listShipments
      const res = await axios.get('/api/shipments?timeRange=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeTrips = res.data.shipments.filter(s => ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED'].includes(s.status));
      setTrips(activeTrips);
    } catch (err) {
      console.error('Error fetching active trips', err);
    }
  };

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(fetchTrips, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleVerifyOtp = async () => {
    if (!selectedTrip || !otp) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        trackingNumber: selectedTrip.trackingNumber,
        userTypedOtp: otp
      };

      await axios.post('/api/transports/gate-clerk/verify', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Success! Trip ${selectedTrip.trackingNumber} closed. Unloading authorized.`);
      setSelectedTrip(null);
      setOtp('');
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-3 sm:p-4 md:p-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Yard Arrivals & Verification Portal</h1>
          <p className="text-sm text-slate-400">Desktop Gate Clerk Interface</p>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Arrived Fleet Tracker */}
        <div className="w-1/3 min-w-[400px] border-r border-slate-200 bg-white p-3 sm:p-4 md:p-6 overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Expected & Arrived Fleet
          </h2>
          
          <div className="space-y-4">
            {trips.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4 sm:py-6 md:py-8">No incoming fleet found.</p>
            ) : (
              trips.map(trip => (
                <div 
                  key={trip.trackingNumber} 
                  onClick={() => setSelectedTrip(trip)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTrip?.trackingNumber === trip.trackingNumber ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-indigo-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-indigo-700">{trip.trackingNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${trip.status === 'ARRIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="font-bold text-lg text-slate-800 mb-1">{trip.logistics?.transport?.vehicleNumber || 'Unassigned'}</div>
                  <p className="text-xs text-slate-500 font-medium">Driver: {trip.logistics?.transport?.driverName || 'N/A'}</p>
                  <div className="mt-3 text-sm text-slate-600 font-medium bg-white p-2 rounded border border-slate-100">
                    {trip.logistics?.transport?.origin} → {trip.logistics?.transport?.destination}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: OTP Handshake Portal */}
        <div className="flex-1 bg-slate-50 p-5 sm:p-8 md:p-10 flex flex-col items-center justify-center relative">
          {selectedTrip ? (
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-8 md:p-10 transform transition-all animate-fade-in">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 mb-2">OTP Handshake Portal</h3>
                <p className="text-slate-500 text-sm">Verify receiver identity to authorize cargo unloading.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
                  ⚠️ {error}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Vehicle</span>
                    <span className="font-bold font-mono">{selectedTrip.logistics?.transport?.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Receiver</span>
                    <span className="font-bold">{selectedTrip.logistics?.receiver?.name}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-3 text-center">
                  Enter 6-Digit Receiver Delivery OTP
                  <br/><span className="font-normal text-xs text-slate-500">(Collected verbally from driver)</span>
                </label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center text-4xl font-mono tracking-[0.5em] font-bold text-slate-800 py-4 border-2 border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-0 transition-colors"
                />
              </div>

              <button 
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6 || selectedTrip.status !== 'ARRIVED'}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg ${loading || otp.length < 6 || selectedTrip.status !== 'ARRIVED' ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1'}`}
              >
                {loading ? 'Verifying...' : 'Verify Code & Authorize Cargo Unloading'}
              </button>

              {selectedTrip.status !== 'ARRIVED' && (
                <p className="text-center text-xs text-amber-600 font-bold mt-4">
                  * Vehicle must trigger Geofence (status: ARRIVED) before verification.
                </p>
              )}

            </div>
          ) : (
             <div className="text-center">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-400 mb-2">Select a Fleet Asset</h3>
                <p className="text-slate-500">Choose an arrived vehicle from the left panel to begin verification.</p>
                {success && (
                  <div className="mt-8 inline-block p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold shadow-sm">
                    ✓ {success}
                  </div>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YardArrivals;
