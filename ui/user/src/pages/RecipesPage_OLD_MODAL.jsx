import React, { useState, useEffect } from 'react'
import { PlusIcon, BeakerIcon, DocumentTextIcon, TrashIcon, PencilSquareIcon, CubeIcon, FireIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Tab } from '@headlessui/react'
import api, { recipeAPI } from '../utils/api'
import NewGrainsTab from '../components/recipe-tabs/NewGrainsTab'
import NewHopsTab from '../components/recipe-tabs/NewHopsTab'
import NewYeastTab from '../components/recipe-tabs/NewYeastTab'
import NewAdditivesTab from '../components/recipe-tabs/NewAdditivesTab'
import MashStepsTab from '../components/recipe-tabs/MashStepsTab'
import SummaryTab from '../components/recipe-tabs/SummaryTab'
import TabHeader from '../components/recipe-tabs/TabHeader'
import TabSection from '../components/recipe-tabs/TabSection'
import TabFooter from '../components/recipe-tabs/TabFooter'
import DashboardLayout from '../components/DashboardLayout'
import StandardDropdown from '../components/common/StandardDropdown'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [beerStyles, setBeerStyles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // Calculate recipe statistics
  const recipeStats = {
    totalRecipes: recipes.length,
    beerStyles: [...new Set(recipes.map(r => r.styleName).filter(Boolean))].length,
    avgABV: recipes.length > 0 ? (recipes.reduce((sum, r) => sum + (r.estimatedABV || 0), 0) / recipes.length).toFixed(1) : '0.0',
    avgIBU: recipes.length > 0 ? Math.round(recipes.reduce((sum, r) => sum + (r.estimatedIBU || 0), 0) / recipes.length) : 0
  }

  // Modal state for recipe editing/creation
  const [modalData, setModalData] = useState({
    // Recipe Info
    name: '',
    description: '',
    styleId: '',
    batchSize: 5,
    batchSizeUnit: 'gallons',
    boilTime: 60,
    efficiency: 75,
    estimatedOG: null,
    estimatedFG: null,
    estimatedABV: null,
    estimatedIBU: null,
    estimatedSRM: null,

    // Ingredients (will be populated later)
    grains: [],
    hops: [],
    yeasts: [],
    additives: [],
    mashSteps: []
  })

  useEffect(() => {
    loadRecipes()
    loadBeerStyles()
  }, [])

  const loadRecipes = async () => {
    try {
      const response = await recipeAPI.getRecipes()
      if (response.data.success) {
        setRecipes(response.data.data)
      }
    } catch (err) {
      setError('Failed to load recipes')
      console.error('Error loading recipes:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadBeerStyles = async () => {
    try {
      const response = await recipeAPI.getBeerStyles()
      if (response.data.success) {
        setBeerStyles(response.data.data)
      }
    } catch (err) {
      console.error('Error loading beer styles:', err)
    }
  }

  const handleCreateRecipe = () => {
    setSelectedRecipe(null)
    setIsEditing(false)
    setModalData({
      name: '',
      description: '',
      styleId: '',
      batchSize: 5,
      batchSizeUnit: 'gallons',
      boilTime: 60,
      efficiency: 75,
      estimatedOG: null,
      estimatedFG: null,
      estimatedABV: null,
      estimatedIBU: null,
      estimatedSRM: null,
      grains: [],
      hops: [],
      yeasts: [],
      additives: [],
      mashSteps: []
    })
    setShowModal(true)
  }

  const handleEditRecipe = async (recipe) => {
    try {
      // Load full recipe details
      const response = await recipeAPI.getRecipe(recipe.recipeId)
      if (response.data.success) {
        const fullRecipe = response.data.data
        setSelectedRecipe(fullRecipe)
        setModalData({
          name: fullRecipe.name,
          description: fullRecipe.description || '',
          styleId: fullRecipe.styleId || '',
          batchSize: fullRecipe.batchSize,
          batchSizeUnit: fullRecipe.batchSizeUnit,
          boilTime: fullRecipe.boilTime,
          efficiency: fullRecipe.efficiency,
          estimatedOG: fullRecipe.estimatedOG,
          estimatedFG: fullRecipe.estimatedFG,
          estimatedABV: fullRecipe.estimatedABV,
          estimatedIBU: fullRecipe.estimatedIBU,
          estimatedSRM: fullRecipe.estimatedSRM,
          grains: fullRecipe.Grains || [],
          hops: fullRecipe.Hops || [],
          yeasts: fullRecipe.Yeasts || [],
          additives: fullRecipe.Additives || [],
          mashSteps: fullRecipe.MashSteps || []
        })
        setIsEditing(true)
        setShowModal(true)
      }
    } catch (err) {
      setError('Failed to load recipe details')
      console.error('Error loading recipe:', err)
    }
  }

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return

    try {
      const response = await recipeAPI.deleteRecipe(recipeId)
      if (response.data.success) {
        loadRecipes()
      }
    } catch (err) {
      setError('Failed to delete recipe')
      console.error('Error deleting recipe:', err)
    }
  }

  const handleSaveRecipe = async () => {
    try {
      const recipeData = {
        styleId: modalData.styleId || null,
        name: modalData.name,
        description: modalData.description,
        batchSize: modalData.batchSize,
        batchSizeUnit: modalData.batchSizeUnit,
        boilTime: modalData.boilTime,
        efficiency: modalData.efficiency,
        estimatedOG: modalData.estimatedOG,
        estimatedFG: modalData.estimatedFG,
        estimatedABV: modalData.estimatedABV,
        estimatedIBU: modalData.estimatedIBU,
        estimatedSRM: modalData.estimatedSRM,
        // Transform ingredient data to match backend DTOs with TitleCase
        Grains: (modalData.grains || []).filter(grain => grain.GrainId).map((grain, index) => ({
          GrainId: grain.GrainId,
          Amount: grain.Amount,
          Unit: grain.Unit || 'lbs',
          SortOrder: index + 1,
          Percentage: grain.Percentage,
          Lovibond: grain.Lovibond,
          ExtractPotential: grain.ExtractPotential
        })),
        Hops: (modalData.hops || []).filter(hop => hop.HopId).map((hop, index) => ({
          HopId: hop.HopId,
          Amount: hop.Amount,
          Unit: hop.Unit || 'oz',
          AdditionTime: parseInt(hop.AdditionTime) || 0,
          AdditionType: hop.AdditionType || 'Boil',
          Purpose: hop.Purpose || 'Bittering',
          Form: hop.Form || 'Pellet',
          AlphaAcid: hop.AlphaAcid || 0
        })),
        Yeasts: (modalData.yeasts || []).filter(yeast => yeast.YeastId).map((yeast, index) => ({
          YeastId: yeast.YeastId,
          Amount: yeast.Amount,
          Unit: yeast.Unit || 'pkg',
          AdditionStage: yeast.AdditionStage,
          StarterSize: yeast.StarterSize,
          StarterGravity: yeast.StarterGravity,
          PitchRate: yeast.PitchRate,
          TargetCellCount: yeast.TargetCellCount,
          SortOrder: index + 1
        })),
        Additives: (modalData.additives || []).filter(additive => additive.AdditiveId).map((additive, index) => ({
          AdditiveId: additive.AdditiveId,
          Amount: additive.Amount,
          Unit: additive.Unit || 'g',
          AdditionTime: additive.AdditionTime || null,
          AdditionStage: additive.AdditionStage,
          TargetParameter: additive.TargetParameter,
          TargetValue: additive.TargetValue,
          SortOrder: index + 1,
          Notes: additive.Notes || ''
        })),
        MashSteps: (modalData.mashSteps || []).map((step, index) => ({
          StepNumber: step.StepNumber ?? index + 1,
          StepName: step.StepName,
          StepType: step.StepType || 'Temperature',
          Temperature: step.Temperature,
          Duration: step.Duration,
          Description: step.Description || ''
        }))
      }

      console.log('💾 Saving recipe with ingredients:', {
        name: recipeData.name,
        grains: recipeData.Grains.length,
        hops: recipeData.Hops.length,
        yeasts: recipeData.Yeasts.length,
        additives: recipeData.Additives.length,
        mashSteps: recipeData.MashSteps.length
      })

      let response
      if (isEditing) {
        response = await recipeAPI.updateRecipe(selectedRecipe.recipeId, recipeData)
      } else {
        response = await recipeAPI.createRecipe(recipeData)
      }

      if (response.data.success) {
        setShowModal(false)
        loadRecipes()
        console.log('✅ Recipe saved successfully with all ingredients')
      }
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} recipe`)
      console.error('Error saving recipe:', err)
    }
  }

  const getBeerStyleName = (styleId) => {
    const style = beerStyles.find(s => s.styleId === styleId)
    return style ? `${style.bjcpNumber || ''} ${style.styleName}`.trim() : 'Unknown Style'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Recipes"
      subtitle="Manage your brewery's beer recipes and formulations"
      currentPage="Recipes"
    >
      <div className="space-y-6">

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Recipes */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Recipes</dt>
                    <dd className="text-lg font-medium text-gray-900">{recipeStats.totalRecipes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Beer Styles */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-amber-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Beer Styles</dt>
                    <dd className="text-lg font-medium text-gray-900">{recipeStats.beerStyles}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Average ABV */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FireIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg ABV</dt>
                    <dd className="text-lg font-medium text-gray-900">{recipeStats.avgABV}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Average IBU */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg IBU</dt>
                    <dd className="text-lg font-medium text-gray-900">{recipeStats.avgIBU}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        
        </div>

        <button
            type="button"
            onClick={handleCreateRecipe}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-fermentum-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
        >
          <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
          New Recipe
        </button>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Recipes List */}
        <div className="bg-white shadow overflow-hidden rounded-xl">
          <ul className="divide-y divide-gray-200">
            {recipes.length === 0 ? (
              <li className="p-6 text-center text-gray-500">
                <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recipes</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first recipe.</p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleCreateRecipe}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-fermentum-800 hover:bg-fermentum-700"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                    New Recipe
                  </button>
                </div>
              </li>
            ) : (
              recipes.map((recipe) => (
                <li key={recipe.recipeId} className="odd:bg-gray-100 even:bg-white">
                  <div className="flex items-center justify-between space-x-12 ">
                    
                    {/* Name & Description */}
                    <div className="flex-1 min-w-0 p-3">
                      <div className="flex items-center">
                        
                        {/* Icon */}
                        <div className="bg-gray-100 rounded-full p-3 border border-gray-200">
                          <BeakerIcon className="flex-shrink-0 h-5 w-5 text-gray-600" />
                        </div>
                        
                        {/* Name & Description */}
                        <div className="ml-4">
                          <h3 className="-mb-2 text-lg font-medium text-gray-900 truncate">
                            {recipe.name}
                          </h3>
                          {recipe.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {recipe.description}
                            </p>
                          )}
                        </div>
                        
                      </div>
                    </div>
                    
                    {/* Batch Size */}
                    <div className="grid text-center border border-gray-100 p-3 bg-white m-2 rounded-xl min-w-24">
                      <>
                        <span className="text-xl text-fermentum-800 font-semibold">{recipe.batchSize}</span>
                        <span className="text-sm text-gray-600">{recipe.batchSizeUnit}</span>
                      </>
                    </div>
                    
                    {/* ABV */}
                    <div className="grid text-center p-3 p-3 border border-gray-100 bg-white m-2 rounded-xl min-w-24">
                      {recipe.estimatedABV && (
                        <>
                          <span className="text-xl text-fermentum-800 font-semibold">{recipe.estimatedABV}%</span>
                          <span className="text-sm text-gray-600">ABV</span>
                        </>
                      )}
                    </div>
                    
                    {/* IBU */}
                    <div className="grid text-center p-3 p-3 border border-gray-100 bg-white m-2 rounded-xl min-w-24">
                      {recipe.estimatedIBU && (
                        <>
                          <span className="text-xl text-fermentum-800 font-semibold">{recipe.estimatedIBU}</span>
                          <span className="text-sm text-gray-600">IBU</span>
                        </>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 p-3">
                      <button
                        onClick={() => handleEditRecipe(recipe)}
                        className="text-blue-600 hover:text-blue-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(recipe.recipeId)}
                        className="text-red-600 hover:text-red-900 border border-gray-300 rounded-lg p-1 hover:bg-gray-200"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Recipe Modal with Tabs */}
        {showModal && (
          <RecipeModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSaveRecipe}
            isEditing={isEditing}
            modalData={modalData}
            setModalData={setModalData}
            beerStyles={beerStyles}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

function RecipeModal({ isOpen, onClose, onSave, isEditing, modalData, setModalData, beerStyles }) {
  const [selectedTab, setSelectedTab] = useState(0)

  const tabs = [
    { name: 'Recipe Info', icon: DocumentTextIcon },
    { name: 'Grains', icon: BeakerIcon, badge: modalData.grains?.length || 0 },
    { name: 'Hops', icon: BeakerIcon, badge: modalData.hops?.length || 0 },
    { name: 'Yeast', icon: BeakerIcon, badge: modalData.yeasts?.length || 0 },
    { name: 'Additives', icon: BeakerIcon, badge: modalData.additives?.length || 0 },
    { name: 'Mash Steps', icon: BeakerIcon, badge: modalData.mashSteps?.length || 0 },
    { name: 'Summary', icon: DocumentTextIcon }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>

          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex rounded-3xl bg-fermentum-800 p-1 mb-6">
              {tabs.map((tab, index) => (
                <Tab key={tab.name} className="flex-1">
                  {({ selected }) => (
                    <div className={classNames(
                      'w-full rounded-3xl py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-75 ring-offset-2 ring-offset-fermentum-900/40 focus:outline-none',
                      selected
                        ? 'bg-white text-fermentum-800 font-semibold shadow'
                        : 'text-gray-100 hover:bg-white/[0.12] font-semibold hover:text-white'
                    )}>
                      <div className="flex items-center justify-center space-x-2 px-2">
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.name}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span className={`text-xs rounded-full h-5 w-5 flex items-center justify-center ${
                            selected ? 'text-white bg-fermentum-800' : 'text-fermentum-800 bg-gray-300'
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="min-h-96">
              <Tab.Panel>
                <RecipeInfoTab modalData={modalData} setModalData={setModalData} beerStyles={beerStyles} />
              </Tab.Panel>
              <Tab.Panel>
                <NewGrainsTab
                  recipeGrains={modalData.grains}
                  onGrainsChange={(grains) => setModalData(prev => ({ ...prev, grains }))}
                />
              </Tab.Panel>
              <Tab.Panel>
                <NewHopsTab
                  recipeHops={modalData.hops}
                  onHopsChange={(hops) => setModalData(prev => ({ ...prev, hops }))}
                />
              </Tab.Panel>
              <Tab.Panel>
                <NewYeastTab
                  recipeYeasts={modalData.yeasts}
                  onYeastsChange={(yeasts) => setModalData(prev => ({ ...prev, yeasts }))}
                />
              </Tab.Panel>
              <Tab.Panel>
                <NewAdditivesTab
                  recipeAdditives={modalData.additives}
                  onAdditivesChange={(additives) => setModalData(prev => ({ ...prev, additives }))}
                />
              </Tab.Panel>
              <Tab.Panel>
                <MashStepsTab modalData={modalData} setModalData={setModalData} />
              </Tab.Panel>
              <Tab.Panel>
                <SummaryTab modalData={modalData} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="rounded-md border border-transparent bg-fermentum-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-fermentum-700"
            >
              {isEditing ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecipeInfoTab({ modalData, setModalData, beerStyles }) {
  const handleInputChange = (field, value) => {
    setModalData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-6">
      <TabHeader
        title="Basic Information"
        description=""
      />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipe Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={modalData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., West Coast IPA, Irish Stout"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={modalData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Recipe notes, flavor profile, inspiration..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beer Style</label>
            <StandardDropdown
              value={modalData.styleId}
              onChange={(e) => handleInputChange('styleId', e.target.value)}
              options={[
                { value: '', label: 'Select a style' },
                ...beerStyles.map(style => ({
                  value: style.styleId,
                  label: `${style.bjcpNumber ? `${style.bjcpNumber} - ` : ''}${style.styleName}`
                }))
              ]}
              placeholder="Select a style"
              className="w-full"
            />
          </div>
        </div>
      </div>

      <TabSection title="Batch Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch Size <span className="text-red-500">*</span>
            </label>
            <div className="flex items-stretch">
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={modalData.batchSize}
                onChange={(e) => handleInputChange('batchSize', parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                required
              />
              <StandardDropdown
                value={modalData.batchSizeUnit}
                onChange={(e) => handleInputChange('batchSizeUnit', e.target.value)}
                options={[
                  { value: 'gallons', label: 'gallons' },
                  { value: 'liters', label: 'liters' },
                  { value: 'barrels', label: 'barrels' }
                ]}
                className="w-28 rounded-r-lg rounded-l-none border-l-0 h-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Boil Time (minutes)</label>
            <input
              type="number"
              min="15"
              max="180"
              value={modalData.boilTime}
              onChange={(e) => handleInputChange('boilTime', parseInt(e.target.value) || 60)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Efficiency (%)</label>
            <input
              type="number"
              min="50"
              max="95"
              step="0.5"
              value={modalData.efficiency}
              onChange={(e) => handleInputChange('efficiency', parseFloat(e.target.value) || 75)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <TabFooter>Mash efficiency for your system</TabFooter>
          </div>
        </div>
      </TabSection>

      <TabSection title="Estimated Values">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OG</label>
            <input
              type="number"
              step="0.001"
              min="1.000"
              max="1.200"
              value={modalData.estimatedOG || ''}
              onChange={(e) => handleInputChange('estimatedOG', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="1.050"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FG</label>
            <input
              type="number"
              step="0.001"
              min="0.990"
              max="1.050"
              value={modalData.estimatedFG || ''}
              onChange={(e) => handleInputChange('estimatedFG', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="1.010"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ABV (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="15"
              value={modalData.estimatedABV || ''}
              onChange={(e) => handleInputChange('estimatedABV', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="5.2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IBU</label>
            <input
              type="number"
              min="0"
              max="150"
              value={modalData.estimatedIBU || ''}
              onChange={(e) => handleInputChange('estimatedIBU', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="35"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SRM</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="40"
              value={modalData.estimatedSRM || ''}
              onChange={(e) => handleInputChange('estimatedSRM', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="8"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <TabFooter>
          These values will be calculated automatically when ingredients are added, but can be manually overridden.
        </TabFooter>
      </TabSection>
    </div>
  )
}