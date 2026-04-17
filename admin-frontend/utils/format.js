export function formatDateTime(dateTimeString) {
  if (!dateTimeString) return ''
  const date = new Date(dateTimeString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatNumber(num) {
  if (num === null || num === undefined) return ''
  return Number(num).toLocaleString('zh-CN')
}

export function formatWinRate(winGames, totalGames) {
  if (winGames === null || winGames === undefined || totalGames === null || totalGames === undefined || totalGames === 0) return '0%'
  const rate = (winGames / totalGames) * 100
  return rate.toFixed(2) + '%'
}
