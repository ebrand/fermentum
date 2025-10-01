import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { pluginAPI } from '../utils/api'

const QuickBooksCallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('Processing QuickBooks authorization...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract parameters from URL
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const realmId = searchParams.get('realmId')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        console.log('🔄 [QuickBooks Callback] Processing OAuth callback:', {
          hasCode: !!code,
          hasState: !!state,
          hasRealmId: !!realmId,
          error,
          errorDescription
        })

        // Handle OAuth error
        if (error) {
          setStatus('error')
          setMessage(`QuickBooks authorization failed: ${errorDescription || error}`)
          return
        }

        // Validate required parameters
        if (!code || !state || !realmId) {
          setStatus('error')
          setMessage('Missing required authorization parameters from QuickBooks')
          return
        }

        // Call backend callback API
        setMessage('Exchanging authorization code for access tokens...')
        console.log('📡 [QuickBooks Callback] Calling backend callback API')

        const response = await pluginAPI.handleQuickBooksOAuthCallback({
          code,
          state,
          realmId
        })

        console.log('✅ [QuickBooks Callback] Backend response:', response.data)

        if (response.data.success) {
          setStatus('success')
          setMessage('QuickBooks connected successfully!')

          // Redirect to plugins page after short delay
          setTimeout(() => {
            navigate('/settings/integrations', {
              state: {
                success: true,
                message: 'QuickBooks Online integration has been connected successfully'
              }
            })
          }, 2000)
        } else {
          setStatus('error')
          setMessage(`Connection failed: ${response.data.message || 'Unknown error'}`)
        }

      } catch (error) {
        console.error('❌ [QuickBooks Callback] Error processing callback:', error)
        setStatus('error')

        if (error.response?.status === 401) {
          setMessage('Authentication required. Please log in and try again.')
        } else if (error.response?.data?.message) {
          setMessage(`Connection failed: ${error.response.data.message}`)
        } else {
          setMessage('Failed to connect QuickBooks. Please try again.')
        }
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        )
      case 'success':
        return (
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {getStatusIcon()}

            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              QuickBooks Integration
            </h2>

            <p className={`mt-4 text-sm ${getStatusColor()}`}>
              {message}
            </p>

            {status === 'error' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/settings/integrations')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Integrations
                </button>
              </div>
            )}

            {status === 'processing' && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  Please wait while we complete the connection...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickBooksCallbackPage