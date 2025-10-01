import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import { pluginAPI, quickBooksAPI } from '../utils/api'
import DashboardLayout from '../components/DashboardLayout'
import PluginConfigModal from '../components/PluginConfigModal'
import {
  PuzzlePieceIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowPathIcon,
  LinkIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

const SYNC_STATUS_ICONS = {
  'completed': CheckCircleIcon,
  'in_progress': ArrowPathIcon,
  'failed': XCircleIcon,
  'scheduled': ClockIcon
}

const SYNC_STATUS_COLORS = {
  'completed': 'text-green-500',
  'in_progress': 'text-blue-500',
  'failed': 'text-red-500',
  'scheduled': 'text-yellow-500'
}

function PluginCard({ plugin, onConfigure, onUninstall, onEnable, onDisable, onSync, onTestConnection, loading, expanded, setExpanded, activeDataTab, setActiveDataTab, isSyncing }) {
  const navigate = useNavigate()
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [testingConnection, setTestingConnection] = useState(false)

  // QuickBooks data browser state
  const [quickBooksData, setQuickBooksData] = useState({})
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState(null)

  // Sync status monitor state
  const [syncStatusLogs, setSyncStatusLogs] = useState([])
  const syncStatusRef = useRef(null)
  const syncPollingInterval = useRef(null)

  const handleTestConnection = async () => {
    if (!plugin.tenantPluginId) return

    setTestingConnection(true)
    try {
      const result = await onTestConnection(plugin.tenantPluginId)
      setConnectionStatus(result.success)
    } catch (error) {
      setConnectionStatus(false)
    } finally {
      setTestingConnection(false)
    }
  }

  const loadQuickBooksData = async (dataType) => {
    if (!plugin.isEnabled || plugin.name !== 'quickbooks-online') return

    console.log('📊 LOADING QUICKBOOKS DATA:', { dataType, pluginEnabled: plugin.isEnabled, pluginName: plugin.name })

    setLoadingData(true)
    setDataError(null)

    try {
      let response
      console.log('📊 Making API call for:', dataType)

      switch(dataType) {
        case 'summary':
          response = await quickBooksAPI.getSummary()
          break
        case 'accounts':
          response = await quickBooksAPI.getAccounts()
          break
        case 'customers':
          response = await quickBooksAPI.getCustomers()
          break
        case 'items':
          response = await quickBooksAPI.getItems()
          break
        case 'invoices':
          response = await quickBooksAPI.getInvoices()
          break
        case 'payments':
          response = await quickBooksAPI.getPayments()
          break
        default:
          console.log('📊 Unknown dataType:', dataType)
          return
      }

      console.log('📊 API RESPONSE for', dataType, ':', response)

      setQuickBooksData(prev => {
        const updatedData = { ...prev, [dataType]: response.data }

        // 📊 Console logging for debugging - output entire quickBooksData collection
        console.log('📊 QUICKBOOKS DATA COLLECTION UPDATED:', {
          dataType,
          newDataLength: response.data?.length || 'N/A',
          newData: response.data,
          previousData: prev,
          completeUpdatedCollection: updatedData
        })
        console.log('📊 COMPLETE QUICKBOOKS DATA STRUCTURE:', JSON.stringify(updatedData, null, 2))

        return updatedData
      })
    } catch (error) {
      console.error(`Error loading QuickBooks ${dataType}:`, error)
      setDataError(`Failed to load ${dataType}: ${error.message}`)
    } finally {
      setLoadingData(false)
    }
  }

  // Load summary data when expanding QuickBooks plugin
  React.useEffect(() => {
    if (expanded && plugin.name === 'quickbooks-online' && plugin.isEnabled) {
      loadQuickBooksData('summary')
    }
  }, [expanded, plugin.name, plugin.isEnabled])

  // Load data when tab changes
  React.useEffect(() => {
    if (expanded && plugin.name === 'quickbooks-online' && plugin.isEnabled && activeDataTab !== 'summary') {
      loadQuickBooksData(activeDataTab)
    }
  }, [activeDataTab])

  // 📊 Debug logging - Monitor quickBooksData changes
  React.useEffect(() => {
    if (plugin.name === 'quickbooks-online' && Object.keys(quickBooksData).length > 0) {
      console.log('📊 QUICKBOOKS DATA STATE CHANGED:', {
        pluginName: plugin.name,
        dataKeys: Object.keys(quickBooksData),
        dataLengths: Object.keys(quickBooksData).reduce((acc, key) => {
          acc[key] = Array.isArray(quickBooksData[key]) ? quickBooksData[key].length : 'Not Array'
          return acc
        }, {}),
        completeData: quickBooksData
      })
      console.log('📊 COMPLETE QUICKBOOKS DATA (JSON):', JSON.stringify(quickBooksData, null, 2))
    }
  }, [quickBooksData, plugin.name])

  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'Never synced'
    return new Date(lastSync).toLocaleString()
  }

  // Sync status monitor functions
  const addSyncLog = (level, message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    setSyncStatusLogs(prev => [...prev, { timestamp, level, message }])

    // Auto-scroll to bottom
    setTimeout(() => {
      if (syncStatusRef.current) {
        syncStatusRef.current.scrollTop = syncStatusRef.current.scrollHeight
      }
    }, 50)
  }

  const getLast6 = (str) => str?.slice(-6) || ''

  const clearSyncLogs = () => {
    setSyncStatusLogs([])
  }

  const getLogLevelColor = (level) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'text-red-600'
      case 'WARN': return 'text-yellow-600'
      case 'INFO': return 'text-blue-600'
      case 'DEBUG': return 'text-gray-600'
      default: return 'text-gray-700'
    }
  }

  const startSyncStatusPolling = (tenantPluginId) => {
    if (syncPollingInterval.current) {
      clearInterval(syncPollingInterval.current)
    }

    addSyncLog('INFO', 'Starting sync status monitoring...')

    syncPollingInterval.current = setInterval(async () => {
      try {
        console.log('🔍 Polling sync history for:', tenantPluginId)
        const response = await pluginAPI.getSyncHistory(tenantPluginId, 5)
        console.log('📥 Sync history response:', response.data)
        const history = response.data

        // Debug the response structure
        console.log('📊 Full response structure:', response.data)
        console.log('📊 Response data success:', response.data?.success)
        console.log('📊 Response data array:', response.data?.data)
        console.log('📊 Response data array length:', response.data?.data?.length)

        // Extract the actual history array from the API response
        const actualHistory = response.data?.data || response.data || history;
        console.log('📊 Actual history array:', actualHistory)
        console.log('📊 Actual history length:', actualHistory?.length)

        if (actualHistory && Array.isArray(actualHistory) && actualHistory.length > 0) {
          const latestSync = actualHistory[0]
          console.log('📊 Latest sync status:', latestSync)
          addSyncLog('INFO', `Latest sync: ${latestSync.status} (${latestSync.recordsProcessed || 0} records)`)
          if (latestSync.status === 'completed' || latestSync.status === 'failed') {
            addSyncLog('INFO', `Sync ${latestSync.status}: Processed ${latestSync.recordsProcessed} records`)
            if (latestSync.status === 'failed' && latestSync.errorMessage) {
              addSyncLog('ERROR', latestSync.errorMessage)
            }
            stopSyncStatusPolling()
          } else if (latestSync.status === 'in_progress') {
            addSyncLog('INFO', `Sync in progress... (${latestSync.recordsProcessed || 0} records so far)`)
          }
        } else {
          console.log('📊 No sync history found - actualHistory:', actualHistory)
          addSyncLog('INFO', 'No sync history available yet...')
        }
      } catch (error) {
        console.error('❌ Failed to fetch sync status:', error)
        addSyncLog('ERROR', `Failed to fetch sync status: ${error.message}`)
      }
    }, 2000) // Poll every 2 seconds
  }

  const stopSyncStatusPolling = () => {
    if (syncPollingInterval.current) {
      clearInterval(syncPollingInterval.current)
      syncPollingInterval.current = null
      addSyncLog('INFO', 'Sync monitoring stopped.')
    }
  }

  // Auto-start sync monitoring when plugin becomes syncing and expanded
  useEffect(() => {
    if (isSyncing && expanded && plugin.name === 'quickbooks-online' && activeDataTab === 'summary') {
      console.log('🔄 Auto-starting sync monitoring for:', plugin.tenantPluginId)
      setTimeout(() => {
        startSyncStatusPolling(plugin.tenantPluginId)
      }, 500)
    }
  }, [isSyncing, expanded, plugin.name, plugin.tenantPluginId, activeDataTab])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncPollingInterval.current) {
        clearInterval(syncPollingInterval.current)
      }
    }
  }, [])

  const SyncStatusIcon = plugin.syncStatus && SYNC_STATUS_ICONS[plugin.syncStatus] ? SYNC_STATUS_ICONS[plugin.syncStatus] : ClockIcon
  const syncStatusColor = plugin.syncStatus && SYNC_STATUS_COLORS[plugin.syncStatus] ? SYNC_STATUS_COLORS[plugin.syncStatus] : 'text-gray-400'

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <PuzzlePieceIcon className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {plugin.displayName || plugin.name}
                </h3>
                {plugin.tenantPluginId && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    plugin.isEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {plugin.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {plugin.description}
              </p>

              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>v{plugin.version}</span>
                <span>by {plugin.author}</span>
                <span className="capitalize">{plugin.category}</span>
              </div>

              {plugin.tenantPluginId && plugin.lastSync && (
                <div className="flex items-center space-x-2 mt-2">
                  <SyncStatusIcon className={`h-4 w-4 ${syncStatusColor}`} />
                  <span className="text-xs text-gray-500">
                    Last sync: {formatLastSync(plugin.lastSync)}
                  </span>
                  {plugin.syncStatus === 'failed' && plugin.syncError && (
                    <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {plugin.tenantPluginId ? (
              // Plugin is installed
              <>
                {plugin.isEnabled && (
                  <>
                    <button
                      onClick={async () => {
                        console.log('🔄 Sync button clicked for:', plugin.name, plugin.tenantPluginId)
                        // Trigger the sync with plugin name
                        await onSync(plugin.tenantPluginId, plugin.name)
                      }}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Sync
                    </button>

                    <button
                      onClick={() => onConfigure(plugin)}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-1" />
                      Config
                    </button>

                    {plugin.requiresAuth && (
                      <button
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded ${
                          connectionStatus === true
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : connectionStatus === false
                            ? 'border-red-300 text-red-700 bg-red-50'
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        } disabled:opacity-50`}
                      >
                        <LinkIcon className={`h-4 w-4 mr-1 ${testingConnection ? 'animate-spin' : ''}`} />
                        Test
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => plugin.isEnabled ? onDisable(plugin.tenantPluginId) : onEnable(plugin.tenantPluginId)}
                  disabled={loading}
                  className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded disabled:opacity-50 ${
                    plugin.isEnabled
                      ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                      : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {plugin.isEnabled ? (
                    <>
                      <PauseIcon className="h-4 w-4 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4 mr-1" />
                      Enable
                    </>
                  )}
                </button>

                <button
                  onClick={() => onUninstall(plugin.tenantPluginId)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Remove
                </button>
              </>
            ) : (
              // Plugin is not installed
              <button
                onClick={() => onConfigure(plugin)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Install & Setup
              </button>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <ChevronRightIcon className={`h-4 w-4 transform transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            {plugin.tenantPluginId && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Status & Configuration</h4>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 ${plugin.isEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                      {plugin.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Installed:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(plugin.created).toLocaleDateString()}
                    </span>
                  </div>
                  {plugin.lastSync && (
                    <div>
                      <span className="text-gray-500">Last Sync:</span>
                      <span className="ml-2 text-gray-900">
                        {formatLastSync(plugin.lastSync)}
                      </span>
                    </div>
                  )}
                  {plugin.syncStatus && (
                    <div>
                      <span className="text-gray-500">Sync Status:</span>
                      <span className={`ml-2 capitalize ${syncStatusColor}`}>
                        {plugin.syncStatus.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {plugin.syncError && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md">
                    <h5 className="text-sm font-medium text-red-800 mb-1">Last Sync Error</h5>
                    <p className="text-sm text-red-700">{plugin.syncError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced QuickBooks integration with tabbed interface */}
            {plugin.isEnabled && plugin.name === 'quickbooks-online' && (
              <div className="mt-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {['summary', 'accounts', 'customers', 'items', 'invoices', 'payments'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveDataTab(tab)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                          activeDataTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="mt-4">
                  {dataError && (
                    <div className="mb-4 p-3 bg-red-50 rounded-md">
                      <p className="text-sm text-red-700">{dataError}</p>
                    </div>
                  )}

                  {loadingData ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      {activeDataTab === 'summary' && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">QuickBooks Summary</h4>
                          <div className="space-y-4">
                            {/* Sync Status List */}
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">Sync Status Monitor</h5>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => startSyncStatusPolling(plugin.tenantPluginId)}
                                    disabled={syncPollingInterval.current}
                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                  >
                                    Start Monitor
                                  </button>
                                  <button
                                    onClick={stopSyncStatusPolling}
                                    disabled={!syncPollingInterval.current}
                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                  >
                                    Stop Monitor
                                  </button>
                                  <button
                                    onClick={clearSyncLogs}
                                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              <div
                                ref={syncStatusRef}
                                className="h-48 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded font-mono text-xs"
                              >
                                {syncStatusLogs.length === 0 ? (
                                  <p className="text-gray-500">No sync activity. Click "Start Monitor" to begin watching sync status.</p>
                                ) : (
                                  syncStatusLogs.map((log, index) => (
                                    <div key={index} className="mb-1">
                                      <span className="text-blue-400">[{log.timestamp}]</span>
                                      <span className={`ml-2 ${getLogLevelColor(log.level)}`}>
                                        {log.level}:
                                      </span>
                                      <span className="ml-2">{log.message}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* QuickBooks Summary Data */}
                            {quickBooksData.summary && (
                              <div className="bg-white rounded-lg p-4 border">
                                <h5 className="font-medium text-gray-900 mb-3">Account Summary</h5>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {quickBooksData.summary.counts.accounts || 0}
                                    </div>
                                    <div className="text-gray-500">Accounts</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                      {quickBooksData.summary.counts.customers || 0}
                                    </div>
                                    <div className="text-gray-500">Customers</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {quickBooksData.summary.counts.items || 0}
                                    </div>
                                    <div className="text-gray-500">Items</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                      {quickBooksData.summary.counts.invoices || 0}
                                    </div>
                                    <div className="text-gray-500">Invoices</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {quickBooksData.summary.counts.payments || 0}
                                    </div>
                                    <div className="text-gray-500">Payments</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeDataTab === 'accounts' && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Chart of Accounts</h4>
                          {quickBooksData.accounts && quickBooksData.accounts.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white border border-gray-200 rounded">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-3 py-2 text-left   text-xs font-semibold text-gray-800 uppercase">Account Name</th>
                                    <th className="px-3 py-2 text-left   text-xs font-semibold text-gray-800 uppercase">Full Name</th>
                                    <th className="px-3 py-2 text-left   text-xs font-semibold text-gray-800 uppercase">Type</th>
                                    <th className="px-3 py-2 text-left   text-xs font-semibold text-gray-800 uppercase">SubType</th>
                                    <th className="px-3 py-2 text-right  text-xs font-semibold text-gray-800 uppercase">Balance</th>
                                    <th className="px-3 py-2 text-right  text-xs font-semibold text-gray-800 uppercase">Balance + Sub</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-800 uppercase">Currency</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-800 uppercase">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {quickBooksData.accounts.slice(0, 15).map((account, index) => (
                                    <tr key={index} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                        {account.name}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate" title={account.FullyQualifiedName}>
                                        {account.fullyQualifiedName || account.Name}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600">
                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                          {account.accountType}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600">{account.accountSubType || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-900 font-mono">
                                        {account.currentBalance != null ?
                                          `$${parseFloat(account.currentBalance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-600 font-mono">
                                        {account.currentBalanceWithSubAccounts != null ?
                                          `$${parseFloat(account.currentBalanceWithSubAccounts).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600 text-center">{account.Currency || 'USD'}</td>
                                      <td className="px-3 py-2 text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                          account.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {account.active ? 'Active' : 'Inactive'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="mt-3 text-xs text-gray-500 text-center">
                                Showing {Math.min(15, quickBooksData.accounts.length)} of {quickBooksData.accounts.length} accounts
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No accounts data available</p>
                          )}
                        </div>
                      )}

                      {activeDataTab === 'customers' && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Customers</h4>
                          {quickBooksData.customers && quickBooksData.customers.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white border border-gray-200 rounded">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-3 py-2 text-center text-xs  font-semibold text-gray-800 uppercase">ID</th>
                                    <th className="px-3 py-2 text-left text-xs  font-semibold text-gray-800 uppercase">Company</th>
                                    <th className="px-3 py-2 text-left text-xs  font-semibold text-gray-800 uppercase">Address</th>
                                    <th className="px-3 py-2 text-left text-xs  font-semibold text-gray-800 uppercase">Email</th>
                                    <th className="px-3 py-2 text-left text-xs  font-semibold text-gray-800 uppercase">Phone</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-800 uppercase">Balance</th>
                                    <th className="px-3 py-2 text-left text-xs  font-semibold text-gray-800 uppercase">Website</th>
                                    <th className="px-3 py-2 text-center text-xs  font-semibold text-gray-800 uppercase">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {quickBooksData.customers.slice(0, 15).map((customer, index) => (
                                    <tr key={index} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                      <td className="px-3 py-2 text-sm text-center text-gray-600 max-w-xs truncate" title={customer.companyName}>
                                        {customer.qboId || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate" title={customer.companyName}>
                                        {customer.companyName || customer.name || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate" title={customer.companyName}>
                                        {customer.name || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600">
                                        {customer.email ? (
                                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                                            {customer.email}
                                          </a>
                                        ) : (
                                          customer.primaryEmailAddr?.address ? (
                                            <a href={`mailto:${customer.primaryEmailAddr.address}`} className="text-blue-600 hover:text-blue-800">
                                              {customer.primaryEmailAddr.address}
                                            </a>
                                          ) : '-'
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600">
                                        {customer.phone ? (
                                          <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-800">
                                            {customer.phone}
                                          </a>
                                        ) : (
                                          customer.Mobile ? (
                                            <a href={`tel:${customer.mobile}`} className="text-blue-600 hover:text-blue-800">
                                              {customer.mobile}
                                            </a>
                                          ) : '-'
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-900 font-mono">
                                        {customer.balance != null ?
                                          `$${parseFloat(customer.balance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate">
                                        {customer.website ? (
                                          <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="text-blue-600 hover:text-blue-800">
                                            {customer.website}
                                          </a>
                                        ) : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                          customer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {customer.active ? 'Active' : 'Inactive'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="mt-3 text-xs text-gray-500 text-center">
                                Showing {Math.min(15, quickBooksData.customers.length)} of {quickBooksData.customers.length} customers
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No customers data available</p>
                          )}
                        </div>
                      )}

                      {activeDataTab === 'items' && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                          {quickBooksData.items && quickBooksData.items.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white border border-gray-200 rounded">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Type</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Price</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {quickBooksData.items.slice(0, 10).map((item, index) => (
                                    <tr key={index} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                      <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">{item.type}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">${item.unitPrice || 0}</td>
                                      <td className="px-4 py-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                          item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {item.active ? 'Active' : 'Inactive'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No items data available</p>
                          )}
                        </div>
                      )}

                      {activeDataTab === 'invoices' && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Recent Invoices</h4>
                          {quickBooksData.invoices && quickBooksData.invoices.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white border border-gray-200 rounded">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Invoice #</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Customer</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Date</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {quickBooksData.invoices.slice(0, 10).map((invoice, index) => (
                                    <tr key={index} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                      <td className="px-4 py-2 text-sm text-gray-900">{invoice.docNumber}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">{invoice.customerRef?.name || '-'}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">${invoice.totalAmt || 0}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">{invoice.txnDate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No invoices data available</p>
                          )}
                        </div>
                      )}

                      {activeDataTab === 'payments' && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Recent Payments</h4>
                          {quickBooksData.payments && quickBooksData.payments.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white border border-gray-200 rounded">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Payment #</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Customer</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase">Date</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {quickBooksData.payments.slice(0, 10).map((payment, index) => (
                                    <tr key={index} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                      <td className="px-4 py-2 text-sm text-gray-900">{getLast6(payment.qboPaymentId) || payment.id || '-'}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">{payment.customerRef || '-'}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">${payment.totalAmt || 0}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">{payment.txnDate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No payments data available</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Only show Authentication and Description sections when plugin is NOT enabled/running */}
            {(!plugin.isEnabled || !plugin.tenantPluginId) && (
              <>
                {plugin.requiresAuth && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Authentication</h4>
                    <p className="text-sm text-gray-600">
                      This plugin requires authentication with {plugin.displayName}.
                      {plugin.tenantPluginId ? ' Use the configuration button to update credentials.' : ' Configure during installation.'}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{plugin.description}</p>
                </div>
              </>
            )}


          </div>
        )}
      </div>
    </div>
  )
}

export default function PluginsPage() {
  const navigate = useNavigate()
  const { user, currentTenant } = useSession()
  const { showNotification } = useAdvancedNotification()
  const [availablePlugins, setAvailablePlugins] = useState([])
  const [tenantPlugins, setTenantPlugins] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [selectedPlugin, setSelectedPlugin] = useState(null)

  // Track expanded plugins at parent level to persist across reloads
  const [expandedPlugins, setExpandedPlugins] = useState(new Set())
  const [activeDataTabs, setActiveDataTabs] = useState({})
  const [syncingPlugins, setSyncingPlugins] = useState(new Set())

  // Check permissions
  const hasManageIntegrationsPermission = user?.role === 'tenant' || user?.role === 'owner' || user?.role === 'admin'

  useEffect(() => {
    if (!hasManageIntegrationsPermission) {
      showNotification('You do not have permission to manage integrations', 'error')
      navigate('/dashboard')
      return
    }

    if (!currentTenant) {
      showNotification('Please select a brewery to manage plugins', 'error')
      navigate('/tenant-selection')
      return
    }

    loadPlugins()
  }, [currentTenant, hasManageIntegrationsPermission, navigate])

  const loadPlugins = async () => {
    try {
      setLoading(true)
      const [availableResponse, tenantResponse] = await Promise.all([
        pluginAPI.getAvailablePlugins(),
        pluginAPI.getTenantPlugins()
      ])

      if (availableResponse.data.success) {
        setAvailablePlugins(availableResponse.data.data)
      }

      if (tenantResponse.data.success) {
        setTenantPlugins(tenantResponse.data.data)
      }
    } catch (error) {
      console.error('Error loading plugins:', error)
      showNotification('Failed to load plugins', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Merge available and tenant plugins for display
  const allPlugins = availablePlugins.map(plugin => {
    const tenantPlugin = tenantPlugins.find(tp => tp.plugin.pluginId === plugin.pluginId)
    return {
      ...plugin,
      ...tenantPlugin,
      tenantPluginId: tenantPlugin?.tenantPluginId,
      isEnabled: tenantPlugin?.isEnabled || false,
      lastSync: tenantPlugin?.lastSync,
      syncStatus: tenantPlugin?.syncStatus,
      syncError: tenantPlugin?.syncError,
      configuration: tenantPlugin?.configuration,
      created: tenantPlugin?.created,
      updated: tenantPlugin?.updated
    }
  })

  const handleConfigure = (plugin) => {
    setSelectedPlugin(plugin)
    setConfigModalOpen(true)
  }

  const handleConfigComplete = async (installedPlugin) => {
    setConfigModalOpen(false)
    setSelectedPlugin(null)
    await loadPlugins() // Refresh the plugin list
  }

  const handleConfigCancel = () => {
    setConfigModalOpen(false)
    setSelectedPlugin(null)
  }

  const handleUninstall = async (tenantPluginId) => {
    if (!confirm('Are you sure you want to remove this plugin? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await pluginAPI.uninstallPlugin(tenantPluginId)

      if (response.data.success) {
        showNotification('Plugin removed successfully', 'success')
        await loadPlugins()
      } else {
        showNotification(response.data.message || 'Failed to remove plugin', 'error')
      }
    } catch (error) {
      console.error('Error removing plugin:', error)
      showNotification('Failed to remove plugin', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEnable = async (tenantPluginId) => {
    try {
      setActionLoading(true)
      const response = await pluginAPI.enablePlugin(tenantPluginId)

      if (response.data.success) {
        showNotification('Plugin enabled successfully', 'success')
        await loadPlugins()
      } else {
        showNotification(response.data.message || 'Failed to enable plugin', 'error')
      }
    } catch (error) {
      console.error('Error enabling plugin:', error)
      showNotification('Failed to enable plugin', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisable = async (tenantPluginId) => {
    try {
      setActionLoading(true)
      const response = await pluginAPI.disablePlugin(tenantPluginId)

      if (response.data.success) {
        showNotification('Plugin disabled successfully', 'success')
        await loadPlugins()
      } else {
        showNotification(response.data.message || 'Failed to disable plugin', 'error')
      }
    } catch (error) {
      console.error('Error disabling plugin:', error)
      showNotification('Failed to disable plugin', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSync = async (tenantPluginId, pluginName) => {
    try {
      setActionLoading(true)
      console.log('🔄 Starting sync for:', { tenantPluginId, pluginName })

      // For QuickBooks plugins, mark as syncing and expand
      if (pluginName === 'quickbooks-online') {
        setSyncingPlugins(prev => new Set([...prev, tenantPluginId]))
        setExpandedPlugins(prev => new Set([...prev, tenantPluginId]))
        setActiveDataTabs(prev => ({ ...prev, [tenantPluginId]: 'summary' }))
        console.log('🔄 Setting plugin as syncing and expanded:', tenantPluginId)
      }

      console.log('🌐 Making API call to triggerSync...')
      const response = await pluginAPI.triggerSync(tenantPluginId, 'manual')
      console.log('📥 Sync API Response:', response)
      console.log('📥 Response Data:', response.data)
      console.log('📥 Response Success:', response.data?.success)
      console.log('📥 Response Message:', response.data?.message)

      if (response.data.success) {
        showNotification('Sync started successfully', 'success')
        console.log('✅ Sync started successfully, will reload plugins in 1s')
        // Reload plugins after a short delay to show updated sync status
        setTimeout(() => {
          console.log('🔄 Reloading plugins...')
          loadPlugins()
          // After reload, ensure QuickBooks plugin stays expanded
          if (pluginName === 'quickbooks-online') {
            setTimeout(() => {
              console.log('🔄 Re-expanding plugin after reload:', tenantPluginId)
              setExpandedPlugins(prev => new Set([...prev, tenantPluginId]))
              setActiveDataTabs(prev => ({ ...prev, [tenantPluginId]: 'summary' }))
            }, 100)
          }
        }, 1000)
      } else {
        console.log('❌ Sync failed:', response.data.message)
        showNotification(response.data.message || 'Failed to start sync', 'error')
        // Remove from syncing set on failure
        setSyncingPlugins(prev => {
          const newSet = new Set(prev)
          newSet.delete(tenantPluginId)
          return newSet
        })
      }
    } catch (error) {
      console.error('❌ Error starting sync:', error)
      console.error('❌ Error details:', error.message)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      showNotification('Failed to start sync', 'error')
      // Remove from syncing set on error
      setSyncingPlugins(prev => {
        const newSet = new Set(prev)
        newSet.delete(tenantPluginId)
        return newSet
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleTestConnection = async (tenantPluginId) => {
    const response = await pluginAPI.testConnection(tenantPluginId)
    if (response.data.success) {
      showNotification('Connection test successful', 'success')
    } else {
      showNotification('Connection test failed', 'error')
    }
    return response.data
  }

  const installedPlugins = allPlugins.filter(p => p.tenantPluginId)
  const availableForInstall = allPlugins.filter(p => !p.tenantPluginId)

  // Group available plugins by category for better organization
  const pluginsByCategory = availableForInstall.reduce((acc, plugin) => {
    const category = plugin.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(plugin)
    return acc
  }, {})

  if (loading) {
    return (
      <DashboardLayout title="Integrations" currentPage="Settings" activeTab="Integrations">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Integrations"
      subtitle="Connect your brewery with external services and tools"
      currentPage="Settings"
      activeTab="Integrations"
    >
      {/* Installed Plugins */}
      {installedPlugins.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Installed Integrations</h2>
            <div className="space-y-4">
              {installedPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.pluginId}
                  plugin={plugin}
                  onConfigure={handleConfigure}
                  onUninstall={handleUninstall}
                  onEnable={handleEnable}
                  onDisable={handleDisable}
                  onSync={handleSync}
                  onTestConnection={handleTestConnection}
                  loading={actionLoading}
                  expanded={expandedPlugins.has(plugin.tenantPluginId)}
                  setExpanded={(isExpanded) => {
                    const newSet = new Set(expandedPlugins)
                    if (isExpanded) {
                      newSet.add(plugin.tenantPluginId)
                    } else {
                      newSet.delete(plugin.tenantPluginId)
                    }
                    setExpandedPlugins(newSet)
                  }}
                  activeDataTab={activeDataTabs[plugin.tenantPluginId] || 'summary'}
                  setActiveDataTab={(tab) => {
                    setActiveDataTabs(prev => ({ ...prev, [plugin.tenantPluginId]: tab }))
                  }}
                  isSyncing={syncingPlugins.has(plugin.tenantPluginId)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Plugins by Category */}
      {Object.keys(pluginsByCategory).length > 0 && (
        <div className="space-y-8">
          {Object.entries(pluginsByCategory).map(([category, plugins]) => (
            <div key={category}>
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {category} {installedPlugins.length === 0 ? 'Integrations' : ''}
                </h2>
                <div className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {plugins.length} available
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {plugins.map((plugin) => (
                  <PluginCard
                    key={plugin.pluginId}
                    plugin={plugin}
                    onConfigure={handleConfigure}
                    onUninstall={handleUninstall}
                    onEnable={handleEnable}
                    onDisable={handleDisable}
                    onSync={handleSync}
                    onTestConnection={handleTestConnection}
                    loading={actionLoading}
                    expanded={expandedPlugins.has(plugin.tenantPluginId)}
                    setExpanded={(isExpanded) => {
                      const newSet = new Set(expandedPlugins)
                      if (isExpanded) {
                        newSet.add(plugin.tenantPluginId)
                      } else {
                        newSet.delete(plugin.tenantPluginId)
                      }
                      setExpandedPlugins(newSet)
                    }}
                    activeDataTab={activeDataTabs[plugin.tenantPluginId] || 'summary'}
                    setActiveDataTab={(tab) => {
                      setActiveDataTabs(prev => ({ ...prev, [plugin.tenantPluginId]: tab }))
                    }}
                    isSyncing={syncingPlugins.has(plugin.tenantPluginId)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {allPlugins.length === 0 && (
        <div className="text-center py-12">
          <PuzzlePieceIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later for new integration options.
          </p>
        </div>
      )}

      {/* Plugin Configuration Modal */}
      <PluginConfigModal
        plugin={selectedPlugin}
        isOpen={configModalOpen}
        onClose={handleConfigCancel}
        onComplete={handleConfigComplete}
      />
    </DashboardLayout>
  )
}