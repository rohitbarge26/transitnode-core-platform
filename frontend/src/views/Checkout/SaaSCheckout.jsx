import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantBrandingContext } from '../../context/TenantBrandingContext';
import axios from 'axios';

const SaaSCheckout = () => {
  const navigate = useNavigate();
  const { tenantProfile } = useContext(TenantBrandingContext);
  const [activeTab, setActiveTab] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Default values
  const planType = tenantProfile?.planType || 'PLATINUM';
  
  let price = 0;
  let duration = '';
  let planName = '';

  if (planType === 'PLATINUM') {
    price = 100000;
    duration = '60 Months (5 Years)';
    planName = '5-Year Control Tower';
  } else if (planType === 'LIFETIME') {
    price = 500000;
    duration = 'Lifetime';
    planName = 'Lifetime Ownership';
  } else if (planType === 'SILVER') {
    price = 50000;
    duration = '36 Months (3 Years)';
    planName = '3-Year Acceleration';
  } else {
    // Edge case if they are somehow here on a Trial
    price = 0;
    duration = '10 Days';
    planName = '10-Day Exploration';
  }

  const taxAmount = price * 0.0825; // Example 8.25% tax
  const totalAmount = price + taxAmount;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
      await axios.post(`${apiUrl}/api/saas/checkout`, {
        paymentMethod: activeTab,
        amount: totalAmount
      });
      // Show success screen instead of immediate redirect
      setPaymentSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Successful!</h2>
          <p className="text-slate-600 mb-6">Thank you for subscribing to the <span className="font-bold">{planName}</span>. Your transaction of <span className="font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> has been securely processed.</p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 text-sm text-left">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Company</span>
              <span className="font-medium text-slate-900">{tenantProfile?.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">License Expires</span>
              <span className="font-medium text-slate-900">{duration}</span>
            </div>
          </div>

          <button 
            onClick={() => navigate(tenantProfile?.adminSetupComplete ? '/login' : '/setup-admin')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex justify-center items-center"
          >
            {tenantProfile?.adminSetupComplete ? 'Continue to Login Dashboard' : 'Continue to Setup Admin Profile'}
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Panel - Order Summary */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm h-fit">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Order Summary</h2>
          
          <div className="mb-8">
            <h3 className="font-bold text-slate-900 text-lg">{planName}</h3>
            <p className="text-slate-500 text-sm mb-4">Sub: PROHIT CoreTech Logistics Management</p>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600">Price</span>
              <span className="font-medium text-slate-900">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-600">Duration</span>
              <span className="text-slate-900">{duration}</span>
            </div>
            
            <div className="border-t border-slate-200 pt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-600">Tax (8.25%)</span>
                <span className="text-slate-900">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-slate-900">
                <span>Total</span>
                <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-slate-100/50 p-3 sm:p-4 md:p-6 rounded-2xl border border-slate-200/50">
            <h4 className="font-bold text-slate-900 mb-4">Payment Summary</h4>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-slate-600">Product</span>
              <span className="text-right max-w-[150px]">{planName}</span>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="text-slate-600">Duration</span>
              <span>{duration}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 font-bold">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Payment Form */}
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Complete Your Purchase</h2>
          <p className="text-lg text-slate-600 mb-8">Total Amount: <span className="font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-6 md:p-8">
            {/* Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 mb-8">
              <button 
                type="button"
                className={`pb-4 px-4 font-semibold text-sm transition-colors relative ${activeTab === 'card' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('card')}
              >
                Credit/Debit Card
                {activeTab === 'card' && <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-500 rounded-t-full"></div>}
              </button>
              <button 
                type="button"
                className={`pb-4 px-4 font-semibold text-sm transition-colors relative ${activeTab === 'upi' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('upi')}
              >
                UPI / Other Methods
                {activeTab === 'upi' && <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-500 rounded-t-full"></div>}
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckout}>
              {activeTab === 'card' ? (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cardholder Name</label>
                    <input type="text" required className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="Jane A. Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                    <input type="text" required className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="**** **** **** 4291" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expiry (MM/YY)</label>
                      <input type="text" required className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="11/27" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">CVV</label>
                      <input type="password" required className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="***" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 md:p-6">
                    <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center">
                      <span className="w-4 h-4 mr-2 bg-gradient-to-br from-orange-400 to-green-500 rounded-sm inline-block"></span>
                      Pay via UPI
                    </label>
                    <input type="text" required className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="Enter UPI ID, e.g., janedoe@okaxis" />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-8 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-teal-500/30 active:scale-95 disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? (
                  <svg className="animate-spin h-6 w-6 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  `Pay ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </button>
            </form>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default SaaSCheckout;
