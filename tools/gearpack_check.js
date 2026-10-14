// Gears layout (lab/gearpack.js): every level's circle packing and teeth.   node docs/game/tools/gearpack_check.js [--v]
// For EVERY level in levels.js, at 390 x 844 (phone) and 1280 x 800 (desktop), in the page's board box:
//   - the packing converged (angle sums 2pi), every adjacent pair is tangent: |d - (r_u + r_v)| <= 1e-6 (r_u + r_v),
//   - no two circles overlap (fillers included), non-adjacent circles do not touch (gap > 1e-4 x the smaller radius),
//   - the hub (the hole's circle) is tangent to every rim gear and at least 34 px (phone) / 44 px (desktop) in radius,
//   - the frame gears (the three round the point sent to infinity, running off the box) cover at most 20% of the box,
//   - every gear shows a tap disc on screen: a disc of radius min(r, 22 px) inside both it and the box (outer gears may run
//     off the edges, like a machine going on beyond the frame), and the hub is whole;
// and reports the radius ratio (visible gears), the smallest gear (px) and the teeth: counts, pitch, the clash left at
// non-tree contacts (in teeth; 0 = perfect mesh, 0.5 = tooth on tooth).
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..');
const ctx = { window: {}, console, Math }; ctx.window.window = ctx.window; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
run('levels.js'); run('layout.js'); run('lab/gearpack.js');
const G = ctx.window.GAME, LAY = ctx.window.LAYOUT, GP = ctx.window.GEARPACK, VERB = process.argv.includes('--v');
let bad = 0; const fail = m => { console.log('  FAIL ' + m); bad++; };
const box = (w, h) => ({ x0: 10, y0: 54, x1: w - 10, y1: h - 10 });   // lab/gears.html resize()
const SIZES = [[390, 844], [1280, 800]], COVER = 0.2;   // frame gears: at most 20% of the board; hub radius >= 34 px phone, 44 px desktop
const EXCEPT = ['archipelago'], exc = [];   // levels allowed a smaller hub (a stack of degree-3 regions: else a gear under 4 px)
const per = SIZES.map(() => ({ gear: [], hub: Infinity, cov: 0 }));
const tot = { cov: 0, covAt: '', hub: Infinity, hubAt: '', lv: 0, tan: 0, minPx: Infinity, minPxAt: '', ratio: 0, ratioAt: '', clash: 0, mean: 0, nm: 0, ms: 0 };
console.log('  level              n   N  conv     tan.err   phone: minPx ratio  hub cov% teeth clash   desk: minPx ratio  hub cov% teeth clash');
const seen = new Set();
for (const L of G.levels) {
  if (seen.has(L.id)) continue; seen.add(L.id);
  const Gr = G.graphs[L.g], ref = (LAY[L.g] && LAY[L.g].centre) || Gr.pos;
  const t0 = Date.now(), P = GP.pack(Gr, ref), n = Gr.n;
  if (!(P.err < 1e-10)) fail(L.id + ': packing did not converge (' + P.err + ')');
  const adj = new Set(); P.tris.forEach(([a, b, c]) => [[a, b], [b, c], [a, c]].forEach(([x, y]) => adj.add(Math.min(x, y) * 1000 + Math.max(x, y))));
  Gr.edges.forEach(([a, b]) => { if (!adj.has(Math.min(a, b) * 1000 + Math.max(a, b))) fail(L.id + ': edge ' + a + '-' + b + ' is not in the packing'); });
  let row = '  ' + L.id.padEnd(18) + String(n).padStart(3) + String(P.N).padStart(4) + P.err.toExponential(0).padStart(7);
  let tanMax = 0; const cells = [];
  for (const [w, h] of SIZES) {
    const B = box(w, h), V = GP.view(P, B), T = GP.teeth(P, V, B), S = V.S, R = V.R;
    for (let u = 0; u < P.N; u++) for (let v = u + 1; v < P.N; v++) {
      const d = Math.hypot(S[u][0] - S[v][0], S[u][1] - S[v][1]), s = R[u] + R[v], e = Math.abs(d - s) / s;
      if (adj.has(u * 1000 + v)) { tanMax = Math.max(tanMax, e); if (e > 1e-6) fail(L.id + ' ' + w + ': ' + u + '-' + v + ' not tangent (' + e.toExponential(2) + ')'); }
      else if (d - s <= 1e-4 * Math.min(R[u], R[v])) fail(L.id + ' ' + w + ': ' + u + '-' + v + (d < s ? ' overlap' : ' touch') + ' (gap ' + (d - s).toFixed(4) + ' px)');
    }
    const H = S[Gr.hole], HUB = w < 500 ? 34 : 44;
    if (V.hubMin < HUB) { exc.push(L.id + '@' + w + ': hub minimum lowered to ' + V.hubMin + ' px (hub ' + R[Gr.hole].toFixed(1) + ' px) so the smallest gear reaches ' + V.minPx.toFixed(1) + ' px');
      if (!EXCEPT.includes(L.id)) fail(L.id + ' ' + w + ': hub minimum lowered, not an allowed exception'); }
    const hubMin = V.hubMin < HUB ? 14.5 : HUB;   // an exception's hub may fall to ~15 px
    if (R[Gr.hole] < hubMin - 0.05) fail(L.id + ' ' + w + ': hub ' + R[Gr.hole].toFixed(1) + ' px < ' + hubMin);
    if (V.cover > COVER) fail(L.id + ' ' + w + ': frame gears cover ' + (100 * V.cover).toFixed(0) + '% of the board (> ' + 100 * COVER + '%)');
    for (const x of Gr.link) { const d = Math.hypot(S[x][0] - H[0], S[x][1] - H[1]); if (Math.abs(d - R[x] - R[Gr.hole]) > 1e-6 * (R[x] + R[Gr.hole])) fail(L.id + ': hub not tangent to rim gear ' + x); }
    // on screen: every gear shows a disc of radius min(r, 22 px) inside the box (outer gears may run off the edges), the hub whole
    const fr = new Set(V.frame); let vr = [];
    for (let u = 0; u < n; u++) {
      const q = u === Gr.hole ? R[u] : Math.min(R[u], 22), dx = Math.max(0, B.x0 + q - S[u][0], S[u][0] - (B.x1 - q)), dy = Math.max(0, B.y0 + q - S[u][1], S[u][1] - (B.y1 - q));
      if (Math.hypot(dx, dy) > R[u] - q + 1e-6) fail(L.id + ' ' + w + ': gear ' + u + (u === Gr.hole ? ' (hub) is not whole on screen' : ' shows no ' + q.toFixed(0) + ' px tap disc on screen'));
      if (!fr.has(u)) vr.push(R[u]);
    }
    const mn = Math.min(...vr), ratio = Math.max(...vr) / mn, ten = T.N.slice(0, n).filter((_, u) => !fr.has(u));
    if (mn < tot.minPx) { tot.minPx = mn; tot.minPxAt = L.id + '@' + w; }
    if (ratio > tot.ratio) { tot.ratio = ratio; tot.ratioAt = L.id + '@' + w; }
    tot.clash = Math.max(tot.clash, T.clash.max); tot.mean += T.clash.mean; tot.nm++;
    const pz = per[SIZES.findIndex(z => z[0] === w)]; pz.gear.push(mn); pz.hub = Math.min(pz.hub, R[Gr.hole]); pz.cov = Math.max(pz.cov, V.cover);
    if (V.cover > tot.cov) { tot.cov = V.cover; tot.covAt = L.id + '@' + w; }
    if (R[Gr.hole] < tot.hub) { tot.hub = R[Gr.hole]; tot.hubAt = L.id + '@' + w; }
    cells.push(mn.toFixed(1).padStart(13) + ratio.toFixed(1).padStart(6) + R[Gr.hole].toFixed(0).padStart(5) + (100 * V.cover).toFixed(0).padStart(5) + (Math.min(...ten) + '-' + Math.max(...ten)).padStart(7) + T.clash.max.toFixed(2).padStart(6));
    if (VERB) console.log('     ' + w + ': frame ' + V.frame.join(',') + ' (r ' + V.frame.map(u => R[u].toFixed(0)).join(', ') + ' px), pitch ' + T.pitch.toFixed(2) + ' px, mean clash ' + T.clash.mean.toFixed(3));
  }
  tot.ms = Math.max(tot.ms, Date.now() - t0);
  tot.tan = Math.max(tot.tan, tanMax); tot.lv++;
  console.log(row + tanMax.toExponential(1).padStart(10) + '  ' + cells.join('   '));
}
SIZES.forEach(([w, h], i) => { const G = per[i].gear.slice().sort((a, b) => a - b);
  console.log('\n  ' + w + ' x ' + h + ': smallest interior gear ' + G[0].toFixed(1) + ' px (next ' + G[1].toFixed(1) + ' px, median level ' + G[G.length >> 1].toFixed(1) + ' px), smallest hub ' + per[i].hub.toFixed(1) + ' px, largest frame cover ' + (100 * per[i].cov).toFixed(1) + '%'); });
exc.forEach(e => console.log('  exception: ' + e));
console.log('\n  levels ' + tot.lv + ', max tangency error ' + tot.tan.toExponential(2) + ' (relative), smallest gear ' + tot.minPx.toFixed(1) + ' px (' + tot.minPxAt + '), worst radius ratio ' +
  tot.ratio.toFixed(2) + ' (' + tot.ratioAt + '), teeth clash max ' + tot.clash.toFixed(2) + ' / mean ' + (tot.mean / tot.nm).toFixed(3) + ' tooth, slowest level ' + tot.ms + ' ms (pack + 2 views + teeth)');
console.log(bad ? '\n' + bad + ' FAILED' : '\nall ok');
process.exit(bad ? 1 : 0);
