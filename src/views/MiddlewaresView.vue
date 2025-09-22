<template>
  <div class="middlewares-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>Middlewares Management</h1>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="Search middlewares..."
            prefix-icon="Search"
            style="width: 300px; margin-right: 10px"
          />
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> Add Middleware
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Middlewares Table -->
    <el-card class="middlewares-table-card">
      <el-table
        :data="filteredMiddlewares"
        style="width: 100%"
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="type" label="Type" width="150">
          <template #default="scope">
            <el-tag :type="getMiddlewareTypeTag(scope.row.type)">
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
        <el-table-column prop="usedBy" label="Used By" width="200">
          <template #default="scope">
            <el-tag v-for="router in scope.row.usedBy" :key="router" type="info" size="small" style="margin-right: 5px">
              {{ router }}
            </el-tag>
            <span v-if="scope.row.usedBy.length === 0">-</span>
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
              @click="deleteMiddleware(scope.row)"
              :disabled="scope.row.usedBy.length > 0"
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
        :total="filteredMiddlewares.length"
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
        ref="middlewareFormRef"
        :model="middlewareForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="middlewareForm.name" placeholder="Enter middleware name" />
        </el-form-item>
        <el-form-item label="Type" prop="type">
          <el-select v-model="middlewareForm.type" placeholder="Select middleware type">
            <el-option v-for="type in middlewareTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="Configuration" prop="config">
          <el-input
            v-model="middlewareForm.config"
            type="textarea"
            placeholder="Enter configuration as JSON"
            rows="6"
          />
          <div class="config-hint">Enter JSON configuration (e.g. {"limit": "100/min"})</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveMiddleware">Save</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Config Details Dialog -->
    <el-dialog
      v-model="configDialogVisible"
      title="Middleware Configuration"
      width="600px"
    >
      <pre class="config-code">{{ JSON.stringify(selectedMiddlewareConfig, null, 2) }}</pre>
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
  name: 'MiddlewaresView',
  setup() {
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 表单引用
    const middlewareFormRef = ref(null)
    // 对话框状态
    const dialogVisible = ref(false)
    const configDialogVisible = ref(false)
    const dialogTitle = ref('Add New Middleware')
    const editingMiddlewareId = ref(null)
    const selectedMiddlewareConfig = ref({})
    
    // 中间件列表数据
    const middlewares = ref([
      {
        id: 1,
        name: 'auth',
        type: 'basicAuth',
        config: '{"users": ["user:password"]}',
        usedBy: ['api-gateway']
      },
      {
        id: 2,
        name: 'rate-limit',
        type: 'ratelimit',
        config: '{"limit": "100/min", "burst": 50}',
        usedBy: ['api-gateway']
      },
      {
        id: 3,
        name: 'compress',
        type: 'compress',
        config: '{"minResponseBodyBytes": 1024}',
        usedBy: ['web-app']
      },
      {
        id: 4,
        name: 'cors',
        type: 'cors',
        config: '{"allowedOrigins": ["*"], "allowedMethods": ["GET", "POST"]}',
        usedBy: []
      },
      {
        id: 5,
        name: 'redirect-https',
        type: 'redirectScheme',
        config: '{"scheme": "https", "permanent": true}',
        usedBy: []
      }
    ])
    
    // 中间件类型列表
    const middlewareTypes = ref([
      'basicAuth',
      'ratelimit',
      'compress',
      'cors',
      'redirectScheme',
      'stripPrefix',
      'stripPrefixRegex',
      'replacePath',
      'replacePathRegex',
      'chain',
      'headers',
      'ipWhiteList',
      'ipBlackList',
      'circuitBreaker'
    ])
    
    // 表单数据
    const middlewareForm = reactive({
      name: '',
      type: '',
      config: ''
    })
    
    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: 'Please enter middleware name', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (editingMiddlewareId.value) {
              const duplicate = middlewares.value.some(
                middleware => middleware.name === value && middleware.id !== editingMiddlewareId.value
              )
              if (duplicate) {
                callback(new Error('Middleware name already exists'))
              } else {
                callback()
              }
            } else {
              const duplicate = middlewares.value.some(middleware => middleware.name === value)
              if (duplicate) {
                callback(new Error('Middleware name already exists'))
              } else {
                callback()
              }
            }
          },
          trigger: 'blur'
        }
      ],
      type: [
        { required: true, message: 'Please select middleware type', trigger: 'change' }
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
    
    // 计算属性：筛选后的中间件列表
    const filteredMiddlewares = computed(() => {
      if (!searchQuery.value) {
        return middlewares.value
      }
      const query = searchQuery.value.toLowerCase()
      return middlewares.value.filter(middleware =>
        middleware.name.toLowerCase().includes(query) ||
        middleware.type.toLowerCase().includes(query) ||
        (middleware.config && middleware.config.toLowerCase().includes(query)) ||
        middleware.usedBy.some(router => router.toLowerCase().includes(query))
      )
    })
    
    // 获取中间件类型标签样式
    const getMiddlewareTypeTag = (type) => {
      const typeMap = {
        basicAuth: 'warning',
        ratelimit: 'danger',
        compress: 'success',
        cors: 'primary',
        redirectScheme: 'info',
        stripPrefix: 'info',
        headers: 'success',
        default: 'default'
      }
      return typeMap[type] || typeMap.default
    }
    
    // 显示配置详情
    const showConfigDetails = (middleware) => {
      try {
        selectedMiddlewareConfig.value = middleware.config ? JSON.parse(middleware.config) : {}
      } catch (e) {
        selectedMiddlewareConfig.value = { error: 'Invalid JSON format' }
      }
      configDialogVisible.value = true
    }
    
    // 显示添加对话框
    const showAddDialog = () => {
      dialogTitle.value = 'Add New Middleware'
      editingMiddlewareId.value = null
      resetForm()
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (middleware) => {
      dialogTitle.value = 'Edit Middleware'
      editingMiddlewareId.value = middleware.id
      
      // 复制中间件数据到表单
      Object.assign(middlewareForm, {
        name: middleware.name,
        type: middleware.type,
        config: middleware.config || ''
      })
      
      dialogVisible.value = true
    }
    
    // 保存中间件
    const saveMiddleware = async () => {
      // 验证表单
      if (!middlewareFormRef.value) return
      
      const isValid = await middlewareFormRef.value.validate()
      
      if (!isValid) {
        return
      }
      
      try {
        loading.value = true
        
        if (editingMiddlewareId.value) {
          // 编辑现有中间件
          const index = middlewares.value.findIndex(m => m.id === editingMiddlewareId.value)
          if (index !== -1) {
            middlewares.value[index] = {
              ...middlewares.value[index],
              ...middlewareForm
            }
          }
          ElMessage.success('Middleware updated successfully')
        } else {
          // 添加新中间件
          const newMiddleware = {
            id: Date.now(),
            ...middlewareForm,
            usedBy: []
          }
          middlewares.value.unshift(newMiddleware)
          ElMessage.success('Middleware added successfully')
        }
        
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('Failed to save middleware')
        console.error('Error saving middleware:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 删除中间件
    const deleteMiddleware = (middleware) => {
      ElMessageBox.confirm(
        `Are you sure you want to delete the middleware "${middleware.name}"?`,
        'Confirm Delete',
        {
          confirmButtonText: 'Yes',
          cancelButtonText: 'No',
          type: 'warning'
        }
      )
        .then(() => {
          const index = middlewares.value.findIndex(m => m.id === middleware.id)
          if (index !== -1) {
            middlewares.value.splice(index, 1)
            ElMessage.success('Middleware deleted successfully')
          }
        })
        .catch(() => {
          ElMessage.info('Delete canceled')
        })
    }
    
    // 重置表单
    const resetForm = () => {
      Object.assign(middlewareForm, {
        name: '',
        type: '',
        config: ''
      })
      
      if (middlewareFormRef.value) {
        middlewareFormRef.value.resetFields()
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
      middlewares,
      middlewareForm,
      formRules,
      middlewareTypes,
      selectedMiddlewareConfig,
      filteredMiddlewares,
      getMiddlewareTypeTag,
      showConfigDetails,
      showAddDialog,
      showEditDialog,
      saveMiddleware,
      deleteMiddleware,
      resetForm,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.middlewares-container {
  padding: 20px;
}

.middlewares-table-card {
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