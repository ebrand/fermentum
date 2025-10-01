import React from 'react';

/**
 * Reusable tab header component for recipe tabs
 * Provides consistent styling and layout for tab headers
 */
const TabHeader = ({
  title,
  description,
  bgColor = 'bg-blue-50',
  icon: Icon,
  badge,
  actions
}) => {
  return (
    <div className={`${bgColor} rounded-lg p-4 mb-6 min-h-[85px]`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          {Icon && (
            <div className="flex-shrink-0">
              <Icon className="h-6 w-6 text-gray-700" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {badge !== undefined && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex-shrink-0 ml-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabHeader;