<template>
  <div class="activity-list-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>活动管理</h1>
        <p>管理系统中的所有活动</p>
      </div>
      <el-button v-if="canCreate" type="primary" @click="router.push('/activities/edit')">
        <el-icon><Plus /></el-icon>
        创建活动
      </el-button>
    </div>

    <el-card class="table-card">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">开始时间</span>
          <el-date-picker
            v-model="filters.startTime"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">状态</span>
          <el-select v-model="filters.status" placeholder="选择状态" clearable>
            <el-option v-for="item in getDict('activity_status')" :key="item.code" :label="`${item.code}-${item.value}`" :value="item.code" />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>

      <el-table
        :data="activities"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="activityType" label="类型" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="info">{{ activityTypeLabel(row.activityType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="活动图片" width="90">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              fit="cover"
              style="width: 50px; height: 50px; border-radius: 4px;"
            >
              <template #error>
                <div style="width: 50px; height: 50px; border-radius: 4px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                  <el-icon :size="20" color="#ccc"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column label="奖励项数" width="100">
          <template #default="{ row }">
            <el-tag type="warning" effect="plain">{{ row.rewardCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" min-width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatDateTime(row.startTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" min-width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatDateTime(row.endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" effect="light">
              {{ getDictCodeLabel('activity_status', row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="hasAnyAction" label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button v-if="canEdit" type="primary" text size="small" @click="router.push(`/activities/${row.id}/edit`)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button v-if="canDelete" type="danger" text size="small" @click="deleteActivity(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="pagination.total > 10 ? [10, 20, 50] : []"
          layout="total, sizes, prev, pager, next"
          @size-change="loadActivities"
          @current-change="loadActivities"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Calendar, Picture } from '@element-plus/icons-vue'
import { getActivities, deleteActivity as deleteActivityApi } from '@/apis/activities'
import { formatDateTime } from '@/utils/format'
import { useDict } from '@/composables/useDict'
import { hasFunctionPermission } from '@/utils/permission'

const router = useRouter()
const { loadDict, getDict, getDictLabel, getDictCodeLabel } = useDict()

// 权限检查 - 使用 computed 确保响应式
const canCreate = computed(() => hasFunctionPermission('ACTIVITY:CREATE'))
const canEdit = computed(() => hasFunctionPermission('ACTIVITY:EDIT'))
const canDelete = computed(() => hasFunctionPermission('ACTIVITY:DELETE'))
const hasAnyAction = computed(() => canEdit.value || canDelete.value)

const activityTypeLabel = (type) => getDictCodeLabel('activity_type', type)

const activities = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const filters = reactive({
  startTime: '',
  status: ''
})

const handleSearch = () => {
  pagination.page = 1
  loadActivities()
}

const resetFilters = () => {
  filters.startTime = ''
  filters.status = ''
  pagination.page = 1
  loadActivities()
}

const loadActivities = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page - 1,
      size: pagination.pageSize
    }
    if (filters.startTime) {
      params.startTime = filters.startTime
    }
    if (filters.status) {
      params.status = filters.status
    }
    const res = await getActivities(params)
    activities.value = res.data.content || res.data
    pagination.total = res.data.totalElements || 0
  } catch (error) {
    ElMessage.error('获取活动列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const deleteActivity = (row) => {
  ElMessageBox.confirm(`确定要删除活动 "${row.title}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteActivityApi(row.id)
    ElMessage.success('删除成功')
    loadActivities()
  }).catch(() => {})
}

onMounted(() => {
  loadDict(['activity_status', 'activity_type'])
  loadActivities()
})
</script>

<style scoped>
.activity-list-container {
  max-width: 1400px;
  overflow-x: auto;
}

.filter-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  color: var(--text-secondary);
  font-size: 14px;
  white-space: nowrap;
}

.filter-item .el-date-picker {
  width: 150px;
}

.filter-item .el-select {
  width: 150px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.time-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 0;
}

.action-buttons .el-button {
  padding: 2px 4px;
  font-size: 12px;
}

.action-buttons .el-button .el-icon {
  margin-right: 0;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>
