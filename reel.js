/* reel.js: the skin reel. A ribbon of skin cards you swipe left and right (title screen and the 🎟️ shop; SKIN-SPEC.md 13).
 *
 *   const r = FTH_REEL.create(hostEl, { items: [spec], owns: id => bool, at: id, label: 'Game style', h: 150,
 *                                      onSettle(spec, i), onTap(spec, i), onTick() });
 *   r.go(idOrIndex, instant)   r.refresh()   r.index()   r.spec()   r.el   r.destroy()
 *
 * The centred card is big and bright; its neighbours peek in, smaller and shaded. Drag or flick (momentum, then a spring
 * snaps to a card), tap a neighbour, arrow keys / Home / End, or a sideways wheel. onSettle fires when the reel comes to
 * rest on a different card; onTap when the centred card is tapped (or Enter / Space). Owned cards are in colour with an
 * idle bob and shimmer; locked ones are grey, still, and wear a ticket badge. ARIA: a listbox of options, the centred
 * card is the active descendant. prefers-reduced-motion: no bob, no shimmer, the snap is instant.
 *
 * Card art: spec.card (an SVG, viewBox 0 0 240 320), else one built from spec.title.svg (or a generated rim of tiles) on
 * the skin's own background with its icon (spec.icon, else its emoji) and coin. Logo: spec.logo (SVG, viewBox 0 0 240 80),
 * else the name in the skin's font and colours. FTH_REEL.art(spec) / logo(spec) / ticket(size) are shared with the shop.
 */
(function () {
  'use strict';
  const R = () => window.FTH_SKINS || {};
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let uid = 0;
  // every copy of a skin's SVG gets its own ids (the same art can be on screen several times: title, reel, shop)
  function uniq(svg) {
    const p = 'rl' + (++uid) + '-';
    return String(svg).replace(/\bid="([^"]+)"/g, (_, x) => 'id="' + p + x + '"').replace(/url\(#([^)\s]+)\)/g, (_, x) => 'url(#' + p + x + ')')
      .replace(/href="#([^"]+)"/g, (_, x) => 'href="#' + p + x + '"');
  }
  const themeOf = k => { const S = R(), isl = (S.list || []).find(s => s.id === 'islands'); return Object.assign({}, isl && isl.theme || {}, k.theme || {}); };
  const fontLinks = new Set();
  function fonts(k) {                                // a card shows its skin's own font: load the skin's Google Fonts once
    (k.fonts || []).forEach(u => {
      if (fontLinks.has(u) || [...document.querySelectorAll('link[rel="stylesheet"]')].some(l => l.href === u)) return;
      fontLinks.add(u); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l);
    });
  }
  const svgStrip = s => String(s).replace(/^\s*<svg\b([^>]*)>/, (m, a) => '<svg' + a.replace(/\s(width|height)="[^"]*"/g, '') + ' preserveAspectRatio="xMidYMid meet">');
  // a rim of five element tiles round the blank hole, for a skin with no title art (the island family): hexes, bubbles or cubes
  const EL = [['#ff6a45', '#a8321c'], ['#4aa8ff', '#1b4f91'], ['#ffd84a', '#a8800f'], ['#62d96a', '#1f7a2e']];
  function rimArt(k) {
    const free = k.board && k.board.free, cube = /3d/.test(k.id), cx = 150, cy = 128, R0 = 74, rr = 29, rim = [0, 1, 2, 3, 1];
    const tile = (x, y, e, hole) => {
      const [f, d] = hole ? ['#eef2f8', '#6b7488'] : EL[e];
      let sh;
      if (free) sh = c => '<circle cx="' + x + '" cy="' + y + '" r="' + rr + '" ' + c + '/>';
      else if (cube) sh = c => '<path d="M' + x + ' ' + (y - rr) + 'L' + (x + rr) + ' ' + (y - rr / 2) + 'V' + (y + rr / 2) + 'L' + x + ' ' + (y + rr) + 'L' + (x - rr) + ' ' + (y + rr / 2) + 'V' + (y - rr / 2) + 'Z" ' + c + '/>';
      else sh = c => '<path d="' + [0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI / 3 * i + Math.PI / 6; return (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(1) + ' ' + (y + rr * Math.sin(a)).toFixed(1); }).join('') + 'Z" ' + c + '/>';
      return '<g>' + sh('fill="#1c1640" transform="translate(0 5)"') + sh('fill="' + f + '" stroke="#1c1640" stroke-width="5"') +
        (cube ? '<path d="M' + (x - rr) + ' ' + (y - rr / 2) + 'L' + x + ' ' + y + 'L' + (x + rr) + ' ' + (y - rr / 2) + 'M' + x + ' ' + y + 'V' + (y + rr) + '" stroke="' + d + '" stroke-width="3" fill="none" opacity=".7"/>' : '') +
        '<ellipse cx="' + (x - rr * .35) + '" cy="' + (y - rr * .42) + '" rx="' + rr * .32 + '" ry="' + rr * .18 + '" fill="#fff" opacity=".55"/>' +
        (hole ? '<text x="' + x + '" y="' + (y + 10) + '" text-anchor="middle" font-size="30" font-weight="900" fill="#1c1640" font-family="system-ui,sans-serif">?</text>' : '<circle cx="' + x + '" cy="' + (y + 2) + '" r="' + rr * .3 + '" fill="' + d + '" opacity=".55"/>') + '</g>';
    };
    const pts = rim.map((e, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R0 * Math.cos(a), cy + R0 * Math.sin(a), e]; });
    return '<svg viewBox="0 0 300 250"><ellipse cx="150" cy="140" rx="132" ry="104" fill="#1c1640" opacity=".25"/><ellipse cx="150" cy="132" rx="128" ry="100" fill="#f3d58a" stroke="#1c1640" stroke-width="5"/>' +
      '<ellipse cx="150" cy="128" rx="112" ry="86" fill="' + (free ? '#7fd7e8' : cube ? '#9bdcf2' : '#7ccf5a') + '"/>' +
      pts.map(([x, y]) => '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#1c1640" stroke-width="5" stroke-linecap="round"/>').join('') +
      pts.map(([x, y], i) => { const [x2, y2] = pts[(i + 1) % 5]; return '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#1c1640" stroke-width="5" stroke-linecap="round"/>'; }).join('') +
      tile(cx, cy, 0, true) + pts.map(([x, y, e]) => tile(x, y, e)).join('') + '</svg>';
  }
  // the card art (inside a box with aspect 3:4): the skin's own card, or one built from its title art, icon and coin
  function art(k) {
    if (k.card) return '<div class="rl-svg">' + uniq(svgStrip(k.card)) + '</div>';
    fonts(k);
    const T = themeOf(k), coin = R().coinOf ? R().coinOf(k) : null;
    const pic = k.title && k.title.svg ? svgStrip(k.title.svg) : rimArt(k);
    const ic = k.icon ? '<span class="rl-icon">' + uniq(svgStrip(k.icon)) + '</span>' : '<span class="rl-icon rl-emo" aria-hidden="true">' + esc(k.ic || '★') + '</span>';
    return '<div class="rl-gen" style="background:' + esc(T['--sk-bg'] || '#3aa6f0') + ';--rl-ac:' + esc(T['--sk-accent'] || '#ffd84a') + ';--rl-cd:' + esc(T['--sk-card'] || '#26304a') + '">' +
      '<div class="rl-pic">' + uniq(pic) + '</div><div class="rl-band">' + ic + (coin && coin.svg ? '<span class="rl-coin">' + coin.svg(34) + '</span>' : '') + '</div></div>';
  }
  // the skin's scene for a big stage (the shop's preview): its card, else its title art on its own background
  function scene(k) {
    if (k.card) return art(k);
    const T = themeOf(k), pic = k.title && k.title.svg ? svgStrip(k.title.svg) : rimArt(k);
    return '<div class="rl-gen rl-scene" style="background:' + esc(T['--sk-bg'] || '#3aa6f0') + '"><div class="rl-pic">' + uniq(pic) + '</div></div>';
  }
  // the wordmark: the skin's own logo, or its name in its own font and colours
  function logo(k) {
    if (k.logo) return '<span class="rl-lsvg">' + uniq(svgStrip(k.logo)) + '</span>';
    fonts(k);
    const T = themeOf(k), ac = T['--sk-accent'] || '#ffd84a';
    return '<span class="rl-lname" style="font-family:' + esc(T['--sk-font'] || 'system-ui') + ';color:' + esc(ac) + '">' + esc(k.name) + '</span>';
  }
  // a cartoon paper ticket (the shop's unit): size in px wide
  function ticket(size, n) {
    const w = size || 40, h = Math.round(w * .62);
    return '<svg class="rl-ticket" viewBox="0 0 64 40" width="' + w + '" height="' + h + '" aria-hidden="true">' +
      '<path d="M6 4h52a2 2 0 0 1 2 2v8a6 6 0 0 0 0 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a6 6 0 0 0 0-12V6a2 2 0 0 1 2-2z" transform="translate(0 3)" fill="#7a1a3a"/>' +
      '<path d="M6 4h52a2 2 0 0 1 2 2v8a6 6 0 0 0 0 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a6 6 0 0 0 0-12V6a2 2 0 0 1 2-2z" fill="#ff5a7a" stroke="#1c1640" stroke-width="2.6"/>' +
      '<path d="M44 7v26" stroke="#1c1640" stroke-width="2" stroke-dasharray="3 3"/>' +
      '<path d="M24 11l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z" fill="#ffd84a" stroke="#1c1640" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M9 9h26" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>' +
      (n != null ? '<text x="52" y="25" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">' + esc(n) + '</text>' : '') + '</svg>';
  }

  const CSS = `
.rl:focus,.rl:focus-visible{outline:none}
.rl{position:relative;width:100%;height:calc(var(--rl-h,150px) + var(--rl-lh,40px) + 22px);touch-action:pan-y;user-select:none;-webkit-user-select:none;outline:none;cursor:grab;-webkit-tap-highlight-color:transparent}
.rl.drag{cursor:grabbing}
.rl:focus-visible .rl-card.mid .rl-bob{outline:4px solid var(--sk-accent,#ffd84a);outline-offset:4px}
.rl-track{position:absolute;left:0;right:0;top:6px;height:var(--rl-h,150px)}
.rl::before{content:'';position:absolute;left:-2px;right:-2px;top:calc(6px + var(--rl-h,150px) * .22);height:calc(var(--rl-h,150px) * .56);background:linear-gradient(180deg,rgba(28,22,64,.34),rgba(28,22,64,.18));border-top:3px solid rgba(255,255,255,.28);border-bottom:3px solid rgba(28,22,64,.35);pointer-events:none}
.rl-card{position:absolute;left:50%;top:0;width:calc(var(--rl-h,150px) * .75);height:var(--rl-h,150px);margin-left:calc(var(--rl-h,150px) * -.375);will-change:transform;transform-origin:50% 60%}
.rl-bob{position:absolute;inset:0;border-radius:calc(var(--rl-h,150px) * .11);box-shadow:0 6px 0 #1c1640,0 10px 18px rgba(0,0,0,.28);border:4px solid #1c1640;background:#1c1640;overflow:hidden}
.rl-art{position:absolute;inset:0;overflow:hidden;border-radius:inherit}
.rl-svg,.rl-svg svg{width:100%;height:100%;display:block}
.rl-gen{position:absolute;inset:0;display:flex;flex-direction:column;container-type:size}
.rl-pic{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;padding:8% 4% 0}
.rl-pic svg{width:100%;height:100%;display:block;overflow:visible}
.rl-scene .rl-pic{padding:14% 6%}
.rl-band{flex:0 0 31%;display:flex;align-items:center;justify-content:center;gap:9%;padding-bottom:2%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.28));position:relative}
.rl-icon{width:36cqw;height:36cqw;border-radius:24%;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 1.6cqw 0 #1c1640}
.rl-icon svg{width:100%;height:100%;display:block}
.rl-emo{background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.9) 0 9%,transparent 10%),linear-gradient(160deg,color-mix(in srgb,var(--rl-ac) 70%,#fff),var(--rl-ac));border:1.4cqw solid #1c1640;font-size:22cqw;line-height:1}
.rl-coin{display:flex;filter:drop-shadow(0 3px 0 rgba(28,22,64,.6))}
.rl-coin svg{width:24cqw;height:auto}
.rl-dim{position:absolute;inset:0;background:#0b1030;opacity:0;pointer-events:none;border-radius:inherit}
.rl-veil{position:absolute;inset:0;display:none;background:repeating-linear-gradient(135deg,rgba(60,66,84,.55) 0 10px,rgba(40,44,60,.55) 10px 20px);border-radius:inherit}
.rl-card.lock .rl-art{filter:grayscale(1) brightness(.78) contrast(.9)}
.rl-card.lock .rl-veil{display:block}
.rl-tk{position:absolute;right:-10px;top:-12px;display:none;transform:rotate(14deg);filter:drop-shadow(0 3px 0 rgba(28,22,64,.5));z-index:2}
.rl-card.lock .rl-tk{display:block}
.rl-tk svg{width:calc(var(--rl-h,150px) * .34);height:auto}
.rl-lk{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:none;width:34%;aspect-ratio:1}
.rl-card.lock .rl-lk{display:block}
.rl-shine{position:absolute;inset:-20%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.38) 50%,transparent 60%);transform:translateX(-120%);pointer-events:none;display:none}
.rl-card.own .rl-shine{display:block}
.rl-sel{position:absolute;left:50%;bottom:-13px;transform:translateX(-50%);width:26px;height:26px;border-radius:50%;background:#62d96a;border:3px solid #1c1640;display:none;align-items:center;justify-content:center;color:#fff;font:900 14px/1 system-ui,sans-serif;box-shadow:0 3px 0 #1c1640;z-index:2}
.rl-card.on .rl-sel{display:flex}
.rl-logo{position:absolute;left:0;right:0;bottom:0;height:var(--rl-lh,40px);display:flex;align-items:center;justify-content:center;pointer-events:none}
.rl-logo>span{display:block;max-width:92%}
.rl-lsvg svg{height:var(--rl-lh,40px);width:auto;max-width:100%;display:block}
.rl-lname{font-weight:900;font-size:calc(var(--rl-lh,40px) * .62);line-height:1;white-space:nowrap;letter-spacing:.01em;
  text-shadow:2px 0 #1c1640,-2px 0 #1c1640,0 2px #1c1640,0 -2px #1c1640,2px 2px #1c1640,-2px 2px #1c1640,2px -2px #1c1640,-2px -2px #1c1640,0 4px 0 #1c1640}
@media (prefers-reduced-motion:no-preference){
  .rl-card.own .rl-bob{animation:rlbob 3.2s ease-in-out infinite;animation-delay:var(--rl-d,0s)}
  .rl-card.own .rl-shine{animation:rlshine 4.6s ease-in-out infinite;animation-delay:var(--rl-d,0s)}
  .rl-logo>span.pop{animation:rlpop .42s cubic-bezier(.3,1.7,.5,1)}
  .rl-card.unlocked .rl-bob{animation:rlunl .7s cubic-bezier(.3,1.7,.5,1)}
}
@keyframes rlbob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-5px) rotate(-.6deg)}}
@keyframes rlshine{0%,62%{transform:translateX(-120%)}86%,100%{transform:translateX(120%)}}
@keyframes rlpop{0%{transform:scale(.6)}100%{transform:scale(1)}}
@keyframes rlunl{0%{transform:scale(1.25) rotate(-4deg)}100%{transform:scale(1)}}
`;
  let cssDone = false;
  const LOCK = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M12 18v-5a8 8 0 0 1 16 0v5" fill="none" stroke="#1c1640" stroke-width="7"/><path d="M12 18v-5a8 8 0 0 1 16 0v5" fill="none" stroke="#c9ced8" stroke-width="3.4"/>' +
    '<rect x="7" y="18" width="26" height="19" rx="5" fill="#1c1640" transform="translate(0 2)"/><rect x="7" y="18" width="26" height="19" rx="5" fill="#e8ecf2" stroke="#1c1640" stroke-width="2.6"/><circle cx="20" cy="26" r="3" fill="#1c1640"/><path d="M20 27v5" stroke="#1c1640" stroke-width="3" stroke-linecap="round"/></svg>';

  function create(host, o) {
    if (!cssDone) { cssDone = true; const st = document.createElement('style'); st.id = 'reelCss'; st.textContent = CSS; document.head.appendChild(st); }
    const items = o.items.slice(), N = items.length, me = 'rl' + (++uid);
    const el = document.createElement('div'); el.className = 'rl'; el.tabIndex = 0;
    el.setAttribute('role', 'listbox'); el.setAttribute('aria-label', o.label || 'Game style'); el.setAttribute('aria-roledescription', 'carousel');
    if (o.h) el.style.setProperty('--rl-h', o.h + 'px');
    if (o.lh) el.style.setProperty('--rl-lh', o.lh + 'px');
    el.innerHTML = '<div class="rl-track"></div><div class="rl-logo" aria-hidden="true"></div>';
    host.innerHTML = ''; host.appendChild(el);
    const track = el.querySelector('.rl-track'), logoEl = el.querySelector('.rl-logo');
    let cards = [], p = 0, v = 0, target = 0, settled = -1, raf = 0, logoAt = -1, tickAt = 0;
    const idx = a => { const i = typeof a === 'number' ? a : items.findIndex(k => k.id === a); return Math.max(0, Math.min(N - 1, i < 0 ? 0 : i)); };
    function build() {
      track.innerHTML = items.map((k, i) => '<div class="rl-card" role="option" id="' + me + '-' + esc(k.id) + '" data-s="' + esc(k.id) + '" data-i="' + i + '" style="--rl-d:' + (-(i * .37) % 3).toFixed(2) + 's">' +
        '<div class="rl-bob"><div class="rl-art">' + art(k) + '</div><div class="rl-veil"></div><span class="rl-lk">' + LOCK + '</span><i class="rl-shine"></i><div class="rl-dim"></div></div>' +
        '<span class="rl-tk">' + ticket(48) + '</span><span class="rl-sel" aria-hidden="true">✓</span></div>').join('');
      cards = [...track.children];
      refresh();
    }
    function refresh() {
      cards.forEach((c, i) => {
        const k = items[i], own = !!o.owns(k.id), was = c.classList.contains('lock');
        c.classList.toggle('own', own); c.classList.toggle('lock', !own);
        c.classList.toggle('on', !!(o.current && o.current() === k.id));
        if (was && own) { c.classList.remove('unlocked'); void c.offsetWidth; c.classList.add('unlocked'); setTimeout(() => c.classList.remove('unlocked'), 800); }
        c.setAttribute('aria-label', k.name + (own ? '' : ', locked'));
        c.setAttribute('aria-disabled', own ? 'false' : 'true');
      });
      layout(); setActive(Math.round(target));
    }
    function setActive(i) {
      cards.forEach((c, j) => c.setAttribute('aria-selected', j === i ? 'true' : 'false'));
      if (cards[i]) el.setAttribute('aria-activedescendant', cards[i].id);
    }
    function layout() {
      const w = cards.length ? cards[0].offsetWidth || 112 : 112, step = w * .82;
      const mid = Math.round(p);
      cards.forEach((c, i) => {
        const d = i - p, a = Math.abs(d);
        c.classList.toggle('mid', i === mid);
        if (a > 3.2) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = '';
        const x = Math.sign(d) * (a <= 1 ? a * step : step + (a - 1) * step * .62);
        const s = 1 - .3 * Math.min(a, 1) - .1 * Math.max(0, Math.min(a - 1, 1));
        c.style.transform = 'translateX(' + x.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        c.style.zIndex = String(100 - Math.round(a * 10));
        const dim = c.querySelector('.rl-dim'); if (dim) dim.style.opacity = (Math.min(a, 1.6) * .3).toFixed(3);
      });
      if (mid !== logoAt && items[mid]) {
        logoAt = mid; logoEl.innerHTML = logo(items[mid]);
        const sp = logoEl.firstChild; if (sp) sp.classList.add('pop');
        if (o.onTick && performance.now() - tickAt > 50) { tickAt = performance.now(); o.onTick(items[mid], mid); }
      }
    }
    const stepPx = () => ((cards[0] && cards[0].offsetWidth) || 112) * .82;
    function settle() {
      p = target; v = 0; layout(); const i = Math.round(target); setActive(i);
      if (i !== settled) { settled = i; if (o.onSettle) o.onSettle(items[i], i); }
    }
    function animate() {
      cancelAnimationFrame(raf);
      if (reduced()) return settle();
      let last = performance.now();
      const frame = now => {
        const dt = Math.min(.032, (now - last) / 1000); last = now;
        const k = 170, c = 2 * Math.sqrt(k);              // a critically damped spring towards the target card
        v += ((target - p) * k - v * c) * dt; p += v * dt; layout();
        if (Math.abs(target - p) < .002 && Math.abs(v) < .02) return settle();
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }
    function go(a, instant) {
      target = idx(a); setActive(target);
      if (instant) { cancelAnimationFrame(raf); p = target; v = 0; settled = target; layout(); return; }
      animate();
    }
    // ---- input: drag with momentum, tap, keys, wheel
    let drag = null;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      cancelAnimationFrame(raf);
      drag = { id: e.pointerId, x0: e.clientX, p0: p, t0: performance.now(), moved: 0, hist: [[performance.now(), p]], card: e.target.closest('.rl-card') };
      try { el.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
    });
    el.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0; drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (drag.moved > 6) el.classList.add('drag');
      let q = drag.p0 - dx / stepPx();
      if (q < 0) q = q * .35; if (q > N - 1) q = N - 1 + (q - N + 1) * .35;   // rubber band past the ends
      p = q; const t = performance.now(); drag.hist.push([t, p]); while (drag.hist.length > 2 && t - drag.hist[0][0] > 110) drag.hist.shift();
      layout();
    });
    const up = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null; el.classList.remove('drag');
      if (d.moved <= 6) {                                   // a tap: a neighbour comes to the centre; the centred card is "picked"
        const i = d.card ? +d.card.dataset.i : Math.round(p);
        if (i !== Math.round(target)) go(i); else { p = target; layout(); if (o.onTap) o.onTap(items[i], i); }
        return;
      }
      const h = d.hist, a = h[0], b = h[h.length - 1], dt = Math.max(16, b[0] - a[0]);
      v = (b[1] - a[1]) / dt * 1000;                        // cards per second
      target = idx(Math.round(p + v * .22)); setActive(target); animate();
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', e => {
      const t = Math.round(target);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(t - 1); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(t + 1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(N - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (o.onTap) o.onTap(items[t], t); }
    });
    let wheelAcc = 0, wheelT = 0;
    el.addEventListener('wheel', e => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0); if (!dx) return;
      e.preventDefault(); wheelAcc += dx; clearTimeout(wheelT); wheelT = setTimeout(() => { wheelAcc = 0; }, 160);
      if (Math.abs(wheelAcc) > 60) { go(Math.round(target) + Math.sign(wheelAcc)); wheelAcc = 0; }
    }, { passive: false });
    const onResize = () => layout(); addEventListener('resize', onResize);
    build(); go(o.at != null ? o.at : 0, true);
    if (typeof ResizeObserver === 'function') { const ro = new ResizeObserver(() => layout()); ro.observe(el); el._ro = ro; }
    return {
      el, go, refresh, layout,
      index: () => Math.round(target), spec: () => items[Math.round(target)],
      card: id => cards[idx(id)],
      destroy() { cancelAnimationFrame(raf); removeEventListener('resize', onResize); if (el._ro) el._ro.disconnect(); el.remove(); },
    };
  }
  window.FTH_REEL = { create, art, scene, logo, ticket, uniq };
})();
