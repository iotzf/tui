<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>Welcome to Traefik Router Management</span>
        </div>
      </template>
      <div class="welcome-content">
        <div class="traefik-logo">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M60 0L120 40V80L60 120L0 80V40L60 0Z" fill="#2563EB"/>
            <path d="M60 20L100 40V80L60 100L20 80V40L60 20Z" fill="#3B82F6"/>
            <path d="M60 40L80 50V90L60 100L40 90V50L60 40Z" fill="#93C5FD"/>
          </svg>
        </div>
        <h1>Traefik Admin Dashboard</h1>
        <p>Manage your Traefik routers, middlewares and providers with ease.</p>
        <div class="dashboard-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon">
                    <el-icon><Menu /></el-icon>
                  </div>
                  <div class="stat-number">{{ stats.routers }}</div>
                  <div class="stat-label">Routers</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon">
                    <el-icon><Filter /></el-icon>
                  </div>
                  <div class="stat-number">{{ stats.middlewares }}</div>
                  <div class="stat-label">Middlewares</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon">
                    <el-icon><Box /></el-icon>
                  </div>
                  <div class="stat-number">{{ stats.providers }}</div>
                  <div class="stat-label">Providers</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon">
                    <el-icon><Check /></el-icon>
                  </div>
                  <div class="stat-number">{{ stats.services }}</div>
                  <div class="stat-label">Services</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
        <div class="dashboard-actions">
          <el-button type="primary" @click="goToRouters" class="action-button">
            <el-icon><Menu /></el-icon> Manage Routers
          </el-button>
          <el-button type="primary" @click="goToMiddlewares" class="action-button">
            <el-icon><Filter /></el-icon> Configure Middlewares
          </el-button>
          <el-button type="primary" @click="goToProviders" class="action-button">
            <el-icon><Layers /></el-icon> Setup Providers
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Recent Activities -->
    <el-card class="activities-card">
      <template #header>
        <div class="card-header">
          <span>Recent Activities</span>
        </div>
      </template>
      <el-table :data="activities" style="width: 100%">
        <el-table-column prop="time" label="Time" width="180" />
        <el-table-column prop="action" label="Action" />
        <el-table-column prop="user" label="User" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter()
    
    // 模拟数据
    const stats = ref({
      routers: 24,
      middlewares: 18,
      providers: 6,
      services: 32
    })
    
    const activities = ref([
      {
        time: '2023-11-28 14:30',
        action: 'Created new router: api-gateway',
        user: 'admin'
      },
      {
        time: '2023-11-28 13:15',
        action: 'Updated middleware: rate-limit',
        user: 'admin'
      },
      {
        time: '2023-11-28 11:45',
        action: 'Deleted provider: file-config',
        user: 'admin'
      },
      {
        time: '2023-11-28 10:20',
        action: 'Added service: web-app',
        user: 'admin'
      }
    ])
    
    // 导航方法
    const goToRouters = () => {
      router.push('/routers')
    }
    
    const goToMiddlewares = () => {
      router.push('/middlewares')
    }
    
    const goToProviders = () => {
      router.push('/providers')
    }
    
    return {
      stats,
      activities,
      goToRouters,
      goToMiddlewares,
      goToProviders
    }
  }
}
</script>

<style scoped>
.home-container {
  padding: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  margin-bottom: 20px;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
}

.traefik-logo {
  margin-bottom: 20px;
}

.welcome-content h1 {
  color: #2563EB;
  margin-bottom: 10px;
}

.welcome-content p {
  color: #4B5563;
  margin-bottom: 30px;
}

.dashboard-stats {
  width: 100%;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  height: 85px;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 32px;
  color: #2563EB;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  flex: 1;
  height: 100%;
  padding: 5px 0;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #1F2937;
  margin-right: 10px;
}

.stat-label {
  color: #6B7280;
  font-size: 16px;
}

.dashboard-actions {
  display: flex;
  gap: 15px;
}

.action-button {
  min-width: 180px;
}

.activities-card {
  margin-top: 20px;
}
</style>