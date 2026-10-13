/* cloud.js: cloud saves for 4square. A player who has joined the leaderboard (account.js) keeps the whole progress save
 * (levels and stars, wallets, owned skins and tickets, charted maps, achievements) in Firestore at saves/{uid}, so the
 * same Google profile plays on a phone, a tablet and a desktop. Owner-only (firestore.rules); leaderboards are untouched:
 * they are still built from replayed proofs, never from this save.
 *
 * How it syncs. Every write of the save (index.html persist()) marks this device dirty and uploads a few seconds later
 * (and at once when the page is hidden). Each cloud write bumps `rev`; the device remembers the rev it last saw:
 *   cloud rev == mine, I am dirty      -> upload (rev + 1)
 *   cloud rev != mine, I am clean      -> the cloud is newer: take it (the page reloads with it)
 *   cloud rev != mine, I am dirty, or another profile's save is here (first Google sign-in on a device that already
 *   has progress)                      -> MERGE (below), keep the merge here and upload it
 * Writes go through a transaction on rev, so two devices never overwrite each other blind; a lost race just syncs again.
 *
 * Merge (FTH_CLOUD.merge(a, b), pure): per level the better record (stars, then score); per wallet the larger balance
 * and lifetime total; owned skins united, tickets and purchases the larger count; charted maps united; achievements
 * united; per-level swap memory the longer one; per-map last-played the newer one; anything else from the newer save.
 * The run proofs (fth-runs) merge per skin and level, keeping the better proof.
 *
 * Hooks: index.html sets window.FTH_SAVE = { key, raw(), write(obj) } and calls FTH_CLOUD.dirty() in persist().
 * Status for the account screen: FTH_CLOUD.state() -> { on, busy, at, err }; event 'fth-cloud' on change.
 */
(function () {
  'use strict';
  const META = 'fth-cloud', RUNK = 'fth-runs', ACCK = 'fth-acct', V = 1, LIMIT = 690000;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const jget = (k, d) => { try { const x = JSON.parse(ls.get(k)); return x == null ? d : x; } catch (e) { return d; } };
  const jset = (k, v) => ls.set(k, JSON.stringify(v));
  const clone = o => JSON.parse(JSON.stringify(o == null ? null : o));
  const obj = o => o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  const keys = (a, b) => [...new Set(Object.keys(obj(a)).concat(Object.keys(obj(b))))];

  // ---------------------------------------------------------------- merge (pure)
  const better = (x, y) => !x ? y : !y ? x : ((y.stars | 0) > (x.stars | 0) || ((y.stars | 0) === (x.stars | 0) && (y.score | 0) > (x.score | 0))) ? y : x;
  function mergeLevels(a, b) { const o = {}; keys(a, b).forEach(k => { const x = obj(a)[k], y = obj(b)[k], w = clone(better(x, y));
    if (w && x && y) { w.stars = Math.max(x.stars | 0, y.stars | 0); w.score = Math.max(x.score | 0, y.score | 0); } o[k] = w; }); return o; }
  function mergeWallet(a, b) { const o = {}; keys(a, b).forEach(k => { const x = obj(a)[k] || {}, y = obj(b)[k] || {}, top = (y.bal | 0) > (x.bal | 0) ? y : x;
    o[k] = { bal: Math.max(x.bal | 0, y.bal | 0), earned: Math.max(x.earned | 0, y.earned | 0), f: top.f || 0 }; }); return o; }
  function mergeSkins(a, b) { const x = obj(a), y = obj(b), o = Object.assign({}, clone(x), clone(y));
    o.own = [...new Set((x.own || []).concat(y.own || []))]; o.tickets = Math.max(x.tickets | 0, y.tickets | 0); o.bought = Math.max(x.bought | 0, y.bought | 0); return o; }
  const uni = (p, q) => [...new Set((p || []).concat(q || []))];
  function mergeWorlds(a, b) { const o = {}; keys(a, b).forEach(k => { const x = obj(a)[k] || {}, y = obj(b)[k] || {}; o[k] = Object.assign({}, x, y, { v: uni(x.v, y.v), g: uni(x.g, y.g), e: uni(x.e, y.e) }); }); return o; }
  function pickBy(a, b, f) { const o = {}; keys(a, b).forEach(k => { const x = obj(a)[k], y = obj(b)[k]; o[k] = clone(x === undefined ? y : y === undefined ? x : f(x, y) ? y : x); }); return o; }
  // a and b are whole saves; `newer` (a or b) supplies everything not merged field by field (selected skin, flags...)
  function merge(a, b) {
    a = obj(clone(a)); b = obj(clone(b));
    const newer = ((b.sync && b.sync.t) || 0) > ((a.sync && a.sync.t) || 0) ? b : a, out = Object.assign({}, newer === a ? b : a, newer);
    out.byId = mergeLevels(a.byId, b.byId);
    out.wallet = mergeWallet(a.wallet, b.wallet);
    if (a.skins || b.skins) out.skins = mergeSkins(a.skins, b.skins);
    if (a.worlds || b.worlds) out.worlds = mergeWorlds(a.worlds, b.worlds);
    if (a.ach || b.ach) out.ach = Object.assign({}, obj(a.ach), obj(b.ach));
    if (a.mem || b.mem) out.mem = pickBy(a.mem, b.mem, (x, y) => (y.n | 0) > (x.n | 0));
    if (a.maps || b.maps) out.maps = pickBy(a.maps, b.maps, (x, y) => (y.t || 0) > (x.t || 0));
    delete out.best;
    return out;
  }
  function mergeRuns(a, b) { const o = {}; keys(a, b).forEach(sk => { o[sk] = pickBy(obj(a)[sk], obj(b)[sk], (x, y) => (y.st | 0) > (x.st | 0) || ((y.st | 0) === (x.st | 0) && (y.mv | 0) < (x.mv | 0))); }); return o; }
  // the parts of a save that matter for "is there anything to keep here"
  const progressOf = s => Object.keys(obj(s && s.byId)).length + Object.values(obj(s && s.wallet)).reduce((t, w) => t + (w.earned | 0), 0) + ((s && s.skins && s.skins.own || []).length > 1 ? 1 : 0);
  const same = (a, b) => JSON.stringify(strip(a)) === JSON.stringify(strip(b));
  function strip(s) { const o = Object.assign({}, obj(s)); delete o.best; delete o.sync; delete o.eggDay; return o; }

  // ---------------------------------------------------------------- sync engine (browser)
  let st = { on: false, busy: false, at: 0, err: '' }, upT = 0, running = null, A = null;
  const meta = () => jget(META, { uid: '', rev: 0, dirty: false });
  const setMeta = o => jset(META, Object.assign(meta(), o));
  const emit = () => { try { dispatchEvent(new CustomEvent('fth-cloud', { detail: state() })); } catch (e) {} };
  const state = () => Object.assign({}, st);
  const S = () => window.FTH_SAVE;
  const joined = () => !!jget(ACCK, {}).on;

  function payload(save, rev) {
    const runs = jget(RUNK, {});
    let data = JSON.stringify(Object.assign(strip(save), { sync: { t: Date.now() } })), r = JSON.stringify(runs);
    if (data.length > LIMIT) { const s2 = JSON.parse(data); delete s2.worlds; data = JSON.stringify(s2); }   // very old, very explored saves: maps stay local
    if (r.length > 290000) r = '{}';                                                                            // proofs also live in the board entries
    return { v: V, data, runs: r, rev, app: (window.FTH_RUN && FTH_RUN.APP) || '' };
  }
  function adopt(save, runs, why) {                // write a save to this device and restart the game on it
    S().write(save);
    if (runs) jset(RUNK, runs);
    st.err = ''; emit();
    try { sessionStorage.setItem('fth-cloud-note', why || 'restored'); } catch (e) {}
    location.reload();
  }
  async function account() {
    if (A) return A;
    if (!window.FTH_RUN || !FTH_RUN.loadAccount) throw new Error('no account');
    A = await FTH_RUN.loadAccount(); await A.init(); return A;
  }

  async function syncNow() {
    if (!S() || !joined()) return 'off';
    st.busy = true; emit();
    try {
      const acc = await account(), me = acc.state();
      if (!me.signedIn || !me.uid) { st.on = false; return 'signed-out'; }
      st.on = true;
      for (let tries = 0; tries < 3; tries++) {
        const m = meta(), local = S().raw(), C = await acc.cloudGet(), cloud = C && C.data ? JSON.parse(C.data) : null;
        const cloudRuns = C && C.runs ? JSON.parse(C.runs) : {}, mineHere = m.uid === me.uid;
        if (!cloud) {                                                                     // first save of this profile
          const r = await acc.cloudPut(payload(local, 1), 0); if (!r.ok) continue;
          setMeta({ uid: me.uid, rev: 1, dirty: false }); st.at = Date.now(); return 'uploaded';
        }
        if (mineHere && C.rev === m.rev) {                                                // cloud unchanged since I last synced
          if (!m.dirty) { st.at = Date.now(); return 'same'; }
          const r = await acc.cloudPut(payload(local, C.rev + 1), C.rev); if (!r.ok) continue;
          setMeta({ rev: C.rev + 1, dirty: false }); st.at = Date.now(); return 'uploaded';
        }
        if (!mineHere && !progressOf(local)) {                                           // a fresh device signs in: just take the profile's save
          setMeta({ uid: me.uid, rev: C.rev, dirty: false });
          if (same(local, cloud)) { st.at = Date.now(); return 'same'; }
          adopt(cloud, mergeRuns(jget(RUNK, {}), cloudRuns), 'restored'); return 'restored';
        }
        if (mineHere && !m.dirty) {                                                      // the cloud is newer, nothing new here
          setMeta({ rev: C.rev, dirty: false });
          if (same(local, cloud)) { st.at = Date.now(); return 'same'; }
          adopt(cloud, mergeRuns(jget(RUNK, {}), cloudRuns), 'restored'); return 'restored';
        }
        // both sides changed, or this device's progress meets another profile's save: keep everything from both
        const merged = merge(local, cloud), mergedRuns = mergeRuns(jget(RUNK, {}), cloudRuns);
        const r = await acc.cloudPut(payload(merged, C.rev + 1), C.rev); if (!r.ok) continue;
        setMeta({ uid: me.uid, rev: C.rev + 1, dirty: false }); st.at = Date.now();
        if (!same(local, merged)) { adopt(merged, mergedRuns, progressOf(local) ? 'merged' : 'restored'); return 'merged'; }
        jset(RUNK, mergedRuns); return 'merged';
      }
      st.err = 'busy'; return 'retry';
    } catch (e) {
      st.err = (e && (e.code || e.message)) || 'error'; return 'error';
    } finally { st.busy = false; emit(); }
  }
  const sync = () => running || (running = syncNow().finally(() => { running = null; }));

  function dirty() {                               // called by persist(): upload a few seconds after the last change
    setMeta({ dirty: true });
    if (!joined()) return;
    clearTimeout(upT); upT = setTimeout(sync, 4000);
  }
  function flushSoon() { if (meta().dirty && joined()) { clearTimeout(upT); sync(); } }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSoon(); });
    addEventListener('pagehide', flushSoon);
    addEventListener('online', () => { if (joined()) sync(); });
    // signing in, linking Google or switching profile on the account screen: pull that profile's save right away
    let lastUid = null;
    addEventListener('fth-acct', () => { const u = A ? A.state().uid : (window.FTH_ACCT && FTH_ACCT.state().uid); if (u && u !== lastUid) { lastUid = u; if (!A && window.FTH_ACCT) A = FTH_ACCT; sync(); } });
    // at start: a player who has joined syncs once the page is up
    addEventListener('load', () => { if (joined()) setTimeout(sync, 600); });
  }
  const note = () => { try { const n = sessionStorage.getItem('fth-cloud-note'); sessionStorage.removeItem('fth-cloud-note'); return n; } catch (e) { return null; } };
  window.FTH_CLOUD = { merge, mergeRuns, progressOf, sync, dirty, state, note };
})();
