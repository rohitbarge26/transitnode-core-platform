import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import MapView from '../components/MapView';

const PublicTracker = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Map State
  const [vehicles, setVehicles] = useState({});
  const [vehicleHistory, setVehicleHistory] = useState({});
  const [isMapConnected, setIsMapConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const res = await axios.get(`/api/shipments/${trackingId}`);
        setShipment(res.data.shipment);
      } catch (err) {
        setError('Tracking ID not found or invalid.');
      } finally {
        setLoading(false);
      }
    };
    fetchShipment();
  }, [trackingId]);

  useEffect(() => {
    if (!shipment) return;

    // Connect to telemetry socket
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');

    socketRef.current.on('connect', () => {
      setIsMapConnected(true);
    });

    socketRef.current.on('telemetry_update', (data) => {
      // Stream telemetry data
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

    socketRef.current.on('disconnect', () => {
      setIsMapConnected(false);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [shipment]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-[#0B0E14]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div></div>;
  }

  if (error || !shipment) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#0B0E14] text-white">
        <h1 className="text-4xl font-bold text-red-500 mb-4">404 NOT FOUND</h1>
        <p className="text-gray-400 mb-8">{error}</p>
        <button onClick={() => navigate('/login')} className="px-3 sm:px-4 md:px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Return to Portal</button>
      </div>
    );
  }

  // Find if our vehicle is in the telemetry stream
  const assignedVehicleNum = shipment.logistics?.transport?.vehicleNumber;
  let trackedVehicle = null;
  if (assignedVehicleNum) {
    // try to find by registration match
    trackedVehicle = Object.values(vehicles).find(v => v.vehicleRegistration === assignedVehicleNum);
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)]">PENDING DISPATCH</span>;
      case 'READY_FOR_DISPATCH':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]">DISPATCH READY</span>;
      case 'IN_TRANSIT':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]">IN TRANSIT</span>;
      case 'DELIVERED':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">DELIVERED</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0B0E14] text-white overflow-hidden">
      
      {/* Sidebar Details */}
      <div className="w-full lg:w-1/3 p-3 sm:p-4 md:p-6 lg:p-10 flex flex-col h-full overflow-y-auto border-r border-gray-800 z-10 bg-[#0B0E14] shadow-2xl relative">
        <div className="mb-8">
          <button onClick={() => navigate('/login')} className="text-sm text-gray-400 hover:text-cyan-400 flex items-center transition-colors mb-6">
            ← Access Terminal
          </button>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-1">Live Tracking</p>
              <h1 className="text-3xl font-black tracking-tight">{shipment.trackingNumber}</h1>
            </div>
            {getStatusBadge(shipment.status)}
          </div>
        </div>

        <div className="space-y-6 flex-1 relative z-10">
          {/* Route Info */}
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none"></div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Route Information</h3>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                <div className="w-0.5 h-10 bg-gradient-to-b from-cyan-400 to-purple-500"></div>
                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              </div>
              <div className="flex flex-col gap-6 w-full">
                <div>
                  <p className="font-bold text-lg">{shipment.logistics?.transport?.origin}</p>
                  <p className="text-xs text-gray-400">Origin Terminal</p>
                </div>
                <div>
                  <p className="font-bold text-lg">{shipment.logistics?.transport?.destination}</p>
                  <p className="text-xs text-gray-400">Destination Terminal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sender & Receiver Info */}
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mb-10 group-hover:bg-purple-500/20 transition-all duration-500 pointer-events-none"></div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Parties</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 bg-cyan-500/20 p-2 rounded-lg text-cyan-400 h-min">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Sender</p>
                  <p className="font-bold">{shipment.logistics?.sender?.name}</p>
                </div>
              </div>
              <div className="w-full h-[1px] bg-gray-800"></div>
              <div className="flex gap-3">
                <div className="mt-1 bg-purple-500/20 p-2 rounded-lg text-purple-400 h-min">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Receiver</p>
                  <p className="font-bold">{shipment.logistics?.receiver?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl relative overflow-hidden">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Assigned Fleet Asset</h3>
            {assignedVehicleNum ? (
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="font-mono text-xl font-bold text-white tracking-widest">{assignedVehicleNum}</p>
                  <p className="text-sm text-gray-400 mt-1">{shipment.logistics?.transport?.vehicleType}</p>
                </div>
                {trackedVehicle ? (
                   <div className="text-right">
                     <p className="text-2xl font-black text-cyan-400">{trackedVehicle.speed} <span className="text-sm font-normal text-gray-500">km/h</span></p>
                     <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1 justify-end"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> GPS ACTIVE</p>
                   </div>
                ) : (
                  <div className="text-right">
                     <p className="text-xs text-amber-500 font-bold mt-1 flex items-center gap-1 justify-end"><span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span> OFFLINE / YARD</p>
                   </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic relative z-10">No fleet asset assigned yet. Vehicle allocation pending.</p>
            )}
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative bg-black min-h-[50vh] lg:min-h-screen">
        {/* We reuse the Admin MapView here */}
        <MapView 
          vehicles={vehicles} 
          vehicleHistory={vehicleHistory} 
          selectedVehicleId={trackedVehicle ? trackedVehicle.imei : null} 
          isConnected={isMapConnected} 
        />
        
        {/* Floating gradient overlay for aesthetics */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0B0E14] to-transparent z-[1000] pointer-events-none opacity-80"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0E14] to-transparent z-[1000] pointer-events-none opacity-80 lg:hidden"></div>
      </div>

    </div>
  );
};

export default PublicTracker;
