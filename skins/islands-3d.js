// Islands 3D: the Islands art as a three.js scene you can tilt and spin (lab/islands3d.html, built on lab/core.js). It
// builds its layout from the level's graph, so every level plays; without WebGL it posts an error and the shell
// plays the level on the island board instead. The how-to pages are the Islands ones (the shell's own); this spec adds
// the reel art (icon, card, logo), a floating-island title, cut-crystal bonus gems and two easter eggs.
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
  // a floating island chunk: grass top (ellipse rx, ry), sand lip, a rocky underside tapering to a point d below
  const chunk = (cx, cy, rx, ry, d) => '<ellipse cx="' + cx + '" cy="' + (cy + d + 26) + '" rx="' + f1(rx * .5) + '" ry="' + f1(ry * .3) + '" fill="#0e3a7a" opacity=".22"/>' +
    '<path d="M' + (cx - rx) + ' ' + cy + 'Q' + (cx - rx * .8) + ' ' + (cy + d * .55) + ' ' + (cx - rx * .3) + ' ' + (cy + d * .8) + 'L' + cx + ' ' + (cy + d) + 'L' + (cx + rx * .35) + ' ' + (cy + d * .75) + 'Q' + (cx + rx * .85) + ' ' + (cy + d * .5) + ' ' + (cx + rx) + ' ' + cy + 'Z" fill="#8a5a32" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M' + (cx + rx * .1) + ' ' + (cy + ry) + 'L' + (cx + rx * .35) + ' ' + (cy + d * .75) + 'Q' + (cx + rx * .85) + ' ' + (cy + d * .5) + ' ' + (cx + rx) + ' ' + cy + 'Z" fill="#5e3a1e"/>' +
    '<path d="M' + (cx - rx * .6) + ' ' + (cy + d * .35) + 'h' + f1(rx * .3) + 'M' + (cx - rx * .2) + ' ' + (cy + d * .6) + 'h' + f1(rx * .25) + 'M' + (cx + rx * .3) + ' ' + (cy + d * .4) + 'h' + f1(rx * .25) + '" stroke="#b07a48" stroke-width="3" stroke-linecap="round"/>' +
    '<ellipse cx="' + cx + '" cy="' + (cy + 4) + '" rx="' + rx + '" ry="' + ry + '" fill="#e8c97a" stroke="' + OUT + '" stroke-width="4"/>' +
    '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (rx - 7) + '" ry="' + (ry - 5) + '" fill="#5cc35a"/>' +
    '<ellipse cx="' + (cx - rx * .25) + '" cy="' + (cy - ry * .3) + '" rx="' + f1(rx * .45) + '" ry="' + f1(ry * .4) + '" fill="#7ee26b" opacity=".6"/>';
  const crystal = (x, y, s) => at(x, y, '<path d="M0 -14L7 -4L0 14L-7 -4Z" fill="#54e0ff" stroke="' + OUT + '" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 -14L0 14L7 -4Z" fill="#8a6cf0"/><path d="M0 -14L7 -4L0 14L-7 -4Z" fill="none" stroke="' + OUT + '" stroke-width="2.2" stroke-linejoin="round"/><path d="M-3 -6L0 -10" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>', '', s);
  const sky = (w, h, id) => '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0ff"/><stop offset=".55" stop-color="#3aa6f0"/><stop offset="1" stop-color="#2a7fdc"/></linearGradient></defs><rect width="' + w + '" height="' + h + '" fill="url(#' + id + ')"/>';

  // ---- title art: the rim of five prisms round the hole on a floating island, bobbing (transparent background) ----
  const T5 = [[150, 74, 0], [206, 98, 1], [186, 142, 2], [114, 142, 3], [94, 98, 1]];
  const titleSvg = '<svg viewBox="0 0 300 250"' + NS + '><style>.islands3d-bob,.islands3d-hop{transform-box:fill-box;transform-origin:50% 100%}' +
    RM('.islands3d-bob{animation:i3Bob 3.2s ease-in-out infinite}@keyframes i3Bob{50%{transform:translateY(-8px)}}.islands3d-hop{animation:i3Hop 2.5s ease-in-out infinite}.islands3d-d1{animation-delay:.5s}.islands3d-d2{animation-delay:1s}.islands3d-d3{animation-delay:1.5s}.islands3d-d4{animation-delay:2s}@keyframes i3Hop{0%,70%,100%{transform:none}80%{transform:translateY(-12px)}90%{transform:scale(1.06,.94)}}') +
    '</style>' + cloud(44, 40, 1.1) + cloud(256, 30, .8) + '<g class="islands3d-bob">' + chunk(150, 112, 128, 62, 96) +
    T5.map((p, i) => ladder(p[0], p[1] + 6, 150, 116, 3.6)).join('') +
    at(150, 112, prism(30, -1)) + T5.map((p, i) => at(p[0], p[1], prism(26, p[2]), 'islands3d-hop islands3d-d' + i)).join('') +
    crystal(268, 150, 1.1) + crystal(34, 156, .8) + '</g></svg>';

  // ---- logo, icon, card ----
  const logo = '<svg viewBox="0 0 240 80"' + NS + '>' + word(44, 'Islands', '3D', GOLD) + crystal(222, 22, .8) + '</svg>';
  const icon = '<svg viewBox="0 0 120 120"' + NS + '><defs><clipPath id="islands-3d-ic"><rect width="120" height="120" rx="26"/></clipPath>' +
    '<linearGradient id="islands-3d-ib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ddcff"/><stop offset=".6" stop-color="#3aa6f0"/><stop offset="1" stop-color="#2464c8"/></linearGradient></defs>' +
    '<g clip-path="url(#islands-3d-ic)"><rect width="120" height="120" fill="url(#islands-3d-ib)"/>' + cloud(24, 26, .7) + cloud(100, 100, .6, .6) +
    chunk(60, 66, 46, 22, 44) + at(60, 54, prism(30, 0, 14)) + crystal(100, 30, .9) + spark(20, 92, 5) +
    '<rect x="3" y="3" width="114" height="114" rx="23" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/></g>' +
    '<rect x="1" y="1" width="118" height="118" rx="25.5" fill="none" stroke="' + OUT + '" stroke-width="2.5"/></svg>';
  const CP = [[120, 104, -1], [120, 66, 0], [164, 86, 1], [152, 132, 2], [88, 132, 3], [76, 86, 1], [54, 52, 3], [186, 50, 0], [200, 124, 3], [120, 170, 1], [44, 128, 0]];
  const CE = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1], [6, 5], [7, 2], [8, 2], [8, 3], [9, 3], [9, 4], [10, 4], [10, 5], [6, 1], [7, 1]];
  const order = CP.map((p, i) => i).sort((a, b) => CP[a][1] - CP[b][1]);
  const card = '<svg viewBox="0 0 240 320"' + NS + '>' + sky(240, 320, 'islands-3d-cb') +
    '<defs><linearGradient id="islands-3d-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e3470" stop-opacity="0"/><stop offset=".5" stop-color="#0e3470" stop-opacity=".75"/><stop offset="1" stop-color="#0e3470"/></linearGradient></defs>' +
    cloud(40, 24, .9) + cloud(206, 210, .8, .7) + chunk(120, 110, 112, 84, 96) +
    CE.map(([a, b]) => ladder(CP[a][0], CP[a][1] + 5, CP[b][0], CP[b][1] + 5, 3.2)).join('') +
    '<path d="M164 86L186 50L120 66" fill="none" stroke="' + GOLD + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>' +
    order.map(i => at(CP[i][0], CP[i][1] - ([1, 2, 7].includes(i) ? 8 : 0), prism(i === 0 ? 22 : 19, CP[i][2], 9))).join('') +
    finger(192, 58) + crystal(214, 120, .8) +
    '<rect y="214" width="240" height="106" fill="url(#islands-3d-cf)"/>' +
    '<svg x="0" y="232" width="240" height="80" viewBox="0 0 240 80">' + word(44, 'Islands', '3D', GOLD) + '</svg></svg>';
  // bonus gems: cut crystals, one silhouette per element: ruby (round brilliant), sapphire (drop), topaz (triangle), emerald (step cut)
  const GEM = [
    ['M0 -1L.71 -.71L1 0L.71 .71L0 1L-.71 .71L-1 0L-.71 -.71Z', 'M0 -.5L.35 -.35L.5 0L.35 .35L0 .5L-.35 .35L-.5 0L-.35 -.35Z'],
    ['M0 -1C.4 -.5 .76 -.1 .76 .3A.76 .76 0 0 1 -.76 .3C-.76 -.1 -.4 -.5 0 -1Z', 'M0 -.4L.36 .2L0 .62L-.36 .2Z'],
    ['M0 -.98L1 .76H-1Z', 'M0 -.3L.42 .44H-.42Z'],
    ['M-.5 -.86H.5L.9 -.46V.46L.5 .86H-.5L-.9 .46V-.46Z', 'M-.26 -.46H.26L.48 -.24V.24L.26 .46H-.26L-.48 .24V-.24Z'],
  ];
  const gem = (e, R) => '<g transform="scale(' + f2(R) + ')"><path d="' + GEM[e][0] + '" fill="' + OUT + '" opacity=".4" transform="translate(.08 .16)"/>' +
    '<path d="' + GEM[e][0] + '" fill="' + D[e] + '" stroke="' + OUT + '" stroke-width=".12" stroke-linejoin="round"/>' +
    '<path d="' + GEM[e][0] + '" fill="' + C[e] + '" transform="translate(-.05 -.06) scale(.86)"/>' +
    '<path d="' + GEM[e][1] + '" fill="' + N[e] + '" stroke="' + OUT + '" stroke-width=".05" stroke-opacity=".5"/>' +
    '<path d="' + GEM[e][1] + '" fill="#fff" opacity=".35" transform="translate(-.08 -.1) scale(.5)"/>' +
    '<path d="M-.5 -.32L-.22 -.62" stroke="#fff" stroke-width=".1" stroke-linecap="round"/></g>';

  FTH_SKINS.register(FTH_SKINS.extend('islands', {
    id: 'islands-3d', name: 'Islands 3D', ic: '🧊', blurb: 'spin a floating island',
  coin: { name: 'crystal shard', plural: 'crystal shards', glyph: '💎', value: 100, pitch: 1.5,   // this skin's currency (SKIN-SPEC.md section 12)
    colors: { main: '#54e0ff', edge: '#8a6cf0' },
    svg: FTH_SKINS.coinArt('<path d="M-9 -3L-4.5 -11H4.5L9 -3L0 12Z" fill="#54e0ff"/><path d="M-9 -3H-2.6L0 12Z" fill="#1f9fd0"/><path d="M2.6 -3H9L0 12Z" fill="#8a6cf0"/><path d="M-4.5 -11L-2.6 -3H2.6L4.5 -11Z" fill="#cdfbff"/><path d="M-9 -3H9M-4.5 -11L-2.6 -3L0 12L2.6 -3L4.5 -11" fill="none" stroke="#1c1640" stroke-width="1.1" stroke-linejoin="round"/><path d="M-9 -3L-4.5 -11H4.5L9 -3L0 12Z" fill="none" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/><path d="M-6.4 -4.6L-4.2 -8.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>') },
    look: 'islands',
    src: 'lab/islands3d.html',
    board: null,
    title: { svg: titleSvg },
    icon, card, logo,
    bonus: {
      label: '💎', games: ['hop', 'stack', 'chain'], intro: 'spin',
      tile(x, y, r, e, k) { return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + gem(e, r * .82) + '</g></g>'; },
    },
    eggs: [
      { id: 'barrel-roll', on: 'page', note: 'spin the island a full turn in one drag: it hops for joy', pays: true },
      { id: 'crystal-tap', on: 'title', taps: 7, run(fx) { if (!fx) return; fx.burst && (fx.burst('💎', .5, .34), fx.burst('✨', .42, .3)); fx.sound && fx.sound('chime'); fx.pay && fx.pay(30); } },
    ],
  }));
})();
