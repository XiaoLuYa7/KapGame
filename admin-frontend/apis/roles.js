import api from './index'

export const getRoles = (params) => {
  return api.get('/admin/roles', { params })
}

export const getRoleById = (id) => {
  return api.get(`/admin/roles/${id}`)
}

export const createRole = (data) => {
  return api.post('/admin/roles', data)
}

export const updateRole = (id, data) => {
  return api.put(`/admin/roles/${id}`, data)
}

export const deleteRole = (id) => {
  return api.delete(`/admin/roles/${id}`)
}

export const getAllPermissions = () => {
  return api.get('/admin/roles/permissions')
}

export const getPermissionCategories = () => {
  return api.get('/admin/roles/permissions/categories')
}

export const getPermissionTree = () => {
  return api.get('/admin/permissions/tree')
}

export const getRolePermissionTree = (roleId) => {
  return api.get(`/admin/roles/${roleId}/permissions/tree`)
}
