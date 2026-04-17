# 角色权限树形选择器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将角色编辑页面的权限选择从 flat list 改为树形结构，支持父子联动勾选，后端提供整棵树结构接口。

**Architecture:** 后端新增 `PermissionTreeNode` DTO，递归构建权限树；前端用 `el-tree` 替代 `el-select`，提交时提取完整树结构。

**Tech Stack:** Spring Boot (Java 17), Vue 3, Element Plus el-tree, JPA

---

## 文件变更总览

| 文件 | 操作 |
|------|------|
| `admin_permission` 表 | SQL: 添加 `parent_id`，删除 `category` |
| `dto/admin/PermissionTreeNode.java` | 新建 |
| `entity/Permission.java` | 修改: `category` → `parentId` |
| `repository/PermissionRepository.java` | 修改: 删 category 方法，加 parentId 方法 |
| `service/PermissionService.java` | 修改: 删 category 方法，加树方法 |
| `service/impl/PermissionServiceImpl.java` | 修改: 实现树构建逻辑 |
| `controller/admin/AdminPermissionController.java` | 修改: 新增 `/tree` 接口，删 category |
| `controller/admin/AdminRoleController.java` | 修改: 接收 `permissionTree`，提取叶子节点 |
| `config/DataInitializer.java` | 修改: 用 `parent_id` 建树 |
| `views/roles/RoleEdit.vue` | 修改: el-select → el-tree |
| `apis/roles.js` | 修改: 添加获取权限树接口 |

---

## Task 1: 数据库变更

**SQL 文件路径:** 直接执行（无文件变更）

```sql
ALTER TABLE admin_permission ADD COLUMN parent_id BIGINT;
UPDATE admin_permission SET parent_id = NULL;
ALTER TABLE admin_permission DROP COLUMN category;
```

> 注意：执行此 SQL 前请确保后端服务已停止，避免 JPA 自动重建表结构覆盖变更。

---

## Task 2: 新建 PermissionTreeNode DTO

**文件:** `dto/admin/PermissionTreeNode.java`（新建）

```java
package com.beiguo.dto.admin;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class PermissionTreeNode {
    private Long id;
    private String code;
    private String name;
    private Long parentId;
    private Boolean isSystem;
    private List<PermissionTreeNode> children = new ArrayList<>();
    private boolean checked; // 角色编辑时标记是否已勾选
}
```

---

## Task 3: 修改 Permission Entity

**文件:** `src/main/java/com/beiguo/entity/Permission.java`

**变更内容:**
- 第 28-29 行: 删除 `category` 字段定义，添加 `parentId` 字段
- 第 57-59 行: `@PrePersist` 中删除 `category` 初始化逻辑，添加 `parentId` 默认 NULL

```java
// 删除第 28-29 行的 category 字段:
// @Column(length = 20)
// private String category = "SYSTEM"; // ...整行删除

// 在适当位置（isSystem 字段后）添加:
@Column(name = "parent_id")
private Long parentId; // 父权限ID，null表示根节点

// @PrePersist 中删除 category 逻辑（第 57-59 行），删除后变成:
@PrePersist
protected void onCreate() {
    LocalDateTime now = LocalDateTime.now();
    createTime = now;
    updateTime = now;
    if (isSystem == null) {
        isSystem = false;
    }
    // parentId 默认为 null，不需显式设置
}
```

---

## Task 4: 修改 PermissionRepository

**文件:** `src/main/java/com/beiguo/repository/PermissionRepository.java`

**变更内容:**
- 删除第 18 行: `List<Permission> findByCategory(String category);`
- 删除第 20 行: `List<Permission> findAllByOrderByCategoryAscCodeAsc();`
- 删除第 28 行: `@Query("SELECT DISTINCT p.category FROM Permission p ORDER BY p.category")`
- 删除第 31 行: `Integer countByCategory(String category);`
- 删除第 33 行: `List<Permission> findByCategoryIn(List<String> categories);`
- 添加第新行: `List<Permission> findByParentIdIsNull();` — 查询根节点
- 添加第新行: `List<Permission> findByParentId(Long parentId);` — 查询子节点

```java
// 删除的方法（第 18, 20, 28, 31, 33 行）全部删除

// 添加的两个方法（任意位置，放在 findByCode 后即可）:
List<Permission> findByParentIdIsNull();
List<Permission> findByParentId(Long parentId);
```

---

## Task 5: 修改 PermissionService 接口

**文件:** `src/main/java/com/beiguo/service/PermissionService.java`

**变更内容:**
- 删除第 24 行: `List<Permission> getByCategory(String category);`
- 删除第 25 行: `List<Permission> getSystemPermissions();`
- 删除第 26 行: `List<Permission> getCustomPermissions();`
- 删除第 45 行: `Integer countByCategory(String category);`
- 删除第 46 行: `Integer countSystemPermissions();`
- 删除第 47 行: `Integer countCustomPermissions();`
- 删除第 56 行: `List<String> getAllCategories();`
- 删除第 57 行: `List<Permission> getPermissionsByCategories(List<String> categories);`
- 添加第新行（任意位置）: `List<PermissionTreeNode> buildPermissionTree();`
- 添加第新行: `List<PermissionTreeNode> buildPermissionTreeWithRole(Long roleId);`
- 添加第新行: `List<Long> extractCheckedPermissionIds(List<PermissionTreeNode> tree);`

---

## Task 6: 修改 PermissionServiceImpl

**文件:** `src/main/java/com/beiguo/service/impl/PermissionServiceImpl.java`

### 6.1 添加 DTO import
```java
import com.beiguo.dto.admin.PermissionTreeNode;
```

### 6.2 添加树构建字段（任意位置，类的开头）
```java
// 缓存根节点（避免每次递归重新查询）
private List<PermissionTreeNode> cachedTree = null;
```

### 6.3 修改 create 方法 — 删除 category 逻辑
找到 `create` 方法中设置 `category` 的代码（约第 45-47 行）：
```java
// 删除这 3 行:
if (permission.getCategory() == null || permission.getCategory().trim().isEmpty()) {
    permission.setCategory("SYSTEM");
}
```
改为什么都不做（`parentId` 默认 null）。

### 6.4 修改 update 方法 — 删除 category 逻辑
约第 81-83 行，删除：
```java
if (permission.getCategory() != null && !permission.getCategory().trim().isEmpty()) {
    existingPermission.setCategory(permission.getCategory());
}
```

### 6.5 删除 getAll 方法中的 category 排序
约第 120 行，将 `findAllByOrderByCategoryAscCodeAsc()` 改为 `findAll()`。

### 6.6 删除所有 category 相关方法实现
删除以下方法的完整实现：
- `getByCategory`（约第 151-153 行）
- `getSystemPermissions`（约第 156-158 行）
- `getCustomPermissions`（约第 161-163 行）
- `countByCategory`（约第 273-275 行）
- `countSystemPermissions`（约第 278-280 行）
- `countCustomPermissions`（约第 283-285 行）
- `getAllCategories`（约第 337-339 行）
- `getPermissionsByCategories`（约第 342-344 行）

### 6.7 添加树构建方法（文件末尾，类结束前添加）
```java
@Override
public List<PermissionTreeNode> buildPermissionTree() {
    List<Permission> roots = permissionRepository.findByParentIdIsNull();
    List<PermissionTreeNode> tree = new ArrayList<>();
    for (Permission p : roots) {
        tree.add(buildNode(p));
    }
    return tree;
}

@Override
public List<PermissionTreeNode> buildPermissionTreeWithRole(Long roleId) {
    List<PermissionTreeNode> tree = buildPermissionTree();
    Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new RuntimeException("角色不存在，ID: " + roleId));
    Set<Long> rolePermissionIds = role.getPermissions().stream()
            .map(Permission::getId)
            .collect(Collectors.toSet());
    markChecked(tree, rolePermissionIds);
    return tree;
}

private PermissionTreeNode buildNode(Permission p) {
    PermissionTreeNode node = new PermissionTreeNode();
    node.setId(p.getId());
    node.setCode(p.getCode());
    node.setName(p.getName());
    node.setParentId(p.getParentId());
    node.setSystem(p.getIsSystem());
    List<Permission> children = permissionRepository.findByParentId(p.getId());
    for (Permission child : children) {
        node.getChildren().add(buildNode(child));
    }
    return node;
}

private void markChecked(List<PermissionTreeNode> nodes, Set<Long> checkedIds) {
    for (PermissionTreeNode node : nodes) {
        if (checkedIds.contains(node.getId())) {
            node.setChecked(true);
        }
        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            markChecked(node.getChildren(), checkedIds);
        }
    }
}

@Override
public List<Long> extractCheckedPermissionIds(List<PermissionTreeNode> tree) {
    List<Long> ids = new ArrayList<>();
    for (PermissionTreeNode node : tree) {
        if (node.isChecked()) {
            ids.add(node.getId());
        }
        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            ids.addAll(extractCheckedPermissionIds(node.getChildren()));
        }
    }
    return ids;
}
```

---

## Task 7: 修改 AdminPermissionController

**文件:** `src/main/java/com/beiguo/controller/admin/AdminPermissionController.java`

### 7.1 添加 import
```java
import com.beiguo.dto.admin.PermissionTreeNode;
import com.beiguo.service.PermissionService;
import java.util.List;
```

### 7.2 添加 Service 注入
在 `permissionRepository` 注入旁添加：
```java
@Autowired
private PermissionService permissionService;
```

### 7.3 修改 getPermissions 方法（第 30-64 行）
**删除** `category` 参数和相关逻辑，整个方法简化为：
```java
@GetMapping
public ApiResponse<Page<PermissionDTO>> getPermissions(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @RequestParam(required = false) String keyword) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("id"));
    Page<Permission> permissions;
    if (keyword != null && !keyword.trim().isEmpty()) {
        List<Permission> filtered = permissionRepository.searchByKeyword(keyword.trim());
        permissions = new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
    } else {
        permissions = permissionRepository.findAll(pageable);
    }
    Page<PermissionDTO> permissionDTOs = permissions.map(this::convertToDTO);
    return ApiResponse.success(permissionDTOs);
}
```

### 7.4 修改 createPermission 方法 — 删除 category
约第 84 行，删除 `permission.setCategory(request.getCategory());`

### 7.5 修改 updatePermission 方法 — 删除 category
约第 111 行，删除 `permission.setCategory(request.getCategory());`

### 7.6 修改 convertToDTO — 删除 category
约第 149 行，删除 `dto.setCategory(permission.getCategory());`

### 7.7 删除 getCategories 方法（约第 137-141 行）
整个 `getCategories` 方法删除。

### 7.8 修改 CreatePermissionRequest 和 UpdatePermissionRequest
在内部类中删除 `category` 字段。

### 7.9 添加权限树接口（任意 public 方法后）
```java
@GetMapping("/tree")
public ApiResponse<List<PermissionTreeNode>> getPermissionTree() {
    return ApiResponse.success(permissionService.buildPermissionTree());
}
```

---

## Task 8: 修改 AdminRoleController

**文件:** `src/main/java/com/beiguo/controller/admin/AdminRoleController.java`

### 8.1 添加 import
```java
import com.beiguo.dto.admin.PermissionTreeNode;
import com.beiguo.service.PermissionService;
import java.util.List;
import java.util.stream.Collectors;
```

### 8.2 添加 Service 注入
```java
@Autowired
private PermissionService permissionService;
```

### 8.3 修改 CreateRoleRequest — 添加 permissionTree
在已有的内部类 `CreateRoleRequest` 中添加字段：
```java
@Data
public static class CreateRoleRequest {
    @NotBlank(message = "角色名称不能为空")
    private String name;
    private String description;
    private String status = "ACTIVE";
    private List<PermissionTreeNode> permissionTree; // 新增
}
```

### 8.4 修改 UpdateRoleRequest — 添加 permissionTree
同样在 `UpdateRoleRequest` 中添加 `permissionTree` 字段。

### 8.5 修改 createRole 方法
约第 107-127 行，找到 `// 设置权限` 部分，删除原有的 permissionIds 逻辑，改为：
```java
// 设置权限
if (request.getPermissionTree() != null && !request.getPermissionTree().isEmpty()) {
    List<Long> checkedIds = permissionService.extractCheckedPermissionIds(request.getPermissionTree());
    if (!checkedIds.isEmpty()) {
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(checkedIds));
        role.setPermissions(permissions);
    }
}
```

### 8.6 修改 updateRole 方法
约第 99-127 行，同理删除原有 `request.getPermissionIds()` 逻辑，替换为从 `permissionTree` 提取。

### 8.7 添加角色权限树接口（新增）
```java
@GetMapping("/{id}/permissions/tree")
public ApiResponse<List<PermissionTreeNode>> getRolePermissionTree(@PathVariable Long id) {
    return ApiResponse.success(permissionService.buildPermissionTreeWithRole(id));
}
```

---

## Task 9: 修改 DataInitializer

**文件:** `src/main/java/com/beiguo/config/DataInitializer.java`

### 9.1 变更概述
- 删除 `createPermission` 方法的 `category` 参数
- 改为使用 `parentId` 建立父子关系
- 调整创建顺序：先创建所有节点（设置 ID），再建立父子关系

### 9.2 修改 createPermission 方法签名
约第 132 行，将：
```java
private Permission createPermission(String code, String name, String description, String category, boolean isSystem)
```
改为（去掉 category）：
```java
private Permission createPermission(String code, String name, String description, boolean isSystem)
```
方法体内删除 `permission.setCategory(category);` 一行。

### 9.3 重写权限初始化逻辑（约第 35-93 行）

用以下代码整体替换权限初始化部分（建立父子关系后的版本）：
```java
// 第一批：创建所有权限节点（parentId 暂不设置）
// ROOT
Permission rootPermission = createPermission("ROOT", "后台管理", "系统根节点", true);
// 模块父节点
Permission userModule = createPermission("MODULE:USER", "用户管理", "用户管理模块", true);
Permission gameModule = createPermission("MODULE:GAME", "游戏管理", "游戏管理模块", true);
Permission cardModule = createPermission("MODULE:CARD", "卡牌管理", "卡牌管理模块", true);
Permission activityModule = createPermission("MODULE:ACTIVITY", "活动管理", "活动管理模块", true);
Permission systemModule = createPermission("MODULE:SYSTEM", "系统管理", "系统管理模块", true);
Permission configModule = createPermission("MODULE:CONFIG", "配置管理", "配置管理模块", true);
Permission publishModule = createPermission("MODULE:PUBLISH", "发布管理", "发布管理模块", true);

// 先保存 ROOT，获取其 ID
rootPermission = permissionRepository.save(rootPermission);
// 再保存所有模块父节点（设置 parentId = rootPermission.getId()）
List<Permission> modulePermissions = Arrays.asList(userModule, gameModule, cardModule, activityModule, systemModule, configModule, publishModule);
for (Permission m : modulePermissions) {
    m.setParentId(rootPermission.getId());
}
permissionRepository.saveAll(modulePermissions);

// 第二批：创建所有叶子权限
List<Permission> allLeafPermissions = Arrays.asList(
    // 用户管理叶子
    createPermission("USER:VIEW", "查看用户", "查看用户列表和详情", true),
    createPermission("USER:CREATE", "创建用户", "创建新用户", true),
    createPermission("USER:EDIT", "编辑用户", "编辑用户信息", true),
    createPermission("USER:DELETE", "删除用户", "删除用户", true),
    createPermission("USER:STATUS", "用户状态管理", "启用/禁用用户", true),
    // 游戏管理叶子
    createPermission("GAME:VIEW", "查看游戏", "查看游戏列表和详情", true),
    createPermission("GAME:MANAGE", "管理游戏", "管理游戏配置", true),
    createPermission("GAME:STATS", "游戏统计", "查看游戏统计数据", true),
    // 卡牌管理叶子
    createPermission("CARD:VIEW", "查看卡牌", "查看卡牌列表和详情", true),
    createPermission("CARD:CREATE", "创建卡牌", "创建新卡牌", true),
    createPermission("CARD:EDIT", "编辑卡牌", "编辑卡牌信息", true),
    createPermission("CARD:DELETE", "删除卡牌", "删除卡牌", true),
    // 活动管理叶子
    createPermission("ACTIVITY:VIEW", "查看活动", "查看活动列表和详情", true),
    createPermission("ACTIVITY:CREATE", "创建活动", "创建新活动", true),
    createPermission("ACTIVITY:EDIT", "编辑活动", "编辑活动信息", true),
    createPermission("ACTIVITY:DELETE", "删除活动", "删除活动", true),
    // 系统管理叶子
    createPermission("SYSTEM:DASHBOARD", "仪表板", "访问系统仪表板", true),
    createPermission("SYSTEM:SETTINGS", "系统设置", "管理系统设置", true),
    createPermission("SYSTEM:LOGS", "日志管理", "查看系统日志", true),
    // 配置管理叶子
    createPermission("CONFIG:VIEW", "查看配置", "查看系统配置", true),
    createPermission("CONFIG:EDIT", "编辑配置", "编辑系统配置", true),
    // 发布管理叶子
    createPermission("PUBLISH:VIEW", "查看发布", "查看发布记录", true),
    createPermission("PUBLISH:CREATE", "创建发布", "创建新发布", true),
    createPermission("PUBLISH:MANAGE", "发布管理", "管理发布流程", true)
);

// 建立父子关系
Map<String, Permission> moduleMap = new HashMap<>();
moduleMap.put("USER", userModule);
moduleMap.put("GAME", gameModule);
moduleMap.put("CARD", cardModule);
moduleMap.put("ACTIVITY", activityModule);
moduleMap.put("SYSTEM", systemModule);
moduleMap.put("CONFIG", configModule);
moduleMap.put("PUBLISH", publishModule);

for (Permission p : allLeafPermissions) {
    String module = p.getCode().split(":")[0];
    Permission parent = moduleMap.get(module);
    if (parent != null) {
        p.setParentId(parent.getId());
    }
}

// 保存所有叶子权限
permissionRepository.saveAll(allLeafPermissions);

// 收集所有权限（ROOT + 模块父节点 + 叶子节点）
List<Permission> allPermissions = new ArrayList<>();
allPermissions.add(rootPermission);
allPermissions.addAll(modulePermissions);
allPermissions.addAll(allLeafPermissions);
```

### 9.4 修改角色分配权限的逻辑（适配新结构）
约第 109-126 行，由于原有 `findByCategory` 已不可用，改为直接用 `findByCode`：
```java
// 超级管理员拥有所有权限
superAdminRole.setPermissions(new HashSet<>(allPermissions));

// 管理员（移除 SYSTEM:LOGS）
Set<Permission> adminPermissions = new HashSet<>(allPermissions);
adminPermissions.removeIf(p -> p.getCode().equals("SYSTEM:LOGS"));
adminRole.setPermissions(adminPermissions);

// 编辑角色：内容管理权限
Set<Permission> editorPermissions = new HashSet<>();
editorPermissions.add(permissionRepository.findByCode("MODULE:USER").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("USER:VIEW").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("MODULE:GAME").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("GAME:VIEW").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("GAME:MANAGE").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("MODULE:CARD").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("CARD:VIEW").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("CARD:CREATE").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("CARD:EDIT").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("MODULE:ACTIVITY").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("ACTIVITY:VIEW").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("ACTIVITY:CREATE").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("ACTIVITY:EDIT").orElseThrow());
editorPermissions.add(permissionRepository.findByCode("SYSTEM:DASHBOARD").orElseThrow());
editorRole.setPermissions(editorPermissions);

// 查看者角色：只读权限
Set<Permission> viewerPermissions = new HashSet<>();
viewerPermissions.add(permissionRepository.findByCode("SYSTEM:DASHBOARD").orElseThrow());
viewerPermissions.add(permissionRepository.findByCode("USER:VIEW").orElseThrow());
viewerPermissions.add(permissionRepository.findByCode("GAME:VIEW").orElseThrow());
viewerPermissions.add(permissionRepository.findByCode("CARD:VIEW").orElseThrow());
viewerPermissions.add(permissionRepository.findByCode("ACTIVITY:VIEW").orElseThrow());
viewerPermissions.add(permissionRepository.findByCode("CONFIG:VIEW").orElseThrow());
viewerPermissions.add(permissionRepository.findByCode("PUBLISH:VIEW").orElseThrow());
viewerRole.setPermissions(viewerPermissions);
```

### 9.5 添加 Map import
```java
import java.util.Map;
import java.util.HashMap;
```

---

## Task 10: 修改前端 apis/roles.js

**文件:** `admin-frontend/apis/roles.js`

添加获取权限树接口：
```javascript
export const getPermissionTree = () => {
  return api.get('/admin/permissions/tree')
}

export const getRolePermissionTree = (roleId) => {
  return api.get(`/admin/roles/${roleId}/permissions/tree`)
}
```

---

## Task 11: 修改前端 RoleEdit.vue

**文件:** `admin-frontend/views/roles/RoleEdit.vue`

### 11.1 修改权限部分 template（约第 21-35 行）
```vue
<el-form-item label="权限" prop="permissionIds">
  <el-tree
    ref="permissionTreeRef"
    :data="permissionTreeData"
    :props="{ children: 'children', label: 'name' }"
    show-checkbox
    node-key="id"
    default-expand-all
    @check="handlePermissionCheck"
  />
</el-form-item>
```

### 11.2 修改 script 部分

**新增 import:**
```javascript
import { getPermissionTree, getRolePermissionTree } from '@/apis/roles'
```

**替换 loadPermissions 为 loadPermissionTree:**
```javascript
const permissionTreeRef = ref(null)
const permissionTreeData = ref([])

const loadPermissionTree = async () => {
  if (route.params.id) {
    const res = await getRolePermissionTree(route.params.id)
    permissionTreeData.value = res.data || []
    // 设置默认勾选
    nextTick(() => {
      const checkedIds = getAllCheckedLeafIds(permissionTreeData.value)
      checkedIds.forEach(id => {
        const node = permissionTreeRef.value?.getNode(id)
        if (node) node.checked = true
      })
    })
  } else {
    const res = await getPermissionTree()
    permissionTreeData.value = res.data || []
  }
}

// 递归收集所有被勾选的叶子节点 ID
const getAllCheckedLeafIds = (nodes) => {
  let ids = []
  for (const node of nodes) {
    if (node.checked && (!node.children || node.children.length === 0)) {
      ids.push(node.id)
    }
    if (node.children && node.children.length > 0) {
      ids = ids.concat(getAllCheckedLeafIds(node.children))
    }
  }
  return ids
}

const handlePermissionCheck = () => {
  // el-tree 自动处理父子联动，此处可留空或做额外处理
}
```

**修改 onMounted:**
```javascript
onMounted(async () => {
  await loadPermissionTree()
  loadFormData()
})
```

**删除 `loadPermissions` 相关代码**（不再使用 `getAllPermissions`）。

**修改 loadFormData 逻辑:**
编辑时从 `permissionTreeData` 的 `checked` 状态获取已选权限 ID：
```javascript
const loadFormData = async () => {
  if (route.params.id) {
    const res = await getRoleById(route.params.id)
    const data = res.data
    form.name = data.name || ''
    form.description = data.description || ''
    form.status = data.status || 'ACTIVE'
    // 从树中提取勾选的叶子节点 ID
    form.permissionIds = getAllCheckedLeafIds(permissionTreeData.value)
  } else {
    resetForm()
  }
}
```

**修改 submitForm:**
提交时从树中提取所有被勾选的叶子节点 ID，构造 `permissionTree` 结构提交：
```javascript
const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    // 从 el-tree 获取当前勾选状态，构造完整树（保留层级结构）
    const treeData = JSON.parse(JSON.stringify(permissionTreeData.value))
    // 重新根据 el-tree 的实际勾选状态标记 checked
    markTreeChecked(treeData, permissionTreeRef.value?.getCheckedNodes() || [])

    const submitData = {
      name: form.name,
      description: form.description,
      status: form.status,
      permissionTree: treeData
    }
    if (isEdit.value && !submitData.password) {
      delete submitData.password
    }
    if (isEdit.value) {
      await updateRole(route.params.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await createRole(submitData)
      ElMessage.success('创建成功')
    }
    router.back()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  }
}

// 递归标记树节点的 checked 状态
const markTreeChecked = (nodes, checkedNodes) => {
  for (const node of nodes) {
    node.checked = checkedNodes.some(c => c.id === node.id)
    if (node.children && node.children.length > 0) {
      markTreeChecked(node.children, checkedNodes)
    }
  }
}
```

### 11.3 修改 form 的 permissionIds 初始化
删除 `permissionIds: []`，改为通过树控件管理。

---

## Task 12: 验证检查清单

完成后逐一验证以下内容：

1. **数据库**: `admin_permission` 表有 `parent_id` 列，无 `category` 列
2. **后端启动**: `GET /admin/permissions/tree` 返回树形 JSON
3. **角色创建**: POST `/admin/roles` 带 `permissionTree` 能正确保存权限
4. **角色编辑**: GET `/admin/roles/{id}/permissions/tree` 返回带 `checked: true` 的树
5. **前端**: 角色编辑页权限选择显示为树形结构，勾选父节点自动勾选所有子节点
