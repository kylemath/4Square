# Shoreline: design note (lab prototype)

Prototype page: `lab/shoreline.html` (open `lab/shoreline.html?lvl=<id or number>`, add `&shore=shells` for the
harder-to-see, roomier shore). It is a skin on the reel since 14 Oct (see Registration). The rules and the solver are in
`lab/shoreline-core.js`; `node tools/shoreline_check.js` checks every level.

## The idea

Turn the player's attention away from the hole while still aiming at it. **You may only swap a chain that touches
the shore.** The shore is the edge of the map; everything else is deep water: visible and coloured, but you cannot
touch it. You still win the usual way: the rim around the hole (the lagoon) drops to 3 elements.

Every swap starts at the coast and runs inward as a wave. You watch it reach the lagoon, or die out before it.

## What the player sees

- **The sea.** Every region is drawn from its exact cell polygon (`g.cells`). Deep tiles sit under a blue-black
  water layer with faint icons. Shore tiles are raised, bright and rimmed with sand, and their glow slowly breathes
  (SKIN-SPEC 0.2: what you can touch glows, what you cannot is flat).
- **The coast is thicker than the layout.** In `layout.js` the 3 border regions are thin strips along the outer
  frame of the drawing. Every vertex that lies on that frame is pushed out by about 5% of the screen (18 to 34 px), so
  the strips become beaches wide enough for a thumb. Only the outer frame moves, so no two tiles gain or lose a shared
  border. Icons, chips and hit anchors use each tile's deepest inside point, not the layout centre, because a border
  region's layout centre lies inside another tile.
- **The lagoon (the hole).** A teal pool with a slowly moving foam ring. It is the target.
- **HUD.** Undo and reset sit top left. In the middle is a rim strip (hidden when the shell's full HUD already shows
  the rim). Prev and next are top right (standalone only). At the bottom: the shore mode pill (standalone only), a
  `moves / shore par` chip (a wave glyph plus `1 / 3`) and the lighthouse hint button. All controls use the
  `--sk-ctl*` tokens.

## Input

- **Tap a shore tile.** Up to 3 partner chips open at your finger, fanned toward the lagoon (one per other element;
  a web shows as a grey chip). Press a chip to light its chain (outlined tiles plus links), and release on it to swap.
- **Drag** from a shore tile onto a neighbour of another element, which lights `g.chainAt(u, col[v])`. Release on it
  to swap.
- **Tap deep water.** The tile wobbles, a low blip plays, and every shore tile flashes. The game does not change; the
  flash just shows where you can act.
- Every chain through a shore tile touches the shore, and every chain that touches the shore runs through some shore
  tile. So "tap a shore tile, pick a partner" reaches exactly the allowed moves, and there are no other ones.

## The swap: a wave

- The swapped chain's tiles flip in BFS order from the tile you touched (the first foam ring starts where your finger
  was). Each tile gets a foam crest on its outline and a ring, flips colour halfway, and plays a rising pentatonic
  plip. The swap also makes a surf sound.
- **A chain that never meets the rim** is still allowed, and it can matter. Its wave loses height as it travels
  (crest, ring and plip volume fall off with BFS depth), and the lagoon gives only a faint ebb when the wave ends.
- **A chain that meets the rim.** When the wave reaches the first rim tile, droplets spray into the lagoon and the
  lagoon reacts:
  - **splash** (a white ring and a wash sound): the rim pattern is unchanged up to renaming the elements;
  - **shimmer** (four element-coloured rings, sparkles and a chime): the rim pattern changed but still uses 4
    elements;
  - **fill**: the win.
- **A web** (the only chain of its pair) is never swapped: its tiles bob and settle, with a double thud.
- **The win.** The lagoon fills with the free element, and its icon appears. Rings roll out from the lagoon to the
  coast while each tile bobs in turn by its distance from the hole, and a chime runs. After 3.6 s it calls
  `LAB.done()`. Embedded, the page then idles: taps do nothing, and undo and reset are inert. Standalone, a tap after
  4.2 s resets the level.

## The solver, shore par and the hint

`SHORE.solve(spec, col, shore)` is a breadth-first search over colourings up to renaming of the elements. It only uses
allowed moves (non-web chains that meet the shore). It is capped at depth 7 and 50,000 states and returns the
distance and one optimal line. A line is a list of chain vertex sets; a vertex set does not change when the elements
are renamed, so the first one is a chain of the actual board.

- **Shore par** is that distance from the level start. It is computed once at load and shown as `moves / par`; the
  count turns orange once you go over par.
- **Hint (lighthouse).** It re-solves from the current position, opens the chips on the shore tile of an optimal
  first move, and rings the right chip in the accent colour. After 9 s with no touch, that shore tile bobs on its own.
- Real cost on these maps: the search touches at most a few dozen states (all 40 levels, both modes, together take
  well under a second in node).

## Difficulty modes

| mode | shore | how to get it |
|---|---|---|
| **beach** (default) | the 3 outer-face regions (`g.border`) | default; embedded always uses it |
| **two shells** | the outermost two BFS shells from the hole (`d >= dmax - 1`, rim d = 1), 6 to 19 tiles | `&shore=shells`, or the pill (standalone) |

Beach is the purer and harder form: only 3 tiles are touchable, and every swap enters from the coast. Two shells gives
more entry points, with par equal to normal par on every level here, but more of the board lights up. The onboarding
ponds (−1.x) have no border, so they always use shells; there the shells cover almost the whole map, so the rule does
not restrict anything yet.

## The solvability fact, checked here

Long Table, `GraphColour/backgroundMaterial/planemap-structural/longtable/boundary/` (exploratory, A2): on the 36
non-onboarding levels, every unfilled state can still reach a fill using only chains that meet the outer face.

`node tools/shoreline_check.js` reproduces this with the page's own code. For all 40 levels × both modes it:

1. solves from the start;
2. plays the line through `lab/core.js` (`g.swap` on chains found by vertex set) and checks each chain meets the shore,
   is not a web, and that the line wins in exactly shore-par moves;
3. checks that, from random shore-only positions (1 to 12 random allowed swaps from the start), a fill is still
   reachable with shore-only swaps (depth 12, up to 200k states).

**Result: 80/80 rows pass.** Par changes on these levels:

| level | normal par | beach | two shells |
|---|---|---|---|
| 0.3 archipelago | 1 | **2** | **2** |
| 2 open-doors | 1 | **2** | **2** |
| 7.3 quiet-way-out | 2 | **3** | 2 |
| all other 37 | = | = | = |

**Correction to the brief.** It said "par equals normal par except 7.3". The Long Table's own data file
(`levels-ring.jsonl`, columns `border3` and `outer2`) agrees with this table: 0.3 and 2 also go from 1 to 2, in both
modes. The README there ("equal on 35") undercounts. Nothing is unsolvable; these three levels are just a move longer.
On 0.3 and 2 the one-move win uses a chain that never reaches the coast, which makes them good teaching levels for
this skin.

## Registration (done, 14 Oct)

Shoreline is a skin on the reel: `skins/shoreline.js` (sea and sand tokens, `hud: 'compact'`, pebble tiles with one
silhouette per element, the sea glass coin at 12 G, a beach level map, icon, card, logo, two eggs), one more ticket on the ladder in `tickets.js` (with Respawn's:
ticket 17 at 38 levels and 5,700 points, ticket 18 at 40 levels and 6,000; any ticket unlocks any skin), sea glass markets with trigons and comets in `economy.js`, `sw.js` CORE, `index.html`,
`embed_win_check` (`shoreline: 'compact'`).

- **Per-skin par.** The spec carries `par: { archipelago: 2, 'open-doors': 2, 'quiet-way-out': 3 }`. The shell's
  `parNow()` (`index.html`) uses it for stars, the brief, the win card and the hint nudge whenever the level runs in this
  skin (an island fallback uses the census par). `verify.js` holds the same table (`SKIN_PAR`) so a run proof's stars are
  checked against shore par, but only when every swap of the proof touched the shore (otherwise the census par and a soft
  `off-shore` finding). `tools/shoreline_check.js` checks that the spec and `verify.js` both equal the solver's beach par
  wherever it exceeds the census par, and verifies a shore-line proof (3 stars) and a census-line proof (`off-shore`) on
  each of the three levels; `tools/skin_check.js` checks the spec against `verify.js`.
- **Demo.** `lab/core.js` gained a `g.demoPick` hook; the page sets it under `?demo=1` to play an optimal shore line (a
  random shore chain when the solver has none), so the shop's live preview (`tickets.js` `LIVE`) never shows a
  deep-water swap.
- Ticket gates are measured on Islands play at the census par; Shoreline's three longer levels cost nothing there.
