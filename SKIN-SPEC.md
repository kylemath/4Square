# 4square skin spec sheet

4square is one puzzle (Kempe swaps at a degree-5 hole) with many looks. The **app** (`index.html`) is the shell: title
screen, level map, briefs, scoring, saves, the exploration map of colouring space, the win screen and its bonus round.
A **skin** is the play surface plus a set of design choices the shell applies everywhere around it.

A skin is two things:

1. **A spec file** `skins/<id>.js` that registers one object with `FTH_SKINS.register({...})` (fields below). It is
   loaded by the app on every page load, so it must be small, synchronous and side-effect free apart from `register`.
2. **A play page** (optional) `lab/<id>.html` built on `lab/core.js`. The built-in Islands skin has no page: the shell
   draws its own board. Every other skin plays inside a frame.

Nothing else is per-skin. A skin never edits `index.html`, `lab/core.js` or another skin's files.

## 1. The spec object

```js
FTH_SKINS.register({
  id: 'dots',                      // matches the file name and save keys
  name: 'Dots', ic: '⚫',           // title-screen chip (short name, one emoji)
  blurb: 'one finger, one line',   // under the chip when selected (max ~30 chars)
  src: 'lab/dots.html',            // the play page; omit for the built-in Islands board
  waits: false,                    // true: after the winning swap the player still has a step (Line Doodle colours the hole)
  own: false,                      // true: the skin has its own goal and reports with LAB.finish(swaps) (Blank Doodle)
  needs: [],                       // ['cells']: needs region shapes (every map has them now)

  hud: 'full',                     // 'full' | 'compact' | 'minimal'  (section 2)
  theme: { ... },                  // CSS custom properties (section 3)
  css: '',                         // optional extra CSS, scoped by the shell to body[data-skin="<id>"]
  fonts: [],                       // optional Google Fonts stylesheet URLs (https://fonts.googleapis.com/css2?...)

  title: { svg: '...' },           // title-screen art under the logo (section 4)
  intro: [ { title, text, svg } ], // how-to-play pages (section 5)
  bonus: { ... },                  // the win-screen bonus round (section 6)
  map: { ... },                    // the exploration map's look (section 7)
  words: { ... },                  // optional copy overrides (section 8)
});
```

Every field except `id`, `name`, `ic` is optional; the shell falls back to the Islands look.

## 2. HUD levels

The shell's bar on top of the play surface:

| level | shows |
|---|---|
| `full` | menu, level badge and title, points, help, the rim (goal bar), 3-star meter, the exploration-map hexagon (bottom right) |
| `compact` | one slim row: menu, title, star meter, a small MAP button |
| `minimal` | a floating round menu button and a tiny star meter only; the exploration map opens from the menu button's long-press |

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

## 6. Bonus round

The win screen's mini-game: a 9 x 7 hex board, one drag along a path alternating two elements collects coins. The
shell owns the rules, input, coins and countdown. The skin owns the look:

```js
bonus: {
  label: 'BONUS',                  // the tag text
  board: 'rgba(...)' ,             // CSS background of the board area
  line: '#ff7a52',                 // stroke of the traced path (default: the pair's neon colour)
  tile(x, y, r, e, k) { return '<g class="tl e' + e + '" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="tin">…</g></g>'; },
}
```

`tile` returns the SVG for one tile of element `e` (0 fire, 1 water, 2 air, 3 earth) centred at `(x, y)` with radius
`r`. **The outer `<g>` must keep `class="tl e{e}"`, `data-k="{k}"` and the translate; the inner `<g class="tin">` must
wrap everything else** (the shell scales `.tin` when a tile pops and adds the classes `lit` and `glow` to the outer
`<g>` when it is traced; style those in `css`). Draw in local coordinates round (0, 0).

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
  celebration ends (`own` skins call `LAB.finish(swaps)` instead). Script errors fall back to the Islands board.
- Read `&hud=` from the URL to decide which of your own labels to show.
- Every map's region shapes (`g.cells`) are exact: two pieces share a border iff their tiles are joined
  (`python3 tools/cells_check.py`). Keep any drawing you derive from them honest the same way.

## 10. Checklist for a new skin

1. `skins/<id>.js` registers a complete spec; `node tools/skin_check.js` passes (loads every spec, calls every
   function with sample arguments, checks the bonus tile contract and the intro SVGs).
2. The play page passes the embed test (`ready` and no `error` on every level).
3. Add `<script src="skins/<id>.js"></script>` to `index.html` (the shell owner does this) and the files to `sw.js`.
