import { 
  PublicClientApplication, 
  type Configuration,
  type AuthenticationResult,
  type RedirectRequest,
  type PopupRequest,
  type EndSessionRequest,
  type AccountInfo
} from '@azure/msal-browser'
import { logger } from '../utils/logger'

// Get configuration from environment variables
const AZURE_CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || ''
const AZURE_TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID || ''
const REDIRECT_URI = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin

// Validate required environment variables
if (!AZURE_CLIENT_ID || !AZURE_TENANT_ID) {
  console.error('Azure AD configuration missing. Please set VITE_AZURE_CLIENT_ID and VITE_AZURE_TENANT_ID in .env')
}

// MSAL Configuration
const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: REDIRECT_URI,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use sessionStorage for better security
    storeAuthStateInCookie: false, // Set to true for IE11 or Edge legacy
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case 0: // Error
            console.error(message)
            break
          case 1: // Warning
            console.warn(message)
            break
          case 2: // Info
            logger.log(message)
            break
          case 3: // Verbose
            logger.debug(message)
            break
        }
      },
      logLevel: 3, // Verbose for development, use 0 (Error) for production
    },
  },
}

// Login request configuration
const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account', // Force account selection
}

// Redirect login request configuration
const redirectLoginRequest: RedirectRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account',
}

// Create MSAL instance
let msalInstance: PublicClientApplication | null = null

// Initialize MSAL instance
const initializeMsal = async (): Promise<PublicClientApplication> => {
  if (msalInstance) {
    return msalInstance
  }

  try {
    msalInstance = new PublicClientApplication(msalConfig)
    await msalInstance.initialize()
    
    // Handle redirect response if returning from Azure AD
    await msalInstance.handleRedirectPromise()
    
    logger.log('MSAL initialized successfully')
    return msalInstance
  } catch (error) {
    logger.error('Failed to initialize MSAL:', error)
    throw new Error('Azure AD initialization failed')
  }
}

// Get the MSAL instance (initialize if needed)
const getMsalInstance = async (): Promise<PublicClientApplication> => {
  if (!msalInstance) {
    return await initializeMsal()
  }
  return msalInstance
}

// Azure SSO Service
export const azureSsoService = {
  /**
   * Initialize MSAL and handle any redirect responses
   */
  initialize: async (): Promise<void> => {
    try {
      await initializeMsal()
    } catch (error) {
      logger.error('MSAL initialization error:', error)
      throw error
    }
  },

  /**
   * Login with Azure AD using popup
   * @returns Azure AD ID token (contains user identity information)
   */
  loginPopup: async (): Promise<string> => {
    try {
      const msal = await getMsalInstance()
      const response: AuthenticationResult = await msal.loginPopup(loginRequest)
      
      // Use idToken for backend authentication (contains user claims)
      if (!response.idToken) {
        throw new Error('No ID token received from Azure AD')
      }
      
      logger.log('Azure AD login successful (popup)')
      logger.log('ID Token received:', response.idToken ? 'Yes' : 'No')
      logger.log('Access Token received:', response.accessToken ? 'Yes' : 'No')
      
      return response.idToken
    } catch (error: any) {
      logger.error('Azure AD popup login failed:', error)
      
      // Handle specific MSAL errors
      if (error.errorCode === 'user_cancelled') {
        throw new Error('Login cancelled by user')
      } else if (error.errorCode === 'popup_window_error') {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }
      
      throw new Error('Azure AD login failed')
    }
  },

  /**
   * Login with Azure AD using redirect (recommended for mobile)
   */
  loginRedirect: async (): Promise<void> => {
    try {
      const msal = await getMsalInstance()
      await msal.loginRedirect(redirectLoginRequest)
      // User will be redirected to Azure AD, then back to the app
    } catch (error: any) {
      logger.error('Azure AD redirect login failed:', error)
      throw new Error('Azure AD login failed')
    }
  },

  /**
   * Handle redirect response after returning from Azure AD
   * Call this on app initialization
   * @returns Azure AD ID token if available
   */
  handleRedirectResponse: async (): Promise<string | null> => {
    try {
      const msal = await getMsalInstance()
      const response: AuthenticationResult | null = await msal.handleRedirectPromise()
      
      if (response && response.idToken) {
        logger.log('Azure AD login successful (redirect)')
        return response.idToken
      }
      
      return null
    } catch (error: any) {
      logger.error('Failed to handle redirect response:', error)
      return null
    }
  },

  /**
   * Get ID token silently (if user is already logged in)
   * @returns Azure AD ID token or null
   */
  getAccessTokenSilent: async (): Promise<string | null> => {
    try {
      const msal = await getMsalInstance()
      const accounts = msal.getAllAccounts()
      
      if (accounts.length === 0) {
        return null
      }
      
      const request = {
        scopes: loginRequest.scopes,
        account: accounts[0],
      }
      
      const response: AuthenticationResult = await msal.acquireTokenSilent(request)
      return response.idToken || response.accessToken
    } catch (error: any) {
      logger.warn('Silent token acquisition failed:', error)
      
      // If silent token acquisition fails, user needs to login again
      if (error.errorCode === 'consent_required' || 
          error.errorCode === 'interaction_required' ||
          error.errorCode === 'login_required') {
        // Trigger interactive login
        return null
      }
      
      return null
    }
  },

  /**
   * Get current logged in account
   * @returns Account info or null
   */
  getCurrentAccount: async (): Promise<AccountInfo | null> => {
    try {
      const msal = await getMsalInstance()
      const accounts = msal.getAllAccounts()
      return accounts.length > 0 ? accounts[0] : null
    } catch (error) {
      logger.error('Failed to get current account:', error)
      return null
    }
  },

  /**
   * Check if user is logged in with Azure AD
   * @returns true if logged in
   */
  isLoggedIn: async (): Promise<boolean> => {
    try {
      const msal = await getMsalInstance()
      const accounts = msal.getAllAccounts()
      return accounts.length > 0
    } catch (_error) {
      return false
    }
  },

  /**
   * Logout from Azure AD
   */
  logout: async (): Promise<void> => {
    try {
      const msal = await getMsalInstance()
      const account = await azureSsoService.getCurrentAccount()
      
      if (account) {
        const logoutRequest: EndSessionRequest = {
          account,
          postLogoutRedirectUri: REDIRECT_URI,
        }
        
        await msal.logoutPopup(logoutRequest)
        logger.log('Azure AD logout successful')
      }
    } catch (error: any) {
      logger.error('Azure AD logout failed:', error)
      
      // If popup logout fails, try redirect
      if (error.errorCode === 'popup_window_error') {
        const msal = await getMsalInstance()
        await msal.logoutRedirect()
      }
    }
  },

  /**
   * Get user information from Azure AD account
   * @returns User info or null
   */
  getUserInfo: async (): Promise<{
    email: string | null
    name: string | null
    username: string | null
  } | null> => {
    try {
      const account = await azureSsoService.getCurrentAccount()
      
      if (!account) {
        return null
      }
      
      return {
        email: account.username || null, // username is typically the email
        name: account.name || null,
        username: account.username || null,
      }
    } catch (error) {
      logger.error('Failed to get user info:', error)
      return null
    }
  },
}

// Auto-initialize MSAL when module loads
initializeMsal().catch(error => {
  console.warn('Auto-initialization of MSAL failed:', error)
})

export default azureSsoService
