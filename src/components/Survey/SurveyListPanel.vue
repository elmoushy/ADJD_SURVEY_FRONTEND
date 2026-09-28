<template>
  <div>
    <!-- Bulk actions -->
    <div v-if="list.selectedSurveys.value.length > 0" :class="$style.bulkActionsBar">
      <div :class="$style.bulkInfo">
        <span :class="$style.selectedCount">{{ list.selectedSurveys.value.length }}</span>
        <span>{{ t('survey.list.selectedItems') }}</span>
      </div>

      <div :class="$style.bulkActions">
        <button
          v-if="canManageTopics"
          :class="$style.bulkButton"
          :disabled="bulkLoading"
          @click="openTopicPickerForSelection"
        >
          <i class="fas fa-folder-plus"></i>
          {{ t('survey.topics.actions.addToTopic') }}
        </button>
        <button
          v-if="canManageTopics && topicId && topicId !== 'none'"
          :class="$style.bulkButton"
          :disabled="bulkLoading"
          @click="removeSelectionFromTopic"
        >
          <i class="fas fa-folder-minus"></i>
          {{ t('survey.topics.actions.removeFromTopic') }}
        </button>
        <button :class="$style.bulkButton" :disabled="bulkLoading" @click="performBulkOperation('activate')">
          <i class="fas fa-play"></i>
          {{ t('survey.bulk.operations.activate') }}
        </button>
        <button :class="$style.bulkButton" :disabled="bulkLoading" @click="performBulkOperation('deactivate')">
          <i class="fas fa-pause"></i>
          {{ t('survey.bulk.operations.deactivate') }}
        </button>
        <button
          v-if="isSuperAdmin"
          :class="[$style.bulkButton, $style.danger]"
          :disabled="bulkLoading"
          @click="bulkDelete"
        >
          <i class="fas fa-trash"></i>
          {{ t('survey.bulk.operations.delete') }}
        </button>
      </div>
    </div>

    <section :class="$style.surveysSection">
      <!-- Filters -->
      <section :class="$style.controlsSection">
        <div :class="$style.filtersGroup">
          <input
            type="text"
            :class="$style.searchInput"
            :placeholder="t('survey.list.searchPlaceholder')"
            v-model="list.searchQuery.value"
            @input="list.handleSearch"
          />

          <select :class="$style.filterSelect" v-model="list.selectedFilter.value" @change="list.applyFilters">
            <option value="all">{{ t('survey.filters.all') }}</option>
            <option value="active">{{ t('survey.filters.active') }}</option>
            <option value="inactive">{{ t('survey.filters.inactive') }}</option>
          </select>

          <select :class="$style.filterSelect" v-model="list.selectedSort.value" @change="list.applySorting">
            <option value="newest">{{ t('survey.sorting.newest') }}</option>
            <option value="oldest">{{ t('survey.sorting.oldest') }}</option>
            <option value="title_asc">{{ t('survey.sorting.titleAZ') }}</option>
            <option value="title_desc">{{ t('survey.sorting.titleZA') }}</option>
            <option value="most_responses">{{ t('survey.sorting.mostResponses') }}</option>
          </select>

          <select
            v-if="isSuperOrAdmin"
            :class="$style.filterSelect"
            v-model="list.selectedGroup.value"
            @change="list.applyFilters"
          >
            <option value="">{{ t('survey.topics.filters.allGroups') }}</option>
            <option v-for="g in list.groups.value" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>

          <select
            v-if="isSuperOrAdmin"
            :class="$style.filterSelect"
            v-model="list.selectedLifecycleStatus.value"
            @change="list.applyFilters"
          >
            <option value="">{{ t('survey.topics.filters.allStatuses') }}</option>
            <option value="draft">{{ t('survey.status.draft') }}</option>
            <option value="submitted">{{ t('survey.topics.filters.published') }}</option>
            <option value="expired">{{ t('survey.topics.filters.expired') }}</option>
          </select>
        </div>

        <div :class="$style.viewControls">
          <button :class="$style.secondaryButton" @click="refresh">
            <i class="fas fa-sync-alt"></i>
            {{ t('survey.list.refreshData') }}
          </button>
        </div>
      </section>

      <div v-if="list.loadError.value" :class="$style.inlineError" role="alert">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ list.loadError.value }}</span>
      </div>

      <div v-if="!list.isLoading.value && list.surveys.value.length > 0">
        <div :class="$style.surveysGrid">
          <SurveyCard
            v-for="survey in list.surveys.value"
            :key="survey.id"
            :survey="survey"
            :is-selected="list.selectedSurveys.value.includes(survey.id)"
            :can-delete="isSuperAdmin"
            :can-manage-topics="canManageTopics"
            :can-send-reminder="canSendReminder(survey)"
            :show-remove-from-topic="showRemoveFromTopic"
            :show-topic-chip="showTopicChip"
            :draggable="canManageTopics"
            @toggle-select="list.toggleSurveySelection"
            @preview="previewSurveyQuestions"
            @remind="sendReminder"
            @submit-draft="submitDraftSurvey"
            @view-responses="viewResponses"
            @edit="editSurveyWithEditor"
            @manage-access="manageSurveyAccess"
            @share-link="openLinkSharingModal"
            @assign-topic="openTopicPickerForSurvey"
            @remove-from-topic="removeSurveyFromTopic"
            @open-topic="(id: string) => emit('open-topic', id)"
            @delete="deleteSurvey"
            @drag-start="(s: Survey) => emit('drag-survey-start', s)"
            @drag-end="emit('drag-survey-end')"
          />
        </div>

        <!-- Pagination -->
        <div :class="$style.paginationSection">
          <div :class="$style.paginationInfo">
            {{ t('common.pagination.showing') }}
            {{ list.paginationRange.value.start }} - {{ list.paginationRange.value.end }}
            {{ t('common.pagination.of') }} {{ list.pagination.value.total }}
          </div>

          <div :class="$style.paginationControls">
            <button
              :class="$style.pageButton"
              @click="list.changePage(list.pagination.value.currentPage - 1)"
              :disabled="list.pagination.value.currentPage === 1"
            >
              <i class="fas fa-chevron-right" v-if="isRTL"></i>
              <i class="fas fa-chevron-left" v-else></i>
              {{ t('common.pagination.previous') }}
            </button>

            <span :class="$style.pageNumbers">
              <template v-for="page in list.visiblePages.value" :key="`page-${page}`">
                <span v-if="page === -1" :class="$style.ellipsis">…</span>
                <button
                  v-else
                  :class="[$style.pageNumber, { [$style.pageNumberActive]: page === list.pagination.value.currentPage }]"
                  @click="list.changePage(page)"
                >
                  {{ page }}
                </button>
              </template>
            </span>

            <button
              :class="$style.pageButton"
              @click="list.changePage(list.pagination.value.currentPage + 1)"
              :disabled="!list.pagination.value.hasNext && list.pagination.value.currentPage >= list.pagination.value.totalPages"
            >
              {{ t('common.pagination.next') }}
              <i class="fas fa-chevron-left" v-if="isRTL"></i>
              <i class="fas fa-chevron-right" v-else></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!list.isLoading.value && list.surveys.value.length === 0" :class="$style.emptyState">
        <div :class="$style.emptyIcon"><i class="fas fa-poll-h"></i></div>
        <h3 :class="$style.emptyTitle">
          {{ list.hasActiveFilters.value ? t('survey.topics.empty.noMatches') : emptyTitle }}
        </h3>
        <button v-if="list.hasActiveFilters.value" :class="$style.secondaryButton" @click="list.resetFilters">
          <i class="fas fa-undo"></i>
          {{ t('survey.topics.actions.clearFilters') }}
        </button>
        <button v-else-if="showCreateInEmptyState" :class="$style.primaryButton" @click="emit('create-survey')">
          <i class="fas fa-plus"></i>
          {{ t('survey.list.createSurvey') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="list.isLoading.value" :class="$style.loadingContainer">
        <div :class="$style.loadingSpinner"></div>
      </div>
    </section>

    <!-- Modals -->
    <SurveyQuestionsPreviewModal
      v-if="showQuestionsPreview && selectedSurveyForPreview"
      :survey="selectedSurveyForPreview"
      @close="closeQuestionsPreview"
    />

    <SurveyAccessModal
      v-if="showAccessModal && selectedSurveyForAccess"
      :survey="selectedSurveyForAccess"
      :is-submission-flow="isSubmissionFlow"
      @save="handleAccessSave"
      @cancel="closeAccessModal"
    />

    <LinkSharingModal
      v-if="showLinkSharingModal && selectedSurveyForLinkSharing"
      :is-visible="showLinkSharingModal"
      :survey="selectedSurveyForLinkSharing"
      :public-link="publicLinkForSharing"
      @close="closeLinkSharingModal"
      @link-generated="handleLinkGenerated"
      @status-update="() => {}"
    />

    <TopicPickerModal
      v-if="showTopicPicker"
      :title="t('survey.topics.picker.title')"
      :current-topic-id="pickerCurrentTopicId"
      @select="handleTopicPicked"
      @close="showTopicPicker = false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * The survey list surface: filters, cards, pagination, bulk actions and the
 * survey-level modals.
 *
 * One component backs all three places a survey list appears — the "All" tab, the
 * "Ungrouped" tab (topicId = 'none') and a topic page (topicId = <uuid>) — so the
 * filtering, sorting, search and pagination behaviour cannot drift between them.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/useAppStore'
import { useSimpleAuth } from '@/composables/useSimpleAuth'
import { useSurveyList } from '@/composables/useSurveyList'
import { useTopicsStore } from '@/stores/useTopicsStore'
import { surveyService } from '@/services/surveyService'
import type { Survey } from '@/types/survey.types'
import SurveyCard from './SurveyCard.vue'
import SurveyQuestionsPreviewModal from '../SurveyQuestionsPreviewModal/SurveyQuestionsPreviewModal.vue'
import SurveyAccessModal from '../SurveyAccessModal/SurveyAccessModal.vue'
import LinkSharingModal from '../LinkSharingModal/LinkSharingModal.vue'
import TopicPickerModal from '../Topics/TopicPickerModal.vue'

const props = withDefaults(defineProps<{
  /** undefined = every survey · 'none' = ungrouped · <uuid> = that topic */
  topicId?: string
  includeDescendants?: boolean
  showRemoveFromTopic?: boolean
  showTopicChip?: boolean
  syncUrl?: boolean
  showCreateInEmptyState?: boolean
  emptyTitleOverride?: string
}>(), {
  topicId: undefined,
  includeDescendants: false,
  showRemoveFromTopic: false,
  showTopicChip: true,
  syncUrl: false,
  showCreateInEmptyState: true,
  emptyTitleOverride: '',
})

const emit = defineEmits<{
  /** KPI block returned by the list endpoint (already topic-scoped server-side) */
  analytics: [analytics: any]
  /** something changed that affects counters elsewhere (topic cards, KPIs) */
  changed: []
  'open-topic': [topicId: string]
  'create-survey': []
  'drag-survey-start': [survey: Survey]
  'drag-survey-end': []
}>()

const router = useRouter()
const store = useAppStore()
const { currentLanguage } = storeToRefs(store)
const { user: authUser } = useSimpleAuth()
const topicsStore = useTopicsStore()
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')

const isSuperAdmin = computed(() => authUser.value?.role === 'super_admin')
const isSuperOrAdmin = computed(() => ['super_admin', 'admin'].includes(authUser.value?.role || ''))
const canManageTopics = isSuperOrAdmin

const list = useSurveyList({
  topic: () => props.topicId,
  includeDescendants: () => props.includeDescendants,
  syncUrl: props.syncUrl,
  loadGroupOptions: true,
})

const emptyTitle = computed(() => props.emptyTitleOverride || t('survey.list.noSurveys'))

// Modal state
const showQuestionsPreview = ref(false)
const selectedSurveyForPreview = ref<Survey | null>(null)
const showAccessModal = ref(false)
const selectedSurveyForAccess = ref<Survey | null>(null)
const isSubmissionFlow = ref(false)
const showLinkSharingModal = ref(false)
const selectedSurveyForLinkSharing = ref<Survey | null>(null)
const publicLinkForSharing = ref<any | null>(null)
const showTopicPicker = ref(false)
const pickerCurrentTopicId = ref<string | null>(null)
const pickerTargets = ref<string[]>([])
const bulkLoading = ref(false)

// ── Loading ────────────────────────────────────────────────────────────────
const refresh = async () => {
  await list.loadSurveys()
  emit('analytics', list.listAnalytics.value)
}

onMounted(async () => {
  if (props.syncUrl) list.restoreListStateFromQuery()
  await Promise.all([list.loadSurveys(), list.loadGroups()])
  emit('analytics', list.listAnalytics.value)
})

onUnmounted(() => list.dispose())

// ── Survey actions (ported from SurveyControl.vue) ─────────────────────────
const previewSurveyQuestions = (survey: Survey) => {
  selectedSurveyForPreview.value = survey
  showQuestionsPreview.value = true
}
const closeQuestionsPreview = () => {
  showQuestionsPreview.value = false
  selectedSurveyForPreview.value = null
}

const viewResponses = (surveyId?: string) => {
  if (!surveyId) return
  router.push({ name: 'SurveyResponses', params: { surveyId } })
}

const editSurveyWithEditor = (survey: Survey) => {
  router.push({ name: 'SurveyEdit', params: { id: survey.id } })
}

const manageSurveyAccess = (survey: Survey) => {
  selectedSurveyForAccess.value = survey
  isSubmissionFlow.value = false
  showAccessModal.value = true
}

const openLinkSharingModal = (survey: Survey) => {
  selectedSurveyForLinkSharing.value = survey
  publicLinkForSharing.value = null
  showLinkSharingModal.value = true
}
const closeLinkSharingModal = () => {
  showLinkSharingModal.value = false
  selectedSurveyForLinkSharing.value = null
  publicLinkForSharing.value = null
}
const handleLinkGenerated = (link: any) => { publicLinkForSharing.value = link }

const handleAccessSave = async () => {
  showAccessModal.value = false
  selectedSurveyForAccess.value = null
  isSubmissionFlow.value = false
  await refresh()
  emit('changed')
}
const closeAccessModal = () => {
  showAccessModal.value = false
  selectedSurveyForAccess.value = null
  isSubmissionFlow.value = false
}

/** Publishing a draft goes through the access modal, same as before. */
const submitDraftSurvey = (surveyId: string) => {
  const survey = list.surveys.value.find(s => s.id === surveyId)
  if (!survey) return
  selectedSurveyForAccess.value = survey
  isSubmissionFlow.value = true
  showAccessModal.value = true
}

/** Used by the post-publish redirect (?openAccess=true&surveyId=…). */
const openAccessModalForSurvey = async (surveyId: string, isSubmission = false) => {
  let survey = list.surveys.value.find(s => s.id === surveyId)
  if (!survey) {
    try {
      const response = await surveyService.getSurvey(surveyId)
      survey = response.data
    } catch {
      return
    }
  }
  selectedSurveyForAccess.value = survey
  isSubmissionFlow.value = isSubmission
  showAccessModal.value = true
}

const canSendReminder = (survey: Survey): boolean => {
  const isCreator = !!authUser.value?.id && authUser.value.id === survey.creator
  const isSuper = authUser.value?.role === 'super_admin'
  return (
    (isCreator || isSuper) &&
    survey.status === 'submitted' &&
    ['AUTH', 'PRIVATE', 'GROUPS'].includes(survey.visibility)
  )
}

// Reflect the backend's updated reminder counter on the card (and an open
// preview) without refetching the whole list.
const applyReminderCounter = (
  surveyId: string,
  reminderCount: number | undefined,
  lastReminderAt: string | null | undefined
) => {
  if (reminderCount === undefined) return
  const targets = [
    list.surveys.value.find((s) => s.id === surveyId),
    selectedSurveyForPreview.value?.id === surveyId ? selectedSurveyForPreview.value : undefined,
  ]
  for (const target of targets) {
    if (!target) continue
    target.reminder_count = reminderCount
    target.last_reminder_at = lastReminderAt ?? target.last_reminder_at ?? null
  }
}

const sendReminder = async (survey: Survey) => {
  if (!survey?.id) return
  const isArabic = currentLanguage.value === 'ar'
  try {
    const preview = await surveyService.getReminderPreview(survey.id)

    if (!preview.applicable) {
      Swal.fire({
        icon: 'info',
        title: isArabic ? 'غير متاح' : 'Not available',
        text: isArabic
          ? 'التذكير متاح فقط للإيضاحات المرسلة المشاركة مع مستخدمين أو مجموعات.'
          : 'Reminders are only available for submitted surveys shared with users or groups.',
        confirmButtonText: isArabic ? 'موافق' : 'OK',
      })
      return
    }

    if (preview.count === 0) {
      Swal.fire({
        icon: 'info',
        title: isArabic ? 'لا يوجد مستخدمون' : 'No pending users',
        text: isArabic
          ? 'جميع المستخدمين المعنيين قد استجابوا بالفعل لهذا الإيضاح.'
          : 'All assigned users have already responded to this survey.',
        confirmButtonText: isArabic ? 'موافق' : 'OK',
      })
      return
    }

    const result = await Swal.fire({
      icon: 'question',
      title: isArabic ? 'تأكيد إرسال التذكير' : 'Confirm reminder',
      text: isArabic
        ? `هل أنت متأكد أنك تريد إرسال تذكير إلى ${preview.count} مستخدم لم يستجيبوا لهذا الإيضاح؟`
        : `Are you sure you want to send a reminder to ${preview.count} user(s) who have not responded?`,
      showCancelButton: true,
      confirmButtonText: isArabic ? 'نعم، أرسل التذكير' : 'Yes, send reminder',
      cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
      confirmButtonColor: '#A17D23',
      cancelButtonColor: '#6b7280',
    })
    if (!result.isConfirmed) return

    const { count, reminder_count, last_reminder_at } = await surveyService.sendReminder(survey.id)
    applyReminderCounter(survey.id, reminder_count, last_reminder_at)
    Swal.fire({
      icon: 'success',
      title: isArabic ? 'تم الإرسال' : 'Sent',
      text: isArabic
        ? `تم إرسال التذكير إلى ${count} مستخدم بنجاح.`
        : `Reminder sent to ${count} user(s) successfully.`,
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: isArabic ? 'خطأ' : 'Error',
      text: error?.message || (isArabic ? 'فشل في إرسال التذكير' : 'Failed to send reminder'),
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  }
}

const deleteSurvey = async (surveyId?: string) => {
  if (!surveyId) return
  const isArabic = currentLanguage.value === 'ar'
  const result = await Swal.fire({
    icon: 'warning',
    title: isArabic ? 'تأكيد الحذف' : 'Confirm delete',
    text: isArabic
      ? 'هل أنت متأكد من أنك تريد حذف هذا الإيضاح؟'
      : 'Are you sure you want to delete this survey?',
    showCancelButton: true,
    confirmButtonText: isArabic ? 'نعم، احذف' : 'Yes, delete',
    cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  })
  if (!result.isConfirmed) return

  try {
    await surveyService.deleteSurvey(surveyId)
    await refresh()
    emit('changed')
    Swal.fire({
      icon: 'success',
      title: isArabic ? 'تم الحذف' : 'Deleted',
      text: isArabic ? 'تم حذف الإيضاح بنجاح' : 'Survey deleted successfully',
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: isArabic ? 'خطأ' : 'Error',
      text: error?.message || (isArabic ? 'فشل في حذف الإيضاح' : 'Failed to delete survey'),
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  }
}

// ── Bulk operations ───────────────────────────────────────────────────────
const performBulkOperation = async (operation: 'activate' | 'deactivate' | 'delete') => {
  const isArabic = currentLanguage.value === 'ar'
  try {
    bulkLoading.value = true
    await surveyService.performBulkOperation({
      operation: operation as any,
      survey_ids: list.selectedSurveys.value || [],
    })
    list.clearSelection()
    await refresh()
    emit('changed')

    const messages: Record<string, string> = {
      activate: isArabic ? 'تم تفعيل الإيضاحات بنجاح' : 'Surveys activated successfully',
      deactivate: isArabic ? 'تم إلغاء تفعيل الإيضاحات بنجاح' : 'Surveys deactivated successfully',
      delete: isArabic ? 'تم حذف الإيضاحات بنجاح' : 'Surveys deleted successfully',
    }
    Swal.fire({
      icon: 'success',
      title: isArabic ? 'نجحت العملية' : 'Done',
      text: messages[operation],
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  } catch {
    Swal.fire({
      icon: 'error',
      title: isArabic ? 'خطأ' : 'Error',
      text: isArabic ? 'فشلت العملية الجماعية' : 'Bulk operation failed',
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  } finally {
    bulkLoading.value = false
  }
}

const bulkDelete = async () => {
  const isArabic = currentLanguage.value === 'ar'
  const count = list.selectedSurveys.value.length
  const result = await Swal.fire({
    icon: 'warning',
    title: isArabic ? 'تأكيد الحذف الجماعي' : 'Confirm bulk delete',
    text: isArabic
      ? `هل أنت متأكد من أنك تريد حذف ${count} إيضاح؟`
      : `Are you sure you want to delete ${count} survey(s)?`,
    showCancelButton: true,
    confirmButtonText: isArabic ? 'نعم، احذف الكل' : 'Yes, delete all',
    cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  })
  if (result.isConfirmed) await performBulkOperation('delete')
}

// ── Topic assignment ──────────────────────────────────────────────────────
const openTopicPickerForSurvey = (survey: Survey) => {
  pickerTargets.value = [survey.id]
  pickerCurrentTopicId.value = survey.topic || null
  showTopicPicker.value = true
}

const openTopicPickerForSelection = () => {
  pickerTargets.value = [...list.selectedSurveys.value]
  pickerCurrentTopicId.value = props.topicId && props.topicId !== 'none' ? props.topicId : null
  showTopicPicker.value = true
}

const handleTopicPicked = async (topicId: string | null) => {
  showTopicPicker.value = false
  const targets = pickerTargets.value
  if (!targets.length) return
  await moveSurveys(topicId, targets)
}

const moveSurveys = async (topicId: string | null, surveyIds: string[]) => {
  const isArabic = currentLanguage.value === 'ar'
  try {
    bulkLoading.value = true
    const result = await topicsStore.assignSurveys(topicId, surveyIds)
    list.clearSelection()
    await refresh()
    emit('changed')

    const movedText = topicId
      ? (isArabic
          ? `تم نقل ${result.assigned} إيضاح إلى «${result.topic_name}»`
          : `Moved ${result.assigned} survey(s) to "${result.topic_name}"`)
      : (isArabic
          ? `تم إزالة ${result.assigned} إيضاح من الموضوع`
          : `Removed ${result.assigned} survey(s) from the topic`)

    const skippedText = result.skipped
      ? (isArabic ? ` · تم تخطي ${result.skipped}` : ` · ${result.skipped} skipped`)
      : ''

    const toast = await Swal.fire({
      icon: result.assigned ? 'success' : 'info',
      title: movedText + skippedText,
      html: result.errors?.length ? `<small>${result.errors.join('<br>')}</small>` : undefined,
      showCancelButton: result.assigned > 0,
      confirmButtonText: isArabic ? 'تم' : 'Done',
      cancelButtonText: isArabic ? 'تراجع' : 'Undo',
      confirmButtonColor: '#A17D23',
      cancelButtonColor: '#6b7280',
      timer: result.assigned && !result.errors?.length ? 6000 : undefined,
      timerProgressBar: true,
    })

    // Undo restores each survey to the topic it came from
    if (toast.dismiss === Swal.DismissReason.cancel && result.previous_topics) {
      await topicsStore.undoAssign(result.previous_topics)
      await refresh()
      emit('changed')
    }
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: isArabic ? 'خطأ' : 'Error',
      text: error?.message || (isArabic ? 'فشل نقل الإيضاحات' : 'Failed to move surveys'),
      confirmButtonText: isArabic ? 'موافق' : 'OK',
    })
  } finally {
    bulkLoading.value = false
  }
}

const confirmRemoval = async (count: number) => {
  const isArabic = currentLanguage.value === 'ar'
  const result = await Swal.fire({
    icon: 'question',
    title: isArabic ? 'إزالة من الموضوع' : 'Remove from topic',
    text: isArabic
      ? `سيتم إزالة ${count} إيضاح من هذا الموضوع وستصبح غير مجمّعة. لن يتم حذف أي إيضاح.`
      : `${count} survey(s) will be removed from this topic and become ungrouped. No survey is deleted.`,
    showCancelButton: true,
    confirmButtonText: isArabic ? 'نعم، أزل' : 'Yes, remove',
    cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#A17D23',
    cancelButtonColor: '#6b7280',
  })
  return result.isConfirmed
}

const removeSurveyFromTopic = async (survey: Survey) => {
  if (!(await confirmRemoval(1))) return
  await moveSurveys(null, [survey.id])
}

const removeSelectionFromTopic = async () => {
  const ids = [...list.selectedSurveys.value]
  if (!ids.length) return
  if (!(await confirmRemoval(ids.length))) return
  await moveSurveys(null, ids)
}

/** Drop a dragged survey onto a topic (used by the topics grid + map). */
const assignDraggedSurvey = (topicId: string | null, surveyId: string) => moveSurveys(topicId, [surveyId])

defineExpose({ refresh, openAccessModalForSurvey, assignDraggedSurvey })
</script>

<style module src="../../pages/Control/SurveyControl.module.css"></style>
