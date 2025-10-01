import React, { useState, useEffect } from 'react'
import { quickBooksAPI } from '../utils/api'
import { TenantId } from '../components/IdDisplay'

const QuickBooksDataPage = () => {
  const [activeTab, setActiveTab] = useState('summary')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState({})

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'accounts', label: 'Accounts', icon: '🏦' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'items', label: 'Items', icon: '📦' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'payments', label: 'Payments', icon: '💰' }
  ]

  const fetchData = async (tabId) => {
    setLoading(true)
    setError(null)

    try {
      let result
      switch (tabId) {
        case 'summary':
          result = await quickBooksAPI.getSummary()
          break
        case 'accounts':
          result = await quickBooksAPI.getAccounts()
          break
        case 'customers':
          result = await quickBooksAPI.getCustomers()
          break
        case 'items':
          result = await quickBooksAPI.getItems()
          break
        case 'invoices':
          result = await quickBooksAPI.getInvoices()
          break
        case 'payments':
          result = await quickBooksAPI.getPayments()
          break
        default:
          throw new Error('Invalid tab')
      }

      setData({ ...data, [tabId]: result.data })
    } catch (err) {
      console.error(`Error fetching ${tabId} data:`, err)
      setError(`Failed to load ${tabId} data: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (!data[tabId]) {
      fetchData(tabId)
    }
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderSummary = () => {
    const summary = data.summary
    if (!summary) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Counts</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Accounts:</span>
              <span className="font-medium">{summary.counts?.accounts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customers:</span>
              <span className="font-medium">{summary.counts?.customers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items:</span>
              <span className="font-medium">{summary.counts?.items || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Invoices:</span>
              <span className="font-medium">{summary.counts?.invoices || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payments:</span>
              <span className="font-medium">{summary.counts?.payments || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Sync</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Accounts:</span>
              <span className="font-medium text-sm">
                {summary.lastSync?.accounts ? formatDate(summary.lastSync.accounts) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customers:</span>
              <span className="font-medium text-sm">
                {summary.lastSync?.customers ? formatDate(summary.lastSync.customers) : 'Never'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Info</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tenant ID:</span>
              <TenantId tenantId={summary.tenantId} className="text-xs" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderAccounts = () => {
    const accounts = data.accounts
    if (!accounts || accounts.length === 0) {
      return <div className="text-gray-500 text-center py-8">No accounts found</div>
    }

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">QuickBooks Accounts ({accounts.length})</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {accounts.map((account, index) => (
            <li key={account.qboAccountId} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {account.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {account.accountType} - {account.classification}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    QBO ID: {account.qboId} | Updated: {formatDate(account.updated)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(account.currentBalance)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {account.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderCustomers = () => {
    const customers = data.customers
    if (!customers || customers.length === 0) {
      return <div className="text-gray-500 text-center py-8">No customers found</div>
    }

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">QuickBooks Customers ({customers.length})</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {customers.map((customer, index) => (
            <li key={customer.qboCustomerId} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {customer.name}
                  </p>
                  {customer.companyName && (
                    <p className="mt-1 text-sm text-gray-600">{customer.companyName}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
                    {customer.email && <span>📧 {customer.email}</span>}
                    {customer.phone && <span>📞 {customer.phone}</span>}
                    {customer.website && <span>🌐 {customer.website}</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    QBO ID: {customer.qboId} | Updated: {formatDate(customer.updated)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(customer.balance)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {customer.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderItems = () => {
    const items = data.items
    if (!items || items.length === 0) {
      return <div className="text-gray-500 text-center py-8">No items found</div>
    }

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">QuickBooks Items ({items.length})</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {items.map((item, index) => (
            <li key={item.qboItemId} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {item.Name}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
                    {item.type && <span>Type: {item.type}</span>}
                    {item.sku && <span>SKU: {item.sku}</span>}
                    <span>{item.Taxable ? 'Taxable' : 'Non-taxable'}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    QBO ID: {item.qboId} | Updated: {formatDate(item.updated)}
                  </p>
                </div>
                <div className="text-right">
                  {item.unitPrice && (
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {item.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderInvoices = () => {
    const invoices = data.invoices
    if (!invoices || invoices.length === 0) {
      return <div className="text-gray-500 text-center py-8">No invoices found</div>
    }

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">QuickBooks Invoices ({invoices.length})</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {invoices.map((invoice, index) => (
            <li key={invoice.qboInvoiceId} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    Invoice #{invoice.docNumber || invoice.qboId}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Customer: {invoice.customerName || invoice.customerRef}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Date: {invoice.txnDate}</span>
                    {invoice.dueDate && <span>Due: {invoice.dueDate}</span>}
                    {invoice.txnStatus && <span>Status: {invoice.txnStatus}</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    QBO ID: {invoice.qboId} | Updated: {formatDate(invoice.updated)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.TotalAmt)}
                  </p>
                  {invoice.balance > 0 && (
                    <p className="text-xs text-red-600">
                      Balance: {formatCurrency(invoice.balance)}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderPayments = () => {
    const payments = data.payments
    if (!payments || payments.length === 0) {
      return <div className="text-gray-500 text-center py-8">No payments found</div>
    }

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">QuickBooks Payments ({payments.length})</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {payments.map((payment, index) => (
            <li key={payment.qboPaymentId} className={`px-4 py-4 sm:px-6 hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    Payment #{payment.paymentRefNum || payment.qboId}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Customer: {payment.customerName || payment.customerRef}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Date: {payment.TxnDate}</span>
                    {payment.paymentMethodRef && <span>Method: {payment.paymentMethodRef}</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    QBO ID: {payment.qboId} | Updated: {formatDate(payment.updated)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payment.totalAmt)}
                  </p>
                  {payment.unappliedAmt > 0 && (
                    <p className="text-xs text-yellow-600">
                      Unapplied: {formatCurrency(payment.unappliedAmt)}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading {activeTab} data...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={() => fetchData(activeTab)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'summary':
        return renderSummary()
      case 'accounts':
        return renderAccounts()
      case 'customers':
        return renderCustomers()
      case 'items':
        return renderItems()
      case 'invoices':
        return renderInvoices()
      case 'payments':
        return renderPayments()
      default:
        return <div>Unknown tab</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              QuickBooks Online Data
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse and explore your synchronized QuickBooks Online data
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {data[tab.id] && Array.isArray(data[tab.id]) && (
                      <span className="bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">
                        {data[tab.id].length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default QuickBooksDataPage