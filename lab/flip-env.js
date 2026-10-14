/* lab/flip-env.js: a gym-like environment for RL agents on the signed diagonal-flip puzzle (lab/flip.html), plus random and
 * greedy baseline agents. Pure JS on top of lab/flip-model.js (FTH_FLIP): window.FLIP_ENV in a page, importScripts in a
 * worker (load ../flip-model.js first), require() in Node. Spec and baseline numbers: lab/arena/FLIP-ENV.md;
 * tests and baselines: node tools/flip_env_check.js.
 *
 *   const E = FLIP_ENV.make({ n: 9 });        // fixed n: the action space is every diagonal slot of the n-gon
 *   let obs = E.reset({ seed: 7 });           // a generated puzzle (FTH_FLIP.generate), or reset({ puzzle }) for your own
 *   const m = E.mask();                       // Uint8Array(E.A): 1 = a diagonal present now whose two triangles share a sign
 *   const { obs, reward, done, info } = E.step(a);
 *
 * Actions: a = slot index, E.slots[a] = diagonal code i*n + j (i < j, not a side), in lexicographic (i, j) order;
 *   E.A = n(n-3)/2. Flipping slot a is legal iff mask[a]. An illegal action leaves the state alone (reward -1, info.illegal).
 * Reward: -1 per step (as the Maze Arena: an undiscounted return is minus the number of steps); done when the diagonals
 *   match the target (info.solved) or after opt.cap steps (default 4 x par + 4, info.truncated). opt.shaped adds the change in
 *   the number of matched diagonals (potential-based, so optimal policies are unchanged).
 * Observation obs.x: Float32Array(E.F * E.A + 4 * n + 3)
 *   per slot (E.F = 6): [in current T, in target, legal now, sign of its triangles if present (+1 / -1 when both agree,
 *                        0 otherwise), the slot crosses no target diagonal, (current and target)]
 *   per vertex (4):     one-hot colour of the F4 colouring the signs encode (col0 = 0, col1 = 1; a flip never changes it)
 *   globals (3):        steps / cap, unmatched target diagonals / (n - 3), n / 16
 *   obs.T, obs.target, obs.s (sign per triangle code), obs.col (the colouring) are also given for structured agents.
 * The model is symmetric under the dihedral group of the polygon (relabel v -> v + k or -v mod n): E.relabel(k, mirror)
 * returns the equivalent puzzle for augmentation (note a mirror reverses orientation, so every sign flips).
 */
(function (root) {
  'use strict';
  const F = root.FTH_FLIP || (typeof require !== 'undefined' ? require('./flip-model.js') : null);
  if (!F) throw new Error('flip-env.js needs flip-model.js loaded first');

  function slotsOf(n) { const s = []; for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if (!(i === 0 && j === n - 1)) s.push(i * n + j); return s; }
  const crosses = (n, d1, d2) => { const [a, b] = F.ends(n, d1), [c, d] = F.ends(n, d2); if (a === c || a === d || b === c || b === d) return false; const inn = x => x > a && x < b; return inn(c) !== inn(d); };

  function make(opt) {
    opt = Object.assign({ n: 8, len: null, detour: 0, cap: null, shaped: false }, opt || {});
    const n = opt.n, slots = slotsOf(n), at = new Map(slots.map((d, i) => [d, i])), A = slots.length, FS = 6;
    const E = { n, A, F: FS, slots, obsSize: FS * A + 4 * n + 3, opt };
    let P = null, st = null, steps = 0, cap = 0, done = false;
    const matched = () => F.common(st.T, P.target);
    E.mask = () => { const m = new Uint8Array(A); for (const d of st.T) if (F.legal(st, d).ok) m[at.get(d)] = 1; return m; };
    E.observe = () => {
      const x = new Float32Array(E.obsSize), cur = new Set(st.T), tgt = new Set(P.target), col = F.colouringFromSigns(n, st.T, st.s);
      slots.forEach((d, i) => {
        const o = i * FS; let sg = 0, lg = 0;
        if (cur.has(d)) { const L = F.legal(st, d); lg = L.ok ? 1 : 0; sg = L.ok ? L.signs[0] : 0; }
        x[o] = cur.has(d) ? 1 : 0; x[o + 1] = tgt.has(d) ? 1 : 0; x[o + 2] = lg; x[o + 3] = sg;
        x[o + 4] = P.target.every(t => !crosses(n, d, t)) ? 1 : 0; x[o + 5] = cur.has(d) && tgt.has(d) ? 1 : 0;
      });
      const v0 = FS * A; col.forEach((c, v) => { x[v0 + v * 4 + c] = 1; });
      const g0 = v0 + 4 * n; x[g0] = steps / cap; x[g0 + 1] = (n - 3 - matched()) / Math.max(1, n - 3); x[g0 + 2] = n / 16;
      return { x, T: st.T.slice(), target: P.target.slice(), s: Object.assign({}, st.s), col };
    };
    E.reset = r => {
      r = r || {};
      P = r.puzzle || F.generate(n, r.seed == null ? 1 : r.seed, { len: r.len || opt.len || n - 2, detour: r.detour != null ? r.detour : opt.detour, free: false });
      if (P.n !== n) throw new Error('puzzle n ' + P.n + ' != env n ' + n);
      st = F.state(n, P.T, P.s); steps = 0; done = false; cap = r.cap || opt.cap || 4 * P.par + 4;
      return E.observe();
    };
    E.step = a => {
      if (done) throw new Error('episode is over: call reset()');
      const d = slots[a], before = matched(); steps++;
      const L = d == null ? { ok: false } : F.legal(st, d);
      let info = { illegal: !L.ok, steps, par: P.par };
      if (L.ok) st = F.flip(st, d);
      const solved = F.same(st.T, P.target), truncated = !solved && steps >= cap;
      done = solved || truncated;
      let reward = -1; if (opt.shaped) reward += matched() - before;
      info = Object.assign(info, { solved, truncated, flipped: L.ok ? d : -1, to: L.ok ? L.nd : -1 });
      return { obs: E.observe(), reward, done, info };
    };
    E.state = () => F.state(n, st.T, st.s);
    E.puzzle = () => P;
    E.solved = () => F.same(st.T, P.target);
    E.oracle = () => { const p = F.solve(st, P.target); return p && p.length ? at.get(p[0]) : -1; };   // an optimal action
    E.distance = () => { const p = F.solve(st, P.target); return p ? p.length : -1; };                 // exact flips to go
    // dihedral relabelling v -> (mirror ? -v : v) + k mod n of the current puzzle (start, signs, target)
    E.relabel = (k, mirror) => {
      const m = v => ((mirror ? -v : v) + k + 2 * n) % n, md = d => { const [i, j] = F.ends(n, d); return F.diag(n, m(i), m(j)); };
      const T = P.T.map(md).sort((a, b) => a - b), target = P.target.map(md).sort((a, b) => a - b), s = {};
      for (const [a, b, c] of F.triangles(n, P.T)) s[F.triCode(n, m(a), m(b), m(c))] = (mirror ? -1 : 1) * P.s[F.triCode(n, a, b, c)];
      return Object.assign({}, P, { T, target, s });
    };
    return E;
  }

  // ---- baseline agents: (E, obs, R, memory) -> action
  const agents = {
    // uniform over legal actions
    random(E, obs, R) { const m = E.mask(), L = []; m.forEach((v, i) => { if (v) L.push(i); }); return L.length ? L[R.int(L.length)] : R.int(E.A); },
    // one step of lookahead on the number of matched diagonals: +1 if the new diagonal is a target one, -1 if the old one was;
    // ties broken at random
    greedy(E, obs, R) {
      const m = E.mask(), st = E.state(), tg = new Set(obs.target); let best = -9, pick = [];
      m.forEach((v, i) => { if (!v) return; const d = E.slots[i], L = F.legal(st, d), sc = (tg.has(L.nd) ? 1 : 0) - (tg.has(d) ? 1 : 0); if (sc > best) { best = sc; pick = [i]; } else if (sc === best) pick.push(i); });
      return pick.length ? pick[R.int(pick.length)] : R.int(E.A);
    },
    // greedy, but never back to a state already visited this episode while an unvisited one is legal (a tabu list)
    greedyTabu(E, obs, R, mem) {
      mem.seen = mem.seen || new Set([F.stKey(E.state())]);
      const m = E.mask(), st = E.state(), tg = new Set(obs.target); let best = -99, pick = [];
      m.forEach((v, i) => { if (!v) return; const d = E.slots[i], L = F.legal(st, d), nk = F.stKey(F.flip(st, d)), sc = (tg.has(L.nd) ? 1 : 0) - (tg.has(d) ? 1 : 0) - (mem.seen.has(nk) ? 10 : 0);
        if (sc > best) { best = sc; pick = [i]; } else if (sc === best) pick.push(i); });
      const a = pick.length ? pick[R.int(pick.length)] : R.int(E.A);
      if (pick.length) mem.seen.add(F.stKey(F.flip(st, E.slots[a])));
      return a;
    },
    oracle(E) { return E.oracle(); },
  };
  // run one episode -> { solved, steps, par }
  function episode(E, agent, reset, R) {
    let obs = E.reset(reset), r = null; const mem = {};
    do { r = E.step(agent(E, obs, R, mem)); obs = r.obs; } while (!r.done);
    return { solved: r.info.solved, steps: r.info.steps, par: E.puzzle().par };
  }

  const FLIP_ENV = { make, slotsOf, agents, episode, crosses };
  if (typeof module !== 'undefined' && module.exports) module.exports = FLIP_ENV;
  root.FLIP_ENV = FLIP_ENV;
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
