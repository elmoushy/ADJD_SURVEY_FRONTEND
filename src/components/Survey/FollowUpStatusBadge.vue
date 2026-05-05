<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FollowUpStatus } from '@/types/survey.types'

const props = defineProps<{ status: FollowUpStatus; large?: boolean }>()

const { t } = useI18n()

const config = computed(() => {
  const map: Record<FollowUpStatus, { color: string; icon: string }> = {
    pending_reply: { color: '#f59e0b', icon: 'fas fa-clock' },
    replied:       { color: '#3b82f6', icon: 'fas fa-reply' },
    accepted:      { color: '#10b981', icon: 'fas fa-check-circle' },
    rejected:      { color: '#ef4444', icon: 'fas fa-times-circle' },
    closed:        { color: '#9ca3af', icon: 'fas fa-lock' },
  }
  return map[props.status] ?? { color: '#9ca3af', icon: 'fas fa-circle' }
})
</script>

<template>
  <span
    :class="[$style.badge, large && $style.large]"
    :style="{ background: config.color + '22', color: config.color, border: `1px solid ${config.color}55` }"
  >
    <i :class="config.icon"></i>
    {{ t(`followUp.status.${status}`) }}
  </span>
</template>

<style module>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.large {
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 16px;
  gap: 7px;
}
</style>
