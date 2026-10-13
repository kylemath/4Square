# Level requests: sending new graphs to the game

A **level request** is one JSON file that adds a graph and the levels played on it. Anything that finds an interesting
map can write one: a census run, the GraphColourDeductiveSolver, another Claude session, or a person. The game side
checks it against the real engine and either accepts it or says exactly what is wrong:

```
python3 tools/level_request.py REQUEST.json            # dry run: check and print the response
python3 tools/level_request.py REQUEST.json --json     # the same response as JSON, to send back
python3 tools/level_request.py REQUEST.json --apply    # check, then write maps/<key>.json and insert into levels.json
```

Nothing is written unless every check passes. A worked example is
[`tools/requests/example.json`](tools/requests/example.json) (a fresh 20-region map, two levels, a new island). Keep
accepted requests in `tools/requests/` as the record of where each map came from.

## The request

```json
{
  "request": "4square-level/1",
  "from": "Census34 maxima run, Studio session 12 Oct 2026",
  "why": "Second record hole: R = NR = 8 like r178 but with a π loop of length 12.",
  "map": {
    "key": "r311",
    "name": "p34.r311#2093",
    "source": "SolvingFrameworkPlan/docs/working/Census34/out/maxima_graphs.txt p34.r311#2093 (hole 7)",
    "hole": 7,
    "rot": [[1, 2, 3, 4, 5], [0, 5, 6, 7, 2], "..."],
    "world": true
  },
  "islands": { "Lagoon": ["Last Lagoon", "reef", "🐠"] },
  "levels": [
    { "id": "lagoon-loop", "place": { "after": "deepest-pit" }, "num": "17.1",
      "kicker": "Lagoon", "title": "Round the lagoon", "tools": ["locks", "pi"],
      "intro": "One sentence on what is new here and one on what to try.",
      "pick": { "onLoop": true, "dF": 3, "prefer": ["-difficulty"] },
      "expect": { "par": 3, "onLoop": true, "loopLength": 12 } }
  ]
}
```

### Top level

| field | required | meaning |
|---|---|---|
| `request` | yes | always `"4square-level/1"` |
| `from` | yes | who or what produced it (run, session, person) |
| `why` | no | what makes the graph worth a level; kept with the request, not shown in the game |
| `map` | no | a new graph. Leave it out when every level uses a map already in `maps/` |
| `islands` | no | new islands for `kicker`: `{"Kicker": [name, theme, emoji]}`, themes `cove beach town harbour forest cape cave volcano reef` |
| `levels` | yes | one or more levels, in the order they should be inserted |

### `map`: the graph

| field | required | meaning |
|---|---|---|
| `key` | yes | file name in `maps/`, 1-24 chars `a-z 0-9 _`. Census maps use the census id (`r178`, `p32r111`) |
| `name` | yes | short name (`p34.r178#11764701`) |
| `source` | yes | where it came from, precisely enough to regenerate it (file and record id, or generator and seed) |
| `hole` | yes | index of the uncoloured region. The game is tuned for a **degree-5** hole (warning otherwise) |
| graph | yes | exactly one of `rot` (each vertex's neighbours in cyclic order, as in the census files), `faces` (the triangles, any orientation), `ascii` (plantri ascii) |
| `world` | no | `true` draws the colouring-space mini-map (the build needs scikit-learn, a few minutes per map) |
| `layoutSeed`, `drawSeed` | no | only if the default drawing is cramped |
| `edges`, `pos`, `onboard`, `ncol`, `goal` | no | hand-drawn onboarding ponds only. Game maps must be sphere triangulations |

**A good graph** is a planar triangulation with four colours and a degree-5 hole. It also has something a player can feel:
a deep par (a long way from any fillable colouring), doubly locked rims, a π loop, or a record from the census. Under
about 50,000 colourings keeps the build and the page fast (warning above that). If the same graph and hole are already
in `maps/`, the response says so; reuse that key with `"map": "<key>"` on each level instead.

### `levels[]`: each level

| field | required | meaning |
|---|---|---|
| `id` | yes | kebab-case, **permanent**: saves, run proofs and leaderboards are keyed by it. It must be new (not in `levels` or `legacy`) |
| `place` | yes | `"end"`, `{"after": "<id>"}` or `{"before": "<id>"}`. It can name a level from earlier in the same request |
| `map` | no | defaults to the request's `map.key`; otherwise a key already in `maps/` |
| `num` | yes | badge label only (`"7.3"`, `"16"`) |
| `kicker` | yes | the island it sits on: an existing key of `islands` in `levels.json` or one added by this request. Keep each island in one run of levels, because the level map draws one island per run (a warning says when a placement would split one) |
| `title` | yes | up to 32 characters |
| `tools` | yes | `[]`, `["locks"]` or `["locks", "pi"]`: which helpers the level shows (a start on a π loop wants `"pi"`) |
| `intro` | yes | the card shown before play, up to about 420 characters. Say what is new and what to try; no spoilers |
| `pick` | yes | how the start colouring is chosen (below) |
| `expect` | yes | facts the build asserts, at least `par` (below) |

**`pick`** is either a fixed start or constraints the build resolves:

- `{"start": [c0, c1, ...]}`: one colour 0-3 per region, `-1` at the hole. Use this when the exact colouring is the point
  (a record state, a census example).
- Constraints on the start state: `dF` (par, a number or `[lo, hi]`), `dl` (doubly locked rim), `locks` (0-2), `N`
  (chain count), `onLoop` (on an all-locked π loop), `exits` (`quietOnly`, `loudOnly`, `piOnly`), `deepest`, `piRule`
  (`loops`, `par`, `over`). `prefer` orders the matches: `-difficulty`, `+difficulty`, `+N`, `-N`, `+dF`, `-dF`,
  `+shortWin`, `+fewWins`. Ties go to the smallest state key, so the choice is reproducible.

**`expect`**: `par` (required), plus any of `onLoop`, `loopLength`, `loops`, `N`, `unique` (the only state at this
depth), `deepest`, `piRunN`. Put the claim the `intro` makes in here ("the only colouring 6 swaps out" is
`{"par": 6, "deepest": true, "unique": true}`), so the text cannot drift from the maths.

## The response

```json
{
  "response": "4square-level/1",
  "status": "accepted",
  "errors": [],
  "warnings": ["island 'Lagoon' would be split into 2 parts on the level map"],
  "map": { "key": "x20", "regions": 20, "hole": 15, "holeDegree": 5, "colourings": 46, "kempeClasses": 1,
           "fillable": 19, "deepestPar": 2, "doublyLocked": 7, "piLoops": [] },
  "levels": [ { "id": "lagoon-dip", "map": "x20", "par": 1, "difficulty": 1.2, "N": 9,
                "start": [0, 0, 1, "..."], "tags": ["loudOnly"] } ],
  "applied": { "map": "maps/x20.json", "levelCount": 31, "positions": { "lagoon-dip": 30 } }
}
```

`status` is `accepted` or `rejected`. Errors block the request; warnings don't. `levels[].start` is the colouring the
pick resolved to: copy it into `pick.start` to pin a constraint-picked level to that exact state. `applied` appears
only with `--apply`.

## Rules that protect players

- **Never change a shipped level's map or start.** Run proofs are replayed against the level's start (`verify.js`),
  so a changed start hides every past run of it from the leaderboard. Make a new level with a new `id` instead.
- Ids are permanent, and `legacy` (the old 20-level order) is never edited.
- Progress is stored by id, so inserting levels before ones a player has beaten is safe. They will find the new level
  open and unbeaten.

## After `--apply`

1. `python3 build_game.py` rebuilds `levels.js` and `layout.js`. A **new map** needs numpy, scipy and torch for its
   region shapes, plus scikit-learn when `"world": true`. The Studio has them; this MacBook has numpy only.
2. Bump `VERSION` in `sw.js` so installed copies fetch the new `levels.js`.
3. **Ticket balance.** `PAY` in `tools/tickets_check.js` is the measured points per level on clean play, in play
   order. Insert the new levels' pay at their positions, then run `node tools/tickets_check.js`. Levels added at the
   end only add room to spare. Levels inserted before a gate mean re-tuning `GATE`/`PRICE` in `tickets.js` (the check
   prints the table).
4. Optional: add the new ids to the case lists in `tools/embed_win_check.js` and `tools/maze_check.js`.
5. Run at least `skin_check`, `tickets_check`, `shop_check`, `embed_win_check` and `free_check`, then commit the
   request file together with the map and the levels.

## Asking another session for levels

Paste this to the session or pipeline producing graphs:

> Send each new map as a level request in the format of LEVEL-REQUEST.md in kylemath/4Square (`"request":
> "4square-level/1"`). Give `map.source` precisely enough to regenerate the graph, a degree-5 `hole`, the graph as
> `rot`, and one level per interesting start, with `expect` holding every claim the intro makes. Before sending, run
> `python3 tools/level_request.py <file> --json` and fix every error.
