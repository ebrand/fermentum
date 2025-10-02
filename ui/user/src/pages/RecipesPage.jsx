import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, PencilSquareIcon, TrashIcon, BeakerIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { recipeAPI } from '../utils/api'
import DashboardLayout from '../components/DashboardLayout'
import Toast from '../components/common/Toast'
import ConfirmationModal from '../components/common/ConfirmationModal'

export default function RecipesPage() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, recipeId: null, recipeName: '' })

  // Calculate recipe statistics
  const recipeStats = {
    totalRecipes: recipes.length,
    beerStyles: [...new Set(recipes.map(r => r.styleName).filter(Boolean))].length,
    avgABV: recipes.length > 0 ? (recipes.reduce((sum, r) => sum + (r.estimatedABV || 0), 0) / recipes.length).toFixed(1) : '0.0',
    avgIBU: recipes.length > 0 ? Math.round(recipes.reduce((sum, r) => sum + (r.estimatedIBU || 0), 0) / recipes.length) : 0
  }

  useEffect(() => {
    loadRecipes()
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

  const handleCreateRecipe = () => {
    navigate('/production/recipes/new')
  }

  const handleEditRecipe = (recipeId) => {
    navigate(`/production/recipes/${recipeId}`)
  }

  const handleDeleteRecipe = (recipeId, recipeName) => {
    setDeleteConfirm({ show: true, recipeId, recipeName })
  }

  const confirmDelete = async () => {
    try {
      await recipeAPI.deleteRecipe(deleteConfirm.recipeId)
      await loadRecipes()
      setToast({ show: true, message: 'Recipe deleted successfully', type: 'success' })
    } catch (err) {
      console.error('Error deleting recipe:', err)
      setToast({ show: true, message: 'Failed to delete recipe. Please try again.', type: 'error' })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading recipes...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recipe Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create, manage, and track your brewing recipes
            </p>
          </div>
          <button
            onClick={handleCreateRecipe}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Recipe
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recipes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{recipeStats.totalRecipes}</p>
              </div>
              <BeakerIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Beer Styles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{recipeStats.beerStyles}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg ABV</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{recipeStats.avgABV}%</p>
              </div>
              <BeakerIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg IBU</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{recipeStats.avgIBU}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {recipes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Get started by creating your first brewing recipe
            </p>
            <button
              onClick={handleCreateRecipe}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Recipe
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipe Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Style
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ABV / IBU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingredients
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipes.map((recipe, index) => (
                  <tr
                    key={recipe.recipeId}
                    onDoubleClick={() => handleEditRecipe(recipe.recipeId)}
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      hover:bg-blue-50 cursor-pointer transition-colors
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {recipe.name}
                          </div>
                          {recipe.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {recipe.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{recipe.styleName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {recipe.batchSize} {recipe.batchSizeUnit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {recipe.estimatedABV ? `${recipe.estimatedABV}%` : '-'}
                        {recipe.estimatedABV && recipe.estimatedIBU && ' / '}
                        {recipe.estimatedIBU || ''}
                      </div>
                      {recipe.estimatedOG && recipe.estimatedFG && (
                        <div className="text-xs text-gray-500">
                          OG: {recipe.estimatedOG} / FG: {recipe.estimatedFG}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        <span className="inline-flex items-center mr-3">
                          <span className="font-medium text-gray-700">{recipe.grains?.length || 0}</span>
                          <span className="ml-1">grains</span>
                        </span>
                        <span className="inline-flex items-center mr-3">
                          <span className="font-medium text-gray-700">{recipe.hops?.length || 0}</span>
                          <span className="ml-1">hops</span>
                        </span>
                        <span className="inline-flex items-center">
                          <span className="font-medium text-gray-700">{recipe.yeasts?.length || 0}</span>
                          <span className="ml-1">yeast</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRecipe(recipe.recipeId, recipe.name)
                        }}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Delete recipe"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, recipeId: null, recipeName: '' })}
        onConfirm={confirmDelete}
        title="Delete Recipe?"
        message={`Are you sure you want to delete "${deleteConfirm.recipeName}"? This action cannot be undone.`}
        confirmText="Delete Recipe"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </DashboardLayout>
  )
}