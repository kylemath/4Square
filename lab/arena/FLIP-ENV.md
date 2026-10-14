# Flip environment: signed diagonal flips for RL agents

`lab/flip-env.js` (`FLIP_ENV`) is a gym-like environment for the signed-flip puzzle of [lab/flip.html](../flip.html).
It is built on `lab/flip-model.js` (`FTH_FLIP`). The maths and its exhaustive verification are in
[../FLIP-DESIGN.md](../FLIP-DESIGN.md). It is pure JS and loads the same three ways as `engine.js`:

- in a page: `<script src="flip-model.js">` then `flip-env.js`;
- in a worker: `importScripts('../flip-model.js', '../flip-env.js')`;
- in Node: `require('./lab/flip-env.js')`, which requires the model itself.

Tests and baselines: `node tools/flip_env_check.js [--episodes 100]`, about 2 minutes. No model is trained here.

## The task

The puzzle:

- Two triangulations of an n-gon, the current one with a sign (±1) on every triangle.
- A move flips a diagonal whose two triangles have the same sign; both new triangles get the opposite sign.
- Goal: the current diagonals equal the target's.
- Every reachable state keeps one F4 4-colouring of the corners (the signs encode it). So a puzzle from
  `FTH_FLIP.generate` is always solvable, and its par is exact (BFS).

## API

```js
const E = FLIP_ENV.make({ n: 9, len: null, detour: 0, cap: null, shaped: false });
let obs = E.reset({ seed: 7 });                // or reset({ seed, len, detour, cap }) or reset({ puzzle })
const m = E.mask();                            // Uint8Array(E.A), 1 = legal
const { obs, reward, done, info } = E.step(a); // info: { illegal, solved, truncated, steps, par, flipped, to }
E.oracle(); E.distance();                      // an optimal action / exact flips to go (BFS; for imitation, evaluation)
E.relabel(k, mirror);                          // the same puzzle under a dihedral relabelling (augmentation)
FLIP_ENV.episode(E, FLIP_ENV.agents.greedy, { seed: 3 }, FTH_FLIP.rng(1));   // -> { solved, steps, par }
```

**Actions.**

- One per diagonal slot of the n-gon: `E.A = n(n−3)/2`.
- `E.slots[a] = i·n + j` (i < j, not a side), in lexicographic order. The action space is fixed for a given n, as in
  the arena's `(region, colour)` action table.
- Only the n − 3 present diagonals can be legal, and only those whose triangles agree. `mask()` gives exactly the
  model's legal signed flips (tested every step).
- An illegal action is a no-op: reward −1 and `info.illegal = true`.

**Reward and termination.**

- Reward is −1 per step, as in the Maze Arena, so the return is minus the number of steps.
- The episode ends when the diagonals match (`info.solved`) or at the cap (`info.truncated`). The default cap is
  4 × par + 4.
- `shaped: true` adds the change in the number of matched target diagonals. This is a potential difference, so the
  optimal policy does not change.

**Observation `obs.x`** is a Float32Array of length 6·A + 4n + 3:

| block | per | features |
|---|---|---|
| slots | each of the A diagonal slots | in current T · in target · legal now · sign of its two triangles when they agree (±1, else 0) · crosses no target diagonal · in both |
| corners | each of the n vertices | one-hot colour of the F4 colouring the signs encode (col0 = 0, col1 = 1; constant within an episode) |
| globals | 1 | steps / cap · unmatched target diagonals / (n − 3) · n / 16 |

The raw state also comes back as `obs.T`, `obs.target`, `obs.s` (sign per triangle code) and `obs.col`, for graph
networks. The natural graph is the glued map: the ring, your diagonals inside and the target's outside. That is the
same map-independent setting as the arena GNN.

**Symmetries.** The dihedral group of the polygon (2n elements) acts on puzzles. `E.relabel(k, mirror)` maps
v ↦ ±v + k. A mirror reverses orientation, so it negates every sign. A global sign flip is also a symmetry of the
rules. The colouring view gives a further invariant: legal ⇔ the far corners differ in colour.

## Baselines (measured by `node tools/flip_env_check.js`, 100 puzzles per n, seeds 1..100)

The agents:

- **random**: uniform over legal actions.
- **greedy**: one-step lookahead on matched diagonals (+1 if the new diagonal is a target one, −1 if the old one was),
  ties broken at random.
- **greedy+tabu**: greedy, never returning to a state already visited this episode while an unvisited one is legal.

The oracle (BFS) solves every puzzle in exactly par steps.

Each cell is: solved within the cap (4 × par + 4) / solved within 100 steps (mean steps when solved within the cap).

**Standard bench** (signed target at distance n − 2):

| n | par | detour | random | greedy | greedy+tabu |
|---|---|---|---|---|---|
| 5 | 2.0 | 0.0 | 99% / 100% (4.0) | 100% / 100% (2.0) | 100% / 100% (2.0) |
| 6 | 4.0 | 0.0 | 74% / 100% (10.9) | 100% / 100% (4.0) | 100% / 100% (4.0) |
| 7 | 5.0 | 0.0 | 35% / 90% (15.2) | 97% / 98% (5.5) | 97% / 96% (5.5) |
| 8 | 6.0 | 0.5 | 21% / 74% (18.5) | 79% / 87% (7.2) | 96% / 94% (7.0) |
| 9 | 7.0 | 0.8 | 17% / 47% (20.8) | 85% / 86% (8.8) | 99% / 98% (9.5) |
| 10 | 8.0 | 1.0 | 10% / 25% (28.2) | 79% / 79% (10.4) | 95% / 96% (10.2) |
| 11 | 9.0 | 1.1 | 3% / 16% (27.7) | 79% / 76% (12.8) | 95% / 94% (11.6) |
| 12 | 10.0 | 1.2 | 0% / 3% (—) | 84% / 84% (14.2) | 98% / 99% (12.7) |

**Detour bench** (signed distance n, at least 2 more than the unsigned distance, so the sign rule forces a detour):

| n | par | detour | random | greedy | greedy+tabu |
|---|---|---|---|---|---|
| 9 | 9.0 | 2.4 | 12% / 27% (24.0) | 48% / 50% (13.2) | 87% / 88% (11.3) |
| 10 | 10.0 | 2.2 | 3% / 22% (30.7) | 67% / 68% (14.4) | 93% / 94% (13.9) |
| 11 | 11.0 | 2.3 | 5% / 12% (33.0) | 71% / 71% (16.5) | 95% / 98% (15.7) |
| 12 | 12.0 | 2.4 | 1% / 5% (42.0) | 76% / 76% (17.6) | 99% / 99% (16.7) |

What the numbers say:

- Random play dies fast as n grows.
- Matching diagonals one at a time already solves most standard puzzles. Greedy fails mainly where the signs force a
  detour: it falls to 48–76% on the detour bench, and when it does solve, it takes about 1.5 × par.
- A tabu memory recovers most of that, but its paths are still 25–43% longer than par on the detour bench.

So the open targets for a learned policy are:

1. solving detour puzzles **at par**, which needs a model of how the colouring constrains future flips;
2. generalising across n with one network;
3. (the research hope) learning a value function whose structure says which colourings stay connected (finding 1 in
   the design note).

The oracle's `E.distance()` gives exact labels for supervised pretraining, as `exactDistances` does for the arena.
