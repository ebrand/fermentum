import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import { authAPI } from '../utils/api'
import DashboardLayout from '../components/DashboardLayout'
import { FormField, FormButton } from '../components/forms'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  KeyIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { UserIdCompact } from '../components/IdDisplay'

export default function UserProfilePage() {
  const { user, refreshSession } = useSession()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('profile')

  // Refresh user data when component loads to get latest address fields
  useEffect(() => {
    refreshSession()
  }, [])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || ''
      }))
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      }

      await authAPI.updateUser(profileData)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      setLoading(false)
      return
    }

    try {
      const passwordData = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }

      await authAPI.updatePassword(passwordData)
      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: UserIcon },
    { id: 'security', name: 'Security', icon: KeyIcon }
  ]

  return (
    <DashboardLayout
      title="My Profile"
      subtitle="Manage your account settings and preferences"
      currentPage="Profile"
    >
      <div className="max-w-4xl">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <CameraIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-500">
                  Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                </p>
                {user?.userId && (
                  <div className="text-sm text-gray-500">
                    <UserIdCompact userId={user.userId} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="First Name"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    icon={UserIcon}
                  />
                  <FormField
                    label="Last Name"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    icon={UserIcon}
                  />
                </div>

                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled
                  icon={EnvelopeIcon}
                  helperText="Email cannot be changed. Contact support if you need to update your email."
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  icon={PhoneIcon}
                  placeholder="+1 (555) 123-4567"
                />

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2 text-gray-500" />
                    Address Information
                  </h3>

                  <div className="space-y-4">
                    <FormField
                      label="Street Address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        label="City"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="San Francisco"
                      />
                      <FormField
                        label="State"
                        name="state"
                        type="text"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="CA"
                      />
                      <FormField
                        label="ZIP Code"
                        name="zipCode"
                        type="text"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="94102"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <FormButton type="submit" loading={loading}>
                    Save Profile
                  </FormButton>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Authentication Methods Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Authentication Methods</h4>
                  <div className="space-y-4">
                    {/* OAuth Provider */}
                    {user?.stytchUserId && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">OAuth Provider</p>
                          <p className="text-sm text-gray-600">Google or Apple authentication</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                      </div>
                    )}

                    {/* Email/Password */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email & Password</p>
                        <p className="text-sm text-gray-600">Traditional login method</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>

                    {/* Email Verification */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Verification</p>
                        <p className="text-sm text-gray-600">{user?.emailVerified ? 'Email address verified' : 'Email verification pending'}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.emailVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user?.emailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connect Additional Methods (if only password auth) */}
                {!user?.stytchUserId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <KeyIcon className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
                      <div className="flex-grow">
                        <h3 className="text-sm font-medium text-blue-800">
                          Connect Additional Authentication Methods
                        </h3>
                        <p className="text-sm text-blue-700 mt-1 mb-3">
                          Link Google or Apple authentication for faster, more secure login.
                        </p>
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={() => {/* TODO: Implement OAuth linking */}}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Connect Google
                          </button>
                          <button
                            type="button"
                            onClick={() => {/* TODO: Implement OAuth linking */}}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Connect Apple
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Change Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Change Password</h4>

                  {user?.stytchUserId ? (
                    // User has OAuth - show info about password being optional
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        You can sign in using OAuth, but you can also set a password for additional login options.
                      </p>
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <FormField
                          label="Current Password (leave blank if none set)"
                          name="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          icon={KeyIcon}
                        />

                        <FormField
                          label="New Password"
                          name="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          required
                          icon={KeyIcon}
                          helperText="Must be at least 8 characters long"
                        />

                        <FormField
                          label="Confirm New Password"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          icon={KeyIcon}
                        />

                        <div className="flex justify-end pt-4">
                          <FormButton type="submit" loading={loading}>
                            Set Password
                          </FormButton>
                        </div>
                      </form>
                    </div>
                  ) : (
                    // Email/password only user - standard password change
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex">
                          <KeyIcon className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                          <div>
                            <h3 className="text-sm font-medium text-yellow-800">
                              Password Security
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              Choose a strong password with at least 8 characters including letters, numbers, and symbols.
                            </p>
                          </div>
                        </div>
                      </div>

                      <FormField
                        label="Current Password"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        required
                        icon={KeyIcon}
                      />

                      <FormField
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        required
                        icon={KeyIcon}
                        helperText="Must be at least 8 characters long"
                      />

                      <FormField
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        icon={KeyIcon}
                      />

                      <div className="flex justify-end pt-4">
                        <FormButton type="submit" loading={loading}>
                          Update Password
                        </FormButton>
                      </div>
                    </form>
                  )}
                </div>

                {/* Security Recommendations */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Security Recommendations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {user?.stytchUserId ? (
                      <>
                        <li>• Keep your OAuth provider account secure with strong passwords</li>
                        <li>• Enable two-factor authentication on your OAuth provider account</li>
                        <li>• Consider setting a backup password for additional login options</li>
                        <li>• Review your OAuth provider's security settings regularly</li>
                      </>
                    ) : (
                      <>
                        <li>• Use a unique, strong password for your account</li>
                        <li>• Consider connecting Google or Apple for faster login</li>
                        <li>• Enable two-factor authentication when available</li>
                        <li>• Monitor your account for any suspicious activity</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}