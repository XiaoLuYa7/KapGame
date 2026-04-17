# 活动配置功能设计方案

## 概述

为管理后台的活动管理模块增加活动配置功能，支持四种活动类型（签到、充值、限时礼包、充值双倍）的差异化奖励档位配置。

## 功能需求

### 四种活动类型

| 类型 | 类型值 | 条件字段 | 奖励字段 | 说明 |
|------|--------|---------|---------|------|
| 签到活动 | SIGNIN | 签到天数（DAY）| 奖励类型 + 奖励值 + 描述 | 连续签到天数档位 |
| 充值活动 | RECHARGE | 累计充值门槛（AMOUNT）| 奖励类型 + 奖励值 + 描述 | 累计充值金额档位 |
| 限时礼包 | GIFT | 礼包价格（PRICE）| 奖励类型 + 奖励值 + 描述 | 付费购买礼包 |
| 充值双倍 | DOUBLE | 起始金额~封顶金额（PRICE）| 奖励类型 + 奖励值 | 充值双倍区间 |

### 奖励类型选项

- DIAMOND（钻石）
- GOLD（金币）
- CARD_SKIN（卡牌皮肤）
- GIFT_BOX（礼包）

## 前端设计方案

### 页面：`ActivityEdit.vue`

采用 **Tab 布局**：

```
┌──────────────────────────────────────────────┐
│  [基本信息 Tab]  [奖励配置 Tab]              │
├──────────────────────────────────────────────┤
│  Tab 1 - 基本信息                            │
│  - 活动标题（必填）                          │
│  - 活动描述                                  │
│  - 活动图片 URL                              │
│  - 活动类型（SIGNIN/RECHARGE/GIFT/DOUBLE）   │
│  - 开始时间、结束时间                        │
│  - 排序、状态                               │
│                                              │
│  Tab 2 - 奖励配置（根据类型动态显示）          │
│  - 奖励档位列表（表格）                      │
│    SIGNIN: 天数 | 奖励类型 | 奖励值 | 描述    │
│    RECHARGE: 门槛 | 奖励类型 | 奖励值 | 描述  │
│    GIFT: 价格 | 奖励类型 | 奖励值 | 描述      │
│    DOUBLE: 起始~封顶 | 奖励类型 | 奖励值      │
│  - 「添加档位」按钮 → 弹出表单对话框          │
│  - 支持删除、编辑已有档位                    │
└──────────────────────────────────────────────┘
```

### 奖励档位表单对话框

点击「添加档位」弹出 `el-dialog`，字段根据活动类型动态变化：

**SIGNIN 签到活动**：
- 签到天数（数字输入）
- 奖励类型（下拉：钻石/金币/卡牌皮肤/礼包）
- 奖励值（数字输入）
- 奖励描述（文本输入）

**RECHARGE 充值活动**：
- 充值门槛/金额（下拉或数字输入，单位：元）
- 奖励类型（下拉）
- 奖励值（数字输入）
- 奖励描述（文本输入）

**GIFT 限时礼包**：
- 礼包价格（元）
- 奖励类型（下拉）
- 奖励值（数字输入）
- 奖励描述（文本输入，如"6元礼包：60钻石+10卡牌"）

**DOUBLE 充值双倍**：
- 起始金额（元，数字输入）
- 封顶金额（元，数字输入，表示双倍生效区间）
- 奖励类型（下拉，固定 DIAMOND）
- 奖励值（数字输入，双倍赠送量）

### 创建流程

在 `ActivityEdit.vue` 页面中：
- **基本信息 Tab** 和 **奖励配置 Tab** 同时存在
- 创建时：先选活动类型，在奖励配置 Tab 添加奖励档位
- 点击「保存」：先创建 Activity，再批量创建 ActivityReward 记录
- 若奖励档位为空，提示用户至少添加一个奖励档位

### 编辑流程

- 加载活动基本信息填充表单
- 加载该活动的奖励列表展示在奖励配置 Tab
- 支持新增、编辑、删除奖励档位
- 保存时同步更新

## 后端接口

### 已有接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /admin/activities | 分页列表 |
| GET | /admin/activities/{id} | 获取单个活动 |
| POST | /admin/activities | 创建活动 |
| PUT | /admin/activities/{id} | 更新活动 |
| DELETE | /admin/activities/{id} | 删除活动 |
| GET | /admin/activities/{id}/rewards | 获取活动奖励列表 |
| POST | /admin/activities/{id}/rewards | 添加奖励档位 |
| DELETE | /admin/activities/{id}/rewards/{rewardId} | 删除奖励档位 |

后端接口已完善，无需修改 Controller/Service。

### 接口请求体示例

**POST /admin/activities/{id}/rewards**（添加奖励档位）：

```json
{
  "rewardType": "DIAMOND",
  "rewardValue": 100,
  "rewardDesc": "第7天签到奖励",
  "conditionType": "DAY",
  "conditionValue": 7,
  "sortOrder": 7
}
```

## 数据模型

### Activity 实体（已有字段）

- `id`, `title`, `description`, `imageUrl`, `activityType`, `startTime`, `endTime`, `status`, `sortOrder`, `rewardType`, `rewardValue`（JSON）, `createTime`, `updateTime`, `lastModifiedBy`, `lastModifiedReason`

### ActivityReward 实体（已有字段）

- `id`, `activityId`, `rewardType`, `rewardValue`, `rewardDesc`, `conditionType`, `conditionValue`, `sortOrder`, `createTime`

## 实现范围

### 前端（Vue 3 + Element Plus）

1. `ActivityEdit.vue` 重构为 Tab 布局
2. 奖励配置 Tab：根据 `activityType` 动态渲染配置界面
3. 奖励档位表格：展示已有档位，支持编辑/删除
4. 添加档位对话框：根据类型动态生成表单字段
5. `ActivityList.vue`：可选择性加入快捷跳转至奖励配置的入口

### 后端（无需修改）

接口已完整，仅需确保 `ActivityServiceImpl.createActivity` 在创建活动后返回完整对象供前端获取 ID。

## 验证方式

- 创建 SIGNIN 类型活动，添加3个签到天数档位，保存后列表显示正确
- 创建 RECHARGE 类型活动，添加充值门槛档位，保存后正确
- 编辑已有活动，增删奖励档位，数据正确更新
- 切换活动类型后，奖励配置 Tab 的表单字段正确变化
