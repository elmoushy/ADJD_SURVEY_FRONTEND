<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RespondentInfo } from '@/types/survey.types'

const props = defineProps<{ respondent?: RespondentInfo }>()
const emit = defineEmits<{ click: [id: number] }>()

const { t } = useI18n()

const displayName = computed(() => {
  if (props.respondent?.type !== 'authenticated') return ''
  return props.respondent.full_name || props.respondent.name || props.respondent.email
})

const hasDistinctEmail = computed(() => {
  if (props.respondent?.type !== 'authenticated') return false
  const name = props.respondent.full_name || props.respondent.name
  return !!name && name !== props.respondent.email
})

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

    <!-- Authenticated: name + email + groups -->
    <span v-if="respondent.type === 'authenticated'" :class="$style.info">
      <span :class="$style.name">{{ displayName }}</span>
      <span v-if="hasDistinctEmail" :class="$style.email">{{ respondent.email }}</span>
      <span v-if="respondent.groups && respondent.groups.length" :class="$style.groups">
        <span :class="$style.groupTag">{{ respondent.groups[0] }}</span>
      </span>
    </span>

    <!-- Group member -->
    <span v-else-if="respondent.type === 'group_member'" :class="$style.label">
      {{ t('survey.responses.registeredUser') }}
      <i v-if="respondent.group_name" class="fas fa-info-circle" :class="$style.infoIcon"></i>
    </span>

    <!-- Anonymous -->
    <span v-else :class="$style.label">
      {{ t('survey.responses.anonymousUser') }}
    </span>
  </div>
</template>

<style module>
.chip {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 13px;
  max-width: 260px;
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
  align-items: center;
}

.chip--anonymous {
  background: #f5f5f5;
  color: #999;
  align-items: center;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.1);
  margin-top: 1px;
}

/* Column layout for authenticated info */
.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  font-size: 11px;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.groups {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}

.groupTag {
  display: inline-block;
  background: rgba(26, 111, 168, 0.15);
  color: #1a5a8a;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Simple inline label for group_member / anonymous */
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
