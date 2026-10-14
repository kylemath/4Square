// Signed diagonal flips (lab/flip-model.js): the formulation, checked exhaustively for small n.   node tools/flip_check.js [--quick | --full] [--n 11]
//   default: n <= 11 (sign-level B, C and the sign-based BFS to 9, per-pair E to 8; ~20 s); --quick n <= 9; --full B, C, BFS to
//   10 and E to 9 (~7 min)
//   A. triangulations: Catalan(n-2) of them, the unsigned flip graph is connected, its diameter (rotation distance) as known;
//   B. signs <-> colourings: every signing of T is the sign pattern of exactly one proper F4 colouring (col0 = 0, col1 = 1),
//      round trip, and T has exactly 2^(n-2) such colourings (counted by brute force, independently of signs);
//   C. the flip rule: for every T, signing and diagonal ac (apexes b, d), the model's signed flip is legal <=> col(b) != col(d),
//      and the flipped signs are exactly the colouring's signs on the new triangulation (so a signed flip keeps the colouring);
//   D. every pair (T1, T2): signed-flip solvable for some signs <=> T1, T2 have a common proper 4-colouring (Theorem 1 of
//      Carpentier = the 4CT for the glued sphere). Components of the signed flip graph are computed in colour space;
//      for n <= SIGNED_N they are also rebuilt from the model's own sign-based BFS and must agree;
//   E. per pair, independently: a backtracking 4-colouring of the glued graph (T1 inside, T2 outside the n-cycle) exists,
//      and #Tait colourings (3-edge-colourings with every triangular face rainbow) x 4 = #vertex 4-colourings;
//   F. the solver is optimal (vs colour-space BFS) and its paths replay; G. the page's levels are what they claim;
//   H. forced detours: min over all signs of the signed distance vs the unsigned (rotation) distance;
//   K. Kauffman's form: for every pair of bracketings (the n-1 sides as factors in {i, j, k}, root side 0-(n-1)) some
//      assignment makes both cross products equal and non-zero; whenever both are non-zero along the same axis they are
//      equal (the sign takes care of itself on the sphere), so #such assignments = #Tait colourings of the glued map.
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..');
const ctx = { window: {}, console, Math }; ctx.window.window = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(D, 'lab/flip-model.js'), 'utf8'), ctx, { filename: 'lab/flip-model.js' });
const F = ctx.window.FTH_FLIP;
const args = process.argv.slice(2), ai = args.indexOf('--n'), QUICK = args.includes('--quick'), FULL = args.includes('--full');
const DET_N = QUICK ? 8 : 9, KAU_N = QUICK ? 7 : FULL ? 9 : 8, NMAX = ai >= 0 ? +args[ai + 1] : QUICK ? 9 : 11, SIGNED_N = QUICK ? 8 : FULL ? 10 : 9, PAIR_N = QUICK ? 7 : FULL ? 9 : 8, RULE_N = QUICK ? 8 : FULL ? 10 : 9;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + x : '')); if (!c) bad++; };
const t0 = Date.now(), secs = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
// rotation-distance diameters of the n-gon flip graph, n = 4..12 (Sleator-Tarjan-Thurston 1988; Pournin 2014: 2n-10 for n > 12)
const DIAM = { 4: 1, 5: 2, 6: 4, 7: 5, 8: 7, 9: 9, 10: 11, 11: 12, 12: 15 };
const summary = [];

// colourings of T in integer form (col0 = 0, col1 = 1), straight from the triangles: no signs involved
function colouringsOf(n, tris) {
  // order the triangles so each after the first adds exactly one new vertex (dual-tree order from the triangle on side 01)
  const order = [], used = new Uint8Array(tris.length), have = new Uint8Array(n); have[0] = have[1] = 1;
  while (order.length < tris.length) {
    for (let k = 0; k < tris.length; k++) { if (used[k]) continue; const t = tris[k], un = t.filter(v => !have[v]); if (un.length !== 1 || (order.length === 0 && !(t.includes(0) && t.includes(1)))) continue;
      const w = un[0], o = t.filter(v => v !== w); order.push([w, o[0], o[1]]); used[k] = 1; have[w] = 1; }
  }
  const out = [], col = new Int8Array(n); col[0] = 0; col[1] = 1;
  (function rec(i) {
    if (i === order.length) { out.push(Array.from(col)); return; }
    const [w, a, b] = order[i]; for (let x = 0; x < 4; x++) if (x !== col[a] && x !== col[b]) { col[w] = x; rec(i + 1); }
  })(0);
  return out;
}
const cid = col => { let k = 0; for (let i = col.length - 1; i >= 0; i--) k = k * 4 + col[i]; return k; };
// glued graph of T1 (inside) and T2 (outside): edges with multiplicity, triangular faces
function glued(n, T1, T2) {
  const E = [], faces = [];
  for (let i = 0; i < n; i++) E.push([i, (i + 1) % n]);
  const eid = new Map(); E.forEach(([a, b], k) => eid.set('s' + Math.min(a, b) + ',' + Math.max(a, b), k));
  const side = (T, tag) => { const m = new Map(); T.forEach(d => { const [a, b] = F.ends(n, d); m.set(a + ',' + b, E.length); E.push([a, b]); }); return (a, b) => { if (a > b) { const t = a; a = b; b = t; } return F.isSide(n, a, b) ? eid.get('s' + a + ',' + b) : m.get(a + ',' + b); }; };
  const e1 = side(T1), e2 = side(T2);
  F.triangles(n, T1).forEach(([a, b, c]) => faces.push([e1(a, b), e1(b, c), e1(a, c)]));
  F.triangles(n, T2).forEach(([a, b, c]) => faces.push([e2(a, b), e2(b, c), e2(a, c)]));
  return { E, faces };
}
// vertex 4-colourings of the glued graph (all 4^n labellings by backtracking, not up to symmetry)
function count4(n, E) {
  const nb = Array.from({ length: n }, () => []); E.forEach(([a, b]) => { nb[a].push(b); nb[b].push(a); });
  const col = new Int8Array(n).fill(-1); let cnt = 0;
  (function rec(v) { if (v === n) { cnt++; return; } for (let x = 0; x < 4; x++) { if (nb[v].some(u => u < v && col[u] === x)) continue; col[v] = x; rec(v + 1); } col[v] = -1; })(0);
  return cnt;
}
// Tait colourings: 3-colour the edges so every face sees all three colours
function countTait(G) {
  const m = G.E.length, inF = Array.from({ length: m }, () => []); G.faces.forEach((f, k) => f.forEach(e => inF[e].push(k)));
  const col = new Int8Array(m).fill(-1); let cnt = 0;
  (function rec(e) { if (e === m) { cnt++; return; } for (let x = 0; x < 3; x++) { if (inF[e].some(k => G.faces[k].some(o => o !== e && col[o] === x))) continue; col[e] = x; rec(e + 1); } col[e] = -1; })(0);
  return cnt;
}

for (let n = 4; n <= NMAX; n++) {
  console.log('n = ' + n + '  (' + secs() + ')');
  const EN = F.enumerate(n), N = EN.list.length, TR = EN.list.map(T => F.triangles(n, T));
  // ---- A
  ok('Catalan(' + (n - 2) + ') triangulations', N === F.CAT[n - 2], N);
  ok('flips are involutions in the flip graph', EN.nbr.every((L, i) => L.every(e => EN.nbr[e.j].some(b => b.j === i && b.code === e.f.nd))));
  { const dist = new Int32Array(N).fill(-1), Q = [0]; dist[0] = 0; for (let h = 0; h < Q.length; h++) for (const e of EN.nbr[Q[h]]) if (dist[e.j] < 0) { dist[e.j] = dist[Q[h]] + 1; Q.push(e.j); }
    ok('the unsigned flip graph is connected', Q.length === N);
    if (n <= 10) { let dm = 0; for (let s = 0; s < N; s++) { const d2 = new Int32Array(N).fill(-1), Q2 = [s]; d2[s] = 0; for (let h = 0; h < Q2.length; h++) for (const e of EN.nbr[Q2[h]]) if (d2[e.j] < 0) { d2[e.j] = d2[Q2[h]] + 1; Q2.push(e.j); } dm = Math.max(dm, d2[Q2[Q2.length - 1]]); }
      ok('rotation-distance diameter as known (STT 1988)', dm === DIAM[n], dm); } }
  // ---- B: colourings by brute force, signings by the model
  const COLS = TR.map(tr => colouringsOf(n, tr));
  ok('each T has 2^(n-2) proper colourings with col0=0, col1=1', COLS.every(L => L.length === 1 << (n - 2) && new Set(L.map(cid)).size === L.length), 1 << (n - 2));
  if (n <= RULE_N) {
    let rt = 0, inj = 0;
    EN.list.forEach((T, i) => {
      const seen = new Set();
      for (const s of F.allSignings(n, T)) { const c = F.colouringFromSigns(n, T, s), back = F.signsFromColouring(n, T, c);
        if (back && Object.keys(s).every(k => back[k] === s[k]) && F.properOn(n, T, c) && F.canon(c).every((x, v) => x === c[v])) rt++; seen.add(cid(c)); }
      if (seen.size === 1 << (n - 2)) inj++;
      for (const c of COLS[i]) { if (!F.properOn(n, T, c)) rt = -1e9; }
    });
    ok('signs -> colouring -> signs round trip, canonical and proper', rt === N << (n - 2), rt);
    ok('signings <-> colourings is a bijection on every T', inj === N);
    // ---- C: the flip rule, from both sides
    let lg = 0, agree = 0, flips = 0;
    EN.list.forEach((T, i) => {
      const M = F.edgeMat(n, T);
      for (const col of COLS[i]) {
        const s = F.signsFromColouring(n, T, col), st = F.state(n, T, s);
        for (const d of T) {
          const [b, e] = F.apexes(n, T, d, M), L = F.legal(st, d); flips++;
          if (L.ok === (col[b] !== col[e])) lg++;
          if (L.ok) { const nx = F.flip(st, d), want = F.signsFromColouring(n, nx.T, col); if (want && Object.keys(want).length === n - 2 && Object.keys(want).every(k => want[k] === nx.s[k]) && Object.keys(nx.s).length === n - 2) agree++; }
          else if (col[b] === col[e]) agree++;
        }
      }
    });
    ok('signed flip legal <=> the far corners differ in colour (' + flips + ' flips)', lg === flips);
    ok('a signed flip gives exactly the colouring\'s signs on the new triangulation', agree === flips);
  }
  // ---- D: components in colour space
  const bucket = new Map();
  COLS.forEach((L, i) => L.forEach(c => { const k = cid(c); let b = bucket.get(k); if (!b) bucket.set(k, b = { col: c, Ts: [] }); b.Ts.push(i); }));
  const comp = new Int32Array(N).fill(-1), pairs = new Uint16Array(N * N), commonCol = new Uint16Array(N * N);   // per pair: signings that work, common colourings
  let comps = 0, split = 0, maxComp = 0; const compList = [], compOf = new Map();   // 'colouring|T' -> component
  for (const b of bucket.values()) {
    const inB = new Set(b.Ts); let here = 0;
    for (const t of b.Ts) comp[t] = -1;
    for (const s of b.Ts) {
      if (comp[s] >= 0) continue;
      const Q = [s]; comp[s] = comps;
      for (let h = 0; h < Q.length; h++) for (const e of EN.nbr[Q[h]]) if (inB.has(e.j) && comp[e.j] < 0) { comp[e.j] = comps; Q.push(e.j); }
      for (const x of Q) for (const y of Q) pairs[x * N + y]++;
      for (const x of Q) compOf.set(cid(b.col) + '|' + x, comps);
      compList.push({ col: b.col, Ts: Q }); comps++; here++; maxComp = Math.max(maxComp, Q.length);
    }
    for (const x of b.Ts) for (const y of b.Ts) commonCol[x * N + y]++;
    if (here > 1) split++;
  }
  let nPairs = 0, nCommon = 0, disagree = 0, minWork = 1e9, minCommon = 1e9, odd = 0, notAll = 0;
  for (let k = 0; k < N * N; k++) { nPairs += pairs[k] > 0; nCommon += commonCol[k] > 0; if ((pairs[k] > 0) !== (commonCol[k] > 0)) disagree++; minWork = Math.min(minWork, pairs[k]); minCommon = Math.min(minCommon, commonCol[k]); if (pairs[k] % 2) odd++; if (pairs[k] < commonCol[k]) notAll++; }
  ok('every pair has a common 4-colouring (4CT on the glued sphere)', nCommon === N * N, nCommon + ' / ' + N * N);
  ok('every pair is signed-flip solvable for some signs (Eliahou-Kryuchkov)', nPairs === N * N, nPairs + ' / ' + N * N);
  ok('solvable <=> common colouring, pair by pair', disagree === 0);
  ok('signings that work come in +/- pairs (negating every sign is a symmetry)', odd === 0);
  console.log('       per pair: at least ' + minCommon + ' common colourings (mod affine) and at least ' + minWork + ' signings that work; ' + notAll + ' pairs have a common colouring whose signs cannot reach');
  // within ONE colouring the flip graph need not be connected: then that colouring's signs reach only part of its class
  console.log('       ' + bucket.size + ' colourings, ' + comps + ' signed components (largest ' + maxComp + '), ' + split + ' colourings split into more than one component');
  summary.push({ n, N, pairs: N * N, colourings: bucket.size, comps, split, maxComp, minWork, notAll });
  if (n <= SIGNED_N) {
    // the same components from the model's own sign-based BFS, starting from every signing of every triangulation
    const seenT = new Set(); let same = 0, total = 0;
    const p2 = new Uint8Array(N * N);
    EN.list.forEach((T, i) => { for (const s of F.allSignings(n, T)) {
      const k0 = F.stKey(F.state(n, T, s)); if (seenT.has(k0)) continue;
      const B = F.bfs(F.state(n, T, s)), mem = []; for (const [k, e] of B.seen) { seenT.add(k); mem.push(EN.index.get(F.key(e.st.T))); }
      const c0 = cid(F.colouringFromSigns(n, T, s)), cs = new Set(mem.map(x => compOf.get(c0 + '|' + x)));
      total++; if (cs.size === 1 && compList[[...cs][0]].Ts.length === mem.length) same++;
      for (const x of mem) for (const y of mem) p2[x * N + y] = 1; } });
    let d2 = 0; for (let k = 0; k < N * N; k++) if (p2[k] !== (pairs[k] > 0 ? 1 : 0)) d2++;
    ok('sign-based BFS components = colour-space components', same === total && total === comps && d2 === 0, total + ' components');
  }
  // ---- H: does the sign rule force detours? min over every signing of the signed distance vs the unsigned distance
  if (n <= DET_N) {
    const U = new Int32Array(N * N).fill(-1);
    for (let s0 = 0; s0 < N; s0++) { const Q = [s0]; U[s0 * N + s0] = 0; for (let h = 0; h < Q.length; h++) for (const e of EN.nbr[Q[h]]) if (U[s0 * N + e.j] < 0) { U[s0 * N + e.j] = U[s0 * N + Q[h]] + 1; Q.push(e.j); } }
    const S = new Int32Array(N * N).fill(1e9);
    for (const C of compList) { const inC = new Set(C.Ts); for (const s0 of C.Ts) { const d = new Map([[s0, 0]]), Q = [s0];
      for (let h = 0; h < Q.length; h++) for (const e of EN.nbr[Q[h]]) if (inC.has(e.j) && !d.has(e.j)) { d.set(e.j, d.get(Q[h]) + 1); Q.push(e.j); }
      for (const [t, dd] of d) S[s0 * N + t] = Math.min(S[s0 * N + t], dd); } }
    let forced = 0, maxDet = 0, never = 0; for (let k = 0; k < N * N; k++) { const det = S[k] - U[k]; if (det < 0) never++; if (det > 0) forced++; maxDet = Math.max(maxDet, det); }
    ok('no signed path is shorter than the unsigned distance', never === 0);
    console.log('       best signs: ' + forced + ' of ' + N * N + ' pairs still need a detour (largest ' + maxDet + ' extra flips)');
    summary[summary.length - 1].forced = forced; summary[summary.length - 1].maxDet = maxDet;
  }
  // ---- E: independent per-pair checks
  if (n <= PAIR_N) {
    let has4 = 0, tait = 0, both = 0, maxCol = 0; var TAIT = new Int32Array(N * N);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const G = glued(n, EN.list[i], EN.list[j]), c4 = count4(n, G.E), ct = countTait(G); TAIT[i * N + j] = ct;
      if (c4 > 0) has4++; if (ct * 4 === c4) tait++; if ((c4 > 0) === !!pairs[i * N + j] && c4 === 12 * commonCol[i * N + j]) both++;
      // the model's colour classes: c4 / 24 colourings up to all 24 renamings = common colourings up to affine / 2
      maxCol = Math.max(maxCol, c4);
    }
    ok('backtracking: every glued pair is 4-colourable', has4 === N * N, has4 + ' / ' + N * N);
    ok('Tait: #3-edge-colourings x 4 = #vertex 4-colourings, every pair', tait === N * N);
    ok('signed-solvable <=> 4-colourable, and #4-colourings = 12 x common colourings mod affine (independent code)', both === N * N);
  }
  // ---- K: Kauffman's two bracketings
  if (n <= KAU_N) {
    const m = n - 1, NA = Math.pow(3, m), vals = EN.list.map(T => { const M = F.edgeMat(n, T), v = new Int8Array(NA), x = new Array(m);
      for (let k = 0; k < NA; k++) { let r = k; for (let q = 0; q < m; q++) { x[q] = r % 3 + 1; r = (r - r % 3) / 3; } v[k] = F.kauffman(n, T, x, M); } return v; });
    let solv = 0, signOk = 0, cnt = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a = vals[i], b = vals[j]; let eq = 0, axisOnly = 0;
      for (let k = 0; k < NA; k++) { if (!a[k] || !b[k]) continue; if (a[k] === b[k]) eq++; else if (a[k] === -b[k]) axisOnly++; }
      if (eq > 0) solv++; if (!axisOnly) signOk++;
      if (TAIT && n <= PAIR_N && eq === TAIT[i * N + j]) cnt++;
    }
    ok('Kauffman: every pair of bracketings has an assignment with equal non-zero products', solv === N * N, solv + ' / ' + N * N + ' pairs, ' + NA + ' assignments each');
    ok('Kauffman: same axis => same sign, every pair and assignment', signOk === N * N);
    if (n <= PAIR_N) ok('Kauffman assignments = Tait colourings of the glued map, pair by pair', cnt === N * N);
  }
  // ---- F: solver optimality and replay on random signed starts
  {
    const R = F.rng(1000 + n); let good = 0, tries = n <= 10 ? 30 : 10;
    for (let k = 0; k < tries; k++) {
      const i = R.int(N), cs = COLS[i], col = cs[R.int(cs.length)], st = F.state(n, EN.list[i], F.signsFromColouring(n, EN.list[i], col));
      const c = compList[compOf.get(cid(col) + '|' + i)];
      const j = c.Ts[R.int(c.Ts.length)];
      // colour-space BFS distance i -> j within the component
      const inC = new Set(c.Ts), dist = new Map([[i, 0]]), Q = [i];
      for (let h = 0; h < Q.length; h++) for (const e of EN.nbr[Q[h]]) if (inC.has(e.j) && !dist.has(e.j)) { dist.set(e.j, dist.get(Q[h]) + 1); Q.push(e.j); }
      const p = F.solve(st, EN.list[j]); let cur = st; for (const d of p || []) cur = cur && F.flip(cur, d);
      if (p && p.length === dist.get(j) && cur && F.same(cur.T, EN.list[j])) good++;
    }
    ok('solver: optimal signed paths that replay to the target', good === tries, good + ' / ' + tries);
  }
}
// ---- G: the levels the page plays
{
  console.log('levels  (' + secs() + ')');
  const L = F.LEVELS; let good = 0;
  L.forEach((spec, k) => {
    const P = F.generate(spec.n, spec.seed, spec);
    let okk = !!P && P.n === spec.n;
    if (okk && !P.free) { const p = F.solve(F.state(P.n, P.T, P.s), P.target); okk = p && p.length === P.par && P.par > 0 && F.rotationDistance(P.n, P.T, P.target) === P.rot; }
    if (okk && P.free) { const S = F.solveFree(P.n, P.T, P.target); okk = S.best.path.length === P.par && S.good === P.good && S.good > 0 && P.rot === F.rotationDistance(P.n, P.T, P.target); }
    if (okk) good++;
    console.log('   ' + String(k + 1).padStart(2) + '  n=' + String(P.n).padStart(2) + '  par ' + String(P.par).padStart(2) + '  unsigned ' + String(P.rot).padStart(2) + '  detour ' + P.detour + (P.free ? '  free: ' + P.good + '/' + P.total + ' signings work' : '') + '  ' + (spec.name || ''));
  });
  ok('every level: par = optimal signed solution, unsigned distance as stated', good === L.length, good + ' / ' + L.length);
  ok('levels never get shorter within a size', L.every((s, k) => !k || L[k - 1].n !== s.n || L[k - 1].free !== s.free || F.generate(s.n, s.seed, s).par >= F.generate(L[k - 1].n, L[k - 1].seed, L[k - 1]).par));
}
console.log('\n  n   triangulations   pairs        colourings  signed comps  split colourings  largest comp  min signings  pairs w/ dead colouring  forced detours (max)');
summary.forEach(s => console.log('  ' + String(s.n).padStart(2) + String(s.N).padStart(16) + String(s.pairs).padStart(12) + String(s.colourings).padStart(14) + String(s.comps).padStart(14) + String(s.split).padStart(18) + String(s.maxComp).padStart(14) + String(s.minWork).padStart(14) + String(s.notAll).padStart(24) + (s.forced != null ? String(s.forced).padStart(12) + ' (' + s.maxDet + ')' : '')));
console.log((bad ? bad + ' problem(s)' : 'flip OK') + '  (' + secs() + ')');
process.exit(bad ? 1 : 0);
