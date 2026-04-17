# KapGame Admin 前端美化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 KapGame Admin 前端改造为深色紫青霓虹游戏质感风格，覆盖全局样式、布局组件和所有业务页面。

**Architecture:** 以 `global.css` 为色彩系统核心，改造 `AppLayout.vue` 的侧边栏和顶栏视觉，逐一美化各业务页面卡片和表格，最终形成统一的深色霓虹美学。

**Tech Stack:** Vue 3 + Element Plus + 自定义 CSS 变量 + 玻璃拟态

---

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `admin-frontend/styles/global.css` | 重写 | 完整色彩系统和组件样式 |
| `admin-frontend/components/AppLayout.vue` | 样式调整 | 侧边栏、顶栏霓虹化 |
| `admin-frontend/views/Dashboard.vue` | 完整改造 | 统计卡片、布局霓虹风格 |
| `admin-frontend/views/Login.vue` | 细节优化 | 色彩微调 |
| `admin-frontend/views/roles/RoleList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/roles/RoleEdit.vue` | 样式调整 | 表单卡片化 |
| `admin-frontend/views/permissions/PermissionList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/permissions/PermissionEdit.vue` | 样式调整 | 表单卡片化 |
| `admin-frontend/views/users/UserList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/users/UserEdit.vue` | 样式调整 | 表单卡片化 |
| `admin-frontend/views/cards/CardList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/cards/CardEdit.vue` | 样式调整 | 表单卡片化 |
| `admin-frontend/views/activities/ActivityList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/activities/ActivityEdit.vue` | 样式调整 | 表单卡片化 |
| `admin-frontend/views/configs/ConfigList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/configs/ConfigEdit.vue` | 样式调整 | 表单卡片化 |
| `admin-frontend/views/mails/MailList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/mails/MailEdit.vue` | 样式调整 | 表单卡片化 |
| `admin-frontend/views/earnings/EarningsList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/adminUsers/AdminUserList.vue` | 样式调整 | 表格卡片化 |
| `admin-frontend/views/adminUsers/AdminUserEdit.vue` | 样式调整 | 表单卡片化 |
| `admin-frontend/views/publish/PublishManage.vue` | 样式调整 | 内容卡片化 |
| `admin-frontend/views/activities/ActivityManage.vue` | 样式调整 | 内容卡片化 |

---

## 阶段一：全局样式基础（P0）

### Task 1: 重写 global.css 全局样式

**文件:**
- 修改: `admin-frontend/styles/global.css`

- [ ] **Step 1: 备份并重写 global.css**

将原有 global.css 替换为以下完整内容：

```css
/* ===================================
   KapGame Admin - 深色紫青霓虹主题
   =================================== */

/* 1. CSS 变量 - 色彩系统 */
:root {
  /* 背景色系 */
  --bg-page: #0F0F1A;
  --bg-sidebar: #0A0A14;
  --bg-card: rgba(20, 20, 35, 0.85);
  --bg-card-hover: rgba(28, 28, 48, 0.9);
  --bg-input: rgba(15, 15, 26, 0.8);
  --bg-dropdown: rgba(24, 24, 40, 0.95);
  --bg-modal: rgba(10, 10, 20, 0.95);

  /* 霓虹光效色 */
  --neon-purple: #A855F7;
  --neon-purple-light: #C084FC;
  --neon-purple-dark: #7C3AED;
  --neon-cyan: #06B6D4;
  --neon-cyan-light: #22D3EE;
  --neon-pink: #EC4899;
  --neon-green: #10B981;
  --neon-orange: #F59E0B;
  --neon-red: #EF4444;

  /* 发光效果 */
  --glow-purple: rgba(168, 85, 247, 0.4);
  --glow-cyan: rgba(6, 182, 212, 0.3);
  --glow-green: rgba(16, 185, 129, 0.4);
  --glow-red: rgba(239, 68, 68, 0.4);

  /* 渐变 */
  --gradient-primary: linear-gradient(135deg, #A855F7 0%, #6366F1 100%);
  --gradient-cyan: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);
  --gradient-success: linear-gradient(135deg, #10B981 0%, #059669 100%);
  --gradient-danger: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  --gradient-warning: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);

  /* 文字色 */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-disabled: #475569;
  --text-link: #A78BFA;

  /* 边框 */
  --border-default: rgba(148, 163, 184, 0.1);
  --border-hover: rgba(148, 163, 184, 0.2);
  --border-neon: rgba(168, 85, 247, 0.4);

  /* Element Plus 覆盖 */
  --el-bg-color: var(--bg-card);
  --el-bg-color-overlay: var(--bg-dropdown);
  --el-text-color-primary: var(--text-primary);
  --el-text-color-regular: var(--text-secondary);
  --el-border-color: var(--border-default);
  --el-border-color-light: var(--border-default);
  --el-fill-color-blank: var(--bg-input);
  --el-color-primary: var(--neon-purple);
}

/* 2. 基础重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-page);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* 3. 页面容器 */
.page-container {
  padding: 0;
}

/* 页面标题区 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header-content h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}

.page-header-content p {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 4. 卡片样式 - 玻璃拟态 */
.el-card {
  --el-card-bg-color: var(--bg-card) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 16px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.02) !important;
  transition: all 0.3s ease;
  overflow: hidden;
}

.el-card:hover {
  border-color: var(--border-neon) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px var(--glow-purple) !important;
  transform: translateY(-2px);
}

.el-card__header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
  background: transparent;
}

.el-card__body {
  padding: 20px;
}

/* 5. 表格样式 */
.el-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(10, 10, 20, 0.6);
  --el-table-header-text-color: var(--text-secondary);
  --el-table-text-color: var(--text-secondary);
  --el-table-border-color: var(--border-default);
  --el-table-row-hover-bg-color: rgba(168, 85, 247, 0.08);
  --el-table-current-row-bg-color: rgba(168, 85, 247, 0.12);
  border-radius: 12px;
  overflow: hidden;
}

.el-table th.el-table__cell {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.el-table td.el-table__cell {
  border-bottom: 1px solid var(--border-default);
}

.el-table__row:hover > td.el-table__cell {
  background: rgba(168, 85, 247, 0.08) !important;
}

.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: rgba(255, 255, 255, 0.02);
}

/* 6. 按钮样式 */
.el-button {
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
}

.el-button:active {
  transform: scale(0.97);
}

.el-button--primary {
  background: var(--gradient-primary) !important;
  border: none !important;
  color: white;
  box-shadow: 0 4px 12px var(--glow-purple);
}

.el-button--primary:hover {
  box-shadow: 0 6px 20px var(--glow-purple);
  transform: translateY(-1px);
}

.el-button--success {
  background: var(--gradient-success) !important;
  border: none !important;
  color: white;
}

.el-button--warning {
  background: var(--gradient-warning) !important;
  border: none !important;
  color: white;
}

.el-button--danger {
  background: var(--gradient-danger) !important;
  border: none !important;
  color: white;
}

.el-button--default {
  background: rgba(148, 163, 184, 0.1) !important;
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
}

.el-button--default:hover {
  border-color: var(--neon-purple) !important;
  color: var(--neon-purple) !important;
  background: rgba(168, 85, 247, 0.1) !important;
}

/* 文字按钮 */
.el-button.is-text {
  background: transparent !important;
  color: var(--text-link) !important;
  padding: 4px 8px;
}

.el-button.is-text:hover {
  background: rgba(168, 85, 247, 0.12) !important;
  color: var(--neon-purple-light) !important;
}

.el-button--primary.is-text {
  color: var(--neon-purple) !important;
}

.el-button--success.is-text {
  color: var(--neon-green) !important;
}

.el-button--danger.is-text {
  color: var(--neon-red) !important;
}

.el-button--warning.is-text {
  color: var(--neon-orange) !important;
}

/* 7. 输入框样式 */
.el-input__wrapper {
  background: var(--bg-input) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  transition: all 0.2s ease;
}

.el-input__wrapper:hover {
  border-color: var(--border-hover) !important;
}

.el-input__wrapper.is-focus {
  border-color: var(--neon-purple) !important;
  box-shadow: 0 0 0 3px var(--glow-purple), 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

.el-input__inner {
  color: var(--text-primary) !important;
  font-size: 14px;
}

.el-input__inner::placeholder {
  color: var(--text-muted) !important;
}

/* 8. Select 样式 */
.el-select__wrapper {
  background: var(--bg-input) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
}

.el-select__wrapper:hover {
  border-color: var(--border-hover) !important;
}

.el-select__wrapper.is-focus {
  border-color: var(--neon-purple) !important;
  box-shadow: 0 0 0 3px var(--glow-purple) !important;
}

.el-select-dropdown {
  background: var(--bg-dropdown) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

.el-select-dropdown__item {
  color: var(--text-secondary);
  border-radius: 8px;
  margin: 4px 8px;
  padding: 8px 12px;
}

.el-select-dropdown__item:hover {
  background: rgba(168, 85, 247, 0.12) !important;
  color: var(--text-primary) !important;
}

.el-select-dropdown__item.is-selected {
  background: rgba(168, 85, 247, 0.2) !important;
  color: var(--neon-purple) !important;
  font-weight: 600;
}

/* 9. 表单样式 */
.el-form-item__label {
  font-weight: 500;
  color: var(--text-secondary) !important;
  font-size: 14px;
}

.el-form-item__label-wrap {
  font-weight: 500;
}

.el-form-item__error {
  color: var(--neon-red);
}

/* 10. 分页样式 */
.el-pagination {
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: var(--text-secondary);
  --el-pagination-button-disabled-bg-color: rgba(148, 163, 184, 0.1);
  justify-content: flex-end;
  margin-top: 24px;
}

.el-pagination button,
.el-pager li {
  border-radius: 8px;
  margin: 0 2px;
  background: rgba(148, 163, 184, 0.08) !important;
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
}

.el-pager li.is-active {
  background: var(--gradient-primary) !important;
  border-color: var(--neon-purple) !important;
  color: white !important;
}

/* 11. 标签样式 */
.el-tag {
  border-radius: 6px;
  font-weight: 500;
  border: none;
}

.el-tag--success {
  background: rgba(16, 185, 129, 0.15);
  color: #34D399;
}

.el-tag--warning {
  background: rgba(245, 158, 11, 0.15);
  color: #FBBF24;
}

.el-tag--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
}

.el-tag--info {
  background: rgba(168, 85, 247, 0.15);
  color: #C084FC;
}

/* 12. 对话框样式 */
.el-dialog {
  --el-dialog-bg-color: var(--bg-card) !important;
  border-radius: 20px !important;
  border: 1px solid var(--border-default);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
  overflow: hidden;
}

.el-dialog::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
}

.el-dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-default);
  margin: 0;
}

.el-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.el-dialog__body {
  padding: 24px;
  color: var(--text-secondary);
}

.el-dialog__footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-default);
}

/* 13. 消息提示 */
.el-message {
  border-radius: 12px;
  padding: 12px 20px;
  background: var(--bg-dropdown) !important;
  border: 1px solid var(--border-default) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

.el-message__content {
  color: var(--text-primary);
}

/* 14. 空状态 */
.el-empty {
  padding: 40px 0;
}

.el-empty__description {
  color: var(--text-muted);
  font-size: 14px;
}

/* 15. 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-bar .el-input {
  width: 280px;
}

.search-bar .el-select {
  width: 160px;
}

/* 16. 操作按钮组 */
.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: nowrap;
}

.action-buttons .el-button {
  padding: 4px 6px;
  min-width: auto;
}

/* 17. 页面过渡动画 */
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

/* 18. 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}

/* 19. 下拉菜单 */
.el-dropdown-menu {
  background: var(--bg-dropdown) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 12px !important;
  padding: 8px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

.el-dropdown-menu__item {
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.el-dropdown-menu__item:hover {
  background: rgba(168, 85, 247, 0.12) !important;
  color: var(--text-primary) !important;
}

/* 20. 工具提示 */
.el-popper {
  background: var(--bg-dropdown) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
}

.el-popper .el-popper__arrow::before {
  background: var(--bg-dropdown) !important;
  border-color: var(--border-default) !important;
}

/* 21. 加载状态 */
.el-loading-mask {
  border-radius: 16px;
  background: rgba(15, 15, 26, 0.8) !important;
}

.el-loading-spinner .el-loading-text {
  color: var(--text-secondary);
}

/* 22. 弹出确认框 */
.el-message-box {
  --el-messagebox-title-color: var(--text-primary);
  --el-messagebox-content-color: var(--text-secondary);
  background: var(--bg-card) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 16px !important;
}

.el-message-box__title {
  color: var(--text-primary);
}

/* 23. 辅助类 - 霓虹发光文字 */
.text-neon {
  color: var(--neon-purple);
  text-shadow: 0 0 10px var(--glow-purple);
}

/* 24. 辅助类 - 渐变背景块 */
.bg-gradient-primary {
  background: var(--gradient-primary);
}
```

---

### Task 2: 改造 AppLayout.vue 侧边栏和顶栏

**文件:**
- 修改: `admin-frontend/components/AppLayout.vue`

**改动说明**: 替换 `<style scoped>` 部分，保持 template 和 script 不变。

- [ ] **Step 1: 替换 AppLayout.vue 的 style scoped 部分**

将原有的 `<style scoped>` 部分替换为：

```css
<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page);
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: width 0.3s ease;
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
  border-bottom: 1px solid var(--border-default);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 38px;
  height: 38px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 16px var(--glow-purple);
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  transition: opacity 0.3s ease;
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
  margin-bottom: 24px;
}

.menu-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
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
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 10px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  border: 1px solid transparent;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 60%;
  background: var(--neon-purple);
  border-radius: 0 2px 2px 0;
  transition: transform 0.15s ease;
  box-shadow: 0 0 8px var(--glow-purple);
}

.menu-item:hover {
  background: rgba(168, 85, 247, 0.08);
  color: var(--text-primary);
}

.menu-item:hover::before {
  transform: translateY(-50%) scaleY(1);
}

.menu-item.is-active {
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%);
  color: var(--neon-purple-light);
  border-color: rgba(168, 85, 247, 0.2);
}

.menu-item.is-active::before {
  transform: translateY(-50%) scaleY(1);
  background: var(--neon-purple);
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
  border-top: 1px solid var(--border-default);
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
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--glow-purple);
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
  color: var(--text-primary);
  text-align: center;
}

.user-role {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.logout-btn {
  width: 100%;
  justify-content: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1) !important;
  border: 1px solid rgba(239, 68, 68, 0.2) !important;
  color: #F87171 !important;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
  color: #FCA5A5 !important;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.2);
}

.sidebar.is-collapsed .logout-btn {
  padding: 10px;
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
  transition: margin-left 0.3s ease;
}

.main-wrapper.sidebar-collapsed {
  margin-left: 64px;
}

/* 顶部栏 */
.topbar {
  height: 64px;
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--neon-cyan), transparent);
  opacity: 0.3;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  background: rgba(148, 163, 184, 0.1) !important;
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  border-radius: 10px !important;
}

.collapse-btn:hover {
  background: rgba(6, 182, 212, 0.1) !important;
  border-color: var(--neon-cyan) !important;
  color: var(--neon-cyan) !important;
  box-shadow: 0 0 12px var(--glow-cyan);
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
  color: var(--text-muted);
  opacity: 0.5;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-actions .el-button {
  background: rgba(148, 163, 184, 0.1) !important;
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  border-radius: 10px !important;
}

.topbar-actions .el-button:hover {
  background: rgba(148, 163, 184, 0.15) !important;
  border-color: var(--border-hover) !important;
  color: var(--text-primary) !important;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-default);
  background: rgba(148, 163, 184, 0.05);
}

.user-trigger:hover {
  background: rgba(168, 85, 247, 0.08);
  border-color: var(--border-neon);
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  background: var(--gradient-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px var(--glow-purple);
}

.user-name-small {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
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
```

---

### Task 3: 改造 Dashboard.vue

**文件:**
- 修改: `admin-frontend/views/Dashboard.vue`

**改动说明**: 保留 template 和 script，只重写 `<style scoped>` 部分为深色霓虹主题。

- [ ] **Step 1: 替换 Dashboard.vue 的 style scoped 部分**

```css
<style scoped>
.dashboard {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.page-title p {
  margin: 0;
  font-size: 15px;
  color: var(--text-secondary);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 4px 0 0 4px;
  transition: box-shadow 0.3s ease;
}

.stat-card.blue::before { background: var(--neon-purple); box-shadow: 0 0 12px var(--glow-purple); }
.stat-card.purple::before { background: var(--neon-pink); box-shadow: 0 0 12px rgba(236, 72, 153, 0.4); }
.stat-card.orange::before { background: var(--neon-orange); box-shadow: 0 0 12px rgba(245, 158, 11, 0.4); }
.stat-card.green::before { background: var(--neon-green); box-shadow: 0 0 12px var(--glow-green); }

.stat-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-neon);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 20px var(--glow-purple);
}

.stat-card:hover::before {
  box-shadow: 0 0 20px var(--glow-purple);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.stat-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  opacity: 0.15;
}

.stat-card.blue .stat-icon { background: rgba(168, 85, 247, 0.15); color: var(--neon-purple); }
.stat-card.purple .stat-icon { background: rgba(236, 72, 153, 0.15); color: var(--neon-pink); }
.stat-card.orange .stat-icon { background: rgba(245, 158, 11, 0.15); color: var(--neon-orange); }
.stat-card.green .stat-icon { background: rgba(16, 185, 129, 0.15); color: var(--neon-green); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -1px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 6px;
}

/* 三列卡片网格 */
.three-col-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* 卡片通用 */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  border-color: var(--border-neon);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px var(--glow-purple);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}

.card-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 .el-icon {
  color: var(--neon-purple);
}

.card-body {
  padding: 16px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 最新发布 */
.publish-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.version-badge {
  background: var(--gradient-primary);
  color: white;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px var(--glow-purple);
}

.publish-time {
  font-size: 12px;
  color: var(--text-muted);
}

.publish-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.publish-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.publish-stat .el-icon {
  color: var(--text-muted);
}

.publisher {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: auto;
}

/* 昨日收益 */
.earnings-date {
  font-size: 12px;
  color: var(--text-muted);
}

.earnings-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.earnings-total-card {
  background: var(--gradient-primary);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 4px 16px var(--glow-purple);
}

.earnings-total-label {
  font-size: 13px;
  opacity: 0.9;
}

.earnings-total-value {
  font-size: 20px;
  font-weight: 700;
}

.earnings-types {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.earnings-type-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(148, 163, 184, 0.05);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.earnings-type-item:hover {
  background: rgba(168, 85, 247, 0.08);
  border-color: var(--border-neon);
  transform: translateX(4px);
}

.earnings-type-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
}

.earnings-type-icon.skin { background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%); }
.earnings-type-icon.ad { background: var(--gradient-warning); }
.earnings-type-icon.sponsor { background: var(--gradient-success); }
.earnings-type-icon.traffic { background: var(--gradient-primary); }

.earnings-type-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.earnings-type-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.earnings-type-count {
  font-size: 11px;
  color: var(--text-muted);
}

.earnings-type-amount {
  font-size: 13px;
  font-weight: 600;
  color: #34D399;
}

/* 快捷操作 */
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(148, 163, 184, 0.05);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-item:hover {
  background: rgba(168, 85, 247, 0.08);
  border-color: var(--border-neon);
  transform: translateX(4px);
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.action-icon.create { background: var(--gradient-primary); box-shadow: 0 4px 12px var(--glow-purple); }
.action-icon.activity { background: var(--gradient-warning); }
.action-icon.config { background: var(--gradient-success); }
.action-icon.earnings { background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%); }
.action-icon.users { background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%); }

.action-item span {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

/* 系统状态 */
.system-status .card-header {
  border-bottom: none;
  padding-bottom: 0;
}

.system-status .card-body {
  padding-top: 0;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(148, 163, 184, 0.05);
  border: 1px solid var(--border-default);
  border-radius: 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: var(--neon-green);
  box-shadow: 0 0 8px var(--glow-green);
}

.status-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .three-col-grid { grid-template-columns: 1fr 1fr; }
  .quick-card { grid-column: span 2; }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .three-col-grid { grid-template-columns: 1fr; }
  .quick-card { grid-column: span 1; }
  .publish-stats { flex-direction: column; gap: 8px; }
}
</style>
```

---

### Task 4: 优化 Login.vue 色彩

**文件:**
- 修改: `admin-frontend/views/Login.vue`

**改动说明**: 将背景渐变改为深色紫青系，调整卡片边框效果。

- [ ] **Step 1: 替换 Login.vue 的 style 部分**

```css
<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0F0F1A 0%, #1a0a2e 50%, #0F0F1A 100%);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: #7C3AED;
  top: -200px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: #06B6D4;
  bottom: -150px;
  left: -100px;
  animation: float 10s ease-in-out infinite reverse;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: #A855F7;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(5deg); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.35; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.25; }
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  background: rgba(20, 20, 35, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 36px 32px;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow:
    0 20px 40px -12px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(168, 85, 247, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--gradient-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 20px var(--glow-purple);
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.logo-text h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.logo-text p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.login-form {
  margin-top: 8px;
}

.input-group {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  z-index: 1;
  pointer-events: none;
}

.input-icon svg {
  width: 100%;
  height: 100%;
}

.login-form :deep(.el-input__wrapper) {
  padding: 6px 14px 6px 42px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.2);
  transition: all 0.3s ease;
  background: rgba(15, 15, 26, 0.8);
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.4);
  background: rgba(20, 20, 35, 0.9);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.6), 0 0 20px var(--glow-purple);
  background: rgba(20, 20, 35, 0.9);
}

.login-form :deep(.el-input__inner) {
  height: 38px;
  font-size: 14px;
  color: var(--text-primary);
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--text-muted);
}

.login-btn {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  background: var(--gradient-primary) !important;
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px var(--glow-purple);
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px var(--glow-purple);
}

.login-btn:active {
  transform: translateY(0) scale(0.98);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-footer p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.login-footer span {
  color: var(--neon-purple-light);
  font-weight: 500;
}
</style>
```

---

## 阶段二：列表页面美化（P1）

### Task 5: 美化角色管理列表页

**文件:**
- 修改: `admin-frontend/views/roles/RoleList.vue`

- [ ] **Step 1: 读取 RoleList.vue 完整内容**

Run: Read the full file to understand current structure

- [ ] **Step 2: 在 `<style scoped>` 中添加统一卡片和表格样式**

在 RoleList.vue 的 `<style scoped>` 末尾添加以下样式（如果文件没有 scoped 样式则创建）：

```css
<style scoped>
/* 页面标题区 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title h1 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-title p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-bar .el-input {
  width: 260px;
}

/* 操作按钮 */
.header-actions {
  display: flex;
  gap: 8px;
}
</style>
```

---

### Task 6-13: 美化其他列表页面

对以下每个文件执行类似 Task 5 的样式调整（统一页面结构和搜索栏样式）：

- [ ] Task 6: `admin-frontend/views/permissions/PermissionList.vue`
- [ ] Task 7: `admin-frontend/views/users/UserList.vue`
- [ ] Task 8: `admin-frontend/views/cards/CardList.vue`
- [ ] Task 9: `admin-frontend/views/activities/ActivityList.vue`
- [ ] Task 10: `admin-frontend/views/configs/ConfigList.vue`
- [ ] Task 11: `admin-frontend/views/mails/MailList.vue`
- [ ] Task 12: `admin-frontend/views/earnings/EarningsList.vue`
- [ ] Task 13: `admin-frontend/views/adminUsers/AdminUserList.vue`

每个文件添加统一的 `<style scoped>` 样式：
```css
<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.page-title h1 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}
.page-title p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.search-bar .el-input {
  width: 260px;
}
.header-actions {
  display: flex;
  gap: 8px;
}
</style>
```

---

## 阶段三：编辑页面美化（P1）

### Task 14-22: 美化编辑页面

对以下每个文件添加统一表单样式：

- [ ] Task 14: `admin-frontend/views/roles/RoleEdit.vue`
- [ ] Task 15: `admin-frontend/views/permissions/PermissionEdit.vue`
- [ ] Task 16: `admin-frontend/views/users/UserEdit.vue`
- [ ] Task 17: `admin-frontend/views/cards/CardEdit.vue`
- [ ] Task 18: `admin-frontend/views/activities/ActivityEdit.vue`
- [ ] Task 19: `admin-frontend/views/configs/ConfigEdit.vue`
- [ ] Task 20: `admin-frontend/views/mails/MailEdit.vue`
- [ ] Task 21: `admin-frontend/views/adminUsers/AdminUserEdit.vue`

每个文件添加：
```css
<style scoped>
/* 编辑页面通用样式 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-default);
}
</style>
```

---

## 阶段四：其他页面美化（P2）

### Task 23-24: 内容页面

- [ ] Task 23: `admin-frontend/views/publish/PublishManage.vue`
- [ ] Task 24: `admin-frontend/views/activities/ActivityManage.vue`

---

## 实施检查清单

完成所有 Task 后，验证以下内容：

- [ ] 登录页背景光球颜色已调整为紫青系
- [ ] 登录页卡片有霓虹紫色边框
- [ ] 全局页面背景为深紫黑色 `#0F0F1A`
- [ ] 侧边栏为更深紫黑色 `#0A0A14`
- [ ] 侧边栏菜单项悬停有左侧霓虹条
- [ ] 侧边栏活跃菜单有发光背景
- [ ] 顶部栏有毛玻璃效果 + 底部青色霓虹线
- [ ] Dashboard 统计卡片有霓虹边框和发光
- [ ] 所有 el-card 组件有玻璃拟态效果
- [ ] 所有按钮有统一圆角和渐变
- [ ] 输入框有深色背景和聚焦霓虹边框
- [ ] 全局滚动条颜色为半透明灰
- [ ] 没有白色/浅色背景页面
- [ ] 文字颜色与背景对比清晰可读
