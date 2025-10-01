import React, { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilSquareIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import StandardDropdown from '../../common/StandardDropdown'
import { getIngredientData } from '../../../utils/api'

// Yeast types
const YEAST_TYPES = [
  { value: 'Ale', label: 'Ale' },
  { value: 'Lager', label: 'Lager' },
  { value: 'Wheat', label: 'Wheat' },
  { value: 'Belgian', label: 'Belgian' },
  { value: 'Wild', label: 'Wild/Brett' },
  { value: 'Distilling', label: 'Distilling' },
  { value: 'Wine', label: 'Wine' }
]

// Yeast forms
const YEAST_FORMS = [
  { value: 'Liquid', label: 'Liquid' },
  { value: 'Dry', label: 'Dry' },
  { value: 'Slant', label: 'Slant' },
  { value: 'Culture', label: 'Culture' }
]

// Calculate ABV based on original gravity, final gravity, or attenuation
const calculateABV = (og, fg) => {
  if (!og || !fg) return 0
  return ((og - fg) * 131.25).toFixed(1)
}

const calculateFG = (og, attenuation) => {
  if (!og || !attenuation) return 0
  return (og - ((og - 1) * (attenuation / 100))).toFixed(3)
}

export default function YeastTab({ modalData, setModalData }) {
  const [editingYeast, setEditingYeast] = useState(null)
  const [availableYeasts, setAvailableYeasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newYeast, setNewYeast] = useState({
    yeastId: null, // Add yeast ID for database reference
    name: '',
    type: 'Ale',
    form: 'Liquid',
    amount: '',
    unit: 'pkg',
    attenuation: '',
    temperature: '',
    description: '',
    manufacturer: '',
    productId: ''
  })

  // Load available yeasts from API
  useEffect(() => {
    const loadYeasts = async () => {
      try {
        setLoading(true)
        const data = await getIngredientData('yeasts')
        if (data.success) {
          setAvailableYeasts(data.data || [])
        }
      } catch (error) {
        console.error('Error loading yeasts:', error)
      } finally {
        setLoading(false)
      }
    }
    loadYeasts()
  }, [])

  // Calculate ABV and FG when yeast attenuation changes
  useEffect(() => {
    const primaryYeast = (modalData.yeasts || [])[0]
    if (primaryYeast && modalData.estimatedOG) {
      const fg = calculateFG(modalData.estimatedOG, primaryYeast.attenuation)
      const abv = calculateABV(modalData.estimatedOG, parseFloat(fg))

      setModalData(prev => ({
        ...prev,
        estimatedFG: parseFloat(fg),
        estimatedABV: parseFloat(abv)
      }))
    }
  }, [modalData.yeasts, modalData.estimatedOG, setModalData])

  const addYeast = () => {
    if (!newYeast.name || !newYeast.amount || !newYeast.attenuation) return

    const yeast = {
      id: Date.now(),
      ...newYeast,
      amount: parseFloat(newYeast.amount),
      attenuation: parseFloat(newYeast.attenuation)
    }

    setModalData(prev => ({
      ...prev,
      yeasts: [...(prev.yeasts || []), yeast]
    }))

    setNewYeast({
      yeastId: null, // Reset yeast ID
      name: '',
      type: 'Ale',
      form: 'Liquid',
      amount: '',
      unit: 'pkg',
      attenuation: '',
      temperature: '',
      description: '',
      manufacturer: '',
      productId: ''
    })
  }

  const removeYeast = (yeastId) => {
    setModalData(prev => ({
      ...prev,
      yeasts: (prev.yeasts || []).filter(yeast => yeast.id !== yeastId)
    }))
  }

  const startEdit = (yeast) => {
    setEditingYeast({ ...yeast })
  }

  const saveEdit = () => {
    if (!editingYeast.name || !editingYeast.amount || !editingYeast.attenuation) return

    setModalData(prev => ({
      ...prev,
      yeasts: (prev.yeasts || []).map(yeast =>
        yeast.id === editingYeast.id
          ? {
              ...editingYeast,
              amount: parseFloat(editingYeast.amount),
              attenuation: parseFloat(editingYeast.attenuation)
            }
          : yeast
      )
    }))
    setEditingYeast(null)
  }

  const cancelEdit = () => {
    setEditingYeast(null)
  }

  const selectCommonYeast = (yeastData) => {
    const attenuationMin = yeastData.attenuationMin || yeastData.AttenuationMin
    const attenuationMax = yeastData.attenuationMax || yeastData.AttenuationMax
    const avgAttenuation = attenuationMin && attenuationMax
      ? ((attenuationMin + attenuationMax) / 2).toFixed(0)
      : attenuationMin || attenuationMax || ''

    const temperatureMin = yeastData.temperatureMin || yeastData.TemperatureMin
    const temperatureMax = yeastData.temperatureMax || yeastData.TemperatureMax
    const temperatureRange = temperatureMin && temperatureMax
      ? `${temperatureMin}-${temperatureMax}°F`
      : ''

    setNewYeast(prev => ({
      ...prev,
      yeastId: yeastData.yeastId || yeastData.YeastId, // Add the actual yeast ID from database
      name: yeastData.name || yeastData.Name,
      type: yeastData.type || yeastData.Type,
      attenuation: avgAttenuation.toString(),
      temperature: temperatureRange,
      description: yeastData.flavorProfile || yeastData.FlavorProfile || yeastData.description || yeastData.Description || '',
      manufacturer: yeastData.manufacturer || yeastData.Manufacturer || '',
      productId: yeastData.productId || yeastData.ProductId || ''
    }))
  }

  const primaryYeast = (modalData.yeasts || [])[0]
  const estimatedFG = primaryYeast ? calculateFG(modalData.estimatedOG || 1.050, primaryYeast.attenuation) : null
  const estimatedABV = primaryYeast && modalData.estimatedOG ? calculateABV(modalData.estimatedOG, parseFloat(estimatedFG)) : null

  return (
    <div className="space-y-6">
      
      {/* Header with Fermentation Summary */}
      <div className="bg-blue-50 rounded-lg p-4 h-[85px]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Yeast & Fermentation</h3>
            <p className="text-sm text-gray-600">Select yeast strains and fermentation parameters</p>
          </div>
          <div className="text-right">
            <div className="flex space-x-12">
              <div>
                <div className="text-2xl font-bold text-fermentum-800">
                  {estimatedFG || modalData.estimatedFG || '1.010'}
                </div>
                <div className="text-sm text-gray-600">Est. FG</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-fermentum-800">
                  {estimatedABV || modalData.estimatedABV || '5.0'}%
                </div>
                <div className="text-sm text-gray-600">Est. ABV</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Added Yeasts Table */}
      <div className="border border-gray-200 rounded-lg">
        
        <div className="bg-gray-200 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-semibold uppercase text-gray-900">Added Yeasts ({(modalData.yeasts || []).length})</h4>
        </div>
        
        {(modalData.yeasts || []).length > 0 && (
          <div className={`h-[200px] ${editingYeast ? 'overflow-visible' : 'overflow-y-scroll'}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Yeast Strain
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Attenuation
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(modalData.yeasts || []).map((yeast, index) => (
                  <tr key={yeast.id} className="hover:bg-gray-50">
                    {editingYeast && editingYeast.id === yeast.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingYeast.materialName || editingYeast.name || ''}
                            onChange={(e) => setEditingYeast(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <StandardDropdown
                            value={editingYeast.type}
                            onChange={(e) => setEditingYeast(prev => ({ ...prev, type: e.target.value }))}
                            options={YEAST_TYPES}
                            className="w-full text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <StandardDropdown
                            value={editingYeast.form}
                            onChange={(e) => setEditingYeast(prev => ({ ...prev, form: e.target.value }))}
                            options={YEAST_FORMS}
                            className="w-full text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-stretch">
                            <input
                              type="number"
                              step="0.1"
                              value={editingYeast.amount}
                              onChange={(e) => setEditingYeast(prev => ({ ...prev, amount: e.target.value }))}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded-l text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                            />
                            <StandardDropdown
                              value={editingYeast.unit}
                              onChange={(e) => setEditingYeast(prev => ({ ...prev, unit: e.target.value }))}
                              options={[
                                { value: 'pkg', label: 'pkg' },
                                { value: 'g', label: 'g' },
                                { value: 'oz', label: 'oz' },
                                { value: 'ml', label: 'ml' }
                              ]}
                              className="w-16 rounded-r rounded-l-none border-l-0 text-sm h-[34px]"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="1"
                            value={editingYeast.attenuation}
                            onChange={(e) => setEditingYeast(prev => ({ ...prev, attenuation: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingYeast.temperature}
                            onChange={(e) => setEditingYeast(prev => ({ ...prev, temperature: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
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
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {yeast.materialName || yeast.name}
                              {index === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>}
                            </div>
                            {yeast.description && (
                              <div className="text-xs text-gray-500">{yeast.description}</div>
                            )}
                            {yeast.manufacturer && (
                              <div className="text-xs text-gray-400">{yeast.manufacturer}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{yeast.type}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{yeast.form}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{yeast.amount} {yeast.unit}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{yeast.attenuation}%</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{yeast.temperature}</td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(yeast)}
                              className="text-blue-600 hover:text-blue-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => removeYeast(yeast.id)}
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
        {(modalData.yeasts || []).length === 0 && (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-gray-400 text-sm">No yeasts added yet</div>
          </div>
        )}
      
      </div>

      {/* Add New Yeast */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h4 className="text-lg font-semibold uppercase text-gray-900 mb-4">Add Yeast</h4>

        {/* Common Yeasts Quick Select */}
        <div className="mb-4">

          <label className="block text-sm font-medium text-gray-700 mb-2">Common Strains ({availableYeasts.length} available)</label>
            {loading ? (
              <div className="text-sm text-gray-500">Loading yeasts...</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {availableYeasts.map((yeast) => {
                const attenuationMin = yeast.attenuationMin || yeast.AttenuationMin
                const attenuationMax = yeast.attenuationMax || yeast.AttenuationMax
                const avgAttenuation = attenuationMin && attenuationMax
                  ? ((attenuationMin + attenuationMax) / 2).toFixed(0)
                  : attenuationMin || attenuationMax || ''

                const temperatureMin = yeast.temperatureMin || yeast.TemperatureMin
                const temperatureMax = yeast.temperatureMax || yeast.TemperatureMax
                const temperatureRange = temperatureMin && temperatureMax
                  ? `${temperatureMin}-${temperatureMax}°F`
                  : ''

                return (
                  <button
                    key={yeast.yeastId || yeast.YeastId || yeast.name || yeast.Name}
                    onClick={() => selectCommonYeast(yeast)}
                    className="flex flex-col items-start justify-start text-left p-3 border border-gray-300 rounded bg-gray-200 hover:bg-white hover:border-fermentum-400 transition-colors flex flex-col items-start"
                  >
                    <div className="text-sm font-medium">{yeast.name || yeast.Name}</div>
                    <div className="text-xs text-gray-500">
                      {yeast.type || yeast.Type} • {avgAttenuation}% • {temperatureRange}
                    </div>
                    {/*<div className="text-xs text-gray-400">{yeast.flavorProfile || yeast.FlavorProfile || yeast.description || yeast.Description}</div>*/}
                  </button>
                )
              })}
          </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Yeast Strain</label>
            <input
              type="text"
              value={newYeast.name}
              onChange={(e) => setNewYeast(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Wyeast 1056 - American Ale"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <StandardDropdown
              value={newYeast.type}
              onChange={(e) => setNewYeast(prev => ({ ...prev, type: e.target.value }))}
              options={YEAST_TYPES}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
            <StandardDropdown
              value={newYeast.form}
              onChange={(e) => setNewYeast(prev => ({ ...prev, form: e.target.value }))}
              options={YEAST_FORMS}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="flex items-stretch">
              <input
                type="number"
                step="0.1"
                value={newYeast.amount}
                onChange={(e) => setNewYeast(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="1"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
              <StandardDropdown
                value={newYeast.unit}
                onChange={(e) => setNewYeast(prev => ({ ...prev, unit: e.target.value }))}
                options={[
                  { value: 'pkg', label: 'pkg' },
                  { value: 'g', label: 'g' },
                  { value: 'oz', label: 'oz' },
                  { value: 'ml', label: 'ml' }
                ]}
                className="w-20 rounded-r-lg rounded-l-none border-l-0 h-[42px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attenuation %</label>
            <input
              type="number"
              step="1"
              value={newYeast.attenuation}
              onChange={(e) => setNewYeast(prev => ({ ...prev, attenuation: e.target.value }))}
              placeholder="75"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature Range</label>
            <input
              type="text"
              value={newYeast.temperature}
              onChange={(e) => setNewYeast(prev => ({ ...prev, temperature: e.target.value }))}
              placeholder="60-72°F"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
            <input
              type="text"
              value={newYeast.manufacturer}
              onChange={(e) => setNewYeast(prev => ({ ...prev, manufacturer: e.target.value }))}
              placeholder="e.g., Wyeast, Lallemand"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
            <input
              type="text"
              value={newYeast.productId}
              onChange={(e) => setNewYeast(prev => ({ ...prev, productId: e.target.value }))}
              placeholder="e.g., 1056"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={newYeast.description}
              onChange={(e) => setNewYeast(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Clean, crisp flavor with low esters"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={addYeast}
            disabled={!newYeast.name || !newYeast.amount || !newYeast.attenuation}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Yeast
          </button>
        </div>
      </div>
    </div>
  )
}