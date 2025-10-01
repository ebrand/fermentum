import React, { useState, useEffect, useMemo, useRef } from 'react'
import { PlusIcon, TrashIcon, PencilSquareIcon, XMarkIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import StandardDropdown from '../../common/StandardDropdown'
import { getIngredientData } from '../../../utils/api'

// Addition timing options (minutes - when to add during process)
const ADDITION_TIMES = [
  { value: null, label: 'At Start' },
  { value: 60, label: '60 min' },
  { value: 30, label: '30 min' },
  { value: 15, label: '15 min' },
  { value: 10, label: '10 min' },
  { value: 5, label: '5 min' },
  { value: 0, label: 'Flameout' }
]

function truncateWithEllipsis(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export default function AdditivesTab({ modalData, setModalData }) {
  const [editingAdditive, setEditingAdditive] = useState(null)
  const [availableAdditives, setAvailableAdditives] = useState([])
  const [loading, setLoading] = useState(true)

  // Scroll detection state
  const scrollContainerRef = useRef(null)
  const [showLeftChevron, setShowLeftChevron] = useState(false)
  const [showRightChevron, setShowRightChevron] = useState(false)

  // Generate dynamic categories from API data
  const additiveCategories = useMemo(() => {
    if (!availableAdditives.length) return []

    const uniqueCategories = [...new Set(availableAdditives.map(additive => additive.category))]
      .filter(Boolean) // Remove any null/undefined categories
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())) // Sort alphabetically (case-insensitive)
      .map(category => ({ value: category, label: category }))

    return uniqueCategories
  }, [availableAdditives])

  // Set default category based on available categories
  const defaultCategory = additiveCategories.length > 0 ? additiveCategories[0].value : 'Water Treatment'

  const [activeSubTab, setActiveSubTab] = useState(defaultCategory)
  const [newAdditive, setNewAdditive] = useState({
    additiveId: null, // Database additive reference (required)
    amount: '',
    unit: 'g',
    additionTime: null, // Minutes when to add during process
    notes: ''
  })

  // Load available additives from API
  useEffect(() => {
    const loadAdditives = async () => {
      try {
        setLoading(true)
        const data = await getIngredientData('additives')
        console.log('✅ Loaded additives from API:', data.data?.length || 0, 'additives')
        if (data.success) {
          setAvailableAdditives(data.data || [])
        }
      } catch (error) {
        console.error('Error loading additives:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAdditives()
  }, [])

  // Update activeSubTab when categories are loaded
  useEffect(() => {
    if (additiveCategories.length > 0) {
      console.log('📂 Dynamic categories generated:', additiveCategories.map(c => c.value))
      const firstCategory = additiveCategories[0].value
      setActiveSubTab(firstCategory)
    }
  }, [additiveCategories])

  // Scroll detection function
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollLeft = container.scrollLeft
    const scrollWidth = container.scrollWidth
    const clientWidth = container.clientWidth

    // Show left chevron when scrolled right from the start
    setShowLeftChevron(scrollLeft > 5)

    // Show right chevron when there's more content to scroll
    setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 5)
  }

  // Check scroll position when categories change or component mounts
  useEffect(() => {
    checkScrollPosition()

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollPosition)
      // Also check on resize
      window.addEventListener('resize', checkScrollPosition)

      return () => {
        container.removeEventListener('scroll', checkScrollPosition)
        window.removeEventListener('resize', checkScrollPosition)
      }
    }
  }, [additiveCategories])

  const addAdditive = () => {
    if (!newAdditive.additiveId || !newAdditive.amount) return

    // Generate a unique ID for the frontend
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Find the selected additive from available additives to get display info
    const selectedAdditive = availableAdditives.find(a => a.additiveId === newAdditive.additiveId || a.AdditiveId === newAdditive.additiveId)

    const additive = {
      id: uniqueId, // Frontend display ID
      additiveId: newAdditive.additiveId, // Database additive reference (RecipeAdditive.AdditiveId)
      // Recipe-specific fields (stored in RecipeAdditive table)
      amount: parseFloat(newAdditive.amount),
      unit: newAdditive.unit,
      additionTime: newAdditive.additionTime,
      notes: newAdditive.notes,
      // Display fields (from Additive table, read-only)
      name: selectedAdditive?.name || selectedAdditive?.Name || 'Unknown Additive',
      category: selectedAdditive?.category || selectedAdditive?.Category || 'Unknown',
      purpose: selectedAdditive?.purpose || selectedAdditive?.Purpose || '',
      description: selectedAdditive?.description || selectedAdditive?.Description || ''
    }

    console.log('🔄 Adding additive to recipe:', {
      id: additive.id,
      additiveId: additive.additiveId,
      name: additive.name,
      amount: additive.amount,
      unit: additive.unit,
      additionTime: additive.additionTime
    })

    setModalData(prev => ({
      ...prev,
      additives: [...(prev.additives || []), additive]
    }))

    setNewAdditive({
      additiveId: null,
      amount: '',
      unit: 'g',
      additionTime: null,
      notes: ''
    })
  }

  const removeAdditive = (additiveId) => {
    console.log('🗑️ Removing additive with ID:', additiveId)
    setModalData(prev => ({
      ...prev,
      additives: (prev.additives || []).filter(additive => additive.id !== additiveId)
    }))
  }

  const startEdit = (additive) => {
    setEditingAdditive({ ...additive })
  }

  const saveEdit = () => {
    if (!editingAdditive.name || !editingAdditive.amount) return

    console.log('💾 Saving additive edit:', {
      id: editingAdditive.id,
      name: editingAdditive.name,
      amount: editingAdditive.amount
    })

    setModalData(prev => ({
      ...prev,
      additives: (prev.additives || []).map(additive =>
        additive.id === editingAdditive.id
          ? {
              ...editingAdditive,
              materialName: editingAdditive.materialName || editingAdditive.name,
              amount: parseFloat(editingAdditive.amount)
            }
          : additive
      )
    }))
    setEditingAdditive(null)
  }

  const cancelEdit = () => {
    setEditingAdditive(null)
  }

  const selectCommonAdditive = (additiveData) => {
    setNewAdditive(prev => ({
      ...prev,
      additiveId: additiveData.additiveId || additiveData.AdditiveId // Only set the database reference
    }))
  }

  // Update category when sub-tab changes
  const handleSubTabChange = (category) => {
    setActiveSubTab(category)
    setNewAdditive(prev => ({
      ...prev,
      additiveId: null // Reset additive ID when switching categories
    }))
  }

  // Group additives by category for display
  const additivesByCategory = (modalData.additives || []).reduce((acc, additive) => {
    if (!acc[additive.category]) {
      acc[additive.category] = []
    }
    acc[additive.category].push(additive)
    return acc
  }, {})

  // Get additives for the current active sub-tab
  const currentCategoryAdditives = additivesByCategory[activeSubTab] || []

  // Get common additives for the current category from API
  const currentCategoryCommonAdditives = availableAdditives.filter(add => add.category === activeSubTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 rounded-lg p-4 h-[85px]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Additives & Water Treatment</h3>
            <p className="text-sm text-gray-600">Water salts, finings, nutrients, and other brewing additives</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-fermentum-800">
              {(modalData.additives || []).length}
            </div>
            <div className="text-sm text-gray-600">Total Additives</div>
          </div>
        </div>
      </div>

      <div>
        
        {/* All Additives Table */}
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-200 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-semibold uppercase text-gray-900">Added Additives ({(modalData.additives || []).length})</h4>
          </div>
          {(modalData.additives || []).length > 0 && (
            <div className={`h-[200px] ${editingAdditive ? 'overflow-visible' : 'overflow-y-scroll'}`}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Timing
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(modalData.additives || []).map((additive) => (
                    <tr key={additive.id} className="hover:bg-gray-50">
                      {editingAdditive && editingAdditive.id === additive.id ? (
                        <>
                          <td className="px-4 py-2">
                            <StandardDropdown
                              value={editingAdditive.category}
                              onChange={(e) => setEditingAdditive(prev => ({ ...prev, category: e.target.value }))}
                              options={additiveCategories}
                              className="w-full text-sm"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editingAdditive.materialName || editingAdditive.name || ''}
                              onChange={(e) => setEditingAdditive(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-stretch">
                              <input
                                type="number"
                                step="0.1"
                                value={editingAdditive.amount}
                                onChange={(e) => setEditingAdditive(prev => ({ ...prev, amount: e.target.value }))}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded-l text-sm focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                              />
                              <StandardDropdown
                                value={editingAdditive.unit}
                                onChange={(e) => setEditingAdditive(prev => ({ ...prev, unit: e.target.value }))}
                                options={[
                                  { value: 'g', label: 'g' },
                                  { value: 'mg', label: 'mg' },
                                  { value: 'oz', label: 'oz' },
                                  { value: 'tsp', label: 'tsp' },
                                  { value: 'tbsp', label: 'tbsp' },
                                  { value: 'ml', label: 'ml' },
                                  { value: 'tablet', label: 'tablet' },
                                  { value: 'pkg', label: 'pkg' }
                                ]}
                                className="w-20 rounded-r rounded-l-none border-l-0 text-sm h-[34px]"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <StandardDropdown
                              value={editingAdditive.time}
                              onChange={(e) => setEditingAdditive(prev => ({ ...prev, time: e.target.value }))}
                              options={ADDITION_TIMES}
                              className="w-full text-sm"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editingAdditive.purpose}
                              onChange={(e) => setEditingAdditive(prev => ({ ...prev, purpose: e.target.value }))}
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {additive.category}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{additive.materialName || additive.name || 'Unknown Additive'}</div>
                              {additive.description && (
                                <div className="text-xs text-gray-500">{additive.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{additive.amount} {additive.unit}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{additive.time}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{additive.purpose}</td>
                          <td className="px-4 py-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEdit(additive)}
                                className="text-blue-600 hover:text-blue-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                                title="Edit"
                              >
                                <PencilSquareIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => removeAdditive(additive.id)}
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
          {(modalData.additives || []).length === 0 && (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-gray-400 text-sm">No additives added yet</div>
            </div>
          )}
        </div>
        
      </div>

      {/* Category Sub-Tabs */}
      <div className="border-b border-gray-200">
        <div className="relative">
          {/* Scroll container with gradient fade indicators and chevrons */}
          <div className="relative overflow-hidden">
            
            {/* Left fade gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>

            {/* Right fade gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

            {/* Left chevron indicator */}
            {showLeftChevron && (
              <div className="absolute bg-white/90 rounded-lg p-3 left-1 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none">
                <ChevronLeftIcon className="h-4 w-4 text-blue-900/40  translate-y-1/2" strokeWidth={4} />
                <ChevronLeftIcon className="h-4 w-4 text-blue-900/40 -ml-2 -translate-y-1/2" strokeWidth={4} />
              </div>
            )}

            {/* Right chevron indicator */}
            {showRightChevron && (
              <div className="absolute bg-white/90 rounded-lg p-3 right-1 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none">
                <ChevronRightIcon className="h-4 w-4 text-blue-900/40 translate-y-1/2" strokeWidth={4} />
                <ChevronRightIcon className="h-4 w-4 text-blue-900/40 -ml-2 -translate-y-1/2" strokeWidth={4} />
              </div>
            )}

            {/* Scrollable tabs container */}
            <nav
              ref={scrollContainerRef}
              className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {additiveCategories.map((category) => {
                const isActive = activeSubTab === category.value
                const categoryCount = additivesByCategory[category.value]?.length || 0

                return (
                  <button
                    key={category.value}
                    onClick={() => handleSubTabChange(category.value)}
                    className={`py-3 px-3 border-b-2 font-medium text-sm whitespace-nowrap text-gray-800 uppercase flex-shrink-0 transition-colors duration-200 ${
                      isActive
                        ? 'border-fermentum-500 text-fermentum-600 bg-fermentum-50 rounded-t-lg'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{category.label}</span>
                      {categoryCount > 0 && (
                        <span className={`py-1 px-2 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-fermentum-200 text-fermentum-900' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {categoryCount}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Loading state for tabs */}
          {loading && additiveCategories.length === 0 && (
            <div className="flex space-x-4 px-4 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          )}

          {/* No categories state */}
          {!loading && additiveCategories.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 bg-gray-50 rounded-lg mx-4 my-2">
              No additive categories found. Categories will appear as you add additives.
            </div>
          )}
        </div>
      </div>

      {/* All Additives List (Common for All Tabs) */}
      <div className="space-y-4">

        {/* Add New Additive */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="text-lg font-semibold uppercase text-gray-900 mb-4">Add {activeSubTab}</h4>

          {/* Current Category Common Additives Quick Select */}
          {loading ? (
            <div className="text-sm text-gray-500 mb-4">Loading additives...</div>
          ) : currentCategoryCommonAdditives.length > 0 ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Common {activeSubTab} Additives ({currentCategoryCommonAdditives.length} available)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {currentCategoryCommonAdditives.map((additive) => (
                  <button
                    key={additive.additiveId || additive.name}
                    onClick={() => selectCommonAdditive(additive)}
                    className="flex flex-col items-start justify-start text-left p-2 border bg-gray-200 border-gray-300 rounded hover:bg-white hover:border-fermentum-500 transition-colors"
                  >
                    <div className="text-sm font-medium">{truncateWithEllipsis(additive.name, 20) || truncateWithEllipsis(additive.Name, 20)}</div>
                    <div className="text-xs text-gray-500">{additive.description || additive.purpose}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additive Name</label>
              <input
                type="text"
                value={newAdditive.name}
                onChange={(e) => setNewAdditive(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Calcium Chloride"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="flex items-stretch">
                <input
                  type="number"
                  step="0.1"
                  value={newAdditive.amount}
                  onChange={(e) => setNewAdditive(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.0"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
                />
                <StandardDropdown
                  value={newAdditive.unit}
                  onChange={(e) => setNewAdditive(prev => ({ ...prev, unit: e.target.value }))}
                  options={[
                    { value: 'g', label: 'g' },
                    { value: 'mg', label: 'mg' },
                    { value: 'oz', label: 'oz' },
                    { value: 'tsp', label: 'tsp' },
                    { value: 'tbsp', label: 'tbsp' },
                    { value: 'ml', label: 'ml' },
                    { value: 'tablet', label: 'tablet' },
                    { value: 'pkg', label: 'pkg' }
                  ]}
                  className="w-24 rounded-r-lg rounded-l-none border-l-0 h-[42px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timing</label>
              <StandardDropdown
                value={newAdditive.time}
                onChange={(e) => setNewAdditive(prev => ({ ...prev, time: e.target.value }))}
                options={ADDITION_TIMES}
                className="w-full"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <input
                type="text"
                value={newAdditive.purpose}
                onChange={(e) => setNewAdditive(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="e.g., Increase calcium content"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={newAdditive.description}
                onChange={(e) => setNewAdditive(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Enhances malt character and mouthfeel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={addAdditive}
              disabled={!newAdditive.name || !newAdditive.amount}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add {activeSubTab}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}