import { createRouter, createWebHistory } from 'vue-router'
import storage from '@/utils/storage'
import { hasPagePermission, getPageCodeFromRoute } from '@/utils/permission'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { permissionCode: null } // Dashboard 始终可见
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/users/UserList.vue'),
        meta: { permissionCode: 'MODULE:USER' }
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('@/views/users/UserDetail.vue'),
        meta: { permissionCode: 'MODULE:USER' }
      },
      {
        path: 'users/:id/edit',
        name: 'UserEdit',
        component: () => import('@/views/users/UserEdit.vue'),
        meta: { permissionCode: 'MODULE:USER' }
      },
      {
        path: 'cards',
        name: 'CardList',
        component: () => import('@/views/cards/CardList.vue'),
        meta: { permissionCode: 'MODULE:CARD' }
      },
      {
        path: 'cards/:id/edit',
        name: 'CardEdit',
        component: () => import('@/views/cards/CardEdit.vue'),
        meta: { permissionCode: 'MODULE:CARD' }
      },
      {
        path: 'activities',
        name: 'ActivityList',
        component: () => import('@/views/activities/ActivityList.vue'),
        meta: { permissionCode: 'MODULE:ACTIVITY' }
      },
      {
        path: 'activities/edit',
        name: 'ActivityCreate',
        component: () => import('@/views/activities/ActivityEdit.vue'),
        meta: { permissionCode: 'MODULE:ACTIVITY' }
      },
      {
        path: 'activities/:id/edit',
        name: 'ActivityEdit',
        component: () => import('@/views/activities/ActivityEdit.vue'),
        meta: { permissionCode: 'MODULE:ACTIVITY' }
      },
      {
        path: 'configs',
        name: 'ConfigList',
        component: () => import('@/views/configs/ConfigList.vue'),
        meta: { permissionCode: 'MODULE:CONFIG' }
      },
      {
        path: 'configs/:id/edit',
        name: 'ConfigEdit',
        component: () => import('@/views/configs/ConfigEdit.vue'),
        meta: { permissionCode: 'MODULE:CONFIG' }
      },
      {
        path: 'configs/edit',
        name: 'ConfigCreate',
        component: () => import('@/views/configs/ConfigEdit.vue'),
        meta: { permissionCode: 'MODULE:CONFIG' }
      },
      {
        path: 'admin-users',
        name: 'AdminUserList',
        component: () => import('@/views/adminUsers/AdminUserList.vue'),
        meta: { permissionCode: 'MODULE:ADMIN_USER' }
      },
      {
        path: 'admin-users/add',
        name: 'AdminUserCreate',
        component: () => import('@/views/adminUsers/AdminUserEdit.vue'),
        meta: { permissionCode: 'MODULE:ADMIN_USER' }
      },
      {
        path: 'admin-users/:id/edit',
        name: 'AdminUserEdit',
        component: () => import('@/views/adminUsers/AdminUserEdit.vue'),
        meta: { permissionCode: 'MODULE:ADMIN_USER' }
      },
      {
        path: 'roles',
        name: 'RoleList',
        component: () => import('@/views/roles/RoleList.vue'),
        meta: { permissionCode: 'MODULE:ROLE' }
      },
      {
        path: 'roles/add',
        name: 'RoleCreate',
        component: () => import('@/views/roles/RoleEdit.vue'),
        meta: { permissionCode: 'MODULE:ROLE' }
      },
      {
        path: 'roles/:id/edit',
        name: 'RoleEdit',
        component: () => import('@/views/roles/RoleEdit.vue'),
        meta: { permissionCode: 'MODULE:ROLE' }
      },
      {
        path: 'permissions',
        name: 'PermissionList',
        component: () => import('@/views/permissions/PermissionList.vue'),
        meta: { permissionCode: 'MODULE:PERMISSION' }
      },
      {
        path: 'permissions/add',
        name: 'PermissionCreate',
        component: () => import('@/views/permissions/PermissionEdit.vue'),
        meta: { permissionCode: 'MODULE:PERMISSION' }
      },
      {
        path: 'permissions/:id/edit',
        name: 'PermissionEdit',
        component: () => import('@/views/permissions/PermissionEdit.vue'),
        meta: { permissionCode: 'MODULE:PERMISSION' }
      },
      {
        path: 'earnings',
        name: 'EarningsList',
        component: () => import('@/views/earnings/EarningsList.vue'),
        meta: { permissionCode: 'MODULE:EARNINGS' }
      },
      {
        path: 'publish',
        name: 'PublishManage',
        component: () => import('@/views/publish/PublishManage.vue'),
        meta: { permissionCode: 'MODULE:PUBLISH' }
      },
      {
        path: 'mails',
        name: 'MailList',
        component: () => import('@/views/mails/MailList.vue'),
        meta: { permissionCode: 'MODULE:MAIL' }
      },
      {
        path: 'mails/add',
        name: 'MailCreate',
        component: () => import('@/views/mails/MailEdit.vue'),
        meta: { permissionCode: 'MODULE:MAIL' }
      },
      {
        path: 'mails/:id/edit',
        name: 'MailEdit',
        component: () => import('@/views/mails/MailEdit.vue'),
        meta: { permissionCode: 'MODULE:MAIL' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 公开路由直接放行（不需要登录的页面）
  if (to.meta.public) {
    next()
    return
  }

  // 其他路由需要登录验证
  try {
    const token = storage.getToken()
    if (!token) {
      console.log('未找到token，跳转登录页')
      next('/login')
      return
    }
  } catch (e) {
    console.error('获取token失败:', e)
    next('/login')
    return
  }

  // 检查页面权限
  const permissionCode = to.meta.permissionCode
  if (permissionCode && !hasPagePermission(permissionCode)) {
    console.log('没有页面权限:', permissionCode)
    // 可以跳转到无权限页面或显示提示
    next({ name: 'Dashboard' }) // 没有权限时跳转到仪表盘
    return
  }

  next()
})

export default router
