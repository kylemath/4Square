# Gears: design note

The Gears skin: spec `skins/gears.js`, play page `lab/gears.html` (standalone: `lab/gears.html?lvl=<id or number>`).
Ticket 14 (30 levels, 4,800 points); coin: the cog (30 G), trading with cheese wedges and ion orbs.
The maths behind the "jam" is `~/GraphColourDeductiveSolver/SolvingFrameworkPlan/docs/working/GearPolarity.md` (exploratory);
behind the die, `MathPathwayPF-degree.md` in the same folder.

## Why gears

Pills put a capsule on every **edge**. A 34-region triangulation has 3n − 6 = 96 edges, so the board was crowded. Gears put
one object on every **region** (20 to 40 objects). The edges stay implicit: two regions that share a border are two
gears in mesh, and gears that are not neighbours never touch.

## What a gear is

- **A gear is a region.** Its neighbours are exactly the gears it meshes with: no cell plates, no edges drawn.
- **Its element is its body colour**, plus the element icon on the boss, so the board can be read without colour.
- **The hole is the drive hub.** A steel gear in the middle, in mesh with the 5 rim gears.

## Layout: a circle packing (`lab/gearpack.js`, checked by `node tools/gearpack_check.js`)

- The map plus the hole is a planar triangulation, so (Koebe-Andreev-Thurston) it has a **circle packing**: one circle
  per region, neighbours externally tangent, all interiors disjoint. The circles are the gears' pitch circles.
- **Radii:** the outer face of the rotation system farthest from the hole has its three radii fixed at 1; the others
  solve "angle sum = 2π" by 60 Collins-Stephenson sweeps, then Newton on log r (the Jacobian is a weighted Laplacian,
  ∂θ_v/∂log r_a = ρ / (r_v + r_a), ρ the incircle of the three tangency points). Converges to 1e-13 in a few ms.
  Laid out triangle by triangle; mirrored if needed so the rim runs the same way round as the stored drawing.
- **Normalisation:** z ↦ 1/(z − p) with p in one interstice (the gap of three mutually tangent circles) sends p to
  infinity: those three become the **frame gears**, huge, running off the screen like a machine beyond the frame.
  Searched over every interstice not touching the hole (incentre seeds, 24 rotations, Nelder-Mead on p and the
  rotation), then translated so the hub sits at the centre of the board box and scaled to fit it. Score: the smallest
  gear in px (a gentle bonus for a hub of at least 26 px, a penalty past 64), times how little of the box the frame
  gears cover and how little stays bare plate. A frame gear must still show a 22 px tap disc in the box; its icon
  rides on a medallion there. Recomputed for each screen size (phone and desktop give different layouts).
- **Non-triangulations** (the onboarding ponds): every non-triangular face gets hidden filler circles (a centre, or for a
  face walk through a leaf, a ring with extra fillers at thin corners, 4 more ladder rings and a centre), so the packing
  exists. A pond may also be framed by a face's middle filler turned inside out (everything inside one circle).
- **Numbers (all 40 levels, 390 × 844 and 1280 × 800):** max tangency error 7e-9 (relative); no overlaps; non-neighbours
  never touch; smallest gear 3 px on `archipelago` (a stack of degree-3 regions is tiny in any packing) and about 9-12 px
  on the 34-region maps (radius ratio 7-14). Every gear keeps a tap radius of at least 12 px (24 px across), taking
  priority over its neighbours' rims.

## Teeth

- **One module for every gear:** pitch p ≈ 2π r₁₀ / 9 (r₁₀ the 10th-percentile visible radius); a gear of pitch radius r
  has N = round(2π r / p) teeth (±2, within 10%, see below). Pitch circles stay exactly tangent; only the tooth spacing of
  a gear differs from p by under 1/(2N). Tooth: addendum 0.9 m, dedendum 1.12 m, half widths 0.285 / 0.21 / 0.13 of the
  tooth angle at root / pitch / tip.
- **Rest phases:** gear u with N_u teeth at phase x_u (in teeth) meshes with v iff x_u + x_v ≡ t_uv N_u/2π + t_vu N_v/2π − ½
  (mod 1). A breadth-first tree from the hub satisfies its own edges; a triangulation has 3n − 6 contacts against n − 1 in
  the tree, and the system x_u + x_v ≡ c_uv is overdetermined (every even cycle adds a condition), so **not all contacts
  can mesh perfectly**. The rest are relaxed: a coordinate descent on Σ clash⁴ over each gear's phase and tooth count
  (N ± 2), for 13 pitches round p. Result: worst visible clash 0.23 tooth, mean 0.09 (0.5 would be tooth on tooth).

## Background

A dark machined steel backplate, drawn once per size: brushed streaks, faint lathe rings round the hub, light from the top
left and darker corners, a seam and corner screws, a dark seat under each gear (it shows between the teeth), and hex bolts
in the wider gaps between three gears (the circle inscribed in the gap, by Descartes' theorem). No element colour on the
plate: adjacency is the meshing itself. The shadows of resting gears fall on the plate only (all drawn before any body).

## Colour → rotation (the one rule the look rests on)

- A Kempe chain is two-coloured and connected, so it is **bipartite**: its regions split into the a-side and the b-side.
- That is exactly the condition for a gear train to turn. **When an {a, b} chain is swapped:**
  - every a-gear (the touched gear's element) turns clockwise, every b-gear anticlockwise, all together;
  - each by the same whole number of teeth k = round(median N of the chain / 2), so each gear turns k/N_u of a turn and
    the pitch-line speeds match, as in real meshing gears. The median gear makes the old half turn; a pinion turns
    further, a big gear less. Whole teeth mean every gear ends on its rest phase, so the board still meshes afterwards.
- Each gear's face changes element (a ↔ b) when the breadth-first wave from the touched gear reaches it (the old half
  turn of the pill's 180° flip, kept as the moment of change).
- Gears outside the chain do not move. The turning train lifts a little (a longer shadow, drawn over the resting gears),
  so it reads as lifted out of mesh with its still neighbours (a real train could not turn against them).

## The cascade

- **Choosing a chain:**
  - drag from a gear to a neighbour of another element: that pair's chain lights;
  - or tap a gear: up to three partner chips pop out on a dark disc (one per other element; a web's chip is grey),
    and pressing one lights its chain;
  - lifting the finger on the target swaps.
- **The turn spreads** breadth-first through the chain's own edges from the touched gear, about 70 ms per layer (faster
  on long chains): the faces change as it passes, with a click whose pitch rises layer by layer (the gears themselves turn
  together, since they mesh). A glint
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
- A neutral steel backplate, with the full colour only on the gears.
- No edges are drawn. Contact glints appear only along the chain being turned (a lit chain: gold outlines, a spark at each contact).
- One idle hint after about 8 s: one gear of a useful chain (`g.good()`) gives a small wiggle.
- Rim strip at the top: the 5 rim elements as mini gears, hidden when the shell's full HUD already shows the rim.
- Controls (undo, start over) are two round buttons in `--sk-ctl*` colours.

## Win

- The hub gear drops into the socket in the free element and spins.
- A wave of turns (up to 24 teeth each, whole teeth) runs outward from the hole, alternating direction by distance, with an arpeggio (about 3.6 s).
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
