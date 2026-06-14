import apiConfig from '../config/apiConfig';

// Handles multipart form data for fuel receipt photos
export const uploadExpenseReceipt = async (file, description, amount) => {
  const formData = new FormData();
  formData.append('receipt', file);
  formData.append('description', description);
  formData.append('amount', amount);

  try {
    const response = await apiConfig.post('/expenses/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload expense receipt:', error);
    throw error;
  }
};
