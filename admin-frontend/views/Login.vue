<template>
  <div class="login-page">
    <div class="login-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="logo-text">
              <h1>KapGame</h1>
              <p>管理后台</p>
            </div>
          </div>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <div class="input-group">
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                size="large"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-group">
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              />
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              <span v-if="!loading">登 录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <p>默认管理员账号: <span>admin</span> / <span>admin123</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/apis/auth'
import storage from '@/utils/storage'
import { setPermissions } from '@/utils/permission'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await login(form)
    if (res.success === false) {
      ElMessage.error(res.message || '登录失败')
      loading.value = false
      return
    }
    storage.setToken(res.data.token)
    storage.setUser(res.data)
    // 保存权限数据
    if (res.data.pages || res.data.functions) {
      setPermissions({
        pages: res.data.pages || [],
        functions: res.data.functions || {}
      })
    }
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error(error?.response?.data?.message || error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (storage.isLoggedIn()) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: #a855f7;
  top: -200px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: #3b82f6;
  bottom: -150px;
  left: -100px;
  animation: float 10s ease-in-out infinite reverse;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: #ec4899;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(5deg); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow:
    0 20px 40px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 16px -4px rgba(99, 102, 241, 0.4);
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.logo-text h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.5px;
}

.logo-text p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748B;
}

.login-form {
  margin-top: 8px;
}

.input-group {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: #94A3B8;
  z-index: 1;
  pointer-events: none;
}

.input-icon svg {
  width: 100%;
  height: 100%;
}

.login-form :deep(.el-input__wrapper) {
  padding: 6px 14px 6px 42px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #E2E8F0;
  transition: all 0.3s ease;
  background: #FAFBFC;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #C7D2E0;
  background: white;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #6366F1, 0 4px 12px -4px rgba(99, 102, 241, 0.2);
  background: white;
}

.login-form :deep(.el-input__inner) {
  height: 38px;
  font-size: 14px;
  color: #1E293B;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #94A3B8;
}

.login-btn {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 16px -4px rgba(99, 102, 241, 0.4);
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.5);
}

.login-btn:active {
  transform: translateY(0) scale(0.98);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-footer p {
  margin: 0;
  font-size: 13px;
  color: #94A3B8;
}

.login-footer span {
  color: #6366F1;
  font-weight: 500;
}
</style>
