import { hasPermission, hasButtonPermission } from '@/utils/permission'

// v-permission="'MODULE:USER:VIEW'" - 页面/功能权限指令
export const permissionDirective = {
  mounted(el, binding) {
    const permission = binding.value
    if (permission && !hasPermission(permission)) {
      el.parentNode?.removeChild(el)
    }
  }
}

// v-has-permission="'USER:CREATE'" - 功能权限指令（简写）
export const hasPermissionDirective = {
  mounted(el, binding) {
    const permission = binding.value
    if (permission && !hasPermission(permission)) {
      el.parentNode?.removeChild(el)
    }
  }
}

// 按钮权限指令 v-has-button="'CREATE'" 需要配合 page-code 属性使用
export const buttonPermissionDirective = {
  mounted(el, binding) {
    const buttonType = binding.value
    const pageCode = el.getAttribute('page-code') || binding.arg
    if (pageCode && buttonType && !hasButtonPermission(buttonType, pageCode)) {
      el.parentNode?.removeChild(el)
    }
  }
}

export default {
  permissionDirective,
  hasPermissionDirective,
  buttonPermissionDirective
}
