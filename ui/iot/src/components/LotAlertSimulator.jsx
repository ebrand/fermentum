import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';

/**
 * Lot Alert Simulator Component
 *
 * Simulates supplier notifications about lot issues (contamination, recalls, etc.)
 * and allows testing the lot alert system end-to-end.
 */
const LotAlertSimulator = () => {
  const [stockInventory, setStockInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Form state for creating lot alert
  const [alertForm, setAlertForm] = useState({
    alertType: 'Quality Issue',
    severity: 'Warning',
    title: '',
    description: '',
    supplierName: '',
    supplierReference: '',
    recommendedAction: '',
    sourceUrl: '',
    expirationDate: ''
  });

  // Predefined alert templates
  const alertTemplates = {
    contamination: {
      alertType: 'Contamination',
      severity: 'Critical',
      title: 'Potential Microbial Contamination Detected',
      description: 'Laboratory testing has revealed potential microbial contamination in this lot. Immediate review and testing of any batches using this material is recommended.',
      recommendedAction: 'Quarantine remaining inventory. Test all production batches that used this lot. Conduct thorough cleaning of equipment that came in contact with this material.',
      supplierName: 'Generic Supplier Co.',
      supplierReference: 'QA-' + Math.random().toString(36).substring(7).toUpperCase()
    },
    recall: {
      alertType: 'Recall',
      severity: 'Recall',
      title: 'Supplier-Initiated Product Recall',
      description: 'Supplier has initiated a voluntary recall of this lot due to quality control issues discovered during routine testing.',
      recommendedAction: 'Immediately halt use of this lot. Return unused material to supplier. Contact quality assurance to review any batches produced with this material.',
      supplierName: 'Premium Ingredients Ltd.',
      supplierReference: 'RECALL-' + Math.random().toString(36).substring(7).toUpperCase()
    },
    qualityIssue: {
      alertType: 'Quality Issue',
      severity: 'Warning',
      title: 'Off-Specification Quality Parameter',
      description: 'Post-shipment testing has revealed that some quality parameters in this lot are outside of normal specification ranges, though still within acceptable limits.',
      recommendedAction: 'Monitor finished product quality for any batches using this lot. Consider adjusting recipe parameters if necessary.',
      supplierName: 'Quality Materials Inc.',
      supplierReference: 'QC-' + Math.random().toString(36).substring(7).toUpperCase()
    },
    supplierNotice: {
      alertType: 'Supplier Notice',
      severity: 'Info',
      title: 'Certificate of Analysis Update',
      description: 'Supplier has issued an updated Certificate of Analysis for this lot with revised analytical data. No quality concerns, informational only.',
      recommendedAction: 'Review updated COA and file with lot documentation. No immediate action required.',
      supplierName: 'Reliable Supply Co.',
      supplierReference: 'COA-' + Math.random().toString(36).substring(7).toUpperCase()
    }
  };

  useEffect(() => {
    fetchStockInventory();
  }, []);

  const fetchStockInventory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/stockinventory');
      if (response.data.success && response.data.data) {
        // Filter to only lots with quantity available
        const activeLots = response.data.data.filter(
          item => item.quantityAvailable > 0 && item.lotNumber
        );
        setStockInventory(activeLots);
      }
    } catch (err) {
      console.error('Error fetching stock inventory:', err);
      setError('Failed to load stock inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleLotSelect = (lot) => {
    setSelectedLot(lot);
    setSubmitSuccess(null);
    // Auto-populate supplier name if available
    if (lot.supplierName) {
      setAlertForm(prev => ({ ...prev, supplierName: lot.supplierName }));
    }
  };

  const handleTemplateSelect = (templateKey) => {
    const template = alertTemplates[templateKey];
    setAlertForm(prev => ({
      ...prev,
      ...template
    }));
  };

  const handleFormChange = (field, value) => {
    setAlertForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLot) {
      setError('Please select a lot first');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        stockInventoryId: selectedLot.stockInventoryId,
        lotNumber: selectedLot.lotNumber,
        alertType: alertForm.alertType,
        severity: alertForm.severity,
        title: alertForm.title,
        description: alertForm.description,
        supplierName: alertForm.supplierName || null,
        supplierReference: alertForm.supplierReference || null,
        recommendedAction: alertForm.recommendedAction || null,
        sourceUrl: alertForm.sourceUrl || null,
        expirationDate: alertForm.expirationDate ? new Date(alertForm.expirationDate).toISOString() : null
      };

      const response = await api.post('/lotalert', payload);

      if (response.data.success) {
        setSubmitSuccess({
          type: 'success',
          message: `Alert created successfully for lot ${selectedLot.lotNumber}`,
          alertId: response.data.data.lotAlertId
        });

        // Reset form
        setAlertForm({
          alertType: 'Quality Issue',
          severity: 'Warning',
          title: '',
          description: '',
          supplierName: selectedLot.supplierName || '',
          supplierReference: '',
          recommendedAction: '',
          sourceUrl: '',
          expirationDate: ''
        });
      }
    } catch (err) {
      console.error('Error creating lot alert:', err);
      setError(err.response?.data?.message || 'Failed to create alert');
      setSubmitSuccess({
        type: 'error',
        message: 'Failed to create alert. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <XCircleIcon className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-danger-900">Error</h3>
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {submitSuccess && (
        <div className={`border rounded-lg p-4 flex items-start gap-3 ${
          submitSuccess.type === 'success'
            ? 'bg-success-50 border-success-200'
            : 'bg-danger-50 border-danger-200'
        }`}>
          {submitSuccess.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircleIcon className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className={`font-medium ${
              submitSuccess.type === 'success' ? 'text-success-900' : 'text-danger-900'
            }`}>
              {submitSuccess.type === 'success' ? 'Alert Created' : 'Error'}
            </h3>
            <p className={`text-sm ${
              submitSuccess.type === 'success' ? 'text-success-700' : 'text-danger-700'
            }`}>
              {submitSuccess.message}
            </p>
            {submitSuccess.alertId && (
              <p className="text-xs text-success-600 mt-1">
                Alert ID: {submitSuccess.alertId}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Select Lot */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 1: Select Lot
          </h2>

          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={fetchStockInventory}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Lots
            </button>
            <span className="text-sm text-gray-500">
              {stockInventory.length} active lots
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stockInventory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BeakerIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No active lots with inventory found</p>
                <p className="text-sm">Add some stock inventory first</p>
              </div>
            ) : (
              stockInventory.map(lot => (
                <button
                  key={lot.stockInventoryId}
                  onClick={() => handleLotSelect(lot)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedLot?.stockInventoryId === lot.stockInventoryId
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {lot.lotNumber}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {lot.stockName || 'Unknown Material'}
                      </div>
                      {lot.supplierName && (
                        <div className="text-xs text-gray-500 mt-1">
                          Supplier: {lot.supplierName}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900">
                        {lot.quantityAvailable.toFixed(1)} {lot.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        available
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Step 2: Configure Alert */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 2: Configure Alert
          </h2>

          {!selectedLot ? (
            <div className="text-center py-12 text-gray-500">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Select a lot first to create an alert</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alert Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(alertTemplates).map(([key, template]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTemplateSelect(key)}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-left"
                    >
                      {template.alertType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Type *
                </label>
                <input
                  type="text"
                  value={alertForm.alertType}
                  onChange={(e) => handleFormChange('alertType', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity *
                </label>
                <select
                  value={alertForm.severity}
                  onChange={(e) => handleFormChange('severity', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                  <option value="Recall">Recall</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={alertForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={alertForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Supplier Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={alertForm.supplierName}
                    onChange={(e) => handleFormChange('supplierName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference #
                  </label>
                  <input
                    type="text"
                    value={alertForm.supplierReference}
                    onChange={(e) => handleFormChange('supplierReference', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Recommended Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommended Action
                </label>
                <textarea
                  value={alertForm.recommendedAction}
                  onChange={(e) => handleFormChange('recommendedAction', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source URL
                </label>
                <input
                  type="url"
                  value={alertForm.sourceUrl}
                  onChange={(e) => handleFormChange('sourceUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={alertForm.expirationDate}
                  onChange={(e) => handleFormChange('expirationDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Creating Alert...
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    Create Alert
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-info-50 border border-info-200 rounded-lg p-4">
        <h3 className="font-medium text-info-900 mb-2">About This Simulator</h3>
        <ul className="text-sm text-info-800 space-y-1">
          <li>• Simulates supplier notifications about lot quality issues</li>
          <li>• Alerts will appear in the Stock Inventory page with visual indicators</li>
          <li>• Use the quick templates for common alert scenarios</li>
          <li>• Created alerts can be acknowledged and resolved through the API</li>
        </ul>
      </div>
    </div>
  );
};

export default LotAlertSimulator;
