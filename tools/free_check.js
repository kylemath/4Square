#!/usr/bin/env node
// Headless check of the free island layout (Islands Free): builds every level's layout with board/island.js (the real
// renderer's geometry and physics, no DOM), lets it settle, and reports per level and screen size:
//   settle   time after the first frame until no tile moves more than .25 px a frame for 15 frames (60 fps; the layout is already
//            settled offline when the island opens, so this is the leftover drift)
//   ovl      deepest overlap of two tiles' inscribed circles, % of a tile's size (0 = none)
//   sep      closest pair of tile centres, in tile radii (>= 2: tiles clear of each other)
//   off      tiles whose outline leaves the play area (screen width, top, and above the chain tray)
//   tile     smallest tile width in px (tap target)
//   link     shortest visible ladder in px, and the share of ladders under 10 px (hidden links)
//   hole     the goal's distance from the play area's centre (% of the half-height)
// Usage: node tools/free_check.js [-v] [--live fk=.065,fr=1.5] [--sizes 390x661,360x457] [--level id,id] [--steps 900]
// Defaults come from skins/islands-free.js, so it checks what ships. Exit code 1 if a layout fails a limit.
'use strict';
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '..') + '/';
global.window = global;
const load = f => (0, eval)(fs.readFileSync(D + f, 'utf8').replace(/^const /m, 'var '));
load('levels.js'); load('layout.js'); load('skins/registry.js'); load('skins/islands.js'); load('skins/islands-free.js'); load('board/island.js');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SPEC = FTH_SKINS.get('islands-free').board, LIVE = Object.assign({}, SPEC.live);
(arg('--live', '') || '').split(',').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); LIVE[k] = +v; });
const SIZES = arg('--sizes', '390x661,360x457,430x749,768x841,1024x560').split(',').map(s => s.split('x').map(Number));   // the #board of a 390x844, 360x640, 430x932, 768x1024 and a 1024x660 window
const ONLY = arg('--level', '') ? arg('--level').split(',') : null, STEPS = +arg('--steps', 900), VERBOSE = process.argv.includes('-v');
const LIM = { ovl: 8, sep: 2.0, off: 0, tile: 22, hidden: .02, settle: 2500, holeOff: 28 };   // %, tile radii, count, px, share of links, ms, % of half-height
const G = window.GAME;
function evaluate(LIVE, sizes, only, steps) {
  const rows = [];
  for (const L of G.levels) {
    if (only && !only.includes(L.id)) continue;
    for (const [W, H] of sizes) {
      const Gr = G.graphs[L.g], n = Gr.n, adj = Array.from({ length: n }, () => []);
      Gr.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
      const col = L.start.slice(), noop = () => {};
      const S = { headless: true, HEX: [], DARK: [], NEONH: [], NAMES: [], IPATH: [], reduced: false, blip: noop, note: noop, msg: noop, uiSetE: noop, uiBurst: noop, uiPop: noop,
        compassTile: noop, compassActive: noop, partialChain: () => null, rimCols: c => Gr.link.map(x => c[x]), clearActive: noop, lootGen: () => 0, refresh: noop,
        view: () => ({ L, Gr, n, hole: Gr.hole, link: Gr.link, adj, col, chains: [], chainAt: null, found: new Set(), traced: new Map(), active: null, trace: null, lastPartial: null }) };
      const B = FTH_ISLAND.create(S); B.configure({ free: true, guard: false, live: LIVE }, 'check'); B.layout(false, [W, H]);
      const d = B.debug(), LAY = d.LAYO, BOX = d.BOX, P = d.SIM.P;
      let calm = 0, settle = steps; for (let i = 0; i < steps; i++) { const mv = B.step(i * 16.7); calm = mv < .25 ? calm + 1 : 0; if (settle === steps && calm >= 15) settle = i - 14; }   // settled: no tile moves .25 px a frame for 15 frames
      const tiles = LAY.inner, R = LAY.R, sides = u => u === Gr.hole ? 5 : Gr.rot[u].length < (Gr.onboard ? 4 : 3) ? 4 : Gr.rot[u].length, apo = u => R[u] * Math.cos(Math.PI / sides(u));
      const trayRoom = H > 480 ? 150 : H * .33 - 10;
      let ovl = 0, sep = Infinity, off = 0, tmin = Infinity;
      for (let i = 0; i < tiles.length; i++) {
        const u = tiles[i], p = P[u]; tmin = 2 * LAY.ap;   // a tile is hit within its circumcircle, so the design size is the tap target (triangles are drawn smaller)
        if (p[0] - R[u] < 0 || p[0] + R[u] > W || p[1] - R[u] < 0 || p[1] + R[u] > H - trayRoom) off++;
        for (let j = i + 1; j < tiles.length; j++) { const w = tiles[j], dd = Math.hypot(p[0] - P[w][0], p[1] - P[w][1]), m = (apo(u) + apo(w)) / 2; ovl = Math.max(ovl, (2 * m - dd) / m * 100); sep = Math.min(sep, dd / m); }
      }
      const vis = u => (R[u] + apo(u)) / 2, gaps = Gr.edges.map(([a, b]) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]) - vis(a) - vis(b)).sort((x, y) => x - y);   // a ladder's visible length
      const hb = P[Gr.hole], holeOff = Math.hypot(hb[0] - BOX.cx, hb[1] - BOX.cy) / BOX.b * 100, hidden = gaps.filter(g => g < 10).length / gaps.length;
      const r = { id: L.id, map: L.g, n, size: W + 'x' + H, settle: Math.round(settle * 16.7), ovl: Math.max(0, ovl), sep, off, tile: tmin, link: gaps[0], hidden, holeOff, pre: LAY.pre };
      r.bad = [ovl > LIM.ovl && 'ovl', sep < LIM.sep && 'sep', off > LIM.off && 'off', tmin < LIM.tile && 'tile', hidden > LIM.hidden && 'link', r.settle > LIM.settle && 'settle', holeOff > LIM.holeOff && 'hole'].filter(Boolean);
          rows.push(r);
    }
  }

  return rows;
}
module.exports = { evaluate, LIM };
if (require.main !== module) return;
let fails = 0;
const rows = evaluate(LIVE, SIZES, ONLY, STEPS); rows.forEach(r => { if (r.bad.length) fails++; });
const f = (v, k) => v === Infinity ? '-' : (+v).toFixed(k);
console.log('live ' + JSON.stringify(LIVE));
console.log('level'.padEnd(16) + 'map'.padEnd(9) + 'n'.padStart(3) + ' size'.padEnd(10) + 'settle ms'.padStart(10) + 'ovl%'.padStart(7) + 'sep'.padStart(6) + 'off'.padStart(4) + 'tile px'.padStart(8) + 'link px'.padStart(8) + 'hid%'.padStart(6) + 'hole%'.padStart(7) + '  fail');
rows.forEach(r => { if (!VERBOSE && !r.bad.length) return; console.log(r.id.padEnd(16) + r.map.padEnd(9) + String(r.n).padStart(3) + ' ' + r.size.padEnd(9) + String(r.settle).padStart(10) + f(r.ovl, 1).padStart(7) + f(r.sep, 2).padStart(6) + String(r.off).padStart(4) + f(r.tile, 0).padStart(8) + f(r.link, 1).padStart(8) + f(r.hidden * 100, 0).padStart(6) + f(r.holeOff, 0).padStart(7) + '  ' + r.bad.join(',')); });
const cls = r => r.n <= 16 ? 'small (n<=16)' : r.n <= 24 ? 'medium (17-24)' : 'big (25+)';
const agg = {}; rows.forEach(r => { const k = cls(r) + ' @ ' + r.size, a = agg[k] = agg[k] || { c: 0, set: [], ovl: 0, sep: 1e9, off: 0, tile: 1e9, link: 1e9, hole: 0, bad: 0 }; a.c++; a.set.push(r.settle); a.ovl = Math.max(a.ovl, r.ovl); a.sep = Math.min(a.sep, r.sep); a.off += r.off; a.tile = Math.min(a.tile, r.tile); a.link = Math.min(a.link, r.link); a.hole = Math.max(a.hole, r.holeOff); a.bad += r.bad.length ? 1 : 0; });
console.log('\n' + 'class @ size'.padEnd(34) + 'levels'.padStart(7) + 'settle med/max ms'.padStart(19) + 'ovl% max'.padStart(10) + 'sep min'.padStart(9) + 'off'.padStart(5) + 'tile min'.padStart(9) + 'link min'.padStart(9) + 'hole% max'.padStart(10) + 'failing'.padStart(8));
Object.keys(agg).sort().forEach(k => { const a = agg[k]; a.set.sort((x, y) => x - y); console.log(k.padEnd(34) + String(a.c).padStart(7) + (a.set[a.set.length >> 1] + '/' + a.set[a.set.length - 1]).padStart(19) + f(a.ovl, 1).padStart(10) + f(a.sep, 2).padStart(9) + String(a.off).padStart(5) + f(a.tile, 0).padStart(9) + f(a.link, 1).padStart(9) + f(a.hole, 0).padStart(10) + String(a.bad).padStart(8)); });
console.log('\n' + rows.length + ' layouts, ' + fails + ' failing');
process.exit(fails ? 1 : 0);
