import api from './api'

export const getAllOrders = async (clientNo) => {
  // Handle both direct number and object with clientNo property
  const clientNoValue = typeof clientNo === 'number' ? clientNo : clientNo?.clientNo
  const response = await api.get('/orders', { params: clientNoValue ? { clientNo: clientNoValue } : {} })
  return response.data
}

export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`)
  return response.data
}

export const createOrder = async (payload) => {
  const response = await api.post('/orders', payload)
  return response.data
}

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/orders/${orderId}/status`, { status })
  return response.data
}

export const deleteOrder = async (orderId) => {
  const response = await api.delete(`/orders/${orderId}`)
  return response.data
}

// Returns a Blob — caller creates an object URL and triggers download
export const downloadInvoice = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' })
  return response.data
}
