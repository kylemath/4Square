/* lab/signs-model.js: the Signs skin's maths (window.FTH_SIGNS). Design note: lab/SIGNS-DESIGN.md.
 *
 * A 4square level is a sphere triangulation (regions = vertices, borders = edges, map corners = faces), hole included.
 * Cut the sphere along a Hamiltonian cycle through every vertex, the hole too, and it falls into two triangulated n-gons
 * glued along their rim: Flip's picture (lab/FLIP-DESIGN.md, Whitney / Eliahou / Gravier-Payan). The ring is drawn
 * clockwise from the top with the hole at ring place 0; one side's diagonals are straight chords inside the ring, the
 * other side's are arcs outside it. That drawing is a planar embedding of the same sphere, oriented like the level's own
 * `pos` drawing, so a face's screen orientation is the sphere's.
 *
 *   sign(face) = Eliahou's sign in F4 (lab/flip-model.js triSign): colours 0..3 as F4, + is xor, edge colour = sum of ends,
 *                + when the edge colours run 1 -> w -> w^2 counterclockwise. Faces at the hole have no sign (0: "open").
 *   THEOREM      a Kempe swap of an {a, b} chain K flips the sign of exactly the signed faces touching K (a vertex in K)
 *                and no other: on K the swap is the transposition (a b), odd, so it reverses the tetrahedron; a face touching
 *                K has all its a/b vertices in K (a neighbour of K coloured a or b is in K) and its c/d vertices fixed.
 *                tools/signs_check.js verifies it on every reachable state of every level.
 *
 *   FTH_SIGNS.cut(G)              G = a levels.js graph or a lab/core.js game ({ n, hole, edges, rot, pos }) -> cached
 *     { ok, ham, n, hole, ring: [hole, v1, ...], at: ring place of each vertex, faces: [{ v: [ccw], r: [ring places, ascending],
 *       side: 'in'|'out', open }], chords: { in: [[i, j]], out: [[i, j, h]] } (ring places, i < j; h = arc nesting height),
 *       H (max outside height), bridges: [[i, i + 1]] (ring sides that are not borders: never for a Hamiltonian cut) }
 *     The cycle is searched deterministically (seeded DFS restarts, a fixed node budget) and the drawing chosen for the
 *     lowest outside arc stack, then the shortest inside chords, then the hole's chords inside (its fan at the top).
 *   FTH_SIGNS.signs(C, col)       -> Int8Array, one sign per face (+1, -1, 0 open)
 *   FTH_SIGNS.triSign(col, a, b, c)
 *   FTH_SIGNS.touching(C, set)    -> face indices that are signed and touch the vertex set (a chain's flip set)
 *   FTH_SIGNS.chains(G, col)      -> [{ pair, vs, set }] every two-element chain (the hole excluded), as lab/core.js
 *   FTH_SIGNS.swap(col, K)        -> a copy of col with K's two elements exchanged on K
 *   FTH_SIGNS.colouring(C, s, c1, c2) -> the colouring the signs s encode with ring places 1 and 2 coloured c1, c2
 *                                    (null if the signs are inconsistent): signs determine the colouring
 * Pure: no DOM. Browser (window.FTH_SIGNS) and node through vm (tools/signs_check.js).
 */
(function () {
  'use strict';
  const W = typeof window !== 'undefined' ? window : globalThis;
  function triSign(col, a, b, c) {      // as lab/flip-model.js
    const e1 = col[a] ^ col[b], e2 = col[b] ^ col[c], e3 = col[c] ^ col[a];
    if (col[a] < 0 || col[b] < 0 || col[c] < 0 || !e1 || !e2 || !e3) return 0;
    return e2 === e1 % 3 + 1 ? 1 : -1;
  }
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function adjOf(G) {
    const A = Array.from({ length: G.n }, () => []);
    if (G.edges) G.edges.forEach(([a, b]) => { A[a].push(b); A[b].push(a); }); else G.rot.forEach((r, u) => r.forEach(v => A[u].push(v)));
    return A;
  }
  // faces of the rotation system, each counterclockwise on screen in the level's pos drawing (y down)
  function facesOf(G) {
    const n = G.n, rot = G.rot, seen = new Set(), F = [];
    for (let u = 0; u < n; u++) for (const v of rot[u]) {
      if (seen.has(u * n + v)) continue;
      const f = []; let a = u, b = v, k = 0;
      while (!seen.has(a * n + b) && k++ < 4 * n) { seen.add(a * n + b); f.push(a); const r = rot[b], i = r.indexOf(a); const w = r[(i - 1 + r.length) % r.length]; a = b; b = w; }
      F.push(f);
    }
    let vote = 0;
    if (G.pos) for (const f of F) { if (f.length !== 3) continue; const [p, q, r] = f.map(x => G.pos[x]); const A = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); vote += A > 0 ? -1 : A < 0 ? 1 : 0; }
    if (vote < 0) F.forEach(f => f.reverse());
    return F;
  }
  // Hamiltonian cycles through the hole: DFS restarts with seeded neighbour orders, each keeps its first few cycles
  function hamCycles(n, A, start, want, budget) {
    const out = [], keys = new Set();
    for (let rs = 0; rs < 24 && out.length < want; rs++) {
      const R = rng(1009 + rs * 7919), ord = A.map(l => l.slice().sort((x, y) => x - y)); if (rs) ord.forEach(l => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } });
      const on = new Uint8Array(n), path = [start]; on[start] = 1; let nodes = 0, got = 0;
      const isAdjStart = new Uint8Array(n); A[start].forEach(v => { isAdjStart[v] = 1; });
      const dfs = u => {
        if (++nodes > budget || got >= 3) return;
        if (path.length === n) { if (isAdjStart[u]) { const c = path[1] < path[n - 1] ? path.slice() : [start].concat(path.slice(1).reverse()), k = c.join(); if (!keys.has(k)) { keys.add(k); out.push(c); got++; } } return; }
        // the previous end is now inside the path: a free neighbour of it left with under two ways in (free vertices,
        // the new end, the start) can never be threaded
        const p = path.length > 1 ? path[path.length - 2] : -1;
        if (p >= 0) for (const x of A[p]) if (!on[x]) { let w = 0; for (const y of A[x]) if (!on[y] || y === u || y === start) w++; if (w < 2) return; }
        for (const v of ord[u]) {
          if (on[v]) continue; on[v] = 1; path.push(v); dfs(v); path.pop(); on[v] = 0;
          if (nodes > budget || got >= 3) return;
        }
      };
      dfs(start);
    }
    return out;
  }
  // one drawing of a cycle: `inSide` is the side whose diagonals are straight chords; the ring direction then follows
  // from keeping the pos drawing's orientation (inside faces read clockwise in ring order)
  function drawing(G, F, cyc, sideOf, inSide) {
    const n = G.n;
    let ring = cyc.slice();
    // orientation: an inside face (a, b, c) ccw on screen must have descending ring places (the ring runs clockwise)
    const at0 = new Int32Array(n); ring.forEach((v, i) => { at0[v] = i; });
    const f0 = F.find((f, i) => sideOf[i] === inSide);
    if (f0) { const p = f0.map(v => at0[v]), k = p.indexOf(Math.min(...p)); if (p[(k + 1) % 3] < p[(k + 2) % 3]) ring = [ring[0]].concat(ring.slice(1).reverse()); }
    const at = new Int32Array(n); ring.forEach((v, i) => { at[v] = i; });
    const faces = F.map((f, i) => ({ v: f.slice(), r: f.map(v => at[v]).sort((x, y) => x - y), side: sideOf[i] === inSide ? 'in' : 'out', open: f.includes(G.hole) }));
    const cin = [], cout = [], seen = new Set(), H = new Map();
    const key = (i, j) => i * n + j, isSide = (i, j) => j === i + 1 || (i === 0 && j === n - 1);
    for (const f of faces) for (const [i, j] of [[f.r[0], f.r[1]], [f.r[1], f.r[2]], [f.r[0], f.r[2]]]) {
      if (isSide(i, j) || seen.has(key(i, j))) continue; seen.add(key(i, j)); (f.side === 'in' ? cin : cout).push([i, j]);
    }
    // outside arcs nest (the gap sits between ring places n-1 and 0, beside the hole): height = 1 + the taller child
    const outF = faces.filter(f => f.side === 'out').sort((a, b) => (a.r[2] - a.r[0]) - (b.r[2] - b.r[0]));
    const h = (i, j) => isSide(i, j) && !(i === 0 && j === n - 1) ? 0 : H.get(key(i, j)) || 0;
    let top = 0;
    for (const f of outF) { const [a, b, c] = f.r, v = 1 + Math.max(h(a, b), h(b, c)); if (a === 0 && c === n - 1) top = Math.max(top, v - 1); else H.set(key(a, c), v); }
    cout.forEach(e => e.push(H.get(key(e[0], e[1])) || 1));
    const Hmax = Math.max(top, ...cout.map(e => e[2]), 0);
    const span = (i, j) => Math.min(j - i, n - (j - i));
    const holeOut = cout.filter(e => e[0] === 0).length;
    return { ok: true, ham: true, n, hole: G.hole, ring, at: Array.from(at), faces, chords: { in: cin, out: cout }, H: Hmax, bridges: [],
      score: Hmax * 1000 + cin.reduce((s, e) => s + span(e[0], e[1]), 0) + holeOut * 50 };
  }
  const CACHE = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function cut(G) {
    if (CACHE && CACHE.has(G)) return CACHE.get(G);
    const n = G.n, A = adjOf(G), m = A.reduce((s, l) => s + l.length, 0) / 2;
    let best = { ok: false, ham: false, n, hole: G.hole, ring: [], at: [], faces: [], chords: { in: [], out: [] }, H: 0, bridges: [] };
    if (G.rot && m === 3 * n - 6 && n >= 4) {
      const F = facesOf(G);
      if (F.length === 2 * n - 4 && F.every(f => f.length === 3)) {
        for (const cyc of hamCycles(n, A, G.hole, 48, 60000)) {
          // the side of each non-cycle edge: round v the neighbours strictly between next and prev (in rot order) are side 1
          const on = new Map(); for (let i = 0; i < n; i++) { const a = cyc[i], b = cyc[(i + 1) % n]; on.set(a * n + b, 1); on.set(b * n + a, 1); }
          const side = new Map();
          for (let i = 0; i < n; i++) { const v = cyc[i], nx = cyc[(i + 1) % n], pv = cyc[(i - 1 + n) % n], r = G.rot[v], k0 = r.indexOf(nx); let s = 1;
            for (let t = 1; t < r.length; t++) { const w = r[(k0 + t) % r.length]; if (w === pv) { s = 2; continue; } side.set(v * n + w, s); } }
          const sideOf = F.map(f => { for (let t = 0; t < 3; t++) { const a = f[t], b = f[(t + 1) % 3]; if (!on.has(a * n + b)) return side.get(a * n + b); } return 0; });
          for (const s of [1, 2]) { const D = drawing(G, F, cyc, sideOf, s); if (!best.ok || D.score < best.score) best = D; }
        }
      }
    }
    if (!best.ok && G.pos) {
      // not a triangulation (the Level -1 ponds; the skin's needs: ['tri'] sends them to the island board): corners round
      // the hole by angle, every border a straight chord, no triangles, so no signs. Ring sides that are not borders are bridges.
      const h = G.pos[G.hole], rest = [];
      for (let v = 0; v < n; v++) if (v !== G.hole) rest.push(v);
      const an = v => { const a = Math.atan2(G.pos[v][0] - h[0], -(G.pos[v][1] - h[1])); return a < 0 ? a + 2 * Math.PI : a; };
      rest.sort((a, b) => an(a) - an(b) || a - b);
      const ring = [G.hole].concat(rest), at = new Array(n); ring.forEach((v, i) => { at[v] = i; });
      const E = new Set(); (G.edges || []).forEach(([a, b]) => { E.add(a * n + b); E.add(b * n + a); });
      const cin = [], bridges = [];
      (G.edges || []).forEach(([a, b]) => { const i = Math.min(at[a], at[b]), j = Math.max(at[a], at[b]); if (!(j === i + 1 || (i === 0 && j === n - 1))) cin.push([i, j]); });
      for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; if (!E.has(a * n + b)) bridges.push([i, (i + 1) % n]); }
      best = { ok: true, ham: false, tri: false, n, hole: G.hole, ring, at, faces: [], chords: { in: cin, out: [] }, H: 0, bridges };
    } else if (best.ok) best.tri = true;
    if (CACHE) CACHE.set(G, best);
    return best;
  }
  function signs(C, col) {
    const s = new Int8Array(C.faces.length);
    C.faces.forEach((f, i) => { s[i] = f.open ? 0 : triSign(col, f.v[0], f.v[1], f.v[2]); });
    return s;
  }
  function touching(C, set) { const out = []; C.faces.forEach((f, i) => { if (!f.open && f.v.some(v => set.has(v))) out.push(i); }); return out; }
  function chains(G, col) {
    const n = G.n, A = adjOf(G), out = [], NC = G.ncol || G.NC || 4;
    for (let a = 0; a < NC; a++) for (let b = a + 1; b < NC; b++) {
      const seen = new Uint8Array(n);
      for (let s = 0; s < n; s++) {
        if (s === G.hole || seen[s] || (col[s] !== a && col[s] !== b)) continue;
        const set = new Set([s]), st = [s]; seen[s] = 1;
        while (st.length) { const u = st.pop(); for (const w of A[u]) if (w !== G.hole && !seen[w] && (col[w] === a || col[w] === b)) { seen[w] = 1; set.add(w); st.push(w); } }
        out.push({ pair: [a, b], vs: [...set].sort((x, y) => x - y), set });
      }
    }
    return out;
  }
  function swap(col, K) { const d = col.slice(); K.set.forEach(u => { d[u] = d[u] === K.pair[0] ? K.pair[1] : K.pair[0]; }); return d; }
  // signs -> colouring: fix ring places 1 and 2, then each signed face with two coloured corners forces its third
  function colouring(C, s, c1, c2) {
    const n = C.n, col = new Array(n).fill(-1); col[C.ring[1]] = c1; col[C.ring[2]] = c2;
    let grew = true;
    while (grew) {
      grew = false;
      C.faces.forEach((f, i) => {
        if (f.open) return; const k = f.v.filter(v => col[v] >= 0).length; if (k !== 2) return;
        const w = f.v.find(v => col[v] < 0), used = f.v.filter(v => col[v] >= 0).map(v => col[v]);
        for (let x = 0; x < 4; x++) { if (used.includes(x)) continue; col[w] = x; if (triSign(col, f.v[0], f.v[1], f.v[2]) === s[i]) break; col[w] = -1; }
        if (col[w] < 0) return; grew = true;
      });
    }
    for (let i = 0; i < C.faces.length; i++) { const f = C.faces[i]; if (!f.open && triSign(col, f.v[0], f.v[1], f.v[2]) !== s[i]) return null; }
    return col;
  }
  W.FTH_SIGNS = { cut, signs, triSign, touching, chains, swap, colouring, facesOf, hamCycles };
})();
