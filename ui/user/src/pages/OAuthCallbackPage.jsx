import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { authAPI } from '../utils/api'


export default function OAuthCallbackPage() {
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState('')
  const { createSessionFromAuth } = useSession()
  const navigate = useNavigate()


  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('🎯 [OAuthCallback] Starting OAuth callback handling')
      console.log('🌍 [OAuthCallback] Current URL:', window.location.href)

      try {
        // Get the token from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const tokenType = urlParams.get('stytch_token_type')

        console.log('🔗 [OAuthCallback] Full URL:', window.location.href)
        console.log('🔗 [OAuthCallback] Search params:', window.location.search)
        console.log('🔗 [OAuthCallback] URL parameters:', {
          token: token ? `TOKEN_EXISTS (${token.length} chars)` : 'NO_TOKEN',
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'N/A',
          tokenType,
          allParams: Object.fromEntries(urlParams.entries())
        })

        if (!token) {
          console.error('❌ [OAuthCallback] No token found in URL parameters')
          setStatus('error')
          setError('No authentication token received')
          return
        }

        // Prevent multiple authentication attempts
        if (window.authAttempted) {
          console.log('🔄 [OAuthCallback] Auth already attempted, skipping')
          return
        }
        window.authAttempted = true

        // Check if this is from onboarding flow
        const onboardingData = sessionStorage.getItem('onboardingData')
        console.log('📋 [OAuthCallback] Onboarding data:', onboardingData ? 'EXISTS' : 'NO_DATA')

        if (onboardingData) {
          console.log('🚀 [OAuthCallback] Onboarding flow - creating account with tenant')
          // This is an onboarding flow - create account with tenant
          const data = JSON.parse(onboardingData)

          const accountData = {
            oAuthToken: token,
            tenantData: data.tenantData,
            paymentData: data.paymentData
          }

          console.log('📡 [OAuthCallback] Calling authAPI.createAccountWithTenant')
          const result = await authAPI.createAccountWithTenant(accountData)
          console.log('📡 [OAuthCallback] createAccountWithTenant result:', result)

          if (result.data.success) {
            console.log('✅ [OAuthCallback] Account created successfully, creating session')
            // Create session from auth data
            const sessionResult = await createSessionFromAuth(result.data.data)
            console.log('📡 [OAuthCallback] createSessionFromAuth result:', sessionResult)

            if (sessionResult.success) {
              // Clear onboarding data
              sessionStorage.removeItem('onboardingData')
              console.log('✅ [OAuthCallback] Session created successfully, redirecting to dashboard')

              setStatus('success')
              setTimeout(() => {
                navigate('/dashboard')
              }, 1500)
            } else {
              console.error('❌ [OAuthCallback] Session creation failed:', sessionResult.error)
              setStatus('error')
              setError(sessionResult.error || 'Failed to create session')
            }
          } else {
            console.error('❌ [OAuthCallback] Account creation failed:', result.data.message)
            setStatus('error')
            setError(result.data.message || 'Failed to create account')
          }
        } else {
          console.log('🔐 [OAuthCallback] Regular OAuth flow - authenticating with backend')
          // Regular OAuth flow - authenticate with backend
          console.log('📡 [OAuthCallback] Calling authAPI.authenticateOAuth')
          const result = await authAPI.authenticateOAuth(token)
          console.log('📡 [OAuthCallback] authenticateOAuth result:', result)

          if (result.data.success) {
            console.log('✅ [OAuthCallback] OAuth authentication successful, creating session')
            // Create session from auth data
            const sessionResult = await createSessionFromAuth(result.data.data)
            console.log('📡 [OAuthCallback] createSessionFromAuth result:', sessionResult)

            if (sessionResult.success) {
              console.log('✅ [OAuthCallback] Session created successfully, redirecting to tenant selection')
              setStatus('success')
              navigate('/tenant-selection')
            } else {
              console.error('❌ [OAuthCallback] Session creation failed:', sessionResult.error)
              setStatus('error')
              setError(sessionResult.error || 'Failed to create session')
            }
          } else {
            console.error('❌ [OAuthCallback] OAuth authentication failed:', result.data.message)
            setStatus('error')
            setError(result.data.message || 'Authentication failed')
          }
        }
      } catch (error) {
        console.error('💥 [OAuthCallback] Unexpected error during OAuth callback:', error)
        setStatus('error')
        setError('An unexpected error occurred')
      }
    }

    handleOAuthCallback()
  }, [createSessionFromAuth, navigate])

  const handleRetryLogin = () => {
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {status === 'processing' && 'Signing you in...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
        </div>


        <div className="text-center">
          {status === 'processing' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fermentum-600"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-green-600">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Authentication successful! Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-red-600">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <button
                onClick={handleRetryLogin}
                className="mt-4 btn-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}