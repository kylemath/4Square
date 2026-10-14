# Star: the state tree in star coordinates

Skin `star` (`skins/star.js`), play page `lab/star.html`, model and rule evaluator `lab/star-rules.js` (`FTH_STAR`, pure,
node-runnable). Checks: `node tools/star_rules_check.js` (model vs `kempe_engine.py`, built-in rule scores),
`node tools/star_check.js` (the page end to end, headless), `node tools/embed_win_check.js star`.

## The abstraction

The owner's brief: play at the level of abstraction where the underlying graph is still solved the same way (same
level, same moves, same par), and make the rim star the game. So no map is drawn. A state is one colouring up to
renaming the elements (the game's canon key) seen only through `rim.js`'s research frame:

| on screen | meaning |
|---|---|
| 5 gems on the star's points | the rim elements in rim order (`Gr.link`), clockwise from the top |
| gold star edge t..t+2, its gems ringed | the trouble spot (one element on two rim tiles one apart; star index t) |
| edges x1..x3 and x1..x4, two-colour chain + padlock | Kempe's two rim chains ({β,γ} from x1, {β,δ} from x1); shut padlock = the chain loops back onto the rim (lock), open glowing padlock = that swap fills |
| dashed arc round x2 to x3, "π" | double lock: π (Kittell's {α,γ} swap at x2) is forced and hops the spot t -> t+3 |
| number in the hole | Fisk's degree N·ε (`degree.js`, label-free) |
| a branch to a smaller star | one Kempe move (non-web chain), merged by the star it reaches |
| branch tag | the pair (two gems), chain size, quiet (touches no rim tile, muted speaker) or loud |
| ringed gems on a child | the rim places that swap repaints |
| π badge, gold dashed branch | the π move |
| broken-open star (arms apart, free gem in the hole) | a child (or the state) that fills: a win |
| loop ring + ↻ on a child, visit badges on the trail, ↻k chip | a star already on the path (a cycle of length k) |
| trail of mini stars (top), gold joints | the path so far; π steps; tap one to backtrack to it |
| 👣 n / ⚑ par, π×k chip | swaps against par (= dF of the start), the current π run |

One step of lookahead only (the children); deeper lookahead stays hidden so it remains a puzzle. Because a child shows
its own locks, an open-lock child is visibly one swap from a fill (Kempe: any open lock fills), so the real decisions
are among double-locked stars, which is exactly where heuristics matter.

**Merging.** A pair with two chains gives the same star either way (swap one = swap the other, up to renaming), so the
level's 4-6 chains often make 2-3 children. The tag shows the merged move's gentlest chain (fewest rim tiles, then
smallest); "quiet" means some chain of the merge touches no rim tile.

**Moves are real.** Tapping a child is exactly one `g.swap(K)` (K = the merged move's chain in `g.chains`), so the shell
scores, saves, charts and proves the run exactly as for every skin, and levels stay commensurate across skins. Undo and
the trail's backtrack are `g.undo()`. The app's `&demo=1` swaps redraw as the tree growing (shop preview). The shell's
star rim chip (`rimstar.js`) is hidden on this skin by its `css` (it would repeat the board).

**Ponds** (Level −1: 2-3 elements, rim of 3-4) have no frame: the star has 3 or 4 points, no trouble spot, no locks.

## Juice

Child lifts on touch; tap: pop, the child flies to the centre and grows (easeOutBack), the old star shrinks into the
trail, repainted rim gems flip in a wave with rising pops, new branches sprout one by one with a rising tone; a lock
opening chimes; stepping back onto a seen star wobbles with a low buzz and bumps the ↻ chip; win: the star breaks open
(arms burst, rays turn, free gem in the hole), four sparkle bursts, gems bounce, two arpeggios, 3.4 s, then
`LAB.done()`. Reduced motion: no tweens. First visit: a 3-step overlay ("Your rim star", "Tap a branch", "Break it
open!"); `?tut=0` skips it. Keys 1-9, Backspace/U, R, L.

## The heuristic lab (the research goal)

The flask opens a rule builder. A **rule** is an ordered list of cards:

```js
rule = { name, cards: [ { when: [ { f, op, v }, ... ], pick, arg } ] }
```

At each step every card whose tests all hold (none = always) narrows the moves to those that score best on its `pick`,
in card order; ties end with the smaller chain, then the smaller star key (deterministic, label-free). A walk ends at a
fill, after 60 swaps, or as soon as it is provably stuck (same star and context with no new star seen since).

- **state tests `f`**: `lock` (0-2), `pi` (1 at a double lock), `run` (π swaps in a row), `seen` (this star was on the
  path before), `steps`, `star` (trouble index t), `deg` (N·ε), `N` (chains, webs included), `nm` (moves); `op`: `= != >= <=`.
- **picks**: `fill`, `pi`, `nopi`, `quiet`, `loud`, `fewlocks`, `morelocks` (the child's locks), `small`, `big` (chain
  size), `fewhits`, `morehits` (rim places touched), `new` (child not on the path), `degup`, `degdown`, `degkeep` (ΔN·ε),
  `hop` k (the spot moves t -> t+k), `pair` 'αγ' (the pair's frame roles), `branchy`, `narrow` (the child's move
  count), `rand` (a hash of star and step: the dice baseline), `oracle` (dF: a cheat, baseline only).

Test scopes: the **40 level starts**, or **every hard star** (dF ≥ 2) of every distinct Kempe class (14,976 stars;
the check confirms the hard stars are exactly the double locks: an open lock is always one swap from a fill and a
double lock never is). Results: solve rate, mean swaps over par on solved walks, walks that met a loop, walks stuck,
and the failing levels (tap one to watch the rule fail in a sandbox that never touches the real game). Tested rules
go on a board (localStorage `fth-star-board`); "⧉ rule JSON" / "⧉ board JSON" copy
`{ kind: 'fth-star-rule', v: 1, rule, scores: { start, class } }`.

### Built-in rules (`node tools/star_rules_check.js`)

| rule | cards | 40 starts | +swaps | stuck | hard stars | +swaps | loops met |
|---|---|---|---|---|---|---|---|
| Kempe, else π | fill; lock=2 → π | 34/40 (85%) | 1.56 | 6 (7.1-7.6) | 98.9% | 0.44 | 160 |
| Fewest locks next | fill; fewlocks | 26/40 (65%) | 0.00 | 14 | 99.4% | 0.00 | 89 |
| Prefer quiet | fill; quiet | 17/40 (43%) | 0.18 | 23 | 58.7% | 0.28 | 6,181 |
| Smallest chain | fill; small | 16/40 (40%) | 0.13 | 24 | 83.1% | 0.23 | 2,535 |
| Fewest locks, new stars | fill; fewlocks; new | **40/40** | 0.45 | 0 | **100%** | 0.01 | 7 |
| π, quiet when looping | fill; seen → quiet; seen → new; lock=2 → π | 40/40 | 4.97 | 0 | 100% | 0.68 | 160 |
| Dice | fill; rand | 35/40 (88%) | 3.14 | 5 | 99.6% | 0.88 | 1,372 |
| Oracle (dF) | oracle | 40/40 | 0.00 | 0 | 100% | 0.00 | 0 |

Measurements, not proofs. "Kempe, else π" is the engine's `pi_rule`: it fails exactly on the six π-loop maps of 7.1-7.6
(the closed π loops of length 20: watching it on 7.1 shows π×40, ↻20). "Fewest locks next" is perfect when it solves
(+0.00) but loops on the pits. Adding one tie-break, prefer an unseen star, solves every level and every hard star
(7 of 14,976 walks meet a loop and escape it): the best candidate so far, and the baseline to beat on swaps over par.

### Research event

Every test is logged as `heuristic_test` (inside the app on the shell's research log `FTH_LOG`, riding on the level's
attempt; cross-origin as a `{ fth: 1, type: 'log', ev, data }` post; standalone on the page's own `telemetry.js` record
`star-lab`):

```js
{ v: 1, skin: 'star', rule: { name, cards }, builtin: 'kempe-pi' | '', scope: 'start' | 'class', n, solved, rate,
  excess, loops, stuck, fails: ['7.1:loop', ...], lvl, ms, sink: 'shell' | 'post' | 'local' }
```

## Skin

Coin: the comet (45 G, a gold head with a star cut and a violet tail; trades with crystal shards and cogs). Ticket 15:
32 levels, 5,100 points. Eggs: `pi-twenty` (page: twenty π swaps in a row that bring the identical board back, 500
points), `shooting-star` (title, 5 taps), `wish` (win, 12%). HUD compact. Level map: constellations on a night sky,
levels as chunky stars, a stardust road.
