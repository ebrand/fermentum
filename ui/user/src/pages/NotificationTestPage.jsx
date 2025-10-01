import React, { useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import { useNotificationHandlers, NOTIFICATION_EVENTS } from '../utils/notificationEvents'
import { createWebhookHandler, DEVICE_TYPES, DEVICE_INTEGRATIONS } from '../utils/webhookIntegration'
import { NOTIFICATION_TYPES, PRIORITY_LEVELS } from '../utils/notificationTypes'
import { useSession } from '../contexts/SessionContext'
import { notificationsAPI } from '../utils/api'
import {
  BeakerIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  BellIcon
} from '@heroicons/react/24/outline'

const NotificationTestPage = () => {
  const notifications = useAdvancedNotification()
  const { currentTenant } = useSession()
  const { registerHandler, registerCustomHandler, cleanup } = useNotificationHandlers(
    notifications,
    'notification-test-page'
  )

  // Register event handlers on mount
  useEffect(() => {
    // Register sample handlers
    registerHandler(NOTIFICATION_EVENTS.INVENTORY_LEVEL_CHANGED, 'inventoryLowStock')
    registerHandler(NOTIFICATION_EVENTS.TEMPERATURE_READING, 'temperatureAlert')
    registerHandler(NOTIFICATION_EVENTS.FERMENTATION_ENDED, 'fermentationComplete')

    // Register custom handler for testing
    registerCustomHandler(NOTIFICATION_EVENTS.BATCH_STEP_STARTED, (eventData, createNotification) => {
      createNotification({
        type: NOTIFICATION_TYPES.BATCH_STEP_DUE,
        title: 'Batch Step Started',
        message: `${eventData.step.name} has started for batch ${eventData.batch.name}`,
        data: eventData,
        actionUrl: `/production/batches/${eventData.batch.id}`,
        tenantId: eventData.tenantId,
        source: 'test-system'
      })
    })

    return cleanup
  }, [registerHandler, registerCustomHandler, cleanup])

  // Sample notification creators (now using API for persistence)
  const createSampleNotifications = {
    criticalTemperature: async () => {
      try {
        await notificationsAPI.createNotification({
          type: 'temperature_alert',
          title: 'CRITICAL: Test Temperature Alert',
          message: 'Fermenter #1 temperature is 78°F (target: 68°F) - immediate attention required!',
          data: {
            equipment: { id: 'fermenter-001', name: 'Fermenter #1' },
            currentTemp: 78,
            targetTemp: 68,
            threshold: 5
          },
          actionUrl: '/equipment/fermenter-001',
          source: 'test-page'
        })
        console.log('✅ Critical temperature notification created in database')
        // Show immediate toast feedback
        notifications.showError('CRITICAL: Temperature Alert - Fermenter #1 at 78°F!', 8000)
        // Refresh the frontend notifications to show the new one
        notifications.refreshNotifications()
      } catch (error) {
        console.error('❌ Failed to create temperature notification:', error)
        alert('Failed to create notification: ' + error.message)
      }
    },

    lowStockAlert: async () => {
      try {
        await notificationsAPI.createNotification({
          type: 'inventory_low_stock',
          title: 'Low Stock Warning',
          message: 'Cascade hops are running low (2.5 lbs remaining, minimum: 5 lbs)',
          data: {
            item: { id: 'hops-cascade', name: 'Cascade Hops', unit: 'lbs' },
            currentStock: 2.5,
            minimumStock: 5
          },
          actionUrl: '/inventory/materials?item=hops-cascade',
          source: 'test-page'
        })
        console.log('✅ Low stock notification created in database')
        notifications.showWarning('Low Stock: Cascade hops running low (2.5 lbs remaining)', 6000)
        notifications.refreshNotifications()
      } catch (error) {
        console.error('❌ Failed to create low stock notification:', error)
        alert('Failed to create notification: ' + error.message)
      }
    },

    batchStepDue: async () => {
      try {
        await notificationsAPI.createNotification({
          type: 'batch_step_due',
          title: 'Batch Step Due',
          message: 'Dry hopping is due for West Coast IPA batch #042',
          data: {
            batch: { id: 'batch-042', name: 'West Coast IPA #042' },
            step: { id: 'dry-hop', name: 'Dry Hopping' },
            dueTime: new Date().toISOString()
          },
          actionUrl: '/production/batches/batch-042',
          source: 'test-page'
        })
        console.log('✅ Batch step notification created in database')
        notifications.showInfo('Batch Step Due: Dry hopping for West Coast IPA #042', 6000)
        notifications.refreshNotifications()
      } catch (error) {
        console.error('❌ Failed to create batch step notification:', error)
        alert('Failed to create notification: ' + error.message)
      }
    },

    qcCheckRequired: async () => {
      try {
        await notificationsAPI.createNotification({
          type: 'qc_check_required',
          title: 'Quality Control Check',
          message: 'Final gravity measurement needed for Pale Ale batch #038',
          data: {
            batch: { id: 'batch-038', name: 'Pale Ale #038' },
            qcCheck: { id: 'final-gravity', name: 'Final Gravity Check' }
          },
          actionUrl: '/production/batches/batch-038/quality-control',
          source: 'test-page'
        })
        console.log('✅ QC check notification created in database')
        notifications.showInfo('QC Check Required: Final gravity for Pale Ale #038', 6000)
        notifications.refreshNotifications()
      } catch (error) {
        console.error('❌ Failed to create QC check notification:', error)
        alert('Failed to create notification: ' + error.message)
      }
    },

    maintenanceDue: async () => {
      try {
        await notificationsAPI.createNotification({
          type: 'equipment_maintenance',
          title: 'Maintenance Due',
          message: 'Weekly cleaning due for Heat Exchanger #2 in 2 days',
          data: {
            equipment: { id: 'heat-exchanger-002', name: 'Heat Exchanger #2' },
            maintenanceType: 'Weekly Cleaning',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          actionUrl: '/equipment/heat-exchanger-002/maintenance',
          source: 'test-page'
        })
        console.log('✅ Maintenance notification created in database')
        notifications.showInfo('Maintenance Due: Heat Exchanger #2 cleaning in 2 days', 6000)
        notifications.refreshNotifications()
      } catch (error) {
        console.error('❌ Failed to create maintenance notification:', error)
        alert('Failed to create notification: ' + error.message)
      }
    },

    fermentationComplete: async () => {
      try {
        await notificationsAPI.createNotification({
          type: 'fermentation_complete',
          title: 'Fermentation Complete',
          message: 'Primary fermentation completed for Stout batch #035',
          data: {
            batch: { id: 'batch-035', name: 'Stout #035' },
            fermentationData: {
              finalGravity: 1.012,
              duration: 12,
              efficiency: 0.85
            }
          },
          actionUrl: '/production/batches/batch-035',
          source: 'test-page'
        })
        console.log('✅ Fermentation complete notification created in database')
        notifications.showSuccess('Fermentation Complete: Stout batch #035 ready for next step', 6000)
        notifications.refreshNotifications()
      } catch (error) {
        console.error('❌ Failed to create fermentation notification:', error)
        alert('Failed to create notification: ' + error.message)
      }
    },

    subscriptionExpiring: async () => {
      try {
        await notificationsAPI.createNotification({
          type: 'subscription_expiring',
          title: 'Subscription Expiring Soon',
          message: 'Your Professional plan subscription expires in 5 days',
          data: {
            subscription: { id: 'sub-001', planName: 'Professional' },
            daysUntilExpiry: 5
          },
          actionUrl: '/settings/billing',
          source: 'test-page'
        })
        console.log('✅ Subscription expiring notification created in database')
        notifications.showWarning('Subscription Expiring: Professional plan expires in 5 days', 6000)
        notifications.refreshNotifications()
      } catch (error) {
        console.error('❌ Failed to create subscription notification:', error)
        alert('Failed to create notification: ' + error.message)
      }
    },

    integrationError: async () => {
      try {
        await notificationsAPI.createNotification({
          type: 'integration_error',
          title: 'Integration Error',
          message: 'QuickBooks Online sync failed: Authentication expired',
          data: {
            integration: { id: 'quickbooks', name: 'QuickBooks Online' },
            error: { message: 'Authentication expired', code: 'AUTH_EXPIRED' }
          },
          actionUrl: '/settings/integrations/quickbooks',
          source: 'test-page'
        })
        console.log('✅ Integration error notification created in database')
        notifications.showError('Integration Error: QuickBooks authentication expired', 6000)
        notifications.refreshNotifications()
      } catch (error) {
        console.error('❌ Failed to create integration error notification:', error)
        alert('Failed to create notification: ' + error.message)
      }
    }
  }

  // Event trigger examples
  const triggerEvents = {
    inventoryChange: () => {
      notifications.triggerEvent(NOTIFICATION_EVENTS.INVENTORY_LEVEL_CHANGED, {
        item: {
          id: 'grain-pilsner',
          name: 'Pilsner Malt',
          unit: 'lbs',
          minimumStock: 50
        },
        currentStock: 12,
        minimumStock: 50,
        tenantId: currentTenant?.tenantId
      })
    },

    temperatureReading: () => {
      notifications.triggerEvent(NOTIFICATION_EVENTS.TEMPERATURE_READING, {
        equipment: {
          id: 'fermenter-002',
          name: 'Fermenter #2',
          targetTemperature: 65,
          alertThreshold: 3,
          criticalThreshold: 8
        },
        currentTemp: 74,
        targetTemp: 65,
        threshold: 3,
        severity: 'critical',
        tenantId: currentTenant?.tenantId
      })
    },

    batchStepStart: () => {
      notifications.triggerEvent(NOTIFICATION_EVENTS.BATCH_STEP_STARTED, {
        batch: { id: 'batch-045', name: 'NEIPA #045' },
        step: { id: 'whirlpool', name: 'Whirlpool Addition' },
        dueTime: new Date(),
        tenantId: currentTenant?.tenantId
      })
    }
  }

  // IoT device webhook simulation
  const webhookHandler = createWebhookHandler(notifications)

  const simulateWebhooks = {
    tiltHydrometer: () => {
      webhookHandler.processWebhook(
        {
          color: 'red',
          temperature: 68.5,
          specificGravity: 1.012,
          timestamp: new Date().toISOString(),
          rssi: -45,
          previousReading: 1.013,
          stableReadings: 50,
          fermentationDays: 14,
          batchName: 'Test IPA'
        },
        DEVICE_TYPES.FERMENTATION_MONITOR,
        {
          deviceId: 'tilt-red-001',
            name: 'Tilt Red Hydrometer',
          location: 'Fermenter #3'
        }
      )
    },

    temperatureSensor: () => {
      webhookHandler.processWebhook(
        {
          temperature: 75.2,
          timestamp: new Date().toISOString()
        },
        DEVICE_TYPES.TEMPERATURE_SENSOR,
        {
          deviceId: 'temp-001',
            name: 'Fermenter Temperature Sensor',
          location: 'Fermenter #1',
          thresholds: { min: 65, max: 70, target: 67 }
        }
      )
    },

    tankLevelSensor: () => {
      webhookHandler.processWebhook(
        {
          level: 45,
          capacity: 250,
          timestamp: new Date().toISOString(),
          product: { id: 'ipa-001', name: 'West Coast IPA' }
        },
        DEVICE_TYPES.TANK_LEVEL_SENSOR,
        {
          deviceId: 'tank-level-001',
            name: 'Bright Tank #1 Level Sensor',
          tankName: 'Bright Tank #1'
        }
      )
    }
  }

  const counts = notifications.getNotificationCounts()

  return (
    <DashboardLayout
      title="Notification System Test"
      subtitle="Test the advanced role-based notification system with sample events"
      currentPage="Settings"
    >
      <div className="space-y-8">
        {/* Current State */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Notification State</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{counts.unread}</div>
              <div className="text-sm text-gray-500">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{counts.actionRequired}</div>
              <div className="text-sm text-gray-500">Action Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{counts.critical}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{counts.high}</div>
              <div className="text-sm text-gray-500">High Priority</div>
            </div>
          </div>
        </div>

        {/* Direct Notification Creation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BellIcon className="h-5 w-5 mr-2" />
            Create Sample Notifications
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={createSampleNotifications.criticalTemperature}
              className="flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Critical Temp
            </button>
            <button
              onClick={createSampleNotifications.lowStockAlert}
              className="flex items-center justify-center px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <CubeIcon className="h-5 w-5 mr-2" />
              Low Stock
            </button>
            <button
              onClick={createSampleNotifications.batchStepDue}
              className="flex items-center justify-center px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              Batch Step
            </button>
            <button
              onClick={createSampleNotifications.qcCheckRequired}
              className="flex items-center justify-center px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              QC Check
            </button>
            <button
              onClick={createSampleNotifications.maintenanceDue}
              className="flex items-center justify-center px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
              Maintenance
            </button>
            <button
              onClick={createSampleNotifications.fermentationComplete}
              className="flex items-center justify-center px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <BeakerIcon className="h-5 w-5 mr-2" />
              Fermentation
            </button>
            <button
              onClick={createSampleNotifications.subscriptionExpiring}
              className="flex items-center justify-center px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Subscription
            </button>
            <button
              onClick={createSampleNotifications.integrationError}
              className="flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Integration Error
            </button>
          </div>
        </div>

        {/* Event-Driven Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Event-Driven Notifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={triggerEvents.inventoryChange}
              className="px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              Trigger Inventory Change
            </button>
            <button
              onClick={triggerEvents.temperatureReading}
              className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Temperature Reading Event
            </button>
            <button
              onClick={triggerEvents.batchStepStart}
              className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Batch Step Started
            </button>
          </div>
        </div>

        {/* IoT Device Webhook Simulation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">IoT Device Webhook Simulation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={simulateWebhooks.tiltHydrometer}
              className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              Tilt Hydrometer Data
            </button>
            <button
              onClick={simulateWebhooks.temperatureSensor}
              className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              Temperature Sensor Alert
            </button>
            <button
              onClick={simulateWebhooks.tankLevelSensor}
              className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Tank Level Sensor
            </button>
          </div>
        </div>

        {/* Clear Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Notifications</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => notifications.clearAllNotifications()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Notifications
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default NotificationTestPage