# Builds docs/game/levels.js for "Fill the Hole", the Kempe-chain puzzle game.
#
# Run from anywhere:  python3 docs/game/build_levels.py
# This rewrites levels.js without the Level -1 onboarding levels: afterwards run build_layout.py, then
# build_onboarding.py (it adds them back to levels.js and layout.js).
#
# Sources (read-only):
#   SolvingFrameworkPlan/docs/working/Census29/out/frame-22.txt       p22#196 (the only order-22 frame-class graph)
#   SolvingFrameworkPlan/docs/working/Census34/out/maxima_graphs.txt  p34.r178#11764701 (R = NR = 8 record, hole 10)
#                                                                      p34.r1#21568 (all-DL pi 20-cycle, hole 16)
#   TrackM tm_lib.Hole (Track A kempe_py engine): states, whole-component moves, locks, pi, chain counts, distances.
#   docs/shared/hole_layout.py: the site's hole-centred layout.
#
# For every level we ship the start colouring and, per hole, the swap distance to the nearest filled state for every
# unfilled state (keyed by the canonical colouring string the page computes), so the page can give hints and pars.
# Census facts quoted in the level text are re-derived here and asserted.
import sys, os, json, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
WK = os.path.join(ROOT, 'SolvingFrameworkPlan', 'docs', 'working')
sys.path.insert(0, os.path.join(WK, 'TrackM'))
sys.path.insert(0, os.path.join(HERE, '..', 'shared'))
from tm_lib import Hole, rot_from_faces  # noqa: E402
from hole_layout import layout  # noqa: E402


def read_rot(path, name):
    for l in open(path):
        p = l.split()
        if len(p) >= 3 and p[0] == name:
            return [list(map(int, r.split(','))) for r in p[2].split(';')]
    raise KeyError(name)


def icosahedron():
    F = []
    u = lambda k: 1 + k % 5
    l = lambda k: 6 + k % 5
    for i in range(5):
        F += [(0, u(i), u(i + 1)), (u(i), l(i), u(i + 1)), (u(i + 1), l(i), l(i + 1)), (11, l(i + 1), l(i))]
    return rot_from_faces(F)


def small_triangulation(n, seed):
    """A random spherical triangulation on n vertices: a bipyramid scrambled by edge flips (min degree 3 kept)."""
    import random
    rng = random.Random(seed); k = n - 2; T, Bt = k, k + 1
    F = [(T, i, (i + 1) % k) for i in range(k)] + [(Bt, (i + 1) % k, i) for i in range(k)]
    def deg():
        d = [0] * n
        for f in F:
            for v in f: d[v] += 1
        return d                                      # faces per vertex = degree
    for _ in range(40 * n):
        fi = rng.randrange(len(F)); a, b, c = F[fi]
        fj = next(j for j, g in enumerate(F) if j != fi and any((g[t], g[(t + 1) % 3]) == (b, a) for t in range(3)))
        g = F[fj]; t = [i for i in range(3) if (g[i], g[(i + 1) % 3]) == (b, a)][0]; d = g[(t + 2) % 3]
        if c == d or any(set((c, d)) <= set(h) for h in F): continue          # would make a multi-edge
        dg = deg()
        if dg[a] <= 3 or dg[b] <= 3: continue
        F[fi] = (c, a, d); F[fj] = (d, b, c)
    return rot_from_faces(F)


def find_small(n, seeds=range(400)):
    """first random triangulation with a usable degree-5 hole: some 4-colouring leaves all four elements on the rim"""
    for sd in seeds:
        rot = small_triangulation(n, sd)
        for h in range(n):
            if len(rot[h]) != 5: continue
            L = rot[h]
            if any(all(x in rot[w] for x in L) for w in range(n) if w != h): continue   # one vertex sees the whole rim
            try:
                H = Hole(rot, h); H.classes_and_dist()
            except Exception:
                continue
            if not any(not H.filled[k] and H.dF[k] == 1 for k in range(H.S)): continue
            try: layout(rot, h)                      # the site's hole-centred drawing must succeed too
            except AssertionError: continue
            return rot, h, sd
    raise RuntimeError('no small triangulation found for n=%d' % n)


W9, W13, W18 = find_small(9), find_small(13), find_small(18)
GRAPHS = {
    'w9': ('warm-up 9 (seed %d)' % W9[2], W9[0], W9[1]),
    'w13': ('warm-up 13 (seed %d)' % W13[2], W13[0], W13[1]),
    'w18': ('warm-up 18 (seed %d)' % W18[2], W18[0], W18[1]),
    'ico': ('icosahedron', icosahedron(), 0),
    'p22': ('p22#196', read_rot(os.path.join(WK, 'Census29', 'out', 'frame-22.txt'), 'p22#196'), 1),
    'r1': ('p34.r1#21568', read_rot(os.path.join(WK, 'Census34', 'out', 'maxima_graphs.txt'), 'p34.r1#21568'), 16),
    'r178': ('p34.r178#11764701', read_rot(os.path.join(WK, 'Census34', 'out', 'maxima_graphs.txt'), 'p34.r178#11764701'), 10),
}


class Board:
    def __init__(self, key):
        self.key = key; self.name, self.rot, self.h = GRAPHS[key]
        self.n = len(self.rot)
        H = self.H = Hole(self.rot, self.h); H.classes_and_dist()
        # small maps may split into several Kempe classes; states with no route to a filled rim get no distance
        self.order = H.sp.order
        self.dl = [not H.filled[k] and H.phi[k] == 2 for k in range(H.S)]

    def colouring(self, k):
        c = [-1] * self.n
        for i, x in enumerate(self.H.sp.states[k]): c[self.order[i]] = x
        return c

    def canon(self, c):   # must match canon() in index.html: first occurrence along vertex ids, hole skipped
        mp = {}; return ''.join(str(mp.setdefault(c[u], len(mp))) for u in range(self.n) if u != self.h)

    def nonlocal_only(self, k):
        H = self.H; d = H.dF[k]
        opt = [m for m in H.moves[k] if H.dF[m[0]] == d - 1]
        return d >= 1 and all(not (m[6] & H.linkmask) for m in opt)

    def pi_run(self, k, pred):
        """states along pi from k while pred holds; returns list (stops on repeat)"""
        out = []; seen = set()
        while k is not None and pred(k) and k not in seen:
            seen.add(k); out.append(k); k = self.H.pi[k]
        return out, (k in seen)

    def export(self):
        pos, link, _ = layout(self.rot, self.h)
        edges = sorted({(min(u, w), max(u, w)) for u in range(self.n) for w in self.rot[u]})
        H = self.H
        dist = {self.canon(self.colouring(k)): H.dF[k] for k in range(H.S) if not H.filled[k] and H.dF[k] >= 0}
        return {'name': self.name, 'n': self.n, 'hole': self.h, 'link': link, 'pos': pos, 'edges': edges,
                'deg': [len(r) for r in self.rot], 'rot': self.rot, 'S': H.S, 'dist': dist}


B = {k: Board(k) for k in GRAPHS}
for b in B.values():
    print(b.key, b.name, 'h', b.h, 'S', b.H.S, 'DL', sum(b.dl), 'max dF', max(b.H.dF))


def pick(b, cond, key=lambda k: 0):
    ks = [k for k in range(b.H.S) if cond(k)]
    assert ks, 'no state for level'
    return max(ks, key=lambda k: (key(k), -k))


levels = []


def level(gkey, k, title, kicker, intro, tools=(), goal=None, num=None):
    b = B[gkey]; H = b.H
    assert not H.filled[k]
    levels.append({'g': gkey, 'title': title, 'kicker': kicker, 'intro': intro, 'start': b.colouring(k), 'par': H.dF[k], 'num': num or str(len([L for L in levels if not L.get('num', '').startswith('0.')]) + 1),
                   'tools': list(tools), 'dl': b.dl[k], 'N': H.Nch[k]})
    print(f'level {len(levels):2d} {gkey:5s} state {k:5d} par {H.dF[k]} DL {b.dl[k]} phi {H.phi[k]} N {H.Nch[k]}  {title}')


ico, p22, r1, r178 = B['ico'], B['p22'], B['r1'], B['r178']

# ---- Level 0: warm-ups, all one flip with short chains, growing from small maps to the big record map
def easy(b):                                   # a one-flip start whose winning chains are short, preferring few winning chains
    H = b.H
    def score(k):
        win = [m for m in H.moves[k] if H.filled[m[0]]]
        return (-min(m[1] for m in win), -len(win))
    return pick(b, lambda k: not H.filled[k] and H.dF[k] == 1, key=score)
WARM = 'The silver platform in the middle has no element yet, because its five rim tiles hold all four. '
level('w9', easy(B['w9']), 'Spark', 'Warm-up', WARM + 'Drag across two neighbouring tiles of different elements to trace their chain, then tap it to swap the two elements. Leave the rim with only three.', ('locks',), num='0.1')
level('w13', easy(B['w13']), 'Ripples', 'Warm-up', WARM + 'A few more tiles. Look for the rim element that appears only once, and swap it away.', ('locks',), num='0.2')
level('w18', easy(B['w18']), 'Archipelago', 'Warm-up', WARM + 'Bigger island, same trick: one swap clears an element off the rim. Trace the whole chain before you flip it.', ('locks',), num='0.3')
level('r178', easy(r178), 'Big water', 'Warm-up', WARM + 'The biggest island in the game, but still one swap. Chains can run far across the island; follow the bridges.', ('locks',), num='0.4')

# 1-2: no locks
level('ico', pick(ico, lambda k: not ico.H.filled[k]), 'First flip', 'Tutorial',
      'The real tutorial. Trace a chain: drag (or tap tile by tile) across neighbours that alternate two elements, until '
      'every tile of that chain glows. Then tap the chain to swap its two elements. Clear one element off the rim.', ('locks',))
level('p22', pick(p22, lambda k: not p22.H.filled[k] and p22.H.phi[k] == 0 and p22.H.dF[k] == 1, key=lambda k: len(p22.H.moves[k])),
      'Open doors', 'Tutorial', 'A bigger island, still no locks. Chains near the rim score triple and double. '
      'You need a chain that changes one rim tile without dragging another rim tile along.', ('locks',))
# 3: one lock
level('p22', pick(p22, lambda k: p22.H.phi[k] == 1 and p22.H.dF[k] == 1, key=lambda k: p22.H.lsize[k]),
      'One lock', 'Locks', 'A chain that joins two rim tiles is a lock (🔒): flipping it just moves the problem round the rim. '
      'One of Kempe\'s two classic swaps is locked here. Find the open one.', ('locks',))
# 4: doubly locked, Kempe's double swap works
kk = pick(p22, lambda k: p22.dl[k] and p22.H.kempe2[k] and any(r[0] for r in p22.H.kempe2[k]) and p22.H.dF[k] == 2)
level('p22', kk, "Kempe's double", 'Locks', 'Both locks are shut: this is the case Kempe faced in 1879. His fix: '
      'two swaps on chains of the repeated element, one from each copy of it. Here that works. Par is 2.', ('locks',))
# 5: Kempe's double swap fails (Heawood 1890)
kk = pick(r1, lambda k: r1.dl[k] and r1.H.kempe2[k] and not any(r[0] for r in r1.H.kempe2[k]) and r1.H.dF[k] == 2,
          key=lambda k: r1.H.Nch[k])
level('r1', kk, "Heawood's catch", 'Locks', "Doubly locked again, but now Kempe's double swap fails in both orders: the first swap "
      "reconnects the chain the second one needed. This is the gap Heawood found in 1890. Two swaps still do it; find another pair.", ('locks',))
# 6: every optimal first move is a chain that does not touch the rim
kk = pick(r178, lambda k: r178.nonlocal_only(k), key=lambda k: r178.H.dF[k])
level('r178', kk, 'Far away', 'Far chains', 'Every quickest solution starts with a chain that never touches the rim. '
      'Look away from the platform: change the island far out so that a rim swap opens up.', ('locks',))
# 7: all-DL pi-cycle (The Loop)
on = r1.H.allDL_cycle_states()
cyc, closed = r1.pi_run(min(on), lambda k: r1.dl[k])
assert closed and len(cyc) == 20, 'p34.r1#21568 h16: expected one all-DL pi 20-cycle'
kk = max(cyc, key=lambda k: (r1.H.dF[k], -k))
level('r1', kk, 'The loop', 'π', 'At a doubly locked rim one canonical chain is left, marked π on the wheel. Flip π, trace the new π, flip again: '
      'after 20 flips you are back where you started and the rim never opens. Every one of the 98 such loops in the '
      'order-34 census can be left by some other chain. Find it.', ('locks', 'pi'))
# 8: start of the record near-rigid pi-run 9,8,9,8,... (R = NR = 8)
best = None
for k in range(r178.H.S):
    if not r178.dl[k] or r178.H.Nch[k] > 9: continue
    run, closed = r178.pi_run(k, lambda x: r178.dl[x] and r178.H.Nch[x] <= 9)
    assert not closed
    if best is None or len(run) > len(best): best = run
prof = [r178.H.Nch[x] for x in best]
assert len(best) == 8 and prof == [9, 8, 9, 8, 9, 8, 9, 8], prof
level('r178', best[0], '9-8-9-8', 'π', 'The longest run of its kind in the 2.8 billion graphs of order 34: following π keeps the rim locked for 8 flips '
      'while the total chain count N goes 9, 8, 9, 8, … (watch the chain counter). Proving such a run can never close into a loop '
      'is an open problem (NRC). You don\'t have to follow π.', ('locks', 'pi'))
# 9-12: depth ladder on the record hole, ending at its deepest state
for d, t in ((3, 'Depth 3'), (4, 'Depth 4'), (5, 'Depth 5')):
    kk = pick(r178, lambda k: r178.H.dF[k] == d, key=lambda k: r178.H.Nch[k])
    level('r178', kk, t, 'Depths', f'Same map. This state needs {d} swaps. Plan ahead: the swaps that look good next to the rim are traps.', ('locks', 'pi'))
deep = [k for k in range(r178.H.S) if r178.H.dF[k] == max(r178.H.dF)]
assert len(deep) == 1 and r178.H.dF[deep[0]] == 6
level('r178', deep[0], 'The deepest pit', 'Boss', 'Of all 7,481 colourings at this record hole, this is the one farthest from a fillable rim: '
      '6 swaps. Nobody has a proof that the distance stays bounded on bigger maps. Can you find the way out?', ('locks', 'pi'))

graphs = {k: B[k].export() for k in sorted({L['g'] for L in levels})}


# ------------------------------------------------------------------ world maps of colouring space (one per graph)
# The whole colouring space of T - h, legal and illegal, projected to 2D. Points:
#   * every proper colouring (the Kempe states, up to renaming): the land;
#   * sampled improper colourings: uniform random 4-colourings, and legal states with k random vertices recoloured
#     (k = 1..4, plus a few k = 6, 9 for the middle depths): the sea, its depth = number of monochromatic edges.
# All points go into ONE t-SNE on the renaming-invariant features [c(u) == c(v)] over all vertex pairs (joint
# embedding, so the sea is placed by the same projection as the land, no post-hoc interpolation of points). The
# picture is binned into flat-top hex tiles; sea tiles carry the mean badness of their samples, and empty tiles take an
# inverse-distance average of nearby samples (legal points count 0), or 'x' (open ocean) with none within 3 hexes.
# Sea depth is shipped as one char per cell: '0' land, '1'..'9' log-binned badness (sea.lev = mean badness per bin). It is a picture of colouring space, not of the
# move graph: one Kempe flip can jump anywhere on it.
def world(b, levels_here):
    import warnings, random, zlib
    import numpy as np
    from sklearn.decomposition import PCA
    from sklearn.manifold import TSNE
    from scipy.spatial import cKDTree
    H = b.H; S = H.S; rng = random.Random(zlib.crc32(b.key.encode()))
    V = [u for u in range(b.n) if u != b.h]; vi = {u: i for i, u in enumerate(V)}
    E = np.array(sorted({(vi[min(u, w)], vi[max(u, w)]) for u in V for w in b.rot[u] if w != b.h}))
    cols = [b.colouring(k) for k in range(S)]
    canon = [b.canon(c) for c in cols]
    assert len(set(canon)) == S
    seen = set(canon)
    Xl = np.array([[c[u] for u in V] for c in cols], dtype=np.int8)
    # illegal samples
    M = max(400, min(3500, int(0.5 * S)))
    ill = []; tries = 0
    while len(ill) < M and tries < 50 * M:
        tries += 1
        if rng.random() < 0.25: x = [rng.randrange(4) for _ in V]
        else:
            x = list(Xl[rng.randrange(S)]); k = rng.choice((1, 1, 2, 2, 3, 3, 4, 4, 6, 9))
            for i in rng.sample(range(len(V)), min(k, len(V))): x[i] = (x[i] + 1 + rng.randrange(3)) % 4
        mp = {}; cs = ''.join(str(mp.setdefault(v, len(mp))) for v in x)
        if cs in seen: continue
        seen.add(cs); ill.append(x)
    Xi = np.array(ill, dtype=np.int8)
    bad = (Xi[:, E[:, 0]] == Xi[:, E[:, 1]]).sum(1)
    assert (bad > 0).all(), 'a sampled "illegal" colouring is proper but not a Kempe state'
    X = np.vstack([Xl, Xi]); N = len(X)
    iu = np.triu_indices(len(V), 1)
    F = (X[:, iu[0]] == X[:, iu[1]]).astype(np.float64)
    with warnings.catch_warnings(), np.errstate(all='ignore'):   # spurious matmul warnings from macOS Accelerate
        warnings.simplefilter('ignore')
        Z = PCA(min(50, F.shape[1], N), random_state=0).fit_transform(F)
        Y = TSNE(2, perplexity=min(40.0, (N - 1) / 4), init='pca', random_state=0).fit_transform(Z)
    assert np.isfinite(Y).all()
    Y = (Y - Y.min(0)) / (Y.max(0) - Y.min(0)).max() * 100.0          # longest side = 100 map units
    Y = np.round(Y, 1)
    hexes_across = int(max(18, min(44, round(0.42 * N ** .5))))
    size = 100.0 / (1.5 * hexes_across)                               # flat-top hex radius
    SQ3 = 3 ** .5
    def axial(x, y):
        q = (2 / 3 * x) / size; r = (-1 / 3 * x + SQ3 / 3 * y) / size
        xq, zr = q, r; yy = -xq - zr
        rx, ry, rz = round(xq), round(yy), round(zr)
        dx, dy, dz = abs(rx - xq), abs(ry - yy), abs(rz - zr)
        if dx > dy and dx > dz: rx = -ry - rz
        elif dy > dz: ry = -rx - rz
        else: rz = -rx - ry
        return int(rx), int(rz)
    centre = lambda q, r: (size * 1.5 * q, size * SQ3 * (r + q / 2))
    hexid = {}; hexes = []; sh = []
    for k in range(S):
        a = axial(*Y[k])
        if a not in hexid: hexid[a] = len(hexes); hexes.append({'q': a[0], 'r': a[1], 'n': 0, 'f': 0})
        t = hexes[hexid[a]]; t['n'] += 1; t['f'] += int(H.filled[k]); sh.append(hexid[a])
    # sea grid: an odd-q rectangle of hex cells covering everything with a margin; axial (q0 + c, r0 + j - c // 2)
    q0 = int(np.floor(Y[:, 0].min() / (1.5 * size))) - 2
    cols_ = int(np.ceil(Y[:, 0].max() / (1.5 * size))) - q0 + 3
    r0 = int(np.floor(Y[:, 1].min() / (SQ3 * size) - q0 / 2)) - 2
    rows = int(np.ceil(Y[:, 1].max() / (SQ3 * size))) - int(np.floor(Y[:, 1].min() / (SQ3 * size))) + 5
    acc = collections.defaultdict(list)
    for i in range(len(ill)): acc[axial(*Y[S + i])].append(int(bad[i]))
    bmax = float(np.percentile(bad, 95)); lg = lambda v: 1 + min(8, int(round(8 * np.log1p(v - 1) / np.log1p(bmax - 1)))) if bmax > 1 else 1
    tree = cKDTree(Y); val = np.concatenate([np.zeros(S), bad.astype(float)])
    d = []; nsea = 0
    for c in range(cols_):
        for j in range(rows):
            q = q0 + c; r = r0 + j - c // 2
            if (q, r) in hexid: d.append('0'); continue
            if (q, r) in acc: v = float(np.mean(acc[(q, r)])); nsea += 1
            else:
                dd, ii = tree.query(centre(q, r), k=min(8, N), distance_upper_bound=3.0 * size)
                ok = np.isfinite(dd)
                if not ok.any(): d.append('x'); continue        # open ocean: no sample within 3 hexes
                w = 1 / (dd[ok] + .3 * size) ** 2; v = float((w * val[ii[ok]]).sum() / w.sum())
                v = max(v, 1.0)
            d.append(str(lg(v)))
    lev = [round(float(np.mean([x for x in bad if lg(x) == L])), 1) if any(lg(x) == L for x in bad) else None for L in range(1, 10)]
    signs = []
    for L in levels_here:
        k = canon.index(b.canon(L['start']))
        signs.append({'k': k, 'name': L['title'], 'text': 'Start of level "%s": %d flips from the nearest fillable rim.' % (L['title'], H.dF[k])})
    print('world %s: %d legal + %d illegal sampled, %d land hexes, %dx%d sea grid (%d sampled cells), hex radius %.2f, badness 95%% %.0f'
          % (b.key, S, len(ill), len(hexes), cols_, rows, nsea, size, bmax))
    return {'S': S, 'M': len(ill), 'E': len(E), 'size': round(size, 4), 'canon': ''.join(canon),
            'x': [float(v) for v in Y[:S, 0]], 'y': [float(v) for v in Y[:S, 1]],
            'hex': sh, 'hexes': hexes, 'dl': ''.join('1' if b.dl[k] else '0' for k in range(S)), 'N': H.Nch, 'dF': H.dF,
            'maxdF': max(H.dF), 'sea': {'q0': q0, 'r0': r0, 'cols': cols_, 'rows': rows, 'd': ''.join(d), 'lev': lev},
            'signs': signs}


# signposts known from the census: the record pi-run on r178 (9,8,9,8,...), the all-DL pi 20-cycle on r1
for key in graphs:
    graphs[key]['world'] = world(B[key], [L for L in levels if L['g'] == key])
graphs['r178']['world']['trail'] = {'name': '9-8 run', 'states': list(best), 'closed': False,
                                    'text': 'The record near-rigid π-run of the order-34 census: 8 doubly locked states, chain count 9, 8, 9, 8, …'}
graphs['r1']['world']['trail'] = {'name': 'π loop', 'states': list(cyc), 'closed': True,
                                  'text': 'The all-doubly-locked π 20-cycle at this hole: following π returns here after 20 flips.'}
with open(os.path.join(HERE, 'levels.js'), 'w') as f:
    f.write('// Generated by docs/game/build_levels.py. Do not edit.\n')
    f.write('window.GAME = ' + json.dumps({'graphs': graphs, 'levels': levels}, separators=(',', ':')) + ';\n')
print('wrote levels.js', os.path.getsize(os.path.join(HERE, 'levels.js')), 'bytes (now run build_layout.py, then build_onboarding.py for Level -1)')
