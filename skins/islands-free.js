// Islands Free: the Islands art on a board with no walls. The three far regions become tiles like the rest and the
// whole map spreads out and settles like soft bubbles; links may cross, nothing is held in place. Same renderer as
// Islands (board/island.js), another configuration. The numbers start from the dev-panel values (home and bridge
// springs 0, damping .53, swing .38, link pull .065) and were tuned over every level and screen size with
// tools/free_check.js: bubble push 2.5 (settles in ~270 steps instead of ~600), bubble size 1.15 (a hexagonal packing
// that fills about the whole island; the layout settles offline before the first frame, so the island opens at rest).
// The how-to pages are the Islands ones (the shell's own); this spec adds the reel art, a bubble title, bubble gems and eggs.
(function () {
  // Islands art kit (the shell's tile look: element body, dark outline, offset shadow, neon ring, black plate, neon icon)
  const OUT = '#1c1640', GOLD = '#ffd84a';
  const C = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'], D = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'], N = ['#ff7a52', '#5ab4ff', '#ffe066', '#5cff8a'];
  const ICON = [
    'M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2.4 1.1-4.1 2.3-5.2.1 1.6.8 2.7 1.9 3.3C10.3 8 11 5 12 2z',
    'M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z',
    'M3 8.5h11a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8M3 16.5h8',
    'M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M6 18c3-4 6-7 9-9',
  ];
  const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
  const f1 = n => Math.round(n * 10) / 10, f2 = n => Math.round(n * 100) / 100;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const NS = ' xmlns="http://www.w3.org/2000/svg"';
  const at = (x, y, inner, cls, s) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')' + (s ? ' scale(' + s + ')' : '') + '">' + (cls ? '<g class="' + cls + '">' + inner + '</g>' : inner) + '</g>';
  const icon24 = (e, size) => { const k = size / 24; return '<path d="' + ICON[e] + '" transform="translate(' + f1(-size / 2) + ' ' + f1(-size / 2) + ') scale(' + f2(k) + ')" ' +
    (e === 2 ? 'fill="none" stroke="' + N[e] + '" stroke-width="2.6" stroke-linecap="round"' : e === 3 ? 'fill="' + N[e] + '" stroke="' + N[e] + '" stroke-width="1.6" stroke-linecap="round"' : 'fill="' + N[e] + '"') + '/>'; };
  const poly = (n, r, sy, rot) => { let s = ''; for (let k = 0; k < n; k++) { const a = (rot == null ? -Math.PI / 2 : rot) + 2 * Math.PI * k / n; s += f1(r * Math.cos(a)) + ',' + f1(r * Math.sin(a) * (sy || 1)) + ' '; } return s.trim(); };
  // a flat island tile (the 2D board's look), radius r, n sides, element e (e < 0: the "?" hole)
  function flat(r, e, n) {
    n = n || 6; const sw = f1(Math.max(2, r * .1)), P = poly(n, r);
    if (e < 0) return '<polygon points="' + P + '" transform="translate(0 ' + f1(r * .16) + ')" fill="' + OUT + '"/><polygon points="' + P + '" fill="#f4f1ea" stroke="' + OUT + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<polygon points="' + poly(n, r * .7) + '" fill="#2b2f3a"/><text y="' + f1(r * .3) + '" text-anchor="middle" font-family="' + FONT + '" font-weight="900" font-size="' + f1(r * .9) + '" fill="#fff">?</text>';
    return '<polygon points="' + P + '" transform="translate(0 ' + f1(r * .18) + ')" fill="' + D[e] + '" stroke="' + OUT + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<polygon points="' + P + '" fill="' + C[e] + '" stroke="' + OUT + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<polygon points="' + poly(n, r * .76) + '" fill="#07090d" stroke="' + N[e] + '" stroke-width="' + f1(r * .1) + '" stroke-linejoin="round"/>' + icon24(e, r * .95);
  }
  // a hexagonal prism seen from above at a tilt: top face squashed by .62, a side band of depth d below it
  function prism(r, e, d) {
    d = d == null ? r * .45 : d; const sy = .62, sw = f1(Math.max(2, r * .09));
    const pt = k => { const a = -Math.PI / 2 + Math.PI / 3 * k; return [f1(r * Math.cos(a)), f1(r * Math.sin(a) * sy)]; };
    const side = [1, 2, 3, 4, 5].map(k => pt(k)), band = side.map(p => p.join(',')).join(' ') + ' ' + side.slice().reverse().map(p => p[0] + ',' + f1(p[1] + d)).join(' ');
    const top = poly(6, r, sy), hole = e < 0;
    return '<ellipse cx="' + f1(r * .1) + '" cy="' + f1(d + r * .5) + '" rx="' + f1(r * 1.05) + '" ry="' + f1(r * .34) + '" fill="#000" opacity=".25"/>' +
      '<polygon points="' + band + '" fill="' + (hole ? '#3a3f4c' : D[e]) + '" stroke="' + OUT + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="M' + pt(3)[0] + ' ' + pt(3)[1] + 'V' + f1(pt(3)[1] + d) + '" stroke="' + OUT + '" stroke-width="' + f1(sw * .6) + '"/>' +
      '<polygon points="' + [pt(3), pt(4), pt(5)].map(p => p.join(',')).join(' ') + ' ' + [pt(5), pt(4), pt(3)].map(p => p[0] + ',' + f1(p[1] + d)).join(' ') + '" fill="#fff" opacity=".14"/>' +
      '<polygon points="' + top + '" fill="' + (hole ? '#f4f1ea' : C[e]) + '" stroke="' + OUT + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      (hole ? '<polygon points="' + poly(6, r * .7, sy) + '" fill="#2b2f3a"/><text y="' + f1(r * .26) + '" text-anchor="middle" font-family="' + FONT + '" font-weight="900" font-size="' + f1(r * .7) + '" fill="#fff">?</text>'
        : '<polygon points="' + poly(6, r * .74, sy) + '" fill="#07090d" stroke="' + N[e] + '" stroke-width="' + f1(r * .09) + '" stroke-linejoin="round"/><g transform="scale(1 .62)">' + icon24(e, r * .9) + '</g>') +
      '<path d="M' + f1(-r * .6) + ' ' + f1(-r * .42) + 'L' + f1(-r * .1) + ' ' + f1(-r * .6) + '" stroke="#fff" stroke-width="' + f1(r * .1) + '" stroke-linecap="round" opacity=".7"/>';
  }
  const finger = (x, y, cls) => at(x, y, '<g transform="rotate(-18)">' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" transform="translate(2.2 4)" fill="' + OUT + '" opacity=".35"/>' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" fill="#fff" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/></g>', cls);
  const spark = (x, y, r, c) => '<path transform="translate(' + x + ' ' + y + ') scale(' + r + ')" d="M0 -1Q.15 -.15 1 0Q.15 .15 0 1Q-.15 .15 -1 0Q-.15 -.15 0 -1Z" fill="' + (c || '#fff') + '"/>';
  const cloud = (x, y, s, o) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" opacity="' + (o || .9) + '"><path d="M-22 8a10 10 0 0 1 4-19a14 14 0 0 1 26-4a11 11 0 0 1 14 15a8 8 0 0 1-2 8Z" fill="#fff"/></g>';
  const ladder = (x1, y1, x2, y2, w) => {
    w = w || 4; const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, px = -uy * w, py = ux * w, n = Math.max(1, Math.round(L / 8));
    let d = 'M' + f1(x1 + px) + ' ' + f1(y1 + py) + 'L' + f1(x2 + px) + ' ' + f1(y2 + py) + 'M' + f1(x1 - px) + ' ' + f1(y1 - py) + 'L' + f1(x2 - px) + ' ' + f1(y2 - py);
    for (let i = 1; i < n; i++) { const t = i / n, cx = x1 + (x2 - x1) * t, cy = y1 + (y2 - y1) * t; d += 'M' + f1(cx + px) + ' ' + f1(cy + py) + 'L' + f1(cx - px) + ' ' + f1(cy - py); }
    return '<path d="' + d + '" fill="none" stroke="#3a2410" stroke-width="5" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#c98e4a" stroke-width="2.4" stroke-linecap="round"/>';
  };
  const word = (fs, a, b, bc) => {
    const t = (extra, txt) => '<text x="120" y="56" text-anchor="middle" font-family="' + FONT + '" font-weight="900" font-size="' + fs + '" letter-spacing="-.5"' + extra + '>' + txt + '</text>';
    return t(' fill="' + OUT + '" stroke="' + OUT + '" stroke-width="13" stroke-linejoin="round" transform="translate(0 6)"', a + ' ' + b) +
      t(' fill="#fff" stroke="' + OUT + '" stroke-width="9" stroke-linejoin="round" paint-order="stroke"', a + ' <tspan fill="' + bc + '">' + b + '</tspan>');
  };
  const PINK = '#ff9fb8';
  // a soap bubble of radius r round (0, 0) with an optional island tile inside
  const bubble = (r, e, n) => '<circle cx="' + f1(r * .1) + '" cy="' + f1(r * .2) + '" r="' + r + '" fill="#0e3a7a" opacity=".2"/>' +
    '<circle r="' + r + '" fill="#dff6ff" fill-opacity=".35" stroke="' + OUT + '" stroke-width="' + f1(Math.max(2, r * .08)) + '"/>' +
    '<circle r="' + f1(r * .9) + '" fill="none" stroke="' + PINK + '" stroke-opacity=".55" stroke-width="' + f1(r * .06) + '" stroke-dasharray="' + f1(r * .9) + ' ' + f1(r * 2.4) + '"/>' +
    (e == null ? '' : '<g transform="scale(' + f2(r * .7 / 20) + ')">' + flat(20, e, n) + '</g>') +
    '<ellipse cx="' + f1(-r * .4) + '" cy="' + f1(-r * .46) + '" rx="' + f1(r * .3) + '" ry="' + f1(r * .14) + '" transform="rotate(-38 ' + f1(-r * .4) + ' ' + f1(-r * .46) + ')" fill="#fff" opacity=".95"/>' +
    '<circle cx="' + f1(r * .5) + '" cy="' + f1(r * .5) + '" r="' + f1(r * .08) + '" fill="#fff" opacity=".8"/>';
  const lagoon = (cx, cy, rx, ry) => '<ellipse cx="' + (cx + 4) + '" cy="' + (cy + 10) + '" rx="' + rx + '" ry="' + ry + '" fill="#0e3a7a" opacity=".22"/>' +
    '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#f6dc8c" stroke="' + OUT + '" stroke-width="4"/>' +
    '<ellipse cx="' + cx + '" cy="' + (cy - 3) + '" rx="' + (rx - 12) + '" ry="' + (ry - 10) + '" fill="#5cc35a"/>' +
    '<ellipse cx="' + (cx - rx * .25) + '" cy="' + (cy - ry * .35) + '" rx="' + f1(rx * .4) + '" ry="' + f1(ry * .3) + '" fill="#7ee26b" opacity=".6"/>';

  // ---- title art: five tile bubbles round the hole bubble on the island, drifting (transparent background) ----
  const B5 = [[150, 52, 0, 6], [222, 98, 1, 5], [194, 176, 2, 7], [106, 176, 3, 6], [78, 98, 1, 5]];
  const titleSvg = '<svg viewBox="0 0 300 250"' + NS + '><style>.islandsfree-dr{transform-box:fill-box;transform-origin:center}' +
    RM('.islandsfree-dr{animation:ifDr 4s ease-in-out infinite}.islandsfree-d1{animation-delay:-.8s}.islandsfree-d2{animation-delay:-1.6s}.islandsfree-d3{animation-delay:-2.4s}.islandsfree-d4{animation-delay:-3.2s}.islandsfree-d5{animation-delay:-2s}' +
      '@keyframes ifDr{0%,100%{transform:translate(0,0)}25%{transform:translate(4px,-5px) scale(1.03,.97)}50%{transform:translate(-2px,-8px)}75%{transform:translate(-5px,-3px) scale(.97,1.03)}}') +
    '</style>' + cloud(40, 34, 1) + cloud(262, 44, .8) + lagoon(150, 124, 136, 100) +
    B5.map(p => '<path d="M' + p[0] + ' ' + p[1] + 'L150 118" stroke="#8a5a32" stroke-width="5" stroke-dasharray="2 5" stroke-linecap="round"/>').join('') +
    at(150, 118, bubble(34, -1, 5), 'islandsfree-dr islandsfree-d5') + B5.map((p, i) => at(p[0], p[1], bubble(28, p[2], p[3]), 'islandsfree-dr islandsfree-d' + i)).join('') +
    at(262, 196, bubble(9), 'islandsfree-dr islandsfree-d2') + at(34, 188, bubble(12), 'islandsfree-dr islandsfree-d3') + at(276, 150, bubble(6)) + '</svg>';

  // ---- logo, icon, card ----
  const logo = '<svg viewBox="0 0 240 80"' + NS + '>' + word(40, 'Islands', 'Free', PINK) + at(224, 20, bubble(9)) + at(14, 62, bubble(6)) + '</svg>';
  const icon = '<svg viewBox="0 0 120 120"' + NS + '><defs><clipPath id="islands-free-ic"><rect width="120" height="120" rx="26"/></clipPath>' +
    '<radialGradient id="islands-free-ib" cx=".35" cy=".25" r="1"><stop offset="0" stop-color="#8ef0e6"/><stop offset=".5" stop-color="#2fb8d8"/><stop offset="1" stop-color="#1c64c4"/></radialGradient></defs>' +
    '<g clip-path="url(#islands-free-ic)"><rect width="120" height="120" fill="url(#islands-free-ib)"/>' +
    '<path d="M-10 96Q20 86 50 96T110 96T170 96V130H-10Z" fill="#fff" opacity=".18"/><path d="M-10 106Q20 98 50 106T110 106T170 106V130H-10Z" fill="#fff" opacity=".18"/>' +
    at(58, 58, bubble(38, 1, 5)) + at(98, 28, bubble(12)) + at(22, 96, bubble(9)) + at(100, 90, bubble(6)) +
    '<rect x="3" y="3" width="114" height="114" rx="23" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/></g>' +
    '<rect x="1" y="1" width="118" height="118" rx="25.5" fill="none" stroke="' + OUT + '" stroke-width="2.5"/></svg>';
  const FP = [[120, 104, -1, 5], [116, 56, 0, 6], [168, 82, 1, 5], [160, 140, 2, 7], [82, 144, 3, 6], [70, 86, 1, 5], [64, 36, 3, 6], [180, 32, 0, 5], [206, 128, 3, 6], [124, 186, 1, 5], [36, 128, 0, 7]];
  const FE = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1], [6, 5], [7, 2], [8, 2], [8, 3], [9, 3], [9, 4], [10, 4], [10, 5], [6, 1], [7, 1], [9, 10]];
  const card = '<svg viewBox="0 0 240 320"' + NS + '>' + '<defs><linearGradient id="islands-free-cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0ff"/><stop offset="1" stop-color="#2a7fdc"/></linearGradient>' +
    '<linearGradient id="islands-free-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e3470" stop-opacity="0"/><stop offset=".5" stop-color="#0e3470" stop-opacity=".75"/><stop offset="1" stop-color="#0e3470"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="url(#islands-free-cb)"/>' + cloud(206, 222, .8, .7) + lagoon(120, 112, 116, 104) +
    FE.map(([a, b]) => ladder(FP[a][0], FP[a][1], FP[b][0], FP[b][1], 3)).join('') +
    '<path d="M168 82L180 32L116 56" fill="none" stroke="' + GOLD + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>' +
    FP.map((p, i) => at(p[0], p[1], bubble(i === 0 ? 24 : 21, p[2], p[3]))).join('') + finger(186, 40) + at(26, 30, bubble(8)) +
    '<rect y="214" width="240" height="106" fill="url(#islands-free-cf)"/>' +
    '<svg x="0" y="232" width="240" height="80" viewBox="0 0 240 80">' + word(40, 'Islands', 'Free', PINK) + '</svg></svg>';
  // bonus gems: bubble creatures, one silhouette per element: round bubble (fire), drop (water), cloud (air), leaf (earth)
  const SH = [
    'M0 -.9A.9 .9 0 1 1 0 .9A.9 .9 0 1 1 0 -.9Z',
    'M0 -1C.36 -.56 .76 -.16 .76 .26A.76 .76 0 0 1 -.76 .26C-.76 -.16 -.36 -.56 0 -1Z',
    'M-.62 .52A.42 .42 0 0 1 -.78 -.2A.5 .5 0 0 1 -.12 -.62A.52 .52 0 0 1 .7 -.34A.44 .44 0 0 1 .7 .52Z',
    'M-.8 .8C-1 0 -.5 -.76 .92 -.92C.98 .3 .3 .96 -.8 .8Z',
  ];
  const gem = (e, R) => '<g transform="scale(' + f2(R) + ')"><path d="' + SH[e] + '" fill="#0e3a7a" opacity=".35" transform="translate(.08 .16)"/>' +
    '<path d="' + SH[e] + '" fill="' + C[e] + '" stroke="' + OUT + '" stroke-width=".11" stroke-linejoin="round"/>' +
    '<path d="' + SH[e] + '" fill="#fff" opacity=".25" transform="translate(-.08 -.1) scale(.72)"/>' +
    '<g transform="scale(.042)">' + icon24(e, 24).replace(/fill="#[0-9a-f]+"/, 'fill="#fff"').replace(/stroke="#[0-9a-f]+"/, 'stroke="#fff"') + '</g>' +
    '<ellipse cx="-.36" cy="-.42" rx=".22" ry=".1" transform="rotate(-38 -.36 -.42)" fill="#fff" opacity=".95"/></g>';

  FTH_SKINS.register(FTH_SKINS.extend('islands', {
    id: 'islands-free', name: 'Islands Free', ic: '🫧', blurb: 'no walls: tiles drift like bubbles',
  coin: { name: 'pearl', plural: 'pearls', glyph: '🦪', value: 60, pitch: 1.25,   // this skin's currency (SKIN-SPEC.md section 12)
    colors: { main: '#fdf6ff', edge: '#d9587f' },
    svg: FTH_SKINS.coinArt('<path d="M-11.5 3.5C-13.5 -6 -6.5 -11.4 0 -11.8C6.5 -11.4 13.5 -6 11.5 3.5C8 10.5 -8 10.5 -11.5 3.5Z" fill="#ff9fb8" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/><path d="M0 -10.6V8M-5.6 -9.2L-4.6 8M5.6 -9.2L4.6 8M-9.6 -4.6L-8.6 6M9.6 -4.6L8.6 6" stroke="#d9587f" stroke-width="1.1" stroke-linecap="round" fill="none"/><circle cy="1.2" r="6.2" fill="#fdf6ff" stroke="#1c1640" stroke-width="2"/><path d="M-3.6 -1.2A4.4 4.4 0 0 1 -.4 -3.4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="2.2" cy="3.4" r="1.7" fill="#d6e6ff"/>') },
    look: 'islands',                    // chrome CSS scope: the Islands rules apply as they are
  board: { free: true, guard: false, live: { kH: 0, kB: 0, damp: .53, cap: .38, rep: 5, fk: .065, fr: 2.5, fl: 1.15 } },
    title: { svg: titleSvg },
    icon, card, logo,
    bonus: {
      label: '🫧', games: ['pop', 'chain', 'hop'], intro: 'zoom',
      tile(x, y, r, e, k) { return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + gem(e, r * .84) + '</g></g>'; },
    },
    eggs: [
      { id: 'bubble-drift', on: 'idle', secs: 25, run(fx) { if (!fx) return; fx.burst && (fx.burst('🫧', .25, .75), fx.burst('🫧', .6, .7), fx.burst('🫧', .8, .78)); fx.sound && fx.sound('pop'); } },
      { id: 'pearl-diver', on: 'map', taps: 5, run(fx) { if (!fx) return; fx.burst && fx.burst('🦪', .5, .5); fx.sound && fx.sound('chime'); fx.pay && fx.pay(25); } },
    ],
  }));
})();
