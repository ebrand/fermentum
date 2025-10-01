import React, { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const SlideDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'w-[600px]', // 50% wider than default 384px (w-96)
  position = 'right' // 'left' or 'right'
}) => {
  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const slideDirection = position === 'right' ? 'translate-x-full' : '-translate-x-full'
  const positionClasses = position === 'right' ? 'right-0' : 'left-0'

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-50 z-40 transition-opacity ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDuration: '2000ms' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${positionClasses} h-full ${width} bg-white shadow-2xl z-50 transform transition-all ease-out ${
          isOpen ? 'translate-x-0' : slideDirection
        }`}
        style={{ transitionDuration: '2000ms' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-500 font-['Menlo','Monaco','monospace'] mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
            >
              <span className="sr-only">Close drawer</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </>
  )
}

export default SlideDrawer