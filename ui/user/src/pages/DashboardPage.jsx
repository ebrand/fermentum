import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import { useAdvancedNotification } from '../contexts/AdvancedNotificationContext'
import DashboardLayout from '../components/DashboardLayout'
import {
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PlusIcon,
  Cog6ToothIcon,
  BellIcon,
  UsersIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FireIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user, invalidateSession, currentTenant, loading: tenantLoading, userTenants } = useSession()
  const { refreshNotifications, persistentNotifications, isLoading: notificationsLoading } = useAdvancedNotification()
  const [notificationLoadAttempted, setNotificationLoadAttempted] = useState(false)

  // DASHBOARD-SPECIFIC NOTIFICATION LOADING: 1-second delay after dashboard loads
  useEffect(() => {
    const loadDashboardNotifications = async () => {
      // Check if user has valid authentication tokens and session
      const hasValidTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')
      const hasUserSession = user && currentTenant

      if (hasValidTokens && hasUserSession && !notificationLoadAttempted && !notificationsLoading) {
        console.log('🏠 [DASHBOARD DEBUG] Loading notifications after 1-second delay...')
        setNotificationLoadAttempted(true)

        setTimeout(() => {
          console.log('🔄 [DASHBOARD DEBUG] Triggering delayed notification load')
          refreshNotifications()
        }, 1000) // 1-second delay as requested
      } else {
        console.log('🏠 [DASHBOARD DEBUG] Dashboard notification load skipped:', {
          hasValidTokens,
          hasUserSession,
          notificationLoadAttempted,
          notificationCount: persistentNotifications.length,
          isLoading: notificationsLoading
        })
      }
    }

    // Only run when tenant loading is complete and we're not already loading notifications
    if (!tenantLoading) {
      loadDashboardNotifications()
    }
  }, [user, currentTenant, tenantLoading, notificationLoadAttempted, notificationsLoading])

  // Tenant data is already loaded in SessionContext

  // Mock data for dashboard metrics
  const [dashboardData, setDashboardData] = useState({
    overview: {
      activeBatches: 12,
      totalRecipes: 34,
      inventoryItems: 156,
      recentOrders: 8
    },
    recentActivity: [
      { id: 1, type: 'batch', title: 'IPA Batch #47 started', time: '2 hours ago', status: 'active' },
      { id: 2, type: 'inventory', title: 'Hops inventory low', time: '4 hours ago', status: 'warning' },
      { id: 3, type: 'order', title: 'New order from Downtown Pub', time: '6 hours ago', status: 'success' },
      { id: 4, type: 'recipe', title: 'Stout Recipe updated', time: '1 day ago', status: 'info' }
    ],
    upcomingTasks: [
      { id: 1, title: 'Transfer IPA to secondary', dueTime: 'Today, 3:00 PM', priority: 'high' },
      { id: 2, title: 'Check fermentation temps', dueTime: 'Today, 6:00 PM', priority: 'medium' },
      { id: 3, title: 'Order more grain', dueTime: 'Tomorrow', priority: 'low' },
      { id: 4, title: 'Clean fermentation tanks', dueTime: 'Tomorrow, 9:00 AM', priority: 'medium' }
    ],
    alerts: [
      { id: 1, type: 'warning', message: 'Cascade hops inventory below minimum threshold', urgent: true },
      { id: 2, type: 'info', message: 'Quarterly brewing report available', urgent: false }
    ]
  })

  const handleLogout = () => {
    invalidateSession()
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'batch': return <BeakerIcon className="h-5 w-5 text-blue-500" />
      case 'inventory': return <CubeIcon className="h-5 w-5 text-orange-500" />
      case 'order': return <TruckIcon className="h-5 w-5 text-green-500" />
      case 'recipe': return <ClipboardDocumentListIcon className="h-5 w-5 text-purple-500" />
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fermentum-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.firstName || user?.displayName || 'Brewer'}!`}
      subtitle={`Here's what's happening at ${currentTenant?.tenantName || 'your brewery'} today.`}
      currentPage="Dashboard"
    >
      <div className="w-full">

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Active Batches */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BeakerIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Batches
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.overview.activeBatches}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button className="font-medium text-fermentum-600 hover:text-fermentum-500">
                    View all batches
                  </button>
                </div>
              </div>
            </div>

            {/* Total Recipes */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recipes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.overview.totalRecipes}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button className="font-medium text-fermentum-600 hover:text-fermentum-500">
                    Browse recipes
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Items */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CubeIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Inventory Items
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.overview.inventoryItems}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button className="font-medium text-fermentum-600 hover:text-fermentum-500">
                    Manage inventory
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TruckIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recent Orders
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.overview.recentOrders}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button className="font-medium text-fermentum-600 hover:text-fermentum-500">
                    View orders
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-fermentum-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                    <PlusIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    <span className="absolute inset-0" aria-hidden="true" />
                    New Batch
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start brewing
                  </p>
                </div>
              </button>

              <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-fermentum-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                    <ClipboardDocumentListIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Create Recipe
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    New formula
                  </p>
                </div>
              </button>

              <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-fermentum-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                    <CubeIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Add Inventory
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Stock items
                  </p>
                </div>
              </button>

              <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-fermentum-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <ChartBarIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    <span className="absolute inset-0" aria-hidden="true" />
                    View Reports
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Analytics
                  </p>
                </div>
              </button>

              <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-fermentum-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-red-50 text-red-700 ring-4 ring-white">
                    <UsersIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Manage Team
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Users & roles
                  </p>
                </div>
              </button>

              <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-fermentum-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                    <Cog6ToothIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Settings
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {dashboardData.recentActivity.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== dashboardData.recentActivity.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-8 ring-white">
                                {getActivityIcon(activity.type)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">{activity.title}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>{activity.time}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <button className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    View all activity
                  </button>
                </div>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Tasks</h3>
                <div className="space-y-3">
                  {dashboardData.upcomingTasks.map((task) => (
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${getPriorityColor(task.priority)}`}>
                      <div>
                        <h4 className="text-sm font-medium">{task.title}</h4>
                        <p className="text-xs opacity-75">{task.dueTime}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <button className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    View all tasks
                  </button>
                </div>
              </div>
            </div>
        
        </div>
      </div>
    </DashboardLayout>
  )
}