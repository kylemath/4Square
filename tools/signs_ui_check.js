// End to end check of the Signs skin (lab/signs.html), headless Chrome (tools/cdp.js):   node tools/signs_ui_check.js [--shots dir]
//   - the page alone: tap a corner, its chain chips appear; tap a chip: exactly the chain's touching triangles glow;
//     FLIP: exactly those triangles change sign, every other sign stays, and the board shows FTH_SIGNS.signs of the new
//     colouring; a drag from a corner onto a neighbour swaps that chain; undo puts the signs back; both views draw every face;
//   - inside the shell (index.html?skin=signs): the level runs in Signs, a swap made through the page's UI reaches the shell
//     (same colouring, same move count), playing on to the win brings up the shell's win card; Level -1 (a pond, not a
//     triangulation) falls back to the island board (needs: ['tri']);
//   - no script errors. --shots writes 390 x 844 and 1280 x 800 shots: a small level, kempes-double, the largest level,
//     mid-swap, the win, both views.
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2), si = args.indexOf('--shots'), SH = si >= 0 ? args[si + 1] : null;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)) : '')); if (!c) bad++; };
const until = async (P, expr, ms) => { for (let t = 0; t < (ms || 15000); t += 150) { try { if (await P.eval(expr)) return true; } catch (e) { /* loading */ } await sleep(150); } return false; };
const INIT = `try { if (!sessionStorage.getItem('fresh')) { sessionStorage.setItem('fresh', '1'); localStorage.clear(); } } catch (e) {} window.__errs = []; addEventListener('error', e => __errs.push(e.message));`;
(async () => {
  if (SH) fs.mkdirSync(SH, { recursive: true });
  const srv = await serve(ROOT), B = await launch();
  const shot = async (P, n) => { if (SH) await P.shot(path.join(SH, n + '.png')); };
  try {
    // ---------------------------------------------------------------- the page alone
    for (const [w, h] of [[390, 844], [1280, 800]]) {
      const P = await B.page(w, h, 2); await P.addScript(INIT);
      const tag = w + 'x' + h;
      for (const lvl of ['spark', 'kempes-double', 'second-pit']) {
        await P.goto(srv.url + 'lab/signs.html?lvl=' + lvl); await until(P, '!!window.SIGNS'); await sleep(500);
        if (lvl === 'second-pit') {
          for (const v of ['ring', 'pair']) {
            const vw = await P.eval('SIGNS.view()'); if (vw !== v) { await P.eval("document.getElementById('bView').click()"); await sleep(400); }
            const drawn = await P.eval('SIGNS.faces()'), C = await P.eval('SIGNS.C.faces.map(f => f.side + (f.open ? "o" : "") + (f.r[0] === 0 && f.r[2] === SIGNS.C.n - 1 ? "x" : ""))');
            ok(tag + ' ' + v + ' view draws every face (the one round the gap is the sky)', drawn.every((k, i) => k === 1 || (k === 0 && v === 'ring' && /x/.test(C[i]))), drawn.filter(k => !k).length + ' undrawn');
            await shot(P, tag + '-largest-' + v);
          }
          continue;
        }
        await shot(P, tag + '-' + lvl);
      }
      // a swap through the UI on kempes-double
      await P.goto(srv.url + 'lab/signs.html?lvl=kempes-double'); await until(P, '!!window.SIGNS'); await sleep(400);
      const pre = await P.eval(`(() => { const g = SIGNS.g, K = g.good()[0], u = K.vs.find(v => g.chainsThrough(v).includes(K)) ; return { u, key: K.key, at: SIGNS.pos(u), want: FTH_SIGNS.touching(SIGNS.C, K.set), before: SIGNS.shown(), i: SIGNS.chainsOf(u).findIndex(c => c.K === K) }; })()`);
      await P.click(pre.at[0], pre.at[1]); await sleep(300);
      const chips = await P.eval(`[...document.querySelectorAll('#chips .kc')].map(b => { const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })`);
      ok(tag + ' tap a corner: its chain chips', chips.length >= 1 && chips.length <= 3, chips.length);
      await P.click(chips[pre.i][0], chips[pre.i][1]); await sleep(300);
      const glow = await P.eval(`[...new Set([...document.querySelectorAll('.tf.pre')].map(e => +e.dataset.f))].sort((a, b) => a - b)`);
      ok(tag + ' tap a chip: exactly the touching triangles glow', JSON.stringify(glow) === JSON.stringify(pre.want.slice().sort((a, b) => a - b)), glow.length + ' of ' + pre.want.length);
      await shot(P, tag + '-preview');
      const go = await P.eval(`(() => { const r = document.getElementById('go').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
      await P.click(go[0], go[1]); await sleep(170); await shot(P, tag + '-midswap');
      await until(P, '!SIGNS.busy()'); await sleep(300);
      const post = await P.eval(`({ moves: SIGNS.g.moves, shown: SIGNS.shown(), truth: Array.from(FTH_SIGNS.signs(SIGNS.C, SIGNS.g.col)) })`);
      const changed = post.shown.map((s, i) => s !== pre.before[i] ? i : -1).filter(i => i >= 0);
      ok(tag + ' FLIP: one swap', post.moves === 1);
      ok(tag + ' exactly the predicted triangles flipped', JSON.stringify(changed) === JSON.stringify(pre.want.slice().sort((a, b) => a - b)) && changed.every(i => post.shown[i] === -pre.before[i]), changed.length + ' flipped');
      ok(tag + ' the board shows the new colouring\'s signs', JSON.stringify(post.shown) === JSON.stringify(post.truth));
      // a drag from a corner onto a neighbour of another element swaps that chain
      const dr = await P.eval(`(() => { const g = SIGNS.g; for (const u of SIGNS.C.ring) { if (u === g.hole) continue; for (const v of g.adj[u]) { if (v === g.hole || g.col[v] === g.col[u]) continue; const K = g.chainAt(u, g.col[v]); if (!K.web) return { a: SIGNS.pos(u), b: SIGNS.pos(v), key: K.key }; } } })()`);
      await P.S('Input.dispatchMouseEvent', { type: 'mousePressed', x: dr.a[0], y: dr.a[1], button: 'left', buttons: 1, clickCount: 1 });
      for (let k = 1; k <= 8; k++) { await P.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: dr.a[0] + (dr.b[0] - dr.a[0]) * k / 8, y: dr.a[1] + (dr.b[1] - dr.a[1]) * k / 8, button: 'left', buttons: 1 }); await sleep(20); }
      await P.S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: dr.b[0], y: dr.b[1], button: 'left', buttons: 0, clickCount: 1 });
      await until(P, '!SIGNS.busy()'); await sleep(300);
      ok(tag + ' a drag along a border swaps that chain', (await P.eval('SIGNS.g.moves')) === 2);
      await P.eval("document.getElementById('bUndo').click()"); await sleep(200); await P.eval("document.getElementById('bUndo').click()"); await sleep(300);
      ok(tag + ' undo puts the signs back', JSON.stringify(await P.eval('SIGNS.shown()')) === JSON.stringify(pre.before));
      ok(tag + ' no script errors (page)', !P.logs.length && !(await P.eval('__errs.length')), P.logs[0] || '');
      P.S('Target.closeTarget', {}).catch(() => 0);
    }
    // ---------------------------------------------------------------- inside the shell
    for (const [w, h] of [[390, 844], [1280, 800]]) {
      const P = await B.page(w, h, 2); await P.addScript(INIT);
      const tag = 'shell-' + w + 'x' + h, F = 'document.getElementById("skinFrame")', FW = F + '.contentWindow';
      await P.goto(srv.url + 'index.html?all=1&skin=signs&view=game&lvl=kempes-double');
      const up = await until(P, `!!window.__game && ${FW}.SIGNS`, 20000); await sleep(1200);
      ok(tag + ' the level runs in Signs', up && (await P.eval('__game.act.id')) === 'signs');
      if (w === 390) await shot(P, tag + '-kempes-double');
      const tapAt = async ([x, y]) => { const r = await P.eval(`(() => { const r = ${F}.getBoundingClientRect(); return [r.x, r.y]; })()`); await P.click(r[0] + x, r[1] + y); };
      let n = 0;
      while (!(await P.eval(`${FW}.SIGNS.g.won()`)) && n++ < 12) {
        const s = await P.eval(`(() => { const S = ${FW}.SIGNS, g = S.g, K = g.good()[0], u = K.vs[0]; return { at: S.pos(u), i: S.chainsOf(u).findIndex(c => c.K === K) }; })()`);
        await tapAt(s.at); await sleep(250);
        const chip = await P.eval(`(() => { const b = ${FW}.document.querySelectorAll('#chips .kc')[${s.i}].getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
        await tapAt(chip); await sleep(250); await tapAt(chip);       // the chosen chip again = FLIP
        await sleep(200); if (n === 1 && w === 1280) await shot(P, tag + '-midswap');
        await until(P, `!${FW}.SIGNS.busy()`); await sleep(500);
        const st = await P.eval(`(() => { const g = ${FW}.SIGNS.g; return { page: g.col.map((c, u) => u === g.hole ? -1 : c).join(), shell: __game.col.map((c, u) => u === g.hole ? -1 : c).join(), pm: g.moves }; })()`);
        ok(tag + ' swap ' + n + ' reaches the shell (same colouring)', st.page === st.shell, st.pm + ' moves');
      }
      ok(tag + ' won in the page', await P.eval(`${FW}.SIGNS.g.won()`));
      await sleep(1600); await shot(P, tag + '-win-scene');
      const card = await until(P, `document.getElementById('win').classList.contains('on')`, 12000);
      ok(tag + ' the shell shows its win card', card);
      await sleep(1500); await shot(P, tag + '-win-card');
      ok(tag + ' no script errors (shell)', !P.logs.length && !(await P.eval('__errs.length')), P.logs[0] || '');
      if (w === 390 && SH) for (const v of ['title', 'howto', 'menu']) { await P.goto(srv.url + 'index.html?all=1&skin=signs&view=' + v); await sleep(1800); await shot(P, 'shell-' + v); }
      if (w === 390) {
        await P.goto(srv.url + 'index.html?all=1&skin=signs&view=game&lvl=splash'); await until(P, '!!window.__game && __game.act', 15000); await sleep(800);
        ok('a pond (Level -1) falls back to the island board', (await P.eval('__game.act.id')) === 'islands');
      }
      P.S('Target.closeTarget', {}).catch(() => 0);
    }
  } finally { B.close(); srv.close(); }
  console.log(bad ? bad + ' FAILED' : 'signs UI OK');
  process.exit(bad ? 1 : 0);
})();
