import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { authAPI } from '../utils/api'
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function MagicLinkPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verifyingToken, setVerifyingToken] = useState(false)

  const { createSessionFromAuth } = useSession()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Check for magic link token in URL
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      handleTokenVerification(token)
    }
  }, [searchParams])

  const handleTokenVerification = async (token) => {
    setVerifyingToken(true)
    setError('')

    try {
      const response = await authAPI.verifyMagicLink(token)

      if (response.data.success) {
        const authData = response.data.data
        const sessionResult = await createSessionFromAuth(authData)

        if (sessionResult.success) {
          navigate('/dashboard')
        } else {
          setError(sessionResult.error)
        }
      } else {
        setError(response.data.message || 'Failed to verify magic link')
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify magic link')
    }

    setVerifyingToken(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const redirectUrl = `${window.location.origin}/magic-link`
      const response = await authAPI.sendMagicLink(email, redirectUrl)

      if (response.data.success) {
        setSuccess(true)
      } else {
        setError(response.data.message || 'Failed to send magic link')
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send magic link')
    }

    setLoading(false)
  }

  // Show verification loading screen
  if (verifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fermentum-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your magic link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Magic Link Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in without a password
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Magic link sent!</h3>
              <p className="mt-2 text-sm text-gray-600">
                We've sent a magic link to <strong>{email}</strong>. Click the link in your email to sign in.
              </p>
            </div>
            <div className="text-sm">
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="font-medium text-fermentum-600 hover:text-fermentum-500"
              >
                Send another magic link
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-10"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                We'll send you a magic link to sign in instantly
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending magic link...
                  </div>
                ) : (
                  'Send magic link'
                )}
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="text-sm">
                <Link
                  to="/onboarding"
                  className="font-medium text-fermentum-600 hover:text-fermentum-500"
                >
                  Sign in with password
                </Link>
              </div>
              <div className="text-sm">
                Don't have an account?{' '}
                <Link
                  to="/onboarding"
                  className="font-medium text-fermentum-600 hover:text-fermentum-500"
                >
                  Sign in with OAuth
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}