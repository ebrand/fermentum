import React, { useState, useEffect } from 'react';
import IngredientSelector from './IngredientSelector';
import TabHeader from './TabHeader';
import StyledCombobox from '../common/StyledCombobox';
import LotAvailabilityChecker from '../LotAvailabilityChecker';
import api from '../../utils/api';
import { BeakerIcon } from '@heroicons/react/24/outline';

/**
 * Hops Tab - Uses camelCase properties from API
 * Displays available hops and allows adding them to the recipe
 */
const NewHopsTab = ({ recipeHops = [], onHopsChange }) => {
  const [availableHops, setAvailableHops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHops();
  }, []);

  const loadHops = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hops');
      // API returns ApiResponse wrapper with data property (camelCase) containing the array
      setAvailableHops(response.data?.data || []);
    } catch (error) {
      console.error('Error loading hops:', error);
      setAvailableHops([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddHop = (hopData) => {
    // Calculate default alpha acid if not provided by user
    let alphaAcid = parseFloat(hopData.alphaAcid);
    if (!alphaAcid && hopData.alphaAcidMin && hopData.alphaAcidMax) {
      // Use midpoint of range as default
      alphaAcid = (hopData.alphaAcidMin + hopData.alphaAcidMax) / 2;
    } else if (!alphaAcid && hopData.alphaAcidMin) {
      // Use min if max not available
      alphaAcid = hopData.alphaAcidMin;
    }

    const newHop = {
      hopId: hopData.hopId,
      name: hopData.name,
      type: hopData.type,
      origin: hopData.origin,
      alphaAcid: alphaAcid || null,
      amount: parseFloat(hopData.amount) || 0,
      unit: hopData.unit || 'oz',
      additionTime: parseInt(hopData.additionTime) || 60,
      additionType: hopData.additionType || 'Boil',
      purpose: hopData.purpose || 'Bittering',
      form: hopData.form || 'Pellet'
    };

    onHopsChange([...recipeHops, newHop]);
  };

  const handleRemoveHop = (index) => {
    const updated = recipeHops.filter((_, i) => i !== index);
    onHopsChange(updated);
  };

  const handleUpdateHop = (index, updatedHop) => {
    const updated = recipeHops.map((hop, i) => i === index ? updatedHop : hop);
    onHopsChange(updated);
  };

  // Render grid of available hops
  const renderGrid = ({ ingredients, selectedIngredient, onSelect }) => {
    if (loading) {
      return <div className="text-center text-gray-500">Loading hops...</div>;
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        {ingredients.map((hop) => (
          <button
            key={hop.hopId}
            onClick={() => onSelect(hop)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedIngredient?.hopId === hop.hopId
                ? 'border-fermentum-500 bg-fermentum-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-200 bg-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="font-semibold text-gray-900">{hop.name}</div>
              <LotAvailabilityChecker
                ingredientId={hop.hopId}
                category="hop"
                amount={0}
                unit="oz"
                compact={true}
              />
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>{hop.type}</div>
              <div>Origin: {hop.origin || 'Unknown'}</div>
              <div>
                Alpha: {hop.alphaAcidMin && hop.alphaAcidMax
                  ? `${hop.alphaAcidMin}-${hop.alphaAcidMax}%`
                  : hop.alphaAcidMin
                    ? `${hop.alphaAcidMin}%`
                    : 'N/A'}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Render form for adding hop to recipe
  const renderForm = ({ selectedIngredient, formData, onChange }) => {
    return (
      <div className="space-y-3">
        {/* Selected hop display */}
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="font-semibold text-gray-900">{selectedIngredient.name}</div>
          <div className="text-xs text-gray-600 mt-1">
            {selectedIngredient.type} • Alpha: {selectedIngredient.alphaAcidMin && selectedIngredient.alphaAcidMax
              ? `${selectedIngredient.alphaAcidMin}-${selectedIngredient.alphaAcidMax}%`
              : selectedIngredient.alphaAcidMin
                ? `${selectedIngredient.alphaAcidMin}%`
                : 'N/A'}
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
              value={formData.amount || ''}
              onChange={(e) => onChange('amount', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.0"
            />
            <div className="w-24">
              <StyledCombobox
                options={[
                  { id: 'oz', name: 'oz' },
                  { id: 'g', name: 'g' },
                  { id: 'kg', name: 'kg' }
                ]}
                value={{ id: formData.unit || 'oz', name: formData.unit || 'oz' }}
                onChange={(option) => onChange('unit', option.name)}
                placeholder="Unit"
              />
            </div>
          </div>
        </div>

        {/* Addition Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time
          </label>
          <input
            type="number"
            value={formData.additionTime || 60}
            onChange={(e) => onChange('additionTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="60 min"
          />
        </div>

        {/* Form */}
        <div>
          <StyledCombobox
            label="Form"
            options={[
              { id: 'Pellet', name: 'Pellet' },
              { id: 'Whole', name: 'Whole' },
              { id: 'Plug', name: 'Plug' }
            ]}
            value={{ id: formData.form || 'Pellet', name: formData.form || 'Pellet' }}
            onChange={(option) => onChange('form', option.name)}
            placeholder="Select form"
          />
        </div>

        {/* Alpha Acid % */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alpha Acid %
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.alphaAcid || ''}
            onChange={(e) => onChange('alphaAcid', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={selectedIngredient.alphaAcidMin && selectedIngredient.alphaAcidMax
              ? `Typical range: ${selectedIngredient.alphaAcidMin}-${selectedIngredient.alphaAcidMax}%`
              : selectedIngredient.alphaAcidMin
                ? `Typical: ${selectedIngredient.alphaAcidMin}%`
                : 'Enter alpha acid %'}
          />
          {selectedIngredient.alphaAcidMin && selectedIngredient.alphaAcidMax && (
            <p className="mt-1 text-xs text-gray-500">
              Typical range: {selectedIngredient.alphaAcidMin}-{selectedIngredient.alphaAcidMax}%
            </p>
          )}
        </div>

        {/* Use/Purpose */}
        <div>
          <StyledCombobox
            label="Use"
            options={[
              { id: 'Bittering', name: 'Bittering' },
              { id: 'Flavor', name: 'Flavor' },
              { id: 'Aroma', name: 'Aroma' },
              { id: 'Dual Purpose', name: 'Dual Purpose' }
            ]}
            value={{ id: formData.purpose || 'Bittering', name: formData.purpose || 'Bittering' }}
            onChange={(option) => onChange('purpose', option.name)}
            placeholder="Select use"
          />
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="e.g., Citrusy aroma with grapefruit notes"
          />
        </div>
      </div>
    );
  };

  // Render list of added hops
  const renderList = ({ ingredients, onRemove }) => {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
          <div className="col-span-3">HOP VARIETY</div>
          <div className="col-span-2 text-right">A-ACID %</div>
          <div className="col-span-2 text-right">AMOUNT</div>
          <div className="col-span-2 text-center">TIME</div>
          <div className="col-span-2">FORM</div>
          <div className="col-span-1 text-center">ACTIONS</div>
        </div>

        {ingredients.map((hop, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 px-3 py-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="col-span-3 font-medium text-gray-900">{hop.name}</div>
            <div className="col-span-2 text-right text-gray-700">{hop.alphaAcid}%</div>
            <div className="col-span-2 text-right text-gray-700">
              {hop.amount} {hop.unit}
            </div>
            <div className="col-span-2 text-center text-gray-700">{hop.additionTime} min</div>
            <div className="col-span-2 text-gray-700">{hop.form}</div>
            <div className="col-span-1 flex justify-center gap-1">
              <button
                onClick={() => onRemove(index)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove hop"
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
        title="Hop Schedule"
        description="Build your hop profile for bittering, flavor, and aroma"
        icon={BeakerIcon}
        badge={recipeHops.length}
      />
      <IngredientSelector
        availableIngredients={availableHops}
        addedIngredients={recipeHops}
        renderGrid={renderGrid}
        renderForm={renderForm}
        renderList={renderList}
        onAdd={handleAddHop}
        onRemove={handleRemoveHop}
        gridTitle="Available Hops"
        formTitle="Add Hop"
        listTitle={`Added Hops (${recipeHops.length})`}
        emptyMessage="No hops added yet. Select a hop variety from the grid to add it to your recipe."
      />
    </>
  );
};

export default NewHopsTab;