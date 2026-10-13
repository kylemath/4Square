// Dots: calm, minimal, lo-fi. A dot is a region, a hairline is a border. Minimal in palette and pace, not in polish:
// every dot in the art is a glossy ink bead (outline, shade, highlight, drop shadow). See SKIN-SPEC.md.
(function () {
  const C = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'];      // fire, water, air, earth (same as lab/dots.html)
  const DK = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'];     // their shade
  const INK = '#2d2a26', LINE = '#b9b3a6', PAPER = '#f5f1e8';
  const f1 = v => Math.round(v * 10) / 10;
  const STY = '<style>.p{fill:none;stroke:' + INK + ';stroke-width:3;stroke-linecap:round;stroke-linejoin:round}' +
    '.h{fill:none;stroke:' + INK + ';stroke-opacity:.45;stroke-width:1.6;stroke-dasharray:3 4}.l{stroke:' + INK + ';stroke-opacity:.22;stroke-width:1.3}' +
    'text{font-family:Nunito,Quicksand,system-ui,sans-serif;fill:' + INK + ';font-size:13px;font-weight:600;text-anchor:middle;opacity:.6;letter-spacing:.06em}' +
    '@media (prefers-reduced-motion: no-preference){.br{animation:br 2.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
    '.fl{animation:fl 3s ease-in-out infinite}.dr{stroke-dasharray:240;animation:dr 3s ease-in-out infinite}' +
    '.bo{animation:bo 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
    '@keyframes br{50%{transform:scale(1.1)}}@keyframes fl{0%,40%{opacity:0}60%,100%{opacity:1}}' +
    '@keyframes bo{0%,45%{transform:scale(0)}60%{transform:scale(1.2)}70%,100%{transform:scale(1)}}' +
    '@keyframes dr{0%{stroke-dashoffset:240}60%,100%{stroke-dashoffset:0}}}</style>';
  const svg = b => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + STY + b + '</svg>';
  // one glossy ink bead: drop shadow, colour with an ink outline, a shaded crescent, a highlight (no ids, no gradients)
  const gloss = (x, y, r, e, extra) => {
    const a0 = -0.3, a1 = 2.05, ri = r * 0.9, R2 = r * 1.18;
    const A = [f1(ri * Math.cos(a0)), f1(ri * Math.sin(a0))], B = [f1(ri * Math.cos(a1)), f1(ri * Math.sin(a1))];
    return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')"' + (extra || '') + '>' +
      '<circle cx="' + f1(r * 0.14) + '" cy="' + f1(r * 0.22) + '" r="' + f1(r) + '" fill="' + INK + '" opacity=".22"/>' +
      '<circle r="' + f1(r) + '" fill="' + C[e] + '" stroke="' + INK + '" stroke-width="' + f1(Math.max(1.4, r * 0.15)) + '"/>' +
      '<path d="M' + A + 'A' + f1(ri) + ' ' + f1(ri) + ' 0 0 1 ' + B + 'A' + f1(R2) + ' ' + f1(R2) + ' 0 0 0 ' + A + 'Z" fill="' + DK[e] + '" opacity=".32"/>' +
      '<ellipse cx="' + f1(-r * 0.36) + '" cy="' + f1(-r * 0.38) + '" rx="' + f1(r * 0.34) + '" ry="' + f1(r * 0.2) + '" transform="rotate(-38 ' + f1(-r * 0.36) + ' ' + f1(-r * 0.38) + ')" fill="#fff" opacity=".78"/>' +
      '<circle cx="' + f1(r * 0.34) + '" cy="' + f1(-r * 0.5) + '" r="' + f1(r * 0.08) + '" fill="#fff" opacity=".6"/></g>';
  };
  const dot = (x, y, e, r, x2) => gloss(x, y, r || 11, e, x2);
  const ln = (a, b) => '<line class="l" x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '"/>';
  // a traced line through points: a dark outline, then the two colours half a segment each
  const trace = (pts, cols, w) => {
    const d = 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
    let s = '<path d="' + d + '" transform="translate(' + f1(w * 0.25) + ' ' + f1(w * 0.4) + ')" fill="none" stroke="' + INK + '" stroke-opacity=".18" stroke-width="' + f1(w * 1.7) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(w * 1.7) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    for (let i = 0; i + 1 < pts.length; i++) {
      const p = pts[i], q = pts[i + 1], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      s += '<path d="M' + f1(p[0]) + ' ' + f1(p[1]) + 'L' + f1(m[0]) + ' ' + f1(m[1]) + '" stroke="' + C[cols[i]] + '" stroke-width="' + f1(w) + '" stroke-linecap="round"/>' +
        '<path d="M' + f1(m[0]) + ' ' + f1(m[1]) + 'L' + f1(q[0]) + ' ' + f1(q[1]) + '" stroke="' + C[cols[i + 1]] + '" stroke-width="' + f1(w) + '" stroke-linecap="round"/>';
    }
    return s;
  };
  // a faint triangular lattice of paper dots over a box
  const lattice = (x0, y0, x1, y1, s, op) => {
    let d = ''; const h = s * Math.sqrt(3) / 2;
    for (let j = 0, y = y0; y <= y1; j++, y += h) for (let x = x0 + (j % 2) * s / 2; x <= x1; x += s) d += 'M' + f1(x) + ' ' + f1(y) + 'h0';
    return '<path d="' + d + '" stroke="' + INK + '" stroke-opacity="' + (op || 0.12) + '" stroke-width="2.2" stroke-linecap="round"/>';
  };
  // a hole at (cx, cy) with a ring of five, colours given
  const ring = (cx, cy, R, cols) => cols.map((e, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a), e];
  });
  // the four seeds in the hole: hollow when a rim dot has that colour, full when it is free
  const seeds = (cx, cy, so, used, r) => [[0, -so], [so, 0], [0, so], [-so, 0]].map(([dx, dy], e) => used.includes(e) ?
    '<circle cx="' + f1(cx + dx) + '" cy="' + f1(cy + dy) + '" r="' + f1(r * 0.62) + '" fill="none" stroke="' + C[e] + '" stroke-width="' + f1(r * 0.3) + '" opacity=".7"/>' :
    '<circle class="br" cx="' + f1(cx + dx) + '" cy="' + f1(cy + dy) + '" r="' + f1(r * 1.15) + '" fill="' + C[e] + '" stroke="' + INK + '" stroke-width="1.2"/>').join('');
  const ringSvg = (cols, hole, extra, cls) => {
    const P = ring(150, 120, 62, cols); let s = lattice(14, 16, 290, 210, 24, 0.09);
    P.forEach((p, i) => { s += ln([150, 120], p) + ln(p, P[(i + 1) % 5]); });
    s += hole;
    P.forEach((p, i) => { s += dot(p[0], p[1], p[2], 14, cls && cls[i] ? ' class="' + cls[i] + '"' : ''); });
    return s + (extra || '');
  };
  const hole = (used, cls) => '<circle class="h' + (cls ? ' ' + cls : '') + '" cx="150" cy="120" r="22" fill="' + PAPER + '"/>' + seeds(150, 120, 10, used, 3.4);
  const cap = t => '<text x="150" y="232">' + t + '</text>';
  const RP = ring(150, 120, 62, [0, 1, 2, 3, 1]);

  // title: the ring of five round an empty, breathing hole, and a few quieter dots further out
  const OUT = [[54, 54, 2], [246, 52, 3], [266, 160, 0], [150, 214, 2], [36, 168, 3]];
  const titleSvg = svg(lattice(10, 14, 292, 238, 24, 0.09) +
    OUT.map((o, i) => ln(o, RP[i]) + ln(o, RP[(i + 4) % 5])).join('') +
    ringSvg([0, 1, 2, 3, 1], hole([0, 1, 2, 3], 'br')) + OUT.map(o => dot(o[0], o[1], o[2], 9)).join(''));

  const I = [
    { title: 'Fill the ring', text: 'Get the five dots round the ring down to three colours.',
      svg: svg(ringSvg([0, 1, 2, 3, 1], hole([0, 1, 2, 3], 'br')) + cap('four colours')) },
    { title: 'A chain', text: 'Touching dots of two colours make one chain.',
      svg: svg(ringSvg([0, 1, 2, 3, 1], hole([0, 1, 2, 3])) +
        '<g class="fl">' + trace([RP[4], RP[0], RP[1]], [1, 0, 1], 4) + '</g>' +
        dot(RP[4][0], RP[4][1], 1, 14) + dot(RP[0][0], RP[0][1], 0, 14) + dot(RP[1][0], RP[1][1], 1, 14) + cap('one chain')) },
    { title: 'Draw to swap', text: 'Drag along a chain and all of it trades colours.',
      svg: svg(lattice(14, 40, 290, 210, 24, 0.09) + '<path d="M44 110 L100 70 L156 110 L212 70 L262 110" fill="none" stroke="' + INK + '" stroke-opacity=".22" stroke-width="1.4"/>' +
        '<path class="p dr" d="M44 110 L100 70 L156 110 L212 70 L262 110" stroke-width="5"/>' +
        dot(44, 110, 0) + dot(100, 70, 1) + dot(156, 110, 0) + dot(212, 70, 1) + dot(262, 110, 0) +
        '<path d="M150 136v22m-7 -7l7 7l7 -7" fill="none" stroke="' + INK + '" stroke-opacity=".45" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<g class="fl">' + dot(44, 190, 1) + dot(100, 190, 0) + dot(156, 190, 1) + dot(212, 190, 0) + dot(262, 190, 1) + '</g>' + cap('all of it trades')) },
    { title: 'Locked', text: 'A chain all round the ring only swaps names.',
      svg: svg(ringSvg([0, 1, 0, 1, 2], '<circle class="h" cx="150" cy="120" r="22" fill="' + PAPER + '"/>') +
        '<path d="M' + ring(150, 120, 62, [0, 0, 0, 0]).map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + '" fill="none" stroke="' + INK + '" stroke-opacity=".4" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>' +
        '<g transform="translate(150 121)"><rect x="-10" y="-4" width="20" height="15" rx="3.5" fill="' + INK + '"/><path d="M-6 -4 v-5 a6 6 0 0 1 12 0 v5" fill="none" stroke="' + INK + '" stroke-width="2.6"/><circle cy="3.5" r="2.2" fill="' + PAPER + '"/></g>' +
        cap('just names')) },
    { title: 'Filled', text: 'Three colours round the ring, and it fills.',
      svg: svg(ringSvg([0, 1, 2, 0, 1], '<circle class="h" cx="150" cy="120" r="22" fill="' + PAPER + '"/>' + dot(150, 120, 3, 20, ' class="bo"')) + cap('filled')) },
  ];

  // ---------- the icon, the reel card and the wordmark (SKIN-SPEC 13) ----------
  const ICON_PTS = [[27, 82], [47, 46], [72, 76], [94, 40]];
  const icon = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="dots-icon-bg" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#fdf9ef"/><stop offset="1" stop-color="#e8dcc2"/></linearGradient>' +
    '<radialGradient id="dots-icon-sun" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="120" height="120" rx="26" fill="url(#dots-icon-bg)"/><rect width="120" height="120" rx="26" fill="url(#dots-icon-sun)"/>' +
    lattice(10, 10, 112, 112, 13, 0.13) +
    '<rect x="2.5" y="2.5" width="115" height="115" rx="24" fill="none" stroke="' + INK + '" stroke-opacity=".14" stroke-width="2"/>' +
    gloss(98, 92, 8, 3) + gloss(22, 26, 7, 2) +
    trace(ICON_PTS, [0, 1, 0, 1], 6.5) +
    ICON_PTS.map((p, i) => gloss(p[0], p[1], 13.5, i % 2)).join('') + '</svg>';

  // the wordmark: "dots" in one round ink line, its o a red bead, and three more beads trailing off
  const wordmark = (op) => {
    const st = 'fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="9"';
    const ink = '<circle cx="40" cy="46" r="13.5" ' + st + '/><path d="M53.5 14V60" ' + st + '/>' +
      '<path d="M114 18V50q0 9 9 9" ' + st + '/><path d="M104 31H124" ' + st + '/>' +
      '<path d="M157 36q-3 -6 -11 -6q-10 0 -10 7.5q0 6 10 7.5q11 1.6 11 8.5q0 8 -11 8q-8 0 -12 -6" ' + st + '/>';
    return '<g opacity="' + (op || 1) + '"><g transform="translate(2 3)" stroke="' + INK + '" stroke-opacity=".2">' + ink + '</g>' +
      '<g stroke="' + INK + '">' + ink + '</g>' +
      gloss(86, 46, 15, 0) + gloss(180, 55, 6.5, 1) + gloss(199, 55, 6.5, 2) + gloss(218, 55, 6.5, 3) + '</g>';
  };
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + wordmark() + '</svg>';

  // the card: a still of play (a red-blue chain being traced round the ring, "x3" drifting off its last dot)
  const card = (function () {
    const cx0 = 120, cy0 = 112, P = [];
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; P.push([cx0 + 56 * Math.cos(a), cy0 + 56 * Math.sin(a)]); }
    const cols = [0, 1, 2, 1, 3];
    const O = [[44, 44, 1], [196, 40, 2], [200, 152, 0], [168, 204, 0], [70, 200, 2], [20, 120, 0]];
    const OE = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3], [4, 3], [5, 4], [5, 3]];
    let s = '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="dots-card-bg" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#fbf7ee"/><stop offset=".72" stop-color="#f1e9d8"/><stop offset="1" stop-color="#e6dac0"/></linearGradient></defs>' +
      '<rect width="240" height="320" rx="20" fill="url(#dots-card-bg)"/>' + lattice(12, 12, 230, 236, 20, 0.11);
    OE.forEach(([o, r]) => { s += '<line x1="' + O[o][0] + '" y1="' + O[o][1] + '" x2="' + f1(P[r][0]) + '" y2="' + f1(P[r][1]) + '" stroke="' + INK + '" stroke-opacity=".2" stroke-width="1.3"/>'; });
    P.forEach((p, i) => {
      const q = P[(i + 1) % 5];
      s += '<line x1="' + f1(p[0]) + '" y1="' + f1(p[1]) + '" x2="' + f1(q[0]) + '" y2="' + f1(q[1]) + '" stroke="' + INK + '" stroke-opacity=".2" stroke-width="1.3"/>' +
        '<line x1="' + f1(p[0]) + '" y1="' + f1(p[1]) + '" x2="' + f1(cx0 + (p[0] - cx0) * 0.4) + '" y2="' + f1(cy0 + (p[1] - cy0) * 0.4) + '" stroke="' + INK + '" stroke-opacity=".25" stroke-width="1.3" stroke-dasharray="2 4"/>';
    });
    s += '<circle cx="' + cx0 + '" cy="' + cy0 + '" r="21" fill="' + PAPER + '" stroke="' + INK + '" stroke-opacity=".45" stroke-width="1.6" stroke-dasharray="3 4"/>' + seeds(cx0, cy0, 10, [0, 1, 2, 3], 3.3);
    // the traced line: blue -> red -> blue -> red, every dot of that chain: a full snake
    s += trace([[O[0][0], O[0][1]], P[0], P[1], [O[2][0], O[2][1]]], [1, 0, 1, 0], 5);
    // rings in the colour each traced dot will become
    [[O[0], 0], [P[0], 1], [P[1], 0], [O[2], 1]].forEach(([p, e]) => { s += '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="21" fill="none" stroke="' + C[e] + '" stroke-width="2.4" opacity=".75"/>'; });
    O.forEach(o => { s += gloss(o[0], o[1], 10, o[2]); });
    P.forEach((p, i) => { s += gloss(p[0], p[1], 14, cols[i]); });
    s += '<circle cx="' + O[2][0] + '" cy="' + O[2][1] + '" r="22" fill="none" stroke="' + INK + '" stroke-opacity=".2" stroke-width="1.4"/>' +
      '<text x="' + (O[2][0] + 14) + '" y="' + (O[2][1] - 30) + '" style="font-family:Nunito,\'Avenir Next\',system-ui,sans-serif;font-size:19px;font-weight:600;fill:' + INK + ';opacity:.62;text-anchor:middle">&#215;3</text>';
    s += '<path d="M0 236H240V300a20 20 0 0 1 -20 20H20a20 20 0 0 1 -20 -20Z" fill="' + PAPER + '" opacity=".75"/><path d="M18 236H222" stroke="' + INK + '" stroke-opacity=".15" stroke-width="1.2"/>' +
      '<g transform="translate(8 238)">' + wordmark() + '</g></svg>';
    return s;
  })();

  FTH_SKINS.register({
    id: 'dots', name: 'Dots', ic: '⚫', blurb: 'one finger, one line of dots',
    icon, card, logo,
    eggs: [
      { id: 'snake-run', on: 'page', pays: true, note: 'trace through every dot of a chain (3 or more): x2, x3 ... up to x6 over consecutive full traces, paying x100 points each (page caps it at 1,800 a level)' },
      { id: 'lava', on: 'page', pays: false, note: 'leave the board untouched for about half a minute: the dots drift slowly like a lava lamp' },
    ],
    coin: { name: 'ink bead', plural: 'ink beads', glyph: '⚫', value: 1, pitch: 0.9,   // this skin's currency (SKIN-SPEC.md section 12)
      colors: { main: '#2d2a26', edge: '#b9b3a6' },
      svg: FTH_SKINS.coinArt('<circle cx="1.4" cy="1.9" r="10.8" fill="#2d2a26" opacity=".28"/>' +
        '<circle r="10.8" fill="#433e37" stroke="#1c1a17" stroke-width="2"/>' +
        '<path d="M9.3 -2.9A9.7 9.7 0 0 1 -4.6 8.5A11.6 11.6 0 0 0 9.3 -2.9Z" fill="#000" opacity=".35"/>' +
        '<circle r="3.4" fill="#f5f1e8" stroke="#1c1a17" stroke-width="1.5"/>' +
        '<ellipse cx="-4.4" cy="-5" rx="3.7" ry="2" transform="rotate(-38 -4.4 -5)" fill="#fff" opacity=".8"/>' +
        '<circle cx="4.6" cy="-6" r="1.1" fill="#fff" opacity=".6"/>') },
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
    // no bonus round: after a win the board fades out and the next level fades in, already started (an endless,
    // lo-fi cycle). The coins a bonus would pay come from the snake-run egg instead (lab/dots.html).
    bonus: {
      flow: 'fade', games: [],
      label: '•', board: '#f5f1e8', line: '#2d2a26',
      tile(x, y, r, e, k) {                       // a glossy bead (kept for any shell screen that draws gems)
        const d = r * 0.62;
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<circle class="rg" r="' + (r * 0.98).toFixed(1) + '" fill="none" stroke="' + C[e] + '"/>' +
          '<circle cx="' + (d * 0.14).toFixed(1) + '" cy="' + (d * 0.22).toFixed(1) + '" r="' + d.toFixed(1) + '" fill="' + INK + '" opacity=".2"/>' +
          '<circle class="d" r="' + d.toFixed(1) + '" fill="' + C[e] + '" stroke="' + INK + '" stroke-width="' + Math.max(1.4, d * 0.14).toFixed(1) + '"/>' +
          '<ellipse cx="' + (-d * 0.36).toFixed(1) + '" cy="' + (-d * 0.38).toFixed(1) + '" rx="' + (d * 0.34).toFixed(1) + '" ry="' + (d * 0.2).toFixed(1) + '" fill="#fff" opacity=".75"/></g></g>';
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
    words: { win: 'Filled.', perfect: 'Shortest way.', par: 'Par {par}', chart: 'ALL THE WAYS' },
  });
})();
