/* Adilet Pro Liga — service worker: статика из кэша, данные всегда свежие с сети */
const CACHE = "apl-v3";
const CORE = [
  "/",
  "/index.html",
  "/css/app.css",
  "/js/app.js",
  "/manifest.webmanifest",
  "/images/apl-logo.png",
  "/images/athletic-eight.png",
  "/images/laseven-fc.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API: всегда свежая сеть, кэш только как запасной вариант при офлайне
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Статика и картинки: сначала кэш, потом сеть
  e.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
    )
  );
});
