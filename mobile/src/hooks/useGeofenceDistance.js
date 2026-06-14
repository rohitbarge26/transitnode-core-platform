import { useState, useEffect } from 'react';

// Helper computing distance vectors relative to destination
const useGeofenceDistance = (destinationCoords) => {
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    // Placeholder logic for GPS tracking and distance calculation
    if (destinationCoords) {
      setDistance(1500); // meters
    }
  }, [destinationCoords]);

  return distance;
};

export default useGeofenceDistance;
