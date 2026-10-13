// Spheres: the map as a ball-and-stick model. See SKIN-SPEC.md and lab/spheres.html.
// Art: glossy toy marbles (gradient body, thick dark outline, top-left specular, offset shadow) on chunky outlined sticks.
(function () {
  const INK = '#e6edf3', NIGHT = '#0d1117', GLASS = '#d5e2f4', STICK = '#3a4454', OUT = '#0c1222';
  const COL = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'];
  const HI = ['#ffc2b4', '#cfe4ff', '#fff6c4', '#c8f5cc'];
  const LO = ['#8e1c17', '#173f80', '#9a6c0c', '#1a6b2a'];
  const FONT = "'Fredoka', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif";
  const f1 = n => Math.round(n * 10) / 10, f2 = n => Math.round(n * 100) / 100;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const NS = ' xmlns="http://www.w3.org/2000/svg"';
  const DEFS = COL.map((c, e) => '<radialGradient id="spheres-g' + e + '" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="' + HI[e] + '"/><stop offset=".45" stop-color="' + c + '"/><stop offset="1" stop-color="' + LO[e] + '"/></radialGradient>').join('') +
    '<radialGradient id="spheres-gl" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".5" stop-color="#9eb4d0" stop-opacity=".3"/><stop offset="1" stop-color="#5a7098" stop-opacity=".55"/></radialGradient>';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250"' + NS + '><defs>' + DEFS + '</defs>' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const at = (x, y, inner, cls) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')">' + (cls ? '<g class="' + cls + '">' + inner + '</g>' : inner) + '</g>';
  // a chunky outlined stick with its own shadow and a lit top edge
  function stick(x1, y1, x2, y2, w, col) {
    w = w || 9; const L = 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2;
    return '<path d="' + L + '" transform="translate(3 5)" stroke="#000" stroke-opacity=".35" stroke-width="' + (w + 4) + '" stroke-linecap="round"/>' +
      '<path d="' + L + '" stroke="' + OUT + '" stroke-width="' + (w + 5) + '" stroke-linecap="round"/>' +
      '<path d="' + L + '" stroke="' + (col || '#6a7a92') + '" stroke-width="' + w + '" stroke-linecap="round"/>' +
      '<path d="' + L + '" transform="translate(0 ' + f1(-w * .22) + ')" stroke="#fff" stroke-opacity=".35" stroke-width="' + f1(w * .28) + '" stroke-linecap="round"/>';
  }
  // a marble of element e (or the glass hole, e < 0) radius r round (0, 0)
  function ball(r, e, o) {
    o = o || {}; const sw = f1(Math.max(2, r * .13));
    return '<circle cx="' + f1(r * .12) + '" cy="' + f1(r * .2) + '" r="' + r + '" fill="#000" opacity=".4"/>' +
      '<circle r="' + r + '" fill="url(#spheres-g' + (e < 0 ? 'l' : e) + ')" stroke="' + OUT + '" stroke-width="' + sw + '"/>' +
      (e < 0 ? '<circle r="' + f1(r * .82) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="' + f1(r * .06) + '"/>' + (o.q === false ? '' : '<text y="' + f1(r * .36) + '" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="' + f1(r * 1.05) + '" fill="#fff" stroke="' + OUT + '" stroke-width="' + f1(r * .1) + '" paint-order="stroke">?</text>') : '') +
      '<ellipse cx="' + f1(-r * .36) + '" cy="' + f1(-r * .4) + '" rx="' + f1(r * .3) + '" ry="' + f1(r * .18) + '" transform="rotate(-35 ' + f1(-r * .36) + ' ' + f1(-r * .4) + ')" fill="#fff" opacity=".9"/>' +
      '<circle cx="' + f1(-r * .05) + '" cy="' + f1(-r * .6) + '" r="' + f1(r * .07) + '" fill="#fff"/>' +
      '<path d="M' + f1(r * .2) + ' ' + f1(r * .78) + 'A' + f1(r * .82) + ' ' + f1(r * .82) + ' 0 0 0 ' + f1(r * .78) + ' ' + f1(r * .2) + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="' + f1(r * .08) + '" stroke-linecap="round"/>';
  }
  const orb = (x, y, r, e, cls) => at(x, y, ball(r, e), cls);
  const finger = (x, y, cls) => at(x, y, '<g transform="rotate(-18)">' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" transform="translate(2.2 4)" fill="#000" opacity=".4"/>' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" fill="#fff" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/></g>', cls);
  const spark = (x, y, r, c) => '<path transform="translate(' + x + ' ' + y + ') scale(' + r + ')" d="M0 -1Q.15 -.15 1 0Q.15 .15 0 1Q-.15 .15 -1 0Q-.15 -.15 0 -1Z" fill="' + (c || '#fff') + '"/>';
  const label = (x, y, t, fs, c) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="' + (fs || 26) + '" fill="' + (c || '#fff') + '" stroke="' + OUT + '" stroke-width="6" stroke-linejoin="round" paint-order="stroke">' + t + '</text>';
  const sky = '<rect width="300" height="250" fill="' + NIGHT + '"/><circle cx="150" cy="90" r="160" fill="#1f3050" opacity=".55"/>' +
    [[30, 30], [270, 40], [250, 210], [46, 200], [120, 20], [200, 228]].map((p, i) => spark(p[0], p[1], i % 2 ? 3 : 4.5, i % 3 ? '#9ecbff' : '#fff')).join('');

  // ---- title art: the ring of five marbles round the glass hole, floating ----
  const RG = [[150, 36, 0], [232, 92, 1], [202, 186, 2], [98, 186, 3], [68, 92, 1]];
  const ringSticks = RG.map((p, i) => stick(p[0], p[1], 150, 118) + stick(p[0], p[1], RG[(i + 1) % 5][0], RG[(i + 1) % 5][1], 7)).join('');
  const titleSvg = svg('<ellipse cx="150" cy="232" rx="110" ry="12" fill="#000" opacity=".25"/>' + ringSticks +
    RG.map((p, i) => orb(p[0], p[1], 26, p[2], 'spheres-bob spheres-d' + i)).join('') + orb(150, 118, 34, -1, 'spheres-glass') +
    spark(30, 40, 6) + spark(272, 34, 5, '#9ecbff') + spark(268, 210, 5),
    '.spheres-bob,.spheres-glass{transform-box:fill-box;transform-origin:center}' +
    RM('.spheres-bob{animation:sphBob 2.6s ease-in-out infinite}.spheres-d1{animation-delay:-.5s}.spheres-d2{animation-delay:-1s}.spheres-d3{animation-delay:-1.5s}.spheres-d4{animation-delay:-2s}@keyframes sphBob{50%{transform:scale(1.08)}}' +
      '.spheres-glass{animation:sphGl 2s ease-in-out infinite}@keyframes sphGl{50%{transform:scale(1.06) rotate(8deg)}}'));

  // ---- how to play ----
  const I = [
    { title: 'The glass hole', text: 'Empty one colour from the ring round the glass.',
      svg: svg(sky + ringSticks + RG.map((p, i) => orb(p[0], p[1], 24, p[2], i === 2 ? 'spheres-out' : '')).join('') + orb(150, 118, 30, -1),
        '.spheres-out{transform-box:fill-box;transform-origin:center}' + RM('.spheres-out{animation:sphOut 2.4s ease-in infinite}@keyframes sphOut{0%,35%{transform:none;opacity:1}80%{transform:translate(60px,40px) scale(.3);opacity:0}100%{opacity:0}}')) },
    { title: 'Trace a chain', text: 'Drag along the sticks over a two-colour chain.',
      svg: svg(sky + stick(50, 140, 116, 100, 10, '#ffd36a') + stick(116, 100, 184, 140, 10, '#ffd36a') + stick(184, 140, 250, 100, 10, '#ffd36a') + stick(116, 100, 150, 40, 7) + stick(184, 140, 160, 206, 7) +
        orb(150, 40, 18, 2) + orb(160, 206, 18, 3) +
        [[50, 140, 0], [116, 100, 1], [184, 140, 0], [250, 100, 1]].map((p, i) => orb(p[0], p[1], 24, p[2], 'spheres-lit spheres-d' + i)).join('') +
        at(0, 0, finger(50, 148), 'spheres-trace'),
        '.spheres-lit{transform-box:fill-box;transform-origin:center}' +
        RM('.spheres-lit{animation:sphLit 2.8s ease-in-out infinite}.spheres-d1{animation-delay:.35s}.spheres-d2{animation-delay:.7s}.spheres-d3{animation-delay:1.05s}@keyframes sphLit{0%,8%{transform:none}14%{transform:scale(1.2)}24%,100%{transform:none}}' +
          '.spheres-trace{animation:sphTr 2.8s linear infinite}@keyframes sphTr{0%{transform:none;opacity:1}12%{transform:none}25%{transform:translate(66px,-40px)}38%{transform:translate(134px,0)}50%{transform:translate(200px,-40px);opacity:1}60%,100%{transform:translate(200px,-40px);opacity:0}}')) },
    { title: 'Jiggle', text: 'A chain through every sphere only jiggles.',
      svg: svg(sky + stick(70, 90, 150, 170) + stick(150, 170, 230, 90) + stick(70, 90, 230, 90) + stick(150, 40, 70, 90) + stick(150, 40, 230, 90) +
        [[70, 90, 0], [230, 90, 1], [150, 170, 0], [150, 40, 1]].map((p, i) => orb(p[0], p[1], 24, p[2], 'spheres-jig spheres-d' + i)).join('') + label(150, 228, '×', 34, '#ef5a3c'),
        '.spheres-jig{transform-box:fill-box;transform-origin:center}' + RM('.spheres-jig{animation:sphJig .9s ease-in-out infinite}.spheres-d1{animation-delay:-.2s}.spheres-d2{animation-delay:-.4s}.spheres-d3{animation-delay:-.6s}@keyframes sphJig{25%{transform:translate(-4px,1px)}75%{transform:translate(4px,-1px)}}')) },
    { title: 'The glass fills', text: 'Three colours left: the glass takes the fourth.',
      svg: svg(sky + RG.map((p, i) => stick(p[0], p[1], 150, 118) + stick(p[0], p[1], RG[(i + 1) % 5][0], RG[(i + 1) % 5][1], 7)).join('') +
        [[150, 36, 0], [232, 92, 1], [202, 186, 2], [98, 186, 0], [68, 92, 1]].map(p => orb(p[0], p[1], 24, p[2])).join('') + orb(150, 118, 30, -1) + orb(150, 118, 30, 3, 'spheres-fill') +
        [0, 1, 2, 3, 4, 5].map(k => at(150, 118, spark(f1(56 * Math.cos(k * 1.047)), f1(56 * Math.sin(k * 1.047)), 7, k % 2 ? '#9ecbff' : '#fff'), 'spheres-burst')).join(''),
        '.spheres-fill,.spheres-burst{transform-box:fill-box;transform-origin:center}' +
        RM('.spheres-fill{animation:sphFill 2.6s ease-out infinite}@keyframes sphFill{0%,30%{transform:scale(0)}45%{transform:scale(1.2)}55%,100%{transform:none}}.spheres-burst{animation:sphBu 2.6s ease-out infinite}@keyframes sphBu{0%,40%{opacity:0;transform:scale(.4)}55%{opacity:1}90%,100%{opacity:0;transform:scale(1.2)}}')) },
  ];

  // ---- logo, icon, card (SKIN-SPEC section 13) ----
  const logoInner = () => {
    const t = (extra, txt) => '<text x="120" y="56" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="50"' + extra + '>' + txt + '</text>';
    return '<defs><linearGradient id="spheres-lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9ecbff"/><stop offset="1" stop-color="#4a8ee8"/></linearGradient></defs>' +
      t(' fill="' + OUT + '" stroke="' + OUT + '" stroke-width="13" stroke-linejoin="round" transform="translate(0 5)"', 'Spheres') +
      t(' fill="url(#spheres-lg)" stroke="' + OUT + '" stroke-width="9" stroke-linejoin="round" paint-order="stroke"', 'Spheres') +
      at(34, 22, ball(9, 0)) + at(206, 20, ball(7, 2)) + at(214, 60, ball(6, 3));
  };
  const logo = '<svg viewBox="0 0 240 80"' + NS + '><defs>' + DEFS + '</defs>' + logoInner() + '</svg>';

  const icon = '<svg viewBox="0 0 120 120"' + NS + '><defs>' + DEFS +
    '<radialGradient id="spheres-ib" cx=".4" cy=".3" r="1"><stop offset="0" stop-color="#36507e"/><stop offset=".55" stop-color="#16213c"/><stop offset="1" stop-color="#070b16"/></radialGradient>' +
    '<clipPath id="spheres-ic"><rect width="120" height="120" rx="26"/></clipPath></defs><g clip-path="url(#spheres-ic)">' +
    '<rect width="120" height="120" fill="url(#spheres-ib)"/>' + spark(98, 18, 4) + spark(18, 100, 3, '#9ecbff') + spark(106, 76, 2.5) +
    stick(32, 34, 66, 68, 10) + stick(92, 30, 66, 68, 9) + stick(28, 96, 66, 68, 9) +
    at(32, 34, ball(17, 0)) + at(92, 30, ball(14, 2)) + at(28, 96, ball(13, 3)) + at(66, 70, ball(31, 1)) +
    '<rect x="3" y="3" width="114" height="114" rx="23" fill="none" stroke="#9ecbff" stroke-opacity=".3" stroke-width="2.5"/></g>' +
    '<rect x="1" y="1" width="118" height="118" rx="25.5" fill="none" stroke="' + OUT + '" stroke-width="2.5"/></svg>';

  // card: a ball-and-stick model, a red/blue chain being traced (gold sticks), the glass hole; the logo below
  const P = [[120, 98, -1], [120, 40, 0], [176, 76, 1], [160, 146, 2], [80, 146, 3], [64, 76, 1], [36, 30, 3], [206, 26, 0], [218, 140, 3], [120, 196, 1], [28, 186, 0]];
  const E2 = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1], [6, 1], [6, 5], [7, 1], [7, 2], [8, 2], [8, 3], [9, 3], [9, 4], [10, 4], [10, 5]];
  const CH2 = ['1,2', '7,2', '7,1'];   // the traced fire/water chain
  const card = '<svg viewBox="0 0 240 320"' + NS + '><defs>' + DEFS +
    '<radialGradient id="spheres-cb" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#2a3f66"/><stop offset="1" stop-color="#080c16"/></radialGradient>' +
    '<linearGradient id="spheres-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080c16" stop-opacity="0"/><stop offset=".45" stop-color="#080c16" stop-opacity=".85"/><stop offset="1" stop-color="#080c16"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="url(#spheres-cb)"/>' + spark(20, 230, 4) + spark(224, 210, 3, '#9ecbff') + spark(150, 14, 3) +
    E2.map(([a, b]) => stick(P[a][0], P[a][1], P[b][0], P[b][1], CH2.includes(a + ',' + b) ? 10 : 7, CH2.includes(a + ',' + b) ? '#ffd36a' : null)).join('') +
    P.map((p, i) => at(p[0], p[1], (CH2.some(k => k.split(',').includes(String(i))) ? '<circle r="' + (i === 7 ? 30 : 32) + '" fill="#ffd36a" opacity=".3"/>' : '') + ball(i === 0 ? 26 : i < 6 ? 21 : 17, p[2]))).join('') +
    finger(212, 36) +
    '<rect y="200" width="240" height="120" fill="url(#spheres-cf)"/>' +
    '<svg x="0" y="230" width="240" height="80" viewBox="0 0 240 80">' + logoInner() + '</svg></svg>';

  // bonus gems: model-kit pieces, one silhouette per element: sphere (fire), cube (water), pyramid (air), capsule (earth)
  const gem = (e, R) => {
    const s = '<g transform="scale(' + f2(R / 20) + ')">', ol = 'stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"';
    if (e === 0) return s + ball(19, 0) + '</g>';
    if (e === 1) return s + '<path d="M-14 -8L0 -16L14 -8V10L0 18L-14 10Z" fill="#000" opacity=".4" transform="translate(2 4)"/>' +
      '<path d="M-14 -8L0 0V18L-14 10Z" fill="#2f74cc"/><path d="M14 -8L0 0V18L14 10Z" fill="#173f80"/><path d="M-14 -8L0 -16L14 -8L0 0Z" fill="#8ec0ff"/>' +
      '<path d="M-14 -8L0 -16L14 -8V10L0 18L-14 10ZM-14 -8L0 0L14 -8M0 0V18" fill="none" ' + ol + '/><path d="M-8 -9L0 -13" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>';
    if (e === 2) return s + '<path d="M0 -18L18 12L0 17L-18 12Z" fill="#000" opacity=".4" transform="translate(2 4)"/>' +
      '<path d="M0 -18L-18 12L0 17Z" fill="#ffe37a"/><path d="M0 -18L18 12L0 17Z" fill="#c9971a"/>' +
      '<path d="M0 -18L18 12L0 17L-18 12ZM0 -18V17" fill="none" ' + ol + '/><path d="M-3 -10L-9 1" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>';
    return s + '<rect x="-10" y="-17" width="20" height="34" rx="10" fill="#000" opacity=".4" transform="translate(2 4) rotate(30)"/>' +
      '<g transform="rotate(30)"><rect x="-10" y="-17" width="20" height="34" rx="10" fill="url(#spheres-g3)" ' + ol + '/><path d="M-10 0H10" stroke="' + OUT + '" stroke-width="2"/><path d="M-5 -10V-4" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></g></g>';
  };

  FTH_SKINS.register({
    id: 'spheres', name: 'Spheres', ic: '🔮', blurb: 'glossy balls on sticks',
    coin: { name: 'glass marble', plural: 'glass marbles', glyph: '🔮', value: 16, pitch: 1.35,
      colors: { main: '#d5e4f7', edge: '#6d7f99' },
      svg: FTH_SKINS.coinArt('<circle cx="1.2" cy="2" r="11" fill="#1c1640" opacity=".35"/><circle r="11" fill="#5a7aa8" stroke="#1c1640" stroke-width="2"/><circle cx="-1.4" cy="-1.6" r="8" fill="#8eb4e0"/><path d="M-7 4C-3 -2 3 6 8 -2" fill="none" stroke="#ef5a3c" stroke-width="2.4" stroke-linecap="round"/><path d="M-6 -4C-2 2 3 -6 7 3" fill="none" stroke="#e8c547" stroke-width="2" stroke-linecap="round"/><ellipse cx="-4" cy="-5.2" rx="3.2" ry="1.8" transform="rotate(-35 -4 -5.2)" fill="#fff"/><circle cx="4.4" cy="5" r="1.2" fill="#fff" opacity=".8"/>') },
    src: 'lab/spheres.html',
    hud: 'compact',
    fonts: ['https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap'],
    theme: {
      '--sk-bg': 'radial-gradient(120% 80% at 50% 0%, #1a2433 0%, #0d1117 62%)',
      '--sk-ink': INK,
      '--sk-accent': '#9ecbff',
      '--sk-card': 'linear-gradient(165deg, #1c2633, #121820)',
      '--sk-card-ink': INK,
      '--sk-hud': 'linear-gradient(180deg, rgba(18,24,32,.96), rgba(13,17,23,.94))',
      '--sk-btn': 'linear-gradient(180deg, #d5e4f7, #8ea4c0)',
      '--sk-btn-ink': '#121820',
      '--sk-btn-shadow': '#4a5a70',
      '--sk-font': FONT,
      '--sk-radius': '16px',
      '--sk-chip': '#161b22',
      '--sk-chip-ink': INK,
      '--sk-edge': '#8b9bb3',
      '--sk-btn2': '#1c2633',
      '--sk-btn2-ink': INK,
      '--sk-coin': 'linear-gradient(180deg, #e8eef8, #9eb4d0)',
      '--sk-star-on': '#f4f7ff', '--sk-star-edge': '#8ea0b8', '--sk-star-off': '#9aabbf', '--sk-star-off-edge': '#d5deea',
      '--sk-ctl': '#161b22', '--sk-ctl-ink': '#c9d1d9', '--sk-ctl-edge': '#8b9bb3',
    },
    css: '.btn3d{border-radius:14px;letter-spacing:.02em;text-shadow:none}' +
      '.coins{color:#121820}' +
      '.skins button[aria-checked="true"]{color:#121820}' +
      '.tl .tin{transition:transform .12s}.tl.lit .tin{transform:scale(1.12);filter:brightness(1.2)}' +
      '.tl.glow .tin{filter:drop-shadow(0 0 6px #9ecbff)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: '●', board: 'radial-gradient(ellipse at 50% 30%, #1a2433, #0d1117 72%)', line: '#9ecbff',
      games: ['chain', 'pop', 'snake'], intro: 'zoom',
      tile(x, y, r, e, k) {
        // the gradient defs ride along inside the tile (ids are the skin's own, repeated defs are harmless)
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin"><defs>' + DEFS + '</defs>' + gem(e, r * .82) + '</g></g>';
      },
    },
    eggs: [
      { id: 'cradle', on: 'page', note: 'tap the glass five times: the ring swings like a Newton\'s cradle', pays: true },
      { id: 'supernova', on: 'win', p: 0.1, run(fx) { if (!fx) return; fx.burst && (fx.burst('✨', .5, .42), fx.burst('🔮', .5, .5)); fx.sound && fx.sound('chime'); } },
    ],
    map: {
      sea: ['#243044', '#1e2938', '#1a2330', '#161e2a', '#121820', '#0e141c', '#0c1118', '#0a0e14', '#080c12'],
      seaX: '#070a10', fog: '#05070c', unknown: '#4a5568',
      ramp: ['#7dcea0', '#9ecbff', '#e8c547', '#ef5a3c'],
      grey: '#6e7a8a', route: '#d5e4f7', ink: 'rgba(230,237,243,.85)',
      cell(path, x, y, r) { path.moveTo(x + r * .82, y); path.arc(x, y, r * .82, 0, Math.PI * 2); path.closePath(); },
    },
    words: { win: 'The glass fills!', perfect: 'Shortest trace!', par: 'Par {par} swaps', chart: 'COLOURINGS' },
    levelMap: (function () {
      const lock = '<rect x="-6" y="-2" width="12" height="9" rx="2" fill="#8b9bb3"/><path d="M-3.4 -2v-3.2a3.4 3.4 0 0 1 6.8 0V-2" fill="none" stroke="#c5d0de" stroke-width="1.6"/>';
      return {
        bg: NIGHT,
        defs: '<radialGradient id="spheresLamp" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#243044" stop-opacity=".9"/><stop offset="1" stop-color="#0d1117" stop-opacity="0"/></radialGradient>' +
          '<radialGradient id="spheresPin" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#f4f7ff"/><stop offset=".45" stop-color="#9eb4d0"/><stop offset="1" stop-color="#3a4a60"/></radialGradient>',
        backdrop(H) {
          let s = '<rect width="400" height="' + H + '" fill="' + NIGHT + '"/><rect width="400" height="' + H + '" fill="url(#spheresLamp)"/>';
          for (let i = 0; i < Math.round(H / 28); i++) {
            const x = (i * 97) % 400, y = (i * 53) % H, r = (i % 5 === 0) ? 1.6 : 0.8;
            s += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#e8eef8" opacity="' + (i % 4 ? .35 : .7) + '"/>';
          }
          return s;
        },
        zone(z) {
          const x = z.x0 + 14, y = z.y0 + 10, w = z.x1 - z.x0 - 28, h = z.y1 - z.y0 - 20;
          const ox = z.x0 + 48, oy = z.y0 + 46;
          return '<g><rect x="' + (x + 4) + '" y="' + (y + 6) + '" width="' + w + '" height="' + h + '" rx="22" fill="#000" opacity=".35"/>' +
            '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="22" fill="#141a24" stroke="#3a4454" stroke-width="2"/>' +
            '<circle cx="' + ox + '" cy="' + (oy + 3) + '" r="18" fill="#000" opacity=".35"/>' +
            '<circle cx="' + ox + '" cy="' + oy + '" r="16" fill="#9eb4d0" fill-opacity=".3" stroke="' + GLASS + '" stroke-width="1.6"/>' +
            '<circle cx="' + (ox - 5) + '" cy="' + (oy - 5) + '" r="4" fill="#fff" opacity=".7"/></g>';
        },
        keepOut(z) { return [[z.x0 + 24, z.y0 + 22, z.x0 + 74, z.y0 + 74]]; },
        decor(theme, r) {
          const e = theme === 'forest' ? 3 : theme === 'volcano' ? 0 : theme === 'harbour' || theme === 'cove' ? 1 : (r < .5 ? 2 : 0);
          return '<circle cy="1" r="6" fill="#000" opacity=".3"/><circle r="6" fill="' + COL[e] + '" stroke="#1c1640" stroke-width="1"/>' +
            '<circle cx="-1.6" cy="-1.8" r="1.6" fill="' + HI[e] + '"/>';
        },
        sign(label, w) {
          const name = String(label).replace(/^\S+\s+/, '');
          return '<rect width="' + w + '" height="28" rx="8" fill="#161b22" stroke="#8b9bb3" stroke-width="1.6"/>' +
            '<text x="' + (w / 2) + '" y="19" text-anchor="middle" font-family="' + FONT + '" font-size="13" font-weight="700" fill="' + INK + '">' + name + '</text>';
        },
        road: { todo: ['#0d1117', '#3a4454', '#6a7688'], done: ['#0d1117', '#6a7e98', '#d5e4f7'], widths: [12, 6, 2], dash: '2 8', cap: 'round' },
        node(state, num, e, boss) {
          const R = boss ? 28 : 24, fs = num.length > 2 ? 11 : num.length > 1 ? 14 : 17;
          const face = e >= 0 ? COL[e] : '#3a4454';
          const txt = '<text y="' + f1(fs * .34) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs + '" font-weight="800" fill="#121820">' + num + '</text>';
          const disc = (fill, sw) => '<circle cy="2" r="' + (R + 1) + '" fill="#000" opacity=".3"/><circle r="' + R + '" fill="' + fill + '" stroke="#d5e2f4" stroke-width="' + sw + '"/>';
          if (state === 'locked') return disc('#2a3340', 2) + '<g transform="translate(0 2)">' + lock + '</g>';
          if (state === 'beaten') return disc('#d5e4f7', 2) + '<circle cx="' + f1(-R * .28) + '" cy="' + f1(-R * .3) + '" r="' + f1(R * .18) + '" fill="#fff" opacity=".8"/>' + txt;
          if (state === 'current') return '<circle r="' + (R + 7) + '" fill="none" stroke="#9ecbff" stroke-width="2.4"/>' + disc(face, 2) +
            '<circle cx="' + f1(-R * .28) + '" cy="' + f1(-R * .32) + '" r="' + f1(R * .16) + '" fill="#fff" opacity=".75"/>' + txt;
          return disc(face, 2) + '<circle cx="' + f1(-R * .28) + '" cy="' + f1(-R * .32) + '" r="' + f1(R * .16) + '" fill="#fff" opacity=".7"/>' + txt;
        },
        start() {
          return '<circle cy="2" r="16" fill="#000" opacity=".3"/><circle r="15" fill="#9eb4d0" fill-opacity=".35" stroke="' + GLASS + '" stroke-width="1.8"/>' +
            '<text y="4" text-anchor="middle" font-family="' + FONT + '" font-size="11" font-weight="800" fill="' + GLASS + '">?</text>' +
            '<text y="36" text-anchor="middle" font-family="' + FONT + '" font-size="11" font-weight="700" letter-spacing="1.4" fill="' + INK + '">START</text>';
        },
        pin() {
          return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="url(#spheresPin)" stroke="#1c1640" stroke-width="2"/>' +
            '<circle cy="-6" r="7" fill="#f4f7ff" stroke="#1c1640" stroke-width="1.2"/><circle cx="-2.2" cy="-8.2" r="2.2" fill="#fff"/>';
        },
      };
    })(),
  });
})();
