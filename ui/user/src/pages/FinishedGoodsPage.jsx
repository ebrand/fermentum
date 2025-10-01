import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import DashboardLayout from '../components/DashboardLayout'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import {
  ArchiveBoxIcon,
  PlusIcon,
  BuildingOfficeIcon,
  CubeIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

const FinishedGoodsPage = () => {
  const { currentTenant, setCurrentTenant } = useSession()
  const { showSuccess, showError } = useAdvancedNotification()
  const [finishedGoods, setFinishedGoods] = useState([])
  const [loading, setLoading] = useState(false)

  // Load finished goods when tenant changes
  useEffect(() => {
    if (currentTenant) {
      loadFinishedGoods()
    }
  }, [currentTenant])

  const loadFinishedGoods = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await inventoryAPI.getFinishedGoods(currentTenant.tenantId)
      // setFinishedGoods(response.data)

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500))
      setFinishedGoods([])
    } catch (error) {
      console.error('Error loading finished goods:', error)
      showError('Failed to load finished goods')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = () => {
    // TODO: Implement add product functionality
    showSuccess('Add product functionality coming soon!')
  }

  return (
    <DashboardLayout
      title="Finished Goods"
      subtitle="Manage beer inventory, packaging, and distribution"
      currentPage="Inventory"
    >
      <div className="space-y-6">
        {currentTenant ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArchiveBoxIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Beer Styles</h3>
                    <p className="text-3xl font-bold text-gray-600">-</p>
                    <p className="text-sm text-gray-500">Different products</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CubeIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">In Stock</h3>
                    <p className="text-3xl font-bold text-green-600">-</p>
                    <p className="text-sm text-gray-500">Available inventory</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <TruckIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Ready to Ship</h3>
                    <p className="text-3xl font-bold text-blue-600">-</p>
                    <p className="text-sm text-gray-500">Packaged products</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-sm">$</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Total Value</h3>
                    <p className="text-3xl font-bold text-purple-600">-</p>
                    <p className="text-sm text-gray-500">Inventory worth</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Finished Goods Inventory</h3>
                  <p className="text-sm text-gray-500">
                    Track your beer inventory, manage packaging, and handle distribution
                  </p>
                </div>
                <button
                  onClick={handleAddProduct}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Product Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <ArchiveBoxIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Kegs</h3>
                    <p className="text-sm text-gray-500">Draft beer inventory</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-600">-</p>
                  <p className="text-xs text-gray-500">Total kegs in inventory</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ArchiveBoxIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Bottles</h3>
                    <p className="text-sm text-gray-500">Bottled beer inventory</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-600">-</p>
                  <p className="text-xs text-gray-500">Total bottles in inventory</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Cans</h3>
                    <p className="text-sm text-gray-500">Canned beer inventory</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-600">-</p>
                  <p className="text-xs text-gray-500">Total cans in inventory</p>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Products Yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Start by adding your first finished product to track inventory levels, packaging types, and distribution.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleAddProduct}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Your First Product
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No Brewery Selected
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please select a brewery first to manage finished goods inventory.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/brewery-operations'}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                  Select Brewery
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default FinishedGoodsPage