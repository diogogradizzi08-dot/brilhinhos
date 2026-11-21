/* Brilhinhos — funciona sem internet: guarda o jogo inteiro no aparelho.
   Ao publicar uma versão nova, aumente VERSION para os aparelhos atualizarem. */
const VERSION = 'brilhinhos-v9';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/app.css', './fonts/fredoka.woff2',
  './js/app.js', './js/game.js', './js/data.js', './js/creature3d.js', './js/stage3d.js', './js/audio.js', './js/farm3d.js', './js/kid3d.js', './js/kidlook.js', './js/world.js', './js/season.js', './js/nature3d.js', './js/vendor/three.module.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // rede primeiro (pega atualizações); sem internet, usa o que está guardado
  e.respondWith(
    fetch(e.request, url.origin === location.origin ? { cache: 'no-cache' } : {}).then((res) => {
      if (res && res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
