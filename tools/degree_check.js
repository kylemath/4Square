// The die counter (degree.js, FTH_DEGREE): is it well defined on every level, and what does a π move do to it?
//   node tools/degree_check.js [--quiet]
//   - Lemma 1's shape on every state of every level's census (Gr.dist: every unfilled state of the start's class) and on
//     every state one swap away (the filled ones too): the three faces off the rim read the same N, the rim face N - eps;
//   - orientation: the faces are consistently oriented (every dart once), mirroring the map negates N, renaming the
//     elements by a permutation of sign s multiplies N and eps by s (so N * eps is label-free);
//   - per level: the start's N, eps, m;
//   - π (Kittell's move, index.html's piChain / kempe_engine.py): from every doubly locked census state, the change of the
//     counter, label-free (dN * eps before the move), and along π-treadmills (π while still doubly locked).
// Exit 1 if a well-definedness check fails. The π numbers are a measurement, not a check: they are printed as found.
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..'), QUIET = process.argv.includes('--quiet');
const ctx = { window: {}, console, Math }; ctx.window.window = ctx.window; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
run('levels.js'); run('degree.js');
const G = ctx.window.GAME, F = ctx.window.FTH_DEGREE;
let bad = 0; const ok = (m, c, x) => { if (!c || !QUIET) console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + x : '')); if (!c) bad++; };
const hist = () => new Map(), add = (h, k) => h.set(k, (h.get(k) || 0) + 1);
const show = h => [...h.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => (k > 0 ? '+' : '') + k + ':' + v).join(' ') || '-';
const decode = (Gr, key) => { const c = new Array(Gr.n).fill(-1); let i = 0; for (let u = 0; u < Gr.n; u++) { if (u === Gr.hole) continue; c[u] = +key[i++]; } return c; };
const canon = (Gr, c) => { const mp = {}; let s = '', k = 0; for (let u = 0; u < Gr.n; u++) { if (u === Gr.hole) continue; if (!(c[u] in mp)) mp[c[u]] = k++; s += mp[c[u]]; } return s; };
const adjOf = Gr => { const A = Array.from({ length: Gr.n }, () => []); Gr.edges.forEach(([a, b]) => { A[a].push(b); A[b].push(a); }); return A; };
function chainsOf(Gr, A, c) {                  // every chain of c (vertex list, pair), webs left out
  const out = [];
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
    const seen = new Set(), mine = [];
    for (let s = 0; s < Gr.n; s++) {
      if (s === Gr.hole || seen.has(s) || (c[s] !== a && c[s] !== b)) continue;
      const set = new Set([s]), st = [s]; seen.add(s);
      while (st.length) { const v = st.pop(); for (const w of A[v]) if (w !== Gr.hole && !set.has(w) && (c[w] === a || c[w] === b)) { set.add(w); seen.add(w); st.push(w); } }
      mine.push({ vs: [...set], pair: [a, b] });
    }
    if (mine.length > 1) out.push(...mine);
  }
  return out;
}
const PERMS = []; (function p(a, r) { if (!r.length) return PERMS.push(a); r.forEach((x, i) => p(a.concat(x), r.filter((_, j) => j !== i))); })([], [0, 1, 2, 3]);
const psign = p => { let s = 1; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (p[i] > p[j]) s = -s; return s; };

console.log('Die counter (degree.js): N = the signed corner count of every die face the rim does not wrap.');
const byMap = new Map(), totalPi = hist(), totalPiRaw = hist(), totalQuiet = hist(), totalRim = hist();
// other readings of "the crank": every one is measured the same way; a constant would show as a single value
const VAR = [
  ['dN * eps after the move', (a, b) => (b.N - a.N) * b.eps],
  ['d(N * eps)', (a, b) => b.N * b.eps - a.N * a.eps],
  ['d(N - eps) * eps (the filled-sphere reading)', (a, b) => ((b.N - b.eps) - (a.N - a.eps)) * a.eps],
  ['dN * hop (hop = +1 when the trouble spot moves 2 along Gr.link, -1 for 3)', (a, b, h) => (b.N - a.N) * h],
  ['dN * eps * hop', (a, b, h) => (b.N - a.N) * a.eps * h],
].map(([name, f]) => ({ name, f, h: new Map() }));
let checked = 0, piN = 0, treadmills = 0, trSame = 0;
const rows = [];
for (const L of G.levels) {
  const Gr = G.graphs[L.g], P = F.prep(Gr);
  if (!P.ok) { rows.push({ L, Gr, none: true }); continue; }
  const st = L.start.slice(); st[Gr.hole] = -1;
  const c0 = F.counts(Gr, st);
  const row = { L, Gr, c0 };
  rows.push(row);
  if (byMap.has(L.g)) { row.same = byMap.get(L.g); continue; }
  byMap.set(L.g, row);
  // orientation: every dart in exactly one corner (the hole's 5 included)
  const darts = new Set(); let dup = 0;
  for (const f of P.faces) for (let i = 0; i < 3; i++) { const k = f[i] + '>' + f[(i + 1) % 3]; if (darts.has(k)) dup++; darts.add(k); }
  ok(L.g + ': ' + P.faces.length + ' corners off the hole, oriented consistently', dup === 0 && P.faces.length === 2 * Gr.n - 9 && darts.size === 3 * P.faces.length);
  // mirror and renaming
  const mir = Object.assign({}, Gr, { pos: Gr.pos.map(p => [-p[0], p[1]]) }), cm = F.counts(mir, st);
  ok(L.g + ': the mirror image reads -N', cm && cm.N === -c0.N && cm.eps === -c0.eps, c0.N + ' / ' + (cm && cm.N));
  ok(L.g + ': renaming by a permutation of sign s multiplies N and eps by s', PERMS.every(p => { const c = F.counts(Gr, st.map(x => x < 0 ? x : p[x])); return c && c.N === psign(p) * c0.N && c.eps === psign(p) * c0.eps && c.m === p[c0.m]; }));
  // Lemma 1 on the whole census and one swap beyond
  const A = adjOf(Gr), keys = Object.keys(Gr.dist || {});
  let shape = 0, all = 0, dl = 0;
  const piH = hist(), piRaw = hist(), quietH = hist(), rimH = hist(), next = hist();
  const rimset = new Set(Gr.link);
  for (const key of keys) {
    const c = decode(Gr, key), C = F.counts(Gr, c); all++; if (C && C.ok) shape++;
    for (const K of chainsOf(Gr, A, c)) {
      const d = F.swap(c, K.vs, K.pair[0], K.pair[1]), Cd = F.counts(Gr, d); all++; if (Cd && Cd.ok) shape++;
      if (C && Cd) add(K.vs.some(u => rimset.has(u)) ? rimH : quietH, (Cd.N - C.N) * C.eps);
    }
    const p = F.pi(Gr, c);
    if (p) {
      dl++; const d = F.swap(c, p.vs, p.pair[0], p.pair[1]), Cd = F.counts(Gr, d);
      add(piH, (Cd.N - C.N) * C.eps); add(piRaw, Cd.N - C.N);
      const F0 = F.frame(Gr, c), F1 = F.frame(Gr, d), hop = F1 ? ((F1.t - F0.t + 5) % 5 === 2 ? 1 : -1) : 0;
      VAR.forEach(v => add(v.h, v.f(C, Cd, hop)));
      const Lk = F.locks(Gr, d); add(next, Lk ? (Lk.dl ? 2 : Lk.l1 || Lk.l2 ? 1 : 0) : -1);
    }
  }
  checked += all;
  ok(L.g + ': Lemma 1 (n_k = N off the rim face, n_m = N - eps) on ' + all + ' states', shape === all, shape + '/' + all);
  // π-treadmills: from each doubly locked census state, apply π while the rim stays doubly locked (labelled colours kept)
  // A closed labelled orbit (the very same board again) has total dN = 0, so a crank (constant nonzero dN) cannot have one.
  const trs = [];
  for (const key of keys) {
    let c = decode(Gr, key); if (!F.pi(Gr, c)) continue;
    const seen = new Map([[c.join(','), 0]]), steps = []; let k = 0;
    for (;;) {
      const p = F.pi(Gr, c); if (!p) break;
      const N0 = F.of(Gr, c); c = F.swap(c, p.vs, p.pair[0], p.pair[1]); k++; steps.push(F.of(Gr, c) - N0);
      const hit = seen.get(c.join(','));
      if (hit !== undefined) { const loop = steps.slice(hit); trs.push({ len: loop.length, sum: loop.reduce((a, b) => a + b, 0), up: loop.filter(d => d > 0).length, down: loop.filter(d => d < 0).length }); break; }
      seen.set(c.join(','), k);
      if (k > 400) break;
    }
  }
  const cyc = new Map(); trs.forEach(t => { const k = t.len + ':' + t.sum + ':' + t.up + ':' + t.down; cyc.set(k, (cyc.get(k) || 0) + 1); });
  treadmills += trs.length; trSame += trs.filter(t => t.sum === 0).length;
  Object.assign(row, { all, dl, piH, piRaw, quietH, rimH, next, cyc });
  const into = (T, h) => h.forEach((v, k) => T.set(k, (T.get(k) || 0) + v));
  into(totalPi, piH); into(totalPiRaw, piRaw); into(totalQuiet, quietH); into(totalRim, rimH);
  piN += dl;
}
console.log('\n  level                 map           N  eps  m   census  doubly-locked   π: dN*eps (label-free)        after π: DL/1 lock/0 locks');
for (const r of rows) {
  const id = String(r.L.num).padEnd(5) + ' ' + r.L.id.slice(0, 18).padEnd(18);
  if (r.none) { console.log('  ' + id + ' ' + r.L.g.padEnd(12) + '  -  (no counter: not a 4-element triangulation with a 5-rim)'); continue; }
  const s = r.same || r, c = r.c0;
  console.log('  ' + id + ' ' + r.L.g.padEnd(12) + String(c.N).padStart(3) + String(c.eps).padStart(5) + String(c.m).padStart(3) +
    (r.same ? '   (map as above)' : String(s.all).padStart(9) + String(s.dl).padStart(10) + '      ' + show(s.piH).padEnd(30) + ' ' + [2, 1, 0].map(k => s.next.get(k) || 0).join('/')));
}
console.log('\n  all maps, from ' + piN + ' doubly locked census states:');
console.log('    π:            dN * eps  ' + show(totalPi));
console.log('    π (labelled): dN        ' + show(totalPiRaw));
VAR.forEach(v => console.log('    π: ' + v.name + ': ' + v.h.size + ' values, ' + show(v.h)));
console.log('    other swaps through the rim: dN * eps  ' + show(totalRim));
console.log('    quiet swaps (no rim region): dN * eps  ' + show(totalQuiet));
const mapsCyc = [...byMap.values()].filter(r => r.cyc && r.cyc.size);
console.log('  π-treadmills (π repeated while doubly locked) that close up on the identical labelled board: ' + treadmills + ' runs');
mapsCyc.forEach(r => console.log('    ' + r.L.g.padEnd(12) + [...r.cyc.entries()].map(([k, v]) => { const [len, sum, up, down] = k.split(':'); return 'loop of ' + len + ' π moves (counter up ' + up + 'x, down ' + down + 'x, net ' + sum + ') from ' + v + ' starts'; }).join('; ')));
const constant = totalPi.size === 1 && ![...totalPi.keys()].includes(0);
console.log('  verdict: π ' + (constant ? 'changed the counter by the same label-free amount every time (' + show(totalPi) + ')' : 'does NOT change the counter by a constant: ' + totalPi.size + ' different label-free values (always odd: ' + [...totalPi.keys()].every(k => k % 2) + ')') +
  (treadmills ? '; ' + trSame + ' of ' + treadmills + ' closed π loops bring the counter back to where it started' : ''));
ok('a closed π loop returns the counter to its start (a consistency check: same board, same N)', trSame === treadmills);
console.log('  ' + checked + ' states checked');
console.log(bad ? bad + ' problem(s)' : 'degree OK');
process.exit(bad ? 1 : 0);
