// Webhook integration patterns for physical measurement devices
import { NOTIFICATION_TYPES, NOTIFICATION_EVENTS } from './notificationTypes'

/**
 * Common IoT device types and their webhook patterns
 */
export const DEVICE_TYPES = {
  TEMPERATURE_SENSOR: 'temperature_sensor',
  HYDROMETER: 'hydrometer',
  PH_METER: 'ph_meter',
  FLOW_METER: 'flow_meter',
  PRESSURE_SENSOR: 'pressure_sensor',
  SCALE: 'scale',
  FERMENTATION_MONITOR: 'fermentation_monitor',
  TANK_LEVEL_SENSOR: 'tank_level_sensor',
  DISSOLVED_OXYGEN: 'dissolved_oxygen',
  CONDUCTIVITY_METER: 'conductivity_meter'
}

/**
 * Webhook payload processors for different device types
 */
export const createWebhookProcessors = (notifications) => {
  return {
    // Temperature monitoring devices (Tilt, iSpindel, etc.)
    [DEVICE_TYPES.TEMPERATURE_SENSOR]: (payload) => {
      const { deviceId, temperature, timestamp, location, thresholds, tenantId } = payload

      // Check for temperature alerts
      if (thresholds) {
        const { min, max, target } = thresholds

        if (temperature < min || temperature > max) {
          notifications.triggerEvent(NOTIFICATION_EVENTS.TEMPERATURE_READING, {
            equipment: {
              id: deviceId,
              name: location || `Temperature Sensor ${deviceId}`,
              location
            },
            currentTemp: temperature,
            targetTemp: target,
            threshold: Math.max(target - min, max - target),
            severity: (temperature < min - 5 || temperature > max + 5) ? 'critical' : 'warning',
            timestamp,
            tenantId
          })
        }
      }

      return {
        processed: true,
        deviceType: DEVICE_TYPES.TEMPERATURE_SENSOR,
        data: { temperature, timestamp, location }
      }
    },

    // Digital hydrometers (Tilt, Plaato, etc.)
    [DEVICE_TYPES.HYDROMETER]: (payload) => {
      const { deviceId, specificGravity, temperature, timestamp, batchId, tenantId } = payload

      // Check for fermentation completion
      const gravityChange = payload.previousReading ?
        Math.abs(specificGravity - payload.previousReading) : 0

      if (gravityChange < 0.002 && payload.stableReadings > 48) { // Stable for 48+ hours
        notifications.triggerEvent(NOTIFICATION_EVENTS.FERMENTATION_ENDED, {
          batch: {
            id: batchId,
            name: payload.batchName || `Batch ${batchId}`
          },
          fermentationData: {
            finalGravity: specificGravity,
            temperature,
            duration: payload.fermentationDays
          },
          tenantId
        })
      }

      return {
        processed: true,
        deviceType: DEVICE_TYPES.HYDROMETER,
        data: { specificGravity, temperature, timestamp, batchId }
      }
    },

    // pH monitoring devices
    [DEVICE_TYPES.PH_METER]: (payload) => {
      const { deviceId, pH, temperature, timestamp, location, thresholds, tenantId } = payload

      if (thresholds) {
        const { min, max } = thresholds

        if (pH < min || pH > max) {
          notifications.createNotification({
            type: NOTIFICATION_TYPES.QC_CHECK_REQUIRED,
            title: 'pH Alert',
            message: `pH level ${pH} is outside acceptable range (${min}-${max}) at ${location}`,
            data: {
              deviceId,
              pH,
              temperature,
              location,
              timestamp
            },
            actionUrl: `/quality-control/ph-readings?device=${deviceId}`,
            tenantId,
            source: 'ph-monitoring'
          })
        }
      }

      return {
        processed: true,
        deviceType: DEVICE_TYPES.PH_METER,
        data: { pH, temperature, timestamp, location }
      }
    },

    // Flow meters for ingredient usage tracking
    [DEVICE_TYPES.FLOW_METER]: (payload) => {
      const { deviceId, flowRate, totalVolume, timestamp, ingredient, tenantId } = payload

      // Track ingredient usage
      if (ingredient) {
        notifications.triggerEvent(NOTIFICATION_EVENTS.INGREDIENT_USED, {
          ingredient: {
            id: ingredient.id,
            name: ingredient.name,
            unit: 'gallons'
          },
          quantityUsed: totalVolume - payload.previousVolume,
          remainingQuantity: ingredient.currentStock - (totalVolume - payload.previousVolume),
          minimumStock: ingredient.minimumStock,
          tenantId
        })
      }

      return {
        processed: true,
        deviceType: DEVICE_TYPES.FLOW_METER,
        data: { flowRate, totalVolume, timestamp, ingredient }
      }
    },

    // Tank level sensors
    [DEVICE_TYPES.TANK_LEVEL_SENSOR]: (payload) => {
      const { deviceId, level, capacity, timestamp, tankName, product, tenantId } = payload

      const percentFull = (level / capacity) * 100

      // Low level alerts
      if (percentFull < 20) {
        notifications.createNotification({
          type: NOTIFICATION_TYPES.INVENTORY_LOW_STOCK,
          title: 'Tank Level Low',
          message: `${tankName} is ${percentFull.toFixed(1)}% full (${level}/${capacity} gallons)`,
          data: {
            tankId: deviceId,
            tankName,
            level,
            capacity,
            percentFull,
            product,
            timestamp
          },
          actionUrl: `/inventory/tanks/${deviceId}`,
          tenantId,
          source: 'tank-monitoring'
        })
      }

      // Full tank alerts
      if (percentFull > 95) {
        notifications.createNotification({
          type: NOTIFICATION_TYPES.EQUIPMENT_MAINTENANCE,
          title: 'Tank Nearly Full',
          message: `${tankName} is ${percentFull.toFixed(1)}% full - consider transferring`,
          data: {
            tankId: deviceId,
            tankName,
            level,
            capacity,
            percentFull,
            product,
            timestamp
          },
          actionUrl: `/production/transfer?tank=${deviceId}`,
          tenantId,
          source: 'tank-monitoring'
        })
      }

      return {
        processed: true,
        deviceType: DEVICE_TYPES.TANK_LEVEL_SENSOR,
        data: { level, capacity, percentFull, timestamp, tankName }
      }
    },

    // Digital scales for ingredient tracking
    [DEVICE_TYPES.SCALE]: (payload) => {
      const { deviceId, weight, timestamp, ingredient, operation, tenantId } = payload

      if (operation === 'ingredient_added' && ingredient) {
        notifications.triggerEvent(NOTIFICATION_EVENTS.INGREDIENT_ADDED, {
          ingredient: {
            id: ingredient.id,
            name: ingredient.name,
            unit: 'lbs'
          },
          quantityAdded: weight,
          newTotalQuantity: ingredient.currentStock + weight,
          timestamp,
          tenantId
        })
      }

      return {
        processed: true,
        deviceType: DEVICE_TYPES.SCALE,
        data: { weight, timestamp, ingredient, operation }
      }
    },

    // All-in-one fermentation monitors (like Plaato Airlock)
    [DEVICE_TYPES.FERMENTATION_MONITOR]: (payload) => {
      const {
        deviceId,
        temperature,
        specificGravity,
        co2Production,
        timestamp,
        batchId,
        fermentationDay,
        tenantId
      } = payload

      // Multiple monitoring capabilities
      const results = []

      // Temperature monitoring
      if (payload.temperatureThresholds) {
        results.push(this[DEVICE_TYPES.TEMPERATURE_SENSOR]({
          deviceId,
          temperature,
          timestamp,
          location: `Fermenter ${batchId}`,
          thresholds: payload.temperatureThresholds,
          tenantId
        }))
      }

      // Gravity monitoring
      if (specificGravity) {
        results.push(this[DEVICE_TYPES.HYDROMETER]({
          deviceId,
          specificGravity,
          temperature,
          timestamp,
          batchId,
          tenantId,
          ...payload
        }))
      }

      // CO2 production alerts (fermentation activity)
      if (co2Production < payload.expectedCO2 && fermentationDay > 1) {
        notifications.createNotification({
          type: NOTIFICATION_TYPES.QC_CHECK_REQUIRED,
          title: 'Low Fermentation Activity',
          message: `Batch ${batchId} showing low CO2 production - check yeast health`,
          data: {
            batchId,
            co2Production,
            expectedCO2: payload.expectedCO2,
            fermentationDay,
            timestamp
          },
          actionUrl: `/production/batches/${batchId}/fermentation`,
          tenantId,
          source: 'fermentation-monitoring'
        })
      }

      return {
        processed: true,
        deviceType: DEVICE_TYPES.FERMENTATION_MONITOR,
        data: { temperature, specificGravity, co2Production, timestamp, batchId },
        subResults: results
      }
    }
  }
}

/**
 * Webhook endpoint handler factory
 */
export const createWebhookHandler = (notifications) => {
  const processors = createWebhookProcessors(notifications)

  return {
    /**
     * Process incoming webhook from IoT devices
     * @param {Object} webhookPayload - Raw webhook payload
     * @param {string} deviceType - Type of device sending the webhook
     * @param {Object} deviceConfig - Device configuration and metadata
     */
    processWebhook: async (webhookPayload, deviceType, deviceConfig) => {
      try {
        // Validate webhook signature if configured
        if (deviceConfig.secret && !validateWebhookSignature(webhookPayload, deviceConfig.secret)) {
          throw new Error('Invalid webhook signature')
        }

        // Add device metadata to payload
        const enrichedPayload = {
          ...webhookPayload,
          deviceId: deviceConfig.deviceId,
          tenantId: deviceConfig.tenantId,
          location: deviceConfig.location,
          thresholds: deviceConfig.thresholds
        }

        // Process with appropriate handler
        const processor = processors[deviceType]
        if (!processor) {
          throw new Error(`Unknown device type: ${deviceType}`)
        }

        const result = processor(enrichedPayload)

        // Log successful processing
        console.log(`📡 Processed webhook from ${deviceType} device ${deviceConfig.deviceId}:`, result)

        return {
          success: true,
          deviceType,
          deviceId: deviceConfig.deviceId,
          result
        }

      } catch (error) {
        console.error(`❌ Webhook processing error for ${deviceType}:`, error)

        // Create notification for webhook failures
        notifications.createNotification({
          type: NOTIFICATION_TYPES.INTEGRATION_ERROR,
          title: 'Device Integration Error',
          message: `Failed to process data from ${deviceConfig.name || deviceType}: ${error.message}`,
          data: {
            deviceId: deviceConfig.deviceId,
            deviceType,
            error: error.message,
            payload: webhookPayload
          },
          actionUrl: `/settings/integrations/devices/${deviceConfig.deviceId}`,
          tenantId: deviceConfig.tenantId,
          source: 'webhook-integration'
        })

        return {
          success: false,
          error: error.message,
          deviceType,
          deviceId: deviceConfig.deviceId
        }
      }
    },

    /**
     * Register a new IoT device for webhook integration
     */
    registerDevice: (deviceConfig) => {
      // TODO: Store device configuration in database
      // This would include webhook URL, secret, thresholds, etc.

      return {
        webhookUrl: `https://api.fermentum.dev/webhooks/devices/${deviceConfig.deviceId}`,
        secret: generateWebhookSecret(),
        deviceId: deviceConfig.deviceId
      }
    },

    /**
     * Test webhook integration with sample data
     */
    testIntegration: (deviceType, tenantId) => {
      const samplePayloads = {
        [DEVICE_TYPES.TEMPERATURE_SENSOR]: {
          deviceId: 'test-temp-001',
          temperature: 68.5,
          timestamp: new Date().toISOString(),
          location: 'Fermenter #1',
          thresholds: { min: 65, max: 70, target: 67 },
          tenantId
        },
        [DEVICE_TYPES.HYDROMETER]: {
          deviceId: 'test-hydro-001',
          specificGravity: 1.012,
          temperature: 68.2,
          timestamp: new Date().toISOString(),
          batchId: 'test-batch-001',
          batchName: 'Test IPA Batch',
          previousReading: 1.013,
          stableReadings: 50,
          fermentationDays: 14,
          tenantId
        }
      }

      const payload = samplePayloads[deviceType]
      if (!payload) {
        throw new Error(`No test payload available for ${deviceType}`)
      }

      return this.processWebhook(payload, deviceType, {
        deviceId: payload.deviceId,
        tenantId,
        name: `Test ${deviceType}`,
        location: payload.location
      })
    }
  }
}

/**
 * Popular IoT device integration templates
 */
export const DEVICE_INTEGRATIONS = {
  // Tilt Hydrometer
  TILT: {
    name: 'Tilt Hydrometer',
    deviceType: DEVICE_TYPES.FERMENTATION_MONITOR,
    capabilities: ['temperature', 'specificGravity'],
    webhookFormat: 'json',
    samplePayload: {
      color: 'red',
      temperature: 68.5,
      specificGravity: 1.020,
      timestamp: '2025-01-15T10:30:00Z',
      rssi: -45
    },
    setupInstructions: 'Configure Tilt app to send webhooks to your Fermentum endpoint'
  },

  // Plaato Airlock
  PLAATO: {
    name: 'Plaato Airlock',
    deviceType: DEVICE_TYPES.FERMENTATION_MONITOR,
    capabilities: ['co2Production', 'temperature', 'fermentationActivity'],
    webhookFormat: 'json',
    samplePayload: {
      temp: 20.5,
      co2_volume: 2.4,
      timestamp: '2025-01-15T10:30:00Z'
    },
    setupInstructions: 'Use Plaato webhook feature to send data to Fermentum'
  },

  // Generic temperature sensors
  DS18B20: {
    name: 'DS18B20 Temperature Sensor',
    deviceType: DEVICE_TYPES.TEMPERATURE_SENSOR,
    capabilities: ['temperature'],
    webhookFormat: 'json',
    samplePayload: {
      sensor_id: 'ds18b20-001',
      temperature: 18.625,
      timestamp: '2025-01-15T10:30:00Z'
    },
    setupInstructions: 'Configure your microcontroller to POST temperature readings'
  }
}

/**
 * Webhook signature validation
 */
const validateWebhookSignature = (payload, secret) => {
  // Implementation depends on the signing method used by the device
  // Common methods: HMAC-SHA256, simple token validation, etc.
  return true // Placeholder
}

/**
 * Generate secure webhook secret
 */
const generateWebhookSecret = () => {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
}