# 菜单权限自由配置重构计划

## 目标
实现后台菜单的完全自由配置，包括：
1. 三层权限树：根节点(后台管理) → 菜单类型(主菜单/系统菜单) → 页面/功能
2. 支持菜单顺序排序
3. 权限管理页面可配置页面类型和顺序

## 权限类型定义
- **ROOT** (根目录)：后台管理 - 系统根节点，不可删除
- **MENU** (菜单类型)：主菜单、系统菜单 - 不可删除
- **PAGE** (页面类型)：各种功能页面 - 可配置顺序
- **FUNCTION** (功能类型)：页面内的操作按钮 - 可配置顺序

## 数据库变更
```sql
ALTER TABLE admin_permission ADD COLUMN type VARCHAR(20) DEFAULT 'PAGE' COMMENT 'ROOT/MENU/PAGE/FUNCTION';
ALTER TABLE admin_permission ADD COLUMN order_num INT DEFAULT 0 COMMENT '排序号';
ALTER TABLE admin_permission ADD COLUMN icon VARCHAR(50) COMMENT '菜单图标';
ALTER TABLE admin_permission ADD COLUMN route_path VARCHAR(100) COMMENT '路由路径';
ALTER TABLE admin_permission ADD COLUMN is_deletable TINYINT(1) DEFAULT 1 COMMENT '是否可删除';
```

## Phase 1: 数据库重构
- [x] 修改 admin_permission 表结构
- [x] 备份并清空现有权限数据
- [x] 重新初始化权限数据（带类型和排序）

## Phase 2: 后端重构
- [x] 修改 Permission 实体类
- [x] 修改 PermissionRepository 查询支持排序
- [x] 修改 PermissionServiceImpl 排序逻辑
- [x] 修改 PermissionDTO 新增字段
- [x] 修改 AdminPermissionController 支持新字段
- [x] 修改 AdminAuthService 使用 type 判断页面/功能权限
- [x] 添加 /admin/auth/menus 接口

## Phase 3: 前端重构
- [x] 修改 PermissionList.vue 权限列表显示新字段
- [x] 修改 PermissionEdit.vue 支持新类型配置
- [x] 修改 AppLayout.vue 动态菜单加载

## Phase 4: 测试验证
- [ ] 验证权限树显示正确
- [ ] 验证角色权限配置正确回显
- [ ] 验证菜单顺序按 order_num 排序
- [ ] 验证动态菜单加载正确

## 错误记录
(待填充)
