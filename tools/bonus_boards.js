#!/usr/bin/env node
// Bonus-round boards: generate the regular (designed) boards offline and validate every board in index.html.
//
//   node docs/game/tools/bonus_boards.js           check: parse BPAT4 / BREG4 / BREG3 from index.html, assert the criteria, print the table
//   node docs/game/tools/bonus_boards.js --gen     rebuild the regular boards from SPECS below (deterministic) and print the JS to paste
//   node docs/game/tools/bonus_boards.js --explore 4|3 [n]   random search over the designs, best first (to pick new SPECS)
//
// The board is the game's 9 x 7 hex grid (odd rows shifted right, 63 tiles, 6 neighbours inside): tile i = row * 9 + col, a digit per tile.
// A CHAIN is a path of tiles that alternates two elements (a,b,a,b...). Stats per element pair: longest chain (exact, by DFS) and
// the number of two-element islands of >= 6 tiles (chains you can start on).
//
// Old boards: BPAT4 (4 elements, annealed: proper colourings, every inner tile touches all 3 other elements, every pair has a chain of 12-21)
//             and the 3-element honeycomb (q - r) mod 3 (the only proper 3-colouring of the grid; every pair is a honeycomb, chains of 36-42).
// Regular boards ("honeycomb territories"): start from that honeycomb (three tile classes h = (q - r + off) mod 3), cut the board into
//   TERRITORIES with a regular shape (concentric rings, chevrons, a spiral with interlocked arms, a pinwheel, ribbons) and in every
//   territory treat one class differently:
//   4 elements: in territory t the class omit[t] is shown as the 4th element (3) instead of its own colour, so every territory is a
//               3-colour honeycomb that misses a different element; the odd colour only touches the other two there. Boundary clashes
//               (two touching 4th-element tiles) are repaired by recolouring single tiles. Criteria (asserted): PROPER (no two touching
//               tiles equal), every one of the 6 pairs has a longest chain >= 12, >= 8 islands of >= 6 tiles in all.
//   3 elements: the proper 3-colouring is forced (it is the honeycomb), so a regular 3-element board is the honeycomb with a different
//               colour permutation per territory: touching equal tiles only along the territory borders (a wall, not a step). Criteria
//               (asserted): <= 20 touching-equal edges, every pair has a longest chain >= 30, >= 3 islands of >= 6 tiles.
const fs = require('fs'), path = require('path');
const COLS = 9, ROWS = 7, N = COLS * ROWS;
const ax = i => { const c = i % COLS, r = (i / COLS) | 0; return [c - (r >> 1), r]; };
const at = new Map(); for (let i = 0; i < N; i++) at.set(ax(i).join(), i);
const NB = []; for (let i = 0; i < N; i++) { const [q, r] = ax(i); NB.push([[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => at.get((q + a) + ',' + (r + b))).filter(j => j !== undefined)); }
const qa = (c, r) => [c - (r >> 1), r];                                    // (col, row) -> axial
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function stats(E, ncol, budget = 4e6) {
  let eq = 0; for (let i = 0; i < N; i++) for (const j of NB[i]) if (j > i && E[i] === E[j]) eq++;
  let inner = 0, innerAll = 0;
  for (let i = 0; i < N; i++) if (NB[i].length === 6) { inner++; const s = new Set(NB[i].map(j => E[j])); s.delete(E[i]); if (s.size === ncol - 1) innerAll++; }
  const pairs = [];
  for (let a = 0; a < ncol; a++) for (let b = a + 1; b < ncol; b++) {
    const adj = []; for (let i = 0; i < N; i++) adj.push((E[i] === a || E[i] === b) ? NB[i].filter(j => (E[j] === a || E[j] === b) && E[j] !== E[i]) : null);
    const seen = new Array(N).fill(false); let best = 0, big = 0, exact = true;
    for (let s = 0; s < N; s++) if (adj[s] && !seen[s]) {
      const comp = [], st = [s]; seen[s] = true; while (st.length) { const u = st.pop(); comp.push(u); for (const v of adj[u]) if (!seen[v]) { seen[v] = true; st.push(v); } }
      if (comp.length >= 6) big++;
      let cb = 1, nodes = 0, capped = false; const vis = new Array(N).fill(false);
      const dfs = (u, len) => { if (capped) return; if (len > cb) cb = len; if (++nodes > budget) { capped = true; return; } vis[u] = true; for (const v of adj[u]) if (!vis[v]) dfs(v, len + 1); vis[u] = false; };
      if (comp.length > 1) { const ends = comp.filter(u => adj[u].length <= 1); for (const u of (ends.length ? ends : comp)) { dfs(u, 1); if (cb === comp.length) break; } }
      if (capped) exact = false; best = Math.max(best, cb);
    }
    pairs.push({ a, b, longest: best, big, exact });
  }
  const L = pairs.map(p => p.longest);
  return { eq, inner, innerAll, pairs, minLong: Math.min(...L), maxLong: Math.max(...L), meanLong: L.reduce((x, y) => x + y, 0) / L.length, islands: pairs.reduce((x, p) => x + p.big, 0), exact: pairs.every(p => p.exact) };
}

// ---- territory fields ----
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
function ringMap(c0) {                                                     // axial -> {rho: hex distance from c0, j: position round the ring}
  const m = new Map(); m.set(c0.join(), { rho: 0, j: 0 });
  for (let rho = 1; rho <= 16; rho++) { let q = c0[0] + DIRS[4][0] * rho, r = c0[1] + DIRS[4][1] * rho, j = 0; for (let d = 0; d < 6; d++) for (let s = 0; s < rho; s++) { m.set(q + ',' + r, { rho, j }); j++; q += DIRS[d][0]; r += DIRS[d][1]; } }
  return m;
}
const mod = (a, k) => ((a % k) + k) % k;
const FIELDS = {
  rings: ([cc, cr, w, k]) => { const m = ringMap(qa(cc, cr)); return i => mod(Math.floor(m.get(ax(i).join()).rho / w), k); },                 // concentric rings (a centre above the board gives chevrons)
  spiral: ([cc, cr, n, w, k, dir]) => { const m = ringMap(qa(cc, cr)); return i => { const { rho, j } = m.get(ax(i).join()); if (!rho) return 0; let f = (j % (6 * rho)) / (6 * rho); if (dir < 0) f = 1 - f; return mod(Math.floor((rho - n * f) / w), k); }; },  // n/w interlocked arms
  pinwheel: ([cc, cr, tw, k]) => { const m = ringMap(qa(cc, cr)); return i => { const { rho, j } = m.get(ax(i).join()); if (!rho) return 0; return mod(Math.floor(j / rho + tw * rho), k); }; },        // blades round a centre
  ribbon: ([kind, w, k]) => i => { const [a, r] = ax(i); return mod(Math.floor((kind === 0 ? a : kind === 1 ? a + r : r) / w), k); },                                // diagonal ribbons
};
const PERMS3 = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]];
function makeBoard(spec) {
  const R = rng(spec.seed || 1), tf = FIELDS[spec.field](spec.args), E = new Array(N), cl = [], tau = [];
  for (let i = 0; i < N; i++) { const [a, r] = ax(i); cl.push(mod(a - r + spec.off, 3)); tau.push(tf(i)); }
  if (spec.ncol === 4) {
    for (let i = 0; i < N; i++) E[i] = cl[i] === spec.omit[tau[i]] ? 3 : cl[i];
    for (let it = 0; it < 4000; it++) {                                    // boundary repair: recolour a clashing tile
      const bad = []; for (let i = 0; i < N; i++) if (NB[i].some(j => E[j] === E[i])) bad.push(i); if (!bad.length) break;
      const i = bad[Math.floor(R() * bad.length)], o = [0, 1, 2, 3].filter(c => !NB[i].some(j => E[j] === c)); E[i] = o.length ? o[Math.floor(R() * o.length)] : Math.floor(R() * 4);
    }
  } else for (let i = 0; i < N; i++) E[i] = PERMS3[spec.perms[tau[i]]][cl[i]];
  return E;
}

// ---- the regular boards (name -> spec). ncol 4: omit[t] = the honeycomb class shown as the 4th element in territory t (-1: none);
//      ncol 3: perms[t] indexes PERMS3, the colour permutation of territory t.
const SPECS = {
  // 4 elements (proper, all 6 pairs alive)
  spiral:   { ncol: 4, field: 'spiral', args: [4, 3, 12, 3, 4, 1], off: 2, seed: 7, omit: [0, 1, 2, -1] },          // 4 interlocked spiral arms round the middle
  rings:    { ncol: 4, field: 'rings', args: [0, 3, 3, 4], off: 2, seed: 10, omit: [0, 1, 2, -1] },                 // arcs round the left edge
  chevrons: { ncol: 4, field: 'rings', args: [4, -2, 2, 3], off: 0, seed: 48, omit: [0, 1, 2] },                    // rings round a point above the board: V bands
  pinwheel: { ncol: 4, field: 'pinwheel', args: [4, 3, .25, 4], off: 0, seed: 142, omit: [0, 1, 2, -1] },           // curved blades round the middle
  ribbons:  { ncol: 4, field: 'ribbon', args: [1, 3, 4], off: 0, seed: 936343, omit: [0, 1, 2, 0] },               // diagonal ribbons
  // 3 elements (honeycomb with a colour permutation per territory)
  blades:   { ncol: 3, field: 'pinwheel', args: [8, 3, 0, 3], off: 1, seed: 236747, perms: [0, 5, 5, 0] },
  bands:    { ncol: 3, field: 'rings', args: [4, 8, 3, 3], off: 0, seed: 25332, perms: [0, 5, 5, 0] },
};

const CRIT = { 4: { eq: 0, minLong: 12, islands: 8 }, 3: { eqMax: 20, minLong: 30, islands: 3 } };
function verdict(E, ncol) {
  const s = stats(E, ncol), c = CRIT[ncol], bad = [];
  if (ncol === 4 ? s.eq > c.eq : s.eq > c.eqMax) bad.push('touching-equal edges ' + s.eq);
  if (s.minLong < c.minLong) bad.push('shortest pair chain ' + s.minLong + ' < ' + c.minLong);
  if (s.islands < c.islands) bad.push('islands ' + s.islands + ' < ' + c.islands);
  if (!s.exact) bad.push('longest chain not exact (DFS budget)');
  return { s, bad };
}
const row = (name, ncol, E, kind) => { const s = stats(E, ncol); return '| ' + name + ' | ' + ncol + ' | ' + kind + ' | ' + s.eq + ' | ' + s.pairs.map(p => p.longest).join(' ') + ' | ' + s.minLong + ' | ' + s.islands + ' | ' + s.innerAll + '/' + s.inner + ' |'; };

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--gen') {
    const out = { 4: {}, 3: {} };
    for (const [name, spec] of Object.entries(SPECS)) { const E = makeBoard(spec), v = verdict(E, spec.ncol); out[spec.ncol][name] = E.join(''); if (v.bad.length) console.error('FAIL ' + name + ': ' + v.bad.join('; ')); }
    console.log('const BREG4 = ' + JSON.stringify(out[4]) + ';\nconst BREG3 = ' + JSON.stringify(out[3]) + ';');
  } else if (arg === '--explore') {
    const ncol = +process.argv[3] || 4, tries = +process.argv[4] || 400, R = rng(Date.now() & 0xffff), pick = a => a[Math.floor(R() * a.length)], res = [];
    const cen = [[4, 3], [3, 3], [5, 3], [4, 2], [4, 4], [4, -2], [4, 8], [0, 3], [8, 3], [2, 1], [6, 5]];
    for (let t = 0; t < tries; t++) {
      const k = ncol === 4 ? pick([3, 4]) : 3, [cc, cr] = pick(cen), field = pick(['rings', 'spiral', 'pinwheel', 'ribbon']), w = pick([1.5, 2, 2.5, 3]);
      const args = field === 'rings' ? [cc, cr, w, k] : field === 'spiral' ? [cc, cr, k * w, w, k, pick([1, -1])] : field === 'pinwheel' ? [cc, cr, pick([0, .25, .5]), k] : [pick([0, 1, 2]), w, k];
      const spec = { ncol, field, args, off: Math.floor(R() * 3), seed: Math.floor(R() * 1e6) };
      if (ncol === 4) spec.omit = pick(k === 3 ? [[0, 1, 2], [0, 1, -1], [0, -1, 2], [-1, 1, 2]] : [[0, 1, 2, -1], [0, 1, 2, 0], [2, 1, 0, -1]]); else spec.perms = [0, pick([1, 2, 3, 4, 5]), pick([1, 2, 3, 4, 5]), 0];
      const E = makeBoard(spec), v = verdict(E, ncol); if (v.bad.length) continue;
      res.push({ spec, s: v.s, score: v.s.meanLong - v.s.eq * .3 + v.s.minLong });
    }
    res.sort((a, b) => b.score - a.score); res.slice(0, 40).forEach((r, i) => console.log(i, JSON.stringify(r.spec), r.s.pairs.map(p => p.longest).join(','), 'eq' + r.s.eq, 'isl' + r.s.islands));
  } else {
    const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'), grab = n => { const m = src.match(new RegExp('const ' + n + ' = (\\[[^\\]]*\\]|\\{[^}]*\\});')); if (!m) { console.error('missing ' + n + ' in index.html'); process.exit(1); } return JSON.parse(m[1]); };
    const old4 = grab('BPAT4'), reg4 = grab('BREG4'), reg3 = grab('BREG3'), hon = Array.from({ length: N }, (_, i) => { const [q, r] = ax(i); return mod(q - r, 3); });
    let fail = 0; const check = (name, str, ncol, regular) => {
      if (str.length !== N || /[^0-3]/.test(str) || (ncol === 3 && /3/.test(str))) { console.log('FAIL ' + name + ': bad string'); fail++; return; }
      const E = str.split('').map(Number), v = regular ? verdict(E, ncol) : { bad: [] };
      if (!regular) { const s = stats(E, ncol); if (s.eq || s.minLong < 12 || s.innerAll < s.inner - 1) v.bad.push('old-board property broken'); }
      if (v.bad.length) { console.log('FAIL ' + name + ': ' + v.bad.join('; ')); fail++; }
    };
    console.log('| board | elements | kind | touching-equal | longest chain per pair | shortest | islands >= 6 | inner tiles touching all other elements |\n|---|---|---|---|---|---|---|---|');
    console.log(row('honeycomb (old)', 3, hon, 'forced')); old4.forEach((p, i) => { check('BPAT4[' + i + ']', p, 4, false); console.log(row('BPAT4[' + i + '] (old)', 4, p.split('').map(Number), 'annealed')); });
    for (const [n, p] of Object.entries(reg3)) { check('BREG3.' + n, p, 3, true); console.log(row(n, 3, p.split('').map(Number), 'regular')); }
    for (const [n, p] of Object.entries(reg4)) { check('BREG4.' + n, p, 4, true); console.log(row(n, 4, p.split('').map(Number), 'regular')); }
    if (Object.keys(reg4).length < Math.round(old4.length / 2)) { console.log('FAIL: fewer than round(N/2) regular 4-element boards'); fail++; }
    if (Object.keys(reg3).length < 2) { console.log('FAIL: fewer than 2 regular 3-element boards (round(3/2), the honeycomb has 3 phases)'); fail++; }
    console.log(fail ? '\n' + fail + ' FAILURES' : '\nall boards pass'); process.exit(fail ? 1 : 0);
  }
}
module.exports = { stats, makeBoard, FIELDS, NB, ax, N };
