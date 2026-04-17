import api from './index'

/**
 * 分页查询收益记录
 */
export const getEarnings = (params) => {
  return api.get('/admin/earnings', { params })
}

/**
 * 获取昨日收益汇总
 */
export const getYesterdaySummary = () => {
  return api.get('/admin/earnings/yesterday-summary')
}

/**
 * 获取指定日期范围收益汇总
 */
export const getEarningsSummary = (startDate, endDate) => {
  return api.get('/admin/earnings/summary', {
    params: { startDate, endDate }
  })
}

/**
 * 创建收益记录
 */
export const createEarning = (data) => {
  return api.post('/admin/earnings', data)
}

/**
 * 删除收益记录
 */
export const deleteEarning = (id) => {
  return api.delete(`/admin/earnings/${id}`)
}
