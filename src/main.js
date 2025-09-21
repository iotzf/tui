import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 导入Element Plus和样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 导入所有图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入路由
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用Element Plus
app.use(ElementPlus)

// 使用路由
app.use(router)

app.mount('#app')
