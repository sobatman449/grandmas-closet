// My Closet — Service Worker
// Caches the app shell so it loads instantly on the phone even if Wi-Fi is slow.
// Does NOT cache API data — wardrobe data always fetches fresh from the server.

const CACHE_NAME = "mycloset-shell-v1";

const SHELL_ASSETS = [
  "/",
  "/manifest.json",
];

// Install: cache the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API calls: network only (always fresh data)
// - Everything else: network first, fall back to cache
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (event.request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
