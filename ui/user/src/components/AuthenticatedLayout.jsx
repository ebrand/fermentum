import React from 'react'
import { useLocation } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import BreweryOperationsWrapper from './BreweryOperationsWrapper'

const AuthenticatedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useSession()
  const location = useLocation()

  // Don't show brewery operations drawer on tenant selection and auth pages
  const hiddenOnRoutes = ['/tenant-selection', '/create-tenant', '/onboarding', '/oauth/callback']
  const shouldShowBreweryOperations = !hiddenOnRoutes.includes(location.pathname)

  return (
    <>
      {children}
      {/* Only show brewery operations for authenticated users and not on tenant selection pages */}
      {!loading && isAuthenticated && shouldShowBreweryOperations && <BreweryOperationsWrapper />}
    </>
  )
}

export default AuthenticatedLayout