# 后台管理会话超时与权限优化设计

## 概述
优化KapGame后台管理系统的会话管理、权限验证和路径结构，实现30分钟无请求自动登出、admin账号完整权限访问、以及简化的路径映射。

## 项目上下文
- **平台**：WeChat小程序前端 + Java Spring Boot后台管理系统
- **当前状态**：现有JWT无状态认证，需要改为有状态会话管理
- **技术栈**：Spring Security 6.1+, Thymeleaf, Bootstrap, jQuery, MySQL
- **权限系统**：已实现RBAC，包含SUPER_ADMIN和ADMIN角色

## 设计目标
1. **会话超时**：用户登录后30分钟内无任何请求则自动登出，重定向到登录页并显示超时提示
2. **权限验证**：admin账号拥有SUPER_ADMIN角色所有权限，可正常访问所有管理页面无403错误
3. **路径优化**：统一页面路径为`/admin/view/*`，API路径为`/admin/*`，移除冗余重定向
4. **用户体验**：会话超时友好提示，权限错误适当处理

## 详细设计

### 1. 会话超时管理

#### 技术方案
采用Spring Security有状态会话管理，配置30分钟绝对超时和滑动过期机制。

#### 核心配置
```java
// SecurityConfig.java配置
.sessionManagement(session -> session
    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
    .invalidSessionUrl("/admin/view/login?timeout")
    .maximumSessions(-1) // 不限制并发会话
    .expiredUrl("/admin/view/login?expired"))
```

#### 超时设置
```properties
# application.properties
server.servlet.session.timeout=30m
spring.session.timeout=30m
```

#### 超时处理流程
1. **客户端**：30分钟无任何HTTP请求
2. **服务端**：会话自动失效
3. **下一次请求**：`SessionManagementFilter`检测到无效会话
4. **重定向**：`/admin/view/login?timeout`（首次超时）或`/admin/view/login?expired`（会话过期）
5. **前端提示**：登录页根据URL参数显示相应超时消息

#### AJAX请求处理
- 返回HTTP 401状态码
- 前端JavaScript检测401并重定向到登录页

### 2. 权限配置与错误处理

#### 数据库验证要求
1. **admin用户角色**：确保`admin`用户的`role_id`指向`SUPER_ADMIN`角色
2. **SUPER_ADMIN权限**：`admin_role_permission`表中`SUPER_ADMIN`角色应包含全部21个权限
3. **权限分类**：USER_MANAGEMENT, CARD_MANAGEMENT, ACTIVITY_MANAGEMENT, SYSTEM_CONFIG, TEAM_MANAGEMENT, GAME_MANAGEMENT, DATA_STATISTICS

#### Spring Security配置
```java
// SecurityConfig.java权限配置
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/admin/view/login").permitAll()
    .requestMatchers("/admin/auth/**").permitAll()
    .requestMatchers("/admin/css/**", "/admin/js/**", "/admin/images/**").permitAll()
    .requestMatchers("/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
    .requestMatchers("/api/**").authenticated() // 小程序API
    .anyRequest().authenticated())
```

#### 控制器层权限验证
```java
// 在Controller类或方法上添加注解
@PreAuthorize("hasRole('SUPER_ADMIN')")
// 或针对特定方法
@Secured({"ROLE_SUPER_ADMIN", "ROLE_ADMIN"})
```

#### Thymeleaf页面权限控制
```html
<!-- 在Thymeleaf模板中控制元素显示 -->
<div sec:authorize="hasRole('SUPER_ADMIN')">
    <!-- 仅SUPER_ADMIN可见的内容 -->
</div>
```

#### 403错误处理
添加自定义`AccessDeniedHandler`，将403错误重定向到无权限提示页面。

### 3. 路径优化设计

#### 新的路径结构
| 类型 | 路径模式 | 示例 | 说明 |
|------|----------|------|------|
| 后台页面 | `/admin/view/*` | `/admin/view/login`, `/admin/view/dashboard` | Thymeleaf渲染的HTML页面 |
| 管理API | `/admin/*` | `/admin/auth/login`, `/admin/users/list` | 后台管理API（不包括`/admin/view/`） |
| 静态资源 | `/admin/{css,js,images}/*` | `/admin/css/style.css` | CSS、JavaScript、图片资源 |
| 小程序API | `/api/*` | `/api/auth/login` | 小程序客户端API |

#### 具体页面路径
- `/admin/view/login` - 登录页面
- `/admin/view/dashboard` - 仪表盘页面
- `/admin/view/users` - 用户管理页面
- `/admin/view/cards` - 卡牌管理页面
- `/admin/view/activities` - 活动管理页面
- `/admin/view/configs` - 系统配置页面
- `/admin/view/publish` - 发布管理页面
- `/admin/view/admin-users` - 管理员管理页面
- `/admin/view/roles` - 角色管理页面
- `/admin/view/permissions` - 权限管理页面

#### 移除的冗余路径
- ❌ `/admin` → `/admin/view` 重定向
- ❌ `/admin/login` → `/admin/view/login` 重定向
- ❌ 所有`/admin/view/*`到其他路径的重定向

#### Controller结构调整
1. **页面渲染Controller**：处理`/admin/view/*`路径，返回Thymeleaf模板
2. **API Controller**：处理`/admin/*`路径（不包括`view`），返回JSON数据
3. **认证Controller**：`AdminAuthController`保持处理`/admin/auth/*`路径

## 实施细节

### 文件修改列表

#### 1. SecurityConfig.java
- 修改会话管理配置（有状态会话，30分钟超时）
- 更新路径权限配置
- 添加会话超时重定向URL
- 配置会话存储为HTTP Session（默认），支持未来扩展为Redis

#### 2. JwtAuthenticationFilter.java
- 保留现有JWT验证逻辑，但修改为仅对`/api/*`路径生效
- 后台管理路径（`/admin/*`）改为使用有状态会话验证
- 需要更新过滤器配置，区分API路径和管理路径的认证方式

#### 3. application.properties
- 添加会话超时配置：`server.servlet.session.timeout=30m`
- 保留JWT配置用于小程序API：`jwt.expiration=86400000`（24小时）
- 添加会话存储配置（如果需要）

#### 4. AdminViewController.java
- 重构为处理`/admin/view/*`路径
- 移除所有重定向逻辑
- 直接返回对应Thymeleaf模板

#### 5. 各管理Controller
- 确保API路径正确（`/admin/{resource}`）
- 添加适当的权限注解

#### 6. 前端页面（Thymeleaf模板）
- 更新页面链接指向`/admin/view/*`路径
- 添加权限控制标签
- 添加会话超时处理脚本

### 数据库验证脚本
```sql
-- 验证admin用户的角色和权限
SELECT u.username, r.name as role_name, COUNT(rp.permission_id) as permission_count
FROM admin_user u
JOIN admin_role r ON u.role_id = r.id
LEFT JOIN admin_role_permission rp ON r.id = rp.role_id
WHERE u.username = 'admin'
GROUP BY u.id, r.id;

-- 验证SUPER_ADMIN角色的权限数量（应为21）
SELECT r.name, COUNT(rp.permission_id) as permission_count
FROM admin_role r
LEFT JOIN admin_role_permission rp ON r.id = rp.role_id
WHERE r.name = 'SUPER_ADMIN'
GROUP BY r.id;
```

## 验证标准

### 会话超时验证
1. ✅ 登录后30分钟内无请求，会话自动失效
2. ✅ 失效后请求自动重定向到登录页
3. ✅ 登录页显示"会话超时"提示信息
4. ✅ AJAX请求返回401状态码
5. ✅ 每次有效请求重置会话计时器

### 权限验证
1. ✅ admin用户可正常登录
2. ✅ admin用户可访问所有管理页面（无403错误）
3. ✅ admin用户拥有所有操作权限
4. ✅ 其他ADMIN角色用户权限受限（无删除和系统配置权限）
5. ✅ 未登录用户无法访问受保护页面

### 路径验证
1. ✅ `/admin/view/login` 可正常访问登录页
2. ✅ `/admin/view/dashboard` 等页面路径正常渲染
3. ✅ `/admin/auth/login` 等API路径正常响应
4. ✅ `/api/*` 路径保持原有功能
5. ✅ 所有页面内链接使用正确路径

### 兼容性验证
1. ✅ 小程序API功能不受影响
2. ✅ 现有管理功能正常工作
3. ✅ 数据库数据完整性保持

## 依赖关系

### 技术依赖
1. **Spring Session** - 会话管理
2. **Spring Security** - 认证和授权
3. **Thymeleaf Spring Security** - 页面权限标签
4. **MySQL** - 权限数据存储

### 实施顺序
1. 数据库权限验证和修正
2. SecurityConfig会话配置修改
3. Controller路径重构
4. 前端页面路径更新
5. 测试验证

### 风险评估
1. **会话状态丢失**：从无状态JWT切换到有状态会话，需要确保会话持久化
2. **路径冲突**：页面路径和API路径需要清晰分离
3. **权限配置错误**：需要验证数据库权限数据完整性

## 未来考虑
1. **会话持久化**：考虑使用Redis存储会话以实现横向扩展
2. **双因素认证**：可选的增强安全功能
3. **登录日志**：记录管理员登录和操作日志
4. **密码策略**：强制密码复杂度要求和定期更换

## 批准状态
- ✅ 用户需求收集和确认完成
- ✅ 设计方案讨论和确认完成
- ✅ 实施计划准备就绪

---
**创建日期**：2026-04-10
**最后修改**：2026-04-10
**作者**：系统设计团队
**版本**：1.0