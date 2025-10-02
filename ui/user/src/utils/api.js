import axios from 'axios'

// Get API URL with validation and fallback
const getApiUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL
  const fallbackUrl = 'https://localhost:5001/api'  // Updated: Use HTTPS API endpoint

  // Log the configuration for debugging
  console.log('🔧 API Configuration:', {
    VITE_API_URL: envApiUrl,
    fallback: fallbackUrl,
    final: envApiUrl || fallbackUrl,
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE
  })

  const apiUrl = envApiUrl || fallbackUrl

  // Validate that we don't accidentally use the frontend port
  if (apiUrl.includes('localhost:3000') || apiUrl.includes('localhost:3001')) {
    console.error('❌ INVALID API URL: Frontend trying to call itself!', apiUrl)
    console.error('❌ This will cause infinite loops. Using fallback instead.')
    return fallbackUrl
  }

  return apiUrl
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Add request interceptor to include auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    console.log('🌐 API Request:', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      method: config.method
    })

    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add tenant ID header for multi-tenant functionality
    const tenantId = localStorage.getItem('currentTenantId')
    const PHANTOM_TENANT_ID = 'cee20966-d6d5-4024-8b1d-ca0e3ebc33c4'

    // Check for phantom tenant ID and refuse to send it
    if (tenantId === PHANTOM_TENANT_ID) {
      console.error('🚨 [API] PHANTOM TENANT ID BLOCKED! Removing from localStorage:', PHANTOM_TENANT_ID)
      localStorage.removeItem('currentTenantId')
      localStorage.removeItem('currentBreweryId')
      // Don't set the header with phantom ID
    } else if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors with token refresh
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    })
    return response
  },
  async (error) => {
    console.log('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      requestURL: error.request?.responseURL
    })

    const originalRequest = error.config

    // Handle 401 errors with automatic token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          console.log('🔄 Attempting token refresh for failed request...')

          // Use the refresh token to get new access token
          const refreshResponse = await axios.post(
            `${getApiUrl()}/auth/refresh`,
            { refreshToken },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            }
          )

          if (refreshResponse.data.accessToken) {
            console.log('✅ Token refresh successful, retrying original request')

            // Update stored tokens
            localStorage.setItem('accessToken', refreshResponse.data.accessToken)
            if (refreshResponse.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshResponse.data.refreshToken)
            }

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`

            // Retry the original request
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.log('❌ Token refresh failed:', refreshError.message)

          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('currentTenantId')
          window.location.href = '/onboarding'
          return Promise.reject(refreshError)
        }
      } else {
        console.log('❌ No refresh token available, redirecting to login')

        // No refresh token available, clear tokens and redirect
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('currentTenantId')
        window.location.href = '/onboarding'
      }
    }

    // For non-401 errors or if retry already attempted, reject the promise
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
  getInvitationsByEmail: (email) => api.get(`/invitations/email/${encodeURIComponent(email)}`),
  createInvitation: (inviteData) => api.post('/invitations', inviteData),
  cancelInvitation: (invitationId) => api.delete(`/invitations/${invitationId}`),
  acceptInvitation: (invitationId, acceptData) => api.post(`/invitations/${invitationId}/accept`, acceptData),
}

// Inventory API endpoints
export const inventoryAPI = {
  getRawMaterialInventory: (breweryId) => api.get(`/inventory/raw-materials/${breweryId}`),
  receiveRawMaterial: (receiveData) => api.post('/inventory/raw-materials/receive', receiveData),
  adjustRawMaterialStock: (adjustData) => api.post('/inventory/raw-materials/adjust', adjustData),
  getInventoryTransactions: (breweryId, page = 1, pageSize = 50) =>
    api.get(`/inventory/transactions/${breweryId}`, { params: { page, pageSize } }),
  getLowStockItems: (breweryId) => api.get(`/inventory/low-stock/${breweryId}`),
}

// Plugin API endpoints
export const pluginAPI = {
  getAvailablePlugins: () => api.get('/plugins'),
  getTenantPlugins: () => api.get('/plugins/tenant'),
  installPlugin: (pluginData) => api.post('/plugins/install', pluginData),
  uninstallPlugin: (tenantPluginId) => api.delete(`/plugins/${tenantPluginId}`),
  enablePlugin: (tenantPluginId) => api.put(`/plugins/${tenantPluginId}/enable`),
  disablePlugin: (tenantPluginId) => api.put(`/plugins/${tenantPluginId}/disable`),
  updatePluginConfiguration: (tenantPluginId, configuration) =>
    api.put(`/plugins/${tenantPluginId}/configuration`, { configuration }),
  updatePluginAuth: (tenantPluginId, authData) =>
    api.put(`/plugins/${tenantPluginId}/auth`, { authData }),
  triggerSync: (tenantPluginId, syncType = 'manual') =>
    api.post(`/plugins/${tenantPluginId}/sync`, { SyncType: syncType }),
  getSyncHistory: (tenantPluginId, limit = 10) =>
    api.get(`/plugins/${tenantPluginId}/sync-history`, { params: { limit } }),
  testConnection: (tenantPluginId) => api.get(`/plugins/${tenantPluginId}/test-connection`),
  // QuickBooks OAuth methods
  getQuickBooksOAuthUrl: () => api.get('/plugins/quickbooks/oauth-url'),
  handleQuickBooksOAuthCallback: (data) => api.post('/plugins/quickbooks/oauth-callback', data),
}

// QuickBooks Data API endpoints
export const quickBooksAPI = {
  getAccounts: () => api.get('/quickbooks/accounts'),
  getCustomers: () => api.get('/quickbooks/customers'),
  getItems: () => api.get('/quickbooks/items'),
  getInvoices: () => api.get('/quickbooks/invoices'),
  getPayments: () => api.get('/quickbooks/payments'),
  getSummary: () => api.get('/quickbooks/summary'),
}

// Notifications API endpoints
export const notificationsAPI = {
  getNotifications: (filters = {}) => api.get('/notifications', { params: filters }),
  getNotificationCounts: () => api.get('/notifications/counts'),
  createNotification: (notificationData) => api.post('/notifications', notificationData),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  markAsAcknowledged: (notificationId) => api.put(`/notifications/${notificationId}/acknowledge`),
  removeNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  clearAllNotifications: () => api.delete('/notifications/clear-all'),
  clearReadNotifications: () => api.delete('/notifications/clear-read'),
}

// Assignments API endpoints
export const assignmentsAPI = {
  // Assignment CRUD operations
  getAssignments: (filters = {}) => api.get('/assignments', { params: filters }),
  getAssignment: (assignmentId) => api.get(`/assignments/${assignmentId}`),
  createAssignment: (assignmentData) => api.post('/assignments', assignmentData),
  updateAssignment: (assignmentId, assignmentData) => api.put(`/assignments/${assignmentId}`, assignmentData),
  deleteAssignment: (assignmentId) => api.delete(`/assignments/${assignmentId}`),

  // Assignment status management
  assignToEmployee: (assignmentId, employeeId, reason = null) =>
    api.post(`/assignments/${assignmentId}/assign`, { employeeId, reason }),
  confirmAssignment: (assignmentId) => api.post(`/assignments/${assignmentId}/confirm`),
  startAssignment: (assignmentId) => api.post(`/assignments/${assignmentId}/start`),
  pauseAssignment: (assignmentId, reason = null) =>
    api.post(`/assignments/${assignmentId}/pause`, { reason }),
  completeAssignment: (assignmentId, completionNotes = null, photoUrls = null) =>
    api.post(`/assignments/${assignmentId}/complete`, { completionNotes, photoUrls }),
  cancelAssignment: (assignmentId, reason = null) =>
    api.post(`/assignments/${assignmentId}/cancel`, { reason }),
  signOffAssignment: (assignmentId, notes = null) =>
    api.post(`/assignments/${assignmentId}/signoff`, { notes }),

  // Assignment categories
  getCategories: () => api.get('/assignments/categories'),

  // Assignment reporting and analytics
  getSummary: (startDate = null, endDate = null) =>
    api.get('/assignments/summary', { params: { startDate, endDate } }),
  getMyAssignments: (status = null) => api.get('/assignments/my-assignments', { params: { status } }),

  // Assignment comments
  getComments: (assignmentId) => api.get(`/assignments/${assignmentId}/comments`),
  addComment: (assignmentId, commentData) => api.post(`/assignments/${assignmentId}/comments`, commentData),
}

// Recipe API endpoints
export const recipeAPI = {
  getRecipes: (includeInactive = false) => api.get('/recipes', { params: { includeInactive } }),
  getRecipe: (recipeId) => api.get(`/recipes/${recipeId}`),
  getBeerStyles: () => api.get('/recipes/styles'),
  createRecipe: (recipeData) => api.post('/recipes', recipeData),
  updateRecipe: (recipeId, recipeData) => api.put(`/recipes/${recipeId}`, recipeData),
  deleteRecipe: (recipeId) => api.delete(`/recipes/${recipeId}`),
}

// Ingredient API endpoints
export const ingredientAPI = {
  getGrains: (filters = {}) => api.get('/grains', { params: filters }),
  getHops: (filters = {}) => api.get('/hops', { params: filters }),
  getYeasts: (filters = {}) => api.get('/yeasts', { params: filters }),
  getAdditives: (filters = {}) => api.get('/additives', { params: filters }),
}

// Helper function for ingredient data fetching
export const getIngredientData = async (ingredientType, filters = {}) => {
  try {
    let response
    switch (ingredientType) {
      case 'grains':
        response = await ingredientAPI.getGrains(filters)
        break
      case 'hops':
        response = await ingredientAPI.getHops(filters)
        break
      case 'yeasts':
        response = await ingredientAPI.getYeasts(filters)
        break
      case 'additives':
        response = await ingredientAPI.getAdditives(filters)
        break
      default:
        throw new Error(`Unknown ingredient type: ${ingredientType}`)
    }
    return response.data
  } catch (error) {
    console.error(`Error fetching ${ingredientType}:`, error)
    throw error
  }
}

// Stock and Inventory API endpoints
export const stockAPI = {
  // Get all stock items
  getStock: (filters = {}) => api.get('/stock', { params: filters }),

  // Get specific stock item
  getStockItem: (stockId) => api.get(`/stock/${stockId}`),

  // Create new stock item
  createStock: (stockData) => api.post('/stock', stockData),

  // Update stock item
  updateStock: (stockId, stockData) => api.put(`/stock/${stockId}`, stockData),

  // Delete stock item
  deleteStock: (stockId) => api.delete(`/stock/${stockId}`),

  // Check lot availability for an ingredient
  checkLotAvailability: ({ ingredientId, category, amount, unit }) =>
    api.get('/stock/availability', {
      params: { ingredientId, category, amount, unit }
    }),

  // Get stock inventory (lot-level details)
  getStockInventory: (stockId) => api.get(`/stock/${stockId}/inventory`),

  // Create new stock inventory lot
  createStockInventory: (stockId, inventoryData) =>
    api.post(`/stock/${stockId}/inventory`, inventoryData),

  // Update stock inventory lot
  updateStockInventory: (stockId, inventoryId, inventoryData) =>
    api.put(`/stock/${stockId}/inventory/${inventoryId}`, inventoryData),

  // Delete stock inventory lot
  deleteStockInventory: (stockId, inventoryId) =>
    api.delete(`/stock/${stockId}/inventory/${inventoryId}`),
}

// Batch API endpoints
export const batchAPI = {
  // Get all batches with optional filters (status, breweryId, recipeId)
  getBatches: (params = {}) => api.get('/batch', { params }),

  // Get specific batch details
  getBatch: (id) => api.get(`/batch/${id}`),

  // Create new batch (auto-generates BatchSteps from RecipeSteps if recipeId provided)
  createBatch: (batchData) => api.post('/batch', batchData),

  // Update batch
  updateBatch: (id, batchData) => api.put(`/batch/${id}`, batchData),

  // Update batch status only
  updateBatchStatus: (id, status) => api.patch(`/batch/${id}/status`, { status }),

  // Delete batch
  deleteBatch: (id) => api.delete(`/batch/${id}`),
}

// Equipment API endpoints
export const equipmentAPI = {
  // Get all equipment with optional filters (status, equipmentTypeId)
  getEquipment: (params = {}) => api.get('/equipment', { params }),

  // Get specific equipment by ID
  getEquipmentById: (id) => api.get(`/equipment/${id}`),

  // Get available equipment (optional filters: equipmentTypeId, startTime, endTime)
  getAvailableEquipment: (params = {}) => api.get('/equipment/available', { params }),

  // Create new equipment
  createEquipment: (equipmentData) => api.post('/equipment', equipmentData),

  // Update equipment
  updateEquipment: (id, equipmentData) => api.put(`/equipment/${id}`, equipmentData),

  // Update equipment status only
  updateEquipmentStatus: (id, status) => api.patch(`/equipment/${id}/status`, { status }),

  // Delete equipment
  deleteEquipment: (id) => api.delete(`/equipment/${id}`),
}

// Equipment Type API endpoints
export const equipmentTypeAPI = {
  // Get all equipment types
  getEquipmentTypes: () => api.get('/equipmenttype'),

  // Get specific equipment type by ID
  getEquipmentType: (id) => api.get(`/equipmenttype/${id}`),

  // Create new equipment type
  createEquipmentType: (typeData) => api.post('/equipmenttype', typeData),

  // Update equipment type
  updateEquipmentType: (id, typeData) => api.put(`/equipmenttype/${id}`, typeData),

  // Delete equipment type (only if no equipment instances exist)
  deleteEquipmentType: (id) => api.delete(`/equipmenttype/${id}`),
}

export default api