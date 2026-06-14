import React from 'react';
import useCamera from '../hooks/useCamera';
import TouchButton from '../components/Common/TouchButton';

// Photo stream review interface for fuel/toll bill slips
const DocumentScannerScreen = () => {
  const { photo, capturePhoto } = useCamera();

  return (
    <div className="p-6 h-full flex flex-col bg-gray-900">
      <h2 className="text-xl font-bold mb-6 text-white text-center">Scan Receipt</h2>
      
      <div className="flex-1 bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center mb-6">
        {photo ? (
          <span className="text-green-400 font-bold">Image Captured!</span>
        ) : (
          <span className="text-gray-500">Camera Viewfinder</span>
        )}
      </div>

      <div className="space-y-4">
        <input 
          type="number" 
          placeholder="Amount (₹)" 
          className="w-full bg-gray-800 text-white rounded-xl px-5 py-4 border border-gray-700" 
        />
        <TouchButton onClick={capturePhoto} variant={photo ? "secondary" : "primary"}>
          {photo ? "Retake Photo" : "Capture Photo"}
        </TouchButton>
        {photo && <TouchButton variant="primary" className="bg-green-600 hover:bg-green-500">Upload Receipt</TouchButton>}
      </div>
    </div>
  );
};

export default DocumentScannerScreen;
