// Respawn (lab/respawn.html): every level loads and is winnable through doors; teleports land where they should.
//   node tools/respawn_check.js [--walks 30]
// For each level, with lab/core.js and lab/respawn-core.js (the page's own model):
//   1. from the start, go through the door whose chain is in g.good() until g.won(); assert it takes exactly par
//      (g.dist() at the start) doors, every door is a non-web chain and its dest key equals g.canon() after the swap;
//   2. random play: --walks rounds of random doors (2..8) and random respawns to any node of the tree; after every
//      teleport g.canon() is the node's key and g.moves == the length of the walk in g.history; then follow g.good()
//      from wherever the player is and assert a win;
//   3. the room timer is inside [3, 6.5] s at speed 1.
const fs = require('fs'), path = require('path');
const ROOT = process.env.GAME_ROOT || path.join(__dirname, '..');
const args = process.argv.slice(2), wi = args.indexOf('--walks'), WALKS = wi >= 0 ? +args[wi + 1] : 30;
global.window = global; global.location = { search: '' }; global.addEventListener = () => {}; global.parent = global;
global.performance = global.performance || { now: () => Date.now() };
for (const f of ['levels.js', 'layout.js', 'lab/core.js']) (0, eval)(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const RC = require(path.join(ROOT, 'lab/respawn-core.js'));
let seed = 4242; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
let bad = 0, teleports = 0;
for (const L of GAME.levels) {
  const fails = [], g = LAB.game(L.id), par = g.dist(), T = RC.tree(g);
  if (par == null || par < 1) fails.push('start has no par (' + par + ')');
  const goDoor = d => { const from = T.cur; g.swap(d.K); if (g.canon() !== d.dest) fails.push('door dest key mismatch'); T.arrive(from, d.vs); };
  const followGood = () => {
    let k = 0;
    while (!g.won() && k++ < 40) {
      const good = new Set(g.good().map(K => K.key)), D = RC.doors(g), d = D.find(x => good.has(x.K.key));
      if (!d) { fails.push('no door in g.good()'); return -1; }
      if (d.K.web) fails.push('door is a web');
      goDoor(d);
    }
    return g.won() ? k : -1;
  };
  // 1. straight line
  const n1 = followGood();
  if (n1 !== par) fails.push('good line took ' + n1 + ' doors, par ' + par);
  const rt = RC.roomTime(RC.doors(LAB.game(L.id)).length, par, 1);
  if (rt < 3 || rt > 6.5) fails.push('room time ' + rt);
  // 2. random walks with respawns
  let maxNodes = 0;
  for (let w = 0; w < WALKS; w++) {
    g.reset(); T.reset();
    const rounds = 1 + Math.floor(rnd() * 4);
    for (let r = 0; r < rounds; r++) {
      const steps = 2 + Math.floor(rnd() * 7);
      for (let s = 0; s < steps; s++) {
        const D = RC.doors(g).filter(d => !d.won);           // the walk stays in play (a won room ends the game)
        if (!D.length) break; goDoor(pick(D));
      }
      const target = Math.floor(rnd() * T.nodes.length);
      try { T.teleport(target); teleports++; } catch (e) { fails.push(e.message); break; }
      if (g.canon() !== T.nodes[target].key) fails.push('teleport key mismatch');
      if (g.moves !== g.history.length) fails.push('moves != history length');
      const walk = T.walk(); if (walk[0] !== 0 || walk[walk.length - 1] !== target) fails.push('walk does not run root -> target');
    }
    maxNodes = Math.max(maxNodes, T.nodes.length);
    if (followGood() < 0) fails.push('no win after respawns');
  }
  if (fails.length) bad++;
  console.log((fails.length ? 'FAIL ' : 'ok   ') + String(L.num).padEnd(5) + ' ' + L.id.padEnd(20) + ' par ' + par + '  doors@start ' + String(RC.doors(LAB.game(L.id)).length).padEnd(3) +
    ' room ' + rt.toFixed(1) + 's  tree<=' + maxNodes + (fails.length ? '\n       ' + [...new Set(fails)].join('\n       ') : ''));
}
console.log(bad ? bad + ' levels FAILED' : 'all ' + GAME.levels.length + ' levels ok (' + teleports + ' teleports)');
process.exit(bad ? 1 : 0);
