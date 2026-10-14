# Flip: design note (lab game)

Page: `lab/flip.html` (`?lvl=<1..25>`, or `?n=<5..12>&len=<k>&seed=<s>[&free=1][&detour=<d>]` for a generated puzzle).
It is a stand-alone lab game: not a Kempe level, not on the skin reel, no tickets. It is linked from `lab/index.html`
(Round 4). The maths is in `lab/flip-model.js` (`window.FTH_FLIP`). The RL environment is `lab/flip-env.js`, described
in [arena/FLIP-ENV.md](arena/FLIP-ENV.md). Checks:

| command | what it checks | time |
|---|---|---|
| `node tools/flip_check.js` | the formulation, exhaustively, n ≤ 11 (`--quick`: n ≤ 9; `--full`: the slow sections further, ~3.5 min) | ~20 s |
| `node tools/flip_ui_check.js [--shots dir]` | the page, end to end, in headless Chrome | ~25 s |
| `node tools/flip_env_check.js` | the environment API and the baseline agents | ~2 min |

## The maths (Route 2 of the proof team)

Whitney (1931): a sphere triangulation with no separating triangle has a Hamiltonian cycle. Cut the sphere along that
cycle and you get two triangulated n-gons glued along their boundary. So the Four Colour Theorem (4CT) is equivalent
to the following statement (Carpentier, arXiv:0906.5319, Theorem 1).

> Any two triangulations of a convex n-gon (no interior vertices) have a common proper 4-colouring of the n vertices.

**Signed flips.** Sources: Eliahou, *Signed diagonal flips and the four color theorem*, Europ. J. Combin. 20 (1999)
641–647; Kryuchkov, *Four Color Theorem and Trees*, IAE-5537/1 (1992), the tree version; Gravier and Payan, *Flips
signés et triangulations d'un polygone*, Europ. J. Combin. 23 (2002) 817–821; Carpentier, *On signed diagonal flip
sequences*, arXiv:0906.5319.

- A **signed triangulation** gives every **triangle** a sign, + or −. The signs live on triangles, not on diagonals.
- A **signed flip** replaces a diagonal *ac* by *bd*. It is allowed only when the two triangles *abc* and *acd* have
  the **same** sign *s*. The two new triangles *abd* and *bcd* both get **−s**. Every other triangle keeps its sign.
  The reverse flip is again a signed flip.
- **Conjecture (Eliahou, Kryuchkov).** For any two triangulations T, T′ of the same polygon, there are signs for them
  such that T can be turned into T′ by a finite sequence of signed flips.
- **Gravier–Payan.** This conjecture is equivalent to the 4CT.

**Why signs are colourings.** Use the field F4 = {0, 1, ω, ω²} as the four colours; in the code they are 0..3 and +
is xor. Colour each edge by the sum of its two ends. In a proper colouring, every triangle's three edges get 1, ω, ω²
in some order. The triangle's sign is + when the edge colours run 1 → ω → ω² counterclockwise (`triSign`).

The 24 renamings of the four colours are exactly the semilinear maps x ↦ a·x^σ + b. The 12 affine maps keep every
sign; the other 12 (with Frobenius) negate them all. Each triangle after the first adds one new vertex with two
choices, and the two choices give opposite signs. So the signings of T (2^(n−2) of them) match one to one the proper
colourings of T taken up to the affine maps. In the code those are normalised to col0 = 0, col1 = 1.

When *abc* and *acd* have equal signs, the far corners differ, col(b) ≠ col(d). Then *bd* is a proper edge, the flip
keeps the colouring, and the new triangles' signs are that colouring's signs. So a signed flip path from T to T′ is a
4-colouring that suits both, which is a 4-colouring of the glued sphere map.

**Kauffman's form.** Sources: Kauffman, *Map coloring and the vector cross product*, JCTB 48 (1990);
*Reformulating the map color theorem*, Discrete Math. 302 (2005), arXiv:math/0112266.

- The n − 1 sides (v, v+1) are the factors of a product x0 × x1 × … × x(n−2) of vectors in {i, j, k}.
- A triangulation is a bracketing of that product, with side 0–(n−1) as the root.
- 4CT ⇔ any two bracketings have an assignment that makes both products equal and non-zero.

A non-zero product is a Tait colouring of the bracketing's tree. Each cross product i × j = +k or j × i = −k is a
triangle's orientation, which is the Eliahou sign. The model implements `F.cross` and `F.kauffman`, and the check
verifies the form (section K).

## Verification: `node tools/flip_check.js`

Every number is computed. Default run: n = 4..11 (the slower sections stop earlier, see the table header in the script).

| n | triangulations | pairs (T1, T2) | colourings (mod affine) | signed components | colourings split | pairs with a dead colouring | pairs needing a detour (max extra) |
|---|---|---|---|---|---|---|---|
| 4 | 2 | 4 | 6 | 6 | 0 | 0 | 0 (0) |
| 5 | 5 | 25 | 20 | 20 | 0 | 0 | 0 (0) |
| 6 | 14 | 196 | 60 | 68 | 8 | 8 | 0 (0) |
| 7 | 42 | 1,764 | 182 | 224 | 28 | 56 | 42 (1) |
| 8 | 132 | 17,424 | 546 | 726 | 68 | 352 | 1,016 (1) |
| 9 | 429 | 184,041 | 1,640 | 2,328 | 152 | 2,166 | 18,186 (3) |
| 10 | 1,430 | 2,044,900 | 4,920 | 7,440 | 320 | 13,150 | — |
| 11 | 4,862 | 23,639,044 | 14,762 | 23,804 | 660 | 80,300 | — |

What passes, at every n listed unless noted:

- **A.** There are Catalan(n−2) triangulations, every flip is an involution, the unsigned flip graph is connected, and
  its diameter (the rotation distance) is 1, 2, 4, 5, 7, 9, 11 for n = 4..10, as Sleator–Tarjan–Thurston give (2n − 10
  for n > 12, Pournin 2014).
- **B.** Brute force, with no signs involved, gives 2^(n−2) normalised proper colourings of each T. Signs → colouring
  → signs round-trips, and the map is a bijection on every T (n ≤ 9; `--full` 10).
- **C.** For every T, every signing and every diagonal: the model's signed flip is legal ⇔ the far corners differ in
  colour, and the flipped signs are exactly the colouring's signs on the new T. That is 329,472 flips at n = 9 and
  2,562,560 at n = 10 (`--full`). So the signed flip graph is exactly the union, over colourings c, of the flip graph
  restricted to c-proper triangulations.
- **D.** Every one of the 23.6M pairs at n = 11 (25.9M over n ≤ 11) has a common colouring (the 4CT for these glued
  maps). Every pair is signed-flip solvable for some signs (Eliahou–Kryuchkov). The two agree pair by pair. Signed
  components are found in colour space; for n ≤ 9 (`--full` 10) they are rebuilt from the model's own sign-based BFS
  from every signing and agree. The signings that work for a pair come in ± pairs (negating all signs is a symmetry),
  and every pair has at least 2.
- **E.** Independent code, for every pair, n ≤ 8 (`--full` 9): backtracking finds a vertex 4-colouring of the glued map;
  #Tait colourings (rainbow-face 3-edge-colourings) × 4 = #vertex 4-colourings; and #4-colourings = 12 × the
  common colourings mod affine counted in D.
- **K.** Kauffman, every pair, n ≤ 8 (`--full` 9): some assignment makes both bracketings equal and non-zero.
  Whenever both products are non-zero along the same axis, they have the same sign. So #such assignments = #Tait
  colourings of the glued map, pair by pair.
- **F, G.** The solver's paths are optimal (they match colour-space BFS) and replay. Every level's par is the solver's
  optimum, and its stated unsigned distance is right.

**The formulation chosen, and why.**

- The literature is unambiguous once read closely: signs on triangles, flip on equal signs, both new signs negated.
- The task brief said "signed diagonals". Signs on diagonals cannot be the rule: a sign has to say which of the two
  far-corner colourings is in force, and that belongs to a triangle.
- The exhaustive check confirms the triangle formulation: equivalence with common colourings, pair by pair, for n ≤ 11.

**Findings worth keeping** (from the table):

1. **One colouring is not enough.** From n = 6 on, some colourings' restricted flip graphs are disconnected: 8 of 60
   at n = 6, 660 of 14,762 at n = 11. So a pair can have a common colouring whose signs still cannot reach the target:
   8 pairs at n = 6, 80,300 at n = 11. "There exist signs" means choosing the right colouring, and that choice is
   where Gravier–Payan's proof does its work. Any proof by induction on n has to handle this.
2. **Signs force detours.** Over all signings, the best signed distance is never below the rotation distance. But
   from n = 7 on, for some pairs it is strictly above: 42 pairs at n = 7, 18,186 at n = 9, with up to 3 extra flips at
   n = 9. The levels are chosen to show this (the detour column).
3. Kauffman's sign condition takes care of itself on the sphere (section K). This is the planar "signature" fact
   (Jaeger 1989; Kauffman 1990 Thm 3.2).

## The game

- **Board.** Both polygons have the same n numbered corners, drawn clockwise from the top.
  - Yours is on the left on wide screens (≥ 720 px) and below on phones, where the small target sits above with the
    flip counter beside it.
  - Triangles are tinted sun (＋) or sea (−). Each also has a glyph at its incentre, sized to fit and slid away from
    the corner dots, so the board reads without colour.
  - Diagonals that already match the target are green. On the target, missing ones are dashed.
- **Move.** Tap a diagonal (the nearest one to the finger, within 22 px, so each has at least a 44 px band).
  - Legal: the old diagonal shrinks into the crossing point and the new one grows out of it, the two new triangles pop
    with their new sign, and the status line says `＋＋ → −− · 2–5 flipped to 1–4`.
  - Illegal: the diagonal shakes, its two triangles flash red, and the status says `＋ | − no flip` with the rule in
    sign chips.
- **Target signs.** Non-free levels show the target's signs. They are forced, because the colouring never changes:
  they are what your triangles will show when you match.
- **Win.** You win when your diagonals match the target's.
  - The corners bloom into the four 4square element colours (the colouring your signs encoded all along), and a
    burst of coloured triangles and a flourish play.
  - Stars: 3 at par, 2 within par + 2, 1 otherwise; a hint costs the third star.
  - The win card explains the link to the 4CT and offers *See the sphere*, *Replay* and *Next level*.
- **Undo, reset, hint.**
  - Undo and reset do what they say.
  - Hint: the solver's next optimal move glows and takes the focus. On free levels before the first flip, it points
    at a triangle whose sign must change for a par solution.
- **Colour view (C).** Shows the 4-colouring on both boards: a diagonal can flip exactly when its two far corners
  differ in colour.
- **Sphere view (G).** The n-cycle becomes a ring with your triangles inside and the target's diagonals outside.
  - Each outside arc runs around the side away from a cut gap, chosen to keep arcs short, and bulges out in
    proportion to its span, so nested arcs never cross.
  - It is playable: you can tap inner chords.
  - With the corners coloured it is the 4-coloured sphere map.
- **Free signs (levels 17–20).** The target shows no signs, and you start on a signing that cannot reach it.
  - Before your first flip, tap inside triangles to switch signs. The first flip locks them, and undoing back to zero
    flips unlocks them.
  - A target diagonal whose two ends share a colour under your signs is marked ✕: those signs can never reach it.
  - No ✕ is necessary but not sufficient (finding 1). The hint says so if you lock in a dead colouring.
  - Par is the best over all signings. Levels 17 and 18 are picked so that 25% and 12% of signings work; 19 and 20 so
    that only 4 of 64 and 4 of 128 do.
- **Levels.** 25 levels (`FTH_FLIP.LEVELS`, generated deterministically in about 120 ms):

  | levels | polygon | par | note |
  |---|---|---|---|
  | 1–2 | pentagon | 1–2 | |
  | 3–5 | hexagon | 2–4 | |
  | 6–8 | heptagon | 3–5 | |
  | 9–12 | octagon | 4–7 | detours of 1–2 |
  | 13–16 | nonagon | 6–9 | detours of 1–2 |
  | 17–20 | 6–9-gon | 2–5 | free signs |
  | 21–23 | decagon | 8–12 | detours of 3–4 |
  | 24–25 | 11-gon, 12-gon | 12, 14 | |

  - The generator picks a uniform random triangulation and random signs, runs a BFS over that sign component, and
    picks a target at signed distance `len`, preferring a detour ≥ `detour`.
  - The 🎲 button deals a fresh puzzle of the current size.
  - Progress (best stars per level, last level, sound, colour view) is kept in `localStorage['fth-flip-v1']`.
- **Accessibility.**
  - Every diagonal (and, while choosing signs, every triangle) is a focusable SVG button with an `aria-label`. Arrows
    move between them, and Enter or Space acts.
  - Keys: U / Ctrl+Z undo, R reset, H hint, C colours, G sphere, N next, ? help.
  - The status line is `aria-live`.
  - `prefers-reduced-motion` turns off every animation (no shake, no grow, no confetti).
  - Light and dark themes follow `prefers-color-scheme`.
  - Sound uses `sfx.js` (tryTone per flip, nope, hunt for hints, find + flourish + stars on a win), with a toggle.

## Decisions

- **Signed flips, not Kauffman, as the play mode.** They play well: the tint rule is visible at a glance, and par is
  short. Kauffman's form is the same object (verified in section K), so a second mode would add little.
- **Lab-only.** Not a Kempe level, no skin, no tickets.
- **Par = optimal signed flips.** A BFS of one component (at most Catalan(n−2) states; 16,796 at n = 12) is instant
  in the page, so hints are always exact.
- **What is not done.** No glued-sphere 3D view, and no Kempe-move projection onto each polygon side. Both are noted
  in the research brief as future directions.
