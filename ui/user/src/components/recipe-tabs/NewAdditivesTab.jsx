import React, { useState, useEffect } from 'react';
import IngredientSelector from './IngredientSelector';
import TabHeader from './TabHeader';
import StyledCombobox from '../common/StyledCombobox';
import LotAvailabilityChecker from '../LotAvailabilityChecker';
import api from '../../utils/api';
import { BeakerIcon } from '@heroicons/react/24/outline';

/**
 * Additives Tab - Uses camelCase properties from API
 * Displays available brewing additives and allows adding them to the recipe
 */
const NewAdditivesTab = ({ recipeAdditives = [], onAdditivesChange }) => {
  const [availableAdditives, setAvailableAdditives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdditives();
  }, []);

  const loadAdditives = async () => {
    try {
      setLoading(true);
      const response = await api.get('/additives');
      // API returns ApiResponse wrapper with data property (camelCase) containing the array
      setAvailableAdditives(response.data?.data || []);
    } catch (error) {
      console.error('Error loading additives:', error);
      setAvailableAdditives([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdditive = (additiveData) => {
    const newAdditive = {
      additiveId: additiveData.additiveId,
      name: additiveData.name,
      category: additiveData.category,
      type: additiveData.type,
      purpose: additiveData.purpose,
      dosageMin: additiveData.dosageMin,
      dosageMax: additiveData.dosageMax,
      dosageUnit: additiveData.dosageUnit,
      amount: parseFloat(additiveData.amount) || 0,
      unit: additiveData.unit || additiveData.dosageUnit || 'g',
      additionTime: parseInt(additiveData.additionTime) || null,
      additionStage: additiveData.additionStage || 'Boil',
      targetParameter: additiveData.targetParameter || null,
      targetValue: parseFloat(additiveData.targetValue) || null,
      sortOrder: additiveData.sortOrder || recipeAdditives.length + 1
    };

    onAdditivesChange([...recipeAdditives, newAdditive]);
  };

  const handleRemoveAdditive = (index) => {
    const updated = recipeAdditives.filter((_, i) => i !== index);
    onAdditivesChange(updated);
  };

  const handleUpdateAdditive = (index, updatedAdditive) => {
    const updated = recipeAdditives.map((additive, i) => i === index ? updatedAdditive : additive);
    onAdditivesChange(updated);
  };

  // Render grid of available additives
  const renderGrid = ({ ingredients, selectedIngredient, onSelect }) => {
    if (loading) {
      return <div className="text-center text-gray-500">Loading additives...</div>;
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {ingredients.map((additive) => (
          <button
            key={additive.additiveId}
            onClick={() => onSelect(additive)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedIngredient?.additiveId === additive.additiveId
                ? 'border-fermentum-500 bg-fermentum-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-200 bg-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="font-semibold text-gray-900">{additive.name}</div>
              <LotAvailabilityChecker
                ingredientId={additive.additiveId}
                category="additive"
                amount={0}
                unit="g"
                compact={true}
              />
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  {additive.category}
                </span>
                {additive.type && (
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {additive.type}
                  </span>
                )}
              </div>
              {additive.purpose && (
                <div>Purpose: {additive.purpose}</div>
              )}
              {additive.dosageMin && additive.dosageMax && (
                <div>
                  Dosage: {additive.dosageMin}-{additive.dosageMax} {additive.dosageUnit}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Render form for adding additive to recipe
  const renderForm = ({ selectedIngredient, formData, onChange }) => {
    return (
      <div className="space-y-3">
        {/* Selected additive display */}
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="font-semibold text-gray-900">{selectedIngredient.name}</div>
          <div className="text-xs text-gray-600 mt-1">
            {selectedIngredient.category} • {selectedIngredient.type}
          </div>
          {selectedIngredient.purpose && (
            <div className="text-xs text-gray-600 mt-1">
              Purpose: {selectedIngredient.purpose}
            </div>
          )}
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
            <div className="w-32">
              <StyledCombobox
                options={[
                  { id: 'g', name: 'g' },
                  { id: 'kg', name: 'kg' },
                  { id: 'oz', name: 'oz' },
                  { id: 'lbs', name: 'lbs' },
                  { id: 'ml', name: 'ml' },
                  { id: 'L', name: 'L' },
                  { id: 'tsp', name: 'tsp' },
                  { id: 'tbsp', name: 'tbsp' },
                  { id: 'tablet', name: 'tablet' },
                  { id: 'pkg', name: 'pkg' }
                ]}
                value={{ id: formData.unit || selectedIngredient.dosageUnit || 'g', name: formData.unit || selectedIngredient.dosageUnit || 'g' }}
                onChange={(option) => onChange('unit', option.name)}
                placeholder="Unit"
              />
            </div>
          </div>
          {selectedIngredient.dosageMin && selectedIngredient.dosageMax && (
            <p className="mt-1 text-xs text-gray-500">
              Recommended: {selectedIngredient.dosageMin}-{selectedIngredient.dosageMax} {selectedIngredient.dosageUnit}
            </p>
          )}
        </div>

        {/* Addition Stage */}
        <div>
          <StyledCombobox
            label="Addition Stage"
            options={[
              { id: 'Mash', name: 'Mash' },
              { id: 'Boil', name: 'Boil' },
              { id: 'Whirlpool', name: 'Whirlpool' },
              { id: 'Primary', name: 'Primary Fermentation' },
              { id: 'Secondary', name: 'Secondary Fermentation' },
              { id: 'Packaging', name: 'Packaging' }
            ]}
            value={{ id: formData.additionStage || 'Boil', name: formData.additionStage === 'Primary' ? 'Primary Fermentation' : formData.additionStage === 'Secondary' ? 'Secondary Fermentation' : formData.additionStage || 'Boil' }}
            onChange={(option) => onChange('additionStage', option.id)}
            placeholder="Select stage"
          />
        </div>

        {/* Addition Time (for time-sensitive stages) */}
        {(formData.additionStage === 'Boil' || formData.additionStage === 'Whirlpool' || formData.additionStage === 'Mash') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time (minutes)
            </label>
            <input
              type="number"
              value={formData.additionTime || ''}
              onChange={(e) => onChange('additionTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 60"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.additionStage === 'Boil' ? 'Minutes before end of boil' :
               formData.additionStage === 'Mash' ? 'Duration in mash' : 'Whirlpool time'}
            </p>
          </div>
        )}

        {/* Target Parameter (for water chemistry) */}
        {selectedIngredient.category === 'Water Treatment' && (
          <>
            <div>
              <StyledCombobox
                label="Target Parameter"
                options={[
                  { id: '', name: 'None' },
                  { id: 'pH', name: 'pH' },
                  { id: 'Calcium', name: 'Calcium (Ca)' },
                  { id: 'Magnesium', name: 'Magnesium (Mg)' },
                  { id: 'Sulfate', name: 'Sulfate (SO4)' },
                  { id: 'Chloride', name: 'Chloride (Cl)' },
                  { id: 'Bicarbonate', name: 'Bicarbonate (HCO3)' },
                  { id: 'Sodium', name: 'Sodium (Na)' }
                ]}
                value={{ id: formData.targetParameter || '', name: formData.targetParameter ? `${formData.targetParameter}${formData.targetParameter === 'pH' ? '' : formData.targetParameter === 'Calcium' ? ' (Ca)' : formData.targetParameter === 'Magnesium' ? ' (Mg)' : formData.targetParameter === 'Sulfate' ? ' (SO4)' : formData.targetParameter === 'Chloride' ? ' (Cl)' : formData.targetParameter === 'Bicarbonate' ? ' (HCO3)' : formData.targetParameter === 'Sodium' ? ' (Na)' : ''}` : 'None' }}
                onChange={(option) => onChange('targetParameter', option.id)}
                placeholder="Select parameter"
              />
            </div>

            {formData.targetParameter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.targetValue || ''}
                  onChange={(e) => onChange('targetValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={formData.targetParameter === 'pH' ? '5.4' : '0'}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.targetParameter === 'pH' ? 'Target pH level' : `Target ${formData.targetParameter} (ppm)`}
                </p>
              </div>
            )}
          </>
        )}

        {/* Safety Notes Display */}
        {selectedIngredient.safetyNotes && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-yellow-800">
                <div className="font-medium mb-1">Safety Notes:</div>
                <div>{selectedIngredient.safetyNotes}</div>
              </div>
            </div>
          </div>
        )}

        {/* Notes (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="e.g., Add slowly to avoid precipitation"
          />
        </div>
      </div>
    );
  };

  // Render list of added additives
  const renderList = ({ ingredients, onRemove }) => {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
          <div className="col-span-3">ADDITIVE</div>
          <div className="col-span-2 text-center">CATEGORY</div>
          <div className="col-span-2 text-right">AMOUNT</div>
          <div className="col-span-2 text-center">STAGE</div>
          <div className="col-span-2 text-center">TIME</div>
          <div className="col-span-1 text-center">ACTIONS</div>
        </div>

        {ingredients.map((additive, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 px-3 py-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="col-span-3 font-medium text-gray-900">{additive.name}</div>
            <div className="col-span-2 text-center">
              <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                {additive.category}
              </span>
            </div>
            <div className="col-span-2 text-right text-gray-700">
              {additive.amount} {additive.unit}
            </div>
            <div className="col-span-2 text-center">
              <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {additive.additionStage}
              </span>
            </div>
            <div className="col-span-2 text-center text-gray-700">
              {additive.additionTime ? `${additive.additionTime} min` : '-'}
            </div>
            <div className="col-span-1 flex justify-center gap-1">
              <button
                onClick={() => onRemove(index)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove additive"
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
        title="Additives & Adjuncts"
        description="Add water treatments, clarifiers, nutrients, and other brewing additives"
        icon={BeakerIcon}
        badge={recipeAdditives.length}
      />
      <IngredientSelector
        availableIngredients={availableAdditives}
        addedIngredients={recipeAdditives}
        renderGrid={renderGrid}
        renderForm={renderForm}
        renderList={renderList}
        onAdd={handleAddAdditive}
        onRemove={handleRemoveAdditive}
        gridTitle="Available Additives"
        formTitle="Add Additive"
        listTitle={`Added Additives (${recipeAdditives.length})`}
        emptyMessage="No additives added yet. Select an additive from the grid to add it to your recipe."
      />
    </>
  );
};

export default NewAdditivesTab;