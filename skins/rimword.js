// Rim Word: five letter tiles, one flip per Kempe swap, real words are the fills. See SKIN-SPEC.md and lab/rimword.html.
// Art: chunky bevelled wooden tiles with a thick dark-brown outline, a top-left sheen and an offset shadow, on paper and felt.
(function () {
  const INK = '#3a2a1a', PAPER = '#f3ead8', CREAM = '#fffaf0', WOOD = '#e9c58f', WOOD2 = '#d7a964', EDGE = '#a8763a';
  const GOLD = '#c9a15a', GOOD = '#2f8f4e', OUT = '#3b2612', FELT = '#2f8f4e';
  const C = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'];
  const FONT = "'Fraunces', Georgia, serif";
  const f1 = n => Math.round(n * 10) / 10, f2 = n => Math.round(n * 100) / 100;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const NS = ' xmlns="http://www.w3.org/2000/svg"';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250"' + NS + '>' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const at = (x, y, inner, cls, s) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')' + (s ? ' scale(' + s + ')' : '') + '">' + (cls ? '<g class="' + cls + '">' + inner + '</g>' : inner) + '</g>';
  // one wooden tile centred on (0, 0), W wide: shadow, bevel, face, sheen, letter, optional element stripe
  function wood(ch, W, o) {
    o = o || {}; const h = W / 2, r = f1(W * .18), sw = f1(Math.max(2, W * .07));
    const face = o.face || WOOD;
    return '<rect x="' + f1(-h + W * .06) + '" y="' + f1(-h + W * .14) + '" width="' + W + '" height="' + W + '" rx="' + r + '" fill="#2a1a08" opacity=".35"/>' +
      '<rect x="' + f1(-h) + '" y="' + f1(-h + W * .07) + '" width="' + W + '" height="' + W + '" rx="' + r + '" fill="' + (o.side || EDGE) + '" stroke="' + OUT + '" stroke-width="' + sw + '"/>' +
      '<rect x="' + f1(-h) + '" y="' + f1(-h) + '" width="' + W + '" height="' + W + '" rx="' + r + '" fill="' + face + '" stroke="' + OUT + '" stroke-width="' + sw + '"/>' +
      '<rect x="' + f1(-h + W * .1) + '" y="' + f1(-h + W * .08) + '" width="' + f1(W * .5) + '" height="' + f1(W * .12) + '" rx="' + f1(W * .06) + '" fill="#fff" opacity=".6"/>' +
      (o.e != null ? '<rect x="' + f1(-h + W * .16) + '" y="' + f1(h - W * .2) + '" width="' + f1(W * .68) + '" height="' + f1(W * .1) + '" rx="' + f1(W * .05) + '" fill="' + C[o.e] + '" stroke="' + OUT + '" stroke-width="' + f1(sw * .45) + '"/>' : '') +
      (ch ? '<text y="' + f1(W * (o.e != null ? .17 : .22)) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + f1(W * .62) + '" font-weight="800" fill="' + (o.ink || OUT) + '">' + ch + '</text>' : '');
  }
  const tile = (x, y, ch, W, o, cls) => at(x, y, wood(ch, W || 44, o), cls);
  const hole = (x, y, W, cls) => at(x, y, '<rect x="' + (-W / 2) + '" y="' + (-W / 2) + '" width="' + W + '" height="' + W + '" rx="' + f1(W * .18) + '" fill="#fff" fill-opacity=".5" stroke="' + GOLD + '" stroke-width="4" stroke-dasharray="7 6"/>' +
    '<text y="' + f1(W * .2) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + f1(W * .56) + '" font-weight="800" fill="' + GOLD + '">?</text>', cls);
  const finger = (x, y, cls) => at(x, y, '<g transform="rotate(-18)">' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" transform="translate(2.2 4)" fill="#2a1a08" opacity=".35"/>' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" fill="#fff" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/></g>', cls);
  const spark = (x, y, r, c) => '<path transform="translate(' + x + ' ' + y + ') scale(' + r + ')" d="M0 -1Q.15 -.15 1 0Q.15 .15 0 1Q-.15 .15 -1 0Q-.15 -.15 0 -1Z" fill="' + (c || '#fff') + '"/>';
  const paper = '<rect width="300" height="250" fill="' + PAPER + '"/>' + [40, 70, 100, 130, 160, 190, 220].map(y => '<path d="M0 ' + y + 'H300" stroke="#d7c4a0" stroke-width="1"/>').join('');
  const felt = (x, y, w, h) => '<rect x="' + (x + 4) + '" y="' + (y + 8) + '" width="' + w + '" height="' + h + '" rx="20" fill="#2a1a08" opacity=".3"/>' +
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="20" fill="' + FELT + '" stroke="' + OUT + '" stroke-width="3.5"/>' +
    '<rect x="' + (x + 7) + '" y="' + (y + 7) + '" width="' + (w - 14) + '" height="' + (h - 14) + '" rx="14" fill="none" stroke="#7fd09a" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 6"/>';
  const label = (x, y, t, fs, c) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="' + FONT + '" font-weight="800" font-size="' + (fs || 26) + '" fill="' + (c || CREAM) + '" stroke="' + OUT + '" stroke-width="6" stroke-linejoin="round" paint-order="stroke">' + t + '</text>';

  // ---- title art: five tiles (the rim, each wearing its element) round the blank hole, on a felt board ----
  const TR = [[150, 50, 'B', 0], [230, 100, 'L', 1], [200, 182, 'A', 2], [100, 182, 'R', 3], [70, 100, 'F', 1]];
  const titleSvg = svg(felt(20, 14, 260, 222) + TR.map((p, i) => tile(p[0], p[1], p[2], 54, { e: p[3] }, 'rimword-bob rimword-d' + i)).join('') + hole(150, 120, 58, 'rimword-glow') +
    spark(44, 40, 6, '#ffe7a8') + spark(262, 214, 5),
    '.rimword-bob,.rimword-glow{transform-box:fill-box;transform-origin:50% 100%}' +
    RM('.rimword-bob{animation:rwBob 2.2s ease-in-out infinite}.rimword-d1{animation-delay:-.44s}.rimword-d2{animation-delay:-.88s}.rimword-d3{animation-delay:-1.32s}.rimword-d4{animation-delay:-1.76s}' +
      '@keyframes rwBob{0%,70%,100%{transform:none}80%{transform:translateY(-9px) rotate(-4deg)}90%{transform:translateY(0) scale(1.05,.95)}}' +
      '.rimword-glow{animation:rwGlow 1.6s ease-in-out infinite}@keyframes rwGlow{50%{transform:scale(1.08)}}'));

  // ---- how to play: one short sentence each ----
  const row = (y, word, o) => word.split('').map((ch, i) => tile(42 + i * 54, y, ch, 46, Object.assign({}, o && o[i] || {}), o && o.cls && o.cls[i])).join('');
  const I = [
    { title: 'Spell a word', text: 'Make the five tiles spell a real word.',
      svg: svg(paper + row(100, 'BLARF') + label(150, 190, 'BLARF ✗', 30, '#ef5a3c')) },
    { title: 'Play a tile', text: 'Drag a rack tile onto the word.',
      svg: svg(paper + row(80, 'BLARF', { cls: ['', '', 'rimword-fade'] }) +
        '<rect x="66" y="150" width="168" height="66" rx="14" fill="' + WOOD2 + '" stroke="' + OUT + '" stroke-width="3"/>' + tile(104, 182, 'E', 40) + tile(196, 182, 'O', 40) +
        at(150, 182, wood('E', 40) + finger(4, 8), 'rimword-drag'),
        '.rimword-drag,.rimword-fade{transform-box:fill-box;transform-origin:center}' +
        RM('.rimword-drag{animation:rwDrag 2.6s ease-in-out infinite}@keyframes rwDrag{0%,15%{transform:none}55%,75%{transform:translate(-2px,-102px) scale(1.12)}90%,100%{transform:translate(-2px,-102px);opacity:0}}' +
          '.rimword-fade{animation:rwFade 2.6s steps(1) infinite}@keyframes rwFade{0%,74%{opacity:1}75%,100%{opacity:0}}')) },
    { title: 'Tiles come back', text: 'Your rack never runs out: play the tiles again.',
      svg: svg(paper + '<path d="M90 70A70 50 0 1 1 90 180" fill="none" stroke="' + GOLD + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="1 16"/>' +
        '<path d="M80 160L90 182L112 172" fill="none" stroke="' + OUT + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
        at(150, 125, tile(-28, 0, 'E', 52) + tile(28, 0, 'I', 52), 'rimword-spin')
        , '.rimword-spin{transform-box:fill-box;transform-origin:center}' + RM('.rimword-spin{animation:rwSpin 3s ease-in-out infinite}@keyframes rwSpin{0%,60%,100%{transform:none}75%{transform:translateY(-14px) rotate(-6deg)}}')) },
    { title: 'A word wins', text: 'A real word fills the hole.',
      svg: svg(paper + row(96, 'BLEAT', { 0: { face: '#bfe6b0' }, 1: { face: '#bfe6b0' }, 2: { face: '#bfe6b0' }, 3: { face: '#bfe6b0' }, 4: { face: '#bfe6b0' }, cls: ['rimword-hop', 'rimword-hop rimword-d1', 'rimword-hop rimword-d2', 'rimword-hop rimword-d3', 'rimword-hop rimword-d4'] }) +
        label(150, 196, '★ ★ ★', 36, '#ffd36a') + spark(30, 40, 8, GOLD) + spark(270, 46, 6, GOLD) + spark(272, 190, 7, GOOD),
        '.rimword-hop{transform-box:fill-box;transform-origin:50% 100%}' + RM('.rimword-hop{animation:rwHop 1.4s ease-in-out infinite}.rimword-d1{animation-delay:.1s}.rimword-d2{animation-delay:.2s}.rimword-d3{animation-delay:.3s}.rimword-d4{animation-delay:.4s}@keyframes rwHop{0%,50%,100%{transform:none}25%{transform:translateY(-14px)}}')) },
  ];

  // ---- logo, icon, card (SKIN-SPEC section 13) ----
  const logoInner = () => {
    const t = (extra, txt) => '<text x="120" y="54" text-anchor="middle" font-family="' + FONT + '" font-weight="800" font-size="40" letter-spacing="-.5"' + extra + '>' + txt + '</text>';
    return t(' fill="' + OUT + '" stroke="' + OUT + '" stroke-width="12" stroke-linejoin="round" transform="translate(0 5)"', 'Rim Word') +
      t(' fill="' + WOOD + '" stroke="' + OUT + '" stroke-width="9" stroke-linejoin="round" paint-order="stroke"', 'Rim <tspan fill="' + CREAM + '">Word</tspan>') +
      '<rect x="44" y="64" width="152" height="7" rx="3.5" fill="' + GOOD + '" stroke="' + OUT + '" stroke-width="2.4"/>';
  };
  const logo = '<svg viewBox="0 0 240 80"' + NS + '>' + logoInner() + '</svg>';

  const icon = '<svg viewBox="0 0 120 120"' + NS + '><defs>' +
    '<radialGradient id="rimword-ib" cx=".35" cy=".25" r="1"><stop offset="0" stop-color="#5cc884"/><stop offset=".55" stop-color="#2f8f4e"/><stop offset="1" stop-color="#174d2a"/></radialGradient>' +
    '<linearGradient id="rimword-it" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8deac"/><stop offset="1" stop-color="#d9a75f"/></linearGradient>' +
    '<clipPath id="rimword-ic"><rect width="120" height="120" rx="26"/></clipPath></defs><g clip-path="url(#rimword-ic)">' +
    '<rect width="120" height="120" fill="url(#rimword-ib)"/>' +
    '<g stroke="#8fe0aa" stroke-opacity=".22" stroke-width="2">' + [20, 40, 60, 80, 100].map(v => '<path d="M' + v + ' 0V120M0 ' + v + 'H120"/>').join('') + '</g>' +
    '<g transform="translate(84 40) rotate(14)">' + wood('', 40, { face: '#e3b878' }) + '</g>' +
    '<g transform="translate(57 63) rotate(-8)">' + wood('W', 70, { face: 'url(#rimword-it)' }) + '</g>' +
    spark(22, 22, 7, '#fff3c4') + spark(100, 100, 5, '#fff3c4') +
    '<rect x="3" y="3" width="114" height="114" rx="23" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2.5"/></g>' +
    '<rect x="1" y="1" width="118" height="118" rx="25.5" fill="none" stroke="' + OUT + '" stroke-width="2.5"/></svg>';

  const CW = ['B', 'L', 'E', 'A', 'R'];
  const card = '<svg viewBox="0 0 240 320"' + NS + '><defs>' +
    '<linearGradient id="rimword-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#174d2a" stop-opacity="0"/><stop offset=".45" stop-color="#174d2a" stop-opacity=".85"/><stop offset="1" stop-color="#123d21"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="#2f8f4e"/>' +
    '<g stroke="#8fe0aa" stroke-opacity=".18" stroke-width="2">' + [24, 48, 72, 96, 120, 144, 168, 192, 216].map(v => '<path d="M' + v + ' 0V320"/>').join('') + [24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288].map(v => '<path d="M0 ' + v + 'H240"/>').join('') + '</g>' +
    '<rect x="12" y="30" width="216" height="80" rx="16" fill="' + PAPER + '" stroke="' + OUT + '" stroke-width="3"/>' +
    CW.map((ch, i) => tile(36 + i * 42, 68, i === 2 ? '' : ch, 36, { e: [0, 1, 2, 3, 1][i] })).join('') + hole(120, 68, 36) +
    '<path d="M120 92Q150 130 128 168" fill="none" stroke="#ffe7a8" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 9"/>' +
    '<rect x="30" y="150" width="180" height="58" rx="14" fill="' + WOOD2 + '" stroke="' + OUT + '" stroke-width="3"/><rect x="30" y="196" width="180" height="12" rx="6" fill="' + EDGE + '"/>' +
    tile(66, 176, 'S', 36) + tile(174, 176, 'O', 36) + '<g transform="translate(122 168) rotate(-10)">' + wood('E', 42) + '</g>' + finger(134, 186) +
    spark(212, 20, 6, '#fff3c4') + spark(24, 130, 5, '#fff3c4') +
    '<rect y="206" width="240" height="114" fill="url(#rimword-cf)"/>' +
    '<svg x="0" y="230" width="240" height="80" viewBox="0 0 240 80">' + logoInner() + '</svg></svg>';

  // bonus gems: a letter piece per element, one silhouette each: round token (fire), square tile (water), hexagon (air), diamond (earth)
  const hexD = r => { let d = ''; for (let q = 0; q < 6; q++) { const a = Math.PI / 3 * q; d += (q ? 'L' : 'M') + f2(r * Math.cos(a)) + ' ' + f2(r * Math.sin(a)); } return d + 'Z'; };
  const GEMS = ['M0 -.9A.9 .9 0 1 1 0 .9A.9 .9 0 1 1 0 -.9Z', 'M-.62 -.8H.62Q.8 -.8 .8 -.62V.62Q.8 .8 .62 .8H-.62Q-.8 .8 -.8 .62V-.62Q-.8 -.8 -.62 -.8Z', hexD(.96), 'M0 -1.02Q.08 -1.02 .14 -.96L.96 -.14Q1.02 0 .96 .14L.14 .96Q0 1.04 -.14 .96L-.96 .14Q-1.02 0 -.96 -.14L-.14 -.96Q-.08 -1.02 0 -1.02Z'];
  const GL = ['W', 'O', 'R', 'D'];
  const gem = (e, R) => '<g transform="scale(' + f2(R) + ')"><path d="' + GEMS[e] + '" fill="#2a1a08" opacity=".4" transform="translate(.08 .16)"/>' +
    '<path d="' + GEMS[e] + '" fill="' + C[e] + '" stroke="' + OUT + '" stroke-width=".13" stroke-linejoin="round"/>' +
    '<path d="' + GEMS[e] + '" fill="#fff" opacity=".22" transform="translate(-.06 -.08) scale(.78)"/>' +
    '<text y=".3" text-anchor="middle" font-family="' + FONT + '" font-size=".9" font-weight="800" fill="' + CREAM + '" stroke="' + OUT + '" stroke-width=".12" paint-order="stroke">' + GL[e] + '</text>' +
    '<ellipse cx="-.36" cy="-.46" rx=".2" ry=".09" transform="rotate(-35 -.36 -.46)" fill="#fff" opacity=".85"/></g>';

  FTH_SKINS.register({
    id: 'rimword', name: 'Rim Word', ic: '🔤', blurb: 'flip a tile, spell a real word',
    coin: { name: 'letter tile', plural: 'letter tiles', glyph: '🔤', value: 4, pitch: 0.85,
      colors: { main: '#e9c58f', edge: '#a8763a' },
      svg: FTH_SKINS.coinArt('<rect x="-8.6" y="-9" width="17.2" height="19.4" rx="2.8" fill="#1c1640" opacity=".35" transform="translate(1.2 1.8)"/><rect x="-8.6" y="-8.6" width="17.2" height="19" rx="2.8" fill="#a8763a" stroke="#1c1640" stroke-width="2"/><rect x="-8.6" y="-10.4" width="17.2" height="18" rx="2.8" fill="#e9c58f" stroke="#1c1640" stroke-width="2"/><rect x="-6" y="-8" width="7.6" height="2.4" rx="1.2" fill="#fff6e4"/><path d="M-3.6 4.4L0 -5L3.6 4.4M-2 .8H2" fill="none" stroke="#3b2612" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>') },
    src: 'lab/rimword.html', hud: 'compact',
    fonts: ['https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Nunito:wght@600;800&display=swap'],
    theme: {
      '--sk-bg': 'radial-gradient(120% 80% at 50% 0%, #fbf5e9 0%, #f3ead8 60%, #e8dcc3 100%)',
      '--sk-ink': INK,
      '--sk-accent': GOLD,
      '--sk-card': CREAM,
      '--sk-card-ink': INK,
      '--sk-hud': 'linear-gradient(180deg, rgba(251,245,233,.96), rgba(243,234,216,.94))',
      '--sk-btn': 'linear-gradient(180deg, #f0d7a4, #c9954a)',
      '--sk-btn-ink': '#3b2612',
      '--sk-btn-shadow': EDGE,
      '--sk-font': FONT,
      '--sk-radius': '16px',
      '--sk-chip': CREAM,
      '--sk-chip-ink': INK,
      '--sk-edge': EDGE,
      '--sk-btn2': CREAM,
      '--sk-btn2-ink': INK,
      '--sk-coin': 'linear-gradient(180deg, #f0d7a4, #c9954a)',
      '--sk-star-on': '#c9954a', '--sk-star-edge': '#6b4a20', '--sk-star-off': '#5d6b52', '--sk-star-off-edge': '#2e3828',
      '--sk-ctl': '#fffaf0', '--sk-ctl-ink': '#3a2a1a', '--sk-ctl-edge': '#a8763a',
    },
    css: '--text:#3a2a1a;--dim:#8a7458;--faint:#a89478;--bg2:#fffaf0;--line:#e0d2b8;' +
      '.btn3d{letter-spacing:.01em;text-shadow:none}' +
      '.coins,.goalbar,.starbar,.badge{color:#3a2a1a}' +
      '.skins button[aria-checked="true"]{color:#3b2612}' +
      '.tl .tin{transition:transform .12s}.tl.lit .tin{transform:scale(1.12)}.tl.glow .tin{filter:drop-shadow(0 0 5px #c9a15a)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: 'ABC', board: 'radial-gradient(ellipse at 50% 20%, #45a866, #1d5e36 80%)', line: '#ffe7a8',
      games: ['chain', 'stack'], intro: 'spin',
      tile(x, y, r, e, k) {
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + gem(e, r * .8) + '</g></g>';
      },
    },
    eggs: [
      { id: 'hidden-word', on: 'page', note: 'a three-letter animal hides round the ring of tiles (either way): its letters shimmer', pays: true },
      { id: 'lucky-tile', on: 'win', p: 0.08, run(fx) { if (!fx) return; fx.burst && (fx.burst('🔤', .5, .4), fx.burst('✨', .4, .46)); fx.sound && fx.sound('chime'); fx.pay && fx.pay(40); } },
    ],
    map: {
      sea: ['#f6efe2', '#efe4d2', '#e8dcc4', '#e0d2b4', '#d8c8a6', '#d0be98', '#c8b48a', '#c0aa7e', '#b8a072'],
      seaX: PAPER, unknown: '#e7dccb',
      ramp: ['#2f8f4e', '#c9a15a', '#d4893a', '#b5452f'],
      grey: '#b9ab95', route: INK, ink: 'rgba(58,42,26,.75)',
      cell(path, x, y, r) {
        path.moveTo(x - r * .7, y - r * .7);
        path.lineTo(x + r * .7, y - r * .7);
        path.lineTo(x + r * .7, y + r * .7);
        path.lineTo(x - r * .7, y + r * .7);
        path.closePath();
      },
    },
    words: { win: 'A word!', perfect: 'Perfect spelling!', par: 'Par {par} flips', chart: 'THE LADDER' },
    levelMap: (function () {
      const TINT = {
        cove: ['#f7e7c8', '#e0c48a'], beach: ['#f3ead8', '#d7c4a0'], town: ['#fffaf0', '#e0d2b8'],
        harbour: ['#e7eef2', '#b7c8d4'], forest: ['#e5f0dc', '#b7d0a8'], cape: ['#f6e4c4', '#e0c48a'],
        reef: ['#f8e4dc', '#e4c2b4'], cave: ['#ece4f2', '#cfc0dc'], volcano: ['#f6ddd0', '#e4b49a'],
      };
      const lock = '<rect x="-6" y="-2" width="12" height="9" rx="2" fill="#8f8270"/><path d="M-3.4 -2v-3.2a3.4 3.4 0 0 1 6.8 0V-2" fill="none" stroke="#8f8270" stroke-width="1.8"/>';
      return {
        bg: PAPER,
        defs: '<pattern id="rimwordRule" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 21.5H22" stroke="#d7c4a0" stroke-width=".6"/></pattern>',
        backdrop(H) { return '<rect width="400" height="' + H + '" fill="#f3ead8"/><rect width="400" height="' + H + '" fill="url(#rimwordRule)"/>'; },
        zone(z) {
          const t = TINT[z.theme] || TINT.town, x = z.x0 + 10, y = z.y0 + 6, w = z.x1 - z.x0 - 20, h = z.y1 - z.y0 - 12;
          return '<g><rect x="' + (x + 2) + '" y="' + (y + 4) + '" width="' + w + '" height="' + h + '" rx="18" fill="#6b4a20" opacity=".08"/>' +
            '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="18" fill="' + t[0] + '" stroke="' + t[1] + '" stroke-width="2"/></g>';
        },
        decor(theme, r) {
          const ch = theme === 'forest' ? 'A' : theme === 'volcano' ? 'E' : r < .5 ? 'B' : 'L';
          return '<rect x="-9" y="-9" width="18" height="18" rx="4" fill="#e9c58f" stroke="#a8763a" stroke-width="1.2"/>' +
            '<text y="5" text-anchor="middle" font-family="' + FONT + '" font-size="13" font-weight="800" fill="#3b2612">' + ch + '</text>';
        },
        sign(label, w) {
          const name = String(label).replace(/^\S+\s+/, '');
          return '<rect width="' + w + '" height="28" rx="8" fill="#fffaf0" stroke="#a8763a" stroke-width="1.6"/>' +
            '<text x="' + (w / 2) + '" y="19" text-anchor="middle" font-family="' + FONT + '" font-size="14" font-weight="700" fill="#3a2a1a">' + name + '</text>';
        },
        road: { todo: ['#e0d2b8', '#d7a964', '#a8763a'], done: ['#e0d2b8', '#c9a15a', '#3a2a1a'], widths: [14, 8, 2], dash: '2 8', cap: 'round' },
        node(state, num, e, boss) {
          const R = boss ? 28 : 24, fs = num.length > 2 ? 11 : num.length > 1 ? 14 : 18;
          const face = state === 'locked' ? '#e7dccb' : state === 'beaten' ? '#c9a15a' : WOOD;
          const txt = '<text y="' + f1(fs * .36) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs + '" font-weight="800" fill="#3b2612">' + num + '</text>';
          const box = '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="8" fill="' + face + '" stroke="#a8763a" stroke-width="2"/>';
          if (state === 'locked') return box + '<g transform="translate(0 2)">' + lock + '</g>';
          if (state === 'current') return '<rect x="' + (-R - 4) + '" y="' + (-R - 4) + '" width="' + (R * 2 + 8) + '" height="' + (R * 2 + 8) + '" rx="10" fill="none" stroke="#c9a15a" stroke-width="3"/>' + box + txt;
          return box + txt;
        },
        start() {
          return '<rect x="-18" y="-14" width="36" height="28" rx="6" fill="#fffaf0" stroke="#a8763a" stroke-width="2"/>' +
            '<text y="5" text-anchor="middle" font-family="' + FONT + '" font-size="12" font-weight="800" fill="#3a2a1a">GO</text>' +
            '<text y="34" text-anchor="middle" font-family="' + FONT + '" font-size="11" font-weight="700" letter-spacing="1" fill="#3a2a1a">START</text>';
        },
        pin() {
          return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="#e9c58f" stroke="#3a2a1a" stroke-width="2"/>' +
            '<text y="-1" text-anchor="middle" font-family="' + FONT + '" font-size="14" font-weight="800" fill="#3b2612">A</text>';
        },
      };
    })(),
  });
})();
