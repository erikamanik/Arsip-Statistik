const CACHE = 'arsip-statistik-v2';
const PRECACHE = ['/', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // Navigasi: jaringan dulu, jatuh ke shell aplikasi saat offline
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  // Aset (termasuk font yang kini self-host): cache dulu, perbarui di latar belakang
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request);
      const net = fetch(request)
        .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
        .catch(() => hit);
      return hit || net;
    })
  );
});

// Siap menerima Web Push dari server (opsional, butuh backend yang mengirim push)
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data && e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Arsip Statistik', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { if ('navigate' in c) c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
