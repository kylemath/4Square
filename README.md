# 4square

A mobile puzzle game about the Four Colour Theorem. A map is coloured with four elements so that neighbours differ;
one region, the hole, is left blank because its five neighbours use all four. Your move is a **Kempe swap**: pick a
chain of regions that alternate two elements and swap them. Get the rim down to three elements and the hole can be
filled.

**Play:** https://kylemath.github.io/4Square/ (open `index.html`; it is a static site, no build needed to play).
It is a progressive web app: the **📲 Install** button on the title screen adds it to an Android or iPhone home screen,
where it runs full screen and offline (`manifest.webmanifest`, `sw.js`; icons from `tools/make_icons.py`).

The levels come from real research data: maps from an exhaustive census of sphere triangulations, with locked
"π loops", 66666 six-rings and the deepest known start (6 swaps). The game grew out of
[GraphColourDeductiveSolver](https://github.com/kylemath/GraphColourDeductiveSolver)
([site](https://kylemath.github.io/GraphColourDeductiveSolver/)). The Four Colour Theorem is already proved; this
game explores the Kempe-swap dynamics behind Kempe's 1879 attempt and Heawood's 1890 objection.

**Game styles (skins).** The same levels play in ten styles, chosen on the title screen: the Islands family (Islands,
Islands Free, Islands 3D), Dots, Line Doodle, Blank Doodle, Island Map, Bonus Swipe, Ion Channels and Gran's Table.
Each skin restyles the whole game, not just the board: theme, HUD level (full, compact, minimal), title art,
how-to-play pages, bonus-round tiles and the look of the exploration map, which every skin charts as you swap.
Islands and Islands Free are two layouts of one board renderer (`board/island.js`: walls, or no walls with tiles that
settle like soft bubbles; `node tools/free_check.js` checks the free layout on every level); Islands 3D is a three.js
scene (`lab/islands3d.html`, `node tools/islands3d_check.js`). The contract is in [SKIN-SPEC.md](SKIN-SPEC.md); a skin
is `skins/<id>.js` plus an optional play page `lab/<id>.html`, checked with `node tools/skin_check.js`.
`lab/Families.html` shows the experimental styles side by side.

**Coins and skin tickets.** Each skin earns its own currency (ink beads, doubloons, pearls, crystal shards...). A new player
owns Islands only; every other skin is unlocked with a **skin ticket** (`tickets.js`, the 🎟️ Skins button). Ticket *n* opens
once enough levels are beaten (1, 3, 5, 8, 11, 14, 17, 21, 25) and costs coins from any one wallet (900 points' worth at
first, about one level's pay, rising to 5,600): each skin comes a little further on and costs a little more. The ticket
then unlocks any locked skin. `node tools/tickets_check.js` checks the rules and that each ticket is affordable at its gate
on clean play (16-22% to spare, before bonus rounds); `node tools/shop_check.js` plays it end to end. SKIN-SPEC.md section 12.

**Feature bench.** Parked features stay in the code, switched off, until they are wanted again:
- *Currency exchange* (`economy.js`: a graph of direct markets where coins convert along the cheapest route, with no
  arbitrage, `node tools/economy_check.js`). Off: no wallet button. `?feat=exchange` brings the button back.

Accounts, per-skin leaderboards and the cheat-evidence log are described in [ACCOUNTS.md](ACCOUNTS.md); they work locally
with no setup and go online once `account-config.js` is filled in.

Research logging is off unless the player agrees on the title screen, and it stays on the device unless an upload
form is configured in `telemetry.js` (none is).

---

## How levels are made

Every level is a map plus a start colouring. Maps and levels are plain JSON; one script turns them into the two
files the game loads (`levels.js`, `layout.js`). Every skin (the main game and the lab wrappers) reads those same files
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
| `maps/`, `levels.json` | the content |
| `levels.js`, `layout.js` | generated; do not edit |
