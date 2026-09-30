const CACHE_NAME = "sanistock-dev-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

/* ================================
   INSTALLATION
================================ */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME).then(async cache => {

      for (const file of FILES_TO_CACHE) {

        try {
          await cache.add(file);
        } catch (error) {
          console.warn(
            "SaniStock DEV : impossible de mettre en cache",
            file,
            error
          );
        }

      }

    })

  );

  self.skipWaiting();

});


/* ================================
   ACTIVATION
================================ */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))

      );

    }).then(() => {

      return self.clients.claim();

    })

  );

});


/* ================================
   REQUÊTES
================================ */

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);


  /* ==============================
     PAGES SaniStock DEV

     EN LIGNE :
     → dernière version GitHub DEV

     HORS LIGNE :
     → version enregistrée
  ============================== */

  if (
    request.mode === "navigate" ||
    (
      url.origin === self.location.origin &&
      (
        url.pathname.endsWith("/") ||
        url.pathname.endsWith("/index.html")
      )
    )
  ) {

    event.respondWith(

      fetch(request, {
        cache: "no-store"
      })

      .then(response => {

        if (response && response.ok) {

          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put("./index.html", copy);
          });

        }

        return response;

      })

      .catch(() => {

        return caches.match("./index.html");

      })

    );

    return;
  }


  /* ==============================
     AUTRES FICHIERS
  ============================== */

  event.respondWith(

    caches.match(request)

      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(request)

          .then(response => {

            if (
              response &&
              response.ok &&
              url.origin === self.location.origin
            ) {

              const copy = response.clone();

              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, copy);
              });

            }

            return response;

          })

          .catch(() => {

            return caches.match("./index.html");

          });

      })

  );

});
