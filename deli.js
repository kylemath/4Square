/* deli.js: the ticket deli counter, opened from the 🎟️ shop (tickets.js). Buying a skin ticket, as a deli counter.
 *
 *   FTH_DELI.open(ctx, { onBought(), onClose() })      ctx: the shop's ticket ctx (tickets.js), plus blip / sfx for sound
 *
 * A counter scene with far too many hanging price signs, swinging on their strings: each sign is the price of ONE ticket
 * in one skin's coin (FTH_TICKETS.next(ctx).pay, and coinsFor for a wallet the player does not hold yet). A sign the
 * player cannot pay is dimmed and still; when the level gate is not met yet the counter hangs a padlock with the level
 * count. Tap a sign: it zooms forward with a PURCHASE button (🎟️ × 1 for that price). Tap it: FTH_TICKETS.buy, then coins
 * fly out of the wallet into the dispenser, a paper ticket prints and swoops into the wallet, the wallet bumps.
 * No sentences: coins, numbers, glyphs.
 */
(function () {
  'use strict';
  const T = () => window.FTH_TICKETS, S = () => window.FTH_SKINS, RL = () => window.FTH_REEL;
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.floor(n).toLocaleString('en');
  const tk = (w, n) => RL() ? RL().ticket(w, n) : '🎟️';
  // ---- sign shapes, drawn in a 100 x 72 box (outline + an offset shadow copy, the Islands way)
  const SHAPES = [
    'M16 4H84A12 12 0 0 1 96 16V56A12 12 0 0 1 84 68H16A12 12 0 0 1 4 56V16A12 12 0 0 1 16 4Z',          // rounded board
    'M50 4C76 4 96 18 96 36S76 68 50 68 4 54 4 36 24 4 50 4Z',                                             // oval
    'M4 8H78L96 36 78 64H4L14 36Z',                                                                        // arrow banner
    'M26 4H96V68H26L4 36Z',                                                                                // price tag
    'M14 4H86A10 10 0 0 0 96 14V58A10 10 0 0 0 86 68H14A10 10 0 0 0 4 58V14A10 10 0 0 0 14 4Z',           // notched card
    'M4 6H96V40Q96 60 50 70 4 60 4 40Z',                                                                   // shield
    'M22 4H78L97 36 78 68H22L3 36Z',                                                                       // hexagon
    (() => { let d = ''; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = i % 2 ? .8 : 1; d += (i ? 'L' : 'M') + (50 + 47 * r * Math.cos(a)).toFixed(1) + ' ' + (36 + 33 * r * Math.sin(a)).toFixed(1); } return d + 'Z'; })(),   // starburst
  ];
  const PAINT = [['#ffd84a', '#c9a21a'], ['#ff6a45', '#a8321c'], ['#62d96a', '#1f7a2e'], ['#ffffff', '#b9c2d6'], ['#4aa8ff', '#1b4f91'], ['#ff8ec8', '#b0477e'], ['#ffb347', '#b0661a'], ['#c9a0ff', '#6b3fb8']];
  const hash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  function signSvg(i) {
    const d = SHAPES[i % SHAPES.length], [f, e] = PAINT[(i * 3 + 1) % PAINT.length];
    return '<svg class="dl-shape" viewBox="0 0 100 72" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="#1c1640" transform="translate(2 5)"/><path d="' + d + '" fill="' + f + '" stroke="#1c1640" stroke-width="3.4" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + e + '" stroke-width="3" stroke-linejoin="round" transform="translate(50 36) scale(.84) translate(-50 -36)" opacity=".55"/>' +
      (i % SHAPES.length === 3 ? '<circle cx="18" cy="36" r="4.5" fill="#f4ecd8" stroke="#1c1640" stroke-width="2.4"/>' : '') + '</svg>';
  }
  const LOCK = '<svg viewBox="0 0 80 96" aria-hidden="true"><path d="M20 44V30a20 20 0 0 1 40 0v14" fill="none" stroke="#1c1640" stroke-width="13"/><path d="M20 44V30a20 20 0 0 1 40 0v14" fill="none" stroke="#c9ced8" stroke-width="6"/>' +
    '<rect x="6" y="42" width="68" height="50" rx="12" fill="#1c1640" transform="translate(0 4)"/><rect x="6" y="42" width="68" height="50" rx="12" fill="#ffd84a" stroke="#1c1640" stroke-width="4"/><path d="M14 50h40" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/><circle cx="40" cy="62" r="7" fill="#1c1640"/><path d="M40 64v14" stroke="#1c1640" stroke-width="7" stroke-linecap="round"/></svg>';
  const WALLET = '<svg viewBox="0 0 120 96" aria-hidden="true"><rect x="8" y="22" width="104" height="70" rx="16" fill="#1c1640" transform="translate(0 5)"/><path d="M22 24l52-18 10 22" fill="#ff5a7a" stroke="#1c1640" stroke-width="4" stroke-linejoin="round"/><path d="M36 22l44-12 6 14" fill="#ffd84a" stroke="#1c1640" stroke-width="4" stroke-linejoin="round"/>' +
    '<rect x="8" y="22" width="104" height="70" rx="16" fill="#a8622e" stroke="#1c1640" stroke-width="4"/><path d="M18 32h70" stroke="#d58a4e" stroke-width="5" stroke-linecap="round"/><rect x="70" y="44" width="46" height="30" rx="10" fill="#7a3f17" stroke="#1c1640" stroke-width="4"/><circle cx="86" cy="59" r="7" fill="#ffd84a" stroke="#1c1640" stroke-width="3"/></svg>';
  const DISPENSER = '<svg viewBox="0 0 120 130" aria-hidden="true"><ellipse cx="60" cy="122" rx="46" ry="7" fill="#1c1640" opacity=".35"/><rect x="34" y="96" width="52" height="26" rx="6" fill="#4a4f63" stroke="#1c1640" stroke-width="4"/>' +
    '<path d="M60 8a44 44 0 0 1 44 44v28a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16V52A44 44 0 0 1 60 8z" fill="#1c1640" transform="translate(0 5)"/><path d="M60 8a44 44 0 0 1 44 44v28a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16V52A44 44 0 0 1 60 8z" fill="#ff4d5e" stroke="#1c1640" stroke-width="4"/>' +
    '<path d="M30 30a36 36 0 0 1 26-14" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".55" fill="none"/><circle cx="60" cy="50" r="18" fill="#fff4d6" stroke="#1c1640" stroke-width="4"/><text x="60" y="60" text-anchor="middle" font-size="27" font-weight="900" fill="#ff4d5e" font-family="system-ui,sans-serif">#</text>' +
    '<rect x="30" y="76" width="60" height="9" rx="4.5" fill="#1c1640"/></svg>';

  const CSS = `
#deli{position:fixed;inset:0;z-index:80;display:none;overflow:hidden;font-family:var(--sk-font,system-ui,sans-serif);color:#1c1640;user-select:none;-webkit-user-select:none;
  background:linear-gradient(180deg,rgba(255,240,200,.0),rgba(120,80,30,.18)),
    repeating-linear-gradient(0deg,rgba(130,110,80,.22) 0 2px,transparent 2px 26px),repeating-linear-gradient(90deg,rgba(130,110,80,.22) 0 2px,transparent 2px 44px),#f6efdc}
#deli.on{display:block}
#deli *{box-sizing:border-box}
#deli button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#deli :focus-visible{outline:4px solid #4aa8ff;outline-offset:3px}
.dl-awn{position:absolute;left:0;right:0;top:0;height:calc(58px + env(safe-area-inset-top));background:repeating-linear-gradient(90deg,#ff4d5e 0 34px,#fff 34px 68px);border-bottom:4px solid #1c1640;z-index:5}
.dl-awn::after{content:'';position:absolute;left:0;right:0;bottom:-18px;height:16px;background:radial-gradient(circle at 17px 0,#ff4d5e 0 15px,#1c1640 15px 17.5px,transparent 18px) 0 0/68px 16px,radial-gradient(circle at 51px 0,#fff 0 15px,#1c1640 15px 17.5px,transparent 18px) 0 0/68px 16px}
.dl-x{position:absolute;left:12px;top:calc(8px + env(safe-area-inset-top));z-index:7;width:46px;height:46px;border-radius:50%;border:4px solid #1c1640;background:#fff;color:#1c1640;font-size:22px;font-weight:900;line-height:1;box-shadow:0 4px 0 #1c1640}
.dl-led{position:absolute;right:12px;top:calc(9px + env(safe-area-inset-top));z-index:7;display:flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:12px;border:4px solid #1c1640;background:#20232e;box-shadow:0 4px 0 #1c1640}
.dl-led b{font:900 26px/1 ui-monospace,'SF Mono',Menlo,monospace;color:#ff4d5e;text-shadow:0 0 8px rgba(255,77,94,.8);letter-spacing:.06em}
.dl-rail{position:absolute;left:0;right:0;top:calc(66px + env(safe-area-inset-top));height:10px;background:linear-gradient(#5b6075,#2c3042);border-top:2px solid #1c1640;border-bottom:3px solid #1c1640;z-index:3}
.dl-signs{position:absolute;left:0;right:0;top:calc(72px + env(safe-area-inset-top));bottom:196px;z-index:2}
.dl-sign{position:absolute;top:0;width:var(--w);margin-left:calc(var(--w) * -.5);transform-origin:50% 0;pointer-events:none}
.dl-sign::before,.dl-sign::after{content:'';position:absolute;top:0;width:2px;height:calc(var(--hang) + 8px);background:#3a3550}
.dl-sign::before{left:28%}.dl-sign::after{right:28%}
.dl-sign.one::before{left:calc(50% - 1px)}.dl-sign.one::after{display:none}
.dl-face{position:relative;margin-top:var(--hang);width:100%;aspect-ratio:100/72;border:0;padding:0;background:none;pointer-events:auto;display:block;transform:rotate(var(--tilt));transform-origin:50% 0}
.dl-shape{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.dl-in{position:absolute;inset:12% 8% 14%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.dl-pr{display:flex;align-items:center;gap:3px;font-weight:900;font-size:calc(var(--w) * .2);line-height:1;color:#fff;-webkit-text-stroke:3px #1c1640;paint-order:stroke fill;letter-spacing:.01em}
.dl-pr .cn{display:flex;-webkit-text-stroke:0}.dl-pr .cn svg{width:calc(var(--w) * .26);height:auto}
.dl-bar{width:62%;height:6px;border-radius:9px;background:rgba(28,22,64,.3);overflow:hidden;border:1.5px solid #1c1640}
.dl-bar i{display:block;height:100%;background:#62d96a}
.dl-sign.no .dl-face{filter:grayscale(.85) brightness(.9);opacity:.55}
.dl-sign.ok .dl-face{filter:drop-shadow(0 0 10px rgba(255,216,74,.9))}
@media (prefers-reduced-motion:no-preference){
  .dl-sign.ok{animation:dlswing var(--sp) ease-in-out infinite alternate;animation-delay:var(--dl)}
  .dl-sign.no{animation:dlswing calc(var(--sp) * 1.6) ease-in-out infinite alternate;animation-delay:var(--dl)}
  .dl-lock{animation:dlswing 3.4s ease-in-out infinite alternate}
}
@keyframes dlswing{from{transform:rotate(calc(-1 * var(--amp,2.6deg)))}to{transform:rotate(var(--amp,2.6deg))}}
.dl-lock{position:absolute;left:50%;top:0;width:150px;margin-left:-75px;z-index:40;transform-origin:50% 0;--tilt:0deg;--amp:2deg;pointer-events:none}
.dl-lock::before{content:'';position:absolute;left:calc(50% - 2px);top:0;width:4px;height:var(--hang);background:#3a3550}
.dl-lock .pad{margin-top:var(--hang);width:150px;filter:drop-shadow(0 6px 0 rgba(28,22,64,.35))}
.dl-lock .pad svg{width:100%;height:auto;display:block}
.dl-lock .cnt{position:relative;margin:8px auto 0;width:max-content;padding:6px 14px;border-radius:14px;background:#fff;border:4px solid #1c1640;box-shadow:0 4px 0 #1c1640;text-align:center;font:900 26px/1 system-ui,sans-serif;color:#1c1640}
.dl-lock .cnt::before{content:'';position:absolute;left:50%;top:-14px;width:3px;height:12px;background:#3a3550}
.dl-ctr{position:absolute;left:0;right:0;bottom:0;height:196px;z-index:3}
.dl-case{position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(180deg,#bfe9ff 0%,#8fd0f2 60%,#6bb4dd 100%);border-top:5px solid #1c1640;overflow:hidden}
.dl-case::before{content:'';position:absolute;left:-10%;top:0;width:60%;height:100%;background:linear-gradient(110deg,rgba(255,255,255,.55),transparent 60%)}
.dl-case svg{position:absolute;left:0;right:0;bottom:0;width:100%;height:96px}
.dl-top{position:absolute;left:0;right:0;bottom:142px;height:20px;background:linear-gradient(#e0e4ee,#9aa1b5);border:4px solid #1c1640;border-left:0;border-right:0}
.dl-disp{position:absolute;left:16px;bottom:150px;width:112px;z-index:4;transform-origin:50% 100%}
.dl-disp svg{width:100%;height:auto;display:block}
.dl-wal{position:absolute;right:16px;bottom:154px;width:118px;z-index:4;transform-origin:50% 100%}
.dl-wal>svg{width:100%;height:auto;display:block}
.dl-wal .cn{position:absolute;left:42%;top:56%;transform:translate(-50%,-50%);display:flex}
.dl-wal .n{position:absolute;right:-6px;top:4px;min-width:42px;height:34px;padding:0 6px;border-radius:17px;background:#fff;border:4px solid #1c1640;display:flex;align-items:center;justify-content:center;gap:2px;font:900 17px/1 system-ui,sans-serif;box-shadow:0 3px 0 #1c1640}
.dl-wal .n svg{width:26px;height:auto}
.dl-zoom{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:rgba(18,14,40,.62)}
.dl-zoom .dl-bs{position:relative;flex:none;width:min(72vw,290px);height:calc(min(72vw,290px) * .72);--w:min(72vw,290px)}
.dl-zoom .dl-bs .dl-in{inset:12% 8% 14%}
.dl-zoom .dl-bs .dl-pr{font-size:min(14vw,56px);-webkit-text-stroke:6px #1c1640;gap:8px}
.dl-zoom .dl-bs .dl-pr .cn svg{width:min(17vw,66px)}
.dl-zoom .dl-bs .dl-bar{height:12px;border-width:2.5px}
.dl-buy{display:flex;align-items:center;gap:10px;padding:12px 22px 12px 16px;border-radius:22px;border:4px solid #1c1640;background:linear-gradient(#7ae86a,#3fbf4a);color:#fff;font-weight:900;font-size:26px;box-shadow:0 7px 0 #1c1640;-webkit-text-stroke:2px #1c1640;paint-order:stroke fill}
.dl-buy .cn{display:flex}.dl-buy .tk svg{width:58px;height:auto;display:block}
.dl-buy[disabled]{background:linear-gradient(#c9ced8,#9aa1b5);cursor:not-allowed}
.dl-buy:active:not([disabled]){transform:translateY(5px);box-shadow:0 2px 0 #1c1640}
@media (prefers-reduced-motion:no-preference){.dl-buy:not([disabled]){animation:dlpulse 1.2s ease-in-out infinite}}
@keyframes dlpulse{50%{transform:scale(1.06)}}
.dl-fly{position:absolute;z-index:30;pointer-events:none;left:0;top:0}
.dl-fly svg{display:block}
.dl-done{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);z-index:6;display:flex;flex-direction:column;align-items:center;gap:14px}
.dl-done .tkbig svg{width:150px;height:auto;filter:drop-shadow(0 6px 0 rgba(28,22,64,.4))}
.dl-done button{min-width:84px;height:64px;border-radius:22px;border:4px solid #1c1640;background:linear-gradient(#7ae86a,#3fbf4a);color:#fff;font-size:32px;font-weight:900;box-shadow:0 6px 0 #1c1640}
`;
  let root = null, C = null, O = {}, busy = false;
  const snd = (f, d, ty, v) => { if (C && C.blip) try { C.blip(f, d, ty, v); } catch (e) { /* no audio */ } };
  const fx = n => { const s = C && C.sfx; if (s && s[n]) try { s[n].apply(s, [].slice.call(arguments, 1)); } catch (e) { /* no audio */ } };
  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'deli'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Ticket deli');
    document.body.appendChild(root);
    root.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); if (root.querySelector('.dl-zoom')) unzoom(); else close(); } });
  }
  // every currency's price for the next ticket: the wallets the rules list first (they can pay), then every other skin's coin
  function signs(t) {
    const seen = new Set(t.pay.map(w => w.id)), out = t.pay.slice();
    C.skins.forEach(k => { if (!seen.has(k.id)) out.push({ id: k.id, spec: k, price: T().coinsFor(t.pts, k), bal: 0, ok: false, frac: 0 }); });
    return out;
  }
  function open(ctx, opts) {
    C = ctx; O = opts || {}; busy = false; build(); render();
    root._from = document.activeElement; root.classList.add('on');
    setTimeout(() => { const b = root.querySelector('.dl-sign.ok .dl-face') || root.querySelector('.dl-x'); if (b) b.focus(); }, 40);
    fx('sweep');
  }
  function close() {
    if (!root || !root.classList.contains('on')) return;
    root.classList.remove('on'); root.innerHTML = ''; busy = false;
    if (O.onClose) O.onClose(); if (root._from && root._from.focus) root._from.focus();
  }
  const isOn = () => !!(root && root.classList.contains('on'));
  function render() {
    const t = T().next(C), s = T().state(C.save);
    const H = innerHeight, W = innerWidth, top = 72, bot = 300, area = Math.max(240, H - top - bot);
    let h = '<div class="dl-awn"></div><button class="dl-x" aria-label="Close">✕</button>' +
      '<div class="dl-led" aria-label="Ticket ' + (t ? t.n : s.bought) + '">' + tk(34) + '<b>' + String(t ? t.n : s.bought).padStart(2, '0') + '</b></div><div class="dl-rail"></div><div class="dl-signs">';
    if (t) {
      const L = signs(t), rows = [4, 3, 4, 3, 4], rowH = Math.min(150, area / 3.9);
      let i = 0, r = 0;
      while (i < L.length) {
        const per = rows[r % rows.length], left = L.length - i, cnt = Math.min(per, left);
        for (let c = 0; c < cnt; c++, i++) {
          const w = L[i], ok = t.gateOk && w.ok, wpx = Math.round(Math.min(W / 4.1, 84 + hash(i, 3) * 22)), one = [1, 7].includes(i % SHAPES.length);
          const x = Math.max(wpx / 2 + 14, Math.min(W - wpx / 2 - 14, ((c + .5) / cnt) * W + (hash(i, 1) - .5) * (cnt === 4 ? 14 : 34)));
          const hang = 10 + r * rowH + hash(i, 2) * rowH * .3, tilt = ((hash(i, 4) - .5) * (one ? 18 : 6)).toFixed(1);
          const amp = Math.min(3, Math.atan(10 / (hang + 40)) * 180 / Math.PI) * (ok ? 1 : .3);   // the same small sway at the bottom of a long string
          h += '<div class="dl-sign ' + (ok ? 'ok' : 'no') + (one ? ' one' : '') + '" style="z-index:' + (20 - r) + ';left:' + x.toFixed(1) + 'px;--w:' + wpx + 'px;--hang:' + Math.round(hang) + 'px;--tilt:' + tilt + 'deg;--amp:' + amp.toFixed(2) + 'deg;--sp:' + (2.2 + hash(i, 5) * 1.8).toFixed(2) + 's;--dl:' + (-hash(i, 6) * 3).toFixed(2) + 's">' +
            '<button class="dl-face" data-w="' + esc(w.id) + '" aria-label="' + esc(fmt(w.price) + ' ' + S().coinOf(w.spec).plural) + (ok ? '' : ', ' + fmt(w.bal) + ' held') + '">' + signSvg(i) + face(w) + '</button></div>';
        }
        r++;
      }
      if (!t.gateOk) h += '<div class="dl-lock" style="--hang:' + Math.round(area * .3) + 'px" aria-label="Beat ' + t.gate + ' levels: ' + t.beaten + ' beaten"><div class="pad">' + LOCK + '</div><div class="cnt">🏁 ' + t.beaten + '/' + t.gate + '</div></div>';
    }
    h += '</div>';
    if (!t) h += '<div class="dl-done">' + (s.tickets > 0 ? '<span class="tkbig">' + tk(150) + '</span><button class="dl-back" aria-label="Back to the skins">↩</button>' : '<span style="font-size:96px">🏆</span>') + '</div>';
    h += '<div class="dl-ctr"><div class="dl-top"></div><div class="dl-case">' + caseArt() + '</div>' +
      '<div class="dl-disp">' + DISPENSER + '</div><div class="dl-wal" aria-label="Tickets: ' + s.tickets + '">' + WALLET + '<span class="cn"></span><span class="n">' + tk(26) + '<b>' + s.tickets + '</b></span></div></div>';
    root.innerHTML = h;
    root.querySelector('.dl-x').onclick = close;
    const back = root.querySelector('.dl-back'); if (back) back.onclick = close;
    root.querySelectorAll('.dl-face').forEach(b => b.onclick = () => zoom(b));
  }
  const face = (w, big) => '<span class="dl-in"><span class="dl-pr"><span class="cn">' + S().coinOf(w.spec).svg(26) + '</span>' + fmt(w.price) + '</span>' +
    '<span class="dl-bar" aria-hidden="true"><i style="width:' + (Math.min(1, w.bal / w.price) * 100).toFixed(1) + '%"></i></span></span>';
  // the glass case: cheese, salami, pickles and a stack of spare tickets
  function caseArt() {
    let g = '';
    for (let i = 0; i < 7; i++) {
      const x = 30 + i * 56, k = i % 4;
      if (k === 0) g += '<path d="M' + (x - 22) + ' 86L' + (x + 20) + ' 60 ' + (x + 24) + ' 86Z" fill="#ffd84a" stroke="#1c1640" stroke-width="3.5" stroke-linejoin="round"/><circle cx="' + (x + 6) + '" cy="78" r="3.5" fill="#e0b324"/>';
      else if (k === 1) g += '<ellipse cx="' + x + '" cy="76" rx="24" ry="13" fill="#c2414b" stroke="#1c1640" stroke-width="3.5"/><circle cx="' + (x - 8) + '" cy="74" r="3" fill="#f6c9c9"/><circle cx="' + (x + 7) + '" cy="79" r="2.6" fill="#f6c9c9"/>';
      else if (k === 2) g += '<rect x="' + (x - 9) + '" y="56" width="18" height="32" rx="9" fill="#62b04a" stroke="#1c1640" stroke-width="3.5"/><rect x="' + (x + 8) + '" y="62" width="16" height="26" rx="8" fill="#4e9a3a" stroke="#1c1640" stroke-width="3.5"/>';
      else g += '<g transform="translate(' + (x - 22) + ' 58) rotate(-8)">' + tk(44).replace('<svg', '<svg x="0" y="0"') + '</g>';
    }
    return '<svg viewBox="0 0 390 96" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect x="0" y="88" width="390" height="8" fill="#5b8fb0"/>' + g + '</svg>';
  }
  // ---- tap a sign: it comes forward with the purchase button
  let zoomFrom = null;
  function zoom(b) {
    if (busy) return;
    const t = T().next(C); if (!t) return;
    const w = signs(t).find(x => x.id === b.dataset.w); if (!w) return;
    const i = [...root.querySelectorAll('.dl-face')].indexOf(b), can = t.gateOk && w.ok;
    snd(can ? 740 : 330, .1, 'triangle', .05);
    if (!t.gateOk) { fx('nope'); const lk = root.querySelector('.dl-lock'); if (lk && lk.animate && !reduced()) lk.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(9deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(0)' }], { duration: 500 }); }
    const z = document.createElement('div'); z.className = 'dl-zoom';
    z.innerHTML = '<div class="dl-bs">' + signSvg(i) + face(w) + '</div>' +
      '<button class="dl-buy" ' + (can ? '' : 'disabled') + ' aria-label="Buy one ticket for ' + esc(fmt(w.price) + ' ' + S().coinOf(w.spec).plural) + '"><span class="tk">' + tk(58) + '</span>×1<span class="cn">' + S().coinOf(w.spec).svg(34) + '</span>' + fmt(w.price) + '</button>';
    root.appendChild(z); zoomFrom = b;
    const big = z.querySelector('.dl-bs'), r0 = b.getBoundingClientRect(), r1 = big.getBoundingClientRect();
    if (big.animate && !reduced()) {
      big.animate([{ transform: 'translate(' + (r0.left + r0.width / 2 - r1.left - r1.width / 2) + 'px,' + (r0.top + r0.height / 2 - r1.top - r1.height / 2) + 'px) scale(' + (r0.width / r1.width) + ')' }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      z.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    }
    z.onclick = e => { if (e.target === z) unzoom(); };
    const buyB = z.querySelector('.dl-buy');
    buyB.onclick = () => purchase(w.id);
    setTimeout(() => buyB.focus(), 30);
  }
  function unzoom() { const z = root.querySelector('.dl-zoom'); if (!z || busy) return; z.remove(); if (zoomFrom && zoomFrom.focus) zoomFrom.focus(); }
  // ---- the purchase: coins fly out of the wallet into the dispenser, it prints a ticket, the ticket swoops into the wallet
  const ctr = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  function flyer(html, x, y) { const d = document.createElement('div'); d.className = 'dl-fly'; d.innerHTML = html; root.appendChild(d); const r = d.getBoundingClientRect(); d.style.transform = 'translate(' + (x - r.width / 2) + 'px,' + (y - r.height / 2) + 'px)'; d._w = r.width; d._h = r.height; return d; }
  function arc(d, a, b, lift, dur, delay, extra) {     // a quadratic swoop from a to b, as WAAPI keyframes
    const k = [], n = 12, cx = (a[0] + b[0]) / 2, cy = Math.min(a[1], b[1]) - lift;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1];
      k.push({ transform: 'translate(' + (x - d._w / 2).toFixed(1) + 'px,' + (y - d._h / 2).toFixed(1) + 'px)' + (extra ? extra(t) : ''), offset: t });
    }
    return d.animate(k, { duration: dur, delay: delay || 0, easing: 'ease-in-out', fill: 'both' });
  }
  function purchase(id) {
    if (busy) return;
    const t = T().next(C), w = t && t.pay.find(x => x.id === id);
    if (!w || !T().buy(C, id)) { fx('nope'); return; }
    busy = true; root.classList.add('busy');
    const z = root.querySelector('.dl-zoom'), wal = root.querySelector('.dl-wal'), disp = root.querySelector('.dl-disp'), coin = S().coinOf(w.spec);
    wal.querySelector('.cn').innerHTML = coin.svg(30);
    const finish = () => {
      const s = T().state(C.save), n = wal.querySelector('.n b'); if (n) n.textContent = s.tickets;
      if (wal.animate && !reduced()) wal.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.32,1.2)' }, { transform: 'scale(.92,1.06)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' });
      fx('find'); setTimeout(() => fx('cheer'), 160); burst(ctr(wal));
      setTimeout(() => { busy = false; root.classList.remove('busy'); if (O.onBought) O.onBought(id); close(); }, reduced() ? 600 : 1100);
    };
    if (z) { if (z.animate && !reduced()) z.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }); setTimeout(() => z.remove(), 230); }
    if (reduced() || !document.body.animate) { setTimeout(finish, 250); return; }
    // coins: out of the wallet, over the counter, into the dispenser's slot
    const a = ctr(wal), slot = (() => { const r = disp.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * .62]; })();
    const N = 10;
    for (let i = 0; i < N; i++) {
      const c = flyer(coin.svg(30), a[0], a[1] - 10), d = 160 + i * 55;
      arc(c, [a[0] + (hash(i, 7) - .5) * 30, a[1] - 20], slot, 120 + hash(i, 8) * 90, 520, d, t => ' rotate(' + (t * 540).toFixed(0) + 'deg) scale(' + (1 - t * .5).toFixed(2) + ')').onfinish = () => c.remove();
      setTimeout(() => snd(880 * Math.pow(1.06, i), .07, 'triangle', .045), d + 500);
    }
    if (wal.animate) wal.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0)' }], { duration: 300, delay: 160, iterations: 2 });
    const tPrint = 160 + N * 55 + 480;
    // the dispenser shakes and prints
    setTimeout(() => {
      fx('thump'); disp.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg) scale(1.04)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(0)' }], { duration: 420 });
      const r = disp.getBoundingClientRect(), p = flyer(tk(84), r.left + r.width / 2, r.top + r.height * .62);
      p.style.zIndex = 3;   // under the dispenser's front: it comes out of the slot
      const base = 'translate(' + (r.left + r.width / 2 - p._w / 2) + 'px,' + (r.top + r.height * .62 - p._h / 2) + 'px)';
      p.animate([{ transform: base + ' translateY(0) scale(.6)', clipPath: 'inset(0 0 100% 0)' }, { transform: base + ' translateY(46px) scale(.9)', clipPath: 'inset(0 0 0 0)' }], { duration: 420, delay: 120, easing: 'steps(6, end)', fill: 'both' });
      [0, 70, 140, 210, 280, 350].forEach(d => setTimeout(() => snd(1900 + (d % 140) * 3, .03, 'square', .012), 120 + d));
      setTimeout(() => {
        p.style.zIndex = 31;
        const from = [r.left + r.width / 2, r.top + r.height * .62 + 46], to = ctr(wal);
        fx('sweep');
        arc(p, from, to, 260, 700, 0, t => ' rotate(' + (Math.sin(t * Math.PI) * 30 + t * 360).toFixed(0) + 'deg) scale(' + (.9 + Math.sin(t * Math.PI) * .7 - t * .5).toFixed(2) + ')').onfinish = () => { p.remove(); finish(); };
      }, 620);
    }, tPrint);
  }
  function burst(at) {
    if (reduced() || !document.body.animate) return;
    const col = ['#ff6a45', '#4aa8ff', '#ffd84a', '#62d96a', '#fff'];
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('div'); d.className = 'dl-fly';
      d.innerHTML = '<svg width="16" height="16" viewBox="-8 -8 16 16"><path d="M0-7L2 -2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill="' + col[i % 5] + '" stroke="#1c1640" stroke-width="1.4"/></svg>';
      root.appendChild(d);
      const a = i / 16 * Math.PI * 2, R = 60 + hash(i, 9) * 60;
      d.animate([{ transform: 'translate(' + (at[0] - 8) + 'px,' + (at[1] - 8) + 'px) scale(.4)', opacity: 1 }, { transform: 'translate(' + (at[0] - 8 + Math.cos(a) * R) + 'px,' + (at[1] - 8 + Math.sin(a) * R) + 'px) scale(1.2) rotate(180deg)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'forwards' }).onfinish = () => d.remove();
    }
  }
  window.FTH_DELI = { open, close, isOn, render: () => root && isOn() && render() };
})();
