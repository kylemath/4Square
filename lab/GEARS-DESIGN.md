# Gears: design note (lab prototype)

Prototype page: `lab/gears.html` (open `lab/gears.html?lvl=<id or number>`; it is not on the skin reel or in the tickets).
The maths behind the "jam" is `~/GraphColour/SolvingFrameworkPlan/docs/working/GearPolarity.md` (exploratory).

## Why gears

Pills put a capsule on every **edge**. A 34-region triangulation has 3n − 6 = 96 edges, so the board was crowded. Gears put
one object on every **region** (20 to 40 objects). The edges stay implicit: two gears that share a cell border sit
almost tooth to tooth.

## What a gear is

- **A gear is a region.** It sits at the centre of its cell; the faint cell plates behind it show who borders whom.
- **Its element is its body colour**, plus the element icon on the hub, so the board can be read without colour.
- **The hole is the drive hub.** It is an empty steel socket in the middle, toothed against the 5 rim gears.
- **Gear size is fixed by the layout:** radius ≤ 0.46 × the distance to the nearest other centre, so no two gears ever
  overlap, and neighbours nearly mesh.

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
  - or tap a gear: up to three partner chips pop out (one per other element), and pressing one lights its chain;
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

## To make it a real skin later (not done)

- `skins/gears.js` with theme and `--sk-ctl*` and star tokens, intro pages, bonus tile, coin (a cog, a unique value), icon,
  card.
- `index.html` script tag (shell owner), `sw.js` files list, a ticket gate and price in `tickets.js`, and market lines in
  `economy.js`.
- Checks: `skin_check`, `tickets_check`, `economy_check`, `contrast_check`, `embed_win_check gears`.
- These were left out on purpose. Adding `skins/gears.js` alone would make `tickets_check` and `economy_check` fail until
  the ticket and market entries exist.
