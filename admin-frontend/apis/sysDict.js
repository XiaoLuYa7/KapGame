import api from './index'

export const getDictByCategory = (category) => {
  return api.get(`/admin/dict/category/${category}`)
}

export const getDictByCategories = (categories) => {
  const categoryStr = Array.isArray(categories) ? categories.join(',') : categories
  return api.get('/admin/dict/categories', { params: { categories: categoryStr } })
}

export const getAllDicts = () => {
  return api.get('/admin/dict/all')
}
