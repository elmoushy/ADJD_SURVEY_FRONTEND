<template>
  <section :class="$style.panel" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <button
      type="button"
      :class="$style.header"
      :aria-expanded="isOpen"
      :aria-controls="bodyId"
      @click="isOpen = !isOpen"
    >
      <span :class="$style.headerTitle">
        <i class="fas fa-users" :class="$style.headerIcon"></i>
        {{ t('survey.topics.assignedUsers.title') }}
      </span>

      <span :class="$style.headerSummary" aria-live="polite">
        <template v-if="loading && !data">
          <span :class="$style.chip">{{ t('common.loading') }}</span>
        </template>
        <template v-else-if="data">
          <span v-if="data.mode === 'public'" :class="$style.chip">
            <i class="fas fa-globe"></i>
            {{ t('survey.topics.assignedUsers.publicShort') }}
          </span>
          <template v-else>
            <span :class="$style.chip">
              <i class="fas fa-user-group"></i>
              {{ data.total_users }} {{ t('survey.topics.assignedUsers.users') }}
            </span>
            <span v-if="data.groups.length" :class="[$style.chip, $style.chipGroup]">
              <i class="fas fa-layer-group"></i>
              {{ data.groups.length }} {{ t('survey.topics.assignedUsers.groups') }}
            </span>
            <span :class="[$style.chip, $style.chipOk]">
              <i class="fas fa-circle-check"></i>
              {{ data.responded_count }} {{ t('survey.topics.assignedUsers.responded') }}
            </span>
            <span :class="[$style.chip, $style.chipPending]">
              <i class="fas fa-clock"></i>
              {{ data.pending_count }} {{ t('survey.topics.assignedUsers.pending') }}
            </span>
          </template>
        </template>
      </span>

      <i :class="['fas', isOpen ? 'fa-chevron-up' : 'fa-chevron-down', $style.chevron]" aria-hidden="true"></i>
    </button>

    <div v-if="isOpen" :id="bodyId" :class="$style.body">
      <div v-if="error" :class="$style.error" role="alert">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button type="button" :class="$style.retryButton" @click="load()">{{ t('common.retry') }}</button>
      </div>

      <!-- Public surveys have no identifiable audience -->
      <div v-else-if="data?.mode === 'public'" :class="$style.notice">
        <i class="fas fa-circle-info"></i>
        <span>{{ t('survey.topics.assignedUsers.publicNotice') }}</span>
      </div>

      <template v-else>
        <div v-if="data?.mode === 'all_authenticated'" :class="$style.notice">
          <i class="fas fa-circle-info"></i>
          <span>
            {{ t('survey.topics.assignedUsers.allAuthNotice') }}
            <strong>{{ data.total_users }}</strong>
            {{ t('survey.topics.assignedUsers.users') }}
          </span>
        </div>

        <div v-if="data?.groups?.length" :class="$style.chipRow">
          <span :class="$style.chipRowLabel">{{ t('survey.topics.assignedUsers.groupsLabel') }}</span>
          <span v-for="group in data.groups" :key="group.id" :class="[$style.chip, $style.chipGroup]">
            <i class="fas fa-layer-group"></i>
            {{ group.name }} · {{ group.member_count }}
          </span>
        </div>

        <div v-if="showControls" :class="$style.controls">
          <input
            type="text"
            :class="$style.searchInput"
            :placeholder="t('survey.topics.assignedUsers.searchPlaceholder')"
            v-model="search"
            @input="onSearch"
          />
          <select :class="$style.statusSelect" v-model="statusFilter" @change="load(1)">
            <option value="all">{{ t('survey.topics.assignedUsers.filterAll') }}</option>
            <option value="responded">{{ t('survey.topics.assignedUsers.responded') }}</option>
            <option value="pending">{{ t('survey.topics.assignedUsers.pending') }}</option>
          </select>
        </div>

        <div v-if="loading" aria-hidden="true" style="display:flex; flex-direction:column; gap:6px;">
          <div v-for="n in 3" :key="n" :class="$style.skeletonRow"></div>
        </div>

        <ul v-else-if="data?.results?.length" :class="$style.list">
          <li v-for="user in data.results" :key="user.id" :class="$style.row">
            <span :class="$style.avatar" aria-hidden="true">{{ initials(user.name) }}</span>
            <span :class="$style.identity">
              <span :class="$style.name">{{ user.name }}</span>
              <span :class="$style.email" dir="ltr">{{ user.email }}</span>
            </span>
            <span :class="$style.rowState">
              <span v-if="user.source === 'group'" :class="[$style.chip, $style.chipGroup, $style.sourceChip]">
                {{ t('survey.topics.assignedUsers.viaGroup') }}
              </span>
              <span v-if="user.responded" :class="[$style.chip, $style.chipOk]">
                <i class="fas fa-circle-check"></i>
                {{ t('survey.topics.assignedUsers.responded') }}
                <template v-if="user.responded_at"> · <span dir="ltr">{{ user.responded_at }}</span></template>
              </span>
              <span v-else :class="[$style.chip, $style.chipPending]">
                <i class="fas fa-clock"></i>
                {{ t('survey.topics.assignedUsers.pending') }}
              </span>
            </span>
          </li>
        </ul>

        <div v-else :class="$style.notice">
          <i class="fas fa-user-slash"></i>
          <span>
            {{ search || statusFilter !== 'all'
              ? t('survey.topics.assignedUsers.noMatches')
              : t('survey.topics.assignedUsers.emptyNotice') }}
          </span>
        </div>

        <div v-if="data && data.total_pages > 1" :class="$style.pager">
          <span>
            {{ t('common.pagination.showing') }} {{ rangeStart }} - {{ rangeEnd }}
            {{ t('common.pagination.of') }} {{ data.count }}
          </span>
          <span :class="$style.pagerButtons">
            <button
              type="button"
              :class="$style.pagerButton"
              :disabled="data.current_page <= 1"
              :aria-label="t('common.pagination.previous')"
              @click="load(data.current_page - 1)"
            >
              <i :class="['fas', isRTL ? 'fa-chevron-right' : 'fa-chevron-left']"></i>
            </button>
            <button
              type="button"
              :class="$style.pagerButton"
              :disabled="data.current_page >= data.total_pages"
              :aria-label="t('common.pagination.next')"
              @click="load(data.current_page + 1)"
            >
              <i :class="['fas', isRTL ? 'fa-chevron-left' : 'fa-chevron-right']"></i>
            </button>
          </span>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * "المستخدمون المعينون" — the audience of a survey, shown at the top of the preview.
 *
 * Everything is resolved server-side (shared_with ∪ group members, plus each user's
 * responded state), searched and paginated there too, so an AUTH survey in a large
 * tenant transfers one page instead of every user. The section starts collapsed for
 * big audiences so the questions — the point of the preview — stay above the fold.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/useAppStore'
import { surveyService } from '@/services/surveyService'
import type { AssignedUsersResponse } from '@/types/topic.types'

const props = withDefaults(defineProps<{
  surveyId: string
  /** Expand immediately regardless of audience size. */
  defaultOpen?: boolean
  perPage?: number
}>(), {
  defaultOpen: false,
  perPage: 10,
})

const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const t = store.t
const isRTL = computed(() => currentLanguage.value === 'ar')

const AUTO_EXPAND_LIMIT = 12

const data = ref<AssignedUsersResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const isOpen = ref(props.defaultOpen)
const search = ref('')
const statusFilter = ref<'all' | 'responded' | 'pending'>('all')
const bodyId = `assigned-users-${Math.random().toString(36).slice(2, 9)}`

const showControls = computed(() => (data.value?.total_users ?? 0) > props.perPage)

const rangeStart = computed(() => {
  if (!data.value || data.value.count === 0) return 0
  return (data.value.current_page - 1) * data.value.per_page + 1
})
const rangeEnd = computed(() => {
  if (!data.value) return 0
  return Math.min(data.value.current_page * data.value.per_page, data.value.count)
})

const initials = (name: string) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '؟'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return `${parts[0][0]}${parts[1][0]}`
}

const load = async (page = 1) => {
  if (!props.surveyId) return
  loading.value = true
  error.value = null
  try {
    data.value = await surveyService.getAssignedUsers(props.surveyId, {
      search: search.value.trim() || undefined,
      response_status: statusFilter.value,
      page,
      per_page: props.perPage,
    })
    // Keep a big audience collapsed unless the caller asked otherwise
    if (!props.defaultOpen && page === 1 && !search.value && statusFilter.value === 'all') {
      isOpen.value = data.value.mode !== 'public' && data.value.total_users <= AUTO_EXPAND_LIMIT
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || t('survey.topics.assignedUsers.loadFailed')
  } finally {
    loading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const onSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(1), 300)
}

watch(() => props.surveyId, () => load(1))
onMounted(() => load(1))

/** Summary used by the printable/PDF header (counts + group names only). */
const printSummary = computed(() => {
  if (!data.value) return null
  return {
    mode: data.value.mode,
    total_users: data.value.total_users,
    responded_count: data.value.responded_count,
    pending_count: data.value.pending_count,
    groups: data.value.groups.map(group => group.name),
  }
})

defineExpose({ printSummary, reload: load })
</script>

<style module src="./AssignedUsersPanel.module.css"></style>
