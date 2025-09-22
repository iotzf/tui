<template>
  <div class="entry-points-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>入口点管理</h1>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索入口点..."
            prefix-icon="Search"
            style="width: 300px; margin-right: 10px"
          />
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增入口点
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Entry Points Table -->
    <el-card class="entry-points-table-card">
      <el-table
        :data="filteredEntryPoints"
        style="width: 100%"
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="protocol" label="协议" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.protocol === 'http' ? 'info' : 'success'">
              {{ scope.row.protocol }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="tls.enabled" label="TLS" width="80">
          <template #default="scope">
            <el-switch v-model="scope.row.tls.enabled" @change="updateTlsStatus(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column prop="routesCount" label="使用路由数" width="120" />
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
              @click="deleteEntryPoint(scope.row)"
              :disabled="scope.row.name === 'web' || scope.row.name === 'websecure'"
              :tooltip="scope.row.name === 'web' || scope.row.name === 'websecure' ? '不能删除默认入口点' : ''"
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
        :total="filteredEntryPoints.length"
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
        ref="entryPointFormRef"
        :model="entryPointForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="entryPointForm.name" placeholder="输入入口点名称" :disabled="editingEntryPointId !== null" />
        </el-form-item>
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="entryPointForm.protocol" placeholder="选择协议">
            <el-option label="HTTP" value="http" />
            <el-option label="HTTPS" value="https" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="entryPointForm.address" placeholder="输入地址，格式：:端口号" />
        </el-form-item>
        <el-form-item label="TLS">
          <el-switch v-model="entryPointForm.tls.enabled" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="entryPointForm.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveEntryPoint">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟获取路由数据的函数
const getRoutesData = () => {
  // 在实际应用中，这里应该是从API获取数据
  return [
    { id: 1, name: 'api-gateway', entryPoints: ['web', 'websecure'] },
    { id: 2, name: 'web-app', entryPoints: ['web', 'websecure'] },
    { id: 3, name: 'static-files', entryPoints: ['web', 'websecure'] },
    { id: 4, name: 'old-api', entryPoints: ['web'] }
  ]
}

export default {
  name: 'EntryPointsView',
  setup() {
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 对话框状态
    const dialogVisible = ref(false)
    const dialogTitle = ref('新增入口点')
    const editingEntryPointId = ref(null)
    // 表单引用
    const entryPointFormRef = ref(null)
    
    // 入口点列表数据
    const entryPoints = ref([
      {
        id: 1,
        name: 'web',
        protocol: 'http',
        address: ':80',
        tls: { enabled: false },
        status: 'enabled'
      },
      {
        id: 2,
        name: 'websecure',
        protocol: 'https',
        address: ':443',
        tls: { enabled: true },
        status: 'enabled'
      },
      {
        id: 3,
        name: 'api',
        protocol: 'http',
        address: ':8080',
        tls: { enabled: false },
        status: 'enabled'
      },
      {
        id: 4,
        name: 'admin',
        protocol: 'https',
        address: ':8443',
        tls: { enabled: true },
        status: 'disabled'
      }
    ])
    
    // 表单数据
    const entryPointForm = reactive({
      name: '',
      protocol: 'http',
      address: '',
      tls: { enabled: false },
      status: 'enabled'
    })
    
    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: '请输入入口点名称', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (editingEntryPointId.value) {
              const duplicate = entryPoints.value.some(
                ep => ep.name === value && ep.id !== editingEntryPointId.value
              )
              if (duplicate) {
                callback(new Error('入口点名称已存在'))
              } else {
                callback()
              }
            } else {
              const duplicate = entryPoints.value.some(ep => ep.name === value)
              if (duplicate) {
                callback(new Error('入口点名称已存在'))
              } else {
                callback()
              }
            }
          },
          trigger: 'blur'
        }
      ],
      protocol: [
        { required: true, message: '请选择协议', trigger: 'change' }
      ],
      address: [
        { required: true, message: '请输入地址', trigger: 'blur' },
        {
          pattern: /^:[0-9]+$/, 
          message: '地址格式不正确，应为:端口号', 
          trigger: 'blur'
        }
      ]
    }
    
    // 计算使用每个入口点的路由数量
    const calculateRoutesCount = (entryPointName) => {
      const routes = getRoutesData()
      let count = 0
      routes.forEach(route => {
        if (route.entryPoints.includes(entryPointName)) {
          count++
        }
      })
      return count
    }
    
    // 计算属性：筛选后的入口点列表（包含使用路由数）
    const filteredEntryPoints = computed(() => {
      let result = entryPoints.value
      
      // 搜索筛选
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(ep => 
          ep.name.toLowerCase().includes(query) ||
          ep.protocol.toLowerCase().includes(query) ||
          ep.address.toLowerCase().includes(query)
        )
      }
      
      // 添加路由计数
      return result.map(ep => ({
        ...ep,
        routesCount: calculateRoutesCount(ep.name)
      }))
    })
    
    // 显示添加对话框
    const showAddDialog = () => {
      dialogTitle.value = '新增入口点'
      editingEntryPointId.value = null
      resetForm()
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (entryPoint) => {
      dialogTitle.value = '编辑入口点'
      editingEntryPointId.value = entryPoint.id
      
      // 复制入口点数据到表单
      Object.assign(entryPointForm, {
        name: entryPoint.name,
        protocol: entryPoint.protocol,
        address: entryPoint.address,
        tls: { enabled: entryPoint.tls.enabled },
        status: entryPoint.status
      })
      
      dialogVisible.value = true
    }
    
    // 保存入口点
    const saveEntryPoint = async () => {
      // 验证表单
      const entryPointFormRef = document.querySelector('.el-form')
      const isValid = entryPointFormRef.validate()
      
      if (!isValid) {
        return
      }
      
      try {
        loading.value = true
        
        if (editingEntryPointId.value) {
          // 编辑现有入口点
          const index = entryPoints.value.findIndex(ep => ep.id === editingEntryPointId.value)
          if (index !== -1) {
            entryPoints.value[index] = {
              ...entryPoints.value[index],
              protocol: entryPointForm.protocol,
              address: entryPointForm.address,
              tls: entryPointForm.tls,
              status: entryPointForm.status
            }
          }
          ElMessage.success('入口点更新成功')
        } else {
          // 添加新入口点
          const newEntryPoint = {
            id: Date.now(),
            ...entryPointForm
          }
          entryPoints.value.unshift(newEntryPoint)
          ElMessage.success('入口点添加成功')
        }
        
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('保存入口点失败')
        console.error('保存入口点错误:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 删除入口点
    const deleteEntryPoint = (entryPoint) => {
      // 检查是否有路由使用此入口点
      const routesCount = calculateRoutesCount(entryPoint.name)
      if (routesCount > 0) {
        ElMessage.warning('此入口点正在被' + routesCount + '个路由使用，无法删除')
        return
      }
      
      ElMessageBox.confirm(
        `确定要删除入口点 "${entryPoint.name}" 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          const index = entryPoints.value.findIndex(ep => ep.id === entryPoint.id)
          if (index !== -1) {
            entryPoints.value.splice(index, 1)
            ElMessage.success('入口点删除成功')
          }
        })
        .catch(() => {
          ElMessage.info('已取消删除')
        })
    }
    
    // 更新TLS状态
    const updateTlsStatus = (entryPoint) => {
      try {
        const index = entryPoints.value.findIndex(ep => ep.id === entryPoint.id)
        if (index !== -1) {
          entryPoints.value[index] = {
            ...entryPoints.value[index],
            tls: { enabled: entryPoint.tls.enabled }
          }
          ElMessage.success('TLS状态已更新')
        }
      } catch (error) {
        ElMessage.error('更新TLS状态失败')
        console.error('更新TLS状态错误:', error)
      }
    }
    
    // 重置表单
    const resetForm = () => {
      Object.assign(entryPointForm, {
        name: '',
        protocol: 'http',
        address: '',
        tls: { enabled: false },
        status: 'enabled'
      })
      
      if (entryPointFormRef.value) {
        entryPointFormRef.value.resetFields()
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
      entryPoints,
      entryPointForm,
      entryPointFormRef,
      formRules,
      filteredEntryPoints,
      showAddDialog,
      showEditDialog,
      saveEntryPoint,
      deleteEntryPoint,
      updateTlsStatus,
      resetForm,
      closeDialog,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.entry-points-container {
  padding: 20px;
}

.entry-points-table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>