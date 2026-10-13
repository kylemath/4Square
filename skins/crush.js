// Candy Kempe: swap two neighbouring candies and the chain ripples. See SKIN-SPEC.md and lab/crush.html.
(function () {
  const INK = '#4a1a5c', PINK = '#ff5fa8', CREAM = '#fff6e8', GOLD = '#ffd23a';
  const FL = [
    { c: '#ff4d4d', hi: '#ffd0d0', name: 'jelly' },
    { c: '#3d8cff', hi: '#d6e8ff', name: 'sweet' },
    { c: '#ffd23a', hi: '#fff6c2', name: 'star' },
    { c: '#3ecf6e', hi: '#d8ffe4', name: 'drop' },
  ];
  const f1 = n => Math.round(n * 10) / 10;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const FONT = "'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif";
  const svg = (inner, style) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const sky = '<defs><linearGradient id="ckSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8ec8"/><stop offset=".45" stop-color="#c86bff"/><stop offset="1" stop-color="#6b3fb8"/></linearGradient></defs>' +
    '<rect width="300" height="250" fill="url(#ckSky)"/>' +
    '<circle cx="46" cy="40" r="16" fill="#fff" opacity=".35"/><circle cx="250" cy="28" r="10" fill="#fff" opacity=".28"/>';
  function candy(x, y, e, s) {
    const R = s || 16, F = FL[e];
    if (e === 1) return '<g transform="translate(' + x + ' ' + y + ')"><rect x="' + f1(-R) + '" y="' + f1(-R * .72) + '" width="' + f1(R * 2) + '" height="' + f1(R * 1.44) + '" rx="' + f1(R * .35) + '" fill="' + F.c + '" stroke="#1d4e9c" stroke-width="1.6"/>' +
      '<path d="M' + f1(-R) + ' 0H' + f1(-R * 1.45) + 'M' + f1(R) + ' 0H' + f1(R * 1.45) + '" stroke="' + F.hi + '" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="' + f1(-R * .7) + '" y="' + f1(-R * .45) + '" width="' + f1(R * .5) + '" height="' + f1(R * .28) + '" rx="2" fill="#fff" opacity=".65"/></g>';
    if (e === 2) return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<path d="M0 ' + f1(-R) + 'L' + f1(R * .32) + ' ' + f1(-R * .32) + 'L' + f1(R) + ' 0L' + f1(R * .32) + ' ' + f1(R * .32) + 'L0 ' + f1(R) + 'L' + f1(-R * .32) + ' ' + f1(R * .32) + 'L' + f1(-R) + ' 0L' + f1(-R * .32) + ' ' + f1(-R * .32) + 'Z" fill="' + F.c + '" stroke="#c27a00" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<circle cx="' + f1(-R * .2) + '" cy="' + f1(-R * .25) + '" r="' + f1(R * .16) + '" fill="#fff" opacity=".8"/></g>';
    if (e === 3) return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<path d="M0 ' + f1(-R) + 'C' + f1(R * .85) + ' ' + f1(-R * .2) + ' ' + f1(R * .7) + ' ' + f1(R * .55) + ' 0 ' + f1(R) + 'C' + f1(-R * .7) + ' ' + f1(R * .55) + ' ' + f1(-R * .85) + ' ' + f1(-R * .2) + ' 0 ' + f1(-R) + 'Z" fill="' + F.c + '" stroke="#1d7a3a" stroke-width="1.5"/>' +
      '<ellipse cx="' + f1(-R * .22) + '" cy="' + f1(-R * .25) + '" rx="' + f1(R * .18) + '" ry="' + f1(R * .28) + '" fill="#fff" opacity=".55"/></g>';
    return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<circle r="' + R + '" fill="' + F.c + '" stroke="#b42323" stroke-width="1.5"/>' +
      '<ellipse cx="' + f1(-R * .28) + '" cy="' + f1(-R * .32) + '" rx="' + f1(R * .28) + '" ry="' + f1(R * .18) + '" fill="#fff" opacity=".7"/></g>';
  }
  function wrap(x, y, s) {
    const R = s || 18;
    return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<rect x="' + -R + '" y="' + f1(-R * .7) + '" width="' + R * 2 + '" height="' + f1(R * 1.4) + '" rx="6" fill="#5c3317" stroke="#3a1e0c" stroke-width="2"/>' +
      '<path d="M' + f1(-R * .2) + ' ' + f1(-R * .7) + 'v' + f1(R * 1.4) + '" stroke="' + GOLD + '" stroke-width="3"/>' +
      '<circle cy="' + f1(-R * .15) + '" r="' + f1(R * .28) + '" fill="none" stroke="#fff6e8" stroke-width="2" stroke-dasharray="2 2"/></g>';
  }
  const cap = t => '<text x="150" y="232" text-anchor="middle" font-family="' + FONT + '" font-size="16" fill="#fff">' + t + '</text>';

  const ring = [[150, 78, 0], [214, 112, 1], [196, 176, 2], [104, 176, 3], [86, 112, 1]];
  const titleSvg = svg(sky + ring.map(p => candy(p[0], p[1], p[2], 18)).join('') + wrap(150, 128, 16) + cap('swap two candies'),
    RM('.ck{transform-box:fill-box;transform-origin:center}'));

  const I = [
    { title: 'Fill the wrapper', text: 'Four flavours sit on the map. The middle wrapper is the hole, and the candies touching it are its sockets. Clear one flavour from those sockets.',
      svg: svg(sky + ring.map(p => candy(p[0], p[1], p[2], 16)).join('') + wrap(150, 128, 18) + cap('five sockets, four flavours')) },
    { title: 'Swap two neighbours', text: 'Drag one candy toward a neighbour. Those two flavours name one chain: every candy of those two kinds that touches them.',
      svg: svg(sky +
        '<path d="M70 140 H230" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".45"/>' +
        candy(70, 140, 0, 18) + candy(124, 140, 1, 18) + candy(178, 140, 0, 18) + candy(232, 140, 1, 18) +
        cap('red, blue, red, blue: one chain'),
        RM('g{transform-box:fill-box;transform-origin:center}')) },
    { title: 'The chain ripples', text: 'On release the two candies slide past each other, then the swap runs out along the chain. A flavour with no neighbour just turns, if you tap and pick it.',
      svg: svg(sky +
        candy(70, 150, 1, 18) + candy(124, 150, 0, 18) + candy(178, 150, 1, 18) + candy(232, 150, 0, 18) +
        '<text x="150" y="78" text-anchor="middle" font-family="' + FONT + '" font-size="22" fill="#fff">Sweet!</text>' +
        cap('the whole chain flips')) },
    { title: 'Names do not count', text: 'A swap of every red and every blue on the board only renames two flavours. Those candies wobble and spring back. Look for a chain that leaves some out.',
      svg: svg(sky + ring.map(p => candy(p[0], p[1], p[2] === 2 || p[2] === 3 ? p[2] : (p[2] === 0 ? 1 : 0), 16)).join('') + wrap(150, 128, 16) +
        '<text x="150" y="128" text-anchor="middle" font-family="' + FONT + '" font-size="14" fill="#fff">boing</text>' + cap('a full swap changes nothing')) },
    { title: 'Sugar crush', text: 'When the sockets are down to three flavours, the missing candy drops into the wrapper. Par moves is three stars.',
      svg: svg(sky +
        [[150, 78, 0], [214, 112, 1], [196, 176, 0], [104, 176, 1], [86, 112, 2]].map(p => candy(p[0], p[1], p[2], 16)).join('') +
        candy(150, 128, 3, 20) + cap('the free flavour drops in')) },
  ];

  FTH_SKINS.register({
    id: 'crush', name: 'Candy', ic: '🍬', blurb: 'swap two candies, the chain ripples',
    coin: { name: 'sweet', plural: 'sweets', glyph: '🍭', value: 8, pitch: 1.15,
      colors: { main: '#ff5fa8', edge: '#ffd23a' },
      svg: FTH_SKINS.coinArt('<path d="M-11.2 0H-14.2M11.2 0H14.2" stroke="#fff6e8" stroke-width="2.6" stroke-linecap="round"/><rect x="-11" y="-5.2" width="22" height="10.4" rx="3.2" fill="#ff5fa8" stroke="#1c1640" stroke-width="2"/><rect x="-4.2" y="-3.2" width="5.2" height="2.6" rx="1" fill="#fff" opacity=".75"/><circle cx="4.6" cy="1.4" r="1.7" fill="#ffd23a" stroke="#1c1640" stroke-width="1"/>') },
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
      '.skins button[aria-checked="true"]{color:#4a1a5c}',
    title: { svg: titleSvg },
    intro: I,
    bonus: {
      label: 'SWEETS', board: 'linear-gradient(180deg, #ff8ec8, #6b3fb8)', line: '#fff',
      tile(x, y, r, e, k) {
        const R = f1(r * .72);
        const body = e === 1
          ? '<rect x="' + f1(-R) + '" y="' + f1(-R * .7) + '" width="' + f1(R * 2) + '" height="' + f1(R * 1.4) + '" rx="' + f1(R * .3) + '" fill="#3d8cff" stroke="#1d4e9c" stroke-width="1.4"/>'
          : e === 2
            ? '<path d="M0 ' + f1(-R) + ' L' + f1(R * .35) + ' ' + f1(-R * .35) + ' ' + f1(R) + ' 0 ' + f1(R * .35) + ' ' + f1(R * .35) + ' 0 ' + f1(R) + ' ' + f1(-R * .35) + ' ' + f1(R * .35) + ' ' + f1(-R) + ' 0 ' + f1(-R * .35) + ' ' + f1(-R * .35) + ' Z" fill="#ffd23a" stroke="#c27a00" stroke-width="1.3" stroke-linejoin="round"/>'
            : e === 3
              ? '<path d="M0 ' + f1(-R) + ' C' + f1(R) + ' ' + f1(-R * .15) + ' ' + f1(R * .75) + ' ' + f1(R * .6) + ' 0 ' + f1(R) + ' C' + f1(-R * .75) + ' ' + f1(R * .6) + ' ' + f1(-R) + ' ' + f1(-R * .15) + ' 0 ' + f1(-R) + ' Z" fill="#3ecf6e" stroke="#1d7a3a" stroke-width="1.3"/>'
              : '<circle r="' + R + '" fill="#ff4d4d" stroke="#b42323" stroke-width="1.4"/><ellipse cx="' + f1(-R * .28) + '" cy="' + f1(-R * .3) + '" rx="' + f1(R * .22) + '" ry="' + f1(R * .14) + '" fill="#fff" opacity=".75"/>';
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + body + '</g></g>';
      },
    },
    map: {
      sea: ['#f7c6e4', '#f0b0da', '#e49ad0', '#d484c4', '#c46eb8', '#b058aa', '#9c449c', '#88308e', '#742080'],
      seaX: '#5a2080', unknown: '#e7d0ea',
      ramp: ['#3ecf6e', '#ffd23a', '#ff8a3c', '#ff4d4d'],
      grey: '#c9a8d4', route: '#fff6e8', ink: 'rgba(74,26,92,.75)',
      cell(path, x, y, r) { path.moveTo(x + r, y); path.arc(x, y, r * .82, 0, Math.PI * 2); },
    },
    words: { win: 'Sugar crush!', perfect: 'Par. That chain was perfect.', par: 'Par is {par} swaps.', chart: 'EVERY MIX' },
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
          const R = 8;
          if (e === 1) return '<rect x="-8" y="-5" width="16" height="11" rx="3" fill="#3d8cff"/>';
          if (e === 2) return '<path d="M0 -8 L3 -3 8 0 3 3 0 8 -3 3 -8 0 -3 -3 Z" fill="#ffd23a"/>';
          if (e === 3) return '<path d="M0 -8 C6 -2 5 4 0 8 C-5 4 -6 -2 0 -8 Z" fill="#3ecf6e"/>';
          return '<circle r="' + R + '" fill="#ff4d4d"/>';
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
