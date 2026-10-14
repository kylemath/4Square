// Validates skin specs (SKIN-SPEC.md): node docs/game/tools/skin_check.js [--strict] [id ...]
// Loads skins/registry.js and every skins/<id>.js, then checks fields and calls every function with sample arguments.
// Section 13 art (icon, card, logo) is a WARNING while the skins are being drawn; --strict makes a missing or bad one fail.
// Copy (section 0): blurb <= 30 chars, intro title <= 28 and text <= 110 per page, words.* <= 40, bonus.label <= 8.
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..', 'skins');
const ctx = { window: {}, console, setTimeout: () => 0, clearTimeout: () => {} }; ctx.window.window = ctx.window; vm.createContext(ctx);   // timers: egg run()s may schedule a second beat
vm.runInContext(fs.readFileSync(path.join(D, 'registry.js'), 'utf8'), ctx);
ctx.FTH_SKINS = ctx.window.FTH_SKINS;
const STRICT = process.argv.includes('--strict'), want = process.argv.slice(2).filter(a => a !== '--strict');
const read = f => fs.readFileSync(path.join(D, f), 'utf8');
const files = fs.readdirSync(D).filter(f => f.endsWith('.js') && f !== 'registry.js' && (!want.length || want.includes(f.replace(/\.js$/, ''))))
  .sort((x, y) => /FTH_SKINS\.extend\(/.test(read(x)) - /FTH_SKINS\.extend\(/.test(read(y)));   // skins that extend another load after it
if (want.length && files.some(f => /FTH_SKINS\.extend\('([\w-]+)'/.test(read(f)))) fs.readdirSync(D).filter(f => f.endsWith('.js') && f !== 'registry.js' && !files.includes(f) && !/FTH_SKINS\.extend\(/.test(read(f))).forEach(f => files.unshift(f));
let bad = 0, warned = 0; const fail = (id, m) => { bad++; console.log('  FAIL ' + id + ': ' + m); };
const warn = (id, m) => { if (STRICT) return fail(id, m); warned++; console.log('  WARN ' + id + ': ' + m); };
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { fail(f, 'does not load: ' + e.message); }
}
const svgOk = (s, where, id) => {
  if (typeof s !== 'string' || !/^\s*<svg[\s>]/.test(s)) return fail(id, where + ': not an <svg> string');
  if (!/viewBox="0 0 300 250"/.test(s)) fail(id, where + ': viewBox must be "0 0 300 250"');
  if (/<script/i.test(s)) fail(id, where + ': no <script> in SVGs');
  const open = (s.match(/<g[\s>]/g) || []).length, close = (s.match(/<\/g>/g) || []).length;
  if (open !== close) fail(id, where + ': unbalanced <g> (' + open + ' open, ' + close + ' close)');
};
const names = {}; for (const s of ctx.window.FTH_SKINS.list) for (const k of ['id', 'name', 'ic']) { const key = k + ':' + s[k]; if (names[key]) fail(s.id, k + ' ' + s[k] + ' is also used by ' + names[key]); names[key] = s.id; }
for (const s of ctx.window.FTH_SKINS.list) {
  const id = s.id; console.log(id + ' (' + s.name + ')');
  if (!s.ic) fail(id, 'missing ic');
  if (s.id !== undefined && !fs.existsSync(path.join(D, s.id + '.js'))) fail(id, 'skins/' + s.id + '.js must be named after the id');
  if (s.look && !ctx.window.FTH_SKINS.list.some(k => k.id === s.look)) fail(id, 'look ' + s.look + ' is not a registered skin');
  if (s.board) {                                     // the island board's layout and physics (section 11)
    const B = s.board, LK = ['kH', 'kB', 'damp', 'cap', 'rep', 'pull', 'tug', 'fk', 'fr', 'fl'];
    if (s.src) fail(id, 'board only applies to skins without a play page (src)');
    for (const k of Object.keys(B)) if (!['free', 'guard', 'live'].includes(k)) fail(id, 'board.' + k + ' unknown (free, guard, live)');
    for (const k of Object.keys(B.live || {})) if (!LK.includes(k) || typeof B.live[k] !== 'number') fail(id, 'board.live.' + k + ' must be a number named one of ' + LK.join(' '));
  }
  if (s.family && !ctx.window.FTH_SKINS.list.some(k => k !== s && k.family === s.family)) console.log('  note: family ' + s.family + ' has one member, so it is not grouped');
  if (s.hud && !['full', 'compact', 'minimal'].includes(s.hud)) fail(id, 'hud must be full | compact | minimal');
  if (s.par !== undefined) {                         // section 1: a skin's own par per level id (Shoreline); verify.js SKIN_PAR must match
    if (!s.par || typeof s.par !== 'object' || Array.isArray(s.par)) fail(id, 'par must be an object { levelId: swaps }');
    else for (const [k, v] of Object.entries(s.par)) { if (!/^[a-z0-9-]{2,24}$/.test(k)) fail(id, 'par: bad level id ' + k); if (!(Number.isInteger(v) && v >= 1 && v <= 20)) fail(id, 'par.' + k + ' must be an integer 1-20'); }
    const VP = require(path.join(__dirname, '..', 'verify.js')).SKIN_PAR[id];
    if (JSON.stringify(VP || {}) !== JSON.stringify(s.par)) fail(id, 'par differs from verify.js SKIN_PAR.' + id + ' (run proofs would score other stars)');
  }
  if (s.src && !fs.existsSync(path.join(__dirname, '..', s.src))) fail(id, 'src ' + s.src + ' not found');
  for (const k of Object.keys(s.theme || {})) if (!/^--sk-[a-z0-9-]+$/.test(k)) fail(id, 'theme key ' + k + ' is not --sk-*');
  // chrome tokens that must be solid colours (SKIN-SPEC 3b): the play page's controls (skins with a page) and the stars (contrast: tools/contrast_check.js)
  const SOLID = /^(#[0-9a-f]{3,8}|rgba?\([^()]*\))$/i;
  for (const k of (s.src ? ['--sk-ctl', '--sk-ctl-ink', '--sk-ctl-edge'] : []).concat(['--sk-star-on', '--sk-star-edge', '--sk-star-off', '--sk-star-off-edge'])) {
    const v = (s.theme || {})[k]; if (!v) fail(id, 'theme needs ' + k + ' (SKIN-SPEC 3b)'); else if (!SOLID.test(v.trim())) fail(id, k + ' must be one solid colour, got ' + v);
  }
  {                                                  // the skin's currency (SKIN-SPEC.md section 12); absent: the shell uses the plain gold coin
    const C = s.coin;
    if (!C) console.log('  note: no coin, the plain gold coin is used');
    else {
      for (const k of ['name', 'plural', 'glyph']) if (typeof C[k] !== 'string' || !C[k].trim()) fail(id, 'coin.' + k + ' must be a non-empty string');
      if (typeof C.value !== 'number' || !(C.value > 0)) fail(id, 'coin.value must be a number > 0 (base units, G)');
      if (C.pitch !== undefined && !(typeof C.pitch === 'number' && C.pitch >= .5 && C.pitch <= 2)) fail(id, 'coin.pitch must be 0.5 to 2');
      for (const k of ['main', 'edge']) if (C.colors && !/^#[0-9a-f]{3,8}$/i.test((C.colors || {})[k] || '')) fail(id, 'coin.colors.' + k + ' must be a #hex colour');
      let a; try { a = C.svg(26); } catch (x) { fail(id, 'coin.svg throws: ' + x.message); }
      if (typeof C.svg !== 'function') fail(id, 'coin.svg must be a function (size) -> svg string');
      else if (typeof a === 'string') {
        if (!/^\s*<svg[\s>]/.test(a) || !/viewBox="-13 -13 26 26"/.test(a)) fail(id, 'coin.svg must be an <svg> with viewBox="-13 -13 26 26"');
        if (/<script|<image|href="https?:|\bon\w+=/i.test(a)) fail(id, 'coin.svg: no script, images or handlers');
        if (/\bid="(?!coin-)/.test(a)) fail(id, 'coin.svg: ids must start with coin-');
        const o = (a.match(/<g[\s>]/g) || []).length, c = (a.match(/<\/g>/g) || []).length; if (o !== c) fail(id, 'coin.svg: unbalanced <g>');
        if (!/<svg[^>]*width="26"/.test(a) || !/width="40"/.test(C.svg(40))) fail(id, 'coin.svg(size) must size the svg');
        if ((a.match(/<(path|circle|rect|polygon|ellipse|line|polyline)\b/g) || []).length < 3) fail(id, 'coin.svg looks empty');
      } else fail(id, 'coin.svg must return a string');
      const same = ctx.window.FTH_SKINS.list.filter(k => k !== s && k.coin && (k.coin.name === C.name || k.coin.value === C.value || k.coin.svg(26) === a));
      if (same.length) fail(id, 'coin must differ from ' + same.map(k => k.id).join(', ') + ' (name, value and art are unique per skin)');
      console.log('  coin: ' + C.name + ', ' + C.value + ' G');
    }
  }
  if (s.title && s.title.svg) svgOk(s.title.svg, 'title.svg', id);
  {                                                  // section 13: the app-store icon, the reel card, the optional wordmark
    const art = (k, vb, need) => {
      const v = s[k];
      if (v === undefined) return need ? warn(id, k + ' missing (SKIN-SPEC 13: an <svg viewBox="' + vb + '"> string)') : undefined;
      if (typeof v !== 'string' || !/^\s*<svg[\s>]/.test(v)) return warn(id, k + ': not an <svg> string');
      if (!new RegExp('<svg[^>]*viewBox="' + vb + '"').test(v)) warn(id, k + ': viewBox must be "' + vb + '"');
      if (/<script|<image|<foreignObject|\bon\w+=/i.test(v)) warn(id, k + ': no script, images or handlers');
      if (/(href|src)="(https?:|data:|\/\/)/i.test(v)) warn(id, k + ': no external or embedded images');
      const o = (v.match(/<g[\s>]/g) || []).length, c = (v.match(/<\/g>/g) || []).length; if (o !== c) warn(id, k + ': unbalanced <g> (' + o + ' open, ' + c + ' close)');
      const ids = (v.match(/\bid="([^"]+)"/g) || []).map(x => x.slice(4, -1)).filter(x => !x.startsWith(id)); if (ids.length) warn(id, k + ': ids must start with the skin id: ' + ids.slice(0, 3).join(' '));
      if ((v.match(/<(path|circle|rect|polygon|ellipse|polyline)\b/g) || []).length < 3) warn(id, k + ': looks empty (fewer than 3 shapes)');
      if (k === 'icon' && /<text\b/.test(v) && (v.replace(/<[^>]+>/g, '').replace(/\s/g, '').length > 1)) warn(id, 'icon: no text except one letter or digit');
    };
    art('icon', '0 0 120 120', true); art('card', '0 0 240 320', true); art('logo', '0 0 240 80', false);
  }
  {                                                  // section 0: symbols, not sentences
    const len = (v, max, where) => { if (typeof v === 'string' && v.replace(/<[^>]+>/g, '').length > max) fail(id, where + ' is ' + v.replace(/<[^>]+>/g, '').length + ' chars (max ' + max + '): ' + JSON.stringify(v.slice(0, 50))); };
    len(s.blurb, 30, 'blurb');
    (Array.isArray(s.intro) ? s.intro : []).forEach((p, i) => { len(p && p.title, 28, 'intro[' + i + '].title'); len(p && p.text, 110, 'intro[' + i + '].text'); });
    for (const k of Object.keys(s.words || {})) { if (typeof s.words[k] !== 'string') fail(id, 'words.' + k + ' must be a string'); else len(s.words[k], 40, 'words.' + k); }
    if (s.bonus) len(s.bonus.label, 8, 'bonus.label');
  }
  if (s.bonus) {                                     // section 6: the win flow and the bonus games
    const GAMES = ['chain', 'snake', 'hop', 'stack', 'pop'];
    if (s.bonus.flow !== undefined && !['card', 'fade'].includes(s.bonus.flow)) fail(id, "bonus.flow must be 'card' or 'fade'");
    if (s.bonus.games !== undefined) {
      if (!Array.isArray(s.bonus.games)) fail(id, 'bonus.games must be an array');
      else { const x = s.bonus.games.filter(g => !GAMES.includes(g)); if (x.length) fail(id, 'bonus.games: unknown ' + x.join(', ') + ' (' + GAMES.join(' ') + ')'); if (new Set(s.bonus.games).size !== s.bonus.games.length) fail(id, 'bonus.games has a repeat'); }
    }
    if (s.bonus.intro !== undefined && !['drop', 'spin', 'curtain', 'zoom'].includes(s.bonus.intro)) fail(id, "bonus.intro must be 'drop' | 'spin' | 'curtain' | 'zoom'");
  }
  if (s.eggs !== undefined) {                        // section 15: easter eggs
    const ONS = ['page', 'title', 'map', 'win', 'idle'], SOUNDS = ['pop', 'chime', 'whoosh', 'cheer'];
    if (!Array.isArray(s.eggs)) fail(id, 'eggs must be an array');
    else {
      const seen = new Set();
      s.eggs.forEach((e, i) => {
        const w = 'eggs[' + i + ']';
        if (!e || typeof e !== 'object') return fail(id, w + ' must be an object');
        if (typeof e.id !== 'string' || !/^[a-z0-9-]{1,32}$/.test(e.id)) fail(id, w + '.id must be a short kebab-case string');
        else if (seen.has(e.id)) fail(id, w + '.id ' + e.id + ' repeats'); else seen.add(e.id);
        if (!ONS.includes(e.on)) return fail(id, w + '.on must be one of ' + ONS.join(' '));
        if (e.note !== undefined && typeof e.note !== 'string') fail(id, w + '.note must be a string');
        if (e.on === 'page') { if (e.run !== undefined) fail(id, w + ": a page egg has no run (the page calls LAB.egg)"); return; }
        if (typeof e.run !== 'function') return fail(id, w + '.run(fx) must be a function');
        if ((e.on === 'title' || e.on === 'map') && e.taps !== undefined && !(Number.isInteger(e.taps) && e.taps >= 2 && e.taps <= 20)) fail(id, w + '.taps must be an integer 2-20');
        if (e.on === 'win' && e.p !== undefined && !(typeof e.p === 'number' && e.p > 0 && e.p <= 1)) fail(id, w + '.p must be in (0, 1]');
        if (e.on === 'idle' && e.secs !== undefined && !(typeof e.secs === 'number' && e.secs >= 3)) fail(id, w + '.secs must be a number >= 3');
        const fx = { burst(g, x, y) { if (typeof g !== 'string' || !(x >= 0 && x <= 1 && y >= 0 && y <= 1)) fail(id, w + ': fx.burst(glyph, x, y) wants a string and fractions 0-1'); },
          sound(nm) { if (!SOUNDS.includes(nm)) fail(id, w + ': fx.sound(' + nm + ') is not one of ' + SOUNDS.join(' ')); }, shake() {}, pay(p) { if (!(p > 0 && p <= 2000)) fail(id, w + ': fx.pay wants 1-2000 points'); } };
        try { e.run(fx); } catch (x) { fail(id, w + '.run throws: ' + x.message); }
      });
    }
  }
  if (s.intro) {
    if (!Array.isArray(s.intro) || s.intro.length < 3 || s.intro.length > 5) fail(id, 'intro must have 3-5 pages');
    (s.intro || []).forEach((p, i) => { if (!p.title || !p.text) fail(id, 'intro[' + i + '] needs title and text'); svgOk(p.svg, 'intro[' + i + '].svg', id); });
  }
  if (s.bonus && s.bonus.tile) {
    for (let e = 0; e < 4; e++) {
      let t; try { t = s.bonus.tile(100, 80, 18, e, 7); } catch (x) { fail(id, 'bonus.tile throws: ' + x.message); break; }
      if (typeof t !== 'string') { fail(id, 'bonus.tile must return a string'); break; }
      if (!new RegExp('^\\s*<g[^>]*class="tl e' + e + '[" ]').test(t)) fail(id, 'bonus.tile(e=' + e + '): outer <g> must have class="tl e' + e + '"');
      if (!/data-k="7"/.test(t)) fail(id, 'bonus.tile: outer <g> needs data-k');
      if (!/translate\(100[ ,]+80\)/.test(t)) fail(id, 'bonus.tile: outer <g> must translate(x y)');
      if (!/<g class="tin"/.test(t)) fail(id, 'bonus.tile: needs an inner <g class="tin">');
      const open = (t.match(/<g[\s>]/g) || []).length, close = (t.match(/<\/g>/g) || []).length;
      if (open !== close) fail(id, 'bonus.tile: unbalanced <g>');
    }
  }
  if (s.levelMap) {
    const L = s.levelMap, Z = { x0: 18, y0: 100, x1: 382, y1: 500, index: 2, name: 'Lock Harbour', emoji: '⚓', theme: 'harbour', boss: false,
      stops: [[200, 420], [260, 300], [150, 180]], path: 'M18 300Q200 100 382 300Q200 500 18 300Z', rnd: (a, b) => ((Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1 + 1) % 1 };
    const str = (v, where) => { if (typeof v !== 'string') fail(id, 'levelMap.' + where + ' must return a string'); else {
      if (/<script/i.test(v)) fail(id, 'levelMap.' + where + ': no <script>');
      if (/(href|src)="https?:/i.test(v)) fail(id, 'levelMap.' + where + ': no external images');
      const o = (v.match(/<g[\s>]/g) || []).length, c = (v.match(/<\/g>/g) || []).length; if (o !== c) fail(id, 'levelMap.' + where + ': unbalanced <g>'); } };
    const call = (where, fn) => { try { str(fn(), where); } catch (x) { fail(id, 'levelMap.' + where + ' throws: ' + x.message); } };
    if (L.backdrop) call('backdrop', () => L.backdrop(4000, Z.rnd));
    if (L.zone) for (const th of ['cove', 'beach', 'town', 'harbour', 'forest', 'cape', 'reef', 'cave', 'volcano']) call('zone(' + th + ')', () => L.zone(Object.assign({}, Z, { theme: th, boss: th === 'volcano' })));
    if (L.decor) for (const th of ['cove', 'forest', 'volcano']) for (const r of [0.05, 0.4, 0.95]) call('decor', () => L.decor(th, r, 1 - r, Z));
    if (L.sign) call('sign', () => L.sign('⚓ Lock Harbour', 140, Z));
    for (const st of ['locked', 'open', 'beaten', 'current']) if (L.node) call('node(' + st + ')', () => L.node(st, '7.3', st === 'locked' ? -1 : 2, false));
    if (L.node) call('node(boss)', () => L.node('open', '16', 1, true));
    if (L.keepOut) { try { const k = L.keepOut(Z); if (!Array.isArray(k) || k.some(b => !Array.isArray(b) || b.length !== 4 || b.some(v => typeof v !== 'number'))) fail(id, 'levelMap.keepOut must return [[x0,y0,x1,y1], ...]'); } catch (x) { fail(id, 'levelMap.keepOut throws: ' + x.message); } }
    if (L.start) call('start', () => L.start());
    if (L.pin) call('pin', () => L.pin());
    if (L.road) for (const k of ['todo', 'done']) if (L.road[k] && L.road[k].length !== 3) fail(id, 'levelMap.road.' + k + ' needs 3 colours');
    if (L.defs && /id="(?!' + id + ')/.test(L.defs)) { const bad = (L.defs.match(/id="([^"]+)"/g) || []).filter(x => !x.startsWith('id="' + id)); if (bad.length) fail(id, 'levelMap.defs ids must start with the skin id: ' + bad.slice(0, 3).join(' ')); }
  }
  if (s.map) {
    if (s.map.sea && s.map.sea.length !== 9) fail(id, 'map.sea must have 9 colours');
    if (s.map.ramp && s.map.ramp.length !== 4) fail(id, 'map.ramp must have 4 colours');
    if (s.map.cell) {
      const calls = []; const P = new Proxy({}, { get: (_, m) => (...a) => calls.push(m) });
      try { s.map.cell(P, 10, 10, 5); } catch (x) { fail(id, 'map.cell throws: ' + x.message); }
      if (!calls.length) fail(id, 'map.cell drew nothing');
      if (calls.some(m => ['fill', 'stroke', 'fillRect', 'fillText'].includes(m))) fail(id, 'map.cell must only build a path');
    }
  }
}
if (warned) console.log(warned + ' warning(s) (section 13 art; --strict fails on them)');
console.log(bad ? bad + ' problem(s)' : 'all skin specs OK');
process.exit(bad ? 1 : 0);
