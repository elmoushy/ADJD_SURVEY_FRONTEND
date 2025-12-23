<template>
  <Teleport to="body">
    <div v-if="visible" :class="$style.modalOverlay" @click.self="handleClose">
      <div :class="$style.modal" :data-theme="currentTheme">
        <div :class="$style.modalHeader">
          <h2 :class="$style.modalTitle">
            <i class="fas fa-user-plus"></i>
            {{ t('userManagement.bulkUploadWithPassword.title') }}
          </h2>
          <button :class="$style.closeBtn" @click="handleClose" :aria-label="t('common.close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div :class="$style.modalBody">
          <!-- Instructions -->
          <div :class="$style.instructionsCard">
            <h3 :class="$style.instructionsTitle">
              <i class="fas fa-info-circle"></i>
              {{ t('userManagement.bulkUploadWithPassword.instructions.title') }}
            </h3>
            <ol :class="$style.instructionsList">
              <li>{{ t('userManagement.bulkUploadWithPassword.instructions.step1') }}</li>
              <li>{{ t('userManagement.bulkUploadWithPassword.instructions.step2') }}</li>
              <li>{{ t('userManagement.bulkUploadWithPassword.instructions.step3') }}</li>
            </ol>
            <div :class="$style.note">
              <i class="fas fa-lightbulb"></i>
              {{ t('userManagement.bulkUploadWithPassword.instructions.note') }}
            </div>
          </div>

          <!-- Download Template Button -->
          <div :class="$style.downloadSection">
            <button 
              :class="[$style.downloadBtn, $style.primaryBtn]"
              @click="downloadTemplate"
            >
              <i class="fas fa-download"></i>
              {{ t('userManagement.bulkUploadWithPassword.downloadTemplate') }}
            </button>
          </div>

          <!-- Upload Section -->
          <div :class="$style.uploadSection">
            <div :class="$style.uploadArea" @dragover.prevent @drop.prevent="handleDrop">
              <input 
                ref="fileInput"
                type="file"
                accept=".xlsx,.xls"
                @change="handleFileSelect"
                :class="$style.fileInput"
              />
              
              <div v-if="!selectedFile" :class="$style.uploadPlaceholder" @click="triggerFileInput">
                <i class="fas fa-cloud-upload-alt"></i>
                <p :class="$style.uploadText">
                  {{ t('userManagement.bulkUploadWithPassword.dragDrop') }}
                </p>
                <p :class="$style.uploadSubtext">
                  {{ t('userManagement.bulkUploadWithPassword.orClick') }}
                </p>
              </div>

              <div v-else :class="$style.filePreview">
                <i class="fas fa-file-excel"></i>
                <div :class="$style.fileInfo">
                  <p :class="$style.fileName">{{ selectedFile.name }}</p>
                  <p :class="$style.fileSize">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
                <button 
                  :class="$style.removeFileBtn"
                  @click="removeFile"
                  :aria-label="t('common.remove')"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <!-- Preview Table -->
            <div v-if="previewData.length > 0" :class="$style.previewSection">
              <h3 :class="$style.previewTitle">
                {{ t('userManagement.bulkUploadWithPassword.preview') }} ({{ previewData.length }} {{ t('userManagement.bulkUploadWithPassword.users') }})
              </h3>
              <div :class="$style.tableWrapper">
                <table :class="$style.previewTable">
                  <thead>
                    <tr>
                      <th>{{ t('userManagement.bulkUploadWithPassword.fields.email') }}</th>
                      <th>{{ t('userManagement.bulkUploadWithPassword.fields.firstName') }}</th>
                      <th>{{ t('userManagement.bulkUploadWithPassword.fields.lastName') }}</th>
                      <th>{{ t('userManagement.bulkUploadWithPassword.fields.role') }}</th>
                      <th>{{ t('userManagement.bulkUploadWithPassword.fields.password') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(user, index) in previewData.slice(0, 5)" :key="index">
                      <td>{{ user.email }}</td>
                      <td>{{ user.first_name || '-' }}</td>
                      <td>{{ user.last_name || '-' }}</td>
                      <td>{{ user.role || 'user' }}</td>
                      <td>{{ maskPassword(user.password) }}</td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="previewData.length > 5" :class="$style.moreRows">
                  {{ getMoreRowsText(previewData.length - 5) }}
                </p>
              </div>
            </div>

            <!-- Validation Errors -->
            <div v-if="validationErrors.length > 0" :class="$style.errorsSection">
              <h3 :class="$style.errorsTitle">
                <i class="fas fa-exclamation-triangle"></i>
                {{ t('userManagement.bulkUploadWithPassword.validationErrors') }}
              </h3>
              <ul :class="$style.errorsList">
                <li v-for="(error, index) in validationErrors" :key="index">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div :class="$style.modalFooter">
          <button 
            :class="[$style.btn, $style.cancelBtn]" 
            @click="handleClose"
            :disabled="uploading"
          >
            {{ t('common.cancel') }}
          </button>
          <button 
            :class="[$style.btn, $style.uploadBtn]"
            @click="handleUpload"
            :disabled="!selectedFile || previewData.length === 0 || validationErrors.length > 0 || uploading"
          >
            <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-upload"></i>
            {{ uploading ? t('userManagement.bulkUploadWithPassword.uploading') : t('userManagement.bulkUploadWithPassword.upload') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { bulkCreateUsersWithPassword } from '../../services/userManagementService'
import type { BulkCreateUserWithPasswordRequest } from '../../types/user-management.types'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'

// Props
defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

// Store
const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const t = computed(() => store.t)

// State
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewData = ref<BulkCreateUserWithPasswordRequest[]>([])
const validationErrors = ref<string[]>([])
const uploading = ref(false)

// Methods
const downloadTemplate = () => {
  // Create template data with examples for each role
  const templateData = [
    {
      'Email': 'superadmin@example.com',
      'First Name': 'أحمد',
      'Last Name': 'المدير',
      'Role': 'super_admin',
      'Password': 'SecurePass123!'
    },
    {
      'Email': 'admin@example.com',
      'First Name': 'سارة',
      'Last Name': 'الإدارية',
      'Role': 'admin',
      'Password': 'AdminPass456@'
    },
    {
      'Email': 'user@example.com',
      'First Name': 'محمد',
      'Last Name': 'المستخدم',
      'Role': 'user',
      'Password': 'UserPass789#'
    }
  ]

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(templateData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Users')

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Email
    { wch: 20 }, // First Name
    { wch: 20 }, // Last Name
    { wch: 15 }, // Role
    { wch: 20 }  // Password
  ]

  // Generate file
  XLSX.writeFile(wb, 'users_with_password_template.xlsx')
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

const processFile = (file: File) => {
  selectedFile.value = file
  validationErrors.value = []
  previewData.value = []

  // Read file
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Validate and transform data
      const users: BulkCreateUserWithPasswordRequest[] = []
      const errors: string[] = []

      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2 // Excel row number (header is row 1)
        
        // Check required fields - Email
        if (!row['Email']) {
          errors.push(`${t.value('userManagement.bulkUploadWithPassword.errors.row')} ${rowNum}: ${t.value('userManagement.bulkUploadWithPassword.errors.emailRequired')}`)
          return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(row['Email'])) {
          errors.push(`${t.value('userManagement.bulkUploadWithPassword.errors.row')} ${rowNum}: ${t.value('userManagement.bulkUploadWithPassword.errors.invalidEmail')}`)
          return
        }

        // Check required fields - Password
        if (!row['Password']) {
          errors.push(`${t.value('userManagement.bulkUploadWithPassword.errors.row')} ${rowNum}: ${t.value('userManagement.bulkUploadWithPassword.errors.passwordRequired')}`)
          return
        }

        // Validate password minimum length
        const password = String(row['Password']).trim()
        if (password.length < 8) {
          errors.push(`${t.value('userManagement.bulkUploadWithPassword.errors.row')} ${rowNum}: ${t.value('userManagement.bulkUploadWithPassword.errors.passwordMinLength')}`)
          return
        }

        // Validate role if provided
        const validRoles = ['user', 'admin', 'super_admin']
        const role = row['Role']?.toLowerCase() || 'user'
        if (role && !validRoles.includes(role)) {
          errors.push(`${t.value('userManagement.bulkUploadWithPassword.errors.row')} ${rowNum}: ${t.value('userManagement.bulkUploadWithPassword.errors.invalidRole')}`)
          return
        }

        users.push({
          email: String(row['Email']).trim(),
          first_name: row['First Name'] ? String(row['First Name']).trim() : undefined,
          last_name: row['Last Name'] ? String(row['Last Name']).trim() : undefined,
          role: role as 'user' | 'admin' | 'super_admin',
          password: password
        })
      })

      if (errors.length > 0) {
        validationErrors.value = errors
      }

      previewData.value = users

      if (users.length === 0 && errors.length === 0) {
        validationErrors.value = [t.value('userManagement.bulkUploadWithPassword.errors.noData')]
      }
    } catch (error) {
      validationErrors.value = [t.value('userManagement.bulkUploadWithPassword.errors.parseError')]
    }
  }

  reader.readAsArrayBuffer(file)
}

const removeFile = () => {
  selectedFile.value = null
  previewData.value = []
  validationErrors.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const maskPassword = (password: string): string => {
  if (!password) return '-'
  if (password.length <= 4) return '****'
  return password.substring(0, 2) + '****' + password.substring(password.length - 2)
}

const getMoreRowsText = (count: number): string => {
  return t.value('userManagement.bulkUploadWithPassword.andMore').replace('{{count}}', String(count))
}

const handleUpload = async () => {
  if (!selectedFile.value || previewData.value.length === 0) return

  uploading.value = true

  try {
    const response = await bulkCreateUsersWithPassword({ users: previewData.value })

    // Show results
    const { summary, results } = response

    let html = '<div style="text-align: right; direction: rtl;">'
    
    // Summary
    html += `<div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <h4 style="margin: 0 0 10px 0; color: #2c3e50;">📊 ${t.value('userManagement.bulkUploadWithPassword.results.summary')}</h4>
      <p style="margin: 5px 0;"><strong>${t.value('userManagement.bulkUploadWithPassword.results.totalRequested')}:</strong> ${summary.total_requested}</p>
      <p style="margin: 5px 0; color: #28a745;"><strong>${t.value('userManagement.bulkUploadWithPassword.results.created')}:</strong> ${summary.created}</p>
      <p style="margin: 5px 0; color: #ffc107;"><strong>${t.value('userManagement.bulkUploadWithPassword.results.skipped')}:</strong> ${summary.skipped}</p>
      <p style="margin: 5px 0; color: #dc3545;"><strong>${t.value('userManagement.bulkUploadWithPassword.results.failed')}:</strong> ${summary.failed}</p>
    </div>`

    // Created users
    if (results.created.length > 0) {
      html += `<div style="margin-bottom: 20px;">
        <h4 style="color: #28a745; margin-bottom: 10px;">✅ ${t.value('userManagement.bulkUploadWithPassword.results.createdUsers')} (${results.created.length})</h4>
        <ul style="list-style: none; padding: 0;">`
      results.created.forEach(user => {
        html += `<li style="padding: 8px; background: #d4edda; margin: 5px 0; border-radius: 4px;">
          ${user.full_name} (${user.email}) - ${user.role}
        </li>`
      })
      html += '</ul></div>'
    }

    // Skipped users
    if (results.skipped.length > 0) {
      html += `<div style="margin-bottom: 20px;">
        <h4 style="color: #ffc107; margin-bottom: 10px;">⚠️ ${t.value('userManagement.bulkUploadWithPassword.results.skippedUsers')} (${results.skipped.length})</h4>
        <ul style="list-style: none; padding: 0;">`
      results.skipped.forEach(user => {
        html += `<li style="padding: 8px; background: #fff3cd; margin: 5px 0; border-radius: 4px;">
          ${user.email}: ${user.reason}
        </li>`
      })
      html += '</ul></div>'
    }

    // Failed users
    if (results.failed.length > 0) {
      html += `<div style="margin-bottom: 20px;">
        <h4 style="color: #dc3545; margin-bottom: 10px;">❌ ${t.value('userManagement.bulkUploadWithPassword.results.failedUsers')} (${results.failed.length})</h4>
        <ul style="list-style: none; padding: 0;">`
      results.failed.forEach(user => {
        html += `<li style="padding: 8px; background: #f8d7da; margin: 5px 0; border-radius: 4px;">
          ${user.email}: ${user.error}
        </li>`
      })
      html += '</ul></div>'
    }

    html += '</div>'

    await Swal.fire({
      title: response.message,
      html,
      icon: summary.failed === 0 ? 'success' : summary.created > 0 ? 'info' : 'warning',
      confirmButtonText: t.value('common.ok'),
      width: '800px',
      customClass: {
        popup: 'swal-rtl-popup',
        title: 'swal-rtl-title',
        htmlContainer: 'swal-rtl-content'
      }
    })

    if (summary.created > 0) {
      emit('success')
      handleClose()
    }
  } catch (error: any) {
    let errorMessage = t.value('userManagement.bulkUploadWithPassword.errors.uploadFailed')
    
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      errorMessage = Object.values(errors).flat().join('\n')
    }

    await Swal.fire({
      title: t.value('common.error'),
      text: errorMessage,
      icon: 'error',
      confirmButtonText: t.value('common.ok'),
      customClass: {
        popup: 'swal-rtl-popup',
        title: 'swal-rtl-title',
        htmlContainer: 'swal-rtl-content'
      }
    })
  } finally {
    uploading.value = false
  }
}

const handleClose = () => {
  if (!uploading.value) {
    removeFile()
    emit('close')
  }
}
</script>

<style module src="./BulkUploadWithPasswordModal.module.css"></style>
