import api from './api'

export const getAllRequests = async (clientNo) => {
  // Handle both direct number and object with clientNo property
  const clientNoValue = typeof clientNo === 'number' ? clientNo : clientNo?.clientNo
  const response = await api.get('/requests', { params: clientNoValue ? { clientNo: clientNoValue } : {} })
  return response.data.data || response.data
}

export const getRequestById = async (requestId) => {
  // Not directly supported by backend; fetch all and filter as fallback
  const all = await getAllRequests()
  return all.find((r) => r.requestId === requestId)
}

export const createRequest = async (payload) => {
  const response = await api.post('/requests', payload)
  return response.data.data || response.data
}

export const updateRequestStatus = async (requestId, status) => {
  const response = await api.put(`/requests/${requestId}/status`, { status })
  return response.data.data || response.data
}

export const getMessages = async (requestId) => {
  const response = await api.get(`/requests/${requestId}/messages`)
  return response.data.data || response.data
}

export const sendMessage = async (requestId, dmSender, messageContent) => {
  const response = await api.post(`/requests/${requestId}/messages`, { dmSender, messageContent })
  return response.data.data || response.data
}

export const markMessagesAsRead = async (requestId, reader) => {
  const response = await api.put(`/requests/${requestId}/messages/read`, { reader })
  return response.data.data || response.data
}

export const deleteRequest = async (requestId) => {
  const response = await api.delete(`/requests/${requestId}`)
  return response.data
}
