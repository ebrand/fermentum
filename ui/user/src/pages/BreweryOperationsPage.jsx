import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { useSession } from '../contexts/SessionContext'
import {
  BeakerIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  BuildingOfficeIcon,
  StarIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function BreweryOperationsPage() {
  const { user, userTenants, currentTenant, setCurrentTenant, loading } = useSession()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('breweries')

  // Get user's subscription plan info using useMemo
  const planInfo = useMemo(() => {
    // Default plan info - in a real app this would come from the user/subscription API
    const professionalPlan = {
      name: 'Professional',
      maxBreweries: 5,
      features: ['Unlimited Batches', 'Quality Control', 'Inventory Management', 'Analytics'],
      currentBreweries: userTenants.length
    }

    // Determine plan based on user role or subscription data
    if (user?.role === 'fermentum-tenant') {
      return professionalPlan
    }

    return {
      name: 'Starter',
      maxBreweries: 1,
      features: ['Basic Operations', 'Limited Batches'],
      currentBreweries: userTenants.length
    }
  }, [user?.role, userTenants.length])

  const canCreateMoreBreweries = planInfo.currentBreweries < planInfo.maxBreweries

  const handleSelectBrewery = async (tenant) => {
    await setCurrentTenant(tenant.tenantId)
    setActiveTab('operations')
  }

  const handleCreateBrewery = () => {
    if (canCreateMoreBreweries) {
      navigate('/brewery-setup')
    }
  }

  const tabs = [
    { id: 'breweries', name: 'My Breweries', icon: BuildingOfficeIcon },
    { id: 'operations', name: 'Operations', icon: BeakerIcon }
  ]

  if (loading) {
    return (
      <DashboardLayout title="Loading..." currentPage="Brewery Operations">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Brewery Operations"
      subtitle="Manage your breweries and operations"
      currentPage="Brewery Operations"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 font-['Menlo','Monaco','monospace'] ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'breweries' && (
              <div className="space-y-6">
                {/* Plan Information */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <StarIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                          {planInfo.name} Plan
                        </h3>
                        <p className="text-sm text-gray-600 font-['Menlo','Monaco','monospace']">
                          {planInfo.currentBreweries} of {planInfo.maxBreweries} breweries
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 font-['Inter','-apple-system','system-ui','sans-serif']">
                        {planInfo.currentBreweries}/{planInfo.maxBreweries}
                      </div>
                      <div className="text-xs text-gray-500 font-['Menlo','Monaco','monospace']">breweries</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {planInfo.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-['Menlo','Monaco','monospace']"
                        >
                          <CheckIcon className="w-3 h-3 mr-1" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Brewery List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                      Your Breweries
                    </h3>
                    <button
                      onClick={handleCreateBrewery}
                      disabled={!canCreateMoreBreweries}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 font-['Menlo','Monaco','monospace'] ${
                        canCreateMoreBreweries
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Brewery
                    </button>
                  </div>

                  {!canCreateMoreBreweries && (
                    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mr-2" />
                        <p className="text-sm text-orange-700 font-['Menlo','Monaco','monospace']">
                          You've reached the maximum number of breweries for your {planInfo.name} plan.
                          Upgrade to create more breweries.
                        </p>
                      </div>
                    </div>
                  )}

                  {userTenants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userTenants.map((tenant) => (
                        <div
                          key={tenant.tenantId}
                          className={`bg-white border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            currentTenant?.tenantId === tenant.tenantId
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => handleSelectBrewery(tenant)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif'] truncate">
                                {tenant.name}
                              </h4>
                              <p className="text-xs text-gray-500 font-['Menlo','Monaco','monospace']">
                                Role: {tenant.role}
                              </p>
                              {currentTenant?.tenantId === tenant.tenantId && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-['Menlo','Monaco','monospace'] mt-1">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                        No breweries yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 font-['Menlo','Monaco','monospace']">
                        Get started by creating your first brewery.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={handleCreateBrewery}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-150 font-['Menlo','Monaco','monospace']"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Create Your First Brewery
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'operations' && (
              <div className="space-y-6">
                {currentTenant ? (
                  <>
                    {/* Current Brewery Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800 font-['Menlo','Monaco','monospace']">
                          Currently managing: {currentTenant.name}
                        </span>
                      </div>
                    </div>

                    {/* Operations Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Brewing Operations */}
                      <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
                        <div className="p-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <BeakerIcon className="h-6 w-6 text-blue-600" strokeWidth={1.5} />
                              </div>
                            </div>
                            <div className="ml-4 w-0 flex-1">
                              <dt className="text-sm font-medium text-gray-500 font-['Menlo','Monaco','monospace']">
                                Active Batches
                              </dt>
                              <dd className="text-2xl font-bold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                                3
                              </dd>
                              <dd className="text-sm text-gray-500 font-['Menlo','Monaco','monospace']">
                                in progress
                              </dd>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3">
                          <a href="/batches" className="text-sm font-medium text-blue-600 hover:text-blue-500 font-['Menlo','Monaco','monospace']">
                            View all batches →
                          </a>
                        </div>
                      </div>

                      {/* Equipment Status */}
                      <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
                        <div className="p-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="p-3 bg-green-50 rounded-lg">
                                <WrenchScrewdriverIcon className="h-6 w-6 text-green-600" strokeWidth={1.5} />
                              </div>
                            </div>
                            <div className="ml-4 w-0 flex-1">
                              <dt className="text-sm font-medium text-gray-500 font-['Menlo','Monaco','monospace']">
                                Equipment Status
                              </dt>
                              <dd className="text-2xl font-bold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                                ✓
                              </dd>
                              <dd className="text-sm text-green-600 font-['Menlo','Monaco','monospace']">
                                All operational
                              </dd>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3">
                          <a href="/equipment" className="text-sm font-medium text-blue-600 hover:text-blue-500 font-['Menlo','Monaco','monospace']">
                            Manage equipment →
                          </a>
                        </div>
                      </div>

                      {/* Quality Control */}
                      <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
                        <div className="p-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="p-3 bg-orange-50 rounded-lg">
                                <ClipboardDocumentListIcon className="h-6 w-6 text-orange-600" strokeWidth={1.5} />
                              </div>
                            </div>
                            <div className="ml-4 w-0 flex-1">
                              <dt className="text-sm font-medium text-gray-500 font-['Menlo','Monaco','monospace']">
                                QC Tests Pending
                              </dt>
                              <dd className="text-2xl font-bold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                                2
                              </dd>
                              <dd className="text-sm text-orange-600 font-['Menlo','Monaco','monospace']">
                                tests due
                              </dd>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3">
                          <a href="/quality-control" className="text-sm font-medium text-blue-600 hover:text-blue-500 font-['Menlo','Monaco','monospace']">
                            Quality control →
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                          Recent Operations Activity
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <BeakerIcon className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                                IPA Batch #2024-003 moved to secondary fermentation
                              </p>
                              <p className="text-xs text-gray-500 font-['Menlo','Monaco','monospace'] mt-1">
                                2 hours ago
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-orange-50 rounded-lg">
                                <ClipboardDocumentListIcon className="h-5 w-5 text-orange-600" strokeWidth={1.5} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                                Quality control test completed for Stout Batch #2024-002
                              </p>
                              <p className="text-xs text-gray-500 font-['Menlo','Monaco','monospace'] mt-1">
                                4 hours ago
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-green-50 rounded-lg">
                                <WrenchScrewdriverIcon className="h-5 w-5 text-green-600" strokeWidth={1.5} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                                Fermentation tank #3 cleaning cycle completed
                              </p>
                              <p className="text-xs text-gray-500 font-['Menlo','Monaco','monospace'] mt-1">
                                6 hours ago
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operations Quick Actions */}
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                          Quick Actions
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <button className="bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-150 font-['Menlo','Monaco','monospace']">
                            Start New Batch
                          </button>
                          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-150 font-['Menlo','Monaco','monospace']">
                            Schedule Cleaning
                          </button>
                          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-150 font-['Menlo','Monaco','monospace']">
                            Record QC Test
                          </button>
                          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-150 font-['Menlo','Monaco','monospace']">
                            Update Inventory
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                      Select a brewery to manage
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 font-['Menlo','Monaco','monospace']">
                      Choose a brewery from the "My Breweries" tab to view operations.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setActiveTab('breweries')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-150 font-['Menlo','Monaco','monospace']"
                      >
                        <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                        View My Breweries
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}