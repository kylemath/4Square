// 4square island board: the walled island (Islands) and the free bubble layout (Islands Free) are two configurations of
// this one renderer. The shell (index.html) owns the game (chains, flips, scoring, saves); it hands this file a read-only
// view of the game state (S.view) and calls the small interface returned by create(). See SKIN-SPEC.md, section 11.
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const q1 = v => Math.round(v * 10) / 10;
  const hash01 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const clear = g => { while (g.firstChild) g.removeChild(g.firstChild); };
  // precomputed 2D layouts per map (portrait and landscape islands): tile centres as fractions of the island's half-axes,
  // and each wall dock as [wall, tile, coast parameter t in [0, 4)], in coast order
  const BOARD2D = /*BOARD2D*/{"ico":{"port":{"p":[[0,0.001,-0.001],[1,0.564,0.189],[2,0.144,0.423],[3,-0.3,0.311],[4,-0.271,-0.325],[5,0.526,-0.214],[7,-0.441,0.635],[8,-0.595,0.019],[9,-0.396,-0.654]],"d":[[10,9,0.845],[10,5,1.427],[10,1,2.137],[6,1,2.501],[6,2,2.716],[6,7,2.862],[11,7,3.466],[11,8,3.973],[11,9,0.114]]},"land":{"p":[[0,0.001,0.005],[1,0.349,0.182],[2,0.114,0.578],[3,-0.325,0.26],[4,-0.323,-0.263],[5,0.289,-0.365],[7,-0.622,0.465],[8,-0.632,-0.441],[9,-0.062,-0.58]],"d":[[10,9,0.759],[10,5,1.524],[10,1,1.945],[6,1,2.318],[6,2,2.467],[6,7,2.776],[11,7,3.759],[11,8,3.888],[11,9,0.155]]}},"p22":{"port":{"p":[[0,-0.326,0.143],[1,0,0],[2,-0.032,0.284],[3,0.036,0.672],[4,-0.586,0.369],[5,-0.662,-0.02],[6,-0.33,-0.144],[7,0.089,-0.272],[8,0.28,0.166],[9,0.431,0.376],[10,0.562,0.595],[13,-0.599,-0.476],[14,-0.283,-0.394],[15,0.27,-0.472],[16,0.431,-0.11],[17,0.649,-0.303],[19,-0.313,-0.729],[20,-0.036,-0.577],[21,0.489,-0.654]],"d":[[18,19,0.475],[18,21,0.837],[18,17,1.396],[18,10,1.676],[11,10,2.135],[11,3,2.287],[11,4,2.993],[12,4,3.469],[12,5,3.629],[12,13,3.8],[12,19,0.073]]},"land":{"p":[[0,-0.15,0.375],[1,0,0],[2,0.09,0.386],[3,0.21,0.661],[4,-0.685,0.375],[5,-0.695,-0.482],[6,-0.255,-0.254],[7,0.227,-0.16],[8,0.264,0.172],[9,0.472,0.264],[10,0.656,0.501],[13,-0.269,-0.66],[14,-0.046,-0.38],[15,0.44,-0.274],[16,0.601,-0.037],[17,0.784,0.169],[19,0.377,-0.646],[20,0.174,-0.491],[21,0.691,-0.395]],"d":[[18,19,0.875],[18,21,1.214],[18,17,1.598],[18,10,1.837],[11,10,2.142],[11,3,2.241],[11,4,2.932],[12,4,3.507],[12,5,3.743],[12,13,0.262],[12,19,0.373]]}},"r1":{"port":{"p":[[0,-0.405,0.37],[1,-0.012,0.394],[2,-0.246,0.535],[3,-0.562,0.623],[4,-0.516,-0.052],[5,-0.306,0.187],[6,-0.025,0.208],[7,0.242,0.101],[8,0.238,0.367],[9,0.014,0.579],[10,-0.103,0.754],[13,-0.668,-0.386],[14,-0.444,-0.257],[15,-0.279,-0.023],[16,0,0.001],[17,0.19,-0.142],[18,0.429,-0.11],[19,0.552,0.149],[20,0.666,0.386],[22,-0.44,-0.718],[23,-0.421,-0.524],[24,-0.241,-0.384],[25,-0.14,-0.19],[26,0.08,-0.312],[27,0.32,-0.391],[28,0.548,-0.269],[29,0.699,-0.119],[30,0.573,-0.636],[31,0.093,-0.753],[32,0.313,-0.614],[33,0.021,-0.489]],"d":[[21,22,0.559],[21,31,0.826],[21,30,0.931],[21,29,1.499],[21,20,1.992],[11,20,2.326],[11,10,2.535],[11,3,2.794],[12,3,3.116],[12,13,3.642],[12,22,3.918]]},"land":{"p":[[0,-0.494,0.387],[1,-0.083,0.328],[2,0.057,0.532],[3,-0.67,0.526],[4,-0.516,-0.038],[5,-0.361,0.144],[6,-0.17,0.097],[7,0.092,0.226],[8,0.234,0.347],[9,0.335,0.533],[10,-0.06,0.714],[13,-0.573,-0.496],[14,-0.384,-0.38],[15,-0.106,-0.229],[16,0,0],[17,0.208,0.052],[18,0.4,0.113],[19,0.578,0.242],[20,0.639,0.598],[22,-0.251,-0.697],[23,-0.079,-0.582],[24,0.024,-0.386],[25,0.134,-0.176],[26,0.314,-0.178],[27,0.474,-0.196],[28,0.639,-0.056],[29,0.758,0.31],[30,0.799,-0.259],[31,0.358,-0.695],[32,0.438,-0.468],[33,0.209,-0.399]],"d":[[21,22,0.891],[21,31,0.996],[21,30,1.322],[21,29,1.581],[21,20,1.773],[11,20,2.016],[11,10,2.613],[11,3,2.88],[12,3,3.208],[12,13,3.954],[12,22,0.127]]}},"r178":{"port":{"p":[[0,-0.345,0.365],[1,-0.107,0.22],[2,0.05,0.401],[3,0.185,0.57],[4,0.295,0.757],[5,-0.059,0.746],[6,-0.677,0.386],[7,-0.56,0.223],[8,-0.487,0.053],[9,-0.25,0.062],[10,0,0],[11,0.276,-0.017],[12,0.261,0.302],[13,0.624,0.502],[16,-0.682,-0.384],[17,-0.5,-0.262],[18,-0.355,-0.116],[19,-0.121,-0.186],[20,0.127,-0.196],[21,0.373,-0.233],[22,0.418,0.135],[23,0.533,0.323],[24,0.689,0.153],[26,0.597,-0.579],[27,-0.263,-0.769],[28,-0.314,-0.545],[29,-0.285,-0.348],[30,-0.046,-0.426],[31,0.221,-0.413],[32,0.517,-0.387],[33,-0.028,-0.629]],"d":[[25,26,0.858],[25,24,1.286],[25,13,1.446],[14,13,1.868],[14,4,2.434],[14,5,2.65],[15,5,3.252],[15,6,3.385],[15,16,3.589],[15,27,0.216],[15,26,0.453]]},"land":{"p":[[0,0.006,0.556],[1,-0.087,0.316],[2,0.222,0.249],[3,0.241,0.506],[4,0.138,0.696],[5,-0.36,0.69],[6,-0.245,0.489],[7,-0.342,0.246],[8,-0.437,0.024],[9,-0.177,0.104],[10,-0.001,-0.002],[11,0.215,-0.01],[12,0.388,0.365],[13,0.696,0.517],[16,-0.811,-0.093],[17,-0.495,-0.239],[18,-0.328,-0.2],[19,-0.142,-0.162],[20,0.124,-0.21],[21,0.433,-0.187],[22,0.456,0.098],[23,0.677,-0.053],[24,0.798,-0.309],[26,0.499,-0.659],[27,-0.502,-0.665],[28,-0.374,-0.492],[29,-0.219,-0.404],[30,-0.005,-0.35],[31,0.268,-0.325],[32,0.586,-0.393],[33,-0.091,-0.55]],"d":[[25,26,0.776],[25,24,1.434],[25,13,1.608],[14,13,1.912],[14,4,2.386],[14,5,2.505],[15,5,3.179],[15,6,3.286],[15,16,3.633],[15,27,3.924],[15,26,0.241]]}},"w13":{"port":{"p":[[0,-0.476,-0.322],[1,-0.297,0.376],[2,0.558,0.402],[3,0.438,-0.631],[4,0.585,-0.029],[7,0.278,-0.305],[8,-0.008,0.006],[10,-0.314,-0.64],[11,-0.565,0.046],[12,0.123,0.649]],"d":[[6,10,0.718],[6,0,0.817],[6,3,1.008],[6,4,1.288],[6,2,2.011],[5,2,2.292],[5,12,2.576],[5,4,2.851],[5,1,3.067],[5,11,3.499],[5,0,3.65],[5,10,3.953],[9,10,0.401]]},"land":{"p":[[0,0.043,-0.539],[1,-0.094,0.553],[2,0.747,0.032],[3,0.619,-0.453],[4,0.231,0.348],[7,0.307,-0.24],[8,-0.001,0],[10,-0.524,-0.459],[11,-0.345,0.161],[12,0.542,0.47]],"d":[[6,10,0.676],[6,0,1.02],[6,3,1.151],[6,4,1.23],[6,2,1.432],[5,2,2.082],[5,12,2.337],[5,4,2.535],[5,1,2.769],[5,11,3.229],[5,0,3.401],[5,10,3.607],[9,10,3.859]]}},"w18":{"port":{"p":[[1,0.468,-0.426],[2,-0.006,0.439],[4,-0.416,-0.235],[5,0.006,0.2],[7,-0.658,-0.521],[8,0.245,0.778],[9,-0.523,-0.382],[10,0.612,-0.592],[11,-0.025,-0.185],[12,0.172,-0.281],[13,-0.677,0.221],[14,-0.24,-0.124],[15,-0.005,0.679],[16,-0.459,0.716],[17,0.001,0]],"d":[[0,10,1.877],[0,8,2.15],[0,16,2.746],[0,13,3.19],[0,7,3.507],[6,7,3.894],[3,7,0.277],[3,10,0.819]]},"land":{"p":[[1,0.083,-0.499],[2,0.204,0.407],[4,-0.559,0.086],[5,0.103,0.208],[7,-0.833,-0.081],[8,0.437,0.694],[9,-0.687,-0.029],[10,0.147,-0.701],[11,-0.233,0.01],[12,-0.13,-0.174],[13,-0.601,0.592],[14,-0.122,0.162],[15,0.308,0.579],[16,-0.385,0.664],[17,0.001,0]],"d":[[0,10,1.352],[0,8,2.033],[0,16,2.269],[0,13,2.752],[0,7,3.608],[6,7,3.88],[3,7,0.279],[3,10,0.362]]}},"w9":{"port":{"p":[[0,0.001,0.001],[2,-0.481,0.374],[3,0.004,0.65],[5,0.483,0.372],[7,0.365,-0.495],[8,-0.436,-0.437]],"d":[[4,7,0.945],[4,5,1.822],[4,3,2.336],[1,3,2.61],[6,3,3.167],[6,2,3.397],[6,8,3.943],[6,7,0.074]]},"land":{"p":[[0,-0.002,0],[2,-0.573,0.351],[3,0.358,0.491],[5,0.677,0.028],[7,0.373,-0.479],[8,-0.496,-0.406]],"d":[[4,7,0.649],[4,5,1.649],[4,3,2.182],[1,3,2.731],[6,3,3.026],[6,2,3.197],[6,8,0.049],[6,7,0.218]]}}};
  // ---------------- board: a 2D cartoon island (SVG), drawn like the title screen ----------------
  // Tiles are the title screen's chunky element tiles (regular v-gons, v = degree, turned to face their neighbours),
  // joined by ladder bridges on a sandy island in a blue sea. The three far-side vertices are walls along the coast;
  // each tile next to a wall docks at its own point of it. The "?" goal sits in the middle with ghost ladders to its
  // five rim tiles. When a level opens the island grows out from the goal under a live force simulation (springs on
  // every bridge, k/d^2 repulsion between tiles, velocity damping .82, as in the Kempe-class growth demo) and settles
  // on a planar layout. That layout was found offline by the same kind of force layout (Tutte start, springs, repulsion,
  // rim ring, moves that never turn a face over) followed by annealing that makes the smallest gap as big as possible.

  function create(S) {
    const { HEX, DARK, NEONH, NAMES, IPATH, reduced, blip, note, msg, uiSetE, uiBurst, uiPop, compassTile, compassActive, partialChain, rimCols } = S;
    const SX = S.sfx || new Proxy({}, { get: () => () => {} });                   // win-scene sound effects (sfx.js); silent in headless checks
    const $ = id => document.getElementById(id), svg = S.headless ? null : $('cv');   // S.headless: no DOM (tools/free_check.js)
    let L, Gr, n, hole, link, adj, col, chains, chainAt, found, traced, active, trace, lastPartial;
    function sync() { ({ L, Gr, n, hole, link, adj, col, chains, chainAt, found, traced, active, trace, lastPartial } = S.view()); }
  const LADW = 4.2, WGAP = 60;                     // ladder half-width, gap between walls (px)
  let WB = 56;                                      // wall band width (centred on the coast): set per board to one tile's width
  let BW = 0, BH = 0, holeFill = -1, fingerPt = null, looping = false, cer = null, cerLight = null, scene = false;   // cer: the hole-filling ceremony; scene: the win scene is on (no hint / lock overlays)
  let T = [], bridgesM = [], ghosts = [], waves = [], hoverU = -1, BOX = null, LAYO = null, SIM = null, gFx = null;
  const shakes = new Map(), anim = new Map();
  function shake(u) { if (T[u] && T[u].kind === 'tile') shakes.set(u, performance.now()); else if (T[u]) blip(120, .1, 'square', .02); kick(); }
  // ---------- island geometry: a superellipse |x/a|^3 + |y/b|^3 = 1 round (cx, cy) ----------
  const SEP = 3;
  const seR = th => Math.pow(Math.pow(Math.abs(Math.cos(th)), SEP) + Math.pow(Math.abs(Math.sin(th)), SEP), -1 / SEP);
  function sqToIsland(q, box) {                     // unit square -> island, radially (the square's border lands on the coast)
    const th = Math.atan2(q[1], q[0]), rSq = 1 / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th)), 1e-9), k = seR(th) / rSq;
    return [box.cx + q[0] * k * box.a, box.cy + q[1] * k * box.b];
  }
  function sqPerim(t) { t = ((t % 4) + 4) % 4; const q = Math.floor(t), f = t - q; return [[-1 + 2 * f, -1], [1, -1 + 2 * f], [1 - 2 * f, 1], [-1, 1 - 2 * f]][q]; }
  function coastPath(box, k, grow) {
    const b2 = { cx: box.cx, cy: box.cy, a: box.a + grow, b: box.b + grow };
    let d = ''; for (let i = 0; i < k; i++) { const q = sqToIsland(sqPerim(4 * i / k), b2); d += (i ? 'L' : 'M') + q1(q[0]) + ' ' + q1(q[1]); } return d + 'Z';
  }
  function segDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]); }
  const polyDist = (p, pts) => { let m = Infinity; for (let i = 1; i < pts.length; i++) m = Math.min(m, segDist(p, pts[i - 1], pts[i])); return m; };
  // where the ray from a tile's centre in direction (ux, uy) leaves its regular polygon, plus a gap
  function edgePoint(c, Rr, v, phi, ux, uy, gap) {
    let best = Rr;
    for (let i = 0; i < v; i++) {
      const a0 = phi + 2 * Math.PI * (i + .5) / v, a1 = phi + 2 * Math.PI * (i + 1.5) / v;
      const p = [Rr * Math.cos(a0), Rr * Math.sin(a0)], q = [Rr * Math.cos(a1), Rr * Math.sin(a1)], e = [q[0] - p[0], q[1] - p[1]];
      const den = ux * e[1] - uy * e[0]; if (Math.abs(den) < 1e-9) continue;
      const t = (p[0] * e[1] - p[1] * e[0]) / den, w = (p[0] * uy - p[1] * ux) / den;
      if (t > 0 && w >= -1e-6 && w <= 1 + 1e-6) best = Math.min(best, t);
    }
    return [c[0] + ux * (best + gap), c[1] + uy * (best + gap)];
  }
  function islandBox() {                            // the island fills the board above the chain tray and message bubble
    if (freeOn()) { const top = 22, bot = BH - (BH > 480 ? 160 : BH * .33), b = (bot - top) / 2; return { cx: BW / 2, cy: (top + bot) / 2, a: Math.min(BW / 2 - 20, b * 1.7), b }; }   // never wider than 1.7 : 1   // free borders: no walls, the whole window, a thin ring of sea
    const bottom = BH > 480 ? 160 : BH * .33, H = BH - bottom - 10, W = BW - 20, inset = 5 + WB / 2 - 13;   // the walls' outer half stays on screen
    let b = H / 2 - inset, a = W / 2 - inset; a = Math.min(a, b * 1.7); b = Math.min(b, a * 1.35);
    return { cx: BW / 2, cy: 10 + H / 2, a, b };
  }
  // a tile is a regular polygon with one side per neighbour; the small Level -1 maps have tiles of degree 1 or 2: squares
  // (and degree 3 too: their big triangles would crowd the few bridges)
  const sidesOf = u => u === hole ? 5 : Gr.rot[u].length < (Gr.onboard ? 4 : 3) ? 4 : Gr.rot[u].length;
  // ---------- the layout for this map and board: positions, docks, walls, tile sizes ----------
  function boardGeometry(box) {
    const Lay = window.LAYOUT[L.g], border = new Set(Lay.border), rot = Gr.rot;
    const inner = [], tiles = []; for (let u = 0; u < n; u++) if (!border.has(u)) { inner.push(u); if (u !== hole) tiles.push(u); }
    const pre = BOARD2D[L.g], asp = box.b / box.a;
    const v = pre && (Math.abs(Math.log(asp / 1.227)) <= Math.abs(Math.log(asp / .633)) ? pre.port : pre.land);
    const C = [], docks = [];
    if (v) {
      v.p.forEach(([u, x, y]) => { C[u] = [box.cx + x * box.a, box.cy + y * box.b]; });
      v.d.forEach(([w, u, t]) => docks.push({ w, u, T: t }));
    } else {                                         // no precomputed layout: the hole-centred drawing, docks spread along the drawing's arcs
      inner.forEach(u => { C[u] = sqToIsland(Lay.centre[u], box); }); C[hole] = [box.cx, box.cy];
      Lay.border.slice().sort((x, y) => Lay.arcs[x][0] - Lay.arcs[y][0]).forEach((w, i, W3) => {
        const r = rot[w], k = r.length, i0 = r.findIndex((x, j) => border.has(x) && !border.has(r[(j + 1) % k]));
        const run = []; let j = (i0 + 1) % k; while (!border.has(r[j])) { run.push(r[j]); j = (j + 1) % k; }
        const seq = r[i0] === W3[(i + 2) % 3] ? run : run.reverse(); let [t1, t2] = Lay.arcs[w]; if (t2 < t1) t2 += 4;
        seq.forEach((u, m) => docks.push({ w, u, T: t1 + (t2 - t1) * (m + 1) / (seq.length + 1) }));
      });
    }
    const anchor = {}, W3 = []; docks.forEach(d => { if (!W3.includes(d.w)) { W3.push(d.w); anchor[d.w] = {}; } anchor[d.w][d.u] = sqToIsland(sqPerim(d.T), box); });
    // walls: each from halfway after the previous wall's last dock to halfway before the next wall's first, gaps between
    let Lc = 0; { let pr = sqToIsland(sqPerim(0), box); for (let i = 1; i <= 120; i++) { const q = sqToIsland(sqPerim(4 * i / 120), box); Lc += Math.hypot(q[0] - pr[0], q[1] - pr[1]); pr = q; } }
    const GAP = WGAP * 4 / Lc, U = docks.length ? [docks[0].T] : [], wallBand = {}, wallStripe = {}; for (let i = 1; i < docks.length; i++) U.push(U[i - 1] + ((((docks[i].T - docks[i - 1].T) % 4) + 4) % 4));
    const wallPts = {}, endTo = {};
    W3.forEach((w, i) => {
      const idx = docks.map((d, j) => d.w === w ? j : -1).filter(j => j >= 0), f = U[idx[0]], l = U[idx[idx.length - 1]];
      const p = idx[0] > 0 ? U[idx[0] - 1] : U[U.length - 1] - 4, q = idx[idx.length - 1] < U.length - 1 ? U[idx[idx.length - 1] + 1] : U[0] + 4;
      const t1 = (p + f) / 2 + GAP / 2, t2 = (l + q) / 2 - GAP / 2, pts = [];
      for (let j = 0; j <= 40; j++) pts.push(sqToIsland(sqPerim(t1 + (t2 - t1) * j / 40), box));
      // the band: the coast grown and shrunk by half its width, square-ended; the neon stripe stops short of the ends
      const bo = { cx: box.cx, cy: box.cy, a: box.a + WB / 2, b: box.b + WB / 2 }, bi = { cx: box.cx, cy: box.cy, a: box.a - WB / 2, b: box.b - WB / 2 }, band = [], s1 = t1 + WB * .3 * 4 / Lc, s2 = t2 - WB * .3 * 4 / Lc, str = [];
      for (let j = 0; j <= 40; j++) band.push(sqToIsland(sqPerim(t1 + (t2 - t1) * j / 40), bo));
      for (let j = 40; j >= 0; j--) band.push(sqToIsland(sqPerim(t1 + (t2 - t1) * j / 40), bi));
      if (s2 > s1) for (let j = 0; j <= 40; j++) str.push(sqToIsland(sqPerim(s1 + (s2 - s1) * j / 40), box));
      wallBand[w] = band; wallStripe[w] = str.length ? str : [pts[20], pts[20]];
      wallPts[w] = pts; endTo[w] = { [W3[(i + 2) % 3]]: pts[0], [W3[(i + 1) % 3]]: pts[40] };
    });
    // tile size: as big as the room allows (a ladder's gap between any two tiles, clear of every bridge and the coast)
    const beta = u => (1 + 1 / Math.cos(Math.PI / sidesOf(u))) / 2;
    const segs = []; tiles.forEach(u => rot[u].forEach(w => { if (border.has(w)) segs.push([u, w, C[u], anchor[w][u]]); else if (w > u || w === hole) segs.push([u, w, C[u], C[w]]); }));
    let ap = Math.min(52, Math.min(box.a, box.b) * .2);
    for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) { const u = tiles[i], w = tiles[j]; ap = Math.min(ap, (Math.hypot(C[u][0] - C[w][0], C[u][1] - C[w][1]) - 12) / (beta(u) + beta(w))); }
    segs.forEach(([u, w, a, b]) => tiles.forEach(x => { if (x !== u && x !== w) ap = Math.min(ap, (segDist(C[x], a, b) - 4) / beta(x)); }));
    docks.forEach(d => { const t = anchor[d.w][d.u]; ap = Math.min(ap, Math.hypot(t[0] - C[d.u][0], t[1] - C[d.u][1]) - WB / 2 - 8); });
    ap = Math.max(ap, 8);
    const R = []; tiles.forEach(u => { R[u] = ap / Math.cos(Math.PI / sidesOf(u)); });
    let hap = ap * 1.3; tiles.forEach(x => { const d = Math.hypot(C[x][0] - C[hole][0], C[x][1] - C[hole][1]) - ap * beta(x) - (link.includes(x) ? 16 : 6); hap = Math.min(hap, d / 1.118); });
    R[hole] = Math.max(ap * .75, hap) / Math.cos(Math.PI / 5);
    const phi = [];                                  // each tile turned so its sides face its neighbours
    inner.forEach(u => {
      const nb = u === hole ? link : rot[u], k = nb.length;
      const th = nb.map(w => { const t = border.has(w) ? anchor[w][u] : C[w]; return Math.atan2(t[1] - C[u][1], t[0] - C[u][0]); }).sort((x, y) => x - y);
      let sx = 0, sy = 0; th.forEach((a, i) => { const d = (a - 2 * Math.PI * i / k) * k; sx += Math.cos(d); sy += Math.sin(d); });
      phi[u] = Math.atan2(sy, sx) / k - Math.PI / k;
    });
    return { C, docks, anchor, wallPts, wallBand, wallStripe, endTo, W3, ap, R, phi, inner, tiles, border };
  }
  // ---------- free borders (every level; the dev panel can switch back to walls) ----------
  // The three far-side regions stop being fixed walls and become small island tiles like the rest; the whole map then
  // settles like bubbles (freeStep): each tile a soft disc that pushes away any it overlaps, links as gentle springs,
  // the coast as a wall, so the tiles spread into an even, Voronoi-like packing. Ladders may cross while it settles.
  const FREE = { on: false };                        // walls by default; the dev panel can switch free borders on while tuning
  const freeAllowed = () => !!L;
  const freeOn = () => FREE.on && freeAllowed();
  function freeGeometry(G) {
    const C = [], all = [], tiles = [];
    for (let u = 0; u < n; u++) { all.push(u); if (u !== hole) tiles.push(u); }
    // start: rings round the goal by graph distance, each ring's tiles in the order the map's own drawing puts them round it,
    // evenly spaced, on ellipses that share the island out by area. Every map gets an even, planar-ish start, so the
    // bubbles (freeStep) only have to iron out small overlaps and settle quickly.
    const lay = window.LAYOUT && window.LAYOUT[L.g], cen = lay && lay.centre, rg = new Array(n).fill(-1); rg[hole] = 0;
    for (let q = [hole], i = 0; i < q.length; i++) adj[q[i]].forEach(w => { if (rg[w] < 0) { rg[w] = rg[q[i]] + 1; q.push(w); } });
    const rings = []; all.forEach(u => { if (u !== hole) (rings[rg[u]] = rings[rg[u]] || []).push(u); });
    const th0 = u => cen ? Math.atan2(cen[u][1] - cen[hole][1], cen[u][0] - cen[hole][0]) : Math.atan2(G.C[u][1] - G.C[hole][1], G.C[u][0] - G.C[hole][0]);
    const reach = .88; let cum = 0; C[hole] = [BOX.cx, BOX.cy];
    rings.forEach((ring, k) => {
      if (!ring) return; ring.sort((x, y) => th0(x) - th0(y));
      const f = reach * Math.sqrt((cum + ring.length / 2) / (n - 1)), m = ring.length; cum += m;
      let o = 0; { let sx = 0, sy = 0; ring.forEach((u, i) => { const d = th0(u) - 2 * Math.PI * i / m; sx += Math.cos(d); sy += Math.sin(d); }); o = Math.atan2(sy, sx); }   // the even spacing that best fits the drawing's angles
      ring.forEach((u, i) => { const a = o + 2 * Math.PI * i / m; C[u] = [BOX.cx + BOX.a * f * Math.cos(a), BOX.cy + BOX.b * f * Math.sin(a)]; });
    });
    const ap = Math.max(8, Math.min(30, bubbleR() * .65 * Math.cos(Math.PI / Math.min(...tiles.map(u => Math.max(4, sidesOf(u))))))), R = [], phi = [];   // a tile's corners fit inside .65 of its bubble, leaving room for a ladder between neighbours
    tiles.forEach(u => { R[u] = ap / Math.cos(Math.PI / Math.max(4, sidesOf(u))); }); R[hole] = ap * 1.3 / Math.cos(Math.PI / 5);   // triangles kept from swelling
    all.forEach(u => {
      const nb = u === hole ? link : Gr.rot[u], k = nb.length;
      const th = nb.map(w => Math.atan2(C[w][1] - C[u][1], C[w][0] - C[u][0])).sort((x, y) => x - y);
      let sx = 0, sy = 0; th.forEach((a, i) => { const d = (a - 2 * Math.PI * i / k) * k; sx += Math.cos(d); sy += Math.sin(d); });
      phi[u] = Math.atan2(sy, sx) / k - Math.PI / k;
    });
    return { C, docks: [], anchor: {}, wallPts: {}, wallBand: {}, wallStripe: {}, endTo: {}, W3: [], ap, R, phi, inner: all, tiles, border: new Set(), free: true, wall0: G.W3.slice() };
  }
  // ---------- the live layout: grow out from the goal and settle (springs, k/d^2 repulsion, damping .82) ----------
  const SIM_STEPS = 75;
  function startSim(grow) {
    const tg = LAYO.C, h = tg[hole], P = [], V = [];
    LAYO.inner.forEach((u, i) => {
      const f = grow && !reduced && u !== hole ? .28 : 1, j = grow && u !== hole ? 3 * Math.sin(i * 12.9898) : 0;
      P[u] = [h[0] + (tg[u][0] - h[0]) * f + j, h[1] + (tg[u][1] - h[1]) * f - j]; V[u] = [0, 0];
    });
    const E = []; LAYO.tiles.forEach(u => Gr.rot[u].forEach(w => { if (w > u && !LAYO.border.has(w) && w !== hole) E.push([u, w, Math.hypot(tg[u][0] - tg[w][0], tg[u][1] - tg[w][1])]); }));
    SIM = { t0: performance.now(), steps: 0, done: !(grow && !reduced), P, V, E };
    liveInit();
  }
  function simStep() {
    const { P, V, E } = SIM, tg = LAYO.C, F = [], ap = LAYO.ap, tl = LAYO.tiles;
    tl.forEach(u => { F[u] = [(tg[u][0] - P[u][0]) * .035, (tg[u][1] - P[u][1]) * .035]; });     // each tile's home
    E.forEach(([u, w, L0]) => {                      // bridges: springs towards their settled length
      const dx = P[w][0] - P[u][0], dy = P[w][1] - P[u][1], d = Math.hypot(dx, dy) || 1e-6, k = .05 * (d - L0) / d;
      F[u][0] += dx * k; F[u][1] += dy * k; F[w][0] -= dx * k; F[w][1] -= dy * k;
    });
    for (let i = 0; i < tl.length; i++) for (let j = i + 1; j < tl.length; j++) {   // repulsion f = k / d^2
      const u = tl[i], w = tl[j], dx = P[w][0] - P[u][0], dy = P[w][1] - P[u][1], d2 = Math.max(dx * dx + dy * dy, ap * ap), f = 1.5 * ap * ap / d2 / Math.sqrt(d2);
      F[u][0] -= dx * f; F[u][1] -= dy * f; F[w][0] += dx * f; F[w][1] += dy * f;
    }
    tl.forEach(u => { const v = V[u]; v[0] = (v[0] + F[u][0]) * .82; v[1] = (v[1] + F[u][1]) * .82; P[u][0] += v[0]; P[u][1] += v[1]; });
  }
  function syncPos(now) {                          // time-based, so positions are right even if frames were skipped
    if (!SIM || SIM.done) return false;
    const want = Math.min(SIM_STEPS, Math.floor((now - SIM.t0) / 16.7));
    while (SIM.steps < want) { simStep(); SIM.steps++; }
    if (SIM.steps >= SIM_STEPS) { LAYO.inner.forEach(u => { SIM.P[u] = LAYO.C[u].slice(); }); SIM.done = true; placeAll(); SIM.placed = true; }
    return true;
  }
  const posOf = u => T[u].kind === 'wall' ? T[u].c : SIM.P[u];
  // ---------- live springs: once settled, the island stays a little alive ----------
  // Every tile hangs off its home (the layout, or wherever the player dragged it) on a damped spring, and every bridge is
  // a spring that keeps its home shape, so the network moves as one piece. Tiles of one element push each other gently
  // apart (and away from a wall of their element); tracing a link tugs its two tiles together, and their neighbours a
  // little (the ladder's rungs bunch up like a spring's coils, then spread back); the captured or half-traced chain stays
  // slightly pulled in; swapped tiles get a shove from their new like-coloured neighbours. Each tile's swing off its home
  // is capped at 15% of the tile spacing, and every step is checked against the map's constraints (tile-tile room,
  // tile-ladder room, coast room, and the height of every triangle of the map, as the layout tools keep them): a tile
  // whose move would break one stays where it was, so tiles never overlap, no ladder runs over a tile and no face turns
  // over (the drawing stays planar). SIM.P is the drawn position and picking uses it, so hits match what is on screen.
  // Press and hold a tile to move it: its home follows the finger (its neighbours' homes follow at .4 and .15), but only
  // as far as every constraint allows (it slides along whatever blocks it), and on release the springs settle fast.
  const LIVE = { kH: .06, kB: .02, damp: .8, cap: .3, rep: 1.6, pull: .5, tug: .7,   // home spring, bridge spring, velocity damping, swing cap (x spacing), repulsion, chain pull, trace tug
    guard: true, fk: .02, fr: .8, fl: 1 };          // crossing guard on; free layout: link spring, push apart, spread (x natural spacing)
  let HOME = null, LV = null;
  window.__live = () => ({ LV, HOME, SIM, LIVE, dragBegin, dragMove, dragEnd, liveTick, liveBroken, placeAll });   // for tests
  function liveInit() {
    const rot = Gr.rot, bd = LAYO.border, inn = LAYO.inner, tl = LAYO.tiles, A = LAYO.anchor;
    HOME = []; inn.forEach(u => { HOME[u] = LAYO.C[u].slice(); });
    const rad = []; inn.forEach(u => { const v = u === hole ? 5 : rot[u].length; rad[u] = LAYO.R[u] * (1 + Math.cos(Math.PI / v)) / 2; });
    // constraints, each a function of a position array X (the homes, or the drawn positions SIM.P), never below its base
    const at = (X, x) => typeof x === 'number' ? X[x] : x, isT = x => typeof x === 'number' && x !== hole;
    const segs = [], E = [], cons = [], add = (m, f, base) => { cons.push({ m: m.filter(isT), f, goal: base, base: Math.min(base, f(HOME)) - 1e-6 }); };
    tl.forEach(u => rot[u].forEach(w => { if (bd.has(w)) segs.push([u, A[w][u]]); else if (w > u || w === hole) { segs.push([u, w]); if (w !== hole) E.push([u, w]); } }));
    LAYO.W3.forEach((w, i) => { const x = LAYO.W3[(i + 1) % 3]; if (rot[w].includes(x)) segs.push([LAYO.endTo[w][x], LAYO.endTo[x][w]]); });
    for (let i = 0; i < inn.length; i++) for (let j = i + 1; j < inn.length; j++) { const u = inn[i], w = inn[j]; add([u, w], X => Math.hypot(X[u][0] - X[w][0], X[u][1] - X[w][1]) - rad[u] - rad[w], 2); }
    segs.forEach(([a, b]) => tl.forEach(w => { if (w !== a && w !== b) add([w, a, b], X => segDist(X[w], at(X, a), at(X, b)) - rad[w], 1); }));
    const fk = new Set();
    let LV0sg = 1;                                   // the turn of the map's inner faces, read off one face clear of the far regions
    if (LAYO.free) outer: for (const u of inn) { if (u === hole || LAYO.wall0.includes(u)) continue; const r = rot[u];
      for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; if ([a, b].some(x => x === hole || LAYO.wall0.includes(x)) || !rot[a].includes(b)) continue;
        const p = HOME[u], q = HOME[a], t = HOME[b], c = (q[0] - p[0]) * (t[1] - p[1]) - (q[1] - p[1]) * (t[0] - p[0]); if (c) { LV0sg = Math.sign(c); break outer; } } }
    inn.forEach(u => { const r = rot[u], k = r.length; for (let i = 0; i < k; i++) {
      const a = r[i], b = r[(i + 1) % k]; if (!rot[a] || !rot[a].includes(b)) continue;
      let tri; if (!bd.has(a) && !bd.has(b)) { const key = [u, a, b].sort((x, y) => x - y).join(); if (fk.has(key)) continue; fk.add(key); tri = [u, a, b]; }
      else tri = [u, bd.has(a) ? A[a][u] : a, bd.has(b) ? A[b][u] : b];
      if (tri.some(x => !at(HOME, x))) continue;
      const cr = (p, q, s) => (q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]);
      // free borders start from a rough drawing, so a face's true turn comes from the map itself (every inner face turns
      // one way, the outer face of the three far regions the other), not from where the tiles happen to start
      const sg = LAYO.free ? (tri.every(x => LAYO.wall0.includes(x)) ? -LV0sg : LV0sg) : Math.sign(cr(at(HOME, tri[0]), at(HOME, tri[1]), at(HOME, tri[2]))); if (!sg) continue;
      for (let j = 0; j < 3; j++) { const p0 = tri[j], p1 = tri[(j + 1) % 3], p2 = tri[(j + 2) % 3];
        add([p0, p1, p2], X => { const p = at(X, p0), q = at(X, p1), s = at(X, p2); return sg * cr(p, q, s) / (Math.hypot(s[0] - q[0], s[1] - q[1]) || 1e-9); }, 2); cons[cons.length - 1].face = 1; }
    } });
    tl.forEach(u => add([u], X => { const x = X[u][0] - BOX.cx, y = X[u][1] - BOX.cy, f = Math.pow(Math.abs(x / BOX.a), SEP) + Math.pow(Math.abs(y / BOX.b), SEP);
      return f < 1e-9 ? 1e9 : Math.hypot(x, y) * (Math.pow(f, -1 / SEP) - 1) - (LAYO.free ? 3 : WB / 2) - rad[u]; }, 2));
    // free borders: only the no-crossing rule is hard (every face keeps its turn); spacing is left to the push-apart
    // force, since a crowded start would otherwise lock every tile in place. Faces start with little margin and keep
    // whatever room they win (the ratchet in freeStep).
    if (LAYO.free) cons.forEach(c => { c.base = c.face ? Math.min(.3, c.base) : -Infinity; });
    const byT = []; tl.forEach(u => { byT[u] = []; }); cons.forEach((c, i) => c.m.forEach(u => byT[u].push(i)));
    const bl = E.map(([u, w]) => Math.hypot(HOME[u][0] - HOME[w][0], HOME[u][1] - HOME[w][1])).sort((x, y) => x - y), sp = bl.length ? bl[bl.length >> 1] : LAYO.ap * 3;
    const FE = []; inn.forEach(u => rot[u].forEach(w => { if (w > u && HOME[w]) FE.push([u, w]); }));   // free layout: every link
    LV = { rb: LAYO.free ? bubbleR() : 0, cons, byT, E, FE, sp, cap0: LIVE.cap * sp, V: [], col: col.slice(), seen: new Map(), kick: [], stuck: [], drag: null, settle: 0, t: 0, acc: 0, dirty: true };
    tl.forEach(u => { LV.V[u] = [0, 0]; LV.kick[u] = 0; LV.stuck[u] = 0; });
  }
  function liveOk(M) {                             // do the homes of the tiles in M (and everything round them) keep every constraint?
    const seen = new Set();
    for (const u of M.keys()) for (const i of LV.byT[u]) { if (seen.has(i)) continue; seen.add(i); const c = LV.cons[i]; if (!(c.f(HOME) >= c.base)) return false; }
    return true;
  }
  function liveBroken(X) {                         // the tiles in a constraint that the drawn positions X break
    const bad = new Set(); LV.cons.forEach(c => { if (c.m.length && !(c.f(X) >= c.base)) c.m.forEach(u => bad.add(u)); }); return bad;
  }
  function liveEdges() {                           // the links pulled in: the chain being traced (its traced part), else the captured one
    if (trace && trace.comp) { const s = traced.get(trace.comp.key); return s ? trace.comp.edges.filter(([a, b]) => s.has(a) && s.has(b)) : []; }
    const K = active && chains.find(c => c.key === active); return K ? K.edges : [];
  }
  function nearestOn(p, pts) { let best = pts[0], bd = Infinity; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; t = Math.max(0, Math.min(1, t)); const q = [a[0] + dx * t, a[1] + dy * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } } return best; }
  function liveTug(u, p) {                         // a link just traced: its ends jump towards each other, their neighbours follow a bit
    if (reduced) return;
    const pu = T[u].kind === 'wall' ? LAYO.anchor[u][p] : SIM.P[u], pp = T[p].kind === 'wall' ? LAYO.anchor[p][u] : SIM.P[p]; if (!pu || !pp) return;
    const dx = pp[0] - pu[0], dy = pp[1] - pu[1], d = Math.hypot(dx, dy) || 1e-6, I = LV.cap0 * LIVE.tug, ux = dx / d * I, uy = dy / d * I;
    const push = (x, s) => { const v = LV.V[x]; if (v && !(LV.drag && LV.drag.u === x)) { v[0] += ux * s; v[1] += uy * s; } };
    push(u, 1); push(p, -1); adj[u].forEach(x => { if (x !== p) push(x, .3); }); adj[p].forEach(x => { if (x !== u) push(x, -.3); });
  }
  function liveWatch() {                           // what changed since the last frame: swapped colours, newly traced links
    LAYO.tiles.forEach(u => { if (LV.col[u] !== col[u]) { LV.col[u] = col[u]; LV.kick[u] = 4; } });
    traced.forEach((set, k) => {
      let o = LV.seen.get(k);
      if (!o) { o = new Set(set.size > 2 ? set : []); LV.seen.set(k, o); if (set.size > 2) return; }
      if (set.size < o.size) { LV.seen.set(k, new Set(set)); return; }
      if (set.size === o.size) return;
      const path = trace && trace.comp && trace.comp.key === k ? trace.path : null;
      const order = path ? [...new Set(path.filter(x => set.has(x)).concat([...set]))] : [...set];
      order.forEach(u => { if (o.has(u)) return; let p = -1;
        if (path) { const i = path.indexOf(u); if (i > 0) p = path[i - 1]; }
        if (p < 0 || !adj[u].includes(p) || !o.has(p)) { const q = [...o].find(x => adj[u].includes(x)); p = q === undefined ? -1 : q; }
        o.add(u); if (p >= 0) liveTug(u, p); });
    });
    [...LV.seen.keys()].forEach(k => { if (!traced.has(k)) LV.seen.delete(k); });
  }
  function bubbleR() {                             // the radius at which n bubbles fill 86% of the island less a coast margin of .9 radius (the island's area is 3.53ab)
    const a = BOX.a, b = BOX.b; let lo = 4, hi = Math.min(a, b);
    for (let i = 0; i < 24; i++) { const r = (lo + hi) / 2; if (n * 3.464 * r * r > .86 * 3.534 * Math.max(0, a - .9 * r) * Math.max(0, b - .9 * r)) hi = r; else lo = r; }
    return lo;
  }
  function presettle() {                           // run the bubbles to rest offline, so the island opens already settled (the grow-in then plays towards the settled layout)
    let calm = 0, i = 0; for (; i < 1200 && calm < 10; i++) calm = freeStep(0) < .05 ? calm + 1 : 0;
    LAYO.inner.forEach(u => { LAYO.C[u] = SIM.P[u].slice(); }); LAYO.pre = i;
  }
  function freeStep(now) {                         // dev, free borders: soft bubbles settling into an even packing
    const P = SIM.P, tl = LAYO.tiles, all = LAYO.inner, F = [], G = LV.drag;
    const r0 = LV.rb * LIVE.fl, D2 = 2 * r0;         // bubble radius: a hexagonal packing that fills 86% of the room the coast leaves (fl 1); the goal's bubble is 25% wider
    all.forEach(u => { F[u] = [0, 0]; });
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {   // overlapping bubbles push apart
      const u = all[i], w = all[j], dx = P[w][0] - P[u][0], dy = P[w][1] - P[u][1], d = Math.hypot(dx, dy) || 1e-6, Dp = u === hole || w === hole ? D2 * 1.125 : D2; if (d >= Dp) continue;
      const f = LIVE.fr * .25 * (Dp - d) / d; F[u][0] -= dx * f; F[u][1] -= dy * f; F[w][0] += dx * f; F[w][1] += dy * f;
    }
    LV.FE.forEach(([u, w]) => {                     // links: a loose leash, taut only beyond 1.5 bubble widths (a tighter one crowds tiles together)
      const dx = P[w][0] - P[u][0], dy = P[w][1] - P[u][1], d = Math.hypot(dx, dy) || 1e-6; if (d <= D2 * 1.5) return;
      const f = LIVE.fk * (d - D2 * 1.5) / d; F[u][0] += dx * f; F[u][1] += dy * f; F[w][0] -= dx * f; F[w][1] -= dy * f;
    });
    const KC = .02 * r0; liveEdges().forEach(([a, b]) => { if (!F[a] || !F[b]) return; const dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1], d = Math.hypot(dx, dy) || 1e-6; F[a][0] += dx / d * KC; F[a][1] += dy / d * KC; F[b][0] -= dx / d * KC; F[b][1] -= dy / d * KC; });
    const old = []; tl.forEach(u => { old[u] = P[u].slice(); });
    tl.forEach(u => {
      const v = LV.V[u], p = P[u];
      if (G && G.u === u) { p[0] = HOME[u][0]; p[1] = HOME[u][1]; v[0] = v[1] = 0; return; }
      v[0] = (v[0] + F[u][0]) * LIVE.damp; v[1] = (v[1] + F[u][1]) * LIVE.damp;
      const l = Math.hypot(v[0], v[1]), c = r0 * .25; if (l > c) { v[0] *= c / l; v[1] *= c / l; }
      p[0] += v[0]; p[1] += v[1];
      // the coast: a bubble stays a radius inside the island's edge
      const x = p[0] - BOX.cx, y = p[1] - BOX.cy, f = Math.pow(Math.abs(x / BOX.a), SEP) + Math.pow(Math.abs(y / BOX.b), SEP);
      if (f > 1e-9) { const dist = Math.hypot(x, y), edge = dist * Math.pow(f, -1 / SEP), lim = edge - r0 * .9; if (dist > lim) { p[0] = BOX.cx + x * lim / dist; p[1] = BOX.cy + y * lim / dist; v[0] *= .3; v[1] *= .3; } }
    });
    for (let it = 0; it < 2; it++) {                // a hard floor under the soft push: two tiles never overlap while there is room (the goal and a held tile stay put)
      let moved = false;
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const u = all[i], w = all[j], dx = P[w][0] - P[u][0], dy = P[w][1] - P[u][1], d = Math.hypot(dx, dy) || 1e-6, dm = (LAYO.R[u] + LAYO.R[w]) * .92; if (d >= dm) continue;
        const fu = u === hole || (G && G.u === u) ? 0 : 1, fw = w === hole || (G && G.u === w) ? 0 : 1, t = fu + fw; if (!t) continue;
        const k = (dm - d) / d / t; P[u][0] -= dx * k * fu; P[u][1] -= dy * k * fu; P[w][0] += dx * k * fw; P[w][1] += dy * k * fw; moved = true;
      }
      if (!moved) break;
      tl.forEach(u => { const p = P[u], x = p[0] - BOX.cx, y = p[1] - BOX.cy, f = Math.pow(Math.abs(x / BOX.a), SEP) + Math.pow(Math.abs(y / BOX.b), SEP);
        if (f > 1e-9) { const dist = Math.hypot(x, y), lim = dist * Math.pow(f, -1 / SEP) - LAYO.R[u]; if (dist > lim) { p[0] = BOX.cx + x * lim / dist; p[1] = BOX.cy + y * lim / dist; } } });   // and stay on the island
    }
    tl.forEach(u => { if (!(G && G.u === u)) HOME[u] = P[u].slice(); });
    let mv = 0; tl.forEach(u => { mv = Math.max(mv, Math.abs(P[u][0] - old[u][0]) + Math.abs(P[u][1] - old[u][1])); });
    return mv;
  }
  function liveStep(now) {
    if (LAYO.free) return freeStep(now);
    const P = SIM.P, tl = LAYO.tiles, F = [], st = now < LV.settle, kH = st ? .35 : LIVE.kH, damp = st ? .5 : LIVE.damp, G = LV.drag, c0 = LV.cap0;
    tl.forEach(u => { F[u] = [(HOME[u][0] - P[u][0]) * kH, (HOME[u][1] - P[u][1]) * kH]; });
    LV.E.forEach(([u, w]) => {                     // bridges: springs that keep their home shape
      const fx = (P[w][0] - P[u][0] - HOME[w][0] + HOME[u][0]) * LIVE.kB, fy = (P[w][1] - P[u][1] - HOME[w][1] + HOME[u][1]) * LIVE.kB;
      F[u][0] += fx; F[u][1] += fy; F[w][0] -= fx; F[w][1] -= fy;
    });
    if (!reduced) {
      const RR = LV.sp * 2.6, KR = LIVE.kH * c0 * LIVE.rep, KC = LIVE.kH * c0 * LIVE.pull, kk = LV.kick;
      for (let i = 0; i < tl.length; i++) for (let j = i + 1; j < tl.length; j++) {   // like colours repel
        const u = tl[i], w = tl[j]; if (col[u] !== col[w]) continue;
        const dx = P[w][0] - P[u][0], dy = P[w][1] - P[u][1], d = Math.hypot(dx, dy) || 1e-6; if (d >= RR) continue;
        const f = KR * (1 - d / RR) / d * (1 + kk[u] + kk[w]); F[u][0] -= dx * f; F[u][1] -= dy * f; F[w][0] += dx * f; F[w][1] += dy * f;
      }
      tl.forEach(u => LAYO.W3.forEach(w => { if (col[w] !== col[u]) return;
        const q = nearestOn(P[u], T[w].pts), dx = P[u][0] - q[0], dy = P[u][1] - q[1], d = Math.hypot(dx, dy) || 1e-6, dd = Math.max(0, d - WB / 2); if (dd >= RR) return;
        const f = KR * (1 - dd / RR) / d * (1 + kk[u]); F[u][0] += dx * f; F[u][1] += dy * f; }));
      liveEdges().forEach(([a, b]) => {           // the chain's links pull in
        const wa = T[a].kind === 'wall', wb = T[b].kind === 'wall'; if (wa && wb) return;
        const pa = wa ? LAYO.anchor[a][b] : P[a], pb = wb ? LAYO.anchor[b][a] : P[b]; if (!pa || !pb) return;
        const dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy) || 1e-6;
        if (F[a]) { F[a][0] += dx / d * KC; F[a][1] += dy / d * KC; } if (F[b]) { F[b][0] -= dx / d * KC; F[b][1] -= dy / d * KC; }
      });
      const Dl = activeDeco();                      // the captured chain's loose ends sway like the end of a rope
      if (Dl) Dl.leaves.forEach(([u, p]) => { if (!F[u]) return; const q = T[p].kind === 'wall' ? LAYO.anchor[p][u] : P[p]; if (!q) return;
        const dx = P[u][0] - q[0], dy = P[u][1] - q[1], d = Math.hypot(dx, dy) || 1e-6, s = LIVE.kH * c0 * .9 * Math.sin(now / 170 + u * 1.7); F[u][0] -= dy / d * s; F[u][1] += dx / d * s; });
      tl.forEach(u => { kk[u] *= .93; if (kk[u] < .01) kk[u] = 0; });
    }
    const old = []; tl.forEach(u => { old[u] = P[u].slice(); });
    tl.forEach(u => {
      const v = LV.V[u], p = P[u], h = HOME[u];
      if (G && G.u === u) { p[0] = h[0]; p[1] = h[1]; v[0] = v[1] = 0; return; }
      v[0] = (v[0] + F[u][0]) * damp; v[1] = (v[1] + F[u][1]) * damp;
      let x = p[0] + v[0] - h[0], y = p[1] + v[1] - h[1]; const l = Math.hypot(x, y), c = c0;
      if (l > c) { x *= c / l; y *= c / l; v[0] *= .6; v[1] *= .6; }
      p[0] = h[0] + x; p[1] = h[1] + y;
    });
    // no step may break a constraint (tiles overlapping, a ladder over a tile, a face turned over, a tile in the wall):
    // tiles in a broken one go back to where they were; if that is not enough, or a tile stays stuck, all go home
    let bad = LIVE.guard ? liveBroken(P) : new Set();   // dev panel can switch the guard off to see what it holds back
    for (let k = 0; k < 3 && bad.size; k++) { bad.forEach(u => { if (!(G && G.u === u)) { P[u][0] = old[u][0]; P[u][1] = old[u][1]; LV.V[u][0] = LV.V[u][1] = 0; } }); bad = liveBroken(P); }
    tl.forEach(u => { LV.stuck[u] = bad.has(u) || (Math.hypot(P[u][0] - HOME[u][0], P[u][1] - HOME[u][1]) > c0 + .01) ? LV.stuck[u] + 1 : 0; });
    if (bad.size || tl.some(u => LV.stuck[u] > 20)) tl.forEach(u => { P[u][0] = HOME[u][0]; P[u][1] = HOME[u][1]; LV.V[u][0] = LV.V[u][1] = 0; LV.stuck[u] = 0; });
    let mv = 0; tl.forEach(u => { mv = Math.max(mv, Math.abs(P[u][0] - old[u][0]) + Math.abs(P[u][1] - old[u][1])); });
    return mv;
  }
  function liveTick(now) {                         // one frame of the live springs; true if the drawing should be updated
    if (!LV || !SIM || !SIM.done) return false;
    liveWatch();
    const k = Math.min(4, Math.max(1, Math.round((now - (LV.t || now - 16.7)) / 16.7))); LV.t = now;
    let mv = 0; for (let i = 0; i < k; i++) mv = Math.max(mv, liveStep(now));
    LV.acc += mv; LV.moving = mv > .01;
    if (LV.dirty || LV.acc > .15) { LV.dirty = false; LV.acc = 0; return true; }
    return false;
  }
  function dragBegin(u, cx, cy) {                  // press and hold on a tile: pick it up
    if (!LV || !SIM || !SIM.done || !T[u] || T[u].kind !== 'tile') return false;
    const [x, y] = toWorld(cx, cy), wt = new Map();
    graphDist(u, LAYO.free ? 0 : 2).forEach((k, w) => { if (T[w] && T[w].kind === 'tile') wt.set(w, [1, .4, .15][k]); });
    LV.drag = { u, off: [HOME[u][0] - x, HOME[u][1] - y], wt, H0: new Map([...wt.keys()].map(w => [w, HOME[w].slice()])), D: [0, 0] };
    T[u].g.parentNode.appendChild(T[u].g); LV.dirty = true; ripple(u, .2, 2);
    blip(523, .06, 'triangle', .05); setTimeout(() => blip(784, .07, 'triangle', .045), 55);
    try { navigator.vibrate && navigator.vibrate(12); } catch (_) {}
    kick(); return true;
  }
  function dragMove(cx, cy) {                      // the held tile's home follows the finger as far as the map allows
    const G = LV && LV.drag; if (!G) return;
    const [x, y] = toWorld(cx, cy), h = G.H0.get(G.u), Dn = [x + G.off[0] - h[0], y + G.off[1] - h[1]], D0 = G.D;
    const put = D => { G.wt.forEach((s, w) => { const p = G.H0.get(w); HOME[w] = [p[0] + D[0] * s, p[1] + D[1] * s]; }); return !LIVE.guard || LAYO.free || liveOk(G.wt); };
    const reach = (A, B) => {                       // the furthest valid point on the way from A (valid) to B
      if (put(B)) return B;
      const mix = k => [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k];
      let lo = 0, hi = 1; for (let i = 0; i < 7; i++) { const m = (lo + hi) / 2; if (put(mix(m))) lo = m; else hi = m; }
      return mix(lo);
    };
    let D = reach(D0, Dn);                          // blocked: go as far as possible, then slide along x and along y
    if (Math.hypot(Dn[0] - D[0], Dn[1] - D[1]) > .5) { D = reach(D, [Dn[0], D[1]]); D = reach(D, [D[0], Dn[1]]); }
    put(D); G.D = D; kick();
  }
  function dragEnd() {                             // let go: the new place sticks; the springs settle fast round it
    if (!LV || !LV.drag) return;
    const u = LV.drag.u; LV.drag = null; LV.settle = performance.now() + 280; LV.dirty = true;
    blip(392, .08, 'triangle', .04); ripple(u, .12, 2); kick();
  }
  // ---------- drawing ----------
  function ladderD(a, b, w, h) {                    // rails and rungs of a ladder from a to b; h (optional) keeps its rung count,
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, px = -uy * w, py = ux * w;   // so the rungs
    const rails = 'M' + q1(a[0] + px) + ' ' + q1(a[1] + py) + 'L' + q1(b[0] + px) + ' ' + q1(b[1] + py) + 'M' + q1(a[0] - px) + ' ' + q1(a[1] - py) + 'L' + q1(b[0] - px) + ' ' + q1(b[1] - py);
    let rungs = '', k = Math.max(1, Math.round(L / 7));                         // bunch up and spread out like a spring's coils
    if (h) { if (!h.k || Math.abs(L / 7 - h.k) > 2.2) h.k = k; else k = h.k; }
    for (let i = 0; i < k; i++) { const t = (i + .5) / k, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; rungs += 'M' + q1(x + px * 1.2) + ' ' + q1(y + py * 1.2) + 'L' + q1(x - px * 1.2) + ' ' + q1(y - py * 1.2); }
    return { rails, rungs, line: 'M' + q1(a[0]) + ' ' + q1(a[1]) + 'L' + q1(b[0]) + ' ' + q1(b[1]) };
  }
  function polyPts(v, r, phi) { let s = ''; for (let i = 0; i < v; i++) { const a = phi + 2 * Math.PI * (i + .5) / v; s += q1(r * Math.cos(a)) + ',' + q1(r * Math.sin(a)) + ' '; } return s; }
  function iconPaths(size) { const sc = size / 24, off = q1(-12 * sc); return IPATH.map((d, k) => '<path class="ti ti' + k + '" d="' + d + '" transform="translate(' + off + ' ' + off + ') scale(' + q1(sc * 100) / 100 + ')"/>').join(''); }
  function tileSvg(u) {
    const isH = u === hole, v = sidesOf(u), r = LAYO.R[u], ph = LAYO.phi[u], ap = r * Math.cos(Math.PI / v), sw = q1(Math.max(1.6, r * .09));
    const face = isH ? '<text class="tq" x="0" y="' + q1(r * .06) + '" text-anchor="middle" dominant-baseline="central" fill="#fff" font-weight="900" font-size="' + q1(ap * 1.05) + '">?</text>' + iconPaths(ap * 1.1) : iconPaths(Math.min(r * .9, ap * 1.15));
    return '<polygon class="ts" points="' + polyPts(v, r, ph) + '" transform="translate(0 ' + q1(Math.max(3, r * .16)) + ')" stroke="#1c1640" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<polygon class="tb" points="' + polyPts(v, r, ph) + '" stroke="#1c1640" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      (isH ? '<polygon points="' + polyPts(v, r * .89, ph) + '" fill="none" stroke="#e9cf7c" stroke-width="' + q1(r * .06) + '"/>' : '') +
      '<polygon class="tr" points="' + polyPts(v, r * .76, ph) + '" stroke-width="' + q1(r * .1) + '"/>' +
      '<polygon class="tp" points="' + polyPts(v, r * .66, ph) + '"/>' + face;
  }
  function layoutBoard(grow, size) {               // geometry and live physics for this level and board size (no drawing: tools/free_check.js runs this alone)
    if (size) { BW = size[0]; BH = size[1]; } else { const br = $('board').getBoundingClientRect(); BW = br.width; BH = br.height; }
    if (!BW || !BH || !L) return false;
    WB = 56; BOX = islandBox(); LAYO = boardGeometry(BOX);
    if (!freeOn()) {                                 // walls as wide as a tile (flat to flat), so small screens do not get fat walls
      const w2 = Math.max(18, Math.min(56, 2 * LAYO.ap));
      if (Math.abs(w2 - WB) > 1) { WB = w2; BOX = islandBox(); LAYO = boardGeometry(BOX); }
    }
    if (freeOn()) { LAYO = freeGeometry(LAYO); startSim(false); presettle(); }   // free layout: the bubbles settle before the first frame
    startSim(grow !== false);
    return true;
  }
  function buildBoard(grow) {
    if (!layoutBoard(grow)) return;
    svg.setAttribute('viewBox', '0 0 ' + q1(BW) + ' ' + q1(BH));
    clear(svg); T = []; bridgesM = []; ghosts = [];
    // the sea, with drifting wave marks, and the island: surf, sand, grass
    const box = BOX; let sea = '<rect width="' + q1(BW) + '" height="' + q1(BH) + '" fill="#2a9fd8"/><g class="wv">';
    for (let k = 0; k < 14; k++) { const x = 10 + hash01(k, 3) * (BW - 40), y = 12 + hash01(k, 7) * (BH - 24); if (Math.pow(Math.abs(x - box.cx) / (box.a + 30), 3) + Math.pow(Math.abs(y - box.cy) / (box.b + 30), 3) < 1) continue; sea += '<path d="M' + q1(x) + ' ' + q1(y) + 'q5 -5 10 0t10 0" stroke="#fff" stroke-width="2.2" fill="none" opacity=".45" stroke-linecap="round"/>'; }
    sea += '</g><path d="' + coastPath(box, 120, 18) + '" fill="#7fd6ff" opacity=".55"/><path d="' + coastPath(box, 120, 9) + '" fill="#f7d98a" stroke="#fff3c4" stroke-width="5"/>' +
      '<path d="' + coastPath(box, 120, -3) + '" fill="#8fd36b"/>' +
      '<ellipse cx="' + q1(box.cx - box.a * .38) + '" cy="' + q1(box.cy - box.b * .55) + '" rx="' + q1(box.a * .3) + '" ry="' + q1(box.b * .07) + '" fill="#a4df7f"/>' +
      '<ellipse cx="' + q1(box.cx + box.a * .35) + '" cy="' + q1(box.cy + box.b * .6) + '" rx="' + q1(box.a * .26) + '" ry="' + q1(box.b * .06) + '" fill="#a4df7f"/>';
    svg.insertAdjacentHTML('beforeend', sea);
    const gW = mk('g', {}, svg), gB = mk('g', {}, svg), gG = mk('g', {}, svg), gT = mk('g', {}, svg); gFx = mk('g', { 'pointer-events': 'none' }, svg);
    // the walls: coloured bands along the coast, dark plate with neon edges, the element icon in the middle
    LAYO.W3.forEach(w => {
      const pts = LAYO.wallPts[w], mid = pts[20], P2 = a => a.map(p => q1(p[0]) + ',' + q1(p[1])).join(' ');
      const band = P2(LAYO.wallBand[w]), d = 'M' + LAYO.wallStripe[w].map(p => q1(p[0]) + ' ' + q1(p[1])).join('L');
      const g = mk('g', { class: 'tl wl e' + col[w] }, gW);
      g.innerHTML = '<polygon points="' + band + '" transform="translate(0 3)" style="fill:var(--d);stroke:var(--d)" stroke-width="4" stroke-linejoin="round"/>' +
        '<polygon points="' + band + '" style="fill:var(--c);stroke:#1c1640" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<path class="wr" d="' + d + '" stroke-width="' + q1(WB * .4) + '"/><path class="wp" d="' + d + '" stroke-width="' + q1(WB * .27) + '"/>' +
        '<g class="tin" transform="translate(' + q1(mid[0]) + ' ' + q1(mid[1]) + ')"><circle class="wi" r="' + q1(WB * .36) + '" stroke-width="3"/>' + iconPaths(WB * .44) + '</g>';
      T[w] = { kind: 'wall', g, pts, c: mid, light: 1, key: '' };
    });
    // the bridges, each as two half-ladders (lit in its end tile's colours)
    const half = () => { const g = mk('g', {}, gB); return { g, glow: mk('path', { class: 'lg', 'stroke-width': 11, 'stroke-linecap': 'round', fill: 'none', opacity: 0 }, g), rails: mk('path', { 'stroke-width': 2.6, 'stroke-linecap': 'round', fill: 'none', stroke: '#6b3f1c' }, g), rungs: mk('path', { 'stroke-width': 2.4, fill: 'none', stroke: '#e8b070' }, g), key: '' }; };
    LAYO.tiles.forEach(u => Gr.rot[u].forEach(w => {
      if (w === hole || (!LAYO.border.has(w) && w < u)) return;
      bridgesM.push({ u, v: w, wall: LAYO.border.has(w), h1: half(), h2: half() });
    }));
    LAYO.W3.forEach((w, i) => { const x = LAYO.W3[(i + 1) % 3]; if (Gr.rot[w].includes(x)) bridgesM.push({ u: w, v: x, wallWall: true, h1: half(), h2: half() }); });
    link.forEach(x => { const g = mk('g', { class: 'ghost' }, gG); ghosts.push({ x, g, rails: mk('path', { 'stroke-width': 2.4, fill: 'none', stroke: '#8d949d', 'stroke-linecap': 'round' }, g), rungs: mk('path', { 'stroke-width': 2.2, fill: 'none', stroke: '#c9ced5', 'stroke-dasharray': '0' }, g) }); });
    // the tiles and the goal
    LAYO.inner.forEach(u => {
      const g = mk('g', { class: 'tl bt ' + (u === hole ? 'eq hole' : 'e' + col[u]) }, gT), tin = mk('g', { class: 'tin' }, g);
      tin.innerHTML = tileSvg(u);
      T[u] = { kind: u === hole ? 'hole' : 'tile', g, tin, v: sidesOf(u), light: 1, key: '', tf: '' };
    });
    if (holeFill >= 0) applyHoleFill(holeFill);
    placeAll(); kick();
  }
  function placeAll() {                            // move tiles and redraw ladders for the current positions
    const lift = LV && LV.drag ? LV.drag.u : -1;
    LAYO.inner.forEach(u => { const p = SIM.P[u]; T[u].c = p; T[u].g.setAttribute('transform', 'translate(' + q1(p[0]) + ' ' + q1(p[1]) + ')' + (u === lift ? ' scale(1.16)' : '')); });
    const ep = (u, toward) => { if (T[u].kind === 'wall') return null; const p = SIM.P[u], dx = toward[0] - p[0], dy = toward[1] - p[1], l = Math.hypot(dx, dy) || 1; return edgePoint(p, LAYO.R[u], T[u].v, LAYO.phi[u], dx / l, dy / l, 1); };
    bridgesM.forEach(B => {
      let a, b;
      if (B.wallWall) { a = LAYO.endTo[B.u][B.v]; b = LAYO.endTo[B.v][B.u]; }
      else if (B.wall) { const t = LAYO.anchor[B.v][B.u], p = SIM.P[B.u], dx = t[0] - p[0], dy = t[1] - p[1], l = Math.hypot(dx, dy) || 1; a = ep(B.u, t); b = [t[0] - dx / l * WB * .45, t[1] - dy / l * WB * .45]; }
      else { a = ep(B.u, SIM.P[B.v]); b = ep(B.v, SIM.P[B.u]); }
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d1 = ladderD(a, m, LADW, B.h1), d2 = ladderD(m, b, LADW, B.h2);
      B.a = a; B.b = b;
      [[B.h1, d1], [B.h2, d2]].forEach(([h, d]) => { h.rails.setAttribute('d', d.rails); h.rungs.setAttribute('d', d.rungs); h.glow.setAttribute('d', d.line); });
    });
    ghosts.forEach(G => { const a = ep(G.x, SIM.P[hole]), b = ep(hole, SIM.P[G.x]), d = ladderD(a, b, LADW * .85, G); G.rails.setAttribute('d', d.rails); G.rungs.setAttribute('d', d.rungs); });
  }
  // ---------- dock ripples ----------
  function graphDist(src, maxD) {
    const d = new Map([[src, 0]]), q = [src];
    while (q.length) { const x = q.shift(); if (d.get(x) >= maxD) continue; adj[x].forEach(w => { if (w !== hole && !d.has(w)) { d.set(w, d.get(x) + 1); q.push(w); } }); }
    return d;
  }
  function ripple(u, amp, maxD) { if (reduced || u < 0 || u === hole) return; waves.push({ src: u, t0: performance.now(), amp, dist: graphDist(u, maxD === undefined ? 4 : maxD) }); kick(); }
  function stepWaves(now) {
    const off = new Array(n).fill(0), tilt = new Array(n).fill(0);
    waves = waves.filter(W => now - W.t0 < 2600);
    waves.forEach(W => W.dist.forEach((d, w) => {
      const t = (now - W.t0) / 1000 - d * .11; if (t <= 0) return;
      const a = W.amp * Math.pow(.5, d), env = Math.exp(-t / .42);
      off[w] += a * Math.sin(t * 2 * Math.PI / .5) * env; tilt[w] += a * Math.cos(t * 2 * Math.PI / .5) * env * (w % 2 ? 1 : -1);
    }));
    shakes.forEach((t0, u) => { if (now - t0 > 450) shakes.delete(u); });
    const K = LAYO.ap * 2.2;
    LAYO.tiles.forEach(u => {
      const t = T[u], sk = shakes.get(u), sx = sk ? Math.sin((now - sk) / 22) * .09 * K * (1 - (now - sk) / 450) : 0;
      const tf = off[u] || tilt[u] || sx ? 'translate(' + q1(sx) + 'px,' + q1(-off[u] * K) + 'px) rotate(' + q1(tilt[u] * 40) + 'deg) scale(' + (1 + Math.max(-.1, off[u] * 1.1)).toFixed(3) + ')' : '';
      if (tf !== t.tf) { t.tf = tf; t.tin.style.transform = tf; }
    });
    return waves.length > 0;
  }
  // ---------- tile lights ----------
  function targetLight(u) {
    if (cerLight) return cerLight(u);
    if (trace && trace.pair) {
      if (!trace.comp.set.has(u)) return .42;
      if ((traced.get(trace.comp.key) || new Set()).has(u)) return 1.5;
      const end = trace.path[trace.path.length - 1];
      return adj[end].includes(u) ? 1.35 + .35 * Math.sin(performance.now() / 160) : .9;   // the next steps pulse
    }
    if (trace) return u === trace.path[0] || adj[trace.path[0]].includes(u) ? 1 : .5;
    const A = active && chains.find(k => k.key === active);
    if (A) return A.set.has(u) ? 1.75 : .38;                  // a captured chain stands out most; the rest stays readable
    const P = partialChain();
    if (P) { if (!P.set.has(u)) return .42; const done = traced.get(P.key) || new Set(); if (done.has(u)) return 1.5; return [...done].some(x => adj[x].includes(u)) ? 1.3 + .3 * Math.sin(performance.now() / 160) : .9; }
    return 1;
  }
  // bridges: which are lit, and in which pair
  function bridgeState() {
    const lit = new Map();                 // key -> 1 traced, 2 active
    chains.forEach(K => { const t = traced.get(K.key); if (!t || found.has(K.key)) return; K.edges.forEach(([a, b]) => { if (t.has(a) && t.has(b)) lit.set(Math.min(a, b) + ':' + Math.max(a, b), 1); }); });
    const A = active && chains.find(k => k.key === active);
    if (A && !trace) A.edges.forEach(([a, b]) => lit.set(Math.min(a, b) + ':' + Math.max(a, b), 2));
    return lit;
  }
  // the shape of a chain, for its lights: the loops (the 2-core, cut into fundamental cycles of a BFS tree, each edge
  // given to the first cycle through it, with its arc length round that cycle), the branches hanging off them, the
  // junction tiles where a branch meets a loop, and the loose ends (tiles with one link)
  const CHAIN_SHAPE = new WeakMap();
  function chainDeco(K) {
    if (CHAIN_SHAPE.has(K)) return CHAIN_SHAPE.get(K);
    const nb = new Map(K.vs.map(u => [u, []])); K.edges.forEach(([a, b]) => { if (nb.has(a) && nb.has(b)) { nb.get(a).push(b); nb.get(b).push(a); } });
    const deg = new Map([...nb].map(([u, l]) => [u, l.length])), core = new Set(K.vs), q = K.vs.filter(u => deg.get(u) <= 1);
    while (q.length) { const u = q.pop(); if (!core.has(u)) continue; core.delete(u); nb.get(u).forEach(w => { if (core.has(w)) { deg.set(w, deg.get(w) - 1); if (deg.get(w) <= 1) q.push(w); } }); }
    const ek = (a, b) => Math.min(a, b) + ':' + Math.max(a, b), par = new Map(), dep = new Map(), E = new Map();
    for (const r of core) { if (par.has(r)) continue; par.set(r, -1); dep.set(r, 0); const bq = [r]; while (bq.length) { const x = bq.shift(); nb.get(x).forEach(w => { if (core.has(w) && !par.has(w)) { par.set(w, x); dep.set(w, dep.get(x) + 1); bq.push(w); } }); } }
    const bridgeOf = (u, v) => bridgesM.find(B => (B.u === u && B.v === v) || (B.u === v && B.v === u));
    const hl = (a, b) => a && b ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 0;
    let loops = 0;
    K.edges.forEach(([a, b]) => {
      if (!core.has(a) || !core.has(b) || par.get(a) === b || par.get(b) === a) return;
      const pa = [a], pb = [b]; let x = a, y = b;
      while (x !== y) { if (dep.get(x) >= dep.get(y)) { x = par.get(x); pa.push(x); } else { y = par.get(y); pb.push(y); } }
      const cyc = pa.concat(pb.reverse().slice(1)), id = loops++; let S = 0;      // a .. (common ancestor) .. b, closed by b-a
      cyc.forEach((u, i) => {
        const v = cyc[(i + 1) % cyc.length], B = bridgeOf(u, v); if (!B || !B.a) return;
        const m = [(B.a[0] + B.b[0]) / 2, (B.a[1] + B.b[1]) / 2], l1 = hl(B.a, m), l2 = hl(m, B.b);
        if (!E.has(ek(u, v))) E.set(ek(u, v), B.u === u ? { id, h1: [S, 0, l1], h2: [S + l1, 0, l2] } : { id, h2: [S, 1, l2], h1: [S + l2, 1, l1] });
        S += l1 + l2;
      });
    });
    const junc = [...core].filter(u => nb.get(u).some(w => !core.has(w)) && T[u] && T[u].kind === 'tile');
    const leaves = K.vs.filter(u => nb.get(u).length === 1 && T[u] && T[u].kind === 'tile').map(u => [u, nb.get(u)[0]]);
    const D = { E, junc, leaves, loops }; CHAIN_SHAPE.set(K, D); return D;
  }
  function activeDeco() { const A = !trace && active && chains.find(k => k.key === active); return A ? chainDeco(A) : null; }
  const LOOPDASH = [[7, 7], [3, 6], [11, 6]];        // each loop its own stripes and speed, so two loops read apart
  function stepBridges(now) {
    const lit = bridgeState(), dimAll = !!(trace && trace.pair) || !!active || !!partialChain(), D = lit.size ? activeDeco() : null;
    bridgesM.forEach(B => {
      const k2 = Math.min(B.u, B.v) + ':' + Math.max(B.u, B.v), st = lit.get(k2), lp = st === 2 && D ? D.E.get(k2) : null;
      [[B.h1, B.u, 0, 'h1'], [B.h2, B.v, 1.2, 'h2']].forEach(([h, w, ph, hk]) => {
        const e = col[w];
        if (lp && !reduced) {                         // a loop of the captured chain: lights march round it like a barber's pole
          const [S0, rev, L] = lp[hk], [d, g] = LOOPDASH[lp.id % 3], P = d + g, vt = (26 + 11 * (lp.id % 3)) * now / 1000;
          const o = rev ? d - (S0 + L - vt) : S0 - vt, oo = ((o % P) + P) % P;
          h.glow.setAttribute('stroke-dasharray', d + ' ' + g); h.glow.setAttribute('stroke-dashoffset', q1(oo)); h.glow.setAttribute('stroke-width', 9);
          if (h.key !== 'P' + e) { h.key = 'P' + e; h.rails.setAttribute('stroke', DARK[e]); h.rungs.setAttribute('stroke', NEONH[e]); h.glow.setAttribute('stroke', NEONH[e]); h.glow.setAttribute('opacity', .95); h.g.setAttribute('opacity', 1); }
          return;
        }
        const glow = st ? (st === 2 ? (D ? .6 : .45 + .3 * Math.sin(now / 160 - ph)) : .5) : 0;   // branches of a captured chain: a steady glow
        const key = (st ? 'L' + e : dimAll ? 'D' : 'N') + (st === 2 ? q1(glow) : '');
        if (key === h.key) return;
        h.glow.removeAttribute('stroke-dasharray'); h.glow.removeAttribute('stroke-dashoffset'); h.glow.setAttribute('stroke-width', 11);
        h.key = key;
        h.rails.setAttribute('stroke', st ? DARK[e] : '#6b3f1c'); h.rungs.setAttribute('stroke', st ? NEONH[e] : '#e8b070');
        h.glow.setAttribute('stroke', NEONH[e]); h.glow.setAttribute('opacity', glow);
        h.g.setAttribute('opacity', st || !dimAll ? 1 : .32);
      });
    });
    ghosts.forEach(G => G.g.setAttribute('opacity', holeFill >= 0 ? 1 : dimAll ? .3 : .8));
  }
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function shade(hex, k, g, w) {                   // darken by k, mix towards grey by g, towards white by w
    const c = rgb(hex).map(x => x * k), y = (c[0] + c[1] + c[2]) / 3;
    return 'rgb(' + c.map(x => Math.round(Math.min(255, (x + (y - x) * g) * (1 - w) + 255 * w))).join(',') + ')';
  }
  function stepLights() {
    for (let u = 0; u < n; u++) {
      const t = T[u]; if (!t || t.kind === 'hole') continue;
      const goal = targetLight(u); t.light += (goal - t.light) * .35;
      const k = Math.min(1, t.light), hi = Math.max(0, t.light - 1), e = col[u], lit = t.light > 1.2 && !cer;                // (the ceremony brightens by tint and pop, not by the white rim)
      const kk = .18 + .82 * k, g = k < 1 ? Math.min(1, (1 - k) * 1.2) : 0, w = Math.min(.45, hi * .35);
      const key = e + ':' + kk.toFixed(2) + ':' + g.toFixed(2) + ':' + w.toFixed(2) + lit;
      if (key === t.key) continue; t.key = key;
      if (k >= .999 && w < .01) { t.g.style.removeProperty('--c'); t.g.style.removeProperty('--d'); t.g.style.removeProperty('--n'); }
      else { t.g.style.setProperty('--c', shade(HEX[e], kk, g, w)); t.g.style.setProperty('--d', shade(DARK[e], kk, g, w * .5)); t.g.style.setProperty('--n', shade(NEONH[e], .06 + .94 * k * k, g, Math.min(.6, hi))); }
      t.g.classList.toggle('lit', lit);
    }
  }
  // ---------- picking (board pixels) ----------
  function cornersOf(u) { const p = SIM.P[u], r = LAYO.R[u], v = T[u].v, ph = LAYO.phi[u], out = []; for (let i = 0; i < v; i++) { const a = ph + 2 * Math.PI * (i + .5) / v; out.push([p[0] + r * Math.cos(a), p[1] + r * Math.sin(a)]); } return out; }
  function inPoly(x, y, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; }
  function toScreen(u) { if (!SIM || !T[u]) return [BW / 2, BH / 2]; syncPos(performance.now()); const p = posOf(u); return [p[0], p[1]]; }
  function toWorld(cx, cy) { const b = svg.getBoundingClientRect(); return [cx - b.left, cy - b.top]; }
  // a wall's reach: its band plus 7px inland, and a wide margin out to sea (nothing else lives there), so a drag
  // onto or off a wall is easy; returns how far outside that reach (x, y) is (<= 0: on the wall)
  function wallOut(w, x, y) {
    const d = polyDist([x, y], T[w].pts) - WB / 2, sea = Math.pow(Math.abs(x - BOX.cx) / BOX.a, SEP) + Math.pow(Math.abs(y - BOX.cy) / BOX.b, SEP) > 1;
    return d - (sea ? 30 : 7);
  }
  function pick(cx, cy) {
    if (!LAYO) return -1; syncPos(performance.now());
    const [x, y] = toWorld(cx, cy);
    for (const u of LAYO.tiles) if (inPoly(x, y, cornersOf(u))) return u;
    let best = -1, bd = 0; for (const w of LAYO.W3) { const o = wallOut(w, x, y); if (o < bd) { bd = o; best = w; } }
    return best;
  }
  function pickAll(cx, cy) {               // every tile under (or just round) the finger, nearest first
    if (!LAYO) return []; syncPos(performance.now());
    const [x, y] = toWorld(cx, cy), hits = [];
    LAYO.tiles.forEach(u => { const p = SIM.P[u], d = Math.hypot(p[0] - x, p[1] - y); if (d < LAYO.R[u] * 1.1 + 3 || inPoly(x, y, cornersOf(u))) hits.push([u, d]); });
    LAYO.W3.forEach(w => { const o = wallOut(w, x, y); if (o < 3) hits.push([w, Math.max(0, o + 7)]); });   // distance from the band's edge
    return hits.sort((a, b) => a[1] - b[1]).map(h => h[0]);
  }
  function stepTarget(cx, cy) {            // while tracing: among the tiles under the finger, prefer a valid next link
    const hits = pickAll(cx, cy); if (!hits.length || !trace) return hits[0] === undefined ? -1 : hits[0];
    const t = trace, end = t.path[t.path.length - 1];
    const okNext = x => x === end || (adj[end].includes(x) && (t.pair ? t.pair.includes(col[x]) : true));
    const done = t.comp ? traced.get(t.comp.key) : null, [fx, fy] = toWorld(cx, cy);
    const valid = hits.filter(x => okNext(x) && x !== end); if (!valid.length) return hits.find(okNext) ?? hits[0];
    const cost = x => { const d = T[x].kind === 'wall' ? Math.max(0, wallOut(x, fx, fy) + 7) : Math.hypot(SIM.P[x][0] - fx, SIM.P[x][1] - fy); return d + (done && done.has(x) ? 25 : 0); };   // nearest, untraced first
    return valid.reduce((a, b) => cost(a) <= cost(b) ? a : b);
  }
  function ballAt(cx, cy, slack) {
    if (!LAYO) return -1;
    const u = pick(cx, cy); if (u >= 0) return u;
    const [x, y] = toWorld(cx, cy); let best = -1, bd = slack || 22;
    LAYO.tiles.forEach(w => { const p = SIM.P[w], d = Math.hypot(p[0] - x, p[1] - y) - LAYO.ap; if (d < bd) { bd = d; best = w; } });
    LAYO.W3.forEach(w => { const d = wallOut(w, x, y) + 7; if (d < bd) { bd = d; best = w; } });
    return best;
  }
  // ---------- overlay: hint outlines, locks, the finger's line ----------
  function lockList() {
    const r = rimCols(col); let j = -1; for (let t = 0; t < 5; t++) if (r[t] === r[(t + 2) % 5]) j = t;
    if (j < 0 || holeFill >= 0 || r.length !== 5 || (Gr.ncol || 4) < 4) return [];   // small maps: locks show on the chain cards only
    const x = t => link[(j + t) % 5], A = col[x(3)], B = col[x(4)];
    return [[chainAt[x(1)][A], x(3)], [chainAt[x(1)][B], x(4)]].filter(([K, y]) => K && K.set.has(y)).map(([, y]) => y);
  }
  let fxKey = '';
  function drawFx(now) {
    anim.forEach((a, u) => { if (now - a.t0 > 3000) anim.delete(u); });
    const locks = scene ? [] : lockList(), Dc = reduced || scene ? null : activeDeco(), live = anim.size || fingerPt || (LV && LV.moving) || (Dc && Dc.junc.length);
    const key = locks.join(',') + '|' + (SIM.done ? '' : SIM.steps);
    if (!live && key === fxKey) return; fxKey = live ? '' : key;
    let s = '';
    if (!scene) anim.forEach((a, u) => { if (!T[u]) return; const P = T[u].kind === 'wall' ? T[u].pts : cornersOf(u), pulse = 1 + .08 * Math.sin((now - a.t0) / 120);
      const c = posOf(u), pts = P.map(p => q1(c[0] + (p[0] - c[0]) * pulse) + ',' + q1(c[1] + (p[1] - c[1]) * pulse)).join(' ');
      s += T[u].kind === 'wall' ? '<polyline points="' + pts + '" fill="none" stroke="#ffd666" stroke-width="' + (WB + 8) + '" stroke-opacity=".55" stroke-linecap="round"/>' : '<polygon points="' + pts + '" fill="none" stroke="#ffd666" stroke-width="4" stroke-linejoin="round"/>'; });
    if (trace && fingerPt) { const e = posOf(trace.path[trace.path.length - 1]); s += '<line x1="' + q1(e[0]) + '" y1="' + q1(e[1]) + '" x2="' + q1(fingerPt[0]) + '" y2="' + q1(fingerPt[1]) + '" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55" stroke-dasharray="2 9"/>'; }
    if (Dc) Dc.junc.forEach(u => {                   // where a branch leaves a loop: a spinning sparkle ring
      const p = posOf(u), r = (LAYO.R[u] || 14) * (1.32 + .1 * Math.sin(now / 150 + u)), a = q1((now / 9) % 360);
      s += '<circle cx="' + q1(p[0]) + '" cy="' + q1(p[1]) + '" r="' + q1(r) + '" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="2 6" opacity=".9" transform="rotate(' + a + ' ' + q1(p[0]) + ' ' + q1(p[1]) + ')"/>';
    });
    locks.forEach(y => { const p = posOf(y), r = LAYO.R[y] || 20; s += '<g transform="translate(' + q1(p[0] + r * .72) + ' ' + q1(p[1] - r * .72) + ')"><circle r="11" fill="#fff" stroke="#ff2d55" stroke-width="2.5"/><text y="1" text-anchor="middle" dominant-baseline="central" font-size="12">🔒</text></g>'; });
    gFx.innerHTML = s;
  }
  function kick() { if (!looping) { looping = true; requestAnimationFrame(frame); } }
  function frame() {
    sync();
    if (!BW || !LAYO || !$('game').classList.contains('on')) { looping = false; return; }
    requestAnimationFrame(frame);                    // keep drawing while the board is open (pulses, glows)
    const now = performance.now();
    if (syncPos(now) || !SIM.placed) { placeAll(); SIM.placed = SIM.done; }
    else if (liveTick(now)) placeAll();
    stepWaves(now); stepLights(); stepBridges(now); drawFx(now);
  }
  function paintBalls() {
    for (let u = 0; u < n; u++) { const t = T[u]; if (!t || t.kind === 'hole') continue; uiSetE(t.g, col[u]); t.key = ''; }
    bridgesM.forEach(B => { B.h1.key = B.h2.key = ''; });
    kick();
  }
  function popBall(u, cls) {
    if (u === hole) return;
    if (cls === 'hintpulse') { if (!scene) anim.set(u, { t0: performance.now() }); ripple(u, .12, 1); return; }
    ripple(u, cls === 'wob' ? .06 : .14, 0);
  }
  function drawTraced() { kick(); }
  function drawActive() { const K = active && chains.find(c => c.key === active); if (!K) S.clearActive(); kick(); if (!trace && hoverU < 0) compassActive(); }
  function drawTrace(fx, fy) { fingerPt = fx === undefined ? null : toWorld(fx, fy); kick(); }
  function applyHoleFill(free) {                   // the goal takes the missing element; its ghost ladders become real
    const t = T[hole]; if (!t) return;
    uiSetE(t.g, free); t.g.classList.add('glow'); t.g.classList.remove('hole');
    ghosts.forEach(G => { G.rails.setAttribute('stroke', DARK[free]); G.rungs.setAttribute('stroke', NEONH[free]); G.g.setAttribute('opacity', 1); });
  }
  function drawHoleFill() {
    const used = new Set(rimCols(col)); let free = 0; while (used.has(free)) free++;
    holeFill = free; applyHoleFill(free);
    const p = posOf(hole); uiBurst(svg, p[0], p[1], HEX[free], 16); uiPop(T[hole].g, 1.4);
    ripple(link[0], .25, 4); return free;
  }
  // The hole-filling ceremony, played at the win before the reward screen (about 4 s). First every tile is lit: a bright flash
  // sweeps out from the goal over the whole island and leaves it fully lit. It stays lit: nothing is dimmed in the dark, the tiles
  // being discussed brighten and pop instead. The grey goal then tries every element the ring already has (each pops next to the
  // ring tile that clashes, then a buzz and a shake), then the free one: it flickers on meekly, the platform wriggles like a cat
  // nesting and settles with a thunk, lit. Then each element lights up across the whole map in turn, ending with the free one,
  // centre included. A tap on the board hurries it along. Sounds: sfx.js.
  function cerWait(ms) { return new Promise(r => { if (!cer || cer.skip) return r(); const t = setTimeout(r, ms); cer.wake = () => { clearTimeout(t); r(); }; }); }
  function cerAnim(u, frames, dur) { const t = T[u] && T[u].tin; if (!reduced && t && t.animate && cer && !cer.skip) t.animate(frames, { duration: dur, easing: 'ease-in-out' }); }
  const SHAKE = [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px) rotate(-4deg)' }, { transform: 'translateX(6px) rotate(4deg)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }];
  const POP = [{ transform: 'scale(1)' }, { transform: 'scale(1.16)', offset: .4 }, { transform: 'scale(1)' }];
  if (svg) svg.addEventListener('pointerdown', () => { if (cer) { cer.skip = true; if (cer.wake) cer.wake(); } }, true);
  async function holeCeremony(free, onSettle, onDone) {
    const gen = S.lootGen(), me = cer = { skip: !!reduced }, ok = () => gen === S.lootGen() && cer === me;
    const NC = Gr.ncol || 4, used = new Set(rimCols(col)), hg = T[hole].g, LIT = () => 1;
    const grey = () => { uiSetE(hg, 'q'); hg.classList.add('hole'); }, show = e => { uiSetE(hg, e); hg.classList.remove('hole'); };
    const Cap = e => NAMES[e][0].toUpperCase() + NAMES[e].slice(1);
    const dist = graphDist(hole, 99), reach = Math.max(1, ...dist.values()), step = Math.min(.05, .3 / reach), t0 = performance.now();
    scene = true; anim.clear(); fxKey = '';
    cerLight = u => { const t = (performance.now() - t0) / 1000 - step * (dist.get(u) || 0); return !me.skip && t > 0 && t < .18 ? 1.9 : 1; };   // the flash sweeps out; everything is lit
    msg('Which element fits in the middle? Let\u2019s try them all\u2026'); if (!me.skip) SX.sweep();
    await cerWait(step * reach * 1000 + 230); cerLight = LIT;
    for (const e of [...Array(NC).keys()].filter(e => used.has(e))) {        // every element the ring already has
      if (!ok()) return; if (me.skip) break;
      const clash = link.filter(x => col[x] === e);
      show(e); SX.tryTone(e); cerAnim(hole, POP, 200); clash.forEach(x => cerAnim(x, POP, 200));
      cerLight = u => clash.includes(u) ? 1.8 : 1;
      msg('<b>' + Cap(e) + '</b>?');
      await cerWait(200); if (!ok()) return;
      SX.nope(); cerAnim(hole, SHAKE, 240); clash.forEach(x => cerAnim(x, SHAKE, 240));
      msg('No: <b>' + NAMES[e] + '</b> is already on the ring.');
      await cerWait(230); if (!ok()) return; grey(); cerLight = LIT; await cerWait(30);
    }
    if (!ok()) return;
    msg('<b>' + Cap(free) + '</b>? Nobody on the ring has it\u2026');
    for (let k = 0; k < 3 && !me.skip; k++) {                                  // a meek flicker
      show(free); SX.hunt(k); cerAnim(hole, [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], 150);
      await cerWait(110); if (!ok()) return; if (k < 2) { grey(); await cerWait(60); if (!ok()) return; }
    }
    show(free); hg.classList.add('glow'); if (!me.skip) SX.find();
    cerAnim(hole, [                                                            // nesting: a wriggle each way, then settle
      { transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-6px,0) rotate(-7deg)', offset: .14 }, { transform: 'translate(6px,0) rotate(7deg)', offset: .3 },
      { transform: 'translate(0,-6px) rotate(-4deg)', offset: .46 }, { transform: 'translate(0,6px) rotate(4deg) scale(.96)', offset: .62 },
      { transform: 'translate(-2px,1px) rotate(-2deg) scale(.98)', offset: .78 }, { transform: 'translate(0,0) rotate(0) scale(1)' }], 480);
    if (!me.skip) [0, .12, .24, .36].forEach(d => SX.thump(d));
    await cerWait(500); if (!ok()) return;
    onSettle();                                                                // (the shell: the hole is filled, thunk)
    await cerWait(150);
    const order = [...Array(NC).keys()].filter(e => e !== free).concat(free);
    for (let i = 0; i < order.length; i++) {                                   // each element across the whole map
      if (!ok()) return; const e = order[i], last = e === free;
      cerLight = u => col[u] === e ? 1.8 : 1;
      if (!me.skip) { SX.sparkle(i); SX.swell(i); } msg(last ? 'And <b>' + NAMES[e] + '</b>, with the middle at last!' : 'All the <b>' + NAMES[e] + '</b>\u2026');
      for (let u = 0; u < n; u++) if (col[u] === e && u !== hole && !me.skip) { const d = dist.get(u) || 0; setTimeout(() => { if (ok() && !me.skip) cerAnim(u, POP, 220); }, d * 25); }
      if (last) cerAnim(hole, POP, 260);
      await cerWait(last ? 520 : 300);
    }
    cerLight = LIT; if (ok()) { cer = null; onDone(); }
  }
  // hover: bob the tile under the mouse and ripple outwards
  if (svg) svg.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.buttons) return; sync();
    const u = pick(e.clientX, e.clientY);
    if (u !== hoverU) { hoverU = u; if (u >= 0) ripple(u, .16, 4); if (!trace) { if (u >= 0) compassTile(u); else compassActive(); } }
  });
  if (svg) svg.addEventListener('pointerleave', () => { hoverU = -1; });

  // ---------- configuration: one renderer, two layouts. cfg: { free, guard, live: { ...LIVE overrides } } (the skin's `board`) ----------
  const LIVE0 = Object.assign({}, LIVE); let cfgKey = null;
  function configure(cfg, key) {                   // a skin's physics; kept across levels so dev-panel tweaks survive until the skin changes
    if (key !== undefined && key === cfgKey) return; cfgKey = key === undefined ? null : key; cfg = cfg || {};
    Object.assign(LIVE, LIVE0, cfg.live || {}); LIVE.guard = cfg.guard === undefined ? LIVE0.guard : !!cfg.guard; FREE.on = !!cfg.free;
    const d = S.headless ? null : $('devPanel'); if (d) {              // an open dev panel shows the new skin's numbers
      d.querySelectorAll('input[type=range]').forEach(r => { r.value = LIVE[r.dataset.k]; d.querySelector('[data-v="' + r.dataset.k + '"]').textContent = r.value; });
      $('devGuard').checked = LIVE.guard; $('devFree').checked = FREE.on;
    }
  }
  function winScene(on) { scene = !!on; if (scene) { anim.clear(); fxKey = ''; } kick(); }   // the last swap is on its way: drop the gold hint outlines and lock badges
  function reset() { holeFill = -1; cer = null; cerLight = null; scene = false; anim.clear(); }   // a level starts
  function destroy() { looping = false; T = []; bridgesM = []; ghosts = []; waves = []; LAYO = null; SIM = null; LV = null; HOME = null; if (svg) clear(svg); }
  function sizeChanged() { const br = $('board').getBoundingClientRect(); return !(Math.abs(br.width - BW) < 1 && Math.abs(br.height - BH) < 1); }
  const kindOf = u => T[u] && T[u].kind, radius = u => LAYO && LAYO.R[u], isTile = u => !!(T[u] && T[u].kind === 'tile'), sidesAt = u => (T[u] && T[u].v) || 6;
  function holePop(s) { if (T[hole] && T[hole].g) uiPop(T[hole].g, s); }
  function finger(fx, fy) { fingerPt = fx === undefined ? null : toWorld(fx, fy); }
  // ---------------- dev panel: live spring / damping knobs, crossing guard, free borders ----------------
  // Open with #dev on the link, or tap the level name five times. Changes apply at once to the running board.
  const DEVK = [
    ['kH', 'Home spring', 0, .3, .005], ['kB', 'Bridge spring', 0, .2, .005], ['damp', 'Damping (keep)', .3, .98, .01],
    ['cap', 'Swing room ×spacing', 0, 1.2, .02], ['rep', 'Like-colour push', 0, 5, .1],
    ['fk', 'Free: link pull', 0, .15, .005], ['fr', 'Free: bubble push', 0, 3, .05], ['fl', 'Free: bubble size', .5, 1.6, .01]];
  function dev(on) {
    let d = $('devPanel');
    try { localStorage.setItem('fth-dev', on ? '1' : '0'); } catch (_) {}
    if (!on) { if (d) d.remove(); return; }
    if (d) return;
    d = document.createElement('div'); d.id = 'devPanel';
    d.innerHTML = '<div class="dh"><b>DEV</b> springs<button id="devShake" title="Shake every tile">shake</button><button id="devX" aria-label="Close dev panel">✕</button></div>' +
      DEVK.map(([k, lab, a, b, st]) => '<label><span>' + lab + '</span><input type="range" min="' + a + '" max="' + b + '" step="' + st + '" value="' + LIVE[k] + '" data-k="' + k + '"><i data-v="' + k + '">' + LIVE[k] + '</i></label>').join('') +
      '<label class="ck"><input type="checkbox" id="devGuard"' + (LIVE.guard ? ' checked' : '') + '> crossing guard (no overlaps, no crossings; off in free mode)</label>' +
      '<label class="ck"><input type="checkbox" id="devFree"' + (FREE.on ? ' checked' : '') + '> free borders <small>(off: the old walls)</small></label>';
    $('board').appendChild(d);
    d.addEventListener('pointerdown', e => e.stopPropagation());
    d.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => {
      const k = r.dataset.k; LIVE[k] = +r.value; d.querySelector('[data-v="' + k + '"]').textContent = r.value;
      if (k === 'cap' && LV) LV.cap0 = LIVE.cap * LV.sp; if (LV) LV.dirty = true; kick();
    }));
    $('devGuard').onchange = e => { LIVE.guard = e.target.checked; kick(); };
    $('devFree').onchange = e => { FREE.on = e.target.checked; buildBoard(false); S.refresh(); };
    $('devShake').onclick = () => { if (LV) { LAYO.tiles.forEach(u => { const v = LV.V[u]; if (v) { v[0] += (Math.random() - .5) * LV.sp * .5; v[1] += (Math.random() - .5) * LV.sp * .5; } }); kick(); } };
    $('devX').onclick = () => dev(false);
  }
  // the interface the shell calls; every entry point reads the game's state first
  const E = fn => (...a) => { sync(); return fn(...a); };
  return {
    build: E(buildBoard), kick, reset, destroy, configure, sizeChanged, dev, width: () => BW, isTile, kind: E(kindOf), radius: E(radius), sidesAt: E(sidesAt), holePop: E(holePop), finger,
    pick: E(pick), pickAll: E(pickAll), stepTarget: E(stepTarget), ballAt: E(ballAt), toScreen: E(toScreen), posOf: E(u => { const p = T[u] && SIM ? posOf(u) : [BW / 2, BH / 2]; return [p[0], p[1]]; }),
    dragBegin: E(dragBegin), dragMove: E(dragMove), dragEnd: E(dragEnd), ripple: E(ripple), shake: E(shake), popBall: E(popBall), paintBalls: E(paintBalls),
    drawTraced: E(drawTraced), drawActive: E(drawActive), drawTrace: E(drawTrace), drawHoleFill: E(drawHoleFill), holeCeremony: E(holeCeremony), winScene: E(winScene),
    get cer() { return cer; }, get LIVE() { return LIVE; }, get FREE() { return FREE; },
    layout: E(layoutBoard), step: now => liveStep(now),   // headless: build the layout, then one physics step at a time
    debug: () => ({ get T() { return T; }, get LAYO() { return LAYO; }, get BOX() { return BOX; }, get bridges() { return bridgesM; }, get LV() { return LV; }, get SIM() { return SIM; }, get free() { return !!(LAYO && LAYO.free); } }),
  };
  }
  (typeof window !== 'undefined' ? window : globalThis).FTH_ISLAND = { create, BOARD2D };
})();
