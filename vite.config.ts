import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDevelopment = mode === 'development'
  const isProduction = mode === 'production'
  
  const baseConfig = {
    plugins: [
      vue(),
      ...(isDevelopment ? [mkcert()] : [])
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    preview: {
      host: 'localhost',
      port: 4173
    },
    build: {
      // Security: Ensure proper build configuration
      sourcemap: isDevelopment,
      minify: isProduction
    },
    define: {
      // Ensure proper environment variable handling
      __DEV__: isDevelopment,
      __PROD__: isProduction,
    }
  }

  if (command === 'serve') {
    return {
      ...baseConfig,
      server: {
        host: 'localhost',
        port: 5173,
        // Security headers for development (relaxed for Azure AD SSO)
        headers: {
          'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* http://localhost:* http://127.0.0.1:* https://localhost:* https://127.0.0.1:* https://lightidea.org:* https://3.74.228.219 https://3.74.228.219/* https://cdn.jsdelivr.net https://login.microsoftonline.com https://*.microsoftonline.com https://graph.microsoft.com; frame-src https://login.microsoftonline.com; frame-ancestors 'none';`,
          'Cross-Origin-Opener-Policy': 'unsafe-none',
          'Cross-Origin-Embedder-Policy': 'unsafe-none',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        }
      }
    }
  }

  // build / preview configuration
  return baseConfig
})
