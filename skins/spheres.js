// Spheres: the map as a ball-and-stick model. See SKIN-SPEC.md and lab/spheres.html.
(function () {
  const INK = '#e6edf3', NIGHT = '#0d1117', GLASS = '#d5e2f4', STICK = '#3a4454';
  const COL = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'];
  const HI = ['#ffd0c8', '#d6e8ff', '#fff6c4', '#d8ffe4'];
  const FONT = "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif";
  const f1 = n => Math.round(n * 10) / 10;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const sky = '<rect width="300" height="250" fill="' + NIGHT + '"/><rect width="300" height="250" fill="#1a2433" opacity=".55"/>';

  function stick(x1, y1, x2, y2, w, col) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (col || STICK) + '" stroke-width="' + (w || 7) + '" stroke-linecap="round"/>';
  }
  function orb(x, y, r, e) {
    return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<circle cy="' + f1(r * .16) + '" r="' + r + '" fill="#000" opacity=".35"/>' +
      '<circle r="' + r + '" fill="' + COL[e] + '" stroke="#1c1640" stroke-width="1.6"/>' +
      '<circle cx="' + f1(-r * .32) + '" cy="' + f1(-r * .36) + '" r="' + f1(r * .26) + '" fill="' + HI[e] + '"/>' +
      '</g>';
  }
  function glass(x, y, r) {
    return '<g transform="translate(' + x + ' ' + y + ')" class="gl">' +
      '<circle cy="' + f1(r * .14) + '" r="' + r + '" fill="#000" opacity=".28"/>' +
      '<circle r="' + r + '" fill="#9eb4d0" fill-opacity=".28" stroke="' + GLASS + '" stroke-width="1.8"/>' +
      '<text y="' + f1(r * .32) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + f1(r * 1.05) + '" font-weight="800" fill="' + GLASS + '">?</text>' +
      '<circle cx="' + f1(-r * .34) + '" cy="' + f1(-r * .38) + '" r="' + f1(r * .2) + '" fill="#fff" opacity=".75"/>' +
      '</g>';
  }
  const cap = t => '<text x="150" y="232" text-anchor="middle" font-family="' + FONT + '" font-size="15" font-weight="700" fill="' + INK + '">' + t + '</text>';

  const cluster = stick(78, 118, 150, 108) + stick(222, 118, 150, 108) + stick(110, 168, 150, 108) + stick(190, 168, 150, 108) +
    orb(78, 118, 22, 0) + orb(222, 118, 22, 1) + orb(110, 172, 20, 2) + orb(190, 172, 20, 3) + glass(150, 108, 26);

  const titleSvg = svg(sky + cluster + cap('trace a stick, flip the chain'),
    RM('.gl{transform-box:fill-box;transform-origin:center;animation:pl 2.4s ease-in-out infinite}@keyframes pl{50%{opacity:.72}}'));

  const I = [
    { title: 'A glass hole', text: 'Every region is a glossy sphere, and every border is a stick. The hole is the hollow glass one. Its five neighbours are the ring.',
      svg: svg(sky + cluster + cap('four colours on the ring')) },
    { title: 'Trace along a stick', text: 'Press a sphere and drag along a stick onto a neighbour of another colour. The chain of those two colours lights up. Cover every sphere in it, then let go.',
      svg: svg(sky + stick(70, 130, 230, 130, 8, '#9ecbff') + orb(70, 130, 24, 0) + orb(150, 130, 24, 1) + orb(230, 130, 24, 0) + cap('drag from sphere to sphere')) },
    { title: 'A web only renames', text: 'If those two colours form one single chain across the whole model, flipping it just renames them everywhere. The spheres shake, and nothing changes.',
      svg: svg(sky + stick(60, 120, 150, 150, 6, '#6a7688') + stick(150, 150, 240, 120, 6, '#6a7688') + stick(60, 120, 240, 120, 6, '#6a7688') +
        orb(60, 120, 20, 0) + orb(240, 120, 20, 1) + orb(150, 156, 20, 0) + cap('one web: no real change')) },
    { title: 'The glass fills', text: 'Get the ring down to three colours and the glass sphere takes the missing one. Par swaps is three stars.',
      svg: svg(sky + stick(78, 118, 150, 108) + stick(222, 118, 150, 108) + stick(110, 168, 150, 108) + stick(190, 168, 150, 108) +
        orb(78, 118, 22, 0) + orb(222, 118, 22, 1) + orb(110, 172, 20, 2) + orb(190, 172, 20, 0) + orb(150, 108, 26, 3) + cap('three colours: the hole can fill')) },
  ];

  FTH_SKINS.register({
    id: 'spheres', name: 'Spheres', ic: '🔮', blurb: 'glossy balls on sticks',
    coin: { name: 'glass marble', plural: 'glass marbles', glyph: '🔮', value: 16, pitch: 1.35,
      colors: { main: '#d5e4f7', edge: '#6d7f99' },
      svg: FTH_SKINS.coinArt('<circle cy="1.2" r="11" fill="#243044"/><circle r="11" fill="#8ea4c0" fill-opacity=".55" stroke="#1c1640" stroke-width="2"/><circle r="11" fill="none" stroke="#e8eef8" stroke-width="1.3"/><circle cx="-3.4" cy="-3.6" r="3.6" fill="#f4f7ff"/><circle cx="3.8" cy="3.4" r="1.7" fill="#c5d4ea"/>') },
    src: 'lab/spheres.html',
    hud: 'compact',
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
      '.tl.lit .tin{filter:brightness(1.25)}' +
      '.tl.glow .tin{filter:drop-shadow(0 0 5px #9ecbff)}',
    title: { svg: titleSvg },
    intro: I,
    bonus: {
      label: 'SPHERES', board: 'radial-gradient(ellipse at 50% 30%, #1a2433, #0d1117 72%)', line: '#9ecbff',
      tile(x, y, r, e, k) {
        const R = f1(r * .62);
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<circle cy="' + f1(R * .12) + '" r="' + R + '" fill="#000" opacity=".3"/>' +
          '<circle r="' + R + '" fill="' + COL[e] + '" stroke="#1c1640" stroke-width="1.4"/>' +
          '<circle cx="' + f1(-R * .3) + '" cy="' + f1(-R * .32) + '" r="' + f1(R * .24) + '" fill="' + HI[e] + '"/>' +
          '</g></g>';
      },
    },
    map: {
      sea: ['#243044', '#1e2938', '#1a2330', '#161e2a', '#121820', '#0e141c', '#0c1118', '#0a0e14', '#080c12'],
      seaX: '#070a10', fog: '#05070c', unknown: '#4a5568',
      ramp: ['#7dcea0', '#9ecbff', '#e8c547', '#ef5a3c'],
      grey: '#6e7a8a', route: '#d5e4f7', ink: 'rgba(230,237,243,.85)',
      cell(path, x, y, r) { path.moveTo(x + r * .82, y); path.arc(x, y, r * .82, 0, Math.PI * 2); path.closePath(); },
    },
    words: { win: 'The glass fills!', perfect: 'The shortest trace. No shorter chain exists.', par: 'Par is {par} swaps.', chart: 'COLOURINGS' },
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
