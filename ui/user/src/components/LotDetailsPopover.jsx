import React from 'react';
import { InformationCircleIcon, CalendarIcon, BeakerIcon } from '@heroicons/react/24/outline';

/**
 * LotDetailsPopover - Display detailed lot information in a popover
 *
 * Shows:
 * - Lot number
 * - Quantity on hand (original inventory)
 * - Quantity reserved
 * - Quantity available
 * - Percentage used (visual progress bar)
 * - Received date
 * - Expiration date (if available)
 *
 * @param {Object} props
 * @param {Array} props.lots - Array of lot information objects
 * @param {boolean} props.isOpen - Whether the popover is visible
 * @param {Function} props.onClose - Callback to close the popover
 * @param {string} props.ingredientName - Name of the ingredient for display
 * @param {boolean} props.loading - Whether lot data is still loading
 */
const LotDetailsPopover = ({ lots = [], isOpen, onClose, ingredientName, loading = false }) => {
  if (!isOpen) {
    return null;
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Get color class based on percentage used
   */
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  /**
   * Get text color class based on percentage used
   */
  const getTextColor = (percentage) => {
    if (percentage >= 80) return 'text-red-700';
    if (percentage >= 50) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BeakerIcon className="w-5 h-5 text-fermentum-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Lot Details: {ingredientName}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-fermentum-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-600">Loading lot details...</p>
              </div>
            </div>
          ) : lots.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <BeakerIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No lot information available</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
            {lots.map((lot, index) => (
              <div
                key={`${lot.lotNumber}-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-fermentum-300 transition-colors"
              >
                {/* Lot Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Lot Number:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {lot.lotNumber || 'Unknown'}
                    </span>
                  </div>
                  {lot.percentageUsed !== undefined && (
                    <span className={`text-xs font-medium ${getTextColor(lot.percentageUsed)}`}>
                      {lot.percentageUsed.toFixed(1)}% Used
                    </span>
                  )}
                </div>

                {/* Quantity Information Grid */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">On Hand</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {lot.quantityOnHand?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Reserved</div>
                    <div className="text-sm font-semibold text-amber-600">
                      {lot.quantityReserved?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Available</div>
                    <div className="text-sm font-semibold text-green-600">
                      {lot.quantityAvailable?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {lot.percentageUsed !== undefined && (
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(lot.percentageUsed)} transition-all`}
                        style={{ width: `${Math.min(lot.percentageUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Date Information */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Received: {formatDate(lot.receivedDate)}</span>
                  </div>
                  {lot.expirationDate && (
                    <div className="flex items-center gap-1">
                      <InformationCircleIcon className="w-4 h-4" />
                      <span>Expires: {formatDate(lot.expirationDate)}</span>
                    </div>
                  )}
                </div>

                {/* Unit Cost (if available) */}
                {lot.unitCost && lot.unitCost > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Unit Cost: ${lot.unitCost.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
            </div>
          )}

          {/* Summary Footer */}
          {!loading && lots.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Total Lots:</span>
                <span className="font-semibold text-gray-900">{lots.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="font-medium text-gray-700">Total Available:</span>
                <span className="font-semibold text-green-600">
                  {lots.reduce((sum, lot) => sum + (lot.quantityAvailable || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-fermentum-600 text-white rounded-md hover:bg-fermentum-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotDetailsPopover;
