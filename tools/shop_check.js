// End-to-end check of the skin reel, the shop, the ticket deli and the coin podium in the real shell (headless Chrome, no npm packages):
//   node docs/game/tools/shop_check.js [--shots dir]
//   - a fresh player owns Islands only: one card in colour on the title reel, every other card locked; a locked card opens
//     the shop on that skin, where the deli shows the level gate as a padlock;
//   - the reel swipes (drag with momentum, keys), and coming to rest on an owned card selects that skin;
//   - the currency exchange is benched: no wallet button (it comes back with ?feat=exchange);
//   - winning the first level (Islands, at par) pays enough for ticket 1: the ticket tray drops down over the win card with the
//     wallet against the price, its ticket opens the deli, which sells it for doubloons (sign -> zoom -> PURCHASE), then the
//     shop opens and the ticket unlocks Dots there, ▶ plays it, a reload keeps it with a clean seal;
//   - the shop's live preview plays itself (&demo=1) and never reports to the shell;
//   - a hand-edited list of owned skins is flagged by the integrity seal;
//   - the leaderboard is one overall table (level reached, levels summed over skins, favourite skin); after joining you are 1st.
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2), si = args.indexOf('--shots'), SH = si >= 0 ? args[si + 1] : null;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)) : '')); if (!c) bad++; };
const nap = async (P, ms) => { for (let t = 0; t < ms; t += 300) { await sleep(300); await P.eval('1'); } };
const until = async (P, expr, ms) => { for (let t = 0; t < (ms || 15000); t += 200) { if (await P.eval(expr)) return true; await sleep(200); } return false; };
const SAVE = 'fill-the-hole-v2';
// the reel under a selector: which card is centred, which are owned
const reel = sel => `(() => { const r = document.querySelector('${sel} .rl'); if (!r) return null; const c = [...r.querySelectorAll('.rl-card')];
  return { n: c.length, own: c.filter(x => x.classList.contains('own')).map(x => x.dataset.s), lock: c.filter(x => x.classList.contains('lock')).length,
    at: (c.find(x => x.getAttribute('aria-selected') === 'true') || {}).dataset?.s, role: r.getAttribute('role'), act: r.getAttribute('aria-activedescendant') }; })()`;
// the deli's signs: each currency's place, shape and state
const signsAt = `[...document.querySelectorAll('#deli .dl-sign')].map(d => { const b = d.querySelector('.dl-face'); return { w: b.dataset.w, at: d.style.left + ' ' + d.style.getPropertyValue('--hang'),
  shape: b.querySelector('.dl-shape path:nth-child(3)').getAttribute('d') + b.querySelector('.dl-shape path:nth-child(3)').getAttribute('fill'), cls: d.className, sold: !!b.querySelector('.dl-sold') }; })`;
const same = (a, b) => a.length === b.length && a.every((x, i) => x.w === b[i].w && x.at === b[i].at && x.shape === b[i].shape);
const key = (sel, k) => `document.querySelector('${sel} .rl').dispatchEvent(new KeyboardEvent('keydown', { key: '${k}', bubbles: true }))`;
(async () => {
  if (SH) fs.mkdirSync(SH, { recursive: true });
  const srv = await serve(ROOT), B = await launch();
  const P = await B.page(390, 844, 1);
  await P.addScript(`try { if (!sessionStorage.getItem('fresh')) { sessionStorage.setItem('fresh', '1'); localStorage.clear(); } } catch (e) {} window.__errs = []; addEventListener('error', e => __errs.push(e.message));
    window.__fromShop = 0; addEventListener('message', e => { const f = document.querySelector('#shop .sh-live'); if (e.data && e.data.fth && f && e.source === f.contentWindow) __fromShop++; });`);
  const go = async q => { await P.goto(srv.url + 'index.html' + q); await sleep(700); };
  const shot = async n => { if (SH) { await sleep(250); await P.shot(path.join(SH, n + '.png')); } };
  const toCard = async (sel, id) => { for (let i = 0; i < 20; i++) { const r = await P.eval(reel(sel)); if (r.at === id) break; await P.eval(key(sel, 'ArrowRight')); await sleep(80); } await sleep(1300); };
  try {
    await go('');
    const t0 = await P.eval(reel('#skinPick')), n = await P.eval('FTH_SKINS.list.length');
    const wal = await P.eval(`({ wallet: !!document.getElementById('btnWalletTitle'), hudWallet: getComputedStyle(document.getElementById('btnWallet')).display })`);
    ok('the title reel is a listbox of every skin', t0 && t0.n === n && t0.role === 'listbox' && /dots|islands/.test(t0.act || ''), t0);
    ok('a new player owns Islands only', t0.own.join() === 'islands' && t0.lock === n - 1, t0.own);
    ok('the exchange is benched: no wallet buttons', !wal.wallet && wal.hudWallet === 'none');
    await shot('title-reel');
    // drag the reel: momentum carries it a few cards, it comes to rest on a card; a locked card leaves the skin alone
    const box = await P.eval(`(() => { const r = document.querySelector('#skinPick .rl').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * .4]; })()`);
    await P.S('Input.dispatchMouseEvent', { type: 'mousePressed', x: box[0], y: box[1], button: 'left', buttons: 1, clickCount: 1 });
    for (let i = 1; i <= 6; i++) { await P.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box[0] - i * 30, y: box[1], button: 'left', buttons: 1 }); await sleep(16); }
    await P.S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box[0] - 180, y: box[1], button: 'left', buttons: 0, clickCount: 1 });
    await sleep(1400);
    const t1 = await P.eval(reel('#skinPick')), sk1 = await P.eval('document.body.dataset.skin');
    ok('a flick moves the reel on and it settles on a card', t1.at && t1.at !== 'islands', t1.at);
    ok('resting on a locked card keeps the skin', sk1 === 'islands', sk1);
    await P.eval(key('#skinPick', 'Home')); await sleep(800);
    ok('Home brings Islands back to the centre', (await P.eval(reel('#skinPick'))).at === 'islands');
    // a locked card: tap (Enter) opens the shop there; no ticket yet, so the preview offers the deli, which is padlocked
    await toCard('#skinPick', 'dots');
    await P.eval(key('#skinPick', 'Enter')); await sleep(900);
    const s1 = await P.eval(`({ on: document.getElementById('shop').classList.contains('on'), lock: !!document.querySelector('#shop .sh-pv.lock'), deli: !!document.querySelector('#shop .sh-big.deli'), use: !!document.querySelector('#shop .sh-big.use') })`);
    const r1 = await P.eval(reel('#shop'));
    ok('a locked card opens the shop on that skin, with the deli on offer', s1.on && r1.at === 'dots' && s1.lock && s1.deli && !s1.use, Object.assign(s1, { at: r1.at }));
    await shot('shop-locked');
    const words = await P.eval(`(() => { const c = document.getElementById('shop').cloneNode(true); c.querySelectorAll('.rl-art, .sh-art, iframe').forEach(x => x.remove()); document.body.appendChild(c); const t = c.innerText; c.remove(); return t.replace(/\\s+/g, ' ').trim(); })()`);
    ok('the shop has no sentences', !/[a-z]{3,} [a-z]{3,} [a-z]{3,}/i.test(words), words.slice(0, 80));
    await P.eval(`document.querySelector('#shop .sh-big.deli').click()`); await sleep(900);
    const lamps = `(() => { const b = [...document.querySelectorAll('#deli .dl-b:not(.all)')]; return { n: b.length, on: b.filter(x => x.classList.contains('on')).length, nx: (b.find(x => x.classList.contains('nx')) || {}).textContent, gates: b.map(x => +x.textContent).join(), all: (document.querySelector('#deli .dl-b.all') || {}).textContent }; })()`;
    const d1 = await P.eval(`({ on: document.getElementById('deli').classList.contains('on'), signs: document.querySelectorAll('#deli .dl-sign').length, ok: document.querySelectorAll('#deli .dl-sign.ok').length, lamps: ${lamps} })`);
    ok('the deli hangs a price sign per currency, nothing for sale at 0 levels', d1.on && d1.signs === n && d1.ok === 0, d1);
    ok('a bulb per ticket labelled with its level gate, none lit, the first one next', d1.lamps.gates === (await P.eval('FTH_TICKETS.GATE.join()')) && d1.lamps.on === 0 && d1.lamps.nx === '1', d1.lamps);
    ok('a last bulb counts every level in the game', d1.lamps.all === String(await P.eval('GAME.levels.length')), d1.lamps.all);
    const L0 = await P.eval(signsAt);
    ok('only the Islands sign is in colour; every skin without a ticket hangs grey', L0.filter(x => /grey/.test(x.cls)).length === n - 1 && !/grey/.test(L0.find(x => x.w === 'islands').cls), L0.filter(x => !/grey/.test(x.cls)).map(x => x.w));
    await shot('deli-locked');
    await P.eval(`document.querySelector('#deli .dl-x').click()`); await sleep(300);
    await P.eval(`document.querySelector('#shop .sh-x').click()`); await sleep(300);

    // win the first level at par on Islands
    await go('?view=game&lvl=splash');
    const w = await P.eval(`(async () => { const g = __game; let n = 0; while (!g.won && n++ < 40) { const K = g.good()[0]; if (!K) break; g.capture(K); g.flip(K); const t0 = performance.now(); while (g.busy && performance.now() - t0 < 8000) await new Promise(r => setTimeout(r, 50)); await new Promise(r => setTimeout(r, 40)); } return g.won; })()`);
    ok('splash won', w);
    ok('win card shows', await until(P, `document.getElementById('win').classList.contains('on')`));
    await nap(P, 2500); await P.eval(`(document.getElementById('bonusSkip') || {}).click && document.getElementById('bonusSkip').click()`);
    ok('after the bonus round, the ticket tray drops down', await until(P, `document.getElementById('tkTray').classList.contains('on')`, 8000));
    const bal = await P.eval(`JSON.parse(localStorage.getItem('${SAVE}')).wallet.islands.bal`);
    const tray = await P.eval(`(() => { const w = document.querySelector('#tkTray .tt-w'); return { n: document.querySelector('#tkTray .tt-n').textContent, ok: !!w && w.classList.contains('ok'), bal: w && w.querySelector('b').textContent, price: w && w.querySelector('.tt-p').textContent }; })()`);
    ok('the tray shows the wallet against the price, the ticket badged 1', tray.n === '1' && tray.ok && +tray.bal === bal && tray.price === '225', Object.assign(tray, { bal0: bal }));
    await shot('win-ticket');
    await P.eval(`document.getElementById('tkTrayGo').click()`); await sleep(900);
    ok('the tray\'s ticket opens the deli, not the shop', await P.eval(`document.getElementById('deli').classList.contains('on') && !(document.getElementById('shop') || { classList: { contains: () => false } }).classList.contains('on')`));
    const sign = await P.eval(`(() => { const b = document.querySelector('#deli .dl-sign.ok .dl-face[data-w="islands"]'); return b && b.getAttribute('aria-label'); })()`);
    ok('the deli sells ticket 1 for 225 doubloons', /^225 doubloons/.test(sign || ''), { bal, sign });
    await shot('deli');
    await P.eval(`document.querySelector('#deli .dl-face[data-w="islands"]').click()`); await sleep(500);
    const z = await P.eval(`(() => { const b = document.querySelector('#deli .dl-zoom .dl-buy'); return b && { dis: b.disabled, label: b.getAttribute('aria-label') }; })()`);
    ok('a sign zooms forward with a PURCHASE button', z && !z.dis && /225/.test(z.label), z);
    await shot('deli-zoom');
    await P.eval(`document.querySelector('#deli .dl-buy').click()`);
    await sleep(1000); await shot('deli-purchase');
    const after = await P.eval(`(() => { const s = JSON.parse(localStorage.getItem('${SAVE}')); return { bal: s.wallet.islands.bal, earned: s.wallet.islands.earned, skins: s.skins }; })()`);
    ok('the ticket is paid from the Islands wallet', after.skins.tickets === 1 && after.skins.bought === 1 && after.bal === bal - 225 && after.earned >= bal, after);
    ok('the deli closes after its animation, into the shop', await until(P, `!document.getElementById('deli').classList.contains('on') && document.getElementById('shop').classList.contains('on')`, 8000));
    ok('the shop counts the ticket', await P.eval(`/×1/.test(document.querySelector('#shop .sh-tks').textContent)`));
    // back at the deli with the ticket unspent: every sign hangs where it did, Islands' sold out, none for sale
    await P.eval(`document.querySelector('#shop .sh-deli').click()`); await sleep(700);
    const L1 = await P.eval(signsAt), m1 = await P.eval(lamps);
    ok('one level beaten: the first bulb is lit, ticket 2\'s bulb (3 levels) is next', m1.on === 1 && m1.nx === '3', m1);
    ok('after a purchase every sign keeps its place, shape and currency', same(L0, L1), L1.map(x => x.w).join());
    ok('the currency that bought a ticket is SOLD OUT, nothing else is for sale', L1.filter(x => x.sold).map(x => x.w).join() === 'islands' && !L1.some(x => /\bok\b/.test(x.cls)), L1.filter(x => x.sold).map(x => x.w));
    await shot('deli-sold');
    await P.eval(`document.querySelector('#deli .dl-x').click()`); await sleep(300);
    await toCard('#shop', 'dots');
    ok('a locked skin now offers [🎟️ × 1]', await P.eval(`!!document.querySelector('#shop .sh-pv.lock .sh-big.use')`));
    // the live preview of Dots plays itself and never talks to the shell
    ok('the preview frame runs the page in demo mode', await until(P, `(() => { const f = document.querySelector('#shop .sh-live'); return f && /demo=1/.test(f.src) && f.classList.contains('on'); })()`, 8000));
    await sleep(2600);
    const demo = await P.eval(`(() => { const W = document.querySelector('#shop .sh-live').contentWindow; return { demo: W.LAB.demo, moves: W.LAB.last().moves + W.LAB.last().history.length, from: __fromShop }; })()`);
    ok('demo swaps happen, no message reaches the shell', demo.demo && demo.moves > 0 && demo.from === 0, demo);
    await shot('shop-ticket');
    await P.eval(`document.querySelector('#shop .sh-big.use').click()`); await sleep(400); await shot('shop-unlocking');
    const un = await P.eval(`(() => { const s = JSON.parse(localStorage.getItem('${SAVE}')); return { own: s.skins.own, t: s.skins.tickets }; })()`);
    ok('the ticket unlocks Dots', un.own.includes('dots') && un.t === 0, un);
    ok('Dots turns to colour on the reel and ▶ shows', await until(P, `!!document.querySelector('#shop .sh-pv.own') && document.querySelector('#shop .rl-card[data-s="dots"]').classList.contains('own') && document.body.dataset.skin === 'dots'`, 4000));
    await sleep(1500); await shot('shop-owned');
    await P.eval(`document.querySelector('#shop .sh-deli').click()`); await sleep(700);
    const L2 = await P.eval(signsAt), dots = L2.find(x => x.w === 'dots') || {};
    ok('with Dots unlocked its sign is in colour, in the same place', same(L0, L2) && !/grey/.test(dots.cls) && L2.find(x => x.w === 'islands').sold, dots);
    await shot('deli-dots');
    await P.eval(`document.querySelector('#deli .dl-x').click()`); await sleep(300);
    await P.eval(`document.querySelector('#shop .sh-play').click()`); await sleep(600);
    ok('▶ closes the shop and plays', await P.eval(`!document.getElementById('shop').classList.contains('on') && (!!document.querySelector('.howto.on') || document.getElementById('menu').classList.contains('on'))`));
    await go('');
    const p2 = await P.eval(reel('#skinPick')), sk2 = await P.eval('document.body.dataset.skin');
    ok('after a reload Dots is owned, selected and centred', p2.own.join() === 'islands,dots' && sk2 === 'dots' && p2.at === 'dots', Object.assign(p2, { sk2 }));
    await P.eval(key('#skinPick', 'Home')); await sleep(900);
    ok('resting on an owned card selects it', await P.eval(`document.body.dataset.skin === 'islands' && JSON.parse(localStorage.getItem('${SAVE}')).skin === 'islands'`));
    const int1 = await P.eval(`(window.FTH_INT && FTH_INT.meta().tamper) || 0`);
    ok('a legitimate purchase leaves the seal clean', int1 === 0, int1);

    // the leaderboard: join (local mode), then the podium
    await P.eval(`document.getElementById('btnLbTitle').click()`);
    ok('leaderboard opens with the join banner on top', await until(P, `document.querySelector('#lb.on #lbJoin .lb-join')`, 10000));
    await P.eval(`document.getElementById('lbNick').value = 'Test Otter'; document.getElementById('lbJoinBtn').click()`);
    ok('joined: banner gone, one overall table with your row on it', await until(P, `!document.querySelector('#lbJoin .lb-join') && !document.querySelector('#lb .lb-sk') && document.querySelector('#lb .lb-bh .nm').textContent === 'Overall' && /Test Otter/.test((document.querySelector('#lb .lb-r.me') || {}).textContent || '')`, 15000));
    const pod = await P.eval(`(() => { const first = document.querySelector('#lb .lb-rows .lb-r'), L = GAME.levels; return { first: first.textContent, me: first.classList.contains('me'), gold: !!first.querySelector('.lb-pos.p1'),
      lv: first.querySelector('.lb-lv').textContent, want: String(L[1].num), sum: first.querySelector('.lb-sum').textContent, fav: (first.querySelector('.lb-fav').title || ''), cols: [...document.querySelectorAll('#lb .lb-cols span')].map(x => x.textContent).filter(Boolean) }; })()`);
    ok('you are 1st overall: on level 2, 1 level over all skins, Islands your favourite', pod.me && pod.gold && /Test Otter/.test(pod.first) && pod.lv === pod.want && pod.sum === '1' && /^Islands: 1 level$/.test(pod.fav) && pod.cols.join() === 'Level,Skins,Fav', pod);
    await shot('standings');
    await P.eval(`document.querySelector('#lb .lb-x').click()`);

    // tamper: hand-unlock a skin in localStorage
    await P.eval(`(() => { const s = JSON.parse(localStorage.getItem('${SAVE}')); s.skins.own.push('ions'); localStorage.setItem('${SAVE}', JSON.stringify(s)); })()`);
    await go('');
    const int2 = await P.eval(`({ t: (FTH_INT.meta().tamper) || 0, c: FTH_INT.counts() })`);
    ok('a hand-unlocked skin is flagged as an edited save', int2.t >= 1 && (int2.c['save-edited'] || 0) >= 1, int2);
    // ?feat=exchange brings the wallet back
    await go('?feat=exchange&view=game&lvl=splash&skin=islands');   // Islands: its full HUD has room for the wallet
    ok('?feat=exchange shows the wallet button again', await P.eval(`getComputedStyle(document.getElementById('btnWallet')).display !== 'none'`));
    const errs = await P.eval('__errs');
    ok('no script errors', !errs.length, errs);
  } catch (e) { bad++; console.log('  FAIL ' + (e && e.message)); }
  B.close(); srv.close();
  console.log(bad ? bad + ' problem(s)' : 'shop OK');
  process.exit(bad ? 1 : 0);
})();
