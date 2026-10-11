// Dots: calm, minimal, airy. A dot is a region, a hairline is a border. See SKIN-SPEC.md.
(function () {
  const C = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'];      // fire, water, air, earth (same as lab/dots.html)
  const INK = '#2d2a26', LINE = '#b9b3a6', PAPER = '#f5f1e8';
  const STY = '<style>.p{fill:none;stroke:' + INK + ';stroke-width:3;stroke-linecap:round;stroke-linejoin:round}' +
    '.h{fill:none;stroke:' + LINE + ';stroke-width:1.2;stroke-dasharray:3 4}.l{stroke:' + LINE + ';stroke-width:1.2}' +
    'text{font-family:Nunito,Quicksand,system-ui,sans-serif;fill:' + INK + ';font-size:13px;text-anchor:middle}' +
    '@media (prefers-reduced-motion: no-preference){.br{animation:br 2.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
    '.fl{animation:fl 3s ease-in-out infinite}.dr{stroke-dasharray:200;animation:dr 3s ease-in-out infinite}' +
    '@keyframes br{50%{transform:scale(1.18)}}@keyframes fl{0%,40%{opacity:0}60%,100%{opacity:1}}' +
    '@keyframes dr{0%{stroke-dashoffset:200}60%,100%{stroke-dashoffset:0}}}</style>';
  const svg = b => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + STY + b + '</svg>';
  const dot = (x, y, e, r, x2) => '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 11) + '" fill="' + C[e] + '"' + (x2 || '') + '/>';
  const ln = (a, b) => '<line class="l" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
  // a hole at (150,115) with a ring of five, colours given
  const ring = (cx, cy, R, cols) => cols.map((e, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a), e];
  });
  const ringSvg = (cols, hole, extra, cls) => {
    const P = ring(150, 120, 62, cols); let s = '';
    P.forEach((p, i) => { s += ln([150, 120], p) + ln(p, P[(i + 1) % 5]); });
    s += hole;
    P.forEach((p, i) => { s += dot(p[0].toFixed(1), p[1].toFixed(1), p[2], 13, cls && cls[i] ? ' class="' + cls[i] + '"' : ''); });
    return s + (extra || '');
  };
  const hole = '<circle class="h" cx="150" cy="120" r="14"/>';
  const cap = t => '<text x="150" y="228">' + t + '</text>';

  const titleSvg = svg(ringSvg([0, 1, 2, 3, 1], hole.replace('class="h"', 'class="h br"'), '', ['', '', '', '', '']) +
    '<text x="150" y="232" style="font-size:12px;opacity:.55;letter-spacing:.14em">FIVE DOTS ROUND AN EMPTY RING</text>');

  const I = [
    { title: 'Fill the hole', text: 'Five dots ring the empty spot, and they use all four colours. Make them use only three, and the hole can take the fourth.',
      svg: svg(ringSvg([0, 1, 2, 3, 1], hole.replace('class="h"', 'class="h br"')) + cap('four colours round the ring')) },
    { title: 'A chain of two', text: 'Dots of two colours that touch form a chain. Here the red and blue dots are joined by a line.',
      svg: svg(ringSvg([0, 1, 2, 3, 1], hole) +
        '<path class="p dr" d="M150 58 L211 102 L211 102" opacity=".0"/>' +
        '<path class="p dr" d="M150 58 L150 120 L88 102" stroke="' + C[0] + '" opacity=".0"/>' +
        '<ellipse class="br" cx="150" cy="58" rx="19" ry="19" fill="none" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<ellipse class="br" cx="88" cy="102" rx="19" ry="19" fill="none" stroke="' + INK + '" stroke-width="1.6"/>' + cap('red and blue touch: one chain')) },
    { title: 'Draw to swap', text: 'Put one finger on a dot and drag along the line of two colours. Every dot you cross trades its colour with its partner.',
      svg: svg('<path class="p" d="M44 140 L100 100 L156 140 L212 100 L262 140" stroke="' + LINE + '" stroke-width="1.4"/>' +
        '<path class="p dr" d="M44 140 L100 100 L156 140 L212 100 L262 140" stroke="' + INK + '" opacity=".55"/>' +
        dot(44, 140, 0) + dot(100, 100, 1) + dot(156, 140, 0) + dot(212, 100, 1) + dot(262, 140, 0) +
        '<g class="fl">' + dot(44, 190, 1) + dot(100, 190, 0) + dot(156, 190, 1) + dot(212, 190, 0) + dot(262, 190, 1) + '</g>' +
        '<text x="150" y="60">drag along red, blue, red, blue</text><text x="150" y="228" style="opacity:.6">every dot on the line trades colours</text>') },
    { title: 'Locked in', text: 'A line that wraps the whole ring cannot help: swapping it only swaps names. Look for a chain that leaves a dot out.',
      svg: svg(ringSvg([0, 1, 0, 1, 2], hole) +
        '<path class="p" d="M150 58 L211 102 L188 174 L112 174 L89 102 Z" stroke="' + LINE + '" opacity=".0"/>' +
        '<g transform="translate(150 120)"><rect x="-10" y="-4" width="20" height="15" rx="3" fill="' + INK + '" opacity=".75"/><path d="M-6 -4 v-5 a6 6 0 0 1 12 0 v5" fill="none" stroke="' + INK + '" stroke-width="2" opacity=".75"/></g>' +
        cap('a closed loop just changes names')) },
    { title: 'Three is enough', text: 'When the ring shows only three colours, the hole is free to take the fourth, and it fills with a quiet pop.',
      svg: svg(ringSvg([0, 1, 2, 0, 1], '<circle cx="150" cy="120" r="14" fill="' + C[3] + '" class="br"/>') + cap('three round the ring: filled')) },
  ];

  FTH_SKINS.register({
    id: 'dots', name: 'Dots', ic: '⚫', blurb: 'one finger, one line of dots',
    src: 'lab/dots.html', hud: 'minimal',
    theme: {
      '--sk-bg': PAPER,
      '--sk-ink': INK,
      '--sk-accent': '#e0a93a',
      '--sk-card': '#fbf8f1',
      '--sk-card-ink': INK,
      '--sk-hud': 'rgba(245,241,232,.85)',
      '--sk-btn': '#2d2a26',
      '--sk-btn-ink': '#f5f1e8',
      '--sk-btn-shadow': '#b9b3a6',
      '--sk-font': "Nunito, Quicksand, 'Avenir Next', system-ui, sans-serif",
      '--sk-radius': '18px',
    },
    fonts: ['https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;800&display=swap'],
    css: '.tl .tin circle.d{transition:r .2s}.tl.lit .tin{opacity:1}.tl.lit .tin circle.d{stroke:#2d2a26;stroke-width:2}' +
      '.tl.glow .tin circle.rg{opacity:.55;stroke-width:1.5}.tl .tin circle.rg{opacity:0}',
    title: { svg: titleSvg },
    intro: I,
    bonus: {
      label: 'BONUS', board: '#f5f1e8', line: '#2d2a26',
      tile(x, y, r, e, k) {
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<circle class="rg" r="' + (r * 0.98).toFixed(1) + '" fill="none" stroke="' + C[e] + '"/>' +
          '<circle class="d" r="' + (r * 0.58).toFixed(1) + '" fill="' + C[e] + '" opacity=".92"/></g></g>';
      },
    },
    map: {
      sea: ['#ebe6d8', '#e3ddcd', '#dad4c2', '#d0cab7', '#c6bfac', '#bcb5a2', '#b1aa97', '#a69f8c', '#9b9481'],
      seaX: '#f5f1e8', unknown: '#e6dfcc',
      ramp: [C[3], C[2], '#ef9a3c', C[0]],
      grey: '#b9b3a6', route: '#2d2a26', ink: 'rgba(45,42,38,.7)',
      cell(path, x, y, r) { path.moveTo(x + r, y); path.arc(x, y, r, 0, Math.PI * 2); },
    },
    words: { win: 'Filled.', perfect: 'The shortest way, quietly done.', par: 'Par is {par}. Can you find it?', chart: 'ALL THE WAYS' },
  });
})();
