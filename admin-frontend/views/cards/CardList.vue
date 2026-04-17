<template>
  <div class="card-list-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>卡牌管理</h1>
        <p>管理系统中的所有卡牌</p>
      </div>
      <el-button type="primary" @click="router.push('/cards/edit')">
        <el-icon><Plus /></el-icon>
        创建卡牌
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table
        :data="cards"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rarity" label="稀有度" width="100">
          <template #default="{ row }">
            <el-tag :type="getRarityType(row.rarity)">{{ row.rarity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="manaCost" label="费用" width="80">
          <template #default="{ row }">
            <div class="stat-cell mana">
              <el-icon><MagicStick /></el-icon>
              {{ row.manaCost }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="power" label="攻击力" width="100">
          <template #default="{ row }">
            <div class="stat-cell attack">
              <el-icon><Aim /></el-icon>
              {{ row.power }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="health" label="生命值" width="100">
          <template #default="{ row }">
            <div class="stat-cell health">
              <el-icon><Star /></el-icon>
              {{ row.health }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" effect="light">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="router.push(`/cards/${row.id}/edit`)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="success" text size="small" @click="publishCard(row)">
                <el-icon><Promotion /></el-icon>
                发布
              </el-button>
              <el-button type="danger" text size="small" @click="deleteCard(row)">
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
          @size-change="loadCards"
          @current-change="loadCards"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Promotion, MagicStick, Aim, Star } from '@element-plus/icons-vue'
import { getCards, publishCard as publishCardApi, deleteCard as deleteCardApi } from '@/apis/cards'

const router = useRouter()

const cards = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const getCardColor = (type) => {
  const colors = {
    '攻击': 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
    '防御': 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
    '辅助': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    '法术': 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    'default': 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)'
  }
  return colors[type] || colors['default']
}

const getRarityType = (rarity) => {
  const types = {
    '传说': 'danger',
    '史诗': 'warning',
    '稀有': 'success',
    '普通': 'info'
  }
  return types[rarity] || 'info'
}

const loadCards = async () => {
  loading.value = true
  try {
    const res = await getCards({ page: pagination.page - 1, size: pagination.pageSize })
    cards.value = res.data.content || res.data
    pagination.total = res.data.totalElements || 0
  } catch (error) {
    ElMessage.error('获取卡牌列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const publishCard = async (row) => {
  try {
    await publishCardApi(row.id)
    ElMessage.success('发布成功')
    loadCards()
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

const deleteCard = (row) => {
  ElMessageBox.confirm(`确定要删除卡牌 "${row.name}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteCardApi(row.id)
    ElMessage.success('删除成功')
    loadCards()
  }).catch(() => {})
}

onMounted(() => {
  loadCards()
})
</script>

<style scoped>
.card-list-container {
  max-width: 1400px;
}

.stat-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.stat-cell.mana {
  color: #6366F1;
}

.stat-cell.attack {
  color: #EF4444;
}

.stat-cell.health {
  color: #10B981;
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
