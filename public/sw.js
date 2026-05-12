const SHELL_CACHE = "fintra-shell-v2";
const RUNTIME_CACHE = "fintra-runtime-v2";

// App shell — pre-cached on install
const SHELL_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ── Install: pre-cache the shell ─────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  const CURRENT = new Set([SHELL_CACHE, RUNTIME_CACHE]);
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !CURRENT.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Skip non-http(s) (e.g. chrome-extension://)
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  // Never cache Supabase or API routes — always network
  if (url.hostname.includes("supabase") || url.pathname.startsWith("/api/")) return;

  // Next.js static chunks (_next/static) — stale-while-revalidate
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(staleWhileRevalidate(e.request, RUNTIME_CACHE));
    return;
  }

  // HTML navigation — network-first with offline fallback
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then((cached) => cached || caches.match("/offline"))
        )
    );
    return;
  }

  // Images, fonts — stale-while-revalidate
  e.respondWith(staleWhileRevalidate(e.request, RUNTIME_CACHE));
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const networkFetch = fetch(request).then((res) => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      });
      return cached || networkFetch;
    })
  );
}

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;
  const { title, body } = e.data.json();
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const focused = list.find((c) => c.focused);
      if (focused) return focused.focus();
      if (list.length > 0) return list[0].focus();
      return clients.openWindow("/");
    })
  );
});
