// 4square skin registry: each skins/<id>.js calls FTH_SKINS.register(spec). See SKIN-SPEC.md.
(function () {
  const list = [];
  const DEF = { name: 'coin', plural: 'coins', glyph: '🪙', value: 10, pitch: 1, colors: { main: '#ffd84a', edge: '#c27a00' }, svg: null };
  window.FTH_SKINS = {
    list,
    register(spec) {
      if (!spec || !spec.id || !spec.name) throw new Error('skin spec needs id and name');
      const i = list.findIndex(s => s.id === spec.id);
      if (i >= 0) list[i] = spec; else list.push(spec);
    },
    // a skin's coin (SKIN-SPEC.md section 12): coinArt(inner) wraps art drawn in the box -13..13 into the spec's svg(size)
    coinArt(art) { return size => { const z = size || 26; return '<svg viewBox="-13 -13 26 26" width="' + z + '" height="' + z + '" aria-hidden="true">' + art + '</svg>'; }; },
    // the coin of a skin, or the plain gold coin when the spec has none
    coinOf(spec) { return spec && spec.coin && spec.coin.svg ? spec.coin : DEF; },
    // coins a point of play pays in this skin's currency: sqrt(10 / value) / 4 (4 points = 1 doubloon; rarer coins pay fewer).
    // One formula for earning (index.html), ticket prices (tickets.js) and the leaderboard's plausibility cap (account.js).
    rate(spec) { return Math.sqrt(10 / this.coinOf(spec).value) / 4; },
    get(id) { return list.find(s => s.id === id) || list[0]; },
    // a skin derived from an already registered one: extend('islands', { id, name, ic, blurb, ... }). Plain-object fields
    // (theme, words, map, bonus, levelMap, title, board) are merged one level deep, everything else is replaced.
    extend(baseId, over) {
      const b = list.find(s => s.id === baseId); if (!b) throw new Error('extend: unknown skin ' + baseId);
      const out = Object.assign({}, b, over), plain = v => v && typeof v === 'object' && !Array.isArray(v);
      for (const k in over) if (plain(b[k]) && plain(over[k])) out[k] = Object.assign({}, b[k], over[k]);
      return out;
    },
  };
  DEF.svg = window.FTH_SKINS.coinArt('<circle cy="1.8" r="11" fill="#c27a00" stroke="#1c1640" stroke-width="2"/><circle r="11" fill="#ffd84a" stroke="#1c1640" stroke-width="2"/><circle r="7.4" fill="none" stroke="#f0a91c" stroke-width="1.8"/><path d="M0 -4.8L1.4 -1.4 4.8 0 1.4 1.4 0 4.8-1.4 1.4-4.8 0-1.4-1.4Z" fill="#fff6c8" stroke="#c27a00" stroke-width=".8"/>');
})();
