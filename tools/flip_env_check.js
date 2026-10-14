// The Flip RL environment (lab/flip-env.js): API tests and baseline agents.   node tools/flip_env_check.js [--episodes 100]
//   - reset is deterministic in the seed; the mask is exactly the model's legal signed flips; a legal step is F.flip, an
//     illegal one changes nothing; done on the goal or the cap; the oracle solves every puzzle in exactly par steps;
//     observation size and contents; dihedral relabelling keeps par;
//   - baselines (the numbers in lab/arena/FLIP-ENV.md): random, greedy and greedy+tabu solve rates by n on the standard
//     bench (signed target at distance n - 2, cap 4 x par + 4), plus solve rate within 100 steps, and on a detour bench
//     (targets at signed distance n whose unsigned distance is at least 2 less: the sign rule forces a detour).
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..');
const ctx = { window: {}, console, Math }; ctx.window.window = ctx.window; vm.createContext(ctx);
for (const f of ['lab/flip-model.js', 'lab/flip-env.js']) vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
const F = ctx.window.FTH_FLIP, V = ctx.window.FLIP_ENV;
const args = process.argv.slice(2), ei = args.indexOf('--episodes'), EP = ei >= 0 ? +args[ei + 1] : 100;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + x : '')); if (!c) bad++; };

// ---- API
{
  const E = V.make({ n: 9 });
  ok('action space = n(n-3)/2 diagonal slots', E.A === 27 && E.slots.length === 27 && new Set(E.slots).size === 27);
  const o1 = E.reset({ seed: 5 }), o2 = V.make({ n: 9 }).reset({ seed: 5 });
  ok('reset is deterministic in the seed', o1.x.length === E.obsSize && o1.x.every((v, i) => v === o2.x[i]), E.obsSize + ' features');
  let mOk = 0, steps = 0, illegalOk = 0, flipOk = 0;
  const R = F.rng(3);
  for (let ep = 0; ep < 30; ep++) {
    let obs = E.reset({ seed: 100 + ep }), r;
    do {
      const st = E.state(), m = E.mask();
      if (E.slots.every((d, i) => !!m[i] === (st.T.includes(d) && F.legal(st, d).ok))) mOk++;
      const a = R() < 0.3 ? R.int(E.A) : V.agents.random(E, obs, R);
      r = E.step(a); steps++;
      if (!m[a]) { if (r.info.illegal && F.same(E.state().T, st.T) && r.reward === -1) illegalOk++; else console.log(r.info); }
      else { const w = F.flip(st, E.slots[a]); if (F.stKey(w) === F.stKey(E.state())) flipOk++; }
      obs = r.obs;
    } while (!r.done);
    if (!(r.info.solved || r.info.steps === 4 * E.puzzle().par + 4)) mOk = -1e9;
  }
  ok('mask = the legal signed flips, every step', mOk === steps, steps + ' steps');
  ok('legal steps are F.flip, illegal ones change nothing (reward -1)', illegalOk + flipOk === steps);
  let orc = 0, cnt = 0;
  for (const n of [6, 8, 10, 12]) { const En = V.make({ n }); for (let s = 0; s < 8; s++) { cnt++; const r = V.episode(En, V.agents.oracle, { seed: s }, R); if (r.solved && r.steps === r.par) orc++; } }
  ok('the oracle solves in exactly par steps (n = 6, 8, 10, 12)', orc === cnt, orc + ' / ' + cnt);
  E.reset({ seed: 9 }); const x = E.observe().x, P = E.puzzle();
  const tgtCount = E.slots.reduce((k, d, i) => k + x[i * E.F + 1], 0), curCount = E.slots.reduce((k, d, i) => k + x[i * E.F], 0), colCount = x.slice(E.F * E.A, E.F * E.A + 36).reduce((a, b) => a + b, 0);
  ok('observation: n-3 current and n-3 target slots, one colour per vertex', tgtCount === 6 && curCount === 6 && colCount === 9);
  let rel = 0; for (let k = 0; k < 9; k++) for (const mir of [false, true]) { const Q = E.relabel(k, mir); if (F.solve(F.state(9, Q.T, Q.s), Q.target).length === P.par) rel++; }
  ok('dihedral relabelling keeps par (18 symmetries)', rel === 18);
  const Es = V.make({ n: 8, shaped: true }); Es.reset({ seed: 2 }); const a0 = Es.oracle(), r0 = Es.step(a0);
  ok('shaped reward: -1 plus the change in matched diagonals', r0.reward >= -2 && r0.reward <= 0);
}
// ---- baselines
const f = x => ((100 * x.rate).toFixed(0) + '% / ' + (100 * x.rate100).toFixed(0) + '% (' + x.steps.toFixed(1) + ')').padEnd(18);
function bench(title, ns, spec) {
  console.log('\n' + title + ': ' + EP + ' puzzles per n (seeds 1..' + EP + '), cap 4 x par + 4 (and 100 steps)');
  console.log('   n   par  detour  random            greedy            greedy+tabu       (solved within cap / within 100; mean steps if solved in cap)');
  const rows = [];
  for (const n of ns) {
    const row = { n }, E = V.make({ n }), E100 = V.make({ n, cap: 100 }); let parSum = 0, detSum = 0;
    for (const nm of ['random', 'greedy', 'greedyTabu']) {
      let sol = 0, sol100 = 0, st = 0; const R = F.rng(77 + n);
      for (let s = 1; s <= EP; s++) {
        const r = V.episode(E, V.agents[nm], Object.assign({ seed: s }, spec(n)), R); if (nm === 'random') { parSum += r.par; detSum += E.puzzle().detour; }
        if (r.solved) { sol++; st += r.steps; }
        const P = E.puzzle(), r2 = V.episode(E100, V.agents[nm], { puzzle: P, cap: 100 }, R); if (r2.solved) sol100++;
      }
      row[nm] = { rate: sol / EP, rate100: sol100 / EP, steps: sol ? st / sol : 0 };
    }
    row.par = parSum / EP; rows.push(row);
    console.log('  ' + String(n).padStart(2) + '  ' + row.par.toFixed(1).padStart(4) + '  ' + (detSum / EP).toFixed(1).padStart(5) + '   ' + f(row.random) + f(row.greedy) + f(row.greedyTabu));
  }
  return rows;
}
const rows = bench('standard bench (signed target at distance n - 2)', [5, 6, 7, 8, 9, 10, 11, 12], n => ({ len: n - 2, detour: 0 }));
const hard = bench('detour bench (signed distance n, at least 2 more than the unsigned distance)', [9, 10, 11, 12], n => ({ len: n, detour: 2 }));
ok('the detour bench really has detours', hard.every(r => r.par >= r.n - 0.5));
ok('greedy beats random at every n', rows.every(r => r.greedy.rate >= r.random.rate));
console.log(bad ? bad + ' problem(s)' : 'flip env OK');
process.exit(bad ? 1 : 0);
