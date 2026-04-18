# KapGame 前端主题重设计实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 KapGame 小程序前端重设计为柔和玻璃双主题，支持系统级白天/黑夜自动切换

**Architecture:** 利用 CSS 变量 + @media (prefers-color-scheme: dark) 实现双主题，所有颜色通过 CSS 变量定义，白天/黑夜模式自动切换

**Tech Stack:** 微信小程序 WXSS, CSS Variables, CSS Media Queries

---

## 文件变更清单

| 文件 | 职责 |
|------|------|
| `app.wxss` | 全局 CSS 变量定义（双主题） |
| `pages/shop/shop.wxss` | 商城页模块样式 |
| `pages/home/home.wxss` | 对战主页样式 |
| `pages/chat/chat.wxss` | 消息页样式 |
| `pages/login/login.wxss` | 登录页样式 |
| `components/userCard/userCard.wxss` | 用户卡片组件样式 |

---

## Task 1: 重写 app.wxss 全局主题变量

**Files:**
- Modify: `frontend/app.wxss`

- [ ] **Step 1: 重写全局 CSS 变量**

```wxss
/* ============================================
   KapGame 全局主题样式
   设计风格：柔和玻璃 (Soft Glass)
   支持系统级白天/黑夜模式自动切换
   ============================================ */

/* ---------- CSS变量（设计令牌）---------- */
page {
  /* ===== 明亮模式（默认）===== */
  /* 背景层次 */
  --bg-void: #FAFBFC;
  --bg-deep: #F1F5F9;
  --bg-base: #FFFFFF;
  --bg-card: rgba(255, 255, 255, 0.7);
  --bg-elevated: rgba(255, 255, 255, 0.85);
  --bg-hover: rgba(14, 165, 233, 0.05);
  --bg-glass: rgba(255, 255, 255, 0.7);

  /* 强调色 */
  --accent-primary: #0EA5E9;
  --accent-secondary: #14B8A6;
  --accent-primary-rgb: 14, 165, 233;
  --accent-glow: rgba(14, 165, 233, 0.2);

  /* 文本层次 */
  --text-bright: #FFFFFF;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;
  --text-dim: #CBD5E1;

  /* 边框与分隔 */
  --border-hairline: rgba(14, 165, 233, 0.1);
  --border-default: rgba(14, 165, 233, 0.15);
  --border-bright: rgba(14, 165, 233, 0.25);

  /* 功能色 */
  --danger: #EF4444;
  --success: #10B981;
  --warning: #F59E0B;

  /* 玻璃效果 */
  --glass-blur: blur(12px);
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(14, 165, 233, 0.15);

  /* 阴影 */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.06);
  --shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.08);
  --shadow-accent: 0 4px 16px rgba(14, 165, 233, 0.2);

  /* 圆角 */
  --radius-sm: 16rpx;
  --radius-md: 20rpx;
  --radius-lg: 24rpx;
  --radius-xl: 32rpx;

  /* 间距 */
  --space-xs: 8rpx;
  --space-sm: 12rpx;
  --space-md: 16rpx;
  --space-lg: 24rpx;
  --space-xl: 32rpx;
  --space-2xl: 48rpx;

  /* 页面背景 */
  background: linear-gradient(180deg, var(--bg-void) 0%, var(--bg-deep) 100%);
}

/* ---------- 深色模式 ---------- */
@media (prefers-color-scheme: dark) {
  page {
    /* 背景层次 */
    --bg-void: #0F1419;
    --bg-deep: #1E293B;
    --bg-base: #0F172A;
    --bg-card: rgba(30, 41, 59, 0.6);
    --bg-elevated: rgba(51, 65, 85, 0.7);
    --bg-hover: rgba(56, 189, 248, 0.05);
    --bg-glass: rgba(30, 41, 59, 0.6);

    /* 强调色 */
    --accent-primary: #38BDF8;
    --accent-secondary: #94A3B8;
    --accent-primary-rgb: 56, 189, 248;
    --accent-glow: rgba(56, 189, 248, 0.25);

    /* 文本层次 */
    --text-bright: #FFFFFF;
    --text-primary: #F1F5F9;
    --text-secondary: #94A3B8;
    --text-muted: #64748B;
    --text-dim: #475569;

    /* 边框与分隔 */
    --border-hairline: rgba(56, 189, 248, 0.1);
    --border-default: rgba(56, 189, 248, 0.15);
    --border-bright: rgba(56, 189, 248, 0.25);

    /* 功能色 */
    --danger: #F87171;
    --success: #34D399;
    --warning: #FBBF24;

    /* 玻璃效果 */
    --glass-blur: blur(12px);
    --glass-bg: rgba(30, 41, 59, 0.6);
    --glass-border: rgba(56, 189, 248, 0.15);

    /* 阴影 */
    --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3);
    --shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.4);
    --shadow-accent: 0 4px 16px rgba(56, 189, 248, 0.25);

    /* 页面背景 */
    background: linear-gradient(180deg, var(--bg-void) 0%, var(--bg-deep) 100%);
  }
}

/* ---------- 全局重置 ---------- */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  color: var(--text-primary);
  font-size: 28rpx;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.container {
  padding: var(--space-lg);
}

/* ---------- 玻璃卡片 ---------- */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1rpx solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-card);
}

/* ---------- 通用卡片 ---------- */
.card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1rpx solid var(--border-hairline);
  box-shadow: var(--shadow-card);
}

/* ---------- 按钮系统 ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-md);
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  border: none;
  transition: all 0.2s ease;
}

.btn:active {
  transform: scale(0.97);
}

.btn-primary {
  background: linear-gradient(145deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 85%, black));
  color: white;
  box-shadow: var(--shadow-accent);
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 2rpx solid var(--border-default);
}

/* ---------- 输入框 ---------- */
.input {
  background: var(--bg-elevated);
  border: 2rpx solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
  color: var(--text-primary);
  font-size: 30rpx;
  transition: all 0.2s;
}

.input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 20rpx var(--accent-glow);
}

/* ---------- 分割线 ---------- */
.divider {
  height: 1rpx;
  background: var(--border-hairline);
  margin: var(--space-lg) 0;
}

/* ---------- 列表项 ---------- */
.list-item {
  display: flex;
  align-items: center;
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  border: 1rpx solid var(--border-hairline);
  transition: all 0.2s ease;
}

.list-item:active {
  background: var(--bg-hover);
  transform: scale(0.98);
  border-color: var(--accent-primary);
}

/* ---------- 头像 ---------- */
.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 3rpx solid var(--border-default);
}

.avatar image {
  width: 100%;
  height: 100%;
}

/* ---------- Switch 开关 ---------- */
switch {
  transform: scale(0.85);
}

/* ---------- 触摸反馈 ---------- */
.touch-active {
  opacity: 0.8;
  transform: scale(0.97);
}
```

- [ ] **Step 2: 提交**

```bash
cd D:/ClaudeCode/KapGame/frontend
git add app.wxss
git commit -m "refactor: 重写全局主题为柔和玻璃双主题，支持系统级自动切换"
```

---

## Task 2: 重写商城页 shop.wxss

**Files:**
- Modify: `frontend/pages/shop/shop.wxss`

- [ ] **Step 1: 重写商城页样式**

```wxss
/* ============================================
   商城页样式
   设计风格：柔和玻璃 (Soft Glass)
   支持白天/黑夜模式自动切换
   ============================================ */

.shop-container {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-void) 0%, var(--bg-deep) 50%, var(--bg-base) 100%);
  padding: var(--space-xl);
  padding-bottom: 120rpx;
  position: relative;
}

/* 功能模块网格 */
.modules-grid {
  display: flex;
  flex-direction: column;
  gap: 36rpx;
  margin-top: 48rpx;
  position: relative;
  z-index: 1;
}

.module-row {
  display: flex;
  gap: 28rpx;
}

/* 模块项 - 左右布局、整体居中 */
.module-item {
  flex: 1;
  border-radius: var(--radius-md);
  padding: 28rpx 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  min-height: 100rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
  border: 2rpx solid;
}

/* 顶部装饰线 */
.module-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3rpx;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.6;
}

.module-item:active {
  transform: scale(0.97);
}

.module-item.full-row {
  flex: 1;
}

/* 模块图标 */
.module-icon {
  width: 72rpx;
  height: 72rpx;
  background: rgba(0, 0, 0, 0.15);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.module-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
}

.module-name {
  color: #FFFFFF;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 4rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.module-desc {
  color: rgba(255, 255, 255, 0.75);
  font-size: 22rpx;
}

/* 设置链接 */
.settings-link {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-muted);
  font-size: 28rpx;
  font-weight: 500;
  z-index: 100;
  padding: 16rpx 32rpx;
  transition: all 0.2s ease;
}

.settings-link:active {
  color: var(--accent-primary);
  transform: translateX(-50%) scale(0.96);
}

/* ========== 设置弹窗 ========== */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(2, 2, 3, 0.8);
  backdrop-filter: blur(10px);
}

.modal-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-deep) 100%);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  max-height: 85vh;
  overflow: hidden;
  border-top: 1rpx solid var(--border-default);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl) var(--space-xl) var(--space-lg);
  border-bottom: 1rpx solid var(--border-hairline);
}

.modal-title {
  color: var(--text-primary);
  font-size: 36rpx;
  font-weight: 700;
}

.modal-close {
  color: var(--text-muted);
  font-size: 44rpx;
  padding: var(--space-sm);
}

.modal-close:active {
  color: var(--accent-primary);
}

.modal-body {
  padding: var(--space-lg) var(--space-xl) 80rpx;
  max-height: 75vh;
  overflow-y: auto;
}

/* 设置分组 */
.setting-group {
  margin-bottom: var(--space-xl);
}

.group-title {
  color: var(--text-muted);
  font-size: 22rpx;
  padding: var(--space-md) 0 var(--space-sm);
  letter-spacing: 3rpx;
  text-transform: uppercase;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg) 0;
  border-bottom: 1rpx solid var(--border-hairline);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-row:active {
  background: var(--bg-hover);
}

.row-label {
  color: var(--text-primary);
  font-size: 30rpx;
  font-weight: 500;
}

.row-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.row-value {
  color: var(--text-muted);
  font-size: 28rpx;
}

.row-arrow {
  color: var(--border-bright);
  font-size: 34rpx;
}

/* 底部链接 */
.bottom-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-2xl) 0 var(--space-lg);
}

.link {
  color: var(--accent-primary);
  font-size: 26rpx;
  font-weight: 500;
}

.version {
  text-align: center;
  color: var(--text-dim);
  font-size: 24rpx;
  padding-bottom: var(--space-lg);
}

/* ========== 模块渐变背景 - 明亮模式 ========== */

/* 靛蓝系 - 商城 */
.module-indigo {
  background: linear-gradient(145deg, #0EA5E9 0%, #0284C7 100%);
  border-color: #0EA5E9;
}
.module-indigo::before {
  background: linear-gradient(90deg, transparent, #7DD3FC, transparent);
}
.module-indigo .module-icon {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

/* 青色系 - 寻宝 */
.module-cyan {
  background: linear-gradient(145deg, #14B8A6 0%, #0D9488 100%);
  border-color: #14B8A6;
}
.module-cyan::before {
  background: linear-gradient(90deg, transparent, #5EEAD4, transparent);
}
.module-cyan .module-icon {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

/* 金色系 - 荣耀大明星 */
.module-gold {
  background: linear-gradient(145deg, #F59E0B 0%, #D97706 100%);
  border-color: #F59E0B;
}
.module-gold::before {
  background: linear-gradient(90deg, transparent, #FCD34D, transparent);
}
.module-gold .module-icon {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

/* 绿色系 - 邀请有奖 */
.module-green {
  background: linear-gradient(145deg, #10B981 0%, #059669 100%);
  border-color: #10B981;
}
.module-green::before {
  background: linear-gradient(90deg, transparent, #6EE7B7, transparent);
}
.module-green .module-icon {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

/* 紫色系 - 赏金任务 */
.module-violet {
  background: linear-gradient(145deg, #8B5CF6 0%, #7C3AED 100%);
  border-color: #8B5CF6;
}
.module-violet::before {
  background: linear-gradient(90deg, transparent, #C4B5FD, transparent);
}
.module-violet .module-icon {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

/* 粉色系 - 翻牌有奖 */
.module-pink {
  background: linear-gradient(145deg, #EC4899 0%, #DB2777 100%);
  border-color: #EC4899;
}
.module-pink::before {
  background: linear-gradient(90deg, transparent, #F9A8D4, transparent);
}
.module-pink .module-icon {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

/* 橙色系 - 每日签到 */
.module-orange {
  background: linear-gradient(145deg, #F97316 0%, #EA580C 100%);
  border-color: #F97316;
}
.module-orange::before {
  background: linear-gradient(90deg, transparent, #FDBA74, transparent);
}
.module-orange .module-icon {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

/* 红色系 - 等级奖励 */
.module-red {
  background: linear-gradient(145deg, #EF4444 0%, #DC2626 100%);
  border-color: #EF4444;
}
.module-red::before {
  background: linear-gradient(90deg, transparent, #FCA5A5, transparent);
}
.module-red .module-icon {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

/* ========== 深色模式模块颜色覆盖 ========== */
@media (prefers-color-scheme: dark) {
  .module-indigo {
    background: linear-gradient(145deg, #38BDF8 0%, #0EA5E9 100%);
    border-color: #38BDF8;
  }
  .module-indigo::before {
    background: linear-gradient(90deg, transparent, #BAE6FD, transparent);
  }

  .module-cyan {
    background: linear-gradient(145deg, #2DD4BF 0%, #14B8A6 100%);
    border-color: #2DD4BF;
  }
  .module-cyan::before {
    background: linear-gradient(90deg, transparent, #99F6E4, transparent);
  }

  .module-gold {
    background: linear-gradient(145deg, #FBBF24 0%, #F59E0B 100%);
    border-color: #FBBF24;
  }
  .module-gold::before {
    background: linear-gradient(90deg, transparent, #FDE68A, transparent);
  }

  .module-green {
    background: linear-gradient(145deg, #34D399 0%, #10B981 100%);
    border-color: #34D399;
  }
  .module-green::before {
    background: linear-gradient(90deg, transparent, #A7F3D0, transparent);
  }

  .module-violet {
    background: linear-gradient(145deg, #A78BFA 0%, #8B5CF6 100%);
    border-color: #A78BFA;
  }
  .module-violet::before {
    background: linear-gradient(90deg, transparent, #DDD6FE, transparent);
  }

  .module-pink {
    background: linear-gradient(145deg, #F472B6 0%, #EC4899 100%);
    border-color: #F472B6;
  }
  .module-pink::before {
    background: linear-gradient(90deg, transparent, #FBCFE8, transparent);
  }

  .module-orange {
    background: linear-gradient(145deg, #FB923C 0%, #F97316 100%);
    border-color: #FB923C;
  }
  .module-orange::before {
    background: linear-gradient(90deg, transparent, #FED7AA, transparent);
  }

  .module-red {
    background: linear-gradient(145deg, #F87171 0%, #EF4444 100%);
    border-color: #F87171;
  }
  .module-red::before {
    background: linear-gradient(90deg, transparent, #FECACA, transparent);
  }
}
```

- [ ] **Step 2: 提交**

```bash
cd D:/ClaudeCode/KapGame/frontend
git add pages/shop/shop.wxss
git commit -m "refactor: 商城页重写为柔和玻璃双主题"
```

---

## Task 3: 重写用户卡片组件 userCard.wxss

**Files:**
- Modify: `frontend/components/userCard/userCard.wxss`

- [ ] **Step 1: 重写用户卡片样式**

```wxss
/* ============================================
   用户卡片组件样式
   设计风格：柔和玻璃 (Soft Glass)
   支持白天/黑夜模式自动切换
   ============================================ */

.user-card {
  width: 100%;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1rpx solid var(--glass-border);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

/* 顶部渐变装饰 */
.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
}

.user-card-content {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 4rpx solid var(--accent-primary);
  box-shadow: 0 0 20rpx var(--accent-glow);
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar image {
  width: 100%;
  height: 100%;
}

.user-info {
  flex: 1;
  margin-left: var(--space-lg);
  min-width: 0;
}

.user-name {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.user-rank {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 16rpx;
  background: rgba(245, 158, 11, 0.1);
  border: 1rpx solid rgba(245, 158, 11, 0.2);
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #F59E0B;
  font-weight: 600;
}

.user-stats {
  display: flex;
  gap: var(--space-xl);
  margin-top: var(--space-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 22rpx;
  color: var(--text-muted);
}

/* 未登录状态 */
.user-card-guest {
  text-align: center;
  padding: var(--space-xl) 0;
}

.guest-icon {
  font-size: 80rpx;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.guest-text {
  font-size: 28rpx;
  color: var(--text-muted);
}

.login-btn {
  margin-top: var(--space-lg);
  padding: var(--space-md) var(--space-2xl);
  background: linear-gradient(145deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 85%, black));
  color: white;
  border-radius: var(--radius-md);
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: var(--shadow-accent);
}
```

- [ ] **Step 2: 提交**

```bash
cd D:/ClaudeCode/KapGame/frontend
git add components/userCard/userCard.wxss
git commit -m "refactor: 用户卡片组件重写为柔和玻璃双主题"
```

---

## Task 4: 重写主页 home.wxss

**Files:**
- Modify: `frontend/pages/home/home.wxss`

- [ ] **Step 1: 重写主页样式**

```wxss
/* ============================================
   对战主页样式
   设计风格：柔和玻璃 (Soft Glass)
   支持白天/黑夜模式自动切换
   ============================================ */

.home-container {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-void) 0%, var(--bg-deep) 50%, var(--bg-base) 100%);
  padding: var(--space-lg);
  padding-bottom: 120rpx;
  position: relative;
}

/* 顶部用户信息卡片 */
.home-header {
  margin-bottom: var(--space-xl);
}

/* 对战区域 */
.battle-section {
  margin-top: var(--space-xl);
}

.battle-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1rpx solid var(--glass-border);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

/* 匹配按钮 */
.match-btn {
  width: 100%;
  padding: var(--space-lg) 0;
  background: linear-gradient(145deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 85%, black));
  color: white;
  border-radius: var(--radius-md);
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
  box-shadow: var(--shadow-accent);
  transition: all 0.2s ease;
}

.match-btn:active {
  transform: scale(0.98);
  box-shadow: none;
}

/* 快速对战 */
.quick-battle {
  margin-top: var(--space-xl);
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.battle-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.battle-item {
  display: flex;
  align-items: center;
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1rpx solid var(--border-hairline);
  transition: all 0.2s ease;
}

.battle-item:active {
  background: var(--bg-hover);
  transform: scale(0.98);
  border-color: var(--accent-primary);
}

.battle-icon {
  font-size: 48rpx;
  margin-right: var(--space-lg);
}

.battle-info {
  flex: 1;
}

.battle-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4rpx;
}

.battle-desc {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.battle-arrow {
  color: var(--text-muted);
  font-size: 36rpx;
}
```

- [ ] **Step 2: 提交**

```bash
cd D:/ClaudeCode/KapGame/frontend
git add pages/home/home.wxss
git commit -m "refactor: 对战主页重写为柔和玻璃双主题"
```

---

## Task 5: 重写聊天页 chat.wxss

**Files:**
- Modify: `frontend/pages/chat/chat.wxss`

- [ ] **Step 1: 重写聊天页样式**

```wxss
/* ============================================
   消息页样式
   设计风格：柔和玻璃 (Soft Glass)
   支持白天/黑夜模式自动切换
   ============================================ */

.chat-container {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-void) 0%, var(--bg-deep) 50%, var(--bg-base) 100%);
  padding: 0 var(--space-lg) var(--space-xl);
  padding-top: var(--space-lg);
  position: relative;
}

/* Tab切换 */
.tabs {
  display: flex;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-xl);
  padding: 8rpx;
  border: 1rpx solid var(--glass-border);
  position: relative;
  z-index: 1;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: var(--space-md) 0;
  font-size: 30rpx;
  color: var(--text-muted);
  position: relative;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-item.active {
  color: var(--accent-primary);
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 5rpx;
  background: var(--accent-primary);
  border-radius: 3rpx;
  opacity: 0;
  transition: all 0.3s ease;
  box-shadow: 0 0 15rpx var(--accent-glow);
}

.tab-item.active .tab-indicator {
  opacity: 1;
}

/* 消息列表 */
.messages-list {
  height: calc(100vh - 320rpx);
  position: relative;
  z-index: 1;
}

.message-item {
  display: flex;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  border: 1rpx solid var(--glass-border);
  transition: all 0.2s ease;
}

.message-item:active {
  transform: scale(0.98);
  border-color: var(--accent-primary);
}

.message-avatar {
  position: relative;
  margin-right: var(--space-lg);
  flex-shrink: 0;
}

.message-avatar image {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 3rpx solid var(--border-default);
}

.message-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background: linear-gradient(145deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 85%, black));
  color: white;
  font-size: 22rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 4rpx solid var(--bg-base);
  box-shadow: var(--shadow-accent);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.message-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.message-time {
  font-size: 24rpx;
  color: var(--text-muted);
}

.message-preview {
  font-size: 26rpx;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.message-arrow {
  font-size: 48rpx;
  color: var(--text-muted);
  margin-left: var(--space-md);
}

/* 好友列表 */
.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  position: relative;
  z-index: 1;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: 40rpx;
  padding: 0 var(--space-lg);
  height: 80rpx;
  display: flex;
  align-items: center;
  border: 1rpx solid var(--glass-border);
}

.search-input-wrapper:focus-within {
  border-color: var(--accent-primary);
}

.search-icon {
  font-size: 34rpx;
  color: var(--text-muted);
  margin-right: var(--space-sm);
}

.search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: var(--text-primary);
}

.search-add-btn {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(145deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 85%, black));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-accent);
}

.add-icon {
  color: white;
  font-size: 40rpx;
  font-weight: bold;
}

/* 好友列表 */
.friends-list {
  height: calc(100vh - 420rpx);
  position: relative;
  z-index: 1;
}

.friend-item {
  display: flex;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  border: 1rpx solid var(--glass-border);
  transition: all 0.2s ease;
}

.friend-item:active {
  transform: scale(0.98);
  border-color: var(--accent-primary);
}

.friend-avatar {
  position: relative;
  margin-right: var(--space-lg);
  flex-shrink: 0;
}

.friend-avatar image {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 3rpx solid var(--border-default);
}

.online-dot {
  width: 24rpx;
  height: 24rpx;
  background: #10B981;
  border-radius: 50%;
  position: absolute;
  bottom: 0;
  right: 0;
  border: 4rpx solid var(--bg-base);
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.friend-status {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 4rpx;
}

.chat-btn {
  background: linear-gradient(145deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 85%, black));
  color: white;
  font-size: 26rpx;
  font-weight: 600;
  padding: 14rpx 28rpx;
  border-radius: 24rpx;
  box-shadow: var(--shadow-accent);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) 0;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: var(--space-lg);
  opacity: 0.4;
}

.empty-text {
  font-size: 30rpx;
  color: var(--text-muted);
}
```

- [ ] **Step 2: 提交**

```bash
cd D:/ClaudeCode/KapGame/frontend
git add pages/chat/chat.wxss
git commit -m "refactor: 消息页重写为柔和玻璃双主题"
```

---

## Task 6: 重写登录页 login.wxss

**Files:**
- Modify: `frontend/pages/login/login.wxss`

- [ ] **Step 1: 重写登录页样式**

```wxss
/* ============================================
   登录页样式
   设计风格：柔和玻璃 (Soft Glass)
   支持白天/黑夜模式自动切换
   ============================================ */

.login-container {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-void) 0%, var(--bg-deep) 50%, var(--bg-base) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-lg);
  box-sizing: border-box;
  position: relative;
}

/* Logo区域 */
.login-logo {
  margin-bottom: var(--space-2xl);
  text-align: center;
  position: relative;
  z-index: 1;
}

.logo-icon {
  font-size: 120rpx;
  margin-bottom: var(--space-lg);
  display: block;
  filter: drop-shadow(0 0 30rpx var(--accent-glow));
}

.logo-title {
  font-size: 56rpx;
  font-weight: 900;
  color: var(--accent-primary);
  text-shadow: 0 0 40rpx var(--accent-glow);
  letter-spacing: 8rpx;
}

.logo-subtitle {
  font-size: 26rpx;
  color: var(--text-muted);
  margin-top: var(--space-sm);
  letter-spacing: 4rpx;
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 600rpx;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl) var(--space-xl);
  border: 1rpx solid var(--glass-border);
  box-shadow: var(--shadow-card);
  position: relative;
  z-index: 1;
}

/* 顶部渐变装饰线 */
.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 3rpx;
  background: linear-gradient(90deg, transparent, var(--accent-primary), var(--accent-secondary), transparent);
  box-shadow: 0 0 30rpx var(--accent-glow);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.login-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.login-subtitle {
  font-size: 26rpx;
  color: var(--text-muted);
}

/* 输入框组 */
.input-group {
  margin-bottom: var(--space-lg);
}

.input-label {
  display: block;
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
  font-weight: 500;
}

.input-field {
  width: 100%;
  background: var(--bg-elevated);
  border: 2rpx solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  color: var(--text-primary);
  font-size: 30rpx;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 30rpx var(--accent-glow);
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  background: linear-gradient(145deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 85%, black));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
  box-shadow: var(--shadow-accent);
  transition: all 0.2s ease;
  margin-top: var(--space-lg);
  letter-spacing: 4rpx;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: none;
}

/* 切换链接 */
.switch-area {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1rpx solid var(--border-hairline);
}

.switch-text {
  font-size: 28rpx;
  color: var(--text-muted);
}

.switch-link {
  font-size: 28rpx;
  color: var(--accent-primary);
  font-weight: 600;
  margin-left: var(--space-sm);
}

/* 底部信息 */
.login-footer {
  margin-top: var(--space-2xl);
  text-align: center;
  position: relative;
  z-index: 1;
}

.footer-text {
  font-size: 24rpx;
  color: var(--text-dim);
  line-height: 1.8;
}
```

- [ ] **Step 2: 提交**

```bash
cd D:/ClaudeCode/KapGame/frontend
git add pages/login/login.wxss
git commit -m "refactor: 登录页重写为柔和玻璃双主题"
```

---

## Task 7: 更新 app.json tabBar 颜色

**Files:**
- Modify: `frontend/app.json`

- [ ] **Step 1: 更新 tabBar 颜色**

```json
{
  "pages": [
    "pages/shop/shop",
    "pages/home/home",
    "pages/chat/chat",
    "pages/login/login",
    "pages/lobby/lobby",
    "pages/game/game"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#0F1419",
    "navigationBarTitleText": "时序裂隙",
    "navigationBarTextStyle": "white"
  },
  "tabBar": {
    "color": "#64748B",
    "selectedColor": "#0EA5E9",
    "backgroundColor": "#0F1419",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/shop/shop",
        "text": "商城",
        "iconPath": "images/tab/shop.png",
        "selectedIconPath": "images/tab/shop-active.png"
      },
      {
        "pagePath": "pages/home/home",
        "text": "对战",
        "iconPath": "images/tab/home.png",
        "selectedIconPath": "images/tab/home-active.png"
      },
      {
        "pagePath": "pages/chat/chat",
        "text": "消息",
        "iconPath": "images/tab/chat.png",
        "selectedIconPath": "images/tab/chat-active.png"
      }
    ]
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 2: 提交**

```bash
cd D:/ClaudeCode/KapGame/frontend
git add app.json
git commit -m "refactor: 更新tabBar颜色为柔和玻璃主题配色"
```

---

## 自检清单

完成所有任务后，确认：

- [ ] 白天模式：背景雪白，卡片毛玻璃，文字深色，清晰可读
- [ ] 黑夜模式：背景深蓝黑，卡片半透明，文字浅色，柔和不刺眼
- [ ] 模块颜色渐变饱满，图标内陷效果，文字纯白清晰
- [ ] 所有页面使用统一的设计语言
- [ ] 无 AI 紫色残留
- [ ] 字体不透明，可读性良好

---

**Plan complete.** 实现计划已保存到 `docs/superpowers/plans/2026-04-18-frontend-theme-redesign-plan.md`

两个执行选项：

**1. Subagent-Driven (recommended)** - 每个任务由新的 subagent 执行，任务间有审查，快速迭代

**2. Inline Execution** - 在当前会话执行，使用 executing-plans，批量执行带检查点

选择哪个方式？