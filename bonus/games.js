// 4square bonus games (SKIN-SPEC.md section 6): five short Kempe-flavoured mini-games for the win card. window.FTH_BONUS.
//
// The shell (index.html, "bonus round") picks one game per win from the skin's bonus.games (default all five, never the same
// one twice in a row), builds the header (the skin's bonus.label, pips, a timer ring, skip) and the play area, and hands the game
// a host object H (below). The game draws with the skin's gem art (H.gem = bonus.tile, or the shell's hex tile) and pays through
// H.pay, which pops a coin stack (the skin's #coinG), credits the points and flies the coins into the win total. No game shows
// any text other than numbers ("+12", "x3"): each is taught by ONE ghost-finger cue that loops until the first touch.
// Every game is a Kempe game: the pieces you take must alternate two elements (a, b, a, b...).
//
// ECONOMY. Points are the shell's unit (coins = points x the skin's rate). ECON.coin = 20 points a coin (the old 9 x 7 round
// paid 10 a coin, but its board had three times the gems). The old round paid about 460 points typical, 830 best;
// `node tools/bonus_boards.js` checks each game's `econ` band below against it (typical within 60-140%, best within 60-150%).
//
// RULES AND PAY, per game (id: classic, time, lives/chains):
//   chain  match-drag, no clock for the round, 3 chains. A 5 x 4 hex board of 20 big gems (3 elements: the honeycomb; 4: an
//          annealed board from B4, both validated by tools/bonus_boards.js; either may be turned 180 degrees). Every gem hides a
//          coin stack of 1 / 3 / 5 coins (78 / 17 / 5 %). Drag a path that alternates two elements; the moment it is 2 gems long
//          both gems reveal, then one more per step. A chain ends on lift, at a dead end, or when its 5 s clock (armed at 2 gems,
//          the ring) runs out; its gems are spent. A wrong step only shakes. Pay: the revealed stacks (mean 1.54 coins a gem).
//   snake  Snake, 16 s, 2 runs. A 7 x 6 field (wraps at the edges). The snake's body is the chain it ate: it may only eat the
//          element that alternates with its last bite (those gems bob and glow; the rest are flat). A wrong bite or biting itself
//          ends the run (the next run starts in the middle). Steer by swiping anywhere, tapping beside the head, or the arrow keys.
//          It waits for the first touch (and again after a crash), then speeds up as it grows. Pay: 1 coin a bite, +1 coin on every 4th bite of a run.
//   hop    Frogger, 20 s, 3 lives. Five lanes of gems slide sideways (alternate directions, faster further up). Tap to hop up one
//          lane: you must land on a gem of the element that alternates with your last (they glow); a gap, a wrong gem or riding
//          off the edge costs a life and you start again at the bottom. Reaching the far bank is a crossing. Pay: 1 coin a
//          landing, 5 coins a crossing.
//   stack  Tetris, 18 s, 3 lives. Gems fall one at a time into a 4-wide, 6-high well (the next one waits beside it). Tap a column
//          to drop it there. A gem must not land on its own element (a clash shatters it: a life); a full column costs a life
//          too. A full row of two alternating elements is a Kempe row: it clears and pays 5 coins, +1 for every Kempe row before
//          it this round; any other full row clears for 1 coin (so the well never jams). Gems are mostly the round's two elements.
//   pop    whack-a-mole, 16 s, 3 lives. Gems pop out of 12 holes and sink again. Tap only gems that continue the run: the first
//          any element, the second a different one (that sets the pair), then alternating. A wrong tap breaks the run and costs
//          a life; letting gems go is free. Pay: tap n of a run pays 6 x min(n, 8) points (the run is the multiplier, shown "xn").
//
// HOST API (H), what a game may use:
//   H.root            the game's SVG <g> (viewBox 0 0 w h, from the game's w and h)       H.w, H.h
//   H.gem(x, y, r, e, k) -> markup of one gem (the skin's bonus.tile contract)           H.stack(k) -> a stack of k coins (#coinG)
//   H.put(parent, markup) -> the first element inserted                                    H.ncol (3 or 4), H.perm (elements, shuffled)
//   H.rnd() in [0, 1)   H.reduced (prefers-reduced-motion)   H.line (the skin's trace colour)   H.neon[e]
//   H.on(fn(type, p, ev))  type 'down' | 'move' | 'up', p = {x, y} in viewBox units          H.key(fn(dir))  dir [dx, dy]
//   H.loop(fn(dt, now))  per frame while the round is live (dt in s, clamped)                H.later(fn, ms) (cleared with the round)
//   H.clock(sec, onEnd)  run the header ring (H.clock(0) stops it)                           H.pips(['on' | 'done' | '', ...])
//   H.pay(points, x, y, {k, el, mult, n})  credit + coin flight (k: stack size to pop; el: the game's own coin element)
//   H.float(x, y, text)  H.burst(x, y, colour, n)  H.pop(el, scale)  H.shake(px)
//   H.sfx.step(n) rising note, .pop(n), .bad(), .land(), .chime(), .whoosh(), .combo(n)
//   H.ghost('drag' | 'swipe' | 'tap', [[x, y], ...])  the teaching finger, until the first touch; H.ghostOff()
//   H.log(type, data)  research log event           H.end(info)  the round is over        H.alive()
// A game is { w, h, pips, create(H) -> { go(), halt(), log: { map, state, board } } }: create draws the board (idle), go starts play.
(function () {
  'use strict';
  const IDS = ['chain', 'snake', 'hop', 'stack', 'pop'];
  const ECON = {
    coin: 20,                                                   // points a coin
    stacks: [1, 3, 5], odds: [.78, .95, 1],                     // chain: hidden stack sizes and their cumulative odds
    roll(r) { const x = (r || Math.random)(); return this.stacks[this.odds.findIndex(o => x < o)]; },
  };
  const MEAN = ECON.stacks.reduce((a, s, i) => a + s * (ECON.odds[i] - (i ? ECON.odds[i - 1] : 0)), 0);
  // payout bands in points (checked by tools/bonus_boards.js): typical = a decent first try, best = a near-perfect round
  const econ = {
    chain: { typical: 15 * MEAN * ECON.coin, best: 20 * MEAN * ECON.coin, rule: '3 chains on 20 gems, ~15 revealed typical, all 20 best' },
    snake: { typical: (13 + 3) * ECON.coin, best: (32 + 8) * ECON.coin, rule: '1 coin a bite, +1 every 4th; ~13 bites typical, 32 (a bot) best' },
    hop: { typical: (10 + 5 * 2) * ECON.coin, best: (18 + 5 * 3) * ECON.coin, rule: '1 coin a landing, 5 a crossing; 10 + 2 typical, 18 + 3 best' },
    stack: { typical: (5 + 6 + 7 + 1) * ECON.coin, best: (5 + 6 + 7 + 8 + 9 + 10 + 5) * ECON.coin, rule: 'Kempe row 5 coins +1 each, other rows 1; 3 Kempe rows typical, 6 + 5 others (a bot) best' },
    pop: { typical: 6 * (36 + 21), best: 6 * (36 + 16 * 8), rule: 'tap n of a run pays 6 x min(n,8); runs 8+6 typical, one run of 24 (a bot) best' },
  };
  const q1 = v => Math.round(v * 10) / 10;
  const mod = (a, k) => ((a % k) + k) % k;
  const T = (x, y, s) => 'translate(' + q1(x) + ' ' + q1(y) + ')' + (s != null && s !== 1 ? ' scale(' + (Math.round(s * 100) / 100) + ')' : '');
  const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // a cute pair of eyes for the snake's head and the hopper, looking along (dx, dy); drawn on top of a gem of radius r
  const eyes = (r, dx, dy) => { const ex = r * .34, ey = r * .3, px = dx * r * .1, py = dy * r * .1; let s = '<g class="beyes">';
    [-1, 1].forEach(sg => { const x = dy ? sg * ex : dx * ex * .2, y = dy ? dy * ey * .2 : sg * ey; s += '<circle cx="' + q1(x + dx * r * .18) + '" cy="' + q1(y - r * .12 + dy * r * .18) + '" r="' + q1(r * .24) + '" fill="#fff" stroke="#1c1640" stroke-width="' + q1(r * .08) + '"/><circle cx="' + q1(x + dx * r * .18 + px) + '" cy="' + q1(y - r * .12 + dy * r * .18 + py) + '" r="' + q1(r * .11) + '" fill="#1c1640"/>'; });
    return s + '</g>'; };

  // ---------------------------------------------------------------- chain: the board
  const BOARD = { cols: 5, rows: 4, s: 62 };
  const N = BOARD.cols * BOARD.rows;
  const ax = i => { const c = i % BOARD.cols, r = (i / BOARD.cols) | 0; return [c - (r >> 1), r]; };   // odd rows shifted right
  const NB = (() => { const at = new Map(), out = []; for (let i = 0; i < N; i++) at.set(ax(i).join(), i);
    for (let i = 0; i < N; i++) { const [q, r] = ax(i); out.push([[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => at.get((q + a) + ',' + (r + b))).filter(j => j !== undefined)); }
    return out; })();
  const honey = off => Array.from({ length: N }, (_, i) => { const [q, r] = ax(i); return mod(q - r + off, 3); }).join('');
  // 4-element boards: node tools/bonus_boards.js --gen (proper; every pair has a chain of 4+, three pairs one of 6+)
  const B4 = ["21310320311012032312","12320010311231201231","12023031023123103023","20230310130232010132","32030132122013032021","13203013123202003132","31202031303120220130","10213213021302301312"];
  const hexAt = i => { const c = i % BOARD.cols, r = (i / BOARD.cols) | 0, s = BOARD.s; return [s / 2 + 6 + (c + (r & 1) / 2) * s, s / 2 + 6 + r * s * .866]; };
  const CW = q1((BOARD.cols + .5) * BOARD.s + 12), CH = q1((BOARD.rows - 1) * BOARD.s * .866 + BOARD.s + 12);
  let lastB4 = -1;

  const chain = {
    w: CW, h: CH, pips: 3,
    create(H) {
      const rot = H.rnd() < .5, ncol = H.ncol;
      let id, pat;
      if (ncol === 3) { const off = Math.floor(H.rnd() * 3); id = 'hc' + off; pat = honey(off); }
      else { let k = Math.floor(H.rnd() * B4.length); if (k === lastB4) k = (k + 1) % B4.length; lastB4 = k; id = 'b4:' + k; pat = B4[k]; }
      const E = [], C = [];
      for (let i = 0; i < N; i++) { E.push(H.perm[+pat[rot ? N - 1 - i : i]]); C.push(ECON.roll(H.rnd)); }
      const R = BOARD.s * .47;
      let s = '';
      for (let i = 0; i < N; i++) { const [x, y] = hexAt(i); s += H.gem(q1(x), q1(y), R, E[i], i); }
      s += '<polyline class="bglow" points=""/><polyline class="bline" points=""/>';
      for (let i = 0; i < N; i++) { const [x, y] = hexAt(i); s += '<g class="bcoin" data-c="' + i + '" transform="' + T(x, y) + '"><g class="bcin">' + H.stack(C[i]) + '</g></g>'; }   // hidden until a chain reveals them
      H.root.insertAdjacentHTML('beforeend', s);
      const tl = i => H.root.querySelector('.tl[data-k="' + i + '"]'), cn = i => H.root.querySelector('.bcoin[data-c="' + i + '"]');
      const me = { path: [], pair: null, used: new Set(), ch: 1, chains: [], live: false, down: false, ended: false, bad: -1, cgot: 0, done: false };
      const pips = () => H.pips([0, 1, 2].map(i => me.done || i < me.ch - 1 ? 'done' : i === me.ch - 1 ? 'on' : ''));
      pips();
      const hit = p => { let best = -1, bd = BOARD.s * .5; for (let i = 0; i < N; i++) { const [x, y] = hexAt(i), d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = i; } } return best; };
      const ok = (end, j) => !me.used.has(j) && !me.path.includes(j) && NB[end].includes(j) && E[j] !== E[end] && (!me.pair || me.pair.includes(E[j]));
      const moves = () => { const end = me.path[me.path.length - 1]; return NB[end].some(j => ok(end, j)); };
      const mark = (i, on) => { const g = tl(i); if (g) { g.classList.toggle('lit', on); g.classList.toggle('glow', on); } };
      const shake = i => { const g = tl(i), t = g && g.querySelector('.tin'); if (t && !H.reduced && t.animate) t.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 260 }); H.sfx.bad(); };
      const line = () => {
        const pts = me.path.length > 1 ? me.path.map(i => hexAt(i).map(q1).join(',')).join(' ') : '';
        H.root.querySelector('.bglow').setAttribute('points', pts); H.root.querySelector('.bline').setAttribute('points', pts);
        if (me.pair) H.root.querySelector('.bglow').style.stroke = H.line || H.neon[me.pair[0]];
      };
      const reveal = (i, n) => { const [x, y] = hexAt(i), k = C[i], cg = cn(i); me.cgot += ECON.coin * k; H.pay(ECON.coin * k, x, y, { el: cg, mult: k > 1 ? k : 0, n }); };
      // the chosen next steps glow: neighbours of the end that continue the chain
      const hints = () => { H.root.querySelectorAll('.tl.ok').forEach(g => g.classList.remove('ok')); if (!me.path.length || me.ended) return; const end = me.path[me.path.length - 1]; NB[end].forEach(j => { if (ok(end, j)) { const g = tl(j); if (g) g.classList.add('ok'); } }); };
      function add(i) {
        const p = me.path; p.push(i); me.bad = -1; H.log('b_step', { i, e: E[i], n: p.length, ch: me.ch });
        H.root.querySelectorAll('.tl.glow').forEach(t => t.classList.remove('glow'));
        const g = tl(i); g.classList.add('lit', 'glow'); H.pop(g, 1.35); H.ghostOff();
        if (p.length === 1) { H.sfx.step(0); hints(); return; }
        if (p.length === 2) { me.pair = [E[p[0]], E[p[1]]]; reveal(p[0], 1); H.later(() => reveal(p[1], 2), H.reduced ? 0 : 110); H.clock(5, () => end('time')); }
        else reveal(i, p.length);
        line(); hints();
        if (!moves()) { me.ended = true; me.down = false; H.shake(4); H.later(() => end('dead'), 600); }
      }
      function tryStep(i) {
        const p = me.path, last = p[p.length - 1];
        if (i === last || p.includes(i)) { me.bad = -1; return; }
        if (ok(last, i)) { add(i); return; }
        if (me.bad === i) return; me.bad = i;            // a wrong gem: shake + buzz once per visit; the chain is not broken
        H.log('b_refuse', { i, e: E[i], adj: NB[last].includes(i), ch: me.ch, spent: me.used.has(i) });
        shake(i);
      }
      function end(why) {
        if (me.done || (!me.path.length && why !== 'skip')) return;
        H.clock(0); me.down = false; me.ended = true;
        const n = me.path.length, got = me.cgot, ch = me.ch;
        me.chains.push({ n, got, why }); H.log('b_chain', { ch, n, got, why });
        me.path.forEach(i => { me.used.add(i); const g = tl(i); if (g) { g.classList.remove('glow'); g.classList.add('lit', 'spent'); } });
        me.path = []; me.pair = null; me.cgot = 0; line(); hints();
        if (n >= 4) { const [x, y] = hexAt(n ? [...me.used].pop() : 0); H.burst(x, y, '#ffd84a', 10); H.sfx.combo(n); }
        if (ch >= 3 || me.used.size >= N - 1) { finish(); return; }
        me.ch++; pips(); H.sfx.chime();
        H.later(() => { if (!me.done) me.ended = false; }, 450);
      }
      function finish() {
        if (me.done) return; me.done = true; me.live = false; H.clock(0); pips();
        H.later(() => H.root.querySelectorAll('.bcoin').forEach(c => { if (!c.classList.contains('show')) c.classList.add('ghost'); }), H.reduced ? 0 : 900);   // what you missed
        H.end({ chains: me.chains, n: me.chains.reduce((a, c) => a + c.n, 0) });
      }
      H.on((type, p) => {
        if (!me.live || me.done) return;
        if (type === 'down') { if (me.ended) return; me.down = true; me.bad = -1; const i = hit(p); if (i < 0) return; if (me.used.has(i)) { shake(i); return; } if (!me.path.length) add(i); else tryStep(i); }
        else if (type === 'move') { if (me.down && !me.ended && me.path.length) { const i = hit(p); if (i >= 0) tryStep(i); } }
        else if (type === 'up') {
          if (!me.down) return; me.down = false; H.log('b_lift', { n: me.path.length, ch: me.ch });
          if (me.ended) return;
          if (me.path.length >= 2) end('lift');
          else if (me.path.length) { me.path.forEach(i => mark(i, false)); me.path = []; line(); hints(); }   // a lone touch costs nothing
        }
      });
      // the ghost finger drags along the start of a real chain from the corner
      const demo = () => { const a = E[0], b = E[NB[0].find(j => E[j] !== a)], sn = [0];
        while (sn.length < 4) { const u = sn[sn.length - 1], v = NB[u].find(j => !sn.includes(j) && (E[j] === a || E[j] === b) && E[j] !== E[u]); if (v === undefined) break; sn.push(v); }
        return sn.map(hexAt); };
      return {
        log: { map: 'bonus' + ncol, state: E.join(''), board: id + (rot ? 'r' : '') },
        go() { me.live = true; H.ghost('drag', demo()); },
        halt() { if (me.path.length >= 2 && !me.ended) me.chains.push({ n: me.path.length, got: me.cgot, why: 'skip' }); me.done = true; me.live = false; },
        dbg: () => ({ E, C, used: [...me.used], ch: me.ch, path: me.path.slice(), done: me.done }),   // test hook (tools: driving the games)
      };
    },
  };

  // ---------------------------------------------------------------- snake
  const SN = { cols: 7, rows: 6, s: 48 };
  const snake = {
    w: SN.cols * SN.s, h: SN.rows * SN.s, pips: 2, time: 16,
    create(H) {
      const S = SN.s, NC = SN.cols, NR = SN.rows, els = H.perm.slice(0, H.ncol), a = els[0], b = els[1], others = els.slice(2);
      const cx = c => S / 2 + c * S, cy = r => S / 2 + r * S, RB = S * .36, RH = S * .5, RG = S * .4;
      let bg = '<g class="bgrid">'; for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) bg += '<rect x="' + (c * S + 2) + '" y="' + (r * S + 2) + '" width="' + (S - 4) + '" height="' + (S - 4) + '" rx="10" class="' + ((r + c) & 1 ? 'c1' : 'c0') + '"/>';
      H.root.insertAdjacentHTML('beforeend', bg + '</g><g class="bfield"></g><g class="bsnake"></g>');
      const gF = H.root.querySelector('.bfield'), gS = H.root.querySelector('.bsnake');
      const me = { live: false, done: false, lives: 2, bites: 0, runBites: 0, acc: 0, step: .25, dir: [1, 0], q: [], body: [], prev: [], eL: [], need: b, dead: false, k: 0, runs: [] };
      const field = new Map(), key = (c, r) => c + ',' + r;
      const pips = () => H.pips([0, 1].map(i => i < me.lives ? 'on' : 'done'));
      pips();
      const onSnake = (c, r) => me.body.some(([x, y]) => x === c && y === r);
      function spawn(e) {
        const [hc, hr] = me.body[0] || [3, 2], free = [];
        for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
          if (field.has(key(c, r)) || onSnake(c, r)) continue;
          if (Math.abs(c - hc) + Math.abs(r - hr) < 2) continue;                       // never right under the nose
          if (r === hr && mod((c - hc) * me.dir[0], NC) <= 2 && me.dir[0]) continue;   // nor just ahead
          if (c === hc && mod((r - hr) * me.dir[1], NR) <= 2 && me.dir[1]) continue;
          free.push([c, r]);
        }
        if (!free.length) return;
        const [c, r] = free[Math.floor(H.rnd() * free.length)], g = H.put(gF, '<g class="pc" transform="' + T(cx(c), cy(r)) + '">' + H.gem(0, 0, RG, e, 's' + (me.k++)) + '</g>');
        field.set(key(c, r), { c, r, e, g }); H.pop(g, 1.4); paint();
      }
      function refill() {                                   // keep 2+ of the needed element and 2+ of the other pair element on the field
        const cnt = e => [...field.values()].filter(x => x.e === e).length;
        const nxt = me.need === a ? b : a;
        for (let k = 0; k < 4 && cnt(me.need) < 2 && field.size < 12; k++) spawn(me.need);   // bounded: a crowded field just stays short
        for (let k = 0; k < 4 && cnt(nxt) < 2 && field.size < 12; k++) spawn(nxt);
        for (let k = 0; k < 8 && field.size < 8; k++) spawn(others.length && H.rnd() < .6 ? others[Math.floor(H.rnd() * others.length)] : (H.rnd() < .5 ? a : b));
      }
      function paint() { field.forEach(x => { const t = x.g.firstElementChild; const ok = x.e === me.need && !me.dead; t.classList.toggle('ok', ok); t.classList.toggle('glow', ok); t.classList.toggle('no', !ok); }); }
      function drawSnake() {                                // rebuilt when the chain changes (a bite); positions update every frame
        let s = '';
        for (let i = me.body.length - 1; i >= 0; i--) {
          const r = i ? RB * Math.max(.72, 1 - i * .03) : RH;
          s += '<g class="pc seg" data-i="' + i + '">' + H.gem(0, 0, r, me.eL[i], 'n' + i) + (i ? '' : eyes(r, me.dir[0], me.dir[1])) + '</g>';
        }
        // the body: a fat outlined tube through the segments (broken where it wraps an edge), the gems ride on it
        gS.innerHTML = '<path class="btube0" stroke-width="' + q1(S * .62) + '"/><path class="btube" stroke-width="' + q1(S * .46) + '"/>' + s; place(1);
      }
      function place(f) {
        const pts = [];
        gS.querySelectorAll('.seg').forEach(g => {
          const i = +g.dataset.i, [c1, r1] = me.body[i], [c0, r0] = me.prev[i] || me.body[i];
          const wrap = Math.abs(c1 - c0) > 1 || Math.abs(r1 - r0) > 1, t = wrap ? 1 : f, x = cx(c0 + (c1 - c0) * t), y = cy(r0 + (r1 - r0) * t);
          g.setAttribute('transform', T(x, y)); pts[i] = [x, y];
        });
        let d = ''; pts.forEach((p, i) => { d += (i && Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) < S * 1.2 ? 'L' : 'M') + q1(p[0]) + ' ' + q1(p[1]); });
        gS.querySelectorAll('.btube0, .btube').forEach(t => t.setAttribute('d', d));
      }
      function reset() {
        me.body = [[3, 2], [2, 2]]; me.prev = me.body.map(p => p.slice()); me.eL = [a, b]; me.need = b; me.dir = [1, 0]; me.q = []; me.acc = 0; me.dead = false; me.runBites = 0; me.go = false;
        [...field.values()].forEach(x => { if (x.r === 2 || Math.abs(x.r - 2) + Math.abs(x.c - 3) < 3) { x.g.remove(); field.delete(key(x.c, x.r)); } });
        drawSnake(); refill(); paint();
      }
      function turn(d) {
        if (!me.live || me.dead) return;
        me.go = true; H.ghostOff();
        const last = me.q.length ? me.q[me.q.length - 1] : me.dir;
        if ((d[0] === last[0] && d[1] === last[1]) || (d[0] === -last[0] && d[1] === -last[1])) return;
        if (me.q.length < 2) me.q.push(d);
      }
      function step() {
        if (me.q.length) { me.dir = me.q.shift(); const hd = gS.querySelector('.seg[data-i="0"] .beyes'); if (hd) { hd.outerHTML = eyes(RH, me.dir[0], me.dir[1]); } }
        const [hc, hr] = me.body[0], nc = mod(hc + me.dir[0], NC), nr = mod(hr + me.dir[1], NR), gem = field.get(key(nc, nr));
        const grow = gem && gem.e === me.need;
        const tailFree = !grow;                             // the tail moves away this step unless we grow
        if (me.body.some(([x, y], i) => x === nc && y === nr && !(tailFree && i === me.body.length - 1))) { crash('self', nc, nr); return; }
        if (gem && !grow) { crash('wrong', nc, nr, gem); return; }
        me.prev = me.body.map(p => p.slice());
        me.body.unshift([nc, nr]);
        if (grow) {
          me.prev.push(me.prev[me.prev.length - 1]);
          me.eL.unshift(gem.e);
          if (me.body.length > 14) { me.body.pop(); me.prev.pop(); me.eL.pop(); }   // the snake stops growing at 14: the field stays open me.need = gem.e === a ? b : a; me.bites++; me.runBites++;
          field.delete(key(nc, nr)); gem.g.remove();
          const x = cx(nc), y = cy(nr), combo = me.runBites % 4 === 0;
          H.burst(x, y, H.neon[gem.e], 8); H.sfx.step(me.runBites);
          H.pay(ECON.coin * (combo ? 2 : 1), x, y, { k: combo ? 2 : 1, mult: combo ? me.runBites : 0, n: me.runBites });
          if (combo) { H.sfx.combo(me.runBites); H.shake(3); }
          H.log('b_bite', { e: gem.e, n: me.bites });
          me.step = Math.max(.15, .25 - .006 * me.runBites);
          drawSnake(); refill(); paint();
        } else { me.body.pop(); }
      }
      function crash(why, c, r, gem) {
        me.dead = true; me.lives--; pips(); H.sfx.bad(); H.shake(8); H.log('b_crash', { why, n: me.runBites });
        me.runs.push({ n: me.runBites, why });
        if (gem) { const t = gem.g.querySelector('.tin'); if (t && t.animate && !H.reduced) t.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35) rotate(12deg)' }, { transform: 'scale(1)' }], { duration: 380 }); }
        gS.querySelectorAll('.seg').forEach((g, i) => { g.firstElementChild.classList.add('spent'); if (g.animate && !H.reduced) g.animate([{ opacity: 1 }, { opacity: .25 }], { duration: 500, delay: i * 25, fill: 'forwards' }); });
        paint();
        if (me.lives > 0) H.later(() => { if (!me.done) reset(); }, 900);
        else H.later(finish, 700);
      }
      function finish() { if (me.done) return; if (!me.dead) me.runs.push({ n: me.runBites, why: 'time' }); me.done = true; me.live = false; H.clock(0); H.end({ bites: me.bites, runs: me.runs }); }
      let p0 = null, swiped = false;
      H.on((type, p) => {
        if (!me.live) return;
        if (type === 'down') { p0 = p; swiped = false; if (!me.dead) me.go = true; }   // the snake waits, breathing, for the first touch
        else if (type === 'move' && p0) { const dx = p.x - p0.x, dy = p.y - p0.y; if (Math.hypot(dx, dy) > 16) { turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]); p0 = p; swiped = true; } }
        else if (type === 'up') {
          if (p0 && !swiped) {                            // a tap beside the head turns towards it
            const [hc, hr] = me.body[0], dx = p.x - cx(hc), dy = p.y - cy(hr), d = me.q.length ? me.q[me.q.length - 1] : me.dir;
            if (d[0]) { if (Math.abs(dy) > S * .4) turn([0, Math.sign(dy)]); } else if (Math.abs(dx) > S * .4) turn([Math.sign(dx), 0]);
          }
          p0 = null;
        }
      });
      H.key(turn);
      H.loop(dt => {
        if (!me.live || me.dead || !me.go) return;
        me.acc += dt; while (me.acc >= me.step && !me.dead && me.live) { me.acc -= me.step; step(); }
        if (!me.dead) place(Math.min(1, me.acc / me.step));
      });
      reset();
      return {
        log: { map: 'bonus-snake', state: els.join(''), board: 'snake' },
        go() {
          me.live = true; H.clock(snake.time, finish);
          const [hc, hr] = me.body[0], up = [...field.values()].filter(x => x.e === me.need).sort((x, y) => Math.abs(x.r - hr) - Math.abs(y.r - hr))[0], dy = up && up.r < hr ? -1 : 1;
          H.ghost('swipe', [[cx(hc + 1), cy(hr)], [cx(hc + 1), cy(hr + 2 * dy)]]);
        },
        halt() { me.done = true; me.live = false; },
        dbg: () => ({ body: me.body, dir: me.dir, need: me.need, field: [...field.values()].map(({ c, r, e }) => ({ c, r, e })), lives: me.lives, bites: me.bites, dead: me.dead, done: me.done, NC, NR, S }),   // test hook
      };
    },
  };

  // ---------------------------------------------------------------- hop
  const HP = { w: 336, h: 350, lanes: 5, lh: 54, bank: 40, r: 21 };
  const hop = {
    w: HP.w, h: HP.h, pips: 3, time: 20,
    create(H) {
      const W = HP.w, R = HP.r, LN = HP.lanes, els = H.perm.slice(0, H.ncol), a = els[0], b = els[1], others = els.slice(2);
      const laneY = i => i < 0 ? HP.h - HP.bank / 2 : i >= LN ? HP.bank / 2 : HP.h - HP.bank - HP.lh / 2 - i * HP.lh;
      let s = '<defs><clipPath id="bhopclip"><rect x="0" y="0" width="' + W + '" height="' + HP.h + '" rx="14"/></clipPath></defs><g clip-path="url(#bhopclip)">';
      s += '<rect class="bbank" x="0" y="' + (HP.h - HP.bank) + '" width="' + W + '" height="' + HP.bank + '"/>';
      s += '<rect class="bbank top" x="0" y="0" width="' + W + '" height="' + HP.bank + '"/>';
      for (let k = 0; k < 12; k++) s += '<path class="bflag" transform="' + T(14 + k * 28, 20) + '" d="M0 -6L1.8 -1.8 6 0 1.8 1.8 0 6-1.8 1.8-6 0-1.8-1.8Z"/>';   // the far bank sparkles
      for (let i = 0; i < LN; i++) s += '<rect class="blane ' + (i & 1 ? 'l1' : 'l0') + '" x="0" y="' + (laneY(i) - HP.lh / 2) + '" width="' + W + '" height="' + HP.lh + '"/>';
      s += '<g class="blanes"></g></g><g class="bguide"></g><g class="bfrog"></g>';
      H.root.insertAdjacentHTML('beforeend', s);
      const gL = H.root.querySelector('.blanes'), gF = H.root.querySelector('.bfrog'), gG = H.root.querySelector('.bguide');
      const lanes = [];
      for (let i = 0; i < LN; i++) {
        const n = 5, gap = 78 + Math.floor(H.rnd() * 3) * 4, len = n * gap, dir = i & 1 ? -1 : 1, v = (30 + 9 * i) * (.9 + H.rnd() * .2);
        const es = shuffle([a, b, a, b, others.length ? others[Math.floor(H.rnd() * others.length)] : (H.rnd() < .5 ? a : b)], H.rnd);
        const gems = es.map((e, k) => ({ e, x0: k * gap + (H.rnd() - .5) * 10, x: 0, g: H.put(gL, '<g class="pc">' + H.gem(0, 0, R, e, 'h' + i + k) + '</g>') }));
        lanes.push({ i, len, dir, v, gems, off: H.rnd() * len });
      }
      const me = { live: false, done: false, lives: 3, t: 0, lane: -1, x: W / 2, e: a, need: b, gem: null, hop: null, dead: false, land: 0, cross: 0 };
      const pips = () => H.pips([0, 1, 2].map(i => i < me.lives ? 'on' : 'done'));
      pips();
      function lay(dt) {
        me.t += dt;
        lanes.forEach(L => { const span = L.len, lo = (W - span) / 2; L.gems.forEach(g => { g.x = lo + mod(g.x0 + L.off + L.dir * L.v * me.t, span); g.g.setAttribute('transform', T(g.x, laneY(L.i))); }); });
      }
      function frog() { gF.innerHTML = '<g class="pc fr">' + H.gem(0, 0, R * 1.08, me.e, 'f') + eyes(R * 1.08, 0, -1) + '</g>'; paint(); }
      function paint() {
        lanes.forEach(L => L.gems.forEach(g => { const t = g.g.firstElementChild, nx = L.i === me.lane + 1 && !me.dead, ok = nx && g.e === me.need; t.classList.toggle('ok', ok); t.classList.toggle('glow', ok); t.classList.toggle('no', nx && !ok); t.classList.toggle('lit', g === me.gem); }));
      }
      function at(x, y, s) { const f = gF.firstElementChild; if (f) f.setAttribute('transform', T(x, y, s)); gG.innerHTML = me.dead || me.hop ? '' : '<path class="bchev" transform="' + T(x, y - R - 14) + '" d="M-9 4L0 -5 9 4"/>'; }
      function home() { me.lane = -1; me.x = W / 2; me.e = a; me.need = b; me.gem = null; me.dead = false; me.hop = null; frog(); at(me.x, laneY(-1)); }
      function hopUp() {
        if (!me.live || me.dead || me.hop) return;
        H.ghostOff(); H.sfx.whoosh();
        me.hop = { t: 0, x0: me.x, y0: laneY(me.lane), to: me.lane + 1 }; me.gem = null; paint();
      }
      function splash(why, g) {
        me.dead = true; me.lives--; pips(); H.sfx.bad(); H.shake(why === 'wrong' ? 7 : 5); H.log('b_splash', { why, lane: me.lane });
        if (g) { const t = g.g.querySelector('.tin'); if (t && t.animate && !H.reduced) t.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-10deg)' }, { transform: 'scale(1)' }], { duration: 360 }); }
        const f = gF.firstElementChild; if (f && f.animate && !H.reduced) f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
        H.burst(me.x, laneY(me.hop ? me.hop.to : me.lane), '#9fd8ff', 8);
        me.hop = null; me.gem = null; paint();
        if (me.lives > 0) H.later(() => { if (!me.done) home(); }, 700); else H.later(finish, 600);
      }
      function landed(to) {
        me.hop = null;
        if (to >= LN) {                                    // the far bank: a crossing
          me.lane = LN; me.cross++; const x = me.x, y = laneY(LN);
          H.pay(ECON.coin * 5, x, y, { k: 5, mult: 0, n: 8 }); H.sfx.combo(6); H.burst(x, y, '#ffd84a', 14); H.shake(3); H.log('b_cross', { n: me.cross });
          me.dead = true; paint(); H.later(() => { if (!me.done) home(); }, 650); return;
        }
        const L = lanes[to], g = L.gems.filter(q => Math.abs(q.x - me.x) < R * 1.15).sort((p, q) => Math.abs(p.x - me.x) - Math.abs(q.x - me.x))[0];
        if (!g) { splash('gap'); return; }
        if (g.e !== me.need) { me.lane = to; splash('wrong', g); return; }
        me.lane = to; me.gem = g; me.e = g.e; me.need = g.e === a ? b : a; me.land++;
        H.sfx.step(me.lane + 1); H.pop(g.g, 1.25); H.pay(ECON.coin, g.x, laneY(to), { k: 1, n: me.lane + 1 }); H.log('b_hop', { lane: to, e: g.e });
        frog();
      }
      H.on(type => { if (type === 'down') hopUp(); });
      H.key(d => { if (d[1] < 0) hopUp(); });
      H.loop(dt => {
        lay(dt);
        if (!me.live) return;
        if (me.hop) {
          const h = me.hop; h.t += dt / .2; const t = Math.min(1, h.t), y = h.y0 + (laneY(h.to) - h.y0) * t;
          at(me.x, y, 1 + .3 * Math.sin(Math.PI * t));
          if (t >= 1) landed(h.to);
        } else if (me.gem && !me.dead) {
          me.x = me.gem.x; at(me.x, laneY(me.lane));
          if (me.x < 8 || me.x > W - 8) splash('edge');
        }
      });
      lay(0); home();
      return {
        log: { map: 'bonus-hop', state: els.join(''), board: 'hop' },
        go() { me.live = true; H.clock(hop.time, finish); H.ghost('tap', [[W / 2, laneY(0) - 4]]); },
        halt() { me.done = true; me.live = false; },
        dbg: () => ({ lane: me.lane, x: me.x, need: me.need, lives: me.lives, land: me.land, cross: me.cross, hop: !!me.hop, dead: me.dead, done: me.done, R, lanes: lanes.map(L => ({ dir: L.dir, v: L.v, gems: L.gems.map(g => ({ x: g.x, e: g.e })) })) }),   // test hook
      };
      function finish() { if (me.done) return; me.done = true; me.live = false; H.clock(0); H.end({ landings: me.land, crossings: me.cross }); }
    },
  };

  // ---------------------------------------------------------------- stack
  const ST = { cols: 4, rows: 6, cs: 56, x0: 14, y0: 12 };
  const stack = {
    w: 336, h: ST.y0 * 2 + ST.rows * ST.cs, pips: 3, time: 18,
    create(H) {
      const CS = ST.cs, NC = ST.cols, NR = ST.rows, x0 = ST.x0, y0 = ST.y0, WW = NC * CS, WH = NR * CS, R = CS * .43;
      const els = H.perm.slice(0, H.ncol), a = els[0], b = els[1], others = els.slice(2);
      const colX = c => x0 + CS / 2 + c * CS, rowY = r => y0 + WH - CS / 2 - r * CS, px = x0 + WW + 14, pw = 336 - px - 6;
      let s = '<rect class="bwell" x="' + (x0 - 4) + '" y="' + (y0 - 4) + '" width="' + (WW + 8) + '" height="' + (WH + 8) + '" rx="16"/>';
      for (let c = 0; c < NC; c++) s += '<rect class="bcol" data-c="' + c + '" x="' + (x0 + c * CS + 2) + '" y="' + y0 + '" width="' + (CS - 4) + '" height="' + WH + '" rx="12"/>';
      s += '<rect class="bside" x="' + px + '" y="' + y0 + '" width="' + pw + '" height="' + (CS * 1.6) + '" rx="14"/>';
      // the goal, in pictures: a row of two alternating elements, sparkling
      const gy = y0 + CS * 2.6, gr = Math.min(9, pw / 9);
      s += '<rect class="bside" x="' + px + '" y="' + (gy - gr * 2.2) + '" width="' + pw + '" height="' + (gr * 4.4) + '" rx="12"/><g class="bgoal">';
      for (let k = 0; k < 4; k++) s += H.gem(q1(px + pw / 2 + (k - 1.5) * gr * 2.15), q1(gy), gr, k & 1 ? b : a, 'g' + k);
      s += '</g><g class="bpcs"></g><g class="bnext"></g><g class="bfall"></g>';
      H.root.insertAdjacentHTML('beforeend', s);
      const gP = H.root.querySelector('.bpcs'), gN = H.root.querySelector('.bnext'), gFa = H.root.querySelector('.bfall');
      const me = { live: false, done: false, lives: 3, grid: Array.from({ length: NC }, () => []), pc: null, next: 0, placed: 0, krows: 0, rows: 0, k: 0 };
      const pips = () => H.pips([0, 1, 2].map(i => i < me.lives ? 'on' : 'done'));
      pips();
      const draw = () => H.rnd() < (others.length ? .78 : 1) ? (H.rnd() < .5 ? a : b) : others[Math.floor(H.rnd() * others.length)];
      me.next = draw();
      function showNext() { gN.innerHTML = '<g class="pc" transform="' + T(px + pw / 2, y0 + CS * .8) + '">' + H.gem(0, 0, R * .9, me.next, 'nx') + '</g>'; H.pop(gN.firstElementChild, 1.25); }
      function spawn() {
        if (me.done) return;
        const e = me.next; me.next = draw(); showNext();
        const c = me.pc ? me.pc.c : 1 + Math.floor(H.rnd() * 2);
        const g = H.put(gFa, '<g class="pc">' + H.gem(0, 0, R, e, 'p' + (me.k++)) + '</g>');
        me.pc = { c, x: colX(c), y: y0 - CS * .3, e, g, fast: false }; paint();
      }
      function paint() {
        H.root.querySelectorAll('.bcol').forEach(r => { const c = +r.dataset.c, col = me.grid[c], top = col[col.length - 1], safe = me.pc && col.length < NR && (!top || top.e !== me.pc.e); r.classList.toggle('ok', !!(me.pc && safe)); r.classList.toggle('no', !!(me.pc && !safe)); });
        me.grid.forEach(col => col.forEach((q, r) => { const t = q.g.firstElementChild; t.classList.toggle('no', !!(me.pc && r === col.length - 1 && q.e === me.pc.e)); }));
      }
      const safeCol = () => { if (!me.pc) return 1; const ok = [...Array(NC).keys()].filter(c => { const col = me.grid[c], t = col[col.length - 1]; return col.length < NR && (!t || t.e !== me.pc.e); }); return ok.length ? ok[Math.floor(ok.length / 2)] : 1; };
      function land() {
        const p = me.pc, col = me.grid[p.c], h = col.length, top = col[h - 1];
        me.pc = null;
        if (h >= NR || (top && top.e === p.e)) {           // a clash (or no room): the gem shatters
          me.lives--; pips(); H.sfx.bad(); H.shake(8); H.burst(p.x, Math.min(p.y, rowY(Math.min(h, NR - 1))), H.neon[p.e], 10); H.log('b_clash', { c: p.c, e: p.e, full: h >= NR });
          if (top) { const t = top.g.querySelector('.tin'); if (t && t.animate && !H.reduced) t.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(0)' }], { duration: 360 }); }
          if (h >= NR) { const q = col.pop(); if (q) q.g.remove(); }
          p.g.remove(); paint();
          if (me.lives <= 0) { H.later(finish, 500); return; }
          H.later(spawn, 380); return;
        }
        p.g.remove();
        const g = H.put(gP, '<g class="pc" transform="' + T(colX(p.c), rowY(h)) + '">' + H.gem(0, 0, R, p.e, 'q' + (me.k++)) + '</g>');
        const q = { e: p.e, g, y: rowY(h) }; col.push(q); me.placed++;
        H.sfx.land(); H.pop(g, 1.2); H.log('b_drop', { c: p.c, e: p.e, h });
        checkRow(h);
        paint(); H.later(spawn, 140);
      }
      function checkRow(r) {
        if (!me.grid.every(col => col.length > r)) return;
        const row = me.grid.map(col => col[r].e), two = new Set(row).size === 2 && row.every((e, i) => !i || e !== row[i - 1]);
        const y = rowY(r), pts = two ? ECON.coin * (5 + me.krows) : ECON.coin;
        if (two) { me.krows++; H.sfx.combo(3 + me.krows); H.shake(5); for (let c = 0; c < NC; c++) H.burst(colX(c), y, H.neon[row[c]], 7); }
        else H.sfx.chime();
        me.rows++; H.log('b_row', { kempe: two, row: row.join('') });
        H.pay(pts, x0 + WW / 2, y, { k: two ? Math.min(5, 2 + me.krows) : 1, mult: two && me.krows > 1 ? me.krows : 0, n: 4 + me.krows });
        me.grid.forEach(col => { const q = col.splice(r, 1)[0]; const t = q.g; if (t.animate && !H.reduced) { t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }); setTimeout(() => t.remove(), 230); } else t.remove(); });
      }
      H.on((type, p) => {
        if (type !== 'down' || !me.live || !me.pc || me.pc.fast) return;
        const c = Math.max(0, Math.min(NC - 1, Math.floor((p.x - x0) / CS)));
        H.ghostOff(); me.pc.c = c; me.pc.fast = true; H.sfx.whoosh();
      });
      H.key(d => { if (!me.live || !me.pc || me.pc.fast) return; if (d[0]) { me.pc.c = Math.max(0, Math.min(NC - 1, me.pc.c + d[0])); H.ghostOff(); paint(); } else if (d[1] > 0) me.pc.fast = true; });
      H.loop(dt => {
        // settle the stacked gems (rows above a cleared one fall) and move the falling one
        me.grid.forEach((col, c) => col.forEach((q, r) => { const ty = rowY(r); if (Math.abs(q.y - ty) > .5) { q.y += (ty - q.y) * Math.min(1, dt * 14); q.g.setAttribute('transform', T(colX(c), q.y)); } else if (q.y !== ty) { q.y = ty; q.g.setAttribute('transform', T(colX(c), ty)); } }));
        const p = me.pc; if (!me.live || !p) return;
        const tx = colX(p.c); p.x += (tx - p.x) * Math.min(1, dt * (p.fast ? 30 : 18));
        p.y += dt * (p.fast ? 1500 : 70 + 3 * me.placed);
        const ly = rowY(Math.min(me.grid[p.c].length, NR));
        if (p.y >= ly && Math.abs(p.x - tx) < 2) { p.y = ly; p.x = tx; p.g.setAttribute('transform', T(p.x, p.y)); land(); return; }
        if (p.y > ly) p.y = ly;
        p.g.setAttribute('transform', T(p.x, p.y));
      });
      showNext();
      return {
        log: { map: 'bonus-stack', state: els.join(''), board: 'stack' },
        go() { me.live = true; spawn(); H.clock(stack.time, finish); const c = safeCol(); H.ghost('tap', [[colX(c === me.pc.c ? (c + 2) % NC : c), rowY(1)]]); },
        halt() { me.done = true; me.live = false; },
        dbg: () => ({ grid: me.grid.map(c => c.map(q => q.e)), pc: me.pc && { c: me.pc.c, e: me.pc.e, fast: me.pc.fast }, lives: me.lives, rows: me.rows, krows: me.krows, done: me.done, colX: [0, 1, 2, 3].map(colX), y: rowY(1) }),   // test hook
      };
      function finish() { if (me.done) return; me.done = true; me.live = false; H.clock(0); if (me.pc) { me.pc.g.remove(); me.pc = null; } paint(); H.end({ placed: me.placed, rows: me.rows, krows: me.krows }); }
    },
  };

  // ---------------------------------------------------------------- pop
  const PP = { cols: 4, rows: 3, dx: 84, dy: 84, x0: 42, y0: 44, r: 31 };
  const pop = {
    w: 336, h: PP.y0 * 2 + (PP.rows - 1) * PP.dy + 12, pips: 3, time: 16,
    create(H) {
      const R = PP.r, els = H.perm.slice(0, H.ncol), NS = PP.cols * PP.rows;
      const sx = i => PP.x0 + (i % PP.cols) * PP.dx, sy = i => PP.y0 + ((i / PP.cols) | 0) * PP.dy;
      let s = '';
      for (let i = 0; i < NS; i++) s += '<g transform="' + T(sx(i), sy(i) + R * .78) + '"><ellipse class="bhole" rx="' + (R * 1.05) + '" ry="' + (R * .36) + '"/><ellipse class="bhole2" rx="' + (R * .82) + '" ry="' + (R * .22) + '" cy="2"/></g>';
      s += '<g class="bmoles"></g>';
      H.root.insertAdjacentHTML('beforeend', s);
      const gM = H.root.querySelector('.bmoles');
      const me = { live: false, done: false, lives: 3, t: 0, nextAt: .2, run: 0, last: -1, pair: null, slots: new Array(NS).fill(null), taps: 0, best: 0, k: 0, runs: [], first: true };
      const pips = () => H.pips([0, 1, 2].map(i => i < me.lives ? 'on' : 'done'));
      pips();
      const want = e => me.run === 0 ? true : me.run === 1 ? e !== me.last : e === (me.pair[0] === me.last ? me.pair[1] : me.pair[0]);
      function paint() { me.slots.forEach(m => { if (!m || m.gone) return; const t = m.g.firstElementChild, ok = want(m.e); t.classList.toggle('ok', ok); t.classList.toggle('glow', ok); t.classList.toggle('no', !ok); }); }
      function spawn() {
        const free = me.slots.map((m, i) => m ? -1 : i).filter(i => i >= 0); if (!free.length) return;
        const i = free[Math.floor(H.rnd() * free.length)];
        // half the time, the element the run needs (so a run can always go on)
        let e; if (me.run >= 1 && H.rnd() < .45) { const nd = els.filter(want); e = nd[Math.floor(H.rnd() * nd.length)]; } else e = els[Math.floor(H.rnd() * els.length)];
        const g = H.put(gM, '<g class="pc" transform="' + T(sx(i), sy(i)) + '">' + H.gem(0, 0, R, e, 'm' + (me.k++)) + '</g>');
        const life = 1.55 - .45 * Math.min(1, me.t / pop.time);
        me.slots[i] = { i, e, g, t0: me.t, life, gone: false };
        if (g.animate && !H.reduced) g.firstElementChild.animate([{ transform: 'translateY(' + R + 'px) scale(.3)', opacity: 0 }, { transform: 'translateY(-6px) scale(1.12)', opacity: 1, offset: .6 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.3,1.5,.5,1)' });
        paint();
        if (me.first && me.live) { me.first = false; H.ghost('tap', [[sx(i), sy(i)]]); }
      }
      function sink(m, how) {
        m.gone = true; me.slots[m.i] = null; const g = m.g;
        if (g.animate && !H.reduced) { g.firstElementChild.animate(how === 'hit' ? [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }] : [{ transform: 'none', opacity: 1 }, { transform: 'translateY(' + R + 'px) scale(.4)', opacity: 0 }], { duration: how === 'hit' ? 220 : 240, fill: 'forwards' }); setTimeout(() => g.remove(), 250); }
        else g.remove();
      }
      function tap(p) {
        let best = null, bd = R * 1.25;
        me.slots.forEach(m => { if (!m || m.gone) return; const d = Math.hypot(sx(m.i) - p.x, sy(m.i) - p.y); if (d < bd) { bd = d; best = m; } });
        if (!best) return;
        H.ghostOff();
        const x = sx(best.i), y = sy(best.i);
        if (want(best.e)) {
          if (me.run === 1) me.pair = [me.last, best.e];
          me.run++; me.last = best.e; me.taps++; me.best = Math.max(me.best, me.run);
          sink(best, 'hit'); H.burst(x, y, H.neon[best.e], 8); H.sfx.pop(me.run);
          H.pay(6 * Math.min(me.run, 8), x, y, { k: me.run >= 6 ? 3 : 1, mult: me.run > 1 ? me.run : 0, n: me.run });
          if (me.run % 5 === 0) { H.sfx.combo(me.run); H.shake(3); }
          H.log('b_pop', { e: best.e, run: me.run });
        } else {
          me.runs.push(me.run); H.log('b_miss', { e: best.e, run: me.run });
          me.run = 0; me.last = -1; me.pair = null; me.lives--; pips(); H.sfx.bad(); H.shake(7);
          const t = best.g.querySelector('.tin'); if (t && t.animate && !H.reduced) t.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0)' }], { duration: 300 });
          H.later(() => { if (!best.gone) sink(best, 'miss'); }, 250);
          if (me.lives <= 0) { H.later(finish, 400); me.live = false; }
        }
        paint();
      }
      H.on((type, p) => { if (type === 'down' && me.live) tap(p); });
      H.loop(dt => {
        if (!me.live) return;
        me.t += dt;
        me.slots.forEach(m => { if (m && !m.gone && me.t - m.t0 > m.life) sink(m, 'miss'); });
        const vis = me.slots.filter(Boolean).length;
        if (me.t >= me.nextAt) { if (vis < 4) spawn(); me.nextAt = me.t + (.62 - .16 * Math.min(1, me.t / pop.time)) * (vis < 2 ? .6 : 1); }
      });
      return {
        log: { map: 'bonus-pop', state: els.join(''), board: 'pop' },
        go() { me.live = true; H.clock(pop.time, finish); },
        halt() { me.done = true; me.live = false; },
        dbg: () => ({ slots: me.slots.map(m => m && !m.gone ? { e: m.e, x: sx(m.i), y: sy(m.i), ok: want(m.e) } : null), run: me.run, lives: me.lives, taps: me.taps, done: me.done }),   // test hook
      };
      function finish() { if (me.done) return; me.runs.push(me.run); me.done = true; me.live = false; H.clock(0); me.slots.forEach(m => { if (m && !m.gone) sink(m, 'miss'); }); H.end({ taps: me.taps, best: me.best, runs: me.runs }); }
    },
  };

  // pick a game from the skin's list, never the last one twice in a row
  function pick(list, last, rnd) {
    const ok = (list || IDS).filter(id => IDS.includes(id)); if (!ok.length) return null;
    const pool = ok.length > 1 ? ok.filter(id => id !== last) : ok;
    return pool[Math.floor((rnd || Math.random)() * pool.length)];
  }
  window.FTH_BONUS = { ids: IDS, games: { chain, snake, hop, stack, pop }, ECON, econ, board: BOARD, nb: NB, honey, B4, pick };
})();
