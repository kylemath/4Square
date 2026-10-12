/* telemetry.js: anonymous gameplay logging for "Fill the Hole".
 *
 * What is recorded (only after the player taps OK on the notice; nothing before, nothing if they decline):
 *   per level attempt: level number, map, par, start pattern, time stamps of every trace step, refused step,
 *   catch, swap (and refused swap), hint, the pattern reached after each swap and its distance to a win,
 *   the outcome (win / quit / restart), and the device class (phone/tablet/desktop), screen size, input type
 *   (touch / mouse / pen). No names, no accounts, no free text, no location. A random session id links the
 *   attempts of one browser session; a random player id (kept in this browser only) links sessions.
 *
 * Where it goes (any that are available; failures are silent):
 *   1. localStorage queue 'fth-logs' (always; capped), exportable with FTH_LOG.exportCSV() / the menu.
 *   2. the artifact's own database (claude.use("db")), under logs/<viewer id>/attempts/<attempt id>, when the page
 *      runs as a claude.ai artifact that declares the db capability and the viewer may write.
 *   3. a Google Form (set FTH_FORM below): one form response per attempt, the attempt as a JSON string in one field.
 *      Only works where the page may reach docs.google.com (e.g. the GitHub Pages copy; claude.ai artifacts block it).
 *
 * Related, separate from this file: integrity.js keeps an always-on, on-device integrity log and the run proofs for
 * leaderboards (see ACCOUNTS.md). It never changes what this research log records or its consent; its signals are
 * mirrored here (FTH_LOG.ev('integrity', ...)) only when consent is on.
 */
(function () {
  'use strict';
  // Fill these in to collect with a Google Form: the form's /formResponse URL and the entry id of a paragraph field.
  const FTH_FORM = { url: '', entry: '' };     // e.g. { url: 'https://docs.google.com/forms/d/e/<id>/formResponse', entry: 'entry.123456789' }
  const VERSION = 1, QKEY = 'fth-logs', CKEY = 'fth-telemetry', PKEY = 'fth-player';
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let player = ls.get(PKEY); if (!player) { player = rid(); ls.set(PKEY, player); }
  const session = rid();
  const device = () => {
    const w = screen.width, h = screen.height, touch = navigator.maxTouchPoints || 0, m = Math.min(w, h);
    return { cls: touch && m < 600 ? 'phone' : touch && m < 1100 ? 'tablet' : 'desktop', screen: w + 'x' + h, view: innerWidth + 'x' + innerHeight,
      dpr: +(devicePixelRatio || 1).toFixed(2), touch, lang: (navigator.language || '').slice(0, 5) };
  };
  let cur = null, inputs = {};
  const consent = () => ls.get(CKEY);          // 'on' | 'off' | null (not asked)

  // ---------- sinks ----------
  let dbP = null;
  async function db() {
    if (!window.claude || !window.claude.use) return null;
    if (!dbP) dbP = (async () => { try { const d = await window.claude.use('db'); const u = await window.claude.use('user'); const id = u && u.id ? await u.id() : null; return d && id ? { d, id } : null; } catch (e) { return null; } })();
    return dbP;
  }
  function queue(rec) {
    let q = []; try { q = JSON.parse(ls.get(QKEY) || '[]'); } catch (e) {}
    q.push(rec); if (q.length > 300) q = q.slice(-300); ls.set(QKEY, JSON.stringify(q));
  }
  async function send(rec) {
    queue(rec);
    try { const x = await db(); if (x) await x.d.collection('logs/' + x.id + '/attempts').doc(rec.attempt).set(rec); } catch (e) {}
    if (FTH_FORM.url && FTH_FORM.entry) {
      try {
        const body = new URLSearchParams(); body.append(FTH_FORM.entry, JSON.stringify(rec));
        await fetch(FTH_FORM.url, { method: 'POST', mode: 'no-cors', body });
      } catch (e) {}
    }
  }

  // ---------- API used by the game ----------
  const now = () => Math.round(performance.now() - cur.t0);
  window.FTH_LOG = {
    consent, setConsent(on) { ls.set(CKEY, on ? 'on' : 'off'); },
    input(type) { if (type) inputs[type] = (inputs[type] || 0) + 1; },
    start(level) {
      if (cur) this.end('abandoned');
      if (consent() !== 'on') { cur = null; return; }
      inputs = {};
      cur = { v: VERSION, player, session, attempt: rid(), level: level.num, levelId: level.id, skin: level.skin || 'islands', map: level.map, par: level.par, startState: level.state,
        startedAt: new Date().toISOString(), t0: performance.now(), device: device(), ev: [] };
    },
    ev(type, data) { if (!cur) return; cur.ev.push([now(), type, data || 0]); if (cur.ev.length >= 4000) this.end('truncated'); },
    end(outcome, data) {
      if (!cur) return; const rec = cur; cur = null;
      rec.outcome = outcome; rec.result = data || null; rec.ms = Math.round(performance.now() - rec.t0); rec.inputs = inputs;
      delete rec.t0; send(rec);
    },
    records() { try { return JSON.parse(ls.get(QKEY) || '[]'); } catch (e) { return []; } },
    exportCSV() {            // one row per event: attempt, level, outcome, t_ms, type, data
      const rows = [['player', 'session', 'attempt', 'level', 'map', 'device', 'outcome', 't_ms', 'event', 'data']];
      this.records().forEach(r => r.ev.forEach(([t, ty, d]) => rows.push([r.player, r.session, r.attempt, r.level, r.map, r.device && r.device.cls, r.outcome, t, ty, JSON.stringify(d)])));
      return rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    },
    clear() { ls.set(QKEY, '[]'); },
  };
  // flush an attempt in progress if the page goes away
  addEventListener('pagehide', () => { if (cur) window.FTH_LOG.end('left'); });
  addEventListener('pointerdown', e => window.FTH_LOG.input(e.pointerType), { capture: true, passive: true });
})();
