<template>
  <div :class="$style.modalOverlay" @click="$emit('close')">
    <div
      :class="$style.modalContainer"
      :data-theme="currentTheme"
      :dir="isRTL ? 'rtl' : 'ltr'"
      role="dialog"
      aria-modal="true"
      @click.stop
    >
      <div :class="$style.modalHeader">
        <div>
          <h2 :class="$style.modalTitle">
            <i class="fas fa-folder-tree" :class="$style.modalTitleIcon"></i>
            {{ title || t('survey.topics.picker.title') }}
          </h2>
          <p :class="$style.modalSubtitle">{{ t('survey.topics.picker.subtitle') }}</p>
        </div>
        <button :class="$style.closeButton" :title="t('common.close')" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div :class="$style.modalBody">
        <div :class="$style.field">
          <input
            ref="searchRef"
            type="text"
            :class="$style.textInput"
            :placeholder="t('survey.topics.picker.searchPlaceholder')"
            v-model="search"
          />
        </div>

        <div v-if="loading" :class="$style.spinnerRow"><div :class="$style.spinner"></div></div>

        <div v-else :class="$style.pickerList" role="listbox">
          <!-- "No topic" is always offered: it is how a survey gets ungrouped -->
          <button
            type="button"
            :class="[$style.pickerRow, { [$style.pickerRowActive]: currentTopicId === null && selected === null }]"
            role="option"
            :aria-selected="selected === null"
            @click="choose(null)"
          >
            <i class="fas fa-inbox" :class="$style.pickerIcon"></i>
            <span :class="$style.pickerLabel">
              <span :class="$style.pickerName">{{ t('survey.topics.picker.noTopic') }}</span>
              <span :class="$style.pickerPath">{{ t('survey.topics.picker.noTopicHint') }}</span>
            </span>
          </button>

          <button
            v-for="node in visibleNodes"
            :key="node.id"
            type="button"
            :class="[
              $style.pickerRow,
              { [$style.pickerRowActive]: node.id === currentTopicId },
              { [$style.pickerRowDisabled]: isDisabled(node) },
            ]"
            :style="{ paddingInlineStart: `${14 + node.depth * 18}px` }"
            :disabled="isDisabled(node)"
            role="option"
            :aria-selected="node.id === currentTopicId"
            @click="choose(node.id)"
          >
            <i :class="['fas', `fa-${node.icon || 'folder'}`, $style.pickerIcon]" :style="{ color: node.color || undefined }"></i>
            <span :class="$style.pickerLabel">
              <span :class="$style.pickerName">{{ node.name }}</span>
              <span v-if="pathLabel(node)" :class="$style.pickerPath">{{ pathLabel(node) }}</span>
            </span>
            <span :class="$style.pickerCount">{{ node.total_survey_count }}</span>
          </button>

          <div v-if="!visibleNodes.length" :class="$style.emptyRow">
            {{ search ? t('survey.topics.empty.noMatches') : t('survey.topics.empty.topics') }}
          </div>
        </div>

        <!-- Inline creation, so an admin never has to leave the flow -->
        <div v-if="canManageTopics && showCreateRow" :class="$style.field">
          <label :class="$style.fieldLabel" for="topic-picker-new">{{ t('survey.topics.picker.createNew') }}</label>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input
              id="topic-picker-new"
              type="text"
              :class="$style.textInput"
              style="flex:1; min-width:200px;"
              :placeholder="t('survey.topics.modal.namePlaceholder')"
              v-model="newTopicName"
              @keyup.enter="createTopic"
            />
            <button
              type="button"
              :class="$style.primaryButton"
              :disabled="!newTopicName.trim() || creating"
              @click="createTopic"
            >
              <i class="fas fa-plus"></i>
              {{ t('survey.topics.actions.create') }}
            </button>
          </div>
          <span v-if="createError" :class="$style.fieldError">
            <i class="fas fa-exclamation-circle"></i>{{ createError }}
          </span>
        </div>
      </div>

      <div :class="$style.modalFooter">
        <button
          v-if="canManageTopics && !showCreateRow"
          type="button"
          :class="[$style.ghostButton, $style.footerSpacer]"
          @click="showCreateRow = true"
        >
          <i class="fas fa-plus"></i>
          {{ t('survey.topics.picker.createNew') }}
        </button>
        <button type="button" :class="$style.ghostButton" @click="$emit('close')">
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Single-select topic picker, reused by:
 *   - the bulk "add to topic" action in the survey list
 *   - the per-card topic action
 *   - the topic button in the survey editor
 *   - the "move to another topic" flow on topic cards
 *
 * Selecting a topic emits it immediately (single-select), and "no topic" is a
 * first-class option so ungrouping is never a hidden gesture. Admins can create a
 * topic inline instead of leaving the flow.
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/useAppStore'
import { useSimpleAuth } from '@/composables/useSimpleAuth'
import { useTopicsStore } from '@/stores/useTopicsStore'
import type { TopicTreeNode } from '@/types/topic.types'

const props = withDefaults(defineProps<{
  title?: string
  currentTopicId?: string | null
  /** Topic being moved: itself and its descendants cannot be its own parent. */
  excludeSubtreeOf?: string | null
  /** Disable topics that already sit at the maximum nesting depth. */
  enforceParentDepth?: boolean
}>(), {
  title: '',
  currentTopicId: null,
  excludeSubtreeOf: null,
  enforceParentDepth: false,
})

const emit = defineEmits<{
  select: [topicId: string | null]
  close: []
}>()

const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const { user: authUser } = useSimpleAuth()
const topicsStore = useTopicsStore()
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')
const canManageTopics = computed(() => ['super_admin', 'admin'].includes(authUser.value?.role || ''))

const search = ref('')
const searchRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const selected = ref<string | null | undefined>(undefined)
const showCreateRow = ref(false)
const newTopicName = ref('')
const creating = ref(false)
const createError = ref('')

const maxDepth = computed(() => topicsStore.palette?.max_depth ?? 3)

const nodes = computed<TopicTreeNode[]>(() => topicsStore.tree as TopicTreeNode[])

/** Depth-first order so children read under their parent. */
const orderedNodes = computed<TopicTreeNode[]>(() => {
  const byParent = new Map<string | null, TopicTreeNode[]>()
  nodes.value.forEach(node => {
    const key = node.parent || null
    const bucket = byParent.get(key) || []
    bucket.push(node)
    byParent.set(key, bucket)
  })
  const walk = (parent: string | null): TopicTreeNode[] =>
    (byParent.get(parent) || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap(node => [node, ...walk(node.id)])
  return walk(null)
})

const visibleNodes = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return orderedNodes.value
  return orderedNodes.value.filter(node => node.name.toLowerCase().includes(term))
})

const nameById = computed(() => {
  const map = new Map<string, string>()
  nodes.value.forEach(node => map.set(node.id, node.name))
  return map
})

/** Breadcrumb-ish hint so two same-named nested topics stay distinguishable. */
const pathLabel = (node: TopicTreeNode) => {
  if (!node.path || !node.path.includes('.')) return ''
  const hexes = node.path.split('.').slice(0, -1)
  const names = hexes
    .map(hex => {
      const match = nodes.value.find(n => n.id.replace(/-/g, '') === hex)
      return match ? nameById.value.get(match.id) : null
    })
    .filter(Boolean)
  return names.join(' / ')
}

const isDisabled = (node: TopicTreeNode) => {
  if (node.is_archived) return true
  if (props.excludeSubtreeOf) {
    if (node.id === props.excludeSubtreeOf) return true
    const excluded = nodes.value.find(n => n.id === props.excludeSubtreeOf)
    if (excluded && node.path.startsWith(`${excluded.path}.`)) return true
  }
  if (props.enforceParentDepth && node.depth + 1 >= maxDepth.value) return true
  return false
}

const choose = (topicId: string | null) => {
  selected.value = topicId
  emit('select', topicId)
}

const createTopic = async () => {
  const name = newTopicName.value.trim()
  if (!name) return
  creating.value = true
  createError.value = ''
  try {
    const topic = await topicsStore.createTopic({ name })
    await topicsStore.fetchTree(true)
    choose(topic.id)
  } catch (error: any) {
    createError.value = error?.message || t('survey.topics.errors.createFailed')
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([topicsStore.fetchTree(), topicsStore.fetchPalette()])
  } finally {
    loading.value = false
    await nextTick()
    searchRef.value?.focus()
  }
})
</script>

<style module src="./TopicModals.module.css"></style>
