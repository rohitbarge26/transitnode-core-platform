import React from 'react';

// Visual timeline tracking: [Dispatched -> Arrived -> Delivered]
const TripTimelineStepper = ({ currentStatus }) => {
  const steps = ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'];
  const currentIndex = steps.indexOf(currentStatus) >= 0 ? steps.indexOf(currentStatus) : 0;

  return (
    <div className="w-full flex justify-between items-center px-4 py-6 bg-gray-800/50 rounded-2xl border border-gray-700/50">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isActive = index === currentIndex;
        
        return (
          <div key={step} className="flex flex-col items-center relative w-1/4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
              isActive ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 
              isCompleted ? 'bg-cyan-900 border-2 border-cyan-500' : 'bg-gray-700'
            }`}>
              {isCompleted && index < currentIndex && <span className="text-[10px] text-cyan-400">✓</span>}
            </div>
            
            <div className={`text-[10px] font-bold mt-2 text-center ${
              isActive ? 'text-cyan-400' : isCompleted ? 'text-gray-300' : 'text-gray-500'
            }`}>
              {step}
            </div>

            {index < steps.length - 1 && (
              <div className={`absolute top-3 left-[60%] right-[-40%] h-[2px] z-0 ${
                index < currentIndex ? 'bg-cyan-500' : 'bg-gray-700'
              }`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TripTimelineStepper;
