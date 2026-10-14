/* lab/star-rules.js: the Star skin's model (window.FTH_STAR): a colouring seen as a star, its moves as branches to child
 * stars, the whole state tree of a level, and the heuristic-rule language with its evaluator. Pure: no DOM. Runs in the
 * browser after ../rim.js and ../degree.js, and in node through vm (tools/star_rules_check.js). Design: lab/STAR-DESIGN.md.
 *
 * A STAR is one colouring, up to renaming the elements (the game's canon key), read through rim.js's research frame:
 *   rim (5 elements, rim order), filled, t (the trouble spot: the star edge t..t+2, or -1), lock (0-2: Kempe's two rim
 *   chains blocked), pi (the forced swap's target key at a double lock), deg (Fisk's degree N x eps, degree.js; label-free),
 *   N (chains, webs included), nm (moves).
 * A MOVE is a Kempe swap of a non-web chain, merged by the star it leads to (a pair's two chains give the same star up to
 * renaming); the label is the merged move's gentlest chain (fewest rim tiles, then smallest): pair (labelled [a, b] and as
 * frame roles 'βγ'...), size, hits (rim places it touches), quiet (touches none), pi (it is the π move), fills.
 *
 *   FTH_STAR.prep(Gr) -> G                    the rim graph of a levels.js graph (cached)
 *   FTH_STAR.feat(G, col) -> star             FTH_STAR.moves(G, col) -> [move] (with .col, .key)
 *   FTH_STAR.graph(GAME, L, cache) -> LG      the level's Kempe class: LG.S[i] = { key, col, f, mv: [move with .to], dF },
 *                                             LG.start, LG.par (= dF of the start), LG.idx (key -> i)
 *   FTH_STAR.run(rule, LG, i, opt) -> walk    follow a rule from state i: { solved, steps, dF, path, revisit, stuck, why }
 *   FTH_STAR.score(rule, LGs, scope) -> sc    scope 'start' (every level's start) | 'class' (every hard star, dF >= 2, of
 *                                             every distinct class): { n, solved, rate, excess, loops, stuck, fails, ms }
 *   FTH_STAR.BUILTIN, CONDS, PICKS, label(card), valid(rule)
 *
 * RULE LANGUAGE. rule = { name, cards: [{ when: [{ f, op, v }], pick, arg }] }. At each step every card whose `when` holds
 * (all its tests; none = always) narrows the moves to those that score best on its `pick`, in card order; the first move
 * left after the deterministic tie-break (smaller chain, then smaller star key) is taken. A walk ends at a filled star
 * (solved), after CAP steps, or as soon as it is provably stuck in a loop (same star and context with no new star seen).
 *   state tests f: lock star deg N nm run (π swaps in a row) seen (this star was on the path before: 1/0) steps pi (1 at a
 *   double lock); op: = != >= <=
 *   picks: see PICKS (fill, pi, nopi, quiet, loud, fewlocks, morelocks, small, big, fewhits, morehits, new, degup,
 *   degdown, degkeep, hop k, pair 'βγ', branchy, narrow, rand, oracle (dF: a cheat, the baseline only))
 */
(function (root) {
  'use strict';
  const RIM = root.FTH_RIM, DEG = root.FTH_DEGREE;
  const CAP = 60, ROLE = 'αβγδ';
  const CACHE = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function prep(Gr) {
    if (CACHE && CACHE.has(Gr)) return CACHE.get(Gr);
    const G = RIM.graph(Gr); G.Gr = Gr; G.rimAt = new Map(G.link.map((x, i) => [x, i])); G.five = G.ncol === 4 && G.link.length === 5;
    if (CACHE) CACHE.set(Gr, G);
    return G;
  }
  const canon = (G, col) => RIM.canon(G, col);
  // every chain of col: { a, b, vs, web } (the hole left out)
  function chains(G, col) {
    const out = [], n = G.n;
    for (let a = 0; a < G.ncol; a++) for (let b = a + 1; b < G.ncol; b++) {
      const seen = new Uint8Array(n), mine = [];
      for (let s = 0; s < n; s++) {
        if (s === G.hole || seen[s] || (col[s] !== a && col[s] !== b)) continue;
        const vs = [s]; seen[s] = 1;
        for (let i = 0; i < vs.length; i++) for (const w of G.adj[vs[i]]) if (w !== G.hole && !seen[w] && (col[w] === a || col[w] === b)) { seen[w] = 1; vs.push(w); }
        vs.sort((p, q) => p - q); mine.push({ a, b, vs, web: false });
      }
      if (mine.length === 1) mine[0].web = true;
      out.push(...mine);
    }
    return out;
  }
  const flip = (col, K) => { const d = col.slice(); K.vs.forEach(u => { d[u] = d[u] === K.a ? K.b : K.a; }); return d; };
  function feat(G, col, ch) {
    const R = RIM.analyse(G, col), C = DEG && G.Gr.rot ? DEG.counts(G.Gr, col) : null;
    ch = ch || chains(G, col);
    return { key: canon(G, col), rim: R.cols, filled: R.filled, ok: R.ok, t: R.star, lock: R.lock || 0, l1: R.locks ? R.locks[0] : false, l2: R.locks ? R.locks[1] : false,
      frame: R.ok && !R.filled && R.x ? [R.alpha, R.beta, R.gamma, R.delta] : null, pi: R.pi ? canon(G, R.pi.col) : null, deg: C ? C.N * C.eps : 0, N: ch.length, nm: 0, R };
  }
  // a pair as frame roles ('βγ'), '' without a frame
  const roles = (fr, a, b) => { if (!fr) return ''; const i = fr.indexOf(a), j = fr.indexOf(b); return i < 0 || j < 0 ? '' : ROLE[Math.min(i, j)] + ROLE[Math.max(i, j)]; };
  function moves(G, col, f, ch) {
    f = f || feat(G, col); ch = ch || chains(G, col);
    const by = new Map();
    for (const K of ch) {
      if (K.web) continue;
      const d = flip(col, K), key = canon(G, d), hits = K.vs.filter(u => G.rimAt.has(u)).map(u => G.rimAt.get(u)).sort((p, q) => p - q);
      const m = { a: K.a, b: K.b, pair: [K.a, K.b], vs: K.vs, size: K.vs.length, hits, quiet: !hits.length, col: d, key, n: 1 };
      const o = by.get(key);
      if (!o) { by.set(key, m); continue; }
      o.n++; o.quiet = o.quiet || m.quiet;
      if (m.hits.length < o.hits.length || (m.hits.length === o.hits.length && (m.size < o.size || (m.size === o.size && m.vs[0] < o.vs[0])))) { m.n = o.n; m.quiet = o.quiet; by.set(key, m); }
    }
    const out = [...by.values()];
    out.forEach(m => { m.roles = roles(f.frame, m.a, m.b); m.pi = !!f.pi && m.key === f.pi; });
    out.sort((p, q) => p.size - q.size || (p.key < q.key ? -1 : p.key > q.key ? 1 : 0));
    f.nm = out.length;
    return out;
  }
  // ---- the level's state tree: its start's whole Kempe class (filled stars included, as leaves), dF by BFS from the fills
  // cache (optional, a Map): levels on one map whose start lies in a class already built share it (only start and par differ)
  function graph(GAME, L, cache) {
    const Gr = GAME.graphs[L.g], G = prep(Gr), start = L.start.slice(); start[G.hole] = -1;
    const k0 = canon(G, start), hit = cache && (cache.get(L.g) || []).find(T => T.idx.has(k0));
    if (hit) { const i = hit.idx.get(k0); return Object.assign({}, hit, { L, start: i, par: hit.S[i].dF }); }
    const S = [], idx = new Map();
    const add = c => { const ch = chains(G, c), f = feat(G, c, ch); idx.set(f.key, S.length); S.push({ key: f.key, col: c, f, ch, mv: null, dF: -1 }); };
    add(start);
    for (let i = 0; i < S.length; i++) {
      const s = S[i], mv = moves(G, s.col, s.f, s.ch); s.ch = null;
      for (const m of mv) { if (!idx.has(m.key)) add(m.col); m.to = idx.get(m.key); m.col = null; }
      s.mv = mv;
    }
    const q = [];
    S.forEach((s, i) => { if (s.f.filled) { s.dF = 0; q.push(i); } });
    for (let h = 0; h < q.length; h++) for (const m of S[q[h]].mv) if (S[m.to].dF < 0) { S[m.to].dF = S[q[h]].dF + 1; q.push(m.to); }
    // move features against the child star
    S.forEach(s => s.mv.forEach(m => {
      const c = S[m.to].f;
      m.fills = c.filled; m.dt = s.f.t >= 0 && c.t >= 0 ? (c.t - s.f.t + 5) % 5 : -1; m.dlock = (c.filled ? -1 : c.lock) - s.f.lock; m.ddeg = c.deg - s.f.deg;
    }));
    const T = { L, G, S, idx, start: 0, par: S[0].dF, key: L.g + ':' + S.map(s => s.key).sort()[0] };
    if (cache) cache.set(L.g, (cache.get(L.g) || []).concat([T]));
    return T;
  }

  // ---------------------------------------------------------------- the rule language
  // state tests: name -> [glyph, getter(ctx)]; ctx = { f, run, seen, steps }
  const CONDS = {
    lock: ['🔒', c => c.f.lock], pi: ['π?', c => c.f.pi ? 1 : 0], run: ['π×', c => c.run], seen: ['↻', c => c.seen ? 1 : 0],
    steps: ['👣', c => c.steps], star: ['✦', c => c.f.t], deg: ['◐', c => c.f.deg], N: ['⛓', c => c.f.N], nm: ['⑂', c => c.f.nm],
  };
  const OPS = { '=': (x, v) => x === v, '!=': (x, v) => x !== v, '>=': (x, v) => x >= v, '<=': (x, v) => x <= v };
  // picks: name -> [glyph, short label, score(m, child, ctx, arg)]: higher is better
  const hash = s => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
  const PICKS = {
    fill: ['✸', 'fill', (m) => m.fills ? 1 : 0],
    pi: ['π', 'π swap', (m) => m.pi ? 1 : 0],
    nopi: ['π̸', 'not π', (m) => m.pi ? 0 : 1],
    quiet: ['🔇', 'quiet', (m) => m.quiet ? 1 : 0],
    loud: ['🔊', 'loud', (m) => m.quiet ? 0 : 1],
    fewlocks: ['🔓', 'fewest locks', (m, c) => c.f.filled ? 1 : -c.f.lock],
    morelocks: ['🔒', 'most locks', (m, c) => c.f.filled ? -1 : c.f.lock],
    small: ['·', 'small chain', (m) => -m.size],
    big: ['●', 'big chain', (m) => m.size],
    fewhits: ['◌', 'fewest rim', (m) => -m.hits.length],
    morehits: ['◉', 'most rim', (m) => m.hits.length],
    new: ['✧', 'new star', (m, c, x) => x.visited.has(m.to) ? 0 : 1],
    degup: ['◐↑', 'degree up', (m) => m.ddeg],
    degdown: ['◐↓', 'degree down', (m) => -m.ddeg],
    degkeep: ['◐=', 'degree kept', (m) => -Math.abs(m.ddeg)],
    hop: ['⤳', 'spot hop', (m, c, x, k) => m.dt === +k ? 1 : 0],
    pair: ['⇄', 'pair', (m, c, x, r) => m.roles === r ? 1 : 0],
    branchy: ['⑂↑', 'most moves', (m, c) => c.f.nm],
    narrow: ['⑂↓', 'fewest moves', (m, c) => -c.f.nm],
    rand: ['🎲', 'dice', (m, c, x) => hash(m.key + '|' + x.steps) & 1023],
    oracle: ['👁', 'oracle', (m, c) => c.dF < 0 ? -99 : -c.dF],
  };
  const PAIRS = ['αβ', 'αγ', 'αδ', 'βγ', 'βδ', 'γδ'];
  const valid = r => !!r && Array.isArray(r.cards) && r.cards.every(c => c && PICKS[c.pick] && (c.when || []).every(w => CONDS[w.f] && OPS[w.op] && typeof w.v === 'number'));
  const label = c => ((c.when || []).length ? c.when.map(w => CONDS[w.f][0] + (w.op === '=' ? '' : w.op.replace('>=', '≥').replace('<=', '≤').replace('!=', '≠')) + w.v).join(' ') + ' → ' : '') +
    PICKS[c.pick][0] + (c.arg != null && c.arg !== '' ? c.arg : '');
  // the deterministic tie-break, then the walk
  const better = (p, q) => p.size - q.size || (p.key < q.key ? -1 : p.key > q.key ? 1 : 0);
  function choose(rule, LG, i, x) {
    const s = LG.S[i]; let C = s.mv.slice();
    if (!C.length) return null;
    const ctx = { f: s.f, run: x.run, seen: x.seen, steps: x.steps };
    for (const card of rule.cards) {
      if (C.length < 2) break;
      if (!(card.when || []).every(w => OPS[w.op](CONDS[w.f][1](ctx), w.v))) continue;
      const sc = PICKS[card.pick][2], v = C.map(m => sc(m, LG.S[m.to], x, card.arg)), best = Math.max(...v);
      C = C.filter((m, k) => v[k] === best);
    }
    return C.sort(better)[0];
  }
  function run(rule, LG, i, opt) {
    opt = opt || {};
    const cap = opt.cap || CAP, visited = new Map([[i, 1]]), path = [i], ctxSeen = new Map();
    const x = { run: 0, seen: false, steps: 0, visited };
    let cur = i, revisit = 0, stuck = false;
    const RM = Math.max(1, ...rule.cards.flatMap(c => (c.when || []).filter(w => w.f === 'run').map(w => w.v + 1)));
    const SM = Math.max(0, ...rule.cards.flatMap(c => (c.when || []).filter(w => w.f === 'steps').map(w => w.v + 1)));
    while (!LG.S[cur].f.filled && x.steps < cap) {
      const ck = cur + '|' + Math.min(x.run, RM) + '|' + (x.seen ? 1 : 0) + '|' + Math.min(x.steps, SM), vn = visited.size;
      if (ctxSeen.get(ck) === vn) { stuck = true; break; }      // same star, same context, nothing new seen since: a loop for good
      ctxSeen.set(ck, vn);
      const m = choose(rule, LG, cur, x); if (!m) break;
      x.run = m.pi ? x.run + 1 : 0; x.steps++; cur = m.to; path.push(cur);
      const k = visited.get(cur) || 0; visited.set(cur, k + 1); x.seen = k > 0; if (k) revisit++;
    }
    const solved = LG.S[cur].f.filled;
    return { solved, steps: x.steps, dF: LG.S[i].dF, path, revisit, stuck, why: solved ? '' : stuck ? 'loop' : x.steps >= cap ? 'cap' : 'dead' };
  }
  // ---- scores over levels: scope 'start' = every level's start; 'class' = every hard star (dF >= 2) of every distinct class
  function score(rule, LGs, scope, opt) {
    const t0 = Date.now(), out = { scope: scope || 'start', n: 0, solved: 0, steps: 0, par: 0, loops: 0, stuck: 0, fails: [], per: [] };
    const seen = new Set();
    for (const LG of LGs) {
      if (scope === 'class') {
        if (seen.has(LG.key)) continue; seen.add(LG.key);
        let n = 0, ok = 0;
        LG.S.forEach((s, i) => {
          if (s.dF < 2) return;                          // lock < 2 is always one swap from a fill: only the hard stars count
          const w = run(rule, LG, i, opt); n++; out.n++;
          if (w.solved) { ok++; out.solved++; out.steps += w.steps; out.par += w.dF; }
          if (w.revisit) out.loops++; if (w.stuck) out.stuck++;
        });
        out.per.push({ lvl: LG.L.id, num: String(LG.L.num), n, ok });
        if (ok < n) out.fails.push({ lvl: LG.L.id, num: String(LG.L.num), why: (n - ok) + '/' + n });
      } else {
        const w = run(rule, LG, LG.start, opt); out.n++;
        out.per.push({ lvl: LG.L.id, num: String(LG.L.num), ok: w.solved, steps: w.steps, par: LG.par, why: w.why, revisit: w.revisit });
        if (w.solved) { out.solved++; out.steps += w.steps; out.par += w.dF; } else out.fails.push({ lvl: LG.L.id, num: String(LG.L.num), why: w.why });
        if (w.revisit) out.loops++; if (w.stuck) out.stuck++;
      }
    }
    out.rate = out.n ? out.solved / out.n : 0;
    out.excess = out.solved ? (out.steps - out.par) / out.solved : 0;     // mean extra swaps over the fewest possible, solved walks
    out.ms = Date.now() - t0;
    return out;
  }
  const C = (pick, when, arg) => Object.assign({ pick, when: when || [] }, arg != null ? { arg } : {});
  const BUILTIN = [
    { id: 'kempe-pi', name: 'Kempe, else π', cards: [C('fill'), C('pi', [{ f: 'lock', op: '=', v: 2 }])] },
    { id: 'few-locks', name: 'Fewest locks next', cards: [C('fill'), C('fewlocks')] },
    { id: 'quiet', name: 'Prefer quiet', cards: [C('fill'), C('quiet')] },
    { id: 'small', name: 'Smallest chain', cards: [C('fill'), C('small')] },
    { id: 'few-locks-new', name: 'Fewest locks, new stars', cards: [C('fill'), C('fewlocks'), C('new')] },
    { id: 'pi-then-quiet', name: 'π, quiet when looping', cards: [C('fill'), C('quiet', [{ f: 'seen', op: '=', v: 1 }]), C('new', [{ f: 'seen', op: '=', v: 1 }]), C('pi', [{ f: 'lock', op: '=', v: 2 }])] },
    { id: 'dice', name: 'Dice', cards: [C('fill'), C('rand')] },
    { id: 'oracle', name: 'Oracle (dF)', oracle: true, cards: [C('oracle')] },
  ];
  root.FTH_STAR = { CAP, prep, chains, flip, feat, moves, roles, graph, CONDS, OPS, PICKS, PAIRS, valid, label, choose, run, score, BUILTIN };
})(typeof window !== 'undefined' ? window : this);
