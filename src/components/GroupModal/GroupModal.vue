<template>
  <div v-if="visible" :class="$style.modalOverlay" @click.self="$emit('close')">
    <div :class="$style.modal" :dir="isRTL ? 'rtl' : 'ltr'">
      <div :class="$style.modalHeader">
        <h3 :class="$style.modalTitle">{{ getModalTitle() }}</h3>
        <button :class="$style.closeBtn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div :class="$style.modalBody">
        <!-- VIEW MODE: show members and admins -->
        <div v-if="mode.type === 'view'">
          <div :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.forms.group.name') }}</label>
            <div :class="$style.viewValue">{{ formData.name }}</div>
          </div>

          <!-- Loading group details -->
          <div v-if="loadingDetails" :class="$style.loadingUsers">
            <i class="fas fa-spinner fa-spin"></i>
            {{ t('common.loading') }}...
          </div>

          <template v-else>
            <!-- Admins Section -->
            <div :class="$style.membersSection">
              <div :class="$style.membersSectionHeader">
                <i class="fas fa-user-shield" :class="$style.sectionIcon"></i>
                <span>{{ isRTL ? 'مديرو المجموعة' : 'Group Admins' }}</span>
                <span :class="$style.membersBadge">{{ groupAdmins.length }}</span>
              </div>
              <div v-if="groupAdmins.length > 0" :class="$style.membersList">
                <div v-for="member in groupAdmins" :key="member.id" :class="$style.memberItem">
                  <div :class="$style.memberAvatar">{{ getInitials(member.full_name) }}</div>
                  <div :class="$style.memberInfo">
                    <div :class="$style.memberName">{{ member.full_name }}</div>
                    <div :class="$style.memberEmail">{{ member.email }}</div>
                  </div>
                  <span :class="[$style.memberTag, $style.adminTag]">
                    {{ isRTL ? 'مدير' : 'Admin' }}
                  </span>
                  <button
                    :class="$style.removeUserBtn"
                    @click="handleRemoveUser(member.id)"
                    :disabled="removingUserId === member.id"
                    :title="isRTL ? 'إزالة من المجموعة' : 'Remove from group'"
                  >
                    <i :class="removingUserId === member.id ? 'fas fa-spinner fa-spin' : 'fas fa-user-minus'"></i>
                  </button>
                </div>
              </div>
              <div v-else :class="$style.emptyMembers">
                <i class="fas fa-user-slash"></i>
                <span>{{ isRTL ? 'لا يوجد مديرون' : 'No admins' }}</span>
              </div>
            </div>

            <!-- Members Section -->
            <div :class="$style.membersSection">
              <div :class="$style.membersSectionHeader">
                <i class="fas fa-users" :class="$style.sectionIcon"></i>
                <span>{{ isRTL ? 'أعضاء المجموعة' : 'Group Members' }}</span>
                <span :class="$style.membersBadge">{{ groupMembers.length }}</span>
              </div>
              <div v-if="groupMembers.length > 0" :class="$style.membersList">
                <div v-for="member in groupMembers" :key="member.id" :class="$style.memberItem">
                  <div :class="$style.memberAvatar">{{ getInitials(member.full_name) }}</div>
                  <div :class="$style.memberInfo">
                    <div :class="$style.memberName">{{ member.full_name }}</div>
                    <div :class="$style.memberEmail">{{ member.email }}</div>
                  </div>
                  <span :class="[$style.memberTag, $style.memberTagUser]">
                    {{ isRTL ? 'عضو' : 'Member' }}
                  </span>
                  <button
                    :class="$style.removeUserBtn"
                    @click="handleRemoveUser(member.id)"
                    :disabled="removingUserId === member.id"
                    :title="isRTL ? 'إزالة من المجموعة' : 'Remove from group'"
                  >
                    <i :class="removingUserId === member.id ? 'fas fa-spinner fa-spin' : 'fas fa-user-minus'"></i>
                  </button>
                </div>
              </div>
              <div v-else :class="$style.emptyMembers">
                <i class="fas fa-user-slash"></i>
                <span>{{ isRTL ? 'لا يوجد أعضاء' : 'No members' }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- CREATE / EDIT MODE -->
        <form v-else @submit.prevent="handleSubmit">
          <div :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.forms.group.name') }}</label>
            <input 
              v-model="formData.name"
              type="text" 
              required
              :class="[$style.input, !formData.name.trim() && formData.name !== '' ? $style.inputError : '']"
            />
          </div>
          
          <div v-if="mode.type === 'create'" :class="$style.formGroup">
            <label :class="$style.label">{{ t('userManagement.forms.group.admins') }}</label>
            <p :class="$style.helpText">{{ translations.adminHelpText }}</p>
            
            <!-- Search/Filter for Users -->
            <div :class="$style.userSearch">
              <input 
                type="text" 
                :placeholder="t('userManagement.users.searchUsers')"
                v-model="searchQuery"
                :class="$style.searchInput"
              />
            </div>
            
            <!-- Loading State -->
            <div v-if="loadingUsers" :class="$style.loadingUsers">
              <i class="fas fa-spinner fa-spin"></i>
              {{ t('common.loading') }}...
            </div>
            
            <!-- Users Checkbox List -->
            <div v-else :class="$style.usersList">
              <div 
                v-for="user in filteredUsers" 
                :key="user.id" 
                :class="$style.userCheckboxItem"
              >
                <label :class="$style.userCheckboxLabel">
                  <input 
                    type="checkbox" 
                    :value="user.id"
                    v-model="formData.admin_user_ids"
                    :class="$style.userCheckbox"
                  />
                  <div :class="$style.userInfo">
                    <div :class="$style.userName">{{ user.full_name }}</div>
                    <div :class="$style.userEmail">{{ user.email }}</div>
                    <div :class="$style.userRole">{{ user.role_display || user.role }}</div>
                  </div>
                </label>
              </div>
              
              <!-- No Users Found -->
              <div v-if="filteredUsers.length === 0" :class="$style.noUsers">
                <i class="fas fa-users"></i>
                <p>{{ t('userManagement.users.noUsersFound') }}</p>
              </div>
            </div>
            
            <!-- Selected Count -->
            <div v-if="formData.admin_user_ids.length > 0" :class="$style.selectedCount">
              {{ formData.admin_user_ids.length }} {{ translations.selectedAdmins }}
            </div>
            
            <!-- Validation Error for Admins -->
            <div v-if="props.mode.type === 'create' && formData.admin_user_ids.length === 0" :class="$style.validationError">
              <i class="fas fa-exclamation-triangle"></i>
              {{ isRTL ? 'يجب اختيار مدير واحد على الأقل' : 'At least one admin is required' }}
            </div>
          </div>
        </form>
      </div>
      
      <div :class="$style.modalFooter" v-if="mode.type !== 'view'">
        <button type="button" :class="[$style.btn, $style.cancelBtn]" @click="$emit('close')">
          {{ t('userManagement.buttons.cancel') }}
        </button>
        <button 
          type="button" 
          :class="[$style.btn, $style.saveBtn, !isFormValid ? $style.saveBtn_disabled : '']" 
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          {{ t('userManagement.buttons.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import userManagementService from '../../services/userManagementService'
import type { Group, GroupModalMode, User } from '../../types/user-management.types'

interface Props {
  mode: GroupModalMode
  group?: Group | null
}

const props = defineProps<Props>()

interface Emits {
  (e: 'save', data: any): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const store = useAppStore()
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Direct translations
const translations = computed(() => ({
  adminHelpText: isRTL.value 
    ? 'اختر المستخدمين الذين سيكونوا مديري هذه المجموعة (مطلوب مدير واحد على الأقل)'
    : 'Select users who will be administrators of this group (at least one admin is required)',
  selectedAdmins: isRTL.value
    ? 'مدير(اء) محدد'
    : 'admin(s) selected'
}))

const visible = computed(() => true)
const searchQuery = ref('')
const loadingUsers = ref(false)
const loadingDetails = ref(false)
const allUsers = ref<User[]>([])

// View mode: detailed members/admins from API
const groupDetails = ref<{ user_groups: Array<{ user: { id: number; full_name: string; email: string }; is_group_admin: boolean }> } | null>(null)
const removingUserId = ref<number | null>(null)

const groupAdmins = computed(() =>
  (groupDetails.value?.user_groups ?? [])
    .filter(ug => ug.is_group_admin)
    .map(ug => ug.user)
)

const groupMembers = computed(() =>
  (groupDetails.value?.user_groups ?? [])
    .filter(ug => !ug.is_group_admin)
    .map(ug => ug.user)
)

const getInitials = (name: string) => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')
}

const formData = ref({
  name: '',
  description: '',
  admin_user_ids: [] as number[]
})

// Form validation computed property
const isFormValid = computed(() => {
  if (!formData.value.name.trim()) return false
  if (props.mode.type === 'create' && formData.value.admin_user_ids.length === 0) return false
  return true
})

const filteredUsers = computed(() => {
  if (!searchQuery.value) return allUsers.value
  return allUsers.value.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const getModalTitle = () => {
  switch (props.mode.type) {
    case 'create': return t.value('userManagement.modals.group.create.title')
    case 'edit': return t.value('userManagement.modals.group.edit.title')
    case 'view': return t.value('userManagement.modals.group.view.title')
    default: return ''
  }
}

const loadUsers = async () => {
  try {
    loadingUsers.value = true
    const response = await userManagementService.getUsers()
    allUsers.value = response.users
  } catch (error) {
    // error loading users
  } finally {
    loadingUsers.value = false
  }
}

const loadGroupDetails = async () => {
  if (!props.group?.id) return
  try {
    loadingDetails.value = true
    const data = await userManagementService.getGroupDetails(props.group.id)
    groupDetails.value = data as any
  } catch (error) {
    // error loading group details
  } finally {
    loadingDetails.value = false
  }
}

const handleRemoveUser = async (userId: number) => {
  if (!props.group?.id || removingUserId.value !== null) return
  removingUserId.value = userId
  try {
    await userManagementService.removeUserFromGroup(props.group.id, userId)
    await loadGroupDetails()
  } catch (err) {
    // removal failed
  } finally {
    removingUserId.value = null
  }
}

const handleSubmit = () => {
  if (!isFormValid.value) return
  
  const submitData = {
    name: formData.value.name.trim(),
    description: formData.value.description
  }
  
  if (props.mode.type === 'create') {
    emit('save', { ...submitData, admin_user_ids: formData.value.admin_user_ids })
  } else {
    emit('save', submitData)
  }
}

onMounted(() => {
  if (props.mode.type === 'create') {
    loadUsers()
  } else if (props.mode.type === 'view') {
    loadGroupDetails()
  }
})

watch(() => props.group, (group) => {
  if (group) {
    formData.value = { name: group.name, description: group.description || '', admin_user_ids: [] }
  } else {
    formData.value = { name: '', description: '', admin_user_ids: [] }
  }
  // Refresh details whenever the group changes in view mode
  if (props.mode.type === 'view') {
    loadGroupDetails()
  }
}, { immediate: true })
</script>

<style module>
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal {
  background: var(--bg-card);
  border-radius: 16px;
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  box-shadow: 0 8px 32px var(--shadow-color);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.removeUserBtn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--danger, #ef4444);
  cursor: pointer;
  padding: 4px 7px;
  margin-inline-start: auto;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
}

.removeUserBtn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--danger, #ef4444);
}

.removeUserBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modalHeader {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modalTitle {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
}

.closeBtn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.closeBtn:hover {
  background: var(--bg-glass);
  color: var(--text-primary);
}

.modalBody {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.formGroup {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.input,
.textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(207, 163, 101, 0.1);
}

.inputError {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
}

.userSelection {
  position: relative;
}

.userSearch {
  margin-bottom: 1rem;
}

.searchInput {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.searchInput:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(207, 163, 101, 0.1);
}

.loadingUsers {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.usersList {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.userCheckboxItem {
  border-bottom: 1px solid var(--border-color);
}

.userCheckboxItem:last-child {
  border-bottom: none;
}

.userCheckboxLabel {
  display: flex;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 1rem;
}

.userCheckboxLabel:hover {
  background: var(--bg-glass);
}

.userCheckbox {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.userInfo {
  flex: 1;
}

.userName {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.userEmail {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.userRole {
  color: var(--text-muted);
  font-size: 0.8rem;
  background: var(--bg-glass);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
}

.noUsers {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.noUsers i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.selectedCount {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--accent-primary);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: center;
}

.validationError {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 6px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.validationError i {
  font-size: 0.9rem;
}

.helpText {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.searchResults {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
  z-index: 10;
}

.searchResultItem {
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.searchResultItem:hover {
  background: var(--bg-glass);
}

.selectedAdmins {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.selectedAdmin {
  background: var(--accent-primary);
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.removeBtn {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.removeBtn:hover {
  background: rgba(0, 0, 0, 0.2);
}

.modalFooter {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancelBtn {
  background: var(--bg-glass);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.cancelBtn:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.saveBtn {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
}

.saveBtn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(207, 163, 101, 0.3);
}

.saveBtn_disabled {
  background: var(--bg-glass) !important;
  color: var(--text-muted) !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

/* View mode styles */
.viewValue {
  padding: 0.75rem;
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
}

.membersSection {
  margin-bottom: 1.25rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.membersSectionHeader {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: var(--bg-glass);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.sectionIcon {
  color: var(--accent-primary);
}

.membersBadge {
  margin-inline-start: auto;
  background: var(--accent-primary);
  color: #fff;
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 700;
  min-width: 22px;
  text-align: center;
}

.membersList {
  max-height: 220px;
  overflow-y: auto;
}

.memberItem {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.15s;
}

.memberItem:last-child {
  border-bottom: none;
}

.memberItem:hover {
  background: var(--bg-glass);
}

.memberAvatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.memberInfo {
  flex: 1;
  min-width: 0;
}

.memberName {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memberEmail {
  color: var(--text-muted);
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memberTag {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.adminTag {
  background: rgba(174, 93, 90, 0.12);
  color: #AE5D5A;
  border: 1px solid rgba(174, 93, 90, 0.25);
}

.memberTagUser {
  background: rgba(207, 163, 101, 0.12);
  color: var(--accent-primary);
  border: 1px solid rgba(207, 163, 101, 0.25);
}

.emptyMembers {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  justify-content: center;
}

.saveBtn:disabled {
  transform: none !important;
  box-shadow: none !important;
}
</style>
