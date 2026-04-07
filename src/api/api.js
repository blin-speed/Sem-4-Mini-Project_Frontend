import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE + '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => config)

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data
    const message =
      data?.error ||
      data?.message ||
      (data?.errors ? Object.values(data.errors).join(', ') : null) ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default api
