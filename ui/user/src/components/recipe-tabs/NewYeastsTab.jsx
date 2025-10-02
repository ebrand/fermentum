import React, { useState, useEffect } from 'react';
import IngredientSelector from './IngredientSelector';
import TabHeader from './TabHeader';
import StyledCombobox from '../common/StyledCombobox';
import LotAvailabilityChecker from '../LotAvailabilityChecker';
import api from '../../utils/api';
import { BeakerIcon } from '@heroicons/react/24/outline';

/**
 * Yeasts Tab - Uses camelCase properties from API
 * Displays available yeasts and allows adding them to the recipe
 */
const NewYeastsTab = ({ recipeYeasts = [], onYeastsChange }) => {
  const [availableYeasts, setAvailableYeasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYeasts();
  }, []);

  const loadYeasts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/yeasts');
      // API returns ApiResponse wrapper with data property (camelCase) containing the array
      setAvailableYeasts(response.data?.data || []);
    } catch (error) {
      console.error('Error loading yeasts:', error);
      setAvailableYeasts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddYeast = (yeastData) => {
    // Calculate default attenuation if not provided by user
    let attenuation = parseFloat(yeastData.attenuation);
    if (!attenuation && yeastData.attenuationMin && yeastData.attenuationMax) {
      // Use midpoint of range as default
      attenuation = (yeastData.attenuationMin + yeastData.attenuationMax) / 2;
    } else if (!attenuation && yeastData.attenuationMin) {
      attenuation = yeastData.attenuationMin;
    }

    // Calculate default temperature if not provided by user
    let temperatureMin = parseFloat(yeastData.temperatureMinOverride) || yeastData.temperatureMin;
    let temperatureMax = parseFloat(yeastData.temperatureMaxOverride) || yeastData.temperatureMax;

    const newYeast = {
      yeastId: yeastData.yeastId,
      name: yeastData.name,
      manufacturer: yeastData.manufacturer,
      productId: yeastData.productId,
      type: yeastData.type,
      form: yeastData.form,
      attenuation: attenuation || null,
      flocculation: yeastData.flocculation,
      temperatureMin: temperatureMin || null,
      temperatureMax: temperatureMax || null,
      alcoholTolerance: yeastData.alcoholTolerance,
      amount: parseFloat(yeastData.amount) || 1,
      unit: yeastData.unit || 'pkg',
      manufacturingDate: yeastData.manufacturingDate || null,
      expirationDate: yeastData.expirationDate || null,
      starter: yeastData.starter || false,
      starterSize: yeastData.starter ? parseFloat(yeastData.starterSize) || 0 : 0
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
      return <div className="text-center text-gray-500">Loading yeasts...</div>;
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        {ingredients.map((yeast) => (
          <button
            key={yeast.yeastId}
            onClick={() => onSelect(yeast)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedIngredient?.yeastId === yeast.yeastId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-200 bg-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="font-semibold text-gray-900">{yeast.name}</div>
              <LotAvailabilityChecker
                ingredientId={yeast.yeastId}
                category="yeast"
                amount={0}
                unit="pkg"
                compact={true}
              />
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>{yeast.manufacturer} {yeast.productId}</div>
              <div>Type: {yeast.type}</div>
              <div>
                Attenuation: {yeast.attenuationMin && yeast.attenuationMax
                  ? `${yeast.attenuationMin}-${yeast.attenuationMax}%`
                  : yeast.attenuationMin
                    ? `${yeast.attenuationMin}%`
                    : 'N/A'}
              </div>
              <div>
                Temp: {yeast.temperatureMin && yeast.temperatureMax
                  ? `${yeast.temperatureMin}-${yeast.temperatureMax}°F`
                  : yeast.temperatureMin
                    ? `${yeast.temperatureMin}°F`
                    : 'N/A'}
              </div>
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
          <div className="font-semibold text-gray-900">{selectedIngredient.name}</div>
          <div className="text-xs text-gray-600 mt-1">
            {selectedIngredient.manufacturer} {selectedIngredient.productId} • {selectedIngredient.type}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Attenuation: {selectedIngredient.attenuationMin && selectedIngredient.attenuationMax
              ? `${selectedIngredient.attenuationMin}-${selectedIngredient.attenuationMax}%`
              : selectedIngredient.attenuationMin
                ? `${selectedIngredient.attenuationMin}%`
                : 'N/A'} •
            Temp: {selectedIngredient.temperatureMin && selectedIngredient.temperatureMax
              ? `${selectedIngredient.temperatureMin}-${selectedIngredient.temperatureMax}°F`
              : selectedIngredient.temperatureMin
                ? `${selectedIngredient.temperatureMin}°F`
                : 'N/A'}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={formData.amount || 1}
              onChange={(e) => onChange('amount', e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="1"
            />
            <div className="w-32">
              <StyledCombobox
                options={[
                  { id: 'pkg', name: 'package' },
                  { id: 'vial', name: 'vial' },
                  { id: 'g', name: 'grams' },
                  { id: 'ml', name: 'ml' }
                ]}
                value={{ id: formData.unit || 'pkg', name: formData.unit === 'pkg' ? 'package' : formData.unit === 'g' ? 'grams' : formData.unit || 'package' }}
                onChange={(option) => onChange('unit', option.id)}
                placeholder="Unit"
              />
            </div>
          </div>
        </div>

        {/* Starter */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="starter"
            checked={formData.starter || false}
            onChange={(e) => onChange('starter', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="starter" className="ml-2 block text-sm text-gray-700">
            Use Yeast Starter
          </label>
        </div>

        {/* Starter Size (conditional) */}
        {formData.starter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starter Size (ml)
            </label>
            <input
              type="number"
              step="50"
              value={formData.starterSize || ''}
              onChange={(e) => onChange('starterSize', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="1000"
            />
          </div>
        )}

        {/* Manufacturing Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manufacturing Date (Optional)
          </label>
          <input
            type="date"
            value={formData.manufacturingDate || ''}
            onChange={(e) => onChange('manufacturingDate', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Expiration Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiration Date (Optional)
          </label>
          <input
            type="date"
            value={formData.expirationDate || ''}
            onChange={(e) => onChange('expirationDate', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            rows="2"
            placeholder="e.g., Rehydrate before pitching"
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
          <div className="col-span-3">YEAST STRAIN</div>
          <div className="col-span-2">LAB/ID</div>
          <div className="col-span-2 text-right">AMOUNT</div>
          <div className="col-span-2 text-center">ATTENUATION</div>
          <div className="col-span-2 text-center">STARTER</div>
          <div className="col-span-1 text-center">ACTIONS</div>
        </div>

        {ingredients.map((yeast, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 px-3 py-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="col-span-3 font-medium text-gray-900">{yeast.name}</div>
            <div className="col-span-2 text-gray-700 text-xs">
              {yeast.laboratory} {yeast.productId}
            </div>
            <div className="col-span-2 text-right text-gray-700">
              {yeast.amount} {yeast.unit}
            </div>
            <div className="col-span-2 text-center text-gray-700">
              {yeast.attenuation}%
            </div>
            <div className="col-span-2 text-center">
              {yeast.starter ? (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                  {yeast.starterSize}ml
                </span>
              ) : (
                <span className="text-gray-400">No</span>
              )}
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
        description="Choose your yeast strain for fermentation"
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
        gridTitle="Available Yeasts"
        formTitle="Add Yeast"
        listTitle={`Added Yeasts (${recipeYeasts.length})`}
        emptyMessage="No yeasts added yet. Select a yeast strain from the grid to add it to your recipe."
      />
    </>
  );
};

export default NewYeastsTab;