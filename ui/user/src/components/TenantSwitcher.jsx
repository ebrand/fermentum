import React, { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, PlusIcon, BuildingOfficeIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useTenant } from '../contexts/TenantContext'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function TenantSwitcher() {
  const { currentTenant, userTenants, selectTenant, hasMultipleTenants } = useTenant()
  const navigate = useNavigate()

  const handleSelectTenant = (tenant) => {
    if (tenant.tenantId !== currentTenant?.tenantId) {
      selectTenant(tenant)
      // Optionally reload the page or update the URL to reflect the new tenant context
      window.location.reload()
    }
  }

  const handleCreateTenant = () => {
    navigate('/create-tenant')
  }

  if (!currentTenant) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
      </div>
    )
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="truncate max-w-40">{currentTenant.tenantName}</span>
          {hasMultipleTenants && (
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
          )}
        </Menu.Button>
      </div>

      {hasMultipleTenants && (
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 z-10 mt-2 w-64 origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Your Breweries
              </div>
              {userTenants.map((tenant) => (
                <Menu.Item key={tenant.tenantId}>
                  {({ active }) => (
                    <button
                      onClick={() => handleSelectTenant(tenant)}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'group flex w-full items-center px-4 py-2 text-sm'
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <BuildingOfficeIcon
                          className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                          aria-hidden="true"
                        />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{tenant.tenantName}</div>
                          <div className="text-xs text-gray-500">Role: {tenant.role}</div>
                        </div>
                        {tenant.tenantId === currentTenant?.tenantId && (
                          <CheckIcon className="h-4 w-4 text-fermentum-600" />
                        )}
                      </div>
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>

            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleCreateTenant}
                    className={classNames(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'group flex w-full items-center px-4 py-2 text-sm'
                    )}
                  >
                    <PlusIcon
                      className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                    Create New Brewery
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      )}
    </Menu>
  )
}