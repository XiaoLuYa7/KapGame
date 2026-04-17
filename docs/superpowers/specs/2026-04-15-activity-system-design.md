# 活动系统设计方案

## 1. 需求概述

设计一套通用的活动系统，支持以下活动类型：
- **签到活动**：关键天数可配置奖励
- **充值活动**：累计充值档位可配置
- **限时礼包**：多档位礼包可配置
- **充值双倍**：规定时间内充值双倍

所有活动在后台配置后发布生效，用户需手动领取奖励。

## 2. 数据库设计

### 2.1 新增表

#### activity 表（活动基础信息）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| title | VARCHAR(100) | 活动标题 |
| description | VARCHAR(500) | 活动描述 |
| image_url | VARCHAR(500) | 活动图片 |
| activity_type | VARCHAR(50) | 类型：SIGNIN/RECHARGE/GIFT/DOUBLE |
| start_time | DATETIME | 开始时间 |
| end_time | DATETIME | 结束时间 |
| status | VARCHAR(20) | 状态：ACTIVE/INACTIVE/EXPIRED |
| sort_order | INT | 排序 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |
| last_modified_by | VARCHAR(100) | 修改人 |
| last_modified_reason | VARCHAR(500) | 修改原因 |

#### activity_reward 表（奖励配置）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| activity_id | BIGINT | 关联activity |
| reward_type | VARCHAR(50) | 奖励类型：DIAMOND/GOLD/CARD_SKIN/GIFT_BOX |
| reward_value | INT | 奖励值（数量或ID） |
| condition_type | VARCHAR(50) | 条件类型：DAY/AMOUNT/PRICE |
| condition_value | INT | 条件值（签到天数/充值金额/礼包价格） |
| sort_order | INT | 排序 |
| create_time | DATETIME | 创建时间 |

#### user_activity 表（用户参与进度）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 关联user |
| activity_id | BIGINT | 关联activity |
| progress | INT | 当前进度（签到天数/累计充值） |
| status | VARCHAR(20) | 状态：DOING/COMPLETED |
| start_time | DATETIME | 参与时间 |
| update_time | DATETIME | 更新时间 |

#### user_reward 表（用户已领取记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 关联user |
| activity_id | BIGINT | 关联activity |
| reward_id | BIGINT | 关联activity_reward |
| claim_time | DATETIME | 领取时间 |

### 2.2 活动类型说明

| 类型 | 英文标识 | 说明 |
|------|----------|------|
| 签到活动 | SIGNIN | 每日签到，关键天数奖励 |
| 充值活动 | RECHARGE | 累计充值到档位领奖励 |
| 限时礼包 | GIFT | 限时多档位礼包 |
| 充值双倍 | DOUBLE | 规定时间内充值双倍 |

### 2.3 奖励类型说明

| 类型 | 英文标识 | 说明 |
|------|----------|------|
| 钻石 | DIAMOND | 直接发放 |
| 金币 | GOLD | 直接发放 |
| 皮肤 | CARD_SKIN | 发放皮肤给用户 |
| 礼盒 | GIFT_BOX | 发放礼盒（内含多个奖励） |

## 3. 后端设计

### 3.1 实体类
- Activity
- ActivityReward
- UserActivity
- UserReward

### 3.2 Repository
- ActivityRepository
- ActivityRewardRepository
- UserActivityRepository
- UserRewardRepository

### 3.3 Service
- ActivityService（活动CRUD、发布）
- UserActivityService（用户参与、领取奖励）

### 3.4 Controller
#### 管理后台
- `POST /admin/activities` - 创建活动
- `PUT /admin/activities/{id}` - 更新活动
- `DELETE /admin/activities/{id}` - 删除活动
- `POST /admin/activities/{id}/rewards` - 添加奖励配置
- `PUT /admin/activities/{id}/rewards/{rewardId}` - 更新奖励配置
- `DELETE /admin/activities/{id}/rewards/{rewardId}` - 删除奖励配置
- `POST /admin/activities/{id}/publish` - 发布活动

#### 小程序端
- `GET /api/activities` - 获取进行中的活动
- `GET /api/activities/{id}` - 获取活动详情
- `POST /api/activities/{id}/signin` - 签到
- `POST /api/activities/{id}/claim` - 领取奖励
- `GET /api/user/activities` - 获取用户参与的活动

## 4. 前端设计

### 4.1 管理后台
- 活动列表页（支持筛选活动类型）
- 活动编辑页（配置活动基础信息+奖励档位）
- 活动详情页（查看参与数据）

### 4.2 小程序端
- 活动列表页
- 活动详情页（签到/领取按钮）
- 奖励领取弹窗

## 5. 实现计划

分阶段实现：
1. 数据库表结构
2. 后端实体和基础CRUD
3. 管理后台前端
4. 小程序端API
5. 小程序端页面
