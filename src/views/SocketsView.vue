<template>
  <div class="sockets-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>Socket5 管理</h1>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索Socket5连接..."
            prefix-icon="Search"
            style="width: 300px; margin-right: 10px"
          />
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增连接
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Sockets Table -->
    <el-card class="sockets-table-card">
      <el-table
        :data="paginatedSockets"
        style="width: 100%"
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="连接名称" width="220" />
        <el-table-column prop="host" label="主机" width="160" />
        <el-table-column prop="port" label="端口" width="90" />
        <el-table-column prop="username" label="用户名" width="130" />
        <el-table-column prop="authentication" label="认证方式" width="110">
          <template #default="scope">
            <el-tag :type="getAuthTagType(scope.row.authentication)">
              {{ scope.row.authentication === 'password' ? '密码' : '无' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
              {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usedByRouters" label="使用路由数" />
        <el-table-column label="操作" width="150">
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
              @click="deleteSocket(scope.row)"
              :disabled="scope.row.usedByRouters > 0"
              :tooltip="scope.row.usedByRouters > 0 ? 'Socket5连接正在被路由使用，无法删除' : ''"
            />
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredSockets.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="socketFormRef"
        :model="socketForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="连接名称" prop="name">
          <el-input v-model="socketForm.name" placeholder="请输入连接名称" />
        </el-form-item>
        <el-form-item label="主机" prop="host">
          <el-input v-model="socketForm.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model.number="socketForm.port" placeholder="请输入端口号" type="number" min="1" max="65535" />
        </el-form-item>
        <el-form-item label="认证方式" prop="authentication">
          <el-radio-group v-model="socketForm.authentication">
            <el-radio label="none">无认证</el-radio>
            <el-radio label="password">用户名密码</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="socketForm.authentication === 'password'" label="用户名" prop="username">
          <el-input v-model="socketForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="socketForm.authentication === 'password'" label="密码" prop="password">
          <el-input v-model="socketForm.password" placeholder="请输入密码" type="password" show-password />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="socketForm.status" :active-value="'enabled'" :inactive-value="'disabled'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveSocket">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'SocketsView',
  setup() {
    // 加载状态
    const loading = ref(false)
    
    // 搜索查询
    const searchQuery = ref('')
    
    // 分页相关
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 对话框相关
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const editingSocketId = ref(null)
    
    // 表单引用
    const socketFormRef = ref(null)
    
    // 模拟Socket5连接数据
    const sockets = ref([
      {
        id: 1,
        name: 'socket5-proxy-1',
        host: '192.168.1.100',
        port: 1080,
        authentication: 'none',
        status: 'enabled',
        usedByRouters: 2
      },
      {
        id: 2,
        name: 'socket5-proxy-2',
        host: '192.168.1.101',
        port: 1080,
        authentication: 'password',
        username: 'proxyuser',
        password: 'proxypass',
        status: 'enabled',
        usedByRouters: 1
      },
      {
        id: 3,
        name: 'socket5-backup',
        host: '192.168.1.102',
        port: 1080,
        authentication: 'none',
        status: 'disabled',
        usedByRouters: 0
      }
    ])
    
    // 表单数据
    const socketForm = reactive({
      name: '',
      host: '',
      port: 0,  // 使用0而不是null避免可能的reactive问题
      authentication: 'none',
      username: '',
      password: '',
      status: 'enabled'
    })
    
    // 表单验证规则
    const formRules = reactive({
      name: [
        { required: true, message: '请输入连接名称', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value && value.trim() === '') {
              callback(new Error('连接名称不能为空'))
              return
            }
            
            // 检查名称唯一性
            const isDuplicate = sockets.value.some(
              socket => socket.name === value && socket.id !== editingSocketId.value
            )
            
            if (isDuplicate) {
              callback(new Error('连接名称已存在'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      host: [
        { required: true, message: '请输入主机地址', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            // 简单的IP地址验证
            const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
            // 也接受域名格式
            const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
            
            if (value && !ipPattern.test(value) && !domainPattern.test(value)) {
              callback(new Error('请输入有效的IP地址或域名'))
              return
            }
            callback()
          },
          trigger: 'blur'
        }
      ],
      port: [
        { required: true, message: '请输入端口号', trigger: 'blur' },
        { type: 'number', min: 1, max: 65535, message: '端口号必须在1-65535之间', trigger: 'blur' }
      ],
      username: [
        {
          required: () => socketForm.authentication === 'password',
          message: '请输入用户名',
          trigger: 'blur'
        }
      ],
      password: [
        {
          required: () => socketForm.authentication === 'password',
          message: '请输入密码',
          trigger: 'blur'
        }
      ]
    })
    
    // 过滤Socket5连接列表
    const filteredSockets = computed(() => {
      if (!searchQuery.value.trim()) {
        return sockets.value
      }
      
      const query = searchQuery.value.toLowerCase()
      return sockets.value.filter(socket => 
        socket.name.toLowerCase().includes(query) ||
        socket.host.toLowerCase().includes(query) ||
        (socket.username && socket.username.toLowerCase().includes(query))
      )
    })
    
    // 分页Socket5连接列表
    const paginatedSockets = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      return filteredSockets.value.slice(startIndex, endIndex)
    })
    
    // 获取认证方式标签类型
    const getAuthTagType = (authType) => {
      return authType === 'password' ? 'warning' : 'success'
    }
    
    // 重置表单
    const resetForm = () => {
      if (socketFormRef.value) {
        socketFormRef.value.resetFields()
      } else {
          // 如果表单引用还未初始化，手动重置
          Object.assign(socketForm, {
            name: '',
            host: '',
            port: 0,
            authentication: 'none',
            username: '',
            password: '',
            status: 'enabled'
          })
        }
      editingSocketId.value = null
    }
    
    // 显示添加对话框
    const showAddDialog = () => {
      dialogTitle.value = '新增Socket5连接'
      editingSocketId.value = null
      resetForm()
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (socket) => {
      dialogTitle.value = '编辑Socket5连接'
      editingSocketId.value = socket.id
      
      // 复制Socket5连接数据到表单
      Object.assign(socketForm, {
        name: socket.name,
        host: socket.host,
        port: socket.port,
        authentication: socket.authentication || 'none',
        username: socket.username || '',
        password: socket.password || '',
        status: socket.status || 'enabled'
      })
      
      dialogVisible.value = true
    }
    
    // 关闭对话框
    const closeDialog = () => {
      dialogVisible.value = false
    }
    
    // 保存Socket5连接
    const saveSocket = async () => {
      // 验证表单
      if (!socketFormRef.value) {
        ElMessage.error('表单引用未初始化')
        return
      }
      
      try {
        await socketFormRef.value.validate()
      } catch (error) {
        return
      }
      
      loading.value = true
      
      try {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (editingSocketId.value) {
          // 编辑现有连接
          const index = sockets.value.findIndex(s => s.id === editingSocketId.value)
          if (index !== -1) {
            // 创建一个新对象，避免直接修改原数据
            const updatedSocket = {
              ...sockets.value[index],
              ...socketForm
            }
            sockets.value.splice(index, 1, updatedSocket)
            ElMessage.success('Socket5连接更新成功')
          }
        } else {
          // 添加新连接
          const newSocket = {
            id: Math.max(...sockets.value.map(s => s.id), 0) + 1,
            ...socketForm,
            usedByRouters: 0
          }
          sockets.value.unshift(newSocket)
          ElMessage.success('Socket5连接添加成功')
        }
        
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('操作失败，请重试')
        console.error('Save socket error:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 删除Socket5连接
    const deleteSocket = async (socket) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除Socket5连接"${socket.name}"吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        loading.value = true
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const index = sockets.value.findIndex(s => s.id === socket.id)
        if (index !== -1) {
          sockets.value.splice(index, 1)
          ElMessage.success('Socket5连接删除成功')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败，请重试')
          console.error('Delete socket error:', error)
        }
      } finally {
        loading.value = false
      }
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
    }
    
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
      socketFormRef,
      socketForm,
      formRules,
      filteredSockets,
      paginatedSockets,
      getAuthTagType,
      resetForm,
      showAddDialog,
      showEditDialog,
      closeDialog,
      saveSocket,
      deleteSocket,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.sockets-container {
  padding: 20px;
}

.sockets-table-card {
  margin-bottom: 20px;
  overflow-x: auto;
}

.sockets-table-card .el-table {
  min-width: 1000px;
  width: 100%;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions .el-input {
    width: 100% !important;
  }
}
</style>