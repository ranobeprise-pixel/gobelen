// Офлайн-кэш. Версия меняется при каждой сборке.
const VERSION = 'gobelen-ffe495c5d5';
const FILES = ["./", "index.html", "manifest.webmanifest", "css/app.css", "fonts/brahms-gotisch.otf", "fonts/gatchina-bold.ttf", "fonts/gatchina-italic.ttf", "fonts/gatchina-regular.ttf", "ics/evening-1700.ics", "ics/evening-1730.ics", "ics/evening-1800.ics", "ics/evening-1830.ics", "ics/evening-1900.ics", "ics/evening-1930.ics", "ics/evening-2000.ics", "ics/evening-2030.ics", "ics/evening-2100.ics", "ics/evening-2130.ics", "ics/evening-2200.ics", "ics/evening-2230.ics", "ics/evening-2300.ics", "ics/evening-2330.ics", "ics/morning-0500.ics", "ics/morning-0530.ics", "ics/morning-0600.ics", "ics/morning-0630.ics", "ics/morning-0700.ics", "ics/morning-0730.ics", "ics/morning-0800.ics", "ics/morning-0830.ics", "ics/morning-0900.ics", "ics/morning-0930.ics", "ics/morning-1000.ics", "ics/morning-1030.ics", "ics/morning-1100.ics", "ics/morning-1130.ics", "ics/morning-1200.ics", "img/icon-180.png", "img/icon-192.png", "img/icon-512.png", "img/tapestry.webp", "img/card/00.webp", "img/card/01.webp", "img/card/02f.webp", "img/card/02m.webp", "img/card/03.webp", "img/card/04.webp", "img/card/05.webp", "img/card/06.webp", "img/card/07.webp", "img/card/08.webp", "img/card/09.webp", "img/card/10.webp", "img/card/11.webp", "img/card/12.webp", "img/card/13.webp", "img/card/14.webp", "img/card/15.webp", "img/card/16.webp", "img/card/17.webp", "img/card/18.webp", "img/card/19.webp", "img/card/20.webp", "img/card/21.webp", "img/card/back.webp", "img/emblem/circle.webp", "img/emblem/garden.webp", "img/emblem/guild.webp", "img/emblem/hearth.webp", "img/emblem/library.webp", "img/emblem/observatory.webp", "img/emblem/spring.webp", "img/emblem/theater.webp", "img/emblem/tower.webp", "img/emblem/treasury.webp", "img/emblem/wonder.webp", "img/emblem/workshop.webp", "img/scene/circle.webp", "img/scene/garden.webp", "img/scene/guild.webp", "img/scene/hearth.webp", "img/scene/hero_f.webp", "img/scene/hero_m.webp", "img/scene/library.webp", "img/scene/morning_f.webp", "img/scene/morning_m.webp", "img/scene/observatory.webp", "img/scene/rest_f.webp", "img/scene/rest_m.webp", "img/scene/spring.webp", "img/scene/theater.webp", "img/scene/tower.webp", "img/scene/treasury.webp", "img/scene/witch_f.webp", "img/scene/witch_m.webp", "img/scene/wonder.webp", "img/scene/workshop.webp", "js/ambient.js", "js/app.js", "js/data.js", "js/engine.js", "js/store.js", "js/version.js"];
self.addEventListener('install', (e) => {
  // cache: 'reload' — берём файлы с сервера, а не из кэша браузера
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // страница — сначала из сети (чтобы видеть обновления), без сети — из кэша
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(VERSION).then((c) => c.put(req, copy));
    return res;
  })));
});
