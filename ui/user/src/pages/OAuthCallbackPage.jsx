import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'


export default function OAuthCallbackPage() {
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState('')
  const { authenticateOAuth } = useAuth()
  const navigate = useNavigate()


  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the token from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const tokenType = urlParams.get('stytch_token_type')



        if (!token) {
          setStatus('error')
          setError('No authentication token received')
          return
        }

        // Prevent multiple authentication attempts
        if (window.authAttempted) {
          return
        }
        window.authAttempted = true

        // Authenticate with the token

        const result = await authenticateOAuth(token)



        if (result.success) {
          setStatus('success')
          // Check if user needs onboarding (new user without tenants)
          setTimeout(() => {
            navigate('/tenant-selection')
          }, 1500)
        } else {
          setStatus('error')
          setError(result.error || 'Authentication failed')
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setError('An unexpected error occurred')
      }
    }

    handleOAuthCallback()
  }, [authenticateOAuth, navigate])

  const handleRetryLogin = () => {
    navigate('/login')
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