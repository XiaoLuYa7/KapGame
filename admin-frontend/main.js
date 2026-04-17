import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import { permissionDirective, hasPermissionDirective, buttonPermissionDirective } from '@/directives/permission'

const app = createApp(App)

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Register permission directives
app.directive('permission', permissionDirective)
app.directive('has-permission', hasPermissionDirective)
app.directive('has-button', buttonPermissionDirective)

app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.mount('#app')
