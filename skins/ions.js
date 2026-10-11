// Ion Channels: a lab microscope. Dark teal-black field, glowing membranes, four ion shapes (matching lab/ions.html:
// 0 green sphere, 1 red triangle, 2 gold cube, 3 violet diamond).
(function () {
  const COL = ['#3ef0b4', '#ff5f8f', '#ffbd3a', '#8f93ff'], DEEP = ['#0d4a3c', '#4d1028', '#4a3208', '#1d1f5a'];
  const NAMES = ['green', 'red', 'gold', 'violet'];
  const FONT = "'Space Grotesk','Inter',system-ui,sans-serif", CY = '#5fe6ff';
  const f1 = n => Math.round(n * 10) / 10;
  const hash = n => { let t = (Math.imul(n | 0, 0x9E3779B1) ^ 0x85EBCA6B) >>> 0; t = Math.imul(t ^ t >>> 15, 2246822519) >>> 0; t = Math.imul(t ^ t >>> 13, 3266489917) >>> 0; return ((t ^ t >>> 16) >>> 0) / 4294967296; };
  // ion shape path (radius about r) centred on 0,0
  function shape(e, r) {
    if (e === 0) return '<circle r="' + f1(r) + '"';
    if (e === 1) return '<path d="M0 ' + f1(-1.2 * r) + 'L' + f1(1.1 * r) + ' ' + f1(.75 * r) + 'L' + f1(-1.1 * r) + ' ' + f1(.75 * r) + 'Z"';
    if (e === 2) return '<rect x="' + f1(-.82 * r) + '" y="' + f1(-.82 * r) + '" width="' + f1(1.64 * r) + '" height="' + f1(1.64 * r) + '" rx="' + f1(.22 * r) + '"';
    return '<path d="M0 ' + f1(-1.22 * r) + 'L' + f1(r) + ' 0L0 ' + f1(1.22 * r) + 'L' + f1(-r) + ' 0Z"';
  }
  // one glowing ion: soft halo, solid body, bright rim, specular dot (no ids, no gradients: safe to repeat)
  function ion(e, x, y, r, mark) {
    return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')"><circle r="' + f1(r * 1.9) + '" fill="' + COL[e] + '" opacity=".16"/>' +
      shape(e, r) + ' fill="' + COL[e] + '" stroke="#e9ffff" stroke-width="' + f1(Math.max(.8, r / 9)) + '" stroke-opacity=".8"/>' +
      '<circle cx="' + f1(-r * .3) + '" cy="' + f1(-r * .3) + '" r="' + f1(r * .2) + '" fill="#fff" opacity=".8"/>' +
      (mark ? '<path d="M' + f1(r * .9) + ' ' + f1(-r * 1.55) + 'l' + f1(r * .18) + ' ' + f1(r * .4) + 'l' + f1(r * .42) + ' 0l' + f1(-r * .34) + ' ' + f1(r * .28) + 'l' + f1(r * .13) + ' ' + f1(r * .42) + 'l' + f1(-r * .39) + ' ' + f1(-r * .26) + 'l' + f1(-r * .39) + ' ' + f1(r * .26) + 'l' + f1(r * .13) + ' ' + f1(-r * .42) + 'l' + f1(-r * .34) + ' ' + f1(-r * .28) + 'l' + f1(r * .42) + ' 0Z" fill="#fff"/>' : '') + '</g>';
  }
  const memb = (x, y, w, h, e, rx) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 22) + '" fill="' + COL[e] + '" fill-opacity=".07" stroke="' + COL[e] + '" stroke-opacity=".7" stroke-width="2"/>' +
    '<rect x="' + (x + 3) + '" y="' + (y + 3) + '" width="' + (w - 6) + '" height="' + (h - 6) + '" rx="' + ((rx || 22) - 3) + '" fill="none" stroke="' + COL[e] + '" stroke-opacity=".25" stroke-width="1"/>';
  const say = (x, y, s, t, col, a) => '<text x="' + x + '" y="' + y + '" text-anchor="' + (a || 'middle') + '" font-family="' + FONT + '" font-size="' + s + '" font-weight="500" fill="' + (col || '#bfeaf2') + '">' + t + '</text>';
  const field = '<rect width="300" height="250" fill="#031014"/><g stroke="#5fe6ff" stroke-opacity=".05">' + Array.from({ length: 9 }, (_, i) => '<path d="M' + (i * 38) + ' 0V250"/>').join('') + Array.from({ length: 7 }, (_, i) => '<path d="M0 ' + (i * 38) + 'H300"/>').join('') + '</g>';
  const svg = (inner, css) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (css ? '<style>@media (prefers-reduced-motion: no-preference){' + css + '}</style>' : '') + field + inner + '</svg>';
  const pent = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const signal = (cx, cy, R, dash) => '<g class="sg"><circle cx="' + cx + '" cy="' + cy + '" r="' + R * 1.5 + '" fill="' + CY + '" opacity=".1"/><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#06232b" stroke="' + CY + '" stroke-width="2"' + (dash ? ' stroke-dasharray="5 4"' : '') + '/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + f1(R * .35) + '" fill="' + CY + '" opacity=".85"/></g>';
  const SG = '.sg{animation:sg 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes sg{50%{transform:scale(1.1)}}';
  const rimCols = [0, 1, 2, 3, 1];

  // title: the signal in the middle, five marked ions round it in all four colours
  const tp = pent(150, 118, 66);
  const titleSvg = svg(tp.map(p => '<path d="M150 118L' + f1(p[0]) + ' ' + f1(p[1]) + '" stroke="' + CY + '" stroke-opacity=".3" stroke-dasharray="3 4"/>').join('') +
    tp.map((p, i) => ion(rimCols[i], p[0], p[1], 15, true)).join('') + signal(150, 118, 24, true) +
    say(150, 222, 15, 'free a chamber for the signal', CY), SG);

  const p1 = svg(tp.map(p => '<path d="M150 112L' + f1(p[0]) + ' ' + f1(p[1] - 6) + '" stroke="' + CY + '" stroke-opacity=".3" stroke-dasharray="3 4"/>').join('') +
    pent(150, 112, 62).map((p, i) => ion(rimCols[i], p[0], p[1], 14, true)).join('') + signal(150, 112, 22, true) +
    say(150, 208, 14, 'the signal is repelled by 5 marked ions') + say(150, 228, 14, 'all four chambers are taken', '#ff9ab5'), SG);

  const cell = (marks) => memb(24, 22, 120, 92, 0) + memb(156, 22, 120, 92, 1) + memb(24, 128, 120, 92, 2) + memb(156, 128, 120, 92, 3) + marks;
  const p2 = svg(cell(
    [[60, 52, 0], [100, 84, 0], [190, 56, 1], [236, 90, 1], [58, 160, 2], [104, 190, 2], [200, 160, 3], [240, 192, 3]].map(q => ion(q[2], q[0], q[1], 11, false)).join('') +
    '<path d="M100 84L60 52M236 90L190 56" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 3"/>') +
    say(84, 240, 12, 'green', COL[0]) + say(216, 240, 12, 'violet', COL[3]) + say(150, 12, 11, 'four chambers, one colour each', CY));

  const p3 = svg(
    memb(22, 40, 120, 130, 0) + memb(158, 40, 120, 130, 1) +
    ion(0, 62, 90, 14, false) + ion(0, 104, 120, 14, false) +
    '<path d="M62 90L104 120" stroke="#ff4d6d" stroke-width="2" stroke-dasharray="2 4"/><g stroke="#ff4d6d" stroke-width="3" stroke-linecap="round"><path d="M78 98l10 10M88 98l-10 10"/></g>' +
    ion(1, 220, 100, 14, false) +
    say(150, 196, 14, 'ions that repel each other') + say(150, 216, 14, 'can never share a chamber') +
    say(82, 32, 11, 'repelling pair, same chamber', '#ff9ab5'));

  const p4 = svg(
    memb(14, 28, 112, 110, 0) + memb(174, 28, 112, 110, 1) +
    '<g class="mv">' + ion(0, 50, 70, 12, false) + '</g>' + ion(1, 232, 58, 12, false) + ion(1, 226, 108, 12, false) + ion(0, 78, 106, 12, false) +
    '<path d="M50 70L78 106M232 58L226 108M50 70L226 108" stroke="' + CY + '" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="3 3"/>' +
    '<path d="M132 84H168M160 77l8 7l-8 7M168 100H132M140 93l-8 7l8 7" fill="none" stroke="' + CY + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    say(150, 170, 14, 'move one ion and its whole linked') + say(150, 190, 14, 'group (a chain) trades chambers') +
    say(150, 218, 12, 'drag it across, or tap it then the chamber', CY),
    '.mv{animation:mv 3s ease-in-out infinite}@keyframes mv{0%,30%{transform:translateX(0)}60%,100%{transform:translateX(0)}45%{transform:translateX(6px)}}');

  const p5 = svg(
    memb(78, 24, 144, 96, 2) + ion(2, 120, 62, 12, true) + ion(2, 178, 86, 12, true) +
    '<g transform="translate(150 150)"><path d="M-9 -2V-10A9 9 0 0 1 9 -10V-2" fill="none" stroke="#ff9ab5" stroke-width="3" stroke-linecap="round"/><rect x="-13" y="-2" width="26" height="20" rx="4" fill="#ffbd3a" stroke="#031014" stroke-width="2"/><circle cy="8" r="3" fill="#031014"/></g>' +
    say(150, 196, 14, 'two marked ions in one chain: locked.', '#ff9ab5') + say(150, 216, 14, 'the chain cannot leave without both.', '#ff9ab5') + say(150, 238, 12, 'a locked move only rocks the chamber', CY));

  const p6 = svg(
    memb(22, 24, 120, 90, 0) + memb(158, 24, 120, 90, 3) + memb(22, 126, 120, 90, 2, 22) + memb(158, 126, 120, 90, 1) +
    ion(0, 62, 60, 12, true) + ion(0, 104, 80, 12, true) + ion(3, 200, 56, 12, true) + ion(1, 222, 160, 12, true) + ion(1, 186, 184, 12, true) +
    '<circle cx="82" cy="170" r="22" fill="' + CY + '" opacity=".14"/><circle cx="82" cy="170" r="14" fill="#06232b" stroke="#fff6c8" stroke-width="2.4"/>' +
    '<path d="M76 170l4 4l8 -9" fill="none" stroke="#fff6c8" stroke-width="2.6" stroke-linecap="round"/>' +
    say(150, 238, 13, 'one chamber free of marked ions: the signal docks', CY));

  FTH_SKINS.register({
    id: 'ions', name: 'Ion Channels', ic: '⚛️', blurb: 'glowing ions in a living cell',
    src: 'lab/ions.html',
    hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 30% 20%, #0b2a30 0%, #04141a 55%, #020a0d 100%)',
      '--sk-ink': '#d6f6fb',
      '--sk-accent': '#5fe6ff',
      '--sk-card': 'linear-gradient(160deg, rgba(14,44,52,.96), rgba(5,20,26,.97))',
      '--sk-card-ink': '#d6f6fb',
      '--sk-hud': 'linear-gradient(180deg, rgba(8,32,38,.96), rgba(3,14,18,.96))',
      '--sk-btn': 'linear-gradient(180deg, #5fe6ff, #20b6d8)',
      '--sk-btn-ink': '#031014',
      '--sk-btn-shadow': '#0f6f86',
      '--sk-font': "'Space Grotesk', 'Inter', system-ui, sans-serif",
      '--sk-radius': '16px',
    },
    css: '.tl .tin{transition:filter .15s}.tl.lit .tin{filter:brightness(1.35)}.tl.glow .tin{filter:drop-shadow(0 0 6px #5fe6ff) drop-shadow(0 0 2px #fff)}',
    fonts: ['https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'The signal needs a chamber', text: 'The signal is repelled by 5 marked ions. They sit in all four chambers, so it has nowhere to land.', svg: p1 },
      { title: 'Chambers and repulsion', text: 'Every ion lives in one chamber. Ions that repel each other can never share one.', svg: p3 },
      { title: 'Move a chain', text: 'Move one ion to another chamber and every linked ion that repels it follows, trading places.', svg: p4 },
      { title: 'Locks', text: 'If a chain holds two marked ions it is locked: it only rocks, nothing moves.', svg: p5 },
      { title: 'Free a chamber', text: 'When one chamber holds no marked ions, a channel opens and the signal docks.', svg: p6 },
    ],
    bonus: {
      label: 'ION BONUS',
      board: 'radial-gradient(ellipse at 50% 40%, #0a2a30, #031014 75%)',
      line: '#5fe6ff',
      tile(x, y, r, e, k) {
        const s = r * 0.7;
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<circle r="' + f1(r * .98) + '" fill="' + COL[e] + '" fill-opacity=".1" stroke="' + COL[e] + '" stroke-opacity=".55" stroke-width="1.4"/>' +
          shape(e, s) + ' fill="' + COL[e] + '" stroke="#e9ffff" stroke-opacity=".8" stroke-width="1.2"/>' +
          '<circle cx="' + f1(-s * .3) + '" cy="' + f1(-s * .3) + '" r="' + f1(s * .2) + '" fill="#fff" opacity=".8"/></g></g>';
      },
    },
    map: {
      sea: ['#103c46', '#0f3640', '#0d303a', '#0c2a33', '#0a242c', '#091e26', '#07181f', '#061319', '#050f14'],
      seaX: '#020a0d',
      fog: '#010608',
      unknown: '#3b5a5e',
      ramp: ['#3ef0b4', '#ffe14d', '#ffa23a', '#ff5f8f'],
      grey: '#7d949a',
      route: '#5fe6ff',
      ink: 'rgba(190,240,250,.85)',
      cell(path, x, y, r) { // a round-cornered cell, like a membrane vesicle
        const h = r * .866, pts = [[r, 0], [r / 2, h], [-r / 2, h], [-r, 0], [-r / 2, -h], [r / 2, -h]];
        path.moveTo(x + (pts[5][0] + pts[0][0]) / 2, y + (pts[5][1] + pts[0][1]) / 2);
        for (let i = 0; i < 6; i++) {
          const p = pts[i], q = pts[(i + 1) % 6];
          path.quadraticCurveTo(x + p[0], y + p[1], x + (p[0] + q[0]) / 2, y + (p[1] + q[1]) / 2);
        }
        path.closePath();
      },
    },
    words: { win: 'Signal received!', perfect: 'Perfect route! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'COLOURING SPACE' },
  });
})();
