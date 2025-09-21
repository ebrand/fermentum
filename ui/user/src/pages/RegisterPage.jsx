import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { authAPI } from '../utils/api'
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FormField, FormButton } from '../components/forms'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    noCommonPatterns: false,
    notSequential: false,
    notKeyboard: false,
    mixedCase: false,
    multipleNumbers: false,
    multipleSpecial: false,
  })

  const { createSessionFromAuth } = useSession()
  const navigate = useNavigate()

  // Enhanced password validation helper for Stytch zxcvbn requirements
  const validatePassword = (password) => {
    const validation = {
      length: password.length >= 12, // Increased from 8 to 12
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    // Additional advanced checks for zxcvbn-like scoring
    const advancedChecks = {
      noCommonPatterns: !/(.)\1{2,}/.test(password), // No 3+ repeated characters
      notSequential: !/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890)/i.test(password),
      notKeyboard: !/(?:qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/i.test(password),
      mixedCase: /[A-Z]/.test(password) && /[a-z]/.test(password),
      multipleNumbers: (password.match(/\d/g) || []).length >= 2,
      multipleSpecial: (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length >= 2,
    }

    const allValidation = { ...validation, ...advancedChecks }
    setPasswordValidation(allValidation)
    return Object.values(allValidation).every(Boolean)
  }

  // Calculate password validity based only on the criteria we show to users
  const requiredCriteria = ['length', 'uppercase', 'lowercase', 'multipleNumbers', 'multipleSpecial', 'noCommonPatterns', 'notSequential', 'notKeyboard']
  const isPasswordValid = requiredCriteria.every(key => passwordValidation[key])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Validate password in real-time
    if (name === 'password') {
      validatePassword(value)
    }

    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate password strength before submitting
    if (!isPasswordValid) {
      setError('Password does not meet security requirements')
      setLoading(false)
      return
    }

    try {
      // Register user with authAPI
      const registerResponse = await authAPI.register(formData)

      if (registerResponse.data.success) {
        // Create session from auth data
        const authData = registerResponse.data.data
        const sessionResult = await createSessionFromAuth(authData)

        if (sessionResult.success) {
          navigate('/onboarding')
        } else {
          setError(sessionResult.error)
        }
      } else {
        setError(registerResponse.data.message || 'Registration failed')
      }
    } catch (error) {
      // Provide specific error messages based on the error response
      let errorMessage = 'Registration failed'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.status === 400) {
        // Handle common 400 errors with user-friendly messages
        const responseText = error.response?.data || error.message || ''
        if (responseText.includes('duplicate') || responseText.includes('already exists')) {
          errorMessage = 'An account with this email address already exists. Please try logging in instead.'
        } else if (responseText.includes('weak') || responseText.includes('password')) {
          errorMessage = 'Password does not meet security requirements. Please ensure it meets all criteria shown.'
        } else {
          errorMessage = 'Registration failed. Please check your information and try again.'
        }
      }

      setError(errorMessage)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-8">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>
              <path d="M12 4c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z" opacity="0.7"/>
            </svg>
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-gray-600">
            Join Fermentum to manage your brewery
          </p>
        </div>

        {/* Registration form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="First name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
                autoComplete="given-name"
              />

              <FormField
                label="Last name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
                autoComplete="family-name"
              />
            </div>

            {/* Email field */}
            <FormField
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              required
              autoComplete="email"
            />

            {/* Password field with validation */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`w-full px-4 py-4 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors pr-12 ${
                    formData.password && isPasswordValid
                      ? 'border-green-300 focus:ring-green-500'
                      : formData.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-indigo-500'
                  }`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Password strength indicators */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {[
                      { key: 'length', label: 'At least 12 characters' },
                      { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
                      { key: 'lowercase', label: 'One lowercase letter (a-z)' },
                      { key: 'multipleNumbers', label: 'At least two numbers (0-9)' },
                      { key: 'multipleSpecial', label: 'At least two special characters (!@#$%^&*)' },
                      { key: 'noCommonPatterns', label: 'No repeating characters (aaa, 111)' },
                      { key: 'notSequential', label: 'No sequential patterns (abc, 123)' },
                      { key: 'notKeyboard', label: 'No keyboard patterns (qwe, asd)' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className={`flex items-center space-x-2 ${
                          passwordValidation[key] ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {passwordValidation[key] ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          <XMarkIcon className="w-4 h-4" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Submit button */}
            <FormButton
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={loading || (formData.password && !isPasswordValid)}
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </FormButton>
          </form>
        </div>

        {/* Bottom text */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/onboarding"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}