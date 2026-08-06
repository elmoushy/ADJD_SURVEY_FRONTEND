<template>
  <div
    :class="$style.managerCard"
    :data-theme="currentTheme"
    :dir="isRTL ? 'rtl' : 'ltr'"
  >
    <!-- Header -->
    <div :class="$style.cardHeader">
      <div :class="$style.headerIcon">
        <i class="fas fa-paperclip"></i>
      </div>
      <div :class="$style.headerText">
        <h4 :class="$style.cardTitle">
          {{ isRTL ? 'مرفقات الإيضاحات' : 'Survey attachments' }}
          <span :class="$style.optionalTag">{{ isRTL ? 'اختياري' : 'Optional' }}</span>
        </h4>
        <p :class="$style.cardHint">
          {{ isRTL
            ? 'ملفات مرجعية يراها المستجيبون قبل وأثناء الإجابة — مثل المخططات أو السياسات أو العروض التقديمية.'
            : 'Reference files respondents can read while answering — plans, policies or presentations.' }}
        </p>
      </div>
      <span v-if="totalCount > 0" :class="$style.countBadge">
        {{ totalCount }} / {{ maxFiles }}
      </span>
    </div>

    <!-- Drop zone -->
    <div
      v-if="canAddMore"
      :class="[$style.dropZone, { [$style.dropZoneActive]: isDragging }]"
      role="button"
      tabindex="0"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
      @keydown.enter.prevent="triggerFileInput"
      @keydown.space.prevent="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="acceptTypes"
        multiple
        :class="$style.hiddenInput"
        @change="handleFileSelect"
      />
      <div :class="$style.dropIcon">
        <i class="fas fa-cloud-upload-alt"></i>
      </div>
      <p :class="$style.dropText">
        {{ isRTL ? 'اسحب الملفات هنا أو' : 'Drag files here or' }}
        <span :class="$style.dropLink">{{ isRTL ? 'اختر من الحاسوب' : 'browse your computer' }}</span>
      </p>
      <p :class="$style.dropSubText">
        PDF · Word · Excel · PowerPoint · JPG · PNG · GIF
        <span :class="$style.dropDot">•</span>
        {{ isRTL ? `حتى ${maxSizeMB} ميجابايت للملف` : `up to ${maxSizeMB}MB each` }}
      </p>
    </div>

    <div v-else :class="$style.limitNotice">
      <i class="fas fa-info-circle"></i>
      <span>{{ isRTL
        ? `تم الوصول إلى الحد الأقصى (${maxFiles} ملفات). احذف ملفاً لإضافة غيره.`
        : `Maximum of ${maxFiles} files reached. Remove one to add another.` }}</span>
    </div>

    <!-- File list -->
    <div v-if="totalCount > 0" :class="$style.fileList">
      <!-- Already saved on the survey -->
      <div
        v-for="attachment in visibleStored"
        :key="attachment.id"
        :class="[$style.fileItem, $style.fileStored]"
      >
        <button
          v-if="attachment.is_image"
          type="button"
          :class="$style.thumbButton"
          :title="isRTL ? 'عرض الصورة' : 'View image'"
          @click="openStoredPreview(attachment)"
        >
          <img :src="urlFor(attachment.id)" :alt="attachment.original_filename" :class="$style.thumbImage" />
        </button>
        <div v-else :class="$style.fileIcon">
          <i :class="getFileIcon(attachment.mime_type)"></i>
        </div>

        <div :class="$style.fileInfo">
          <span :class="$style.fileName" :title="attachment.original_filename">
            {{ attachment.original_filename }}
          </span>
          <span :class="$style.fileMeta">
            <span>{{ attachment.format_name }}</span>
            <span :class="$style.metaDot">•</span>
            <span>{{ formatSize(attachment.file_size) }}</span>
            <span :class="$style.metaDot">•</span>
            <span :class="$style.savedTag">
              <i class="fas fa-check-circle"></i>
              {{ isRTL ? 'محفوظ' : 'Saved' }}
            </span>
          </span>
        </div>

        <div :class="$style.fileActions">
          <button
            v-if="attachment.is_image"
            type="button"
            :class="[$style.actionBtn, $style.viewBtn]"
            :title="isRTL ? 'عرض' : 'View'"
            @click="openStoredPreview(attachment)"
          >
            <i class="fas fa-eye"></i>
          </button>
          <!-- PDFs open in a tab; Office formats can only be downloaded -->
          <a
            v-else-if="canOpenInTab(attachment.mime_type)"
            :href="urlFor(attachment.id)"
            target="_blank"
            rel="noopener noreferrer"
            :class="[$style.actionBtn, $style.viewBtn]"
            :title="isRTL ? 'فتح في تبويب جديد' : 'Open in new tab'"
          >
            <i class="fas fa-external-link-alt"></i>
          </a>
          <button
            v-else
            type="button"
            :class="[$style.actionBtn, $style.viewBtn]"
            :title="isRTL ? 'تحميل الملف لفتحه على جهازك' : 'Download to open on your device'"
            :disabled="downloadingId === attachment.id"
            @click="downloadStored(attachment)"
          >
            <i :class="downloadingId === attachment.id ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
          </button>
          <button
            type="button"
            :class="[$style.actionBtn, $style.removeBtn]"
            :title="isRTL ? 'حذف' : 'Remove'"
            @click="markStoredForRemoval(attachment)"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <!-- Queued, uploaded when the survey is saved -->
      <div
        v-for="(file, index) in queuedFiles"
        :key="`queued-${index}-${file.name}`"
        :class="[$style.fileItem, $style.fileQueued]"
      >
        <div :class="$style.fileIcon">
          <i :class="getFileIcon(file.type)"></i>
        </div>
        <div :class="$style.fileInfo">
          <span :class="$style.fileName" :title="file.name">{{ file.name }}</span>
          <span :class="$style.fileMeta">
            <span>{{ formatSize(file.size) }}</span>
            <span :class="$style.metaDot">•</span>
            <span :class="$style.pendingTag">
              <i class="fas fa-clock"></i>
              {{ isRTL ? 'يُرفع عند الحفظ' : 'Uploads on save' }}
            </span>
          </span>
        </div>
        <div :class="$style.fileActions">
          <button
            type="button"
            :class="[$style.actionBtn, $style.removeBtn]"
            :title="isRTL ? 'إزالة' : 'Remove'"
            @click="removeQueuedFile(index)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Pending removals -->
    <div v-if="removedAttachments.length > 0" :class="$style.removalNotice">
      <i class="fas fa-trash-alt"></i>
      <span>
        {{ isRTL
          ? `${removedAttachments.length} مرفق سيُحذف عند الحفظ`
          : `${removedAttachments.length} attachment(s) will be deleted on save` }}
      </span>
      <button type="button" :class="$style.undoBtn" @click="undoRemovals">
        {{ isRTL ? 'تراجع' : 'Undo' }}
      </button>
    </div>

    <!-- Upload progress -->
    <div v-if="isUploading" :class="$style.progressWrap">
      <div :class="$style.progressBar">
        <div :class="$style.progressFill" :style="{ width: `${uploadProgress}%` }"></div>
      </div>
      <span :class="$style.progressText">
        {{ isRTL ? 'جاري رفع المرفقات...' : 'Uploading attachments...' }} {{ uploadProgress }}%
      </span>
    </div>

    <!-- Errors -->
    <div v-if="errorMessages.length > 0" :class="$style.errorBox">
      <div v-for="(message, index) in errorMessages" :key="index" :class="$style.errorRow">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ message }}</span>
      </div>
    </div>
  </div>

  <!-- Stored image preview -->
  <Teleport to="body">
    <div
      v-if="previewAttachment"
      :class="$style.previewOverlay"
      role="dialog"
      aria-modal="true"
      @click.self="closeStoredPreview"
    >
      <div :class="$style.previewShell" @click.stop>
        <div :class="$style.previewBar">
          <span :class="$style.previewName">{{ previewAttachment.original_filename }}</span>
          <button
            type="button"
            :class="$style.previewClose"
            :title="isRTL ? 'إغلاق' : 'Close'"
            @click="closeStoredPreview"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <img
          :src="urlFor(previewAttachment.id)"
          :alt="previewAttachment.original_filename"
          :class="$style.previewImage"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Swal from 'sweetalert2'
import { useAppStore } from '../../stores/useAppStore'
import {
  attachmentService,
  getSurveyAttachmentUrl,
  MAX_ATTACHMENT_SIZE_MB,
  MAX_SURVEY_ATTACHMENTS,
  SURVEY_ATTACHMENT_ACCEPT,
  SURVEY_ATTACHMENT_EXTENSIONS,
  SURVEY_ATTACHMENT_MIMES,
} from '../../services/attachmentService'
import type { SurveyAttachment } from '../../types/survey.types'

interface Props {
  /** Attachments already stored on the survey (edit mode) */
  initialAttachments?: SurveyAttachment[] | null
  maxFiles?: number
  maxSizeMB?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialAttachments: null,
  maxFiles: MAX_SURVEY_ATTACHMENTS,
  maxSizeMB: MAX_ATTACHMENT_SIZE_MB,
})

const emit = defineEmits<{
  /** Fired whenever the creator queues, removes or restores a file */
  change: []
}>()

const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

const acceptTypes = SURVEY_ATTACHMENT_ACCEPT

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessages = ref<string[]>([])

const storedAttachments = ref<SurveyAttachment[]>([])
const removedIds = ref<string[]>([])
const queuedFiles = ref<File[]>([])
const previewAttachment = ref<SurveyAttachment | null>(null)
const downloadingId = ref<string | null>(null)

// Mirror the survey payload into local state. Nothing is written to the server
// until the editor saves, so the editor's "unsaved changes" guard stays honest.
// Files the creator already picked are kept — in edit mode the survey payload
// arrives asynchronously and must not wipe an in-progress selection.
watch(
  () => props.initialAttachments,
  attachments => {
    storedAttachments.value = [...(attachments || [])]
    removedIds.value = []
  },
  { immediate: true, deep: true }
)

const visibleStored = computed(() =>
  storedAttachments.value.filter(attachment => !removedIds.value.includes(attachment.id))
)

const removedAttachments = computed(() =>
  storedAttachments.value.filter(attachment => removedIds.value.includes(attachment.id))
)

const totalCount = computed(() => visibleStored.value.length + queuedFiles.value.length)
const canAddMore = computed(() => totalCount.value < props.maxFiles)
const hasPendingChanges = computed(
  () => queuedFiles.value.length > 0 || removedIds.value.length > 0
)

const urlFor = (id: string) => getSurveyAttachmentUrl(id)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files) addFiles(Array.from(event.dataTransfer.files))
}

function extensionOf(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function addFiles(files: File[]) {
  errorMessages.value = []
  const rejected: string[] = []

  for (const file of files) {
    if (totalCount.value >= props.maxFiles) {
      rejected.push(
        isRTL.value
          ? `تم تجاهل "${file.name}" — الحد الأقصى ${props.maxFiles} ملفات`
          : `Skipped "${file.name}" — maximum ${props.maxFiles} files`
      )
      continue
    }

    // Validate on extension as well as MIME: browsers report an empty or
    // generic type for Office files often enough that MIME alone rejects
    // perfectly valid .docx/.pptx uploads.
    const extension = extensionOf(file.name)
    const typeAllowed =
      SURVEY_ATTACHMENT_EXTENSIONS.includes(extension) &&
      (file.type === '' || SURVEY_ATTACHMENT_MIMES.has(file.type))

    if (!typeAllowed) {
      rejected.push(
        isRTL.value
          ? `نوع الملف "${file.name}" غير مسموح به`
          : `File type of "${file.name}" is not allowed`
      )
      continue
    }

    if (file.size > props.maxSizeMB * 1024 * 1024) {
      rejected.push(
        isRTL.value
          ? `"${file.name}" يتجاوز الحد الأقصى (${props.maxSizeMB} ميجابايت)`
          : `"${file.name}" exceeds the ${props.maxSizeMB}MB limit`
      )
      continue
    }

    const duplicate =
      queuedFiles.value.some(queued => queued.name === file.name && queued.size === file.size) ||
      visibleStored.value.some(stored => stored.original_filename === file.name)

    if (duplicate) {
      rejected.push(
        isRTL.value ? `"${file.name}" مضاف بالفعل` : `"${file.name}" is already added`
      )
      continue
    }

    queuedFiles.value.push(file)
  }

  errorMessages.value = rejected
  emit('change')
}

function removeQueuedFile(index: number) {
  queuedFiles.value.splice(index, 1)
  errorMessages.value = []
  emit('change')
}

async function markStoredForRemoval(attachment: SurveyAttachment) {
  const result = await Swal.fire({
    icon: 'warning',
    title: isRTL.value ? 'حذف المرفق' : 'Remove attachment',
    html: isRTL.value
      ? `<p style="text-align:center;margin:0">سيتم حذف <strong style="color:#B78A41">${escapeHtml(attachment.original_filename)}</strong> عند حفظ الإيضاحات.</p>`
      : `<p style="text-align:center;margin:0"><strong style="color:#B78A41">${escapeHtml(attachment.original_filename)}</strong> will be deleted when you save.</p>`,
    showCancelButton: true,
    confirmButtonText: isRTL.value ? 'حذف' : 'Remove',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#B78A41',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
  })

  if (!result.isConfirmed) return
  if (!removedIds.value.includes(attachment.id)) removedIds.value.push(attachment.id)
  emit('change')
}

function undoRemovals() {
  removedIds.value = []
  emit('change')
}

/**
 * Only images and PDFs render in a browser tab — Word/Excel/PowerPoint always
 * download, so they must not be offered as "open in new tab".
 */
function canOpenInTab(mime: string): boolean {
  if (!mime) return false
  return mime === 'application/pdf' || mime.startsWith('image/')
}

async function downloadStored(attachment: SurveyAttachment) {
  errorMessages.value = []
  downloadingId.value = attachment.id
  try {
    await attachmentService.downloadSurveyAttachment(
      attachment.id,
      attachment.original_filename
    )
  } catch {
    errorMessages.value = [isRTL.value ? 'فشل في تحميل الملف' : 'Failed to download the file']
  } finally {
    downloadingId.value = null
  }
}

function openStoredPreview(attachment: SurveyAttachment) {
  previewAttachment.value = attachment
}

function closeStoredPreview() {
  previewAttachment.value = null
}

/**
 * Apply queued uploads and pending removals against a saved survey.
 *
 * Called by the editor page once the survey record exists (create) or has been
 * updated (edit). Returns the list of failures so the caller can surface them
 * without losing the saved survey.
 */
async function flush(surveyId: string): Promise<{ uploaded: number; removed: number; errors: string[] }> {
  const errors: string[] = []
  let uploaded = 0
  let removed = 0

  if (!surveyId || !hasPendingChanges.value) {
    return { uploaded, removed, errors }
  }

  const totalOperations = queuedFiles.value.length + removedIds.value.length
  let completed = 0

  isUploading.value = true
  uploadProgress.value = 0

  // Removals first so a survey at its file cap can be topped up in one save
  for (const attachmentId of [...removedIds.value]) {
    const attachment = storedAttachments.value.find(item => item.id === attachmentId)
    try {
      await attachmentService.deleteSurveyAttachment(attachmentId)
      storedAttachments.value = storedAttachments.value.filter(item => item.id !== attachmentId)
      removedIds.value = removedIds.value.filter(id => id !== attachmentId)
      removed++
    } catch (error: any) {
      errors.push(
        `${attachment?.original_filename || attachmentId}: ${
          error?.response?.data?.message ||
          (isRTL.value ? 'فشل حذف المرفق' : 'Failed to delete attachment')
        }`
      )
    }
    completed++
    uploadProgress.value = Math.round((completed / totalOperations) * 100)
  }

  for (const file of [...queuedFiles.value]) {
    try {
      const attachment = await attachmentService.uploadSurveyAttachment(surveyId, file)
      if (attachment) storedAttachments.value.push(attachment)
      queuedFiles.value = queuedFiles.value.filter(queued => queued !== file)
      uploaded++
    } catch (error: any) {
      errors.push(
        `${file.name}: ${
          error?.response?.data?.message ||
          error?.message ||
          (isRTL.value ? 'فشل رفع الملف' : 'Failed to upload the file')
        }`
      )
    }
    completed++
    uploadProgress.value = Math.round((completed / totalOperations) * 100)
  }

  isUploading.value = false
  errorMessages.value = errors
  return { uploaded, removed, errors }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getFileIcon(mime: string): string {
  if (mime === 'application/pdf') return 'fas fa-file-pdf'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'fas fa-file-powerpoint'
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'fas fa-file-excel'
  if (mime.includes('word') || mime.includes('document')) return 'fas fa-file-word'
  if (mime.startsWith('image/')) return 'fas fa-file-image'
  return 'fas fa-file-alt'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && previewAttachment.value) closeStoredPreview()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

defineExpose({
  flush,
  hasPendingChanges,
  queuedFiles,
  storedAttachments: visibleStored,
})
</script>

<style module>
.managerCard {
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 14px;
  padding: 1.25rem;
  margin-top: 1rem;
}

.managerCard[data-theme='night'] {
  background: rgba(66, 64, 59, 0.35);
  border-color: rgba(153, 122, 81, 0.35);
}

/* ── Header ── */
.cardHeader {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.headerIcon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(183, 138, 65, 0.12);
  color: var(--color-primary, #B78A41);
}

.headerText {
  flex: 1;
  min-width: 0;
}

.cardTitle {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #231F20;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.managerCard[data-theme='night'] .cardTitle {
  color: #F5F3EE;
}

.optionalTag {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(77, 77, 79, 0.1);
  color: #6b6459;
}

.cardHint {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  line-height: 1.55;
  color: #6b6459;
}

.managerCard[data-theme='night'] .cardHint {
  color: #C2BA98;
}

.countBadge {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: rgba(183, 138, 65, 0.12);
  color: var(--color-primary, #B78A41);
}

/* ── Drop zone ── */
.dropZone {
  border: 2px dashed #d8d2c6;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  background: #fdfcfa;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.dropZone:hover,
.dropZone:focus-visible,
.dropZoneActive {
  border-color: var(--color-primary, #B78A41);
  background: rgba(183, 138, 65, 0.05);
  outline: none;
}

.managerCard[data-theme='night'] .dropZone {
  background: rgba(35, 31, 32, 0.35);
  border-color: rgba(153, 122, 81, 0.4);
}

.hiddenInput {
  display: none;
}

.dropIcon {
  width: 44px;
  height: 44px;
  margin: 0 auto 0.6rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(183, 138, 65, 0.1);
  color: var(--color-primary, #B78A41);
  font-size: 1.25rem;
}

.dropText {
  margin: 0;
  font-size: 0.88rem;
  color: #4D4D4F;
}

.managerCard[data-theme='night'] .dropText {
  color: #D0D0D0;
}

.dropLink {
  color: var(--color-primary, #B78A41);
  font-weight: 700;
  text-decoration: underline;
}

.dropSubText {
  margin: 0.4rem 0 0;
  font-size: 0.72rem;
  color: #8a8175;
}

.dropDot {
  margin: 0 0.35rem;
  opacity: 0.6;
}

.limitNotice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  background: rgba(183, 138, 65, 0.08);
  border: 1px solid rgba(183, 138, 65, 0.25);
  color: #6b6459;
  font-size: 0.78rem;
}

.managerCard[data-theme='night'] .limitNotice {
  color: #D1C6AC;
}

/* ── File rows ── */
.fileList {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.fileItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #ece8e0;
  border-radius: 10px;
  background: #fff;
}

.managerCard[data-theme='night'] .fileItem {
  background: rgba(35, 31, 32, 0.4);
  border-color: rgba(153, 122, 81, 0.25);
}

.fileStored {
  border-inline-start: 3px solid rgba(22, 163, 74, 0.6);
}

.fileQueued {
  border-inline-start: 3px solid var(--color-primary, #B78A41);
  border-style: dashed;
}

.fileIcon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(183, 138, 65, 0.08);
  color: var(--color-primary, #B78A41);
  font-size: 1.15rem;
}

.thumbButton {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
}

.thumbImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fileInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.fileName {
  font-size: 0.85rem;
  font-weight: 600;
  color: #231F20;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.managerCard[data-theme='night'] .fileName {
  color: #F5F3EE;
}

.fileMeta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  font-size: 0.71rem;
  color: #8a8175;
}

.metaDot {
  opacity: 0.6;
}

.savedTag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #16a34a;
  font-weight: 600;
}

.pendingTag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-primary, #B78A41);
  font-weight: 600;
}

.fileActions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.actionBtn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.viewBtn {
  color: var(--color-primary, #B78A41);
}

.viewBtn:hover {
  background: rgba(183, 138, 65, 0.12);
  border-color: rgba(183, 138, 65, 0.3);
}

.removeBtn {
  color: #dc3545;
}

.removeBtn:hover {
  background: rgba(220, 53, 69, 0.1);
  border-color: rgba(220, 53, 69, 0.3);
}

/* ── Pending removals ── */
.removalNotice {
  margin-top: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  background: rgba(220, 53, 69, 0.07);
  border: 1px solid rgba(220, 53, 69, 0.2);
  color: #b02a37;
  font-size: 0.78rem;
}

.undoBtn {
  margin-inline-start: auto;
  border: none;
  background: transparent;
  color: var(--color-primary, #B78A41);
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
  text-decoration: underline;
}

/* ── Progress ── */
.progressWrap {
  margin-top: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progressBar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #ece8e0;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  border-radius: 3px;
  background: var(--color-primary, #B78A41);
  transition: width 0.25s ease;
}

.progressText {
  font-size: 0.74rem;
  color: #6b6459;
  white-space: nowrap;
}

/* ── Errors ── */
.errorBox {
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.errorRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  background: rgba(220, 53, 69, 0.08);
  color: #dc3545;
  font-size: 0.76rem;
}

/* ── Preview overlay ── */
.previewOverlay {
  position: fixed;
  inset: 0;
  z-index: 12000;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  backdrop-filter: blur(3px);
}

.previewShell {
  width: min(900px, 100%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.previewBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: #fff;
}

.previewName {
  font-size: 0.9rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.previewClose {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
}

.previewClose:hover {
  background: rgba(220, 53, 69, 0.8);
}

.previewImage {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 10px;
  background: #fff;
}

@media (max-width: 600px) {
  .managerCard {
    padding: 1rem;
  }

  .cardHint {
    font-size: 0.74rem;
  }
}
</style>
