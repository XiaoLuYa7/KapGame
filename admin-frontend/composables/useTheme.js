import { ref, watch, onMounted } from 'vue'

const theme = ref('light')

export function useTheme() {
  const initTheme = () => {
    const saved = localStorage.getItem('kapgame-theme')
    if (saved) {
      theme.value = saved
    }
    applyTheme(theme.value)
  }

  const applyTheme = (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('kapgame-theme', newTheme)
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(theme.value)
  }

  const isDark = () => theme.value === 'dark'

  onMounted(() => {
    initTheme()
  })

  watch(theme, (newVal) => {
    applyTheme(newVal)
  })

  return {
    theme,
    toggleTheme,
    isDark
  }
}
