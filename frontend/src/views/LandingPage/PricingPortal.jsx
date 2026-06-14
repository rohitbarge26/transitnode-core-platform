import React, { useState } from 'react';
import axios from 'axios';

const CheckIcon = () => (
  <svg className="w-6 h-6 text-teal-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const DashIcon = () => (
  <svg className="w-6 h-6 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
  </svg>
);

const HexagonLogo = () => (
  <svg className="w-10 h-10 text-teal-700" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.2L2.5 7.7v11l9.5 5.5 9.5-5.5v-11L12 2.2zm0 2.3l7.5 4.3v8.6l-7.5 4.3-7.5-4.3V8.8L12 4.5z"/>
    <path d="M12 7l4.5 2.6v5.2L12 17.4l-4.5-2.6V9.6L12 7z"/>
  </svg>
);

const PricingPortal = () => {
  const features = [
    { name: "Multi-Language Driver Interface", free: true, silver: true, platinum: true },
    { name: "Automated Geofence OTP Verification", free: false, silver: true, platinum: true },
    { name: "Excel & Tally XML Export Suite", free: false, silver: true, platinum: true },
    { name: "Real-Time P&L and Balance Sheet compilation", free: false, silver: false, platinum: true },
  ];

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', registeredMobile: '', customSubdomain: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/saas/register-tenant', formData);
      setResult({ success: true, message: response.data.message });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <HexagonLogo />
          <span className="text-2xl font-extrabold tracking-tight text-slate-800">
            COREMATRIX TECH<span className="text-teal-600">.</span>
          </span>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-xl shadow-teal-600/20 active:scale-95">
          Start 10-Day Trial
        </button>
      </nav>

      {/* Hero Segment */}
      <header className="container mx-auto px-6 py-32 md:py-40 text-center max-w-5xl relative">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="inline-block mb-8 px-5 py-2 rounded-full bg-white border border-teal-100 text-teal-800 text-sm font-bold tracking-widest shadow-sm uppercase">
          White-Label Logistics ERP
        </div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-10 leading-tight text-slate-900">
          Enterprise Fleet Control. <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-700 to-teal-500">
            Zero Friction.
          </span>
        </h1>
        
        <p className="text-2xl text-slate-600 mb-16 leading-relaxed max-w-3xl mx-auto font-light">
          Scale your operations with automated telemetry tracking, localized multi-language driver applications, and direct corporate Tally ERP export files.
        </p>
      </header>

      {/* Pricing Cards */}
      <section className="container mx-auto px-6 pb-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
          
          {/* Free Trial */}
          <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col hover:border-slate-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <h3 className="text-2xl font-bold mb-4 text-slate-900">10-Day Exploration</h3>
            <p className="text-slate-500 mb-8 min-h-[60px] text-lg leading-relaxed">Perfect for testing our core capabilities on a limited scale.</p>
            <div className="mb-10">
              <span className="text-6xl font-extrabold text-slate-900">₹0</span>
            </div>
            <ul className="space-y-6 mb-12 flex-1">
              <li className="flex items-center text-slate-700 text-lg">
                <CheckIcon />
                <span className="ml-4">Restricted vehicle mapping counts</span>
              </li>
              <li className="flex items-center text-slate-700 text-lg">
                <CheckIcon />
                <span className="ml-4">Basic multi-language app access</span>
              </li>
            </ul>
            <button onClick={() => setShowModal(true)} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 py-4 rounded-xl font-bold transition-colors border border-slate-200 text-lg">
              Start Free Trial
            </button>
          </div>

          {/* Platinum Plan - Best Value */}
          <div className="bg-slate-900 rounded-3xl p-10 flex flex-col border-2 border-teal-500 shadow-2xl shadow-teal-500/20 relative transform md:-translate-y-8 z-10">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-500 to-sky-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg tracking-wide uppercase">
              Best Long-Term Enterprise Value
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white mt-4">5-Year Enterprise Control Tower</h3>
            <p className="text-slate-400 mb-8 min-h-[60px] text-lg leading-relaxed">Unrestricted access to the entire logistics operating system.</p>
            <div className="mb-10">
              <span className="text-6xl font-extrabold text-white">₹3,49k</span>
            </div>
            <ul className="space-y-6 mb-12 flex-1">
              <li className="flex items-center text-slate-300 text-lg">
                <CheckIcon />
                <span className="ml-4">Unlimited asset counts</span>
              </li>
              <li className="flex items-center text-slate-300 text-lg">
                <CheckIcon />
                <span className="ml-4">Advanced compliance vaults</span>
              </li>
              <li className="flex items-center text-slate-300 text-lg">
                <CheckIcon />
                <span className="ml-4">Full system feature availability</span>
              </li>
              <li className="flex items-center text-slate-300 text-lg">
                <CheckIcon />
                <span className="ml-4">Priority 24/7 technical support</span>
              </li>
            </ul>
            <button className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 py-4 rounded-xl font-bold transition-all shadow-lg shadow-teal-500/25 text-lg">
              Secure Enterprise Plan
            </button>
          </div>

          {/* Silver Plan */}
          <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col hover:border-slate-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <h3 className="text-2xl font-bold mb-4 text-slate-900">2-Year Logistics Acceleration</h3>
            <p className="text-slate-500 mb-8 min-h-[60px] text-lg leading-relaxed">Ideal for growing fleets needing deep operational integration.</p>
            <div className="mb-10">
              <span className="text-6xl font-extrabold text-slate-900">₹1,49k</span>
            </div>
            <ul className="space-y-6 mb-12 flex-1">
              <li className="flex items-center text-slate-700 text-lg">
                <CheckIcon />
                <span className="ml-4">Long-term structural savings</span>
              </li>
              <li className="flex items-center text-slate-700 text-lg">
                <CheckIcon />
                <span className="ml-4">Full Tally XML integration</span>
              </li>
              <li className="flex items-center text-slate-700 text-lg">
                <CheckIcon />
                <span className="ml-4">25 active vehicle tracking nodes</span>
              </li>
            </ul>
            <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 py-4 rounded-xl font-bold transition-colors border border-slate-200 text-lg">
              Upgrade to Silver
            </button>
          </div>

        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="container mx-auto px-6 pb-40">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Compare Plans</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">Find the perfect tier for your fleet's operational needs.</p>
        </div>
        
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/80">
                  <th className="p-8 text-xl font-bold w-2/5 text-slate-800">Feature Specification</th>
                  <th className="p-8 text-center text-lg text-slate-600 font-semibold border-l border-slate-100">Free Trial</th>
                  <th className="p-8 text-center text-lg text-slate-600 font-semibold border-l border-slate-100">Silver Plan</th>
                  <th className="p-8 text-center text-lg text-teal-700 font-bold bg-teal-50/50 border-l border-slate-100">Platinum Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {features.map((feature, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-8 text-slate-700 font-medium text-lg">{feature.name}</td>
                    <td className="p-8 text-center border-l border-slate-100">{feature.free ? <CheckIcon /> : <DashIcon />}</td>
                    <td className="p-8 text-center border-l border-slate-100">{feature.silver ? <CheckIcon /> : <DashIcon />}</td>
                    <td className="p-8 text-center bg-teal-50/30 border-l border-slate-100 group-hover:bg-teal-50/60 transition-colors">{feature.platinum ? <CheckIcon /> : <DashIcon />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Registration Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-10">
              <h3 className="text-3xl font-extrabold mb-3 text-slate-900">Start Your Trial</h3>
              <p className="text-slate-500 mb-8 text-lg">Provision your dedicated tenant workspace instantly.</p>
              
              {result ? (
                <div className={`p-6 rounded-2xl mb-8 ${result.success ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {result.message}
                </div>
              ) : null}

              {result?.success ? (
                <div className="pt-6 flex justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-xl font-bold transition-all text-center shadow-lg shadow-teal-600/25 text-lg">Done</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">Company Name</label>
                    <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none" placeholder="Acme Logistics" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">Mobile Number</label>
                    <input required type="tel" value={formData.registeredMobile} onChange={e => setFormData({...formData, registeredMobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none" placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">Target Subdomain</label>
                    <div className="flex shadow-sm rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500">
                      <input required type="text" value={formData.customSubdomain} onChange={e => setFormData({...formData, customSubdomain: e.target.value})} className="w-full bg-slate-50 border border-slate-200 border-r-0 px-5 py-4 text-slate-900 focus:bg-white focus:outline-none transition-all" placeholder="acme" />
                      <span className="bg-slate-100 border border-slate-200 border-l-0 text-slate-500 px-5 py-4 font-medium flex items-center">.corematrix.in</span>
                    </div>
                  </div>
                  <div className="pt-8 flex items-center justify-end space-x-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all text-lg">Cancel</button>
                    <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-teal-600/25 text-lg flex items-center">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Provisioning...
                        </>
                      ) : 'Complete Registration'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PricingPortal;
