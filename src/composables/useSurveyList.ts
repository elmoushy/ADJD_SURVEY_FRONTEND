// Shared survey-list state: filters, search, sorting, pagination, selection and
// the KPI block that the list endpoint returns.
//
// Extracted from SurveyControl.vue so the exact same behaviour backs all three
// places a survey list appears:
//   - the "All" tab            -> no topic scope
//   - the "Ungrouped" tab      -> topic: 'none'
//   - a topic page             -> topic: '<uuid>' (+ includeDescendants)
//
// The topic scope is applied server-side, which also means searching inside a
// topic only decrypts that topic's rows on the backend.

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { surveyService } from '@/services/surveyService'
import { apiClient } from '@/services/jwtAuthService'
import type { Survey } from '@/types/survey.types'

export interface SurveyListAnalytics {
  total_surveys: number
  active_surveys: number
  total_responses: number
  avg_response_rate?: number
  trends?: { total?: number; active?: number; responses?: number }
}

export interface UseSurveyListOptions {
  /** 'none' for ungrouped, a topic uuid, or undefined for every survey. */
  topic?: () => string | undefined
  /** Include sub-topics when a topic uuid is scoped. */
  includeDescendants?: () => boolean
  /** Mirror page/filters into the URL (so browser Back restores the list). */
  syncUrl?: boolean
  /** Load the admin group dropdown used by the group filter. */
  loadGroupOptions?: boolean
}

// Query keys this composable owns in the URL; anything else is preserved.
const LIST_QUERY_KEYS = [
  'page', 'per_page', 'search', 'survey_status', 'sort_by', 'group', 'lifecycle_status',
]

export function useSurveyList(options: UseSurveyListOptions = {}) {
  const route = useRoute()
  const router = useRouter()

  const surveys = ref<Survey[]>([])
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  // Filters
  const searchQuery = ref('')
  const debouncedSearch = ref('')
  const selectedFilter = ref('all')
  const selectedSort = ref('newest')
  const selectedGroup = ref('')
  const selectedLifecycleStatus = ref('')
  const groups = ref<{ id: number; name: string }[]>([])

  // Pagination
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const totalPages = ref(0)
  const totalItems = ref(0)
  const hasNext = ref(false)
  const hasPrevious = ref(false)

  // Selection
  const selectedSurveys = ref<string[]>([])

  // KPI block returned alongside the results (scoped to the active topic filter)
  const listAnalytics = ref<SurveyListAnalytics | null>(null)

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

  const pagination = computed(() => ({
    currentPage: currentPage.value,
    pageSize: itemsPerPage.value,
    total: totalItems.value,
    totalPages: totalPages.value,
    hasNext: hasNext.value,
    hasPrevious: hasPrevious.value,
  }))

  const paginationRange = computed(() => {
    if (totalItems.value === 0) return { start: 0, end: 0 }
    const start = (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
    return { start, end }
  })

  const visiblePages = computed(() => {
    const pages: number[] = []
    if (totalPages.value <= 7) {
      for (let i = 1; i <= totalPages.value; i++) pages.push(i)
    } else {
      pages.push(1)
      const start = Math.max(2, currentPage.value - 2)
      const end = Math.min(totalPages.value - 1, currentPage.value + 2)
      if (start > 2) pages.push(-1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages.value - 1) pages.push(-1)
      if (totalPages.value > 1) pages.push(totalPages.value)
    }
    return pages
  })

  const hasActiveFilters = computed(() =>
    Boolean(
      debouncedSearch.value.trim() ||
      (selectedFilter.value && selectedFilter.value !== 'all') ||
      selectedGroup.value ||
      selectedLifecycleStatus.value
    )
  )

  // ── Loading ───────────────────────────────────────────────────────────────
  const buildParams = () => {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      per_page: itemsPerPage.value,
    }
    if (debouncedSearch.value.trim()) params.search = debouncedSearch.value.trim()
    if (selectedFilter.value && selectedFilter.value !== 'all') params.survey_status = selectedFilter.value
    if (selectedSort.value) params.sort_by = selectedSort.value
    if (selectedGroup.value) params.shared_group = selectedGroup.value
    if (selectedLifecycleStatus.value) params.lifecycle_status = selectedLifecycleStatus.value

    const topic = options.topic?.()
    if (topic) {
      params.topic = topic
      if (options.includeDescendants?.()) params.include_descendants = '1'
    }
    return params
  }

  const loadSurveys = async (resetPage = false) => {
    try {
      isLoading.value = true
      loadError.value = null
      if (resetPage) currentPage.value = 1

      const response = await surveyService.getAllSurveys(buildParams())

      if (response && 'results' in response) {
        surveys.value = (response.results || [])
          .filter((s: Survey) => s && s.id)
          .map((s: Survey) => ({ ...s, questions: s.questions || [] }))

        totalPages.value = response.total_pages || 0
        const totalCount = response.count ?? response.results?.length ?? 0
        totalItems.value = typeof totalCount === 'number' ? totalCount : 0
        itemsPerPage.value = response.per_page ?? itemsPerPage.value
        currentPage.value = response.current_page ?? currentPage.value
        if (totalPages.value === 0 && totalItems.value > 0 && itemsPerPage.value > 0) {
          totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value)
        }
        hasNext.value = !!response.next
        hasPrevious.value = !!response.previous

        // KPI block: already scoped by the backend to the active topic filter
        if (response.total_surveys !== undefined) {
          listAnalytics.value = {
            total_surveys: response.total_surveys ?? 0,
            active_surveys: response.active_surveys ?? 0,
            total_responses: response.total_responses ?? 0,
            avg_response_rate: response.avg_response_rate,
            trends: response.trends,
          }
        }
      } else {
        surveys.value = []
        totalPages.value = 0
        totalItems.value = 0
        hasNext.value = false
        hasPrevious.value = false
      }
    } catch (error: any) {
      // Show a real (empty + error) state rather than placeholder surveys.
      surveys.value = []
      totalPages.value = 0
      totalItems.value = 0
      hasNext.value = false
      hasPrevious.value = false
      loadError.value = error?.message || 'Failed to load surveys'
    } finally {
      isLoading.value = false
      // Drop selections that are no longer on screen
      const visible = new Set(surveys.value.map(s => s.id))
      selectedSurveys.value = selectedSurveys.value.filter(id => visible.has(id))
      if (options.syncUrl) syncUrlQuery()
    }
  }

  const loadGroups = async () => {
    if (!options.loadGroupOptions) return
    try {
      const res = await apiClient.get('/auth/groups/dropdown/')
      const data = res.data?.groups || res.data?.data?.groups || res.data?.data || res.data?.results || []
      groups.value = Array.isArray(data) ? data : []
    } catch {
      groups.value = []
    }
  }

  // ── Filter / sort / paginate handlers ─────────────────────────────────────
  const handleSearch = () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => {
      debouncedSearch.value = searchQuery.value
      loadSurveys(true)
    }, 500)
  }

  const applyFilters = () => loadSurveys(true)
  const applySorting = () => loadSurveys(true)

  const resetFilters = () => {
    searchQuery.value = ''
    debouncedSearch.value = ''
    selectedFilter.value = 'all'
    selectedSort.value = 'newest'
    selectedGroup.value = ''
    selectedLifecycleStatus.value = ''
    loadSurveys(true)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      loadSurveys()
    }
  }

  const changePage = (page: number) => {
    if (page === currentPage.value) return
    goToPage(page)
  }

  // ── Selection ────────────────────────────────────────────────────────────
  const toggleSurveySelection = (id: string) => {
    const idx = selectedSurveys.value.indexOf(id)
    if (idx > -1) selectedSurveys.value.splice(idx, 1)
    else selectedSurveys.value.push(id)
  }

  const toggleSelectAll = () => {
    const current = surveys.value
    if (selectedSurveys.value.length === current.length && current.length > 0) selectedSurveys.value = []
    else selectedSurveys.value = current.map(s => s.id)
  }

  const clearSelection = () => { selectedSurveys.value = [] }

  const selectedSurveyObjects = computed(() =>
    surveys.value.filter(s => selectedSurveys.value.includes(s.id))
  )

  // ── URL state ────────────────────────────────────────────────────────────
  const buildListQuery = (): Record<string, string> => {
    const q: Record<string, string> = {}
    if (currentPage.value > 1) q.page = String(currentPage.value)
    if (itemsPerPage.value && itemsPerPage.value !== 10) q.per_page = String(itemsPerPage.value)
    if (debouncedSearch.value.trim()) q.search = debouncedSearch.value.trim()
    if (selectedFilter.value && selectedFilter.value !== 'all') q.survey_status = selectedFilter.value
    if (selectedSort.value && selectedSort.value !== 'newest') q.sort_by = selectedSort.value
    if (selectedGroup.value) q.group = selectedGroup.value
    if (selectedLifecycleStatus.value) q.lifecycle_status = selectedLifecycleStatus.value
    return q
  }

  const syncUrlQuery = () => {
    const preserved: Record<string, any> = {}
    for (const [key, value] of Object.entries(route.query)) {
      if (!LIST_QUERY_KEYS.includes(key)) preserved[key] = value
    }
    router.replace({ query: { ...preserved, ...buildListQuery() } }).catch(() => {})
  }

  const restoreListStateFromQuery = () => {
    const q = route.query
    const page = Number(q.page)
    if (!Number.isNaN(page) && page > 0) currentPage.value = page
    const perPage = Number(q.per_page)
    if (!Number.isNaN(perPage) && perPage > 0) itemsPerPage.value = perPage
    if (typeof q.search === 'string') {
      searchQuery.value = q.search
      debouncedSearch.value = q.search
    }
    if (typeof q.survey_status === 'string') selectedFilter.value = q.survey_status
    if (typeof q.sort_by === 'string') selectedSort.value = q.sort_by
    if (typeof q.group === 'string') selectedGroup.value = q.group
    if (typeof q.lifecycle_status === 'string') selectedLifecycleStatus.value = q.lifecycle_status
  }

  // Re-load when the topic scope changes (e.g. the sub-topics toggle on a topic page)
  if (options.topic || options.includeDescendants) {
    watch(
      () => [options.topic?.(), options.includeDescendants?.()],
      (next, previous) => {
        if (JSON.stringify(next) === JSON.stringify(previous)) return
        loadSurveys(true)
      }
    )
  }

  const dispose = () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  }

  return {
    // state
    surveys,
    isLoading,
    loadError,
    searchQuery,
    debouncedSearch,
    selectedFilter,
    selectedSort,
    selectedGroup,
    selectedLifecycleStatus,
    groups,
    selectedSurveys,
    selectedSurveyObjects,
    listAnalytics,
    // pagination
    pagination,
    paginationRange,
    visiblePages,
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    hasActiveFilters,
    // actions
    loadSurveys,
    loadGroups,
    handleSearch,
    applyFilters,
    applySorting,
    resetFilters,
    changePage,
    goToPage,
    toggleSurveySelection,
    toggleSelectAll,
    clearSelection,
    restoreListStateFromQuery,
    syncUrlQuery,
    dispose,
  }
}
