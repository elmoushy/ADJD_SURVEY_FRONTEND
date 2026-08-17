<template>
  <div :class="$style.surveyPanel" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Hero -->
    <section :class="$style.heroSection">
      <div :class="$style.heroContent">
        <div :class="$style.heroText">
          <div :class="$style.sectionHerto">
            <h1>{{ t('survey.title') }}</h1>
          </div>
        </div>

        <div :class="$style.heroActions">
          <div :class="$style.createButtonContainer" ref="createButtonRef">
            <button :class="$style.primaryButton" @click="toggleCreateDropdown">
              <i class="fas fa-plus"></i>
              {{ t('survey.list.createSurvey') }}
              <i :class="['fas', showCreateDropdown ? 'fa-chevron-up' : 'fa-chevron-down', $style.dropdownIcon]"></i>
            </button>
          </div>

          <Teleport to="body">
            <div
              v-if="showCreateDropdown"
              :class="$style.createDropdown"
              :style="dropdownPosition"
              data-dropdown="create-survey"
              @mousedown.prevent
            >
              <button :class="$style.dropdownItem" @click="createDefaultSurvey">
                <i class="fas fa-file-alt"></i>
                <div :class="$style.dropdownItemContent">
                  <span :class="$style.dropdownItemTitle">{{ isRTL ? 'إيضاحات افتراضي' : 'Default Survey' }}</span>
                  <span :class="$style.dropdownItemDescription">
                    {{ isRTL ? 'إنشاء إيضاحات فارغ من البداية' : 'Create a blank survey from scratch' }}
                  </span>
                </div>
              </button>

              <button :class="$style.dropdownItem" @click="openTemplateGallery">
                <i class="fas fa-layer-group"></i>
                <div :class="$style.dropdownItemContent">
                  <span :class="$style.dropdownItemTitle">{{ isRTL ? 'من قالب' : 'From Template' }}</span>
                  <span :class="$style.dropdownItemDescription">
                    {{ isRTL ? 'اختر من القوالب الجاهزة أو إيضاحاتاتك السابقة' : 'Choose from ready templates or your previous surveys' }}
                  </span>
                </div>
              </button>

              <button v-if="isSuperOrAdmin" :class="$style.dropdownItem" @click="createTopicFromHero">
                <i class="fas fa-folder-plus"></i>
                <div :class="$style.dropdownItemContent">
                  <span :class="$style.dropdownItemTitle">{{ t('survey.topics.actions.create') }}</span>
                  <span :class="$style.dropdownItemDescription">{{ t('survey.topics.actions.createHint') }}</span>
                </div>
              </button>
            </div>
          </Teleport>
        </div>
      </div>
    </section>

    <!-- KPIs (global, unchanged) -->
    <SurveyKpiRow v-if="analytics" :analytics="analytics" />

    <!-- Tabs: Topics | Ungrouped | All -->
    <nav :class="$style.tabsBar" role="tablist" :aria-label="t('survey.topics.tabs.label')">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.key"
        :ref="el => setTabRef(el, index)"
        type="button"
        role="tab"
        :id="`survey-tab-${tab.key}`"
        :aria-selected="activeTab === tab.key"
        :aria-controls="`survey-tabpanel-${tab.key}`"
        :tabindex="activeTab === tab.key ? 0 : -1"
        :class="[$style.tabButton, { [$style.tabButtonActive]: activeTab === tab.key }]"
        @click="setTab(tab.key)"
        @keydown="onTabKeydown($event, index)"
      >
        <i :class="['fas', tab.icon]"></i>
        <span>{{ tab.label }}</span>
        <span v-if="tab.count !== null" :class="$style.tabBadge">{{ tab.count }}</span>
      </button>
    </nav>

    <!-- Panels (kept alive so switching tabs preserves filters and scroll) -->
    <div
      role="tabpanel"
      :id="`survey-tabpanel-${activeTab}`"
      :aria-labelledby="`survey-tab-${activeTab}`"
    >
      <KeepAlive>
        <TopicsBrowser
          v-if="activeTab === 'topics'"
          ref="topicsBrowserRef"
          @open-topic="openTopicPage"
          @open-survey="viewResponses"
          @create-survey-in-topic="createSurveyInTopic"
          @count-change="topicsCount = $event"
          @changed="refreshAnalytics"
        />

        <SurveyListPanel
          v-else-if="activeTab === 'ungrouped'"
          ref="ungroupedPanelRef"
          topic-id="none"
          :show-topic-chip="false"
          :empty-title-override="t('survey.topics.empty.ungrouped')"
          @analytics="ungroupedAnalytics = $event"
          @changed="refreshAll"
          @open-topic="openTopicPage"
          @create-survey="createDefaultSurvey"
        />

        <SurveyListPanel
          v-else
          ref="allPanelRef"
          sync-url
          @analytics="onAllAnalytics"
          @changed="refreshAll"
          @open-topic="openTopicPage"
          @create-survey="createDefaultSurvey"
        />
      </KeepAlive>
    </div>

    <!-- Modals owned by the shell -->
    <TemplateGalleryModal
      v-if="showTemplateGallery"
      @close="closeTemplateGallery"
      @template-selected="handleTemplateSelected"
      @recent-survey-selected="handleRecentSurveySelected"
      @create-new-template="handleCreateNewTemplate"
    />

    <TopicModal
      v-if="showTopicModal"
      @saved="onTopicCreated"
      @close="showTopicModal = false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Survey management shell.
 *
 * Layout: hero + the (global) KPI row + three tabs —
 *   المواضيع     topic cards / tree / relationship map
 *   غير مجمّعة    surveys with no topic, full survey filters
 *   الكل          every survey, full survey filters (the original view)
 *
 * The survey list itself lives in SurveyListPanel so the Ungrouped tab, the All tab
 * and the topic page share one implementation of filtering, search, sorting,
 * pagination, bulk actions and the survey modals.
 */
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/useAppStore'
import { useSimpleAuth } from '@/composables/useSimpleAuth'
import { surveyService } from '@/services/surveyService'
import type { SurveyAnalytics, PredefinedTemplate, SurveyTemplate, RecentSurvey } from '@/types/survey.types'
import type { SurveyTopic } from '@/types/topic.types'
import SurveyKpiRow from '@/components/Survey/SurveyKpiRow.vue'
import SurveyListPanel from '@/components/Survey/SurveyListPanel.vue'
import TopicsBrowser from '@/components/Topics/TopicsBrowser.vue'
import TopicModal from '@/components/Topics/TopicModal.vue'
import TemplateGalleryModal from '@/components/TemplateGalleryModal/TemplateGalleryModal.vue'

type TabKey = 'topics' | 'ungrouped' | 'all'

const router = useRouter()
const route = useRoute()
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const { user: authUser } = useSimpleAuth()
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')

const isSuperOrAdmin = computed(() => ['super_admin', 'admin'].includes(authUser.value?.role || ''))

// Global KPI block (unchanged behaviour: its own endpoint, not tab-scoped)
const analytics = ref<SurveyAnalytics | null>(null)

const activeTab = ref<TabKey>('topics')
const topicsCount = ref<number | null>(null)
const ungroupedAnalytics = ref<{ total_surveys?: number } | null>(null)
const allCount = ref<number | null>(null)

const topicsBrowserRef = ref<InstanceType<typeof TopicsBrowser> | null>(null)
const ungroupedPanelRef = ref<InstanceType<typeof SurveyListPanel> | null>(null)
const allPanelRef = ref<InstanceType<typeof SurveyListPanel> | null>(null)

const tabRefs = ref<HTMLElement[]>([])
const setTabRef = (el: any, index: number) => {
  if (el) tabRefs.value[index] = el as HTMLElement
}

const tabs = computed(() => [
  {
    key: 'topics' as TabKey,
    label: t('survey.topics.tabs.topics'),
    icon: 'fa-folder-tree',
    count: topicsCount.value,
  },
  {
    key: 'ungrouped' as TabKey,
    label: t('survey.topics.tabs.ungrouped'),
    icon: 'fa-inbox',
    count: ungroupedAnalytics.value?.total_surveys ?? null,
  },
  {
    key: 'all' as TabKey,
    label: t('survey.topics.tabs.all'),
    icon: 'fa-clipboard-list',
    count: allCount.value ?? analytics.value?.total_surveys ?? null,
  },
])

// ── Tabs ──────────────────────────────────────────────────────────────────
const setTab = (key: TabKey) => {
  if (activeTab.value === key) return
  activeTab.value = key
  const query = { ...route.query, tab: key }
  if (key === 'topics') delete (query as any).tab
  router.replace({ query }).catch(() => {})
}

const onTabKeydown = (event: KeyboardEvent, index: number) => {
  const forward = isRTL.value ? 'ArrowLeft' : 'ArrowRight'
  const backward = isRTL.value ? 'ArrowRight' : 'ArrowLeft'
  let next = -1
  if (event.key === forward) next = (index + 1) % tabs.value.length
  else if (event.key === backward) next = (index - 1 + tabs.value.length) % tabs.value.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = tabs.value.length - 1
  if (next < 0) return
  event.preventDefault()
  setTab(tabs.value[next].key)
  nextTick(() => tabRefs.value[next]?.focus())
}

// ── Data ──────────────────────────────────────────────────────────────────
const loadAnalytics = async () => {
  try {
    const response = await surveyService.getAnalyticsDashboard()
    analytics.value = response.data
  } catch {
    // Leave the KPI row hidden rather than showing invented numbers
    analytics.value = null
  }
}

const refreshAnalytics = () => loadAnalytics()

const refreshAll = async () => {
  await loadAnalytics()
  topicsBrowserRef.value?.refresh?.()
}

const onAllAnalytics = (payload: { total_surveys?: number } | null) => {
  allCount.value = payload?.total_surveys ?? null
}

// ── Navigation ────────────────────────────────────────────────────────────
const openTopicPage = (topicId: string) => {
  router.push({ name: 'TopicSurveys', params: { topicId } })
}

const viewResponses = (surveyId: string) => {
  router.push({ name: 'SurveyResponses', params: { surveyId } })
}

const createSurveyInTopic = (topicId: string) => {
  router.push({ name: 'SurveyCreate', query: { topic: topicId } })
}

// ── Create dropdown ───────────────────────────────────────────────────────
const createButtonRef = ref<HTMLElement | null>(null)
const showCreateDropdown = ref(false)
const showTemplateGallery = ref(false)
const showTopicModal = ref(false)

const dropdownPosition = computed(() => {
  if (!createButtonRef.value) {
    return { position: 'fixed', top: '0px', left: '0px', zIndex: '9999', width: 'auto' } as const
  }
  const rect = createButtonRef.value.getBoundingClientRect()
  const style: Record<string, string> = {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    zIndex: '9999',
    minWidth: `${rect.width}px`,
  }
  if (isRTL.value) style.right = `${window.innerWidth - rect.right}px`
  else style.left = `${rect.left}px`
  return style
})

const toggleCreateDropdown = () => { showCreateDropdown.value = !showCreateDropdown.value }

const handleDropdownClickOutside = (e: MouseEvent) => {
  if (!showCreateDropdown.value) return
  const target = e.target as Element
  if (createButtonRef.value && !createButtonRef.value.contains(target)) {
    const dropdown = document.querySelector('[data-dropdown="create-survey"]')
    if (dropdown && !dropdown.contains(target)) showCreateDropdown.value = false
  }
}

const createDefaultSurvey = () => {
  showCreateDropdown.value = false
  router.push({ name: 'SurveyCreate' })
}

const createTopicFromHero = () => {
  showCreateDropdown.value = false
  showTopicModal.value = true
}

const onTopicCreated = async (topic: SurveyTopic) => {
  showTopicModal.value = false
  setTab('topics')
  await nextTick()
  topicsBrowserRef.value?.refresh?.()
  const isArabic = currentLanguage.value === 'ar'
  Swal.fire({
    icon: 'success',
    title: isArabic ? 'تم إنشاء الموضوع' : 'Topic created',
    text: isArabic ? `تم إنشاء الموضوع «${topic.name}».` : `Topic "${topic.name}" was created.`,
    confirmButtonText: isArabic ? 'موافق' : 'OK',
    confirmButtonColor: '#A17D23',
  })
}

const openTemplateGallery = () => {
  showCreateDropdown.value = false
  showTemplateGallery.value = true
}
const closeTemplateGallery = () => { showTemplateGallery.value = false }

const handleTemplateSelected = (template: PredefinedTemplate | SurveyTemplate) => {
  closeTemplateGallery()
  router.push({
    name: 'SurveyCreate',
    query: { templateId: template.id, type: 'name' in template ? 'predefined' : 'custom' },
  })
}

const handleRecentSurveySelected = (survey: RecentSurvey) => {
  closeTemplateGallery()
  router.push({ name: 'SurveyCreate', query: { templateId: survey.id, type: 'recent' } })
}

const handleCreateNewTemplate = () => {
  const isArabic = currentLanguage.value === 'ar'
  Swal.fire({
    icon: 'info',
    title: isArabic ? 'إنشاء قالب محدد مسبقاً' : 'Create Predefined Template',
    html: isArabic
      ? 'سيتم فتح محرر الإيضاحات حيث يمكنك إنشاء قالب جديد.<br><br>بعد إنشاء القالب، سيتم حفظه كقالب محدد مسبقاً متاح لجميع المستخدمين.'
      : 'The survey editor will open where you can create a new template.<br><br>After creating the template, it will be saved as a predefined template available to all users.',
    confirmButtonText: isArabic ? 'متابعة' : 'Continue',
    showCancelButton: true,
    cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
  }).then(result => {
    if (result.isConfirmed) {
      closeTemplateGallery()
      router.push({ name: 'SurveyCreate', query: { createTemplate: 'true' } })
    }
  })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(async () => {
  const tabParam = route.query.tab
  if (typeof tabParam === 'string' && ['topics', 'ungrouped', 'all'].includes(tabParam)) {
    activeTab.value = tabParam as TabKey
  }

  document.addEventListener('click', handleDropdownClickOutside)
  await loadAnalytics()

  // Post-publish redirect: open the access modal on the "All" tab
  if (route.query.openAccess === 'true' && route.query.surveyId) {
    activeTab.value = 'all'
    await nextTick()
    const surveyId = route.query.surveyId as string
    const isSubmission = route.query.isSubmission === 'true'
    await allPanelRef.value?.openAccessModalForSurvey?.(surveyId, isSubmission)
    router.replace({ name: 'SurveyControl', query: {} }).catch(() => {})
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleDropdownClickOutside)
})
</script>

<style module src="./SurveyControl.module.css"></style>
