<template>
  <article
    :class="[
      $style.topicCard,
      $style.dropTarget,
      { [$style.topicCardSelected]: isSelected },
      { [$style.topicCardArchived]: topic.is_archived },
      { [$style.dropActive]: isDropTarget },
    ]"
    :style="{ '--topic-accent': topic.color || undefined }"
    tabindex="0"
    role="button"
    :aria-label="topic.name"
    @click="$emit('open', topic)"
    @keydown.enter.prevent="$emit('open', topic)"
    @keydown.space.prevent="$emit('open', topic)"
    @dragover.prevent="onDragOver"
    @dragleave="isDropTarget = false"
    @drop.prevent="onDrop"
  >
    <span :class="$style.topicAccent" aria-hidden="true"></span>

    <header :class="$style.topicCardHeader">
      <div :class="$style.topicIconTile" aria-hidden="true">
        <i :class="['fas', `fa-${topic.icon || 'folder'}`]"></i>
      </div>

      <div :class="$style.topicHeaderButtons">
        <span v-if="topic.is_archived" :class="$style.archivedBadge">
          <i class="fas fa-box-archive"></i>
          {{ t('survey.topics.card.archived') }}
        </span>

        <button
          v-if="canManage"
          type="button"
          :class="[$style.topicIconButton, { [$style.topicIconButtonActive]: topic.is_pinned }]"
          :title="topic.is_pinned ? t('survey.topics.actions.unpin') : t('survey.topics.actions.pin')"
          :aria-pressed="topic.is_pinned"
          @click.stop="$emit('toggle-pin', topic)"
        >
          <i class="fas fa-thumbtack"></i>
        </button>

        <div v-if="canManage" :class="$style.topicMenuWrap">
          <button
            type="button"
            :class="$style.topicIconButton"
            :title="t('survey.list.actions')"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click.stop="menuOpen = !menuOpen"
          >
            <i class="fas fa-ellipsis-v"></i>
          </button>

          <div v-if="menuOpen" :class="$style.topicMenu" role="menu" @click.stop>
            <button type="button" :class="$style.topicMenuItem" role="menuitem" @click="run('edit')">
              <i class="fas fa-pen"></i>{{ t('survey.topics.actions.edit') }}
            </button>
            <button
              v-if="canAddSubtopic"
              type="button"
              :class="$style.topicMenuItem"
              role="menuitem"
              @click="run('add-subtopic')"
            >
              <i class="fas fa-folder-plus"></i>{{ t('survey.topics.actions.addSubtopic') }}
            </button>
            <button type="button" :class="$style.topicMenuItem" role="menuitem" @click="run('create-survey')">
              <i class="fas fa-plus"></i>{{ t('survey.topics.actions.createSurveyInside') }}
            </button>
            <button type="button" :class="$style.topicMenuItem" role="menuitem" @click="run('archive')">
              <i class="fas fa-box-archive"></i>
              {{ topic.is_archived ? t('survey.topics.actions.unarchive') : t('survey.topics.actions.archive') }}
            </button>
            <button
              v-if="canDelete"
              type="button"
              :class="[$style.topicMenuItem, $style.topicMenuItemDanger]"
              role="menuitem"
              @click="run('delete')"
            >
              <i class="fas fa-trash"></i>{{ t('survey.topics.actions.delete') }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <h3 :class="$style.topicName">{{ topic.name }}</h3>
    <p v-if="topic.description" :class="$style.topicDescription">{{ topic.description }}</p>

    <div :class="$style.cardDivider"></div>

    <div :class="$style.topicMetaChips">
      <span :class="$style.chip">
        <i class="fas fa-clipboard-list" :class="$style.chipIcon"></i>
        {{ topic.survey_count }} {{ t('survey.topics.card.surveys') }}
      </span>
      <span :class="$style.chip">
        <i class="fas fa-circle-check" :class="$style.chipIcon"></i>
        {{ topic.active_survey_count }} {{ t('survey.topics.card.active') }}
      </span>
      <span :class="$style.chip">
        <i class="fas fa-users" :class="$style.chipIcon"></i>
        {{ topic.response_count }} {{ t('survey.card.responses') }}
      </span>
      <span v-if="topic.children_count > 0" :class="$style.chip">
        <i class="fas fa-sitemap" :class="$style.chipIcon"></i>
        {{ topic.children_count }} {{ t('survey.topics.card.subtopics') }}
        <template v-if="topic.total_survey_count !== topic.survey_count">
          · {{ topic.total_survey_count }} {{ t('survey.topics.card.totalWithSub') }}
        </template>
      </span>
    </div>

    <div :class="$style.topicCardFooter">
      <button type="button" :class="[$style.actionButton, $style.primaryAction]" @click.stop="$emit('open', topic)">
        <i class="fas fa-folder-open"></i>
        <span :class="$style.actionButtonText">{{ t('survey.topics.actions.open') }}</span>
      </button>
      <button
        v-if="canManage && !topic.is_archived"
        type="button"
        :class="[$style.actionButton, $style.outlinedAction]"
        @click.stop="$emit('create-survey', topic)"
      >
        <i class="fas fa-plus"></i>
        <span :class="$style.actionButtonText">{{ t('survey.topics.actions.newSurvey') }}</span>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
/**
 * A topic card in the topics grid.
 *
 * Doubles as a drop target: dragging a survey card onto it re-files that survey,
 * which is why the whole article listens for dragover/drop. Keyboard users get the
 * same capability through the picker modal, so drag is never the only path.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useTopicsStore } from '@/stores/useTopicsStore'
import type { SurveyTopic } from '@/types/topic.types'

const props = withDefaults(defineProps<{
  topic: SurveyTopic
  isSelected?: boolean
  canManage?: boolean
  canDelete?: boolean
}>(), {
  isSelected: false,
  canManage: false,
  canDelete: false,
})

const emit = defineEmits<{
  open: [topic: SurveyTopic]
  edit: [topic: SurveyTopic]
  'add-subtopic': [topic: SurveyTopic]
  'create-survey': [topic: SurveyTopic]
  archive: [topic: SurveyTopic]
  delete: [topic: SurveyTopic]
  'toggle-pin': [topic: SurveyTopic]
  'drop-survey': [payload: { topicId: string; surveyId: string }]
}>()

const store = useAppStore()
const topicsStore = useTopicsStore()
const t = store.t

// Nesting is capped server-side (MAX_DEPTH, published via /topics/palette/), so a
// sub-topic must not offer to create another level below itself.
const maxDepth = computed(() => topicsStore.palette?.max_depth ?? 2)
const canAddSubtopic = computed(() => props.topic.depth + 1 < maxDepth.value)

const menuOpen = ref(false)
const isDropTarget = ref(false)

const run = (action: 'edit' | 'add-subtopic' | 'create-survey' | 'archive' | 'delete') => {
  menuOpen.value = false
  emit(action as any, props.topic)
}

const onDragOver = (event: DragEvent) => {
  if (!props.canManage) return
  if (!event.dataTransfer?.types.includes('text/survey-id')) return
  isDropTarget.value = true
  event.dataTransfer.dropEffect = 'move'
}

const onDrop = (event: DragEvent) => {
  isDropTarget.value = false
  if (!props.canManage) return
  const surveyId = event.dataTransfer?.getData('text/survey-id')
  if (surveyId) emit('drop-survey', { topicId: props.topic.id, surveyId })
}

// Close the kebab menu on any outside click
const closeMenu = () => { menuOpen.value = false }
onMounted(() => document.addEventListener('click', closeMenu))
onBeforeUnmount(() => document.removeEventListener('click', closeMenu))
</script>

<style module src="../../pages/Control/SurveyControl.module.css"></style>
