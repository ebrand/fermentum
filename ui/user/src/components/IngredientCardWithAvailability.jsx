import React from 'react';
import { useLotAvailability } from '../hooks/useLotAvailability';
import LotAvailabilityChecker from './LotAvailabilityChecker';

/**
 * IngredientCardWithAvailability
 *
 * A wrapper component that uses the useLotAvailability hook to style
 * ingredient cards based on stock availability
 *
 * Background colors:
 * - Available: Light green background
 * - Not available: Light red background
 * - Selected: Fermentum brand color (overrides availability colors)
 * - Loading: Neutral gray
 *
 * Note: We don't distinguish single-lot vs multi-lot in the ingredient
 * selection grid because we can't determine lot requirements until
 * the user specifies how much they need for their recipe.
 *
 * Usage example:
 * <IngredientCardWithAvailability
 *   ingredientId={grain.grainId}
 *   category="grain"
 *   unit="lbs"
 *   isSelected={selectedIngredient?.grainId === grain.grainId}
 *   onClick={() => onSelect(grain)}
 * >
 *   <div>Your ingredient card content</div>
 * </IngredientCardWithAvailability>
 */
const IngredientCardWithAvailability = ({
  ingredientId,
  category,
  amount = 0,
  unit = 'lbs',
  isSelected = false,
  onClick,
  children,
  className = ''
}) => {
  const { isAvailable, canFulfillSingleLot, loading } = useLotAvailability(
    ingredientId,
    category,
    amount,
    unit
  );

  // Determine background color based on availability
  const getBackgroundClass = () => {
    // Selected state overrides availability colors
    if (isSelected) {
      return 'border-fermentum-500 bg-fermentum-50';
    }

    // Loading state - neutral
    if (loading) {
      return 'border-gray-200 bg-gray-100';
    }

    // Not available - light red
    if (!isAvailable) {
      return 'border-red-200 bg-red-50 hover:bg-red-100';
    }

    // Available - light green
    // Note: We don't distinguish single-lot vs multi-lot here because
    // we can't determine lot requirements until the user specifies
    // how much of the ingredient they need for their recipe
    return 'border-green-200 bg-green-50 hover:bg-green-100';
  };

  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 text-left transition-all ${getBackgroundClass()} ${className}`}
    >
      {children}
    </button>
  );
};

export default IngredientCardWithAvailability;
