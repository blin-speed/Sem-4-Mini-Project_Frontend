import api from './api'

export const getAllDevices = async () => {
  const response = await api.get('/devices')
  return response.data
}

export const createDevice = async (payload) => {
  const response = await api.post('/devices', payload)
  return response.data
}

export const updateDevice = async (partNo, payload) => {
  const response = await api.put(`/devices/${partNo}`, payload)
  return response.data
}

export const deleteDevice = async (partNo) => {
  const response = await api.delete(`/devices/${partNo}`)
  return response.data
}


// Catalog operations
export const getAllCatalogItems = async () => {
  const response = await api.get('/catalog')
  return response.data
}

export const getActiveCatalogItems = async () => {
  const response = await api.get('/catalog/active')
  return response.data
}

export const getCatalogItem = async (catalogId) => {
  const response = await api.get(`/catalog/${catalogId}`)
  return response.data
}

export const createCatalogItem = async (payload) => {
  const response = await api.post('/catalog', payload)
  return response.data
}

export const updateCatalogItem = async (catalogId, payload) => {
  const response = await api.put(`/catalog/${catalogId}`, payload)
  return response.data
}

export const deleteCatalogItem = async (catalogId) => {
  const response = await api.delete(`/catalog/${catalogId}`)
  return response.data
}

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats')
  return response.data
}
