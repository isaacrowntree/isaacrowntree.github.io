/* PEARL demo app — offline-first shell cache.
   Bump CACHE on every deploy that changes app files. */
var CACHE = "pearl-app-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) {
        // refresh in the background so the next open is current
        e.waitUntil(
          fetch(e.request).then(function (res) {
            if (res && res.ok) {
              return caches.open(CACHE).then(function (c) { return c.put(e.request, res); });
            }
          }).catch(function () {})
        );
        return hit;
      }
      return fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var clone = res.clone();
          e.waitUntil(caches.open(CACHE).then(function (c) { return c.put(e.request, clone); }));
        }
        return res;
      });
    })
  );
});
