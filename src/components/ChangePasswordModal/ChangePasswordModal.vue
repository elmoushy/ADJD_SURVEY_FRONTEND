<template>
  <Teleport to="body">
    <div v-if="visible" :class="$style.modalOverlay" @click.self="handleClose">
      <div :class="$style.modal" :data-theme="currentTheme">
        <div :class="$style.modalHeader">
          <h2 :class="$style.modalTitle">
            <i class="fas fa-key"></i>
            {{ t('userManagement.changePassword.title') }}
          </h2>
          <button :class="$style.closeBtn" @click="handleClose" :aria-label="t('common.close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" :class="$style.modalBody">
          <!-- Old Password -->
          <div :class="$style.formGroup">
            <label :class="$style.label">
              <i class="fas fa-lock"></i>
              {{ t('userManagement.changePassword.oldPassword') }}
            </label>
            <div :class="$style.inputWrapper">
              <input
                v-model="form.oldPassword"
                :type="showOldPassword ? 'text' : 'password'"
                :class="[$style.input, { [$style.inputError]: errors.oldPassword }]"
                :placeholder="t('userManagement.changePassword.oldPasswordPlaceholder')"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                :class="$style.togglePassword"
                @click="showOldPassword = !showOldPassword"
              >
                <i :class="showOldPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <span v-if="errors.oldPassword" :class="$style.errorText">{{ errors.oldPassword }}</span>
          </div>

          <!-- New Password -->
          <div :class="$style.formGroup">
            <label :class="$style.label">
              <i class="fas fa-lock"></i>
              {{ t('userManagement.changePassword.newPassword') }}
            </label>
            <div :class="$style.inputWrapper">
              <input
                v-model="form.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                :class="[$style.input, { [$style.inputError]: errors.newPassword }]"
                :placeholder="t('userManagement.changePassword.newPasswordPlaceholder')"
                required
                minlength="8"
                autocomplete="new-password"
              />
              <button
                type="button"
                :class="$style.togglePassword"
                @click="showNewPassword = !showNewPassword"
              >
                <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <span v-if="errors.newPassword" :class="$style.errorText">{{ errors.newPassword }}</span>
            
            <!-- Password Strength Indicator -->
            <div :class="$style.strengthIndicator">
              <div :class="$style.strengthBars">
                <div 
                  v-for="i in 4" 
                  :key="i"
                  :class="[$style.strengthBar, passwordStrength >= i ? $style[`strength${passwordStrength}`] : '']"
                ></div>
              </div>
              <span :class="$style.strengthText">{{ passwordStrengthText }}</span>
            </div>
          </div>

          <!-- Confirm New Password -->
          <div :class="$style.formGroup">
            <label :class="$style.label">
              <i class="fas fa-lock"></i>
              {{ t('userManagement.changePassword.confirmPassword') }}
            </label>
            <div :class="$style.inputWrapper">
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :class="[$style.input, { [$style.inputError]: errors.confirmPassword }]"
                :placeholder="t('userManagement.changePassword.confirmPasswordPlaceholder')"
                required
                minlength="8"
                autocomplete="new-password"
              />
              <button
                type="button"
                :class="$style.togglePassword"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <span v-if="errors.confirmPassword" :class="$style.errorText">{{ errors.confirmPassword }}</span>
            
            <!-- Password Match Indicator -->
            <div v-if="form.confirmPassword" :class="$style.matchIndicator">
              <i :class="passwordsMatch ? 'fas fa-check-circle' : 'fas fa-times-circle'" 
                 :style="{ color: passwordsMatch ? '#28a745' : '#dc3545' }"></i>
              <span :style="{ color: passwordsMatch ? '#28a745' : '#dc3545' }">
                {{ passwordsMatch ? t('userManagement.changePassword.passwordsMatch') : t('userManagement.changePassword.passwordsDoNotMatch') }}
              </span>
            </div>
          </div>

          <!-- Requirements -->
          <div :class="$style.requirements">
            <p :class="$style.requirementsTitle">{{ t('userManagement.changePassword.requirements.title') }}</p>
            <ul :class="$style.requirementsList">
              <li :class="{ [$style.met]: hasMinLength }">
                <i :class="hasMinLength ? 'fas fa-check' : 'fas fa-circle'"></i>
                {{ t('userManagement.changePassword.requirements.minLength') }}
              </li>
              <li :class="{ [$style.met]: hasUppercase }">
                <i :class="hasUppercase ? 'fas fa-check' : 'fas fa-circle'"></i>
                {{ t('userManagement.changePassword.requirements.uppercase') }}
              </li>
              <li :class="{ [$style.met]: hasLowercase }">
                <i :class="hasLowercase ? 'fas fa-check' : 'fas fa-circle'"></i>
                {{ t('userManagement.changePassword.requirements.lowercase') }}
              </li>
              <li :class="{ [$style.met]: hasNumber }">
                <i :class="hasNumber ? 'fas fa-check' : 'fas fa-circle'"></i>
                {{ t('userManagement.changePassword.requirements.number') }}
              </li>
              <li :class="{ [$style.met]: hasSpecialChar }">
                <i :class="hasSpecialChar ? 'fas fa-check' : 'fas fa-circle'"></i>
                {{ t('userManagement.changePassword.requirements.special') }}
              </li>
            </ul>
          </div>
        </form>

        <div :class="$style.modalFooter">
          <button 
            type="button"
            :class="[$style.btn, $style.cancelBtn]" 
            @click="handleClose"
            :disabled="loading"
          >
            {{ t('common.cancel') }}
          </button>
          <button 
            type="submit"
            :class="[$style.btn, $style.submitBtn]"
            @click="handleSubmit"
            :disabled="!isFormValid || loading"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ loading ? t('common.saving') : t('userManagement.changePassword.submit') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { changePassword } from '../../services/userManagementService'
import Swal from 'sweetalert2'

// Props
defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

// Store
const store = useAppStore()
// @ts-ignore - Used in template
const currentTheme = computed(() => store.currentTheme)
// @ts-ignore - Used in template
const t = computed(() => store.t)

// Form state
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Computed
const passwordsMatch = computed(() => {
  return form.newPassword === form.confirmPassword && form.confirmPassword.length > 0
})

const passwordStrength = computed(() => {
  const password = form.newPassword
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
  
  return strength
})

// @ts-ignore - Used in template
const passwordStrengthText = computed(() => {
  if (passwordStrength.value === 0 || !form.newPassword) return ''
  
  const labels = {
    1: t.value('userManagement.changePassword.strength.weak'),
    2: t.value('userManagement.changePassword.strength.fair'),
    3: t.value('userManagement.changePassword.strength.good'),
    4: t.value('userManagement.changePassword.strength.strong')
  }
  return labels[passwordStrength.value as keyof typeof labels] || ''
})

// Password requirements computed properties
const hasMinLength = computed(() => form.newPassword.length >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(form.newPassword))
const hasLowercase = computed(() => /[a-z]/.test(form.newPassword))
const hasNumber = computed(() => /[0-9]/.test(form.newPassword))
const hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword))

const isFormValid = computed(() => {
  return (
    form.oldPassword.length > 0 &&
    form.newPassword.length >= 8 &&
    passwordsMatch.value &&
    !errors.oldPassword &&
    !errors.newPassword &&
    !errors.confirmPassword
  )
})

// Watchers
watch(() => form.newPassword, (newVal) => {
  if (newVal && newVal.length < 8) {
    errors.newPassword = t.value('userManagement.changePassword.errors.minLength')
  } else {
    errors.newPassword = ''
  }
  
  // Re-validate confirm password when new password changes
  if (form.confirmPassword && newVal !== form.confirmPassword) {
    errors.confirmPassword = t.value('userManagement.changePassword.errors.mismatch')
  } else if (form.confirmPassword) {
    errors.confirmPassword = ''
  }
})

watch(() => form.confirmPassword, (newVal) => {
  if (newVal && newVal !== form.newPassword) {
    errors.confirmPassword = t.value('userManagement.changePassword.errors.mismatch')
  } else {
    errors.confirmPassword = ''
  }
})

// Methods
// @ts-ignore - Used in handleClose
const resetForm = () => {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  errors.oldPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  showOldPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

// @ts-ignore - Used in template
const handleClose = () => {
  if (!loading.value) {
    resetForm()
    emit('close')
  }
}

// @ts-ignore - Used in template
const handleSubmit = async () => {
  if (!isFormValid.value || loading.value) return
  
  loading.value = true
  errors.oldPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  
  try {
    await changePassword(form.oldPassword, form.newPassword, form.confirmPassword)
    
    await Swal.fire({
      title: t.value('userManagement.changePassword.success.title'),
      text: t.value('userManagement.changePassword.success.message'),
      icon: 'success',
      confirmButtonText: t.value('common.ok'),
      confirmButtonColor: '#28a745',
      customClass: {
        popup: 'swal-rtl-popup',
        title: 'swal-rtl-title',
        htmlContainer: 'swal-rtl-content'
      }
    })
    
    resetForm()
    emit('success')
    emit('close')
  } catch (error: any) {
    let errorMessage = t.value('userManagement.changePassword.errors.failed')
    
    if (error.response?.data?.errors) {
      const serverErrors = error.response.data.errors
      
      if (serverErrors.old_password) {
        errors.oldPassword = t.value('userManagement.changePassword.errors.incorrectOldPassword')
      }
      if (serverErrors.new_password) {
        const passwordError = serverErrors.new_password[0]
        if (passwordError.includes('too common')) {
          errors.newPassword = t.value('userManagement.changePassword.errors.tooCommon')
        } else if (passwordError.includes('too similar')) {
          errors.newPassword = t.value('userManagement.changePassword.errors.tooSimilar')
        } else if (passwordError.includes('only numbers')) {
          errors.newPassword = t.value('userManagement.changePassword.errors.onlyNumbers')
        } else {
          errors.newPassword = passwordError
        }
      }
      if (serverErrors.new_password_confirm) {
        errors.confirmPassword = t.value('userManagement.changePassword.errors.mismatch')
      }
      if (serverErrors.non_field_errors) {
        errorMessage = serverErrors.non_field_errors[0]
      }
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    }
    
    // Only show SweetAlert if no field-specific errors
    if (!errors.oldPassword && !errors.newPassword && !errors.confirmPassword) {
      await Swal.fire({
        title: t.value('userManagement.changePassword.errors.title'),
        text: errorMessage,
        icon: 'error',
        confirmButtonText: t.value('common.ok'),
        confirmButtonColor: '#dc3545',
        customClass: {
          popup: 'swal-rtl-popup',
          title: 'swal-rtl-title',
          htmlContainer: 'swal-rtl-content'
        }
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<style module>
/* Modal Overlay */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal */
.modal {
  background: var(--modal-bg, #ffffff);
  border: 1px solid var(--border-color, rgba(161, 125, 35, 0.2));
  border-radius: 20px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
}

[data-theme="night"] .modal {
  --modal-bg: rgba(24, 26, 31, 0.98);
  --border-color: rgba(255, 255, 255, 0.12);
  --text-primary: #f8fafc;
  --text-secondary: #e2e8f0;
  --text-muted: rgba(248, 250, 252, 0.65);
  --bg-card: rgba(248, 250, 252, 0.04);
  --bg-hover: rgba(248, 250, 252, 0.08);
  --input-bg: rgba(255, 255, 255, 0.05);
}

[data-theme="light"] .modal {
  --modal-bg: #ffffff;
  --border-color: rgba(161, 125, 35, 0.2);
  --text-primary: #121011;
  --text-secondary: #5E4E3F;
  --text-muted: rgba(161, 125, 35, 0.8);
  --bg-card: rgba(255, 255, 255, 0.8);
  --bg-hover: rgba(161, 125, 35, 0.05);
  --input-bg: #f8f9fa;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Header */
.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.modalTitle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modalTitle i {
  color: #A17D23;
}

.closeBtn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.closeBtn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Body */
.modalBody {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

/* Form */
.formGroup {
  margin-bottom: 1.5rem;
}

.label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.label i {
  color: #A17D23;
  font-size: 0.85rem;
}

.inputWrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  padding: 0.875rem 3rem 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #A17D23;
  box-shadow: 0 0 0 3px rgba(161, 125, 35, 0.15);
}

.inputError {
  border-color: #dc3545 !important;
}

.togglePassword {
  position: absolute;
  left: 0.75rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1rem;
  transition: color 0.2s ease;
}

.togglePassword:hover {
  color: var(--text-primary);
}

.errorText {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #dc3545;
}

/* Strength Indicator */
.strengthIndicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.strengthBars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strengthBar {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: var(--border-color);
  transition: background 0.3s ease;
}

.strength1 { background: #dc3545; }
.strength2 { background: #ffc107; }
.strength3 { background: #28a745; }
.strength4 { background: #28a745; }

.strengthText {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  min-width: 60px;
  text-align: left;
}

/* Match Indicator */
.matchIndicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

/* Requirements */
.requirements {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
}

.requirementsTitle {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.requirementsList {
  list-style: none;
  margin: 0;
  padding: 0;
}

.requirementsList li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.requirementsList li i {
  font-size: 0.6rem;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.requirementsList li.met {
  color: #28a745;
}

.requirementsList li.met i {
  color: #28a745;
}

/* Footer */
.modalFooter {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem 2rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.cancelBtn {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.cancelBtn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.submitBtn {
  background: linear-gradient(135deg, #A17D23 0%, #B78A41 100%);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(161, 125, 35, 0.35);
}

.submitBtn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(161, 125, 35, 0.45);
}

.submitBtn:disabled,
.cancelBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 480px) {
  .modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modalHeader,
  .modalBody,
  .modalFooter {
    padding: 1rem 1.25rem;
  }

  .modalFooter {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
