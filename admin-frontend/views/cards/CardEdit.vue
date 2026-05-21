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

        <el-form-item label="卡牌键" prop="cardKey">
          <el-input v-model="form.cardKey" placeholder="例如 trick_trap" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入卡牌描述" rows="3" />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择卡牌类型">
            <el-option label="危险牌" value="DANGER" />
            <el-option label="防御牌" value="DEFENSE" />
            <el-option label="探查牌" value="DETECT" />
            <el-option label="干扰牌" value="INTERFERE" />
            <el-option label="控制牌" value="CONTROL" />
            <el-option label="生存牌" value="SURVIVAL" />
            <el-option label="转移牌" value="TRANSFER" />
            <el-option label="补牌牌" value="DRAW" />
            <el-option label="反制牌" value="COUNTER" />
            <el-option label="协作牌" value="TEAMWORK" />
          </el-select>
        </el-form-item>

        <el-form-item label="稀有度" prop="rarity">
          <el-input v-model="form.rarity" placeholder="请输入稀有度" />
        </el-form-item>

        <el-form-item label="模式范围" prop="modeScope">
          <el-select v-model="form.modeScope" placeholder="请选择模式范围">
            <el-option label="单人局 + 双人局" value="SOLO,TEAM" />
            <el-option label="仅单人局" value="SOLO" />
            <el-option label="仅双人局" value="TEAM" />
          </el-select>
        </el-form-item>

        <el-form-item label="使用时机" prop="timing">
          <el-select v-model="form.timing" placeholder="请选择使用时机">
            <el-option label="摸牌前" value="BeforeDraw" />
            <el-option label="摸牌阶段" value="DrawPhase" />
            <el-option label="触发机关时" value="OnDanger" />
            <el-option label="被指定时" value="OnTargeted" />
            <el-option label="队友触发机关时" value="OnTeammateDanger" />
          </el-select>
        </el-form-item>

        <el-form-item label="目标类型" prop="targetType">
          <el-select v-model="form.targetType" placeholder="请选择目标类型">
            <el-option label="无" value="None" />
            <el-option label="自己" value="Self" />
            <el-option label="其他玩家" value="OtherPlayer" />
            <el-option label="任意玩家" value="AnyPlayer" />
            <el-option label="队友" value="Teammate" />
            <el-option label="牌堆" value="Deck" />
          </el-select>
        </el-form-item>

        <el-form-item label="单人数量" prop="countSolo">
          <el-input-number v-model="form.countSolo" :min="0" />
        </el-form-item>

        <el-form-item label="双人数量" prop="countTeam">
          <el-input-number v-model="form.countTeam" :min="0" />
        </el-form-item>

        <el-form-item label="可被反制" prop="canBeCountered">
          <el-switch v-model="form.canBeCountered" active-text="是" inactive-text="否" />
        </el-form-item>

        <el-form-item label="图标路径" prop="iconPath">
          <el-input v-model="form.iconPath" placeholder="例如 cards/trick_trap" />
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
  cardKey: '',
  description: '',
  type: '',
  rarity: '',
  modeScope: 'SOLO,TEAM',
  countSolo: 0,
  countTeam: 0,
  timing: '',
  targetType: '',
  canBeCountered: false,
  iconPath: '',
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
