import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import DashboardLayout from '../components/DashboardLayout'
import { batchAPI, recipeAPI } from '../utils/api'
import Toast from '../components/common/Toast'
import Modal, { ModalFooter } from '../components/common/Modal'
import StandardDropdown from '../components/common/StandardDropdown'
import {
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function ProductionBatchesPage() {
  const { user, currentTenant, currentBrewery } = useSession()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [savingBatch, setSavingBatch] = useState(false)
  const [batchForm, setBatchForm] = useState({
    recipeId: '',
    name: '',
    batchNumber: '',
    description: '',
    plannedVolume: '',
    plannedVolumeUnit: 'gallons',
    startDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    try {
      setLoading(true)
      const response = await batchAPI.getBatches()
      if (response.data.success) {
        setBatches(response.data.data)
      } else {
        setError('Failed to load batches')
      }
    } catch (err) {
      console.error('Error loading batches:', err)
      setError('Failed to load batches. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadRecipes = async () => {
    try {
      setLoadingRecipes(true)
      const response = await recipeAPI.getRecipes()
      if (response.data.success) {
        setRecipes(response.data.data)
      }
    } catch (err) {
      console.error('Error loading recipes:', err)
      setToast({ show: true, message: 'Failed to load recipes', type: 'error' })
    } finally {
      setLoadingRecipes(false)
    }
  }

  const handleOpenBatchModal = () => {
    setShowBatchModal(true)
    loadRecipes()
  }

  const handleCloseBatchModal = () => {
    setShowBatchModal(false)
    setBatchForm({
      recipeId: '',
      name: '',
      batchNumber: '',
      description: '',
      plannedVolume: '',
      plannedVolumeUnit: 'gallons',
      startDate: new Date().toISOString().split('T')[0]
    })
  }

  const handleBatchFormChange = (field, value) => {
    setBatchForm(prev => ({ ...prev, [field]: value }))

    // Auto-populate fields when recipe is selected
    if (field === 'recipeId' && value) {
      const selectedRecipe = recipes.find(r => r.recipeId === value)
      if (selectedRecipe) {
        setBatchForm(prev => ({
          ...prev,
          name: selectedRecipe.name,
          plannedVolume: selectedRecipe.batchSize || '',
          plannedVolumeUnit: selectedRecipe.batchSizeUnit || 'gallons'
        }))
      }
    }
  }

  const handleCreateBatch = async () => {
    try {
      setSavingBatch(true)

      // Validate that we have a brewery selected
      if (!currentBrewery?.breweryId) {
        console.error('No brewery selected:', { currentBrewery, currentTenant })
        setToast({ show: true, message: 'No brewery selected. Please select a brewery first.', type: 'error' })
        setSavingBatch(false)
        return
      }

      const batchData = {
        breweryId: currentBrewery.breweryId,
        recipeId: batchForm.recipeId || null,
        name: batchForm.name,
        batchNumber: batchForm.batchNumber,
        description: batchForm.description,
        plannedVolume: batchForm.plannedVolume ? parseFloat(batchForm.plannedVolume) : null,
        plannedVolumeUnit: batchForm.plannedVolumeUnit,
        startDate: batchForm.startDate,
        status: 'Planning'
      }

      console.log('Creating batch with data:', batchData)

      const response = await batchAPI.createBatch(batchData)

      console.log('Batch creation response:', response)

      if (response.data.success) {
        setToast({ show: true, message: 'Batch created successfully!', type: 'success' })
        handleCloseBatchModal()
        await loadBatches()
      } else {
        const errorMsg = response.data.message || 'Failed to create batch'
        console.error('Batch creation failed:', response.data)
        setToast({ show: true, message: errorMsg, type: 'error' })
      }
    } catch (err) {
      console.error('Error creating batch:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)

      const errorMsg = err.response?.data?.message || err.message || 'Failed to create batch. Please try again.'
      setToast({ show: true, message: errorMsg, type: 'error' })
    } finally {
      setSavingBatch(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || ''
    const badges = {
      'planning': 'bg-gray-100 text-gray-800',
      'mashing': 'bg-blue-100 text-blue-800',
      'brewing': 'bg-blue-100 text-blue-800',
      'fermenting': 'bg-yellow-100 text-yellow-800',
      'conditioning': 'bg-purple-100 text-purple-800',
      'packaging': 'bg-indigo-100 text-indigo-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return badges[statusLower] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || ''
    switch (statusLower) {
      case 'planning':
        return <ClockIcon className="h-4 w-4" />
      case 'mashing':
      case 'brewing':
      case 'fermenting':
      case 'conditioning':
      case 'packaging':
        return <ClockIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const calculateProgress = (batch) => {
    // Simple progress calculation based on status
    const statusProgress = {
      'planning': 10,
      'mashing': 20,
      'brewing': 35,
      'fermenting': 60,
      'conditioning': 85,
      'packaging': 95,
      'completed': 100,
      'cancelled': 0
    }
    return statusProgress[batch.status?.toLowerCase()] || 0
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatVolume = (volume, unit) => {
    if (!volume) return 'N/A'
    return `${volume} ${unit || 'gal'}`
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Production Batches"
        subtitle="Monitor and manage your brewing batches"
        currentPage="Production"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading batches...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Production Batches"
      subtitle="Monitor and manage your brewing batches"
      currentPage="Production"
    >
      <div className="w-full">
        {/* Header Actions */}
        <div className="flex justify-start mb-6">
          <button
            onClick={handleOpenBatchModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Start New Batch
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BeakerIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Batches
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {batches.filter(b => b.status?.toLowerCase() !== 'completed' && b.status?.toLowerCase() !== 'cancelled').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Fermenting
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {batches.filter(b => b.status?.toLowerCase() === 'fermenting').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {batches.filter(b => b.status?.toLowerCase() === 'completed').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BeakerIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Volume
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {batches.reduce((sum, b) => sum + (b.plannedVolume || 0), 0).toFixed(1)} {batches[0]?.plannedVolumeUnit || 'gal'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {batches.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches yet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Get started by creating your first production batch
            </p>
          </div>
        )}

        {/* Batches Table */}
        {batches.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                All Batches
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Current brewing operations and batch status
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {batches.map((batch) => (
                <li key={batch.batchId}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <BeakerIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">
                              {batch.name}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(batch.status)}`}>
                              {getStatusIcon(batch.status)}
                              <span className="ml-1 capitalize">{batch.status}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Batch #: {batch.batchNumber} • {formatVolume(batch.plannedVolume, batch.plannedVolumeUnit)} • Started {formatDate(batch.startDate)}
                            {batch.recipeName && ` • Recipe: ${batch.recipeName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 capitalize">{batch.status}</p>
                          <p className="text-sm text-gray-500">
                            {batch.actualOG && `OG: ${batch.actualOG}`}
                            {batch.actualFG && ` • FG: ${batch.actualFG}`}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-fermentum-600 h-2 rounded-full"
                              style={{ width: `${calculateProgress(batch)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{calculateProgress(batch)}%</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-gray-400 hover:text-gray-500">
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-500">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {batch.description && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{batch.description}</p>
                      </div>
                    )}

                    {batch.status?.toLowerCase() !== 'completed' && batch.completedDate && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Expected completion: {formatDate(batch.completedDate)}</span>
                          <span>
                            {Math.ceil((new Date(batch.completedDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}

        {/* Start New Batch Modal */}
        <Modal
          isOpen={showBatchModal}
          onClose={handleCloseBatchModal}
          title="Start New Batch"
          icon={<BeakerIcon className="h-6 w-6 text-indigo-600" />}
        >
          <div className="space-y-6">
            {/* Recipe Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recipe
              </label>
              <StandardDropdown
                value={batchForm.recipeId}
                onChange={(e) => handleBatchFormChange('recipeId', e.target.value)}
                options={recipes.map(r => ({ value: r.recipeId, label: r.name }))}
                placeholder="Choose a recipe..."
                disabled={loadingRecipes}
              />
              <p className="mt-1 text-sm text-gray-500">
                Select a recipe to auto-populate batch details, or create a custom batch
              </p>
            </div>

            {/* Batch Name */}
            <div>
              <label htmlFor="batchName" className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name *
              </label>
              <input
                type="text"
                id="batchName"
                value={batchForm.name}
                onChange={(e) => handleBatchFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., West Coast IPA - Batch 001"
                required
              />
            </div>

            {/* Batch Number */}
            <div>
              <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Batch Number *
              </label>
              <input
                type="text"
                id="batchNumber"
                value={batchForm.batchNumber}
                onChange={(e) => handleBatchFormChange('batchNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., BATCH-001 or 2025-001"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="batchDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="batchDescription"
                value={batchForm.description}
                onChange={(e) => handleBatchFormChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Optional notes about this batch..."
              />
            </div>

            {/* Volume and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="plannedVolume" className="block text-sm font-medium text-gray-700 mb-2">
                  Planned Volume
                </label>
                <input
                  type="number"
                  id="plannedVolume"
                  value={batchForm.plannedVolume}
                  onChange={(e) => handleBatchFormChange('plannedVolume', e.target.value)}
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 5.0"
                />
              </div>
              <div>
                <label htmlFor="volumeUnit" className="block text-sm font-medium text-gray-700 mb-2">
                  Volume Unit
                </label>
                <select
                  id="volumeUnit"
                  value={batchForm.plannedVolumeUnit}
                  onChange={(e) => handleBatchFormChange('plannedVolumeUnit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="gallons">Gallons</option>
                  <option value="liters">Liters</option>
                  <option value="barrels">Barrels (BBL)</option>
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={batchForm.startDate}
                onChange={(e) => handleBatchFormChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <ModalFooter>
            <button
              type="button"
              onClick={handleCloseBatchModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={savingBatch}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateBatch}
              disabled={!batchForm.name || !batchForm.batchNumber || savingBatch}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingBatch ? 'Creating...' : 'Create Batch'}
            </button>
          </ModalFooter>
        </Modal>
      </div>
    </DashboardLayout>
  )
}