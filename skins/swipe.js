// Bonus Swipe: an arcade jackpot. Violet night, neon element hexes with gold coins, glowing swipe lines. See SKIN-SPEC.md.
// Colours and icons match lab/swipe.html (0 fire, 1 water, 2 air, 3 earth).
(function () {
  const BODY = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'], DARK = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'], NEON = ['#ff7a52', '#5ab4ff', '#ffe066', '#5cff8a'];
  const NAMES = ['fire', 'water', 'air', 'earth'];
  const EDGE = '#1c1640', GOLD = '#ffd84a', GOLD2 = '#b06a00', CREAM = '#fff6c8';
  const ICON = ['M12 2c.8 3.6 5.5 5.8 5.5 11.2A5.5 5.5 0 0 1 6.5 13.2c0-2.6 1.6-4 2-6.4 1.2 1 2.2 2.4 2.3 4.4 1-1.9 1.4-5.4 1.2-9.2z',
    'M12 2.5C9.2 7 5.5 10.6 5.5 15a6.5 6.5 0 0 0 13 0c0-4.4-3.7-8-6.5-12.5z',
    'M3 8.5h10.5a3 3 0 1 0-3-3M3 12.5h14.5a3 3 0 1 1-3 3M3 16.5h7',
    'M5 19.5C5 10 11 4.5 20 4.5c0 9.5-5.5 15-15 15z'];
  const f1 = n => Math.round(n * 10) / 10;
  const hexP = (a, rot) => Array.from({ length: 6 }, (_, q) => { const t = Math.PI / 3 * q - Math.PI / 2 + (rot || 0); return f1(a * Math.cos(t)) + ',' + f1(a * Math.sin(t)); }).join(' ');
  const icon = (e, sc, extra) => '<path d="' + ICON[e] + '" transform="translate(' + f1(-12 * sc) + ' ' + f1(-12 * sc) + ') scale(' + sc + ')" ' +
    (e === 2 ? 'fill="none" stroke="' + NEON[e] + '" stroke-width="' + f1(2.4) + '" stroke-linecap="round"' : 'fill="' + NEON[e] + '"') + (extra || '') + '/>';
  // a cartoon neon tile centred at (0,0): shadow, body, neon rim, black plate, icon
  const tileBody = (R, e, cls) => {
    const sw = f1(R * .1), sc = f1(R * .58 / 12);
    return '<polygon points="' + hexP(R) + '" fill="' + DARK[e] + '" stroke="' + EDGE + '" stroke-width="' + sw + '" stroke-linejoin="round" transform="translate(0 ' + f1(R * .16) + ')"/>' +
      '<polygon points="' + hexP(R) + '" fill="' + BODY[e] + '" stroke="' + EDGE + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<polygon class="' + (cls || 'rm') + '" points="' + hexP(R * .78) + '" fill="none" stroke="' + NEON[e] + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<polygon points="' + hexP(R * .64) + '" fill="#07090d" stroke-linejoin="round"/>' + icon(e, sc);
  };
  const tileAt = (x, y, R, e) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')">' + tileBody(R, e) + '</g>';
  const coin = (x, y, s) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') scale(' + (s || 1) + ')"><circle cy="1.8" r="11" fill="#c27a00" stroke="' + EDGE + '" stroke-width="2"/><circle r="11" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="2"/>' +
    '<circle r="7.4" fill="none" stroke="#f0a91c" stroke-width="1.8"/><path d="M0 -4.8L1.4 -1.4 4.8 0 1.4 1.4 0 4.8-1.4 1.4-4.8 0-1.4-1.4Z" fill="' + CREAM + '" stroke="#c27a00" stroke-width=".8"/>' +
    '<path d="M-6.5 -6A9 9 0 0 1 1 -9.2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/></g>';
  const FONT = "'Lilita One','Fredoka','Baloo 2',ui-rounded,system-ui,sans-serif";
  const say = (x, y, s, t, col, anchor) => '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-family="' + FONT + '" font-size="' + s + '" fill="' + (col || '#fff') + '" stroke="' + EDGE + '" stroke-width="' + f1(s / 7) + '" paint-order="stroke" stroke-linejoin="round">' + t + '</text>';
  const night = '<defs><radialGradient id="nb" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#4a35c4"/><stop offset="1" stop-color="#1b1360"/></radialGradient></defs><rect width="300" height="250" rx="18" fill="url(#nb)"/>' +
    [[24, 30], [270, 24], [40, 220], [262, 214], [150, 14], [12, 120], [288, 126]].map((s, i) => '<path class="st" style="animation-delay:' + (i * .35) + 's" d="M' + s[0] + ' ' + (s[1] - 5) + 'L' + (s[0] + 1.4) + ' ' + (s[1] - 1.4) + ' ' + (s[0] + 5) + ' ' + s[1] + ' ' + (s[0] + 1.4) + ' ' + (s[1] + 1.4) + ' ' + s[0] + ' ' + (s[1] + 5) + ' ' + (s[0] - 1.4) + ' ' + (s[1] + 1.4) + ' ' + (s[0] - 5) + ' ' + s[1] + ' ' + (s[0] - 1.4) + ' ' + (s[1] - 1.4) + 'Z" fill="' + CREAM + '" opacity=".8"/>').join('');
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const svg = (inner, anim) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg"><style>' + RM('.st{animation:tw 2.4s ease-in-out infinite alternate}@keyframes tw{from{opacity:.3}to{opacity:1}}' + (anim || '')) + '</style>' + night + inner + '</svg>';
  const rimPos = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const goldHex = (cx, cy, R, pulse) => '<g' + (pulse ? ' class="gh"' : '') + ' transform="translate(' + cx + ' ' + cy + ')"><polygon points="' + hexP(R * 1.1) + '" fill="none" stroke="' + GOLD + '" stroke-width="3" stroke-linejoin="round" opacity=".55"/>' +
    '<polygon points="' + hexP(R) + '" fill="' + GOLD2 + '" stroke="' + EDGE + '" stroke-width="3" stroke-linejoin="round" transform="translate(0 3)"/><polygon points="' + hexP(R) + '" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<polygon points="' + hexP(R * .72) + '" fill="none" stroke="' + CREAM + '" stroke-width="2.4" stroke-linejoin="round"/>' + coin(0, 0, R / 15) + '</g>';
  const glowLine = (d, col) => '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".28"/><path d="' + d + '" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 7"/>';
  const finger = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 0 C-3 -8 -3 -18 2 -22 C6 -20 6 -12 5 -6 L14 -4 C20 -2 18 8 12 12 L2 16 C-4 14 -4 6 0 0Z" fill="#ffe0bd" stroke="' + EDGE + '" stroke-width="2" stroke-linejoin="round"/></g>';
  const GH = '.gh{animation:gp 1.4s ease-in-out infinite alternate}@keyframes gp{from{opacity:.75}to{opacity:1}}';

  // ---- title art: a jackpot ring of five neon hexes round a golden tile ----
  const T = rimPos(150, 118, 66);
  const titleSvg = svg(T.map((p, i) => tileAt(p[0], p[1], 27, [0, 1, 2, 3, 1][i])).join('') + goldHex(150, 118, 30, true) +
    say(150, 226, 24, 'JACKPOT', GOLD), GH + '.cn{animation:hp 2.2s ease-in-out infinite}@keyframes hp{0%,60%,100%{transform:translateY(0)}75%{transform:translateY(-6px)}}');

  // ---- how to play ----
  // 1: the goal
  const p1 = svg(rimPos(150, 112, 62).map((p, i) => tileAt(p[0], p[1], 26, [0, 1, 2, 3, 1][i])).join('') + goldHex(150, 112, 28, true) +
    say(150, 214, 19, 'five tiles ring the gold', '#fff') + say(150, 237, 17, 'four kinds: no jackpot', NEON[0]), GH);
  // 2: the swipe along two kinds
  const sx = [48, 104, 160, 216], sy = [96, 128, 96, 128];
  const trail = 'M' + sx[0] + ' ' + sy[0] + ' L' + sx[1] + ' ' + sy[1] + ' L' + sx[2] + ' ' + sy[2] + ' L' + sx[3] + ' ' + sy[3];
  const p2 = svg(
    [0, 1, 2, 3].map(i => tileAt(sx[i], sy[i], 24, i % 2 ? 1 : 0)).join('') + tileAt(262, 96, 20, 3) + tileAt(76, 178, 20, 2) + tileAt(190, 176, 20, 3) +
    '<g class="tr">' + glowLine(trail, NEON[0]) + '</g><g class="fg">' + finger(0, 0) + '</g>' +
    say(150, 42, 20, 'one swipe, two kinds', '#fff') + say(150, 232, 17, 'fire, water, fire, water...', GOLD),
    '.tr{stroke-dasharray:320;animation:dw 3s ease-in-out infinite}@keyframes dw{0%{stroke-dashoffset:320}60%,100%{stroke-dashoffset:0}}' +
    '.fg{animation:mv 3s ease-in-out infinite}@keyframes mv{0%{transform:translate(48px,98px)}15%{transform:translate(104px,130px)}30%{transform:translate(160px,98px)}45%,100%{transform:translate(216px,130px)}}');
  // 3: the flip + two pairs and a single
  const q = rimPos(150, 100, 52);
  const p3 = svg(q.map((p, i) => tileAt(p[0], p[1], 22, [0, 1, 2, 2, 1][i])).join('') + goldHex(150, 100, 24, true) +
    '<g transform="translate(52 196)"><rect x="-40" y="-22" width="80" height="44" rx="22" fill="rgba(18,22,70,.6)" stroke="#fff" stroke-width="2.4"/><g transform="translate(-16 0)">' + tileBody(15, 1) + '</g><g transform="translate(16 0)">' + tileBody(15, 1) + '</g></g>' +
    '<g transform="translate(150 196)"><rect x="-40" y="-22" width="80" height="44" rx="22" fill="rgba(18,22,70,.6)" stroke="#fff" stroke-width="2.4"/><g transform="translate(-16 0)">' + tileBody(15, 2) + '</g><g transform="translate(16 0)">' + tileBody(15, 2) + '</g></g>' +
    '<g transform="translate(248 196)"><rect x="-22" y="-22" width="44" height="44" rx="22" fill="rgba(18,22,70,.6)" stroke="rgba(255,255,255,.4)" stroke-width="2.4"/>' + tileBody(15, 0) + '</g>' +
    say(150, 240, 17, 'two pairs + one on the ring = JACKPOT', GOLD), GH);
  // 4: a lock
  const lp = rimPos(150, 104, 56);
  const p4 = svg(lp.map((p, i) => tileAt(p[0], p[1], 24, [0, 1, 0, 1, 2][i])).join('') + goldHex(150, 104, 26, false) +
    '<g class="lk"><g transform="translate(150 188)"><path d="M-11 -5 V-13 A11 11 0 0 1 11 -13 V-5" fill="none" stroke="' + EDGE + '" stroke-width="6" stroke-linecap="round"/><path d="M-11 -5 V-13 A11 11 0 0 1 11 -13 V-5" fill="none" stroke="' + CREAM + '" stroke-width="3" stroke-linecap="round"/>' +
    '<rect x="-16" y="-5" width="32" height="24" rx="6" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="3"/><circle cy="6" r="3.4" fill="' + EDGE + '"/></g></g>' +
    say(150, 232, 16, 'a trail through every tile: the coins spill', NEON[0]),
    '.lk{transform-box:fill-box;transform-origin:50% 100%;animation:sh 2.6s ease-in-out infinite}@keyframes sh{0%,75%,100%{transform:rotate(0)}80%{transform:rotate(-9deg)}88%{transform:rotate(9deg)}95%{transform:rotate(-4deg)}}');
  // 5: the win
  const wp = rimPos(150, 104, 56);
  const p5 = svg(wp.map((p, i) => tileAt(p[0], p[1], 24, [0, 1, 2, 2, 1][i])).join('') + goldHex(150, 104, 26, true) +
    [[96, 40, 1], [208, 44, .8], [60, 120, .9], [244, 126, 1], [120, 18, .7], [186, 20, .8]].map((c, i) => '<g class="cn" style="animation-delay:' + (i * .25) + 's">' + coin(c[0], c[1], c[2]) + '</g>').join('') +
    say(150, 196, 28, 'JACKPOT!', GOLD) + say(150, 228, 17, 'the gold tile takes the free kind', '#fff'),
    GH + '.cn{animation:hp 1.8s ease-in-out infinite}@keyframes hp{0%,60%,100%{transform:translateY(0)}75%{transform:translateY(-7px)}}');

  const hexPath = (path, x, y, r) => {                 // rounded pointy-top hex
    const P = Array.from({ length: 6 }, (_, q) => { const t = Math.PI / 3 * q - Math.PI / 2; return [x + r * Math.cos(t), y + r * Math.sin(t)]; });
    for (let i = 0; i < 6; i++) {
      const a = P[i], b = P[(i + 1) % 6], c = P[(i + 5) % 6], k = 0.18;
      const sx = a[0] + (c[0] - a[0]) * k, sy = a[1] + (c[1] - a[1]) * k, ex = a[0] + (b[0] - a[0]) * k, ey = a[1] + (b[1] - a[1]) * k;
      if (i) path.lineTo(sx, sy); else path.moveTo(sx, sy);
      path.quadraticCurveTo(a[0], a[1], ex, ey);
    }
    path.closePath();
  };

  FTH_SKINS.register({
    id: 'swipe', name: 'Bonus Swipe', ic: '🎰', blurb: 'swipe two kinds, hit the jackpot',
    src: 'lab/swipe.html', hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(120% 80% at 50% 0%, #6a4cf0 0%, #3a28b0 50%, #1b1360 100%), #1b1360',
      '--sk-ink': '#ffffff',
      '--sk-accent': GOLD,
      '--sk-card': 'linear-gradient(180deg, #3b2aa8, #231a73)',
      '--sk-card-ink': '#f1edff',
      '--sk-hud': 'linear-gradient(180deg, #2a1d85, #1b1360)',
      '--sk-btn': 'linear-gradient(180deg, #ffe46b, #ffc21a)',
      '--sk-btn-ink': '#4a2a00',
      '--sk-btn-shadow': GOLD2,
      '--sk-font': "'Lilita One', 'Fredoka', 'Baloo 2', ui-rounded, system-ui, sans-serif",
      '--sk-radius': '20px',
      '--sk-chip': 'linear-gradient(180deg, #2c2088, #1d1562)',
      '--sk-chip-ink': '#f1edff',
      '--sk-edge': GOLD,
      '--sk-btn2': 'linear-gradient(180deg, #3d2fae, #241a7a)',
      '--sk-btn2-ink': '#ffe9a6',
      '--sk-coin': 'linear-gradient(180deg, #ffe46b, #ffb81a)',
    },
    css: '.tl .tr,.tl .rm{transition:stroke .15s}.tl.lit .rm{stroke:#fff}.tl.lit .tin{filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 3px currentColor)}' +
      '.tl.glow .tin{filter:drop-shadow(0 0 10px #ffd84a) drop-shadow(0 0 4px #fff)}' +
      // chrome: neon pills and arcade buttons (violet bodies, gold and magenta rims, glow from box-shadow)
      '.btn3d{border-radius:16px;text-transform:uppercase;letter-spacing:.08em;font-size:1.05em;box-shadow:0 5px 0 var(--sh),0 0 14px rgba(255,216,74,.4)}' +
      '.btn3d:active{box-shadow:0 1px 0 var(--sh),0 0 10px rgba(255,216,74,.4)}' +
      '.btn3d.white,.btn3d.yellow,.btn3d.blue,.btn3d.orange{border:2px solid #ff4fd8;--sh:#7a1a6a;box-shadow:0 5px 0 #7a1a6a,0 0 12px rgba(255,79,216,.55)}' +
      '.btn3d.go{border:2px solid #fff6c8;box-shadow:0 5px 0 #b06a00,0 0 18px rgba(255,216,74,.7)}' +
      '.rbtn,.rbtn.sm{border-radius:14px}' +
      '.bar .rb{border:2px solid #ffd84a;border-radius:16px}' +
      '.badge,.goalbar,.starbar,.mnode .mst,.mnode .mtag{border-width:2px;border-style:solid;box-shadow:0 0 10px rgba(255,216,74,.35)}' +
      '.badge,.goalbar,.starbar{border-radius:999px}' +
      '.mnode .mtag,.mnode .mst{font-family:var(--sk-font);letter-spacing:.04em}' +
      '.say .msg{border-width:2px;border-style:solid;border-radius:16px;box-shadow:0 0 12px rgba(255,79,216,.45)}' +
      '.say .msg::before{border-right-color:#ffd84a}.say .msg::after{border-right-color:#231a6e}' +
      '.coins{border-width:2px;font-family:var(--sk-font);box-shadow:0 0 14px rgba(255,216,74,.6),inset 0 -3px 0 rgba(176,106,0,.45)}' +
      '.mnode .pulse{border-color:#ff4fd8;box-shadow:0 0 12px #ff4fd8}' +
      '.htnum{box-shadow:0 0 14px rgba(255,216,74,.6)}' +
      '.skins button{border-radius:14px}.skins button[aria-checked="true"]{box-shadow:0 0 12px rgba(255,216,74,.7)}' +
      '#brief .card,#win .card,#installSheet .card{border-radius:var(--sk-radius);border:2px solid #ffd84a;box-shadow:0 0 28px rgba(138,108,255,.6)}' +
      '#installSheet .card{background:var(--sk-card);color:var(--sk-card-ink)}#installSheet h2{font-family:var(--sk-font);color:var(--sk-ink)}' +
      '#briefGo{--sh:#b06a00;background:var(--sk-btn);color:var(--sk-btn-ink);box-shadow:0 5px 0 #b06a00,0 0 18px rgba(255,216,74,.7);border:2px solid #fff6c8}' +
      '#briefGo:active{box-shadow:0 1px 0 #b06a00,0 0 12px rgba(255,216,74,.6)}' +
      '#bonus .bhead{flex-wrap:wrap;row-gap:4px}#bonus #bonusMsg{order:1;flex:1 0 100%;font-size:.84rem;line-height:1.25}',
    fonts: ['https://fonts.googleapis.com/css2?family=Lilita+One&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'Ring the jackpot', text: 'The golden tile is empty. Five neon tiles ring it, and together they wear all four kinds, so it will not pay out.', svg: p1 },
      { title: 'Swipe two kinds', text: 'Press a tile and drag across the bridges, hopping between two kinds only: fire, water, fire, water. Let go to flip the whole glowing group.', svg: p2 },
      { title: 'Two pairs and one', text: 'Aim for a gold ring with two pairs and a single: only three kinds. Hold a tile to pick a kind from bubbles instead.', svg: p3 },
      { title: 'Locked trails', text: 'If a trail of two kinds is the only one on the board, flipping it just renames the kinds. The coins spill and nothing changes.', svg: p4 },
      { title: 'Jackpot!', text: 'When the ring shows only three kinds, the golden tile takes the free fourth and the coins pour out.', svg: p5 },
    ],
    bonus: {
      label: 'JACKPOT BONUS',
      board: 'radial-gradient(90% 90% at 50% 0%, rgba(138,108,255,.45), rgba(18,22,70,.55)), rgba(18,22,70,.5)',
      line: '#ffd84a',
      tile(x, y, r, e, k) {
        const R = r * .94;
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + tileBody(R, e) +
          '<g transform="translate(' + f1(R * .5) + ' ' + f1(R * .46) + ') scale(' + f1(R / 30) + ')"><circle cy="1.8" r="11" fill="#c27a00"/><circle r="11" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="2"/><circle r="6.5" fill="none" stroke="#f0a91c" stroke-width="1.8"/></g>' +
          '</g></g>';
      },
    },
    map: {
      sea: ['#4a3fa8', '#3e3596', '#342c84', '#2b2472', '#221d60', '#1a164e', '#130f3d', '#0d0a2e', '#08061f'],
      seaX: '#05030f',
      fog: '#030208',
      unknown: '#6a5a9a',
      ramp: ['#5cff8a', '#ffe066', '#ff9a52', '#ff4f6e'],
      grey: '#8f87b8',
      route: '#ffd84a',
      ink: 'rgba(222,214,255,.88)',
      cell: hexPath,
    },
    levelMap: (function () {
      const NC = { cove: '#3de6ff', beach: '#ff9a5c', town: '#ff4fd8', harbour: '#5aa0ff', forest: '#5cff8a', cape: '#ffe066', reef: '#ff7ab8', cave: '#b57aff', volcano: '#ff6a2a' };
      const FL = { cove: '#2a6fc0', beach: '#a8408a', town: '#7a30c0', harbour: '#2f56c0', forest: '#1f8a58', cape: '#6a62c8', reef: '#b03a8a', cave: '#6a3ac8', volcano: '#a83220' };
      const PLATE = '#0b0726', VIO = '#8a6cff';
      const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pa = (d, a) => '<path d="' + d + '" ' + a + '/>';
      // a neon line: a wide faint halo, the coloured tube, a white-hot core (no filters)
      const N = (d, c, w) => pa(d, 'fill="none" stroke="' + c + '" stroke-width="' + f1(w * 2.8) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".24"') +
        pa(d, 'fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"') +
        pa(d, 'fill="none" stroke="#fff" stroke-width="' + f1(w * .32) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".8"');
      const PL = (d, fill, c, w) => pa(d, 'fill="' + fill + '" stroke="' + c + '" stroke-width="' + (w || 1.8) + '" stroke-linejoin="round"');
      const shadow = (rx, y) => '<ellipse cy="' + (y || 8) + '" rx="' + rx + '" ry="' + f1(rx * .32) + '" fill="#05031a" opacity=".55"/>';
      const spark = (x, y, s, c) => '<path d="M' + x + ' ' + f1(y - s) + 'L' + f1(x + s * .28) + ' ' + f1(y - s * .28) + ' ' + f1(x + s) + ' ' + y + ' ' + f1(x + s * .28) + ' ' + f1(y + s * .28) + ' ' + x + ' ' + f1(y + s) + ' ' + f1(x - s * .28) + ' ' + f1(y + s * .28) + ' ' + f1(x - s) + ' ' + y + ' ' + f1(x - s * .28) + ' ' + f1(y - s * .28) + 'Z" fill="' + (c || CREAM) + '"/>';
      const pick = (a, r) => a[Math.floor(r * a.length) % a.length];
      const gem = (x, y, s, c) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><polygon points="0,-20 8,-8 0,6 -8,-8" fill="' + c + '" stroke="' + EDGE + '" stroke-width="1.8" stroke-linejoin="round"/><polygon points="0,-20 8,-8 0,-6" fill="#fff" opacity=".4"/><polygon points="-8,-8 8,-8 0,6" fill="none" stroke="#fff" stroke-width=".8" opacity=".5"/></g>';
      const stack = () => shadow(11) + [4, -2, -8].map((y, i) => '<ellipse cx="' + (i % 2 ? 1.5 : -1) + '" cy="' + (y + 2) + '" rx="10" ry="4.5" fill="#c27a00" stroke="' + EDGE + '" stroke-width="1.6"/><ellipse cx="' + (i % 2 ? 1.5 : -1) + '" cy="' + y + '" rx="10" ry="4.5" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="1.6"/>').join('') + spark(10, -16, 4);
      const star = r => N('M0 -9L2.6 -3 9 -2.4 4 1.8 5.6 8 0 4.6-5.6 8-4 1.8-9-2.4-2.6-3Z', pick([GOLD, '#ff7ae8', '#5ae8ff'], r), 1.8);
      const lamp = c => shadow(6, 12) + '<rect x="-1.6" y="-14" width="3.2" height="26" rx="1.6" fill="#2b2170" stroke="' + EDGE + '" stroke-width="1.4"/>' + '<circle cy="-18" r="10" fill="' + c + '" opacity=".25"/><circle cy="-18" r="5.2" fill="' + c + '" stroke="' + EDGE + '" stroke-width="1.6"/><circle cx="-1.6" cy="-19.6" r="1.6" fill="#fff"/>';
      const cab = (r, r2) => { const c = pick([NEON[0], NEON[1], NEON[2], NEON[3], '#ff7ae8'], r2); return shadow(13) + PL('M-10 12V-16L-6 -22H6L10 -16V12Z', '#2a1d85', EDGE, 2) + pa('M-10 12V-16L-6 -22H6L10 -16V12Z', 'fill="none" stroke="' + c + '" stroke-width="1.2" transform="translate(0 -.3)" opacity=".9"') +
        '<rect x="-7" y="-15" width="14" height="11" rx="1.5" fill="' + PLATE + '" stroke="' + c + '" stroke-width="1.6"/><path d="M-4 -9H4M0 -12V-6" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round"/>' +
        '<circle cx="-3.5" cy="6" r="1.8" fill="' + GOLD + '"/><circle cx="3.5" cy="6" r="1.8" fill="#ff5a5a"/><rect x="-8" y="-21" width="16" height="3" rx="1.5" fill="' + c + '"/>'; };
      const pine = (c) => '<circle cy="-12" r="19" fill="' + c + '" opacity=".13"/><rect x="-2" y="2" width="4" height="7" fill="#3a2870"/>' + PL('M0 -30L11 -8H-11Z M0 -20L14 3H-14Z', '#0f3a2a', EDGE, 1.6) + N('M0 -30L11 -8H-11Z M0 -20L14 3H-14Z', c, 1.3) + spark(0, -32, 3.5, '#fff');
      const KIND = {
        cove: [r => N('M-16 -5q4 -7 8 0t8 0t8 0t8 0', '#3de6ff', 1.7) + N('M-12 5q4 -7 8 0t8 0t8 0', '#8ab4ff', 1.5),
          () => shadow(9, 9) + '<circle r="9" fill="#fff6c8" stroke="' + EDGE + '" stroke-width="1.8"/><path d="M-9 0A9 9 0 0 1 0 -9V0Z" fill="#ff5a5a"/><path d="M9 0A9 9 0 0 1 0 9V0Z" fill="#5ab4ff"/><path d="M0 -9A9 9 0 0 1 9 0H0Z" fill="#ffd84a"/><circle r="9" fill="none" stroke="' + EDGE + '" stroke-width="1.8"/><circle r="13" fill="none" stroke="#3de6ff" stroke-width="2" opacity=".3"/>',
          () => shadow(10, 6) + PL('M-9 4Q0 -14 9 4Z', '#2a1050', '#ff7ab8', 2) + N('M0 4V-6M-4.5 4L-3 -4M4.5 4L3 -4', '#ff7ab8', 1.1),
          () => shadow(11, 8) + '<circle r="15" fill="#3de6ff" opacity=".14"/><ellipse cy="2" rx="11" ry="7" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="1.8"/><circle cx="7" cy="-7" r="5.5" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="1.8"/><path d="M12 -7L17 -5.5L12 -4Z" fill="#ff8a3d" stroke="' + EDGE + '" stroke-width="1.4"/><circle cx="8.5" cy="-8.5" r="1.3" fill="' + EDGE + '"/>', star,
          () => N('M-14 2q4 -6 8 0t8 0t8 0', '#5ae8ff', 1.6) + N('M-2 -6L2 -14 6 -6Z M2 -6V5', '#ffe066', 1.4)],
        beach: [() => shadow(12) + N('M1 8Q6 -6 0 -22', '#ffd84a', 2.4) + N('M0 -22q-8 -2 -13 6M0 -22q8 -3 14 4M0 -22q-3 -9 -12 -9M0 -22q4 -9 12 -7', '#ff6fd0', 2)+ '<circle cy="-17" r="2.6" fill="' + GOLD + '"/>',
          r => shadow(12) + '<path d="M0 10V-12" stroke="#2b2170" stroke-width="2.6"/>' + PL('M-15 -10A15 11 0 0 1 15 -10Z', '#0f0a3a', '#ff9a5c', 2) + N('M-15 -10A15 11 0 0 1 15 -10M-5 -10Q-6 -17 0 -21M5 -10Q6 -17 0 -21', pick(['#ff9a5c', '#ff6fd0', '#5ae8ff'], r), 1.3),
          () => N('M0 -7A7 7 0 1 0 .1 -7M0 -14V-18M0 14V18M-14 0H-18M14 0H18M-10 -10l-3 -3M10 10l3 3M10 -10l3 -3M-10 10l-3 3', '#ff9a5c', 1.6),
          () => shadow(9, 9) + '<circle r="9" fill="#fff6c8" stroke="' + EDGE + '" stroke-width="1.8"/><path d="M-9 0A9 9 0 0 1 0 -9V0Z" fill="#ff5a5a"/><path d="M9 0A9 9 0 0 1 0 9V0Z" fill="#ff9a5c"/><circle r="9" fill="none" stroke="' + EDGE + '" stroke-width="1.8"/>',
          () => coin(0, 0, 1), star],
        town: [cab, cab, () => lamp('#ff4fd8'), stack, () => lamp('#ffe066'), star,
          () => shadow(14) + PL('M-13 8V-6H13V8Z', '#2a1d85', EDGE, 2) + '<rect x="-10" y="-3" width="20" height="8" rx="2" fill="' + PLATE + '" stroke="#ff4fd8" stroke-width="1.6"/>' + N('M-6 1H6', '#ff4fd8', 1.6) + N('M-8 -12L0 -20 8 -12', '#5ae8ff', 1.6)],
        harbour: [r => shadow(15, 12) + PL('M-15 4H15L10 12H-10Z', '#2a1d85', EDGE, 1.8) + PL('M-1 2V-24L11 2Z', '#0b0726', '#5aa0ff', 1.6) + PL('M-3 2V-16L-13 2Z', '#0b0726', '#ff7ae8', 1.6) + '<path d="M-1 -24V2" stroke="#fff" stroke-width="1.4"/><path d="M-12 7H12" stroke="#5aa0ff" stroke-width="1.6" opacity=".8"/>',
          () => shadow(12) + PL('M-10 -10H10V10H-10Z', '#3a2a8a', EDGE, 1.8) + N('M-8 -8L8 8M8 -8L-8 8', '#ffb347', 1.3) + '<rect x="-10" y="-10" width="20" height="20" fill="none" stroke="#ffb347" stroke-width="1.2" opacity=".7"/>',
          () => N('M0 -12V10M-7 -4H7M-10 2Q-8 11 0 11Q8 11 10 2', '#5aa0ff', 2) + '<circle cy="-14" r="3.6" fill="none" stroke="#5aa0ff" stroke-width="2"/>',
          () => shadow(10, 9) + '<circle r="9" fill="#fff" stroke="' + EDGE + '" stroke-width="1.8"/><circle r="9" fill="none" stroke="#5aa0ff" stroke-width="4.4" stroke-dasharray="7 7"/><circle r="4" fill="#1b1360" stroke="' + EDGE + '" stroke-width="1.6"/>',
          () => lamp('#5ae8ff'), stack],
        forest: [() => pine('#5cff8a'), () => pine('#ffe066'), () => pine('#5ae8ff'), () => pine('#5cff8a'),
          () => shadow(9, 6) + '<circle cy="-4" r="14" fill="#ff7ae8" opacity=".16"/><rect x="-2.6" y="-4" width="5.2" height="11" rx="2" fill="#fff4e0" stroke="' + EDGE + '" stroke-width="1.5"/>' + PL('M-11 -3A11 10 0 0 1 11 -3Z', '#4a1a8a', '#ff7ae8', 2) + '<circle cx="-4" cy="-8" r="1.8" fill="#ffe3fa"/><circle cx="4" cy="-7" r="1.4" fill="#ffe3fa"/>',
          () => [[-10, -4, 2.4], [6, -10, 2], [10, 5, 2.6], [-3, 7, 1.8]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + f1(p[2] * 3) + '" fill="#ffe066" opacity=".2"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#fff6c8"/>').join('')],
        cape: [r => shadow(13) + PL('M-13 7Q-14 -6 -4 -10Q8 -13 12 -2Q15 7 9 8Z', '#3a3a7a', EDGE, 1.8) + N('M-8 -7Q0 -12 8 -6', '#ffe066', 1.2),
          r => star(r), () => N('M-14 2q4 -6 8 0t8 0t8 0', '#c8c0ff', 1.6) + N('M-10 10q4 -6 8 0t8 0', '#8ab4ff', 1.4),
          () => N('M-11 0Q-6 -7 0 0Q6 -7 11 0', '#fff6c8', 1.8),
          () => shadow(10, 9) + '<circle r="8" fill="#fff" stroke="' + EDGE + '" stroke-width="1.8"/><circle r="8" fill="none" stroke="#ff5a5a" stroke-width="4" stroke-dasharray="6.3 6.3"/><circle r="3.6" fill="#1b1360" stroke="' + EDGE + '" stroke-width="1.6"/>',
          r => shadow(11) + PL('M-11 7Q-11 -5 -2 -7Q9 -9 11 7Z', '#4a4590', EDGE, 1.8) + spark(5, -13, 4, GOLD)],
        reef: [r => { const c = pick(['#ff7ab8', '#5ae8ff', '#ffe066', '#5cff8a'], r); return '<circle r="16" fill="' + c + '" opacity=".14"/>' + PL('M-11 0Q-2 -9 8 0Q-2 9 -11 0Z M8 0L15 -7V7Z', '#0f0a3a', c, 1.8) + N('M-11 0Q-2 -9 8 0Q-2 9 -11 0Z M8 0L15 -7V7Z', c, 1.3) + '<circle cx="-5" cy="-1.6" r="1.8" fill="#fff"/>'; },
          r => { const c = pick(['#ffe066', '#5ae8ff', '#ff7ab8'], r); return '<circle r="16" fill="' + c + '" opacity=".14"/>' + PL('M11 0Q2 -9 -8 0Q2 9 11 0Z M-8 0L-15 -7V7Z', '#0f0a3a', c, 1.8) + N('M11 0Q2 -9 -8 0Q2 9 11 0Z M-8 0L-15 -7V7Z', c, 1.3) + '<circle cx="5" cy="-1.6" r="1.8" fill="#fff"/>'; },
          r => N('M0 -9L2.6 -3 9 -2.4 4 1.8 5.6 8 0 4.6-5.6 8-4 1.8-9-2.4-2.6-3Z', '#ff9a5c', 2),
          () => [[-7, 3, 5], [4, -4, 4], [8, 7, 3], [-1, -12, 2.6]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#5ae8ff" fill-opacity=".14" stroke="#aef3ff" stroke-width="1.4"/>').join(''),
          () => N('M0 10V-2M0 4Q-6 0 -7 -8M0 4Q6 0 7 -8M0 -2Q-1 -10 1 -16', '#ff7ab8', 2), star],
        cave: [r => gem(0, 6, 1, pick(['#5ef2ff', '#ff7ae0', '#ffe066'], r)), r => gem(-6, 6, .9, '#5ef2ff') + gem(7, 8, .7, '#ff7ae0'), r => gem(0, 6, 1.15, pick(['#ff7ae0', '#9a7aff'], r)),
          () => shadow(11) + PL('M-9 8L-4 -14L0 8ZM-1 8L5 -20L10 8Z', '#2a1d6a', '#b57aff', 1.6),
          () => shadow(14, 10) + PL('M-13 9V-3Q-13 -12 0 -12Q13 -12 13 -3V9Z', '#3a2a8a', EDGE, 2) + '<rect x="-13" y="-2" width="26" height="4" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="1.4"/><rect x="-3" y="-4" width="6" height="8" rx="2" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="1.4"/>' + spark(10, -14, 4),
          () => coin(0, 0, 1)],
        volcano: [() => '<ellipse rx="15" ry="7" fill="#ff6a2a" stroke="' + EDGE + '" stroke-width="1.8"/><ellipse cx="-2" cy="-1" rx="8" ry="3.2" fill="' + GOLD + '"/><ellipse rx="19" ry="10" fill="none" stroke="#ff6a2a" stroke-width="2" opacity=".3"/>',
          () => N('M0 9V-14M0 -4L-8 -13M0 -8L7 -17', '#ff9a5c', 2.2), stack, () => shadow(12) + PL('M-10 8V-8Q-10 -11 -7 -11H7Q10 -11 10 -8V8Z', PLATE, '#ff4fd8', 2) + N('M-5 -5H4L-2 6', '#ffd84a', 2),
          r => shadow(12) + PL('M-11 7Q-11 -5 -2 -7Q9 -9 11 7Z', '#5a2a30', EDGE, 1.8) + N('M-6 -3L-2 1', '#ff6a2a', 1.4),
          () => '<ellipse rx="14" ry="6.5" fill="#ff6a2a" stroke="' + EDGE + '" stroke-width="1.8"/><ellipse cx="2" cy="-1" rx="7" ry="2.8" fill="#ffe066"/>']
      };
      const bulbs = (d, w, col) => pa(d, 'fill="none" stroke="' + (col || CREAM) + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="0 ' + f1(w * 3.4) + '"');
      return {
        bg: '#120c3a',
        defs: '<linearGradient id="swipeSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0830"/><stop offset=".55" stop-color="#1a1252"/><stop offset="1" stop-color="#2a1a78"/></linearGradient>' +
          '<radialGradient id="swipeGm"><stop offset="0" stop-color="#ff4fd8" stop-opacity=".45"/><stop offset="1" stop-color="#ff4fd8" stop-opacity="0"/></radialGradient>' +
          '<radialGradient id="swipeGc"><stop offset="0" stop-color="#3de6ff" stop-opacity=".4"/><stop offset="1" stop-color="#3de6ff" stop-opacity="0"/></radialGradient>' +
          '<radialGradient id="swipeGg"><stop offset="0" stop-color="#ffd84a" stop-opacity=".3"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>' +
          '<pattern id="swipeGrid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#fff" stroke-width="1" opacity=".07"/></pattern>' +
          Object.keys(FL).map(k => '<radialGradient id="swipeF' + k + '" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="' + FL[k] + '"/><stop offset=".45" stop-color="' + FL[k] + '"/><stop offset="1" stop-color="#1a1252"/></radialGradient>').join('') +
          '<linearGradient id="swipeVol" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a2a38"/><stop offset="1" stop-color="#2a0c24"/></linearGradient>',
        backdrop(H, rnd) {
          let s = '<rect width="400" height="' + H + '" fill="url(#swipeSky)"/>';
          for (let y = 60, k = 0; y < H; y += 190 + rnd(k, 1) * 120, k++) s += '<ellipse cx="' + f1(rnd(k, 2) * 400) + '" cy="' + f1(y) + '" rx="' + f1(150 + rnd(k, 3) * 90) + '" ry="' + f1(70 + rnd(k, 4) * 40) + '" fill="url(#swipe' + ['Gm', 'Gc', 'Gg'][k % 3] + ')"/>';
          let st = '', st2 = '';
          for (let k = 0; k < H / 11; k++) { const x = f1(rnd(k, 7) * 400), y = f1(rnd(k, 8) * H), r = f1(.7 + rnd(k, 9) * 1.1); const cc = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; if (k % 3) st += cc; else st2 += cc; }
          s += '<g fill="#cfc8ff" opacity=".7">' + st + '</g><g fill="#fff6c8">' + st2 + '</g>';
          for (let k = 0; k < H / 160; k++) s += spark(f1(rnd(k, 11) * 380 + 10), f1(rnd(k, 12) * H), f1(3 + rnd(k, 13) * 3), k % 2 ? '#ffe066' : '#9fe9ff');
          return '<g>' + s + '</g>';
        },
        zone(z) {
          const u = 'swipe' + z.index, c = NC[z.theme] || '#ff4fd8', w = z.x1 - z.x0, h = z.y1 - z.y0, cx = (z.x0 + z.x1) / 2;
          let s = '<defs><path id="' + u + 'P" d="' + z.path + '"/><clipPath id="' + u + 'C"><use href="#' + u + 'P"/></clipPath></defs>';
          s += '<use href="#' + u + 'P" fill="#05031a" opacity=".6" transform="translate(0 9)"/>';
          s += '<use href="#' + u + 'P" fill="none" stroke="' + c + '" stroke-width="30" opacity=".1" stroke-linejoin="round"/><use href="#' + u + 'P" fill="none" stroke="' + c + '" stroke-width="20" opacity=".18" stroke-linejoin="round"/><use href="#' + u + 'P" fill="none" stroke="' + c + '" stroke-width="12" opacity=".34" stroke-linejoin="round"/>';
          s += '<use href="#' + u + 'P" fill="url(#swipeF' + z.theme + ')" stroke="' + c + '" stroke-width="5" stroke-linejoin="round"/>';
          // floor art, clipped to the platform
          let f = '<rect x="' + z.x0 + '" y="' + z.y0 + '" width="' + w + '" height="' + h + '" fill="url(#swipeGrid)"/>';
          const th = z.theme, R = (a, b) => z.rnd(a, b);
          if (th === 'cove' || th === 'beach' || th === 'reef') for (let k = 0; k < 6; k++) { const y = f1(z.y0 + 50 + k * (h - 100) / 5), x = f1(z.x0 + R(k, 1) * 120); f += pa('M' + x + ' ' + y + 'q12 -9 24 0t24 0t24 0t24 0t24 0t24 0t24 0', 'fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round" opacity=".2"'); }
          else if (th === 'town') for (let k = 0; k < 14; k++) f += '<rect x="' + (z.x0 + 20 + k * 26) + '" y="' + (z.y1 - 36 + (k % 2) * 10) + '" width="10" height="10" fill="' + c + '" opacity=".16"/>';
          else if (th === 'harbour') for (let y = z.y0 + 30; y < z.y1; y += 22) f += pa('M' + z.x0 + ' ' + y + 'H' + z.x1, 'stroke="' + c + '" stroke-width="1.6" opacity=".18"');
          else if (th === 'forest') for (let k = 0; k < 22; k++) f += '<circle cx="' + f1(z.x0 + 20 + R(k, 3) * (w - 40)) + '" cy="' + f1(z.y0 + 20 + R(k, 4) * (h - 40)) + '" r="' + f1(1.5 + R(k, 5) * 2) + '" fill="' + c + '" opacity=".35"/>';
          else if (th === 'cave') for (let k = 0; k < 9; k++) f += '<polygon points="' + hexP(18 + R(k, 6) * 10).split(' ').map(p => { const q = p.split(','); return f1(+q[0] + z.x0 + 30 + R(k, 7) * (w - 60)) + ',' + f1(+q[1] + z.y0 + 30 + R(k, 8) * (h - 60)); }).join(' ') + '" fill="none" stroke="' + c + '" stroke-width="1.6" opacity=".2"/>';
          else if (th === 'cape') { const t = z.stops[z.stops.length - 1], lx = t[0] > 200 ? 70 : 330; for (let k = 1; k < 5; k++) f += '<circle cx="' + lx + '" cy="' + f1(t[1] + 30) + '" r="' + k * 26 + '" fill="none" stroke="' + c + '" stroke-width="1.6" opacity="' + f1(.3 - k * .05) + '"/>'; }
          else if (th === 'volcano') for (let k = 0; k < 8; k++) { const x = z.x0 + 20 + R(k, 9) * (w - 40), y = z.y0 + 40 + R(k, 10) * (h - 80); f += pa('M' + f1(x) + ' ' + f1(y) + 'l7 8l-5 7l8 9', 'fill="none" stroke="#ff6a2a" stroke-width="2.2" stroke-linecap="round" opacity=".4"'); }
          s += '<g clip-path="url(#' + u + 'C)">' + f + '</g>';
          s += '<use href="#' + u + 'P" fill="none" stroke="#fff" stroke-width="1.4" opacity=".5"/>';
          s += '<use href="#' + u + 'P" fill="none" stroke="' + CREAM + '" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0 11" transform="translate(0 0)" opacity=".9"/>';
          if (th === 'cape') {   // a lighthouse beacon on the side away from the road
            const t = z.stops[z.stops.length - 1], lx = t[0] > 200 ? 70 : 330, ly = t[1] + 30, d = lx > 200 ? -1 : 1;
            s += '<g transform="translate(' + lx + ' ' + ly + ')">' + '<path d="M0 -58L' + d * 70 + ' -80L' + d * 70 + ' -36Z" fill="#fff6a0" opacity=".22"/><path d="M0 -58L' + -d * 60 + ' -72L' + -d * 60 + ' -44Z" fill="#fff6a0" opacity=".14"/>' + shadow(18, 2) +
              PL('M-12 0L-8 -48H8L12 0Z', '#fff6c8', EDGE, 2) + '<path d="M-11 -12L-10 -24H10L11 -12ZM-9 -36L-8.5 -48H8.5L9 -36Z" fill="#ff4f6e"/>' + PL('M-9 -62H9V-48H-9Z', GOLD, EDGE, 2) + '<circle cy="-55" r="9" fill="#fff" opacity=".3"/>' + PL('M-11 -62L0 -72L11 -62Z', '#ff4f6e', EDGE, 2) + '</g>';
          }
          if (z.boss) {   // the jackpot volcano: the boss level sits in the crater, coins erupt
            const b = z.stops[0], vx = b[0], vy = b[1], cone = 'M' + (vx - 178) + ' ' + (vy + 158) + 'Q' + (vx - 70) + ' ' + (vy + 100) + ' ' + (vx - 50) + ' ' + (vy - 6) + 'Q' + vx + ' ' + (vy - 26) + ' ' + (vx + 50) + ' ' + (vy - 6) + 'Q' + (vx + 70) + ' ' + (vy + 100) + ' ' + (vx + 178) + ' ' + (vy + 158) + 'Z';
            s += '<g clip-path="url(#' + u + 'C)"><path d="' + cone + '" fill="url(#swipeVol)" stroke="#ff6a2a" stroke-width="3"/>' +               pa('M' + (vx - 30) + ' ' + vy + 'Q' + (vx - 40) + ' ' + (vy + 40) + ' ' + (vx - 70) + ' ' + (vy + 95) + 'M' + (vx + 36) + ' ' + vy + 'Q' + (vx + 52) + ' ' + (vy + 34) + ' ' + (vx + 48) + ' ' + (vy + 80), 'fill="none" stroke="#ff7a2a" stroke-width="4" stroke-linecap="round"') + '</g>';
            s += '<ellipse cx="' + vx + '" cy="' + vy + '" rx="64" ry="30" fill="#ff6a2a" opacity=".3"/><ellipse cx="' + vx + '" cy="' + vy + '" rx="56" ry="25" fill="#2a0c24" stroke="#ff6a2a" stroke-width="3"/><ellipse cx="' + vx + '" cy="' + (vy + 3) + '" rx="46" ry="19" fill="#ff7a2a" opacity=".85"/><ellipse cx="' + vx + '" cy="' + (vy + 4) + '" rx="32" ry="12" fill="#ffd84a" opacity=".7"/>';
            [[-62, -52, 1], [-30, -88, 1.1], [-8, -112, .8], [34, -66, 1], [66, -36, .9], [-84, -14, .8]].forEach((p, i) => { if (z.y0 + 30 > vy + p[1] - 14 && vx + p[0] > 210) return; s += coin(vx + p[0], vy + p[1], p[2] * .8); });
          }
          return '<g>' + s + '</g>';
        },
        decor(theme, r, r2, z) { const K = KIND[theme] || KIND.town; return '<g>' + pick(K, (r * 5.7 + r2 * 3.3) % 1)(r2, r) + '</g>'; },
        keepOut(z) {   // the lighthouse on the cape, and the volcano with its boss crater and coin spray
          const out = [];
          if (z.theme === 'cape') { const t = z.stops[z.stops.length - 1], lx = t[0] > 200 ? 70 : 330, ly = t[1] + 30; out.push([lx - 76, ly - 84, lx + 76, ly + 14]); }
          if (z.boss) { const b = z.stops[0], vx = b[0], vy = b[1]; out.push([vx - 120, vy - 126, vx + 120, vy + 160], [vx - 182, vy + 56, vx + 182, vy + 160]); }
          return out;
        },
        sign(label, w) {
          return '<rect x="-2" y="-2" width="' + (w + 4) + '" height="36" rx="11" fill="none" stroke="' + GOLD + '" stroke-width="7" opacity=".22"/><rect width="' + w + '" height="32" rx="9" fill="#1a1058" stroke="' + GOLD + '" stroke-width="2.6"/>' +
            '<rect x="3.5" y="3.5" width="' + (w - 7) + '" height="25" rx="6.5" fill="' + PLATE + '" stroke="' + EDGE + '" stroke-width="1"/>' +
            '<rect x="1.3" y="1.3" width="' + f1(w - 2.6) + '" height="29.4" rx="8" fill="none" stroke="' + CREAM + '" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0 7"/>' +
            say(f1(w / 2), 22, 15, label, GOLD);
        },
        road: { todo: ['#120a42', '#4332a8', '#8a76ff'], done: ['#b06a00', '#ffcc2e', '#fffbe0'] },
        node(state, num, e, boss) {
          const R = 29, n = String(num), fs = n.length > 3 ? 14 : n.length > 2 ? 16 : n.length > 1 ? 21 : 26;
          const txt = (col) => say(0, f1(fs * .36), fs, n, col);
          const crown = boss ? '<path d="M-14 -33L-9 -44L-3 -36L0 -46L3 -36L9 -44L14 -33Z" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="2" stroke-linejoin="round"/>' : '';
          if (state === 'locked') return '<polygon points="' + hexP(R) + '" fill="#08051f" stroke="' + EDGE + '" stroke-width="3" stroke-linejoin="round" transform="translate(0 4)"/><polygon points="' + hexP(R) + '" fill="#1d1558" stroke="#3a2f80" stroke-width="3" stroke-linejoin="round"/><polygon points="' + hexP(R * .72) + '" fill="#0d0933" stroke="#2c2268" stroke-width="2"/>' +
            '<path d="M-7 -2V-7A7 7 0 0 1 7 -7V-2" fill="none" stroke="#8d86c8" stroke-width="3.4" stroke-linecap="round"/><rect x="-10" y="-3" width="20" height="15" rx="4" fill="#6c64a8" stroke="' + EDGE + '" stroke-width="2"/><circle cy="4" r="2.4" fill="' + EDGE + '"/>' + crown;
          if (state === 'open') return tileBody(R, e).replace(/<path[^>]*\/>$/, '') + txt('#fff') + crown;
          const gold = '<polygon points="' + hexP(R * 1.16) + '" fill="none" stroke="' + GOLD + '" stroke-width="4" stroke-linejoin="round" opacity=".28"/>' +
            '<polygon points="' + hexP(R) + '" fill="' + GOLD2 + '" stroke="' + EDGE + '" stroke-width="3" stroke-linejoin="round" transform="translate(0 4)"/><polygon points="' + hexP(R) + '" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="3" stroke-linejoin="round"/>' +
            '<polygon points="' + hexP(R * .76) + '" fill="none" stroke="' + CREAM + '" stroke-width="2.6" stroke-linejoin="round"/><polygon points="' + hexP(R * .62) + '" fill="#2a1760"/>';
          if (state === 'beaten') return gold + txt(CREAM) + coin(19, -20, .62) + crown;
          return '<polygon points="' + hexP(R * 1.34) + '" fill="none" stroke="#fff6c8" stroke-width="3" stroke-linejoin="round" opacity=".5">' + (reduced ? '' : '<animate attributeName="opacity" values=".15;.7;.15" dur="1.3s" repeatCount="indefinite"/>') + '</polygon>' + gold + txt('#fff') + crown;
        },
        start() {
          return '<g transform="translate(0 22)"><ellipse cy="26" rx="62" ry="9" fill="#05031a" opacity=".5"/><rect x="-62" y="-20" width="124" height="44" rx="14" fill="none" stroke="#ff4fd8" stroke-width="12" opacity=".2"/><rect x="-60" y="-18" width="120" height="40" rx="12" fill="#1a1058" stroke="#ff4fd8" stroke-width="3"/>' +
            '<rect x="-54" y="-12" width="108" height="28" rx="8" fill="' + PLATE + '" stroke="#ff9af0" stroke-width="1.2"/>' +
            '<rect x="-58.5" y="-16.5" width="117" height="37" rx="11" fill="none" stroke="' + CREAM + '" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0 8"/>' +
            '<text x="0" y="8" text-anchor="middle" font-family="' + FONT + '" font-size="17" fill="#ffd0fa" stroke="#ff4fd8" stroke-width="2.2" paint-order="stroke" stroke-linejoin="round">INSERT COIN</text>' +
            coin(-76, 2, .9) + coin(76, 2, .9) + '</g>';
        },
        pin() {
          return '<path d="M0 27C-6 17 -19 9 -19 -5A19 19 0 0 1 19 -5C19 9 6 17 0 27Z" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="3" stroke-linejoin="round"/><path d="M-13 -9A13 13 0 0 1 -3 -16" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' + coin(0, -5, 1.05);
        },
      };
    })(),
    words: { win: 'JACKPOT!', perfect: 'Perfect route! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'JACKPOT MAP' },
  });
})();
