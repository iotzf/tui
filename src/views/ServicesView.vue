<template>
  <div class="services-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>服务管理</h1>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索服务..."
            prefix-icon="Search"
            style="width: 300px; margin-right: 10px"
          />
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增服务
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Services Table -->
    <el-card class="services-table-card">
      <el-table
        :data="paginatedServices"
        style="width: 100%"
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="服务名称" width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="目标URL" v-if="showUrlColumn" />
        <el-table-column prop="loadBalancer.servers" label="后端服务器" v-if="showLoadBalancerColumn">
          <template #default="scope">
            <template v-if="scope.row.loadBalancer && scope.row.loadBalancer.servers && scope.row.loadBalancer.servers.length > 0">
              <el-tag type="info" v-for="server in scope.row.loadBalancer.servers" :key="server.url" style="margin-right: 5px">
                {{ server.url }}
              </el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="usedByRouters" label="使用路由数" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
              {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
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
              @click="deleteService(scope.row)"
              :disabled="scope.row.usedByRouters > 0"
              :tooltip="scope.row.usedByRouters > 0 ? '服务正在被路由使用，无法删除' : ''"
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
        :total="filteredServices.length"
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
        ref="serviceFormRef"
        :model="serviceForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="serviceForm.name" placeholder="输入服务名称" :disabled="editingServiceId !== null" />
        </el-form-item>
        <el-form-item label="服务类型" prop="type">
          <el-select v-model="serviceForm.type" placeholder="选择服务类型">
            <el-option label="http" value="http" />
            <el-option label="https" value="https" />
            <el-option label="loadBalancer" value="loadBalancer" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标URL" prop="url" v-if="serviceForm.type === 'http' || serviceForm.type === 'https'">
          <el-input v-model="serviceForm.url" placeholder="输入目标URL" />
        </el-form-item>
        <el-form-item label="后端服务器" prop="loadBalancer.servers" v-if="serviceForm.type === 'loadBalancer'">
          <el-input v-model="serverUrl" placeholder="输入后端服务器URL" style="margin-bottom: 10px" />
          <el-button type="primary" @click="addServer" style="margin-bottom: 10px">添加服务器</el-button>
          <div v-if="serviceForm.loadBalancer.servers && serviceForm.loadBalancer.servers.length > 0">
            <el-tag 
              v-for="(server, index) in serviceForm.loadBalancer.servers" 
              :key="index" 
              closable
              @close="removeServer(index)"
              style="margin-right: 10px; margin-bottom: 10px"
            >
              {{ server.url }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="serviceForm.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveService">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 模拟获取路由数据
const getRoutesData = () => {
  return [
    {
      id: 1,
      name: 'api-gateway',
      service: 'api-service'
    },
    {
      id: 2,
      name: 'web-app',
      service: 'web-service'
    },
    {
      id: 3,
      name: 'admin-panel',
      service: 'admin-service'
    }
  ]
}

export default {
  name: 'ServicesView',
  setup() {
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 对话框状态
    const dialogVisible = ref(false)
    const dialogTitle = ref('新增服务')
    const editingServiceId = ref(null)
    const serviceFormRef = ref(null)
    const serverUrl = ref('')
    
    // 服务列表数据
    const services = ref([
      {
        id: 1,
        name: 'api-service',
        type: 'http',
        url: 'http://api-backend:8000',
        usedByRouters: 1,
        status: 'enabled'
      },
      {
        id: 2,
        name: 'web-service',
        type: 'https',
        url: 'https://web-backend:8443',
        usedByRouters: 1,
        status: 'enabled'
      },
      {
        id: 3,
        name: 'admin-service',
        type: 'loadBalancer',
        loadBalancer: {
          servers: [
            { url: 'http://admin-server1:9000' },
            { url: 'http://admin-server2:9000' }
          ]
        },
        usedByRouters: 1,
        status: 'enabled'
      },
      {
        id: 4,
        name: 'static-files',
        type: 'http',
        url: 'http://static-server:8080',
        usedByRouters: 0,
        status: 'disabled'
      }
    ])
    
    // 表单数据
    const serviceForm = reactive({
      name: '',
      type: 'http',
      url: '',
      loadBalancer: {
        servers: []
      },
      status: 'enabled'
    })
    
    // 表单验证规则
    const formRules = reactive({
      name: [
        { required: true, message: '请输入服务名称', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value && value.trim() === '') {
              callback(new Error('服务名称不能为空'))
              return
            }
            
            // 检查名称唯一性
            const isDuplicate = services.value.some(
              service => service.name === value && service.id !== editingServiceId.value
            )
            
            if (isDuplicate) {
              callback(new Error('服务名称已存在'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      type: [
        { required: true, message: '请选择服务类型', trigger: 'change' }
      ],
      url: [
        {
          required: () => serviceForm.type === 'http' || serviceForm.type === 'https',
          message: '请输入目标URL',
          trigger: 'blur'
        },
        {
          validator: (rule, value, callback) => {
            if (serviceForm.type === 'http' || serviceForm.type === 'https') {
              const urlPattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/
              if (value && !urlPattern.test(value)) {
                callback(new Error('请输入有效的URL格式'))
                return
              }
            }
            callback()
          },
          trigger: 'blur'
        }
      ],
      'loadBalancer.servers': [
        {
          required: () => serviceForm.type === 'loadBalancer',
          message: '请至少添加一个后端服务器',
          trigger: 'change'
        }
      ]
    })
    
    // 过滤服务列表
    const filteredServices = computed(() => {
      if (!searchQuery.value.trim()) {
        return services.value
      }
      
      const query = searchQuery.value.toLowerCase()
      return services.value.filter(service => 
        service.name.toLowerCase().includes(query) ||
        service.type.toLowerCase().includes(query) ||
        (service.url && service.url.toLowerCase().includes(query))
      )
    })
    
    // 分页服务列表
    const paginatedServices = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      return filteredServices.value.slice(startIndex, endIndex)
    })
    
    // 显示URL列
    const showUrlColumn = computed(() => {
      return services.value.some(service => service.type === 'http' || service.type === 'https')
    })
    
    // 显示负载均衡器列
    const showLoadBalancerColumn = computed(() => {
      return services.value.some(service => service.type === 'loadBalancer')
    })
    
    // 获取类型标签类型
    const getTypeTagType = (type) => {
      switch (type) {
        case 'http':
          return 'info'
        case 'https':
          return 'success'
        case 'loadBalancer':
          return 'warning'
        default:
          return 'default'
      }
    }
    
    // 添加后端服务器
    const addServer = () => {
      if (!serverUrl.value.trim()) {
        ElMessage.warning('请输入服务器URL')
        return
      }
      
      const urlPattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/
      if (!urlPattern.test(serverUrl.value)) {
        ElMessage.warning('请输入有效的服务器URL')
        return
      }
      
      serviceForm.loadBalancer.servers.push({ url: serverUrl.value })
      serverUrl.value = ''
    }
    
    // 移除后端服务器
    const removeServer = (index) => {
      serviceForm.loadBalancer.servers.splice(index, 1)
    }
    
    // 显示添加对话框
    const showAddDialog = () => {
      dialogTitle.value = '新增服务'
      editingServiceId.value = null
      resetForm()
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (service) => {
      dialogTitle.value = '编辑服务'
      editingServiceId.value = service.id
      
      // 复制服务数据到表单
      Object.assign(serviceForm, {
        name: service.name,
        type: service.type,
        url: service.url || '',
        loadBalancer: {
          servers: service.loadBalancer ? JSON.parse(JSON.stringify(service.loadBalancer.servers || [])) : { servers: [] }
        },
        status: service.status
      })
      
      dialogVisible.value = true
    }
    
    // 保存服务
    const saveService = async () => {
      // 验证表单
      if (!serviceFormRef.value) {
        ElMessage.error('表单引用未初始化')
        return
      }
      
      try {
        await serviceFormRef.value.validate()
      } catch (error) {
        return
      }
      
      try {
        loading.value = true
        
        if (editingServiceId.value) {
          // 编辑现有服务
          const index = services.value.findIndex(s => s.id === editingServiceId.value)
          if (index !== -1) {
            // 保留usedByRouters值，因为它是从路由计算得出的
            const usedByRouters = services.value[index].usedByRouters
            services.value[index] = {
              ...services.value[index],
              ...JSON.parse(JSON.stringify(serviceForm)),
              usedByRouters
            }
          }
          ElMessage.success('服务更新成功')
        } else {
          // 添加新服务
          const newService = {
            id: Date.now(),
            ...JSON.parse(JSON.stringify(serviceForm)),
            usedByRouters: 0
          }
          services.value.unshift(newService)
          ElMessage.success('服务添加成功')
        }
        
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('保存服务失败')
        console.error('保存服务错误:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 删除服务
    const deleteService = (service) => {
      ElMessageBox.confirm(
        `确定要删除服务 "${service.name}" 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          const index = services.value.findIndex(s => s.id === service.id)
          if (index !== -1) {
            services.value.splice(index, 1)
            ElMessage.success('服务删除成功')
          }
        })
        .catch(() => {
          ElMessage.info('已取消删除')
        })
    }
    
    // 重置表单
    const resetForm = () => {
      Object.assign(serviceForm, {
        name: '',
        type: 'http',
        url: '',
        loadBalancer: {
          servers: []
        },
        status: 'enabled'
      })
      
      if (serviceFormRef.value) {
        serviceFormRef.value.resetFields()
      }
      
      serverUrl.value = ''
    }
    
    // 关闭对话框
    const closeDialog = () => {
      dialogVisible.value = false
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
    
    // 计算服务被路由使用的数量
    const calculateServicesUsedByRouters = () => {
      const routes = getRoutesData()
      
      // 重置所有服务的使用计数
      services.value.forEach(service => {
        service.usedByRouters = 0
      })
      
      // 统计每个服务被路由使用的数量
      routes.forEach(route => {
        if (route.service) {
          const service = services.value.find(s => s.name === route.service)
          if (service) {
            service.usedByRouters++
          }
        }
      })
    }
    
    // 初始化时计算服务使用情况
    calculateServicesUsedByRouters()
    
    return {
      loading,
      searchQuery,
      currentPage,
      pageSize,
      dialogVisible,
      dialogTitle,
      editingServiceId,
      serviceFormRef,
      serverUrl,
      services,
      serviceForm,
      formRules,
      filteredServices,
      paginatedServices,
      showUrlColumn,
      showLoadBalancerColumn,
      getTypeTagType,
      addServer,
      removeServer,
      showAddDialog,
      showEditDialog,
      saveService,
      deleteService,
      resetForm,
      closeDialog,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.services-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  color: #2563EB;
}

.header-actions {
  display: flex;
  align-items: center;
}

.services-table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>