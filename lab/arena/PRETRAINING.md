# Pretraining a Kempe-swap foundation model: what runs here, and what scaling would take

The Maze Arena (`lab/MazeArena.html`, engine `lab/arena/engine.js`) pretrains its graph network on random maps in
plain JavaScript: in the page's Web Worker, or headless with `node tools/arena_train.js --pretrain-minutes N`. That is
real pretraining, but at laptop scale: about 10^4 maps and 2 x 10^5 labelled samples in two minutes on one CPU core.
"Billions of graphs" needs a tensor library and accelerators. This note records what was measured, what the data and
objectives are, and what a PyTorch/JAX port would need. No Python script ships with it: torch is not installed in
this environment, and nothing was run that could not be checked here.

## Measured here (Node 22, one core of a 4-core container, `node tools/arena_check.js --speed-only`)

| what | rate |
|---|---|
| random triangulation + blocked 4-colouring, n = 14 / 18 / 24 / 34 | ~6,400 / 2,800 / 7,500 / 4,700 per s |
| the same plus exact distances (BFS over the colouring's whole Kempe class, cap 3,000 states), n = 14 / 18 | ~6,300 / 2,700 labelled maps per s |
| exact labels at n = 20 / 22 / 24 / 26 (mean class size 47 / 70 / 108 / 173 states) | ~2,000 / 1,300 / 740 / 460 maps per s |
| GNN forward + backward, H = 8 / 16 / 32 (2.2k / 7.8k / 28k params), n = 34 | ~4,600 / 1,800 / 450 samples per s |
| pretraining end to end, H = 16, all four objectives | ~1,950 samples per s (226k samples, 9.4k maps in 116 s) |
| RL with afterstate scoring, H = 16, n = 34 | ~380 env steps per s acting only, ~250 with learning |

(The n = 18 data rate is lower than n = 24 because the n = 24 row has no BFS labels.) Distances on random maps are
almost all 1 or 2: over 10^5 labelled states at n = 14-26, about 73% are at distance 1, 27% at distance 2 and fewer
than 1 in 10^4 at distance 3. The level census looks the same (deep states are rare by nature), so a pretraining set
that teaches deep planning has to search for deep states on purpose (see the curriculum below).

So one CPU core makes labelled data at ~10^3-10^4 maps per second. A billion maps is ~1-3 x 10^5 core-seconds, about a
day on a 64-core machine, and embarrassingly parallel. Training is the bottleneck: at ~2 x 10^3 samples per second
per core in JS, 10^9 samples would take about 6 core-days *per pass* with H = 16, and far longer at useful widths.
A batched GPU implementation should get to 10^5-10^6 samples per second for graphs this small.

## Data generator (as implemented in `engine.js`)

1. `generateGraph(n)`: start from the icosahedron (12 vertices, all of degree 5), insert vertices into random faces
   until n vertices, then make about 6n random edge flips (degrees kept >= 3 and <= 11, no multi-edges). Faces are a
   rotation system, so the result is a sphere triangulation by construction. `checkTriangulation` checks it: E = 3n - 6,
   every face a triangle, 2n - 4 faces. Insertion alone would give stacked triangulations, which have a unique
   4-colouring, so the flips matter.
2. Hole: a random degree-5 vertex. The link (rim) is its cyclic neighbour order, reversed half the time and started at
   a random rim region, so the net sees both orientations.
3. `randomBlocked`: put the rim pattern D s1 D s2 s3 at a random rotation with random colour names (rejected if a
   chord makes it improper), then complete the colouring by randomized most-constrained-first backtracking.
4. Labels: `exactDistances` runs a BFS over the colouring's Kempe class (non-web swaps, fills are leaves), then a
   multi-source BFS back from the fills, for maps up to n = 26 (cap 3,000 states). It matches the census on every
   level map tested (`tools/arena_check.js`, section 2). Bigger maps get only the self-supervised objectives.

## Architecture and objectives (as implemented)

A message-passing GNN over the map's adjacency (width H, K rounds of h' = relu(Ws h + Wn mean(neighbours) + b))
with a readout of [mean pool, max pool, the 5 rim embeddings in relative rim order, the hole, 3 globals], an MLP of
width 2H, and one small head per objective:

| objective | head | label | loss |
|---|---|---|---|
| (a) distance to a fill | scalar on the MLP | exact BFS distance | Huber |
| (b) good swap | per candidate chain: MLP on [mean of the chain's embeddings, MLP output, chain features] | the swap lowers the exact distance by one | BCE |
| (c) masked colour | per region on h_K | relative colour class of 15% hidden regions | cross-entropy |
| (d) chain structure | per region on h_K | size and rim reach of the region's chain for each partner colour, with every chain input hidden | MSE |

The encoding is map-independent: colours relative to the rim pattern (D -> 0, then the singles in rim order from the
reference D), rim positions relative to the same reference, so renaming colours or rotating the link list leaves the
input unchanged (tested). After pretraining the value head starts as minus the distance head and RL fine-tunes it.

## What pretraining did here (single seeds; differences of about 1 point are noise)

| model | params | pretrain | RL | held-out agree2 | agree3 | success |
|---|---|---|---|---|---|---|
| nano-rl | 679 | none | 60 s | 99.0% | 89.8% | 98.9% |
| mid-zero-shot | 7,759 | 116 s, 8.8k random maps | none | 93.3% | 59.2% | 97.8% |
| mid-rl | 7,759 | none | 180 s | 99.2% | 91.8% | 97.8% |
| mid-pretrained | 7,759 | 116 s, 9.4k maps | 120 s | 98.8% | 87.8% | 98.9% |
| colours-only-rl | 30,383 | none | 240 s | 91.7% | 77.5% | 94.5% |
| colours-only-pretrained | 30,383 | 106 s, 2.6k maps | 180 s | 92.5% | 81.6% | 96.7% |
| baselines: random / hand rule / two-ply | 0 | | | 63.2 / 68.5 / 96.4% | 70.6 / 76.3 / 74.7% | 56.7 / 95.4 / 100% |

- With no level map ever seen, pretraining on random maps transfers: 93% held-out agree2 zero-shot (a second seed gave
  98% on the quick bench), well above random (63%) and the hand rule (69%), a little under the two-ply search (96%).
- With the hand-built chain features, RL alone is already at 99% after a few minutes. Even the 679-parameter H = 4,
  K = 1 net `nano-rl` (1 minute of RL) reaches 99.0% held-out agree2 and 89.8% agree3. Those features (each region's chain
  sizes and which rim positions each chain reaches) make "is there a one-swap fill from here?" nearly linear, so at
  this testbench pretraining has nothing left to add.
- Without chain features (colours only, the net must find chains by message passing) the task is genuinely harder
  (about 92%), and there pretraining gave a small gain for less RL (+0.8 agree2, +4 agree3, +2 success).
- The policy head trained by objective (b) on random maps is weak on the level maps (62-78% agree2). The afterstate
  value head is the one that transfers.
- Still unsolved by every model: the deepest held-out starts (six-ring-trap, par 4; second-pit, par 5) are not filled
  within 3x par, and agree3 (states 3+ swaps out) stays under 92%.

## A PyTorch / JAX port

1. **Exchange format.** Keep the model JSON (`mazearena-model-1`): `arch` (H, K, H1, Hp, F = 42, GD = 3, CF = 12,
   chainFeats), a `shapes` table and base64 float32 weights in that order (Win, bin, Ws1, Wn1, b1, ..., W1, b1, wv,
   bv, wd, bd, Wp1, bp1, wp2, bp2, Wc, bc, Wch, bch; row-major, y = W x). A model trained in Python loads in the page
   unchanged, and the page's testbench and leaderboard rank it next to the JS models.
2. **Features.** Port `encode()` exactly (or call the JS through a small Node worker pool that writes feature shards).
   The tests in `tools/arena_check.js` (invariance, census agreement) are the acceptance check.
3. **Batching.** Pack a batch of maps as one disjoint graph (`torch_scatter` / `jax.ops.segment_sum` for the
   neighbour mean and the pools; the rim and hole embeddings are gathers by index). Chains for the policy head are a
   second segment index. No padding needed.
4. **Data pipeline.** Generator processes (Node or a C/Rust port of the four functions above) write sharded records:
   adjacency, link, colouring, exact distance, good-swap mask. Labelled maps up to n = 26 are cheap; for larger maps
   use the self-supervised objectives (c) and (d), plus labels from a bounded BFS that searches for deep states.
5. **Curriculum.** Grow n from 12-18 to 30-60. Oversample states with d >= 2 (and search for d >= 3 states: walk away
   from fills with a BFS that keeps the deepest), since uniform sampling is 73% d = 1. Keep (c) and (d) on throughout,
   and train a colours-only variant so the network has to learn chain structure itself.
6. **Width and scale.** At these graph sizes the measured gains stop at small widths when chain features are given;
   the colours-only nets are where width (H = 64-256, K = 6-10, residual connections and layer norm) should be tried.
7. **Evaluation.** Score every checkpoint with the same held-out testbench (`ARENA.Testbench`, all 16 four-colour level
   maps, census labels) and report agree2, agree3 and success against the random, hand-rule and two-ply rows in
   `models/index.json`.
