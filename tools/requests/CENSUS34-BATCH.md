# Census34 batch: 11 levels on the census frontier

13 Oct 2026, Claude session for kylemath. One level request per map, `tools/requests/census34-<key>.json`. Each was
dry-run with `python3 tools/level_request.py <file>` (all ACCEPTED, no errors, no warnings) and then applied with
`--apply`, in the order below. Every par below is the exact swap distance to a fillable rim computed by the game's own
engine (`kempe_engine.HoleGame` through `build_game.Board`). It is asserted by each level's `expect`, so the build fails if it ever drifts.

Paths in "source" are under `~/GraphColour/SolvingFrameworkPlan/docs/working/`. R is the longest interior π-run
and NR the longest π-run of doubly locked states with N ≤ 9, both as the census defines them
(`Census34/README.md`). S is the number of colourings up to renaming. The engine's S equals the census S at every hole.

## What was added

Two new islands after the Boss (`deepest-pit`), so a player meets them only after the 6-swap boss:
**Frontier** (`["Census Frontier", "cape", "🧭"]`, levels 17.x) and **Abyss** (`["The Abyss", "cave", "🕳️"]`, 18.x).
Levels go from 3 to 40. Each island is one run on the level map (no split warning).

| # | level id | map key | census record (source file) | hole | ring | census facts | S | Kempe classes | par (exact) | states at that depth | N |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 17.1 | `eight-seas` | p33r240 | p33.r240#15356 (`Census33/out/frame-33.txt`, eval-33) | 29 | 66666 | 8 Kempe classes (most of any 66666 hole searched), class floor F/N = 1/4, R 1, NR 2 | 5,403 | 8 | **3** | 1 (unique, deepest) | 9 |
| 17.2 | `long-locked-shore` | p34r51 | p34.r51#808692 (`Census34/out/maxima_graphs.txt`) | 26 | 75755 | NR 8 (order-34 maximum, one of 5 holes), R 1 | 11,005 | 1 | **3** | 4 (deepest) | 8 |
| 17.3 | `seven-locked-flips` | p34r189 | p34.r189#963215 (`Census34/out/maxima_graphs.txt`) | 31 | 66655 | R 7: the only R = 7 hole of 3,612,341 at order 34; NR 4 | 10,064 | 1 | **4** | 4 (deepest) | 8 |
| 17.4 | `alone-at-four` | p34r10 | p34.r10#9026667 (`Census34/out/maxima_graphs.txt`) | 14 | 75755 | R 6, NR 3 | 6,857 | 1 | **4** | 1 (unique, deepest) | 8 |
| 17.5 | `double-record` | p34r84 | p34.r84#650604 (`Census34/out/maxima_graphs.txt`) | 2 | 66656 | NR 8 and R 5 at one hole | 6,102 | 1 | **4** | 3 (deepest) | 8 |
| 17.6 | `order-33-record` | p33r115 | p33.r115#64736 (`Census33/out/maxima_graphs.txt`) | 1 | 66575 | order-33 R record: R 6 (only hole), NR 7 | 5,874 | 1 | **4** | 2 (deepest) | 8 |
| 17.7 | `eighth-neighbour` | p34r2_856229 | p34.r2#856229 (`Census34/out/pilot/frame-pilot.txt`, eval-pilot) | 30 | 558+66 (55866) | a degree-8 rim region; R 4, NR 4 | 7,626 | 1 | **4** | 1 (unique, deepest) | 8 |
| 18.1 | `quarter-sea` | p33r57 | p33.r57#472945 (`Census33/out/frame-33.txt`, eval-33) | 22 | 66666 | 2 Kempe classes, one at the quarter floor F/N = 1/4; R 4, NR 5 | 6,050 | 2 | **4** | 1 (unique, deepest) | 8 |
| 18.2 | `pit-55666` | p33r37 | p33.r37#518330 (`Census33/out/frame-33.txt`, eval-33) | 30 | 55666 | R 5, NR 5 | 5,352 | 1 | **5** | 1 (unique, deepest) | 8 |
| 18.3 | `pit-56665` | p33r116 | p33.r116#1021256 (`Census33/out/frame-33.txt`, eval-33) | 10 | 56665 | R 5, NR 5 | 5,688 | 1 | **5** | 1 (unique, deepest) | 8 |
| 18.4 | `pit-of-sixes` | p33r219 | p33.r219#268508 (`Census33/out/frame-33.txt`, eval-33) | 31 | 66655 | the whole map has only degrees 5 and 6 (maxdeg 6); R 5, NR 6 | 8,752 | 1 | **5** | 1 (unique, deepest) | 8 |

Every start is doubly locked (both rim locks shut). `double-record` also tags `piOnly`: every quickest first move is the π swap.
Picks are `{"deepest": true}`, plus `"prefer": ["-difficulty"]` where several states share the deepest par. Ties go
to the smallest state key, so each start is reproducible. The resolved start colourings are in each request's `--json` response.

States by par (engine), for reading the depth claims:
p33r240 {1: 2079, 2: 486, 3: 1}; p34r51 {1: 4783, 2: 1588, 3: 4}; p34r189 {1: 3940, 2: 1095, 3: 24, 4: 4};
p34r10 {1: 2799, 2: 846, 3: 8, 4: 1}; p34r84 {1: 2524, 2: 516, 3: 11, 4: 3}; p33r115 {1: 2443, 2: 776, 3: 12, 4: 2};
p34r2_856229 {1: 3090, 2: 693, 3: 3, 4: 1}; p33r57 {1: 2542, 2: 507, 3: 5, 4: 1}; p33r37 {1: 2106, 2: 565, 3: 8, 4: 4, 5: 1};
p33r116 {1: 2282, 2: 585, 3: 5, 4: 3, 5: 1}; p33r219 {1: 3531, 2: 1010, 3: 8, 4: 4, 5: 1}.

## How the maps were chosen

None of the census outputs records distance to a fill. It was computed here with the game engine (about 12 s per hole on
this MacBook). No new census was run, and no census file was changed.

1. **Targeted holes (16).** Every Census34 extremal hole not already in the game, the three Census33 extremal holes,
   p34.r28#2984559 h22, and four 66666 holes (max R and NR among 66666 holes, and the most Kempe classes). The 66666 holes were found by
   reading `Census34/out/pilot/eval-pilot.jsonl` and `Census33/out/eval-33.jsonl.gz`.
2. **Depth scan (97 of 99 queued holes).** All Census33 holes with R ≥ 5 or NR ≥ 7 (52, rot from `frame-33.txt`), and
   all Census34 pilot holes with R ≥ 4 or NR ≥ 6 (47, rot from `pilot/frame-pilot.txt`).
   - Depth histogram: Census33 {3: 14, 4: 35, 5: 3}, pilot {3: 13, 4: 32}.
   - The last two pilot holes (p34.r2#1134969 h14, h24) were not run: the battery fell to 20% while charging, so the scan was stopped.
   - The full order-34 eval (`eval-34.jsonl.gz`) and `frame-34.txt` are not on this MacBook (gitignored), so order-34 holes outside the maxima file and the 1.17% pilot were not searchable.

Nothing deeper than 5 turned up. The three depth-5 holes are all at order 33. r178 h10 (6 swaps, the shipped boss) is still the deepest known start.

## Rejected, and why

| candidate | engine result | reason |
|---|---|---|
| p34.r178#11764701 h10, p34.r210#8259718 h32, p34.r1#21568 h16, p34.r28#2984559 h4 | already in the game (r178, r210, r1, p34r28) | the R = NR = 8 record and the second pit already ship |
| p34.r156#1037613 h33 (R 6), p34.r215#4364607 h5 (R 6) | par 4, 2 states each | same ring (66655) and depth as p34r189, with a shorter run: near-duplicates |
| p34.r119#1845059 h5, p34.r146#681035 h24 (NR 8) | par 3 | NR 8 is already covered by p34r51, p34r84 and r178 |
| p34.r28#2984559 h22 (two π 20-cycles) | par 3 | same graph and same twin-loop story as the shipped `twin-loops` |
| p33.r147#128636 h2 (order-33 NR 8 record) | par 3 | superseded by the five order-34 NR = 8 holes |
| p33.r141#556370 h7 (all-DL π 20-cycle) | every loop state par 2; deepest par 3 | every all-DL π loop found at orders 30-34 has length 20, and six loop maps already ship; no longer loop exists to add |
| 66666: p33.r233#2433050 h13 (NR 6), p33.r43#3393482 h4 (7 classes) | par 3 | same idea as `eight-seas`, shallower or fewer classes |
| 66 other depth-4 holes from the scan (e.g. p34.r2#28119 h0 and p34.r2#137151 h10, each with a unique par-4 state) | par 4 | one representative kept (p34r2_856229, chosen for its degree-8 rim region) |

## Still to do (not done here)

1. **Rebuild `levels.js` / `layout.js` on the Studio.** Run `python3 build_game.py`.
   - Until then the game and every node check still use the old 29-level `levels.js`. `levels.json` and `maps/` already hold the 40 levels.
   - The 11 new maps need region shapes. That needs numpy, scipy and torch, and this MacBook has numpy only. Expect a minute or two per map.
   - The build may write `layoutSeed` / `drawSeed` into the new map files. Commit those too.
   - No map sets `"world": true`, so no t-SNE colouring-space mini-map is built (same as r210 and p34r28). Add it to any map that should get one; scikit-learn takes a few minutes per map.
2. **Bump `VERSION` in `sw.js`** after that build. This was not done here because another session is editing `sw.js`.
3. **Re-run the checks** on the rebuilt `levels.js`: `skin_check`, `tickets_check`, `shop_check`, `embed_win_check`, `free_check`, and `cells_check` (the build runs it).
4. **Optional follow-ups:**
   - Measure the new levels' pay and append it to `PAY` in `tools/tickets_check.js`. The levels are at the end, so the ticket gates are unaffected.
   - Add ids to `tools/embed_win_check.js` and `tools/maze_check.js`.
5. **No action needed on `firestore.rules`.** `MAX_LEVELS` is the `num(d.levels, 0, 64)` bound, and 40 ≤ 64.

Checks run here after `--apply`, against the old `levels.js`, all pass:
- skin_check: OK (3 existing art warnings);
- tickets_check: OK;
- free_check: 145 layouts, 0 failing;
- shop_check: OK;
- embed_win_check: 32 of 32 OK.

## Picking these up in the RL arena (`~/GraphColourRLArena`)

The arena's `levels.js` is a byte copy of 4square's (identical today, `cmp`). The worker loads it from the repo root
(`docs/arena/worker.js`: `importScripts('../../levels.js', ...)`), and the Node tools `require` it. The census distances it needs
(`graphs[key].dist`, exact fewest swaps to a fill) are written by the 4square build. The sync is therefore:

1. Run the Studio build above in 4square, so that `levels.js` contains the 11 new graphs.
2. `cp ~/4square/levels.js ~/GraphColourRLArena/levels.js` and commit it in the arena repo. No arena code needs changing.
3. Decide the split. Otherwise the new maps join the test set by default, and old and new test numbers can no longer be compared:
   - `tools/arena_scale.js` takes `TEST_MAPS = ALL − TRAIN_MAPS`, so all 11 new maps become held-out test maps.
   - The page marks levels it has no saved choice for as `test`.
   - Either keep them as a new hard held-out set, or add some keys to `TRAIN_MAPS` in **both** `tools/arena_scale.js` and `tools/arena_hardgen.js`, which keep separate copies of the list.
   - The census test-map list in the header comment of `arena_hardgen.js` would need the same update.
   - The new maps hold 26 states at par ≥ 4 (3 of them at par 5) and 89 more at par 3 for the `test3`/deep-start benchmarks (`dist ≥ 3`).
