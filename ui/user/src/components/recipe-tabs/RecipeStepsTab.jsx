import React, { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilSquareIcon, ArrowUpIcon, ArrowDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import StandardDropdown from '../common/StandardDropdown'

// Recipe phases
const PHASES = [
  { value: 'Mash', label: 'Mash' },
  { value: 'Boil', label: 'Boil' },
  { value: 'Fermentation', label: 'Fermentation' },
  { value: 'Conditioning', label: 'Conditioning' },
  { value: 'Packaging', label: 'Packaging' }
]

// Step types
const STEP_TYPES = [
  { value: 'Temperature', label: 'Temperature' },
  { value: 'Infusion', label: 'Infusion' },
  { value: 'Decoction', label: 'Decoction' },
  { value: 'Addition', label: 'Addition' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Hold', label: 'Hold' },
  { value: 'Heat', label: 'Heat' },
  { value: 'Cool', label: 'Cool' }
]

export default function RecipeStepsTab({ modalData, setModalData }) {
  const [editingStep, setEditingStep] = useState(null)
  const [selectedPhase, setSelectedPhase] = useState('Mash') // Filter by phase
  const [newStep, setNewStep] = useState({
    stepName: '',
    phase: 'Mash',
    stepType: 'Temperature',
    temperature: '',
    temperatureUnit: '°F',
    durationDays: '',
    durationHours: '',
    durationMinutes: '',
    amount: '',
    amountUnit: 'oz',
    description: '',
    instructions: '',
    isOptional: false,
    alertBefore: ''
  })

  // Guard clause - return loading state if modalData is not available
  if (!modalData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading recipe steps...</div>
      </div>
    )
  }

  // Ensure all existing steps have proper IDs
  useEffect(() => {
    if (!modalData) return

    const steps = modalData.steps || []
    let needsUpdate = false

    const updatedSteps = steps.map((step, index) => {
      let updated = { ...step }

      // Generate ID if missing (for new steps added locally)
      if (!updated.recipeStepId && !updated.id) {
        const newId = `temp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
        updated.id = newId
        needsUpdate = true
      }

      return updated
    })

    if (needsUpdate) {
      setModalData(prev => ({
        ...prev,
        steps: updatedSteps
      }))
    }
  }, [modalData, setModalData])

  const addStep = () => {
    if (!newStep.stepName || !newStep.phase) return

    // Generate a temporary unique ID
    const uniqueId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Calculate total duration in minutes from days, hours, and minutes
    const days = newStep.durationDays ? parseInt(newStep.durationDays) : 0
    const hours = newStep.durationHours ? parseInt(newStep.durationHours) : 0
    const minutes = newStep.durationMinutes ? parseInt(newStep.durationMinutes) : 0
    const totalDuration = (days * 1440) + (hours * 60) + minutes

    const step = {
      id: uniqueId, // Temporary ID for UI management
      stepName: newStep.stepName.trim(),
      phase: newStep.phase,
      stepType: newStep.stepType || 'Temperature',
      temperature: newStep.temperature ? parseFloat(newStep.temperature) : null,
      temperatureUnit: newStep.temperatureUnit || '°F',
      duration: totalDuration > 0 ? totalDuration : null,
      amount: newStep.amount ? parseFloat(newStep.amount) : null,
      amountUnit: newStep.amountUnit || null,
      description: newStep.description.trim() || null,
      instructions: newStep.instructions.trim() || null,
      isOptional: newStep.isOptional || false,
      alertBefore: newStep.alertBefore ? parseInt(newStep.alertBefore) : null,
      stepNumber: (modalData.steps || []).length + 1
    }

    setModalData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), step]
    }))

    // Reset form
    setNewStep({
      stepName: '',
      phase: selectedPhase, // Keep selected phase
      stepType: 'Temperature',
      temperature: '',
      temperatureUnit: '°F',
      durationDays: '',
      durationHours: '',
      durationMinutes: '',
      amount: '',
      amountUnit: 'oz',
      description: '',
      instructions: '',
      isOptional: false,
      alertBefore: ''
    })
  }

  const removeStep = (stepId) => {
    const filteredSteps = (modalData.steps || []).filter(step => {
      // Handle both recipeStepId (from API) and id (temporary)
      const id = step.recipeStepId || step.id
      return id !== stepId
    })

    // Renumber steps
    const renumberedSteps = filteredSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))

    setModalData(prev => ({
      ...prev,
      steps: renumberedSteps
    }))
  }

  const moveStep = (stepId, direction) => {
    const steps = [...(modalData.steps || [])]
    const currentIndex = steps.findIndex(step => (step.recipeStepId || step.id) === stepId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= steps.length) return

    const [movedStep] = steps.splice(currentIndex, 1)
    steps.splice(newIndex, 0, movedStep)

    const reorderedSteps = steps.map((step, index) => ({ ...step, stepNumber: index + 1 }))

    setModalData(prev => ({
      ...prev,
      steps: reorderedSteps
    }))
  }

  const startEdit = (step) => {
    // Convert total minutes to days, hours, and minutes
    const totalMinutes = step.duration || 0
    const days = Math.floor(totalMinutes / 1440)
    const remainingAfterDays = totalMinutes % 1440
    const hours = Math.floor(remainingAfterDays / 60)
    const minutes = remainingAfterDays % 60

    setEditingStep({
      ...step,
      temperature: step.temperature?.toString() || '',
      durationDays: days > 0 ? days.toString() : '',
      durationHours: hours > 0 ? hours.toString() : '',
      durationMinutes: minutes > 0 ? minutes.toString() : '',
      amount: step.amount?.toString() || '',
      alertBefore: step.alertBefore?.toString() || ''
    })
  }

  const saveEdit = () => {
    if (!editingStep.stepName || !editingStep.phase) return

    // Calculate total duration in minutes from days, hours, and minutes
    const days = editingStep.durationDays ? parseInt(editingStep.durationDays) : 0
    const hours = editingStep.durationHours ? parseInt(editingStep.durationHours) : 0
    const minutes = editingStep.durationMinutes ? parseInt(editingStep.durationMinutes) : 0
    const totalDuration = (days * 1440) + (hours * 60) + minutes

    setModalData(prev => ({
      ...prev,
      steps: (prev.steps || []).map(step => {
        const id = step.recipeStepId || step.id
        const editId = editingStep.recipeStepId || editingStep.id

        return id === editId
          ? {
              ...editingStep,
              stepName: editingStep.stepName.trim(),
              temperature: editingStep.temperature ? parseFloat(editingStep.temperature) : null,
              duration: totalDuration > 0 ? totalDuration : null,
              amount: editingStep.amount ? parseFloat(editingStep.amount) : null,
              alertBefore: editingStep.alertBefore ? parseInt(editingStep.alertBefore) : null,
              description: editingStep.description?.trim() || null,
              instructions: editingStep.instructions?.trim() || null
            }
          : step
      })
    }))
    setEditingStep(null)
  }

  const cancelEdit = () => {
    setEditingStep(null)
  }

  const clearSteps = () => {
    if (window.confirm('Are you sure you want to clear all recipe steps?')) {
      setModalData(prev => ({
        ...prev,
        steps: []
      }))
    }
  }

  // Get steps for selected phase
  const allSteps = modalData.steps || []
  const phaseSteps = allSteps
    .filter(step => step.phase === selectedPhase)
    .sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0))

  // Calculate summary by phase
  const phaseSummary = PHASES.map(phase => {
    const steps = allSteps.filter(s => s.phase === phase.value)
    const totalTime = steps.reduce((sum, s) => sum + (s.duration || 0), 0)
    return {
      phase: phase.value,
      count: steps.length,
      totalTime
    }
  }).filter(p => p.count > 0)

  const totalSteps = allSteps.length
  const totalTime = allSteps.reduce((sum, s) => sum + (s.duration || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header with Recipe Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recipe Steps</h3>
            <p className="text-sm text-gray-600">Define all steps for your brewing process</p>
          </div>
          <div className="text-right">
            <div className="flex space-x-8">
              <div>
                <div className="text-2xl font-bold text-fermentum-800">{totalSteps}</div>
                <div className="text-sm text-gray-600">Total Steps</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-fermentum-800">
                  {totalTime >= 1440
                    ? `${Math.floor(totalTime / 1440)}d ${Math.floor((totalTime % 1440) / 60)}h`
                    : totalTime >= 60
                    ? `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`
                    : `${totalTime}m`
                  }
                </div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Summary */}
        {phaseSummary.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {phaseSummary.map(p => (
                <div key={p.phase} className="text-sm">
                  <div className="font-semibold text-gray-700">{p.phase}</div>
                  <div className="text-gray-600">{p.count} steps • {p.totalTime} min</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Phase Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {PHASES.map(phase => {
            const count = allSteps.filter(s => s.phase === phase.value).length
            return (
              <button
                key={phase.value}
                onClick={() => {
                  setSelectedPhase(phase.value)
                  setNewStep(prev => ({ ...prev, phase: phase.value }))
                }}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${selectedPhase === phase.value
                    ? 'border-fermentum-500 text-fermentum-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {phase.label}
                {count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    selectedPhase === phase.value ? 'bg-fermentum-100 text-fermentum-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Steps Table for Selected Phase */}
      <div className="border border-gray-200 rounded-lg">
        <div className="flex bg-gray-200 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-semibold uppercase text-gray-900">
            {selectedPhase} Steps ({phaseSteps.length})
          </h4>
          {phaseSteps.length > 0 && (
            <button
              onClick={clearSteps}
              className="flex-1 text-sm text-right text-red-600 hover:text-red-900"
            >
              Clear All Steps
            </button>
          )}
        </div>

        {phaseSteps.length > 0 && (
          <div className="border border-gray-200 overflow-x-auto">
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
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Equipment Required
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {phaseSteps.map((step, index) => {
                  const stepId = step.recipeStepId || step.id
                  const isEditing = editingStep && (editingStep.recipeStepId || editingStep.id) === stepId

                  return (
                    <tr key={stepId} className="hover:bg-gray-50">
                      {isEditing ? (
                        <>
                          <td className="px-4 py-2 text-sm text-gray-900">{step.stepNumber}</td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editingStep.stepName}
                              onChange={(e) => setEditingStep(prev => ({ ...prev, stepName: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <StandardDropdown
                              value={editingStep.stepType}
                              onChange={(e) => setEditingStep(prev => ({ ...prev, stepType: e.target.value }))}
                              options={STEP_TYPES}
                              className="w-full text-sm"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {step.equipmentTypeName ? (
                              <div>
                                <div className="font-medium">{step.equipmentTypeName}</div>
                                {step.equipmentCapacityMin && (
                                  <div className="text-xs text-gray-500">
                                    Min: {step.equipmentCapacityMin} {step.equipmentCapacityUnit}
                                  </div>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={editingStep.temperature}
                                onChange={(e) => setEditingStep(prev => ({ ...prev, temperature: e.target.value }))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                                placeholder="0"
                              />
                              <span className="ml-1 text-sm text-gray-500">°F</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editingStep.durationDays}
                                onChange={(e) => setEditingStep(prev => ({ ...prev, durationDays: e.target.value }))}
                                className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                                placeholder="0"
                                min="0"
                              />
                              <span className="text-xs text-gray-500">d</span>
                              <input
                                type="number"
                                value={editingStep.durationHours}
                                onChange={(e) => setEditingStep(prev => ({ ...prev, durationHours: e.target.value }))}
                                className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                                placeholder="0"
                                min="0"
                                max="23"
                              />
                              <span className="text-xs text-gray-500">h</span>
                              <input
                                type="number"
                                value={editingStep.durationMinutes}
                                onChange={(e) => setEditingStep(prev => ({ ...prev, durationMinutes: e.target.value }))}
                                className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                                placeholder="0"
                                min="0"
                                max="59"
                              />
                              <span className="text-xs text-gray-500">m</span>
                            </div>
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
                              <span className="text-sm text-gray-900 w-4">{step.stepNumber}</span>
                              <div className="flex flex-col space-y-1">
                                <button
                                  onClick={() => moveStep(stepId, 'up')}
                                  disabled={index === 0}
                                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  <ArrowUpIcon className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => moveStep(stepId, 'down')}
                                  disabled={index === phaseSteps.length - 1}
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
                              {step.instructions && (
                                <div className="text-xs text-blue-600 italic mt-1">{step.instructions}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{step.stepType || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {step.equipmentTypeName ? (
                              <div>
                                <div className="font-medium">{step.equipmentTypeName}</div>
                                {step.equipmentCapacityMin && (
                                  <div className="text-xs text-gray-500">
                                    Min: {step.equipmentCapacityMin} {step.equipmentCapacityUnit}
                                  </div>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {step.temperature ? `${step.temperature}${step.temperatureUnit || '°F'}` : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {step.duration ? (() => {
                              const days = Math.floor(step.duration / 1440)
                              const remainingAfterDays = step.duration % 1440
                              const hours = Math.floor(remainingAfterDays / 60)
                              const minutes = remainingAfterDays % 60

                              if (days > 0) {
                                return `${days}d ${hours}h ${minutes}m`
                              } else if (hours > 0) {
                                return `${hours}h ${minutes}m`
                              } else {
                                return `${minutes}m`
                              }
                            })() : '-'}
                          </td>
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
                                onClick={() => removeStep(stepId)}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {phaseSteps.length === 0 && (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-gray-400 text-sm">No {selectedPhase.toLowerCase()} steps added yet</div>
          </div>
        )}
      </div>

      {/* Add New Step Form */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h4 className="text-lg font-semibold uppercase text-gray-900 mb-4">
          Add {selectedPhase} Step
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Name *</label>
            <input
              type="text"
              value={newStep.stepName}
              onChange={(e) => setNewStep(prev => ({ ...prev, stepName: e.target.value }))}
              placeholder={`e.g., ${selectedPhase === 'Mash' ? 'Saccharification Rest' : selectedPhase === 'Boil' ? 'Bittering Hops Addition' : 'Primary Fermentation'}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          {/* Step Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <StandardDropdown
              value={newStep.stepType}
              onChange={(e) => setNewStep(prev => ({ ...prev, stepType: e.target.value }))}
              options={STEP_TYPES}
              className="w-full h-[42px]"
            />
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <div className="flex items-stretch">
              <input
                type="number"
                value={newStep.temperature}
                onChange={(e) => setNewStep(prev => ({ ...prev, temperature: e.target.value }))}
                placeholder="152"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
              <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                °F
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <div className="flex items-stretch gap-2">
              <div className="flex items-stretch flex-1">
                <input
                  type="number"
                  value={newStep.durationDays}
                  onChange={(e) => setNewStep(prev => ({ ...prev, durationDays: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                />
                <div className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                  d
                </div>
              </div>
              <div className="flex items-stretch flex-1">
                <input
                  type="number"
                  value={newStep.durationHours}
                  onChange={(e) => setNewStep(prev => ({ ...prev, durationHours: e.target.value }))}
                  placeholder="0"
                  min="0"
                  max="23"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                />
                <div className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                  h
                </div>
              </div>
              <div className="flex items-stretch flex-1">
                <input
                  type="number"
                  value={newStep.durationMinutes}
                  onChange={(e) => setNewStep(prev => ({ ...prev, durationMinutes: e.target.value }))}
                  placeholder="0"
                  min="0"
                  max="59"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                />
                <div className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                  m
                </div>
              </div>
            </div>
          </div>

          {/* Alert Before */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Before (optional)</label>
            <div className="flex items-stretch">
              <input
                type="number"
                value={newStep.alertBefore}
                onChange={(e) => setNewStep(prev => ({ ...prev, alertBefore: e.target.value }))}
                placeholder="15"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
              <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                min
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={newStep.description}
              onChange={(e) => setNewStep(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this step"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          {/* Instructions */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (Optional)</label>
            <textarea
              value={newStep.instructions}
              onChange={(e) => setNewStep(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Detailed instructions for the brewer"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={addStep}
            disabled={!newStep.stepName || !newStep.phase}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Step
          </button>
        </div>
      </div>

      {/* Brewing Guidelines for Selected Phase */}
      {selectedPhase === 'Mash' && (
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
      )}

      {selectedPhase === 'Fermentation' && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2 border-b border-gray-300">Fermentation Guidelines</h4>
          <div className="text-xs text-gray-600 space-y-1 grid grid-cols-2">
            <div><strong>Ales:</strong> 65-72°F - Typically 7-14 days primary fermentation</div>
            <div><strong>Lagers:</strong> 48-58°F - Typically 14-21 days primary fermentation</div>
            <div><strong>High-gravity:</strong> May require longer fermentation times</div>
            <div><strong>Diacetyl rest:</strong> Raise temperature 5-10°F for final 2-3 days</div>
          </div>
        </div>
      )}
    </div>
  )
}
