<template>
  <div class="dashboard">
    <div class="page-header">
      <div class="page-title">
        <h1>仪表盘</h1>
        <p>欢迎回来！以下是系统概览。</p>
      </div>
      <el-button type="primary" @click="loadData" :loading="loading">
        <el-icon v-if="!loading"><Refresh /></el-icon>
        <span v-if="!loading">刷新数据</span>
        <span v-else>加载中...</span>
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="(stat, index) in statsData" :key="index" :class="stat.colorClass">
        <div class="stat-accent"></div>
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon :size="28"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 三卡片行 -->
    <div class="three-col-grid">
      <!-- 最新发布 -->
      <div class="card publish-card">
        <div class="card-header">
          <h3>
            <el-icon><Clock /></el-icon>
            最新发布
          </h3>
          <el-button type="primary" text @click="router.push('/publish')">
            查看详情
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="card-body">
          <div v-if="latestPublish" class="publish-info">
            <div class="publish-header">
              <span class="version-badge">v{{ latestPublish.version }}</span>
              <span class="publish-time">{{ formatTime(latestPublish.publishTime) }}</span>
            </div>
            <div class="publish-stats">
              <div class="publish-stat">
                <el-icon><Postcard /></el-icon>
                <span>{{ latestPublish.cardCount }} 卡牌</span>
              </div>
              <div class="publish-stat">
                <el-icon><Calendar /></el-icon>
                <span>{{ latestPublish.activityCount }} 活动</span>
              </div>
              <div class="publish-stat">
                <el-icon><Setting /></el-icon>
                <span>{{ latestPublish.configCount }} 配置</span>
              </div>
            </div>
            <div class="publisher">
              <el-icon><UserFilled /></el-icon>
              {{ latestPublish.publishedBy }}
            </div>
          </div>
          <el-empty v-else description="暂无发布记录" :image-size="50" />
        </div>
      </div>

      <!-- 昨日收益 -->
      <div class="card earnings-card">
        <div class="card-header">
          <h3>
            <el-icon><Money /></el-icon>
            昨日收益
          </h3>
          <span class="earnings-date">{{ yesterdayDate }}</span>
        </div>
        <div class="card-body">
          <div class="earnings-content">
            <div class="earnings-total-card">
              <div class="earnings-total-label">昨日总收入</div>
              <div class="earnings-total-value">¥{{ earnings.total.toLocaleString() }}</div>
            </div>
            <div class="earnings-types">
              <div class="earnings-type-item" @click="goToEarnings('SKIN_PURCHASE')">
                <div class="earnings-type-icon skin">
                  <el-icon><Shop /></el-icon>
                </div>
                <div class="earnings-type-info">
                  <span class="earnings-type-name">皮肤购买</span>
                  <span class="earnings-type-count">{{ earnings.skinCount }} 笔</span>
                </div>
                <div class="earnings-type-amount">+¥{{ earnings.skin.toLocaleString() }}</div>
              </div>
              <div class="earnings-type-item" @click="goToEarnings('AD_REVENUE')">
                <div class="earnings-type-icon ad">
                  <el-icon><Monitor /></el-icon>
                </div>
                <div class="earnings-type-info">
                  <span class="earnings-type-name">广告收入</span>
                  <span class="earnings-type-count">{{ earnings.adCount }} 次</span>
                </div>
                <div class="earnings-type-amount">+¥{{ earnings.ad.toLocaleString() }}</div>
              </div>
              <div class="earnings-type-item" @click="goToEarnings('SPONSOR')">
                <div class="earnings-type-icon sponsor">
                  <el-icon><Trophy /></el-icon>
                </div>
                <div class="earnings-type-info">
                  <span class="earnings-type-name">赞助收入</span>
                  <span class="earnings-type-count">{{ earnings.sponsorCount }} 笔</span>
                </div>
                <div class="earnings-type-amount">+¥{{ earnings.sponsor.toLocaleString() }}</div>
              </div>
              <div class="earnings-type-item" @click="goToEarnings('TRAFFIC')">
                <div class="earnings-type-icon traffic">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="earnings-type-info">
                  <span class="earnings-type-name">流量收入</span>
                  <span class="earnings-type-count">{{ earnings.trafficCount }} 笔</span>
                </div>
                <div class="earnings-type-amount">+¥{{ earnings.traffic.toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="card quick-card">
        <div class="card-header">
          <h3>
            <el-icon><Lightning /></el-icon>
            快捷操作
          </h3>
        </div>
        <div class="card-body">
          <div class="actions-list">
            <div class="action-item" @click="router.push('/users')">
              <div class="action-icon users">
                <el-icon><User /></el-icon>
              </div>
              <span>用户管理</span>
            </div>
            <div class="action-item" @click="router.push('/cards')">
              <div class="action-icon create">
                <el-icon><Plus /></el-icon>
              </div>
              <span>创建卡牌</span>
            </div>
            <div class="action-item" @click="router.push('/activities')">
              <div class="action-icon activity">
                <el-icon><Calendar /></el-icon>
              </div>
              <span>创建活动</span>
            </div>
            <div class="action-item" @click="router.push('/configs')">
              <div class="action-icon config">
                <el-icon><Setting /></el-icon>
              </div>
              <span>系统配置</span>
            </div>
            <div class="action-item" @click="router.push('/earnings')">
              <div class="action-icon earnings">
                <el-icon><Money /></el-icon>
              </div>
              <span>收益查询</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统状态 -->
    <div class="card system-status">
      <div class="card-header">
        <h3>
          <el-icon><Bell /></el-icon>
          系统状态
        </h3>
        <el-tag type="success" effect="light" size="small">
          <el-icon><CircleCheckFilled /></el-icon>
          运行正常
        </el-tag>
      </div>
      <div class="card-body">
        <div class="status-list">
          <div class="status-item">
            <div class="status-dot online"></div>
            <span class="status-label">数据库连接</span>
            <el-tag type="success" size="small">正常</el-tag>
          </div>
          <div class="status-item">
            <div class="status-dot online"></div>
            <span class="status-label">API 服务</span>
            <el-tag type="success" size="small">正常</el-tag>
          </div>
          <div class="status-item">
            <div class="status-dot online"></div>
            <span class="status-label">静态资源</span>
            <el-tag type="success" size="small">正常</el-tag>
          </div>
          <div class="status-item">
            <div class="status-dot online"></div>
            <span class="status-label">JWT 认证</span>
            <el-tag type="success" size="small">正常</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Postcard,
  Calendar,
  Setting,
  Clock,
  Lightning,
  Plus,
  Refresh,
  ArrowRight,
  Bell,
  CircleCheckFilled,
  UserFilled,
  Money,
  Shop,
  Monitor,
  Trophy,
  Connection
} from '@element-plus/icons-vue'
import { getLatestPublish } from '@/apis/publish'
import { getDashboardStats, getYesterdayEarnings } from '@/apis/dashboard'
import { formatDateTime } from '@/utils/format'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)

const stats = ref({
  userCount: 0,
  cardCount: 0,
  activityCount: 0,
  configCount: 0
})

const latestPublish = ref(null)

const earnings = ref({
  total: 0,
  skin: 0,
  skinCount: 0,
  ad: 0,
  adCount: 0,
  sponsor: 0,
  sponsorCount: 0,
  traffic: 0,
  trafficCount: 0
})

const yesterdayDate = computed(() => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
})

const statsData = computed(() => [
  { label: '用户总数', value: stats.value.userCount, icon: User, colorClass: 'blue' },
  { label: '卡牌总数', value: stats.value.cardCount, icon: Postcard, colorClass: 'purple' },
  { label: '活动总数', value: stats.value.activityCount, icon: Calendar, colorClass: 'orange' },
  { label: '配置总数', value: stats.value.configCount, icon: Setting, colorClass: 'green' }
])

const formatTime = (time) => {
  if (!time) return ''
  return formatDateTime(time)
}

const goToEarnings = (type) => {
  router.push(`/earnings?type=${type}`)
}

const loadData = async () => {
  loading.value = true
  try {
    // 并行加载所有数据
    const [statsRes, earningsRes, publishRes] = await Promise.all([
      getDashboardStats(),
      getYesterdayEarnings(),
      getLatestPublish()
    ])

    // 更新统计数据
    if (statsRes.success && statsRes.data) {
      stats.value.userCount = statsRes.data.userCount || 0
      stats.value.cardCount = statsRes.data.cardCount || 0
      stats.value.activityCount = statsRes.data.activityCount || 0
      stats.value.configCount = statsRes.data.configCount || 0
    }

    // 更新收益数据
    if (earningsRes.success && earningsRes.data) {
      const data = earningsRes.data
      earnings.value.total = data.total || 0
      earnings.value.skin = data.skin_purchase || 0
      earnings.value.skinCount = data.skin_purchaseCount || 0
      earnings.value.ad = data.ad_revenue || 0
      earnings.value.adCount = data.ad_revenueCount || 0
      earnings.value.sponsor = data.sponsor || 0
      earnings.value.sponsorCount = data.sponsorCount || 0
      earnings.value.traffic = data.traffic || 0
      earnings.value.trafficCount = data.trafficCount || 0
    }

    // 更新发布数据
    if (publishRes.success) {
      latestPublish.value = publishRes.data
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.5px;
}

.page-title p {
  margin: 0;
  font-size: 15px;
  color: #64748B;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
}

.stat-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 4px 0 0 4px;
}

.stat-card.blue .stat-accent { background: linear-gradient(180deg, #6366F1 0%, #818CF8 100%); }
.stat-card.purple .stat-accent { background: linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%); }
.stat-card.orange .stat-accent { background: linear-gradient(180deg, #F59E0B 0%, #FBBF24 100%); }
.stat-card.green .stat-accent { background: linear-gradient(180deg, #10B981 0%, #34D399 100%); }

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.blue .stat-icon { background: rgba(99, 102, 241, 0.1); color: #6366F1; }
.stat-card.purple .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; }
.stat-card.orange .stat-icon { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
.stat-card.green .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10B981; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1E293B;
  line-height: 1;
  letter-spacing: -1px;
}

.stat-label {
  font-size: 14px;
  color: #64748B;
  margin-top: 6px;
}

/* 三列卡片网格 */
.three-col-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* 卡片通用 */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}

.card-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 .el-icon {
  color: #6366F1;
}

.card-body {
  padding: 16px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 最新发布 */
.publish-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.version-badge {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
}

.publish-time {
  font-size: 12px;
  color: #94A3B8;
}

.publish-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.publish-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748B;
}

.publish-stat .el-icon {
  color: #94A3B8;
}

.publisher {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94A3B8;
  margin-top: auto;
}

/* 昨日收益 */
.earnings-date {
  font-size: 12px;
  color: #94A3B8;
}

.earnings-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.earnings-total-card {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.earnings-total-label {
  font-size: 13px;
  opacity: 0.9;
}

.earnings-total-value {
  font-size: 20px;
  font-weight: 700;
}

.earnings-types {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.earnings-type-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.earnings-type-item:hover {
  background: #F1F5F9;
  transform: translateX(4px);
}

.earnings-type-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
}

.earnings-type-icon.skin { background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%); }
.earnings-type-icon.ad { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }
.earnings-type-icon.sponsor { background: linear-gradient(135deg, #10B981 0%, #34D399 100%); }
.earnings-type-icon.traffic { background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%); }

.earnings-type-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.earnings-type-name {
  font-size: 13px;
  font-weight: 500;
  color: #1E293B;
}

.earnings-type-count {
  font-size: 11px;
  color: #94A3B8;
}

.earnings-type-amount {
  font-size: 13px;
  font-weight: 600;
  color: #10B981;
}

/* 快捷操作 */
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-item:hover {
  background: #F1F5F9;
  transform: translateX(4px);
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.action-icon.create { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); }
.action-icon.activity { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }
.action-icon.config { background: linear-gradient(135deg, #10B981 0%, #34D399 100%); }
.action-icon.earnings { background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%); }
.action-icon.users { background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%); }

.action-item span {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

/* 系统状态 */
.system-status .card-header {
  border-bottom: none;
  padding-bottom: 0;
}

.system-status .card-body {
  padding-top: 0;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #F8FAFC;
  border-radius: 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.status-label {
  flex: 1;
  font-size: 14px;
  color: #475569;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .three-col-grid { grid-template-columns: 1fr 1fr; }
  .quick-card { grid-column: span 2; }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .three-col-grid { grid-template-columns: 1fr; }
  .quick-card { grid-column: span 1; }
  .publish-stats { flex-direction: column; gap: 8px; }
}
</style>
