import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { PERMISSIONS, filterNavigationByPermissions } from '../utils/permissions'
import { TenantId, TenantIdCompact, UserId, UserIdCompact, BreweryId, BreweryIdCompact } from './IdDisplay'
import NotificationBell from './NotificationBell'
import {
  Bars3Icon,
  UserIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  BeakerIcon,
  HomeIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  TruckIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'

import {
  GrainIcon
} from './Icons'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    current: false,
    description: 'Overview and key metrics',
    requiredPermissions: [PERMISSIONS.DASHBOARD.VIEW]
  },
  {
    name: 'Assignments',
    href: '/assignments',
    icon: ClipboardDocumentListIcon,
    current: false,
    description: 'Task and assignment management',
    requiredPermissions: [PERMISSIONS.DASHBOARD.VIEW]
  },
  {
    name: 'Brewery Operations',
    href: '/brewery-operations',
    icon: BuildingOfficeIcon,
    current: false,
    description: 'Multi-brewery management and setup',
    requiredPermissions: [PERMISSIONS.DASHBOARD.VIEW]
  },
  {
    name: 'Production',
    href: '/production',
    icon: BeakerIcon,
    current: false,
    description: 'Batches, recipes, and brewing operations',
    requiredPermissions: [PERMISSIONS.PRODUCTION.VIEW],
    subItems: [
      {
        name: 'Production Batches',
        href: '/production/batches',
        description: 'Active brewing batches and schedules',
        requiredPermissions: [PERMISSIONS.PRODUCTION.VIEW]
      },
      {
        name: 'Recipes',
        href: '/production/recipes',
        description: 'Recipe management and versions',
        requiredPermissions: [PERMISSIONS.PRODUCTION.MANAGE_RECIPES]
      },
      {
        name: 'Beer Styles',
        href: '/production/styles',
        description: 'Style definitions and guidelines',
        requiredPermissions: [PERMISSIONS.PRODUCTION.MANAGE_STYLES]
      }
    ]
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: ArchiveBoxIcon,
    current: false,
    description: 'Raw materials and finished goods',
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW],
    subItems: [
      {
        name: 'Inventory Overview',
        href: '/inventory',
        description: 'Current stock levels and alerts',
        requiredPermissions: [PERMISSIONS.INVENTORY.VIEW]
      },
      {
        name: 'Raw Materials',
        href: '/inventory/materials',
        description: 'Grains, hops, yeast, and additives',
        requiredPermissions: [PERMISSIONS.INVENTORY.VIEW]
      },
      {
        name: 'Packaging',
        href: '/inventory/packaging',
        description: 'Bottles, cans, kegs, and labels',
        requiredPermissions: [PERMISSIONS.INVENTORY.VIEW]
      },
      {
        name: 'Finished Goods',
        href: '/inventory/finished',
        description: 'Ready-to-ship products',
        requiredPermissions: [PERMISSIONS.INVENTORY.VIEW]
      },
      {
        name: 'Inventory Counts',
        href: '/inventory/counts',
        description: 'Audit trails and adjustments',
        requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_COUNTS]
      }
    ]
  },
  {
    name: 'Sales & Orders',
    href: '/orders',
    icon: ShoppingCartIcon,
    current: false,
    description: 'Customer orders and sales management',
    requiredPermissions: [PERMISSIONS.SALES.VIEW],
    subItems: [
      {
        name: 'Orders',
        href: '/orders',
        description: 'Customer orders and fulfillment',
        requiredPermissions: [PERMISSIONS.SALES.VIEW]
      },
      {
        name: 'Products',
        href: '/orders/products',
        description: 'Product catalog and pricing',
        requiredPermissions: [PERMISSIONS.SALES.MANAGE_PRODUCTS]
      },
      {
        name: 'Customers',
        href: '/orders/customers',
        description: 'Customer database and relationships',
        requiredPermissions: [PERMISSIONS.SALES.MANAGE_CUSTOMERS]
      },
      {
        name: 'Customer Visits',
        href: '/orders/visits',
        description: 'Tasting room and tour tracking',
        requiredPermissions: [PERMISSIONS.SALES.VIEW_CUSTOMER_VISITS]
      }
    ]
  },
  {
    name: 'Equipment',
    href: '/equipment',
    icon: WrenchScrewdriverIcon,
    current: false,
    description: 'Brewery equipment and maintenance',
    requiredPermissions: [PERMISSIONS.EQUIPMENT.VIEW],
    subItems: [
      {
        name: 'Equipment List',
        href: '/equipment',
        description: 'All brewery equipment and assets',
        requiredPermissions: [PERMISSIONS.EQUIPMENT.VIEW]
      },
      {
        name: 'Maintenance',
        href: '/equipment/maintenance',
        description: 'Service records and schedules',
        requiredPermissions: [PERMISSIONS.EQUIPMENT.SCHEDULE_MAINTENANCE]
      },
      {
        name: 'Service History',
        href: '/equipment/service',
        description: 'Maintenance logs and costs',
        requiredPermissions: [PERMISSIONS.EQUIPMENT.RECORD_SERVICE]
      }
    ]
  },
  {
    name: 'Team',
    href: '/team',
    icon: UsersIcon,
    current: false,
    description: 'Staff management and access control',
    requiredPermissions: [PERMISSIONS.TEAM.VIEW],
    subItems: [
      {
        name: 'Employees',
        href: '/team/employees',
        description: 'Staff directory and roles',
        requiredPermissions: [PERMISSIONS.TEAM.VIEW]
      },
      {
        name: 'Customer Reps',
        href: '/team/representatives',
        description: 'Customer relationship assignments',
        requiredPermissions: [PERMISSIONS.TEAM.VIEW]
      },
      {
        name: 'Access Control',
        href: '/team/access',
        description: 'Permissions and security',
        requiredPermissions: [PERMISSIONS.TEAM.MANAGE_ACCESS]
      }
    ]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: DocumentChartBarIcon,
    current: false,
    description: 'Analytics and business intelligence',
    requiredPermissions: [PERMISSIONS.REPORTS.VIEW],
    subItems: [
      {
        name: 'Production Reports',
        href: '/reports/production',
        description: 'Batch efficiency and quality',
        requiredPermissions: [PERMISSIONS.REPORTS.VIEW_PRODUCTION]
      },
      {
        name: 'Sales Reports',
        href: '/reports/sales',
        description: 'Revenue and customer analytics',
        requiredPermissions: [PERMISSIONS.REPORTS.VIEW_SALES]
      },
      {
        name: 'Inventory Reports',
        href: '/reports/inventory',
        description: 'Stock levels and turnover',
        requiredPermissions: [PERMISSIONS.REPORTS.VIEW_INVENTORY]
      },
      {
        name: 'Financial Reports',
        href: '/reports/financial',
        description: 'Cost analysis and profitability',
        requiredPermissions: [PERMISSIONS.REPORTS.VIEW_FINANCIAL]
      }
    ]
  },
  {
    name: 'Settings',
    href: '/brewery-settings',
    icon: Cog6ToothIcon,
    current: true,
    description: 'Brewery configuration and preferences',
    requiredPermissions: [PERMISSIONS.SETTINGS.VIEW],
    subItems: [
      {
        name: 'My Account',
        href: '/profile',
        description: 'Personal profile and preferences',
        requiredPermissions: [] // Available to all authenticated users
      },
      {
        name: 'Integrations',
        href: '/settings/integrations',
        description: 'Third-party services and APIs',
        requiredPermissions: [PERMISSIONS.SETTINGS.MANAGE_INTEGRATIONS]
      },
      {
        name: 'Notifications Test',
        href: '/settings/notifications/test',
        description: 'Test notification system functionality',
        requiredPermissions: [PERMISSIONS.SETTINGS.VIEW]
      }
    ]
  }
]


function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function DashboardLayout({ children, title, subtitle, activeTab = 'Brewery Settings', currentPage = 'Settings' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [expandedNavItems, setExpandedNavItems] = useState({})
  const navigate = useNavigate()
  const { user, currentTenant, currentBrewery, invalidateSession } = useSession()
  const dropdownRef = useRef(null)

  // Debug current brewery value
  useEffect(() => {
    console.log('🏗️ [DashboardLayout] currentBrewery value:', {
      currentBrewery: currentBrewery ? { id: currentBrewery.breweryId, name: currentBrewery.name } : null,
      isNull: currentBrewery === null,
      isUndefined: currentBrewery === undefined,
      breweryName: currentBrewery?.name,
      shouldShowBrewery: !!currentBrewery?.name,
      fallbackText: currentBrewery?.name || 'Select a Brewery'
    })
  }, [currentBrewery])

  const handleProfileClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    setProfileDropdownOpen(false)

    // Try multiple navigation approaches
    try {
      navigate('/profile')
    } catch (error) {
      // Fallback to window.location
      window.location.href = '/profile'
    }
  }

  // Helper function to check if user has required role (legacy support)
  const hasRole = (requiredRole) => {
    if (!requiredRole) return true // No role requirement
    if (!user?.role) {
      return false // User has no role
    }
    const hasAccess = user.role === requiredRole || user.role === 'fermentum-tenant'
    return hasAccess // Allow fermentum-tenant to access everything
  }

  // Handle navigation item expansion
  const toggleNavExpansion = (itemName) => {
    setExpandedNavItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  // Initialize expanded state for current page
  useEffect(() => {
    navigation.forEach(item => {
      if (item.subItems) {
        const hasCurrentSubItem = item.subItems.some(sub =>
          window.location.pathname.startsWith(sub.href)
        )
        if (hasCurrentSubItem || item.name === currentPage) {
          setExpandedNavItems(prev => ({
            ...prev,
            [item.name]: true
          }))
        }
      }
    })
  }, [currentPage])

  // Update navigation current state and filter by permissions
  const updatedNavigation = filterNavigationByPermissions(navigation, user)
    .filter(item => hasRole(item.requiresRole)) // Legacy role support
    .map(item => ({
      ...item,
      current: item.name === currentPage || window.location.pathname.startsWith(item.href)
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

  // Updated dropdown sizing - v2 cache bust

  return (
    <div className="h-screen bg-gray-50 flex">

      {/* Left Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-sm border-r border-gray-200">

        {/* Logo Section */}
        <div className="bg-fermentum-800 flex items-center justify-center h-16 overflow-x-hidden overflow-y-hidden">
          {/* Logo */}
          <GrainIcon className="h-12 w-12 text-gray-400 -ml-6" />
          <span className="-ml-2 text-3xl font-bold text-white">Fermentum</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {updatedNavigation.map((item) => (
            <div key={item.name}>
              {/* Main Navigation Item */}
              <div className="group">
                {item.subItems ? (
                  <button
                    onClick={() => toggleNavExpansion(item.name)}
                    className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      item.current
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={`mr-3 h-5 w-5 ${item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}
                        strokeWidth={1.5}
                      />
                      <span className="font-['Inter','-apple-system','system-ui','sans-serif']">{item.name}</span>
                    </div>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform duration-200 ${
                        expandedNavItems[item.name] ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      item.current
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}
                      strokeWidth={1.5}
                    />
                    <span className="font-['Inter','-apple-system','system-ui','sans-serif']">{item.name}</span>
                  </a>
                )}
              </div>

              {/* Sub-navigation Items */}
              {item.subItems && expandedNavItems[item.name] && (
                <div className="mt-1 ml-8 space-y-1">
                  {item.subItems.map((subItem) => (
                    <a
                      key={subItem.name}
                      href={subItem.href}
                      className={`group flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors duration-150 ${
                        window.location.pathname === subItem.href
                          ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-400'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <span className="font-['Menlo','Monaco','monospace']">{subItem.name}</span>
                    </a>
                  ))}
                </div>
              )}

            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-fermentum-800">
          <p className="text-sm  text-gray-100 font-['Menlo','Monaco','monospace'] text-center">
            &copy; 2025 Fermentum
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">

            {/* Page Title */}
            <div className="flex-1">
              <div className="flex items-center space-x-3" key={`brewery-${currentBrewery?.breweryId || 'none'}`}>
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                    {(() => {
                      const breweryName = currentBrewery?.name || 'Select a Brewery'
                      console.log('🏗️ [DashboardLayout] Rendering h1 with breweryName:', breweryName, 'currentBrewery:', currentBrewery)
                      return breweryName
                    })()}
                  </h1>
                  <p className="text-sm text-gray-500 font-['Menlo','Monaco','monospace']">
                    {currentTenant?.userRole || 'No role assigned'} • Brewery Operations
                  </p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">

              {/* Advanced Notifications */}
              <NotificationBell className="transition-colors duration-150" />

              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white font-['Menlo','Monaco','monospace']">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 font-['Menlo','Monaco','monospace']">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-[60]">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 font-['Menlo','Monaco','monospace'] truncate">
                          {user?.email}
                        </p>
                      </div>

                      {/* Debug Info Section */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-medium text-gray-900 mb-3">Current Session:</p>
                        <div className="grid grid-cols-12 gap-x-4 gap-y-2 text-xs">
                          <div></div>
                          <div className="text-gray-500 col-span-3">Tenant:</div>
                          <div className="font-mono text-gray-900 col-span-8">
                            {currentTenant?.tenantId ? (<TenantId tenantId={currentTenant.tenantId} showCopy={true} prefix="" />) : ('None')}
                          </div>

                          <div></div>
                          <div className="text-gray-500 col-span-3">Brewery:</div>
                          <div className="font-mono text-gray-900 col-span-8">
                            {currentBrewery?.breweryId ? <BreweryId breweryId={currentBrewery.breweryId} showCopy={true} prefix="" /> : 'None'}
                          </div>

                          <div></div>
                          <div className="text-gray-500 col-span-3">User:</div>
                          <div className="font-mono text-gray-900 col-span-8">
                            {user?.userId ? <UserId userId={user.userId} showCopy={true} prefix="" /> : 'None'}
                          </div>

                          <div></div>
                          <div className="text-gray-500 col-span-3">Role:</div>
                          <div className="font-mono text-gray-900 col-span-8">
                            {currentTenant?.userRole || 'None'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-['Menlo','Monaco','monospace']"
                      >
                        <UserIcon className="w-4 h-4 mr-3 text-gray-400" strokeWidth={1.5} />
                        My Profile
                      </button>
                      <button
                        onClick={async (e) => {
                          // Prevent event bubbling to avoid triggering other click handlers
                          e.preventDefault()
                          e.stopPropagation()

                          // Close dropdown immediately
                          setProfileDropdownOpen(false)

                          // Manual logout since invalidateSession is disabled for debugging
                          console.log('🚪 [DashboardLayout] Signing out user...')

                          // Clear tokens and localStorage
                          localStorage.removeItem('accessToken')
                          localStorage.removeItem('refreshToken')
                          localStorage.removeItem('currentTenantId')
                          localStorage.removeItem('currentBreweryId')

                          console.log('✅ [DashboardLayout] Local storage cleared, navigating to landing page')

                          // Navigate to landing page (not onboarding)
                          navigate('/landing')

                          // Force page reload to ensure clean state
                          setTimeout(() => {
                            window.location.reload()
                          }, 100)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-900 bg-gray-200 hover:bg-fermentum-800 hover:text-gray-100 font-['Menlo','Monaco','monospace']"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3 text-gray-400" strokeWidth={1.5} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-gray-600 font-['Inter','-apple-system','system-ui','sans-serif']">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Page Content */}
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}