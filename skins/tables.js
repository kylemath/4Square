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

  FTH_SKINS.register({
    id: 'tables', name: 'Gran\'s Table', ic: '👵', blurb: 'a wedding, a feud, one seat',
    src: 'lab/tables.html', needs: ['cells'],
    hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(circle at 50% 0%, #4a3a68 0%, #2a2040 45%, #1c1630 100%)',
      '--sk-ink': '#f6e9d0',
      '--sk-accent': '#d9b05a',
      '--sk-card': 'linear-gradient(180deg, #fbf5ea, #f1e6cf)',
      '--sk-card-ink': '#3a2a3f',
      '--sk-hud': 'linear-gradient(180deg, #382c52, #2a2040)',
      '--sk-btn': 'linear-gradient(180deg, #e6c375, #c9a34a)',
      '--sk-btn-ink': '#3a2410',
      '--sk-btn-shadow': '#8a6a1c',
      '--sk-font': "'Playfair Display', Georgia, 'Times New Roman', serif",
      '--sk-radius': '16px',
    },
    css: '.tl .hl{opacity:0;transition:opacity .15s}.tl.lit .hl{opacity:.9}.tl.lit .hx{stroke-width:3.4}' +
      '.tl.glow .tin{filter:drop-shadow(0 0 5px #ffe7a0) drop-shadow(0 0 2px #7a5406)}',
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
    words: { win: 'Gran has found her table!', perfect: 'Perfect seating! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?', chart: 'SEATING PLANS' },
  });
})();
