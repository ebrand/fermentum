import React from 'react'
import { useSession } from '../contexts/SessionContext'
import BreweryOperationsWrapper from './BreweryOperationsWrapper'

const AuthenticatedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useSession()

  return (
    <>
      {children}
      {/* Only show brewery operations for authenticated users */}
      {!loading && isAuthenticated && <BreweryOperationsWrapper />}
    </>
  )
}

export default AuthenticatedLayout