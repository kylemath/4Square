// Star: no map at all. The rim of the hole is a five-pointed star (rim.js's frame: the trouble spot is a gold star edge,
// Kempe's two rim chains are padlocked edges, π hops the spot), every Kempe move is a branch to a smaller child star, and
// you climb the state tree to a star that breaks open. A flask opens the heuristic lab: build a rule from star features,
// test it on every level. Play page lab/star.html (model lab/star-rules.js); design note lab/STAR-DESIGN.md.
(function () {
  const COL = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'], DK = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'], NEON = ['#ff7a52', '#5ab4ff', '#ffe066', '#5cff8a'];
  const INK = '#140d33', GOLD = '#ffd84a', GOLD_D = '#c2840c', VIO = '#4b37b8', VIO_D = '#2a1d78', VIO_L = '#8a74ff', NIGHT = '#0d0830';
  const FONT = "'Righteous','Arial Rounded MT Bold',system-ui,sans-serif";
  const ICON = [   // lab/core.js LAB.ICON (24 x 24): fire, water, air, earth
    'M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2.4 1.1-4.1 2.3-5.2.1 1.6.8 2.7 1.9 3.3C10.3 8 11 5 12 2z',
    'M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z',
    'M3 8.5h11a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8M3 16.5h8',
    'M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M6 18c3-4 6-7 9-9',
  ];
  const f1 = n => Math.round(n * 10) / 10, P = (x, y) => f1(x) + ' ' + f1(y);
  // one glossy gem of element e: dark base, lit body, white element icon, highlight, outline
  function gem(e, x, y, r) {
    const s = f1(r * .058 * 100) / 100;
    return '<g transform="translate(' + P(x, y) + ')"><circle cy="' + f1(r * .16) + '" r="' + f1(r) + '" fill="' + INK + '" opacity=".55"/><circle r="' + f1(r) + '" fill="' + DK[e] + '"/>' +
      '<circle cy="' + f1(-r * .07) + '" r="' + f1(r * .86) + '" fill="' + COL[e] + '"/>' +
      (r >= 6 ? '<path d="' + ICON[e] + '" transform="scale(' + s + ') translate(-12 -11.5)" ' + (e < 2 ? 'fill="#fff"' : 'fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"') + '/>' : '') +
      '<ellipse cx="' + f1(-r * .36) + '" cy="' + f1(-r * .42) + '" rx="' + f1(r * .3) + '" ry="' + f1(r * .15) + '" transform="rotate(-35 ' + P(-r * .36, -r * .42) + ')" fill="#fff" opacity=".6"/>' +
      '<circle r="' + f1(r) + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.2, r * .16)) + '"/></g>';
  }
  const pts = (cx, cy, R, k) => Array.from({ length: k || 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / (k || 5); return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  function body(cx, cy, R, ri) { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? ri : R; d += (i ? 'L' : 'M') + P(cx + q * Math.cos(a), cy + q * Math.sin(a)); } return d + 'Z'; }
  const line = (a, b, st) => '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" ' + st + '/>';
  function padlock(x, y, s, open) {
    return '<g transform="translate(' + P(x, y) + ') scale(' + s + ')"><path d="' + (open ? 'M-4.4 -1V-6a4.4 4.4 0 0 1 8.8 0V-8' : 'M-4.4 -1V-5a4.4 4.4 0 0 1 8.8 0V-1') + '" fill="none" stroke="' + INK + '" stroke-width="4.6" stroke-linecap="round"/>' +
      '<path d="' + (open ? 'M-4.4 -1V-6a4.4 4.4 0 0 1 8.8 0V-8' : 'M-4.4 -1V-5a4.4 4.4 0 0 1 8.8 0V-1') + '" fill="none" stroke="#e6e0ff" stroke-width="2.2" stroke-linecap="round"/>' +
      '<rect x="-7" y="-1" width="14" height="11" rx="2.5" fill="' + (open ? '#7dff8a' : GOLD) + '" stroke="' + INK + '" stroke-width="2"/><circle cy="4" r="1.7" fill="' + INK + '"/></g>';
  }
  // a whole star: rim elements rim[5], trouble spot t (-1: none), locks [l1, l2], gradient id g; o: { pi, deg }
  function star(cx, cy, R, rim, t, locks, g, o) {
    o = o || {};
    const Pt = pts(cx, cy, R), gr = R * .26, sw = f1(Math.max(1.6, R * .06));
    let s = '<path d="' + body(cx, cy, R * .96, R * .5) + '" transform="translate(' + P(R * .05, R * .08) + ')" fill="' + INK + '" opacity=".5"/>' +
      '<path d="' + body(cx, cy, R * .96, R * .5) + '" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
    for (let i = 0; i < 5; i++) s += line(Pt[i], Pt[(i + 2) % 5], 'stroke="#fff6d6" stroke-opacity=".22" stroke-width="' + f1(Math.max(1, R * .03)) + '"');
    if (t >= 0) {
      const X = i => Pt[(t + i) % 5];
      if (!o.bare) [[3, locks[0], rim[(t + 3) % 5]], [4, locks[1], rim[(t + 4) % 5]]].forEach(([j, shut, c2]) => {
        const a = X(1), b = X(j), lw = f1(R * .07);
        if (shut) s += line(a, b, 'stroke="' + INK + '" stroke-width="' + f1(R * .13) + '" stroke-linecap="round"') + line(a, b, 'stroke="' + COL[rim[(t + 1) % 5]] + '" stroke-width="' + lw + '"') + line(a, b, 'stroke="' + COL[c2] + '" stroke-width="' + lw + '" stroke-dasharray="' + f1(R * .11) + ' ' + f1(R * .11) + '"');
        else s += line(a, b, 'stroke="' + GOLD + '" stroke-opacity=".55" stroke-width="' + f1(R * .04) + '" stroke-dasharray="' + f1(R * .05) + ' ' + f1(R * .07) + '"');
        s += padlock(a[0] + (b[0] - a[0]) * .72, a[1] + (b[1] - a[1]) * .72, f1(R * .016 * 100) / 100, !shut);
      });
      s += line(X(0), X(2), 'stroke="' + INK + '" stroke-width="' + f1(R * .17) + '" stroke-linecap="round"') + line(X(0), X(2), 'class="hot" stroke="' + GOLD + '" stroke-width="' + f1(R * .1) + '" stroke-linecap="round"');
    }
    s += '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(R * .26) + '" fill="#07041a" stroke="' + INK + '" stroke-width="' + sw + '"/>';
    if (o.deg != null) s += '<text x="' + f1(cx) + '" y="' + f1(cy + R * .085) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + f1(R * .23) + '" fill="#fff6d6">' + o.deg + '</text>';
    if (o.pi && t >= 0) {
      const a0 = -Math.PI / 2 + ((t + 2) % 5) * 2 * Math.PI / 5 + .2, a1 = -Math.PI / 2 + ((t + 3) % 5) * 2 * Math.PI / 5 - .2, RA = R * 1.36;
      s += '<path d="M' + P(cx + RA * Math.cos(a0), cy + RA * Math.sin(a0)) + 'A' + f1(RA) + ' ' + f1(RA) + ' 0 0 1 ' + P(cx + RA * Math.cos(a1), cy + RA * Math.sin(a1)) + '" fill="none" stroke="' + GOLD + '" stroke-width="' + f1(R * .05) + '" stroke-dasharray="' + f1(R * .08) + ' ' + f1(R * .06) + '" stroke-linecap="round" class="pa"/>';
    }
    Pt.forEach((p, i) => {
      if (t >= 0 && (i === t || i === (t + 2) % 5)) s += '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + f1(gr * 1.32) + '" fill="none" stroke="' + GOLD + '" stroke-width="' + f1(Math.max(1.6, gr * .2)) + '"/>';
      s += gem(rim[i], p[0], p[1], gr);
    });
    return s;
  }
  // a star broken open: the arms burst apart, rays behind, the free element's gem in the hole
  function broken(cx, cy, R, rim, free, g) {
    const off = R * .17, ri = R * .5;
    let s = '<g class="ry">' + Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5 + .25, a2 = a + .08; return '<path d="M' + P(cx, cy) + 'L' + P(cx + Math.cos(a) * R * 1.55, cy + Math.sin(a) * R * 1.55) + 'L' + P(cx + Math.cos(a2) * R * 1.55, cy + Math.sin(a2) * R * 1.55) + 'Z" fill="#fff6c0" opacity=".35"/>'; }).join('') + '</g>';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5, h = Math.PI / 5, A = [R * Math.cos(a), R * Math.sin(a)], B = [ri * Math.cos(a - h), ri * Math.sin(a - h)], C = [ri * Math.cos(a + h), ri * Math.sin(a + h)];
      const d = 'M' + P(A[0], A[1]) + 'L' + P(B[0], B[1]) + 'L' + P(B[0] * .2, B[1] * .2) + 'L' + P(C[0] * .2, C[1] * .2) + 'L' + P(C[0], C[1]) + 'Z';
      s += '<g transform="translate(' + P(cx + Math.cos(a) * off, cy + Math.sin(a) * off) + ') rotate(' + (i % 2 ? 9 : -9) + ' ' + P(A[0] * .5, A[1] * .5) + ')"><path d="' + d + '" transform="translate(' + P(R * .04, R * .06) + ')" fill="' + INK + '" opacity=".45"/>' +
        '<path d="' + d + '" fill="url(#' + g + ')" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.6, R * .06)) + '" stroke-linejoin="round"/></g>';
    }
    s += '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(R * .42) + '" fill="' + NEON[free] + '" opacity=".35"/>' + gem(free, cx, cy, R * .3);
    pts(cx, cy, R + off).forEach((p, i) => { s += gem(rim[i], p[0], p[1], R * .26); });
    return s;
  }
  const grads = p => '<radialGradient id="' + p + '-b" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="' + VIO_L + '"/><stop offset=".55" stop-color="' + VIO + '"/><stop offset="1" stop-color="' + VIO_D + '"/></radialGradient>' +
    '<radialGradient id="' + p + '-g" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff6c0"/><stop offset=".5" stop-color="' + GOLD + '"/><stop offset="1" stop-color="#e08a10"/></radialGradient>' +
    '<radialGradient id="' + p + '-n" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#3b2a86"/><stop offset=".5" stop-color="#1d1452"/><stop offset="1" stop-color="#0a0626"/></radialGradient>';
  const sparkle = (x, y, s, c) => '<path d="M' + P(x, y - s) + 'L' + P(x + s * .28, y - s * .28) + 'L' + P(x + s, y) + 'L' + P(x + s * .28, y + s * .28) + 'L' + P(x, y + s) + 'L' + P(x - s * .28, y + s * .28) + 'L' + P(x - s, y) + 'L' + P(x - s * .28, y - s * .28) + 'Z" fill="' + (c || '#fff6d6') + '" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round"/>';
  function twinkles(n, W, H, seed) { let r = seed || 7, s = ''; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; }; for (let i = 0; i < n; i++) s += '<circle' + (i % 3 ? '' : ' class="tw"') + ' cx="' + f1(rnd() * W) + '" cy="' + f1(rnd() * H) + '" r="' + f1(.5 + rnd() * 1.2) + '" fill="#fff6d6" opacity="' + f1(.3 + rnd() * .5) + '"/>'; return s; }
  const branch = (a, b, c, w, dash) => '<path d="M' + P(a[0], a[1]) + 'Q' + P((a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2) + ' ' + P(b[0], b[1]) + '" fill="none" stroke="' + INK + '" stroke-width="' + (w + 5) + '" stroke-linecap="round" opacity=".55"/>' +
    '<path d="M' + P(a[0], a[1]) + 'Q' + P((a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2) + ' ' + P(b[0], b[1]) + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
  const finger = '<g><circle r="13" fill="#fff" opacity=".25" class="tap"/><g transform="rotate(-22)"><rect x="-12" y="18" width="28" height="30" rx="11" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="-6.5" y="-2" width="13" height="34" rx="6.5" fill="#fff" stroke="' + INK + '" stroke-width="3"/></g></g>';
  const CSS = '.tw{animation:tw 3s ease-in-out infinite}@keyframes tw{50%{opacity:.1}}.hot{animation:ht 1.4s ease-in-out infinite}@keyframes ht{50%{stroke:#fff6c0}}' +
    '.bb{animation:bb 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes bb{50%{transform:translateY(-4px) scale(1.05)}}.ry{animation:ry 9s linear infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ry{to{transform:rotate(360deg)}}' +
    '.tap{animation:tp 2.4s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes tp{0%{transform:scale(.4);opacity:.6}25%{transform:scale(1.6);opacity:0}100%{opacity:0}}.pa{animation:pa 1.2s linear infinite}@keyframes pa{to{stroke-dashoffset:-20}}';
  const svg = (p, inner) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg"><defs>' + grads(p) + '</defs><style>@media (prefers-reduced-motion: no-preference){' + CSS + '}</style>' +
    '<rect width="300" height="250" fill="url(#' + p + '-n)"/>' + twinkles(34, 300, 250, p.length * 31) + inner + '</svg>';
  const RIM = [0, 1, 0, 2, 3];

  // ---- title: the big star, its branches, three child stars, one broken open
  const tc = [[68, 205], [150, 214], [232, 205]];
  const titleSvg = svg('star-t', tc.map((c, i) => branch([150, 120], [c[0], c[1] - 26], i === 2 ? '#7dff8a' : i === 1 ? GOLD : '#b9a8ff', i ? 4.5 : 3.4, i === 1 ? '8 6' : '')).join('') +
    star(150, 98, 60, RIM, 0, [true, true], 'star-t-b', { pi: true, deg: '+2' }) +
    '<g class="bb">' + star(68, 205, 25, [1, 0, 1, 2, 3], 2, [true, false], 'star-t-b') + '</g><g class="bb" style="animation-delay:.4s">' + star(150, 214, 25, [0, 1, 3, 2, 3], 2, [true, true], 'star-t-b') + '</g>' +
    '<g class="bb" style="animation-delay:.8s">' + broken(232, 205, 24, [0, 1, 0, 1, 3], 2, 'star-t-g') + '</g>' + sparkle(40, 40, 8, GOLD) + sparkle(262, 52, 6));

  // ---- how to play
  const I = [
    { title: 'Your rim star', text: 'The five rim tiles are a star. The gold edge joins the element that is there twice.',
      svg: svg('star-i1', star(150, 122, 78, RIM, 0, [false, false], 'star-i1-b', { deg: '+1' }) + sparkle(56, 52, 9, GOLD) + sparkle(246, 200, 7)) },
    { title: 'Take a branch', text: 'Each branch is one chain swap. Tap a small star to make it.',
      svg: svg('star-i2', [[64, 196], [150, 206], [236, 196]].map((c, i) => branch([150, 96], [c[0], c[1] - 24], i === 1 ? '#fff6c0' : '#b9a8ff', i === 1 ? 5 : 3.4)).join('') +
        star(150, 72, 44, RIM, 0, [true, true], 'star-i2-b') + star(64, 196, 23, [1, 0, 1, 2, 3], 2, [true, false], 'star-i2-b') +
        '<g class="bb">' + star(150, 206, 25, [0, 3, 0, 2, 1], 0, [false, true], 'star-i2-b') + '</g>' + star(236, 196, 23, [0, 1, 3, 2, 3], 2, [true, true], 'star-i2-b') +
        '<g transform="translate(162 214)">' + finger + '</g>') },
    { title: 'Locks and π', text: 'A padlock shuts a way out. Both shut? The π swap is forced: the gold edge hops.',
      svg: svg('star-i3', star(150, 120, 74, RIM, 0, [true, true], 'star-i3-b', { pi: true, deg: '−1' }) +
        '<text x="218" y="70" font-family="' + FONT + '" font-size="34" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="6" paint-order="stroke">π</text>') },
    { title: 'Break it open', text: 'Get the rim down to three elements: the star breaks open and the hole fills.',
      svg: svg('star-i4', broken(150, 124, 70, [0, 1, 0, 1, 3], 2, 'star-i4-g') + sparkle(52, 58, 10, GOLD) + sparkle(250, 70, 8, '#7dff8a') + sparkle(236, 214, 9)) },
    { title: 'Write a rule', text: 'The flask builds a rule from these signs and tests it on every level.',
      svg: svg('star-i5', '<g transform="translate(36 54)"><path d="M18 0h22M22 0v30L2 70a8 8 0 0 0 7 12h40a8 8 0 0 0 7-12L36 30V0" fill="#e6e0ff" fill-opacity=".15" stroke="#fff6d6" stroke-width="5" stroke-linejoin="round"/><path d="M10 56h38l8 14a4 4 0 0 1-3.5 6H5.5a4 4 0 0 1-3.5-6z" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="3"/></g>' +
        [['🔒🔒', 'π', 0], ['', '🔓', 1], ['↻', '✧', 2]].map(([c, p, i]) => '<g transform="translate(116 ' + (44 + i * 50) + ')"><rect width="150" height="38" rx="12" fill="' + VIO_D + '" stroke="' + INK + '" stroke-width="3"/><circle cx="20" cy="19" r="11" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="2.5"/>' +
          '<text x="20" y="25" text-anchor="middle" font-family="' + FONT + '" font-size="15" fill="' + INK + '">' + (i + 1) + '</text><text x="56" y="26" font-size="17" fill="#fff">' + c + '</text><text x="96" y="26" font-family="' + FONT + '" font-size="18" fill="' + GOLD + '">→ ' + p + '</text></g>').join('') +
        '<rect x="116" y="200" width="150" height="14" rx="7" fill="#ffffff" fill-opacity=".15" stroke="' + INK + '" stroke-width="2.5"/><rect x="116" y="200" width="124" height="14" rx="7" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="2.5"/>') },
  ];

  // ---- icon, logo and card (SKIN-SPEC 13): ids carry star-ic-, star-lg-, star-cd-
  function word(p, x, y, sz) {
    const T = (dx, dy, fill, sw) => '<text x="' + (x + dx) + '" y="' + (y + dy) + '" font-family="' + FONT + '" font-size="' + sz + '" letter-spacing="3" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round" paint-order="stroke">STAR</text>';
    return '<defs><linearGradient id="' + p + '-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0"/><stop offset=".5" stop-color="' + GOLD + '"/><stop offset="1" stop-color="#e08a10"/></linearGradient></defs>' + T(3, 4, INK, 8) + T(0, 0, 'url(#' + p + '-t)', 6);
  }
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg"><defs>' + grads('star-lg') + '</defs>' + star(42, 42, 27, RIM, 0, [true, false], 'star-lg-b') + word('star-lg', 82, 56, 44) + sparkle(222, 18, 7, GOLD) + '</svg>';
  const icon = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' + grads('star-ic') +
    '<radialGradient id="star-ic-gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + GOLD + '" stop-opacity=".5"/><stop offset="1" stop-color="' + GOLD + '" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="120" height="120" rx="26" fill="url(#star-ic-n)"/>' + twinkles(14, 120, 120, 3) + '<circle cx="60" cy="62" r="56" fill="url(#star-ic-gl)"/>' +
    star(60, 64, 44, RIM, 0, [true, true], 'star-ic-b', { bare: true }) + '<path d="M18 30A46 46 0 0 1 40 12" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/></svg>';
  const cc = [[48, 204], [120, 214], [194, 202]];
  const card = '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' + grads('star-cd') +
    '<linearGradient id="star-cd-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0626" stop-opacity="0"/><stop offset=".4" stop-color="#0a0626" stop-opacity=".9"/><stop offset="1" stop-color="#05031a"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="url(#star-cd-n)"/>' + twinkles(30, 240, 320, 11) +
    [0, 1, 2, 3].map(i => '<g transform="translate(' + (22 + i * 34) + ' 22)"><path d="' + body(0, 0, 12, 6) + '" fill="' + (i === 3 ? GOLD : VIO) + '" stroke="' + INK + '" stroke-width="2"/></g>' + (i ? '<path d="M' + (i * 34 - 2) + ' 22h-6" stroke="' + (i === 2 ? GOLD : '#b9a8ff') + '" stroke-width="3" stroke-linecap="round"/>' : '')).join('') +
    cc.map((c, i) => branch([120, 128], [c[0], c[1] - 24], i === 2 ? '#7dff8a' : i === 1 ? GOLD : '#b9a8ff', i ? 4.5 : 3.4, i === 1 ? '8 6' : '')).join('') +
    star(120, 106, 54, RIM, 0, [true, true], 'star-cd-b', { pi: true, deg: '+2' }) +
    star(48, 204, 23, [1, 0, 1, 2, 3], 2, [true, false], 'star-cd-b') + star(120, 214, 23, [0, 1, 3, 2, 3], 2, [true, true], 'star-cd-b') + broken(194, 202, 22, [0, 1, 0, 1, 3], 2, 'star-cd-g') +
    '<g transform="translate(206 222)">' + finger + '</g>' +
    '<rect y="228" width="240" height="92" fill="url(#star-cd-f)"/><g transform="translate(0 236)">' + word('star-cd-lg', 52, 52, 46) + sparkle(204, 18, 7, GOLD) + '</g></svg>';

  // ---- the level map: constellations on a night sky; each level a star, the road a trail of stardust
  const ZT = { cove: '#3a5fd0', beach: '#b0773a', town: '#3f9a5a', harbour: '#7a5ad0', forest: '#2f8a6a', cape: '#5a6aa8', reef: '#c0486a', cave: '#6a3ab8', volcano: '#c0462a' };
  const levelMap = {
    bg: NIGHT,
    defs: '<radialGradient id="starLmNeb"><stop offset="0" stop-color="#8a74ff" stop-opacity=".22"/><stop offset="1" stop-color="#8a74ff" stop-opacity="0"/></radialGradient>' + grads('starLm'),
    backdrop(H, rnd) {
      let s = '';
      for (let k = 0; k * 600 < H + 300; k++) s += '<circle cx="' + f1(60 + rnd(k, 3) * 280) + '" cy="' + (k * 600 + 200) + '" r="240" fill="url(#starLmNeb)"/>';
      for (let k = 0; k < Math.floor(H / 9); k++) s += '<circle cx="' + f1(rnd(k, 21) * 400) + '" cy="' + f1(rnd(k, 22) * H) + '" r="' + f1(.6 + rnd(k, 23) * 1.3) + '" fill="#fff6d6" opacity="' + f1(.25 + rnd(k, 24) * .5) + '"/>';
      return '<g>' + s + '</g>';
    },
    zone(z) {
      const c = ZT[z.theme] || ZT.town;
      return '<g><path d="' + z.path + '" transform="translate(4 7)" fill="#000" opacity=".4"/><path d="' + z.path + '" fill="' + c + '" fill-opacity=".28" stroke="' + INK + '" stroke-width="6"/>' +
        '<path d="' + z.path + '" fill="none" stroke="' + GOLD + '" stroke-opacity=".5" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/></g>';
    },
    decor(theme, r, r2) {          // sparkles, a ringed planet, a little comet; about half the spots stay empty
      if (r < .16) return sparkle(0, 0, 5 + r2 * 6, r2 < .5 ? GOLD : '#fff6d6');
      if (r < .26) return '<g transform="rotate(' + f1(r2 * 40 - 20) + ')"><circle r="' + f1(7 + r2 * 4) + '" fill="' + COL[Math.floor(r2 * 4) % 4] + '" stroke="' + INK + '" stroke-width="2"/><ellipse rx="' + f1(13 + r2 * 5) + '" ry="3.4" fill="none" stroke="' + GOLD + '" stroke-width="2"/><ellipse cx="-3" cy="-3" rx="2.4" ry="1.4" fill="#fff" opacity=".6"/></g>';
      if (r < .34) return '<g transform="rotate(' + f1(r2 * 60) + ')"><path d="M0 0L-18 -4L-18 4Z" fill="#fff6c0" opacity=".5"/><circle r="3.6" fill="#fff6c0" stroke="' + INK + '" stroke-width="1.6"/></g>';
      if (r < .42) return '<circle r="' + f1(1.5 + r2 * 2) + '" fill="#fff6d6"/>';
      return '';
    },
    sign(label, w) {
      return '<rect x="2" y="4" width="' + w + '" height="30" rx="15" fill="' + INK + '" opacity=".5"/><rect width="' + w + '" height="30" rx="15" fill="' + VIO_D + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<rect x="6" y="4" width="' + (w - 12) + '" height="6" rx="3" fill="#fff" opacity=".18"/><text x="' + f1(w / 2) + '" y="20" text-anchor="middle" font-family="' + FONT + '" font-size="13" fill="' + GOLD + '">' + label + '</text>';
    },
    road: { todo: [INK, '#2a1d78', '#8a74ff'], done: [INK, GOLD_D, GOLD], widths: [18, 11, 4], dash: '2 7', cap: 'round' },
    node(state, num, e, boss) {
      const R = boss ? 36 : 32, fs = num.length > 3 ? 12 : num.length > 2 ? 14 : num.length > 1 ? 16 : 19, d = body(0, 0, R, R * .55);
      const txt = c => '<text y="' + f1(fs * .38) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs + '" fill="' + c + '" stroke="' + INK + '" stroke-width="3.5" paint-order="stroke">' + num + '</text>';
      const sh = '<path d="' + d + '" transform="translate(2 4)" fill="' + INK + '" opacity=".55"/>';
      if (state === 'locked') return sh + '<path d="' + d + '" fill="#3a3456" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' + padlock(0, -2, 1, false);
      const k = e >= 0 ? e : 0;
      return (state === 'current' ? '<circle r="' + (R + 6) + '" fill="none" stroke="' + GOLD + '" stroke-width="3" stroke-dasharray="4 4"/>' : '') + sh +
        '<path d="' + d + '" fill="' + (state === 'beaten' ? 'url(#starLm-g)' : 'url(#starLm-b)') + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<circle r="' + f1(R * .34) + '" fill="' + (state === 'beaten' ? GOLD_D : DK[k]) + '" stroke="' + INK + '" stroke-width="2.4"/>' +
        '<ellipse cx="' + f1(-R * .2) + '" cy="' + f1(-R * .5) + '" rx="' + f1(R * .14) + '" ry="' + f1(R * .07) + '" transform="rotate(-35 ' + P(-R * .2, -R * .5) + ')" fill="#fff" opacity=".55"/>' + txt('#fff');
    },
    start() { return broken(0, -4, 15, RIM, 2, 'starLm-g') + '<text y="34" text-anchor="middle" font-family="' + FONT + '" font-size="12" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="3" paint-order="stroke">START</text>'; },
    pin() {
      return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<path d="' + body(0, -5, 10, 5) + '" fill="' + VIO + '" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="-7" cy="-12" rx="4" ry="2.2" fill="#fff" opacity=".7"/>';
    },
  };

  FTH_SKINS.register({
    id: 'star', name: 'Star', ic: '⭐', blurb: 'climb the tree of stars',
    src: 'lab/star.html', hud: 'compact',
    // the comet: a round head with a star cut in it, a two-tone tail
    coin: { name: 'comet', plural: 'comets', glyph: '☄️', value: 45, pitch: 1.45,
      colors: { main: GOLD, edge: VIO_D },
      svg: FTH_SKINS.coinArt('<path d="M-1 -4L12 -12 6 -1 12 1 -1 5Z" fill="' + VIO_L + '" stroke="#1c1640" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 -2L9 -8 5 -1 9 0 0 3Z" fill="#fff6c0"/>' +
        '<circle cx="-3.2" cy="2.4" r="8.4" fill="#1c1640" opacity=".4"/><circle cx="-4" cy="1.4" r="8.4" fill="' + GOLD_D + '" stroke="#1c1640" stroke-width="1.8"/><circle cx="-4.4" cy=".8" r="7" fill="' + GOLD + '"/>' +
        '<path d="' + body(-4.2, 1.4, 4.6, 2.2) + '" fill="' + VIO + '" stroke="#1c1640" stroke-width="1" stroke-linejoin="round"/><ellipse cx="-7.6" cy="-2.6" rx="2.4" ry="1.1" transform="rotate(-35 -7.6 -2.6)" fill="#fff" opacity=".85"/>') },
    fonts: ['https://fonts.googleapis.com/css2?family=Righteous&display=swap'],
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 30% 18%, #3b2a86 0%, #1d1452 42%, #0a0626 100%)',
      '--sk-ink': '#fff6d6',
      '--sk-accent': GOLD,
      '--sk-card': 'linear-gradient(180deg, #2c2170, #150e40)',
      '--sk-card-ink': '#fff6d6',
      '--sk-hud': 'linear-gradient(180deg, rgba(44,33,112,.96), rgba(21,14,64,.94))',
      '--sk-btn': 'linear-gradient(180deg, #ffe979, #ffbf1f)',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': GOLD_D,
      '--sk-font': FONT,
      '--sk-radius': '20px',
      '--sk-chip': 'linear-gradient(#33277e, #211760)',
      '--sk-chip-ink': '#fff6d6',
      '--sk-edge': '#0b0722',
      '--sk-btn2': 'linear-gradient(180deg, #8a74ff, #4b37b8)',
      '--sk-btn2-ink': '#ffffff',
      '--sk-coin': 'linear-gradient(180deg, #ffe979, #ffbf1f)',
      '--sk-star-on': GOLD, '--sk-star-edge': GOLD_D, '--sk-star-off': '#9a8cd8', '--sk-star-off-edge': '#cfc4ff',
      '--sk-ctl': '#2c2170', '--sk-ctl-ink': '#fff6d6', '--sk-ctl-edge': '#0b0722',
    },
    // the page is the star rim, so the shell's own star rim chip would only repeat it
    css: '.rimstar{display:none!important}.coins{color:' + INK + '}.btn3d{letter-spacing:.03em}' +
      '.tl .tin{transition:transform .12s}.tl.lit .tin{transform:scale(1.14)}.tl.glow .tin{filter:drop-shadow(0 0 6px #fff6c0)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: '✦', board: 'radial-gradient(ellipse at 40% 30%, #2c2170, #0a0626 80%)', line: GOLD,
      games: ['chain', 'pop', 'hop', 'stack'], intro: 'zoom',
      // one glossy gem per element on a small violet star, the element icon on it
      tile(x, y, r, e, k) {
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin"><path d="' + body(0, 0, r * 1.02, r * .6) + '" transform="translate(' + P(r * .05, r * .09) + ')" fill="' + INK + '" opacity=".45"/>' +
          '<path d="' + body(0, 0, r * 1.02, r * .6) + '" fill="' + VIO + '" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.4, r * .07)) + '" stroke-linejoin="round"/>' + gem(e, 0, 0, r * .62) + '</g></g>';
      },
    },
    map: {
      sea: ['#33277e', '#2e2374', '#291f6a', '#241b60', '#1f1756', '#1a134c', '#151042', '#110c38', '#0d092e'],
      seaX: '#07041a', fog: '#05031a', unknown: '#4a4270',
      ramp: ['#5cff8a', '#ffe066', '#ff9a3c', '#ff5a4a'],
      grey: '#9a8cd8', route: GOLD, ink: 'rgba(255,246,214,.85)',
      cell(path, x, y, r) {      // a pentagon: one rim, five points
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5, px = x + r * 1.02 * Math.cos(a), py = y + r * 1.02 * Math.sin(a); if (i) path.lineTo(px, py); else path.moveTo(px, py); }
        path.closePath();
      },
    },
    levelMap,
    words: { win: 'Star broken open!', perfect: 'Perfect path!', par: 'Par {par}: go for ★★★', chart: 'COLOURING SPACE' },
    eggs: [
      { id: 'pi-twenty', on: 'page', note: 'twenty π swaps in a row that bring the identical board back (a closed π loop of the star)', pays: true },
      { id: 'shooting-star', on: 'title', taps: 5, run(fx) { if (!fx) return; fx.burst && (fx.burst('🌠', .25, .3), fx.burst('⭐', .5, .42), fx.burst('✨', .75, .34)); fx.sound && fx.sound('chime'); } },
      { id: 'wish', on: 'win', p: .12, run(fx) { if (!fx) return; fx.burst && fx.burst('🌠', .8, .18); fx.sound && fx.sound('whoosh'); } },
    ],
  });
})();
