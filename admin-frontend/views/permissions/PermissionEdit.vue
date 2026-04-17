<template>
  <div>
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑权限' : '创建权限' }}</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="权限代码" prop="code">
          <el-input v-model="form.code" placeholder="如：USER:VIEW" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入权限名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入权限描述" rows="3" />
        </el-form-item>

        <el-form-item label="权限类型" prop="type">
          <el-select v-model="form.type" :disabled="isEdit || form.code === 'ROOT'" style="width: 100%">
            <el-option label="根目录" value="ROOT" />
            <el-option label="菜单类型" value="MENU" />
            <el-option label="页面" value="PAGE" />
            <el-option label="功能" value="FUNCTION" />
          </el-select>
        </el-form-item>

        <el-form-item label="父权限" prop="parentId">
          <el-select v-model="form.parentId" placeholder="请选择父权限" :disabled="form.type === 'ROOT' || isEdit" style="width: 100%" clearable>
            <el-option
              v-for="item in availableParents"
              :key="item.id"
              :label="`${item.id} - ${item.code} - ${item.name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="排序号" prop="orderNum">
          <el-input-number v-model="form.orderNum" :min="0" :max="999" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">数字越小越靠前</span>
        </el-form-item>

        <el-form-item v-if="form.type === 'PAGE'" label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="Element Plus图标名称，如：User" />
        </el-form-item>

        <el-form-item v-if="form.type === 'PAGE'" label="路由路径" prop="routePath">
          <el-input v-model="form.routePath" placeholder="/users" />
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
import { createPermission, updatePermission, getPermissionById, getPermissionTree } from '@/apis/permissions'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)

const formRef = ref(null)
const permissionTree = ref([])
const allPermissions = ref([])

const form = reactive({
  code: '',
  name: '',
  description: '',
  type: 'FUNCTION',
  parentId: null,
  orderNum: 0,
  icon: '',
  routePath: ''
})

const rules = {
  code: [{ required: true, message: '请输入权限代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择权限类型', trigger: 'change' }]
}

// 根据选择的类型获取可选的父权限
const availableParents = computed(() => {
  if (!form.type || form.type === 'ROOT') return []

  const parents = []
  const addParents = (nodes) => {
    for (const node of nodes) {
      const canSelect =
        (form.type === 'MENU' && node.type === 'ROOT') ||
        (form.type === 'PAGE' && node.type === 'MENU') ||
        (form.type === 'FUNCTION' && node.type === 'PAGE')

      if (canSelect) {
        parents.push(node)
      }
      if (node.children && node.children.length > 0) {
        addParents(node.children)
      }
    }
  }
  addParents(allPermissions.value)
  return parents
})

// 将树扁平化
const flattenTree = (nodes) => {
  const result = []
  for (const node of nodes) {
    result.push(node)
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

// 加载树数据
const loadPermissionTree = async () => {
  const res = await getPermissionTree()
  permissionTree.value = res.data || []
  allPermissions.value = flattenTree(res.data || [])
}

const loadFormData = async () => {
  if (route.params.id) {
    const res = await getPermissionById(route.params.id)
    const data = res.data
    form.code = data.code || ''
    form.name = data.name || ''
    form.description = data.description || ''
    form.type = data.type || 'FUNCTION'
    form.parentId = data.parentId
    form.orderNum = data.orderNum || 0
    form.icon = data.icon || ''
    form.routePath = data.routePath || ''
  }
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (form.type !== 'ROOT' && !form.parentId) {
    ElMessage.error('请选择父权限')
    return
  }

  try {
    const submitData = {
      code: form.code,
      name: form.name,
      description: form.description,
      type: form.type,
      parentId: form.parentId || null,
      orderNum: form.orderNum || 0,
      icon: form.icon || null,
      routePath: form.routePath || null,
      isDeletable: true
    }

    if (isEdit.value) {
      await updatePermission(route.params.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await createPermission(submitData)
      ElMessage.success('创建成功')
    }
    router.back()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  }
}

onMounted(async () => {
  await loadPermissionTree()
  loadFormData()
})
</script>
