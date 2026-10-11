// offline: optimise a 2D board layout per graph (simulated annealing on a soft-min of tile room, keeping every face oriented)
global.window = {};
const D0 = '/Users/kylemathewson/GraphColourDeductiveSolver/.claude/worktrees/sharp-driscoll-e811b7/docs/game/';
require(D0 + 'levels.js'); require(D0 + 'layout.js');
eval(require('fs').readFileSync(__dirname + '/layout2d.js', 'utf8'));
const which = (process.argv[2] || 'w9,w13,w18,ico,p22,r1,r178').split(','), IT = +(process.argv[3] || 60000);
const BOXES = { port: { cx: 0, cy: 0, a: 158, b: 212 }, land: { cx: 0, cy: 0, a: 285, b: 175 } };   // a phone (375x812) and a laptop island, wall band inset
const VARIANTS = ['{tutte:1,guard:1,kl:0,hc2:0,slide:0,aw:1,eps:4,rw:6,rwp:1}', '{tutte:1,guard:1,kl:0,hc2:0,slide:0,aw:.8,eps:4,rw:3}', '{tutte:1,guard:1,kl:0,hc2:0,slide:0}', '{}'];
function segD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]); }
function segX(a, b, c, d) { const r = [b[0] - a[0], b[1] - a[1]], q = [d[0] - c[0], d[1] - c[1]], den = r[0] * q[1] - r[1] * q[0]; if (Math.abs(den) < 1e-9) return false; const t = ((c[0] - a[0]) * q[1] - (c[1] - a[1]) * q[0]) / den, s = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den; return t > .01 && t < .99 && s > .01 && s < .99; }
const out = {};
for (const k of which) {
  const Gr = window.GAME.graphs[k], Lay = window.LAYOUT[k], border = new Set(Lay.border), rot = Gr.rot, hole = Gr.hole;
  out[k] = {};
  for (const [bn, box] of Object.entries(BOXES)) {
    let best = null;
    for (const v of VARIANTS) { const r = layout2d(Gr, Lay, box, eval('(' + v + ')')); if (!best || r.ap > best.ap) best = r; }
    const r = best, C = r.C, inner = r.inner, tiles = r.tiles, docks = r.docks, WB = r.WB, s = r.s, gap = 12;
    const beta = u => u === hole ? 1.3 * (1 + 1 / Math.cos(Math.PI / 5)) / 2 : (1 + 1 / Math.cos(Math.PI / rot[u].length)) / 2;
    const coast = []; for (let i = 0; i < 160; i++) coast.push(sqToIsland(sqPerim(4 * i / 160), box));
    let Lc = 0; for (let i = 0; i < 160; i++) Lc += Math.hypot(coast[(i + 1) % 160][0] - coast[i][0], coast[(i + 1) % 160][1] - coast[i][1]); const pxT = 4 / Lc;
    const coastD = p => { let m = Infinity; for (const q of coast) { const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2; if (d < m) m = d; } return Math.sqrt(m); };
    const bridges = []; tiles.forEach(u => rot[u].forEach(v => { if (border.has(v)) bridges.push([u, null, v]); else if (v > u || v === hole) bridges.push([u, v, null]); }));
    const segOf = B => [C[B[0]], B[1] !== null ? C[B[1]] : r.anchor[B[2]][B[0]]];
    const rim = Gr.link;
    function cands() {
      const c = [];
      for (let i = 0; i < inner.length; i++) for (let j = i + 1; j < inner.length; j++) { const u = inner[i], v = inner[j]; c.push((Math.hypot(C[u][0] - C[v][0], C[u][1] - C[v][1]) - gap) / (beta(u) + beta(v))); }
      bridges.forEach(B => { const [a, b] = segOf(B); inner.forEach(w => { if (w === B[0] || w === B[1]) return; c.push((segD(C[w], a, b) - 4) / beta(w)); }); if (B[1] === null) c.push(Math.hypot(b[0] - a[0], b[1] - a[1]) - WB / 2 - 8); });
      inner.forEach(u => c.push((coastD(C[u]) - WB / 2 - 6) / beta(u)));   // clear of the wall band's inner edge
      return c;
    }
    const TAU = 1.2;
    function score() {
      const c = cands(); let m = Infinity; c.forEach(x => { if (x < m) m = x; });
      let sum = 0; c.forEach(x => { sum += Math.exp(-(x - m) / TAU); }); const soft = m - TAU * Math.log(sum);
      let L = 0; bridges.forEach(B => { const [a, b] = segOf(B); L += Math.hypot(b[0] - a[0], b[1] - a[1]); }); L /= bridges.length * s;
      const rd = rim.map(x => Math.hypot(C[x][0] - C[hole][0], C[x][1] - C[hole][1])), mu = rd.reduce((t, x) => t + x, 0) / 5, sd = Math.sqrt(rd.reduce((t, x) => t + (x - mu) ** 2, 0) / 5);
      return { sc: soft - .15 * Math.hypot(C[hole][0] - box.cx, C[hole][1] - box.cy) - .6 * L - .05 * sd, min: m };
    }
    const okFaces = fl => { for (const f of fl) for (let j = 0; j < 3; j++) if (r.height(f, j) <= 1) return false; return true; };
    // make sure we start planar
    let bad = 0; r.faces.forEach(f => { for (let j = 0; j < 3; j++) if (r.height(f, j) <= 0) bad++; });
    let cur = score(), seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    const start = cur.min;
    const qual = c => c.min - .15 * Math.hypot(C[hole][0] - box.cx, C[hole][1] - box.cy);
    let bestQ = qual(cur), snap = { C: C.map(p => p && p.slice()), T: docks.map(d => d.T) };
    const keep = () => { const q = qual(cur); if (q > bestQ) { bestQ = q; snap = { C: C.map(p => p && p.slice()), T: docks.map(d => d.T) }; } };
    for (let it = 0; it < IT; it++) {
      const f = it / IT, T = 1.2 * Math.pow(.01, f), sig = 10 * Math.pow(.05, f);
      if (rnd() < .85 || !docks.length) {
        const u = inner[Math.floor(rnd() * inner.length)], old = C[u];
        C[u] = [old[0] + gauss() * sig, old[1] + gauss() * sig];
        if (!okFaces(r.facesOf.get(u))) { C[u] = old; continue; }
        const nw = score(); if (nw.sc >= cur.sc || rnd() < Math.exp((nw.sc - cur.sc) / T)) { cur = nw; keep(); } else C[u] = old;
      } else {
        const i = Math.floor(rnd() * docks.length), d = docks[i], T0 = d.T;
        d.T = T0 + gauss() * sig * pxT;
        const pr = docks[(i + docks.length - 1) % docks.length], nx = docks[(i + 1) % docks.length], gp = (a, b) => { let g = b.T - a.T; g -= 4 * Math.floor(g / 4); return g; };
        const sep = (a, b) => (a.w === b.w ? 30 : r.P.gapPx + 2 * r.P.stub) * pxT;
        const undo = () => { d.T = T0; r.anchor[d.w][d.u] = sqToIsland(sqPerim(d.T), box); r.buildWalls(); };
        if (gp(pr, d) < sep(pr, d) || gp(d, nx) < sep(d, nx) || gp(pr, d) > 2 || gp(d, nx) > 2) { d.T = T0; continue; }
        r.anchor[d.w][d.u] = sqToIsland(sqPerim(d.T), box); r.buildWalls();
        const fl = (r.facesOfDock.get(d.w + ':' + d.u) || []).concat(r.facesOf.get(d.u));
        if (!okFaces(fl)) { undo(); continue; }
        const nw = score(); if (nw.sc >= cur.sc || rnd() < Math.exp((nw.sc - cur.sc) / T)) { cur = nw; keep(); } else undo();
      }
    }
    snap.C.forEach((p, u) => { if (p) C[u] = p; }); docks.forEach((d, i) => { d.T = snap.T[i]; r.anchor[d.w][d.u] = sqToIsland(sqPerim(d.T), box); }); r.buildWalls(); cur = score();
    // checks
    const segs = []; bridges.forEach(B => { const [a, b] = segOf(B); segs.push([B[0], B[1] !== null ? B[1] : 'w' + B[2], a, b]); });
    r.W3.forEach((w, i) => { const x = r.W3[(i + 1) % 3]; segs.push(['w' + w, 'w' + x, r.endTo[w][x], r.endTo[x][w]]); });
    let X = 0; for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) { const A = segs[i], B = segs[j]; if (A[0] === B[0] || A[0] === B[1] || A[1] === B[0] || A[1] === B[1]) continue; if (segX(A[2], A[3], B[2], B[3])) X++; }
    console.log(k, bn, 'start ap', best.ap.toFixed(1), 'soft-start', start.toFixed(1), '-> min', cur.min.toFixed(1), 'hole off', Math.hypot(C[hole][0] - box.cx, C[hole][1] - box.cy).toFixed(1), 'X', X, 'bad', bad);
    const q3 = x => Math.round(x * 1000) / 1000;
    out[k][bn] = { p: inner.map(u => [u, q3((C[u][0] - box.cx) / box.a), q3((C[u][1] - box.cy) / box.b)]), d: docks.map(d => [d.w, d.u, q3(((d.T % 4) + 4) % 4)]), ap: q3(cur.min) };
  }
}
require('fs').writeFileSync(__dirname + '/opt-' + which.join('_') + '.json', JSON.stringify(out));
