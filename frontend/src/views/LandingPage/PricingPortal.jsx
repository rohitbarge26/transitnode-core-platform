import React, { useState } from 'react';
import axios from 'axios';
import brandLogo from '../../assets/brand_logo.png';

const CheckIcon = ({ className = "w-4 h-4 text-slate-400 mr-2 flex-shrink-0 mt-0.5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
  </svg>
);

const PricingPortal = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [formData, setFormData] = useState({
    companyName: '',
    registeredMobile: '',
    customSubdomain: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testimonials = [
    {
      name: "William Alex",
      role: "Supply Chain Director",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
      avatar: "https://i.pravatar.cc/150?img=11",
      text: "\"Supply chain optimization ROI went through the roof since our deployment of TransitNode. Best effort.\"",
      company: "Global Supply"
    },
    {
      name: "Madhu Mia",
      role: "Global Logistics Manager",
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80",
      avatar: "https://i.pravatar.cc/150?img=68",
      text: "\"The multi-language support allowed our drivers across different states to adopt the app immediately.\"",
      company: "Cargo Logistics Board"
    },
    {
      name: "Sarah Jenkins",
      role: "Global Logistics Manager",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      avatar: "https://i.pravatar.cc/150?img=47",
      text: "\"Using the direct Tally ERP export has saved our accounting team hundreds of hours each month.\"",
      company: "Cargo Logistics Group"
    },
    {
      name: "Emma Stone",
      role: "Supply Chain Director",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
      avatar: "https://i.pravatar.cc/150?img=32",
      text: "\"The compliance vault ensures we never miss a vehicle renewal date again. Absolute game changer.\"",
      company: "Cargo Logistics"
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/api/saas/register-tenant`, { ...formData, planTier: selectedPlan });
      
      if (response.data.requiresPayment && response.data.orderSessionId) {
        if (window.Cashfree) {
          const mode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'sandbox' : 'production';
          const cashfree = window.Cashfree({ mode });
          
          cashfree.checkout({
            paymentSessionId: response.data.orderSessionId,
            redirectTarget: "_self"
          });
        } else {
          setResult({ success: false, message: 'Cashfree payment gateway SDK failed to load.' });
        }
      } else {
        setResult({ 
          success: true, 
          message: response.data.message,
          magicLink: response.data.magicLink,
          fullLoginUrl: response.data.fullLoginUrl
        });
      }
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111a] text-slate-100 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      
      {/* Background glow effects */}
      <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-teal-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-2/3 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center space-x-3">
          <img src={brandLogo} alt="TransitNode Logo" className="h-7 w-auto object-contain brightness-0 invert opacity-90" />
          <span className="text-lg font-semibold tracking-wide text-white">TransitNode</span>
        </div>
        <button 
          onClick={() => { setSelectedPlan('free'); setShowModal(true); }}
          className="bg-gradient-to-b from-gray-300 to-gray-500 hover:from-gray-200 hover:to-gray-400 text-slate-900 px-5 py-2 rounded-full font-bold transition-all shadow-lg text-sm"
        >
          Start Free Trial
        </button>
      </nav>

      {/* Hero Segment */}
      <header className="container mx-auto px-6 pt-8 pb-20 relative z-10 flex flex-col lg:flex-row items-start">
        <div className="w-full lg:w-1/2 lg:pr-10 z-20">
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight mb-6 leading-[1.1] text-white">
            ENTERPRISE <br /> FLEET CONTROL. <br /> ZERO FRICTION.
          </h1>
          <p className="text-base text-slate-400 mb-8 leading-relaxed font-normal max-w-md">
            Enjoy your spreadsheet and hard, piecemeal legacy applications, and client corporate SO suspects.
          </p>
          <div className="text-sm font-semibold text-slate-300 tracking-wider leading-loose">
            SCALE GLOBAL LOGISTICS.<br/>
            PRECISE TELEMATICS.<br/>
            MULTI-LANGUAGE APPS.<br/>
            ALL-IN-ONE PLATFORM.
          </div>
        </div>
        <div className="w-full lg:w-1/2 relative mt-16 lg:mt-0 z-10 flex justify-center lg:justify-end min-h-[400px]">
          {/* Hero background image will be placed here */}
        </div>
      </header>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-10 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-lg md:text-xl font-medium tracking-widest text-slate-400 uppercase">
            SELECT YOUR OPERATIONAL<br/>VOLUME TIER
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto flex flex-col space-y-6">
          
          {/* Card 1: 10-Day Exploration */}
          <div className="flex flex-col md:flex-row items-stretch gap-4 relative">
            <div className="flex-1 bg-[#101924]/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-7 relative flex flex-col justify-between">
              <div className="absolute top-0 left-6 w-12 h-[3px] bg-slate-500 rounded-b-sm"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">10-Day Exploration</h3>
                  <p className="text-slate-400 text-xs">Enjoy free learning on five pre-built fleet tools.</p>
                </div>
                <div className="w-10 h-10 rounded-full border-[3px] border-slate-700/50 relative">
                </div>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-300 mb-6">
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" /> Full fleet supply chain options</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" /> 1 Lesson payment</li>
              </ul>
              
              <div className="flex justify-between items-end mt-auto">
                <div className="text-[10px] text-slate-500 max-w-[60%] leading-relaxed"></div>
                <button onClick={() => { setSelectedPlan('free'); setShowModal(true); }} className="px-5 py-2 rounded-lg border border-slate-600/80 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-slate-300">
                  Start Free Trial
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-56 bg-[#101924]/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 to-transparent"></div>
              <div className="bg-slate-800/80 border border-slate-700 text-slate-300 text-[9px] px-3 py-1 rounded-full mb-4 font-bold tracking-widest relative z-10">BEGINNER TIER</div>
              <div className="text-4xl font-bold text-white mb-1 relative z-10">₹0</div>
              <div className="text-slate-500 text-[10px] uppercase font-semibold relative z-10 mt-1">Price</div>
            </div>
          </div>

          {/* Card 2: 3-Year Acceleration */}
          <div className="flex flex-col md:flex-row items-stretch gap-4 relative">
            <div className="absolute inset-0 bg-teal-500/5 blur-3xl rounded-3xl -z-10 transform scale-110"></div>
            <div className="flex-1 bg-[#101924]/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-7 relative flex flex-col justify-between shadow-lg shadow-teal-900/10">
              <div className="absolute top-0 left-6 w-12 h-[3px] bg-teal-500 rounded-b-sm shadow-[0_0_8px_rgba(20,184,166,0.8)]"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">3-Year Acceleration</h3>
                  <p className="text-slate-400 text-xs">Give your supply team massive data opportunity leverage.</p>
                </div>
                <div className="w-10 h-10 rounded-full border-[3px] border-slate-700 relative">
                  <div className="absolute inset-[-3px] rounded-full border-[3px] border-teal-500 border-l-transparent border-b-transparent transform rotate-45 shadow-[0_0_8px_rgba(20,184,166,0.3)]"></div>
                </div>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-300 mb-6">
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-teal-500 mr-2 flex-shrink-0" /> Flexible access matrix</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-teal-500 mr-2 flex-shrink-0" /> Full Tally XML integration</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-teal-500 mr-2 flex-shrink-0" /> 10 m/s and fast tracking nodes</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-teal-500 mr-2 flex-shrink-0" /> Standard email access</li>
              </ul>
              
              <div className="flex justify-between items-end mt-auto">
                <div className="text-[10px] text-slate-500 max-w-[60%] leading-relaxed">Quantitatively accurate out of interception track line logging interfaces.</div>
                <button onClick={() => { setSelectedPlan('silver'); setShowModal(true); }} className="px-5 py-2 rounded-lg border border-slate-600/80 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-white">
                  Upgrade to 3 Year
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-56 bg-[#101924]/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg shadow-teal-900/10">
              <div className="absolute inset-0 bg-gradient-to-b from-teal-900/20 to-transparent"></div>
              <div className="bg-teal-900/40 border border-teal-800/50 text-teal-400 text-[9px] px-3 py-1 rounded-full mb-4 font-bold tracking-widest relative z-10">GROWTH PHASE</div>
              <div className="text-slate-500 text-[9px] uppercase font-semibold mb-1 relative z-10">SILVER PRICE POINT</div>
              <div className="text-4xl font-bold text-white mb-1 relative z-10">₹50k</div>
              <div className="text-teal-500 text-[10px] relative z-10">/ 36 Months upfront</div>
            </div>
          </div>

          {/* Card 3: 5-Year Control Tower */}
          <div className="flex flex-col md:flex-row items-stretch gap-4 relative">
            <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-3xl -z-10 transform scale-110"></div>
            <div className="flex-1 bg-[#101924]/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-7 relative flex flex-col justify-between shadow-lg shadow-amber-900/10">
              <div className="absolute top-0 left-6 w-12 h-[3px] bg-amber-500 rounded-b-sm shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">5-Year Control Tower</h3>
                  <p className="text-slate-400 text-xs">Accessible access to the out of spectrum industry traits.</p>
                </div>
                <div className="w-10 h-10 rounded-full border-[3px] border-slate-700 relative">
                  <div className="absolute inset-[-3px] rounded-full border-[3px] border-amber-500 border-b-transparent transform rotate-12 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div>
                </div>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-300 mb-6">
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" /> 4 Teams cross & from rounds</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" /> Core audit compliance vaults</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" /> Full system cost on availability</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" /> Privacy and access spaces</li>
              </ul>
              
              <div className="flex justify-between items-end mt-auto">
                <div className="text-[10px] text-slate-500 max-w-[60%] leading-relaxed">Available in a step set up room call which track your line and instruction.</div>
                <button onClick={() => { setSelectedPlan('platinum'); setShowModal(true); }} className="px-5 py-2 rounded-lg border border-slate-600/80 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-white">
                  Select Advanced Tier
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-56 bg-[#101924]/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg shadow-amber-900/10">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent"></div>
              <div className="bg-amber-900/40 border border-amber-800/50 text-amber-400 text-[9px] px-3 py-1 rounded-full mb-4 font-bold tracking-widest relative z-10">FULL DATA TRACK LIMIT</div>
              <div className="text-slate-500 text-[9px] uppercase font-semibold mb-1 relative z-10">BUDGET TEMA PRICE</div>
              <div className="text-4xl font-bold text-white mb-1 relative z-10">₹1.00L</div>
              <div className="text-amber-500 text-[10px] relative z-10">/ 60 Months upfront</div>
            </div>
          </div>

          {/* Card 4: Lifetime Ownership */}
          <div className="flex flex-col md:flex-row items-stretch gap-4 relative">
            <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-3xl -z-10 transform scale-110"></div>
            <div className="flex-1 bg-[#101924]/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-7 relative flex flex-col justify-between shadow-lg shadow-indigo-900/10">
              <div className="absolute top-0 left-6 w-12 h-[3px] bg-indigo-500 rounded-b-sm shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Lifetime Ownership</h3>
                  <p className="text-slate-400 text-xs">The best, last update. used in Partner Manufacturing tool.</p>
                </div>
                <div className="w-10 h-10 rounded-full border-[3px] border-slate-700 relative">
                  <div className="absolute inset-[-3px] rounded-full border-[3px] border-indigo-500 border-l-transparent border-t-transparent transform rotate-45 shadow-[0_0_8px_rgba(99,102,241,0.3)]"></div>
                </div>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-300 mb-6">
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" /> And a gear set / ** ***** ****</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" /> Authentication options</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" /> Full prime q/m & accessibility</li>
                <li className="flex items-start"><CheckIcon className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" /> Adaptable telemetry partners manage</li>
              </ul>
              
              <div className="flex justify-between items-end mt-auto">
                <div className="text-[10px] text-slate-500 max-w-[60%] leading-relaxed">Unavailable on sub rather our clean call which track part logistical repository.</div>
                <button onClick={() => { setSelectedPlan('lifetime'); setShowModal(true); }} className="px-5 py-2 rounded-lg border border-slate-600/80 hover:bg-slate-700/50 transition-colors text-xs font-semibold text-white">
                  Check Out & Now
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-56 bg-[#101924]/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg shadow-indigo-900/10">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent"></div>
              <div className="bg-indigo-900/40 border border-indigo-800/50 text-indigo-400 text-[9px] px-3 py-1 rounded-full mb-4 font-bold tracking-widest relative z-10">MAX DATA LIMITING</div>
              <div className="text-slate-500 text-[9px] uppercase font-semibold mb-1 relative z-10">TIER 5 + EXCLUSIVE</div>
              <div className="text-4xl font-bold text-white mb-1 relative z-10">₹5.00L</div>
              <div className="text-indigo-400 text-[10px] relative z-10">Lifetime</div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-6 py-16 relative z-10 mt-8">
        <div className="text-center mb-12">
          <h2 className="text-lg md:text-xl font-bold text-slate-300">
            Trusted by Industry Leaders
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1200px] mx-auto">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-[#101924]/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col group hover:bg-[#152130]/90 transition-colors">
              <div className="h-44 w-full overflow-hidden">
                 <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5 flex-1 flex flex-col relative bg-[#0a1017]">
                 <div className="flex space-x-1 text-amber-500 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                 </div>
                 <h4 className="font-bold text-white text-[13px] mb-2">{t.role}</h4>
                 <p className="text-slate-400 text-[11px] leading-relaxed mb-6 font-light flex-1">
                   {t.text}
                 </p>
                 <div className="flex items-center space-x-3 pt-4">
                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                       <img src={t.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{t.company}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Dots Indicator */}
        <div className="flex justify-center mt-12 space-x-1.5">
           <div className="w-4 h-1 bg-slate-600 rounded-full"></div>
           <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
           <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
        </div>
      </section>

      {/* Footer minimal representation */}
      <footer className="container mx-auto px-6 py-12 border-t border-slate-800/50 mt-10 flex flex-col md:flex-row justify-between items-start md:items-center text-sm text-slate-500 gap-8 relative z-10">
        <div className="flex flex-col gap-2">
           <div className="flex items-center space-x-2 mb-2">
              <img src={brandLogo} alt="Logo" className="h-5 w-auto opacity-50 brightness-0 invert" />
              <span className="font-semibold tracking-wide text-slate-400 text-xs">TransitNode</span>
           </div>
           <p className="max-w-xs text-xs">We proudly present more open solutions up to start that the initial step through process parameters provides operation easily minimal.</p>
        </div>
        <div className="grid grid-cols-2 gap-12 text-slate-400 text-xs">
           <div>
              <ul className="space-y-2">
                 <li>Privacy Policy</li>
                 <li>Terms of Use</li>
              </ul>
           </div>
        </div>
      </footer>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 relative my-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Complete Registration</h3>
            <p className="text-slate-400 text-sm mb-6">You've selected the <span className="text-teal-400 font-bold uppercase">{selectedPlan}</span> tier.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Company Name</label>
                <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Acme Logistics" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Registered Mobile</label>
                <input required type="tel" value={formData.registeredMobile} onChange={e => setFormData({...formData, registeredMobile: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Custom Workspace Domain</label>
                <div className="flex">
                  <input required type="text" value={formData.customSubdomain} onChange={e => setFormData({...formData, customSubdomain: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-l-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="acme" />
                  <span className="bg-slate-700 border border-slate-600 border-l-0 rounded-r-lg px-3 py-2.5 text-slate-400 text-sm flex items-center">.transitnode.com</span>
                </div>
              </div>
              
              <button disabled={loading} type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg mt-4 transition-colors disabled:opacity-50">
                {loading ? 'Processing...' : 'Create Workspace'}
              </button>
            </form>
            
            {result && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? 'bg-teal-900/30 text-teal-400 border border-teal-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                {result.message}
                {result.success && result.magicLink && (
                  <a href={result.fullLoginUrl} className="block mt-2 font-bold underline">Login via Magic Link</a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPortal;
