import React, { useState, useEffect } from 'react'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import { pluginAPI } from '../utils/api'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import Modal from './common/Modal'

const QUICKBOOKS_CONFIG_STEPS = [
  {
    id: 'overview',
    title: 'QuickBooks Online Integration',
    description: 'Connect your brewery to QuickBooks Online to sync financial data automatically.'
  },
  {
    id: 'connect',
    title: 'Connect to QuickBooks',
    description: 'Authenticate with QuickBooks Online to allow Fermentum to access your financial data.'
  },
  {
    id: 'configure',
    title: 'Configure Sync Settings',
    description: 'Choose what data to sync and how often.'
  },
  {
    id: 'complete',
    title: 'Setup Complete',
    description: 'Your QuickBooks integration is ready to use.'
  }
]

function QuickBooksConfigWizard({ plugin, onComplete, onCancel, isInstalled = false }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingToQuickBooks, setConnectingToQuickBooks] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [authData, setAuthData] = useState({
    accessToken: '',
    refreshToken: '',
    realmId: '',
    tokenExpiresAt: ''
  })
  const [syncConfig, setSyncConfig] = useState({
    syncAccounts: true,
    syncCustomers: true,
    syncItems: true,
    syncInvoices: true,
    syncPayments: true,
    autoSyncEnabled: true,
    syncFrequency: 'daily',
    dateRange: 90
  })
  const { showNotification } = useAdvancedNotification()

  // OAuth2 handler functions
  const handleQuickBooksConnect = async () => {
    try {
      setConnectingToQuickBooks(true)

      // Get OAuth URL from backend
      const response = await pluginAPI.getQuickBooksOAuthUrl()
      if (response.data && response.data.oauthUrl) {
        // Redirect to QuickBooks OAuth page
        window.location.href = response.data.oauthUrl
      } else {
        throw new Error('Failed to get OAuth URL')
      }
    } catch (error) {
      console.error('Error initiating QuickBooks OAuth:', error)
      showNotification('Failed to initiate QuickBooks connection', 'error')
      setConnectingToQuickBooks(false)
    }
  }

  const handleQuickBooksReconnect = () => {
    handleQuickBooksConnect()
  }

  const handleQuickBooksDisconnect = async () => {
    try {
      // Clear auth data
      setAuthData({
        accessToken: '',
        refreshToken: '',
        realmId: '',
        tokenExpiresAt: ''
      })
      setConnectionStatus(null)
      showNotification('Disconnected from QuickBooks Online', 'success')
    } catch (error) {
      console.error('Error disconnecting from QuickBooks:', error)
      showNotification('Failed to disconnect from QuickBooks', 'error')
    }
  }

  // Check if we have existing auth data on component mount
  useEffect(() => {
    if (isInstalled && plugin?.authData) {
      try {
        const parsedAuthData = typeof plugin.authData === 'string'
          ? JSON.parse(plugin.authData)
          : plugin.authData

        if (parsedAuthData?.AccessToken) {
          setAuthData({
            accessToken: parsedAuthData.AccessToken,
            refreshToken: parsedAuthData.RefreshToken,
            realmId: parsedAuthData.RealmId,
            tokenExpiresAt: parsedAuthData.ExpiresAt,
            companyName: parsedAuthData.CompanyName || 'Connected Company',
            companyId: parsedAuthData.RealmId
          })
          setConnectionStatus('connected')
        }
      } catch (error) {
        console.error('Error parsing existing auth data:', error)
      }
    }
  }, [isInstalled, plugin])

  // Handle OAuth callback from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const realmId = urlParams.get('realmId')

    if (code && state && realmId) {
      handleOAuthCallback(code, state, realmId)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleOAuthCallback = async (code, state, realmId) => {
    try {
      setConnectingToQuickBooks(true)

      // Exchange code for tokens
      const response = await pluginAPI.handleQuickBooksOAuthCallback({
        code,
        state,
        realmId
      })

      if (response.data.success && response.data.authData) {
        const authResponse = response.data.authData
        setAuthData({
          accessToken: authResponse.AccessToken,
          refreshToken: authResponse.RefreshToken,
          realmId: authResponse.RealmId,
          tokenExpiresAt: authResponse.ExpiresAt,
          companyName: authResponse.CompanyName || 'QuickBooks Company',
          companyId: authResponse.RealmId
        })
        setConnectionStatus('connected')
        showNotification('Successfully connected to QuickBooks Online', 'success')
        setCurrentStep(2) // Move to configure step
      } else {
        throw new Error(response.data.message || 'OAuth callback failed')
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      setConnectionStatus('error')
      showNotification('Failed to complete QuickBooks connection', 'error')
    } finally {
      setConnectingToQuickBooks(false)
    }
  }

  const handleInstallWithConfig = async () => {
    try {
      // Transform frontend config to match backend QBOConfiguration format
      const syncTypes = []
      if (syncConfig.syncAccounts) syncTypes.push('accounts')
      if (syncConfig.syncCustomers) syncTypes.push('customers')
      if (syncConfig.syncItems) syncTypes.push('items')
      if (syncConfig.syncInvoices) syncTypes.push('invoices')
      if (syncConfig.syncPayments) syncTypes.push('payments')

      // Transform auth data to match backend QBOAuthData format
      const transformedAuthData = authData ? {
        AccessToken: authData.accessToken,
        RefreshToken: authData.refreshToken,
        RealmId: authData.realmId,
        BaseUrl: 'https://sandbox-quickbooks.api.intuit.com',
        ExpiresAt: authData.tokenExpiresAt
      } : null

      const configuration = {
        SyncFrequency: syncConfig.syncFrequency,
        SyncTypes: syncTypes,
        DateRange: syncConfig.dateRange
      }

      if (isInstalled) {
        // Update existing plugin configuration
        const updateResponse = await pluginAPI.updatePluginConfiguration(plugin.tenantPluginId, { configuration })

        if (updateResponse.data.success) {
          showNotification(`${plugin.displayName} configuration updated successfully`, 'success')
          setCurrentStep(3) // Complete step
          setTimeout(() => onComplete(plugin), 1500)
        } else {
          showNotification(updateResponse.data.message || 'Failed to update plugin configuration', 'error')
        }
      } else {
        // Install new plugin with configuration only
        const installResponse = await pluginAPI.installPlugin({
          pluginId: plugin.pluginId,
          configuration: configuration
        })

        if (installResponse.data.success) {
          const installedPlugin = installResponse.data.data

          // Update auth data separately if provided
          if (transformedAuthData) {
            try {
              const authResponse = await pluginAPI.updatePluginAuth(installedPlugin.tenantPluginId, {
                authData: transformedAuthData
              })

              if (!authResponse.data.success) {
                showNotification('Plugin installed but failed to set authentication', 'warning')
              }
            } catch (authError) {
              console.error('Error setting plugin auth:', authError)
              showNotification('Plugin installed but failed to set authentication', 'warning')
            }
          }

          showNotification(`${plugin.displayName} installed successfully`, 'success')
          setCurrentStep(3) // Complete step
          setTimeout(() => onComplete(installedPlugin), 1500)
        } else {
          showNotification(installResponse.data.message || 'Failed to install plugin', 'error')
        }
      }
    } catch (error) {
      console.error('Error configuring plugin:', error)
      showNotification(`Failed to ${isInstalled ? 'update' : 'install'} plugin`, 'error')
    }
  }

  const renderOverviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-green-600">
          <LinkIcon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">QuickBooks Online Integration</h3>
        <p className="mt-2 text-sm text-gray-600">
          Sync your financial data automatically between your brewery and QuickBooks Online.
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">What will be synced?</h4>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• Chart of accounts</li>
              <li>• Customer information</li>
              <li>• Products and services</li>
              <li>• Invoices and sales</li>
              <li>• Payments and receipts</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="flex">
          <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-900">Important Notes</h4>
            <ul className="mt-2 text-sm text-yellow-800 space-y-1">
              <li>• Data will be read-only in Fermentum</li>
              <li>• Changes must be made in QuickBooks Online</li>
              <li>• Initial sync may take several minutes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Connect to QuickBooks</h3>
        <p className="mt-2 text-sm text-gray-600">
          Click the button below to securely connect your QuickBooks Online account.
        </p>
      </div>

      {connectionStatus === 'connected' && authData ? (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-900">Successfully Connected</h4>
              <p className="mt-1 text-sm text-green-700">
                Connected to: <strong>{authData.companyName}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Company ID: {authData.companyId}
              </p>
            </div>
          </div>
        </div>
      ) : connectionStatus === 'error' ? (
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-900">Connection Failed</h4>
              <p className="mt-1 text-sm text-red-700">
                Unable to connect to QuickBooks Online. Please try again.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={handleQuickBooksConnect}
            disabled={connectingToQuickBooks || isConnecting}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(connectingToQuickBooks || isConnecting) ? (
              <>
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                Connect to QuickBooks
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            You'll be redirected to QuickBooks to authorize access
          </p>
        </div>
      )}
    </div>
  )

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Configure Sync Settings</h3>
        <p className="mt-2 text-sm text-gray-600">
          Choose what data to sync and how often to update it.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Data to Sync</h4>
          <div className="space-y-2">
            {[
              { key: 'syncAccounts', label: 'Chart of Accounts', description: 'Account categories and balances' },
              { key: 'syncCustomers', label: 'Customers', description: 'Customer information and contacts' },
              { key: 'syncItems', label: 'Products & Services', description: 'Items, pricing, and inventory' },
              { key: 'syncInvoices', label: 'Invoices', description: 'Sales invoices and billing' },
              { key: 'syncPayments', label: 'Payments', description: 'Payment receipts and transactions' }
            ].map(item => (
              <label key={item.key} className="flex items-start">
                <input
                  type="checkbox"
                  checked={syncConfig[item.key]}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sync Schedule</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncConfig.autoSyncEnabled}
                onChange={(e) => setSyncConfig(prev => ({ ...prev, autoSyncEnabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable automatic sync</span>
            </label>

            {syncConfig.autoSyncEnabled && (
              <div className="ml-6">
                <label className="block text-sm text-gray-700 mb-1">Sync frequency:</label>
                <select
                  value={syncConfig.syncFrequency}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, syncFrequency: e.target.value }))}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="hourly">Every hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">QuickBooks Connection</h4>
          <p className="text-sm text-gray-600 mb-4">
            Connect securely to your QuickBooks Online account using official Intuit OAuth2 authentication.
          </p>

          {/* Check if already connected */}
          {authData?.AccessToken ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-green-800">Connected to QuickBooks</h5>
                  <p className="text-sm text-green-600 mt-1">
                    Company ID: {authData.RealmId}
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    Token expires: {authData.ExpiresAt ? new Date(authData.ExpiresAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleQuickBooksReconnect}
                  className="text-sm bg-white text-green-700 border border-green-300 rounded px-3 py-1 hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  Reconnect
                </button>
                <button
                  type="button"
                  onClick={handleQuickBooksDisconnect}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h5 className="text-sm font-medium text-blue-900 mb-2">Ready to Connect</h5>
                <p className="text-sm text-blue-700 mb-4">
                  Click below to securely connect your QuickBooks Online account. You'll be redirected to Intuit's secure login page.
                </p>
                <button
                  type="button"
                  onClick={handleQuickBooksConnect}
                  disabled={connectingToQuickBooks}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingToQuickBooks ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a8.936 8.936 0 00-6.77-6.77 9.005 9.005 0 00-3.662-.138c-.95 0-1.87.07-2.76.207-1.27.194-2.25 1.174-2.444 2.444-.137.89-.207 1.81-.207 2.76s.07 1.87.207 2.76c.194 1.27 1.174 2.25 2.444 2.444.89.137 1.81.207 2.76.207s1.87-.07 2.76-.207c1.27-.194 2.25-1.174 2.444-2.444.137-.89.207-1.81.207-2.76zm-2 0c0 .86-.06 1.704-.176 2.535-.166.943-.84 1.617-1.783 1.783-.831.116-1.675.176-2.535.176s-1.704-.06-2.535-.176c-.943-.166-1.617-.84-1.783-1.783-.116-.831-.176-1.675-.176-2.535s.06-1.704.176-2.535c.166-.943.84-1.617 1.783-1.783.831-.116 1.675-.176 2.535-.176s1.704.06 2.535.176c.943.166 1.617.84 1.783 1.783.116.831.176 1.675.176 2.535z"/>
                      </svg>
                      Connect to QuickBooks
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
        <CheckCircleIcon className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Setup Complete!</h3>
        <p className="mt-2 text-sm text-gray-600">
          Your QuickBooks Online integration has been successfully configured.
        </p>
      </div>
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Next Steps:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Initial data sync will start automatically</li>
          <li>• Check the sync status in the integrations page</li>
          <li>• Data will appear in your brewery dashboard shortly</li>
        </ul>
      </div>
    </div>
  )

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true
      case 1: return connectionStatus === 'connected'
      case 2: return Object.values(syncConfig).some(v => v === true)
      case 3: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep === 2) {
      handleInstallWithConfig()
    } else if (currentStep < QUICKBOOKS_CONFIG_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center">
        <nav aria-label="Progress" className="flex space-x-4">
          {QUICKBOOKS_CONFIG_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < currentStep
                  ? 'bg-green-100 text-green-600'
                  : index === currentStep
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < QUICKBOOKS_CONFIG_STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ml-2 ${
                  index < currentStep ? 'bg-green-200' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && renderOverviewStep()}
        {currentStep === 1 && renderConnectStep()}
        {currentStep === 2 && renderConfigureStep()}
        {currentStep === 3 && renderCompleteStep()}
      </div>

      {/* Navigation buttons */}
      {currentStep < 3 && (
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={currentStep === 0 ? onCancel : handleBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 2 ? (isInstalled ? 'Update Configuration' : 'Install Plugin') : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}

// Square POS Configuration Wizard
function SquarePOSConfigWizard({ plugin, onComplete, onCancel, isInstalled = false }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [authData, setAuthData] = useState(null)
  const [config, setConfig] = useState({
    locationId: '',
    syncInventory: true,
    syncTransactions: true,
    syncCustomers: true,
    autoSyncEnabled: true,
    syncFrequency: 'hourly'
  })
  const { showNotification } = useAdvancedNotification()

  const simulateSquareOAuth = async () => {
    setIsConnecting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockAuthData = {
        applicationId: 'sandbox-sq0idp-' + Date.now(),
        accessToken: 'sandbox-sq0atb-' + Date.now(),
        locationId: 'L7HG8X9Y2Z3AB4CD',
        locationName: 'Main Taproom',
        merchantId: 'ML4Y3XXXXXXXXXXXXX'
      }
      setAuthData(mockAuthData)
      setConfig(prev => ({ ...prev, locationId: mockAuthData.locationId }))
      setConnectionStatus('connected')
      showNotification('Successfully connected to Square POS', 'success')
      setCurrentStep(2)
    } catch (error) {
      setConnectionStatus('error')
      showNotification('Failed to connect to Square POS', 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleInstall = async () => {
    try {
      const configuration = { ...config, authData }
      const response = await pluginAPI.installPlugin({
        pluginId: plugin.pluginId,
        configuration: configuration
      })

      if (response.data.success) {
        showNotification(`${plugin.displayName} installed successfully`, 'success')
        setCurrentStep(3)
        setTimeout(() => onComplete(response.data.data), 1500)
      }
    } catch (error) {
      console.error('Error configuring Square POS:', error)
      showNotification('Failed to install Square POS integration', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <LinkIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Square POS Integration</h3>
            <p className="mt-2 text-sm text-gray-600">
              Sync sales data, inventory, and customer information from your Square POS system.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">What will be synced?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Transaction data and sales reports</li>
              <li>• Inventory levels and product catalog</li>
              <li>• Customer information and loyalty data</li>
            </ul>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Connect to Square</h3>
            <p className="mt-2 text-sm text-gray-600">
              Connect your Square account to sync POS data with your brewery management system.
            </p>
          </div>
          {connectionStatus === 'connected' ? (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-900">Connected Successfully</h4>
                  <p className="mt-1 text-sm text-green-700">
                    Connected to: <strong>{authData?.locationName}</strong>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={simulateSquareOAuth}
                disabled={isConnecting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                    Connect to Square
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Configure Sync Settings</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Data to Sync</h4>
              <div className="space-y-2">
                {[
                  { key: 'syncTransactions', label: 'Transaction Data', description: 'Sales and payment information' },
                  { key: 'syncInventory', label: 'Inventory Levels', description: 'Product quantities and availability' },
                  { key: 'syncCustomers', label: 'Customer Data', description: 'Customer profiles and loyalty info' }
                ].map(item => (
                  <label key={item.key} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={config[item.key]}
                      onChange={(e) => setConfig(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoSyncEnabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoSyncEnabled: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable automatic sync</span>
              </label>
              {config.autoSyncEnabled && (
                <div className="ml-6 mt-2">
                  <select
                    value={config.syncFrequency}
                    onChange={(e) => setConfig(prev => ({ ...prev, syncFrequency: e.target.value }))}
                    className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="hourly">Every hour</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Square POS Connected!</h3>
            <p className="mt-2 text-sm text-gray-600">
              Your Square POS integration is now active and syncing data.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={currentStep === 0 ? onCancel : () => setCurrentStep(prev => prev - 1)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </button>

        {currentStep < 3 && (
          <button
            onClick={currentStep === 2 ? handleInstall : () => setCurrentStep(prev => prev + 1)}
            disabled={currentStep === 1 && connectionStatus !== 'connected'}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {currentStep === 2 ? 'Install Integration' : 'Next'}
          </button>
        )}
      </div>
    </div>
  )
}

// Untappd Configuration Wizard
function UntappdConfigWizard({ plugin, onComplete, onCancel, isInstalled = false }) {
  const [apiKey, setApiKey] = useState('')
  const [breweryId, setBreweryId] = useState('')
  const [syncSettings, setSyncSettings] = useState({
    syncBeers: true,
    syncRatings: true,
    syncCheckins: true,
    syncEvents: true
  })
  const [isInstalling, setIsInstalling] = useState(false)
  const { showNotification } = useAdvancedNotification()

  const handleInstall = async () => {
    try {
      setIsInstalling(true)
      const configuration = {
        apiKey,
        breweryId,
        syncSettings
      }

      const response = await pluginAPI.installPlugin({
        pluginId: plugin.pluginId,
        configuration: configuration
      })

      if (response.data.success) {
        showNotification(`${plugin.displayName} installed successfully`, 'success')
        onComplete(response.data.data)
      }
    } catch (error) {
      console.error('Error installing Untappd:', error)
      showNotification('Failed to install Untappd integration', 'error')
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600">
          <LinkIcon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Untappd for Business</h3>
        <p className="mt-2 text-sm text-gray-600">
          Connect to Untappd for Business to sync beer ratings, customer engagement, and market insights.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your Untappd for Business API key"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brewery ID</label>
          <input
            type="text"
            value={breweryId}
            onChange={(e) => setBreweryId(e.target.value)}
            placeholder="Your Untappd Brewery ID"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Data to Sync</h4>
          <div className="space-y-2">
            {[
              { key: 'syncBeers', label: 'Beer Portfolio', description: 'Your beer catalog and information' },
              { key: 'syncRatings', label: 'Ratings & Reviews', description: 'Customer ratings and feedback' },
              { key: 'syncCheckins', label: 'Check-ins', description: 'Customer check-in activity' },
              { key: 'syncEvents', label: 'Events', description: 'Brewery events and announcements' }
            ].map(item => (
              <label key={item.key} className="flex items-start">
                <input
                  type="checkbox"
                  checked={syncSettings[item.key]}
                  onChange={(e) => setSyncSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleInstall}
          disabled={!apiKey || !breweryId || isInstalling}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isInstalling ? 'Installing...' : 'Install Integration'}
        </button>
      </div>
    </div>
  )
}

// Stripe Configuration Wizard
function StripeConfigWizard({ plugin, onComplete, onCancel, isInstalled = false }) {
  const [keys, setKeys] = useState({
    publishableKey: '',
    secretKey: '',
    webhookEndpoint: ''
  })
  const [isInstalling, setIsInstalling] = useState(false)
  const { showNotification } = useAdvancedNotification()

  const handleInstall = async () => {
    try {
      setIsInstalling(true)
      const response = await pluginAPI.installPlugin({
        pluginId: plugin.pluginId,
        configuration: keys
      })

      if (response.data.success) {
        showNotification(`${plugin.displayName} installed successfully`, 'success')
        onComplete(response.data.data)
      }
    } catch (error) {
      console.error('Error installing Stripe:', error)
      showNotification('Failed to install Stripe integration', 'error')
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
          <LinkIcon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Stripe Payments</h3>
        <p className="mt-2 text-sm text-gray-600">
          Process online payments for merchandise, events, and subscriptions.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Publishable Key</label>
          <input
            type="text"
            value={keys.publishableKey}
            onChange={(e) => setKeys(prev => ({ ...prev, publishableKey: e.target.value }))}
            placeholder="pk_test_..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Secret Key</label>
          <input
            type="password"
            value={keys.secretKey}
            onChange={(e) => setKeys(prev => ({ ...prev, secretKey: e.target.value }))}
            placeholder="sk_test_..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Webhook Endpoint (Optional)</label>
          <input
            type="url"
            value={keys.webhookEndpoint}
            onChange={(e) => setKeys(prev => ({ ...prev, webhookEndpoint: e.target.value }))}
            placeholder="https://yourdomain.com/stripe/webhook"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="flex">
          <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-900">Security Note</h4>
            <p className="mt-1 text-sm text-yellow-800">
              Your Stripe keys are encrypted and stored securely. Never share these keys with anyone.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleInstall}
          disabled={!keys.publishableKey || !keys.secretKey || isInstalling}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isInstalling ? 'Installing...' : 'Install Integration'}
        </button>
      </div>
    </div>
  )
}

// Enhanced Plugin Config for Marketing, Research, and Operations plugins
function EnhancedPluginConfig({ plugin, onComplete, onCancel, isInstalled = false }) {
  const [config, setConfig] = useState({
    apiKey: '',
    additionalSettings: {}
  })
  const [isInstalling, setIsInstalling] = useState(false)
  const { showNotification } = useAdvancedNotification()

  const handleInstall = async () => {
    try {
      setIsInstalling(true)
      const response = await pluginAPI.installPlugin({
        pluginId: plugin.pluginId,
        configuration: config
      })

      if (response.data.success) {
        showNotification(`${plugin.displayName} installed successfully`, 'success')
        onComplete(response.data.data)
      }
    } catch (error) {
      console.error('Error installing plugin:', error)
      showNotification('Failed to install plugin', 'error')
    } finally {
      setIsInstalling(false)
    }
  }

  const getCategoryIcon = () => {
    switch (plugin.category) {
      case 'Marketing': return 'from-pink-500 to-purple-600'
      case 'Research': return 'from-green-500 to-teal-600'
      case 'Operations': return 'from-blue-500 to-indigo-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getCategoryDescription = () => {
    switch (plugin.category) {
      case 'Marketing': return 'Enhance your customer engagement and marketing campaigns'
      case 'Research': return 'Access industry data and competitive intelligence'
      case 'Operations': return 'Streamline your brewery operations and workflows'
      default: return 'Extend your brewery management capabilities'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br ${getCategoryIcon()}`}>
          <LinkIcon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{plugin.displayName}</h3>
        <p className="mt-2 text-sm text-gray-600">{plugin.description}</p>
        <p className="mt-1 text-xs text-gray-500">{getCategoryDescription()}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <input
            type="text"
            value={config.apiKey}
            onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder={`Your ${plugin.displayName} API key`}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Plugin Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Version:</span> {plugin.version}</p>
            <p><span className="font-medium">Author:</span> {plugin.author}</p>
            <p><span className="font-medium">Category:</span> {plugin.category}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleInstall}
          disabled={!config.apiKey || isInstalling}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isInstalling ? 'Installing...' : 'Install Integration'}
        </button>
      </div>
    </div>
  )
}

function GenericPluginConfig({ plugin, onComplete, onCancel, isInstalled = false }) {
  const [isInstalling, setIsInstalling] = useState(false)
  const { showNotification } = useAdvancedNotification()

  const handleInstall = async () => {
    try {
      setIsInstalling(true)
      const response = await pluginAPI.installPlugin({
        pluginId: plugin.pluginId,
        configuration: null
      })

      if (response.data.success) {
        showNotification(`${plugin.displayName} installed successfully`, 'success')
        onComplete(response.data.data)
      } else {
        showNotification(response.data.message || 'Failed to install plugin', 'error')
      }
    } catch (error) {
      console.error('Error installing plugin:', error)
      showNotification('Failed to install plugin', 'error')
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
          <LinkIcon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{plugin.displayName}</h3>
        <p className="mt-2 text-sm text-gray-600">{plugin.description}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Plugin Details:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Version:</span> {plugin.version}</p>
          <p><span className="font-medium">Author:</span> {plugin.author}</p>
          <p><span className="font-medium">Category:</span> {plugin.category}</p>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isInstalling ? (isInstalled ? 'Updating...' : 'Installing...') : (isInstalled ? 'Update Configuration' : 'Install Plugin')}
        </button>
      </div>
    </div>
  )
}

export default function PluginConfigModal({ plugin, isOpen, onClose, onComplete }) {
  if (!isOpen || !plugin) return null

  const isInstalled = !!plugin.tenantPluginId
  const modalTitle = isInstalled ? 'Configure Plugin' : 'Setup Plugin'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      icon={<CogIcon />}
      iconBgColor="bg-purple-100"
      iconTextColor="text-purple-600"
      size="lg"
    >

{plugin.name === 'quickbooks-online' ? (
          <QuickBooksConfigWizard
            plugin={plugin}
            onComplete={onComplete}
            onCancel={onClose}
            isInstalled={isInstalled}
          />
        ) : plugin.name === 'square-pos' ? (
          <SquarePOSConfigWizard
            plugin={plugin}
            onComplete={onComplete}
            onCancel={onClose}
            isInstalled={isInstalled}
          />
        ) : plugin.name === 'untappd-business' ? (
          <UntappdConfigWizard
            plugin={plugin}
            onComplete={onComplete}
            onCancel={onClose}
            isInstalled={isInstalled}
          />
        ) : plugin.name === 'stripe-payments' ? (
          <StripeConfigWizard
            plugin={plugin}
            onComplete={onComplete}
            onCancel={onClose}
            isInstalled={isInstalled}
          />
        ) : plugin.category === 'Marketing' || plugin.category === 'Research' || plugin.category === 'Operations' ? (
          <EnhancedPluginConfig
            plugin={plugin}
            onComplete={onComplete}
            onCancel={onClose}
            isInstalled={isInstalled}
          />
        ) : (
          <GenericPluginConfig
            plugin={plugin}
            onComplete={onComplete}
            onCancel={onClose}
            isInstalled={isInstalled}
          />
        )}
      </Modal>
  )
}