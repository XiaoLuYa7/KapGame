<template>
  <div class="permission-denied-container">
    <el-result
      icon="warning"
      title="权限不足"
      :sub-title="permissionMessage"
    >
      <template #extra>
        <el-button type="primary" @click="goBack">返回上一页</el-button>
        <el-button @click="goHome">返回仪表盘</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const permissionMessage = computed(() => {
  return route.query.message || '您没有权限访问该页面，请联系管理员分配相应权限。'
})

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.permission-denied-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
