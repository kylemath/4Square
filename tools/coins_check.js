// End-to-end check of the coin wallet in the real shell (headless Chrome, no npm packages):  node docs/game/tools/coins_check.js [--shots dir]
//   - each skin's coin art reaches the counter, the flying loot and the bonus stacks (#coinG is the one source);
//   - playing in a skin credits THAT skin's wallet only (island board: a real capture and flip to a win; play-page skins: points through the same gain());
//   - an old save (no wallet) migrates once: its best points become the Islands balance 1:1;
//   - a hand-edited wallet is flagged by the integrity seal (save-edited, tamper count), a clean reload is not;
//   - the exchange converts along a multi-hop route, balances update, and the wallet stays sealed.
// --shots <dir> also writes 390x844 screenshots: contact sheet of the ten coins, the counter per skin, the exchange.
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2), si = args.indexOf('--shots'), SH = si >= 0 ? args[si + 1] : null;
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
// a page only runs its timers and animation frames while something drives it, so waits poll with a trivial eval
const nap = async (P, ms) => { for (let t = 0; t < ms; t += 400) { await sleep(400); await P.eval('1'); } };
const SAVE = 'fill-the-hole-v2', LV = 'one-of-each';
(async () => {
  if (SH) fs.mkdirSync(SH, { recursive: true });
  const srv = await serve(ROOT), B = await launch();
  // every page starts from clean storage (the browser profile is shared); `seed` is a saved game to put in first
  const open = async (q, seed) => { const P = await B.page(390, 844, 1); await P.addScript(`try { if (!sessionStorage.getItem('fresh')) { sessionStorage.setItem('fresh', '1'); localStorage.clear(); ${seed ? `localStorage.setItem('${SAVE}', ${JSON.stringify(JSON.stringify(seed))});` : ''} } } catch (e) {}`); await P.S('Page.bringToFront'); await P.goto(srv.url + 'index.html?' + q); await sleep(900); return P; };
  try {
    const P0 = await open('all=1&view=title&skin=islands');
    const ids = await P0.eval('FTH_SKINS.list.map(k => k.id)');
    console.log('skins: ' + ids.join(' '));
    // ---- art: #coinG follows the skin
    for (const id of ids) {
      const same = await P0.eval(`(() => { __selectSkin('${id}'); const inner = FTH_SKINS.coinOf(FTH_SKINS.get('${id}')).svg(26).replace(/^<svg[^>]*>/, '').replace(/<\\/svg>\\s*$/, ''); return document.getElementById('coinG').innerHTML.replace(/\\s/g, '').length > 0 && document.getElementById('coinG').children.length === (new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>', 'image/svg+xml').documentElement.children.length); })()`);
      ok(same, id + ': #coinG holds the skin coin art');
    }
    P0.S && 0;
    if (SH) {                                                  // contact sheet of all ten coins, on each skin's own card colour
      await P0.eval(`(() => { const d = document.createElement('div'); d.id = 'sheet'; d.style.cssText = 'position:fixed;inset:0;z-index:99;background:#f4efe4;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px;align-content:start;font:600 13px system-ui;color:#2b2438'; d.innerHTML = FTH_SKINS.list.map(k => { const c = FTH_SKINS.coinOf(k); return '<div style="background:#fff;border-radius:14px;padding:8px;display:flex;gap:10px;align-items:center;box-shadow:0 1px 4px #0003">' + c.svg(64) + '<div><b>' + c.name + '</b><br>' + c.value + ' G<br><span style="opacity:.6">' + k.name + '</span></div></div>'; }).join(''); document.body.appendChild(d); })()`);
      await sleep(200); await P0.shot(path.join(SH, 'coins-contact-sheet.png'));
    }
    // ---- earning + wallet per skin
    for (const id of ['islands', 'dots', 'ions', 'swipe', 'map']) {
      const P = await open('all=1&view=game&lvl=' + LV + '&skin=' + id);
      const r = id === 'islands' ? await P.eval(`(async () => { const g = __game; let n = 0; while (!g.won && n++ < 30) { const K = g.good()[0]; if (!K) break; g.capture(K); g.flip(K); const t0 = performance.now(); while ((g.busy) && performance.now() - t0 < 6000) await new Promise(r => setTimeout(r, 50)); await new Promise(r => setTimeout(r, 40)); } return { won: g.won, score: g.score }; })()`)
        : await P.eval(`(async () => { __game.gain(120); __game.gain(60); return { won: false, score: __game.score }; })()`);
      const fade = await P.eval(`(FTH_SKINS.get('${id}').bonus || {}).flow === 'fade'`), lv0 = await P.eval('__game.level && __game.level.id');
      if (id !== 'islands') { await P.eval('__game.win()'); }
      await nap(P, id === 'dots' ? 7000 : id === 'islands' ? 2500 : 800);
      const W = await P.eval(`(() => { const s = JSON.parse(localStorage.getItem('${SAVE}')); return { w: s.wallet, bal: FTH_SKINS.list.map(k => [k.id, FTH_WALLET.bal(k.id)]), rate: __game.rate, score: __game.score, shown: document.getElementById('winScore').textContent, counter: document.getElementById('score').textContent, label: document.getElementById('coinBox').getAttribute('aria-label') }; })()`);
      const mine = W.w[id] || { bal: 0 }, others = Object.keys(W.w).filter(k => k !== id && W.w[k].bal > 0);
      ok(mine.bal > 0 && others.length === 0, id + ': won, wallet credited only to ' + id + ' (' + mine.bal + ' coins' + (others.length ? ', also ' + others : '') + ', score ' + W.score + ' points at ' + W.rate.toFixed(3) + ' a point)');
      if (fade) ok(await P.eval(`!document.getElementById('win').classList.contains('on') && __game.level && __game.level.id !== '${lv0}'`), id + ': fade flow: no win card, the next level is already playing');
      else ok(Math.abs(mine.bal + mine.f - W.score * W.rate) < 1.01 || W.score * W.rate > mine.bal, id + ': coins match points x rate (' + (W.score * W.rate).toFixed(1) + ')');
      ok(mine.earned === mine.bal, id + ': earned = balance before any exchange');
      ok(/\d+ /.test(W.label || ''), id + ': counter label "' + W.label + '"');
      if (id === 'dots' && !fade) ok(+W.shown === Math.floor(W.score * W.rate + 1e-9), id + ': the win card total ' + W.shown + ' is the whole score in ink beads');
      if (SH) { await P.shot(path.join(SH, 'win-' + id + '.png')); }
      // the bonus round: coins hidden, art from the same source
      if (id === 'dots' || id === 'ions') {
        await P.eval("__game.bonus('chain', 0)"); await sleep(300);
        const b = await P.eval(`(() => { const c = [...document.querySelectorAll('#bonusSvg .bcoin')]; return { n: c.length, uses: c.every(x => x.querySelector('use[href="#coinG"]')), hidden: c.every(x => getComputedStyle(x).opacity === '0'), tileCoins: document.querySelectorAll('#bonusSvg .tl use[href="#coinG"], #bonusSvg .tl .coin').length }; })()`);
        ok(b.n === 20 && b.uses && b.hidden && b.tileCoins === 0, id + ': chain bonus board has 20 hidden coin stacks through #coinG and no coins on tiles');
        if (SH) { await P.eval(`(() => { const g = __game.bz; })()`); }
      }
      if (SH && id !== 'islands') {                            // the counter in game (a fresh page)
        const Q = await open('all=1&view=game&lvl=' + LV + '&skin=' + id);
        await Q.eval('__game.gain(90)'); await sleep(1800); await Q.shot(path.join(SH, 'game-' + id + '.png')); await Q.S('Page.close');
      }
      await P.S('Page.close');                                   // a hidden page would pause its animation frames
    }
    // ---- migration of an old save
    const Pm = await open('all=1&view=title', { lv: 3, byId: { splash: { score: 700, stars: 3 }, 'one-of-each': { score: 450, stars: 2 } }, skin: 'dots', ach: {} });
    const mg = await Pm.eval(`JSON.parse(localStorage.getItem('${SAVE}')).wallet`);
    ok(mg && mg.islands && mg.islands.bal === 1150 && mg.islands.earned === 1150 && Object.keys(mg).length === 1, 'migration: 700 + 450 old points became 1150 doubloons in the Islands wallet (' + JSON.stringify(mg) + ')');
    await Pm.eval('location.reload()'); await sleep(900);
    ok((await Pm.eval(`JSON.parse(localStorage.getItem('${SAVE}')).wallet.islands.bal`)) === 1150, 'migration runs once: a reload keeps 1150');
    ok(!(await Pm.eval('FTH_INT.counts()["save-edited"]')), 'migration and reload raise no tamper signal');
    // ---- tamper: edit the wallet by hand, reload
    await Pm.eval(`(() => { const s = JSON.parse(localStorage.getItem('${SAVE}')); s.wallet.islands.bal = 999999; localStorage.setItem('${SAVE}', JSON.stringify(s)); })()`);
    await Pm.eval('location.reload()'); await sleep(900);
    const t = await Pm.eval('({ c: FTH_INT.counts(), m: FTH_INT.meta() })');
    ok(t.c['save-edited'] === 1 && t.m.tamper === 1, 'tamper: a hand-edited wallet is logged as save-edited and counted (' + JSON.stringify(t.c) + ', tamper ' + t.m.tamper + ')');
    await Pm.eval('location.reload()'); await sleep(900);
    ok((await Pm.eval('FTH_INT.counts()["save-edited"]')) === 1, 'after re-seal a clean reload adds no new signal');
    // ---- exchange: multi-hop conversion, balances update
    const Pe = await open('all=1&view=game&lvl=' + LV + '&skin=islands', { lv: 3, byId: {}, skin: 'islands', ach: {}, wallet: { dots: { bal: 5000, earned: 5000, f: 0 } } });
    await Pe.eval(`document.getElementById('btnWallet').click()`); await sleep(1200);
    ok(await Pe.eval(`!!document.querySelector('#eco.on') && document.querySelectorAll('#eco .ec-n').length === FTH_SKINS.list.length`), 'exchange opens with one node per currency');
    const sizes = await Pe.eval(`[...document.querySelectorAll('#eco .ec-n')].map(b => { const r = b.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); })`);
    ok(Math.min(...sizes) >= 40, 'every node is a tap target of at least 40px (smallest ' + Math.min(...sizes) + 'px)');
    if (SH) await Pe.shot(path.join(SH, 'exchange-open.png'));
    await Pe.eval(`document.querySelector('#eco .ec-n[data-id="islands"]').click()`);   // the current skin is preselected: clear it
    await Pe.eval(`document.querySelector('#eco .ec-n[data-id="dots"]').click()`); await sleep(200);
    ok(await Pe.eval(`document.querySelectorAll('#eco .ec-row').length === 2`), 'selecting a node lists its direct partners (Dots trades with 2)');
    if (SH) await Pe.shot(path.join(SH, 'exchange-node.png'));
    await Pe.eval(`document.querySelector('#eco .ec-n[data-id="islands-3d"]').click()`); await sleep(200);
    const route = await Pe.eval(`([...document.querySelectorAll('#eco .ec-route')].map(r => r.textContent.replace(/\\s+/g, ' ').trim())[0] || '')`);
    ok(/Ink bead.*Sugar cube.*Doubloon.*Compass rose.*Ion orb.*Crystal shard/i.test(route.replace(/→/g, ' ')), 'two nodes show the best route: ' + route);
    if (SH) await Pe.shot(path.join(SH, 'exchange-route.png'));
    await Pe.eval(`document.getElementById('ecConv').click()`); await sleep(300);
    await Pe.eval(`(() => { document.querySelector('#ecS .ec-qk button[data-f="1"]').click(); })()`); await sleep(100);
    const q = await Pe.eval(`document.getElementById('ecQ').textContent`);
    if (SH) await Pe.shot(path.join(SH, 'exchange-confirm.png'));
    await Pe.eval(`document.getElementById('ecOk').click()`); await sleep(400);
    const after = await Pe.eval(`({ dots: FTH_WALLET.bal('dots'), shard: FTH_WALLET.bal('islands-3d'), s: JSON.parse(localStorage.getItem('${SAVE}')).wallet, nodes: [...document.querySelectorAll('#eco .ec-n')].map(b => b.dataset.id + ':' + b.querySelector('.bl').textContent) })`);
    ok(after.shard >= 1 && after.dots < 5000, 'converted along the route: ' + q.replace(/\s+/g, ' ') + ' -> dots ' + after.dots + ', shards ' + after.shard);
    ok(after.s['islands-3d'].bal === after.shard && after.s.dots.earned === 5000, 'saved: shard balance matches, earned unchanged by the exchange');
    if (SH) await Pe.shot(path.join(SH, 'exchange-after.png'));
    await Pe.eval('location.reload()'); await sleep(900);
    ok(!(await Pe.eval('FTH_INT.counts()["save-edited"]')), 'an exchange goes through persist(), so the reload sees a clean seal');
    const errs = P0.logs.concat(Pe.logs, Pm.logs); ok(!errs.length, 'no script errors' + (errs.length ? ': ' + errs[0] : ''));
  } finally { B.close(); srv.close(); }
  console.log(bad ? bad + ' problem(s)' : 'coins OK'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
