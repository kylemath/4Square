// Validates skin specs (SKIN-SPEC.md): node docs/game/tools/skin_check.js [id ...]
// Loads skins/registry.js and every skins/<id>.js, then checks fields and calls every function with sample arguments.
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..', 'skins');
const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(D, 'registry.js'), 'utf8'), ctx);
ctx.FTH_SKINS = ctx.window.FTH_SKINS;
const want = process.argv.slice(2);
const files = fs.readdirSync(D).filter(f => f.endsWith('.js') && f !== 'registry.js' && (!want.length || want.includes(f.replace(/\.js$/, ''))));
let bad = 0; const fail = (id, m) => { bad++; console.log('  FAIL ' + id + ': ' + m); };
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
for (const s of ctx.window.FTH_SKINS.list) {
  const id = s.id; console.log(id + ' (' + s.name + ')');
  if (!s.ic) fail(id, 'missing ic');
  if (s.hud && !['full', 'compact', 'minimal'].includes(s.hud)) fail(id, 'hud must be full | compact | minimal');
  if (s.src && !fs.existsSync(path.join(__dirname, '..', s.src))) fail(id, 'src ' + s.src + ' not found');
  for (const k of Object.keys(s.theme || {})) if (!/^--sk-[a-z-]+$/.test(k)) fail(id, 'theme key ' + k + ' is not --sk-*');
  if (s.title && s.title.svg) svgOk(s.title.svg, 'title.svg', id);
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
console.log(bad ? bad + ' problem(s)' : 'all skin specs OK');
process.exit(bad ? 1 : 0);
