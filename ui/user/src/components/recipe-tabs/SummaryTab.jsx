import React from 'react'
import { PrinterIcon, ShareIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

export default function SummaryTab({ modalData, onShowToast }) {
  const {
    name = 'Untitled Recipe',
    description,
    batchSize = 5,
    batchSizeUnit = 'gallons',
    boilTime = 60,
    efficiency = 75,
    estimatedOG,
    estimatedFG,
    estimatedABV,
    estimatedIBU,
    estimatedSRM,
    grains = [],
    hops = [],
    yeasts = [],
    additives = [],
    mashSteps = []
  } = modalData

  // Calculate recipe statistics
  const totalGrainWeight = grains.reduce((total, grain) => {
    const amount = grain.unit === 'lb' ? grain.amount : grain.amount / 16
    return total + amount
  }, 0)

  const totalHops = hops.reduce((total, hop) => {
    const amount = hop.unit === 'oz' ? hop.amount : hop.amount * 0.035274
    return total + amount
  }, 0)

  const mashDuration = mashSteps.reduce((total, step) => total + (step.duration || 0), 0)

  // Calculate brewing timeline
  const brewingSteps = [
    { name: 'Mash', duration: mashDuration || 60, description: 'Convert starches to sugars' },
    { name: 'Lautering', duration: 30, description: 'Separate wort from grain' },
    { name: 'Boil', duration: boilTime, description: 'Sterilize and add hops' },
    { name: 'Cool', duration: 30, description: 'Cool to pitching temperature' },
    { name: 'Fermentation', duration: 10080, description: 'Primary fermentation (7 days)' },
    { name: 'Conditioning', duration: 10080, description: 'Secondary/conditioning (7 days)' }
  ]

  const totalBrewTime = brewingSteps.reduce((total, step) => total + step.duration, 0)
  const brewDayTime = brewingSteps.slice(0, 4).reduce((total, step) => total + step.duration, 0)

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`
    if (minutes < 1440) return `${Math.round(minutes / 60)} hrs`
    return `${Math.round(minutes / 1440)} days`
  }

  const copyToClipboard = async () => {
    const recipeText = generateRecipeText()
    try {
      await navigator.clipboard.writeText(recipeText)
      if (onShowToast) {
        onShowToast('Recipe copied to clipboard!', 'success')
      }
    } catch (err) {
      console.error('Failed to copy recipe:', err)
      if (onShowToast) {
        onShowToast('Failed to copy recipe to clipboard', 'error')
      }
    }
  }

  const generateRecipeText = () => {
    let text = `${name}\n${'='.repeat(name.length)}\n\n`

    if (description) {
      text += `${description}\n\n`
    }

    text += `RECIPE SPECIFICATIONS\n`
    text += `Batch Size: ${batchSize} ${batchSizeUnit}\n`
    text += `Boil Time: ${boilTime} minutes\n`
    text += `Efficiency: ${efficiency}%\n\n`

    text += `ESTIMATED STATISTICS\n`
    text += `Original Gravity: ${estimatedOG || 'TBD'}\n`
    text += `Final Gravity: ${estimatedFG || 'TBD'}\n`
    text += `ABV: ${estimatedABV || 'TBD'}%\n`
    text += `IBU: ${estimatedIBU || 'TBD'}\n`
    text += `SRM: ${estimatedSRM || 'TBD'}\n\n`

    if (grains.length > 0) {
      text += `GRAIN BILL\n`
      grains.forEach(grain => {
        text += `${grain.amount} ${grain.unit} ${grain.name} (${grain.type})\n`
      })
      text += `Total: ${totalGrainWeight.toFixed(2)} lbs\n\n`
    }

    if (hops.length > 0) {
      text += `HOP SCHEDULE\n`
      hops.forEach(hop => {
        text += `${hop.amount} ${hop.unit} ${hop.name} (${hop.alphaAcid}% AA) @ ${hop.additionTime} min - ${hop.additionType}\n`
      })
      text += `Total: ${totalHops.toFixed(2)} oz\n\n`
    }

    if (yeasts.length > 0) {
      text += `YEAST\n`
      yeasts.forEach(yeast => {
        text += `${yeast.amount} ${yeast.unit} ${yeast.name} (${yeast.attenuation}% attenuation)\n`
      })
      text += `\n`
    }

    if (mashSteps.length > 0) {
      text += `MASH SCHEDULE\n`
      mashSteps.sort((a, b) => a.stepNumber - b.stepNumber).forEach((step, index) => {
        text += `${index + 1}. ${step.stepName}: ${step.temperature}°F for ${step.duration} minutes\n`
      })
      text += `\n`
    }

    if (additives.length > 0) {
      text += `ADDITIVES\n`
      additives.forEach(additive => {
        text += `${additive.amount} ${additive.unit} ${additive.name} @ ${additive.time}\n`
      })
      text += `\n`
    }

    text += `BREWING TIMELINE\n`
    brewingSteps.forEach(step => {
      text += `${step.name}: ${formatDuration(step.duration)} - ${step.description}\n`
    })
    text += `Total Time: ${formatDuration(totalBrewTime)}\n`
    text += `Brew Day: ${formatDuration(brewDayTime)}\n`

    return text
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Recipe Summary</h3>
          <p className="text-sm text-gray-600">Complete overview of your recipe</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Copy
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Recipe Header */}
      <div className="bg-fermentum-50 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{name}</h1>
        {description && (
          <p className="text-gray-700 mb-4">{description}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-fermentum-800">{batchSize}</div>
            <div className="text-sm text-gray-600">{batchSizeUnit}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-fermentum-800">{estimatedABV || '5.0'}%</div>
            <div className="text-sm text-gray-600">ABV</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-fermentum-800">{estimatedIBU || '25'}</div>
            <div className="text-sm text-gray-600">IBU</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-fermentum-800">{estimatedOG || '1.050'}</div>
            <div className="text-sm text-gray-600">OG</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-fermentum-800">{estimatedSRM || '8'}</div>
            <div className="text-sm text-gray-600">SRM</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients Summary */}
        <div className="space-y-4">
          {/* Grain Bill */}
          {grains.length > 0 && (
            <div>
              <div className="rounded-t-xl bg-gray-100 p-3 border border-gray-200 border-b-0">
                <h4 className="text-lg font-medium text-gray-900">Grain Bill ({totalGrainWeight.toFixed(2)} lbs)</h4>
              </div>
              <div className="rounded-b-xl pt-3 p-3 border border-gray-200 border-t-0">
                {grains.map((grain, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{grain.name}</div>
                      <div className="text-xs text-gray-500">{grain.type}</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {grain.amount} {grain.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hop Schedule */}
          {hops.length > 0 && (
            <div>
              <div className="rounded-t-xl bg-gray-100 p-3 border border-gray-200 border-b-0">
                <h4 className="text-lg font-medium text-gray-900">Hop Schedule ({totalHops.toFixed(2)} oz)</h4>
              </div>
              <div className="rounded-b-xl pt-3 p-3 border border-gray-200 border-t-0">
                {hops.map((hop, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{hop.name}</div>
                      <div className="text-xs text-gray-500">{hop.alphaAcid}% AA • {hop.additionType}</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {hop.amount} {hop.unit} @ {hop.additionTime} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yeast */}
          {yeasts.length > 0 && (
            <div>
              <div className="rounded-t-xl bg-gray-100 p-3 border border-gray-200 border-b-0">
                <h4 className="text-lg font-medium text-gray-900">Yeast</h4>
              </div>
              <div className="rounded-b-xl pt-3 p-3 border border-gray-200 border-t-0">
                {yeasts.map((yeast, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{yeast.name}</div>
                      <div className="text-xs text-gray-500">
                        {yeast.type} • {yeast.attenuation}% attenuation
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {yeast.amount} {yeast.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Process Summary */}
        <div className="space-y-4">
          {/* Mash Schedule */}
          {mashSteps.length > 0 && (
            <div>
              <div className="rounded-t-xl bg-gray-100 p-3 border border-gray-200 border-b-0">
                <h4 className="text-lg font-medium text-gray-900">Mash Schedule ({formatDuration(mashDuration)})</h4>
              </div>
              <div className="rounded-b-xl pt-3 p-3 border border-gray-200 border-t-0">
                {mashSteps.sort((a, b) => a.stepNumber - b.stepNumber).map((step, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{step.stepName}</div>
                      <div className="text-xs text-gray-500">{step.stepType}</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {step.temperature}°F for {step.duration} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additives */}
          {additives.length > 0 && (
            <div>
              <div className="rounded-t-xl bg-gray-100 p-3 border border-gray-200 border-b-0">
                <h4 className="text-lg font-medium text-gray-900">Additives</h4>
              </div>
              <div className="rounded-b-xl pt-3 p-3 border border-gray-200 border-t-0">
                {additives.map((additive, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{additive.name}</div>
                        <div className="text-xs text-gray-500">{additive.category}</div>
                      </div>
                      <div className="text-sm text-gray-700">
                        {additive.amount} {additive.unit} @ {additive.time}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Brewing Timeline */}
          <div>
            <div className="rounded-t-xl bg-gray-100 p-3 border border-gray-200 border-b-0">
              <h4 className="text-lg font-medium text-gray-900">Brewing Timeline</h4>
            </div>
            <div className="rounded-b-xl pt-3 p-3 border border-gray-200 border-t-0">
              {brewingSteps.map((step, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{step.name}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {formatDuration(step.duration)}
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                <span className="font-medium">Brew Day:</span>
                <span>{formatDuration(brewDayTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Time:</span>
                <span>{formatDuration(totalBrewTime)}</span>
              </div>
            </div>
          </div>

          

        </div>
      </div>
      
      

      {/* Recipe Notes */}
      <div>
        <div className="rounded-t-xl bg-gray-100 p-3 border border-gray-200 border-b-0">
          <h4 className="text-lg font-medium text-gray-900">Brewing Notes</h4>
        </div>
        <div className="rounded-b-xl pt-3 p-3 border border-gray-200 border-t-0">
          <p>• Efficiency is calculated at {efficiency}% for all grain calculations</p>
          <p>• Boil time is set to {boilTime} minutes</p>
          <p>• All hop additions are calculated using the Tinseth formula for IBU</p>
          {yeasts[0] && (
            <p>• Final gravity and ABV estimated using {yeasts[0].attenuation}% attenuation</p>
          )}
          <p>• Water chemistry and pH adjustments may be needed based on your local water profile</p>
          <p>• Fermentation temperature should be maintained according to yeast specifications</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bg-fermentum-50 { background: #f8f9fa !important; }
        }
      `}</style>
    </div>
  )
}