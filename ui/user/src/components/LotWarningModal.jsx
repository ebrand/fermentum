import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserCircleIcon,
  DocumentIcon,
  BeakerIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';

/**
 * LotWarningModal Component
 *
 * Displays detailed information about lot alerts including:
 * - Alert severity, status, and metadata
 * - Supplier information and references
 * - Affected batches
 * - Recommended actions
 * - Resolution history and notes
 * - Supporting documents
 * - Acknowledgement and resolution actions
 */
const LotWarningModal = ({ lotNumber, isOpen, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Fetch alerts when modal opens
  useEffect(() => {
    if (isOpen && lotNumber) {
      fetchAlerts();
    }
  }, [isOpen, lotNumber]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/lotalert/by-lot/${encodeURIComponent(lotNumber)}`);

      if (response.data.success && response.data.data) {
        setAlerts(response.data.data);
        // Auto-select first alert if available
        if (response.data.data.length > 0) {
          setSelectedAlert(response.data.data[0]);
        }
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error('Error fetching lot alerts:', err);
      setError('Failed to load alert details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await api.post(`/lotalert/${selectedAlert.lotAlertId}/acknowledge`, {
        notes: acknowledgeNotes || undefined
      });

      if (response.data.success) {
        // Refresh alerts to show updated status
        await fetchAlerts();
        setAcknowledgeNotes('');
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      setActionError('Failed to acknowledge alert. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert || !resolutionNotes.trim()) {
      setActionError('Resolution notes are required.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await api.post(`/lotalert/${selectedAlert.lotAlertId}/resolve`, {
        resolutionNotes: resolutionNotes
      });

      if (response.data.success) {
        // Refresh alerts to show updated status
        await fetchAlerts();
        setResolutionNotes('');
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
      setActionError('Failed to resolve alert. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get severity styling
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Recall':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Critical':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-red-100 text-red-700';
      case 'Acknowledged':
        return 'bg-yellow-100 text-yellow-700';
      case 'Resolved':
        return 'bg-green-100 text-green-700';
      case 'Archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Lot Alerts: {lotNumber}
                </h2>
                <p className="text-sm text-gray-600">
                  {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} found
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-120px)]">
            {/* Alert List Sidebar */}
            <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fermentum-600" />
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-red-600">{error}</div>
              ) : alerts.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No alerts found for this lot.</div>
              ) : (
                <div className="p-2 space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.lotAlertId}
                      onClick={() => setSelectedAlert(alert)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedAlert?.lotAlertId === alert.lotAlertId
                          ? 'bg-fermentum-100 border-2 border-fermentum-500'
                          : 'bg-white border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                        {alert.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(alert.alertDate)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alert Details */}
            <div className="flex-1 overflow-y-auto">
              {selectedAlert ? (
                <div className="p-6 space-y-6">
                  {/* Alert Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedAlert.title}
                      </h3>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(selectedAlert.severity)}`}>
                          {selectedAlert.severity}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAlert.status)}`}>
                          {selectedAlert.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Alert Type: <span className="font-medium">{selectedAlert.alertType}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedAlert.description}
                    </p>
                  </div>

                  {/* Supplier Information */}
                  {(selectedAlert.supplierName || selectedAlert.supplierReference) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <UserCircleIcon className="w-5 h-5 text-blue-600" />
                        Supplier Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        {selectedAlert.supplierName && (
                          <div>
                            <span className="text-gray-600">Name:</span>{' '}
                            <span className="font-medium text-gray-900">{selectedAlert.supplierName}</span>
                          </div>
                        )}
                        {selectedAlert.supplierReference && (
                          <div>
                            <span className="text-gray-600">Reference:</span>{' '}
                            <span className="font-medium text-gray-900">{selectedAlert.supplierReference}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Affected Batches */}
                  {selectedAlert.affectedBatches && selectedAlert.affectedBatches.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <BeakerIcon className="w-5 h-5 text-gray-700" />
                        Affected Batches
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAlert.affectedBatches.map((batch, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium"
                          >
                            {batch}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Action */}
                  {selectedAlert.recommendedAction && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Recommended Action
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedAlert.recommendedAction}
                      </p>
                    </div>
                  )}

                  {/* Source URL */}
                  {selectedAlert.sourceUrl && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-gray-700" />
                        Source
                      </h4>
                      <a
                        href={selectedAlert.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-fermentum-600 hover:text-fermentum-700 underline break-all"
                      >
                        {selectedAlert.sourceUrl}
                      </a>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-700" />
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">Alert Created</div>
                          <div className="text-xs text-gray-600">{formatDate(selectedAlert.alertDate)}</div>
                        </div>
                      </div>

                      {selectedAlert.acknowledgedDate && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Acknowledged</div>
                            <div className="text-xs text-gray-600">{formatDate(selectedAlert.acknowledgedDate)}</div>
                          </div>
                        </div>
                      )}

                      {selectedAlert.resolvedDate && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Resolved</div>
                            <div className="text-xs text-gray-600">{formatDate(selectedAlert.resolvedDate)}</div>
                            {selectedAlert.resolutionNotes && (
                              <div className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                                {selectedAlert.resolutionNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedAlert.expirationDate && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Expiration Date</div>
                            <div className="text-xs text-gray-600">{formatDate(selectedAlert.expirationDate)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Internal Notes */}
                  {selectedAlert.internalNotes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Internal Notes
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedAlert.internalNotes}
                      </p>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedAlert.documents && selectedAlert.documents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DocumentIcon className="w-5 h-5 text-gray-700" />
                        Supporting Documents
                      </h4>
                      <div className="space-y-2">
                        {selectedAlert.documents.map((doc) => (
                          <a
                            key={doc.lotAlertDocumentId}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <DocumentIcon className="w-5 h-5 text-gray-600" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{doc.fileName}</div>
                              <div className="text-xs text-gray-600">
                                {doc.documentType} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                              </div>
                              {doc.description && (
                                <div className="text-xs text-gray-700 mt-1">{doc.description}</div>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedAlert.status === 'Active' && (
                    <div className="border-t border-gray-200 pt-6 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900">Take Action</h4>

                      {actionError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          {actionError}
                        </div>
                      )}

                      {/* Acknowledge Section */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Acknowledge Alert (Optional Notes)
                        </label>
                        <textarea
                          value={acknowledgeNotes}
                          onChange={(e) => setAcknowledgeNotes(e.target.value)}
                          placeholder="Add notes about your acknowledgement..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-fermentum-500 text-sm"
                        />
                        <button
                          onClick={handleAcknowledge}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {actionLoading ? 'Processing...' : 'Acknowledge Alert'}
                        </button>
                      </div>

                      {/* Resolve Section */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Resolve Alert (Required Notes)
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Describe how this alert was resolved..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-fermentum-500 text-sm"
                        />
                        <button
                          onClick={handleResolve}
                          disabled={actionLoading || !resolutionNotes.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {actionLoading ? 'Processing...' : 'Resolve Alert'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedAlert.status === 'Acknowledged' && (
                    <div className="border-t border-gray-200 pt-6 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900">Resolve Alert</h4>

                      {actionError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          {actionError}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Resolution Notes (Required)
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Describe how this alert was resolved..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fermentum-500 focus:border-fermentum-500 text-sm"
                        />
                        <button
                          onClick={handleResolve}
                          disabled={actionLoading || !resolutionNotes.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {actionLoading ? 'Processing...' : 'Resolve Alert'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select an alert to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotWarningModal;
