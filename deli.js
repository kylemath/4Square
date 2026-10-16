/* deli.js: the ticket deli counter, opened from the 🎟️ shop (tickets.js). Buying a skin ticket, as a deli counter.
 *
 *   FTH_DELI.open(ctx, { onBought(), onClose() })      ctx: the shop's ticket ctx (tickets.js), plus blip / sfx for sound
 *
 * A counter scene with far too many hanging price signs, swinging on their strings: each sign is the price of ONE ticket
 * in one skin's coin (FTH_TICKETS.next(ctx).pay, and coinsFor for a wallet the player does not hold yet). Every skin has
 * its own sign, in the skin's reel order, so each currency keeps its place, shape and paint from one ticket to the next.
 * A sign the player cannot pay is dimmed and still; the coin of a skin the player has no ticket for yet is grey; a
 * currency that already bought its one ticket wears a SOLD OUT stamp. When the level gate is not met yet the counter
 * hangs a padlock with the level count; when no ticket is for sale (every locked skin has one waiting) the signs still
 * hang, none for sale. Tap a sign: it zooms forward with a PURCHASE button (🎟️ × 1 for that price). Tap it: FTH_TICKETS.buy, then coins
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
  // ---- sign shapes, drawn in a 100 x 72 box: a cast shadow, a dark slab for thickness, a gradient face, a bevel (light rim on
  // top, dark rim below), a gloss band, the outline. Signs the player can pay for carry a sheen that sweeps across now and then.
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
  // paints: [light, base, shade]
  const PAINT = [['#fff3a6', '#ffd84a', '#e0a114'], ['#ffad8f', '#ff6a45', '#c43d1c'], ['#b4f7a6', '#62d96a', '#2b9439'], ['#ffffff', '#eef1f8', '#b4bdd2'],
    ['#a8d8ff', '#4aa8ff', '#1d68c2'], ['#ffd0e8', '#ff8ec8', '#cc5396'], ['#ffdca3', '#ffb347', '#d6750f'], ['#e8d6ff', '#c9a0ff', '#8556d1']];
  const hash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const lg = (id, stops, x2, y2) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '">' +
    stops.map(([o, c, a]) => '<stop offset="' + o + '" stop-color="' + c + '"' + (a != null ? ' stop-opacity="' + a + '"' : '') + '/>').join('') + '</linearGradient>';
  // gradients and clips shared by every drawing in the deli (ids are global, so they live once in the page)
  const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    PAINT.map((p, i) => lg('dlp' + i, [[0, p[0]], [.5, p[1]], [1, p[2]]])).join('') +
    SHAPES.map((d, i) => '<clipPath id="dlc' + i + '"><path d="' + d + '"/></clipPath>').join('') +
    lg('dlgl', [[0, '#fff', .8], [1, '#fff', .08]]) +
    lg('dlsh', [[0, '#fff', 0], [.5, '#fff', .85], [1, '#fff', 0]], 1, 0) +
    lg('dlst', [[0, '#ffffff'], [.35, '#d3d8e4'], [.55, '#8d94a8'], [.8, '#c3c9d8'], [1, '#e9ecf3']]) +
    lg('dlsth', [[0, '#e9ecf3'], [.45, '#ffffff'], [.6, '#a3aabd'], [1, '#d3d8e4']], 1, 0) +
    lg('dlrd', [[0, '#ff9aa0'], [.35, '#ff4d5e'], [1, '#b81f33']]) +
    lg('dlgd', [[0, '#fff6b8'], [.4, '#ffd84a'], [1, '#d68f0c']]) +
    lg('dllt', [[0, '#d48b55'], [.5, '#a65d2c'], [1, '#6e3714']]) +
    lg('dlltd', [[0, '#9a5326'], [1, '#5a2a0e']]) +
    lg('dlch', [[0, '#fff2a8'], [.6, '#ffd84a'], [1, '#eaa915']]) +
    lg('dlsa', [[0, '#e8606b'], [.5, '#b02a36'], [1, '#741520']]) +
    lg('dlsc', [[0, '#ffb4b8'], [1, '#e2626f']]) +
    lg('dlpk', [[0, '#a9ec8a'], [.5, '#5cb840'], [1, '#2d7520']], 1, 1) +
    lg('dlcs', [[0, '#f2fbff'], [.25, '#c4ebff'], [1, '#78bde2']]) +
    lg('dlwd', [[0, '#c77a45'], [1, '#8a4a22']]) +
    lg('dllcd', [[0, '#3a3f52'], [1, '#14161e']]) +
    '<radialGradient id="dlglow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '</defs></svg>';
  function signSvg(i, ok) {
    const s = i % SHAPES.length, d = SHAPES[s], p = (i * 3 + 1) % PAINT.length, P = 'd="' + d + '"';
    return '<svg class="dl-shape" viewBox="0 0 100 72" preserveAspectRatio="none" aria-hidden="true">' +
      '<path ' + P + ' fill="#3a1e05" opacity=".2" transform="translate(5 11)"/>' +
      '<path ' + P + ' fill="#1c1640" transform="translate(0 5)"/>' +
      '<path ' + P + ' fill="url(#dlp' + p + ')"/>' +
      '<g clip-path="url(#dlc' + s + ')">' +
        '<path ' + P + ' fill="none" stroke="' + PAINT[p][2] + '" stroke-width="9" opacity=".75" transform="translate(0 -3)"/>' +
        '<path ' + P + ' fill="none" stroke="#fff" stroke-width="7" opacity=".6" transform="translate(0 3)"/>' +
        '<path d="M-5-5H105V22Q50 32-5 20Z" fill="url(#dlgl)" opacity=".75"/>' +
        (ok ? '<g class="dl-sheen"><rect x="-44" y="-10" width="22" height="92" fill="url(#dlsh)" transform="skewX(-18)"/></g>' : '') +
      '</g>' +
      '<path ' + P + ' fill="none" stroke="#1c1640" stroke-width="3.4" stroke-linejoin="round"/>' +
      (s === 3 ? '<circle cx="18" cy="36" r="5.5" fill="url(#dlst)" stroke="#1c1640" stroke-width="2.4"/><circle cx="18" cy="36" r="2.4" fill="#5a4d3a"/>' : '') + '</svg>';
  }
  const LOCK = '<svg viewBox="0 0 80 100" aria-hidden="true"><path d="M20 46V30a20 20 0 0 1 40 0v16" fill="none" stroke="#1c1640" stroke-width="14"/><path d="M20 46V30a20 20 0 0 1 40 0v16" fill="none" stroke="url(#dlsth)" stroke-width="7.5"/>' +
    '<path d="M22.5 40V30a17.5 17.5 0 0 1 9-15.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>' +
    '<rect x="6" y="42" width="68" height="52" rx="13" fill="#1c1640" transform="translate(0 5)"/><rect x="6" y="42" width="68" height="52" rx="13" fill="url(#dlgd)" stroke="#1c1640" stroke-width="4"/>' +
    '<rect x="11" y="47" width="58" height="42" rx="9" fill="none" stroke="#fff" stroke-width="2.5" opacity=".5"/><path d="M14 50h34" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".75"/>' +
    '<circle cx="15" cy="84" r="2.6" fill="#b87a08"/><circle cx="65" cy="84" r="2.6" fill="#b87a08"/><circle cx="15" cy="54" r="2.6" fill="#b87a08"/><circle cx="65" cy="54" r="2.6" fill="#b87a08"/>' +
    '<circle cx="40" cy="64" r="8.5" fill="#1c1640"/><path d="M40 66v15" stroke="#1c1640" stroke-width="8" stroke-linecap="round"/><circle cx="38" cy="62" r="2.4" fill="#fff" opacity=".35"/></svg>';
  const WALLET = '<svg viewBox="0 0 120 96" aria-hidden="true"><ellipse cx="60" cy="95" rx="54" ry="5" fill="#3a1e05" opacity=".3"/><rect x="8" y="22" width="104" height="70" rx="16" fill="#1c1640" transform="translate(0 5)"/>' +
    '<path d="M22 26l50-19 11 24z" fill="#ff5a7a" stroke="#1c1640" stroke-width="3.5" stroke-linejoin="round"/><path d="M28 18l40-15" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>' +
    '<path d="M36 24l44-13 6 15z" fill="#ffd84a" stroke="#1c1640" stroke-width="3.5" stroke-linejoin="round"/><path d="M60 16l3 10" stroke="#1c1640" stroke-width="1.6" stroke-dasharray="2.5 2.5"/>' +
    '<rect x="8" y="22" width="104" height="70" rx="16" fill="url(#dllt)" stroke="#1c1640" stroke-width="4"/>' +
    '<rect x="14" y="28" width="92" height="58" rx="11" fill="none" stroke="#f3c08a" stroke-width="1.8" stroke-dasharray="4 3.4" opacity=".8"/>' +
    '<path d="M20 31h56" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>' +
    '<rect x="68" y="42" width="48" height="34" rx="11" fill="#1c1640" transform="translate(0 3)"/><rect x="68" y="42" width="48" height="34" rx="11" fill="url(#dlltd)" stroke="#1c1640" stroke-width="4"/>' +
    '<rect x="73" y="47" width="38" height="24" rx="7" fill="none" stroke="#e0a66e" stroke-width="1.6" stroke-dasharray="3.4 3" opacity=".75"/>' +
    '<circle cx="88" cy="59" r="8" fill="url(#dlgd)" stroke="#1c1640" stroke-width="3"/><circle cx="85.5" cy="56.5" r="2.4" fill="#fff" opacity=".85"/></svg>';
  const DISPENSER = '<svg viewBox="0 0 120 132" aria-hidden="true"><ellipse cx="60" cy="124" rx="48" ry="7" fill="#3a1e05" opacity=".3"/>' +
    '<path d="M32 96h56l6 26H26z" fill="url(#dlsth)" stroke="#1c1640" stroke-width="4" stroke-linejoin="round"/><path d="M34 102h52" stroke="#fff" stroke-width="2.5" opacity=".8"/>' +
    '<path d="M60 10a44 44 0 0 1 44 44v26a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16V54A44 44 0 0 1 60 10z" fill="#1c1640" transform="translate(0 5)"/>' +
    '<path d="M60 10a44 44 0 0 1 44 44v26a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16V54A44 44 0 0 1 60 10z" fill="url(#dlrd)" stroke="#1c1640" stroke-width="4"/>' +
    '<path d="M96 52a36 36 0 0 1-3 38" stroke="#8a1424" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>' +
    '<ellipse cx="40" cy="30" rx="16" ry="8" transform="rotate(-38 40 30)" fill="#fff" opacity=".55"/><circle cx="57" cy="19" r="3" fill="#fff" opacity=".7"/>' +
    '<ellipse cx="60" cy="9" rx="11" ry="5" fill="url(#dlst)" stroke="#1c1640" stroke-width="3.5"/>' +
    '<circle cx="60" cy="50" r="21" fill="url(#dlst)" stroke="#1c1640" stroke-width="4"/><circle cx="60" cy="50" r="15" fill="url(#dllcd)" stroke="#1c1640" stroke-width="2.5"/>' +
    '<text x="60" y="59" text-anchor="middle" font-size="24" font-weight="900" fill="#ff5a66" font-family="system-ui,sans-serif" style="filter:drop-shadow(0 0 3px rgba(255,90,102,.9))">#</text>' +
    '<path d="M48 42a13 13 0 0 1 10-6" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".5"/>' +
    '<rect x="20" y="72" width="80" height="16" rx="5" fill="url(#dlst)" stroke="#1c1640" stroke-width="3.5"/>' +
    '<rect x="32" y="76.5" width="56" height="7" rx="3.5" fill="#1c1640"/><rect x="34" y="78" width="52" height="2" rx="1" fill="#ff7a86" opacity=".7"/>' +
    '<circle cx="25.5" cy="80" r="2" fill="#5b6075"/><circle cx="94.5" cy="80" r="2" fill="#5b6075"/></svg>';

  // CSS art: the shop wall's subway tiles and the awning's scalloped valance, as small SVG tiles
  const uri = s => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  const TILE = uri('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#f2e3c3"/></linearGradient></defs>' +
    '<rect width="64" height="64" fill="#d9c49c"/><g fill="url(#g)"><rect x="1.5" y="1.5" width="61" height="29" rx="5"/><rect x="-30.5" y="33.5" width="61" height="29" rx="5"/><rect x="33.5" y="33.5" width="61" height="29" rx="5"/></g>' +
    '<g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M7 5.5h30"/><path d="M39 37.5h22"/><path d="M3 37.5h12"/></g></svg>');
  const VALANCE = uri('<svg xmlns="http://www.w3.org/2000/svg" width="68" height="24"><defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a66"/><stop offset="1" stop-color="#b81f33"/></linearGradient>' +
    '<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6cdbf"/></linearGradient></defs>' +
    '<path d="M1.2 0A16 17 0 0 0 32.8 0Z" fill="url(#r)" stroke="#1c1640" stroke-width="2.4"/><path d="M35.2 0A16 17 0 0 0 66.8 0Z" fill="url(#w)" stroke="#1c1640" stroke-width="2.4"/>' +
    '<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M6 3a12 12 0 0 0 6 9" opacity=".55"/><path d="M40 3a12 12 0 0 0 6 9" opacity=".9"/></g></svg>');
  const SPARK = uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24"><path d="M0-11C1 -3 3-1 11 0 3 1 1 3 0 11-1 3-3 1-11 0-3-1-1-3 0-11Z" fill="#fff" stroke="#1c1640" stroke-width="1.6" stroke-linejoin="round"/></svg>');
  const CSS = `
#deli{position:fixed;inset:0;z-index:80;display:none;overflow:hidden;font-family:var(--sk-font,system-ui,sans-serif);color:#1c1640;user-select:none;-webkit-user-select:none;
  background:radial-gradient(90% 55% at 50% 4%,rgba(255,214,140,.55),rgba(255,214,140,0) 70%),radial-gradient(150% 100% at 50% 38%,rgba(90,45,10,0) 52%,rgba(90,45,10,.42)),
    linear-gradient(180deg,rgba(90,45,10,0) 55%,rgba(90,45,10,.22)),${TILE} 0 0/64px 64px,#f3e4c3}
#deli.on{display:block}
#deli *{box-sizing:border-box}
#deli button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#deli :focus-visible{outline:4px solid #4aa8ff;outline-offset:3px}
.dl-awn{position:absolute;left:0;right:0;top:0;height:calc(58px + env(safe-area-inset-top));z-index:5;border-bottom:3px solid #1c1640;
  background:linear-gradient(180deg,#5b6075 0 4px,rgba(255,255,255,.35) 4px,rgba(255,255,255,0) 40%,rgba(80,0,20,0) 62%,rgba(80,0,20,.26)),
    repeating-linear-gradient(90deg,#d42a3a 0,#ff5c68 9px,#ff4d5e 22px,#c71f31 34px,#e2d9cb 34px,#fff 44px,#fbf8f2 56px,#d4cbbc 68px)}
.dl-awn::after{content:'';position:absolute;left:0;right:0;bottom:-24px;height:24px;background:${VALANCE} 0 0/68px 24px;filter:drop-shadow(0 8px 6px rgba(70,30,0,.28))}
.dl-x{position:absolute;left:12px;top:calc(8px + env(safe-area-inset-top));z-index:7;width:46px;height:46px;border-radius:50%;border:4px solid #1c1640;
  background:radial-gradient(circle at 38% 30%,#fff 0 40%,#dfe3ee 100%);color:#1c1640;font-size:22px;font-weight:900;line-height:1;box-shadow:0 4px 0 #1c1640,inset 0 -4px 0 rgba(28,22,64,.14)}
.dl-x:active{transform:translateY(3px);box-shadow:0 1px 0 #1c1640}
.dl-led{position:absolute;right:12px;top:calc(9px + env(safe-area-inset-top));z-index:7;display:flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:12px;border:4px solid #1c1640;
  background:linear-gradient(#3a3f52,#14161e);box-shadow:0 4px 0 #1c1640,inset 0 2px 0 rgba(255,255,255,.18),inset 0 0 0 2px #5b6075;overflow:hidden}
.dl-led::after{content:'';position:absolute;left:0;right:0;top:0;height:45%;background:linear-gradient(rgba(255,255,255,.2),rgba(255,255,255,0));pointer-events:none}
.dl-led b{font:900 26px/1 ui-monospace,'SF Mono',Menlo,monospace;color:#ff5a66;text-shadow:0 0 6px rgba(255,77,94,.95),0 0 16px rgba(255,77,94,.6);letter-spacing:.06em}
.dl-rail{position:absolute;left:0;right:0;top:calc(66px + env(safe-area-inset-top));height:12px;z-index:3;border-top:2.5px solid #1c1640;border-bottom:2.5px solid #1c1640;
  background:linear-gradient(#ffffff 0,#d3d8e4 30%,#8d94a8 62%,#5b6075 82%,#aab1c4 100%);box-shadow:0 7px 9px rgba(70,30,0,.28)}
.dl-rail::before,.dl-rail::after{content:'';position:absolute;top:-9px;width:12px;height:26px;border-radius:4px;border:2.5px solid #1c1640;background:linear-gradient(90deg,#8d94a8,#fff 45%,#8d94a8)}
.dl-rail::before{left:14%}.dl-rail::after{right:14%}
.dl-signs{position:absolute;left:0;right:0;top:calc(74px + env(safe-area-inset-top));bottom:196px;z-index:2}
.dl-sign{position:absolute;top:0;width:var(--w);margin-left:calc(var(--w) * -.5);transform-origin:50% 0;pointer-events:none}
.dl-sign::before,.dl-sign::after{content:'';position:absolute;top:0;width:2.5px;height:calc(var(--hang) + 8px);background:linear-gradient(90deg,#4a3e2c,#b09a76 50%,#4a3e2c);box-shadow:3px 4px 2px rgba(70,30,0,.16)}
.dl-sign::before{left:28%}.dl-sign::after{right:28%}
.dl-sign.one::before{left:calc(50% - 1px)}.dl-sign.one::after{display:none}
.dl-face{position:relative;margin-top:var(--hang);width:100%;aspect-ratio:100/72;border:0;padding:0;background:none;pointer-events:auto;display:block;transform:rotate(var(--tilt));transform-origin:50% 0}
.dl-face:active{transform:rotate(var(--tilt)) scale(.94)}
.dl-shape{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.dl-in{position:absolute;inset:12% 8% 14%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.dl-pr{display:flex;align-items:center;gap:3px;font-weight:900;font-size:calc(var(--w) * .2);line-height:1;color:#fff;-webkit-text-stroke:3px #1c1640;paint-order:stroke fill;letter-spacing:.01em;text-shadow:0 2px 0 #1c1640}
.dl-pr .cn{display:flex;-webkit-text-stroke:0;filter:drop-shadow(0 2px 0 rgba(28,22,64,.5))}.dl-pr .cn svg{width:calc(var(--w) * .26);height:auto}
.dl-bar{width:62%;height:7px;border-radius:9px;background:linear-gradient(rgba(28,22,64,.55),rgba(28,22,64,.3));overflow:hidden;border:1.5px solid #1c1640}
.dl-bar i{display:block;height:100%;background:linear-gradient(#b4f7a6,#4fcf4f 55%,#2b9439);box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
.dl-sign.no .dl-face{filter:saturate(.3) brightness(.8);opacity:.88}
.dl-sign.grey .dl-face{filter:grayscale(1) brightness(.82);opacity:.8}
.dl-sign.sold .dl-face{filter:saturate(.5) brightness(.88);opacity:.95}
.dl-sold{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-14deg);padding:.18em .4em;border-radius:.3em;border:max(2px,calc(var(--w) * .03)) solid #d1162c;
  background:rgba(255,255,255,.9);color:#d1162c;font:900 calc(var(--w) * .14)/1 system-ui,sans-serif;letter-spacing:.04em;white-space:nowrap;box-shadow:0 2px 0 rgba(28,22,64,.45);pointer-events:none}
.dl-sign.ok{z-index:25 !important}   /* in front of its neighbours (the rows set z-index inline) */
.dl-sign.ok .dl-face{filter:drop-shadow(0 0 7px rgba(255,236,140,.95)) drop-shadow(0 0 16px rgba(255,190,40,.7))}
.dl-sheen{transform:translateX(-30px)}
.dl-sign.ok .dl-face::after{content:'';position:absolute;right:-6%;top:-12%;width:26%;aspect-ratio:1;background:${SPARK} center/contain no-repeat;pointer-events:none;transform:scale(.9)}
@media (prefers-reduced-motion:no-preference){
  .dl-sign.ok{animation:dlswing var(--sp) ease-in-out infinite alternate;animation-delay:var(--dl)}
  .dl-sign.no{animation:dlswing calc(var(--sp) * 1.6) ease-in-out infinite alternate;animation-delay:var(--dl)}
  .dl-lock{animation:dlswing 3.4s ease-in-out infinite alternate}
  .dl-sheen{animation:dlsheen 3.2s ease-in-out infinite}
  .dl-sign.ok .dl-face::after{animation:dltwinkle 1.6s ease-in-out infinite}
}
@keyframes dlswing{from{transform:rotate(calc(-1 * var(--amp,2.6deg)))}to{transform:rotate(var(--amp,2.6deg))}}
@keyframes dltwinkle{0%,100%{transform:scale(.35) rotate(0);opacity:.4}50%{transform:scale(1.05) rotate(45deg);opacity:1}}
@keyframes dlsheen{0%,55%{transform:translateX(-30px)}85%,100%{transform:translateX(190px)}}
.dl-lock{position:absolute;left:50%;top:0;width:150px;margin-left:-75px;z-index:40;transform-origin:50% 0;--tilt:0deg;--amp:2deg;pointer-events:none}
.dl-lock::before{content:'';position:absolute;left:calc(50% - 3px);top:0;width:6px;height:var(--hang);border-radius:3px;border:1.5px solid #1c1640;
  background:repeating-linear-gradient(180deg,#eef1f7 0 3px,#8d94a8 3px 7px,#3a3f52 7px 9px)}
.dl-lock .pad{margin-top:var(--hang);width:150px;filter:drop-shadow(0 10px 8px rgba(70,30,0,.3))}
.dl-lock .pad svg{width:100%;height:auto;display:block}
.dl-lock .cnt{position:relative;margin:8px auto 0;width:max-content;padding:6px 14px;border-radius:14px;background:linear-gradient(#fff,#e6e9f2);border:4px solid #1c1640;box-shadow:0 4px 0 #1c1640,inset 0 -3px 0 rgba(28,22,64,.1);text-align:center;font:900 26px/1 system-ui,sans-serif;color:#1c1640}
.dl-lock .cnt::before{content:'';position:absolute;left:50%;top:-14px;width:3px;height:12px;background:#3a3550}
.dl-ctr{position:absolute;left:0;right:0;bottom:0;height:196px;z-index:3}
.dl-case{position:absolute;left:0;right:0;bottom:0;height:150px;border-top:4px solid #1c1640;overflow:hidden;background:#78bde2}
.dl-case svg{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.dl-top{position:absolute;left:0;right:0;bottom:146px;height:22px;border:4px solid #1c1640;border-left:0;border-right:0;
  background:linear-gradient(#ffffff 0,#e9ecf3 30%,#b9c0d0 58%,#8d94a8 100%);box-shadow:0 -10px 16px rgba(70,30,0,.18)}
.dl-top::after{content:'';position:absolute;left:0;right:0;top:3px;height:2px;background:rgba(255,255,255,.9)}
.dl-disp{position:absolute;left:16px;bottom:154px;width:112px;z-index:4;transform-origin:50% 100%}
.dl-disp svg{width:100%;height:auto;display:block;overflow:visible}
.dl-wal{position:absolute;right:16px;bottom:160px;width:118px;z-index:4;transform-origin:50% 100%}
.dl-wal>svg{width:100%;height:auto;display:block;overflow:visible}
.dl-wal .cn{position:absolute;left:42%;top:56%;transform:translate(-50%,-50%);display:flex}
.dl-wal .n{position:absolute;right:-6px;top:4px;min-width:42px;height:34px;padding:0 6px;border-radius:17px;background:linear-gradient(#fff,#e6e9f2);border:4px solid #1c1640;display:flex;align-items:center;justify-content:center;gap:2px;font:900 17px/1 system-ui,sans-serif;box-shadow:0 3px 0 #1c1640}
.dl-wal .n svg{width:26px;height:auto}
.dl-zoom{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;overflow:hidden;
  background:radial-gradient(circle at 50% 44%,rgba(70,50,150,.55),rgba(14,10,36,.88) 70%)}
.dl-zoom::before{content:'';position:absolute;left:50%;top:calc(50% - 52px);width:170vmax;height:170vmax;margin:-85vmax 0 0 -85vmax;pointer-events:none;
  background:repeating-conic-gradient(from 0deg,rgba(255,226,130,.2) 0 8deg,rgba(255,226,130,0) 8deg 22.5deg);
  -webkit-mask:radial-gradient(circle,#000 0,rgba(0,0,0,.6) 18%,transparent 34%);mask:radial-gradient(circle,#000 0,rgba(0,0,0,.6) 18%,transparent 34%)}
@media (prefers-reduced-motion:no-preference){.dl-zoom::before{animation:dlrays 24s linear infinite}}
@keyframes dlrays{to{transform:rotate(360deg)}}
.dl-zoom .dl-bs{position:relative;flex:none;width:min(72vw,290px);height:calc(min(72vw,290px) * .72);--w:min(72vw,290px);filter:drop-shadow(0 16px 18px rgba(0,0,0,.45))}
.dl-zoom .dl-bs .dl-in{inset:12% 8% 14%}
.dl-zoom .dl-bs .dl-pr{font-size:min(14vw,56px);-webkit-text-stroke:6px #1c1640;gap:8px;text-shadow:0 4px 0 #1c1640}
.dl-zoom .dl-bs .dl-pr .cn svg{width:min(17vw,66px)}
.dl-zoom .dl-bs .dl-bar{height:13px;border-width:2.5px}
.dl-buy{position:relative;display:flex;align-items:center;gap:10px;padding:12px 22px 12px 16px;border-radius:22px;border:4px solid #1c1640;overflow:hidden;
  background:linear-gradient(#a6f59a,#4fcf4f 48%,#2fa83c);color:#fff;font-weight:900;font-size:26px;-webkit-text-stroke:2px #1c1640;paint-order:stroke fill;text-shadow:0 2px 0 #1c1640;
  box-shadow:0 7px 0 #1c1640,0 14px 22px rgba(0,0,0,.4),inset 0 -5px 0 rgba(0,70,20,.28)}
.dl-buy::before{content:'';position:absolute;left:10px;right:10px;top:4px;height:38%;border-radius:14px;background:linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,.08));pointer-events:none}
.dl-buy>*{position:relative}
.dl-buy .cn{display:flex}.dl-buy .tk svg{width:58px;height:auto;display:block;filter:drop-shadow(0 2px 0 rgba(28,22,64,.45))}
.dl-buy[disabled]{background:linear-gradient(#d9dde6,#a3aabd);cursor:not-allowed}
.dl-buy:active:not([disabled]){transform:translateY(5px);box-shadow:0 2px 0 #1c1640,inset 0 -5px 0 rgba(0,70,20,.28)}
@media (prefers-reduced-motion:no-preference){.dl-buy:not([disabled]){animation:dlpulse 1.2s ease-in-out infinite}}
@keyframes dlpulse{50%{transform:scale(1.06)}}
.dl-fly{position:absolute;z-index:30;pointer-events:none;left:0;top:0}
.dl-fly svg{display:block}
.dl-done{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);z-index:6;display:flex;flex-direction:column;align-items:center;gap:14px}
.dl-done .tkbig svg{width:150px;height:auto;filter:drop-shadow(0 6px 0 rgba(28,22,64,.4)) drop-shadow(0 0 18px rgba(255,216,74,.8))}
.dl-done button{min-width:84px;height:64px;border-radius:22px;border:4px solid #1c1640;background:linear-gradient(#a6f59a,#4fcf4f 48%,#2fa83c);color:#fff;font-size:32px;font-weight:900;
  -webkit-text-stroke:2px #1c1640;paint-order:stroke fill;box-shadow:0 6px 0 #1c1640,inset 0 -5px 0 rgba(0,70,20,.28),inset 0 3px 0 rgba(255,255,255,.45)}
`;
  let root = null, C = null, O = {}, busy = false;
  const snd = (f, d, ty, v) => { if (C && C.blip) try { C.blip(f, d, ty, v); } catch (e) { /* no audio */ } };
  const fx = n => { const s = C && C.sfx; if (s && s[n]) try { s[n].apply(s, [].slice.call(arguments, 1)); } catch (e) { /* no audio */ } };
  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', DEFS);
    root = document.createElement('div'); root.id = 'deli'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Ticket deli');
    document.body.appendChild(root);
    root.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); if (root.querySelector('.dl-zoom')) unzoom(); else close(); } });
  }
  // every currency's price for the next ticket, one sign per skin in a fixed order (the reel's), so a purchase never moves a
  // sign: a wallet the rules list (t.pay) as it is, a skin the player has no ticket for yet grey, and a wallet that already
  // bought its one ticket (t.used) stamped SOLD OUT instead of a progress bar
  function signs(t) {
    const pay = new Map(t.pay.map(w => [w.id, w])), used = t.used || [];
    return (C.order || C.skins).map(k => used.includes(k.id) ? { id: k.id, spec: k, price: T().coinsFor(t.pts, k), bal: 0, ok: false, frac: 0, used: true }
      : pay.get(k.id) || { id: k.id, spec: k, price: T().coinsFor(t.pts, k), bal: 0, ok: false, frac: 0, grey: true });
  }
  // the ticket the signs price: the next one, or when next() is null (every locked skin has a ticket waiting, or none is
  // left), the one after the last bought, with nothing for sale, so the signs stay up in their places
  function priced() {
    const t = T().next(C); if (t) return t;
    const s = T().state(C.save), G = T().GATE, P = T().PRICE, n = Math.min(s.bought + 1, G.length);
    const pay = C.skins.filter(k => !s.paid.includes(k.id) && T().owns(C.save, k.id)).map(k => ({ id: k.id, spec: k, price: T().coinsFor(P[n - 1], k), bal: 0, ok: false, frac: 0 }))
      .map(w => { w.bal = ((C.save.wallet || {})[w.id] || {}).bal || 0; w.frac = Math.min(1, w.bal / w.price); return w; });
    return { n, gate: G[n - 1], beaten: C.beaten(), gateOk: true, pts: P[n - 1], pay, used: s.paid.slice(), idle: true };
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
    const t = T().next(C), s = T().state(C.save), v = priced();
    const H = innerHeight, W = innerWidth, top = 72, bot = 300, area = Math.max(240, H - top - bot);
    let h = '<div class="dl-awn"></div><button class="dl-x" aria-label="Close">✕</button>' +
      '<div class="dl-led" aria-label="Ticket ' + (t ? t.n : s.bought) + '">' + tk(34) + '<b>' + String(t ? t.n : s.bought).padStart(2, '0') + '</b></div><div class="dl-rail"></div><div class="dl-signs">';
    {
      const L = signs(v), rows = [4, 3, 4, 3, 4], rowH = Math.min(150, area / 3.9);
      let i = 0, r = 0;
      while (i < L.length) {
        const per = rows[r % rows.length], left = L.length - i, cnt = Math.min(per, left);
        for (let c = 0; c < cnt; c++, i++) {
          const w = L[i], ok = v.gateOk && w.ok, wpx = Math.round(Math.min(W / 4.1, 84 + hash(i, 3) * 22)), one = [1, 7].includes(i % SHAPES.length);
          const x = Math.max(wpx / 2 + 14, Math.min(W - wpx / 2 - 14, ((c + .5) / cnt) * W + (hash(i, 1) - .5) * (cnt === 4 ? 14 : 34)));
          const hang = 10 + r * rowH + hash(i, 2) * rowH * .3, tilt = ((hash(i, 4) - .5) * (one ? 18 : 6)).toFixed(1);
          const amp = Math.min(3, Math.atan(10 / (hang + 40)) * 180 / Math.PI) * (ok ? 1 : .3);   // the same small sway at the bottom of a long string
          h += '<div class="dl-sign ' + (ok ? 'ok' : 'no') + (w.used ? ' sold' : w.grey ? ' grey' : '') + (one ? ' one' : '') + '" style="z-index:' + (20 - r) + ';left:' + x.toFixed(1) + 'px;--w:' + wpx + 'px;--hang:' + Math.round(hang) + 'px;--tilt:' + tilt + 'deg;--amp:' + amp.toFixed(2) + 'deg;--sp:' + (2.2 + hash(i, 5) * 1.8).toFixed(2) + 's;--dl:' + (-hash(i, 6) * 3).toFixed(2) + 's">' +
            '<button class="dl-face" data-w="' + esc(w.id) + '" aria-label="' + esc(fmt(w.price) + ' ' + S().coinOf(w.spec).plural) + (w.used ? ', sold out' : w.grey ? ', locked' : ok ? '' : ', ' + fmt(w.bal) + ' held') + '">' + signSvg(i, ok) + face(w) + '</button></div>';
        }
        r++;
      }
      if (t && !t.gateOk) h += '<div class="dl-lock" style="--hang:' + Math.round(area * .3) + 'px" aria-label="Beat ' + t.gate + ' levels: ' + t.beaten + ' beaten"><div class="pad">' + LOCK + '</div><div class="cnt">🏁 ' + t.beaten + '/' + t.gate + '</div></div>';
    }
    h += '</div>';
    if (!t) h += '<div class="dl-done">' + (s.tickets > 0 ? '<span class="tkbig">' + tk(150) + '</span><button class="dl-back" aria-label="Back to the skins">↩</button>' : '<span style="font-size:96px">🏆</span>') + '</div>';
    h += '<div class="dl-ctr"><div class="dl-top"></div><div class="dl-case">' + caseArt(W) + '</div>' +
      '<div class="dl-disp">' + DISPENSER + '</div><div class="dl-wal" aria-label="Tickets: ' + s.tickets + '">' + WALLET + '<span class="cn"></span><span class="n">' + tk(26) + '<b>' + s.tickets + '</b></span></div></div>';
    root.innerHTML = h;
    root.querySelector('.dl-x').onclick = close;
    const back = root.querySelector('.dl-back'); if (back) back.onclick = close;
    root.querySelectorAll('.dl-face').forEach(b => b.onclick = () => zoom(b));
  }
  const face = (w, big) => '<span class="dl-in"><span class="dl-pr"><span class="cn">' + S().coinOf(w.spec).svg(26) + '</span>' + fmt(w.price) + '</span>' +
    (w.used ? '<span class="dl-sold" aria-hidden="true">SOLD OUT</span>' : '<span class="dl-bar" aria-hidden="true"><i style="width:' + (Math.min(1, w.bal / w.price) * 100).toFixed(1) + '%"></i></span>') + '</span>';
  // the glass case, drawn at the screen's width: a lit cabinet of cheese, salami, pickles, olives and spare tickets on a steel
  // tray, glass glare over the front, a steel sill and a panelled wooden base with a gold trim
  function caseArt(W) {
    W = Math.max(320, Math.round(W)); const q = n => n.toFixed(1), H = 150, Y = 94;
    const shadow = (x, rx) => '<ellipse cx="' + q(x) + '" cy="' + (Y + 1) + '" rx="' + rx + '" ry="4" fill="#1d4a68" opacity=".28"/>';
    const FOOD = [
      x => shadow(x, 28) + '<path d="M' + q(x + 20) + ' ' + Y + 'L' + q(x + 28) + ' ' + (Y - 4) + 'V' + (Y - 27) + 'L' + q(x + 20) + ' ' + (Y - 31) + 'Z" fill="#e8a414" stroke="#1c1640" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M' + q(x - 26) + ' ' + Y + 'H' + q(x + 20) + 'V' + (Y - 31) + 'Z" fill="url(#dlch)" stroke="#1c1640" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M' + q(x - 18) + ' ' + (Y - 6) + 'L' + q(x + 15) + ' ' + (Y - 28) + '" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>' +
        [[6, -9, 4], [13, -18, 2.6], [-4, -4, 2.4], [15, -6, 3]].map(([dx, dy, r]) => '<ellipse cx="' + q(x + dx) + '" cy="' + (Y + dy) + '" rx="' + r + '" ry="' + (r * .8) + '" fill="#d99610"/><path d="M' + q(x + dx - r * .7) + ' ' + q(Y + dy + r * .45) + 'a' + r + ' ' + (r * .8) + ' 0 0 0 ' + q(r * 1.4) + ' 0" stroke="#fff4b8" stroke-width="1.2" fill="none"/>').join(''),
      x => shadow(x, 32) + '<rect x="' + q(x - 28) + '" y="' + (Y - 21) + '" width="42" height="21" rx="10" fill="url(#dlsa)" stroke="#1c1640" stroke-width="3"/>' +
        '<path d="M' + q(x - 22) + ' ' + (Y - 16) + 'H' + q(x + 4) + '" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>' +
        '<path d="M' + q(x - 14) + ' ' + (Y - 21) + 'v21M' + q(x - 2) + ' ' + (Y - 21) + 'v21" stroke="#f3d9b0" stroke-width="1.6" opacity=".7"/>' +
        '<ellipse cx="' + q(x + 13) + '" cy="' + (Y - 10.5) + '" rx="7" ry="10" fill="url(#dlsc)" stroke="#1c1640" stroke-width="3"/>' +
        '<ellipse cx="' + q(x + 26) + '" cy="' + (Y - 7) + '" rx="6" ry="7.5" fill="url(#dlsc)" stroke="#1c1640" stroke-width="2.6" transform="rotate(14 ' + q(x + 26) + ' ' + (Y - 7) + ')"/>' +
        [[11, -14], [15, -8], [12, -5], [25, -9], [27, -5]].map(([dx, dy]) => '<circle cx="' + q(x + dx) + '" cy="' + (Y + dy) + '" r="1.4" fill="#fff3ea"/>').join(''),
      x => shadow(x, 22) + '<g transform="rotate(-10 ' + q(x - 6) + ' ' + (Y - 14) + ')"><rect x="' + q(x - 14) + '" y="' + (Y - 32) + '" width="15" height="31" rx="7.5" fill="url(#dlpk)" stroke="#1c1640" stroke-width="3"/><path d="M' + q(x - 10) + ' ' + (Y - 26) + 'v16" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/></g>' +
        '<g transform="rotate(12 ' + q(x + 9) + ' ' + (Y - 13) + ')"><rect x="' + q(x + 2) + '" y="' + (Y - 27) + '" width="14" height="26" rx="7" fill="url(#dlpk)" stroke="#1c1640" stroke-width="3"/><path d="M' + q(x + 5.5) + ' ' + (Y - 21) + 'v12" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/></g>' +
        [[-7, -22], [-4, -12], [8, -18], [11, -9]].map(([dx, dy]) => '<circle cx="' + q(x + dx) + '" cy="' + (Y + dy) + '" r="1.5" fill="#d9ffc4" opacity=".8"/>').join(''),
      x => shadow(x, 26) + '<ellipse cx="' + q(x) + '" cy="' + (Y - 12) + '" rx="24" ry="5" fill="#5b6075"/>' +
        [[-13, -15, '#5b8a22'], [0, -18, '#2c2338'], [13, -15, '#5b8a22'], [-6, -22, '#6c9c2a'], [7, -22, '#2c2338']].map(([dx, dy, c]) => '<circle cx="' + q(x + dx) + '" cy="' + (Y + dy) + '" r="6.2" fill="' + c + '" stroke="#1c1640" stroke-width="2.2"/><circle cx="' + q(x + dx - 2) + '" cy="' + (Y + dy - 2) + '" r="1.7" fill="#fff" opacity=".7"/>').join('') +
        '<path d="M' + q(x - 24) + ' ' + (Y - 12) + 'A24 13 0 0 0 ' + q(x + 24) + ' ' + (Y - 12) + 'Z" fill="url(#dlst)" stroke="#1c1640" stroke-width="3" stroke-linejoin="round"/><path d="M' + q(x - 16) + ' ' + (Y - 7) + 'q8 5 18 4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>',
      x => shadow(x, 26) + [[-24, -30, -12], [-20, -27, -3], [-16, -26, 7]].map(([dx, dy, r]) => '<g transform="translate(' + q(x + dx) + ' ' + (Y + dy) + ') rotate(' + r + ')">' + tk(42).replace('<svg', '<svg x="0" y="0"') + '</g>').join(''),
    ];
    let food = '', glare = '', base = '';
    for (let i = 0, x = 44; x < W + 40; i++, x += 92) food += '<g transform="translate(' + x + ' ' + Y + ') scale(1.4) translate(' + -x + ' ' + -Y + ')">' + FOOD[i % FOOD.length](x) + '</g>';
    for (let x = 30; x < W + 120; x += 170) glare += '<path d="M' + x + ' 0h46L' + (x - 34) + ' 104h-46z" fill="#fff" opacity=".2"/><path d="M' + (x + 56) + ' 0h12L' + (x - 2) + ' 104h-12z" fill="#fff" opacity=".16"/>';
    for (let x = 10; x < W; x += 124) base += '<rect x="' + x + '" y="120" width="112" height="22" rx="6" fill="#9a5326" stroke="#5a2a0e" stroke-width="2.5"/><path d="M' + (x + 6) + ' 122.5h100" stroke="#e4a172" stroke-width="2" stroke-linecap="round" opacity=".7"/>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<rect width="' + W + '" height="104" fill="url(#dlcs)"/><rect width="' + W + '" height="16" fill="url(#dlglow)" opacity=".7"/><rect width="' + W + '" height="4" fill="#fff"/>' +
      '<rect y="' + (Y - 1) + '" width="' + W + '" height="11" fill="url(#dlst)"/><path d="M0 ' + (Y - 1) + 'H' + W + '" stroke="#1c1640" stroke-width="2"/>' + food + glare +
      '<rect y="104" width="' + W + '" height="8" fill="url(#dlst)" stroke="#1c1640" stroke-width="2.5"/>' +
      '<rect y="112" width="' + W + '" height="' + (H - 112) + '" fill="url(#dlwd)"/><rect y="112" width="' + W + '" height="4" fill="url(#dlgd)"/>' + base + '</svg>';
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
    z.innerHTML = '<div class="dl-bs">' + signSvg(i, can) + face(w) + '</div>' +
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
