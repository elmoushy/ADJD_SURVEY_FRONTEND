<script setup lang="ts">
import { ref, computed } from 'vue'
import Swal from 'sweetalert2'
import {
  emailAttachmentService,
  validateAttachment,
  formatFileSize,
  ATTACHMENT_ACCEPT,
  MAX_EMAIL_ATTACHMENTS,
  MAX_EMAIL_ATTACHMENT_SIZE_MB,
  type EmailAttachment
} from '@/services/emailAttachmentService'

interface Props {
  modelValue: EmailAttachment[]
  maxAttachments?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxAttachments: MAX_EMAIL_ATTACHMENTS,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: EmailAttachment[]): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const canAddMore = computed(
  () => !props.disabled && props.modelValue.length < props.maxAttachments
)

const openFilePicker = () => {
  if (!canAddMore.value) {
    Swal.fire({
      icon: 'info',
      title: 'تنبيه',
      text: `يمكنك إرفاق ${props.maxAttachments} ملفات كحد أقصى`,
      confirmButtonText: 'حسناً'
    })
    return
  }
  fileInput.value?.click()
}

const handleFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  // reset so picking the same file again re-triggers change
  input.value = ''
  if (!files.length) return

  const remainingSlots = props.maxAttachments - props.modelValue.length
  if (files.length > remainingSlots) {
    Swal.fire({
      icon: 'warning',
      title: 'عدد كبير من الملفات',
      text: `يمكنك إضافة ${remainingSlots} ملف فقط (الحد الأقصى ${props.maxAttachments})`,
      confirmButtonText: 'حسناً'
    })
    return
  }

  uploading.value = true
  const added: EmailAttachment[] = []
  const errors: string[] = []

  for (const file of files) {
    const validationError = validateAttachment(file)
    if (validationError) {
      errors.push(`${file.name}: ${validationError}`)
      continue
    }
    try {
      const attachment = await emailAttachmentService.upload(file)
      added.push(attachment)
    } catch (error: any) {
      const apiMsg =
        error?.response?.data?.file?.[0] ||
        error?.response?.data?.detail ||
        'فشل رفع الملف'
      errors.push(`${file.name}: ${apiMsg}`)
    }
  }

  uploading.value = false

  if (added.length) {
    emit('update:modelValue', [...props.modelValue, ...added])
  }

  if (errors.length) {
    Swal.fire({
      icon: 'error',
      title: 'تعذر رفع بعض الملفات',
      html: errors.map(e => `<div style="font-size:0.85rem;margin:4px 0">${e}</div>`).join(''),
      confirmButtonText: 'حسناً'
    })
  }
}

const removeAttachment = async (attachment: EmailAttachment, index: number) => {
  // Borrowed (e.g. carried from a template) → remove locally only
  if (attachment._local) {
    emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
    return
  }

  try {
    await emailAttachmentService.remove(attachment.id)
  } catch (error) {
    // If it was already gone, still drop it from the list
    console.warn('Failed to delete attachment (removing from list anyway):', error)
  }
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

const downloadAttachment = async (attachment: EmailAttachment) => {
  // Freshly-uploaded orphans aren't downloadable until associated; backend
  // still serves them by id, so attempt the download regardless.
  try {
    await emailAttachmentService.download(attachment)
  } catch (error) {
    console.error('Download failed:', error)
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'تعذر تحميل الملف',
      confirmButtonText: 'حسناً'
    })
  }
}

const iconForMime = (mime: string): string => {
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('word') || mime.includes('msword')) return 'DOC'
  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('ms-excel')) return 'XLS'
  if (mime.includes('csv')) return 'CSV'
  return 'FILE'
}

defineExpose({ openFilePicker })
</script>

<template>
  <div :class="$style.wrapper">
    <input
      ref="fileInput"
      type="file"
      multiple
      :accept="ATTACHMENT_ACCEPT"
      :class="$style.hiddenInput"
      @change="handleFiles"
    />

    <div :class="$style.toolbar">
      <button
        type="button"
        :class="$style.attachButton"
        :disabled="!canAddMore || uploading"
        @click="openFilePicker"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        <span>{{ uploading ? 'جاري الرفع...' : 'إرفاق ملف' }}</span>
      </button>
      <span :class="$style.hint">
        PDF، Word، Excel، CSV — حتى {{ MAX_EMAIL_ATTACHMENT_SIZE_MB }} ميغابايت
        ({{ modelValue.length }}/{{ maxAttachments }})
      </span>
    </div>

    <ul v-if="modelValue.length" :class="$style.list">
      <li v-for="(att, index) in modelValue" :key="att.id" :class="$style.item">
        <span :class="$style.fileBadge">{{ iconForMime(att.mime_type) }}</span>
        <div :class="$style.fileInfo">
          <span :class="$style.fileName" :title="att.original_filename">{{ att.original_filename }}</span>
          <span :class="$style.fileSize">{{ formatFileSize(att.file_size) }}</span>
        </div>
        <div :class="$style.actions">
          <button
            type="button"
            :class="$style.iconButton"
            title="تحميل"
            @click="downloadAttachment(att)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            type="button"
            :class="[$style.iconButton, $style.removeButton]"
            title="إزالة"
            :disabled="disabled"
            @click="removeAttachment(att, index)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style module>
.wrapper {
  margin-top: 0.5rem;
}

.hiddenInput {
  display: none;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.attachButton {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #A17D23;
  background: rgba(161, 125, 35, 0.08);
  color: #A17D23;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.attachButton:hover:not(:disabled) {
  background: linear-gradient(135deg, #A17D23, #B78A41);
  color: #fff;
}

.attachButton:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.hint {
  font-size: 0.78rem;
  color: var(--text-secondary, #6b7280);
}

.list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--control-border, #e5e7eb);
  border-radius: 8px;
  background: var(--input-bg, #fff);
}

.fileBadge {
  flex-shrink: 0;
  width: 40px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #A17D23, #B78A41);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.fileInfo {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.fileName {
  font-size: 0.88rem;
  color: var(--text-primary, #1a1a1a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fileSize {
  font-size: 0.74rem;
  color: var(--text-secondary, #6b7280);
}

.actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.iconButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #6b7280);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.iconButton:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
  color: #A17D23;
}

.removeButton:hover:not(:disabled) {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}

.iconButton:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Dark mode */
:global([data-theme="dark"]) .item {
  background: #111827;
  border-color: #374151;
}

:global([data-theme="dark"]) .fileName {
  color: #f9fafb;
}

:global([data-theme="dark"]) .iconButton:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
}

:global([data-theme="night"]) .item {
  background: #111827;
  border-color: #374151;
}

:global([data-theme="night"]) .fileName {
  color: #f9fafb;
}
</style>
