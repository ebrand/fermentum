import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('accessToken')
    if (token) {
      getCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])

  const getCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      setUser(response.data.data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to get current user:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { accessToken, refreshToken, user } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      setUser(user)
      setIsAuthenticated(true)

      return { success: true, data: response.data }
    } catch (error) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { accessToken, refreshToken, user } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      setUser(user)
      setIsAuthenticated(true)

      return { success: true, data: response.data }
    } catch (error) {
      console.error('Registration failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const sendMagicLink = async (email) => {
    try {
      const redirectUrl = `${window.location.origin}/magic-link`
      const response = await authAPI.sendMagicLink(email, redirectUrl)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Failed to send magic link:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send magic link'
      }
    }
  }

  const verifyMagicLink = async (token) => {
    try {
      const response = await authAPI.verifyMagicLink(token)
      const { accessToken, refreshToken, user } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      setUser(user)
      setIsAuthenticated(true)

      return { success: true, data: response.data }
    } catch (error) {
      console.error('Magic link verification failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Magic link verification failed'
      }
    }
  }

  const startGoogleOAuth = async () => {
    try {
      const redirectUrl = `${window.location.origin}/oauth/callback`
      const response = await authAPI.getGoogleOAuthUrl(redirectUrl)

      // Redirect to Google OAuth URL
      window.location.href = response.data.data

      return { success: true }
    } catch (error) {
      console.error('Failed to start Google OAuth:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to start Google OAuth'
      }
    }
  }

  const startAppleOAuth = async () => {
    try {
      const redirectUrl = `${window.location.origin}/oauth/callback`
      const response = await authAPI.getAppleOAuthUrl(redirectUrl)

      // Redirect to Apple OAuth URL
      window.location.href = response.data.data

      return { success: true }
    } catch (error) {
      console.error('Failed to start Apple OAuth:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to start Apple OAuth'
      }
    }
  }

  const authenticateOAuth = async (token) => {
    try {
      const response = await authAPI.authenticateOAuth(token)
      const { accessToken, refreshToken, user } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      setUser(user)
      setIsAuthenticated(true)

      return { success: true, data: response.data }
    } catch (error) {
      console.error('OAuth authentication failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'OAuth authentication failed'
      }
    }
  }

  const updateUser = async (userData) => {
    try {
      const response = await authAPI.updateUser(userData)
      const updatedUser = response.data.data

      setUser(updatedUser)

      return { success: true, data: updatedUser }
    } catch (error) {
      console.error('Update user failed:', error)
      throw new Error(error.response?.data?.message || 'Failed to update profile')
    }
  }

  const updatePassword = async (passwordData) => {
    try {
      const response = await authAPI.updatePassword(passwordData)

      return { success: true, data: response.data }
    } catch (error) {
      console.error('Update password failed:', error)
      throw new Error(error.response?.data?.message || 'Failed to update password')
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authAPI.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    sendMagicLink,
    verifyMagicLink,
    startGoogleOAuth,
    startAppleOAuth,
    authenticateOAuth,
    updateUser,
    updatePassword,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}