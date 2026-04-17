import api from './index'

export const publishConfig = (data) => {
  return api.post('/admin/publish', data)
}

export const getPublishHistory = () => {
  return api.get('/admin/publish/history')
}

export const getLatestPublish = () => {
  return api.get('/admin/publish/latest')
}

export const getPublishStats = () => {
  return api.get('/admin/publish/stats')
}
