<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FollowUpThread } from '@/types/survey.types'

const props = defineProps<{ thread: FollowUpThread }>()
const { t } = useI18n()

function formatTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ar-AE', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const steps = computed(() => [
  {
    key: 'opened',
    label: t('followUp.timeline.opened'),
    time: props.thread.created_at,
    actor: props.thread.opened_by,
    icon: 'fas fa-envelope-open-text',
    done: true,
    color: '#1a6fa8',
  },
  {
    key: 'replied',
    label: t('followUp.timeline.replied'),
    time: props.thread.status !== 'pending_reply' ? props.thread.updated_at : null,
    actor: null,
    icon: 'fas fa-reply',
    done: props.thread.status !== 'pending_reply',
    color: '#7c3aed',
  },
  {
    key: 'decided',
    label: t('followUp.timeline.decided'),
    time: props.thread.decided_at,
    actor: props.thread.decided_by,
    icon: props.thread.status === 'accepted' ? 'fas fa-check-circle' : props.thread.status === 'rejected' ? 'fas fa-times-circle' : 'fas fa-gavel',
    done: !!props.thread.decided_at,
    color: props.thread.status === 'accepted' ? '#10b981' : props.thread.status === 'rejected' ? '#ef4444' : '#6b7280',
  },
])
</script>

<template>
  <ol :class="$style.timeline">
    <li
      v-for="(step, i) in steps"
      :key="step.key"
      :class="[$style.step, step.done && $style.done]"
    >
      <!-- Connector line (not on last) -->
      <div v-if="i < steps.length - 1" :class="[$style.line, step.done && $style.lineDone]"></div>

      <!-- Icon dot -->
      <div
        :class="[$style.dot, step.done && $style.dotDone]"
        :style="step.done ? { background: step.color, borderColor: step.color } : {}"
      >
        <i :class="step.icon" :style="step.done ? { color: '#fff' } : {}"></i>
      </div>

      <!-- Content -->
      <div :class="$style.content">
        <span :class="$style.stepLabel">{{ step.label }}</span>
        <span v-if="step.actor" :class="$style.actor">{{ step.actor }}</span>
        <span v-if="step.time" :class="$style.stepTime">{{ formatTime(step.time) }}</span>
        <span v-else :class="$style.pending">{{ t('followUp.pending') }}</span>
      </div>
    </li>
  </ol>
</template>

<style module>
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  padding-bottom: 20px;
  opacity: 0.45;
}
.step.done { opacity: 1; }
.step:last-child { padding-bottom: 0; }

/* Vertical connector line */
.line {
  position: absolute;
  right: 15px;
  top: 30px;
  width: 2px;
  height: calc(100% - 10px);
  background: #e5e7eb;
}
.lineDone { background: #d1d5db; }

/* Icon dot */
.dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
  z-index: 1;
  transition: background 0.2s, border-color 0.2s;
}
.dotDone { box-shadow: 0 0 0 3px rgba(26,111,168,0.12); }

/* Content */
.content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 5px;
}

.stepLabel {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.actor {
  font-size: 11px;
  color: #6b7280;
}

.stepTime {
  font-size: 11px;
  color: #9ca3af;
}

.pending {
  font-size: 11px;
  color: #d1d5db;
  font-style: italic;
}
</style>
