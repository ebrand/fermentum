import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../utils/api'

const SessionContext = createContext({})

// Global flag to prevent duplicate initialization across React StrictMode instances
let globalInitializing = false
let globalInitPromise = null

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isInitializing, setIsInitializing] = useState(false)

  // Auto-initialize session on mount
  useEffect(() => {
    // Check for phantom tenant ID and clear it before initializing session
    const currentTenantId = localStorage.getItem('currentTenantId')
    const PHANTOM_TENANT_ID = 'cee20966-d6d5-4024-8b1d-ca0e3ebc33c4'

    if (currentTenantId === PHANTOM_TENANT_ID) {
      console.log('🚨 [SessionContext] PHANTOM TENANT ID DETECTED! Clearing stale localStorage data:', PHANTOM_TENANT_ID)
      localStorage.removeItem('currentTenantId')
      localStorage.removeItem('currentBreweryId')
      console.log('✅ [SessionContext] Phantom tenant data cleared from localStorage')
    }

    console.log('🏁 [SessionContext] useEffect: Auto-initializing session on mount')
    initializeSession()
  }, [])

  // Check if we need to reinitialize session when we have tokens but no session
  // TEMPORARILY DISABLED to fix notification loading issue
  useEffect(() => {
    console.log('🚧 [SessionContext] Secondary session check temporarily disabled to fix notifications')
    return // Early return to disable this entire effect
    const hasTokens = localStorage.getItem('accessToken')

    if (!session && hasTokens && !loading && !isInitializing) {
      console.log('🔄 [SessionContext] Secondary check: Have tokens but no session, reinitializing')
      initializeSession()
    }
  }, [session, loading, isInitializing])

  // Restore brewery selection when session loads but doesn't have a current brewery
  // TEMPORARILY DISABLED to fix notification loading issue
  useEffect(() => {
    console.log('🚧 [SessionContext] Brewery restoration temporarily disabled to fix notifications')
    return // Early return to disable this entire effect
    const restoreBrewery = async () => {
      // Enhanced debug logging to understand the session state
      const storedBreweryId = localStorage.getItem('currentBreweryId')
      const storedTenantId = localStorage.getItem('currentTenantId')

      console.log('🔍 [SessionContext] DETAILED Brewery restoration check:', {
        session: session ? 'EXISTS' : 'NULL',
        sessionCurrentBreweryId: session?.currentBreweryId,
        sessionCurrentTenantId: session?.currentTenantId,
        storedBreweryId,
        storedTenantId,
        loading,
        breweries: session?.breweries?.length || 0,
        tenants: session?.tenants?.length || 0,
        allLocalStorageKeys: Object.keys(localStorage),
        breweryList: session?.breweries?.map(b => ({ id: b.breweryId, name: b.name, tenantId: b.tenantId })) || []
      })

      if (session && !loading && session.breweries && session.breweries.length > 0) {
        const storedBreweryId = localStorage.getItem('currentBreweryId')
        console.log('🔍 [SessionContext] Stored brewery ID in localStorage:', storedBreweryId)

        // Check if we need to restore brewery
        // Restore if: we have a stored brewery, it exists in the session, and either:
        // 1. No current brewery is set, OR
        // 2. Current brewery doesn't match stored brewery, OR
        // 3. Current brewery ID is set but currentBrewery computed property is null (timing issue)
        const currentComputedBrewery = session.currentBreweryId && session.breweries?.length > 0
          ? session.breweries?.find(b => b.breweryId === session.currentBreweryId)
          : null

        const shouldRestore = storedBreweryId &&
                             session.breweries.some(b => b.breweryId === storedBreweryId) &&
                             (!session.currentBreweryId ||
                              session.currentBreweryId !== storedBreweryId ||
                              (session.currentBreweryId && !currentComputedBrewery))

        console.log('🔍 [SessionContext] Should restore brewery?', shouldRestore, {
          hasStoredId: !!storedBreweryId,
          breweryExistsInSession: session.breweries.some(b => b.breweryId === storedBreweryId),
          currentBreweryId: session.currentBreweryId,
          storedBreweryId: storedBreweryId,
          currentComputedBrewery: currentComputedBrewery ? { id: currentComputedBrewery.breweryId, name: currentComputedBrewery.name } : null,
          hasTimingIssue: session.currentBreweryId && !currentComputedBrewery
        })

        if (shouldRestore) {
          console.log('🏭 [SessionContext] Restoring brewery from localStorage:', storedBreweryId)

          // Add a small delay to ensure the session state has fully settled
          await new Promise(resolve => setTimeout(resolve, 100))

          try {
            // Find the brewery and its associated tenant
            const breweryToRestore = session.breweries.find(b => b.breweryId === storedBreweryId)
            if (!breweryToRestore) {
              console.error('💥 [SessionContext] Brewery not found in session:', storedBreweryId)
              localStorage.removeItem('currentBreweryId')
              return
            }

            console.log('🏢 [SessionContext] Found brewery to restore:', breweryToRestore.name, 'Tenant ID:', breweryToRestore.tenantId)

            // Set both tenant and brewery in sequence (mirroring handleSelectBrewery)
            console.log('🔄 [SessionContext] Setting tenant:', breweryToRestore.tenantId)
            const tenantResponse = await authAPI.setCurrentTenant({ tenantId: breweryToRestore.tenantId })

            if (!tenantResponse.data.success) {
              console.error('💥 [SessionContext] Failed to set current tenant:', tenantResponse.data.message)
              localStorage.removeItem('currentBreweryId')
              return
            }

            console.log('✅ [SessionContext] Successfully set current tenant, now setting brewery')

            // Then set the brewery
            const breweryResponse = await authAPI.setCurrentBrewery({ breweryId: storedBreweryId })

            if (breweryResponse.data.success) {
              console.log('✅ [SessionContext] Successfully restored complete brewery + tenant state')
              const sessionData = breweryResponse.data.data

              // Ensure brewery ID is stored
              localStorage.setItem('currentBreweryId', storedBreweryId)

              // Update session with complete state
              setSession(sessionData)
            } else {
              console.error('💥 [SessionContext] Failed to restore brewery selection:', breweryResponse.data.message)
              localStorage.removeItem('currentBreweryId')
            }
          } catch (error) {
            console.error('💥 [SessionContext] Error restoring brewery selection:', error)
            localStorage.removeItem('currentBreweryId')
          }
        } else if (storedBreweryId && !session.breweries?.some(b => b.breweryId === storedBreweryId)) {
          console.log('⚠️ [SessionContext] Stored brewery ID not found in available breweries, clearing localStorage')
          localStorage.removeItem('currentBreweryId')
        } else if (!storedBreweryId && session.breweries && session.breweries.length === 1 && !session.currentBreweryId) {
          console.log('🏭 [SessionContext] No stored brewery but single brewery available and none set, auto-selecting:', session.breweries[0].breweryId)
          // Auto-select the only available brewery if none is stored or set
          try {
            const breweryToSet = session.breweries[0]
            console.log('🏢 [SessionContext] Setting tenant for auto-selected brewery:', breweryToSet.tenantId)
            const tenantResponse = await authAPI.setCurrentTenant({ tenantId: breweryToSet.tenantId })

            if (tenantResponse.data.success) {
              const breweryResponse = await authAPI.setCurrentBrewery({ breweryId: breweryToSet.breweryId })
              if (breweryResponse.data.success) {
                console.log('✅ [SessionContext] Auto-selection successful')
                const sessionData = breweryResponse.data.data
                localStorage.setItem('currentBreweryId', sessionData.currentBreweryId)
                setSession(sessionData)
              }
            }
          } catch (error) {
            console.error('💥 [SessionContext] Error during auto brewery selection:', error)
          }
        } else if (!session.currentTenantId && session.tenants && session.tenants.length === 1) {
          console.log('🏢 [SessionContext] No current tenant but single tenant available during restoration, auto-selecting:', session.tenants[0].tenantId)
          // Auto-select tenant if none is set but tenant data exists
          try {
            const tenantResponse = await authAPI.setCurrentTenant({ tenantId: session.tenants[0].tenantId })
            if (tenantResponse.data.success) {
              console.log('✅ [SessionContext] Tenant auto-selection successful during restoration')
              const sessionData = tenantResponse.data.data
              localStorage.setItem('currentTenantId', sessionData.currentTenantId)
              setSession(sessionData)
            }
          } catch (error) {
            console.error('💥 [SessionContext] Error during auto tenant selection in restoration:', error)
          }
        }
      }
    }

    restoreBrewery()
  }, [session, loading])

  const initializeSession = useCallback(async () => {
    if (isInitializing || globalInitializing) {
      console.log('⚠️ [SessionContext] initializeSession: Already initializing, skipping duplicate call')
      if (globalInitPromise) {
        console.log('🔄 [SessionContext] initializeSession: Waiting for existing initialization to complete')
        await globalInitPromise
      }
      return
    }

    console.log('🔄 [SessionContext] initializeSession: Starting session initialization')

    // Create a promise for this initialization that other instances can await
    globalInitPromise = (async () => {
      try {
        setIsInitializing(true)
        globalInitializing = true
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
          setIsInitializing(false)
          globalInitializing = false
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

        // Auto-select tenant if none is set but tenant data exists
        if (!sessionData.currentTenantId && sessionData.tenants && sessionData.tenants.length === 1) {
          console.log('🏢 [SessionContext] initializeSession: No current tenant but single tenant available, auto-selecting:', sessionData.tenants[0].tenantId)
          try {
            const setTenantResponse = await authAPI.setCurrentTenant({ tenantId: sessionData.tenants[0].tenantId })
            if (setTenantResponse.data.success) {
              const updatedSessionData = setTenantResponse.data.data
              console.log('✅ [SessionContext] initializeSession: Auto-selected tenant successfully, updated session:', updatedSessionData)
              localStorage.setItem('currentTenantId', updatedSessionData.currentTenantId)
              // Update sessionData for subsequent logic
              sessionData.currentTenantId = updatedSessionData.currentTenantId
              sessionData.accessToken = updatedSessionData.accessToken // Update token with tenant context
              if (updatedSessionData.accessToken) {
                localStorage.setItem('accessToken', updatedSessionData.accessToken)
              }
            }
          } catch (error) {
            console.error('💥 [SessionContext] initializeSession: Failed to auto-select tenant:', error)
          }
        }

        // Store current tenant ID for API requests
        if (sessionData.currentTenantId) {
          console.log('🏢 [SessionContext] initializeSession: Storing current tenant ID:', sessionData.currentTenantId)
          localStorage.setItem('currentTenantId', sessionData.currentTenantId)
        }

        // Store current brewery ID for persistence
        if (sessionData.currentBreweryId) {
          console.log('🏭 [SessionContext] initializeSession: Storing current brewery ID:', sessionData.currentBreweryId)
          localStorage.setItem('currentBreweryId', sessionData.currentBreweryId)
        } else {
          console.log('⚠️ [SessionContext] initializeSession: No currentBreweryId in session data, checking if we should set first available brewery')
          // If no current brewery but breweries exist, this might be the initial login case
          // where the API doesn't set a default brewery
          if (sessionData.breweries && sessionData.breweries.length === 1) {
            console.log('🏭 [SessionContext] initializeSession: Only one brewery available, setting as current:', sessionData.breweries[0].breweryId)
            // For single brewery users, set the only brewery as current
            try {
              const setBreweryResponse = await authAPI.setCurrentBrewery({ breweryId: sessionData.breweries[0].breweryId })
              if (setBreweryResponse.data.success) {
                const updatedSessionData = setBreweryResponse.data.data
                localStorage.setItem('currentBreweryId', updatedSessionData.currentBreweryId)
                setSession(updatedSessionData)
                return // Return early with updated session
              }
            } catch (error) {
              console.error('💥 [SessionContext] initializeSession: Failed to set initial brewery:', error)
            }
          }
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
      localStorage.removeItem('currentBreweryId')
      } finally {
        console.log('🏁 [SessionContext] initializeSession: Finished, setting loading to false')
        setLoading(false)
        setIsInitializing(false)
        globalInitializing = false
      }
    })()

    // Execute the promise and handle its completion
    await globalInitPromise
    globalInitPromise = null
  }, [isInitializing])

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
        const sessionData = response.data.data

        // Store current brewery ID for persistence
        if (sessionData.currentBreweryId) {
          localStorage.setItem('currentBreweryId', sessionData.currentBreweryId)
        }

        setSession(sessionData)
        return { success: true, data: sessionData }
      } else {
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      return { success: false, error: 'Failed to set current brewery' }
    }
  }, [session])


  const invalidateSession = useCallback(async () => {
    console.log('🚨 [SessionContext] invalidateSession called! Stack trace:', new Error().stack)
    console.log('🚧 [SessionContext] Session invalidation temporarily disabled to fix notifications')
    return // TEMPORARILY DISABLED - early return to prevent session clearing
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
      localStorage.removeItem('currentTenantId')
      localStorage.removeItem('currentBreweryId')
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
    role: session.role,
    currentEmployeeId: session.currentEmployeeId
  } : null

  const currentTenant = session?.currentTenantId
    ? session.tenants?.find(t => t.tenantId === session.currentTenantId)
    : null

  const currentBrewery = session?.currentBreweryId && session?.breweries?.length > 0
    ? session.breweries?.find(b => b.breweryId === session.currentBreweryId)
    : null

  // Debug logging for currentBrewery computation
  useEffect(() => {
    console.log('🏭 [SessionContext] currentBrewery computed:', {
      sessionCurrentBreweryId: session?.currentBreweryId,
      breweries: session?.breweries?.map(b => ({ id: b.breweryId, name: b.name })),
      currentBrewery: currentBrewery ? { id: currentBrewery.breweryId, name: currentBrewery.name } : null
    })
  }, [session?.currentBreweryId, session?.breweries, currentBrewery])

  // Debug logging for currentTenant computation
  useEffect(() => {
    console.log('🏢 [SessionContext] currentTenant computed:', {
      sessionCurrentTenantId: session?.currentTenantId,
      tenants: session?.tenants?.map(t => ({ id: t.tenantId, name: t.name, userRole: t.userRole })),
      currentTenant: currentTenant ? { id: currentTenant.tenantId, name: currentTenant.name, userRole: currentTenant.userRole } : null,
      fallbackRole: currentTenant?.userRole || 'No role assigned'
    })
  }, [session?.currentTenantId, session?.tenants, currentTenant])

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