// Star contrast (SKIN-SPEC 3b): node docs/game/tools/contrast_check.js [id ...]
// For every skin, computes the WCAG contrast of the earned and unearned star colours against the chips that hold them
// (the star meter bar and the level-map star chip; gradient and translucent chips are checked at every stop over every
// backdrop they can sit on) and fails when a star is under 3:1 (non-text contrast, WCAG 1.4.11).
//   --sk-star-on (fill) and --sk-star-edge (outline) of an earned star: at least one reads at 3:1 against the chip
//   --sk-star-off (fill / the level-map glyph) and --sk-star-off-edge (outline) of an unearned star: both at 3:1
//   unearned must stay quieter than earned: its fill must differ from --sk-star-on (contrast between them >= 1.25
//   or a clearly different hue) so "earned" vs "unearned" still reads.
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..', 'skins');
const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(D, 'registry.js'), 'utf8'), ctx); ctx.FTH_SKINS = ctx.window.FTH_SKINS;
const ext = f => /FTH_SKINS\.extend\(/.test(fs.readFileSync(path.join(D, f), 'utf8'));
for (const f of fs.readdirSync(D).filter(f => f.endsWith('.js') && f !== 'registry.js').sort((a, b) => ext(a) - ext(b))) vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
const want = process.argv.slice(2);

// ---- colour maths
const lin = c => (c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const COLOUR = /#[0-9a-f]{8}\b|#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)/gi;
function parse(s) {
  s = s.trim();
  if (s[0] === '#') { let h = s.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h.slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1]; }
  const m = s.match(/rgba?\(([^)]*)\)/i); if (!m) return null;
  const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}
const stops = v => (String(v || '').match(COLOUR) || []).map(parse).filter(Boolean);
const over = (f, b) => [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 24) return -1; const d = mx - mn; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
const hx = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

let bad = 0; const fail = (id, m) => { bad++; console.log('  FAIL ' + id + ': ' + m); };
const rows = [];
for (const s of ctx.window.FTH_SKINS.list) {
  const id = s.id; if (want.length && !want.includes(id)) continue;
  const T = Object.assign({}, ctx.window.FTH_SKINS.get('islands').theme, s.theme || {});
  // the chips that hold stars, each as a list of solid backgrounds it can show (translucent chips over every backdrop)
  const backdrops = stops(T['--sk-bg']).concat(stops(T['--sk-hud'])).map(c => over(c, [255, 255, 255]));
  const solid = (v, back) => stops(v).map(c => c[3] < 1 ? (back.length ? back : [[255, 255, 255, 1]]).map(b => over(c, b)) : [c]).flat();
  let chips;
  if (id === 'islands') {   // the shell's own bars: rgba(18,22,70,.55) over the navy HUD; the level-map chip is #1c1640
    const hud = solid(T['--sk-hud'], [[58, 166, 240, 1]]);
    chips = { 'star bar': hud.map(h => over([18, 22, 70, 0.55], h)), 'map chip': [parse('#1c1640')] };
  } else {
    const chip = T['--sk-chip'] || T['--sk-card'];
    const bg = solid(chip, backdrops); chips = { 'star bar': bg, 'map chip': bg };
  }
  const tok = k => T[k] ? stops(T[k])[0] : null;
  const on = tok('--sk-star-on'), edge = tok('--sk-star-edge'), off = tok('--sk-star-off'), offE = tok('--sk-star-off-edge');
  if (!on || !edge || !off || !offE) { fail(id, 'missing star tokens (--sk-star-on, --sk-star-edge, --sk-star-off, --sk-star-off-edge)'); continue; }
  const lo = (c, list) => Math.min(...list.map(b => ratio(c, b)));
  for (const [name, list] of Object.entries(chips)) {
    const r = { on: lo(on, list), edge: lo(edge, list), off: lo(off, list), offE: lo(offE, list) };
    rows.push([id, name, r.on, r.edge, r.off, r.offE]);
    if (Math.max(r.on, r.edge) < 3) fail(id, name + ': earned star reads ' + Math.max(r.on, r.edge).toFixed(2) + ':1 (< 3)');
    if (r.off < 3) fail(id, name + ': unearned star fill ' + hx(off) + ' reads ' + r.off.toFixed(2) + ':1 (< 3)');
    if (r.offE < 3) fail(id, name + ': unearned star edge ' + hx(offE) + ' reads ' + r.offE.toFixed(2) + ':1 (< 3)');
  }
  const d = ratio(on, off), sameHue = hue(on) >= 0 && hue(off) >= 0 && Math.abs(hue(on) - hue(off)) < 25;
  if (d < 1.25 && sameHue) fail(id, 'unearned star fill ' + hx(off) + ' is too close to the earned ' + hx(on) + ' (' + d.toFixed(2) + ':1, same hue)');
}
const f2 = v => v.toFixed(2).padStart(5);
console.log('skin       chip      earned fill  earned edge  unearned fill  unearned edge   (contrast vs chip, worst case; need >= 3 where it counts)');
for (const r of rows) console.log(r[0].padEnd(10) + ' ' + r[1].padEnd(9) + ' ' + f2(r[2]) + '        ' + f2(r[3]) + '        ' + f2(r[4]) + '          ' + f2(r[5]));
console.log(bad ? bad + ' problem(s)' : 'star contrast OK');
process.exit(bad ? 1 : 0);
