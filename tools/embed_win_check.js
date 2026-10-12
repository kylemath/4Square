// After a win, an embedded play page never restarts itself and shows no dev text (SKIN-SPEC section 9).
//   node docs/game/tools/embed_win_check.js [page ...] [--lvl id,id]      (headless Chrome; no npm packages)
// For each play page x sample level (the smallest pond, a mid map, two r178 levels) it loads lab/<page>.html in a frame
// with ?embed=1 (tools/embed_harness.html plays the shell), wins through the page's own game object, then asserts:
//   (a) no dev-remnant text (DOM text or canvas fillText drawn after the win) matches the deny-list,
//   (b) taps/clicks on the frame (grid + every button, right after the win and after `done`) change nothing:
//       same colouring, same move count, no swap/undo/reset/ready message, page not reloaded,
//   (c) the page posted `done` exactly once.
const path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = process.env.GAME_ROOT || path.join(__dirname, '..');
const DENY = /\btap (for|to)\b|\bclick (for|to)\b|\bclick\b|play again|plan another|fresh (blank )?sheet|new sheet|blank sheet|replay|try again|restart|\bTODO\b|debug|\blab\b|console|\bundefined\b|\bNaN\b/i;
const PAGES = { doodle: 'full', blank: 'full', dots: 'minimal', map: 'full', swipe: 'compact', ions: 'full', tables: 'full' };
const LEVELS = ['splash', 'kempes-double', 'far-away', 'deepest-pit'];
const args = process.argv.slice(2), li = args.indexOf('--lvl');
const levels = li >= 0 ? args.splice(li, 2)[1].split(',') : LEVELS;
const pages = args.length ? args : Object.keys(PAGES);
const HOOK = `(function () { const rec = (t) => { try { (window.__ct = window.__ct || []).push({ t: performance.now(), s: String(t) }); } catch (e) {} };
  for (const m of ['fillText', 'strokeText']) { const o = CanvasRenderingContext2D.prototype[m]; CanvasRenderingContext2D.prototype[m] = function (t) { rec(t); return o.apply(this, arguments); }; } })();`;
const FRAME = 'document.getElementById("f").contentWindow';

async function one(B, base, page, lvl) {
  const P = await B.page(390, 844, 2); await P.addScript(HOOK);
  const fails = [], fail = m => fails.push(m);
  await P.goto(base + 'tools/embed_harness.html?page=' + page + '&lvl=' + lvl + '&hud=' + PAGES[page]);
  const ready = async () => { for (let i = 0; i < 100; i++) { if (await P.eval('__msgs.some(m => m.type === "ready" || m.type === "error")')) break; await sleep(100); } };
  await ready(); await sleep(700);
  const types = await P.eval('__msgs.map(m => m.type)');
  if (!types.includes('ready') || types.includes('error')) { fail('page did not report ready (' + types.join(',') + ')'); P.S('Target.closeTarget', {}).catch(() => 0); return fails; }
  const g = FRAME + '.LAB.last()';
  // win through the page's own game object (and its own win hook / input where the page needs a step after the last swap)
  await P.eval(`(() => { const g = ${g}; let n = 0; while (!g.won() && n++ < 40) { const K = g.good()[0]; if (!K) throw new Error('no good chain'); g.swap(K); } return g.won(); })()`);
  const t0 = await P.eval('performance.now()');
  if (page === 'map') await P.eval(FRAME + '.MAPLAB.celebrate()');
  if (page === 'swipe') await P.eval(FRAME + '.SWIPE.jackpot()');
  if (page === 'ions' || page === 'tables') await P.eval(FRAME + '.PLAYLAB.win()');
  if (page === 'doodle') { const [x, y] = await P.eval(`(() => { const g = ${g}, W = ${FRAME}; W.PLAYLAB.pen(g.free()); return W.PLAYLAB.cen(g.hole); })()`); await sleep(400); await P.click(x, y); }
  if (page === 'blank') {
    const cols = await P.eval(`(() => { const g = ${g}, c = g.col.slice(); c[g.hole] = g.free(); return c; })()`);
    await sleep(500);
    for (let i = 0; i < cols.length; i++) { const [x, y] = await P.eval(`(${FRAME}.PLAYLAB.pen(${cols[i]}), ${FRAME}.PLAYLAB.cen(${i}))`); await P.click(x, y); await sleep(30); }
  }
  const snap = () => P.eval(`(() => { const g = ${g}, W = ${FRAME}; return { col: g.col.join(), moves: g.moves, won: g.won(), pw: W.PLAYLAB ? W.PLAYLAB.won : null, src: document.getElementById("f").src, n: __msgs.length }; })()`);
  const buttons = () => P.eval(`[...${FRAME}.document.querySelectorAll("button, .btn, [role=button]")].filter(b => b.offsetParent || b.getClientRects().length).map(b => { const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })`);
  const grid = []; for (let y = 40; y < 844; y += 90) for (let x = 30; x < 390; x += 80) grid.push([x, y]);
  const tapAll = async () => { for (const [x, y] of grid.concat(await buttons())) { await P.click(x, y); await sleep(20); } };
  const doneN = () => P.eval('__msgs.filter(m => m.type === "done").length');
  // wait for the celebration to end (`done`), tapping during it as well
  await sleep(250); const before = await snap(); await tapAll();
  for (let i = 0; i < 100 && (await doneN()) < 1; i++) await sleep(100);
  if ((await doneN()) < 1) fail('`done` never posted');
  await sleep(500); await tapAll(); await sleep(3600);
  const after = await snap();
  if (!after.won) fail('game left the won state');
  if (after.col !== before.col) fail('colouring changed after the win taps');
  if (after.moves !== before.moves) fail('move count changed (' + before.moves + ' -> ' + after.moves + ')');
  if (after.pw === false) fail('page state left "won"');
  if (after.src !== before.src) fail('frame was reloaded');
  const late = await P.eval(`__msgs.filter(m => m.t > ${t0} && ["swap", "undo", "reset", "ready"].includes(m.type)).map(m => m.type)`);
  if (late.length) fail('messages after the win: ' + late.join(','));
  const nd = await doneN(); if (nd !== 1) fail('`done` posted ' + nd + ' times (want exactly 1)');
  // dev-remnant text: DOM text that is visible, and canvas text drawn after the win
  const dom = await P.eval(`(() => { const out = [], d = ${FRAME}.document, W = ${FRAME};
    const vis = e => { for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const s = W.getComputedStyle(n); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.05) return false; } return true; };
    const w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) { const t = n.nodeValue.trim(); if (t && n.parentElement && !/^(SCRIPT|STYLE|TITLE)$/i.test(n.parentElement.tagName) && vis(n.parentElement) && n.parentElement.getClientRects().length) out.push(t); }
    return out; })()`);
  const canvas = await P.eval(`(${FRAME}.__ct || []).filter(c => c.t > ${t0 - 2000}).map(c => c.s)`);
  for (const t of dom.concat(canvas)) if (DENY.test(t)) fail('dev text visible: "' + t.slice(0, 60) + '"');
  if (P.logs.length) fail('script error: ' + P.logs[0].split('\n')[0]);
  return fails;
}

(async () => {
  const srv = await serve(ROOT), B = await launch(); let bad = 0, total = 0;
  try {
    for (const page of pages) for (const lvl of levels) {
      let f; try { f = await one(B, srv.url, page, lvl); } catch (e) { f = ['check crashed: ' + e.message]; }
      total++; if (f.length) bad++;
      console.log((f.length ? 'FAIL ' : 'ok   ') + page + ' x ' + lvl + (f.length ? '\n       ' + f.join('\n       ') : ''));
    }
  } finally { B.close(); srv.close(); }
  console.log(bad ? bad + ' of ' + total + ' failed' : 'all ' + total + ' embed win checks OK');
  process.exit(bad ? 1 : 0);
})();
