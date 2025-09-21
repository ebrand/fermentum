import React from 'react'
import { Menu } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

/**
 * Standardized dropdown component with consistent 250px width using Headless UI
 * @param {Object} props
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Change handler function
 * @param {Array} props.options - Array of option objects with value and label properties
 * @param {string} props.placeholder - Placeholder text when no option selected
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether dropdown is disabled
 * @param {string} props.name - Name attribute for form handling
 * @param {string} props.id - ID attribute
 */
export default function StandardDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  className = "",
  disabled = false,
  name,
  id,
  ...props
}) {
  const selectedOption = options.find(option => option.value === value)
  const displayText = selectedOption ? selectedOption.label : placeholder

  const handleSelect = (optionValue) => {
    if (onChange) {
      // Create a synthetic event object similar to what HTML select would provide
      const event = {
        target: {
          name,
          value: optionValue
        }
      }
      onChange(event)
    }
  }

  const buttonClasses = `w-[250px] inline-flex justify-between items-center gap-x-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-900 border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${className}`

  return (
    <Menu as="div" className="relative inline-block">
      <Menu.Button
        className={buttonClasses}
        disabled={disabled}
        id={id}
        {...props}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
          {displayText}
        </span>
        <ChevronDownIcon aria-hidden="true" className="h-5 w-5 text-gray-400 flex-shrink-0" />
      </Menu.Button>

      <Menu.Items
        className="absolute left-0 z-10 mt-1 w-[250px] origin-top-left rounded-lg bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto focus:outline-none"
      >
        <div className="py-1">
          {options.map((option, index) => (
            <Menu.Item key={option.value || index} disabled={option.disabled}>
              {({ active }) => (
                <button
                  type="button"
                  className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                    option.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : `text-gray-700 ${active ? 'bg-blue-50 text-blue-900' : ''}`
                  } ${option.value === value ? 'bg-blue-50 text-blue-900 font-medium' : ''}`}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                >
                  {option.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  )
}

// Common dropdown option sets for brewery operations
export const DEPARTMENT_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'brewing', label: 'Brewing' },
  { value: 'sales', label: 'Sales' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'quality', label: 'Quality' },
  { value: 'admin', label: 'Admin' }
]

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' }
]

export const ACCESS_LEVEL_OPTIONS = [
  { value: 'all', label: 'All Access Levels' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'standard', label: 'Standard' },
  { value: 'read_only', label: 'Read Only' }
]

export const BATCH_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'planning', label: 'Planning' },
  { value: 'brewing', label: 'Brewing' },
  { value: 'fermenting', label: 'Fermenting' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'completed', label: 'Completed' },
  { value: 'dumped', label: 'Dumped' }
]

export const EQUIPMENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Equipment Types' },
  { value: 'kettle', label: 'Kettle' },
  { value: 'fermenter', label: 'Fermenter' },
  { value: 'tank', label: 'Tank' },
  { value: 'pump', label: 'Pump' },
  { value: 'valve', label: 'Valve' },
  { value: 'packaging', label: 'Packaging Equipment' },
  { value: 'cleaning', label: 'Cleaning Equipment' }
]

export const INVENTORY_TYPE_OPTIONS = [
  { value: 'all', label: 'All Item Types' },
  { value: 'raw_material', label: 'Raw Materials' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'finished_good', label: 'Finished Goods' },
  { value: 'maintenance', label: 'Maintenance Supplies' },
  { value: 'office', label: 'Office Supplies' }
]

export const TIME_PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
]