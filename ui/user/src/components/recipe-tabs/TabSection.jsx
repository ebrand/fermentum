import React from 'react';

/**
 * Reusable section component for recipe tabs
 * Provides consistent section layout with optional heading
 */
const TabSection = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={className}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default TabSection;