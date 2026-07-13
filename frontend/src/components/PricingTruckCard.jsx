import React from 'react';

const Wheel = () => (
  <div className="w-12 h-12 rounded-full bg-slate-900 border-[3px] border-slate-700 flex items-center justify-center shadow-lg relative z-20 transition-transform duration-1000 ease-out group-hover:rotate-[360deg]">
    {/* Inner metal rim */}
    <div className="w-7 h-7 rounded-full bg-slate-400 border-2 border-slate-600 flex items-center justify-center">
      {/* Hubcap center */}
      <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
    </div>
    {/* Tire Treads style ring */}
    <div className="absolute inset-0.5 rounded-full border border-slate-800/30 pointer-events-none"></div>
  </div>
);

const PricingTruckCard = ({
  title = "5-Year Control Tower",
  price = "₹1.00L",
  duration = "60 Months (5 Years)",
  description = "Unrestricted access to the entire logistics operating system.",
  features = [
    "Unlimited asset & driver counts",
    "Advanced compliance vaults",
    "Full system feature availability",
    "Priority 24/7 technical support"
  ],
  ctaText = "Secure Enterprise Plan",
  onCtaClick = () => {},
  badgeText = "Best Enterprise Value",
  // Styling Props
  cabinColor = "bg-amber-500",
  textColor = "text-slate-950",
  badgeBgColor = "bg-slate-950",
  badgeTextColor = "text-amber-400",
  accentBorderColor = "border-amber-600",
  cargoLineColor = "bg-amber-500",
  checkIconColor = "text-amber-500"
}) => {
  return (
    <div className="relative w-full max-w-5xl mx-auto my-8 pb-6 sm:pb-8 md:pb-12 group transition-all duration-500 hover:-translate-y-2">
      {/* Semi-Truck Chassis / Shadow Line */}
      <div className="absolute bottom-6 left-8 right-8 h-2.5 bg-slate-900/40 rounded-full blur-md opacity-60 z-0 transition-all duration-500 group-hover:scale-x-[1.02] group-hover:opacity-80"></div>

      {/* Steel Chassis Frame rails under/connecting components */}
      <div className="absolute bottom-[44px] left-16 right-16 h-3 bg-gradient-to-b from-slate-800 to-slate-950 border-t border-b border-slate-750 rounded z-0 hidden lg:block shadow-inner"></div>

      {/* Air Lines (Decals in the gap between Trailer and Cabin) */}
      <div className="absolute bottom-[56px] right-[300px] w-5 h-14 z-0 hidden lg:block overflow-visible pointer-events-none opacity-80 transition-transform duration-500 group-hover:translate-x-1">
        {/* Red Air Hose */}
        <svg className="absolute left-0 top-0 w-3 h-14 text-red-500" viewBox="0 0 12 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M 2 5 C 10 10, -2 15, 6 20 C 14 25, 2 30, 8 35 C 14 40, 2 45, 8 50 C 12 55, 6 58, 6 60" />
        </svg>
        {/* Blue Air Hose */}
        <svg className="absolute right-0 top-1 w-3 h-14 text-sky-500" viewBox="0 0 12 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M 10 5 C 2 10, 14 15, 6 20 C -2 25, 10 30, 4 35 C -2 40, 10 45, 4 50 C 0 55, 6 58, 6 60" />
        </svg>
      </div>

      {/* Horizontal Truck Frame Layout */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row lg:items-stretch lg:space-x-6">
        
        {/* Left Panel: The Trailer (Features & CTA) */}
        <div className="flex-1 bg-gradient-to-r from-slate-900 to-slate-950 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between z-10 rounded-3xl border border-slate-800 shadow-xl transition-colors duration-550 group-hover:border-slate-700/80 backdrop-blur-xl">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <span className={`h-2.5 w-8 ${cargoLineColor} rounded-full transition-all duration-500 group-hover:w-12`}></span>
              <span className={`text-xs font-extrabold uppercase tracking-widest ${checkIconColor}`}>Trailer Cargo</span>
            </div>
            
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm max-w-xl font-light mb-6 leading-relaxed">
              {description}
            </p>
            
            <div className="border-t border-slate-800/80 pt-3 sm:pt-4 md:pt-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-slate-300 text-sm transition-colors duration-300 hover:text-slate-100">
                    <svg className={`w-5 h-5 ${checkIconColor} mr-3 flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-3 sm:pt-4 md:pt-6 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-slate-500 italic max-w-xs leading-relaxed">
              Includes full localized driver app access and direct corporate Tally ERP export files.
            </p>
            <button
              onClick={onCtaClick}
              className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold px-4 sm:px-6 md:px-8 py-4 rounded-xl transition-all duration-300 shadow-md active:scale-98 whitespace-nowrap text-sm tracking-wide"
            >
              {ctaText}
            </button>
          </div>
        </div>

        {/* Right Panel: The Cabin (Pricing & Tier) with Aerodynamic slope */}
        <div className={`w-full lg:w-72 ${cabinColor} relative flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 lg:p-10 ${textColor} text-center select-none min-h-[250px] lg:min-h-full rounded-3xl lg:rounded-l-2xl lg:rounded-r-[48px] lg:rounded-tr-[115px] border ${accentBorderColor} shadow-xl overflow-hidden transition-all duration-500`}>
          
          {/* Aerodynamic windshield glass (Top Right) */}
          <div 
            className="absolute top-0 right-0 w-36 h-24 bg-slate-950/95 border-l border-b border-slate-900/60 rounded-tr-[115px] hidden lg:block overflow-hidden"
          >
            {/* Windshield glare shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-[150%] rotate-[20deg] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
          </div>

          {/* Cabin Side-Window Cutout Graphic */}
          <div className="absolute top-6 left-6 w-20 h-14 bg-slate-950/85 rounded-tl-xl rounded-br-2xl border-l border-b border-slate-900/40 hidden lg:block overflow-hidden">
            {/* Driver Silhouette */}
            <div className="absolute bottom-2 left-5 w-4 h-4 bg-slate-800 rounded-full opacity-60"></div>
            <div className="absolute bottom-0 left-3 w-8 h-2.5 bg-slate-800 rounded-t-md opacity-60"></div>
            {/* Window Glare */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] rotate-[20deg] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out delay-75"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {badgeText && (
              <span className={`mb-4 ${badgeBgColor} ${badgeTextColor} text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full tracking-wider shadow-md`}>
                {badgeText}
              </span>
            )}
            
            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">
              Subscription Cost
            </span>
            <span className="text-5xl font-black tracking-tight mt-1 mb-2 drop-shadow-sm">
              {price}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-md bg-black/10">
              {duration}
            </span>
          </div>

          {/* Front Grill Aerodynamic lines */}
          <div className="absolute bottom-6 right-8 flex flex-col space-y-1 opacity-25 hidden lg:flex">
            <div className="w-12 h-1 bg-slate-950 rounded-full"></div>
            <div className="w-10 h-1 bg-slate-950 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-950 rounded-full"></div>
          </div>
        </div>

      </div>

      {/* Heavy Dual Tandem Axles (Wheels positioned under chassis wrapper) */}
      
      {/* Front Wheel: Single axle steering wheel under the front cabin area */}
      <div className="absolute bottom-2 right-12 z-0 hidden lg:block">
        <Wheel />
      </div>

      {/* Middle Wheels: Dual tandem drive axles at the back of the tractor cab */}
      <div className="absolute bottom-2 right-[320px] flex space-x-1.5 z-0 hidden lg:block">
        <Wheel />
        <Wheel />
      </div>

      {/* Rear Wheels: Dual tandem trailer axles at the very back of the cargo trailer */}
      <div className="absolute bottom-2 left-12 flex space-x-1.5 z-0 hidden lg:block">
        <Wheel />
        <Wheel />
      </div>

    </div>
  );
};

export default PricingTruckCard;
