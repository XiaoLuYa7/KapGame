<template>
  <div class="mail-list-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>邮件管理</h1>
        <p>管理游戏邮件，支持发送文字+物品邮件给指定用户</p>
      </div>
      <el-button type="primary" @click="router.push('/mails/add')">
        <el-icon><Plus /></el-icon>
        创建邮件
      </el-button>
    </div>

    <el-card class="table-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="草稿" name="DRAFT" />
        <el-tab-pane label="已发送" name="SENT" />
        <el-tab-pane label="已失效" name="EXPIRED" />
      </el-tabs>

      <el-table
        :data="mails"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收件人数" width="100">
          <template #default="{ row }">
            {{ row.totalRecipients || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="附件" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.attachments && row.attachments.length > 0" type="warning" size="small">
              {{ row.attachments.length }}个
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sendTime" label="发送时间" width="160">
          <template #default="{ row }">
            {{ row.sendTime ? formatDate(row.sendTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="router.push(`/mails/${row.id}/edit`)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'DRAFT'"
                type="success"
                text
                size="small"
                @click="handleSend(row)"
              >
                <el-icon><Promotion /></el-icon>
                发送
              </el-button>
              <el-button
                v-if="row.status === 'DRAFT'"
                type="danger"
                text
                size="small"
                @click="handleDelete(row)"
              >
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
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadMails"
          @current-change="loadMails"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Promotion } from '@element-plus/icons-vue'
import { getMails, deleteMail, sendMail } from '@/apis/mail'

const router = useRouter()

const mails = ref([])
const loading = ref(false)
const activeTab = ref('all')
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const getStatusType = (status) => {
  const types = {
    'DRAFT': 'info',
    'SENT': 'success',
    'EXPIRED': 'warning'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    'DRAFT': '草稿',
    'SENT': '已发送',
    'EXPIRED': '已失效'
  }
  return texts[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const loadMails = async () => {
  loading.value = true
  try {
    const res = await getMails({ page: pagination.page - 1, size: pagination.pageSize })
    let data = res.data || []
    // 前端过滤状态
    if (activeTab.value !== 'all') {
      data = data.filter(m => m.status === activeTab.value)
    }
    mails.value = data
    pagination.total = res.data?.totalElements || data.length
  } catch (error) {
    ElMessage.error('获取邮件列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  pagination.page = 1
  loadMails()
}

const handleSend = (row) => {
  ElMessageBox.confirm(
    `确定要发送邮件 "${row.title}" 吗？这将发送给所有符合条件的用户。`,
    '发送确认',
    {
      confirmButtonText: '确定发送',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await sendMail(row.id, '系统管理员')
      ElMessage.success('发送成功')
      loadMails()
    } catch (error) {
      ElMessage.error('发送失败: ' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除邮件 "${row.title}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteMail(row.id)
      ElMessage.success('删除成功')
      loadMails()
    } catch (error) {
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

onMounted(() => {
  loadMails()
})
</script>

<style scoped>
.mail-list-container {
  max-width: 1400px;
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
  margin-right: 2px;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>
