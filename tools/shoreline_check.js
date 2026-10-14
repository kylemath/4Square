// Shoreline (lab/shoreline.html): every level loads and is winnable with shore-only swaps.
//   node tools/shoreline_check.js [--walks 40]
// For each level and each shore mode (beach = the 3 outer-face tiles, shells = the outermost two BFS shells):
//   1. builds the game with lab/core.js (as the page does) and the shore with lab/shoreline-core.js;
//   2. solves from the start with the page's own BFS (depth 7, 50k states) -> "shore par";
//   3. plays that line through g.swap (finding each chain by its vertex set among g.chains, and checking it meets the
//      shore and is not a web) and asserts g.won() after exactly shore-par swaps;
//   4. from --walks random positions (random shore-only swaps from the start, 1..12 of them) checks a win is still
//      reachable with shore-only swaps (depth 12, 200k states).
// Reports shore par next to the census par (g.dist() at the start) and flags every level where they differ.
const fs = require('fs'), path = require('path');
const ROOT = process.env.GAME_ROOT || path.join(__dirname, '..');
const args = process.argv.slice(2), wi = args.indexOf('--walks'), WALKS = wi >= 0 ? +args[wi + 1] : 40;
global.window = global; global.location = { search: '' }; global.addEventListener = () => {}; global.parent = global;
global.performance = global.performance || { now: () => Date.now() };
for (const f of ['levels.js', 'layout.js', 'lab/core.js']) (0, eval)(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const SHORE = require(path.join(ROOT, 'lab/shoreline-core.js'));
let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
let bad = 0; const rows = [];
for (const L of GAME.levels) {
  for (const mode of ['beach', 'shells']) {
    const g = LAB.game(L.id), spec = { n: g.n, adj: g.adj, hole: g.hole, border: g.border, rim: g.rim, NC: g.NC, goal: g.goal };
    const sh = SHORE.shore(spec, mode), par = g.dist(), fails = [];
    const r = SHORE.solve(spec, g.col, sh.set);
    if (r.dist == null) fails.push('no shore win within depth 7 (' + r.states + ' states' + (r.capped ? ', capped' : '') + ')');
    else {
      for (const vs of r.line) {
        const key = vs.join('.'), K = g.chains.find(k => k.vs.join('.') === key);
        if (!K) { fails.push('line chain not on the board'); break; }
        if (K.web) fails.push('line uses a web');
        if (!K.vs.some(u => sh.set.has(u))) fails.push('line chain misses the shore');
        g.swap(K);
      }
      if (!g.won()) fails.push('line does not win');
      if (g.moves !== r.dist) fails.push('moves ' + g.moves + ' != shore par ' + r.dist);
    }
    let walkFail = 0, worst = 0;
    for (let w = 0; w < WALKS; w++) {
      let col = L.start.slice(); col[g.hole] = -1; const steps = 1 + Math.floor(rnd() * 12);
      for (let s = 0; s < steps && !SHORE.won(spec, col); s++) { const M = SHORE.moves(spec, col, sh.set); if (!M.length) break; col = SHORE.flip(col, M[Math.floor(rnd() * M.length)]); }
      const q = SHORE.solve(spec, col, sh.set, { maxDepth: 12, maxStates: 200000 });
      if (q.dist == null) walkFail++; else worst = Math.max(worst, q.dist);
    }
    if (walkFail) fails.push(walkFail + '/' + WALKS + ' random positions not solvable within depth 12');
    const note = r.dist != null && par != null && r.dist !== par ? 'shore par ' + r.dist + ' vs par ' + par : '';
    if (fails.length) bad++;
    rows.push([(fails.length ? 'FAIL' : 'ok  '), String(L.num).padEnd(5), L.id.padEnd(20), sh.mode.padEnd(6), '|S|=' + String(sh.set.size).padEnd(3),
      'par ' + par, 'shore ' + (r.dist == null ? 'X' : r.dist), 'states ' + String(r.states).padEnd(6), 'walk-max ' + worst, note, fails.join('; ')].join('  '));
  }
}
console.log(rows.join('\n'));
// the per-skin par: skins/shoreline.js `par` (stars in the app) and verify.js SKIN_PAR (run proofs) must be exactly the
// levels where beach shore par exceeds the census par, with that shore par
{
  const want = {}; rows.forEach(r => { const m = r.match(/^ok\s+\S+\s+(\S+)\s+beach\s.*par (\d+)\s+shore (\d+)/); if (m && +m[3] > +m[2]) want[m[1]] = +m[3]; });
  global.FTH_SKINS = { register(s) { this.spec = s; }, coinArt: () => () => '', extend: () => ({}) };
  (0, eval)(fs.readFileSync(path.join(ROOT, 'skins/shoreline.js'), 'utf8'));
  const V = require(path.join(ROOT, 'verify.js')), sp = FTH_SKINS.spec.par, vp = V.SKIN_PAR.shoreline, J = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
  const okSpec = J(sp || {}) === J(want), okVer = J(vp || {}) === J(want);
  console.log((okSpec ? 'ok    ' : 'FAIL  ') + 'skins/shoreline.js par = beach shore par where it is longer: ' + J(want));
  console.log((okVer ? 'ok    ' : 'FAIL  ') + 'verify.js SKIN_PAR.shoreline matches');
  if (!okSpec) bad++; if (!okVer) bad++;
  // a run proof's stars: shore-only line at shore par = 3 stars; a line that leaves the shore falls back to the census par
  const env = V.nodeEnv(ROOT);
  for (const id of Object.keys(want)) {
    const L = GAME.levels.find(l => l.id === id), g = env.LAB.game(id), spec = { n: g.n, adj: g.adj, hole: g.hole, border: g.border, rim: g.rim, NC: g.NC, goal: g.goal };
    const sh = SHORE.shore(spec, 'beach'), r = SHORE.solve(spec, g.col, sh.set), t0 = 1.75e12;
    const proof = (lines) => { const h = env.LAB.game(id), ops = []; let t = 0; for (const vs of lines) { const K = h.chains.find(k => k.vs.join('.') === vs.join('.')); h.swap(K); t += 900; ops.push(['s', t, V.encCol(h.col)]); }
      const p = { v: 1, lvl: id, skin: 'shoreline', app: 'check', cnt: 'net', ops, t0, ms: t + 500, hints: 0, fin: V.encCol(h.col), claim: { moves: lines.length, stars: 3 } }; p.fp = V.fingerprint(p); return V.verifyProof(p, Object.assign({ now: t0 + 1e6 }, env)); };
    const a = proof(r.line);
    const ok1 = a.ok && a.stars === 3 && !a.soft.includes('off-shore');
    // the census line (g.good()) uses a deep chain on these levels: stars against the census par only
    const gg = env.LAB.game(id), deep = []; while (!gg.won()) { const K = gg.good()[0]; deep.push(K.vs.slice()); gg.swap(K); }
    const b = proof(deep), ok2 = b.soft.includes('off-shore') || deep.every(vs => vs.some(u => sh.set.has(u)));
    console.log((ok1 && ok2 ? 'ok    ' : 'FAIL  ') + id + ': proof of the shore line (' + r.line.length + ' swaps) verifies ' + a.stars + ' stars' + (a.hard.length ? ' hard ' + a.hard : '') + '; census line (' + deep.length + ') ' + (b.soft.includes('off-shore') ? 'flagged off-shore' : 'stays on the shore'));
    if (!(ok1 && ok2)) bad++;
  }
}
console.log(bad ? bad + ' check(s) FAILED' : 'all ' + rows.length + ' level/mode rows and the per-skin par ok');
process.exit(bad ? 1 : 0);
