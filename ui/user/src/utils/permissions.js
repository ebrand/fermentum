// Role-based Access Control (RBAC) System for Fermentum
// Based on the database schema employee access levels and roles

// Employee Access Levels (from database schema)
export const ACCESS_LEVELS = {
  ADMIN: 'admin',           // Full access to everything
  SUPERVISOR: 'supervisor', // Management level access
  STANDARD: 'standard',     // Regular employee access
  READ_ONLY: 'read_only'    // View-only access
}

// Department Roles (from database schema)
export const DEPARTMENTS = {
  BREWING: 'brewing',       // Production and brewing operations
  SALES: 'sales',          // Customer management and orders
  ADMIN: 'admin',          // Administrative functions
  QUALITY: 'quality',      // Quality control and testing
  MAINTENANCE: 'maintenance' // Equipment and facility maintenance
}

// System Roles (from auth system)
export const SYSTEM_ROLES = {
  TENANT_OWNER: 'tenant',           // Brewery owner (full access)
  BREWERY_MANAGER: 'brewery-manager', // Brewery management
  EMPLOYEE: 'employee'              // Regular employee
}

// Permission Groups - What areas of the system users can access
export const PERMISSIONS = {
  // Dashboard - Basic overview access
  DASHBOARD: {
    VIEW: 'dashboard.view'
  },

  // Production Management
  PRODUCTION: {
    VIEW: 'production.view',
    MANAGE_BATCHES: 'production.manage_batches',
    MANAGE_RECIPES: 'production.manage_recipes',
    MANAGE_STYLES: 'production.manage_styles',
    VIEW_BATCH_DETAILS: 'production.view_batch_details',
    EDIT_BATCH_STEPS: 'production.edit_batch_steps'
  },

  // Inventory Management
  INVENTORY: {
    VIEW: 'inventory.view',
    MANAGE_STOCK: 'inventory.manage_stock',
    VIEW_COUNTS: 'inventory.view_counts',
    PERFORM_COUNTS: 'inventory.perform_counts',
    ADJUST_INVENTORY: 'inventory.adjust_inventory'
  },

  // Sales & Customer Management
  SALES: {
    VIEW: 'sales.view',
    MANAGE_ORDERS: 'sales.manage_orders',
    MANAGE_CUSTOMERS: 'sales.manage_customers',
    MANAGE_PRODUCTS: 'sales.manage_products',
    VIEW_CUSTOMER_VISITS: 'sales.view_customer_visits',
    RECORD_VISITS: 'sales.record_visits'
  },

  // Equipment & Maintenance
  EQUIPMENT: {
    VIEW: 'equipment.view',
    MANAGE_EQUIPMENT: 'equipment.manage_equipment',
    SCHEDULE_MAINTENANCE: 'equipment.schedule_maintenance',
    RECORD_SERVICE: 'equipment.record_service'
  },

  // Team & Employee Management
  TEAM: {
    VIEW: 'team.view',
    MANAGE_EMPLOYEES: 'team.manage_employees',
    MANAGE_ACCESS: 'team.manage_access',
    VIEW_PAYROLL: 'team.view_payroll'
  },

  // Reports & Analytics
  REPORTS: {
    VIEW: 'reports.view',
    VIEW_PRODUCTION: 'reports.view_production',
    VIEW_SALES: 'reports.view_sales',
    VIEW_INVENTORY: 'reports.view_inventory',
    VIEW_FINANCIAL: 'reports.view_financial'
  },

  // Settings & Configuration
  SETTINGS: {
    VIEW: 'settings.view',
    MANAGE_BREWERY: 'settings.manage_brewery',
    MANAGE_BILLING: 'settings.manage_billing',
    MANAGE_INTEGRATIONS: 'settings.manage_integrations'
  }
}

// Permission Matrix - Maps roles/access levels to specific permissions
export const PERMISSION_MATRIX = {
  // Tenant Owner - Full access to everything
  [SYSTEM_ROLES.TENANT_OWNER]: Object.values(PERMISSIONS).flatMap(section => Object.values(section)),

  // Admin Access Level - Full operational access
  [ACCESS_LEVELS.ADMIN]: [
    ...Object.values(PERMISSIONS.DASHBOARD),
    ...Object.values(PERMISSIONS.PRODUCTION),
    ...Object.values(PERMISSIONS.INVENTORY),
    ...Object.values(PERMISSIONS.SALES),
    ...Object.values(PERMISSIONS.EQUIPMENT),
    ...Object.values(PERMISSIONS.TEAM),
    ...Object.values(PERMISSIONS.REPORTS),
    PERMISSIONS.SETTINGS.VIEW,
    PERMISSIONS.SETTINGS.MANAGE_BREWERY,
    PERMISSIONS.SETTINGS.MANAGE_INTEGRATIONS
  ],

  // Supervisor Access Level - Management level access
  [ACCESS_LEVELS.SUPERVISOR]: [
    ...Object.values(PERMISSIONS.DASHBOARD),
    ...Object.values(PERMISSIONS.PRODUCTION),
    ...Object.values(PERMISSIONS.INVENTORY),
    ...Object.values(PERMISSIONS.SALES),
    PERMISSIONS.EQUIPMENT.VIEW,
    PERMISSIONS.EQUIPMENT.SCHEDULE_MAINTENANCE,
    PERMISSIONS.EQUIPMENT.RECORD_SERVICE,
    PERMISSIONS.TEAM.VIEW,
    ...Object.values(PERMISSIONS.REPORTS),
    PERMISSIONS.SETTINGS.VIEW
  ],

  // Standard Access Level - Regular employee access
  [ACCESS_LEVELS.STANDARD]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.PRODUCTION.VIEW,
    PERMISSIONS.PRODUCTION.VIEW_BATCH_DETAILS,
    PERMISSIONS.INVENTORY.VIEW,
    PERMISSIONS.SALES.VIEW,
    PERMISSIONS.EQUIPMENT.VIEW,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.SETTINGS.VIEW
  ],

  // Read Only Access Level - View only access
  [ACCESS_LEVELS.READ_ONLY]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.PRODUCTION.VIEW,
    PERMISSIONS.INVENTORY.VIEW,
    PERMISSIONS.SALES.VIEW,
    PERMISSIONS.EQUIPMENT.VIEW,
    PERMISSIONS.REPORTS.VIEW
  ]
}

// Department-specific permission additions
export const DEPARTMENT_PERMISSIONS = {
  [DEPARTMENTS.BREWING]: [
    ...Object.values(PERMISSIONS.PRODUCTION),
    PERMISSIONS.INVENTORY.MANAGE_STOCK,
    PERMISSIONS.EQUIPMENT.MANAGE_EQUIPMENT,
    PERMISSIONS.EQUIPMENT.RECORD_SERVICE
  ],

  [DEPARTMENTS.SALES]: [
    ...Object.values(PERMISSIONS.SALES),
    PERMISSIONS.INVENTORY.VIEW,
    PERMISSIONS.REPORTS.VIEW_SALES
  ],

  [DEPARTMENTS.QUALITY]: [
    PERMISSIONS.PRODUCTION.VIEW_BATCH_DETAILS,
    PERMISSIONS.PRODUCTION.EDIT_BATCH_STEPS,
    PERMISSIONS.INVENTORY.VIEW_COUNTS,
    PERMISSIONS.INVENTORY.PERFORM_COUNTS
  ],

  [DEPARTMENTS.MAINTENANCE]: [
    ...Object.values(PERMISSIONS.EQUIPMENT),
    PERMISSIONS.INVENTORY.VIEW,
    PERMISSIONS.INVENTORY.MANAGE_STOCK
  ],

  [DEPARTMENTS.ADMIN]: [
    ...Object.values(PERMISSIONS.TEAM),
    ...Object.values(PERMISSIONS.REPORTS),
    PERMISSIONS.SETTINGS.MANAGE_BREWERY,
    PERMISSIONS.SETTINGS.MANAGE_BILLING
  ]
}

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role, accessLevel, and department
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether user has the permission
 */
export function hasPermission(user, permission) {
  if (!user) return false

  // System-level role permissions (tenant owner, etc.)
  if (user.role && PERMISSION_MATRIX[user.role]) {
    if (PERMISSION_MATRIX[user.role].includes(permission)) {
      return true
    }
  }

  // Employee access level permissions
  if (user.accessLevel && PERMISSION_MATRIX[user.accessLevel]) {
    if (PERMISSION_MATRIX[user.accessLevel].includes(permission)) {
      return true
    }
  }

  // Department-specific permissions
  if (user.department && DEPARTMENT_PERMISSIONS[user.department]) {
    if (DEPARTMENT_PERMISSIONS[user.department].includes(permission)) {
      return true
    }
  }

  return false
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} - Whether user has any of the permissions
 */
export function hasAnyPermission(user, permissions) {
  return permissions.some(permission => hasPermission(user, permission))
}

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} - Whether user has all of the permissions
 */
export function hasAllPermissions(user, permissions) {
  return permissions.every(permission => hasPermission(user, permission))
}

/**
 * Get all permissions for a user
 * @param {Object} user - User object
 * @returns {Array} - Array of all permissions the user has
 */
export function getUserPermissions(user) {
  if (!user) return []

  const permissions = new Set()

  // Add system role permissions
  if (user.role && PERMISSION_MATRIX[user.role]) {
    PERMISSION_MATRIX[user.role].forEach(permission => permissions.add(permission))
  }

  // Add access level permissions
  if (user.accessLevel && PERMISSION_MATRIX[user.accessLevel]) {
    PERMISSION_MATRIX[user.accessLevel].forEach(permission => permissions.add(permission))
  }

  // Add department permissions
  if (user.department && DEPARTMENT_PERMISSIONS[user.department]) {
    DEPARTMENT_PERMISSIONS[user.department].forEach(permission => permissions.add(permission))
  }

  return Array.from(permissions)
}

/**
 * Filter navigation items based on user permissions
 * @param {Array} navigationItems - Navigation items to filter
 * @param {Object} user - User object
 * @returns {Array} - Filtered navigation items
 */
export function filterNavigationByPermissions(navigationItems, user) {
  return navigationItems.filter(item => {
    // If no permissions required, show to everyone
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true
    }

    // Check if user has any of the required permissions
    return hasAnyPermission(user, item.requiredPermissions)
  }).map(item => ({
    ...item,
    // Filter sub-items as well
    subItems: item.subItems ? filterNavigationByPermissions(item.subItems, user) : undefined
  }))
}

export default {
  ACCESS_LEVELS,
  DEPARTMENTS,
  SYSTEM_ROLES,
  PERMISSIONS,
  PERMISSION_MATRIX,
  DEPARTMENT_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  filterNavigationByPermissions
}