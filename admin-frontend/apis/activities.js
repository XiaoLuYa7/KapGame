import api from './index'

export const getActivities = (params) => {
  return api.get('/admin/activities', { params })
}

export const getActivityById = (id) => {
  return api.get(`/admin/activities/${id}`)
}

export const createActivity = (data) => {
  return api.post('/admin/activities', data)
}

export const updateActivity = (id, data) => {
  return api.put(`/admin/activities/${id}`, data)
}

export const deleteActivity = (id) => {
  return api.delete(`/admin/activities/${id}`)
}

export const updateActivityStatus = (id, status) => {
  return api.put(`/admin/activities/${id}/status`, { status })
}
