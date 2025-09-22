<template>
  <div class="settings-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>Settings</h1>
      </div>
    </el-card>
    
    <el-card class="settings-card">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="General Settings">
          <el-form
            ref="generalFormRef"
            :model="generalSettings"
            :rules="generalFormRules"
            label-width="150px"
            class="settings-form"
          >
            <el-form-item label="API Endpoint" prop="apiEndpoint">
              <el-input v-model="generalSettings.apiEndpoint" placeholder="Enter Traefik API endpoint" />
            </el-form-item>
            <el-form-item label="Timeout (ms)" prop="timeout">
              <el-input-number
                v-model="generalSettings.timeout"
                :min="1000"
                :max="30000"
                placeholder="Enter timeout"
              />
            </el-form-item>
            <el-form-item label="Refresh Interval (s)" prop="refreshInterval">
              <el-input-number
                v-model="generalSettings.refreshInterval"
                :min="5"
                :max="300"
                placeholder="Enter refresh interval"
              />
            </el-form-item>
            <el-form-item label="Enable Debug Mode">
              <el-switch v-model="generalSettings.enableDebug" />
            </el-form-item>
            <el-form-item label="Theme">
              <el-radio-group v-model="generalSettings.theme">
                <el-radio label="light">Light</el-radio>
                <el-radio label="dark">Dark</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveGeneralSettings">Save Settings</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="Authentication">
          <el-form
            ref="authFormRef"
            :model="authSettings"
            :rules="authFormRules"
            label-width="150px"
            class="settings-form"
          >
            <el-form-item label="Enable Authentication" prop="enableAuth">
              <el-switch v-model="authSettings.enableAuth" />
            </el-form-item>
            <el-form-item label="Username" prop="username" v-if="authSettings.enableAuth">
              <el-input v-model="authSettings.username" placeholder="Enter username" />
            </el-form-item>
            <el-form-item label="Password" prop="password" v-if="authSettings.enableAuth">
              <el-input v-model="authSettings.password" type="password" placeholder="Enter password" />
            </el-form-item>
            <el-form-item label="Confirm Password" prop="confirmPassword" v-if="authSettings.enableAuth">
              <el-input v-model="authSettings.confirmPassword" type="password" placeholder="Confirm password" />
            </el-form-item>
            <el-form-item label="Auth Method" prop="authMethod" v-if="authSettings.enableAuth">
              <el-select v-model="authSettings.authMethod" placeholder="Select authentication method">
                <el-option label="Basic Auth" value="basic" />
                <el-option label="API Key" value="apiKey" />
              </el-select>
            </el-form-item>
            <el-form-item label="API Key" prop="apiKey" v-if="authSettings.enableAuth && authSettings.authMethod === 'apiKey'">
              <el-input v-model="authSettings.apiKey" placeholder="Enter API key" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveAuthSettings">Save Settings</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="Advanced">
          <el-form
            ref="advancedFormRef"
            :model="advancedSettings"
            :rules="advancedFormRules"
            label-width="150px"
            class="settings-form"
          >
            <el-form-item label="Log Level" prop="logLevel">
              <el-select v-model="advancedSettings.logLevel" placeholder="Select log level">
                <el-option label="Debug" value="debug" />
                <el-option label="Info" value="info" />
                <el-option label="Warn" value="warn" />
                <el-option label="Error" value="error" />
              </el-select>
            </el-form-item>
            <el-form-item label="Enable CORS">
              <el-switch v-model="advancedSettings.enableCors" />
            </el-form-item>
            <el-form-item label="Custom Headers" prop="customHeaders" v-if="advancedSettings.enableCors">
              <el-input
                v-model="advancedSettings.customHeaders"
                type="textarea"
                placeholder="Enter custom headers as JSON"
                rows="4"
              />
              <div class="config-hint">Format: {"Header-Name": "value", ...}</div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveAdvancedSettings">Save Settings</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="About">
          <div class="about-content">
            <div class="about-logo">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <path d="M60 0L120 40V80L60 120L0 80V40L60 0Z" fill="#2563EB"/>
                <path d="M60 20L100 40V80L60 100L20 80V40L60 20Z" fill="#3B82F6"/>
                <path d="M60 40L80 50V90L60 100L40 90V50L60 40Z" fill="#93C5FD"/>
              </svg>
            </div>
            <h2>Traefik Router Management</h2>
            <p class="version">Version 1.0.0</p>
            <p class="description">
              A modern web interface for managing Traefik reverse proxy routes, middlewares, and providers.
            </p>
            <div class="features">
              <h3>Key Features:</h3>
              <ul>
                <li>Route management with advanced configuration</li>
                <li>Middleware creation and customization</li>
                <li>Provider configuration and status monitoring</li>
                <li>Responsive design with dark mode support</li>
                <li>Advanced authentication options</li>
              </ul>
            </div>
            <div class="dependencies">
              <h3>Built With:</h3>
              <div class="dependency-list">
                <el-tag type="primary" size="small" class="dependency-tag">Vue 3</el-tag>
                <el-tag type="primary" size="small" class="dependency-tag">Vite</el-tag>
                <el-tag type="primary" size="small" class="dependency-tag">Element Plus</el-tag>
                <el-tag type="primary" size="small" class="dependency-tag">Vue Router</el-tag>
                <el-tag type="primary" size="small" class="dependency-tag">Axios</el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'SettingsView',
  setup() {
    const activeTab = ref('0')
    
    // 通用设置
    const generalSettings = reactive({
      apiEndpoint: 'http://localhost:8080/api',
      timeout: 10000,
      refreshInterval: 30,
      enableDebug: false,
      theme: 'light'
    })
    
    // 通用设置表单验证规则
    const generalFormRules = {
      apiEndpoint: [
        { required: true, message: 'Please enter API endpoint', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            try {
              new URL(value)
              callback()
            } catch (e) {
              callback(new Error('Invalid URL format'))
            }
          },
          trigger: 'blur'
        }
      ],
      timeout: [
        { type: 'number', required: true, message: 'Please enter timeout', trigger: 'blur' }
      ],
      refreshInterval: [
        { type: 'number', required: true, message: 'Please enter refresh interval', trigger: 'blur' }
      ]
    }
    
    // 认证设置
    const authSettings = reactive({
      enableAuth: false,
      username: '',
      password: '',
      confirmPassword: '',
      authMethod: 'basic',
      apiKey: ''
    })
    
    // 认证设置表单验证规则
    const authFormRules = {
      username: [
        { required: true, message: 'Please enter username', trigger: 'blur', vIf: () => authSettings.enableAuth }
      ],
      password: [
        {
          required: true,
          message: 'Please enter password',
          trigger: 'blur',
          vIf: () => authSettings.enableAuth && authSettings.authMethod === 'basic'
        },
        {
          min: 6,
          message: 'Password must be at least 6 characters',
          trigger: 'blur',
          vIf: () => authSettings.enableAuth && authSettings.authMethod === 'basic'
        }
      ],
      confirmPassword: [
        {
          required: true,
          message: 'Please confirm password',
          trigger: 'blur',
          vIf: () => authSettings.enableAuth && authSettings.authMethod === 'basic'
        },
        {
          validator: (rule, value, callback) => {
            if (authSettings.enableAuth && authSettings.authMethod === 'basic') {
              if (value !== authSettings.password) {
                callback(new Error('Passwords do not match'))
              } else {
                callback()
              }
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      apiKey: [
        {
          required: true,
          message: 'Please enter API key',
          trigger: 'blur',
          vIf: () => authSettings.enableAuth && authSettings.authMethod === 'apiKey'
        }
      ]
    }
    
    // 高级设置
    const advancedSettings = reactive({
      logLevel: 'info',
      enableCors: false,
      customHeaders: '{"X-Powered-By": "Traefik Admin"}'
    })
    
    // 高级设置表单验证规则
    const advancedFormRules = {
      customHeaders: [
        {
          validator: (rule, value, callback) => {
            if (advancedSettings.enableCors && value && value.trim()) {
              try {
                JSON.parse(value)
                callback()
              } catch (e) {
                callback(new Error('Invalid JSON format'))
              }
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }
    
    // 保存通用设置
    const saveGeneralSettings = async () => {
      const generalFormRef = document.querySelector('.settings-form')
      const isValid = generalFormRef.validate()
      
      if (!isValid) {
        return
      }
      
      try {
        // 这里应该有保存设置的逻辑，实际项目中可能会调用API
        console.log('Saving general settings:', generalSettings)
        
        // 更新主题
        if (generalSettings.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        
        ElMessage.success('General settings saved successfully')
      } catch (error) {
        ElMessage.error('Failed to save general settings')
        console.error('Error saving general settings:', error)
      }
    }
    
    // 保存认证设置
    const saveAuthSettings = async () => {
      const authFormRef = document.querySelectorAll('.settings-form')[1]
      const isValid = authFormRef.validate()
      
      if (!isValid) {
        return
      }
      
      try {
        // 这里应该有保存设置的逻辑
        console.log('Saving auth settings:', authSettings)
        
        ElMessage.success('Authentication settings saved successfully')
      } catch (error) {
        ElMessage.error('Failed to save authentication settings')
        console.error('Error saving authentication settings:', error)
      }
    }
    
    // 保存高级设置
    const saveAdvancedSettings = async () => {
      const advancedFormRef = document.querySelectorAll('.settings-form')[2]
      const isValid = advancedFormRef.validate()
      
      if (!isValid) {
        return
      }
      
      try {
        // 这里应该有保存设置的逻辑
        console.log('Saving advanced settings:', advancedSettings)
        
        ElMessage.success('Advanced settings saved successfully')
      } catch (error) {
        ElMessage.error('Failed to save advanced settings')
        console.error('Error saving advanced settings:', error)
      }
    }
    
    return {
      activeTab,
      generalSettings,
      generalFormRules,
      authSettings,
      authFormRules,
      advancedSettings,
      advancedFormRules,
      saveGeneralSettings,
      saveAuthSettings,
      saveAdvancedSettings
    }
  }
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.settings-card {
  margin-bottom: 20px;
}

.settings-form {
  padding: 20px;
}

.config-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.about-logo {
  margin-bottom: 20px;
}

.about-content h2 {
  color: #2563EB;
  margin-bottom: 10px;
}

.version {
  color: #6B7280;
  font-size: 16px;
  margin-bottom: 20px;
}

.description {
  color: #4B5563;
  margin-bottom: 30px;
  max-width: 600px;
}

.features {
  margin-bottom: 30px;
  text-align: left;
  max-width: 600px;
}

.features h3 {
  color: #1F2937;
  margin-bottom: 10px;
}

.features ul {
  list-style-type: disc;
  padding-left: 20px;
}

.features li {
  margin-bottom: 5px;
  color: #4B5563;
}

.dependencies {
  max-width: 600px;
}

.dependencies h3 {
  color: #1F2937;
  margin-bottom: 15px;
}

.dependency-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.dependency-tag {
  margin: 5px;
}
</style>