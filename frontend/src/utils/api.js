import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/**
 * Extract the tenant (subdomain) from window.location.hostname.
 * Falls back to 'localhost' in development.
 *
 * client1.app.com  → "client1"
 * localhost        → "localhost"
 */
export const getTenant = () => {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  if (parts.length === 1) return parts[0]      // "localhost"
  return parts[0].toLowerCase()                 // "client1"
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
})

// Attach tenant + auth token to every request
api.interceptors.request.use((config) => {
  const tenant = getTenant()
  config.headers['X-Tenant'] = tenant

  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  return config
})

// Handle 401 globally — clear session and reload
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
