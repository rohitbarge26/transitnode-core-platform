import React, { useState } from 'react';
import axios from 'axios';
import PricingTruckCard from '../../components/PricingTruckCard';
import HeroBackground from '../../components/HeroBackground';

const CheckIcon = ({ className = "w-6 h-6 text-teal-600 mx-auto" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const DashIcon = () => (
  <svg className="w-6 h-6 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
  </svg>
);

import brandLogo from '../../assets/brand_logo.png';
import brandName from '../../assets/brand_name.png';

const BrandLogo = ({ className = "h-10 w-auto object-contain" }) => (
  <img src={brandLogo} alt="Brand Logo" className={className} />
);

const TruckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);

const PricingPortal = () => {
  const features = [
    { name: "Multi-Language Driver Interface", free: true, silver: true, platinum: true, lifetime: true },
    { name: "Automated Geofence OTP Verification", free: false, silver: true, platinum: true, lifetime: true },
    { name: "Excel & Tally XML Export Suite", free: false, silver: true, platinum: true, lifetime: true },
    { name: "Real-Time P&L and Balance Sheet compilation", free: false, silver: false, platinum: true, lifetime: true },
  ];

  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [formData, setFormData] = useState({
    companyName: '',
    registeredMobile: '',
    customSubdomain: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: "William Alex",
      role: "Founder @LogisticsCorp",
      image: "https://i.pravatar.cc/150?img=11",
      text: "\"Highly recommend PROHIT CoreTech they helped me a lot. I love their work experience and best effort, I got best product design by them and excellent solution, in future we work again them, Thankful to the agency for given such as services.\"",
      bgColor: "bg-[#eefcf8]",
      iconColor: "bg-teal-500 text-white",
      iconPath: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
    },
    {
      name: "Madhu Mia",
      role: "Founder @FleetMaster",
      image: "https://i.pravatar.cc/150?img=68",
      text: "\"The multi-language support allowed our drivers across different states to adopt the app immediately. We've seen a 40% reduction in reporting delays and complete visibility into our fleet metrics.\"",
      bgColor: "bg-[#f8f7fc]",
      iconColor: "bg-indigo-500 text-white",
      iconPath: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
    },
    {
      name: "Sarah Jenkins",
      role: "Operations @FastTrack",
      image: "https://i.pravatar.cc/150?img=47",
      text: "\"Using the direct Tally ERP export has saved our accounting team hundreds of hours each month. The compliance vault ensures we never miss a vehicle renewal date again. Absolute game changer.\"",
      bgColor: "bg-[#fffbf0]",
      iconColor: "bg-amber-500 text-white",
      iconPath: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
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
          setResult({ success: false, message: 'Cashfree payment gateway SDK failed to load. Please refresh and try again.' });
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
    <div className="min-h-screen bg-[#07111a] text-slate-100 font-sans selection:bg-teal-500/30 overflow-x-hidden relative">
      {/* Dynamic Scrolling Highway Background */}
      <HeroBackground />

      <style>
        {`
          @keyframes driveRight {
            0% { transform: translateX(-150px); opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { transform: translateX(110vw); opacity: 0; }
          }
          @keyframes floatCloud {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-drive {
            animation: driveRight 20s linear infinite;
          }
          .animate-drive-delayed {
            animation: driveRight 25s linear infinite;
            animation-delay: 8s;
          }
          .animate-cloud {
            animation: floatCloud 6s ease-in-out infinite;
          }
        `}
      </style>

      {/* Background Fleet Animation Layer */}
      <div className="absolute top-40 left-0 right-0 h-64 pointer-events-none z-0 overflow-hidden opacity-20">
        <div className="absolute top-10 -left-32 animate-drive text-slate-400">
          <TruckIcon className="w-24 h-24" />
        </div>
        <div className="absolute top-24 -left-32 animate-drive-delayed text-teal-600">
          <TruckIcon className="w-16 h-16" />
        </div>
        {/* Clouds */}
        <div className="absolute top-4 left-[20%] text-slate-300 animate-cloud">
          <svg className="w-32 h-16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.6 0-.8.1-.5-2.6-2.8-4.6-5.7-4.6-3.3 0-6 2.7-6 6 0 .2 0 .5.1.7C3.1 12.6 1.5 14.6 1.5 17c0 2.8 2.2 5 5 5h11z"/></svg>
        </div>
        <div className="absolute top-12 left-[70%] text-slate-300 animate-cloud" style={{ animationDelay: '2s' }}>
          <svg className="w-24 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.6 0-.8.1-.5-2.6-2.8-4.6-5.7-4.6-3.3 0-6 2.7-6 6 0 .2 0 .5.1.7C3.1 12.6 1.5 14.6 1.5 17c0 2.8 2.2 5 5 5h11z"/></svg>
        </div>
      </div>

      {/* Navigation — sticky with solid background so it's always visible over the canvas */}
      <div className="sticky top-0 z-50 w-full bg-slate-950 border-b-2 border-teal-600/50 shadow-lg shadow-slate-950/80 backdrop-blur-md">
        <nav className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
            <BrandLogo className="h-8 md:h-10 w-auto object-contain flex-shrink-0" />
            <img src={brandName} alt="PROHIT CoreTech" className="h-5 sm:h-6 md:h-8 w-auto object-contain" style={{ transform: 'scaleX(1.25)', transformOrigin: 'left center' }} />
          </div>
          <button onClick={() => { setSelectedPlan('free'); setShowModal(true); }} className="bg-teal-600 hover:bg-teal-500 text-white px-4 md:px-7 py-2 md:py-2.5 rounded-full font-bold transition-all duration-300 shadow-lg shadow-teal-600/30 active:scale-95 text-xs md:text-sm whitespace-nowrap flex-shrink-0">
            Start 10-Day Trial
          </button>
        </nav>
      </div>      {/* Hero Segment */}
      <header className="container mx-auto px-3 sm:px-4 md:px-6 pt-16 pb-4 sm:pb-6 md:pb-8 md:pt-24 md:pb-12 text-center max-w-5xl relative">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="inline-block mb-4 px-5 py-2 rounded-full bg-slate-900/80 border border-teal-500/20 text-teal-400 text-sm font-bold tracking-widest shadow-sm uppercase">
          White-Label Logistics ERP
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-white">
          Enterprise Fleet Control. <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-500">
            Zero Friction.
          </span>
        </h1>
        
        <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto font-light">
          Scale your operations with automated telemetry tracking, localized multi-language driver applications, and direct corporate Tally ERP export files.
        </p>
      </header>
 
      {/* Fleet Pricing Section */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8 pb-16 md:pt-10 md:pb-20 relative z-10">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="inline-block mb-4 px-5 py-2 rounded-full bg-slate-800/80 border border-teal-500/20 text-teal-400 text-sm font-bold tracking-widest uppercase">
            Fleet Subscription Tiers
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Choose Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-teal-400">
              Operational Cargo
            </span>{' '}Volume
          </h2>
          <p className="text-slate-400 text-base mt-4 leading-relaxed">
            Select the subscription tier that matches your logistics fleet scale. No hidden fees.
          </p>
        </div>

        <div className="flex flex-col space-y-12 max-w-5xl mx-auto w-full">
          {/* Card 1: 10-Day Exploration */}
          <PricingTruckCard 
            title="10-Day Exploration"
            description="Perfect for testing our core capabilities on a limited scale."
            price="₹0"
            duration="10 Days"
            features={[
              "Restricted vehicle mapping counts",
              "Basic multi-language app access",
              "No custom subdomain",
              "Community support"
            ]}
            ctaText="Start Free Trial"
            onCtaClick={() => { setSelectedPlan('free'); setShowModal(true); }}
            badgeText="Starter Tier"
            cabinColor="bg-slate-800"
            textColor="text-slate-100"
            badgeBgColor="bg-slate-950"
            badgeTextColor="text-slate-400"
            accentBorderColor="border-slate-700"
            cargoLineColor="bg-slate-600"
            checkIconColor="text-slate-400"
          />

          {/* Card 2: 3-Year Acceleration */}
          <PricingTruckCard 
            title="3-Year Acceleration"
            description="Ideal for growing fleets needing deep operational integration."
            price="₹50k"
            duration="36 Months (3 Years)"
            features={[
              "Long-term structural savings",
              "Full Tally XML integration",
              "25 active vehicle tracking nodes",
              "Standard email support"
            ]}
            ctaText="Upgrade to Silver"
            onCtaClick={() => { setSelectedPlan('silver'); setShowModal(true); }}
            badgeText="Popular Value"
            cabinColor="bg-teal-600"
            textColor="text-white"
            badgeBgColor="bg-slate-950"
            badgeTextColor="text-teal-400"
            accentBorderColor="border-teal-500"
            cargoLineColor="bg-teal-500"
            checkIconColor="text-teal-400"
          />

          {/* Card 3: 5-Year Control Tower */}
          <PricingTruckCard 
            title="5-Year Control Tower"
            description="Unrestricted access to the entire logistics operating system."
            price="₹1.00L"
            duration="60 Months (5 Years)"
            features={[
              "Unlimited asset & driver counts",
              "Advanced compliance vaults",
              "Full system feature availability",
              "Priority 24/7 technical support"
            ]}
            ctaText="Secure Enterprise Plan"
            onCtaClick={() => { setSelectedPlan('platinum'); setShowModal(true); }}
            badgeText="Best Enterprise Value"
            cabinColor="bg-amber-500"
            textColor="text-slate-950"
            badgeBgColor="bg-slate-950"
            badgeTextColor="text-amber-400"
            accentBorderColor="border-amber-600"
            cargoLineColor="bg-amber-500"
            checkIconColor="text-amber-500"
          />

          {/* Card 4: Lifetime Ownership */}
          <PricingTruckCard 
            title="Lifetime Ownership"
            description="Pay once, own the ecosystem forever. No recurring fees."
            price="₹5.00L"
            duration="Lifetime"
            features={[
              "Never pay subscription fees again",
              "Lifetime platinum benefits",
              "VIP white-glove onboarding",
              "Dedicated customer success manager"
            ]}
            ctaText="Unlock Lifetime"
            onCtaClick={() => { setSelectedPlan('lifetime'); setShowModal(true); }}
            badgeText="Infinite Ownership"
            cabinColor="bg-indigo-600"
            textColor="text-white"
            badgeBgColor="bg-slate-950"
            badgeTextColor="text-indigo-300"
            accentBorderColor="border-indigo-500"
            cargoLineColor="bg-indigo-400"
            checkIconColor="text-indigo-400"
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-16 md:py-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div className="max-w-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-px w-8 bg-slate-600"></div>
                <span className="text-teal-400 font-bold tracking-widest uppercase text-xs">Testimonials</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
                What our customers say
              </h2>
            </div>
            <p className="max-w-xs mt-4 md:mt-0 text-slate-400 text-sm leading-relaxed border-l-2 border-slate-700 pl-4">
              Built for heavy-duty fleet operations with premium support and advanced tracking.
            </p>
          </div>

          {/* Carousel Area */}
          <div className="flex items-center justify-between gap-3">
            {/* Left Arrow */}
            <button
              onClick={() => setActiveTestimonial(prev => prev === 0 ? testimonials.length - 1 : prev - 1)}
              className="hidden md:flex w-9 h-9 rounded-full bg-slate-800 text-white items-center justify-center hover:bg-teal-600 transition-colors shadow-md flex-shrink-0 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>

            {/* Cards */}
            <div className="flex-1 rounded-xl overflow-hidden shadow-xl relative">
              <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((t, idx) => (
                  <div key={idx} className={`min-w-full w-full flex-shrink-0 ${t.bgColor} p-3 sm:p-4 md:p-6 md:p-8 flex flex-col justify-between`}>
                    <div className="max-w-xl mx-auto w-full">
                      <div className={`w-9 h-9 ${t.iconColor} flex items-center justify-center mb-5 rounded-lg shadow-sm transform -rotate-6`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={t.iconPath}/></svg>
                      </div>
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6 font-medium italic">
                        {t.text}
                      </p>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden shadow ring-2 ring-white flex-shrink-0">
                          <img src={t.image} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                          <p className="text-teal-600 font-semibold text-xs tracking-wide uppercase mt-0.5">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => setActiveTestimonial(prev => prev === testimonials.length - 1 ? 0 : prev + 1)}
              className="hidden md:flex w-9 h-9 rounded-full bg-slate-800 text-white items-center justify-center hover:bg-teal-600 transition-colors shadow-md flex-shrink-0 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center items-center space-x-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  activeTestimonial === idx
                    ? 'w-8 bg-teal-500 shadow-sm shadow-teal-500/40'
                    : 'w-1.5 bg-slate-500 hover:bg-slate-400'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>


      {/* Registration Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-10">
              <h3 className="text-3xl font-extrabold mb-3 text-slate-900">Start Your Registration</h3>
              <p className="text-slate-500 mb-8 text-lg">
                Provision your dedicated tenant workspace instantly.
                <span className="block mt-2 text-teal-600 font-semibold uppercase text-sm tracking-wide">Selected Tier: {selectedPlan}</span>
              </p>
              
              {result ? (
                <div className={`p-3 sm:p-4 md:p-6 rounded-2xl mb-8 ${result.success ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {result.message}
                </div>
              ) : null}

              {result?.success ? (
                <div className="pt-3 sm:pt-4 md:pt-6 flex flex-col items-center space-y-4 w-full">
                  {result.magicLink && (
                    <a 
                      href={result.magicLink} 
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 sm:px-6 md:px-8 py-3 rounded-xl font-bold transition-all text-center shadow-lg shadow-teal-600/25 text-lg block"
                    >
                      Go to Workspace Dashboard
                    </a>
                  )}
                  <button type="button" onClick={() => { setShowModal(false); setResult(null); }} className="px-3 sm:px-4 md:px-6 py-2 font-semibold text-slate-500 hover:text-slate-900 transition-all text-sm">
                    Close
                  </button>
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
                      <span className="bg-slate-100 border border-slate-200 border-l-0 text-slate-500 px-3 md:px-5 py-4 font-medium flex items-center text-xs md:text-sm whitespace-nowrap">.prohitcoretech.in</span>
                    </div>
                  </div>
                  <div className="pt-4 sm:pt-6 md:pt-8 flex items-center justify-end space-x-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowModal(false)} className="px-3 sm:px-4 md:px-6 py-3 rounded-xl font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all text-lg">Cancel</button>
                    <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-500 text-white px-4 sm:px-6 md:px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-teal-600/25 text-lg flex items-center">
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

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 border-t-2 border-slate-700 text-white">

        {/* Main Footer Grid */}
        <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl py-6 sm:py-8 md:py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            {/* Brand Block */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-3">
                <BrandLogo />
                <img src={brandName} alt="PROHIT CoreTech" className="h-10 w-auto object-contain" style={{ transform: 'scaleX(1.25)', transformOrigin: 'left center' }} />
              </div>
              <p className="max-w-md text-slate-300 text-sm leading-relaxed mb-6 mt-4">
                Next-generation enterprise logistics operating system for heavy-duty fleet control, telematics, and automated accounting — built and managed under <span className="text-teal-400 font-bold">PROHIT CoreTech</span>.
              </p>
              <div className="flex items-center space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-white transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-white transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="https://www.instagram.com/prohit6425?utm_source=qr&igsh=ZTFueWFjdWV3d24%3D" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-white transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-teal-400 font-bold text-xs uppercase tracking-widest mb-5 border-b border-slate-700 pb-2">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Fleet Tracking</a></li>
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Tally ERP Export</a></li>
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Compliance Vault</a></li>
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Financial Engine</a></li>
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Driver App</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-teal-400 font-bold text-xs uppercase tracking-widest mb-5 border-b border-slate-700 pb-2">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">About PROHIT CoreTech</a></li>
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-300 hover:text-teal-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Bar — solid dark background with guaranteed white text */}
        <div className="bg-slate-800 border-t-2 border-teal-500">
          <div className="h-[3px] bg-gradient-to-r from-teal-500 via-teal-300 to-emerald-400 w-full"></div>
          <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl" style={{ paddingTop: '28px', paddingBottom: '28px' }}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">

              {/* Left: Copyright + Product */}
              <div className="flex flex-col items-center md:items-start gap-1.5">
                <p className="text-sm text-white font-bold">
                  &copy; {new Date().getFullYear()}{' '}
                  <span className="text-teal-400 font-extrabold">PROHIT CoreTech</span>
                  <span className="text-white"> — All Rights Reserved.</span>
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  TransitNode ERP is a product of{' '}
                  <span className="text-teal-400 font-semibold">PROHIT CoreTech</span>.
                  Unauthorized reproduction is prohibited.
                </p>
              </div>

              {/* Center: Made in India badge */}
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-teal-700/50 border border-teal-500 shadow-md">
                <span className="text-base">🇮🇳</span>
                <span className="text-xs font-extrabold text-white tracking-wider uppercase">Made in India</span>
              </div>

              {/* Right: Legal links */}
              <div className="flex items-center space-x-4 text-xs text-slate-200 font-semibold">
                <a href="#" className="hover:text-teal-400 transition-colors duration-200">Privacy Policy</a>
                <span className="text-slate-400">·</span>
                <a href="#" className="hover:text-teal-400 transition-colors duration-200">Terms of Service</a>
                <span className="text-slate-400">·</span>
                <a href="#" className="hover:text-teal-400 transition-colors duration-200">System Status</a>
              </div>
            </div>
          </div>
        </div>

      </footer>

    </div>
  );
};

export default PricingPortal;
