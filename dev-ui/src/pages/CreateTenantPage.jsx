import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { tenantAPI } from '../utils/api'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function CreateTenantPage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: '',
    domain: '',
    planType: 'trial',
    timezone: 'America/Chicago',
    locale: 'en-US'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { refreshSession } = useSession()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

      setFormData(prev => ({
        ...prev,
        slug: slug,
        subdomain: slug
      }))
    }

    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Brewery name is required')
      setLoading(false)
      return
    }

    if (!formData.slug.trim()) {
      setError('Slug is required')
      setLoading(false)
      return
    }

    try {
      const result = await tenantAPI.createTenant(formData)

      if (result.data) {
        // Refresh session to get updated tenant list
        await refreshSession()
        // Redirect to tenant selection
        navigate('/tenant-selection')
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create brewery')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Link
            to="/tenant-selection"
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create Your Brewery
          </h2>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set up your brewery to start managing recipes, batches, and more.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Brewery Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input-field mt-1"
                placeholder="e.g., Austin Ale Works"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                URL Slug *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  fermentum.dev/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-fermentum-500 focus:border-fermentum-500 sm:text-sm"
                  placeholder="austin-ale-works"
                  value={formData.slug}
                  onChange={handleChange}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This will be your brewery's unique identifier. Only letters, numbers, and hyphens allowed.
              </p>
            </div>

            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                Subdomain (Optional)
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300 focus:ring-fermentum-500 focus:border-fermentum-500 sm:text-sm"
                  placeholder="austin-ale-works"
                  value={formData.subdomain}
                  onChange={handleChange}
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  .fermentum.app
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                Custom Domain (Optional)
              </label>
              <input
                id="domain"
                name="domain"
                type="text"
                className="input-field mt-1"
                placeholder="brewery.example.com"
                value={formData.domain}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                You can configure a custom domain later in settings.
              </p>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                className="input-field mt-1"
                value={formData.timezone}
                onChange={handleChange}
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="UTC">UTC</option>
              </select>
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
                    Creating Brewery...
                  </div>
                ) : (
                  'Create Brewery'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Need help?</span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                Questions about setting up your brewery?{' '}
                <a href="mailto:support@fermentum.dev" className="text-fermentum-600 hover:text-fermentum-500">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}