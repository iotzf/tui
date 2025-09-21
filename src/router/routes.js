// 定义应用的路由
import { createRouter, createWebHistory } from 'vue-router'

// 导入组件
import HomeView from '../views/HomeView.vue'
import RoutersView from '../views/RoutersView.vue'
import MiddlewaresView from '../views/MiddlewaresView.vue'
import ProvidersView from '../views/ProvidersView.vue'
import SettingsView from '../views/SettingsView.vue'
import EntryPointsView from '../views/EntryPointsView.vue'

// 定义路由
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'Dashboard',
      icon: 'HomeFilled'
    }
  },
  {
    path: '/routers',
    name: 'routers',
    component: RoutersView,
    meta: {
      title: 'Routes Management',
      icon: 'Menu'
    }
  },
  {
    path: '/middlewares',
    name: 'middlewares',
    component: MiddlewaresView,
    meta: {
      title: 'Middlewares',
      icon: 'Filter'
    }
  },
  {
    path: '/providers',
    name: 'providers',
    component: ProvidersView,
    meta: {
      title: 'Providers',
      icon: 'Layers'
    }
  },
  {
    path: '/entry-points',
    name: 'entryPoints',
    component: EntryPointsView,
    meta: {
      title: 'Entry Points Management',
      icon: 'Switch'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: {
      title: 'Settings',
      icon: 'Setting'
    }
  }
]

// 创建路由实例
export default routes