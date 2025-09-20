import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TenantProvider } from './contexts/TenantContext'
import { useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MagicLinkPage from './pages/MagicLinkPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import TenantSelectionPage from './pages/TenantSelectionPage'
import CreateTenantPage from './pages/CreateTenantPage'
import OnboardingPage from './pages/OnboardingPage'
import BrewerySettingsPage from './pages/BrewerySettingsPage'
import ProductionBatchesPage from './pages/ProductionBatchesPage'

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fermentum-600"></div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" />
}

// Public Route component (redirect to tenant-selection if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fermentum-600"></div>
      </div>
    )
  }

  return !isAuthenticated ? children : <Navigate to="/tenant-selection" />
}

// Public landing page that doesn't require authentication
function LandingRoute() {
  return <LandingPage />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
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
        element={
          <ProtectedRoute>
            <OnboardingPage />
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
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TenantProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </TenantProvider>
      </AuthProvider>
    </Router>
  )
}

export default App