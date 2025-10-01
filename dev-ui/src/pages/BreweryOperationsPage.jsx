import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreweryDrawer } from '../contexts/BreweryDrawerContext'
import DashboardLayout from '../components/DashboardLayout'

export default function BreweryOperationsPage() {
  const navigate = useNavigate()
  const { openDrawer } = useBreweryDrawer()

  useEffect(() => {
    // Open the brewery operations drawer and redirect to dashboard
    openDrawer()
    navigate('/dashboard', { replace: true })
  }, [navigate, openDrawer])

  // Show a temporary loading state while redirecting
  return (
    <DashboardLayout title="Brewery Operations" currentPage="Brewery Operations">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 font-['Menlo','Monaco','monospace']">
            Opening Brewery Operations...
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}