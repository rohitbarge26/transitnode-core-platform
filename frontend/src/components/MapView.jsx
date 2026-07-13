import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import io from 'socket.io-client';

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const createSelectedIcon = () => {
  return L.divIcon({
    className: 'custom-selected-icon bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-[48px] h-[48px]">
        <div class="absolute w-12 h-12 bg-indigo-500 rounded-full animate-ping opacity-50"></div>
        <div class="relative z-10 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-lg"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
};

const createDefaultIcon = (speed, ignition) => {
  let colorClass = 'bg-red-500'; // Stopped
  if (ignition && speed > 2) colorClass = 'bg-emerald-500'; // Moving
  else if (ignition && speed <= 2) colorClass = 'bg-amber-500'; // Idling

  return L.divIcon({
    className: 'custom-default-icon bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-[24px] h-[24px]">
        <div class="relative z-10 w-4 h-4 ${colorClass} border-2 border-white rounded-full shadow-md"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const MapController = ({ selectedVehicleId, vehicles }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedVehicleId && vehicles[selectedVehicleId]) {
      const v = vehicles[selectedVehicleId];
      map.flyTo([v.location.lat, v.location.lng], 15, { animate: true, duration: 1.5 });
    }
  }, [selectedVehicleId, vehicles, map]);
  return null;
};

const MapView = ({ vehicles = {}, vehicleHistory = {}, selectedVehicleId = null, isConnected = false }) => {

  const defaultCenter = [19.0760, 72.8777]; // Mumbai center
  const vehicleList = Object.values(vehicles);

  return (
    <div className="w-full h-full relative">
      {!isConnected && (
        <div className="absolute inset-0 z-[1000] bg-white bg-opacity-70 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-sm font-medium text-slate-600">Initializing telemetry pipeline...</p>
        </div>
      )}
      
      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <MapController selectedVehicleId={selectedVehicleId} vehicles={vehicles} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {vehicleList.map((vehicle) => {
          const history = vehicleHistory[vehicle.imei] || [];
          return (
            <React.Fragment key={vehicle.imei}>
              {history.length > 1 && (
                <Polyline 
                  positions={history} 
                  pathOptions={{ color: '#4F46E5', weight: 4, opacity: 0.8, dashArray: '10, 10' }} 
                />
              )}
              <Marker 
                position={[vehicle.location.lat, vehicle.location.lng]}
                icon={selectedVehicleId === vehicle.imei ? createSelectedIcon() : createDefaultIcon(vehicle.speed, vehicle.ignition)}
              >
                <Popup className="rounded-lg shadow-lg">
                  <div className="p-2 min-w-[220px]">
                    <h4 className="font-bold text-slate-800 text-lg mb-1 uppercase">{vehicle.vehicleRegistration}</h4>
                    <p className="text-sm text-slate-600 mb-3">Driver: <span className="font-bold text-slate-800">{vehicle.driverName}</span></p>
                    
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mb-1">Speed</span>
                        <span className="font-mono text-indigo-600 font-bold">{vehicle.speed} km/h</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mb-1">Engine</span>
                        <span className={`font-mono font-bold ${vehicle.ignition ? 'text-emerald-500' : 'text-red-500'}`}>
                          {vehicle.ignition ? 'RUNNING' : 'OFF'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Trip Manifest</span>
                      <a href="#" className="text-xs font-mono font-bold text-blue-600 hover:text-blue-800 underline">#{vehicle.tripId || 'UNASSIGNED'}</a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
