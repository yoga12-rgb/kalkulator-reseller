import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * SPA PWA kalkulator reseller.
 * - Svelte 5 + Tailwind 4
 * - Service worker (workbox generateSW) supaya bisa dipakai offline di toko
 * - Manifest standalone agar bisa di-install seperti aplikasi mobile
 */
export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-64.png', 'icons/apple-touch-icon-180.png'],
      manifest: {
        name: 'Kalkulator Reseller Rajaklana',
        short_name: 'KalkuReseller',
        description:
          'Hitung diskon voucher reseller Rajaklana (Abon Gulung, Bolu Susu) secara otomatis dari jumlah varian.',
        lang: 'id',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        theme_color: '#2c170e',
        background_color: '#2c170e',
        categories: ['business', 'shopping', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  server: {
    host: true,
  },
});
