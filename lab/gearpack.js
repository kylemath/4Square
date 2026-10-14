/* lab/gearpack.js: the Gears layout. One circle per region (and one for the hole), neighbours tangent, nothing overlapping:
 * a circle packing of the map (Koebe-Andreev-Thurston), then teeth that mesh. Design note: lab/GEARS-DESIGN.md "Layout".
 *
 *   const P = GEARPACK.pack(G, ref)      G = { n, hole, rot } (a levels.js graph or a lab/core.js game); ref = the stored
 *                                        drawing (g.centre || g.pos), only for handedness. Cached per G.
 *     -> { n, N, tris, nb, real, outer, r, c, err }   N >= n: maps that are not triangulations (the onboarding ponds) get
 *        hidden filler circles (a ring and a centre in every non-triangular face), so the packing still exists
 *   const V = GEARPACK.view(P, box)      box = { x0, y0, x1, y1 } (px): the Mobius map + similarity that centres the hub in
 *                                        the box and makes the smallest visible gear as big as it can be
 *     -> { S: [[x, y]], R: [r], frame: [u..], minPx, p, th }   (S, R for all N circles, px)
 *   const T = GEARPACK.teeth(P, V, box)  one tooth pitch for every gear, rest phases that mesh
 *     -> { pitch, N: [teeth], ph: [rest angle], clash: { max, mean, edges } }
 *
 * Packing: Collins-Stephenson (angle sums 2pi at interior vertices, the outer triangle's radii fixed), laid out triangle
 * by triangle. View: z -> 1/(z - p) sends a point p of one interstice to infinity (its three circles become the big frame
 * gears that run off the box); p, the rotation and the scale are searched. Pure: no DOM; node via vm (tools/gearpack_check.js).
 */
(function () {
  'use strict';
  const W = typeof window !== 'undefined' ? window : globalThis;
  const TAU = 2 * Math.PI;
  const CACHE = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  // faces of the rotation system: after the dart u -> v comes v -> the neighbour after u round v
  function faces(n, rot) {
    const seen = rot.map(l => new Array(l.length).fill(false)), out = [];
    for (let u = 0; u < n; u++) for (let i = 0; i < rot[u].length; i++) {
      if (seen[u][i]) continue;
      const f = []; let a = u, j = i;
      while (!seen[a][j]) { seen[a][j] = true; f.push(a); const b = rot[a][j], k = rot[b].indexOf(a); a = b; j = (k + 1) % rot[b].length; }
      out.push(f);
    }
    return out;
  }
  // triangles (consistently oriented); a non-triangular face gets a filler at its centre, or (a walk w0..wk-1 that meets a
  // vertex twice, round a pond's leaf) a ring n0..nk-1 and a centre c, so that no edge is doubled
  const LAYERS = 4;
  function triangulate(n, rot) {
    const F = faces(n, rot), tris = [], mids = [], tri = f => f.length === 3 && new Set(f).size === 3; let N = n;
    const deg = rot.map(l => l.length), cor = new Array(n).fill(0);
    F.forEach(f => { if (!tri(f)) f.forEach(v => cor[v]++); });
    for (const f of F) {
      if (tri(f)) { tris.push(f.slice()); continue; }
      const k = f.length;
      if (new Set(f).size === k && f.every(v => deg[v] + cor[v] >= 5)) { const c = N++; mids.push(c); for (let i = 0; i < k; i++) tris.push([f[i], f[(i + 1) % k], c]); continue; }
      // the ring: a filler d_i on every side w_i w_i+1, and extra fillers at a corner whose vertex would be left with few
      // neighbours (a leaf would otherwise sit tiny in a three-circle gap)
      const d = f.map(() => N++), ex = f.map(v => { const m = Math.ceil(Math.max(0, 6 - deg[v] - 2 * cor[v]) / cor[v]); return Array.from({ length: m }, () => N++); });
      let ring = [];
      for (let i = 0; i < k; i++) {
        const j = (i + 1) % k, run = [d[i], ...ex[j], d[j]];
        tris.push([f[i], f[j], d[i]]);
        for (let q = 0; q + 1 < run.length; q++) tris.push([run[q], f[j], run[q + 1]]);
        ring.push(d[i], ...ex[j]);
      }
      // LAYERS more rings inside (a ladder each), then a centre: one big centre circle would squeeze the ring against it
      for (let L = 0; L < LAYERS; L++) {
        const nx = ring.map(() => N++), m = ring.length;
        for (let q = 0; q < m; q++) { const q1 = (q + 1) % m; tris.push([ring[q], ring[q1], nx[q]], [nx[q], ring[q1], nx[q1]]); }
        ring = nx;
      }
      const c = N++; mids.push(c); for (let q = 0; q < ring.length; q++) tris.push([ring[q], ring[(q + 1) % ring.length], c]);
    }
    return { N, tris, F, mids };
  }
  const ang = (r, a, b) => 2 * Math.asin(Math.sqrt(a * b / ((r + a) * (r + b))));   // the angle at r in the triangle r, a, b
  // interior radii until every angle sum is 2pi (the three outer radii stay 1): a few hundred Collins-Stephenson sweeps
  // (r <- the radius that would give 2pi if the k neighbours were all equal), then Newton on u = log r, where
  // d(angle at v in triangle v a b)/du_a = rho / (r_v + r_a), rho = sqrt(r_v r_a r_b / (r_v + r_a + r_b)) (the incircle
  // through the three tangency points): a weighted Laplacian, positive definite with the outer three fixed
  function solve(N, tris, outer) {
    const inc = Array.from({ length: N }, () => []);
    tris.forEach(([a, b, c]) => { inc[a].push(b, c); inc[b].push(c, a); inc[c].push(a, b); });
    const r = new Float64Array(N).fill(1), fixed = new Set(outer), IN = [], ix = new Int32Array(N).fill(-1);
    for (let v = 0; v < N; v++) if (!fixed.has(v)) { ix[v] = IN.length; IN.push(v); }
    const sum = v => { const L = inc[v]; let th = 0; for (let i = 0; i < L.length; i += 2) th += ang(r[v], r[L[i]], r[L[i + 1]]); return th; };
    const maxErr = () => { let e = 0; for (const v of IN) e = Math.max(e, Math.abs(sum(v) - TAU)); return e; };
    let err = Infinity;
    for (let it = 0; it < 60 && err > 1e-13; it++) {
      err = 0;
      for (const v of IN) {
        const k = inc[v].length / 2, th = sum(v);
        err = Math.max(err, Math.abs(th - TAU));
        const be = Math.sin(th / (2 * k)), de = Math.sin(Math.PI / k), vh = r[v] * be / (1 - be);
        r[v] = vh * (1 - de) / de;
      }
    }
    const m = IN.length;
    for (let it = 0; it < 40 && err > 1e-13; it++) {
      const A = new Float64Array(m * m), F = new Float64Array(m);
      for (const v of IN) {
        const i = ix[v], L = inc[v]; F[i] = sum(v) - TAU;
        for (let q = 0; q < L.length; q += 2) {
          const a = L[q], b = L[q + 1], rho = Math.sqrt(r[v] * r[a] * r[b] / (r[v] + r[a] + r[b]));
          for (const w of [a, b]) { const h = rho / (r[v] + r[w]); A[i * m + i] += h; if (ix[w] >= 0) A[i * m + ix[w]] -= h; }
        }
      }
      // Cholesky: A d = F
      for (let j = 0; j < m; j++) {
        let s = A[j * m + j]; for (let k = 0; k < j; k++) s -= A[j * m + k] * A[j * m + k];
        const dj = Math.sqrt(Math.max(s, 1e-300)); A[j * m + j] = dj;
        for (let i = j + 1; i < m; i++) { let t = A[i * m + j]; for (let k = 0; k < j; k++) t -= A[i * m + k] * A[j * m + k]; A[i * m + j] = t / dj; }
      }
      const y = new Float64Array(m);
      for (let i = 0; i < m; i++) { let t = F[i]; for (let k = 0; k < i; k++) t -= A[i * m + k] * y[k]; y[i] = t / A[i * m + i]; }
      for (let i = m - 1; i >= 0; i--) { let t = y[i]; for (let k = i + 1; k < m; k++) t -= A[k * m + i] * y[k]; y[i] = t / A[i * m + i]; }
      const r0 = Float64Array.from(r); let step = 1, big = 0; for (let i = 0; i < m; i++) big = Math.max(big, Math.abs(y[i]));
      if (big > 1) step = 1 / big;
      for (let h = 0; h < 30; h++) {
        for (let i = 0; i < m; i++) r[IN[i]] = r0[IN[i]] * Math.exp(step * y[i]);
        const e = maxErr(); if (e < err || h === 29) { err = e; break; }
        step /= 2;
      }
    }
    return { r: Array.from(r), err };
  }
  // the third centre of a tangent triple: z on the side s of x -> y
  function third(cx, cy, rx, ry, rz, s) {
    const dx = cy[0] - cx[0], dy = cy[1] - cx[1], d = Math.hypot(dx, dy), a = ang(rx, ry, rz) * s, e = Math.atan2(dy, dx);
    return [cx[0] + (rx + rz) * Math.cos(e + a), cx[1] + (rx + rz) * Math.sin(e + a)];
  }
  function place(N, tris, r, outer) {
    const c = new Array(N).fill(null), [a, b, z] = outer;
    c[a] = [0, 0]; c[b] = [r[a] + r[b], 0]; c[z] = third(c[a], c[b], r[a], r[b], r[z], 1);
    let left = tris.length, guard = 0;
    const done = new Array(tris.length).fill(false);
    while (left && guard++ < tris.length + 5) {
      for (let t = 0; t < tris.length; t++) {
        if (done[t]) continue; const T = tris[t], k = T.filter(v => c[v]).length;
        if (k === 3) { done[t] = true; left--; continue; }
        if (k < 2) continue;
        for (let i = 0; i < 3; i++) { const x = T[i], y = T[(i + 1) % 3], w = T[(i + 2) % 3]; if (c[x] && c[y] && !c[w]) { c[w] = third(c[x], c[y], r[x], r[y], r[w], -1); break; } }
        done[t] = true; left--;
      }
    }
    return c;
  }
  const area = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };

  function pack(G, ref) {
    if (CACHE && CACHE.has(G)) return CACHE.get(G);
    const n = G.n, hole = G.hole, rot = G.rot;
    const { N, tris, F, mids } = triangulate(n, rot);
    if (n - (G.edges ? G.edges.length : tris.length) + F.length !== 2 && G.edges) throw new Error('gearpack: rotation system is not planar');
    // outer triangle: the one farthest from the hole (graph distance), so the first drawing is already roughly centred
    const nb = Array.from({ length: N }, () => new Set());
    tris.forEach(([a, b, c]) => { nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); });
    const dist = new Array(N).fill(Infinity); dist[hole] = 0; let fr = [hole];
    while (fr.length) { const nx = []; for (const u of fr) for (const w of nb[u]) if (dist[w] === Infinity) { dist[w] = dist[u] + 1; nx.push(w); } fr = nx; }
    let outer = tris[0], best = -1;
    for (const T of tris) { const d = T.reduce((s, v) => s + dist[v], 0) + Math.min(...T.map(v => dist[v])) * 10; if (d > best) { best = d; outer = T; } }
    const { r, err } = solve(N, tris, outer);
    let c = place(N, tris, r, outer);
    // handedness: the rim runs the same way round as in the stored drawing
    if (ref && G.rot[hole]) { const R = G.rot[hole]; if (Math.sign(area(R.map(u => c[u]))) !== Math.sign(area(R.map(u => ref[u])))) c = c.map(p => [p[0], -p[1]]); }
    const out = { n, N, mids, tris, nb: nb.map(s => [...s]), real: u => u < n, outer, r, c, err, hole };
    if (CACHE) CACHE.set(G, out);
    return out;
  }

  // ---- the view: a Mobius map z -> 1/(z - p) (p in an interstice), then rotate, scale and translate into the box
  // circle (c, r) under z -> 1/(z - p): centre conj(c - p) / (|c - p|^2 - r^2), radius r / (|c - p|^2 - r^2). A negative
  // radius (p was inside the disc) is the outside of that circle: only a hidden filler may become one (the pond's frame)
  function invert(c, r, p) {
    const dx = c[0] - p[0], dy = c[1] - p[1], d2 = dx * dx + dy * dy - r * r;
    return d2 ? [dx / d2, -dy / d2, r / d2] : null;
  }
  const incentre = (P, T) => {   // the point of the interstice of triangle T equidistant from its three circles' tangency points
    const [A, B, C] = T.map(v => P[v]), a = Math.hypot(B[0] - C[0], B[1] - C[1]), b = Math.hypot(A[0] - C[0], A[1] - C[1]), cc = Math.hypot(A[0] - B[0], A[1] - B[1]), s = a + b + cc;
    return [(a * A[0] + b * B[0] + cc * C[0]) / s, (a * A[1] + b * B[1] + cc * C[1]) / s];
  };
  const TAP = 22;                // a frame gear must show a 2 x TAP disc inside the box
  function view(P, box, opt) {
    opt = opt || {};
    const { n, N, hole, tris } = P, hw = (box.x1 - box.x0) / 2, hh = (box.y1 - box.y0) / 2, X0 = (box.x0 + box.x1) / 2, Y0 = (box.y0 + box.y1) / 2;
    // two starting drawings: as packed (the outer triangle's interstice is the unbounded one) and inverted once, so that
    // every triangle's interstice is bounded in one of them
    const base1 = P.c.map((c, u) => [c[0], c[1], P.r[u]]);
    const f1 = tris.find(T => T !== P.outer && !T.includes(hole)) || tris[1], q1 = incentre(P.c, f1);
    const base2 = base1.map(([x, y, r]) => invert([x, y], r, q1));
    const cands = [];
    for (const T of tris) {
      if (T.includes(hole) || T.every(v => v >= n)) continue;   // (a gap between fillers only: never the frame)
      const B = T === P.outer ? base2 : base1;
      cands.push({ B, T, p: incentre(B.map(q => q), T) });
    }
    for (const u of P.mids) cands.push({ B: base1, T: [u], p: P.c[u].slice() });   // a face's middle filler turned inside out: the frame
    const evalAt = (B, T, p, th, keep) => {
      const C = new Array(N);
      for (let u = 0; u < N; u++) { const q = invert([B[u][0], B[u][1]], B[u][2], p); if (!q || (q[2] < 0 && (u < n || T.length > 1 || T[0] !== u))) return keep ? null : -1; C[u] = q; }
      const hx = C[hole][0], hy = C[hole][1], cs = Math.cos(th), sn = Math.sin(th), fr = new Set(T);
      for (let u = 0; u < N; u++) { const x = C[u][0] - hx, y = C[u][1] - hy; C[u] = [x * cs - y * sn, x * sn + y * cs, C[u][2]]; }
      let s = Infinity;
      for (let u = 0; u < n; u++) if (!fr.has(u)) s = Math.min(s, hw / (Math.abs(C[u][0]) + C[u][2]), hh / (Math.abs(C[u][1]) + C[u][2]));
      let mn = Infinity; for (let u = 0; u < n; u++) mn = Math.min(mn, C[u][2]);
      // the hub holds the die: it should not shrink below ~26 px whatever the smallest gear gains
      let score = s * Math.min(mn, C[hole][2] * 0.55) * Math.pow(Math.min(1, s * C[hole][2] / 26), 0.25), pen = 1;
      for (const u of T) {        // a frame gear must still show a tappable disc in the box
        if (u >= n) continue;
        const x = C[u][0] * s, y = C[u][1] * s, R = C[u][2] * s, qx = Math.max(-hw + TAP, Math.min(hw - TAP, x)), qy = Math.max(-hh + TAP, Math.min(hh - TAP, y));
        if (Math.hypot(qx - x, qy - y) > R - TAP) pen *= 0.2;
      }
      // and the frame gears should not cover much of the box (else the machine huddles in one corner)
      // nor leave much of it bare plate (a pond, with its hidden fillers, is mostly plate anyway); nor the hub swallow the middle
      let cov = 0, bare = 0;
      for (let i = 0; i < 16; i++) for (let j = 0; j < 10; j++) {
        const x = (-1 + (i + 0.5) / 8) * hw / s, y = (-1 + (j + 0.5) / 5) * hh / s; let hit = false;
        for (const u of T) { if (u >= n) continue; const q = C[u], d = Math.hypot(x - q[0], y - q[1]); if (d < q[2]) { cov++; hit = true; break; } }
        if (!hit && N === n) { hit = false; for (let u = 0; u < n && !hit; u++) { const q = C[u]; if (q[2] > 0 && Math.hypot(x - q[0], y - q[1]) < q[2] + 2 / s) hit = true; } if (!hit) bare++; }
      }
      cov /= 160; bare /= 160;
      const hp = s * C[hole][2];
      score *= pen * (1 - cov) * (1 - cov) * (1 - bare) * (hp > 64 ? Math.sqrt(64 / hp) : 1);
      if (!keep) return score;
      return { C, s, score, frame: T.slice() };
    };
    let best = null;
    const ths = []; for (let i = 0; i < 24; i++) ths.push(i * Math.PI / 24);
    const ranked = [];
    for (const k of cands) { let b = -Infinity, bt = 0; for (const th of ths) { const v = evalAt(k.B, k.T, k.p, th); if (v > b) { b = v; bt = th; } } ranked.push({ k, v: b, th: bt }); }
    ranked.sort((a, b) => b.v - a.v);
    // Nelder-Mead over (p, theta) from the best few
    const scaleOf = k => { const T = k.T.map(v => k.B[v]); return Math.min(...T.map(q => q[2])) * 0.3; };
    for (const R of ranked.slice(0, opt.tries || 6)) {
      const k = R.k, h = scaleOf(k), f = x => -evalAt(k.B, k.T, [x[0], x[1]], x[2]);
      let S = [[k.p[0], k.p[1], R.th], [k.p[0] + h, k.p[1], R.th], [k.p[0], k.p[1] + h, R.th], [k.p[0], k.p[1], R.th + 0.15]].map(x => ({ x, f: f(x) }));
      for (let it = 0; it < 160; it++) {
        S.sort((a, b) => a.f - b.f);
        const c = [0, 1, 2].map(i => (S[0].x[i] + S[1].x[i] + S[2].x[i]) / 3), w = S[3];
        const at = t => c.map((ci, i) => ci + t * (w.x[i] - ci));
        const xr = at(-1), fr = f(xr);
        if (fr < S[0].f) { const xe = at(-2), fe = f(xe); S[3] = fe < fr ? { x: xe, f: fe } : { x: xr, f: fr }; }
        else if (fr < S[2].f) S[3] = { x: xr, f: fr };
        else { const xc = at(0.5), fc = f(xc); if (fc < w.f) S[3] = { x: xc, f: fc }; else for (let i = 1; i < 4; i++) { S[i].x = S[i].x.map((v, j) => S[0].x[j] + (v - S[0].x[j]) / 2); S[i].f = f(S[i].x); } }
      }
      S.sort((a, b) => a.f - b.f);
      const v = -S[0].f;
      if (!best || v > best.v) best = { v, k, x: S[0].x };
    }
    const E = evalAt(best.k.B, best.k.T, [best.x[0], best.x[1]], best.x[2], true);
    const S = [], Rr = [];
    for (let u = 0; u < N; u++) { const q = E.C[u]; S.push([X0 + q[0] * E.s, Y0 + q[1] * E.s]); Rr.push(q[2] * E.s); }
    let minPx = Infinity; for (let u = 0; u < n; u++) minPx = Math.min(minPx, Rr[u]);
    return { S, R: Rr, frame: E.frame, minPx, score: best.v, p: [best.x[0], best.x[1]], th: best.x[2] };
  }

  // ---- teeth: one pitch for all gears (tooth count ~ radius), rest phases that mesh at the contacts
  // A gear u with N_u teeth at rest angle ph_u has teeth centred at ph_u + 2pi i / N_u. In tooth units x_u = ph_u N_u / 2pi,
  // the contact u-v (direction t_uv from u) meshes (a tooth of one in a gap of the other) iff
  //   x_u + x_v = t_uv N_u / 2pi + t_vu N_v / 2pi - 1/2   (mod 1).
  // A spanning tree from the hub satisfies its edges exactly; the other contacts (a triangulation has 3n - 6 of them, n - 1
  // in a tree) are relaxed to the least clash. The pitch itself is tried over a small range to find the least clash.
  function teeth(P, V, box, opt) {
    opt = opt || {};
    const { n, hole } = P, S = V.S, R = V.R, onScreen = (x, y) => x > box.x0 - 4 && x < box.x1 + 4 && y > box.y0 - 60 && y < box.y1 + 4;
    const E = [];
    for (let u = 0; u < n; u++) for (const v of P.nb[u]) if (v > u && v < n) {
      const t = Math.atan2(S[v][1] - S[u][1], S[v][0] - S[u][0]), px = S[u][0] + Math.cos(t) * R[u], py = S[u][1] + Math.sin(t) * R[u];
      E.push({ u, v, t, w: onScreen(px, py) ? 1 : 0.02 });
    }
    const vis = []; for (let u = 0; u < n; u++) if (onScreen(S[u][0], S[u][1]) || u === hole) vis.push(R[u]);
    vis.sort((a, b) => a - b);
    const rLow = vis[Math.floor(vis.length * 0.1)] || vis[0], p0 = TAU * rLow / (opt.minTeeth || 9);
    const nbE = Array.from({ length: n }, () => []); E.forEach((e, i) => { nbE[e.u].push(i); nbE[e.v].push(i); });
    const fr = x => x - Math.floor(x), wrap = x => { x = fr(x); return x > 0.5 ? x - 1 : x; };
    const cOf = (i, Nt) => { const e = E[i]; return fr(e.t * Nt[e.u] / TAU + (e.t + Math.PI) * Nt[e.v] / TAU - 0.5); };
    const other = (i, u) => E[i].u === u ? E[i].v : E[i].u;
    const best1 = (u, x, cst, W) => {          // gear u's best phase for its neighbours: the weighted circular mean
      let sx = 0, sy = 0;
      for (const i of nbE[u]) { const a = TAU * (cst[i] - x[other(i, u)]), w = W ? W[i] : E[i].w; sx += w * Math.cos(a); sy += w * Math.sin(a); }
      return sx || sy ? fr(Math.atan2(sy, sx) / TAU) : x[u];
    };
    const tryPitch = p => {
      const Nt = R.slice(0, n).map(r => Math.max(6, Math.round(TAU * r / p))), cst = E.map((_, i) => cOf(i, Nt));
      const x = new Array(n).fill(null); x[hole] = 0;
      // the tree: breadth-first from the hub over on-screen contacts first
      for (let pass = 0; pass < 2; pass++) {
        let q = [...x.keys()].filter(u => x[u] !== null);
        while (q.length) { const nx = []; for (const u of q) for (const i of nbE[u]) { const w = other(i, u); if (x[w] === null && (pass || E[i].w === 1)) { x[w] = fr(cst[i] - x[u]); nx.push(w); } } q = nx; }
      }
      for (let u = 0; u < n; u++) if (x[u] === null) x[u] = 0;
      for (let it = 0; it < 30; it++) for (let u = 0; u < n; u++) x[u] = best1(u, x, cst);
      // then a coordinate descent on a steep cost (sum of clash^4, so the worst contacts count most): each gear in turn
      // takes its best phase (a scan of 48 phases) and may take one tooth more or less (its pitch then differs by 1 / N)
      const G4 = d => { d = wrap(d); d *= d; return d * d; };
      const local = (u, xu) => { let c = 0; for (const i of nbE[u]) c += E[i].w * G4(xu + x[other(i, u)] - cst[i]); return c; };
      for (let sweep = 0; sweep < 6; sweep++) {
        for (let u = 0; u < n; u++) {
          const n0 = TAU * R[u] / p, opts = [Nt[u] - 2, Nt[u] - 1, Nt[u], Nt[u] + 1, Nt[u] + 2].filter(k => k >= 6 && Math.abs(k / n0 - 1) <= 0.1);
          let bk = Nt[u], bc = Infinity, bx = x[u];
          for (const k of opts) {
            Nt[u] = k; for (const i of nbE[u]) cst[i] = cOf(i, Nt);
            for (let j = 0; j < 48; j++) { const xu = fr(x[u] + j / 48), c = local(u, xu) + 1e-5 * (k - n0) * (k - n0); if (c < bc) { bc = c; bk = k; bx = xu; } }
          }
          Nt[u] = bk; for (const i of nbE[u]) cst[i] = cOf(i, Nt);
          // polish: a few golden-ish halvings round the best scan point
          let h = 1 / 96; x[u] = bx; for (let t = 0; t < 8; t++) { const a1 = local(u, fr(x[u] - h)), a0 = local(u, x[u]), a2 = local(u, fr(x[u] + h)); if (a1 < a0 && a1 <= a2) x[u] = fr(x[u] - h); else if (a2 < a0) x[u] = fr(x[u] + h); h /= 2; }
        }
      }
      let mx = 0, sm = 0, ws = 0;
      const err = E.map((e, i) => { const d = Math.abs(wrap(x[e.u] + x[e.v] - cst[i])); if (e.w === 1) { mx = Math.max(mx, d); sm += d; ws++; } return d; });
      return { p, Nt, x, err, max: mx, mean: ws ? sm / ws : 0 };
    };
    let best = null;
    for (let i = 0; i <= 12; i++) { const T = tryPitch(p0 * (0.9 + 0.2 * i / 12)); if (!best || T.max + T.mean < best.max + best.mean) best = T; }
    const ph = best.x.map((x, u) => TAU * x / best.Nt[u]);
    return { pitch: best.p, N: best.Nt, ph, clash: { max: best.max, mean: best.mean, edges: E.map((e, i) => ({ u: e.u, v: e.v, err: best.err[i], vis: e.w === 1 })) } };
  }

  W.GEARPACK = { faces, triangulate, solve, pack, view, teeth, invert };
})();
