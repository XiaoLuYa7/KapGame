<template>
  <div class="admin-user-list-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>管理员管理</h1>
        <p>管理系统中的所有管理员用户</p>
      </div>
      <el-button type="primary" @click="router.push('/admin-users/add')">创建管理员</el-button>
    </div>

    <el-card class="table-card">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">用户名</span>
          <el-input
            v-model="filters.keyword"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>

      <el-table :data="adminUsers" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="realName" label="真实姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column label="角色">
          <template #default="{ row }">
            {{ row.role?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === 'ACTIVE' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="router.push(`/admin-users/${row.id}/edit`)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAdminUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 20px; text-align: right"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="pagination.total > 10 ? [10, 20, 50] : []"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @current-change="loadAdminUsers"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUsers, deleteAdminUser as deleteAdminUserApi } from '@/apis/adminUsers'

const router = useRouter()

const adminUsers = ref([])
const loading = ref(false)
const filters = ref({
  keyword: ''
})
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const loadAdminUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page - 1,
      size: pagination.value.pageSize
    }
    if (filters.value.keyword) {
      params.keyword = filters.value.keyword
    }
    const res = await getAdminUsers(params)
    adminUsers.value = res.data.content || res.data
    pagination.value.total = res.data.totalElements || 0
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadAdminUsers()
}

const resetFilters = () => {
  filters.value.keyword = ''
  pagination.value.page = 1
  loadAdminUsers()
}

const deleteAdminUser = (row) => {
  ElMessageBox.confirm('确认删除该管理员吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteAdminUserApi(row.id)
    ElMessage.success('删除成功')
    loadAdminUsers()
  }).catch(() => {})
}

onMounted(() => {
  loadAdminUsers()
})
</script>

<style scoped>
.admin-user-list-container {
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
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
</style>
