// Islands: the built-in board (the shell draws it, board/island.js). Its look is the shell's default, so the spec only
// names it; the rich animated how-to-play, the hex bonus tiles and the sea-blue exploration map are the shell's own.
// Islands Free and Islands 3D (islands-free.js, islands-3d.js) extend this spec: same theme, art and map, other board.
// the art lives in a var (not an IIFE round the spec) so the register block below stays as it was
var FTH_ISLANDS_ART = (function () {
  // ---- icon, card and logo (SKIN-SPEC.md section 13): the island board's own cartoon hex tiles, drawn self-contained
  const INK = '#1c1640', q = n => Math.round(n * 10) / 10;
  const EL = [['#ef5a3c', '#8e1c17', '#ff7a52'], ['#3d8fe8', '#1b4f91', '#5ab4ff'], ['#e8c547', '#8a6510', '#ffe066'], ['#4caf50', '#1a6b2a', '#5cff8a']];
  const IP = ['M12 2c.8 3.6 5.5 5.8 5.5 11.2A5.5 5.5 0 0 1 6.5 13.2c0-2.6 1.6-4 2-6.4 1.2 1 2.2 2.4 2.3 4.4 1-1.9 1.4-5.4 1.2-9.2z', 'M12 2.5C9.2 7 5.5 10.6 5.5 15a6.5 6.5 0 0 0 13 0c0-4.4-3.7-8-6.5-12.5z', 'M3 8.5h10.5a3 3 0 1 0-3-3M3 12.5h14.5a3 3 0 1 1-3 3M3 16.5h7', 'M5 19.5C5 10 11 4.5 20 4.5c0 9.5-5.5 15-15 15z'];
  const hex = (r, rot) => Array.from({ length: 6 }, (_, i) => { const a = (rot || 0) + Math.PI / 3 * i - Math.PI / 2; return q(r * Math.cos(a)) + ',' + q(r * Math.sin(a)); }).join(' ');
  // one cartoon tile of element e (-1: the "?" hole) at (x, y), radius r: drop shadow, body, neon rim, black plate, icon, gloss
  function tile(x, y, r, e, glow) {
    const c = e < 0 ? ['#aab4bf', '#5a636e', '#e6edf3'] : EL[e], sw = q(Math.max(2, r * .11)), sc = r * .6 / 12;
    const icon = e < 0 ? '<text y="' + q(r * .36) + '" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="' + q(r * 1.05) + '" fill="#fff">?</text>'
      : '<path d="' + IP[e] + '" transform="translate(' + q(-12 * sc) + ' ' + q(-12 * sc) + ') scale(' + q(sc * 100) / 100 + ')" ' + (e === 2 ? 'fill="none" stroke="' + c[2] + '" stroke-width="2.6" stroke-linecap="round"' : 'fill="' + c[2] + '"') + '/>';
    return '<g transform="translate(' + q(x) + ' ' + q(y) + ')">' +
      (glow ? '<polygon points="' + hex(r * 1.32) + '" fill="' + c[2] + '" opacity=".35"/>' : '') +
      '<polygon points="' + hex(r) + '" transform="translate(' + q(r * .06) + ' ' + q(r * .2) + ')" fill="' + INK + '" opacity=".35"/>' +
      '<polygon points="' + hex(r) + '" transform="translate(0 ' + q(r * .14) + ')" fill="' + c[1] + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<polygon points="' + hex(r) + '" fill="' + c[0] + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<polygon points="' + hex(r * .78) + '" fill="none" stroke="' + (glow ? '#fff' : c[2]) + '" stroke-width="' + q(r * .1) + '" stroke-linejoin="round"/>' +
      '<polygon points="' + hex(r * .64) + '" fill="#07090d"/>' + icon +
      '<path d="M' + q(-r * .62) + ' ' + q(-r * .5) + 'L' + q(-r * .1) + ' ' + q(-r * .8) + '" stroke="#fff" stroke-opacity=".75" stroke-width="' + q(r * .1) + '" stroke-linecap="round"/></g>';
  }
  // a rope-and-plank bridge (the island board's ladder link) between two points
  function bridge(a, b, w, lit) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, px = -uy * w, py = ux * w, k = Math.max(2, Math.round(L / 7));
    let rungs = ''; for (let i = 0; i < k; i++) { const t = (i + .5) / k, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; rungs += 'M' + q(x + px) + ' ' + q(y + py) + 'L' + q(x - px) + ' ' + q(y - py); }
    const rails = 'M' + q(a[0] + px) + ' ' + q(a[1] + py) + 'L' + q(b[0] + px) + ' ' + q(b[1] + py) + 'M' + q(a[0] - px) + ' ' + q(a[1] - py) + 'L' + q(b[0] - px) + ' ' + q(b[1] - py);
    return (lit ? '<path d="M' + q(a[0]) + ' ' + q(a[1]) + 'L' + q(b[0]) + ' ' + q(b[1]) + '" stroke="#ffe066" stroke-width="' + q(w * 4.2) + '" stroke-linecap="round" opacity=".55"/>' : '') +
      '<path d="' + rungs + '" stroke="' + INK + '" stroke-width="' + q(w * .95) + '" stroke-linecap="round"/><path d="' + rungs + '" stroke="' + (lit ? '#fff6c8' : '#c99a5b') + '" stroke-width="' + q(w * .5) + '" stroke-linecap="round"/>' +
      '<path d="' + rails + '" stroke="' + INK + '" stroke-width="' + q(w * .55) + '"/>';
  }
  const SKY = (id, x, y, w, h, rx) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe0ff"/><stop offset=".55" stop-color="#3aa6f0"/><stop offset="1" stop-color="#2a6fd0"/></linearGradient>';
  const cloud = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-14 6a8 8 0 0 1 2-14 10 10 0 0 1 18-2 7 7 0 0 1 10 8 6 6 0 0 1-2 8z" fill="#fff" opacity=".9"/></g>';

  const icon = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs>' + SKY('islands-ic-sky') +
    '<radialGradient id="islands-ic-sand" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffe9a6"/><stop offset="1" stop-color="#e8b85a"/></radialGradient>' +
    '<radialGradient id="islands-ic-grass" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#8ee86a"/><stop offset="1" stop-color="#2f9e45"/></radialGradient>' +
    '<clipPath id="islands-ic-clip"><rect width="120" height="120" rx="26"/></clipPath></defs>' +
    '<g clip-path="url(#islands-ic-clip)"><rect width="120" height="120" fill="url(#islands-ic-sky)"/>' +
    '<circle cx="100" cy="20" r="26" fill="#fff" opacity=".18"/>' + cloud(26, 22, .9) +
    '<path d="M0 92q15-6 30 0t30 0 30 0 30 0V120H0z" fill="#1d5fc0"/><path d="M0 98q15-6 30 0t30 0 30 0 30 0" stroke="#8fd8ff" stroke-width="2.5" fill="none" opacity=".7"/>' +
    '<ellipse cx="62" cy="92" rx="50" ry="17" fill="' + INK + '" opacity=".3"/>' +
    '<ellipse cx="60" cy="86" rx="50" ry="18" fill="url(#islands-ic-sand)" stroke="' + INK + '" stroke-width="3.5"/>' +
    '<ellipse cx="60" cy="81" rx="40" ry="12" fill="url(#islands-ic-grass)" stroke="' + INK + '" stroke-width="3"/>' +
    bridge([24, 52], [58, 58], 3.2, true) + bridge([96, 46], [62, 58], 3.2, true) +
    tile(22, 50, 15, 0) + tile(98, 44, 15, 1) + tile(60, 58, 27, 3, true) +
    '</g><rect x="1.5" y="1.5" width="117" height="117" rx="25" fill="none" stroke="' + INK + '" stroke-width="3" opacity=".55"/>' +
    '<path d="M12 30Q14 12 32 9" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".55"/></svg>';

  // wordmark: chunky multicoloured letters with an ink outline and a dropped ink copy, like the 4square title
  const LOGO_FONT = "'Arial Rounded MT Bold','Nunito','Baloo 2',system-ui,-apple-system,'Segoe UI',sans-serif";
  const word = (txt, x, y, size, cols) => {
    const base = 'x="' + x + '" text-anchor="middle" font-family="' + LOGO_FONT + '" font-weight="900" font-size="' + size + '" letter-spacing="' + q(size * .02) + '" stroke="' + INK + '" stroke-linejoin="round" paint-order="stroke"';
    const spans = fill => txt.split('').map((ch, i) => '<tspan dy="' + (i ? (i % 2 ? 3 : -3) : 0) + '"' + (fill ? ' fill="' + cols[i % cols.length] + '"' : '') + '>' + ch + '</tspan>').join('');
    return '<text y="' + q(y + size * .13) + '" ' + base + ' fill="' + INK + '" stroke-width="' + q(size * .24) + '">' + spans(false) + '</text>' +
      '<text y="' + y + '" ' + base + ' stroke-width="' + q(size * .22) + '">' + spans(true) + '</text>';
  };
  const LCOL = ['#ffd84a', '#ff7a52', '#5ab4ff', '#7ee26b', '#ffd84a', '#ff7a52', '#5ab4ff'];
  const logoInner = () => word('Islands', 120, 54, 50, LCOL);
  const logo = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">' + logoInner() + '</svg>';

  // card: a still of play: the island, a ring of tiles round the "?" hole, one chain lit and being traced
  const ring = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [120 + Math.cos(a) * 64, 128 + Math.sin(a) * 52]; });
  const rimE = [0, 1, 3, 2, 1];
  const card = '<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg"><defs>' + SKY('islands-cd-sky') +
    '<radialGradient id="islands-cd-sand" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffe9a6"/><stop offset="1" stop-color="#e8b85a"/></radialGradient>' +
    '<radialGradient id="islands-cd-grass" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#8ee86a"/><stop offset="1" stop-color="#2f9e45"/></radialGradient>' +
    '<linearGradient id="islands-cd-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14377a" stop-opacity="0"/><stop offset=".35" stop-color="#14377a" stop-opacity=".92"/><stop offset="1" stop-color="#0b2257"/></linearGradient>' +
    '<clipPath id="islands-cd-clip"><rect width="240" height="320" rx="22"/></clipPath></defs>' +
    '<g clip-path="url(#islands-cd-clip)"><rect width="240" height="320" fill="url(#islands-cd-sky)"/>' + cloud(40, 30, 1.2) + cloud(200, 46, .9) +
    '<path d="M0 212q20-8 40 0t40 0 40 0 40 0 40 0 40 0V320H0z" fill="#1d5fc0"/>' +
    '<ellipse cx="124" cy="140" rx="112" ry="82" fill="' + INK + '" opacity=".28"/>' +
    '<ellipse cx="120" cy="134" rx="112" ry="82" fill="url(#islands-cd-sand)" stroke="' + INK + '" stroke-width="4"/>' +
    '<ellipse cx="120" cy="128" rx="96" ry="68" fill="url(#islands-cd-grass)" stroke="' + INK + '" stroke-width="3.5"/>' +
    ring.map((p, i) => bridge(p, ring[(i + 1) % 5], 3, i === 0 || i === 4)).join('') + ring.map(p => bridge(p, [120, 128], 3, false)).join('') +
    bridge(ring[0], [64, 60], 3, true) + bridge(ring[4], [64, 60], 3, true) + bridge(ring[1], [192, 66], 3, false) +
    tile(64, 60, 15, 3, true) + tile(192, 66, 15, 0) + tile(40, 176, 14, 2) + tile(204, 180, 14, 3) +
    ring.map((p, i) => tile(p[0], p[1], 21, rimE[i], i === 0 || i === 4)).join('') + tile(120, 128, 24, -1) +
    // ghost finger on the lit chain
    '<g transform="translate(150 70) rotate(-18)"><path d="M0 0c-4-10 6-14 9-5l5 13c5-3 10 0 9 6l-2 12c-1 8-8 12-15 11l-6-1c-6-1-9-6-8-12z" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/></g>' +
    '<rect y="226" width="240" height="94" fill="url(#islands-cd-band)"/>' +
    '<g transform="translate(0 236)">' + logoInner() + '</g></g>' +
    '<rect x="2" y="2" width="236" height="316" rx="20" fill="none" stroke="' + INK + '" stroke-width="4"/></svg>';
  return { icon, card, logo };
})();
FTH_SKINS.register({
  id: 'islands', name: 'Islands', ic: '🏝️', blurb: 'trace chains across a cartoon island',
  coin: { name: 'doubloon', plural: 'doubloons', glyph: '🪙', value: 10, pitch: 1,   // this skin's currency (SKIN-SPEC.md section 12)
    colors: { main: '#ffd84a', edge: '#c27a00' },
    svg: FTH_SKINS.coinArt('<circle cy="1.8" r="11" fill="#c27a00" stroke="#1c1640" stroke-width="2"/><circle r="11" fill="#ffd84a" stroke="#1c1640" stroke-width="2"/><circle r="7.4" fill="none" stroke="#f0a91c" stroke-width="1.8"/><path d="M0 -4.8L1.4 -1.4 4.8 0 1.4 1.4 0 4.8-1.4 1.4-4.8 0-1.4-1.4Z" fill="#fff6c8" stroke="#c27a00" stroke-width=".8"/><path d="M-6.5 -6A9 9 0 0 1 1 -9.2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>') },
  board: { free: false },             // the island board: three far regions as walls, tiles on their planar layout (SKIN-SPEC.md section 11)
  hud: 'full',
  icon: FTH_ISLANDS_ART.icon, card: FTH_ISLANDS_ART.card, logo: FTH_ISLANDS_ART.logo,   // section 13
  // the shell's own hex gems (no tile here); every game fits the reference skin, the board drops in like a wave
  bonus: { games: ['chain', 'snake', 'hop', 'stack', 'pop'], intro: 'drop' },
  theme: {
    '--sk-bg': 'linear-gradient(180deg, #5fd0ff 0%, #3aa6f0 48%, #2a7fdc 100%)',
    '--sk-ink': '#ffffff',
    '--sk-accent': '#ffd84a',
    '--sk-card': 'linear-gradient(170deg, #232b38, #161b22)',
    '--sk-card-ink': '#e6edf3',
    '--sk-hud': 'linear-gradient(180deg, rgba(14,52,110,.92) 0%, rgba(14,52,110,.7) 100%)',
    '--sk-btn': 'linear-gradient(180deg, #7ee26b, #2fb34a)',
    '--sk-btn-ink': '#ffffff',
    '--sk-btn-shadow': '#1c7a2e',
    '--sk-font': "system-ui, -apple-system, 'Segoe UI', sans-serif",
    '--sk-radius': '22px',
    '--sk-ctl': '#14377a', '--sk-ctl-ink': '#ffffff', '--sk-ctl-edge': '#ffd84a',
    '--sk-star-on': '#ffd84a', '--sk-star-edge': '#1c1640', '--sk-star-off': '#7b86c4', '--sk-star-off-edge': '#a3acdc',
  },
});
