<template>
  <div class="providers-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>Providers Management</h1>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="Search providers..."
            prefix-icon="Search"
            style="width: 300px; margin-right: 10px"
          />
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> Add Provider
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Providers Table -->
    <el-card class="providers-table-card">
      <el-table
        :data="filteredProviders"
        style="width: 100%"
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="type" label="Type" width="150">
          <template #default="scope">
            <el-tag :type="getProviderTypeTag(scope.row.type)">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="config" label="Configuration">
          <template #default="scope">
            <el-button
              type="text"
              @click="showConfigDetails(scope.row)"
              v-if="scope.row.config"
            >
              View Config
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'warning'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="150" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              icon="Edit"
              size="small"
              @click="showEditDialog(scope.row)"
              style="margin-right: 5px"
            />
            <el-button
              type="danger"
              icon="Delete"
              size="small"
              @click="deleteProvider(scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- Pagination -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredProviders.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form
        ref="providerFormRef"
        :model="providerForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="providerForm.name" placeholder="Enter provider name" />
        </el-form-item>
        <el-form-item label="Type" prop="type">
          <el-select v-model="providerForm.type" placeholder="Select provider type">
            <el-option v-for="type in providerTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="Configuration" prop="config">
          <el-input
            v-model="providerForm.config"
            type="textarea"
            placeholder="Enter configuration as JSON"
            rows="6"
          />
          <div class="config-hint">Enter JSON configuration for the provider</div>
        </el-form-item>
        <el-form-item label="Status">
          <el-radio-group v-model="providerForm.status">
            <el-radio label="active">Active</el-radio>
            <el-radio label="inactive">Inactive</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveProvider">Save</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Config Details Dialog -->
    <el-dialog
      v-model="configDialogVisible"
      title="Provider Configuration"
      width="600px"
    >
      <pre class="config-code">{{ JSON.stringify(selectedProviderConfig, null, 2) }}</pre>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="configDialogVisible = false">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'ProvidersView',
  setup() {
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 对话框状态
    const dialogVisible = ref(false)
    const configDialogVisible = ref(false)
    const dialogTitle = ref('Add New Provider')
    const editingProviderId = ref(null)
    const selectedProviderConfig = ref({})
    
    // 表单引用
    const providerFormRef = ref(null)
    
    // 提供者列表数据
    const providers = ref([
      {
        id: 1,
        name: 'docker',
        type: 'docker',
        config: '{"endpoint": "unix:///var/run/docker.sock", "exposedByDefault": false, "network": "traefik"}',
        status: 'active'
      },
      {
        id: 2,
        name: 'kubernetes',
        type: 'kubernetes',
        config: '{"namespaces": ["default", "traefik"], "ingressClass": "traefik"}',
        status: 'active'
      },
      {
        id: 3,
        name: 'file-config',
        type: 'file',
        config: '{"filename": "/etc/traefik/dynamic.yml", "watch": true}',
        status: 'active'
      },
      {
        id: 4,
        name: 'consul',
        type: 'consul',
        config: '{"endpoint": "127.0.0.1:8500", "prefix": "traefik"}',
        status: 'inactive'
      }
    ])
    
    // 提供者类型列表
    const providerTypes = ref([
      'docker',
      'kubernetes',
      'file',
      'consul',
      'etcd',
      'zookeeper',
      'marathon',
      'rancher',
      'ecs',
      'acme',
      'http',
      'tcp'
    ])
    
    // 表单数据
    const providerForm = reactive({
      name: '',
      type: '',
      config: '',
      status: 'active'
    })
    
    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: 'Please enter provider name', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (editingProviderId.value) {
              const duplicate = providers.value.some(
                provider => provider.name === value && provider.id !== editingProviderId.value
              )
              if (duplicate) {
                callback(new Error('Provider name already exists'))
              } else {
                callback()
              }
            } else {
              const duplicate = providers.value.some(provider => provider.name === value)
              if (duplicate) {
                callback(new Error('Provider name already exists'))
              } else {
                callback()
              }
            }
          },
          trigger: 'blur'
        }
      ],
      type: [
        { required: true, message: 'Please select provider type', trigger: 'change' }
      ],
      config: [
        {
          validator: (rule, value, callback) => {
            if (value && value.trim()) {
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
    
    // 计算属性：筛选后的提供者列表
    const filteredProviders = computed(() => {
      if (!searchQuery.value) {
        return providers.value
      }
      const query = searchQuery.value.toLowerCase()
      return providers.value.filter(provider =>
        provider.name.toLowerCase().includes(query) ||
        provider.type.toLowerCase().includes(query) ||
        (provider.config && provider.config.toLowerCase().includes(query)) ||
        provider.status.toLowerCase().includes(query)
      )
    })
    
    // 获取提供者类型标签样式
    const getProviderTypeTag = (type) => {
      const typeMap = {
        docker: 'primary',
        kubernetes: 'info',
        file: 'success',
        consul: 'warning',
        etcd: 'warning',
        zookeeper: 'warning',
        default: 'default'
      }
      return typeMap[type] || typeMap.default
    }
    
    // 显示配置详情
    const showConfigDetails = (provider) => {
      try {
        selectedProviderConfig.value = provider.config ? JSON.parse(provider.config) : {}
      } catch (e) {
        selectedProviderConfig.value = { error: 'Invalid JSON format' }
      }
      configDialogVisible.value = true
    }
    
    // 显示添加对话框
    const showAddDialog = () => {
      dialogTitle.value = 'Add New Provider'
      editingProviderId.value = null
      resetForm()
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (provider) => {
      dialogTitle.value = 'Edit Provider'
      editingProviderId.value = provider.id
      
      // 复制提供者数据到表单
      Object.assign(providerForm, {
        name: provider.name,
        type: provider.type,
        config: provider.config || '',
        status: provider.status
      })
      
      dialogVisible.value = true
    }
    
    // 保存提供者
    const saveProvider = async () => {
      // 验证表单
      if (!providerFormRef.value) return
      
      const isValid = await providerFormRef.value.validate()
      
      if (!isValid) {
        return
      }
      
      try {
        loading.value = true
        
        if (editingProviderId.value) {
          // 编辑现有提供者
          const index = providers.value.findIndex(p => p.id === editingProviderId.value)
          if (index !== -1) {
            providers.value[index] = {
              ...providers.value[index],
              ...providerForm
            }
          }
          ElMessage.success('Provider updated successfully')
        } else {
          // 添加新提供者
          const newProvider = {
            id: Date.now(),
            ...providerForm
          }
          providers.value.unshift(newProvider)
          ElMessage.success('Provider added successfully')
        }
        
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('Failed to save provider')
        console.error('Error saving provider:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 删除提供者
    const deleteProvider = (provider) => {
      ElMessageBox.confirm(
        `Are you sure you want to delete the provider "${provider.name}"?`,
        'Confirm Delete',
        {
          confirmButtonText: 'Yes',
          cancelButtonText: 'No',
          type: 'warning'
        }
      )
        .then(() => {
          const index = providers.value.findIndex(p => p.id === provider.id)
          if (index !== -1) {
            providers.value.splice(index, 1)
            ElMessage.success('Provider deleted successfully')
          }
        })
        .catch(() => {
          ElMessage.info('Delete canceled')
        })
    }
    
    // 重置表单
    const resetForm = () => {
      Object.assign(providerForm, {
        name: '',
        type: '',
        config: '',
        status: 'active'
      })
      
      if (providerFormRef.value) {
        providerFormRef.value.resetFields()
      }
    }
    
    // 处理分页大小变化
    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
    }
    
    // 处理当前页变化
    const handleCurrentChange = (current) => {
      currentPage.value = current
    }
    
    return {
      loading,
      searchQuery,
      currentPage,
      pageSize,
      dialogVisible,
      configDialogVisible,
      dialogTitle,
      providers,
      providerForm,
      formRules,
      providerTypes,
      selectedProviderConfig,
      filteredProviders,
      getProviderTypeTag,
      showConfigDetails,
      showAddDialog,
      showEditDialog,
      saveProvider,
      deleteProvider,
      resetForm,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.providers-container {
  padding: 20px;
}

.providers-table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.config-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.config-code {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>