import axios from 'axios';

// Centralized Axios base URLs targeting port 3000/api (assuming backend runs on 3000)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.29.237:3000/api';

const apiConfig = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiConfig;
