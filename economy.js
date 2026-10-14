/* economy.js: the coin exchange for 4square. Every skin earns its own coin (skins/<id>.js, field `coin`, SKIN-SPEC.md
 * section 12); this file is the market between them. Lazy-loaded by index.html on the first open of the wallet button.
 *
 * MODEL (pure, no DOM; tools/economy_check.js loads this file in node and proves the rules below):
 *   - each coin has a value in one base unit, G ("gold-equivalent"): coin.value in the skin spec.
 *   - EDGES are the direct markets, [a, b, fee]: a sparse network (every coin trades directly with 2 to 4 others).
 *     Swapping on an edge pays the fair ratio of values minus the edge's fee (1 to 5%):  1 a = value(a) / value(b) * (1 - fee) b.
 *   - so a cycle of swaps multiplies by the product of (1 - fee) < 1: NO arbitrage, whatever the values are.
 *   - best(a, b) is the cheapest route (Floyd-Warshall on -ln rate), quote(a, b, n) turns n a into whole b coins:
 *     out = floor(n * rate), and only the coins needed for that out are charged (pay = ceil(out / rate)), so rounding
 *     never eats a whole coin of the expensive side.
 *   - the wallet lives in index.html (FTH_WALLET); this file only reads balances and asks it to swap.
 */
(function () {
  'use strict';
  // direct markets: [coin a, coin b, fee]. Hand-tuned for the layout below (a ring, Bonus Swipe inside,
  // letter tiles, sweets and cheese wedges in the gaps). Every coin trades with 2 to 4 others.
  const EDGES = [
    ['dots', 'doodle', .01], ['doodle', 'blank', .02], ['blank', 'map', .03], ['map', 'ions', .03], ['ions', 'islands-3d', .02],
    ['islands-3d', 'islands-free', .03], ['islands-free', 'islands', .04], ['islands', 'tables', .02], ['tables', 'dots', .02],
    ['tables', 'blank', .05], ['islands', 'map', .02], ['islands', 'swipe', .03], ['swipe', 'ions', .05],
    ['rimword', 'doodle', .02], ['rimword', 'blank', .03], ['crush', 'tables', .02], ['crush', 'dots', .03], ['maze', 'map', .03], ['maze', 'swipe', .04],
    ['spheres', 'islands-free', .03], ['spheres', 'islands-3d', .02], ['gears', 'maze', .02], ['gears', 'ions', .03], ['signs', 'gears', .03], ['signs', 'spheres', .02],
  ];
  // node centres in a 360 x 630 stage (no node box overlaps, no edge passes through another node)
  const POS = { dots: [180, 70], doodle: [268, 128], blank: [304, 255], map: [290, 400], ions: [228, 500], 'islands-3d': [132, 500],
    'islands-free': [50, 408], islands: [56, 255], tables: [92, 128], swipe: [150, 366], rimword: [220, 254], crush: [140, 214], maze: [310, 494], spheres: [50, 494], gears: [270, 586], signs: [100, 586] };
  const STAGE = [360, 630];

  const skinsAll = () => (window.FTH_SKINS && FTH_SKINS.list) || [];
  function model() {
    const L = skinsAll(), ids = L.map(k => k.id), val = {}, coin = {}, ix = {}, n = ids.length;
    L.forEach((k, i) => { ix[k.id] = i; coin[k.id] = FTH_SKINS.coinOf(k); val[k.id] = coin[k.id].value; });
    const edges = EDGES.filter(e => ix[e[0]] !== undefined && ix[e[1]] !== undefined).map(([a, b, fee]) => ({ a, b, fee }));
    const direct = {}, cost = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity)), nx = Array.from({ length: n }, () => Array(n).fill(-1));
    const HOP = 1e-9;                                   // ties go to the route with fewer hops
    edges.forEach(e => [[e.a, e.b], [e.b, e.a]].forEach(([x, y]) => {
      const r = val[x] / val[y] * (1 - e.fee); direct[x + '>' + y] = { rate: r, fee: e.fee };
      cost[ix[x]][ix[y]] = -Math.log(r) + HOP; nx[ix[x]][ix[y]] = ix[y];
    }));
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
      if (cost[i][k] + cost[k][j] < cost[i][j] - 1e-15) { cost[i][j] = cost[i][k] + cost[k][j]; nx[i][j] = nx[i][k]; }
    function best(a, b) {                               // -> { path: [ids], rate, fee } or null
      if (ix[a] === undefined || ix[b] === undefined) return null;
      if (a === b) return { path: [a], rate: 1, fee: 0 };
      if (nx[ix[a]][ix[b]] < 0) return null;
      const path = [a]; let u = ix[a]; while (u !== ix[b]) { u = nx[u][ix[b]]; path.push(ids[u]); }
      let keep = 1;
      for (let i = 0; i + 1 < path.length; i++) keep *= 1 - direct[path[i] + '>' + path[i + 1]].fee;
      return { path, rate: val[a] / val[b] * keep, fee: 1 - keep };
    }
    function quote(a, b, amt) {                         // -> { path, pay, out, rate, feeG, feePct } or null (nothing to get)
      const r = best(a, b); if (!r || !(amt >= 1)) return null;
      const out = Math.floor(amt * r.rate + 1e-9); if (out < 1) return null;
      const pay = Math.min(amt, Math.ceil(out / r.rate - 1e-9)), feeG = pay * val[a] - out * val[b];
      return { path: r.path, pay, out, rate: r.rate, feeG, feePct: feeG / (pay * val[a]) };
    }
    const partners = id => edges.filter(e => e.a === id || e.b === id).map(e => { const o = e.a === id ? e.b : e.a; return { id: o, fee: e.fee, rate: direct[id + '>' + o].rate }; });
    return { ids, val, coin, edges, direct, best, quote, partners, skins: L };
  }

  const api = { EDGES, POS, STAGE, model };
  window.FTH_ECON = api;
  if (typeof document === 'undefined') return;           // node (tools/economy_check.js): the model only

  // ================================================================= UI
  const CSS = `
#eco{position:fixed;inset:0;z-index:60;display:none;flex-direction:column;background:var(--sk-bg,#17325f);color:var(--sk-ink,#fff);font-family:var(--sk-font,system-ui,sans-serif);-webkit-tap-highlight-color:transparent}
#eco.on{display:flex}
#eco *{box-sizing:border-box}
#eco button{font:inherit;color:inherit;cursor:pointer}
#eco :focus-visible{outline:3px solid var(--sk-accent,#ffd84a);outline-offset:2px}
#eco .ec-head{display:flex;align-items:center;gap:10px;padding:max(10px,env(safe-area-inset-top)) 14px 6px}
#eco .ec-head h2{flex:1;margin:0;font-size:1.15rem;line-height:1.1}
#eco .ec-head small{display:block;font-weight:600;font-size:.72rem;opacity:.8;margin-top:2px}
#eco .ec-x,#eco .ec-zb{width:44px;height:44px;border-radius:14px;border:2px solid var(--sk-edge,rgba(255,255,255,.4));background:var(--sk-chip,rgba(0,0,0,.28));color:var(--sk-chip-ink,inherit);font-size:1.15rem;font-weight:800;display:grid;place-items:center;padding:0}
#eco .ec-g{position:relative;flex:1 1 auto;min-height:240px;overflow:hidden;touch-action:none}
#eco .ec-st{position:absolute;left:0;top:0;width:360px;height:630px;transform-origin:0 0}
#eco .ec-st>svg{position:absolute;inset:0;width:360px;height:630px;overflow:visible;pointer-events:none}
#eco .ec-e{stroke:var(--sk-card-ink,#fff);stroke-opacity:.34;stroke-width:2.2;stroke-linecap:round;transition:stroke-opacity .15s}
#eco .ec-e.hi{stroke:var(--sk-accent,#ffd84a);stroke-opacity:.95;stroke-width:4}
#eco .ec-e.route{stroke:var(--sk-accent,#ffd84a);stroke-opacity:1;stroke-width:6}
#eco .ec-st.dim .ec-e:not(.hi):not(.route){stroke-opacity:.12}
#eco .ec-el{font-size:11px;font-weight:800;text-anchor:middle;dominant-baseline:central;fill:var(--sk-btn-ink,#1c1640);paint-order:stroke;stroke:var(--sk-accent,#ffd84a);stroke-width:7px;stroke-linejoin:round}
#eco .ec-n{position:absolute;width:78px;margin:-40px 0 0 -39px;padding:0;border:0;background:none;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1px;transition:opacity .15s}
#eco .ec-n .pl{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:var(--sk-card,#232b38);border:3px solid var(--sk-edge,rgba(255,255,255,.55));box-shadow:0 3px 0 rgba(0,0,0,.28);transition:transform .15s,border-color .15s,box-shadow .15s}
#eco .ec-n .pl svg{width:34px;height:34px;display:block;overflow:visible}
#eco .ec-n .nm{font-size:10.5px;font-weight:800;line-height:1.05;text-shadow:0 1px 2px rgba(0,0,0,.45)}
#eco .ec-n .bl{font-size:11.5px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.1;padding:1px 7px;border-radius:99px;background:var(--sk-chip,rgba(0,0,0,.4));color:var(--sk-chip-ink,#fff);border:1px solid var(--sk-edge,rgba(255,255,255,.3))}
#eco .ec-st.dim .ec-n:not(.hi):not(.sel){opacity:.42}
#eco .ec-n.hi .pl{border-color:var(--sk-accent,#ffd84a)}
#eco .ec-n.sel .pl{border-color:var(--sk-accent,#ffd84a);transform:scale(1.14);box-shadow:0 0 0 4px color-mix(in srgb,var(--sk-accent,#ffd84a) 45%,transparent),0 3px 0 rgba(0,0,0,.28)}
#eco .ec-n.flash .pl{animation:ecf .7s ease-out}
@keyframes ecf{0%{transform:scale(1.35)}100%{transform:scale(1)}}
#eco .ec-zoom{position:absolute;right:10px;top:8px;display:flex;flex-direction:column;gap:6px;z-index:2}
#eco .ec-p{flex:0 1 auto;max-height:42%;overflow:auto;padding:12px 14px max(14px,env(safe-area-inset-bottom));background:var(--sk-card,#232b38);color:var(--sk-card-ink,#e6edf3);border-top:3px solid var(--sk-edge,rgba(255,255,255,.35));border-radius:var(--sk-radius,22px) var(--sk-radius,22px) 0 0;font-size:.9rem;line-height:1.35}
#eco .ec-p h3{margin:0 0 4px;font-size:1rem;display:flex;align-items:center;gap:8px}
#eco .ec-p h3 svg{width:28px;height:28px;flex:none}
#eco .ec-p p{margin:3px 0}
#eco .ec-muted{opacity:.75;font-size:.82rem}
#eco .ec-rows{display:flex;flex-direction:column;gap:6px;margin:8px 0 0}
#eco .ec-row{display:flex;align-items:center;gap:8px;min-height:44px;padding:4px 10px;border-radius:14px;border:2px solid var(--sk-edge,rgba(255,255,255,.28));background:transparent;text-align:left;width:100%}
#eco .ec-row svg{width:26px;height:26px;flex:none}
#eco .ec-row span{flex:1}
#eco .ec-btn{min-height:46px;padding:8px 18px;border-radius:var(--sk-radius,16px);border:0;font-weight:900;background:var(--sk-btn,#2fb34a);color:var(--sk-btn-ink,#fff);box-shadow:0 4px 0 var(--sk-btn-shadow,rgba(0,0,0,.35))}
#eco .ec-btn.alt{background:transparent;color:inherit;border:2px solid var(--sk-edge,rgba(255,255,255,.45));box-shadow:none}
#eco .ec-btn[disabled]{opacity:.45;cursor:not-allowed}
#eco .ec-route{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:6px 0;font-weight:800}
#eco .ec-route svg{width:24px;height:24px;vertical-align:middle}
#eco .ec-route i{font-style:normal;opacity:.7;font-size:.78rem;font-weight:700}
#eco table{border-collapse:collapse;width:100%;font-size:.82rem}
#eco td,#eco th{padding:3px 4px;text-align:left;border-bottom:1px solid color-mix(in srgb,var(--sk-card-ink,#fff) 18%,transparent)}
#eco td.n,#eco th.n{text-align:right;font-variant-numeric:tabular-nums}
#eco td svg{width:18px;height:18px;vertical-align:middle}
#eco details{margin-top:8px}
#eco summary{min-height:36px;display:flex;align-items:center;cursor:pointer;font-weight:800}
#eco .ec-sheet{position:absolute;inset:0;z-index:5;display:none;align-items:flex-end;justify-content:center;background:rgba(5,8,12,.6)}
#eco .ec-sheet.on{display:flex}
#eco .ec-sc{width:100%;max-width:460px;max-height:92%;overflow:auto;padding:16px 16px max(16px,env(safe-area-inset-bottom));background:var(--sk-card,#232b38);color:var(--sk-card-ink,#e6edf3);border-radius:var(--sk-radius,22px) var(--sk-radius,22px) 0 0;border:3px solid var(--sk-edge,rgba(255,255,255,.35));border-bottom:0}
#eco .ec-sc h3{margin:0 0 8px}
#eco .ec-amt{display:flex;align-items:center;gap:8px;margin:10px 0}
#eco .ec-amt input[type=range]{flex:1;min-height:44px;accent-color:var(--sk-accent,#ffd84a)}
#eco .ec-amt input[type=number]{width:96px;min-height:44px;border-radius:12px;border:2px solid var(--sk-edge,rgba(255,255,255,.4));background:transparent;color:inherit;font:inherit;font-weight:800;padding:0 8px;text-align:right}
#eco .ec-q{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:8px 0;font-variant-numeric:tabular-nums}
#eco .ec-q dt{opacity:.75}#eco .ec-q dd{margin:0;font-weight:800;text-align:right}
#eco .ec-qk{display:flex;gap:8px;flex-wrap:wrap}
#eco .ec-qk button{min-height:44px;min-width:56px;border-radius:12px;border:2px solid var(--sk-edge,rgba(255,255,255,.4));background:transparent;font-weight:800}
#eco .ec-act{display:flex;gap:10px;margin-top:12px}
#eco .ec-act .ec-btn{flex:1}
#eco .ec-live{position:absolute;left:-9999px}
@media (prefers-reduced-motion:reduce){#eco *{animation:none!important;transition:none!important}}
`;
  const $ = (s, r) => (r || root).querySelector(s);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = x => Math.round(x).toLocaleString('en');
  const fmtR = x => x >= 100 ? num(x) : x >= 10 ? x.toFixed(1) : x >= 1 ? x.toFixed(2) : x >= .01 ? x.toFixed(3) : x.toPrecision(2);
  const pct = f => (Math.round(f * 1000) / 10) + '%';
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = () => window.FTH_WALLET || { bal: () => 0, earned: () => 0, wealth: () => 0, swap: () => false, skin: '' };
  let root, M, sel = [], view = { z: 1, x: 0, y: 0 }, fitK = 1, from = null, quoteFor = null;

  const art = (id, z) => M.coin[id].svg(z || 26);
  const nameOf = id => M.coin[id].name, plural = id => M.coin[id].plural;
  const cap = t => t[0].toUpperCase() + t.slice(1);

  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'eco'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'ecT');
    root.innerHTML = '<div class="ec-head"><h2 id="ecT">Coin exchange<small>Every style earns its own coin. No real money: this is a game market.</small></h2><button class="ec-x" aria-label="Close the exchange">✕</button></div>' +
      '<div class="ec-g" id="ecG"><div class="ec-st" id="ecSt"></div><div class="ec-zoom"><button class="ec-zb" data-z="in" aria-label="Zoom in">+</button><button class="ec-zb" data-z="out" aria-label="Zoom out">−</button><button class="ec-zb" data-z="fit" aria-label="Fit the whole graph">⤢</button></div></div>' +
      '<div class="ec-p" id="ecP" aria-live="polite"></div>' +
      '<div class="ec-sheet" id="ecS"><div class="ec-sc" role="dialog" aria-modal="true" aria-labelledby="ecST"></div></div><div class="ec-live" id="ecL" role="status"></div>';
    document.body.appendChild(root);
    $('.ec-x').onclick = close;
    root.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#ecS').classList.contains('on')) closeSheet(); else close(); } });
    root.querySelectorAll('.ec-zb').forEach(b => b.onclick = () => zoom(b.dataset.z));
    pan();
    addEventListener('resize', () => { if (root.classList.contains('on')) fit(true); });
    if (window.ResizeObserver) new ResizeObserver(() => { if (root.classList.contains('on')) fit(true); }).observe($('#ecG'));
    addEventListener('fth-wallet', () => { if (root.classList.contains('on')) { draw(); panel(); } });
  }

  // ---------------------------------------------------------------- the graph
  function stage() {
    const el = $('#ecSt'); let svg = '<svg viewBox="0 0 360 630" aria-hidden="true">', hit = '';
    M.edges.forEach(e => { const [x1, y1] = POS[e.a], [x2, y2] = POS[e.b]; svg += '<line class="ec-e" data-e="' + e.a + '|' + e.b + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'; });
    svg += '<g class="ec-els"></g></svg>';
    M.ids.forEach(id => {
      const [x, y] = POS[id] || [180, 280];
      hit += '<button class="ec-n" data-id="' + id + '" style="left:' + x + 'px;top:' + y + 'px"><span class="pl">' + art(id, 34) + '</span><span class="nm">' + esc(cap(nameOf(id))) + '</span><span class="bl"></span></button>';
    });
    el.innerHTML = svg + hit;
    el.querySelectorAll('.ec-n').forEach(b => b.onclick = () => pick(b.dataset.id));
    draw();
  }
  function draw() {
    const st = $('#ecSt'), part = new Set(sel.length === 1 ? M.partners(sel[0]).map(p => p.id) : []), route = sel.length === 2 ? M.best(sel[0], sel[1]) : null;
    const rset = new Set(); if (route) for (let i = 0; i + 1 < route.path.length; i++) rset.add([route.path[i], route.path[i + 1]].sort().join('|'));
    st.classList.toggle('dim', !!sel.length);
    st.querySelectorAll('.ec-e').forEach(l => {
      const [a, b] = l.dataset.e.split('|'), k = [a, b].sort().join('|');
      l.classList.toggle('hi', sel.length === 1 && (a === sel[0] || b === sel[0]));
      l.classList.toggle('route', rset.has(k));
    });
    st.querySelectorAll('.ec-n').forEach(b => {
      const id = b.dataset.id, w = W();
      b.classList.toggle('sel', sel.includes(id)); b.classList.toggle('hi', part.has(id) || !!(route && route.path.includes(id)));
      b.querySelector('.bl').textContent = num(w.bal(id));
      b.setAttribute('aria-pressed', sel.includes(id) ? 'true' : 'false');
      b.setAttribute('aria-label', cap(nameOf(id)) + ', worth ' + M.val[id] + ' G each, you hold ' + w.bal(id) + '. Trades directly with ' + M.partners(id).map(p => nameOf(p.id)).join(', ') + '.');
    });
    // labels on the highlighted edges: what 1 of the selected coin gets from that neighbour, or each hop's fee on a route
    const lab = st.querySelector('.ec-els'); lab.innerHTML = '';
    const mk = (a, b, text) => { const [x1, y1] = POS[a], [x2, y2] = POS[b]; const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('class', 'ec-el'); t.setAttribute('x', (x1 + x2) / 2); t.setAttribute('y', (y1 + y2) / 2); t.textContent = text; lab.appendChild(t); };
    if (sel.length === 1) M.partners(sel[0]).forEach(p => mk(sel[0], p.id, '×' + fmtR(p.rate)));
    else if (route) for (let i = 0; i + 1 < route.path.length; i++) { const d = M.direct[route.path[i] + '>' + route.path[i + 1]]; mk(route.path[i], route.path[i + 1], pct(d.fee) + ' fee'); }
  }
  function pick(id) {
    if (sel.length === 0) sel = [id];
    else if (sel.length === 1) sel = sel[0] === id ? [] : [sel[0], id];
    else sel = sel.includes(id) ? sel.filter(x => x !== id) : [id];
    draw(); panel();
  }

  // pan / zoom: the stage is one transformed box; fit() centres it, drag pans, wheel / buttons / pinch zoom
  function apply() { $('#ecSt').style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + (fitK * view.z) + ')'; }
  function fit(keep) {
    const g = $('#ecG'), w = g.clientWidth, h = g.clientHeight; if (!w || !h) return;
    fitK = Math.min(w / STAGE[0], h / STAGE[1]);
    if (!keep || view.z === 1) { view.z = 1; view.x = (w - STAGE[0] * fitK) / 2; view.y = (h - STAGE[1] * fitK) / 2; }
    apply();
  }
  function zoom(how) {
    if (how === 'fit') { view.z = 1; fit(); return; }
    const g = $('#ecG'); zoomAt(g.clientWidth / 2, g.clientHeight / 2, how === 'in' ? 1.3 : 1 / 1.3);
  }
  function zoomAt(cx, cy, f) {
    const z = Math.max(1, Math.min(3, view.z * f)), k = z / view.z; if (k === 1) return;
    view.x = cx - (cx - view.x) * k; view.y = cy - (cy - view.y) * k; view.z = z;
    if (z === 1) fit(); else apply();
  }
  function pan() {
    const g = $('#ecG'), P = new Map(); let d0 = 0, moved = 0;
    g.addEventListener('pointerdown', e => { if (e.target.closest('.ec-zoom')) return; P.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; d0 = 0; });
    g.addEventListener('pointermove', e => {
      if (!P.has(e.pointerId)) return; const o = P.get(e.pointerId), n = [e.clientX, e.clientY];
      if (P.size === 2) {
        const v = [...P.entries()].map(([id, p]) => id === e.pointerId ? n : p), d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]);
        if (d0) { const r = g.getBoundingClientRect(); zoomAt((v[0][0] + v[1][0]) / 2 - r.left, (v[0][1] + v[1][1]) / 2 - r.top, d / d0); } d0 = d; P.set(e.pointerId, n); moved = 99; return;
      }
      if (view.z > 1) { moved += Math.abs(n[0] - o[0]) + Math.abs(n[1] - o[1]); if (moved > 6) { view.x += n[0] - o[0]; view.y += n[1] - o[1]; apply(); } }
      P.set(e.pointerId, n);
    });
    const up = e => { P.delete(e.pointerId); d0 = 0; };
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    g.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
    g.addEventListener('wheel', e => { e.preventDefault(); const r = g.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
  }

  // ---------------------------------------------------------------- the panel under the graph
  const chip = id => '<span style="white-space:nowrap">' + art(id, 22) + ' ' + esc(nameOf(id)) + '</span>';
  function panel() {
    const p = $('#ecP'), w = W(); let h = '';
    const worth = M.ids.reduce((s, id) => s + w.bal(id) * M.val[id], 0);
    if (!sel.length) {
      h = '<h3>Your wallet</h3><p>Worth about <b>' + num(worth) + ' G</b> in all (G is the gold-equivalent every coin is priced in).</p>' +
        '<p class="ec-muted">Tap a coin to see who trades it. Tap a second coin to find the cheapest route between them.</p>' +
        '<details open><summary>All ' + M.ids.length + ' coins</summary><table><thead><tr><th>Coin</th><th class="n">Worth</th><th class="n">You hold</th><th class="n">Earned</th></tr></thead><tbody>' +
        M.ids.map(id => '<tr><td>' + art(id, 18) + ' ' + esc(cap(nameOf(id))) + '</td><td class="n">' + M.val[id] + ' G</td><td class="n">' + num(w.bal(id)) + '</td><td class="n">' + num(w.earned(id)) + '</td></tr>').join('') + '</tbody></table></details>';
    } else if (sel.length === 1) {
      const a = sel[0], P = M.partners(a).sort((x, y) => x.fee - y.fee);
      h = '<h3>' + art(a, 28) + ' ' + esc(cap(nameOf(a))) + '</h3><p>Worth <b>' + M.val[a] + ' G</b> each. You hold <b>' + num(w.bal(a)) + '</b> ' + esc(plural(a)) + ' (earned ' + num(w.earned(a)) + ' in all).</p>' +
        '<p class="ec-muted">Trades directly with ' + P.length + ' coin' + (P.length > 1 ? 's' : '') + '. Tap one to plan a swap.</p><div class="ec-rows">' +
        P.map(q => '<button class="ec-row" data-to="' + q.id + '">' + art(q.id, 26) + '<span>1 ' + esc(nameOf(a)) + ' = <b>' + fmtR(q.rate) + '</b> ' + esc(q.rate === 1 ? nameOf(q.id) : plural(q.id)) + '</span><i class="ec-muted">fee ' + pct(q.fee) + '</i></button>').join('') + '</div>';
    } else {
      const [a, b] = sel, r = M.best(a, b), dir = M.direct[a + '>' + b];
      h = '<h3>' + esc(cap(nameOf(a))) + ' → ' + esc(nameOf(b)) + '</h3>';
      if (!r) h += '<p>No route between these coins.</p>';
      else {
        h += '<div class="ec-route">' + r.path.map((id, i) => (i ? '<i>→</i>' : '') + chip(id)).join('') + '</div>' +
          '<p>1 ' + esc(nameOf(a)) + ' = <b>' + fmtR(r.rate) + '</b> ' + esc(r.rate === 1 ? nameOf(b) : plural(b)) + ' after ' + (r.path.length - 1) + ' swap' + (r.path.length > 2 ? 's' : '') + ' and fees of <b>' + pct(r.fee) + '</b>.</p>' +
          '<p class="ec-muted">' + (dir ? (r.path.length === 2 ? 'This pair trades directly, and that is the cheapest way.' : 'They trade directly (fee ' + pct(dir.fee) + ') but going round costs less.') : 'No direct market: the swaps go through ' + (r.path.length - 2) + ' other coin' + (r.path.length > 3 ? 's' : '') + '.') + '</p>' +
          '<p>You hold <b>' + num(w.bal(a)) + '</b> ' + esc(plural(a)) + ' and <b>' + num(w.bal(b)) + '</b> ' + esc(plural(b)) + '.</p>' +
          '<div class="ec-act"><button class="ec-btn" id="ecConv"' + (w.bal(a) < 1 ? ' disabled' : '') + '>Convert…</button><button class="ec-btn alt" id="ecSwap" aria-label="Reverse the direction">⇄ Reverse</button></div>' +
          (w.bal(a) < 1 ? '<p class="ec-muted">You have no ' + esc(plural(a)) + ' yet. Play a level in ' + esc(M.skins.find(k => k.id === a).name) + ' to earn some.</p>' : '');
      }
    }
    p.innerHTML = h;
    p.querySelectorAll('.ec-row').forEach(b => b.onclick = () => pick(b.dataset.to));
    const cv = $('#ecConv'); if (cv) cv.onclick = () => openSheet(sel[0], sel[1]);
    const sw = $('#ecSwap'); if (sw) sw.onclick = () => { sel = [sel[1], sel[0]]; draw(); panel(); };
  }

  // ---------------------------------------------------------------- the confirm sheet
  function openSheet(a, b) {
    const w = W(), max = w.bal(a), S = $('#ecS'), C = $('.ec-sc', S); from = document.activeElement;
    if (max < 1) return;
    let amt = Math.max(1, Math.min(max, Math.ceil(max / 2)));
    C.innerHTML = '<h3 id="ecST">Convert ' + esc(plural(a)) + ' to ' + esc(plural(b)) + '</h3>' +
      '<div class="ec-route" id="ecR"></div>' +
      '<div class="ec-amt"><input type="range" id="ecRg" min="1" max="' + max + '" step="1" aria-label="Amount of ' + esc(plural(a)) + ' to spend"><input type="number" id="ecNum" min="1" max="' + max + '" step="1" inputmode="numeric" aria-label="Amount to spend"></div>' +
      '<div class="ec-qk"><button data-f="0.25">25%</button><button data-f="0.5">50%</button><button data-f="0.75">75%</button><button data-f="1">Max</button></div>' +
      '<dl class="ec-q" id="ecQ"></dl><p class="ec-muted" id="ecNote"></p>' +
      '<div class="ec-act"><button class="ec-btn alt" id="ecNo">Cancel</button><button class="ec-btn" id="ecOk">Confirm</button></div>';
    const rg = $('#ecRg', C), nm = $('#ecNum', C), q = $('#ecQ', C), ok = $('#ecOk', C), note = $('#ecNote', C);
    function upd() {
      amt = Math.max(1, Math.min(max, amt)); rg.value = amt; if (document.activeElement !== nm) nm.value = amt;
      const Q = M.quote(a, b, amt), r = M.best(a, b);
      $('#ecR', C).innerHTML = r.path.map((id, i) => (i ? '<i>→</i>' : '') + chip(id)).join('');
      if (!Q) { q.innerHTML = '<dt>You pay</dt><dd>—</dd><dt>You get</dt><dd>0</dd>'; note.textContent = 'That buys less than one whole ' + nameOf(b) + '. Spend about ' + Math.ceil(1 / r.rate) + ' ' + plural(a) + ' or more.'; ok.disabled = true; return; }
      ok.disabled = false;
      q.innerHTML = '<dt>You pay</dt><dd>' + num(Q.pay) + ' ' + esc(Q.pay === 1 ? nameOf(a) : plural(a)) + '</dd><dt>You get</dt><dd>' + num(Q.out) + ' ' + esc(Q.out === 1 ? nameOf(b) : plural(b)) + '</dd>' +
        '<dt>Fee</dt><dd>' + (Math.round(Q.feeG * 10) / 10) + ' G (' + pct(Q.feePct) + ')</dd><dt>You will hold</dt><dd>' + num(max - Q.pay) + ' and ' + num(w.bal(b) + Q.out) + '</dd>';
      note.textContent = 'Whole coins only, so a little rounding is part of the fee.' + (Q.pay < amt ? ' Only ' + Q.pay + ' are needed for that many ' + plural(b) + '.' : '');
    }
    rg.oninput = () => { amt = +rg.value; upd(); };
    nm.oninput = () => { const v = Math.floor(+nm.value); if (v >= 1) { amt = v; upd(); } };
    nm.onchange = () => { amt = Math.max(1, Math.min(max, Math.floor(+nm.value) || 1)); nm.value = amt; upd(); };
    C.querySelectorAll('.ec-qk button').forEach(bt => bt.onclick = () => { amt = Math.round(max * +bt.dataset.f); upd(); });
    $('#ecNo', C).onclick = closeSheet;
    ok.onclick = () => {
      const Q = M.quote(a, b, amt); if (!Q) return;
      if (w.swap(a, Q.pay, b, Q.out)) {
        const t = 'Converted ' + num(Q.pay) + ' ' + (Q.pay === 1 ? nameOf(a) : plural(a)) + ' into ' + num(Q.out) + ' ' + (Q.out === 1 ? nameOf(b) : plural(b)) + '.';
        $('#ecL').textContent = t; closeSheet(); draw(); panel();
        if (!reduced) [a, b].forEach(id => { const el = $('.ec-n[data-id="' + id + '"]'); if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } });
        $('#ecP').insertAdjacentHTML('afterbegin', '<p><b>' + esc(t) + '</b></p>');
      }
    };
    upd(); S.classList.add('on'); setTimeout(() => rg.focus(), 30);
  }
  function closeSheet() { $('#ecS').classList.remove('on'); if (from && from.isConnected && from.focus) from.focus(); }

  // ---------------------------------------------------------------- open / close
  function open(o) {
    build(); M = model(); o = o || {};
    root._from = document.activeElement; root.classList.add('on');
    sel = o.skin && M.ids.includes(o.skin) ? [o.skin] : [];
    view = { z: 1, x: 0, y: 0 };
    stage(); panel(); fit();
    setTimeout(() => { fit(); $('.ec-x').focus(); }, 30);
    if (window.FTH_LOG) try { FTH_LOG.ev('wallet_open', { skin: o.skin }); } catch (e) {}
  }
  function close() { $('#ecS').classList.remove('on'); root.classList.remove('on'); if (root._from && root._from.isConnected && root._from.focus) root._from.focus(); }
  api.open = open; api.close = close;
})();
