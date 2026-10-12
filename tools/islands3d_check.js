#!/usr/bin/env node
// Islands 3D (lab/islands3d.html): checks and stores the island plan of every map.
//   node tools/islands3d_check.js            check every map in both arenas (tall phone, wide); fail if a plan is stale
//   node tools/islands3d_check.js --write    solve them all again and write lab/islands3d-plans.js
// The plan (tile positions on a hexagonal lattice, the float level of each tile) comes from the page's own pure
// layout code (the block between <layout> markers in the page), so this runs exactly what the page runs. A stored plan
// only saves the page the slow search (about a second on a phone); a map with no stored plan is laid out live.
// Checks per map and arena: no bridge left running through a tile or crossing another at the same height, every tile
// inside the arena, no two tiles overlapping, every bridge long enough to see, the rim on top, and a stored plan
// replays to the same plan.
'use strict';
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '..') + '/', OUT = D + 'lab/islands3d-plans.js';
global.window = global;
const load = f => (0, eval)(fs.readFileSync(D + f, 'utf8').replace(/^const /m, 'var '));
load('levels.js'); load('layout.js');
const html = fs.readFileSync(D + 'lab/islands3d.html', 'utf8'), a = html.indexOf('  // <layout>'), b = html.indexOf('  // </layout>');
if (a < 0 || b < 0) { console.log('FAIL: no <layout> block in lab/islands3d.html'); process.exit(1); }
const src = html.slice(a, b) + ';global.__L3 = { plan3d, hexInside, SC, RIM_LEVEL, getS: () => [SX, SZ] };';
(0, eval)(src);
const { plan3d, hexInside, RIM_LEVEL } = global.__L3, G = window.GAME, WRITE = process.argv.includes('--write');
const maps = [...new Set(G.levels.map(l => l.g))], ARENAS = { w: 1, t: 1.55 }, plans = {}; let bad = 0;
const fail = (m, msg) => { bad++; console.log('  FAIL ' + m + ': ' + msg); };
for (const m of maps) {
  const Gr = G.graphs[m], Lay = window.LAYOUT[m], g = { n: Gr.n, hole: Gr.hole, rim: Gr.link, rot: Gr.rot, centre: Lay.centre, pos: Gr.pos }, onb = !!Gr.onboard;
  plans[m] = { sig: Lay.sig };
  for (const k of Object.keys(ARENAS)) {
    const t0 = Date.now(), P = plan3d(g, onb, null, ARENAS[k]), ms = Date.now() - t0, id = m + '/' + k;
    plans[m][k] = P.sol;
    if (P.violations) fail(id, P.violations + ' bridge clearance conflicts');
    let minGap = Infinity, minLen = Infinity;
    for (let u = 0; u < g.n; u++) {
      const q = hexInside(P.C[u], 0); if (Math.hypot(q[0] - P.C[u][0], q[1] - P.C[u][1]) > 1e-6) fail(id, 'tile ' + u + ' outside the arena');
      for (let v = u + 1; v < g.n; v++) minGap = Math.min(minGap, Math.hypot(P.C[u][0] - P.C[v][0], P.C[u][1] - P.C[v][1]) - (P.R[u] + P.R[v]) * .8);
      if (u !== g.hole && P.ring[u] === 1 && P.lvl.get(u) !== RIM_LEVEL) fail(id, 'rim tile ' + u + ' not on top');
    }
    P.plan.forEach(B => { minLen = Math.min(minLen, B.len); });
    if (minGap < 0) fail(id, 'tiles overlap (' + minGap.toFixed(2) + ')');
    if (minLen < .12) fail(id, 'a bridge is only ' + minLen.toFixed(2) + ' long');
    const P2 = plan3d(g, onb, P.sol, ARENAS[k]);                                  // replaying the stored plan gives the same island
    if (JSON.stringify(P2.plan) !== JSON.stringify(P.plan) || JSON.stringify([...P2.lvl]) !== JSON.stringify([...P.lvl])) fail(id, 'the stored plan does not replay to the same island');
    console.log(id.padEnd(14) + ('n' + g.n).padEnd(5) + (ms + ' ms').padStart(8) + '  min tile gap ' + minGap.toFixed(2) + '  shortest bridge ' + minLen.toFixed(2));
  }
}
const text = '// Islands 3D: the stored island plan of every map (tall = "t", wide = "w"). Written by tools/islands3d_check.js --write; do not edit.\n' +
  'window.ISLANDS3D_PLANS = ' + JSON.stringify(plans) + ';\n';
if (WRITE) { fs.writeFileSync(OUT, text); console.log('wrote ' + path.relative(process.cwd(), OUT) + ' (' + (text.length / 1024).toFixed(1) + ' KB, ' + maps.length + ' maps)'); }
else if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== text) fail('lab/islands3d-plans.js', 'missing or stale: run node tools/islands3d_check.js --write');
console.log(bad ? bad + ' problem(s)' : 'all islands3d plans OK');
process.exit(bad ? 1 : 0);
