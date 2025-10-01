import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import DashboardLayout from '../components/DashboardLayout'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import RawMaterialModal from '../components/RawMaterialModal'
import StandardDropdown from '../components/common/StandardDropdown'
import { rawMaterialsAPI } from '../utils/api'
import {
  CubeIcon,
  PlusIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  TagIcon,
  CurrencyDollarIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

const RawMaterialsPage = () => {
  const { currentTenant } = useSession()
  const { showSuccess, showError } = useAdvancedNotification()
  const [rawMaterials, setRawMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [filteredMaterials, setFilteredMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load raw materials and categories when tenant changes
  useEffect(() => {
    if (currentTenant) {
      loadRawMaterials()
      loadCategories()
    }
  }, [currentTenant])

  const loadRawMaterials = async () => {
    setLoading(true)
    try {
      setError(null)
      const response = await rawMaterialsAPI.getRawMaterials(true) // Include inactive materials
      setRawMaterials(response.data.data || [])
    } catch (error) {
      console.error('Error loading raw materials:', error)
      setError('Failed to load raw materials')
      showError('Failed to load raw materials')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await rawMaterialsAPI.getCategories()
      setCategories(response.data.data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Modal handlers
  const openCreateModal = () => {
    setSelectedMaterial(null)
    setIsModalOpen(true)
  }

  const openEditModal = (material) => {
    setSelectedMaterial(material)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMaterial(null)
  }

  

  

  // Filter and search effect
  useEffect(() => {
    let filtered = rawMaterials.filter(material => {
      const matchesSearch = !searchTerm ||
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.sku && material.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = categoryFilter === 'all' || material.categoryId === categoryFilter

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

    setFilteredMaterials(filtered)
  }, [rawMaterials, searchTerm, categoryFilter, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.categoryId === categoryId)
    return category ? category.name : 'Uncategorized'
  }

  const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Raw Materials"
        subtitle="Manage grains, hops, yeast, and other brewing ingredients"
        currentPage="Inventory"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading raw materials...</h3>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Raw Materials"
      subtitle="Manage grains, hops, yeast, and other brewing ingredients"
      currentPage="Inventory"
    >
      <div className="space-y-6">
        {currentTenant ? (
          <>
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
                        onClick={loadRawMaterials}
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
                    <p className="text-3xl font-bold text-gray-600">
                      {rawMaterials.filter(m => m.isActive).length}
                    </p>
                    <p className="text-sm text-gray-500">Active materials</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BeakerIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Categories</h3>
                    <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
                    <p className="text-sm text-gray-500">Material types</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TagIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">With SKU</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {rawMaterials.filter(m => m.sku).length}
                    </p>
                    <p className="text-sm text-gray-500">Have product codes</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">With Pricing</h3>
                    <p className="text-3xl font-bold text-yellow-600">
                      {rawMaterials.filter(m => m.costPerUnit).length}
                    </p>
                    <p className="text-sm text-gray-500">Have cost data</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Add Material Button */}
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Raw Material
              </button>

              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category Filter */}
                <StandardDropdown
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map(category => ({
                      value: category.categoryId,
                      label: category.name
                    }))
                  ]}
                  placeholder="All Categories"
                />
              </div>
              
            </div>

            {/* Materials Table */}
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
                          <span>Material Name</span>
                          <ArrowsUpDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost/Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min Stock
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
                    {filteredMaterials.map((material) => (
                      <tr key={material.materialId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {material.name}
                            </div>
                            {material.description && (
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {material.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCategoryName(material.categoryId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.unitOfMeasure}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(material.costPerUnit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.minimumStock || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            material.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {material.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(material)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                              title="Edit Material"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(material.materialId)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Delete Material"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredMaterials.length === 0 && (
                <div className="text-center py-12">
                  <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No raw materials found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || categoryFilter !== 'all'
                      ? 'Try adjusting your search criteria.'
                      : 'Get started by adding your first raw material.'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'all' && (
                    <div className="mt-6">
                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-blue-800 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Your First Raw Material
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No Brewery Selected
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please select a brewery first to manage raw materials inventory.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/brewery-operations'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                  Select Brewery
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raw Material Modal */}
      <RawMaterialModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveMaterial}
        material={selectedMaterial}
        categories={categories}
        isLoading={isModalLoading}
      />
    </DashboardLayout>
  )
}

export default RawMaterialsPage