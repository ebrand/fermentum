import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider } from './contexts/SessionContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { BreweryDrawerProvider } from './contexts/BreweryDrawerContext'
import { useSession } from './contexts/SessionContext'
import AuthenticatedLayout from './components/AuthenticatedLayout'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import MagicLinkPage from './pages/MagicLinkPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import TenantSelectionPage from './pages/TenantSelectionPage'
import CreateTenantPage from './pages/CreateTenantPage'
import OnboardingPage from './pages/OnboardingPage'
import BrewerySetupPage from './pages/BrewerySetupPage'
import BrewerySettingsPage from './pages/BrewerySettingsPage'
import BreweryOperationsPage from './pages/BreweryOperationsPage'
import ProductionBatchesPage from './pages/ProductionBatchesPage'
import UserProfilePage from './pages/UserProfilePage'
import EmployeesPage from './pages/EmployeesPage'

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, session } = useSession()

  console.log('🛡️ [ProtectedRoute] Authentication check:', {
    isAuthenticated,
    loading,
    hasSession: !!session,
    currentPath: window.location.pathname,
    tokens: {
      accessToken: localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING',
      refreshToken: localStorage.getItem('refreshToken') ? 'EXISTS' : 'MISSING'
    }
  })

  if (loading) {
    console.log('⏳ [ProtectedRoute] Still loading, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fermentum-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('❌ [ProtectedRoute] Not authenticated, redirecting to onboarding')
    return <Navigate to="/onboarding" />
  }

  console.log('✅ [ProtectedRoute] Authentication successful, rendering protected content')
  return children
}

// Public Route component (redirect to appropriate page if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useSession()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fermentum-600"></div>
      </div>
    )
  }

  // Redirect authenticated users based on their role
  if (isAuthenticated && user) {
    // Users with tenant role go to brewery operations
    if (user.role === 'tenant') {
      return <Navigate to="/brewery-operations" />
    }

    // Other users go to tenant selection
    return <Navigate to="/tenant-selection" />
  }

  return children
}

// Public landing page that doesn't require authentication
function LandingRoute() {
  const { isAuthenticated, user, loading } = useSession()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect authenticated users based on their role
  if (isAuthenticated && user) {
    // Users with tenant role go to brewery operations
    if (user.role === 'tenant') {
      return <Navigate to="/brewery-operations" />
    }
    // Other users go to tenant selection
    return <Navigate to="/tenant-selection" />
  }

  return <LandingPage />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route
        path="/login"
        element={<Navigate to="/onboarding" replace />}
      />
      <Route
        path="/register"
        element={<Navigate to="/onboarding" replace />}
      />
      <Route
        path="/magic-link"
        element={
          <PublicRoute>
            <MagicLinkPage />
          </PublicRoute>
        }
      />
      <Route
        path="/oauth/callback"
        element={<OAuthCallbackPage />}
      />
      <Route
        path="/onboarding"
        element={<OnboardingPage />}
      />
      <Route
        path="/brewery-setup"
        element={
          <ProtectedRoute>
            <BrewerySetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenant-selection"
        element={
          <ProtectedRoute>
            <TenantSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-tenant"
        element={
          <ProtectedRoute>
            <CreateTenantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brewery-operations"
        element={
          <ProtectedRoute>
            <BreweryOperationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brewery/settings"
        element={
          <ProtectedRoute>
            <BrewerySettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/production/batches"
        element={
          <ProtectedRoute>
            <ProductionBatchesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/employees"
        element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <SessionProvider>
          <BreweryDrawerProvider>
            <AuthenticatedLayout>
              <div className="min-h-screen bg-gray-50">
                <AppRoutes />
              </div>
            </AuthenticatedLayout>
          </BreweryDrawerProvider>
        </SessionProvider>
      </NotificationProvider>
    </Router>
  )
}

export default App