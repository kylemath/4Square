// node tools/maze_check.js : checks the Lab Maze (lab/maze.html) on every 4-colour level.
// Builds the state graph, layout and corridors with the page's own code (its /*PURE*/ block) and checks that
//   - the graph is right: every corridor is one non-web Kempe swap, won rooms are leaves, distances are BFS depths,
//     the start's depth to the nearest won room equals the level's par;
//   - every room has its own grid cell, the start sits at (0, 0);
//   - every corridor starts and ends on a door of its two rooms and is axis-parallel;
//   - no corridor runs through a room; counts crossings (drawn as bridges) and collinear overlaps (should be rare).
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
global.window = {};
require(path.join(root, 'levels.js'));
const G = window.GAME;
const src = fs.readFileSync(path.join(root, 'lab/maze.html'), 'utf8');
const pure = src.slice(src.indexOf('/*PURE*/'), src.indexOf('/*END PURE*/'));
const mod = { exports: {} };
new Function('module', pure + '\nmodule.exports = { stateGraph, layoutMaze, routeMaze, buildMaze, fillDist, qTrainer, RH };')(mod);
const { buildMaze, fillDist, qTrainer, RH } = mod.exports;

let bad = 0;
const fail = (L, msg) => { bad++; console.log('  FAIL ' + L.id + ': ' + msg); };
for (const L of G.levels) {
  const Gr = G.graphs[L.g];
  const t0 = Date.now(), M = buildMaze(G, L, {}), ms = Date.now() - t0;
  const { SG, cell, routes, cross } = M, N = SG.nodes.length;
  // graph
  SG.edges.forEach(([a, b]) => {
    const A = SG.nodes[a], B = SG.nodes[b];
    if (A.won && B.won) fail(L, 'edge between two won rooms');
    const src = A.won ? B : A, dst = A.won ? A : B;
    const ok = SG.chainsOf(src.c).some(K => SG.canon(SG.flip(src.c, K)) === dst.key);
    if (!ok) fail(L, 'edge ' + a + '-' + b + ' is not a Kempe swap');
    // depths count routes through unwon rooms only (a won room is a dead end), so an edge into a won room may come
    // from deeper; otherwise BFS depths differ by at most one
    if (A.won || B.won ? src.d < dst.d - 1 : Math.abs(A.d - B.d) > 1) fail(L, 'edge spans BFS depths ' + A.d + ',' + B.d);
  });
  const firstWin = Math.min(...SG.nodes.filter(v => v.won).map(v => v.d));
  if (firstWin !== L.par) fail(L, 'nearest won room at ' + firstWin + ' but par ' + L.par);
  // cells
  const seen = new Set();
  cell.forEach(([x, y], i) => { const k = x + ',' + y; if (seen.has(k)) fail(L, 'two rooms in cell ' + k); seen.add(k); });
  if (cell[0][0] !== 0 || cell[0][1] !== 0) fail(L, 'start not at the centre');
  // corridors
  let overlaps = 0, through = 0, maxLen = 0;
  const segs = [];
  routes.forEach(r => {
    const P = r.pts, A = cell[r.a], B = cell[r.b];
    const onWall = (p, C) => Math.abs(Math.max(Math.abs(p[0] - C[0]), Math.abs(p[1] - C[1])) - RH) < 1e-9;
    if (!onWall(P[0], A) || !onWall(P[P.length - 1], B)) fail(L, 'corridor ' + r.e + ' does not end on doors');
    for (let i = 1; i < P.length; i++) {
      const p = P[i - 1], q = P[i];
      if (Math.abs(p[0] - q[0]) > 1e-9 && Math.abs(p[1] - q[1]) > 1e-9) fail(L, 'diagonal segment in corridor ' + r.e);
      segs.push({ e: r.e, p, q });
      maxLen = Math.max(maxLen, Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]));
      // through a room? sample the segment
      for (let s = 0.02; s < 1; s += 0.02) {
        const x = p[0] + (q[0] - p[0]) * s, y = p[1] + (q[1] - p[1]) * s, cx = Math.round(x), cy = Math.round(y);
        if (Math.abs(x - cx) < RH - 0.005 && Math.abs(y - cy) < RH - 0.005 && seen.has(cx + ',' + cy)) { through++; break; }
      }
    }
  });
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const a = segs[i], b = segs[j]; if (a.e === b.e) continue;
    const ah = Math.abs(a.p[1] - a.q[1]) < 1e-9, bh = Math.abs(b.p[1] - b.q[1]) < 1e-9; if (ah !== bh) continue;
    const ax = ah ? 1 : 0;   // the fixed coordinate
    if (Math.abs(a.p[ax] - b.p[ax]) > 0.03) continue;
    const lo = Math.max(Math.min(a.p[1 - ax], a.q[1 - ax]), Math.min(b.p[1 - ax], b.q[1 - ax])), hi = Math.min(Math.max(a.p[1 - ax], a.q[1 - ax]), Math.max(b.p[1 - ax], b.q[1 - ax]));
    if (hi - lo > 0.02) overlaps++;
  }
  if (through) fail(L, through + ' corridor segments run through a room');
  const adjE = routes.filter(r => r.kind === 'adjH' || r.kind === 'adjV').length;
  console.log(`${String(L.num).padStart(5)} ${L.id.padEnd(16)} ${SG.whole ? 'whole' : 'R=' + SG.R} rooms ${String(N).padStart(3)} corridors ${String(SG.edges.length).padStart(3)} (next-door ${adjE}) bridges ${String(cross.length).padStart(4)} overlaps ${overlaps} ${ms}ms`);
}
// the self-training rat: tabular Q-learning should find a shortest-route door in every room
console.log('Q-learning (episodes until the greedy door is a shortest-route door in every room):');
for (const id of ['tidy-trap', 'kempes-double', 'six-ring-trap', 'depth-4', 'deepest-pit', 'far-away']) {
  const L = G.levels.find(l => l.id === id), SG = buildMaze(G, L, {}).SG, D = fillDist(SG);
  const fake = { id }, T = qTrainer(SG, D, 12345);
  const t0 = Date.now(); let hit = null;
  while (T.episodes < 50000) { T.episode(); if (T.match() === 1) { hit = T.episodes; break; } }
  if (hit === null) fail(fake, 'Q-learning never reached 100%');
  console.log(`  ${id.padEnd(16)} rooms ${String(T.starts.length).padStart(3)} -> 100% after ${hit} episodes, ${T.steps} corridors, ${Date.now() - t0}ms`);
}
console.log(bad ? bad + ' failures' : 'all good');
process.exit(bad ? 1 : 0);
