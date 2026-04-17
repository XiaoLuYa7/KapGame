<template>
  <div class="earnings-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>收益查询</h1>
        <p>查看和管理所有收益记录</p>
      </div>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加记录
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">收益类型</span>
          <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 150px;">
            <el-option v-for="item in getDict('earning_type')" :key="item.code" :label="`${item.code}-${item.value}`" :value="item.code" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="filters.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 150px;"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="filters.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 150px;"
          />
        </div>
        <div class="filter-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="handleFilterChange">查询</el-button>
        </div>
      </div>

      <!-- 汇总数据 -->
      <div class="summary-cards" v-if="summary">
        <div class="summary-card total">
          <div class="summary-label">总收益</div>
          <div class="summary-value">¥{{ summary.total.toLocaleString() }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon skin"><el-icon><Shop /></el-icon></div>
          <div class="summary-info">
            <div class="summary-label">皮肤购买</div>
            <div class="summary-value">¥{{ summary.skinPurchase?.toLocaleString() || 0 }}</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon ad"><el-icon><Monitor /></el-icon></div>
          <div class="summary-info">
            <div class="summary-label">广告收入</div>
            <div class="summary-value">¥{{ summary.adRevenue?.toLocaleString() || 0 }}</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon sponsor"><el-icon><Trophy /></el-icon></div>
          <div class="summary-info">
            <div class="summary-label">赞助收入</div>
            <div class="summary-value">¥{{ summary.sponsor?.toLocaleString() || 0 }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="earnings"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" effect="light">
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span class="amount-value">+¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column prop="earningDate" label="收益日期" width="180">
          <template #default="{ row }">
            {{ formatDate(row.earningDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column v-if="hasAnyAction" label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canDelete" type="danger" text size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
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
          @size-change="loadEarnings"
          @current-change="loadEarnings"
        />
      </div>
    </el-card>

    <!-- 添加记录对话框 -->
    <el-dialog v-model="showAddDialog" title="添加收益记录" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="收益类型">
          <el-select v-model="addForm.type" placeholder="请选择类型">
            <el-option v-for="item in getDict('earning_type')" :key="item.code" :label="`${item.code}-${item.value}`" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="addForm.amount" :min="0" :precision="2" placeholder="请输入金额" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="addForm.orderNo" placeholder="请输入订单号（可选）" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="addForm.username" placeholder="请输入用户名（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="addForm.description" type="textarea" placeholder="请输入描述（可选）" />
        </el-form-item>
        <el-form-item label="收益日期">
          <el-date-picker
            v-model="addForm.earningDate"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Shop, Monitor, Trophy } from '@element-plus/icons-vue'
import { getEarnings, getEarningsSummary, createEarning, deleteEarning } from '@/apis/earnings'
import { useDict } from '@/composables/useDict'
import { hasFunctionPermission } from '@/utils/permission'

const route = useRoute()
const { loadDict, getDict, getDictLabel, getDictCodeLabel } = useDict()

// 权限检查 - 使用 computed 确保响应式
const canDelete = computed(() => hasFunctionPermission('EARNINGS:DELETE'))
const hasAnyAction = computed(() => canDelete.value)

const loading = ref(false)
const showAddDialog = ref(false)

const filters = reactive({
  type: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const summary = ref(null)
const earnings = ref([])

const addForm = reactive({
  type: '',
  amount: 0,
  orderNo: '',
  username: '',
  description: '',
  earningDate: ''
})

const getTypeName = (type) => {
  return getDictCodeLabel('earning_type', type)
}

const getTypeTagType = (type) => {
  const map = {
    'SKIN_PURCHASE': 'danger',
    'AD_REVENUE': 'warning',
    'SPONSOR': 'success',
    'TRAFFIC': 'info'
  }
  return map[type] || 'info'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadEarnings = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    if (filters.type) params.type = filters.type
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate

    const res = await getEarnings(params)
    earnings.value = res.data.content || []
    pagination.total = res.data.totalElements || 0
  } catch (error) {
    ElMessage.error('获取收益记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadSummary = async () => {
  try {
    // 如果有日期筛选条件，使用日期范围查询；否则查全部
    let res
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate || '2020-01-01'
      const end = filters.endDate || new Date().toISOString().split('T')[0]
      res = await getEarningsSummary(start, end)
    } else {
      // 无日期筛选时，使用一个很宽的范围获取所有数据
      res = await getEarningsSummary('2020-01-01', '2099-12-31')
    }
    summary.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  loadEarnings()
  loadSummary()
}

const resetFilters = () => {
  filters.type = ''
  filters.startDate = ''
  filters.endDate = ''
  pagination.page = 1
  loadEarnings()
  loadSummary()
}

const handleAdd = async () => {
  if (!addForm.type || !addForm.amount) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    await createEarning(addForm)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    loadEarnings()
    loadSummary()
    // 重置表单
    Object.assign(addForm, {
      type: '',
      amount: 0,
      orderNo: '',
      username: '',
      description: '',
      earningDate: ''
    })
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除这条收益记录吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteEarning(row.id)
      ElMessage.success('删除成功')
      loadEarnings()
      loadSummary()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadDict(['earning_type'])
  // 检查URL参数是否有类型筛选
  if (route.query.type) {
    filters.type = route.query.type
  }
  loadEarnings()
  loadSummary()
})
</script>

<style scoped>
.earnings-container {
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
  color: var(--text-primary);
}

.page-header-content p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.filter-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
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

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.summary-cards {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-page);
  border-radius: 12px;
  flex: 1;
}

.summary-card.total {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
}

.summary-card.total .summary-label {
  color: rgba(255, 255, 255, 0.9);
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.summary-icon.skin { background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%); }
.summary-icon.ad { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }
.summary-icon.sponsor { background: linear-gradient(135deg, #10B981 0%, #34D399 100%); }

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.amount-value {
  color: var(--color-success);
  font-weight: 600;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.table-card {
  margin-bottom: 20px;
}
</style>
