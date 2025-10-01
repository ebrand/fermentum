import React, { useState, useEffect } from 'react'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import NotificationCenter from './NotificationCenter'
import { PRIORITY_LEVELS } from '../utils/notificationTypes'
import {
  BellIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const NotificationBell = ({ className = '' }) => {
  const notifications = useAdvancedNotification()
  const [showCenter, setShowCenter] = useState(false)
  const [animate, setAnimate] = useState(false)

  const counts = notifications.getNotificationCounts()

  // Animate bell when new high-priority notifications arrive
  useEffect(() => {
    if (counts.critical > 0 || counts.high > 0) {
      setAnimate(true)
      const timer = setTimeout(() => setAnimate(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [counts.critical, counts.high])

  const getNotificationIcon = () => {
    if (counts.critical > 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    }
    return <BellIcon className="h-5 w-5" />
  }

  const getBellButtonClass = () => {
    let baseClass = `relative p-2 rounded-lg transition-all duration-200 ${className}`

    if (counts.critical > 0) {
      baseClass += ' text-fermentum-500 hover:text-red-600 hover:bg-red-50'
    } else if (counts.high > 0) {
      baseClass += ' text-orange-500 hover:text-orange-600 hover:bg-orange-50'
    } else if (counts.unread > 0) {
      baseClass += ' text-blue-500 hover:text-blue-600 hover:bg-blue-50'
    } else {
      baseClass += ' text-gray-400 hover:text-gray-500 hover:bg-gray-100'
    }

    if (animate) {
      baseClass += ' animate-bounce'
    }

    return baseClass
  }

  const getBadgeClass = () => {
    if (counts.critical > 0) {
      return 'bg-red-500 text-white animate-pulse'
    }
    if (counts.high > 0) {
      return 'bg-orange-500 text-white'
    }
    if (counts.unread > 0) {
      return 'bg-blue-500 text-white'
    }
    return 'bg-gray-400 text-white'
  }

  const getDisplayCount = () => {
    // Show critical count first, then high priority, then total unread
    if (counts.critical > 0) return counts.critical
    if (counts.high > 0) return counts.high
    return counts.unread
  }

  const getBadgeTitle = () => {
    if (counts.critical > 0) {
      return `${counts.critical} critical notification${counts.critical !== 1 ? 's' : ''}`
    }
    if (counts.high > 0) {
      return `${counts.high} high priority notification${counts.high !== 1 ? 's' : ''}`
    }
    if (counts.unread > 0) {
      return `${counts.unread} unread notification${counts.unread !== 1 ? 's' : ''}`
    }
    return 'No new notifications'
  }

  return (
    <>
      <button
        onClick={() => setShowCenter(!showCenter)}
        className={getBellButtonClass()}
        title={getBadgeTitle()}
        aria-label={getBadgeTitle()}
      >
        {getNotificationIcon()}

        {/* Notification Badge */}
        {getDisplayCount() > 0 && (
          <span className={`absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold rounded-full ${getBadgeClass()}`}>
            {getDisplayCount() > 99 ? '99+' : getDisplayCount()}
          </span>
        )}

        {/* Pulse indicator for critical notifications */}
        {counts.critical > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 animate-ping opacity-75" />
        )}
      </button>

      <NotificationCenter
        isOpen={showCenter}
        onClose={() => setShowCenter(false)}
      />
    </>
  )
}

export default NotificationBell