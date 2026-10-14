// The Star skin end to end (headless Chrome, no npm packages):   node tools/star_check.js [--shots dir]
//   - lab/star.html on kempes-double, round-and-round (a π level, double locked) and splash (a pond: no frame):
//     the child stars are exactly the moves of the state (non-web chains merged by the star they reach), each child's
//     trouble spot, locks, fill and the π tag agree with rim.js computed here from the page's own game, at every step;
//   - the first-time tutorial shows three steps and goes away for good;
//   - a level is won by TAPPING children along an optimal path (par swaps), the star breaks open, the trail holds the path;
//   - undo (the button) and backtrack (a trail star) walk back; stepping back onto a star on the path marks the cycle
//     (loop ring, visit count, the ↻ chip);
//   - the heuristic lab: a rule tested on all 40 levels logs a heuristic_test event with its full definition and scores,
//     its JSON export parses; watching Kempe-else-π on 7.1 ends stuck in its π loop with the revisits marked;
//   - in the app (index.html?skin=star) the frame plays, the shell's star rim chip is hidden, no script errors anywhere.
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2), si = args.indexOf('--shots'), SH = si >= 0 ? args[si + 1] : null;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)) : '')); if (!c) bad++; };
const until = async (P, expr, ms) => { for (let t = 0; t < (ms || 15000); t += 100) { if (await P.eval(expr)) return true; await sleep(100); } return false; };
// rim.js's answer for every move of the page's game, grouped by the star it reaches (computed in the page, from g alone)
const TRUTH = `(() => { const g = STAR.g, G = FTH_RIM.graph(GAME.graphs[g.level.g]), R0 = FTH_RIM.analyse(G, g.col), piKey = R0.pi ? FTH_RIM.canon(G, R0.pi.col) : null, out = {};
  if (g.won()) return { won: true, kids: {} };
  for (const K of g.chains) { if (K.web) continue; const c = g.col.slice(); K.vs.forEach(u => { c[u] = c[u] === K.pair[0] ? K.pair[1] : K.pair[0]; }); const key = FTH_RIM.canon(G, c), R = FTH_RIM.analyse(G, c);
    out[key] = { t: R.star, lock: R.lock, filled: R.filled, pi: key === piKey }; }
  return { won: false, t: R0.star, lock: R0.lock, kids: out }; })()`;
async function agree(P, where) {
  const T = await P.eval(TRUTH), K = await P.eval('STAR.kids'), C = await P.eval('STAR.cur');
  const keys = Object.keys(T.kids).sort(), mine = K.map(k => k.key).sort();
  const same = keys.join() === mine.join() && K.every(k => { const t = T.kids[k.key]; return t && t.t === k.t && t.lock === k.lock && t.filled === k.fills && t.pi === k.pi; });
  const curOk = T.won ? C.filled : C.t === T.t && C.lock === T.lock;
  return { ok: same && curOk, n: K.length, where };
}
(async () => {
  if (SH) fs.mkdirSync(SH, { recursive: true });
  const srv = await serve(ROOT), B = await launch();
  const shot = async (P, n) => { if (SH) { await sleep(300); await P.shot(path.join(SH, n + '.png')); } };
  try {
    // ---- the tutorial (fresh storage), then play
    let P = await B.page(390, 844, 1);
    await P.goto(srv.url + 'lab/star.html?lvl=kempes-double'); await sleep(1400);
    ok('first visit: the tutorial shows', await P.eval('!document.getElementById("tut").hidden && /rim star/i.test(document.getElementById("tut").textContent)'));
    await shot(P, 'star-tutorial');
    for (let i = 0; i < 3; i++) { await P.click(195, 300); await sleep(250); }
    ok('three taps: the tutorial is gone and remembered', await P.eval('document.getElementById("tut").hidden && localStorage.getItem("fth-star-tut") === "1"'));
    await P.goto(srv.url + 'lab/star.html?lvl=kempes-double'); await sleep(1400);
    ok('second visit: no tutorial', await P.eval('document.getElementById("tut").hidden'));
    await shot(P, 'star-kempes-double');
    let a = await agree(P, 'start'); ok('kempes-double start: ' + a.n + ' children match rim.js (stars, spots, locks, fills, π)', a.ok);
    // win by tapping along an optimal path
    const par = await P.eval('STAR.g.level.par'); let steps = 0, allAgree = true;
    while (!(await P.eval('STAR.g.won()')) && steps < 10) {
      const i = await P.eval('STAR.good()'); if (i < 0) break;
      const [x, y] = await P.eval('STAR.kidXY(' + i + ')'); await P.click(x, y); steps++; await sleep(900);
      a = await agree(P, 'step ' + steps); if (!a.ok) allAgree = false;
    }
    ok('won by tapping ' + steps + ' children (par ' + par + ')', await P.eval('STAR.g.won()') && steps === par);
    ok('children match rim.js after every swap', allAgree);
    ok('the star breaks open and celebrates', await P.eval('STAR.cur.filled && STAR.celebrating && STAR.kids.length === 0'));
    ok('the trail holds the path', (await P.eval('STAR.trail.length')) === par + 1);
    await shot(P, 'star-win');
    await sleep(3600);
    ok('the celebration ends (standalone: the next-level button)', await P.eval('!STAR.celebrating && !document.getElementById("bNext").hidden'));
    // undo, backtrack and cycles on a π level
    await P.goto(srv.url + 'lab/star.html?lvl=round-and-round'); await sleep(1400);
    a = await agree(P, 'start'); ok('round-and-round start (double lock): children match rim.js', a.ok && (await P.eval('STAR.cur.lock')) === 2);
    const pi = await P.eval('(() => { const k = STAR.kids.filter(k => k.pi); return k.length === 1 && k[0].t === (STAR.cur.t + 3) % 5 && !k[0].fills; })()');
    ok('exactly one child is π: it hops the trouble spot t -> t+3 and does not fill', pi);
    await shot(P, 'star-pi-double-lock');
    const piI = await P.eval('STAR.kids.findIndex(k => k.pi)'); let [x, y] = await P.eval('STAR.kidXY(' + piI + ')'); await P.click(x, y); await sleep(900);
    ok('the π swap: run chip π×1, trail joined in gold', await P.eval('/π×1/.test(document.getElementById("cRun").textContent) && !document.getElementById("cRun").classList.contains("hide") && STAR.trail[1].pi'));
    ok('undo button walks back', (await P.eval('(document.getElementById("bUndo").click(), [STAR.trail.length, STAR.g.moves, STAR.cur.key === STAR.trail[0].key])')).join() === '1,0,true');
    await sleep(900); const dbg = [];
    for (let s = 0; s < 3; s++) { const j = await P.eval('STAR.kids.findIndex(k => !k.fills && !k.seen)'); dbg.push(j); if (j < 0) break; [x, y] = await P.eval('STAR.kidXY(' + j + ')'); await P.click(x, y); await sleep(800); dbg.push(await P.eval('STAR.g.moves')); }
    ok('three swaps', (await P.eval('STAR.g.moves')) === 3, dbg);
    [x, y] = await P.eval('STAR.trailXY(1)'); await P.click(x, y); await sleep(700);
    ok('tap trail star 1: backtracked to it', (await P.eval('[STAR.g.moves, STAR.trail.length].join()')) === '1,2');
    const back = await P.eval('STAR.kids.findIndex(k => k.seen)');
    ok('the way back to the start is a child marked seen (loop ring)', back >= 0);
    [x, y] = await P.eval('STAR.kidXY(' + back + ')'); await P.click(x, y); await sleep(900);
    ok('stepping onto it marks the cycle: visit badges and the ↻2 chip', await P.eval('document.querySelectorAll("#trail .vn").length === 2 && /↻2/.test(document.getElementById("cLoop").textContent) && !document.getElementById("cLoop").classList.contains("hide")'));
    await shot(P, 'star-cycle');
    ok('no script errors (play)', !P.logs.length, P.logs[0]);
    // the pond: no frame, still a star tree
    await P.goto(srv.url + 'lab/star.html?lvl=splash'); await sleep(1200);
    a = await agree(P, 'pond'); ok('splash (2 elements, rim of 3): children match, no frame', a.ok && (await P.eval('STAR.cur.t')) === -1);
    // ---- the heuristic lab
    P = await B.page(1280, 800, 1);
    await P.addScript("localStorage.setItem('fth-star-tut','1')");
    await P.goto(srv.url + 'lab/star.html?lvl=round-and-round&wsp=.15'); await sleep(1200);
    await P.eval('STAR.openLab()');
    ok('the baselines fill the board', await until(P, 'document.querySelectorAll("#lbBoard tr").length === FTH_STAR.BUILTIN.length + 1', 60000));
    const res = await P.eval('(STAR.setRule(FTH_STAR.BUILTIN.find(r => r.id === "few-locks-new")), STAR.test(null, "start").then(r => ({ rate: r.rate, n: r.n })))');
    ok('"Fewest locks, new stars" solves all 40 levels', res.rate === 1 && res.n === 40, res);
    const ev = await P.eval('window.__starLog[window.__starLog.length - 1]');
    ok('heuristic_test logged with the full rule and its scores', ev && ev.rule && ev.rule.cards.length === 3 && ev.scope === 'start' && ev.n === 40 && ev.solved === 40 && typeof ev.excess === 'number' && ev.sink === 'local', ev && { cards: ev.rule.cards.length, sink: ev.sink });
    const exp = await P.eval('(document.getElementById("lbCopy").click(), JSON.parse(window.__starCopied))');
    ok('the rule exports as JSON', exp.kind === 'fth-star-rule' && exp.rule.cards.length === 3 && exp.scores.start.rate === 1);
    await P.eval('(STAR.setRule(FTH_STAR.BUILTIN[0]), STAR.test(null, "start"))');
    await shot(P, 'star-lab-results');
    await P.eval('STAR.watchStart(FTH_STAR.BUILTIN[0], "round-and-round")');
    await sleep(6000); await shot(P, 'star-pi-loop');
    ok('watching Kempe-else-π on 7.1: it ends stuck in the π loop', await until(P, 'STAR.watch && !STAR.watch.auto && STAR.watch.why === "loop"', 60000), await P.eval('STAR.watch'));
    ok('the loop is marked on the trail (revisits)', await P.eval('document.querySelectorAll("#trail .vn").length >= 2 && STAR.drv === "sand"'));
    ok('the app never saw the sandbox (real game untouched)', (await P.eval('STAR.g.moves')) === 0);
    await P.eval('document.getElementById("wX").click()'); await sleep(500);
    ok('✕ returns to the real game', await P.eval('STAR.drv === "real" && STAR.trail.length === 1'));
    ok('no script errors (lab)', !P.logs.length, P.logs[0]);
    // ---- in the app
    P = await B.page(390, 844, 1);
    await P.addScript("try{localStorage.setItem('fth-star-tut','1')}catch(e){}");
    await P.goto(srv.url + 'index.html?skin=star&all=1&view=game&lvl=kempes-double'); await sleep(3500);
    const sh = await P.eval(`(() => { const f = document.getElementById('skinFrame'), w = f.contentWindow, rs = document.getElementById('rimStar');
      return { src: f.src, kids: w.STAR ? w.STAR.kids.length : -1, rim: rs ? getComputedStyle(rs).display : 'none', skin: document.body.dataset.skin }; })()`);
    ok('the app plays the Star page in its frame', /lab\/star\.html/.test(sh.src) && sh.kids > 0 && sh.skin === 'star', sh);
    ok('the shell\'s star rim chip is hidden on this skin', sh.rim === 'none');
    await shot(P, 'star-in-app');
    ok('no script errors (app)', !P.logs.length, P.logs[0]);
  } finally { B.close(); srv.close(); }
  console.log(bad ? bad + ' problem(s)' : 'star OK');
  process.exit(bad ? 1 : 0);
})();
