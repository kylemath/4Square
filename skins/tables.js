// Gran's Table: an evening wedding reception. Plum night, string lights, cream place cards, four table emblems
// (0 fire = roses, 1 water = bluebells, 2 air = sunflower, 3 earth = fern), matching lab/tables.html's TABLE.
(function () {
  const CLOTH = ['#f7d3d3', '#d3e3f7', '#f9eab4', '#d6ebcc'], SHADE = ['#e9b3b6', '#aec8ea', '#ecd27d', '#b3d6a3'];
  const HEM = ['#c93a55', '#2f69c4', '#d69a10', '#3f8a3a'], DARK = ['#7d1a30', '#173d7a', '#7a5406', '#1f5a22'];
  const GOLD = '#d9b05a', CREAM = '#fbf5ea', PLUM = '#241c38', INK = '#2e2230';
  const NAMES = ['Roses', 'Bluebells', 'Sunflowers', 'Ferns'];
  const SERIF = "'Playfair Display',Georgia,serif";
  const f1 = n => Math.round(n * 10) / 10;
  // emblem for element e, unit size about -1..1 (drawn at translate/scale by the caller)
  function emblem(e) {
    if (e === 0) return '<circle r=".66" fill="#d8455e" stroke="#7d1a30" stroke-width=".08"/><path d="M.05 0A.1 .1 0 1 1 .02-.14A.24 .24 0 0 1 .2 .16A.38 .38 0 0 1-.36 .1A.5 .5 0 0 1 .3-.42" fill="none" stroke="#7d1a30" stroke-width=".08" stroke-linecap="round"/>';
    if (e === 1) {
      const bell = (x, y, s) => '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M-.2-.38Q0-.48 .2-.38Q.24-.1 .26 .08L.13 .02L0 .12L-.13 .02L-.26 .08Q-.24-.1-.2-.38Z" fill="#3f7fe0" stroke="#173d7a" stroke-width=".08" stroke-linejoin="round"/>';
      return '<path d="M-.75 .9Q-.6-.55 .55-.75" fill="none" stroke="#3f8a3a" stroke-width=".1" stroke-linecap="round"/>' + bell(-.52, .1, 1.05) + bell(-.2, -.38, 1.15) + bell(.25, -.42, 1.1) + bell(.62, -.38, .95);
    }
    if (e === 2) {
      let d = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, b = a + .2, c = a - .2;
        d += 'M' + f1(.45 * Math.cos(b) * 100) / 100 + ' ' + f1(.45 * Math.sin(b) * 100) / 100 + 'L' + f1(.95 * Math.cos(a) * 100) / 100 + ' ' + f1(.95 * Math.sin(a) * 100) / 100 + 'L' + f1(.45 * Math.cos(c) * 100) / 100 + ' ' + f1(.45 * Math.sin(c) * 100) / 100 + 'Z'; }
      return '<path d="' + d + '" fill="#f6c21c" stroke="#8a5d06" stroke-width=".06" stroke-linejoin="round"/><circle r=".44" fill="#7a4a18" stroke="#4a2a0a" stroke-width=".06"/>';
    }
    let lv = ''; for (let i = 0; i < 4; i++) { const y = .55 - i * .38, s = 1 - i * .18, x = f1(.32 * s * 100) / 100, rx = f1(.34 * s * 100) / 100, yy = f1(y * 100) / 100;
      lv += '<ellipse cx="' + -x + '" cy="' + yy + '" rx="' + rx + '" ry=".13" transform="rotate(-28 ' + -x + ' ' + yy + ')"/><ellipse cx="' + x + '" cy="' + yy + '" rx="' + rx + '" ry=".13" transform="rotate(28 ' + x + ' ' + yy + ')"/>'; }
    return '<path d="M0 .95V-.95" stroke="#1f5a22" stroke-width=".09" stroke-linecap="round"/><g fill="#4fa64a" stroke="#1f5a22" stroke-width=".05">' + lv + '<ellipse cy="-.9" rx=".12" ry=".2"/></g>';
  }
  const emb = (x, y, s, e) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + emblem(e) + '</g>';
  // a round table seen from above: cloth, scalloped-ish hem ring, emblem in the middle
  function table(x, y, r, e, extra) {
    return '<g transform="translate(' + x + ' ' + y + ')"><circle cy="' + f1(r * .08) + '" r="' + f1(r * 1.04) + '" fill="#0b0716" opacity=".35"/>' +
      '<circle r="' + r + '" fill="' + CLOTH[e] + '" stroke="' + HEM[e] + '" stroke-width="' + f1(Math.max(1.2, r / 9)) + '"/>' +
      '<circle r="' + f1(r * .84) + '" fill="none" stroke="' + HEM[e] + '" stroke-width="' + f1(Math.max(.8, r / 22)) + '" stroke-dasharray="' + f1(r / 5) + ' ' + f1(r / 6) + '" opacity=".7"/>' +
      emb(0, 0, f1(r * .6), e) + (extra || '') + '</g>';
  }
  const svg = (inner, style) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const T = (x, y, s, t, col, w, anchor) => '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-family="' + SERIF + '" font-size="' + s + '" font-style="italic" font-weight="' + (w || 600) + '" fill="' + (col || CREAM) + '">' + t + '</text>';
  // string lights: a swag from (x0,y) to (x1,y) with n bulbs
  function lights(x0, x1, y, sag, n, cls) {
    let b = '', d = 'M' + x0 + ' ' + y + 'Q' + (x0 + x1) / 2 + ' ' + (y + sag * 2) + ' ' + x1 + ' ' + y;
    const cols = ['#ffe7a0', '#f6b6c1', '#ffd36a', '#ffe7a0'];
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, yy = y + sag * 4 * t * (1 - t);
      b += '<g class="' + (cls || 'bl') + '" style="animation-delay:' + -(i % 5) * .4 + 's"><circle cx="' + f1(x) + '" cy="' + f1(yy + 4) + '" r="7" fill="#ffe7a0" opacity=".25"/><circle cx="' + f1(x) + '" cy="' + f1(yy + 4) + '" r="2.6" fill="' + cols[i % 4] + '"/></g>'; }
    return '<path d="' + d + '" fill="none" stroke="#6d5a83" stroke-width="1.2"/>' + b;
  }
  const night = '<defs><radialGradient id="tnb" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#4a3a68"/><stop offset="1" stop-color="#1c1630"/></radialGradient></defs><rect width="300" height="250" rx="14" fill="url(#tnb)"/>';
  const BULB = RM('.bl{animation:tw 2.2s ease-in-out infinite alternate}@keyframes tw{from{opacity:.5}to{opacity:1}}');
  // a guest face (tiny): skin tone, hair colour, optional red pin
  function guest(x, y, r, skin, hair, pin, grump) {
    return '<g transform="translate(' + x + ' ' + y + ')"><circle r="' + r + '" fill="#fffaf0" stroke="' + GOLD + '" stroke-width="1.6"/>' +
      '<path d="M' + -r * .7 + ' ' + r * .75 + 'Q0 ' + r * .1 + ' ' + r * .7 + ' ' + r * .75 + 'Z" fill="#7a2f4f"/>' +
      '<circle cy="' + f1(-r * .1) + '" r="' + f1(r * .5) + '" fill="' + skin + '" stroke="' + INK + '" stroke-width="1"/>' +
      '<path d="M' + -r * .52 + ' ' + -r * .15 + 'Q' + -r * .5 + ' ' + -r * .75 + ' 0 ' + -r * .7 + 'Q' + r * .5 + ' ' + -r * .75 + ' ' + r * .52 + ' ' + -r * .15 + 'Q' + r * .3 + ' ' + -r * .4 + ' 0 ' + -r * .4 + 'Q' + -r * .3 + ' ' + -r * .4 + ' ' + -r * .52 + ' ' + -r * .15 + 'Z" fill="' + hair + '"/>' +
      '<circle cx="' + f1(-r * .17) + '" cy="' + f1(-r * .12) + '" r="1.3" fill="' + INK + '"/><circle cx="' + f1(r * .17) + '" cy="' + f1(-r * .12) + '" r="1.3" fill="' + INK + '"/>' +
      (grump ? '<path d="M' + -r * .2 + ' ' + r * .2 + 'Q0 ' + r * .1 + ' ' + r * .2 + ' ' + r * .2 + '" stroke="' + INK + '" stroke-width="1.2" fill="none"/><path d="M' + -r * .3 + ' ' + -r * .3 + 'L' + -r * .08 + ' ' + -r * .22 + 'M' + r * .3 + ' ' + -r * .3 + 'L' + r * .08 + ' ' + -r * .22 + '" stroke="' + INK + '" stroke-width="1.1"/>'
        : '<path d="M' + -r * .2 + ' ' + r * .14 + 'Q0 ' + r * .26 + ' ' + r * .2 + ' ' + r * .14 + '" stroke="' + INK + '" stroke-width="1.2" fill="none"/>') +
      (pin ? '<circle cx="' + f1(-r * .62) + '" cy="' + f1(r * .62) + '" r="' + f1(r * .26) + '" fill="#e8384f" stroke="#7a1020" stroke-width="1"/>' : '') + '</g>';
  }
  function gran(x, y, r) { // Gran: lilac, white bun, glasses
    return '<g transform="translate(' + x + ' ' + y + ')"><circle r="' + r + '" fill="#efe2f6" stroke="#9b7fc2" stroke-width="2"/>' +
      '<path d="M' + -r * .75 + ' ' + r * .85 + 'Q0 ' + r * .1 + ' ' + r * .75 + ' ' + r * .85 + 'Z" fill="#9b7fc2"/><circle cy="' + f1(-r * .62) + '" r="' + f1(r * .26) + '" fill="#dcd9e2"/>' +
      '<circle cy="' + f1(-r * .1) + '" r="' + f1(r * .5) + '" fill="#f3d2bb" stroke="' + INK + '" stroke-width="1"/>' +
      '<path d="M' + -r * .5 + ' ' + -r * .2 + 'Q0 ' + -r * .85 + ' ' + r * .5 + ' ' + -r * .2 + 'Q0 ' + -r * .5 + ' ' + -r * .5 + ' ' + -r * .2 + 'Z" fill="#dcd9e2"/>' +
      '<g fill="none" stroke="' + INK + '" stroke-width="1"><circle cx="' + f1(-r * .2) + '" cy="' + f1(-r * .12) + '" r="' + f1(r * .13) + '"/><circle cx="' + f1(r * .2) + '" cy="' + f1(-r * .12) + '" r="' + f1(r * .13) + '"/></g>' +
      '<path d="M' + -r * .16 + ' ' + r * .14 + 'Q0 ' + r * .24 + ' ' + r * .16 + ' ' + r * .14 + '" stroke="' + INK + '" stroke-width="1.2" fill="none"/></g>';
  }
  const SK = ['#f6d3b3', '#e8b48a', '#c98b5e', '#9c6440', '#f2c6a0'], HC = ['#2b1d16', '#6b3f1f', '#c8873a', '#8e8a92', '#a33b20'];
  const pent = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [f1(cx + Math.cos(a) * R), f1(cy + Math.sin(a) * R)]; });
  const card = (x, y, w, h, inner) => '<g transform="translate(' + x + ' ' + y + ')"><rect width="' + w + '" height="' + h + '" rx="5" fill="' + CREAM + '" stroke="' + GOLD + '" stroke-width="1.6"/><rect x="3" y="3" width="' + (w - 6) + '" height="' + (h - 6) + '" rx="3" fill="none" stroke="' + GOLD + '" stroke-width=".7" stroke-dasharray="2 3"/>' + (inner || '') + '</g>';
  const tick = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ')"><circle r="' + s + '" fill="#3f9a3a"/><path d="M' + -s * .5 + ' 0l' + s * .35 + ' ' + s * .4 + 'l' + s * .6 + ' ' + -s * .8 + '" stroke="#fff" stroke-width="' + f1(s * .3) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>';
  const cross = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ')"><circle r="' + s + '" fill="#d8424f"/><path d="M' + -s * .42 + ' ' + -s * .42 + 'l' + s * .84 + ' ' + s * .84 + 'M' + s * .42 + ' ' + -s * .42 + 'l' + -s * .84 + ' ' + s * .84 + '" stroke="#fff" stroke-width="' + f1(s * .3) + '" fill="none" stroke-linecap="round"/></g>';

  // ---- title: Gran at the middle with her five rivals ringed around, one at each table's colour
  const tp = pent(150, 122, 70), tcol = [0, 1, 2, 3, 1];
  const titleSvg = svg(night + lights(10, 150, 18, 12, 9) + lights(150, 290, 18, 12, 9) +
    tp.map((p, i) => '<path d="M150 122L' + p[0] + ' ' + p[1] + '" stroke="#ff4d5e" stroke-width="1.4" stroke-dasharray="3 4" opacity=".6"/>').join('') +
    tp.map((p, i) => table(p[0], p[1], 27, tcol[i])).join('') +
    tp.map((p, i) => guest(p[0] + 17, p[1] - 17, 9, SK[i], HC[i], true, true)).join('') +
    '<g class="gr">' + gran(150, 122, 27) + '</g>' +
    T(150, 232, 17, 'Where will Gran sit?', '#f6e3b0'),
    BULB + RM('.gr{transform-box:fill-box;transform-origin:50% 100%;animation:gw 2.6s ease-in-out infinite}@keyframes gw{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}'));

  // ---- intro pages
  const gp = pent(150, 100, 62);
  // 1: Gran and her five rivals over four tables
  const p1 = svg(night + lights(10, 290, 14, 10, 12) +
    gp.map(p => '<path d="M150 100L' + p[0] + ' ' + p[1] + '" stroke="#ff4d5e" stroke-width="1.5" stroke-dasharray="3 4" opacity=".65"/>').join('') +
    gp.map((p, i) => guest(p[0], p[1], 15, SK[i], HC[i], true, true)).join('') +
    gran(150, 100, 24) +
    [0, 1, 2, 3].map(e => table(48 + e * 68, 206, 23, e)).join('') +
    T(150, 172, 14, 'Gran won\'t sit with these five', '#f6e3b0') + T(150, 38, 13, '', '#fff'),
    BULB);
  // 2: guests who feud can't share a table
  const p2 = svg(night + lights(10, 290, 14, 10, 12) +
    table(86, 150, 52, 1) + table(214, 150, 52, 0) +
    guest(70, 128, 14, SK[0], HC[0], false, false) + guest(104, 134, 14, SK[2], HC[1], false, false) +
    guest(198, 128, 14, SK[1], HC[2], false, true) +
    '<g transform="translate(150 106)"><path d="M-8-14l-8 14h7l-6 14 16-18h-8l7-10z" fill="#ffe08a" stroke="#ff4d5e" stroke-width="1.4" stroke-linejoin="round"/></g>' +
    '<path d="M122 120Q150 96 178 120" fill="none" stroke="#ff4d5e" stroke-width="2.2" stroke-dasharray="4 4"/>' +
    T(150, 44, 15, 'Guests who feud', '#f6e3b0') + T(150, 62, 15, 'can\'t share a table', '#f6e3b0') +
    T(150, 232, 14, 'every table is a different element', '#d9cce8'),
    BULB);
  // 3: move a guest, rivals storm off: a cascade (chain)
  const p3 = svg(night + lights(10, 290, 14, 10, 12) +
    table(78, 140, 52, 3) + table(222, 140, 52, 2) +
    guest(62, 126, 13, SK[3], HC[0], false, false) + guest(96, 130, 13, SK[1], HC[2], false, true) +
    guest(206, 120, 13, SK[0], HC[1], false, false) + guest(238, 132, 13, SK[4], HC[3], false, false) +
    '<g class="mv"><path d="M114 108Q150 76 186 108" fill="none" stroke="' + GOLD + '" stroke-width="3" stroke-linecap="round"/><path d="M178 98L188 109L174 112" fill="none" stroke="' + GOLD + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>' +
    '<g class="mv2"><path d="M186 176Q150 204 114 176" fill="none" stroke="#ff4d5e" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="4 4"/><path d="M122 168L112 176L126 180" fill="none" stroke="#ff4d5e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>' +
    T(150, 44, 15, 'Move a guest, and their', '#f6e3b0') + T(150, 62, 15, 'rivals storm off. Well!', '#f6e3b0') +
    T(150, 232, 14, 'a cascade of swaps: one chain', '#d9cce8'),
    BULB + RM('.mv{animation:sl 2.4s ease-in-out infinite}.mv2{animation:sl 2.4s ease-in-out .5s infinite}@keyframes sl{0%,100%{opacity:.4}50%{opacity:1}}'));
  // 4: a lock
  const p4 = svg(night + lights(10, 290, 14, 10, 12) +
    table(80, 150, 50, 0) + table(220, 150, 50, 1) +
    guest(68, 134, 13, SK[2], HC[1], false, false) + guest(98, 138, 13, SK[4], HC[0], true, true) +
    guest(206, 130, 13, SK[0], HC[2], false, false) + guest(236, 138, 13, SK[3], HC[3], true, true) +
    '<g class="lk"><g transform="translate(150 150)"><path d="M-10 -4V-12A10 10 0 0 1 10 -12V-4" fill="none" stroke="' + GOLD + '" stroke-width="3.4" stroke-linecap="round"/><rect x="-14" y="-4" width="28" height="22" rx="4" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="2"/><circle cy="6" r="3" fill="' + INK + '"/></g></g>' +
    T(150, 44, 15, 'Sometimes the cascade drags', '#f6e3b0') + T(150, 62, 15, 'another of Gran\'s rivals too', '#f6e3b0') +
    T(150, 232, 14, 'that move is a lock: she gains nothing', '#d9cce8'),
    BULB + RM('.lk{transform-box:fill-box;transform-origin:50% 100%;animation:sh 2.8s ease-in-out infinite}@keyframes sh{0%,78%,100%{transform:rotate(0)}84%{transform:rotate(-9deg)}90%{transform:rotate(9deg)}95%{transform:rotate(-4deg)}}'));
  // 5: the win
  const p5 = svg(night + lights(10, 290, 14, 10, 12) +
    table(60, 170, 36, 0) + table(150, 170, 36, 1) + table(240, 170, 36, 2) +
    guest(48, 150, 10, SK[0], HC[0], true, false) + guest(72, 156, 10, SK[1], HC[1], true, false) +
    guest(140, 150, 10, SK[2], HC[2], true, false) + guest(164, 156, 10, SK[3], HC[3], true, false) +
    guest(228, 150, 10, SK[4], HC[4], true, false) +
    card(188, 74, 104, 40, '') + tick(272, 94, 11) + gran(214, 94, 13) +
    '<g class="ga">' + gran(110, 92, 24) + '</g>' +
    '<path d="M138 92L186 92" stroke="' + GOLD + '" stroke-width="2.6" stroke-dasharray="1 6" stroke-linecap="round"/>' +
    T(150, 46, 15, 'One table with none of her rivals', '#f6e3b0') +
    T(150, 232, 15, 'Gran sits down, and the glasses clink', '#d9cce8'),
    BULB + RM('.ga{animation:wk 2.4s ease-in-out infinite}@keyframes wk{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}'));

  // ---- bonus tile: a little round table in the element's colour with its emblem
  const bonusTile = (x, y, r, e, k) => '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' +
    '<circle class="hl" r="' + f1(r * 1.15) + '" fill="#ffe7a0"/>' +
    '<circle cy="' + f1(r * .08) + '" r="' + f1(r * .96) + '" fill="#0b0716" opacity=".35"/>' +
    '<circle class="hx" r="' + f1(r * .92) + '" fill="' + CLOTH[e] + '" stroke="' + HEM[e] + '" stroke-width="' + f1(Math.max(1.4, r / 8)) + '"/>' +
    '<circle r="' + f1(r * .74) + '" fill="none" stroke="' + HEM[e] + '" stroke-width="1" stroke-dasharray="' + f1(r / 4) + ' ' + f1(r / 5) + '" opacity=".7"/>' +
    emb(0, 0, f1(r * .52), e) + '</g></g>';

  // ---------- the level map: the wedding estate at night, seen from above ----------
  const LGROUND = {   // top, bottom, pattern id, lit edge
    cove: ['#3f6277', '#2a4659', 'S', '#bfeaf2'], beach: ['#3d6650', '#2b4d3d', 'G', '#cfe9b8'], town: ['#456f4c', '#2f5238', 'G', '#f3e6b4'],
    harbour: ['#7d5c47', '#5a4033', 'P', '#f1d3a2'], forest: ['#2f6040', '#1f4530', 'G', '#f6b6c1'], cape: ['#4f7355', '#35553f', 'G', '#ffe7a0'],
    reef: ['#6f6082', '#4c4062', 'S', '#ffd9b0'], cave: ['#4a3550', '#2f2238', 'S', '#d9a0ff'], volcano: ['#8a5f46', '#5e3b33', 'C', '#ffe7a0'],
  };
  const lsh = (rx, ry) => '<ellipse cx="3" cy="5" rx="' + rx + '" ry="' + ry + '" fill="#0b0716" opacity=".4"/>';
  const lglow = (r, o) => '<circle r="' + r + '" fill="url(#tablesGlow)" opacity="' + (o || .8) + '"/>';
  const OL = 'stroke="#1c1630" stroke-width="1.6" stroke-linejoin="round"';
  const LAND = {
    cove(z) { // welcome fountain
      return lsh(54, 32) + '<ellipse rx="52" ry="31" fill="#cfc6d8" ' + OL + '/><ellipse rx="44" ry="25" fill="#7fd0e4" stroke="#8a7fa0" stroke-width="2"/><ellipse cx="-8" cy="-5" rx="30" ry="14" fill="#a8e6f2" opacity=".6"/>' +
        '<ellipse cy="-4" rx="9" ry="5" fill="#cfc6d8" ' + OL + '/><path d="M0-4V-26" stroke="#cfc6d8" stroke-width="7" stroke-linecap="round"/><ellipse cy="-26" rx="14" ry="6" fill="#e5dcee" ' + OL + '/>' +
        '<path d="M0-30Q-18-44-26-14M0-30Q18-44 26-14M0-30Q-8-48-12-18M0-30Q8-48 12-18" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>' +
        '<circle cx="-30" cy="6" r="4" fill="#f6b6c1"/><circle cx="26" cy="10" r="3.4" fill="#ffe7a0"/>';
    },
    beach(z) { // lakeside jetty
      return '<ellipse cx="3" cy="4" rx="60" ry="36" fill="#0b0716" opacity=".4"/><ellipse rx="58" ry="34" fill="#e8d6a0" ' + OL + '/><ellipse rx="52" ry="28" fill="#3f7ec4"/><ellipse cx="-10" cy="-8" rx="36" ry="12" fill="#6fb2ea" opacity=".6"/>' +
        '<path d="M14 10h22M18 16h14" stroke="#ffe7a0" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>' +
        '<rect x="-60" y="-4" width="64" height="12" fill="#a9794f" ' + OL + '/><path d="M-48-4v12M-36-4v12M-24-4v12M-12-4v12M0-4v12" stroke="#6b4a30" stroke-width="1.4"/>' +
        '<path d="M2 4V-14" stroke="#4a3322" stroke-width="3"/><circle cx="2" cy="-16" r="4.4" fill="#ffe7a0" stroke="#c9a34a"/><circle cx="2" cy="-16" r="11" fill="url(#tablesGlow)"/>' +
        '<path d="M26-6l16 6l-6 8l-14-2z" fill="#f7f1e4" ' + OL + '/>';
    },
    town(z) { // chapel
      return lsh(40, 20) + '<rect x="-34" y="-8" width="68" height="34" rx="2" fill="#f1e3c8" ' + OL + '/><path d="M-40-6L0-34L40-6Z" fill="#5a4a78" ' + OL + '/><path d="M-30-8L0-30" stroke="#8c7aa8" stroke-width="2"/>' +
        '<rect x="-9" y="-48" width="18" height="22" fill="#f1e3c8" ' + OL + '/><path d="M-12-48L0-64L12-48Z" fill="#5a4a78" ' + OL + '/><path d="M0-64V-74M-4-70H4" stroke="#d9b05a" stroke-width="2.2"/>' +
        '<path d="M-8 26V12a8 8 0 0 1 16 0V26Z" fill="#ffd36a" stroke="#6d4a1c" stroke-width="1.6"/><path d="M-26 6a5 7 0 0 1 10 0v8h-10zM16 6a5 7 0 0 1 10 0v8H16z" fill="#ffd36a" opacity=".9"/>' + '<circle cy="16" r="26" fill="url(#tablesGlow)" opacity=".35"/>';
    },
    harbour(z) { // boathouse and a moored rowing boat
      return lsh(54, 22) + '<rect x="-50" y="-4" width="100" height="22" rx="3" fill="#2f5f8f" ' + OL + '/><path d="M-44 4q8-5 16 0t16 0t16 0t16 0t16 0" stroke="#9fd0f0" stroke-width="1.6" fill="none" opacity=".7"/>' +
        '<path d="M-26 14Q0 28 26 14L20 6H-20Z" fill="#c98a4b" ' + OL + '/><path d="M-20 6H20" stroke="#f1d3a2" stroke-width="2.4"/><path d="M0 6V-8" stroke="#4a3322" stroke-width="2"/><circle cy="-9" r="3.6" fill="#ffe7a0"/><circle cy="-9" r="10" fill="url(#tablesGlow)"/>' +
        '<rect x="-44" y="-36" width="52" height="34" fill="#a9794f" ' + OL + '/><path d="M-50-34L-18-56L14-34Z" fill="#6b3f35" ' + OL + '/><rect x="-26" y="-26" width="16" height="24" rx="1.6" fill="#ffd36a" stroke="#4a3322" stroke-width="1.6"/><path d="M-44-20h12M-44-12h12" stroke="#7a5236" stroke-width="1.4"/>';
    },
    forest(z) { // rose-garden maze
      let m = '<rect x="-48" y="-40" width="96" height="80" rx="14" fill="#1f4a2c" ' + OL + '/><rect x="-38" y="-30" width="76" height="60" rx="10" fill="#2f6a3a" stroke="#143a20" stroke-width="1.4"/><rect x="-28" y="-20" width="56" height="40" rx="7" fill="#3f8648" stroke="#143a20" stroke-width="1.4"/><rect x="-18" y="-10" width="36" height="20" rx="4" fill="#d9c9a0" stroke="#143a20" stroke-width="1.4"/><path d="M-12-4H12M-12 4H12" stroke="#fff" stroke-width="0"/><path d="M-38-6H-26M26 6H38M-4-30V-20M4 20V30" stroke="#d9c9a0" stroke-width="7"/>';
      for (let i = 0; i < 9; i++) m += '<circle cx="' + f1(-42 + z.rnd(i, 1) * 84) + '" cy="' + f1(-36 + z.rnd(1, i) * 72) + '" r="3" fill="' + (i % 2 ? '#e8587a' : '#f6b6c1') + '"/>';
      return lsh(50, 42) + m + '<circle r="4.6" fill="#d8455e" ' + OL + '/><circle r="1.6" fill="#ffe7a0"/>';
    },
    cape(z) { // lantern-lit gazebo
      let r = '';
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, b = a + Math.PI / 3; r += '<path d="M0-18L' + f1(Math.cos(a) * 44) + ' ' + f1(Math.sin(a) * 30 - 10) + 'L' + f1(Math.cos(b) * 44) + ' ' + f1(Math.sin(b) * 30 - 10) + 'Z" fill="' + (i % 2 ? '#f1e3c8' : '#e6d2ae') + '" ' + OL + '/>'; }
      return lsh(48, 30) + '<ellipse rx="46" ry="30" fill="#8c7aa8" ' + OL + '/><ellipse rx="38" ry="23" fill="#c9b6a0"/>' + lglow(46, .5) + '<g fill="#fbf5ea" stroke="#1c1630" stroke-width="1.4"><circle cx="-34" cy="4" r="3.4"/><circle cx="34" cy="4" r="3.4"/><circle cx="-18" cy="20" r="3.4"/><circle cx="18" cy="20" r="3.4"/></g>' + r + '<circle cy="-20" r="4" fill="#d9b05a" ' + OL + '/><circle cy="-8" r="3" fill="#ffe7a0"/>';
    },
    reef(z) { // cocktail terrace: bar, stools, glasses
      return lsh(54, 26) + '<rect x="-54" y="-28" width="108" height="56" rx="12" fill="#a79bbd" ' + OL + '/><path d="M-54-8H54M-18-28V28M18-28V28" stroke="#8a7da4" stroke-width="1.2"/><rect x="-40" y="-14" width="80" height="14" rx="4" fill="#7a5236" ' + OL + '/><rect x="-40" y="-14" width="80" height="4" rx="2" fill="#a9794f"/>' +
        '<g fill="#f7f1e4" stroke="#1c1630" stroke-width="1.2"><path d="M-26-24h8l-4 8zM-4-24h8l-4 8zM18-24h8l-4 8z" fill="#fff" opacity=".9"/></g><g fill="#d8455e" ' + OL + '><circle cx="-30" cy="14" r="6"/><circle cx="0" cy="14" r="6"/><circle cx="30" cy="14" r="6"/></g>' +
        '<circle cx="-22" cy="-18" r="2.4" fill="#ffd36a"/><circle cx="22" cy="-18" r="2.4" fill="#f6b6c1"/>' + lglow(30, .35);
    },
    cave(z) { // wine cellar door and barrels
      return lsh(52, 28) + '<path d="M-52 24Q-48-30 0-36Q48-30 52 24Z" fill="#6c5a74" ' + OL + '/><path d="M-30 24V-2a30 30 0 0 1 60 0V24Z" fill="#1c1228" stroke="#d9b05a" stroke-width="2.4"/><path d="M-22 24V0a22 22 0 0 1 44 0V24" fill="#3a2430"/><path d="M0 24V-22" stroke="#d9b05a" stroke-width="1.4"/>' +
        '<circle cx="-8" cy="6" r="2" fill="#d9b05a"/><circle cx="8" cy="6" r="2" fill="#d9b05a"/><circle cx="-38" cy="-4" r="3.4" fill="#ffe7a0"/><circle cx="-38" cy="-4" r="11" fill="url(#tablesGlow)"/>' +
        '<g transform="translate(40 18)"><ellipse rx="11" ry="9" fill="#8a5a3a" ' + OL + '/><path d="M-11 0H11M-9-5H9M-9 5H9" stroke="#5a3a24" stroke-width="1.2"/><circle r="2.6" fill="#d9b05a"/></g>';
    },
    volcano(z) { // wedding cake, three tiers
      const tier = (y, w, h, c) => '<ellipse cx="2" cy="' + (y + h) + '" rx="' + w + '" ry="' + f1(w * .3) + '" fill="#0b0716" opacity=".3"/><rect x="' + -w + '" y="' + y + '" width="' + w * 2 + '" height="' + h + '" fill="' + c + '" ' + OL + '/><ellipse cy="' + (y + h) + '" rx="' + w + '" ry="' + f1(w * .3) + '" fill="' + c + '" ' + OL + '/><ellipse cy="' + y + '" rx="' + w + '" ry="' + f1(w * .3) + '" fill="#fff" ' + OL + '/>';
      return lsh(54, 20) + tier(10, 46, 16, '#f6d6dc') + tier(-8, 34, 16, '#fbf5ea') + tier(-24, 22, 14, '#f6d6dc') +
        '<path d="M-44 10Q-30 24-15 12T14 12T44 10" fill="none" stroke="#e8587a" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/><path d="M-32-6Q-16 6 0-6T32-6" fill="none" stroke="#d9b05a" stroke-width="2"/>' +
        '<path d="M-3-34l3-12l3 12z" fill="#d9b05a" ' + OL + '/><circle cx="-4" cy="-48" r="4" fill="#e8587a" ' + OL + '/><circle cx="4" cy="-48" r="4" fill="#e8587a" ' + OL + '/>' + lglow(40, .35);
    },
  };
  const segd = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
  const LEXT = { town: 80, harbour: 60, forest: 44, cape: 38, cove: 40, beach: 40, reef: 34, cave: 40, volcano: 54 };
  function landAt(z) { // the free spot of the zone farthest from the road through its stops
    const S = z.stops; let best = null, bs = -1;
    for (const x of [80, 320]) for (let y = z.y0 + 58 + (LEXT[z.theme] || 40); y <= z.y1 - 50; y += 14) {
      let d = 999; S.forEach((p, i) => { d = Math.min(d, Math.hypot(p[0] - x, p[1] - y) - 8, i ? segd(x, y, S[i - 1], p) : 999); });
      if (d > bs) { bs = d; best = [x, y]; }
    }
    return best;
  }
  const LDECO = {
    cove: [r => '<circle r="8" fill="#e8f6fa" stroke="#7fb4c4" stroke-width="1.4"/><circle r="4" fill="#7fd0e4"/>', 'flowers', 'lamp', 'pot'],
    beach: ['reed', 'bush', 'lamp'], town: ['bush', 'flowers', 'lamp', 'bench'], harbour: ['crate', 'barrel', 'lamp'], forest: ['bush', 'rose', 'rose', 'lamp'],
    cape: ['bush', 'flowers', 'lamp'], reef: ['pot', 'lamp', 'stool'], cave: ['barrel', 'bottle', 'lamp'], volcano: ['pot', 'lamp', 'stool', 'candle'],
  };
  const LD = {
    lamp: r => '<ellipse cx="2" cy="6" rx="6" ry="2.4" fill="#0b0716" opacity=".4"/><path d="M0 6V-8" stroke="#3a2d4a" stroke-width="2.6"/><circle cy="-10" r="13" fill="url(#tablesGlow)"/><circle cy="-10" r="4.2" fill="#ffe7a0" stroke="#d9b05a" stroke-width="1.4"/>',
    bush: r => '<ellipse cx="2" cy="6" rx="12" ry="4" fill="#0b0716" opacity=".4"/><circle cx="-5" cy="0" r="8" fill="#2f6a3a" ' + OL + '/><circle cx="6" cy="-1" r="9" fill="#3f8648" ' + OL + '/><circle cx="-3" cy="-4" r="4" fill="#5aa862" opacity=".7"/>',
    rose: r => '<ellipse cx="2" cy="6" rx="10" ry="3.4" fill="#0b0716" opacity=".4"/><circle r="9" fill="#2a5e36" ' + OL + '/><circle cx="-3" cy="-3" r="3.2" fill="#e8587a"/><circle cx="4" cy="1" r="3" fill="#f6b6c1"/><circle cx="-2" cy="4" r="2.6" fill="#d8455e"/>',
    flowers: r => '<g stroke="#1c1630" stroke-width="1"><circle cx="-7" cy="2" r="3.6" fill="#f6b6c1"/><circle cx="2" cy="-4" r="3.8" fill="#ffe7a0"/><circle cx="8" cy="3" r="3.4" fill="#cfe0ff"/></g><path d="M-7 5v4M2 0v8M8 6v3" stroke="#3f8648" stroke-width="1.4"/>',
    reed: r => '<path d="M-6 8L-8-8M0 8V-12M6 8L8-6" stroke="#6f9a5a" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="0" cy="-12" rx="2.4" ry="5" fill="#7a4a30"/>',
    bench: r => '<ellipse cx="2" cy="7" rx="16" ry="3.4" fill="#0b0716" opacity=".4"/><rect x="-15" y="-4" width="30" height="9" rx="2" fill="#a9794f" ' + OL + '/><rect x="-15" y="-7" width="30" height="4" rx="1.6" fill="#c99868" ' + OL + '/>',
    crate: r => '<rect x="-8" y="-7" width="16" height="15" fill="#a9794f" ' + OL + '/><path d="M-8-7L8 8M8-7L-8 8" stroke="#6b4a30" stroke-width="1.2"/>',
    barrel: r => '<ellipse cx="2" cy="9" rx="9" ry="3" fill="#0b0716" opacity=".4"/><path d="M-8-7Q-11 0-8 8H8Q11 0 8-7Z" fill="#8a5a3a" ' + OL + '/><path d="M-9-2H9M-9 4H9" stroke="#d9b05a" stroke-width="1.6"/><ellipse cy="-7" rx="8" ry="2.6" fill="#a9794f" ' + OL + '/>',
    pot: r => '<ellipse cx="2" cy="8" rx="9" ry="3" fill="#0b0716" opacity=".4"/><path d="M-7 0H7L5 8H-5Z" fill="#b8654a" ' + OL + '/><circle cx="-3" cy="-4" r="5" fill="#3f8648" ' + OL + '/><circle cx="4" cy="-5" r="3.6" fill="#f6b6c1" ' + OL + '/>',
    stool: r => '<ellipse cx="2" cy="6" rx="8" ry="3" fill="#0b0716" opacity=".4"/><circle r="8" fill="#a9794f" ' + OL + '/><circle r="5.4" fill="#fbf5ea" stroke="#d9b05a" stroke-width="1.2"/>',
    bottle: r => '<path d="M-3 8V-2L-1-8H1L3-2V8Z" fill="#3a6a4a" ' + OL + '/><rect x="-3" y="1" width="6" height="5" fill="#f1e3c8"/><path d="M-12 8L-8-3L-4 8Z" fill="#5a2a3a" ' + OL + '/>',
    candle: r => '<circle r="12" fill="url(#tablesGlow)"/><rect x="-3" y="-2" width="6" height="9" fill="#fbf5ea" ' + OL + '/><path d="M0-3Q-3-8 0-12Q3-8 0-3Z" fill="#ffd36a"/>',
  };
  const levelMap = {
    bg: '#1c1630',
    defs: '<linearGradient id="tablesSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2040"/><stop offset=".5" stop-color="#3a2d58"/><stop offset="1" stop-color="#221a38"/></linearGradient>' +
      '<radialGradient id="tablesGlow"><stop offset="0" stop-color="#ffe7a0" stop-opacity=".95"/><stop offset=".45" stop-color="#ffd36a" stop-opacity=".3"/><stop offset="1" stop-color="#ffd36a" stop-opacity="0"/></radialGradient>' +
      Object.keys(LGROUND).map(k => '<linearGradient id="tablesG' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + LGROUND[k][0] + '"/><stop offset="1" stop-color="' + LGROUND[k][1] + '"/></linearGradient>').join('') +
      '<pattern id="tablesPG" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M3 11l1.5-4M9 6l1.5-4" stroke="#9fd08a" stroke-width="1.2" stroke-linecap="round" opacity=".28"/></pattern>' +
      '<pattern id="tablesPS" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 0H20V20" fill="none" stroke="#fff" stroke-width="1" opacity=".12"/></pattern>' +
      '<pattern id="tablesPP" width="40" height="14" patternUnits="userSpaceOnUse"><path d="M0 .5H40M20 .5V14" stroke="#2e1c14" stroke-width="1.4" opacity=".4"/></pattern>' +
      '<pattern id="tablesPC" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M0 0H14V14H0ZM14 14H28V28H14Z" fill="#2a1a24" opacity=".35"/></pattern>',
    backdrop(H, rnd) {
      let s = '<rect width="400" height="' + H + '" fill="url(#tablesSky)"/>';
      for (let i = 0, n = Math.round(H / 14); i < n; i++) {
        const x = f1(rnd(i, 1) * 400), y = f1(rnd(2, i) * H), rr = f1(.7 + rnd(i, 5) * 1.5);
        s += '<circle cx="' + x + '" cy="' + y + '" r="' + rr + '" fill="' + (i % 4 ? '#f6e9d0' : '#ffd9a0') + '" opacity="' + f1(.3 + rnd(3, i) * .6) + '"/>';
      }
      for (let i = 0, n = Math.round(H / 230); i < n; i++) { // drifting paper lanterns
        const x = f1(20 + rnd(i, 9) * 360), y = f1(60 + (i + rnd(9, i) * .8) * H / n * .96);
        s += '<g transform="translate(' + x + ' ' + y + ')"><circle r="22" fill="url(#tablesGlow)" opacity=".7"/><rect x="-6" y="-8" width="12" height="15" rx="5" fill="#ffb86a" stroke="#c9742a" stroke-width="1.2"/><path d="M-6 0H6" stroke="#c9742a" stroke-width="1"/><path d="M0 7v5" stroke="#c9742a" stroke-width="1.2"/></g>';
      }
      for (let i = 0, n = Math.round(H / 420); i < n; i++) { // a crescent moon here and there
        const x = f1(40 + rnd(i, 13) * 320), y = f1(120 + i * 420);
        s += '<g transform="translate(' + x + ' ' + y + ')" opacity=".85"><circle r="9" fill="#fbf5ea"/><circle cx="4" cy="-2" r="8" fill="#2f2548"/></g>';
      }
      return s;
    },
    zone(z) {
      const g = LGROUND[z.theme] || LGROUND.town, P = '<path d="' + z.path + '"', L = landAt(z), S = z.stops;
      let s = P + ' fill="none" stroke="' + g[3] + '" stroke-width="18" opacity=".12"/><g transform="translate(2 6)">' + P + ' fill="#0b0716" opacity=".45"/></g>' +
        P + ' fill="url(#tablesG' + z.theme + ')" stroke="' + g[3] + '" stroke-width="3"/>' + P + ' fill="url(#tablesP' + g[2] + ')"/>' +
        P + ' fill="none" stroke="' + g[3] + '" stroke-width="9" stroke-dasharray="0.1 22" stroke-linecap="round" opacity=".28" transform="translate(0 0)"/>' +
        P + ' fill="none" stroke="#fff6d8" stroke-width="3.4" stroke-dasharray="0.1 22" stroke-linecap="round"/>';
      if (z.boss && S.length) { const b = [S.reduce((a, p) => a + p[0], 0) / S.length, S.reduce((a, p) => a + p[1], 0) / S.length]; // the ballroom dance floor under the boss table
        s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="76" fill="#f1dcae" opacity=".16"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="76" fill="none" stroke="#e6c375" stroke-width="2.4" stroke-dasharray="2 5" opacity=".7"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="58" fill="none" stroke="#e6c375" stroke-width="1.4" opacity=".6"/>';
      }
      if (L) s += '<g transform="translate(' + L[0] + ' ' + L[1] + ')">' + (LAND[z.theme] || LAND.town)(z) + '</g>';
      return '<g>' + s + '</g>';
    },
    keepOut(z) { // the landmark's box, from the same spot zone() draws it at, so decor stays clear of it
      const L = landAt(z);
      return L ? [[L[0] - 74, L[1] - 84, L[0] + 74, L[1] + 56]] : [];
    },
    decor(theme, r, r2, z) {
      const k = LDECO[theme] || LDECO.town, e = k[Math.floor(r * k.length) % k.length], f = typeof e === 'string' ? LD[e] : e;
      return f(r2);
    },
    sign(label, w) {
      return '<path d="M' + (w / 2 - 12) + ' 30L' + (w / 2 - 18) + ' 46M' + (w / 2 + 12) + ' 30L' + (w / 2 + 18) + ' 46" stroke="#a9794f" stroke-width="4" stroke-linecap="round"/><path d="M' + (w / 2 - 12) + ' 30L' + (w / 2 - 18) + ' 46M' + (w / 2 + 12) + ' 30L' + (w / 2 + 18) + ' 46" stroke="#6b4a30" stroke-width="1.2" stroke-linecap="round"/>' +
        '<rect x="2" y="4" width="' + w + '" height="32" rx="6" fill="#0b0716" opacity=".4"/><rect width="' + w + '" height="32" rx="6" fill="' + CREAM + '" stroke="' + GOLD + '" stroke-width="2.4"/><rect x="3.5" y="3.5" width="' + (w - 7) + '" height="25" rx="4" fill="none" stroke="' + GOLD + '" stroke-width=".8" opacity=".8"/>' +
        '<text x="' + w / 2 + '" y="17" text-anchor="middle" dominant-baseline="central" font-family="' + SERIF + '" font-style="italic" font-weight="700" font-size="13.5" fill="' + INK + '">' + label + '</text>';
    },
    road: { todo: ['#150f26', '#6b6478', '#4f4862'], done: ['#ffcf5a', '#fbf5ea', '#f1d58a'] },
    node(state, num, e, boss) {
      const nf = num.length > 3 ? 12 : num.length > 2 ? 14 : num.length > 1 ? 17 : 21;
      const lbl = col => '<text y="1" text-anchor="middle" dominant-baseline="central" font-family="' + SERIF + '" font-weight="800" font-size="' + nf + '" fill="' + col + '">' + num + '</text>';
      if (state === 'locked') {
        return '<circle cy="3" r="31" fill="#0b0716" opacity=".45"/><circle r="30" fill="#8d8798" stroke="#4a4458" stroke-width="2.4"/><circle r="30" fill="url(#tablesPS)"/>' +
          '<path d="M-26-14Q0-28 26-14M-26 14Q0 28 26 14M-14-26Q-26 0-14 26M14-26Q26 0 14 26" fill="none" stroke="#b3adc0" stroke-width="2.4" opacity=".7"/>' +
          '<path d="M-7-3V-9a7 7 0 0 1 14 0V-3" fill="none" stroke="#e6c375" stroke-width="3"/><rect x="-11" y="-4" width="22" height="17" rx="4" fill="#d9b05a" stroke="#6d4a1c" stroke-width="1.8"/><circle cy="4" r="2.6" fill="#6d4a1c"/><path d="M0 5v4" stroke="#6d4a1c" stroke-width="2"/>';
      }
      const cl = CLOTH[e] || CLOTH[0], hm = HEM[e] || HEM[0], cur = state === 'current', beat = state === 'beaten';
      let chairs = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .39; chairs += '<circle cx="' + f1(Math.cos(a) * 28.5) + '" cy="' + f1(Math.sin(a) * 28.5) + '" r="4" />'; }
      let s = '';
      if (cur) s += '<circle r="40" fill="url(#tablesGlow)"/>';
      s += '<circle cy="3" r="33" fill="#0b0716" opacity=".5"/><g fill="' + (cur ? '#ffe7a0' : beat ? GOLD : '#6d5a83') + '" stroke="#1c1630" stroke-width="1.2">' + chairs + '</g>' +
        '<circle r="25" fill="' + cl + '" stroke="' + (cur || boss ? '#ffd36a' : hm) + '" stroke-width="' + (cur || boss ? 3.4 : 2.4) + '"/><circle r="21.5" fill="none" stroke="' + hm + '" stroke-width="1.2" stroke-dasharray="3 3" opacity=".7"/>' +
        '<path d="M-17-13A22 22 0 0 1 4-21" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>' +
        '<circle r="15" fill="' + CREAM + '" stroke="' + (beat || cur ? GOLD : hm) + '" stroke-width="1.8"/>' + lbl(INK) + emb(-18, 18, 6.5, e);
      if (beat) s += '<g transform="translate(20 -20)"><circle r="8.5" fill="' + GOLD + '" stroke="#6d4a1c" stroke-width="1.6"/><path d="M0-5L1.5-1.6L5.2-1.4L2.4 .9L3.3 4.4L0 2.4L-3.3 4.4L-2.4 .9L-5.2-1.4L-1.5-1.6Z" fill="#fff6d8"/></g>';
      if (cur) s += '<g fill="#ffd36a" stroke="#c9742a" stroke-width="1"><path d="M0-31Q-3-36 0-40Q3-36 0-31Z"/><path d="M-31 0Q-36-3-40 0Q-36 3-31 0Z"/><path d="M31 0Q36-3 40 0Q36 3 31 0Z"/><path d="M0 31Q-3 36 0 40Q3 36 0 31Z"/></g>';
      if (boss) s += '<path d="M-10-27L-7-35L-3-30L0-37L3-30L7-35L10-27Z" fill="' + GOLD + '" stroke="#6d4a1c" stroke-width="1.4" stroke-linejoin="round"/>';
      return s;
    },
    start() {
      return '<ellipse cx="3" cy="14" rx="40" ry="8" fill="#0b0716" opacity=".4"/><path d="M-30 14V-26a30 38 0 0 1 60 0V14" fill="none" stroke="' + GOLD + '" stroke-width="3.4"/><path d="M-30-10Q0-34 30-10" fill="none" stroke="#fff6d8" stroke-width="2" stroke-dasharray="0.1 7" stroke-linecap="round"/>' +
        '<g ' + OL + '><rect x="-40" y="-24" width="14" height="38" rx="2" fill="#cfc6d8"/><rect x="26" y="-24" width="14" height="38" rx="2" fill="#cfc6d8"/><rect x="-43" y="-28" width="20" height="7" rx="2" fill="#e5dcee"/><rect x="23" y="-28" width="20" height="7" rx="2" fill="#e5dcee"/></g>' +
        '<circle cx="-33" cy="-38" r="16" fill="url(#tablesGlow)"/><circle cx="33" cy="-38" r="16" fill="url(#tablesGlow)"/><circle cx="-33" cy="-37" r="4.4" fill="#ffe7a0" stroke="' + GOLD + '"/><circle cx="33" cy="-37" r="4.4" fill="#ffe7a0" stroke="' + GOLD + '"/>' +
        '<text y="6" text-anchor="middle" font-family="' + SERIF + '" font-style="italic" font-weight="700" font-size="12" fill="' + CREAM + '" stroke="#1c1630" stroke-width="3" paint-order="stroke">Welcome</text>';
    },
    pin() {
      return '<path d="M0 27C-6 17-19 9-19-5A19 19 0 0 1 19-5C19 9 6 17 0 27Z" fill="' + GOLD + '" stroke="#6d4a1c" stroke-width="2.4"/><path d="M-15-7A15 15 0 0 1 -4-17" fill="none" stroke="#fff6d8" stroke-width="2" stroke-linecap="round"/>' + gran(0, -6, 13.5);
    },
  };
  FTH_SKINS.register({
    id: 'tables', name: 'Gran\'s Table', ic: '👵', blurb: 'a wedding, a feud, one seat',
    coin: { name: 'sugar cube', plural: 'sugar cubes', glyph: '🍬', value: 5, pitch: 0.7,   // this skin's currency (SKIN-SPEC.md section 12)
      colors: { main: '#fffdf5', edge: '#d7c9b5' },
      svg: FTH_SKINS.coinArt('<path d="M0 -11.6L10.4 -5.8V5.8L0 11.6L-10.4 5.8V-5.8Z" fill="#e4d8c4"/><path d="M0 -11.6L10.4 -5.8L0 0L-10.4 -5.8Z" fill="#fffdf5"/><path d="M-10.4 -5.8L0 0V11.6L-10.4 5.8Z" fill="#efe5d3"/><path d="M0 0L10.4 -5.8V5.8L0 11.6Z" fill="#d9ccb6"/><path d="M-10.4 -5.8L0 0L10.4 -5.8M0 0V11.6" fill="none" stroke="#1c1640" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -11.6L10.4 -5.8V5.8L0 11.6L-10.4 5.8V-5.8Z" fill="none" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/><circle cx="-3" cy="-5.6" r=".9" fill="#d7c9b5"/><circle cx="3.2" cy="-4.4" r=".7" fill="#d7c9b5"/><circle cx="-6" cy="3" r=".8" fill="#fff"/>') },
    src: 'lab/tables.html', needs: ['cells'],
    hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(circle at 50% 0%, #4a3a68 0%, #2a2040 45%, #1c1630 100%)',
      '--sk-ink': '#f6e9d0',
      '--sk-accent': '#d9b05a',
      '--sk-card': 'linear-gradient(180deg, #fbf5ea, #f1e6cf)',
      '--sk-card-ink': '#2a1840',
      '--sk-hud': 'linear-gradient(180deg, #382c52, #2a2040)',
      '--sk-btn': 'linear-gradient(180deg, #f0d28a, #d9a441)',
      '--sk-btn-ink': '#2a1840',
      '--sk-btn-shadow': '#9c6f1f',
      '--sk-chip': '#fbf5ea',
      '--sk-chip-ink': '#2a1840',
      '--sk-edge': '#d9a441',
      '--sk-btn2': '#fbf5ea',
      '--sk-btn2-ink': '#2a1840',
      '--sk-coin': '#f3d78a',
      '--sk-font': "'Playfair Display', Georgia, 'Times New Roman', serif",
      '--sk-radius': '16px',
      '--sk-star-on': '#e0a93a', '--sk-star-edge': '#7a5406', '--sk-star-off': '#9a8a78', '--sk-star-off-edge': '#6e5a46',
      '--sk-ctl': '#fbf5ea', '--sk-ctl-ink': '#2a1840', '--sk-ctl-edge': '#d9a441',
    },
    // place cards: cream chips, a double gold ring (outline 1px, inset 2px gap inside the 1px border), warm shadows
    css: '.tl .hl{opacity:0;transition:opacity .15s}.tl.lit .hl{opacity:.9}.tl.lit .hx{stroke-width:3.4}' +
      '.tl.glow .tin{filter:drop-shadow(0 0 5px #ffe7a0) drop-shadow(0 0 2px #7a5406)}' +
      '.btn3d{border:1px solid #d9a441;border-radius:12px;outline:1px solid #d9a441;outline-offset:-3px;font-family:var(--sk-font);font-style:italic;font-weight:700;letter-spacing:.02em;box-shadow:0 5px 0 var(--sh),0 10px 18px rgba(12,4,20,.4)}' +
      '.btn3d.white,.btn3d.yellow,.btn3d.blue,.btn3d.orange,.btn3d.teal,.btn3d.purple{background:#fbf5ea;color:#2a1840;--sh:#a87a2c}' +
      '.btn3d.go{color:#2a1840;outline-color:rgba(42,24,64,.5)}' +
      '.btn3d.rbtn,.bar .rb{border-radius:12px;border:1px solid #d9a441}' +
      '.bar .rb{outline:1px solid #d9a441;outline-offset:-3px}' +
      '.badge,.goalbar,.starbar,.mnode .mst,.mnode .mtag,.say .msg{border:1px solid #d9a441;outline:1px solid #d9a441;outline-offset:-3px;border-radius:12px;box-shadow:0 4px 10px rgba(12,4,20,.35)}' +
      '.mnode .mst,.mnode .mtag{border-radius:10px}' +
      '.say .msg::before{border-right-color:#d9a441}.say .msg::after{border-right-color:#fbf5ea}' +
      '.coins{border:1px solid #d9a441;outline:1px solid #d9a441;outline-offset:-3px;border-radius:12px;box-shadow:0 4px 10px rgba(12,4,20,.35);color:#2a1840;font-family:var(--sk-font);font-style:italic}' +
      '.skins button{border:1px solid #d9a441;outline:1px solid rgba(217,164,65,.7);outline-offset:-3px;border-radius:12px;box-shadow:0 3px 8px rgba(12,4,20,.35);font-family:var(--sk-font);font-style:italic}' +
      '.skins button[aria-checked="true"]{background:#fbf5ea;color:#2a1840;border-color:#d9a441}' +
      '.htdots button,.htdots button.on{border-radius:999px}' +
      '.htnum{border:1px solid #d9a441;outline:1px solid #d9a441;outline-offset:-3px;box-shadow:0 4px 10px rgba(12,4,20,.35)}' +
      '#brief .card,#win .card,#installSheet .card{border:1px solid #d9a441;outline:1px solid #d9a441;outline-offset:-3px;box-shadow:0 12px 30px rgba(12,4,20,.45)}' +
      '#brief .card h2,#win .card h2,#installSheet h2{font-family:var(--sk-font);font-style:italic;color:#2a1840}' +
      '#briefGo{--sh:#9c6f1f;background:var(--sk-btn);color:var(--sk-btn-ink);border:1px solid #d9a441;outline:1px solid #d9a441;outline-offset:-3px;box-shadow:0 5px 0 var(--sh),0 10px 18px rgba(12,4,20,.4);text-shadow:none}' +
      '#briefGo:active{box-shadow:0 1px 0 var(--sh)}' +
      '#brief .card p,#brief .card .k,#brief details,#brief details summary,#brief .card table,#brief .card td:first-child{color:#2a1840 !important;text-shadow:none}' +
      '#brief details summary{font-weight:800}' +
      '.gtop{box-shadow:0 2px 0 #d9a441,0 8px 16px rgba(12,4,20,.45)}',
    fonts: ['https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,600&family=Nunito:wght@700;800&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'Gran won\'t sit', text: 'The bride\'s grandmother feuds with five guests, and they are spread over all four tables. She has nowhere to sit.', svg: p1 },
      { title: 'Feuds', text: 'Guests who feud can\'t share a table. Pick a guest up to see their rivals; each table has its own flowers.', svg: p2 },
      { title: 'Move a guest', text: 'Drag a guest to another table. Their rivals there storm off to the old table, and their rivals storm back: a cascade, which is one chain swap.', svg: p3 },
      { title: 'Locks', text: 'If the cascade drags another of Gran\'s rivals along, the table counts stay the same: that move is locked and gets her nowhere.', svg: p4 },
      { title: 'Seat Gran', text: 'Free one table of all five rivals, and Gran walks over and sits. Glasses clink!', svg: p5 },
    ],
    bonus: { label: 'TABLE BONUS', board: 'radial-gradient(circle at 50% 0%, #3b2e58, #1c1630)', line: '#ffe7a0', tile: bonusTile },
    map: {
      sea: ['#4a3a68', '#43355f', '#3c2f56', '#35294d', '#2e2444', '#281f3b', '#221a33', '#1c152b', '#161024'],
      seaX: '#0f0a1c',
      fog: '#0a0714',
      unknown: '#8a7a9e',
      ramp: ['#7fd47a', '#f6d36a', '#f0955a', '#d8455e'],
      grey: '#9a90a8',
      route: '#ffe7a0',
      ink: 'rgba(246,233,208,.88)',
      cell(path, x, y, r) { // a round table: a 12-gon, close to a circle
        for (let i = 0; i < 12; i++) {
          const a = Math.PI / 6 * i, px = x + Math.cos(a) * r * .96, py = y + Math.sin(a) * r * .96;
          if (i) path.lineTo(px, py); else path.moveTo(px, py);
        }
        path.closePath();
      },
    },
    levelMap,
    words: { win: 'Gran has found her table!', perfect: 'Perfect seating! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'SEATING PLANS' },
  });
})();
