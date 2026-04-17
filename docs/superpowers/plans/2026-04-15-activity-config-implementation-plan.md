# 活动配置功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为管理后台`ActivityEdit.vue`增加活动配置（奖励档位）功能，支持四种活动类型（签到/充值/限时礼包/充值双倍）的差异化奖励配置。

**Architecture:** 重构`ActivityEdit.vue`为Tab布局（基本信息 + 奖励配置），奖励配置Tab根据活动类型动态渲染。API层已完整（`activityAdmin.js`），无需后端修改。

**Tech Stack:** Vue 3 (Composition API) + Element Plus + 现有`activityAdmin.js` API模块

---

## 文件影响范围

| 文件 | 操作 | 职责 |
|------|------|------|
| `admin-frontend/views/activities/ActivityEdit.vue` | 修改 | 重构为Tab布局 + 奖励配置Tab |
| `admin-frontend/apis/activityAdmin.js` | 无需修改 | API已完整 |
| `admin-frontend/views/activities/ActivityList.vue` | 可选小改 | 加入奖励数量显示 |

---

## 阶段一：准备——重构表单骨架（Tab布局）

### Task 1: 将 `ActivityEdit.vue` 从单表单改为 Tab 布局

**文件:** `admin-frontend/views/activities/ActivityEdit.vue`

- [ ] **Step 1: 读取现有完整文件**

```bash
cat -n admin-frontend/views/activities/ActivityEdit.vue
```

- [ ] **Step 2: 用 Tab 布局替换当前单表单结构**

将 `<el-form>` 结构放入 `<el-tabs>` 中，Tab1 为「基本信息」，Tab2 为「奖励配置」：

```vue
<template>
  <div class="activity-edit-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>{{ isEdit ? '编辑活动' : '创建活动' }}</h1>
        <p>{{ isEdit ? '修改活动信息' : '创建新的活动' }}</p>
      </div>
    </div>

    <el-card class="form-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <!-- 当前全部表单内容移至此 -->
        </el-tab-pane>
        <el-tab-pane label="奖励配置" name="rewards">
          <!-- 奖励配置内容后续添加 -->
        </el-tab-pane>
      </el-tabs>

      <div class="form-actions">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </div>
    </el-card>
  </div>
</template>
```

- [ ] **Step 3: 添加 `activeTab` 响应式变量**

```js
const activeTab = ref('basic')
```

- [ ] **Step 4: 保存并确认Tab切换正常**
- [ ] **Step 5: 提交 commit**

```bash
git add admin-frontend/views/activities/ActivityEdit.vue
git commit -m "refactor: add tab layout skeleton to ActivityEdit.vue"
```

---

## 阶段二：奖励配置Tab——奖励类型与条件联动

### Task 2: 在奖励配置 Tab 中添加奖励类型选择和档位表格

**文件:** `admin-frontend/views/activities/ActivityEdit.vue:奖励配置Tab区域`

- [ ] **Step 1: 在 `rewards` Tab 中添加奖励类型选择说明**

```vue
<el-tab-pane label="奖励配置" name="rewards">
  <div v-if="!form.activityType" class="reward-tip">
    请先在「基本信息」中选择活动类型
  </div>
  <div v-else class="reward-config">
    <div class="reward-header">
      <el-tag type="info">{{ rewardTypeLabel }}</el-tag>
      <span class="reward-hint">{{ rewardHint }}</span>
    </div>

    <el-table :data="rewardList" stripe class="reward-table">
      <el-table-column :label="conditionColumnLabel" prop="conditionValue" width="150" />
      <el-table-column label="奖励类型" prop="rewardType" width="150">
        <template #default="{ row }">{{ rewardTypeLabelMap[row.rewardType] }}</template>
      </el-table-column>
      <el-table-column label="奖励值" prop="rewardValue" width="120" />
      <el-table-column label="描述" prop="rewardDesc" min-width="200" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row, $index }">
          <el-button type="primary" text size="small" @click="editReward(row, $index)">编辑</el-button>
          <el-button type="danger" text size="small" @click="removeReward($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="reward-actions">
      <el-button type="primary" @click="showRewardDialog()">添加档位</el-button>
    </div>
  </div>
</el-tab-pane>
```

- [ ] **Step 2: 添加相关响应式数据**

```js
const activeTab = ref('basic')
const rewardList = ref([]) // 当前奖励档位列表

// 奖励类型映射
const rewardTypeLabelMap = {
  DIAMOND: '钻石',
  GOLD: '金币',
  CARD_SKIN: '卡牌皮肤',
  GIFT_BOX: '礼包'
}

// 各活动类型的条件字段标签
const conditionColumnLabel = computed(() => {
  const map = { SIGNIN: '签到天数', RECHARGE: '充值门槛(元)', GIFT: '礼包价格(元)', DOUBLE: '起始金额(元)' }
  return map[form.activityType] || '条件值'
})

const rewardTypeLabel = computed(() => {
  const map = { SIGNIN: '签到奖励', RECHARGE: '充值奖励', GIFT: '礼包奖励', DOUBLE: '双倍奖励' }
  return map[form.activityType] || ''
})

const rewardHint = computed(() => {
  const map = {
    SIGNIN: '添加不同签到天数的奖励，天数必须递增',
    RECHARGE: '添加累计充值金额档位，金额必须递增',
    GIFT: '添加礼包价格档位',
    DOUBLE: '添加充值双倍区间'
  }
  return map[form.activityType] || ''
})
```

- [ ] **Step 3: 添加 `editReward`、`removeReward` 方法**

```js
const editingRewardIndex = ref(-1)

const removeReward = (index) => {
  rewardList.value.splice(index, 1)
}

const editReward = (row, index) => {
  editingRewardIndex.value = index
  Object.assign(rewardForm, row)
  rewardDialogVisible.value = true
}
```

- [ ] **Step 4: 添加 `rewardDialogVisible` 和 `rewardForm`**

```js
const rewardDialogVisible = ref(false)
const rewardForm = reactive({
  rewardType: 'DIAMOND',
  rewardValue: 0,
  rewardDesc: '',
  conditionType: '',
  conditionValue: 0,
  sortOrder: 0
})
```

- [ ] **Step 5: 提交 commit**

```bash
git add admin-frontend/views/activities/ActivityEdit.vue
git commit -m "feat: add reward list table in reward config tab"
```

---

## 阶段三：奖励档位添加/编辑对话框

### Task 3: 实现奖励档位表单对话框（按活动类型动态字段）

**文件:** `admin-frontend/views/activities/ActivityEdit.vue:rewardDialog`

- [ ] **Step 1: 在 `</el-tab-pane>` 前添加对话框**

```vue
<el-dialog v-model="rewardDialogVisible" :title="editingRewardIndex >= 0 ? '编辑档位' : '添加档位'" width="500px">
  <el-form :model="rewardForm" label-width="100px">
    <!-- SIGNIN: 签到天数 -->
    <el-form-item v-if="form.activityType === 'SIGNIN'" label="签到天数">
      <el-input-number v-model="rewardForm.conditionValue" :min="1" :step="1" />
    </el-form-item>

    <!-- RECHARGE: 充值门槛 -->
    <el-form-item v-if="form.activityType === 'RECHARGE'" label="充值门槛">
      <el-input-number v-model="rewardForm.conditionValue" :min="0" :precision="0" /> 元
    </el-form-item>

    <!-- GIFT: 礼包价格 -->
    <el-form-item v-if="form.activityType === 'GIFT'" label="礼包价格">
      <el-input-number v-model="rewardForm.conditionValue" :min="0" :precision="0" /> 元
    </el-form-item>

    <!-- DOUBLE: 起始~封顶 -->
    <el-form-item v-if="form.activityType === 'DOUBLE'" label="起始金额">
      <el-input-number v-model="rewardForm.conditionValue" :min="0" :precision="0" /> 元
    </el-form-item>
    <el-form-item v-if="form.activityType === 'DOUBLE'" label="封顶金额">
      <el-input-number v-model="rewardForm.sortOrder" :min="0" :precision="0" /> 元（双倍区间上限）
    </el-form-item>

    <!-- 奖励类型（所有类型） -->
    <el-form-item label="奖励类型">
      <el-select v-model="rewardForm.rewardType" placeholder="请选择">
        <el-option label="钻石" value="DIAMOND" />
        <el-option label="金币" value="GOLD" />
        <el-option label="卡牌皮肤" value="CARD_SKIN" />
        <el-option label="礼包" value="GIFT_BOX" />
      </el-select>
    </el-form-item>

    <!-- 奖励值 -->
    <el-form-item label="奖励值">
      <el-input-number v-model="rewardForm.rewardValue" :min="0" :precision="0" />
    </el-form-item>

    <!-- 描述 -->
    <el-form-item label="描述">
      <el-input v-model="rewardForm.rewardDesc" placeholder="如：第7天签到奖励100钻石" />
    </el-form-item>
  </el-form>

  <template #footer>
    <el-button @click="rewardDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="confirmReward">确定</el-button>
  </template>
</el-dialog>
```

- [ ] **Step 2: 添加 `confirmReward` 方法**

```js
const confirmReward = () => {
  // 设置 conditionType
  const conditionMap = { SIGNIN: 'DAY', RECHARGE: 'AMOUNT', GIFT: 'PRICE', DOUBLE: 'PRICE' }
  rewardForm.conditionType = conditionMap[form.activityType]

  if (editingRewardIndex.value >= 0) {
    rewardList.value.splice(editingRewardIndex.value, 1, { ...rewardForm })
    editingRewardIndex.value = -1
  } else {
    rewardList.value.push({ ...rewardForm })
  }
  rewardDialogVisible.value = false
  // 重置表单
  Object.assign(rewardForm, { rewardType: 'DIAMOND', rewardValue: 0, rewardDesc: '', conditionType: '', conditionValue: 0, sortOrder: 0 })
}
```

- [ ] **Step 3: 添加 `showRewardDialog` 方法**

```js
const showRewardDialog = () => {
  editingRewardIndex.value = -1
  Object.assign(rewardForm, { rewardType: 'DIAMOND', rewardValue: 0, rewardDesc: '', conditionType: '', conditionValue: 0, sortOrder: 0 })
  rewardDialogVisible.value = true
}
```

- [ ] **Step 4: 添加样式**

```css
.reward-tip {
  color: #909399;
  padding: 20px;
  text-align: center;
}

.reward-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.reward-hint {
  color: #909399;
  font-size: 13px;
}

.reward-table {
  margin-bottom: 16px;
}

.reward-actions {
  display: flex;
  justify-content: flex-start;
}
```

- [ ] **Step 5: 提交 commit**

```bash
git add admin-frontend/views/activities/ActivityEdit.vue
git commit -m "feat: add reward dialog with dynamic fields per activity type"
```

---

## 阶段四：加载和保存逻辑

### Task 4: 编辑时加载奖励列表，保存时提交奖励档位

**文件:** `admin-frontend/views/activities/ActivityEdit.vue`

- [ ] **Step 1: 修改 `loadActivity`，增加奖励列表加载**

在 `loadActivity` 中，获取活动详情后调用 `getActivityRewards`：

```js
const loadActivity = async () => {
  if (!activityId.value) return
  try {
    const res = await getActivity(activityId.value)
    const data = res.data
    Object.assign(form, {
      title: data.title,
      description: data.description,
      activityType: data.activityType,
      startTime: data.startTime,
      endTime: data.endTime,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder,
      status: data.status
    })
    if (data.startTime && data.endTime) {
      dateRange.value = [new Date(data.startTime), new Date(data.endTime)]
    }
    // 加载奖励列表
    const rewardRes = await getActivityRewards(activityId.value)
    rewardList.value = rewardRes.data || []
  } catch (error) {
    ElMessage.error('获取活动信息失败')
  }
}
```

- [ ] **Step 2: 修改 `submitForm`，增加奖励档位验证和保存**

创建时：先创建 Activity，获取返回的 ID，再批量创建奖励档位：

```js
const submitForm = async () => {
  try {
    await formRef.value.validate()
    if (rewardList.value.length === 0) {
      ElMessage.warning('请至少添加一个奖励档位')
      activeTab.value = 'rewards'
      return
    }
    submitting.value = true
    if (isEdit.value) {
      await updateActivity(activityId.value, form)
      // 编辑时：先删除旧奖励，再批量添加新奖励
      // 先获取旧奖励列表逐个删除（或调deleteActivityReward）
      const oldRewards = await getActivityRewards(activityId.value)
      for (const r of (oldRewards.data || [])) {
        await deleteActivityReward(activityId.value, r.id)
      }
      // 批量添加新奖励
      for (const reward of rewardList.value) {
        await addActivityReward(activityId.value, reward)
      }
      ElMessage.success('更新成功')
    } else {
      const res = await createActivity(form)
      const newId = res.data?.id || activityId.value
      for (const reward of rewardList.value) {
        await addActivityReward(newId, reward)
      }
      ElMessage.success('创建成功')
    }
    router.push('/activities')
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}
```

- [ ] **Step 3: 导入新增的 API 方法**

```js
import { getActivity, createActivity, updateActivity, getActivityRewards, addActivityReward, deleteActivityReward } from '@/apis/activityAdmin'
```

注意：`deleteActivityReward` 在 `activityAdmin.js` 中定义为 `DELETE /admin/activities/{activityId}/rewards/{rewardId}`，需确认接口签名是否一致。

- [ ] **Step 4: 提交 commit**

```bash
git add admin-frontend/views/activities/ActivityEdit.vue
git commit -m "feat: load and save reward tiers in ActivityEdit"
```

---

## 阶段五：列表页可选改进

### Task 5: `ActivityList.vue` 中显示奖励档位数量（可选）

**文件:** `admin-frontend/views/activities/ActivityList.vue`

- [ ] **Step 1: 在奖励类型列后添加奖励档位数量列**

```vue
<el-table-column label="奖励档位数" width="100">
  <template #default="{ row }">
    <el-tag type="warning" effect="plain">{{ row.rewardCount || 0 }}</el-tag>
  </template>
</el-table-column>
```

- [ ] **Step 2: 在 `loadActivities` 中获取奖励数量**

由于列表接口目前不返回奖励数量，可暂时使用静态文本或预留接口扩展。**此任务为可选，不影响主流程。**

- [ ] **Step 3: 提交 commit（如实施）**

---

## 验证清单

- [ ] 创建 SIGNIN 活动：添加第1/7/30天三个签到档位，保存后在列表显示，编辑时奖励正确加载
- [ ] 创建 RECHARGE 活动：添加满100/500/1000元三个充值档位，保存后正确
- [ ] 创建 GIFT 活动：添加6/30/68元三个礼包档位
- [ ] 创建 DOUBLE 活动：添加0~100 / 100~500两个双倍区间档位
- [ ] 编辑已有活动：删除某个奖励档位、新增奖励档位，保存后正确
- [ ] 切换Tab正常，切换活动类型后奖励配置Tab的提示和字段正确变化
- [ ] 不填奖励档位时点击保存，提示"请至少添加一个奖励档位"

---

## 已知限制

1. 编辑时先删后增的原子性问题：若中途失败可能导致奖励丢失，建议后续改为后端批量删除/新增的事务接口
2. 列表页不显示奖励档位数量（可后续扩展）
