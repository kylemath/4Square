// Candy Kempe: swap two neighbouring candies and the chain ripples. See SKIN-SPEC.md and lab/crush.html.
// Art: chunky glossy sweets with a thick plum outline, a top-left gloss and an offset drop shadow (the Islands way).
(function () {
  const INK = '#4a1a5c', OUT = '#3a1046', GOLD = '#ffd23a';
  // the four flavours: fire = cherry jelly (round), water = wrapped sweet, air = star, earth = mint drop
  const FL = [
    { c: '#ff4d5e', hi: '#ffb3bb', lo: '#c4213a', name: 'jelly' },
    { c: '#3d8cff', hi: '#b5d4ff', lo: '#1f57c4', name: 'sweet' },
    { c: '#ffd23a', hi: '#fff3a8', lo: '#e09a00', name: 'star' },
    { c: '#3ecf6e', hi: '#b8f7cc', lo: '#1e9a4a', name: 'drop' },
  ];
  const f1 = n => Math.round(n * 10) / 10, f2 = n => Math.round(n * 100) / 100;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const FONT = "'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif";
  const NS = ' xmlns="http://www.w3.org/2000/svg"';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250"' + NS + '>' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const star = (n, ro, ri) => { let d = ''; for (let k = 0; k < n * 2; k++) { const a = -Math.PI / 2 + Math.PI * k / n, r = k % 2 ? ri : ro; d += (k ? 'L' : 'M') + f2(r * Math.cos(a)) + ' ' + f2(r * Math.sin(a)); } return d + 'Z'; };
  // unit shapes (radius 1 round the origin)
  const SH = [
    'M0 -.92A.92 .92 0 1 1 0 .92A.92 .92 0 1 1 0 -.92Z',
    'M-.62 -.5H.62Q.86 -.5 .86 -.26V.26Q.86 .5 .62 .5H-.62Q-.86 .5 -.86 .26V-.26Q-.86 -.5 -.62 -.5Z',
    star(5, 1.02, .5),
    'M0 -1C.3 -.6 .76 -.2 .76 .26A.76 .76 0 0 1 -.76 .26C-.76 -.2 -.3 -.6 0 -1Z',
  ];
  const ENDS = 'M-.8 -.12L-1.18 -.52Q-1.32 0 -1.18 .52L-.8 .12ZM.8 -.12L1.18 -.52Q1.32 0 1.18 .52L.8 .12Z';
  // one candy of flavour e at (x, y), radius R: shadow, body, inner light, gloss
  function sweet(e, R, o) {
    o = o || {}; const F = FL[e], d = SH[e], sw = f2(o.sw || .15);
    const ends = e === 1 ? '<path d="' + ENDS + '" fill="' + F.hi + '" stroke="' + OUT + '" stroke-width="' + sw + '" stroke-linejoin="round"/><path d="M-1 -.3L-1.02 .3M1 -.3L1.02 .3" stroke="' + F.lo + '" stroke-width=".07" stroke-linecap="round"/>' : '';
    const stripes = e === 0 ? '<path d="M-.5 -.6Q-.1 0 -.5 .62M0 -.9Q.4 0 0 .9M.5 -.62Q.9 0 .55 .55" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".13" stroke-linecap="round"/>'
      : e === 1 ? '<path d="M-.45 -.5L-.05 .5M.15 -.5L.55 .5" stroke="#fff" stroke-opacity=".32" stroke-width=".16"/>'
        : e === 3 ? '<circle cx=".18" cy=".38" r=".1" fill="#fff" opacity=".45"/><circle cx="-.24" cy=".5" r=".07" fill="#fff" opacity=".45"/>' : '';
    return '<g transform="scale(' + f2(R) + ')">' +
      (o.flat ? '' : '<g transform="translate(.1 .2)" fill="' + OUT + '" opacity=".38">' + (e === 1 ? '<path d="' + ENDS + '"/>' : '') + '<path d="' + d + '"/></g>') +
      ends + '<path d="' + d + '" fill="' + F.c + '" stroke="' + OUT + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="' + F.lo + '" opacity=".55" transform="translate(.12 .14) scale(.82)"/>' +
      '<path d="' + d + '" fill="' + F.c + '" transform="translate(-.06 -.07) scale(.8)"/>' + stripes +
      '<ellipse cx="-.34" cy="-.4" rx=".26" ry=".13" transform="rotate(-35 -.34 -.4)" fill="#fff" opacity=".92"/><circle cx="-.02" cy="-.56" r=".06" fill="#fff" opacity=".9"/>' +
      '</g>';
  }
  const at = (x, y, inner, cls) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')">' + (cls ? '<g class="' + cls + '">' + inner + '</g>' : inner) + '</g>';   // CSS animates the inner group, so it never overrides the translate
  const candy = (x, y, e, R, cls, o) => at(x, y, sweet(e, R || 16, o), cls);
  // the hole: a chocolate bar in gold foil, wrapper open
  function wrapper(R) {
    return '<g transform="scale(' + f2(R) + ')">' +
      '<rect x="-.95" y="-.62" width="1.9" height="1.42" rx=".22" fill="' + OUT + '" opacity=".38" transform="translate(.1 .2)"/>' +
      '<rect x="-.95" y="-.72" width="1.9" height="1.42" rx=".22" fill="#7a3d18" stroke="' + OUT + '" stroke-width=".14"/>' +
      '<path d="M-.62 -.72V.7M0 -.72V.7M.62 -.72V.7M-.95 0H.95" stroke="#4a2008" stroke-width=".08"/>' +
      '<rect x="-.82" y="-.6" width=".5" height=".4" rx=".08" fill="#a55a2a"/>' +
      '<path d="M-.98 .1H.98V.72Q.98 .82 .86 .82H-.86Q-.98 .82 -.98 .72Z" fill="' + GOLD + '" stroke="' + OUT + '" stroke-width=".12" stroke-linejoin="round"/>' +
      '<path d="M-.86 .28H.86" stroke="#fff6c2" stroke-width=".08" stroke-linecap="round"/>' +
      '<path d="M-.7 -.5L-.5 -.62" stroke="#fff" stroke-opacity=".5" stroke-width=".08" stroke-linecap="round"/></g>';
  }
  // the ghost finger: a white glove pointing, tip at (0, 0)
  const finger = (x, y, cls, s) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') scale(' + (s || 1) + ')"><g' + (cls ? ' class="' + cls + '"' : '') + '><g transform="rotate(-18)">' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" transform="translate(2.2 4)" fill="' + OUT + '" opacity=".35"/>' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" fill="#fff" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<path d="M4.5 3V9M11.5 2V9" stroke="' + OUT + '" stroke-width="1.6" stroke-linecap="round" opacity=".5"/></g></g></g>';
  const spark = (x, y, r, c) => '<path transform="translate(' + x + ' ' + y + ') scale(' + r + ')" d="M0 -1Q.15 -.15 1 0Q.15 .15 0 1Q-.15 .15 -1 0Q-.15 -.15 0 -1Z" fill="' + (c || '#fff') + '"/>';
  const plate = (cx, cy, rx, ry) => '<ellipse cx="' + cx + '" cy="' + (cy + 10) + '" rx="' + rx + '" ry="' + ry + '" fill="' + OUT + '" opacity=".3"/>' +
    '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#ffe1ef" stroke="' + OUT + '" stroke-width="4"/>' +
    '<ellipse cx="' + cx + '" cy="' + (cy - 3) + '" rx="' + (rx - 12) + '" ry="' + (ry - 9) + '" fill="#fff6fb"/>' +
    '<ellipse cx="' + cx + '" cy="' + (cy - 3) + '" rx="' + (rx - 12) + '" ry="' + (ry - 9) + '" fill="none" stroke="#ff8ec8" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>';

  // ---- title art: five candies round the chocolate wrapper on a sugar plate (transparent: it floats on --sk-bg) ----
  const ring = [[150, 66, 0], [222, 104, 1], [196, 170, 2], [104, 170, 3], [78, 104, 1]];
  const titleSvg = svg(plate(150, 126, 128, 92) +
    ring.map((p, i) => candy(p[0], p[1], p[2], 24, 'crush-bob crush-d' + i)).join('') + at(150, 120, wrapper(30), 'crush-pulse') +
    spark(40, 46, 7) + spark(262, 58, 5, GOLD) + spark(252, 196, 6) + spark(52, 200, 4, GOLD),
    '.crush-bob,.crush-pulse{transform-box:fill-box;transform-origin:50% 70%}' +
    RM('.crush-bob{animation:crushBob 2.4s ease-in-out infinite}.crush-d1{animation-delay:-.5s}.crush-d2{animation-delay:-1s}.crush-d3{animation-delay:-1.5s}.crush-d4{animation-delay:-2s}' +
      '@keyframes crushBob{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-7px) scale(1.04,.97)}60%{transform:translateY(0) scale(1.06,.94)}}' +
      '.crush-pulse{animation:crushPulse 1.8s ease-in-out infinite}@keyframes crushPulse{50%{transform:scale(1.07)}}'));

  // ---- how to play: one short sentence each, the pictures teach ----
  const sky = '<defs><radialGradient id="crushIs" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ffb3dc"/><stop offset=".6" stop-color="#d873e6"/><stop offset="1" stop-color="#7a3fc8"/></radialGradient></defs>' +
    '<rect width="300" height="250" fill="url(#crushIs)"/>' + spark(36, 34, 6) + spark(268, 40, 5, GOLD) + spark(270, 214, 6) + spark(28, 210, 4, GOLD);
  const tag = (x, y, t, c) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="' + FONT + '" font-size="26" fill="' + (c || '#fff') + '" stroke="' + OUT + '" stroke-width="6" stroke-linejoin="round" paint-order="stroke">' + t + '</text>';
  const ringI = [[150, 58, 0], [218, 96, 1], [194, 166, 2], [106, 166, 3], [82, 96, 1]];
  const I = [
    { title: 'Fill the wrapper', text: 'Clear one flavour from the five candies round the wrapper.',
      svg: svg(sky + ringI.map((p, i) => candy(p[0], p[1], p[2], 22, i === 2 ? 'crush-out' : '')).join('') + at(150, 112, wrapper(26)) +
        '<circle cx="194" cy="166" r="30" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="6 6" class="crush-spin"/>',
        '.crush-out,.crush-spin{transform-box:fill-box;transform-origin:center}' + RM('.crush-out{animation:crushOut 2s ease-in-out infinite}@keyframes crushOut{0%,30%{transform:none;opacity:1}70%{transform:translate(40px,30px) scale(.4) rotate(90deg);opacity:0}100%{opacity:0}}.crush-spin{animation:crushSp 6s linear infinite}@keyframes crushSp{to{transform:rotate(360deg)}}')) },
    { title: 'Drag to swap', text: 'Drag a candy onto a neighbour and their chain flips.',
      svg: svg(sky + '<path d="M60 128H240" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".35"/><path d="M60 128H240" stroke="' + GOLD + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 10" class="crush-flow"/>' +
        [0, 1, 0, 1].map((e, i) => at(60 + i * 60, 128, '<g class="crush-fl crush-w' + i + '">' + sweet(e, 21) + '<g class="crush-b">' + sweet(1 - e, 21) + '</g></g>')).join('') +
        finger(96, 140, 'crush-drag'),
        '.crush-fl,.crush-drag{transform-box:fill-box;transform-origin:center}' +
        RM('.crush-b{opacity:0;animation:crushB 3s steps(1) infinite}.crush-w1 .crush-b{animation-delay:.08s}.crush-w2 .crush-b{animation-delay:.16s}.crush-w3 .crush-b{animation-delay:.24s}@keyframes crushB{0%,45%{opacity:0}46%,95%{opacity:1}}' +
          '.crush-fl{animation:crushF 3s ease-in-out infinite}.crush-w1{animation-delay:.08s}.crush-w2{animation-delay:.16s}.crush-w3{animation-delay:.24s}@keyframes crushF{0%,40%{transform:none}45%{transform:scale(1.25,.7)}52%{transform:scale(.9,1.12)}60%,100%{transform:none}}' +
          '.crush-drag{animation:crushD 3s ease-in-out infinite}@keyframes crushD{0%,10%{transform:translate(0,0);opacity:0}18%{opacity:1}40%{transform:translate(60px,0);opacity:1}55%,100%{transform:translate(60px,0);opacity:0}}' +
          '.crush-flow{animation:crushFlow 1s linear infinite}@keyframes crushFlow{to{stroke-dashoffset:-26}}')) },
    { title: 'Jelly wobble', text: 'A chain across the whole board only wobbles.',
      svg: svg(sky + [[70, 110, 0], [130, 150, 1], [190, 110, 0], [240, 160, 1], [110, 80, 1], [180, 182, 0]].map((p, i) => candy(p[0], p[1], p[2], 22, 'crush-wob crush-d' + (i % 5))).join('') + tag(150, 228, '×', '#ff4d5e'),
        '.crush-wob{transform-box:fill-box;transform-origin:50% 80%}' + RM('.crush-wob{animation:crushWob 1.2s ease-in-out infinite}.crush-d1{animation-delay:-.2s}.crush-d2{animation-delay:-.4s}.crush-d3{animation-delay:-.6s}.crush-d4{animation-delay:-.8s}@keyframes crushWob{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg) scale(1.05,.95)}75%{transform:rotate(9deg) scale(.95,1.05)}}')) },
    { title: 'Sugar crush', text: 'Three flavours left: the missing one drops in.',
      svg: svg(sky + [[150, 58, 0], [218, 96, 1], [194, 166, 0], [106, 166, 1], [82, 96, 2]].map(p => candy(p[0], p[1], p[2], 22)).join('') + at(150, 118, wrapper(26)) +
        '<g class="crush-drop">' + candy(150, 104, 3, 24) + '</g>' +
        '<g class="crush-burst">' + [0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * Math.PI / 4; return spark(f1(150 + 52 * Math.cos(a)), f1(112 + 44 * Math.sin(a)), 7, k % 2 ? GOLD : '#fff'); }).join('') + '</g>',
        '.crush-drop,.crush-burst{transform-box:fill-box;transform-origin:center}' + RM('.crush-drop{animation:crushDr 2.6s cubic-bezier(.5,0,.6,1.4) infinite}@keyframes crushDr{0%{transform:translateY(-120px);opacity:0}15%{opacity:1}45%,100%{transform:none;opacity:1}}' +
          '.crush-burst{animation:crushBu 2.6s ease-out infinite}@keyframes crushBu{0%,44%{transform:scale(.3);opacity:0}52%{opacity:1}80%,100%{transform:scale(1.15);opacity:0}}')) },
  ];

  // ---- logo, icon, card (SKIN-SPEC section 13) ----
  const LETTERS = ['#ff4d5e', '#ffd23a', '#3d8cff', '#3ecf6e', '#ff7ad1'];
  const word = (x, y, fs, sp) => ['C', 'a', 'n', 'd', 'y'].map((ch, i) => '<tspan fill="' + LETTERS[i] + '"' + (i ? ' dx="' + sp + '"' : '') + '>' + ch + '</tspan>').join('');
  const logoInner = (fs, y) => {
    const t = (extra, inner) => '<text x="120" y="' + y + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs + '" letter-spacing="1"' + extra + '>' + inner + '</text>';
    return t(' fill="' + OUT + '" stroke="' + OUT + '" stroke-width="16" stroke-linejoin="round" transform="translate(0 6)"', 'Candy') +
      t(' fill="' + OUT + '" stroke="' + OUT + '" stroke-width="16" stroke-linejoin="round"', 'Candy') +
      t(' fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"', 'Candy') +
      t('', word()) +
      '<path d="M' + (120 - fs * 1.15) + ' ' + (y - fs * .52) + 'q' + fs * .3 + ' -' + fs * .1 + ' ' + fs * .62 + ' -' + fs * .02 + '" stroke="#fff" stroke-width="' + f1(fs * .07) + '" stroke-linecap="round" fill="none" opacity=".75"/>';
  };
  const logo = '<svg viewBox="0 0 240 80"' + NS + '>' + logoInner(62, 60) + spark(212, 18, 7, GOLD) + spark(26, 22, 5) + '</svg>';

  const icon = '<svg viewBox="0 0 120 120"' + NS + '><defs>' +
    '<radialGradient id="crush-ib" cx=".32" cy=".26" r="1"><stop offset="0" stop-color="#ffc2e4"/><stop offset=".45" stop-color="#ff6fbf"/><stop offset="1" stop-color="#8a2fc0"/></radialGradient>' +
    '<clipPath id="crush-ic"><rect width="120" height="120" rx="26"/></clipPath></defs>' +
    '<g clip-path="url(#crush-ic)"><rect width="120" height="120" fill="url(#crush-ib)"/>' +
    '<g fill="#fff" opacity=".14">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => { const a = k * Math.PI / 6, b = a + .2; return '<path d="M60 62L' + f1(60 + 110 * Math.cos(a)) + ' ' + f1(62 + 110 * Math.sin(a)) + 'L' + f1(60 + 110 * Math.cos(b)) + ' ' + f1(62 + 110 * Math.sin(b)) + 'Z"/>'; }).join('') + '</g>' +
    '<g transform="translate(60 64) rotate(-24)">' + sweet(1, 36, { sw: .1 }).replace(/#3d8cff/g, '#ff4d8a').replace(/#b5d4ff/g, '#ffd23a').replace(/#1f57c4/g, '#c41f5c') + '</g>' +
    spark(22, 24, 7) + spark(98, 96, 6, GOLD) + spark(100, 22, 4) +
    '<rect x="3" y="3" width="114" height="114" rx="23" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/></g>' +
    '<rect x="1" y="1" width="118" height="118" rx="25.5" fill="none" stroke="' + OUT + '" stroke-width="2.5"/></svg>';

  // card: a still of play (the candy board, a red-blue chain being dragged), the logo across the bottom third
  const GRID = [[1, 3, 2, 0, 2], [0, 2, -1, 3, 1], [1, 0, 1, 2, 0], [3, 1, 3, 0, 3]];
  const CH = { '0,2': 1, '0,1': 1, '1,1': 1, '1,0': 1, '2,0': 1, '2,1': 1, '2,2': 1 };   // the traced red/blue chain: rows 1-2
  const cardBoard = (() => {
    let s = '';
    GRID.forEach((row, r) => row.forEach((e, c) => {
      const x = 30 + c * 45, y = 44 + r * 44;
      s += '<rect x="' + (x - 20) + '" y="' + (y - 20) + '" width="40" height="40" rx="10" fill="#fff" opacity="' + ((r + c) % 2 ? .22 : .32) + '"/>';
    }));
    s += '<path d="M120 132H75V88H30V132H120" fill="none" stroke="#fff" stroke-width="22" stroke-linejoin="round" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M120 132H75V88H30V132H120" fill="none" stroke="' + GOLD + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="2 9"/>';
    GRID.forEach((row, r) => row.forEach((e, c) => {
      const x = 30 + c * 45, y = 44 + r * 44;
      s += e < 0 ? at(x, y, wrapper(19)) : candy(x, y, e, CH[r + ',' + c] ? 17 : 15);
    }));
    return s + finger(124, 140, '', 1.1);
  })();
  const card = '<svg viewBox="0 0 240 320"' + NS + '><defs>' +
    '<linearGradient id="crush-cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9ad2"/><stop offset=".55" stop-color="#c86bff"/><stop offset="1" stop-color="#5a2a9c"/></linearGradient>' +
    '<linearGradient id="crush-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + OUT + '" stop-opacity="0"/><stop offset=".45" stop-color="' + OUT + '" stop-opacity=".55"/><stop offset="1" stop-color="' + OUT + '" stop-opacity=".9"/></linearGradient>' +
    '<pattern id="crush-cd" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="5" cy="6" r="2" fill="#fff" opacity=".3"/><circle cx="17" cy="17" r="1.3" fill="#fff" opacity=".25"/></pattern></defs>' +
    '<rect width="240" height="320" fill="url(#crush-cb)"/><rect width="240" height="320" fill="url(#crush-cd)"/>' +
    '<rect x="8" y="22" width="224" height="186" rx="22" fill="' + OUT + '" opacity=".3" transform="translate(3 6)"/>' +
    '<rect x="8" y="22" width="224" height="186" rx="22" fill="#ff8ec8" fill-opacity=".35" stroke="#fff" stroke-width="4"/>' + cardBoard +
    '<rect y="200" width="240" height="120" fill="url(#crush-cf)"/>' +
    '<svg x="0" y="226" width="240" height="80" viewBox="0 0 240 80">' + logoInner(62, 60) + '</svg>' +
    spark(214, 230, 7, GOLD) + spark(26, 296, 5) + '</svg>';

  FTH_SKINS.register({
    id: 'crush', name: 'Candy', ic: '🍬', blurb: 'swap candies, chains ripple',
    coin: { name: 'sweet', plural: 'sweets', glyph: '🍭', value: 8, pitch: 1.15,
      colors: { main: '#ff5fa8', edge: '#ffd23a' },
      svg: FTH_SKINS.coinArt('<g transform="translate(1 2)" fill="#1c1640" opacity=".35"><path d="M-7 -1L-12.6 -6Q-14.4 0 -12.6 6L-7 1Z"/><path d="M7 -1L12.6 -6Q14.4 0 12.6 6L7 1Z"/><ellipse rx="8.4" ry="7.6"/></g>' +
        '<path d="M-7 -1L-12.6 -6Q-14.4 0 -12.6 6L-7 1ZM7 -1L12.6 -6Q14.4 0 12.6 6L7 1Z" fill="#ffd23a" stroke="#1c1640" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<ellipse rx="8.4" ry="7.6" fill="#ff5fa8" stroke="#1c1640" stroke-width="2"/><path d="M-3.6 -7Q.4 0 -3.6 7M2.4 -7.4Q6.4 0 2.4 7.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.8"/>' +
        '<ellipse cx="-3.4" cy="-3.4" rx="2.6" ry="1.4" transform="rotate(-35 -3.4 -3.4)" fill="#fff"/>') },
    src: 'lab/crush.html', hud: 'compact',
    fonts: ['https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@800;900&display=swap'],
    theme: {
      '--sk-bg': 'linear-gradient(180deg, #ff8ec8 0%, #c86bff 42%, #6b3fb8 100%)',
      '--sk-ink': '#ffffff',
      '--sk-accent': GOLD,
      '--sk-card': 'linear-gradient(180deg, #fffaf2, #ffe1ef)',
      '--sk-card-ink': INK,
      '--sk-hud': 'linear-gradient(180deg, rgba(122,42,140,.92), rgba(90,24,120,.88))',
      '--sk-btn': 'linear-gradient(180deg, #ffe07a, #ffb01a)',
      '--sk-btn-ink': '#4a1a5c',
      '--sk-btn-shadow': '#b36a00',
      '--sk-font': FONT,
      '--sk-radius': '22px',
      '--sk-chip': 'linear-gradient(#fffaf2, #ffe1ef)',
      '--sk-chip-ink': INK,
      '--sk-edge': '#ffffff',
      '--sk-btn2': 'linear-gradient(180deg, #ff9ccc, #ff4f9a)',
      '--sk-btn2-ink': '#ffffff',
      '--sk-coin': 'linear-gradient(180deg, #ffe07a, #ffb01a)',
      '--sk-star-on': '#ffd23a', '--sk-star-edge': '#8a5a00', '--sk-star-off': '#6a3478', '--sk-star-off-edge': '#3d1848',
      '--sk-ctl': '#fffaf2', '--sk-ctl-ink': '#4a1a5c', '--sk-ctl-edge': '#ff5fa8',
    },
    css: '--text:#4a1a5c;--dim:#7a4a88;--faint:#a070b0;--bg2:#fffaf2;--line:#f3c4df;' +
      '.btn3d{letter-spacing:.03em;text-shadow:none}' +
      '.btn3d.white,.btn3d.yellow,.btn3d.blue,.btn3d.orange{color:#fff}' +
      '.coins{color:#4a1a5c}' +
      '.goalbar,.starbar,.badge{color:#4a1a5c}' +
      '.skins button[aria-checked="true"]{color:#4a1a5c}' +
      '.tl .tin{transition:transform .12s}.tl.lit .tin{transform:scale(1.12)}.tl.glow .tin{filter:drop-shadow(0 0 6px #fff)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: '🍬', board: 'linear-gradient(180deg, #ff8ec8, #6b3fb8)', line: '#fff',
      games: ['chain', 'stack', 'pop'], intro: 'drop',
      tile(x, y, r, e, k) {
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + sweet(e, r * (e === 1 ? .66 : .8)) + '</g></g>';
      },
    },
    eggs: [
      { id: 'golden-wrapper', on: 'page', note: 'now and then one candy wears gold foil: swap a chain through it for a sparkle', pays: true },
      { id: 'sugar-rush', on: 'title', taps: 5, run(fx) { if (!fx) return; fx.burst && (fx.burst('🍬', .3, .4), fx.burst('🍭', .5, .32), fx.burst('🍬', .7, .4)); fx.sound && fx.sound('pop'); } },
    ],
    map: {
      sea: ['#f7c6e4', '#f0b0da', '#e49ad0', '#d484c4', '#c46eb8', '#b058aa', '#9c449c', '#88308e', '#742080'],
      seaX: '#5a2080', unknown: '#e7d0ea',
      ramp: ['#3ecf6e', '#ffd23a', '#ff8a3c', '#ff4d4d'],
      grey: '#c9a8d4', route: '#fff6e8', ink: 'rgba(74,26,92,.75)',
      cell(path, x, y, r) { path.moveTo(x + r, y); path.arc(x, y, r * .82, 0, Math.PI * 2); },
    },
    words: { win: 'Sugar crush!', perfect: 'Perfect swaps!', par: 'Par {par} swaps', chart: 'EVERY MIX' },
    levelMap: (function () {
      const TINT = {
        cove: ['#ffd0ea', '#ff8ec8'], beach: ['#ffe7a8', '#ffc14d'], town: ['#fff6e8', '#f3c4df'],
        harbour: ['#d6e8ff', '#7eb6ff'], forest: ['#d8ffe4', '#5ed98a'], cape: ['#ffe0f2', '#ff8ec8'],
        reef: ['#ffd0d8', '#ff7a9a'], cave: ['#ead6ff', '#b48cff'], volcano: ['#ffd0b0', '#ff8a4d'],
      };
      const lock = '<rect x="-6" y="-2" width="12" height="9" rx="2" fill="#b42323"/><path d="M-3.4 -2v-3.2a3.4 3.4 0 0 1 6.8 0V-2" fill="none" stroke="#b42323" stroke-width="1.8"/>';
      return {
        bg: '#c86bff',
        defs: '<linearGradient id="crushSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb0dc"/><stop offset="1" stop-color="#8a4ad4"/></linearGradient>' +
          '<pattern id="crushDots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="6" cy="8" r="2" fill="#fff" opacity=".35"/><circle cx="20" cy="18" r="1.4" fill="#fff" opacity=".28"/></pattern>',
        backdrop(H) { return '<rect width="400" height="' + H + '" fill="url(#crushSky)"/><rect width="400" height="' + H + '" fill="url(#crushDots)"/>'; },
        zone(z) {
          const t = TINT[z.theme] || TINT.town, x = z.x0 + 10, y = z.y0 + 6, w = z.x1 - z.x0 - 20, h = z.y1 - z.y0 - 12;
          return '<g><rect x="' + (x + 3) + '" y="' + (y + 6) + '" width="' + w + '" height="' + h + '" rx="28" fill="#4a1a5c" opacity=".18"/>' +
            '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="28" fill="' + t[0] + '" stroke="#fff" stroke-width="3"/>' +
            '<rect x="' + (x + 8) + '" y="' + (y + 8) + '" width="' + (w - 16) + '" height="' + (h - 16) + '" rx="22" fill="none" stroke="' + t[1] + '" stroke-width="2" stroke-dasharray="4 6"/></g>';
        },
        decor(theme, r) {
          const e = theme === 'beach' || theme === 'cape' ? 2 : theme === 'forest' ? 3 : theme === 'harbour' || theme === 'cove' ? 1 : (r < .5 ? 0 : 2);
          return sweet(e, 8);
        },
        sign(label, w) {
          const name = String(label).replace(/^\S+\s+/, '');
          return '<rect x="0" y="0" width="' + w + '" height="30" rx="15" fill="#fffaf2" stroke="#fff" stroke-width="3"/>' +
            '<text x="' + (w / 2) + '" y="20" text-anchor="middle" font-family="' + FONT + '" font-size="14" fill="#4a1a5c">' + name + '</text>';
        },
        road: { todo: ['#fff', '#ffd0ea', '#ff8ec8'], done: ['#fff', '#ffe7a8', '#ffd23a'], widths: [18, 10, 4], dash: '1 10', cap: 'round' },
        node(state, num, e, boss) {
          const R = boss ? 30 : 26, fs = num.length > 2 ? 13 : num.length > 1 ? 16 : 20;
          const face = e >= 0 ? FL[e].c : '#e7d0ea';
          const txt = '<text y="' + f1(fs * .36) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs + '" fill="#4a1a5c">' + num + '</text>';
          const disc = (fill, sw) => '<circle r="' + R + '" fill="' + fill + '" stroke="#fff" stroke-width="' + sw + '"/>';
          if (state === 'locked') return '<circle cy="3" r="' + (R + 2) + '" fill="#4a1a5c" opacity=".2"/>' + disc('#fff6e8', 3) + '<g transform="translate(0 1)">' + lock + '</g>';
          if (state === 'beaten') return '<circle cy="3" r="' + (R + 2) + '" fill="#4a1a5c" opacity=".15"/>' + disc(GOLD, 3) + txt;
          if (state === 'current') return '<circle r="' + (R + 8) + '" fill="none" stroke="#fff" stroke-width="3"/>' + disc(face, 3) + txt;
          return '<circle cy="3" r="' + (R + 2) + '" fill="#4a1a5c" opacity=".15"/>' + disc(face, 3) + txt;
        },
        start() {
          return '<circle r="16" fill="#fffaf2" stroke="#fff" stroke-width="3"/><circle r="6" fill="#ff5fa8"/>' +
            '<text y="36" text-anchor="middle" font-family="' + FONT + '" font-size="13" fill="#fff">START</text>';
        },
        pin() {
          return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="#ff4d4d" stroke="#fff" stroke-width="3"/>' +
            '<ellipse cx="-4" cy="-10" rx="4" ry="2.4" fill="#fff" opacity=".8"/>';
        },
      };
    })(),
  });
})();
