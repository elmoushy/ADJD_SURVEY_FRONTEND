<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RespondentInfo } from '@/types/survey.types'

const props = defineProps<{ respondent?: RespondentInfo }>()
const emit = defineEmits<{ click: [id: number] }>()

const { t } = useI18n()

const tooltip = computed(() => {
  if (props.respondent?.type === 'group_member' && props.respondent.group_name) {
    return t('survey.responses.viaGroup', { name: props.respondent.group_name })
  }
  return ''
})

function onClick() {
  if (props.respondent?.type === 'authenticated') {
    emit('click', props.respondent.id)
  }
}
</script>

<template>
  <div
    v-if="respondent"
    :class="[$style.chip, $style[`chip--${respondent.type}`]]"
    @click="onClick"
    :title="tooltip"
    :role="respondent.type === 'authenticated' ? 'button' : undefined"
    :tabindex="respondent.type === 'authenticated' ? 0 : undefined"
    @keydown.enter="onClick"
  >
    <span :class="$style.avatar">
      <template v-if="respondent.type === 'authenticated'">
        {{ respondent.avatar_initials }}
      </template>
      <template v-else-if="respondent.type === 'group_member'">
        <i class="fas fa-users"></i>
      </template>
      <template v-else>?</template>
    </span>

    <span v-if="respondent.type === 'authenticated'" :class="$style.label">
      {{ respondent.email }}
    </span>
    <span v-else-if="respondent.type === 'group_member'" :class="$style.label">
      {{ t('survey.responses.registeredUser') }}
      <i v-if="respondent.group_name" class="fas fa-info-circle" :class="$style.infoIcon"></i>
    </span>
    <span v-else :class="$style.label">
      {{ t('survey.responses.anonymousUser') }}
    </span>
  </div>
</template>

<style module>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 13px;
  max-width: 220px;
  overflow: hidden;
}

.chip--authenticated {
  background: #e8f4fd;
  color: #1a6fa8;
  cursor: pointer;
}

.chip--authenticated:hover {
  background: #d0e9f8;
}

.chip--group_member {
  background: #f0f0f0;
  color: #555;
}

.chip--anonymous {
  background: #f5f5f5;
  color: #999;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.08);
}

.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}

.infoIcon {
  font-size: 11px;
  opacity: 0.6;
}
</style>
