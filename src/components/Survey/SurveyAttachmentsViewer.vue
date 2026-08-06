<template>
  <div
    v-if="items.length > 0"
    :class="[$style.attachmentsPanel, { [$style.compact]: compact }]"
    :data-theme="currentTheme"
    :dir="isRTL ? 'rtl' : 'ltr'"
  >
    <!-- Header -->
    <div :class="$style.panelHeader">
      <div :class="$style.headerIcon">
        <i class="fas fa-paperclip"></i>
      </div>
      <div :class="$style.headerText">
        <h4 :class="$style.panelTitle">{{ resolvedTitle }}</h4>
        <p v-if="!compact" :class="$style.panelHint">{{ resolvedHint }}</p>
      </div>
      <span :class="$style.countBadge">
        {{ isRTL ? `${items.length} مرفق` : `${items.length} file${items.length === 1 ? '' : 's'}` }}
      </span>
    </div>

    <!-- Files -->
    <div :class="$style.fileList">
      <div
        v-for="item in items"
        :key="item.key"
        :class="[$style.fileItem, { [$style.filePending]: item.pending }]"
      >
        <!-- Image thumbnail, or a format icon -->
        <button
          v-if="item.isImage"
          type="button"
          :class="$style.thumbButton"
          :title="isRTL ? 'عرض الصورة' : 'View image'"
          @click="openPreview(item)"
        >
          <img :src="item.url" :alt="item.name" :class="$style.thumbImage" loading="lazy" />
        </button>
        <div v-else :class="$style.fileIcon">
          <i :class="getFileIcon(item.mime)"></i>
        </div>

        <!-- Meta -->
        <div :class="$style.fileInfo">
          <span :class="$style.fileName" :title="item.name">{{ item.name }}</span>
          <span :class="$style.fileMeta">
            <span>{{ item.formatName }}</span>
            <span :class="$style.metaDot">•</span>
            <span>{{ formatSize(item.size) }}</span>
            <template v-if="item.pending">
              <span :class="$style.metaDot">•</span>
              <span :class="$style.pendingTag">{{ isRTL ? 'سيُرفع عند الحفظ' : 'Uploads on save' }}</span>
            </template>
          </span>
          <span v-if="item.description" :class="$style.fileDescription">{{ item.description }}</span>
        </div>

        <!-- Actions -->
        <div :class="$style.fileActions">
          <!-- Images: eye icon opens the in-page preview -->
          <button
            v-if="item.isImage"
            type="button"
            :class="[$style.actionBtn, $style.viewBtn]"
            :title="isRTL ? 'عرض الصورة' : 'View image'"
            :aria-label="isRTL ? 'عرض الصورة' : 'View image'"
            @click="openPreview(item)"
          >
            <i class="fas fa-eye"></i>
          </button>

          <!-- PDFs: the browser can render these, so open in a new tab -->
          <a
            v-else-if="item.canOpenInTab && !item.pending"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            :class="[$style.actionBtn, $style.openBtn]"
            :title="isRTL ? 'فتح في تبويب جديد' : 'Open in new tab'"
            :aria-label="isRTL ? 'فتح في تبويب جديد' : 'Open in new tab'"
          >
            <i class="fas fa-external-link-alt"></i>
          </a>

          <!-- Word/Excel/PowerPoint cannot be rendered by a browser — the only
               honest action is a download, so it becomes the primary button -->
          <button
            v-if="!item.pending"
            type="button"
            :class="[$style.actionBtn, item.canOpenInTab ? $style.downloadBtn : $style.downloadPrimaryBtn]"
            :title="item.canOpenInTab
              ? (isRTL ? 'تحميل' : 'Download')
              : (isRTL ? 'تحميل الملف لفتحه على جهازك' : 'Download to open on your device')"
            :aria-label="isRTL ? 'تحميل' : 'Download'"
            :disabled="downloadingId === item.id"
            @click="download(item)"
          >
            <i :class="downloadingId === item.id ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" :class="$style.errorMessage">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ errorMessage }}</span>
    </div>
  </div>

  <!-- Image preview overlay -->
  <Teleport to="body">
    <div
      v-if="previewItem"
      :class="$style.previewOverlay"
      :data-theme="currentTheme"
      :dir="isRTL ? 'rtl' : 'ltr'"
      role="dialog"
      aria-modal="true"
      @click.self="closePreview"
    >
      <div :class="$style.previewShell" @click.stop>
        <div :class="$style.previewBar">
          <span :class="$style.previewName" :title="previewItem.name">{{ previewItem.name }}</span>
          <div :class="$style.previewActions">
            <span v-if="imageItems.length > 1" :class="$style.previewCounter">
              {{ previewIndex + 1 }} / {{ imageItems.length }}
            </span>
            <button
              v-if="!previewItem.pending"
              type="button"
              :class="$style.previewBtn"
              :title="isRTL ? 'تحميل' : 'Download'"
              @click="download(previewItem)"
            >
              <i class="fas fa-download"></i>
            </button>
            <button
              type="button"
              :class="[$style.previewBtn, $style.previewClose]"
              :title="isRTL ? 'إغلاق' : 'Close'"
              @click="closePreview"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div :class="$style.previewStage">
          <button
            v-if="imageItems.length > 1"
            type="button"
            :class="[$style.navBtn, $style.navPrev]"
            :title="isRTL ? 'السابق' : 'Previous'"
            @click="step(-1)"
          >
            <i :class="isRTL ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
          </button>

          <img :src="previewItem.url" :alt="previewItem.name" :class="$style.previewImage" />

          <button
            v-if="imageItems.length > 1"
            type="button"
            :class="[$style.navBtn, $style.navNext]"
            :title="isRTL ? 'التالي' : 'Next'"
            @click="step(1)"
          >
            <i :class="isRTL ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
          </button>
        </div>

        <p v-if="previewItem.description" :class="$style.previewCaption">
          {{ previewItem.description }}
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import {
  attachmentService,
  getSurveyAttachmentUrl,
} from '../../services/attachmentService'
import type { SurveyAttachment } from '../../types/survey.types'

interface Props {
  /** Attachments already stored on the survey */
  attachments?: SurveyAttachment[] | null
  /** Files picked in the editor but not uploaded yet (preview before saving) */
  pendingFiles?: File[]
  /** Override the panel heading */
  title?: string
  /** Override the explanatory line under the heading */
  hint?: string
  /** Tighter layout for modals/side panels */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  attachments: null,
  pendingFiles: () => [],
  title: '',
  hint: '',
  compact: false,
})

const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

interface ViewerItem {
  key: string
  id: string
  name: string
  size: number
  mime: string
  formatName: string
  description: string
  isImage: boolean
  /** Browser can render it in a tab (images, PDF) — Office formats cannot */
  canOpenInTab: boolean
  url: string
  pending: boolean
}

const errorMessage = ref('')
const downloadingId = ref<string | null>(null)
const previewIndex = ref(0)
const previewKey = ref<string | null>(null)

// Object URLs minted for not-yet-uploaded files — revoked when the list changes
// or the component unmounts, so previewing a queued image never leaks memory.
const objectUrls = new Map<File, string>()

const releaseObjectUrls = (keep: File[] = []) => {
  for (const [file, url] of objectUrls) {
    if (!keep.includes(file)) {
      URL.revokeObjectURL(url)
      objectUrls.delete(file)
    }
  }
}

const objectUrlFor = (file: File): string => {
  let url = objectUrls.get(file)
  if (!url) {
    url = URL.createObjectURL(file)
    objectUrls.set(file, url)
  }
  return url
}

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  return isRTL.value ? 'مرفقات الإيضاحات' : 'Survey attachments'
})

const resolvedHint = computed(() => {
  if (props.hint) return props.hint
  return isRTL.value
    ? 'ملفات مرجعية أضافها منشئ الإيضاحات — يُنصح بمراجعتها قبل الإجابة على الأسئلة'
    : 'Reference files added by the survey creator — review them before answering'
})

const storedItems = computed<ViewerItem[]>(() =>
  (props.attachments || []).map(att => ({
    key: `stored-${att.id}`,
    id: att.id,
    name: att.original_filename,
    size: att.file_size,
    mime: att.mime_type,
    formatName: att.format_name || formatFromMime(att.mime_type),
    description: att.description || '',
    isImage: att.is_image ?? att.mime_type?.startsWith('image/') ?? false,
    canOpenInTab: att.is_inline_viewable ?? isBrowserViewable(att.mime_type),
    url: getSurveyAttachmentUrl(att.id),
    pending: false,
  }))
)

const pendingItems = computed<ViewerItem[]>(() =>
  (props.pendingFiles || []).map((file, index) => ({
    key: `pending-${index}-${file.name}-${file.size}`,
    id: `pending-${index}`,
    name: file.name,
    size: file.size,
    mime: file.type,
    formatName: formatFromMime(file.type),
    description: '',
    isImage: file.type.startsWith('image/'),
    canOpenInTab: isBrowserViewable(file.type),
    url: file.type.startsWith('image/') ? objectUrlFor(file) : '',
    pending: true,
  }))
)

const items = computed<ViewerItem[]>(() => [...storedItems.value, ...pendingItems.value])
const imageItems = computed<ViewerItem[]>(() => items.value.filter(item => item.isImage))

const previewItem = computed<ViewerItem | null>(() => {
  if (!previewKey.value) return null
  return imageItems.value[previewIndex.value] || null
})

// Drop object URLs for files no longer in the queue
watch(
  () => props.pendingFiles,
  files => releaseObjectUrls(files || []),
  { deep: true }
)

function openPreview(item: ViewerItem) {
  const index = imageItems.value.findIndex(candidate => candidate.key === item.key)
  previewIndex.value = index >= 0 ? index : 0
  previewKey.value = item.key
}

function closePreview() {
  previewKey.value = null
}

function step(direction: number) {
  const total = imageItems.value.length
  if (total === 0) return
  previewIndex.value = (previewIndex.value + direction + total) % total
  previewKey.value = imageItems.value[previewIndex.value].key
}

async function download(item: ViewerItem) {
  if (item.pending) return
  errorMessage.value = ''
  downloadingId.value = item.id
  try {
    await attachmentService.downloadSurveyAttachment(item.id, item.name)
  } catch {
    errorMessage.value = isRTL.value ? 'فشل في تحميل الملف' : 'Failed to download the file'
  } finally {
    downloadingId.value = null
  }
}

/**
 * Only images and PDFs can be displayed by a browser. Word/Excel/PowerPoint
 * always end up as a download, so they must not be offered as "open in tab".
 */
function isBrowserViewable(mime: string): boolean {
  if (!mime) return false
  return mime === 'application/pdf' || mime.startsWith('image/')
}

function formatFromMime(mime: string): string {
  if (!mime) return isRTL.value ? 'ملف' : 'File'
  if (mime === 'application/pdf') return 'PDF'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PowerPoint'
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'Excel'
  if (mime.includes('word') || mime.includes('document')) return 'Word'
  if (mime.startsWith('image/')) return mime.replace('image/', '').toUpperCase()
  return isRTL.value ? 'ملف' : 'File'
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
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function handleKeydown(event: KeyboardEvent) {
  if (!previewKey.value) return
  if (event.key === 'Escape') closePreview()
  else if (event.key === 'ArrowRight') step(isRTL.value ? -1 : 1)
  else if (event.key === 'ArrowLeft') step(isRTL.value ? 1 : -1)
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  releaseObjectUrls()
})
</script>

<style module>
.attachmentsPanel {
  /* Matches the questions column (.allQuestionsContainer is 780px) so the card
     lines up with the survey content instead of stretching the full viewport */
  width: 100%;
  max-width: 720px;
  margin: 0 auto 1.25rem;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-inline-start: 4px solid var(--color-primary, #B78A41);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  /* Long filenames must never push the card wider than its column */
  overflow: hidden;
}

.attachmentsPanel.compact {
  /* Sits just inside the 780px questions column so it reads as part of it */
  max-width: 700px;
  padding: 0.75rem 0.85rem;
  margin-bottom: 1rem;
  border-radius: 10px;
}

.attachmentsPanel[data-theme='night'] {
  background: rgba(66, 64, 59, 0.35);
  border-color: rgba(153, 122, 81, 0.35);
}

/* ── Header ── */
.panelHeader {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
}

.headerIcon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(183, 138, 65, 0.12);
  color: var(--color-primary, #B78A41);
  font-size: 0.85rem;
}

.headerText {
  flex: 1;
  min-width: 0;
}

.panelTitle {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #231F20;
}

.attachmentsPanel[data-theme='night'] .panelTitle {
  color: #F5F3EE;
}

.panelHint {
  margin: 0.15rem 0 0;
  font-size: 0.73rem;
  line-height: 1.45;
  color: #6b6459;
}

.attachmentsPanel[data-theme='night'] .panelHint {
  color: #C2BA98;
}

.countBadge {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(183, 138, 65, 0.12);
  color: var(--color-primary, #B78A41);
  white-space: nowrap;
}

/* ── File rows ── */
.fileList {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.fileItem {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid #ece8e0;
  border-radius: 8px;
  background: #fdfcfa;
  box-sizing: border-box;
  min-width: 0;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.fileItem:hover {
  border-color: var(--color-primary, #B78A41);
  box-shadow: 0 2px 8px rgba(183, 138, 65, 0.12);
}

.attachmentsPanel[data-theme='night'] .fileItem {
  background: rgba(35, 31, 32, 0.4);
  border-color: rgba(153, 122, 81, 0.25);
}

.filePending {
  border-style: dashed;
  opacity: 0.9;
}

.fileIcon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: rgba(183, 138, 65, 0.08);
  color: var(--color-primary, #B78A41);
  font-size: 1rem;
}

.thumbButton {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid #e8e4dc;
  border-radius: 7px;
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
  font-size: 0.8rem;
  font-weight: 600;
  color: #231F20;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachmentsPanel[data-theme='night'] .fileName {
  color: #F5F3EE;
}

.fileMeta {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.68rem;
  color: #8a8175;
}

.metaDot {
  opacity: 0.6;
}

.pendingTag {
  color: var(--color-primary, #B78A41);
  font-weight: 600;
}

.fileDescription {
  font-size: 0.74rem;
  color: #6b6459;
  line-height: 1.45;
}

.attachmentsPanel[data-theme='night'] .fileDescription {
  color: #C2BA98;
}

/* ── Actions ── */
.fileActions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.actionBtn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.actionBtn:disabled {
  opacity: 0.6;
  cursor: default;
}

.viewBtn,
.openBtn {
  color: var(--color-primary, #B78A41);
}

.viewBtn:hover,
.openBtn:hover {
  background: rgba(183, 138, 65, 0.12);
  border-color: rgba(183, 138, 65, 0.3);
}

.downloadBtn {
  color: #4D4D4F;
}

.downloadBtn:hover:not(:disabled) {
  background: rgba(77, 77, 79, 0.1);
}

.attachmentsPanel[data-theme='night'] .downloadBtn {
  color: #D0D0D0;
}

/* Word/Excel/PowerPoint have no in-browser view, so download is the main action */
.downloadPrimaryBtn {
  color: var(--color-primary, #B78A41);
  border-color: rgba(183, 138, 65, 0.3);
  background: rgba(183, 138, 65, 0.08);
}

.downloadPrimaryBtn:hover:not(:disabled) {
  background: rgba(183, 138, 65, 0.18);
}

.errorMessage {
  margin-top: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  background: rgba(220, 53, 69, 0.08);
  color: #dc3545;
  font-size: 0.78rem;
}

/* ── Image preview overlay ── */
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
  width: min(1000px, 100%);
  max-height: 100%;
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

.previewActions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.previewCounter {
  font-size: 0.78rem;
  opacity: 0.85;
}

.previewBtn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s ease;
}

.previewBtn:hover {
  background: rgba(255, 255, 255, 0.22);
}

.previewClose:hover {
  background: rgba(220, 53, 69, 0.8);
  border-color: rgba(220, 53, 69, 0.9);
}

.previewStage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.previewImage {
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.navBtn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
}

.navBtn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.navPrev {
  inset-inline-start: -0.5rem;
}

.navNext {
  inset-inline-end: -0.5rem;
}

.previewCaption {
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.82rem;
}

/* ── Responsive ── */
@media (max-width: 700px) {
  .attachmentsPanel {
    padding: 0.75rem;
    max-width: 100%;
  }

  .panelHint {
    display: none;
  }

  .fileMeta {
    flex-wrap: wrap;
  }

  .navPrev {
    inset-inline-start: 0.25rem;
  }

  .navNext {
    inset-inline-end: 0.25rem;
  }
}
</style>
