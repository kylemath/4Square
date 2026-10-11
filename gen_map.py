# Random warm-up maps for "Fill the Hole": a small sphere triangulation with a usable degree-5 hole.
#
#   python3 docs/game/gen_map.py KEY N [--seed S] [--maxpar P] [--minpar P]
#
# writes docs/game/maps/KEY.json for the first seed (from S on) whose triangulation on N vertices has a degree-5 hole
# where some colouring leaves all four elements on the rim, the deepest state is between --minpar and --maxpar swaps,
# no single vertex touches the whole rim, and the site's hole-centred drawing succeeds. Then run
#   python3 docs/game/build_game.py --ladder KEY
# for ready-made level entries at every par. (The old w9/w13/w18 warm-up maps were made the same way.)
import os, sys, json, random, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kempe_engine import HoleGame  # noqa: E402


def triangulation(n, seed):
    """a bipyramid scrambled by random edge flips (degree >= 3 kept, no multi-edges)"""
    rng = random.Random(seed); k = n - 2; T, Bt = k, k + 1
    F = [(T, i, (i + 1) % k) for i in range(k)] + [(Bt, (i + 1) % k, i) for i in range(k)]
    for _ in range(40 * n):
        fi = rng.randrange(len(F)); a, b, c = F[fi]
        fj = next(j for j, g in enumerate(F) if j != fi and any((g[t], g[(t + 1) % 3]) == (b, a) for t in range(3)))
        g = F[fj]; t = [i for i in range(3) if (g[i], g[(i + 1) % 3]) == (b, a)][0]; d = g[(t + 2) % 3]
        if c == d or any({c, d} <= set(h) for h in F): continue
        deg = [0] * n
        for f in F:
            for v in f: deg[v] += 1
        if deg[a] <= 3 or deg[b] <= 3: continue
        F[fi] = (c, a, d); F[fj] = (d, b, c)
    return F


def find(n, seed0, minpar, maxpar, tries=400):
    from mapio import rot_from_faces
    from hole_layout import layout
    for sd in range(seed0, seed0 + tries):
        F = triangulation(n, sd); rot = rot_from_faces(F)
        for h in range(n):
            if len(rot[h]) != 5: continue
            L = rot[h]
            if any(all(x in rot[w] for x in L) for w in range(n) if w != h): continue
            H = HoleGame(n, rot, h, L)
            top = max(H.dF)
            if not (minpar <= top <= maxpar) or min(H.dF) < 0: continue
            try: layout(rot, h)
            except AssertionError: continue
            return F, h, sd, H
    raise SystemExit('no map found: try another --seed, a different N, or a wider par range')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='random warm-up map for Fill the Hole')
    ap.add_argument('key'); ap.add_argument('n', type=int)
    ap.add_argument('--seed', type=int, default=0); ap.add_argument('--minpar', type=int, default=1); ap.add_argument('--maxpar', type=int, default=1)
    a = ap.parse_args()
    F, h, sd, H = find(a.n, a.seed, a.minpar, a.maxpar)
    path = os.path.join(HERE, 'maps', a.key + '.json')
    obj = {'name': 'warm-up %d (seed %d)' % (a.n, sd), 'source': 'docs/game/gen_map.py %s %d --seed %d' % (a.key, a.n, sd),
           'hole': h, 'world': False, 'faces': [list(f) for f in F]}
    with open(path, 'w') as f:
        f.write('{\n' + ',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v, separators=(',', ':'))) for k, v in obj.items()) + '\n}\n')
    print('wrote %s: %d regions, hole %d, %d colourings, deepest %d swaps' % (path, a.n, h, H.S, max(H.dF)))
