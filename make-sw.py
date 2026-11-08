import os, hashlib, json
files=['./','index.html','manifest.webmanifest']
h=hashlib.sha1()
for root,_,fs in os.walk('.'):
    if root.startswith('./.git'): continue
    for f in sorted(fs):
        p=os.path.join(root,f)[2:]
        if p in ('sw.js','make-sw.py','README.md') or p.startswith('.'): continue
        if p not in files: files.append(p)
        h.update(open(p,'rb').read())
ver=h.hexdigest()[:10]
open('sw.js','w').write(f"""// Офлайн-кэш. Версия меняется при каждой сборке.
const VERSION = 'gobelen-{ver}';
const FILES = {json.dumps(files, ensure_ascii=False)};
self.addEventListener('install', (e) => {{
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
}});
self.addEventListener('activate', (e) => {{
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', (e) => {{
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, {{ ignoreSearch: true }}).then((hit) => hit || fetch(req).then((res) => {{
    const copy = res.clone();
    caches.open(VERSION).then((c) => c.put(req, copy));
    return res;
  }}).catch(() => caches.match('index.html'))));
}});
""")
print(ver, len(files))
