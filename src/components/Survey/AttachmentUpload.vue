<template>
  <div :class="$style.attachmentSection">
    <h3 :class="$style.sectionTitle">
      <i class="fas fa-paperclip"></i>
      المرفقات
      <span v-if="required" :class="$style.requiredBadge">مطلوب</span>
    </h3>

    <!-- Drop Zone -->
    <div
      :class="[$style.dropZone, { [$style.dropZoneActive]: isDragging }]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="acceptTypes"
        multiple
        :class="$style.hiddenInput"
        @change="handleFileSelect"
      />
      <div :class="$style.dropContent">
        <div :class="$style.uploadIconWrap">
          <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <p :class="$style.dropText">
          اسحب الملف هنا أو
          <span :class="$style.dropLink">اختر ملف من الحاسوب</span>
        </p>
        <p :class="$style.dropSubText">PDF, EXCEL, WORD</p>
      </div>
    </div>

    <!-- Queued Files (before upload) -->
    <div v-if="queuedFiles.length > 0" :class="$style.fileList">
      <div v-for="(file, index) in queuedFiles" :key="'q-' + index" :class="$style.fileItem">
        <div :class="$style.fileIcon">
          <i :class="getFileIcon(file.type)"></i>
        </div>
        <div :class="$style.fileInfo">
          <span :class="$style.fileName">{{ file.name }}</span>
          <span :class="$style.fileSize">{{ formatSize(file.size) }}</span>
        </div>
        <button :class="$style.removeBtn" @click="removeQueuedFile(index)" type="button">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Uploaded Files -->
    <div v-if="uploadedFiles.length > 0" :class="$style.fileList">
      <div v-for="att in uploadedFiles" :key="att.id" :class="[$style.fileItem, $style.fileUploaded]">
        <div :class="$style.fileIcon">
          <i :class="getFileIconByMime(att.mime_type)"></i>
        </div>
        <div :class="$style.fileInfo">
          <span :class="$style.fileName">{{ att.original_filename }}</span>
          <span :class="$style.fileSize">{{ formatSize(att.file_size) }} — {{ att.format_name }}</span>
        </div>
        <div :class="$style.fileActions">
          <button :class="$style.downloadBtn" @click="downloadFile(att)" type="button" title="تحميل">
            <i class="fas fa-download"></i>
          </button>
          <button v-if="att.can_delete" :class="$style.removeBtn" @click="deleteFile(att)" type="button" title="حذف">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-if="isUploading" :class="$style.progressContainer">
      <div :class="$style.progressBar">
        <div :class="$style.progressFill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <span :class="$style.progressText">جاري الرفع...</span>
    </div>

    <!-- Required warning when no files and required -->
    <div v-if="required && queuedFiles.length === 0 && uploadedFiles.length === 0" :class="$style.requiredHint">
      <i class="fas fa-exclamation-triangle"></i>
      يجب رفع ملف واحد على الأقل للمتابعة
    </div>

    <!-- Error Messages -->
    <div v-if="errorMessage" :class="$style.errorMessage">
      <i class="fas fa-exclamation-circle"></i>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { attachmentService, type AttachmentInfo } from '@/services/attachmentService'

interface Props {
  responseId?: string | null
  maxFiles?: number
  maxSizeMB?: number
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  responseId: null,
  maxFiles: 5,
  maxSizeMB: 10,
  required: false,
})

const emit = defineEmits<{
  'files-changed': [files: File[]]
  'uploaded': [attachment: AttachmentInfo]
  'error': [message: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')
const queuedFiles = ref<File[]>([])
const uploadedFiles = ref<AttachmentInfo[]>([])

const acceptTypes = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif'

const allowedMimes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
])

const totalCount = computed(() => queuedFiles.value.length + uploadedFiles.value.length)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    addFiles(Array.from(input.files))
  }
  input.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

function addFiles(files: File[]) {
  errorMessage.value = ''

  for (const file of files) {
    // Check count limit
    if (totalCount.value >= props.maxFiles) {
      errorMessage.value = `الحد الأقصى ${props.maxFiles} ملفات`
      emit('error', errorMessage.value)
      break
    }

    // Check file type
    if (!allowedMimes.has(file.type)) {
      errorMessage.value = `نوع الملف "${file.name}" غير مسموح به. الأنواع المسموحة: PDF, Word, Excel, JPEG, PNG, GIF`
      emit('error', errorMessage.value)
      continue
    }

    // Check file size
    if (file.size > props.maxSizeMB * 1024 * 1024) {
      errorMessage.value = `الملف "${file.name}" يتجاوز الحد الأقصى (${props.maxSizeMB} ميجابايت)`
      emit('error', errorMessage.value)
      continue
    }

    queuedFiles.value.push(file)
  }

  emit('files-changed', queuedFiles.value)
}

function removeQueuedFile(index: number) {
  queuedFiles.value.splice(index, 1)
  errorMessage.value = ''
  emit('files-changed', queuedFiles.value)
}

/**
 * Upload all queued files. Called by parent after response is created.
 */
async function uploadAll(responseId: string) {
  if (queuedFiles.value.length === 0) return

  isUploading.value = true
  uploadProgress.value = 0
  errorMessage.value = ''

  const total = queuedFiles.value.length
  let uploaded = 0

  for (const file of [...queuedFiles.value]) {
    try {
      const attachment = await attachmentService.uploadResponseAttachment(responseId, file)
      uploadedFiles.value.push(attachment)
      emit('uploaded', attachment)
      uploaded++
      uploadProgress.value = Math.round((uploaded / total) * 100)
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'فشل رفع الملف'
      errorMessage.value = `خطأ في رفع "${file.name}": ${msg}`
      emit('error', errorMessage.value)
    }
  }

  queuedFiles.value = []
  isUploading.value = false
}

async function downloadFile(att: AttachmentInfo) {
  try {
    const blobUrl = await attachmentService.downloadResponseAttachment(att.id)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = att.original_filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    errorMessage.value = 'فشل في تحميل الملف'
  }
}

async function deleteFile(att: AttachmentInfo) {
  try {
    await attachmentService.deleteResponseAttachment(att.id)
    uploadedFiles.value = uploadedFiles.value.filter(a => a.id !== att.id)
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'فشل في حذف الملف'
  }
}

function getFileIcon(mime: string): string {
  if (mime === 'application/pdf') return 'fas fa-file-pdf'
  if (mime.includes('word') || mime.includes('document')) return 'fas fa-file-word'
  if (mime.includes('excel') || mime.includes('spreadsheet')) return 'fas fa-file-excel'
  if (mime.startsWith('image/')) return 'fas fa-file-image'
  return 'fas fa-file'
}

function getFileIconByMime(mime: string): string {
  return getFileIcon(mime)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Expose upload method to parent
const hasFiles = computed(() => queuedFiles.value.length > 0 || uploadedFiles.value.length > 0)
defineExpose({ uploadAll, queuedFiles, uploadedFiles, hasFiles })
</script>

<style module>
.attachmentSection {
  margin-top: 1.5rem;
}

.sectionTitle {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.requiredBadge {
  font-size: 0.7rem;
  font-weight: 500;
  color: #dc3545;
  background: rgba(220, 53, 69, 0.08);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.dropZone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 2rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.dropZone:hover,
.dropZoneActive {
  border-color: var(--color-primary, #B78A41);
  background: rgba(183, 138, 65, 0.04);
}

.hiddenInput {
  display: none;
}

.dropContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.uploadIconWrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(183, 138, 65, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: var(--color-primary, #B78A41);
}

.dropText {
  font-size: 0.9rem;
  color: #555;
  margin: 0;
}

.dropLink {
  color: var(--color-primary, #B78A41);
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.dropSubText {
  font-size: 0.75rem;
  color: #999;
  margin: 0;
  letter-spacing: 0.5px;
}

.fileList {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.fileItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8e8e8;
  transition: border-color 0.2s;
}

.fileItem:hover {
  border-color: var(--color-primary, #B78A41);
}

.fileUploaded {
  border-color: rgba(40, 167, 69, 0.3);
  background: rgba(40, 167, 69, 0.02);
}

.fileIcon {
  font-size: 1.25rem;
  color: var(--color-primary, #B78A41);
  width: 2rem;
  text-align: center;
  flex-shrink: 0;
}

.fileInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.fileName {
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fileSize {
  font-size: 0.72rem;
  color: #999;
}

.fileActions {
  display: flex;
  gap: 0.25rem;
}

.removeBtn,
.downloadBtn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: background 0.15s, color 0.15s;
}

.removeBtn {
  color: #dc3545;
}
.removeBtn:hover {
  background: rgba(220, 53, 69, 0.1);
}

.downloadBtn {
  color: var(--color-primary, #B78A41);
}
.downloadBtn:hover {
  background: rgba(183, 138, 65, 0.1);
}

.progressContainer {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progressBar {
  flex: 1;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: var(--color-primary, #B78A41);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progressText {
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
}

.errorMessage {
  margin-top: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: rgba(220, 53, 69, 0.08);
  color: #dc3545;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.requiredHint {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: rgba(255, 193, 7, 0.1);
  color: #856404;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(255, 193, 7, 0.3);
}
</style>
