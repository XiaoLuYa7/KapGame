<template>
  <div>
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑管理员' : '创建管理员' }}</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
          <span v-if="isEdit" style="color: #999; font-size: 12px;">留空则不修改密码</span>
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" active-value="ACTIVE" inactive-value="INACTIVE" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createAdminUser, updateAdminUser, getAdminUserById, getAllRoles } from '@/apis/adminUsers'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)

const formRef = ref(null)
const roles = ref([])

const resetForm = () => {
  form.username = ''
  form.password = ''
  form.realName = ''
  form.email = ''
  form.phone = ''
  form.roleId = null
  form.status = 'ACTIVE'
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const loadFormData = async () => {
  if (route.params.id) {
    const res = await getAdminUserById(route.params.id)
    const data = res.data
    form.username = data.username || ''
    form.realName = data.realName || ''
    form.email = data.email || ''
    form.phone = data.phone || ''
    form.roleId = data.role?.id || null
    form.status = data.status || 'ACTIVE'
  } else {
    resetForm()
  }
}

const form = reactive({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  roleId: null,
  status: 'ACTIVE'
})

// 监听路由变化，切换编辑/新增时重置表单
watch(() => route.params.id, () => {
  loadFormData()
}, { immediate: false })

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const loadRoles = async () => {
  const res = await getAllRoles()
  roles.value = res.data
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    const submitData = { ...form }
    if (isEdit.value && !submitData.password) {
      delete submitData.password
    }
    if (isEdit.value) {
      await updateAdminUser(route.params.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await createAdminUser(submitData)
      ElMessage.success('创建成功')
    }
    router.back()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  }
}

onMounted(async () => {
  loadRoles()
  loadFormData()
})
</script>
