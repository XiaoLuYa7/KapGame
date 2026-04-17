<template>
  <div class="activity-edit-container">
    <div class="edit-header">
      <h1>{{ isEdit ? '编辑活动' : '创建活动' }}</h1>
      <p>{{ isEdit ? '修改活动信息' : '创建新的活动' }}</p>
    </div>
    <el-card class="form-card">
        <el-form :model="form" label-width="120px" :rules="rules" ref="formRef" class="activity-form">
          <div class="form-section-title">基本信息</div>

          <el-form-item label="活动标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入活动标题" />
          </el-form-item>

          <el-form-item label="活动描述">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入活动描述" />
          </el-form-item>

          <el-form-item label="活动类型" prop="activityType">
            <el-select v-model="form.activityType" placeholder="请选择活动类型">
              <el-option v-for="item in getDict('activity_type')" :key="item.code" :label="`${item.code}-${item.value}`" :value="item.code" />
            </el-select>
          </el-form-item>

          <el-form-item label="活动时间" required>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              @change="handleDateChange"
            />
          </el-form-item>

          <el-form-item label="活动图片">
            <el-input v-model="form.imageUrl" placeholder="请输入活动图片URL" />
          </el-form-item>

          <el-form-item label="排序">
            <el-input-number v-model="form.sortOrder" :min="0" />
          </el-form-item>

          <el-form-item label="状态">
            <el-switch
              v-model="form.status"
              active-value="ACTIVE"
              inactive-value="INACTIVE"
            />
          </el-form-item>

          <div class="form-divider"></div>
          <div class="form-section-title">奖励配置</div>

          <div v-if="!form.activityType" class="reward-tip">
            请先选择活动类型
          </div>
          <div v-else>
            <div class="reward-header">
              <el-tag type="info">{{ rewardTypeLabel }}</el-tag>
              <span class="reward-hint">{{ rewardHint }}</span>
            </div>

            <el-table :data="rewardList" stripe class="reward-table">
              <el-table-column :label="conditionColumnLabel" prop="conditionValue" width="150" />
              <el-table-column v-if="form.activityType === 'DOUBLE'" label="封顶金额(元)" prop="sortOrder" width="150" />
              <el-table-column label="奖励类型" prop="rewardType" width="150">
                <template #default="{ row }">{{ getRewardTypeLabel(row.rewardType) }}</template>
              </el-table-column>
              <el-table-column v-if="form.activityType !== 'DOUBLE'" label="奖励值" prop="rewardValue" width="120" />
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

          <div class="form-actions">
            <el-button @click="router.back()">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitting">
              保存
            </el-button>
          </div>
        </el-form>

        <el-dialog v-model="rewardDialogVisible" :title="editingRewardIndex >= 0 ? '编辑档位' : '添加档位'" width="500px">
          <el-form :model="rewardForm" label-width="100px">
            <el-form-item v-if="form.activityType === 'SIGNIN'" label="签到天数">
              <el-input-number v-model="rewardForm.conditionValue" :min="1" :step="1" />
            </el-form-item>
            <el-form-item v-if="form.activityType === 'RECHARGE'" label="充值门槛">
              <el-input-number v-model="rewardForm.conditionValue" :min="0" :precision="0" /> 元
            </el-form-item>
            <el-form-item v-if="form.activityType === 'GIFT'" label="礼包价格">
              <el-input-number v-model="rewardForm.conditionValue" :min="0" :precision="0" /> 元
            </el-form-item>
            <el-form-item v-if="form.activityType === 'DOUBLE'" label="起始金额">
              <el-input-number v-model="rewardForm.conditionValue" :min="0" :precision="0" /> 元
            </el-form-item>
            <el-form-item v-if="form.activityType === 'DOUBLE'" label="封顶金额">
              <el-input-number v-model="rewardForm.sortOrder" :min="0" :precision="0" /> 元（双倍区间上限）
            </el-form-item>

            <el-form-item label="奖励类型">
              <el-select v-model="rewardForm.rewardType" placeholder="请选择">
                <el-option v-for="item in getDict('reward_type')" :key="item.code" :label="`${item.code}-${item.value}`" :value="item.code" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="form.activityType !== 'DOUBLE'" label="奖励值">
              <el-input-number v-model="rewardForm.rewardValue" :min="0" :precision="0" />
            </el-form-item>
            <el-form-item v-if="form.activityType === 'DOUBLE'">
              <span class="reward-double-tip">充值金额在区间内，奖励自动翻倍</span>
            </el-form-item>

            <el-form-item label="描述">
              <el-input v-model="rewardForm.rewardDesc" placeholder="如：第7天签到奖励100钻石" />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="rewardDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmReward">确定</el-button>
          </template>
        </el-dialog>
      </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getActivity, createActivity, updateActivity, getActivityRewards, addActivityReward, deleteActivityReward } from '@/apis/activityAdmin'
import { useDict } from '@/composables/useDict'

const router = useRouter()
const route = useRoute()
const { loadDict, getDict, getDictLabel, getDictCodeLabel } = useDict()

const isEdit = computed(() => !!route.params.id)
const activityId = computed(() => route.params.id)

const formRef = ref(null)
const submitting = ref(false)
const dateRange = ref([])

const form = reactive({
  title: '',
  description: '',
  activityType: 'SIGNIN',
  startTime: null,
  endTime: null,
  imageUrl: '',
  sortOrder: 0,
  status: 'ACTIVE'
})

const rules = {
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  activityType: [{ required: true, message: '请选择活动类型', trigger: 'change' }]
}

const handleDateChange = (val) => {
  if (val) {
    form.startTime = val[0]
    form.endTime = val[1]
  } else {
    form.startTime = null
    form.endTime = null
  }
}

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

const submitForm = async () => {
  try {
    await formRef.value.validate()
    if (rewardList.value.length === 0) {
      ElMessage.warning('请至少添加一个奖励档位')
      return
    }
    submitting.value = true
    if (isEdit.value) {
      await updateActivity(activityId.value, form)
      const oldRewards = await getActivityRewards(activityId.value)
      for (const r of (oldRewards.data || [])) {
        await deleteActivityReward(activityId.value, r.id)
      }
      for (const reward of rewardList.value) {
        await addActivityReward(activityId.value, reward)
      }
      ElMessage.success('更新成功')
    } else {
      const res = await createActivity(form)
      const newId = res.data?.id
      if (newId) {
        for (const reward of rewardList.value) {
          await addActivityReward(newId, reward)
        }
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

const rewardList = ref([])

const getRewardTypeLabel = (code) => getDictCodeLabel('reward_type', code)

const conditionColumnLabel = computed(() => {
  const map = {
    SIGNIN: '签到天数',
    RECHARGE: '充值门槛(元)',
    GIFT: '礼包价格(元)',
    DOUBLE: '起始金额(元)'
  }
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
    DOUBLE: '充值金额在起始~封顶区间内，奖励自动翻倍'
  }
  return map[form.activityType] || ''
})

const editingRewardIndex = ref(-1)

const rewardDialogVisible = ref(false)
const rewardForm = reactive({
  rewardType: 'DIAMOND',
  rewardValue: 0,
  rewardDesc: '',
  conditionType: '',
  conditionValue: 0,
  sortOrder: 0
})

const removeReward = (index) => {
  rewardList.value.splice(index, 1)
}

const editReward = (row, index) => {
  editingRewardIndex.value = index
  Object.assign(rewardForm, row)
  rewardDialogVisible.value = true
}

const showRewardDialog = () => {
  editingRewardIndex.value = -1
  Object.assign(rewardForm, { rewardType: 'DIAMOND', rewardValue: 0, rewardDesc: '', conditionType: '', conditionValue: 0, sortOrder: 0 })
  rewardDialogVisible.value = true
}

const confirmReward = () => {
  const conditionMap = { SIGNIN: 'DAY', RECHARGE: 'AMOUNT', GIFT: 'PRICE', DOUBLE: 'PRICE' }
  rewardForm.conditionType = conditionMap[form.activityType]

  if (editingRewardIndex.value >= 0) {
    rewardList.value.splice(editingRewardIndex.value, 1, { ...rewardForm })
    editingRewardIndex.value = -1
  } else {
    rewardList.value.push({ ...rewardForm })
  }
  rewardDialogVisible.value = false
  Object.assign(rewardForm, { rewardType: 'DIAMOND', rewardValue: 0, rewardDesc: '', conditionType: '', conditionValue: 0, sortOrder: 0 })
}

onMounted(() => {
  loadDict(['activity_type', 'reward_type'])
  loadActivity()
})
</script>

<style scoped>
.activity-edit-container {
  max-width: 900px;
  margin: 0 auto;
}

.edit-header {
  margin-bottom: 20px;
}

.edit-header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px;
}

.edit-header p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.activity-form {
  padding-right: 8px;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.form-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 24px 0;
}

:deep(.el-card) {
  overflow: visible;
}

:deep(.el-card__body) {
  overflow: visible;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

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

.reward-double-tip {
  color: #e6a23c;
  font-size: 13px;
  background: #fdf6ec;
  padding: 8px 12px;
  border-radius: 4px;
  display: block;
}

.reward-table {
  margin-bottom: 16px;
}

.reward-actions {
  display: flex;
  justify-content: flex-start;
}

/* 页面标题区 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title h1 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.page-title p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 编辑页面通用样式 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-default);
}
</style>
