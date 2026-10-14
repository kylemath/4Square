# 4square skin spec sheet

4square is one puzzle (Kempe swaps at a degree-5 hole) with many looks. The **app** (`index.html`) is the shell: title
screen, level map, briefs, scoring, saves, the exploration map of colouring space, the win screen and its bonus round.
A **skin** is the play surface plus a set of design choices the shell applies everywhere around it.

A skin is two things:

1. **A spec file** `skins/<id>.js` that registers one object with `FTH_SKINS.register({...})` (fields below). It is
   loaded by the app on every page load, so it must be small, synchronous and side-effect free apart from `register`.
2. **A play page** (optional) `lab/<id>.html` built on `lab/core.js`. The Islands skins that draw the island board
   (Islands, Islands Free) have no page: the shell draws the board with `board/island.js` (section 11). Every other
   skin plays inside a frame.

Nothing else is per-skin. A skin never edits `index.html`, `lab/core.js` or another skin's files.

## 0. The product bar (read this first)

4square is a **fun mobile game**, not a puzzle tool. Islands is the reference for every skin: bright layered shapes, a
thick dark outline on every object, one light from the top left, chunky 3D buttons, things that bounce, pop, fly and
glow. Complexity of the maths must never leak into the look. A skin is rejected if it fails any of these:

1. **Symbols, not sentences.** Any on-screen copy is at most ~4 words (a level title, "+120", "×3", "SWAP"). Teach with
   pictures and motion (a pulsing chain, a ghost finger, an arrow), never with an instruction paragraph. No status
   lines that narrate the rules ("tap a door, swipe or use the arrows...", "none of its 5 ions may be inside"). The
   brief and how-to pages are the only place for a sentence, and they get one short one each.
2. **Every affordance is visible.** What can be touched glows, bobs or pulses; what cannot is flat and quiet. The next
   useful action is always the brightest thing on screen. Colour carries meaning (the four element colours, the
   accent for "do this", grey for "not yet").
3. **Every action has juice** (section 14): a swap flips with a pop and a sound, coins fly from the swap into the
   counter, a win is a 3 to 5 s sequence. A silent, static change is a bug.
4. **Filled, not line art.** Icons, tiles, markers and coins are solid cartoon shapes with an outline, a highlight and a
   drop shadow (an offset darker copy). Thin strokes on an empty background are for the board's links only. A skin
   whose look is minimal (Dots, Line Doodle) is minimal in *palette and pace*, not in polish: its icon, buttons and
   coins are still crisp, filled and alive.
5. **It has an app-store icon and a card** (section 13) good enough to sell the skin on their own.

`node tools/skin_check.js` enforces what a script can (icon and card present, copy length of `intro`, `words`,
`blurb`); reviewers enforce the rest by comparing a skin's screenshots (`node tools/shots.js`) with Islands'.

## 1. The spec object

```js
FTH_SKINS.register({
  id: 'dots',                      // matches the file name and save keys
  name: 'Dots', ic: '⚫',           // title-screen chip (short name, one emoji)
  blurb: 'one finger, one line',   // under the chip when selected (max ~30 chars)
  src: 'lab/dots.html',            // the play page; omit for the island board (section 11)
  family: 'islands',               // optional: skins of one family sit together in a box on the title screen
  look: 'islands',                 // optional: the skin whose chrome CSS scope applies (default: this skin's own id)
  board: { free: false },          // island-board skins only: layout and physics of the board (section 11)
  waits: false,                    // true: after the winning swap the player still has a step (Line Doodle colours the hole)
  own: false,                      // true: the skin has its own goal and reports with LAB.finish(swaps) (Blank Doodle)
  needs: [],                       // ['cells']: needs region shapes (every map has them now); ['tri']: the map must be a
                                   // triangulation (3n - 6 borders: not the Level -1 ponds), as Signs' cut needs

  hud: 'full',                     // 'full' | 'compact' | 'minimal'  (section 2)
  theme: { ... },                  // CSS custom properties (section 3)
  css: '',                         // optional extra CSS, scoped by the shell to body[data-skin="<id>"]
  fonts: [],                       // optional Google Fonts stylesheet URLs (https://fonts.googleapis.com/css2?...)

  title: { svg: '...' },           // title-screen art under the logo (section 4)
  intro: [ { title, text, svg } ], // how-to-play pages (section 5)
  bonus: { ... },                  // the win-screen bonus round (section 6)
  map: { ... },                    // the exploration map's look (section 7)
  words: { ... },                  // optional copy overrides (section 8)
  coin: { ... },                   // the skin's own currency: name, value, art (section 12)
  icon: '<svg viewBox="0 0 120 120">…</svg>',   // REQUIRED: the app-store icon (section 13)
  card: '<svg viewBox="0 0 240 320">…</svg>',   // REQUIRED: the reel card: logo + a still of play (section 13)
  logo: '<svg viewBox="0 0 240 80">…</svg>',    // optional: the skin's name as a stylised wordmark (section 13)
  eggs: [ { id, on, … } ],                      // optional: easter eggs (section 15)
});
```

Every field except `id`, `name`, `ic` is optional; the shell falls back to the Islands look. A skin can be derived from
another one that is registered before it: `FTH_SKINS.register(FTH_SKINS.extend('islands', { id: 'islands-free', name: …, ic: …, blurb: …, board: … }))`.
`extend` copies the base spec and merges plain-object fields (`theme`, `words`, `map`, `bonus`, `levelMap`, `title`,
`board`, `coin`) one level deep; everything else in the override replaces the base's. **Skin ids are permanent**: saves,
leaderboards and the research log key on them (progress itself is per level id and shared by every skin).

## 2. HUD levels

The shell's bar on top of the play surface:

| level | shows |
|---|---|
| `full` | menu, level badge and title, the coin counter and its wallet button, help, the rim (goal bar), 3-star meter, the exploration-map hexagon (bottom right) |
| `compact` | one slim row: menu, title, star meter, a small MAP button. The coin counter and wallet stay on the title screen and the level map, so the map can sit in the bar's empty corner |
| `minimal` | a floating round menu button and a tiny star meter only; the exploration map opens from the menu button's long-press. The wallet stays on the title screen and the level map |

The frame URL carries `&hud=<level>` so a play page can show or hide its own chrome (its own undo/reset stay; it
should not repeat the level title or stars when the hud is `full` or `compact`).

## 3. Theme tokens

Applied as CSS custom properties on `<body data-skin="<id>">`, used by the title screen, level map header, HUD, brief,
win card, bonus round and how-to-play:

| token | meaning | Islands value |
|---|---|---|
| `--sk-bg` | page background behind everything (any CSS background) | sky gradient |
| `--sk-ink` | main text colour on that background | `#ffffff` |
| `--sk-accent` | highlights, tags, focus rings | `#ffd84a` |
| `--sk-card` | background of cards (brief, win, how-to) | dark slate gradient |
| `--sk-card-ink` | text on cards | `#e6edf3` |
| `--sk-hud` | HUD bar background | navy gradient |
| `--sk-btn` | primary button background | green gradient |
| `--sk-btn-ink` | primary button text | `#ffffff` |
| `--sk-btn-shadow` | primary button 3D edge colour | `#1c7a2e` |
| `--sk-font` | font-family stack for headings and buttons | system rounded |
| `--sk-radius` | corner radius of cards and buttons | `22px` |

## 3b. Chrome tokens (optional)

Bars, chips and secondary buttons (home, help, undo, restart, hint, back/next, the star and lock chips under level
markers, the points counter, the talking-pin bubble) use these. Each falls back to the card colours, so a skin can
ignore them, but a high-end look sets them (and may add more in `css`):

| token | meaning |
|---|---|
| `--sk-chip` / `--sk-chip-ink` | background / text of bars and chips (goal bar, star meter, badge, star and lock chips) |
| `--sk-edge` | border colour of chips and secondary buttons |
| `--sk-btn2` / `--sk-btn2-ink` | secondary buttons (white, yellow, blue, orange variants) |
| `--sk-coin` | the points counter |
| `--sk-ctl` / `--sk-ctl-ink` / `--sk-ctl-edge` | **the play page's own small controls** (undo, restart, and any button the page draws): background, glyph or text, border. Solid colours (the page also uses `--sk-ctl` as the halo behind a glyph) |
| `--sk-star-on` / `--sk-star-edge` | an earned star's fill / outline (star meter, level-map star chip) |
| `--sk-star-off` / `--sk-star-off-edge` | an unearned star's fill / outline. **Both must be at least 3:1 against the chip** (WCAG non-text contrast), yet quieter than the earned star |

**Tokens reach the play page.** The shell posts the skin's whole token set (`{ fth: 1, cmd: 'tokens', vars }`) to the
frame when it reports `ready` and again whenever the skin changes; `lab/core.js` turns it into an injected
`<style id="sk-tokens">:root { --sk-... }</style>` (and, when the frame is same-origin, reads the parent's tokens at load so
there is no flash). A page uses `var(--sk-ctl, <its own colour>)` in CSS or `LAB.tok('--sk-ctl', '<its own colour>')` in
canvas code (`LAB.tokens()` returns all; a `sk-tokens` event on `document` says they changed). Standalone nothing is
set, so the fallback, the page's own look, applies. **Every control a page draws must wear `--sk-ctl*`**; the artwork
stays the page's. `node tools/contrast_check.js` fails a skin whose stars are under 3:1 on their chips.

Selectors worth restyling in `css` (it is scoped to your skin): `.btn3d` and its variants `.white .yellow .blue
.orange .go .rb .rbtn`, `.badge`, `.coins`, `.goalbar`, `.starbar`, `.mnode .mst` (stars) and `.mnode .mtag`
(lock number), `.mnode .pulse`, `.say .msg` (the talking-pin bubble), `.skins button`, `.htdots`, `.htnum`, `#installSheet .card`.

## 4. Title art

`title.svg`: an SVG string with `viewBox="0 0 300 250"`, drawn under the "4square" logo while this skin is
selected. Static or CSS-animated (keep animations under `@media (prefers-reduced-motion: no-preference)` inside a
`<style>` in the SVG). Show this skin's take on "a rim of four elements round a blank hole".

## 5. How to play

`intro`: 3 to 5 pages, each `{ title: 'Swap a chain', text: 'one or two short sentences', svg: '<svg viewBox="0 0 300 250">…</svg>' }`.
The shell shows them in its carousel (Back / Next / Skip). Teach, in this skin's own words and pictures:
the goal (empty the hole's rim of one element), what a chain is and how this skin swaps it, a lock, and the win.
SVGs may animate with CSS; no script inside them.

## 6. Bonus round and the win flow

After a win the shell plays the skin's **win flow**. Two flows exist:

| `bonus.flow` | what happens after the win scene |
|---|---|
| `'card'` (default) | the win card (stars, coins flying into the total), then one **bonus game** picked at random from `bonus.games`, then NEXT |
| `'fade'` | no card and no bonus: the board slowly fades out (~1.5 s), the stars and pay land quietly in the HUD, and the next level fades in already started (no brief). For chill, endless skins (Dots) |

```js
bonus: {
  flow: 'card',                    // 'card' | 'fade'
  games: ['chain', 'snake', 'hop', 'stack', 'pop'],   // which bonus games this skin may roll (default: all five); [] = card with no game
  label: '★',                      // the tag on the bonus header: a glyph or one short word
  board: 'rgba(...)',              // CSS background of the bonus play area
  line: '#ff7a52',                 // stroke of a traced path (default: the pair's neon colour)
  tile(x, y, r, e, k) { … },       // one gem of element e (the art every bonus game draws its pieces with)
  intro: 'drop',                   // optional: how the bonus board arrives: 'drop' | 'spin' | 'curtain' | 'zoom' (default 'drop')
}
```

**The five bonus games** (`bonus/games.js`; the shell owns rules, input, coins, sounds and the countdown, the skin
owns the look through `tile`, `board`, `line`, the coin and the `--sk-*` tokens). Each round is about 15 to 20 s, is
taught by one animated ghost-finger cue (no instruction text), and pays through the shell's coin flight. Every game is a
Kempe game: pieces alternate two elements.

| id | classic | the idea |
|---|---|---|
| `chain` | match-3 drag | a 5 x 4 board of big gems; drag a path that alternates two elements to reveal hidden coins; three chains |
| `snake` | Snake | steer a snake over a field of gems; it may only eat the element that alternates with its last bite; a wrong bite ends the run |
| `hop` | Frogger | lanes of gems slide sideways; hop up lane by lane, landing only on the element that alternates with your last |
| `stack` | Tetris | gems fall in a narrow well; tap a column so no gem lands on its own element; full rows of two alternating elements clear and pay |
| `pop` | bubble / whack | gems pop up and vanish; tap only the element that continues the two-element run; the run's length is the multiplier |

A skin restricts the list to games that fit its fiction (Rat Maze might roll only `snake` and `hop`; Candy `chain`,
`stack`, `pop`). The rules of each game are documented at the top of `bonus/games.js`; boards are validated by
`tools/bonus_boards.js`.

**`tile` contract** (unchanged): `tile(x, y, r, e, k)` returns the SVG for one gem of element `e` (0 fire, 1 water,
2 air, 3 earth) centred at `(x, y)` with radius `r`. The outer `<g>` must keep `class="tl e{e}"`, `data-k="{k}"` and the
translate; the inner `<g class="tin">` wraps everything else (the shell scales `.tin` when a tile pops and adds the
classes `lit`, `glow` and `spent` to the outer `<g>`; style those in `css`). Draw in local coordinates round (0, 0). The
coins are hidden: **a tile must not draw coins itself**. Gems are drawn big (r is about 2x what it used to be): give them
a bold silhouette that reads at a glance, one element per shape as well as per colour.

**Details the shell settles** (what `bonus/games.js` and the host in `index.html` actually do):

- **Header.** Only `label` (default `★`; keep it a glyph or one short word), the pips, a timer ring and a round skip
  button. No message line. Pips are chains left for `chain` and lives for the others (`snake` 2 runs, `hop` `stack`
  `pop` 3 lives). The ring runs the round's clock (`chain`: each chain's 5 s clock, armed at 2 gems); its last 3 s
  turn red, tick and count down big over the board.
- **Gem classes.** Besides `lit`, `glow` and `spent`, the outer `<g>` of a gem gets `ok` (it may be taken now: the
  shell bobs its `.tin`; also `glow`) and `no` (not now: the shell dims and desaturates it). Moving pieces are your
  tile drawn at `(0, 0)` inside a `<g>` the shell moves, and `r` runs from about 20 (snake, hop) to 31 (pop).
- **Pay.** Every payout pops a coin stack from `#coinG` where it was earned, floats `+N` (`×k` for a multiplier) and
  flies the coins into the win total; the round ends with a `+total` burst, and NEXT / Retry unlock once the coins
  have landed. `chain` keeps the hidden stacks (1 / 3 / 5 coins) and shows the ones you missed at the end.
- **Rules settled here:** `snake` wraps at the edges, waits for the first touch (and after a crash), stops growing at
  14; `hop` ends a life on a gap, a wrong gem or riding off the edge, and a crossing pays 5 coins; `stack`: a full
  row that is *not* two alternating elements also clears, for 1 coin, so the well never jams; `pop`: a wrong tap
  breaks the run and costs a life, letting a gem go is free.
- **Economy.** A coin of a stack is 20 points (the old 9 x 7 board paid 10 a coin over three times the gems). Each
  game's typical and best pay sit within 60-140% / 60-150% of the old round's (`node tools/bonus_boards.js` prints
  and checks the table), so tickets stay balanced whichever game rolls.
- **Design review and tests:** `?bonus=<id>` forces a game (`index.html?skin=dots&view=win&bonus=hop`).
- **The fade flow** keeps everything else of a win: progress, stars, the run proof (`FTH_RUN.win`), the research-log
  record and the ticket dots are written exactly as in the card flow. The GO button's NEXT skips the wait; after the
  last level it fades to the level map. `bonus.intro` and `games` are ignored by `'fade'`.

## 7. Exploration map

Every swap in every skin charts colouring space: the hexes you visit (lit) and see one swap away (glimpsed), and the
lines of your route. The shell draws the map; the skin chooses its look:

```js
map: {
  sea: ['#2f86a8', … 9 colours, shallow to deep],   // illegal colourings, by how illegal
  seaX: '#050c18',                                   // open ocean / background
  fog: '#030508',                                    // optional: the veil over uncharted areas (default: seaX)
  unknown: '#6e6248',                                // fog: legal but not charted yet
  ramp: ['#3fe06a', '#ffe14d', '#ff9a3c', '#ff3b4e'],// fewest swaps to a fill: 0, then near, mid, far
  grey: '#8b949e',                                   // charted, no route known
  route: '#ffd84a',                                  // this game's route
  ink: 'rgba(200,230,255,.85)',                      // labels on the open map
  cell(path, x, y, r) { /* add one cell outline round (x, y) to the Path2D `path` (default: a flat-top hexagon) */ },
}
```

`cell` must only call path methods (`moveTo`, `lineTo`, `arc`, `quadraticCurveTo`, `closePath`, …) and must be
deterministic in `(x, y, r)`: it is called thousands of times per frame.

## 8. Words

```js
words: { win: 'Hole filled!', perfect: 'Perfect route! No shorter way exists.', par: 'Par is {par}. Can you get ★★★?',
         chart: 'COLOURING SPACE' }
```

## 8b. Level map

The level map is one tall SVG (`viewBox="0 0 400 H"`, H about 3,500-4,500) drawn bottom to top: a start marker,
then one **zone** per island of levels (Splash Cove, Warm-up Beach, Tutorial Town, Lock Harbour, Far Chains Forest,
π Loop Lighthouse, Six-Ring Reef, The Depths, Volcano Boss), joined by a winding road through the level markers.
The shell owns layout (where zones, stops, signs and the road go), scrolling, tap targets, stars and progress.
The skin owns every pixel of the look through `levelMap` (all fields optional; Islands uses none):

```js
levelMap: {
  bg: '#2a9fd8',                           // fill behind everything (the "sea")
  defs: '<linearGradient id="dm-land">…',   // SVG <defs> content shared by all your pieces (prefix ids with your skin id!)
  backdrop(H, rnd) { return '<g>…</g>'; },  // art across the whole height (waves, stars, paper texture, string lights…)
  zone(z) { return '<g>…</g>'; },           // one zone's ground and landmarks (replaces the island shape)
  zones: { cove: { land, edge, patch }, … },// OR just recolour the built-in island per theme (no zone())
  decor(theme, r, r2, z) { return '<g>…</g>' or ''; }, // one decoration centred on (0, 0); called for each free spot
  keepOut(z) { return [[x0, y0, x1, y1], …]; }, // boxes (SVG coords) where the shell must not place decor: your landmarks
  sign(label, w, z) { return '…'; },        // a zone's name sign, drawn at (0, 0), w wide, ~32 high (label = emoji + name)
  road: { todo: [outer, inner, dash], done: [outer, inner, dash],   // road colours: unplayed / played
          widths: [20, 13, 13], dash: '3 6', cap: 'butt' },              // optional: layer widths, dash pattern, dash caps ('none' hides a layer)
  node(state, num, e, boss) { return '…'; },// one level marker in the box -40..40 (radius ~31)
  start() { return '…'; },                  // the start marker at (0, 0)
  pin() { return '…'; },                    // "you are here" marker, viewBox -23 -30 46 58 (tip at 0, 27)
}
```

- `z` is `{ x0, y0, x1, y1, index, name, emoji, theme, boss, stops, path, rnd }`: the zone's box (x 18-382),
  its theme id (`cove beach town harbour forest cape reef cave volcano`), whether it is the final boss zone, the
  `[x, y]` of its level markers (keep landmarks clear of them), the built-in island outline `path` (an SVG path
  you may reuse or ignore), and `rnd(a, b)` → [0, 1), deterministic.
- `decor` is called for spots already checked to be clear of the road, the markers and the sign. Return `''` to
  leave a spot empty. `r` picks the kind, `r2` varies it. Keep each piece within ~±22 px.
- `node` states: `'locked'` (`e` = -1, show a lock), `'open'`, `'beaten'`, `'current'` (the shell adds a pulse
  and the pin). Show `num` (e.g. "7.3", "-1.2", "16") legibly; `e` (0-3) is the element colour for open levels.
  The shell draws the stars under the marker.
- Quality bar: the Islands map is the reference. Layered shapes, a consistent light from the top left
  (highlights top-left, shade bottom-right), a dark outline or crisp edge on every object, soft shadows (an
  offset darker copy, not blur filters), lively varied decorations, and every zone clearly its own place. Prefer
  gradients and shapes to `filter`s: dozens of filtered elements stutter on phones. Text inside the SVG must use
  a font the page loads (your `fonts`) or a system fallback.
- Everything is a string; no script, no external images. Prefix every id in `defs` with your skin id.

## 9. The play page contract (unchanged; see `lab/core.js`)

- Load `../levels.js`, `../layout.js`, `core.js`; create the game with `LAB.game()` (it reads `?lvl=`).
- Inside the app (`?embed=1`), core.js posts every swap, undo and reset to the app; call `LAB.done()` when your win
  celebration ends (`own` skins call `LAB.finish(swaps)` instead; `done` is posted once per win). Script errors fall back to the Islands board.
- **After a win, an embedded page never restarts itself; the shell owns what happens next** (its win screen, bonus
  round, next level). When `LAB.embedded`: a tap, click or key on the frame after the win does nothing (no `g.reset()`,
  no fresh sheet, no replay countdown, no level step), the page's own undo/restart are inert once won, and no dev text
  stays on screen ("tap for a fresh sheet", "tap to play again", "click", "lab", "TODO", "debug"...). Finish the
  celebration, call `LAB.done()`, idle. Tap-to-restart is for standalone lab use only (`if (!LAB.embedded)`); `<html class="embed">`
  is set for CSS (`.embed .hint { display: none }`). `node tools/embed_win_check.js` enforces this on every play page.
- Read `&hud=` from the URL to decide which of your own labels to show.
- Every map's region shapes (`g.cells`) are exact: two pieces share a border iff their tiles are joined
  (`python3 tools/cells_check.py`). Keep any drawing you derive from them honest the same way.

## 10. Checklist for a new skin

1. `skins/<id>.js` registers a complete spec; `node tools/skin_check.js` passes (loads every spec, calls every
   function with sample arguments, checks the bonus tile contract and the intro SVGs).
2. The play page passes the embed test (`ready` and no `error` on every level) and `node tools/embed_win_check.js <id>`
   (nothing restarts or shows dev text after a win), draws its controls with `--sk-ctl*`, and `node tools/contrast_check.js` passes.
3. Add `<script src="skins/<id>.js"></script>` to `index.html` (the shell owner does this) and the files to `sw.js`.
4. Island-board skins: `node tools/free_check.js` passes for the free layout. Islands 3D: `node tools/islands3d_check.js` passes.

## 11. The island board (`board/island.js`)

The island board is one renderer with two layouts; the skin spec picks one with `board`:

```js
board: { free: false }                                  // Islands: the three far regions are walls, tiles sit on the planar layout
board: { free: true, guard: false,                      // Islands Free: no walls, the whole map settles like soft bubbles
         live: { kH: 0, kB: 0, damp: .53, cap: .38, rep: 5, fk: .065, fr: 2.5, fl: 1.15 } }
```

`live` overrides the physics numbers shown in the `#dev` panel (five taps on the level name): `kH` home spring, `kB`
bridge spring, `damp` velocity damping, `cap` swing room and trace tug (x spacing), `rep` like-colour push (walls only),
`pull`, `tug`, and for the free layout `fk` link leash, `fr` bubble push, `fl` bubble size (1 fills about 86% of the
island with a hexagonal packing). `guard` is the crossing guard of the walled layout. A skin with a play page (`src`)
has no `board`. The free layout is settled offline when the level opens (the island opens at rest, the grow-in plays
towards it), kept clear of overlaps by a hard floor under the soft push, and checked on every level and screen size by
`node tools/free_check.js` (it exits 1 if a layout has overlapping tiles, tiles off screen, hidden links, tiles under
22 px, a slow settle, or an off-centre goal).

The shell does not reach into the board. It creates it once, `FTH_ISLAND.create(S)`, passing a read-only view of the
game (`S.view()`: level, graph, colours, chains, the trace) and the few helpers the board draws with (sound, messages,
the tile look), and calls the interface that comes back: `build`, `configure(board, key)`, `reset`, `destroy`, `kick`,
`pick`, `pickAll`, `stepTarget`, `ballAt`, `toScreen`, `posOf`, `dragBegin/Move/End`, `ripple`, `shake`, `popBall`,
`paintBalls`, `drawTraced/Active/Trace`, `drawHoleFill`, `holeCeremony`, `winScene` (the last swap is under way: no hint outlines or lock badges), `dev`.
The win scene (about 4 s: every tile lit, then try-every-element, nesting, each element across the map) is synthesised
sound only (`sfx.js`, passed in as `S.sfx`; `tools/win_scene_check.js` plays and measures it). Chains, flips, scoring, saves and levels
stay in the shell. `layout(grow, [w, h])` and `step(now)` build the geometry and advance the physics without a DOM
(`create` takes `headless: true`), which is how `tools/free_check.js` tests the real code.

### Islands 3D (`lab/islands3d.html`)

The same island as a three.js scene, a normal skin with a play page (`src: 'lab/islands3d.html'`). It sits in the main style list with Islands and Islands Free.
It draws every level: the layout (tiles on a hexagonal lattice, float levels so no bridge runs through a tile) is
derived from the level's own graph and stored per map in `lab/islands3d-plans.js`; `node tools/islands3d_check.js`
checks all of them (and `--write` regenerates the file after a map changes). three.js (r128) loads from cdnjs; if
that, or WebGL, is unavailable the page posts `{ fth: 1, type: 'error' }` and the app plays the level on the island board.
Touch: drag a tile to trace a chain, tap a tile for its chains and press SWAP, drag empty space to turn and tilt, pinch to
zoom; mouse: right button turns, wheel zooms.

## 12. The skin's coin

Every skin earns its own currency. The coin replaces the shared gold coin everywhere the shell shows coins while that skin
is playing: the counter, the flying loot, the loot bag, the win card total, the bonus round's hidden stacks, toasts and the
wallet screen. (The shell rewrites one `<g id="coinG">` in its defs, so there is a single source of art.)

```js
coin: { name: 'pearl', plural: 'pearls',        // singular and plural, lower case: "12 pearls", "Pearls are hidden!"
        glyph: '🦪',                              // one emoji, for text-only places
        value: 60,                               // worth in G, the one base unit ("gold-equivalent"): see the table below
        pitch: 1.25,                             // optional: multiplies the coin-landing clink (0.5 to 2, default 1)
        colors: { main: '#fdf6ff', edge: '#d9587f' },   // optional: two #hex colours that sum the coin up
        svg: FTH_SKINS.coinArt('<circle r="9" fill="#fff"/>...') }   // size => '<svg viewBox="-13 -13 26 26" width=... height=...>...</svg>'
```

- **Art** is drawn in the box `-13 -13 26 26` (centre 0, 0), cartoon style: a dark outline of about 2 units (`#1c1640`, or the skin's
  ink), flat fills, one highlight. `FTH_SKINS.coinArt(inner)` wraps the inner markup into the `svg(size)` function. Make the
  shape different from the other coins (round, drop, gem, cube, shell, pencil...), not just another colour. No script, images,
  event handlers or `id`s (an id must start with `coin-`). `tools/skin_check.js` rejects an unbalanced `<g>`, a missing size, two
  skins with the same coin name, value or art. A skin with no `coin` gets the plain gold coin (`FTH_SKINS.coinOf(spec)`).
- Skins that `extend` another merge `coin` field by field, so give every field again.
- **Skin tickets.** Coins buy skin tickets (`tickets.js`; README "Coins and skin tickets"): a ticket's price is set in points and
  shown in each coin as `ceil(points x FTH_SKINS.rate(spec))`, the rate play pays, so every coin costs the same effort.
  Each skin's wallet buys one ticket only (`save.skins.paid`), so every skin's coins pay for the next skin.
  `FTH_SKINS.rate(spec) = sqrt(10 / value) / 4`. A new skin is locked until a ticket unlocks it; add a `GATE`/`PRICE` step in
  `tickets.js` for it (`node tools/tickets_check.js` fails until there is one ticket per skin other than Islands).
- **Value and the economy.** `value` is the coin's price in G. Coins trade in the exchange (on the feature bench: `?feat=exchange`;
  `economy.js`, opened from the wallet button beside the counter): direct markets between a few coins, a fee of 1 to 5% on each, so
  no cycle of swaps can make money (`node tools/economy_check.js` proves it and prints every best route). Adding a skin means
  a unique value and one or two market lines in `EDGES` and a node position in `POS` (the check fails until they exist).

| coin | skin | G | why |
|---|---|---|---|
| ink bead | Dots | 1 | the commonest: a dot of ink |
| pencil stub | Line Doodle | 2 | worn-down, still plentiful |
| paint drop | Blank Doodle | 3 | cheap, but it takes a few to cover a map |
| letter tile | Rim Word | 4 | a scrap of the alphabet |
| sugar cube | Gran's Table | 5 | a household luxury |
| sweet | Candy | 8 | a wrapped candy, just under a doubloon |
| doubloon | Islands | 10 | the original game's gold: the reference coin |
| casino chip | Bonus Swipe | 14 | a stake, worth a bit more than gold |
| glass marble | Spheres | 16 | a lab specimen from the ball-and-stick model |
| compass rose | Island Map | 20 | an explorer's prize |
| cheese wedge | Rat Maze | 25 | the prize at the end of the corridor |
| cog | Gears | 30 | machined brass, a working part |
| trigon | Signs | 42 | a triangular token, half sun half sea |
| ion orb | Ion Channels | 35 | charged, short-lived, scarce |
| pearl | Islands Free | 60 | rare and valuable |
| crystal shard | Islands 3D | 100 | the rarest |

**Earning.** Points stay the game's score (`save.best`, proofs, stars). Coins are points turned into the skin's currency at
`coins = points x sqrt(10 / value) / 4`, so 4 points are 1 doubloon, a level worth 800 points pays about 630 ink beads, 200 doubloons or 63
crystal shards (rarer coins pay fewer, in G they pay more: a point is worth sqrt(value x 10) / 4 G). Replaying a beaten
level pays a quarter. The credit goes to the wallet of the skin the level actually runs in (an island fallback pays Islands).

**Wallet and save.** `save.wallet = { <skinId>: { bal, earned, f } }`: `bal` coins held, `earned` lifetime coins earned by play (an
exchange never changes it), `f` the sub-coin remainder. It is written only through `persist()`, and `integrity.js` hashes it
with the progress, so an offline edit shows up as an edited save. Migration (a save with no wallet): the old total of best
points becomes the Islands balance 1:1, once. `window.FTH_WALLET` (`bal`, `earned`, `wealth`, `swap`) is the shell's wallet API.

## 13. Icon, card and logo

Every skin sells itself on the skin reel (title screen and shop), where it is a card on a ribbon you swipe left and
right: the centred card is big and bright, its neighbours smaller and shaded.

- **`icon`** (required): an SVG string, `viewBox="0 0 120 120"`, the skin's app-store icon. A full-bleed rounded square
  (rx about 26) in the skin's palette, one bold central motif that says how this skin plays (a candy, a cheese, a
  lettered tile, a glowing ion...), drawn the Islands way: layered fills, a dark outline, a top-left highlight, a drop
  shadow, depth from a gradient. No text except at most one letter or digit that is part of the motif. It must read at
  48 px. Never line art, never an emoji.
- **`card`** (required): an SVG string, `viewBox="0 0 240 320"`, the reel card: a still of this skin's gameplay (its
  board look, its tiles, a chain being swapped) filling the card, with the skin's `logo` (or its name in the skin's
  font) across the bottom third. The shell adds ownership: an owned card is in colour with a slow idle shimmer; a
  locked card gets a grey overlay, stays still and shows a ticket badge.
- **`logo`** (optional): the skin's name as a wordmark, `viewBox="0 0 240 80"`, in the skin's font and colours. The
  reel shows it under the card. Without it the shell sets `name` in `--sk-font`.

All three are plain strings (no script, no external images, ids prefixed with the skin id) and are checked by
`tools/skin_check.js`.

## 14. Juice: what every play page must animate

The shell animates its own screens; a play page owns the feel of its board. Each of these is required:

| moment | what the player sees and hears |
|---|---|
| touch a piece | it lifts or glows at once (< 50 ms); its candidate chains light |
| a chain is traced | the chain pulses in its two element colours, a rising tone per piece |
| swap | every piece of the chain flips in a wave from where you touched (30 to 60 ms apart), each with a pop |
| coins | call `LAB.at(x, y)` (page CSS px) before or right after a swap: the shell flies that swap's coins from there into the HUD counter, which rolls up and bumps |
| progress | the rim / goal shows the change with a bounce (an element leaving the rim visibly flies out) |
| no progress | a soft shake or wobble, never a text error |
| win | at least 3 s: the hole fills with a burst, the whole board celebrates (a wave, a dance, a light show in the skin's fiction), then `LAB.done()` |

Points stay the shell's: it scores framed swaps the same way as the island board, so `LAB.at` only says *where* the
coins come from.

## 15. Easter eggs (optional)

A skin may hide small delights. Each egg is declared in `eggs` so the shell, the reel and the research log know about
it, and it lives either in the play page or in the shell:

```js
eggs: [
  { id: 'snake-run', on: 'page', note: 'trace through every dot of a chain: a rising multiplier', pays: true },
  { id: 'fish', on: 'title', taps: 5, run(fx) { fx.burst('🐟', 0.5, 0.6); fx.sound('pop'); } },
]
```

- `on: 'page'`: the play page detects it and calls `LAB.egg(id, pts)`. The shell credits `pts` points **quietly**: no
  toast, no counter bump, just the coins added (it caps an egg at 2,000 points a level and logs it).
- `on: 'title'` (tap the title art `taps` times), `'map'` (tap the level-map pin `taps` times), `'win'` (once per win, with
  probability `p`, default 0.1) or `'idle'` (after `secs` seconds without a touch on the board): the shell calls
  `run(fx)`, where `fx` offers `burst(glyph, x, y)` (x, y as fractions of the screen), `sound(name)` (`'pop' 'chime' 'whoosh'
  'cheer'`), `shake()` and `pay(pts)`.
- An egg is never needed to progress, never explained in text, and never interrupts play.

## 16. The star rim (shell HUD, `rimstar.js` on `rim.js`)

The shell draws a small pentagram chip in the HUD's stats row for every skin, from its own state (a framed page's
swaps arrive as `col` anyway), so **a play page does nothing for it** and must not draw its own copy. The 5 rim tiles
are the star's points in rim order (turned like the map's drawing), each drawn with the skin's `bonus.tile` gem (else
the shell's); the trouble spot (the element on two rim tiles one apart) is a star edge in `--sk-accent`, its two tiles
ringed; the edges it sat on this level stay brighter; one or two padlocks say how many of Kempe's two rim chains are
blocked; at a double lock a dashed arrow shows where π, the forced swap (it never wins), would swing the spot. A move
that shifts the spot swings the edge (π: two rim places, one star step) and logs a `star_hop` research event.

| hud | where |
|---|---|
| `full` | right after the rim (goal bar); the star meter keeps the right end |
| `compact` | after the star meter, left-aligned under the slim bar (clear of the floating MAP) |
| `minimal` | left of the floating star meter, at its scale |

It wears `--sk-chip` / `--sk-chip-ink` / `--sk-edge` like the goal bar (restyle `.rimstar` in `css` if needed; its
parts are `.rs-star .rs-trail .rs-hot .rs-ring .rs-pi .rs-lock`). Shown on levels whose `tools` include `pi` (the π
island, 7.1 on; `?rimstar=1` every 4-element 5-rim level, `?rimstar=0` never); a tap folds it to a small star
button, remembered per device (`localStorage` `fth-rimstar`). Reduced motion: no swing, no bounce.
`node tools/rim_check.js` checks `rim.js` against `kempe_engine.py`; `node tools/rim_hud_check.js` plays it end to end.
