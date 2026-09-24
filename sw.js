/* Dunn's Table of Authorities Generator — service worker
   Caches the app shell (including the vendored pdf.js / JSZip files) so the
   app keeps working offline. The access-control.json check is deliberately
   NEVER cached — it always goes to the network so the kill switch can't be
   bypassed just by being offline once while access was still active. */

const CACHE_VERSION = 'toa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './license-check.js',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './vendor/jszip.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // Add each file individually — cache.addAll() aborts entirely if even one
    // file 404s, and it's better to still install with most of the shell cached.
    await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache or serve the access-control check from cache — always hit the network.
  if (url.pathname.endsWith('/access-control.json') || url.href.includes('access-control.json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  if (event.request.method !== 'GET') return;

  // Cache-first for the app shell and vendored libraries; fall back to network,
  // and cache what we fetch so later runs work offline too.
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      if (res && res.ok && (url.origin === self.location.origin)) {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(event.request, res.clone());
      }
      return res;
    } catch (err) {
      if (event.request.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
