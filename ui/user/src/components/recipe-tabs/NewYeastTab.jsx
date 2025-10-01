import React, { useState, useEffect } from 'react';
import IngredientSelector from './IngredientSelector';
import TabHeader from './TabHeader';
import api from '../../utils/api';
import { BeakerIcon } from '@heroicons/react/24/outline';

/**
 * Yeast Tab - Uses TitleCase properties from API
 * Displays available yeast strains and allows adding them to the recipe
 */
const NewYeastTab = ({ recipeYeasts = [], onYeastsChange }) => {
  const [availableYeasts, setAvailableYeasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYeasts();
  }, []);

  const loadYeasts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/yeasts');
      // API returns ApiResponse wrapper with Data property containing the array
      setAvailableYeasts(response.data?.Data || []);
    } catch (error) {
      console.error('Error loading yeasts:', error);
      setAvailableYeasts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddYeast = (yeastData) => {
    const newYeast = {
      YeastId: yeastData.YeastId,
      Name: yeastData.Name,
      Manufacturer: yeastData.Manufacturer,
      ProductId: yeastData.ProductId,
      Type: yeastData.Type,
      Form: yeastData.Form,
      AttenuationMin: yeastData.AttenuationMin,
      AttenuationMax: yeastData.AttenuationMax,
      TemperatureMin: yeastData.TemperatureMin,
      TemperatureMax: yeastData.TemperatureMax,
      AlcoholTolerance: yeastData.AlcoholTolerance,
      Flocculation: yeastData.Flocculation,
      Amount: parseFloat(yeastData.Amount) || 1,
      Unit: yeastData.Unit || 'pkg',
      AdditionStage: yeastData.AdditionStage || 'Primary',
      StarterSize: parseFloat(yeastData.StarterSize) || null,
      StarterGravity: parseFloat(yeastData.StarterGravity) || null,
      PitchRate: parseFloat(yeastData.PitchRate) || yeastData.PitchRate || null,
      TargetCellCount: parseFloat(yeastData.TargetCellCount) || null,
      SortOrder: yeastData.SortOrder || recipeYeasts.length + 1
    };

    onYeastsChange([...recipeYeasts, newYeast]);
  };

  const handleRemoveYeast = (index) => {
    const updated = recipeYeasts.filter((_, i) => i !== index);
    onYeastsChange(updated);
  };

  const handleUpdateYeast = (index, updatedYeast) => {
    const updated = recipeYeasts.map((yeast, i) => i === index ? updatedYeast : yeast);
    onYeastsChange(updated);
  };

  // Render grid of available yeasts
  const renderGrid = ({ ingredients, selectedIngredient, onSelect }) => {
    if (loading) {
      return <div className="text-center text-gray-500">Loading yeast strains...</div>;
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {ingredients.map((yeast) => (
          <button
            key={yeast.YeastId}
            onClick={() => onSelect(yeast)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedIngredient?.YeastId === yeast.YeastId
                ? 'border-fermentum-500 bg-fermentum-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-200 bg-gray-100'
            }`}
          >
            <div className="font-semibold text-gray-900 mb-1">{yeast.Name}</div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>{yeast.Manufacturer || 'Unknown'} • {yeast.Type}</div>
              <div>Form: {yeast.Form}</div>
              <div>
                Attenuation: {yeast.AttenuationMin}-{yeast.AttenuationMax}%
              </div>
              <div>
                Temp: {yeast.TemperatureMin}-{yeast.TemperatureMax}°F
              </div>
              {yeast.Flocculation && (
                <div>Flocculation: {yeast.Flocculation}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Render form for adding yeast to recipe
  const renderForm = ({ selectedIngredient, formData, onChange }) => {
    return (
      <div className="space-y-3">
        {/* Selected yeast display */}
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="font-semibold text-gray-900">{selectedIngredient.Name}</div>
          <div className="text-xs text-gray-600 mt-1">
            {selectedIngredient.Manufacturer} • {selectedIngredient.Type}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={formData.Amount || ''}
              onChange={(e) => onChange('Amount', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
            />
            <select
              value={formData.Unit || 'pkg'}
              onChange={(e) => onChange('Unit', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pkg">pkg</option>
              <option value="vial">vial</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="oz">oz</option>
            </select>
          </div>
        </div>

        {/* Addition Stage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Addition Stage
          </label>
          <select
            value={formData.AdditionStage || 'Primary'}
            onChange={(e) => onChange('AdditionStage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Primary">Primary Fermentation</option>
            <option value="Secondary">Secondary Fermentation</option>
            <option value="Bottle">Bottle Conditioning</option>
          </select>
        </div>

        {/* Starter Information */}
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
            Yeast Starter (Optional)
          </h4>

          {/* Starter Size */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starter Size (L)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.StarterSize || ''}
              onChange={(e) => onChange('StarterSize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1.5"
            />
          </div>

          {/* Starter Gravity */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starter Gravity (SG)
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.StarterGravity || ''}
              onChange={(e) => onChange('StarterGravity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1.040"
            />
          </div>

          {/* Pitch Rate */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pitch Rate (M cells/mL/°P)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.PitchRate || selectedIngredient.PitchRate || ''}
              onChange={(e) => onChange('PitchRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={selectedIngredient.PitchRate?.toString() || 'e.g., 0.75'}
            />
            <p className="mt-1 text-xs text-gray-500">
              Ale: 0.75, Lager: 1.5, High Gravity: 2.0
            </p>
          </div>

          {/* Target Cell Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Cell Count (Billion)
            </label>
            <input
              type="number"
              step="1"
              value={formData.TargetCellCount || ''}
              onChange={(e) => onChange('TargetCellCount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 200"
            />
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.Notes || ''}
            onChange={(e) => onChange('Notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="e.g., Use oxygen-free wort transfer, maintain 68°F"
          />
        </div>
      </div>
    );
  };

  // Render list of added yeasts
  const renderList = ({ ingredients, onRemove }) => {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
          <div className="col-span-4">YEAST STRAIN</div>
          <div className="col-span-2 text-center">ATTEN %</div>
          <div className="col-span-2 text-right">AMOUNT</div>
          <div className="col-span-3 text-center">STAGE</div>
          <div className="col-span-1 text-center">ACTIONS</div>
        </div>

        {ingredients.map((yeast, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 px-3 py-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="col-span-4">
              <div className="font-medium text-gray-900">{yeast.Name}</div>
              <div className="text-xs text-gray-600">
                {yeast.Manufacturer} • {yeast.Type}
              </div>
            </div>
            <div className="col-span-2 text-center text-gray-700">
              {yeast.AttenuationMin}-{yeast.AttenuationMax}%
            </div>
            <div className="col-span-2 text-right text-gray-700">
              {yeast.Amount} {yeast.Unit}
            </div>
            <div className="col-span-3 text-center">
              <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {yeast.AdditionStage || 'Primary'}
              </span>
            </div>
            <div className="col-span-1 flex justify-center gap-1">
              <button
                onClick={() => onRemove(index)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove yeast"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <TabHeader
        title="Yeast Selection"
        description="Choose your yeast strain(s) and fermentation profile"
        icon={BeakerIcon}
        badge={recipeYeasts.length}
      />
      <IngredientSelector
        availableIngredients={availableYeasts}
        addedIngredients={recipeYeasts}
        renderGrid={renderGrid}
        renderForm={renderForm}
        renderList={renderList}
        onAdd={handleAddYeast}
        onRemove={handleRemoveYeast}
        gridTitle="Available Yeast Strains"
        formTitle="Add Yeast"
        listTitle={`Added Yeasts (${recipeYeasts.length})`}
        emptyMessage="No yeast added yet. Select a yeast strain from the grid to add it to your recipe."
      />
    </>
  );
};

export default NewYeastTab;