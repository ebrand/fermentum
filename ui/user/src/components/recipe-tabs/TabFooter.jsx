import React from 'react';

/**
 * Reusable footer/helper component for recipe tabs
 * Displays help text, warnings, or informational messages
 */
const TabFooter = ({
  children,
  variant = 'info',
  className = ''
}) => {
  const variantClasses = {
    info: 'text-gray-500',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    success: 'text-green-600'
  };

  return (
    <p className={`text-xs ${variantClasses[variant]} mt-2 ${className}`}>
      {children}
    </p>
  );
};

export default TabFooter;