<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFollowUpsStore } from '@/stores/followUps'
import FollowUpDecisionPanel from './FollowUpDecisionPanel.vue'
import type { FollowUpThread } from '@/types/survey.types'

const props = defineProps<{ thread: FollowUpThread; isAdmin?: boolean }>()

const { t } = useI18n()
const store = useFollowUpsStore()

const replyBody = ref('')
const sending = ref(false)
const messagesEl = ref<HTMLElement | null>(null)

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
  try {
    await store.sendMessage(props.thread.id, replyBody.value.trim())
    replyBody.value = ''
    await nextTick()
    messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
  } finally {
    sending.value = false
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
            <div v-if="msg.is_preset" :class="$style.presetTag">
              <i class="fas fa-bookmark"></i>
              {{ t('followUp.presetMessage') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decision panel: admin sees this when responder has replied -->
    <FollowUpDecisionPanel
      v-if="isAdmin && thread.status === 'replied'"
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
          <div :class="$style.replyFooter">
            <span :class="$style.hint">Ctrl + Enter</span>
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
</style>
