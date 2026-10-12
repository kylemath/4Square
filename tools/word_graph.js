// Rim Word: label every state of a level's swap graph with a five-letter string, so that
//   - every Kempe swap changes exactly one letter (one tile flips),
//   - every fillable state (rim down to 3 elements) is a common English word,
//   - every other state is a word-like non-word,
//   - no state two or more swaps from a fill is one letter away from any common word (no false scent).
// The graph is the level's canonical states (colourings up to renaming the elements) within a move budget of `par`
// swaps from the start, won states terminal. Writes lab/rimword-data.js (window.RIMWORD).
//
//   node tools/word_graph.js [--words DIR] [--only id,id] [--seed N]
//
// DIR holds the word lists (fetched once if missing):
//   common.txt  Wordle answer list (2315 everyday five-letter words): the fills
//   big.txt     dwyl/english-words words_alpha + the Wordle guess list: anything in here is never a non-word
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const WD = arg('--words') || path.join(require('os').tmpdir(), 'rimword-words');
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const SEED0 = +(arg('--seed') || 1);
const EXTRA = +(arg('--extra') || 0);   // label par + EXTRA swaps around the start, falling back to par

// ---------------------------------------------------------------- word lists
const SRC = {
  'common.txt': ['https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt'],
  'big.txt': ['https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt',
    'https://raw.githubusercontent.com/tabatkins/wordle-list/main/words'],
};
fs.mkdirSync(WD, { recursive: true });
for (const [f, urls] of Object.entries(SRC)) {
  const p = path.join(WD, f); if (fs.existsSync(p)) continue;
  const all = urls.map(u => cp.execFileSync('curl', ['-sSL', u], { maxBuffer: 1 << 26 }).toString()).join('\n');
  fs.writeFileSync(p, all.split(/\s+/).map(w => w.trim().toLowerCase()).filter(w => /^[a-z]{5}$/.test(w)).join('\n'));
}
const read = f => fs.readFileSync(path.join(WD, f), 'utf8').split(/\s+/).filter(w => /^[a-z]{5}$/.test(w));
const BLOCK = new Set(['pubic', 'booby', 'boozy', 'kinky', 'tipsy', 'drunk', 'slurp']);   // fine words, not for a kids' puzzle
const COMMON = read('common.txt').filter(w => !BLOCK.has(w)), BIG = new Set([...read('big.txt'), ...COMMON]), ISCOMMON = new Set(COMMON);
const AZ = 'abcdefghijklmnopqrstuvwxyz', VOW = /[aeiouy]/;
const wild = new Map();   // "cr_ne" -> common words that fit
for (const w of COMMON) for (let i = 0; i < 5; i++) { const k = w.slice(0, i) + '_' + w.slice(i + 1); (wild.get(k) || wild.set(k, []).get(k)).push(w); }
const NEAR = new Map(), TWO = new Map();
const near = s => { if (NEAR.has(s)) return NEAR.get(s); const out = []; for (let i = 0; i < 5; i++) for (const w of wild.get(s.slice(0, i) + '_' + s.slice(i + 1)) || []) if (w !== s) out.push(w); NEAR.set(s, out); return out; };
// word-like: every positional bigram occurs in at least 3 dictionary words
const BG = new Map(); for (const w of BIG) for (let i = 0; i < 4; i++) { const k = i + w[i] + w[i + 1]; BG.set(k, (BG.get(k) || 0) + 1); }
const wordlike = s => { const v = (s.match(/[aeiou]/g) || []).length; return VOW.test(s) && v <= 3 && /[^aeiouy]/.test(s) && !/(.).*\1.*\1/.test(s) && [0, 1, 2, 3].every(i => (BG.get(i + s[i] + s[i + 1]) || 0) >= 3); };
const ham = (a, b) => { let d = 0; for (let i = 0; i < 5; i++) if (a[i] !== b[i]) d++; return d; };

// ---------------------------------------------------------------- the swap graph of a level
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'levels.js'), 'utf8'), ctx);
const GAME = ctx.window.GAME;
function stateGraph(L, R) {
  const Gr = GAME.graphs[L.g], n = Gr.n, hole = Gr.hole, rim = Gr.link, NC = Gr.ncol || 4, goal = Gr.goal || 3;
  const adj = Array.from({ length: n }, () => []); Gr.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const canon = c => { const mp = {}; let k = 0; return c.map((x, u) => u === hole ? -1 : (x in mp ? mp[x] : (mp[x] = k++))); };
  const chains = col => {
    const out = [];
    for (let a = 0; a < NC; a++) for (let b = a + 1; b < NC; b++) {
      const seen = new Set(), mine = [];
      for (let s = 0; s < n; s++) {
        if (s === hole || seen.has(s) || (col[s] !== a && col[s] !== b)) continue;
        const set = [s]; seen.add(s);
        for (let i = 0; i < set.length; i++) for (const w of adj[set[i]]) if (w !== hole && !seen.has(w) && (col[w] === a || col[w] === b)) { seen.add(w); set.push(w); }
        mine.push({ a, b, set });
      }
      if (mine.length > 1) out.push(...mine);   // a lone chain of a pair is a web: swapping it renames, nothing more
    }
    return out;
  };
  const won = c => new Set(rim.map(x => c[x])).size <= goal;
  const s0 = canon(L.start.map((x, u) => u === hole ? -1 : x)), key = c => c.join(',');
  const id = new Map([[key(s0), 0]]), cols = [s0], dist = [0], E = new Map();
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i]; if (won(c) || dist[i] >= R) continue;
    for (const ch of chains(c)) {
      const d = c.slice(); ch.set.forEach(u => { d[u] = d[u] === ch.a ? ch.b : ch.a; });
      const cd = canon(d), k = key(cd);
      if (!id.has(k)) { id.set(k, cols.length); cols.push(cd); dist.push(dist[i] + 1); }
      const j = id.get(k); if (j !== i) E.set(Math.min(i, j) + '-' + Math.max(i, j), [Math.min(i, j), Math.max(i, j)]);
    }
  }
  const N = cols.length, W = cols.map(won), nb = Array.from({ length: N }, () => []);
  for (const [a, b] of E.values()) { nb[a].push(b); nb[b].push(a); }
  // swaps to the nearest fill, moving only through unfilled states (fills are terminal)
  const toFill = new Array(N).fill(Infinity), q = [];
  W.forEach((w, i) => { if (w) { toFill[i] = 0; q.push(i); } });
  for (let h = 0; h < q.length; h++) for (const j of nb[q[h]]) if (!W[j] && toFill[j] === Infinity) { toFill[j] = toFill[q[h]] + 1; q.push(j); }
  return { N, cols: cols.map(c => c.map(x => x < 0 ? '.' : x).join('')), dist, won: W, nb, edges: [...E.values()], toFill };
}

// ---------------------------------------------------------------- the labelling search
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
function label(S, seed, avoid, budget = 15000) {
  const R = rng(seed), N = S.N, str = new Array(N).fill(null), used = new Set(); let steps = 0;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const assigned = t => S.nb[t].filter(x => str[x] !== null).map(x => str[x]);
  const okNon = (t, s) => !BIG.has(s) && wordlike(s) && (S.toFill[t] === 1 ? near(s).length > 0 : near(s).length === 0);
  const okWord = s => ISCOMMON.has(s) && !avoid.has(s);
  function cands(t) {
    const A = assigned(t); let C = [];
    if (S.won[t]) C = A.length ? near(A[0]) : shuffle(COMMON.slice()).slice(0, 200);
    else if (!A.length) {   // the start: random word-like strings, or (one swap from a fill) a common word with one letter changed
      for (let k = 0; k < 4000 && C.length < 60; k++) {
        let s = Array.from({ length: 5 }, () => AZ[Math.floor(R() * 26)]).join('');
        if (S.toFill[t] === 1) { const w = COMMON[Math.floor(R() * COMMON.length)], i = Math.floor(R() * 5); s = w.slice(0, i) + AZ[Math.floor(R() * 26)] + w.slice(i + 1); }
        if (okNon(t, s)) C.push(s);
      } }
    else { const a = A[0]; for (let i = 0; i < 5; i++) for (const c of AZ) if (c !== a[i]) C.push(a.slice(0, i) + c + a.slice(i + 1)); }
    C = C.filter(s => !used.has(s) && A.every(a => ham(a, s) === 1) && (S.won[t] ? okWord(s) : okNon(t, s)));
    // spread flips over the five tiles: prefer a position this state's assigned neighbours used least
    const posUse = new Array(5).fill(0); for (const x of S.nb[t]) if (str[x] !== null) for (const y of S.nb[t]) if (y !== x && str[y] !== null && ham(str[x], str[y]) === 1) for (let i = 0; i < 5; i++) if (str[x][i] !== str[y][i]) posUse[i]++;
    const flipPos = s => { const a = A[0]; if (!a) return 0; for (let i = 0; i < 5; i++) if (a[i] !== s[i]) return i; return 0; };
    // look ahead: a state one swap from k fills needs k words one flip away (several of them often in one slot, when
    // a neighbour is one swap from the same fills); a state two swaps away needs words two flips away
    const slotMax = s => { let m = 0; for (let i = 0; i < 5; i++) m = Math.max(m, (wild.get(s.slice(0, i) + '_' + s.slice(i + 1)) || []).length); return m; };
    const two = s => { if (TWO.has(s)) return TWO.get(s); let k = 0; for (let i = 0; i < 5; i++) for (const c of AZ) if (c !== s[i]) k += Math.min(near(s.slice(0, i) + c + s.slice(i + 1)).length, 4); TWO.set(s, k); return k; };
    const score = s => S.won[t] ? R() : -posUse[flipPos(s)] * 2 + R() * 3 +
      (S.toFill[t] === 1 ? Math.min(near(s).length, 10) + slotMax(s) * 2 : S.toFill[t] === 2 ? Math.min(two(s), 60) / 6 : 0);
    return C.map(s => [score(s), s]).sort((p, q) => q[0] - p[0]).map(p => p[1]);
  }
  // the next state to label: most labelled neighbours first, fills before non-fills
  // start from the most constrained fill (the one most states are a flip away from), then grow outward
  const hub = (() => { let b = -1, bd = -1; for (let t = 0; t < N; t++) if (S.won[t] && S.nb[t].length + R() > bd) { bd = S.nb[t].length + R(); b = t; } return b; })();
  function pick() { if (str.every(x => x === null)) return hub >= 0 ? hub : 0; let best = -1, bs = -Infinity; for (let t = 0; t < N; t++) if (str[t] === null) { const a = assigned(t).length; if (!a && best >= 0) continue; const sc = a * 10 + (S.won[t] ? 5 : 0) - S.dist[t] * 0.01; if (sc > bs) { bs = sc; best = t; } } return best; }
  // forward check: each unlabelled neighbour still has a candidate; a state one swap from k fills needs k words
  function ok(t) {
    for (const u of S.nb[t]) if (str[u] === null) {
      const A = assigned(u);
      if (S.won[u]) { if (!near(A[0]).some(w => !used.has(w) && A.every(b => ham(b, w) === 1) && okWord(w))) return false; }
      else if (A.length >= 2) { const a = A[0]; let any = false; for (let i = 0; i < 5 && !any; i++) for (const c of AZ) { const s = a.slice(0, i) + c + a.slice(i + 1); if (c !== a[i] && !used.has(s) && A.every(b => ham(b, s) === 1) && okNon(u, s)) { any = true; break; } } if (!any) return false; }
    }
    if (!S.won[t] && S.toFill[t] === 1) { const need = S.nb[t].filter(x => S.won[x] && str[x] === null).length; if (near(str[t]).filter(w => !used.has(w) && okWord(w)).length < need) return false; }
    return true;
  }
  let deepest = 0, stuck = null;
  function rec(left) {
    if (!left) return true; if (++steps > budget) return false;
    const t = pick(); if (N - left > deepest) { deepest = N - left; stuck = t; }
    for (const s of cands(t).slice(0, S.won[t] ? 30 : 40)) {
      str[t] = s; used.add(s);
      if (ok(t) && rec(left - 1)) return true;
      str[t] = null; used.delete(s); if (steps > budget) return false;
    }
    return false;
  }
  const r = rec(N) ? str : null; if (!r && process.env.DEBUG && seed % 50 === 1) console.log('  seed', seed, 'got to', deepest, '/', N, 'stuck at state', stuck, 'won', S.won[stuck], 'toFill', S.toFill[stuck], 'nbrs', S.nb[stuck].map(x => x + (S.won[x] ? 'W' : '') + ':' + (str[x] || '-')).join(' '));
  return r;
}

// ---------------------------------------------------------------- build every level
// with --only, the other levels keep their labels from the existing file
const OUT = path.join(ROOT, 'lab', 'rimword-data.js');
const out = {}, avoid = new Set();
if (ONLY && fs.existsSync(OUT)) { const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(OUT, 'utf8'), c); Object.assign(out, c.window.RIMWORD || {}); }
for (const [id, d] of Object.entries(out)) if (ONLY && !ONLY.includes(id)) d.w.forEach((s, i) => { if (d.won[i]) avoid.add(s); });
for (const L of GAME.levels) {
  const Gr = GAME.graphs[L.g]; if ((Gr.ncol || 4) < 4 || (ONLY && !ONLY.includes(L.id))) continue;
  let S = null, str = null, seed = SEED0;
  for (const R of EXTRA ? [L.par + EXTRA, L.par] : [L.par]) {
    S = stateGraph(L, R); S.R = R; str = null; seed = SEED0;
    const t0 = Date.now();
    for (; seed < SEED0 + 400 && !str && Date.now() - t0 < (+process.env.SECS || 90) * 1000; seed++) str = label(S, seed * 7919 + L.id.length, avoid);
    if (str) break;
  }
  if (!str) { console.log(L.id.padEnd(16), 'no labelling found'); continue; }
  str.forEach((s, i) => { if (S.won[i]) avoid.add(s); });   // a fresh set of words per level
  // checks (the rules above, independently of the search)
  const bad = [];
  if (new Set(str).size !== S.N) bad.push('labels not distinct');
  for (const [a, b] of S.edges) if (ham(str[a], str[b]) !== 1) bad.push('edge ' + a + '-' + b + ' is not one flip');
  str.forEach((s, i) => {
    if (S.won[i] && !ISCOMMON.has(s)) bad.push(s + ' fill is not a common word');
    if (!S.won[i] && BIG.has(s)) bad.push(s + ' non-fill is a word');
    if (!S.won[i] && S.toFill[i] >= 2 && near(s).length) bad.push(s + ' is one flip from a word but ' + S.toFill[i] + ' swaps from a fill');
  });
  if (bad.length) { console.log(L.id, 'FAILED', bad.slice(0, 5)); process.exitCode = 1; continue; }
  out[L.id] = { par: L.par, R: S.R, start: 0, w: str, won: S.won.map(x => x ? 1 : 0), d: S.dist, toFill: S.toFill.map(x => x === Infinity ? -1 : x), col: S.cols, e: S.edges };
  console.log(L.id.padEnd(16), 'par', L.par, 'R', S.R, 'states', String(S.N).padStart(3), 'fills', String(S.won.filter(Boolean).length).padStart(2), 'start', str[0], '->', str.filter((s, i) => S.won[i]).join(' '));
}
const order = GAME.levels.map(l => l.id).filter(id => out[id]), sorted = {}; order.forEach(id => { sorted[id] = out[id]; });
const js = '// Generated by tools/word_graph.js from levels.js. Do not edit.\n// Rim Word: per level, the swap graph within R swaps of the start (states at distance R have uncharted swaps); w = the word on the tiles, won = fill, d = swaps from the start,\n// toFill = swaps to the nearest fill (-1: none within the budget), col = canonical colouring (hole "."), e = swaps.\nwindow.RIMWORD = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(OUT, js);
console.log('wrote lab/rimword-data.js', (js.length / 1024).toFixed(1) + ' KB');
