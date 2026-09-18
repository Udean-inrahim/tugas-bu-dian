// Service worker — Smart Temperature Monitoring
// Strategi: network-first dengan fallback cache, agar tetap bisa dibuka saat offline.

const CACHE = "stm-v1";
const API_PREFIX = "/api";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith(API_PREFIX)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const network = await fetch(event.request);
        if (network.ok) cache.put(event.request, network.clone());
        return network;
      } catch {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") return cache.match("/index.html");
        return new Response("", { status: 503, statusText: "Offline" });
      }
    })()
  );
});