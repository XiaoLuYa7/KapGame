# AGENTS.md

本文件用于规范 Codex 在 KapGame 项目中的代码理解、修改与生成行为。
请在执行任何修改前阅读并严格遵守本文件。

------

# 一、项目整体结构

本项目为多端架构：

```text
KapGame/
├── CocosFrontend/        # 小游戏前端（Cocos Creator 3.x）
├── backend/              # 后端服务（Spring Boot 3 + JDK17）
├── admin-frontend/       # 管理后台（Vue3 + Element Plus）
```

------

# 二、数据库信息（重要）

```text
数据库：MySQL 8
地址：localhost:3306
用户名：root
密码：123456
```

------

## ⚠️ 数据库修改规则（最高优先级）

当进行以下操作时：

- 修改表结构（新增字段 / 删除字段 / 改字段）
- 新增表
- 删除表

必须同步修改：

```text
1. backend（后端）
2. admin-frontend（如果涉及管理后台）
3. CocosFrontend（如果涉及前端数据展示）
```

------

## 数据库变更必须同步内容

### backend 必须同步：

- Entity / DO / DTO
- Mapper.xml / Repository
- Service 业务逻辑
- Controller 接口返回字段

------

### admin-frontend 必须同步：

- 表格字段
- 表单字段
- API 调用字段

------

### CocosFrontend 必须同步：

- 数据结构定义（TypeScript interface）
- UI 展示字段
- 列表绑定逻辑

------

## 禁止行为

```text
❌ 只改数据库不改后端
❌ 后端字段与数据库不一致
❌ 前端使用已删除字段
```

------

# 三、CocosFrontend（小游戏前端）

## 技术栈

- Cocos Creator 3.x
- TypeScript
- Prefab UI 架构

------

## 目录规范

```text
assets/
├── resources/
│   └── prefabs/
│       ├── pages/        # 页面（ChatPage / FriendPage / BattlePage）
│       ├── ui/           # 通用UI（TabBar / Dialog）
│       └── items/        # 列表项（FriendItem / MessageItem）
│
├── scripts/
│   ├── pages/
│   ├── components/
│   └── core/
```

------

## 页面架构（必须遵守）

```text
Main.scene
├── PageRoot
│   ├── ShopPage
│   ├── BattlePage
│   └── ChatPage
└── TabBar
```

------

### 规则：

```text
❌ 禁止频繁 loadScene
✅ 使用 active 控制页面切换
✅ 使用 PageCacheManager 管理页面
```

------

## Prefab 使用规则

```text
✔ 所有 UI 必须是 Prefab
✔ 修改代码前必须读取 prefab
✔ 禁止修改节点名称
```

------

## ScrollView 规范（重要）

```text
ScrollView
└── view
    └── content
```

### Layout 设置：

```text
Type = VERTICAL
Resize Mode = NONE
Vertical Direction = TOP_TO_BOTTOM
```

------

### content 高度控制（必须代码处理）

```ts
content.height = Math.max(realHeight, viewHeight);
layout.updateLayout();
scrollView.scrollToTop(0);
```

------

## 动态列表规则

```ts
const item = instantiate(prefab);
content.addChild(item);
❌ 禁止手写静态列表
```

------

## 节点绑定规则

```ts
@property(Node)
content: Node | null = null;
❌ 禁止 getChildByName 链式查找
```

------

# 四、backend（后端）

## 技术栈

- Spring Boot 3
- JDK 17
- MySQL 8

------

## 分层规范

```text
Controller → Service → Mapper → DB
```

------

## 返回格式（统一）

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

------

## 规则

```text
✔ Controller 只处理请求
✔ Service 处理业务逻辑
✔ Mapper 只做数据库操作
```

------

# 五、admin-frontend（管理后台）

## 技术栈

- Vue 3
- Element Plus

------

## 规则

```text
✔ 所有数据来自 backend
✔ 表格字段必须与数据库一致
✔ 表单字段必须与后端一致
```

------

# 六、前后端接口规范

## API 前缀

```text
/api/**
```

------

## 示例

```text
GET  /api/friend/list
POST /api/friend/add
```

------

# 七、Codex 工作流程（必须遵守）

## 修改代码前

```text
1. 分析项目结构
2. 确认涉及模块（前端/后端/数据库）
3. 如涉及数据库，必须全链路修改
4. Cocos 必须先读取 prefab
```

------

## 推荐指令方式

```text
读取 FriendPage.prefab，
列出节点结构，
再修改 FriendPageCtrl.ts。
```

------

# 八、禁止行为

```text
❌ 只改一端代码
❌ 不同步数据库变更
❌ 不读取 prefab 直接改 UI 代码
❌ 修改节点名称
❌ 破坏 ScrollView 结构
```

------

# 九、最高优先级原则

```text
1. 数据一致性 > 功能实现
2. prefab 结构 > 代码逻辑
3. 不破坏现有 UI
4. 所有列表必须可滚动
5. 所有数据必须来自后端
```

------

# 十、总结

Codex 在本项目中必须：

```text
✔ 修改数据库必须同步 backend + admin + frontend
✔ UI 必须基于 prefab
✔ ScrollView 必须符合规范
✔ 页面必须使用缓存机制
✔ 所有修改必须保证三端一致
```