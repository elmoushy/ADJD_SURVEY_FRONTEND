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
            <i class="fas fa-folder-plus" :class="$style.modalTitleIcon"></i>
            {{ isEdit ? t('survey.topics.modal.editTitle') : t('survey.topics.modal.createTitle') }}
          </h2>
          <p :class="$style.modalSubtitle">{{ t('survey.topics.modal.subtitle') }}</p>
        </div>
        <button :class="$style.closeButton" :title="t('common.close')" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div :class="$style.modalBody">
        <!-- Live preview of the card the admin is about to create -->
        <div :class="$style.previewCard">
          <div
            :class="$style.previewTile"
            :style="{ background: `color-mix(in srgb, ${form.color || '#A17D23'} 14%, transparent)`, color: form.color || '#A17D23' }"
          >
            <i :class="['fas', `fa-${form.icon || 'folder'}`]"></i>
          </div>
          <div>
            <div :class="$style.previewName">{{ form.name || t('survey.topics.modal.namePlaceholder') }}</div>
            <div :class="$style.previewDescription">
              {{ form.description || t('survey.topics.modal.descriptionPlaceholder') }}
            </div>
          </div>
        </div>

        <div :class="$style.field">
          <label :class="$style.fieldLabel" for="topic-name">{{ t('survey.topics.modal.name') }} *</label>
          <input
            id="topic-name"
            ref="nameRef"
            type="text"
            :class="$style.textInput"
            :placeholder="t('survey.topics.modal.namePlaceholder')"
            maxlength="255"
            v-model="form.name"
            @input="onNameInput"
          />
          <span v-if="nameError" :class="$style.fieldError">
            <i class="fas fa-exclamation-circle"></i>{{ nameError }}
          </span>
        </div>

        <div :class="$style.field">
          <label :class="$style.fieldLabel" for="topic-description">{{ t('survey.topics.modal.description') }}</label>
          <textarea
            id="topic-description"
            :class="$style.textArea"
            :placeholder="t('survey.topics.modal.descriptionPlaceholder')"
            maxlength="500"
            rows="3"
            v-model="form.description"
          ></textarea>
          <span :class="$style.fieldHint">{{ form.description.length }} / 500</span>
        </div>

        <div :class="$style.field">
          <label :class="$style.fieldLabel" for="topic-parent">{{ t('survey.topics.modal.parent') }}</label>
          <select id="topic-parent" :class="$style.select" v-model="form.parent">
            <option :value="null">{{ t('survey.topics.modal.noParent') }}</option>
            <option
              v-for="option in parentOptions"
              :key="option.id"
              :value="option.id"
              :disabled="option.disabled"
            >
              {{ option.label }}{{ option.disabled ? ` — ${t('survey.topics.modal.depthLimit')}` : '' }}
            </option>
          </select>
          <span :class="$style.fieldHint">{{ parentHint }}</span>
        </div>

        <div :class="$style.field">
          <span :class="$style.fieldLabel">{{ t('survey.topics.modal.color') }}</span>
          <div :class="$style.swatchRow">
            <button
              v-for="color in palette?.colors || []"
              :key="color"
              type="button"
              :class="[$style.swatch, { [$style.swatchActive]: form.color === color }]"
              :style="{ background: color }"
              :aria-label="color"
              :aria-pressed="form.color === color"
              @click="form.color = color"
            ></button>
          </div>
        </div>

        <div :class="$style.field">
          <span :class="$style.fieldLabel">{{ t('survey.topics.modal.icon') }}</span>
          <div :class="$style.iconGrid">
            <button
              v-for="icon in palette?.icons || []"
              :key="icon"
              type="button"
              :class="[$style.iconOption, { [$style.iconOptionActive]: form.icon === icon }]"
              :aria-label="icon"
              :aria-pressed="form.icon === icon"
              @click="form.icon = icon"
            >
              <i :class="['fas', `fa-${icon}`]"></i>
            </button>
          </div>
        </div>

        <div :class="$style.field">
          <label :class="$style.fieldLabel" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
            <input type="checkbox" v-model="form.is_pinned" />
            {{ t('survey.topics.modal.pin') }}
          </label>
          <span :class="$style.fieldHint">{{ t('survey.topics.modal.pinHint') }}</span>
        </div>

        <div v-if="submitError" :class="$style.fieldError">
          <i class="fas fa-exclamation-triangle"></i>{{ submitError }}
        </div>
      </div>

      <div :class="$style.modalFooter">
        <button type="button" :class="$style.ghostButton" @click="$emit('close')">{{ t('common.cancel') }}</button>
        <button type="button" :class="$style.primaryButton" :disabled="!canSubmit || saving" @click="submit">
          <i class="fas fa-check"></i>
          {{ saving ? t('common.saving') : (isEdit ? t('common.saveChanges') : t('survey.topics.actions.create')) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Create / edit a topic.
 *
 * Colour and icon options come from the server (`/topics/palette/`) so the UI can
 * never offer a value the API would reject, and parent options that already sit at
 * the maximum nesting depth — or inside this topic's own subtree — are disabled
 * rather than silently failing on save.
 */
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/useAppStore'
import { useTopicsStore } from '@/stores/useTopicsStore'
import type { SurveyTopic, TopicTreeNode } from '@/types/topic.types'

const props = withDefaults(defineProps<{
  topic?: SurveyTopic | null
  /** Pre-selected parent when creating a sub-topic from a card. */
  defaultParent?: string | null
}>(), {
  topic: null,
  defaultParent: null,
})

const emit = defineEmits<{
  saved: [topic: SurveyTopic]
  close: []
}>()

const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const topicsStore = useTopicsStore()
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')

const isEdit = computed(() => !!props.topic?.id)
const nameRef = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const nameError = ref('')
const submitError = ref('')

const form = reactive({
  name: props.topic?.name || '',
  description: props.topic?.description || '',
  color: props.topic?.color || '#A17D23',
  icon: props.topic?.icon || 'folder',
  parent: (props.topic?.parent ?? props.defaultParent) || null as string | null,
  is_pinned: props.topic?.is_pinned || false,
})

const palette = computed(() => topicsStore.palette)
const maxDepth = computed(() => palette.value?.max_depth ?? 3)
const nodes = computed<TopicTreeNode[]>(() => topicsStore.tree as TopicTreeNode[])

/** Height of this topic's subtree, so a move cannot push descendants past the cap. */
const subtreeHeight = computed(() => {
  if (!props.topic) return 0
  const self = nodes.value.find(n => n.id === props.topic?.id)
  if (!self) return 0
  const deepest = nodes.value
    .filter(n => n.path.startsWith(`${self.path}.`))
    .reduce((max, n) => Math.max(max, n.depth), self.depth)
  return deepest - self.depth
})

const parentOptions = computed(() => {
  const byParent = new Map<string | null, TopicTreeNode[]>()
  nodes.value.forEach(node => {
    const key = node.parent || null
    const bucket = byParent.get(key) || []
    bucket.push(node)
    byParent.set(key, bucket)
  })

  const walk = (parent: string | null, prefix: string): Array<{ id: string; label: string; disabled: boolean }> =>
    (byParent.get(parent) || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap(node => {
        const label = prefix ? `${prefix} / ${node.name}` : node.name
        const self = props.topic?.id === node.id
        const inOwnSubtree = !!props.topic && nodes.value.some(
          n => n.id === props.topic?.id && node.path.startsWith(`${n.path}.`)
        )
        const tooDeep = node.depth + 1 + subtreeHeight.value >= maxDepth.value
        return [
          { id: node.id, label, disabled: self || inOwnSubtree || tooDeep || node.is_archived },
          ...walk(node.id, label),
        ]
      })

  return walk(null, '')
})

const canSubmit = computed(() => form.name.trim().length > 0 && !nameError.value)

const parentHint = computed(() => t('survey.topics.modal.parentHint'))

let duplicateTimer: ReturnType<typeof setTimeout> | null = null
const onNameInput = () => {
  nameError.value = ''
  if (duplicateTimer) clearTimeout(duplicateTimer)
  duplicateTimer = setTimeout(() => {
    const key = form.name.trim().toLowerCase()
    if (!key) return
    // Local check against the cached forest — the server enforces this too, this is
    // only here so the admin finds out before pressing save.
    const clash = nodes.value.find(
      node => node.name.trim().toLowerCase() === key && node.id !== props.topic?.id
    )
    if (clash) nameError.value = t('survey.topics.modal.duplicateName')
  }, 300)
}

const submit = async () => {
  if (!canSubmit.value) return
  saving.value = true
  submitError.value = ''
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      icon: form.icon,
      parent: form.parent,
      is_pinned: form.is_pinned,
    }
    const topic = isEdit.value && props.topic
      ? await topicsStore.updateTopic(props.topic.id, payload)
      : await topicsStore.createTopic(payload)
    await topicsStore.fetchTree(true)
    emit('saved', topic)
  } catch (error: any) {
    submitError.value = error?.message || t('survey.topics.errors.saveFailed')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([topicsStore.fetchPalette(), topicsStore.fetchTree()])
  await nextTick()
  nameRef.value?.focus()
})
</script>

<style module src="./TopicModals.module.css"></style>
