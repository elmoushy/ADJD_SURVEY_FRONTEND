<template>
  <div :class="styles.loginPage" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Background Elements -->
    <div :class="styles.backgroundLayer">
      <div :class="styles.floatingParticles">
        <div v-for="i in 12" :key="i" :class="styles.particle" :style="particleStyle(i)"></div>
      </div>
      <div :class="styles.gridOverlay"></div>
    </div>
    
    <!-- Main Content -->
    <div :class="styles.pageContent">
      <div :class="styles.contentWrapper">

        <!-- Unauthorized Access Card -->
        <div :class="styles.authCard">

          <!-- Card Header -->
          <div :class="styles.cardHeader">
            <div :class="[styles.welcomeBadge, styles.unauthorizedBadge]">
              <svg :class="styles.welcomeIcon" viewBox="0 0 16 16" fill="none">
                <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.5c-3.03 0-5.5-2.47-5.5-5.5S4.97 2.5 8 2.5s5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5z" fill="currentColor"/>
                <path d="M10.5 5.5L5.5 10.5M5.5 5.5l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>{{ content.badge }}</span>
            </div>
            <h1 :class="styles.title">{{ content.title }}</h1>
            <p :class="styles.subtitle">{{ content.subtitle }}</p>
          </div>

          <div :class="styles.cardBody">
            <!-- Unauthorized Message -->
            <div :class="styles.unauthorizedAlert">
              <div :class="styles.unauthorizedIndicator">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div :class="styles.unauthorizedContent">
                <h4>{{ content.alertTitle }}</h4>
                <p>{{ content.alertMessage }}</p>
              </div>
            </div>

            <!-- Login Button -->
            <div :class="styles.loginButtonContainer">
              <button 
                @click="navigateToLogin" 
                :class="styles.loginButton"
                type="button"
                :disabled="isLoggingIn"
              >
                <span :class="styles.buttonText">
                  {{ isLoggingIn ? (isRTL ? 'جاري تسجيل الدخول...' : 'Signing in...') : content.buttonText }}
                </span>
                <svg v-if="!isLoggingIn" :class="styles.buttonIcon" viewBox="0 0 16 16" fill="none">
                  <path :d="isRTL ? 'M10 12L6 8L10 4' : 'M6 12L10 8L6 4'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else :class="[styles.buttonIcon, styles.spinning]" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="30" stroke-dashoffset="0" stroke-linecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </button>
            </div>

            <!-- Additional Info -->
            <div :class="styles.infoSection">
              <div :class="styles.infoCard">
                <svg :class="styles.infoIcon" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 7v4M8 5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p :class="styles.infoText">
                  {{ content.infoText }}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import styles from './UnauthorizedAccess.module.css'
import { azureSsoService } from '@/services/azureSsoService'
import { authAPI } from '@/services/jwtAuthService'

// Language state
const isRTL = ref(true)
const router = useRouter()
const isLoggingIn = ref(false)

// Content based on language
const content = computed(() => {
  if (isRTL.value) {
    return {
      badge: 'غير مصرح',
      title: 'الوصول غير مصرح به',
      subtitle: 'أنت غير مصرح لك بالوصول إلى هذه الصفحة',
      alertTitle: 'يرجى تسجيل الدخول للمتابعة',
      alertMessage: 'للوصول إلى هذا التطبيق، يجب عليك تسجيل الدخول باستخدام بيانات اعتماد صالحة.',
      buttonText: 'انتقل إلى صفحة تسجيل الدخول',
      infoText: 'إذا كنت تواجه مشاكل في الوصول، يرجى الاتصال بمسؤول النظام.'
    }
  } else {
    return {
      badge: 'Unauthorized',
      title: 'Access Denied',
      subtitle: 'You are not authorized to access this page',
      alertTitle: 'Please Login to Continue',
      alertMessage: 'To access this application, you must login with valid credentials.',
      buttonText: 'Go to Login Page',
      infoText: 'If you are having trouble accessing, please contact the system administrator.'
    }
  }
})


// Generate random particle positions
const particleStyle = (index: number) => ({
  left: `${(index * 8.33) % 100}%`,
  top: `${(index * 13.7) % 100}%`,
  animationDelay: `${index * 0.5}s`,
  animationDuration: `${15 + (index % 5) * 2}s`
})

// Navigate to login using Azure AD SSO
const navigateToLogin = async () => {
  if (isLoggingIn.value) return
  
  try {
    isLoggingIn.value = true
    
    // Show loading indicator
    Swal.fire({
      title: isRTL.value ? 'جاري تسجيل الدخول...' : 'Signing in...',
      text: isRTL.value ? 'جاري إعادة التوجيه إلى Microsoft...' : 'Redirecting to Microsoft...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
    
    console.log('Step 1: Initiating Azure AD login popup...')
    
    // Step 1: Login with Azure AD (popup method)
    const azureToken = await azureSsoService.loginPopup()
    
    console.log('Step 1 Complete: Azure AD token received:', azureToken ? 'Yes' : 'No')
    console.log('Azure Token length:', azureToken?.length)
    console.log('Azure Token (first 50 chars):', azureToken?.substring(0, 50))
    
    console.log('Step 2: Exchanging Azure token for JWT...')
    console.log('Backend URL:', import.meta.env.VITE_API_BASE_URL)
    
    // Step 2: Exchange Azure token for application JWT tokens
    const loginResponse = await authAPI.azureLogin(azureToken)
    
    console.log('Step 2 Complete: JWT tokens received:', loginResponse)
    
    // Close loading indicator
    Swal.close()
    
    // Step 3: Show success message and redirect
    console.log('Login successful! Redirecting to /surveys...')
    
    Swal.fire({
      icon: 'success',
      title: isRTL.value ? 'تم تسجيل الدخول بنجاح' : 'Login Successful',
      text: isRTL.value 
        ? `مرحباً ${loginResponse.user.full_name || loginResponse.user.email}` 
        : `Welcome ${loginResponse.user.full_name || loginResponse.user.email}`,
      timer: 1500,
      showConfirmButton: false,
      willClose: () => {
        // Force redirect to surveys page using window.location
        console.log('Forcing redirect to /surveys')
        window.location.href = '/surveys'
      }
    })
    
  } catch (error: any) {
    console.error('Azure SSO login failed - Full error:', error)
    console.error('Error message:', error.message)
    console.error('Error response:', error.response)
    console.error('Error response data:', error.response?.data)
    console.error('Error response status:', error.response?.status)
    
    Swal.close()
    
    // Handle different error scenarios
    let errorMessage = isRTL.value 
      ? 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.' 
      : 'Login failed. Please try again.'
    
    if (error.message === 'Login cancelled by user') {
      errorMessage = isRTL.value ? 'تم إلغاء تسجيل الدخول' : 'Login cancelled'
    } else if (error.message === 'Popup blocked. Please allow popups for this site.') {
      errorMessage = isRTL.value 
        ? 'النافذة المنبثقة محظورة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.' 
        : 'Popup blocked. Please allow popups for this site.'
    } else if (error.message === 'Azure AD login failed') {
      errorMessage = isRTL.value 
        ? 'فشل تسجيل الدخول عبر Azure AD' 
        : 'Azure AD login failed'
    } else if (error.response?.status === 401) {
      errorMessage = isRTL.value 
        ? 'رمز Azure AD غير صالح' 
        : 'Invalid Azure AD credentials'
    } else if (error.response?.status === 400) {
      errorMessage = isRTL.value 
        ? 'طلب غير صالح - تحقق من إعدادات Azure' 
        : 'Bad request - check Azure configuration'
    } else if (error.response?.status === 404) {
      errorMessage = isRTL.value 
        ? 'نقطة النهاية غير موجودة - تحقق من الخادم الخلفي' 
        : 'Endpoint not found - check backend'
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.message) {
      errorMessage = error.message
    }
    
    await Swal.fire({
      icon: 'error',
      title: isRTL.value ? 'خطأ في تسجيل الدخول' : 'Login Error',
      text: errorMessage,
      confirmButtonText: isRTL.value ? 'حسناً' : 'OK'
    })
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<style module src="./UnauthorizedAccess.module.css"></style>
