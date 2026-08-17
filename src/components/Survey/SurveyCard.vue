<template>
  <div
    :class="[$style.surveyCard, { [$style.selected]: isSelected }]"
    :aria-pressed="isSelected"
    :draggable="draggable"
    @click="$emit('toggle-select', survey.id)"
    @dragstart="onDragStart"
    @dragend="$emit('drag-end')"
  >
    <div :class="$style.cardHeader">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="44" height="44" rx="22" fill="#F5F7FA" />
        <path
          d="M13 20C13 16.2288 13 14.3431 14.1716 13.1716C15.3431 12 17.2288 12 21 12H23C26.7712 12 28.6569 12 29.8284 13.1716C31 14.3431 31 16.2288 31 20V24C31 27.7712 31 29.6569 29.8284 30.8284C28.6569 32 26.7712 32 23 32H21C17.2288 32 15.3431 32 14.1716 30.8284C13 29.6569 13 27.7712 13 24V20Z"
          stroke="#A17D23"
          stroke-width="1.5"
        />
        <path d="M18 20H26" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" />
        <path d="M18 24H23" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" />
      </svg>

      <div :class="$style.cardStatus">
        <span :class="[$style.statusBadge, $style[survey.is_active ? 'active' : 'inactive']]">
          {{ survey.is_active ? t('survey.status.active') : t('survey.status.inactive') }}
        </span>
        <span v-if="survey.status === 'draft'" :class="[$style.statusBadge, $style.draft]">
          {{ t('survey.status.draft') }}
        </span>
        <span v-else :class="[$style.statusBadge, $style.private]">
          {{ t('survey.status.private') }}
        </span>
      </div>
    </div>

    <div :class="$style.cardContent">
      <!-- Topic chip: which folder this survey lives in -->
      <button
        v-if="survey.topic && survey.topic_name && showTopicChip"
        type="button"
        :class="[$style.chip, $style.topicChip]"
        :style="topicChipStyle"
        :title="t('survey.topics.card.openTopic')"
        @click.stop="$emit('open-topic', survey.topic as string)"
      >
        <i :class="['fas', `fa-${survey.topic_icon || 'folder'}`, $style.chipIcon]"></i>
        <span :class="$style.topicChipText">{{ survey.topic_name }}</span>
      </button>

      <h3 :class="$style.cardTitle" :title="survey.title">{{ survey.title }}</h3>
      <p :class="$style.cardDescription" :title="survey.description">{{ survey.description }}</p>
    </div>

    <div :class="$style.cardDivider"></div>

    <div :class="$style.cardChips">
      <div :class="$style.chip">
        <i class="fas fa-users" :class="$style.chipIcon"></i>
        <span>{{ survey.response_count }} {{ t('survey.card.responses') }}</span>
      </div>
      <div :class="$style.chip">
        <i class="fas fa-question-circle" :class="$style.chipIcon"></i>
        <span>{{ survey.questions?.length || 0 }} {{ t('survey.questions.title').toLowerCase() }}</span>
      </div>
      <div :class="$style.chip">
        <i class="fas fa-calendar-alt" :class="$style.chipIcon"></i>
        <span>{{ formatDate(survey.updated_at, survey.created_at) }}</span>
      </div>
      <div :class="$style.chip">
        <i class="fas fa-user" :class="$style.chipIcon"></i>
        <span>{{ t('survey.card.createdBy') }}: {{ creatorDisplayName }}</span>
      </div>
    </div>

    <div :class="$style.cardActions">
      <button
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('preview', survey)"
        :title="t('survey.topics.actions.previewQuestions')"
      >
        <i class="fas fa-eye"></i>
        <span :class="$style.actionButtonText">{{ t('survey.card.preview') }}</span>
      </button>

      <button
        v-if="canSendReminder"
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('remind', survey)"
        :title="t('survey.topics.actions.reminderHint')"
      >
        <i class="fas fa-bell"></i>
        <span :class="$style.actionButtonText">{{ t('survey.card.reminder') }}</span>
      </button>

      <button
        v-if="survey.status === 'draft'"
        :class="[$style.actionButton, $style.primaryAction]"
        @click.stop="$emit('submit-draft', survey.id)"
        :title="t('survey.card.submit')"
      >
        <i class="fas fa-paper-plane"></i>
        <span :class="$style.actionButtonText">{{ t('survey.card.submit') }}</span>
      </button>

      <button
        v-if="survey.status !== 'draft'"
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('view-responses', survey.id)"
        :title="t('survey.card.viewResponses')"
      >
        <i class="fas fa-eye"></i>
        <span :class="$style.actionButtonText">{{ t('survey.card.viewResponses') }}</span>
      </button>

      <button
        v-if="survey.status === 'draft'"
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('edit', survey)"
        :title="t('survey.card.editor')"
      >
        <i class="fas fa-pen"></i>
        <span :class="$style.actionButtonText">{{ t('survey.card.editor') }}</span>
      </button>

      <button
        v-if="showManageAccess"
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('manage-access', survey)"
        :title="t('survey.card.manageAccess')"
      >
        <i class="fas fa-share-alt"></i>
        <span :class="$style.actionButtonText">{{ t('survey.card.manageAccess') }}</span>
      </button>

      <button
        v-if="survey.visibility === 'PUBLIC' && survey.status !== 'draft'"
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('share-link', survey)"
        :title="t('survey.card.shareLink')"
      >
        <i class="fas fa-link"></i>
        <span :class="$style.actionButtonText">{{ t('survey.card.shareLink') }}</span>
      </button>

      <!-- Topic actions -->
      <button
        v-if="canManageTopics && !survey.topic"
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('assign-topic', survey)"
        :title="t('survey.topics.actions.assignHint')"
      >
        <i class="fas fa-folder-plus"></i>
        <span :class="$style.actionButtonText">{{ t('survey.topics.actions.addToTopic') }}</span>
      </button>

      <button
        v-if="canManageTopics && survey.topic && showRemoveFromTopic"
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('remove-from-topic', survey)"
        :title="t('survey.topics.actions.removeHint')"
      >
        <i class="fas fa-folder-minus"></i>
        <span :class="$style.actionButtonText">{{ t('survey.topics.actions.removeFromTopic') }}</span>
      </button>

      <button
        v-if="canDelete"
        :class="[$style.actionButton, $style.dangerAction]"
        @click.stop="$emit('delete', survey.id)"
        :title="t('survey.card.delete')"
      >
        <i class="fas fa-trash"></i>
        <span :class="$style.actionButtonText">{{ t('survey.card.delete') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * One survey card.
 *
 * Extracted from SurveyControl.vue so the identical card renders in the
 * "Ungrouped" tab, the "All" tab and inside a topic page. It intentionally keeps
 * using the shared SurveyControl.module.css: the night-theme rules there are
 * written as `.surveyPanel[data-theme="night"] .surveyCard`, so importing the same
 * stylesheet keeps the class names (and therefore the theming) identical.
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/useAppStore'
import type { Survey } from '@/types/survey.types'

const props = withDefaults(defineProps<{
  survey: Survey
  isSelected?: boolean
  canDelete?: boolean
  canManageTopics?: boolean
  canSendReminder?: boolean
  showRemoveFromTopic?: boolean
  showTopicChip?: boolean
  draggable?: boolean
}>(), {
  isSelected: false,
  canDelete: false,
  canManageTopics: false,
  canSendReminder: false,
  showRemoveFromTopic: false,
  showTopicChip: true,
  draggable: false,
})

const emit = defineEmits<{
  'toggle-select': [surveyId: string]
  preview: [survey: Survey]
  remind: [survey: Survey]
  'submit-draft': [surveyId: string]
  'view-responses': [surveyId: string]
  edit: [survey: Survey]
  'manage-access': [survey: Survey]
  'share-link': [survey: Survey]
  'assign-topic': [survey: Survey]
  'remove-from-topic': [survey: Survey]
  'open-topic': [topicId: string]
  delete: [surveyId: string]
  'drag-start': [survey: Survey]
  'drag-end': []
}>()

const store = useAppStore()
const { currentLanguage } = storeToRefs(store)
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')

// Mirrors the original card logic: access management is offered for submitted
// surveys without responses, and for anything that is neither draft nor submitted.
const showManageAccess = computed(() => {
  const s = props.survey
  if (s.status === 'submitted') return s.response_count === 0
  return s.status !== 'draft'
})

const topicChipStyle = computed(() => {
  const color = props.survey.topic_color
  if (!color) return undefined
  return {
    background: `color-mix(in srgb, ${color} 14%, transparent)`,
    color,
  }
})

const creatorDisplayName = computed(() => {
  const email = props.survey.creator_email
  if (email) return email
  return isRTL.value ? 'هذا الشخص لم يعد متاح' : 'This person is no longer available'
})

const formatDate = (dateString?: string | null, fallbackDate?: string | null) => {
  const dateToUse = dateString || fallbackDate
  if (!dateToUse) return isRTL.value ? 'تاريخ غير متاح' : 'Date not available'
  const date = new Date(dateToUse)
  if (isNaN(date.getTime())) return isRTL.value ? 'تاريخ غير صحيح' : 'Invalid date'
  const locale = isRTL.value ? 'ar-SA' : 'en-US'
  return date.toLocaleDateString(locale, { calendar: 'gregory' })
}

const onDragStart = (event: DragEvent) => {
  if (!props.draggable) return
  event.dataTransfer?.setData('text/survey-id', props.survey.id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  emit('drag-start', props.survey)
}
</script>

<style module src="../../pages/Control/SurveyControl.module.css"></style>
