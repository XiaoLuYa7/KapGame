import api from './index'

/**
 * 获取仪表盘统计数据
 */
export const getDashboardStats = () => {
  return api.get('/admin/dashboard/stats-new')
}

/**
 * 获取昨日收益汇总
 */
export const getYesterdayEarnings = () => {
  return api.get('/admin/dashboard/yesterday-earnings')
}
