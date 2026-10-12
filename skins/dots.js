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
    coin: { name: 'ink bead', plural: 'ink beads', glyph: '⚫', value: 1, pitch: 0.9,   // this skin's currency (SKIN-SPEC.md section 12)
      colors: { main: '#2d2a26', edge: '#b9b3a6' },
      svg: FTH_SKINS.coinArt('<circle r="12" fill="none" stroke="#b9b3a6" stroke-width="1" stroke-dasharray="2 3"/><circle r="9.6" fill="#2d2a26"/><circle r="6.6" fill="none" stroke="#5c564d" stroke-width="1"/><circle r="2.7" fill="#f5f1e8"/><path d="M-6.4 -3.4A7.2 7.2 0 0 1 -2.4 -6.6" stroke="#f5f1e8" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>') },
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
      '--sk-star-on': '#e0a93a', '--sk-star-edge': '#2d2a26', '--sk-star-off': '#8e8774', '--sk-star-off-edge': '#6f6a5e',
      '--sk-ctl': '#fbf8f1', '--sk-ctl-ink': '#2d2a26', '--sk-ctl-edge': '#2d2a26',
      '--sk-chip': '#fbf8f1',
      '--sk-chip-ink': INK,
      '--sk-edge': INK,
      '--sk-btn2': '#fbf8f1',
      '--sk-btn2-ink': INK,
      '--sk-coin': '#e0a93a',
    },
    fonts: ['https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;800&display=swap'],
    css: '--text:#2d2a26;--dim:#4f4a40;--faint:#6f6a5e;--bg2:#f1ecdf;--line:#b9b3a6;' +
      '.tl .tin circle.d{transition:r .2s}.tl.lit .tin{opacity:1}.tl.lit .tin circle.d{stroke:#2d2a26;stroke-width:2}' +
      '.tl.glow .tin circle.rg{opacity:.55;stroke-width:1.5}.tl .tin circle.rg{opacity:0}' +
      '.mnode .mst{background:#fbf8f1;border:1.5px solid #2d2a26;font-size:.72rem;letter-spacing:2px;box-shadow:none}' +
      '.mnode .mtag{background:#fbf8f1;color:#6b665c;border:1.5px solid #b9b3a6;font-weight:800;box-shadow:none}.mnode .pulse{border:2px solid #e0a93a}' +
      '.btn3d{border:1.5px solid #2d2a26;border-radius:999px;box-shadow:none;font-weight:800;letter-spacing:.02em;min-height:44px}' +
      '.btn3d:active{box-shadow:none;transform:scale(.97)}' +
      '.btn3d:focus-visible{outline:2px solid #e0a93a;outline-offset:3px}' +
      '.btn3d.white,.btn3d.blue,.btn3d.orange{background:#fbf8f1;color:#2d2a26;border-color:#2d2a26}' +
      '.btn3d.yellow{background:#e0a93a;color:#2d2a26;border-color:#2d2a26}' +
      '.btn3d.go{background:#2d2a26;color:#f5f1e8;border-color:#2d2a26}' +
      '.rbtn,.rbtn.sm{border-radius:999px;box-shadow:none}' +
      '.bar .rb{border-radius:999px;border:1.5px solid #2d2a26;box-shadow:none}.bar .rb:active{box-shadow:none}' +
      '.gtop{box-shadow:none;border-bottom:1.5px solid #b9b3a6}' +
      '.badge,.goalbar,.starbar{box-shadow:none;border:1.5px solid #2d2a26;border-radius:999px}' +
      '.badge{background:#fbf8f1;color:#2d2a26;font-weight:800}.badge .s{color:#8a5f00}.badge .p{color:#2d2a26}' +
      '.goalbar,.starbar{background:#fbf8f1;color:#2d2a26}' +
      '.goalbar .tl.one .tin,.goalbar .tl.hole .tin{filter:none}.goalbar .tl.one .tr{stroke:#2d2a26}' +
      '.starbar .st path{stroke-width:1.6}' +
      '.coins{box-shadow:none;background:#e0a93a;color:#2d2a26;border:1.5px solid #2d2a26}.coins::after{display:none}' +
      '.say .msg{background:#fbf8f1;color:#2d2a26;border:1.5px solid #2d2a26;border-radius:18px;box-shadow:none;font-weight:700}' +
      '.say .msg::before{border-right-color:#2d2a26}.say .msg::after{border-right-color:#fbf8f1}' +
      '.say .pinm svg path:first-of-type{fill:#2d2a26;stroke:#2d2a26}' +
      '.say .pinm svg circle:nth-of-type(1){fill:#fbf8f1}.say .pinm svg circle:nth-of-type(n+2):nth-of-type(-n+3){fill:#2d2a26}' +
      '.say .pinm svg circle:nth-of-type(n+4):nth-of-type(-n+5){fill:#fbf8f1}.say .pinm svg circle:nth-of-type(n+6){fill:#e0a93a}' +
      '#brief .card,#win .card,#installSheet .card{border:1.5px solid #b9b3a6;box-shadow:none;border-radius:18px}' +
      '.skins button{border:1.5px solid #2d2a26;border-radius:16px;box-shadow:none}' +
      '.skins button[aria-checked="true"]{box-shadow:none}' +
      '.htnum{box-shadow:none;border:1.5px solid #2d2a26}' +
      '.htdots button.on{background:#e0a93a}' +
      '.btn3d.green{background:#2d2a26;color:#f5f1e8;border-color:#2d2a26;text-shadow:none}' +
      '#briefGo{background:#2d2a26;color:#f5f1e8;box-shadow:none;height:auto;min-height:54px}' +
      '.pill{background:#fbf8f1;color:#2d2a26;border:1.5px solid #2d2a26;box-shadow:none;text-shadow:none}.pill b{color:#8a5f00}' +
      '.mbar{background:linear-gradient(180deg,rgba(245,241,232,.96) 0%,rgba(245,241,232,.8) 70%,rgba(245,241,232,0) 100%)}' +
      '.bar{background:none;box-shadow:none}' +
      '#brief .card p,#brief .card .k,#brief details,#brief .card table,#brief .card td:first-child{color:#4f4a40;text-shadow:none;font-weight:600}' +
      '#brief details summary{color:#2d2a26;text-shadow:none}' +
      '#brief .card .k{color:#6f6a5e;font-weight:800}' +
      '.wtotal{background:#e0a93a;color:#2d2a26;border:1.5px solid #2d2a26;box-shadow:none;text-shadow:none}.wtotal::after{display:none}',
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
    levelMap: (function () {
      const f1 = n => Math.round(n * 10) / 10;
      const HL = (a) => 'rgba(45,42,38,' + a + ')';                       // ink at some opacity
      // a row of dots as one path: zero-length round-capped segments
      const dts = (pts, w, col, op) => '<path d="' + pts.map(p => 'M' + f1(p[0]) + ' ' + f1(p[1]) + 'h0').join('') +
        '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"' + (op != null ? ' opacity="' + op + '"' : '') + '/>';
      const hair = (d, a, w) => '<path d="' + d + '" fill="none" stroke="' + HL(a == null ? 0.4 : a) + '" stroke-width="' + (w || 1.1) + '" stroke-linecap="round" stroke-linejoin="round"/>';
      const ring = (r, a) => '<circle r="' + r + '" fill="none" stroke="' + HL(a) + '" stroke-width="1.1"/>';
      const TINT = {
        cove: ['#e1edf2', '#c3d6df'], beach: ['#f4ead0', '#e2d3ac'], town: ['#f1e4dc', '#dcc7bb'],
        harbour: ['#dbe6ec', '#bccdd7'], forest: ['#e1ebd8', '#c2d3b6'], cape: ['#e9e6f1', '#cdc7de'],
        reef: ['#f3e0da', '#dfbfb6'], cave: ['#e4e1ed', '#c6c0d8'], volcano: ['#f3dccf', '#dfb9a5'],
      };
      const freeSide = z => { const m = z.stops.reduce((s, p) => s + p[0], 0) / z.stops.length; return m > 200 ? 100 : 300; };
      const arcDots = (cx, cy, R, a0, a1, n) => { const o = []; for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / (n - 1); o.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } return o; };

      const motif = {
        cove(z, x, my) {                              // ripple rings
          let s = '<g transform="translate(' + x + ' ' + my + ')">';
          [16, 30, 44, 58].forEach((r, i) => s += ring(r, 0.3 - i * 0.06));
          return s + '<circle r="4" fill="' + C[1] + '"/></g>';
        },
        beach(z, x, my) {                             // a sun-dot with arcs of rays
          const y = z.y1 - 70; let s = '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + C[2] + '"/>';
          [24, 40, 56].forEach((R, i) => s += dts(arcDots(x, y, R, Math.PI, 2 * Math.PI, 7 + i * 3), 3.2 - i * 0.5, C[2], 0.8 - i * 0.18));
          return s + hair('M' + (x - 78) + ' ' + y + 'H' + (x + 78), 0.3);
        },
        town(z) {                                     // a quiet ground line
          return hair('M34 ' + (z.y1 - 30) + 'H366', 0.16);
        },
        harbour(z) {                                  // hairline waves and a quay
          let s = '';
          for (let y = z.y0 + 40; y < z.y1 - 20; y += 30) s += hair('M30 ' + y + 'q10 -6 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0', 0.13);
          return s;
        },
        forest(z) { return ''; },
        cape(z) {                                     // hairline lighthouse with a beam of dots
          const top = z.stops[z.stops.length - 1], left = top[0] > 200, lx = left ? 76 : 324, ly = top[1] + 52, d = left ? 1 : -1;
          let s = '<g transform="translate(' + lx + ' ' + ly + ')">';
          s += '<path d="M-13 0L-8 -62H8L13 0Z" fill="#fbf8f1" stroke="' + HL(0.6) + '" stroke-width="1.3" stroke-linejoin="round"/>' +
            '<path d="M-11.3 -14L-9.8 -26H9.8L11.3 -14ZM-8.8 -42L-8.2 -54H8.2L8.8 -42Z" fill="' + C[0] + '" opacity=".75"/>' +
            '<rect x="-10" y="-76" width="20" height="14" rx="3" fill="#fbf8f1" stroke="' + HL(0.6) + '" stroke-width="1.3"/>' +
            '<circle cy="-69" r="4" fill="' + C[2] + '"/><path d="M-12 -76L0 -88L12 -76Z" fill="' + INK + '" opacity=".8"/>' + hair('M-24 0H24', 0.45);
          [-0.28, 0, 0.28].forEach((a, k) => {
            const pts = []; for (let i = 1; i <= 6; i++) pts.push([d * i * 15 * Math.cos(a), -69 + i * 15 * Math.sin(a)]);
            s += dts(pts, 3.2, C[2], 0.75 - k * 0.0).replace(/^<path/, '<path') ;
          });
          s += '</g>';
          return s + '<text x="' + (left ? 300 : 100) + '" y="' + f1(z.y1 - 36) + '" style="font-size:34px;font-weight:300;fill:' + HL(0.2) + ';text-anchor:middle">π</text>';
        },
        reef(z) { return ''; },
        cave(z, x, my) {                              // one large crystal
          const s = '<g transform="translate(' + x + ' ' + my + ')"><path d="M0 -58L26 -22L18 44L-14 52L-30 -8Z" fill="#8c80b8" fill-opacity=".1" stroke="' + HL(0.45) + '" stroke-width="1.2" stroke-linejoin="round"/>' +
            hair('M0 -58L-6 10L18 44M-30 -8L-6 10L-14 52M26 -22L-6 10', 0.35) + '<path d="M0 -58L26 -22L-6 10L-30 -8Z" fill="#8c80b8" fill-opacity=".1"/></g>';
          return s;
        },
        volcano(z) {                                  // a cone of dots with a glowing crater
          const b = z.stops[0], vx = b[0], vy = b[1]; let s = '';
          s += '<ellipse cx="' + vx + '" cy="' + vy + '" rx="64" ry="42" fill="url(#dotsLava)"/>';
          const cols = ['#ef7a3c', '#f09a52', '#efae78', '#e6bf9c', '#dccab9', '#d9cdc2', '#d9d0c6', '#dad2c9'];
          for (let j = 0; j < 8; j++) {
            const y = vy + 38 + j * 17, hw = Math.min(160, 54 + j * 17), pts = [];
            for (let x = -hw + (j % 2) * 9; x <= hw; x += 18) if (Math.abs(x) > 32 || j > 5) pts.push([vx + x, y]);
            s += dts(pts.filter(p => p[0] > 30 && p[0] < 370), 8.5 - j * 0.3, cols[j], 0.9);
          }
          for (let k = 0; k < 4; k++) s += '<circle cx="' + f1(vx + 30 + k * 10 + (k % 2) * 6) + '" cy="' + (vy - 56 - k * 20) + '" r="' + (6 - k * 1.1) + '" fill="' + HL(0.14 - k * 0.02) + '"/>';
          return s;
        },
      };

      const D = {                                     // decor per theme, ~within +-20
        cove(r, r2) {
          if (r < 0.5) return ring(5 + r2 * 3, 0.38) + ring(11 + r2 * 4, 0.24) + ring(18, 0.12) + '<circle r="2.4" fill="' + C[1] + '" opacity=".8"/>';
          if (r < 0.8) return dts(arcDots(0, 6, 12, Math.PI * 1.1, Math.PI * 1.9, 5), 3, C[1], 0.55);
          return '<circle r="3.5" fill="' + C[1] + '" opacity=".55"/><circle cx="12" cy="-6" r="2" fill="' + C[1] + '" opacity=".4"/>';
        },
        beach(r, r2) {
          if (r < 0.4) return '<circle cy="4" r="4" fill="' + C[2] + '"/>' + dts(arcDots(0, 4, 13, Math.PI, 2 * Math.PI, 6), 2.6, C[2], 0.7);
          if (r < 0.75) return dts([[-8, 4], [0, 1], [7, 5]], 4.5 + r2 * 2, '#d9c796');
          return hair('M-12 0q6 -6 12 0t12 0', 0.3) + '<circle cx="-4" cy="9" r="2" fill="' + C[0] + '" opacity=".55"/>';
        },
        town(r, r2) {
          if (r < 0.7) { const w = 8 + r2 * 4, c = C[(r2 * 4) | 0];
            return '<path d="M' + -w + ' 12V-1H' + w + 'V12Z" fill="#fbf8f1" stroke="' + HL(0.5) + '" stroke-width="1.2" stroke-linejoin="round"/>' +
              '<path d="M' + (-w - 3) + ' -1L0 -12L' + (w + 3) + ' -1" fill="none" stroke="' + HL(0.6) + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>' +
              '<circle cy="7" r="2.6" fill="' + c + '"/>'; }
          return hair('M0 12V2', 0.4) + '<circle cy="-2" r="7" fill="' + C[3] + '" opacity=".5"/>';
        },
        harbour(r, r2) {
          if (r < 0.6) return hair('M-13 4h26l-5 7h-16z', 0.55) + hair('M0 4V-12', 0.45) + '<circle cx="0" cy="-5" r="5.5" fill="' + C[(r2 * 4) | 0] + '" opacity=".85"/>' +
            hair('M-18 16q4.5 -4 9 0t9 0t9 0t9 0', 0.25);
          return '<circle cy="2" r="5" fill="none" stroke="' + C[0] + '" stroke-width="2.4" opacity=".75"/>' + hair('M-14 12q3.5 -4 7 0t7 0t7 0t7 0', 0.25);
        },
        forest(r, r2) {
          const s = r2 > 0.5 ? 1 : 0.8;
          if (r < 0.75) return hair('M0 14V3', 0.45) + dts([[0, -6 * s], [-7 * s, 1], [7 * s, 1]], 11 * s, C[3], 0.55) + dts([[0, -6 * s]], 7 * s, C[3], 0.8);
          return hair('M0 12V4', 0.4) + '<circle cy="0" r="6" fill="' + C[3] + '" opacity=".7"/><circle cx="12" cy="10" r="2" fill="' + C[0] + '" opacity=".6"/>';
        },
        cape(r, r2) {
          if (r < 0.4) return hair('M-8 -2q4 -6 8 0q4 -6 8 0', 0.5);
          if (r < 0.75) return dts([[-6, 5], [4, 3], [10, 7]], 6 + r2 * 3, '#c5bfd6');
          return dts([[0, 0]], 3, C[2], 0.7) + dts([[10, -8]], 2, C[2], 0.5) + dts([[-9, 8]], 2, C[2], 0.5);
        },
        reef(r, r2) {
          const c1 = r2 < 0.5 ? C[0] : '#e8888a';
          if (r < 0.55) return hair('M0 12V-2M0 5L-7 -3M0 2L7 -6', 0.4) + dts([[0, -3], [-7, -4], [7, -7]], 6, c1, 0.85) + dts([[-9, -10], [3, -12]], 3, c1, 0.6);
          if (r < 0.8) return dts([[0, 0], [-8, 5], [8, 5], [0, 10], [-4, -8], [5, -8]], 5, c1, 0.7);
          return dts([[-6, 4], [6, 4], [0, -4]], 5.5, C[1], 0.45);
        },
        cave(r, r2) {
          const k = 8 + r2 * 6;
          if (r < 0.7) return '<path d="M0 ' + -k * 1.5 + 'L' + k * 0.7 + ' ' + -k * 0.3 + 'L' + k * 0.4 + ' ' + k + 'L' + -k * 0.5 + ' ' + k + 'L' + -k * 0.7 + ' ' + -k * 0.3 + 'Z" fill="#8c80b8" fill-opacity=".12" stroke="' + HL(0.4) + '" stroke-width="1.1" stroke-linejoin="round"/>' + hair('M0 ' + -k * 1.5 + 'L0 ' + k + 'M' + -k * 0.7 + ' ' + -k * 0.3 + 'L' + k * 0.7 + ' ' + -k * 0.3, 0.25);
          return dts([[-5, 3], [5, -2], [2, 8]], 3, '#8c80b8', 0.55);
        },
        volcano(r, r2) {
          if (r < 0.5) return dts([[0, 8], [-4, -2], [3, -10]], 5 - r2, '#ef7a3c', 0.7);
          return dts([[0, 6]], 3, '#ef7a3c', 0.4);
        },
      };

      const lock = c => '<rect x="-6" y="-3" width="12" height="9.5" rx="2.2" fill="' + c + '"/><path d="M-3.6 -3v-3a3.6 3.6 0 0 1 7.2 0v3" fill="none" stroke="' + c + '" stroke-width="2"/>';

      return {
        bg: PAPER,
        defs: '<pattern id="dotsGrid" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="1.1" fill="#2d2a26" opacity=".12"/></pattern>' +
          '<radialGradient id="dotsLava"><stop offset="0" stop-color="#ffb347" stop-opacity=".75"/><stop offset=".55" stop-color="#ef7a3c" stop-opacity=".28"/><stop offset="1" stop-color="#ef7a3c" stop-opacity="0"/></radialGradient>',
        backdrop(H) { return '<rect width="400" height="' + H + '" fill="url(#dotsGrid)"/>'; },
        zone(z) {
          const t = TINT[z.theme] || TINT.town, x = z.x0 + 6, w = z.x1 - z.x0 - 12, y = z.y0 + 4, h = z.y1 - z.y0 - 8, my = (z.y0 + z.y1) / 2;
          const side = freeSide(z);
          return '<g><rect x="' + x + '" y="' + (y + 3) + '" width="' + w + '" height="' + h + '" rx="38" fill="' + HL(0.05) + '"/>' +
            '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="38" fill="' + t[0] + '" stroke="' + t[1] + '" stroke-width="1.3"/>' +
            '<rect x="' + (x + 7) + '" y="' + (y + 7) + '" width="' + (w - 14) + '" height="' + (h - 14) + '" rx="32" fill="none" stroke="' + t[1] + '" stroke-width=".9" stroke-dasharray="1 6" stroke-linecap="round"/>' +
            (motif[z.theme] ? motif[z.theme](z, side, my) : '') + '</g>';
        },
        decor(theme, r, r2, z) { return D[theme] ? D[theme](r, r2) : ''; },
        keepOut(z) {                                  // boxes the big motifs and landmarks cover
          const b = [];
          if (z.theme === 'cape') {                   // lighthouse, its beam, and the pi sign
            const top = z.stops[z.stops.length - 1], left = top[0] > 200, lx = left ? 76 : 324, ly = top[1] + 52;
            b.push(left ? [lx - 28, ly - 98, lx + 96, ly + 4] : [lx - 96, ly - 98, lx + 28, ly + 4]);
            const px = left ? 300 : 100; b.push([px - 24, z.y1 - 70, px + 24, z.y1 - 30]);
          } else if (z.theme === 'cove') {            // ripple rings
            const s = freeSide(z), my = (z.y0 + z.y1) / 2; b.push([s - 62, my - 62, s + 62, my + 62]);
          } else if (z.theme === 'beach') {           // sun and its rays
            const s = freeSide(z), y = z.y1 - 70; b.push([s - 82, y - 60, s + 82, y + 6]);
          } else if (z.theme === 'cave') {            // the large crystal
            const s = freeSide(z), my = (z.y0 + z.y1) / 2; b.push([s - 34, my - 62, s + 34, my + 58]);
          } else if (z.theme === 'volcano') {         // the cone of dots and the crater
            const vx = z.stops[0][0], vy = z.stops[0][1]; b.push([Math.max(30, vx - 170), vy - 125, Math.min(370, vx + 170), vy + 162]);
          }
          return b;
        },
        sign(label, w) {
          const name = label.replace(/^\S+\s+/, '').replace(/[^π]+/g, m => m.toUpperCase());
          return '<text x="' + w / 2 + '" y="16" textLength="' + Math.min(w - 8, Math.round(name.length * 9.6)) + '" lengthAdjust="spacing" style="font-size:12px;font-weight:800;letter-spacing:.14em;fill:' + INK + ';text-anchor:middle">' + name + '</text>' +
            '<path d="M0 25.5H' + w + '" stroke="' + HL(0.4) + '" stroke-width="1"/><circle cx="0" cy="25.5" r="2.6" fill="' + INK + '"/>';
        },
        road: { todo: ['none', 'none', LINE], done: ['none', 'none', INK], widths: [0, 0, 5], dash: '0 12.5', cap: 'round' },   // a dotted line
        node(state, num, e, boss) {
          const R = boss ? 30 : 27, c = e >= 0 ? C[e] : LINE, fs = num.length > 3 ? 13 : num.length > 2 ? 15 : num.length > 1 ? 19 : 23;
          const txt = '<text y="' + f1(fs * 0.36) + '" style="font-size:' + fs + 'px;font-weight:800;fill:' + INK + ';text-anchor:middle">' + num + '</text>';
          let s = '<circle cy="2.5" r="' + (R + 3) + '" fill="' + HL(0.07) + '"/><circle r="' + (R + 3.5) + '" fill="' + PAPER + '"/>';
          if (boss) s += '<circle r="' + (R + 7) + '" fill="none" stroke="' + HL(0.5) + '" stroke-width="1" stroke-dasharray="1 5" stroke-linecap="round"/>';
          if (state === 'locked') return s + '<circle r="' + R + '" fill="#fbf8f1" stroke="' + LINE + '" stroke-width="2"/><g transform="translate(0 -1)">' + lock('#a39d90') + '</g>';
          if (state === 'open') return s + '<circle r="' + R + '" fill="' + c + '" fill-opacity=".16" stroke="' + c + '" stroke-width="3"/>' + txt;
          if (state === 'beaten') return s + '<circle r="' + R + '" fill="' + c + '"/><circle r="' + (R + 3.2) + '" fill="none" stroke="' + INK + '" stroke-width="1.3"/>' + txt;
          return '<circle r="38" fill="none" stroke="#e0a93a" stroke-width="3" opacity=".35"/><circle r="34" fill="none" stroke="#e0a93a" stroke-width="2.4" opacity=".7"/>' +
            s + '<circle r="' + R + '" fill="' + c + '"/><circle r="' + (R + 3.2) + '" fill="none" stroke="' + INK + '" stroke-width="1.6"/>' + txt;
        },
        start() {
          return '<circle r="12" fill="none" stroke="' + HL(0.35) + '" stroke-width="1.1"/><circle r="5.5" fill="' + INK + '"/>' +
            '<text y="30" style="font-size:11px;font-weight:800;letter-spacing:.2em;fill:' + INK + ';text-anchor:middle">START</text>';
        },
        pin() {
          const d = 'M0 27C-5 18 -17 10 -17 -4A17 17 0 0 1 17 -4C17 10 5 18 0 27Z';
          return '<path transform="translate(1.5 2)" d="' + d + '" fill="' + HL(0.12) + '"/><path d="' + d + '" fill="' + INK + '"/><circle cy="-4" r="6.5" fill="' + PAPER + '"/>';
        },
      };
    })(),
    words: { win: 'Filled.', perfect: 'The shortest way, quietly done.', par: 'Par is {par}. Can you find it?', chart: 'ALL THE WAYS' },
  });
})();
