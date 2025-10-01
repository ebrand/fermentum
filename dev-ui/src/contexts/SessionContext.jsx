import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../utils/api'

const SessionContext = createContext({})

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Auto-initialize session on mount
  useEffect(() => {
    console.log('🏁 [SessionContext] useEffect: Auto-initializing session on mount')
    initializeSession()
  }, [])

  // Check if we need to reinitialize session when we have tokens but no session
  useEffect(() => {
    const hasTokens = localStorage.getItem('accessToken')

    if (!session && hasTokens && !loading) {
      console.log('🔄 [SessionContext] Secondary check: Have tokens but no session, reinitializing')
      initializeSession()
    }
  }, [session, loading])

  const initializeSession = useCallback(async () => {
    console.log('🔄 [SessionContext] initializeSession: Starting session initialization')
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      console.log('🔑 [SessionContext] initializeSession: Retrieved tokens from localStorage:', {
        accessToken: token ? 'TOKEN_EXISTS' : 'NO_TOKEN',
        refreshToken: refreshToken ? 'TOKEN_EXISTS' : 'NO_TOKEN',
        allLocalStorageKeys: Object.keys(localStorage),
        tokenValue: token ? token.substring(0, 20) + '...' : 'NULL'
      })

      if (!token) {
        console.log('❌ [SessionContext] initializeSession: No token found, aborting session creation')
        setLoading(false)
        return
      }

      console.log('📡 [SessionContext] initializeSession: Calling authAPI.createSession')
      const sessionResponse = await authAPI.createSession({ token })
      console.log('📡 [SessionContext] initializeSession: Session response:', sessionResponse)

      if (sessionResponse.data.success) {
        console.log('✅ [SessionContext] initializeSession: Session created successfully:', sessionResponse.data.data)
        const sessionData = sessionResponse.data.data

        // Update access token if the session contains a new one with tenant information
        if (sessionData.accessToken) {
          console.log('🔄 [SessionContext] initializeSession: Updating access token with tenant info')
          localStorage.setItem('accessToken', sessionData.accessToken)
          console.log('✅ [SessionContext] initializeSession: Access token updated in localStorage')
        }

        // Store current tenant ID for API requests
        if (sessionData.currentTenantId) {
          console.log('🏢 [SessionContext] initializeSession: Storing current tenant ID:', sessionData.currentTenantId)
          localStorage.setItem('currentTenantId', sessionData.currentTenantId)
        }

        setSession(sessionData)
      } else {
        console.log('❌ [SessionContext] initializeSession: Session creation failed:', sessionResponse.data.message)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('currentTenantId')
      }
    } catch (error) {
      console.error('💥 [SessionContext] initializeSession: Error during session initialization:', error)
      setError('Failed to initialize session')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('currentTenantId')
    } finally {
      console.log('🏁 [SessionContext] initializeSession: Finished, setting loading to false')
      setLoading(false)
    }
  }, [])

  const createSessionFromAuth = useCallback(async (authData) => {
    console.log('🔧 [SessionContext] createSessionFromAuth: Starting session creation from auth data')
    console.log('🔧 [SessionContext] createSessionFromAuth: Auth data:', authData)

    try {
      setLoading(true)
      setError(null)


      const { accessToken, refreshToken } = authData
      console.log('🔑 [SessionContext] createSessionFromAuth: Tokens extracted:', {
        accessToken: accessToken ? 'TOKEN_EXISTS' : 'NO_TOKEN',
        refreshToken: refreshToken ? 'TOKEN_EXISTS' : 'NO_TOKEN'
      })

      console.log('💾 [SessionContext] createSessionFromAuth: Storing tokens in localStorage')
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      // Verify storage worked
      const storedAccessToken = localStorage.getItem('accessToken')
      const storedRefreshToken = localStorage.getItem('refreshToken')
      console.log('✅ [SessionContext] createSessionFromAuth: Verification - tokens stored:', {
        accessTokenStored: storedAccessToken ? 'YES' : 'NO',
        refreshTokenStored: storedRefreshToken ? 'YES' : 'NO',
        accessTokenMatches: storedAccessToken === accessToken,
        refreshTokenMatches: storedRefreshToken === refreshToken,
        allLocalStorageKeys: Object.keys(localStorage),
        storedTokenPreview: storedAccessToken ? storedAccessToken.substring(0, 20) + '...' : 'NULL'
      })

      // Set an interval to check if tokens get cleared
      let tokenCheckInterval = setInterval(() => {
        const currentToken = localStorage.getItem('accessToken')
        if (!currentToken) {
          console.error('🚨 [SessionContext] TOKEN LOST! AccessToken was cleared from localStorage')
          console.error('🚨 [SessionContext] Current localStorage keys:', Object.keys(localStorage))
          clearInterval(tokenCheckInterval)
        }
      }, 100)

      console.log('📡 [SessionContext] createSessionFromAuth: Calling authAPI.createSession')
      const sessionResponse = await authAPI.createSession({ token: accessToken })
      console.log('📡 [SessionContext] createSessionFromAuth: Session response:', sessionResponse)

      if (sessionResponse.data.success) {
        console.log('✅ [SessionContext] createSessionFromAuth: Session created successfully')
        const sessionData = sessionResponse.data.data

        // Update access token if the session contains a new one with tenant information
        if (sessionData.accessToken) {
          console.log('🔄 [SessionContext] createSessionFromAuth: Updating access token with tenant info')
          localStorage.setItem('accessToken', sessionData.accessToken)
          console.log('✅ [SessionContext] createSessionFromAuth: Access token updated in localStorage')
        }

        setSession(sessionData)
        return { success: true, data: sessionData }
      } else {
        console.error('❌ [SessionContext] createSessionFromAuth: Session creation failed:', sessionResponse.data.message)
        return { success: false, error: sessionResponse.data.message }
      }
    } catch (error) {
      console.error('💥 [SessionContext] createSessionFromAuth: Error during session creation:', error)
      setError('Failed to create session')
      return { success: false, error: 'Failed to create session' }
    } finally {
      console.log('🏁 [SessionContext] createSessionFromAuth: Finished, setting loading to false')
      setLoading(false)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 [SessionContext] refreshSession: Starting tenant refresh')
      const token = localStorage.getItem('accessToken')
      if (!token) {
        console.log('❌ [SessionContext] refreshSession: No access token found')
        return { success: false, error: 'No access token found' }
      }

      // Call refresh-tenants API to reload tenant data
      const response = await authAPI.refreshTenants()
      if (response.data.success) {
        const sessionData = response.data.data
        console.log('✅ [SessionContext] refreshSession: Successfully refreshed session data:', sessionData)
        setSession(sessionData)
        return { success: true, data: sessionData }
      } else {
        console.error('❌ [SessionContext] refreshSession: API returned error:', response.data.message)
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('💥 [SessionContext] refreshSession: Error during refresh:', error)
      return { success: false, error: 'Failed to refresh session data' }
    }
  }, [])

  const setCurrentTenant = useCallback(async (tenantId) => {
    try {
      if (!session) {
        return { success: false, error: 'No active session' }
      }

      const response = await authAPI.setCurrentTenant({ tenantId })
      if (response.data.success) {
        const sessionData = response.data.data

        // Update tenant ID in localStorage for API requests
        if (sessionData.currentTenantId) {
          localStorage.setItem('currentTenantId', sessionData.currentTenantId)
        }

        setSession(sessionData)
        return { success: true, data: sessionData }
      } else {
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      return { success: false, error: 'Failed to set current tenant' }
    }
  }, [session])

  const setCurrentBrewery = useCallback(async (breweryId) => {
    try {
      if (!session) {
        return { success: false, error: 'No active session' }
      }

      const response = await authAPI.setCurrentBrewery({ breweryId })
      if (response.data.success) {
        setSession(response.data.data)
        return { success: true, data: response.data.data }
      } else {
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      return { success: false, error: 'Failed to set current brewery' }
    }
  }, [session])


  const invalidateSession = useCallback(async () => {
    try {
      if (session) {
        await authAPI.invalidateSession()
      }
    } catch (error) {
      // Ignore errors during invalidation
    } finally {
      setSession(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }, [session])

  // Computed properties
  const isAuthenticated = !!session || !!localStorage.getItem('accessToken')
  const user = session ? {
    userId: session.userId,
    stytchUserId: session.stytchUserId,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    displayName: session.displayName,
    role: session.role
  } : null

  const currentTenant = session?.currentTenantId
    ? session.tenants?.find(t => t.tenantId === session.currentTenantId)
    : null

  const currentBrewery = session?.currentBreweryId
    ? session.breweries?.find(b => b.breweryId === session.currentBreweryId)
    : null

  const userTenants = session?.tenants || []
  const userBreweries = session?.breweries || []
  const hasMultipleTenants = userTenants.length > 1
  const hasTenants = userTenants.length > 0
  const hasMultipleBreweries = userBreweries.length > 1
  const hasBreweries = userBreweries.length > 0

  const currentTenantBreweries = session?.currentTenantId
    ? userBreweries.filter(b => b.tenantId === session.currentTenantId)
    : []

  const value = {
    session,
    loading,
    error,
    isAuthenticated,
    user,
    currentTenant,
    userTenants,
    hasMultipleTenants,
    hasTenants,
    currentBrewery,
    userBreweries,
    currentTenantBreweries,
    hasMultipleBreweries,
    hasBreweries,
    createSessionFromAuth,
    setCurrentTenant,
    setCurrentBrewery,
    refreshSession,
    invalidateSession,
    initializeSession,
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}