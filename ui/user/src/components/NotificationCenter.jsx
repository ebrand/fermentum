import React, { useState, useEffect, useMemo, Fragment } from 'react'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import Modal, { ModalFooter } from './common/Modal'
import { PRIORITY_LEVELS, NOTIFICATION_CATEGORIES } from '../utils/notificationTypes'
import {
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  FunnelIcon,
  CheckIcon,
  EyeIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

const NotificationCenter = ({ isOpen, onClose }) => {
  const notifications = useAdvancedNotification()
  const [activeTab, setActiveTab] = useState('all')
  const [sortBy, setSortBy] = useState('priority') // priority, time, category
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showRead, setShowRead] = useState(true)
  const [showClearAllModal, setShowClearAllModal] = useState(false)
  const [showClearReadModal, setShowClearReadModal] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Get filtered and sorted notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications.getNotifications()

    // Apply tab filter
    switch (activeTab) {
      case 'unread':
        filtered = notifications.getNotifications({ unreadOnly: true })
        break
      case 'actionRequired':
        filtered = notifications.getNotifications({ actionRequired: true })
        break
      case 'critical':
        filtered = notifications.getNotifications({ priority: PRIORITY_LEVELS.CRITICAL })
        break
      default:
        filtered = notifications.getNotifications()
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority)
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.category === filterCategory)
    }

    // Apply read status filter
    if (!showRead) {
      filtered = filtered.filter(n => !n.isRead)
    }

    // Sort notifications
    switch (sortBy) {
      case 'priority':
        filtered.sort((a, b) => {
          const priorityWeights = {
            [PRIORITY_LEVELS.CRITICAL]: 5,
            [PRIORITY_LEVELS.HIGH]: 4,
            [PRIORITY_LEVELS.MEDIUM]: 3,
            [PRIORITY_LEVELS.LOW]: 2,
            [PRIORITY_LEVELS.INFO]: 1
          }
          return priorityWeights[b.priority] - priorityWeights[a.priority]
        })
        break
      case 'time':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category))
        break
    }

    return filtered
  }, [notifications, activeTab, sortBy, filterPriority, filterCategory, showRead])

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case PRIORITY_LEVELS.CRITICAL:
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case PRIORITY_LEVELS.HIGH:
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      case PRIORITY_LEVELS.MEDIUM:
        return <InformationCircleIcon className="h-5 w-5 text-yellow-500" />
      case PRIORITY_LEVELS.LOW:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority, notification) => {
    // For broadcast notifications with shared acknowledgment, show critical styling until acknowledged
    const needsCriticalStyling = notification.sharedAcknowledgment &&
      !notification.isAcknowledged &&
      (priority === PRIORITY_LEVELS.CRITICAL || priority === PRIORITY_LEVELS.HIGH)

    if (needsCriticalStyling) {
      return 'border-l-red-500 bg-red-50 ring-2 ring-red-200'
    }

    switch (priority) {
      case PRIORITY_LEVELS.CRITICAL:
        return 'border-l-red-500 bg-red-50'
      case PRIORITY_LEVELS.HIGH:
        return 'border-l-orange-500 bg-orange-50'
      case PRIORITY_LEVELS.MEDIUM:
        return 'border-l-yellow-500 bg-yellow-50'
      case PRIORITY_LEVELS.LOW:
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const handleNotificationAction = async (notification, action) => {
    switch (action) {
      case 'read':
        await notifications.markAsRead(notification.id)
        break
      case 'acknowledge':
        await notifications.markAsAcknowledged(notification.id)
        break
      case 'remove':
        await notifications.removePersistentNotification(notification.id)
        break
      case 'open':
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl
        }
        break
    }
  }

  const handleMarkAllRead = async () => {
    // Use the new bulk endpoint for better performance
    await notifications.markAllAsRead()
  }

  const handleClearAll = () => {
    setShowClearAllModal(true)
  }

  const handleClearRead = () => {
    setShowClearReadModal(true)
  }

  const confirmClearAll = async () => {
    setIsClearing(true)
    try {
      await notifications.clearAllNotifications()
    } finally {
      setIsClearing(false)
      setShowClearAllModal(false)
    }
  }

  const confirmClearRead = async () => {
    setIsClearing(true)
    try {
      await notifications.clearReadNotifications()
    } finally {
      setIsClearing(false)
      setShowClearReadModal(false)
    }
  }

  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    try {
      await notifications.refreshNotifications()
      console.log('✅ Manual refresh completed')
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
    }
  }

  const counts = notifications.getNotificationCounts()

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Notifications"
        icon={<BellIcon />}
        iconBgColor="bg-blue-100"
        iconTextColor="text-blue-600"
        size="xl"
        className="max-w-4xl"
      >
        <div className="flex flex-col max-h-[80vh]">
          {/* Header with unread count */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            {counts.unread > 0 && (
              <div className="mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {counts.unread} unread
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1">
              {[
                { id: 'all', label: 'All', count: counts.total },
                { id: 'unread', label: 'Unread', count: counts.unread },
                { id: 'actionRequired', label: 'Action', count: counts.actionRequired },
                { id: 'critical', label: 'Critical', count: counts.critical }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 text-xs">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="border-b border-gray-200 pb-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="priority">Priority</option>
                  <option value="time">Time</option>
                  <option value="category">Category</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All Priorities</option>
                  <option value={PRIORITY_LEVELS.CRITICAL}>Critical</option>
                  <option value={PRIORITY_LEVELS.HIGH}>High</option>
                  <option value={PRIORITY_LEVELS.MEDIUM}>Medium</option>
                  <option value={PRIORITY_LEVELS.LOW}>Low</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllRead}
                  className="w-[130px] px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={counts.unread === 0}
                >
                  Mark All Read
                </button>
                <button
                  onClick={handleClearRead}
                  className="w-[130px] px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={filteredNotifications.filter(n => n.isRead).length === 0}
                >
                  Clear Read
                </button>
                <button
                  onClick={handleClearAll}
                  className="w-[130px] px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 border border-red-200 rounded-full transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <BellIcon className="h-12 w-12 mb-4" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y-1 divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-[15px] transition-all duration-200 ${getPriorityColor(notification.priority, notification)
                      } ${!notification.isRead
                        ? 'bg-blue-50 border-r-4 border-r-blue-200 shadow-sm hover:bg-blue-100'
                        : 'bg-gray-100 hover:bg-gray-150'}`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Notification content wrapper - this will be grayed out when read */}
                      <div className={`flex items-start space-x-3 flex-1 transition-opacity duration-200 ${
                        notification.isRead ? 'opacity-60' : 'opacity-100'
                      }`}>
                        <div className="flex-shrink-0 pt-1">
                          {getPriorityIcon(notification.priority)}
                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center justify-between">
                            <p className={`text-sm transition-colors ${notification.isRead
                                ? 'text-gray-500 font-normal'
                                : 'text-gray-900 font-semibold'
                              }`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2">
                              {!notification.isRead && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">NEW</span>
                                </div>
                              )}
                              <span className={`text-xs ${
                                notification.isRead ? 'text-gray-400' : 'text-gray-600 font-medium'
                              }`}>
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                            </div>
                          </div>

                          <p className={`mt-2 text-sm transition-colors ${notification.isRead
                              ? 'text-gray-400 line-through decoration-1'
                              : 'text-gray-800 font-medium'
                            }`}>
                            {notification.message}
                          </p>

                          {notification.actionRequired && !notification.isAcknowledged && (
                            <div className="mt-2 flex items-center text-xs text-orange-600">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              Action Required
                            </div>
                          )}

                          {notification.sharedAcknowledgment && notification.isAcknowledged && (
                            <div className="mt-2 flex items-center text-xs text-green-600">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Acknowledged by team member
                            </div>
                          )}

                          {/* Broadcast */}
                          {notification.isBroadcast && (
                            <div className="mt-2 flex items-center text-xs text-blue-600">
                              <BellIcon className="h-4 w-4 mr-1" />
                              Broadcast to {notification.broadcastRoles?.join(', ') || 'team'}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between">

                            {/* Category & source */}
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {notification.category}
                              </span>
                              <span className="text-xs text-gray-500">
                                {notification.source}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons - separate from content wrapper so they stay fully visible */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center space-x-1">
                            {/* Critical notifications: Only show Acknowledge button until acknowledged */}
                            {notification.priority === PRIORITY_LEVELS.CRITICAL && !notification.isAcknowledged ? (
                              <button
                                onClick={() => handleNotificationAction(notification, 'acknowledge')}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors flex items-center space-x-1"
                                title="Acknowledge Critical Alert"
                              >
                                <CheckIcon className="h-3 w-3" />
                                <span>Acknowledge</span>
                              </button>
                            ) : (
                              <>
                                {/* Non-critical notifications: Show standard action buttons */}
                                {!notification.isRead && (
                                  <button
                                    onClick={() => handleNotificationAction(notification, 'read')}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full border border-blue-200 transition-colors flex items-center space-x-1"
                                    title="Mark as read"
                                  >
                                    <EyeIcon className="h-3 w-3" />
                                    <span>Mark Read</span>
                                  </button>
                                )}

                                {notification.actionRequired && !notification.isAcknowledged && (
                                  <button
                                    onClick={() => handleNotificationAction(notification, 'acknowledge')}
                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Acknowledge"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                )}

                                {notification.actionUrl && (
                                  <button
                                    onClick={() => handleNotificationAction(notification, 'open')}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Open"
                                  >
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleNotificationAction(notification, 'remove')}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Clear All Notifications"
        icon={<TrashIcon />}
        iconBgColor="bg-red-100"
        iconTextColor="text-red-600"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to clear all notifications? This action cannot be undone.
          </p>
          <p className="text-sm text-gray-500">
            All {counts.total} notifications will be permanently removed.
          </p>
        </div>

        <ModalFooter
          secondaryAction={() => setShowClearAllModal(false)}
          secondaryLabel="Cancel"
          primaryAction={confirmClearAll}
          primaryLabel="Clear All"
          primaryVariant="danger"
          isPrimaryLoading={isClearing}
          isPrimaryDisabled={isClearing}
        />
      </Modal>

      {/* Clear Read Confirmation Modal */}
      <Modal
        isOpen={showClearReadModal}
        onClose={() => setShowClearReadModal(false)}
        title="Clear Read Notifications"
        icon={<TrashIcon />}
        iconBgColor="bg-orange-100"
        iconTextColor="text-orange-600"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to clear all read notifications? This action cannot be undone.
          </p>
          <p className="text-sm text-gray-500">
            {filteredNotifications.filter(n => n.isRead).length} read notifications will be permanently removed.
          </p>
        </div>

        <ModalFooter
          secondaryAction={() => setShowClearReadModal(false)}
          secondaryLabel="Cancel"
          primaryAction={confirmClearRead}
          primaryLabel="Clear Read"
          primaryVariant="danger"
          isPrimaryLoading={isClearing}
          isPrimaryDisabled={isClearing}
        />
      </Modal>
    </>
  )
}

export default NotificationCenter