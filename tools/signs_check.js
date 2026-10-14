// The Signs skin's maths (lab/signs-model.js), on every level:   node tools/signs_check.js
//   A. the cut: the ring is a Hamiltonian cycle through every region, the hole at place 0; each side's diagonals are
//      non-crossing and with the ring triangulate the n-gon (n - 2 triangles a side); ring + both sides = the map's
//      borders exactly, each once; the faces are the map's corners; the drawing keeps the level's orientation
//      (inside faces read clockwise in ring order, outside faces counterclockwise).
//   B. signs <-> colouring: on every reachable state, the signs with ring places 1 and 2 coloured give back the colouring.
//   C. THE THEOREM: on every reachable state, every chain's swap flips the sign of exactly the signed faces touching it.
//   D. Eliahou's sign is the Gears die's corner sign (degree.js) times one constant, and the tally of signs is 4N - eps.
// States: BFS over colourings up to renaming (a renaming multiplies every sign by its parity and maps chains to chains,
// so one representative per class checks the class); levels with n <= 22 are also walked with labels.
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..');
const ctx = { window: {}, console, Math }; ctx.window.window = ctx.window; vm.createContext(ctx);
for (const f of ['levels.js', 'degree.js', 'lab/signs-model.js']) vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
const G = ctx.window.GAME, S = ctx.window.FTH_SIGNS, DG = ctx.window.FTH_DEGREE;
let bad = 0; const fail = m => { bad++; if (bad < 30) console.log('  FAIL ' + m); };
const canon = (c, hole) => { const mp = {}; let k = 0; return c.map((x, u) => u === hole ? -1 : (x in mp ? mp[x] : (mp[x] = k++))); };
const T = { levels: 0, states: 0, labelled: 0, swaps: 0, flips: 0, maxFrac: 0 };
let degC = 0;
const done = new Map();       // graph -> set of canonical keys already walked
console.log('  level              n   ham  H   in/out tris  states   swaps checked');
for (const L of G.levels) {
  const Gr = G.graphs[L.g], n = Gr.n, tri = Gr.edges.length === 3 * n - 6;
  const C = S.cut(Gr);
  if (!tri) { if (C.tri) fail(L.id + ': a pond took a triangle cut'); continue; }
  T.levels++;
  // ---- A. the cut
  const ok = (m, c) => { if (!c) fail(L.id + ': ' + m); };
  ok('cut found and Hamiltonian', C.ok && C.ham && C.tri && C.ring.length === n && new Set(C.ring).size === n && C.ring[0] === Gr.hole);
  const E = new Set(Gr.edges.map(([a, b]) => Math.min(a, b) * n + Math.max(a, b))), ek = (a, b) => Math.min(a, b) * n + Math.max(a, b);
  for (let i = 0; i < n; i++) ok('ring side ' + i + ' is a border', E.has(ek(C.ring[i], C.ring[(i + 1) % n])));
  const used = new Map(); for (let i = 0; i < n; i++) used.set(ek(C.ring[i], C.ring[(i + 1) % n]), (used.get(ek(C.ring[i], C.ring[(i + 1) % n])) || 0) + 1);
  for (const side of ['in', 'out']) {
    const ch = C.chords[side], fs_ = C.faces.filter(f => f.side === side);
    ok(side + ': n - 3 diagonals, n - 2 triangles', ch.length === n - 3 && fs_.length === n - 2);
    for (let a = 0; a < ch.length; a++) for (let b = a + 1; b < ch.length; b++) { const [p, q] = ch[a], [r, s] = ch[b]; if ((p < r && r < q && q < s) || (r < p && p < s && s < q)) ok(side + ': diagonals cross', false); }
    ch.forEach(([i, j]) => { const k = ek(C.ring[i], C.ring[j]); used.set(k, (used.get(k) || 0) + 1); });
    const isSide = (i, j) => j === i + 1 || (i === 0 && j === n - 1), chs = new Set(ch.map(([i, j]) => i * n + j));
    fs_.forEach(f => { const [a, b, c] = f.r; for (const [i, j] of [[a, b], [b, c], [a, c]]) if (!isSide(i, j) && !chs.has(i * n + j)) ok(side + ': face edge not a diagonal of its side', false);
      const p = f.v.map(v => C.at[v]), k = p.indexOf(a), cw = p[(k + 1) % 3] === b;   // ccw-stored vertices read a b c in ring order?
      ok(side + ': orientation', side === 'out' ? cw : !cw); });
  }
  ok('ring + sides = the borders, each once', used.size === E.size && [...used].every(([k, c]) => E.has(k) && c === 1));
  const Fm = S.facesOf(Gr), fk = f => f.slice().sort((x, y) => x - y).join();
  ok('faces = the map corners', C.faces.length === 2 * n - 4 && new Set(C.faces.map(f => fk(f.v))).size === 2 * n - 4 && Fm.every(f => C.faces.some(g => fk(g.v) === fk(f))));
  // ---- B, C, D on every reachable state
  const seen = done.get(L.g) || new Set(); done.set(L.g, seen);
  const start = L.start.slice(); start[Gr.hole] = -1;
  const walk = (labelled) => {
    const key = c => (labelled ? c : canon(c, Gr.hole)).join(), mine = new Set(), q = [start]; let states = 0, swaps = 0;
    if (!labelled && seen.has(key(start))) return [0, 0];
    mine.add(key(start)); if (!labelled) seen.add(key(start));
    while (q.length) {
      const c = q.pop(); states++;
      const s = S.signs(C, c);
      const back = S.colouring(C, s, c[C.ring[1]], c[C.ring[2]]);
      if (!back || back.some((x, u) => u !== Gr.hole && x !== c[u])) fail(L.id + ': signs do not give back the colouring');
      if (!labelled) {
        const cnt = DG.counts(Gr, c); let tally = 0;
        C.faces.forEach((f, i) => { if (f.open) return; const cw = f.v.slice().reverse(); tally += s[i];
          const a = c[cw[0]], b = c[cw[1]], d = c[cw[2]], P = [a, b, d, 6 - a - b - d]; let par = 1; for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) if (P[x] > P[y]) par = -par;
          const r = par * s[i]; if (!degC) degC = r; else if (r !== degC) fail(L.id + ': Eliahou sign / die sign ratio not constant'); });
        if (cnt && tally * degC !== 4 * cnt.N - cnt.eps) fail(L.id + ': tally ' + tally * degC + ' != 4N - eps = ' + (4 * cnt.N - cnt.eps));
      }
      for (const K of S.chains(Gr, c)) {
        const d = S.swap(c, K), s2 = S.signs(C, d), want = new Set(S.touching(C, K.set));
        swaps++;
        for (let i = 0; i < s.length; i++) if ((s[i] !== s2[i]) !== want.has(i) || (want.has(i) && s2[i] !== -s[i])) { fail(L.id + ': swap {' + K.pair + '} of ' + K.vs.length + ' flips face ' + i + ' wrongly'); break; }
        if (!labelled) { T.flips += want.size; const signed = s.filter(x => x).length; if (want.size < signed && want.size / signed > T.maxFrac) T.maxFrac = want.size / signed; }
        const k = key(d); if (!mine.has(k) && !(!labelled && seen.has(k))) { mine.add(k); if (!labelled) seen.add(k); q.push(d); }
      }
    }
    return [states, swaps];
  };
  const [st, sw] = walk(false); T.states += st; T.swaps += sw;
  if (n <= 22) { const [ls, lw] = walk(true); T.labelled += ls; T.swaps += lw; }
  console.log('  ' + L.id.padEnd(18) + String(n).padStart(3) + '  ' + (C.ham ? 'yes' : 'no ') + String(C.H).padStart(3) + '   ' + (C.chords.in.length + '/' + C.chords.out.length).padEnd(6) + String(C.faces.length).padStart(4) + String(st).padStart(8) + String(sw).padStart(9));
}
console.log('  ' + T.levels + ' triangulated levels, every cut Hamiltonian; ' + T.states + ' states up to renaming (+' + T.labelled + ' labelled), ' + T.swaps + ' swaps, ' + T.flips + ' sign flips checked');
console.log('  Eliahou sign = ' + (degC > 0 ? '' : '-') + 'die sign (degree.js); tally of signs = ' + (degC > 0 ? '' : '-') + '(4N - eps); biggest non-web flip ' + Math.round(T.maxFrac * 100) + '% of the signed triangles');
console.log(bad ? bad + ' FAILED' : 'signs OK');
process.exit(bad ? 1 : 0);
