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
  helperText,
  disabled = false,
  icon: Icon,
  className = '',
  children,
  ...props
}) {
  const baseInputClasses = `
    w-full px-4 py-2.5
    border ${error ? 'border-red-300' : 'border-gray-300'}
    rounded-lg shadow-sm
    text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
    transition-colors
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
    ${type === 'textarea' ? 'resize-none' : ''}
    ${className}
  `.trim()

  return (
    <div>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
          {Icon && <Icon className="h-4 w-4 inline mr-1" />}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {children ? (
        children
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
          {...props}
        />
      )}

      {(help || helperText) && (
        <p className="mt-1 text-xs text-gray-500">{help || helperText}</p>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}