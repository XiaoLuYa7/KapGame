<template>
  <div class="config-list-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>配置管理</h1>
        <p>管理系统中的所有配置项</p>
      </div>
      <el-button type="primary" @click="router.push('/configs/edit')">
        创建配置
      </el-button>
    </div>

    <el-card class="table-card">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">配置键</span>
          <el-input
            v-model="filters.configKey"
            placeholder="请输入配置键"
            clearable
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">描述</span>
          <el-input
            v-model="filters.description"
            placeholder="请输入描述"
            clearable
          />
        </div>
        <div class="filter-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>

      <el-table :data="configs" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="configKey" label="配置键" show-overflow-tooltip />
        <el-table-column prop="configValue" label="配置值" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="是否公开" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isPublic ? 'success' : 'info'">
              {{ row.isPublic ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="router.push(`/configs/${row.id}/edit`)">编辑</el-button>
            <el-button type="danger" text size="small" @click="deleteConfig(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 20px; text-align: right"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="pagination.total > 10 ? [10, 20, 50] : []"
        layout="total, sizes, prev, pager, next"
        @size-change="loadConfigs"
        @current-change="loadConfigs"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getConfigs, deleteConfig as deleteConfigApi } from '@/apis/configs'

const router = useRouter()

const configs = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const filters = reactive({
  configKey: '',
  description: ''
})

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const loadConfigs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page - 1,
      size: pagination.pageSize
    }
    if (filters.configKey) {
      params.configKey = filters.configKey
    }
    if (filters.description) {
      params.description = filters.description
    }
    const res = await getConfigs(params)
    configs.value = res.data.content || res.data
    pagination.total = res.data.totalElements || 0
  } catch (error) {
    ElMessage.error('获取配置列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  loadConfigs()
}

const handleSearch = () => {
  pagination.page = 1
  loadConfigs()
}

const resetFilters = () => {
  filters.configKey = ''
  filters.description = ''
  pagination.page = 1
  loadConfigs()
}

const deleteConfig = (row) => {
  ElMessageBox.confirm('确认删除该配置吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteConfigApi(row.id)
    ElMessage.success('删除成功')
    loadConfigs()
  }).catch(() => {})
}

onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.config-list-container {
  max-width: 1400px;
}

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
  color: #1E293B;
}

.page-header-content p {
  margin: 0;
  font-size: 14px;
  color: #64748B;
}

.table-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.filter-item .el-input {
  width: 160px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
