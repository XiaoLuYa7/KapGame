const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

const storage = {
  get(key) {
    const item = localStorage.getItem(key)
    if (!item) return null
    try {
      return JSON.parse(item)
    } catch {
      return item
    }
  },
  set(key, value) {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value))
    } else {
      localStorage.setItem(key, value)
    }
  },
  remove(key) {
    localStorage.removeItem(key)
  },
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },
  getUser() {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  isLoggedIn() {
    const token = this.getToken()
    if (!token) return false
    // 检查token是否过期 (JWT payload 解析)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.removeToken()
        this.remove('admin_user')
        return false
      }
    } catch (e) {
      // token格式错误，清除它
      this.removeToken()
      this.remove('admin_user')
      return false
    }
    return true
  }
}

export default storage
