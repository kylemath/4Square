/* rim.js: the rim's research frame for one colouring (window.FTH_RIM). Pure: no DOM, also loaded in node by
 * tools/rim_check.js, which checks it against kempe_engine.py (HoleGame.frame, chain_at, _frames: the reference).
 *
 * The research setting is 4 elements and a rim of 5 (other maps: ok = false). An unfilled rim uses all four elements,
 * so one element, alpha, sits on two rim tiles one apart: rim positions t and t+2 (the trouble spot). Rotated to start
 * at t the rim reads  x0 x1 x2 x3 x4 = alpha beta alpha gamma delta. Kempe's two ways out both start at the apex x1:
 *   lock 1: the {beta, gamma} chain of x1 reaches x3 (swapping it only moves the problem), else swapping it fills;
 *   lock 2: the {beta, delta} chain of x1 reaches x4.
 * Both locked is a double lock. Then π (Kittell's move) is the swap of the {alpha, gamma} chain of x2: it never fills,
 * it moves the trouble spot from t to t+3 (two places the other way round), one step along the five-pointed star
 * drawn through the rim tiles (star path 0 2 4 1 3: each edge joins two tiles one apart, so a trouble spot IS an edge).
 *
 *   const G = FTH_RIM.graph(GAME.graphs[key]);   // { n, hole, link, adj, ncol, goal }
 *   const R = FTH_RIM.analyse(G, col);           // col[u]: element of u, the hole -1
 *   R.ok, R.filled, R.trouble ('filled' | 'none' | { elem, pos: [t, t+2], apex: t+1 }), R.star (t, or -1), R.step
 *   R.x (rim vertices from x0), R.alpha .. R.delta, R.locks [l1, l2], R.lock (0-2), R.status ('free' 'single' 'double'
 *   'filled' 'none'), R.ways (the two rim chains, each { pair, from, to, blocked }), R.pi ({ pair, at, vs, col, star }
 *   when double locked, else null)
 */
(function (root) {
  'use strict';
  const PATH = [0, 2, 4, 1, 3];                       // the star path through rim positions; edge k joins PATH[k], PATH[k+1]
  const STEP = [0, 3, 1, 4, 2];                       // star index t -> its place on the path (t = PATH[STEP[t]])
  function graph(Gr) {
    const n = Gr.n, adj = Array.from({ length: n }, () => []);
    if (Gr.adj) Gr.adj.forEach((a, u) => { adj[u] = a.slice(); });
    else Gr.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    return { n, hole: Gr.hole, link: Gr.link.slice(), adj, ncol: Gr.ncol || 4, goal: Gr.goal == null ? (Gr.ncol || 4) - 1 : Gr.goal };
  }
  // vertex set of the {col[u], b} chain through u (kempe_engine.chain_at), the hole left out
  function chainAt(G, col, u, b) {
    const a = col[u], set = new Set([u]), st = [u];
    while (st.length) { const v = st.pop(); for (const w of G.adj[v]) if (w !== G.hole && !set.has(w) && (col[w] === a || col[w] === b)) { set.add(w); st.push(w); } }
    return set;
  }
  const flip = (col, set, pair) => { const d = col.slice(), [a, b] = pair; set.forEach(u => { d[u] = col[u] === a ? b : col[u] === b ? a : col[u]; }); return d; };
  // the game's state key (core.js / kempe_engine canon): elements renamed by first appearance along vertex ids, hole skipped
  const canon = (G, col) => { const mp = {}; let s = '', k = 0; for (let u = 0; u < G.n; u++) { if (u === G.hole) continue; if (!(col[u] in mp)) mp[col[u]] = k++; s += mp[col[u]]; } return s; };
  // kempe_engine.frame: the first t with col[t] = col[t + 2]
  function frame(G, col) {
    const L = G.link, c = L.map(x => col[x]);
    for (let t = 0; t < 5; t++) if (c[t] === c[(t + 2) % 5]) return { t, x: [0, 1, 2, 3, 4].map(i => L[(t + i) % 5]), alpha: c[t], beta: c[(t + 1) % 5], gamma: c[(t + 3) % 5], delta: c[(t + 4) % 5] };
    return null;
  }
  function analyse(G, col) {
    const L = G.link, cols = L.map(x => col[x]), count = new Set(cols).size, filled = count <= G.goal;
    const R = { ok: G.ncol === 4 && L.length === 5, rim: L.slice(), cols, count, filled, trouble: filled ? 'filled' : 'none',
      star: -1, step: -1, x: null, alpha: -1, beta: -1, gamma: -1, delta: -1, locks: null, lock: 0, status: filled ? 'filled' : 'none', ways: null, pi: null };
    if (!R.ok || filled) return R;
    const f = frame(G, col); if (!f) return R;        // a rim with two equal neighbours (not a triangulation): no frame
    const x = f.x, w1 = chainAt(G, col, x[1], f.gamma), w2 = chainAt(G, col, x[1], f.delta);
    const l1 = w1.has(x[3]), l2 = w2.has(x[4]);
    Object.assign(R, { star: f.t, step: STEP[f.t], x, alpha: f.alpha, beta: f.beta, gamma: f.gamma, delta: f.delta,
      trouble: { elem: f.alpha, pos: [f.t, (f.t + 2) % 5], apex: (f.t + 1) % 5 }, locks: [l1, l2], lock: l1 + l2,
      status: ['free', 'single', 'double'][l1 + l2],
      ways: [{ pair: [f.beta, f.gamma], from: x[1], to: x[3], blocked: l1 }, { pair: [f.beta, f.delta], from: x[1], to: x[4], blocked: l2 }] });
    if (l1 && l2) {                                   // π: the {alpha, gamma} chain of x2 (kempe_engine._frames)
      const K = chainAt(G, col, x[2], f.gamma), after = flip(col, K, [f.alpha, f.gamma]), g = frame(G, after);
      R.pi = { pair: [f.alpha, f.gamma], at: x[2], vs: [...K].sort((a, b) => a - b), col: after, star: g ? g.t : -1 };
    }
    return R;
  }
  root.FTH_RIM = { graph, analyse, chainAt, flip, canon, frame, PATH, STEP };
})(typeof window !== 'undefined' ? window : this);
