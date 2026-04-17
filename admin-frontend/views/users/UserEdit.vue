<template>
  <el-dialog
    v-model="visible"
    title="编辑用户"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="昵称">
        <el-input v-model="form.nickName" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="等级">
        <el-input-number v-model="form.level" :min="1" :max="100" />
      </el-form-item>
      <el-form-item label="段位">
        <el-input v-model="form.rank" placeholder="请输入段位" />
      </el-form-item>
      <el-form-item label="经验值">
        <el-input-number v-model="form.exp" :min="0" />
      </el-form-item>
      <el-form-item label="钻石">
        <el-input-number v-model="form.diamond" :min="0" />
      </el-form-item>
      <el-form-item label="金币">
        <el-input-number v-model="form.gold" :min="0" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { updateUser } from '@/apis/users'

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

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = reactive({
  nickName: '',
  level: 1,
  rank: '',
  exp: 0,
  diamond: 0,
  gold: 0
})

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      form.nickName = newUser.nickName || ''
      form.level = newUser.level || 1
      form.rank = newUser.rank || ''
      form.exp = newUser.exp || 0
      form.diamond = newUser.diamond || 0
      form.gold = newUser.gold || 0
    }
  },
  { immediate: true }
)

const handleClose = () => {
  visible.value = false
}

const handleSave = async () => {
  try {
    await updateUser(props.user.id, form)
    ElMessage.success('保存成功')
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}
</script>
