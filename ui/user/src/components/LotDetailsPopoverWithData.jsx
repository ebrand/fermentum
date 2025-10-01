import React from 'react';
import LotDetailsPopover from './LotDetailsPopover';
import { useLotAvailability } from '../hooks/useLotAvailability';

/**
 * LotDetailsPopoverWithData - Wrapper that fetches lot data and passes to LotDetailsPopover
 *
 * This component handles the hook call at the top level (following Rules of Hooks)
 * and passes the lot data to the presentational LotDetailsPopover component.
 */
const LotDetailsPopoverWithData = ({
  ingredientId,
  ingredientName,
  category,
  amount,
  unit,
  isOpen,
  onClose
}) => {
  // Fetch lot availability data using the hook
  const { lots, loading } = useLotAvailability(
    ingredientId,
    category,
    amount,
    unit
  );

  // Debug logging
  console.log('LotDetailsPopoverWithData render:', {
    isOpen,
    ingredientId,
    ingredientName,
    category,
    amount,
    unit,
    loading,
    lots,
    lotsLength: lots?.length
  });

  return (
    <LotDetailsPopover
      lots={lots}
      isOpen={isOpen}
      onClose={onClose}
      ingredientName={ingredientName}
      loading={loading}
    />
  );
};

export default LotDetailsPopoverWithData;
