/* Brilhinhos — funciona sem internet: guarda o jogo inteiro no aparelho.
   Ao publicar uma versão nova, aumente VERSION. A versão nova baixa sozinha em segundo plano,
   mas só entra quando o jogador toca em "Atualizar" (o progresso fica no aparelho e não é tocado). */
const VERSION = 'brilhinhos-v10';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/app.css', './fonts/fredoka.woff2',
  './js/app.js', './js/game.js', './js/data.js', './js/creature3d.js', './js/stage3d.js', './js/audio.js', './js/farm3d.js', './js/kid3d.js', './js/kidlook.js', './js/world.js', './js/season.js', './js/nature3d.js', './js/vendor/three.module.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];
self.addEventListener('install', (e) => {
  // baixa tudo fresquinho da internet (sem cache do navegador) e espera a ordem para entrar
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));
});
self.addEventListener('message', (e) => { if (e.data === 'atualizar') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || url.pathname.endsWith('/sw.js')) return;
  // a versão que está rodando usa sempre os arquivos dela (nada muda no meio da brincadeira)
  e.respondWith(
    caches.open(VERSION).then((c) => c.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res && res.ok) c.put(e.request, res.clone());
      return res;
    }).catch(() => c.match('./index.html'))))
  );
});
