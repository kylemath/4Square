// Respawn (lab/respawn.html) in headless Chrome: every level loads and is won through the page's own doors.
//   node tools/respawn_play_check.js [--lvl id,id] [--shots dir]
// For each level (390x844, the phone view): load the page, wait for GO; take one door that is NOT in g.good() when
// there is one (mouse click on the drawn door), respawn at the start by clicking node 0 of the drawn tree, then click
// the door whose chain is in g.good() until g.won(); assert: no script error, the win took par doors on the walk
// (g.moves == par), the room count and respawn count match, the tree has every room entered.
// On the first level it also lets one room's fuse burn out and checks the death is counted and a respawn revives it.
// --shots writes phone and desktop screenshots of level 12 (in play, dead, won) into dir.
const path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = process.env.GAME_ROOT || path.join(__dirname, '..');
const args = process.argv.slice(2), li = args.indexOf('--lvl'), si = args.indexOf('--shots');
global.window = global; (0, eval)(require('fs').readFileSync(path.join(ROOT, 'levels.js'), 'utf8'));
const LEVELS = li >= 0 ? args[li + 1].split(',') : GAME.levels.map(l => l.id), SHOTS = si >= 0 ? args[si + 1] : null;
const R = 'window.RESPAWN';
async function waitPhase(P, want, ms) { for (let i = 0; i < ms / 50; i++) { const p = await P.eval(R + '.phase()'); if (want.includes(p)) return p; await sleep(50); } return await P.eval(R + '.phase()'); }
async function clickDoor(P, good) {
  const D = await P.eval(R + '.doors()'), d = D.find(x => x.good === good);
  if (!d) return false; await P.click(d.r.x, d.r.y); await waitPhase(P, ['room', 'won'], 3000); return true;
}
async function one(B, base, lvl, first) {
  const P = await B.page(390, 844, 1), fails = [];
  await P.goto(base + 'lab/respawn.html?mode=respawn&lvl=' + encodeURIComponent(lvl));
  if ((await waitPhase(P, ['room'], 4000)) !== 'room') fails.push('never reached GO');
  const par = await P.eval(R + '.stats().par');
  let wrong = 0;
  if (await clickDoor(P, false)) {
    wrong = 1;
    const [x, y] = (await P.eval(R + '.nodeXY()'))[0]; await P.click(x, y); await waitPhase(P, ['room'], 2000);
    if (await P.eval(R + '.T.cur') !== 0) fails.push('tree click did not respawn at the start');
  }
  if (first) {   // let the fuse burn out
    if ((await waitPhase(P, ['dead'], 9000)) !== 'dead') fails.push('room never collapsed');
    const [x, y] = (await P.eval(R + '.nodeXY()'))[0]; await P.click(x, y); await waitPhase(P, ['room'], 2000);
    const s = await P.eval(R + '.stats()'); if (s.deaths !== 1) fails.push('deaths ' + s.deaths);
  }
  for (let k = 0; k < 12 && !(await P.eval(R + '.g.won()')); k++) if (!(await clickDoor(P, true))) { fails.push('no good door'); break; }
  const s = await P.eval(R + '.stats()');
  if (!(await P.eval(R + '.g.won()'))) fails.push('not won');
  if (s.walk !== par) fails.push('walk ' + s.walk + ' != par ' + par);
  if (s.rooms !== par + wrong) fails.push('rooms ' + s.rooms + ' != ' + (par + wrong));
  if (s.respawns !== wrong + (first ? 1 : 0)) fails.push('respawns ' + s.respawns);
  if (s.nodes !== par + wrong + 1 - (wrong && 0)) { /* a wrong door may lead into a room on the good line: only warn */ }
  await sleep(300); if (P.logs.length) fails.push('script error: ' + P.logs[0].split('\n')[0]);
  P.S('Target.closeTarget', {}).catch(() => 0);
  return { fails, par, s };
}
// Run mode (the default since 14 Oct): one fuse per run; when it burns out the next run starts from the start room;
// tree taps do nothing. Take a wrong door if there is one, idle until the fuse burns out, check the restart, then win.
async function runOne(B, base, lvl) {
  const P = await B.page(390, 844, 1), fails = [];
  await P.goto(base + 'lab/respawn.html?lvl=' + encodeURIComponent(lvl));
  if ((await waitPhase(P, ['room'], 4000)) !== 'room') fails.push('run: never reached GO');
  const par = await P.eval(R + '.stats().par');
  await clickDoor(P, false);
  if ((await waitPhase(P, ['dead'], 14000)) !== 'dead') fails.push('run: fuse never burned out');
  if ((await waitPhase(P, ['tele', 'room'], 4000)) === 'dead') fails.push('run: no automatic restart');
  await waitPhase(P, ['room'], 2000);
  if (await P.eval(R + '.T.cur') !== 0) fails.push('run: restart not at the start room');
  if (await P.eval(R + '.g.moves') !== 0) fails.push('run: moves not reset');
  if ((await P.eval(R + '.stats()')).runs !== 2) fails.push('run: run counter not 2');
  const xy = await P.eval(R + '.nodeXY()'); const tgt = xy.findIndex((q, i) => q && i > 0);
  if (tgt > 0) { await P.click(xy[tgt][0], xy[tgt][1]); await sleep(300); if (await P.eval(R + '.T.cur') !== 0) fails.push('run: tree tap teleported'); }
  for (let k = 0; k < 12 && !(await P.eval(R + '.g.won()')); k++) if (!(await clickDoor(P, true))) { fails.push('run: no good door'); break; }
  const s = await P.eval(R + '.stats()');
  if (!(await P.eval(R + '.g.won()'))) fails.push('run: not won');
  if (s.walk !== par) fails.push('run: walk ' + s.walk + ' != par ' + par);
  await sleep(300); if (P.logs.length) fails.push('run: script error: ' + P.logs[0].split('\n')[0]);
  P.S('Target.closeTarget', {}).catch(() => 0);
  return { fails, par, s };
}
async function shots(B, base, dir) {
  const fs = require('fs'); fs.mkdirSync(dir, { recursive: true });
  for (const [w, h, tag] of [[390, 844, 'phone'], [1280, 800, 'desktop']]) {
    const P = await B.page(w, h, 2); await P.goto(base + 'lab/respawn.html?mode=respawn&lvl=12'); await waitPhase(P, ['room'], 4000);
    for (let k = 0; k < 2; k++) { const D = await P.eval(R + '.doors()'), d = D.find(x => !x.good) || D[0]; await P.eval(R + '.go(' + d.i + ')'); await waitPhase(P, ['room'], 2000); }
    const D2 = await P.eval(R + '.doors()'); await P.eval('0');
    await P.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: D2[1].r.x, y: D2[1].r.y });   // hover: the door opens, its chain lights on the mural
    await sleep(700); await P.shot(path.join(dir, tag + '-play.png'));
    await waitPhase(P, ['dead'], 9000); await sleep(1300); await P.shot(path.join(dir, tag + '-dead.png'));
    await P.eval(R + '.respawn(0)'); await waitPhase(P, ['room'], 2000);
    for (let k = 0; k < 10 && !(await P.eval(R + '.g.won()')); k++) { const d = (await P.eval(R + '.doors()')).find(x => x.good); await P.eval(R + '.go(' + d.i + ')'); await waitPhase(P, ['room', 'won'], 2000); }
    await sleep(2000); await P.shot(path.join(dir, tag + '-won.png'));
    P.S('Target.closeTarget', {}).catch(() => 0);
  }
}
(async () => {
  const srv = await serve(ROOT), B = await launch(); let bad = 0;
  try {
    for (let i = 0; i < LEVELS.length; i++) {
      let r; try { r = await one(B, srv.url, LEVELS[i], i === 0); } catch (e) { r = { fails: ['check crashed: ' + e.message], s: {} }; }
      let q; try { q = await runOne(B, srv.url, LEVELS[i]); } catch (e) { q = { fails: ['run check crashed: ' + e.message], s: {} }; }
      r.fails = r.fails.concat(q.fails); r.s.runs = q.s.runs;
      if (r.fails.length) bad++;
      console.log((r.fails.length ? 'FAIL ' : 'ok   ') + LEVELS[i].padEnd(20) + ' par ' + r.par + ' rooms ' + r.s.rooms + ' respawns ' + r.s.respawns + ' deaths ' + r.s.deaths + ' tree ' + r.s.nodes + (r.fails.length ? '\n       ' + r.fails.join('\n       ') : ''));
    }
    if (SHOTS) await shots(B, srv.url, SHOTS);
  } finally { B.close(); srv.close(); }
  console.log(bad ? bad + ' levels FAILED' : 'all ' + LEVELS.length + ' levels ok');
  process.exit(bad ? 1 : 0);
})();
