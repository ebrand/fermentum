import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { invitationsAPI } from '../utils/api'
import { PlusIcon, BuildingOfficeIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { TenantIdCompact } from '../components/IdDisplay'

export default function TenantSelectionPage() {
  const { userTenants, setCurrentTenant, loading, user, invalidateSession } = useSession()
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [invitationsLoading, setInvitationsLoading] = useState(true)

  // Load pending invitations for this user's email
  useEffect(() => {
    const loadInvitations = async () => {
      if (!user?.email) return

      try {
        setInvitationsLoading(true)
        console.log('🎯 [TenantSelection] Checking invitations for email:', user.email)

        const response = await invitationsAPI.getInvitationsByEmail(user.email)
        if (response.data.success) {
          setInvitations(response.data.data)
          console.log('✅ [TenantSelection] Found invitations:', response.data.data)
        } else {
          console.log('⚠️ [TenantSelection] No invitations found')
          setInvitations([])
        }
      } catch (error) {
        console.error('❌ [TenantSelection] Error loading invitations:', error)
        setInvitations([])
      } finally {
        setInvitationsLoading(false)
      }
    }

    loadInvitations()
  }, [user?.email])

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

  const handleAcceptInvitation = async (invitation) => {
    try {
      console.log('🎯 [TenantSelection] Accepting invitation:', invitation)

      const response = await invitationsAPI.acceptInvitation(invitation.invitationId, {
        userId: user.userId
      })

      if (response.data.success) {
        console.log('✅ [TenantSelection] Invitation accepted successfully')

        // Refresh the session to get updated tenants
        // This will trigger SessionContext to reload user tenants
        window.location.reload() // Simple approach for now
      } else {
        console.error('❌ [TenantSelection] Failed to accept invitation:', response.data.message)
        alert('Failed to accept invitation: ' + response.data.message)
      }
    } catch (error) {
      console.error('❌ [TenantSelection] Error accepting invitation:', error)
      alert('Error accepting invitation. Please try again.')
    }
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-fermentum-800">
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
                  className="w-full flex items-center p-4 border border-gray-300 border-2 rounded-lg hover:border-fermentum-700 hover:border-2 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400 group-hover:text-fermentum-500" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-fermentum-900">
                      {tenant.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Role: {tenant.userRole}</span>
                      <span>•</span>
                      <TenantIdCompact tenantId={tenant.tenantId} />
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

          {/* Pending Invitations Section */}
          {!invitationsLoading && invitations.length > 0 && (
            <div className="mt-6">
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Pending Invitations
                </h3>
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.invitationId}
                      className="p-4 border border-blue-200 rounded-lg bg-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.tenantName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>Role: {invitation.role}</span>
                            <span>•</span>
                            <span>Expires: {invitation.expirationDate}</span>
                            {invitation.tenantId && (
                              <>
                                <span>•</span>
                                <TenantIdCompact tenantId={invitation.tenantId} />
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAcceptInvitation(invitation)}
                          className="ml-4 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleCreateTenant}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500"
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