<template>
  <div :class="$style.treeWrap" role="tree" :aria-label="t('survey.topics.views.tree')">
    <template v-for="node in flattened" :key="node.id">
      <div
        role="treeitem"
        :aria-expanded="node.children_count > 0 ? expanded.has(node.id) : undefined"
        :aria-level="node.depth + 1"
        :class="[$style.treeRow]"
        :style="{ paddingInlineStart: `${14 + node.depth * 22}px`, '--topic-accent': node.color || undefined }"
        tabindex="0"
        @click="$emit('open', node.id)"
        @keydown="onKeydown($event, node)"
      >
        <button
          v-if="node.children_count > 0 || node.survey_count > 0"
          type="button"
          :class="$style.treeToggle"
          :aria-label="expanded.has(node.id) ? t('survey.topics.actions.collapse') : t('survey.topics.actions.expand')"
          @click.stop="toggle(node)"
        >
          <i :class="['fas', expanded.has(node.id) ? 'fa-chevron-down' : (isRTL ? 'fa-chevron-left' : 'fa-chevron-right')]"></i>
        </button>
        <span v-else :class="$style.treeTogglePlaceholder" aria-hidden="true"></span>

        <i :class="['fas', `fa-${node.icon || 'folder'}`, $style.treeIcon]"></i>
        <span :class="$style.treeLabel">{{ node.name }}</span>
        <span :class="$style.treeCount">
          {{ node.total_survey_count }} {{ t('survey.topics.card.surveys') }}
        </span>
      </div>

      <!-- Surveys inside an expanded topic, fetched lazily -->
      <template v-if="expanded.has(node.id)">
        <div
          v-if="loadingNodes.has(node.id)"
          :class="$style.treeSurveyRow"
          :style="{ paddingInlineStart: `${40 + node.depth * 22}px` }"
        >
          <i class="fas fa-spinner fa-spin"></i>
          <span>{{ t('common.loading') }}</span>
        </div>

        <button
          v-for="survey in surveysByTopic[node.id] || []"
          :key="survey.id"
          type="button"
          :class="$style.treeSurveyRow"
          :style="{ paddingInlineStart: `${40 + node.depth * 22}px` }"
          @click.stop="$emit('open-survey', survey.id)"
        >
          <i class="fas fa-clipboard-list"></i>
          <span :class="$style.treeLabel">{{ survey.title }}</span>
          <span :class="$style.treeCount">{{ survey.response_count }}</span>
        </button>

        <div
          v-if="!loadingNodes.has(node.id) && (surveysByTopic[node.id] || []).length === 0 && node.children_count === 0"
          :class="$style.treeSurveyRow"
          :style="{ paddingInlineStart: `${40 + node.depth * 22}px` }"
        >
          <i class="fas fa-inbox"></i>
          <span>{{ t('survey.topics.empty.surveysInTopic') }}</span>
        </div>
      </template>
    </template>

    <div v-if="!flattened.length" :class="$style.treeSurveyRow">
      <i class="fas fa-folder-open"></i>
      <span>{{ t('survey.topics.empty.topics') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Accessible tree of topics.
 *
 * This is the dependency-free counterpart to the relationship map, and the view the
 * UI falls back to when the forest is larger than the map's node budget or the
 * viewport is too small for a pan/zoom canvas. Full keyboard support: arrows move
 * and expand/collapse, Enter opens.
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/useAppStore'
import { topicService } from '@/services/topicService'
import type { TopicSurveyNode, TopicTreeNode } from '@/types/topic.types'

const props = defineProps<{
  nodes: TopicTreeNode[]
}>()

const emit = defineEmits<{
  open: [topicId: string]
  'open-survey': [surveyId: string]
}>()

const store = useAppStore()
const { currentLanguage } = storeToRefs(store)
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')

const expanded = ref<Set<string>>(new Set())
const loadingNodes = ref<Set<string>>(new Set())
const surveysByTopic = ref<Record<string, TopicSurveyNode[]>>({})

const childrenOf = computed(() => {
  const map = new Map<string | null, TopicTreeNode[]>()
  props.nodes.forEach(node => {
    const key = node.parent || null
    const bucket = map.get(key) || []
    bucket.push(node)
    map.set(key, bucket)
  })
  map.forEach(bucket => bucket.sort((a, b) => a.name.localeCompare(b.name)))
  return map
})

/** Only walk into expanded branches, so a large forest renders lazily. */
const flattened = computed<TopicTreeNode[]>(() => {
  const walk = (parent: string | null): TopicTreeNode[] =>
    (childrenOf.value.get(parent) || []).flatMap(node =>
      expanded.value.has(node.id) ? [node, ...walk(node.id)] : [node]
    )
  return walk(null)
})

const toggle = async (node: TopicTreeNode) => {
  const next = new Set(expanded.value)
  if (next.has(node.id)) {
    next.delete(node.id)
    expanded.value = next
    return
  }
  next.add(node.id)
  expanded.value = next

  if (surveysByTopic.value[node.id] || node.survey_count === 0) return
  const loading = new Set(loadingNodes.value)
  loading.add(node.id)
  loadingNodes.value = loading
  try {
    const data = await topicService.getTopicNodes(node.id)
    surveysByTopic.value = { ...surveysByTopic.value, [node.id]: data.surveys }
  } catch {
    surveysByTopic.value = { ...surveysByTopic.value, [node.id]: [] }
  } finally {
    const done = new Set(loadingNodes.value)
    done.delete(node.id)
    loadingNodes.value = done
  }
}

const onKeydown = (event: KeyboardEvent, node: TopicTreeNode) => {
  const forward = isRTL.value ? 'ArrowLeft' : 'ArrowRight'
  const backward = isRTL.value ? 'ArrowRight' : 'ArrowLeft'
  const rows = Array.from(
    (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="treeitem"]') || []
  )
  const index = rows.indexOf(event.currentTarget as HTMLElement)

  if (event.key === 'Enter') {
    event.preventDefault()
    emit('open', node.id)
  } else if (event.key === forward) {
    event.preventDefault()
    if (!expanded.value.has(node.id)) toggle(node)
  } else if (event.key === backward) {
    event.preventDefault()
    if (expanded.value.has(node.id)) toggle(node)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    rows[index + 1]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    rows[index - 1]?.focus()
  }
}
</script>

<style module src="../../pages/Control/SurveyControl.module.css"></style>
