/* integrity.js: run recorder + on-device integrity log for "Fill the Hole" (4square). Loaded by index.html after
 * telemetry.js, levels.js and verify.js. Read ACCOUNTS.md ("Integrity") for what is and is not stopped.
 *
 * Three separate things, kept apart on purpose:
 *   1. the RESEARCH log (telemetry.js): unchanged, opt-in. Integrity events are mirrored into it only if the player
 *      already said yes to research logging (FTH_LOG.ev is a no-op otherwise).
 *   2. the INTEGRITY LOG (here): always on, stays on this device ('fth-integrity', last 200 signals, newest last). A
 *      signal is a kind + level + skin + a few numbers. No fingerprinting, no keystrokes, no IP, no free text.
 *   3. the RUN PROOF (verify.js format): built when a level is won and kept in 'fth-runs' (best per skin and level).
 *      It leaves the device only when the player is signed in on the account screen, has submission switched on, and
 *      sees the one-line notice; then account.js sends proof + the signals counted during that run with the entry.
 *
 * Hooks the shell calls (all optional, all wrapped by the shell in `if (window.FTH_RUN)`):
 *   FTH_INT.check(key, save)   after loading the progress save: is it the one we last wrote?
 *   FTH_INT.seal(key, save)    after every save write
 *   FTH_RUN.begin({id, skin, cnt, own}) / op(type, col) / hint() / win({...}) / end(why) / sniff(e, d, frameWin) / frame(d)
 */
(function () {
  'use strict';
  const APP = '2026.10-a1';
  const V = window.FTH_VERIFY;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const jget = (k, d) => { try { const x = JSON.parse(ls.get(k)); return x == null ? d : x; } catch (e) { return d; } };
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const LOGK = 'fth-integrity', METAK = 'fth-int-meta', SECK = 'fth-int-key', RUNK = 'fth-runs', FPK = 'fth-fps', ACCK = 'fth-acct';

  // ---------------------------------------------------------------- integrity log
  let cur = null;                                           // the run in progress (see begin)
  const seen = {};                                          // per-kind counter for log spam control (this page load)
  function log(kind, data) {
    const rec = { t: new Date().toISOString().slice(0, 19) + 'Z', k: kind, l: cur ? cur.lvl : undefined, s: cur ? cur.skin : undefined, d: data };
    if (cur) cur.sig[kind] = (cur.sig[kind] || 0) + 1;
    seen[kind] = (seen[kind] || 0) + 1;
    if (seen[kind] <= 8) { const q = jget(LOGK, []); q.push(rec); ls.set(LOGK, JSON.stringify(q.slice(-200))); }
    try { if (window.FTH_LOG) FTH_LOG.ev('integrity', { k: kind, d: data }); } catch (e) {}      // only recorded if research consent is on
    try { dispatchEvent(new CustomEvent('fth-integrity', { detail: rec })); } catch (e) {}
    return rec;
  }
  const meta = () => jget(METAK, { tamper: 0 });
  const bump = (field) => { const m = meta(); m[field] = (m[field] || 0) + 1; m.last = Date.now(); ls.set(METAK, JSON.stringify(m)); return m; };

  // ---------------------------------------------------------------- save seal (hash chain over progress)
  // Not cryptography: the key sits on the same device. It catches casual edits of the progress save (devtools, a
  // localStorage editor), which are logged and make this device's board entries carry a tamper count.
  function secret() { let s = ls.get(SECK); if (!s) { s = rid() + rid(); ls.set(SECK, s); } return s; }
  const canon = o => JSON.stringify(Object.keys(o || {}).sort().map(k => [k, o[k]]));
  // the wallet (save.wallet, per-skin coin balances) is sealed with the progress; a save with no wallet hashes as before
  const wcanon = w => JSON.stringify(Object.keys(w).sort().map(k => [k, w[k].bal, w[k].earned, w[k].f || 0]));
  // owned skins and skin tickets (save.skins, tickets.js) are sealed too, so a hand unlock shows up as an edited save
  const scanon = k => JSON.stringify([(k.own || []).slice().sort(), k.tickets | 0, k.bought | 0]);
  const digest = save => V ? V.h53(canon(save.byId) + (save.wallet ? '|w' + wcanon(save.wallet) : '') + (save.skins ? '|s' + scanon(save.skins) : ''), 7) : '';
  const link = (prev, n, dg) => V ? V.h53(secret() + '|' + prev + '|' + n + '|' + dg, 11) : '';
  function seal(key, save) {
    if (!V) return;
    const s = jget(key + '.seal', { n: 0, p: '', h: '' }), n = s.n + 1;
    ls.set(key + '.seal', JSON.stringify({ n, p: s.h, h: link(s.h, n, digest(save)) }));
  }
  function check(key, save) {
    if (!V || save.lv !== 3 && save.lv !== undefined) return 'legacy';
    const s = jget(key + '.seal', null), has = save.byId && Object.keys(save.byId).length;
    let res = 'ok';
    if (!s) { if (has && ls.get(SECK)) { res = 'seal-removed'; } else res = 'init'; }
    else if (link(s.p, s.n, digest(save)) !== s.h) res = 'edited';
    if (res === 'edited' || res === 'seal-removed') { log('save-' + res, { n: has }); bump('tamper'); }
    if (res !== 'ok') { const n0 = jget(key + '.seal', { n: 0, p: '', h: '' }); ls.set(key + '.seal', JSON.stringify({ n: n0.n, p: n0.p, h: n0.h })); seal(key, save); }
    return res;
  }

  // ---------------------------------------------------------------- run store (best verified proof per skin and level)
  const store = () => jget(RUNK, {});
  function upsert(p, res) {
    const all = store(), sk = all[p.skin] = all[p.skin] || {}, old = sk[p.lvl], pts = Math.max(0, Math.min(p.claim.pts || 0, 6000));
    const better = !old || res.stars > old.st || (res.stars === old.st && res.moves < old.mv);
    sk[p.lvl] = better ? { p, st: res.stars, mv: res.moves, pts: Math.max(pts, old ? old.pts : 0), at: Date.now() } : Object.assign(old, { pts: Math.max(pts, old.pts) });
    ls.set(RUNK, JSON.stringify(all)); return better;
  }

  // ---------------------------------------------------------------- run recorder
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = performance.now();
    else if (hiddenAt && cur && !cur.done) { cur.hid.n++; cur.hid.ms += Math.round(performance.now() - hiddenAt); hiddenAt = 0; }
  });
  let blurAt = 0;
  addEventListener('blur', () => { blurAt = performance.now(); });
  addEventListener('focus', () => { if (blurAt && cur && !cur.done) { cur.blur.n++; cur.blur.ms += Math.round(performance.now() - blurAt); } blurAt = 0; });

  const wins = {};                                          // wins per skin/level this page load (farming)
  function graphOf(lvl) { const L = window.GAME.levels.find(l => l.id === lvl); return L && Object.assign({ L }, window.GAME.graphs[L.g]); }
  const rimCount = (Gr, col) => new Set(Gr.link.map(x => col[x])).size;
  const clockOff = () => Date.now() - performance.now();

  function begin(info) {
    cur = null; if (!V || !window.GAME) return;
    const Gr = graphOf(info.id); if (!Gr) return;
    const start = Gr.L.start.slice(); start[Gr.hole] = -1;
    cur = { lvl: info.id, skin: info.skin, cnt: info.cnt || 'all', own: !!info.own, Gr, ops: [], t0: performance.now(), w0: Date.now(), off: clockOff(), hints: 0, sig: {}, hid: { n: 0, ms: 0 }, blur: { n: 0, ms: 0 },
      last: start, net: 0, done: false, bad: false, run: rid() };
  }
  function sig(kind, data) { log(kind, data); if (cur) cur.bad = true; }
  function op(type, col) {
    const r = cur; if (!r || r.done || r.skip || !V) return;
    const c = col.slice(), dt = Math.round(performance.now() - r.t0); c[r.Gr.hole] = -1;
    const prev = r.ops.length ? r.ops[r.ops.length - 1][1] : 0;
    if (document.hidden) log('move-while-hidden', { dt });
    if (type === 's' || type === 'w') {
      const d = V.diffSwap(window.GAME, r.lvl, r.last, c);
      if (!d.ok) sig('illegal-swap', { why: d.why });
      if (type !== 'w') r.net++;
    } else if (type === 'u') r.net = Math.max(0, r.net - 1); else if (type === 'r') r.net = 0;
    if (type !== 'r' && dt - prev < V.LIM.swapMs) log('fast-swap', { gap: dt - prev });
    const off = clockOff(); if (Math.abs(off - r.off) > 2000) { log('clock-jump', { d: Math.round(off - r.off) }); r.off = off; }
    r.ops.push([type, dt, V.encCol(c)]); r.last = c;
  }
  const hint = () => { if (cur) cur.hints++; };
  const end = why => { if (why === 'skin-error' && cur) { cur.skip = true; log('skin-fallback', {}); } else cur = null; };       // a skin that crashed mid-level: no proof for this run

  // the shell receives a message from the skin frame: foreign sender, synthetic event, wrong level
  function sniff(e, d, frameWin) {
    if (!d || !d.fth) return;
    if (e.isTrusted === false) sig('msg-untrusted-event', {});
    else if (frameWin && e.source !== frameWin) log('msg-foreign-source', { origin: String(e.origin || '').slice(0, 60) });
    if (cur && d.id && d.id !== cur.lvl) log('msg-wrong-level', {});
  }
  // an accepted frame message (swap / undo / reset): record it and check it is consistent with the run so far
  function frame(d) {
    const r = cur; if (!r || r.done || r.skip || !V) return;
    if (!Array.isArray(d.col) || d.col.length !== r.Gr.n) { sig('msg-bad-state', {}); return; }
    const t = d.type === 'swap' ? 's' : d.type === 'undo' ? 'u' : 'r', c = d.col.slice(); c[r.Gr.hole] = -1;
    if (t === 'r' && V.encCol(c) !== V.encCol(r.Gr.L.start.map((x, i) => i === r.Gr.hole ? -1 : x))) sig('msg-state-inconsistent', { t });
    op(t, c);
    const net = r.net;
    if (typeof d.moves === 'number' && d.moves !== net) sig('msg-count-mismatch', { got: d.moves, want: net });
    if (typeof d.won === 'boolean' && d.won !== (rimCount(r.Gr, c) <= (r.Gr.goal || 3))) sig('msg-win-claim-false', {});
  }

  function ensureCore() {
    if (window.LAB) return Promise.resolve();
    return new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'lab/core.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  }
  function loadScripts(list) { return list.reduce((p, src) => p.then(() => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error(src)); document.head.appendChild(s); })), Promise.resolve()); }
  let acctP = null;
  function loadAccount() {
    if (window.FTH_ACCT) return Promise.resolve(window.FTH_ACCT);
    if (!acctP) acctP = loadScripts(['account-config.js', 'account.js']).then(() => window.FTH_ACCT).catch(e => { acctP = null; throw e; });
    return acctP;
  }

  // the level was won. info: { stars, flips, hints, score, pending, shown, own }
  function win(info) {
    const r = cur; if (!r || !V) { if (!cur) log('win-without-run', {}); return Promise.resolve(null); }
    if (r.done || r.skip) return Promise.resolve(null);
    r.done = true;
    if (r.own) { log('own-skin-no-proof', {}); return Promise.resolve(null); }       // the skin's own goal cannot be replayed (ACCOUNTS.md)
    const key = r.skin + '/' + r.lvl, farm = wins[key] = (wins[key] || 0) + 1;
    if (farm >= 3) log('level-farm', { n: farm });
    if (rimCount(r.Gr, r.last) > (r.Gr.goal || 3) || !r.ops.length) sig('win-without-path', {});
    if (+info.shown > info.score - (info.pending || 0) + 101) sig('score-display-mismatch', { shown: +info.shown, want: info.score - (info.pending || 0) });
    const ms = Math.round(performance.now() - r.t0);
    const p = { v: 1, lvl: r.lvl, skin: r.skin, app: APP, cnt: r.cnt, hints: info.hints || r.hints, t0: r.w0, ms, wall: Date.now() - r.w0,
      claim: { stars: info.stars, moves: info.flips, pts: Math.max(0, Math.round(info.points || 0)) }, ops: r.ops, fin: V.encCol(r.last), int: [] };
    if (r.hid.n) p.int.push(['hidden', r.hid.n, r.hid.ms]); if (r.blur.n) p.int.push(['blur', r.blur.n, r.blur.ms]);
    Object.keys(r.sig).forEach(k => p.int.push([k, r.sig[k]]));
    p.fp = V.fingerprint(p);
    return ingest(p, r.bad);
  }
  // verify a finished proof, remember its fingerprint, keep it if it is the best for its skin + level
  function ingest(p, bad) {
    return ensureCore().then(() => {
      const res = V.verifyProof(p, { GAME: window.GAME, LAB: window.LAB });
      const out = { proof: p, res, bad: !!bad };
      if (!res.ok) { log('proof-rejected', { why: res.hard.slice(0, 4) }); }
      else if (bad) { log('proof-flagged', {}); }
      else {
        const fps = jget(FPK, []);
        if (fps.includes(p.fp)) log('proof-replay', {});
        else { fps.push(p.fp); ls.set(FPK, JSON.stringify(fps.slice(-400))); out.stored = upsert(p, res); }
        res.soft.forEach(s => log('proof-soft:' + s, {}));
      }
      try { dispatchEvent(new CustomEvent('fth-run', { detail: out })); } catch (e) {}
      const a = jget(ACCK, null);
      if (out.stored !== undefined && a && a.on && a.submit) loadAccount().then(A => A.flush()).catch(() => {});
      return out;
    }).catch(e => { log('verify-error', { m: String(e && e.message).slice(0, 60) }); return null; });
  }

  let lbP = null;
  function openBoard(skin) {
    if (!lbP) lbP = loadAccount().then(() => window.FTH_LB || loadScripts(['leaderboard.js'])).catch(e => { lbP = null; throw e; });   // one account.js per page (cloud.js may have loaded it)
    return lbP.then(() => window.FTH_LB.open(skin)).catch(() => { alert('The leaderboard could not load. Check your connection and try again.'); });
  }
  window.FTH_INT = { log, logs: () => jget(LOGK, []), clear() { ls.del(LOGK); }, meta, check, seal, APP,
    counts() { const o = {}; jget(LOGK, []).forEach(r => { o[r.k] = (o[r.k] || 0) + 1; }); return o; } };
  window.FTH_RUN = { begin, op, hint, end, win, ingest, sniff, frame, store, loadAccount, loadScripts, openBoard, APP, get cur() { return cur; }, keys: { RUNK, FPK, ACCK, LOGK, METAK } };
})();
