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
  modelValue: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const winRate = computed(() => {
  if (!props.user || !props.user.totalGames || props.user.totalGames === 0) {
    return 0
  }
  return ((props.user.winGames / props.user.totalGames) * 100).toFixed(1)
})

const handleClose = () => {
  visible.value = false
}
</script>
