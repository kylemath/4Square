// The Star skin's model and rule evaluator (lab/star-rules.js, FTH_STAR) against kempe_engine.py, then the built-in rules'
// scores (the numbers in lab/STAR-DESIGN.md).   node tools/star_rules_check.js [--no-py] [--fast]
//   - every level's state tree (its start's Kempe class, built by our own swaps) is the engine's class, state for state,
//     with the engine's dF on every state (python3 tools/star_dump.py); par = dF of the start = levels.js par; the census
//     (Gr.dist, a superset on two maps) agrees too;
//   - merged moves: every child of every state is one swap away (a non-web chain), no two children are the same star;
//     the π tag sits on exactly one child at every double lock, never fills and hops the trouble spot by 3 (t -> t+3);
//   - the evaluator: the oracle solves everything at par, walks are deterministic, a walk only ends filled, capped or stuck;
//   - prints each built-in rule's score on the 40 level starts and on every hard state (dF >= 2) of every distinct class.
//   --fast skips the class scope. Exit 1 on a failed check (the scores are measurements, not checks).
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const D = path.join(__dirname, '..'), args = process.argv.slice(2);
const ctx = { window: {}, console, Math, Date }; ctx.window.window = ctx.window; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
run('levels.js'); run('rim.js'); run('degree.js'); run('lab/star-rules.js');
const GAME = ctx.window.GAME, S = ctx.window.FTH_STAR, RIM = ctx.window.FTH_RIM;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + x : '')); if (!c) bad++; };

let REF = null;
if (!args.includes('--no-py')) {
  const py = cp.spawnSync('python3', [path.join(__dirname, 'star_dump.py')], { maxBuffer: 1 << 28, encoding: 'utf8' });
  if (py.status !== 0) { console.log(py.stderr); process.exit(1); }
  REF = JSON.parse(py.stdout);
}
const t0 = Date.now(), CA = new Map(), LGs = GAME.levels.map(L => S.graph(GAME, L, CA));
console.log('built ' + LGs.length + ' level trees, ' + LGs.reduce((s, g) => s + g.S.length, 0) + ' states, in ' + (Date.now() - t0) + ' ms');
let clsBad = [], dfBad = [], parBad = [], cenBad = [], mvBad = [], piBad = [], piN = 0;
for (const LG of LGs) {
  const L = LG.L, Gr = GAME.graphs[L.g], G = LG.G;
  if (REF) {
    const R = REF[L.id], keys = Object.keys(R.cls);
    if (keys.length !== LG.S.length || keys.some(k => !LG.idx.has(k))) clsBad.push(L.id + ' (' + LG.S.length + ' vs ' + keys.length + ')');
    else if (LG.S.some(s => s.dF !== R.cls[s.key])) dfBad.push(L.id);
  }
  if (LG.par !== L.par) parBad.push(L.id + ' ' + LG.par + '/' + L.par);
  if (Gr.dist && LG.S.some(s => !s.f.filled && Gr.dist[s.key] !== s.dF)) cenBad.push(L.id);
  for (const s of LG.S) {
    if (new Set(s.mv.map(m => m.to)).size !== s.mv.length) { mvBad.push(L.id + ': repeated child'); break; }
    const pis = s.mv.filter(m => m.pi);
    if (s.f.lock === 2 && G.five && !s.f.filled) {
      piN++;
      const c = pis[0] && LG.S[pis[0].to].f;
      if (pis.length !== 1 || c.filled || (c.t - s.f.t + 5) % 5 !== 3 || RIM.analyse(G, s.col).pi.vs.length < 1) piBad.push(L.id + ' ' + s.key);
    } else if (pis.length) piBad.push(L.id + ' π off a double lock');
  }
  // spot check: a merged move's chain really is one non-web swap from its state
  const s = LG.S[0]; for (const m of s.mv) { const K = S.chains(G, s.col).find(k => !k.web && k.a === m.a && k.b === m.b && k.vs.join() === m.vs.join()); if (!K || S.feat(G, S.flip(s.col, K)).key !== LG.S[m.to].key) mvBad.push(L.id + ': child not one swap away'); }
}
if (REF) {
  ok('every level\'s tree is the engine\'s Kempe class of its start', !clsBad.length, clsBad.slice(0, 4).join(', '));
  ok('dF on every state = kempe_engine.py dF', !dfBad.length, dfBad.slice(0, 4).join(', '));
}
ok('par = dF of the start = levels.js par, on all ' + LGs.length + ' levels', !parBad.length, parBad.join(', '));
ok('the census (Gr.dist) has every unfilled state, at the same distance', !cenBad.length, cenBad.join(', '));
ok('children are distinct stars, each one non-web swap away', !mvBad.length, mvBad.slice(0, 3).join(', '));
{ let dl = 0, dl1 = 0, lo = 0, lo1 = 0; const seenK = new Set();
  LGs.forEach(LG => { if (seenK.has(LG.key)) return; seenK.add(LG.key); LG.S.forEach(s => { if (s.f.filled || !LG.G.five) return; if (s.f.lock === 2) { dl++; if (s.dF === 1) dl1++; } else { lo++; if (s.dF === 1) lo1++; } }); });
  ok('a star with an open lock is one swap from a fill (Kempe); a double lock never is (so the hard stars are the double locks)', lo1 === lo && dl1 === 0, lo + ' open, ' + dl + ' double locked'); }
ok('π: one tagged child at every double lock (' + piN + '), never fills, hops the spot t -> t+3; none elsewhere', !piBad.length, piBad.slice(0, 3).join(', '));

// ---- the evaluator
const ORA = S.BUILTIN.find(r => r.id === 'oracle'), so = S.score(ORA, LGs, 'start');
ok('the oracle solves every level at par', so.solved === so.n && so.excess === 0, so.solved + '/' + so.n);
const a = JSON.stringify(S.score(S.BUILTIN[0], LGs, 'start').per), b = JSON.stringify(S.score(S.BUILTIN[0], LGs, 'start').per);
ok('walks are deterministic', a === b);
const w = S.run({ cards: [{ pick: 'pi', when: [] }] }, LGs.find(g => g.L.id === 'round-and-round'), 0);
ok('a walk that cannot fill stops as a loop, not at the cap', !w.solved && w.why === 'loop' && w.steps < S.CAP, w.why + ' after ' + w.steps);
ok('every built-in rule is valid', S.BUILTIN.every(S.valid));

const pct = x => (100 * x).toFixed(1) + '%';
console.log('\n  rule                       starts  solved  +swaps  loops  stuck | hard states   solved   +swaps  loops   ms');
for (const r of S.BUILTIN) {
  const A = S.score(r, LGs, 'start'), B = args.includes('--fast') ? null : S.score(r, LGs, 'class');
  console.log('  ' + r.name.padEnd(26) + String(A.solved + '/' + A.n).padStart(7) + pct(A.rate).padStart(8) + A.excess.toFixed(2).padStart(8) + String(A.loops).padStart(7) + String(A.stuck).padStart(7) +
    (B ? ' |' + String(B.n).padStart(13) + pct(B.rate).padStart(8) + B.excess.toFixed(2).padStart(9) + String(B.loops).padStart(7) + String(B.ms).padStart(6) : '') +
    (A.fails.length ? '\n      fails: ' + A.fails.map(f => f.num + ' ' + f.why).join(', ') : ''));
}
console.log(bad ? bad + ' problem(s)' : 'star rules OK');
process.exit(bad ? 1 : 0);
