import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// TEMPORARY (HTTP-only mode): local HTTPS is disabled until a real domain + SSL
// certificate are in place. mkcert issues a certificate that is only trusted for
// "localhost", so opening the app by IP (http://10.100.222.169:5173) failed in the
// browser. Re-enable this import together with the plugin entry below once TLS is
// handled properly. See HTTP_ONLY_SETUP.md for the full revert steps.
// import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDevelopment = mode === 'development'
  const isProduction = mode === 'production'

  const baseConfig = {
    plugins: [
      vue()
      // TEMPORARY (HTTP-only mode): re-add mkcert when restoring HTTPS.
      // , ...(isDevelopment ? [mkcert()] : [])
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    preview: {
      // TEMPORARY (HTTP-only mode): was 'localhost', which binds the loopback
      // interface only and refuses connections from any other machine. 0.0.0.0
      // listens on every interface so the build can be previewed at
      // http://<server-ip>:4173.
      host: '0.0.0.0',
      port: 4173
    },
    build: {
      // Security: Ensure proper build configuration
      sourcemap: isDevelopment,
      minify: isProduction,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          // Use hash-based naming for cache busting
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
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
        // TEMPORARY (HTTP-only mode): was 'localhost'. Binding 0.0.0.0 is what
        // makes http://<server-ip>:5173 reachable from other machines at all.
        host: '0.0.0.0',
        port: 5173,
        // Security headers for development (relaxed for Azure AD SSO)
        headers: {
          // img-src mirrors connect-src for the API origins: survey attachment
          // images are served by the backend (e.g. http://127.0.0.1:8000 in dev,
          // or http://10.100.222.169:8000 when accessed over the network), so
          // restricting images to 'self'/https: would block every preview.
          'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:* http://10.100.222.169:8000; connect-src 'self' ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* http://localhost:* http://127.0.0.1:* https://localhost:* https://127.0.0.1:* http://10.100.222.169:8000 ws://10.100.222.169:8000 https://lightidea.org:* https://3.74.228.219 https://3.74.228.219/* https://cdn.jsdelivr.net https://login.microsoftonline.com https://*.microsoftonline.com https://graph.microsoft.com; frame-src https://login.microsoftonline.com; frame-ancestors 'none';`,
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
