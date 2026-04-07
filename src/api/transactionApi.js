import api from './api'

export const getAllTransactions = async (orderId) => {
  // Handle both direct string and object with orderId property
  const orderIdValue = typeof orderId === 'string' ? orderId : orderId?.orderId
  
  // orderId is optional for admin level access (fetching all)
  const params = orderIdValue ? { orderId: orderIdValue } : {}
  const response = await api.get('/transactions', { params })
  return response.data
}

export const logTransaction = async (payload) => {
  const response = await api.post('/transactions', payload)
  return response.data
}

export const confirmTransaction = async (transactionId, orderId) => {
  if (!transactionId || !orderId) {
    throw new Error('transactionId and orderId are required')
  }
  const response = await api.put(`/transactions/${transactionId}/confirm`, null, {
    params: { orderId }
  })
  return response.data
}
