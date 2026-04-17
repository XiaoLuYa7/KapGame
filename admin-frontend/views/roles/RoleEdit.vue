<template>
  <div>
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑角色' : '创建角色' }}</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="角色名" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入角色描述" rows="3" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" active-value="ACTIVE" inactive-value="INACTIVE" />
        </el-form-item>

        <el-form-item label="权限" prop="permissionIds">
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTreeData"
            :props="{ children: 'children', label: 'name' }"
            show-checkbox
            node-key="id"
            :default-expand-all="false"
            :default-expanded-keys="expandedNodeIds"
            @check="handlePermissionCheck"
          />
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
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createRole, updateRole, getRoleById, getPermissionTree, getRolePermissionTree } from '@/apis/roles'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)

const formRef = ref(null)
const permissionTreeRef = ref(null)
const permissionTreeData = ref([])
const expandedNodeIds = ref([])

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.status = 'ACTIVE'
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const loadFormData = async () => {
  if (route.params.id) {
    const res = await getRoleById(route.params.id)
    const data = res.data
    form.name = data.name || ''
    form.description = data.description || ''
    form.status = data.status || 'ACTIVE'
  } else {
    resetForm()
  }
}

const form = reactive({
  name: '',
  description: '',
  status: 'ACTIVE'
})

watch(() => route.params.id, () => {
  loadFormData()
}, { immediate: false })

const rules = {
  name: [{ required: true, message: '请输入角色名', trigger: 'blur' }]
}

const loadPermissionTree = async () => {
  if (route.params.id) {
    const res = await getRolePermissionTree(route.params.id)
    permissionTreeData.value = res.data || []
    // 默认展开两层（第一层MENU，第二层PAGE）
    expandedNodeIds.value = getAllNodeIds(permissionTreeData.value, 2)
    nextTick(() => {
      const checkedIds = getAllCheckedLeafIds(permissionTreeData.value)
      checkedIds.forEach(id => {
        permissionTreeRef.value?.setChecked(id, true, false)
      })
    })
  } else {
    const res = await getPermissionTree()
    permissionTreeData.value = res.data || []
    // 默认展开两层（第一层MENU，第二层PAGE）
    expandedNodeIds.value = getAllNodeIds(permissionTreeData.value, 2)
  }
}

// 获取指定深度范围内的所有节点ID
const getAllNodeIds = (nodes, depth) => {
  const ids = []
  const collect = (nodeList, currentDepth) => {
    if (currentDepth > depth) return
    for (const node of nodeList) {
      ids.push(node.id)
      if (node.children && node.children.length > 0) {
        collect(node.children, currentDepth + 1)
      }
    }
  }
  collect(nodes, 1)
  return ids
}

const getAllCheckedLeafIds = (nodes) => {
  let ids = []
  for (const node of nodes) {
    if (node.checked && (!node.children || node.children.length === 0)) {
      ids.push(node.id)
    }
    if (node.children && node.children.length > 0) {
      ids = ids.concat(getAllCheckedLeafIds(node.children))
    }
  }
  return ids
}

// 勾选权限时的处理：勾选非VIEW权限时自动勾选VIEW权限
const handlePermissionCheck = (node, checked) => {
  if (!checked.checked) return // 只处理勾选，不处理取消

  // 如果勾选的是叶子节点（非VIEW权限），需要自动勾选同模块的VIEW权限
  if (!node.children || node.children.length === 0) {
    const code = node.code || ''
    if (code.endsWith(':VIEW')) return // VIEW权限不需要处理

    // 找到同模块的VIEW权限
    const moduleCode = code.split(':')[0]
    const viewCode = moduleCode + ':VIEW'

    // 在树中找到VIEW权限节点并勾选
    const viewNode = findNodeByCode(permissionTreeData.value, viewCode)
    if (viewNode && !permissionTreeRef.value?.getNode(viewNode.id)?.checked) {
      permissionTreeRef.value?.setChecked(viewNode.id, true, false)
    }
  }
}

// 根据code查找节点
const findNodeByCode = (nodes, code) => {
  for (const node of nodes) {
    if (node.code === code) return node
    if (node.children && node.children.length > 0) {
      const found = findNodeByCode(node.children, code)
      if (found) return found
    }
  }
  return null
}

// 验证权限树：检查是否有操作权限但没有查看权限
const validatePermissions = () => {
  const checkedNodes = permissionTreeRef.value?.getCheckedNodes() || []
  const checkedCodes = checkedNodes.map(n => n.code)

  // 检查每个模块：如果有非VIEW权限，必须有VIEW权限
  const modules = {}
  for (const code of checkedCodes) {
    if (code === 'ROOT' || code.startsWith('MODULE:')) continue
    if (!code.includes(':')) continue

    const module = code.split(':')[0]
    const action = code.split(':')[1]

    if (!modules[module]) modules[module] = new Set()
    modules[module].add(action)
  }

  const invalidModules = []
  for (const [module, actions] of Object.entries(modules)) {
    const hasView = actions.has('VIEW')
    const hasOther = actions.size > 1 || !hasView
    if (!hasView && actions.size > 0) {
      invalidModules.push(module)
    }
  }

  return invalidModules
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 验证权限：检查是否有操作权限但没有查看权限
  const invalidModules = validatePermissions()
  if (invalidModules.length > 0) {
    ElMessage.error(`以下模块缺少查看权限：${invalidModules.join('、')}。请先勾选查看权限后再勾选其他操作权限。`)
    return
  }

  try {
    // Build tree data with current checked state from el-tree
    // 需要同时获取完全选中的节点和半选中的节点，否则取消勾选子节点时父节点会被遗漏
    const tree = permissionTreeRef.value
    const fullyChecked = tree?.getCheckedNodes(false, false) || []
    const halfChecked = tree?.getHalfCheckedNodes() || []
    const allChecked = [...fullyChecked, ...halfChecked]
    const treeData = JSON.parse(JSON.stringify(permissionTreeData.value))
    markTreeChecked(treeData, allChecked)

    const submitData = {
      name: form.name,
      description: form.description,
      status: form.status,
      permissionTree: treeData
    }
    if (isEdit.value && !submitData.password) {
      delete submitData.password
    }
    if (isEdit.value) {
      const res = await updateRole(route.params.id, submitData)
      if (res.requiresReLogin) {
        ElMessage.warning('您修改了自身的权限配置，需要重新登录后才能生效')
        router.back()
      } else {
        ElMessage.success('更新成功')
        router.back()
      }
    } else {
      await createRole(submitData)
      ElMessage.success('创建成功')
      router.back()
    }
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  }
}

const markTreeChecked = (nodes, checkedNodes) => {
  for (const node of nodes) {
    node.checked = checkedNodes.some(c => c.id === node.id)
    if (node.children && node.children.length > 0) {
      // 如果当前节点未被勾选但有子节点被勾选，也标记为半选状态
      if (!node.checked) {
        node.checked = node.children.some(child => isNodeOrDescendantChecked(child, checkedNodes))
      }
      markTreeChecked(node.children, checkedNodes)
    }
  }
}

const isNodeOrDescendantChecked = (node, checkedNodes) => {
  if (checkedNodes.some(c => c.id === node.id)) return true
  if (node.children && node.children.length > 0) {
    return node.children.some(child => isNodeOrDescendantChecked(child, checkedNodes))
  }
  return false
}

onMounted(async () => {
  await loadPermissionTree()
  loadFormData()
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
