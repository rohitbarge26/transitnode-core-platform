import React from 'react';

// Large-target custom component optimized for touchscreen inputs
const TouchButton = ({ onClick, children, variant = 'primary', className = '' }) => {
  const baseStyle = 'w-full py-4 rounded-xl font-bold text-lg text-center transition-transform active:scale-95 touch-manipulation shadow-md';
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default TouchButton;
