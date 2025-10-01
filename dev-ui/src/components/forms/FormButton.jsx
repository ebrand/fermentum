import React from 'react'

export default function FormButton({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center
    font-semibold
    rounded-xl
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const variantClasses = {
    primary: `
      text-white
      bg-gradient-to-r from-indigo-600 to-purple-600
      hover:from-indigo-700 hover:to-purple-700
      focus:ring-indigo-500
    `,
    secondary: `
      text-gray-700
      bg-white
      border border-gray-200
      hover:bg-gray-50
      focus:ring-indigo-500
    `,
    outline: `
      text-indigo-600
      bg-transparent
      border border-indigo-600
      hover:bg-indigo-50
      focus:ring-indigo-500
    `
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-4 text-sm',
    lg: 'px-6 py-4 text-base'
  }

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim()

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      )}
      {children}
    </button>
  )
}