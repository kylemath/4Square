// Service worker for the installable 4square app: works offline after the first visit.
// The game's own files: network first (a page, its levels and its skins always match), the cache when offline.
// Google Fonts and the pinned three.js (Islands 3D): cache first.
// Bump VERSION to drop old caches.
const VERSION = 'fth-v32';
const CORE = ['./', 'index.html', 'levels.js', 'layout.js', 'telemetry.js', 'manifest.webmanifest',
  'lab/core.js', 'lab/dots.html', 'lab/doodle.html', 'lab/blank.html',
  'skins/registry.js', 'skins/islands.js', 'skins/dots.js', 'skins/doodle.js', 'skins/blank.js',
  'skins/map.js', 'skins/swipe.js', 'skins/ions.js', 'skins/tables.js', 'skins/maze.js', 'skins/crush.js', 'skins/rimword.js', 'skins/spheres.js', 'skins/gears.js', 'skins/signs.js', 'skins/star.js', 'skins/shoreline.js', 'skins/respawn.js',
  'lab/map.html', 'lab/swipe.html', 'lab/ions.html', 'lab/tables.html', 'lab/maze.html', 'lab/crush.html', 'lab/rimword.html', 'lab/rimword-data.js', 'lab/spheres.html', 'lab/gears.html', 'lab/gearpack.js', 'degree.js', 'lab/signs.html', 'lab/signs-model.js', 'lab/star.html', 'lab/star-rules.js', 'lab/shoreline.html', 'lab/shoreline-core.js', 'lab/respawn.html', 'lab/respawn-core.js',
  'board/island.js', 'sfx.js', 'bonus/games.js', 'skins/islands-free.js', 'skins/islands-3d.js', 'lab/islands3d.html', 'lab/islands3d-plans.js',
  'tickets.js', 'maps.js', 'rim.js', 'rimstar.js', 'eggs.js', 'cloud.js', 'reel.js', 'deli.js', 'economy.js', 'verify.js', 'integrity.js', 'account-config.js', 'account.js', 'leaderboard.js', 'ads.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), own = url.origin === location.origin;
  if (!own && !(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || /^cdnjs\.cloudflare\.com$/.test(url.hostname) && /three\.js\/r128\//.test(url.pathname))) return;
  if (own) {                                   // the game's own files: always the fresh copy online (pages, levels and
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => {   // skins must match; revalidated with the server, so
                                                                  // no stale HTTP-cache copy), the cached one only offline
      if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
    return;
  }
  e.respondWith(caches.open(VERSION).then(async c => {          // fonts: cache first
    const hit = await c.match(req);
    return hit || fetch(req).then(r => { c.put(req, r.clone()); return r; });
  }));
});
