// Event-driven notification registration system
import { NOTIFICATION_TYPES } from './notificationTypes'

/**
 * Event types that can trigger notifications
 */
export const NOTIFICATION_EVENTS = {
  // Inventory events
  INVENTORY_LEVEL_CHANGED: 'inventory_level_changed',
  INGREDIENT_ADDED: 'ingredient_added',
  INGREDIENT_USED: 'ingredient_used',
  EXPIRATION_CHECK: 'expiration_check',

  // Production events
  BATCH_CREATED: 'batch_created',
  BATCH_STEP_STARTED: 'batch_step_started',
  BATCH_STEP_COMPLETED: 'batch_step_completed',
  FERMENTATION_STARTED: 'fermentation_started',
  FERMENTATION_ENDED: 'fermentation_ended',
  TEMPERATURE_READING: 'temperature_reading',
  QC_SAMPLE_DUE: 'qc_sample_due',

  // Equipment events
  EQUIPMENT_STATUS_CHANGED: 'equipment_status_changed',
  MAINTENANCE_DUE: 'maintenance_due',
  EQUIPMENT_ERROR: 'equipment_error',

  // Business events
  ORDER_PLACED: 'order_placed',
  PAYMENT_RECEIVED: 'payment_received',
  SUBSCRIPTION_CHANGED: 'subscription_changed',
  TEAM_MEMBER_JOINED: 'team_member_joined',

  // System events
  INTEGRATION_STATUS_CHANGED: 'integration_status_changed',
  BACKUP_COMPLETED: 'backup_completed',
  SYSTEM_ERROR: 'system_error'
}

/**
 * Pre-built notification event handlers for common scenarios
 */
export const createNotificationHandlers = () => {
  return {
    // Inventory management handlers
    inventoryLowStock: (eventData, createNotification) => {
      const { item, currentStock, minimumStock, tenantId } = eventData

      if (currentStock <= minimumStock) {
        createNotification({
          type: NOTIFICATION_TYPES.INVENTORY_LOW_STOCK,
          title: 'Low Stock Alert',
          message: `${item.name} is running low (${currentStock} ${item.unit} remaining)`,
          data: {
            itemId: item.id,
            currentStock,
            minimumStock,
            item
          },
          actionUrl: `/inventory/materials?item=${item.id}`,
          tenantId,
          source: 'inventory-system'
        })
      }

      if (currentStock === 0) {
        createNotification({
          type: NOTIFICATION_TYPES.INVENTORY_OUT_OF_STOCK,
          title: 'Out of Stock',
          message: `${item.name} is completely out of stock`,
          data: {
            itemId: item.id,
            item
          },
          actionUrl: `/inventory/materials?item=${item.id}`,
          tenantId,
          source: 'inventory-system'
        })
      }
    },

    ingredientExpiring: (eventData, createNotification) => {
      const { ingredient, expirationDate, daysUntilExpiry, tenantId } = eventData

      if (daysUntilExpiry <= 7) {
        createNotification({
          type: NOTIFICATION_TYPES.INGREDIENT_EXPIRING,
          title: 'Ingredient Expiring Soon',
          message: `${ingredient.name} expires in ${daysUntilExpiry} day(s)`,
          data: {
            ingredientId: ingredient.id,
            expirationDate,
            daysUntilExpiry,
            ingredient
          },
          actionUrl: `/inventory/materials?ingredient=${ingredient.id}`,
          tenantId,
          source: 'inventory-system'
        })
      }
    },

    // Production management handlers
    batchStepDue: (eventData, createNotification) => {
      const { batch, step, dueTime, tenantId } = eventData

      createNotification({
        type: NOTIFICATION_TYPES.BATCH_STEP_DUE,
        title: 'Batch Step Due',
        message: `${step.name} is due for batch ${batch.name}`,
        data: {
          batchId: batch.id,
          stepId: step.id,
          dueTime,
          batch,
          step
        },
        actionUrl: `/production/batches/${batch.id}?step=${step.id}`,
        tenantId,
        source: 'production-system'
      })
    },

    qualityControlDue: (eventData, createNotification) => {
      const { batch, qcCheck, tenantId } = eventData

      createNotification({
        type: NOTIFICATION_TYPES.QC_CHECK_REQUIRED,
        title: 'Quality Control Required',
        message: `${qcCheck.name} needed for batch ${batch.name}`,
        data: {
          batchId: batch.id,
          qcCheckId: qcCheck.id,
          batch,
          qcCheck
        },
        actionUrl: `/production/batches/${batch.id}/quality-control`,
        tenantId,
        source: 'quality-control-system'
      })
    },

    temperatureAlert: (eventData, createNotification) => {
      const { equipment, currentTemp, targetTemp, threshold, severity, tenantId } = eventData

      const tempDiff = Math.abs(currentTemp - targetTemp)
      if (tempDiff > threshold) {
        createNotification({
          type: NOTIFICATION_TYPES.TEMPERATURE_ALERT,
          title: 'Temperature Alert',
          message: `${equipment.name} temperature is ${currentTemp}°F (target: ${targetTemp}°F)`,
          data: {
            equipmentId: equipment.id,
            currentTemp,
            targetTemp,
            threshold,
            severity,
            equipment
          },
          actionUrl: `/equipment/${equipment.id}`,
          tenantId,
          source: 'equipment-monitoring'
        })
      }
    },

    fermentationComplete: (eventData, createNotification) => {
      const { batch, fermentationData, tenantId } = eventData

      createNotification({
        type: NOTIFICATION_TYPES.FERMENTATION_COMPLETE,
        title: 'Fermentation Complete',
        message: `Fermentation completed for batch ${batch.name}`,
        data: {
          batchId: batch.id,
          fermentationData,
          batch
        },
        actionUrl: `/production/batches/${batch.id}`,
        tenantId,
        source: 'production-system'
      })
    },

    // Equipment management handlers
    equipmentMaintenance: (eventData, createNotification) => {
      const { equipment, maintenanceType, dueDate, tenantId } = eventData

      const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))

      if (daysUntilDue <= 7) {
        createNotification({
          type: NOTIFICATION_TYPES.EQUIPMENT_MAINTENANCE,
          title: 'Maintenance Due',
          message: `${maintenanceType} due for ${equipment.name} in ${daysUntilDue} days`,
          data: {
            equipmentId: equipment.id,
            maintenanceType,
            dueDate,
            daysUntilDue,
            equipment
          },
          actionUrl: `/equipment/${equipment.id}/maintenance`,
          tenantId,
          source: 'maintenance-system'
        })
      }
    },

    // Business process handlers
    orderReceived: (eventData, createNotification) => {
      const { order, customer, tenantId } = eventData

      createNotification({
        type: NOTIFICATION_TYPES.ORDER_RECEIVED,
        title: 'New Order Received',
        message: `Order #${order.orderNumber} from ${customer.name} ($${order.total})`,
        data: {
          orderId: order.id,
          customerId: customer.id,
          order,
          customer
        },
        actionUrl: `/orders/${order.id}`,
        tenantId,
        source: 'sales-system'
      })
    },

    paymentDue: (eventData, createNotification) => {
      const { invoice, daysOverdue, tenantId } = eventData

      createNotification({
        type: NOTIFICATION_TYPES.PAYMENT_DUE,
        title: 'Payment Overdue',
        message: `Invoice #${invoice.number} is ${daysOverdue} days overdue ($${invoice.amount})`,
        data: {
          invoiceId: invoice.id,
          daysOverdue,
          invoice
        },
        actionUrl: `/finance/invoices/${invoice.id}`,
        tenantId,
        source: 'billing-system'
      })
    },

    subscriptionExpiring: (eventData, createNotification) => {
      const { subscription, daysUntilExpiry, tenantId } = eventData

      if (daysUntilExpiry <= 14) {
        createNotification({
          type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING,
          title: 'Subscription Expiring',
          message: `Your ${subscription.planName} subscription expires in ${daysUntilExpiry} days`,
          data: {
            subscriptionId: subscription.id,
            daysUntilExpiry,
            subscription
          },
          actionUrl: '/settings/billing',
          tenantId,
          source: 'subscription-system'
        })
      }
    },

    // System handlers
    integrationError: (eventData, createNotification) => {
      const { integration, error, tenantId } = eventData

      createNotification({
        type: NOTIFICATION_TYPES.INTEGRATION_ERROR,
        title: 'Integration Error',
        message: `${integration.name} integration failed: ${error.message}`,
        data: {
          integrationId: integration.id,
          error,
          integration
        },
        actionUrl: `/settings/integrations/${integration.id}`,
        tenantId,
        source: 'integration-system'
      })
    },

    systemUpdate: (eventData, createNotification) => {
      const { version, features, tenantId } = eventData

      createNotification({
        type: NOTIFICATION_TYPES.SYSTEM_UPDATE,
        title: 'System Updated',
        message: `Fermentum updated to version ${version}`,
        data: {
          version,
          features
        },
        actionUrl: '/system/changelog',
        tenantId,
        source: 'system'
      })
    }
  }
}

/**
 * Helper hook for registering component-specific notification handlers
 */
export const useNotificationHandlers = (notifications, source) => {
  const { registerEventListener, unregisterEventListener } = notifications
  const handlers = createNotificationHandlers()

  const registerHandler = (eventType, handlerName) => {
    const handler = handlers[handlerName]
    if (handler) {
      registerEventListener(eventType, handler, source)
    } else {
      console.error(`Unknown notification handler: ${handlerName}`)
    }
  }

  const registerCustomHandler = (eventType, handler) => {
    registerEventListener(eventType, handler, source)
  }

  const unregisterHandler = (eventType) => {
    unregisterEventListener(eventType, source)
  }

  // Cleanup all handlers for this source on unmount
  const cleanup = () => {
    Object.values(NOTIFICATION_EVENTS).forEach(eventType => {
      unregisterEventListener(eventType, source)
    })
  }

  return {
    registerHandler,
    registerCustomHandler,
    unregisterHandler,
    cleanup,
    handlers
  }
}

/**
 * Sample integration patterns for different parts of the application
 */
export const INTEGRATION_EXAMPLES = {
  // Raw Materials Page Integration
  rawMaterialsPage: `
    // In RawMaterialsPage.jsx
    import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
    import { useNotificationHandlers, NOTIFICATION_EVENTS } from '../utils/notificationEvents'

    const RawMaterialsPage = () => {
      const notifications = useAdvancedNotification()
      const { registerHandler, cleanup } = useNotificationHandlers(notifications, 'raw-materials-page')

      useEffect(() => {
        // Register handlers for inventory events
        registerHandler(NOTIFICATION_EVENTS.INVENTORY_LEVEL_CHANGED, 'inventoryLowStock')
        registerHandler(NOTIFICATION_EVENTS.EXPIRATION_CHECK, 'ingredientExpiring')

        return cleanup
      }, [])

      const handleInventoryUpdate = (item, newQuantity) => {
        // Trigger notification event after updating inventory
        notifications.triggerEvent(NOTIFICATION_EVENTS.INVENTORY_LEVEL_CHANGED, {
          item,
          currentStock: newQuantity,
          minimumStock: item.minimumStock,
          tenantId: currentTenant.tenantId
        })
      }
    }
  `,

  // Production System Integration
  productionSystem: `
    // In a production monitoring component
    useEffect(() => {
      const checkBatchSteps = () => {
        batches.forEach(batch => {
          batch.steps.forEach(step => {
            if (step.dueTime <= new Date() && !step.completed) {
              notifications.triggerEvent(NOTIFICATION_EVENTS.BATCH_STEP_STARTED, {
                batch,
                step,
                dueTime: step.dueTime,
                tenantId: batch.tenantId
              })
            }
          })
        })
      }

      const interval = setInterval(checkBatchSteps, 60000) // Check every minute
      return () => clearInterval(interval)
    }, [batches])
  `,

  // Equipment Monitoring Integration
  equipmentMonitoring: `
    // In equipment monitoring system
    const monitorTemperature = (equipment, reading) => {
      notifications.triggerEvent(NOTIFICATION_EVENTS.TEMPERATURE_READING, {
        equipment,
        currentTemp: reading.temperature,
        targetTemp: equipment.targetTemperature,
        threshold: equipment.alertThreshold,
        severity: Math.abs(reading.temperature - equipment.targetTemperature) > equipment.criticalThreshold ? 'critical' : 'warning',
        tenantId: equipment.tenantId
      })
    }
  `
}