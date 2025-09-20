import React from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  error,
  help,
  className = ''
}) {
  const selectClasses = `
    w-full px-4 py-4
    border border-gray-200
    rounded-xl
    text-gray-900
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    transition-colors
    appearance-none
    pr-10
    ${error ? 'border-red-300 focus:ring-red-500' : ''}
    ${!value ? 'text-gray-400' : ''}
    ${className}
  `.trim()

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={selectClasses}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, index) => (
            <option
              key={option.value || index}
              value={option.value}
              className="text-gray-900"
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {help && (
        <p className="text-xs text-gray-500">{help}</p>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}