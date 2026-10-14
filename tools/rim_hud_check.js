// End-to-end check of the star rim HUD (rimstar.js on rim.js) in the real shell, headless Chrome (tools/cdp.js):
//   node docs/game/tools/rim_hud_check.js [--shots dir]
//   - on a π-island level (7.2 The loop, every state double locked) the HUD shows; its trouble spot, lock count and π
//     match rim.js run on the shell's own colouring;
//   - three π swaps in a row on the island board: the spot hops t -> t+3 each time (the edge swings), the run counts 3,
//     and a 'star_hop' research event is logged per hop; a swap that is not π resets the run;
//   - a tap folds it to a small star button, remembered across a reload (localStorage fth-rimstar), and back;
//   - not shown before the π island (Level 4) or on Level -1; ?rimstar=1 shows it on Level 4;
//   - play pages in frames (Rat Maze: compact HUD, Dots: minimal): a π swap made inside the page hops the shell's HUD;
//   - layout at 360, 390 and 1280 px: inside the screen, no overlap with the rim bar, star meter or the floating map;
//   - reduced motion: the edge lands at once, no hop animation; no script errors anywhere.
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2), si = args.indexOf('--shots'), SH = si >= 0 ? args[si + 1] : null;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)) : '')); if (!c) bad++; };
const until = async (P, expr, ms) => { for (let t = 0; t < (ms || 15000); t += 150) { try { if (await P.eval(expr)) return true; } catch (e) { /* reloading */ } await sleep(150); } return false; };
const INIT = `try { if (!sessionStorage.getItem('fresh')) { sessionStorage.setItem('fresh', '1'); localStorage.clear(); } } catch (e) {}
  window.__errs = []; addEventListener('error', e => __errs.push(e.message)); window.__ev = [];
  addEventListener('DOMContentLoaded', () => { const L = window.FTH_LOG; if (L) { const o = L.ev; L.ev = (t, d) => { __ev.push([t, d]); return o.call(L, t, d); }; } });`;
// rim.js on the shell's colouring (the reference the HUD must show)
const REF = `(() => { const G = FTH_RIM.graph(__game.graph), R = FTH_RIM.analyse(G, __game.col); return { star: R.star, status: R.status, lock: R.lock, pi: R.pi && R.pi.vs.join('.'), piStar: R.pi ? R.pi.star : -1 }; })()`;
const HUD = `(() => { const e = document.getElementById('rimStar'), s = __rimstar.state(), h = e.querySelector('.rs-hot'); return Object.assign(s, { dom: e.dataset.star, cls: e.className, label: e.getAttribute('aria-label'),
  hot: h ? ['x1', 'y1', 'x2', 'y2'].map(a => +h.getAttribute(a)) : null, locks: e.querySelectorAll('.rs-lock').length, piArrow: !!e.querySelector('.rs-pi'), vis: getComputedStyle(e).display !== 'none' }); })()`;
// swap the chain with these tiles on the island board (test hooks: capture + flip), and wait for the flip to land
const islSwap = vs => `(async () => { const K = __game.chains.find(K => K.vs.join('.') === '${vs}'); if (!K) return false; __game.capture(K); __game.flip(K);
  const t0 = performance.now(); while (__game.busy && performance.now() - t0 < 8000) await new Promise(r => setTimeout(r, 40)); return true; })()`;
const rects = `(() => { const r = s => { const e = document.querySelector(s); if (!e || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return b.width ? [b.left, b.top, b.right, b.bottom] : null; };
  return { star: r('#rimStar'), goal: r('#goal'), meter: r('#starMeter'), mini: r('#mini'), menu: r('#btnMenu'), W: innerWidth, sw: document.documentElement.scrollWidth }; })()`;
const hit = (a, b) => a && b && a[0] < b[2] - .5 && b[0] < a[2] - .5 && a[1] < b[3] - .5 && b[1] < a[3] - .5;
(async () => {
  if (SH) fs.mkdirSync(SH, { recursive: true });
  const srv = await serve(ROOT), B = await launch();
  const P = await B.page(390, 844, 1); await P.addScript(INIT);
  const go = async q => { await P.goto(srv.url + 'index.html' + q); await until(P, `!!window.__rimstar && !!window.__game && !!__game.level`); await sleep(500); };
  const shot = async (Pg, n) => { if (SH) { await sleep(700); await Pg.shot(path.join(SH, n + '.png')); } };
  try {
    // ---- the island board, 7.2 The loop
    await go('?all=1&view=game&lvl=the-loop');
    ok('the HUD shows on a π-island level', await until(P, `__rimstar.state().shown && document.getElementById('rimStar').classList.contains('on')`));
    let ref = await P.eval(REF), h = await P.eval(HUD);
    ok('its trouble spot, status and locks match rim.js on the shell\'s colouring', h.star === ref.star && +h.dom === ref.star && h.status === ref.status && h.lock === ref.lock && h.locks === ref.lock, { hud: [h.star, h.status, h.locks], rim: [ref.star, ref.status, ref.lock] });
    ok('double locked: two padlocks and the π arrow', ref.status === 'double' && h.locks === 2 && h.piArrow);
    ok('an accessible label names the spot and the lock', /Rim star: \w+ twice on the rim, tiles \d and \d; star point \d of 5; double lock/.test(h.label), h.label);
    await shot(P, 'island-390');
    const seq = [ref.star];
    for (let i = 1; i <= 3; i++) {
      const before = await P.eval(REF);
      ok('π swap ' + i + ' lands', await P.eval(islSwap(before.pi)));
      const mid = await (async () => { await sleep(120); return P.eval(HUD); })();
      await sleep(800); h = await P.eval(HUD); ref = await P.eval(REF); seq.push(h.star);
      ok('π ' + i + ': the spot hops two rim places (t -> t+3) and the HUD follows rim.js', h.star === (before.star + 3) % 5 && h.star === ref.star && h.star === before.piStar && +h.dom === h.star, [before.star, h.star]);
      ok('π ' + i + ': the hop is animated (the edge swings, the chip bounces)', /hop/.test(mid.cls) && JSON.stringify(mid.hot) !== JSON.stringify(h.hot), { mid: mid.hot, end: h.hot });
      ok('π ' + i + ': hops ' + i + ', run ' + i + ', last hop marked π', h.hops === i && h.run === i && h.last && h.last.pi && h.last.d === 3, h.last);
    }
    ok('the treadmill traces the star: t, t+3, t+6, t+9', seq.every((t, i) => !i || t === (seq[i - 1] + 3) % 5), seq.join(' -> '));
    const ev = await P.eval(`__ev.filter(e => e[0] === 'star_hop').map(e => e[1])`);
    ok('a star_hop research event per hop, with from/to, π and the run', ev.length === 3 && ev.every((e, i) => e.pi && e.run === i + 1 && e.to === seq[i + 1] && e.from === seq[i] && e.lvl === 'the-loop' && e.state), ev.map(e => e.from + '>' + e.to + ' run ' + e.run).join(', '));
    ok('the HUD keeps the spot\'s path: the edges it sat on', h.trail.length === 4 || new Set(seq).size === h.trail.length, h.trail);
    await shot(P, 'island-after-3pi');
    // a swap that is not π resets the run
    const other = await P.eval(`(() => { const R = FTH_RIM.analyse(FTH_RIM.graph(__game.graph), __game.col), pi = R.pi && R.pi.vs.join('.');
      const K = __game.chains.find(K => !K.web && K.size > 1 && K.vs.join('.') !== pi && __game.dist() !== null); return K ? K.vs.join('.') : null; })()`);
    await P.eval(islSwap(other)); await sleep(800); h = await P.eval(HUD);
    ok('a swap other than π resets the run', h.run === 0 && h.star === (await P.eval(REF)).star, h.run);
    // fold, remembered across a reload
    await P.eval(`document.getElementById('rimStar').click()`); await sleep(200);
    h = await P.eval(HUD);
    ok('a tap folds it to a small star button (aria-pressed false), remembered', /fold/.test(h.cls) && await P.eval(`localStorage.getItem('fth-rimstar') === 'off' && document.getElementById('rimStar').getAttribute('aria-pressed') === 'false'`));
    await shot(P, 'island-folded');
    await go('?all=1&view=game&lvl=the-loop');
    ok('still folded after a reload', await until(P, `/fold/.test(document.getElementById('rimStar').className) && __rimstar.state().on`));
    await P.eval(`document.getElementById('rimStar').click()`); await sleep(200);
    ok('a second tap shows it again', !(/fold/.test((await P.eval(HUD)).cls)) && await P.eval(`localStorage.getItem('fth-rimstar') === 'on'`));
    // where it shows
    await go('?all=1&view=game&lvl=kempes-double');
    ok('not shown before the π island (Level 4)', !(await P.eval(HUD)).vis && !(await P.eval(`__rimstar.state().on`)));
    await go('?all=1&view=game&lvl=splash');
    ok('not shown on Level -1 (two elements)', !(await P.eval(HUD)).vis);
    await go('?all=1&rimstar=1&view=game&lvl=kempes-double');
    ok('?rimstar=1 shows it on Level 4', await until(P, `__rimstar.state().shown`) && (await P.eval(HUD)).star === (await P.eval(REF)).star);
    // layout: phone, small phone, desktop, on the island board
    for (const [w, hh] of [[360, 740], [390, 844], [1280, 800]]) {
      const Q = await B.page(w, hh, 1); await Q.addScript(INIT);
      await Q.goto(srv.url + 'index.html?all=1&view=game&lvl=the-loop'); await until(Q, `!!window.__rimstar && __rimstar.state().shown`); await sleep(1200);
      const r = await Q.eval(rects);
      ok('island board at ' + w + ' px: inside the screen, clear of the rim bar and star meter, no sideways scroll', r.star && r.star[0] >= 0 && r.star[2] <= r.W && !hit(r.star, r.goal) && !hit(r.star, r.meter) && r.sw <= r.W, r);
      if (w !== 390) await shot(Q, 'island-' + w);
      ok('no script errors (' + w + ' px)', !Q.logs.length && !(await Q.eval('__errs.length')), Q.logs.concat(await Q.eval('__errs')));
    }
    // ---- play pages in frames: a π swap made inside the page hops the shell's HUD
    for (const [sk, w, hh] of [['maze', 390, 844], ['dots', 390, 844], ['tables', 1280, 800], ['maze', 1280, 800]]) {
      const Q = await B.page(w, hh, 1); await Q.addScript(INIT);
      await Q.goto(srv.url + 'index.html?all=1&skin=' + sk + '&view=game&lvl=the-loop');
      const ready = await until(Q, `(() => { const f = document.getElementById('skinFrame'); return !!(f && f.contentWindow && f.contentWindow.LAB && f.contentWindow.LAB.last() && window.__rimstar && __rimstar.state().shown); })()`, 20000);
      ok(sk + ' (' + w + ' px): the page loads in its frame and the HUD shows (hud ' + await Q.eval(`__game.act.hud`) + ')', ready);
      if (!ready) continue;
      await sleep(1500);
      const before = await Q.eval(REF);
      const done = await Q.eval(`(() => { const g = document.getElementById('skinFrame').contentWindow.LAB.last(), K = g.chains.find(K => K.vs.join('.') === '${before.pi}'); if (!K) return false; g.swap(K); return true; })()`);
      ok(sk + ': π swapped inside the play page', done);
      await until(Q, `__rimstar.state().hops === 1`, 5000); await sleep(800);
      const hq = await Q.eval(HUD), rq = await Q.eval(REF);
      ok(sk + ': the shell\'s HUD hopped t -> t+3 and matches rim.js', hq.hops === 1 && hq.star === (before.star + 3) % 5 && hq.star === rq.star && hq.last.pi, [before.star, hq.star]);
      const r = await Q.eval(rects);
      ok(sk + ' (' + w + ' px): inside the screen, clear of the star meter, menu and floating map', r.star && r.star[0] >= 0 && r.star[2] <= r.W && !hit(r.star, r.meter) && !hit(r.star, r.menu) && !hit(r.star, r.mini), r);
      await shot(Q, sk + '-' + w);
      ok(sk + ': no script errors', !Q.logs.length && !(await Q.eval('__errs.length')), Q.logs.concat(await Q.eval('__errs')));
    }
    // ---- reduced motion: the edge lands at once
    const R = await B.page(390, 844, 1); await R.addScript(INIT);
    await R.S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await R.goto(srv.url + 'index.html?all=1&view=game&lvl=the-loop'); await until(R, `!!window.__rimstar && __rimstar.state().shown`); await sleep(600);
    const b0 = await R.eval(REF); await R.eval(islSwap(b0.pi)); await sleep(60);
    const m0 = await R.eval(HUD); await sleep(700); const m1 = await R.eval(HUD);
    ok('reduced motion: no swing, no bounce (the edge is already at its new place)', m0.hops === 1 && JSON.stringify(m0.hot) === JSON.stringify(m1.hot), { at60ms: m0.hot, later: m1.hot });
    ok('no script errors (island board)', !P.logs.length && !(await P.eval('__errs.length')) && !R.logs.length, P.logs.concat(R.logs));
  } catch (e) { ok('ran without throwing', false, e.stack); }
  B.close(); srv.close();
  console.log(bad ? '\n' + bad + ' FAILED' : '\nall ok');
  process.exit(bad ? 1 : 0);
})();
