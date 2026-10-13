// Line Doodle: a hand-drawn map on paper, coloured in with felt-tip markers (red, blue, yellow, green hatching).
// After the winning swap the player still colours the blank piece with the free marker (waits: true).
// Colours and hatch angles match lab/doodle.html's PENS (0 fire, 1 water, 2 air, 3 earth).
(function () {
  const INK = '#2b2d42', PAPER = '#fffcf3';
  const COL = ['#ff5d5d', '#3fa7f5', '#ffc928', '#3ccf6e'], DK = ['#c93636', '#1f74b8', '#c9900a', '#1f8f45'];
  const LT_ = ['#ff9b9b', '#8fd0ff', '#ffe27a', '#8ff0ad'];   // light tints for highlights
  const ANG = [45, -45, 0, 90];               // hatch angle per element, degrees
  const NAMES = ['fire', 'water', 'air', 'earth'];
  const f1 = n => Math.round(n * 10) / 10;
  // deterministic hash -> [0,1)
  const hash = n => { let t = (Math.imul(n | 0, 0x9E3779B1) ^ 0x85EBCA6B) >>> 0; t = Math.imul(t ^ t >>> 15, 2246822519) >>> 0; t = Math.imul(t ^ t >>> 13, 3266489917) >>> 0; return ((t ^ t >>> 16) >>> 0) / 4294967296; };
  // wobbly hexagon vertices round (cx, cy), flat-top, jitter by seed
  function hexPts(cx, cy, r, seed, j) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i, jr = (hash(seed * 7 + i * 31) - 0.5) * 2 * j * r, ja = (hash(seed * 13 + i * 17 + 5) - 0.5) * 2 * j * r;
      pts.push([cx + Math.cos(a) * (r + jr) - Math.sin(a) * ja, cy + Math.sin(a) * (r + jr) + Math.cos(a) * ja]);
    }
    return pts;
  }
  const poly = pts => pts.map((p, i) => (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])).join('') + 'Z';
  // hatch lines (element e) across a square of half-size r about (0,0), to be clipped
  function hatch(e, r, gap, sw, op) {
    const a = ANG[e] * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx; let d = '';
    for (let t = -r * 1.2; t <= r * 1.2; t += gap) {
      const px = nx * t, py = ny * t; d += 'M' + f1(px - dx * r * 1.5) + ' ' + f1(py - dy * r * 1.5) + 'L' + f1(px + dx * r * 1.5) + ' ' + f1(py + dy * r * 1.5);
    }
    return '<path d="' + d + '" stroke="' + DK[e] + '" stroke-width="' + sw + '" stroke-linecap="round" fill="none" opacity="' + (op || .8) + '"/>';
  }
  // one hatched, inked hexagon (SVG fragment) at (cx, cy) with an offset shadow; id is prefixed with the skin id
  function piece(id, cx, cy, r, e, seed, extra) {
    id = 'doodle-' + id;
    const P = hexPts(cx, cy, r, seed, 0.06), P2 = hexPts(cx, cy, r, seed + 99, 0.07), d = poly(P);
    return '<path d="' + d + '" transform="translate(2.5 3.5)" fill="rgba(43,45,66,.32)"/>' +
      '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>' +
      '<path d="' + d + '" fill="' + COL[e] + '"/>' +
      '<g clip-path="url(#' + id + ')"><g transform="translate(' + f1(cx) + ' ' + f1(cy) + ')">' + hatch(e, r, Math.max(3, r / 4.2), Math.max(1, r / 14)) +
      '<path d="M' + f1(-r * .62) + ' ' + f1(-r * .2) + 'Q' + f1(-r * .5) + ' ' + f1(-r * .62) + ' ' + f1(-r * .1) + ' ' + f1(-r * .7) + '" stroke="#fff" stroke-width="' + f1(Math.max(1.6, r / 9)) + '" stroke-linecap="round" fill="none" opacity=".7"/></g></g>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.8, r / 8.5)) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + poly(P2) + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(Math.max(.8, r / 20)) + '" opacity=".35" stroke-linejoin="round"/>' + (extra || '');
  }
  const blank = (cx, cy, r, seed, dash) => {
    const d = poly(hexPts(cx, cy, r, seed, 0.06));
    return '<path d="' + d + '" transform="translate(2 3)" fill="rgba(43,45,66,.18)"/><path d="' + d + '" fill="#fff" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="6 5"' : '') + '/>';
  };
  // a chunky "?" (ink outline, felt-tip fill)
  const qmark = (x, y, s) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Fredoka,Arial Rounded MT Bold,Arial Black,system-ui,sans-serif" font-weight="700" font-size="' + s + '" fill="#ffc928" stroke="' + INK + '" stroke-width="' + f1(s / 9) + '" stroke-linejoin="round" paint-order="stroke">?</text>';
  const tape = (x, y, rot) => '<rect x="' + (x - 24) + '" y="' + (y - 7) + '" width="48" height="14" fill="rgba(255,236,160,.85)" stroke="rgba(180,150,60,.4)" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>';
  // a taped lined paper card background for a 300x250 svg, with an offset shadow
  const sheet = (rot) => '<g transform="rotate(' + (rot || 0) + ' 150 125)"><rect x="19" y="20" width="272" height="222" rx="4" fill="rgba(90,60,25,.3)"/><rect x="14" y="14" width="272" height="222" rx="4" fill="' + PAPER + '" stroke="rgba(80,50,20,.45)" stroke-width="1.5"/>' +
    '<path d="' + Array.from({ length: 8 }, (_, i) => 'M20 ' + (48 + i * 25) + 'H280').join('') + '" stroke="rgba(80,140,200,.2)" stroke-width="1"/><path d="M40 16V234" stroke="rgba(230,90,90,.28)" stroke-width="1.2"/>' + tape(150, 14, -3) + '</g>';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const RM = (css) => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  // a fat felt-tip marker, tip at (0, 0), body along +x (length ~93, half-width 13). Flat fills, outline, highlight, shade.
  const MSIL = 'M1 -2.5L14 -8L24 -13H88Q94 -13 94 -7V7Q94 13 88 13H24L14 8L1 2.5Q-1 0 1 -2.5Z';
  function markerArt(e) {
    const S = ' stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"';
    let h = ''; for (let x = 43; x <= 57; x += 5) h += 'M' + x + ' -11L' + (x + 4) + ' 11';
    return '<path d="M1 -2.6L14 -7.6V7.6L1 2.6Q-1.2 0 1 -2.6Z" fill="' + DK[e] + '"' + S + '/>' +
      '<path d="M14 -7.6L24 -13V13L14 7.6Z" fill="#efe9dc"' + S + '/><path d="M16 4.5L23 8" stroke="#b9b2a0" stroke-width="2" stroke-linecap="round"/>' +
      '<rect x="24" y="-13" width="58" height="26" rx="3" fill="' + COL[e] + '"/><rect x="24" y="4" width="58" height="9" fill="' + DK[e] + '" opacity=".5"/>' +
      '<rect x="40" y="-13" width="21" height="26" fill="#fffcf3"/><path d="' + h + '" stroke="' + DK[e] + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<rect x="24" y="-13" width="58" height="26" rx="3" fill="none"' + S + '/><path d="M40 -13V13M61 -13V13" stroke="' + INK + '" stroke-width="2"/>' +
      '<rect x="80" y="-14.5" width="14" height="29" rx="5" fill="' + DK[e] + '"' + S + '/><path d="M84 -9V6" stroke="' + LT_[e] + '" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M28 -8H37M64 -8H77" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".8"/>';
  }
  // place a marker with its tip at (x, y), body turned rot degrees, scale s, with an offset drop shadow
  const marker = (x, y, rot, e, s, cls) => {
    const t = ' rotate(' + rot + ') scale(' + (s || 1) + ')';
    return '<g' + (cls ? ' class="' + cls + '"' : '') + '><path d="' + MSIL + '" transform="translate(' + f1(x + 3.5 * (s || 1)) + ' ' + f1(y + 4.5 * (s || 1)) + ')' + t + '" fill="rgba(43,45,66,.35)"/>' +
      '<g transform="translate(' + x + ' ' + y + ')' + t + '">' + markerArt(e) + '</g></g>';
  };
  // a bold felt-tip scribble (zigzag) between (x0, y0) and (x1, y1), amplitude a, n strokes
  const scribble = (x0, y0, x1, y1, a, n, c, w) => {
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L; let d = 'M' + f1(x0) + ' ' + f1(y0);
    for (let i = 1; i <= n; i++) { const t = i / n, s = i % 2 ? 1 : -1; d += 'L' + f1(x0 + ux * L * t - uy * a * s) + ' ' + f1(y0 + uy * L * t + ux * a * s); }
    return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  };
  // a filled doodle star (ink outline) at (x, y), radius r
  const star = (x, y, r, c, rot) => {
    const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .46 : r; p.push([Math.cos(a) * q, Math.sin(a) * q]); }
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')"><path d="' + poly(p) + '" transform="translate(1.5 2)" fill="rgba(43,45,66,.3)"/><path d="' + poly(p) + '" fill="' + (c || '#ffc928') + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/></g>';
  };
  // a ghost finger (pointing up-left), tip at (0, 0)
  const finger = (x, y, rot, s) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + (s || 1) + ')"><path d="M0 0C-3 -2 -4 -6 -1 -8C3 -9 6 -6 9 -1L13 -4C16 -6 19 -4 19 -1L22 -2C25 -3 27 0 26 3C29 3 30 7 28 10L24 24C22 30 14 33 8 30L-2 22C-6 19 -5 14 -1 14L6 17L0 0Z" fill="rgba(255,255,255,.92)" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M2 -3C3 -5 5 -5 6 -3" stroke="' + INK + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/></g>';
  // pentagon of five rim pieces round (cx, cy)
  const rimPos = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const QPULSE = '.q{transform-box:fill-box;transform-origin:50% 55%;animation:dq 1.6s ease-in-out infinite}@keyframes dq{0%,100%{transform:scale(1) rotate(-4deg)}50%{transform:scale(1.18) rotate(5deg)}}';

  // ---- title art: a rim of four felt-tip pieces round a blank hole, the free marker hovering, ready to colour it ----
  const T = rimPos(150, 118, 62), tcol = [0, 1, 2, 3, 1];
  const titleSvg = svg(sheet(-1.5) +
    T.map((p, i) => piece('tt' + i, p[0], p[1], 31, tcol[i], 20 + i)).join('') +
    blank(150, 118, 32, 3, true) + '<g class="q">' + qmark(150, 134, 46) + '</g>' +
    star(40, 46, 9, '#ffc928', 10) + star(262, 206, 8, '#3fa7f5', -12) + star(52, 204, 6, '#ff5d5d', 20) +
    marker(178, 152, -38, 3, .95, 'dtmk'),
    RM(QPULSE + '.dtmk{animation:dtmk 1.8s ease-in-out infinite}@keyframes dtmk{0%,100%{transform:translate(0,0)}50%{transform:translate(-7px,-6px)}}'));

  // ---- intro pages (each: one picture, one short sentence) ----
  const rp = rimPos(150, 112, 58);
  // page 1: the goal: four pens all touch the blank, none fits
  const p1 = svg(sheet(1) +
    rp.map((p, i) => piece('a' + i, p[0], p[1], 28, [0, 1, 2, 3, 0][i], 40 + i)).join('') +
    blank(150, 112, 29, 5, true) + '<g class="q">' + qmark(150, 127, 40) + '</g>' +
    [0, 1, 2, 3].map(e => '<g class="d1t' + e + '">' + marker(70 + e * 50, 214, -90, e, .42) + '</g>').join(''),
    RM(QPULSE + '.d1t0,.d1t1,.d1t2,.d1t3{animation:d1th 3.2s ease-in-out infinite}.d1t1{animation-delay:.4s}.d1t2{animation-delay:.8s}.d1t3{animation-delay:1.2s}@keyframes d1th{0%,30%,100%{transform:translateY(0)}12%{transform:translateY(-10px)}20%{transform:translateY(0) translateX(2px)}25%{transform:translateX(-2px)}}'));
  // page 2: pick a marker, tap a piece: it recolours
  const p2 = svg(sheet(-1) +
    piece('b0', 110, 92, 32, 0, 61) + piece('b1', 186, 92, 32, 2, 62) + '<g class="d2sw">' + piece('b2', 110, 92, 32, 1, 61) + '</g>' +
    [0, 1, 2, 3].map(e => '<g class="' + (e === 1 ? 'd2up' : '') + '">' + marker(66 + e * 56, 214, -90, e, .5) + '</g>').join('') +
    '<g class="d2fg">' + finger(0, 0, -10, 1.1) + '</g>',
    RM('.d2sw{opacity:0;animation:d2sw 3.4s infinite}@keyframes d2sw{0%,55%{opacity:0}62%,92%{opacity:1}100%{opacity:0}}' +
      '.d2up{animation:d2up 3.4s infinite}@keyframes d2up{0%,12%{transform:translateY(0)}20%,92%{transform:translateY(-12px)}100%{transform:translateY(0)}}' +
      '.d2fg{animation:d2fg 3.4s ease-in-out infinite}@keyframes d2fg{0%{transform:translate(132px,212px)}14%{transform:translate(126px,190px)}20%{transform:translate(126px,184px)}48%{transform:translate(114px,104px)}56%{transform:translate(112px,96px) scale(.9)}64%{transform:translate(114px,104px)}100%{transform:translate(132px,212px)}}') +
    '.d2fg{transform:translate(114px,104px)}');
  // page 3: the whole two-pen group swaps in a wave
  const row = (x0, y, cols, id) => cols.map((e, i) => piece(id + i, x0 + i * 44, y, 19, e, 80 + i * 3)).join('');
  const p3 = svg(sheet(.8) +
    '<path d="M44 86H196" stroke="#fff176" stroke-width="44" stroke-linecap="round" opacity=".85"/>' +
    row(54, 86, [0, 1, 0, 1], 'c') + piece('c9', 236, 86, 19, 3, 95) +
    '<g class="d3fg">' + finger(58, 92, -10, 1) + '</g>' +
    '<path d="M150 124V152" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M138 142L150 156L162 142" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    [1, 0, 1, 0].map((e, i) => '<g class="d3w' + i + '">' + piece('d' + i, 54 + i * 44, 192, 19, e, 80 + i * 3) + '</g>').join('') + piece('d9', 236, 192, 19, 3, 95) +
    star(262, 150, 8, '#ffc928', 12),
    RM('.d3fg{animation:d3tap 2s ease-in-out infinite}@keyframes d3tap{0%,60%,100%{transform:translateY(0)}75%{transform:translateY(5px)}}' +
      '.d3w0,.d3w1,.d3w2,.d3w3{transform-box:fill-box;transform-origin:50% 50%;animation:d3wv 2s ease-in-out infinite}.d3w1{animation-delay:.08s}.d3w2{animation-delay:.16s}.d3w3{animation-delay:.24s}@keyframes d3wv{0%,70%,100%{transform:scale(1)}80%{transform:scale(1.18) rotate(-8deg)}90%{transform:scale(.96)}}'));
  // page 4: a lock
  const lp = rimPos(150, 108, 56);
  const p4 = svg(sheet(-1) +
    lp.map((p, i) => piece('e' + i, p[0], p[1], 25, [0, 1, 2, 0, 1][i], 110 + i)).join('') + blank(150, 108, 26, 7, true) +
    '<path d="M150 52C100 32 36 66 52 116C60 146 100 166 150 172C210 166 252 146 250 108C246 76 200 40 150 52" fill="none" stroke="' + DK[0] + '" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>' +
    '<g class="d4lk"><g transform="translate(150 196)"><rect x="-15" y="-1" width="34" height="26" rx="5" fill="rgba(43,45,66,.35)"/><path d="M-11 -4V-13A11 11 0 0 1 11 -13V-4" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M-11 -4V-13A11 11 0 0 1 11 -13V-4" fill="none" stroke="#b9bec6" stroke-width="3" stroke-linecap="round"/><rect x="-17" y="-4" width="34" height="26" rx="5" fill="#ffc928" stroke="' + INK + '" stroke-width="2.8"/><path d="M-12 1H6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/><circle cx="0" cy="9" r="3.6" fill="' + INK + '"/></g></g>',
    RM('.d4lk{transform-box:fill-box;transform-origin:50% 100%;animation:d4shk 2.6s ease-in-out infinite}@keyframes d4shk{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-9deg)}90%{transform:rotate(9deg)}95%{transform:rotate(-4deg)}}'));
  // page 5: the win: three pens on the rim, the fourth colours the blank
  const wp = rimPos(150, 108, 56);
  const p5 = svg(sheet(1) +
    wp.map((p, i) => piece('g' + i, p[0], p[1], 25, [0, 1, 2, 1, 0][i], 130 + i)).join('') +
    '<g class="d5fl">' + piece('g9', 150, 108, 26, 3, 7) + '</g>' +
    star(64, 52, 10, '#ffc928', -8) + star(236, 46, 8, '#ff5d5d', 14) + star(250, 168, 9, '#3fa7f5', 4) +
    marker(166, 128, -40, 3, .8) +
    '<g transform="translate(96 200) rotate(-8)"><rect x="-50" y="-16" width="104" height="36" rx="12" fill="rgba(43,45,66,.4)"/><rect x="-54" y="-20" width="104" height="36" rx="12" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2.8"/><text x="-2" y="6" text-anchor="middle" font-family="Fredoka,Arial Rounded MT Bold,system-ui,sans-serif" font-weight="700" font-size="20" fill="' + DK[3] + '">Coloured!</text></g>',
    RM('.d5fl{transform-box:fill-box;transform-origin:50% 50%;animation:d5fl 2.4s ease-in-out infinite}@keyframes d5fl{0%,100%{transform:scale(1)}15%{transform:scale(1.15) rotate(6deg)}30%{transform:scale(1)}}'));

  // ---- icon / card / logo ----
  const FK = "Fredoka, 'Arial Rounded MT Bold', 'Arial Black', system-ui, sans-serif";
  const hpat = (id, e, gap, w) => '<pattern id="' + id + '" width="' + gap + '" height="' + gap + '" patternUnits="userSpaceOnUse" patternTransform="rotate(' + (ANG[e] + 90) + ')"><rect width="' + gap + '" height="' + gap + '" fill="' + COL[e] + '"/><path d="M' + gap / 2 + ' 0V' + gap + '" stroke="' + DK[e] + '" stroke-width="' + w + '" opacity=".7"/></pattern>';
  // the wordmark, drawn in a 240x80 box; p prefixes its ids
  function logoArt(p) {
    const A = 'x="120" y="55" text-anchor="middle" font-family="' + FK + '" font-weight="700" font-size="37" textLength="206" lengthAdjust="spacingAndGlyphs"';
    let k = 0; const ts = 'Line Doodle'.split('').map(ch => ch === ' ' ? '\u00a0\u00a0' : '<tspan fill="' + COL[[0, 1, 2, 3, 0, 1, 2, 3, 0, 1][k++]] + '">' + ch + '</tspan>').join('');
    return '<defs><clipPath id="' + p + 'hl"><rect x="0" y="0" width="240" height="41"/></clipPath></defs>' +
      '<g transform="rotate(-3 120 40)">' +
      '<path d="M22 52Q120 40 218 50" stroke="rgba(43,45,66,.25)" stroke-width="24" stroke-linecap="round" fill="none" transform="translate(3 4)"/>' +
      '<path d="M22 52Q120 40 218 50" stroke="#fff176" stroke-width="24" stroke-linecap="round" fill="none"/>' +
      '<text ' + A + ' transform="translate(3 4.5)" fill="' + INK + '" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round">Line\u00a0\u00a0Doodle</text>' +
      '<text ' + A + ' stroke="' + INK + '" stroke-width="7" stroke-linejoin="round" paint-order="stroke">' + ts + '</text>' +
      '<text ' + A + ' fill="#fff" opacity=".38" clip-path="url(#' + p + 'hl)">Line\u00a0\u00a0Doodle</text>' +
      scribble(40, 70, 112, 68, 2.6, 9, DK[0], 3) + '</g>' +
      star(222, 16, 9, '#ffc928', 12) + star(16, 22, 6, '#3fa7f5', -10);
  }
  const logoSvg = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + logoArt('doodle-lg-') + '</svg>';

  // app icon: a four-colour map piece on lined paper, a fat green marker colouring its last piece in
  const iconSvg = (() => {
    const p = 'doodle-ic-', S = ' stroke="' + INK + '" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"';
    const C = [50, 63], top = [52, 24], UL = [17, 44], ML = [16, 70], LL = [19, 90], BOT = [52, 108], LR = [87, 88], MR = [88, 64], UR = [86, 44];
    const pth = pts => 'M' + pts.map(q => q[0] + ' ' + q[1]).join('L') + 'Z';
    const hex = pth([top, UR, MR, LR, BOT, LL, ML, UL]);
    const pc = [[C, top, UL, ML], [C, top, UR, MR], [C, MR, LR, BOT], [C, BOT, LL, ML]];
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="' + p + 'bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".55" stop-color="#ffe7b3"/><stop offset="1" stop-color="#f6c77a"/></linearGradient>' +
      '<clipPath id="' + p + 'cl"><rect width="120" height="120" rx="26"/></clipPath>' +
      [0, 1, 2].map(e => hpat(p + 'h' + e, e, 6, 1.8)).join('') + '<clipPath id="' + p + 'g3"><path d="' + pth(pc[3]) + '"/></clipPath></defs>' +
      '<rect width="120" height="120" rx="26" fill="url(#' + p + 'bg)"/>' +
      '<g clip-path="url(#' + p + 'cl)"><path d="M0 22H120M0 40H120M0 58H120M0 76H120M0 94H120M0 112H120" stroke="#7fb6e6" stroke-width="1.6" opacity=".55"/><path d="M11 0V120" stroke="#ff7b7b" stroke-width="2" opacity=".6"/></g>' +
      '<path d="' + hex + '" transform="translate(4 5)" fill="#b9864a" opacity=".75"/>' +
      '<path d="' + pth(pc[3]) + '" fill="#fff"/>' +
      [0, 1, 2].map(e => '<path d="' + pth(pc[e]) + '" fill="url(#' + p + 'h' + e + ')"/>').join('') +
      '<path d="M24 52Q27 40 40 34" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".75"/><path d="M60 38Q70 37 76 44" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".7"/>' +
      '<g clip-path="url(#' + p + 'g3)">' + scribble(14, 70, 48, 106, 8, 11, COL[3], 8) + scribble(14, 70, 48, 106, 8, 11, DK[3], 2.2) + '</g>' +
      [0, 1, 2, 3].map(e => '<path d="' + pth(pc[e]) + '" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>').join('') +
      '<path d="' + hex + '" fill="none"' + S + '/>' +
      marker(40, 90, -45, 3, .86) +
      '<path d="M20 14L22.5 20L29 22.5L22.5 25L20 31L17.5 25L11 22.5L17.5 20Z" fill="#fff6a8" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M100 98L101.6 102L105.5 103.5L101.6 105L100 109L98.4 105L94.5 103.5L98.4 102Z" fill="#fff" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<rect x="1.5" y="1.5" width="117" height="117" rx="25" fill="none" stroke="rgba(150,100,40,.35)" stroke-width="3"/></svg>';
  })();

  // reel card: a hand-drawn map on a taped sheet, a yellow/green chain glowing, the red marker colouring the blank; logo below
  const cardSvg = (() => {
    const p = 'doodle-cd-', x0 = 32, y0 = 32, cw = 44, ch = 42;
    const V = []; for (let i = 0; i <= 4; i++) { V[i] = []; for (let j = 0; j <= 4; j++) {
      const inside = i > 0 && i < 4 && j > 0 && j < 4;
      V[i][j] = [x0 + i * cw + (inside ? (hash(i * 17 + j * 5 + 3) - .5) * 26 : 0), y0 + j * ch + (inside ? (hash(i * 7 + j * 23 + 11) - .5) * 22 : 0)]; } }
    const cell = (i, j) => [V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]];
    const cc = (i, j) => ((i + (j >> 1)) % 2) + 2 * (j % 2);
    const pd = pts => 'M' + pts.map(q => f1(q[0]) + ' ' + f1(q[1])).join('L') + 'Z';
    const HI = 1, HJ = 2;                                // the blank piece; its neighbours are blue, blue, green, yellow: red is free
    const chain = [[0, 3], [1, 3], [2, 3], [3, 3]];   // a yellow/green chain lights up
    let fills = '', glow = '', lines = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const d = pd(cell(i, j));
      if (i === HI && j === HJ) fills += '<path d="' + d + '" fill="#fff"/>';
      else fills += '<path d="' + d + '" fill="url(#' + p + 'h' + cc(i, j) + ')"/>';
      lines += '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
    }
    chain.forEach(([i, j]) => { const d = pd(cell(i, j)); glow += '<path d="' + d + '" fill="none" stroke="#ff7a00" stroke-width="12" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="#fff59d" stroke-width="7" stroke-linejoin="round"/>'; });
    const hc = cell(HI, HJ), hx = (hc[0][0] + hc[2][0]) / 2, hy = (hc[0][1] + hc[2][1]) / 2;
    return '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="' + p + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1dcb2"/><stop offset="1" stop-color="#d6ae72"/></linearGradient>' +
      '<pattern id="' + p + 'dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.2" fill="rgba(140,100,50,.25)"/></pattern>' +
      '<clipPath id="' + p + 'hole"><path d="' + pd(hc) + '"/></clipPath>' +
      [0, 1, 2, 3].map(e => hpat(p + 'h' + e, e, 7, 2)).join('') + '</defs>' +
      '<rect width="240" height="320" fill="url(#' + p + 'bg)"/><rect width="240" height="320" fill="url(#' + p + 'dots)"/>' +
      '<g transform="rotate(-2 120 120)"><rect x="21" y="22" width="206" height="206" rx="4" fill="rgba(90,60,25,.35)"/><rect x="16" y="16" width="208" height="208" rx="4" fill="' + PAPER + '" stroke="rgba(80,50,20,.45)" stroke-width="1.5"/>' +
      fills + glow +
      '<g clip-path="url(#' + p + 'hole)">' + scribble(hx - 22, hy - 16, hx + 4, hy + 18, 9, 9, COL[0], 8) + scribble(hx - 22, hy - 16, hx + 4, hy + 18, 9, 9, DK[0], 2.2) + '</g>' +
      lines + '<path d="M' + x0 + ' ' + y0 + 'H' + (x0 + 4 * cw) + 'V' + (y0 + 4 * ch) + 'H' + x0 + 'Z" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      tape(120, 16, -4) + '</g>' +
      star(204, 40, 9, '#ffc928', 14) + star(28, 196, 7, '#3fa7f5', -6) + star(214, 168, 6, '#ff5d5d', 20) +
      marker(hx + 8, hy + 18, -42, 0, .92) +
      '<g transform="translate(0 236)">' + logoArt('doodle-cdlg-') + '</g></svg>';
  })();
  // ---- level map: a sketchbook adventure map (kraft desk, taped paper zones, marker doodles) ----
  const LMF = "Patrick Hand,Comic Sans MS,cursive", PEN = 'rgba(70,72,90,.55)';
  const SI = ' stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"';
  const hat = k => 'url(#doodleH' + k + ')';
  const jt = (s, i, a) => (hash(s * 11 + i * 7) - .5) * a;
  const P_ = (pts, s, a) => poly(pts.map((p, i) => [p[0] + jt(s, i * 2, a), p[1] + jt(s, i * 2 + 1, a)]));
  const wr = (x0, y0, x1, y1, s) => P_([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], s, 1.6);
  const blobD = (cx, cy, rx, ry, s, j) => {
    const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * 2 * Math.PI, k = 1 + jt(s, i, 2 * j); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    let d = 'M' + f1((pts[8][0] + pts[0][0]) / 2) + ' ' + f1((pts[8][1] + pts[0][1]) / 2);
    pts.forEach((p, i) => { const n = pts[(i + 1) % 9]; d += 'Q' + f1(p[0]) + ' ' + f1(p[1]) + ' ' + f1((p[0] + n[0]) / 2) + ' ' + f1((p[1] + n[1]) / 2); });
    return d + 'Z';
  };
  const bl = (cx, cy, rx, ry, s, fill) => '<path d="' + blobD(cx, cy, rx, ry, s, .07) + '" fill="' + fill + '"' + SI + '/>';
  const wrect = (a, b, c, d, s, j) => {
    const p = []; let i = 0; const n = (x, y) => { p.push([x + jt(s, i, 2 * j), y + jt(s, i + 50, 2 * j)]); i++; };
    for (let x = a; x < c; x += 70) n(x, b); for (let y = b; y < d; y += 70) n(c, y); for (let x = c; x > a; x -= 70) n(x, d); for (let y = d; y > b; y -= 70) n(a, y);
    return poly(p);
  };
  const tapeS = (x, y, rot) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><rect x="-22" y="-7" width="44" height="14" fill="rgba(255,226,120,.85)"/><path d="M-22 -7V7M22 -7V7" stroke="rgba(160,120,30,.45)" stroke-width="1.2" stroke-dasharray="2 2"/></g>';
  const hp = (id, base, line, rot, gap, w) => '<pattern id="doodleH' + id + '" width="' + gap + '" height="' + gap + '" patternUnits="userSpaceOnUse" patternTransform="rotate(' + rot + ')"><rect width="' + gap + '" height="' + gap + '" fill="' + base + '"/><path d="M' + gap / 2 + ' 0V' + gap + '" stroke="' + line + '" stroke-width="' + (w || 1.1) + '" opacity=".8"/></pattern>';
  const LM_DEFS = hp(0, COL[0], DK[0], -45, 5) + hp(1, COL[1], DK[1], 45, 5) + hp(2, COL[2], DK[2], -90, 5) + hp(3, COL[3], DK[3], 0, 5) +
    hp('g', '#c3c6cf', '#7d8190', 45, 4.5) + hp('b', '#d9a066', '#8a5a2b', 0, 4.5) + hp('v', '#b99be8', '#6c4fb0', -45, 4.5) + hp('k', '#ffc4d6', '#d9709a', 45, 4.5) + hp('w', '#fffcf3', '#b9b2a0', -45, 4.5) +
    '<pattern id="doodleLined" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M0 25.5H26" stroke="rgba(80,140,200,.3)" stroke-width="1.1"/></pattern>' +
    '<pattern id="doodleGrid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 .5H18M.5 0V18" stroke="rgba(80,140,200,.22)" stroke-width="1"/></pattern>' +
    '<pattern id="doodleDots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.2" fill="rgba(90,110,130,.4)"/></pattern>' +
    '<pattern id="doodleKraft" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="7.5" cy="7.5" r="1.2" fill="rgba(140,100,50,.22)"/></pattern>';
  const LT = {   // paper tint, line pattern, ground blobs (pattern id, opacity)
    cove: ['#e9f5fb', 'Grid', [['1', .45], ['1', .3], ['2', .35]]], beach: ['#fff3cf', 'Dots', [['2', .45], ['1', .4], ['2', .3]]],
    town: ['#fffcf3', 'Lined', [['3', .3], ['3', .22], ['w', .6]]], harbour: ['#f5ebd6', 'Grid', [['1', .4], ['b', .35], ['1', .3]]],
    forest: ['#eaf5e1', 'Dots', [['3', .4], ['3', .3], ['3', .35]]], cape: ['#eceff5', 'Lined', [['g', .45], ['3', .25], ['g', .3]]],
    reef: ['#e5f6f3', 'Grid', [['1', .4], ['k', .4], ['1', .3]]], cave: ['#ece4f7', 'Grid', [['v', .5], ['v', .35], ['g', .35]]],
    volcano: ['#fde6d7', 'Dots', [['0', .35], ['g', .5], ['b', .4]]],
  };
  const ln = (d, c, w) => '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  const dot = (x, y, r, f) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (f || INK) + '"/>';
  const star5 = (r, s) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; p.push([Math.cos(a) * q, Math.sin(a) * q]); } return P_(p, s, 1); };
  const leaf = (rot, len, s) => '<path d="M0 0Q' + len * .5 + ' ' + -len * .45 + ' ' + len + ' ' + -len * .08 + 'Q' + len * .5 + ' ' + -len * .1 + ' 0 0Z" transform="rotate(' + rot + ')" fill="' + hat(3) + '"' + SI + '/>';
  const house = (k) => '<path d="' + wr(-12, -8, 12, 10, k) + '" fill="' + PAPER + '"' + SI + '/><path d="M-16 -7L0 -22L16 -7Z" fill="' + hat(k % 4) + '"' + SI + '/><path d="' + wr(-3.5, 1, 3.5, 10, k + 3) + '" fill="' + hat('b') + '" stroke="' + INK + '" stroke-width="1.4"/><path d="' + wr(-10, -5, -5, 0, k + 5) + '" fill="#bfe6ff" stroke="' + INK + '" stroke-width="1.3"/><path d="M8 -17V-23" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
  const tree = (k) => '<path d="M-2 10V0H2V10" fill="' + hat('b') + '" stroke="' + INK + '" stroke-width="1.6"/>' + bl(0, -9, 11 + (k % 3), 10, k, hat(3)) + ln('M-5 -12q3 -3 6 0M1 -6q3 -3 6 0', DK[3], 1.5);
  const pine = (k) => '<path d="M-2 11V5H2V11" fill="' + hat('b') + '" stroke="' + INK + '" stroke-width="1.6"/><path d="' + P_([[0, -24], [10, -8], [4, -8], [13, 4], [-13, 4], [-4, -8], [-10, -8]], k, 1.4) + '" fill="' + hat(3) + '"' + SI + '/>';
  const shell = (k) => '<path d="M-9 7Q-13 -6 0 -10Q13 -6 9 7Z" fill="' + hat('k') + '"' + SI + '/>' + ln('M0 7V-8M-4 7L-6 -5M4 7L6 -5', INK, 1.1);
  const rock = (k) => '<path d="' + blobD(0, 0, 10 + (k % 4), 8, k, .1) + '" fill="' + hat('g') + '"' + SI + '/>' + ln('M-5 -3q3 -3 6 -2', '#fff', 1.6);
  const fish = (k) => { const e = k % 3; return '<path d="M-11 0Q-2 -9 8 0Q-2 9 -11 0Z" fill="' + hat(e) + '"' + SI + '/><path d="M8 0L15 -6V6Z" fill="' + hat(e) + '"' + SI + '/>' + dot(-6, -1.5, 1.4) + ln('M-1 -4q2 4 0 8', INK, 1.2); };
  const bubbles = () => '<g fill="rgba(255,255,255,.7)" stroke="#1f74b8" stroke-width="1.5"><circle cx="-5" cy="3" r="4"/><circle cx="4" cy="-4" r="3"/><circle cx="7" cy="7" r="2.2"/></g>';
  const starfish = (k) => '<path d="' + star5(10, k) + '" fill="' + hat(k % 2 ? 0 : 2) + '"' + SI + '/>' + dot(0, 0, 1.2);
  const crystal = (k) => { const e = ['1', 'v', 'k'][k % 3]; return '<path d="' + P_([[0, -22], [7, -8], [4, 6], [-4, 6], [-7, -8]], k, 1.2) + '" fill="' + hat(e) + '"' + SI + '/><path d="' + P_([[10, -12], [15, -3], [12, 6], [7, 6], [6, -3]], k + 4, 1) + '" fill="' + hat(e) + '"' + SI + '/>' + ln('M-2 -16L-3 -4', '#fff', 1.8); };
  const lava = (k) => bl(0, 0, 15, 7, k, hat(0)) + bl(-2, -1, 8, 3, k + 2, hat(2)).replace(SI, ' stroke="' + INK + '" stroke-width="1.2"');
  const dead = () => ln('M0 9V-16M0 -4L-8 -13M0 -9L7 -18M0 2L6 -4', INK, 3);
  const gem = (k) => '<path d="M-9 -3L-4 -9H4L9 -3L0 9Z" fill="' + hat(['2', '0', '1'][k % 3]) + '"' + SI + '/>' + ln('M-9 -3H9M-4 -9L-2 -3L0 9M4 -9L2 -3', INK, 1.1);
  const DEC = {
    cove: [k => '<path d="M-16 12q4 -3 8 0t8 0t8 0" stroke="' + DK[1] + '" fill="none" stroke-width="2" stroke-linecap="round"/><ellipse cx="0" cy="3" rx="12" ry="8" fill="' + hat(2) + '"' + SI + '/><circle cx="8" cy="-6" r="6" fill="' + hat(2) + '"' + SI + '/><path d="M13 -6l6 2 -6 3z" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round"/>' + dot(9.5, -7.5, 1.3) + ln('M-6 3q5 4 10 -1', INK, 1.4),
      k => ln('M-16 -5q4 -5 8 0t8 0t8 0', DK[1], 2.4) + ln('M-12 3q4 -5 8 0t8 0t8 0', COL[1], 2.4) + ln('M-16 11q4 -5 8 0t8 0t8 0', DK[1], 2.4), shell, starfish, bubbles],
    beach: [k => k % 4 ? '' : '<circle r="8" fill="' + hat(2) + '"' + SI + '/>' + ln([0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return 'M' + f1(Math.cos(a) * 12) + ' ' + f1(Math.sin(a) * 12) + 'L' + f1(Math.cos(a) * 18) + ' ' + f1(Math.sin(a) * 18); }).join(''), INK, 2) + ln('M-3 1q3 3 6 0', INK, 1.4) + dot(-3, -2, 1.1) + dot(3, -2, 1.1),
      k => ln('M0 14V-4', INK, 2.4) + '<path d="M-17 -3Q0 -27 17 -3Q9 -8 0 -3Q-9 -8 -17 -3Z" fill="' + hat([0, 1, 3][k % 3]) + '"' + SI + '/>' + ln('M-8 14h16', DK[2], 2.4),
      k => '<path d="M0 12Q6 -4 0 -16" stroke="' + INK + '" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M0 12Q6 -4 0 -16" stroke="' + hat('b') + '" stroke-width="3.2" fill="none" stroke-linecap="round"/><g transform="translate(0 -16)">' + [-155, -100, -45, 10].map(a => leaf(a, 17)).join('') + '</g>',
      k => '<circle r="8" fill="' + PAPER + '"' + SI + '/><path d="M-8 0A8 8 0 0 1 0 -8V0Z" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="1.2"/><path d="M8 0A8 8 0 0 1 0 8V0Z" fill="' + hat(1) + '" stroke="' + INK + '" stroke-width="1.2"/>', shell, k => '<path d="M0 12Q6 -4 0 -16" stroke="' + INK + '" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M0 12Q6 -4 0 -16" stroke="' + hat('b') + '" stroke-width="3.2" fill="none" stroke-linecap="round"/><g transform="translate(0 -16)">' + [-155, -100, -45, 10].map(a => leaf(a, 17)).join('') + '</g>'],
    town: [house, house, tree, k => tree(k + 1), k => [[-8, 2, 0], [0, -5, 2], [8, 3, 1]].map((f, i) => ln('M' + f[0] + ' ' + (f[1] + 4) + 'V10', DK[3], 2) + '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="4" fill="' + hat(f[2]) + '" stroke="' + INK + '" stroke-width="1.3"/>').join('')],
    harbour: [k => ln('M-14 12q4 -3 8 0t8 0t8 0', DK[1], 2) + '<path d="M-14 3H14L9 11H-9Z" fill="' + hat('b') + '"' + SI + '/>' + ln('M0 3V-19', INK, 2.2) + '<path d="M2 -18L14 0H2Z" fill="' + PAPER + '"' + SI + '/><path d="M-1 -19l-8 3 8 2" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="1.3"/>',
      k => '<path d="' + wr(-10, -10, 10, 10, k) + '" fill="' + hat('b') + '"' + SI + '/>' + ln('M-10 -10L10 10M10 -10L-10 10', '#8a5a2b', 1.6),
      k => ln('M0 -9V10M-8 -3H8M-11 3Q-9 11 0 11Q9 11 11 3', INK, 4.4) + ln('M0 -9V10M-8 -3H8M-11 3Q-9 11 0 11Q9 11 11 3', '#9aa3b8', 1.8) + '<circle cy="-13" r="3.6" fill="none" stroke="' + INK + '" stroke-width="2.2"/>',
      k => '<path d="M-8 -10Q-13 0 -8 10H8Q13 0 8 -10Z" fill="' + hat('b') + '"' + SI + '/>' + ln('M-10 -4H10M-10 4H10', INK, 1.3),
      k => '<circle r="8" fill="' + PAPER + '"' + SI + '/><path d="M-8 0A8 8 0 0 1 8 0Z" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="1.3"/><circle cy="-10" r="2.6" fill="none" stroke="' + INK + '" stroke-width="1.8"/>'],
    forest: [k => tree(k), pine, pine, k => '<path d="M-3 10Q-4 2 -3 -2H3Q4 2 3 10Z" fill="' + PAPER + '"' + SI + '/><path d="M-11 -2A11 10 0 0 1 11 -2Z" fill="' + hat(0) + '"' + SI + '/>' + dot(-4, -7, 1.8, '#fff') + dot(3, -6, 1.5, '#fff'),
      k => '<path d="' + P_([[-7, 10], [-8, -2], [8, -2], [7, 10]], k, 1) + '" fill="' + hat('b') + '"' + SI + '/><ellipse cy="-2" rx="8" ry="3.4" fill="#f0cf9a"' + SI + '/>' + ln('M-3 -2q3 -2 6 0', INK, 1)],
    cape: [rock, rock, k => ln('M-10 0Q-5 -7 0 0Q5 -7 10 0', INK, 2.2), k => ln('M-7 8Q-7 -3 -10 -8M0 8V-11M7 8Q7 -3 10 -8', DK[3], 2.6), k => ln('M-12 4Q-6 -4 0 4Q6 -4 12 4', INK, 2), k => ln('M-8 8Q-8 -2 -11 -6M-2 8V-9M5 8Q5 -2 8 -6', DK[3], 2.6)],
    reef: [shell, fish, k => ln('M0 12V-2M0 3L-7 -6M0 -2L7 -11M0 6L7 -1', INK, 5.4) + ln('M0 12V-2M0 3L-7 -6M0 -2L7 -11M0 6L7 -1', COL[0], 3), starfish, bubbles, fish],
    cave: [crystal, crystal, k => '<path d="M-9 9L-4 -13L0 9ZM-1 9L5 -19L10 9Z" fill="' + hat('v') + '"' + SI + '/>', k => '<circle cy="-3" r="12" fill="rgba(255,236,100,.35)"/><path d="M-2 7V-1H2V7" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.5"/><path d="M-9 -1A9 8 0 0 1 9 -1Z" fill="' + hat(1) + '"' + SI + '/>', gem],
    volcano: [rock, lava, k => dead(), lava, k => '<path d="' + star5(6, k) + '" fill="' + hat(2) + '" stroke="' + INK + '" stroke-width="1.3"/>' + ln('M9 -9l3 -4M-9 -8l-3 -4', COL[0], 2), rock],
  };
  const LMAP = {
    bg: '#e6d2ad', defs: LM_DEFS,
    backdrop(H, rnd) {
      let s = '<rect width="400" height="' + H + '" fill="url(#doodleKraft)"/>';
      for (let y = 80, i = 0; y < H - 40; y += 110 + rnd(i, 1) * 90, i++) {
        const left = i % 2 === 0, x = left ? 9 : 391, t = Math.floor(rnd(i, 2) * 4);
        s += '<g transform="translate(' + x + ' ' + f1(y) + ')">' + (t === 0 ? '<path d="' + star5(6, i) + '" fill="' + hat(2) + '" stroke="' + INK + '" stroke-width="1.3" opacity=".7"/>' : t === 1 ? ln('M-4 8q8 -6 0 -14M-1 -10l4 4-5 3', PEN, 1.6) : t === 2 ? ln('M-5 0q3 -6 5 0t5 0', PEN, 1.8) : '<circle r="5" fill="none" stroke="' + PEN + '" stroke-width="1.6" stroke-dasharray="3 3"/>') + '</g>';
      }
      return s;
    },
    zone(z) {
      const T = LT[z.theme] || LT.town, rnd = z.rnd, s = z.index * 31 + 7, cy = (z.y0 + z.y1) / 2, rot = f1((rnd(1, 2) - .5) * 1.6);
      const a = 25, b = z.y0 + 4, c = 375, d = z.y1 - 4, pd = wrect(a, b, c, d, s, 1.3);
      let o = '<g transform="rotate(' + rot + ' 200 ' + f1(cy) + ')"><path d="' + pd + '" transform="translate(5 6)" fill="rgba(70,45,15,.28)"/><path d="' + pd + '" fill="' + T[0] + '"/><path d="' + pd + '" fill="url(#doodle' + T[1] + ')"/>' +
        '<path d="' + pd + '" fill="none" stroke="' + INK + '" stroke-width="2"/><path d="' + wrect(a + 1, b + 1, c - 1, d - 1, s + 9, 1.8) + '" fill="none" stroke="' + INK + '" stroke-width="1" opacity=".35"/>';
      T[2].forEach((bp, i) => { o += '<g opacity="' + bp[1] + '">' + bl(f1(115 + rnd(i, 3) * 170), f1(z.y0 + 60 + rnd(i, 4) * (z.y1 - z.y0 - 120)), f1(42 + rnd(i, 5) * 36), f1(20 + rnd(i, 6) * 14), s + i, hat(bp[0])) + '</g>'; });
      o += tapeS(52, z.y0 + 4, -14) + tapeS(348, z.y0 + 4, 12) + tapeS(350, z.y1 - 6, -10) + '<text x="64" y="' + (z.y1 - 14) + '" font-family="' + LMF + '" font-size="15" fill="' + PEN + '">p. ' + (z.index + 1) + '</text></g>';
      if (z.theme === 'volcano') {
        const b0 = z.stops[0], vx = b0[0], vy = b0[1];
        o += '<path d="M' + (vx - 170) + ' ' + (vy + 148) + 'Q' + (vx - 74) + ' ' + (vy + 90) + ' ' + (vx - 54) + ' ' + (vy - 4) + 'Q' + vx + ' ' + (vy - 26) + ' ' + (vx + 54) + ' ' + (vy - 4) + 'Q' + (vx + 74) + ' ' + (vy + 90) + ' ' + (vx + 170) + ' ' + (vy + 148) + 'Z" fill="' + hat('b') + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<path d="M' + (vx - 34) + ' ' + (vy + 6) + 'Q' + (vx - 44) + ' ' + (vy + 60) + ' ' + (vx - 82) + ' ' + (vy + 108) + 'Q' + (vx - 62) + ' ' + (vy + 118) + ' ' + (vx - 48) + ' ' + (vy + 104) + 'Q' + (vx - 28) + ' ' + (vy + 50) + ' ' + (vx - 12) + ' ' + (vy + 8) + 'Z" fill="' + hat(0) + '"' + SI + '/>' +
          '<path d="M' + (vx + 30) + ' ' + (vy + 4) + 'Q' + (vx + 50) + ' ' + (vy + 40) + ' ' + (vx + 46) + ' ' + (vy + 84) + 'Q' + (vx + 58) + ' ' + (vy + 80) + ' ' + (vx + 64) + ' ' + (vy + 70) + 'Q' + (vx + 64) + ' ' + (vy + 30) + ' ' + (vx + 44) + ' ' + (vy + 2) + 'Z" fill="' + hat(0) + '"' + SI + '/>' +
          '<ellipse cx="' + vx + '" cy="' + (vy - 2) + '" rx="56" ry="24" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="2.4"/><ellipse cx="' + vx + '" cy="' + (vy - 1) + '" rx="40" ry="15" fill="' + hat(2) + '" stroke="' + INK + '" stroke-width="1.4"/>' +
          (() => { const t = z.stops[z.stops.length - 1], ty = t[1], tx = t[0]; return [[vx - 6, vy - 40, 11], [vx + 8, vy - 62, 9]].concat(ty < vy - 70 ? [[tx - 34, ty + 18, 13], [tx + 36, ty + 16, 14], [tx - 2, ty + 34, 15], [tx - 30, ty - 20, 12], [tx + 32, ty - 18, 12], [tx, ty - 34, 14]] : []).map((q, i) => '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="#fffcf3" stroke="' + INK + '" stroke-width="1.8" opacity=".92"/>').join(''); })() +
          [[-62, -22], [66, -14], [-76, 20]].map(q => '<path d="' + star5(5, q[0]) + '" transform="translate(' + (vx + q[0]) + ' ' + (vy + q[1]) + ')" fill="' + hat(2) + '" stroke="' + INK + '" stroke-width="1.2"/>').join('');
      }
      if (z.theme === 'cape') {
        const top = z.stops[z.stops.length - 1], lx = top[0] > 200 ? 70 : 330, ly = top[1] + 30, dr = lx < 200 ? 1 : -1;
        o += '<g transform="translate(' + lx + ' ' + ly + ')"><path d="M0 -58L' + dr * 112 + ' -84V-34Z" fill="' + hat(2) + '" opacity=".4"/>' + ln('M0 -58L' + dr * 112 + ' -84M0 -58L' + dr * 112 + ' -34', PEN, 1.6) +
          '<path d="' + P_([[-22, 2], [-14, -6], [14, -6], [22, 2]], z.index, 1.5) + '" fill="' + hat('g') + '"' + SI + '/><path d="M-13 -4L-8 -50H8L13 -4Z" fill="' + PAPER + '"' + SI + '/><path d="M-11.4 -14L-10 -26H10L11.4 -14ZM-9 -38L-8.6 -50H8.6L9 -38Z" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="1.4"/>' +
          '<path d="M-9 -50V-64H9V-50Z" fill="' + hat(2) + '"' + SI + '/><path d="M-12 -64L0 -75L12 -64Z" fill="' + hat(0) + '"' + SI + '/></g>' +
          '<text x="' + (lx > 200 ? 290 : 110) + '" y="' + (z.y1 - 44) + '" text-anchor="middle" font-family="' + LMF + '" font-size="58" fill="rgba(43,45,66,.28)">&#960;</text>';
      }
      return o;
    },
    keepOut(z) {   // boxes for the hatched volcano, the lighthouse and the pi sign
      const b = [];
      if (z.theme === 'volcano') {
        const v = z.stops[0], t = z.stops[z.stops.length - 1];
        b.push([v[0] - 176, v[1] - 70, v[0] + 176, v[1] + 152]);
        if (t[1] < v[1] - 70) b.push([t[0] - 60, t[1] - 58, t[0] + 60, t[1] + 40]);
      }
      if (z.theme === 'cape') {
        const top = z.stops[z.stops.length - 1], lx = top[0] > 200 ? 70 : 330, ly = top[1] + 30, dr = lx < 200 ? 1 : -1, px = lx > 200 ? 290 : 110;
        b.push([Math.min(lx, lx + dr * 112) - 6, ly - 84, Math.max(lx, lx + dr * 112) + 6, ly + 10]);
        b.push([px - 26, z.y1 - 88, px + 26, z.y1 - 34]);
      }
      return b;
    },
    decor(theme, r, r2, z) {
      const L = DEC[theme] || DEC.town, f = L[Math.floor(r * L.length) % L.length], k = Math.floor(r2 * 997) + 1;
      return '<g transform="rotate(' + f1((r2 - .5) * 10) + ')">' + f(k, r2) + '</g>';
    },
    sign(label, w, z) {
      const s = z.index * 5 + 2;
      return '<g transform="rotate(-1.6 ' + w / 2 + ' 16)"><path d="' + wr(3, 4, w + 3, 36, s) + '" fill="rgba(70,45,15,.3)"/><path d="' + wr(0, 0, w, 32, s) + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="' + wr(1.5, 1.5, w - 1.5, 30.5, s + 3) + '" fill="none" stroke="' + INK + '" stroke-width=".9" opacity=".35"/>' + tapeS(10, 1, -18) + tapeS(w - 10, 1, 16) +
        '<text x="' + w / 2 + '" y="23" text-anchor="middle" font-family="' + LMF + '" font-size="17" fill="' + INK + '">' + label + '</text>' + ln('M12 28q' + (w / 2 - 12) + ' 3 ' + (w - 24) + ' 0', DK[z.index % 4], 1.6) + '</g>';
    },
    road: { todo: ['#a9a395', '#f1e6cc', '#dccfae'], done: [INK, '#ffd84a', '#f0b400'] },
    node(st, num, e, boss) {
      const sd = [...String(num)].reduce((a, ch) => a * 7 + ch.charCodeAt(0), 3), d = poly(hexPts(0, 0, 30, sd, .05)), d2 = poly(hexPts(0, 0, 30, sd + 99, .06));
      const sh = '<path d="' + d + '" transform="translate(2.5 3.5)" fill="rgba(43,45,66,.3)"/>';
      if (st === 'locked') return sh + '<path d="' + d + '" fill="#ece5d2" stroke="#8d8a85" stroke-width="2.4" stroke-dasharray="6 4" stroke-linejoin="round"/>' +
        '<path d="M-6 -2V-8A6 6 0 0 1 6 -8V-2" fill="none" stroke="#6f6c78" stroke-width="2.6" stroke-linecap="round"/><rect x="-9" y="-3" width="18" height="14" rx="3" fill="#cfc8b4" stroke="#6f6c78" stroke-width="2.2"/><circle cy="4" r="2" fill="#6f6c78"/>';
      const n = String(num), fs = n.length > 3 ? 15 : n.length > 2 ? 18 : n.length > 1 ? 23 : 28;
      let o = '';
      if (st === 'current') o += '<path d="' + poly(hexPts(0, 0, 38, sd + 5, .04)) + '" fill="#fff176" opacity=".85"/><path d="' + poly(hexPts(0, 0, 38, sd + 6, .05)) + '" fill="none" stroke="#e0b800" stroke-width="2" stroke-dasharray="3 4" stroke-linejoin="round"/>';
      if (boss) o += [-14, 0, 14].map((x, i) => '<path d="M' + x + ' -28Q' + (x - 7) + ' -38 ' + x + ' -46Q' + (x + 2) + ' -40 ' + (x + 8) + ' -42Q' + (x + 8) + ' -33 ' + (x + 4) + ' -28Z" fill="' + hat(i === 1 ? 2 : 0) + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>').join('');
      o += sh + '<path d="' + d + '" fill="' + PAPER + '"/><path d="' + d + '" fill="' + hat(e) + '"/><path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (boss ? 3 : 2.6) + '" stroke-linejoin="round"/><path d="' + d2 + '" fill="none" stroke="' + INK + '" stroke-width="1.1" opacity=".4" stroke-linejoin="round"/>' +
        '<text x="0" y="' + f1(fs * .34) + '" text-anchor="middle" font-family="' + LMF + '" font-size="' + fs + '" fill="' + INK + '" stroke="' + PAPER + '" stroke-width="3.6" paint-order="stroke" stroke-linejoin="round">' + n + '</text>';
      if (st === 'beaten') o += '<circle cx="22" cy="-22" r="10" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2"/><path d="M16.5 -22L21 -17.5L28 -27" fill="none" stroke="#1f8f45" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>';
      return o;
    },
    start() {
      return '<ellipse cx="3" cy="27" rx="50" ry="8" fill="rgba(70,45,15,.28)"/><ellipse cy="24" rx="50" ry="8" fill="' + hat(3) + '"' + SI + '/>' +
        ln('M-44 24V-20', INK, 4.4) + ln('M-44 24V-20', '#cfc8b4', 1.6) + '<path d="M-43 -20Q-56 -28 -68 -20T-92 -20L-84 -10L-92 0Q-80 6 -68 0T-43 0Z" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<g transform="rotate(-2 0 21)"><path d="' + wr(-30, 10, 30, 32, 5) + '" fill="rgba(70,45,15,.3)" transform="translate(2.5 3)"/><path d="' + wr(-30, 10, 30, 32, 5) + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<text x="0" y="27" text-anchor="middle" font-family="' + LMF + '" font-size="17" fill="' + INK + '">START</text></g>' +
        '<circle r="6" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="2"/>';
    },
    pin() {
      return '<path d="M0 27C-6 17 -19 9 -19 -5A19 19 0 0 1 19 -5C19 9 6 17 0 27Z" fill="' + hat(0) + '" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<circle cy="-6" r="12" fill="#fff6c4" stroke="' + INK + '" stroke-width="2"/>' + dot(-4.2, -9, 1.7) + dot(4.2, -9, 1.7) + ln('M-5.5 -3q5.5 6 11 0', INK, 1.9);
    },
  };

  // ---- bonus gems: one felt-tip silhouette per element (flame, drop, cloud, leaf), hatched, inked, shadowed ----
  const GEM = [
    'M0 -1C.42 -.58 .86 -.2 .8 .32C.74 .76 .4 1 0 1C-.4 1 -.76 .76 -.8 .3C-.84 -.08 -.62 -.34 -.46 -.52C-.44 -.22 -.32 -.04 -.16 .02C-.28 -.42 -.18 -.76 0 -1Z',
    'M0 -1.02C.34 -.56 .78 -.14 .78 .3C.78 .74 .42 1.04 0 1.04C-.42 1.04 -.78 .74 -.78 .3C-.78 -.14 -.34 -.56 0 -1.02Z',
    'M-.62 .62C-1.02 .62 -1.08 .02 -.7 -.06C-.74 -.56 -.18 -.74 .02 -.4C.18 -.86 .86 -.76 .8 -.2C1.12 -.16 1.1 .62 .7 .62Z',
    'M-.78 .84C-.92 -.16 -.22 -.86 .86 -.86C.92 .16 .22 .9 -.78 .84Z',
  ];
  const sc = (d, k) => d.replace(/-?\d*\.?\d+/g, v => f1(+v * k));
  function gemTile(x, y, r, e, k) {
    const R = r * 0.92, id = 'doodle-gt' + e + '-' + k, d = sc(GEM[e], R), sw = f1(Math.max(2.4, R * .1));
    const hl = [ 'M' + f1(-R * .5) + ' ' + f1(R * .22) + 'Q' + f1(-R * .52) + ' ' + f1(-R * .2) + ' ' + f1(-R * .22) + ' ' + f1(-R * .5),
      'M' + f1(-R * .5) + ' ' + f1(R * .2) + 'Q' + f1(-R * .5) + ' ' + f1(-R * .2) + ' ' + f1(-R * .18) + ' ' + f1(-R * .52),
      'M' + f1(-R * .62) + ' ' + f1(R * .2) + 'Q' + f1(-R * .6) + ' ' + f1(-R * .12) + ' ' + f1(-R * .3) + ' ' + f1(-R * .14),
      'M' + f1(-R * .5) + ' ' + f1(R * .3) + 'Q' + f1(-R * .4) + ' ' + f1(-R * .38) + ' ' + f1(R * .2) + ' ' + f1(-R * .6) ][e];
    const vein = e === 3 ? '<path d="M' + f1(-R * .6) + ' ' + f1(R * .66) + 'Q' + f1(R * .05) + ' ' + f1(R * .05) + ' ' + f1(R * .62) + ' ' + f1(-R * .62) + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(sw * .7) + '" stroke-linecap="round"/>' : '';
    return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
      '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>' +
      '<path class="hl" d="' + sc(GEM[e], R * 1.22) + '" fill="#fff59d" stroke="#ffb300" stroke-width="2"/>' +
      '<path d="' + d + '" transform="translate(' + f1(R * .1) + ' ' + f1(R * .14) + ')" fill="' + INK + '" opacity=".45"/>' +
      '<path d="' + d + '" fill="' + COL[e] + '"/>' +
      '<g clip-path="url(#' + id + ')">' + hatch(e, R, Math.max(3, R / 4.2), Math.max(1.2, R / 12), .55) +
      '<path d="' + d + '" transform="translate(' + f1(R * .14) + ' ' + f1(R * .18) + ')" fill="none" stroke="' + DK[e] + '" stroke-width="' + f1(R * .22) + '" opacity=".55"/></g>' +
      '<path class="hx" d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' + vein +
      '<path d="' + hl + '" fill="none" stroke="#fff" stroke-width="' + f1(Math.max(2, R * .12)) + '" stroke-linecap="round" opacity=".85"/>' +
      '</g></g>';
  }

  FTH_SKINS.register({
    id: 'doodle', name: 'Line Doodle', ic: '🖍️', blurb: 'colour a felt-tip map',
    coin: { name: 'pencil stub', plural: 'pencil stubs', glyph: '✏️', value: 2, pitch: 0.8,   // this skin's currency (SKIN-SPEC.md section 12)
      colors: { main: '#ffc928', edge: '#e0452f' },
      svg: FTH_SKINS.coinArt('<g transform="rotate(-45)" stroke-linejoin="round">' +
        '<path d="M-11.5 -4.4H5.6L12.6 1.2L5.6 6.8H-11.5Q-13.6 6.8 -13.6 4.6V-2.2Q-13.6 -4.4 -11.5 -4.4Z" fill="#1c1640" opacity=".45" transform="translate(.6 1.6)"/>' +
        '<g stroke="#1c1640" stroke-width="1.6"><rect x="-13" y="-5" width="5" height="10" rx="2" fill="#f28ab0"/><rect x="-8.4" y="-5" width="3.4" height="10" fill="#c3c8d0"/>' +
        '<rect x="-5" y="-5" width="10.6" height="10" fill="#ffc928"/><path d="M5.6 -5L12.8 0L5.6 5Z" fill="#f1d3a1"/></g>' +
        '<path d="M10 -1.9L12.8 0L10 1.9Z" fill="#2d2a26"/><path d="M-5 1.7H5.6" stroke="#e0a000" stroke-width="2" fill="none"/>' +
        '<path d="M-4 -2.6H4.4M-12 -2.8V1" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".85"/><path d="M-7.6 -5V5" stroke="#8b919c" stroke-width=".9"/></g>') },
    src: 'lab/doodle.html', waits: true, needs: ['cells'],
    hud: 'full',
    icon: iconSvg, card: cardSvg, logo: logoSvg,
    theme: {
      '--sk-bg': 'radial-gradient(rgba(140,100,50,.2) 1.2px, transparent 1.7px) 0 0 / 15px 15px, #e6d2ad',
      '--sk-ink': '#2b2d42',
      '--sk-accent': '#e0452f',
      '--sk-card': 'repeating-linear-gradient(180deg, transparent 0 25px, rgba(80,140,200,.22) 25px 26px), #fffcf3',
      '--sk-card-ink': '#2b2d42',
      '--sk-hud': 'linear-gradient(180deg, #f3e5c1, #e8d4a6)',
      '--sk-btn': 'linear-gradient(180deg, #ffd84a, #ffc928)',
      '--sk-btn-ink': '#2b2d42',
      '--sk-btn-shadow': '#b78a00',
      '--sk-font': "'Patrick Hand', 'Fredoka', 'Comic Sans MS', 'Chalkboard SE', cursive",
      '--sk-radius': '14px',
      '--sk-star-on': '#ffc928', '--sk-star-edge': '#2b2d42', '--sk-star-off': '#948971', '--sk-star-off-edge': '#4d4a60',
      '--sk-ctl': '#fffcf3', '--sk-ctl-ink': '#2b2d42', '--sk-ctl-edge': '#2b2d42',
      '--sk-chip': '#fffcf3',
      '--sk-chip-ink': '#2b2d42',
      '--sk-edge': '#2b2d42',
      '--sk-coin': '#ffc928',
    },
    css: '--sk-btn2:#fffcf3;--sk-btn2-ink:#2b2d42;' + // secondary buttons (set here: validator rejects digits in theme keys)
      '.tl .hl{opacity:0;transition:opacity .15s}.tl.lit .hl{opacity:.95}.tl.lit .hx{stroke-width:3.4}' +
      '.tl.glow .tin{filter:drop-shadow(0 0 5px #fff59d) drop-shadow(0 0 2px #2b2d42)}' +
      // buttons: paper stickers with a wobbly ink border and a hard offset shadow
      '.btn3d{border:2.5px solid #2b2d42;border-radius:15px 19px 14px 18px/18px 14px 19px 15px;box-shadow:3px 4px 0 #2b2d42;font-family:var(--sk-font);font-weight:700;letter-spacing:.02em;color:#2b2d42;text-shadow:none;transition:transform .12s,box-shadow .12s}' +
      '.btn3d.white{background:#fffcf3}.btn3d.yellow{background:#ffc928}.btn3d.blue{background:#3fa7f5}.btn3d.orange{background:#ff9a3c}' +
      '.btn3d.go{background:#3ccf6e;color:#2b2d42}' +
      '.btn3d > svg > g path,.btn3d > svg > g{stroke:#2b2d42}' +
      '.btn3d.rb svg g path:first-child{stroke:none}' +
      '.btn3d.rbtn,.btn3d.rb{border-radius:14px 17px 13px 16px/16px 13px 17px 14px}' +
      '.btn3d:active{transform:translate(2px,3px) rotate(1.5deg);box-shadow:1px 1px 0 #2b2d42}' +
      '@media (hover:hover){.btn3d:hover{transform:rotate(-1.2deg)}.btn3d:active{transform:translate(2px,3px) rotate(1.5deg)}}' +
      '.bar .rb{border:2.5px solid #2b2d42;box-shadow:3px 4px 0 #2b2d42}' +
      '.bar .rb:active{transform:translate(2px,3px);box-shadow:1px 1px 0 #2b2d42}' +
      '.bar .rb:disabled{filter:saturate(.3) brightness(1.05);opacity:.6}' +
      '.htnum{border:2.5px solid #2b2d42;box-shadow:2px 2px 0 #2b2d42;font-family:var(--sk-font)}' +
      '.htskip{border:2px solid #2b2d42;border-radius:12px 15px 11px 14px;font-family:var(--sk-font)}' +
      // kraft strips for the HUD, the level-map bar and the play bar; stitched lower edge
      '.gtop{background:var(--sk-hud);border-bottom:2.5px solid #2b2d42;box-shadow:none}' +
      '.mbar{background:var(--sk-hud);border-bottom:2.5px solid #2b2d42;box-shadow:0 3px 0 rgba(43,45,66,.18)}' +
      '.bar{background:var(--sk-hud);border-top:2.5px solid #2b2d42;box-shadow:none}' +
      // chips and bars: taped labels with a hard shadow
      '.badge,.goalbar,.starbar{border:2.5px solid #2b2d42;border-radius:14px 17px 13px 16px/16px 13px 17px 14px;box-shadow:2px 3px 0 #2b2d42;font-family:var(--sk-font)}' +
      '.goalbar,.starbar{background:#fffcf3}' +
      '.starbar .st path{stroke-width:2.2}' +
      '.coins{border:2.5px solid #2b2d42;border-radius:14px 18px 13px 16px/16px 13px 18px 14px;box-shadow:2px 3px 0 #2b2d42;font-family:var(--sk-font);font-size:1.1rem;padding:2px 12px 2px 4px}' +
      '.mnode .mst,.mnode .mtag{border:2px solid #2b2d42;border-radius:9px 11px 8px 10px;box-shadow:1.5px 2px 0 #2b2d42;font-family:var(--sk-font);font-size:.95rem;font-weight:700}' +
      '.mnode .mtag{background:#d9d2bd;color:#2b2d42}' +
      '.mnode .pulse{border:3px dashed #2b2d42;border-radius:44% 56% 52% 48%/50% 44% 56% 50%}' +
      // talking pin: a note on lined paper
      '.say .msg{border:2.5px solid #2b2d42;border-radius:14px 17px 13px 16px;box-shadow:3px 3px 0 #2b2d42;font-family:var(--sk-font);font-size:1.02rem;font-weight:700}' +
      '.say .msg::before{border-right-color:#2b2d42}.say .msg::after{border-right-color:#fffcf3}' +
      // cards: a sketchbook page with a stitched inner edge
      '#brief .card,#win .card,#installSheet .card{border:2.5px solid #2b2d42;border-radius:16px 20px 15px 19px/19px 15px 20px 16px !important;box-shadow:5px 6px 0 #2b2d42;outline:1.5px dashed rgba(43,45,66,.35);outline-offset:-8px;font-family:var(--sk-font)}' +
      '#installSheet .card h2{font-family:var(--sk-font)}' +
      '#brief .card p,#brief .card table,#brief .card td,#brief details,#brief details summary,#brief .card .k,#win .card p{color:var(--sk-card-ink)}' +
      // language picker and how-to dots
      '.skins button{border:2.5px solid #2b2d42;border-radius:12px 15px 11px 14px/14px 11px 15px 12px;box-shadow:2px 2px 0 #2b2d42;font-family:var(--sk-font)}' +
      '.skins button[aria-checked="true"]{background:#ffc928;color:#2b2d42;border-color:#2b2d42;box-shadow:3px 3px 0 #2b2d42}' +
      '.htdots button{border:1.5px solid #2b2d42}' +
      '.htdots button.on{background:#ffc928}',
    fonts: ['https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Fredoka:wght@500;700&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'Colour the blank', text: 'One piece is blank, and all four pens touch it.', svg: p1 },
      { title: 'Pen, then piece', text: 'Pick a marker, then tap a piece to recolour it.', svg: p2 },
      { title: 'Groups swap together', text: 'Its whole two-pen group swaps in one wave.', svg: p3 },
      { title: 'Locked groups', text: 'A group touching the rim twice is locked: it smudges.', svg: p4 },
      { title: 'Fill it in!', text: 'Three pens left on the rim? Colour the blank with the fourth.', svg: p5 },
    ],
    bonus: {
      label: 'DOODLE',
      games: ['chain', 'snake'],          // drawing a line through the pieces
      intro: 'curtain',                   // the board arrives like a page turning
      board: 'radial-gradient(rgba(140,100,50,.2) 1.2px, transparent 1.7px) 0 0 / 15px 15px, #efdcb4',
      line: '#2b2d42',
      tile: gemTile,
    },
    map: {
      sea: ['#dfe6ee', '#cbd7e5', '#b6c6da', '#a1b5cf', '#8ca4c3', '#7792b6', '#6180a8', '#4b6e9a', '#365c8a'],
      seaX: '#f0e0b8',
      unknown: '#d2bd8c',
      ramp: ['#3ccf6e', '#ffc928', '#ff9a3c', '#ff5d5d'],
      grey: '#9b958a',
      route: '#2b2d42',
      ink: 'rgba(43,45,66,.85)',
      cell(path, x, y, r) {
        const s = Math.round(x * 7) + Math.round(y * 13) * 1009;
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i, j = (hash(s * 7 + i * 31) - 0.5) * 0.2 * r, k = (hash(s * 13 + i * 17 + 5) - 0.5) * 0.2 * r;
          const px = x + Math.cos(a) * (r + j) - Math.sin(a) * k, py = y + Math.sin(a) * (r + j) + Math.cos(a) * k;
          if (i) path.lineTo(px, py); else path.moveTo(px, py);
        }
        path.closePath();
      },
    },
    levelMap: LMAP,
    words: { win: 'Coloured in!', perfect: 'Perfect route!', par: 'Par is {par}. ★★★?', chart: 'COLOURING MAP' },
    eggs: [
      { id: 'doodle-smiley', on: 'page', note: 'leave the sheet alone a while: a smiley gets sketched in the margin; tap it', pays: true },
      { id: 'cap-click', on: 'page', note: 'tap the same marker five times quickly: it squeaks and spins', pays: false },
    ],
  });
})();
