# CLAUDE.md - PWA Maintenance Rules

## PWA Files (do not remove or break)
- `manifest.json` — Web app manifest. Keep `start_url`, `display`, `icons` intact.
- `service-worker.js` — Workbox-based service worker. Update precache revision strings when assets change.
- `install-prompt.js` — Auto-triggers native install prompt on first visit.
- `icons/icon-192x192.png` and `icons/icon-512x512.png` — Required PWA icons.

## Rules
1. Never remove the `<link rel="manifest">`, `<meta name="theme-color">`, or service worker registration from `index.html`.
2. When adding new static assets, add them to the precache list in `service-worker.js` and bump the revision string.
3. The service worker scope must remain `/`.
4. Do not modify existing HTML, CSS, or JS behavior — only add PWA-related code.
5. Test with Lighthouse PWA audit after any PWA-related changes.
