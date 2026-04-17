import api from './index'

export const getAdminUsers = (params) => {
  return api.get('/admin/admin-users', { params })
}

export const getAdminUserById = (id) => {
  return api.get(`/admin/admin-users/${id}`)
}

export const createAdminUser = (data) => {
  return api.post('/admin/admin-users', data)
}

export const updateAdminUser = (id, data) => {
  return api.put(`/admin/admin-users/${id}`, data)
}

export const deleteAdminUser = (id) => {
  return api.delete(`/admin/admin-users/${id}`)
}

export const getAllRoles = () => {
  return api.get('/admin/admin-users/roles')
}
