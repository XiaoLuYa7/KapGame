import api from './index'

export const login = (data) => {
  return api.post('/admin/auth/login', data)
}

export const logout = () => {
  return api.post('/admin/auth/logout')
}

export const getCurrentAdmin = () => {
  return api.get('/admin/auth/me')
}
