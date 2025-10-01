import { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * Custom hook to fetch lot alerts for specific lot numbers
 *
 * @param {string} lotNumber - The lot number to fetch alerts for
 * @returns {Object} - Object containing alerts, loading state, and error
 */
export const useLotAlerts = (lotNumber) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lotNumber) {
      setAlerts([]);
      return;
    }

    const fetchLotAlerts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/lotalert/by-lot/${encodeURIComponent(lotNumber)}`);

        if (response.data.success && response.data.data) {
          setAlerts(response.data.data);
        } else {
          setAlerts([]);
        }
      } catch (err) {
        console.error('Error fetching lot alerts:', err);
        setError(err.message || 'Failed to fetch lot alerts');
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLotAlerts();
  }, [lotNumber]);

  // Helper to check if there are any active alerts
  const hasActiveAlerts = alerts.length > 0;

  // Get the highest severity level from active alerts
  const getHighestSeverity = () => {
    if (alerts.length === 0) return null;

    const severityOrder = {
      'Recall': 4,
      'Critical': 3,
      'Warning': 2,
      'Info': 1
    };

    return alerts.reduce((highest, alert) => {
      const currentSeverity = severityOrder[alert.severity] || 0;
      const highestSeverity = severityOrder[highest?.severity] || 0;
      return currentSeverity > highestSeverity ? alert : highest;
    }, alerts[0]);
  };

  return {
    alerts,
    loading,
    error,
    hasActiveAlerts,
    highestSeverity: getHighestSeverity()
  };
};

export default useLotAlerts;
