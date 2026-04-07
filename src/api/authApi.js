import api from './api'

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const register = async (payload) => {
  const response = await api.post('/auth/register', payload)
  return response.data
}

export const verify = async (email, code) => {
  const response = await api.post('/auth/verify', { email, code })
  return response.data
}
