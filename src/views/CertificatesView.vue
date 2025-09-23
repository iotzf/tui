<template>
  <div class="certificates-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>HTTPS证书管理</h1>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索证书..."
            prefix-icon="Search"
            style="width: 300px; margin-right: 10px"
          />
          <el-button type="primary" @click="showImportDialog('generate')">
            <el-icon><Plus /></el-icon> 生成证书
          </el-button>
          <el-button type="primary" @click="showImportDialog('import')">
            <el-icon><Upload /></el-icon> 导入证书
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- Certificates Table -->
    <el-card class="certificates-table-card">
      <el-table
        :data="filteredCertificates"
        style="width: 100%"
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="证书名称" width="180" />
        <el-table-column prop="domains" label="域名">
          <template #default="scope">
            <div v-for="domain in scope.row.domains" :key="domain" class="domain-tag">
              <el-tag>{{ domain }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="issuer" label="颁发者" width="140" />
        <el-table-column prop="validFrom" label="生效日期" width="140" />
        <el-table-column prop="validTo" label="过期日期" width="140" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getCertificateStatusType(scope.row)">
              {{ getCertificateStatusText(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              icon="Download"
              size="small"
              @click="downloadCertificate(scope.row)"
              style="margin-right: 5px"
            />
            <!-- 查看证书详情 -->
             <el-button
              type="info"
              icon="InfoFilled"
              size="small"
              @click="showCertificateDetails(scope.row)"
              style="margin-right: 5px"
            />
            <el-button
              type="danger"
              icon="Delete"
              size="small"
              @click="deleteCertificate(scope.row)"
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
        :total="filteredCertificates.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- Import/Generate Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form
        ref="certificateFormRef"
        :model="certificateForm"
        :rules="formRules"
        label-width="150px"
      >
        <el-form-item label="证书名称" prop="name">
          <el-input v-model="certificateForm.name" placeholder="输入证书名称" />
        </el-form-item>
        
        <!-- Generate Certificate Form -->
        <template v-if="dialogType === 'generate'">
          <el-form-item label="域名" prop="domains">
            <el-input v-model="certificateForm.domains" type="textarea" placeholder="输入域名，多个域名用逗号分隔" rows="3" />
            <div class="config-hint">例如: example.com,www.example.com,api.example.com</div>
          </el-form-item>
          <el-form-item label="国家/地区" prop="country">
            <el-input v-model="certificateForm.country" placeholder="输入国家代码，如 CN" />
          </el-form-item>
          <el-form-item label="省份" prop="province">
            <el-input v-model="certificateForm.province" placeholder="输入省份" />
          </el-form-item>
          <el-form-item label="城市" prop="city">
            <el-input v-model="certificateForm.city" placeholder="输入城市" />
          </el-form-item>
          <el-form-item label="组织名称" prop="organization">
            <el-input v-model="certificateForm.organization" placeholder="输入组织名称" />
          </el-form-item>
          <el-form-item label="部门" prop="organizationalUnit">
            <el-input v-model="certificateForm.organizationalUnit" placeholder="输入部门名称" />
          </el-form-item>
          <el-form-item label="有效期（天）" prop="validityDays">
            <el-input-number
              v-model="certificateForm.validityDays"
              :min="1"
              :max="3650"
              placeholder="输入有效期天数"
            />
          </el-form-item>
        </template>
        
        <!-- Import Certificate Form -->
        <template v-if="dialogType === 'import'">
          <el-form-item label="证书文件" prop="certificateFile">
            <el-upload
              ref="certificateUploadRef"
              :on-change="handleCertificateFileChange"
              :auto-upload="false"
              :show-file-list="true"
              accept=".crt,.pem,.cer"
              :limit="1"
            >
              <el-button type="primary">点击上传证书文件</el-button>
            </el-upload>
            <div class="config-hint">支持 .crt, .pem, .cer 格式</div>
          </el-form-item>
          <el-form-item label="私钥文件" prop="privateKeyFile">
            <el-upload
              ref="privateKeyUploadRef"
              :on-change="handlePrivateKeyFileChange"
              :auto-upload="false"
              :show-file-list="true"
              accept=".key,.pem"
              :limit="1"
            >
              <el-button type="primary">点击上传私钥文件</el-button>
            </el-upload>
            <div class="config-hint">支持 .key, .pem 格式</div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveCertificate">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟证书数据
const mockCertificates = [
  {
    id: 1,
    name: 'example.com',
    domains: ['example.com', 'www.example.com'],
    issuer: 'Self-Signed',
    validFrom: '2023-01-01',
    validTo: '2024-01-01',
    status: 'valid',
    certificateData: '-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----',
    privateKeyData: '-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----'
  },
  {
    id: 2,
    name: 'api-service',
    domains: ['api.example.com'],
    issuer: 'Self-Signed',
    validFrom: '2023-03-15',
    validTo: '2024-03-15',
    status: 'valid',
    certificateData: '-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----',
    privateKeyData: '-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----'
  },
  {
    id: 3,
    name: 'legacy-site',
    domains: ['legacy.example.com'],
    issuer: 'Self-Signed',
    validFrom: '2022-06-01',
    validTo: '2023-06-01',
    status: 'expired',
    certificateData: '-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----',
    privateKeyData: '-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----'
  }
]

export default {
  name: 'CertificatesView',
  setup() {
    // 响应式数据
    const certificates = ref(mockCertificates)
    const searchQuery = ref('')
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 对话框相关
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const dialogType = ref('') // 'generate' 或 'import'
    
    // 表单引用
    const certificateFormRef = ref(null)
    const certificateUploadRef = ref(null)
    const privateKeyUploadRef = ref(null)
    
    // 表单数据
    const certificateForm = reactive({
      name: '',
      domains: '',
      country: 'CN',
      province: '',
      city: '',
      organization: '',
      organizationalUnit: '',
      validityDays: 365,
      certificateFile: null,
      privateKeyFile: null,
      certificateData: '',
      privateKeyData: ''
    })
    
    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: '请输入证书名称', trigger: 'blur' },
        { min: 2, max: 50, message: '名称长度应在 2 到 50 个字符之间', trigger: 'blur' }
      ],
      domains: [
        { required: true, message: '请输入域名', trigger: 'blur' }
      ],
      country: [
        { required: true, message: '请输入国家代码', trigger: 'blur' },
        { min: 2, max: 2, message: '国家代码应为 2 个字符', trigger: 'blur' }
      ],
      province: [
        { required: true, message: '请输入省份', trigger: 'blur' }
      ],
      city: [
        { required: true, message: '请输入城市', trigger: 'blur' }
      ],
      organization: [
        { required: true, message: '请输入组织名称', trigger: 'blur' }
      ],
      organizationalUnit: [
        { required: true, message: '请输入部门名称', trigger: 'blur' }
      ],
      validityDays: [
        { required: true, message: '请输入有效期天数', trigger: 'blur' }
      ],
      certificateFile: [
        {
          required: true,
          validator: (rule, value, callback) => {
            if (!certificateForm.certificateFile) {
              callback(new Error('请上传证书文件'))
            } else {
              // 验证证书格式
              if (!validateCertificateFormat(certificateForm.certificateData)) {
                callback(new Error('证书格式不正确'))
              } else {
                callback()
              }
            }
          },
          trigger: 'change'
        }
      ],
      privateKeyFile: [
        {
          required: true,
          validator: (rule, value, callback) => {
            if (!certificateForm.privateKeyFile) {
              callback(new Error('请上传私钥文件'))
            } else {
              // 验证私钥格式
              if (!validatePrivateKeyFormat(certificateForm.privateKeyData)) {
                callback(new Error('私钥格式不正确'))
              } else {
                callback()
              }
            }
          },
          trigger: 'change'
        }
      ]
    }
    
    // 计算属性
    const filteredCertificates = computed(() => {
      if (!searchQuery.value) {
        return certificates.value
      }
      const query = searchQuery.value.toLowerCase()
      return certificates.value.filter(cert => 
        cert.name.toLowerCase().includes(query) ||
        cert.domains.some(domain => domain.toLowerCase().includes(query)) ||
        cert.issuer.toLowerCase().includes(query)
      )
    })
    
    // 分页后的数据
    const paginatedCertificates = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      return filteredCertificates.value.slice(startIndex, endIndex)
    })
    
    // 方法
    const showImportDialog = (type) => {
      dialogType.value = type
      dialogTitle.value = type === 'generate' ? '生成证书' : '导入证书'
      dialogVisible.value = true
    }
    
    const closeDialog = () => {
      dialogVisible.value = false
    }
    
    const resetForm = () => {
      certificateForm.name = ''
      certificateForm.domains = ''
      certificateForm.country = 'CN'
      certificateForm.province = ''
      certificateForm.city = ''
      certificateForm.organization = ''
      certificateForm.organizationalUnit = ''
      certificateForm.validityDays = 365
      certificateForm.certificateFile = null
      certificateForm.privateKeyFile = null
      certificateForm.certificateData = ''
      certificateForm.privateKeyData = ''
      
      if (certificateFormRef.value) {
        certificateFormRef.value.resetFields()
      }
      
      if (certificateUploadRef.value) {
        certificateUploadRef.value.clearFiles()
      }
      
      if (privateKeyUploadRef.value) {
        privateKeyUploadRef.value.clearFiles()
      }
    }
    
    const saveCertificate = async () => {
      try {
        const valid = await certificateFormRef.value.validate()
        if (!valid) return
        
        if (dialogType.value === 'generate') {
          generateAndSaveCertificate()
        } else {
          importAndSaveCertificate()
        }
      } catch (error) {
        console.error('表单验证失败:', error)
      }
    }
    
    const generateAndSaveCertificate = () => {
      // 在实际应用中，这里应该调用API生成证书
      // 目前我们使用模拟数据
      const domainsArray = certificateForm.domains.split(',').map(d => d.trim())
      const today = new Date()
      const validTo = new Date(today)
      validTo.setDate(today.getDate() + certificateForm.validityDays)
      
      const newCertificate = {
        id: certificates.value.length + 1,
        name: certificateForm.name,
        domains: domainsArray,
        issuer: 'Self-Signed',
        validFrom: formatDate(today),
        validTo: formatDate(validTo),
        status: 'valid',
        certificateData: '-----BEGIN CERTIFICATE-----\n... Generated certificate data ...\n-----END CERTIFICATE-----',
        privateKeyData: '-----BEGIN PRIVATE KEY-----\n... Generated private key data ...\n-----END PRIVATE KEY-----'
      }
      
      certificates.value.push(newCertificate)
      ElMessage.success('证书生成成功')
      closeDialog()
    }
    
    const importAndSaveCertificate = () => {
      // 在实际应用中，这里应该调用API导入证书
      const today = new Date()
      const validTo = new Date(today)
      validTo.setFullYear(today.getFullYear() + 1)
      
      // 从证书数据中提取域名信息（实际应用中应解析证书）
      const domainsArray = [certificateForm.name, `www.${certificateForm.name}`]
      
      const newCertificate = {
        id: certificates.value.length + 1,
        name: certificateForm.name,
        domains: domainsArray,
        issuer: 'Imported',
        validFrom: formatDate(today),
        validTo: formatDate(validTo),
        status: 'valid',
        certificateData: certificateForm.certificateData,
        privateKeyData: certificateForm.privateKeyData
      }
      
      certificates.value.push(newCertificate)
      ElMessage.success('证书导入成功')
      closeDialog()
    }
    
    const deleteCertificate = (certificate) => {
      ElMessageBox.confirm(
        `确定要删除证书 "${certificate.name}" 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 在实际应用中，这里应该调用API删除证书
        const index = certificates.value.findIndex(c => c.id === certificate.id)
        if (index !== -1) {
          certificates.value.splice(index, 1)
        }
        ElMessage.success('证书删除成功')
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    const downloadCertificate = (certificate) => {
      // 在实际应用中，这里应该调用API下载证书
      ElMessage.success('证书下载功能待实现')
    }

    const showCertificateDetails = (certificate) => {
      // 在实际应用中，这里应该调用API获取证书详情
      ElMessage.success('证书详情功能待实现')
    }

    
    const handleCertificateFileChange = (file) => {
      certificateForm.certificateFile = file
      readFileContent(file.raw, 'certificate')
    }
    
    const handlePrivateKeyFileChange = (file) => {
      certificateForm.privateKeyFile = file
      readFileContent(file.raw, 'privateKey')
    }
    
    const readFileContent = (file, type) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (type === 'certificate') {
          certificateForm.certificateData = e.target.result
        } else {
          certificateForm.privateKeyData = e.target.result
        }
      }
      reader.readAsText(file)
    }
    
    const getCertificateStatusType = (certificate) => {
      if (certificate.status === 'expired') {
        return 'danger'
      } else if (certificate.status === 'valid') {
        return 'success'
      } else {
        return 'warning'
      }
    }
    
    const getCertificateStatusText = (certificate) => {
      if (certificate.status === 'expired') {
        return '已过期'
      } else if (certificate.status === 'valid') {
        return '有效'
      } else {
        return '即将过期'
      }
    }
    
    const handleSizeChange = (size) => {
      pageSize.value = size
    }
    
    const handleCurrentChange = (current) => {
      currentPage.value = current
    }
    
    // 工具函数
    const formatDate = (date) => {
      return date.toISOString().split('T')[0]
    }
    
    const validateCertificateFormat = (certData) => {
      // 简单的证书格式验证
      return certData.includes('-----BEGIN CERTIFICATE-----') && certData.includes('-----END CERTIFICATE-----')
    }
    
    const validatePrivateKeyFormat = (keyData) => {
      // 简单的私钥格式验证
      return (
        keyData.includes('-----BEGIN PRIVATE KEY-----') || 
        keyData.includes('-----BEGIN RSA PRIVATE KEY-----')
      ) && (
        keyData.includes('-----END PRIVATE KEY-----') || 
        keyData.includes('-----END RSA PRIVATE KEY-----')
      )
    }
    
    return {
      certificates,
      searchQuery,
      loading,
      currentPage,
      pageSize,
      filteredCertificates,
      paginatedCertificates,
      dialogVisible,
      dialogTitle,
      dialogType,
      certificateFormRef,
      certificateUploadRef,
      privateKeyUploadRef,
      certificateForm,
      formRules,
      showImportDialog,
      closeDialog,
      resetForm,
      saveCertificate,
      deleteCertificate,
      downloadCertificate,
      showCertificateDetails,
      handleCertificateFileChange,
      handlePrivateKeyFileChange,
      getCertificateStatusType,
      getCertificateStatusText,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.certificates-container {
  padding: 20px;
}

.certificates-table-card {
  margin-bottom: 20px;
  overflow-x: auto;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.domain-tag {
  margin-bottom: 5px;
}

.config-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
</style>