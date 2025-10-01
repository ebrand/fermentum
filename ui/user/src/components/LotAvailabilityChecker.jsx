import React, { useState } from 'react';
import { CubeIcon, CubeTransparentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLotAvailability } from '../hooks/useLotAvailability';
import { useLotAlerts } from '../hooks/useLotAlerts';
import LotWarningModal from './LotWarningModal';

/**
 * LotAvailabilityChecker Badge Component
 *
 * Displays a badge indicating stock availability for a specific ingredient
 *
 * Props:
 * - ingredientId: The ID of the ingredient (grainId, hopId, yeastId, additiveId)
 * - category: The category of the ingredient ('grain', 'hop', 'yeast', 'additive')
 * - amount: The required amount for the recipe (optional - defaults to 0 for just checking availability)
 * - unit: The unit of measure (lbs, oz, g, kg, etc.)
 * - className: Additional CSS classes for styling
 * - showLabel: Whether to show availability text label (default: true)
 * - showQuantity: Whether to show quantity numbers in non-compact mode (default: true)
 * - compact: Use compact display mode (icon only, default: false)
 */
const LotAvailabilityChecker = ({
  ingredientId,
  category,
  amount = 0,
  unit = 'lbs',
  className = '',
  showLabel = true,
  showQuantity = true,
  compact = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLotNumber, setSelectedLotNumber] = useState(null);

  const {
    availability,
    loading,
    isAvailable,
    canFulfillSingleLot,
    totalAvailable,
    lotsRequired,
    lots
  } = useLotAvailability(ingredientId, category, amount, unit);

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Calculate percentage remaining for a lot
  const calculatePercentageRemaining = (lot) => {
    if (!lot.quantityReceived || lot.quantityReceived === 0) return 0;
    return (lot.quantityAvailable / lot.quantityReceived) * 100;
  };

  // Get color class based on percentage remaining
  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get alert severity color and icon
  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'Recall':
        return 'text-red-600 bg-red-50';
      case 'Critical':
        return 'text-orange-600 bg-orange-50';
      case 'Warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'Info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Handle opening modal for a specific lot
  const handleOpenModal = (lotNumber) => {
    setSelectedLotNumber(lotNumber);
    setModalOpen(true);
  };

  // Component for rendering individual lot with alerts
  const LotItem = ({ lot, displayUnit }) => {
    const percentageRemaining = calculatePercentageRemaining(lot);
    const progressColor = getProgressColor(percentageRemaining);
    const { alerts, hasActiveAlerts, highestSeverity } = useLotAlerts(lot.lotNumber);

    return (
      <div className="flex flex-col gap-0.5 mb-1.5 last:mb-0">
        
        {/* Lot info and percentage with optional alert indicator */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-700 font-medium">
              {lot.lotNumber}
            </span>
            {hasActiveAlerts && highestSeverity && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(lot.lotNumber);
                }}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${getAlertSeverityColor(highestSeverity.severity)}`}
                title={`Click to view details: ${highestSeverity.severity}: ${highestSeverity.title}`}
              >
                <ExclamationTriangleIcon className="w-3 h-3" />
                <span className="text-[10px] font-medium uppercase">
                  {highestSeverity.severity}
                </span>
              </button>
            )}
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {percentageRemaining.toFixed(1)}%
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-300`}
            style={{ width: `${percentageRemaining}%` }}
          />
        </div>

        {/* Quantity text */}
        <div className="text-xs text-gray-600">
          {lot.quantityAvailable.toFixed(1)} of {lot.quantityReceived.toFixed(1)} {displayUnit}
        </div>

        {/* Alert summary if present - clickable */}
        {hasActiveAlerts && alerts.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(lot.lotNumber);
            }}
            className="text-[10px] text-gray-500 hover:text-gray-700 mt-0.5 text-left underline cursor-pointer"
          >
            {alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'}
          </button>
        )}
      
      </div>
    );
  };

  // Format lot breakdown display with mini progress bars and alerts
  const formatLotBreakdown = () => {
    if (!isAvailable || !showQuantity || !lots || lots.length === 0) return null;

    const displayUnit = availability?.unit || unit;

    // Show per-lot breakdown with progress bars and alerts
    return lots.map((lot, index) => (
      <LotItem key={lot.lotNumber || index} lot={lot} displayUnit={displayUnit} />
    ));
  };

  // Determine the label based on lot fulfillment
  const getAvailabilityLabel = () => {
    if (!isAvailable) return 'No Stock';

    // If amount is specified and greater than 0, we can check lot fulfillment
    if (amount && amount > 0) {
      if (canFulfillSingleLot) {
        return 'In Stock';
      } else if (lotsRequired > 1) {
        return `Multi-lot (${lotsRequired})`;
      }
    }

    // Default for just checking availability without specific amount
    return 'In Stock';
  };

  // Compact mode - icon only
  if (compact) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        title={
          isAvailable
            ? `In stock (${totalAvailable.toFixed(1)} ${availability?.unit || unit} available)`
            : 'Out of stock'
        }
      >
        {isAvailable ? (
          <CubeIcon className="w-4 h-4 text-green-600" />
        ) : (
          <CubeTransparentIcon className="w-4 h-4 text-gray-400" />
        )}
      </div>
    );
  }

  // Full display mode with lot breakdown information
  return (
    <>
      <div className={`inline-flex items-start gap-1.5 ${className}`}>
        {isAvailable ? (
          <>
            <CubeIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-[180px]">
              {showLabel && (
                <span className={`text-xs font-medium leading-tight mb-1 ${
                  lotsRequired > 1 && amount > 0 ? 'text-yellow-700' : 'text-green-700'
                }`}>
                  {getAvailabilityLabel()}
                </span>
              )}
              {showQuantity && (
                <div className="flex flex-col gap-1">
                  {formatLotBreakdown()}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <CubeTransparentIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {showLabel && (
              <span className="text-xs text-gray-500">
                {getAvailabilityLabel()}
              </span>
            )}
          </>
        )}
      </div>

      {/* Modal for viewing alert details */}
      <LotWarningModal
        lotNumber={selectedLotNumber}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedLotNumber(null);
        }}
      />
    </>
  );
};

export default LotAvailabilityChecker;
