<template>
  <el-dialog
    v-model="visible"
    title="用户详情"
    width="800px"
    @close="handleClose"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="ID">{{ user?.id }}</el-descriptions-item>
      <el-descriptions-item label="用户名">{{ user?.username }}</el-descriptions-item>
      <el-descriptions-item label="昵称">{{ user?.nickName }}</el-descriptions-item>
      <el-descriptions-item label="等级">
        <el-tag type="primary">{{ user?.level }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="段位">{{ user?.rank }}</el-descriptions-item>
      <el-descriptions-item label="经验值">{{ user?.exp }}</el-descriptions-item>
      <el-descriptions-item label="钻石">{{ user?.diamond }}</el-descriptions-item>
      <el-descriptions-item label="金币">{{ user?.gold }}</el-descriptions-item>
      <el-descriptions-item label="总对局">{{ user?.totalGames }}</el-descriptions-item>
      <el-descriptions-item label="胜场">{{ user?.winGames }}</el-descriptions-item>
      <el-descriptions-item label="胜率">{{ winRate }}%</el-descriptions-item>
      <el-descriptions-item label="好友数">{{ user?.friendCount }}</el-descriptions-item>
      <el-descriptions-item label="在线状态">
        <el-tag :type="user?.onlineStatus === 'ONLINE' ? 'success' : 'info'">
          {{ user?.onlineStatus === 'ONLINE' ? '在线' : '离线' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="最后活跃">{{ formatRelativeTime(user?.lastActiveTime) }}</el-descriptions-item>
      <el-descriptions-item label="实名认证">
        <el-tag :type="user?.isVerified ? 'success' : 'warning'">
          {{ user?.isVerified ? '已认证' : '未认证' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="真实姓名">{{ user?.realName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="音效">
        <el-tag :type="user?.soundEffectsEnabled ? 'success' : 'info'">{{ user?.soundEffectsEnabled ? '开' : '关' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="音乐">
        <el-tag :type="user?.musicEnabled ? 'success' : 'info'">{{ user?.musicEnabled ? '开' : '关' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="震动">
        <el-tag :type="user?.vibrationEnabled ? 'success' : 'info'">{{ user?.vibrationEnabled ? '开' : '关' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="显示在线">
        <el-tag :type="user?.showOnlineStatus ? 'success' : 'info'">{{ user?.showOnlineStatus ? '是' : '否' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="注册时间">{{ formatDateTime(user?.createTime) }}</el-descriptions-item>
      <el-descriptions-item label="最后登录">{{ formatDateTime(user?.lastLoginTime) }}</el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime } from '@/utils/format'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const winRate = computed(() => {
  if (!props.user || !props.user.totalGames || props.user.totalGames === 0) return 0
  return ((props.user.winGames / props.user.totalGames) * 100).toFixed(1)
})

const formatRelativeTime = (date) => {
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

const handleClose = () => { visible.value = false }
</script>
