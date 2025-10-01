import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useSession } from './SessionContext'
import { useSignalR } from './SignalRContext'
import { notificationsAPI } from '../utils/api'
import {
  NOTIFICATION_TYPES,
  PRIORITY_LEVELS,
  getNotificationConfig,
  shouldUserReceiveNotification,
  getPriorityWeight
} from '../utils/notificationTypes'
import NotificationToast from '../components/NotificationToast'

const AdvancedNotificationContext = createContext()

export const useAdvancedNotification = () => {
  const context = useContext(AdvancedNotificationContext)
  if (!context) {
    throw new Error('useAdvancedNotification must be used within an AdvancedNotificationProvider')
  }
  return context
}

export const AdvancedNotificationProvider = ({ children }) => {
  console.log('🚀 [NOTIFICATION PROVIDER] AdvancedNotificationProvider initializing...')
  // Basic toast notifications (existing functionality)
  const [toastNotifications, setToastNotifications] = useState([])

  // Advanced persistent notifications queue (loaded from API)
  const [persistentNotifications, setPersistentNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Event listeners registry
  const eventListenersRef = useRef(new Map())

  // Auto-cleanup timers
  const cleanupTimersRef = useRef(new Map())

  const { user, currentTenant, session, loading } = useSession()
  const { addEventListener, removeEventListener, isConnected } = useSignalR()

  // Debug: Monitor session state changes
  useEffect(() => {
    console.log('🔍 [SESSION DEBUG] Session state changed:', {
      hasUser: !!user,
      hasCurrentTenant: !!currentTenant,
      hasSession: !!session,
      loading: loading,
      userId: user?.userId || 'NO_USER',
      tenantId: currentTenant?.tenantId || 'NO_TENANT',
      sessionUserId: session?.userId || 'NO_SESSION_USER',
      sessionCurrentTenantId: session?.currentTenantId || 'NO_SESSION_TENANT'
    })
  }, [user, currentTenant, session, loading])


  // Cleanup expired notifications periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date()
      setPersistentNotifications(prev =>
        prev.filter(notification => {
          if (notification.expiresAt && new Date(notification.expiresAt) < now) {
            return false
          }
          return true
        })
      )
    }, 60000) // Check every minute

    return () => clearInterval(cleanupInterval)
  }, [])

  // Generate unique notification ID
  const generateNotificationId = useCallback(() => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // BASIC TOAST FUNCTIONALITY (backward compatibility)
  const addToastNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = generateNotificationId()
    const notification = { id, message, type, duration }

    setToastNotifications(prev => [...prev, notification])

    return id
  }, [generateNotificationId])

  const removeToastNotification = useCallback((id) => {
    setToastNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  // Backward compatibility methods
  const showSuccess = useCallback((message, duration) => {
    return addToastNotification(message, 'success', duration)
  }, [addToastNotification])

  const showError = useCallback((message, duration) => {
    return addToastNotification(message, 'error', duration)
  }, [addToastNotification])

  const showWarning = useCallback((message, duration) => {
    return addToastNotification(message, 'warning', duration)
  }, [addToastNotification])

  const showInfo = useCallback((message, duration) => {
    return addToastNotification(message, 'info', duration)
  }, [addToastNotification])

  const showNotification = useCallback((message, type = 'info', duration) => {
    return addToastNotification(message, type, duration)
  }, [addToastNotification])

  // ADVANCED NOTIFICATION FUNCTIONALITY

  // API helper to create notification via backend
  const createNotificationViaAPI = useCallback(async (notificationData) => {
    if (!user || !currentTenant) return null

    try {
      const response = await notificationsAPI.createNotification({
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        source: notificationData.source,
        actionUrl: notificationData.actionUrl,
        expiresAt: notificationData.expiresAt?.toISOString(),
        bypassRoleFilter: notificationData.bypassRoleFilter
      })

      if (response.status === 200) {
        return response.data.notificationId
      }
    } catch (error) {
      console.error('Failed to create notification via API:', error)
    }

    return null
  }, [user, currentTenant])

  /**
   * Create a persistent notification that appears in the notification center
   * @param {Object} notificationData - Notification configuration
   * @param {string} notificationData.type - Notification type from NOTIFICATION_TYPES
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Object} notificationData.data - Additional data payload
   * @param {Array} notificationData.targetRoles - Override roles (optional)
   * @param {string} notificationData.tenantId - Target tenant (optional)
   * @param {Date} notificationData.expiresAt - Expiration date (optional)
   * @param {Object} notificationData.actionUrl - URL for action button (optional)
   * @param {string} notificationData.source - Source system/component
   * @param {boolean} notificationData.bypassRoleFilter - For test notifications
   */
  const createNotification = useCallback(async (notificationData) => {
    // For test notifications or when API is unavailable, use local storage
    if (notificationData.bypassRoleFilter || !user || !currentTenant) {
      return createLocalNotification(notificationData)
    }

    // For real notifications, use API
    try {
      const notificationId = await createNotificationViaAPI(notificationData)
      if (notificationId) {
        return notificationId
      } else {
        // Fallback to local storage if API fails
        return createLocalNotification(notificationData)
      }
    } catch (error) {
      console.error('API notification failed, falling back to local:', error)
      return createLocalNotification(notificationData)
    }
  }, [user, currentTenant, createNotificationViaAPI])

  // Local notification creation (for test mode and fallback)
  const createLocalNotification = useCallback((notificationData) => {
    const config = getNotificationConfig(notificationData.type)
    const userRole = user?.role || user?.currentRole || 'user'

    // Check if user should receive this notification (unless bypassed for testing)
    const targetRoles = notificationData.targetRoles || config.targetRoles
    if (!notificationData.bypassRoleFilter && !targetRoles.includes(userRole)) {
      console.log(`🔕 User role '${userRole}' not in target roles [${targetRoles.join(', ')}] for notification type '${notificationData.type}'`)
      return null
    }

    // Log when role filter is bypassed
    if (notificationData.bypassRoleFilter) {
      console.log(`⚠️ Role filter bypassed for notification type '${notificationData.type}' (user role: '${userRole}', target roles: [${targetRoles.join(', ')}])`)
    }

    const id = generateNotificationId()
    const now = new Date()

    // Calculate expiration
    let expiresAt = null
    if (config.autoExpire) {
      expiresAt = notificationData.expiresAt || new Date(now.getTime() + (24 * 60 * 60 * 1000)) // Default 24 hours
    }

    const notification = {
      id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      priority: config.priority,
      category: config.category,
      icon: config.icon,
      color: config.color,
      actionRequired: config.actionRequired,
      actionUrl: notificationData.actionUrl,
      source: notificationData.source,
      tenantId: notificationData.tenantId || currentTenant?.tenantId,
      userId: user?.userId,
      createdAt: now,
      expiresAt,
      readAt: null,
      acknowledgedAt: null,
      isRead: false,
      isAcknowledged: false
    }

    // Add to persistent notifications
    setPersistentNotifications(prev => {
      const newNotifications = [...prev, notification]
      // Sort by priority and creation time
      return newNotifications.sort((a, b) => {
        const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    })

    // Show as toast for high priority notifications
    if ([PRIORITY_LEVELS.CRITICAL, PRIORITY_LEVELS.HIGH].includes(config.priority)) {
      addToastNotification(
        `${notification.title}: ${notification.message}`,
        config.priority === PRIORITY_LEVELS.CRITICAL ? 'error' : 'warning',
        config.priority === PRIORITY_LEVELS.CRITICAL ? 0 : 8000 // Critical notifications don't auto-dismiss
      )
    }

    // Set up auto-cleanup timer if needed
    if (expiresAt) {
      const timeoutId = setTimeout(() => {
        removeNotification(id)
      }, expiresAt.getTime() - now.getTime())

      cleanupTimersRef.current.set(id, timeoutId)
    }

    console.log(`📢 Created local notification: ${notification.type} for user ${userRole}`)
    return id
  }, [user, currentTenant, generateNotificationId, addToastNotification])

  /**
   * Mark notification as read (API integrated)
   */
  const markAsRead = useCallback(async (notificationId) => {
    // TEMPORARY: Bypass session check for testing since API uses hardcoded auth
    console.log('🚧 [DEBUG] Mark As Read - Session state:', {
      hasUser: !!user,
      hasCurrentTenant: !!currentTenant,
      userId: user?.userId || 'NO_USER',
      tenantId: currentTenant?.tenantId || 'NO_TENANT',
      notificationId
    })

    // if (!user || !currentTenant) return false

    try {
      console.log('🔄 [DEBUG] Calling markAsRead API for notification:', notificationId)
      const response = await notificationsAPI.markAsRead(notificationId)
      console.log('✅ [DEBUG] Mark As Read API response:', response)

      if (response.status === 200) {
        // Update local state immediately for better UX
        setPersistentNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        )
        console.log('✅ [DEBUG] Updated notification state to read:', notificationId)
        return true
      }
    } catch (error) {
      console.error('❌ [DEBUG] Failed to mark notification as read:', error)
    }

    return false
  }, [user, currentTenant])

  /**
   * Mark notification as acknowledged (API integrated)
   */
  const markAsAcknowledged = useCallback(async (notificationId) => {
    // TEMPORARY: Bypass session check for testing since API uses hardcoded auth
    console.log('✅ [DEBUG] Mark As Acknowledged - Session state:', {
      hasUser: !!user,
      hasCurrentTenant: !!currentTenant,
      userId: user?.userId || 'NO_USER',
      tenantId: currentTenant?.tenantId || 'NO_TENANT',
      notificationId
    })

    // if (!user || !currentTenant) return false

    try {
      console.log('🔄 [DEBUG] Calling markAsAcknowledged API for notification:', notificationId)
      const response = await notificationsAPI.markAsAcknowledged(notificationId)
      console.log('✅ [DEBUG] Mark As Acknowledged API response:', response)

      if (response.status === 200) {
        // For shared acknowledgment notifications, refresh from API to get updated status
        // Otherwise just update locally for better UX
        const notification = persistentNotifications.find(n => n.id === notificationId)
        if (notification?.sharedAcknowledgment) {
          // Delay refresh slightly to ensure API update is committed
          setTimeout(() => {
            loadNotifications()
          }, 100)
        } else {
          setPersistentNotifications(prev =>
            prev.map(notification =>
              notification.id === notificationId
                ? {
                    ...notification,
                    isAcknowledged: true,
                    acknowledgedAt: new Date(),
                    // Acknowledging also marks as read (user has seen and processed the notification)
                    isRead: true,
                    readAt: notification.isRead ? notification.readAt : new Date()
                  }
                : notification
            )
          )
        }
        return true
      }
    } catch (error) {
      console.error('Failed to acknowledge notification:', error)
    }

    return false
  }, [user, currentTenant])

  /**
   * Remove notification from queue (API integrated)
   */
  const removeNotification = useCallback(async (notificationId) => {
    console.log('🗑️ [DEBUG] Removing notification with optimistic UI update:', notificationId)

    // Optimistic UI update - remove from state immediately for better UX
    setPersistentNotifications(prev => {
      console.log('🗑️ [DEBUG] Previous notifications:', prev.map(n => ({ id: n.id, title: n.title })))
      const filtered = prev.filter(notification => {
        const shouldKeep = notification.id !== notificationId
        console.log(`🗑️ [DEBUG] Notification ${notification.id}: shouldKeep=${shouldKeep} (looking for ${notificationId})`)
        return shouldKeep
      })
      console.log('🗑️ [DEBUG] Filtered notifications:', filtered.map(n => ({ id: n.id, title: n.title })))
      return filtered
    })

    // Clear cleanup timer
    const timeoutId = cleanupTimersRef.current.get(notificationId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      cleanupTimersRef.current.delete(notificationId)
      console.log('🗑️ [DEBUG] Cleared timer for notification:', notificationId)
    }

    // Now make the API call to persist the removal on backend
    try {
      console.log('🗑️ [DEBUG] Calling removeNotification API for notification:', notificationId)
      const response = await notificationsAPI.removeNotification(notificationId)
      console.log('✅ [DEBUG] Remove Notification API response:', response)

      if (response.status === 200) {
        console.log('✅ [DEBUG] Backend deletion successful')
        return true
      } else {
        console.warn('⚠️ [DEBUG] Backend deletion returned non-200 status:', response.status)
        // Don't revert UI state - user already saw the removal
        return false
      }
    } catch (error) {
      console.error('❌ [DEBUG] Failed to remove notification from backend:', error)
      // Don't revert UI state - user already saw the removal
      // In a production app, you might want to show a "retry" option or revert the optimistic update
      return false
    }
  }, [user, currentTenant])

  /**
   * Clear all notifications for current user (Frontend-only approach to preserve unacknowledged)
   */
  const clearAllNotifications = useCallback(async () => {
    console.log('🚧 [DEBUG] Clear All - Using frontend-only approach to preserve unacknowledged notifications')

    try {
      // Filter to keep ONLY unacknowledged CRITICAL notifications (most restrictive)
      const unacknowledgedNotifications = persistentNotifications.filter(n => {
        const isCritical = n.priority === PRIORITY_LEVELS.CRITICAL
        const isActionRequired = n.actionRequired
        const isUnacknowledged = !n.isAcknowledged

        // ONLY preserve critical notifications that are unacknowledged
        // Clear everything else including action-required but non-critical notifications
        const shouldPreserve = isUnacknowledged && isCritical

        console.log(`🔍 [DEBUG] Notification ${n.id} (${n.title}): critical=${isCritical}, actionRequired=${isActionRequired}, unacknowledged=${isUnacknowledged}, preserve=${shouldPreserve}`)

        return shouldPreserve
      })

      // Get notifications that will be cleared (for individual API removal)
      const notificationsToRemove = persistentNotifications.filter(n =>
        !unacknowledgedNotifications.some(kept => kept.id === n.id)
      )

      console.log('🔄 [DEBUG] Removing individual notifications to preserve unacknowledged:', {
        totalNotifications: persistentNotifications.length,
        toRemove: notificationsToRemove.length,
        toPreserve: unacknowledgedNotifications.length,
        preservedTitles: unacknowledgedNotifications.map(n => n.title)
      })

      // Remove each notification individually from backend
      const removePromises = notificationsToRemove.map(async (notification) => {
        try {
          await notificationsAPI.removeNotification(notification.id)
          console.log('✅ [DEBUG] Removed notification from backend:', notification.id)
          return true
        } catch (error) {
          console.error('❌ [DEBUG] Failed to remove notification from backend:', notification.id, error)
          return false
        }
      })

      // Wait for all removal operations
      await Promise.all(removePromises)

      // Update frontend state to keep only unacknowledged notifications
      setPersistentNotifications(unacknowledgedNotifications)

      // Clear timers only for removed notifications
      notificationsToRemove.forEach(notification => {
        const timeoutId = cleanupTimersRef.current.get(notification.id)
        if (timeoutId) {
          clearTimeout(timeoutId)
          cleanupTimersRef.current.delete(notification.id)
        }
      })

      console.log('✅ [DEBUG] Clear All completed - preserved unacknowledged notifications')
      console.log('🔒 [DEBUG] Preserved notifications:', unacknowledgedNotifications.map(n => ({
        id: n.id,
        title: n.title,
        priority: n.priority,
        isAcknowledged: n.isAcknowledged
      })))

      return true
    } catch (error) {
      console.error('❌ [DEBUG] Failed to clear notifications:', error)
      return false
    }
  }, [persistentNotifications])

  /**
   * Mark all notifications as read for current user (API integrated)
   */
  const markAllAsRead = useCallback(async () => {
    if (!user || !currentTenant) return false

    try {
      const unreadCountBefore = persistentNotifications.filter(n => !n.isRead).length
      const response = await notificationsAPI.markAllAsRead()

      if (response.status === 200) {
        // Update local state to mark all notifications as read
        setPersistentNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            isRead: true,
            readAt: notification.isRead ? notification.readAt : new Date()
          }))
        )

        console.log(`Successfully marked ${unreadCountBefore} notifications as read`)
        return true
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }

    return false
  }, [user, currentTenant, persistentNotifications])

  /**
   * Get notifications with filtering options
   */
  const getNotifications = useCallback((filters = {}) => {
    let notifications = persistentNotifications

    // Filter by category
    if (filters.category) {
      notifications = notifications.filter(n => n.category === filters.category)
    }

    // Filter by priority
    if (filters.priority) {
      notifications = notifications.filter(n => n.priority === filters.priority)
    }

    // Filter by read status
    if (filters.unreadOnly) {
      notifications = notifications.filter(n => !n.isRead)
    }

    // Filter by action required
    if (filters.actionRequired) {
      notifications = notifications.filter(n => n.actionRequired && !n.isAcknowledged)
    }

    return notifications
  }, [persistentNotifications])

  /**
   * Get notification counts for different categories
   */
  const getNotificationCounts = useCallback(() => {
    const counts = {
      total: persistentNotifications.length,
      unread: persistentNotifications.filter(n => !n.isRead).length,
      actionRequired: persistentNotifications.filter(n => n.actionRequired && !n.isAcknowledged).length,
      critical: persistentNotifications.filter(n => n.priority === PRIORITY_LEVELS.CRITICAL).length,
      high: persistentNotifications.filter(n => n.priority === PRIORITY_LEVELS.HIGH).length
    }
    return counts
  }, [persistentNotifications])

  // EVENT-DRIVEN REGISTRATION SYSTEM

  /**
   * Register event listener for notification triggers
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Handler function that creates notifications
   * @param {string} source - Source identifier for cleanup
   */
  const registerEventListener = useCallback((eventType, handler, source) => {
    if (!eventListenersRef.current.has(eventType)) {
      eventListenersRef.current.set(eventType, new Map())
    }

    const listeners = eventListenersRef.current.get(eventType)
    listeners.set(source, handler)

    console.log(`📝 Registered notification listener for '${eventType}' from '${source}'`)
  }, [])

  /**
   * Unregister event listener
   */
  const unregisterEventListener = useCallback((eventType, source) => {
    const listeners = eventListenersRef.current.get(eventType)
    if (listeners) {
      listeners.delete(source)
      if (listeners.size === 0) {
        eventListenersRef.current.delete(eventType)
      }
      console.log(`🗑️ Unregistered notification listener for '${eventType}' from '${source}'`)
    }
  }, [])

  /**
   * Trigger event that may create notifications
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data payload
   */
  const triggerEvent = useCallback((eventType, eventData) => {
    const listeners = eventListenersRef.current.get(eventType)
    if (listeners) {
      listeners.forEach((handler, source) => {
        try {
          handler(eventData, createNotification)
        } catch (error) {
          console.error(`Error in notification handler for '${eventType}' from '${source}':`, error)
        }
      })
    }
  }, [createNotification])

  // API integration functions
  const loadNotifications = useCallback(async () => {
    console.log('🚀 [NOTIFICATION DEBUG] loadNotifications called with:', {
      user: user ? `${user.firstName} ${user.lastName} (${user.userId})` : null,
      currentTenant: currentTenant ? `${currentTenant.name} (${currentTenant.tenantId})` : null
    })

    // TEMPORARY: Since backend uses hardcoded values, just check for valid tokens
    const hasValidTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')

    if (!hasValidTokens) {
      console.log('❌ [NOTIFICATION DEBUG] loadNotifications early return - no valid tokens')
      return
    }

    console.log('✅ [NOTIFICATION DEBUG] Loading notifications with valid tokens')

    console.log('📡 [NOTIFICATION DEBUG] Making API call to notificationsAPI.getNotifications()')
    setIsLoading(true)
    try {
      const response = await notificationsAPI.getNotifications()
      console.log('✅ [NOTIFICATION DEBUG] API response received:', {
        status: response.status,
        dataLength: response.data ? response.data.length : 0,
        data: response.data
      })
      const notifications = response.data
      setPersistentNotifications(notifications.map(n => ({
        ...n,
        id: n.id,
        createdAt: new Date(n.createdAt),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : null,
        readAt: n.readAt ? new Date(n.readAt) : null,
        acknowledgedAt: n.acknowledgedAt ? new Date(n.acknowledgedAt) : null,
        // Broadcast notification fields
        isBroadcast: n.isBroadcast || false,
        broadcastRoles: n.broadcastRoles || [],
        sharedAcknowledgment: n.sharedAcknowledgment || false,
        acknowledgedByUserId: n.acknowledgedByUserId || null
      })))
    } catch (error) {
      console.error('❌ [NOTIFICATION DEBUG] Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, currentTenant])

  /**
   * Clear only read notifications for current user (API integrated)
   */
  const clearReadNotifications = useCallback(async () => {
    // TEMPORARY: Backend uses hardcoded values, so session validation not required
    // TODO: Re-enable session validation when SessionContext provides proper user/tenant data

    try {

      const response = await notificationsAPI.clearReadNotifications()
      console.log(`🧹 [CLEAR READ] API response:`, response.data)

      if (response.status === 200) {
        const clearedCount = response.data?.clearedCount || 0
        console.log(`🧹 [CLEAR READ] Backend cleared ${clearedCount} read notifications`)

        // Refresh notifications from backend to get updated state
        console.log(`🧹 [CLEAR READ] Refreshing notifications from backend...`)
        console.log(`🧹 [CLEAR READ] Current notifications before refresh:`, persistentNotifications.length)

        await loadNotifications()

        console.log(`🧹 [CLEAR READ] Current notifications after refresh:`, persistentNotifications.length)
        console.log(`✅ [CLEAR READ] Successfully cleared ${clearedCount} read notifications and refreshed state`)
        return true
      }
    } catch (error) {
      console.error('❌ [CLEAR READ] Failed to clear read notifications:', error)
    }

    return false
  }, [user, currentTenant, loadNotifications, persistentNotifications.length])

  // Load notifications on mount and when user/tenant changes
  useEffect(() => {
    console.log('🔍 [NOTIFICATION DEBUG] Auto-load effect triggered')

    // TEMPORARY: Since backend uses hardcoded values, just check for valid tokens
    const hasValidTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')

    if (hasValidTokens && !loading) {
      console.log('✅ [NOTIFICATION DEBUG] Loading notifications with valid tokens')
      loadNotifications()
    } else {
      console.log('❌ [NOTIFICATION DEBUG] Conditions not met for auto-load:', {
        hasValidTokens,
        loading
      })
    }
  }, [loadNotifications, loading])

  // Additional effect to load notifications on component mount
  useEffect(() => {
    console.log('🚀 [NOTIFICATION DEBUG] Mount effect - checking for tokens on mount')
    const hasValidTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')

    if (hasValidTokens) {
      console.log('🚀 [NOTIFICATION DEBUG] Found tokens on mount - loading notifications')
      loadNotifications()
    } else {
      console.log('❌ [NOTIFICATION DEBUG] No valid tokens found on mount')
    }
  }, []) // Empty dependency array = runs once on mount

  // Additional effect to trigger loading when tokens are available (more aggressive)
  // TEMPORARILY DISABLED: This was causing notifications to reload immediately after removal
  // useEffect(() => {
  //   const hasValidTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')

  //   if (hasValidTokens && persistentNotifications.length === 0 && !isLoading) {
  //     console.log('🚀 [NOTIFICATION DEBUG] AGGRESSIVE LOAD - have tokens, no notifications loaded, not currently loading')
  //     loadNotifications()
  //   }
  // }, [loadNotifications, persistentNotifications.length, isLoading])

  // Load notifications when session finishes loading
  useEffect(() => {
    if (!loading && session && user && !currentTenant) {
      console.log('🔄 [NOTIFICATION DEBUG] Session loaded but no tenant selected - checking if we can load notifications anyway')
      console.log('🔄 [NOTIFICATION DEBUG] Available tenants:', session.tenants?.map(t => ({ id: t.tenantId, name: t.name })))

      // Try to load notifications anyway since we have session and user
      const hasValidTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')
      if (hasValidTokens) {
        console.log('🚀 [NOTIFICATION DEBUG] Loading notifications with session and valid tokens')
        loadNotifications()
      }
    }
  }, [loading, session, user, currentTenant, loadNotifications])

  // Load notifications when localStorage tokens are detected (on app mount)
  // TEMPORARILY DISABLED: This was also causing notifications to reload after removal
  // useEffect(() => {
  //   const checkTokensInterval = setInterval(() => {
  //     const hasValidTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')

  //     if (hasValidTokens && persistentNotifications.length === 0 && !isLoading) {
  //       console.log('🔄 [NOTIFICATION DEBUG] INTERVAL CHECK - Loading notifications with valid tokens')
  //       loadNotifications()
  //       clearInterval(checkTokensInterval)
  //     }
  //   }, 1000)

  //   // Clean up after 10 seconds
  //   setTimeout(() => clearInterval(checkTokensInterval), 10000)

  //   return () => clearInterval(checkTokensInterval)
  // }, [])


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimersRef.current.forEach(timeoutId => clearTimeout(timeoutId))
      cleanupTimersRef.current.clear()
    }
  }, [])

  // SignalR real-time notification updates
  useEffect(() => {
    if (!isConnected || !addEventListener) {
      console.log('🔌 [SignalR] Not connected or no event listener available')
      return
    }

    console.log('📡 [SignalR] Setting up notification event listeners...')

    // Handle notification updates
    const handleNotificationUpdate = (data) => {
      console.log('📡 [SignalR] Received notification update:', data)

      switch (data.EventType) {
        case 'NotificationCreated':
          console.log('📬 [SignalR] New notification created, refreshing list')
          loadNotifications()
          break

        case 'NotificationRead':
          console.log('👁️ [SignalR] Notification marked as read, updating UI')
          setPersistentNotifications(prev =>
            prev.map(n =>
              n.id === data.Data?.NotificationId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            )
          )
          break

        case 'NotificationRemoved':
          console.log('🗑️ [SignalR] Notification removed, updating UI')
          setPersistentNotifications(prev =>
            prev.filter(n => n.id !== data.Data?.NotificationId)
          )
          break

        case 'AllNotificationsRead':
          console.log('📚 [SignalR] All notifications marked as read')
          setPersistentNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
          )
          break

        default:
          console.log('❓ [SignalR] Unknown notification event type:', data.EventType)
      }
    }

    // Handle assignment updates
    const handleAssignmentUpdate = (data) => {
      console.log('📡 [SignalR] Received assignment update:', data)

      switch (data.EventType) {
        case 'AssignmentAssigned':
          addToastNotification('You have been assigned a new task', 'info', 8000)
          break

        case 'AssignmentStarted':
          addToastNotification('An assignment has been started', 'info', 5000)
          break

        case 'AssignmentCompleted':
          addToastNotification('An assignment has been completed', 'success', 5000)
          break

        default:
          console.log('❓ [SignalR] Unknown assignment event type:', data.EventType)
      }
    }

    // Add event listeners
    addEventListener('NotificationUpdate', handleNotificationUpdate)
    addEventListener('AssignmentUpdate', handleAssignmentUpdate)

    console.log('✅ [SignalR] Notification event listeners registered')

    // Cleanup function
    return () => {
      console.log('🧹 [SignalR] Cleaning up notification event listeners')
      removeEventListener('NotificationUpdate')
      removeEventListener('AssignmentUpdate')
    }
  }, [isConnected, addEventListener, removeEventListener, loadNotifications, addToastNotification])

  const value = {
    // Backward compatibility (existing toast system)
    addNotification: addToastNotification,
    removeNotification: removeToastNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,

    // Advanced notification system
    createNotification,
    markAsRead,
    markAsAcknowledged,
    removePersistentNotification: removeNotification,
    clearAllNotifications,
    clearReadNotifications,
    markAllAsRead,
    getNotifications,
    getNotificationCounts,

    // Event system
    registerEventListener,
    unregisterEventListener,
    triggerEvent,

    // State
    persistentNotifications,
    notificationCounts: getNotificationCounts(),
    isLoading,

    // API integration
    refreshNotifications: loadNotifications
  }

  return (
    <AdvancedNotificationContext.Provider value={value}>
      {children}

      {/* Toast notifications (existing functionality) */}
      <div className="fixed top-4 right-4 z-[60] space-y-3">
        {toastNotifications.map((notification) => (
          <div key={notification.id} className="transform transition-all duration-200 ease-out">
            <NotificationToast
              show={true}
              message={notification.message}
              type={notification.type}
              duration={notification.duration}
              onClose={() => removeToastNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </AdvancedNotificationContext.Provider>
  )
}

// Context exports
export { AdvancedNotificationContext }
export default AdvancedNotificationProvider