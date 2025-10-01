import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

export default function TenantSelectionPage() {
  const { userTenants, setCurrentTenant, loading, user, invalidateSession } = useSession()
  const navigate = useNavigate()

  // User tenants are already loaded in SessionContext

  // Don't auto-redirect to onboarding - let user choose

  const handleSelectTenant = async (tenant) => {
    console.log('🏢 [TenantSelection] handleSelectTenant: Starting tenant selection for:', tenant)
    console.log('🔑 [TenantSelection] handleSelectTenant: Current localStorage tokens:', {
      accessToken: localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING',
      refreshToken: localStorage.getItem('refreshToken') ? 'EXISTS' : 'MISSING',
      allKeys: Object.keys(localStorage)
    })

    const result = await setCurrentTenant(tenant.tenantId)
    console.log('🏢 [TenantSelection] handleSelectTenant: setCurrentTenant result:', result)

    if (result.success) {
      console.log('✅ [TenantSelection] handleSelectTenant: Tenant set successfully, navigating to dashboard')
      navigate('/dashboard')
    } else {
      console.error('❌ [TenantSelection] handleSelectTenant: Failed to set tenant:', result.error)
    }
  }

  const handleCreateTenant = () => {
    navigate('/brewery-setup')
  }

  const handleLogout = async () => {
    await invalidateSession()
    navigate('/onboarding')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fermentum-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Select Your Brewery
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back, {user?.displayName}! Choose a brewery to manage.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {userTenants.length > 0 ? (
            <div className="space-y-4">
              {userTenants.map((tenant) => (
                <button
                  key={tenant.tenantId}
                  onClick={() => handleSelectTenant(tenant)}
                  className="w-full flex items-center p-4 border border-gray-300 rounded-lg hover:border-fermentum-500 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400 group-hover:text-fermentum-500" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-fermentum-900">
                      {tenant.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Role: {tenant.userRole}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="text-sm text-gray-400 group-hover:text-fermentum-500">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No breweries</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first brewery.
              </p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleCreateTenant}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fermentum-600 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Set Up Your Brewery
            </button>
          </div>

          {userTenants.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                You can switch between breweries anytime from the dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}