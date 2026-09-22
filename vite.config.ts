import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const applicationBasePath = '/Mahlzeiten-Planer/'

export default defineConfig({
  base: applicationBasePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mahlzeiten-Planer',
        short_name: 'Einkaufsliste',
        description: 'Gemeinsame Einkaufsliste des Haushalts',
        lang: 'de',
        dir: 'ltr',
        start_url: applicationBasePath,
        scope: applicationBasePath,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#ebacd2',
        background_color: '#ffffff',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
