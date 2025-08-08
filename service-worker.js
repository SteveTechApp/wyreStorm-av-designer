const CACHE_NAME = "wyrestorm-cache-v1";
const ASSETS = [
  ".",
  "index.html",
  "app.js",
  "style.css",
  "manifest.json",
  "assets/wyrestorm-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
