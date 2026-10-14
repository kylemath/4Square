/* rimstar.js: the star rim HUD (window.FTH_RIMSTAR), drawn by the shell (index.html) for every skin, from its own state.
 *
 * The 5 rim tiles are the points of a five-pointed star, in rim order round the hole (turned to match the map's drawing).
 * The trouble spot (the element on two rim tiles one apart, rim.js) is a star edge: drawn thick in --sk-accent, its two
 * tiles ringed. The edges it has sat on this level stay brighter (its path), the rest of the star is faint. A lock badge
 * (one or two padlocks) says how many of Kempe's two rim chains are blocked; at a double lock a faint dashed arrow shows
 * where π (the forced swap, which never wins) would move the spot. When a move shifts the spot the edge swings to its new
 * place (π: it pivots on the shared tile, two rim places = one star step). Every hop on a 4-element 5-rim level, shown
 * or not, is a 'star_hop' research event (from, to, π or not, run = π swaps in a row, hud = whether it was on screen).
 *
 * Shown on levels whose tools include 'pi' (the π island, Level 7.1 on) with a rim of 5 and 4 elements; ?rimstar=1 shows
 * it on every such level, ?rimstar=0 never. A tap folds it to a small star button (and back); remembered per device
 * (localStorage 'fth-rimstar'). Honours prefers-reduced-motion (no swing, no pops).
 *
 *   const S = FTH_RIMSTAR.create(el, { gem(x, y, r, e, k) -> svg, log(type, data), reduced });
 *   S.update({ level, graph, col, won, moves, skin });     // after every change (cheap when nothing changed)
 *   S.state()                                              // { on, shown, star, status, hops, last } (tests)
 */
(function () {
  'use strict';
  const RIM = window.FTH_RIM, KEY = 'fth-rimstar';
  const Q = new URLSearchParams(location.search).get('rimstar');
  const css = `
  .rimstar { flex: none; display: none; align-items: center; justify-content: center; height: 38px; min-width: 38px; padding: 0 3px; border-radius: 999px;
    background: rgba(18,22,70,.55); border: 3px solid #fff; box-shadow: 0 3px 0 rgba(0,0,0,.2); color: #fff; cursor: pointer; font: inherit; -webkit-tap-highlight-color: transparent; }
  .rimstar.on { display: inline-flex; }
  .rimstar svg { height: 34px; width: auto; display: block; overflow: visible; }
  .rimstar:focus-visible { outline: 3px solid var(--sk-accent, #ffd84a); outline-offset: 2px; }
  .rimstar .rs-star { fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linejoin: round; opacity: .4; }
  .rimstar .rs-trail { stroke: currentColor; stroke-width: 3.4; stroke-linecap: round; opacity: .6; }
  .rimstar .rs-hot0 { stroke: #1c1640; stroke-width: 11; stroke-linecap: round; opacity: .7; }
  .rimstar .rs-hot { stroke: var(--sk-accent, #ffd84a); stroke-width: 7; stroke-linecap: round; }
  .rimstar .rs-ring { fill: none; stroke: var(--sk-accent, #ffd84a); stroke-width: 4; }
  .rimstar .rs-pi, .rimstar .rs-pia { fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; opacity: .8; }
  .rimstar .rs-pi { stroke-dasharray: 4.5 4; } .rimstar .rs-pia { fill: currentColor; stroke-width: 1.5; }
  .rimstar .rs-lock rect, .rimstar .rs-lock path { stroke: #1c1640; stroke-width: 2; }
  .rimstar .rs-lock rect { fill: var(--sk-accent, #ffd84a); } .rimstar .rs-lock path { fill: none; stroke: currentColor; stroke-width: 3.2; }
  .rimstar.filled .rs-hot, .rimstar.filled .rs-hot0 { opacity: 0; }
  .rimstar.fold { min-width: 0; width: 30px; height: 30px; padding: 0; opacity: .75; }
  .rimstar.fold svg { height: 20px; }
  .rimstar.fold .rs-pt, .rimstar.fold .rs-hot, .rimstar.fold .rs-hot0, .rimstar.fold .rs-ring, .rimstar.fold .rs-pi, .rimstar.fold .rs-pia, .rimstar.fold .rs-lock, .rimstar.fold .rs-trail { display: none; }
  .rimstar.fold .rs-star { opacity: .9; stroke-width: 7; }
  .rimstar.hop { animation: rsHop .5s cubic-bezier(.3, 1.7, .5, 1); }
  .rimstar.hop .rs-ring { animation: rsRing .5s ease-out; transform-box: fill-box; transform-origin: center; }
  @keyframes rsHop { 35% { transform: scale(1.16) rotate(-4deg); } }
  @keyframes rsRing { 0% { transform: scale(1.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  body:not([data-skin="islands"]) .rimstar { background: var(--sk-chip, var(--sk-card)); color: var(--sk-chip-ink, var(--sk-card-ink)); border-color: var(--sk-edge, color-mix(in srgb, var(--sk-card-ink) 28%, transparent)); }
  #game.hud-compact .stats { justify-content: flex-start; }
  #game.hud-compact .rimstar { order: 2; }
  #game.hud-minimal .rimstar { pointer-events: auto; }
  @media (max-width: 374px) { #game.hud-full .goalbar svg { height: 27px; } #game.hud-full .stats { gap: 5px; padding-left: 8px; padding-right: 8px; } }
  @media (prefers-reduced-motion: reduce) { .rimstar, .rimstar * { animation: none !important; transition: none !important; } }`;
  const ROT = 34, GR = 12.5;                         // star radius and gem radius, viewBox units
  const lsGet = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const lsSet = v => { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: not remembered */ } };
  const NAMES = ['fire', 'water', 'air', 'earth'];
  const ease = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };   // easeOutBack
  function padlock(x, y, s) {
    return '<g class="rs-lock" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-5 -2V-7a5 5 0 0 1 10 0V-2"/><rect x="-8" y="-3" width="16" height="13" rx="3"/></g>';
  }
  function create(el, o) {
    o = o || {};
    if (!document.getElementById('rimstarCss')) { const st = document.createElement('style'); st.id = 'rimstarCss'; st.textContent = css; document.head.appendChild(st); }
    el.classList.add('rimstar'); el.setAttribute('type', 'button');
    let G = null, gkey = '', P = null, cur = null, prev = null, lvl = '', key = '', fold = lsGet() === 'off', on = false, hops = 0, run = 0, trail = new Set(), last = null, raf = 0, pcs = '', pmoves = 0;
    let hot = null, hot0 = null;
    el.addEventListener('click', () => { fold = !fold; lsSet(fold ? 'off' : 'on'); draw(); if (o.log) o.log('star_fold', { fold }); });
    // point i of the star: rim tile link[i], spaced evenly but turned and wound like the map's drawing (pos round the hole)
    function points(Gr) {
      const L = Gr.link, h = Gr.pos && Gr.pos[Gr.hole], ang = L.map(x => h && Gr.pos[x] ? Math.atan2(Gr.pos[x][1] - h[1], Gr.pos[x][0] - h[0]) : NaN);
      let dir = 1, a0 = -Math.PI / 2;
      if (ang.every(isFinite)) {
        let s = 0; for (let i = 0; i < 5; i++) { let d = ang[(i + 1) % 5] - ang[i]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; s += d; }
        dir = s >= 0 ? 1 : -1;
        let cx = 0, cy = 0; for (let i = 0; i < 5; i++) { cx += Math.cos(ang[i] - dir * i * 2 * Math.PI / 5); cy += Math.sin(ang[i] - dir * i * 2 * Math.PI / 5); }
        a0 = Math.atan2(cy, cx);
      }
      return [0, 1, 2, 3, 4].map(i => { const a = a0 + dir * i * 2 * Math.PI / 5; return [+(ROT * Math.cos(a)).toFixed(2), +(ROT * Math.sin(a)).toFixed(2)]; });
    }
    const gem = (x, y, e, k) => { try { const s = o.gem && o.gem(x, y, GR, e, k); if (typeof s === 'string' && s) return s; } catch (_) { /* the skin's art failed */ } return '<circle cx="' + x + '" cy="' + y + '" r="' + GR * .8 + '" fill="' + ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'][e] + '" stroke="#1c1640" stroke-width="2"/>'; };
    function label(R) {
      if (R.status === 'filled') return 'Rim star: the hole can be filled';
      if (!R.trouble || R.trouble === 'none') return 'Rim star';
      const p = R.trouble.pos.map(i => i + 1);
      return 'Rim star: ' + NAMES[R.alpha] + ' twice on the rim, tiles ' + p[0] + ' and ' + p[1] + '; star point ' + (R.star + 1) + ' of 5; ' +
        (R.status === 'double' ? 'double lock: the forced swap moves it two places' : R.status === 'single' ? 'one lock' : 'no lock') + (fold ? ' (folded: tap to show)' : ' (tap to fold)');
    }
    function edge(t) { const a = P[t], b = P[(t + 2) % 5]; return [a[0], a[1], b[0], b[1]]; }
    function setHot(c) { [hot0, hot].forEach(l => { l.setAttribute('x1', c[0]); l.setAttribute('y1', c[1]); l.setAttribute('x2', c[2]); l.setAttribute('y2', c[3]); }); }
    function draw(fromT) {
      const R = cur; cancelAnimationFrame(raf);
      el.classList.toggle('on', on); el.classList.toggle('fold', fold); el.setAttribute('aria-pressed', fold ? 'false' : 'true');
      if (!on || !R) { el.innerHTML = ''; return; }
      el.classList.toggle('filled', R.status === 'filled');
      el.dataset.star = R.star; el.dataset.status = R.status; el.dataset.hops = hops;
      el.setAttribute('aria-label', label(R)); el.title = 'Rim star';
      const ok = R.star >= 0;
      let s = '<svg viewBox="-50 -48 108 96" aria-hidden="true"><path class="rs-star" d="M' + RIM.PATH.map(i => P[i].join(' ')).join('L') + 'Z"/>';
      trail.forEach(t => { const c = edge(t); s += '<line class="rs-trail" x1="' + c[0] + '" y1="' + c[1] + '" x2="' + c[2] + '" y2="' + c[3] + '"/>'; });
      s += '<line class="rs-hot0"/><line class="rs-hot"/>';
      if (ok && R.pi) {                               // π: x2 (rim t+2) gives way to x3 (rim t+3); a faint dashed arrow round the outside
        const a = P[(R.star + 2) % 5], b = P[(R.star + 3) % 5], sg = a[0] * b[1] - a[1] * b[0] > 0 ? 1 : -1, RA = ROT + GR - 1, d = .26, f = v => v.toFixed(1);
        const t0 = Math.atan2(a[1], a[0]) + sg * d, t1 = Math.atan2(b[1], b[0]) - sg * d, at = t => [RA * Math.cos(t), RA * Math.sin(t)];
        const p0 = at(t0), p1 = at(t1), tg = [-Math.sin(t1) * sg, Math.cos(t1) * sg], nr = [Math.cos(t1), Math.sin(t1)], H = 4.5;
        s += '<path class="rs-pi" d="M' + p0.map(f).join(' ') + 'A' + RA + ' ' + RA + ' 0 0 ' + (sg > 0 ? 1 : 0) + ' ' + p1.map(f).join(' ') + '"/>' +
          '<path class="rs-pia" d="M' + f(p1[0] + tg[0] * H) + ' ' + f(p1[1] + tg[1] * H) + 'L' + f(p1[0] + nr[0] * H - tg[0] * 2) + ' ' + f(p1[1] + nr[1] * H - tg[1] * 2) + 'L' + f(p1[0] - nr[0] * H - tg[0] * 2) + ' ' + f(p1[1] - nr[1] * H - tg[1] * 2) + 'Z"/>';
      }
      for (let i = 0; i < 5; i++) s += '<g class="rs-pt">' + gem(P[i][0], P[i][1], R.cols[i], 'rs' + i) + '</g>';
      if (ok) R.trouble.pos.forEach(i => { s += '<circle class="rs-ring" cx="' + P[i][0] + '" cy="' + P[i][1] + '" r="' + (GR + 3) + '"/>'; });
      if (R.lock === 1) s += padlock(48, 36, .9);
      if (R.lock === 2) s += padlock(40, 38, .85) + padlock(52, 32, .85);
      el.innerHTML = s + '</svg>';
      hot = el.querySelector('.rs-hot'); hot0 = el.querySelector('.rs-hot0');
      if (!ok) { hot.style.display = hot0.style.display = 'none'; return; }
      const to = edge(R.star);
      if (fromT == null || fromT < 0 || o.reduced || fold) { setHot(to); return; }
      // the hop: the edge's ends travel to the new edge's ends (π shares one tile, so it pivots there)
      let from = edge(fromT); const sw = [from[2], from[3], from[0], from[1]], dd = c => Math.hypot(c[0] - to[0], c[1] - to[1]) + Math.hypot(c[2] - to[2], c[3] - to[3]);
      if (dd(sw) < dd(from)) from = sw;
      const t0 = performance.now(), D = 520;
      const step = now => { const k = Math.min(1, (now - t0) / D), e = ease(k); setHot(from.map((v, i) => v + (to[i] - v) * e)); if (k < 1) raf = requestAnimationFrame(step); };
      setHot(from); raf = requestAnimationFrame(step);
      el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
    }
    function update(c) {
      const Gr = c.graph, L = c.level; if (!Gr || !L || !c.col) return;
      if (Gr !== gkey) { gkey = Gr; G = RIM.graph(Gr); P = points(Gr); }
      const want = Q === '0' ? false : (Q === '1' || (L.tools || []).includes('pi')) && G.ncol === 4 && G.link.length === 5;
      const k = L.id + '|' + RIM.canon(G, c.col) + '|' + (c.won ? 1 : 0) + '|' + (c.skin || '') + '|' + want;
      if (k === key) return; key = k;
      const newLvl = L.id !== lvl || !c.moves, cs = RIM.canon(G, c.col); lvl = L.id; on = want;
      prev = cur; cur = RIM.analyse(G, c.col);
      if (newLvl || !prev) { trail = new Set(); hops = 0; run = 0; last = null; prev = null; }
      if (cur.star >= 0) trail.add(cur.star);
      let fromT = null;
      if (prev && cs !== pcs) {                        // a move (or an undo): run counts π swaps in a row, the treadmill
        const pi = !!(prev.pi && RIM.canon(G, prev.pi.col) === cs), back = c.moves < pmoves;
        run = pi && !back ? run + 1 : 0;
        if (cur.star >= 0 && prev.star >= 0 && cur.star !== prev.star) {
          hops++; fromT = prev.star;
          last = { from: prev.star, to: cur.star, d: (cur.star - prev.star + 5) % 5, pi, back, was: prev.status, lock: cur.lock, run };
          if (o.log && G.ncol === 4 && G.link.length === 5) o.log('star_hop', { hud: on && !fold, lvl: L.id, map: L.g, skin: c.skin || '', from: prev.star, to: cur.star, d: last.d, pi, back, was: prev.status, now: cur.status, run, moves: c.moves, state: cs });
        }
      }
      pcs = cs; pmoves = c.moves;
      draw(fromT);
    }
    return { update, state: () => ({ on, shown: on && !fold, fold, star: cur ? cur.star : -1, status: cur ? cur.status : '', lock: cur ? cur.lock : 0, hops, run, last, trail: [...trail] }),
      fold: v => { fold = !!v; lsSet(fold ? 'off' : 'on'); draw(); } };
  }
  window.FTH_RIMSTAR = { create };
})();
