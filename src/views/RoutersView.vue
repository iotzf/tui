<template>
  <div class="routers-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>路由管理</h1>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="Search routes..."
            prefix-icon="Search"
            style="width: 300px; margin-right: 10px"
          />
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增路由
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Routes Table -->
    <el-card class="routes-table-card">
      <el-table
        :data="filteredRouters"
        style="width: 100%"
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="entryPoints" label="Entry Points" width="180">
          <template #default="scope">
            <el-tag v-for="entry in scope.row.entryPoints" :key="entry" type="info" size="small" style="margin-right: 5px">
              {{ entry }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rule" label="Rule" />
        <el-table-column prop="middlewares" label="Middlewares" width="200">
          <template #default="scope">
            <el-tag v-for="middleware in scope.row.middlewares" :key="middleware" type="primary" size="small" style="margin-right: 5px">
              {{ middleware }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="service" label="Service" width="180" />
        <el-table-column prop="priority" label="Priority" width="100" />
        <el-table-column prop="status" label="Status" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
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
              @click="deleteRouter(scope.row)"
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
        :total="filteredRouters.length"
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
        ref="routerFormRef"
        :model="routerForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="routerForm.name" placeholder="Enter route name" />
        </el-form-item>
        <el-form-item label="Entry Points" prop="entryPoints">
          <el-select
            v-model="routerForm.entryPoints"
            placeholder="Select entry points"
            multiple
            filterable
          >
            <el-option label="web" value="web" />
            <el-option label="websecure" value="websecure" />
            <el-option label="api" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="Rule" prop="rule">
          <el-input v-model="routerForm.rule" placeholder="e.g. Host(`example.com`)" />
        </el-form-item>
        <el-form-item label="Middlewares" prop="middlewares">
          <el-select
            v-model="routerForm.middlewares"
            placeholder="Select middlewares"
            multiple
            filterable
          >
            <el-option
              v-for="middleware in availableMiddlewares"
              :key="middleware"
              :label="middleware"
              :value="middleware"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Service" prop="service">
          <el-input v-model="routerForm.service" placeholder="Enter service name" />
        </el-form-item>
        <el-form-item label="Priority" prop="priority">
          <el-input-number
            v-model="routerForm.priority"
            :min="0"
            :max="1000"
            placeholder="Enter priority"
          />
        </el-form-item>
        <el-form-item label="Status">
          <el-radio-group v-model="routerForm.status">
            <el-radio label="enabled">Enabled</el-radio>
            <el-radio label="disabled">Disabled</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">Cancel</el-button>
          <el-button type="primary" @click="saveRouter">Save</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'RoutersView',
  setup() {
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 对话框状态
    const dialogVisible = ref(false)
    const dialogTitle = ref('Add New Route')
    const editingRouterId = ref(null)
    const routerFormRef = ref(null)
    
    // 路由列表数据
    const routers = ref([
      {
        id: 1,
        name: 'api-gateway',
        entryPoints: ['web', 'websecure'],
        rule: "Host(`api.example.com`)\n && PathPrefix(`/api`)\n",
        middlewares: ['auth', 'rate-limit'],
        service: 'api-service',
        priority: 100,
        status: 'enabled'
      },
      {
        id: 2,
        name: 'web-app',
        entryPoints: ['web', 'websecure'],
        rule: "Host(`app.example.com`)\n",
        middlewares: ['compress'],
        service: 'web-service',
        priority: 80,
        status: 'enabled'
      },
      {
        id: 3,
        name: 'static-files',
        entryPoints: ['web', 'websecure'],
        rule: "Host(`static.example.com`)\n",
        middlewares: [],
        service: 'static-service',
        priority: 60,
        status: 'enabled'
      },
      {
        id: 4,
        name: 'old-api',
        entryPoints: ['web'],
        rule: "Host(`old-api.example.com`)\n",
        middlewares: [],
        service: 'old-api-service',
        priority: 40,
        status: 'disabled'
      }
    ])
    
    // 可用的中间件列表
    const availableMiddlewares = ref([
      'auth',
      'rate-limit',
      'compress',
      'cors',
      'redirect-https',
      'basic-auth',
      'strip-prefix'
    ])
    
    // 表单数据
    const routerForm = reactive({
      name: '',
      entryPoints: [],
      rule: '',
      middlewares: [],
      service: '',
      priority: 0,
      status: 'enabled'
    })
    
    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: 'Please enter route name', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (editingRouterId.value) {
              const duplicate = routers.value.some(
                router => router.name === value && router.id !== editingRouterId.value
              )
              if (duplicate) {
                callback(new Error('Route name already exists'))
              } else {
                callback()
              }
            } else {
              const duplicate = routers.value.some(router => router.name === value)
              if (duplicate) {
                callback(new Error('Route name already exists'))
              } else {
                callback()
              }
            }
          },
          trigger: 'blur'
        }
      ],
      entryPoints: [
        { required: true, message: 'Please select at least one entry point', trigger: 'change' }
      ],
      rule: [
        { required: true, message: 'Please enter rule', trigger: 'blur' }
      ],
      service: [
        { required: true, message: 'Please enter service name', trigger: 'blur' }
      ],
      priority: [
        { type: 'number', message: 'Priority must be a number', trigger: 'blur' }
      ]
    }
    
    // 计算属性：筛选后的路由列表
    const filteredRouters = computed(() => {
      if (!searchQuery.value) {
        return routers.value
      }
      const query = searchQuery.value.toLowerCase()
      return routers.value.filter(router =>
        router.name.toLowerCase().includes(query) ||
        router.rule.toLowerCase().includes(query) ||
        router.service.toLowerCase().includes(query) ||
        router.entryPoints.some(entry => entry.toLowerCase().includes(query)) ||
        router.middlewares.some(middleware => middleware.toLowerCase().includes(query))
      )
    })
    
    // 计算属性：分页后的路由列表
    const paginatedRouters = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      return filteredRouters.value.slice(startIndex, endIndex)
    })
    
    // 显示添加对话框
    const showAddDialog = () => {
      dialogTitle.value = 'Add New Route'
      editingRouterId.value = null
      resetForm()
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (router) => {
      dialogTitle.value = 'Edit Route'
      editingRouterId.value = router.id
      
      // 复制路由数据到表单
      Object.assign(routerForm, {
        name: router.name,
        entryPoints: [...router.entryPoints],
        rule: router.rule,
        middlewares: [...router.middlewares],
        service: router.service,
        priority: router.priority,
        status: router.status
      })
      
      dialogVisible.value = true
    }
    
    // 保存路由
    const saveRouter = async () => {
      // 验证表单
      if (!routerFormRef.value) {
        ElMessage.error('Form reference not initialized')
        return
      }
      
      try {
        await routerFormRef.value.validate()
      } catch (error) {
        return
      }
      
      try {
        loading.value = true
        
        if (editingRouterId.value) {
          // 编辑现有路由
          const index = routers.value.findIndex(r => r.id === editingRouterId.value)
          if (index !== -1) {
            routers.value[index] = {
              ...routers.value[index],
              ...routerForm
            }
          }
          ElMessage.success('Route updated successfully')
        } else {
          // 添加新路由
          const newRouter = {
            id: Date.now(),
            ...routerForm
          }
          routers.value.unshift(newRouter)
          ElMessage.success('Route added successfully')
        }
        
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('Failed to save route')
        console.error('Error saving route:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 删除路由
    const deleteRouter = (router) => {
      ElMessageBox.confirm(
        `Are you sure you want to delete the route "${router.name}"?`,
        'Confirm Delete',
        {
          confirmButtonText: 'Yes',
          cancelButtonText: 'No',
          type: 'warning'
        }
      )
        .then(() => {
          const index = routers.value.findIndex(r => r.id === router.id)
          if (index !== -1) {
            routers.value.splice(index, 1)
            ElMessage.success('Route deleted successfully')
          }
        })
        .catch(() => {
          ElMessage.info('Delete canceled')
        })
    }
    
    // 重置表单
    const resetForm = () => {
      Object.assign(routerForm, {
        name: '',
        entryPoints: [],
        rule: '',
        middlewares: [],
        service: '',
        priority: 0,
        status: 'enabled'
      })
      
      if (routerFormRef.value) {
        routerFormRef.value.resetFields()
      }
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
    
    return {
      loading,
      searchQuery,
      currentPage,
      pageSize,
      dialogVisible,
      dialogTitle,
      routers,
      routerForm,
      formRules,
      availableMiddlewares,
      filteredRouters,
      paginatedRouters,
      showAddDialog,
      showEditDialog,
      saveRouter,
      deleteRouter,
      resetForm,
      closeDialog,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.routers-container {
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

.routes-table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>