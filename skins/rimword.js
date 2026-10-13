// Rim Word: five letter tiles, one flip per Kempe swap, real words are the fills. See SKIN-SPEC.md and lab/rimword.html.
(function () {
  const INK = '#3a2a1a', PAPER = '#f3ead8', CREAM = '#fffaf0', WOOD = '#e9c58f', WOOD2 = '#d7a964', EDGE = '#a8763a';
  const GOLD = '#c9a15a', GOOD = '#2f8f4e';
  const FONT = "'Fraunces', Georgia, serif";
  const f1 = n => Math.round(n * 10) / 10;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const paper = '<rect width="300" height="250" fill="' + PAPER + '"/>' +
    '<rect x="16" y="16" width="268" height="218" rx="16" fill="' + CREAM + '" stroke="#e0d2b8" stroke-width="2"/>';
  function tile(x, y, ch, w, lift) {
    const W = w || 44, H = W;
    return '<g transform="translate(' + x + ' ' + (y - (lift || 0)) + ')">' +
      '<rect x="2" y="4" width="' + W + '" height="' + H + '" rx="8" fill="#6b4a20" opacity=".18"/>' +
      '<rect width="' + W + '" height="' + H + '" rx="8" fill="' + WOOD + '" stroke="' + EDGE + '" stroke-width="2"/>' +
      '<rect x="3" y="3" width="' + (W - 6) + '" height="' + f1(H * .4) + '" rx="5" fill="#fff5dd" opacity=".55"/>' +
      '<text x="' + (W / 2) + '" y="' + f1(H * .68) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + f1(W * .62) + '" font-weight="800" fill="#3b2612">' + ch + '</text></g>';
  }
  const cap = (t, y) => '<text x="150" y="' + (y || 228) + '" text-anchor="middle" font-family="' + FONT + '" font-size="15" font-weight="700" fill="' + INK + '">' + t + '</text>';

  const titleSvg = svg(paper +
    tile(28, 92, 'B') + tile(80, 92, 'L', 44, 0) + tile(132, 86, 'A', 44, 6) + tile(184, 92, 'R') + tile(236, 92, 'F') +
    cap('flip one tile at a time'),
    RM('.up{transform-box:fill-box;transform-origin:50% 100%;animation:up 1.8s ease-in-out infinite}@keyframes up{50%{transform:translateY(-8px)}}'));

  const I = [
    { title: 'Spell a word', text: 'Five wooden tiles show a string that is not a word. A real English word is exactly a colouring where the hole can be filled.',
      svg: svg(paper + tile(28, 78, 'B') + tile(80, 78, 'L') + tile(132, 78, 'A') + tile(184, 78, 'R') + tile(236, 78, 'F') + cap('not a word yet')) },
    { title: 'Your tiles', text: 'The rack is yours. Play a letter on any square. If the word needs a few more changes to reach that letter, it walks there. Every tile still leads to a word.',
      svg: svg(paper + tile(28, 70, 'B') + tile(80, 70, 'L') + tile(132, 58, 'A', 44, 8) + tile(184, 70, 'R') + tile(236, 70, 'F') +
        tile(118, 150, 'E', 36) + tile(162, 150, 'I', 36) + cap('one letter, one swap', 232)) },
    { title: 'The same tiles', text: 'Nothing leaves your rack. They are every letter between the start and a word. Keep playing them until one of the spellings is a word.',
      svg: svg(paper +
        '<g opacity=".55">' + tile(28, 88, 'Q') + '</g>' +
        tile(80, 88, 'X') + tile(132, 88, 'V') + tile(184, 88, 'L') + tile(236, 88, 'T') +
        cap('a pinned tile stays put')) },
    { title: 'A word fills the hole', text: 'Spell a real word and you win. Par flips is three stars. The map underneath is shown after, each flip a swap you made.',
      svg: svg(paper + tile(28, 72, 'B') + tile(80, 72, 'L') + tile(132, 72, 'E') + tile(184, 72, 'A') + tile(236, 72, 'T') +
        '<text x="150" y="160" text-anchor="middle" font-family="' + FONT + '" font-size="22" font-weight="800" fill="' + GOOD + '">BLEAT</text>' +
        cap('a word: the hole can be filled')) },
  ];

  FTH_SKINS.register({
    id: 'rimword', name: 'Rim Word', ic: '🔤', blurb: 'flip a tile, spell a real word',
    coin: { name: 'letter tile', plural: 'letter tiles', glyph: '🔤', value: 4, pitch: 0.85,
      colors: { main: '#e9c58f', edge: '#a8763a' },
      svg: FTH_SKINS.coinArt('<rect x="-8.6" y="-10.2" width="17.2" height="20.4" rx="2.6" fill="#c9954a"/><rect x="-8.6" y="-10.2" width="17.2" height="20.4" rx="2.6" fill="#e9c58f" stroke="#1c1640" stroke-width="2"/><rect x="-6" y="-7.4" width="7.2" height="2.6" rx="1" fill="#fff6e4"/><path d="M-3.6 5.2L0 -4.2L3.6 5.2M-2 1.6H2" fill="none" stroke="#3b2612" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>') },
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
      '.skins button[aria-checked="true"]{color:#3b2612}',
    title: { svg: titleSvg },
    intro: I,
    bonus: {
      label: 'WORDS', board: PAPER, line: EDGE,
      tile(x, y, r, e, k) {
        const letters = ['B', 'L', 'E', 'A'];
        const W = f1(r * 1.35);
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<rect x="' + f1(-W / 2) + '" y="' + f1(-W / 2) + '" width="' + W + '" height="' + W + '" rx="4" fill="#e9c58f" stroke="#a8763a" stroke-width="1.4"/>' +
          '<text y="' + f1(W * .28) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + f1(W * .7) + '" font-weight="800" fill="#3b2612">' + letters[e] + '</text>' +
          '</g></g>';
      },
    },
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
    words: { win: 'A word!', perfect: 'Par. That spelling was exact.', par: 'Par is {par} flips.', chart: 'THE LADDER' },
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
