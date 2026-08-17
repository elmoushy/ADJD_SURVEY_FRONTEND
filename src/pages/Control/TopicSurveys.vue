<template>
  <div :class="$style.surveyPanel" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Breadcrumb -->
    <nav :class="$style.breadcrumb" :aria-label="t('survey.topics.breadcrumbLabel')">
      <button type="button" :class="$style.breadcrumbLink" @click="goToTopics">
        {{ t('survey.title') }}
      </button>
      <template v-for="(crumb, index) in breadcrumb" :key="crumb.id">
        <span aria-hidden="true">/</span>
        <button
          v-if="index < breadcrumb.length - 1"
          type="button"
          :class="$style.breadcrumbLink"
          @click="openTopic(crumb.id)"
        >
          {{ crumb.name }}
        </button>
        <span v-else :class="$style.breadcrumbCurrent">{{ crumb.name }}</span>
      </template>
    </nav>

    <div v-if="notFound" :class="$style.emptyState">
      <div :class="$style.emptyIcon"><i class="fas fa-folder-minus"></i></div>
      <h3 :class="$style.emptyTitle">{{ t('survey.topics.errors.notFound') }}</h3>
      <button :class="$style.primaryButton" @click="goToTopics">
        <i class="fas fa-arrow-right" v-if="isRTL"></i>
        <i class="fas fa-arrow-left" v-else></i>
        {{ t('survey.topics.actions.backToTopics') }}
      </button>
    </div>

    <template v-else>
      <!-- Topic header -->
      <header v-if="topic" :class="$style.topicPageHeader" :style="{ '--topic-accent': topic.color || undefined }">
        <div :class="$style.topicPageIdentity">
          <div :class="$style.topicIconTile" aria-hidden="true">
            <i :class="['fas', `fa-${topic.icon || 'folder'}`]"></i>
          </div>
          <div>
            <h1 :class="$style.topicPageTitle">{{ topic.name }}</h1>
            <p v-if="topic.description" :class="$style.topicPageDescription">{{ topic.description }}</p>
            <div :class="$style.topicPageMeta">
              <span v-if="topic.is_archived" :class="$style.archivedBadge">
                <i class="fas fa-box-archive"></i>{{ t('survey.topics.card.archived') }}
              </span>
              <span :class="$style.chip">
                <i class="fas fa-user" :class="$style.chipIcon"></i>
                {{ t('survey.card.createdBy') }}: {{ topic.created_by_name || topic.created_by_email || '—' }}
              </span>
              <span v-if="topic.children_count" :class="$style.chip">
                <i class="fas fa-sitemap" :class="$style.chipIcon"></i>
                {{ topic.children_count }} {{ t('survey.topics.card.subtopics') }}
              </span>
            </div>
          </div>
        </div>

        <div :class="$style.topicPageActions">
          <button
            v-if="topic.children_count > 0"
            type="button"
            :class="[$style.actionButton, includeDescendants ? $style.primaryAction : $style.outlinedAction]"
            :aria-pressed="includeDescendants"
            @click="includeDescendants = !includeDescendants"
          >
            <i class="fas fa-layer-group"></i>
            <span :class="$style.actionButtonText">{{ t('survey.topics.actions.includeSubtopics') }}</span>
          </button>

          <button
            v-if="canManage && !topic.is_archived"
            type="button"
            :class="[$style.actionButton, $style.primaryAction]"
            @click="createSurveyHere"
          >
            <i class="fas fa-plus"></i>
            <span :class="$style.actionButtonText">{{ t('survey.topics.actions.createSurveyInside') }}</span>
          </button>

          <button
            v-if="canManage"
            type="button"
            :class="[$style.actionButton, $style.outlinedAction]"
            @click="showEditModal = true"
          >
            <i class="fas fa-pen"></i>
            <span :class="$style.actionButtonText">{{ t('survey.topics.actions.edit') }}</span>
          </button>

          <button
            v-if="canManage"
            type="button"
            :class="[$style.actionButton, $style.outlinedAction]"
            :aria-pressed="topic.is_pinned"
            @click="togglePin"
          >
            <i class="fas fa-thumbtack"></i>
            <span :class="$style.actionButtonText">
              {{ topic.is_pinned ? t('survey.topics.actions.unpin') : t('survey.topics.actions.pin') }}
            </span>
          </button>
        </div>
      </header>

      <!-- Topic-scoped KPIs -->
      <SurveyKpiRow :analytics="scopedAnalytics" />

      <!-- Sub-topics -->
      <section v-if="children.length" :class="$style.surveysSection" style="margin-bottom:24px;">
        <h2 :class="$style.sectionTitle">{{ t('survey.topics.card.subtopics') }}</h2>
        <div :class="$style.topicsGrid">
          <TopicCard
            v-for="child in children"
            :key="child.id"
            :topic="child"
            :can-manage="canManage"
            :can-delete="isSuperAdmin"
            @open="(c) => openTopic(c.id)"
            @edit="editChild"
            @add-subtopic="addSubtopic"
            @create-survey="(c) => createSurveyIn(c.id)"
            @archive="archiveChild"
            @delete="deleteChild"
            @toggle-pin="togglePinChild"
            @drop-survey="onDropSurvey"
          />
        </div>
      </section>

      <!-- Surveys inside this topic -->
      <SurveyListPanel
        v-if="topicId"
        ref="panelRef"
        :topic-id="topicId"
        :include-descendants="includeDescendants"
        :show-remove-from-topic="true"
        :show-topic-chip="includeDescendants"
        sync-url
        :empty-title-override="t('survey.topics.empty.surveysInTopic')"
        @analytics="scopedAnalytics = $event"
        @changed="reloadTopic"
        @open-topic="openTopic"
        @create-survey="createSurveyHere"
      />
    </template>

    <TopicModal
      v-if="showEditModal && (topicBeingEdited || topic)"
      :topic="topicBeingEdited || topic"
      @saved="onTopicSaved"
      @close="closeEditModal"
    />

    <TopicModal
      v-if="showSubtopicModal"
      :default-parent="subtopicParentId"
      @saved="onTopicSaved"
      @close="showSubtopicModal = false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * A topic's own page: breadcrumb, topic header, topic-scoped KPIs, its sub-topics,
 * and the full survey list (search + every filter) restricted to this topic.
 *
 * The KPI numbers come from the survey list response, which the backend scopes to
 * the active topic filter — so they describe this topic, not the whole corpus.
 * Creating a survey from here carries ?topic=<id>, so the new survey lands in the
 * topic automatically.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/useAppStore'
import { useSimpleAuth } from '@/composables/useSimpleAuth'
import { useTopicsStore } from '@/stores/useTopicsStore'
import type { SurveyTopic, TopicBreadcrumbItem } from '@/types/topic.types'
import SurveyKpiRow from '@/components/Survey/SurveyKpiRow.vue'
import SurveyListPanel from '@/components/Survey/SurveyListPanel.vue'
import TopicCard from '@/components/Topics/TopicCard.vue'
import TopicModal from '@/components/Topics/TopicModal.vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const { user: authUser } = useSimpleAuth()
const topicsStore = useTopicsStore()
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')

const isSuperAdmin = computed(() => authUser.value?.role === 'super_admin')
const canManage = computed(() => ['super_admin', 'admin'].includes(authUser.value?.role || ''))

const topicId = computed(() => (route.params.topicId as string) || '')
const topic = ref<SurveyTopic | null>(null)
const children = ref<SurveyTopic[]>([])
const notFound = ref(false)
const includeDescendants = ref(false)
const scopedAnalytics = ref<any>(null)

const panelRef = ref<InstanceType<typeof SurveyListPanel> | null>(null)
const showEditModal = ref(false)
const showSubtopicModal = ref(false)
const subtopicParentId = ref<string | null>(null)
const topicBeingEdited = ref<SurveyTopic | null>(null)

const breadcrumb = computed<TopicBreadcrumbItem[]>(() => topic.value?.breadcrumb || [])

const loadTopic = async () => {
  if (!topicId.value) return
  notFound.value = false
  try {
    const detail = await topicsStore.fetchTopic(topicId.value)
    topic.value = detail.topic
    children.value = detail.children
    document.title = `${detail.topic.name} - WPC | ADJD App`
  } catch {
    topic.value = null
    children.value = []
    notFound.value = true
  }
}

const reloadTopic = async () => {
  await loadTopic()
}

// ── Navigation ────────────────────────────────────────────────────────────
const goToTopics = () => router.push({ name: 'SurveyControl', query: { tab: 'topics' } })
const openTopic = (id: string) => {
  if (id === topicId.value) return
  router.push({ name: 'TopicSurveys', params: { topicId: id } })
}
const createSurveyIn = (id: string) => router.push({ name: 'SurveyCreate', query: { topic: id } })
const createSurveyHere = () => createSurveyIn(topicId.value)

// ── Topic actions ─────────────────────────────────────────────────────────
const togglePin = async () => {
  if (!topic.value) return
  await topicsStore.updateTopic(topic.value.id, { is_pinned: !topic.value.is_pinned })
  await loadTopic()
}

const closeEditModal = () => {
  showEditModal.value = false
  topicBeingEdited.value = null
}

const onTopicSaved = async () => {
  closeEditModal()
  showSubtopicModal.value = false
  await loadTopic()
}

const editChild = (child: SurveyTopic) => {
  topicBeingEdited.value = child
  showEditModal.value = true
}

const addSubtopic = (parent: SurveyTopic) => {
  subtopicParentId.value = parent.id
  showSubtopicModal.value = true
}

const togglePinChild = async (child: SurveyTopic) => {
  await topicsStore.updateTopic(child.id, { is_pinned: !child.is_pinned })
  await loadTopic()
}

const archiveChild = async (child: SurveyTopic) => {
  await topicsStore.archiveTopic(child.id, !child.is_archived)
  await loadTopic()
}

const deleteChild = async (child: SurveyTopic) => {
  const isArabic = currentLanguage.value === 'ar'
  const result = await Swal.fire({
    icon: 'warning',
    title: isArabic ? 'حذف الموضوع الفرعي' : 'Delete sub-topic',
    html: isArabic
      ? `سيتم حذف «${child.name}». <strong>لن يتم حذف أي إيضاح</strong> — ستصبح إيضاحاته غير مجمّعة.`
      : `"${child.name}" will be deleted. <strong>No survey is deleted</strong> — its surveys become ungrouped.`,
    showCancelButton: true,
    confirmButtonText: isArabic ? 'نعم، احذف' : 'Yes, delete',
    cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  })
  if (!result.isConfirmed) return
  await topicsStore.deleteTopic(child.id)
  await loadTopic()
}

const onDropSurvey = async ({ topicId: targetId, surveyId }: { topicId: string; surveyId: string }) => {
  await panelRef.value?.assignDraggedSurvey?.(targetId, surveyId)
  await loadTopic()
}

watch(topicId, () => {
  includeDescendants.value = false
  loadTopic()
})

onMounted(async () => {
  // max_depth drives whether sub-topic actions are offered on the child cards
  await Promise.all([loadTopic(), topicsStore.fetchPalette()])
})
</script>

<style module src="./SurveyControl.module.css"></style>
