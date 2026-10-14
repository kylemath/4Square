# 4square

A mobile puzzle game about the Four Colour Theorem. A map is coloured with four elements so that neighbours differ;
one region, the hole, is left blank because its five neighbours use all four. Your move is a **Kempe swap**: pick a
chain of regions that alternate two elements and swap them. Get the rim down to three elements and the hole can be
filled.

**Play:** https://4square.studio (also https://kylemath.github.io/4Square/; open `index.html`; it is a static site, no build needed to play).
It is a progressive web app: the **📲 Install** button on the title screen adds it to an Android or iPhone home screen,
where it runs full screen and offline (`manifest.webmanifest`, `sw.js`; icons from `tools/make_icons.py`).

The levels come from real research data: maps from an exhaustive census of sphere triangulations, with locked
"π loops", 66666 six-rings and the deepest known start (6 swaps). The game grew out of
[GraphColourDeductiveSolver](https://github.com/kylemath/GraphColourDeductiveSolver)
([site](https://kylemath.github.io/GraphColourDeductiveSolver/)). The Four Colour Theorem is already proved; this
game explores the Kempe-swap dynamics behind Kempe's 1879 attempt and Heawood's 1890 objection.

**Game styles (skins).** The same levels play in fourteen styles, chosen on the title screen: Islands, Islands Free,
Islands 3D, Dots, Line Doodle, Blank Doodle, Island Map, Bonus Swipe, Ion Channels, Gran's Table, Rat Maze, Candy,
Rim Word and Spheres. Each skin restyles the whole game, not just the board: theme, HUD level (full, compact, minimal), title art,
how-to-play pages, bonus-round tiles and the look of the exploration map, which every skin charts as you swap.
Islands and Islands Free are two layouts of one board renderer (`board/island.js`: walls, or no walls with tiles that
settle like soft bubbles; `node tools/free_check.js` checks the free layout on every level); Islands 3D is a three.js
scene (`lab/islands3d.html`, `node tools/islands3d_check.js`). The contract is in [SKIN-SPEC.md](SKIN-SPEC.md); a skin
is `skins/<id>.js` plus an optional play page `lab/<id>.html`, checked with `node tools/skin_check.js`.
`lab/Families.html` shows the experimental styles side by side.

**Coins and skin tickets.** Each skin earns its own currency (ink beads, letter tiles, sugar cubes, sweets, doubloons, glass marbles, cheese wedges,
pearls, crystal shards...), worth between 1 and 100 G. A new player
owns Islands only; every other skin is unlocked with a **skin ticket** (`tickets.js`, the 🎟️ Skins button). Ticket *n* opens
once enough levels are beaten (1, 3, 5, 7, 9, 12, 14, 16, 18, 20, 23, 26, 28) and costs coins from one wallet (900 points'
worth at first, about one level's pay, rising by 300 a ticket to 4,500): each skin comes a little further on and costs a little more. Each
wallet buys ONE ticket: doubloons buy the first, and each later ticket is paid in the coins of a skin a ticket unlocked, so every
new skin you play earns its way to the next (a used currency's deli sign shows 🎟️✓). The ticket then unlocks any locked skin. The title screen picks a skin on the **skin reel** (`reel.js`: swipe the ribbon of skin cards; resting on
an owned card selects it). The shop is a full-screen showroom on the same reel, over a live preview of the centred skin playing
itself (its page with `&demo=1`, see `lab/core.js`); tickets are bought at the **deli counter** (`deli.js`): one hanging price sign per
currency, tap one, PURCHASE. `node tools/tickets_check.js` checks the rules and that each ticket is affordable at its gate
on clean play (17-29% to spare, before bonus rounds); `node tools/shop_check.js` plays it end to end. SKIN-SPEC.md section 12.

**Maps.** The 🗺️ button (title screen and level map) opens `maps.js`: every map as a thumbnail of how much of its
colouring space you have charted (drawn by the shell's own exploration-map renderer, `window.FTH_MAPVIEW.render`), most
recently played first (`save.maps[<map>] = {t, id}`, written in `startLevel`; outside the save seal, which covers progress).
Played maps show a % charted ring and open a big view with their levels; maps never played are greyed with a ▶ chip that
starts their first level (🔒 while it is locked).

**Feature bench.** Parked features stay in the code, switched off, until they are wanted again:
- *Currency exchange* (`economy.js`: a graph of direct markets where coins convert along the cheapest route, with no
  arbitrage, `node tools/economy_check.js`). Off: no wallet button. `?feat=exchange` brings the button back.

Accounts, per-skin leaderboards, cloud saves (sign in with Google and your progress follows you to every device) and the cheat-evidence log are described in [ACCOUNTS.md](ACCOUNTS.md); they work locally
with no setup and go online once `account-config.js` is filled in.

**Rat Maze and Candy** are on that title screen. [Rat Maze](lab/maze.html) draws the swap graph itself as a rat maze
in a 3/4 view (inside the app it starts on Find the cheese: the cheese is par rooms away; the lab page also has a
coins round and a self-training rat; `node tools/maze_check.js`). [Candy](lab/crush.html) turns the gesture of
swapping two neighbouring candies into the Kempe chain that runs through them.

**Rim Word** is on that title screen. [Rim Word](lab/rimword.html) labels every state within par swaps with a
five-letter string so that each swap flips one tile and the fillable states are exactly the real words. The labels
are `lab/rimword-data.js`, written by `node tools/word_graph.js`. A level with no chart plays on the Islands board.

**Maze Arena (lab research page).** [Maze Arena](lab/MazeArena.html) trains one map-independent graph neural network
(afterstate TD learning, hand-written backward pass, `lab/arena/engine.js`) with mice in up to 25 swap mazes at once,
in a Web Worker, and scores it on held-out maps: does it pick a swap that lowers the exact distance to a fill (from
the census) on maps it never trained on? Models are plain JSON with their settings and metrics, ranked on a
leaderboard (committed ones in `lab/arena/models/`, made by `node tools/arena_train.js`; tests in
`node tools/arena_check.js`). Two tracks: *tabula rasa* nets (a weight-tied recurrent message-passing net that sees only
the map, raw colours and the hole) and *priors* nets (given hand-made chain features). Hard training data (every
census state, splice variants and evolved trap maps with exact distances) comes from `node tools/arena_hardgen.js`
and 4-core training from `node tools/arena_scale.js`. Results, and what scaling up would take:
[lab/arena/PRETRAINING.md](lab/arena/PRETRAINING.md).

**Flip (lab game).** [Flip](lab/flip.html) is the 4CT in polygon form (Eliahou's signed diagonal flips, which
Gravier–Payan showed are equivalent to it). Two triangulations of an n-gon share their corners, and every triangle is
signed ＋ or −. A diagonal may flip only between two triangles of the same sign, and the new ones take the other sign.
Match the target. The signs secretly encode a 4-colouring that suits both, so gluing the two polygons gives a
4-coloured sphere map; the page shows it on a win. It has 25 levels (5- to 12-gons, par from the solver) and a
free-signs chapter. Maths and solver: `lab/flip-model.js`, checked exhaustively for n ≤ 11 against direct 4-colourings,
Tait colourings and Kauffman's two-bracketings form (`node tools/flip_check.js`). The page is checked by
`node tools/flip_ui_check.js`. An RL environment with random and greedy baselines is in `lab/flip-env.js`
([lab/arena/FLIP-ENV.md](lab/arena/FLIP-ENV.md), `node tools/flip_env_check.js`). Design note:
[lab/FLIP-DESIGN.md](lab/FLIP-DESIGN.md). It is lab-only: not a skin, no tickets.

Research logging is off unless the player agrees on the title screen, and it stays on the device unless an upload
form is configured in `telemetry.js` (none is).

---

## How levels are made

Every level is a map plus a start colouring. Maps and levels are plain JSON; one script turns them into the two
files the game loads (`levels.js`, `layout.js`). New graphs from other sessions or pipelines come in as **level
requests**: one JSON file with the map and its levels, checked and added by `tools/level_request.py`. The format and
the steps after adding are in [LEVEL-REQUEST.md](LEVEL-REQUEST.md). Every skin (the main game and the lab wrappers) reads those same files
through the same rules (`lab/core.js`), so a new level works in every skin.

```
maps/<key>.json  ─┐
levels.json      ─┴─ build_game.py ──> levels.js  (graphs, distances, levels, islands)
                                       layout.js  (region shapes; cached per map)
```

## Add a map

1. Write `maps/<key>.json`. Give `name`, `hole` (the uncoloured vertex, degree 5 for the usual game) and the graph in
   one of these forms (see `mapio.py`):
   - `"faces": [[a, b, c], ...]`: the triangles of a sphere triangulation, any orientation;
   - `"rot": [[...], ...]`: each vertex's neighbours in cyclic order (as in the census files);
   - `"ascii": "17 bcdef,afghc,..."`: plantri ascii;
   - `"edges"` + `"pos"`: a small hand-drawn pond (not a triangulation; add `"onboard": true`, `"ncol"`, `"goal"`).

   Optional: `"world": true` adds the colouring-space mini-map (needs scikit-learn; a few minutes per map),
   `"source"` says where the graph came from.
2. Check it: `python3 docs/game/build_game.py --check <key>` prints the colourings, Kempe classes, fillable share,
   deepest par, doubly locked states and π loops.
3. Pick starts: `--suggest <key>` ranks start states by difficulty for each par; `--ladder <key>` prints one
   ready-to-paste level entry per par (easiest at par 1, hardest at each larger par).

For quick warm-up islands: `python3 docs/game/gen_map.py w16 16 --maxpar 1` writes a random 16-region map with a
playable hole.

## Add a level

Add an entry to `levels.json` in play order:

```json
{"id": "quiet-way-out", "num": "7.3", "map": "p32r111", "kicker": "π", "title": "Quiet way out",
 "tools": ["locks", "pi"], "intro": "…",
 "pick": {"onLoop": true, "exits": "quietOnly", "prefer": ["+N"]}, "expect": {"par": 2}}
```

- `id` is permanent: player progress is saved under it, so levels can be reordered or inserted freely.
- `num` is only the label on the badge. `kicker` is the island; new islands go in `"islands"`
  (`[name, theme, emoji]`, themes: cove beach town harbour forest cape cave volcano reef).
- `pick` chooses the start: `{"start": [colouring]}`, or constraints on the start state:
  `dF` (par, a number or `[lo, hi]`), `dl` (doubly locked), `locks` (0–2), `N` (chain count), `onLoop`
  (on an all-locked π loop), `exits` (`quietOnly`: every quickest first move touches no rim tile; `loudOnly`:
  every quickest first move is a rim chain other than π; `piOnly`), `deepest`, `piRule` (`loops`, `par`, `over`: what
  "Kempe's step if a lock is open, else π" does). `prefer` orders the matches (`-difficulty`, `+N`, `+shortWin`, …).
- `expect` lists facts the build asserts (`par`, `onLoop`, `loopLength`, `loops`, `N`, `unique`, `deepest`,
  `piRunN`), so a level's story cannot drift from the maths when maps or rules change.

Then run `python3 docs/game/build_game.py`. Only new or changed maps are laid out again (`--fresh` redoes all).

## Difficulty

`kempe_engine.HoleGame.difficulty` scores a start: par first, plus how misleading it is (the share of first moves
that do not help, a doubly locked rim, whether the no-lookahead π rule loops or overshoots, and whether only
quiet chains help). Use it to order levels within an island and to pick warm-ups that are easy but not trivial.

## Files

| file | role |
|---|---|
| `kempe_engine.py` | the rules: states, Kempe moves, distances, locks, π, loops, difficulty (pure Python) |
| `mapio.py` | reading and checking map JSON |
| `build_game.py` | the build, plus `--check`, `--suggest`, `--ladder` |
| `build_layout.py` | region shapes (numpy, scipy, torch), called by the build |
| `world_map.py` | the colouring-space mini-map (scikit-learn), called by the build |
| `gen_map.py` | random warm-up maps |
| `tools/level_request.py` | checks and applies a level request ([LEVEL-REQUEST.md](LEVEL-REQUEST.md)) |
| `maps/`, `levels.json` | the content |
| `levels.js`, `layout.js` | generated; do not edit |
