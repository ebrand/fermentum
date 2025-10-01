import React, { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilSquareIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import StandardDropdown from '../../common/StandardDropdown'
import api from '../../../utils/api'

// Hop addition timing options
const HOP_TIMINGS = [
  { value: 'First Wort', label: 'First Wort' },
  { value: 'Mash Hop', label: 'Mash Hop' },
  { value: '60', label: '60 min' },
  { value: '45', label: '45 min' },
  { value: '30', label: '30 min' },
  { value: '20', label: '20 min' },
  { value: '15', label: '15 min' },
  { value: '10', label: '10 min' },
  { value: '5', label: '5 min' },
  { value: '0', label: 'Flameout' },
  { value: 'Whirlpool', label: 'Whirlpool' },
  { value: 'Dry Hop', label: 'Dry Hop' }
]

// Hop forms
const HOP_FORMS = [
  { value: 'Pellet', label: 'Pellet' },
  { value: 'Whole', label: 'Whole/Leaf' },
  { value: 'Plug', label: 'Plug' },
  { value: 'Extract', label: 'Extract' }
]

// Hop usage types
const HOP_USES = [
  { value: 'Bittering', label: 'Bittering' },
  { value: 'Flavor', label: 'Flavor' },
  { value: 'Aroma', label: 'Aroma' },
  { value: 'Dual Purpose', label: 'Dual Purpose' }
]

// IBU calculation using Tinseth formula
const calculateIBU = (hops, batchSize, boilGravity = 1.050) => {
  return hops.reduce((totalIBU, hop) => {
    const time = parseFloat(hop.time) || 0
    const alphaAcid = parseFloat(hop.alphaAcid) || 0
    const amount = parseFloat(hop.amount) || 0

    // Skip non-boil additions for IBU calculation
    if (hop.time === 'Dry Hop' || hop.time === 'Mash Hop') return totalIBU

    // Utilization calculation (Tinseth)
    const bigness = 1.65 * Math.pow(0.000125, boilGravity - 1)
    const utilization = bigness * (1 - Math.exp(-0.04 * time)) / 4.15

    // Form factor for utilization
    const formFactor = hop.form === 'Whole' ? 0.9 : 1.0

    // IBU calculation
    const hopIBU = (amount * alphaAcid * utilization * formFactor * 10) / batchSize

    return totalIBU + hopIBU
  }, 0)
}

export default function HopsTab({ modalData, setModalData }) {
  const [editingHop, setEditingHop] = useState(null)
  const [availableHops, setAvailableHops] = useState([])
  const [loading, setLoading] = useState(false)
  const [newHop, setNewHop] = useState({
    hopId: null, // Add hopId field to match backend expectations
    name: '',
    alphaAcid: '',
    amount: '',
    unit: 'oz',
    time: '60',
    form: 'Pellet',
    use: 'Bittering',
    description: ''
  })

  // Load available hops from API
  useEffect(() => {
    loadAvailableHops()
  }, [])

  const loadAvailableHops = async () => {
    try {
      setLoading(true)
      const response = await api.get('/hops', {
        params: {
          take: 50
        }
      })
      if (response.data.success) {
        setAvailableHops(response.data.data)
      }
    } catch (error) {
      console.error('Error loading hops:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate total IBU when hops change
  const totalIBU = calculateIBU(modalData.hops || [], modalData.batchSize || 5)

  useEffect(() => {
    setModalData(prev => ({
      ...prev,
      estimatedIBU: Math.round(totalIBU)
    }))
  }, [modalData.hops, modalData.batchSize, setModalData])

  const addHop = () => {
    if (!newHop.name || !newHop.amount || !newHop.alphaAcid) return

    const hop = {
      id: Date.now(),
      ...newHop,
      amount: parseFloat(newHop.amount),
      alphaAcid: parseFloat(newHop.alphaAcid)
    }

    setModalData(prev => ({
      ...prev,
      hops: [...(prev.hops || []), hop]
    }))

    setNewHop({
      hopId: null, // Reset hopId field to match backend expectations
      name: '',
      alphaAcid: '',
      amount: '',
      unit: 'oz',
      time: '60',
      form: 'Pellet',
      use: 'Bittering',
      description: ''
    })
  }

  const removeHop = (hopId) => {
    setModalData(prev => ({
      ...prev,
      hops: (prev.hops || []).filter(hop => hop.id !== hopId)
    }))
  }

  const startEdit = (hop) => {
    setEditingHop({ ...hop })
  }

  const saveEdit = () => {
    if (!editingHop.name || !editingHop.amount || !editingHop.alphaAcid) return

    setModalData(prev => ({
      ...prev,
      hops: (prev.hops || []).map(hop =>
        hop.id === editingHop.id
          ? {
              ...editingHop,
              amount: parseFloat(editingHop.amount),
              alphaAcid: parseFloat(editingHop.alphaAcid)
            }
          : hop
      )
    }))
    setEditingHop(null)
  }

  const cancelEdit = () => {
    setEditingHop(null)
  }

  const selectCommonHop = (hopData) => {
    const alphaAcidMin = hopData.alphaAcidMin || hopData.AlphaAcidMin
    const alphaAcidMax = hopData.alphaAcidMax || hopData.AlphaAcidMax
    const avgAlphaAcid = alphaAcidMin && alphaAcidMax
      ? ((alphaAcidMin + alphaAcidMax) / 2).toFixed(1)
      : alphaAcidMin || alphaAcidMax || ''

    setNewHop(prev => ({
      ...prev,
      hopId: hopData.hopId || hopData.HopId, // Add the actual hop ID from database
      name: hopData.name || hopData.Name,
      alphaAcid: avgAlphaAcid.toString(),
      description: hopData.flavorProfile || hopData.FlavorProfile || hopData.description || hopData.Description || ''
    }))
  }

  return (
    <div className="space-y-6">
      
      {/* Header with IBU Summary */}
      <div className="bg-blue-50 rounded-lg p-4 h-[85px]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hop Schedule</h3>
            <p className="text-sm text-gray-600">Add hops for bittering, flavor, and aroma</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-fermentum-800">{Math.round(totalIBU)} IBU</div>
            <div className="text-sm text-gray-600">Estimated Bitterness</div>
          </div>
        </div>
      </div>

      {/* Added Hops Table */}
      <div className="border border-gray-200 rounded-lg">
        <div className="bg-gray-200 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-semibold uppercase text-gray-900">Added Hops ({(modalData.hops || []).length})</h4>
        </div>
        {(modalData.hops || []).length > 0 && (
          <div className={`h-[200px] ${editingHop ? 'overflow-visible' : 'overflow-y-scroll'}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Hop Variety
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    α-Acid %
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Use
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    IBU
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(modalData.hops || []).map((hop) => (
                  <tr key={hop.id} className="hover:bg-gray-50">
                    {editingHop && editingHop.id === hop.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingHop.materialName || editingHop.name || ''}
                            onChange={(e) => setEditingHop(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={editingHop.alphaAcid}
                            onChange={(e) => setEditingHop(prev => ({ ...prev, alphaAcid: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-stretch">
                            <input
                              type="number"
                              step="0.1"
                              value={editingHop.amount}
                              onChange={(e) => setEditingHop(prev => ({ ...prev, amount: e.target.value }))}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded-l text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                            />
                            <StandardDropdown
                              value={editingHop.unit}
                              onChange={(e) => setEditingHop(prev => ({ ...prev, unit: e.target.value }))}
                              options={[
                                { value: 'oz', label: 'oz' },
                                { value: 'g', label: 'g' },
                                { value: 'lb', label: 'lb' },
                                { value: 'kg', label: 'kg' }
                              ]}
                              className="w-16 rounded-r rounded-l-none border-l-0 text-sm h-[34px]"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <StandardDropdown
                            value={editingHop.time}
                            onChange={(e) => setEditingHop(prev => ({ ...prev, time: e.target.value }))}
                            options={HOP_TIMINGS}
                            className="w-full text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <StandardDropdown
                            value={editingHop.form}
                            onChange={(e) => setEditingHop(prev => ({ ...prev, form: e.target.value }))}
                            options={HOP_FORMS}
                            className="w-full text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <StandardDropdown
                            value={editingHop.use}
                            onChange={(e) => setEditingHop(prev => ({ ...prev, use: e.target.value }))}
                            options={HOP_USES}
                            className="w-full text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {Math.round(calculateIBU([editingHop], modalData.batchSize || 5))}
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
                            <div className="text-sm font-medium text-gray-900">{hop.materialName || hop.name || 'Unknown Hop'}</div>
                            {hop.description && (
                              <div className="text-xs text-gray-500">{hop.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{hop.alphaAcid}%</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{hop.amount} {hop.unit}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{hop.time}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{hop.form}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{hop.use}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {Math.round(calculateIBU([hop], modalData.batchSize || 5))}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(hop)}
                              className="text-blue-600 hover:text-blue-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => removeHop(hop.id)}
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
        {(modalData.hops || []).length === 0 && (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-gray-400 text-sm">No hops added yet</div>
          </div>
        )}
      </div>

      {/* Add New Hop */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h4 className="text-lg font-semibold uppercase text-gray-900 mb-4">Add Hop</h4>

        {/* Common Hops Quick Select */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Common Varieties ({availableHops.length} available)</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {availableHops.map((hop) => (
              <button
                key={hop.hopId || hop.HopId || hop.name || hop.Name}
                onClick={() => selectCommonHop(hop)}
                className="flex flex-col items-start justify-start text-left p-2 border bg-gray-200 border-gray-300 rounded hover:bg-white hover:border-fermentum-500 transition-colors"
              >
                <div className="text-sm font-medium">{hop.name || hop.Name} ({hop.harvestYear || hop.HarvestYear})</div>
                <div className="text-xs text-gray-500">
                  Acid: {hop.alphaAcidMin || hop.AlphaAcidMin} - {hop.alphaAcidMax || hop.AlphaAcidMax}%
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hop Variety</label>
            <input
              type="text"
              value={newHop.name}
              onChange={(e) => setNewHop(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Cascade"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alpha Acid %</label>
            <input
              type="number"
              step="0.1"
              value={newHop.alphaAcid}
              onChange={(e) => setNewHop(prev => ({ ...prev, alphaAcid: e.target.value }))}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="flex items-stretch">
              <input
                type="number"
                step="0.1"
                value={newHop.amount}
                onChange={(e) => setNewHop(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
              <StandardDropdown
                value={newHop.unit}
                onChange={(e) => setNewHop(prev => ({ ...prev, unit: e.target.value }))}
                options={[
                  { value: 'oz', label: 'oz' },
                  { value: 'g', label: 'g' },
                  { value: 'lb', label: 'lb' },
                  { value: 'kg', label: 'kg' }
                ]}
                className="w-20 rounded-r-lg rounded-l-none border-l-0 h-[42px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <StandardDropdown
              value={newHop.time}
              onChange={(e) => setNewHop(prev => ({ ...prev, time: e.target.value }))}
              options={HOP_TIMINGS}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
            <StandardDropdown
              value={newHop.form}
              onChange={(e) => setNewHop(prev => ({ ...prev, form: e.target.value }))}
              options={HOP_FORMS}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Use</label>
            <StandardDropdown
              value={newHop.use}
              onChange={(e) => setNewHop(prev => ({ ...prev, use: e.target.value }))}
              options={HOP_USES}
              className="w-full"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={newHop.description}
              onChange={(e) => setNewHop(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Citrusy aroma with grapefruit notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={addHop}
            disabled={!newHop.name || !newHop.amount || !newHop.alphaAcid}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Hop
          </button>
        </div>
      </div>
    </div>
  )
}