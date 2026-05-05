<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFollowUpsStore } from '@/stores/followUps'

const props = defineProps<{ threadId: string }>()

const { t } = useI18n()
const store = useFollowUpsStore()

const reason = ref('')
const loading = ref(false)
const confirming = ref<'accepted' | 'rejected' | null>(null)

function promptDecide(decision: 'accepted' | 'rejected') {
  confirming.value = decision
}

function cancelDecide() {
  confirming.value = null
}

async function confirmDecide() {
  if (!confirming.value || loading.value) return
  loading.value = true
  try {
    await store.decide(props.threadId, confirming.value, reason.value)
    confirming.value = null
    reason.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div :class="$style.panel">

    <!-- Header -->
    <div :class="$style.header">
      <div :class="$style.headerIcon">
        <i class="fas fa-gavel"></i>
      </div>
      <div>
        <p :class="$style.headerTitle">{{ t('followUp.decisionTitle') }}</p>
        <p :class="$style.headerHint">{{ t('followUp.decisionHint') }}</p>
      </div>
    </div>

    <!-- Confirm state -->
    <template v-if="confirming">
      <div :class="[$style.confirmBox, confirming === 'accepted' ? $style.confirmAccept : $style.confirmReject]">
        <i :class="confirming === 'accepted' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
        <span>
          {{ confirming === 'accepted' ? t('followUp.decision.accept') : t('followUp.decision.reject') }}
        </span>
      </div>

      <textarea
        v-model="reason"
        :class="$style.reasonInput"
        :placeholder="t('followUp.decision.reasonPlaceholder')"
        rows="2"
        dir="rtl"
      ></textarea>

      <div :class="$style.confirmActions">
        <button :class="$style.cancelBtn" :disabled="loading" @click="cancelDecide">
          {{ t('common.cancel') }}
        </button>
        <button
          :class="[$style.confirmBtn, confirming === 'accepted' ? $style.confirmBtnAccept : $style.confirmBtnReject]"
          :disabled="loading"
          @click="confirmDecide"
        >
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
          {{ confirming === 'accepted' ? t('followUp.decision.accept') : t('followUp.decision.reject') }}
        </button>
      </div>
    </template>

    <!-- Action buttons -->
    <div v-else :class="$style.actions">
      <button :class="[$style.actionBtn, $style.rejectBtn]" @click="promptDecide('rejected')">
        <i class="fas fa-times-circle"></i>
        {{ t('followUp.decision.reject') }}
      </button>
      <button :class="[$style.actionBtn, $style.acceptBtn]" @click="promptDecide('accepted')">
        <i class="fas fa-check-circle"></i>
        {{ t('followUp.decision.accept') }}
      </button>
    </div>

  </div>
</template>

<style module>
.panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0 20px 16px;
}

/* Header */
.header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.headerIcon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 15px;
  flex-shrink: 0;
}

.headerTitle {
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.headerHint {
  margin: 0;
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.5;
}

/* Action buttons row */
.actions {
  display: flex;
  gap: 10px;
}

.actionBtn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1.5px solid transparent;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.rejectBtn {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}
.rejectBtn:hover {
  background: #ffe4e6;
  border-color: #fb7185;
}

.acceptBtn {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}
.acceptBtn:hover {
  background: #dcfce7;
  border-color: #86efac;
}

/* Confirm box */
.confirmBox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

.confirmAccept {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #86efac;
}

.confirmReject {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fca5a5;
}

/* Reason textarea */
.reasonInput {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  padding: 10px 12px;
  font-size: 13px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.reasonInput:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
}

/* Confirm action row */
.confirmActions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancelBtn {
  padding: 8px 18px;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.15s;
}
.cancelBtn:hover:not(:disabled) { background: #f9fafb; }
.cancelBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.confirmBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.confirmBtn:disabled { opacity: 0.6; cursor: not-allowed; }

.confirmBtnAccept { background: #16a34a; color: #fff; }
.confirmBtnAccept:hover:not(:disabled) { background: #15803d; }

.confirmBtnReject { background: #dc2626; color: #fff; }
.confirmBtnReject:hover:not(:disabled) { background: #b91c1c; }
</style>
