// Signs: every level drawn as Flip's picture (lab/flip.html): the map cut along one loop through every region into two
// triangulated polygons, each triangle sun (+) or sea (-) by the orientation of its three elements. A Kempe swap flips
// exactly the triangles its chain touches. Play page lab/signs.html, maths lab/signs-model.js, note lab/SIGNS-DESIGN.md.
// Art the Islands way: offset shadow, flat fills with a lit inset, a dark outline, one light from the top left.
(function () {
  const COL = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'], DK = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'], NEON = ['#ff7a52', '#5ab4ff', '#ffe066', '#5cff8a'];
  const INK = '#15112e', SUN = '#ffc23d', SUN_D = '#c97a00', SUN_L = '#ffe08a', SUN_I = '#6e3d00', SEA = '#3f95ff', SEA_D = '#1d4fa8', SEA_L = '#9ccaff', SEA_I = '#0b2a66';
  const NIGHT = '#1a1545', OPEN = '#2c2660', PEARL = '#fff6e6', PINK = '#ff5fa2';
  const FONT = "'Fredoka',system-ui,sans-serif";
  const ICON = [   // lab/core.js LAB.ICON (24 x 24): fire, water, air, earth
    'M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2.4 1.1-4.1 2.3-5.2.1 1.6.8 2.7 1.9 3.3C10.3 8 11 5 12 2z',
    'M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z',
    'M3 8.5h11a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8M3 16.5h8',
    'M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M6 18c3-4 6-7 9-9',
  ];
  const f1 = n => Math.round(n * 10) / 10, P = (x, y) => f1(x) + ' ' + f1(y);
  const icon24 = (e, s, ink) => '<path d="' + ICON[e] + '" transform="scale(' + f1(s * 100) / 100 + ') translate(-12 -12)" ' + (e < 2 ? 'fill="' + ink + '"' : 'fill="none" stroke="' + ink + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"') + '/>';
  // + and - as shapes (no text), centred on x, y, s = half width
  const plus = (x, y, s, c) => { const t = s * .36; return '<path d="M' + P(x - t, y - s) + 'h' + f1(2 * t) + 'v' + f1(s - t) + 'h' + f1(s - t) + 'v' + f1(2 * t) + 'h' + f1(t - s) + 'v' + f1(s - t) + 'h' + f1(-2 * t) + 'v' + f1(t - s) + 'h' + f1(t - s) + 'v' + f1(-2 * t) + 'h' + f1(s - t) + 'Z" fill="' + c + '"/>'; };
  const minus = (x, y, s, c) => '<rect x="' + f1(x - s) + '" y="' + f1(y - s * .36) + '" width="' + f1(2 * s) + '" height="' + f1(s * .72) + '" rx="' + f1(s * .2) + '" fill="' + c + '"/>';
  const glyph = (sg, x, y, s) => sg > 0 ? plus(x, y, s, SUN_I) : minus(x, y, s, SEA_I);
  const triD = q => 'M' + q.map(p => P(p[0], p[1])).join('L') + 'Z';
  // one signed triangle: shadow, base, lit inset towards the centroid, outline, glyph
  function tri(q, sg, o) {
    o = o || {};
    const cx = (q[0][0] + q[1][0] + q[2][0]) / 3, cy = (q[0][1] + q[1][1] + q[2][1]) / 3, k = .8, ins = q.map(p => [cx + (p[0] - cx) * k - 1, cy + (p[1] - cy) * k - 1]);
    const base = sg > 0 ? SUN : sg < 0 ? SEA : OPEN, hi = sg > 0 ? SUN_L : sg < 0 ? SEA_L : '#3a3378', sw = o.sw || 2.4;
    return (o.cls ? '<g class="' + o.cls + '">' : '<g>') + '<path d="' + triD(q) + '" fill="' + (o.lit ? '#fff' : base) + '" stroke="' + (o.lit ? '#fff' : INK) + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      (o.flat ? '' : '<path d="' + triD(ins) + '" fill="' + hi + '" opacity="' + (o.lit ? .9 : .45) + '"/>') +
      (sg && o.gs ? glyph(sg, cx, cy, o.gs) : '') + '</g>';
  }
  const pearl = (x, y, r) => '<circle cx="' + f1(x + r * .15) + '" cy="' + f1(y + r * .22) + '" r="' + f1(r) + '" fill="' + INK + '" opacity=".4"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + PEARL + '" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.4, r * .22)) + '"/>' +
    '<ellipse cx="' + f1(x - r * .32) + '" cy="' + f1(y - r * .36) + '" rx="' + f1(r * .3) + '" ry="' + f1(r * .17) + '" fill="#fff" transform="rotate(-30 ' + P(x - r * .32, y - r * .36) + ')"/>';
  const gem = (e, x, y, r, glow) => (glow ? '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 1.55) + '" fill="' + NEON[e] + '" opacity=".35"/>' : '') +
    '<circle cx="' + f1(x + r * .15) + '" cy="' + f1(y + r * .22) + '" r="' + f1(r) + '" fill="' + INK + '" opacity=".45"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + DK[e] + '" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.4, r * .2)) + '"/>' +
    '<circle cx="' + f1(x - r * .06) + '" cy="' + f1(y - r * .08) + '" r="' + f1(r * .8) + '" fill="' + COL[e] + '"/><g transform="translate(' + P(x, y) + ')">' + icon24(e, r * .9 / 12, '#fff') + '</g>' +
    '<ellipse cx="' + f1(x - r * .34) + '" cy="' + f1(y - r * .4) + '" rx="' + f1(r * .26) + '" ry="' + f1(r * .13) + '" fill="#fff" opacity=".6" transform="rotate(-30 ' + P(x - r * .34, y - r * .4) + ')"/>';
  const well = (x, y, r, e) => '<circle cx="' + f1(x + 2) + '" cy="' + f1(y + 3) + '" r="' + f1(r) + '" fill="#000" opacity=".45"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + (e >= 0 ? COL[e] : '#090720') + '" stroke="' + INK + '" stroke-width="3"/>' +
    (e >= 0 ? '<g transform="translate(' + P(x, y) + ')">' + icon24(e, r * 1.1 / 12, '#fff') + '</g>'
      : '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r - 4) + '" fill="none" stroke="#c9c3ff" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 4"/><text x="' + f1(x) + '" y="' + f1(y + r * .36) + '" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="' + f1(r * 1.05) + '" fill="#c9c3ff">?</text>');
  const starD = (cx, cy, s) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? s * .42 : s; d += (i ? 'L' : 'M') + P(cx + q * Math.cos(a), cy + q * Math.sin(a)); } return d + 'Z'; };
  const spark = (x, y, s, c) => '<path d="' + starD(x, y, s) + '" fill="' + (c || '#fff3b0') + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>';
  const finger = '<g><circle r="13" fill="#fff" opacity=".25" class="tap"/><g transform="rotate(-22)"><rect x="-12" y="18" width="28" height="30" rx="11" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="-6.5" y="-2" width="13" height="34" rx="6.5" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M-3 4h6" stroke="#cfc8dc" stroke-width="2" stroke-linecap="round"/></g></g>';
  // Eliahou's sign (lab/flip-model.js triSign), corners counterclockwise
  const triSign = (c, a, b, d) => { const e1 = c[a] ^ c[b], e2 = c[b] ^ c[d], e3 = c[d] ^ c[a]; if (c[a] < 0 || c[b] < 0 || c[d] < 0 || !e1 || !e2 || !e3) return 0; return e2 === e1 % 3 + 1 ? 1 : -1; };
  // a ring of n corners clockwise from the top, the hole at place 0 with a 5-corner rim (a fan), the rest zigzagged;
  // a real proper colouring, so the signs are true. -> { svg parts, T: triangles, col, pts }
  const rimAt = n => [n - 3, n - 2, n - 1, 1, 2];   // the hole's five rim places, clockwise
  function disc(cx, cy, R, n, rim, o) {
    o = o || {};
    const pts = Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
    const RP = rimAt(n), T = [[0, 1, 2], [0, 2, n - 3], [0, n - 3, n - 2], [0, n - 2, n - 1]], col = new Array(n).fill(-1);
    RP.forEach((p, i) => { col[p] = rim[i]; });
    let lo = 2, hi = n - 3, side = 0, k = o.seed || 0;
    while (hi - lo > 1) {
      const v = side ? --hi : ++lo, t = side ? [lo, v, hi + 1] : [v - 1, v, hi]; T.push(t.sort((a, b) => a - b));
      const nb = t.filter(x => x !== v).map(x => col[x]); for (let j = 0; j < 4; j++) { const c = (j + k) % 4; if (!nb.includes(c)) { col[v] = c; break; } }
      k += 1 + (v % 2); side = 1 - side;
    }
    const sg = T.map(([a, b, c]) => triSign(col, a, c, b));
    return { pts, T, col, sg };
  }
  function discSvg(D, o) {
    o = o || {};
    const R = o.R, cr = o.cr || 7;
    let s = '<circle cx="' + f1(o.cx + 4) + '" cy="' + f1(o.cy + 7) + '" r="' + f1(R + 4) + '" fill="#000" opacity=".3"/>';
    D.T.forEach((t, i) => { s += tri(t.map(p => D.pts[p]), D.sg[i], { gs: o.gs === undefined ? 5 : o.gs, lit: o.lit && o.lit.includes(i), cls: o.cls && o.cls[i], sw: o.sw }); });
    s += '<path d="' + triD(D.pts) + '" fill="none" stroke="' + INK + '" stroke-width="' + f1((o.sw || 2.4) * 2.4) + '" stroke-linejoin="round"/><path d="' + triD(D.pts) + '" fill="none" stroke="#fff3d6" stroke-width="' + f1(o.sw || 2.4) + '" stroke-linejoin="round"/>';
    D.pts.forEach((p, i) => { if (!i) return; s += (o.gem && o.gem(i)) || D.col[i] >= 0 && o.allCol || rimAt(D.pts.length).includes(i) ? gem(D.col[i], p[0], p[1], cr * 1.25, o.glow && o.glow.includes(i)) : pearl(p[0], p[1], cr); });
    s += well(D.pts[0][0], D.pts[0][1] - cr * .4, cr * 1.9, o.fill === undefined ? -1 : o.fill);
    return s;
  }
  const bg = '<rect width="300" height="250" fill="' + NIGHT + '"/><circle cx="96" cy="60" r="150" fill="#2c2470" opacity=".7"/><circle cx="70" cy="40" r="60" fill="#3a3190" opacity=".35"/>' +
    [[24, 30, 1.6], [270, 26, 2], [250, 210, 1.4], [40, 214, 1.8], [150, 16, 1.2], [286, 120, 1.3], [12, 130, 1.1]].map(([x, y, r]) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" opacity=".7"/>').join('');
  const svg = (inner, css, bare) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (css ? '<style>@media (prefers-reduced-motion: no-preference){' + css + '}</style>' : '') + (bare ? '' : bg) + inner + '</svg>';
  const FLIP = '.fl{transform-box:fill-box;transform-origin:50% 50%;animation:fl 2.6s ease-in-out infinite}@keyframes fl{0%,40%{transform:scale(1)}50%{transform:scale(.05) rotate(25deg)}60%,100%{transform:scale(1)}}' +
    '.tap{animation:tp 2.6s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes tp{0%{transform:scale(.4);opacity:.6}20%{transform:scale(1.6);opacity:0}100%{opacity:0}}';
  const RIM = [0, 1, 0, 2, 3];

  // ---- title: the ring with the hole on top, two triangles flipping sign in turn
  const TD = disc(150, 132, 96, 16, RIM, { seed: 1 });
  const titleSvg = svg(discSvg(TD, { cx: 150, cy: 132, R: 96, cr: 9, gs: 7, cls: TD.T.map((_, i) => i === 7 ? 'fl a' : i === 11 ? 'fl b' : '') }) +
    spark(36, 52, 8) + spark(266, 70, 6, SUN_L) + spark(258, 214, 7, SEA_L),
    FLIP + '.b{animation-delay:1.3s}', true);

  // ---- how to play: one picture and one short sentence each
  const H1 = disc(150, 128, 84, 14, RIM, { seed: 2 });
  const p1 = svg(discSvg(H1, { cx: 150, cy: 128, R: 84, cr: 9, gs: 6, glow: rimAt(14) }) +
    '<g class="pl"><circle cx="150" cy="38" r="26" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 5"/></g>',
    '.pl{transform-box:fill-box;transform-origin:50% 50%;animation:pl 1.4s ease-in-out infinite}@keyframes pl{50%{transform:scale(1.15);opacity:.5}}');
  // a sun triangle and its mirror, sea
  const tA = [[60, 70], [130, 190], [24, 190]], tB = [[240, 70], [276, 190], [170, 190]];
  const arrow = (cx, cy, r, cw) => { const a0 = cw ? -2.4 : -.74, a1 = cw ? -.74 : -2.4, e = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], t = cw ? 1 : -1;
    const hd = [[e[0] + 7 * Math.cos(a1 + t * 1.57), e[1] + 7 * Math.sin(a1 + t * 1.57)], [e[0] + 6 * Math.cos(a1), e[1] + 6 * Math.sin(a1)], [e[0] - 6 * Math.cos(a1), e[1] - 6 * Math.sin(a1)]];
    const d = 'M' + P(cx + r * Math.cos(a0), cy + r * Math.sin(a0)) + 'A' + r + ' ' + r + ' 0 0 ' + (cw ? 1 : 0) + ' ' + P(e[0], e[1]);
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="' + triD(hd) + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><path d="' + triD(hd) + '" fill="#fff"/>'; };
  const p2 = svg(tri(tA, 1, { gs: 13 }) + tri(tB, -1, { gs: 13 }) + gem(0, 60, 70, 15) + gem(1, 130, 190, 15) + gem(2, 24, 190, 15) + gem(0, 240, 70, 15) + gem(2, 276, 190, 15) + gem(1, 170, 190, 15) +
    arrow(71, 150, 27, true) + arrow(229, 150, 27, false));
  // pick a corner: its chain lights, the triangles it touches flip
  const H3 = disc(150, 124, 86, 14, RIM, { seed: 2 }), ch3 = [7, 8], lit3 = H3.T.map((t, i) => t.some(p => ch3.includes(p)) && !t.includes(0) ? i : -1).filter(i => i >= 0);
  const p3 = svg(discSvg(H3, { cx: 150, cy: 124, R: 86, cr: 9, gs: 6, cls: H3.T.map((_, i) => lit3.includes(i) ? 'fl' : ''), gem: i => ch3.includes(i) ? gem(H3.col[i], H3.pts[i][0], H3.pts[i][1], 11, true) : '' }) +
    '<g transform="translate(' + P(H3.pts[7][0] + 6, H3.pts[7][1] + 8) + ')">' + finger + '</g>', FLIP);
  // a lock: one chain joins two rim corners, so both swap
  const H4 = disc(150, 128, 84, 14, RIM, { seed: 2 });
  const p4 = svg(discSvg(H4, { cx: 150, cy: 128, R: 84, cr: 9, gs: 6, glow: [11, 13] }) +
    '<path d="M' + P(H4.pts[11][0], H4.pts[11][1]) + 'Q150 140 ' + P(H4.pts[13][0], H4.pts[13][1]) + '" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="3 6" stroke-linecap="round"/>' +
    '<g transform="translate(150 150)"><rect x="-13" y="-6" width="26" height="20" rx="4" fill="' + SUN + '" stroke="' + INK + '" stroke-width="3"/><path d="M-7 -6v-6a7 7 0 0 1 14 0v6" fill="none" stroke="' + INK + '" stroke-width="3.4"/><circle cy="4" r="3" fill="' + INK + '"/></g>');
  // win: the hole takes the free element, its open triangles close with signs
  const H5 = disc(150, 128, 84, 14, [0, 1, 0, 1, 3], { seed: 2 }), c5 = H5.col.slice(); c5[0] = 2;
  H5.sg = H5.T.map(([a, b, c]) => triSign(c5, a, c, b));
  const p5 = svg('<g class="ry">' + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return '<path d="M' + P(150 + Math.cos(a) * 112, 128 + Math.sin(a) * 112) + 'L' + P(150 + Math.cos(a) * 126, 128 + Math.sin(a) * 126) + '" stroke="' + NEON[2] + '" stroke-width="4" stroke-linecap="round"/>'; }).join('') + '</g>' +
    discSvg(H5, { cx: 150, cy: 128, R: 84, cr: 9, gs: 6, fill: 2 }) + spark(44, 40, 9) + spark(262, 48, 7, SUN_L) + spark(250, 220, 8, SEA_L),
    '.ry{animation:ry 1.6s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ry{0%{transform:scale(.8);opacity:0}30%{opacity:1}100%{transform:scale(1.1);opacity:0}}');
  const I = [
    { title: 'Fill the hole', text: 'The ? needs an element none of its five rim corners use.', svg: p1 },
    { title: 'Sun and sea', text: 'Three elements round a triangle: one way round is sun, the other sea.', svg: p2 },
    { title: 'Flip a chain', text: 'Tap a corner and a partner: every triangle its chain touches flips.', svg: p3 },
    { title: 'Locked', text: 'A chain joining two rim corners swaps them both.', svg: p4 },
    { title: 'Closed!', text: 'Three elements on the rim: the hole fills and its triangles close.', svg: p5 },
  ];

  // ---- icon, logo and card (SKIN-SPEC 13): ids carry signs-ic-, signs-lg-, signs-cd-
  function logoArt(p) {
    const T = (x, y, s, fill, str) => '<text x="' + (x + 3) + '" y="' + (y + 4) + '" font-family="' + FONT + '" font-weight="700" font-size="' + s + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round" paint-order="stroke">' + str + '</text>' +
      '<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-weight="700" font-size="' + s + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round" paint-order="stroke">' + str + '</text>';
    return '<defs><linearGradient id="' + p + '-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8"/><stop offset=".5" stop-color="' + SUN + '"/><stop offset="1" stop-color="' + SUN_D + '"/></linearGradient></defs>' +
      tri([[34, 14], [62, 62], [6, 62]], 1, { gs: 9, sw: 3 }) + tri([[62, 62], [90, 14], [34, 14]], -1, { gs: 9, sw: 3 }) + T(100, 56, 44, 'url(#' + p + '-t)', 'Signs') + spark(226, 14, 6, SEA_L);
  }
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + logoArt('signs-lg') + '</svg>';
  const icon = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="signs-ic-bg" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#4a3fb0"/><stop offset=".55" stop-color="#241d5c"/><stop offset="1" stop-color="#120f33"/></linearGradient></defs>' +
    '<rect width="120" height="120" rx="26" fill="url(#signs-ic-bg)"/><circle cx="40" cy="30" r="40" fill="#fff" opacity=".08"/>' +
    '<path d="M60 14L104 92H16Z" transform="translate(4 7)" fill="#000" opacity=".4"/>' +
    tri([[60, 14], [104, 92], [60, 92]], -1, { gs: 0, sw: 4 }) + tri([[60, 14], [60, 92], [16, 92]], 1, { gs: 0, sw: 4 }) +
    plus(42, 70, 10, SUN_I) + minus(79, 70, 10, SEA_I) + gem(0, 60, 16, 11) + gem(1, 104, 92, 11) + gem(2, 16, 92, 11) + pearl(60, 92, 8) +
    '<path d="M20 34A44 44 0 0 1 40 14" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/></svg>';
  const CD = disc(120, 116, 88, 14, RIM, { seed: 3 }), chC = [7], litC = CD.T.map((t, i) => t.some(p => chC.includes(p)) && !t.includes(0) ? i : -1).filter(i => i >= 0);
  const card = '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<radialGradient id="signs-cd-bg" cx=".3" cy=".2" r=".95"><stop offset="0" stop-color="#3a3190"/><stop offset=".5" stop-color="' + NIGHT + '"/><stop offset="1" stop-color="#0d0b26"/></radialGradient>' +
    '<linearGradient id="signs-cd-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0b26" stop-opacity="0"/><stop offset=".35" stop-color="#0d0b26" stop-opacity=".9"/><stop offset="1" stop-color="#08061a"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="url(#signs-cd-bg)"/>' +
    discSvg(CD, { cx: 120, cy: 116, R: 88, cr: 8, gs: 6, lit: litC, gem: i => chC.includes(i) ? gem(CD.col[i], CD.pts[i][0], CD.pts[i][1], 11, true) : '' }) +
    spark(26, 30, 7) + spark(214, 40, 6, SUN_L) + '<g transform="translate(' + P(CD.pts[7][0] + 6, CD.pts[7][1] + 6) + ')">' + finger + '</g>' +
    '<rect y="222" width="240" height="98" fill="url(#signs-cd-f)"/><g transform="translate(0 236)">' + logoArt('signs-cd-lg') + '</g></svg>';

  // ---- the level map: night sky, islands quilted with sun and sea triangles
  const ZT = { cove: SEA, beach: SUN, town: '#7ad06a', harbour: '#5ab4ff', forest: '#4caf50', cape: '#b39dff', reef: '#ff8fb8', cave: '#7a6cff', volcano: '#ff7a52' };
  const levelMap = {
    bg: NIGHT,
    defs: '<radialGradient id="signsLmGlow"><stop offset="0" stop-color="#4a3fb0" stop-opacity=".35"/><stop offset="1" stop-color="#4a3fb0" stop-opacity="0"/></radialGradient>',
    backdrop(H, rnd) {
      let s = '';
      for (let k = 0; k * 700 < H + 300; k++) s += '<circle cx="' + f1(80 + rnd(k, 3) * 240) + '" cy="' + (k * 700 + 260) + '" r="280" fill="url(#signsLmGlow)"/>';
      for (let k = 0; k < Math.floor(H / 22); k++) s += '<circle cx="' + f1(rnd(k, 5) * 400) + '" cy="' + f1(rnd(k, 6) * H) + '" r="' + f1(.6 + rnd(k, 7) * 1.4) + '" fill="#fff" opacity="' + f1(.3 + rnd(k, 8) * .5) + '"/>';
      for (let k = 0; k < Math.floor(H / 260); k++) { const x = rnd(k, 11) * 400, y = rnd(k, 12) * H, r = 14 + rnd(k, 13) * 20, up = rnd(k, 14) < .5;
        s += '<path d="M' + P(x, y - r) + 'L' + P(x + r, y + r * .7) + 'L' + P(x - r, y + r * .7) + 'Z" fill="' + (up ? SUN : SEA) + '" opacity=".14" transform="rotate(' + f1(rnd(k, 15) * 60) + ' ' + P(x, y) + ')"/>'; }
      return '<g>' + s + '</g>';
    },
    zone(z) {
      const c = ZT[z.theme] || SUN;
      return '<g><path d="' + z.path + '" transform="translate(4 8)" fill="#000" opacity=".45"/><path d="' + z.path + '" fill="#30287a" stroke="' + INK + '" stroke-width="7"/>' +
        '<path d="' + z.path + '" fill="' + c + '" fill-opacity=".14" stroke="' + c + '" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round"/></g>';
    },
    decor(theme, r, r2) {        // a small signed triangle, a pearl, a pair of triangles, a twinkle; about half the spots empty
      const sg = r2 < .5 ? 1 : -1, a = f1(r2 * 120);
      if (r < .16) return '<g transform="rotate(' + a + ')">' + tri([[0, -12], [11, 8], [-11, 8]], sg, { gs: 4, sw: 2 }) + '</g>';
      if (r < .26) return pearl(0, 0, 5 + r2 * 3);
      if (r < .36) return '<g transform="rotate(' + a + ')">' + tri([[-10, -9], [10, -9], [0, 9]], sg, { gs: 0, sw: 2, flat: true }) + tri([[10, -9], [20, 9], [0, 9]], -sg, { gs: 0, sw: 2, flat: true }) + '</g>';
      if (r < .44) return spark(0, 0, 5 + r2 * 4, r2 < .5 ? SUN_L : SEA_L);
      return '';
    },
    sign(label, w) {
      return '<rect x="2" y="4" width="' + w + '" height="30" rx="15" fill="#000" opacity=".45"/><rect width="' + w + '" height="30" rx="15" fill="' + PEARL + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<rect x="8" y="4" width="' + (w - 16) + '" height="5" rx="2.5" fill="#fff" opacity=".8"/>' +
        '<text x="' + f1(w / 2) + '" y="20" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="13" fill="' + INK + '">' + label + '</text>';
    },
    road: { todo: [INK, '#3a3378', '#8f86d6'], done: [INK, SUN_D, SUN], widths: [20, 13, 4], dash: '2 7', cap: 'round' },
    node(state, num, e, boss) {
      const R = boss ? 33 : 29, fs = num.length > 3 ? 13 : num.length > 2 ? 15 : num.length > 1 ? 18 : 22;
      const txt = c => '<text y="' + f1(fs * .36 + 3) + '" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="' + fs + '" fill="' + c + '" stroke="' + INK + '" stroke-width="3.5" paint-order="stroke">' + num + '</text>';
      const q = [[0, -R * 1.05], [R * .98, R * .66], [-R * .98, R * .66]];
      if (state === 'locked') return '<path d="' + triD(q) + '" transform="translate(2 4)" fill="#000" opacity=".5"/>' + tri(q, 0, { sw: 3 }) +
        '<rect x="-7" y="0" width="14" height="11" rx="2" fill="#8f86d6" stroke="' + INK + '" stroke-width="2"/><path d="M-4 0v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#8f86d6" stroke-width="2.4"/>';
      const sg = state === 'beaten' ? 1 : -1;
      return (state === 'current' ? '<circle r="' + (R + 9) + '" fill="none" stroke="' + SUN + '" stroke-width="3" stroke-dasharray="4 4"/>' : '') +
        '<path d="' + triD(q) + '" transform="translate(2 4)" fill="#000" opacity=".5"/>' + tri(q, sg, { sw: 3 }) +
        (e >= 0 ? '<circle cx="0" cy="' + f1(-R * .62) + '" r="6" fill="' + COL[e] + '" stroke="' + INK + '" stroke-width="2"/>' : '') + txt('#fff');
    },
    start() { return well(0, 0, 16, -1) + '<text y="34" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="12" fill="' + SUN + '" stroke="' + INK + '" stroke-width="3" paint-order="stroke">START</text>'; },
    pin() {
      return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="' + PINK + '" stroke="' + INK + '" stroke-width="3"/>' +
        tri([[0, -15], [10, 3], [-10, 3]], 1, { gs: 3.4, sw: 1.8 }) + '<ellipse cx="-8" cy="-12" rx="4" ry="2.2" fill="#fff" opacity=".7"/>';
    },
  };

  // the coin: a trigon, a triangular token half sun half sea, ± on its face
  const coinTri = '<path d="M0 -12.2L11.6 8.6H-11.6Z" transform="translate(1.2 1.8)" fill="#1c1640" opacity=".4"/>' +
    '<path d="M0 -12.2L11.6 8.6H-11.6Z" fill="' + SEA + '" stroke="#1c1640" stroke-width="1.9" stroke-linejoin="round"/><path d="M0 -12.2L0 8.6H-11.6Z" fill="' + SUN + '"/>' +
    '<path d="M0 -12.2L11.6 8.6H-11.6Z" fill="none" stroke="#1c1640" stroke-width="1.9" stroke-linejoin="round"/><path d="M0 -12.2V8.6" stroke="#1c1640" stroke-width="1.2"/>' +
    '<path d="M-4.6 1.6h3M-3.1 .1v3" stroke="' + SUN_I + '" stroke-width="1.5" stroke-linecap="round"/><path d="M1.8 1.6h3" stroke="' + SEA_I + '" stroke-width="1.5" stroke-linecap="round"/>' +
    '<ellipse cx="-3.4" cy="-4" rx="1.6" ry=".8" transform="rotate(-60 -3.4 -4)" fill="#fff" opacity=".85"/>';

  FTH_SKINS.register({
    id: 'signs', name: 'Signs', ic: '➕', blurb: 'flip the sun and sea',
    src: 'lab/signs.html', hud: 'full', needs: ['tri'],
    coin: { name: 'trigon', plural: 'trigons', glyph: '🔺', value: 42, pitch: 1.15, colors: { main: SUN, edge: SEA_D }, svg: FTH_SKINS.coinArt(coinTri) },
    fonts: ['https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap'],
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 30% 18%, #2c2470 0%, #1a1545 50%, #0d0b26 100%)',
      '--sk-ink': '#fff6e6',
      '--sk-accent': SUN,
      '--sk-card': 'linear-gradient(180deg, #2c2466, #17123d)',
      '--sk-card-ink': '#f5f0ff',
      '--sk-hud': 'linear-gradient(180deg, rgba(44,36,102,.96), rgba(23,18,61,.93))',
      '--sk-btn': 'linear-gradient(180deg, #ffe08a, #ffb21f)',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': '#9a5a00',
      '--sk-font': FONT,
      '--sk-radius': '20px',
      '--sk-chip': 'linear-gradient(#352c7a, #241d5c)',
      '--sk-chip-ink': '#fff6e6',
      '--sk-edge': '#0d0b26',
      '--sk-btn2': 'linear-gradient(180deg, #6fb1ff, #2f7be0)',
      '--sk-btn2-ink': '#ffffff',
      '--sk-coin': 'linear-gradient(180deg, #ffe08a, #ffb21f)',
      '--sk-star-on': '#ffd24a', '--sk-star-edge': '#9a5a00', '--sk-star-off': '#9a90d8', '--sk-star-off-edge': '#cfc8ff',
      '--sk-ctl': '#2f2770', '--sk-ctl-ink': '#fff6e6', '--sk-ctl-edge': '#0d0b26',
    },
    css: '.coins{color:' + INK + '}.tl .tin{transition:transform .14s}.tl.lit .tin{transform:scale(1.12) rotate(-12deg)}.tl.glow .tin{filter:drop-shadow(0 0 6px #fff3b0)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: '±', board: 'radial-gradient(ellipse at 35% 25%, #2c2470, #0d0b26 80%)', line: SUN,
      games: ['chain', 'stack', 'pop', 'hop'], intro: 'spin',
      // one facet gem per element: fire a triangle up, water a triangle down, air a rhombus, earth a hexagon
      tile(x, y, r, e, k) {
        const s = r * .92, sh = { 0: [[0, -s], [s * .95, s * .7], [-s * .95, s * .7]], 1: [[-s * .95, -s * .7], [s * .95, -s * .7], [0, s]], 2: [[0, -s], [s * .8, 0], [0, s], [-s * .8, 0]],
          3: Array.from({ length: 6 }, (_, i) => [s * .92 * Math.cos(Math.PI / 6 + i * Math.PI / 3), s * .92 * Math.sin(Math.PI / 6 + i * Math.PI / 3)]) }[e];
        const d = triD(sh), ins = triD(sh.map(p => [p[0] * .74 - s * .05, p[1] * .74 - s * .06]));
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<path d="' + d + '" transform="translate(' + P(s * .1, s * .14) + ')" fill="' + INK + '" opacity=".5"/><path d="' + d + '" fill="' + DK[e] + '" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.6, s * .1)) + '" stroke-linejoin="round"/>' +
          '<path d="' + ins + '" fill="' + COL[e] + '"/>' + icon24(e, s * .55 / 12, '#fff') +
          '<ellipse cx="' + f1(-s * .3) + '" cy="' + f1(-s * .28) + '" rx="' + f1(s * .2) + '" ry="' + f1(s * .1) + '" transform="rotate(-35 ' + P(-s * .3, -s * .28) + ')" fill="#fff" opacity=".6"/></g></g>';
      },
    },
    map: {
      sea: ['#2c2466', '#29215f', '#251e58', '#221b51', '#1e184a', '#1b1543', '#17123c', '#140f35', '#110d2e'],
      seaX: '#0d0b26', fog: '#08061a', unknown: '#5a5290',
      ramp: ['#4caf50', '#ffc23d', '#ff9a3c', '#ef5a3c'],
      grey: '#9a90d8', route: SUN, ink: 'rgba(245,240,255,.85)',
      cell(path, x, y, r) {      // a triangle, alternately up and down so neighbours interlock
        const up = (Math.round(x / Math.max(r, 1e-6)) + Math.round(y / Math.max(r, 1e-6))) % 2 === 0, s = up ? 1 : -1;
        path.moveTo(x, y - s * r * .95); path.lineTo(x + r * .95, y + s * r * .62); path.lineTo(x - r * .95, y + s * r * .62); path.closePath();
      },
    },
    levelMap,
    words: { win: 'Hole closed!', perfect: 'Perfect flips!', par: 'Par {par}: go for ★★★', chart: 'COLOURING SPACE' },
    eggs: [
      { id: 'half-turn', on: 'page', note: 'one swap that flips at least 80% of the signed triangles', pays: true },
      { id: 'mirror', on: 'title', taps: 5, run(fx) { if (!fx) return; fx.burst && (fx.burst('➕', .32, .45), fx.burst('➖', .68, .45)); fx.sound && fx.sound('chime'); } },
    ],
  });
})();
