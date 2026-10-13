/* eggs.js: the shell's easter eggs (SKIN-SPEC.md section 15). Loaded by index.html after the skins.
 *
 * A skin declares its eggs in `eggs: [{ id, on, ... }]`. Page eggs (on: 'page') are found by the play page, which calls
 * LAB.egg(id, pts); the shell credits them (index.html, eggPage). The others are run here, on a trigger:
 *   on: 'title'  tap the title art `taps` times (default 5, each tap within 1.2 s of the last)
 *   on: 'map'    tap the level-map "you are here" pin `taps` times
 *   on: 'win'    once per win, with probability `p` (default 0.1), a moment after the win
 *   on: 'idle'   after `secs` seconds (default 20) with no touch on the board, at most once a level
 * and the egg's run(fx) gets:
 *   fx.burst(glyph, x, y)   a glyph leaps out of (x, y), fractions of the screen, with a splash of sparks
 *   fx.sound(name)          'pop' | 'chime' | 'whoosh' | 'cheer'
 *   fx.shake()              a short shake of the screen
 *   fx.pay(pts)             credit points quietly (the shell caps eggs at 2,000 points a level, or a day off-level)
 * An egg is never needed to progress, never explained in text, and never interrupts play (it draws on a layer that takes
 * no input). A throwing run() is caught and logged.
 *
 *   const E = FTH_EGGS.create({ skin: on => spec, sound(name), pay(egg, pts, on), log(egg, on), screen: () => el, reduced: bool });
 *   E.tap('title' | 'map')   E.win()   E.idleStart()   E.idleStop()   E.touch()   E.of(spec, on) -> eggs   E.fx (for tests)
 */
(function () {
  'use strict';
  const ONS = ['page', 'title', 'map', 'win', 'idle'], SOUNDS = ['pop', 'chime', 'whoosh', 'cheer'];
  function create(host) {
    const reduced = !!host.reduced;
    let layer = null;
    const lay = () => {
      if (layer && layer.isConnected) return layer;
      layer = document.createElement('div'); layer.id = 'eggLayer'; layer.setAttribute('aria-hidden', 'true');
      layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:13;overflow:hidden';
      document.body.appendChild(layer); return layer;
    };
    const of = (spec, on) => (spec && Array.isArray(spec.eggs) ? spec.eggs : []).filter(e => e && e.id && e.on === on && (on === 'page' || typeof e.run === 'function'));
    function burst(glyph, x, y) {
      const L = lay(), W = innerWidth, H = innerHeight, px = Math.max(0, Math.min(1, +x || .5)) * W, py = Math.max(0, Math.min(1, +y || .5)) * H;
      const g = document.createElement('div'); g.textContent = String(glyph || '✨').slice(0, 4);
      g.style.cssText = 'position:absolute;left:0;top:0;font-size:64px;line-height:1;will-change:transform;filter:drop-shadow(0 5px 0 rgba(28,22,64,.35))';
      L.appendChild(g);
      const T = (dx, dy, s, r) => 'translate(' + (px - 32 + dx) + 'px,' + (py - 32 + dy) + 'px) scale(' + s + ') rotate(' + r + 'deg)';
      const up = Math.min(220, H * .28), side = (px < W / 2 ? 1 : -1) * Math.min(120, W * .25);
      if (reduced) { g.animate([{ transform: T(0, 0, 1, 0), opacity: 0 }, { opacity: 1, offset: .3 }, { transform: T(0, 0, 1, 0), opacity: 0 }], { duration: 1200 }); setTimeout(() => g.remove(), 1250); return; }
      g.animate([
        { transform: T(0, 40, .3, -30), opacity: 0 },
        { transform: T(side * .35, -up * .8, 1.15, -12), opacity: 1, offset: .3 },
        { transform: T(side * .6, -up, 1, 8), offset: .5 },
        { transform: T(side, 10, .9, 40), opacity: 1, offset: .85 },
        { transform: T(side * 1.05, 40, .5, 60), opacity: 0 },
      ], { duration: 1500, easing: 'cubic-bezier(.3,.7,.5,1)', fill: 'forwards' });
      setTimeout(() => g.remove(), 1550);
      const spark = (t0, cx, cy, n) => setTimeout(() => {
        for (let i = 0; i < n; i++) {
          const d = document.createElement('i'), a = -Math.PI / 2 + (i / (n - 1) - .5) * 2.4, r = 40 + Math.random() * 50, s = 7 + Math.random() * 7;
          d.style.cssText = 'position:absolute;left:' + (cx - s / 2) + 'px;top:' + (cy - s / 2) + 'px;width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' +
            ['#fff', '#7fd6ff', '#ffd84a'][i % 3] + ';border:2px solid #1c1640';
          L.appendChild(d);
          d.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * r + 'px,' + (Math.sin(a) * r * .8) + 'px) scale(1)', opacity: 1, offset: .5 }, { transform: 'translate(' + Math.cos(a) * r * 1.2 + 'px,' + (Math.sin(a) * r * .8 + 60) + 'px) scale(.3)', opacity: 0 }], { duration: 800, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'forwards' });
          setTimeout(() => d.remove(), 850);
        }
      }, t0);
      spark(0, px, py + 20, 9); spark(1250, px + side, py + 20, 7);
    }
    function shake() {
      const el = (host.screen && host.screen()) || document.body; if (reduced || !el.animate) return;
      el.animate([{ transform: 'none' }, { transform: 'translate(-7px, 2px) rotate(-.6deg)' }, { transform: 'translate(6px, -2px) rotate(.5deg)' }, { transform: 'translate(-4px, 1px)' }, { transform: 'translate(3px, 0)' }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
    }
    function fxFor(egg, on) {
      return {
        burst, shake,
        sound: name => { if (SOUNDS.includes(name) && host.sound) try { host.sound(name); } catch (e) {} },
        pay: pts => { if (host.pay && +pts > 0) host.pay(egg, Math.round(+pts), on); },
      };
    }
    function run(egg, on) {
      if (host.log) host.log(egg, on);
      try { egg.run(fxFor(egg, on)); } catch (e) { console.warn('egg ' + egg.id + ': ' + e.message); }
    }
    // taps: one counter per trigger, reset after a 1.2 s pause
    const taps = {};
    function tap(on) {
      const t = performance.now(), c = taps[on] = taps[on] && t - taps[on].t < 1200 ? { n: taps[on].n + 1, t } : { n: 1, t };
      const eggs = of(host.skin(on), on), n = c.n;
      eggs.forEach(egg => { if (n === (egg.taps || 5)) run(egg, on); });
      if (!eggs.length || n >= Math.max(...eggs.map(e => e.taps || 5))) c.n = 0;     // all fired: count again from zero
      return n;
    }
    function win() {
      of(host.skin('win'), 'win').forEach(egg => { if (Math.random() < (egg.p === undefined ? .1 : +egg.p)) setTimeout(() => run(egg, 'win'), reduced ? 0 : 1800); });
    }
    let idleT = [], idleDone = new Set(), idleOn = false;
    const idleArm = () => {
      idleT.forEach(clearTimeout); idleT = [];
      if (!idleOn) return;
      of(host.skin('idle'), 'idle').forEach(egg => { if (!idleDone.has(egg.id)) idleT.push(setTimeout(() => { if (!idleOn || document.hidden) return; idleDone.add(egg.id); run(egg, 'idle'); }, 1000 * Math.max(3, +egg.secs || 20))); });
    };
    return {
      of, tap, win, fx: fxFor({ id: 'test' }, 'test'),
      idleStart() { idleOn = true; idleDone = new Set(); idleArm(); },     // a level started (each idle egg once a level)
      idleStop() { idleOn = false; idleArm(); },
      touch() { if (idleOn) idleArm(); },
    };
  }
  window.FTH_EGGS = { create, ONS, SOUNDS };
})();
