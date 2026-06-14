import apiConfig from '../config/apiConfig';

// Monitors Teltonika hardware status updates
export const fetchTelemetryStatus = async (vehicleId) => {
  try {
    const response = await apiConfig.get(`/telemetry/${vehicleId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch telemetry status:', error);
    throw error;
  }
};
