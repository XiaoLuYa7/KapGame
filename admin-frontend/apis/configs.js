import api from './index'

export const getConfigs = (params) => {
  return api.get('/admin/system-configs', { params })
}

export const getConfigById = (id) => {
  return api.get(`/admin/system-configs/${id}`)
}

export const getConfigByKey = (key) => {
  return api.get('/admin/system-configs/key/' + key)
}

export const createConfig = (data) => {
  return api.post('/admin/system-configs', data)
}

export const updateConfig = (id, data) => {
  return api.put(`/admin/system-configs/${id}`, data)
}

export const deleteConfig = (id) => {
  return api.delete(`/admin/system-configs/${id}`)
}
