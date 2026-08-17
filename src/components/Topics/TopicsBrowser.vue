<template>
  <section :class="$style.surveysSection">
    <!-- Controls: search + sort + view toggle -->
    <section :class="$style.controlsSection">
      <div :class="$style.filtersGroup">
        <input
          type="text"
          :class="$style.searchInput"
          :placeholder="t('survey.topics.searchPlaceholder')"
          v-model="search"
          @input="onSearch"
        />

        <select :class="$style.filterSelect" v-model="sortBy" @change="reload(true)">
          <option value="name_asc">{{ t('survey.topics.sorting.nameAsc') }}</option>
          <option value="name_desc">{{ t('survey.topics.sorting.nameDesc') }}</option>
          <option value="newest">{{ t('survey.sorting.newest') }}</option>
          <option value="oldest">{{ t('survey.sorting.oldest') }}</option>
          <option value="most_surveys">{{ t('survey.topics.sorting.mostSurveys') }}</option>
          <option value="most_responses">{{ t('survey.sorting.mostResponses') }}</option>
        </select>

        <select :class="$style.filterSelect" v-model="archivedFilter" @change="reload(true)">
          <option value="0">{{ t('survey.topics.filters.activeTopics') }}</option>
          <option value="1">{{ t('survey.topics.filters.archivedTopics') }}</option>
          <option value="all">{{ t('survey.topics.filters.allTopics') }}</option>
        </select>
      </div>

      <div :class="$style.viewControls">
        <div :class="$style.viewToggle" role="tablist" :aria-label="t('survey.topics.views.label')">
          <button
            v-for="option in viewOptions"
            :key="option.value"
            type="button"
            role="tab"
            :aria-selected="view === option.value"
            :class="[$style.viewToggleButton, { [$style.viewToggleActive]: view === option.value }]"
            @click="setView(option.value)"
          >
            <i :class="['fas', option.icon]"></i>
            <span>{{ option.label }}</span>
          </button>
        </div>

        <button :class="$style.secondaryButton" @click="reload(false)">
          <i class="fas fa-sync-alt"></i>
          {{ t('survey.list.refreshData') }}
        </button>
      </div>
    </section>

    <div v-if="error" :class="$style.inlineError" role="alert">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Grid -->
    <template v-if="view === 'grid'">
      <div v-if="loading" :class="$style.skeletonGrid" aria-hidden="true">
        <div v-for="n in 6" :key="n" :class="$style.skeletonCard"></div>
      </div>

      <template v-else>
        <div v-if="topics.length" :class="$style.topicsGrid">
          <TopicCard
            v-for="topic in topics"
            :key="topic.id"
            :topic="topic"
            :can-manage="canManage"
            :can-delete="isSuperAdmin"
            @open="openTopic"
            @edit="editTopic"
            @add-subtopic="addSubtopic"
            @create-survey="createSurveyInTopic"
            @archive="toggleArchive"
            @delete="deleteTopic"
            @toggle-pin="togglePin"
          />
        </div>

        <div v-else :class="$style.emptyState">
          <div :class="$style.emptyIcon"><i class="fas fa-folder-open"></i></div>
          <h3 :class="$style.emptyTitle">
            {{ search ? t('survey.topics.empty.noMatches') : t('survey.topics.empty.topics') }}
          </h3>
          <button v-if="search" :class="$style.secondaryButton" @click="clearSearch">
            <i class="fas fa-undo"></i>
            {{ t('survey.topics.actions.clearFilters') }}
          </button>
          <button v-else-if="canManage" :class="$style.primaryButton" @click="createTopic">
            <i class="fas fa-plus"></i>
            {{ t('survey.topics.actions.create') }}
          </button>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" :class="$style.paginationSection">
          <div :class="$style.paginationInfo">
            {{ t('common.pagination.showing') }} {{ rangeStart }} - {{ rangeEnd }}
            {{ t('common.pagination.of') }} {{ count }}
          </div>
          <div :class="$style.paginationControls">
            <button :class="$style.pageButton" :disabled="page === 1" @click="goToPage(page - 1)">
              <i class="fas fa-chevron-right" v-if="isRTL"></i>
              <i class="fas fa-chevron-left" v-else></i>
              {{ t('common.pagination.previous') }}
            </button>
            <span :class="$style.pageNumbers">
              <button
                v-for="p in pageNumbers"
                :key="`topic-page-${p}`"
                :class="[$style.pageNumber, { [$style.pageNumberActive]: p === page }]"
                @click="goToPage(p)"
              >
                {{ p }}
              </button>
            </span>
            <button :class="$style.pageButton" :disabled="page >= totalPages" @click="goToPage(page + 1)">
              {{ t('common.pagination.next') }}
              <i class="fas fa-chevron-left" v-if="isRTL"></i>
              <i class="fas fa-chevron-right" v-else></i>
            </button>
          </div>
        </div>
      </template>
    </template>

    <!-- Tree -->
    <TopicTreeView
      v-else
      :nodes="topicsStore.tree"
      @open="openTopicById"
      @open-survey="(id: string) => emit('open-survey', id)"
    />

    <!-- Create / edit topic -->
    <TopicModal
      v-if="showTopicModal"
      :topic="topicBeingEdited"
      :default-parent="defaultParentForNew"
      @saved="onTopicSaved"
      @close="closeTopicModal"
    />
  </section>
</template>

<script setup lang="ts">
/**
 * The topics tab: a paginated card grid plus an accessible tree over the same forest.
 *
 * The grid is server-paginated (24 per page) because "a lot of topics" is an
 * expected state; the tree reads the cached forest from the store instead of
 * re-fetching on every view switch.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/useAppStore'
import { useSimpleAuth } from '@/composables/useSimpleAuth'
import { useTopicsStore } from '@/stores/useTopicsStore'
import type { SurveyTopic, TopicSortOption } from '@/types/topic.types'
import TopicCard from './TopicCard.vue'
import TopicTreeView from './TopicTreeView.vue'
import TopicModal from './TopicModal.vue'

type TopicView = 'grid' | 'tree'

const props = withDefaults(defineProps<{
  initialView?: TopicView
}>(), {
  initialView: 'grid',
})

const emit = defineEmits<{
  'open-topic': [topicId: string]
  'open-survey': [surveyId: string]
  'create-survey-in-topic': [topicId: string]
  'count-change': [count: number]
  'view-change': [view: TopicView]
  changed: []
}>()

const store = useAppStore()
const { currentLanguage } = storeToRefs(store)
const { user: authUser } = useSimpleAuth()
const topicsStore = useTopicsStore()
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')

const isSuperAdmin = computed(() => authUser.value?.role === 'super_admin')
const canManage = computed(() => ['super_admin', 'admin'].includes(authUser.value?.role || ''))

const VIEW_STORAGE_KEY = 'adjd.topics.view'

const view = ref<TopicView>(props.initialView)
const topics = ref<SurveyTopic[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const search = ref('')
const sortBy = ref<TopicSortOption>('name_asc')
const archivedFilter = ref('0')

const page = ref(1)
const perPage = ref(24)
const totalPages = ref(0)
const count = ref(0)

const showTopicModal = ref(false)
const topicBeingEdited = ref<SurveyTopic | null>(null)
const defaultParentForNew = ref<string | null>(null)

const viewOptions = computed<Array<{ value: TopicView; label: string; icon: string }>>(() => [
  { value: 'grid', label: t('survey.topics.views.grid'), icon: 'fa-grip' },
  { value: 'tree', label: t('survey.topics.views.tree'), icon: 'fa-sitemap' },
])

const rangeStart = computed(() => (count.value === 0 ? 0 : (page.value - 1) * perPage.value + 1))
const rangeEnd = computed(() => Math.min(page.value * perPage.value, count.value))
const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1).slice(0, 12))

let searchTimer: ReturnType<typeof setTimeout> | null = null
const onSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => reload(true), 300)
}

const clearSearch = () => {
  search.value = ''
  reload(true)
}

const reload = async (resetPage = false) => {
  if (resetPage) page.value = 1
  loading.value = true
  error.value = null
  try {
    const result = await topicsStore.fetchTopics({
      search: search.value.trim() || undefined,
      // Search spans the whole forest; otherwise the grid shows root topics
      parent: search.value.trim() ? 'all' : 'root',
      sort_by: sortBy.value,
      is_archived: archivedFilter.value,
      page: page.value,
      per_page: perPage.value,
    })
    topics.value = result.results
    totalPages.value = result.total_pages
    count.value = result.count
    perPage.value = result.per_page || perPage.value
    emit('count-change', result.count)
  } catch (e: any) {
    topics.value = []
    error.value = e?.message || t('survey.topics.errors.loadFailed')
  } finally {
    loading.value = false
  }
}

const goToPage = (next: number) => {
  if (next < 1 || next > totalPages.value || next === page.value) return
  page.value = next
  reload(false)
}

const setView = async (next: TopicView) => {
  view.value = next
  localStorage.setItem(VIEW_STORAGE_KEY, next)
  emit('view-change', next)
  if (next !== 'grid') await topicsStore.fetchTree()
}

// ── Topic CRUD ────────────────────────────────────────────────────────────
const openTopic = (topic: SurveyTopic) => emit('open-topic', topic.id)
const openTopicById = (topicId: string) => emit('open-topic', topicId)
const createSurveyInTopic = (topic: SurveyTopic) => emit('create-survey-in-topic', topic.id)

const createTopic = () => {
  topicBeingEdited.value = null
  defaultParentForNew.value = null
  showTopicModal.value = true
}

const editTopic = (topic: SurveyTopic) => {
  topicBeingEdited.value = topic
  defaultParentForNew.value = null
  showTopicModal.value = true
}

const addSubtopic = (topic: SurveyTopic) => {
  topicBeingEdited.value = null
  defaultParentForNew.value = topic.id
  showTopicModal.value = true
}

const closeTopicModal = () => {
  showTopicModal.value = false
  topicBeingEdited.value = null
  defaultParentForNew.value = null
}

const onTopicSaved = async () => {
  closeTopicModal()
  await reload(false)
  emit('changed')
}

const togglePin = async (topic: SurveyTopic) => {
  try {
    await topicsStore.updateTopic(topic.id, { is_pinned: !topic.is_pinned })
    await reload(false)
  } catch (e: any) {
    error.value = e?.message || t('survey.topics.errors.saveFailed')
  }
}

const toggleArchive = async (topic: SurveyTopic) => {
  const isArabic = currentLanguage.value === 'ar'
  const archiving = !topic.is_archived
  if (archiving) {
    const confirmed = await Swal.fire({
      icon: 'question',
      title: isArabic ? 'أرشفة الموضوع' : 'Archive topic',
      text: isArabic
        ? 'سيبقى الموضوع وإيضاحاته كما هي، لكنه لن يستقبل إيضاحات جديدة وسيختفي من القائمة الافتراضية.'
        : 'The topic and its surveys stay as they are, but it stops accepting new surveys and leaves the default list.',
      showCancelButton: true,
      confirmButtonText: isArabic ? 'نعم، أرشف' : 'Yes, archive',
      cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
      confirmButtonColor: '#A17D23',
      cancelButtonColor: '#6b7280',
    })
    if (!confirmed.isConfirmed) return
  }
  try {
    await topicsStore.archiveTopic(topic.id, archiving)
    await reload(false)
    emit('changed')
  } catch (e: any) {
    error.value = e?.message || t('survey.topics.errors.saveFailed')
  }
}

const deleteTopic = async (topic: SurveyTopic) => {
  const isArabic = currentLanguage.value === 'ar'
  const result = await Swal.fire({
    icon: 'warning',
    title: isArabic ? 'حذف الموضوع' : 'Delete topic',
    html: isArabic
      ? `سيتم حذف الموضوع «${topic.name}».<br><strong>لن يتم حذف أي إيضاح</strong> — ستصبح إيضاحاته غير مجمّعة، وستنتقل المواضيع الفرعية إلى الأعلى.`
      : `Topic "${topic.name}" will be deleted.<br><strong>No survey is deleted</strong> — its surveys become ungrouped and its sub-topics move up one level.`,
    showCancelButton: true,
    confirmButtonText: isArabic ? 'نعم، احذف' : 'Yes, delete',
    cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  })
  if (!result.isConfirmed) return

  try {
    const outcome = await topicsStore.deleteTopic(topic.id)
    await reload(false)
    emit('changed')
    Swal.fire({
      icon: 'success',
      title: isArabic ? 'تم الحذف' : 'Deleted',
      text: isArabic
        ? `تم حذف الموضوع. أصبحت ${outcome.detached_surveys} إيضاحات غير مجمّعة.`
        : `Topic deleted. ${outcome.detached_surveys} survey(s) are now ungrouped.`,
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  } catch (e: any) {
    Swal.fire({
      icon: 'error',
      title: isArabic ? 'خطأ' : 'Error',
      text: e?.message || t('survey.topics.errors.deleteFailed'),
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  }
}

const refresh = async () => {
  await Promise.all([reload(false), topicsStore.fetchTree(true)])
}

watch(() => topicsStore.error, value => { if (value) error.value = value })

onMounted(async () => {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY) as TopicView | null
  // 'map' may still be stored from an older session — fall back to the grid
  if (stored && ['grid', 'tree'].includes(stored)) view.value = stored
  // The palette carries the server's nesting cap, which the cards use to decide
  // whether "add sub-topic" is even possible.
  await Promise.all([reload(true), topicsStore.fetchPalette()])
  if (view.value !== 'grid') await topicsStore.fetchTree()
})

defineExpose({ refresh, createTopic })
</script>

<style module src="../../pages/Control/SurveyControl.module.css"></style>
