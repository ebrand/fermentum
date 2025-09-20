import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  TruckIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const TenantNavigation = ({ isOpen, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedSections, setExpandedSections] = useState({
    brewery: true,
    production: false,
    inventory: false,
    sales: false,
    reports: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Brewery Management',
      icon: BuildingOfficeIcon,
      section: 'brewery',
      children: [
        { name: 'Brewery Settings', href: '/brewery/settings', icon: Cog6ToothIcon },
        { name: 'Locations', href: '/brewery/locations', icon: BuildingOfficeIcon },
        { name: 'Equipment', href: '/brewery/equipment', icon: BeakerIcon },
        { name: 'Maintenance', href: '/brewery/maintenance', icon: ExclamationTriangleIcon }
      ]
    },
    {
      name: 'Production',
      icon: BeakerIcon,
      section: 'production',
      children: [
        { name: 'Active Batches', href: '/production/batches', icon: BeakerIcon },
        { name: 'Recipes', href: '/production/recipes', icon: ClipboardDocumentListIcon },
        { name: 'Production Schedule', href: '/production/schedule', icon: CalendarIcon },
        { name: 'Quality Control', href: '/production/quality', icon: DocumentTextIcon }
      ]
    },
    {
      name: 'Inventory & Supply',
      icon: CubeIcon,
      section: 'inventory',
      children: [
        { name: 'Raw Materials', href: '/inventory/materials', icon: CubeIcon },
        { name: 'Finished Products', href: '/inventory/products', icon: BeakerIcon },
        { name: 'Suppliers', href: '/inventory/suppliers', icon: TruckIcon },
        { name: 'Purchase Orders', href: '/inventory/orders', icon: DocumentTextIcon },
        { name: 'Stock Alerts', href: '/inventory/alerts', icon: ExclamationTriangleIcon }
      ]
    },
    {
      name: 'Sales & Distribution',
      icon: TruckIcon,
      section: 'sales',
      children: [
        { name: 'Customer Orders', href: '/sales/orders', icon: DocumentTextIcon },
        { name: 'Customers', href: '/sales/customers', icon: UsersIcon },
        { name: 'Distribution', href: '/sales/distribution', icon: TruckIcon },
        { name: 'Pricing', href: '/sales/pricing', icon: CurrencyDollarIcon }
      ]
    },
    {
      name: 'Analytics & Reports',
      icon: ChartBarIcon,
      section: 'reports',
      children: [
        { name: 'Production Reports', href: '/reports/production', icon: BeakerIcon },
        { name: 'Financial Reports', href: '/reports/financial', icon: CurrencyDollarIcon },
        { name: 'Inventory Reports', href: '/reports/inventory', icon: CubeIcon },
        { name: 'Quality Reports', href: '/reports/quality', icon: DocumentTextIcon }
      ]
    },
    {
      name: 'Team Management',
      href: '/team',
      icon: UsersIcon,
      current: location.pathname === '/team'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      current: location.pathname === '/settings'
    }
  ]

  const handleNavigation = (href) => {
    if (href) {
      navigate(href)
      if (onClose) onClose()
    }
  }

  const isChildActive = (children) => {
    return children.some(child => location.pathname === child.href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 bg-fermentum-600">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-8 w-8 text-white" />
              <span className="text-white font-bold text-lg">Fermentum</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 bg-white overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {item.section ? (
                    /* Expandable Section */
                    <div>
                      <button
                        onClick={() => toggleSection(item.section)}
                        className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          isChildActive(item.children)
                            ? 'bg-fermentum-100 text-fermentum-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {expandedSections[item.section] ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                      </button>

                      {expandedSections[item.section] && (
                        <div className="mt-1 space-y-1">
                          {item.children.map((child) => (
                            <button
                              key={child.name}
                              onClick={() => handleNavigation(child.href)}
                              className={`group w-full flex items-center pl-10 pr-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                location.pathname === child.href
                                  ? 'bg-fermentum-100 text-fermentum-900 border-r-2 border-fermentum-600'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Single Navigation Item */
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-fermentum-100 text-fermentum-900 border-r-2 border-fermentum-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Quick Actions Footer */}
          <div className="flex-shrink-0 px-2 py-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-fermentum-600 bg-fermentum-50 rounded-md hover:bg-fermentum-100 transition-colors">
                <PlusIcon className="mr-2 h-4 w-4" />
                New Batch
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white rounded-md hover:bg-gray-50 transition-colors border border-gray-200">
                <DocumentTextIcon className="mr-2 h-4 w-4" />
                New Recipe
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TenantNavigation