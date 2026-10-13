// Skin tickets (tickets.js): the rules and their balance.   node docs/game/tools/tickets_check.js
//   - gates and prices both rise, one ticket per skin other than Islands;
//   - each ticket is affordable at its gate on clean 3-star play with no bonus rounds, with some room to spare (PAY below
//     is measured: points per level in play order, a fresh save, one first win each, achievements included);
//   - buy / use / owns behave (one wallet pays, whole coins, the gate holds, a ticket unlocks exactly one skin).
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, '..');
const ctx = { window: {}, console, Math }; ctx.window.window = ctx.window; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8'), ctx, { filename: f });
run('skins/registry.js'); ctx.FTH_SKINS = ctx.window.FTH_SKINS;
for (const f of fs.readdirSync(path.join(D, 'skins')).filter(f => f !== 'registry.js').sort((a, b) => /extend\(/.test(fs.readFileSync(path.join(D, 'skins', a), 'utf8')) - /extend\(/.test(fs.readFileSync(path.join(D, 'skins', b), 'utf8')))) run('skins/' + f);
run('tickets.js');
const T = ctx.window.FTH_TICKETS, S = ctx.window.FTH_SKINS, SK = S.list;
let bad = 0; const ok = (m, c, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + x : '')); if (!c) bad++; };

// measured with a headless run of index.html (?all=1, Islands, every level in order, solved at par): see the commit log
const PAY = [1110, 865, 985, 910, 1120, 1015, 885, 1540, 965, 1075, 1123, 1190, 1945, 1310, 1320, 1850, 1578, 1850, 2228, 2138, 1810, 1340, 2523, 1470, 1750, 2488, 2705, 3785, 3383];
ok('one ticket per skin other than Islands', T.GATE.length === SK.length - 1 && T.PRICE.length === T.GATE.length, T.GATE.length + ' tickets, ' + SK.length + ' skins');
ok('gates rise', T.GATE.every((g, i) => !i || g > T.GATE[i - 1]), T.GATE.join(' '));
ok('prices rise', T.PRICE.every((p, i) => !i || p > T.PRICE[i - 1]), T.PRICE.join(' '));
ok('every gate is a real level count', T.GATE[T.GATE.length - 1] <= PAY.length);
ok('the first ticket costs about one level', T.GATE[0] === 1 && T.PRICE[0] <= PAY[0], T.PRICE[0] + ' <= ' + PAY[0]);
console.log('  ticket  gate  price  spent  earned  spare');
let spent = 0, cum = 0, li = 0;
T.GATE.forEach((g, i) => {
  while (li < g) cum += PAY[li++]; spent += T.PRICE[i];
  const spare = (cum - spent) / cum;
  console.log('  ' + String(i + 1).padStart(6) + String(g).padStart(6) + String(T.PRICE[i]).padStart(7) + String(spent).padStart(7) + String(cum).padStart(8) + (Math.round(spare * 100) + '%').padStart(7));
  ok('ticket ' + (i + 1) + ' affordable at its gate with 10-35% to spare (clean play, no bonus rounds)', spare >= .10 && spare <= .35);
});

// ---- the rules on a plain ctx
const mk = (beaten, wallet) => {
  const c = { save: { wallet: JSON.parse(JSON.stringify(wallet || {})) }, skins: SK, beaten: () => beaten, persist: () => { c.saves++; }, saves: 0 };
  return c;
};
let c = mk(0, {});
T.state(c.save);
ok('a new save owns Islands only', JSON.stringify(c.save.skins.own) === '["islands"]' && T.owns(c.save, 'islands') && !T.owns(c.save, 'dots'));
let t = T.next(c);
ok('ticket 1 waits for its gate', t.n === 1 && !t.gateOk && !T.canBuy(c));
const isl = SK.find(k => k.id === 'islands'), price = T.coinsFor(T.PRICE[0], isl);
ok('price in doubloons = points x rate', price === Math.ceil(T.PRICE[0] * S.rate(isl)), price);
c = mk(1, { islands: { bal: price - 1, earned: price - 1, f: 0 } });
ok('one coin short: cannot buy', !T.canBuy(c) && T.buy(c, 'islands') === false && c.save.skins.tickets === 0);
c = mk(1, { islands: { bal: price, earned: price, f: 0 } });
ok('gate met and enough doubloons: can buy', T.canBuy(c));
ok('buy spends exactly the price from that wallet', T.buy(c, 'islands') && c.save.wallet.islands.bal === 0 && c.save.wallet.islands.earned === price && c.save.skins.tickets === 1 && c.save.skins.bought === 1 && c.saves === 1);
ok('use unlocks the chosen skin', T.use(c, 'dots') && T.owns(c.save, 'dots') && c.save.skins.tickets === 0);
ok('no ticket left: cannot unlock another', T.use(c, 'ions') === false && !T.owns(c.save, 'ions'));
ok('cannot unlock an owned or unknown skin', (c.save.skins.tickets = 1, T.use(c, 'dots') === false && T.use(c, 'nope') === false));
c.save.skins.tickets = 0;
t = T.next(c);
ok('ticket 2 has a further gate and a higher price', t.n === 2 && t.gate === T.GATE[1] && t.pts === T.PRICE[1]);
// pay from another skin's wallet: same effort, its own coins
const dots = SK.find(k => k.id === 'dots'), pd = T.coinsFor(T.PRICE[1], dots);
c.save.wallet.dots = { bal: pd, earned: pd, f: 0 }; c.beaten = () => T.GATE[1];
ok('any one wallet pays, priced in its own coins', T.canBuy(c) && T.next(c).pay[0].id === 'dots' && T.buy(c, 'dots') && c.save.wallet.dots.bal === 0, pd + ' ink beads');
ok('a wallet never pays part of a price', (c.save.wallet.islands.bal = 5, c.save.wallet.dots.bal = 5, c.beaten = () => 99, !T.canBuy(c)));
// all the way: one ticket per locked skin unlocks everything, then no more
c = mk(99, {}); SK.forEach(k => { c.save.wallet[k.id] = { bal: 1e7, earned: 1e7, f: 0 }; });
for (let i = 0; i < T.GATE.length; i++) { const nx = T.next(c); T.buy(c, nx.pay[0].id); T.use(c, SK.find(k => !T.owns(c.save, k.id)).id); }
ok(T.GATE.length + ' tickets own every skin', SK.every(k => T.owns(c.save, k.id)) && T.next(c) === null, c.save.skins.own.length + ' owned');
console.log(bad ? bad + ' problem(s)' : 'tickets OK');
process.exit(bad ? 1 : 0);
