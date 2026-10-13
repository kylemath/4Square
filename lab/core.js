/* lab/core.js: the game logic layer, shared by every front end in the lab.
 *
 * The puzzle: a planar map whose regions are coloured with 4 elements so that neighbours differ. One region (the
 * "hole") is uncoloured; its 5 neighbours (the "rim") use all 4 elements, so the hole cannot be coloured. A move is a
 * Kempe swap: take a two-element chain (a connected run of regions using only elements a and b) and swap a<->b
 * throughout it. The colouring stays legal. Goal: get the rim down to 3 elements, then the hole takes the missing one.
 *
 * Load ../levels.js (and ../layout.js if you want region polygons) before this file.
 *
 *   const g = LAB.game('4');             // level id or number as shown in the game ('4' by default, or ?lvl= in the URL)
 *   g.n, g.hole, g.rim                    // regions 0..n-1, the hole, the rim regions in cyclic order
 *   g.adj[u]                              // neighbours of u (the hole included)
 *   g.rot[u]                              // neighbours of u in cyclic (planar) order
 *   g.edges                               // [[u, v], ...]
 *   g.pos[u]                              // a planar straight-line drawing, roughly in [-1, 1]
 *   g.cells, g.centre                     // region polygons and centres (dual map, exact adjacency), or null
 *   g.border                              // the 3 far-side regions (the old "walls")
 *   g.col[u]                              // current element of u (0..3); the hole is -1
 *   g.chains                              // every chain: { key, pair: [a, b], vs, set, size, web, rimHits }
 *   g.chainAt(u, b)                       // the {col[u], b} chain through u
 *   g.chainsThrough(u)                    // the (up to 3) chains through u, one per partner element
 *   g.swap(K)                             // do the swap; returns the regions that changed
 *   g.preview(K)                          // { rimCount, dist, won } after swapping K, without doing it
 *   g.undo(), g.reset()
 *   g.rimColours(), g.rimCount()          // the rim's elements, how many distinct (goal: 3)
 *   g.won(), g.free()                     // rim down to 3? the element the hole can now take
 *   g.dist()                              // fewest swaps from here to a win (from the census), or null
 *   g.good()                              // chains whose swap brings dist() down by one
 *   g.moves                               // swaps made so far
 *   g.on(fn)                              // fn(g, info) after every change: info = { type: 'swap'|'undo'|'reset', changed }
 *
 * Embedding (the skin system): when a skin page is opened with ?embed=1 inside the Fill the Hole app, every change is
 * posted to the parent window as { fth: 1, type: 'ready'|'swap'|'undo'|'reset'|'done', id, moves, won, free, col }.
 * A skin calls LAB.done() when its own win celebration is over (the app then shows its win screen); the app can send
 * { fth: 1, cmd: 'undo'|'reset' }. A skin needs nothing else to run inside the app.
 * After a win an embedded page must not restart itself (the app owns what happens next): guard any tap-to-restart with
 * if (!LAB.embedded). LAB.done() posts once per win. The app also posts { cmd: 'tokens', vars } (its --sk-* theme): see LAB.tok().
 *   LAB.at(x, y)        where the swap happened, in page CSS px (clientX/Y). Call it before or right after g.swap(K): the next
 *                       posted swap carries it as `at: [x, y]` (just after: a { type: 'at', at } follows) and the app flies
 *                       that swap's coins from there into its counter (SKIN-SPEC 14).
 *                       Without it the coins fly from the middle of the frame. Points are always scored by the app.
 *   LAB.egg(id, pts)    an easter egg declared in the skin's `eggs` with on: 'page' was found (SKIN-SPEC 15): posts
 *                       { fth: 1, type: 'egg', id, pts, lvl }. The app credits pts quietly (capped at 2,000 a level).
 *
 * A chain is a "web" when it is the only {a, b} chain on the map: swapping it just renames two elements everywhere,
 * so it never changes anything. LAB.ELEM gives names, colours and icons for the 4 elements.
 */
(function () {
  'use strict';
  // The filler gallery (?filler=1) stores one combined graph and opens it in whichever skin is selected.
  (function installFiller() {
    if (typeof location === 'undefined' || !window.GAME) return;
    if (new URLSearchParams(location.search).get('filler') !== '1') return;
    let spec = null;
    try { spec = JSON.parse(sessionStorage.getItem('spheres-filler-play') || 'null'); } catch (e) { spec = null; }
    if (!spec || !spec.edges || !spec.col || spec.hole == null) return;
    const key = 'filler-play';
    GAME.graphs[key] = { name: spec.name || 'filler', n: spec.n, hole: spec.hole, link: spec.link, pos: spec.pos, edges: spec.edges, ncol: 4, goal: 3 };
    const level = { id: key, num: 'filler', g: key, title: spec.title || 'Filler', start: spec.col };
    const at = GAME.levels.findIndex(l => l.id === key);
    if (at >= 0) GAME.levels[at] = level; else GAME.levels.push(level);
    if (window.LAYOUT) LAYOUT[key] = { border: [], arcs: {}, centre: spec.pos, cells: spec.cells || null };
  })();
  const ELEM = [
    { name: 'fire', hex: '#ef5a3c', dark: '#8e1c17', neon: '#ff7a52', pastel: '#f6a08a' },
    { name: 'water', hex: '#3d8fe8', dark: '#1b4f91', neon: '#5ab4ff', pastel: '#9cc6f4' },
    { name: 'air', hex: '#e8c547', dark: '#8a6510', neon: '#ffe066', pastel: '#f4e09a' },
    { name: 'earth', hex: '#4caf50', dark: '#1a6b2a', neon: '#5cff8a', pastel: '#a6d9a1' },
  ];
  // 24x24 icon paths (same art as the game)
  const ICON = [
    'M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2.4 1.1-4.1 2.3-5.2.1 1.6.8 2.7 1.9 3.3C10.3 8 11 5 12 2z',
    'M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z',
    'M3 8.5h11a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8M3 16.5h8',
    'M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M6 18c3-4 6-7 9-9',
  ];
  function game(num) {
    const G = window.GAME; if (!G) throw new Error('load ../levels.js first');
    num = String(num || new URLSearchParams(location.search).get('lvl') || '4');
    const L = G.levels.find(l => l.id === num || String(l.num) === num) || G.levels.find(l => l.id === 'kempes-double');   // a level id or its number
    const Gr = G.graphs[L.g], n = Gr.n, hole = Gr.hole, rim = Gr.link.slice(), NC = Gr.ncol || 4, goal = Gr.goal || 3;
    const adj = Array.from({ length: n }, () => []);
    Gr.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    const Lay = window.LAYOUT && window.LAYOUT[L.g];
    const g = {
      level: L, num, name: Gr.name, n, hole, rim, NC, goal, adj, rot: Gr.rot, edges: Gr.edges, pos: Gr.pos,
      cells: Lay ? Lay.cells : null, centre: Lay ? Lay.centre : null, border: Lay ? Lay.border.slice() : [],
      col: L.start.slice(), chains: [], moves: 0, history: [], subs: [],
    };
    const pairKey = (a, b) => Math.min(a, b) * 4 + Math.max(a, b);
    function compute() {
      const col = g.col, out = [], at = Array.from({ length: n }, () => [null, null, null, null]);
      for (let a = 0; a < NC; a++) for (let b = a + 1; b < NC; b++) {
        const seen = new Set(), mine = [];
        for (let s = 0; s < n; s++) {
          if (s === hole || seen.has(s) || (col[s] !== a && col[s] !== b)) continue;
          const set = new Set([s]); let front = [s]; seen.add(s);
          while (front.length) { const nx = []; for (const u of front) for (const w of adj[u]) if (w !== hole && !set.has(w) && (col[w] === a || col[w] === b)) { set.add(w); seen.add(w); nx.push(w); } front = nx; }
          const vs = [...set].sort((x, y) => x - y);
          const K = { key: pairKey(a, b) + ':' + vs.join('.'), pair: [a, b], vs, set, size: vs.length, rimHits: rim.filter(x => set.has(x)).length, web: false };
          mine.push(K); out.push(K); vs.forEach(u => { at[u][col[u] === a ? b : a] = K; });
        }
        mine.forEach(K => { K.web = mine.length === 1; });
      }
      g.chains = out; g._at = at;
    }
    const canon = c => { const mp = {}; let s = '', k = 0; for (let u = 0; u < n; u++) { if (u === hole) continue; if (!(c[u] in mp)) mp[c[u]] = k++; s += mp[c[u]]; } return s; };
    const flipped = (c, K) => { const d = c.slice(); K.set.forEach(u => { d[u] = d[u] === K.pair[0] ? K.pair[1] : K.pair[0]; }); return d; };
    const rimOf = c => rim.map(x => c[x]);
    const countOf = c => new Set(rimOf(c)).size;
    const distOf = c => { if (countOf(c) <= goal) return 0; const d = Gr.dist && Gr.dist[canon(c)]; return d === undefined ? null : d; };
    const emit = info => g.subs.forEach(fn => { try { fn(g, info); } catch (e) { console.error(e); } });
    g.col[hole] = -1;
    g.chainAt = (u, b) => (u === hole || b === g.col[u]) ? null : g._at[u][b];
    g.chainsThrough = u => u === hole ? [] : [0, 1, 2, 3].filter(b => b !== g.col[u] && b < NC).map(b => g._at[u][b]).filter(Boolean);
    g.rimColours = () => rimOf(g.col);
    g.rimCount = () => countOf(g.col);
    g.won = () => countOf(g.col) <= goal;
    g.free = () => { const s = new Set(rimOf(g.col)); for (let e = 0; e < NC; e++) if (!s.has(e)) return e; return -1; };
    g.dist = () => distOf(g.col);
    g.preview = K => { const c = flipped(g.col, K); return { rimCount: countOf(c), dist: distOf(c), won: countOf(c) <= goal, col: c }; };
    g.good = () => { const d = g.dist(); if (!d) return []; return g.chains.filter(K => !K.web && distOf(flipped(g.col, K)) === d - 1); };
    g.swap = K => {
      if (!K || g.won()) return [];
      g.history.push(g.col.slice()); g.col = flipped(g.col, K); g.col[hole] = -1; g.moves++; compute();
      emit({ type: 'swap', changed: K.vs, chain: K }); return K.vs;
    };
    g.undo = () => { if (!g.history.length) return; g.col = g.history.pop(); g.moves = Math.max(0, g.moves - 1); compute(); emit({ type: 'undo', changed: [] }); };
    g.reset = () => { g.col = L.start.slice(); g.col[hole] = -1; g.history = []; g.moves = 0; compute(); emit({ type: 'reset', changed: [] }); };
    g.on = fn => { g.subs.push(fn); return g; };
    g.canon = () => canon(g.col);
    compute();
    if (DEMO) demo(g);
    if (EMBED) {
      const post = type => { if (DEMO) return; const m = { fth: 1, type, id: L.id, num: String(L.num), moves: g.moves, won: g.won(), free: g.free(), col: g.col.slice() };
        if (type === 'swap') { if (AT) { m.at = AT; AT = null; SWT = 0; } else SWT = performance.now(); } parent.postMessage(m, '*'); };
      g.post = post; LAST = g;
      g.on((_, info) => { g.doneSent = false; post(info.type); });
      addEventListener('message', e => { const d = e.data; if (!d || !d.fth || e.source !== parent) return; if (d.cmd === 'undo') g.undo(); else if (d.cmd === 'reset') g.reset(); });
      post('ready');
    }
    return g;
  }
  // inside the app (?embed=1 in a frame): report to the parent; LAB.done() says the skin's win celebration is over
  const EMBED = new URLSearchParams(location.search).get('embed') === '1' && window.parent !== window;
  // ?demo=1 (the skin shop's live preview): the page plays itself. Every ~1.6 s it swaps a chain from g.good() (any chain
  // when none is known), resets ~2 s after a win, and never reports to the parent (no swap/ready/done/error message, so
  // the shell's win flow and the research log never see a demo). Only the swap and reset go through g, so a page redraws
  // them the way it redraws a swap from outside (the embed check's swaps).
  const DEMO = new URLSearchParams(location.search).get('demo') === '1';
  function demo(g) {
    let n = 0;
    const tick = () => {
      if (g.won() || n >= 14) { n = 0; setTimeout(() => { g.reset(); setTimeout(tick, 1200); }, 2000); return; }
      const all = g.chains.filter(K => !K.web), good = g.good();
      const K = good.length ? good[0] : all[Math.floor(Math.random() * all.length)];
      if (K) { g.swap(K); n++; }
      setTimeout(tick, 1600);
    };
    setTimeout(tick, 1400);
  }
  // a skin that throws (for example on a map it cannot draw) tells the app, which falls back to its own board
  if (DEMO) addEventListener('error', () => { window.LAB_DEMO_ERROR = true; });   // the shop then shows the skin's card instead
  if (EMBED && !DEMO) addEventListener('error', e => /ResizeObserver/.test(e.message) ? 0 : parent.postMessage({ fth: 1, type: 'error', lvl: new URLSearchParams(location.search).get('lvl'), message: String(e.message) }, '*'));
  let LAST = null;
  // LAB.at: where the next (or the just-made) swap happened, page CSS px; rides on the next posted swap (or the one just posted)
  // (called right after a swap that went out without it: a small { type: 'at' } follows, which the app still uses)
  let AT = null, atT = 0, SWT = 0;
  const at = (x, y) => {
    if (!EMBED || DEMO || !isFinite(x) || !isFinite(y)) return; const p = [Math.round(x), Math.round(y)];
    if (SWT && performance.now() - SWT < 400 && LAST) { SWT = 0; parent.postMessage({ fth: 1, type: 'at', id: LAST.level.id, at: p }, '*'); return; }
    AT = p; clearTimeout(atT); atT = setTimeout(() => { AT = null; }, 1500);
  };
  // LAB.egg: a page easter egg (declared in the skin's eggs with on: 'page'); the app credits it quietly
  const egg = (id, pts) => { if (EMBED && !DEMO) parent.postMessage({ fth: 1, type: 'egg', id: String(id), pts: Math.max(0, +pts || 0), lvl: LAST ? LAST.level.id : new URLSearchParams(location.search).get('lvl') }, '*'); };
  // posted once per win: a repeat call (or a second timer) is ignored until the game changes again
  const done = () => { if (LAST && LAST.won() && !LAST.doneSent) { LAST.doneSent = true; LAST.post('done'); } };
  // a skin with its own goal (Blank Doodle: colour every piece) says it is finished; moves = its swap count
  const finish = moves => { if (EMBED && !DEMO && LAST) parent.postMessage({ fth: 1, type: 'done', id: LAST.level.id, num: String(LAST.level.num), moves: moves || 0, won: true, own: true }, '*'); };
  // Skin tokens in the frame: the app passes its --sk-* tokens (SKIN-SPEC 3b) so a page's own controls (undo, restart,
  // hints...) can wear the skin: use var(--sk-ctl, <your colour>) in CSS or LAB.tok('--sk-ctl', '<your colour>') in canvas
  // code. Standalone nothing is set, so every fallback applies. Kept in sync when the skin changes (event 'sk-tokens').
  const TOKEN_NAMES = ['--sk-ctl', '--sk-ctl-ink', '--sk-ctl-edge', '--sk-accent', '--sk-ink', '--sk-font', '--sk-chip', '--sk-chip-ink', '--sk-edge', '--sk-btn2', '--sk-btn2-ink'];
  let TOK = {};
  const setTokens = vars => {
    TOK = {}; for (const k of Object.keys(vars || {})) if (/^--sk-[a-z0-9-]+$/.test(k) && typeof vars[k] === 'string' && vars[k].trim() && !/[{};<]/.test(vars[k])) TOK[k] = vars[k].trim();
    let st = document.getElementById('sk-tokens'); if (!st) { st = document.createElement('style'); st.id = 'sk-tokens'; document.head.appendChild(st); }
    st.textContent = ':root{' + Object.keys(TOK).map(k => k + ':' + TOK[k]).join(';') + '}';
    document.dispatchEvent(new CustomEvent('sk-tokens'));
  };
  if (EMBED) {
    document.documentElement.classList.add('embed');
    try { const cs = parent.getComputedStyle(parent.document.body), v = {}; TOKEN_NAMES.forEach(k => { v[k] = cs.getPropertyValue(k); }); setTokens(v); } catch (e) { /* cross-origin: the app posts them instead */ }
    addEventListener('message', e => { const d = e.data; if (d && d.fth && d.cmd === 'tokens' && e.source === parent) setTokens(d.vars); });
  }
  const tok = (name, fallback) => TOK[name] || fallback;
  window.LAB = { game, ELEM, ICON, embedded: EMBED, demo: DEMO, done, finish, at, egg, last: () => LAST, tokens: () => Object.assign({}, TOK), tok, TOKEN_NAMES };
})();
