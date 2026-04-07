import api from './api'

export const getAllClients = async () => {
  const response = await api.get('/clients')
  return response.data
}

export const getClientByNo = async (clientNo) => {
  const response = await api.get(`/clients/no/${clientNo}`)
  return response.data
}

export const getClientById = async (clientId) => {
  const response = await api.get(`/clients/${clientId}`)
  return response.data
}

export const updateClient = async (clientNo, fields) => {
  const response = await api.put(`/clients/no/${clientNo}`, fields)
  return response.data
}

export const archiveClient = async (clientNo) => {
  return updateClient(clientNo, { accountStatus: 'Archived' })
}

export const unarchiveClient = async (clientNo) => {
  return updateClient(clientNo, { accountStatus: 'Active' })
}
