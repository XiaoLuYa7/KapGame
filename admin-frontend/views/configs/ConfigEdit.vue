<template>
  <div>
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑配置' : '创建配置' }}</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="配置键" prop="configKey">
          <el-input
            v-model="form.configKey"
            placeholder="请输入配置键"
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="配置值" prop="configValue">
          <div class="config-value-wrapper">
            <el-input
              v-model="form.configValue"
              placeholder="请输入配置值，JSON会自动格式化"
              type="textarea"
              rows="8"
              @blur="handleFormatJson"
            />
            <div class="config-value-actions">
              <el-button
                size="small"
                @click="handleFormatJson"
                :disabled="!isValidJson"
                title="格式化JSON"
              >
                格式化
              </el-button>
              <el-button
                size="small"
                @click="handleCompressJson"
                :disabled="!isValidJson"
                title="压缩JSON"
              >
                压缩
              </el-button>
              <span class="json-status" :class="isValidJson ? 'valid' : 'invalid'" v-if="showJsonStatus">
                {{ isValidJson ? '✓ JSON格式正确' : '✗ 非JSON格式' }}
              </span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" rows="3" />
        </el-form-item>

        <el-form-item label="是否公开" prop="isPublic">
          <el-switch v-model="form.isPublic" />
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
import { createConfig, updateConfig, getConfigById } from '@/apis/configs'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)

const formRef = ref(null)
const form = reactive({
  configKey: '',
  configValue: '',
  description: '',
  isPublic: false
})

const rules = {
  configKey: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
}

// 检测是否为有效的JSON
const isValidJson = computed(() => {
  if (!form.configValue || form.configValue.trim() === '') return false
  try {
    JSON.parse(form.configValue)
    return true
  } catch {
    return false
  }
})

// 是否显示JSON状态提示（用户已输入内容）
const showJsonStatus = computed(() => {
  return form.configValue && form.configValue.trim() !== ''
})

// 格式化JSON
const handleFormatJson = () => {
  if (!isValidJson.value) {
    ElMessage.warning('当前内容不是有效的JSON格式')
    return
  }
  try {
    const parsed = JSON.parse(form.configValue)
    form.configValue = JSON.stringify(parsed, null, 2)
    ElMessage.success('JSON格式化成功')
  } catch {
    ElMessage.error('JSON格式化失败')
  }
}

// 压缩JSON
const handleCompressJson = () => {
  if (!isValidJson.value) {
    ElMessage.warning('当前内容不是有效的JSON格式')
    return
  }
  try {
    const parsed = JSON.parse(form.configValue)
    form.configValue = JSON.stringify(parsed)
    ElMessage.success('JSON压缩成功')
  } catch {
    ElMessage.error('JSON压缩失败')
  }
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEdit.value) {
      await updateConfig(route.params.id, form)
      ElMessage.success('更新成功')
    } else {
      await createConfig(form)
      ElMessage.success('创建成功')
    }
    router.back()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const res = await getConfigById(route.params.id)
    Object.assign(form, res.data)
  }
})
</script>

<style scoped>
.config-value-wrapper {
  width: 100%;
}

.config-value-wrapper :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.config-value-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.json-status {
  font-size: 12px;
  margin-left: 8px;
}

.json-status.valid {
  color: #67c23a;
}

.json-status.invalid {
  color: #909399;
}
</style>
