// 权限工具函数
import storage from './storage'
import { ref } from 'vue'

const PERMISSION_KEY = 'admin_permissions'

// 响应式权限数据
const permissions = ref({
  pages: [],
  functions: {}
})

// 应用启动时从 localStorage 初始化权限
export function initPermissions() {
  const stored = storage.get(PERMISSION_KEY)
  if (stored) {
    permissions.value = {
      pages: Array.isArray(stored?.pages) ? stored.pages : [],
      functions: stored?.functions && typeof stored.functions === 'object' ? stored.functions : {}
    }
  }
}

// 页面代码到路由路径的映射
const PAGE_ROUTE_MAP = {
  'MODULE:USER': '/users',
  'MODULE:CARD': '/cards',
  'MODULE:ACTIVITY': '/activities',
  'MODULE:CONFIG': '/configs',
  'MODULE:EARNINGS': '/earnings',
  'MODULE:ADMIN_USER': '/admin-users',
  'MODULE:ROLE': '/roles',
  'MODULE:PERMISSION': '/permissions',
  'MODULE:PUBLISH': '/publish',
  'MODULE:MAIL': '/mails'
}

// 权限代码前缀到页面代码的映射
const FUNCTION_PAGE_MAP = {
  'USER': 'MODULE:USER',
  'CARD': 'MODULE:CARD',
  'ACTIVITY': 'MODULE:ACTIVITY',
  'CONFIG': 'MODULE:CONFIG',
  'EARNINGS': 'MODULE:EARNINGS',
  'ADMIN_USER': 'MODULE:ADMIN_USER',
  'ROLE': 'MODULE:ROLE',
  'PERMISSION': 'MODULE:PERMISSION',
  'PUBLISH': 'MODULE:PUBLISH',
  'MAIL': 'MODULE:MAIL'
}

// 保存权限数据
export function setPermissions(data) {
  storage.set(PERMISSION_KEY, data)
  permissions.value = {
    pages: Array.isArray(data?.pages) ? data.pages : [],
    functions: data?.functions && typeof data.functions === 'object' ? data.functions : {}
  }
}

// 获取权限数据
export function getPermissions() {
  return permissions.value
}

// 清除权限数据
export function clearPermissions() {
  storage.remove(PERMISSION_KEY)
  permissions.value = { pages: [], functions: {} }
}

// 检查是否有页面权限
export function hasPagePermission(pageCode) {
  return permissions.value.pages && permissions.value.pages.includes(pageCode)
}

// 检查是否有功能权限
export function hasFunctionPermission(functionCode) {
  if (!permissions.value.functions) return false

  // functionCode 格式如 "USER:VIEW" 或 "MODULE:USER:VIEW"
  const parts = functionCode.split(':')
  if (parts.length !== 2 && parts.length !== 3) return false

  // 支持 USER:VIEW 和 MODULE:USER:VIEW 两种格式
  let pageCode, action
  if (parts.length === 2) {
    pageCode = 'MODULE:' + parts[0] // USER:VIEW -> MODULE:USER
    action = parts[1]
  } else {
    pageCode = parts[0] + ':' + parts[1] // MODULE:USER
    action = parts[2]
  }

  // 同时支持两种格式：USER 和 MODULE:USER
  let pageFunctions = permissions.value.functions[pageCode]
  if (!pageFunctions) {
    // 尝试不带 MODULE: 前缀的格式
    const simpleCode = parts.length === 2 ? parts[0] : parts[1]
    pageFunctions = permissions.value.functions[simpleCode]
  }
  if (!pageFunctions) return false

  return pageFunctions.includes(action)
}

// 检查是否有某个具体权限（页面或功能）
export function hasPermission(code) {
  if (!code) return true

  // 如果包含冒号，认为是功能权限
  if (code.includes(':')) {
    return hasFunctionPermission(code)
  }

  // 否则是页面权限
  return hasPagePermission(code)
}

// 获取用户可以访问的菜单
export function getAccessibleMenus() {
  const accessibleMenus = []

  const allMenus = [
    { path: '/dashboard', name: '仪表盘', icon: 'HomeFilled', code: null }, // Dashboard always accessible
    { path: '/users', name: '用户管理', icon: 'User', code: 'MODULE:USER' },
    { path: '/cards', name: '卡牌管理', icon: 'Postcard', code: 'MODULE:CARD' },
    { path: '/activities', name: '活动管理', icon: 'Calendar', code: 'MODULE:ACTIVITY' },
    { path: '/configs', name: '配置管理', icon: 'Setting', code: 'MODULE:CONFIG' },
    { path: '/earnings', name: '收益查询', icon: 'Money', code: 'MODULE:EARNINGS' },
    { path: '/admin-users', name: '管理员', icon: 'UserFilled', code: 'MODULE:ADMIN_USER' },
    { path: '/roles', name: '角色管理', icon: 'Key', code: 'MODULE:ROLE' },
    { path: '/permissions', name: '权限管理', icon: 'Lock', code: 'MODULE:PERMISSION' },
    { path: '/publish', name: '发布管理', icon: 'Promotion', code: 'MODULE:PUBLISH' },
    { path: '/mails', name: '邮件管理', icon: 'Message', code: 'MODULE:MAIL' },
  ]

  for (const menu of allMenus) {
    // Dashboard 始终可见
    if (!menu.code || hasPagePermission(menu.code)) {
      accessibleMenus.push(menu)
    }
  }

  return accessibleMenus
}

// 检查功能按钮权限
export function hasButtonPermission(buttonType, pageCode) {
  // buttonType: 'CREATE', 'EDIT', 'DELETE', 'VIEW'
  const functionCode = `${pageCode}:${buttonType}`
  return hasFunctionPermission(functionCode)
}

// 获取路由路径对应的页面代码
export function getPageCodeFromRoute(routePath) {
  for (const [code, path] of Object.entries(PAGE_ROUTE_MAP)) {
    if (routePath.startsWith(path)) {
      return code
    }
  }
  return null
}

// 导出响应式权限引用，供外部监听
export { permissions }

export default {
  setPermissions,
  getPermissions,
  clearPermissions,
  initPermissions,
  hasPagePermission,
  hasFunctionPermission,
  hasPermission,
  getAccessibleMenus,
  hasButtonPermission,
  getPageCodeFromRoute,
  permissions
}
