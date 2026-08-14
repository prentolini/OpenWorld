/* OpenWorld – service worker
 *
 * Legger hele spillet i nettleserens hurtigbuffer, slik at det starter og
 * spilles uten nett etter første besøk. Spillet har ingen server – all
 * fremgang ligger uansett lokalt i localStorage.
 *
 * Bytt VERSJON når du endrer filene; da lastes alt ned på nytt og de gamle
 * bufferne ryddes bort.
 */
const VERSJON = 'openworld-v1';

const FILER = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './ikoner/ikon-192.png',
  './ikoner/ikon-512.png',
  './ikoner/ikon-maskbar-512.png',
  './ikoner/apple-touch-icon.png',
  './src/core/format.js',
  './src/data/eras.js',
  './src/data/buildings.js',
  './src/data/tech.js',
  './src/data/world.js',
  './src/data/progress.js',
  './src/data/shop.js',
  './src/data/karakterer.js',
  './src/core/state.js',
  './src/core/engine.js',
  './src/core/payments.js',
  './src/by3d/motor.js',
  './src/by3d/hus.js',
  './src/by3d/modeller.js',
  './src/by3d/scene.js',
  './src/ui/panels.js',
  './src/ui/app.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSJON)
      .then(function (c) { return c.addAll(FILER); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (navn) {
      return Promise.all(navn.filter(function (n) { return n !== VERSJON; })
        .map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function (traff) {
      if (traff) return traff;
      return fetch(e.request).then(function (svar) {
        /* Legg nye filer i bufferen etter hvert som de hentes */
        if (svar && svar.status === 200 && svar.type === 'basic') {
          var kopi = svar.clone();
          caches.open(VERSJON).then(function (c) { c.put(e.request, kopi); });
        }
        return svar;
      }).catch(function () {
        /* Uten nett: gi startsiden til alle sidenavigasjoner */
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
