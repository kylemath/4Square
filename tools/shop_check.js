// End-to-end check of skin tickets and the coin podium in the real shell (headless Chrome, no npm packages):
//   node docs/game/tools/shop_check.js [--shots dir]
//   - a fresh player owns Islands only: one open chip, every other skin locked; a locked chip opens the shop on that skin;
//   - the currency exchange is benched: no wallet button (it comes back with ?feat=exchange);
//   - winning the first level (Islands, at par) pays enough for ticket 1: the win card says so, the shop sells it,
//     the ticket unlocks Dots, the picker opens it, a reload keeps it with a clean seal;
//   - a hand-edited list of owned skins is flagged by the integrity seal;
//   - the leaderboard is one list of every skin with its top 3 by coins earned there; after joining you are 1st in Islands.
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2), si = args.indexOf('--shots'), SH = si >= 0 ? args[si + 1] : null;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)) : '')); if (!c) bad++; };
const nap = async (P, ms) => { for (let t = 0; t < ms; t += 300) { await sleep(300); await P.eval('1'); } };
const until = async (P, expr, ms) => { for (let t = 0; t < (ms || 15000); t += 200) { if (await P.eval(expr)) return true; await sleep(200); } return false; };
const SAVE = 'fill-the-hole-v2';
(async () => {
  if (SH) fs.mkdirSync(SH, { recursive: true });
  const srv = await serve(ROOT), B = await launch();
  const P = await B.page(390, 844, 1);
  await P.addScript(`try { if (!sessionStorage.getItem('fresh')) { sessionStorage.setItem('fresh', '1'); localStorage.clear(); } } catch (e) {} window.__errs = []; addEventListener('error', e => __errs.push(e.message));`);
  const go = async q => { await P.goto(srv.url + 'index.html' + q); await sleep(700); };
  const shot = async n => { if (SH) { await sleep(250); await P.shot(path.join(SH, n + '.png')); } };
  try {
    await go('');
    const pick = await P.eval(`({ open: [...document.querySelectorAll('#skinPick button:not(.lock)')].map(b => b.dataset.s), locked: document.querySelectorAll('#skinPick button.lock').length,
      n: FTH_SKINS.list.length, wallet: !!document.getElementById('btnWalletTitle'), hudWallet: getComputedStyle(document.getElementById('btnWallet')).display })`);
    ok('a new player owns Islands only', pick.open.join() === 'islands' && pick.locked === pick.n - 1, pick);
    ok('the exchange is benched: no wallet buttons', !pick.wallet && pick.hudWallet === 'none');
    await shot('title-locked');
    await P.eval(`document.querySelector('#skinPick button[data-s="dots"]').click()`);
    const s1 = await P.eval(`({ on: document.getElementById('shop').classList.contains('on'), focus: (document.querySelector('#shop .sh-skin.focus .nm') || {}).textContent, unlock: [...document.querySelectorAll('#shop [data-use]')].every(b => b.disabled), gate: /Beat 1 level/.test(document.getElementById('shop').textContent) })`);
    ok('a locked chip opens the shop on that skin; nothing to unlock yet', s1.on && /Dots/.test(s1.focus) && s1.unlock && s1.gate, s1);
    await shot('shop-start');

    // win the first level at par on Islands
    await go('?view=game&lvl=splash');
    const w = await P.eval(`(async () => { const g = __game; let n = 0; while (!g.won && n++ < 40) { const K = g.good()[0]; if (!K) break; g.capture(K); g.flip(K); const t0 = performance.now(); while (g.busy && performance.now() - t0 < 8000) await new Promise(r => setTimeout(r, 50)); await new Promise(r => setTimeout(r, 40)); } return g.won; })()`);
    ok('splash won', w);
    ok('win card shows', await until(P, `document.getElementById('win').classList.contains('on')`));
    await nap(P, 2500); await P.eval(`(document.getElementById('bonusSkip') || {}).click && document.getElementById('bonusSkip').click()`);
    ok('after the bonus round, the win card says a ticket is ready', await until(P, `!document.getElementById('winTicket').hidden`, 8000));
    const bal = await P.eval(`JSON.parse(localStorage.getItem('${SAVE}')).wallet.islands.bal`);
    await shot('win-ticket');
    await P.eval(`document.getElementById('winTicket').click()`);
    const buy = await P.eval(`(() => { const b = document.querySelector('#shop [data-buy="islands"]'); return { there: !!b, dis: b && b.disabled, text: document.querySelector('#shop').textContent.match(/(\\d[\\d,]*) \\/ (\\d[\\d,]*) doubloons/) }; })()`);
    ok('ticket 1 is for sale for doubloons', buy.there && !buy.dis, { bal, m: buy.text && buy.text[0] });
    await P.eval(`document.querySelector('#shop [data-buy="islands"]').click()`);
    ok('buying asks to confirm first', await P.eval(`/Sure\\?/.test(document.querySelector('#shop [data-buy="islands"]').textContent)`));
    await P.eval(`document.querySelector('#shop [data-buy="islands"]').click()`);
    const after = await P.eval(`(() => { const s = JSON.parse(localStorage.getItem('${SAVE}')); return { bal: s.wallet.islands.bal, earned: s.wallet.islands.earned, skins: s.skins }; })()`);
    ok('the ticket is paid from the Islands wallet', after.skins.tickets === 1 && after.skins.bought === 1 && after.bal === bal - 225 && after.earned >= bal, after);
    await shot('shop-ticket');
    await P.eval(`document.querySelector('#shop [data-use="dots"]').click()`); await P.eval(`document.querySelector('#shop [data-use="dots"]').click()`);
    const un = await P.eval(`(() => { const s = JSON.parse(localStorage.getItem('${SAVE}')); return { own: s.skins.own, t: s.skins.tickets, play: !!document.querySelector('#shop [data-play="dots"]') }; })()`);
    ok('the ticket unlocks Dots', un.own.includes('dots') && un.t === 0 && un.play, un);
    await shot('shop-unlocked');
    await P.eval(`document.querySelector('#shop [data-play="dots"]').click()`);
    await go('');
    const p2 = await P.eval(`({ open: [...document.querySelectorAll('#skinPick button:not(.lock)')].map(b => b.dataset.s), sel: (document.querySelector('#skinPick [aria-checked="true"]') || {}).dataset, skin: document.body.dataset.skin })`);
    ok('after a reload Dots is open and selected', p2.open.join() === 'islands,dots' && p2.skin === 'dots', p2);
    const int1 = await P.eval(`(window.FTH_INT && FTH_INT.meta().tamper) || 0`);
    ok('a legitimate purchase leaves the seal clean', int1 === 0, int1);

    // the leaderboard: join (local mode), then the podium
    await P.eval(`document.getElementById('btnLbTitle').click()`);
    ok('leaderboard opens with the join banner on top', await until(P, `document.querySelector('#lb.on #lbJoin .lb-join')`, 10000));
    await P.eval(`document.getElementById('lbNick').value = 'Test Otter'; document.getElementById('lbJoinBtn').click()`);
    ok('joined: banner gone, a skin icon per skin, your row on the Islands standings', await until(P, `(document.querySelector('#lb .lb-sk[data-s="islands"]') || { click() {} }).click(), !document.querySelector('#lbJoin .lb-join') && document.querySelectorAll('#lb .lb-sk').length === FTH_SKINS.list.length && document.querySelector('#lb .lb-bh .nm').textContent === 'Islands' && /Test Otter/.test((document.querySelector('#lb .lb-r.me') || {}).textContent || '')`, 15000));
    const pod = await P.eval(`(() => { const first = document.querySelector('#lb .lb-rows .lb-r'); return { first: first.textContent, me: first.classList.contains('me'), gold: !!first.querySelector('.lb-pos.p1'), n: FTH_SKINS.list.length, locked: document.querySelectorAll('#lb .lb-sk.lock').length }; })()`);
    ok('you are 1st in Islands with your coins earned there', pod.me && pod.gold && /Test Otter/.test(pod.first), pod.first);
    await P.eval(`document.querySelector('#lb .lb-sk[data-s="dots"]').click()`);
    pod.dots = await P.eval(`({ ghosts: document.querySelectorAll('#lb .lb-r.ghost').length, rows: document.querySelectorAll('#lb .lb-r:not(.ghost)').length, podium: !!document.querySelector('#lb .lb-pod') })`);
    ok('locked skins are tagged, unplayed skins show the empty podium', pod.locked === pod.n - 2 && pod.dots.ghosts === 3 && !pod.dots.rows && pod.dots.podium, pod);
    await shot('podium');
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
