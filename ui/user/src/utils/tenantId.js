/**
 * ID Display Utilities
 *
 * Provides functions to display IDs (tenant, user, brewery) in a user-friendly format
 * while maintaining full IDs for all data operations.
 */

/**
 * Extracts the last 6 characters of a tenant ID for display purposes
 * @param {string} tenantId - Full tenant ID (UUID)
 * @returns {string} Last 6 characters of the tenant ID
 */
export const getDisplayId = (tenantId) => {
  if (!tenantId || typeof tenantId !== 'string') {
    return ''
  }

  // Remove dashes and get last 6 characters (lowercase to match standard GUID format)
  const cleanId = tenantId.replace(/-/g, '')
  return cleanId.slice(-6).toLowerCase()
}

/**
 * Formats a tenant ID for display with prefix
 * @param {string} tenantId - Full tenant ID (UUID)
 * @param {string} prefix - Optional prefix (defaults to 'ID: ')
 * @returns {string} Formatted display string
 */
export const formatDisplayId = (tenantId, prefix = 'ID: ') => {
  const displayId = getDisplayId(tenantId)
  return displayId ? `${prefix}${displayId}` : ''
}

/**
 * Creates a tooltip-friendly title with full tenant ID
 * @param {string} tenantId - Full tenant ID (UUID)
 * @returns {string} Full tenant ID for use in title attributes
 */
export const getFullIdTooltip = (tenantId) => {
  return tenantId ? `Full Tenant ID: ${tenantId}` : ''
}

/**
 * Generic function to get last 6 characters of any ID
 * @param {string} id - Full ID (UUID)
 * @returns {string} Last 6 characters of the ID
 */
export const getDisplayIdGeneric = (id) => {
  if (!id || typeof id !== 'string') {
    return ''
  }

  // Remove dashes and get last 6 characters (lowercase to match standard GUID format)
  const cleanId = id.replace(/-/g, '')
  return cleanId.slice(-6).toLowerCase()
}

/**
 * Generic function to format any ID for display with custom prefix
 * @param {string} id - Full ID (UUID)
 * @param {string} prefix - Custom prefix (e.g., 'Brewery: ', 'User: ')
 * @returns {string} Formatted display string
 */
export const formatDisplayIdGeneric = (id, prefix = 'ID: ') => {
  const displayId = getDisplayIdGeneric(id)
  return displayId ? `${prefix}${displayId}` : ''
}

/**
 * Generic function to create tooltip with full ID
 * @param {string} id - Full ID (UUID)
 * @param {string} label - Label for the ID type (e.g., 'Brewery ID', 'User ID')
 * @returns {string} Full ID for use in title attributes
 */
export const getFullIdTooltipGeneric = (id, label = 'ID') => {
  return id ? `Full ${label}: ${id}` : ''
}

/**
 * Generic function to copy any ID to clipboard
 * @param {string} id - Full ID to copy
 * @returns {Promise<boolean>} True if copy was successful
 */
export const copyIdToClipboard = async (id) => {
  if (!id) {
    return false
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(id)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = id
      textArea.style.position = 'absolute'
      textArea.style.left = '-999999px'
      document.body.prepend(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      textArea.remove()
      return success
    }
  } catch (error) {
    console.error('Failed to copy ID to clipboard:', error)
    return false
  }
}

/**
 * Validates if a string looks like a valid UUID
 * @param {string} id - ID to validate
 * @returns {boolean} True if it looks like a valid UUID
 */
export const isValidId = (id) => {
  if (!id || typeof id !== 'string') {
    return false
  }

  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Validates if a string looks like a valid UUID tenant ID
 * @param {string} tenantId - Tenant ID to validate
 * @returns {boolean} True if it looks like a valid UUID
 */
export const isValidTenantId = (tenantId) => {
  return isValidId(tenantId)
}

/**
 * Safely handles copying full tenant ID to clipboard
 * @param {string} tenantId - Full tenant ID to copy
 * @returns {Promise<boolean>} True if copy was successful
 */
export const copyTenantIdToClipboard = async (tenantId) => {
  if (!tenantId) {
    return false
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(tenantId)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = tenantId
      textArea.style.position = 'absolute'
      textArea.style.left = '-999999px'
      document.body.prepend(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      textArea.remove()
      return success
    }
  } catch (error) {
    console.error('Failed to copy tenant ID to clipboard:', error)
    return false
  }
}