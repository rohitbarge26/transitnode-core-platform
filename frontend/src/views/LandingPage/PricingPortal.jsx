import React, { useState } from 'react';
import axios from 'axios';
import brandLogo from '../../assets/brand_logo.png';

const CheckIcon = ({ className = "w-4 h-4 text-slate-400 mr-2 flex-shrink-0 mt-0.5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
  </svg>
);

const PricingPortal = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const domainSuffix = isLocalhost ? '.localhost:3001' : '.transitnode.prohitcoretech.com';

  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [formData, setFormData] = useState({
    companyName: '',
    registeredMobile: '',
    customSubdomain: ''
  });
  const [currentStep, setCurrentStep] = useState('WORKSPACE'); // 'WORKSPACE', 'PAYMENT', 'ADMIN_SETUP', 'COMPLETE'
  const [tenantInfo, setTenantInfo] = useState(null);
  const [adminData, setAdminData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
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

  // Step 1: Create Workspace
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/api/saas/register-tenant`, { ...formData, planTier: selectedPlan });
      
      const data = response.data;
      setTenantInfo(data);
      setAdminData(prev => ({ ...prev, username: formData.registeredMobile }));

      const isPaidPlan = selectedPlan !== 'free' && selectedPlan !== 'TRIAL';
      if (isPaidPlan) {
        setCurrentStep('PAYMENT');
      } else {
        setCurrentStep('ADMIN_SETUP');
      }
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Payment Integration (Cashfree)
  const handlePayment = async () => {
    if (tenantInfo?.orderSessionId && window.Cashfree) {
      const mode = isLocalhost ? 'sandbox' : 'production';
      const cashfree = window.Cashfree({ mode });
      cashfree.checkout({
        paymentSessionId: tenantInfo.orderSessionId,
        redirectTarget: "_self"
      });
    } else {
      // Simulate / complete payment step in dev mode and proceed to admin setup
      setCurrentStep('ADMIN_SETUP');
    }
  };

  // Step 3: Admin Setup (First User Create)
  const handleAdminSetup = async (e) => {
    e.preventDefault();
    if (adminData.password !== adminData.confirmPassword) {
      setResult({ success: false, message: 'Passwords do not match' });
      return;
    }
    if (adminData.password.length < 6) {
      setResult({ success: false, message: 'Password must be at least 6 characters long' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      await axios.post(`${apiUrl}/api/users/setup-admin`, {
        username: adminData.username,
        password: adminData.password,
        tenantId: tenantInfo?.tenantId
      });

      setCurrentStep('COMPLETE');
      setResult({
        success: true,
        message: 'Admin account created successfully! Workspace is now fully activated.',
        fullLoginUrl: tenantInfo?.fullLoginUrl
      });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed to setup admin account' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] via-[#101524] to-[#050608] text-slate-100 font-inter selection:bg-amber-500/30 overflow-x-hidden">
      
      {/* Background glow effects */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-slate-800/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center space-x-3">
          <img src={brandLogo} alt="TransitNode Logo" className="h-7 w-auto object-contain brightness-0 invert opacity-90" />
          <span className="text-lg font-semibold tracking-wide text-white">TransitNode</span>
        </div>
        <button 
          onClick={() => { setSelectedPlan('free'); setShowModal(true); }}
          className="font-montserrat font-medium uppercase tracking-tight bg-gradient-to-b from-gray-200 to-gray-400 hover:from-white hover:to-gray-300 text-slate-900 px-6 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm"
        >
          Start Free Trial
        </button>
      </nav>

      {/* Hero Segment */}
      <header className="container mx-auto px-6 pt-12 pb-32 relative z-10 flex flex-col lg:flex-row items-start">
        <div className="w-full lg:w-1/2 lg:pr-10 z-20 flex flex-col gap-6">
          <h1 className="font-cinzel text-5xl md:text-6xl lg:text-[64px] font-bold tracking-[0.1em] mb-4 leading-[1.15] text-white uppercase drop-shadow-xl">
            ENTERPRISE <br /> FLEET CONTROL. <br /> ZERO FRICTION.
          </h1>
          <p className="font-inter text-lg text-slate-400 mb-6 leading-relaxed font-light max-w-lg">
            Enjoy your spreadsheet and hard, piecemeal legacy applications, and client corporate SO suspects.
          </p>
          <div className="font-cormorant text-lg font-medium text-[#e2d5c3] tracking-[0.15em] leading-loose uppercase">
            SCALE GLOBAL LOGISTICS.<br/>
            PRECISE TELEMATICS.<br/>
            MULTI-LANGUAGE APPS.<br/>
            ALL-IN-ONE PLATFORM.
          </div>
        </div>
        <div className="w-full lg:w-1/2 relative mt-16 lg:mt-0 z-10 flex justify-center lg:justify-end min-h-[400px] lg:absolute lg:right-0 lg:top-0 lg:h-full lg:pointer-events-none overflow-hidden">
          <img 
            src="/hero_background.png" 
            alt="Global Logistics Map" 
            className="w-full h-auto object-cover max-w-[800px] lg:max-w-none lg:w-[120%] lg:-mr-[10%] opacity-80 mix-blend-screen drop-shadow-2xl"
          />
        </div>
      </header>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-16 relative z-10 space-y-16">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-2xl md:text-3xl font-medium tracking-[0.15em] text-[#e2d5c3] uppercase drop-shadow-md">
            SELECT YOUR OPERATIONAL<br/>VOLUME TIER
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto flex flex-col space-y-10">
          
          {/* Card 1: 10-Day Exploration (Blue Tier - Carbon Fiber Weave) */}
          <div className="flex flex-col md:flex-row items-stretch gap-0 relative shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png'), linear-gradient(to right, #0f172a, #1e293b)", backgroundBlendMode: "overlay" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none"></div>
            <div className="flex-1 p-8 relative flex flex-col justify-between backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border-r border-white/5">
              <div className="absolute top-0 left-8 w-16 h-[3px] bg-blue-500 rounded-b-sm shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
              
              <div className="flex justify-between items-start mb-8 mt-2">
                <div>
                  <h3 className="font-inter font-medium text-2xl text-white mb-2 tracking-tight">10-Day Exploration</h3>
                  <p className="font-inter text-slate-400 text-sm font-light">Enjoy free learning on five pre-built fleet tools.</p>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-slate-600/50 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]"></div>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-slate-300 mb-8 font-inter font-light">
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" /> Full fleet supply chain options</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" /> 1 Lesson payment</li>
              </ul>
              
              <div className="flex justify-between items-end mt-auto">
                <div className="text-xs text-slate-500 max-w-[60%] leading-relaxed"></div>
                <button onClick={() => { setSelectedPlan('free'); setShowModal(true); }} className="font-montserrat px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium uppercase tracking-tight text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.39)]">
                  Start Free Trial
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-64 p-8 flex flex-col items-center justify-center text-center relative backdrop-blur-sm bg-black/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>
              <div className="font-cormorant bg-slate-800/80 border border-slate-600/50 text-blue-300 text-xs px-4 py-1.5 rounded-full mb-6 font-semibold tracking-[0.1em] uppercase relative z-10 shadow-lg">BEGINNER TIER</div>
              <div className="font-inter font-semibold text-5xl text-white mb-2 relative z-10 drop-shadow-lg">₹0</div>
              <div className="font-inter text-slate-400 text-xs uppercase font-medium relative z-10 mt-1 tracking-widest">Price</div>
            </div>
          </div>

          {/* Card 2: 3-Year Acceleration (Green Tier - Emerald Marble) */}
          <div className="flex flex-col md:flex-row items-stretch gap-0 relative shadow-[0_20px_50px_rgba(4,47,46,0.5)] rounded-xl overflow-hidden ring-1 ring-[#059669]/30" style={{ backgroundImage: "linear-gradient(to right, rgba(2, 44, 34, 0.95), rgba(2, 44, 34, 0.8)), url('https://images.unsplash.com/photo-1596160522500-1c4627b0c306?q=80&w=800&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
            <div className="flex-1 p-8 relative flex flex-col justify-between backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border-r border-[#059669]/20">
              <div className="absolute top-0 left-8 w-16 h-[3px] bg-emerald-400 rounded-b-sm shadow-[0_0_12px_rgba(52,211,153,0.8)]"></div>
              
              <div className="flex justify-between items-start mb-8 mt-2">
                <div>
                  <h3 className="font-inter font-medium text-2xl text-white mb-2 tracking-tight">3-Year Acceleration</h3>
                  <p className="font-inter text-emerald-100/70 text-sm font-light">Give your supply team massive data opportunity leverage.</p>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-emerald-900/50 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)] relative">
                  <div className="absolute inset-[-3px] rounded-full border-[3px] border-emerald-400 border-l-transparent border-b-transparent transform rotate-45 shadow-[0_0_12px_rgba(52,211,153,0.4)]"></div>
                </div>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-slate-100 mb-8 font-inter font-light">
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" /> Flexible access matrix</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" /> Full Tally XML integration</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" /> 10 m/s and fast tracking nodes</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" /> Standard email access</li>
              </ul>
              
              <div className="flex justify-between items-end mt-auto">
                <div className="text-xs text-emerald-100/50 max-w-[60%] leading-relaxed font-light">Quantitatively accurate out of interception track line logging interfaces.</div>
                <button onClick={() => { setSelectedPlan('silver'); setShowModal(true); }} className="font-montserrat px-6 py-3 rounded-lg border border-emerald-400/30 hover:bg-emerald-400/10 hover:border-emerald-400/60 transition-colors text-sm font-medium uppercase tracking-tight text-white shadow-[0_4px_14px_0_rgba(4,47,46,0.39)]">
                  Upgrade to 3 Year
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-64 p-8 flex flex-col items-center justify-center text-center relative backdrop-blur-md bg-black/30 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none"></div>
              <div className="font-cormorant bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs px-4 py-1.5 rounded-full mb-6 font-semibold tracking-[0.1em] uppercase relative z-10 shadow-lg">GROWTH PHASE</div>
              <div className="font-inter text-emerald-100/60 text-[10px] uppercase font-semibold mb-2 relative z-10 tracking-widest">SILVER PRICE POINT</div>
              <div className="font-inter font-semibold text-5xl text-white mb-2 relative z-10 drop-shadow-lg">₹50k</div>
              <div className="font-inter text-emerald-400/80 text-xs font-medium relative z-10">/ 36 Months upfront</div>
            </div>
          </div>

          {/* Card 3: 5-Year Control Tower (Orange/Gold Tier - Walnut Wood) */}
          <div className="flex flex-col md:flex-row items-stretch gap-0 relative shadow-[0_20px_50px_rgba(67,30,15,0.5)] rounded-xl overflow-hidden ring-1 ring-[#f59e0b]/30" style={{ backgroundImage: "linear-gradient(to right, rgba(67, 30, 15, 0.95), rgba(67, 30, 15, 0.8)), url('https://images.unsplash.com/photo-1546413240-54a858140409?q=80&w=800&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
            <div className="flex-1 p-8 relative flex flex-col justify-between backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border-r border-[#f59e0b]/20">
              <div className="absolute top-0 left-8 w-16 h-[3px] bg-amber-400 rounded-b-sm shadow-[0_0_12px_rgba(251,191,36,0.8)]"></div>
              
              <div className="flex justify-between items-start mb-8 mt-2">
                <div>
                  <h3 className="font-inter font-medium text-2xl text-white mb-2 tracking-tight">5-Year Control Tower</h3>
                  <p className="font-inter text-amber-100/70 text-sm font-light">Accessible access to the out of spectrum industry traits.</p>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-amber-900/50 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)] relative">
                  <div className="absolute inset-[-3px] rounded-full border-[3px] border-amber-400 border-b-transparent transform rotate-12 shadow-[0_0_12px_rgba(251,191,36,0.4)]"></div>
                </div>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-slate-100 mb-8 font-inter font-light">
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" /> 4 Teams cross & from rounds</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" /> Core audit compliance vaults</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" /> Full system cost on availability</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" /> Privacy and access spaces</li>
              </ul>
              
              <div className="flex justify-between items-end mt-auto">
                <div className="text-xs text-amber-100/50 max-w-[60%] leading-relaxed font-light">Available in a step set up room call which track your line and instruction.</div>
                <button onClick={() => { setSelectedPlan('platinum'); setShowModal(true); }} className="font-montserrat px-6 py-3 rounded-lg border border-amber-400/30 hover:bg-amber-400/10 hover:border-amber-400/60 transition-colors text-sm font-medium uppercase tracking-tight text-white shadow-[0_4px_14px_0_rgba(67,30,15,0.39)]">
                  Select Advanced Tier
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-64 p-8 flex flex-col items-center justify-center text-center relative backdrop-blur-md bg-black/30 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none"></div>
              <div className="font-cormorant bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs px-4 py-1.5 rounded-full mb-6 font-semibold tracking-[0.1em] uppercase relative z-10 shadow-lg">FULL DATA TRACK LIMIT</div>
              <div className="font-inter text-amber-100/60 text-[10px] uppercase font-semibold mb-2 relative z-10 tracking-widest">BUDGET TEMA PRICE</div>
              <div className="font-inter font-semibold text-5xl text-white mb-2 relative z-10 drop-shadow-lg">₹1.00L</div>
              <div className="font-inter text-amber-400/80 text-xs font-medium relative z-10">/ 60 Months upfront</div>
            </div>
          </div>

          {/* Card 4: Lifetime Ownership (Purple Tier - Violet Velvet) */}
          <div className="flex flex-col md:flex-row items-stretch gap-0 relative shadow-[0_20px_50px_rgba(46,16,101,0.5)] rounded-xl overflow-hidden ring-1 ring-[#8b5cf6]/30" style={{ backgroundImage: "linear-gradient(to right, rgba(46, 16, 101, 0.95), rgba(46, 16, 101, 0.8)), url('https://images.unsplash.com/photo-1627914041793-010530752591?q=80&w=800&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none"></div>
            <div className="flex-1 p-8 relative flex flex-col justify-between backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border-r border-[#8b5cf6]/20">
              <div className="absolute top-0 left-8 w-16 h-[3px] bg-violet-400 rounded-b-sm shadow-[0_0_12px_rgba(139,92,246,0.8)]"></div>
              
              <div className="flex justify-between items-start mb-8 mt-2">
                <div>
                  <h3 className="font-inter font-medium text-2xl text-white mb-2 tracking-tight">Lifetime Ownership</h3>
                  <p className="font-inter text-violet-100/70 text-sm font-light">The best, last update. used in Partner Manufacturing tool.</p>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-violet-900/50 shadow-[inset_0_0_10px_rgba(139,92,246,0.2)] relative">
                  <div className="absolute inset-[-3px] rounded-full border-[3px] border-violet-400 border-l-transparent border-t-transparent transform rotate-45 shadow-[0_0_12px_rgba(139,92,246,0.4)]"></div>
                </div>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-slate-100 mb-8 font-inter font-light">
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0" /> And a gear set / ** ***** ****</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0" /> Authentication options</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0" /> Full prime q/m & accessibility</li>
                <li className="flex items-start"><CheckIcon className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0" /> Adaptable telemetry partners manage</li>
              </ul>
              
              <div className="flex justify-between items-end mt-auto">
                <div className="text-xs text-violet-100/50 max-w-[60%] leading-relaxed font-light">Unavailable on sub rather our clean call which track part logistical repository.</div>
                <button onClick={() => { setSelectedPlan('lifetime'); setShowModal(true); }} className="font-montserrat px-6 py-3 rounded-lg border border-violet-400/30 hover:bg-violet-400/10 hover:border-violet-400/60 transition-colors text-sm font-medium uppercase tracking-tight text-white shadow-[0_4px_14px_0_rgba(46,16,101,0.39)]">
                  Check Out & Now
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-64 p-8 flex flex-col items-center justify-center text-center relative backdrop-blur-md bg-black/30 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none"></div>
              <div className="font-cormorant bg-violet-950/60 border border-violet-700/50 text-violet-300 text-xs px-4 py-1.5 rounded-full mb-6 font-semibold tracking-[0.1em] uppercase relative z-10 shadow-lg">MAX DATA LIMITING</div>
              <div className="font-inter text-violet-100/60 text-[10px] uppercase font-semibold mb-2 relative z-10 tracking-widest">TIER 5 + EXCLUSIVE</div>
              <div className="font-inter font-semibold text-5xl text-white mb-2 relative z-10 drop-shadow-lg">₹5.00L</div>
              <div className="font-inter text-violet-400/80 text-xs font-medium relative z-10">Lifetime</div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-6 py-24 relative z-10 mt-16">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-2xl md:text-3xl font-medium tracking-[0.15em] text-[#e2d5c3] uppercase drop-shadow-md">
            Trusted by Industry Leaders
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1200px] mx-auto">
          {testimonials.map((t, idx) => (
            <div key={idx} className="backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-500 shadow-2xl ring-1 ring-white/10" style={{ backgroundImage: "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(240, 240, 245, 0.98)), url('https://images.unsplash.com/photo-1601657805126-7f4f6e1f06f5?q=80&w=800&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="h-48 w-full overflow-hidden border-b border-slate-200/50">
                 <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-7 flex-1 flex flex-col relative text-slate-800">
                 <div className="flex space-x-1 text-amber-500 mb-4 drop-shadow-sm">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                 </div>
                 <h4 className="font-inter font-semibold text-slate-900 text-sm mb-3 uppercase tracking-wider">{t.role}</h4>
                 <p className="font-inter text-slate-600 text-[13px] leading-relaxed mb-8 font-light flex-1 italic">
                   {t.text}
                 </p>
                 <div className="flex items-center space-x-4 pt-5 border-t border-slate-300/50">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md">
                       <img src={t.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-inter text-[11px] font-bold text-slate-900 uppercase tracking-widest">{t.name}</div>
                      <div className="font-inter text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{t.company}</div>
                    </div>
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
      <footer className="container mx-auto px-6 py-16 border-t border-slate-800 mt-20 flex flex-col md:flex-row justify-between items-start md:items-center text-sm text-slate-500 gap-10 relative z-10">
        <div className="flex flex-col gap-4">
           <div className="flex items-center space-x-3 mb-2">
              <img src={brandLogo} alt="Logo" className="h-6 w-auto opacity-70 brightness-0 invert" />
              <span className="font-montserrat font-bold tracking-[0.2em] uppercase text-slate-300 text-xs">TransitNode</span>
           </div>
           <p className="font-inter max-w-sm text-xs leading-loose text-slate-500 font-light">We proudly present more open solutions up to start that the initial step through process parameters provides operation easily minimal.</p>
        </div>
        <div className="grid grid-cols-2 gap-16 text-slate-400 text-xs">
           <div>
              <ul className="space-y-4 font-montserrat uppercase tracking-wider font-medium text-[10px]">
                 <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Terms of Use</li>
              </ul>
           </div>
        </div>
      </footer>
      
      {/* Big Screen Registration Portal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl overflow-hidden relative shadow-[0_25px_70px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
            
            {/* Left Hero Sidebar */}
            <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 flex flex-col justify-between border-r border-slate-700/60 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none"></div>
              
              <div>
                <div className="flex items-center space-x-3 mb-8">
                  <img src={brandLogo} alt="Logo" className="h-6 w-auto brightness-0 invert opacity-90" />
                  <span className="font-montserrat font-bold tracking-[0.2em] uppercase text-slate-200 text-xs">TransitNode</span>
                </div>
                
                <div className="inline-block bg-teal-950/80 border border-teal-600/50 text-teal-300 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider mb-4">
                  {selectedPlan} Plan Workspace Setup
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">Enterprise Logistics Core</h3>
                <p className="text-slate-300 text-xs leading-relaxed mb-6 font-light">
                  Get full control tower access, live fleet telemetry, automated Tally ERP syncing, and compliance vaults.
                </p>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center"><CheckIcon className="w-4 h-4 text-teal-400 mr-2" /> Dedicated Subdomain Provisioning</li>
                  <li className="flex items-center"><CheckIcon className="w-4 h-4 text-teal-400 mr-2" /> Multi-Tenant Role Isolation</li>
                  <li className="flex items-center"><CheckIcon className="w-4 h-4 text-teal-400 mr-2" /> Cashfree Gateway Integration</li>
                  <li className="flex items-center"><CheckIcon className="w-4 h-4 text-teal-400 mr-2" /> Single Sign-On (SSO) Magic Link</li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>🔒 256-Bit Encrypted Portal</span>
                <span className="font-mono text-teal-400 font-semibold">{isLocalhost ? 'Localhost Dev' : 'Production'}</span>
              </div>
            </div>

            {/* Right Interactive Form Area */}
            <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between relative bg-slate-900">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setCurrentStep('WORKSPACE');
                  setResult(null);
                }} 
                className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <div>
                {/* Step Progress Header */}
                <div className="mb-8 pr-8">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
                    <span className={currentStep === 'WORKSPACE' ? 'text-teal-400 font-bold' : ''}>1. Workspace</span>
                    <span className={currentStep === 'PAYMENT' ? 'text-teal-400 font-bold' : ''}>2. Payment</span>
                    <span className={currentStep === 'ADMIN_SETUP' ? 'text-teal-400 font-bold' : ''}>3. Admin Setup</span>
                    <span className={currentStep === 'COMPLETE' ? 'text-teal-400 font-bold' : ''}>4. Launch</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-500"
                      style={{
                        width: currentStep === 'WORKSPACE' ? '25%' : currentStep === 'PAYMENT' ? '50%' : currentStep === 'ADMIN_SETUP' ? '75%' : '100%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* STEP 1: CREATE WORKSPACE */}
                {currentStep === 'WORKSPACE' && (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-1">Create Workspace</h3>
                    <p className="text-slate-400 text-xs mb-6">Enter your organization details to reserve your dedicated logistics subdomain.</p>
                    
                    <form onSubmit={handleCreateWorkspace} className="space-y-5">
                      <div>
                        <label className="block text-slate-300 text-xs font-medium mb-1.5">Company Name</label>
                        <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm" placeholder="e.g. Koyala Logistics Inc" />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-xs font-medium mb-1.5">Registered Mobile Number</label>
                        <input required type="tel" value={formData.registeredMobile} onChange={e => setFormData({...formData, registeredMobile: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm" placeholder="+91 9876543210" />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-xs font-medium mb-1.5">Custom Workspace Domain</label>
                        <div className="flex">
                          <input required type="text" value={formData.customSubdomain} onChange={e => setFormData({...formData, customSubdomain: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-l-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-mono" placeholder="acme" />
                          <span className="bg-slate-700 border border-slate-600 border-l-0 rounded-r-xl px-4 py-3 text-slate-300 text-xs flex items-center font-mono">{domainSuffix}</span>
                        </div>
                      </div>
                      
                      <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl mt-6 transition-all disabled:opacity-50 text-sm shadow-lg shadow-teal-900/30">
                        {loading ? 'Reserving Subdomain...' : 'Create Workspace & Proceed to Payment →'}
                      </button>
                    </form>
                  </>
                )}

                {/* STEP 2: PAYMENT INTEGRATION */}
                {currentStep === 'PAYMENT' && (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-1">Payment Integration</h3>
                    <p className="text-slate-400 text-xs mb-6">Complete subscription checkout for <span className="text-amber-400 font-bold uppercase">{selectedPlan}</span> plan.</p>
                    
                    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 mb-6 text-xs space-y-3">
                      <div className="flex justify-between text-slate-300">
                        <span>Company:</span>
                        <span className="font-bold text-white text-sm">{formData.companyName}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Workspace URL:</span>
                        <span className="font-mono text-teal-400 text-sm">{formData.customSubdomain}{domainSuffix}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 border-t border-slate-700 pt-3 font-bold text-base">
                        <span>Total Payable:</span>
                        <span className="text-emerald-400">
                          {selectedPlan === 'silver' ? '₹50,000' : selectedPlan === 'platinum' ? '₹1,00,000' : '₹5,00,000'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {tenantInfo?.orderSessionId && (
                        <button 
                          onClick={handlePayment} 
                          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl transition-colors text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-900/30"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          <span>Pay via Cashfree Gateway</span>
                        </button>
                      )}

                      <button 
                        onClick={() => setCurrentStep('ADMIN_SETUP')} 
                        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium py-3 px-4 rounded-xl transition-colors text-xs"
                      >
                        Complete Payment & Proceed to First User Setup →
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 3: FIRST USER CREATE (ADMIN SETUP) */}
                {currentStep === 'ADMIN_SETUP' && (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-1">Create Admin Account</h3>
                    <p className="text-slate-400 text-xs mb-6">Set up master admin login credentials for <span className="text-teal-400 font-bold">{formData.companyName}</span>.</p>
                    
                    <form onSubmit={handleAdminSetup} className="space-y-4">
                      <div>
                        <label className="block text-slate-300 text-xs font-medium mb-1.5">Admin Username / Email</label>
                        <input 
                          required 
                          type="text" 
                          value={adminData.username} 
                          onChange={e => setAdminData({...adminData, username: e.target.value})} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm" 
                          placeholder="admin@domain.com or 9876543210" 
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-xs font-medium mb-1.5">New Password</label>
                        <input 
                          required 
                          type="password" 
                          value={adminData.password} 
                          onChange={e => setAdminData({...adminData, password: e.target.value})} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm" 
                          placeholder="••••••••" 
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-xs font-medium mb-1.5">Confirm Password</label>
                        <input 
                          required 
                          type="password" 
                          value={adminData.confirmPassword} 
                          onChange={e => setAdminData({...adminData, confirmPassword: e.target.value})} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm" 
                          placeholder="••••••••" 
                        />
                      </div>
                      
                      <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl mt-6 transition-all disabled:opacity-50 text-sm shadow-lg shadow-teal-900/30">
                        {loading ? 'Securing Credentials...' : 'Create Admin Account & Secure Workspace →'}
                      </button>
                    </form>
                  </>
                )}

                {/* STEP 4: MAGIC LINK & WORKSPACE OPEN */}
                {currentStep === 'COMPLETE' && (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-teal-900/50 border border-teal-500/40 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-900/40">
                      <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Workspace Ready!</h3>
                    <p className="text-slate-300 text-xs mb-8 max-w-sm mx-auto">Your dedicated workspace and admin credentials have been configured successfully.</p>
                    
                    <a 
                      href={result?.fullLoginUrl || tenantInfo?.fullLoginUrl || `http://${formData.customSubdomain}${domainSuffix}/login`}
                      className="w-full bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold py-4 px-6 rounded-xl transition-colors text-sm flex items-center justify-center space-x-2 shadow-xl shadow-teal-500/25"
                    >
                      <span>Login via Magic Link</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                  </div>
                )}
              </div>
              
              {/* Error or Alert banner */}
              {result && (
                <div className={`mt-6 p-3.5 rounded-xl text-xs ${result.success ? 'bg-teal-900/30 text-teal-400 border border-teal-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                  {result.message}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPortal;
