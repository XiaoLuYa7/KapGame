<template>
  <div>
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑卡牌' : '创建卡牌' }}</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入卡牌名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入卡牌描述" rows="3" />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-input v-model="form.type" placeholder="请输入卡牌类型" />
        </el-form-item>

        <el-form-item label="稀有度" prop="rarity">
          <el-input v-model="form.rarity" placeholder="请输入稀有度" />
        </el-form-item>

        <el-form-item label="费用" prop="manaCost">
          <el-input-number v-model="form.manaCost" :min="0" />
        </el-form-item>

        <el-form-item label="攻击力" prop="power">
          <el-input-number v-model="form.power" :min="0" />
        </el-form-item>

        <el-form-item label="生命值" prop="health">
          <el-input-number v-model="form.health" :min="0" />
        </el-form-item>

        <el-form-item label="图片URL" prop="imageUrl">
          <el-input v-model="form.imageUrl" placeholder="请输入图片URL" />
        </el-form-item>

        <el-form-item label="效果" prop="effects">
          <el-input v-model="form.effects" type="textarea" placeholder="请输入卡牌效果" rows="3" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createCard, updateCard, getCardById } from '@/apis/cards'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)

const formRef = ref(null)
const form = reactive({
  name: '',
  description: '',
  type: '',
  rarity: '',
  manaCost: 0,
  power: 0,
  health: 0,
  imageUrl: '',
  effects: ''
})

const rules = {
  name: [{ required: true, message: '请输入卡牌名称', trigger: 'blur' }],
  type: [{ required: true, message: '请输入卡牌类型', trigger: 'blur' }],
  rarity: [{ required: true, message: '请输入稀有度', trigger: 'blur' }]
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (isEdit.value) {
    await updateCard(route.params.id, form)
    ElMessage.success('更新成功')
  } else {
    await createCard(form)
    ElMessage.success('创建成功')
  }
  router.back()
}

onMounted(async () => {
  if (isEdit.value) {
    const res = await getCardById(route.params.id)
    Object.assign(form, res.data)
  }
})
</script>

<style scoped>
/* 页面标题区 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title h1 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.page-title p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 编辑页面通用样式 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-default);
}
</style>
