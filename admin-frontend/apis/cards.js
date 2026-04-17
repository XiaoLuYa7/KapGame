import api from './index'

export const getCards = (params) => {
  return api.get('/admin/cards', { params })
}

export const getCardById = (id) => {
  return api.get(`/admin/cards/${id}`)
}

export const createCard = (data) => {
  return api.post('/admin/cards', data)
}

export const updateCard = (id, data) => {
  return api.put(`/admin/cards/${id}`, data)
}

export const deleteCard = (id) => {
  return api.delete(`/admin/cards/${id}`)
}

export const publishCard = (id) => {
  return api.post(`/admin/cards/${id}/publish`)
}
