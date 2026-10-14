# Respawn: design note (lab prototype, working name)

Prototype page: `lab/respawn.html` (open `lab/respawn.html?lvl=<id or number>`, for example `?lvl=12`). It is a skin on
the reel since 14 Oct (see Registration). The model is in `lab/respawn-core.js` (pure, runs in node). The rules are
`lab/core.js` (which gained only the `g.replay` flag).

## The idea

A fast third-person maze runner over the **same state space** as every other skin. The player never sees the whole
swap graph, as the Rat Maze's lights-on view shows it. They see only **the tree they have explored themselves**, and
they lean on it to recover from mistakes.

| game | puzzle |
|---|---|
| room | a colouring, keyed by `g.canon()` (a revisit is the same room) |
| door | a non-web chain `K` of that colouring. Webs only rename two elements, so they are not doors |
| going through | `g.swap(K)` |
| goal room | a won colouring (the rim uses ≤ 3 elements). Stepping in wins |
| your tree | nodes are rooms you have been in, edges are doors you have taken |
| respawn | teleport to any node of your tree (see below) |

## Screen

- **HUD (top):** level badge, level clock, 🚪 rooms entered, 💀 deaths, 👻 respawns, speed chip (🐢 / 🏃 / ⚡),
  blind chip (👁 / 🙈), and ◀ ▶ (standalone only).
- **The room (2.5D canvas):** ceiling, side walls and a perspective floor converge on a back wall. Each room has a
  stable wall hue (a hash of its key), so a room looks the same when you come back to it.
  - **The mural:** the map in the room's colouring. The hole is dark with a "?", the rim has a gold outline, and the
    selected door's chain glows white and neon on the map.
  - **Rim strip:** the 5 rim elements, plus the count of distinct elements in the rim (green once it reaches 3).
  - **Plaque:** `#id` is the room's number in your tree; `×k` is how many times you have entered it.
- **Doors:** one or two rows, ordered by element pair, then by size.
  - Each door frame has two colours, element a on the left jamb and element b on the right.
  - The leaf shows both element tokens and the chain size. Gold pips over the arch give how many rim regions the
    chain touches.
  - Your own memory is drawn under a door: footprints if you have already been in the room behind it, a 💀 if that
    room collapsed on you.
  - Nothing on screen marks a door as good: no `g.good()` hint, no preview of the distance.
- **The runner:** seen from behind. It idles, sprints into a door, turns into a ghost on a death, and beams in on a
  respawn.
- **Tree panel:** at the bottom in portrait, on the right in landscape. It uses a tidy layout: depth runs along the
  long axis, and parents sit centred over their children.
  - Each node is a small pie of its 5 rim elements, so rim patterns can be read straight off the tree. The start has
    a white hub.
  - Tree edges are solid. A door into a room you already know merges into that node and draws a dashed cross-link.
  - Your current walk is cyan. A red ✕ marks a room that collapsed. You are the pulsing ring.
  - The ⤺ button teleports one room back along your walk.
  - After a win the winning walk turns gold and the goal is a star.

## Controls

- **Touch:** tap a door to open it (its chain lights on the mural), then tap it again to run through.
- **Mouse:** hover previews a door, and a click runs through at once.
- **Keys:**
  - ← → pick a door; Enter, ↑ or Space go; 1–9 go straight through that door.
  - Backspace, B or ↓ go back one room.
- **Tree:** tap any node to respawn there. This works alive or dead, and costs a respawn.

## Respawn semantics (commensurate with every other skin)

`T.teleport(id)`:
1. Undo back to the longest common prefix of your current walk (`g.history` + the current room) and the node's
   tree path (its first-discovery parent chain).
2. `g.swap` down the rest of that tree path, finding each door by the key of the room it leads to.

So `g.history` is always **one walk from the start to the current room**. `g.moves` is its length, which is what the
win card shows as 👣 *walk / par*. Teleports are not free: every intermediate state goes through `g.undo`/`g.swap`, so
an embedding app sees ordinary undo and swap messages.

## Timer tuning

- **Room fuse:** `roomTime = clamp(2.4 + 0.18·doors + 0.3·par, 3, 6.5)` s × speed (🐢 1.6, 🏃 1.0, ⚡ 0.7).
  - Rooms with more doors take longer to read, and deeper levels need more thought per room.
  - With current levels at 🏃 the range runs from 3.0 s (splash, 2 doors) to about 5.3 s (deepest-pit), and up to
    about 6.5 s for 16-door rooms.
  - `tools/respawn_check.js` prints each level's start-room fuse.
- **How the fuse shows:** a bar along the ceiling (green, then yellow, then red, with a burning spark). The ceiling
  lamp dims as it burns. In the last 1.5 s there are ticks and a small camera tremble.
- **Death:** the room greys out, rubble falls, cracks run down the wall and the runner becomes a ghost. "💀 RESPAWN"
  appears with an arrow to the tree, and the tree panel glows. The level clock keeps running while you are dead.
- **Start:** a 3-2-1-GO countdown (1.8 s). The mural and the doors are visible but dimmed, so there is a moment to read
  the first room.
- **Tuning ideas not built:**
  - Scale the fuse by the number of *new* doors (fewer seconds in a room you know). This would reward memory directly.
  - Give a small time bonus for a door that is a known room's way back.
  - Make deaths cost clock time (+3 s) instead of only counting them.

## Run mode (the default since 14 Oct)

- One fuse per run: `2.6 + 0.25·par` s × speed at the start, burning only while you decide in a room; every room
  reached adds `1.1` s × speed (capped at start + one bonus). On burn-out you die and, 1.5 s later, a new run starts by
  itself from the start room (🏁 run counter in the HUD). Door order in a room is fixed, so the sequence can be learned.
- Tree teleports and 'back' are off in run mode; `?mode=respawn` keeps the per-room fuse and tree respawns above.
- `tools/respawn_play_check.js` plays both modes on all 40 levels.

## Scoring (on the win card)

- ⏱ level time.
- 🚪 rooms entered, and how many were new.
- 💀 deaths and 👻 respawns.
- 👣 walk length against par (`g.dist()` at the start).
- Stars: ★★★ when the walk equals par, ★★ up to par + 2, otherwise ★. This follows the main game's thresholds.

## Embedding (SKIN-SPEC §9)

- `?embed=1` works through core.js as usual.
- The win runs this sequence: the hole fills in the free element with a burst, confetti falls, the runner jumps, the
  tree walk turns gold, and the card appears at 1.2 s. At 3.6 s the page calls `LAB.done()`.
- After the win every pointer and key input is ignored. The card has no buttons when embedded, and nothing restarts.
- Swaps, undos and resets that come from outside (the app, `?demo=1`, checks) are folded into the tree. An external
  reset clears the tree and starts a new run. In demo mode there is no fuse and no countdown.
- `LAB.at` is called at the door being entered.

## Verified

- `node tools/respawn_check.js` passes on all 40 levels. It checks:
  - following the `g.good()` door each time wins in exactly par doors;
  - each door's dest key equals `g.canon()` after the swap;
  - 30 random walks per level with random respawns (2,955 teleports) each land on the right key, with
    `g.moves == history length` and a walk that runs from the start to the target, and each walk still wins after
    following `g.good()`.
- `node tools/respawn_play_check.js` passes on all 40 levels in headless Chrome at 390×844. It checks:
  - GO is reached, a wrong door is taken by clicking where it is drawn, and clicking node 0 of the drawn tree
    respawns at the start;
  - clicking the drawn good doors wins with walk = par, and the counters match;
  - on the first level, the fuse burns out to a death and a tree click revives;
  - there are no script errors.
- `--shots dir` writes phone and desktop screenshots of level 12.
- `node tools/embed_win_check.js respawn` passes: 4 of 4 levels, with no restart, no dev text and `done` posted once.
- `?demo=1` and blind mode load with no errors.

## Registration (done, 14 Oct)

Respawn is a skin on the reel: `skins/respawn.js` (dungeon and neon tokens, `hud: 'compact'`, doorway tiles with one arch
shape per element, the wisp coin at 50 G, a dungeon level map, icon, card, logo, two eggs), one more ticket on the ladder in `tickets.js`
(ticket 18 at 40 levels and 6,000 points), wisp markets with comets and sea glass in `economy.js`, `sw.js` CORE, `index.html`,
`embed_win_check` (`respawn: 'compact'`). Embedded, the page runs in the default run mode (the shell never passes `mode`).

- **Coins on replay** (option a, generalised). `lab/core.js` adds `replay: 1` to every message posted while `g.replay`
  is set; the page sets it around a teleport. The shell (`index.html`) keeps its colouring, move count and run proof in
  step with replayed messages but pays and charts nothing for them (it already paid nothing for a chain or colouring
  caught before, but a replay through renamed colourings could catch a chain key again).
- **Run-mode restart is one reset.** A restart used to be a teleport to the start room, i.e. a burst of undos within a
  few milliseconds; the run proof (`verify.js`, `swapMs`) rejects that as `impossible-timing`, which would have hidden
  every run-mode win from the boards. The page now restarts a run with a single `g.reset()` (the reset handler keeps the
  tree while a restart is under way). Respawn mode (`?mode=respawn`, lab only) still teleports with bursts.
- The app's undo / restart / hint buttons are not shown by the compact HUD.
## Telemetry: the player's tree as research data

The page already keeps an event log, `window.RESPAWN.log()`, and a full export, `RESPAWN.export()` (JSON).
- **Events:** `go`, `enter`, `die`, `respawn`, `back` and `win`.
- **Each event records:** clock ms, node id and key, `g.moves`, the true `g.dist()` at that moment (recorded but never
  shown), and for `enter` the door's pair, size and rim hits, plus whether the room was new.
- **The export adds:** the tree (parent, depth, visits, deaths, won) and the edges, each marked as a tree edge or a
  cross edge.

This is a direct record of **how humans search the Kempe state space**. Questions it can answer:

- **Door choice vs features:** given the doors on offer, do players prefer rim-touching chains, small chains, or a
  particular pair? Fit a choice model against the census distance drop, the same target as Maze Arena.
- **Backtracking policy:** where do players respawn? Options are the last branching point, the start, or the room
  closest to the goal by true `dist`. Compare with DFS, BFS, iterative deepening and the π rule.
- **Memory:** how often does a player re-enter a room they already know through a different door (dashed merges)?
  Does that help? Do footprints change door choice?
- **Time pressure:** compare decision quality (share of `dist`-lowering doors) under 🐢, 🏃 and ⚡. Compare blind with
  sighted to measure how much the mural is used.
- **Traps:** on π-loop levels (7.x), do humans loop, and how many respawns does it take to break out?
- **Human priors for the nets:** the log gives (state, offered doors, chosen door, outcome) tuples for imitation
  pretraining of the Maze Arena GNN.

To log for real, call the existing `telemetry.js` path. It needs consent, as for the research log; nothing leaves the
device unless an upload form is configured. Per level it would post the compressed export at the win, or at abandon.

## Files

- `lab/respawn.html`: the page.
- `lab/respawn-core.js`: doors, the tree, teleport and the fuse formula.
- `tools/respawn_check.js`: node, model and win checks on all levels.
- `tools/respawn_play_check.js`: headless Chrome, plays through the drawn UI on all levels; `--shots`.
