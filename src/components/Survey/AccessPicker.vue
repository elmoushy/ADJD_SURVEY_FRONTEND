<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { accessPickerService } from '@/services/accessPickerService'
import type { SharedAudience } from '@/types/survey.types'

type UserItem  = SharedAudience['users'][number]
type GroupItem = SharedAudience['groups'][number]

const props = defineProps<{
  initialUsers?: UserItem[]
  initialGroups?: GroupItem[]
}>()

const emit = defineEmits<{
  change: [{ users: UserItem[]; groups: GroupItem[] }]
}>()

const { t } = useI18n()

type Tab = 'users' | 'groups'
const activeTab = ref<Tab>('users')
const q = ref('')
const allResults = ref<SharedAudience>({ users: [], groups: [] })
const selectedUsers = ref<UserItem[]>([...(props.initialUsers ?? [])])
const selectedGroups = ref<GroupItem[]>([...(props.initialGroups ?? [])])
const loading = ref(false)
let debounceTimer: ReturnType<typeof setTimeout>

const visibleUsers = computed(() => allResults.value.users)
const visibleGroups = computed(() => allResults.value.groups)

const selectionSummary = computed(() => {
  const parts: string[] = []
  if (selectedUsers.value.length)  parts.push(`${selectedUsers.value.length} ${t('access.sectionUsers')}`)
  if (selectedGroups.value.length) parts.push(`${selectedGroups.value.length} ${t('access.sectionGroups')}`)
  return parts.join(' · ')
})

async function fetchResults(val: string) {
  loading.value = true
  try {
    allResults.value = await accessPickerService.search(val)
  } catch {
    allResults.value = { users: [], groups: [] }
  } finally {
    loading.value = false
  }
}

watch(q, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchResults(val), 250)
})

onMounted(() => fetchResults(''))

function isUserSelected(id: number) {
  return selectedUsers.value.some(u => u.id === id)
}
function isGroupSelected(id: number) {
  return selectedGroups.value.some(g => g.id === id)
}

function toggleUser(u: UserItem) {
  const idx = selectedUsers.value.findIndex(x => x.id === u.id)
  if (idx === -1) selectedUsers.value.push(u)
  else selectedUsers.value.splice(idx, 1)
  emit('change', { users: selectedUsers.value, groups: selectedGroups.value })
}

function toggleGroup(g: GroupItem) {
  const idx = selectedGroups.value.findIndex(x => x.id === g.id)
  if (idx === -1) selectedGroups.value.push(g)
  else selectedGroups.value.splice(idx, 1)
  emit('change', { users: selectedUsers.value, groups: selectedGroups.value })
}

function removeUser(id: number) {
  selectedUsers.value = selectedUsers.value.filter(u => u.id !== id)
  emit('change', { users: selectedUsers.value, groups: selectedGroups.value })
}

function removeGroup(id: number) {
  selectedGroups.value = selectedGroups.value.filter(g => g.id !== id)
  emit('change', { users: selectedUsers.value, groups: selectedGroups.value })
}
</script>

<template>
  <div :class="$style.picker">

    <!-- Tab toggle -->
    <div :class="$style.tabBar">
      <button
        :class="[$style.tab, activeTab === 'users' && $style.tabActive]"
        @click="activeTab = 'users'"
        type="button"
      >
        <i class="fas fa-user"></i>
        {{ t('access.sectionUsers') }}
        <span v-if="selectedUsers.length" :class="$style.tabBadge">{{ selectedUsers.length }}</span>
      </button>
      <button
        :class="[$style.tab, activeTab === 'groups' && $style.tabActive]"
        @click="activeTab = 'groups'"
        type="button"
      >
        <i class="fas fa-users"></i>
        {{ t('access.sectionGroups') }}
        <span v-if="selectedGroups.length" :class="$style.tabBadge">{{ selectedGroups.length }}</span>
      </button>
    </div>

    <!-- Search input -->
    <div :class="$style.searchWrap">
      <i class="fas fa-search" :class="$style.searchIcon"></i>
      <input
        v-model="q"
        :class="$style.searchInput"
        :placeholder="activeTab === 'users' ? t('access.searchUsers') : t('access.searchGroups')"
        autocomplete="off"
      />
      <div v-if="loading" :class="$style.spinner"></div>
    </div>

    <!-- List panel -->
    <div :class="$style.listPanel">

      <!-- USERS tab -->
      <template v-if="activeTab === 'users'">
        <div v-if="visibleUsers.length === 0 && !loading" :class="$style.empty">
          <i class="fas fa-user-slash"></i>
          {{ t('access.noResults') }}
        </div>
        <div
          v-for="u in visibleUsers"
          :key="u.id"
          :class="[$style.row, isUserSelected(u.id) && $style.rowSelected]"
          @click="toggleUser(u)"
        >
          <span :class="$style.avatarUser">{{ (u.full_name || u.email).charAt(0).toUpperCase() }}</span>
          <div :class="$style.rowInfo">
            <span :class="$style.rowMain">{{ u.email }}</span>
            <span :class="$style.rowSub">{{ u.full_name }}</span>
          </div>
          <span :class="[$style.check, isUserSelected(u.id) && $style.checkActive]">
            <i class="fas fa-check"></i>
          </span>
        </div>
      </template>

      <!-- GROUPS tab -->
      <template v-if="activeTab === 'groups'">
        <div v-if="visibleGroups.length === 0 && !loading" :class="$style.empty">
          <i class="fas fa-layer-group"></i>
          {{ t('access.noResults') }}
        </div>
        <div
          v-for="g in visibleGroups"
          :key="g.id"
          :class="[$style.row, isGroupSelected(g.id) && $style.rowSelected]"
          @click="toggleGroup(g)"
        >
          <span :class="$style.avatarGroup"><i class="fas fa-users"></i></span>
          <div :class="$style.rowInfo">
            <span :class="$style.rowMain">{{ g.name }}</span>
            <span :class="$style.rowSub">{{ g.member_count }} {{ t('access.members') }}</span>
          </div>
          <span :class="[$style.check, isGroupSelected(g.id) && $style.checkActive]">
            <i class="fas fa-check"></i>
          </span>
        </div>
      </template>

    </div>

    <!-- Selection summary bar -->
    <div v-if="selectedUsers.length || selectedGroups.length" :class="$style.summaryBar">
      <span :class="$style.summaryText">
        <i class="fas fa-check-circle"></i>
        {{ selectionSummary }}
      </span>
    </div>

    <!-- Selected chips -->
    <div v-if="selectedUsers.length || selectedGroups.length" :class="$style.chips">
      <span
        v-for="u in selectedUsers"
        :key="`su-${u.id}`"
        :class="[$style.chip, $style.chipUser]"
      >
        <i class="fas fa-user"></i>
        {{ u.email }}
        <button type="button" @click.stop="removeUser(u.id)" :class="$style.chipRemove">✕</button>
      </span>
      <span
        v-for="g in selectedGroups"
        :key="`sg-${g.id}`"
        :class="[$style.chip, $style.chipGroup]"
      >
        <i class="fas fa-users"></i>
        {{ g.name }}
        <button type="button" @click.stop="removeGroup(g.id)" :class="$style.chipRemove">✕</button>
      </span>
    </div>

    <!-- Privacy hint when groups are selected -->
    <p v-if="selectedGroups.length" :class="$style.hint">
      <i class="fas fa-info-circle"></i>
      {{ t('access.groupPrivacyHint') }}
    </p>

  </div>
</template>

<style module>
/* ── Container ─────────────────────────────────────────────────── */
.picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Tab toggle bar ────────────────────────────────────────────── */
.tabBar {
  display: flex;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
}

.tab:hover {
  color: #374151;
  background: rgba(255,255,255,0.6);
}

.tabActive {
  background: #fff;
  color: #1a6fa8;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.tabBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #1a6fa8;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

/* ── Search ────────────────────────────────────────────────────── */
.searchWrap {
  position: relative;
}

.searchIcon {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 13px;
  pointer-events: none;
}

.searchInput {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 9px 36px 9px 12px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.searchInput:focus {
  outline: none;
  border-color: #1a6fa8;
  box-shadow: 0 0 0 3px rgba(26,111,168,0.08);
}

.spinner {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border: 2px solid #e5e7eb;
  border-top-color: #1a6fa8;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

/* ── List panel ────────────────────────────────────────────────── */
.listPanel {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  color: #9ca3af;
  font-size: 13px;
}

.empty i {
  font-size: 22px;
  opacity: 0.4;
}

/* ── Row item ──────────────────────────────────────────────────── */
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid #f3f4f6;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: #f9fafb;
}

.rowSelected {
  background: #eff6ff !important;
}

/* avatars */
.avatarUser {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.avatarGroup {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #d1fae5;
  color: #065f46;
  font-size: 13px;
  flex-shrink: 0;
}

.rowInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rowMain {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rowSub {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* checkmark */
.check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  flex-shrink: 0;
  transition: all 0.15s;
  color: transparent;
  font-size: 10px;
}

.checkActive {
  background: #1a6fa8;
  border-color: #1a6fa8;
  color: #fff;
}

/* ── Summary bar ───────────────────────────────────────────────── */
.summaryBar {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 12px;
  color: #1d4ed8;
  font-weight: 500;
}

.summaryText {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Chips ─────────────────────────────────────────────────────── */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 20px;
  padding: 4px 8px 4px 10px;
  font-size: 12px;
  font-weight: 500;
  max-width: 200px;
}

.chipUser {
  background: #dbeafe;
  color: #1d4ed8;
}

.chipGroup {
  background: #d1fae5;
  color: #065f46;
}

.chip i {
  font-size: 10px;
  opacity: 0.7;
}

.chipRemove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  opacity: 0.5;
  padding: 0;
  line-height: 1;
  color: inherit;
  margin-left: 2px;
}

.chipRemove:hover {
  opacity: 1;
}

/* ── Privacy hint ──────────────────────────────────────────────── */
.hint {
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
}
</style>
