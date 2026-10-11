# 4Square: Fill the Hole

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

**Game styles (skins).** The same levels can be played in several styles, chosen on the title screen: Islands (the
main board), Dots and Line Doodle. A style is any page in `lab/` built on `lab/core.js`; it reports its moves to the
app, which keeps scoring, progress and the level map. `lab/Families.html` shows every experimental style side by side.

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
