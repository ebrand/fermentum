import React, { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  icon,
  iconBgColor = 'bg-gray-100',
  iconTextColor = 'text-gray-600',
  size = 'md', // sm, md, lg, xl
  showCloseButton = true,
  className = ''
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`
            relative w-full ${sizeClasses[size]} transform rounded-2xl bg-white
            shadow-2xl transition-all ${className}
          `}
          onClick={e => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                {/* Icon */}
                {icon && (
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                    ${iconBgColor}
                  `}>
                    <div className={`w-6 h-6 ${iconTextColor}`}>
                      {icon}
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 leading-6">
                    {title}
                  </h2>
                </div>
              </div>

              {/* Close button */}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Body */}
            <div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal footer component for consistent button styling
export const ModalFooter = ({
  children,
  primaryAction,
  secondaryAction,
  primaryLabel = 'Confirm',
  secondaryLabel = 'Cancel',
  primaryVariant = 'primary', // primary, danger, success
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  className = ''
}) => {
  const primaryVariantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  }

  if (children) {
    return (
      <div className={`flex justify-end space-x-3 pt-6 ${className}`}>
        {children}
      </div>
    )
  }

  return (
    <div className={`flex justify-end space-x-3 pt-6 ${className}`}>
      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {secondaryLabel}
        </button>
      )}

      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction}
          disabled={isPrimaryDisabled || isPrimaryLoading}
          className={`
            px-6 py-2.5 text-sm font-medium rounded-lg transition-colors
            focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${primaryVariantClasses[primaryVariant]}
          `}
        >
          {isPrimaryLoading ? 'Loading...' : primaryLabel}
        </button>
      )}
    </div>
  )
}

export default Modal