import React, { useState } from 'react'
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'
import {
  getDisplayIdGeneric,
  getFullIdTooltipGeneric,
  copyIdToClipboard,
  isValidId
} from '../utils/tenantId'

/**
 * Generic ID Display Component
 *
 * Displays any UUID in a user-friendly format (last 6 characters)
 * while providing access to the full ID via tooltip and copy functionality.
 *
 * @param {Object} props
 * @param {string} props.id - Full ID (UUID)
 * @param {string} props.type - Type of ID (e.g., 'Tenant', 'User', 'Brewery')
 * @param {boolean} props.showCopy - Whether to show copy button (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.prefix - Optional prefix text (default: auto-generated from type)
 * @param {boolean} props.showFull - Whether to show full ID instead of abbreviated (default: false)
 */
export default function IdDisplay({
  id,
  type = 'ID',
  showCopy = true,
  className = '',
  prefix = null,
  showFull = false
}) {
  const [copied, setCopied] = useState(false)

  if (!id || !isValidId(id)) {
    return null
  }

  const displayId = showFull ? id : getDisplayIdGeneric(id)
  const tooltipText = getFullIdTooltipGeneric(id, `${type} ID`)
  const displayPrefix = prefix !== null ? prefix : `${type}: `

  const handleCopy = async (e) => {
    e.stopPropagation() // Prevent triggering parent click events
    const success = await copyIdToClipboard(id)

    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    }
  }

  // Handle className inheritance from parent
  const containerClassName = className === 'inherit-parent-styles'
    ? 'inline-flex items-center gap-1'
    : `inline-flex items-center gap-1 ${className}`

  const textClassName = className === 'inherit-parent-styles'
    ? 'select-all' // Inherit all styling from parent
    : 'font-mono text-xs text-gray-500 select-all'

  return (
    <div className={containerClassName}>
      <span
        className={textClassName}
        title={tooltipText}
      >
        {displayPrefix}{displayId}
      </span>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
          title={copied ? 'Copied!' : `Copy full ${type.toLowerCase()} ID`}
          aria-label={copied ? 'Copied!' : `Copy full ${type.toLowerCase()} ID`}
        >
          {copied ? (
            <CheckIcon className="w-3 h-3 text-green-500" />
          ) : (
            <ClipboardIcon className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  )
}

/**
 * Compact variant of IdDisplay for use in tight spaces
 */
export function IdDisplayCompact({ id, type = 'ID', className }) {
  // If no className provided, inherit styling from parent context
  const computedClassName = className !== undefined ? className : 'inherit-parent-styles'

  return (
    <IdDisplay
      id={id}
      type={type}
      showCopy={false}
      className={computedClassName}
      prefix=""
    />
  )
}

/**
 * Administrative variant that shows full ID by default
 */
export function IdDisplayAdmin({ id, type = 'ID', className = '' }) {
  return (
    <IdDisplay
      id={id}
      type={type}
      showFull={true}
      className={className}
      prefix=""
    />
  )
}

/**
 * Specific components for common ID types
 */
export function BreweryId({ breweryId, className, ...props }) {
  // If no className provided, inherit styling from parent context
  const computedClassName = className !== undefined ? className : 'inherit-parent-styles'
  return <IdDisplay id={breweryId} type="Brewery" className={computedClassName} {...props} />
}

export function BreweryIdCompact({ breweryId, className }) {
  return <IdDisplayCompact id={breweryId} type="Brewery" className={className} />
}

export function UserId({ userId, className, ...props }) {
  // If no className provided, inherit styling from parent context
  const computedClassName = className !== undefined ? className : 'inherit-parent-styles'
  return <IdDisplay id={userId} type="User" className={computedClassName} {...props} />
}

export function UserIdCompact({ userId, className }) {
  return <IdDisplayCompact id={userId} type="User" className={className} />
}

export function TenantId({ tenantId, className, ...props }) {
  // If no className provided, inherit styling from parent context
  const computedClassName = className !== undefined ? className : 'inherit-parent-styles'
  return <IdDisplay id={tenantId} type="Tenant" className={computedClassName} {...props} />
}

export function TenantIdCompact({ tenantId, className }) {
  return <IdDisplayCompact id={tenantId} type="Tenant" className={className} />
}

export function TenantIdAdmin({ tenantId, className = '' }) {
  return <IdDisplayAdmin id={tenantId} type="Tenant" className={className} />
}