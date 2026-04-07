import api from './api'

export const startIntake = async (payload) => {
  const response = await api.post('/agent/start', payload)
  return response.data
}

export const chatWithAgent = async (requestId, clientName, message) => {
  const response = await api.post('/agent/chat', { requestId, clientName, message })
  return response.data
}

export const completeProfile = async (requestId, phone, deliveryAddress, gstNo) => {
  const response = await api.post('/agent/complete-profile', {
    requestId,
    phone,
    deliveryAddress,
    gstNo,
  })
  return response.data
}
