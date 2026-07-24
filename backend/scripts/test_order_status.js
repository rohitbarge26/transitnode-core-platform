const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getCashfreeOrder, getCashfreeOrderPayments } = require('../src/config/cashfree');

async function main() {
  const orderId = 'order_tenant_6a635998dfce82e92b90c73a';
  try {
    const res = await getCashfreeOrder(orderId);
    console.log('--- CASHFREE ORDER RESULT ---');
    console.log('Order ID:', res.order_id);
    console.log('Order Status:', res.order_status);

    try {
      const payments = await getCashfreeOrderPayments(orderId);
      console.log('--- CASHFREE PAYMENTS LIST ---');
      console.log(JSON.stringify(payments, null, 2));
      const hasSuccessfulPayment = Array.isArray(payments) && payments.some(p => p.payment_status === 'SUCCESS');
      console.log('Has Successful Payment Transaction:', hasSuccessfulPayment);
    } catch (payErr) {
      console.error('Error fetching payments:', payErr.message);
    }

  } catch (err) {
    console.error('Cashfree API error:', err.message);
  }
}

main();
