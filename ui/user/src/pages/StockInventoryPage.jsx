import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import DashboardLayout from '../components/DashboardLayout'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import StockItemModal from '../components/StockItemModal'
import api from '../utils/api'
import {
  CubeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const StockInventoryPage = () => {
  const { currentTenant } = useSession()
  const { showSuccess, showError } = useAdvancedNotification()
  const [stockItems, setStockItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [error, setError] = useState(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  // Load stock items when tenant changes
  useEffect(() => {
    if (currentTenant) {
      loadStockItems()
    }
  }, [currentTenant])

  const loadStockItems = async () => {
    setLoading(true)
    try {
      setError(null)
      const response = await api.get('/stock')
      setStockItems(response.data?.data || [])
    } catch (error) {
      console.error('Error loading stock items:', error)
      setError('Failed to load stock inventory')
      showError('Failed to load stock inventory')
    } finally {
      setLoading(false)
    }
  }

  // Filter and search effect
  useEffect(() => {
    let filtered = stockItems.filter(item => {
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

      return matchesSearch && matchesCategory
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue ? bValue.toLowerCase() : ''
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredItems(filtered)
  }, [stockItems, searchTerm, categoryFilter, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const getStockStatus = (item) => {
    if (!item.totalQuantityOnHand) return 'out-of-stock'
    if (item.reorderLevel && item.totalQuantityOnHand <= item.reorderLevel) return 'low-stock'
    return 'in-stock'
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in-stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            In Stock
          </span>
        )
      case 'low-stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Low Stock
          </span>
        )
      case 'out-of-stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Out of Stock
          </span>
        )
      default:
        return null
    }
  }

  const calculateStats = () => {
    const activeItems = stockItems.filter(item => item.isActive)
    const lowStockItems = activeItems.filter(item => getStockStatus(item) === 'low-stock')
    const outOfStockItems = activeItems.filter(item => getStockStatus(item) === 'out-of-stock')
    const totalValue = activeItems.reduce((sum, item) => {
      const quantity = item.totalQuantityOnHand || 0
      const cost = item.unitCost || 0
      return sum + (quantity * cost)
    }, 0)

    return {
      totalItems: activeItems.length,
      lowStock: lowStockItems.length,
      outOfStock: outOfStockItems.length,
      totalValue
    }
  }

  const stats = calculateStats()

  // Handler functions for CRUD operations
  const handleAddNew = () => {
    setModalMode('create')
    setSelectedItem(null)
    setIsModalOpen(true)
  }

  const handleEdit = (item) => {
    setModalMode('edit')
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setIsDeleteConfirmOpen(true)
  }

  const handleSaveStock = async (stockData) => {
    try {
      if (modalMode === 'create') {
        const response = await api.post('/stock', stockData)
        if (response.data?.success) {
          showSuccess('Stock item created successfully')
          await loadStockItems()
        } else {
          throw new Error(response.data?.message || 'Failed to create stock item')
        }
      } else {
        const response = await api.put(`/stock/${selectedItem.stockId}`, stockData)
        if (response.data?.success) {
          showSuccess('Stock item updated successfully')
          await loadStockItems()
        } else {
          throw new Error(response.data?.message || 'Failed to update stock item')
        }
      }
    } catch (error) {
      console.error('Error saving stock item:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save stock item'
      showError(errorMessage)
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      const response = await api.delete(`/stock/${itemToDelete.stockId}`)
      if (response.data?.success) {
        showSuccess('Stock item deleted successfully')
        await loadStockItems()
        setIsDeleteConfirmOpen(false)
        setItemToDelete(null)
      } else {
        throw new Error(response.data?.message || 'Failed to delete stock item')
      }
    } catch (error) {
      console.error('Error deleting stock item:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete stock item'
      showError(errorMessage)
    }
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Stock Inventory"
        subtitle="Manage inventory levels and track stock movements"
        currentPage="Inventory"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading stock inventory...</h3>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Stock Inventory"
      subtitle="Manage inventory levels and track stock movements"
      currentPage="Inventory"
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadStockItems}
                    className="bg-red-100 px-2 py-1 text-sm rounded-md text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Items</h3>
                <p className="text-3xl font-bold text-gray-600">{stats.totalItems}</p>
                <p className="text-sm text-gray-500">Active stock items</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Low Stock</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.lowStock}</p>
                <p className="text-sm text-gray-500">Need reordering</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Out of Stock</h3>
                <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
                <p className="text-sm text-gray-500">Critical items</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Value</h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.totalValue)}
                </p>
                <p className="text-sm text-gray-500">Inventory value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Stock Item
          </button>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search stock..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Grain">Grains</option>
              <option value="Hop">Hops</option>
              <option value="Yeast">Yeasts</option>
              <option value="Additive">Additives</option>
            </select>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Item Name</span>
                      <ArrowsUpDownIcon className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    On Hand
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item)
                  return (
                    <tr key={item.stockId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.supplier && (
                            <div className="text-sm text-gray-500">{item.supplier}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.totalQuantityOnHand || 0} {item.unitOfMeasure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.totalQuantityReserved || 0} {item.unitOfMeasure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.totalQuantityAvailable || 0} {item.unitOfMeasure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.reorderLevel ? `${item.reorderLevel} ${item.unitOfMeasure}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Stock"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Stock"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stock items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by adding your first stock item.'
                }
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 bg-blue-800 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Your First Stock Item
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stock Item Modal */}
        <StockItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveStock}
          stockItem={selectedItem}
          mode={modalMode}
        />

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Stock Item</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => {
                      setIsDeleteConfirmOpen(false)
                      setItemToDelete(null)
                    }}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StockInventoryPage