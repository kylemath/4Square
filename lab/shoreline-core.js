/* lab/shoreline-core.js: the rules of the Shoreline variant, with no drawing (used by lab/shoreline.html and
 * tools/shoreline_check.js).
 *
 * Shoreline is the ordinary game with one restriction: a swap is allowed only when its chain contains at least one
 * SHORE tile. Webs (the only chain of their colour pair) are excluded as everywhere else.
 *
 *   SHORE.shells(n, adj, hole)                -> d[u] = BFS distance from the hole (hole 0, rim 1, ...)
 *   SHORE.shore(spec, mode)                   -> { set: Set, mode } ; spec = { n, adj, hole, border }
 *        mode 'beach'  : the 3 outer-face tiles (g.border). Maps without a border (onboarding ponds) fall back to 'shells'.
 *        mode 'shells' : the outermost two BFS shells from the hole (d >= maxd - 1).
 *   SHORE.moves(spec, col, shoreSet)           -> allowed chains [{ pair: [a, b], vs: [...] }]
 *   SHORE.solve(spec, col, shoreSet, opts)     -> { dist, line, states, capped }
 *        Breadth-first search over colourings (up to renaming of the elements) reachable with allowed swaps.
 *        dist = fewest allowed swaps to a win (0 if already won), or null if none within opts.maxDepth (7) /
 *        opts.maxStates (50,000; capped = true then). line = the vertex sets of one optimal sequence of chains
 *        (a chain's vertex set does not depend on the renaming, so line[0] is a chain of the actual colouring).
 * spec also carries rim, NC (number of elements) and goal (rim elements allowed at the win, 3 on the usual maps).
 */
(function (root) {
  'use strict';
  function shells(n, adj, hole) {
    const d = new Array(n).fill(-1); d[hole] = 0; let fr = [hole];
    while (fr.length) { const nx = []; for (const u of fr) for (const w of adj[u]) if (d[w] < 0) { d[w] = d[u] + 1; nx.push(w); } fr = nx; }
    return d;
  }
  function shore(spec, mode) {
    if (mode !== 'shells' && spec.border && spec.border.length) return { set: new Set(spec.border), mode: 'beach' };
    const d = shells(spec.n, spec.adj, spec.hole), mx = Math.max(...d), set = new Set();
    for (let u = 0; u < spec.n; u++) if (u !== spec.hole && d[u] >= mx - 1) set.add(u);
    return { set, mode: 'shells' };
  }
  // every non-web chain that meets the shore
  function moves(spec, col, S) {
    const { n, adj, hole } = spec, NC = spec.NC || 4, out = [];
    for (let a = 0; a < NC; a++) for (let b = a + 1; b < NC; b++) {
      const seen = new Uint8Array(n), comps = [];
      for (let s = 0; s < n; s++) {
        if (s === hole || seen[s] || (col[s] !== a && col[s] !== b)) continue;
        const vs = [s]; seen[s] = 1; let hit = S.has(s);
        for (let i = 0; i < vs.length; i++) for (const w of adj[vs[i]]) if (w !== hole && !seen[w] && (col[w] === a || col[w] === b)) { seen[w] = 1; vs.push(w); if (S.has(w)) hit = true; }
        comps.push({ pair: [a, b], vs, hit });
      }
      if (comps.length < 2) continue;                         // a web: only renames two elements
      for (const K of comps) if (K.hit) { K.vs.sort((x, y) => x - y); out.push({ pair: K.pair, vs: K.vs }); }
    }
    return out;
  }
  const flip = (col, K) => { const d = col.slice(), [a, b] = K.pair; for (const u of K.vs) d[u] = d[u] === a ? b : a; return d; };
  const won = (spec, col) => new Set(spec.rim.map(x => col[x])).size <= (spec.goal || 3);
  function canon(spec, col) { const mp = [-1, -1, -1, -1]; let s = '', k = 0; for (let u = 0; u < spec.n; u++) { if (u === spec.hole) continue; const c = col[u]; if (mp[c] < 0) mp[c] = k++; s += mp[c]; } return s; }
  function solve(spec, col0, S, opts) {
    opts = opts || {}; const maxDepth = opts.maxDepth == null ? 7 : opts.maxDepth, maxStates = opts.maxStates || 50000;
    if (won(spec, col0)) return { dist: 0, line: [], states: 1, capped: false };
    const k0 = canon(spec, col0), par = new Map([[k0, null]]);
    let front = [[k0, col0]], depth = 0, capped = false;
    while (front.length && depth < maxDepth) {
      depth++; const nx = [];
      for (const [key, col] of front) {
        for (const K of moves(spec, col, S)) {
          const c = flip(col, K), kk = canon(spec, c);
          if (par.has(kk)) continue;
          par.set(kk, { from: key, vs: K.vs });
          if (won(spec, c)) {
            const line = []; let k = kk; while (par.get(k)) { line.unshift(par.get(k).vs); k = par.get(k).from; }
            return { dist: depth, line, states: par.size, capped: false };
          }
          if (par.size >= maxStates) { capped = true; break; }
          nx.push([kk, c]);
        }
        if (capped) break;
      }
      if (capped) break;
      front = nx;
    }
    return { dist: null, line: [], states: par.size, capped };
  }
  const api = { shells, shore, moves, solve, won, canon, flip };
  root.SHORE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
