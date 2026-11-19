// Mostrelli service worker.
// - Game files (JS, images, sounds, fonts) have unique names per version: cache-first, so the second
//   start is almost instant and walking never waits for the network.
// - The page itself: network-first, so a new version is picked up at once (cache only when offline).
// - The server API (/api/...) is never cached: saves and online rooms must always be live.
const CACHE = "mostrelli-v1";
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put("/", c)); return r; }).catch(() => caches.match("/")));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then((k) => k.put(req, c)); }
    return r;
  })));
});
