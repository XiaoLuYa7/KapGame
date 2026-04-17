<template>
  <div class="publish-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>发布管理</h1>
        <p>管理和查看系统配置发布记录</p>
      </div>
    </div>

    <el-card class="table-card">
      <el-form :model="publishForm" ref="publishFormRef" label-width="120px">
        <el-form-item label="发布说明">
          <el-input
            v-model="publishForm.description"
            type="textarea"
            placeholder="请输入发布说明"
            rows="4"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handlePublish" :loading="publishing">
            发布配置
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div v-if="latestPublish" class="latest-publish">
        <h4>最近发布</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发布时间">
            {{ formatDateTime(latestPublish.publishTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="发布人">
            {{ latestPublish.publishedBy }}
          </el-descriptions-item>
          <el-descriptions-item label="发布说明" :span="2">
            {{ latestPublish.description || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="publishStats" class="publish-stats">
        <h4>发布统计</h4>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="总发布次数" :value="publishStats.totalPublishes || 0" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="今日发布" :value="publishStats.todayPublishes || 0" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="本周发布" :value="publishStats.weekPublishes || 0" />
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card class="table-card">
      <div class="sub-header">
        <h3>发布历史</h3>
      </div>

      <el-table :data="publishHistory" stripe v-loading="historyLoading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="description" label="发布说明" />
        <el-table-column prop="publishedBy" label="发布人" />
        <el-table-column prop="publishTime" label="发布时间">
          <template #default="{ row }">
            {{ formatDateTime(row.publishTime) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { publishConfig, getPublishHistory, getLatestPublish, getPublishStats } from '@/apis/publish'

const publishFormRef = ref(null)
const publishForm = ref({
  description: '',
  publishedBy: '系统管理员'
})

const publishing = ref(false)
const historyLoading = ref(false)
const publishHistory = ref([])
const latestPublish = ref(null)
const publishStats = ref(null)

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const loadPublishHistory = async () => {
  historyLoading.value = true
  try {
    const res = await getPublishHistory()
    publishHistory.value = res.data || []
  } catch (error) {
    ElMessage.error('获取发布历史失败')
    console.error(error)
  } finally {
    historyLoading.value = false
  }
}

const loadLatestPublish = async () => {
  try {
    const res = await getLatestPublish()
    latestPublish.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const loadPublishStats = async () => {
  try {
    const res = await getPublishStats()
    publishStats.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handlePublish = async () => {
  publishing.value = true
  try {
    await publishConfig(publishForm.value)
    ElMessage.success('发布成功')
    publishForm.value.description = ''
    loadPublishHistory()
    loadLatestPublish()
    loadPublishStats()
  } catch (error) {
    ElMessage.error('发布失败')
    console.error(error)
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  loadPublishHistory()
  loadLatestPublish()
  loadPublishStats()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header-content h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-header-content p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.table-card {
  margin-bottom: 20px;
}

.latest-publish,
.publish-stats {
  margin-bottom: 20px;
}

.latest-publish h4,
.publish-stats h4 {
  margin-bottom: 15px;
  color: var(--text-primary);
}
</style>
