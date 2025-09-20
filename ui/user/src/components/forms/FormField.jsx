import React from 'react'

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  help,
  className = '',
  children,
  ...props
}) {
  const baseInputClasses = `
    w-full px-4 py-4
    border border-gray-200
    rounded-xl
    text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    transition-colors
    ${error ? 'border-red-300 focus:ring-red-500' : ''}
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

      {children ? (
        children
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={baseInputClasses}
          {...props}
        />
      )}

      {help && (
        <p className="text-xs text-gray-500">{help}</p>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}