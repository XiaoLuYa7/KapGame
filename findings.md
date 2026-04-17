# Findings & Decisions

## Requirements
<!-- Captured from user request -->
- 邮件管理页面，可以发送邮件给指定条件的游戏用户
- 用户在游戏内邮箱查看邮件
- 邮件内容可配置：文字 + 物品（钻石、金币、皮肤、道具体）
- 后端新增邮件相关功能

## Research Findings
<!-- Key discoveries during exploration -->

### 后端技术栈
- Spring Boot + JPA/Hibernate
- Entity类路径: `com.beiguo.entity`
- Repository路径: `com.beiguo.repository`
- Service路径: `com.beiguo.service` + `com.beiguo.service.impl`
- Controller路径: `com.beiguo.controller.admin`
- REST API风格：`/admin/xxx` 路径

### 前端技术栈
- Vue 3 + Composition API
- Element Plus UI组件
- 前端路径: `D:\ClaudeCode\KapGame\admin-frontend`
- 页面路径: `views/`
- 路由: `router/index.js`
- 权限控制: `utils/permission.js`

### 现有数据库表
- admin_user (管理员)
- admin_role, admin_permission, role_permission (权限)
- user (游戏用户)
- card_config (卡牌)
- activity (活动)
- system_config (系统配置)
- publish_history (发布历史)

### 现有实体示例
```java
// CardConfig.java
@Entity
@Table(name = "card_config")
public class CardConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private Boolean isActive;
    // ...
}
```

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 邮件配置表与附件表分离 | 一对多关系，灵活支持多物品 |
| 物品类型枚举 | DIAMOND, COIN, SKIN, ITEM |
| 邮件状态：草稿/已发送/已失效 | 支持邮件管理全生命周期 |
| 用户筛选条件存储为JSON | 灵活支持多种条件组合 |

## Resources
- Entity路径: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\entity`
- 前端页面: `D:\ClaudeCode\KapGame\admin-frontend\views`
- User实体字段: id, username, email, phone, status, createTime, level, diamond, gold, rank, rankLevel, lastLoginTime

## User筛选条件设计
支持按以下条件筛选用户：
- 注册时间范围 (createTime between start and end)
- 等级范围 (level between min and max)
- 状态 (status = ACTIVE/BANNED)
- 段位 (rank)
- 拥有钻石数量 (diamond >= min)
- 拥有金币数量 (gold >= min)
- 最后登录时间 (lastLoginTime within days)
