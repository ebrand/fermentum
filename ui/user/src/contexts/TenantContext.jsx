import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { tenantAPI } from '../utils/api'

const TenantContext = createContext({})

export function TenantProvider({ children }) {
  const [currentTenant, setCurrentTenant] = useState(null)
  const [userTenants, setUserTenants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Don't automatically load tenants - only load when explicitly requested
  // This prevents 401 errors when user is not authenticated

  // Load current tenant from localStorage
  useEffect(() => {
    const savedTenantId = localStorage.getItem('currentTenantId')
    if (savedTenantId && userTenants.length > 0) {
      const tenant = userTenants.find(t => t.tenantId === savedTenantId)
      if (tenant) {
        setCurrentTenant(tenant)
      }
    }
  }, [userTenants])

  const loadUserTenants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await tenantAPI.getUserTenants()

      if (response.data.success) {
        setUserTenants(response.data.data)

        // If no current tenant selected and user has tenants, select the first one
        if (!currentTenant && response.data.data.length > 0) {
          selectTenant(response.data.data[0])
        }
      }
    } catch (error) {
      console.error('Failed to load user tenants:', error)
      setError('Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  const selectTenant = (tenant) => {
    setCurrentTenant(tenant)
    localStorage.setItem('currentTenantId', tenant.tenantId)
  }

  const createTenant = async (tenantData) => {
    try {
      setError(null)
      const response = await tenantAPI.createTenant(tenantData)

      if (response.data.success) {
        // Reload tenants to include the new one
        await loadUserTenants()
        return { success: true, data: response.data.data }
      } else {
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Failed to create tenant:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create tenant'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const getTenantDetails = async (tenantId) => {
    try {
      const response = await tenantAPI.getTenant(tenantId)
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Failed to get tenant details:', error)
      return { success: false, error: 'Failed to get tenant details' }
    }
  }

  const inviteUserToTenant = async (tenantId, inviteData) => {
    try {
      const response = await tenantAPI.inviteUser(tenantId, inviteData)
      return response.data
    } catch (error) {
      console.error('Failed to invite user:', error)
      return { success: false, error: 'Failed to send invitation' }
    }
  }

  const value = {
    // State
    currentTenant,
    userTenants,
    loading,
    error,

    // Actions
    loadUserTenants,
    selectTenant,
    createTenant,
    getTenantDetails,
    inviteUserToTenant,

    // Computed properties
    hasMultipleTenants: userTenants.length > 1,
    hasTenants: userTenants.length > 0,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}