import apiClient from './index'

export const getActivities = (params) => {
  return apiClient.get('/admin/activities', { params })
}

export const getActivity = (id) => {
  return apiClient.get(`/admin/activities/${id}`)
}

export const createActivity = (data) => {
  return apiClient.post('/admin/activities', data)
}

export const updateActivity = (id, data) => {
  return apiClient.put(`/admin/activities/${id}`, data)
}

export const deleteActivity = (id) => {
  return apiClient.delete(`/admin/activities/${id}`)
}

export const getActivityRewards = (activityId) => {
  return apiClient.get(`/admin/activities/${activityId}/rewards`)
}

export const addActivityReward = (activityId, data) => {
  return apiClient.post(`/admin/activities/${activityId}/rewards`, data)
}

export const deleteActivityReward = (activityId, rewardId) => {
  return apiClient.delete(`/admin/activities/${activityId}/rewards/${rewardId}`)
}
