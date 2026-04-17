<template>
  <div class="permission-list-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>权限管理</h1>
        <p>管理系统中的所有权限</p>
      </div>
      <el-button v-if="canCreate" type="primary" @click="router.push('/permissions/add')">新增</el-button>
    </div>

    <el-card class="table-card">
      <div class="search-form">
        <span class="search-label">权限代码</span>
        <el-input v-model="searchForm.code" placeholder="请输入权限代码" style="width: 150px" clearable />
        <span class="search-label">权限名称</span>
        <el-input v-model="searchForm.name" placeholder="请输入权限名称" style="width: 150px" clearable />
        <span class="search-label">页面类型</span>
        <el-select v-model="searchForm.type" placeholder="请选择" style="width: 120px" clearable>
          <el-option v-for="d in getDict('permission_type')" :key="d.code" :label="d.value" :value="d.code" />
        </el-select>
        <span class="search-label">父权限</span>
        <el-select v-model="searchForm.parentId" placeholder="请选择" style="width: 200px" clearable filterable>
          <el-option v-for="p in parentPermissionOptions" :key="p.id" :label="p.label" :value="p.id" />
        </el-select>
        <div class="search-buttons">
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>

      <el-table :data="permissions" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" label="权限代码" />
        <el-table-column prop="name" label="权限名称" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="父权限" width="200">
          <template #default="{ row }">
            {{ row.parentId ? row.parentId + ' - ' + (row.parentCode || '') + ' - ' + (row.parentName || '') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="80" />
        <el-table-column prop="routePath" label="路由" width="120">
          <template #default="{ row }">
            {{ row.routePath || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="icon" label="图标" width="100" />
        <el-table-column prop="description" label="描述" />
        <el-table-column v-if="hasAnyAction" label="操作" width="150">
          <template #default="{ row }">
            <el-button v-if="canEdit" size="small" @click="router.push(`/permissions/${row.id}/edit`)">编辑</el-button>
            <el-button v-if="canDelete && row.isDeletable !== false" size="small" type="danger" @click="deletePermission(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 20px; text-align: right"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="pagination.total > 10 ? [10, 20, 50, 100] : []"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPermissions, getAllPermissions, deletePermission as deletePermissionApi } from '@/apis/permissions'
import { useDict } from '@/composables/useDict'
import { hasFunctionPermission } from '@/utils/permission'

const router = useRouter()

const { loadDict, getDict } = useDict()

// 权限检查 - 使用 computed 确保响应式
const canCreate = computed(() => hasFunctionPermission('PERMISSION:CREATE'))
const canEdit = computed(() => hasFunctionPermission('PERMISSION:EDIT'))
const canDelete = computed(() => hasFunctionPermission('PERMISSION:DELETE'))
const hasAnyAction = computed(() => canEdit.value || canDelete.value)

const permissions = ref([])
const parentPermissionOptions = ref([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = ref({
  code: '',
  name: '',
  type: null,
  parentId: null
})

const getTypeText = (type) => {
  const map = { 'ROOT': '根目录', 'MENU': '菜单', 'PAGE': '页面', 'FUNCTION': '功能' }
  return map[type] || type
}

const getTypeTagType = (type) => {
  const map = { 'ROOT': 'danger', 'MENU': 'warning', 'PAGE': 'success', 'FUNCTION': 'info' }
  return map[type] || 'info'
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const loadPermissions = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page - 1,
      size: pagination.value.pageSize
    }
    if (searchForm.value.code) {
      params.code = searchForm.value.code
    }
    if (searchForm.value.name) {
      params.name = searchForm.value.name
    }
    if (searchForm.value.type) {
      params.type = searchForm.value.type
    }
    if (searchForm.value.parentId) {
      params.parentId = searchForm.value.parentId
    }
    const res = await getPermissions(params)
    permissions.value = res.data.content || res.data
    pagination.value.total = res.data.totalElements || 0
  } catch (error) {
    ElMessage.error('获取权限列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadParentPermissionOptions = async () => {
  try {
    const res = await getAllPermissions()
    const list = res.data || []
    parentPermissionOptions.value = list
      .filter(p => p.type === 'ROOT' || p.type === 'MENU' || p.type === 'PAGE')
      .map(p => ({ id: p.id, label: p.id + ' - ' + p.code + ' - ' + p.name }))
  } catch (error) {
    console.error(error)
  }
}

const resetSearch = () => {
  searchForm.value.code = ''
  searchForm.value.name = ''
  searchForm.value.type = null
  searchForm.value.parentId = null
  pagination.value.page = 1
  loadPermissions()
}

const handleSearch = () => {
  pagination.value.page = 1
  loadPermissions()
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadPermissions()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadPermissions()
}

const deletePermission = (row) => {
  ElMessageBox.confirm('确认删除该权限吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deletePermissionApi(row.id)
    ElMessage.success('删除成功')
    loadPermissions()
  }).catch(() => {})
}

onMounted(() => {
  loadPermissions()
  loadParentPermissionOptions()
  loadDict(['permission_type'])
})
</script>

<style scoped>
.permission-list-container {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header-content {
  display: flex;
  flex-direction: column;
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

.search-form {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.search-label {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.search-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
