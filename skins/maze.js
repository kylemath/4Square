// Rat Maze: the swap graph as a 3/4-view lab maze. See SKIN-SPEC.md and lab/maze.html.
(function () {
  const INK = '#2a241c', CREAM = '#f6efe2', WOOD = '#c4a574', WOOD2 = '#8d6840', GOLD = '#ffd36a', CHEESE = '#e7a91c';
  const BENCH = '#1c1e24', WALL = '#d7ecf6', RAT = '#f7f1e6';
  const C = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'];
  const f1 = n => Math.round(n * 10) / 10;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';

  function room(x, y, w, h, tint) {
    const t = tint || WALL;
    return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<rect x="3" y="5" width="' + w + '" height="' + h + '" rx="4" fill="#000" opacity=".28"/>' +
      '<rect width="' + w + '" height="' + h + '" rx="4" fill="' + t + '" stroke="#f4fbff" stroke-width="2"/>' +
      '<rect x="3" y="3" width="' + (w - 6) + '" height="' + f1(h * .45) + '" rx="2" fill="#fff" opacity=".28"/>' +
      '</g>';
  }
  function corridor(x1, y1, x2, y2) {
    return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" fill="none" stroke="' + WOOD + '" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" fill="none" stroke="#efe2c4" stroke-width="4" stroke-linecap="round"/>';
  }
  function rat(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')"><g class="rt">' +
      '<ellipse cx="2" cy="10" rx="16" ry="5" fill="#000" opacity=".25"/>' +
      '<ellipse cx="-2" cy="2" rx="16" ry="10" fill="' + RAT + '" stroke="' + INK + '" stroke-width="1.6"/>' +
      '<circle cx="12" cy="-2" r="8" fill="' + RAT + '" stroke="' + INK + '" stroke-width="1.6"/>' +
      '<circle cx="8" cy="-8" r="3.2" fill="#f4b6c8" stroke="' + INK + '" stroke-width="1"/>' +
      '<circle cx="16" cy="-8" r="3.2" fill="#f4b6c8" stroke="' + INK + '" stroke-width="1"/>' +
      '<circle cx="14.2" cy="-2.4" r="1.3" fill="' + INK + '"/><circle cx="9" cy="-1.6" r=".7" fill="#e07080"/>' +
      '<path d="M-16 0c-10 1-16 6-14 8" fill="none" stroke="#d7c3b0" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g></g>';
  }
  function cheese(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')">' +
      '<path d="M-16 8h30l-6-16H-8z" fill="' + GOLD + '" stroke="#a8740c" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M-16 8L-6-2" stroke="#a8740c" stroke-width="1.2"/>' +
      '<circle cx="-2" cy="2" r="2.2" fill="#e0a020"/><circle cx="8" cy="4" r="1.6" fill="#e0a020"/>' +
      '</g>';
  }
  function coin(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')">' +
      '<ellipse cx="1" cy="2" rx="8" ry="8" fill="#a8740c"/><circle r="8" fill="' + GOLD + '" stroke="#a8740c" stroke-width="1.4"/>' +
      '<circle r="4.5" fill="none" stroke="#a8740c" stroke-width="1.2"/></g>';
  }
  const bench = '<rect width="300" height="250" fill="' + BENCH + '"/>' +
    '<ellipse cx="230" cy="28" rx="70" ry="18" fill="#ffd36a" opacity=".16"/>' +
    '<rect x="18" y="36" width="264" height="178" rx="10" fill="#6b4a2a"/>' +
    '<rect x="26" y="44" width="248" height="162" rx="6" fill="#8a6240"/>';

  const titleSvg = svg(bench +
    corridor(78, 110, 150, 110) + corridor(150, 110, 222, 110) + corridor(150, 110, 150, 168) +
    room(48, 82, 52, 44) + room(124, 82, 52, 44, '#f6e2b0') + room(196, 82, 52, 44) + room(124, 146, 52, 44, '#e7f6d4') +
    coin(70, 104, .7) + cheese(222, 100, .85) + rat(150, 108, 1) +
    '<text x="150" y="232" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="15" font-weight="800" fill="' + CREAM + '">rooms are colourings, doors are swaps</text>',
    RM('.rt{transform-box:fill-box;transform-origin:40% 80%;animation:sc 1.6s ease-in-out infinite}@keyframes sc{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}'));

  const I = [
    { title: 'A maze of swaps', text: 'Every room is one colouring of the map. Every corridor is one Kempe swap. The rat starts in this level\'s room.',
      svg: svg(bench + corridor(70, 120, 150, 120) + corridor(150, 120, 230, 120) +
        room(40, 96, 56, 48) + room(122, 96, 56, 48, '#f6e2b0') + room(202, 96, 56, 48) +
        rat(148, 118, .9) +
        '<text x="150" y="228" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="14" font-weight="800" fill="' + CREAM + '">one corridor, one swap</text>') },
    { title: 'Walk a door', text: 'Tap a door, or the room beyond it. Arrow keys and a swipe walk that way too. The floor tiles are the five colours round the hole.',
      svg: svg(bench + room(110, 78, 80, 64, '#f6e2b0') +
        [0, 1, 2, 3, 1].map((e, i) => '<rect x="' + (124 + i * 12) + '" y="108" width="10" height="10" rx="2" fill="' + C[e] + '" stroke="#1c140c" stroke-width="1"/>').join('') +
        rat(150, 150, 1.05) +
        '<text x="150" y="228" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="14" font-weight="800" fill="' + CREAM + '">tap a door to scurry through</text>',
        RM('.rt{transform-box:fill-box;transform-origin:50% 80%;animation:wk .9s ease-in-out infinite alternate}@keyframes wk{to{transform:translateY(-6px)}}')) },
    { title: 'Find the cheese', text: 'The cheese sits in a room where the hole can be filled, exactly par corridors from the start. Its glow shows through the dark. The shortest walk earns three stars.',
      svg: svg(bench + corridor(60, 130, 240, 100) +
        room(28, 106, 48, 40) + room(210, 72, 52, 44, '#fff3c4') +
        rat(70, 128, .85) + cheese(236, 88, 1.15) +
        '<text x="150" y="228" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="14" font-weight="800" fill="' + CREAM + '">par steps to the cheese</text>',
        RM('.rt{transform-box:fill-box;transform-origin:40% 80%;animation:go 2.2s ease-in-out infinite}@keyframes go{0%{transform:translate(0,0)}100%{transform:translate(70px,-16px)}}')) },
    { title: 'Lights and memory', text: 'With the lights off you only see rooms you have visited. A gold number is the shortest way to a fill you have actually walked. The lamp shows the whole maze.',
      svg: svg(bench + room(40, 90, 48, 40) + room(120, 90, 48, 40, '#3a342c') + room(200, 90, 48, 40, '#3a342c') +
        '<circle cx="144" cy="110" r="10" fill="' + GOLD + '" opacity=".85"/>' +
        '<text x="144" y="114" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="12" font-weight="800" fill="' + INK + '">2</text>' +
        rat(64, 112, .8) +
        '<text x="150" y="200" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="14" font-weight="800" fill="' + CREAM + '">seen rooms stay mapped</text>' +
        '<text x="150" y="222" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="13" fill="#d9cbb6">coins mode, on the lab page, maps every room first</text>') },
  ];

  const hexPath = (path, x, y, r) => {
    const P = Array.from({ length: 6 }, (_, q) => { const t = Math.PI / 3 * q - Math.PI / 6; return [x + r * Math.cos(t), y + r * Math.sin(t)]; });
    path.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < 6; i++) path.lineTo(P[i][0], P[i][1]);
    path.closePath();
  };

  FTH_SKINS.register({
    id: 'maze', name: 'Rat Maze', ic: '🐀', blurb: 'walk the swaps, find the cheese',
    coin: { name: 'cheese wedge', plural: 'cheese wedges', glyph: '🧀', value: 25, pitch: 0.75,
      colors: { main: '#ffd36a', edge: '#a8740c' },
      svg: FTH_SKINS.coinArt('<path d="M-10.5 7.2H9.2L3.4 -9.6H-5.6Z" fill="#ffd36a" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/><path d="M-10.5 7.2L-3.2 -1.2" stroke="#a8740c" stroke-width="1.3" stroke-linecap="round"/><circle cx="-1.6" cy="1.2" r="2.1" fill="#e0a020" stroke="#1c1640" stroke-width="1"/><circle cx="4.2" cy="3.2" r="1.5" fill="#e7b43a" stroke="#1c1640" stroke-width="1"/>') },
    src: 'lab/maze.html', hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(120% 80% at 50% 0%, #2a2e38 0%, #16181d 55%, #0e0f12 100%)',
      '--sk-ink': CREAM,
      '--sk-accent': GOLD,
      '--sk-card': 'linear-gradient(165deg, #2c313c, #1a1c22)',
      '--sk-card-ink': CREAM,
      '--sk-hud': 'linear-gradient(180deg, rgba(22,24,28,.96), rgba(14,15,18,.94))',
      '--sk-btn': 'linear-gradient(180deg, #ffe07a, #e7a91c)',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': '#8a5a10',
      '--sk-font': "ui-rounded, 'Avenir Next', system-ui, sans-serif",
      '--sk-radius': '16px',
      '--sk-chip': 'rgba(28,24,20,.9)',
      '--sk-chip-ink': CREAM,
      '--sk-edge': 'rgba(255,211,106,.7)',
      '--sk-btn2': '#2a261f',
      '--sk-btn2-ink': GOLD,
      '--sk-coin': 'linear-gradient(180deg, #ffe07a, #e7a91c)',
      '--sk-star-on': '#ffd36a', '--sk-star-edge': '#6a4a12', '--sk-star-off': '#c5d0d8', '--sk-star-off-edge': '#8ea0ae',
      '--sk-ctl': '#2a261f', '--sk-ctl-ink': '#f6efe2', '--sk-ctl-edge': '#ffd36a',
    },
    css: '--text:#f6efe2;--dim:#d9cbb6;--faint:#b7a890;--bg2:#242830;--line:rgba(255,236,200,.28);' +
      '.btn3d{border-radius:14px;letter-spacing:.02em}' +
      '.coins{color:#2a241c}' +
      '.skins button[aria-checked="true"]{color:#2a241c}',
    title: { svg: titleSvg },
    intro: I,
    bonus: {
      label: 'CHEESE', board: '#1c1e24', line: GOLD,
      tile(x, y, r, e, k) {
        const body = e === 0 ? '<circle r="' + f1(r * .55) + '" fill="' + GOLD + '" stroke="#a8740c" stroke-width="1.6"/><circle r="' + f1(r * .28) + '" fill="none" stroke="#a8740c" stroke-width="1.3"/>'
          : e === 1 ? '<path d="M' + f1(-r * .7) + ' ' + f1(r * .35) + 'h' + f1(r * 1.35) + 'l' + f1(-r * .25) + ' ' + f1(-r * .7) + 'H' + f1(-r * .35) + 'z" fill="' + GOLD + '" stroke="#a8740c" stroke-width="1.4" stroke-linejoin="round"/>'
          : e === 2 ? '<ellipse cx="' + f1(-r * .1) + '" cy="' + f1(r * .15) + '" rx="' + f1(r * .62) + '" ry="' + f1(r * .38) + '" fill="#f7f1e6" stroke="#2a241c" stroke-width="1.4"/><circle cx="' + f1(r * .35) + '" cy="' + f1(-r * .05) + '" r="' + f1(r * .28) + '" fill="#f7f1e6" stroke="#2a241c" stroke-width="1.3"/>'
          : '<rect x="' + f1(-r * .55) + '" y="' + f1(-r * .4) + '" width="' + f1(r * 1.1) + '" height="' + f1(r * .8) + '" rx="3" fill="#d7ecf6" stroke="#f4fbff" stroke-width="1.4"/>';
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + body + '</g></g>';
      },
    },
    map: {
      sea: ['#2a3140', '#262c3a', '#222836', '#1e2432', '#1a202c', '#161c28', '#121820', '#0e141c', '#0c1016'],
      seaX: '#0e1014', unknown: '#3a342c',
      ramp: ['#7dcea0', '#ffd36a', '#e7a91c', '#ef5a3c'],
      grey: '#6e6558', route: GOLD, ink: 'rgba(246,239,226,.8)',
      cell: hexPath,
    },
    words: { win: 'Cheese!', perfect: 'The shortest corridor. The rat knew the way.', par: 'The cheese is {par} rooms away.', chart: 'ROOMS YOU HAVE OPENED' },
    levelMap: (function () {
      const TINT = {
        cove: ['#1e4d62', '#163848'], beach: ['#6b4a2a', '#4a3018'], town: ['#3a342c', '#2a261f'],
        harbour: ['#243044', '#182030'], forest: ['#244028', '#182818'], cape: ['#4a3818', '#2e220e'],
        reef: ['#4a2838', '#301820'], cave: ['#2c2840', '#1c1830'], volcano: ['#4a2418', '#2e140e'],
      };
      const lock = '<rect x="-6" y="-3" width="12" height="9" rx="2" fill="#c4a574"/><path d="M-3.4 -3v-3a3.4 3.4 0 0 1 6.8 0v3" fill="none" stroke="#c4a574" stroke-width="1.8"/>';
      return {
        bg: '#14161a',
        defs: '<linearGradient id="mazeWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a07848"/><stop offset="1" stop-color="#6b4a2a"/></linearGradient>' +
          '<radialGradient id="mazeLamp" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#ffd36a" stop-opacity=".22"/><stop offset="1" stop-color="#ffd36a" stop-opacity="0"/></radialGradient>',
        backdrop(H) { return '<rect width="400" height="' + H + '" fill="#14161a"/><rect width="400" height="' + H + '" fill="url(#mazeLamp)"/>'; },
        zone(z) {
          const t = TINT[z.theme] || TINT.town, x = z.x0 + 8, y = z.y0 + 8, w = z.x1 - z.x0 - 16, h = z.y1 - z.y0 - 16;
          return '<g><rect x="' + (x + 4) + '" y="' + (y + 6) + '" width="' + w + '" height="' + h + '" rx="18" fill="#000" opacity=".35"/>' +
            '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="18" fill="' + t[0] + '" stroke="' + t[1] + '" stroke-width="3"/>' +
            '<rect x="' + (x + 8) + '" y="' + (y + 8) + '" width="' + (w - 16) + '" height="' + (h - 16) + '" rx="12" fill="none" stroke="#f6efe2" stroke-opacity=".18" stroke-width="2"/></g>';
        },
        decor(theme, r) {
          if (theme === 'forest' && r < .6) return '<circle cy="-2" r="7" fill="#4caf50" opacity=".8"/><path d="M0 6v8" stroke="#6b4a2a" stroke-width="2"/>';
          if (theme === 'volcano' || (theme === 'cape' && r < .4)) return '<path d="M-8 6h16l-3-10H-5z" fill="#ffd36a" stroke="#a8740c" stroke-width="1"/>';
          if (r < .35) return '<circle r="5" fill="#ffd36a" stroke="#a8740c" stroke-width="1.2"/>';
          if (r < .7) return '<ellipse cx="-2" cy="1" rx="8" ry="5" fill="#f7f1e6"/><circle cx="5" cy="-1" r="3.5" fill="#f7f1e6"/>';
          return '<rect x="-7" y="-5" width="14" height="10" rx="2" fill="#d7ecf6" stroke="#f4fbff" stroke-width="1"/>';
        },
        sign(label, w) {
          const name = String(label).replace(/^\S+\s+/, '');
          return '<rect x="0" y="0" width="' + w + '" height="28" rx="8" fill="#f6efe2" stroke="#8d6840" stroke-width="2"/>' +
            '<text x="' + (w / 2) + '" y="19" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="13" font-weight="800" fill="#2a241c">' + name + '</text>';
        },
        road: { todo: ['#3a342c', '#6b4a2a', '#efe2c4'], done: ['#3a342c', '#a07848', '#ffd36a'], widths: [16, 8, 3], dash: '2 7', cap: 'round' },
        node(state, num, e, boss) {
          const R = boss ? 30 : 26, fs = num.length > 2 ? 12 : num.length > 1 ? 15 : 18;
          const face = e >= 0 ? C[e] : '#6e6558';
          const txt = '<text y="' + f1(fs * .36) + '" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="' + fs + '" font-weight="800" fill="#2a241c">' + num + '</text>';
          let s = '<rect x="' + (-R - 2) + '" y="' + (-R + 2) + '" width="' + (R * 2 + 4) + '" height="' + (R * 2 + 4) + '" rx="10" fill="#000" opacity=".28"/>';
          if (state === 'locked') return s + '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="10" fill="#3a342c" stroke="#6e6558" stroke-width="2"/><g transform="translate(0 2)">' + lock + '</g>';
          if (state === 'beaten') return s + '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="10" fill="#ffd36a" stroke="#f6efe2" stroke-width="2"/>' + txt;
          if (state === 'current') return s + '<rect x="' + (-R - 4) + '" y="' + (-R - 4) + '" width="' + (R * 2 + 8) + '" height="' + (R * 2 + 8) + '" rx="12" fill="none" stroke="#ffd36a" stroke-width="3"/>' +
            '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="10" fill="' + face + '" stroke="#f6efe2" stroke-width="2"/>' + txt;
          return s + '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="10" fill="' + face + '" fill-opacity=".9" stroke="#f6efe2" stroke-width="2"/>' + txt;
        },
        start() {
          return '<rect x="-16" y="-16" width="32" height="32" rx="8" fill="#f6efe2" stroke="#8d6840" stroke-width="2"/>' +
            '<text y="5" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="11" font-weight="800" fill="#2a241c">GO</text>' +
            '<text y="36" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="11" font-weight="800" letter-spacing="1.5" fill="#f6efe2">NEST</text>';
        },
        pin() {
          return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="#f7f1e6" stroke="#2a241c" stroke-width="2"/>' +
            '<circle cy="-6" r="7" fill="#f7f1e6" stroke="#2a241c" stroke-width="1.4"/><circle cx="-2" cy="-10" r="2.2" fill="#f4b6c8"/><circle cx="4" cy="-10" r="2.2" fill="#f4b6c8"/>' +
            '<circle cx="2" cy="-6" r="1.1" fill="#2a241c"/>';
        },
      };
    })(),
  });
})();
