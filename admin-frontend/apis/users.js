import api from './index'

export const getUsers = (params) => {
  return api.get('/admin/users', { params })
}

export const getUserById = (id) => {
  return api.get(`/admin/users/${id}`)
}

export const getUserFriends = (id) => {
  return api.get(`/admin/users/${id}/friends`)
}

export const updateUser = (id, data) => {
  return api.put(`/admin/users/${id}`, data)
}

export const deleteUser = (id) => {
  return api.delete(`/admin/users/${id}`)
}

export const addUserDiamonds = (id, diamonds) => {
  return api.post(`/admin/users/${id}/diamonds`, { diamonds })
}

export const addUserGold = (id, gold) => {
  return api.post(`/admin/users/${id}/gold`, { gold })
}

export const banUser = (id) => {
  return api.put(`/admin/users/${id}/ban`)
}

export const unbanUser = (id) => {
  return api.put(`/admin/users/${id}/unban`)
}
