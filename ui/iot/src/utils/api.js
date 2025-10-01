import axios from 'axios'

// Get API URL with validation and fallback
const getApiUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL
  const fallbackUrl = 'https://localhost:5001/api'

  console.log('🔧 API Configuration:', {
    VITE_API_URL: envApiUrl,
    fallback: fallbackUrl,
    final: envApiUrl || fallbackUrl,
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE
  })

  const apiUrl = envApiUrl || fallbackUrl

  // Validate that we don't accidentally use the frontend port
  if (apiUrl.includes('localhost:3002')) {
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
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle errors
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
      message: error.message
    })

    return Promise.reject(error)
  }
)

export default api
