// Respawn: a fast third-person runner through the rooms of the puzzle. A room is a colouring, a door is a chain (going
// through swaps it), the goal room is a filled hole. One fuse burns while you decide; each room reached adds time; when it
// burns out the run ends and a new run starts from the start room (learn the doors by heart). Play page lab/respawn.html
// (model lab/respawn-core.js); design note lab/RESPAWN-DESIGN.md. Drawn the Islands way: offset shadow, deep base, lit
// body, highlight, outline, with neon light on a dark dungeon.
(function () {
  const COL = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'], DK = ['#8e1c17', '#1b4f91', '#8a6510', '#1a6b2a'];
  const LT = ['#f6a08a', '#9cc6f4', '#f4e09a', '#a6d9a1'], NEON = ['#ff7a52', '#5ab4ff', '#ffe066', '#5cff8a'];
  const INK = '#0a0712', WALL = '#2c2440', WALL_D = '#1a1428', STONE = '#3d3160', GOLD = '#ffcf4a', GOLD_D = '#8a5a14', CYAN = '#9ff3ff', RED = '#ff4d6d', MINT = '#7dff9a';
  const FONT = "'Bungee','Arial Black',system-ui,sans-serif";
  const ICON = [   // lab/core.js LAB.ICON (24 x 24): fire, water, air, earth
    'M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2.4 1.1-4.1 2.3-5.2.1 1.6.8 2.7 1.9 3.3C10.3 8 11 5 12 2z',
    'M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z',
    'M3 8.5h11a2.6 2.6 0 1 0-2.6-2.6M3 12.5h15a2.8 2.8 0 1 1-2.8 2.8M3 16.5h8',
    'M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15M6 18c3-4 6-7 9-9',
  ];
  const f1 = n => Math.round(n * 10) / 10, P = (x, y) => f1(x) + ' ' + f1(y);
  const icon24 = (e, s, ink) => '<path d="' + ICON[e] + '" transform="scale(' + f1(s * 100) / 100 + ') translate(-12 -12)" ' +
    (e < 2 ? 'fill="' + ink + '"' : 'fill="none" stroke="' + ink + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"') + '/>';
  // a doorway silhouette per element (so shape reads as well as colour): fire a pointed arch, water a round arch,
  // air a tall slim arch, earth a square lintel. r is about half the height; the sill sits at y = r
  function doorD(e, r, half) {          // half: only the right half (x >= 0), for a two-colour door
    const w = e === 2 ? r * .62 : r * .82, top = -r * 1.05, x0 = half ? 0 : -w;
    if (e === 0) return half ? 'M0 ' + f1(r) + 'V' + f1(top) + 'Q' + P(w, top + r * .3) + ' ' + P(w, -r * .2) + 'V' + f1(r) + 'Z'
      : 'M' + P(-w, r) + 'V' + f1(-r * .2) + 'Q' + P(-w, top + r * .3) + ' 0 ' + f1(top) + 'Q' + P(w, top + r * .3) + ' ' + P(w, -r * .2) + 'V' + f1(r) + 'Z';
    if (e === 3) return half ? 'M0 ' + f1(r) + 'V' + f1(top) + 'H' + f1(w - r * .12) + 'Q' + P(w, top) + ' ' + P(w, top + r * .12) + 'V' + f1(r) + 'Z'
      : 'M' + P(-w, r) + 'V' + f1(top + r * .12) + 'Q' + P(-w, top) + ' ' + P(-w + r * .12, top) + 'H' + f1(w - r * .12) + 'Q' + P(w, top) + ' ' + P(w, top + r * .12) + 'V' + f1(r) + 'Z';
    return half ? 'M0 ' + f1(r) + 'V' + f1(top) + 'A' + f1(w) + ' ' + f1(w) + ' 0 0 1 ' + P(w, top + w) + 'V' + f1(r) + 'Z'
      : 'M' + P(x0, r) + 'V' + f1(top + w) + 'A' + f1(w) + ' ' + f1(w) + ' 0 0 1 ' + P(w, top + w) + 'V' + f1(r) + 'Z';
  }
  // one door tile: shadow, deep frame, lit leaf, outline, icon, highlight. o.pair = [a, b] draws a two-colour door (a swap)
  function door(e, x, y, r, o) {
    o = o || {};
    const d = doorD(e, r), inner = doorD(e, r * .74), sw = f1(Math.max(1.3, r * .1)), a = o.pair ? o.pair[0] : e, b = o.pair ? o.pair[1] : e;
    return '<g transform="translate(' + P(x, y) + ')">' + (o.cls ? '<g class="' + o.cls + '">' : '<g>') +
      (o.glow ? '<ellipse cy="' + f1(r * .2) + '" rx="' + f1(r * 1.3) + '" ry="' + f1(r * 1.4) + '" fill="' + (o.glowCol || NEON[a]) + '" opacity="' + o.glow + '"/>' : '') +
      '<path d="' + d + '" transform="translate(' + P(r * .12, r * .14) + ')" fill="' + INK + '" opacity=".55"/>' +
      '<path d="' + d + '" fill="' + DK[a] + '"/>' + (a !== b ? '<path d="' + doorD(e, r, true) + '" fill="' + DK[b] + '"/>' : '') +
      '<path d="' + inner + '" transform="translate(0 ' + f1(r * .13) + ')" fill="' + COL[a] + '"/>' +
      (a !== b ? '<path d="' + doorD(e, r * .74, true) + '" transform="translate(0 ' + f1(r * .13) + ')" fill="' + COL[b] + '"/><path d="M0 ' + f1(-r * .62) + 'V' + f1(r) + '" stroke="' + INK + '" stroke-width="' + f1(Math.max(1, r * .06)) + '" opacity=".6"/>' : '') +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<g transform="translate(0 ' + f1(r * .22) + ')">' + icon24(a, r * .48 / 12, '#fff') + '</g>' +
      '<ellipse cx="' + f1(-r * .32) + '" cy="' + f1(-r * .5) + '" rx="' + f1(r * .2) + '" ry="' + f1(r * .1) + '" transform="rotate(-35 ' + P(-r * .32, -r * .5) + ')" fill="#fff" opacity=".55"/></g></g>';
  }
  // a gem of element e (the mural's rim tiles)
  const gem = (e, x, y, r) => '<g transform="translate(' + P(x, y) + ')"><circle r="' + f1(r) + '" transform="translate(1.5 2)" fill="' + INK + '" opacity=".5"/><circle r="' + f1(r) + '" fill="' + DK[e] + '" stroke="' + INK + '" stroke-width="2"/>' +
    '<circle r="' + f1(r * .76) + '" cx="' + f1(-r * .08) + '" cy="' + f1(-r * .1) + '" fill="' + COL[e] + '"/>' + icon24(e, r * .55 / 12, '#fff') + '<circle cx="' + f1(-r * .35) + '" cy="' + f1(-r * .4) + '" r="' + f1(r * .18) + '" fill="#fff" opacity=".6"/></g>';
  // the runner, seen from behind (o.ghost: the run is over)
  const runner = (x, y, s, o) => { o = o || {}; const body = o.ghost ? CYAN : '#f4efff', hood = o.ghost ? '#c9fbff' : '#7a5cff';
    return '<g transform="translate(' + P(x, y) + ') scale(' + s + ')"><g' + (o.cls ? ' class="' + o.cls + '"' : '') + ' opacity="' + (o.ghost ? .75 : 1) + '"><ellipse cy="24" rx="14" ry="4" fill="' + INK + '" opacity=".5"/>' +
      (o.ghost ? '<path d="M-12 18V-4A12 12 0 0 1 12 -4V18L8 14L4 18L0 14L-4 18L-8 14Z" fill="' + body + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/><circle cx="-4" cy="-2" r="2" fill="' + INK + '"/><circle cx="4" cy="-2" r="2" fill="' + INK + '"/>'
        : '<path d="M-6 12L-9 24M6 12L9 24" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><path d="M-6 12L-9 24M6 12L9 24" stroke="#4b3d78" stroke-width="3.4" stroke-linecap="round"/>' +
          '<rect x="-10" y="-6" width="20" height="20" rx="8" fill="' + hood + '" stroke="' + INK + '" stroke-width="2.4"/><circle cy="-12" r="9" fill="' + hood + '" stroke="' + INK + '" stroke-width="2.4"/><path d="M-5 -16Q0 -20 5 -16" stroke="#fff" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/>') + '</g></g>'; };
  const starD = (cx, cy, s) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? s * .42 : s; d += (i ? 'L' : 'M') + P(cx + q * Math.cos(a), cy + q * Math.sin(a)); } return d + 'Z'; };
  const spark = (x, y, s, c) => '<path d="' + starD(x, y, s) + '" fill="' + (c || '#fff3b0') + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>';
  const pent = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  const finger = '<g><circle r="13" fill="#fff" opacity=".25" class="tap"/><g transform="rotate(-22)"><rect x="-12" y="18" width="28" height="30" rx="11" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="-6.5" y="-2" width="13" height="34" rx="6.5" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M-3 4h6" stroke="#cfc8dc" stroke-width="2" stroke-linecap="round"/></g></g>';
  // the room in perspective: ceiling, walls and floor converge on a back wall (x 70..230, y 40..170)
  const room = (hue) => '<rect width="300" height="250" fill="' + INK + '"/>' +
    '<path d="M0 0H300L230 40H70Z" fill="#1d1630"/><path d="M0 0L70 40V170L0 250Z" fill="' + WALL_D + '"/><path d="M300 0L230 40V170L300 250Z" fill="#231b35"/>' +
    '<path d="M0 250L70 170H230L300 250Z" fill="#14101f"/>' + [0, 1, 2, 3].map(i => '<path d="M' + P(70 + i * 53, 170) + 'L' + P(i * 100, 250) + '" stroke="' + STONE + '" stroke-width="1.5" opacity=".7"/>').join('') +
    '<path d="M20 230H280M42 205H258M58 186H242" stroke="' + STONE + '" stroke-width="1.5" opacity=".6"/>' +
    '<rect x="70" y="40" width="160" height="130" fill="' + (hue || WALL) + '" stroke="' + INK + '" stroke-width="3"/>';
  const mural = (cx, cy, R, cols, q) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + f1(R + 12) + '" fill="' + WALL_D + '" stroke="' + GOLD + '" stroke-width="2.4"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + f1(R * .55) + '" fill="' + INK + '" stroke="' + GOLD + '" stroke-width="2"/>' +
    (q ? '<text x="' + cx + '" y="' + f1(cy + R * .22) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + f1(R * .6) + '" fill="' + GOLD + '">?</text>' : '') +
    pent(cx, cy, R).map((p, i) => gem(cols[i], p[0], p[1], R * .32)).join('');
  const fuse = (x, y, w, f, cls) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="9" rx="4.5" fill="' + INK + '" stroke="#4b3d78" stroke-width="1.6"/>' +
    '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + f1((w - 4) * f) + '" height="5" rx="2.5" fill="' + (f > .5 ? MINT : f > .25 ? GOLD : RED) + '"' + (cls ? ' class="' + cls + '"' : '') + '/>' +
    spark(x + 2 + (w - 4) * f, y + 4.5, 6, '#ffb04a');
  const MOTION = '.tap{animation:tp 2.8s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes tp{0%{transform:scale(.4);opacity:.6}20%{transform:scale(1.6);opacity:0}100%{opacity:0}}' +
    '.bob{animation:bob 1.2s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-3px)}}' +
    '.burn{animation:burn 4s linear infinite;transform-box:fill-box;transform-origin:0 50%}@keyframes burn{from{transform:scaleX(1)}to{transform:scaleX(.08)}}' +
    '.pl{animation:pl 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes pl{50%{transform:scale(1.08)}}';
  const svg = (inner, css, bare) => '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg"><style>@media (prefers-reduced-motion: no-preference){' + MOTION + (css || '') + '}</style>' + (bare ? '' : room()) + inner + '</svg>';
  const RIM = [0, 1, 0, 2, 3];

  // ---- title: a room, the mural of the rim with the hole's "?", three doors, the runner about to sprint, the fuse burning
  const titleSvg = svg(mural(150, 92, 30, RIM, true) + fuse(84, 18, 132, 1, 'burn') +
    door(0, 98, 150, 20, { pair: [0, 1] }) + door(3, 150, 146, 20, { pair: [2, 3], glow: .3, cls: 'pl' }) + door(1, 202, 150, 20, { pair: [1, 3] }) +
    runner(150, 212, 1.1, { cls: 'bob' }));

  // ---- how to play: one picture and one short sentence each
  const p1 = svg(mural(150, 100, 38, RIM, true) + '<g transform="translate(' + P(pent(150, 100, 38)[1][0], pent(150, 100, 38)[1][1]) + ')"><path d="M-9 -9L9 9M9 -9L-9 9" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M-9 -9L9 9M9 -9L-9 9" stroke="' + RED + '" stroke-width="4" stroke-linecap="round"/></g>' +
    runner(150, 212, 1));
  const p2 = svg(mural(150, 84, 26, RIM, true) + '<circle cx="' + f1(pent(150, 84, 26)[0][0]) + '" cy="' + f1(pent(150, 84, 26)[0][1]) + '" r="11" fill="none" stroke="#fff" stroke-width="3" class="pl"/>' +
    door(0, 112, 150, 24, { pair: [0, 1], glow: .35 }) + door(3, 196, 150, 22, { pair: [2, 3] }) + '<g transform="translate(124 160)">' + finger + '</g>' + runner(150, 214, .9));
  const p3 = svg(fuse(60, 26, 180, .8, 'burn') + '<g class="pf"><text x="226" y="70" text-anchor="middle" font-family="' + FONT + '" font-size="22" fill="' + MINT + '" stroke="' + INK + '" stroke-width="5" paint-order="stroke">+1s</text></g>' +
    door(1, 110, 148, 22, { pair: [1, 2] }) + door(0, 190, 148, 22, { pair: [0, 3] }) + runner(150, 212, 1, { cls: 'bob' }),
    '.pf{animation:pf 2s ease-out infinite}@keyframes pf{0%,40%{transform:translateY(10px);opacity:0}55%{opacity:1}100%{transform:translateY(-12px);opacity:0}}');
  const p4 = svg(runner(110, 196, 1, { ghost: true, cls: 'bob' }) +
    '<path d="M150 190Q200 120 238 160" fill="none" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M150 190Q200 120 238 160" fill="none" stroke="' + CYAN + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="7 7"/>' +
    '<path d="M228 150L242 164L224 168Z" fill="' + CYAN + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<g transform="translate(150 100)"><circle r="30" fill="' + WALL_D + '" stroke="' + CYAN + '" stroke-width="3" stroke-dasharray="6 5"/><text y="9" text-anchor="middle" font-family="' + FONT + '" font-size="26" fill="' + CYAN + '">1</text></g>');
  const p5 = svg('<g class="ry">' + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return '<path d="M' + P(150 + Math.cos(a) * 44, 96 + Math.sin(a) * 44) + 'L' + P(150 + Math.cos(a) * 58, 96 + Math.sin(a) * 58) + '" stroke="' + GOLD + '" stroke-width="5" stroke-linecap="round"/>'; }).join('') + '</g>' +
    '<circle cx="150" cy="96" r="42" fill="' + WALL_D + '" stroke="' + GOLD + '" stroke-width="2.4"/><circle cx="150" cy="96" r="18" fill="' + COL[3] + '" stroke="' + INK + '" stroke-width="2.4"/><g transform="translate(150 96)">' + icon24(3, 1.1, '#fff') + '</g>' +
    pent(150, 96, 32).map((p, i) => gem([0, 1, 0, 1, 2][i], p[0], p[1], 9)).join('') + runner(150, 206, 1, { cls: 'bob' }) + spark(84, 60, 8, GOLD) + spark(220, 70, 7, MINT) + spark(226, 190, 8, GOLD),
    '.ry{animation:ry 1.6s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ry{0%{transform:scale(.7);opacity:0}30%{opacity:1}100%{transform:scale(1.25);opacity:0}}');
  const I = [
    { title: 'Find the goal room', text: 'The mural shows the hole and its ring. Reach a room where the ring has 3 elements.', svg: p1 },
    { title: 'A door is a swap', text: 'Tap a door to light its chain, tap again to run through.', svg: p2 },
    { title: 'Beat the fuse', text: 'The fuse burns while you choose. Every room you reach adds time.', svg: p3 },
    { title: 'Run it again', text: 'Burn out and a new run starts at the start. Same doors, same order.', svg: p4 },
    { title: 'Fill!', text: 'Step into the goal room and the hole fills.', svg: p5 },
  ];

  // ---- icon, logo and card (SKIN-SPEC 13): ids carry respawn-ic-, respawn-lg-, respawn-cd-
  function logoArt(p) {
    const T = (x, y, s, fill) => '<text x="' + (x + 3) + '" y="' + (y + 4) + '" font-family="' + FONT + '" font-size="' + s + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="8" stroke-linejoin="round" paint-order="stroke">RESPAWN</text>' +
      '<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-size="' + s + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round" paint-order="stroke">RESPAWN</text>';
    return '<defs><linearGradient id="' + p + '-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="' + CYAN + '"/><stop offset="1" stop-color="#7a5cff"/></linearGradient></defs>' +
      door(0, 24, 44, 17, { pair: [0, 1] }) + T(48, 54, 30, 'url(#' + p + '-t)') + spark(228, 18, 5, GOLD);
  }
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + logoArt('respawn-lg') + '</svg>';
  const icon = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<radialGradient id="respawn-ic-bg" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#5a3fa0"/><stop offset=".6" stop-color="' + WALL + '"/><stop offset="1" stop-color="' + INK + '"/></radialGradient></defs>' +
    '<rect width="120" height="120" rx="26" fill="url(#respawn-ic-bg)"/><path d="M0 96L26 80H94L120 96V120H0Z" fill="#14101f"/>' +
    door(1, 60, 58, 32, { pair: [1, 0], glow: .3, glowCol: CYAN }) + runner(60, 90, .9) +
    '<path d="M16 34Q22 20 36 14" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/></svg>';
  const card = '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="respawn-cd-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + INK + '" stop-opacity="0"/><stop offset=".35" stop-color="' + INK + '" stop-opacity=".9"/><stop offset="1" stop-color="#05030a"/></linearGradient></defs>' +
    '<g transform="scale(.8 .92)">' + room() + mural(150, 92, 28, RIM, true) + fuse(84, 18, 132, .55) +
    door(0, 98, 152, 20, { pair: [0, 1] }) + door(3, 150, 148, 20, { pair: [2, 3], glow: .35 }) + door(1, 202, 152, 20, { pair: [1, 3] }) + runner(150, 210, 1.1) + '</g>' +
    '<rect y="230" width="240" height="90" fill="#05030a"/>' +
    // the player's own tree under the room: small pies of the rim, the walk in cyan, a collapsed room
    '<path d="M120 238V254M120 254L80 270M120 254L160 270M160 270L140 286M160 270L184 286" stroke="' + CYAN + '" stroke-width="3" stroke-linecap="round"/>' +
    [[120, 238, 0], [120, 254, 1], [80, 270, 2], [160, 270, 3], [140, 286, 0], [184, 286, 1]].map(([x, y, e]) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + COL[e] + '" stroke="' + INK + '" stroke-width="2"/>').join('') +
    '<path d="M76 266L84 274M84 266L76 274" stroke="' + RED + '" stroke-width="2.6" stroke-linecap="round"/><circle cx="184" cy="286" r="10" fill="none" stroke="#fff" stroke-width="2.4"/>' +
    '<rect y="226" width="240" height="94" fill="url(#respawn-cd-f)" opacity=".55"/><path d="M0 232H240" stroke="' + CYAN + '" stroke-opacity=".45" stroke-width="2"/>' +
    '<g transform="translate(0 244)">' + logoArt('respawn-cd-lg') + '</g></svg>';

  // ---- the level map: dungeon floors joined by corridors, torches, doors as level markers
  const ZT = { cove: '#3d6f8e', beach: '#8a6a3a', town: '#3f7a4a', harbour: '#7a5a3a', forest: '#2f6a3a', cape: '#5a6578', reef: '#8a4a5a', cave: '#4a3a78', volcano: '#8a3a24' };
  const torch = s => '<g transform="scale(' + s + ')"><rect x="-2.5" y="-2" width="5" height="14" rx="1.5" fill="#6b3d00" stroke="' + INK + '" stroke-width="1.6"/>' +
    '<path d="M0 -14C5 -8 5 -4 0 -2C-5 -4 -5 -8 0 -14Z" fill="#ffb04a" stroke="' + INK + '" stroke-width="1.6"/><path d="M0 -9C2 -6 2 -4 0 -3C-2 -4 -2 -6 0 -9Z" fill="#fff3b0"/></g>';
  const crate = s => '<g transform="scale(' + s + ')"><rect x="-9" y="-9" width="18" height="18" rx="2" fill="#a8622e" stroke="' + INK + '" stroke-width="2"/><path d="M-9 -9L9 9M9 -9L-9 9" stroke="' + INK + '" stroke-width="1.6" opacity=".6"/></g>';
  const levelMap = {
    bg: '#0d0816',
    defs: '<radialGradient id="respawnLmGlow"><stop offset="0" stop-color="#7a5cff" stop-opacity=".18"/><stop offset="1" stop-color="#7a5cff" stop-opacity="0"/></radialGradient>',
    backdrop(H, rnd) {
      let s = '';
      for (let k = 0; k * 600 < H + 300; k++) s += '<circle cx="' + f1(60 + rnd(k, 3) * 280) + '" cy="' + (k * 600 + 280) + '" r="260" fill="url(#respawnLmGlow)"/>';
      for (let y = 0; y < H; y += 40) for (let x = (y / 40) % 2 ? -30 : 0; x < 400; x += 60) if (rnd(x, y) < .35) s += '<rect x="' + x + '" y="' + y + '" width="56" height="36" rx="3" fill="#160f24" stroke="#1f1730" stroke-width="2"/>';
      return '<g>' + s + '</g>';
    },
    zone(z) {
      const c = ZT[z.theme] || ZT.town;
      return '<g><path d="' + z.path + '" transform="translate(4 7)" fill="#000" opacity=".5"/><path d="' + z.path + '" fill="' + WALL + '" stroke="' + INK + '" stroke-width="7"/>' +
        '<path d="' + z.path + '" fill="' + c + '" fill-opacity=".28" stroke="' + (z.boss ? RED : CYAN) + '" stroke-opacity=".6" stroke-width="2.5" stroke-dasharray="10 6"/></g>';
    },
    decor(theme, r, r2) {        // about half the spots stay empty
      if (r < .14) return torch(.9 + r2 * .4);
      if (r < .24) return crate(.8 + r2 * .4);
      if (r < .32) return gem(Math.floor(r2 * 4) % 4, 0, 0, 6 + r2 * 3);
      if (r < .38) return runner(0, -4, .45, { ghost: true });
      return '';
    },
    sign(label, w) {             // a neon sign
      return '<rect x="2" y="4" width="' + w + '" height="30" rx="7" fill="#000" opacity=".5"/><rect width="' + w + '" height="30" rx="7" fill="' + WALL_D + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<rect x="3" y="3" width="' + (w - 6) + '" height="24" rx="5" fill="none" stroke="' + CYAN + '" stroke-width="1.6" opacity=".7"/>' +
        '<text x="' + f1(w / 2) + '" y="20" text-anchor="middle" font-family="' + FONT + '" font-size="11" fill="' + CYAN + '">' + label + '</text>';
    },
    road: { todo: [INK, '#2c2440', '#4b3d78'], done: [INK, '#3a2a5a', CYAN], widths: [20, 13, 4], dash: '8 6', cap: 'butt' },
    node(state, num, e, boss) {
      const R = boss ? 33 : 29, fs = num.length > 3 ? 11 : num.length > 2 ? 13 : num.length > 1 ? 16 : 20;
      const txt = c => '<text y="' + f1(R * .2 + fs * .36) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs + '" fill="' + c + '" stroke="' + INK + '" stroke-width="3.5" paint-order="stroke">' + num + '</text>';
      if (state === 'locked') return '<path d="' + doorD(3, R * .9) + '" transform="translate(2 4)" fill="#000" opacity=".55"/><path d="' + doorD(3, R * .9) + '" fill="#3a3150" stroke="' + INK + '" stroke-width="3"/>' +
        '<rect x="-7" y="0" width="14" height="11" rx="2" fill="#9a8cc8" stroke="' + INK + '" stroke-width="2"/><path d="M-4 0v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#9a8cc8" stroke-width="2.4"/>';
      const k = e >= 0 ? e : 0, beaten = state === 'beaten', d = doorD(k, R * .9);
      return (state === 'current' ? '<ellipse cy="4" rx="' + (R + 6) + '" ry="' + (R + 9) + '" fill="none" stroke="' + CYAN + '" stroke-width="3" stroke-dasharray="5 5"/>' : '') +
        '<path d="' + d + '" transform="translate(2 4)" fill="#000" opacity=".55"/><path d="' + d + '" fill="' + (beaten ? GOLD_D : DK[k]) + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="' + doorD(k, R * .66) + '" transform="translate(0 ' + f1(R * .24) + ')" fill="' + (beaten ? GOLD : COL[k]) + '"/>' +
        '<ellipse cx="' + f1(-R * .3) + '" cy="' + f1(-R * .5) + '" rx="' + f1(R * .18) + '" ry="' + f1(R * .09) + '" transform="rotate(-35 ' + P(-R * .3, -R * .5) + ')" fill="#fff" opacity=".55"/>' + txt('#fff');
    },
    start() {                    // the spawn portal
      return '<ellipse rx="20" ry="9" fill="#000" opacity=".5" transform="translate(2 4)"/><ellipse rx="20" ry="9" fill="#2a1a4a" stroke="' + INK + '" stroke-width="2.6"/><ellipse rx="14" ry="5.5" fill="none" stroke="' + CYAN + '" stroke-width="2.4"/>' +
        runner(0, -16, .55) + '<text y="26" text-anchor="middle" font-family="' + FONT + '" font-size="11" fill="' + CYAN + '" stroke="' + INK + '" stroke-width="3" paint-order="stroke">START</text>';
    },
    pin() {                      // a ghost pin
      return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="' + CYAN + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<circle cx="-6" cy="-5" r="3" fill="' + INK + '"/><circle cx="6" cy="-5" r="3" fill="' + INK + '"/><path d="M-5 5Q0 8 5 5" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="-8" cy="-14" rx="4" ry="2.2" fill="#fff" opacity=".8"/>';
    },
  };

  FTH_SKINS.register({
    id: 'respawn', name: 'Respawn', ic: '👻', blurb: 'run the rooms, beat the fuse',
    src: 'lab/respawn.html', hud: 'compact', needs: ['cells'],
    coin: { name: 'wisp', plural: 'wisps', glyph: '🕯️', value: 50, pitch: 1.5,
      colors: { main: CYAN, edge: '#7a5cff' },
      svg: FTH_SKINS.coinArt('<path d="M0 -12C6 -6 9 -1 9 4A9 8 0 0 1 -9 4C-9 -1 -5 -4 -3 -8C-2 -4 0 -3 1 -4C2 -7 1 -10 0 -12Z" transform="translate(1.2 1.8)" fill="#1c1640" opacity=".4"/>' +
        '<path d="M0 -12C6 -6 9 -1 9 4A9 8 0 0 1 -9 4C-9 -1 -5 -4 -3 -8C-2 -4 0 -3 1 -4C2 -7 1 -10 0 -12Z" fill="#7a5cff" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M0 -7C4 -3 6 0 6 4A6 5.4 0 0 1 -6 4C-6 0 -3 -2 -2 -4C-1 -2 0 -2 .6 -3C1 -5 .6 -6 0 -7Z" fill="' + CYAN + '"/>' +
        '<circle cx="-2.4" cy="3" r="1.4" fill="#1c1640"/><circle cx="2.4" cy="3" r="1.4" fill="#1c1640"/><ellipse cx="-3.6" cy="-1.6" rx="1.6" ry="1" fill="#fff" opacity=".85"/>') },
    fonts: ['https://fonts.googleapis.com/css2?family=Bungee&display=swap'],
    theme: {
      '--sk-bg': 'radial-gradient(ellipse at 50% 20%, #3a2a6a 0%, #1a1428 50%, #0a0712 100%)',
      '--sk-ink': '#f4efff',
      '--sk-accent': CYAN,
      '--sk-card': 'linear-gradient(180deg, #2c2440, #120c1c)',
      '--sk-card-ink': '#f4efff',
      '--sk-hud': 'linear-gradient(180deg, rgba(44,36,64,.95), rgba(13,8,22,.92))',
      '--sk-btn': 'linear-gradient(180deg, #ffe07a, #ffb04a)',
      '--sk-btn-ink': '#2a1a00',
      '--sk-btn-shadow': '#6b3d00',
      '--sk-font': FONT,
      '--sk-radius': '14px',
      '--sk-chip': 'linear-gradient(#2c2440, #1a1428)',
      '--sk-chip-ink': '#f4efff',
      '--sk-edge': INK,
      '--sk-btn2': 'linear-gradient(180deg, #6a52c8, #3d3160)',
      '--sk-btn2-ink': '#ffffff',
      '--sk-coin': 'linear-gradient(180deg, #c9fbff, #7a5cff)',
      '--sk-star-on': GOLD, '--sk-star-edge': GOLD_D, '--sk-star-off': '#9a8cc8', '--sk-star-off-edge': '#c9bdf0',
      '--sk-ctl': '#2c2440', '--sk-ctl-ink': '#f4efff', '--sk-ctl-edge': INK,
    },
    css: '.btn3d{letter-spacing:.03em}.coins{color:' + INK + '}.tl .tin{transition:transform .12s}.tl.lit .tin{transform:scale(1.12)}.tl.glow .tin{filter:drop-shadow(0 0 6px #9ff3ff)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: '👻', board: 'radial-gradient(ellipse at 50% 30%, #2c2440, #0a0712 80%)', line: CYAN,
      games: ['hop', 'snake', 'chain', 'pop'], intro: 'zoom',
      // one doorway per element (arch shape by element), the element icon on its leaf
      tile(x, y, r, e, k) {
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + door(e, 0, 0, r * .86, {}) + '</g></g>';
      },
    },
    map: {
      sea: ['#3a2a5a', '#342652', '#2e214a', '#281d42', '#22193a', '#1d1532', '#18112a', '#130d22', '#0e091a'],
      seaX: '#0a0712', fog: '#05030a', unknown: '#5a4a78',
      ramp: [MINT, '#ffe066', '#ff9a3c', RED],
      grey: '#9a8cc8', route: CYAN, ink: 'rgba(244,239,255,.85)',
      cell(path, x, y, r) {      // a square room
        const s = r * .8; path.moveTo(x - s, y - s); path.lineTo(x + s, y - s); path.lineTo(x + s, y + s); path.lineTo(x - s, y + s); path.closePath();
      },
    },
    levelMap,
    words: { win: 'Goal room!', perfect: 'Perfect run!', par: 'Par {par} doors: go for ★★★', chart: 'COLOURING SPACE' },
    eggs: [
      { id: 'boo', on: 'title', taps: 5, run(fx) { if (!fx) return; fx.burst && (fx.burst('👻', .3, .45), fx.burst('🚪', .5, .36), fx.burst('👻', .7, .45)); fx.sound && fx.sound('whoosh'); } },
      { id: 'lucky-run', on: 'win', p: .1, run(fx) { if (!fx) return; fx.burst && fx.burst('🕯️', .5, .3); fx.sound && fx.sound('chime'); } },
    ],
  });
})();
