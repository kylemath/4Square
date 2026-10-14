# Gears: design note

The Gears skin: spec `skins/gears.js`, play page `lab/gears.html` (standalone: `lab/gears.html?lvl=<id or number>`).
Ticket 14 (30 levels, 4,800 points); coin: the cog (30 G), trading with cheese wedges and ion orbs.
The maths behind the "jam" is `~/GraphColourDeductiveSolver/SolvingFrameworkPlan/docs/working/GearPolarity.md` (exploratory);
behind the die, `MathPathwayPF-degree.md` in the same folder.

## Why gears

Pills put a capsule on every **edge**. A 34-region triangulation has 3n − 6 = 96 edges, so the board was crowded. Gears put
one object on every **region** (20 to 40 objects). The edges stay implicit: two gears that share a cell border sit
almost tooth to tooth.

## What a gear is

- **A gear is a region.** It sits at the centre of its cell; the faint cell plates behind it show who borders whom.
- **Its element is its body colour**, plus the element icon on the hub, so the board can be read without colour.
- **The hole is the drive hub.** It is an empty steel socket in the middle, toothed against the 5 rim gears.
- **Gear size comes from the layout:** every pair keeps r_u + r_v ≤ 0.92 × the distance between their centres, so no
  two gears ever overlap. Sizes are evened out (capped at the median, then small gears grow into free room), and
  neighbours nearly mesh. A region whose layout centre almost touches another one still gets a very small gear (seen on
  `heawoods-catch`); its tap target stays at least 20 px.

## Colour → rotation (the one rule the look rests on)

- A Kempe chain is two-coloured and connected, so it is **bipartite**: its regions split into the a-side and the b-side.
- That is exactly the condition for a gear train to turn. **When an {a, b} chain is swapped:**
  - every a-gear turns half a turn clockwise;
  - every b-gear turns half a turn anticlockwise;
  - meshing neighbours counter-rotate, as real gears do.
- At the half-turn each gear's face changes element (a ↔ b). A half turn is the pill's 180° flip, moved from the edge
  to the region.
- Gears outside the chain do not move, and their teeth are disengaged.

## The cascade

- **Choosing a chain:**
  - drag from a gear to a neighbour of another element: that pair's chain lights;
  - or tap a gear: up to three partner chips pop out on a dark disc (one per other element; a web's chip is grey),
    and pressing one lights its chain;
  - lifting the finger on the target swaps.
- **The turn spreads** breadth-first through the chain's own edges from the touched gear, about 70 ms per layer (faster
  on long chains). Each gear starts when the wave reaches it, with a click whose pitch rises layer by layer. A glint
  marks each meshing contact as the wave crosses it.
- **A web** (the only {a, b} chain on the map, a pure renaming) does not turn. Its gears nudge and spring back, with a
  thud.

## The jam: shown only where the rules say so

The hub meshes with every rim gear. When the cascade reaches a rim gear, the hub is driven.

| the chain meets the rim in | rule (GearPolarity F1, F2) | the hub |
|---|---|---|
| no rim cell (a quiet chain) | the rim cannot change | stays still |
| rim cells of one element only | the rim count drops iff the chain holds **every** rim cell of that element (and the other element is on the rim) | turns smoothly, opposite to the rim gears. If an element left the rim, the hole fills |
| rim cells of **both** elements | the path between the two rim cells is odd, so with the two spokes it closes an **odd ring through the hole**. The two rim gears turn opposite ways, and the hub would have to turn both ways at once. **This swap can never fill the hole** | **jams**: it starts with the first rim contact, shudders at the first contact of the opposite spin, sparks at both contacts, a clunk, and slips back |

**Honesty rules:**
- The jam is computed only from the swapped chain, the colours and the rim (`Kp ≠ ∅ and Kq ≠ ∅`), never as decoration.
- The jam never blocks the swap. The chain still turns and the colours still change. In the data, a jammed swap at a
  doubly locked start still brings the fill closer 59% of the time (full jams) to 78% (partial ones). The π move of the
  research is a jam. So a jam says "this turn cannot fill the hole", never "this move is wasted". The look is a clutch
  slipping, not a broken machine.
- There is no jam preview and no lock badge at rest. Both would be a hint about future moves, and the maths says the
  rim structure of every doubly locked start is the same (GearPolarity F4), so a badge would carry no information
  beyond "not one swap".

## Keeping 20–40 regions calm

- Static at rest: no idle spinning or bobbing on the board. The only motion is the selected gear's lift, the lit chain
  and the cascade.
- Low-contrast cell plates (element tint at about 18%), with the full colour only on the gears.
- No edges are drawn. Contact glints appear only along the chain being turned.
- One idle hint after about 8 s: one gear of a useful chain (`g.good()`) gives a small wiggle.
- Rim strip at the top: the 5 rim elements as mini gears, hidden when the shell's full HUD already shows the rim.
- Controls (undo, start over) are two round buttons in `--sk-ctl*` colours.

## Win

- The hub gear drops into the socket in the free element and spins.
- A wave of full turns runs outward from the hole, alternating direction by distance, with an arpeggio (about 3.6 s).
- Then `LAB.done()`.
- Embedded, nothing restarts afterwards; standalone, a tap starts over.

## The die (the die counter in the hub)

A tetrahedral die sits in the drive hub: the four elements are its four faces (face k is the one element k does not
touch). Every corner of the map (three regions meeting) lands on one face, read clockwise (+1) or anticlockwise (−1).

- **Definition** (`degree.js`, `FTH_DEGREE.counts(g, col)`): orient the corners clockwise on screen (`rot` faces, voted by
  `pos`); D = the map minus the hole's 5 corners; n_k = the signed count of D's corners that miss element k. The rim loop
  (5 elements, clockwise) cancels to one triangle, the face m it wraps (when unfilled: the apex element between the two
  copies of the trouble spot), with sign eps. Lemma 1 of the research note: n_k = N for the three k ≠ m, and n_m = N − eps.
  **N is the die counter**; it does not depend on which face you count, once the rim face is corrected. A filled board's
  whole sphere has Fisk's degree N − eps. An odd renaming of the elements flips N and eps, so N × eps is the label-free form.
  Onboarding ponds (2-3 elements, not triangulations) have no counter and show no die.
- **Look:** an SVG over the hub (a 3D-projected tetrahedron, shaded faces in the element colours with their icons, a dark
  outline, a brass plate with N), `role="img"` with the label "Die counter N" and a polite live region. The die sits on face
  m and is turned N × 120°: a swap that changes N clicks it round one notch per unit, in the direction of the change, with
  ratchet clicks and a "+k" / "−k" float; a swap that moves m tumbles it onto the new face. Reduced motion: it jumps, the
  float only fades. It fades out when the hub gear drops in.
- **Always shown** where defined, never a hint: it shows nothing about future moves, so the "no lock badge" rule above stands.
  `degree.js` also has the frame, locks and π (the order of `Gr.link`, as `kempe_engine.py` and `piChain`), for the checks,
  the arena and the sibling star-rim HUD; the page does not use them.
- **Egg** `die-six`: the counter reaches ±6 on a level: a chime, 150 points, quietly.

**What π does to it (measured, `node tools/degree_check.js`; a measurement, not a proof).** The hope was a crank: each forced
π move turning N by a fixed amount in one direction, so a treadmill of π could never repeat a board. On all 31 maps:

- Lemma 1 holds on all 793,611 states checked (every census state of every level and every state one swap beyond).
- π, from each of the 14,984 doubly locked census states: ΔN × eps takes 17 values, −17 to +15, **always odd**, both signs
  about equally often (−1: 3,838, +1: 3,320, ±3: 2,409 / 1,988, ...). Not a constant. No variant tried is one either
  (ΔN × eps after the move, Δ(N × eps), Δ(N − eps) × eps, ΔN × hop direction).
- Two regularities did show: eps never changes under π, and the trouble spot always hops the same way (3 steps along
  `Gr.link`, which on these maps runs anticlockwise: 2 steps clockwise round the star).
- π treadmills close up: on r1, c30, p32r111, p31r12, p32r11, p34r28, π repeated while doubly locked returns to the very
  same labelled board after 60 moves (160 runs), the counter up about as often as down, net 0. So on these maps π is no crank.
- For comparison: quiet swaps change N by even amounts (symmetric about 0), swaps through the rim by any amount.
