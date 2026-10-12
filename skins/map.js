// Island Map: a bright cartoon treasure map. Sea-blue page, sandy island, chunky countries with dark outlines,
// an element icon on a dark plate in each, and a row of flags as the goal. Matches lab/map.html.
(function () {
  const INK = '#1c1640', SAND = '#f7d98a', GRASS = '#8fd36b', GOLD = '#ffd84a', PAPER = '#f3e3b8', BR = '#7a4a24';
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
  // ---------------- the level map: an antique-meets-cartoon treasure chart ----------------
  const levelMap = (function () {
    const BR = '#7a4a24', CREAM = '#f8ecc4', PARCH = '#efdcab', RED = '#d8372b', DRED = '#8e1c17', FF = 'Fredoka,system-ui,sans-serif';
    const O = 'stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';
    const sh = (w, y) => '<ellipse cy="' + (y == null ? 10 : y) + '" rx="' + w + '" ry="' + f1(w * .36) + '" fill="' + INK + '" opacity=".17"/>';
    const circ = (x, y, r, f) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '" ' + O + '/>';
    const pick = (a, r) => a[Math.min(a.length - 1, Math.floor(r * a.length))];
    const star5 = (R, f) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? R * .45 : R; d += (i ? 'L' : 'M') + f1(Math.cos(a) * k) + ' ' + f1(Math.sin(a) * k); } return '<path d="' + d + 'Z" fill="' + f + '" ' + O + '/>'; };
    // a scalloped seal outline of n bumps
    const seal = (R, n, bump) => { let d = ''; for (let i = 0; i < n; i++) { const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n, am = (a0 + a1) / 2, c = R * bump;
      if (!i) d += 'M' + f1(Math.cos(a0) * R) + ' ' + f1(Math.sin(a0) * R);
      d += 'Q' + f1(Math.cos(am) * c) + ' ' + f1(Math.sin(am) * c) + ' ' + f1(Math.cos(a1) * R) + ' ' + f1(Math.sin(a1) * R); } return d + 'Z'; };
    const SEAL = {}; const sealP = (R, n, b) => SEAL[R + '_' + n] || (SEAL[R + '_' + n] = seal(R, n, b));
    const num = (t, y, col, sw) => '<text y="' + y + '" text-anchor="middle" dominant-baseline="central" font-family="' + FF + '" font-weight="700" font-size="' + (t.length > 2 ? 17 : t.length > 1 ? 22 : 26) + '" fill="' + col + '" stroke="' + INK + '" stroke-width="' + sw + '" paint-order="stroke" stroke-linejoin="round">' + t + '</text>';

    // ---- decorations (centred on 0,0, within about +-22) ----
    const D = {
      palm: v => sh(13, 11) + '<path d="M-3 11Q3 0 0 -12" fill="none" stroke="' + INK + '" stroke-width="6.4" stroke-linecap="round"/><path d="M-3 11Q3 0 0 -12" fill="none" stroke="#c28440" stroke-width="3.4" stroke-linecap="round"/>' +
        [-120, -75, -30, 15, 60, 105].map(a => '<path transform="rotate(' + a + ' 0 -12)" d="M0 -12Q6 -26 22 -19Q12 -17 0 -12Z" fill="' + (a % 2 ? '#3f9e52' : '#52b85c') + '" ' + O + '/>').join('') + circ(-2, -10, 2.4, BR) + circ(2.4, -9, 2.2, BR),
      chest: v => sh(12, 8) + '<path d="M-11 -2V7H11V-2Z" fill="#9a5a2a" ' + O + '/><path d="M-11 -2Q-11 -12 0 -12Q11 -12 11 -2Z" fill="#bd7a3d" ' + O + '/><rect x="-2.5" y="-3.5" width="5" height="8" rx="1" fill="#ffd84a" ' + O + '/><path d="M-11 2H11" stroke="#ffd84a" stroke-width="1.4"/>',
      shell: v => sh(8, 6) + '<path d="M0 6Q-12 2 -10 -6Q-4 -12 0 -10Q4 -12 10 -6Q12 2 0 6Z" fill="#ffc9d6" ' + O + '/><path d="M0 5V-9M-5 4L-7 -6M5 4L7 -6" stroke="#e07a96" stroke-width="1.2" fill="none"/>',
      star: v => sh(9, 6) + '<g transform="rotate(' + f1(v * 70 - 35) + ')">' + star5(10, v > .5 ? '#ff9a3c' : '#ff6f61') + '</g>',
      crab: v => sh(10, 7) + '<path d="M-8 0Q-14 -8 -9 -10M8 0Q14 -8 9 -10" stroke="' + INK + '" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M-8 0Q-14 -8 -9 -10M8 0Q14 -8 9 -10" stroke="#ef5a3c" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse rx="9" ry="6" fill="#ef5a3c" ' + O + '/><circle cx="-3" cy="-5" r="1.6" fill="#fff"/><circle cx="3" cy="-5" r="1.6" fill="#fff"/>',
      pool: v => '<ellipse rx="17" ry="10" fill="#aab4a8" ' + O + '/><ellipse rx="13" ry="7" fill="#58c7e4" stroke="#2a8fb0" stroke-width="1.2"/><path d="M-7 -2Q-3 -5 2 -3" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>' + (v > .5 ? '<ellipse cx="4" cy="2" rx="3" ry="1.6" fill="#fff" opacity=".4"/>' : ''),
      rock: v => sh(13, 8) + '<path d="M-14 8L-10 -5L-2 -11L8 -8L14 3L11 8Z" fill="#aab2bd" ' + O + '/><path d="M-10 -5L-2 -11L2 -2Z" fill="#d6dce3"/><path d="M2 -2L8 -8L14 3L11 8L2 8Z" fill="#8892a0"/>',
      hut: v => sh(13, 9) + '<path d="M-10 8V-2H10V8Z" fill="#fff0c8" ' + O + '/><path d="M-13 -1L0 -12L13 -1Z" fill="' + (v > .5 ? RED : '#3d8fe8') + '" ' + O + '/><rect x="-2.5" y="1" width="5" height="7" rx="1" fill="' + BR + '"/>',
      tree: v => sh(11, 10) + '<rect x="-2" y="2" width="4" height="9" fill="' + BR + '" ' + O + '/>' + circ(0, -3, 11, '#46a352') + '<circle cx="-4" cy="-7" r="4.5" fill="#7bcf6a"/>',
      flag: v => '<path d="M0 10V-14" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/><path d="M1 -14H15L12 -9L15 -4H1Z" fill="' + (v > .5 ? RED : '#ffd84a') + '" ' + O + '/>' + sh(5, 10),
      cannon: v => sh(13, 8) + circ(-5, 4, 4.5, '#6b3f1c') + '<path d="M-8 -4L12 -9L14 -2L-6 3Z" fill="#4a5060" ' + O + '/><circle cx="12.5" cy="-5.5" r="2" fill="' + INK + '"/>',
      barrel: v => sh(9, 9) + '<path d="M-8 -9H8Q10 0 8 9H-8Q-10 0 -8 -9Z" fill="#b0702f" ' + O + '/><path d="M-9 -3H9M-9 4H9" stroke="#5a3513" stroke-width="1.6"/>',
      crate: v => sh(11, 9) + '<rect x="-10" y="-9" width="20" height="18" rx="2" fill="#c98a4b" ' + O + '/><path d="M-10 -9L10 9M10 -9L-10 9" stroke="#7a4a24" stroke-width="1.8"/>',
      anchor: v => '<g transform="rotate(' + f1(v * 30 - 15) + ')" fill="none" stroke="' + INK + '" stroke-width="4.4" stroke-linecap="round"><path d="M0 -10V9M-5 -5H5M-10 2Q-9 9 0 9Q9 9 10 2"/><circle cy="-12" r="2.4"/></g><g transform="rotate(' + f1(v * 30 - 15) + ')" fill="none" stroke="#c9d1da" stroke-width="2" stroke-linecap="round"><path d="M0 -10V9M-5 -5H5M-10 2Q-9 9 0 9Q9 9 10 2"/><circle cy="-12" r="2.4"/></g>',
      coil: v => sh(10, 6) + '<ellipse rx="10" ry="6" fill="#d9b06a" ' + O + '/><ellipse rx="6" ry="3.4" fill="none" stroke="#a87a3a" stroke-width="1.6"/><ellipse rx="2.4" ry="1.2" fill="#7a4a24"/>',
      lamp: v => sh(5, 11) + '<path d="M0 11V-8" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/><rect x="-5" y="-16" width="10" height="10" rx="2.5" fill="#ffe066" ' + O + '/><circle cy="-11" r="12" fill="#ffe066" opacity=".22"/>',
      jungle: v => sh(14, 11) + '<path d="M-2 12Q-4 4 0 -2" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-2 12Q-4 4 0 -2" stroke="#8a5a2b" stroke-width="3.8" fill="none" stroke-linecap="round"/>' + circ(-7, -4, 9, '#2f8a4a') + circ(8, -5, 9, '#37994f') + circ(0, -12, 10, '#43ac58') + '<circle cx="-3" cy="-15" r="4" fill="#8fe07a"/>' + (v > .6 ? '<path d="M6 -1Q9 4 6 9" stroke="#2a7a3c" stroke-width="1.6" fill="none"/>' : ''),
      fern: v => sh(11, 8) + [-60, -30, 0, 30, 60].map(a => '<path transform="rotate(' + a + ' 0 8)" d="M0 8Q-5 -4 0 -14Q5 -4 0 8Z" fill="' + (a % 60 ? '#52b85c' : '#3b9a4c') + '" ' + O + '/>').join(''),
      shroom: v => sh(9, 8) + '<rect x="-3" y="0" width="6" height="8" rx="2" fill="#fff0c8" ' + O + '/><path d="M-11 1Q-10 -11 0 -11Q10 -11 11 1Z" fill="' + (v > .5 ? RED : '#e8863a') + '" ' + O + '/><circle cx="-4" cy="-5" r="1.8" fill="#fff"/><circle cx="4" cy="-4" r="1.4" fill="#fff"/>',
      parrot: v => sh(8, 11) + '<path d="M0 12V0" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/><path d="M-9 -2Q-10 -12 0 -12Q8 -11 7 -2Q4 4 -3 3Z" fill="' + RED + '" ' + O + '/><path d="M-6 0Q-12 6 -8 10" fill="none" stroke="#3d8fe8" stroke-width="3" stroke-linecap="round"/><path d="M5 -9L11 -7L5 -5Z" fill="#ffd84a" ' + O + '/><circle cx="2" cy="-8" r="1.5" fill="#fff"/>',
      gull: v => '<path d="M-12 0Q-6 -9 0 0Q6 -9 12 0" fill="none" stroke="' + INK + '" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M-12 0Q-6 -9 0 0Q6 -9 12 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      flower: v => sh(8, 7) + '<path d="M0 8V-2" stroke="#3f9e52" stroke-width="2.4"/>' + [0, 72, 144, 216, 288].map(a => '<circle transform="rotate(' + a + ' 0 -5)" cy="-9" r="3.4" fill="' + (v > .5 ? '#ff9ac1' : '#fff') + '" ' + O + ' stroke-width="1"/>').join('') + '<circle cy="-5" r="2.4" fill="#ffd84a"/>',
      grass: v => '<path d="M-9 8Q-8 -2 -12 -8Q-4 -3 -2 8M-2 8Q0 -6 2 -12Q5 -4 4 8M4 8Q8 -1 12 -6Q10 2 10 8Z" fill="#6fc25e" ' + O + '/>',
      buoy: v => sh(8, 11) + '<path d="M-8 4Q-8 -8 0 -8Q8 -8 8 4Z" fill="#fff" ' + O + '/><path d="M-7 -2H7" stroke="' + RED + '" stroke-width="4"/><path d="M0 -8V-14" stroke="' + INK + '" stroke-width="2.4"/><circle cy="-15" r="2.2" fill="#ffd84a" ' + O + '/>',
      coral: v => { const c = v > .5 ? '#ff7a9a' : '#ff9a5c'; return sh(12, 9) + '<path d="M0 9V-2M0 3L-8 -6M0 1L8 -9M-8 -6V-12M8 -9V-14" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M0 9V-2M0 3L-8 -6M0 1L8 -9M-8 -6V-12M8 -9V-14" stroke="' + c + '" stroke-width="4" fill="none" stroke-linecap="round"/>'; },
      brain: v => sh(12, 8) + '<path d="M-12 7Q-14 -9 0 -9Q14 -9 12 7Z" fill="#ffb3c1" ' + O + '/><path d="M-6 -3Q-2 -6 0 -2Q3 -6 6 -2M-8 3Q-3 0 0 4Q4 0 8 3" fill="none" stroke="#e0728f" stroke-width="1.5" stroke-linecap="round"/>',
      fan: v => sh(10, 9) + '<path d="M0 10L-13 -6Q0 -16 13 -6Z" fill="#c07ad8" ' + O + '/><path d="M0 8L-8 -6M0 8V-10M0 8L8 -6" stroke="#f2c8ff" stroke-width="1.4" fill="none"/>',
      gems: v => { const c = [['#ff6f91', '#ffc2d1'], ['#4fb8ff', '#b7e3ff'], ['#7dffb0', '#d4ffe6'], ['#ffd84a', '#fff2a8']][Math.floor(v * 4) % 4]; return sh(13, 9) + '<path d="M-12 8L-8 -4L-3 8Z" fill="' + c[0] + '" ' + O + '/><path d="M-3 8L2 -12L9 8Z" fill="' + c[0] + '" ' + O + '/><path d="M2 -12L9 8L4 8Z" fill="' + c[1] + '" opacity=".55"/><path d="M9 8L12 -2L15 8Z" fill="' + c[0] + '" ' + O + '/>'; },
      stal: v => sh(10, 9) + '<path d="M-12 9L-6 -8L-1 9ZM-3 9L5 -14L12 9Z" fill="#9a86c8" ' + O + '/><path d="M5 -14L12 9L7 9Z" fill="#6c5a9c"/>',
      skull: v => sh(10, 9) + '<path d="M-10 2Q-12 -12 0 -12Q12 -12 10 2Q8 5 6 6V9H-6V6Q-8 5 -10 2Z" fill="#f4efe0" ' + O + '/><ellipse cx="-4.2" cy="-2" rx="2.8" ry="3.4" fill="' + INK + '"/><ellipse cx="4.2" cy="-2" rx="2.8" ry="3.4" fill="' + INK + '"/><path d="M0 2L-1.6 5H1.6Z" fill="' + INK + '"/><path d="M-3 7V9M0 7V9M3 7V9" stroke="' + INK + '" stroke-width="1"/>',
      bones: v => sh(12, 7) + '<path d="M-11 -4L11 6M11 -4L-11 6" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><path d="M-11 -4L11 6M11 -4L-11 6" stroke="#f4efe0" stroke-width="3" stroke-linecap="round"/>',
      glow: v => sh(9, 8) + '<circle cy="-3" r="13" fill="#7dffb0" opacity=".2"/><rect x="-2.6" y="0" width="5.2" height="8" rx="2" fill="#d8ffe8" ' + O + '/><path d="M-10 1Q-9 -11 0 -11Q9 -11 10 1Z" fill="#5cff8a" ' + O + '/><circle cx="-3" cy="-5" r="1.6" fill="#fff"/>',
      lava: v => '<path d="M-15 2Q-12 -8 -2 -7Q8 -10 14 -2Q16 7 6 9Q-6 11 -15 2Z" fill="#ff7a2a" ' + O + '/><path d="M-9 1Q-6 -4 0 -3Q7 -5 9 1Q8 5 2 5Q-5 6 -9 1Z" fill="#ffd84a"/>',
      ember: v => sh(13, 8) + '<path d="M-14 8L-9 -6L0 -10L10 -6L14 8Z" fill="#6b3b2a" ' + O + '/><path d="M-6 6L-2 -2L2 -6M2 -2L6 6" stroke="#ff7a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
      dead: v => sh(9, 11) + '<path d="M0 12V-10M0 2L-9 -6M0 -3L8 -11M-9 -6L-12 -12" stroke="' + INK + '" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M0 12V-10M0 2L-9 -6M0 -3L8 -11M-9 -6L-12 -12" stroke="#5a4036" stroke-width="3" fill="none" stroke-linecap="round"/>',
    };
    const LIST = {
      cove: ['pool', 'star', 'pool', 'shell', 'rock', 'crab', 'pool'],
      beach: ['palm', 'palm', 'chest', 'shell', 'star', 'palm', 'crab'],
      town: ['hut', 'tree', 'hut', 'flag', 'cannon', 'barrel', 'tree'],
      harbour: ['crate', 'barrel', 'anchor', 'coil', 'crate', 'lamp', 'barrel'],
      forest: ['jungle', 'fern', 'jungle', 'shroom', 'parrot', 'jungle', 'fern'],
      cape: ['rock', 'gull', 'grass', 'flower', 'gull', 'flower', 'rock'],
      reef: ['coral', 'brain', 'fan', 'shell', 'coral', 'star', 'brain'],
      cave: ['gems', 'stal', 'skull', 'gems', 'glow', 'bones', 'stal'],
      volcano: ['ember', 'lava', 'dead', 'skull', 'ember', 'lava', 'bones'],
    };
    const LAND = { cove: '#bfe3c6', beach: '#fbdc7e', town: '#95d86f', harbour: '#d9a766', forest: '#4aa857', cape: '#c3cad3', reef: '#f7c6a2', cave: '#8a72ba', volcano: '#a65f43' };

    // ---- landmarks: big pieces, placed on the side of the island the road leaves free ----
    const landmark = {
      town: () => sh(40, 26) + '<path d="M-36 24V-2H36V24Z" fill="#e9d4a4" ' + O + '/><path d="M-36 10H36M-18 24V10M0 24V10M18 24V10" stroke="#b49560" stroke-width="1.2"/>' +
        [-36, -22, 8, 22].map(x => '<rect x="' + x + '" y="-8" width="14" height="8" fill="#e9d4a4" ' + O + '/>').join('') +
        '<path d="M-10 24V12Q0 4 10 12V24Z" fill="' + BR + '" ' + O + '/>' +
        [-34, 20].map((x, i) => '<rect x="' + x + '" y="-26" width="16" height="24" fill="#d9bf8a" ' + O + '/><path d="M' + (x - 3) + ' -26L' + (x + 8) + ' -38L' + (x + 19) + ' -26Z" fill="' + (i ? '#3d8fe8' : RED) + '" ' + O + '/><path d="M' + (x + 8) + ' -38V-52" stroke="' + INK + '" stroke-width="2.4"/><path d="M' + (x + 8) + ' -52H' + (x + 22) + 'L' + (x + 19) + ' -47L' + (x + 22) + ' -42H' + (x + 8) + 'Z" fill="' + (i ? RED : '#ffd84a') + '" ' + O + '/>').join(''),
      harbour: () => '<ellipse cy="14" rx="46" ry="28" fill="#cfa266" ' + O + '/><ellipse cy="12" rx="38" ry="21" fill="#4fb4de" stroke="#2a7fae" stroke-width="2"/><path d="M-20 14q4 -3 8 0t8 0M6 20q4 -3 8 0t8 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/>' +
        '<path d="M-30 18Q-26 30 -6 30H22Q34 28 34 16Z" fill="#8b4f26" ' + O + '/><path d="M-30 18H34" stroke="#d99a55" stroke-width="3"/><path d="M-24 22H28" stroke="#5e3217" stroke-width="1.4"/>' +
        '<path d="M-4 17V-26M18 17V-18" stroke="' + INK + '" stroke-width="3"/><path d="M-3 -24Q-22 -14 -3 6Z" fill="#fff6dc" ' + O + '/><path d="M-3 -24Q10 -14 -3 6Z" fill="#eadcb0" ' + O + '/><path d="M19 -16Q4 -8 19 4Z" fill="#fff6dc" ' + O + '/><path d="M-4 -26V-34H8L5 -30L8 -26Z" fill="' + RED + '" ' + O + '/><path d="M-28 18L-34 12L-24 12Z" fill="#8b4f26" ' + O + '/>',
      cape: () => '<path d="M-34 24L-24 6H26L36 24Z" fill="#9aa3b0" ' + O + '/><path d="M-24 6L-14 16L-4 6" fill="#c7ced8"/><path d="M-12 8L-8 -66H8L12 8Z" fill="#fff" ' + O + '/><path d="M-11 -6L-10 -20H10L11 -6ZM-9 -36L-8.6 -50H8.6L9 -36Z" fill="' + RED + '"/><path d="M-12 -66H12" stroke="' + INK + '" stroke-width="3.4"/><rect x="-8" y="-82" width="16" height="16" rx="3" fill="#ffe680" ' + O + '/><path d="M-12 -82L0 -94L12 -82Z" fill="' + RED + '" ' + O + '/><rect x="-3" y="-12" width="6" height="9" rx="2" fill="' + BR + '"/>' +
        '<path d="M8 -74L54 -92M8 -74L54 -58" stroke="#fff3a0" stroke-width="7" opacity=".5" stroke-linecap="round"/>',
      reef: () => '<ellipse cy="6" rx="46" ry="32" fill="#ffd9ae" ' + O + '/><ellipse cy="5" rx="36" ry="23" fill="#4fd6cf" stroke="#2aa9a6" stroke-width="2"/><ellipse cx="-8" cy="1" rx="22" ry="12" fill="#83ebe0" opacity=".7"/>' +
        [[-44, 4], [-30, -24], [30, -26], [44, 8], [26, 30], [-28, 28]].map((p, i) => '<g transform="translate(' + p[0] + ' ' + p[1] + ') scale(.8)">' + D.coral(i / 6) + '</g>').join('') +
        '<path d="M0 12V-12" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><path d="M0 12V-12" stroke="#c28440" stroke-width="3" stroke-linecap="round"/>' + [-110, -60, 0, 60, 110].map(a => '<path transform="rotate(' + a + ' 0 -12)" d="M0 -12Q6 -26 20 -19Q10 -17 0 -12Z" fill="#46a64f" ' + O + '/>').join(''),
      cave: () => sh(40, 30) + '<path d="M-36 30Q-44 -4 -26 -26Q-8 -42 14 -34Q38 -22 38 4Q38 22 32 30Z" fill="#cfc8bb" ' + O + '/><path d="M-26 -26Q-8 -42 14 -34Q-6 -30 -14 -8Z" fill="#efe9dc"/><path d="M-12 30V14Q-12 4 0 4Q12 4 12 14V30Z" fill="' + INK + '"/><ellipse cx="-17" cy="-6" rx="9" ry="11" fill="' + INK + '" /><ellipse cx="17" cy="-6" rx="9" ry="11" fill="' + INK + '"/><path d="M0 -2L-4 6H4Z" fill="' + INK + '"/><path d="M-8 24V30M0 24V30M8 24V30" stroke="#cfc8bb" stroke-width="3"/>' +
        '<path d="M-17 -10L-14 -6L-17 0L-20 -6Z" fill="#7dffb0"/><path d="M17 -10L20 -6L17 0L14 -6Z" fill="#ff6f91"/>' + [[-44, 26, '#4fb8ff'], [46, 22, '#ffd84a'], [-4, -44, '#ff6f91']].map(g => '<path transform="translate(' + g[0] + ' ' + g[1] + ')" d="M0 -9L7 0L0 9L-7 0Z" fill="' + g[2] + '" ' + O + '/>').join(''),
    };
    // find the best free spot for a landmark of half-height hh on the side away from the road
    function freeSpot(z, hh) {
      const st = z.stops, mx = st.reduce((s, p) => s + p[0], 0) / st.length, fx = mx > 200 ? 80 : 320;
      let best = z.y0 + 70 + hh, bs = -1;
      for (let y = z.y0 + 60 + hh; y <= z.y1 - 40; y += 8) { const s = Math.min.apply(null, st.map(p => Math.hypot(p[0] - fx, (p[1] - y) * .8))); if (s > bs) { bs = s; best = y; } }
      return [fx, best];
    }
    // the volcano: a big cone behind the boss level, crater at the boss stop, lava rivers, smoke
    function volcano(z) {
      const b = z.stops.reduce((m, p) => p[1] < m[1] ? p : m), vx = b[0], vy = b[1];
      return '<path d="M' + (vx - 168) + ' ' + (vy + 150) + 'Q' + (vx - 70) + ' ' + (vy + 96) + ' ' + (vx - 52) + ' ' + (vy - 4) + 'Q' + vx + ' ' + (vy - 28) + ' ' + (vx + 52) + ' ' + (vy - 4) + 'Q' + (vx + 70) + ' ' + (vy + 96) + ' ' + (vx + 168) + ' ' + (vy + 150) + 'Z" fill="#6b3b2a" ' + O + ' stroke-width="3"/>' +
        '<path d="M' + (vx - 30) + ' ' + (vy + 4) + 'Q' + (vx - 52) + ' ' + (vy + 90) + ' ' + (vx - 120) + ' ' + (vy + 146) + 'L' + (vx - 60) + ' ' + (vy + 148) + 'Q' + (vx - 22) + ' ' + (vy + 80) + ' ' + (vx - 12) + ' ' + (vy + 6) + 'Z" fill="#8c5238" opacity=".9"/>' +
        '<path d="M' + (vx - 26) + ' ' + vy + 'Q' + (vx - 40) + ' ' + (vy + 44) + ' ' + (vx - 74) + ' ' + (vy + 96) + 'M' + (vx + 30) + ' ' + vy + 'Q' + (vx + 50) + ' ' + (vy + 40) + ' ' + (vx + 46) + ' ' + (vy + 84) + 'M' + (vx + 6) + ' ' + (vy + 20) + 'Q' + (vx + 10) + ' ' + (vy + 70) + ' ' + (vx - 10) + ' ' + (vy + 110) + '" stroke="' + INK + '" stroke-width="10" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + (vx - 26) + ' ' + vy + 'Q' + (vx - 40) + ' ' + (vy + 44) + ' ' + (vx - 74) + ' ' + (vy + 96) + 'M' + (vx + 30) + ' ' + vy + 'Q' + (vx + 50) + ' ' + (vy + 40) + ' ' + (vx + 46) + ' ' + (vy + 84) + 'M' + (vx + 6) + ' ' + (vy + 20) + 'Q' + (vx + 10) + ' ' + (vy + 70) + ' ' + (vx - 10) + ' ' + (vy + 110) + '" stroke="#ff7a2a" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="' + vx + '" cy="' + vy + '" rx="58" ry="26" fill="' + INK + '"/><ellipse cx="' + vx + '" cy="' + vy + '" rx="54" ry="22" fill="#ff7a2a"/><ellipse cx="' + vx + '" cy="' + vy + '" rx="38" ry="14" fill="#ffd84a" opacity=".85"/>' +
        [[-56, -50, 12], [-74, -74, 16], [-98, -100, 21]].map(s => '<circle cx="' + (vx + s[0]) + '" cy="' + (vy + s[1]) + '" r="' + s[2] + '" fill="#cfc7d0" ' + O + ' opacity=".92"/>').join('');
    }
    // old-map flourishes in the sea gap above a zone
    function gapArt(z) {
      const y = z.y0 - 33, k = z.index % 4, left = z.index % 2 === 0, x = left ? 62 : 338, wv = (x2, y2) => '<path d="M' + x2 + ' ' + y2 + 'q5 -5 10 0t10 0t10 0" stroke="' + BR + '" stroke-width="1.8" fill="none" opacity=".5" stroke-linecap="round"/>';
      let s = wv(left ? 250 : 80, y + 6) + wv(left ? 300 : 130, y - 12);
      if (k === 0) { let d = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, R = i % 2 ? 11 : 23; d += '<path d="M0 0L' + f1(Math.cos(a - .32) * R * .42) + ' ' + f1(Math.sin(a - .32) * R * .42) + 'L' + f1(Math.cos(a) * R) + ' ' + f1(Math.sin(a) * R) + 'Z" fill="' + (i === 0 ? RED : i % 2 ? '#c9a45c' : '#8b5a2b') + '" ' + O + ' stroke-width="1"/>'; }
        s += '<g transform="translate(' + x + ' ' + y + ')"><circle r="25" fill="' + CREAM + '" stroke="' + BR + '" stroke-width="2"/><circle r="21" fill="none" stroke="' + BR + '" stroke-width="1" stroke-dasharray="2 3"/>' + d + '<circle r="3" fill="#ffd84a" ' + O + '/><text y="-27" text-anchor="middle" font-family="' + FF + '" font-weight="700" font-size="10" fill="' + DRED + '">N</text></g>'; }
      else if (k === 1) s += '<g transform="translate(' + x + ' ' + (y + 4) + ')">' + [[-30, 0], [-12, 3], [6, 0]].map(h => '<path d="M' + (h[0] - 9) + ' ' + (h[1] + 8) + 'Q' + h[0] + ' ' + (h[1] - 18) + ' ' + (h[0] + 9) + ' ' + (h[1] + 8) + 'Z" fill="#2fa58a" ' + O + '/>').join('') +
        '<path d="M14 8Q20 -14 30 -14Q40 -14 38 -6L46 -4L38 0Q36 4 30 2" fill="#2fa58a" ' + O + '/><circle cx="31" cy="-8" r="2" fill="#fff"/><path d="M-36 10Q-12 4 14 10" stroke="' + BR + '" stroke-width="2" fill="none"/></g>';
      else if (k === 2) s += '<g transform="translate(' + x + ' ' + (y + 6) + ')"><path d="M-26 6Q-28 -10 -8 -12Q14 -14 24 -2L34 -10L32 6Q10 14 -26 6Z" fill="#5a79b8" ' + O + '/><path d="M-14 -12Q-16 -22 -10 -26M-14 -12Q-8 -22 -2 -24" stroke="#bfe6ff" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="-16" cy="-3" r="1.8" fill="#fff"/><path d="M-30 9q5 -5 10 0t10 0t10 0t10 0t10 0t10 0" stroke="' + BR + '" stroke-width="2" fill="none"/></g>';
      else s += '<g transform="translate(' + x + ' ' + (y + 6) + ') scale(.7)"><path d="M-30 6Q-26 20 -6 20H22Q34 18 34 4Z" fill="#8b4f26" ' + O + '/><path d="M0 4V-34M20 4V-26" stroke="' + INK + '" stroke-width="3"/><path d="M1 -32Q-20 -22 1 -2Z" fill="#fff6dc" ' + O + '/><path d="M21 -24Q6 -16 21 -2Z" fill="#fff6dc" ' + O + '/><path d="M0 -34V-44H12L9 -39L12 -34Z" fill="' + RED + '" ' + O + '/></g><path d="M' + (x - 30) + ' ' + (y + 18) + 'q5 -5 10 0t10 0t10 0t10 0t10 0t10 0" stroke="' + BR + '" stroke-width="1.8" fill="none" opacity=".6"/>';
      return s;
    }

    return {
      bg: PARCH,
      defs: '<radialGradient id="mapVig" cx="50%" cy="50%" r="75%"><stop offset=".55" stop-color="#8a5a2b" stop-opacity="0"/><stop offset="1" stop-color="#8a5a2b" stop-opacity=".42"/></radialGradient>' +
        '<radialGradient id="mapStain" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#b98a45" stop-opacity=".3"/><stop offset="1" stop-color="#b98a45" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="mapSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="' + INK + '" stop-opacity=".22"/></linearGradient>' +
        '<pattern id="mapHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="6" height="6" fill="#efdcab"/><path d="M0 1.5H6" stroke="#b98a45" stroke-width="1.2"/></pattern>' +
        '<radialGradient id="mapHalo" cx="50%" cy="50%" r="50%"><stop offset=".45" stop-color="#ffe680" stop-opacity=".95"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>',
      backdrop(H, rnd) {
        let s = '<rect width="400" height="' + H + '" fill="url(#mapVig)"/>';
        for (let i = 0; i < Math.floor(H / 260); i++) s += '<ellipse cx="' + f1(rnd(i, 1) * 400) + '" cy="' + f1(i * 260 + rnd(i, 2) * 240) + '" rx="' + f1(70 + rnd(i, 3) * 70) + '" ry="' + f1(50 + rnd(i, 4) * 50) + '" fill="url(#mapStain)"/>';
        let g = ''; for (let y = 70; y < H; y += 110) g += 'M0 ' + y + 'H400'; for (let x = 60; x < 400; x += 90) g += 'M' + x + ' 0V' + H;
        s += '<path d="' + g + '" stroke="#8a5a2b" stroke-width="1" stroke-dasharray="7 5" opacity=".28" fill="none"/>';
        s += '<rect x="9" y="9" width="382" height="' + (H - 18) + '" fill="none" stroke="' + BR + '" stroke-width="5" stroke-dasharray="12 12" opacity=".75"/><rect x="5" y="5" width="390" height="' + (H - 10) + '" fill="none" stroke="' + BR + '" stroke-width="2"/><rect x="13.5" y="13.5" width="373" height="' + (H - 27) + '" fill="none" stroke="' + BR + '" stroke-width="1.2"/>';
        return s;
      },
      zone(z) {
        const id = 'mapz' + z.index, cx = 200, cy = (z.y0 + z.y1) / 2, sx = 1 - 28 / 364, sy = 1 - 28 / (z.y1 - z.y0), th = z.theme;
        const u = (extra) => '<use href="#' + id + '" ' + extra + '/>', inset = 'transform="translate(' + cx + ' ' + f1(cy) + ') scale(' + f1(sx * 1000) / 1000 + ' ' + f1(sy * 1000) / 1000 + ') translate(' + -cx + ' ' + f1(-cy) + ')"';
        let s = gapArt(z) + '<defs><path id="' + id + '" d="' + z.path + '"/></defs>' +
          u('transform="translate(4 6)" fill="' + INK + '" opacity=".16" stroke="' + INK + '" stroke-width="30" stroke-linejoin="round"') +
          u('fill="none" stroke="url(#mapHatch)" stroke-width="46" stroke-linejoin="round"') +
          u('fill="' + CREAM + '" stroke="' + BR + '" stroke-width="26" stroke-linejoin="round"') + u('fill="' + CREAM + '" stroke="#fff6d8" stroke-width="23" stroke-linejoin="round"') +
          u('fill="#f3dc9c" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"') +
          u('fill="' + LAND[th] + '" stroke="' + INK + '" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round" ' + inset.replace('transform="', 'transform="')) +
          u('fill="url(#mapSheen)" ' + inset);
        // theme ground detail
        if (th === 'harbour') for (let y = z.y0 + 28; y < z.y1 - 16; y += 14) s += '<path d="M44 ' + y + 'H356" stroke="#a8693a" stroke-width="1.3" opacity=".5"/>';
        if (th === 'cove') for (let k = 0; k < 4; k++) s += '<ellipse cx="' + f1(60 + z.rnd(k, 1) * 280) + '" cy="' + f1(z.y0 + 40 + z.rnd(k, 2) * (z.y1 - z.y0 - 80)) + '" rx="' + f1(18 + z.rnd(k, 3) * 14) + '" ry="7" fill="#9fdcc0" opacity=".6"/>';
        if (th === 'volcano') s += volcano(z);
        else if (landmark[th]) { const hh = { town: 40, harbour: 38, cape: 60, reef: 36, cave: 40 }[th], p = freeSpot(z, hh); s += '<g transform="translate(' + p[0] + ' ' + p[1] + ')">' + landmark[th]() + '</g>'; }
        return '<g>' + s + '</g>';
      },
      decor(theme, r, r2, z) {
        if (theme === 'volcano' || r2 < ({ beach: .4, cape: .4, cove: .2, reef: .2, forest: .1 }[theme] || 0)) return '';
        const k = pick(LIST[theme] || LIST.town, r), f = D[k]; if (!f) return '';
        const sc = f1(.9 + r2 * .25), flip = r2 > .5 && k !== 'anchor';
        return '<g transform="scale(' + (flip ? -sc : sc) + ' ' + sc + ')">' + f(r2) + '</g>';
      },
      // decor must stay off the landmarks: same spots and sizes as zone() draws them
      keepOut(z) {
        if (z.theme === 'volcano') { const b = z.stops.reduce((m, p) => p[1] < m[1] ? p : m); return [[b[0] - 175, b[1] - 130, b[0] + 175, b[1] + 156]]; }
        const hh = { town: 40, harbour: 38, cape: 60, reef: 36, cave: 40 }[z.theme];
        if (!hh) return [];
        const p = freeSpot(z, hh), B = { town: [-40, -56, 40, 28], harbour: [-38, -38, 38, 34], cape: [-38, -98, 58, 28], reef: [-48, -32, 48, 42], cave: [-50, -50, 50, 36] }[z.theme];
        return [[p[0] + B[0], p[1] + B[1], p[0] + B[2], p[1] + B[3]]];
      },
      sign(label, w, z) {
        return '<rect x="3" y="5" width="' + (w - 2) + '" height="28" rx="6" fill="' + INK + '" opacity=".22"/>' +
          '<path d="M10 4H' + (w - 10) + 'V29H10Z" fill="#fbf0cc" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 7H' + (w - 10) + 'M10 26H' + (w - 10) + '" stroke="' + BR + '" stroke-width="1" opacity=".5"/>' +
          [[8, -1], [w - 8, 1]].map(e => '<ellipse cx="' + e[0] + '" cy="16.5" rx="7" ry="15" fill="#e4c987" stroke="' + INK + '" stroke-width="2.4"/><path d="M' + (e[0] + e[1] * 2) + ' 8Q' + (e[0] - e[1] * 3) + ' 9 ' + (e[0] - e[1] * 2) + ' 16.5Q' + (e[0] + e[1]) + ' 22 ' + (e[0] - e[1]) + ' 18" stroke="' + BR + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>').join('') +
          '<text x="' + w / 2 + '" y="17.5" text-anchor="middle" dominant-baseline="central" font-family="' + FF + '" font-weight="700" font-size="15" fill="#4a2a14">' + label + '</text>';
      },
      road: { todo: ['rgba(255,246,214,.45)', 'rgba(0,0,0,0)', 'rgba(110,64,28,.72)'], done: ['rgba(255,246,214,.8)', 'rgba(0,0,0,0)', '#d8372b'] },
      node(state, n, e, boss) {
        const R = boss ? 36 : 31, rim = sealP(R, boss ? 14 : 12, 1.12);
        if (state === 'locked') return '<path transform="translate(2 4)" d="' + rim + '" fill="' + INK + '" opacity=".28"/><path d="' + rim + '" fill="#a9a59b" ' + O + ' stroke-width="2.4"/><circle r="' + (R - 8) + '" fill="#c4c0b6" stroke="#8c887d" stroke-width="2"/><circle r="' + (R - 8) + '" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="2 3.5" opacity=".6"/>' +
          '<path d="M-7 -1V-7A7 7 0 0 1 7 -7V-1" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/><rect x="-10" y="-2" width="20" height="15" rx="3.5" fill="#6f6b63" ' + O + ' stroke-width="2.2"/><circle cy="5" r="2.4" fill="' + INK + '"/>';
        const cur = state === 'current', beat = state === 'beaten', c = cur ? '#ffd84a' : e < 0 ? '#aaa' : COL[e], dk = cur ? '#d9a21b' : DK[e], hi = cur ? '#fff2a8' : NEON[e];
        return (cur ? '<circle r="40" fill="url(#mapHalo)"/>' : '') + '<path transform="translate(2 4)" d="' + rim + '" fill="' + INK + '" opacity=".3"/>' +
          '<path d="' + rim + '" fill="' + (beat ? '#ffd84a' : dk) + '" ' + O + ' stroke-width="2.6"/>' +
          (beat ? '<path d="' + rim + '" fill="none" stroke="#fff3a0" stroke-width="2" transform="scale(.92)" opacity=".8"/>' : '') +
          '<circle r="' + (R - 7) + '" fill="' + c + '" stroke="' + (beat ? '#b8860b' : INK) + '" stroke-width="2.2"/><circle r="' + (R - 7) + '" fill="url(#mapSheen)"/>' +
          '<circle r="' + (R - 12) + '" fill="none" stroke="' + hi + '" stroke-width="1.5" stroke-dasharray="2 3.5" opacity=".75"/>' +
          (boss ? '<path d="M-9 -22L-5 -29L0 -23L5 -29L9 -22Z" fill="#ffd84a" ' + O + '/>' : '') +
          num(String(n), 1, cur ? '#fff8d8' : '#fff', 4.5) +
          (beat ? '<g transform="translate(17 -26)"><path d="M0 14V-12" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/><path d="M1 -12H15L12 -7L15 -2H1Z" fill="' + RED + '" ' + O + '/></g>' : '');
      },
      start() {
        return '<ellipse cy="14" rx="40" ry="9" fill="#4fb4de" ' + O + '/><path d="M-26 14q4 -3 8 0t8 0M6 16q4 -3 8 0t8 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>' +
          '<g transform="translate(0 -4)"><path d="M-30 4Q-26 20 -6 20H24Q36 18 36 2Z" fill="#8b4f26" ' + O + '/><path d="M-30 4H36" stroke="#d99a55" stroke-width="3"/><path d="M-22 12H28" stroke="#5e3217" stroke-width="1.4"/><circle cx="-8" cy="11" r="2" fill="' + INK + '"/><circle cx="6" cy="11" r="2" fill="' + INK + '"/>' +
          '<path d="M-4 4V-40M20 4V-30" stroke="' + INK + '" stroke-width="3.2"/><path d="M-3 -38Q-26 -26 -3 -4Z" fill="#fff6dc" ' + O + '/><path d="M-3 -38Q12 -26 -3 -4Z" fill="#eadcb0" ' + O + '/><path d="M21 -28Q4 -18 21 -4Z" fill="#fff6dc" ' + O + '/><path d="M-12 -24H-8M-12 -18H-8" stroke="' + RED + '" stroke-width="2.4"/>' +
          '<path d="M-4 -40V-50H10L7 -45L10 -40Z" fill="' + RED + '" ' + O + '/></g>' +
          '<path d="M-26 28H26L22 40H-22Z" fill="' + RED + '" ' + O + '/><text y="35" text-anchor="middle" dominant-baseline="central" font-family="' + FF + '" font-weight="700" font-size="12" fill="#fff" stroke="' + INK + '" stroke-width="3" paint-order="stroke">START</text>';
      },
      pin() {
        return '<ellipse cy="27" rx="9" ry="3" fill="' + INK + '" opacity=".28"/><path d="M0 27C-6 17 -19 9 -19 -5A19 19 0 0 1 19 -5C19 9 6 17 0 27Z" fill="' + RED + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/><path d="M-13 -9A14 14 0 0 1 -2 -18" stroke="#ff9a8a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<circle cy="-5" r="12" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.2"/><path d="M-6 -11L6 1M6 -11L-6 1" stroke="' + RED + '" stroke-width="4.6" stroke-linecap="round"/>';
      },
    };
  })();

  FTH_SKINS.register({
    id: 'map', name: 'Island Map', ic: '🗺️', blurb: 'drag across a border',
    coin: { name: 'compass rose', plural: 'compass roses', glyph: '🧭', value: 20, pitch: 1.1,   // this skin's currency (SKIN-SPEC.md section 12)
      colors: { main: '#f3e3b3', edge: '#2c4f7a' },
      svg: FTH_SKINS.coinArt('<circle r="11.6" fill="#f3e3b3" stroke="#1c1640" stroke-width="2"/><circle r="8.8" fill="none" stroke="#a9833a" stroke-width="1" stroke-dasharray="1.4 1.6"/><path d="M0 -10.2L2.5 -2.5 10.2 0 2.5 2.5 0 10.2 -2.5 2.5 -10.2 0 -2.5 -2.5Z" fill="#2c4f7a" stroke="#1c1640" stroke-width="1.2" stroke-linejoin="round"/><path d="M0 -10.2L2.5 -2.5H-2.5Z" fill="#e0452f"/><circle r="1.7" fill="#f3e3b3" stroke="#1c1640" stroke-width="1"/>') },
    src: 'lab/map.html', needs: ['cells'],
    hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 50% 40%, #2c4f7a, #1c1640 85%)',
      '--sk-ink': PAPER,
      '--sk-accent': GOLD,
      '--sk-card': 'linear-gradient(180deg, #f8ecc8, ' + PAPER + ')',
      '--sk-card-ink': INK,
      '--sk-hud': 'linear-gradient(180deg, #2a2360, ' + INK + ')',
      '--sk-btn': 'linear-gradient(180deg, #ffe680, ' + GOLD + ')',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': INK,
      '--sk-font': "'Fredoka', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
      '--sk-radius': '20px',
      '--sk-star-on': '#ffd84a', '--sk-star-edge': '#1c1640', '--sk-star-off': '#9a7a4c', '--sk-star-off-edge': '#7a4a24',
      '--sk-ctl': '#f3e3b8', '--sk-ctl-ink': '#1c1640', '--sk-ctl-edge': '#1c1640',
      '--sk-chip': PAPER,
      '--sk-chip-ink': INK,
      '--sk-edge': INK,
      '--sk-coin': GOLD,
    },
    css: [
      // secondary-button tokens (spec 3b) set as declarations: skin_check only accepts --sk-letters as theme keys
      '--sk-btn2:' + PAPER + ';--sk-btn2-ink:' + INK + ';',
      '.tl .hl{opacity:0;transition:opacity .15s}.tl.lit .hl{opacity:1}.tl.lit .hx{stroke-width:3.6}.tl.glow .tin{filter:drop-shadow(0 0 5px #fff) drop-shadow(0 0 2px ' + INK + ')}',
      // buttons: parchment scroll label with a stitched inner keyline and a 3px hard navy shadow
      '.btn3d{border:2.5px solid ' + INK + ';border-radius:16px;text-shadow:none;box-shadow:inset 0 0 0 4px rgba(255,246,214,.45),inset 0 0 0 5.5px rgba(122,74,36,.4),inset 0 3px 0 rgba(255,255,255,.5),0 3px 0 ' + INK + ',0 6px 12px rgba(28,22,64,.25)}',
      '.btn3d:active{transform:translateY(3px);box-shadow:inset 0 0 0 4px rgba(255,246,214,.35),0 0 0 ' + INK + '}',
      '.btn3d.white,.btn3d.yellow,.btn3d.blue,.btn3d.orange{border-width:2.5px;background:' + PAPER + ';color:' + INK + '}',
      '.btn3d.go{border-width:2.5px}',
      '.rbtn,.rbtn.sm,.bar .rb{border-radius:14px}',
      '.bar .rb{border-width:2.5px}',
      '.badge,.goalbar,.starbar,.coins,.mnode .mst,.mnode .mtag,.say .msg,.htnum,.htskip{font-family:var(--sk-font)}',
      // chips and bars: pill ends, parchment fill, navy edge, gold keyline
      '.badge,.goalbar,.starbar{border-width:2.5px;border-radius:999px;box-shadow:inset 0 0 0 3px rgba(255,246,214,.55),0 3px 0 ' + INK + '}',
      '.coins{border:2.5px solid ' + INK + ';color:' + INK + ';box-shadow:inset 0 0 0 3px rgba(255,255,255,.45),0 3px 0 ' + INK + '}',
      '.mnode .mst{border-width:2px;border-radius:999px;box-shadow:0 2px 0 ' + INK + '}',
      '.mnode .mtag{border-width:2px;border-radius:999px;box-shadow:0 2px 0 ' + INK + '}',
      '.mnode .pulse{border:3px solid ' + GOLD + ';box-shadow:0 0 0 2px ' + INK + '}',
      // talking pin: a parchment label with a scroll edge
      '.say .msg{border-width:2.5px;border-radius:16px;box-shadow:inset 0 0 0 3px rgba(255,246,214,.5),0 3px 0 ' + INK + '}',
      '.say .msg::after{border-right-color:' + PAPER + '}',
      // skin picker, how-to dots and step number
      '.skins button{border:2.5px solid ' + INK + ';border-radius:16px;box-shadow:0 3px 0 ' + INK + '}',
      '.skins button[aria-checked="true"]{box-shadow:inset 0 0 0 3px rgba(255,246,214,.55),0 3px 0 ' + INK + '}',
      '.htdots button{border:1.5px solid ' + INK + '}',
      '.htdots button.on{border-width:1.5px}',
      '.htnum{border:2.5px solid ' + INK + ';box-shadow:0 3px 0 ' + INK + '}',
      '.htskip{border:2px solid rgba(243,227,184,.55);border-radius:999px}',
      // level map top bar: navy with a gold keyline
      '.gtop{box-shadow:inset 0 -3px 0 ' + GOLD + ',0 3px 0 ' + INK + '}',
      // cards: parchment panel, navy frame, inner keyline
      '#brief .card,#win .card,#installSheet .card{border:3px solid ' + INK + ';box-shadow:inset 0 0 0 5px ' + PAPER + ',inset 0 0 0 6.5px rgba(122,74,36,.45),0 6px 0 ' + INK + ',0 14px 30px rgba(0,0,0,.3)}',
      '#brief .card .k{color:' + BR + '}',
      '#brief .card p,#win .card p,#brief .card table,#brief .card td:first-child{color:' + INK + '}',
      '#brief details{color:' + BR + '}',
      '#brief details summary{color:' + INK + '}',
      // the brief's PLAY button: the gold primary of this skin, not the shell's green
      '#briefGo{background:linear-gradient(180deg,#ffe680,' + GOLD + ');color:' + INK + ';border:2.5px solid ' + INK + ';border-radius:16px;text-shadow:none;box-shadow:inset 0 0 0 4px rgba(255,246,214,.45),inset 0 3px 0 rgba(255,255,255,.5),0 3px 0 ' + INK + '}',
      '#briefGo:active{transform:translateY(3px);box-shadow:inset 0 0 0 4px rgba(255,246,214,.35),0 0 0 ' + INK + '}',
      // star slots under markers: brown-navy so empty stars read on parchment
    ].join(''),
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
      board: 'radial-gradient(ellipse at 50% 40%, #2a3f7a, #151a45 88%)',
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
    levelMap,
    words: { win: 'Flag up!', perfect: 'Perfect route! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'TREASURE MAP' },
  });
})();
