// Notification Types and Configuration
export const NOTIFICATION_TYPES = {
  // Production & Brewing
  BATCH_STEP_DUE: 'batch_step_due',
  QC_CHECK_REQUIRED: 'qc_check_required',
  FERMENTATION_COMPLETE: 'fermentation_complete',
  TEMPERATURE_ALERT: 'temperature_alert',
  EQUIPMENT_MAINTENANCE: 'equipment_maintenance',

  // Inventory Management
  INVENTORY_LOW_STOCK: 'inventory_low_stock',
  INVENTORY_OUT_OF_STOCK: 'inventory_out_of_stock',
  INGREDIENT_EXPIRING: 'ingredient_expiring',
  REORDER_REMINDER: 'reorder_reminder',

  // Administrative
  PAYMENT_DUE: 'payment_due',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  COMPLIANCE_CHECK: 'compliance_check',
  TEAM_INVITATION: 'team_invitation',

  // Sales & Orders
  ORDER_RECEIVED: 'order_received',
  ORDER_READY_TO_SHIP: 'order_ready_to_ship',
  CUSTOMER_PAYMENT: 'customer_payment',

  // System
  SYSTEM_UPDATE: 'system_update',
  INTEGRATION_ERROR: 'integration_error',
  BACKUP_COMPLETE: 'backup_complete'
}

// Priority Levels
export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',    // Red - Immediate attention required
  HIGH: 'high',           // Orange - Urgent action needed
  MEDIUM: 'medium',       // Yellow - Important but not urgent
  LOW: 'low',            // Blue - Informational
  INFO: 'info'           // Gray - General information
}

// Role-based notification targeting
export const NOTIFICATION_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  BREWER: 'brewer',
  BREW_MANAGER: 'brew-manager',
  GENERALIST: 'generalist',
  SALES: 'sales',
  ACCOUNTING: 'accounting',
  MAINTENANCE: 'maintenance',
  USER: 'user',
  TENANT: 'tenant'
}

// Notification configuration mapping
export const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.BATCH_STEP_DUE]: {
    priority: PRIORITY_LEVELS.HIGH,
    targetRoles: [NOTIFICATION_ROLES.BREWER, NOTIFICATION_ROLES.BREW_MANAGER, NOTIFICATION_ROLES.MANAGER],
    category: 'production',
    icon: 'BeakerIcon',
    color: 'orange',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true
  },

  [NOTIFICATION_TYPES.QC_CHECK_REQUIRED]: {
    priority: PRIORITY_LEVELS.HIGH,
    targetRoles: [NOTIFICATION_ROLES.BREWER, NOTIFICATION_ROLES.BREW_MANAGER, NOTIFICATION_ROLES.MANAGER],
    category: 'quality',
    icon: 'CheckBadgeIcon',
    color: 'purple',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true
  },

  [NOTIFICATION_TYPES.FERMENTATION_COMPLETE]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    targetRoles: [NOTIFICATION_ROLES.BREWER, NOTIFICATION_ROLES.BREW_MANAGER],
    category: 'production',
    icon: 'CheckCircleIcon',
    color: 'green',
    autoExpire: true,
    actionRequired: false,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.TEMPERATURE_ALERT]: {
    priority: PRIORITY_LEVELS.CRITICAL,
    targetRoles: [NOTIFICATION_ROLES.BREWER, NOTIFICATION_ROLES.BREW_MANAGER, NOTIFICATION_ROLES.MANAGER, NOTIFICATION_ROLES.OWNER],
    category: 'equipment',
    icon: 'ExclamationTriangleIcon',
    color: 'red',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true,
    smsAlert: true
  },

  [NOTIFICATION_TYPES.INVENTORY_LOW_STOCK]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    targetRoles: [NOTIFICATION_ROLES.MANAGER, NOTIFICATION_ROLES.ADMIN, NOTIFICATION_ROLES.OWNER],
    category: 'inventory',
    icon: 'CubeIcon',
    color: 'yellow',
    autoExpire: false,
    actionRequired: true,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.INVENTORY_OUT_OF_STOCK]: {
    priority: PRIORITY_LEVELS.HIGH,
    targetRoles: [NOTIFICATION_ROLES.MANAGER, NOTIFICATION_ROLES.ADMIN, NOTIFICATION_ROLES.OWNER, NOTIFICATION_ROLES.BREWER],
    category: 'inventory',
    icon: 'ExclamationCircleIcon',
    color: 'red',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true
  },

  [NOTIFICATION_TYPES.INGREDIENT_EXPIRING]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    targetRoles: [NOTIFICATION_ROLES.BREWER, NOTIFICATION_ROLES.MANAGER],
    category: 'inventory',
    icon: 'ClockIcon',
    color: 'orange',
    autoExpire: false,
    actionRequired: true,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.REORDER_REMINDER]: {
    priority: PRIORITY_LEVELS.LOW,
    targetRoles: [NOTIFICATION_ROLES.MANAGER, NOTIFICATION_ROLES.ADMIN, NOTIFICATION_ROLES.OWNER],
    category: 'inventory',
    icon: 'ShoppingCartIcon',
    color: 'blue',
    autoExpire: true,
    actionRequired: false,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.EQUIPMENT_MAINTENANCE]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    targetRoles: [NOTIFICATION_ROLES.MAINTENANCE, NOTIFICATION_ROLES.MANAGER, NOTIFICATION_ROLES.BREWER],
    category: 'maintenance',
    icon: 'WrenchScrewdriverIcon',
    color: 'blue',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true
  },

  [NOTIFICATION_TYPES.PAYMENT_DUE]: {
    priority: PRIORITY_LEVELS.HIGH,
    targetRoles: [NOTIFICATION_ROLES.OWNER, NOTIFICATION_ROLES.ADMIN, NOTIFICATION_ROLES.ACCOUNTING],
    category: 'financial',
    icon: 'CreditCardIcon',
    color: 'red',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true
  },

  [NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING]: {
    priority: PRIORITY_LEVELS.HIGH,
    targetRoles: [NOTIFICATION_ROLES.OWNER, NOTIFICATION_ROLES.ADMIN],
    category: 'administrative',
    icon: 'ExclamationTriangleIcon',
    color: 'orange',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true
  },

  [NOTIFICATION_TYPES.COMPLIANCE_CHECK]: {
    priority: PRIORITY_LEVELS.HIGH,
    targetRoles: [NOTIFICATION_ROLES.OWNER, NOTIFICATION_ROLES.ADMIN, NOTIFICATION_ROLES.MANAGER],
    category: 'compliance',
    icon: 'DocumentCheckIcon',
    color: 'purple',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true
  },

  [NOTIFICATION_TYPES.TEAM_INVITATION]: {
    priority: PRIORITY_LEVELS.LOW,
    targetRoles: [NOTIFICATION_ROLES.USER],
    category: 'team',
    icon: 'UserPlusIcon',
    color: 'blue',
    autoExpire: true,
    actionRequired: false,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.ORDER_RECEIVED]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    targetRoles: [NOTIFICATION_ROLES.SALES, NOTIFICATION_ROLES.MANAGER, NOTIFICATION_ROLES.OWNER],
    category: 'sales',
    icon: 'ShoppingBagIcon',
    color: 'green',
    autoExpire: true,
    actionRequired: false,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.ORDER_READY_TO_SHIP]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    targetRoles: [NOTIFICATION_ROLES.SALES, NOTIFICATION_ROLES.MANAGER],
    category: 'fulfillment',
    icon: 'TruckIcon',
    color: 'blue',
    autoExpire: false,
    actionRequired: true,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.CUSTOMER_PAYMENT]: {
    priority: PRIORITY_LEVELS.LOW,
    targetRoles: [NOTIFICATION_ROLES.ACCOUNTING, NOTIFICATION_ROLES.SALES, NOTIFICATION_ROLES.OWNER],
    category: 'financial',
    icon: 'BanknotesIcon',
    color: 'green',
    autoExpire: true,
    actionRequired: false,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.SYSTEM_UPDATE]: {
    priority: PRIORITY_LEVELS.INFO,
    targetRoles: [NOTIFICATION_ROLES.ADMIN, NOTIFICATION_ROLES.OWNER],
    category: 'system',
    icon: 'ComputerDesktopIcon',
    color: 'gray',
    autoExpire: true,
    actionRequired: false,
    emailAlert: false
  },

  [NOTIFICATION_TYPES.INTEGRATION_ERROR]: {
    priority: PRIORITY_LEVELS.HIGH,
    targetRoles: [NOTIFICATION_ROLES.ADMIN, NOTIFICATION_ROLES.OWNER],
    category: 'system',
    icon: 'ExclamationTriangleIcon',
    color: 'red',
    autoExpire: false,
    actionRequired: true,
    emailAlert: true
  },

  [NOTIFICATION_TYPES.BACKUP_COMPLETE]: {
    priority: PRIORITY_LEVELS.INFO,
    targetRoles: [NOTIFICATION_ROLES.ADMIN],
    category: 'system',
    icon: 'CloudArrowUpIcon',
    color: 'gray',
    autoExpire: true,
    actionRequired: false,
    emailAlert: false
  }
}

// Utility functions
export const getNotificationConfig = (type) => {
  return NOTIFICATION_CONFIG[type] || {
    priority: PRIORITY_LEVELS.INFO,
    targetRoles: [NOTIFICATION_ROLES.USER],
    category: 'general',
    icon: 'InformationCircleIcon',
    color: 'gray',
    autoExpire: true,
    actionRequired: false,
    emailAlert: false
  }
}

export const shouldUserReceiveNotification = (notificationType, userRole) => {
  const config = getNotificationConfig(notificationType)
  return config.targetRoles.includes(userRole)
}

export const getPriorityWeight = (priority) => {
  const weights = {
    [PRIORITY_LEVELS.CRITICAL]: 100,
    [PRIORITY_LEVELS.HIGH]: 80,
    [PRIORITY_LEVELS.MEDIUM]: 60,
    [PRIORITY_LEVELS.LOW]: 40,
    [PRIORITY_LEVELS.INFO]: 20
  }
  return weights[priority] || 20
}

export const NOTIFICATION_CATEGORIES = {
  PRODUCTION: 'production',
  QUALITY: 'quality',
  INVENTORY: 'inventory',
  EQUIPMENT: 'equipment',
  MAINTENANCE: 'maintenance',
  FINANCIAL: 'financial',
  ADMINISTRATIVE: 'administrative',
  COMPLIANCE: 'compliance',
  TEAM: 'team',
  SALES: 'sales',
  FULFILLMENT: 'fulfillment',
  SYSTEM: 'system',
  GENERAL: 'general'
}

// Event system constants for the advanced notification system
export const NOTIFICATION_EVENTS = {
  // Device-triggered events
  TEMPERATURE_THRESHOLD: 'device.temperature_threshold',
  FERMENTATION_COMPLETE: 'device.fermentation_complete',
  SPECIFIC_GRAVITY_CHANGE: 'device.specific_gravity_change',
  PH_ALERT: 'device.ph_alert',

  // System-triggered events
  BATCH_STEP_DUE: 'system.batch_step_due',
  QC_CHECK_REQUIRED: 'system.qc_check_required',
  INVENTORY_LOW: 'system.inventory_low',
  MAINTENANCE_DUE: 'system.maintenance_due',

  // User-triggered events
  MANUAL_QC_CHECK: 'user.manual_qc_check',
  BATCH_NOTE_ADDED: 'user.batch_note_added',
  INVENTORY_UPDATE: 'user.inventory_update',

  // Integration events
  WEBHOOK_RECEIVED: 'integration.webhook_received',
  API_ERROR: 'integration.api_error',
  SYNC_COMPLETE: 'integration.sync_complete'
}