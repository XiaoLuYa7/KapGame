# 背锅大作战管理后台 Vue 3 重构设计方案

## 概述

将管理后台从 Spring Boot + Thymeleaf + Bootstrap 5 的服务端渲染架构，重构为 Vue 3 SPA 前后端分离架构。

## 技术栈

| 技术 | 选择 | 说明 |
|------|------|------|
| 构建工具 | Vite 5 | 快速的开发服务器和构建工具 |
| 前端框架 | Vue 3.4+ | Composition API + `<script setup>` |
| UI 组件库 | Element Plus | Vue 3 企业级 UI 组件库 |
| 路由 | Vue Router 4 | SPA 路由管理 |
| HTTP 客户端 | Axios | API 请求封装 |
| 状态管理 | 轻量方案 | provide/inject + 组件内状态 |

## 项目结构

```
KapGame/
├── backend/                          # 现有 Spring Boot 项目
│   └── src/main/java/com/beiguo/
│       └── controller/admin/        # REST API（已实现）
├── frontend/                         # 新建 Vue 3 项目
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── api/                     # API 模块
│   │   │   ├── index.js             # Axios 实例配置
│   │   │   ├── auth.js             # 认证相关 API
│   │   │   ├── users.js            # 用户管理 API
│   │   │   ├── cards.js            # 卡牌管理 API
│   │   │   ├── activities.js       # 活动管理 API
│   │   │   ├── configs.js          # 系统配置 API
│   │   │   ├── adminUsers.js       # 管理员 API
│   │   │   ├── roles.js            # 角色 API
│   │   │   ├── permissions.js      # 权限 API
│   │   │   └── publish.js          # 发布管理 API
│   │   ├── components/             # 公共组件
│   │   │   ├── AppHeader.vue       # 顶部导航
│   │   │   ├── AppSidebar.vue      # 侧边栏
│   │   │   ├── TablePagination.vue # 表格分页
│   │   │   ├── SearchFilter.vue    # 搜索筛选
│   │   │   └── ConfirmDialog.vue   # 确认对话框
│   │   ├── views/                  # 页面视图
│   │   │   ├── Login.vue           # 登录页
│   │   │   ├── Dashboard.vue       # 仪表盘
│   │   │   ├── users/
│   │   │   │   ├── UserList.vue    # 用户列表
│   │   │   │   └── UserDetail.vue  # 用户详情
│   │   │   ├── cards/
│   │   │   │   ├── CardList.vue    # 卡牌列表
│   │   │   │   └── CardEdit.vue    # 卡牌编辑
│   │   │   ├── activities/
│   │   │   │   ├── ActivityList.vue
│   │   │   │   └── ActivityEdit.vue
│   │   │   ├── configs/
│   │   │   │   ├── ConfigList.vue
│   │   │   │   └── ConfigEdit.vue
│   │   │   ├── adminUsers/
│   │   │   │   ├── AdminUserList.vue
│   │   │   │   └── AdminUserEdit.vue
│   │   │   ├── roles/
│   │   │   │   ├── RoleList.vue
│   │   │   │   └── RoleEdit.vue
│   │   │   ├── permissions/
│   │   │   │   └── PermissionList.vue
│   │   │   └── publish/
│   │   │       └── PublishManage.vue
│   │   ├── router/
│   │   │   └── index.js            # 路由配置（含权限守卫）
│   │   ├── utils/
│   │   │   ├── storage.js          # localStorage 封装
│   │   │   └── format.js           # 日期/数字格式化
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.development
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-14-admin-vue3-refactor-design.md
```

## 页面功能清单

### 1. 登录页 (Login.vue)
- 用户名/密码表单
- JWT token 获取并存储
- 登录失败错误提示
- 默认提示：admin / admin123

### 2. 仪表盘 (Dashboard.vue)
- 统计数据卡片：用户总数、卡牌数、活动数、配置数
- 最新发布信息
- 快捷操作入口

### 3. 用户管理 (UserList.vue / UserDetail.vue)
- 分页列表（搜索、筛选）
- 查看用户详情（基本信息、游戏数据）
- 查看好友列表
- 增删钻石/金币
- 更新用户信息
- 删除用户（含关联数据校验）

### 4. 卡牌管理 (CardList.vue / CardEdit.vue)
- 分页列表（类型、稀有度筛选）
- 创建/编辑卡牌（名称、描述、费用、攻击力、生命值、效果）
- 删除卡牌（软删除）
- 发布卡牌

### 5. 活动管理 (ActivityList.vue / ActivityEdit.vue)
- 分页列表（类型、状态筛选）
- 创建/编辑活动（标题、描述、时间、奖励）
- 删除活动（软删除）
- 更新活动状态

### 6. 系统配置 (ConfigList.vue / ConfigEdit.vue)
- 分页列表（公开/内部配置筛选）
- 创建/编辑配置（键值对、描述）
- 删除配置

### 7. 管理员管理 (AdminUserList.vue / AdminUserEdit.vue)
- 分页列表（角色筛选）
- 创建/编辑管理员（用户名、密码、角色）
- 删除管理员
- 角色下拉选择

### 8. 角色管理 (RoleList.vue / RoleEdit.vue)
- 分页列表（关键字搜索）
- 创建/编辑角色（名称、描述、权限）
- 删除角色（系统角色不可删除）
- 权限树形选择

### 9. 权限管理 (PermissionList.vue)
- 分类查看权限
- 创建/编辑权限（代码、名称、分类）
- 删除权限（系统权限不可删除）

### 10. 发布管理 (PublishManage.vue)
- 发布配置
- 查看发布历史
- 查看最新发布统计

## API 规范

所有 API 通过 Axios 实例封装，基础配置：

```javascript
// src/api/index.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器：添加 JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401 跳转登录
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 路由配置

```javascript
// src/router/index.js
const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: Dashboard },
      { path: 'users', name: 'UserList', component: UserList },
      { path: 'users/:id', name: 'UserDetail', component: UserDetail },
      { path: 'cards', name: 'CardList', component: CardList },
      { path: 'cards/edit/:id?', name: 'CardEdit', component: CardEdit },
      // ... 其他路由
    ]
  }
];
```

## 环境配置

```env
# .env.development
VITE_API_BASE_URL=http://localhost:8080
```

## 后端 CORS 配置

在 Spring Boot 添加 CORS 配置类：

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

## 实施步骤

1. **创建前端项目**
   - 初始化 Vite + Vue 3 项目
   - 安装 Element Plus、Vue Router、Axios
   - 配置代理解决开发环境 API 请求

2. **配置 CORS**
   - 后端添加 CORS 配置类

3. **搭建基础架构**
   - API 封装（Axios 实例）
   - 路由配置
   - Layout 布局组件

4. **迁移登录页**
   - 登录表单
   - JWT 存储
   - 路由守卫

5. **迁移仪表盘**
   - 统计卡片
   - 最新发布信息

6. **迁移管理模块**（按优先级）
   - 用户管理
   - 卡牌管理
   - 活动管理
   - 系统配置
   - 管理员/角色/权限
   - 发布管理

7. **测试与完善**
   - 前后端联调
   - 错误处理
   - 响应式适配

## 兼容性说明

- 保留后端 Thymeleaf 模板（不影响现有功能）
- 新 Vue 3 前端完全独立，可并行开发
- 未来可通过 `/admin/view` 访问旧版，`/` 访问新版（路由分配）
