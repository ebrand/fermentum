import React from 'react'
import { BeakerIcon, SparklesIcon } from '@heroicons/react/24/outline'

/**
 * Shared component that displays a summary of all ingredients added to the recipe.
 * This component is shown across all tabs so users can remember what they've selected
 * and pair ingredients better.
 */
const RecipeIngredientsSummary = ({ recipeData }) => {
  const { grains = [], hops = [], yeasts = [], additives = [], mashSteps = [] } = recipeData

  // Calculate total counts
  const totalIngredients = grains.length + hops.length + yeasts.length + additives.length

  if (totalIngredients === 0 && mashSteps.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-400 py-4">
          <BeakerIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No ingredients added yet</p>
          <p className="text-xs mt-1">Start building your recipe in the tabs above</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Recipe Summary</h3>
          </div>
          <span className="text-xs text-gray-600">
            {totalIngredients} ingredient{totalIngredients !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Grains */}
        {grains.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Grain Bill
              </h4>
              <span className="text-xs text-gray-500">{grains.length} grain{grains.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1">
              {grains.map((grain, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-700 font-medium truncate flex-1">{grain.name}</span>
                  <span className="text-gray-600 ml-2 flex-shrink-0">
                    {grain.amount} {grain.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hops */}
        {hops.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Hop Schedule
              </h4>
              <span className="text-xs text-gray-500">{hops.length} hop{hops.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1">
              {hops.map((hop, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-700 font-medium truncate flex-1">
                    {hop.name || hop.Name}
                  </span>
                  <span className="text-gray-600 ml-2 flex-shrink-0">
                    {hop.amount || hop.Amount} {hop.unit || hop.Unit} @ {hop.additionTime || hop.AdditionTime}min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yeasts */}
        {yeasts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Yeast
              </h4>
              <span className="text-xs text-gray-500">{yeasts.length} strain{yeasts.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1">
              {yeasts.map((yeast, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-700 font-medium truncate flex-1">
                    {yeast.name || yeast.Name}
                  </span>
                  <span className="text-gray-600 ml-2 flex-shrink-0">
                    {yeast.amount || yeast.Amount} {yeast.unit || yeast.Unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additives */}
        {additives.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Additives
              </h4>
              <span className="text-xs text-gray-500">{additives.length} additive{additives.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1">
              {additives.map((additive, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-700 font-medium truncate flex-1">
                    {additive.name || additive.Name}
                  </span>
                  <span className="text-gray-600 ml-2 flex-shrink-0">
                    {additive.amount || additive.Amount} {additive.unit || additive.Unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mash Steps */}
        {mashSteps.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Mash Profile
              </h4>
              <span className="text-xs text-gray-500">{mashSteps.length} step{mashSteps.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1">
              {mashSteps.sort((a, b) => (a.order || a.Order || 0) - (b.order || b.Order || 0)).map((step, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-700 font-medium truncate flex-1">
                    {step.name || step.Name}
                  </span>
                  <span className="text-gray-600 ml-2 flex-shrink-0">
                    {step.temperature || step.Temperature}°F • {step.time || step.Time}min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeIngredientsSummary