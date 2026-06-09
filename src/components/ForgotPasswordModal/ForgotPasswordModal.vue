<template>
  <div v-if="visible" :class="styles.overlay" @click.self="step === 1 ? handleClose() : undefined">
    <div :class="styles.card" :dir="isRTL ? 'rtl' : 'ltr'">

      <!-- Close button -->
      <button v-if="step < 4" :class="styles.closeBtn" @click="handleClose" :title="isRTL ? 'إغلاق' : 'Close'">
        <svg viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <!-- Progress dots (steps 1-3) -->
      <div v-if="step < 4" :class="styles.progressBar">
        <div v-for="i in 3" :key="i"
          :class="[styles.dot, step > i ? styles.dotDone : '', step === i ? styles.dotActive : '']"
        />
      </div>

      <!-- ───────── STEP 1: Email ───────── -->
      <template v-if="step === 1">
        <div :class="styles.headerIcon">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 :class="styles.title">{{ isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?' }}</h2>
        <p :class="styles.subtitle">
          {{ isRTL
            ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق'
            : 'Enter your email and we\'ll send you a verification code' }}
        </p>

        <div :class="styles.body">
          <div :class="styles.fieldGroup">
            <label :class="styles.label">{{ isRTL ? 'البريد الإلكتروني' : 'Email Address' }}</label>
            <input
              v-model="email"
              type="email"
              dir="ltr"
              :class="[styles.input, error ? styles.inputError : '']"
              :placeholder="isRTL ? 'example@email.com' : 'example@email.com'"
              @keyup.enter="() => sendCode()"
              ref="emailInputRef"
            />
            <p v-if="error" :class="styles.errorMsg">{{ error }}</p>
          </div>

          <button
            :class="[styles.btn, styles.btnPrimary, (loading || !email.trim()) ? styles.btnDisabled : '']"
            :disabled="loading || !email.trim()"
            @click="() => sendCode()"
          >
            <svg v-if="loading" :class="styles.spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
            <span>{{ loading ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...') : (isRTL ? 'إرسال الرمز' : 'Send Code') }}</span>
          </button>
        </div>
      </template>

      <!-- ───────── STEP 2: OTP ───────── -->
      <template v-if="step === 2">
        <div :class="styles.headerIcon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8a2 2 0 012-2h14a2 2 0 012 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 :class="styles.title">{{ isRTL ? 'رمز التحقق' : 'Verification Code' }}</h2>
        <p :class="styles.subtitle">
          {{ isRTL ? 'تم إرسال رمز مكون من 6 أرقام إلى' : 'A 6-digit code was sent to' }}
          <strong>{{ email }}</strong>
        </p>

        <div :class="styles.body">
          <!-- 6-digit OTP boxes -->
          <div :class="styles.otpRow" dir="ltr">
            <input
              v-for="i in 6"
              :key="i"
              :ref="(el) => { if (el) otpRefs[i - 1] = el as HTMLInputElement }"
              :value="otpDigits[i - 1]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              :class="[styles.otpBox, error ? styles.otpBoxError : '', otpDigits[i-1] ? styles.otpBoxFilled : '']"
              @input="onOtpInput(i - 1, $event)"
              @keydown="onOtpKeydown(i - 1, $event)"
              @paste.prevent="onOtpPaste($event)"
            />
          </div>

          <p v-if="error" :class="styles.errorMsg">{{ error }}</p>

          <!-- Resend -->
          <div :class="styles.resendRow">
            <span :class="styles.resendLabel">
              {{ isRTL ? 'لم يصلك الرمز؟' : "Didn't receive the code?" }}
            </span>
            <button
              v-if="resendCountdown <= 0"
              :class="styles.resendBtn"
              :disabled="loading"
              @click="sendCode()"
            >{{ isRTL ? 'إعادة الإرسال' : 'Resend' }}</button>
            <span v-else :class="styles.resendCountdown">
              {{ isRTL ? `إعادة الإرسال بعد ${resendCountdown}s` : `Resend in ${resendCountdown}s` }}
            </span>
          </div>

          <button
            :class="[styles.btn, styles.btnPrimary, (!otpComplete || loading) ? styles.btnDisabled : '']"
            :disabled="!otpComplete || loading"
            @click="verifyCode"
          >
            <svg v-if="loading" :class="styles.spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
            <span>{{ loading ? (isRTL ? 'جارٍ التحقق...' : 'Verifying...') : (isRTL ? 'التحقق من الرمز' : 'Verify Code') }}</span>
          </button>

          <button :class="[styles.btn, styles.btnGhost]" @click="goBack">
            {{ isRTL ? 'تعديل البريد الإلكتروني' : 'Edit Email' }}
          </button>
        </div>
      </template>

      <!-- ───────── STEP 3: New Password ───────── -->
      <template v-if="step === 3">
        <div :class="styles.headerIcon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <h2 :class="styles.title">{{ isRTL ? 'كلمة المرور الجديدة' : 'New Password' }}</h2>
        <p :class="styles.subtitle">
          {{ isRTL ? 'اختر كلمة مرور قوية لحسابك' : 'Choose a strong password for your account' }}
        </p>

        <div :class="styles.body">
          <!-- New password -->
          <div :class="styles.fieldGroup">
            <label :class="styles.label">{{ isRTL ? 'كلمة المرور الجديدة' : 'New Password' }}</label>
            <div :class="styles.passwordWrap">
              <input
                v-model="newPassword"
                :type="showNew ? 'text' : 'password'"
                dir="ltr"
                :class="[styles.input, styles.inputPassword]"
                :placeholder="isRTL ? '••••••••' : '••••••••'"
              />
              <button type="button" :class="styles.eyeBtn" @click="showNew = !showNew">
                <svg v-if="showNew" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
              </button>
            </div>
          </div>

          <!-- Confirm password -->
          <div :class="styles.fieldGroup">
            <label :class="styles.label">{{ isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password' }}</label>
            <div :class="styles.passwordWrap">
              <input
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                dir="ltr"
                :class="[styles.input, styles.inputPassword, confirmPassword && !passwordsMatch ? styles.inputError : '']"
                :placeholder="isRTL ? '••••••••' : '••••••••'"
              />
              <button type="button" :class="styles.eyeBtn" @click="showConfirm = !showConfirm">
                <svg v-if="showConfirm" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
              </button>
            </div>
            <p v-if="confirmPassword && !passwordsMatch" :class="styles.errorMsg">
              {{ isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match' }}
            </p>
          </div>

          <!-- Password validation hints -->
          <ul :class="styles.hintList" v-if="newPassword">
            <li :class="newPassword.length >= 8 ? styles.hintOk : styles.hintPending">
              <svg viewBox="0 0 12 12" fill="none"><path v-if="newPassword.length >= 8" d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle v-else cx="6" cy="6" r="2" fill="currentColor"/></svg>
              {{ isRTL ? '8 أحرف على الأقل' : 'At least 8 characters' }}
            </li>
            <li :class="!/^\d+$/.test(newPassword) ? styles.hintOk : styles.hintPending">
              <svg viewBox="0 0 12 12" fill="none"><path v-if="!/^\d+$/.test(newPassword)" d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle v-else cx="6" cy="6" r="2" fill="currentColor"/></svg>
              {{ isRTL ? 'لا تكون أرقاماً فقط' : 'Not all numbers' }}
            </li>
            <li :class="passwordsMatch && confirmPassword ? styles.hintOk : styles.hintPending">
              <svg viewBox="0 0 12 12" fill="none"><path v-if="passwordsMatch && confirmPassword" d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle v-else cx="6" cy="6" r="2" fill="currentColor"/></svg>
              {{ isRTL ? 'كلمتا المرور متطابقتان' : 'Passwords match' }}
            </li>
          </ul>

          <p v-if="error" :class="styles.errorMsg">{{ error }}</p>

          <button
            :class="[styles.btn, styles.btnPrimary, !passwordValid ? styles.btnDisabled : '']"
            :disabled="!passwordValid || loading"
            @click="doResetPassword"
          >
            <svg v-if="loading" :class="styles.spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
            <span>{{ loading ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...') : (isRTL ? 'تعيين كلمة المرور' : 'Reset Password') }}</span>
          </button>
        </div>
      </template>

      <!-- ───────── STEP 4: Success ───────── -->
      <template v-if="step === 4">
        <div :class="styles.successIcon">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M7 12l3.5 3.5L17 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 :class="styles.title">{{ isRTL ? 'تم بنجاح!' : 'Success!' }}</h2>
        <p :class="styles.subtitle">
          {{ isRTL
            ? 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
            : 'Your password has been reset successfully. You can now log in with your new password.' }}
        </p>
        <div :class="styles.body">
          <button :class="[styles.btn, styles.btnPrimary]" @click="handleClose">
            {{ isRTL ? 'تسجيل الدخول' : 'Go to Login' }}
          </button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { authAPI } from '../../services/jwtAuthService'
import styles from './ForgotPasswordModal.module.css'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAppStore()
const isRTL = computed(() => store.currentLanguage === 'ar')

// ── State ──────────────────────────────────────────────────────────────────
const step = ref(1)
const email = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref<HTMLInputElement[]>([])
const resetToken = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showNew = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const error = ref('')
const resendCountdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null
const emailInputRef = ref<HTMLInputElement>()

// ── Computed ───────────────────────────────────────────────────────────────
const otpComplete = computed(() => otpDigits.value.every(d => d.length === 1))

const passwordsMatch = computed(
  () => newPassword.value === confirmPassword.value
)

const passwordValid = computed(() => {
  const p = newPassword.value
  return (
    p.length >= 8 &&
    !/^\d+$/.test(p) &&
    passwordsMatch.value &&
    confirmPassword.value.length > 0
  )
})

// ── Countdown ─────────────────────────────────────────────────────────────
const startCountdown = (seconds = 90) => {
  resendCountdown.value = seconds
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      clearInterval(countdownInterval!)
      countdownInterval = null
    }
  }, 1000)
}

// ── Step 1: send code ──────────────────────────────────────────────────────
const sendCode = async () => {
  if (!email.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    await authAPI.forgotPassword(email.value.trim())
    otpDigits.value = ['', '', '', '', '', '']
    step.value = 2
    startCountdown(90)
    await nextTick()
    otpRefs.value[0]?.focus()
  } catch (err: any) {
    if (err.type === 'rate_limit') {
      const secs = err.retryAfter || 90
      error.value = isRTL.value
        ? `يرجى الانتظار ${secs} ثانية قبل الطلب مجدداً`
        : `Please wait ${secs} seconds before requesting again`
      startCountdown(secs)
    } else {
      error.value = err.message || (isRTL.value ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'An error occurred, please try again')
    }
  } finally {
    loading.value = false
  }
}

// ── Step 2: verify OTP ────────────────────────────────────────────────────
const verifyCode = async () => {
  if (!otpComplete.value) return
  error.value = ''
  loading.value = true
  try {
    const code = otpDigits.value.join('')
    const result = await authAPI.verifyResetCode(email.value.trim(), code)
    resetToken.value = result.token
    step.value = 3
  } catch (err: any) {
    error.value = err.message || (isRTL.value ? 'الرمز غير صحيح أو منتهي الصلاحية' : 'Invalid or expired code')
    otpDigits.value = ['', '', '', '', '', '']
    await nextTick()
    otpRefs.value[0]?.focus()
  } finally {
    loading.value = false
  }
}

// ── Step 3: reset password ────────────────────────────────────────────────
const doResetPassword = async () => {
  if (!passwordValid.value) return
  error.value = ''
  loading.value = true
  try {
    await authAPI.resetPassword(resetToken.value, newPassword.value, confirmPassword.value)
    step.value = 4
  } catch (err: any) {
    error.value = err.message || (isRTL.value ? 'فشل تعيين كلمة المرور، يرجى المحاولة مجدداً' : 'Failed to reset password, please try again')
  } finally {
    loading.value = false
  }
}

// ── OTP input handlers ────────────────────────────────────────────────────
const onOtpInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')
  otpDigits.value[index] = digits.slice(-1)
  input.value = otpDigits.value[index]
  if (otpDigits.value[index] && index < 5) {
    otpRefs.value[index + 1]?.focus()
  }
  error.value = ''
}

const onOtpKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace') {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = ''
      otpRefs.value[index - 1]?.focus()
    } else {
      otpDigits.value[index] = ''
    }
  } else if (event.key === 'ArrowLeft') {
    const prev = isRTL.value ? index + 1 : index - 1
    if (prev >= 0 && prev < 6) otpRefs.value[prev]?.focus()
  } else if (event.key === 'ArrowRight') {
    const next = isRTL.value ? index - 1 : index + 1
    if (next >= 0 && next < 6) otpRefs.value[next]?.focus()
  }
}

const onOtpPaste = (event: ClipboardEvent) => {
  const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) {
    otpDigits.value[i] = pasted[i] || ''
  }
  const focusIndex = Math.min(pasted.length, 5)
  nextTick(() => otpRefs.value[focusIndex]?.focus())
}

// ── Navigation ────────────────────────────────────────────────────────────
const goBack = () => {
  error.value = ''
  step.value = 1
  otpDigits.value = ['', '', '', '', '', '']
  if (countdownInterval) clearInterval(countdownInterval)
  resendCountdown.value = 0
  nextTick(() => emailInputRef.value?.focus())
}

const handleClose = () => {
  emit('close')
}

// Reset all state when modal opens/closes
watch(() => props.visible, (v) => {
  if (!v) {
    setTimeout(() => {
      step.value = 1
      email.value = ''
      otpDigits.value = ['', '', '', '', '', '']
      resetToken.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      error.value = ''
      loading.value = false
      showNew.value = false
      showConfirm.value = false
      if (countdownInterval) clearInterval(countdownInterval)
      resendCountdown.value = 0
    }, 300)
  } else {
    nextTick(() => emailInputRef.value?.focus())
  }
})
</script>
