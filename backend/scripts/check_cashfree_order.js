const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getCashfreeOrder } = require('../src/config/cashfree');

const checkOrder = async () => {
  const orderId = 'order_tenant_6a635998dfce82e92b90c73a';
  try {
    console.log(`Checking Cashfree Order ID: ${orderId}...`);
    const cfOrder = await getCashfreeOrder(orderId);
    console.log('Cashfree API Response:', JSON.stringify(cfOrder, null, 2));
  } catch (error) {
    console.error('Error fetching order from Cashfree:', error.message);
  }
};

checkOrder();
