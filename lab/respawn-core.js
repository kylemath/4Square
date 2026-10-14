/* lab/respawn-core.js: the model behind lab/respawn.html (Respawn, a lab prototype; design: lab/RESPAWN-DESIGN.md).
 *
 * Pure logic, no drawing, so node can run it (tools/respawn_check.js). Works on a LAB.game() instance `g` and never
 * changes core.js: every move is g.swap(K) or g.undo().
 *
 *   room   = a colouring up to renaming the elements (the key is the same canonical string as g.canon())
 *   door   = a non-web chain of the room; going through it = g.swap(K)
 *   tree   = the player's own explored graph: nodes = rooms visited, edges = doors taken. Every node keeps the parent it
 *            was first reached from (the tree edge); a door into an already-known room adds a cross edge (a merge).
 *   respawn= teleport to any node: undo back to where the current path and the node's tree path agree, then swap down
 *            the tree path. g.history therefore always holds one walk from the start to the current room, and g.moves
 *            is its length (the "branch" compared with par at the win).
 */
(function (root) {
  'use strict';
  const canonOf = (c, n, hole) => { const mp = {}; let s = '', k = 0; for (let u = 0; u < n; u++) { if (u === hole) continue; if (!(c[u] in mp)) mp[c[u]] = k++; s += mp[c[u]]; } return s; };

  // The doors of the current room, in a stable order: by element pair, then larger chains first, then lowest region.
  function doors(g) {
    const out = [];
    for (const K of g.chains) {
      if (K.web) continue;
      const p = g.preview(K);
      out.push({ K, pair: K.pair.slice(), size: K.size, rim: K.rimHits, vs: K.vs, dest: canonOf(p.col, g.n, g.hole), won: p.won });
    }
    const pk = d => d.pair[0] * 4 + d.pair[1];
    out.sort((a, b) => pk(a) - pk(b) || b.size - a.size || a.vs[0] - b.vs[0]);
    return out;
  }

  function tree(g) {
    const T = { nodes: [], byKey: new Map(), edges: [], edgeSet: new Set(), cur: 0 };
    const node = (key, col, parent, via) => {
      const nd = { id: T.nodes.length, key, col: col.slice(), parent, via: via || null, depth: parent == null ? 0 : T.nodes[parent].depth + 1,
        kids: [], visits: 0, deaths: 0, won: false, t: Date.now() };
      T.nodes.push(nd); T.byKey.set(key, nd.id); if (parent != null) T.nodes[parent].kids.push(nd.id);
      return nd;
    };
    T.reset = () => { T.nodes = []; T.byKey = new Map(); T.edges = []; T.edgeSet = new Set(); const r = node(g.canon(), g.col, null); r.visits = 1; r.won = g.won(); T.cur = 0; return r; };
    // the game moved from node `from` into its current colouring (a door, an outside swap or a teleport step)
    T.arrive = (from, vs) => {
      const key = g.canon(); let id = T.byKey.get(key), fresh = false;
      if (id == null) { id = node(key, g.col, from, vs).id; fresh = true; }
      const nd = T.nodes[id]; nd.won = g.won();
      if (from != null && from !== id) {
        const ek = Math.min(from, id) + '|' + Math.max(from, id);
        if (!T.edgeSet.has(ek)) { T.edgeSet.add(ek); T.edges.push({ a: from, b: id, tree: fresh, vs }); }
      }
      T.cur = id; return { id, fresh };
    };
    T.at = () => T.byKey.get(g.canon());
    T.path = id => { const p = []; for (let x = id; x != null; x = T.nodes[x].parent) p.push(x); return p.reverse(); };
    // the node ids of the walk g.history + current colouring (every one of them is in the tree)
    T.walk = () => g.history.map(c => T.byKey.get(canonOf(c, g.n, g.hole))).concat([T.byKey.get(g.canon())]);
    // how to get to `id`: undo `undos` times, then go through the doors into `steps` (node ids), in order
    T.plan = id => {
      const w = T.walk(), p = T.path(id); let k = 0;
      while (k < w.length && k < p.length && w[k] === p[k]) k++;
      if (k === 0) k = 1;                       // the walk always starts at the root (node 0)
      return { undos: w.length - k, steps: p.slice(k) };
    };
    // teleport: returns the number of g calls made; `cb(type)` runs before each one (the page uses it to mute effects)
    T.teleport = id => {
      const pl = T.plan(id); let calls = 0;
      for (let i = 0; i < pl.undos; i++) { g.undo(); calls++; }
      for (const s of pl.steps) {
        const key = T.nodes[s].key, d = doors(g).find(x => x.dest === key);
        if (!d) throw new Error('teleport: no door into node ' + s);
        g.swap(d.K); calls++;
      }
      if (g.canon() !== T.nodes[id].key) throw new Error('teleport landed in the wrong room');
      T.cur = id; return calls;
    };
    // tidy layout: depth along one axis, leaves spread evenly along the other (parents centred over their kids)
    T.layout = () => {
      let leaf = 0, maxD = 0;
      const place = id => {
        const nd = T.nodes[id]; maxD = Math.max(maxD, nd.depth);
        if (!nd.kids.length) { nd.b = leaf++; return nd.b; }
        let s = 0; for (const k of nd.kids) s += place(k); nd.b = s / nd.kids.length; return nd.b;
      };
      if (T.nodes.length) place(0);
      return { leaves: Math.max(1, leaf), depth: maxD };
    };
    T.reset();
    return T;
  }

  // Room timer (seconds): more doors and a deeper level give more time; speed scales it (chill 1.6, run 1, sprint 0.7).
  const roomTime = (nDoors, par, speed) => (speed || 1) * Math.min(6.5, Math.max(3, 2.4 + 0.18 * nDoors + 0.3 * (par || 1)));

  const api = { canonOf, doors, tree, roomTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RESPAWN_CORE = api;
})(typeof window !== 'undefined' ? window : this);
