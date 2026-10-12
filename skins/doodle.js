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

  FTH_SKINS.register({
    id: 'doodle', name: 'Line Doodle', ic: '🖍️', blurb: 'a sketchbook of felt-tip pens',
    coin: { name: 'pencil stub', plural: 'pencil stubs', glyph: '✏️', value: 2, pitch: 0.8,   // this skin's currency (SKIN-SPEC.md section 12)
      colors: { main: '#ffc928', edge: '#e0452f' },
      svg: FTH_SKINS.coinArt('<g transform="rotate(-45)" stroke="#1c1640" stroke-width="1.5" stroke-linejoin="round"><rect x="-12" y="-4.6" width="4" height="9.2" rx="1.6" fill="#f28ab0"/><rect x="-8" y="-4.6" width="3" height="9.2" fill="#b9bec6"/><rect x="-5" y="-4.6" width="10.5" height="9.2" fill="#ffc928"/><path d="M5.5 -4.6L12.5 0L5.5 4.6Z" fill="#f1d3a1"/><path d="M9.6 -1.7L12.5 0L9.6 1.7Z" fill="#2d2a26" stroke="none"/><path d="M-5 0H5.5" stroke="#e0a000" stroke-width="1.2" fill="none"/></g>') },
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
      '.btn3d svg path,.btn3d svg g{stroke:#2b2d42}' +
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
    levelMap: LMAP,
    words: { win: 'Coloured in!', perfect: 'Perfect route! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'COLOURING MAP' },
  });
})();
