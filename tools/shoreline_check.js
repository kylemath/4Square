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
console.log(bad ? bad + ' level/mode rows FAILED' : 'all ' + rows.length + ' level/mode rows ok');
process.exit(bad ? 1 : 0);
