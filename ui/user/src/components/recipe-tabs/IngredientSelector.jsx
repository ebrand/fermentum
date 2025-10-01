import React, { useState } from 'react';

/**
 * Base component for ingredient selection with three sections:
 * 1. Grid of available ingredients (left/top)
 * 2. Form to add selected ingredient (right-top)
 * 3. List of added ingredients (right-bottom)
 *
 * This component provides the layout structure and state management,
 * while child components handle the specific rendering.
 */
const IngredientSelector = ({
  // Data
  availableIngredients = [],
  addedIngredients = [],

  // Child render functions
  renderGrid,
  renderForm,
  renderList,

  // Callbacks
  onAdd,
  onUpdate,
  onRemove,

  // Configuration
  emptyMessage = "No ingredients added yet.",
  gridTitle = "Available Ingredients",
  formTitle = "Add Ingredient",
  listTitle = "Added Ingredients"
}) => {
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [formData, setFormData] = useState({});

  const handleSelect = (ingredient) => {
    setSelectedIngredient(ingredient);
    setFormData({});
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!selectedIngredient) return;

    const ingredientToAdd = {
      ...selectedIngredient,
      ...formData
    };

    onAdd(ingredientToAdd);
    setSelectedIngredient(null);
    setFormData({});
  };

  const handleEdit = (ingredient) => {
    setSelectedIngredient(ingredient);
    setFormData(ingredient);
  };

  const handleCancel = () => {
    setSelectedIngredient(null);
    setFormData({});
  };

  return (
    <div className="flex h-full gap-4">
      
      {/* Left section: Grid of available ingredients */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-gray-200 rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col">
          <div className="px-4 py-3 border-b  border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 uppercase">{gridTitle}</h3>
          </div>
          <div className="bg-white flex-1 overflow-y-auto p-4">
            {renderGrid({
              ingredients: availableIngredients,
              selectedIngredient,
              onSelect: handleSelect
            })}
          </div>
        </div>
      </div>

      {/* Right section: Form and List */}
      <div className="w-[500px] flex flex-col gap-4">
        
        {/* Top: Add/Edit Form */}
        <div className="bg-gray-200 rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 uppercase">{formTitle}</h3>
          </div>
          <div className="p-4 bg-white">
            {selectedIngredient ? (
              <div className="space-y-4">
                {renderForm({
                  selectedIngredient,
                  formData,
                  onChange: handleFormChange
                })}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 px-4 py-2 bg-fermentum-800 text-white rounded-md hover:bg-fermentum-700 transition-colors text-sm font-medium"
                  >
                    Add to Recipe
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Select an ingredient from the grid to add it to your recipe
              </p>
            )}
          </div>
        </div>

        {/* Bottom: List of added ingredients */}
        <div className="bg-gray-200 rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 uppercase">
              {listTitle}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {addedIngredients.length > 0 ? (
              renderList({
                ingredients: addedIngredients,
                onEdit: handleEdit,
                onRemove
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                {emptyMessage}
              </p>
            )}
          </div>
        </div>
      
      </div>
    
    </div>
  );
};

export default IngredientSelector;