importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

if (workbox) {
  // Precache critical static assets on install
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: '2' },
    { url: '/index.html', revision: '2' },
    { url: '/styles.css', revision: '2' },
    { url: '/manifest.json', revision: '1' },
    { url: '/icons/icon-192x192.png', revision: '1' },
    { url: '/icons/icon-512x512.png', revision: '1' },
    // ES modules
    { url: '/js/main.js', revision: '1' },
    { url: '/js/config.js', revision: '1' },
    { url: '/js/data/spheres.js', revision: '1' },
    { url: '/js/data/layers.js', revision: '1' },
    { url: '/js/data/nodes.js', revision: '1' },
    { url: '/js/data/connections.js', revision: '1' },
    { url: '/js/data/iso-sphere.js', revision: '1' },
    { url: '/js/data/labels.js', revision: '1' },
    { url: '/js/map/projection.js', revision: '1' },
    { url: '/js/map/zoom.js', revision: '1' },
    { url: '/js/map/svg-overlay.js', revision: '1' },
    { url: '/js/map/canvas-renderer.js', revision: '1' },
    { url: '/js/map/labels-layer.js', revision: '1' },
    { url: '/js/ui/filters.js', revision: '1' },
    { url: '/js/ui/sidebar.js', revision: '1' },
    { url: '/js/ui/info-panel.js', revision: '1' },
    { url: '/js/ui/mobile-sheet.js', revision: '1' },
    { url: '/js/ui/tooltip.js', revision: '1' },
    { url: '/js/util/debounce.js', revision: '1' },
    { url: '/js/util/viewport.js', revision: '1' }
  ]);

  // Network-first with cache fallback for HTML (navigation requests)
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'html-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60
        })
      ]
    })
  );

  // Cache-first for CSS files
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style',
    new workbox.strategies.CacheFirst({
      cacheName: 'css-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60
        })
      ]
    })
  );

  // Cache-first for JS files (classic scripts and ES modules)
  workbox.routing.registerRoute(
    ({ request, url }) => request.destination === 'script' || (url.pathname.endsWith('.js') && url.origin === self.location.origin),
    new workbox.strategies.CacheFirst({
      cacheName: 'js-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 30 * 24 * 60 * 60
        })
      ]
    })
  );

  // Cache-first for images
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60
        })
      ]
    })
  );

  // StaleWhileRevalidate for CDN atlas datasets (world-atlas TopoJSON)
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'atlas-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 30 * 24 * 60 * 60
        })
      ]
    })
  );

  // Cache-first for fonts (Google Fonts)
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'font-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60
        })
      ]
    })
  );

  // Cleanup old caches on activate
  workbox.precaching.cleanupOutdatedCaches();

  // Take control immediately
  self.skipWaiting();
  workbox.core.clientsClaim();
} else {
  console.warn('Workbox failed to load');
}
