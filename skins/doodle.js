// Line Doodle: a kid's sketchbook. Kraft desk, taped lined paper, felt-tip pens with hatching, wobbly ink outlines.
// Colours and hatch angles match lab/doodle.html's PENS (0 fire, 1 water, 2 air, 3 earth).
(function () {
  const INK = '#2b2d42', PAPER = '#fffcf3';
  const COL = ['#ff5d5d', '#3fa7f5', '#ffc928', '#3ccf6e'], DK = ['#c93636', '#1f74b8', '#c9900a', '#1f8f45'];
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
  function hatch(e, r, gap, sw) {
    const a = ANG[e] * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx; let d = '';
    for (let t = -r * 1.2; t <= r * 1.2; t += gap) {
      const px = nx * t, py = ny * t; d += 'M' + f1(px - dx * r * 1.5) + ' ' + f1(py - dy * r * 1.5) + 'L' + f1(px + dx * r * 1.5) + ' ' + f1(py + dy * r * 1.5);
    }
    return '<path d="' + d + '" stroke="' + DK[e] + '" stroke-width="' + sw + '" stroke-linecap="round" fill="none" opacity=".8"/>';
  }
  // one hatched, inked hexagon (SVG fragment) at (cx, cy); id must be unique within the document
  function piece(id, cx, cy, r, e, seed, extra) {
    const P = hexPts(cx, cy, r, seed, 0.06), P2 = hexPts(cx, cy, r, seed + 99, 0.07), d = poly(P);
    return '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>' +
      '<path d="' + d + '" fill="' + COL[e] + '" opacity=".78"/>' +
      '<g clip-path="url(#' + id + ')"><g transform="translate(' + f1(cx) + ' ' + f1(cy) + ')">' + hatch(e, r, Math.max(3, r / 4.2), Math.max(1, r / 14)) + '</g></g>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.6, r / 9)) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + poly(P2) + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(Math.max(.8, r / 20)) + '" opacity=".4" stroke-linejoin="round"/>' + (extra || '');
  }
  const blank = (cx, cy, r, seed, dash) => {
    const d = poly(hexPts(cx, cy, r, seed, 0.06));
    return '<path d="' + d + '" fill="#fff" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="6 5"' : '') + '/>';
  };
  const qmark = (x, y, s) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Patrick Hand,Comic Sans MS,cursive" font-size="' + s + '" fill="rgba(80,82,96,.75)">?</text>';
  const say = (x, y, s, t, rot, col) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Patrick Hand,Comic Sans MS,cursive" font-size="' + s + '" fill="' + (col || INK) + '"' + (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '>' + t + '</text>';
  const tape = (x, y, rot) => '<rect x="' + (x - 24) + '" y="' + (y - 7) + '" width="48" height="14" fill="rgba(255,236,160,.8)" stroke="rgba(180,150,60,.4)" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>';
  // a taped lined paper card background for a 300x250 svg
  const sheet = (rot) => '<g transform="rotate(' + (rot || 0) + ' 150 125)"><rect x="14" y="14" width="272" height="222" rx="4" fill="' + PAPER + '" stroke="rgba(80,50,20,.35)" stroke-width="1.5"/>' +
    '<path d="' + Array.from({ length: 8 }, (_, i) => 'M20 ' + (48 + i * 25) + 'H280').join('') + '" stroke="rgba(80,140,200,.2)" stroke-width="1"/>' + tape(150, 14, -3) + '</g>';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const RM = (css) => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  // marker pen standing at (x, y) pointing down-ish; sel lifts it
  const pen = (x, y, e, s) => '<g transform="translate(' + x + ' ' + y + ') rotate(-8) scale(' + (s || 1) + ')">' +
    '<path d="M-6 -34 L6 -34 L6 6 L0 14 L-6 6 Z" fill="' + COL[e] + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<rect x="-6" y="-44" width="12" height="11" rx="3" fill="' + DK[e] + '" stroke="' + INK + '" stroke-width="2"/>' +
    '<path d="M-2 -30V2M2 -30V2" stroke="#fff" stroke-width="1.2" opacity=".6"/></g>';
  // pentagon of five rim pieces round (150, cy)
  const rimPos = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const finger = (x, y, rot) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')"><path d="M0 0 C-3 -8 -3 -18 2 -22 C6 -20 6 -12 5 -6 L14 -4 C20 -2 18 8 12 12 L2 16 C-4 14 -4 6 0 0Z" fill="#ffe0bd" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/></g>';

  // ---- title art: a rim of four felt-tip pieces round a blank, dashed hole ----
  const T = rimPos(150, 122, 62), tcol = [0, 1, 2, 3, 1];
  const titleSvg = svg(
    '<g id="tt">' + sheet(-1.5) +
    T.map((p, i) => piece('tt' + i, p[0], p[1], 31, tcol[i], 20 + i)).join('') +
    blank(150, 122, 32, 3, true) + '<g class="q">' + qmark(150, 136, 40) + '</g>' +
    say(150, 218, 22, 'colour the blank piece', -1.5, 'rgba(60,62,80,.8)') + '</g>',
    RM('.q{transform-box:fill-box;transform-origin:50% 60%;animation:hop 2.4s ease-in-out infinite}@keyframes hop{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(-7px) rotate(-6deg)}90%{transform:translateY(0)}}'));

  // ---- intro pages ----
  const rp = rimPos(150, 118, 58);
  // page 1: the goal
  const p1 = svg(sheet(1) +
    rp.map((p, i) => piece('a' + i, p[0], p[1], 28, [0, 1, 2, 3, 0][i], 40 + i)).join('') +
    blank(150, 118, 29, 5, true) + '<g class="q">' + qmark(150, 130, 36) + '</g>' +
    '<path d="M222 70 Q238 80 224 96" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/><path d="M219 91 L224 97 L231 93" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>' +
    say(252, 62, 17, 'blank!', 8) +
    say(150, 204, 19, 'all four pens touch it', 0) + say(150, 226, 19, 'so no pen fits... yet', 0, DK[0]),
    RM('.q{transform-box:fill-box;transform-origin:50% 60%;animation:hop 2.4s ease-in-out infinite}@keyframes hop{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(-6px)}90%{transform:translateY(0)}}'));
  // page 2: pens and pieces
  const p2 = svg(sheet(-1) +
    [[70, 70, 0], [118, 62, 1], [166, 70, 2], [214, 62, 3], [92, 112, 1], [142, 104, 0], [190, 112, 3]].map((q, i) => piece('b' + i, q[0], q[1], 22, q[2], 60 + i)).join('') +
    [0, 1, 2, 3].map(e => pen(66 + e * 56, 190, e, 1.05)).join('') +
    [0, 1, 2, 3].map(e => say(66 + e * 56, 228, 15, NAMES[e], 0)).join('') +
    say(240, 112, 16, 'pieces', 6) + '<path d="M215 118 L206 122" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"/>' +
    say(150, 150, 15, 'one pen = one element (hatching helps)', 0, 'rgba(60,62,80,.8)'));
  // page 3: a tap swaps the group
  const row = (x0, y, cols, id, glow) => cols.map((e, i) => piece(id + i, x0 + i * 40, y, 17, e, 80 + i * 3 + (glow ? 1 : 0))).join('');
  const p3 = svg(sheet(.8) +
    row(54, 82, [0, 1, 0, 1], 'c') + piece('c9', 214, 82, 17, 3, 95) +
    '<path d="M34 108 Q94 126 154 108" fill="none" stroke="' + INK + '" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>' +
    say(94, 130, 14, 'this group: red + blue', 0) +
    pen(44, 168, 1, .9) + say(44, 198, 14, 'blue pen', 0) + '<g class="f">' + finger(112, 94, -10) + '</g>' +
    '<path d="M150 150 L150 172 M141 164 L150 174 L159 164" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    row(54, 218, [1, 0, 1, 0], 'd') + piece('d9', 214, 218, 17, 3, 95) +
    say(250, 150, 14, 'whole group', 0) + say(250, 166, 14, 'swaps pens!', 0),
    RM('.f{animation:tap 2s ease-in-out infinite}@keyframes tap{0%,60%,100%{transform:translateY(0)}75%{transform:translateY(5px)}}'));
  // page 4: a lock
  const lp = rimPos(150, 112, 56);
  const p4 = svg(sheet(-1) +
    lp.map((p, i) => piece('e' + i, p[0], p[1], 25, [0, 1, 2, 0, 1][i], 110 + i)).join('') + blank(150, 112, 26, 7, true) +
    '<path d="M150 56 C100 36 36 70 52 120 C60 150 100 170 150 176 C210 170 252 150 250 112 C246 80 200 44 150 56" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-dasharray="1 6" stroke-linecap="round"/>' +
    '<g class="lk"><g transform="translate(150 186)"><path d="M-10 -4 V-12 A10 10 0 0 1 10 -12 V-4" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/><rect x="-14" y="-4" width="28" height="22" rx="4" fill="#ffc928" stroke="' + INK + '" stroke-width="2.4"/><circle cx="0" cy="6" r="3" fill="' + INK + '"/></g></g>' +
    say(150, 226, 16, 'group touches the rim twice = locked', 0, DK[0]) +
    say(250, 70, 14, 'a tap just', 6) + say(252, 86, 14, 'smudges', 6),
    RM('.lk{transform-box:fill-box;transform-origin:50% 100%;animation:shk 2.6s ease-in-out infinite}@keyframes shk{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-8deg)}90%{transform:rotate(8deg)}95%{transform:rotate(-4deg)}}'));
  // page 5: the win
  const wp = rimPos(150, 112, 56);
  const p5 = svg(sheet(1) +
    wp.map((p, i) => piece('g' + i, p[0], p[1], 25, [0, 1, 2, 1, 0][i], 130 + i)).join('') +
    piece('g9', 150, 112, 26, 3, 7) +
    '<g transform="translate(228 188) rotate(-10)"><rect x="-52" y="-18" width="104" height="34" rx="12" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2.6"/><text x="0" y="6" text-anchor="middle" font-family="Patrick Hand,Comic Sans MS,cursive" font-size="21" fill="' + INK + '">Coloured!</text></g>' +
    say(90, 212, 16, 'only 3 pens on the rim?', 0) + say(90, 232, 16, 'colour the blank piece!', 0, DK[3]));

  FTH_SKINS.register({
    id: 'doodle', name: 'Line Doodle', ic: '🖍️', blurb: 'a sketchbook of felt-tip pens',
    src: 'lab/doodle.html', waits: true, needs: ['cells'],
    hud: 'full',
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
    },
    css: '.tl .hl{opacity:0;transition:opacity .15s}.tl.lit .hl{opacity:.95}.tl.lit .hx{stroke-width:3.4}' +
      '.tl.glow .tin{filter:drop-shadow(0 0 5px #fff59d) drop-shadow(0 0 2px #2b2d42)}',
    fonts: ['https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Fredoka:wght@500;700&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'Colour the blank piece', text: 'One piece of the map is left blank. Its five neighbours wear all four pens, so no pen fits.', svg: p1 },
      { title: 'Pens and pieces', text: 'Four felt-tip pens: red fire, blue water, yellow air, green earth. Each has its own hatching.', svg: p2 },
      { title: 'Tap to swap a group', text: 'Pick a pen, then tap a piece. That piece and every touching piece of its two pens swap pens together.', svg: p3 },
      { title: 'Locked groups', text: 'If a group reaches the blank piece\'s neighbours twice, it is locked: the ink only smudges.', svg: p4 },
      { title: 'Fill it in!', text: 'When the neighbours use only three pens, the fourth is free. Tap the blank piece with it.', svg: p5 },
    ],
    bonus: {
      label: 'DOODLE BONUS',
      board: 'radial-gradient(rgba(140,100,50,.2) 1.2px, transparent 1.7px) 0 0 / 15px 15px, #efdcb4',
      line: '#2b2d42',
      tile(x, y, r, e, k) {
        const id = 'dt' + k, R = r * 0.94, d = poly(hexPts(0, 0, R, k * 5 + e, 0.07)), d2 = poly(hexPts(0, 0, R, k * 5 + e + 50, 0.08));
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>' +
          '<path class="hl" d="' + poly(hexPts(0, 0, R * 1.14, k, 0.05)) + '" fill="#fff59d"/>' +
          '<path d="' + d + '" fill="' + COL[e] + '" opacity=".8"/>' +
          '<g clip-path="url(#' + id + ')">' + hatch(e, R, Math.max(3, R / 4), Math.max(1, R / 13)) + '</g>' +
          '<path class="hx" d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<path d="' + d2 + '" fill="none" stroke="' + INK + '" stroke-width="1" opacity=".4" stroke-linejoin="round"/>' +
          '</g></g>';
      },
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
    words: { win: 'Coloured in!', perfect: 'Perfect route! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'COLOURING MAP' },
  });
})();
