// lab/flip.html end to end in headless Chrome (tools/cdp.js, no npm packages):   node tools/flip_ui_check.js [--shots dir]
//   - level 1 loads with no errors, its par is the solver's; clicking the solver's moves (diagonal midpoints) wins, the win
//     card shows 3 stars, the vertices show the colouring;
//   - an illegal flip (two different signs) changes nothing, shakes, and explains with ＋ | −; undo, reset and the hint
//     (the glowing diagonal is the solver's next move) work; Enter on a focused diagonal flips it;
//   - a free-signs level: tapping inside triangles switches signs, the solver's best signing then wins;
//   - the sphere view glues the target's n-3 diagonals outside the ring; every level generates in the page;
//   - phone (390 px) and desktop widths: no horizontal scroll, controls at least 40 px, light and dark; no console errors.
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2), si = args.indexOf('--shots'), SH = si >= 0 ? args[si + 1] : null;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)) : '')); if (!c) bad++; };
// screen point of a diagonal's midpoint, or of a triangle's centroid, on board #id
const midOf = (id, d) => `(() => { const s = document.getElementById('${id}'), l = s.querySelector('.dg[data-d="${d}"] .vis'); if (!l) return null; const m = s.getScreenCTM(), p = s.createSVGPoint();
  p.x = (+l.getAttribute('x1') + +l.getAttribute('x2')) / 2; p.y = (+l.getAttribute('y1') + +l.getAttribute('y2')) / 2; const q = p.matrixTransform(m); return [q.x, q.y]; })()`;
const triOf = (id, t) => `(() => { const s = document.getElementById('${id}'), g = s.querySelector('.tri-g[data-t="${t}"] .tri'); if (!g) return null; const m = s.getScreenCTM(), p = s.createSVGPoint();
  const v = g.getAttribute('points').split(' ').map(x => x.split(',').map(Number)); p.x = (v[0][0] + v[1][0] + v[2][0]) / 3; p.y = (v[0][1] + v[1][1] + v[2][1]) / 3; const q = p.matrixTransform(m); return [q.x, q.y]; })()`;
(async () => {
  if (SH) fs.mkdirSync(SH, { recursive: true });
  const srv = await serve(ROOT), B = await launch();
  const hook = `window.__errs = []; addEventListener('error', e => __errs.push(String(e.message))); const ce = console.error; console.error = (...a) => { __errs.push(a.join(' ')); ce.apply(console, a); };
    try { if (!sessionStorage.getItem('fresh')) { sessionStorage.setItem('fresh', '1'); localStorage.clear(); } } catch (e) {}`;
  try {
    // ------------------------------------------------ phone
    const P = await B.page(390, 844, 2); await P.addScript(hook); await P.scheme(false);
    const shot = async (p, nm) => { if (SH) { await sleep(400); await p.shot(path.join(SH, nm + '.png')); } };
    await P.goto(srv.url + 'lab/flip.html?lvl=1'); await sleep(500);
    ok('first visit opens the how-to-play card', await P.eval(`document.getElementById('ovHelp').classList.contains('on')`));
    await shot(P, 'flip-phone-help');
    await P.eval(`document.getElementById('hOk').click()`); await sleep(200);
    const L1 = await P.eval(`({ par: FLIP_PAGE.puzzle.par, sol: FLIP_PAGE.solve(), n: FLIP_PAGE.puzzle.n, lvl: FLIP_PAGE.level() })`);
    ok('level 1 loads: par = the solver\'s optimal length', L1.lvl === 0 && L1.sol && L1.sol.length === L1.par, L1);
    // illegal flip on level 1 if there is one: find a diagonal with two different signs
    const illegal = await P.eval(`(() => { const F = FTH_FLIP, st = FLIP_PAGE.state; return st.T.find(d => !F.legal(st, d).ok); })()`);
    if (illegal != null) {
      const xy = await P.eval(midOf('svgA', illegal)); await P.click(xy[0], xy[1]); await sleep(120);
      const r = await P.eval(`({ m: FLIP_PAGE.moves(), msg: document.getElementById('msg').textContent, shake: !!document.querySelector('#svgA .dg.shake') })`);
      ok('an illegal flip changes nothing, shakes and explains with ＋ | −', r.m === 0 && /no flip/.test(r.msg) && r.shake, r.msg.slice(0, 60));
    }
    await shot(P, 'flip-phone-level1');
    for (const d of L1.sol) { const xy = await P.eval(midOf('svgA', d)); await P.click(xy[0], xy[1]); await sleep(380); }
    await sleep(1700);
    const w1 = await P.eval(`({ won: FLIP_PAGE.won, card: document.getElementById('ovWin').classList.contains('on'), stars: document.querySelectorAll('#winStars i.on').length,
      m: FLIP_PAGE.moves(), cols: document.querySelectorAll('#svgA .vt.c').length })`);
    ok('clicking the solver\'s moves wins level 1: the win card shows, 3 stars at par', w1.won && w1.card && w1.stars === 3 && w1.m === L1.par, w1);
    ok('the win shows the 4-colouring on the corners', w1.cols === L1.n);
    await shot(P, 'flip-phone-win');
    await P.eval(`document.getElementById('wSphere').click()`); await sleep(300);
    const gl = await P.eval(`({ on: document.body.classList.contains('glue'), arcs: document.querySelectorAll('#svgG .gl-out').length, matched: document.querySelectorAll('#svgG .gl-out.match').length, n: FLIP_PAGE.puzzle.n })`);
    ok('the sphere view glues the target\'s n-3 diagonals outside the ring, all matched', gl.on && gl.arcs === gl.n - 3 && gl.matched === gl.arcs, gl);
    await shot(P, 'flip-phone-sphere');
    await P.eval(`document.getElementById('bGlue').click()`);
    // ------------------------------------------------ a longer level: undo, reset, hint, keyboard
    await P.goto(srv.url + 'lab/flip.html?lvl=12&nohelp'); await sleep(400);
    const L12 = await P.eval(`({ par: FLIP_PAGE.puzzle.par, sol: FLIP_PAGE.solve() })`);
    let xy = await P.eval(midOf('svgA', L12.sol[0])); await P.click(xy[0], xy[1]); await sleep(350);
    ok('a legal flip counts one move', await P.eval('FLIP_PAGE.moves()') === 1);
    await P.eval(`document.getElementById('bUndo').click()`); await sleep(150);
    ok('undo takes it back', await P.eval(`FLIP_PAGE.moves() === 0 && FTH_FLIP.same(FLIP_PAGE.state.T, FLIP_PAGE.puzzle.T)`));
    await P.eval(`document.getElementById('bHint').click()`); await sleep(150);
    const h = await P.eval(`({ hd: +(document.querySelector('#svgA .dg.hint') || { dataset: {} }).dataset.d, sol: FLIP_PAGE.solve()[0], focus: document.activeElement && document.activeElement.dataset ? +document.activeElement.dataset.d : null })`);
    ok('the hint glows on the solver\'s next move and focuses it', h.hd === h.sol && h.focus === h.sol, h);
    await P.S('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await P.S('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await sleep(350);
    ok('Enter on the focused diagonal flips it', await P.eval('FLIP_PAGE.moves()') === 1);
    await P.S('Input.dispatchKeyEvent', { type: 'keyDown', key: 'r', code: 'KeyR', text: 'r' }); await P.S('Input.dispatchKeyEvent', { type: 'keyUp', key: 'r', code: 'KeyR' }); await sleep(150);
    ok('R resets', await P.eval('FLIP_PAGE.moves()') === 0);
    await P.eval(`document.getElementById('bCol').click()`); await sleep(200);
    ok('the colour toggle colours every corner on both boards', await P.eval(`document.querySelectorAll('#svgA .vt.c').length === FLIP_PAGE.puzzle.n && document.querySelectorAll('#svgB .vt.c').length === FLIP_PAGE.puzzle.n`));
    await shot(P, 'flip-phone-colours');
    await P.eval(`document.getElementById('bCol').click()`);
    // ------------------------------------------------ free signs
    const free = await P.eval(`FTH_FLIP.LEVELS.findIndex(l => l.free) + 1`);
    await P.goto(srv.url + 'lab/flip.html?lvl=' + free + '&nohelp'); await sleep(400);
    const fr = await P.eval(`(() => { const F = FTH_FLIP, Pz = FLIP_PAGE.puzzle, S = F.solveFree(Pz.n, Pz.T, Pz.target), cur = FLIP_PAGE.state.s;
      return { par: Pz.par, flip: S.best.path, diff: Object.keys(S.best.s).filter(k => S.best.s[k] !== cur[k]).map(Number), stuck: !F.solve(FLIP_PAGE.state, Pz.target), chip: !document.getElementById('freeChip').hidden }; })()`);
    ok('a free level starts on signs that cannot reach the target, in the sign phase', fr.stuck && fr.chip && fr.diff.length > 0, fr.diff.length + ' signs to change');
    await shot(P, 'flip-phone-free');
    for (const t of fr.diff) { xy = await P.eval(triOf('svgA', t)); await P.click(xy[0], xy[1]); await sleep(150); }
    ok('tapping triangles switches their signs (no flips counted)', await P.eval(`FLIP_PAGE.moves() === 0 && !!FTH_FLIP.solve(FLIP_PAGE.state, FLIP_PAGE.puzzle.target)`));
    for (const d of fr.flip) { xy = await P.eval(midOf('svgA', d)); await P.click(xy[0], xy[1]); await sleep(380); }
    await sleep(1600);
    ok('the best signing then wins the free level at par', await P.eval(`FLIP_PAGE.won && FLIP_PAGE.moves() === FLIP_PAGE.puzzle.par && document.getElementById('ovWin').classList.contains('on')`));
    // ------------------------------------------------ layout and timing
    const lay = await P.eval(`(() => { const small = [...document.querySelectorAll('button, select')].filter(b => b.offsetParent && (b.getBoundingClientRect().height < 40 || b.getBoundingClientRect().width < 40)).map(b => b.id);
      return { sw: document.documentElement.scrollWidth, w: innerWidth, small }; })()`);
    ok('phone: no horizontal scroll, every control at least 40 px', lay.sw <= lay.w && !lay.small.length, lay);
    const gen = await P.eval(`(() => { const t = performance.now(), F = FTH_FLIP; const ps = F.LEVELS.map(L => F.generate(L.n, L.seed, L)); return { ms: Math.round(performance.now() - t), ok: ps.every(p => p && p.par > 0) }; })()`);
    ok('every level generates in the page', gen.ok, gen.ms + ' ms for ' + 25 + ' levels');
    await P.goto(srv.url + 'lab/flip.html?lvl=21&nohelp'); await sleep(500); await shot(P, 'flip-phone-decagon');
    await P.scheme(true); await sleep(200); await shot(P, 'flip-phone-dark');
    const e1 = await P.eval('window.__errs');
    ok('phone: no console errors or exceptions', !P.logs.length && !e1.length, P.logs.concat(e1).join(' | '));
    // ------------------------------------------------ desktop
    const D = await B.page(1280, 860, 1); await D.addScript(hook); await D.scheme(false);
    await D.goto(srv.url + 'lab/flip.html?lvl=13&nohelp'); await sleep(500);
    const dl = await D.eval(`(() => { const a = document.getElementById('you').getBoundingClientRect(), b = document.getElementById('goal').getBoundingClientRect(); return { side: b.left > a.right - 1 && Math.abs(a.top - b.top) < 2, sw: document.documentElement.scrollWidth, w: innerWidth }; })()`);
    ok('desktop: yours on the left, target on the right, no horizontal scroll', dl.side && dl.sw <= dl.w, dl);
    await shot(D, 'flip-desktop');
    await D.eval(`document.getElementById('bGlue').click()`); await sleep(300); await shot(D, 'flip-desktop-sphere');
    await D.scheme(true); await D.eval(`document.getElementById('bGlue').click(); document.getElementById('bCol').click()`); await sleep(300); await shot(D, 'flip-desktop-dark');
    const e2 = await D.eval('window.__errs');
    ok('desktop: no console errors or exceptions', !D.logs.length && !e2.length, D.logs.concat(e2).join(' | '));
  } catch (e) { ok('ran to the end', false, e.stack || String(e)); }
  B.close(); srv.close();
  console.log(bad ? bad + ' problem(s)' : 'flip UI OK');
  process.exit(bad ? 1 : 0);
})();
