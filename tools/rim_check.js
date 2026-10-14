// rim.js (the star rim HUD's analysis) against kempe_engine.py, the reference.   node docs/game/tools/rim_check.js [map ...]
//   - python3 tools/rim_dump.py lists every state of every level's map with the engine's frame, locks and π;
//   - rim.js must agree on all of them, 100%: filled, the trouble spot's star index t, both locks, π's target state; and
//     again with the elements renamed at random (a skin's colouring is any labelling, not the engine's canon);
//   - maps outside the research setting (Level -1: 2 or 3 elements, rim of 3 or 4) are ok = false;
//   - each level's reachable states (its start's Kempe class, found here by our own swaps) match the engine's class,
//     and the report says on how many levels a double lock can be reached;
//   - π, from every double lock: does not fill, and moves the trouble spot from t to t+3 (two rim places, one star step);
//     how often it lands on another double lock (the treadmill), how long treadmills run, and the closed π loops.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const D = path.join(__dirname, '..');
const ctx = { window: {}, console, Math }; ctx.window.window = ctx.window; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
run('levels.js'); run('rim.js');
const GAME = ctx.window.GAME, RIM = ctx.window.FTH_RIM;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + x : '')); if (!c) bad++; };
const py = cp.spawnSync('python3', [path.join(__dirname, 'rim_dump.py'), ...process.argv.slice(2)], { maxBuffer: 1 << 28, encoding: 'utf8' });
if (py.status !== 0) { console.log(py.stderr); process.exit(1); }
const REF = JSON.parse(py.stdout);
const dec = s => [...s].map(ch => ch === 'h' ? -1 : +ch);
let rnd = 7; const rand = k => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd % k; };
const perm = () => { const p = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const j = rand(i + 1); [p[i], p[j]] = [p[j], p[i]]; } return p; };
// every non-web chain swap of col (the game's moves: a web only renames)
function moves(G, col) {
  const out = [];
  for (let a = 0; a < G.ncol; a++) for (let b = a + 1; b < G.ncol; b++) {
    const seen = new Set(), comps = [];
    for (let s = 0; s < G.n; s++) { if (s === G.hole || seen.has(s) || (col[s] !== a && col[s] !== b)) continue; const K = RIM.chainAt(G, col, s, col[s] === a ? b : a); K.forEach(u => seen.add(u)); comps.push(K); }
    if (comps.length > 1) comps.forEach(K => out.push(RIM.flip(col, K, [a, b])));
  }
  return out;
}
let states = 0, agree = 0, renamed = 0, renamedOk = 0, dlAll = 0, piFills = 0, piTwo = 0, piDl = 0, piChainOk = 0;
const levelRows = [], runs = {}, loopRows = [];
for (const key of Object.keys(REF)) {
  const M = REF[key], Gr = GAME.graphs[key], G = RIM.graph(Gr);
  if (!M.states) {                                  // Level -1 ponds: not the research setting
    const L = GAME.levels.filter(l => l.g === key);
    ok(key + ': outside the research setting, ok = false (' + G.ncol + ' elements, rim of ' + G.link.length + ')', L.every(l => !RIM.analyse(G, l.start).ok && RIM.analyse(G, l.start).star === -1));
    continue;
  }
  const idx = new Map(M.states.map((s, k) => [RIM.canon(G, dec(s)), k]));
  let mis = [];
  M.states.forEach((s, k) => {
    const col = dec(s), check = c => {
      const R = RIM.analyse(G, c);
      if (!R.ok || R.filled !== !!M.filled[k] || R.star !== M.t[k]) return 'frame';
      if (!R.filled && (R.locks[0] !== !!M.L1[k] || R.locks[1] !== !!M.L2[k] || R.lock !== M.L1[k] + M.L2[k])) return 'locks';
      if (!R.filled && R.status !== ['free', 'single', 'double'][R.lock]) return 'status';
      const pt = R.pi ? idx.get(RIM.canon(G, R.pi.col)) : -1;
      if (pt !== M.pi[k]) return 'pi';
      return '';
    };
    states++; const e1 = check(col); if (!e1) agree++; else mis.push(k + ':' + e1);
    const p = perm(), c2 = col.map(x => x < 0 ? x : p[x]); renamed++; const e2 = check(c2); if (!e2) renamedOk++; else mis.push(k + ':renamed ' + e2);
    if (M.pi[k] >= 0) {                              // π from a double lock
      dlAll++; const R = RIM.analyse(G, col), A = RIM.analyse(G, R.pi.col);
      if (A.filled) piFills++;
      if (A.star === (R.star + 3) % 5 && R.pi.star === A.star) piTwo++;
      if (A.status === 'double') piDl++;
      if (R.pi.vs.includes(R.x[3]) && !R.pi.vs.includes(R.x[0])) piChainOk++;
    }
  });
  ok(key + ': rim.js agrees with kempe_engine on all ' + M.states.length + ' states (and renamed)', !mis.length, mis.slice(0, 5).join(' '));
  // treadmills: from each double lock, swap π while the rim stays double locked
  M.states.forEach((s, k) => {
    if (M.pi[k] < 0) return; let j = k, len = 0; const seen = new Set();
    while (M.pi[j] >= 0 && !seen.has(j)) { seen.add(j); j = M.pi[j]; len++; }
    const tag = M.pi[j] >= 0 ? 'loop' : len; runs[tag] = (runs[tag] || 0) + 1;
  });
  // closed π loops: their length is a multiple of 5 (the star closes); follow π in raw colours to see when the very board returns
  M.loops.forEach(cyc => {
    let c = dec(M.states[cyc[0]]); const c0 = c.slice(); let steps = 0, back = 0;
    for (let lap = 1; lap <= 24 && !back; lap++) { for (let i = 0; i < cyc.length; i++) { c = RIM.analyse(G, c).pi.col; steps++; } if (c.every((x, u) => x === c0[u])) back = steps; }
    loopRows.push({ key, len: cyc.length, star: cyc.map(k => M.t[k]).join(''), back });
  });
  // each level's reachable states: our own swaps from the start, against the engine's Kempe class
  GAME.levels.filter(l => l.g === key).forEach(l => {
    const seen = new Map([[RIM.canon(G, l.start), l.start.slice()]]), q = [l.start.slice()];
    while (q.length) { const c = q.pop(); for (const d of moves(G, c)) { const s = RIM.canon(G, d); if (!seen.has(s)) { seen.set(s, d); q.push(d); } } }
    const ref = new Set(M.cls[l.id].map(k => M.states[k] && RIM.canon(G, dec(M.states[k]))));
    const same = seen.size === ref.size && [...seen.keys()].every(s => ref.has(s));
    let dl = 0, single = 0, unfilled = 0; seen.forEach(c => { const R = RIM.analyse(G, c); if (!R.filled) { unfilled++; if (R.lock === 2) dl++; if (R.lock === 1) single++; } });
    const st = RIM.analyse(G, l.start);
    levelRows.push({ id: l.id, num: l.num, key, n: seen.size, unfilled, single, dl, start: st.status, same, pi: (l.tools || []).includes('pi') });
  });
}
ok('rim.js = kempe_engine on every state of every level map: ' + agree + '/' + states, agree === states);
ok('the same with the elements renamed at random: ' + renamedOk + '/' + renamed, renamedOk === renamed);
const lvBad = levelRows.filter(r => !r.same);
ok('each level\'s reachable states (our swaps) = the engine\'s Kempe class of its start', !lvBad.length, lvBad.map(r => r.id).join(' '));
console.log('\n  level             map            reach  unfilled  single  double  start');
levelRows.forEach(r => console.log('  ' + (String(r.num).padEnd(5) + ' ' + r.id).slice(0, 18).padEnd(18) + r.key.padEnd(14) + String(r.n).padStart(6) + String(r.unfilled).padStart(10) + String(r.single).padStart(8) + String(r.dl).padStart(8) + '  ' + r.start));
const withDl = levelRows.filter(r => r.dl > 0);
console.log('\n  a double lock is reachable on ' + withDl.length + ' of ' + levelRows.length + ' levels with a 5-rim (' + withDl.filter(r => r.pi).length + ' of ' + levelRows.filter(r => r.pi).length + ' π-island levels, where the HUD shows); ' + levelRows.filter(r => r.start === 'double').length + ' levels start double locked');
console.log('  π from all ' + dlAll + ' double-locked states (all maps): fills ' + piFills + ', moves the spot t -> t+3 (two places, one star step) ' + piTwo +
  ', its {alpha, gamma} chain takes x3 and misses x0 ' + piChainOk + ', lands on another double lock ' + piDl + ' (' + Math.round(100 * piDl / Math.max(1, dlAll)) + '%)');
ok('π never fills', piFills === 0, piFills);
ok('π always moves the trouble spot exactly two rim places (t -> t+3), one step along the star', piTwo === dlAll, piTwo + '/' + dlAll);
ok('π\'s chain always swaps x3 in and never reaches x0 (so the spot pivots on x0)', piChainOk === dlAll, piChainOk + '/' + dlAll);
console.log('  treadmills (π swaps in a row while double locked, from every double lock): ' + Object.keys(runs).sort((a, b) => (a === 'loop') - (b === 'loop') || a - b).map(k => k + ':' + runs[k]).join('  '));
console.log('  closed π loops (canon states; HoleGame.pi_cycles): ' + loopRows.length + (loopRows.length ? ', lengths ' + [...new Set(loopRows.map(r => r.len))].join(' ') + ' on ' + [...new Set(loopRows.map(r => r.key))].join(' ') : ''));
loopRows.forEach(r => console.log('    ' + r.key.padEnd(12) + ' length ' + r.len + '  star ' + r.star + '  the exact board (same element on every tile) returns after ' + (r.back ? r.back + ' π swaps' : 'more than 24 laps')));
ok('every closed π loop has a length that is a multiple of 5 (the spot must go once round the star to repeat)', loopRows.every(r => r.len % 5 === 0), loopRows.map(r => r.len).join(' '));
console.log(bad ? '\n' + bad + ' FAILED' : '\nall ok');
process.exit(bad ? 1 : 0);
