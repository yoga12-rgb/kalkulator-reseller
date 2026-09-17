import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app'),
});

export default app;

/* ------------------------------------------------------------------
   PWA: register service worker (offline + auto update)
   ------------------------------------------------------------------ */
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          window.dispatchEvent(new CustomEvent('app:update-available'));
        },
        onOfflineReady() {
          window.dispatchEvent(new CustomEvent('app:offline-ready'));
        },
      });
    })
    .catch(() => {
      /* service worker tidak tersedia (mis. preview di http) - abaikan */
    });
}
