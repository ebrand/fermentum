import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Add request interceptor to include auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add tenant ID header for multi-tenant functionality
    const tenantId = localStorage.getItem('currentTenantId')
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and tenant ID, redirect to login
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('currentTenantId')
      window.location.href = '/onboarding'
    }
    return Promise.reject(error)
  }
)

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  sendMagicLink: (email, redirectUrl) => api.post('/auth/magic-link', { email, redirectUrl }),
  verifyMagicLink: (token) => api.post('/auth/magic-link/verify', { token }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
  updateUser: (userData) => api.put('/auth/me', userData),
  updatePassword: (passwordData) => api.put('/auth/password', passwordData),
  getGoogleOAuthUrl: (redirectUrl) => api.get('/auth/google-oauth-url', { params: { redirectUrl } }),
  getAppleOAuthUrl: (redirectUrl) => api.get('/auth/apple-oauth-url', { params: { redirectUrl } }),
  authenticateOAuth: (token) => api.post('/auth/oauth', { token }),
  createAccountWithTenant: (data) => api.post('/auth/create-account-with-tenant', data),

  // Session management endpoints
  createSession: (data) => api.post('/session/create', data),
  getCurrentSession: () => api.get('/session/current'),
  setCurrentTenant: (data) => api.post('/session/set-current-tenant', data),
  setCurrentBrewery: (data) => api.post('/session/set-current-brewery', data),
  refreshTenants: () => api.post('/session/refresh-tenants'),
  refreshBreweries: () => api.post('/session/refresh-breweries'),
  invalidateSession: () => api.post('/session/invalidate'),
}

// Tenant API endpoints
export const tenantAPI = {
  getUserTenants: () => api.get('/tenants'),
  getTenant: (tenantId) => api.get(`/tenants/${tenantId}`),
  createTenant: (tenantData) => api.post('/tenants', tenantData),
  getTenantUsers: (tenantId) => api.get(`/tenants/${tenantId}/users`),
  inviteUser: (tenantId, inviteData) => api.post(`/tenants/${tenantId}/invite`, inviteData),
  getInvitations: (tenantId) => api.get(`/tenants/${tenantId}/invitations`),
  cancelInvitation: (tenantId, invitationId) => api.delete(`/tenants/${tenantId}/invitations/${invitationId}`),
}

// Payment API endpoints
export const paymentAPI = {
  createSubscription: (subscriptionData) => api.post('/payment/subscriptions', subscriptionData),
  getSubscription: (tenantId) => api.get(`/payment/subscriptions/${tenantId}`),
  updateSubscription: (tenantId, updateData) => api.put(`/payment/subscriptions/${tenantId}`, updateData),
  cancelSubscription: (tenantId) => api.delete(`/payment/subscriptions/${tenantId}`),
  createSetupIntent: (setupData) => api.post('/payment/setup-intent', setupData),
}

// Employee API endpoints
export const employeeAPI = {
  getEmployees: () => api.get('/employees'),
  getEmployee: (employeeId) => api.get(`/employees/${employeeId}`),
  createEmployee: (employeeData) => api.post('/employees', employeeData),
  updateEmployee: (employeeId, employeeData) => api.put(`/employees/${employeeId}`, employeeData),
  deleteEmployee: (employeeId) => api.delete(`/employees/${employeeId}`),
}

// Users API endpoints
export const usersAPI = {
  getTenantUsers: (tenantId) => api.get(`/users/tenant/${tenantId}`),
  inviteUser: (inviteData) => api.post('/users/invite', inviteData),
  removeUserFromTenant: (tenantId, userId) => api.delete(`/users/tenant/${tenantId}/user/${userId}`),
}

// Invitations API endpoints
export const invitationsAPI = {
  getTenantInvitations: (tenantId) => api.get(`/invitations/tenant/${tenantId}`),
  createInvitation: (inviteData) => api.post('/invitations', inviteData),
  cancelInvitation: (invitationId) => api.delete(`/invitations/${invitationId}`),
  acceptInvitation: (invitationId, acceptData) => api.post(`/invitations/${invitationId}/accept`, acceptData),
}

export default api