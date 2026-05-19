<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFollowUpsStore } from '@/stores/followUps'
import { useSimpleAuth } from '@/composables/useSimpleAuth'
import { attachmentService, type AttachmentInfo } from '@/services/attachmentService'
import FollowUpDecisionPanel from './FollowUpDecisionPanel.vue'
import type { FollowUpThread } from '@/types/survey.types'

const props = defineProps<{ thread: FollowUpThread; isAdmin?: boolean }>()

const { t } = useI18n()
const store = useFollowUpsStore()
const { user } = useSimpleAuth()

// The decision panel is only shown when:
// 1. The user has an admin role (isAdmin prop)
// 2. The user is NOT the respondent of this specific thread
const canDecide = computed(() => {
  if (!props.isAdmin) return false
  const currentEmail = user.value?.email
  if (!currentEmail) return false
  return currentEmail !== props.thread.respondent_email
})

const replyBody = ref('')
const sending = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const replyFiles = ref<File[]>([])
const fileError = ref('')

const isClosed = computed(() =>
  ['accepted', 'rejected', 'closed'].includes(props.thread.status)
)

function initials(email: string | null): string {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ar-AE', {
    hour: '2-digit', minute: '2-digit',
    year: 'numeric', month: 'numeric', day: 'numeric',
  })
}

async function sendReply() {
  if (!replyBody.value.trim() || sending.value) return
  sending.value = true
  fileError.value = ''
  try {
    const msg = await store.sendMessage(props.thread.id, replyBody.value.trim())
    // Upload attachments to the newly created message
    if (replyFiles.value.length > 0 && msg?.id) {
      for (const file of replyFiles.value) {
        try {
          await attachmentService.uploadFollowUpAttachment(props.thread.id, msg.id, file)
        } catch (err: any) {
          fileError.value = err.response?.data?.message || 'فشل رفع المرفق'
        }
      }
      replyFiles.value = []
    }
    replyBody.value = ''
    await nextTick()
    messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
  } finally {
    sending.value = false
  }
}

function handleReplyFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  const maxSize = 10 * 1024 * 1024
  for (const file of Array.from(input.files)) {
    if (file.size > maxSize) {
      fileError.value = `الملف "${file.name}" يتجاوز الحد الأقصى (10 ميجابايت)`
      continue
    }
    if (replyFiles.value.length >= 5) {
      fileError.value = 'الحد الأقصى 5 ملفات'
      break
    }
    replyFiles.value.push(file)
  }
  input.value = ''
}

function removeReplyFile(index: number) {
  replyFiles.value.splice(index, 1)
  fileError.value = ''
}

async function downloadAttachment(att: any) {
  try {
    const blobUrl = await attachmentService.downloadFollowUpAttachment(att.id)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = att.original_filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    fileError.value = 'فشل في تحميل المرفق'
  }
}

async function deleteAttachment(att: any, msg: any) {
  try {
    await attachmentService.deleteFollowUpAttachment(att.id)
    msg.attachments = msg.attachments.filter((a: any) => a.id !== att.id)
  } catch (err: any) {
    fileError.value = err.response?.data?.message || 'فشل في حذف المرفق'
  }
}
</script>

<template>
  <div :class="$style.wrap">

    <!-- Chat messages -->
    <div :class="$style.messages" ref="messagesEl">
      <div
        v-for="msg in thread.messages"
        :key="msg.id"
        :class="[$style.row, msg.sender_role === 'admin' ? $style.rowAdmin : $style.rowResponder]"
      >
        <!-- Avatar -->
        <div :class="[$style.avatar, msg.sender_role === 'admin' ? $style.avatarAdmin : $style.avatarResponder]">
          {{ initials(msg.sender_email) }}
        </div>

        <!-- Bubble + meta -->
        <div :class="$style.bubbleWrap">
          <div :class="$style.bubblemeta">
            <span :class="$style.senderName">
              {{ msg.sender_email || (msg.sender_role === 'admin' ? t('followUp.adminRole') : t('followUp.userRole')) }}
            </span>
            <span :class="$style.senderRole">
              {{ msg.sender_role === 'admin' ? t('followUp.adminRole') : t('followUp.userRole') }}
            </span>
            <span :class="$style.msgTime">{{ formatTime(msg.created_at) }}</span>
          </div>
          <div :class="[$style.bubble, msg.sender_role === 'admin' ? $style.bubbleAdmin : $style.bubbleResponder]">
            <p :class="$style.msgBody">{{ msg.body }}</p>
            <!-- Message Attachments -->
            <div v-if="msg.attachments && msg.attachments.length" :class="$style.msgAttachments">
              <div v-for="att in msg.attachments" :key="att.id" :class="$style.attachCard">
                <i class="fas fa-file-alt" :class="$style.attachCardIcon"></i>
                <span :class="$style.attachCardName">{{ att.original_filename }}</span>
                <button :class="$style.attachDownloadBtn" @click.stop="downloadAttachment(att)" type="button" title="تحميل">
                  <i class="fas fa-download"></i>
                </button>
                <button v-if="att.can_delete" :class="$style.attachDeleteBtn" @click.stop="deleteAttachment(att, msg)" type="button" title="حذف">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            <div v-if="msg.is_preset" :class="$style.presetTag">
              <i class="fas fa-bookmark"></i>
              {{ t('followUp.presetMessage') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decision panel: only shown when user is admin AND not the respondent of this thread -->
    <FollowUpDecisionPanel
      v-if="canDecide && thread.status === 'replied'"
      :thread-id="thread.id"
    />

    <!-- Reply area -->
    <div :class="$style.replyArea">
      <div v-if="isClosed" :class="$style.closedBanner">
        <i class="fas fa-lock"></i>
        {{ t('followUp.threadClosed') }}
      </div>

      <template v-else>
        <div :class="$style.replyBox">
          <textarea
            v-model="replyBody"
            :class="$style.replyInput"
            :placeholder="t('followUp.replyPlaceholder')"
            rows="3"
            @keydown.ctrl.enter="sendReply"
          ></textarea>
          <!-- Queued file chips -->
          <div v-if="replyFiles.length" :class="$style.replyFiles">
            <span v-for="(f, i) in replyFiles" :key="i" :class="$style.fileChip">
              <i class="fas fa-paperclip"></i>
              {{ f.name }}
              <button @click="removeReplyFile(i)" :class="$style.chipRemove">&times;</button>
            </span>
          </div>
          <div v-if="fileError" :class="$style.fileError">{{ fileError }}</div>
          <div :class="$style.replyFooter">
            <span :class="$style.hint">Ctrl + Enter</span>
            <label :class="$style.attachBtn">
              <i class="fas fa-paperclip"></i>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                style="display:none"
                @change="handleReplyFileSelect"
              />
            </label>
            <button
              :class="$style.sendBtn"
              :disabled="sending || !replyBody.trim()"
              @click="sendReply"
            >
              <i :class="sending ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'"></i>
              {{ t('followUp.sendReply') }}
            </button>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<style module>
/* ── Shell ──────────────────────────────────────────────────── */
.wrap {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
}

/* ── Messages ───────────────────────────────────────────────── */
.messages {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 20px;
  max-height: 480px;
  overflow-y: auto;
}

/* ── Row (message + avatar) ─────────────────────────────────── */
.row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.rowAdmin    { flex-direction: row;         }
.rowResponder { flex-direction: row-reverse; }

/* ── Avatar ─────────────────────────────────────────────────── */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}
.avatarAdmin     { background: #dbeafe; color: #1d4ed8; }
.avatarResponder { background: #d1fae5; color: #065f46; }

/* ── Bubble wrap ────────────────────────────────────────────── */
.bubbleWrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 72%;
}

.rowAdmin     .bubbleWrap { align-items: flex-start; }
.rowResponder .bubbleWrap { align-items: flex-end;   }

/* ── Meta line ──────────────────────────────────────────────── */
.bubblemeta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.rowResponder .bubblemeta { flex-direction: row-reverse; }

.senderName {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}
.senderRole {
  font-size: 11px;
  color: #9ca3af;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 1px 7px;
}
.msgTime {
  font-size: 11px;
  color: #c4c9d4;
  margin-right: auto;
}
.rowResponder .msgTime { margin-right: 0; margin-left: auto; }

/* ── Bubble ─────────────────────────────────────────────────── */
.bubble {
  border-radius: 14px;
  padding: 12px 16px;
  line-height: 1.55;
}
.bubbleAdmin {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-top-right-radius: 4px;
}
.bubbleResponder {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-top-left-radius: 4px;
}

.msgBody {
  margin: 0;
  font-size: 14px;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
}

.presetTag {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #6b7280;
  background: rgba(0,0,0,0.04);
  border-radius: 6px;
  padding: 2px 8px;
}

/* ── Reply area ─────────────────────────────────────────────── */
.replyArea {
  border-top: 1px solid #f3f4f6;
  padding: 16px 20px;
}

.closedBanner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.replyBox {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.replyInput {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
  direction: rtl;
}
.replyInput:focus {
  outline: none;
  border-color: #1a6fa8;
  box-shadow: 0 0 0 3px rgba(26,111,168,0.08);
}

.replyFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint {
  font-size: 11px;
  color: #c4c9d4;
}

.sendBtn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #1a6fa8;
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 9px 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.sendBtn:hover:not(:disabled) { background: #155a8a; }
.sendBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.attachBtn {
  cursor: pointer;
  color: #888;
  font-size: 1.1rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.15s;
}
.attachBtn:hover { color: var(--color-primary, #B78A41); }

.replyFiles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 12px 0;
}

.fileChip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0f0f0;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.75rem;
  color: #555;
}
.chipRemove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: #dc3545;
  padding: 0 2px;
  line-height: 1;
}

.fileError {
  padding: 4px 12px;
  font-size: 0.75rem;
  color: #dc3545;
}

/* Message attachment cards */
.msgAttachments {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachCard {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.7);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.8rem;
}

.attachCardIcon {
  color: var(--color-primary, #B78A41);
  font-size: 1rem;
}

.attachCardName {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
}

.attachDownloadBtn,
.attachDeleteBtn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: background 0.15s;
}

.attachDownloadBtn {
  color: var(--color-primary, #B78A41);
}
.attachDownloadBtn:hover {
  background: rgba(183, 138, 65, 0.1);
}

.attachDeleteBtn {
  color: #dc3545;
}
.attachDeleteBtn:hover {
  background: rgba(220, 53, 69, 0.1);
}
</style>
