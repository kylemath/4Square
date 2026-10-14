/* degree.js: the die counter (Fisk's degree) of a 4square colouring, and the rim's frame, locks and π.
 *
 * The die is a tetrahedron whose four faces are the four elements: face F_k is the one element k does NOT touch (the face
 * opposite vertex k when the vertices are the elements). Every corner of the map (a triangle of the planar graph, three
 * regions meeting) uses three elements, so it lands on one face of the die, read clockwise (+1) or anticlockwise (-1).
 *
 * DEFINITION (precise; follows MathPathwayPF-degree.md, Lemma 1, in our own sign convention):
 *   - orientation: the graph's rotation system `rot` gives the faces; they are oriented so that a corner (p, q, r) runs
 *     clockwise on screen in the graph's own drawing `pos` (y down); without `pos` (the arena's generated maps) the
 *     rotation system's own orientation is used. Maps that are not 4-element triangulations with a
 *     degree-5 hole (the onboarding ponds) have no counter: of() returns null.
 *   - the disc D = the map minus the hole and its 5 corners. For each die face k:
 *       n_k = sum over corners (p, q, r) of D with elements {a, b, c} = all but k of  sign(a, b, c, k)
 *     where sign is the parity of (a, b, c, k) as a permutation of (0, 1, 2, 3).
 *   - the rim loop: the 5 rim elements in clockwise order, a closed walk on the die's edges. It always reduces (cancel each
 *     back-and-forth a b a -> a) to one triangle (u, v, w): the rim wraps face m = the element missing from it (when the
 *     hole is not fillable, m is the apex: the single element between the two copies of the trouble spot), with the
 *     orientation eps = sign(u, v, w, m).
 *   - Lemma 1 (proved in the research note; checked on every state of every level by tools/degree_check.js):
 *       n_k = N for the three faces k != m,   n_m = N - eps   (in this convention).
 *     So the four counts are one number N plus the rim's correction. N is THE DIE COUNTER: how many times the map away from
 *     the hole wraps around the die. It is well defined (whichever face k != m is counted; the rim face reads N - eps).
 *     When the hole is filled with the free element m, the whole sphere has Fisk's degree n_m(D) = N - eps.
 *   - renaming the elements by an odd permutation flips every sign (N -> -N, eps -> -eps); N * eps does not change, so
 *     label-free statistics (and an agent input) should use N * eps. The game's colours are labelled, so the HUD shows N.
 *
 * FRAME, LOCKS, π (for 4 elements and a 5-rim, as kempe_engine.py and index.html's piChain, in the order of Gr.link):
 *   rim x0..x4 reads alpha beta alpha gamma delta (alpha twice: the trouble spot); lock 1: x3 is on x1's {beta, gamma}
 *   chain; lock 2: x4 is on x1's {beta, delta} chain; doubly locked = both. π (Kittell's move) swaps x2's {alpha, gamma}
 *   chain; the trouble spot then sits two places round the rim.
 *
 *   FTH_DEGREE.prep(G)            G = { n, hole, rot, pos, link?, ncol? } (a levels.js graph, or a lab/core.js game) -> cached
 *                                 { ok, faces, ring (rim in clockwise order), link } (ok: the counter exists here)
 *   FTH_DEGREE.counts(G, col)     -> { N, n: [n0..n3], m, eps, ok } or null; ok = Lemma 1's shape held
 *   FTH_DEGREE.of(G, col)         -> N or null
 *   FTH_DEGREE.frame(G, col)      -> { t, x: [x0..x4], a, b, c, d } (a = alpha ...) or null (filled, or no 4-element 5-rim)
 *   FTH_DEGREE.locks(G, col)      -> { l1, l2, dl } or null
 *   FTH_DEGREE.pi(G, col)         -> { vs, pair } π's chain at a doubly locked rim, or null
 *   FTH_DEGREE.swap(col, vs, a, b) -> a copy of col with a and b exchanged on the regions vs
 * Pure: no DOM. Runs in the browser (window.FTH_DEGREE) and in node through vm (tools/degree_check.js).
 */
(function () {
  'use strict';
  const W = typeof window !== 'undefined' ? window : globalThis;
  // sign of (a, b, c, k) as a permutation of 0..3, indexed a * 16 + b * 4 + c (0 when two are equal)
  const SG = new Int8Array(64);
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
    if (a === b || b === c || a === c) continue;
    const p = [a, b, c, 6 - a - b - c]; let s = 1;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (p[i] > p[j]) s = -s;
    SG[a * 16 + b * 4 + c] = s;
  }
  const sign = (a, b, c) => (a < 0 || b < 0 || c < 0 || a > 3 || b > 3 || c > 3) ? 0 : SG[a * 16 + b * 4 + c];
  const CACHE = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function prep(G) {
    if (CACHE && CACHE.has(G)) return CACHE.get(G);
    const n = G.n, hole = G.hole, rot = G.rot, pos = G.pos;
    const out = { ok: false, faces: [], ring: [], link: (G.link || G.rim || []).slice() };
    if (!rot || (G.ncol || G.NC || 4) !== 4) { if (CACHE) CACHE.set(G, out); return out; }
    // faces of the rotation system: after the dart a -> b comes b -> (the neighbour before a round b)
    const seen = new Set(), faces = [];
    for (let u = 0; u < n; u++) for (const v of rot[u]) {
      if (seen.has(u * n + v)) continue;
      const f = []; let a = u, b = v, guard = 0;
      while (!seen.has(a * n + b) && guard++ < 4 * n) { seen.add(a * n + b); f.push(a); const r = rot[b], i = r.indexOf(a); const w = r[(i - 1 + r.length) % r.length]; a = b; b = w; }
      faces.push(f);
    }
    const tri = faces.every(f => f.length === 3) && faces.length === 2 * n - 4;
    // clockwise on screen (y down) = positive shoelace area; the outer face of the drawing votes the other way, so use the majority
    let vote = 0;
    if (pos) for (const f of faces) { if (f.length !== 3) continue; const [p, q, r] = f.map(u => pos[u]); const A = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); vote += A > 0 ? 1 : A < 0 ? -1 : 0; }
    if (vote < 0) faces.forEach(f => f.reverse());
    const star = faces.filter(f => f.includes(hole)), D = faces.filter(f => !f.includes(hole));
    out.faces = D;
    // the rim in clockwise order: in a clockwise corner (hole, x, y) the next rim region after x is y
    const nxt = new Map();
    for (const f of star) { const i = f.indexOf(hole); nxt.set(f[(i + 1) % 3], f[(i + 2) % 3]); }
    const start = out.link.length ? out.link[0] : star.length ? star[0][(star[0].indexOf(hole) + 1) % 3] : -1;
    for (let x = start, k = 0; x != null && x >= 0 && k < star.length; k++) { out.ring.push(x); x = nxt.get(x); }
    out.ok = tri && star.length === 5 && out.ring.length === 5;
    if (CACHE) CACHE.set(G, out);
    return out;
  }

  // the rim loop reduced to its triangle: { m, eps, tri } (m = the face it wraps), or null
  function rimFace(ring, col) {
    let w = ring.map(x => col[x]);
    if (w.some(c => c < 0 || c > 3)) return null;
    while (w.length > 3) {
      const L = w.length; let i = -1;
      for (let t = 0; t < L; t++) if (w[t] === w[(t + 2) % L]) { i = t; break; }
      if (i < 0) return null;
      w = w.slice(i).concat(w.slice(0, i));     // rotate so the back-and-forth a b a starts at 0, then drop "b a"
      w = [w[0]].concat(w.slice(3));
    }
    if (w.length !== 3 || w[0] === w[1] || w[1] === w[2] || w[0] === w[2]) return null;
    return { m: 6 - w[0] - w[1] - w[2], eps: sign(w[0], w[1], w[2]), tri: w };
  }

  function counts(G, col) {
    const P = prep(G); if (!P.ok) return null;
    const n = [0, 0, 0, 0];
    for (const f of P.faces) {
      const a = col[f[0]], b = col[f[1]], c = col[f[2]], s = sign(a, b, c);
      if (s) n[6 - a - b - c] += s;
    }
    const R = rimFace(P.ring, col); if (!R) return null;
    const others = [0, 1, 2, 3].filter(k => k !== R.m).map(k => n[k]), N = others[0];
    return { N, n, m: R.m, eps: R.eps, ok: others.every(v => v === N) && n[R.m] === N - R.eps };
  }
  const of = (G, col) => { const c = counts(G, col); return c ? c.N : null; };

  // ---- frame, locks and π (the order of Gr.link, as the shell and kempe_engine.py)
  function adjOf(G) {
    if (G.adj) return G.adj;
    if (G._dAdj) return G._dAdj;
    const A = Array.from({ length: G.n }, () => []);
    if (G.edges) G.edges.forEach(([a, b]) => { A[a].push(b); A[b].push(a); });
    else if (G.rot) G.rot.forEach((r, u) => r.forEach(v => A[u].push(v)));
    try { Object.defineProperty(G, '_dAdj', { value: A, enumerable: false }); } catch (e) { /* frozen */ }
    return A;
  }
  function chain(G, col, u, b) {                 // the {col[u], b} chain through u (the hole excluded)
    const A = adjOf(G), a = col[u], set = new Set([u]), st = [u];
    while (st.length) { const v = st.pop(); for (const w of A[v]) if (w !== G.hole && !set.has(w) && (col[w] === a || col[w] === b)) { set.add(w); st.push(w); } }
    return set;
  }
  function frame(G, col) {
    const L = (G.link || G.rim || []); if (L.length !== 5 || (G.ncol || G.NC || 4) !== 4) return null;
    const r = L.map(x => col[x]); if (new Set(r).size < 4) return null;   // filled: the hole can take the free element
    for (let t = 0; t < 5; t++) if (r[t] === r[(t + 2) % 5]) {
      const x = [0, 1, 2, 3, 4].map(i => L[(t + i) % 5]);
      return { t, x, a: col[x[0]], b: col[x[1]], c: col[x[3]], d: col[x[4]] };
    }
    return null;
  }
  function locks(G, col) {
    const F = frame(G, col); if (!F) return null;
    const l1 = chain(G, col, F.x[1], F.c).has(F.x[3]), l2 = chain(G, col, F.x[1], F.d).has(F.x[4]);
    return { l1, l2, dl: l1 && l2, frame: F };
  }
  function pi(G, col) {
    const Lk = locks(G, col); if (!Lk || !Lk.dl) return null;
    const F = Lk.frame, K = chain(G, col, F.x[2], F.c);
    return K.has(F.x[0]) ? null : { vs: [...K].sort((p, q) => p - q), pair: [F.a, F.c] };
  }
  // a chain swap: exchange elements a and b on the regions vs
  const swap = (col, vs, a, b) => { const d = col.slice(); vs.forEach(u => { d[u] = d[u] === a ? b : d[u] === b ? a : d[u]; }); return d; };

  W.FTH_DEGREE = { prep, counts, of, rimFace, frame, locks, pi, chain, swap, sign };
})();
