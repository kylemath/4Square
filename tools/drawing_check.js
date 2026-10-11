// Checks how the graph skins will draw each map: runs Dots' own layout code (the <layout> block of lab/dots.html,
// which is pure) on every map in levels.js. A map whose lattice drawing is not "honest" falls back to the raw
// straight-line drawing (graph.pos), which can be badly cramped.
//
//   node docs/game/tools/drawing_check.js                 every map in levels.js
//   node docs/game/tools/drawing_check.js KEY POS.json    one map with candidate positions (used by build_game.py)
// Prints one JSON line per map: {key, honest, lattice, snapped, n, spread, good}.
const fs = require('fs'), vm = require('vm'), path = require('path');
const GD = path.join(__dirname, '..');
const ctx = { window: {}, location: { search: '' }, URLSearchParams, console, Set, Map, Math, JSON };
ctx.window.location = ctx.location; ctx.parent = ctx.window;
vm.createContext(ctx);
for (const f of ['levels.js', 'layout.js', 'lab/core.js']) vm.runInContext(fs.readFileSync(path.join(GD, f), 'utf8'), ctx, { filename: f });
const html = fs.readFileSync(path.join(GD, 'lab/dots.html'), 'utf8');
const block = html.slice(html.indexOf('// <layout>'), html.indexOf('// </layout>'));
vm.runInContext(block + '\nthis.chooseLayout = chooseLayout;', ctx, { filename: 'dots-layout' });
const G = ctx.window.GAME, [key, posFile] = process.argv.slice(2);
const keys = key ? [key] : Object.keys(G.graphs);
for (const k of keys) {
  const L = G.levels.find(l => l.g === k); if (!L) continue;
  const g = ctx.window.LAB.game(L.id);
  if (posFile) g.pos = JSON.parse(fs.readFileSync(posFile, 'utf8'));
  ctx.g = g; const r = vm.runInContext('chooseLayout(g)', ctx);
  // spread: closest pair of dots over the drawing's size (higher is roomier); good = honest lattice, every dot
  // but at most two snapped, and no pair much closer than a lattice step
  const Q = r.Q; let md = 1e9, ext = 0;
  for (let u = 0; u < Q.length; u++) { ext = Math.max(ext, Math.hypot(Q[u][0] - Q[g.hole][0], Q[u][1] - Q[g.hole][1]));
    for (let v = u + 1; v < Q.length; v++) md = Math.min(md, Math.hypot(Q[u][0] - Q[v][0], Q[u][1] - Q[v][1])); }
  const spread = md / ext, good = !!r.honest && (r.snapped < 0 || r.snapped >= g.n - 3) && md >= 0.8;
  console.log(JSON.stringify({ key: k, honest: !!r.honest, lattice: !!r.lattice, snapped: r.snapped, n: g.n, spread: +spread.toFixed(3), good }));
}
