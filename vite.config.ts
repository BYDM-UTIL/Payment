import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'מעקב תשלומים לעובדת זרה',
        short_name: 'תשלומים',
        description: 'Foreign Worker Payment Tracker',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        // Only precache app assets. Never cache Auth/Firestore/API responses in the SW
        // to avoid cross-account data leakage and stale financial data.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        navigateFallbackDenylist: [/^https:\/\/firestore\.googleapis\.com/, /^https:\/\/.*\.googleapis\.com/],
        runtimeCaching: []
      }
    })
  ],
  resolve: {
    alias: { '@': '/src' }
  }
})
