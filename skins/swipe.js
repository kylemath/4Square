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
    },
    css: '.tl .tr,.tl .rm{transition:stroke .15s}.tl.lit .rm{stroke:#fff}.tl.lit .tin{filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 3px currentColor)}' +
      '.tl.glow .tin{filter:drop-shadow(0 0 10px #ffd84a) drop-shadow(0 0 4px #fff)}',
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
    words: { win: 'JACKPOT!', perfect: 'Perfect route! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'JACKPOT MAP' },
  });
})();
