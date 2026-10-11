// Island Map: a bright cartoon treasure map. Sea-blue page, sandy island, chunky countries with dark outlines,
// an element icon on a dark plate in each, and a row of flags as the goal. Matches lab/map.html.
(function () {
  const INK = '#1c1640', SAND = '#f7d98a', GRASS = '#8fd36b', GOLD = '#ffd84a';
  const COL = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'], DK = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'], NEON = ['#ff7a52', '#5ab4ff', '#ffe066', '#5cff8a'];
  const ICON = [
    'M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2.4 1.1-4.1 2.3-5.2.1 1.6.8 2.7 1.9 3.3C10.3 8 11 5 12 2z',
    'M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z',
    'M3 8.5h11a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8M3 16.5h8',
    'M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M6 18c3-4 6-7 9-9',
  ];
  const f1 = n => Math.round(n * 10) / 10;
  const hash = n => { let t = (Math.imul(n | 0, 0x9E3779B1) ^ 0x85EBCA6B) >>> 0; t = Math.imul(t ^ t >>> 15, 2246822519) >>> 0; t = Math.imul(t ^ t >>> 13, 3266489917) >>> 0; return ((t ^ t >>> 16) >>> 0) / 4294967296; };
  // a rounded, slightly lumpy country outline round (cx, cy): smooth closed curve through the midpoints of a jittered 7-gon
  function blob(cx, cy, r, seed) {
    const n = 7, P = [];
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n + 0.3, k = r * (1 + (hash(seed * 11 + i * 7) - 0.5) * 0.22); P.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]); }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(P[n - 1], P[0]);
    let d = 'M' + f1(m0[0]) + ' ' + f1(m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(P[i], P[(i + 1) % n]); d += 'Q' + f1(P[i][0]) + ' ' + f1(P[i][1]) + ' ' + f1(m[0]) + ' ' + f1(m[1]); }
    return d + 'Z';
  }
  const icon = (e, x, y, s, col) => '<g transform="translate(' + f1(x - 12 * s) + ' ' + f1(y - 12 * s) + ') scale(' + f1(s) + ')">' +
    (e === 2 ? '<path d="' + ICON[2] + '" fill="none" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round"/>' : '<path d="' + ICON[e] + '" fill="' + col + '"/>') + '</g>';
  // one country of element e (e < 0: the grey "?" hole)
  function country(cx, cy, r, e, seed, extra) {
    const d = blob(cx, cy, r, seed), c = e < 0 ? '#aab4bf' : COL[e], dk = e < 0 ? '#5a636e' : DK[e], nn = e < 0 ? '#e6edf3' : NEON[e], pr = r * 0.4;
    return '<path d="' + d + '" fill="' + c + '"/><path d="' + d + '" fill="none" stroke="' + nn + '" stroke-width="' + f1(r * 0.12) + '" opacity=".5" transform="translate(' + f1(-r * .03) + ' ' + f1(-r * .03) + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + f1(Math.max(2, r * 0.1)) + '" stroke-linejoin="round"/>' +
      '<circle cx="' + f1(cx) + '" cy="' + f1(cy + pr * .14) + '" r="' + f1(pr) + '" fill="' + dk + '"/><circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(pr) + '" fill="#07090d" stroke="' + nn + '" stroke-width="' + f1(Math.max(1.2, pr * .14)) + '"/>' +
      (e < 0 ? '<text x="' + f1(cx) + '" y="' + f1(cy + pr * .08) + '" text-anchor="middle" dominant-baseline="central" font-family="Fredoka,system-ui,sans-serif" font-weight="700" font-size="' + f1(pr * 1.4) + '" fill="#fff">?</text>' : icon(e, cx, cy, pr * 1.25 / 24, nn)) + (extra || '');
  }
  const rimPos = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const flag = (x, y, e, s, down) => '<g transform="translate(' + x + ' ' + (down ? y + 8 * s : y) + ') scale(' + s + ')"' + (down ? ' opacity=".55"' : '') + '><path d="M0 -4V26" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/><circle cx="0" cy="-4" r="2.2" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="1.2"/>' +
    '<g class="wv"><path d="M1 -2H17.5L14.2 3.2L17.5 8.4H1Z" fill="' + COL[e] + '" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>' + icon(e, 7.3, 3.2, .0125 * 24 / 24 * 1.0, '#fff').replace(/scale\([^)]*\)/, 'scale(.3)').replace(/translate\([^)]*\)/, 'translate(3.7 -0.4)') + '</g></g>';
  // sea + island backdrop for a 300x250 page
  const sea = '<defs><radialGradient id="mseaG" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#46b8ea"/><stop offset="1" stop-color="#1f86c4"/></radialGradient></defs><rect width="300" height="250" fill="url(#mseaG)"/>' +
    [[20, 30], [250, 24], [36, 222], [262, 214], [150, 14], [150, 238]].map(w => '<path d="M' + w[0] + ' ' + w[1] + 'q5 -5 10 0t10 0" stroke="#fff" stroke-width="2.2" fill="none" opacity=".5" stroke-linecap="round"/>').join('');
  const island = (cy) => '<ellipse cx="150" cy="' + cy + '" rx="132" ry="108" fill="#7fd6ff" opacity=".5"/><ellipse cx="150" cy="' + cy + '" rx="124" ry="100" fill="' + SAND + '" stroke="#fff3c4" stroke-width="3"/>' +
    '<ellipse cx="150" cy="' + cy + '" rx="114" ry="90" fill="' + GRASS + '" stroke="' + INK + '" stroke-width="2.6"/>';
  const STY = '<style>@media (prefers-reduced-motion: no-preference){.wv{transform-box:fill-box;transform-origin:0 50%;animation:fw .7s ease-in-out infinite alternate}@keyframes fw{to{transform:skewY(-7deg) scaleX(.9)}}' +
    '.bob{transform-box:fill-box;transform-origin:center;animation:bb 1.6s ease-in-out infinite alternate}@keyframes bb{to{transform:translateY(-3px) scale(1.06)}}' +
    '.mv{animation:mv 3s ease-in-out infinite}@keyframes mv{0%,15%{transform:translate(0,0)}60%,100%{transform:translate(42px,28px)}}' +
    '.fl{animation:fl 3s ease-in-out infinite}@keyframes fl{0%,50%{opacity:0}70%,100%{opacity:1}}' +
    '.mk{stroke-dasharray:6 5;animation:mk 1.6s linear infinite}@keyframes mk{to{stroke-dashoffset:-22}}}</style>';
  const svg = b => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + STY + sea + b + '</svg>';
  const say = (x, y, s, t, col) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="700" font-size="' + s + '" fill="' + (col || '#fff') + '" stroke="' + INK + '" stroke-width="' + f1(s / 5) + '" paint-order="stroke" stroke-linejoin="round">' + t + '</text>';
  const holeRing = (cx, cy, R, cols, hr, holeSvg, sr) => rimPos(cx, cy, R).map((p, i) => country(p[0], p[1], sr || 27, cols[i], 3 + i)).join('') + (holeSvg || country(cx, cy, hr || 28, -1, 9, '<circle cx="' + cx + '" cy="' + cy + '" r="' + ((hr || 28) + 3) + '" fill="none" stroke="' + GOLD + '" stroke-width="3" class="mk"/>'));
  const finger = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><circle r="12" fill="#fff" opacity=".4"/><circle r="7.5" fill="#fff" stroke="' + INK + '" stroke-width="2"/></g>';

  const titleSvg = svg(island(125) + holeRing(150, 122, 62, [0, 1, 2, 3, 1], 29, null, 29).replace('class="mk"', 'class="mk bob"') +
    flag(36, 44, 3, 1.1) + say(150, 232, 17, 'find a free flag'));

  const introP1 = svg(island(122) + holeRing(150, 118, 62, [0, 1, 2, 3, 0], 28, null, 27) +
    [0, 1, 2, 3].map((e, i) => flag(78 + i * 48, 206, e, 1.15, true)).join('') + say(150, 240, 14, 'all four flags are flown next door'));
  const introP2 = svg(island(122) +
    country(100, 96, 34, 0, 21) + country(168, 88, 32, 1, 22) + country(212, 138, 30, 0, 23) + country(122, 160, 32, 1, 24) + country(60, 150, 26, 3, 25) +
    '<g class="mv">' + finger(100, 96) + '</g>' + '<path d="M102 98 L140 118" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7" fill="none"/>' +
    say(150, 30, 15, 'press, then drag over a border'));
  const introP3 = svg(island(122) +
    country(80, 100, 30, 0, 31) + country(150, 80, 30, 1, 32) + country(220, 100, 30, 0, 33) + country(115, 160, 30, 1, 34) + country(185, 165, 30, 3, 35) +
    '<g class="fl">' + country(80, 100, 30, 1, 31) + country(150, 80, 30, 0, 32) + country(220, 100, 30, 1, 33) + country(115, 160, 30, 0, 34) + '</g>' +
    say(150, 30, 15, 'the whole red + blue chain swaps'));
  const introP4 = svg(island(118) + holeRing(150, 112, 60, [0, 1, 0, 1, 2], 27, null, 26) +
    '<g transform="translate(150 206)"><path d="M-12 -2V-12A12 12 0 0 1 12 -12V-2" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/><rect x="-17" y="-4" width="34" height="26" rx="6" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="3"/><circle cy="9" r="3.5" fill="' + INK + '"/></g>' +
    say(150, 244, 13, 'a chain that wraps the rim only renames'));
  const introP5 = svg(island(118) + holeRing(150, 112, 60, [0, 1, 2, 0, 1], 27, country(150, 112, 28, 3, 9), 26) +
    flag(168, 80, 3, 1.4) + say(150, 232, 17, 'free flag: planted!', GOLD));

  const tileHex = (r, seed) => blob(0, 0, r, seed);
  FTH_SKINS.register({
    id: 'map', name: 'Island Map', ic: '🗺️', blurb: 'drag across a border',
    src: 'lab/map.html', needs: ['cells'],
    hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 50% 40%, #46b8ea, #1f86c4 80%)',
      '--sk-ink': '#ffffff',
      '--sk-accent': GOLD,
      '--sk-card': 'linear-gradient(180deg, #fff3c9, #f7d98a)',
      '--sk-card-ink': INK,
      '--sk-hud': 'linear-gradient(180deg, #2a9fd8, #1b78b3)',
      '--sk-btn': 'linear-gradient(180deg, #8af574, #4caf50)',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': '#1a6b2a',
      '--sk-font': "'Fredoka', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
      '--sk-radius': '20px',
    },
    css: '.tl .hl{opacity:0;transition:opacity .15s}.tl.lit .hl{opacity:1}.tl.lit .hx{stroke-width:3.6}.tl.glow .tin{filter:drop-shadow(0 0 5px #fff) drop-shadow(0 0 2px ' + INK + ')}',
    fonts: ['https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'A flag for the ?', text: 'The grey ? country needs a flag no neighbour flies. Its five neighbours already fly all four.', svg: introP1 },
      { title: 'Drag over a border', text: 'Press a country and drag across a border into a neighbour of another element. Their two elements will swap.', svg: introP2 },
      { title: 'Whole chains swap', text: 'Every touching country of those two elements swaps with them. Look for a swap that drops a flag from the rim.', svg: introP3 },
      { title: 'Wrapped chains are locked', text: 'A chain that circles the whole rim only renames its two elements: nothing really changes.', svg: introP4 },
      { title: 'Raise the flag', text: 'Once the neighbours fly only three flags, the fourth is free and the ? country plants it.', svg: introP5 },
    ],
    bonus: {
      label: 'TREASURE BONUS',
      board: 'radial-gradient(ellipse at 50% 40%, #46b8ea, #1f86c4 85%)',
      line: '#ffffff',
      tile(x, y, r, e, k) {
        const R = r * 0.95, pr = R * 0.5, d = tileHex(R, k * 5 + e);
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
          '<path class="hl" d="' + blob(0, 0, R * 1.13, k * 5 + e) + '" fill="#fff"/>' +
          '<path d="' + d + '" fill="' + COL[e] + '"/>' +
          '<path class="hx" d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<circle cy="' + f1(pr * .14) + '" r="' + f1(pr) + '" fill="' + DK[e] + '"/><circle r="' + f1(pr) + '" fill="#07090d" stroke="' + NEON[e] + '" stroke-width="1.6"/>' +
          icon(e, 0, 0, pr * 1.25 / 24, NEON[e]) + '</g></g>';
      },
    },
    map: {
      sea: ['#d8f3ff', '#bfeaff', '#a4def8', '#8ad2f1', '#6fc4e8', '#55b4dc', '#3fa3cf', '#2b8fbd', '#1d7aa6'],
      seaX: '#0f5f8a',
      fog: '#0a4466',
      unknown: '#c9a85c',
      ramp: ['#8af574', '#ffe066', '#ff9a3c', '#ef5a3c'],
      grey: '#aab4bf',
      route: '#ffffff',
      ink: 'rgba(255,255,255,.92)',
      cell(path, x, y, r) {
        const s = Math.round(x * 7) + Math.round(y * 13) * 1009;
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i, k = r * (1 + (hash(s * 7 + i * 31) - 0.5) * 0.14);
          const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k;
          if (i) path.lineTo(px, py); else path.moveTo(px, py);
        }
        path.closePath();
      },
    },
    words: { win: 'Flag up!', perfect: 'Perfect route! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'TREASURE MAP' },
  });
})();
