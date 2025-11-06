import { ref } from 'vue'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'
import { azureSsoService } from '@/services/azureSsoService'
import { authAPI } from '@/services/jwtAuthService'

/**
 * Composable for Azure AD SSO authentication
 * Provides login, logout, and user state management
 */
export function useAzureSso() {
  const router = useRouter()
  const isLoggingIn = ref(false)
  const isLoggingOut = ref(false)
  const isLoggedIn = ref(false)
  const currentUser = ref<any>(null)

  /**
   * Login with Azure AD SSO
   * @param redirectPath - Path to redirect after successful login (default: '/surveys')
   * @param usePopup - Use popup (true) or redirect (false) method (default: true)
   */
  const loginWithAzure = async (redirectPath: string = '/surveys', usePopup: boolean = true) => {
    if (isLoggingIn.value) return

    try {
      isLoggingIn.value = true

      // Show loading indicator
      Swal.fire({
        title: 'Signing in...',
        text: 'Redirecting to Microsoft...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Step 1: Login with Azure AD
      let azureToken: string
      if (usePopup) {
        azureToken = await azureSsoService.loginPopup()
      } else {
        await azureSsoService.loginRedirect()
        return // Will redirect, no further code execution
      }

      // Step 2: Exchange Azure token for application JWT tokens
      const loginResponse = await authAPI.azureLogin(azureToken)

      // Store user info
      currentUser.value = loginResponse.user
      isLoggedIn.value = true

      // Close loading indicator
      Swal.close()

      // Step 3: Show success message and redirect
      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: `Welcome ${loginResponse.user.full_name || loginResponse.user.email}`,
        timer: 1500,
        showConfirmButton: false,
        willClose: () => {
          // Force redirect using window.location to ensure navigation happens
          window.location.href = redirectPath
        }
      })

      return loginResponse
    } catch (error: any) {
      console.error('Azure SSO login failed:', error)

      Swal.close()

      // Handle different error scenarios
      let errorMessage = 'Login failed. Please try again.'

      if (error.message === 'Login cancelled by user') {
        errorMessage = 'Login cancelled'
      } else if (error.message === 'Popup blocked. Please allow popups for this site.') {
        errorMessage = 'Popup blocked. Please allow popups for this site.'
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid Azure AD credentials'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }

      await Swal.fire({
        icon: 'error',
        title: 'Login Error',
        text: errorMessage,
        confirmButtonText: 'OK'
      })

      throw error
    } finally {
      isLoggingIn.value = false
    }
  }

  /**
   * Handle redirect response after returning from Azure AD
   * Call this on app initialization
   */
  const handleRedirectResponse = async () => {
    try {
      const azureToken = await azureSsoService.handleRedirectResponse()

      if (azureToken) {
        // Exchange Azure token for application JWT tokens
        const loginResponse = await authAPI.azureLogin(azureToken)

        currentUser.value = loginResponse.user
        isLoggedIn.value = true

        // Show success message and force redirect
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: `Welcome ${loginResponse.user.full_name || loginResponse.user.email}`,
          timer: 1500,
          showConfirmButton: false,
          willClose: () => {
            // Force redirect to surveys page
            window.location.href = '/surveys'
          }
        })

        return loginResponse
      }
    } catch (error) {
      console.error('Failed to handle redirect response:', error)
    }
  }

  /**
   * Logout from Azure AD and clear application session
   */
  const logoutFromAzure = async () => {
    if (isLoggingOut.value) return

    try {
      isLoggingOut.value = true

      // Show loading indicator
      Swal.fire({
        title: 'Logging out...',
        text: 'Please wait',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Step 1: Logout from application (invalidate JWT)
      await authAPI.logout()

      // Step 2: Logout from Azure AD
      await azureSsoService.logout()

      // Clear user state
      currentUser.value = null
      isLoggedIn.value = false

      Swal.close()

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been successfully logged out',
        timer: 2000,
        showConfirmButton: false
      })

      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)

      Swal.close()

      await Swal.fire({
        icon: 'error',
        title: 'Logout Error',
        text: 'Failed to logout. Please try again.',
        confirmButtonText: 'OK'
      })
    } finally {
      isLoggingOut.value = false
    }
  }

  /**
   * Check if user is logged in with Azure AD
   */
  const checkAzureLoginStatus = async () => {
    try {
      const loggedIn = await azureSsoService.isLoggedIn()
      isLoggedIn.value = loggedIn

      if (loggedIn) {
        const userInfo = await azureSsoService.getUserInfo()
        currentUser.value = userInfo
      }

      return loggedIn
    } catch (error) {
      console.error('Failed to check login status:', error)
      return false
    }
  }

  /**
   * Get current Azure AD user info
   */
  const getAzureUserInfo = async () => {
    try {
      const userInfo = await azureSsoService.getUserInfo()
      currentUser.value = userInfo
      return userInfo
    } catch (error) {
      console.error('Failed to get user info:', error)
      return null
    }
  }

  return {
    // State
    isLoggingIn,
    isLoggingOut,
    isLoggedIn,
    currentUser,

    // Methods
    loginWithAzure,
    handleRedirectResponse,
    logoutFromAzure,
    checkAzureLoginStatus,
    getAzureUserInfo,
  }
}
