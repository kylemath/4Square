  // ---------- the 2D board layout: a planar drawing that relaxes like the Kempe-class growth demo ----------
  // The island's coast is a superellipse |x/a|^p + |y/b|^p = 1 round (cx, cy). The three far-side vertices are walls along
  // the coast, each tile next to a wall docked at its own point of it, in rotation order. The drawing starts as a Tutte
  // (barycentric) embedding with the docks fixed, which is planar, and then relaxes under forces (springs on every bridge
  // towards one rest length, f = k/d^2 repulsion between all tiles, the five rim tiles pulled onto a ring round the goal,
  // the goal pulled to the centre, docked tiles pulled to their docks). A move is only taken if every face round the
  // tile keeps its corners on the right side of the opposite sides, so the drawing stays planar the whole way.
  const SEP = 3;                                    // superellipse exponent: a rounded rectangle of an island
  const seR = th => Math.pow(Math.pow(Math.abs(Math.cos(th)), SEP) + Math.pow(Math.abs(Math.sin(th)), SEP), -1 / SEP);
  function sqToIsland(q, box) {                      // unit square -> island, radially (the square's border lands on the coast)
    const th = Math.atan2(q[1], q[0]), rSq = 1 / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th)), 1e-9), k = seR(th) / rSq;
    return [box.cx + q[0] * k * box.a, box.cy + q[1] * k * box.b];
  }
  function sqPerim(t) { t = ((t % 4) + 4) % 4; const q = Math.floor(t), f = t - q; return [[-1 + 2 * f, -1], [1, -1 + 2 * f], [1 - 2 * f, 1], [-1, 1 - 2 * f]][q]; }
  function islandInside(p, box, m) {                 // pull a point back inside the coast, m pixels in from it
    const a = box.a - m, b = box.b - m, x = (p[0] - box.cx) / a, y = (p[1] - box.cy) / b;
    const f = Math.pow(Math.abs(x), SEP) + Math.pow(Math.abs(y), SEP); if (f <= 1) return p;
    const k = Math.pow(f, -1 / SEP); return [box.cx + x * k * a, box.cy + y * k * b];
  }
  function coastPath(box, k, grow) {
    const b2 = { cx: box.cx, cy: box.cy, a: box.a + (grow || 0), b: box.b + (grow || 0) };
    let d = ''; for (let i = 0; i < k; i++) { const q = sqToIsland(sqPerim(4 * i / k), b2); d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); } return d + 'Z';
  }
  function layout2d(Gr, Lay, box, opt) {
    const P = Object.assign({ IT2: 300, aw: .6, rw: 0, rwp: .5, hc: .05, hc2: .1, vg: .05, vs: .15, holeD: 1.3, segD: .5, dockL: 1.2, longL: 2.2, kl: .03, rimD: 1.35, coastD: .5, slide: 1, guard: 0, tutte: 0, eps: 1, dsep: .85, jsep: 1, passes: 2, fill: .8, ks: .08, kr: .05, kc: .3, core: .95, rim: 1.45, rimK: .2, wallRest: .62, kw: .1, hmin: .4, hk: .3, damp: .82, IT: 240, WB: 56, gapPx: 60, stub: 12, maxAp: 46, gap: 12 }, opt || {});
    const n = Gr.n, hole = Gr.hole, rot = Gr.rot, border = new Set(Lay.border), link = Gr.link, isRim = new Set(link);
    const inner = [...Array(n).keys()].filter(u => !border.has(u)), tiles = inner.filter(u => u !== hole);
    const WB = P.WB, CM = WB / 2 + 6, area = 4 * 0.8833 * (box.a - CM) * (box.b - CM);   // CM: tiles keep clear of the wall band's inner edge
    const s = Math.min(Math.sqrt(area * P.fill / (0.866 * (tiles.length + 3))), 140, Math.min(box.a, box.b) * .6);
    const rimR = s * P.rim, margin = CM + s * .4;
    // the walls: stretches of the coast, in the drawing's order. Each tile next to a wall is docked at its own point
    // of the coast; the docks keep their rotation order, slide to follow their tiles, and the walls end halfway between
    const W3 = Lay.border.slice().sort((x, y) => Lay.arcs[x][0] - Lay.arcs[y][0]);
    const runOf = w => {                             // w's tiles in rotation order, from the wall before them to the wall after
      const r = rot[w], k = r.length, i0 = r.findIndex((x, i) => border.has(x) && !border.has(r[(i + 1) % k]));
      const run = []; let i = (i0 + 1) % k; while (!border.has(r[i])) { run.push(r[i]); i = (i + 1) % k; }
      return { run, from: r[i0], to: r[i] };
    };
    const docks = [];                                // in coast order (perimeter parameter t increasing)
    W3.forEach((w, i) => { const { run, from } = runOf(w), seq = from === W3[(i + 2) % 3] ? run : run.slice().reverse(); seq.forEach(t => docks.push({ w, u: t, T: 0 })); });
    const len0 = w => { let [t1, t2] = Lay.arcs[w]; if (t2 < t1) t2 += 4; return t2 - t1; };
    {                                                // wall lengths: partly as in the drawing, partly by how many tiles dock on each
      const cnt = w => docks.filter(d => d.w === w).length + 1, tot = W3.reduce((t, w) => t + cnt(w), 0);
      const want = W3.map(w => (1 - P.aw) * len0(w) + P.aw * 4 * cnt(w) / tot), st = []; W3.reduce((t, w, i) => { st.push(t); return t + want[i]; }, 0);
      let cx = 0, cy = 0; W3.forEach((w, i) => { const d = (Lay.arcs[w][0] + len0(w) / 2 - st[i] - want[i] / 2) * Math.PI / 2; cx += Math.cos(d); cy += Math.sin(d); });
      const off = Math.atan2(cy, cx) * 2 / Math.PI;
      W3.forEach((w, i) => { const mine = docks.filter(d => d.w === w); mine.forEach((d, j) => { d.T = st[i] + off + want[i] * (j + 1) / (mine.length + 1); }); });
    }
    const perimT = p => {                            // a point -> the perimeter parameter of the coast point radially out from the centre
      const x = (p[0] - box.cx) / box.a, y = (p[1] - box.cy) / box.b, m = Math.max(Math.abs(x), Math.abs(y), 1e-9), qx = x / m, qy = y / m;
      if (qy <= -.999999) return (qx + 1) / 2; if (qx >= .999999) return 1 + (qy + 1) / 2; if (qy >= .999999) return 2 + (1 - qx) / 2; return 3 + (1 - qy) / 2;
    };
    let Lc = 0; { let pr = sqToIsland(sqPerim(0), box); for (let i = 1; i <= 200; i++) { const q = sqToIsland(sqPerim(4 * i / 200), box); Lc += Math.hypot(q[0] - pr[0], q[1] - pr[1]); pr = q; } }
    const pxT = 4 / Lc, GAP = P.gapPx * pxT, JS = P.gapPx + 2 * P.stub;   // gaps between walls; docks either side of a gap at least JS px apart
    const anchor = {}; W3.forEach(w => { anchor[w] = {}; });
    const endTo = {}; W3.forEach(w => { endTo[w] = {}; });
    const wallPts = {};
    const placeDocks = (pull) => {                   // follow the tiles, then restore order and spacing (unwrapped from dock 0)
      if (pull) docks.forEach(d => { let t = perimT(C[d.u]), dt = t - d.T; dt -= 4 * Math.round(dt / 4); d.T += dt * pull; });
      const base = docks[0].T; docks.forEach(d => { d.T = base + ((d.T - base) % 4 + 4) % 4; if (d.T - base > 3.9 && d !== docks[0]) d.T -= 4; });
      const minSep = (a, b) => (a.w === b.w ? s * P.dsep : Math.max(s * P.jsep, JS)) * pxT;
      for (let pass = 0; pass < 6; pass++) for (let i = 0; i < docks.length; i++) {
        const a = docks[i], b = docks[(i + 1) % docks.length], tb = b.T + (i + 1 === docks.length ? 4 : 0), m = minSep(a, b);
        if (tb - a.T < m) { const c = (a.T + tb) / 2; a.T = c - m / 2; b.T = c + m / 2 - (i + 1 === docks.length ? 4 : 0); }
      }
      docks.forEach(d => { anchor[d.w][d.u] = sqToIsland(sqPerim(d.T), box); });
    };
    const buildWalls = () => {                       // each wall from halfway after the previous wall's last dock to halfway before the next's first
      const U = [docks[0].T]; for (let i = 1; i < docks.length; i++) U.push(U[i - 1] + ((((docks[i].T - docks[i - 1].T) % 4) + 4) % 4));
      W3.forEach((w, i) => {
        const idx = docks.map((d, j) => d.w === w ? j : -1).filter(j => j >= 0), f = U[idx[0]], l = U[idx[idx.length - 1]];
        const p = idx[0] > 0 ? U[idx[0] - 1] : U[U.length - 1] - 4, q = idx[idx.length - 1] < U.length - 1 ? U[idx[idx.length - 1] + 1] : U[0] + 4;
        const t1 = (p + f) / 2 + GAP / 2, t2 = (l + q) / 2 - GAP / 2, pts = [];
        for (let j = 0; j <= 48; j++) pts.push(sqToIsland(sqPerim(t1 + (t2 - t1) * j / 48), box));
        wallPts[w] = pts; endTo[w][W3[(i + 2) % 3]] = pts[0]; endTo[w][W3[(i + 1) % 3]] = pts[48];
      });
    };
    const C = [];
    inner.forEach(u => { C[u] = sqToIsland(Lay.centre[u], box); }); C[hole] = [box.cx, box.cy];
    placeDocks(0); buildWalls();
    if (P.tutte) {                                   // start from a Tutte embedding: each tile at the weighted average of its neighbours,
      const NB = new Map(inner.map(u => [u, rot[u].map(w => border.has(w) ? () => anchor[w][u] : () => C[w])]));   // docks fixed;
      const Wt = new Map(inner.map(u => [u, rot[u].map(() => 1)]));                       // then reweighted by length, which spreads
      for (let round = 0; round <= P.rw; round++) {                                         // out the crowded middle (any positive
        for (let it = 0; it < 500; it++) inner.forEach(u => {                               // weights keep it planar)
          let x = 0, y = 0, t = 0; const L = NB.get(u), w = Wt.get(u); L.forEach((f, i) => { const p = f(); x += p[0] * w[i]; y += p[1] * w[i]; t += w[i]; }); C[u] = [x / t, y / t]; });
        inner.forEach(u => { const w = Wt.get(u); NB.get(u).forEach((f, i) => { const p = f(); w[i] = Math.pow(Math.hypot(p[0] - C[u][0], p[1] - C[u][1]) + 1e-3, P.rwp) * w[i]; }); });
        inner.forEach(u => { const w = Wt.get(u), m = Math.max(...w); w.forEach((x, i) => { w[i] = Math.max(x / m, 1e-3); }); });
      }
    }
    // faces, walls expanded into dock points: every corner must stay on the right side of its opposite side
    const at = x => typeof x === 'number' ? C[x] : border.has(x.b) ? endTo[x.a][x.b] : anchor[x.a][x.b];
    const faces = [], fseen = new Set(), facesOf = new Map(inner.map(u => [u, []])), facesOfDock = new Map();
    for (let u = 0; u < n; u++) rot[u].forEach((a, i) => {
      const b = rot[u][(i + 1) % rot[u].length], tri = [u, a, b];
      const key = tri.slice().sort((x, y) => x - y).join(','); if (fseen.has(key) || !rot[a].includes(b)) return; fseen.add(key);
      if (tri.every(x => border.has(x))) return;
      const poly = [];
      tri.forEach((x, j) => {
        if (!border.has(x)) { poly.push(x); return; }
        const pv = tri[(j + 2) % 3], nx = tri[(j + 1) % 3], pt = y => ({ a: x, b: y });
        poly.push(pt(pv)); poly.push(pt(nx));
      });
      for (let j = 0; j < poly.length; j++) {
        const c3 = [poly[j], poly[(j + 1) % poly.length], poly[(j + 2) % poly.length]];
        if (!c3.some(x => typeof x === 'number')) continue;
        faces.push(c3); c3.forEach(x => { if (typeof x === 'number') facesOf.get(x).push(c3); else if (!border.has(x.b)) { const k = x.a + ':' + x.b; if (!facesOfDock.has(k)) facesOfDock.set(k, []); facesOfDock.get(k).push(c3); } });
      }
    });
    const area2 = (a, b, c) => { const A = at(a), B = at(b), D = at(c); return (B[0] - A[0]) * (D[1] - A[1]) - (B[1] - A[1]) * (D[0] - A[0]); };
    const turn = Math.sign(faces.reduce((t, f) => t + Math.sign(area2(...f)), 0)) || 1;
    const height = (f, j) => { const A = at(f[j]), B = at(f[(j + 1) % 3]), D = at(f[(j + 2) % 3]), l = Math.hypot(D[0] - B[0], D[1] - B[1]) || 1e-9; return turn * ((B[0] - A[0]) * (D[1] - A[1]) - (B[1] - A[1]) * (D[0] - A[0])) / l; };
    const worst = u => { let m = Infinity; facesOf.get(u).forEach(f => { for (let j = 0; j < 3; j++) m = Math.min(m, height(f, j)); }); return m; };
    const E = []; tiles.forEach(u => rot[u].forEach(v => { if (v > u && !border.has(v) && v !== hole) E.push([u, v]); }));
    const wallAdj = []; tiles.forEach(u => { wallAdj[u] = rot[u].filter(w => border.has(w)); });
    const vel = new Map(inner.map(u => [u, [0, 0]])), frames = [C.map(p => p && p.slice())], hmin = P.hmin * s, centre = [box.cx, box.cy];
    for (let it = 0; it < P.IT; it++) {
      const cool = 1 - it / P.IT, F = new Map(inner.map(u => [u, [0, 0]]));
      const add = (u, fx, fy) => { const f = F.get(u); f[0] += fx; f[1] += fy; };
      E.forEach(([u, v]) => {                       // bridges: springs to one rest length, so long bridges pull hardest
        const dx = C[v][0] - C[u][0], dy = C[v][1] - C[u][1], d = Math.hypot(dx, dy) || 1e-6, k = P.ks * (d - s) / d;
        add(u, dx * k, dy * k); add(v, -dx * k, -dy * k);
      });
      for (let i = 0; i < inner.length; i++) for (let j = i + 1; j < inner.length; j++) {   // repulsion f = k/d^2, and a hard core
        const u = inner[i], v = inner[j], dx = C[v][0] - C[u][0], dy = C[v][1] - C[u][1], d = Math.max(Math.hypot(dx, dy), 1e-3);
        const hp = u === hole || v === hole, core = hp ? rimR * .9 : s * P.core;
        let f = P.kr * s * (s / Math.max(d, .3 * s)) ** 2 * (hp ? 2 : 1); if (d < core) f += P.kc * (core - d);
        add(u, -dx / d * f, -dy / d * f); add(v, dx / d * f, dy / d * f);
      }
      tiles.forEach(u => {
        const c = C[u];
        if (isRim.has(u)) { const dx = c[0] - C[hole][0], dy = c[1] - C[hole][1], d = Math.hypot(dx, dy) || 1e-6, k = P.rimK * (rimR - d) / d; add(u, dx * k, dy * k); }
        wallAdj[u].forEach(w => { const t = anchor[w][u], dx = t[0] - c[0], dy = t[1] - c[1], d = Math.hypot(dx, dy) || 1e-6, rest = s * P.wallRest, k = P.kw * (d - rest) / d; add(u, dx * k, dy * k); });
      });
      add(hole, (centre[0] - C[hole][0]) * P.hc, (centre[1] - C[hole][1]) * P.hc);
      faces.forEach(f => {                          // planarity, softly: push each corner away from the opposite side when it gets close
        for (let j = 0; j < 3; j++) {
          const p = f[j]; if (typeof p !== 'number' || p === hole) continue;
          const h = height(f, j); if (h >= hmin) continue;
          const B = at(f[(j + 1) % 3]), D = at(f[(j + 2) % 3]), gx = turn * (B[1] - D[1]), gy = turn * (D[0] - B[0]), gl = Math.hypot(gx, gy) || 1e-6;
          const m = P.hk * (hmin - Math.max(h, 0)); add(p, gx / gl * m, gy / gl * m);
        }
      });
      inner.forEach(u => {                          // and strictly: a move is only taken if no face round the tile turns over
        const v = vel.get(u), f = F.get(u); v[0] = (v[0] + f[0]) * P.damp; v[1] = (v[1] + f[1]) * P.damp;
        const sp = Math.hypot(v[0], v[1]), cap = s * (.03 + .12 * cool); if (sp > cap) { v[0] *= cap / sp; v[1] *= cap / sp; }
        const old = C[u]; let k = 1;
        if (P.guard) { const lim0 = Math.min(P.eps, worst(u) * .999);
          for (; k >= 1 / 32; k /= 2) { C[u] = islandInside([old[0] + v[0] * k, old[1] + v[1] * k], box, margin); if (worst(u) > lim0) break; }
          if (k < 1 / 32) { C[u] = old; v[0] *= .5; v[1] *= .5; }
        } else C[u] = islandInside([old[0] + v[0], old[1] + v[1]], box, margin);
      });
      if (!P.guard) for (let pass = 0; pass < P.passes; pass++) faces.forEach(f => {
        for (let j = 0; j < 3; j++) {
          const p = f[j]; if (typeof p !== 'number' || p === hole) continue;
          const h = height(f, j); if (h >= hmin) continue;
          const B = at(f[(j + 1) % 3]), D = at(f[(j + 2) % 3]), gx = turn * (B[1] - D[1]), gy = turn * (D[0] - B[0]), gl = Math.hypot(gx, gy) || 1e-6;
          const m = Math.min(P.hk * (hmin - h), s * .2);
          C[p] = islandInside([C[p][0] + gx / gl * m, C[p][1] + gy / gl * m], box, margin);
        }
      });
      if (!P.guard) placeDocks(.15), buildWalls();
      frames.push(C.map(p => p && p.slice()));
    }
    // inflate: grow a target spacing D while every pair of tiles, every tile and every bridge it is not on, and every tile and
    // the coast keep D apart (short-range pushes only, long bridges gently pulled in), never turning a face over
    const segDist2 = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; t = Math.max(0, Math.min(1, t)); const qx = a[0] + dx * t, qy = a[1] + dy * t; return [Math.hypot(qx - p[0], qy - p[1]), t, qx, qy]; };
    const wFaces = f => { let m = Infinity; f.forEach(F => { for (let j = 0; j < 3; j++) m = Math.min(m, height(F, j)); }); return m; };
    const bridgeList = () => { const L = []; tiles.forEach(u => rot[u].forEach(v => { if (border.has(v)) L.push([u, null, anchor[v][u]]); else if (v > u) L.push([u, v === hole ? hole : v, null]); })); return L; };
    let D = Infinity; for (let i = 0; i < inner.length; i++) for (let j = i + 1; j < inner.length; j++) { const u = inner[i], v = inner[j]; if (u !== hole && v !== hole) D = Math.min(D, Math.hypot(C[u][0] - C[v][0], C[u][1] - C[v][1])); }
    D = Math.max(D, s * .3);
    const BL = bridgeList();
    for (let it = 0; it < P.IT2; it++) {
      const F = new Map(inner.map(u => [u, [0, 0]])), add = (u, x, y) => { const f = F.get(u); if (f) { f[0] += x; f[1] += y; } };
      let viol = 0;
      for (let i = 0; i < inner.length; i++) for (let j = i + 1; j < inner.length; j++) {
        const u = inner[i], v = inner[j], dx = C[v][0] - C[u][0], dy = C[v][1] - C[u][1], d = Math.hypot(dx, dy) || 1e-6;
        const want = (u === hole || v === hole) ? D * P.holeD : D; if (d >= want) continue;
        viol = Math.max(viol, 1 - d / want); if (P.dbg && (it === P.IT2 - 1 || it === 0) && 1 - d / want > .5) console.log('pair', u, v, (1 - d / want).toFixed(2)); const m = .25 * (want - d) / d; add(u, -dx * m, -dy * m); add(v, dx * m, dy * m);
      }
      BL.forEach(([u, v, A]) => {
        const a = C[u], b = A || C[v];
        inner.forEach(w => {
          if (w === u || w === v) return; const [d, t, qx, qy] = segDist2(C[w], a, b), want = D * P.segD; if (d >= want) return;
          viol = Math.max(viol, 1 - d / want); if (P.dbg && (it === P.IT2 - 1 || it === 0) && 1 - d / want > .5) console.log('seg', u, v, w, (1 - d / want).toFixed(2)); const nx = (C[w][0] - qx) / (d || 1e-6), ny = (C[w][1] - qy) / (d || 1e-6), m = .25 * (want - d);
          add(w, nx * m, ny * m); add(u, -nx * m * (1 - t) * .5, -ny * m * (1 - t) * .5); if (!A) add(v, -nx * m * t * .5, -ny * m * t * .5);
        });
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), Lmax = (A ? P.dockL : P.longL) * D;
        if (L > Lmax) { const m = P.kl * (L - Lmax) / L; add(u, (b[0] - a[0]) * m, (b[1] - a[1]) * m); if (!A) add(v, -(b[0] - a[0]) * m, -(b[1] - a[1]) * m); }
      });
      link.forEach(x => { const dx = C[x][0] - C[hole][0], dy = C[x][1] - C[hole][1], d = Math.hypot(dx, dy) || 1e-6, m = .05 * (D * P.rimD - d) / d; add(x, dx * m, dy * m); });
      add(hole, (centre[0] - C[hole][0]) * P.hc2, (centre[1] - C[hole][1]) * P.hc2);
      inner.forEach(u => {
        const f = F.get(u), old = C[u], mg = u === hole ? 0 : CM + D * P.coastD, lim0 = Math.min(P.eps, worst(u) * .999);
        for (let k = 1; k >= 1 / 16; k /= 2) {
          const nw = u === hole ? [old[0] + f[0] * k, old[1] + f[1] * k] : islandInside([old[0] + f[0] * k, old[1] + f[1] * k], box, mg);
          C[u] = nw; if (worst(u) > lim0) return;
        }
        C[u] = old;
      });
      if (P.slide) docks.forEach(d => {          // docks slide along the coast towards their tiles, keeping their order and faces
        let t = perimT(C[d.u]), dt = t - d.T; dt -= 4 * Math.round(dt / 4);
        const i = docks.indexOf(d), pr = docks[(i + docks.length - 1) % docks.length], nx = docks[(i + 1) % docks.length];
        const gap = (a, b) => { let g = b.T - a.T; g -= 4 * Math.floor(g / 4); return g; }, sep = (a, b) => (a.w === b.w ? P.dsep * D : Math.max(P.jsep * D, JS)) * pxT;
        const T0 = d.T, key = d.w + ':' + d.u, fl = facesOfDock.get(key) || [], lim0 = Math.min(P.eps, wFaces(fl) * .999);
        for (let k = .2; k >= .2 / 16; k /= 2) {
          d.T = T0 + dt * k; anchor[d.w][d.u] = sqToIsland(sqPerim(d.T), box);
          if (gap(pr, d) >= sep(pr, d) && gap(d, nx) >= sep(d, nx) && wFaces(fl) > lim0) return;
        }
        d.T = T0; anchor[d.w][d.u] = sqToIsland(sqPerim(d.T), box);
      });
      if (viol < P.vg) D *= 1.012; else if (viol > P.vs) D *= .995; if (P.dbg && it % 30 === 0) console.log(it, D.toFixed(1), viol.toFixed(3));
      if (it % 2) frames.push(C.map(p => p && p.slice()));
    }
    buildWalls();
    // tile sizes: as big as the room allows (a ladder's gap between any two tiles, clear of every bridge and the coast)
    const beta = u => (1 + 1 / Math.cos(Math.PI / rot[u].length)) / 2;
    const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]); };
    const segs = []; tiles.forEach(u => rot[u].forEach(v => { if (border.has(v)) segs.push([u, v, C[u], anchor[v][u]]); else if (v > u && v !== hole) segs.push([u, v, C[u], C[v]]); }));
    link.forEach(x => segs.push([hole, x, C[hole], C[x]]));
    let ap = P.maxAp; const why = [];
    const lim = (q, w) => { if (q < ap) { ap = q; why.push(w.concat([q])); } };
    for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) { const u = tiles[i], v = tiles[j]; lim((Math.hypot(C[u][0] - C[v][0], C[u][1] - C[v][1]) - P.gap) / (beta(u) + beta(v)), ['pair', u, v]); }
    segs.forEach(([u, v, a, b]) => tiles.forEach(w => { if (w !== u && w !== v) lim((segDist(C[w], a, b) - 4) / beta(w), ['seg', u, v, w]); }));
    tiles.forEach(u => wallAdj[u].forEach(w => { const t = anchor[w][u]; lim(Math.hypot(t[0] - C[u][0], t[1] - C[u][1]) - WB / 2 - 8, ['wall', u, w]); }));
    const R = []; tiles.forEach(u => { R[u] = ap / Math.cos(Math.PI / rot[u].length); });
    let hap = ap * 1.3; link.forEach(x => { hap = Math.min(hap, Math.hypot(C[x][0] - C[hole][0], C[x][1] - C[hole][1]) - ap * beta(x) - 16); });
    R[hole] = Math.max(ap * .7, hap) / Math.cos(Math.PI / 5);
    // each tile turned so its sides face its neighbours (walls: its dock; the goal: its five rim tiles)
    const phi = [];
    inner.forEach(u => {
      const nb = u === hole ? link : rot[u], v = nb.length;
      const th = nb.map(w => { const t = border.has(w) ? anchor[w][u] : C[w]; return Math.atan2(t[1] - C[u][1], t[0] - C[u][0]); }).sort((x, y) => x - y);
      let cx = 0, cy = 0; th.forEach((a, i) => { const d = (a - 2 * Math.PI * i / v) * v; cx += Math.cos(d); cy += Math.sin(d); });
      phi[u] = Math.atan2(cy, cx) / v - Math.PI / v;
    });
    return { P, perimT, buildWalls, height, facesOfDock, facesOf, D, docks, C, frames, s, ap, R, phi, wallPts, anchor, endTo, W3, faces, turn, area2, segs, why, inner, tiles, E, WB };
  }
