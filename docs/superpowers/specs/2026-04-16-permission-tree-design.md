# 角色权限树形选择器设计方案

> **Goal:** 将角色编辑页面的权限下拉框（flat list）改为树形结构，支持父子联动勾选，后期可根据权限树加载页面菜单和按钮。

## 1. 数据库变更

**表 `admin_permission` 变更：**
- 新增 `parent_id` BIGINT 可为空，指向父权限 ID
- 删除 `category` 字段（层级关系统一用 `parent_id`）

```sql
ALTER TABLE admin_permission ADD COLUMN parent_id BIGINT;
UPDATE admin_permission SET parent_id = NULL;
ALTER TABLE admin_permission DROP COLUMN category;
```

## 2. 权限树结构

```
后台管理 (ROOT)
├── 用户管理
│   ├── 查看用户
│   ├── 创建用户
│   ├── 编辑用户
│   ├── 删除用户
│   └── 用户状态管理
├── 游戏管理
│   ├── 查看游戏
│   ├── 管理游戏
│   └── 游戏统计
├── 卡牌管理
│   ├── 查看卡牌
│   ├── 创建卡牌
│   ├── 编辑卡牌
│   └── 删除卡牌
├── 活动管理
│   ├── 查看活动
│   ├── 创建活动
│   ├── 编辑活动
│   └── 删除活动
├── 系统管理
│   ├── 仪表板
│   ├── 系统设置
│   └── 日志管理
├── 配置管理
│   ├── 查看配置
│   └── 编辑配置
└── 发布管理
    ├── 查看发布
    ├── 创建发布
    └── 发布管理
```

**注意：**
- ROOT 节点为 `id=1` 的数据库记录，`code=ROOT`
- 每个模块父节点（如"用户管理"）为独立记录，`code=MODULE:USER`，非叶子节点
- 所有增删改查都是叶子节点，有实际 `code` 值

## 3. 后端接口

### 3.1 获取权限树
```
GET /admin/permissions/tree
Response: List<PermissionTreeNode>
```
返回字段：
```json
{
  "id": 1,
  "code": "ROOT",
  "name": "后台管理",
  "parentId": null,
  "children": [
    {
      "id": 2,
      "code": "USER:MANAGE",
      "name": "用户管理",
      "parentId": 1,
      "children": [...]
    }
  ]
}
```

### 3.2 角色保存
```
POST /admin/roles
PUT /admin/roles/{id}
Body: {
  "name": "角色名",
  "description": "描述",
  "status": "ACTIVE",
  "permissionTree": { /* 整棵树结构，包含所有勾选状态 */ }
}
```

保存时后端从 `permissionTree` 中提取所有被勾选的叶子节点 `id`，写入 `admin_role_permission` 关联表。

## 4. 前端交互

### 4.1 组件
- 使用 `el-tree`（`show-checkbox`、`default-expand-all`）
- `check-strictly: false`（父子联动）

### 4.2 勾选联动逻辑
- **勾选父节点** → `el-tree` 自带父子联动，无需手动处理
- 提交时：遍历树，收集所有被勾选的叶子节点 ID，构造 `checkedPermissionIds: []` 提交

### 4.3 权限树数据返回
后端 `GET /admin/permissions/tree` 返回已勾选状态（角色编辑时），前端直接用于 `el-tree` 的 `defaultCheckedKeys`。

## 5. 后端实现

### 5.1 Entity
```java
@Entity
public class Permission {
    Long id;
    String code;        // 权限码，如 USER:VIEW
    String name;        // 权限名
    String description;
    Long parentId;      // 父权限ID，null表示根
    Boolean isSystem;
    LocalDateTime createTime;
    LocalDateTime updateTime;
    String createdBy;
    String updatedBy;
}
```

### 5.2 DTO
```java
@Data
public class PermissionTreeNode {
    Long id;
    String code;
    String name;
    Long parentId;
    List<PermissionTreeNode> children;
    boolean checked; // 供角色编辑时标记是否已勾选
}
```

### 5.3 Repository
新增方法：
- `Optional<Permission> findByCode(String code)` — 按 code 查询
- `List<Permission> findByParentIdIsNull()` — 查询根节点
- `List<Permission> findByParentId(Long parentId)` — 查询子节点

### 5.4 Service
- `List<PermissionTreeNode> buildPermissionTree()` — 递归构建树
- `List<PermissionTreeNode> buildPermissionTreeWithRole(Long roleId)` — 构建树并标记角色已有权限

### 5.5 Controller
- `GET /admin/permissions/tree` — 树形列表（角色创建时用，不带 checked）
- `GET /admin/roles/{id}/permissions/tree` — 树形列表（含角色已勾选状态，角色编辑时用）

## 6. DataInitializer 初始化数据变更

原 `category` 字段删除，改为通过 `parent_id` 建立父子关系。

初始化顺序：
1. 创建 ROOT 节点（id=1）
2. 创建各模块父节点（设置 parentId=1）
3. 创建各具体权限（设置对应 parentId）

## 7. 工作量评估

**后端（4个文件）：**
- `Permission.java` — entity 改 `category` → `parentId`
- `PermissionRepository.java` — 新增查询方法
- `PermissionService.java` + `PermissionServiceImpl.java` — 新增树构建方法
- `AdminPermissionController.java` — 新增 `/tree` 接口
- `AdminRoleController.java` — 修改创建/更新角色接口，接收完整权限树
- `DataInitializer.java` — 调整初始化数据，建立父子关系

**前端（1个文件）：**
- `RoleEdit.vue` — `el-select` → `el-tree`，添加联动逻辑，提交完整树结构

**数据库：**
- 执行 `ALTER TABLE` 添加 `parent_id`，删除 `category`
