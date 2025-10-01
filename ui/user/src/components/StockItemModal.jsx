import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const CATEGORIES = ['Grain', 'Hop', 'Yeast', 'Additive', 'Other']
const UNITS_OF_MEASURE = ['lbs', 'oz', 'g', 'kg', 'pkg', 'vial', 'ml', 'L', 'gal']

export default function StockItemModal({ isOpen, onClose, onSave, stockItem = null, mode = 'create' }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Grain',
    subcategory: '',
    supplier: '',
    supplierSKU: '',
    unitOfMeasure: 'lbs',
    unitCost: '',
    currency: 'USD',
    reorderLevel: '',
    reorderQuantity: '',
    leadTimeDays: '',
    storageLocation: '',
    storageRequirements: '',
    shelfLifeDays: '',
    isActive: true,
    notes: ''
  })

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && stockItem) {
        // Populate form with existing stock item data
        setFormData({
          sku: stockItem.sku || '',
          name: stockItem.name || '',
          description: stockItem.description || '',
          category: stockItem.category || 'Grain',
          subcategory: stockItem.subcategory || '',
          supplier: stockItem.supplier || '',
          supplierSKU: stockItem.supplierSKU || '',
          unitOfMeasure: stockItem.unitOfMeasure || 'lbs',
          unitCost: stockItem.unitCost?.toString() || '',
          currency: stockItem.currency || 'USD',
          reorderLevel: stockItem.reorderLevel?.toString() || '',
          reorderQuantity: stockItem.reorderQuantity?.toString() || '',
          leadTimeDays: stockItem.leadTimeDays?.toString() || '',
          storageLocation: stockItem.storageLocation || '',
          storageRequirements: stockItem.storageRequirements || '',
          shelfLifeDays: stockItem.shelfLifeDays?.toString() || '',
          isActive: stockItem.isActive !== undefined ? stockItem.isActive : true,
          notes: stockItem.notes || ''
        })
      } else {
        // Reset form for create mode
        setFormData({
          sku: '',
          name: '',
          description: '',
          category: 'Grain',
          subcategory: '',
          supplier: '',
          supplierSKU: '',
          unitOfMeasure: 'lbs',
          unitCost: '',
          currency: 'USD',
          reorderLevel: '',
          reorderQuantity: '',
          leadTimeDays: '',
          storageLocation: '',
          storageRequirements: '',
          shelfLifeDays: '',
          isActive: true,
          notes: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, mode, stockItem])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.unitOfMeasure) {
      newErrors.unitOfMeasure = 'Unit of measure is required'
    }

    if (formData.unitCost && (isNaN(formData.unitCost) || parseFloat(formData.unitCost) < 0)) {
      newErrors.unitCost = 'Unit cost must be a positive number'
    }

    if (formData.reorderLevel && (isNaN(formData.reorderLevel) || parseFloat(formData.reorderLevel) < 0)) {
      newErrors.reorderLevel = 'Reorder level must be a positive number'
    }

    if (formData.reorderQuantity && (isNaN(formData.reorderQuantity) || parseFloat(formData.reorderQuantity) < 0)) {
      newErrors.reorderQuantity = 'Reorder quantity must be a positive number'
    }

    if (formData.leadTimeDays && (isNaN(formData.leadTimeDays) || parseInt(formData.leadTimeDays) < 0)) {
      newErrors.leadTimeDays = 'Lead time must be a positive number'
    }

    if (formData.shelfLifeDays && (isNaN(formData.shelfLifeDays) || parseInt(formData.shelfLifeDays) < 0)) {
      newErrors.shelfLifeDays = 'Shelf life must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      // Prepare data for API
      const apiData = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        subcategory: formData.subcategory.trim() || null,
        supplier: formData.supplier.trim() || null,
        supplierSKU: formData.supplierSKU.trim() || null,
        unitOfMeasure: formData.unitOfMeasure,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
        currency: formData.currency,
        reorderLevel: formData.reorderLevel ? parseFloat(formData.reorderLevel) : null,
        reorderQuantity: formData.reorderQuantity ? parseFloat(formData.reorderQuantity) : null,
        leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : null,
        storageLocation: formData.storageLocation.trim() || null,
        storageRequirements: formData.storageRequirements.trim() || null,
        shelfLifeDays: formData.shelfLifeDays ? parseInt(formData.shelfLifeDays) : null,
        isActive: formData.isActive,
        notes: formData.notes.trim() || null
      }

      await onSave(apiData)
      onClose()
    } catch (error) {
      console.error('Error saving stock item:', error)
      // Error handling is done in parent component
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <h3 className="text-2xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add Stock Item' : 'Edit Stock Item'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={saving}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  disabled={mode === 'edit' || saving}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  } ${mode === 'edit' ? 'bg-gray-100' : ''}`}
                  placeholder="GRAIN-2ROW-01"
                />
                {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="2-Row Pale Malt"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500"
                placeholder="Base malt for all beer styles"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500"
                  placeholder="Base Malt"
                />
              </div>
            </div>
          </div>

          {/* Supplier Information Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Supplier Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500"
                  placeholder="Briess Malt & Ingredients"
                />
              </div>

              <div>
                <label htmlFor="supplierSKU" className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier SKU
                </label>
                <input
                  type="text"
                  id="supplierSKU"
                  name="supplierSKU"
                  value={formData.supplierSKU}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500"
                  placeholder="BRI-2ROW-50"
                />
              </div>
            </div>
          </div>

          {/* Pricing and Inventory Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Pricing & Inventory</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure <span className="text-red-500">*</span>
                </label>
                <select
                  id="unitOfMeasure"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.unitOfMeasure ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {UNITS_OF_MEASURE.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {errors.unitOfMeasure && <p className="mt-1 text-sm text-red-600">{errors.unitOfMeasure}</p>}
              </div>

              <div>
                <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost
                </label>
                <input
                  type="number"
                  id="unitCost"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleChange}
                  disabled={saving}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.unitCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.unitCost && <p className="mt-1 text-sm text-red-600">{errors.unitCost}</p>}
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  disabled={saving}
                  maxLength={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500"
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="reorderLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  id="reorderLevel"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  disabled={saving}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.reorderLevel ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.reorderLevel && <p className="mt-1 text-sm text-red-600">{errors.reorderLevel}</p>}
              </div>

              <div>
                <label htmlFor="reorderQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  id="reorderQuantity"
                  name="reorderQuantity"
                  value={formData.reorderQuantity}
                  onChange={handleChange}
                  disabled={saving}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.reorderQuantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.reorderQuantity && <p className="mt-1 text-sm text-red-600">{errors.reorderQuantity}</p>}
              </div>

              <div>
                <label htmlFor="leadTimeDays" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  id="leadTimeDays"
                  name="leadTimeDays"
                  value={formData.leadTimeDays}
                  onChange={handleChange}
                  disabled={saving}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.leadTimeDays ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.leadTimeDays && <p className="mt-1 text-sm text-red-600">{errors.leadTimeDays}</p>}
              </div>
            </div>
          </div>

          {/* Storage Information Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Storage Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="storageLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Location
                </label>
                <input
                  type="text"
                  id="storageLocation"
                  name="storageLocation"
                  value={formData.storageLocation}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500"
                  placeholder="Warehouse A, Shelf 3"
                />
              </div>

              <div>
                <label htmlFor="shelfLifeDays" className="block text-sm font-medium text-gray-700 mb-1">
                  Shelf Life (days)
                </label>
                <input
                  type="number"
                  id="shelfLifeDays"
                  name="shelfLifeDays"
                  value={formData.shelfLifeDays}
                  onChange={handleChange}
                  disabled={saving}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500 ${
                    errors.shelfLifeDays ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="365"
                />
                {errors.shelfLifeDays && <p className="mt-1 text-sm text-red-600">{errors.shelfLifeDays}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="storageRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                Storage Requirements
              </label>
              <textarea
                id="storageRequirements"
                name="storageRequirements"
                value={formData.storageRequirements}
                onChange={handleChange}
                disabled={saving}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500"
                placeholder="Keep dry, store at room temperature"
              />
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Additional Information</h4>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={saving}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-fermentum-500"
                placeholder="Any additional notes about this stock item"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                disabled={saving}
                className="h-4 w-4 text-fermentum-600 focus:ring-fermentum-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-fermentum-600 border border-transparent rounded-md hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Stock Item' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}