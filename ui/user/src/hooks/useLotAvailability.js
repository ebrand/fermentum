import { useState, useEffect } from 'react';
import { stockAPI } from '../utils/api';

/**
 * Custom hook to check lot availability for an ingredient
 *
 * This hook can be used by parent components to get availability data
 * for styling grid backgrounds based on stock availability
 *
 * @param {string} ingredientId - The ID of the ingredient
 * @param {string} category - The category ('grain', 'hop', 'yeast', 'additive')
 * @param {number} amount - The required amount (defaults to 0.01 for availability check)
 * @param {string} unit - The unit of measure
 * @returns {object} { availability, loading, error, isAvailable, canFulfillSingleLot, totalAvailable, lotsRequired, lots }
 */
export const useLotAvailability = (ingredientId, category, amount = 0.01, unit = 'lbs') => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!ingredientId || !category) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await stockAPI.checkLotAvailability({
          ingredientId,
          category,
          amount: amount || 0.01,
          unit: unit || 'lbs'
        });

        if (response.data?.success) {
          const availabilityData = response.data.data;
          // Map API response (AvailableLots) to internal format (lots)
          const mappedData = {
            ...availabilityData,
            lots: availabilityData.availableLots || []
          };
          setAvailability(mappedData);
        } else {
          setError('Failed to check availability');
          setAvailability({ isAvailable: false, lots: [] });
        }
      } catch (err) {
        console.error('Error checking lot availability:', err);
        setError(err.message || 'Error checking availability');
        setAvailability({ isAvailable: false, lots: [] });
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [ingredientId, category, amount, unit]);

  return {
    availability,
    loading,
    error,
    isAvailable: availability?.isAvailable || false,
    canFulfillSingleLot: availability?.canFulfillFromSingleLot || false,
    totalAvailable: availability?.totalAvailable || 0,
    lotsRequired: availability?.lotsRequired || 0,
    lots: availability?.lots || []
  };
};
