// Gears: a workshop plate cut into the map's regions, one chunky gear per region in its element's colour, and in the
// middle the hole as an empty steel drive hub with the die counter (degree.js) in it. Play page lab/gears.html; design
// note lab/GEARS-DESIGN.md. Every gear here is drawn the Islands way: offset shadow, deep base, lit body, highlight, outline.
(function () {
  const COL = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'], DK = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'];
  const LT = ['#f6a08a', '#9cc6f4', '#f4e09a', '#a6d9a1'], NEON = ['#ff7a52', '#5ab4ff', '#ffe066', '#5cff8a'];
  const INK = '#1a1328', BRASS = '#f2b84b', BRASS_D = '#8a5a14', STEEL = '#8d96a8', STEEL_D = '#4b5263', PLATE = '#2a2238';
  const FONT = "'Russo One','Arial Black',system-ui,sans-serif";
  const ICON = [   // lab/core.js LAB.ICON (24 x 24): fire, water, air, earth
    'M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2.4 1.1-4.1 2.3-5.2.1 1.6.8 2.7 1.9 3.3C10.3 8 11 5 12 2z',
    'M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z',
    'M3 8.5h11a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8M3 16.5h8',
    'M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M6 18c3-4 6-7 9-9',
  ];
  const f1 = n => Math.round(n * 10) / 10, P = (x, y) => f1(x) + ' ' + f1(y);
  // a gear outline of radius r: teeth by element (fire pointed, water rounded, air fine, earth blocky), so shape reads as well as colour
  const TEETH = [8, 9, 14, 7], STY = ['tri', 'round', 'fine', 'block'];
  function cogD(r, teeth, sty) {
    const dp = Math.max(1.4, r * (sty === 'fine' ? .16 : .22)), rr = r - dp, per = 2 * Math.PI / teeth, at = (q, a) => P(q * Math.cos(a), q * Math.sin(a));
    const w = sty === 'fine' ? .2 : sty === 'tri' ? .34 : .3;
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const a = i * per - Math.PI / 2, a0 = a - w * per, a1 = a + w * per;
      d += (i ? 'L' : 'M') + at(rr, a0);
      if (sty === 'tri') d += 'L' + at(r, a);
      else if (sty === 'round') d += 'Q' + at(r * 1.1, a0 + .1 * per) + ' ' + at(r, a) + 'Q' + at(r * 1.1, a1 - .1 * per) + ' ' + at(rr, a1);
      else d += 'L' + at(r, a0 + .06 * per) + 'L' + at(r, a1 - .06 * per);
      if (sty !== 'round') d += 'L' + at(rr, a1);
      d += 'A' + f1(rr) + ' ' + f1(rr) + ' 0 0 1 ' + at(rr, a + (1 - w) * per);
    }
    return d + 'Z';
  }
  const icon24 = (e, s, ink) => '<path d="' + ICON[e] + '" transform="scale(' + f1(s * 100) / 100 + ') translate(-12 -12)" ' + (e < 2 ? 'fill="' + ink + '"' : 'fill="none" stroke="' + ink + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"') + '/>';
  // one gear (e = 0..3, or -1 for the steel hub), centred on 0, 0 inside the translated group
  function gear(e, x, y, r, o) {
    o = o || {};
    const steel = e < 0, d = cogD(r, steel ? 15 : (o.teeth || TEETH[e]), steel ? 'block' : (o.sty || STY[e])), base = steel ? STEEL_D : o.brass ? BRASS_D : DK[e], lit = steel ? STEEL : o.brass ? BRASS : COL[e];
    const rot = o.rot ? '<g transform="rotate(' + o.rot + ')">' : '<g>', sw = f1(Math.max(1.3, r * (o.sw || .085)));
    return '<g transform="translate(' + P(x, y) + ')">' + (o.glow ? '<circle r="' + f1(r * 1.25) + '" fill="' + (o.glowCol || '#fff3b0') + '" opacity="' + o.glow + '"/>' : '') +
      (o.cls ? '<g class="' + o.cls + '">' : '<g>') + rot +
      '<path d="' + d + '" transform="translate(' + P(r * .08, r * .13) + ')" fill="' + INK + '" opacity=".55"/>' +
      '<path d="' + d + '" fill="' + base + '"/><path d="' + d + '" transform="translate(' + P(-r * .04, -r * .05) + ') scale(.9)" fill="' + lit + '"/>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<circle r="' + f1(r * .56) + '" fill="none" stroke="' + INK + '" stroke-opacity=".3" stroke-width="' + f1(Math.max(1, r * .07)) + '"/></g></g>' +
      (steel ? '<circle r="' + f1(r * .4) + '" fill="#2b3040" stroke="' + INK + '" stroke-width="' + sw + '"/>'
        : '<circle r="' + f1(r * .4) + '" fill="' + (o.brass ? BRASS_D : DK[e]) + '" stroke="' + INK + '" stroke-width="' + sw + '"/>' + (o.brass ? '' : icon24(e, r * .55 / 12, '#fff'))) +
      '<ellipse cx="' + f1(-r * .34) + '" cy="' + f1(-r * .4) + '" rx="' + f1(r * .26) + '" ry="' + f1(r * .12) + '" transform="rotate(-35 ' + P(-r * .34, -r * .4) + ')" fill="#fff" opacity=".55"/></g>';
  }
  // the die: a tetrahedron, apex up, one edge towards you (two faces seen), faces in element colours; s = half its width
  function die(x, y, s, l, rt, o) {
    o = o || {};
    const A = [0, -s * 1.05], B = [-s, s * .5], C = [s, s * .5], F = [s * .12, s * .82];
    const tri = (p, q, r) => 'M' + P(p[0], p[1]) + 'L' + P(q[0], q[1]) + 'L' + P(r[0], r[1]) + 'Z';
    const cen = (p, q, r) => [(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3];
    const cL = cen(A, B, F), cR = cen(A, F, C);
    return '<g transform="translate(' + P(x, y) + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<path d="' + tri(A, B, F) + tri(A, F, C) + '" transform="translate(' + P(s * .1, s * .16) + ')" fill="' + INK + '" opacity=".5"/>' +
      '<path d="' + tri(A, B, F) + '" fill="' + COL[l] + '"/><path d="' + tri(A, F, C) + '" fill="' + DK[rt] + '"/>' +
      '<path d="' + tri(A, F, C) + '" transform="translate(' + P(cR[0] * .12, cR[1] * .12) + ') scale(.88)" fill="' + COL[rt] + '" opacity=".75"/>' +
      '<path d="M' + P(A[0] - s * .12, A[1] + s * .35) + 'L' + P(B[0] + s * .3, B[1] - s * .12) + '" stroke="#fff" stroke-opacity=".6" stroke-width="' + f1(s * .12) + '" stroke-linecap="round"/>' +
      '<g transform="translate(' + P(cL[0], cL[1]) + ')">' + icon24(l, s * .028, '#fff') + '</g><g transform="translate(' + P(cR[0], cR[1]) + ')">' + icon24(rt, s * .026, '#fff') + '</g>' +
      '<path d="' + tri(A, B, F) + tri(A, F, C) + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.4, s * .1)) + '" stroke-linejoin="round"/></g>';
  }
  // the hub socket: dark well, dashed steel rim (the hole), optional die inside
  const socket = (x, y, r) => '<circle cx="' + f1(x + 2) + '" cy="' + f1(y + 3) + '" r="' + f1(r) + '" fill="' + INK + '" opacity=".5"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="#0c0a12" stroke="' + INK + '" stroke-width="3"/>' +
    '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r - 3) + '" fill="none" stroke="#c9d0dc" stroke-opacity=".45" stroke-width="2" stroke-dasharray="4 5"/>';
  const starD = (cx, cy, s) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? s * .42 : s; d += (i ? 'L' : 'M') + P(cx + q * Math.cos(a), cy + q * Math.sin(a)); } return d + 'Z'; };
  const spark = (x, y, s, c) => '<path d="' + starD(x, y, s) + '" fill="' + (c || '#fff3b0') + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>';
  const pent = (cx, cy, R, a0) => Array.from({ length: 5 }, (_, i) => { const a = (a0 === undefined ? -Math.PI / 2 : a0) + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const finger = '<g><circle r="13" fill="#fff" opacity=".25" class="tap"/><g transform="rotate(-22)"><rect x="-12" y="18" width="28" height="30" rx="11" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="-6.5" y="-2" width="13" height="34" rx="6.5" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M-3 4h6" stroke="#cfc8dc" stroke-width="2" stroke-linecap="round"/></g></g>';
  const arc = (x, y, r, cw, c) => { const a0 = cw ? -2.2 : -.9, a1 = cw ? -.9 : -2.2, p0 = [x + r * Math.cos(a0), y + r * Math.sin(a0)], p1 = [x + r * Math.cos(a1), y + r * Math.sin(a1)];
    const t = [Math.cos(a1 + (cw ? Math.PI / 2 : -Math.PI / 2)), Math.sin(a1 + (cw ? Math.PI / 2 : -Math.PI / 2))], nx = Math.cos(a1), ny = Math.sin(a1);
    const head = 'M' + P(p1[0] + t[0] * 7, p1[1] + t[1] * 7) + 'L' + P(p1[0] + nx * 6, p1[1] + ny * 6) + 'L' + P(p1[0] - nx * 6, p1[1] - ny * 6) + 'Z';
    const path = 'M' + P(p0[0], p0[1]) + 'A' + r + ' ' + r + ' 0 0 ' + (cw ? 1 : 0) + ' ' + P(p1[0], p1[1]);
    return '<path d="' + path + '" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="' + head + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="' + path + '" fill="none" stroke="' + c + '" stroke-width="3.4" stroke-linecap="round"/><path d="' + head + '" fill="' + c + '"/>'; };
  const plate = '<rect width="300" height="250" fill="#17121f"/><circle cx="150" cy="118" r="170" fill="#3a3150" opacity=".55"/><circle cx="110" cy="80" r="90" fill="#4a3f63" opacity=".35"/>' +
    [[14, 14], [286, 14], [14, 236], [286, 236]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="2"/><path d="M' + (x - 3) + ' ' + y + 'h6" stroke="' + INK + '" stroke-width="1.6"/>').join('');
  const SPIN = '.cw,.ccw{transform-box:fill-box;transform-origin:50% 50%}.cw{animation:gsp 6s linear infinite}.ccw{animation:gsp 6s linear infinite reverse}@keyframes gsp{to{transform:rotate(360deg)}}' +
    '.tap{animation:tp 2.8s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes tp{0%{transform:scale(.4);opacity:.6}20%{transform:scale(1.6);opacity:0}100%{opacity:0}}';
  const svg = (inner, css, bare) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (css ? '<style>@media (prefers-reduced-motion: no-preference){' + css + '}</style>' : '') + (bare ? '' : plate) + inner + '</svg>';
  const RIM = [0, 1, 0, 2, 3];

  // ---- title: five rim gears rocking round the empty hub, the die waiting inside
  const tp = pent(150, 122, 72);
  const titleSvg = svg('<circle cx="153" cy="127" r="112" fill="' + INK + '" opacity=".45"/><circle cx="150" cy="122" r="112" fill="' + PLATE + '" stroke="' + INK + '" stroke-width="7"/>' +
    '<circle cx="150" cy="122" r="104" fill="none" stroke="' + BRASS + '" stroke-opacity=".5" stroke-width="2.5" stroke-dasharray="2 7"/><path d="M62 74Q80 34 128 18" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>' +
    socket(150, 122, 36) + '<g class="db">' + die(150, 124, 19, 0, 1) + '</g>' +
    tp.map((p, i) => gear(RIM[i], p[0], p[1], 31, { cls: 'rk' + (i % 2), rot: i * 9 })).join(''),
    '.rk0,.rk1{transform-box:fill-box;transform-origin:50% 50%}.rk0{animation:rk 2.6s ease-in-out infinite}.rk1{animation:rk 2.6s ease-in-out infinite reverse}@keyframes rk{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}' +
    '.db{animation:db 2.2s ease-in-out infinite}@keyframes db{50%{transform:translateY(-4px)}}', true);

  // ---- how to play: one picture and one short sentence each
  const p1 = svg(socket(150, 112, 34) + pent(150, 112, 70).map((p, i) => gear(RIM[i], p[0], p[1], 26, { glow: i === 1 ? .35 : 0, glowCol: NEON[1], cls: i === 1 ? 'pl' : '' })).join('') +
    '<path d="M150 112L' + P(150 + 70 * Math.cos(-Math.PI / 2 + 2 * Math.PI / 5), 112 + 70 * Math.sin(-Math.PI / 2 + 2 * Math.PI / 5)) + '" stroke="' + NEON[1] + '" stroke-width="3" stroke-dasharray="4 5" opacity=".7"/>' +
    '<g transform="translate(150 112)"><path d="M-11 -11L11 11M11 -11L-11 11" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M-11 -11L11 11M11 -11L-11 11" stroke="#ff5a4a" stroke-width="4" stroke-linecap="round"/></g>' +
    [0, 1, 2, 3].map(e => gear(e, 72 + e * 52, 222, 15, {})).join(''),
    '.pl{animation:pl 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes pl{50%{transform:scale(1.14)}}');

  const train = [[60, 150, 0], [112, 118, 1], [166, 146, 0], [218, 112, 1]];
  const p2 = svg(train.map((t, i) => i ? '<path d="M' + P(train[i - 1][0], train[i - 1][1]) + 'L' + P(t[0], t[1]) + '" stroke="#fff0b4" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/>' : '').join('') +
    train.map((t, i) => gear(t[2], t[0], t[1], 27, { cls: i % 2 ? 'ccw' : 'cw', glow: .25 })).join('') +
    arc(60, 150, 40, true, '#fff0b4') + arc(112, 118, 40, false, '#fff0b4') + gear(2, 250, 196, 20, {}) + gear(3, 40, 74, 18, {}) +
    '<g transform="translate(70 162)"><g class="gf">' + finger + '</g></g>',
    SPIN + '.gf{animation:gf 2.8s ease-in-out infinite}@keyframes gf{0%,20%{transform:translate(0,0)}55%,80%{transform:translate(46px,-30px)}100%{transform:translate(0,0)}}');

  const hp = pent(150, 116, 68);
  const p3 = svg(socket(150, 116, 33) + '<g class="jm">' + gear(-1, 150, 116, 30, { rot: 8 }) + '</g>' +
    hp.map((p, i) => gear(RIM[i], p[0], p[1], 25, { glow: i === 0 || i === 1 ? .3 : 0, rot: i * 11 })).join('') +
    [0, 1].map(i => { const p = hp[i], x = 150 + (p[0] - 150) * .5, y = 116 + (p[1] - 116) * .5; return '<g class="sp">' + spark(x, y, 11, '#ff6a4a') + '</g>'; }).join('') +
    arc(hp[0][0], hp[0][1], 36, true, NEON[0]) + arc(hp[1][0], hp[1][1], 36, false, NEON[1]),
    '.jm{animation:jm .5s ease-in-out infinite}@keyframes jm{25%{transform:translate(2px,-1px)}75%{transform:translate(-2px,1px)}}.sp{animation:sp 1s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes sp{0%{transform:scale(.4);opacity:0}30%{opacity:1}100%{transform:scale(1.3);opacity:0}}');

  const wp = pent(150, 116, 70), WIN = [0, 1, 0, 1, 2];
  const p4 = svg('<g class="ry">' + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return '<path d="M' + P(150 + Math.cos(a) * 40, 116 + Math.sin(a) * 40) + 'L' + P(150 + Math.cos(a) * 54, 116 + Math.sin(a) * 54) + '" stroke="' + NEON[3] + '" stroke-width="4" stroke-linecap="round"/>'; }).join('') + '</g>' +
    socket(150, 116, 34) + gear(3, 150, 116, 32, { cls: 'cw', glow: .35, glowCol: NEON[3] }) + wp.map((p, i) => gear(WIN[i], p[0], p[1], 25, { cls: 'ccw' })).join('') +
    spark(52, 46, 9) + spark(250, 60, 7, NEON[3]) + spark(240, 210, 8),
    SPIN + '.ry{animation:ry 1.6s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ry{0%{transform:scale(.7);opacity:0}30%{opacity:1}100%{transform:scale(1.25);opacity:0}}');

  const p5 = svg(socket(150, 120, 52) + '<g class="dt">' + die(150, 124, 34, 2, 3) + '</g>' +
    '<g class="pf"><text x="214" y="70" text-anchor="middle" font-family="' + FONT + '" font-size="30" fill="' + BRASS + '" stroke="' + INK + '" stroke-width="6" paint-order="stroke">+1</text></g>' +
    pent(150, 120, 92, -Math.PI / 2 + .3).map((p, i) => gear(RIM[i], p[0], p[1], 20, { rot: i * 13 })).join(''),
    '.dt{animation:dt 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 60%}@keyframes dt{0%,40%{transform:rotate(0)}60%,100%{transform:rotate(120deg)}}' +
    '.pf{animation:pf 2.4s ease-out infinite}@keyframes pf{0%,50%{transform:translateY(10px);opacity:0}65%{opacity:1}100%{transform:translateY(-12px);opacity:0}}');

  const I = [
    { title: 'Free the hub', text: 'Five gears ring the hub. Clear one element off the ring.', svg: p1 },
    { title: 'Turn a gear train', text: 'Drag a gear onto a neighbour: its two-element train turns and every gear swaps.', svg: p2 },
    { title: 'Jam!', text: 'A train that drives the hub both ways jams it. It still swaps.', svg: p3 },
    { title: 'Drive the hub', text: 'Free an element and its gear drops into the hub and spins.', svg: p4 },
    { title: 'The die', text: 'The die in the hub counts how the board wraps round it. Watch it click.', svg: p5 },
  ];

  // ---- icon, logo and card (SKIN-SPEC 13): ids carry gears-ic-, gears-lg-, gears-cd-
  function logoArt(p, tx) {
    tx = tx || 0;
    const T = (x, y, s, ls, fill, str) => '<text x="' + (x + 3) + '" y="' + (y + 4) + '" font-family="' + FONT + '" font-size="' + s + '" letter-spacing="' + ls + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round" paint-order="stroke">' + str + '</text>' +
      '<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-size="' + s + '" letter-spacing="' + ls + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round" paint-order="stroke">' + str + '</text>';
    return '<defs><linearGradient id="' + p + '-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8"/><stop offset=".45" stop-color="' + BRASS + '"/><stop offset="1" stop-color="#b9751c"/></linearGradient></defs>' +
      '<g transform="translate(' + tx + ' 0)">' + gear(0, 38, 40, 27, { rot: 6 }) + gear(1, 70, 62, 13, { rot: 14 }) + T(86, 52, 42, 2, 'url(#' + p + '-t)', 'GEARS') + spark(216, 20, 6) + '</g>';
  }
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + logoArt('gears-lg') + '</svg>';

  const icon = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="gears-ic-bg" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#5a4a7a"/><stop offset=".55" stop-color="#2a2238"/><stop offset="1" stop-color="#120e1a"/></linearGradient>' +
    '<radialGradient id="gears-ic-gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + BRASS + '" stop-opacity=".45"/><stop offset="1" stop-color="' + BRASS + '" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="120" height="120" rx="26" fill="url(#gears-ic-bg)"/><circle cx="62" cy="60" r="54" fill="url(#gears-ic-gl)"/>' +
    gear(1, 24, 92, 19, { rot: 10 }) + gear(0, 98, 26, 17, { rot: 4 }) +
    gear(-1, 60, 60, 40, { rot: 6, sw: .07 }) + die(60, 62, 17, 3, 2) +
    '<path d="M20 34A44 44 0 0 1 40 14" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/></svg>';

  // the card: a still of play (cell plates, a lit fire/water train turning, the hub with its die), the wordmark below
  const CG = [[46, 52, 0, 22], [98, 40, 1, 20], [150, 54, 2, 21], [200, 44, 3, 20], [36, 108, 2, 20], [194, 104, 0, 22], [60, 166, 3, 21], [118, 178, 1, 20], [180, 162, 2, 21]];
  const cardTrain = [[46, 52], [98, 40], [118, 178]];
  const card = '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<radialGradient id="gears-cd-bg" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#4a3f63"/><stop offset="1" stop-color="#120e1a"/></radialGradient>' +
    '<linearGradient id="gears-cd-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120e1a" stop-opacity="0"/><stop offset=".35" stop-color="#120e1a" stop-opacity=".9"/><stop offset="1" stop-color="#0a0810"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="url(#gears-cd-bg)"/>' +
    [[0, 0, 74, 0, 70, 80, 0, 84], [74, 0, 126, 0, 124, 76, 70, 80], [126, 0, 176, 0, 172, 82, 124, 76], [176, 0, 240, 0, 240, 78, 172, 82], [0, 84, 70, 80, 80, 136, 0, 140], [172, 82, 240, 78, 240, 140, 160, 134],
      [0, 140, 80, 136, 92, 210, 0, 214], [92, 210, 80, 136, 160, 134, 150, 212], [150, 212, 160, 134, 240, 140, 240, 214]].map((q, i) => '<path d="M' + q.slice(0, 2).join(' ') + 'L' + q.slice(2, 4).join(' ') + 'L' + q.slice(4, 6).join(' ') + 'L' + q.slice(6, 8).join(' ') + 'Z" fill="' + COL[CG[i][2]] + '" fill-opacity=".18" stroke="#fff" stroke-opacity=".1"/>').join('') +
    '<path d="M46 52L98 40M98 40L118 112M118 112L118 178" stroke="#fff0b4" stroke-opacity=".5" stroke-width="8" stroke-linecap="round"/>' +
    socket(118, 112, 30) + die(118, 114, 15, 0, 1) +
    CG.map((g, i) => gear(g[2], g[0], g[1], g[3], { rot: i * 17, glow: cardTrain.some(t => t[0] === g[0] && t[1] === g[1]) ? .3 : 0 })).join('') +
    arc(46, 52, 32, true, '#fff0b4') + arc(98, 40, 30, false, '#fff0b4') + spark(74, 46, 7) + spark(108, 146, 6, '#fff0b4') +
    '<g transform="translate(128 196)">' + finger + '</g>' +
    '<rect y="214" width="240" height="106" fill="url(#gears-cd-f)"/><path d="M0 226H240" stroke="' + BRASS + '" stroke-opacity=".45" stroke-width="2"/>' +
    '<g transform="translate(0 232)">' + logoArt('gears-cd-lg', 0) + '</g></svg>';

  // ---- the level map: brass and steel plates bolted to a dark workbench
  const ZT = { cove: '#3d6f8e', beach: '#8a6a3a', town: '#3f7a4a', harbour: '#7a5a3a', forest: '#2f6a3a', cape: '#5a6578', reef: '#8a4a4a', cave: '#4a3a78', volcano: '#8a3a24' };
  const bolt = (x, y, r) => '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="1.6"/><path d="M' + f1(x - r * .6) + ' ' + f1(y) + 'h' + f1(r * 1.2) + '" stroke="' + INK + '" stroke-width="1.4"/>';
  const levelMap = {
    bg: '#17121f',
    defs: '<radialGradient id="gearsLmGlow"><stop offset="0" stop-color="' + BRASS + '" stop-opacity=".16"/><stop offset="1" stop-color="' + BRASS + '" stop-opacity="0"/></radialGradient>',
    backdrop(H, rnd) {
      let s = '';
      for (let k = 0; k * 700 < H + 300; k++) s += '<circle cx="' + f1(80 + rnd(k, 3) * 240) + '" cy="' + (k * 700 + 260) + '" r="260" fill="url(#gearsLmGlow)"/>';
      for (let k = 0; k < Math.floor(H / 160); k++) {
        const x = rnd(k, 11) * 400, y = rnd(k, 12) * H, r = 26 + rnd(k, 13) * 46;
        s += '<g transform="translate(' + P(x, y) + ') rotate(' + f1(rnd(k, 14) * 40) + ')"><path d="' + cogD(r, 8 + (k % 4) * 2, 'block') + '" fill="#2a2238" fill-opacity=".55" stroke="#3a3150" stroke-width="2"/><circle r="' + f1(r * .3) + '" fill="#17121f"/></g>';
      }
      return '<g>' + s + '</g>';
    },
    zone(z) {
      const c = ZT[z.theme] || ZT.town;
      return '<g><path d="' + z.path + '" transform="translate(4 7)" fill="#000" opacity=".45"/><path d="' + z.path + '" fill="' + PLATE + '" stroke="' + INK + '" stroke-width="7"/>' +
        '<path d="' + z.path + '" fill="' + c + '" fill-opacity=".35" stroke="' + BRASS + '" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="2 8"/>' +
        bolt(z.x0 + 34, z.y0 + 30, 5) + bolt(z.x1 - 34, z.y0 + 30, 5) + bolt(z.x0 + 34, z.y1 - 30, 5) + bolt(z.x1 - 34, z.y1 - 30, 5) + '</g>';
    },
    decor(theme, r, r2) {
      if (r < .5) return '<g transform="rotate(' + f1(r2 * 60) + ')"><path d="' + cogD(9 + r2 * 6, 8, 'block') + '" fill="' + STEEL_D + '" stroke="' + INK + '" stroke-width="1.6"/><circle r="3" fill="' + INK + '"/></g>';
      if (r < .75) return bolt(0, 0, 5 + r2 * 3);
      return '<g transform="rotate(' + f1(r2 * 90) + ')"><rect x="-12" y="-3" width="24" height="6" rx="3" fill="' + BRASS_D + '" stroke="' + INK + '" stroke-width="1.6"/>' + bolt(-8, 0, 2.4) + bolt(8, 0, 2.4) + '</g>';
    },
    sign(label, w) {
      return '<rect x="2" y="4" width="' + w + '" height="30" rx="7" fill="' + INK + '" opacity=".5"/><rect width="' + w + '" height="30" rx="7" fill="' + BRASS + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<rect x="4" y="4" width="' + (w - 8) + '" height="5" rx="2.5" fill="#fff" opacity=".35"/>' + bolt(9, 15, 3) + bolt(w - 9, 15, 3) +
        '<text x="' + f1(w / 2) + '" y="20" text-anchor="middle" font-family="' + FONT + '" font-size="13" fill="' + INK + '">' + label + '</text>';
    },
    road: { todo: [INK, '#4b5263', '#8d96a8'], done: [INK, BRASS_D, BRASS], widths: [20, 13, 4], dash: '6 6', cap: 'butt' },
    node(state, num, e, boss) {
      const R = boss ? 33 : 29, fs = num.length > 3 ? 13 : num.length > 2 ? 15 : num.length > 1 ? 18 : 22;
      const txt = (c) => '<text y="' + f1(fs * .36) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs + '" fill="' + c + '" stroke="' + INK + '" stroke-width="3.5" paint-order="stroke">' + num + '</text>';
      const rim = d => '<path d="' + d + '" transform="translate(2 4)" fill="' + INK + '" opacity=".55"/>';
      if (state === 'locked') { const d = cogD(R, 10, 'block'); return rim(d) + '<path d="' + d + '" fill="' + STEEL_D + '" stroke="' + INK + '" stroke-width="3"/><circle r="' + (R * .55) + '" fill="#2b3040" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="-7" y="-2" width="14" height="11" rx="2" fill="' + STEEL + '" stroke="' + INK + '" stroke-width="2"/><path d="M-4 -2v-4a4 4 0 0 1 8 0v4" fill="none" stroke="' + STEEL + '" stroke-width="2.4"/>'; }
      const k = e >= 0 ? e : 0, d = cogD(R, TEETH[k], STY[k]);
      return (state === 'current' ? '<circle r="' + (R + 8) + '" fill="none" stroke="' + BRASS + '" stroke-width="3" stroke-dasharray="4 4"/>' : '') + rim(d) +
        '<path d="' + d + '" fill="' + (state === 'beaten' ? BRASS : COL[k]) + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<circle r="' + f1(R * .62) + '" fill="' + (state === 'beaten' ? BRASS_D : DK[k]) + '" stroke="' + INK + '" stroke-width="2.4"/><ellipse cx="' + f1(-R * .35) + '" cy="' + f1(-R * .42) + '" rx="' + f1(R * .24) + '" ry="' + f1(R * .1) + '" transform="rotate(-35 ' + P(-R * .35, -R * .42) + ')" fill="#fff" opacity=".5"/>' + txt('#fff');
    },
    start() { return gear(-1, 0, 0, 18, {}) + '<text y="36" text-anchor="middle" font-family="' + FONT + '" font-size="12" fill="' + BRASS + '" stroke="' + INK + '" stroke-width="3" paint-order="stroke">START</text>'; },
    pin() {
      return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="' + BRASS + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<g transform="translate(0 -5)"><path d="' + cogD(10, 8, 'block') + '" fill="' + BRASS_D + '" stroke="' + INK + '" stroke-width="1.6"/><circle r="3.4" fill="' + INK + '"/></g><ellipse cx="-7" cy="-12" rx="4" ry="2.2" fill="#fff" opacity=".7"/>';
    },
  };

  FTH_SKINS.register({
    id: 'gears', name: 'Gears', ic: '⚙️', blurb: 'turn the trains, drive the hub',
    src: 'lab/gears.html', hud: 'full', needs: ['cells'],
    coin: { name: 'cog', plural: 'cogs', glyph: '⚙️', value: 30, pitch: .85,
      colors: { main: BRASS, edge: BRASS_D },
      svg: FTH_SKINS.coinArt('<path d="' + cogD(11.5, 8, 'block') + '" transform="translate(1.2 1.8)" fill="#1c1640" opacity=".4"/>' +
        '<path d="' + cogD(11.5, 8, 'block') + '" fill="' + BRASS_D + '" stroke="#1c1640" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="' + cogD(10.2, 8, 'block') + '" transform="translate(-.5 -.6)" fill="' + BRASS + '"/><circle r="6" fill="none" stroke="#1c1640" stroke-opacity=".35" stroke-width="1.2"/>' +
        '<circle r="3.6" fill="#2a2238" stroke="#1c1640" stroke-width="1.6"/><ellipse cx="-4.2" cy="-5" rx="2.6" ry="1.2" transform="rotate(-35 -4.2 -5)" fill="#fff" opacity=".8"/>') },
    fonts: ['https://fonts.googleapis.com/css2?family=Russo+One&display=swap'],
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 35% 20%, #4a3f63 0%, #2a2238 45%, #120e1a 100%)',
      '--sk-ink': '#f6efff',
      '--sk-accent': BRASS,
      '--sk-card': 'linear-gradient(180deg, #33294a, #1d1728)',
      '--sk-card-ink': '#f1e9ff',
      '--sk-hud': 'linear-gradient(180deg, rgba(42,34,56,.95), rgba(23,18,31,.92))',
      '--sk-btn': 'linear-gradient(180deg, #ffd27a, #e09a2a)',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': '#8a5a14',
      '--sk-font': FONT,
      '--sk-radius': '16px',
      '--sk-chip': 'linear-gradient(#3a3150, #2a2238)',
      '--sk-chip-ink': '#f6efff',
      '--sk-edge': '#0e0a16',
      '--sk-btn2': 'linear-gradient(180deg, #a7b0c2, #6b7385)',
      '--sk-btn2-ink': '#ffffff',
      '--sk-coin': 'linear-gradient(180deg, #ffd27a, #e09a2a)',
      '--sk-star-on': '#ffd24a', '--sk-star-edge': '#8a5a14', '--sk-star-off': '#9a8cb8', '--sk-star-off-edge': '#c9bde6',
      '--sk-ctl': '#2a2238', '--sk-ctl-ink': '#f1e9ff', '--sk-ctl-edge': '#0e0a16',
    },
    css: '.btn3d{letter-spacing:.04em}.coins{color:' + INK + '}' +
      '.tl .tin{transition:transform .12s}.tl.lit .tin{transform:scale(1.12) rotate(20deg)}.tl.glow .tin{filter:drop-shadow(0 0 6px #fff3b0)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: '⚙️', board: 'radial-gradient(ellipse at 40% 30%, #3a3150, #120e1a 80%)', line: BRASS,
      games: ['chain', 'stack', 'pop', 'hop'], intro: 'spin',
      // one chunky gear per element (tooth shape by element), the element icon on its hub
      tile(x, y, r, e, k) {
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + gear(e, 0, 0, r * .86, { rot: 6 + e * 9 }) + '</g></g>';
      },
    },
    map: {
      sea: ['#3a3150', '#352c49', '#302842', '#2b233b', '#261f34', '#211b2d', '#1c1726', '#17131f', '#120f19'],
      seaX: '#0c0a12', fog: '#08060c', unknown: '#5a5068',
      ramp: ['#4caf50', '#e8c547', '#ff9a3c', '#ef5a3c'],
      grey: '#8d96a8', route: BRASS, ink: 'rgba(241,233,255,.85)',
      cell(path, x, y, r) {      // an octagonal plate
        for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4, px = x + r * .95 * Math.cos(a), py = y + r * .95 * Math.sin(a); if (i) path.lineTo(px, py); else path.moveTo(px, py); }
        path.closePath();
      },
    },
    levelMap,
    words: { win: 'Hub driven!', perfect: 'Perfect train!', par: 'Par {par}: go for ★★★', chart: 'COLOURING SPACE' },
    eggs: [
      { id: 'die-six', on: 'page', note: 'turn the die counter to 6 or -6: the die rolls right round and rings', pays: true },
      { id: 'oil-can', on: 'title', taps: 5, run(fx) { if (!fx) return; fx.burst && (fx.burst('⚙️', .3, .45), fx.burst('🔩', .5, .36), fx.burst('⚙️', .7, .45)); fx.sound && fx.sound('chime'); } },
    ],
  });
})();
