import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SlideDrawer from './SlideDrawer'
import StyledCombobox from './common/StyledCombobox'
import { useSession } from '../contexts/SessionContext'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import { usersAPI, invitationsAPI } from '../utils/api'
import {
  BuildingOfficeIcon,
  UsersIcon,
  PlusIcon,
  EnvelopeIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  StarIcon,
  CogIcon,
  XMarkIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

const BreweryOperationsDrawer = ({ isOpen, onClose, onOpen }) => {
  const navigate = useNavigate()
  const sessionContext = useSession()
  const { user, userTenants, currentTenant, setCurrentTenant, currentBrewery, setCurrentBrewery, session } = sessionContext
  const { showSuccess, showError } = useAdvancedNotification()

  const [activeTab, setActiveTab] = useState('breweries')
  const [tenantUsers, setTenantUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [invitations, setInvitations] = useState([])
  const [invitationsLoading, setInvitationsLoading] = useState(false)

  // Role options for the combobox
  const roleOptions = [
    { id: 'member', name: 'Member' },
    { id: 'brewer', name: 'Brewer' },
    { id: 'manager', name: 'Manager' },
    { id: 'admin', name: 'Admin' }
  ]

  // Selected role object for combobox
  const selectedRole = roleOptions.find(role => role.id === inviteRole) || roleOptions[0]

  // Get user's subscription plan info
  const planInfo = useMemo(() => {
    const tenants = sessionContext?.session?.tenants || userTenants || []
    const firstTenant = tenants[0]

    if (!firstTenant) {
      return {
        name: 'Starter',
        maxBreweries: 1,
        maxUsers: 3,
        features: ['Basic Operations', 'Limited Batches'],
        currentBreweries: tenants.length
      }
    }

    // Plan features mapping
    const planFeatures = {
      'Starter': ['Basic Operations', 'Limited Batches', 'Community Support'],
      'Professional': ['Unlimited Batches', 'Quality Control', 'Inventory Management', 'Analytics', 'Email Support'],
      'Enterprise': ['Everything in Professional', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee']
    }

    // Use actual plan data from backend
    const planName = firstTenant.PlanName || firstTenant.planName || 'Starter'
    const breweryLimit = firstTenant.BreweryLimit || firstTenant.breweryLimit || 1
    const userLimit = firstTenant.UserLimit || firstTenant.userLimit || 3

    return {
      name: planName,
      maxBreweries: breweryLimit,
      maxUsers: userLimit,
      features: planFeatures[planName] || planFeatures['Starter'],
      currentBreweries: tenants.length,
      subscriptionStatus: firstTenant?.subscriptionStatus,
      trialEndsAt: firstTenant?.trialEndsAt,
      currentPeriodEnd: firstTenant?.currentPeriodEnd
    }
  }, [sessionContext, userTenants])

  // Function to load tenant users
  const loadTenantUsers = async () => {
    if (!currentTenant) return

    setUsersLoading(true)
    try {
      const response = await usersAPI.getTenantUsers(currentTenant.tenantId)
      if (response.data.success) {
        setTenantUsers(response.data.data)
      } else {
        console.error('Failed to load users:', response.data.message)
        setTenantUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setTenantUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  // Function to load tenant invitations
  const loadTenantInvitations = async () => {
    if (!currentTenant) return

    setInvitationsLoading(true)
    try {
      const response = await invitationsAPI.getTenantInvitations(currentTenant.tenantId)
      if (response.data.success) {
        setInvitations(response.data.data)
      } else {
        console.error('Failed to load invitations:', response.data.message)
        setInvitations([])
      }
    } catch (error) {
      console.error('Error loading invitations:', error)
      setInvitations([])
    } finally {
      setInvitationsLoading(false)
    }
  }

  // Load users and invitations when tab changes to users and tenant is selected
  useEffect(() => {
    if (currentTenant && activeTab === 'users' && isOpen) {
      loadTenantUsers()
      loadTenantInvitations()
    }
  }, [currentTenant, activeTab, isOpen])

  const canInviteMoreUsers = planInfo.maxUsers === -1 || tenantUsers.length < planInfo.maxUsers

  const handleSelectBrewery = async (tenant) => {
    try {
      // Set the tenant first
      const tenantResult = await setCurrentTenant(tenant.tenantId)
      if (tenantResult.success) {
        // Find the brewery for this tenant and set it as current
        const tenantBrewery = session?.breweries?.find(b => b.tenantId === tenant.tenantId)
        if (tenantBrewery) {
          const breweryResult = await setCurrentBrewery(tenantBrewery.breweryId)
          if (breweryResult.success) {
            showSuccess(`Switched to ${tenant.name}`)
          } else {
            showError(`Failed to set brewery: ${breweryResult.error}`)
          }
        } else {
          showSuccess(`Switched to ${tenant.name} (no brewery found)`)
        }
      } else {
        showError(`Failed to switch brewery: ${tenantResult.error}`)
      }
    } catch (error) {
      showError('Failed to switch brewery')
      console.error('Error switching brewery:', error)
    }
  }

  const handleInviteUser = async () => {
    console.log('🚀 handleInviteUser called with:', { inviteEmail, currentTenant, userTenants })

    if (!inviteEmail || !currentTenant) {
      console.log('❌ Early return: missing email or tenant', { inviteEmail, currentTenant })
      return
    }

    setInviteLoading(true)
    try {
      // Get the current brewery ID from session context
      const currentBreweryId = currentBrewery?.breweryId ||
                              session?.currentBreweryId ||
                              // Find brewery for current tenant
                              session?.breweries?.find(b => b.tenantId === currentTenant?.tenantId)?.breweryId ||
                              // Fallback to first brewery
                              session?.breweries?.[0]?.breweryId

      console.log('🏭 [Invitation] Brewery resolution debug:', {
        currentBreweryId,
        currentBrewery: currentBrewery?.breweryId,
        sessionCurrentBreweryId: session?.currentBreweryId,
        currentTenantId: currentTenant?.tenantId,
        availableBreweries: session?.breweries?.map(b => ({ id: b.breweryId, tenantId: b.tenantId, name: b.name })),
        tenantBreweryMatch: session?.breweries?.find(b => b.tenantId === currentTenant?.tenantId)
      })

      if (!currentBreweryId) {
        showError('No brewery selected. Please select a brewery first.')
        return
      }

      const invitationData = {
        email: inviteEmail,
        breweryId: currentBreweryId,
        role: inviteRole
      }

      console.log('Creating invitation with data:', invitationData)
      const response = await invitationsAPI.createInvitation(invitationData)
      console.log('Invitation API response:', response.data)

      if (response.data.success) {
        // Show demo notification - no actual email sent
        showSuccess(`🎭 DEMO MODE: Invitation would be sent to ${inviteEmail}! In production, they would receive an email with a link to join ${currentTenant.name}.`)

        // Add the new invitation to the pending invitations list
        if (response.data.data) {
          setInvitations(prev => [...prev, response.data.data])
        }

        // Close form and reset
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteRole('member')

        // Refresh the invitations list to show the new invitation
        loadTenantInvitations()
      } else {
        showError(response.data.message || 'Failed to create invitation')
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      if (error.response?.data?.message) {
        showError(error.response.data.message)
      } else {
        showError('Error sending invitation. Please try again.')
      }
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveUser = async (userId) => {
    if (!currentTenant) return

    if (window.confirm('Are you sure you want to remove this user from the brewery?')) {
      try {
        const response = await usersAPI.removeUserFromTenant(currentTenant.tenantId, userId)
        if (response.data.success) {
          // Remove user from the list
          setTenantUsers(prev => prev.filter(u => u.id !== userId))
          showSuccess('User removed successfully')
        } else {
          showError(response.data.message || 'Failed to remove user')
        }
      } catch (error) {
        console.error('Error removing user:', error)
        if (error.response?.data?.message) {
          showError(error.response.data.message)
        } else {
          showError('Error removing user. Please try again.')
        }
      }
    }
  }

  const handleCancelInvitation = async (invitationId) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        const response = await invitationsAPI.cancelInvitation(invitationId)
        if (response.data.success) {
          // Remove invitation from the list
          setInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId))
          showSuccess('Invitation cancelled successfully')
        } else {
          showError(response.data.message || 'Failed to cancel invitation')
        }
      } catch (error) {
        console.error('Error cancelling invitation:', error)
        if (error.response?.data?.message) {
          showError(error.response.data.message)
        } else {
          showError('Error cancelling invitation. Please try again.')
        }
      }
    }
  }

  const handleCreateAssignment = (user) => {
    // Close the drawer first
    onClose()

    // Navigate to assignments page with pre-selected employee
    const url = `/assignments?assignTo=${user.id}&assigneeName=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}`
    navigate(url)
  }

  const tabs = [
    { id: 'breweries', name: 'Breweries', icon: BuildingOfficeIcon },
    { id: 'users', name: 'Team', icon: UsersIcon }
  ]

  return (
    <>
      <SlideDrawer
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
        title="Brewery Operations"
        subtitle="Manage breweries and team members"
        width="w-[600px]"
        tabText="Operations"
        tabIcon={CogIcon}
      >
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 font-['Menlo','Monaco','monospace'] ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'breweries' && (
          <div className="space-y-6">
            {/* Plan Information */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3 mb-2">
                <StarIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                    {planInfo.name} Plan
                  </h3>
                  <p className="text-xs text-gray-600 font-['Menlo','Monaco','monospace']">
                    {planInfo.currentBreweries} of {planInfo.maxBreweries === -1 ? '∞' : planInfo.maxBreweries} breweries
                  </p>
                </div>
              </div>
            </div>

            {/* Brewery List */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif'] mb-3">
                Your Breweries
              </h3>
              {userTenants.length > 0 ? (
                <div className="space-y-2">
                  {userTenants.map((tenant) => (
                    <div
                      key={tenant.tenantId}
                      className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                        currentTenant?.tenantId === tenant.tenantId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleSelectBrewery(tenant)}
                    >
                      <div className="flex items-center space-x-3">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif'] truncate">
                            {tenant.name}
                          </h4>
                          <p className="text-xs text-gray-500 font-['Menlo','Monaco','monospace']">
                            Role: {tenant.role}
                          </p>
                          {currentTenant?.tenantId === tenant.tenantId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-['Menlo','Monaco','monospace'] mt-1">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BuildingOfficeIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 font-['Menlo','Monaco','monospace']">
                    No breweries found
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {currentTenant ? (
              <>
                {/* User Plan Info */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UsersIcon className="h-5 w-5 text-purple-600" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                          Team Management
                        </h3>
                        <p className="text-xs text-gray-600 font-['Menlo','Monaco','monospace']">
                          {tenantUsers.length} of {planInfo.maxUsers === -1 ? '∞' : planInfo.maxUsers} users
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add User Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                    Team Members
                  </h3>
                  <button
                    onClick={() => setShowInviteModal(!showInviteModal)}
                    disabled={!canInviteMoreUsers}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 font-['Menlo','Monaco','monospace'] ${
                      canInviteMoreUsers
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <PlusIcon className={`w-3 h-3 mr-1 transition-transform duration-200 ${showInviteModal ? 'rotate-45' : ''}`} />
                    Invite
                  </button>
                </div>

                {/* Expandable Invite Form */}
                {showInviteModal && canInviteMoreUsers && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                        Invite Team Member
                      </h4>
                      <button
                        onClick={() => setShowInviteModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="user@example.com"
                      />
                    </div>

                    <div>
                      <StyledCombobox
                        label="Role"
                        options={roleOptions}
                        value={selectedRole}
                        onChange={(role) => setInviteRole(role.id)}
                        placeholder="Select role..."
                      />
                    </div>

                    <div className="text-xs text-gray-500 font-['Menlo','Monaco','monospace']">
                      An invitation will be sent to this email address.
                    </div>

                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowInviteModal(false)
                          setInviteEmail('')
                          setInviteRole('member')
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-150 font-['Menlo','Monaco','monospace']"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleInviteUser}
                        disabled={!inviteEmail || inviteLoading}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors duration-150 font-['Menlo','Monaco','monospace'] disabled:cursor-not-allowed"
                      >
                        {inviteLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Sending...
                          </div>
                        ) : (
                          'Send Invitation'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {!canInviteMoreUsers && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 mr-2" />
                      <p className="text-xs text-orange-700 font-['Menlo','Monaco','monospace']">
                        User limit reached for {planInfo.name} plan.
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Users List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif'] mb-3">
                    Active Members ({tenantUsers.length})
                  </h4>
                  {usersLoading ? (
                    <div className="flex items-center justify-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tenantUsers.map((user) => (
                        <div key={user.id} className="border border-gray-100 rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <UsersIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                                  {user.firstName} {user.lastName}
                                </h4>
                                <p className="text-xs text-gray-500 font-['Menlo','Monaco','monospace']">
                                  {user.email}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-['Menlo','Monaco','monospace'] ${
                                    user.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                                    user.role === 'admin' ? 'bg-green-100 text-green-800' :
                                    user.role === 'brewer' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {user.role}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 font-['Menlo','Monaco','monospace']">
                                    Active
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Badge Button */}
                              <button
                                onClick={() => handleCreateAssignment(user)}
                                className="text-fermentum-600 hover:text-fermentum-800 hover:bg-fermentum-50 p-1.5 rounded-md transition-colors duration-150"
                                title="Create assignment"
                              >
                                <ClipboardDocumentListIcon className="h-4 w-4" />
                              </button>
                              {/* Delete Button - only for non-owners */}
                              {user.role !== 'owner' && (
                                <button
                                  onClick={() => handleRemoveUser(user.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-md transition-colors duration-150"
                                  title="Remove user"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {tenantUsers.length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-500 font-['Menlo','Monaco','monospace']">
                          No active members yet
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pending Invitations List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif'] mb-3">
                    Pending Invitations ({invitations.length})
                  </h4>
                  {invitationsLoading ? (
                    <div className="flex items-center justify-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invitations.map((invitation) => (
                        <div key={invitation.invitationId} className="border border-orange-100 rounded-lg p-3 bg-orange-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <EnvelopeIcon className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                                  {invitation.email}
                                </h4>
                                <p className="text-xs text-gray-500 font-['Menlo','Monaco','monospace']">
                                  Invited {invitation.invitationDate}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-['Menlo','Monaco','monospace'] ${
                                    invitation.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                                    invitation.role === 'admin' ? 'bg-green-100 text-green-800' :
                                    invitation.role === 'brewer' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {invitation.role}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-['Menlo','Monaco','monospace'] ${
                                    invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    invitation.status === 'expired' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {invitation.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {invitation.status === 'pending' && (
                              <button
                                onClick={() => handleCancelInvitation(invitation.invitationId)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Cancel invitation"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {invitations.length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-500 font-['Menlo','Monaco','monospace']">
                          No pending invitations
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 font-['Inter','-apple-system','system-ui','sans-serif']">
                  Select a brewery first
                </h3>
                <p className="mt-1 text-xs text-gray-500 font-['Menlo','Monaco','monospace']">
                  Choose a brewery to manage team members.
                </p>
                <button
                  onClick={() => setActiveTab('breweries')}
                  className="mt-3 inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 font-['Menlo','Monaco','monospace']"
                >
                  <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                  View Breweries
                </button>
              </div>
            )}
          </div>
        )}

      </SlideDrawer>

    </>
  )
}

export default BreweryOperationsDrawer