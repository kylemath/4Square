/* account.js: identity + leaderboard data for 4square. DOM-free; loaded lazily (integrity.js loadAccount() or the
 * trophy button). Needs verify.js and integrity.js (both small, loaded by index.html) and account-config.js.
 *
 * Two adapters behind one small interface, so the whole flow works with no backend:
 *   LOCAL    (window.FTH_FIREBASE == null)  a random player id in localStorage, boards stored on this device only.
 *   FIREBASE (config pasted in account-config.js)  Anonymous auth + Google linking + Firestore. See ACCOUNTS.md.
 *
 *   auth  = { init(): Promise<user|null>, onChange(cb), signInAnon(): Promise<user>, linkGoogle(): Promise<{status, user?, credential?}>,
 *             useCredential(cred): Promise<user>, signOut(): Promise<void>, hasGoogle: bool, note: string }
 *     user = { uid, anon: bool, linked: bool }
 *   store = { putPlayer(uid, doc), getEntry(skin, uid), putEntry(skin, uid, entry, runs: {lvl: proof}),
 *             board(skin, n): Promise<[{uid, ...entry}]>, deleteMine(uid, skins): Promise<void> }
 *
 * What a player has is derived from the verified proofs FTH_RUN keeps on the device ('fth-runs'), never from the
 * progress save: entry totals are recomputed from the proofs by anyone who reads them (see verifyEntry).
 */
(function () {
  'use strict';
  const V = window.FTH_VERIFY, R = window.FTH_RUN;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const jget = (k, d) => { try { const x = JSON.parse(ls.get(k)); return x == null ? d : x; } catch (e) { return d; } };
  const jset = (k, v) => ls.set(k, JSON.stringify(v));
  const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8);
  const SUBK = 'fth-acct', QK = 'fth-acct-q', LOCALK = 'fth-acct-local', BOARDK = 'fth-board-local', SENTK = 'fth-acct-sent', NICKK = 'fth-acct-nick';
  const MAX_POINTS_PER_LEVEL = 6000, TOP_N = 50;

  // ---------------------------------------------------------------- nickname
  const BAD = ['fuck', 'shit', 'cunt', 'bitch', 'dick', 'cock', 'pussy', 'whore', 'slut', 'nazi', 'hitler', 'rape', 'nigg', 'fagg', 'retard', 'porn', 'penis', 'vagina', 'anal', 'kkk', 'admin', 'moderator', 'official', 'kylemath'];
  const LOOK = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g', '+': 't', '€': 'e', 'ı': 'i', 'ø': 'o', 'ß': 'ss' };
  function validateNick(raw) {
    const nick = String(raw == null ? '' : raw).normalize('NFKC').replace(/\s+/g, ' ').trim();
    if (nick.length < 3 || nick.length > 16) return { ok: false, why: 'Use 3 to 16 characters.' };
    if (!/^[A-Za-z0-9][A-Za-z0-9 _.\-]*$/.test(nick)) return { ok: false, why: 'Letters, numbers, spaces, _ . - only, starting with a letter or number.' };
    const flat = nick.toLowerCase().split('').map(ch => LOOK[ch] || ch).join('').replace(/[^a-z]/g, '');
    const squash = flat.replace(/(.)\1+/g, '$1');                       // "fuuuck" -> "fuck"
    if (BAD.some(b => flat.includes(b) || squash.includes(b))) return { ok: false, why: 'Please pick a different name.' };
    if (/^(player|you|me)$/i.test(nick)) return { ok: false, why: 'Please pick a more personal name.' };
    return { ok: true, nick };
  }
  const ADJ = ['Brave', 'Quiet', 'Swift', 'Sunny', 'Clever', 'Gentle', 'Lucky', 'Mellow', 'Bold', 'Merry', 'Plucky', 'Calm'];
  const ANI = ['Otter', 'Fox', 'Heron', 'Newt', 'Lynx', 'Wren', 'Seal', 'Finch', 'Hare', 'Ibis', 'Koala', 'Moth'];
  const randomNick = () => ADJ[Math.random() * ADJ.length | 0] + ' ' + ANI[Math.random() * ANI.length | 0] + ' ' + (10 + Math.random() * 90 | 0);

  // ---------------------------------------------------------------- local adapter
  function localAdapter() {
    const subs = [];
    const cur = () => jget(LOCALK, null);
    const emit = () => subs.forEach(f => { try { f(cur() ? { uid: cur().uid, anon: true, linked: false } : null); } catch (e) {} });
    const boards = () => jget(BOARDK, {});
    return {
      kind: 'local', hasGoogle: false, note: 'Google sign-in needs the Firebase setup in ACCOUNTS.md. Until then you play as a local player on this device.',
      auth: {
        init: async () => cur() ? { uid: cur().uid, anon: true, linked: false } : null,
        onChange: f => subs.push(f),
        signInAnon: async () => { if (!cur()) { jset(LOCALK, { uid: 'L' + rid(), createdAt: Date.now() }); } emit(); return { uid: cur().uid, anon: true, linked: false }; },
        linkGoogle: async () => ({ status: 'unavailable' }),
        useCredential: async () => { throw new Error('unavailable'); },
        signOut: async () => { ls.del(LOCALK); emit(); },
      },
      store: {
        putPlayer: async () => {},
        getPlayer: async () => null,
        getEntry: async (skin, uid) => (boards()[skin] || {})[uid] || null,
        putEntry: async (skin, uid, entry) => { const b = boards(); (b[skin] = b[skin] || {})[uid] = Object.assign({}, entry, { updatedAt: Date.now() }); jset(BOARDK, b); },
        board: async (skin, n) => Object.entries(boards()[skin] || {}).map(([uid, e]) => Object.assign({ uid }, e)).sort(order).slice(0, n || TOP_N),
        top: async (skin, n) => Object.entries(boards()[skin] || {}).map(([uid, e]) => Object.assign({ uid }, e)).filter(e => e.coins > 0).sort(byCoins).slice(0, n || 12),
        deleteMine: async (uid, skins) => { const b = boards(); skins.forEach(s => { if (b[s]) delete b[s][uid]; }); jset(BOARDK, b); },
      },
    };
  }
  const byCoins = (a, b) => ((b.coins || 0) - (a.coins || 0)) || ((a.updatedAt || 0) - (b.updatedAt || 0));
  const order = (a, b) => (b.stars - a.stars) || (b.levels - a.levels) || (b.pars - a.pars) || (b.points - a.points) || ((a.updatedAt || 0) - (b.updatedAt || 0));

  // ---------------------------------------------------------------- firebase adapter (sdk injected so it can be mocked)
  const FB_VER = '10.12.2';
  // Firestore cannot hold arrays inside arrays: ops [['s',t,col]] and int [[kind,n,ms]] travel as strings
  const packP = p => Object.assign({}, p, { ops: p.ops.map(o => o.join('|')), int: (p.int || []).map(x => x.join(':')) });
  const unpackP = p => Object.assign({}, p, { ops: (p.ops || []).map(o => { const [t, d, c] = String(o).split('|'); return [t, +d, c]; }), int: (p.int || []).map(x => { const a = String(x).split(':'); return [a[0], ...a.slice(1).map(Number)]; }) });
  const mapP = (pr, f) => { const o = {}; Object.keys(pr || {}).forEach(l => { o[l] = f(pr[l]); }); return o; };
  const unpackEntry = e => e && Object.assign({}, e, { pr: mapP(e.pr, unpackP) });
  async function loadFirebaseSdk() {
    const base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
    const [app, auth, fs] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
    return { app, auth, fs };
  }
  function firebaseAdapter(sdk, cfg) {
    const app = sdk.app.initializeApp(cfg), A = sdk.auth, F = sdk.fs, auth = A.getAuth(app), db = F.getFirestore(app);
    const toUser = u => u ? { uid: u.uid, anon: !!u.isAnonymous, linked: !u.isAnonymous && u.providerData.some(p => p.providerId === 'google.com') } : null;
    const ts = x => x && typeof x.toMillis === 'function' ? x.toMillis() : x;
    const redirectKey = 'fth-acct-redirect';
    return {
      kind: 'firebase', hasGoogle: true, note: '',
      auth: {
        init: async () => {
          try { const r = await A.getRedirectResult(auth); if (r && r.user) ls.set(redirectKey, 'done'); } catch (e) { if (e && e.code === 'auth/credential-already-in-use') ls.set('fth-acct-inuse', 'yes'); }
          await (auth.authStateReady ? auth.authStateReady() : Promise.resolve());
          return toUser(auth.currentUser);
        },
        onChange: f => A.onAuthStateChanged(auth, u => f(toUser(u))),
        signInAnon: async () => toUser((await A.signInAnonymously(auth)).user),
        linkGoogle: async () => {
          const prov = new A.GoogleAuthProvider(), u = auth.currentUser;
          try {
            if (!u) return { status: 'ok', user: toUser((await A.signInWithPopup(auth, prov)).user) };
            return { status: 'ok', user: toUser((await A.linkWithPopup(u, prov)).user) };
          } catch (e) {
            const c = e && e.code;
            if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') { await A.linkWithRedirect(u, prov); return { status: 'redirect' }; }
            if (c === 'auth/credential-already-in-use' || c === 'auth/email-already-in-use') return { status: 'in-use', credential: A.GoogleAuthProvider.credentialFromError(e) };
            if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return { status: 'cancelled' };
            throw e;
          }
        },
        useCredential: async cred => toUser((await A.signInWithCredential(auth, cred)).user),
        signOut: async () => { await A.signOut(auth); },
      },
      store: {
        getPlayer: async uid => { const d = await F.getDoc(F.doc(db, 'players', uid)); return d.exists() ? d.data() : null; },
        putPlayer: async (uid, doc) => { await F.setDoc(F.doc(db, 'players', uid), Object.assign({}, doc, { createdAt: F.serverTimestamp() }), { merge: true }); },
        getEntry: async (skin, uid) => { const s = await F.getDoc(F.doc(db, 'boards', skin, 'entries', uid)); return s.exists() ? unpackEntry(s.data()) : null; },
        putEntry: async (skin, uid, entry, runs) => {
          const b = F.writeBatch(db), t = F.serverTimestamp();
          b.set(F.doc(db, 'boards', skin, 'entries', uid), Object.assign({}, entry, { pr: mapP(entry.pr, packP), updatedAt: t }));
          Object.keys(runs).forEach(lvl => b.set(F.doc(db, 'runs', uid + '_' + lvl + '_' + skin), Object.assign({}, packP(runs[lvl]), { uid, at: t })));
          await b.commit();
        },
        board: async (skin, n) => {
          const q = F.query(F.collection(db, 'boards', skin, 'entries'), F.orderBy('stars', 'desc'), F.orderBy('levels', 'desc'), F.orderBy('points', 'desc'), F.limit(n || TOP_N));
          return (await F.getDocs(q)).docs.map(d => Object.assign({ uid: d.id }, unpackEntry(d.data()), { updatedAt: ts(d.data().updatedAt) }));
        },
        top: async (skin, n) => {
          const q = F.query(F.collection(db, 'boards', skin, 'entries'), F.orderBy('coins', 'desc'), F.limit(n || 12));
          return (await F.getDocs(q)).docs.map(d => Object.assign({ uid: d.id }, unpackEntry(d.data()), { updatedAt: ts(d.data().updatedAt) }));
        },
        deleteMine: async (uid, skins) => {
          for (const s of skins) {
            const e = await F.getDoc(F.doc(db, 'boards', s, 'entries', uid));
            if (e.exists()) { const b = F.writeBatch(db); Object.keys(e.data().pr || {}).forEach(l => b.delete(F.doc(db, 'runs', uid + '_' + l + '_' + s))); b.delete(e.ref); await b.commit(); }
          }
          await F.deleteDoc(F.doc(db, 'players', uid));
        },
      },
    };
  }

  // ---------------------------------------------------------------- state
  let AD = null, user = null, ready = null, lastErr = '', flushing = null, retryT = 0;
  const prefs = () => jget(SUBK, { on: false, submit: false });
  const setPrefs = o => { jset(SUBK, Object.assign(prefs(), o)); changed(); };
  const nick = () => ls.get(NICKK + (user ? ':' + user.uid : '')) || ls.get(NICKK) || '';
  const changed = () => { try { dispatchEvent(new CustomEvent('fth-acct')); } catch (e) {} };
  const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;
  function skinIds() { const a = (window.FTH_SKINS && FTH_SKINS.list || []).map(s => s.id); Object.keys(R.store()).forEach(s => { if (!a.includes(s)) a.push(s); }); return a; }

  function init() {
    if (ready) return ready;
    ready = (async () => {
      const cfg = window.FTH_FIREBASE;
      try {
        if (cfg && cfg.apiKey) AD = firebaseAdapter(window.FTH_SDK_OVERRIDE || await loadFirebaseSdk(), cfg);
      } catch (e) { lastErr = 'Could not start the online service; using this device only.'; AD = null; }
      if (!AD) AD = localAdapter();
      try { user = await AD.auth.init(); await adoptNick(); } catch (e) { lastErr = 'Sign-in is not available right now.'; user = null; }
      AD.auth.onChange(u => { user = u; changed(); });
      addEventListener('online', () => flush());
      if (user && prefs().submit) flush();
      return api;
    })();
    return ready;
  }

  async function ensureIdentity() {
    await init();
    if (!user) user = await AD.auth.signInAnon();
    if (!nick()) setNick(randomNick(), true);
    setPrefs({ on: true });
    return user;
  }
  function setNick(n, force) {
    const v = validateNick(n); if (!v.ok && !force) return v;
    const nk = v.ok ? v.nick : String(n);
    ls.set(NICKK, nk); if (user) ls.set(NICKK + ':' + user.uid, nk);
    markDirty(skinIds()); changed(); if (prefs().submit) flush();
    return { ok: true, nick: nk };
  }
  // a Google profile carries its nickname across devices: players/{uid}.nick (owner-only) wins over this device's random one
  async function adoptNick() {
    if (!user || user.anon || ls.get(NICKK + ':' + user.uid)) return;
    try { const p = await AD.store.getPlayer(user.uid); if (p && p.nick && validateNick(p.nick).ok) { ls.set(NICKK + ':' + user.uid, p.nick); ls.set(NICKK, p.nick); changed(); } } catch (e) {}
  }
  async function linkGoogle() {
    await ensureIdentity(); const r = await AD.auth.linkGoogle();
    if (r.status === 'ok') { user = r.user; await adoptNick(); try { await AD.store.putPlayer(user.uid, { nick: nick(), linked: true }); } catch (e) {} changed(); }
    return r;
  }
  async function useCredential(cred) { user = await AD.auth.useCredential(cred); await adoptNick(); if (!nick()) setNick(randomNick(), true); markDirty(skinIds()); changed(); if (prefs().submit) flush(); return user; }
  async function signOut() { await init(); await AD.auth.signOut(); user = null; setPrefs({ submit: false }); changed(); }
  async function deleteMine() {
    await init(); if (!user) return 0;
    await AD.store.deleteMine(user.uid, skinIds());
    const sent = jget(SENTK, {}); Object.keys(sent).forEach(k => { if (k.startsWith(user.uid + '/')) delete sent[k]; }); jset(SENTK, sent);
    jset(QK, {}); setPrefs({ submit: false }); changed(); return 1;
  }

  // ---------------------------------------------------------------- entries from the proof store
  const dirty = () => jget(QK, {});
  function markDirty(skins) { const q = dirty(); skins.forEach(s => { q[s] = q[s] || { tries: 0 }; }); jset(QK, q); }
  const intSummary = () => ({ tamper: (window.FTH_INT && FTH_INT.meta().tamper) || 0, sig: window.FTH_INT ? FTH_INT.counts() : {} });
  // totals are always recomputed from the proofs (pr)
  function totals(pr) {
    let stars = 0, levels = 0, pars = 0, points = 0;
    Object.keys(pr).forEach(l => { const c = pr[l].claim; levels++; stars += c.stars; if (c.stars === 3) pars++; points += Math.min(c.pts || 0, MAX_POINTS_PER_LEVEL); });
    return { stars, levels, pars, points };
  }
  function mergePr(local, remote) {
    const out = Object.assign({}, remote || {});
    Object.keys(local).forEach(l => { const a = local[l], b = out[l];
      if (!b || a.claim.stars > b.claim.stars || (a.claim.stars === b.claim.stars && a.claim.moves < b.claim.moves)) out[l] = Object.assign({}, a, { claim: Object.assign({}, a.claim, { pts: Math.max(a.claim.pts || 0, b ? b.claim.pts || 0 : 0) }) });
      else out[l] = Object.assign({}, b, { claim: Object.assign({}, b.claim, { pts: Math.max(a.claim.pts || 0, b.claim.pts || 0) }) });
    });
    return out;
  }
  async function flush() {
    if (flushing) return flushing;
    flushing = (async () => {
      await init(); const p = prefs();
      if (!user || !p.submit) return { sent: 0 };
      const q = dirty(), st = R.store(), done = [];
      // anything in the device store that was never sent is dirty
      const sent = jget(SENTK, {});
      Object.keys(st).forEach(s => Object.keys(st[s]).forEach(l => { if (sent[user.uid + '/' + s + '/' + l] !== st[s][l].p.fp + ':' + st[s][l].pts) q[s] = q[s] || { tries: 0 }; }));
      skinIds().forEach(s => { if (earned(s) > 0 && sent[user.uid + '/' + s + '/#coins'] !== earned(s)) q[s] = q[s] || { tries: 0 }; });
      let fail = 0;
      for (const skin of Object.keys(q)) {
        const local = {}; Object.keys(st[skin] || {}).forEach(l => { local[l] = JSON.parse(JSON.stringify(st[skin][l].p)); local[l].claim.pts = st[skin][l].pts; });
        if (!Object.keys(local).length && !earned(skin)) { done.push(skin); continue; }
        if (!online()) { fail++; continue; }
        try {
          const old = await AD.store.getEntry(skin, user.uid);
          const pr = mergePr(local, old && old.pr), t = totals(pr), changedRuns = {};
          Object.keys(pr).forEach(l => { if (sent[user.uid + '/' + skin + '/' + l] !== pr[l].fp + ':' + pr[l].claim.pts) changedRuns[l] = pr[l]; });
          await AD.store.putPlayer(user.uid, { nick: nick(), linked: !!user.linked });
          const coins = Math.max(earned(skin), (old && old.coins) || 0);              // lifetime coins earned in this skin (never goes down)
          await AD.store.putEntry(skin, user.uid, Object.assign({ nick: nick(), v: 1, app: R.APP, pr, int: intSummary(), coins }, t), changedRuns);
          Object.keys(pr).forEach(l => { sent[user.uid + '/' + skin + '/' + l] = pr[l].fp + ':' + pr[l].claim.pts; });
          sent[user.uid + '/' + skin + '/#coins'] = earned(skin);
          done.push(skin);
        } catch (e) { fail++; q[skin].tries = (q[skin].tries || 0) + 1; q[skin].err = String(e && (e.code || e.message)).slice(0, 60); lastErr = 'Could not send your score yet (' + q[skin].err + '). It will retry.'; }
      }
      done.forEach(s => delete q[s]); jset(QK, q); jset(SENTK, sent);
      if (fail) { clearTimeout(retryT); const tries = Math.max(...Object.values(q).map(x => x.tries || 0), 0); if (tries < 8) retryT = setTimeout(flush, Math.min(300e3, 5e3 * Math.pow(2, tries))); }
      else lastErr = '';
      changed(); return { sent: done.length, failed: fail };
    })().finally(() => { flushing = null; });
    return flushing;
  }

  // lifetime coins earned in a skin, from the game's wallet (index.html FTH_WALLET; 0 in node tests without one)
  const earned = s => (window.FTH_WALLET && FTH_WALLET.earned(s)) || 0;

  // ---------------------------------------------------------------- reading boards (everything re-verified)
  async function ensureCore() { if (window.LAB) return; await R.loadScripts(['lab/core.js']); }
  // verifyEntry(e): recompute stars/levels/pars/points from the proofs; returns { ok, why, stars, levels, pars, points }
  async function verifyEntry(e, seenFp) {
    await ensureCore(); const env = { GAME: window.GAME, LAB: window.LAB }, pr = e.pr || {}, good = {}, why = [];
    if (e.int && e.int.tamper > 0) why.push('flagged: edited save');
    for (const l of Object.keys(pr)) {
      const p = pr[l]; if (!p || p.lvl !== l) { why.push('bad proof ' + l); continue; }
      const r = V.verifyProof(p, env);
      if (!r.ok) { why.push(l + ': ' + r.hard.join(',')); continue; }
      const bad = (p.int || []).find(x => /^(illegal-swap|win-without-path|msg-untrusted-event|msg-state-inconsistent|score-display-mismatch)$/.test(x[0]));
      if (bad) { why.push(l + ': signal ' + bad[0]); continue; }
      if (seenFp && seenFp.has(r.fp) && seenFp.get(r.fp) !== e.uid) { why.push(l + ': copied proof'); continue; }
      good[l] = { claim: Object.assign({}, p.claim, { stars: r.stars, moves: r.moves }) };
    }
    const t = totals(good), same = ['stars', 'levels', 'pars', 'points'].every(k => t[k] === e[k]);
    if (!same && !why.length) why.push('numbers do not match proofs');
    return Object.assign({ ok: !why.length && t.levels > 0, why: why.join('; ') }, t);
  }
  // board(skin, scope): { rows: [ranked, verified], hidden: n, me: row|null }
  async function board(skin, scope, metric) {
    await init(); await ensureCore();
    let entries = [];
    if (scope === 'device' && AD.kind !== 'local') {          // online mode: this device's own best runs, as one row
      const st = R.store(), pr = {}; Object.keys(st[skin] || {}).forEach(l => { pr[l] = JSON.parse(JSON.stringify(st[skin][l].p)); pr[l].claim.pts = st[skin][l].pts; });
      entries = Object.keys(pr).length ? [Object.assign({ uid: user ? user.uid : 'device', nick: nick() || 'You', pr, int: intSummary() }, totals(pr))] : [];
    } else entries = scope === 'device' ? await AD.store.board(skin, 200) : await AD.store.board(skin, TOP_N * 2);
    // copied proofs: the earliest entry holding a fingerprint owns it
    const owner = new Map(); entries.slice().sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0)).forEach(e => Object.values(e.pr || {}).forEach(p => { if (p && p.fp && !owner.has(p.fp)) owner.set(p.fp, e.uid); }));
    const rows = []; let hidden = 0;
    for (const e of entries) {
      const v = await verifyEntry(e, owner);
      if (!v.ok) { hidden++; continue; }
      const me = !!user && e.uid === user.uid;
      rows.push({ uid: e.uid, nick: e.nick, stars: v.stars, levels: v.levels, pars: v.pars, points: v.points, coins: e.coins || 0, updatedAt: e.updatedAt, me, entry: e });
    }
    const M = api.metrics.find(m => m.id === metric);
    rows.sort(M && M.id !== 'stars' ? (a, b) => (M.of(b.entry) - M.of(a.entry)) || order(a, b) : order); rows.forEach((r, i) => { r.rank = i + 1; });
    return { rows: rows.slice(0, TOP_N), hidden, me: rows.find(r => r.me) || null, total: rows.length };
  }

  // ---------------------------------------------------------------- the podium: per skin, the top 3 by coins earned there
  // Coins are client state, so the replay cannot prove them. What it can do: an entry must pass verifyEntry (its levels
  // replay, no tamper flags), and its coins count only up to what those levels could plausibly pay: COIN_PTS points per
  // verified level (first wins pay up to 6000, replays a quarter: twice that is generous) at the skin's coin rate. Blank
  // Doodle (own: true) makes no proofs, so its cap counts every level. See ACCOUNTS.md.
  const COIN_PTS = 2 * MAX_POINTS_PER_LEVEL;
  function coinCap(skin, levels) {
    const k = (window.FTH_SKINS && FTH_SKINS.list || []).find(x => x.id === skin); if (!k || !FTH_SKINS.rate) return 0;
    const lv = k.own ? ((window.GAME && GAME.levels.length) || 64) : levels;
    return Math.ceil(FTH_SKINS.rate(k) * COIN_PTS * lv);
  }
  // podium(scope, n): [{ skin, top: [{rank, nick, coins, me}] (up to n, default 3), me: {rank, coins} | null, mine: coins on this device, hidden }]
  async function podium(scope, n) {
    await init(); await ensureCore();
    const list = (window.FTH_SKINS && FTH_SKINS.list || []).map(k => k.id), out = [];
    for (const skin of list) {
      const spec = FTH_SKINS.list.find(k => k.id === skin);
      let entries;
      if (scope === 'device' && AD.kind !== 'local') {          // online mode: this device's own row
        const st = R.store(), pr = {}; Object.keys(st[skin] || {}).forEach(l => { pr[l] = JSON.parse(JSON.stringify(st[skin][l].p)); pr[l].claim.pts = st[skin][l].pts; });
        entries = earned(skin) > 0 ? [Object.assign({ uid: user ? user.uid : 'device', nick: nick() || 'You', pr, int: intSummary(), coins: earned(skin) }, totals(pr))] : [];
      } else entries = await AD.store.top(skin, scope === 'device' ? 200 : 12);
      const owner = new Map(); entries.slice().sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0)).forEach(e => Object.values(e.pr || {}).forEach(p => { if (p && p.fp && !owner.has(p.fp)) owner.set(p.fp, e.uid); }));
      const rows = []; let hidden = 0;
      for (const e of entries) {
        let levels = 0;
        if (spec && spec.own && !Object.keys(e.pr || {}).length) { if (e.int && e.int.tamper > 0) { hidden++; continue; } }
        else { const v = await verifyEntry(e, owner); if (!v.ok) { hidden++; continue; } levels = v.levels; }
        const coins = Math.min(e.coins || 0, coinCap(skin, levels));
        if (coins > 0) rows.push({ uid: e.uid, nick: e.nick, coins, capped: coins < (e.coins || 0), me: !!user && e.uid === user.uid, updatedAt: e.updatedAt });
      }
      rows.sort(byCoins); rows.forEach((r, i) => { r.rank = i + 1; });
      const me = rows.find(r => r.me);
      out.push({ skin, top: rows.slice(0, n || 3), me: me ? { rank: me.rank, coins: me.coins } : null, mine: earned(skin), hidden });
    }
    return out;
  }

  const api = {
    podium, coinCap,
    init, ensureIdentity, setNick, validateNick, randomNick, linkGoogle, useCredential, signOut, deleteMine, flush, board, verifyEntry, totals,
    setSubmit(on) { setPrefs({ submit: !!on }); if (on) { markDirty(skinIds()); flush(); } },
    state() { return { kind: AD ? AD.kind : 'local', hasGoogle: !!(AD && AD.hasGoogle), note: AD ? AD.note : '', uid: user && user.uid, anon: !user || user.anon, linked: !!(user && user.linked), nick: nick(), submit: !!prefs().submit, signedIn: !!user, err: lastErr, queued: Object.keys(dirty()).length, online: online() }; },
    // future hook: a board can rank by another currency; register { id, label, of: entry -> number }
    // (coins earned per skin are on the podium instead: see podium() above)
    metrics: [{ id: 'stars', label: 'Stars', of: e => e.stars }],
    registerMetric(m) { if (!api.metrics.some(x => x.id === m.id)) api.metrics.push(m); },
    _adapters: { localAdapter, firebaseAdapter }, _setAdapter(a, u) { AD = a; user = u || null; ready = Promise.resolve(api); },
  };
  window.FTH_ACCT = api;
})();
