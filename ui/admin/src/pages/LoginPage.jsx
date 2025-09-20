import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)

  // Check for OAuth debug info on page load
  useEffect(() => {
    const oauthDebug = localStorage.getItem('oauth_debug')
    const authResult = localStorage.getItem('oauth_auth_result')
    const globalDebug = localStorage.getItem('global_oauth_debug')
    const immediateDebug = localStorage.getItem('immediate_oauth_debug')
    const navPushDebug = localStorage.getItem('nav_debug_push')
    const navReplaceDebug = localStorage.getItem('nav_debug_replace')
    const navPopDebug = localStorage.getItem('nav_debug_pop')

    if (oauthDebug || authResult || globalDebug || immediateDebug || navPushDebug || navReplaceDebug || navPopDebug) {
      setDebugInfo({
        oauth: oauthDebug ? JSON.parse(oauthDebug) : null,
        auth: authResult ? JSON.parse(authResult) : null,
        global: globalDebug ? JSON.parse(globalDebug) : null,
        immediate: immediateDebug ? JSON.parse(immediateDebug) : null,
        navPush: navPushDebug ? JSON.parse(navPushDebug) : null,
        navReplace: navReplaceDebug ? JSON.parse(navReplaceDebug) : null,
        navPop: navPopDebug ? JSON.parse(navPopDebug) : null
      })

      // Clear debug info after showing it
      setTimeout(() => {
        localStorage.removeItem('oauth_debug')
        localStorage.removeItem('oauth_auth_result')
        localStorage.removeItem('global_oauth_debug')
        localStorage.removeItem('immediate_oauth_debug')
        localStorage.removeItem('nav_debug_push')
        localStorage.removeItem('nav_debug_replace')
        localStorage.removeItem('nav_debug_pop')
        setDebugInfo(null)
      }, 60000) // Clear after 60 seconds
    }
  }, [])

  const { login, startGoogleOAuth, startAppleOAuth } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(formData)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const handleGoogleOAuth = async () => {
    setLoading(true)
    setError('')

    const result = await startGoogleOAuth()

    if (!result.success) {
      setError(result.error)
      setLoading(false)
    }
    // If successful, we'll be redirected to Google
  }

  const handleAppleOAuth = async () => {
    setLoading(true)
    setError('')

    const result = await startAppleOAuth()

    if (!result.success) {
      setError(result.error)
      setLoading(false)
    }
    // If successful, we'll be redirected to Apple
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Fermentum Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field mt-1"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {debugInfo && (
            <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-2">OAuth Debug Info:</div>
              {debugInfo.oauth && (
                <div className="text-xs text-blue-700 mb-2">
                  <div className="font-medium">Callback URL:</div>
                  <div className="break-all">{debugInfo.oauth.fullUrl}</div>
                  <div className="font-medium mt-1">Token:</div>
                  <div className="break-all">{debugInfo.oauth.token || 'No token'}</div>
                  <div className="font-medium mt-1">Token Type:</div>
                  <div>{debugInfo.oauth.tokenType || 'No token type'}</div>
                </div>
              )}
              {debugInfo.auth && (
                <div className="text-xs text-blue-700">
                  <div className="font-medium">Auth Result:</div>
                  <div>Success: {debugInfo.auth.success ? 'Yes' : 'No'}</div>
                  {debugInfo.auth.error && (
                    <div>Error: {debugInfo.auth.error}</div>
                  )}
                </div>
              )}
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
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleAppleOAuth}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-black text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              {loading ? 'Connecting...' : 'Continue with Apple'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="text-sm">
              <Link
                to="/magic-link"
                className="font-medium text-fermentum-600 hover:text-fermentum-500"
              >
                Sign in with magic link
              </Link>
            </div>
            <div className="text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-fermentum-600 hover:text-fermentum-500"
              >
                Create account
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}