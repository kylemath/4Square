// Checks the coin economy (economy.js, SKIN-SPEC.md section 12): node docs/game/tools/economy_check.js
// Loads the skin registry, every skin spec and economy.js's model, then:
//   - every skin has a coin with a positive value, all values distinct, spanning about two orders of magnitude;
//   - the market network: known ids, fees 1-5%, no duplicate or self edges, every coin trades with 2-4 others, connected,
//     no hub (nothing trades with everything);
//   - NO ARBITRAGE: Bellman-Ford on -ln(rate) finds no negative cycle, and every simple cycle of the network, walked
//     in both directions, multiplies the amount by less than 1 (all cycles are enumerated);
//   - best routes: every currency reaches every other; best(a, b) is no worse than any single edge and obeys the triangle
//     inequality; a round trip always loses; quote() never creates value and charges only the coins it needs;
//   - the layout: every coin has a position inside the stage, nodes do not overlap, no edge passes through another node.
// Prints the best-route rate for every pair and the typical level payout per skin. Exits 1 on any failure.
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..');
const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
run('skins/registry.js'); ctx.FTH_SKINS = ctx.window.FTH_SKINS;
const sk = fs.readdirSync(path.join(D, 'skins')).filter(f => f.endsWith('.js') && f !== 'registry.js');
const ext = f => /FTH_SKINS\.extend\(/.test(fs.readFileSync(path.join(D, 'skins', f), 'utf8'));
sk.sort((a, b) => ext(a) - ext(b)).forEach(f => run('skins/' + f));
run('economy.js');
const E = ctx.window.FTH_ECON, M = E.model();
let bad = 0; const fail = m => { bad++; console.log('  FAIL ' + m); }, ok = (c, m) => { if (!c) fail(m); };
const ids = M.ids, n = ids.length, short = id => id.replace('islands-', 'is-');

console.log('currencies (' + n + ')');
const vals = ids.map(id => M.val[id]);
ids.forEach(id => { const c = M.coin[id]; ok(c && c.name && c.plural && c.glyph && typeof c.svg === 'function', id + ': coin needs name, plural, glyph, svg'); ok(M.val[id] > 0, id + ': value must be > 0'); });
ok(new Set(vals).size === n, 'values must be distinct');
ok(Math.max(...vals) / Math.min(...vals) >= 50, 'values should span about two orders of magnitude, span is ' + Math.max(...vals) / Math.min(...vals));
ids.slice().sort((a, b) => M.val[a] - M.val[b]).forEach(id => console.log('  ' + short(id).padEnd(13) + String(M.val[id]).padStart(4) + ' G  ' + M.coin[id].name + ' (level of 800 points pays ' + Math.round(800 * Math.sqrt(10 / M.val[id]) / 4) + ')'));

console.log('markets (' + M.edges.length + ' direct pairs)');
const seen = new Set(), deg = Object.fromEntries(ids.map(i => [i, 0]));
E.EDGES.forEach(([a, b, f]) => {
  ok(ids.includes(a) && ids.includes(b), 'edge ' + a + '-' + b + ': unknown coin');
  ok(a !== b, 'edge ' + a + ': self loop'); const k = [a, b].sort().join('|'); ok(!seen.has(k), 'duplicate edge ' + k); seen.add(k);
  ok(f >= .01 && f <= .05, 'edge ' + k + ': fee ' + f + ' outside 1-5%'); if (deg[a] !== undefined) deg[a]++; if (deg[b] !== undefined) deg[b]++;
});
M.edges.forEach(e => console.log('  ' + (short(e.a) + ' - ' + short(e.b)).padEnd(26) + 'fee ' + (e.fee * 100).toFixed(0) + '%   1 ' + short(e.a) + ' = ' + M.direct[e.a + '>' + e.b].rate.toPrecision(4) + ' ' + short(e.b) + '   1 ' + short(e.b) + ' = ' + M.direct[e.b + '>' + e.a].rate.toPrecision(4) + ' ' + short(e.a)));
ids.forEach(id => ok(deg[id] >= 2 && deg[id] <= 4, id + ': trades with ' + deg[id] + ' coins, want 2-4'));
console.log('  degrees: ' + ids.map(i => short(i) + '=' + deg[i]).join(' '));
ok(Math.max(...Object.values(deg)) < n - 1, 'a hub trades with everything');
const adj = Object.fromEntries(ids.map(i => [i, []])); M.edges.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a); });
{ const vis = new Set([ids[0]]), st = [ids[0]]; while (st.length) for (const y of adj[st.pop()]) if (!vis.has(y)) { vis.add(y); st.push(y); } ok(vis.size === n, 'network is not connected'); }

console.log('no arbitrage');
{ // Bellman-Ford from a virtual source on w = -ln(rate): a negative cycle would be a profitable loop
  const arcs = []; M.edges.forEach(e => [[e.a, e.b], [e.b, e.a]].forEach(([x, y]) => arcs.push([x, y, -Math.log(M.direct[x + '>' + y].rate)])));
  const dist = Object.fromEntries(ids.map(i => [i, 0])); let changed = true, it = 0;
  for (; it < n && changed; it++) { changed = false; for (const [x, y, w] of arcs) if (dist[x] + w < dist[y] - 1e-12) { dist[y] = dist[x] + w; changed = true; } }
  ok(!changed, 'Bellman-Ford: a negative cycle exists (arbitrage!)');
  console.log('  Bellman-Ford on -ln(rate): ' + (changed ? 'NEGATIVE CYCLE' : 'no negative cycle (settled after ' + it + ' passes)'));
  // every simple cycle, both directions
  let cycles = 0, worst = 0, worstC = null;
  const rate = (x, y) => M.direct[x + '>' + y].rate;
  const dfs = (start, u, path, prod) => {
    for (const v of adj[u]) {
      if (v === start && path.length >= 3) { const p = prod * rate(u, v); cycles++; if (p > worst) { worst = p; worstC = path.concat(start).map(short).join('>'); } ok(p < 1 - 1e-12, 'cycle ' + path.concat(start).join('>') + ' multiplies by ' + p); }
      else if (!path.includes(v) && ids.indexOf(v) > ids.indexOf(start)) dfs(start, v, path.concat(v), prod * rate(u, v));
    }
  };
  ids.forEach(s => dfs(s, s, [s], 1));
  console.log('  ' + cycles + ' directed simple cycles of 3+ coins (every one walked): best loop returns ' + (worst * 100).toFixed(2) + '% (' + worstC + ')');
  M.edges.forEach(e => ok(M.direct[e.a + '>' + e.b].rate * M.direct[e.b + '>' + e.a].rate < 1, 'round trip on ' + e.a + '-' + e.b + ' does not lose'));
}

console.log('best routes');
{
  const B = {}; ids.forEach(a => ids.forEach(b => { if (a !== b) { B[a + '>' + b] = M.best(a, b); ok(B[a + '>' + b], a + ' cannot reach ' + b); } }));
  let hops = 0, maxHops = 0, detours = 0;
  ids.forEach(a => ids.forEach(b => {
    if (a === b) return; const r = B[a + '>' + b]; if (!r) return;
    hops += r.path.length - 1; maxHops = Math.max(maxHops, r.path.length - 1);
    const d = M.direct[a + '>' + b]; if (d) { ok(r.rate >= d.rate * (1 - 1e-12), a + '>' + b + ': best route is worse than the direct market'); if (r.path.length > 2) detours++; }
    ok(r.rate * B[b + '>' + a].rate < 1, a + '<->' + b + ': a round trip does not lose');
    ids.forEach(c => { if (c !== a && c !== b) ok(r.rate >= B[a + '>' + c].rate * B[c + '>' + b].rate * (1 - 1e-12), 'triangle inequality broken ' + a + ' ' + c + ' ' + b); });
    for (let i = 0; i + 1 < r.path.length; i++) ok(M.direct[r.path[i] + '>' + r.path[i + 1]], 'route uses a missing market');
  }));
  console.log('  every coin reaches every other: ' + (Object.values(B).every(Boolean) ? 'yes' : 'NO') + '; longest route ' + maxHops + ' swaps, mean ' + (hops / (n * (n - 1))).toFixed(2) + '; ' + detours + ' direct markets are beaten by a detour');
  // quote(): no value from nothing, whole coins, pay is minimal
  let q = 0;
  for (const a of ids) for (const b of ids) if (a !== b) for (const amt of [1, 7, 50, 333, 5000]) {
    const Q = M.quote(a, b, amt); if (!Q) continue; q++;
    ok(Number.isInteger(Q.pay) && Number.isInteger(Q.out) && Q.pay >= 1 && Q.pay <= amt && Q.out >= 1, 'quote ' + a + '>' + b + ' ' + amt + ': not whole coins');
    ok(Q.pay * M.val[a] >= Q.out * M.val[b] - 1e-9, 'quote ' + a + '>' + b + ' ' + amt + ': creates value');
    ok(Q.feeG >= -1e-9, 'quote ' + a + '>' + b + ': negative fee');
    ok(Math.floor((Q.pay - 1) * Q.rate + 1e-9) < Q.out, 'quote ' + a + '>' + b + ' ' + amt + ': pays for a coin it does not need');
    const back = M.quote(b, a, Q.out); if (back) ok(back.out <= Q.pay, 'quote round trip ' + a + '>' + b + '>' + a + ' ' + amt + ' returns ' + back.out + ' > ' + Q.pay);
  }
  console.log('  ' + q + ' sample quotes: whole coins, value never created, round trips lose');
  // matrix
  const col = 6, head = ' '.repeat(13) + ids.map(i => short(i).slice(0, col + 3).padStart(col + 4)).join('');
  console.log('  best rate after fees: how many of the column coin 1 of the row coin buys\n' + head);
  const f = x => x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x >= 1 ? x.toFixed(2) : x >= .01 ? x.toFixed(3) : x.toPrecision(2);
  ids.forEach(a => console.log('  ' + short(a).padEnd(11) + ids.map(b => (a === b ? '-' : f(B[a + '>' + b].rate)).padStart(col + 4)).join('') ));
  console.log('  routes:'); ids.forEach(a => ids.forEach(b => { if (a < b && B[a + '>' + b].path.length > 3) console.log('    ' + B[a + '>' + b].path.map(short).join(' > ') + '   (' + (B[a + '>' + b].fee * 100).toFixed(1) + '% fees)'); }));
}

console.log('layout');
{
  const P = E.POS, [SW, SH] = E.STAGE;
  ids.forEach(id => { const p = P[id]; ok(p, id + ': no position'); if (p) ok(p[0] >= 39 && p[0] <= SW - 39 && p[1] >= 40 && p[1] <= SH - 44, id + ': node box leaves the stage'); });
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = P[ids[i]], b = P[ids[j]]; if (a && b) ok(Math.abs(a[0] - b[0]) >= 78 || Math.abs(a[1] - b[1]) >= 86, ids[i] + ' and ' + ids[j] + ' overlap'); }
  M.edges.forEach(e => ids.forEach(id => {
    if (id === e.a || id === e.b) return; const [x1, y1] = P[e.a], [x2, y2] = P[e.b], [px, py] = P[id], dx = x2 - x1, dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))), d = Math.hypot(x1 + t * dx - px, y1 + t * dy - py);
    ok(d >= 34, 'edge ' + e.a + '-' + e.b + ' passes ' + d.toFixed(0) + ' from the centre of ' + id);
  }));
  console.log('  ' + n + ' nodes in a ' + SW + 'x' + SH + ' stage, no overlaps, no edge through a node');
}
console.log(bad ? bad + ' problem(s)' : 'economy OK');
process.exit(bad ? 1 : 0);
