// Rat Maze: the swap graph as a 3/4-view lab maze. See SKIN-SPEC.md and lab/maze.html.
// Art: chunky walled rooms (wall top, wall face, cream floor), a cartoon lab rat, glowing cheese; thick dark outline,
// top-left light and offset shadows, the Islands way.
(function () {
  const INK = '#2a241c', CREAM = '#f6efe2', WOOD = '#c4a574', WOOD2 = '#8d6840', GOLD = '#ffd36a', CHEESE = '#e7a91c';
  const OUT = '#24180c', RAT = '#f4eee6', PINK = '#ff9fb8';
  const C = ['#ef5a3c', '#3d8fe8', '#e8c547', '#4caf50'];
  const f1 = n => Math.round(n * 10) / 10, f2 = n => Math.round(n * 100) / 100;
  const RM = css => '@media (prefers-reduced-motion: no-preference){' + css + '}';
  const FONT = "'Baloo 2', ui-rounded, 'Arial Rounded MT Bold', system-ui, sans-serif";
  const NS = ' xmlns="http://www.w3.org/2000/svg"';
  const svg = (inner, style) => '<svg viewBox="0 0 300 250"' + NS + '>' + (style ? '<style>' + style + '</style>' : '') + inner + '</svg>';
  const big = (inner, k) => '<g transform="translate(150 118) scale(' + (k || 1.3) + ') translate(-150 -118)">' + inner + '</g>';
  // CSS animates an inner group, so it never overrides the translate
  const at = (x, y, inner, cls, s) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')' + (s ? ' scale(' + s + ')' : '') + '">' + (cls ? '<g class="' + cls + '">' + inner + '</g>' : inner) + '</g>';

  // a walled room: shadow, wall face, wall top, cream floor with its five rim tiles
  function room(x, y, w, h, o) {
    o = o || {}; const fl = o.floor || CREAM, t = o.tiles;
    let s = '<rect x="' + (x + 4) + '" y="' + (y + 10) + '" width="' + w + '" height="' + h + '" rx="7" fill="#000" opacity=".35"/>' +
      '<rect x="' + x + '" y="' + (y + 6) + '" width="' + w + '" height="' + h + '" rx="7" fill="#6b4a2a" stroke="' + OUT + '" stroke-width="3"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7" fill="' + (o.wall || '#d9e9f2') + '" stroke="' + OUT + '" stroke-width="3"/>' +
      '<rect x="' + (x + 6) + '" y="' + (y + 6) + '" width="' + (w - 12) + '" height="' + (h - 12) + '" rx="4" fill="' + fl + '" stroke="' + OUT + '" stroke-opacity=".5" stroke-width="1.5"/>' +
      '<rect x="' + (x + 6) + '" y="' + (y + 6) + '" width="' + (w - 12) + '" height="5" rx="2" fill="#000" opacity=".12"/>' +
      '<path d="M' + (x + 5) + ' ' + (y + 3) + 'H' + (x + w * .45) + '" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>';
    if (t) { const tw = Math.min(10, (w - 22) / 5); t.forEach((e, i) => { s += '<rect x="' + f1(x + w / 2 - tw * 2.5 - 2 + i * (tw + 1)) + '" y="' + f1(y + h - 12 - tw) + '" width="' + f1(tw) + '" height="' + f1(tw) + '" rx="2" fill="' + C[e] + '" stroke="' + OUT + '" stroke-width="1.2"/>'; }); }
    return s;
  }
  // a wooden corridor between two room centres
  const corridor = (x1, y1, x2, y2, glow) => (glow ? '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + GOLD + '" stroke-width="24" stroke-linecap="round" opacity=".35"/>' : '') +
    '<path d="M' + (x1 + 3) + ' ' + (y1 + 6) + 'L' + (x2 + 3) + ' ' + (y2 + 6) + '" stroke="#000" stroke-width="16" stroke-linecap="round" opacity=".3"/>' +
    '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + OUT + '" stroke-width="16" stroke-linecap="round"/>' +
    '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + WOOD + '" stroke-width="10" stroke-linecap="round"/>' +
    '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="#e8d3a8" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7"/>';
  // the lab rat, facing right, feet at (0, 0)
  function rat(o) {
    o = o || {};
    return '<ellipse cx="0" cy="2" rx="20" ry="5" fill="#000" opacity=".3"/>' +
      '<path d="M-16 -6C-30 -6 -34 4 -26 8" fill="none" stroke="' + OUT + '" stroke-width="5" stroke-linecap="round"/><path d="M-16 -6C-30 -6 -34 4 -26 8" fill="none" stroke="' + PINK + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M-19 -2C-21 -18 -6 -24 6 -20C14 -18 16 -10 14 -2Z" fill="' + RAT + '" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M-14 -4C-12 -8 -4 -8 4 -6" fill="none" stroke="#d6cabb" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M6 -20C16 -24 26 -16 28 -9C29 -6 26 -4 22 -4H10Z" fill="' + RAT + '" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<circle cx="9" cy="-22" r="6" fill="' + RAT + '" stroke="' + OUT + '" stroke-width="2.4"/><circle cx="9" cy="-22" r="3.2" fill="' + PINK + '"/>' +
      '<circle cx="19" cy="-14" r="2.4" fill="' + OUT + '"/><circle cx="19.8" cy="-14.8" r=".8" fill="#fff"/>' +
      '<circle cx="28" cy="-8" r="2.4" fill="' + PINK + '" stroke="' + OUT + '" stroke-width="1.4"/>' +
      '<path d="M25 -6L34 -4M25 -8L34 -9" stroke="' + OUT + '" stroke-width="1" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M-10 -2v3M4 -2v3" stroke="' + PINK + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<ellipse cx="-6" cy="-15" rx="5" ry="2.2" transform="rotate(-20 -6 -15)" fill="#fff"/>';
  }
  // a cheese wedge, base centre at (0, 0), about 34 wide
  function cheese(o) {
    o = o || {};
    return (o.glow ? '<circle cy="-10" r="30" fill="' + GOLD + '" opacity=".25"/><circle cy="-10" r="20" fill="' + GOLD + '" opacity=".3"/>' : '') +
      '<path d="M-17 4H17L11 -22H-7Z" fill="#000" opacity=".3" transform="translate(3 4)"/>' +
      '<path d="M-17 4H17V-6L-7 -22Z" fill="' + CHEESE + '" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M-17 4V-4L-7 -22L17 -6V-2Z" fill="' + GOLD + '"/>' +
      '<path d="M-17 4H17V-6L-7 -22Z" fill="none" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M-17 -4L17 -6" stroke="' + OUT + '" stroke-width="1.6"/>' +
      '<ellipse cx="-4" cy="-10" rx="3.4" ry="2.6" fill="#c98a10" stroke="' + OUT + '" stroke-width="1.2"/><ellipse cx="6" cy="-1" rx="2.4" ry="2" fill="#c98a10" stroke="' + OUT + '" stroke-width="1.2"/><circle cx="-10" cy="0" r="1.8" fill="#c98a10"/>' +
      '<path d="M-6 -18L-12 -9" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>';
  }
  const finger = (x, y, cls) => at(x, y, '<g transform="rotate(-18)">' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" transform="translate(2.2 4)" fill="#000" opacity=".35"/>' +
    '<path d="M-4.5 2V-9a4.5 4.5 0 0 1 9 0V3l7 -1.2a4.4 4.4 0 0 1 4.6 4.4V14c0 8 -5.6 13 -13 13h-3c-5.5 0 -9 -3.4 -11 -8l-3.6 -8.6a3.8 3.8 0 0 1 6.6 -3.6Z" fill="#fff" stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round"/></g>', cls);
  const door = (x, y, cls) => at(x, y, '<rect x="-8" y="-8" width="16" height="16" rx="4" fill="' + GOLD + '" stroke="' + OUT + '" stroke-width="2.4"/><path d="M-3 -4L2 0L-3 4" fill="none" stroke="' + OUT + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>', cls);
  const spark = (x, y, r, c) => '<path transform="translate(' + x + ' ' + y + ') scale(' + r + ')" d="M0 -1Q.15 -.15 1 0Q.15 .15 0 1Q-.15 .15 -1 0Q-.15 -.15 0 -1Z" fill="' + (c || '#fff') + '"/>';
  const label = (x, y, t, fs, c) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="' + FONT + '" font-weight="800" font-size="' + (fs || 26) + '" fill="' + (c || GOLD) + '" stroke="' + OUT + '" stroke-width="6" stroke-linejoin="round" paint-order="stroke">' + t + '</text>';
  const slab = (x, y, w, h) => '<rect x="' + (x + 5) + '" y="' + (y + 14) + '" width="' + w + '" height="' + h + '" rx="18" fill="#000" opacity=".35"/>' +
    '<rect x="' + x + '" y="' + (y + 9) + '" width="' + w + '" height="' + h + '" rx="18" fill="#5a3a1c" stroke="' + OUT + '" stroke-width="3.5"/>' +
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="18" fill="#a77a48" stroke="' + OUT + '" stroke-width="3.5"/>' +
    '<rect x="' + (x + 8) + '" y="' + (y + 8) + '" width="' + (w - 16) + '" height="' + (h - 16) + '" rx="12" fill="#b88a55"/>' +
    '<path d="M' + (x + 14) + ' ' + (y + 5) + 'H' + (x + w * .5) + '" stroke="#e6c79a" stroke-width="3" stroke-linecap="round"/>';
  const bench = '<defs><radialGradient id="mazeIb" cx=".5" cy=".1" r=".9"><stop offset="0" stop-color="#3a4258"/><stop offset="1" stop-color="#14161c"/></radialGradient></defs><rect width="300" height="250" fill="url(#mazeIb)"/>';

  // ---- title art: five rooms (the rim) round the dark hole room; the rat trots, the cheese glows in the middle ----
  const R5 = [[150, 42], [234, 92], [204, 178], [96, 178], [66, 92]];
  const titleSvg = svg(slab(24, 22, 252, 208) +
    R5.map(p => corridor(p[0], p[1], 150, 118)).join('') + corridor(150, 42, 234, 92) + corridor(66, 92, 150, 42) +
    R5.map((p, i) => room(p[0] - 28, p[1] - 22, 56, 44, { floor: ['#ffd9cf', '#d3e6ff', '#fff1bf', '#d6f2d2', '#d3e6ff'][i], tiles: [[0, 1, 2, 3, 1][i]] })).join('') +
    room(118, 92, 64, 52, { floor: '#2e2a26', wall: '#c9d6de' }) + at(150, 132, cheese({ glow: 1 }), 'maze-glow', 1.25) +
    at(150, 58, rat(), 'maze-trot', 1.15) + spark(40, 34, 6, GOLD) + spark(266, 210, 5),
    '.maze-trot,.maze-glow{transform-box:fill-box;transform-origin:50% 100%}' +
    RM('.maze-trot{animation:mazeTrot 2.6s ease-in-out infinite}@keyframes mazeTrot{0%,100%{transform:translateX(-10px)}10%,60%{transform:translateX(-10px) translateY(0)}20%{transform:translateX(-4px) translateY(-6px)}30%{transform:translateX(2px)}40%{transform:translateX(8px) translateY(-6px)}50%{transform:translateX(12px)}}' +
      '.maze-glow{animation:mazeGlow 1.8s ease-in-out infinite}@keyframes mazeGlow{50%{transform:scale(1.08)}}'));

  // ---- how to play: one short sentence each, the pictures teach ----
  const I = [
    { title: 'Find the cheese', text: 'Every door is a swap: walk the rat to the cheese.',
      svg: svg(bench + big(corridor(62, 126, 150, 126, 1) + corridor(150, 126, 238, 126) +
        room(28, 100, 68, 52, { tiles: [0, 1, 2, 3, 1] }) + room(116, 100, 68, 52, { tiles: [0, 1, 0, 3, 1] }) + room(204, 100, 68, 52, { floor: '#fff3c4', tiles: [0, 1, 0, 1, 1] }) +
        at(62, 132, rat(), 'maze-run', .85) + at(238, 132, cheese({ glow: 1 })), 1.25) + label(150, 222, '🧀 2', 30),
        '.maze-run{transform-box:fill-box;transform-origin:50% 100%}' + RM('.maze-run{animation:mazeRun 3s ease-in-out infinite}@keyframes mazeRun{0%,15%{transform:none}45%,60%{transform:translateX(102px)}90%,100%{transform:translateX(204px)}}')) },
    { title: 'Tap a door', text: 'Tap a glowing door and the rat scurries through.',
      svg: svg(bench + big(room(94, 68, 112, 96, { tiles: [0, 1, 2, 3, 1] }) + door(150, 70, 'maze-pulse') + door(204, 116, 'maze-pulse maze-p2') + door(96, 116, 'maze-pulse maze-p3') +
        at(150, 140, rat(), 'maze-hop') + finger(206, 122, 'maze-tap'), 1.45),
        '.maze-pulse,.maze-hop,.maze-tap{transform-box:fill-box;transform-origin:50% 50%}' +
        RM('.maze-pulse{animation:mazePu 1.2s ease-in-out infinite}.maze-p2{animation-delay:-.4s}.maze-p3{animation-delay:-.8s}@keyframes mazePu{50%{transform:scale(1.25)}}' +
          '.maze-hop{animation:mazeHop 1.6s ease-in-out infinite}@keyframes mazeHop{0%,60%,100%{transform:none}75%{transform:translateY(-10px)}}' +
          '.maze-tap{animation:mazeTap 1.6s ease-in-out infinite}@keyframes mazeTap{0%,100%{transform:translate(10px,10px)}50%{transform:none}60%{transform:scale(.9)}}')) },
    { title: 'The floor', text: 'The floor tiles are the five pieces round the hole.',
      svg: svg(bench + room(60, 54, 180, 130, { floor: '#f6efe2' }) +
        [0, 1, 2, 3, 1].map((e, i) => at(98 + i * 26, 132, '<rect x="-11" y="-11" width="22" height="22" rx="5" fill="#000" opacity=".3" transform="translate(2 4)"/><rect x="-11" y="-11" width="22" height="22" rx="5" fill="' + C[e] + '" stroke="' + OUT + '" stroke-width="2.4"/><rect x="-7" y="-8" width="8" height="3" rx="1.5" fill="#fff" opacity=".7"/>', i === 2 ? 'maze-flip' : '')).join('') +
        label(150, 100, '4 → 3', 26),
        '.maze-flip{transform-box:fill-box;transform-origin:center}' + RM('.maze-flip{animation:mazeFlip 2.4s ease-in-out infinite}@keyframes mazeFlip{0%,40%{transform:none}55%{transform:scaleX(0)}70%,100%{transform:none}}')) },
    { title: 'Shortest walk', text: 'Reach the cheese in par steps for three stars.',
      svg: svg(bench + big(corridor(70, 120, 150, 120, 1) + corridor(150, 120, 230, 120, 1) +
        room(40, 96, 60, 48) + room(120, 96, 60, 48) + room(200, 96, 60, 48, { floor: '#fff3c4' }) + at(230, 126, cheese({ glow: 1 })) +
        label(110, 112, '1', 22, '#fff') + label(190, 112, '2', 22, '#fff'), 1.25) + label(150, 222, '★★★', 36)) },
  ];

  // ---- logo, icon, card (SKIN-SPEC section 13) ----
  const logoInner = fs => {
    const t = (extra, txt) => '<text x="120" y="56" text-anchor="middle" font-family="' + FONT + '" font-weight="800" font-size="' + fs + '"' + extra + '>' + txt + '</text>';
    return t(' fill="' + OUT + '" stroke="' + OUT + '" stroke-width="14" stroke-linejoin="round" transform="translate(0 5)"', 'Rat Maze') +
      t(' fill="' + GOLD + '" stroke="' + OUT + '" stroke-width="10" stroke-linejoin="round" paint-order="stroke"', 'Rat <tspan fill="' + CREAM + '">Maze</tspan>') +
      '<circle cx="62" cy="38" r="3" fill="#c98a10"/><circle cx="48" cy="44" r="2.2" fill="#c98a10"/>';
  };
  const logo = '<svg viewBox="0 0 240 80"' + NS + '>' + logoInner(50) + '</svg>';

  const icon = '<svg viewBox="0 0 120 120"' + NS + '><defs>' +
    '<radialGradient id="maze-ib" cx=".35" cy=".25" r="1"><stop offset="0" stop-color="#5d6fb8"/><stop offset=".55" stop-color="#2e3770"/><stop offset="1" stop-color="#151a38"/></radialGradient>' +
    '<radialGradient id="maze-ig" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + GOLD + '" stop-opacity=".8"/><stop offset="1" stop-color="' + GOLD + '" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="maze-ic"><rect width="120" height="120" rx="26"/></clipPath></defs><g clip-path="url(#maze-ic)">' +
    '<rect width="120" height="120" fill="url(#maze-ib)"/>' +
    '<path d="M8 20H40V44M60 8V30H92M112 40H84V64M8 64H30V96H52M70 112V88H100V70" fill="none" stroke="#7d8fd8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/>' +
    '<circle cx="60" cy="82" r="44" fill="url(#maze-ig)"/>' +
    // the rat peeking over the cheese
    '<circle cx="33" cy="34" r="16" fill="' + RAT + '" stroke="' + OUT + '" stroke-width="4"/><circle cx="33" cy="34" r="9" fill="' + PINK + '"/>' +
    '<circle cx="87" cy="34" r="16" fill="' + RAT + '" stroke="' + OUT + '" stroke-width="4"/><circle cx="87" cy="34" r="9" fill="' + PINK + '"/>' +
    '<ellipse cx="60" cy="56" rx="30" ry="26" fill="' + RAT + '" stroke="' + OUT + '" stroke-width="4"/>' +
    '<path d="M80 44C88 56 84 72 70 79C82 70 84 56 80 44Z" fill="#d6cabb"/>' +
    '<ellipse cx="48" cy="40" rx="8" ry="4" transform="rotate(-25 48 40)" fill="#fff"/>' +
    '<circle cx="49" cy="55" r="5.4" fill="' + OUT + '"/><circle cx="71" cy="55" r="5.4" fill="' + OUT + '"/><circle cx="50.8" cy="53" r="1.9" fill="#fff"/><circle cx="72.8" cy="53" r="1.9" fill="#fff"/>' +
    '<circle cx="40" cy="64" r="4" fill="' + PINK + '" opacity=".6"/><circle cx="80" cy="64" r="4" fill="' + PINK + '" opacity=".6"/>' +
    '<ellipse cx="60" cy="66" rx="6" ry="4.4" fill="' + PINK + '" stroke="' + OUT + '" stroke-width="2.4"/>' +
    '<path d="M50 68L30 64M50 71L31 73M70 68L90 64M70 71L89 73" stroke="' + OUT + '" stroke-width="2" stroke-linecap="round"/>' +
    // the cheese wedge in front
    '<path d="M12 104H108V84L46 64Z" fill="#000" opacity=".35" transform="translate(3 5)"/>' +
    '<path d="M12 104H108V84L46 64Z" fill="' + CHEESE + '"/><path d="M12 104V90L46 64L108 84V88Z" fill="' + GOLD + '"/>' +
    '<path d="M12 90L108 88" stroke="' + OUT + '" stroke-width="2.6"/>' +
    '<path d="M12 104H108V84L46 64L12 90Z" fill="none" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<ellipse cx="50" cy="78" rx="6" ry="3.6" fill="#c98a10" stroke="' + OUT + '" stroke-width="2"/><ellipse cx="78" cy="82" rx="4.6" ry="2.8" fill="#c98a10" stroke="' + OUT + '" stroke-width="2"/>' +
    '<ellipse cx="34" cy="98" rx="5" ry="3.4" fill="#b87a08"/><ellipse cx="88" cy="97" rx="3.6" ry="2.6" fill="#b87a08"/><ellipse cx="62" cy="99" rx="2.6" ry="2" fill="#b87a08"/>' +
    '<path d="M20 86L42 69" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>' +
    '<ellipse cx="44" cy="66" rx="7" ry="5" fill="' + RAT + '" stroke="' + OUT + '" stroke-width="3"/><ellipse cx="76" cy="73" rx="7" ry="5" fill="' + RAT + '" stroke="' + OUT + '" stroke-width="3"/>' +
    spark(102, 18, 6, GOLD) + spark(16, 54, 4, GOLD) +
    '<rect x="3" y="3" width="114" height="114" rx="23" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2.5"/></g>' +
    '<rect x="1" y="1" width="118" height="118" rx="25.5" fill="none" stroke="' + OUT + '" stroke-width="2.5"/></svg>';

  // card: rooms and corridors seen from above, the rat on its way, a glowing door, the cheese; the logo below
  const card = '<svg viewBox="0 0 240 320"' + NS + '><defs>' +
    '<radialGradient id="maze-cb" cx=".5" cy=".2" r=".9"><stop offset="0" stop-color="#3a4258"/><stop offset="1" stop-color="#101218"/></radialGradient>' +
    '<linearGradient id="maze-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101218" stop-opacity="0"/><stop offset=".5" stop-color="#101218" stop-opacity=".8"/><stop offset="1" stop-color="#101218"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="url(#maze-cb)"/>' + slab(10, 14, 220, 206) +
    corridor(56, 56, 120, 56) + corridor(120, 56, 186, 56) + corridor(56, 56, 56, 128) + corridor(120, 56, 120, 128, 1) + corridor(186, 56, 186, 128) +
    corridor(56, 128, 120, 128) + corridor(120, 128, 186, 196) + corridor(56, 128, 56, 196) + corridor(56, 196, 120, 196) +
    room(30, 36, 52, 42, { tiles: [0, 1, 2, 3, 1] }) + room(94, 36, 52, 42, { tiles: [0, 1, 0, 3, 1] }) + room(160, 36, 52, 42, { tiles: [2, 1, 0, 3, 1] }) +
    room(30, 108, 52, 42, { tiles: [0, 3, 2, 3, 1] }) + room(94, 108, 52, 42, { floor: '#ffe7a8', tiles: [0, 1, 0, 1, 1] }) +
    room(30, 176, 52, 40, { tiles: [0, 1, 2, 1, 1] }) + room(94, 176, 52, 40, { tiles: [2, 1, 0, 3, 3] }) + room(160, 176, 52, 40, { floor: '#3a342c' }) +
    at(120, 132, cheese({ glow: 1 })) + at(120, 66, rat(), '', .85) + door(120, 92) + finger(124, 98) +
    spark(214, 30, 6, GOLD) +
    '<rect y="206" width="240" height="114" fill="url(#maze-cf)"/>' +
    '<svg x="0" y="230" width="240" height="80" viewBox="0 0 240 80">' + logoInner(50) + '</svg></svg>';

  const hexPath = (path, x, y, r) => {
    const P = Array.from({ length: 6 }, (_, q) => { const t = Math.PI / 3 * q - Math.PI / 6; return [x + r * Math.cos(t), y + r * Math.sin(t)]; });
    path.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < 6; i++) path.lineTo(P[i][0], P[i][1]);
    path.closePath();
  };
  // bonus gems: the rat's pantry, one silhouette per element: apple (fire), water drop, cheese (air), lettuce leaf (earth)
  const GEM = [
    '<path d="M0 -.62C-.3 -.86 -.92 -.8 -.92 -.1C-.92 .5 -.5 .92 -.22 .92C-.1 .92 -.06 .84 0 .84C.06 .84 .1 .92 .22 .92C.5 .92 .92 .5 .92 -.1C.92 -.8 .3 -.86 0 -.62Z" fill="#ef4b3a"/><path d="M0 -.62V-1M0 -.8C.2 -1.02 .5 -1 .6 -.86C.4 -.7 .16 -.72 0 -.8Z" fill="#4caf50" stroke="' + OUT + '" stroke-width=".1" stroke-linejoin="round"/>',
    '<path d="M0 -1C.32 -.58 .74 -.18 .74 .26A.74 .74 0 0 1 -.74 .26C-.74 -.18 -.32 -.58 0 -1Z" fill="#3d8fe8"/>',
    '<path d="M-.95 .62H.95V.06L-.38 -.86Z" fill="' + CHEESE + '"/><path d="M-.95 .62V.18L-.38 -.86L.95 .06V.16Z" fill="' + GOLD + '"/><ellipse cx="-.22" cy="-.12" rx=".16" ry=".12" fill="#c98a10"/><ellipse cx=".36" cy=".36" rx=".12" ry=".1" fill="#c98a10"/>',
    '<path d="M-.78 .82C-.98 .1 -.6 -.7 .9 -.92C.98 .2 .3 .9 -.78 .82Z" fill="#4caf50"/><path d="M-.7 .74C-.2 .2 .2 -.2 .62 -.6" stroke="#1e6b2a" stroke-width=".09" stroke-linecap="round" fill="none"/>',
  ];
  const OUTL = [
    'M0 -.62C-.3 -.86 -.92 -.8 -.92 -.1C-.92 .5 -.5 .92 -.22 .92C-.1 .92 -.06 .84 0 .84C.06 .84 .1 .92 .22 .92C.5 .92 .92 .5 .92 -.1C.92 -.8 .3 -.86 0 -.62Z',
    'M0 -1C.32 -.58 .74 -.18 .74 .26A.74 .74 0 0 1 -.74 .26C-.74 -.18 -.32 -.58 0 -1Z',
    'M-.95 .62H.95V.06L-.38 -.86Z',
    'M-.78 .82C-.98 .1 -.6 -.7 .9 -.92C.98 .2 .3 .9 -.78 .82Z',
  ];
  const gem = (e, R) => '<g transform="scale(' + f2(R) + ')"><path d="' + OUTL[e] + '" fill="#000" opacity=".4" transform="translate(.1 .18)"/>' + GEM[e] +
    '<path d="' + OUTL[e] + '" fill="none" stroke="' + OUT + '" stroke-width=".14" stroke-linejoin="round"/>' +
    '<ellipse cx="-.34" cy="-.3" rx=".22" ry=".11" transform="rotate(-40 -.34 -.3)" fill="#fff" opacity=".9"/></g>';

  FTH_SKINS.register({
    id: 'maze', name: 'Rat Maze', ic: '🐀', blurb: 'walk the swaps, find the cheese',
    coin: { name: 'cheese wedge', plural: 'cheese wedges', glyph: '🧀', value: 25, pitch: 0.75,
      colors: { main: '#ffd36a', edge: '#a8740c' },
      svg: FTH_SKINS.coinArt('<path d="M-11 7.5H11V1.5L-3.6 -9.6Z" fill="#1c1640" opacity=".35" transform="translate(1.2 1.8)"/><path d="M-11 7.5H11V1.5L-3.6 -9.6Z" fill="#e7a91c"/><path d="M-11 7.5V2.6L-3.6 -9.6L11 1.5V2.4Z" fill="#ffd36a"/><path d="M-11 2.6L11 2.4" stroke="#1c1640" stroke-width="1.2"/><path d="M-11 7.5H11V1.5L-3.6 -9.6L-11 2.6Z" fill="none" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/><ellipse cx="-1.4" cy="-2.6" rx="2" ry="1.4" fill="#c98a10" stroke="#1c1640" stroke-width=".9"/><ellipse cx="4.6" cy="5" rx="1.6" ry="1.2" fill="#c98a10"/><ellipse cx="-6" cy="5.2" rx="1.2" ry="1" fill="#c98a10"/><path d="M-8.4 .4L-4.4 -5.6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>') },
    src: 'lab/maze.html', hud: 'compact',
    fonts: ['https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&display=swap'],
    theme: {
      '--sk-bg': 'radial-gradient(120% 80% at 50% 0%, #2a2e38 0%, #16181d 55%, #0e0f12 100%)',
      '--sk-ink': CREAM,
      '--sk-accent': GOLD,
      '--sk-card': 'linear-gradient(165deg, #2c313c, #1a1c22)',
      '--sk-card-ink': CREAM,
      '--sk-hud': 'linear-gradient(180deg, rgba(22,24,28,.96), rgba(14,15,18,.94))',
      '--sk-btn': 'linear-gradient(180deg, #ffe07a, #e7a91c)',
      '--sk-btn-ink': INK,
      '--sk-btn-shadow': '#8a5a10',
      '--sk-font': FONT,
      '--sk-radius': '16px',
      '--sk-chip': 'rgba(28,24,20,.9)',
      '--sk-chip-ink': CREAM,
      '--sk-edge': 'rgba(255,211,106,.7)',
      '--sk-btn2': '#2a261f',
      '--sk-btn2-ink': GOLD,
      '--sk-coin': 'linear-gradient(180deg, #ffe07a, #e7a91c)',
      '--sk-star-on': '#ffd36a', '--sk-star-edge': '#6a4a12', '--sk-star-off': '#c5d0d8', '--sk-star-off-edge': '#8ea0ae',
      '--sk-ctl': '#2a261f', '--sk-ctl-ink': '#f6efe2', '--sk-ctl-edge': '#ffd36a',
    },
    css: '--text:#f6efe2;--dim:#d9cbb6;--faint:#b7a890;--bg2:#242830;--line:rgba(255,236,200,.28);' +
      '.btn3d{border-radius:14px;letter-spacing:.02em}' +
      '.coins{color:#2a241c}' +
      '.skins button[aria-checked="true"]{color:#2a241c}' +
      '.tl .tin{transition:transform .12s}.tl.lit .tin{transform:scale(1.12)}.tl.glow .tin{filter:drop-shadow(0 0 6px #ffd36a)}',
    title: { svg: titleSvg },
    intro: I,
    icon, card, logo,
    bonus: {
      label: '🧀', board: 'radial-gradient(ellipse at 50% 20%, #3a4258, #14161c 75%)', line: GOLD,
      games: ['snake', 'hop'], intro: 'curtain',
      tile(x, y, r, e, k) {
        return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">' + gem(e, r * .8) + '</g></g>';
      },
    },
    eggs: [
      { id: 'cheese-crumb', on: 'page', note: 'leave the rat alone a while: it sniffs out a crumb you can tap', pays: true },
      { id: 'squeak', on: 'map', taps: 5, run(fx) { if (!fx) return; fx.burst && (fx.burst('🐭', .5, .5), fx.burst('🧀', .62, .44)); fx.sound && fx.sound('pop'); } },
    ],
    map: {
      sea: ['#2a3140', '#262c3a', '#222836', '#1e2432', '#1a202c', '#161c28', '#121820', '#0e141c', '#0c1016'],
      seaX: '#0e1014', unknown: '#3a342c',
      ramp: ['#7dcea0', '#ffd36a', '#e7a91c', '#ef5a3c'],
      grey: '#6e6558', route: GOLD, ink: 'rgba(246,239,226,.8)',
      cell: hexPath,
    },
    words: { win: 'Cheese!', perfect: 'Shortest way!', par: '🧀 {par} rooms', chart: 'ROOMS OPENED' },
    levelMap: (function () {
      const TINT = {
        cove: ['#1e4d62', '#163848'], beach: ['#6b4a2a', '#4a3018'], town: ['#3a342c', '#2a261f'],
        harbour: ['#243044', '#182030'], forest: ['#244028', '#182818'], cape: ['#4a3818', '#2e220e'],
        reef: ['#4a2838', '#301820'], cave: ['#2c2840', '#1c1830'], volcano: ['#4a2418', '#2e140e'],
      };
      const lock = '<rect x="-6" y="-3" width="12" height="9" rx="2" fill="#c4a574"/><path d="M-3.4 -3v-3a3.4 3.4 0 0 1 6.8 0v3" fill="none" stroke="#c4a574" stroke-width="1.8"/>';
      return {
        bg: '#14161a',
        defs: '<linearGradient id="mazeWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a07848"/><stop offset="1" stop-color="#6b4a2a"/></linearGradient>' +
          '<radialGradient id="mazeLamp" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#ffd36a" stop-opacity=".22"/><stop offset="1" stop-color="#ffd36a" stop-opacity="0"/></radialGradient>',
        backdrop(H) { return '<rect width="400" height="' + H + '" fill="#14161a"/><rect width="400" height="' + H + '" fill="url(#mazeLamp)"/>'; },
        zone(z) {
          const t = TINT[z.theme] || TINT.town, x = z.x0 + 8, y = z.y0 + 8, w = z.x1 - z.x0 - 16, h = z.y1 - z.y0 - 16;
          return '<g><rect x="' + (x + 4) + '" y="' + (y + 6) + '" width="' + w + '" height="' + h + '" rx="18" fill="#000" opacity=".35"/>' +
            '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="18" fill="' + t[0] + '" stroke="' + t[1] + '" stroke-width="3"/>' +
            '<rect x="' + (x + 8) + '" y="' + (y + 8) + '" width="' + (w - 16) + '" height="' + (h - 16) + '" rx="12" fill="none" stroke="#f6efe2" stroke-opacity=".18" stroke-width="2"/></g>';
        },
        decor(theme, r) {
          if (theme === 'forest' && r < .6) return '<circle cy="-2" r="7" fill="#4caf50" opacity=".8"/><path d="M0 6v8" stroke="#6b4a2a" stroke-width="2"/>';
          if (theme === 'volcano' || (theme === 'cape' && r < .4)) return '<path d="M-8 6h16l-3-10H-5z" fill="#ffd36a" stroke="#a8740c" stroke-width="1"/>';
          if (r < .35) return '<circle r="5" fill="#ffd36a" stroke="#a8740c" stroke-width="1.2"/>';
          if (r < .7) return '<ellipse cx="-2" cy="1" rx="8" ry="5" fill="#f7f1e6"/><circle cx="5" cy="-1" r="3.5" fill="#f7f1e6"/>';
          return '<rect x="-7" y="-5" width="14" height="10" rx="2" fill="#d7ecf6" stroke="#f4fbff" stroke-width="1"/>';
        },
        sign(label, w) {
          const name = String(label).replace(/^\S+\s+/, '');
          return '<rect x="0" y="0" width="' + w + '" height="28" rx="8" fill="#f6efe2" stroke="#8d6840" stroke-width="2"/>' +
            '<text x="' + (w / 2) + '" y="19" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="13" font-weight="800" fill="#2a241c">' + name + '</text>';
        },
        road: { todo: ['#3a342c', '#6b4a2a', '#efe2c4'], done: ['#3a342c', '#a07848', '#ffd36a'], widths: [16, 8, 3], dash: '2 7', cap: 'round' },
        node(state, num, e, boss) {
          const R = boss ? 30 : 26, fs = num.length > 2 ? 12 : num.length > 1 ? 15 : 18;
          const face = e >= 0 ? C[e] : '#6e6558';
          const txt = '<text y="' + f1(fs * .36) + '" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="' + fs + '" font-weight="800" fill="#2a241c">' + num + '</text>';
          let s = '<rect x="' + (-R - 2) + '" y="' + (-R + 2) + '" width="' + (R * 2 + 4) + '" height="' + (R * 2 + 4) + '" rx="10" fill="#000" opacity=".28"/>';
          if (state === 'locked') return s + '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="10" fill="#3a342c" stroke="#6e6558" stroke-width="2"/><g transform="translate(0 2)">' + lock + '</g>';
          if (state === 'beaten') return s + '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="10" fill="#ffd36a" stroke="#f6efe2" stroke-width="2"/>' + txt;
          if (state === 'current') return s + '<rect x="' + (-R - 4) + '" y="' + (-R - 4) + '" width="' + (R * 2 + 8) + '" height="' + (R * 2 + 8) + '" rx="12" fill="none" stroke="#ffd36a" stroke-width="3"/>' +
            '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="10" fill="' + face + '" stroke="#f6efe2" stroke-width="2"/>' + txt;
          return s + '<rect x="' + -R + '" y="' + -R + '" width="' + R * 2 + '" height="' + R * 2 + '" rx="10" fill="' + face + '" fill-opacity=".9" stroke="#f6efe2" stroke-width="2"/>' + txt;
        },
        start() {
          return '<rect x="-16" y="-16" width="32" height="32" rx="8" fill="#f6efe2" stroke="#8d6840" stroke-width="2"/>' +
            '<text y="5" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="11" font-weight="800" fill="#2a241c">GO</text>' +
            '<text y="36" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="11" font-weight="800" letter-spacing="1.5" fill="#f6efe2">NEST</text>';
        },
        pin() {
          return '<path d="M0 27C-6 16 -18 8 -18 -4A18 18 0 0 1 18 -4C18 8 6 16 0 27Z" fill="#f7f1e6" stroke="#2a241c" stroke-width="2"/>' +
            '<circle cy="-6" r="7" fill="#f7f1e6" stroke="#2a241c" stroke-width="1.4"/><circle cx="-2" cy="-10" r="2.2" fill="#f4b6c8"/><circle cx="4" cy="-10" r="2.2" fill="#f4b6c8"/>' +
            '<circle cx="2" cy="-6" r="1.1" fill="#2a241c"/>';
        },
      };
    })(),
  });
})();
