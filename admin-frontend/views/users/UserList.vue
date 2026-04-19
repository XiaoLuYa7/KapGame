<template>
  <div class="user-list-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>用户管理</h1>
        <p>管理系统中的所有用户</p>
      </div>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名/昵称"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="users"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="nickName" label="昵称" min-width="150" />
        <el-table-column prop="level" label="等级" width="80">
          <template #default="{ row }">
            <el-tag type="info">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rank" label="段位" min-width="120">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.rank }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalGames" label="总对局" width="100" />
        <el-table-column prop="diamond" label="钻石" width="100">
          <template #default="{ row }">
            <span class="diamond">{{ row.diamond }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="gold" label="金币" width="120">
          <template #default="{ row }">
            <span class="gold">{{ row.gold }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'BANNED' ? 'danger' : 'success'" size="small">
              {{ row.status === 'BANNED' ? '已封禁' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="onlineStatus" label="在线状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.onlineStatus === 'ONLINE' ? 'success' : 'info'" size="small">
              {{ row.onlineStatus === 'ONLINE' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isVerified" label="实名" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isVerified ? 'success' : 'warning'" size="small">
              {{ row.isVerified ? '已认证' : '未认证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastActiveTime" label="最后活跃" width="140">
          <template #default="{ row }">
            {{ formatDate(row.lastActiveTime) }}
          </template>
        </el-table-column>
        <el-table-column v-if="hasAnyAction" label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button v-if="canEdit" type="success" text size="small" @click="editUser(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button v-if="canEdit && row.status !== 'BANNED'" type="warning" text size="small" @click="handleBan(row)">
                <el-icon><Lock /></el-icon>
                封禁
              </el-button>
              <el-button v-if="canEdit && row.status === 'BANNED'" type="info" text size="small" @click="handleUnban(row)">
                <el-icon><Unlock /></el-icon>
                解封
              </el-button>
              <el-button v-if="canDelete" type="danger" text size="small" @click="deleteUser(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="pagination.total > 10 ? [10, 20, 50] : []"
          layout="total, sizes, prev, pager, next"
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </el-card>

    <UserDetail
      v-model="detailVisible"
      :user="currentUser"
    />

    <UserEdit
      v-model="editVisible"
      :user="currentUser"
      @success="loadUsers"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, View, Edit, Delete, Lock, Unlock } from '@element-plus/icons-vue'
import { getUsers, deleteUser as deleteUserApi, banUser, unbanUser } from '@/apis/users'
import { hasFunctionPermission } from '@/utils/permission'
import UserDetail from './UserDetail.vue'
import UserEdit from './UserEdit.vue'

// 权限检查 - 使用 computed 确保响应式
const canEdit = computed(() => hasFunctionPermission('USER:EDIT'))
const canDelete = computed(() => hasFunctionPermission('USER:DELETE'))
const hasAnyAction = computed(() => canEdit.value || canDelete.value)

const users = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentUser = ref(null)
const detailVisible = ref(false)
const editVisible = ref(false)

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return d.toLocaleDateString()
}

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      page: pagination.page - 1,
      size: pagination.size,
      keyword: searchKeyword.value
    })
    users.value = res.data.content
    pagination.total = res.data.totalElements
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const viewDetail = (row) => {
  currentUser.value = row
  detailVisible.value = true
}

const editUser = (row) => {
  currentUser.value = { ...row }
  editVisible.value = true
}

const deleteUser = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.nickName || row.username}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteUserApi(row.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const handleBan = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要封禁用户 "${row.nickName || row.username}" 吗？`,
      '封禁确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await banUser(row.id)
    ElMessage.success('封禁成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('封禁失败')
      console.error(error)
    }
  }
}

const handleUnban = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要解封用户 "${row.nickName || row.username}" 吗？`,
      '解封确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await unbanUser(row.id)
    ElMessage.success('解封成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('解封失败')
      console.error(error)
    }
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-list-container {
  max-width: 1400px;
}

.diamond {
  color: var(--color-primary);
  font-weight: 600;
}

.gold {
  color: var(--color-warning);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0;
  justify-content: center;
  flex-wrap: nowrap;
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

/* 通用样式 */
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

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-bar .el-input {
  width: 260px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.diamond {
  color: var(--color-primary);
  font-weight: 600;
}

.gold {
  color: var(--color-warning);
  font-weight: 600;
}
</style>
