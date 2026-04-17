<template>
  <div class="mail-edit-container">
    <div class="page-header">
      <div class="page-header-content">
        <h1>{{ isEdit ? '编辑邮件' : '创建邮件' }}</h1>
        <p>配置邮件内容、收件人条件和附件</p>
      </div>
      <el-button @click="router.push('/mails')">
        <el-icon><Back /></el-icon>
        返回列表
      </el-button>
    </div>

    <el-card class="form-card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="邮件标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入邮件标题" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="邮件内容" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="5"
                placeholder="请输入邮件内容，支持多行文本"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 收件人条件 -->
        <el-divider content-position="left">收件人条件</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="最小等级">
              <el-input-number v-model="conditions.levelMin" :min="1" :max="999" placeholder="不限制" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大等级">
              <el-input-number v-model="conditions.levelMax" :min="1" :max="999" placeholder="不限制" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="用户状态">
              <el-select v-model="conditions.status" placeholder="全部" clearable>
                <el-option label="全部" value="" />
                <el-option label="活跃" value="ACTIVE" />
                <el-option label="禁用" value="DISABLED" />
                <el-option label="封禁" value="BANNED" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册开始日期">
              <el-date-picker
                v-model="conditions.createTimeStart"
                type="date"
                placeholder="不限制"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册结束日期">
              <el-date-picker
                v-model="conditions.createTimeEnd"
                type="date"
                placeholder="不限制"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="段位">
              <el-select v-model="conditions.rank" placeholder="全部" clearable>
                <el-option label="青铜" value="BRONZE" />
                <el-option label="白银" value="SILVER" />
                <el-option label="黄金" value="GOLD" />
                <el-option label="铂金" value="PLATINUM" />
                <el-option label="钻石" value="DIAMOND" />
                <el-option label="大师" value="MASTER" />
                <el-option label="王者" value="KING" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最少钻石">
              <el-input-number v-model="conditions.diamondMin" :min="0" :max="999999999" placeholder="不限制" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最少金币">
              <el-input-number v-model="conditions.goldMin" :min="0" :max="999999999" placeholder="不限制" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="N天内登录">
              <el-input-number v-model="conditions.loginDaysWithin" :min="1" :max="365" placeholder="不限制" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 收件人预览 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item>
              <el-button type="info" @click="previewRecipients" :loading="previewLoading">
                预览收件人
              </el-button>
              <span v-if="recipientCount !== null" class="recipient-count">
                符合条件用户：<strong>{{ recipientCount }}</strong> 人
              </span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 邮件附件 -->
        <el-divider content-position="left">邮件附件</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="attachment-section">
              <el-button type="primary" plain @click="addAttachment">
                <el-icon><Plus /></el-icon>
                添加附件
              </el-button>

              <el-table :data="form.attachments" stripe style="width: 100%; margin-top: 16px">
                <el-table-column label="物品类型" width="150">
                  <template #default="{ row, $index }">
                    <el-select v-model="row.itemType" placeholder="请选择">
                      <el-option label="钻石" value="DIAMOND" />
                      <el-option label="金币" value="COIN" />
                      <el-option label="皮肤" value="SKIN" />
                      <el-option label="道具" value="ITEM" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="物品编码" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.itemCode" placeholder="物品ID/编码" />
                  </template>
                </el-table-column>
                <el-table-column label="物品名称" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.itemName" placeholder="物品名称" />
                  </template>
                </el-table-column>
                <el-table-column label="数量" width="120">
                  <template #default="{ row }">
                    <el-input-number v-model="row.quantity" :min="1" :max="99999" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="{ $index }">
                    <el-button type="danger" text size="small" @click="removeAttachment($index)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
        </el-row>

        <!-- 有效期设置 -->
        <el-divider content-position="left">有效期设置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮件过期时间">
              <el-date-picker
                v-model="form.expireTime"
                type="datetime"
                placeholder="不设置则永不过期"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 操作按钮 -->
        <el-divider content-position="left">操作</el-divider>
        <el-form-item>
          <el-button type="primary" @click="handleSaveDraft" :loading="saving">
            保存草稿
          </el-button>
          <el-button type="success" @click="handleSend" :loading="sending" :disabled="!canSend">
            发送邮件
          </el-button>
          <el-button @click="router.push('/mails')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 收件人预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="收件人预览" width="700px">
      <el-table :data="previewUsers" v-loading="previewLoading" stripe max-height="400">
        <el-table-column prop="id" label="用户ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickName" label="昵称" width="120" />
        <el-table-column prop="level" label="等级" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'ACTIVE' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="recipientCount > 100" class="preview-note">
        仅显示前100条，更多用户将收到邮件
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Back } from '@element-plus/icons-vue'
import { getMailById, saveDraft, createMail, updateMail, previewRecipients as previewRecipientsApi, countRecipients } from '@/apis/mail'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id)
const mailId = computed(() => route.params.id ? parseInt(route.params.id) : null)

const formRef = ref(null)
const saving = ref(false)
const sending = ref(false)
const previewLoading = ref(false)
const previewDialogVisible = ref(false)
const previewUsers = ref([])
const recipientCount = ref(null)

const form = reactive({
  title: '',
  content: '',
  expireTime: null,
  attachments: []
})

const conditions = reactive({
  levelMin: null,
  levelMax: null,
  status: '',
  createTimeStart: '',
  createTimeEnd: '',
  rank: '',
  diamondMin: null,
  goldMin: null,
  loginDaysWithin: null
})

const rules = {
  title: [{ required: true, message: '请输入邮件标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入邮件内容', trigger: 'blur' }]
}

const canSend = computed(() => {
  return form.title && form.content && recipientCount.value !== null && recipientCount.value > 0
})

const getConditionsJson = () => {
  const cond = {}
  if (conditions.levelMin) cond.levelMin = conditions.levelMin
  if (conditions.levelMax) cond.levelMax = conditions.levelMax
  if (conditions.status) cond.status = conditions.status
  if (conditions.createTimeStart) cond.createTimeStart = conditions.createTimeStart + 'T00:00:00'
  if (conditions.createTimeEnd) cond.createTimeEnd = conditions.createTimeEnd + 'T23:59:59'
  if (conditions.rank) cond.rank = conditions.rank
  if (conditions.diamondMin) cond.diamondMin = conditions.diamondMin
  if (conditions.goldMin) cond.goldMin = conditions.goldMin
  if (conditions.loginDaysWithin) cond.loginDaysWithin = conditions.loginDaysWithin

  const hasConditions = Object.keys(cond).length > 0
  return hasConditions ? JSON.stringify(cond) : ''
}

const previewRecipients = async () => {
  previewLoading.value = true
  try {
    const conditionsJson = getConditionsJson()
    const [previewRes, countRes] = await Promise.all([
      previewRecipientsApi(conditionsJson),
      countRecipients(conditionsJson)
    ])
    previewUsers.value = previewRes.data || []
    recipientCount.value = countRes.data || 0
    previewDialogVisible.value = true
  } catch (error) {
    ElMessage.error('预览收件人失败: ' + (error.message || '未知错误'))
  } finally {
    previewLoading.value = false
  }
}

const loadMail = async () => {
  if (!mailId.value) return
  try {
    const res = await getMailById(mailId.value)
    const mail = res.data
    if (mail) {
      form.title = mail.title
      form.content = mail.content
      form.expireTime = mail.expireTime
      form.attachments = mail.attachments || []

      // 解析条件
      if (mail.targetConditions) {
        try {
          const cond = JSON.parse(mail.targetConditions)
          conditions.levelMin = cond.levelMin || null
          conditions.levelMax = cond.levelMax || null
          conditions.status = cond.status || ''
          conditions.createTimeStart = cond.createTimeStart ? cond.createTimeStart.split('T')[0] : ''
          conditions.createTimeEnd = cond.createTimeEnd ? cond.createTimeEnd.split('T')[0] : ''
          conditions.rank = cond.rank || ''
          conditions.diamondMin = cond.diamondMin || null
          conditions.goldMin = cond.goldMin || null
          conditions.loginDaysWithin = cond.loginDaysWithin || null
        } catch (e) {
          console.error('解析条件失败', e)
        }
      }

      // 获取收件人数
      if (mail.targetConditions) {
        const countRes = await countRecipients(mail.targetConditions)
        recipientCount.value = countRes.data || 0
      }
    }
  } catch (error) {
    ElMessage.error('加载邮件失败: ' + (error.message || '未知错误'))
  }
}

const addAttachment = () => {
  form.attachments.push({
    itemType: 'DIAMOND',
    itemCode: '',
    itemName: '',
    quantity: 1
  })
}

const removeAttachment = (index) => {
  form.attachments.splice(index, 1)
}

const handleSaveDraft = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const data = {
      title: form.title,
      content: form.content,
      expireTime: form.expireTime,
      targetConditions: getConditionsJson(),
      attachments: form.attachments.filter(a => a.itemType && a.itemCode)
    }

    if (isEdit.value) {
      data.id = mailId.value
      data.status = 'DRAFT'
      await updateMail(mailId.value, data)
    } else {
      await createMail(data)
    }
    ElMessage.success('保存草稿成功')
    router.push('/mails')
  } catch (error) {
    ElMessage.error('保存失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

const handleSend = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (recipientCount.value === null || recipientCount.value === 0) {
    ElMessage.warning('没有符合条件的收件人，请调整条件')
    return
  }

  sending.value = true
  try {
    // 先保存
    const data = {
      title: form.title,
      content: form.content,
      expireTime: form.expireTime,
      targetConditions: getConditionsJson(),
      attachments: form.attachments.filter(a => a.itemType && a.itemCode)
    }

    let savedMailId
    if (isEdit.value) {
      data.id = mailId.value
      data.status = 'DRAFT'
      const res = await updateMail(mailId.value, data)
      savedMailId = res.data?.id || mailId.value
    } else {
      const res = await createMail(data)
      savedMailId = res.data.id
    }

    // 发送
    await sendMail(savedMailId, '系统管理员')

    // 发送
    await sendMail(mailId, '系统管理员')

    ElMessage.success('邮件发送成功')
    router.push('/mails')
  } catch (error) {
    ElMessage.error('发送失败: ' + (error.message || '未知错误'))
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  if (isEdit.value) {
    loadMail()
  }
})
</script>

<style scoped>
.mail-edit-container {
  max-width: 1000px;
}

.recipient-count {
  margin-left: 16px;
  font-size: 14px;
}

.recipient-count strong {
  color: #409eff;
  font-size: 16px;
}

.preview-note {
  margin-top: 12px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.attachment-section {
  padding: 8px 0;
}
</style>
