<template>
  <div class="activity-manage-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>活动管理</h1>
        <p>管理系统中的所有活动</p>
      </div>
      <el-button type="primary" @click="router.push('/activities/edit')">
        <el-icon><Plus /></el-icon>
        创建活动
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table
        :data="activities"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="activityType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.activityType }}</el-tag>
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
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" effect="light">
              {{ row.status === 'ACTIVE' ? '进行中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="router.push(`/activities/${row.id}/edit`)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" text size="small" @click="deleteActivity(row)">
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getActivities, deleteActivity as deleteActivityApi } from '@/apis/activityAdmin'
import { formatDateTime } from '@/utils/format'

const router = useRouter()

const activities = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadActivities = async () => {
  loading.value = true
  try {
    const res = await getActivities({ page: pagination.page - 1, size: pagination.pageSize })
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
  loadActivities()
})
</script>

<style scoped>
.activity-manage-container {
  max-width: 1400px;
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

/* 页面标题区 */
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
</style>
