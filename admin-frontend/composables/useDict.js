import { ref } from 'vue'
import { getDictByCategories } from '@/apis/sysDict'

const dictCache = ref({})

export function useDict() {
  const loadDict = async (categories) => {
    if (!categories || categories.length === 0) return
    try {
      const res = await getDictByCategories(categories)
      if (res.data) {
        Object.assign(dictCache.value, res.data)
      }
    } catch (error) {
      console.error('加载字典失败:', error)
    }
  }

  const getDict = (category) => {
    if (!dictCache.value[category]) {
      return []
    }
    return dictCache.value[category]
  }

  const getDictLabel = (category, code) => {
    if (!code) return ''
    const list = dictCache.value[category] || []
    const item = list.find(d => d.code === code)
    return item ? item.value : code
  }

  const getDictCodeLabel = (category, code) => {
    if (!code) return ''
    const list = dictCache.value[category] || []
    const item = list.find(d => d.code === code)
    if (item) {
      return `${item.code}-${item.value}`
    }
    return code
  }

  return {
    dictCache,
    loadDict,
    getDict,
    getDictLabel,
    getDictCodeLabel
  }
}
