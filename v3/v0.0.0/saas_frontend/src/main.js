import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

// 스타일 파일 가져오기
import './assets/main.css'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Pinia 생성 및 플러그인 설정
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 앱 생성 및 마운트
const app = createApp(App)

app.use(pinia)
app.use(router)

app.use(ElementPlus)

// 전역 아이콘 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
