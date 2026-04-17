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

        <div class="menu-section" v-if="systemMenu.length > 0">
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
          <el-button circle @click="toggleTheme" class="theme-toggle-btn">
            <el-icon v-if="isDark()"><Sunny /></el-icon>
            <el-icon v-else><Moon /></el-icon>
          </el-button>
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
  Message,
  Sunny,
  Moon
} from '@element-plus/icons-vue'
import { useTheme } from '@/composables/useTheme'
import storage from '@/utils/storage'
import { hasPagePermission, clearPermissions } from '@/utils/permission'
import api from '@/apis'

const route = useRoute()
const router = useRouter()
const isCollapsed = ref(false)

// 主题切换
const { theme, toggleTheme, isDark } = useTheme()

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
  background: var(--bg-page);
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: width 0.2s ease, box-shadow 0.2s ease;
  border-right: 1px solid var(--border-default);
}

.sidebar.is-collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  border-bottom: 1px solid var(--border-light);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.logo-icon svg {
  width: 20px;
  height: 20px;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  transition: opacity 0.2s ease;
  letter-spacing: -0.3px;
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
  margin-bottom: 20px;
}

.menu-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 0 12px;
  margin-bottom: 6px;
  white-space: nowrap;
  height: 18px;
  transition: opacity 0.2s ease;
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
  padding: 10px 12px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 2px;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-weight: 500;
  font-size: 14px;
}

.menu-item:hover {
  background: var(--purple-50);
  color: var(--primary);
}

.menu-item.is-active {
  background: var(--purple-50);
  color: var(--primary);
  font-weight: 600;
}

.menu-item .el-icon {
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

.menu-item .menu-text {
  font-size: 14px;
  transition: opacity 0.2s ease;
}

.sidebar.is-collapsed .menu-text {
  display: none;
}

.sidebar.is-collapsed .menu-item {
  justify-content: center;
  padding: 10px 8px;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-light);
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s ease;
}

.sidebar.is-collapsed .user-details {
  display: none;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.user-role {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.logout-btn {
  width: 100%;
  justify-content: center;
  gap: 6px;
  background: var(--purple-50) !important;
  border: 1px solid var(--purple-200) !important;
  color: var(--purple-600) !important;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.logout-btn:hover {
  background: var(--purple-100) !important;
  border-color: var(--purple-300) !important;
}

.sidebar.is-collapsed .logout-btn {
  padding: 8px;
}

.sidebar.is-collapsed .logout-btn span:not(.el-icon) {
  display: none;
}

/* 主内容区 */
.main-wrapper {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.2s ease;
}

.main-wrapper.sidebar-collapsed {
  margin-left: 64px;
}

/* 顶部栏 */
.topbar {
  height: 60px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-default);
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
  background: transparent !important;
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  border-radius: 8px !important;
}

.collapse-btn:hover {
  background: var(--purple-50) !important;
  border-color: var(--purple-300) !important;
  color: var(--primary) !important;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  font-size: 14px;
  color: var(--text-muted);
}

.breadcrumb-item.active {
  color: var(--text-primary);
  font-weight: 500;
}

.breadcrumb-separator {
  color: var(--border-default);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-actions .el-button {
  background: transparent !important;
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  border-radius: 8px !important;
}

.topbar-actions .el-button:hover {
  background: var(--purple-50) !important;
  border-color: var(--purple-300) !important;
  color: var(--primary) !important;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid var(--border-default);
  background: transparent;
}

.user-trigger:hover {
  background: var(--purple-50);
  border-color: var(--purple-200);
}

.user-avatar-small {
  width: 28px;
  height: 28px;
  background: var(--gradient-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
}

.user-name-small {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

/* 内容区 */
.main-content {
  flex: 1;
  padding: 24px;
}

/* 主题切换按钮 */
.theme-toggle-btn {
  background: transparent !important;
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  border-radius: 8px !important;
  transition: all 0.15s ease;
}

.theme-toggle-btn:hover {
  background: var(--purple-50) !important;
  border-color: var(--purple-300) !important;
  color: var(--primary) !important;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
