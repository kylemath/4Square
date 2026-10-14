/* verify.js: replay verifier for run proofs ("Fill the Hole" / 4square). Pure; runs in the browser and in plain node.
 *
 * The puzzle is deterministic, so a run can be proved by replaying it. A PROOF is plain JSON:
 *   { v:1, lvl:'<level id>', skin:'<skin id>', app:'<app version>', cnt:'all'|'net',   // how moves are counted (below)
 *     hints:<n>, t0:<Date.now() at start>, ms:<run length>, wall:<Date.now()-t0 at the end>,
 *     claim:{ stars, moves, pts },                                                      // pts is NOT verified (see ACCOUNTS.md)
 *     ops:[ [type, dt_ms, colouring], ... ], fin:'<final colouring>', fp:'<fingerprint>', int:[ [kind, count], ... ] }
 * a colouring is one char per region ('-' for the hole), e.g. '0120-31'. Op types:
 *   's' a Kempe swap (the colouring after it), 'w' a swap of a web (island board only; changes nothing but names),
 *   'u' undo, 'r' reset (frame skins; the island board's undo is an ordinary 's').
 * cnt 'all': every non-web swap counts (the island board, undo included). cnt 'net': lab/core.js's g.moves
 * (swaps minus undos; reset to 0), which is what the frame skins report.
 *
 * The replay uses lab/core.js (the same code the skins play with): every swap must be a real chain of the colouring
 * before it, the last state must be a win, the swap count must give the claimed stars, and the timestamps must be
 * physically plausible. Hard findings make a proof unverifiable (hidden from boards); soft findings are recorded.
 *
 *   FTH_VERIFY.verifyProof(proof, { LAB, GAME, now })  -> { ok, hard:[], soft:[], stars, moves, ms, fp }
 *   FTH_VERIFY.diffSwap(GAME, lvlId, prevCol, nextCol) -> { ok, why, v, a, b } (cheap online check of one step)
 *   FTH_VERIFY.fingerprint(proof), encCol(arr), decCol(str)
 * Node: require('./verify.js').nodeEnv(dir) loads levels.js + lab/core.js into a sandbox and returns the env.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.FTH_VERIFY = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const LIM = { swapMs: 150, firstMs: 400, base: 600, perSwap: 250, maxOps: 600, maxMs: 6 * 3600e3, skew: 5000, epoch: 1.7e12 };
  const encCol = c => c.map(x => x < 0 ? '-' : String(x)).join('');
  const decCol = s => typeof s === 'string' ? Array.from(s, ch => ch === '-' ? -1 : /[0-9]/.test(ch) ? +ch : NaN) : null;
  // 53-bit cyrb53 (not cryptographic: dedupe and casual-edit detection only)
  function h53(str, seed) {
    let h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const fingerprint = p => h53([p.lvl, p.skin, p.t0, (p.ops || []).map(o => o[0] + (o[2] || '')).join('|'), p.fin].join('#'));
  // per-skin par (index.html parNow, skin spec field `par`): a skin whose rules forbid some swaps has a longer par on some
  // levels. Shoreline (only chains that touch the shore) is a move longer on three levels; its stars use that par only when
  // every swap of the proof touched the shore (otherwise the census par, and a soft 'off-shore' finding).
  // tools/shoreline_check.js checks this table against the skin spec and the shore solver on every level.
  const SKIN_PAR = { shoreline: { archipelago: 2, 'open-doors': 2, 'quiet-way-out': 3 } };
  function shoreOf(g) {                       // lab/shoreline-core.js SHORE.shore(spec, 'beach'): the border, else the outer two BFS shells
    if (g.border && g.border.length) return new Set(g.border);
    const d = new Array(g.n).fill(-1); d[g.hole] = 0; let fr = [g.hole];
    while (fr.length) { const nx = []; for (const u of fr) for (const w of g.adj[u]) if (d[w] < 0) { d[w] = d[u] + 1; nx.push(w); } fr = nx; }
    const mx = Math.max(...d), S = new Set(); for (let u = 0; u < g.n; u++) if (u !== g.hole && d[u] >= mx - 1) S.add(u); return S;
  }
  const starsFor = (moves, par, hints) => { const st = moves <= par ? 3 : moves <= par + 2 ? 2 : 1; return hints ? Math.min(st, 2) : st; };

  function adjOf(Gr) {
    if (Gr._adj) return Gr._adj;
    const adj = Array.from({ length: Gr.n }, () => []); Gr.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    Object.defineProperty(Gr, '_adj', { value: adj, enumerable: false }); return adj;
  }
  // one step prev -> next is a legal swap iff the changed regions are exactly one chain of prev, exchanged.
  function diffSwap(GAME, lvl, prev, next) {
    const L = GAME.levels.find(l => l.id === lvl); if (!L) return { ok: false, why: 'unknown-level' };
    const Gr = GAME.graphs[L.g], n = Gr.n, hole = Gr.hole, NC = Gr.ncol || 4;
    if (!prev || !next || prev.length !== n || next.length !== n) return { ok: false, why: 'bad-length' };
    if (next[hole] !== -1) return { ok: false, why: 'hole-coloured' };
    const D = [];
    for (let u = 0; u < n; u++) { if (u !== hole && !(next[u] >= 0 && next[u] < NC)) return { ok: false, why: 'bad-colour' }; if (u !== hole && prev[u] !== next[u]) D.push(u); }
    if (!D.length) return { ok: false, why: 'no-change' };
    const v = D[0], a = prev[v], b = next[v];
    for (const u of D) if (!((prev[u] === a && next[u] === b) || (prev[u] === b && next[u] === a))) return { ok: false, why: 'not-a-swap' };
    const adj = adjOf(Gr), comp = new Set([v]), st = [v];
    while (st.length) { const u = st.pop(); for (const w of adj[u]) if (w !== hole && !comp.has(w) && (prev[w] === a || prev[w] === b)) { comp.add(w); st.push(w); } }
    if (comp.size !== D.length || !D.every(u => comp.has(u))) return { ok: false, why: 'not-a-whole-chain' };
    let other = false; for (let u = 0; u < n && !other; u++) if (u !== hole && (prev[u] === a || prev[u] === b) && !comp.has(u)) other = true;
    return { ok: true, v, a, b, size: D.length, web: !other };
  }

  function verifyProof(p, env) {
    const hard = [], soft = [], H = c => { if (!hard.includes(c)) hard.push(c); }, S = c => { if (!soft.includes(c)) soft.push(c); };
    const res = { stars: 0, moves: 0, ms: 0, fp: '' };
    const out = () => ({ ok: !hard.length, hard, soft, stars: res.stars, moves: res.moves, ms: res.ms, fp: res.fp });
    try {
      const GAME = env.GAME, now = env.now || Date.now();
      if (!p || typeof p !== 'object' || p.v !== 1) { H('format'); return out(); }
      if (typeof p.lvl !== 'string' || !/^[a-z0-9-]{2,24}$/.test(String(p.skin))) { H('format'); return out(); }
      if (!Array.isArray(p.ops) || p.ops.length > LIM.maxOps || !p.ops.length) { H('format'); return out(); }
      const L = GAME.levels.find(l => l.id === p.lvl); if (!L) { H('unknown-level'); return out(); }
      if (p.cnt !== 'all' && p.cnt !== 'net') H('format');
      if (!Number.isFinite(p.ms) || p.ms < 0 || p.ms > LIM.maxMs || !Number.isFinite(p.t0)) { H('format'); return out(); }
      res.ms = p.ms; res.fp = fingerprint(p);
      if (p.fp !== res.fp) H('fingerprint');
      if (p.t0 < LIM.epoch || p.t0 > now + 300e3) H('clock');
      if (!p.claim || !Number.isFinite(p.claim.stars) || !Number.isFinite(p.claim.moves)) H('format');
      if (hard.length) return out();
      const g = env.LAB.game(L.id); if (g.level.id !== L.id) { H('unknown-level'); return out(); }
      const SP = SKIN_PAR[p.skin], shore = SP ? shoreOf(g) : null;
      let nSwap = 0, nAll = 0, last = 0, t = 0, offShore = false;
      for (let i = 0; i < p.ops.length; i++) {
        const op = p.ops[i]; if (!Array.isArray(op) || op.length !== 3 || !Number.isFinite(op[1])) { H('format'); break; }
        const [ty, dt, cs] = op, next = decCol(cs);
        if (!next || next.length !== g.n || next.some(Number.isNaN)) { H('format'); break; }
        if (dt < last) H('time-not-monotone');
        if (ty !== 'r' && dt - last < (i === 0 ? LIM.firstMs : LIM.swapMs)) H('impossible-timing');
        last = t = dt;
        if (g.won()) { H('move-after-win'); break; }
        if (ty === 's' || ty === 'w') {
          const d = diffSwap(GAME, L.id, g.col, next);
          if (!d.ok) { H('illegal-swap:' + d.why); break; }
          const K = g.chainAt(d.v, d.b);
          if (!K || K.vs.length !== d.size) { H('illegal-swap:core-mismatch'); break; }     // core.js has the last word
          if (ty === 'w' && (!K.web || p.cnt !== 'all')) { H('bad-web-op'); break; }
          if (ty === 's' && K.web && p.cnt === 'all') { H('bad-web-op'); break; }
          if (shore && !K.vs.some(u => shore.has(u))) offShore = true;
          g.swap(K); nAll++; if (!K.web) nSwap++;
          if (encCol(g.col) !== cs) { H('state-mismatch'); break; }
        } else if (ty === 'u') {
          if (p.cnt !== 'net' || !g.history.length) { H('bad-undo'); break; }
          g.undo(); if (encCol(g.col) !== cs) { H('state-mismatch'); break; }
        } else if (ty === 'r') {
          if (p.cnt !== 'net') { H('bad-reset'); break; }
          g.reset(); if (encCol(g.col) !== cs) { H('state-mismatch'); break; }
        } else { H('format'); break; }
      }
      if (hard.length) return out();
      if (!g.won()) { H('not-a-win'); return out(); }
      if (p.fin !== encCol(g.col)) H('final-mismatch');
      const moves = p.cnt === 'all' ? nSwap : g.moves, par = SP && SP[L.id] > L.par && !offShore ? SP[L.id] : L.par, stars = starsFor(moves, par, +p.hints > 0);
      if (offShore) S('off-shore');
      res.moves = moves; res.stars = stars;
      if (p.claim.moves !== moves) H('moves-mismatch');
      if (p.claim.stars > stars) H('stars-mismatch');
      if (!(p.ms >= t)) H('time-order');
      if (p.ms < LIM.base + LIM.perSwap * nAll) H('impossible-timing');
      if (Number.isFinite(p.wall) && Math.abs(p.wall - p.ms) > Math.max(LIM.skew, p.ms * .05)) S('clock-skew');
      if (!(+p.hints >= 0) && p.hints !== undefined) H('format');
      if (p.claim.pts !== undefined && !(p.claim.pts >= 0)) H('format');
      return out();
    } catch (e) { H('verifier-error:' + (e && e.message)); return out(); }
  }

  // node helper: sandbox with levels.js + lab/core.js (the same files the browser loads)
  function nodeEnv(dir) {
    const fs = require('fs'), path = require('path'), vm = require('vm');
    const win = { location: { search: '' }, addEventListener() {}, console, URLSearchParams }; win.window = win; win.parent = win;
    const ctx = vm.createContext(win);
    vm.runInContext(fs.readFileSync(path.join(dir, 'levels.js'), 'utf8'), ctx, { filename: 'levels.js' });
    vm.runInContext(fs.readFileSync(path.join(dir, 'layout.js'), 'utf8'), ctx, { filename: 'layout.js' });   // region layout: g.border (Shoreline's shore)
    vm.runInContext(fs.readFileSync(path.join(dir, 'lab', 'core.js'), 'utf8'), ctx, { filename: 'core.js' });
    return { GAME: ctx.GAME, LAB: ctx.LAB };
  }
  return { verifyProof, diffSwap, fingerprint, encCol, decCol, starsFor, h53, LIM, nodeEnv, SKIN_PAR, shoreOf };
});
