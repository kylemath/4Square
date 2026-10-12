// The island win scene (board/island.js holeCeremony + win() in index.html), played headlessly:
//   node docs/game/tools/win_scene_check.js [--skin islands|islands-free] [--lvl id,id] [--shots dir] [--audio]
// Wins each level through the __game hook, samples the board every ~60ms during the scene (tile light levels, overlay shapes
// in #cv, tile count lit), times last swipe -> win card -> bonus ready, and with --audio hooks the AudioContext to log
// every oscillator start, the named sfx fired and the peak level at the destination. Asserts: every tile fully lit before
// the sequence's first beat, no tile dimmed below 1 during it, no overlay polygons/locks drawn over the board, sound
// effects fire in order, and the output never clips.
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = process.env.GAME_ROOT || path.join(__dirname, '..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; }, flag = k => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const skins = opt('--skin', 'islands,islands-free').split(','), lvls = opt('--lvl', 'splash,kempes-double,far-away,one-lock').split(','), shots = opt('--shots', ''), audio = flag('--audio'), every = +opt('--every', 0);
const HOOK = `(function () {
  window.__au = { starts: [], ctx: null, t0: 0 };      // the page's AudioContext becomes an OfflineAudioContext on a wall-clock timeline (headless Chrome has no audio device)
  const OC = window.OfflineAudioContext; if (!OC) return;
  window.AudioContext = function () {
    const c = new OC(1, 44100 * 60, 44100), t0 = performance.now(); window.__au.ctx = c; window.__au.t0 = t0;
    Object.defineProperty(c, 'currentTime', { get: () => (performance.now() - t0) / 1000 }); return c;
  };
  const os = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function () { window.__au.starts.push([performance.now(), this.type, this.frequency.value]); return os.apply(this, arguments); };
})();`;
async function one(B, base, skin, lvl) {
  const P = await B.page(390, 844, 1); if (audio) await P.addScript(HOOK);
  await P.goto(base + 'index.html?skin=' + skin + '&all=1&view=game&lvl=' + lvl);
  for (let i = 0; i < 60 && !(await P.eval('window.__game && __game.layout && __game.T && __game.T.length > 3').catch(() => false)); i++) await sleep(100);
  await sleep(3500);
  // observer: time of win-card on, and the bonus round start (a #bonusSvg appearing)
  await P.eval(`(() => { window.__w = { tw: 0, tb: 0 }; new MutationObserver(() => { const w = document.getElementById('win'); if (w.classList.contains('on') && !__w.tw) __w.tw = performance.now(); if (!__w.tb && document.querySelector('#bonusSvg.live')) __w.tb = performance.now(); }).observe(document.body, { subtree: true, childList: true, attributes: true }); })()`);
  const rec = await P.eval(`(() => { const rec = window.__rec = []; const T = __game.T; const mon = () => { if (!window.__rec) return; const cv = document.getElementById('cv'), fx = [...cv.children].filter(g => g.tagName === 'g' && g.getAttribute('pointer-events') === 'none').pop();
      const lights = T.map(t => t && t.kind === 'tile' ? t.light : null).filter(x => x !== null); const min = Math.min(...lights), max = Math.max(...lights);
      const ov = fx ? fx.children.length : 0;
      rec.push({ t: performance.now(), min, max, ov, fx: window.__fxHtml ? 1 : 0 }); setTimeout(mon, 40); }; mon(); return 1; })()`);
  await P.eval('if (__game.sfx) __game.sfx.trace = true');
  // win: play good flips until won
  let guard = 0;
  while (!(await P.eval('__game.won')) && guard++ < 40) {
    while (await P.eval('__game.busy')) await sleep(30);
    if (await P.eval('__game.won')) break;
    if (!(await P.eval('(() => { const K = __game.good()[0]; if (K) { (window.__tfs = window.__tfs || []).push(performance.now()); __game.flip(K); } return !!K; })()'))) await sleep(100);
    await sleep(60);
  }
  
  let n = 0;
  for (let i = 0; i < 2000; i++) {
    if (shots && (i % (every || 5) === 0) && n < 60) await P.shot(path.join(shots, skin + '-' + lvl + '-' + String(n++).padStart(2, '0') + '.png'));
    if (await P.eval('!!__w.tb')) break; await sleep(every ? 40 : 80);
  }
  await sleep(1200);                                           // the closing flourish
  const R = await P.eval('({ tl: Math.max(...__tfs.filter(t => t < (__w.tw || 1e12))), tw: __w.tw, tb: __w.tb, rec: __rec, log: __game.sfx ? __game.sfx.log : [] })'); await P.eval('window.__rec = null');
  let au = null;
  if (audio) au = await P.eval(`(async () => { const A = __au, buf = await A.ctx.startRendering(), d = buf.getChannelData(0), sr = buf.sampleRate, W = 0.05, pk = [];
    for (let i = 0; i < d.length; i += sr * W) { let m = 0; for (let k = i; k < Math.min(d.length, i + sr * W); k++) m = Math.max(m, Math.abs(d[k])); pk.push(m); }
    return { t0: A.t0, starts: A.starts.length, st: A.starts, pk }; })()`);
  P.S('Target.closeTarget', {}).catch(() => 0);
  return { R, au };
}
const ORDER = ['sweep', 'tryTone', 'nope', 'hunt', 'find', 'thump', 'thunk', 'sparkle', 'swell', 'cheer', 'star', 'flourish'];   // first appearances, in this order
function check(R, au, fail) {
  const sweep = R.log.find(l => l[1] === 'sweep');
  if (R.log.length) {
    const seen = ORDER.filter(n => R.log.some(l => l[1] === n)); if (seen.length < ORDER.length) fail('missing sfx: ' + ORDER.filter(n => !seen.includes(n)).join(','));
    const first = n => R.log.findIndex(l => l[1] === n); let prev = -1; ORDER.forEach(n => { const f = first(n); if (f < prev) fail('sfx out of order: ' + n); prev = Math.max(prev, f); });
    if (R.log.filter(l => l[1] === 'star').length !== 3 || R.log.filter(l => l[1] === 'thump').length !== 4 || R.log.filter(l => l[1] === 'hunt').length !== 3) fail('sfx counts: ' + ['star', 'thump', 'hunt'].map(n => n + '=' + R.log.filter(l => l[1] === n).length).join(' '));
    if (R.log.filter(l => l[1] === 'nope').length !== R.log.filter(l => l[1] === 'tryTone').length) fail('every tried element should get a nope');
  } else fail('no sfx log');
  const rec = R.rec, lit0 = sweep ? sweep[0] + 520 : R.tw;
  const dim = rec.filter(r => r.t > lit0 && r.t < R.tw && r.min < .98); if (dim.length) fail('a tile dimmed to ' + Math.min(...dim.map(r => r.min)).toFixed(2) + ' after the illumination (' + dim.length + ' samples)');
  const ov = rec.filter(r => r.t > R.tl + 150 && r.t < R.tw && r.ov > 0); if (ov.length) fail('overlay shapes drawn over the board during the win scene (' + ov.length + ' samples)');
  if (au) {
    const peak = Math.max(...au.pk); if (peak > .6) fail('audio peak ' + peak.toFixed(2) + ' is near clipping');
    R.log.forEach(([t, n]) => { const i = Math.floor((t - au.t0) / 1000 / .05); const m = Math.max(...au.pk.slice(i, i + 4)); if (m < .002) fail('silent effect ' + n + ' at ' + Math.round(t - R.tl)); });
  }
}
(async () => {
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const srv = await serve(ROOT), B = await launch(); let bad = 0;
  try {
    for (const sk of skins) for (const lv of lvls) {
      const { R, au } = await one(B, srv.url, sk, lv), fails = []; check(R, au, f => fails.push(f));
      const seq = ORDER.map(n => n + 'x' + R.log.filter(l => l[1] === n).length).join(' ');
      console.log(sk, lv, 'swipe->card', Math.round(R.tw - R.tl), 'ms, card->bonus', Math.round(R.tb - R.tw), 'ms, total', Math.round(R.tb - R.tl), 'ms', au ? ' audio peak=' + Math.max(...au.pk).toFixed(3) + (R.log[0] ? ' (scene only ' + Math.max(...au.pk.slice(Math.floor((R.log[0][0] - au.t0) / 50))).toFixed(3) + ')' : '') + '@' + Math.round(au.pk.indexOf(Math.max(...au.pk)) * 50 + au.t0 - R.tl) + 'ms' + ' osc=' + au.starts : '', fails.length ? 'FAIL' : 'ok');
      if (process.env.DEBUGAU) console.log(JSON.stringify(au.st.filter(x => x[0] - R.tl > 700 && x[0] - R.tl < 1150).map(x => [Math.round(x[0] - R.tl), x[1], Math.round(x[2])])));
      fails.forEach(f => console.log('   -', f)); if (fails.length) bad++; if (process.env.VERBOSE) console.log('   ' + seq);
      if (process.env.VERBOSE) console.log(JSON.stringify(R.rec.filter((_, i) => i % 8 === 0).map(r => [Math.round(r.t - R.tl), +r.min.toFixed(2), +r.max.toFixed(2), r.ov])));
    }
  } finally { B.close(); srv.close(); }
  process.exit(bad ? 1 : 0);
})();
