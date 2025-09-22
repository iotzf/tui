<template>
  <div class="firewall-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>防火墙规则管理</h1>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索防火墙规则..."
            prefix-icon="Search"
            style="width: 300px; margin-right: 10px"
          />
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增规则
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Firewall Rules Table -->
    <el-card class="firewall-rules-table-card">
      <el-table
        :data="paginatedRules"
        style="width: 100%"
        border
        v-loading="loading"
        fit
      >
        <el-table-column prop="name" label="规则名称" width="200" />
        <el-table-column prop="ruleType" label="规则类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.ruleType === 'allow' ? 'success' : 'danger'">
              {{ scope.row.ruleType === 'allow' ? '允许' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="150" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="protocol" label="协议" width="80" />
        <el-table-column prop="direction" label="方向" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
              {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
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
              @click="deleteRule(scope.row)"
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
          :total="filteredRules.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="firewallFormRef"
        :model="firewallForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="firewallForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="firewallForm.ruleType" placeholder="请选择规则类型">
            <el-option label="允许" value="allow" />
            <el-option label="拒绝" value="deny" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址" prop="ipAddress">
          <el-input v-model="firewallForm.ipAddress" placeholder="请输入IP地址或范围" />
          <div class="form-tip">支持单个IP(192.168.1.1)或CIDR范围(192.168.1.0/24)</div>
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model="firewallForm.port" placeholder="请输入端口号或范围" />
          <div class="form-tip">留空表示所有端口，支持单个端口(80)或范围(80-443)</div>
        </el-form-item>
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="firewallForm.protocol" placeholder="请选择协议">
            <el-option label="TCP" value="tcp" />
            <el-option label="UDP" value="udp" />
            <el-option label="HTTP" value="http" />
            <el-option label="HTTPS" value="https" />
            <el-option label="全部" value="all" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向" prop="direction">
          <el-select v-model="firewallForm.direction" placeholder="请选择方向">
            <el-option label="入站" value="inbound" />
            <el-option label="出站" value="outbound" />
            <el-option label="双向" value="both" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="firewallForm.description" placeholder="请输入规则描述" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="firewallForm.status" :active-value="'enabled'" :inactive-value="'disabled'" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetForm">取消</el-button>
          <el-button type="primary" @click="saveRule">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'FirewallRulesView',
  setup() {
    // 防火墙规则数据
    const firewallRules = ref([
      {
        id: 1,
        name: '允许内部网络访问',
        ruleType: 'allow',
        ipAddress: '192.168.1.0/24',
        port: '',
        protocol: 'all',
        direction: 'both',
        status: 'enabled',
        description: '允许内部网络访问所有服务'
      },
      {
        id: 2,
        name: '禁止外部访问管理端口',
        ruleType: 'deny',
        ipAddress: '0.0.0.0/0',
        port: '8080',
        protocol: 'tcp',
        direction: 'inbound',
        status: 'enabled',
        description: '禁止外部网络访问管理界面'
      },
      {
        id: 3,
        name: '允许HTTPS访问',
        ruleType: 'allow',
        ipAddress: '0.0.0.0/0',
        port: '443',
        protocol: 'https',
        direction: 'inbound',
        status: 'enabled',
        description: '允许外部通过HTTPS访问'
      }
    ])
    
    // 表单数据
    const firewallForm = reactive({
      id: '',
      name: '',
      ruleType: 'allow',
      ipAddress: '',
      port: '',
      protocol: 'tcp',
      direction: 'inbound',
      status: 'enabled',
      description: ''
    })
    
    // 表单验证规则
    const formRules = reactive({
      name: [
        { required: true, message: '请输入规则名称', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value && value.trim() === '') {
              callback(new Error('规则名称不能为空'))
              return
            }
            
            // 检查名称唯一性
            const isDuplicate = firewallRules.value.some(
              rule => rule.name === value && rule.id !== firewallForm.id
            )
            
            if (isDuplicate) {
              callback(new Error('规则名称已存在'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      ipAddress: [
        { required: true, message: '请输入IP地址或范围', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            // 简单的IP地址验证（支持单个IP和CIDR范围）
            const ipPattern = /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/[0-9]{1,2})?$/
            
            if (value && !ipPattern.test(value)) {
              callback(new Error('请输入有效的IP地址或CIDR范围'))
              return
            }
            callback()
          },
          trigger: 'blur'
        }
      ]
    })
    
    // 搜索查询
    const searchQuery = ref('')
    
    // 表单引用
    const firewallFormRef = ref(null)
    
    // 对话框状态
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    
    // 加载状态
    const loading = ref(false)
    
    // 分页相关
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 过滤防火墙规则列表
    const filteredRules = computed(() => {
      if (!searchQuery.value.trim()) {
        return firewallRules.value
      }
      
      const query = searchQuery.value.toLowerCase()
      return firewallRules.value.filter(rule => 
        rule.name.toLowerCase().includes(query) ||
        rule.ipAddress.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query) ||
        rule.port.toLowerCase().includes(query) ||
        rule.protocol.toLowerCase().includes(query)
      )
    })
    
    // 分页防火墙规则列表
    const paginatedRules = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      return filteredRules.value.slice(startIndex, endIndex)
    })
    
    // 重置表单
    const resetForm = () => {
      if (firewallFormRef.value) {
        firewallFormRef.value.resetFields()
      } else {
        // 如果表单引用还未初始化，手动重置
        Object.assign(firewallForm, {
          id: '',
          name: '',
          ruleType: 'allow',
          ipAddress: '',
          port: '',
          protocol: 'tcp',
          direction: 'inbound',
          status: 'enabled',
          description: ''
        })
      }
      dialogVisible.value = false
    }
    
    // 显示添加对话框
    const showAddDialog = () => {
      dialogTitle.value = '新增防火墙规则'
      resetForm()
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (rule) => {
      dialogTitle.value = '编辑防火墙规则'
      Object.assign(firewallForm, rule)
      dialogVisible.value = true
    }
    
    // 保存防火墙规则
    const saveRule = async () => {
      if (!firewallFormRef.value) {
        ElMessage.error('表单引用未初始化')
        return
      }
      
      try {
        await firewallFormRef.value.validate()
        loading.value = true
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (firewallForm.id) {
          // 编辑现有规则
          const index = firewallRules.value.findIndex(rule => rule.id === firewallForm.id)
          if (index !== -1) {
            firewallRules.value[index] = { ...firewallForm }
          }
          ElMessage.success('防火墙规则更新成功')
        } else {
          // 添加新规则
          const newRule = {
            ...firewallForm,
            id: Date.now() // 简单的ID生成方式
          }
          firewallRules.value.unshift(newRule)
          ElMessage.success('防火墙规则添加成功')
        }
        
        resetForm()
      } catch (error) {
        console.error('保存防火墙规则失败:', error)
        ElMessage.error('保存失败，请检查表单数据')
      } finally {
        loading.value = false
      }
    }
    
    // 删除防火墙规则
    const deleteRule = (rule) => {
      ElMessageBox.confirm(
        `确定要删除规则「${rule.name}」吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          loading.value = true
          
          // 模拟API调用延迟
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const index = firewallRules.value.findIndex(r => r.id === rule.id)
          if (index !== -1) {
            firewallRules.value.splice(index, 1)
          }
          
          ElMessage.success('防火墙规则删除成功')
        } catch (error) {
          console.error('删除防火墙规则失败:', error)
          ElMessage.error('删除失败')
        } finally {
          loading.value = false
        }
      }).catch(() => {
        // 用户取消删除
      })
    }
    
    // 分页处理
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
    }
    
    const handleCurrentChange = (newCurrent) => {
      currentPage.value = newCurrent
    }
    
    // 初始化数据
    onMounted(() => {
      // 在实际应用中，这里可以从API获取防火墙规则数据
      loading.value = false
    })
    
    return {
      firewallRules,
      firewallForm,
      formRules,
      searchQuery,
      firewallFormRef,
      dialogVisible,
      dialogTitle,
      loading,
      currentPage,
      pageSize,
      filteredRules,
      paginatedRules,
      resetForm,
      showAddDialog,
      showEditDialog,
      saveRule,
      deleteRule,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.firewall-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.firewall-rules-table-card {
  margin-bottom: 20px;
  overflow-x: auto;
}

.firewall-rules-table-card .el-table {
  min-width: 1200px;
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

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
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