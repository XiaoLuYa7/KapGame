<template>
  <div class="layout-wrapper">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">KapGame</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <div class="menu-section">
          <span class="menu-label">主菜单</span>
          <router-link
            v-for="item in mainMenu"
            :key="item.path"
            :to="item.path"
            class="menu-item"
            :class="{ 'is-active': isActive(item.path) }"
          >
            <el-icon :size="20"><component :is="getIcon(item.icon)" /></el-icon>
            <span class="menu-text">{{ item.name }}</span>
          </router-link>
        </div>

        <div class="menu-section">
          <span class="menu-label">系统</span>
          <router-link
            v-for="item in systemMenu"
            :key="item.path"
            :to="item.path"
            class="menu-item"
            :class="{ 'is-active': isActive(item.path) }"
          >
            <el-icon :size="20"><component :is="getIcon(item.icon)" /></el-icon>
            <span class="menu-text">{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <span>{{ userInitial }}</span>
          </div>
          <div class="user-details">
            <span class="user-name">{{ username }}</span>
            <span class="user-role">管理员</span>
          </div>
        </div>
        <el-button @click="handleLogout" class="logout-btn">
          <el-icon><SwitchButton /></el-icon>
          <span v-if="!isCollapsed">退出登录</span>
          <span v-else class="logout-icon-only"><SwitchButton /></span>
        </el-button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-wrapper" :class="{ 'sidebar-collapsed': isCollapsed }">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <el-button class="collapse-btn" @click="toggleSidebar" circle>
            <el-icon :size="18">
              <Fold v-if="!isCollapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <div class="breadcrumb">
            <span class="breadcrumb-item">首页</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">{{ currentPageName }}</span>
          </div>
        </div>
        <div class="topbar-actions">
          <el-button circle>
            <el-icon><Bell /></el-icon>
          </el-button>
          <el-dropdown trigger="click">
            <div class="user-trigger">
              <div class="user-avatar-small">
                <span>{{ userInitial }}</span>
              </div>
              <span class="user-name-small">{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Fold,
  Expand,
  SwitchButton,
  Bell,
  ArrowDown,
  HomeFilled,
  User,
  Postcard,
  Calendar,
  Setting,
  UserFilled,
  Key,
  Lock,
  Promotion,
  Money,
  Message
} from '@element-plus/icons-vue'
import storage from '@/utils/storage'
import { hasPagePermission, clearPermissions } from '@/utils/permission'
import api from '@/apis'

const route = useRoute()
const router = useRouter()
const isCollapsed = ref(false)

const username = ref('')
const userInitial = computed(() => {
  return username.value ? username.value.charAt(0).toUpperCase() : 'A'
})

// 动态菜单数据
const dynamicMainMenus = ref([])
const dynamicSystemMenus = ref([])

// 图标映射
const iconMap = {
  'User': User,
  'Postcard': Postcard,
  'Calendar': Calendar,
  'Money': Money,
  'Promotion': Promotion,
  'Message': Message,
  'UserFilled': UserFilled,
  'Key': Key,
  'Lock': Lock,
  'Setting': Setting
}

// 获取动态菜单
const loadMenus = async () => {
  try {
    const res = await api.get('/admin/auth/menus')
    if (res.data) {
      dynamicMainMenus.value = res.data.mainMenus || []
      dynamicSystemMenus.value = res.data.systemMenus || []
    }
  } catch (error) {
    console.error('获取菜单失败', error)
  }
}

// Dashboard始终可见
const mainMenu = computed(() => {
  return [{ path: '/dashboard', name: '仪表盘', icon: HomeFilled, code: null }, ...dynamicMainMenus.value]
})

const systemMenu = computed(() => {
  return [...dynamicSystemMenus.value]
})

// 获取图标组件
const getIcon = (iconName) => {
  return iconMap[iconName] || Setting
}

const currentPageName = computed(() => {
  const path = route.path
  const menu = [...mainMenu.value, ...systemMenu.value]
  const item = menu.find(m => m.path === path || path.startsWith(m.path + '/'))
  return item ? item.name : '仪表盘'
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    storage.removeToken()
    storage.remove('admin_user')
    clearPermissions()
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

onMounted(async () => {
  const user = storage.getUser()
  username.value = user?.username || 'Admin'
  await loadMenus()
})
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  background: #F8FAFC;
}

/* 侧边栏 */
.sidebar {
  width: 208px;
  background: #1E293B;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: width 0.3s ease;
}

.sidebar.is-collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #F8FAFC;
  white-space: nowrap;
  transition: opacity 0.3s ease;
}

.sidebar.is-collapsed .logo-text {
  display: none;
}

/* 菜单 */
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
}

.menu-section {
  margin-bottom: 24px;
}

.menu-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 12px;
  margin-bottom: 8px;
  white-space: nowrap;
  height: 20px;
  transition: opacity 0.3s ease;
}

.sidebar.is-collapsed .menu-label {
  opacity: 0;
  height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: #94A3B8;
  text-decoration: none;
  border-radius: 10px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #F8FAFC;
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  color: #A78BFA;
}

.menu-item .el-icon {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.menu-item .menu-text {
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.3s ease;
}

.sidebar.is-collapsed .menu-text {
  display: none;
}

.sidebar.is-collapsed .menu-item {
  justify-content: center;
  padding: 12px 8px;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  transition: opacity 0.3s ease;
}

.sidebar.is-collapsed .user-details {
  display: none;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #F8FAFC;
  text-align: center;
}

.user-role {
  font-size: 12px;
  color: #64748B;
  text-align: center;
}

.logout-btn {
  width: 100%;
  justify-content: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #F87171;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
  color: #FCA5A5;
}

.sidebar.is-collapsed .logout-btn {
  padding: 10px;
}

.sidebar.is-collapsed .logout-btn span:not(.el-icon) {
  display: none;
}

.logout-icon-only {
  display: none;
}

.sidebar.is-collapsed .logout-icon-only {
  display: inline;
}

/* 主内容区 */
.main-wrapper {
  flex: 1;
  margin-left: 208px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

.main-wrapper.sidebar-collapsed {
  margin-left: 64px;
}

/* 顶部栏 */
.topbar {
  height: 64px;
  background: white;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  background: #F1F5F9 !important;
  border: none !important;
  color: #64748B !important;
}

.collapse-btn:hover {
  background: #E2E8F0 !important;
  color: #1E293B !important;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  font-size: 14px;
  color: #64748B;
}

.breadcrumb-item.active {
  color: #1E293B;
  font-weight: 500;
}

.breadcrumb-separator {
  color: #CBD5E1;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-actions .el-button {
  background: #F1F5F9;
  border: none;
  color: #64748B;
}

.topbar-actions .el-button:hover {
  background: #E2E8F0;
  color: #1E293B;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.user-trigger:hover {
  background: #F1F5F9;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.user-name-small {
  font-size: 14px;
  font-weight: 500;
  color: #1E293B;
}

/* 内容区 */
.main-content {
  flex: 1;
  padding: 24px;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
