import React, { useState, useEffect } from 'react';
import IngredientSelector from './IngredientSelector';
import TabHeader from './TabHeader';
import StyledCombobox from '../common/StyledCombobox';
import LotAvailabilityChecker from '../LotAvailabilityChecker';
import LotDetailsPopoverWithData from '../LotDetailsPopoverWithData';
import api from '../../utils/api';
import { BeakerIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Grains Tab - Uses camelCase properties from API
 * Displays available grains and allows adding them to the recipe
 */
const NewGrainsTab = ({ recipeGrains = [], onGrainsChange }) => {
  const [availableGrains, setAvailableGrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lotDetailsOpen, setLotDetailsOpen] = useState(false);
  const [selectedGrainForLots, setSelectedGrainForLots] = useState(null);
  const [lotDetailsAmount, setLotDetailsAmount] = useState(0);
  const [lotDetailsUnit, setLotDetailsUnit] = useState('lbs');

  useEffect(() => {
    loadGrains();
  }, []);

  const loadGrains = async () => {
    try {
      setLoading(true);
      const response = await api.get('/grains');
      // API returns ApiResponse wrapper with data property (camelCase) containing the array
      setAvailableGrains(response.data?.data || []);
    } catch (error) {
      console.error('Error loading grains:', error);
      setAvailableGrains([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrain = (grainData) => {
    const newGrain = {
      grainId: grainData.grainId,
      name: grainData.name,
      type: grainData.type,
      origin: grainData.origin,
      color: grainData.color,
      potential: grainData.potential,
      requiresMashing: grainData.requiresMashing,
      amount: parseFloat(grainData.amount) || 0,
      unit: grainData.unit || 'lbs',
      percentage: parseFloat(grainData.percentage) || 0,
      lovibond: parseFloat(grainData.lovibond) || grainData.color || 0,
      extractPotential: parseFloat(grainData.extractPotential) || grainData.potential || 0,
      mustMash: grainData.mustMash !== undefined ? grainData.mustMash : grainData.requiresMashing,
      sortOrder: grainData.sortOrder || recipeGrains.length + 1
    };

    onGrainsChange([...recipeGrains, newGrain]);
  };

  const handleRemoveGrain = (index) => {
    const updated = recipeGrains.filter((_, i) => i !== index);
    onGrainsChange(updated);
  };

  const handleUpdateGrain = (index, updatedGrain) => {
    const updated = recipeGrains.map((grain, i) => i === index ? updatedGrain : grain);
    onGrainsChange(updated);
  };

  // Render grid of available grains
  const renderGrid = ({ ingredients, selectedIngredient, onSelect }) => {
    if (loading) {
      return <div className="text-center text-gray-500">Loading grains...</div>;
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        {ingredients.map((grain) => (
          <button
            key={grain.grainId}
            onClick={() => onSelect(grain)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedIngredient?.grainId === grain.grainId
                ? 'border-fermentum-500 bg-fermentum-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-200 bg-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="font-semibold text-gray-900">{grain.name}</div>
              <LotAvailabilityChecker
                ingredientId={grain.grainId}
                category="grain"
                amount={0}
                unit="lbs"
                compact={true}
              />
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>{grain.type}</div>
              <div>Origin: {grain.origin || 'Unknown'}</div>
              <div>Color: {grain.color}°L • Potential: {grain.potential}</div>
              {grain.requiresMashing && (
                <div className="text-amber-600 font-medium">Requires Mashing</div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Render form for adding grain to recipe
  const renderForm = ({ selectedIngredient, formData, onChange }) => {
    // Handler to show lot details popover
    const handleShowLotDetails = () => {
      console.log('Showing lot details for:', {
        grain: selectedIngredient,
        amount: formData.amount,
        unit: formData.unit
      });
      setSelectedGrainForLots(selectedIngredient);
      setLotDetailsAmount(formData.amount || 0);
      setLotDetailsUnit(formData.unit || 'lbs');
      setLotDetailsOpen(true);
    };

    return (
      <div className="space-y-3">

        {/* Selected grain display */}
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{selectedIngredient.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {selectedIngredient.type} • Color: {selectedIngredient.color}°L
              </div>
            </div>
            {/* View Lot Details button - always show, popover will fetch data when opened */}
            <button
              type="button"
              onClick={handleShowLotDetails}
              className="ml-2 flex items-center gap-1 px-2 py-1 text-xs font-medium text-fermentum-700 bg-fermentum-50 border border-fermentum-300 rounded hover:bg-fermentum-100 transition-colors"
            >
              <InformationCircleIcon className="w-4 h-4" />
              View Lot Details
            </button>
          </div>

          {/* Inline Lot Availability Status */}
          <div className="border-t border-gray-200 pt-2">
            <LotAvailabilityChecker
              ingredientId={selectedIngredient.grainId}
              category="grain"
              amount={formData.amount || 0}
              unit={formData.unit || 'lbs'}
              compact={false}
              showLabel={true}
              showQuantity={true}
            />
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
              value={formData.amount || ''}
              onChange={(e) => onChange('amount', e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="0.0"
            />
            <div className="w-24">
              <StyledCombobox
                options={[
                  { id: 'lbs', name: 'lbs' },
                  { id: 'oz', name: 'oz' },
                  { id: 'kg', name: 'kg' },
                  { id: 'g', name: 'g' }
                ]}
                value={{ id: formData.unit || 'lbs', name: formData.unit || 'lbs' }}
                onChange={(option) => onChange('unit', option.name)}
                placeholder="Unit"
              />
            </div>
          </div>
        </div>

        {/* Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Percentage of Grain Bill (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.percentage || ''}
            onChange={(e) => onChange('percentage', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="0.0"
          />
        </div>

        {/* Lovibond (Color) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lovibond (Color °L)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.lovibond || selectedIngredient.color || ''}
            onChange={(e) => onChange('lovibond', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder={selectedIngredient.color?.toString() || '0'}
          />
          <p className="mt-1 text-xs text-gray-500">Default from grain: {selectedIngredient.color}°L</p>
        </div>

        {/* Extract Potential */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Extract Potential (PPG)
          </label>
          <input
            type="number"
            step="0.001"
            value={formData.extractPotential || selectedIngredient.potential || ''}
            onChange={(e) => onChange('extractPotential', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder={selectedIngredient.potential?.toString() || '1.000'}
          />
          <p className="mt-1 text-xs text-gray-500">Default from grain: {selectedIngredient.potential}</p>
        </div>

        {/* Must Mash */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="mustMash"
            checked={formData.mustMash !== undefined ? formData.mustMash : selectedIngredient.requiresMashing}
            onChange={(e) => onChange('mustMash', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="mustMash" className="ml-2 block text-sm text-gray-700">
            Requires Mashing
          </label>
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
            placeholder="e.g., Adjust mash pH, steep at 155°F"
          />
        </div>
      
      </div>
    );
  };

  // Render list of added grains
  const renderList = ({ ingredients, onRemove }) => {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
          <div className="col-span-3">GRAIN</div>
          <div className="col-span-2 text-right">COLOR °L</div>
          <div className="col-span-2 text-right">AMOUNT</div>
          <div className="col-span-2 text-center">AVAILABILITY</div>
          <div className="col-span-2 text-center">MASH</div>
          <div className="col-span-1 text-center">ACTIONS</div>
        </div>

        {ingredients.map((grain, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 px-3 py-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="col-span-3 font-medium text-gray-900">{grain.name}</div>
            <div className="col-span-2 text-right text-gray-700">
              {grain.lovibond || grain.color}°L
            </div>
            <div className="col-span-2 text-right text-gray-700">
              {grain.amount} {grain.unit}
            </div>
            <div className="col-span-2 flex justify-center">
              <LotAvailabilityChecker
                ingredientId={grain.grainId}
                category="grain"
                amount={grain.amount}
                unit={grain.unit}
                compact={false}
                showLabel={true}
                showQuantity={false}
              />
            </div>
            <div className="col-span-2 text-center">
              {grain.mustMash ? (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                  Yes
                </span>
              ) : (
                <span className="text-gray-400">No</span>
              )}
            </div>
            <div className="col-span-1 flex justify-center gap-1">
              <button
                onClick={() => onRemove(index)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove grain"
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
        title="Grain Bill"
        description="Select base malts, specialty grains, and adjuncts for your recipe"
        icon={BeakerIcon}
        badge={recipeGrains.length}
      />
      <IngredientSelector
        availableIngredients={availableGrains}
        addedIngredients={recipeGrains}
        renderGrid={renderGrid}
        renderForm={renderForm}
        renderList={renderList}
        onAdd={handleAddGrain}
        onRemove={handleRemoveGrain}
        gridTitle="Available Grains"
        formTitle="Add Grain"
        listTitle={`Added Grains (${recipeGrains.length})`}
        emptyMessage="No grains added yet. Select a grain from the grid to add it to your recipe."
      />

      {/* Lot Details Popover */}
      {selectedGrainForLots && (
        <LotDetailsPopoverWithData
          ingredientId={selectedGrainForLots.grainId}
          ingredientName={selectedGrainForLots.name}
          category="grain"
          amount={lotDetailsAmount}
          unit={lotDetailsUnit}
          isOpen={lotDetailsOpen}
          onClose={() => setLotDetailsOpen(false)}
        />
      )}
    </>
  );
};

export default NewGrainsTab;