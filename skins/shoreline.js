// Shoreline: the map is a sea. Only the shore (the regions on the map's outer edge) can be touched; a swap starts at the
// coast and rolls inward as a wave towards the lagoon (the hole). Play page lab/shoreline.html (rules and the shore
// solver in lab/shoreline-core.js); design note lab/SHORELINE-DESIGN.md. Every piece is drawn the Islands way: offset
// shadow, deep base, lit body, highlight, outline.
(function () {
  const COL = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'], DK = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'];
  const LT = ['#f6a08a', '#9cc6f4', '#f4e09a', '#a6d9a1'], NEON = ['#ff7a52', '#5ab4ff', '#ffe066', '#5cff8a'];
  const INK = '#08213a', SAND = '#f3d7a0', SAND_D = '#b98d4c', FOAM = '#eef9ff', SEA = '#0f4a6e', DEEP = '#06192b', LAGOON = '#1c8fa8', GLASS = '#7fe0c4';
  const FONT = "'Fredoka','Baloo 2',system-ui,sans-serif";
  const ICON = [   // lab/core.js LAB.ICON (24 x 24): fire, water, air, earth
    'M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2.4 1.1-4.1 2.3-5.2.1 1.6.8 2.7 1.9 3.3C10.3 8 11 5 12 2z',
    'M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z',
    'M3 8.5h11a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8M3 16.5h8',
    'M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M6 18c3-4 6-7 9-9',
  ];
  const f1 = n => Math.round(n * 10) / 10, P = (x, y) => f1(x) + ' ' + f1(y);
  const icon24 = (e, s, ink) => '<path d="' + ICON[e] + '" transform="scale(' + f1(s * 100) / 100 + ') translate(-12 -12)" ' +
    (e < 2 ? 'fill="' + ink + '"' : 'fill="none" stroke="' + ink + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"') + '/>';
  // a polygon with rounded corners (k: how much of each side the rounding eats)
  function roundPoly(pts, k) {
    const n = pts.length, mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    let d = '';
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], s = mid(p, a, k), e = mid(p, b, k);
      d += (i ? 'L' : 'M') + P(s[0], s[1]) + 'Q' + P(p[0], p[1]) + ' ' + P(e[0], e[1]);
    }
    return d + 'Z';
  }
  // one pebble silhouette per element, so shape reads as well as colour: fire a triangle, water a drop, air round, earth square
  function pebD(e, r) {
    if (e === 0) return roundPoly([[0, -r * 1.12], [r * 1.05, r * .78], [-r * 1.05, r * .78]], .3);
    if (e === 1) return 'M0 ' + f1(-r * 1.12) + 'C' + P(r * .95, -r * .2) + ' ' + P(r * 1.02, r * .95) + ' 0 ' + f1(r * .95) + 'C' + P(-r * 1.02, r * .95) + ' ' + P(-r * .95, -r * .2) + ' 0 ' + f1(-r * 1.12) + 'Z';
    if (e === 2) return 'M' + f1(-r) + ' 0A' + f1(r) + ' ' + f1(r) + ' 0 1 1 ' + f1(r) + ' 0A' + f1(r) + ' ' + f1(r) + ' 0 1 1 ' + f1(-r) + ' 0Z';
    return roundPoly([[-r * .92, -r * .92], [r * .92, -r * .92], [r * .92, r * .92], [-r * .92, r * .92]], .28);
  }
  // a pebble tile: shadow, deep base, lit body, outline, icon, highlight. o.deep dims it under water; o.shore rims it with sand
  function peb(e, x, y, r, o) {
    o = o || {};
    const d = pebD(e, r), sw = f1(Math.max(1.3, r * .1));
    return '<g transform="translate(' + P(x, y) + ')">' + (o.cls ? '<g class="' + o.cls + '">' : '<g>') +
      (o.glow ? '<circle r="' + f1(r * 1.45) + '" fill="' + (o.glowCol || FOAM) + '" opacity="' + o.glow + '"/>' : '') +
      (o.shore ? '<path d="' + pebD(e, r * 1.24) + '" fill="' + SAND + '" stroke="' + SAND_D + '" stroke-width="' + sw + '"/>' : '') +
      '<path d="' + d + '" transform="translate(' + P(r * .1, r * .15) + ')" fill="' + INK + '" opacity=".5"/>' +
      '<path d="' + d + '" fill="' + DK[e] + '"/><path d="' + d + '" transform="translate(' + P(-r * .05, -r * .07) + ') scale(.88)" fill="' + COL[e] + '"/>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<g transform="translate(0 ' + f1(r * .08) + ')">' + icon24(e, r * .58 / 12, '#fff') + '</g>' +
      '<ellipse cx="' + f1(-r * .36) + '" cy="' + f1(-r * .42) + '" rx="' + f1(r * .26) + '" ry="' + f1(r * .12) + '" transform="rotate(-35 ' + P(-r * .36, -r * .42) + ')" fill="#fff" opacity=".6"/>' +
      (o.deep ? '<path d="' + d + '" fill="' + DEEP + '" opacity=".55"/>' : '') + '</g></g>';
  }
  // the lagoon (the hole): teal pool, foam ring, sand lip
  const lagoon = (x, y, r, fill) => '<circle cx="' + f1(x + 2) + '" cy="' + f1(y + 3) + '" r="' + f1(r + 4) + '" fill="' + INK + '" opacity=".45"/>' +
    '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r + 4) + '" fill="' + SAND + '" stroke="' + INK + '" stroke-width="3"/>' +
    '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + (fill || LAGOON) + '" stroke="' + INK + '" stroke-width="2.4"/>' +
    '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * .72) + '" fill="none" stroke="' + FOAM + '" stroke-opacity=".7" stroke-width="2.4" stroke-dasharray="5 6" class="fr"/>' +
    '<ellipse cx="' + f1(x - r * .35) + '" cy="' + f1(y - r * .42) + '" rx="' + f1(r * .3) + '" ry="' + f1(r * .12) + '" fill="#fff" opacity=".45"/>';
  const wave = (x, y, w, o) => '<path d="M' + P(x, y) + 'q' + f1(w / 4) + ' ' + f1(-w / 5) + ' ' + f1(w / 2) + ' 0t' + f1(w / 2) + ' 0" fill="none" stroke="' + FOAM + '" stroke-width="2.6" stroke-linecap="round" opacity="' + (o || .55) + '"/>';
  const starD = (cx, cy, s) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? s * .42 : s; d += (i ? 'L' : 'M') + P(cx + q * Math.cos(a), cy + q * Math.sin(a)); } return d + 'Z'; };
  const spark = (x, y, s, c) => '<path d="' + starD(x, y, s) + '" fill="' + (c || '#fff6c8') + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>';
  const pent = (cx, cy, R, a0) => Array.from({ length: 5 }, (_, i) => { const a = (a0 === undefined ? -Math.PI / 2 : a0) + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const finger = '<g><circle r="13" fill="#fff" opacity=".25" class="tap"/><g transform="rotate(-22)"><rect x="-12" y="18" width="28" height="30" rx="11" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="-6.5" y="-2" width="13" height="34" rx="6.5" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M-3 4h6" stroke="#cfd8e0" stroke-width="2" stroke-linecap="round"/></g></g>';
  // the sea behind every picture, with a sand coast round the edge
  const sea = '<rect width="300" height="250" fill="' + SEA + '"/><circle cx="150" cy="125" r="150" fill="' + DEEP + '" opacity=".55"/>' +
    '<path d="M0 0H300V250H0Z M22 30Q150 4 278 30Q300 125 278 220Q150 246 22 220Q0 125 22 30Z" fill="' + SAND + '" fill-rule="evenodd"/>' +
    '<path d="M22 30Q150 4 278 30Q300 125 278 220Q150 246 22 220Q0 125 22 30Z" fill="none" stroke="' + FOAM + '" stroke-width="5" stroke-opacity=".8" stroke-dasharray="10 7"/>' +
    wave(60, 70, 30, .3) + wave(210, 92, 26, .3) + wave(110, 190, 30, .3) + wave(200, 200, 24, .25);
  const MOTION = '.tap{animation:tp 2.8s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes tp{0%{transform:scale(.4);opacity:.6}20%{transform:scale(1.6);opacity:0}100%{opacity:0}}' +
    '.fr{animation:fr 9s linear infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes fr{to{transform:rotate(360deg)}}' +
    '.bob{animation:bob 2.2s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-4px)}}';
  const svg = (inner, css) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg"><style>@media (prefers-reduced-motion: no-preference){' + MOTION + (css || '') + '}</style>' + sea + inner + '</svg>';
  const RIM = [0, 1, 0, 2, 3];

  // ---- title: the lagoon in the middle, its rim under water, three bright shore pebbles on the beach, a wave rolling in
  const rp = pent(150, 125, 52), SHORE = [[48, 125, 1], [214, 34, 3], [216, 214, 2]];
  const titleSvg = svg(lagoon(150, 125, 24) + rp.map((p, i) => peb(RIM[i], p[0], p[1], 17, { deep: true })).join('') +
    SHORE.map(([x, y, e], i) => peb(e, x, y, 19, { shore: true, glow: .25, cls: 'bob', glowCol: FOAM })).join('') +
    '<path d="M70 125Q92 112 104 116" fill="none" stroke="' + FOAM + '" stroke-width="5" stroke-linecap="round" class="wv"/>' + spark(250, 120, 7) + spark(36, 40, 5));

  // ---- how to play: one picture and one short sentence each
  const p1 = svg(lagoon(150, 122, 26) + rp.map((p, i) => peb(RIM[i], p[0], p[1] - 3, 17, { glow: i === 1 ? .35 : 0, glowCol: NEON[1] })).join('') +
    '<g transform="translate(' + P(rp[1][0], rp[1][1] - 3) + ')"><path d="M-10 -10L10 10M10 -10L-10 10" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M-10 -10L10 10M10 -10L-10 10" stroke="#ff5a4a" stroke-width="4" stroke-linecap="round"/></g>');
  const p2 = svg(lagoon(150, 125, 20) + [[96, 92, 2], [190, 82, 0], [118, 168, 3], [196, 160, 1], [152, 66, 3]].map(([x, y, e]) => peb(e, x, y, 15, { deep: true })).join('') +
    SHORE.map(([x, y, e]) => peb(e, x, y, 19, { shore: true, glow: .35, cls: 'bob' })).join('') + '<g transform="translate(58 136)">' + finger + '</g>');
  const chainW = [[48, 125, 1], [92, 112, 0], [124, 108, 1]];
  const p3 = svg(lagoon(170, 120, 20) + chainW.map(([x, y, e], i) => (i ? '<path d="M' + P(chainW[i - 1][0], chainW[i - 1][1]) + 'L' + P(x, y) + '" stroke="' + FOAM + '" stroke-width="6" stroke-linecap="round" opacity=".6"/>' : '') +
      peb(e, x, y, i ? 15 : 19, { shore: !i, glow: .35, glowCol: NEON[e], cls: 'w' + i })).join('') +
    '<path d="M40 150q20 -12 40 0t40 0t40 0" fill="none" stroke="' + FOAM + '" stroke-width="4" stroke-linecap="round" class="sw"/>' + '<g transform="translate(58 136)">' + finger + '</g>',
    '.w0,.w1,.w2{transform-box:fill-box;transform-origin:50% 50%;animation:wp 2.4s ease-in-out infinite}.w1{animation-delay:.25s}.w2{animation-delay:.5s}@keyframes wp{0%,30%,100%{transform:scale(1)}15%{transform:scale(1.18)}}' +
    '.sw{animation:sw 2.4s ease-out infinite}@keyframes sw{0%{transform:translateX(-20px);opacity:0}30%{opacity:1}100%{transform:translateX(40px);opacity:0}}');
  const p4 = svg(lagoon(204, 125, 22) + [[48, 125, 2, 1], [92, 110, 3, 0], [130, 120, 2, 0]].map(([x, y, e, s], i) => peb(e, x, y, s ? 19 : 15, { shore: !!s, deep: !s && i === 2, glow: s ? .3 : 0 })).join('') +
    '<path d="M60 150q14 -8 28 0t28 0" fill="none" stroke="' + FOAM + '" stroke-width="3" stroke-linecap="round" opacity=".5"/>' +
    '<g transform="translate(160 122)"><path d="M-8 -8L8 8M8 -8L-8 8" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M-8 -8L8 8M8 -8L-8 8" stroke="#ff5a4a" stroke-width="3.4" stroke-linecap="round"/></g>' +
    peb(1, 248, 90, 15, { deep: true }) + peb(0, 252, 160, 15, { deep: true }));
  const p5 = svg('<g class="ry">' + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return '<path d="M' + P(150 + Math.cos(a) * 40, 122 + Math.sin(a) * 40) + 'L' + P(150 + Math.cos(a) * 56, 122 + Math.sin(a) * 56) + '" stroke="' + NEON[3] + '" stroke-width="5" stroke-linecap="round"/>'; }).join('') + '</g>' +
    lagoon(150, 122, 28, COL[3]) + '<g transform="translate(150 122)">' + icon24(3, 1.4, '#fff') + '</g>' +
    pent(150, 122, 70).map((p, i) => peb([0, 1, 0, 1, 2][i], p[0], p[1], 16, { cls: 'bob' })).join('') + spark(56, 52, 8) + spark(246, 66, 7, NEON[3]) + spark(236, 196, 8),
    '.ry{animation:ry 1.6s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ry{0%{transform:scale(.7);opacity:0}30%{opacity:1}100%{transform:scale(1.25);opacity:0}}');
  const I = [
    { title: 'Fill the lagoon', text: 'Five pebbles ring the lagoon. Clear one element off the ring.', svg: p1 },
    { title: 'Only the shore moves', text: 'Only the shore can move. Tap a sandy pebble.', svg: p2 },
    { title: 'Send a wave', text: 'Pick a partner: its chain swaps as a wave rolling in from the coast.', svg: p3 },
    { title: 'Some waves die out', text: 'A wave that never reaches the ring still changes the sea. Plan ahead.', svg: p4 },
    { title: 'Fill!', text: 'One element gone from the ring and the lagoon floods with the free one.', svg: p5 },
  ];

  // ---- icon, logo and card (SKIN-SPEC 13): ids carry shoreline-ic-, shoreline-lg-, shoreline-cd-
  function logoArt(p) {
    const T = (x, y, s, fill) => '<text x="' + (x + 3) + '" y="' + (y + 4) + '" font-family="' + FONT + '" font-weight="700" font-size="' + s + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round" paint-order="stroke">SHORELINE</text>' +
      '<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-weight="700" font-size="' + s + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round" paint-order="stroke">SHORELINE</text>';
    return '<defs><linearGradient id="' + p + '-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="' + GLASS + '"/><stop offset="1" stop-color="' + LAGOON + '"/></linearGradient></defs>' +
      peb(1, 26, 42, 15, { shore: true }) + T(48, 54, 31, 'url(#' + p + '-t)') + wave(52, 70, 40, .8) + wave(140, 70, 40, .6) + spark(226, 18, 5);
  }
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + logoArt('shoreline-lg') + '</svg>';
  const icon = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<radialGradient id="shoreline-ic-bg" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#2aa6c4"/><stop offset=".55" stop-color="' + SEA + '"/><stop offset="1" stop-color="' + DEEP + '"/></radialGradient></defs>' +
    '<rect width="120" height="120" rx="26" fill="url(#shoreline-ic-bg)"/>' +
    '<path d="M0 84Q30 70 60 84T120 84V120H0Z" fill="' + SAND + '" stroke="' + INK + '" stroke-width="3"/><path d="M0 84Q30 70 60 84T120 84" fill="none" stroke="' + FOAM + '" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="60" cy="46" r="23" fill="' + INK + '" opacity=".4" transform="translate(2 3)"/><circle cx="60" cy="46" r="23" fill="' + LAGOON + '" stroke="' + INK + '" stroke-width="3"/>' +
    '<circle cx="60" cy="46" r="15" fill="none" stroke="' + FOAM + '" stroke-width="3" stroke-dasharray="5 5" opacity=".8"/>' +
    peb(1, 30, 98, 13, {}) + peb(0, 90, 100, 12, {}) +
    '<path d="M18 36Q24 22 38 16" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/></svg>';
  const cp = pent(120, 112, 46);
  const card = '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<radialGradient id="shoreline-cd-bg" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#1a6f96"/><stop offset=".6" stop-color="' + SEA + '"/><stop offset="1" stop-color="' + DEEP + '"/></radialGradient>' +
    '<linearGradient id="shoreline-cd-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + DEEP + '" stop-opacity="0"/><stop offset=".35" stop-color="' + DEEP + '" stop-opacity=".9"/><stop offset="1" stop-color="#03101c"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="url(#shoreline-cd-bg)"/>' +
    '<path d="M0 0H240V230H0Z M18 26Q120 2 222 26Q238 112 222 200Q120 222 18 200Q2 112 18 26Z" fill="' + SAND + '" fill-rule="evenodd"/>' +
    '<path d="M18 26Q120 2 222 26Q238 112 222 200Q120 222 18 200Q2 112 18 26Z" fill="none" stroke="' + FOAM + '" stroke-width="5" stroke-opacity=".85" stroke-dasharray="10 7"/>' +
    wave(50, 60, 26, .3) + wave(170, 168, 26, .3) + lagoon(120, 112, 21) + cp.map((p, i) => peb(RIM[i], p[0], p[1], 15, { deep: i !== 0 && i !== 4, glow: i === 0 ? .4 : 0, glowCol: NEON[0] })).join('') +
    '<path d="M38 112Q60 96 82 98" fill="none" stroke="' + FOAM + '" stroke-width="5" stroke-linecap="round"/>' +
    peb(1, 30, 112, 16, { shore: true, glow: .35 }) + peb(3, 186, 22, 15, { shore: true }) + peb(2, 204, 198, 15, { shore: true }) + spark(66, 84, 6) +
    '<g transform="translate(36 122) scale(.8)">' + finger + '</g>' +
    '<rect y="214" width="240" height="106" fill="url(#shoreline-cd-f)"/><path d="M0 226H240" stroke="' + GLASS + '" stroke-opacity=".5" stroke-width="2"/>' +
    '<g transform="translate(0 234)">' + logoArt('shoreline-cd-lg') + '</g></svg>';

  // ---- the level map: the built-in islands, sandier, in a deeper sea, with shells, starfish and buoys on the beaches
  const shell = (s, c) => '<g transform="scale(' + s + ')"><path d="M0 8L-10 -2Q-8 -11 0 -12Q8 -11 10 -2Z" fill="' + c + '" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M0 8L-5 -9M0 8V-11M0 8L5 -9" stroke="' + INK + '" stroke-width="1.2" opacity=".5"/></g>';
  const starfish = (s) => '<path d="' + starD(0, 0, 11 * s) + '" fill="#ff8a5c" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/><circle cx="-2" cy="-3" r="1.4" fill="#fff" opacity=".7"/>';
  const glass = (s, e) => '<g transform="scale(' + s + ')"><path d="M-7 -4L-1 -9L8 -5L6 6L-4 8Z" fill="' + LT[e] + '" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/><path d="M-4 -4L0 -6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>';
  const buoy = '<path d="M-7 6L-5 -6H5L7 6Z" fill="#ff5a4a" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/><rect x="-6" y="-2" width="12" height="4" fill="#fff"/><path d="M0 -6V-12" stroke="' + INK + '" stroke-width="2"/><circle cy="-13" r="2.6" fill="#ffd84a" stroke="' + INK + '" stroke-width="1.4"/>' +
    '<path d="M-11 8q3 -3 6 0t6 0t6 0" fill="none" stroke="' + FOAM + '" stroke-width="2" stroke-linecap="round"/>';
  const levelMap = {
    bg: '#0f5a82',
    defs: '<radialGradient id="shorelineLmDeep"><stop offset="0" stop-color="' + DEEP + '" stop-opacity=".45"/><stop offset="1" stop-color="' + DEEP + '" stop-opacity="0"/></radialGradient>',
    backdrop(H, rnd) {
      let s = '';
      for (let k = 0; k * 600 < H + 300; k++) s += '<circle cx="' + f1(60 + rnd(k, 3) * 280) + '" cy="' + (k * 600 + 300) + '" r="240" fill="url(#shorelineLmDeep)"/>';
      for (let k = 0; k < Math.floor(H / 60); k++) s += wave(f1(rnd(k, 7) * 370), f1(k * 60 + rnd(k, 8) * 30), 18 + rnd(k, 9) * 16, f1(.25 + rnd(k, 10) * .3));
      return '<g>' + s + '</g>';
    },
    zones: {
      cove: { land: '#fbe3b0', edge: FOAM, patch: '#bff0ea' }, beach: { land: SAND, edge: FOAM, patch: '#ecc882' },
      town: { land: '#9fd87a', edge: SAND, patch: '#b3e290' }, harbour: { land: '#e6c08a', edge: SAND, patch: '#d6aa70' },
      forest: { land: '#5bb562', edge: SAND, patch: '#6cc472' }, cape: { land: '#cfd6de', edge: SAND, patch: '#bcc5cf' },
      reef: { land: '#f6d2b0', edge: FOAM, patch: '#a6ece2' }, cave: { land: '#8a74b6', edge: SAND, patch: '#7a64a6' }, volcano: { land: '#a8603f', edge: SAND, patch: '#924e34' },
    },
    decor(theme, r, r2) {        // about half the spots stay empty
      if (r < .14) return shell(.9 + r2 * .5, r2 < .5 ? '#ffd9e0' : '#fff1d0');
      if (r < .24) return starfish(.8 + r2 * .5);
      if (r < .34) return glass(1 + r2 * .4, Math.floor(r2 * 4) % 4);
      if (r < .4) return buoy;
      return '';
    },
    sign(label, w) {             // a driftwood plank
      return '<rect x="2" y="4" width="' + w + '" height="30" rx="8" fill="' + INK + '" opacity=".45"/><rect width="' + w + '" height="30" rx="8" fill="#c99a62" stroke="' + INK + '" stroke-width="3"/>' +
        '<path d="M8 10H' + (w - 14) + 'M14 22H' + (w - 8) + '" stroke="#a87a44" stroke-width="2" stroke-linecap="round"/><rect x="4" y="3" width="' + (w - 8) + '" height="5" rx="2.5" fill="#fff" opacity=".3"/>' +
        '<text x="' + f1(w / 2) + '" y="20" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="13" fill="' + INK + '">' + label + '</text>';
    },
    road: { todo: [INK, '#d9bb84', '#fff3d6'], done: [INK, LAGOON, FOAM], widths: [20, 13, 4], dash: '3 7', cap: 'round' },
    node(state, num, e, boss) {
      const R = boss ? 33 : 29, fs = num.length > 3 ? 13 : num.length > 2 ? 15 : num.length > 1 ? 18 : 22;
      const txt = c => '<text y="' + f1(fs * .36) + '" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="' + fs + '" fill="' + c + '" stroke="' + INK + '" stroke-width="3.5" paint-order="stroke">' + num + '</text>';
      if (state === 'locked') return '<circle r="' + R + '" fill="' + INK + '" opacity=".5" transform="translate(2 4)"/><circle r="' + R + '" fill="#557189" stroke="' + INK + '" stroke-width="3"/><circle r="' + f1(R * .7) + '" fill="#3b5468"/>' +
        '<rect x="-7" y="-2" width="14" height="11" rx="2" fill="#c9d5df" stroke="' + INK + '" stroke-width="2"/><path d="M-4 -2v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#c9d5df" stroke-width="2.4"/>';
      const k = e >= 0 ? e : 0, beaten = state === 'beaten';
      return (state === 'current' ? '<circle r="' + (R + 9) + '" fill="none" stroke="' + FOAM + '" stroke-width="3" stroke-dasharray="5 5"/>' : '') +
        '<path d="' + pebD(k, R * .9) + '" transform="translate(2 4)" fill="' + INK + '" opacity=".5"/><path d="' + pebD(k, R) + '" fill="' + SAND + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="' + pebD(k, R * .78) + '" fill="' + (beaten ? LAGOON : COL[k]) + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<ellipse cx="' + f1(-R * .32) + '" cy="' + f1(-R * .4) + '" rx="' + f1(R * .22) + '" ry="' + f1(R * .1) + '" transform="rotate(-35 ' + P(-R * .32, -R * .4) + ')" fill="#fff" opacity=".6"/>' + txt('#fff');
    },
    start() {                    // the lighthouse
      return '<path d="M-9 14L-6 -16H6L9 14Z" fill="#fff" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/><path d="M-8 2H8M-7 -8H7" stroke="#ff5a4a" stroke-width="5"/>' +
        '<rect x="-7" y="-24" width="14" height="9" rx="2" fill="#ffd84a" stroke="' + INK + '" stroke-width="2.4"/><path d="M-5 -28H5L0 -33Z" fill="#ff5a4a" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<text y="32" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="12" fill="' + FOAM + '" stroke="' + INK + '" stroke-width="3" paint-order="stroke">START</text>';
    },
    pin() {                      // a red buoy pin
      return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="#ff5a4a" stroke="' + INK + '" stroke-width="3"/>' +
        '<path d="M-17 -6H17" stroke="#fff" stroke-width="5"/><circle cy="-5" r="6" fill="' + LAGOON + '" stroke="' + INK + '" stroke-width="2"/><ellipse cx="-7" cy="-13" rx="4" ry="2.2" fill="#fff" opacity=".7"/>';
    },
  };

  FTH_SKINS.register({
    id: 'shoreline', name: 'Shoreline', ic: '🌊', blurb: 'only the shore can move',
    src: 'lab/shoreline.html', hud: 'compact', needs: ['cells'],
    // shore-only play is one swap longer on three levels (lab/SHORELINE-DESIGN.md): stars are scored against this par
    // (index.html parNow; verify.js SKIN_PAR mirrors it; tools/shoreline_check.js checks both against the shore solver)
    par: { archipelago: 2, 'open-doors': 2, 'quiet-way-out': 3 },
    coin: { name: 'sea glass', plural: 'sea glass', glyph: '💠', value: 12, pitch: 1.3,
      colors: { main: GLASS, edge: '#2f8f7a' },
      svg: FTH_SKINS.coinArt('<path d="M-9 -4L-2 -11L9 -7L10 5L-1 10L-10 5Z" transform="translate(1.2 1.8)" fill="#1c1640" opacity=".4"/>' +
        '<path d="M-9 -4L-2 -11L9 -7L10 5L-1 10L-10 5Z" fill="#2f8f7a" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M-7 -3L-2 -8.6L7.4 -5.6L8 3.8L-1 8L-8 4Z" fill="' + GLASS + '"/><path d="M-1 8L8 3.8L7.4 -5.6" fill="none" stroke="#2f8f7a" stroke-width="1.4" opacity=".6"/>' +
        '<path d="M-5 -3L-1.6 -6.4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="3" cy="2" r="1.3" fill="#fff" opacity=".7"/>') },
    fonts: ['https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap'],
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 40% 15%, #2aa6c4 0%, #0f5a82 45%, #06192b 100%)',
      '--sk-ink': '#ffffff',
      '--sk-accent': '#ffd84a',
      '--sk-card': 'linear-gradient(180deg, #0f4a6e, #08213a)',
      '--sk-card-ink': '#eef9ff',
      '--sk-hud': 'linear-gradient(180deg, rgba(15,74,110,.95), rgba(6,25,43,.92))',
      '--sk-btn': 'linear-gradient(180deg, #ffe7b4, #e9be72)',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': '#9a7038',
      '--sk-font': FONT,
      '--sk-radius': '20px',
      '--sk-chip': 'linear-gradient(#0f4a6e, #0a3552)',
      '--sk-chip-ink': '#eef9ff',
      '--sk-edge': '#041320',
      '--sk-btn2': 'linear-gradient(180deg, #4cc2dc, #1c8fa8)',
      '--sk-btn2-ink': '#ffffff',
      '--sk-coin': 'linear-gradient(180deg, #a6f0dc, #2f8f7a)',
      '--sk-star-on': '#ffd84a', '--sk-star-edge': '#8a5a14', '--sk-star-off': '#7fb3d1', '--sk-star-off-edge': '#b9dcf0',
      '--sk-ctl': '#123a5a', '--sk-ctl-ink': '#eef9ff', '--sk-ctl-edge': '#041320',
    },
    css: '.coins{color:' + INK + '}.tl .tin{transition:transform .12s}.tl.lit .tin{transform:scale(1.12)}.tl.glow .tin{filter:drop-shadow(0 0 6px #eef9ff)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: '🌊', board: 'radial-gradient(ellipse at 40% 30%, #1a6f96, #06192b 80%)', line: FOAM,
      games: ['chain', 'hop', 'pop', 'snake'], intro: 'curtain',
      // one beach pebble per element (silhouette by element), the element icon on it
      tile(x, y, r, e, k) {
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + peb(e, 0, 0, r * .82, {}) + '</g></g>';
      },
    },
    map: {
      sea: ['#1c8fa8', '#1a7f9a', '#17708b', '#14627c', '#11546d', '#0e475e', '#0b3a4f', '#082e40', '#062332'],
      seaX: '#041320', fog: '#020a12', unknown: '#b98d4c',
      ramp: ['#5cff8a', '#ffe066', '#ff9a3c', '#ff5a4a'],
      grey: '#9fb4c4', route: '#ffd84a', ink: 'rgba(238,249,255,.85)',
      cell(path, x, y, r) {      // a round pebble
        path.moveTo(x + r * .92, y); path.arc(x, y, r * .92, 0, Math.PI * 2); path.closePath();
      },
    },
    levelMap,
    words: { win: 'Lagoon filled!', perfect: 'Perfect tide!', par: 'Shore par {par}: go for ★★★', chart: 'COLOURING SPACE' },
    eggs: [
      { id: 'message-bottle', on: 'title', taps: 5, run(fx) { if (!fx) return; fx.burst && (fx.burst('🍾', .3, .5), fx.burst('🐚', .5, .4), fx.burst('🌊', .7, .5)); fx.sound && fx.sound('whoosh'); } },
      { id: 'gull', on: 'idle', secs: 40, run(fx) { if (!fx) return; fx.burst && fx.burst('🕊️', .8, .2); fx.sound && fx.sound('pop'); } },
    ],
  });
})();
