// Ion Channels: a glowing lab microscope. Dark teal field, glowing membranes, four chunky ion shapes (matching
// lab/ions.html: 0 green sphere, 1 red triangle, 2 gold cube, 3 violet diamond); a cyan signal docks in a freed chamber.
(function () {
  const COL = ['#3ef0b4', '#ff5f8f', '#ffbd3a', '#8f93ff'], DEEP = ['#0d4a3c', '#4d1028', '#4a3208', '#1d1f5a'];
  const DK = ['#12805f', '#b02a58', '#b07a10', '#4a4fc0'], LT = ['#b8ffe6', '#ffc4d6', '#ffe8a8', '#d4d6ff'];
  const FONT = "'Space Grotesk','Inter',system-ui,sans-serif", CY = '#5fe6ff', INK = '#04141a';
  const BOLD = "'Arial Black','Space Grotesk',system-ui,sans-serif";
  const f1 = n => Math.round(n * 10) / 10;
  const hash = n => { let t = (Math.imul(n | 0, 0x9E3779B1) ^ 0x85EBCA6B) >>> 0; t = Math.imul(t ^ t >>> 15, 2246822519) >>> 0; t = Math.imul(t ^ t >>> 13, 3266489917) >>> 0; return ((t ^ t >>> 16) >>> 0) / 4294967296; };
  // ion shape path (radius about r) centred on 0,0
  function shape(e, r) {
    if (e === 0) return '<circle r="' + f1(r) + '"';
    if (e === 1) return '<path d="M0 ' + f1(-1.2 * r) + 'L' + f1(1.1 * r) + ' ' + f1(.75 * r) + 'L' + f1(-1.1 * r) + ' ' + f1(.75 * r) + 'Z"';
    if (e === 2) return '<rect x="' + f1(-.82 * r) + '" y="' + f1(-.82 * r) + '" width="' + f1(1.64 * r) + '" height="' + f1(1.64 * r) + '" rx="' + f1(.22 * r) + '"';
    return '<path d="M0 ' + f1(-1.22 * r) + 'L' + f1(r) + ' 0L0 ' + f1(1.22 * r) + 'L' + f1(-r) + ' 0Z"';
  }
  // the old flat glowing ion (the level-map pin uses it)
  function ion(e, x, y, r, mark) {
    return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')"><circle r="' + f1(r * 1.9) + '" fill="' + COL[e] + '" opacity=".16"/>' +
      shape(e, r) + ' fill="' + COL[e] + '" stroke="#e9ffff" stroke-width="' + f1(Math.max(.8, r / 9)) + '" stroke-opacity=".8"/>' +
      '<circle cx="' + f1(-r * .3) + '" cy="' + f1(-r * .3) + '" r="' + f1(r * .2) + '" fill="#fff" opacity=".8"/></g>';
  }
  const starD = (cx, cy, s) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? s * .45 : s; d += (i ? 'L' : 'M') + f1(cx + q * Math.cos(a)) + ' ' + f1(cy + q * Math.sin(a)); } return d + 'Z'; };
  const HL = [[-.34, -.4, .3, .16], [-.2, -.3, .2, .11], [-.36, -.4, .26, .13], [-.2, -.5, .2, .11]];
  // a chunky cartoon ion, the Islands way: offset shadow, deep base, lit body up-left, highlight, dark outline (no ids)
  function gem(e, x, y, r, o) {
    o = o || {};
    const sw = f1(Math.max(1.4, r * (o.sw || .2))), h = HL[e];
    return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')">' +
      (o.glow === 0 ? '' : '<circle r="' + f1(r * 1.75) + '" fill="' + COL[e] + '" opacity="' + (o.glow || .2) + '"/>') +
      '<g transform="translate(' + f1(r * .14) + ' ' + f1(r * .2) + ')">' + shape(e, r) + ' fill="' + INK + '" opacity=".6"/></g>' +
      shape(e, r) + ' fill="' + DK[e] + '"/>' +
      '<g transform="translate(' + f1(-r * .08) + ' ' + f1(-r * .1) + ') scale(.82)">' + shape(e, r) + ' fill="' + COL[e] + '"/></g>' +
      '<ellipse cx="' + f1(h[0] * r) + '" cy="' + f1(h[1] * r) + '" rx="' + f1(h[2] * r) + '" ry="' + f1(h[3] * r) + '" transform="rotate(-35 ' + f1(h[0] * r) + ' ' + f1(h[1] * r) + ')" fill="#fff" opacity=".9"/>' +
      shape(e, r) + ' fill="none" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      (o.mark ? '<path d="' + starD(r * .82, -r * .82, r * .5) + '" fill="#fff" stroke="' + INK + '" stroke-width="' + f1(Math.max(1, r * .1)) + '" stroke-linejoin="round"/>' : '') + '</g>';
  }
  // a chunky membrane chamber (ellipse): soft fill, dark rim, coloured lit rim, a top-left glint
  const memb = (cx, cy, rx, ry, e, hot) => '<ellipse cx="' + cx + '" cy="' + (cy + 3) + '" rx="' + rx + '" ry="' + ry + '" fill="' + INK + '" opacity=".5"/>' +
    '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + COL[e] + '" fill-opacity="' + (hot ? .26 : .12) + '" stroke="' + INK + '" stroke-width="6"/>' +
    '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + COL[e] + '" stroke-width="3"/>' +
    '<path d="M' + f1(cx - rx * .8) + ' ' + f1(cy - ry * .35) + 'Q' + f1(cx - rx * .7) + ' ' + f1(cy - ry * .82) + ' ' + f1(cx - rx * .2) + ' ' + f1(cy - ry * .9) + '" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.6" stroke-linecap="round"/>';
  // a glowing two-colour bond between two ions (dark core, a halo, one half in each colour)
  const bond = (a, b, ea, eb, gold) => {
    const mx = f1((a[0] + b[0]) / 2), my = f1((a[1] + b[1]) / 2), A = f1(a[0]) + ' ' + f1(a[1]), B = f1(b[0]) + ' ' + f1(b[1]);
    return '<path d="M' + A + 'L' + B + '" stroke="' + (gold ? '#ffd36a' : CY) + '" stroke-opacity=".3" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M' + A + 'L' + B + '" stroke="' + INK + '" stroke-width="7.5" stroke-linecap="round"/>' +
      '<path d="M' + A + 'L' + mx + ' ' + my + '" stroke="' + COL[ea] + '" stroke-width="4" stroke-linecap="round"/><path d="M' + mx + ' ' + my + 'L' + B + '" stroke="' + COL[eb] + '" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M' + A + 'L' + B + '" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>';
  };
  // the signal: a cyan five-armed molecule (docked: filled; waiting: a hollow, dashed receptor)
  const signal = (cx, cy, R, hollow) => {
    let s = '<g transform="translate(' + cx + ' ' + cy + ')"><g class="sg"><circle r="' + f1(R * 2) + '" fill="' + CY + '" opacity=".16"/>';
    if (hollow) return s + '<circle r="' + R + '" fill="#06232b" stroke="' + INK + '" stroke-width="6"/><circle r="' + R + '" fill="none" stroke="' + CY + '" stroke-width="3" stroke-dasharray="5 4"/><circle r="' + f1(R * .3) + '" fill="' + CY + '" opacity=".7"/></g></g>';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5, x = f1(Math.cos(a) * R * 1.55), y = f1(Math.sin(a) * R * 1.55); s += '<path d="M0 0L' + x + ' ' + y + '" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><path d="M0 0L' + x + ' ' + y + '" stroke="#bff8ff" stroke-width="2.6" stroke-linecap="round"/><circle cx="' + x + '" cy="' + y + '" r="' + f1(R * .26) + '" fill="' + CY + '" stroke="' + INK + '" stroke-width="2"/>'; }
    const hex = Array.from({ length: 6 }, (_, i) => f1(Math.cos(i * Math.PI / 3) * R) + ' ' + f1(Math.sin(i * Math.PI / 3) * R)).join('L');
    return s + '<path d="M' + hex + 'Z" transform="translate(2 3)" fill="' + INK + '" opacity=".55"/><path d="M' + hex + 'Z" fill="#1fb0d4" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M' + hex + 'Z" transform="translate(-1 -1.4) scale(.78)" fill="#9ff3ff"/><path d="' + starD(0, 0, R * .45) + '" fill="#fff"/>' +
      '<path d="M' + hex + 'Z" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/></g></g>';
  };
  // a cartoon ghost finger, fingertip at 0,0 (wrap in a translated <g>, animate the class from CSS)
  const finger = cls => '<g class="' + cls + '"><circle r="13" fill="#fff" opacity=".25" class="tap"/><g transform="rotate(-22)"><rect x="-12" y="18" width="28" height="30" rx="11" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="-6.5" y="-2" width="13" height="34" rx="6.5" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M-3 4h6" stroke="#c9d8de" stroke-width="2" stroke-linecap="round"/></g></g>';
  const field = '<rect width="300" height="250" fill="#04161c"/><circle cx="150" cy="120" r="150" fill="#0d3a44" opacity=".55"/><circle cx="150" cy="120" r="95" fill="#11505c" opacity=".35"/><g stroke="#5fe6ff" stroke-opacity=".06">' + Array.from({ length: 9 }, (_, i) => '<path d="M' + (i * 38) + ' 0V250"/>').join('') + Array.from({ length: 7 }, (_, i) => '<path d="M0 ' + (i * 38) + 'H300"/>').join('') + '</g>';
  const svg = (inner, css) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (css ? '<style>@media (prefers-reduced-motion: no-preference){' + css + '}</style>' : '') + field + inner + '</svg>';
  const svgBare = (inner, css) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (css ? '<style>@media (prefers-reduced-motion: no-preference){' + css + '}</style>' : '') + inner + '</svg>';
  const pent = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const SG = '.sg{animation:sg 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes sg{50%{transform:scale(1.12)}}';
  const rimCols = [0, 1, 2, 3, 1];
  // a chamber chip: the chamber's shape and its count of starred ions (a red cross when blocked, a glow when free)
  const chip = (x, y, e, n) => '<g transform="translate(' + x + ' ' + y + ')"><rect x="-25" y="-14" width="50" height="30" rx="10" fill="' + INK + '" transform="translate(0 3)" opacity=".7"/>' +
    '<rect x="-25" y="-14" width="50" height="30" rx="10" fill="' + (n ? '#0a2a31' : '#1d6f7e') + '" stroke="' + (n ? COL[e] : '#fff6c8') + '" stroke-width="2.4"/>' + gem(e, -11, 1, 7, { glow: 0, sw: .26 }) +
    '<path d="' + starD(5, 1, 6) + '" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/><text x="17" y="7" text-anchor="middle" font-family="' + BOLD + '" font-weight="900" font-size="16" fill="' + (n ? '#ff9ab5' : '#fff6c8') + '" stroke="' + INK + '" stroke-width="3" paint-order="stroke">' + n + '</text></g>';

  // title: a membrane ring, five starred ions (all four kinds) round the signal's empty receptor
  const tp = pent(150, 122, 64);
  const titleSvg = svgBare('<circle cx="150" cy="126" r="100" fill="' + INK + '" opacity=".5"/><circle cx="150" cy="122" r="100" fill="#0a3a44" stroke="' + INK + '" stroke-width="8"/><circle cx="150" cy="122" r="100" fill="none" stroke="' + CY + '" stroke-width="3.5"/>' +
    '<circle cx="150" cy="122" r="92" fill="none" stroke="' + CY + '" stroke-opacity=".3" stroke-width="2" stroke-dasharray="2 6"/><path d="M68 84Q82 46 124 30" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>' +
    tp.map(p => '<path d="M150 122L' + f1(p[0]) + ' ' + f1(p[1]) + '" stroke="#ff9ab5" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 4"/>').join('') +
    signal(150, 122, 20, true) + tp.map((p, i) => '<g class="b' + i + '">' + gem(rimCols[i], p[0], p[1], 17, { mark: true, glow: .28 }) + '</g>').join(''),
    SG + tp.map((_, i) => '.b' + i + '{animation:bob 2.6s ease-in-out ' + (i * .3) + 's infinite}').join('') + '@keyframes bob{50%{transform:translateY(-4px)}}');

  // how to play: one picture each, one short sentence
  const p1 = svg(tp.map(p => '<path d="M150 108L' + f1(p[0]) + ' ' + f1(p[1] - 14) + '" stroke="#ff9ab5" stroke-opacity=".6" stroke-width="2" stroke-dasharray="3 4"/>').join('') +
    signal(150, 108, 19, true) + pent(150, 108, 58).map((p, i) => gem(rimCols[i], p[0], p[1], 14, { mark: true })).join('') +
    chip(60, 214, 0, 1) + chip(120, 214, 1, 2) + chip(180, 214, 2, 1) + chip(240, 214, 3, 1), SG);

  const p2 = svg(memb(78, 112, 64, 84, 0) + memb(222, 112, 64, 84, 1, true) +
    '<path d="M136 46H164M156 38l8 8l-8 8M164 178H136M144 170l-8 8l8 8" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M136 46H164M156 38l8 8l-8 8M164 178H136M144 170l-8 8l8 8" fill="none" stroke="' + CY + '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    bond([84, 92], [214, 104], 0, 1) + bond([214, 104], [100, 150], 1, 0) +
    gem(1, 214, 104, 15) + gem(0, 100, 150, 15) + gem(0, 50, 168, 13, { glow: 0 }) + gem(1, 236, 160, 13, { glow: 0 }) +
    '<g class="mv">' + gem(0, 84, 92, 17, { glow: .35 }) + '</g><g transform="translate(92 102)"><g class="gf">' + finger('') + '</g></g>',
    '.mv{animation:mv 2.8s ease-in-out infinite}.gf{animation:mv 2.8s ease-in-out infinite}@keyframes mv{0%,20%{transform:translateX(0)}55%,80%{transform:translateX(58px)}100%{transform:translateX(0)}}' +
    '.tap{animation:tp 2.8s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes tp{0%{transform:scale(.4);opacity:.6}20%{transform:scale(1.6);opacity:0}100%{opacity:0}}');

  const lock = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><path d="M-8 -2V-9A8 8 0 0 1 8 -9V-2" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M-8 -2V-9A8 8 0 0 1 8 -9V-2" fill="none" stroke="#fff6c8" stroke-width="3.4" stroke-linecap="round"/>' +
    '<rect x="-13" y="-3" width="26" height="21" rx="5" fill="#ffbd3a" stroke="' + INK + '" stroke-width="3"/><rect x="-10" y="0" width="12" height="5" rx="2.5" fill="#fff" opacity=".7"/><circle cy="9" r="3" fill="' + INK + '"/></g>';
  const p3 = svg(memb(78, 112, 62, 80, 2) + memb(222, 112, 62, 80, 3) +
    '<g class="lk">' + bond([78, 80], [214, 116], 2, 3, true) + bond([214, 116], [96, 152], 3, 2, true) + '</g>' +
    gem(2, 78, 80, 16, { mark: true }) + gem(3, 214, 116, 16) + gem(2, 96, 152, 16, { mark: true }) + gem(3, 240, 66, 12, { glow: 0 }) + '<g class="sg">' + lock(150, 196) + '</g>',
    SG + '.lk{animation:lk 1.4s ease-in-out infinite}@keyframes lk{50%{opacity:.55}}');

  const p4 = svg(memb(80, 64, 62, 46, 0, true) + memb(220, 64, 62, 46, 1) + memb(80, 176, 62, 46, 2) + memb(220, 176, 62, 46, 3) +
    '<g class="rays">' + Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return '<path d="M' + f1(80 + Math.cos(a) * 30) + ' ' + f1(64 + Math.sin(a) * 30) + 'L' + f1(80 + Math.cos(a) * 44) + ' ' + f1(64 + Math.sin(a) * 44) + '" stroke="#fff6c8" stroke-width="3.4" stroke-linecap="round"/>'; }).join('') + '</g>' +
    signal(80, 64, 15, false) + gem(0, 40, 50, 10, { glow: 0 }) + gem(0, 122, 82, 10, { glow: 0 }) +
    gem(1, 200, 50, 12, { mark: true }) + gem(1, 244, 80, 12, { mark: true }) + gem(2, 70, 168, 12, { mark: true }) + gem(3, 210, 174, 12, { mark: true }) + gem(3, 246, 190, 12, { mark: true }),
    SG + '.rays{animation:ry 1.6s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ry{0%{transform:scale(.7);opacity:0}30%{opacity:1}100%{transform:scale(1.25);opacity:0}}');

  // ---- icon, logo and card (SKIN-SPEC 13); every id carries the skin id and its piece (ions-ic-, ions-lg-, ions-cd-)
  function logoArt(p) {
    const T = (x, y, s, ls, fill, str) => '<text x="' + (x + 3) + '" y="' + (y + 4) + '" font-family="' + BOLD + '" font-weight="900" font-size="' + s + '" letter-spacing="' + ls + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round" paint-order="stroke">' + str + '</text>' +
      '<text x="' + x + '" y="' + y + '" font-family="' + BOLD + '" font-weight="900" font-size="' + s + '" letter-spacing="' + ls + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round" paint-order="stroke">' + str + '</text>';
    return '<defs><linearGradient id="' + p + '-t1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#9ff6ff"/><stop offset="1" stop-color="#22bfe0"/></linearGradient>' +
      '<linearGradient id="' + p + '-t2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#ffd36a"/><stop offset="1" stop-color="#f29a1c"/></linearGradient>' +
      '<radialGradient id="' + p + '-o" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#7df7d0"/><stop offset="1" stop-color="#0f7a5a"/></radialGradient></defs>' +
      '<g transform="translate(34 40)"><circle r="31" fill="' + COL[0] + '" opacity=".22"/><circle cx="2.5" cy="3.5" r="19" fill="' + INK + '" opacity=".6"/>' +
      '<g transform="rotate(-28)"><ellipse rx="30" ry="10" fill="none" stroke="' + INK + '" stroke-width="7"/><ellipse rx="30" ry="10" fill="none" stroke="#ffd36a" stroke-width="3"/></g>' +
      '<circle r="19" fill="url(#' + p + '-o)" stroke="' + INK + '" stroke-width="3.5"/><ellipse cx="-7" cy="-8" rx="6" ry="3.5" transform="rotate(-35 -7 -8)" fill="#fff" opacity=".9"/>' +
      '<g transform="rotate(-28)"><path d="M30 0A30 10 0 0 1 -30 0" fill="none" stroke="' + INK + '" stroke-width="7"/><path d="M30 0A30 10 0 0 1 -30 0" fill="none" stroke="#ffd36a" stroke-width="3"/><circle cx="-18" cy="8" r="5" fill="#fff6c8" stroke="' + INK + '" stroke-width="2.4"/></g></g>' +
      T(70, 41, 40, 3, 'url(#' + p + '-t1)', 'ION') + T(70, 71, 23, 1, 'url(#' + p + '-t2)', 'CHANNELS') +
      '<path d="' + starD(176, 22, 7) + '" fill="#fff" stroke="' + INK + '" stroke-width="2"/><path d="' + starD(194, 36, 4.5) + '" fill="' + CY + '" stroke="' + INK + '" stroke-width="1.6"/>';
  }
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + logoArt('ions-lg') + '</svg>';

  const icon = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="ions-ic-bg" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#14707e"/><stop offset=".55" stop-color="#0a3d48"/><stop offset="1" stop-color="#03161c"/></linearGradient>' +
    '<radialGradient id="ions-ic-gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5fe6ff" stop-opacity=".55"/><stop offset="1" stop-color="#5fe6ff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ions-ic-o" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#8dfbd8"/><stop offset=".7" stop-color="#22c792"/><stop offset="1" stop-color="#0b5a42"/></radialGradient>' +
    '<linearGradient id="ions-ic-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8fbff"/><stop offset=".5" stop-color="#5fe6ff"/><stop offset="1" stop-color="#1590ae"/></linearGradient></defs>' +
    '<rect width="120" height="120" rx="26" fill="url(#ions-ic-bg)"/><circle cx="60" cy="60" r="56" fill="url(#ions-ic-gl)"/>' +
    '<g stroke="#5fe6ff" stroke-opacity=".08">' + [20, 40, 60, 80, 100].map(v => '<path d="M' + v + ' 0V120M0 ' + v + 'H120"/>').join('') + '</g>' +
    // the membrane ring: shadow, dark rim, cyan glass, neon top-left rim light
    '<circle cx="63" cy="65" r="40" fill="none" stroke="' + INK + '" stroke-opacity=".6" stroke-width="15"/><circle cx="60" cy="60" r="40" fill="none" stroke="' + INK + '" stroke-width="15"/>' +
    '<circle cx="60" cy="60" r="40" fill="none" stroke="url(#ions-ic-r)" stroke-width="9"/><path d="M26 44A38 38 0 0 1 50 22" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>' +
    // the big glossy ion orb
    '<g transform="translate(60 60) rotate(-28)"><path d="M-33 0A33 11 0 0 1 33 0" fill="none" stroke="' + INK + '" stroke-width="7.5"/><path d="M-33 0A33 11 0 0 1 33 0" fill="none" stroke="#ffd36a" stroke-width="3.4"/></g>' +
    '<circle cx="60" cy="60" r="33" fill="#3ef0b4" opacity=".28"/><circle cx="64" cy="65" r="25" fill="' + INK + '" opacity=".6"/>' +
    '<circle cx="60" cy="60" r="25" fill="url(#ions-ic-o)" stroke="' + INK + '" stroke-width="4"/>' +
    '<circle cx="64" cy="64" r="12" fill="#b8ffe6" opacity=".35"/><path d="' + starD(66, 66, 7) + '" fill="#e9fff7" opacity=".7"/>' +
    '<ellipse cx="49" cy="47" rx="9" ry="5" transform="rotate(-38 49 47)" fill="#fff" opacity=".95"/><circle cx="41" cy="58" r="2.2" fill="#fff" opacity=".8"/>' +
    '<g transform="translate(60 60) rotate(-28)"><path d="M33 0A33 11 0 0 1 -33 0" fill="none" stroke="' + INK + '" stroke-width="7.5"/><path d="M33 0A33 11 0 0 1 -33 0" fill="none" stroke="#ffd36a" stroke-width="3.4"/><circle cx="-20" cy="8.6" r="5.5" fill="#fff6c8" stroke="' + INK + '" stroke-width="2.6"/></g>' +
    // three more ions riding the ring
    gem(1, 25, 84, 10.5, { glow: .35, sw: .26 }) + gem(2, 96, 30, 9.5, { glow: .35, sw: .28 }) + gem(3, 95, 88, 10.5, { glow: .35, sw: .26 }) +
    '<path d="' + starD(24, 26, 6) + '" fill="#fff6c8" stroke="' + INK + '" stroke-width="1.8"/></svg>';

  const cardIons = [[0, 36, 60], [0, 62, 26], [1, 196, 42], [1, 206, 84], [2, 40, 156], [2, 84, 180], [2, 50, 196], [3, 160, 154], [3, 206, 172], [3, 172, 198]];
  const card = '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="ions-cd-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f5866"/><stop offset=".55" stop-color="#062832"/><stop offset="1" stop-color="#020c10"/></linearGradient>' +
    '<radialGradient id="ions-cd-gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5fe6ff" stop-opacity=".5"/><stop offset="1" stop-color="#5fe6ff" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="240" height="320" fill="url(#ions-cd-bg)"/><g stroke="#5fe6ff" stroke-opacity=".07">' + Array.from({ length: 8 }, (_, i) => '<path d="M' + (i * 32 + 8) + ' 0V320"/>').join('') + Array.from({ length: 10 }, (_, i) => '<path d="M0 ' + (i * 32 + 8) + 'H240"/>').join('') + '</g>' +
    '<circle cx="120" cy="112" r="120" fill="url(#ions-cd-gl)"/>' +
    memb(64, 62, 54, 46, 0) + memb(176, 62, 54, 46, 1, true) + memb(64, 164, 54, 46, 2) + memb(176, 164, 54, 46, 3) +
    cardIons.map(q => gem(q[0], q[1], q[2], 11.5, { glow: .1 })).join('') +
    // a chain being swapped: green and red ions linked across the membranes, a flip flash on the held one
    signal(120, 113, 13, true) +
    bond([84, 82], [148, 80], 0, 1) + bond([148, 80], [96, 42], 1, 0) +
    '<circle cx="148" cy="80" r="24" fill="#fff" opacity=".2"/>' + gem(0, 84, 82, 14, { mark: true, glow: .35 }) + gem(0, 96, 42, 12, { glow: .3 }) + gem(1, 148, 80, 15, { glow: .45 }) +
    Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4 + .4; return '<path d="M' + f1(148 + Math.cos(a) * 21) + ' ' + f1(80 + Math.sin(a) * 21) + 'L' + f1(148 + Math.cos(a) * 29) + ' ' + f1(80 + Math.sin(a) * 29) + '" stroke="#fff6c8" stroke-width="2.6" stroke-linecap="round"/>'; }).join('') +
    '<g transform="translate(156 92)">' + finger('') + '</g>' +
    '<rect y="226" width="240" height="94" fill="' + INK + '" opacity=".55"/><path d="M0 226H240" stroke="' + CY + '" stroke-opacity=".5" stroke-width="2"/>' +
    '<g transform="translate(0 232)">' + logoArt('ions-cd-lg') + '</g></svg>';
  // ---- the level map: a journey through living tissue under the microscope ----
  const ZT = { cove: ['#5fe6ff', '#3ef0b4'], beach: ['#9be34a', '#ffe14d'], town: ['#8f93ff', '#d3b8ff'], harbour: ['#ffbd3a', '#ff8a3d'],
    forest: ['#ff6fb5', '#ffb0d8'], cape: ['#5fe6ff', '#ffffff'], reef: ['#ff7a6b', '#ffb08a'], cave: ['#b48cff', '#7ee8ff'], volcano: ['#ff5a3a', '#ffbd3a'] };
  const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
  const A = (x, y) => f1(x) + ' ' + f1(y);
  const ves = (x, y, r, c, o) => '<g transform="translate(' + A(x, y) + ')"><circle r="' + f1(r) + '" fill="' + c + '" fill-opacity="' + (o || .12) + '" stroke="' + c + '" stroke-opacity=".6" stroke-width="1.6"/><circle r="' + f1(r * .62) + '" fill="none" stroke="' + c + '" stroke-opacity=".25"/><path d="M' + A(-r * .6, -r * .25) + 'A' + f1(r * .65) + ' ' + f1(r * .65) + ' 0 0 1 ' + A(-r * .1, -r * .62) + '" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="' + f1(Math.max(1, r / 7)) + '" stroke-linecap="round"/></g>';
  const chl = s => '<g transform="scale(' + s + ')"><ellipse rx="26" ry="13" fill="#9be34a" fill-opacity=".16" stroke="#9be34a" stroke-opacity=".7" stroke-width="1.6"/><ellipse rx="22" ry="9.5" fill="none" stroke="#9be34a" stroke-opacity=".28"/>' + [-13, 0, 13].map(x => [-4, 0, 4].map(y => '<rect x="' + (x - 5) + '" y="' + (y - 1) + '" width="10" height="2" rx="1" fill="#c8ff7a" fill-opacity=".7"/>').join('')).join('') + '</g>';
  const mito = s => '<g transform="scale(' + s + ')"><ellipse rx="27" ry="12" fill="#ffbd3a" fill-opacity=".13" stroke="#ffbd3a" stroke-opacity=".7" stroke-width="1.6"/><ellipse rx="23" ry="8.5" fill="none" stroke="#ffbd3a" stroke-opacity=".3"/><path d="M-18 -7L-14 4L-9 -7L-4 4L1 -7L6 4L11 -7L16 4" fill="none" stroke="#ffd27a" stroke-opacity=".6" stroke-width="1.4" stroke-linejoin="round"/></g>';
  const DEN = 'M0 0Q-20 -10 -34 -30M-20 -10Q-30 -12 -42 -8M0 0Q18 -14 30 -34M18 -14Q30 -14 40 -22M0 0Q-8 18 -10 38M0 0Q16 12 36 14M-6 18Q-20 24 -28 38';
  const denEnds = [[-34, -30], [-42, -8], [30, -34], [40, -22], [-10, 38], [36, 14], [-28, 38]];
  const neuron = s => '<g transform="scale(' + s + ')"><path d="' + DEN + '" fill="none" stroke="#ff6fb5" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round"/>' + denEnds.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#ffb0d8" fill-opacity=".8"/>').join('') + '<circle r="13" fill="#ff6fb5" fill-opacity=".2" stroke="#ff6fb5" stroke-opacity=".8" stroke-width="1.8"/><circle r="5" fill="#ffb0d8" fill-opacity=".8"/></g>';
  const coral = s => '<g transform="scale(' + s + ')"><path d="M0 22V-2M0 8L-12 -6M0 -2L10 -14M-12 -6L-14 -20M10 -14L8 -28M0 -2V-24" fill="none" stroke="#ff7a6b" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' + [[-14, -20], [8, -28], [0, -24], [-12, -6], [10, -14]].map((p, i) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 2 ? 4 : 5.5) + '" fill="#ffb08a" fill-opacity=".75"/><circle cx="' + (p[0] + 4) + '" cy="' + (p[1] - 4) + '" r="2.6" fill="#ff7a6b" fill-opacity=".9"/>').join('') + '</g>';
  const cryst = (c, s) => '<g transform="scale(' + s + ')"><path d="M0 -26L8 -10L5 8H-5L-8 -10Z" fill="' + c + '" fill-opacity=".22" stroke="' + c + '" stroke-opacity=".8" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 -26L-2 8M-8 -10H8" stroke="#fff" stroke-opacity=".35" fill="none"/></g>';
  const tower = () => '<g><path d="M-14 46L-4 -40H4L14 46Z" fill="#5fe6ff" fill-opacity=".1" stroke="#5fe6ff" stroke-opacity=".6" stroke-width="1.8" stroke-linejoin="round"/><path d="M-11 28H11M-8 8H8M-6 -14H6M-10 40L8 8M10 40L-8 8M-8 8L5 -14M8 8L-5 -14" stroke="#5fe6ff" stroke-opacity=".4" fill="none"/><path d="M0 -40V-56M0 -56L-9 -68M0 -56L9 -68" stroke="#e9ffff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="-9" cy="-68" r="3.5" fill="#fff"/><circle cx="9" cy="-68" r="3.5" fill="#fff"/><circle cy="-62" r="22" fill="none" stroke="#5fe6ff" stroke-opacity=".5" stroke-dasharray="4 4"/><circle cy="-62" r="36" fill="none" stroke="#5fe6ff" stroke-opacity=".3" stroke-dasharray="4 6"/><circle cy="-62" r="50" fill="none" stroke="#5fe6ff" stroke-opacity=".16" stroke-dasharray="3 8"/></g>';
  const at = (x, y, inner, rot) => '<g transform="translate(' + A(x, y) + ')' + (rot ? ' rotate(' + rot + ')' : '') + '">' + inner + '</g>';
  const zt = t => ZT[t] || ZT.cove;
  let lmDefs = '<radialGradient id="ionsFov"><stop offset="0" stop-color="#0d3a44" stop-opacity=".55"/><stop offset="1" stop-color="#0d3a44" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="ionsVl" x1="0" x2="1"><stop offset="0" stop-color="#010608" stop-opacity=".85"/><stop offset="1" stop-color="#010608" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="ionsVr" x1="1" x2="0"><stop offset="0" stop-color="#010608" stop-opacity=".85"/><stop offset="1" stop-color="#010608" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="ionsLava"><stop offset="0" stop-color="#ffbd3a" stop-opacity=".4"/><stop offset=".45" stop-color="#ff5a3a" stop-opacity=".16"/><stop offset="1" stop-color="#ff5a3a" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ionsSun"><stop offset="0" stop-color="#ffe14d" stop-opacity=".3"/><stop offset="1" stop-color="#ffe14d" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ionsNC" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#7ef0ff"/><stop offset="1" stop-color="#1496b8"/></radialGradient>' +
    '<linearGradient id="ionsPin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8f8ff"/><stop offset="1" stop-color="#1fb0d4"/></linearGradient>';
  Object.keys(ZT).forEach(k => { lmDefs += '<radialGradient id="ionsZ' + k + '" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="' + ZT[k][0] + '" stop-opacity=".24"/><stop offset="1" stop-color="' + ZT[k][0] + '" stop-opacity=".05"/></radialGradient>'; });
  COL.forEach((c, e) => { lmDefs += '<radialGradient id="ionsN' + e + '" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="' + c + '"/><stop offset="1" stop-color="' + DK[e] + '"/></radialGradient>'; });

  const levelMap = {
    bg: '#020b0f',
    defs: lmDefs,
    backdrop(H, rnd) {
      let s = '';
      for (let k = 0; k * 760 < H + 300; k++) s += '<circle cx="' + f1(120 + rnd(k, 7) * 160) + '" cy="' + (k * 760 + 300) + '" r="300" fill="url(#ionsFov)"/><circle cx="200" cy="' + (k * 760 + 380) + '" r="' + (230 + k % 2 * 30) + '" fill="none" stroke="#5fe6ff" stroke-opacity=".045" stroke-width="2"/>';
      for (let k = 0; k < Math.floor(H / 48); k++) {
        const x = rnd(k, 11) * 400, y = rnd(k, 12) * H, r = 5 + rnd(k, 13) * 20, c = k % 3 ? '#5fe6ff' : COL[k % 4];
        s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + c + '" fill-opacity="' + f1(.025 + rnd(k, 14) * .05) + '" stroke="' + c + '" stroke-opacity=".12"/>';
      }
      for (let k = 0; k < Math.floor(H / 26); k++) {
        s += '<circle cx="' + f1(rnd(k, 21) * 400) + '" cy="' + f1(rnd(k, 22) * H) + '" r="' + f1(.7 + rnd(k, 23) * 1.5) + '" fill="' + (k % 5 ? '#bfeef7' : COL[k % 4]) + '" fill-opacity="' + f1(.15 + rnd(k, 24) * .35) + '"/>';
      }
      return '<g>' + s + '<rect width="46" height="' + H + '" fill="url(#ionsVl)"/><rect x="354" width="46" height="' + H + '" fill="url(#ionsVr)"/></g>';
    },
    zone(z) {
      const th = ZT[z.theme] ? z.theme : 'cove', c = ZT[th][0], c2 = ZT[th][1], h = z.y1 - z.y0, cy = (z.y0 + z.y1) / 2;
      const ms = z.stops.reduce((s, p) => s + p[0], 0) / z.stops.length, ax = ms > 200 ? 74 : 326, bx = 400 - ax, fy = f => z.y0 + h * f;
      let s = '<g><path d="' + z.path + '" transform="translate(3 5)" fill="#000" opacity=".4"/><path d="' + z.path + '" fill="url(#ionsZ' + th + ')" stroke="' + c + '" stroke-opacity=".75" stroke-width="3.5"/>' +
        '<path d="' + z.path + '" transform="translate(200 ' + f1(cy) + ') scale(.955 ' + f1(1 - 16 / h) + ') translate(-200 ' + f1(-cy) + ')" fill="none" stroke="' + c + '" stroke-opacity=".3" stroke-width="1.6"/>' +
        '<path d="M' + A(z.x0 + 12, z.y0 + 74) + 'Q' + A(z.x0 + 10, z.y0 + 16) + ' ' + A(z.x0 + 78, z.y0 + 11) + '" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M' + A(z.x1 - 12, z.y1 - 60) + 'Q' + A(z.x1 - 10, z.y1 - 14) + ' ' + A(z.x1 - 64, z.y1 - 10) + '" fill="none" stroke="' + c + '" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>';
      for (let k = 0; k < 12; k++) s += '<circle cx="' + f1(36 + z.rnd(k, 1) * 328) + '" cy="' + f1(z.y0 + 24 + z.rnd(k, 2) * (h - 48)) + '" r="' + f1(.8 + z.rnd(k, 3) * 1.6) + '" fill="' + c + '" fill-opacity=".3"/>';
      if (th === 'cove') s += ves(ax, fy(.42), 31, c) + ves(bx, fy(.7), 24, c2) + ves(ax + (ax < 200 ? 12 : -12), fy(.88), 15, c);
      else if (th === 'beach') s += '<circle cx="' + ax + '" cy="' + f1(fy(.5)) + '" r="95" fill="url(#ionsSun)"/>' + at(ax, fy(.5), chl(1.7), -20) + at(bx, fy(.82), chl(1), 16) + ves(bx, fy(.36), 14, c2);
      else if (th === 'town') {
        const ny = fy(.5);
        s += at(ax, ny, '<circle r="66" fill="#8f93ff" fill-opacity=".1" stroke="#8f93ff" stroke-opacity=".3" stroke-width="2"/><circle r="58" fill="#0c1240" fill-opacity=".5" stroke="#8f93ff" stroke-opacity=".75" stroke-width="2.4"/>' +
          '<path d="M-40 -10Q-30 -34 -14 -18T10 -30T34 -10M-36 14Q-22 -4 -8 14T20 8T38 22M-24 34Q-6 22 6 36T30 38" fill="none" stroke="#d3b8ff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/><circle cx="8" cy="-2" r="11" fill="#d3b8ff" fill-opacity=".75"/><circle cx="5" cy="-5" r="4" fill="#fff" fill-opacity=".7"/>' +
          [0, 1, 2, 3, 4, 5, 6, 7].map(i => '<circle cx="' + f1(Math.cos(i * .785 + .3) * 62) + '" cy="' + f1(Math.sin(i * .785 + .3) * 62) + '" r="3" fill="#d3b8ff"/>').join('')) + ves(bx, fy(.82), 15, c);
      } else if (th === 'harbour') {
        for (let y = z.y0 + 70; y < z.y1 - 20; y += 26) s += '<path d="M40 ' + y + 'H360" stroke="#ffbd3a" stroke-opacity=".1" stroke-width="2"/>';
        s += '<rect x="' + (ax < 200 ? 20 : 330) + '" y="' + f1(fy(.3)) + '" width="50" height="14" rx="4" fill="#ffbd3a" fill-opacity=".18" stroke="#ffbd3a" stroke-opacity=".6"/>' + at(ax, fy(.5), mito(1.9), -12) + at(bx, fy(.8), mito(1.3), 14);
      } else if (th === 'forest') s += at(ax, fy(.52), neuron(1.7)) + at(bx, fy(.84), neuron(1)) + ves(bx, fy(.3), 12, c2);
      else if (th === 'cape') s += at(ax, fy(.68), '<g transform="scale(.8)">' + tower() + '</g>') + ves(bx, fy(.78), 20, c) + ves(bx, fy(.35), 12, c);
      else if (th === 'reef') s += at(ax, fy(.55), coral(2.2)) + at(bx, fy(.82), coral(1.5)) + at(bx, fy(.34), coral(1));
      else if (th === 'cave') {
        let d = ''; const gx = ax < 200 ? 30 : 250, gy = fy(.4), P = [];
        for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) P.push([gx + i * 24 + (j % 2) * 12, gy + j * 21]);
        P.forEach((p, k) => { const i = k % 5; if (i < 4) d += 'M' + A(p[0], p[1]) + 'h24'; if (k + 5 < 25) { d += 'M' + A(p[0], p[1]) + 'l12 21'; if (i > 0 || k % 2) d += 'M' + A(p[0], p[1]) + 'l-12 21'; } });
        s += '<path d="' + d + '" stroke="#b48cff" stroke-opacity=".3" fill="none"/>' + P.map(p => '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="2.6" fill="#7ee8ff" fill-opacity=".8"/>').join('') + at(bx, fy(.85), cryst(c, 1.8)) + at(ax, fy(.9), cryst(c2, 1.1));
      } else {   // volcano: a cell in mitosis; the boss column runs along its spindle
        const t = z.y0 + 64, b = z.y1 - 36, m = (t + b) / 2;
        s += '<circle cx="200" cy="' + f1(fy(.3)) + '" r="150" fill="url(#ionsLava)"/>';
        for (let k = -3; k <= 3; k++) s += '<path d="M200 ' + f1(t) + 'Q' + A(200 + k * 46, m) + ' 200 ' + f1(b) + '" fill="none" stroke="' + c2 + '" stroke-opacity=".22" stroke-width="1.5"/>';
        [t, b].forEach(y => { s += '<g transform="translate(200 ' + f1(y) + ')"><path d="M0 -20V20M-20 0H20M-14 -14L14 14M14 -14L-14 14" stroke="' + c + '" stroke-opacity=".6" stroke-width="1.6"/><circle r="7" fill="' + c2 + '"/></g>'; });
        [-84, -50, 50, 84].forEach((x, i) => { s += '<g transform="translate(' + A(200 + x, m + (i % 2 ? 10 : -12)) + ')"><path d="M-7 -9L7 9M7 -9L-7 9" stroke="' + c2 + '" stroke-opacity=".85" stroke-width="4.5" stroke-linecap="round"/></g>'; });
        for (let k = 0; k < 14; k++) s += '<circle cx="' + f1(200 + (z.rnd(k, 5) - .5) * 150) + '" cy="' + f1(t + 10 - z.rnd(k, 6) * 64) + '" r="' + f1(1.2 + z.rnd(k, 7) * 2.6) + '" fill="' + (k % 2 ? c2 : c) + '" fill-opacity=".7"/>';
      }
      return s + '</g>';
    },
    decor(theme, r, r2) {
      const s = 5 + r2 * 6;
      if (theme === 'cove') return r < .45 ? ves(0, 0, s + 2, '#5fe6ff') : r < .75 ? ves(-6, 2, s * .8, '#3ef0b4') + ves(8, -4, s * .5, '#5fe6ff') : '<g fill="#5fe6ff" fill-opacity=".55"><circle cx="-5" cy="2" r="3"/><circle cx="3" cy="-3" r="2.2"/><circle cx="6" cy="5" r="1.6"/></g>';
      if (theme === 'beach') return r < .4 ? at(0, 0, chl(.55 + r2 * .25), r2 * 60 - 30) : r < .75 ? '<path d="M0 -10L2.5 -2.5L10 0L2.5 2.5L0 10L-2.5 2.5L-10 0L-2.5 -2.5Z" fill="#ffe14d" fill-opacity=".85"/><circle r="12" fill="#ffe14d" fill-opacity=".12"/>' : ves(0, 0, s, '#9be34a');
      if (theme === 'town') return r < .45 ? '<path d="M-14 4Q-8 -12 -2 2T10 -6T16 6" fill="none" stroke="#d3b8ff" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round"/>' : r < .8 ? '<path d="M-12 0H12" stroke="#8f93ff" stroke-opacity=".5"/><g fill="#8f93ff" fill-opacity=".8"><circle cx="-12" r="4"/><circle r="4"/><circle cx="12" r="4"/></g>' : ves(0, 0, s - 1, '#8f93ff');
      if (theme === 'harbour') return r < .5 ? at(0, 0, mito(.6 + r2 * .3), r2 * 50 - 25) : r < .8 ? '<path d="M-9 -5L0 -10L9 -5V5L0 10L-9 5Z" fill="#ffbd3a" fill-opacity=".2" stroke="#ffbd3a" stroke-opacity=".8" stroke-width="1.6"/><circle r="3" fill="#ffd27a"/>' : '<rect x="-8" y="-8" width="16" height="16" rx="3" fill="#ff8a3d" fill-opacity=".18" stroke="#ff8a3d" stroke-opacity=".7" stroke-width="1.6"/><path d="M-8 -2H8" stroke="#ff8a3d" stroke-opacity=".5"/>';
      if (theme === 'forest') return r < .5 ? '<path d="M-14 8Q-4 -2 0 -8M-4 -2Q4 -8 12 -6M0 -8L2 -16" fill="none" stroke="#ff6fb5" stroke-opacity=".6" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="-6" r="2.6" fill="#ffb0d8"/><circle cx="2" cy="-16" r="2.6" fill="#ffb0d8"/>' : ves(-5, 0, 6, '#ff6fb5') + ves(7, 2, 4.5, '#ffb0d8');
      if (theme === 'cape') return r < .5 ? '<path d="M0 12V0M0 0L-7 -9M0 0L7 -9" stroke="#e9ffff" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle r="15" cy="-4" fill="none" stroke="#5fe6ff" stroke-opacity=".35" stroke-dasharray="3 4"/>' : '<circle r="3" fill="#fff"/><circle r="9" fill="none" stroke="#5fe6ff" stroke-opacity=".6"/><circle r="16" fill="none" stroke="#5fe6ff" stroke-opacity=".25" stroke-dasharray="3 4"/>';
      if (theme === 'reef') return r < .5 ? at(0, 4, coral(.55 + r2 * .25)) : '<circle cx="-4" cy="2" r="6" fill="#ffb08a" fill-opacity=".7"/><circle cx="5" cy="-3" r="3.6" fill="#ff7a6b" fill-opacity=".85"/><circle cx="-6" cy="0" r="2" fill="#fff" fill-opacity=".5"/>';
      if (theme === 'cave') return r < .55 ? at(0, 4, cryst(r2 < .5 ? '#b48cff' : '#7ee8ff', .5 + r2 * .5)) : '<path d="M0 -10L9 5H-9Z" fill="#7ee8ff" fill-opacity=".12" stroke="#7ee8ff" stroke-opacity=".7" stroke-width="1.5" stroke-linejoin="round"/><circle r="2" fill="#fff"/>';
      return r < .4 ? '<circle r="14" fill="#ff5a3a" fill-opacity=".14"/><circle r="6" fill="#ffbd3a" fill-opacity=".8" stroke="#ff5a3a" stroke-width="1.6"/>' : r < .75 ? '<path d="M-7 -9L7 9M7 -9L-7 9" stroke="#ffbd3a" stroke-opacity=".8" stroke-width="4" stroke-linecap="round"/>' : '<g fill="#ff5a3a" fill-opacity=".7"><circle cx="-4" cy="3" r="2.5"/><circle cx="4" cy="-3" r="1.8"/><circle cx="5" cy="6" r="1.4"/></g>';
    },
    sign(label, w, z) {
      const name = label.replace(/^\S+\s+/, '').replace(/[a-z]/g, m => m.toUpperCase()), c = zt(z.theme)[0];
      return '<rect x="2" y="4" width="' + w + '" height="32" rx="6" fill="#000" opacity=".4"/><rect width="' + w + '" height="32" rx="6" fill="#04161b" fill-opacity=".94" stroke="' + c + '" stroke-opacity=".85" stroke-width="1.6"/>' +
        '<rect x="3" y="3" width="' + (w - 6) + '" height="7" rx="3" fill="#fff" fill-opacity=".07"/><path d="M5 12V5H12M' + (w - 5) + ' 20V27H' + (w - 12) + '" fill="none" stroke="' + c + '" stroke-opacity=".7" stroke-width="1.4"/>' +
        '<circle cx="17" cy="16" r="9" fill="' + c + '" fill-opacity=".18"/><circle cx="17" cy="16" r="4.5" fill="' + c + '"/><circle cx="15.6" cy="14.6" r="1.4" fill="#fff"/>' +
        '<text x="31" y="20.5" font-family="' + MONO + '" font-size="12" font-weight="700" letter-spacing=".6" fill="#d6f6fb">' + name + '</text>';
    },
    // boxes covering the big landmarks drawn in zone() (same placement maths: ax/bx/fy)
    keepOut(z) {
      const h = z.y1 - z.y0, ms = z.stops.reduce((s, p) => s + p[0], 0) / z.stops.length, ax = ms > 200 ? 74 : 326, bx = 400 - ax, fy = f => z.y0 + h * f;
      const B = (x, y, w, hh) => [f1(x - w), f1(y - hh), f1(x + w), f1(y + hh)], R = (x0, y0, x1, y1) => [f1(x0), f1(y0), f1(x1), f1(y1)];
      switch (ZT[z.theme] ? z.theme : 'cove') {
        case 'cove': return [B(ax, fy(.42), 36, 36), B(bx, fy(.7), 30, 30)];
        case 'beach': return [B(ax, fy(.5), 50, 28), B(bx, fy(.82), 28, 18), B(bx, fy(.36), 16, 16)];
        case 'town': return [B(ax, fy(.5), 72, 72), B(bx, fy(.82), 18, 18)];
        case 'harbour': { const rx = ax < 200 ? 20 : 330; return [B(ax, fy(.5), 54, 28), B(bx, fy(.8), 36, 20), R(rx, fy(.3), rx + 50, fy(.3) + 14)]; }
        case 'forest': return [B(ax, fy(.52), 72, 68), B(bx, fy(.84), 44, 40), B(bx, fy(.3), 14, 14)];
        case 'cape': return [R(ax - 16, fy(.68) - 58, ax + 16, fy(.68) + 40), B(bx, fy(.78), 22, 22), B(bx, fy(.35), 14, 14)];
        case 'reef': return [R(ax - 34, fy(.55) - 64, ax + 34, fy(.55) + 50), R(bx - 26, fy(.82) - 46, bx + 26, fy(.82) + 36), R(bx - 18, fy(.34) - 32, bx + 18, fy(.34) + 24)];
        case 'cave': { const gx = ax < 200 ? 30 : 250, gy = fy(.4); return [R(gx - 4, gy - 4, gx + 112, gy + 88), B(bx, fy(.85), 20, 50), B(ax, fy(.9), 14, 34)]; }
        case 'volcano': { const t = z.y0 + 64, b = z.y1 - 36; return [R(110, t - 24, 290, b + 24)]; }
        default: return [B(ax, fy(.42), 36, 36), B(bx, fy(.7), 30, 30)];
      }
    },
    road: { todo: ['#0d3640', '#041419', '#2f8a98'], done: ['#5fe6ff', '#0a5566', '#d8fbff'] },
    node(state, num, e, boss) {
      const L = num.length, fs = L > 2 ? 17 : L > 1 ? 22 : 27;
      if (state === 'locked') return '<circle r="31" fill="#071c22" stroke="#2c6670" stroke-width="2.6"/><circle r="25" fill="none" stroke="#123c44" stroke-width="1.6"/>' +
        '<path d="M-6 -2V-8A6 6 0 0 1 6 -8V-2" fill="none" stroke="#4aa3b2" stroke-width="3" stroke-linecap="round"/><rect x="-9.5" y="-3" width="19" height="15" rx="3.5" fill="#3b8a96"/><circle cy="4" r="2.4" fill="#04161b"/>' +
        (boss ? '<circle r="37" fill="none" stroke="#ff5a3a" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 5"/>' : '');
      const cur = state === 'current', done = state === 'beaten', g = cur ? 'ionsNC' : 'ionsN' + (e < 0 ? 0 : e), hc = cur ? CY : COL[e < 0 ? 0 : e];
      return (boss ? '<circle r="37" fill="none" stroke="#ff5a3a" stroke-width="2.4" stroke-dasharray="3 4"/>' : '') +
        '<circle r="' + (cur ? 38 : 35) + '" fill="' + hc + '" fill-opacity="' + (cur ? .22 : done ? .18 : .1) + '"/>' +
        (done ? '<circle r="35" fill="none" stroke="#e9ffff" stroke-opacity=".75" stroke-width="2"/>' : '') +
        '<circle r="30" fill="url(#' + g + ')" stroke="#e9ffff" stroke-opacity=".85" stroke-width="2.6"/><circle r="24" fill="none" stroke="#031014" stroke-opacity=".2" stroke-width="1.6"/>' +
        '<path d="M-21 -13A25 25 0 0 1 -4 -24" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>' +
        '<text y="' + f1(fs * .36) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs + '" font-weight="700" fill="#031014" stroke="#fff" stroke-opacity=".35" stroke-width="2.4" paint-order="stroke">' + num + '</text>' +
        (e >= 0 ? '<g transform="translate(23 -23)"><circle r="9.5" fill="#031014" stroke="' + COL[e] + '" stroke-width="1.6"/>' + shape(e, 5) + ' fill="' + COL[e] + '"/></g>' : '');
    },
    start() {
      return '<g transform="rotate(-28)"><path d="M-7 -44V4L0 26L7 4V-44Z" fill="#5fe6ff" fill-opacity=".12" stroke="#5fe6ff" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M-5.5 -10V4L0 20L5.5 4V-10Z" fill="#5fe6ff" fill-opacity=".75"/><rect x="-10" y="-62" width="20" height="20" rx="8" fill="#0d3a44" stroke="#5fe6ff" stroke-width="2"/><rect x="-9" y="-46" width="18" height="5" fill="#5fe6ff" fill-opacity=".6"/>' +
        '<path d="M-3 -38V-14" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/></g>' +
        '<path d="M-9 30Q-9 38 0 40Q9 38 9 30Q9 24 0 18Q-9 24 -9 30Z" transform="translate(14 -6) scale(.6)" fill="#5fe6ff"/>' +
        '<g transform="translate(24 8)"><rect x="-3" y="-11" width="52" height="19" rx="4" fill="#04161b" stroke="#5fe6ff" stroke-opacity=".7"/><text x="23" y="3" text-anchor="middle" font-family="' + MONO + '" font-size="11" font-weight="700" letter-spacing=".8" fill="#d6f6fb">START</text></g>';
    },
    pin() {
      return '<circle cy="-5" r="26" fill="#5fe6ff" fill-opacity=".16"/><path d="M0 27C-6 17 -19 9 -19 -5A19 19 0 0 1 19 -5C19 9 6 17 0 27Z" fill="url(#ionsPin)" stroke="#031014" stroke-width="3" stroke-linejoin="round"/>' +
        '<circle cy="-6" r="12.5" fill="#06232b" stroke="#e9ffff" stroke-width="1.6"/>' + ion(0, 0, -6, 8, false) + '<path d="M-13 -17A19 19 0 0 1 -3 -22" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/>';
    },
  };

  FTH_SKINS.register({
    id: 'ions', name: 'Ion Channels', ic: '⚛️', blurb: 'glowing ions in a living cell',
    icon, card, logo,
    coin: { name: 'ion orb', plural: 'ion orbs', glyph: '⚛️', value: 35, pitch: 1.6,   // this skin's currency (SKIN-SPEC.md section 12)
      colors: { main: '#5fe6ff', edge: '#ffe14d' },
      svg: FTH_SKINS.coinArt('<circle cx="1.4" cy="2.2" r="9" fill="#02090c" opacity=".55"/>' +
        '<g transform="rotate(-28)"><path d="M-12 0A12 4.6 0 0 1 12 0" fill="none" stroke="#04141a" stroke-width="3.6" stroke-linecap="round"/><path d="M-12 0A12 4.6 0 0 1 12 0" fill="none" stroke="#ffe14d" stroke-width="1.7" stroke-linecap="round"/></g>' +
        '<circle r="8.4" fill="#1590ae" stroke="#04141a" stroke-width="2"/><circle cx="-1" cy="-1.2" r="6" fill="#5fe6ff"/><circle cx="-1.8" cy="-2" r="3.4" fill="#b8f8ff"/>' +
        '<path d="M0 -3.4V3.4M-3.4 0H3.4" stroke="#04141a" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="-4" cy="-4.6" rx="2.2" ry="1.2" transform="rotate(-38 -4 -4.6)" fill="#fff"/>' +
        '<g transform="rotate(-28)"><path d="M12 0A12 4.6 0 0 1 -12 0" fill="none" stroke="#04141a" stroke-width="3.6" stroke-linecap="round"/><path d="M12 0A12 4.6 0 0 1 -12 0" fill="none" stroke="#ffe14d" stroke-width="1.7" stroke-linecap="round"/><circle cx="-7.7" cy="3.5" r="2.4" fill="#fff6c8" stroke="#04141a" stroke-width="1.3"/></g>') },
    src: 'lab/ions.html',
    hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 30% 20%, #0b2a30 0%, #04141a 55%, #020a0d 100%)',
      '--sk-ink': '#d6f6fb',
      '--sk-accent': '#5fe6ff',
      '--sk-card': 'linear-gradient(160deg, rgba(14,44,52,.96), rgba(5,20,26,.97))',
      '--sk-card-ink': '#d6f6fb',
      '--sk-hud': 'linear-gradient(180deg, rgba(8,32,38,.96), rgba(3,14,18,.96))',
      '--sk-btn': 'linear-gradient(180deg, #5fe6ff, #20b6d8)',
      '--sk-btn-ink': '#031014',
      '--sk-btn-shadow': '#0f6f86',
      '--sk-font': "'Space Grotesk', 'Inter', system-ui, sans-serif",
      '--sk-radius': '16px',
      '--sk-star-on': '#5fe6ff', '--sk-star-edge': '#031014', '--sk-star-off': '#3e8c9c', '--sk-star-off-edge': '#62b4c4',
      '--sk-ctl': '#0c3a44', '--sk-ctl-ink': '#e9fdff', '--sk-ctl-edge': '#5fe6ff',
      '--sk-chip': 'linear-gradient(180deg, rgba(10,44,52,.9), rgba(4,20,25,.94))',
      '--sk-chip-ink': '#d6f6fb',
      '--sk-edge': 'rgba(95,230,255,.7)',
      '--sk-coin': 'linear-gradient(180deg, #9ff3ff, #3fd6f2)',
    },
    // --sk-btn2 / --sk-btn2-ink are set here rather than in theme: tools/skin_check.js rejects digits in theme keys
    css: '--sk-btn2:linear-gradient(180deg,rgba(16,58,68,.95),rgba(6,26,31,.95));--sk-btn2-ink:#bff3ff;' + '.tl .tin{transition:filter .15s}.tl.lit .tin{filter:brightness(1.35)}.tl.glow .tin{filter:drop-shadow(0 0 6px #5fe6ff) drop-shadow(0 0 2px #fff)}' +
      // primary and secondary buttons: squared glass mounts, cyan hairline, inner highlight, soft glow instead of a solid edge
      '.btn3d{border-radius:12px;border:1px solid rgba(95,230,255,.55);letter-spacing:.14em;text-transform:uppercase;font-weight:700;font-family:var(--sk-font);' +
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 0 14px rgba(95,230,255,.2),0 8px 18px rgba(0,0,0,.45)}' +
      '.btn3d:active{transform:translateY(2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 0 8px rgba(95,230,255,.25)}' +
      '.btn3d.go{border-color:#cffbff;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 0 22px rgba(95,230,255,.45),0 8px 18px rgba(0,0,0,.4)}' +
      '.btn3d.white,.btn3d.yellow,.btn3d.blue,.btn3d.orange{border:1px solid rgba(95,230,255,.7)}' +
      '.btn3d.green,#briefGo{background:var(--sk-btn);color:var(--sk-btn-ink);text-shadow:none;border-color:#cffbff;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 0 22px rgba(95,230,255,.4),0 8px 18px rgba(0,0,0,.4)}' +
      // brief and win cards: a fine glass frame instead of the chunky white card border
      '#brief .card,#win .card{border:1px solid rgba(95,230,255,.45);border-radius:14px}' +
      // win-card points total: the same lit cyan readout as the HUD counter
      '.wtotal{background:var(--sk-coin);color:var(--sk-btn-ink);border:1px solid #cffbff;border-radius:10px;box-shadow:0 0 18px rgba(95,230,255,.45);font-family:var(--sk-font)}' +
      // round tool buttons and the game bar
      '.rbtn,.rbtn.sm,.bar .rb{border-radius:12px;border:1px solid rgba(95,230,255,.7);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 0 12px rgba(95,230,255,.22),0 6px 14px rgba(0,0,0,.45)}' +
      '.bar .rb svg{filter:drop-shadow(0 0 4px rgba(95,230,255,.6))}' +
      // bars, chips and badges: thin glass slides with a faint inner rim
      '.badge,.goalbar,.starbar{border-width:1px;border-radius:10px;font-family:var(--sk-font);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 0 14px rgba(95,230,255,.18)}' +
      '.badge{text-transform:uppercase;letter-spacing:.12em;font-size:.9rem;font-weight:700}' +
      '.coins{border-radius:10px;border:1px solid rgba(214,246,251,.8);font-family:var(--sk-font);box-shadow:0 0 14px rgba(95,230,255,.45)}' +
      '.coins b{font-variant-numeric:tabular-nums}' +
      '.mnode .mst{border-radius:6px;border-width:1px;letter-spacing:.06em}' +
      '.mnode .mtag{border-radius:6px;border-width:1px;font-family:ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.08em;text-transform:uppercase}' +
      '.mnode .pulse{border-width:2px;box-shadow:0 0 12px rgba(95,230,255,.5)}' +
      // talking pin bubble: glass with a matching tail
      '.say .msg{border-radius:10px;border-width:1px;font-family:var(--sk-font);font-weight:500;box-shadow:0 0 16px rgba(95,230,255,.22)}' +
      '.say .msg::before{border-right-color:rgba(95,230,255,.7)}' +
      '.say .msg::after{border-right-color:#0a2a31}' +
      // skin picker, how-to dots and step numbers
      '.skins button{border-radius:12px;font-family:var(--sk-font)}' +
      '.skins button[aria-checked="true"]{box-shadow:0 0 14px rgba(95,230,255,.5)}' +
      '.htdots button{border-radius:3px}' +
      '.htnum{border-radius:8px;box-shadow:0 0 12px rgba(95,230,255,.35)}' +
      // install sheet and cards: a slide with a fine inner frame
      '#installSheet .card{border-radius:14px;border:1px solid rgba(95,230,255,.45);box-shadow:0 0 30px rgba(95,230,255,.12);font-family:var(--sk-font)}',
    fonts: ['https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'Dock the signal', text: 'Five starred ions keep the signal out of every chamber.', svg: p1 },
      { title: 'Drag an ion', text: 'Drag an ion into another chamber: its whole chain trades places.', svg: p2 },
      { title: 'Locked stars', text: 'Two stars on one chain always flip together.', svg: p3 },
      { title: 'Free a chamber', text: 'Clear every star from one chamber and the signal docks.', svg: p4 },
    ],
    bonus: {
      label: 'ION',
      games: ['snake', 'pop'],
      intro: 'zoom',
      board: 'radial-gradient(ellipse at 50% 40%, #0d3a44, #031014 75%)',
      line: '#5fe6ff',
      // one big chunky ion per element: halo, offset shadow, deep base, lit body, highlight, dark outline
      tile(x, y, r, e, k) {
        const s = r * .6;
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<circle r="' + f1(r * .96) + '" fill="' + COL[e] + '" fill-opacity=".16" stroke="' + COL[e] + '" stroke-opacity=".5" stroke-width="' + f1(Math.max(1, r * .05)) + '"/>' +
          gem(e, 0, 0, s, { glow: 0, sw: .17 }).replace(/^<g transform="translate\(0 0\)">/, '<g>') + '</g></g>';
      },
    },
    map: {
      sea: ['#103c46', '#0f3640', '#0d303a', '#0c2a33', '#0a242c', '#091e26', '#07181f', '#061319', '#050f14'],
      seaX: '#020a0d',
      fog: '#010608',
      unknown: '#3b5a5e',
      ramp: ['#3ef0b4', '#ffe14d', '#ffa23a', '#ff5f8f'],
      grey: '#7d949a',
      route: '#5fe6ff',
      ink: 'rgba(190,240,250,.85)',
      cell(path, x, y, r) { // a round-cornered cell, like a membrane vesicle
        const h = r * .866, pts = [[r, 0], [r / 2, h], [-r / 2, h], [-r, 0], [-r / 2, -h], [r / 2, -h]];
        path.moveTo(x + (pts[5][0] + pts[0][0]) / 2, y + (pts[5][1] + pts[0][1]) / 2);
        for (let i = 0; i < 6; i++) {
          const p = pts[i], q = pts[(i + 1) % 6];
          path.quadraticCurveTo(x + p[0], y + p[1], x + (p[0] + q[0]) / 2, y + (p[1] + q[1]) / 2);
        }
        path.closePath();
      },
    },
    levelMap,
    words: { win: 'Signal docked!', perfect: 'Perfect route!', par: 'Par {par}: go for ★★★', chart: 'COLOURING SPACE' },
    eggs: [
      { id: 'rogue-ion', on: 'page', note: 'now and then a rogue ion zips across the cell: tap it to catch it', pays: true },
      { id: 'resonance', on: 'page', note: 'a solve in par moves makes the docked signal ring a resonance chord', pays: false },
    ],
  });
})();
