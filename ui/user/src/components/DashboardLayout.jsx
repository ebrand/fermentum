import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTenant } from '../contexts/TenantContext'
import {
  Bars3Icon,
  UserIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BuildingOfficeIcon, current: false },
  { name: 'Inventory', href: '/inventory', icon: BuildingOfficeIcon, current: false },
  { name: 'Production', href: '/production', icon: BuildingOfficeIcon, current: false },
  { name: 'Sales', href: '/sales', icon: BuildingOfficeIcon, current: false },
  { name: 'Reports', href: '/reports', icon: BuildingOfficeIcon, current: false },
  { name: 'Settings', href: '/brewery-settings', icon: Cog6ToothIcon, current: true },
]

const settingsTabs = [
  { name: 'My Account', href: '/settings/account', icon: UserIcon, current: false },
  { name: 'Company', href: '/brewery-settings', icon: BuildingOfficeIcon, current: true },
  { name: 'Team Members', href: '/settings/team', icon: UsersIcon, current: false },
  { name: 'Billing', href: '/settings/billing', icon: CreditCardIcon, current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function DashboardLayout({ children, title, subtitle, activeTab = 'Company', currentPage = 'Settings' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentTenant } = useTenant()
  const dropdownRef = useRef(null)

  // Update navigation current state based on currentPage prop
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: item.name === currentPage
  }))

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  // Test comment to trigger reload

  return (
    <div className="h-screen bg-cyan-50 flex flex-col overflow-hidden">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50">
        <header>
          <div>
            <div className="flex justify-between h-[100px] border-b border-teal-700">
              {/* Upper-Left Fermentum Logo */}
              <div className="w-64 bg-teal-700 flex items-center space-x-3">
                <div className="mx-auto">
                  <img src="/fermentum-logo.png" className="h-[60px]" alt="Fermentum Logo" />
                </div>
              </div>

              {/* Main Header */}
              <div className="flex flex-1 items-center justify-end space-x-4 pr-3 bg-teal-200 relative">
                <div className="flex-1 mx-6 md:text-4xl sm:text-lg text-teal-800 font-semibold tracking-tight">
                  {currentTenant?.name || 'Brewery Management'}
                </div>

                {/* Notification Bell */}
                <button className="flex-none text-teal-900 font-medium p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-70 transition-all duration-200">
                  <BellIcon className="w-8 h-8" strokeWidth={2} />
                </button>

                {/* User Profile Dropdown Menu */}
                <div className="flex flex-none bg-teal-400 p-3 items-center rounded-full" ref={dropdownRef}>
                  {/* Circle with Inits. or Profile Pic. */}
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                    <span className="text-teal-700 text-xs font-bold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>

                  {/* Name & E-mail */}
                  <div className="flex-1 text-teal-900 mx-3 text-left">
                    <div className="text-xs font-bold">{user?.firstName?.toUpperCase()} {user?.lastName?.toUpperCase()}</div>
                    <div className="text-xs opacity-80">{user?.email}</div>
                  </div>

                  {/* Chevron */}
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex-1 focus:outline-none"
                  >
                    <ChevronDownIcon className="flex-1 size-5 text-white" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Dropdown Menu - positioned outside header */}
      {profileDropdownOpen && (
        <div className="absolute right-3 top-20 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <Link
              to="/profile"
              
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
            >
              <UserIcon className="w-4 h-4 mr-3" strokeWidth={2} />
              My Profile
            </Link>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" strokeWidth={2} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 h-0">

        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-teal-700 fixed top-[100px] bottom-[0px] overflow-hidden z-40">
          <div className="h-full">
            <div className="flex flex-col">

              {/* Nav Buttons */}
              <div className="flex-1 p-6">
                <ul className="space-y-2">
                  {updatedNavigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={`w-full items-end flex uppercase text-left px-4 pb-2 pt-6 rounded-lg transition-colors ${
                          item.current
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-200 text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                      >
                        <span className="flex-1">
                          {item.name}
                        </span>
                        { item.current
                            ? (
                              <div className="flex-none text-white size-4 items-end pb-5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25" />
                                </svg>
                              </div>
                            )
                            : (
                              <div className="flex-none text-teal-700 size-4 items-end pb-5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                </svg>
                              </div>
                            )
                        }
                      </a>

                      {/* Sub-navigation for Settings */}
                      { item.current && currentPage === 'Settings' && settingsTabs.length > 0 && (
                          <div className="flex flex-col pt-3 justify-center">
                            {settingsTabs.map((tab) => (
                              <a
                                key={tab.name}
                                href={tab.href}
                                className={`flex uppercase text-xs text-right border border-white hover:bg-teal-50 p-2 rounded-full ${
                                  tab.name === activeTab ? 'bg-teal-50 text-teal-700' : ''
                                }`}
                              >
                                <div className="w-[18px] text-teal-900 flex-none ml-1">
                                  <tab.icon strokeWidth={2} />
                                </div>
                                <span className="flex-1 mr-1">{tab.name}</span>
                              </a>
                            ))}
                          </div>
                        )
                      }
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lower-Left Copyright */}
              <div className="w-64 bg-teal-700 h-[48px] fixed bottom-[0px] flex items-center justify-center">
                <span className="text-teal-200 text-sm">
                  &copy; 2025, Fermentum
                </span>
              </div>

            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col min-h-0 ml-64">

          {/* Scrollable Main Content */}
          <main className="flex-1 overflow-y-scroll">
            <div className="p-8">
              <div className="max-w-6xl">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-gray-600">
                      {subtitle}
                    </p>
                  )}
                </div>
                {children}
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  )
}