// Cloud saves (cloud.js) in plain node: the merge rules, and the sync protocol between devices that share one profile.
//   node tools/cloud_check.js
// Each "device" is a sandbox with its own localStorage running the real account.js (LOCAL adapter) and cloud.js; the
// LOCAL adapter keeps the cloud slot in 'fth-cloud-local', which here is shared by every device, so they see one cloud.
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..');
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? '  ok   ' : '  FAIL ') + name + (extra ? '  [' + extra + ']' : '')); };

const CLOUD = {};                                   // the shared cloud slot
function device(name) {
  const store = {}, listeners = {}, wrote = [];
  const w = { console, URLSearchParams, setTimeout: () => 0, clearTimeout() {}, navigator: { onLine: true }, name };
  w.window = w; w.self = w;
  w.localStorage = { getItem: k => k === 'fth-cloud-local' ? (CLOUD.v || null) : k in store ? store[k] : null,
    setItem: (k, v) => { if (k === 'fth-cloud-local') CLOUD.v = String(v); else store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  w.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  w.performance = { now: () => 0 };
  w.document = { hidden: false, visibilityState: 'visible', addEventListener() {}, createElement: () => ({}), head: { appendChild() {} } };
  w.addEventListener = (t, f) => { (listeners[t] = listeners[t] || []).push(f); };
  w.dispatchEvent = e => { (listeners[e.type] || []).forEach(f => f(e)); };
  w.CustomEvent = class { constructor(type, o) { this.type = type; this.detail = o && o.detail; } };
  w.location = { search: '', reload() { w.reloads = (w.reloads || 0) + 1; } };
  vm.createContext(w);
  for (const f of ['levels.js', 'verify.js', 'lab/core.js', 'integrity.js', 'account.js', 'cloud.js']) vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), w, { filename: f });
  // the game's save, as index.html keeps it
  w.save = { lv: 3, byId: {}, wallet: {}, skins: { own: ['islands'], tickets: 0, bought: 0 } };
  w.FTH_SAVE = { key: 'fill-the-hole-v2', raw: () => JSON.parse(JSON.stringify(w.save)), write(o) { wrote.push(o); w.save = JSON.parse(JSON.stringify(o)); } };
  w.persist = () => w.FTH_CLOUD.dirty();
  w.wrote = wrote; w.store = store;
  return w;
}
const run = (w, src) => vm.runInContext(src, w);

(async () => {
  // ---------------------------------------------------------------- merge rules
  const M = device('m').FTH_CLOUD.merge;
  const a = { lv: 3, skin: 'dots', byId: { x: { stars: 3, score: 500 }, y: { stars: 1, score: 900 } }, wallet: { islands: { bal: 100, earned: 400, f: .5 }, dots: { bal: 10, earned: 10 } },
    skins: { own: ['islands', 'dots'], tickets: 0, bought: 1 }, worlds: { r178: { v: ['a', 'b'], g: ['c'], e: [] } }, ach: { first: 1 }, maps: { r178: { t: 5, id: 'x' } }, sync: { t: 1 } };
  const b = { lv: 3, skin: 'crush', byId: { y: { stars: 2, score: 300 }, z: { stars: 1, score: 50 } }, wallet: { islands: { bal: 250, earned: 300 }, crush: { bal: 7, earned: 7 } },
    skins: { own: ['islands', 'crush'], tickets: 1, bought: 2 }, worlds: { r178: { v: ['b', 'd'], g: [], e: ['q'] }, p22: { v: ['k'], g: [], e: [] } }, ach: { deep: 1 }, maps: { r178: { t: 9, id: 'y' } }, sync: { t: 2 } };
  const m = M(a, b);
  ok('a level keeps its best stars and best score from either side', m.byId.y.stars === 2 && m.byId.y.score === 900 && m.byId.x.stars === 3 && m.byId.z.stars === 1);
  ok('each wallet keeps the larger balance and lifetime total', m.wallet.islands.bal === 250 && m.wallet.islands.earned === 400 && m.wallet.dots.bal === 10 && m.wallet.crush.bal === 7);
  ok('owned skins are united, tickets and purchases the larger count', ['islands', 'dots', 'crush'].every(k => m.skins.own.includes(k)) && m.skins.tickets === 1 && m.skins.bought === 2);
  ok('charted maps are united', m.worlds.r178.v.length === 3 && m.worlds.r178.e.includes('q') && !!m.worlds.p22);
  ok('achievements united, newer last-played map kept', m.ach.first && m.ach.deep && m.maps.r178.id === 'y');
  ok('everything else comes from the newer save', m.skin === 'crush');
  const canon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v);
  ok('merge is symmetric for progress', canon(M(b, a).byId) === canon(m.byId) && canon(M(b, a).wallet) === canon(m.wallet));
  const R = device('r').FTH_CLOUD.mergeRuns({ islands: { x: { st: 2, mv: 5 } } }, { islands: { x: { st: 3, mv: 9 }, y: { st: 1, mv: 1 } }, dots: { x: { st: 1, mv: 2 } } });
  ok('run proofs keep the better proof per skin and level', R.islands.x.st === 3 && R.islands.y && R.dots.x);

  // ---------------------------------------------------------------- sync between devices of one profile
  const A = device('phone'), B = device('desktop');
  await run(A, 'FTH_ACCT.ensureIdentity()');                        // joined the leaderboard on the phone
  const uid = run(A, 'FTH_ACCT.state().uid');
  A.save.byId = { 'splash': { stars: 3, score: 700 }, 'kempes-double': { stars: 2, score: 900 } }; A.save.wallet = { islands: { bal: 300, earned: 300, f: 0 } }; A.persist();
  ok('the phone uploads its save', await run(A, 'FTH_CLOUD.sync()') === 'uploaded' && JSON.parse(CLOUD.v)[uid].rev === 1);

  // the desktop signs in to the same profile (as Google sign-in would): same uid, nothing played there yet
  B.store['fth-acct-local'] = A.store['fth-acct-local']; B.store['fth-acct'] = A.store['fth-acct'];
  ok('a fresh desktop restores the phone\'s progress', await run(B, 'FTH_CLOUD.sync()') === 'restored' && B.save.byId.splash.stars === 3 && B.save.wallet.islands.bal === 300 && B.reloads === 1);

  // the desktop plays on; the phone picks it up next time
  B.save.byId['far-away'] = { stars: 1, score: 200 }; B.save.wallet.islands.bal = 380; B.save.wallet.islands.earned = 380; B.persist();
  ok('the desktop uploads what it played (rev 2)', await run(B, 'FTH_CLOUD.sync()') === 'uploaded' && JSON.parse(CLOUD.v)[uid].rev === 2);
  ok('the phone, untouched since, takes the newer cloud save', await run(A, 'FTH_CLOUD.sync()') === 'restored' && !!A.save.byId['far-away'] && A.save.wallet.islands.bal === 380);
  ok('nothing new on either side: no reload, no upload', await run(A, 'FTH_CLOUD.sync()') === 'same' && await run(B, 'FTH_CLOUD.sync()') === 'same');

  // both play offline, then sync: the second one to sync merges
  A.save.byId['deepest-pit'] = { stars: 3, score: 1500 }; A.persist();
  B.save.byId['kempes-double'] = { stars: 3, score: 1100 }; B.save.skins.own.push('dots'); B.persist();
  ok('first device back online uploads', await run(A, 'FTH_CLOUD.sync()') === 'uploaded');
  const r2 = await run(B, 'FTH_CLOUD.sync()');
  ok('second device merges both sessions', r2 === 'merged' && B.save.byId['deepest-pit'].stars === 3 && B.save.byId['kempes-double'].stars === 3 && B.save.skins.own.includes('dots'), r2);
  ok('...and the first device then gets the merge', await run(A, 'FTH_CLOUD.sync()') === 'restored' && A.save.byId['kempes-double'].stars === 3 && A.save.skins.own.includes('dots'));

  // an old device with its own progress signs in to the profile for the first time (the move from GitHub Pages)
  const C = device('old-phone');
  C.save.byId = { 'splash': { stars: 2, score: 400 }, 'level-zz': { stars: 1, score: 100 } }; C.save.wallet = { dots: { bal: 900, earned: 900 } }; C.save.skins = { own: ['islands', 'swipe'], tickets: 0, bought: 1 };
  C.store['fth-acct-local'] = A.store['fth-acct-local']; C.store['fth-acct'] = A.store['fth-acct'];
  const r3 = await run(C, 'FTH_CLOUD.sync()');
  ok('a device with its own progress merges into the profile, losing nothing', r3 === 'merged' && C.save.byId['level-zz'] && C.save.byId.splash.stars === 3 && C.save.wallet.dots.bal === 900 && C.save.wallet.islands.bal === 380 && C.save.skins.own.includes('swipe') && C.save.skins.own.includes('dots'), r3);

  // a lost race: the cloud moved on between read and write (the transaction refuses), sync retries and still converges
  A.save.byId['race'] = { stars: 1, score: 1 }; A.persist();
  ok('after the old phone merged, the main phone (dirty) merges again and keeps its new level', await run(A, 'FTH_CLOUD.sync()') === 'merged' && A.save.byId.race && A.save.byId['level-zz']);

  ok('a player who never joined never syncs', await run(device('x'), 'FTH_CLOUD.sync()') === 'off');
  console.log(fails ? fails + ' problem(s)' : 'cloud saves OK');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
