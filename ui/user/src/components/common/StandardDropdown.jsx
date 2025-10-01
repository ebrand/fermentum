import React, { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

/**
 * Standardized dropdown component with consistent 250px width using pure Tailwind CSS
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
  const [isOpen, setIsOpen] = useState(false)

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
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(!isOpen)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const hasWidthClass = className.includes('w-')
  const buttonClasses = `${hasWidthClass ? '' : 'w-[250px]'} inline-flex justify-between items-center gap-x-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-900 border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-fermentum-500 focus:border-transparent transition-colors duration-200 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'} ${className}`

  return (
    <div className={`relative ${hasWidthClass ? 'block' : 'inline-block'}`}>
      <button
        type="button"
        className={buttonClasses}
        disabled={disabled}
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        {...props}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
          {displayText}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`absolute left-0 z-[9999] mt-1 ${hasWidthClass ? 'w-full' : 'w-[250px]'} origin-top-left rounded-lg bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto focus:outline-none`}
            role="listbox"
          >
            <div className="py-1">
              {options.map((option, index) => (
                <button
                  key={option.value || index}
                  type="button"
                  className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                    option.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : `text-gray-700 hover:bg-fermentum-50 hover:text-fermentum-900`
                  } ${option.value === value ? 'bg-fermentum-50 text-fermentum-900 font-medium' : ''}`}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
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