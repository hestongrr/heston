/* Field Day service worker — offline support for the geotech field tools.
 *
 * Deliberately conservative. This origin also serves the live marketing site,
 * so the rules are:
 *   - HTML is ALWAYS network-first. A stale cached page must never shadow a
 *     site update; the cache is only a fallback for when there's no signal.
 *   - Only the field tools are precached. Everything else is pass-through.
 *   - Cross-origin (analytics), /api/, and non-GET requests are never touched.
 *
 * Bump CACHE when the precache list or the tool pages change.
 */
const CACHE = 'fieldday-v2';

/* The pages that must work with no signal, plus their install assets.
   All three tools are self-contained — no local CSS/JS to precache. */
const PRECACHE = [
  '/density-test-sheet.html',
  '/boring-log-generator.html',
  '/uscs-soil-classification-calculator.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // Individually, so one 404 can't fail the whole install.
      .then((cache) => Promise.all(
        PRECACHE.map((url) => cache.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // analytics, CDNs
  if (url.pathname.startsWith('/api/')) return;      // lead capture, never cached

  // HTML: network-first. Fall back to cache only when the network fails.
  //
  // cache:'no-store' is load-bearing. The backend sends no Cache-Control
  // header, so browsers apply *heuristic* freshness and a plain fetch(req)
  // can be answered from the HTTP cache — which made "network-first" quietly
  // serve stale pages. Verified 2026-08-07. Go to the wire or fail.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/density-test-sheet.html')))
    );
    return;
  }

  // Static assets we precached: cache-first, refreshed in the background.
  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
