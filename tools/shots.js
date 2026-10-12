// In-app screenshots at 390x844 (the preview.sh patterns, but through a local server so frame tokens, postMessage and the
// frame's own controls are all live):   node docs/game/tools/shots.js <outdir> [skin ...] [--view game|menu|title|win] [--lvl id] [--wait ms]
//   GAME_ROOT=<dir> to shoot another checkout of docs/game (for before/after comparisons).
const fs = require('fs'), path = require('path'), { serve, launch, sleep } = require('./cdp');
const ROOT = process.env.GAME_ROOT || path.join(__dirname, '..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const view = opt('--view', 'game'), lvl = opt('--lvl', 'kempes-double'), wait = +opt('--wait', 3500), scroll = opt('--scroll', '');
const out = args.shift() || '.', all = ['dots', 'doodle', 'blank', 'map', 'swipe', 'ions', 'tables', 'islands'], skins = args.length ? args : all;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const srv = await serve(ROOT), B = await launch();
  try {
    for (const sk of skins) {
      const P = await B.page(390, 844, 1);
      await P.goto(srv.url + 'tools/preview.html?skin=' + sk + '&all=1&view=' + view + '&lvl=' + lvl + (scroll ? '&scroll=' + scroll : ''));
      await sleep(wait); console.log(await P.shot(path.join(out, sk + '-' + view + '.png')));
    }
  } finally { B.close(); srv.close(); }
})();
