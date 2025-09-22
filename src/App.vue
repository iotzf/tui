<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarCollapsed ? 64 : 250" :class="['sidebar', { collapsed: sidebarCollapsed }]">
      <div class="sidebar-header">
        <div class="logo-container">
          <svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 0L120 40V80L60 120L0 80V40L60 0Z" fill="#2563EB"/>
            <path d="M60 20L100 40V80L60 100L20 80V40L60 20Z" fill="#3B82F6"/>
            <path d="M60 40L80 50V90L60 100L40 90V50L60 40Z" fill="#93C5FD"/>
          </svg>
        </div>
        <h1 class="sidebar-title">Traefik Admin</h1>
      </div>
      
      <el-menu
        :default-active="activeRoute"
        class="sidebar-menu"
        router
        unique-opened
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>Dashboard</span>
        </el-menu-item>
        <el-menu-item index="/entry-points">
          <el-icon><Switch /></el-icon>
          <span>Entry Points</span>
        </el-menu-item>
        <el-menu-item index="/routers">
          <el-icon><Menu /></el-icon>
          <span>Routes</span>
        </el-menu-item>
        <el-menu-item index="/middlewares">
          <el-icon><Filter /></el-icon>
          <span>Middlewares</span>
        </el-menu-item>
        <el-menu-item index="/services">
          <el-icon><Service /></el-icon>
          <span>Services</span>
        </el-menu-item>
        <el-menu-item index="/providers">
          <el-icon><Box /></el-icon>
          <span>Providers</span>
        </el-menu-item>
        <el-menu-item index="/sockets">
          <el-icon><Link /></el-icon>
          <span>Socket5</span>
        </el-menu-item>
        <el-menu-item index="/firewall-rules">
          <el-icon><ChromeFilled /></el-icon>
          <span>防火墙规则</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>Settings</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区域 -->
    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="main-header">
        <div class="header-left">
          <el-icon class="toggle-sidebar-icon" @click="toggleSidebar"><Menu /></el-icon>
        </div>
        <div class="header-center">
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-badge :value="notifications.length" class="notification-badge">
            <el-icon class="notification-icon"><Bell /></el-icon>
          </el-badge>
          <div class="user-info">
            <el-avatar class="user-avatar">
              <span>AD</span>
            </el-avatar>
            <span class="username">Admin</span>
          </div>
        </div>
      </el-header>
      
      <!-- 内容区域 -->
      <el-main class="content-wrapper">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const sidebarCollapsed = ref(false)
    const notifications = ref([
      { id: 1, message: 'New route added', time: '10 minutes ago' },
      { id: 2, message: 'Provider status changed', time: '30 minutes ago' }
    ])
    
    // 计算当前活动路由
    const activeRoute = computed(() => route.path)
    
    // 计算当前页面标题
    const currentPageTitle = computed(() => {
      const titleMap = {
        '/': 'Dashboard',
        '/routers': 'Routes Management',
        '/middlewares': 'Middlewares Management',
        '/providers': 'Providers Management',
        '/entry-points': 'Entry Points Management',
        '/services': '服务管理',
        '/sockets': 'Socket5 管理',
        '/settings': 'Settings'
      }
      return titleMap[route.path] || 'Traefik Admin'
    })
    
    // 切换侧边栏
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }
    
    // 页面加载时执行
    onMounted(() => {
      // 可以在这里添加初始化逻辑
      console.log('Traefik Admin Dashboard loaded')
      
      // 检查本地存储中的设置
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    })
    
    return {
      activeRoute,
      currentPageTitle,
      sidebarCollapsed,
      notifications,
      toggleSidebar
    }
  }
}
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}

/* 应用容器样式 */
.app-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* 侧边栏样式 */
.sidebar {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  color: white;
  overflow-y: auto;
  transition: all 0.3s ease;
}

/* 主容器样式 */
.main-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: calc(100% - 250px);
  transition: width 0.3s ease;
}

.sidebar.collapsed + .main-container {
  width: calc(100% - 64px);
}

.sidebar.collapsed {
  width: 64px !important;
}

.sidebar-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-container {
  margin-bottom: 10px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.sidebar-menu {
  background: transparent !important;
  border-right: none !important;
}

.sidebar-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.9);
  background: transparent !important;
  border-left: 3px solid transparent;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white;
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.2) !important;
  border-left-color: #ffd04b;
}

/* 主容器样式 */
.main-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* 顶部导航栏样式 */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-sidebar-icon {
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.header-center {
  flex: 1;
  text-align: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #2563EB;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  cursor: pointer;
}

.notification-icon {
  font-size: 20px;
  color: #666;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #2563EB;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #666;
}

/* 内容区域样式 */
.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0; /* 修复flex子元素高度计算问题 */
}

/* 为响应式屏幕调整内容区域内边距 */
@media (max-width: 1024px) {
  .content-wrapper {
    padding: 15px;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 10px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 2000;
    left: -250px;
  }
  
  .sidebar.show {
    left: 0;
  }
  
  .header-left {
    margin-left: 0;
  }
}

/* 深色模式支持 */
.dark {
  color-scheme: dark;
}

.dark body {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.dark .main-header {
  background: #2d2d2d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.dark .content-wrapper {
  background-color: #1a1a1a;
}

.dark .page-title {
  color: #60a5fa;
}

.dark .toggle-sidebar-icon,
.dark .notification-icon,
.dark .username {
  color: #e0e0e0;
}
</style>
