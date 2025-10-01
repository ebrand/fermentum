import React, { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilSquareIcon, ArrowUpIcon, ArrowDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import StandardDropdown from '../common/StandardDropdown'
import api from '../../utils/api'

// Step types
const STEP_TYPES = [
  { value: 'Infusion', label: 'Infusion' },
  { value: 'Temperature', label: 'Temperature' },
  { value: 'Decoction', label: 'Decoction' }
]

export default function MashStepsTab({ modalData, setModalData }) {
  const [editingStep, setEditingStep] = useState(null)
  const [availableMashSteps, setAvailableMashSteps] = useState([])
  const [loadingMashSteps, setLoadingMashSteps] = useState(true)
  const [newStep, setNewStep] = useState({
    stepName: '',
    temperature: '',
    duration: '',
    stepType: 'Temperature',
    description: ''
  })

  // Fetch available mash steps from API
  useEffect(() => {
    const fetchMashSteps = async () => {
      try {
        setLoadingMashSteps(true)
        const response = await api.get('/mashsteps')
        if (response.data.success && response.data.data) {
          setAvailableMashSteps(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch mash steps:', error)
      } finally {
        setLoadingMashSteps(false)
      }
    }

    fetchMashSteps()
  }, [])

  // Guard clause - return loading state if modalData is not available
  if (!modalData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading mash steps...</div>
      </div>
    )
  }

  // Ensure all existing steps have proper IDs and migrate old property names
  useEffect(() => {
    if (!modalData) return

    const steps = modalData.mashSteps || []
    let needsUpdate = false

    const updatedSteps = steps.map((step, index) => {
      let updated = { ...step }

      // Generate ID if missing
      if (!updated.id) {
        const newId = `fix-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
        console.log('🆔 Generated ID for step:', step.stepName, '→', newId)
        updated.id = newId
        needsUpdate = true
      }

      // Migrate old 'time' property to 'duration'
      if (updated.time !== undefined && updated.duration === undefined) {
        console.log('⚡ Migrating time → duration for step:', step.stepName)
        updated.duration = updated.time
        delete updated.time
        needsUpdate = true
      }

      // Migrate old 'order' property to 'stepNumber'
      if (updated.order !== undefined && updated.stepNumber === undefined) {
        console.log('⚡ Migrating order → stepNumber for step:', step.stepName)
        updated.stepNumber = updated.order
        delete updated.order
        needsUpdate = true
      }

      return updated
    })

    if (needsUpdate) {
      console.log('🔧 Updating mash steps with migrations')
      setModalData(prev => ({
        ...prev,
        mashSteps: updatedSteps
      }))
    }
  }, [modalData, setModalData])

  const addStep = () => {
    if (!newStep.stepName || !newStep.temperature || !newStep.duration) return

    // Generate a more robust unique ID
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const step = {
      id: uniqueId,
      ...newStep,
      temperature: parseFloat(newStep.temperature),
      duration: parseFloat(newStep.duration),
      stepNumber: (modalData.mashSteps || []).length
    }

    console.log('➕ Adding step:', step)

    setModalData(prev => ({
      ...prev,
      mashSteps: [...(prev.mashSteps || []), step]
    }))

    setNewStep({
      stepName: '',
      temperature: '',
      duration: '',
      stepType: 'Temperature',
      description: ''
    })
  }

  const removeStep = (stepId) => {
    console.log('🗑️ Removing step with ID:', stepId, 'Type:', typeof stepId)
    console.log('📋 Current steps before removal:', (modalData.mashSteps || []).map(s => ({ id: s.id, stepName: s.stepName, type: typeof s.id })))

    const filteredSteps = (modalData.mashSteps || []).filter(step => {
      const keep = step.id !== stepId
      console.log(`Step ${step.id} (${step.stepName}): ${keep ? 'KEEP' : 'REMOVE'}`)
      return keep
    })

    console.log('✅ Steps after filtering:', filteredSteps.map(s => ({ id: s.id, stepName: s.stepName })))

    setModalData(prev => ({
      ...prev,
      mashSteps: filteredSteps.map((step, index) => ({ ...step, stepNumber: index }))
    }))
  }

  const moveStep = (stepId, direction) => {
    const steps = [...(modalData.mashSteps || [])]
    const currentIndex = steps.findIndex(step => step.id === stepId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= steps.length) return

    const [movedStep] = steps.splice(currentIndex, 1)
    steps.splice(newIndex, 0, movedStep)

    const reorderedSteps = steps.map((step, index) => ({ ...step, stepNumber: index }))

    setModalData(prev => ({
      ...prev,
      mashSteps: reorderedSteps
    }))
  }

  const startEdit = (step) => {
    setEditingStep({ ...step })
  }

  const saveEdit = () => {
    if (!editingStep.stepName || !editingStep.temperature || !editingStep.duration) return

    setModalData(prev => ({
      ...prev,
      mashSteps: (prev.mashSteps || []).map(step =>
        step.id === editingStep.id
          ? {
              ...editingStep,
              temperature: parseFloat(editingStep.temperature),
              duration: parseFloat(editingStep.duration)
            }
          : step
      )
    }))
    setEditingStep(null)
  }

  const cancelEdit = () => {
    setEditingStep(null)
  }

  const addMashStepFromTemplate = (mashStep) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const step = {
      id: uniqueId,
      stepName: mashStep.name,
      temperature: mashStep.temperature,
      duration: mashStep.duration,
      stepType: mashStep.stepType,
      description: mashStep.description || '',
      stepNumber: (modalData.mashSteps || []).length
    }

    console.log('📋 Adding mash step from template:', step)

    setModalData(prev => ({
      ...prev,
      mashSteps: [...(prev.mashSteps || []), step]
    }))
  }

  const clearSteps = () => {
    setModalData(prev => ({
      ...prev,
      mashSteps: []
    }))
  }

  // Calculate total mash time
  const totalTime = (modalData.mashSteps || []).reduce((total, step) => total + (step.duration || 0), 0)

  // Sort steps by stepNumber
  const sortedSteps = [...(modalData.mashSteps || [])].sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0))

  console.debug('🔍 All steps with IDs:', sortedSteps.map(s => ({ id: s.id, stepName: s.stepName, type: typeof s.id })));

  return (
    <div className="space-y-6">
      {/* Header with Mash Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mash Temperature Program</h3>
            <p className="text-sm text-gray-600">Define mash steps for optimal enzyme activity</p>
          </div>
          <div className="text-right">
            <div className="flex space-x-12">
              <div>
                <div className="text-2xl font-bold text-fermentum-800">{(modalData.mashSteps || []).length}</div>
                <div className="text-sm text-gray-600">Steps</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-fermentum-800">{totalTime} min</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mash Steps Table */}
      <div className="border border-gray-200 rounded-lg">
        <div className="flex bg-gray-200 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-semibold uppercase text-gray-900">Mash Steps ({(modalData.mashSteps || []).length})</h4>
          <button
            onClick={clearSteps}
            className="flex-1 text-sm text-right text-red-600 hover:text-red-900"
          >
            Clear All Steps
          </button>
        </div>
        {sortedSteps.length > 0 && (
          <div className="border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Step Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSteps.map((step, index) => (
                  <tr key={step.id} className="hover:bg-gray-50">
                    {editingStep && editingStep.id === step.id ? (
                      <>
                        <td className="px-4 py-2 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingStep.stepName}
                            onChange={(e) => setEditingStep(prev => ({ ...prev, stepName: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={editingStep.temperature}
                              onChange={(e) => setEditingStep(prev => ({ ...prev, temperature: e.target.value }))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                            />
                            <span className="ml-1 text-sm text-gray-500">°F</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={editingStep.duration}
                              onChange={(e) => setEditingStep(prev => ({ ...prev, duration: e.target.value }))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                            />
                            <span className="ml-1 text-sm text-gray-500">min</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <StandardDropdown
                            value={editingStep.stepType}
                            onChange={(e) => setEditingStep(prev => ({ ...prev, stepType: e.target.value }))}
                            options={STEP_TYPES}
                            className="w-full text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Save"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-red-600 hover:text-red-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Cancel"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900 w-4">{index + 1}</span>
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => moveStep(step.id, 'up')}
                                disabled={index === 0}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <ArrowUpIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => moveStep(step.id, 'down')}
                                disabled={index === sortedSteps.length - 1}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <ArrowDownIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{step.stepName}</div>
                            {step.description && (
                              <div className="text-xs text-gray-500">{step.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{step.temperature}°F</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{step.duration} min</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{step.stepType}</td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(step)}
                              className="text-blue-600 hover:text-blue-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => removeStep(step.id)}
                              className="text-red-600 hover:text-red-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Global Empty State */}
        {(modalData.mashSteps || []).length === 0 && (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-gray-400 text-sm">No mash steps added yet</div>
          </div>
        )}
      </div>

      {/* Add New Step */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        
        <h4 className="text-lg font-semibold uppercase text-gray-900 mb-4">
          Add Mash Step
        </h4>
        
        {/* Available Mash Steps from Database */}
        <div className="mb-4">

          <div className="flex items-center justify-between mb-2">
            <h4 className="block text-sm font-medium text-gray-700">Available Mash Steps</h4>
            {loadingMashSteps && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}
          </div>

          {!loadingMashSteps && availableMashSteps.length > 0 ? (
            <div className="space-y-4">
              {/* Group mash steps by category */}
              {Object.entries(
                availableMashSteps.reduce((acc, mashStep) => {
                  const category = mashStep.category || 'Other'
                  if (!acc[category]) acc[category] = []
                  acc[category].push(mashStep)
                  return acc
                }, {})
              ).map(([category, steps]) => (
                <div key={category}>
                  <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase">{category}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {steps.map((mashStep) => (
                      <button
                        key={mashStep.mashStepId}
                        onClick={() => addMashStepFromTemplate(mashStep)}
                        className="flex flex-col items-start justify-start text-left p-2 border bg-gray-200 border-gray-300 rounded hover:bg-white hover:border-fermentum-500 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{mashStep.name}</div>
                        <div className="text-xs text-gray-600 mb-1">{mashStep.description}</div>
                        <div className="text-xs text-gray-500">
                          {mashStep.temperature}°{mashStep.temperatureUnit} • {mashStep.duration} min • {mashStep.stepType}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : !loadingMashSteps ? (
            <div className="text-sm text-gray-500 py-4 text-center">
              No mash steps available
            </div>
          ) : null}

        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Name</label>
            <input
              type="text"
              value={newStep.stepName}
              onChange={(e) => setNewStep(prev => ({ ...prev, stepName: e.target.value }))}
              placeholder="e.g., Saccharification"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <div className="flex items-stretch">
              <input
                type="number"
                value={newStep.temperature}
                onChange={(e) => setNewStep(prev => ({ ...prev, temperature: e.target.value }))}
                placeholder="152"
                className="w-[200px] flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
              <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                °F
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <div className="flex items-stretch">
              <input
                type="number"
                value={newStep.duration}
                onChange={(e) => setNewStep(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="60"
                className="w-[200px] flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
              <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                min
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <StandardDropdown
              value={newStep.stepType}
              onChange={(e) => setNewStep(prev => ({ ...prev, stepType: e.target.value }))}
              options={STEP_TYPES}
              className="w-full h-[42px]"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={newStep.description}
              onChange={(e) => setNewStep(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Convert starches to fermentable sugars"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={addStep}
            disabled={!newStep.stepName || !newStep.temperature || !newStep.duration}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Step
          </button>
        </div>
      </div>

      {/* Mash Notes */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2 border-b border-gray-300">Mash Temperature Guidelines</h4>
        <div className="text-xs text-gray-600 space-y-1 grid grid-cols-2">
          <div><strong>95-104°F:</strong> Acid Rest - Lowers pH, improves enzyme activity</div>
          <div><strong>104-122°F:</strong> Protein Rest - Breaks down proteins, improves clarity</div>
          <div><strong>142-150°F:</strong> Beta Amylase - Produces fermentable sugars, dry finish</div>
          <div><strong>150-162°F:</strong> Alpha Amylase - Produces dextrins, fuller body</div>
          <div><strong>162-172°F:</strong> Mash Out - Stops enzyme activity, improves lautering</div>
        </div>
      </div>
    </div>
  )
}