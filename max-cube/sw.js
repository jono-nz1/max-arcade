// Max Cube offline support.
//
// First visit: saves the game and its icons on the phone.
// Every launch after that: opens instantly from the saved copy, even in flight mode,
// then quietly checks the website for a newer version in the background.
// So after you publish an update, Max gets it the next time he opens the game
// (open, close, open again). No version numbers to bump.

const CACHE = 'max-cube';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Ignore ?dev=1 and friends, so the dev panel works offline too.
    const isPage = req.mode === 'navigate';
    const key = isPage ? './' : req;
    const saved = await cache.match(key, { ignoreSearch: true });

    const fresh = fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) cache.put(key, res.clone());
        return res;
      })
      .catch(() => null);

    if (saved) {
      event.waitUntil(fresh);   // update in the background
      return saved;
    }
    return (await fresh) || new Response('Offline, and the game has not been saved yet.', { status: 503 });
  })());
});
