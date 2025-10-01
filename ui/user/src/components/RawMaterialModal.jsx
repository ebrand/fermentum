import React, { useState, useEffect } from 'react'
import { CubeIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import Modal, { ModalFooter } from './common/Modal'
import StandardDropdown from './common/StandardDropdown'

const UNIT_OF_MEASURE_OPTIONS = [
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'grams', label: 'Grams (g)' },
  { value: 'gallons', label: 'Gallons (gal)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'packages', label: 'Packages' },
  { value: 'units', label: 'Units' },
  { value: 'bags', label: 'Bags' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'cans', label: 'Cans' }
]

export default function RawMaterialModal({
  isOpen,
  onClose,
  onSave,
  material = null,
  categories = [],
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    sku: '',
    unitOfMeasure: 'lbs',
    costPerUnit: '',
    minimumStock: '',
    reorderPoint: '',
    isActive: true
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        description: material.description || '',
        categoryId: material.categoryId || '',
        sku: material.sku || '',
        unitOfMeasure: material.unitOfMeasure || 'lbs',
        costPerUnit: material.costPerUnit || '',
        minimumStock: material.minimumStock || '',
        reorderPoint: material.reorderPoint || '',
        isActive: material.isActive !== undefined ? material.isActive : true
      })
    } else {
      // Reset form for new material
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        sku: '',
        unitOfMeasure: 'lbs',
        costPerUnit: '',
        minimumStock: '',
        reorderPoint: '',
        isActive: true
      })
    }
    setErrors({})
  }, [material, isOpen])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Material name is required'
    }

    if (!formData.unitOfMeasure.trim()) {
      newErrors.unitOfMeasure = 'Unit of measure is required'
    }

    if (formData.costPerUnit && (isNaN(formData.costPerUnit) || formData.costPerUnit < 0)) {
      newErrors.costPerUnit = 'Please enter a valid cost per unit'
    }

    if (formData.minimumStock && (isNaN(formData.minimumStock) || formData.minimumStock < 0)) {
      newErrors.minimumStock = 'Please enter a valid minimum stock level'
    }

    if (formData.reorderPoint && (isNaN(formData.reorderPoint) || formData.reorderPoint < 0)) {
      newErrors.reorderPoint = 'Please enter a valid reorder point'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      // Convert numeric fields and clean data
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        sku: formData.sku?.trim() || null,
        unitOfMeasure: formData.unitOfMeasure.trim(),
        categoryId: formData.categoryId || null,
        costPerUnit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
        minimumStock: formData.minimumStock ? parseFloat(formData.minimumStock) : null,
        reorderPoint: formData.reorderPoint ? parseFloat(formData.reorderPoint) : null
      }
      onSave(submitData)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material ? 'Edit Raw Material' : 'Add New Raw Material'}
      icon={material ? <PencilSquareIcon /> : <PlusIcon />}
      iconBgColor="bg-blue-100"
      iconTextColor="text-blue-600"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Pilsner Malt, Cascade Hops, Safale US-05"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Optional description of the material, its characteristics, or brewing notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <StandardDropdown
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                options={[
                  { value: '', label: 'Select a category' },
                  ...categories.map(category => ({
                    value: category.categoryId,
                    label: category.name
                  }))
                ]}
                placeholder="Select a category"
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Product Code</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="e.g., PM-001, CH-CASCADE-1LB"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Pricing and Inventory */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Pricing and Inventory</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <StandardDropdown
                name="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={handleInputChange}
                options={UNIT_OF_MEASURE_OPTIONS}
                placeholder="Select unit of measure"
                disabled={isLoading}
                className={`w-full ${errors.unitOfMeasure ? 'border-red-300' : ''}`}
              />
              {errors.unitOfMeasure && <p className="text-red-600 text-xs mt-1">{errors.unitOfMeasure}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Unit</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="costPerUnit"
                value={formData.costPerUnit}
                onChange={handleInputChange}
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.costPerUnit ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.costPerUnit && <p className="text-red-600 text-xs mt-1">{errors.costPerUnit}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleInputChange}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.minimumStock ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.minimumStock && <p className="text-red-600 text-xs mt-1">{errors.minimumStock}</p>}
              <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="reorderPoint"
                value={formData.reorderPoint}
                onChange={handleInputChange}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.reorderPoint ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.reorderPoint && <p className="text-red-600 text-xs mt-1">{errors.reorderPoint}</p>}
              <p className="text-xs text-gray-500 mt-1">Trigger reorder process at this level</p>
            </div>
          </div>
        </div>

        {/* Status */}
        {material && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Status</h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active (material is available for use)
              </label>
            </div>
          </div>
        )}

        <ModalFooter
          secondaryAction={onClose}
          secondaryLabel="Cancel"
          primaryAction={handleSubmit}
          primaryLabel={material ? 'Update Material' : 'Create Material'}
          isPrimaryLoading={isLoading}
          isPrimaryDisabled={isLoading}
        />
      </form>
    </Modal>
  )
}