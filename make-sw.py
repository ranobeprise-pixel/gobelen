import os, re, hashlib, json
# Собирает sw.js со списком файлов и версией сборки.
# Версия = хэш всех файлов; она же подставляется в index.html (?v=) и js/version.js,
# чтобы телефоны гарантированно скачали свежие файлы, а не старые из кэша браузера.
SKIP = ('sw.js', 'make-sw.py', 'README.md', 'preview.html', 'js/version.js')
files = ['./', 'index.html', 'manifest.webmanifest']
h = hashlib.sha1()
for root, dirs, fs in os.walk('.'):
    dirs.sort()
    if root.startswith('./.git'):
        continue
    for f in sorted(fs):
        p = os.path.join(root, f)[2:]
        if p in SKIP or p.startswith('.'):
            continue
        if p not in files:
            files.append(p)
        data = open(p, 'rb').read()
        if p == 'index.html':
            data = re.sub(rb'\?v=[0-9a-z]+', b'?v=', data)
        h.update(p.encode() + data)
ver = h.hexdigest()[:10]
files.append('js/version.js')

idx = open('index.html').read()
idx = re.sub(r'(css/app\.css|js/app\.js)\?v=[0-9a-z]+', lambda m: m.group(1) + '?v=' + ver, idx)
open('index.html', 'w').write(idx)
import datetime
open('js/version.js', 'w').write(f"export const BUILD = '{ver}';\nexport const BUILD_DATE = '{datetime.date.today().isoformat()}';\n")

open('sw.js', 'w').write(f"""// Офлайн-кэш. Версия меняется при каждой сборке.
const VERSION = 'gobelen-{ver}';
const FILES = {json.dumps(files, ensure_ascii=False)};
self.addEventListener('install', (e) => {{
  // cache: 'reload' — берём файлы с сервера, а не из кэша браузера
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, {{ cache: 'reload' }})))).then(() => self.skipWaiting()));
}});
self.addEventListener('activate', (e) => {{
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', (e) => {{
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // страница — сначала из сети (чтобы видеть обновления), без сети — из кэша
  if (req.mode === 'navigate') {{
    e.respondWith(fetch(req, {{ cache: 'no-cache' }}).catch(() => caches.match('index.html')));
    return;
  }}
  e.respondWith(caches.match(req, {{ ignoreSearch: true }}).then((hit) => hit || fetch(req).then((res) => {{
    const copy = res.clone();
    caches.open(VERSION).then((c) => c.put(req, copy));
    return res;
  }})));
}});
""")
print(ver, len(files))
