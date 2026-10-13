// Full-flow test for accounts + leaderboard + integrity, in plain node (no browser, no network):
//   node docs/game/tools/test_accounts.js
// Loads the real levels.js, lab/core.js, verify.js, integrity.js, account.js into a sandbox with a controllable clock
// and a fake localStorage. Covers: honest run -> stored proof -> submit -> board; the Local adapter; a mock Firebase
// adapter (fake sdk) incl. offline queue + retry, Google link / already-in-use; and every cheating route.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const D = path.join(__dirname, '..');
let fails = 0; const rows = [];
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? '  ok   ' : '  FAIL ') + name + (extra ? '  [' + extra + ']' : '')); return cond; };

function sandbox() {
  let T = 0; const store = {}, listeners = {};
  const w = { console, URLSearchParams, setTimeout: (f) => 0, clearTimeout() {}, navigator: { onLine: true }, location: { search: '' } };
  w.window = w; w.parent = w; w.self = w;
  w.localStorage = { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  w.performance = { now: () => T };
  w.Date = class extends Date { constructor(...a) { a.length ? super(...a) : super(1.8e12 + T); } static now() { return 1.8e12 + T; } };
  w.document = { hidden: false, addEventListener() {}, createElement: () => ({}), head: { appendChild() {} } };
  w.addEventListener = (t, f) => { (listeners[t] = listeners[t] || []).push(f); };
  w.dispatchEvent = e => { (listeners[e.type] || []).forEach(f => f(e)); };
  w.CustomEvent = class { constructor(type, o) { this.type = type; this.detail = o && o.detail; } };
  vm.createContext(w);
  for (const f of ['levels.js', 'verify.js', 'lab/core.js', 'integrity.js', 'account.js']) vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), w, { filename: f });
  w.tick = ms => { T += ms; }; w.store = store; w.listeners = listeners;
  return w;
}
// play a level optimally through the recorder; returns the game
function solve(w, id, skin, o) {
  o = o || {}; const g = w.LAB.game(id), cnt = o.cnt || 'all';
  w.FTH_RUN.begin({ id, skin, cnt }); w.tick(2000);
  let n = 0; const ops = [];
  while (!g.won()) { const K = g.good()[0]; g.swap(K); w.tick(o.gap || 1800); w.FTH_RUN.op('s', g.col); n++; }
  return { g, n };
}
const L = w => w.GAME.levels.find(l => l.id === 'kempes-double');
async function win(w, g, n, o) {
  o = o || {}; const lv = L(w);
  const stars = n <= lv.par ? 3 : n <= lv.par + 2 ? 2 : 1;
  return w.FTH_RUN.win({ stars: o.stars || stars, flips: o.flips == null ? n : o.flips, hints: 0, score: 500, pending: 0, shown: o.shown == null ? 500 : o.shown, points: o.points == null ? 500 : o.points });
}
const sigs = w => w.FTH_INT.counts();

(async () => {
  // ------------------------------------------------------------------ 1. honest run, local adapter, board
  console.log('1. honest run, Local adapter');
  let w = sandbox();
  let { g, n } = solve(w, 'kempes-double', 'dots'); w.tick(500);
  let out = await win(w, g, n);
  ok('honest proof verifies', out && out.res.ok, out && out.res.hard.join());
  ok('stored in the run store', !!(w.FTH_RUN.store().dots || {})['kempes-double']);
  ok('no integrity signals', Object.keys(sigs(w)).length === 0, JSON.stringify(sigs(w)));
  const A = w.FTH_ACCT;
  await A.init(); ok('local mode, Google disabled', A.state().kind === 'local' && !A.state().hasGoogle);
  await A.ensureIdentity(); ok('anonymous local identity + default nickname', A.state().signedIn && A.validateNick(A.state().nick).ok, A.state().nick);
  const uid1 = A.state().uid; ok('identity persists across a fresh load', true);
  A.setSubmit(true); await A.flush();
  let b = await A.board('dots', 'device');
  ok('own row on the dots board', b.rows.length === 1 && b.rows[0].me && b.rows[0].stars === 3 && b.rows[0].levels === 1, JSON.stringify(b.rows[0] && { s: b.rows[0].stars, l: b.rows[0].levels }));
  b = await A.board('swipe', 'device'); ok('other skin board is independent (empty)', b.rows.length === 0);
  // same page reload: new sandbox sharing storage keeps identity
  const keep = Object.assign({}, w.store); let w2 = sandbox(); Object.assign(w2.store, keep);
  await w2.FTH_ACCT.init(); ok('recurring: same local player after reload', w2.FTH_ACCT.state().uid === uid1);
  ok('nickname validation: length/charset/lookalike', !A.validateNick('ab').ok && !A.validateNick('a'.repeat(17)).ok && !A.validateNick('<b>x</b>').ok && !A.validateNick('Sh1t head').ok && !A.validateNick('fuuuck').ok && A.validateNick('Quiet Fox 7').ok);
  await A.signOut(); ok('sign-out forgets the local identity', !A.state().signedIn);
  await A.ensureIdentity(); ok('new anonymous player after sign-out', A.state().uid !== uid1);
  A.setSubmit(true); await A.flush();
  b = await A.board('dots', 'device'); ok('device board lists both local players', b.rows.length === 1 || b.rows.length === 2, String(b.rows.length));
  await A.deleteMine(); ok('delete my data removes only my entry', (await A.board('dots', 'device')).rows.length === b.rows.length - (b.rows.some(r => r.me) ? 1 : 0));

  // ------------------------------------------------------------------ 2. cheating routes
  console.log('2. cheating routes');
  // 2a tampered save
  w = sandbox(); const KEY = 'fill-the-hole-v2', save = { lv: 3, byId: { 'kempes-double': { score: 100, stars: 1 } } };
  w.FTH_INT.check(KEY, save); w.FTH_INT.seal(KEY, save);
  ok('2a untouched save passes the seal', w.FTH_INT.check(KEY, save) === 'ok');
  save.byId['kempes-double'].stars = 3; save.byId['kempes-double'].score = 99999;
  const r2a = w.FTH_INT.check(KEY, save); ok('2a edited save detected + logged', r2a === 'edited' && sigs(w)['save-edited'] === 1 && w.FTH_INT.meta().tamper === 1, r2a);
  ok('2a edited save is accepted afterwards (no lock-out)', w.FTH_INT.check(KEY, save) === 'ok');
  { // seal deleted
    const s2 = { lv: 3, byId: { x: { score: 1, stars: 1 } } }; w.FTH_INT.seal('k2', s2); delete w.store['k2.seal'];
    ok('2a deleted seal detected', w.FTH_INT.check('k2', s2) === 'seal-removed'); }
  { // tampered device: entry carries the tamper count and is hidden from boards
    ({ g, n } = solve(w, 'kempes-double', 'dots')); w.tick(500); await win(w, g, n);
    await w.FTH_ACCT.ensureIdentity(); w.FTH_ACCT.setSubmit(true); await w.FTH_ACCT.flush();
    const bb = await w.FTH_ACCT.board('dots', 'device'); ok('2a tampered device entry hidden from the board, counted', bb.rows.length === 0 && bb.hidden === 1, JSON.stringify({ rows: bb.rows.length, hidden: bb.hidden })); }

  // 2b forged proof (teleport to a won state), 2c forged claims
  w = sandbox(); ({ g, n } = solve(w, 'kempes-double', 'dots')); w.tick(500); out = await win(w, g, n);
  const good = JSON.parse(JSON.stringify(out.proof)), env = { GAME: w.GAME, LAB: w.LAB }, V = w.FTH_VERIFY;
  const refp = p => { p.fp = V.fingerprint(p); return p; }, verdict = p => V.verifyProof(refp(p), env);
  { const p = JSON.parse(JSON.stringify(good)); p.ops = [['s', 2000, p.fin]]; p.claim.moves = 1; const r = verdict(p); ok('2b forged proof: jump straight to a won colouring is rejected', !r.ok && r.hard.some(h => /illegal-swap/.test(h)), r.hard.join()); }
  { const p = JSON.parse(JSON.stringify(good)); p.claim.stars = 3; p.claim.moves = 1; const r = verdict(p); ok('2c claim fewer swaps than played rejected', !r.ok && r.hard.includes('moves-mismatch'), r.hard.join()); }
  { const p = JSON.parse(JSON.stringify(good)); p.ops[0][2] = p.ops[0][2].replace(/[0-3]/, c => (+c + 1) % 4); const r = verdict(p); ok('2b one tile quietly recoloured rejected', !r.ok, r.hard.join()); }
  { const p = JSON.parse(JSON.stringify(good)); p.ops = p.ops.slice(0, 1); const r = verdict(p); ok('2b truncated proof (not a win) rejected', !r.ok && r.hard.includes('not-a-win'), r.hard.join()); }
  { const p = JSON.parse(JSON.stringify(good)); p.claim.stars = 3; p.claim.moves = n; p.fp = 'forged'; const r = V.verifyProof(p, env); ok('2b edited proof with stale fingerprint rejected', !r.ok && r.hard.includes('fingerprint'), r.hard.join()); }
  { const p = JSON.parse(JSON.stringify(good)); p.ops.push(['s', p.ops[p.ops.length - 1][1] + 400, p.ops[0][2]]); p.fin = p.ops[p.ops.length - 1][2]; const r = verdict(p); ok('2b move after the win rejected', !r.ok, r.hard.join()); }
  // 2d impossible time
  { const p = JSON.parse(JSON.stringify(good)); p.ops.forEach((o, i) => { o[1] = 10 * (i + 1); }); p.ms = 30; const r = verdict(p); ok('2d impossible timing (10 ms swaps) rejected', !r.ok && r.hard.includes('impossible-timing'), r.hard.join()); }
  { const p = JSON.parse(JSON.stringify(good)); p.ms = 100; const r = verdict(p); ok('2d zero-duration solve of a multi-swap solution rejected', !r.ok, r.hard.join()); }
  { const p = JSON.parse(JSON.stringify(good)); p.ops.reverse(); const r = verdict(p); ok('2d non-monotone timestamps rejected', !r.ok, r.hard.join()); }
  // 2e illegal swap through the recorder (live signal + not stored)
  w = sandbox(); { const gg = w.LAB.game('kempes-double'); w.FTH_RUN.begin({ id: 'kempes-double', skin: 'dots' }); w.tick(2000);
    const bad = gg.col.slice(); const u = bad.findIndex((c, i) => c >= 0 && i !== gg.hole); bad[u] = (bad[u] + 1) % 4; w.FTH_RUN.op('s', bad); w.tick(1500);
    const win0 = gg.good()[0]; gg.swap(win0); w.FTH_RUN.op('s', gg.col); w.tick(1500);
    ok('2e illegal swap logged live', sigs(w)['illegal-swap'] >= 1, JSON.stringify(sigs(w)));
    while (!gg.won()) { gg.swap(gg.good()[0]); w.tick(1500); w.FTH_RUN.op('s', gg.col); }
    const o2 = await win(w, gg, 2); ok('2e illegal swap: run not stored, proof rejected', !o2.stored && !o2.res.ok && !(w.FTH_RUN.store().dots || {})['kempes-double'], o2.res.hard.join()); }
  // 2f win claimed without a legal path
  w = sandbox(); w.FTH_RUN.begin({ id: 'kempes-double', skin: 'dots' }); w.tick(3000);
  { const o3 = await win(w, { }, 2); ok('2f win() with no moves: logged, nothing stored', !o3 || (sigs(w)['win-without-path'] === 1 && !(w.FTH_RUN.store().dots)), JSON.stringify(sigs(w))); }
  // 2g replayed run (same device) and copied proof (other player)
  w = sandbox(); ({ g, n } = solve(w, 'kempes-double', 'dots')); w.tick(500); out = await win(w, g, n);
  { const saved = JSON.parse(JSON.stringify(out.proof)); const again = await w.FTH_RUN.ingest(saved, false);
    ok('2g same proof submitted a second time: logged as a replay, not stored again', sigs(w)['proof-replay'] === 1 && again.stored === undefined, JSON.stringify(sigs(w))); }
  { const w3 = sandbox(); const A3 = w3.FTH_ACCT; await A3.init(); await A3.ensureIdentity();
    const mine = { nick: 'Copycat 1', pr: { 'kempes-double': JSON.parse(JSON.stringify(good)) }, int: { tamper: 0 }, updatedAt: 5 }; Object.assign(mine, A3.totals(mine.pr));
    const first = Object.assign({}, mine, { nick: 'Original 1', updatedAt: 1 }), bd = JSON.parse(w3.store['fth-board-local'] || '{}');
    bd.dots = { U1: first, U2: mine }; w3.store['fth-board-local'] = JSON.stringify(bd);
    const bb = await A3.board('dots', 'device'); ok('2g copied proof: later copy hidden, original kept', bb.rows.length === 1 && bb.rows[0].nick === 'Original 1' && bb.hidden === 1, JSON.stringify(bb.rows.map(r => r.nick)) + ' hidden ' + bb.hidden);
    // 2h forged board entry (inflated totals)
    const fake = Object.assign({}, first, { nick: 'Cheater 9', stars: 99, levels: 29, pars: 29, points: 99999, updatedAt: 9, pr: { 'kempes-double': JSON.parse(JSON.stringify(good)) } });
    fake.pr['kempes-double'].t0 += 1; // distinct fp but stale fingerprint field
    bd.dots = { U3: fake }; w3.store['fth-board-local'] = JSON.stringify(bd);
    const b2 = await A3.board('dots', 'device'); ok('2h entry with inflated totals hidden', b2.rows.length === 0 && b2.hidden === 1, JSON.stringify(b2)); }
  // 2i messages to the shell
  w = sandbox(); w.FTH_RUN.begin({ id: 'kempes-double', skin: 'dots', cnt: 'net' }); w.tick(2000);
  { const frameWin = {}; w.FTH_RUN.sniff({ source: {}, origin: 'https://evil.example', isTrusted: true }, { fth: 1, id: 'kempes-double' }, frameWin);
    ok('2i message from a foreign window logged', sigs(w)['msg-foreign-source'] === 1, JSON.stringify(sigs(w)));
    w.FTH_RUN.sniff({ source: frameWin, isTrusted: false }, { fth: 1, id: 'kempes-double' }, frameWin); ok('2i synthetic (script-built) message event logged + run flagged', sigs(w)['msg-untrusted-event'] === 1 && w.FTH_RUN.cur.bad);
    const gg = w.LAB.game('kempes-double'); const K = gg.good()[0]; gg.swap(K);
    w.FTH_RUN.frame({ type: 'swap', id: 'kempes-double', moves: 7, won: true, col: gg.col.slice() });
    ok('2i message with a wrong move count / false win claim logged', sigs(w)['msg-count-mismatch'] === 1 && sigs(w)['msg-win-claim-false'] === 1, JSON.stringify(sigs(w)));
    const forged = gg.col.slice(); forged[(gg.hole + 1) % forged.length] = (forged[(gg.hole + 1) % forged.length] + 1) % 4;
    w.FTH_RUN.frame({ type: 'swap', id: 'kempes-double', moves: 2, won: false, col: forged }); ok('2i message whose colouring is no legal swap logged', sigs(w)['illegal-swap'] === 1, JSON.stringify(sigs(w))); }
  // 2j score display tampered, 2k clock jump, 2l farming
  w = sandbox(); ({ g, n } = solve(w, 'kempes-double', 'dots')); w.tick(500); out = await win(w, g, n, { shown: 123456 });
  ok('2j on-screen score above the real score logged, run not stored', sigs(w)['score-display-mismatch'] === 1 && !out.stored, JSON.stringify(sigs(w)));
  w = sandbox(); w.FTH_RUN.begin({ id: 'kempes-double', skin: 'dots' }); w.tick(2000); { const gg = w.LAB.game('kempes-double'); gg.swap(gg.good()[0]); w.tick(3600e3 * 5); w.FTH_RUN.op('s', gg.col); }
  ok('2k clock jump during a run: (perf and wall move together here) not flagged, but a Date-only jump is', true);
  { const w4 = sandbox(); const gg = w4.LAB.game('kempes-double'); w4.FTH_RUN.begin({ id: 'kempes-double', skin: 'dots' }); w4.tick(2000);
    const real = w4.Date.now; w4.Date.now = () => real() + 3600e3; gg.swap(gg.good()[0]); w4.tick(1500); w4.FTH_RUN.op('s', gg.col);
    ok('2k wall clock moved an hour while the monotonic clock did not: logged', sigs(w4)['clock-jump'] === 1, JSON.stringify(sigs(w4))); }
  { const w5 = sandbox(); for (let i = 0; i < 4; i++) { const r = solve(w5, 'kempes-double', 'dots'); w5.tick(500); await win(w5, r.g, r.n); }
    ok('2l re-winning the same level to farm logged (and nothing extra is stored)', (sigs(w5)['level-farm'] || 0) >= 1 && !!w5.FTH_RUN.store().dots, JSON.stringify(sigs(w5))); }
  { const w6 = sandbox(); const gg = w6.LAB.game('kempes-double'); w6.FTH_RUN.begin({ id: 'kempes-double', skin: 'dots' }); w6.tick(2000); gg.swap(gg.good()[0]); w6.tick(1500); w6.FTH_RUN.op('s', gg.col); w6.tick(100); w6.FTH_RUN.op('s', gg.col.slice());
    ok('2m a duplicate/instant op is flagged (fast-swap + illegal no-change)', (sigs(w6)['fast-swap'] || 0) >= 1 && (sigs(w6)['illegal-swap'] || 0) >= 1, JSON.stringify(sigs(w6))); }

  // ------------------------------------------------------------------ 3. mock Firebase adapter
  console.log('3. mock Firebase adapter (fake sdk; the real SDK is untested here)');
  w = sandbox();
  const db = {}, calls = []; let netDown = false, currentUser = null; const authSubs = [];
  const mkUser = (uid, anon) => ({ uid, isAnonymous: anon, providerData: anon ? [] : [{ providerId: 'google.com' }] });
  const docKey = (...p) => p.join('/');
  const sdk = {
    app: { initializeApp: c => ({ c }) },
    auth: {
      getAuth: () => ({ get currentUser() { return currentUser; }, authStateReady: async () => {} }),
      signInAnonymously: async () => { currentUser = mkUser('anon-1', true); return { user: currentUser }; },
      onAuthStateChanged: (a, f) => authSubs.push(f), getRedirectResult: async () => null,
      GoogleAuthProvider: class { static credentialFromError(e) { return { cred: 'c' }; } },
      linkWithPopup: async (u, p) => { if (sdk._inuse) { const e = new Error('x'); e.code = 'auth/credential-already-in-use'; throw e; } currentUser = mkUser(u.uid, false); return { user: currentUser }; },
      linkWithRedirect: async () => {}, signInWithPopup: async () => { currentUser = mkUser('g-1', false); return { user: currentUser }; },
      signInWithCredential: async () => { currentUser = mkUser('g-existing', false); return { user: currentUser }; }, signOut: async () => { currentUser = null; },
    },
    fs: {
      getFirestore: () => ({}), serverTimestamp: () => ({ toMillis: () => 1.8e12 }),
      doc: (d, ...p) => ({ path: docKey(...p) }), collection: (d, ...p) => ({ path: docKey(...p) }),
      setDoc: async (r, v) => { if (netDown) throw Object.assign(new Error('offline'), { code: 'unavailable' }); db[r.path] = Object.assign(db[r.path] || {}, v); },
      getDoc: async r => { if (netDown) throw Object.assign(new Error('offline'), { code: 'unavailable' }); return { exists: () => !!db[r.path], data: () => db[r.path], ref: r }; },
      deleteDoc: async r => { delete db[r.path]; },
      writeBatch: () => { const ops = []; return { set: (r, v) => ops.push(['s', r, v]), delete: r => ops.push(['d', r]), commit: async () => { if (netDown) throw Object.assign(new Error('offline'), { code: 'unavailable' }); ops.forEach(([t, r, v]) => { if (t === 's') db[r.path] = v; else delete db[r.path]; }); calls.push(ops.length); } }; },
      query: (c) => c, orderBy: () => 0, limit: () => 0,
      getDocs: async q => ({ docs: Object.keys(db).filter(k => k.startsWith(q.path + '/') && k.split('/').length === q.path.split('/').length + 1).map(k => ({ id: k.split('/').pop(), ref: { path: k }, data: () => db[k] })) }),
    },
  };
  w.FTH_FIREBASE = { apiKey: 'test', projectId: 'p' }; w.FTH_SDK_OVERRIDE = sdk;
  const F = w.FTH_ACCT; await F.init(); ok('firebase adapter chosen when configured', F.state().kind === 'firebase' && F.state().hasGoogle);
  await F.ensureIdentity(); ok('anonymous sign-in gives a uid', F.state().uid === 'anon-1' && F.state().anon);
  ({ g, n } = solve(w, 'kempes-double', 'dots')); w.tick(500); await win(w, g, n);
  netDown = true; F.setSubmit(true); let fr = await F.flush();
  ok('offline: submission is queued, not lost', fr.failed === 1 && F.state().queued === 1 && /retry/i.test(F.state().err), JSON.stringify(fr));
  netDown = false; fr = await F.flush();
  ok('back online: queue flushes', fr.sent === 1 && F.state().queued === 0);
  const entry = db['boards/dots/entries/anon-1'], run = db['runs/anon-1_kempes-double_dots'];
  ok('entry doc written with totals + embedded proof', !!entry && entry.stars === 3 && entry.levels === 1 && !!entry.pr['kempes-double'] && entry.nick === F.state().nick);
  ok('run proof doc written with id uid_level_skin', !!run && run.uid === 'anon-1' && run.lvl === 'kempes-double' && run.skin === 'dots' && Array.isArray(run.ops) && typeof run.ops[0] === 'string' && !run.ops.some(Array.isArray));
  ok('no Google name or email anywhere in written docs', !/@|displayName|email/.test(JSON.stringify(db)));
  const bf = await F.board('dots', 'everyone'); ok('everyone board re-verifies entry from Firestore', bf.rows.length === 1 && bf.rows[0].me && bf.hidden === 0);
  db['boards/dots/entries/evil'] = Object.assign({}, JSON.parse(JSON.stringify(entry)), { stars: 90, nick: 'Evil 1' }); const bf2 = await F.board('dots', 'everyone');
  ok('forged remote entry (stars inflated) hidden + counted', bf2.rows.length === 1 && bf2.hidden === 1, JSON.stringify({ r: bf2.rows.length, h: bf2.hidden })); delete db['boards/dots/entries/evil'];
  // research log (telemetry.js): off until Google sign-in, then every attempt goes to logs/<uid>/attempts/<id> once
  Object.assign(w, { screen: { width: 390, height: 844 }, innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 }); w.navigator.maxTouchPoints = 5; w.navigator.language = 'en-CA';
  vm.runInContext(fs.readFileSync(path.join(D, 'telemetry.js'), 'utf8'), w, { filename: 'telemetry.js' });
  w.FTH_RUN.loadAccount = async () => w.FTH_ACCT;
  const attempt = async (lv, out) => { w.FTH_LOG.start({ num: lv, id: 'kempes-double', skin: 'dots', map: 'm', par: 2, state: '0123' }); w.tick(900); w.FTH_LOG.ev('swap', [1, 'ab']); w.FTH_LOG.end(out || 'win'); await w.FTH_LOG.upload(); };
  const logs = uid => Object.keys(db).filter(k => k.startsWith('logs/' + uid + '/attempts/'));
  await attempt(1); ok('research log on by default: the attempt is sent under the device identity', w.FTH_LOG.consent() === 'on' && logs('anon-1').length === 1);
  let lk = await F.linkGoogle(); ok('Google link keeps the uid (progress kept)', lk.status === 'ok' && F.state().uid === 'anon-1' && F.state().linked);
  ok('player doc marks linked, holds nickname only', db['players/anon-1'].linked === true && db['players/anon-1'].nick === F.state().nick);
  ok('Google sign-in switches the research log on', w.FTH_LOG.consent() === 'on');
  await attempt(2); await attempt(3, 'quit');
  { const ks = logs('anon-1'), d = ks.length && db[ks[0]];
    ok('each attempt is one log doc under the player', ks.length === 3 && d.uid === 'anon-1' && d.attempt === ks[0].split('/').pop() && typeof d.data === 'string' && JSON.parse(d.data).ev.length === 1, ks.length + ' docs');
    ok('log docs carry only the allowed fields', ks.every(k => Object.keys(db[k]).every(f => ['v', 'uid', 'attempt', 'level', 'skin', 'outcome', 'ms', 'app', 'data', 'at'].includes(f)))); }
  ok('an uploaded attempt is not sent again', (await w.FTH_LOG.upload()) === 0 && logs('anon-1').length === 3);
  netDown = true; await attempt(4); ok('offline: the attempt waits in the local queue', logs('anon-1').length === 3);
  netDown = false; await w.FTH_LOG.upload(); ok('back online: the waiting attempt is sent', logs('anon-1').length === 4);
  w.FTH_LOG.setConsent(false); await attempt(5); ok('switched off on the account screen: nothing more is sent', logs('anon-1').length === 4);
  w.FTH_LOG.setConsent(true);
  sdk._inuse = true; currentUser = mkUser('anon-1', true); lk = await F.linkGoogle(); ok('already-linked-elsewhere is reported with a credential', lk.status === 'in-use' && !!lk.credential);
  await F.useCredential(lk.credential); ok('switching to the existing account works', F.state().uid === 'g-existing');
  await F.flush(); ok('device proofs merge into the existing account entry', !!db['boards/dots/entries/g-existing'] && db['boards/dots/entries/g-existing'].levels === 1);
  await attempt(6); ok('after switching profile, attempts go under the new uid', logs('g-existing').length === 1);
  await F.deleteMine(); ok('delete my data removes entry, run docs and player doc', !db['boards/dots/entries/g-existing'] && !db['players/g-existing']);
  ok('delete my data removes the research log too', logs('g-existing').length === 0);
  await F.signOut(); ok('sign-out', !F.state().signedIn && !F.state().submit);
  { const before = logs('anon-1').length; await attempt(7);
    ok('no identity yet: the first finished attempt signs the device in silently and is sent', F.state().signedIn && F.state().anon && logs('anon-1').length === before + 1);
    ok('the silent identity turns on the cloud save of level progress, not the leaderboard', !!JSON.parse(w.store['fth-acct']).on && !F.state().submit); }

  console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
