// Blank Doodle: a paint-by-yourself skin. A blank sketch map on white paper; the player paints every piece with four
// tubes of glossy poster paint (bold black outlines, top-left gloss, offset shadows, splats), Fredoka lettering.
// The map starts unpainted; the player paints every piece and swaps a two-paint group when a piece shows "?".
(function () {
  const INK = '#1b1b2f';
  const PC = ['#ff5d5d', '#3fa7f5', '#ffc928', '#3ccf6e'];      // red, blue, yellow, green (blank.html's paints)
  const PD = ['#c93636', '#1f74b8', '#c9900a', '#1f8f45'];      // their shades
  const PL = ['#ffb3a8', '#a9d8fb', '#ffe58a', '#a6e8bb'];      // pale tints
  const F = "Fredoka,'Baloo 2','Arial Rounded MT Bold','Arial Black',system-ui,sans-serif";
  const f1 = n => Math.round(n * 10) / 10;
  const rnd = (s, k) => { const x = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

  // polygon points of a hexagon (rot 0: flat top; rot 30: pointy top)
  function hexPts(cx, cy, r, rot) {
    const o = [];
    for (let i = 0; i < 6; i++) { const a = (rot + 60 * i) * Math.PI / 180; o.push(f1(cx + r * Math.cos(a)) + ',' + f1(cy + r * Math.sin(a))); }
    return o.join(' ');
  }
  // neighbour centre of a hexagon in direction k (0..5) at spacing d; rot as above
  const nb = (cx, cy, d, rot, k) => { const a = (rot + 30 + 60 * k) * Math.PI / 180; return [cx + d * Math.cos(a), cy + d * Math.sin(a)]; };

  // a paint splat: n round lobes plus a few flung droplets (deterministic in seed)
  function splatPath(cx, cy, R, n, seed, nsat, soft) {
    const P = (a, r) => f1(cx + r * Math.cos(a)) + ' ' + f1(cy + r * Math.sin(a)), st = Math.PI / n, ins = [];
    for (let i = 0; i < n; i++) ins.push(R * ((soft ? 0.84 : 0.62) + rnd(seed, i + 40) * 0.1));
    let d = 'M' + P(-st, ins[n - 1]);
    for (let i = 0; i < n; i++) {
      const a = i * 2 * st, ro = R * (0.86 + rnd(seed, i + 20) * (soft ? 0.14 : 0.32)) * (soft ? 1.12 : 1.22);
      d += 'C' + P(a - st * 0.55, ro) + ' ' + P(a + st * 0.55, ro) + ' ' + P(a + st, ins[i]);
    }
    const sats = [];
    for (let k = 0; k < (nsat || 0); k++) { const a = rnd(seed, k + 70) * 6.283, r = R * (1.32 + rnd(seed, k + 80) * 0.36);
      sats.push([cx + r * Math.cos(a), cy + r * Math.sin(a), R * (0.08 + rnd(seed, k + 90) * 0.09)]); }
    return { d: d + 'Z', sats };
  }
  // a splat drawn the Islands way: offset shadow, fill, ink outline, top-left gloss
  function splat(cx, cy, R, fill, seed, o) {
    o = o || {}; const S = splatPath(cx, cy, R, o.n || 9, seed, o.sat || 0, o.soft), sw = o.sw === 0 ? 0 : o.sw || Math.max(1.6, R * 0.1), dx = f1(R * 0.09 + 1), dy = f1(R * 0.13 + 1.5);
    const sh = o.noShadow ? '' : '<g transform="translate(' + dx + ' ' + dy + ')" fill="' + INK + '" opacity=".3"><path d="' + S.d + '"/>' + S.sats.map(c => '<circle cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(c[2]) + '"/>').join('') + '</g>';
    return sh + '<path d="' + S.d + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + f1(sw) + '" stroke-linejoin="round"' : '') + (o.op ? ' opacity="' + o.op + '"' : '') + '/>' +
      S.sats.map(c => '<circle cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(c[2]) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + f1(sw * 0.6) + '"' : '') + (o.op ? ' opacity="' + o.op + '"' : '') + '/>').join('') +
      (o.noGloss ? '' : '<ellipse cx="' + f1(cx - R * 0.32) + '" cy="' + f1(cy - R * 0.36) + '" rx="' + f1(R * 0.24) + '" ry="' + f1(R * 0.13) + '" transform="rotate(-35 ' + f1(cx - R * 0.32) + ' ' + f1(cy - R * 0.36) + ')" fill="#fff" opacity=".7"/>');
  }
  // one painted piece: c = paint 0..3 or -1 for a blank (paper) piece
  function piece(cx, cy, r, c, rot, cls) {
    const p = hexPts(cx, cy, r * 0.95, rot || 0), k = cls ? ' class="' + cls + '"' : '';
    const sh = '<polygon points="' + p + '" transform="translate(' + f1(r * 0.08 + 1) + ' ' + f1(r * 0.11 + 1.5) + ')" fill="' + INK + '" opacity="' + (c < 0 ? '.14' : '.3') + '"/>';
    if (c < 0) return '<g' + k + '>' + sh + '<polygon points="' + p + '" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/></g>';
    const hl = hexPts(cx - r * 0.12, cy - r * 0.14, r * 0.58, rot || 0);
    return '<g' + k + '>' + sh + '<polygon points="' + p + '" fill="' + PC[c] + '"/>' +
      '<polygon points="' + hl + '" fill="#fff" opacity=".2"/>' +
      '<ellipse cx="' + f1(cx - r * 0.34) + '" cy="' + f1(cy - r * 0.4) + '" rx="' + f1(r * 0.2) + '" ry="' + f1(r * 0.1) + '" transform="rotate(-30 ' + f1(cx - r * 0.34) + ' ' + f1(cy - r * 0.4) + ')" fill="#fff" opacity=".75"/>' +
      '<polygon points="' + p + '" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/></g>';
  }
  // a paintbrush, tip at (x, y), handle along +y before rotation; c = the paint on its tip
  function brush(x, y, c, rot, s) {
    const hd = 'M-5 30L-3.6 70Q0 75 3.6 70L5 30Z', fe = 'M-7 17H7V31H-7Z', br = 'M0 -2C-5 4 -8 11 -7 18L7 18C8 11 5 4 0 -2Z';
    return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + rot + ') scale(' + (s || 1) + ')">' +
      '<path d="' + hd + br + fe + '" transform="translate(3 2)" fill="' + INK + '" opacity=".3"/>' +
      '<path d="' + hd + '" fill="#ff9a3c" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M-1.8 35L-1 64" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="' + br + '" fill="#f3e3c3" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M0 -2C-5 4 -7.4 9 -7.3 12L7.3 12C7.4 9 5 4 0 -2Z" fill="' + PC[c] + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<rect x="-7" y="17" width="14" height="14" rx="2.5" fill="#d9deea" stroke="' + INK + '" stroke-width="2.6"/><path d="M-7 23H7" stroke="' + INK + '" stroke-width="1.6"/>' +
      '<ellipse cx="-2.4" cy="5" rx="1.4" ry="2.6" fill="#fff" opacity=".75"/></g>';
  }
  // the ghost finger (tip at x, y) that teaches a tap
  const HAND = 'M10 24V9a5 5 0 0 1 10 0V21a4.5 4.5 0 0 1 8 1.5a4.5 4.5 0 0 1 8 2.5a4 4 0 0 1 7 3V38c0 7-5 11-12 11h-5c-5 0-8-2.5-11-6.5l-7-9a4.2 4.2 0 0 1 6.5-5.2Z';
  const finger = (x, y, cls) => '<circle class="rp" cx="' + x + '" cy="' + y + '" r="12" fill="none" stroke="#fff" stroke-width="4"/>' +
    '<g class="' + (cls || 'fg') + '"><g transform="translate(' + f1(x - 12) + ' ' + f1(y - 3) + ') scale(.8)">' +
    '<path d="' + HAND + '" transform="translate(3 4)" fill="' + INK + '" opacity=".3"/>' +
    '<path d="' + HAND + '" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M13 10V20" stroke="#d6dbe8" stroke-width="3" stroke-linecap="round"/></g></g>';
  const FCSS = '.fg{animation:fgt 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:20% 10%}' +
    '@keyframes fgt{0%,12%{transform:translate(12px,16px);opacity:0}28%{transform:translate(4px,6px);opacity:.96}38%{transform:translate(0,0) scale(.92)}50%{transform:translate(3px,4px)}82%{opacity:.96}100%{transform:translate(12px,16px);opacity:0}}' +
    '.rp{transform-box:fill-box;transform-origin:center;opacity:0;animation:rpp 2.4s ease-out infinite}@keyframes rpp{0%,36%{transform:scale(.2);opacity:0}40%{opacity:.95}70%,100%{transform:scale(1.7);opacity:0}}';
  const txt = (x, y, s, size, fill, extra) =>
    '<text x="' + x + '" y="' + y + '" font-family="' + F + '" font-weight="700" font-size="' + size + '" text-anchor="middle" fill="' + (fill || INK) + '"' + (extra || '') + '>' + s + '</text>';
  // wrap an intro / title svg: dotted paper, animation css wrapped for reduced motion
  function svg(body, css) {
    return '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' +
      (css ? '<style>@media (prefers-reduced-motion: no-preference){' + css + '}</style>' : '') +
      '<rect x="6" y="6" width="288" height="238" rx="18" fill="#fffefa" stroke="' + INK + '" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round" opacity=".55"/>' +
      body + '</svg>';
  }
  // four paint dabs in a row (the "palette"); sel = the picked one (it glows)
  const dabRow = (y, s, sel) => [0, 1, 2, 3].map(i => (i === sel ? '<circle class="dsel" cx="' + (96 + i * 36) + '" cy="' + y + '" r="' + f1(16 * s) + '" fill="#fff59d" stroke="#ffb800" stroke-width="3"/>' : '') +
    splat(96 + i * 36, y, 11 * s, PC[i], i * 3 + 1, { n: 6, sw: 2.4, soft: true })).join('');
  const ok = (x, y, good) => '<circle cx="' + (x + 2) + '" cy="' + (y + 3) + '" r="15" fill="' + INK + '" opacity=".3"/><circle cx="' + x + '" cy="' + y + '" r="15" fill="' + (good ? '#3ccf6e' : '#ff5d5d') + '" stroke="' + INK + '" stroke-width="3"/>' +
    (good ? '<path d="M' + (x - 7) + ' ' + y + 'l5 5 9 -10" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<path d="M' + (x - 6) + ' ' + (y - 6) + 'l12 12m0 -12l-12 12" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>');

  // ---------- title: a rim of four paints round a blank piece, a brush about to paint it ----------
  const titleSvg = (() => {
    const cx = 146, cy = 132, r = 34, d = r * 1.75, col = [0, 1, 2, 3, 1], o = [];
    o.push(splat(52, 60, 20, PL[0], 3, { n: 8, sat: 3, noShadow: true, noGloss: true, sw: 2 }), splat(250, 206, 22, PL[1], 8, { n: 9, sat: 3, noShadow: true, noGloss: true, sw: 2 }), splat(44, 200, 14, PL[2], 5, { n: 7, sat: 2, noShadow: true, noGloss: true, sw: 2 }));
    col.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece(p[0], p[1], r, c, 0, 'tt')); });
    const p5 = nb(cx, cy, d, 0, 5); o.push('<polygon points="' + hexPts(p5[0], p5[1], r * 0.95, 0) + '" fill="none" stroke="' + INK + '" stroke-width="2.5" stroke-dasharray="3 7" stroke-linecap="round" opacity=".5"/>');
    o.push(piece(cx, cy, r, -1, 0));
    o.push(txt(cx, cy + 13, '?', 38, '#ff9f1c', ' stroke="' + INK + '" stroke-width="5" paint-order="stroke" stroke-linejoin="round" class="tq"'));
    o.push('<g class="tp"><g class="td">' + splat(184, 98, 5, PC[0], 2, { n: 5, noGloss: true, sw: 1.8 }) + '</g>' + brush(188, 90, 0, -135, 1.1) + '</g>');
    return svg(o.join(''),
      '.tq{animation:tqw 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes tqw{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg) scale(1.1)}}' +
      '.tp{animation:tpb 2.4s ease-in-out infinite}@keyframes tpb{0%,100%{transform:translate(0,0)}50%{transform:translate(-8px,10px)}}' +
      '.td{animation:tdd 2.4s ease-in infinite}@keyframes tdd{0%,40%{transform:translate(0,0);opacity:0}50%{opacity:1}85%{transform:translate(-22px,26px);opacity:1}100%{transform:translate(-24px,30px);opacity:0}}');
  })();

  // ---------- intro 1: paint every piece ----------
  const i1 = (() => {
    const cx = 150, cy = 106, r = 30, d = r * 1.75, o = [], ring = [0, 1, -1, 3, 2, -1];
    o.push(piece(cx, cy, r, -1, 0));
    ring.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece(p[0], p[1], r, c, 0)); });
    const p5 = nb(cx, cy, d, 0, 5);
    o.push(piece(p5[0], p5[1], r, 1, 0, 'a5'));
    o.push(dabRow(222, 1, 1));
    o.push(finger(f1(p5[0]), f1(p5[1])));
    return svg(o.join(''), FCSS +
      '.a5{transform-box:fill-box;transform-origin:center;animation:a5f 2.4s ease-out infinite}@keyframes a5f{0%,38%{opacity:0;transform:scale(.4)}48%{opacity:1;transform:scale(1.14)}58%,88%{opacity:1;transform:scale(1)}100%{opacity:0}}' +
      '.dsel{animation:dsp 1.2s ease-in-out infinite}@keyframes dsp{50%{opacity:.45}}');
  })();

  // ---------- intro 2: neighbours must differ ----------
  const i2 = (() => {
    const r = 33, d = r * 1.75, o = [];
    const row = (y, a, b, good) => {
      const x1 = 128 - d / 2, x2 = 128 + d / 2;
      o.push('<g' + (good ? '' : ' class="bw"') + '>' + piece(x1, y, r, a, 30) + piece(x2, y, r, b, 30) +
        (good ? '' : '<line class="bc" x1="128" y1="' + f1(y - r / 2 * 0.95) + '" x2="128" y2="' + f1(y + r / 2 * 0.95) + '" stroke="#e8112d" stroke-width="7" stroke-linecap="round"/>') + '</g>');
      o.push(ok(240, y, good));
    };
    row(74, 0, 0, false); row(172, 0, 1, true);
    return svg(o.join(''), '.bc{animation:bcp 1s ease-in-out infinite}@keyframes bcp{50%{opacity:.3}}' +
      '.bw{animation:bww 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes bww{0%,60%,100%{transform:rotate(0)}68%{transform:rotate(-3deg)}76%{transform:rotate(3deg)}84%{transform:rotate(-2deg)}}');
  })();

  // ---------- intro 3: the stuck "?" ----------
  const i3 = (() => {
    const cx = 150, cy = 108, r = 30, d = r * 1.75, o = [], ring = [0, 1, 2, 3, 0];
    ring.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece(p[0], p[1], r, c, 0)); });
    o.push(piece(cx, cy, r, -1, 0));
    o.push(txt(cx, cy + 13, '?', 38, '#ff9f1c', ' stroke="' + INK + '" stroke-width="5" paint-order="stroke" stroke-linejoin="round" class="cq"'));
    o.push('<g opacity=".45">' + dabRow(222, 0.85) + '</g>');
    return svg(o.join(''), '.cq{animation:cqw 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes cqw{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg) scale(1.12)}}');
  })();

  // ---------- intro 4: swap a two-paint group ----------
  const i4 = (() => {
    const r = 17, d = r * 1.75, o = [];
    let fx = 0, fy = 0;
    const panel = (cx, cy, after) => {
      const ring = after ? [3, 1, 2, 3, 1] : [0, 1, 2, 3, 1];     // ring pieces k0..k4
      const P = nb(cx, cy, 2 * d, 0, 0), k0 = nb(cx, cy, d, 0, 0);
      if (!after) { const mx = (k0[0] + P[0]) / 2, my = (k0[1] + P[1]) / 2;
        o.push('<ellipse class="d4g" cx="' + f1(mx) + '" cy="' + f1(my) + '" rx="' + f1(d * 1.25) + '" ry="' + f1(r * 1.3) + '" transform="rotate(30 ' + f1(mx) + ' ' + f1(my) + ')" fill="#fff59d" stroke="#ffb800" stroke-width="3.5" stroke-dasharray="7 5" stroke-linecap="round"/>');
        fx = k0[0]; fy = k0[1]; }
      ring.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece(p[0], p[1], r, c, 0)); });
      o.push(piece(P[0], P[1], r, after ? 0 : 3, 0));
      if (after) o.push(piece(cx, cy, r, 0, 0, 'd4p'));
      else o.push(piece(cx, cy, r, -1, 0) + txt(cx, cy + 7, '?', 20, '#ff9f1c', ' stroke="' + INK + '" stroke-width="4" paint-order="stroke"'));
    };
    panel(70, 112, false); panel(226, 112, true);
    o.push('<path d="M130 110h34" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/><path d="M152 98l14 12-14 12" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M130 110h34" stroke="#ffc928" stroke-width="6" stroke-linecap="round"/><path d="M152 98l14 12-14 12" fill="none" stroke="#ffc928" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>');
    o.push(dabRow(222, 0.85, 3));
    o.push(finger(f1(fx), f1(fy)));
    return svg(o.join(''), FCSS + '.d4g{animation:d4a 1.2s ease-in-out infinite}@keyframes d4a{50%{stroke-dashoffset:-12;opacity:.6}}' +
      '.d4p{animation:d4b 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes d4b{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}');
  })();

  // ---------- intro 5: wipe and finish ----------
  const i5 = (() => {
    const cx = 150, cy = 140, r = 28, d = r * 1.75, o = [], ring = [1, 2, 1, 2, 1, 3];
    o.push(piece(cx, cy, r, 0, 0));
    ring.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(k === 1 ? piece(p[0], p[1], r, -1, 0) + piece(p[0], p[1], r, c, 0, 'fw') : piece(p[0], p[1], r, c, 0)); });
    const p1 = nb(cx, cy, d, 0, 1);
    o.push(splat(242, 44, 14, PC[3], 4, { n: 8, sat: 3 }), splat(58, 50, 11, PC[1], 6, { n: 7, sat: 2 }));
    o.push('<g transform="translate(150 38) rotate(-6)"><rect x="-70" y="-19" width="144" height="44" rx="14" fill="' + INK + '" opacity=".3"/><rect x="-74" y="-23" width="148" height="44" rx="14" fill="#fff59d" stroke="' + INK + '" stroke-width="3.2"/>' +
      txt(0, 9, 'Coloured!', 28, '#ff4f9a', ' stroke="' + INK + '" stroke-width="5" paint-order="stroke" stroke-linejoin="round"') + '</g>');
    o.push(finger(f1(p1[0]), f1(p1[1])));
    return svg(o.join(''), FCSS + '.fw{animation:fww 2.4s ease-in-out infinite}@keyframes fww{0%,38%{opacity:1}46%,80%{opacity:0}92%,100%{opacity:1}}');
  })();

  // ---------- bonus gem: one paint shape per element (splat, drop, dollop, swatch) ----------
  function gemPath(e, R) {
    if (e === 0) return splatPath(0, 0, R * 0.86, 8, 11).d;
    if (e === 1) return 'M0 ' + f1(-R * 1.04) + 'C' + f1(R * 0.5) + ' ' + f1(-R * 0.5) + ' ' + f1(R * 0.8) + ' ' + f1(-R * 0.1) + ' ' + f1(R * 0.8) + ' ' + f1(R * 0.26) +
      'A' + f1(R * 0.8) + ' ' + f1(R * 0.8) + ' 0 0 1 ' + f1(-R * 0.8) + ' ' + f1(R * 0.26) + 'C' + f1(-R * 0.8) + ' ' + f1(-R * 0.1) + ' ' + f1(-R * 0.5) + ' ' + f1(-R * 0.5) + ' 0 ' + f1(-R * 1.04) + 'Z';
    if (e === 2) { const q = v => f1(v * R);
      return 'M' + q(-0.92) + ' ' + q(0.62) + 'C' + q(-1.12) + ' ' + q(0.1) + ' ' + q(-0.82) + ' ' + q(-0.3) + ' ' + q(-0.46) + ' ' + q(-0.2) + 'C' + q(-0.56) + ' ' + q(-0.86) + ' ' + q(0.1) + ' ' + q(-1.06) + ' ' + q(0.34) + ' ' + q(-0.6) +
        'C' + q(0.78) + ' ' + q(-0.66) + ' ' + q(1.1) + ' ' + q(-0.22) + ' ' + q(0.86) + ' ' + q(0.06) + 'C' + q(1.16) + ' ' + q(0.26) + ' ' + q(1.06) + ' ' + q(0.72) + ' ' + q(0.78) + ' ' + q(0.74) + 'Z'; }
    const s = R * 0.72, k = R * 0.26;
    return 'M0 ' + f1(-s - k) + 'Q' + f1(k * 0.4) + ' ' + f1(-s - k * 0.6) + ' ' + f1(k) + ' ' + f1(-s) + 'L' + f1(s) + ' ' + f1(-k) + 'Q' + f1(s + k * 0.6) + ' ' + f1(-k * 0.4) + ' ' + f1(s + k) + ' 0' +
      'Q' + f1(s + k * 0.6) + ' ' + f1(k * 0.4) + ' ' + f1(s) + ' ' + f1(k) + 'L' + f1(k) + ' ' + f1(s) + 'Q' + f1(k * 0.4) + ' ' + f1(s + k * 0.6) + ' 0 ' + f1(s + k) +
      'Q' + f1(-k * 0.4) + ' ' + f1(s + k * 0.6) + ' ' + f1(-k) + ' ' + f1(s) + 'L' + f1(-s) + ' ' + f1(k) + 'Q' + f1(-s - k * 0.6) + ' ' + f1(k * 0.4) + ' ' + f1(-s - k) + ' 0' +
      'Q' + f1(-s - k * 0.6) + ' ' + f1(-k * 0.4) + ' ' + f1(-s) + ' ' + f1(-k) + 'L' + f1(-k) + ' ' + f1(-s) + 'Q' + f1(-k * 0.4) + ' ' + f1(-s - k * 0.6) + ' 0 ' + f1(-s - k) + 'Z';
  }
  function tile(x, y, r, e, k) {
    const R = r * 0.94, d = gemPath(e, R), sw = f1(Math.max(2, r * 0.11)), hx = f1(-R * 0.3), hy = f1(-R * 0.34);
    return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + f1(x) + ' ' + f1(y) + ')"><g class="tin">' +
      '<circle class="halo" r="' + f1(R * 1.2) + '" fill="#ffd84a" opacity="0"/>' +
      '<path d="' + d + '" transform="translate(' + f1(R * 0.08) + ' ' + f1(R * 0.12) + ')" fill="' + INK + '" opacity=".35"/>' +
      '<path class="hx" d="' + d + '" fill="' + PC[e] + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="' + d + '" transform="translate(' + f1(-R * 0.1) + ' ' + f1(-R * 0.12) + ') scale(.62)" fill="#fff" opacity=".18"/>' +
      '<ellipse class="gr" cx="' + hx + '" cy="' + hy + '" rx="' + f1(R * 0.22) + '" ry="' + f1(R * 0.12) + '" transform="rotate(-35 ' + hx + ' ' + hy + ')" fill="#fff" opacity=".8"/>' +
      '<circle cx="' + f1(R * 0.36) + '" cy="' + f1(R * 0.34) + '" r="' + f1(R * 0.09) + '" fill="' + PD[e] + '" opacity=".55"/>' +
      '</g></g>';
  }

  // ---------- logo, icon, card ----------
  const LOGO_BODY = (p) => {
    const T = (x, y, size, body, fill, extra) => '<text x="' + x + '" y="' + y + '" font-family="' + F + '" font-weight="700" font-size="' + size + '" text-anchor="middle" letter-spacing="1"' + (extra || '') + ' fill="' + fill + '">' + body + '</text>';
    const doodle = 'Doodle'.split('').map((ch, i) => '<tspan fill="' + PC[[0, 1, 2, 3, 0, 1][i]] + '">' + ch + '</tspan>').join('');
    const line = (x, y, size, s, col) =>
      T(x + 3, y + 4, size, s, INK, ' stroke="' + INK + '" stroke-width="8" stroke-linejoin="round"') +
      T(x, y, size, col || s, '#fff', ' stroke="' + INK + '" stroke-width="7" stroke-linejoin="round" paint-order="stroke"') +
      T(x, y, size, s, 'url(#' + p + 'hl)');
    return '<defs><linearGradient id="' + p + 'hl" x1="0" y1="0" x2="0" y2="1"><stop offset=".05" stop-color="#fff" stop-opacity=".6"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      splat(206, 24, 11, '#ff4f9a', 9, { n: 7, sat: 3, sw: 2.2 }) + splat(30, 58, 9, PC[2], 12, { n: 7, sat: 2, sw: 2.2 }) +
      '<g transform="rotate(-4 120 40)">' + line(112, 33, 31, 'Blank') + line(124, 72, 39, 'Doodle', doodle) + '</g>';
  };
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + LOGO_BODY('blank-lg-') + '</svg>';

  const icon = (() => {
    const p = 'blank-ic-';
    const pal = 'M20 68C14 42 42 22 70 26C96 30 108 50 100 64C95 72 84 67 80 74C76 82 90 88 83 96C74 105 50 104 36 96C26 90 22 80 20 68Z';
    const blobs = [[36, 60, 0], [49, 41, 2], [71, 37, 3], [89, 52, 1]].map(([x, y, c], i) => splat(x, y, 10.5, PC[c], i * 5 + 2, { n: 6, sw: 2.8, soft: true })).join('');
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="' + p + 'bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb3d6"/><stop offset=".5" stop-color="#ff4f9a"/><stop offset="1" stop-color="#9b3cf0"/></linearGradient>' +
      '<radialGradient id="' + p + 'gl" cx=".25" cy=".18" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'pl" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#fffef8"/><stop offset="1" stop-color="#f2d9a8"/></linearGradient>' +
      '<clipPath id="' + p + 'cl"><rect width="120" height="120" rx="26"/></clipPath></defs>' +
      '<g clip-path="url(#' + p + 'cl)"><rect width="120" height="120" fill="url(#' + p + 'bg)"/><rect width="120" height="120" fill="url(#' + p + 'gl)"/>' +
      splat(104, 14, 16, '#ffd84a', 21, { n: 8, sat: 3, noShadow: true, noGloss: true, sw: 0, op: '.55' }) +
      splat(10, 112, 18, '#3fa7f5', 23, { n: 9, sat: 2, noShadow: true, noGloss: true, sw: 0, op: '.45' }) +
      '<path d="' + pal + '" transform="translate(4 6)" fill="' + INK + '" opacity=".4"/>' +
      '<path d="' + pal + '" fill="url(#' + p + 'pl)" stroke="' + INK + '" stroke-width="3.6" stroke-linejoin="round"/>' +
      '<path d="M27 58C29 44 44 32 62 31" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>' +
      '<ellipse cx="46" cy="83" rx="7.5" ry="6" fill="#d23f86" stroke="' + INK + '" stroke-width="3"/><path d="M41 81a5.5 4.5 0 0 1 8 -2.4" stroke="' + INK + '" stroke-opacity=".35" stroke-width="2.4" fill="none"/>' +
      blobs + brush(64, 70, 1, -45, 1.05) +
      splat(54, 66, 4.6, PC[1], 31, { n: 6, sw: 1.8, noGloss: true }) + '<circle cx="46" cy="60" r="2.4" fill="' + PC[1] + '" stroke="' + INK + '" stroke-width="1.6"/>' +
      '</g><rect x="1.5" y="1.5" width="117" height="117" rx="25" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3"/></svg>';
  })();

  const card = (() => {
    const p = 'blank-cd-', R = 25, s3 = Math.sqrt(3), o = [];
    const blank = { '0,0': 1, '1,-2': 1, '-2,1': 1 }, hot = ['1,0', '1,1'];
    let cells = [];
    for (let q = -2; q <= 2; q++) for (let r = Math.max(-2, -q - 2); r <= Math.min(2, -q + 2); r++) cells.push([q, r]);
    const pos = (q, r) => [120 + R * 1.5 * q, 112 + R * s3 * (r + q / 2)];
    cells.forEach(([q, r]) => { const [x, y] = pos(q, r), c = blank[q + ',' + r] ? -1 : (((q + 2 * r) % 4) + 4) % 4; o.push(piece(x, y, R, c, 0)); });
    // a two-paint group glowing, about to swap
    hot.forEach(k => { const [q, r] = k.split(',').map(Number), [x, y] = pos(q, r);
      o.push('<polygon points="' + hexPts(x, y, R * 0.95, 0) + '" fill="none" stroke="#ffd84a" stroke-width="7" stroke-linejoin="round"/><polygon points="' + hexPts(x, y, R * 0.8, 0) + '" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="5 5" stroke-linecap="round"/>'); });
    const [hx, hy] = pos(0, 0);
    o.push(txt(f1(hx), f1(hy + 11), '?', 30, '#ff9f1c', ' stroke="' + INK + '" stroke-width="5" paint-order="stroke" stroke-linejoin="round"'));
    // the brush painting a blank piece, with a splash
    const [bx, by] = pos(-2, 1);
    o.push(splat(bx, by, 17, PC[3], 41, { n: 9, sat: 4 }), brush(bx + 6, by - 6, 3, 40, 1.15));
    o.push(splat(206, 26, 9, PC[0], 44, { n: 7, sat: 2 }));
    return '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="' + p + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset=".62" stop-color="#fff3df"/><stop offset="1" stop-color="#ffd3e8"/></linearGradient>' +
      '<pattern id="' + p + 'dt" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.2" fill="#d5cfe6"/></pattern>' +
      '<linearGradient id="' + p + 'sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff4f9a"/><stop offset="1" stop-color="#ff8fc0"/></linearGradient>' +
      '<clipPath id="' + p + 'cl"><rect width="240" height="320" rx="18"/></clipPath></defs>' +
      '<g clip-path="url(#' + p + 'cl)"><rect width="240" height="320" fill="url(#' + p + 'bg)"/><rect width="240" height="320" fill="url(#' + p + 'dt)"/>' +
      o.join('') +
      '<path d="M-10 236C40 222 90 240 130 230C175 220 210 232 250 222V330H-10Z" transform="translate(0 5)" fill="' + INK + '" opacity=".3"/>' +
      '<path d="M-10 236C40 222 90 240 130 230C175 220 210 232 250 222V330H-10Z" fill="url(#' + p + 'sw)" stroke="' + INK + '" stroke-width="3.5"/>' +
      '<path d="M14 246C50 236 80 246 110 241" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      '<g transform="translate(0 236)">' + LOGO_BODY('blank-cdlg-') + '</g>' +
      '</g></svg>';
  })();


  // ---------- map cell: a rounded hexagon ----------
  function cell(path, x, y, r) {
    const v = [], k = 0.24;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; v.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
    const mix = (a, b) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const s = mix(v[0], v[5]);
    path.moveTo(s[0], s[1]);
    for (let i = 0; i < 6; i++) {
      const b = mix(v[i], v[(i + 1) % 6]), n = mix(v[(i + 1) % 6], v[i]);
      path.quadraticCurveTo(v[i][0], v[i][1], b[0], b[1]);
      path.lineTo(n[0], n[1]);
    }
    path.closePath();
  }

  // ---------- level map: a colouring-book world ----------
  const levelMap = (function () {
    const S = ' stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
    const SB = ' stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
    // crayon paints: a colour wash with tiny pale strokes (grain), as patterns
    const CR = { R: '#ff5d5d', B: '#3fa7f5', Y: '#ffc928', G: '#3ccf6e', O: '#ff9a3c', P: '#ff8fc0', N: '#c98a4b', V: '#9a7cff', C: '#4fd6d0', W: '#c9ccd6', S: '#f1dca0' };
    let defs = '<pattern id="blankDots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1.3" fill="#c9cbe0"/></pattern>';
    Object.keys(CR).forEach(k => {
      defs += '<pattern id="blankC' + k + '" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="' + CR[k] + '"/>' +
        '<path d="M0 3L4 0M3 9L9 3M0 9L2 7M6 9L9 6M5 2L8 0" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".5"/>' +
        '<path d="M1 5L3 3M6 6L8 4" stroke="#000" stroke-width=".7" stroke-linecap="round" opacity=".08"/></pattern>';
    });
    const fillC = (k, r2) => (r2 !== undefined && r2 < 0.16) ? '#fff' : 'url(#blankC' + k + ')';   // a few shapes stay uncoloured
    const pa = (d, fill, ex) => '<path d="' + d + '" fill="' + fill + '"' + S + (ex || '') + '/>';
    const ci = (x, y, r, fill) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + S + '/>';
    const pick = (arr, r) => arr[Math.min(arr.length - 1, Math.floor(r * arr.length))];
    const star5 = (cx, cy, R, fill, sw) => { let p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * 0.45 : R; p.push(f1(cx + q * Math.cos(a)) + ',' + f1(cy + q * Math.sin(a))); } return '<polygon points="' + p.join(' ') + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + (sw || 1.8) + '" stroke-linejoin="round"/>'; };

    const D = {
      wave: (r, r2) => '<path d="M-16 4Q-8 -8 0 2T16 2" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><path d="M-16 4Q-8 -8 0 2T16 2" fill="none" stroke="#a9d8fb" stroke-width="2.6" stroke-linecap="round"/><path d="M-9 -9Q-3 -16 3 -9" fill="none"' + S + '/>',
      ball: (r, r2) => '<circle r="11" fill="#fff"' + S + '/><path d="M0 -11V11M-9 -6Q0 0 -9 6M9 -6Q0 0 9 6" fill="none" stroke="' + INK + '" stroke-width="2"/><path d="M0 -11A11 11 0 0 1 9.5 -5.5Q0 0 0 0Z" fill="url(#blankCR)"/><path d="M0 11A11 11 0 0 1 -9.5 5.5Q0 0 0 0Z" fill="url(#blankCB)"/><circle r="11" fill="none"' + S + '/>',
      shell: (r, r2) => pa('M-11 7Q-12 -9 0 -11Q12 -9 11 7Z', fillC('P', r2)) + '<path d="M0 7V-8M-5 7L-6 -5M5 7L6 -5" stroke="' + INK + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
      starfish: (r, r2) => star5(0, 0, 13, fillC('O', r2), 2.6),
      duck: (r, r2) => pa('M-13 3Q-12 12 0 12Q13 12 14 0Q8 4 3 -2Q-2 -10 -8 -3Q-12 -1 -13 3Z', fillC('Y', r2)) + ci(-4, -8, 6, fillC('Y', r2)) + pa('M-10 -9L-17 -7L-10 -5Z', fillC('O')) + '<circle cx="-5" cy="-9.5" r="1.4" fill="' + INK + '"/>',
      palm: (r, r2) => pa('M-2 14Q4 -2 -1 -20Q3 -2 3 14Z', fillC('N')) + [-150, -100, -45, 10, 160].map(a => '<path transform="translate(0 -20) rotate(' + a + ')" d="M0 0Q8 -14 22 -6Q10 -6 0 0Z" fill="' + fillC('G', r2) + '"' + S + '/>').join('') + ci(-3, -17, 3, fillC('N')) + ci(3, -16, 3, fillC('N')),
      castle: (r, r2) => pa('M-15 12V-2H-11V-6H-7V-2H-3V-6H3V-2H7V-6H11V-2H15V12Z', fillC('S', r2)) + pa('M-4 12V4Q0 -1 4 4V12Z', '#fff') + '<path d="M0 -6V-18" stroke="' + INK + '" stroke-width="2"/>' + pa('M0 -18L10 -15L0 -12Z', fillC('R')),
      umbrella: (r, r2) => '<path d="M0 -6V14" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' + pa('M-18 -4Q-16 -22 0 -22Q16 -22 18 -4Q9 -9 0 -4Q-9 -9 -18 -4Z', fillC(pick(['R', 'B', 'P'], r2 * 1.3 % 1)))
        + '<path d="M0 -22Q-4 -12 0 -4Q4 -12 0 -22" fill="none" stroke="' + INK + '" stroke-width="2"/>',
      house: (r, r2) => { const w = pick(['R', 'B', 'Y', 'V', 'G'], r); return pa('M-18 12V-6H0V12Z', fillC('S', r2)) + pa('M0 12V-10H18V12Z', fillC(pick(['W', 'P', 'C'], r2)))
        + pa('M-21 -5L-9 -19L3 -5Z', fillC(w)) + pa('M-3 -9L9 -22L21 -9Z', fillC(w === 'R' ? 'B' : 'R')) + '<rect x="-12" y="1" width="6" height="11" fill="#fff"' + S + '/><rect x="7" y="-3" width="6" height="6" fill="#fff"' + S + '/>'; },
      tree: (r, r2) => pa('M-3 14V-1H3V14Z', fillC('N')) + pa('M-14 -2Q-18 -14 -8 -17Q-5 -26 5 -22Q16 -20 13 -8Q14 -1 4 -1H-8Q-12 -1 -14 -2Z', fillC('G', r2)) + '<path d="M-6 -9Q-3 -13 1 -10" fill="none" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"/>',
      flowers: (r, r2) => [[-10, 4, 'P'], [0, -4, 'Y'], [10, 5, 'R']].map(([x, y, c]) => '<path d="M' + x + ' ' + (y + 3) + 'V' + (y + 10) + '" stroke="' + INK + '" stroke-width="2"/>' + [0, 72, 144, 216, 288].map(a => '<circle cx="' + f1(x + 4 * Math.cos(a * Math.PI / 180)) + '" cy="' + f1(y + 4 * Math.sin(a * Math.PI / 180)) + '" r="3.4" fill="url(#blankC' + c + ')" stroke="' + INK + '" stroke-width="1.6"/>').join('') + '<circle cx="' + x + '" cy="' + y + '" r="2" fill="#fff" stroke="' + INK + '" stroke-width="1.4"/>').join(''),
      fence: () => '<path d="M-18 4H18M-18 -4H18" stroke="' + INK + '" stroke-width="2.4" fill="none"/>' + [-14, -5, 5, 14].map(x => pa('M' + (x - 3) + ' 10V-6L' + x + ' -10L' + (x + 3) + ' -6V10Z', '#fff')).join(''),
      boat: (r, r2) => pa('M-17 2H17L11 12H-11Z', fillC(pick(['R', 'B', 'Y'], r2))) + '<path d="M0 2V-18" stroke="' + INK + '" stroke-width="2.6"/>' + pa('M2 -17L15 -3H2Z', fillC('W', r2 * 3 % 1)) + pa('M-2 -14L-12 -3H-2Z', '#fff') + '<path d="M-22 16Q-14 11 -6 16T10 16T22 16" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>',
      crate: (r, r2) => pa('M-11 -11H11V11H-11Z', fillC('N', r2)) + '<path d="M-11 -11L11 11M11 -11L-11 11" stroke="' + INK + '" stroke-width="2"/>',
      barrel: (r, r2) => pa('M-9 -12Q-12 0 -9 12H9Q12 0 9 -12Z', fillC('O', r2)) + '<path d="M-10.5 -4H10.5M-10.5 4H10.5" stroke="' + INK + '" stroke-width="2.2" fill="none"/>',
      anchor: () => '<g fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><circle cy="-11" r="3.6"/><path d="M0 -7V11M-7 -2H7M-11 3Q-9 12 0 12Q9 12 11 3"/></g>',
      buoy: (r, r2) => pa('M-9 12L-7 -2Q0 -6 7 -2L9 12Z', fillC('R', r2)) + '<path d="M-8 4H8" stroke="' + INK + '" stroke-width="2.2"/>' + ci(0, -8, 3.6, fillC('Y')) + '<path d="M0 -12V-16" stroke="' + INK + '" stroke-width="2.4"/>',
      pine: (r, r2) => pa('M-2.5 14V6H2.5V14Z', fillC('N')) + pa('M0 -24L11 -6H5L15 8H-15L-5 -6H-11Z', fillC('G', r2)),
      mushroom: (r, r2) => pa('M-4 12V0H4V12Z', '#fff') + pa('M-14 1Q-14 -15 0 -15Q14 -15 14 1Z', fillC('R', r2)) + '<circle cx="-5" cy="-7" r="2.4" fill="#fff"/><circle cx="4" cy="-9" r="2" fill="#fff"/><circle cx="8" cy="-3" r="1.6" fill="#fff"/>',
      log: (r, r2) => pa('M-15 -5H12V9H-15Z', fillC('N', r2)) + '<ellipse cx="12" cy="2" rx="4.5" ry="7" fill="#f3e3c3"' + S + '/><path d="M12 2m-2 0a2 3.5 0 1 0 4 0" fill="none" stroke="' + INK + '" stroke-width="1.4"/>',
      rock: (r, r2) => pa('M-' + f1(10 + r * 5) + ' 8Q-13 -4 -2 -9Q10 -10 ' + f1(11 + r * 5) + ' 8Z', fillC('W', r2)) + '<path d="M-3 -2L1 3M3 0L6 4" stroke="' + INK + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
      gull: () => '<path d="M-14 2Q-7 -9 0 1Q7 -9 14 2" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
      coral: (r, r2) => { const c = pick(['R', 'P', 'O', 'V'], r2 * 1.7 % 1); return pa('M-12 12Q-3 8 -1 12M-1 12V-3Q-8 -5 -9 -14Q-3 -12 0 -2Q0 -16 2 -20Q7 -12 3 2Q9 -2 11 -12Q16 -4 8 5Q4 9 3 12Z', fillC(c, r2)); },
      fish: (r, r2) => pa('M-13 0Q-3 -11 9 0Q-3 11 -13 0Z', fillC(pick(['O', 'B', 'Y', 'P'], r2 * 1.9 % 1), r2)) + pa('M8 0L16 -7V7Z', fillC('R')) + '<circle cx="-7" cy="-2" r="1.6" fill="' + INK + '"/><path d="M-1 -6Q2 0 -1 6" fill="none" stroke="' + INK + '" stroke-width="1.6"/>',
      bubbles: () => '<circle cx="-6" cy="4" r="5" fill="#fff"' + S + '/><circle cx="6" cy="-4" r="3.4" fill="#fff"' + S + '/><circle cx="-1" cy="-13" r="2.4" fill="#fff"' + S + '/>',
      weed: (r, r2) => pa('M-5 14Q-12 4 -4 -4Q-12 -12 -4 -20Q0 -10 -1 -4Q4 4 3 14Z', fillC('G', r2)) + pa('M4 14Q12 6 6 -2Q10 -8 8 -14Q2 -6 3 0Q-2 6 0 14Z', fillC('G', 1)),
      crystal: (r, r2) => { const c = pick(['V', 'C', 'P'], r); return pa('M0 -24L8 -8L5 8H-5L-8 -8Z', fillC(c, r2)) + pa('M9 -10L15 -2L13 8H7L6 -2Z', fillC(c === 'C' ? 'V' : 'C')) + '<path d="M0 -24V8M-8 -8L0 -2L8 -8" fill="none" stroke="' + INK + '" stroke-width="1.6"/>'; },
      stal: (r, r2) => pa('M-10 10L-5 -14L0 10ZM-1 10L5 -20L11 10Z', fillC('W', r2)),
      gem: (r, r2) => pa('M-10 -3L-5 -10H5L10 -3L0 10Z', fillC(pick(['C', 'Y', 'P'], r), r2)) + '<path d="M-10 -3H10M-5 -10L-2 -3L0 10L2 -3L5 -10" fill="none" stroke="' + INK + '" stroke-width="1.5"/>',
      lava: (r, r2) => pa('M-16 2Q-15 -8 -4 -7Q4 -12 11 -5Q18 2 10 8Q0 12 -10 9Q-16 8 -16 2Z', fillC('R', r2)) + '<ellipse cx="-2" cy="0" rx="7" ry="3" fill="url(#blankCY)"/>',
      deadtree: () => '<path d="M0 12V-14M0 -4L-9 -13M0 -8L8 -17M0 2L7 -3" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>',
      flame: (r, r2) => pa('M0 12Q-12 8 -10 -2Q-8 -8 -4 -16Q-3 -8 2 -10Q0 -4 5 -4Q11 2 8 8Q5 12 0 12Z', fillC('O', r2)) + '<path d="M0 12Q-5 9 -3 4Q0 1 1 -3Q5 3 4 8Q3 11 0 12Z" fill="url(#blankCY)" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>',
    };
    const KINDS = {
      cove: ['wave', 'ball', 'shell', 'wave', 'duck', 'starfish', 'wave', 'shell'],
      beach: ['palm', 'castle', 'umbrella', 'starfish', 'palm', 'shell', 'ball', 'castle'],
      town: ['house', 'tree', 'house', 'flowers', 'house', 'fence', 'tree', 'flowers'],
      harbour: ['boat', 'crate', 'barrel', 'anchor', 'buoy', 'boat', 'crate', 'barrel'],
      forest: ['pine', 'tree', 'pine', 'mushroom', 'pine', 'log', 'tree', 'mushroom'],
      cape: ['rock', 'gull', 'flowers', 'buoy', 'rock', 'wave', 'gull', 'rock'],
      reef: ['coral', 'fish', 'coral', 'weed', 'fish', 'bubbles', 'coral', 'shell'],
      cave: ['crystal', 'stal', 'crystal', 'gem', 'mushroom', 'crystal', 'stal', 'gem'],
      volcano: ['rock', 'lava', 'deadtree', 'flame', 'rock', 'lava', 'deadtree', 'rock'],
    };
    const GROUND = { cove: 'S', beach: 'Y', town: 'G', harbour: 'N', forest: 'G', cape: 'W', reef: 'C', cave: 'V', volcano: 'O' };
    const SKY = { cove: 'B', beach: 'B', town: 'B', harbour: 'B', forest: 'B', cape: 'B', reef: 'B', cave: 'V', volcano: 'R' };

    function lighthouse(x, y, d) {   // striped lighthouse, base at (x, y)
      return '<g transform="translate(' + x + ' ' + y + ')"><path d="M' + (d * 6) + ' -76L' + (d * 44) + ' -92M' + (d * 6) + ' -76L' + (d * 50) + ' -76M' + (d * 6) + ' -76L' + (d * 44) + ' -60" stroke="' + INK + '" stroke-width="2.4" stroke-dasharray="2 7" stroke-linecap="round" fill="none"/>' +
        pa('M-14 0L-9 -50H9L14 0Z', '#fff') + '<path d="M-12.5 -14L-11 -26H11L12.5 -14ZM-9.8 -38L-9 -50H9L9.8 -38Z" fill="url(#blankCR)"/><path d="M-14 0L-9 -50H9L14 0Z" fill="none"' + S + '/>' +
        pa('M-12 -50H12V-56H-12Z', fillC('W')) + pa('M-8 -56V-70H8V-56Z', fillC('Y')) + pa('M-12 -70L0 -82L12 -70Z', fillC('R')) + pa('M-5 0V-9Q0 -14 5 -9V0Z', '#fff') + '</g>';
    }
    function volcano(z) {
      const b = z.stops[0], vx = b[0], vy = b[1], bt = z.y1 - 14, L = Math.max(24, vx - 176), Rr = Math.min(376, vx + 176);
      const cone = 'M' + L + ' ' + bt + 'Q' + f1(vx - 84) + ' ' + f1(vy + 90) + ' ' + f1(vx - 56) + ' ' + f1(vy - 4) + 'Q' + vx + ' ' + f1(vy - 28) + ' ' + f1(vx + 56) + ' ' + f1(vy - 4) + 'Q' + f1(vx + 84) + ' ' + f1(vy + 90) + ' ' + Rr + ' ' + bt + 'Z';
      let o = '<path d="' + cone + '" fill="url(#blankCN)"' + SB + '/>';
      o += '<path d="M' + f1(vx - 56) + ' ' + f1(vy - 4) + 'Q' + vx + ' ' + f1(vy + 22) + ' ' + f1(vx + 56) + ' ' + f1(vy - 4) + 'Q' + vx + ' ' + f1(vy - 28) + ' ' + f1(vx - 56) + ' ' + f1(vy - 4) + 'Z" fill="url(#blankCR)"' + S + '/>';
      o += '<path d="M' + f1(vx - 40) + ' ' + f1(vy + 14) + 'Q' + f1(vx - 52) + ' ' + f1(vy + 70) + ' ' + f1(vx - 98) + ' ' + f1(vy + 120) + 'M' + f1(vx + 40) + ' ' + f1(vy + 14) + 'Q' + f1(vx + 54) + ' ' + f1(vy + 56) + ' ' + f1(vx + 52) + ' ' + f1(vy + 100) + '" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-dasharray="1 8" stroke-linecap="round"/>';
      return o;
    }

    return {
      bg: '#fffefa',
      defs,
      backdrop(H, rnd) {
        let o = '<rect width="400" height="' + H + '" fill="url(#blankDots)"/>';
        o += '<rect x="7" y="7" width="386" height="' + (H - 14) + '" rx="22" fill="none" stroke="' + INK + '" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round" opacity=".5"/>';
        for (let k = 0; k < Math.floor(H / 120); k++) {      // doodles between the pages
          const y = 70 + k * 120 + rnd(k, 4) * 40, x = rnd(k, 8) > 0.5 ? 20 : 380;
          o += star5(x, y, 6, 'url(#blankC' + 'RBYG'[k % 4] + ')', 1.6);
        }
        return o;
      },
      zone(z) {
        const id = 'blankZ' + z.index, cx = (z.x0 + z.x1) / 2, cy = (z.y0 + z.y1) / 2, g = GROUND[z.theme] || 'G';
        let o = '<path id="' + id + '" d="' + z.path + '"/>';
        o += '<use href="#' + id + '" transform="translate(5 6)" fill="' + INK + '" opacity=".14"/>';
        o += '<use href="#' + id + '" fill="#fff"/>';
        o += '<use href="#' + id + '" fill="url(#blankC' + g + ')" opacity=".42"/>';
        // a patch of sky/sea colour in the corner and a stitched inner edge, for the colouring-book page
        o += '<use href="#' + id + '" transform="translate(' + f1(cx * 0.05) + ' ' + f1(cy * 0.05) + ') scale(.95)" fill="none" stroke="' + INK + '" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round" opacity=".35"/>';
        o += '<use href="#' + id + '" fill="none"' + SB + '/>';
        if (z.theme === 'cape') { const t = z.stops[z.stops.length - 1]; o += lighthouse(t[0] > 200 ? 62 : 338, t[1] + 34, t[0] > 200 ? 1 : -1); }
        if (z.theme === 'volcano') o += volcano(z);
        if (z.theme === 'cove') o += '';
        return '<g>' + o + '</g>';
      },
      decor(theme, r, r2) {
        const k = pick(KINDS[theme] || KINDS.town, r), fn = D[k];
        return fn ? fn(r2, (r * 7.31) % 1) : '';
      },
      sign(label, w) {
        return '<path d="M-7 4H4V28H-7L-2 16Z" fill="url(#blankCR)"' + S + '/><path d="M' + (w + 7) + ' 4H' + (w - 4) + 'V28H' + (w + 7) + 'L' + (w + 2) + ' 16Z" fill="url(#blankCR)"' + S + '/>' +
          '<rect width="' + w + '" height="32" rx="9" fill="#fff"' + SB.replace('stroke-width="4"', 'stroke-width="3.2"') + '/><rect x="3.5" y="3.5" width="' + (w - 7) + '" height="25" rx="6" fill="url(#blankCY)" opacity=".7"/>' +
          '<rect width="' + w + '" height="32" rx="9" fill="none"' + SB.replace('stroke-width="4"', 'stroke-width="3.2"') + '/>' +
          '<text x="' + w / 2 + '" y="17" text-anchor="middle" dominant-baseline="central" font-family="' + F + '" font-weight="700" font-size="15" fill="' + INK + '">' + label + '</text>';
      },
      keepOut(z) {   // the lighthouse (cape) and the volcano cone (volcano) are drawn in zone(); keep decor off them
        const out = [];
        if (z.theme === 'cape') { const t = z.stops[z.stops.length - 1], x = t[0] > 200 ? 62 : 338, y = t[1] + 34; out.push([x - 54, y - 96, x + 54, y + 4]); }
        if (z.theme === 'volcano') { const b = z.stops[0], vx = b[0], vy = b[1], bt = z.y1 - 14; out.push([Math.max(24, vx - 176), vy - 40, Math.min(376, vx + 176), bt]); }
        return out;
      },
      road: { todo: [INK, '#ffffff', '#d4d6e6'], done: [INK, '#ffc928', '#fff3b0'] },
      node(state, num, e, boss) {
        const c = e >= 0 ? e : 0, big = boss ? 34 : 29, pts = boss ? (function () { let p = []; for (let i = 0; i < 16; i++) { const R = i % 2 ? 29 : 37, a = i * Math.PI / 8; p.push(f1(R * Math.cos(a)) + ',' + f1(R * Math.sin(a))); } return p.join(' '); })() : hexPts(0, 0, big, 30);
        const fs = num.length > 3 ? 14 : num.length > 2 ? 16 : num.length > 1 ? 20 : 24;
        const numTxt = (fill) => '<text y="1" text-anchor="middle" dominant-baseline="central" font-family="' + F + '" font-weight="700" font-size="' + fs + '" fill="' + INK + '" stroke="' + fill + '" stroke-width="3.5" paint-order="stroke" stroke-linejoin="round">' + num + '</text>';
        const shape = (fill, sw) => '<polygon points="' + pts + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + (sw || 3.6) + '" stroke-linejoin="round"/>';
        if (state === 'locked') return shape('#fff') + '<path d="M-6 -2V-7Q-6 -13 0 -13Q6 -13 6 -7V-2" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/><rect x="-9" y="-3" width="18" height="14" rx="3.5" fill="#fff"' + S + '/><circle cy="4" r="2" fill="' + INK + '"/>';
        if (state === 'open') return shape(PL[c]) + '<polygon points="' + pts + '" fill="url(#blankCW)" opacity=".28"/>' + shape('none') + numTxt(PL[c]);
        if (state === 'beaten') return shape('#fff') + '<polygon points="' + pts + '" fill="url(#blankC' + 'RBYG'[c] + ')"/>' + shape('none') + star5(boss ? 0 : 17, boss ? -22 : -19, 8.5, '#fff', 2) + numTxt('#ffffff').replace('y="1"', 'y="4"');
        // current: sunny halo
        const halo = '<circle r="' + (boss ? 39 : 38) + '" fill="#ffb800" opacity=".42"/><circle r="' + (boss ? 39 : 38) + '" fill="none" stroke="#ffb800" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"/>';
        return halo + shape('#fff') + '<polygon points="' + pts + '" fill="url(#blankCY)"/>' + shape('none') + numTxt('#fff3b0');
      },
      start() {
        return '<g transform="rotate(-24)"><path d="M-9 -56H9V-14H-9Z" fill="#fff"' + SB.replace('stroke-width="4"', 'stroke-width="3.2"') + '/><path d="M-9 -50H9V-18H-9Z" fill="url(#blankCR)"/><path d="M-9 -56H9V-14H-9Z" fill="none"' + SB.replace('stroke-width="4"', 'stroke-width="3.2"') + '/>' +
          '<path d="M-9 -14L0 6L9 -14Z" fill="#f3e3c3"' + SB.replace('stroke-width="4"', 'stroke-width="3.2"') + '/><path d="M-3.5 -3L0 6L3.5 -3Z" fill="url(#blankCR)"/><path d="M-9 -56Q0 -66 9 -56" fill="#fff"' + S + '/></g>' +
          '<rect x="-30" y="12" width="60" height="22" rx="8" fill="#fff"' + S + '/><text y="24" text-anchor="middle" dominant-baseline="central" font-family="' + F + '" font-weight="700" font-size="14" fill="' + INK + '">START</text>';
      },
      pin() {
        return '<path d="M0 27C-6 17 -19 9 -19 -5A19 19 0 0 1 19 -5C19 9 6 17 0 27Z" fill="url(#blankCR)" stroke="' + INK + '" stroke-width="3.6" stroke-linejoin="round"/>' +
          '<circle cy="-6" r="12.5" fill="#fff" stroke="' + INK + '" stroke-width="2.6"/><circle cx="-4.5" cy="-9" r="2" fill="' + INK + '"/><circle cx="4.5" cy="-9" r="2" fill="' + INK + '"/><path d="M-6 -3Q0 4 6 -3" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>';
      },
    };
  })();

  FTH_SKINS.register({
    id: 'blank', name: 'Blank Doodle', ic: '📝', blurb: 'paint a blank map',
    coin: { name: 'paint drop', plural: 'paint drops', glyph: '💧', value: 3, pitch: 1.05,   // this skin's currency (SKIN-SPEC.md section 12)
      colors: { main: '#ff4f9a', edge: '#1b1b2f' },
      svg: FTH_SKINS.coinArt('<path d="M0 -12.2C4 -6 9.2 -1.6 9.2 3.8A9.2 9.2 0 0 1 -9.2 3.8C-9.2 -1.6 -4 -6 0 -12.2Z" transform="translate(1.3 1.8)" fill="#1b1b2f" opacity=".45"/>' +
        '<path d="M0 -12.2C4 -6 9.2 -1.6 9.2 3.8A9.2 9.2 0 0 1 -9.2 3.8C-9.2 -1.6 -4 -6 0 -12.2Z" fill="#ff4f9a" stroke="#1b1b2f" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M4.6 8.6A9.2 9.2 0 0 0 9.1 2.4" stroke="#c42a72" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M-5.2 2.4A5.4 5.4 0 0 0 -2.2 8" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".95"/><ellipse cx="-2.6" cy="-3.4" rx="1.4" ry="2.4" transform="rotate(30 -2.6 -3.4)" fill="#fff" opacity=".8"/>') },
    icon, card, logo,
    src: 'lab/blank.html', waits: true, own: true, needs: ['cells'],
    hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(rgba(27,27,47,.13) 1px, transparent 1.4px) 0 0 / 16px 16px, #ffffff',
      '--sk-ink': INK,
      '--sk-accent': '#ffc928',
      '--sk-card': '#ffffff',
      '--sk-card-ink': INK,
      '--sk-hud': '#ffffff',
      '--sk-btn': '#ffc928',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': INK,
      '--sk-chip': '#ffffff',
      '--sk-chip-ink': INK,
      '--sk-edge': INK,
      '--sk-coin': '#ffc928',
      '--sk-font': "Fredoka, 'Baloo 2', 'Arial Rounded MT Bold', 'Trebuchet MS', system-ui, sans-serif",
      '--sk-radius': '18px',
      '--sk-star-on': '#ffc928', '--sk-star-edge': '#1b1b2f', '--sk-star-off': '#8b889c', '--sk-star-off-edge': '#55536a',
      '--sk-ctl': '#ffffff', '--sk-ctl-ink': '#1b1b2f', '--sk-ctl-edge': '#1b1b2f',
    },
    css: '.tl .hx{transition:filter .15s}' +
      '.tl.lit .hx{filter:saturate(1.25) brightness(1.08)}' +
      '.tl.glow .halo{opacity:.85}' +
      '.tl.glow .hx{filter:saturate(1.4) brightness(1.15)}' +
      // chrome: thick ink outlines, flat 3px offset shadows, Fredoka everywhere
      `.btn3d,.badge,.pill,.coins,.goalbar,.starbar,.mnode .mst,.mnode .mtag,.say .msg,.skins button,#btnGo{font-family:var(--sk-font);text-shadow:none}` +
      `.btn3d{border:3px solid ${INK};border-radius:16px;color:${INK};--sh:${INK};box-shadow:3px 3px 0 ${INK};letter-spacing:.02em;font-weight:700}` +
      `.btn3d:active{transform:translate(3px,3px);box-shadow:0 0 0 ${INK}}` +
      `.btn3d.green,.btn3d.go,.btn3d.yellow{background:#ffc928;color:${INK}}` +
      `.btn3d.white{background:#fff;color:${INK}}` +
      `.btn3d.blue{background:#3fa7f5;color:${INK}}` +
      `.btn3d.orange{background:#ff9a3c;color:${INK}}` +
      `.btn3d:focus-visible,.mnode:focus-visible,.htdots button:focus-visible{outline:3px solid ${INK};outline-offset:3px}` +
      `.rbtn{border-radius:14px}` +
      `.rbtn.sm{border-radius:12px;box-shadow:2px 2px 0 ${INK}}` +
      `.rbtn.sm:active{box-shadow:0 0 0 ${INK}}` +
      `.bar .rb{border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK}}` +
      `.bar .rb:active{box-shadow:0 0 0 ${INK}}` +
      `.bar{background:#fff;border-top:3px solid ${INK}}` +
      `.gtop{box-shadow:none;border-bottom:3px solid ${INK}}` +
      `.badge,.pill{background:#fff;color:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:2px 2px 0 ${INK}}` +
      `.badge .s,.pill b{color:${INK}}` +
      `.badge .p{color:#1f6fc0}` +
      `.coins{background:#ffc928;color:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};min-width:0}` +
      `.coins::after{display:none}` +
      `.goalbar,.starbar{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};height:40px}` +
      `.starbar .st path{stroke-width:2.2}` +
      `.mnode .mst{background:#fff;border:2.5px solid ${INK};border-radius:8px;box-shadow:2px 2px 0 ${INK}}` +
      `.mnode .mtag{background:#ebe6d6;color:${INK};border:2.5px solid ${INK};border-radius:8px;box-shadow:2px 2px 0 ${INK}}` +
      `.mnode .pulse{border:3px solid #ffc928;box-shadow:0 0 0 2px ${INK}}` +
      `.say .msg{background:#fff;color:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK}}` +
      `.skins button{background:#fff;color:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:2px 2px 0 ${INK}}` +
      `.skins button[aria-checked="true"]{background:#ffc928;color:${INK};border-color:${INK};box-shadow:2px 2px 0 ${INK}}` +
      `.htdots button{border:2px solid ${INK}}` +
      `.htdots button.on{background:#ffc928}` +
      `.htnum{background:#ffc928;color:${INK};border:3px solid ${INK};box-shadow:2px 2px 0 ${INK}}` +
      `.card,#installSheet .card{border:3px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK}}` +
      `#brief .card,#win .card{border:3px solid ${INK};box-shadow:6px 6px 0 ${INK}}` +
      `#btnGo{border:3px solid ${INK};border-radius:16px;box-shadow:3px 3px 0 ${INK};color:${INK}}` +
      `#btnGo.swap,#btnGo.next{background:#3ccf6e}` +
      `#btnGo.trace{background:#3fa7f5}` +
      `#btnGo.catch{background:#ff9a3c}` +
      `#briefGo,#winNext{background:#ffc928;color:${INK};--sh:${INK};border:3px solid ${INK};box-shadow:3px 3px 0 ${INK};text-shadow:none;border-radius:16px}` +
      `#briefGo:active,#winNext:active{box-shadow:0 0 0 ${INK}}` +
      `.htskip{background:#fff;color:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:2px 2px 0 ${INK};font-family:var(--sk-font)}` +
      `#mini .lbl{background:#ffc928;color:${INK};border-color:${INK};border-radius:6px}`,
    fonts: ['https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'Paint every piece', text: 'Pick a paint, then tap or drag across blank pieces.', svg: i1 },
      { title: 'Neighbours must differ', text: 'Touching pieces can never share a paint.', svg: i2 },
      { title: 'A ? means stuck', text: 'All four paints touch it, so it cannot be painted yet.', svg: i3 },
      { title: 'Swap two paints', text: 'Hold a painted piece, release on its glowing group: paints trade.', svg: i4 },
      { title: 'Wipe and finish', text: 'Tap a piece with its own paint to wipe it.', svg: i5 },
    ],
    bonus: {
      label: 'PAINT',
      games: ['pop', 'chain'],
      intro: 'zoom',
      board: 'radial-gradient(rgba(43,45,66,.1) 1px, transparent 1.4px) 0 0 / 14px 14px, #fffdf6',
      line: '#1b1b2f',
      tile,
    },
    levelMap,
    map: {
      sea: ['#ffe9dc', '#ffd9c8', '#ffc7b2', '#ffb29c', '#f99a86', '#ee8372', '#de6a5e', '#c85250', '#aa3f44'],
      seaX: '#fffdf6',
      unknown: '#ebe2c8',
      ramp: ['#3ccf6e', '#ffc928', '#ff9a3c', '#ff5d5d'],
      grey: '#a9a498',
      route: '#ff8a00',
      ink: 'rgba(43,45,66,.85)',
      cell,
    },
    words: {
      win: 'Coloured!',
      perfect: 'Every piece painted!',
      par: 'Par: {par} swaps',
      chart: 'COLOUR SPACE',
    },
    eggs: [
      { id: 'clean-sheet', on: 'page', note: 'paint the whole map without a single clashing colour', pays: true },
      { id: 'drip', on: 'idle', secs: 40, run(fx) { fx.burst && fx.burst('💧', 0.5, 0.3); fx.sound && fx.sound('pop'); } },
    ],
  });
})();
