/* maps.js: the maps screen. A grid of every map (G.graphs) as a thumbnail of how much of its colouring space you have
 * charted, most recently played first. Played maps show a % charted ring and open a big view with their levels;
 * maps never played are greyed out with a "▶ 7.3" chip that starts their first level (🔒 while it is locked).
 * The thumbnails are drawn by the shell's own exploration-map renderer (index.html window.FTH_MAPVIEW.render), so they
 * look exactly like the in-game map in every skin. Styled with the skin's --sk-* tokens.   window.FTH_MAPS.open()
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EL = ['#ff6a45', '#4aa8ff', '#ffd84a', '#62d96a'];          // the four element colours (the logo's)
  const HEX = 'polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)';
  const CSS = `
#maps{position:fixed;inset:0;z-index:70;display:none;flex-direction:column;background:var(--sk-bg);color:var(--sk-ink,#fff);font-family:var(--sk-font,system-ui,sans-serif);padding:max(10px,env(safe-area-inset-top)) 14px max(12px,env(safe-area-inset-bottom));overflow:hidden}
#maps.on{display:flex}
#maps *{box-sizing:border-box}
#maps button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#maps .mp-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
#maps h2{margin:0;font-size:26px;font-weight:900;font-style:italic;flex:1;letter-spacing:.02em;text-shadow:0 3px 0 rgba(0,0,0,.18)}
#maps .mp-x{width:46px;height:46px;flex:none;border-radius:16px;border:0;background:#fff;color:#1c1640;font-size:20px;font-weight:900;box-shadow:0 5px 0 #8fa6c4,0 8px 14px rgba(0,0,0,.22)}
#maps .mp-x:active{transform:translateY(4px);box-shadow:0 1px 0 #8fa6c4}
#maps .mp-sum{display:flex;align-items:center;gap:6px;padding:6px 12px 6px 8px;border-radius:999px;background:rgba(0,0,0,.22);font-weight:900;font-size:15px;font-variant-numeric:tabular-nums}
#maps .mp-sum svg{width:24px;height:24px}
#maps .mp-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 2px 18px;margin:0 -2px}
#maps .mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px 12px}
#maps .mp-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 8px 10px;border-radius:var(--sk-radius,22px);border:3px solid var(--sk-edge,#1c1640);background:var(--sk-card);color:var(--sk-card-ink,#e6edf3);box-shadow:0 6px 0 rgba(0,0,0,.28),0 10px 18px rgba(0,0,0,.18);text-align:center;min-width:0}
#maps .mp-card:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.28)}
#maps .mp-hex{position:relative;width:100%;aspect-ratio:1/.866;clip-path:${HEX};background:var(--sk-edge,#fff)}
body[data-skin="islands"] #maps .mp-hex{background:#fff}
#maps .mp-hex canvas,#maps .mp-hex svg{position:absolute;inset:3px;width:calc(100% - 6px);height:calc(100% - 6px);clip-path:${HEX};background:var(--sk-bg-map,#05070a);display:block}
#maps .mp-nm{font-weight:900;font-size:14px;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-transform:capitalize}
#maps .mp-lv{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;font-size:12px;font-weight:800;opacity:.9}
#maps .mp-lv span{padding:1px 6px;border-radius:8px;background:color-mix(in srgb,var(--sk-card-ink,#fff) 12%,transparent)}
#maps .mp-lv span.b{background:color-mix(in srgb,var(--sk-accent,#ffd84a) 32%,transparent)}
#maps .mp-ring{position:absolute;top:-10px;right:-10px;width:50px;height:50px;filter:drop-shadow(0 3px 0 rgba(0,0,0,.3))}
#maps .mp-ring text{font-weight:900;font-family:inherit}
#maps .mp-pin{position:absolute;top:4px;left:6px;font-size:26px;z-index:1;filter:drop-shadow(0 3px 0 rgba(0,0,0,.3))}
#maps .mp-card.new .mp-hex{filter:grayscale(1) brightness(.7) contrast(.9)}
#maps .mp-card.new .mp-nm,#maps .mp-card.new .mp-lv{opacity:.55}
#maps .mp-chip{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) rotate(-4deg);display:flex;align-items:center;gap:4px;padding:5px 12px 5px 10px;border-radius:14px;font-weight:900;font-size:19px;font-style:italic;white-space:nowrap;border:3px solid #1c1640;background:linear-gradient(180deg,#ffe066,#ffab1a);color:#4a2a00;box-shadow:0 4px 0 #1c1640}
#maps .mp-chip.lock{background:linear-gradient(180deg,#d9dee6,#9aa3b2);color:#2a3140}
#maps .mp-card.new:not(.locked) .mp-chip{animation:mpbob 1.6s ease-in-out infinite}
@keyframes mpbob{0%,100%{transform:translate(-50%,-50%) rotate(-4deg)}50%{transform:translate(-50%,-62%) rotate(-4deg) scale(1.06)}}
#maps .mp-sec{grid-column:1/-1;display:flex;align-items:center;gap:8px;font-weight:900;font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;margin:6px 2px -4px}
#maps .mp-sec::after{content:'';flex:1;height:3px;border-radius:3px;background:currentColor;opacity:.25}
#maps :focus-visible{outline:3px solid var(--sk-accent,#ffd84a);outline-offset:3px}
#maps .mp-sheet{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;gap:12px;padding:max(10px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom));background:var(--sk-bg);overflow-y:auto}
#maps .mp-sheet.on{display:flex}
#maps .mp-sheet .mp-head{width:100%}
#maps .mp-sheet h2{font-size:23px;min-width:0;overflow:hidden;text-overflow:ellipsis}
#maps .mp-big{position:relative;width:min(100%,440px);aspect-ratio:1/.866;clip-path:${HEX};background:#fff;filter:drop-shadow(0 6px 0 rgba(0,0,0,.25));flex:none}
#maps .mp-big canvas,#maps .mp-big svg{position:absolute;inset:4px;width:calc(100% - 8px);height:calc(100% - 8px);clip-path:${HEX};background:var(--sk-bg-map,#05070a);display:block}
#maps .mp-stat{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}
#maps .mp-stat .mp-ring{position:static;width:64px;height:64px}
#maps .mp-pill{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:rgba(0,0,0,.22);font-weight:900;font-size:18px;font-variant-numeric:tabular-nums}
#maps .mp-levels{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:440px}
#maps .mp-lb{position:relative;width:64px;height:64px;border-radius:18px;border:3px solid #1c1640;background:linear-gradient(180deg,#7cc2ff,#2d86e8);color:#fff;font-weight:900;font-size:19px;font-style:italic;box-shadow:0 5px 0 #17509a,0 8px 14px rgba(0,0,0,.2);text-shadow:0 2px 0 rgba(0,0,0,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:0}
#maps .mp-lb small{font-size:11px;font-style:normal;letter-spacing:-1px;color:#ffd84a;text-shadow:0 1px 0 #1c1640}
#maps .mp-lb small i{color:rgba(255,255,255,.35);font-style:normal}
#maps .mp-lb.lock{background:linear-gradient(180deg,#d9dee6,#9aa3b2);box-shadow:0 5px 0 #6b7486;color:#2a3140;text-shadow:none}
#maps .mp-lb.cur::after{content:'';position:absolute;inset:-7px;border-radius:22px;border:3px solid var(--sk-accent,#ffd84a);animation:mppulse 1.2s ease-out infinite}
@keyframes mppulse{0%{opacity:1;transform:scale(.92)}100%{opacity:0;transform:scale(1.15)}}
#maps .mp-lb:active,#maps .mp-play:active{transform:translateY(4px)}
#maps .mp-play{min-width:200px;height:64px;border-radius:22px;border:0;font-weight:900;font-size:26px;font-style:italic;letter-spacing:.03em;background:var(--sk-btn,linear-gradient(180deg,#8af574,#2fbf4a));color:var(--sk-btn-ink,#fff);box-shadow:0 6px 0 var(--sk-btn-shadow,#1d7a2c),0 12px 22px rgba(0,0,0,.25);text-shadow:0 3px 0 rgba(0,0,0,.22);margin-top:4px}
@media (prefers-reduced-motion:no-preference){
#maps .mp-card{animation:mpin .45s cubic-bezier(.3,1.5,.5,1) both}
@keyframes mpin{0%{opacity:0;transform:translateY(18px) scale(.85)}100%{opacity:1;transform:none}}
#maps .mp-pin{animation:mppin 1.4s ease-in-out infinite}
@keyframes mppin{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
#maps .mp-sheet.on .mp-big{animation:mpzoom .5s cubic-bezier(.3,1.4,.5,1)}
@keyframes mpzoom{0%{transform:scale(.6);opacity:0}100%{transform:none;opacity:1}}}
`;
  let root, grid, sheet, list = [], job = 0;
  const V = () => window.FTH_MAPVIEW;
  const COMPASS = '<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="10.5" fill="#fff" stroke="#1c1640" stroke-width="2"/><path d="M0-8L3 0 0 8-3 0Z" fill="#ff4d5e" stroke="#1c1640" stroke-width="1.2"/><path d="M0 0L3 0 0 8-3 0Z" fill="#4aa8ff"/><circle r="1.6" fill="#1c1640"/></svg>';
  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'maps'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'mpTitle');
    root.innerHTML = '<div class="mp-head"><button class="mp-x" data-x aria-label="Close maps">✕</button><h2 id="mpTitle">🗺️ Maps</h2><div class="mp-sum" id="mpSum"></div></div>' +
      '<div class="mp-body"><div class="mp-grid" id="mpGrid"></div></div>' +
      '<div class="mp-sheet" id="mpSheet" role="dialog" aria-modal="true" aria-labelledby="mpSheetT"></div>';
    document.body.appendChild(root);
    grid = root.querySelector('#mpGrid'); sheet = root.querySelector('#mpSheet');
    root.querySelector('[data-x]').onclick = close;
    root.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (sheet.classList.contains('on')) hideSheet(); else close(); });
  }
  function close() { if (!root) return; job++; root.classList.remove('on'); hideSheet(); if (root._from && root._from.focus) root._from.focus(); }
  function open() {
    if (!V()) return; build(); root._from = document.activeElement; root.classList.add('on'); hideSheet(); render();
    setTimeout(() => root.querySelector('[data-x]').focus(), 30);
  }
  // a % ring: the accent arc over a dark track, the number in the middle
  function ring(f, label) {
    const r = 19, c = 2 * Math.PI * r, pct = Math.round(f * 100), txt = label != null ? label : pct >= 100 ? '✓' : (pct < 1 && f > 0 ? '<1' : pct) + '%';
    return '<svg class="mp-ring" viewBox="-25 -25 50 50" aria-hidden="true"><circle r="23" fill="#1c1640"/><circle r="' + r + '" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="6"/>' +
      '<circle r="' + r + '" fill="none" stroke="#5cff8a" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (c * Math.max(f, f > 0 ? .03 : 0)).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90)"/>' +
      '<text y="1" text-anchor="middle" dominant-baseline="central" fill="#fff" style="fill:#fff" font-size="' + (txt.length > 3 ? 11 : txt === "✓" ? 18 : 13) + '">' + txt + '</text></svg>';
  }
  // a map with no colouring space census (the tutorial ponds, the big boards): its own islands and bridges
  function graphSvg(m, big) {
    const P = m.pos || [], xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), sp = Math.max(x1 - x0, y1 - y0) || 1;
    const W = 200, H = 173, s = Math.min(W * .62 / (x1 - x0 || sp), H * .66 / (y1 - y0 || sp)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const T = p => [(W / 2 + (p[0] - cx) * s).toFixed(1), (H / 2 + (p[1] - cy) * s).toFixed(1)];
    const r = Math.max(3.2, Math.min(11, 46 / Math.sqrt(P.length + 1))), col = m.start || [];
    let h = '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">';
    h += '<g stroke="rgba(255,240,200,.55)" stroke-width="' + (r * .35).toFixed(1) + '" stroke-linecap="round">' + (m.edges || []).map(([a, b]) => { const [ax, ay] = T(P[a]), [bx, by] = T(P[b]); return '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by + '"/>'; }).join('') + '</g>';
    h += P.map((p, i) => { const [x, y] = T(p);
      if (i === m.hole) return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 1.15).toFixed(1) + '" fill="#8b949e" stroke="#1c1640" stroke-width="1.6"/><text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" fill="#fff" font-weight="900" font-size="' + (r * 1.3).toFixed(1) + '">?</text>';
      const c = EL[col[i]] || '#8b949e';
      return '<circle cx="' + x + '" cy="' + (+y + r * .25).toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#1c1640"/><circle cx="' + x + '" cy="' + y + '" r="' + r.toFixed(1) + '" fill="' + c + '" stroke="#1c1640" stroke-width="1.4"/>' +
        (big ? '<circle cx="' + (x - r * .3).toFixed(1) + '" cy="' + (y - r * .3).toFixed(1) + '" r="' + (r * .28).toFixed(1) + '" fill="rgba(255,255,255,.6)"/>' : ''); }).join('');
    return h + '</svg>';
  }
  const next = m => (m.last && m.last.open && m.last) || m.levels.find(l => l.open && !l.stars) || m.levels.filter(l => l.open).pop() || m.levels[0];
  function render() {
    const my = ++job; list = V().maps().filter(m => m.levels.length); list.forEach(m => { m.title = m.levels[0].title || m.name; });
    const played = list.filter(m => m.played).sort((a, b) => (b.at - a.at) || (a.levels[0].i - b.levels[0].i));
    const fresh = list.filter(m => !m.played).sort((a, b) => a.levels[0].i - b.levels[0].i);
    root.querySelector('#mpSum').innerHTML = COMPASS + '<span>' + played.length + '<small style="opacity:.6"> / ' + list.length + '</small></span>';
    root.querySelector('#mpSum').setAttribute('aria-label', played.length + ' of ' + list.length + ' maps explored');
    const recent = played.find(m => m.at);
    const card = (m, k) => {
      const f = m.levels[0], lk = !m.played && !f.open, beat = m.levels.filter(l => l.stars).length;
      const badge = m.played ? (m.world ? ring(m.S ? m.charted / m.S : 0) : ring(beat / m.levels.length, beat + '/' + m.levels.length)) : '';
      const aria = m.title + (m.played ? (m.world ? ', ' + Math.round(100 * m.charted / (m.S || 1)) + '% charted' : ', ' + beat + ' of ' + m.levels.length + ' levels beaten') : lk ? ', locked' : ', new: play level ' + f.num);
      return '<button class="mp-card' + (m.played ? '' : ' new') + (lk ? ' locked' : '') + '" data-k="' + esc(m.key) + '" style="animation-delay:' + Math.min(k * 45, 600) + 'ms" aria-label="' + esc(aria) + '">' +
        '<span class="mp-hex">' + (m.world ? '<canvas></canvas>' : graphSvg(m)) + '</span>' + badge +
        (m === recent ? '<span class="mp-pin" aria-hidden="true">📍</span>' : '') +
        (m.played ? '' : '<span class="mp-chip' + (lk ? ' lock' : '') + '" aria-hidden="true">' + (lk ? '🔒' : '▶') + ' ' + esc(f.num) + '</span>') +
        '<span class="mp-nm" title="' + esc(m.name) + '">' + esc(m.title) + '</span>' +
        '<span class="mp-lv" aria-hidden="true">' + m.levels.slice(0, 6).map(l => '<span class="' + (l.stars ? 'b' : '') + '">' + esc(l.num) + '</span>').join('') + (m.levels.length > 6 ? '<span>+' + (m.levels.length - 6) + '</span>' : '') + '</span></button>';
    };
    let h = '', k = 0;
    if (played.length) h += '<div class="mp-sec" aria-hidden="true">🧭</div>' + played.map(m => card(m, k++)).join('');
    if (fresh.length) h += '<div class="mp-sec" aria-hidden="true">✨</div>' + fresh.map(m => card(m, k++)).join('');
    grid.innerHTML = h;
    grid.querySelectorAll('.mp-card').forEach(b => b.onclick = () => tap(list.find(m => m.key === b.dataset.k), b));
    // draw the thumbnails one per frame, so the screen is up at once
    const todo = [...grid.querySelectorAll('.mp-card')].filter(b => b.querySelector('canvas'));
    const step = () => { if (my !== job || !todo.length) return; const b = todo.shift(); try { V().render(b.querySelector('canvas'), b.dataset.k); } catch (e) { console.warn('maps', e); } requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function tap(m, btn) {
    if (!m) return;
    const f = m.levels[0];
    if (!m.played) {
      if (!f.open) { V().sfx('no'); if (btn.animate && !reduced()) btn.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 220 }); return; }
      close(); V().play(f.i); return;
    }
    showSheet(m);
  }
  function showSheet(m) {
    V().sfx(); const go = next(m), beat = m.levels.filter(l => l.stars).length;
    sheet.innerHTML = '<div class="mp-head"><button class="mp-x" data-back aria-label="Back to maps">◀</button><h2 id="mpSheetT" style="text-transform:capitalize">' + esc(m.title) + '</h2></div>' +
      '<div class="mp-big">' + (m.world ? '<canvas></canvas>' : graphSvg(m, true)) + '</div>' +
      '<div class="mp-stat">' + (m.world ? ring(m.S ? m.charted / m.S : 0) + '<span class="mp-pill" aria-label="' + m.charted + ' of ' + m.S + ' patterns charted">' + COMPASS.replace('<svg', '<svg width="22" height="22"') + m.charted.toLocaleString('en') + ' / ' + m.S.toLocaleString('en') + '</span>' : '') +
      '<span class="mp-pill" aria-label="' + beat + ' of ' + m.levels.length + ' levels beaten">★ ' + m.levels.reduce((a, l) => a + l.stars, 0) + ' / ' + 3 * m.levels.length + '</span></div>' +
      '<div class="mp-levels">' + m.levels.map(l => '<button class="mp-lb' + (l.open ? '' : ' lock') + (go && l.i === go.i ? ' cur' : '') + '" data-i="' + l.i + '" aria-label="Level ' + esc(l.num) + (l.open ? ', ' + l.stars + ' of 3 stars' : ', locked') + '">' +
        (l.open ? '' : '<span aria-hidden="true" style="position:absolute;top:-9px;right:-7px;font-size:17px">🔒</span>') + esc(l.num) + '<small aria-hidden="true">' + '★'.repeat(l.stars) + '<i>' + '★'.repeat(3 - l.stars) + '</i></small></button>').join('') + '</div>' +
      (go && go.open ? '<button class="mp-play" data-i="' + go.i + '" aria-label="Play level ' + esc(go.num) + '">▶ ' + esc(go.num) + '</button>' : '');
    sheet.classList.add('on'); sheet.scrollTop = 0;
    sheet.querySelector('[data-back]').onclick = hideSheet;
    sheet.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
      const l = m.levels.find(x => x.i === +b.dataset.i); if (!l) return;
      if (!l.open) { V().sfx('no'); return; }
      close(); V().play(l.i);
    });
    const cv = sheet.querySelector('canvas');
    if (cv) requestAnimationFrame(() => { try { V().render(cv, m.key, { big: true }); } catch (e) { console.warn('maps', e); } });
    setTimeout(() => { const p = sheet.querySelector('.mp-play') || sheet.querySelector('[data-back]'); if (p) p.focus(); }, 30);
  }
  function hideSheet() { if (sheet) { sheet.classList.remove('on'); sheet.innerHTML = ''; } }
  window.FTH_MAPS = { open, close };
})();
