# Signs: design note (skin)

Spec `skins/signs.js`, page `lab/signs.html`, maths `lab/signs-model.js` (`window.FTH_SIGNS`). It is Flip
(`lab/flip.html`, [FLIP-DESIGN.md](FLIP-DESIGN.md)) drawn over every real 4square level: the same map, start, win and par
as every other skin, played with ordinary Kempe swaps.

| command | checks | time |
|---|---|---|
| `node tools/signs_check.js` | the cut on every level, signs ↔ colouring, the swap theorem on every reachable state | ~14 s |
| `node tools/signs_ui_check.js [--shots dir]` | the page and the shell end to end, headless Chrome | ~40 s |
| `node tools/embed_win_check.js signs` | nothing restarts or shows dev text after a win | ~25 s |

## The dictionary

| Flip | 4square |
|---|---|
| polygon corner | region (vertex of the level's sphere triangulation), the hole included |
| the outline (ring) | a Hamiltonian cycle through every region, the hole at ring place 0 (top) |
| inside / outside triangulation | the two sides of the cycle; their diagonals and the ring are exactly the map's borders |
| triangle | a map corner (face: three regions meeting) |
| triangle sign | Eliahou's sign: colours as F4 (xor), edge colour = sum of ends, + when 1 → ω → ω² runs counterclockwise |
| open triangle | a face at the hole (uncoloured, no sign) |
| the rim | the hole's neighbours, the corners joined to it in either polygon (5) |
| move | a Kempe swap of an {a, b} chain |
| win | the rim uses ≤ 3 elements: the hole takes the free one and its open triangles close with signs |

**Theorem.** A swap of an {a, b} chain K flips the sign of exactly the signed triangles touching K, and no other. On K
the swap is the transposition (a b), odd, which reverses the tetrahedron's orientation. A triangle touching K has every
a- or b-coloured corner in K (a neighbour of a chain corner coloured a or b is in the chain) and its c/d corners are
fixed by (a b), so the whole triangle is renamed by (a b) and its sign flips. A triangle not touching K is unchanged.

**The die.** Eliahou's sign equals the Gears die's corner sign (`degree.js`, Fisk's degree: the parity of (a, b, c, k)
read clockwise) on every face of every state, constant factor +1. So the page's tally (sun count − sea count over the
signed triangles) is always 4N − ε (N the die counter, ε the rim's orientation): odd, as 2n − 9 signed triangles must be.

## Verification (`node tools/signs_check.js`)

- **Cut.** All 36 triangulated levels have a Hamiltonian cycle through the hole (no fallback needed, though some have
  separating triangles). Checked: the ring is a cycle of borders; each side has n − 3 non-crossing diagonals and n − 2
  triangles; ring + both sides = the borders, each once; the faces are the map's corners; the drawing keeps the level's
  orientation (inside faces read clockwise in ring order, outside counterclockwise).
- **States.** BFS over every colouring reachable from each level's start, up to renaming (a renaming multiplies every
  sign by its parity and maps chains to chains): 140,744 states, plus 42,504 labelled states on the levels with n ≤ 22.
- **Signs ↔ colouring.** On every state, the signs with ring places 1 and 2 coloured give back the whole colouring
  (each signed triangle with two coloured corners forces its third).
- **Theorem.** 2,223,384 swaps (every chain of every state), 48,497,388 predicted flips: in each, exactly the touching
  triangles changed sign and nothing else did. The biggest non-web swap flips 95% of the signed triangles.

## The cut

`FTH_SIGNS.cut(G)`: a seeded DFS (24 restarts with shuffled neighbour orders, 3 cycles each, a 60,000-node budget per
restart, pruning a free vertex left with fewer than two ways in) collects up to 48 Hamiltonian cycles from the hole;
deterministic, under 150 ms on the 34-region maps. Each cycle gives two drawings (either side inside; the ring
direction then follows from keeping the level's orientation). The score picks, in order: the lowest outside arc stack
(nesting height H, 2 to 14 on the levels), the shortest inside chords, the hole's chords inside (its fan at the top).
The outside arcs avoid the gap between ring places n − 1 and 0, beside the hole, so the face round the drawing's edge
is always an open (hole) triangle: the sky above the ring needs no tint.

**Fallback.** The Level −1 ponds are not triangulations (2 or 3 elements, faces of any size): `needs: ['tri']` sends them to
the island board (`index.html` `skinFits`). Opened directly, the page still draws them: corners round the hole by
angle, borders as chords, ring gaps that are not borders dashed, no triangles. A triangulation with no Hamiltonian cycle
would get the same treatment; none occurs.

## The page

- **Views.** *Ring* (the sphere: the cycle as a ring, inside diagonals straight, outside diagonals as nested arcs whose
  height is their nesting depth; on a tall screen the ring is stretched into an upright oval, an affine map) and *pair*
  (Flip's two polygons, the outside one seen from behind). Default: ring on tall screens, pair on wide ones; the ∞/◎
  button switches and is remembered (`localStorage` `fth-signs`).
- **Look.** Sun triangles gold, sea triangles blue, a + or − glyph where it fits, open triangles hatched; the ring a cream
  line on a dark one; corners are pearls, rim corners wear their element, the hole a dark well with ?; one light from the
  top left over each board. The colour button paints every corner in its element.
- **Move.** Tap a corner: it lifts and up to three chips rise, one per chain through it (its two elements and ±k, the
  triangles it flips). Tap a chip: the chain's corners ring in its two colours and exactly the triangles it touches glow.
  Tap it again (or FLIP): they flip sign in a wave out from the corner along the chain (30–60 ms a step, a pop each, a
  rising pentatonic run), `LAB.at` sends the coins from the corner. Or drag from a corner onto a neighbour of another
  element. A web chain (it only renames) wobbles and does not swap. The rim gauge bounces when the rim loses an element.
- **Win** (~3.6 s, then `LAB.done()`): the hole fills with the free element (burst, chord), its open triangles close with
  their signs, a beam of light runs twice round the ring, the corners pop in turn.
- **Hints.** After 9 s idle a corner of a useful chain (`g.good()`) rings. **Egg** `half-turn`: one swap flipping ≥ 80% of
  the signed triangles (`LAB.egg`, 150 points). Keys: arrows corner, 1–3 chain, Enter swap, U undo, R reset, C colours, V view.
- **Shell.** HUD full; trigon coin (42 G; trades with cogs and glass marbles); ticket 15 (gate 33, 5,100 points).
