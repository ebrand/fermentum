// Fixed property mapping issues for recipe ingredients - update
import React, { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilSquareIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import StandardDropdown from '../../common/StandardDropdown'
import { getIngredientData } from '../../../utils/api'

export default function GrainsTab({ modalData, setModalData }) {
  // 🔍 DEBUG: Output complete recipe JSON structure
  console.log('🍺 [RECIPE_DEBUG] Complete modalData (Recipe JSON):', JSON.stringify(modalData, null, 2))
  console.log('🍺 [RECIPE_DEBUG] modalData keys:', Object.keys(modalData || {}))
  console.log('🍺 [RECIPE_DEBUG] modalData.grains:', modalData.grains)

  const [grains, setGrains] = useState(modalData.grains || [])
  const [availableGrains, setAvailableGrains] = useState([])
  const [loading, setLoading] = useState(false)
  const [newGrain, setNewGrain] = useState({
    grainId: null,
    name: '',
    type: 'Base Malt',
    amount: '',
    unit: 'lbs',
    potential: 1.036,
    lovibond: 2.0,
    percentage: 0
  })
  const [editingGrain, setEditingGrain] = useState(null)

  // Load available grains from API
  useEffect(() => {
    console.log('🌾 [GRAINS_DEBUG] GrainsTab useEffect triggered - loading grains...')
    loadAvailableGrains()
  }, [])

  // Update parent state when grains change
  useEffect(() => {
    setModalData(prev => ({
      ...prev,
      grains: grains
    }))
  }, [grains, setModalData])

  const loadAvailableGrains = async () => {
    try {
      console.log('🌾 [GRAINS_DEBUG] Starting loadAvailableGrains...')
      console.log('🌾 [GRAINS_DEBUG] Checking auth tokens...')
      console.log('🌾 [GRAINS_DEBUG] accessToken exists:', !!localStorage.getItem('accessToken'))
      console.log('🌾 [GRAINS_DEBUG] currentTenantId:', localStorage.getItem('currentTenantId'))
      setLoading(true)

      console.log('🌾 [GRAINS_DEBUG] Calling getIngredientData with "grains"')
      const data = await getIngredientData('grains')

      console.log('🌾 [GRAINS_DEBUG] Raw API response:', data)
      console.log('🌾 [GRAINS_DEBUG] Type of data:', typeof data)
      console.log('🌾 [GRAINS_DEBUG] Is array:', Array.isArray(data))
      console.log('🌾 [GRAINS_DEBUG] Data length:', data?.length)
      console.log('🌾 [GRAINS_DEBUG] Data keys:', Object.keys(data || {}))

      // Handle API response structure: {success: true, data: [...], message: "..."}
      const grainsArray = data?.data || data
      console.log('🌾 [GRAINS_DEBUG] Extracted grains array:', grainsArray)
      console.log('🌾 [GRAINS_DEBUG] Is grains array:', Array.isArray(grainsArray))

      if (Array.isArray(grainsArray)) {
        console.log('🌾 [GRAINS_DEBUG] Setting availableGrains to array with', grainsArray.length, 'items')
        console.log('🌾 [GRAINS_DEBUG] First few items:', grainsArray.slice(0, 3))
        console.log('🌾 [GRAINS_DEBUG] First grain structure:', grainsArray[0])
        console.log('🌾 [GRAINS_DEBUG] First grain keys:', Object.keys(grainsArray[0] || {}))
        console.log('🌾 [GRAINS_DEBUG] First grain Name property:', grainsArray[0]?.Name)
        console.log('🌾 [GRAINS_DEBUG] First grain name property:', grainsArray[0]?.name)
        console.log('🌾 [GRAINS_DEBUG] First grain Type property:', grainsArray[0]?.Type)
        console.log('🌾 [GRAINS_DEBUG] First grain type property:', grainsArray[0]?.type)
        setAvailableGrains(grainsArray)
      } else {
        console.log('🌾 [GRAINS_DEBUG] Grains data is not array, setting to empty array')
        setAvailableGrains([])
      }
    } catch (error) {
      console.error('🌾 [GRAINS_DEBUG] Error loading grains:', error)
      console.error('🌾 [GRAINS_DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      })
      setAvailableGrains([])
    } finally {
      console.log('🌾 [GRAINS_DEBUG] Finally block - setting loading to false')
      setLoading(false)
    }
  }

  const selectCommonGrain = (grainData) => {
    setNewGrain(prev => ({
      ...prev,
      grainId: grainData.grainId || grainData.GrainId, // Add the actual grain ID from database
      name: grainData.name || grainData.Name,
      type: grainData.type || grainData.Type,
      potential: grainData.potential || grainData.Potential || 1.036,
      lovibond: grainData.color || grainData.Color || grainData.lovibond || 2.0
    }))
  }

  // Calculate percentages and totals
  const calculateGrainBill = (grainList) => {
    const totalWeight = grainList.reduce((sum, grain) => sum + parseFloat(grain.amount || 0), 0)

    return grainList.map(grain => ({
      ...grain,
      percentage: totalWeight > 0 ? ((parseFloat(grain.amount || 0) / totalWeight) * 100) : 0
    }))
  }

  // Calculate estimated OG based on grain bill
  const calculateEstimatedOG = (grainList, batchSize, efficiency) => {
    const totalPotentialPoints = grainList.reduce((sum, grain) => {
      const points = (parseFloat(grain.potential || 1.000) - 1) * 1000
      const contribution = points * parseFloat(grain.amount || 0) * (efficiency / 100)
      return sum + contribution
    }, 0)

    const ogPoints = totalPotentialPoints / parseFloat(batchSize || 1)
    return 1 + (ogPoints / 1000)
  }

  // Calculate estimated SRM (color)
  const calculateEstimatedSRM = (grainList, batchSize) => {
    const totalMCU = grainList.reduce((sum, grain) => {
      const mcu = (parseFloat(grain.lovibond || 0) * parseFloat(grain.amount || 0)) / parseFloat(batchSize || 1)
      return sum + mcu
    }, 0)

    // Morey equation for SRM
    return 1.4922 * Math.pow(totalMCU, 0.6859)
  }

  // Update calculations when grains change
  useEffect(() => {
    const updatedGrains = calculateGrainBill(grains)
    if (JSON.stringify(updatedGrains) !== JSON.stringify(grains)) {
      setGrains(updatedGrains)
    }

    // Update estimated values in parent
    const batchSize = parseFloat(modalData.batchSize || 5)
    const efficiency = parseFloat(modalData.efficiency || 75)

    const estimatedOG = calculateEstimatedOG(grains, batchSize, efficiency)
    const estimatedSRM = calculateEstimatedSRM(grains, batchSize)

    setModalData(prev => ({
      ...prev,
      estimatedOG: estimatedOG.toFixed(3),
      estimatedSRM: estimatedSRM.toFixed(1)
    }))
  }, [grains, modalData.batchSize, modalData.efficiency])


  const handleEditGrain = (grain) => {
    setEditingGrain({ ...grain })
  }

  const handleUpdateGrain = () => {
    setGrains(prev => prev.map(grain =>
      grain.id === editingGrain.id ? { ...editingGrain, amount: parseFloat(editingGrain.amount) } : grain
    ))
    setEditingGrain(null)
  }

  const handleDeleteGrain = (grainId) => {
    setGrains(prev => prev.filter(grain => grain.id !== grainId))
  }

  const addGrain = async () => {
    if (!newGrain.name.trim() || !newGrain.amount) {
      return
    }

    let grainToAdd = {
      ...newGrain,
      id: Date.now(), // Keep id for React key purposes
      amount: parseFloat(newGrain.amount)
    }

    // If no grainId is set (manual entry), try to find matching grain or create one
    if (!newGrain.grainId) {
      console.log('🌾 [GRAINS_DEBUG] Manual grain entry detected, searching for existing grain...')

      // Try to find existing grain by name match
      const existingGrain = availableGrains.find(grain =>
        (grain.name || grain.Name)?.toLowerCase() === newGrain.name.toLowerCase()
      )

      if (existingGrain) {
        console.log('🌾 [GRAINS_DEBUG] Found existing grain:', existingGrain)
        grainToAdd.grainId = existingGrain.grainId || existingGrain.GrainId
      } else {
        console.log('🌾 [GRAINS_DEBUG] No existing grain found, will need to create new grain record')
        // For now, we'll use a placeholder grainId and let the backend handle creation
        // TODO: Implement proper grain creation workflow
        grainToAdd.grainId = null // This will cause a validation error on the backend
        grainToAdd.needsCreation = true // Flag for potential future handling
      }
    }

    console.log('🌾 [GRAINS_DEBUG] Adding grain to recipe:', grainToAdd)

    setGrains(prev => [...prev, grainToAdd])
    setNewGrain({
      name: '',
      type: 'Base Malt',
      amount: '',
      unit: 'lbs',
      potential: 1.036,
      lovibond: 2.0,
      percentage: 0,
      grainId: null // Reset grainId
    })
  }

  const totalWeight = grains.reduce((sum, grain) => sum + parseFloat(grain.amount || 0), 0)

  return (
    <div className="space-y-6">
      
      {/* Header with IBU Summary */}
      <div className="bg-blue-50 rounded-lg p-4 h-[85px]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Grain Bill</h3>
            <p className="text-sm text-gray-600">The heart of your recipe</p>
          </div>
          <div className="text-right">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-sm">
              
              <div>
                <div className="text-2xl text-fermentum-800 font-semibold">{totalWeight.toFixed(2)} lbs</div>
                <span className="text-gray-600">Total Weight</span>
              </div>
              
              <div>
                <div className="text-2xl text-fermentum-800 font-semibold">{modalData.estimatedOG || '1.000'}</div>
                <span className="text-gray-600">Estimated OG</span>
              </div>
            
              <div>
                <div className="text-2xl text-fermentum-800 font-semibold">{modalData.estimatedSRM || '0.0'}</div>
                <span className="text-gray-600">Estimated SRM</span>
              </div>
              
              <div>
                <div className="text-2xl text-fermentum-800 font-semibold">{modalData.efficiency || 75}%</div>
                <span className="text-gray-600">Efficiency</span>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Added Grains Table */}
      <div className="border border-gray-200 rounded-lg">
        <div className="bg-gray-200 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-semibold uppercase text-gray-900">Added Grains ({grains.length})</h4>
        </div>
        {grains.length > 0 && (
          <div className={`h-[200px] ${editingGrain ? 'overflow-visible' : 'overflow-y-scroll'}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Grain
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    %
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Potential
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    °L
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grains.map((grain) => (
                  <tr key={grain.id} className="hover:bg-gray-50">
                    {editingGrain && editingGrain.id === grain.id ? (
                      // Edit row
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingGrain.name}
                            onChange={(e) => setEditingGrain(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <StandardDropdown
                            value={editingGrain.type}
                            onChange={(e) => setEditingGrain(prev => ({ ...prev, type: e.target.value }))}
                            options={[
                              { value: 'Base Malt', label: 'Base Malt' },
                              { value: 'Crystal/Caramel', label: 'Crystal/Caramel' },
                              { value: 'Roasted', label: 'Roasted' },
                              { value: 'Specialty', label: 'Specialty' }
                            ]}
                            className="w-full text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={editingGrain.amount}
                              onChange={(e) => setEditingGrain(prev => ({ ...prev, amount: e.target.value }))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                            />
                            <span className="text-xs text-gray-500">{editingGrain.unit}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm text-gray-500">{(grain.percentage || 0).toFixed(1)}%</span>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.001"
                            min="1.000"
                            max="1.100"
                            value={editingGrain.potential}
                            onChange={(e) => setEditingGrain(prev => ({ ...prev, potential: parseFloat(e.target.value) }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={editingGrain.lovibond}
                            onChange={(e) => setEditingGrain(prev => ({ ...prev, lovibond: parseFloat(e.target.value) }))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-3">
                            <button
                              onClick={handleUpdateGrain}
                              className="text-green-600 hover:text-green-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Save"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingGrain(null)}
                              className="text-red-600 hover:text-red-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Cancel"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Display row
                      <>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{grain.materialName || grain.name || 'Unknown Grain'}</div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {grain.type || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm text-gray-900">{grain.amount} {grain.unit}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm font-medium text-gray-900">{(grain.percentage || 0).toFixed(1)}%</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm text-gray-500">{grain.extractPotential ? grain.extractPotential.toFixed(3) : grain.potential ? grain.potential.toFixed(3) : '—'}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm text-gray-500">{grain.lovibond || '—'}</span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEditGrain(grain)}
                              className="text-blue-600 hover:text-blue-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGrain(grain.id)}
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

        {/* Empty State */}
        {grains.length === 0 && (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-gray-400 text-sm">No grains added yet</div>
          </div>
        )}
      </div>


      {/* Add New Grain */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h4 className="text-lg font-semibold uppercase text-gray-900 mb-4">Add Grain</h4>

        {/* Common Grains Quick Select */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Common Grains ({availableGrains.length} available)</label>

          
          {loading ? (
            <div className="text-sm text-gray-500">Loading grains...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {console.log('🌾 [GRAINS_DEBUG] Rendering grains, availableGrains:', availableGrains)}
              {availableGrains.map((grain) => (
                <button
                  key={grain.grainId || grain.GrainId || grain.name || grain.Name}
                  onClick={() => selectCommonGrain(grain)}
                  className="flex flex-col items-start justify-start text-left p-2 border bg-gray-200 border-gray-300 rounded hover:bg-white hover:border-fermentum-500 transition-colors"
                >
                  <div className="text-sm font-medium">{grain.name || grain.Name}</div>
                  <div className="text-xs text-gray-500">
                    {(grain.origin || grain.Origin) ? (grain.origin || grain.Origin) : ('unknown')} • {grain.color || grain.Color}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Add New Grain Form */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grain Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGrain.name}
                  onChange={(e) => setNewGrain(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pilsner Malt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <StandardDropdown
                  value={newGrain.type}
                  onChange={(e) => setNewGrain(prev => ({ ...prev, type: e.target.value }))}
                  options={[
                    { value: 'Base Malt', label: 'Base Malt' },
                    { value: 'Crystal/Caramel', label: 'Crystal/Caramel' },
                    { value: 'Roasted', label: 'Roasted' },
                    { value: 'Specialty', label: 'Specialty' }
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch">
                <input
                  type="number"
                  step="0.1"
                  value={newGrain.amount}
                  onChange={(e) => setNewGrain(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.0"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                />
                <StandardDropdown
                  value={newGrain.unit}
                  onChange={(e) => setNewGrain(prev => ({ ...prev, unit: e.target.value }))}
                  options={[
                    { value: 'lbs', label: 'lbs' },
                    { value: 'kgs', label: 'kgs' }
                  ]}
                  className="w-20 rounded-r-lg rounded-l-none border-l-0 h-[42px]"
                />
              </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Potential (SG)</label>
                <input
                  type="number"
                  step="0.001"
                  min="1.000"
                  max="1.100"
                  value={newGrain.potential}
                  onChange={(e) => setNewGrain(prev => ({ ...prev, potential: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lovibond (°L)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newGrain.lovibond}
                  onChange={(e) => setNewGrain(prev => ({ ...prev, lovibond: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={addGrain}
                disabled={!newGrain.name.trim() || !newGrain.amount}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Grain
              </button>
            </div>
          </div>

        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={addGrain}
            disabled={!newGrain.name || !newGrain.amount}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Grain
          </button>
        </div>
      </div>
    </div>
  )
}