import apiConfig from '../config/apiConfig';

// Calls /api/auth/login with mobile number parameters
export const loginWithPhone = async (phoneNumber, pin) => {
  try {
    const response = await apiConfig.post('/auth/driver-login', { phone: phoneNumber, pin });
    return response.data;
  } catch (error) {
    console.error('Driver auth failed:', error);
    throw error;
  }
};
