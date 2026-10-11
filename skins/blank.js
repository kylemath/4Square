// Blank Doodle: a colouring-book skin. Bright white pages, bold black outlines, grainy crayon fills, Fredoka lettering.
// The map starts uncoloured; the player colours every piece and swaps a two-pen group when a piece shows "?".
(function () {
  const INK = '#1b1b2f';
  const PC = ['#ff5d5d', '#3fa7f5', '#ffc928', '#3ccf6e'];      // red, blue, yellow, green (blank.html's pens)
  const PL = ['#ffb3a8', '#a9d8fb', '#ffe58a', '#a6e8bb'];      // pale crayon tints
  const F = "Fredoka,'Baloo 2','Arial Rounded MT Bold',system-ui,sans-serif";
  const f1 = n => Math.round(n * 10) / 10;

  // polygon points of a hexagon (rot 0: flat top; rot 30: pointy top)
  function hexPts(cx, cy, r, rot) {
    const o = [];
    for (let i = 0; i < 6; i++) { const a = (rot + 60 * i) * Math.PI / 180; o.push(f1(cx + r * Math.cos(a)) + ',' + f1(cy + r * Math.sin(a))); }
    return o.join(' ');
  }
  // neighbour centre of a hexagon in direction k (0..5) at spacing d; rot as above
  const nb = (cx, cy, d, rot, k) => { const a = (rot + 30 + 60 * k) * Math.PI / 180; return [cx + d * Math.cos(a), cy + d * Math.sin(a)]; };

  // one crayon piece: c = pen 0..3 or -1 for a blank piece; extra = extra attributes
  function piece(id, cx, cy, r, c, rot, cls) {
    const p = hexPts(cx, cy, r * 0.95, rot || 0);
    const k = cls ? ' class="' + cls + '"' : '';
    if (c < 0) return '<polygon' + k + ' points="' + p + '" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
    return '<g' + k + '><polygon points="' + p + '" fill="' + PC[c] + '" fill-opacity=".62" stroke="none"/>' +
      '<polygon points="' + p + '" fill="' + PC[c] + '" filter="url(#g' + id + ')"/>' +
      '<polygon points="' + p + '" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/></g>';
  }
  function pen(x, y, c, rot, s) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + (s || 1) + ')">' +
      '<rect x="-6" y="-34" width="12" height="40" rx="3" fill="' + PC[c] + '" stroke="' + INK + '" stroke-width="2.4"/>' +
      '<rect x="-6" y="-34" width="12" height="9" rx="3" fill="#fff" stroke="' + INK + '" stroke-width="2.4"/>' +
      '<polygon points="-6,6 6,6 0,17" fill="#f3e3c3" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<polygon points="-2.6,12 2.6,12 0,17" fill="' + PC[c] + '"/></g>';
  }
  const txt = (x, y, s, size, anchor, fill, extra) =>
    '<text x="' + x + '" y="' + y + '" font-family="' + F + '" font-weight="700" font-size="' + size + '" text-anchor="' + (anchor || 'middle') +
    '" fill="' + (fill || INK) + '"' + (extra || '') + '>' + s + '</text>';
  // wrap an svg: paper background, crayon grain filter g{id}, animation css wrapped for reduced motion
  function svg(id, body, css) {
    return '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><filter id="g' + id + '" x="-5%" y="-5%" width="110%" height="110%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="' + (id.length * 7 + 3) + '" result="n"/>' +
      '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -.45" result="m"/>' +
      '<feComposite in="SourceGraphic" in2="m" operator="in"/></filter></defs>' +
      (css ? '<style>@media (prefers-reduced-motion: no-preference){' + css + '}</style>' : '') +
      '<rect x="6" y="6" width="288" height="238" rx="18" fill="#fffefa" stroke="' + INK + '" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round" opacity=".55"/>' +
      body + '</svg>';
  }
  const penRow = (y, s) => [0, 1, 2, 3].map(i => pen(96 + i * 36, y, i, 0, s || 0.62)).join('');

  // ---------- title ----------
  const titleBody = (() => {
    const cx = 150, cy = 122, r = 34, d = r * 1.75, col = [0, 1, 2, 3, 1], o = [];
    col.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece('t', p[0], p[1], r, c, 0, 'tt tt' + k)); });
    o.push('<polygon points="' + hexPts(cx, cy, r * 0.95, 0) + '" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-dasharray="7 6" stroke-linejoin="round"/>');
    o.push(txt(cx, cy + 12, '?', 34, 'middle', '#ff9f1c', ' class="tq"'));
    o.push('<g class="tp">' + pen(236, 62, 2, 38, 1.05) + '</g>');
    return o.join('');
  })();
  const titleSvg = svg('t', titleBody,
    '.tq{animation:tqw 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes tqw{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg) scale(1.1)}}' +
    '.tp{animation:tpb 2.4s ease-in-out infinite}@keyframes tpb{0%,100%{transform:translate(0,0)}50%{transform:translate(-6px,8px)}}');

  // ---------- intro 1: colour every piece ----------
  const i1 = (() => {
    const cx = 150, cy = 110, r = 30, d = r * 1.75, o = [], ring = [0, 1, -1, 3, 2, -1];
    o.push(piece('a', cx, cy, r, -1, 0));
    ring.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece('a', p[0], p[1], r, c, 0, k === 2 ? 'a2' : '')); });
    const p5 = nb(cx, cy, d, 0, 5);
    o.push('<g class="a5">' + piece('a', p5[0], p5[1], r, 1, 0) + '</g>');
    o.push('<g class="ap">' + pen(222, 56, 1, 32, 1) + '</g>');
    o.push(penRow(238, 0.7));
    return svg('a', o.join(''),
      '.a5{animation:a5f 3.2s ease-in-out infinite}@keyframes a5f{0%,25%{opacity:0}45%,85%{opacity:1}100%{opacity:0}}' +
      '.ap{animation:apb 3.2s ease-in-out infinite}@keyframes apb{0%,100%{transform:translate(0,0)}35%{transform:translate(-10px,18px)}}');
  })();

  // ---------- intro 2: neighbours must differ ----------
  const i2 = (() => {
    const r = 33, d = r * 1.75, o = [];
    const row = (y, a, b, ok) => {
      const x1 = 150 - d / 2, x2 = 150 + d / 2;
      o.push(piece('b', x1, y, r, a, 30), piece('b', x2, y, r, b, 30));
      const ex = 150, ey1 = y - r / 2 * 0.95, ey2 = y + r / 2 * 0.95;
      if (!ok) o.push('<line class="bc" x1="' + ex + '" y1="' + f1(ey1) + '" x2="' + ex + '" y2="' + f1(ey2) + '" stroke="#e8112d" stroke-width="6" stroke-linecap="round"/>' +
        '<g class="bs" stroke="#e8112d" stroke-width="3" stroke-linecap="round"><path d="M150 ' + (y - 28) + ' v-9 M139 ' + (y - 24) + ' l-6 -6 M161 ' + (y - 24) + ' l6 -6"/></g>');
    };
    row(68, 0, 0, false); row(160, 0, 1, true);
    o.push(txt(232, 76, 'clash!', 17, 'start', '#e8112d', ' transform="rotate(-8 232 76)"'));
    o.push(txt(232, 168, 'fine', 17, 'start', '#1f8f45', ' transform="rotate(-8 232 168)"'));
    o.push(txt(150, 232, 'touching pieces: different pens', 14, 'middle', INK));
    return svg('b', o.join(''), '.bc{animation:bcp 1s ease-in-out infinite}@keyframes bcp{50%{opacity:.35}}.bs{animation:bcp 1s ease-in-out infinite}');
  })();

  // ---------- intro 3: the stuck "?" ----------
  const i3 = (() => {
    const cx = 150, cy = 112, r = 30, d = r * 1.75, o = [], ring = [0, 1, 2, 3, 0];
    ring.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece('c', p[0], p[1], r, c, 0)); });
    o.push('<polygon points="' + hexPts(cx, cy, r * 0.95, 0) + '" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>');
    o.push(txt(cx, cy + 13, '?', 38, 'middle', '#ff7a00', ' class="cq"'));
    o.push(penRow(238, 0.55));
    return svg('c', o.join(''), '.cq{animation:cqw 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes cqw{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg) scale(1.12)}}');
  })();

  // ---------- intro 4: swap a two-pen group ----------
  const i4 = (() => {
    const r = 17, d = r * 1.75, o = [];
    const panel = (id, cx, cy, after) => {
      const ring = after ? [3, 1, 2, 3, 1] : [0, 1, 2, 3, 1];     // ring pieces k0..k4
      const P = nb(cx, cy, 2 * d, 0, 0);                            // outer piece next to k0
      const k0 = nb(cx, cy, d, 0, 0);
      ring.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece(id, p[0], p[1], r, c, 0)); });
      o.push(piece(id, P[0], P[1], r, after ? 0 : 3, 0));
      if (after) { o.push(piece(id, cx, cy, r, 0, 0, 'd4p')); }
      else {
        o.push('<polygon points="' + hexPts(cx, cy, r * 0.95, 0) + '" fill="#fff" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' + txt(cx, cy + 7, '?', 20, 'middle', '#ff7a00'));
        const mx = (k0[0] + P[0]) / 2, my = (k0[1] + P[1]) / 2;
        o.push('<ellipse class="d4g" cx="' + f1(mx) + '" cy="' + f1(my) + '" rx="' + f1(d * 1.2) + '" ry="' + f1(r * 1.12) + '" transform="rotate(30 ' + f1(mx) + ' ' + f1(my) + ')" fill="none" stroke="#ff9f1c" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round"/>');
      }
    };
    panel('d', 72, 118, false); panel('e', 228, 118, true);
    o.push('<path d="M128 112 h30 m-9 -9 l9 9 l-9 9" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>');
    o.push(txt(150, 98, 'swap', 14, 'middle', '#c98400'));
    o.push(txt(72, 36, 'before', 15), txt(228, 36, 'after', 15));
    o.push(txt(150, 218, 'red and green swap places,', 13), txt(150, 236, 'so red is free for the ?', 13));
    return svg('d', o.join(''), '.d4g{animation:d4a 1.2s ease-in-out infinite}@keyframes d4a{50%{stroke-dashoffset:-11}}.d4p{animation:d4b 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes d4b{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}');
  })();

  // ---------- intro 5: rub out and win ----------
  const i5 = (() => {
    const cx = 150, cy = 140, r = 28, d = r * 1.75, o = [], ring = [1, 2, 1, 2, 1, 3];
    o.push(piece('f', cx, cy, r, 0, 0));
    ring.forEach((c, k) => { const p = nb(cx, cy, d, 0, k); o.push(piece('f', p[0], p[1], r, c, 0)); });
    o.push('<g transform="translate(150 40) rotate(-6)"><rect x="-72" y="-22" width="144" height="44" rx="14" fill="#fff59d" stroke="' + INK + '" stroke-width="3.2"/>' + txt(0, 9, 'Coloured!', 28, 'middle', INK) + '</g>');
    o.push('<g class="fe" transform="translate(236 196) rotate(-28)"><rect x="-22" y="-11" width="44" height="22" rx="6" fill="#ff9cb8" stroke="' + INK + '" stroke-width="2.8"/><rect x="-22" y="-11" width="14" height="22" rx="6" fill="#fff" stroke="' + INK + '" stroke-width="2.8"/></g>');
    o.push(txt(54, 214, 'rub out', 13, 'middle'), txt(54, 230, 'to redo', 13, 'middle'));
    return svg('f', o.join(''), '.fe{animation:feb 1.4s ease-in-out infinite}@keyframes feb{0%,100%{translate:0 0}50%{translate:-8px 4px}}');
  })();

  // ---------- bonus tile: a crayon hexagon ----------
  function tile(x, y, r, e, k) {
    const R = r * 0.94, p = hexPts(0, 0, R, 0), h = [];
    for (let i = 0; i < 4; i++) {                                    // a few hatch strokes, deterministic in k
      const jx = ((k * 7 + i * 5) % 7 - 3) * r * 0.05, jy = ((k * 3 + i * 11) % 5 - 2) * r * 0.05;
      const px = (i % 2 ? 1 : -1) * r * 0.26 + jx, py = (i < 2 ? -1 : 1) * r * 0.28 + jy, L = r * 0.2;
      h.push('M' + f1(px - L) + ' ' + f1(py + L) + 'L' + f1(px + L) + ' ' + f1(py - L));
    }
    return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + f1(x) + ' ' + f1(y) + ')"><g class="tin">' +
      '<polygon class="halo" points="' + hexPts(0, 0, R * 1.22, 0) + '" fill="#ffd84a" opacity="0"/>' +
      '<polygon class="hx" points="' + p + '" fill="' + PC[e] + '" fill-opacity=".78" stroke="' + INK + '" stroke-width="' + f1(Math.max(2, r * 0.13)) + '" stroke-linejoin="round"/>' +
      '<path class="gr" d="' + h.join('') + '" stroke="' + INK + '" stroke-opacity=".28" stroke-width="' + f1(Math.max(1.2, r * 0.08)) + '" stroke-linecap="round" fill="none"/>' +
      '</g></g>';
  }

  // ---------- map cell: a rounded hexagon ----------
  function cell(path, x, y, r) {
    const v = [], k = 0.24;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; v.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
    const mix = (a, b) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const s = mix(v[0], v[5]);
    path.moveTo(s[0], s[1]);
    for (let i = 0; i < 6; i++) {
      const b = mix(v[i], v[(i + 1) % 6]), n = mix(v[(i + 1) % 6], v[i]);
      path.quadraticCurveTo(v[i][0], v[i][1], b[0], b[1]);
      path.lineTo(n[0], n[1]);
    }
    path.closePath();
  }

  FTH_SKINS.register({
    id: 'blank', name: 'Blank Doodle', ic: '📝', blurb: 'colour a blank map, swap to unstick',
    src: 'lab/blank.html', waits: true, own: true, needs: ['cells'],
    hud: 'compact',
    theme: {
      '--sk-bg': 'radial-gradient(rgba(43,45,66,.09) 1.1px, transparent 1.5px) 0 0 / 18px 18px, linear-gradient(180deg, #ffffff 0%, #fffaf0 100%)',
      '--sk-ink': '#2b2d42',
      '--sk-accent': '#ffb800',
      '--sk-card': '#ffffff',
      '--sk-card-ink': '#2b2d42',
      '--sk-hud': 'linear-gradient(180deg, #fff3b0 0%, #ffe066 100%)',
      '--sk-btn': 'linear-gradient(180deg, #ffd23f, #ffb800)',
      '--sk-btn-ink': '#2b2d42',
      '--sk-btn-shadow': '#c98400',
      '--sk-font': "Fredoka, 'Baloo 2', 'Arial Rounded MT Bold', 'Trebuchet MS', system-ui, sans-serif",
      '--sk-radius': '20px',
    },
    css: '.tl .hx{transition:filter .15s,stroke .15s}' +
      '.tl.lit .hx{fill-opacity:1;filter:saturate(1.25) brightness(1.06)}' +
      '.tl.lit .gr{stroke-opacity:.5}' +
      '.tl.glow .halo{opacity:.85}' +
      '.tl.glow .hx{stroke:#1b1b2f;fill-opacity:1;filter:saturate(1.4) brightness(1.12)}',
    fonts: ['https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap'],
    title: { svg: titleSvg },
    intro: [
      { title: 'Colour every piece', text: 'The map starts blank. Pick a pen, then tap or drag across pieces to colour them in. The hole counts too.', svg: i1 },
      { title: 'Neighbours must differ', text: 'Two pieces that touch can never share a pen. A red glow on the border shows a clash.', svg: i2 },
      { title: 'A "?" means stuck', text: 'When all four pens already touch a blank piece, a pencil "?" appears. It cannot be coloured as things stand.', svg: i3 },
      { title: 'Swap a two-pen group', text: 'Press a coloured piece, then let go on its glowing group: its two pens trade places. That frees a pen for the "?".', svg: i4 },
      { title: 'Rub out and finish', text: 'Tap a piece with its own pen to rub it out. Colour every piece with no matching neighbours to win.', svg: i5 },
    ],
    bonus: {
      label: 'BONUS',
      board: 'radial-gradient(rgba(43,45,66,.1) 1px, transparent 1.4px) 0 0 / 14px 14px, #fffdf6',
      line: '#1b1b2f',
      tile,
    },
    map: {
      sea: ['#ffe9dc', '#ffd9c8', '#ffc7b2', '#ffb29c', '#f99a86', '#ee8372', '#de6a5e', '#c85250', '#aa3f44'],
      seaX: '#fffdf6',
      unknown: '#ebe2c8',
      ramp: ['#3ccf6e', '#ffc928', '#ff9a3c', '#ff5d5d'],
      grey: '#a9a498',
      route: '#ff8a00',
      ink: 'rgba(43,45,66,.85)',
      cell,
    },
    words: {
      win: 'Coloured!',
      perfect: 'Every piece coloured, no neighbours match!',
      par: 'Par is {par} swaps. Can you get ★★★?',
      chart: 'COLOURING SPACE',
    },
  });
})();
