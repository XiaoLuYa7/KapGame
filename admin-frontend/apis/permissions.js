import api from './index'

export const getPermissions = (params) => {
  return api.get('/admin/permissions', { params })
}

export const getPermissionById = (id) => {
  return api.get(`/admin/permissions/${id}`)
}

export const createPermission = (data) => {
  return api.post('/admin/permissions', data)
}

export const updatePermission = (id, data) => {
  return api.put(`/admin/permissions/${id}`, data)
}

export const deletePermission = (id) => {
  return api.delete(`/admin/permissions/${id}`)
}

export const getPermissionCategories = () => {
  return api.get('/admin/permissions/categories')
}

export const getPermissionTree = () => {
  return api.get('/admin/permissions/tree')
}
