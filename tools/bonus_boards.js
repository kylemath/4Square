#!/usr/bin/env node
// Bonus game boards and payouts: generate the `chain` boards offline and validate the data in bonus/games.js.
//
//   node tools/bonus_boards.js           check: load bonus/games.js, assert every board's criteria and the payout bands, print the tables
//   node tools/bonus_boards.js --gen     rebuild the 4-element chain boards (deterministic annealing) and print the JS to paste as B4
//
// The `chain` board is a 5 x 4 hex grid (odd rows shifted right, 20 big gems, up to 6 neighbours): gem i = row * 5 + col, a
// digit per gem. A CHAIN is a path of gems that alternates two elements (a,b,a,b...). Stats per element pair: longest chain
// (exact, by DFS) and the number of two-element islands of >= 3 gems (places a chain can start).
//
// 3 elements: the honeycomb (q - r + off) mod 3, the only proper 3-colouring of the grid (three phases): every pair is a honeycomb.
// 4 elements (B4): annealed proper colourings. Criteria (asserted): PROPER (no two touching gems equal), every one of the 6 pairs has
//   a longest chain >= 4, at least 3 pairs have one >= 6, every inner gem touches all 3 other elements, >= 6 islands of >= 3 gems.
// The game also plays each board turned 180 degrees (gem i -> 19 - i), which keeps the lattice (rows = 4: a vertical flip would not).
//
// Payout bands: every game's documented best/typical pay (FTH_BONUS.econ, in points) is checked against the old 9 x 7 round's
// (tiles x mean stack x 10 points), so tickets stay balanced whichever game a win rolls.
const fs = require('fs'), path = require('path'), vm = require('vm');
const COLS = 5, ROWS = 4, N = COLS * ROWS;
const ax = i => { const c = i % COLS, r = (i / COLS) | 0; return [c - (r >> 1), r]; };
const at = new Map(); for (let i = 0; i < N; i++) at.set(ax(i).join(), i);
const NB = []; for (let i = 0; i < N; i++) { const [q, r] = ax(i); NB.push([[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => at.get((q + a) + ',' + (r + b))).filter(j => j !== undefined)); }
const mod = (a, k) => ((a % k) + k) % k;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function stats(E, ncol) {
  let eq = 0; for (let i = 0; i < N; i++) for (const j of NB[i]) if (j > i && E[i] === E[j]) eq++;
  let inner = 0, innerAll = 0;
  for (let i = 0; i < N; i++) if (NB[i].length === 6) { inner++; const s = new Set(NB[i].map(j => E[j])); s.delete(E[i]); if (s.size === ncol - 1) innerAll++; }
  const pairs = [];
  for (let a = 0; a < ncol; a++) for (let b = a + 1; b < ncol; b++) {
    const adj = []; for (let i = 0; i < N; i++) adj.push((E[i] === a || E[i] === b) ? NB[i].filter(j => (E[j] === a || E[j] === b) && E[j] !== E[i]) : null);
    const seen = new Array(N).fill(false); let best = 0, big = 0;
    for (let s = 0; s < N; s++) if (adj[s] && !seen[s]) {
      const comp = [], st = [s]; seen[s] = true; while (st.length) { const u = st.pop(); comp.push(u); for (const v of adj[u]) if (!seen[v]) { seen[v] = true; st.push(v); } }
      if (comp.length >= 3) big++;
      let cb = 1; const vis = new Array(N).fill(false);
      const dfs = (u, len) => { if (len > cb) cb = len; vis[u] = true; for (const v of adj[u]) if (!vis[v]) dfs(v, len + 1); vis[u] = false; };
      if (comp.length > 1) for (const u of comp) { dfs(u, 1); if (cb === comp.length) break; }
      best = Math.max(best, cb);
    }
    pairs.push({ a, b, longest: best, big });
  }
  const L = pairs.map(p => p.longest);
  return { eq, inner, innerAll, pairs, minLong: Math.min(...L), maxLong: Math.max(...L), long6: L.filter(x => x >= 6).length, islands: pairs.reduce((x, p) => x + p.big, 0) };
}
const honey = off => Array.from({ length: N }, (_, i) => { const [q, r] = ax(i); return mod(q - r + off, 3); });
const CRIT4 = { minLong: 4, long6: 3, islands: 6 };
function verdict4(E) {
  const s = stats(E, 4), bad = [];
  if (s.eq) bad.push('touching-equal edges ' + s.eq);
  if (s.minLong < CRIT4.minLong) bad.push('shortest pair chain ' + s.minLong + ' < ' + CRIT4.minLong);
  if (s.long6 < CRIT4.long6) bad.push('pairs with a chain of 6+: ' + s.long6 + ' < ' + CRIT4.long6);
  if (s.innerAll < s.inner) bad.push('inner gems touching all other elements ' + s.innerAll + '/' + s.inner);
  if (s.islands < CRIT4.islands) bad.push('islands ' + s.islands + ' < ' + CRIT4.islands);
  return { s, bad };
}
function gen4(count, seed) {                      // anneal proper 4-colourings; keep the best distinct ones (also distinct up to colour renaming)
  const R = rng(seed), out = [], keys = new Set();
  const canon = E => { const m = new Map(); return E.map(x => { if (!m.has(x)) m.set(x, m.size); return m.get(x); }).join(''); };
  for (let t = 0; t < 4000 && out.length < count * 6; t++) {
    const E = Array.from({ length: N }, () => Math.floor(R() * 4));
    for (let it = 0; it < 3000; it++) {
      const bad = []; for (let i = 0; i < N; i++) if (NB[i].some(j => E[j] === E[i])) bad.push(i); if (!bad.length) break;
      const i = bad[Math.floor(R() * bad.length)], o = [0, 1, 2, 3].filter(c => !NB[i].some(j => E[j] === c)); E[i] = o.length ? o[Math.floor(R() * o.length)] : Math.floor(R() * 4);
    }
    const v = verdict4(E); if (v.bad.length) continue;
    const k = canon(E), k2 = canon(E.slice().reverse()); if (keys.has(k) || keys.has(k2)) continue; keys.add(k);
    out.push({ E, score: v.s.pairs.reduce((x, p) => x + p.longest, 0) + v.s.islands * .5 });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, count).map(o => o.E.join(''));
}
const row = (name, ncol, E, kind) => { const s = stats(E, ncol); return '| ' + name + ' | ' + ncol + ' | ' + kind + ' | ' + s.eq + ' | ' + s.pairs.map(p => p.longest).join(' ') + ' | ' + s.minLong + ' | ' + s.islands + ' | ' + s.innerAll + '/' + s.inner + ' |'; };

function loadGames() {
  const ctx = { window: {}, Math, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'bonus', 'games.js'), 'utf8'), ctx, { filename: 'bonus/games.js' });
  return ctx.window.FTH_BONUS;
}

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--gen') {
    console.log('const B4 = ' + JSON.stringify(gen4(8, 20261012)) + ';');
  } else {
    const FB = loadGames(); let fail = 0;
    const no = m => { console.log('FAIL ' + m); fail++; };
    if (!FB) { console.log('FAIL bonus/games.js does not define window.FTH_BONUS'); process.exit(1); }
    const want = ['chain', 'snake', 'hop', 'stack', 'pop'];
    if (JSON.stringify(FB.ids) !== JSON.stringify(want)) no('FTH_BONUS.ids should be ' + want.join(','));
    want.forEach(id => { const g = FB.games[id]; if (!g || typeof g.create !== 'function' || !(g.w > 0) || !(g.h > 0)) no('game ' + id + ' needs create(), w and h'); });
    if (FB.board.cols !== COLS || FB.board.rows !== ROWS) no('chain board is ' + FB.board.cols + ' x ' + FB.board.rows + ', the checker expects ' + COLS + ' x ' + ROWS);
    for (let i = 0; i < N; i++) if (FB.nb[i].slice().sort().join() !== NB[i].slice().sort().join()) { no('neighbours of gem ' + i + ' differ from the checker'); break; }
    console.log('| board | elements | kind | touching-equal | longest chain per pair | shortest | islands >= 3 | inner gems touching all other elements |\n|---|---|---|---|---|---|---|---|');
    [0, 1, 2].forEach(o => { const E = honey(o), s = stats(E, 3); if (E.join('') !== FB.honey(o)) no('FTH_BONUS.honey(' + o + ') differs'); if (s.eq || s.minLong < 6) no('honeycomb ' + o + ' property broken'); console.log(row('honeycomb ' + o, 3, E, 'forced')); });
    if (!Array.isArray(FB.B4) || FB.B4.length < 6) no('fewer than 6 four-element boards');
    (FB.B4 || []).forEach((p, i) => {
      if (p.length !== N || /[^0-3]/.test(p)) { no('B4[' + i + ']: bad string'); return; }
      const E = p.split('').map(Number), v = verdict4(E); if (v.bad.length) no('B4[' + i + ']: ' + v.bad.join('; '));
      if (new Set(E).size < 4) no('B4[' + i + ']: uses fewer than 4 elements');
      console.log(row('B4[' + i + ']', 4, E, 'annealed'));
    });
    // payout bands, in points (a point is the shell's unit; coins = points x the skin's rate)
    const E = FB.ECON, mean = E.stacks.reduce((a, s, i) => a + s * (E.odds[i] - (i ? E.odds[i - 1] : 0)), 0);
    const OLD = { typical: Math.round(30 * mean * 10), best: Math.round(54 * mean * 10) };   // old round: 3 chains, ~10 tiles each typical, ~18 best, 10 points a coin
    console.log('\n| game | typical | best | rule |\n|---|---|---|---|');
    console.log('| old 9x7 round | ' + OLD.typical + ' | ' + OLD.best + ' | 63 tiles, ' + mean.toFixed(2) + ' coins a tile, 10 points a coin |');
    want.forEach(id => {
      const x = FB.econ[id]; if (!x) { no('econ.' + id + ' missing'); return; }
      console.log('| ' + id + ' | ' + Math.round(x.typical) + ' | ' + Math.round(x.best) + ' | ' + x.rule + ' |');
      if (x.typical < OLD.typical * .6 || x.typical > OLD.typical * 1.4) no(id + ': typical pay ' + Math.round(x.typical) + ' is outside 60-140% of the old round (' + OLD.typical + ')');
      if (x.best < OLD.best * .6 || x.best > OLD.best * 1.5) no(id + ': best pay ' + Math.round(x.best) + ' is outside 60-150% of the old round (' + OLD.best + ')');
    });
    console.log(fail ? '\n' + fail + ' FAILURES' : '\nall boards and payouts pass'); process.exit(fail ? 1 : 0);
  }
}
module.exports = { stats, NB, ax, N, honey, verdict4 };
