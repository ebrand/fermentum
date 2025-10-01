import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'

const SlideDrawer = ({
  isOpen,
  onClose,
  onOpen = null, // Optional open handler
  title,
  subtitle,
  children,
  width = 'w-[600px]', // 50% wider than default 384px (w-96)
  position = 'right', // 'left' or 'right'
  tabText = null, // Optional tab text
  tabIcon = null // Optional tab icon component
}) => {
  const slideDirection = position === 'right' ? 'translate-x-full' : '-translate-x-full'
  const positionClasses = position === 'right' ? 'right-0' : 'left-0'
  const tabPosition = position === 'right' ? '-left-12' : '-right-12'
  const tabSlideDirection = position === 'right' ? 'translate-x-full' : '-translate-x-full'

  const handleTabClick = () => {
    if (isOpen) {
      onClose()
    } else if (onOpen) {
      onOpen()
    }
  }

  return (
    <>
      {/* Tab Button - Always visible and clickable */}
      {tabText && (
        <button
          onClick={handleTabClick}
          className={`fixed top-[100px] z-50 pointer-events-auto bg-blue-600/60 hover:bg-blue-700 text-white px-4 py-8 shadow-lg transition-all duration-750 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            position === 'right'
              ? `rounded-l-lg ${isOpen ? 'right-[600px]' : 'right-0 translate-x-[10px]'}`
              : `rounded-r-lg ${isOpen ? 'left-[600px]' : 'left-0 -translate-x-[10px]'}`
          }`}
          title={`${isOpen ? 'Close' : 'Open'} ${title || 'Drawer'}`}
        >
          <div className="flex flex-col items-center space-y-2">
            {tabIcon && React.createElement(tabIcon, { className: "h-5 w-5" })}
            <div className="text-sm font-medium font-['Menlo','Monaco','monospace'] whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              {tabText}
            </div>
          </div>
        </button>
      )}

      {/* Drawer Dialog - Only shows when open */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600/50" />
          </Transition.Child>

        {/* Drawer Panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={`pointer-events-none fixed inset-y-0 ${positionClasses} flex max-w-full pl-10`}>
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-750"
                enterFrom={slideDirection}
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo={slideDirection}
              >
                <Dialog.Panel className={`pointer-events-auto relative ${width} transform bg-white shadow-xl`}>
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
                  <div className="h-full flex-1 overflow-y-auto px-6 py-6">
                    {children}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

export default SlideDrawer