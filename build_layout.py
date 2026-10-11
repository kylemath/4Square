# Flat, equal-area tile layouts for "Fill the Hole". build_game.py calls build() for every new or changed map and
# caches the result in layout.js. Standalone: python3 docs/game/build_layout.py [--only=KEY,...] re-lays out maps
# already in levels.js (all of them, or just KEY,...).
#
# Each vertex of the map is a tile: its dual cell, whose corners are one point per triangle of the map. We optimise
# those corner points directly inside the square [-1, 1]^2. The outer triangle of the plane drawing becomes three points
# on the square's border, so the three outer tiles share the border and nothing forces them to be big.
# Objective: every tile the same area (the crater, at the hole, a bit smaller) and roughly round. Constraint (penalty):
# every tile star-shaped and counter-clockwise about its own corner mean, which keeps the tiling valid.
# Output per graph: the tile polygons, each tile's centre, and for every edge u-v the two shared border points (the
# bridge between u and v crosses the gap at the middle of that border).
import os, sys
import numpy as np
from scipy.optimize import minimize

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from hole_layout import load_data_js, write_layout_js  # noqa: E402


def perim(t):
    t = t % 4.0; k = int(t); f = t - k
    return [(-1 + 2 * f, -1), (1, -1 + 2 * f), (1 - 2 * f, 1), (-1, 1 - 2 * f)][k]


def perim_t(p):                                   # inverse of perim for a point pushed onto the border
    x, y = p; m = max(abs(x), abs(y)); x, y = x / m, y / m
    if abs(y + 1) < 1e-9 and x < 1: return (x + 1) / 2
    if abs(x - 1) < 1e-9 and y < 1: return 1 + (y + 1) / 2
    if abs(y - 1) < 1e-9 and x > -1: return 2 + (1 - x) / 2
    return 3 + (1 - y) / 2


def shoelace(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * (np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


def build(rot, hole, pos0):
    n = len(rot); X = np.array(pos0, float); X -= X[hole]; X *= 0.9 / np.abs(X).max()
    faces = {}
    for u in range(n):
        d = len(rot[u])
        for i in range(d):
            f = (u, rot[u][i], rot[u][(i + 1) % d]); k = f.index(min(f)); faces.setdefault(f[k:] + f[:k], None)
    F = sorted(faces)
    ar = lambda f: (X[f[1], 0] - X[f[0], 0]) * (X[f[2], 1] - X[f[0], 1]) - (X[f[1], 1] - X[f[0], 1]) * (X[f[2], 0] - X[f[0], 0])
    o = np.array([ar(f) for f in F]); sgn = 1 if (o > 0).sum() > (o < 0).sum() else -1
    if sgn < 0: X[:, 1] *= -1; o = -o
    f0 = F[int(np.argmin(o))]                              # the outer face
    inner = [f for f in F if f != f0]; fid = {f: i for i, f in enumerate(inner)}
    canon = lambda f: (lambda k: f[k:] + f[:k])(f.index(min(f)))
    # boundary points: one per edge of the outer face, initialised where that edge's outward normal meets the square
    oe = [(f0[i], f0[(i + 1) % 3]) for i in range(3)]
    bt0 = []
    for a, b in oe:
        m = (X[a] + X[b]) / 2; d = X[b] - X[a]; nr = np.array([d[1], -d[0]])
        if np.dot(nr, m) < 0: nr = -nr
        p = m + nr / np.linalg.norm(nr) * 3; bt0.append(perim_t(p / np.abs(p).max()))
    bkey = {frozenset(e): i for i, e in enumerate(oe)}
    # per vertex: ccw list of corner refs ('f', i) | ('b', j) | ('arc', j1, j2)
    rings = []
    for u in range(n):
        d = len(rot[u]); seq = []
        for i in range(d):
            a, b = rot[u][i], rot[u][(i + 1) % d]; f = canon((u, a, b))
            if f == f0: seq += [('b', bkey[frozenset((u, a))]), ('arc',), ('b', bkey[frozenset((u, b))])]
            else: seq.append(('f', fid[f]))
        rings.append(seq)
    C0 = np.array([(X[f[0]] + X[f[1]] + X[f[2]]) / 3 for f in inner])
    nF = len(inner)

    def corners(z):
        C = z[:2 * nF].reshape(-1, 2); bt = z[2 * nF:]
        polys = []
        for u in range(n):
            pts = []; seq = rings[u]
            for i, r in enumerate(seq):
                if r[0] == 'f': pts.append(C[r[1]])
                elif r[0] == 'b': pts.append(np.array(perim(bt[r[1]])))
                else:                                   # walk the border ccw between the two boundary points
                    t1, t2 = bt[seq[i - 1][1]], bt[seq[i + 1][1]]
                    if t2 < t1: t2 += 4
                    k = int(np.floor(t1)) + 1
                    while k < t2: pts.append(np.array(perim(k))); k += 1
            polys.append(np.array(pts))
        return polys

    OUTER_W = 2.0
    target = 4.0 / (n - 4 + 0.6 + 3 * OUTER_W)
    import torch
    torch.manual_seed(0)
    C = torch.tensor(C0, dtype=torch.float64, requires_grad=True)
    bt = torch.tensor(bt0, dtype=torch.float64, requires_grad=True)
    SQC = torch.tensor([[1., -1.], [1., 1.], [-1., 1.], [-1., -1.]], dtype=torch.float64)   # corner k sits at t = k + 1

    def tperim(t):                               # differentiable within the side the point is on
        t = torch.remainder(t, 4.0); k = int(t.detach()); f = t - k
        return torch.stack([[-1 + 2 * f, -1 + 0 * f], [1 + 0 * f, -1 + 2 * f], [1 - 2 * f, 1 + 0 * f], [-1 + 0 * f, 1 - 2 * f]][k])

    def index_lists():
        b = bt.detach().numpy(); L = []
        for u in range(n):
            seq = rings[u]; idx = []
            for i, r in enumerate(seq):
                if r[0] == 'f': idx.append(('f', r[1]))
                elif r[0] == 'b': idx.append(('b', r[1]))
                else:
                    t1, t2 = b[seq[i - 1][1]] % 4, b[seq[i + 1][1]] % 4
                    if t2 < t1: t2 += 4
                    k = int(np.floor(t1)) + 1
                    while k < t2: idx.append(('c', (k - 1) % 4)); k += 1
            L.append(idx)
        return L

    def polys_t(L):
        B3 = [tperim(bt[j]) for j in range(3)]
        out = []
        for idx in L:
            out.append(torch.stack([C[i] if t == 'f' else B3[i] if t == 'b' else SQC[i] for t, i in idx]))
        return out

    def selfcross(p):                            # smooth penalty for any two non-adjacent edges of polygon p crossing
        k = p.shape[0]; out = 0.0
        o = lambda a, b, c: (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        for i in range(k):
            a, b = p[i], p[(i + 1) % k]
            for j in range(i + 2, k):
                if i == 0 and j == k - 1: continue
                c, d = p[j], p[(j + 1) % k]
                o1, o2, o3, o4 = o(a, b, c), o(a, b, d), o(c, d, a), o(c, d, b)
                out = out + torch.clamp(-o1 * o2, min=0) * torch.clamp(-o3 * o4, min=0)
        return out / target ** 4

    def loss(L, wpen):
        e = 0.0; pen = 0.0
        for u, p in enumerate(polys_t(L)):
            q = torch.roll(p, -1, 0); A = 0.5 * torch.sum(p[:, 0] * q[:, 1] - p[:, 1] * q[:, 0])
            t = target * (0.6 if u == hole else OUTER_W if u in f0 else 1.0); e = e + ((A - t) / target) ** 2
            if u == hole: e = e + 4.0 * torch.sum(p.mean(0) ** 2)   # keep the crater in the middle
            if u in f0:                           # the three border bands: area, and they must not cross themselves
                pen = pen + 50 * selfcross(p)
                continue
            m = p.mean(0); d = p - m; dn = torch.roll(d, -1, 0); cr = d[:, 0] * dn[:, 1] - d[:, 1] * dn[:, 0]
            pen = pen + torch.sum(torch.clamp(0.03 * target - cr, min=0) ** 2) / target ** 2
            Lp = torch.sum(torch.sqrt(torch.sum((q - p) ** 2, 1) + 1e-12))
            e = e + 0.03 * (Lp * Lp / (torch.clamp(A, min=1e-4) * 4 * np.pi) - 1.15) ** 2
        pen = pen + torch.sum(torch.clamp(C.abs() - 0.995, min=0) ** 2) * 1e3
        return e + wpen * pen, e

    opt = torch.optim.Adam([C, bt], lr=0.004)
    L = index_lists()
    for step in range(4000):
        if step % 50 == 0: L = index_lists()
        wpen = 20 + 480 * min(1, step / 2500)
        opt.zero_grad(); tot, e = loss(L, wpen); tot.backward(); opt.step()
    z = np.concatenate([C.detach().numpy().ravel(), bt.detach().numpy() % 4])
    P = corners(z)
    A = np.array([shoelace(p) for p in P]); tot = A.sum()
    tiles = [u for u in range(n) if u != hole and u not in f0]; At = A[tiles]
    print('  border bands area / tile:', [round(float(A[u] / At.mean()), 2) for u in f0])
    assert abs(tot - 4) < 1e-6, ('tiles do not cover the square', tot)
    for u in range(n):                                   # star-shaped and ccw about the corner mean (border bands excepted)
        if u in f0: continue
        q = P[u] - P[u].mean(0); cr = q[:, 0] * np.roll(q[:, 1], -1) - q[:, 1] * np.roll(q[:, 0], -1)
        if not (cr > -1e-9).all(): print('   warn: tile', u, 'not star-shaped, min cross', cr.min(), 'corners', len(P[u]))
    def crosses(P):
        k = len(P); o = lambda a, b, c: (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        return any(o(P[i], P[(i + 1) % k], P[j]) * o(P[i], P[(i + 1) % k], P[(j + 1) % k]) < 0 and o(P[j], P[(j + 1) % k], P[i]) * o(P[j], P[(j + 1) % k], P[(i + 1) % k]) < 0
                   for i in range(k) for j in range(i + 2, k) if not (i == 0 and j == k - 1))
    folded = [u for u in range(n) if crosses(P[u])]
    if folded: print('   WARN: cells crossing themselves (the map overlaps there):', folded)
    print(f'  n={n}: tile area CV {At.std() / At.mean():.3f}, min/max {At.min() / At.mean():.2f}/{At.max() / At.mean():.2f}, crater {A[hole] / At.mean():.2f}')
    # shared borders: for edge u-v the two corners both cells use (the two faces on either side of the edge)
    C = z[:2 * nF].reshape(-1, 2); bt = z[2 * nF:]
    def fpt(f):
        f = canon(f)
        return None if f == f0 else C[fid[f]]
    sides = []
    for u in range(n):
        d = len(rot[u])
        for i in range(d):
            v = rot[u][i]
            if v < u: continue
            fl, fr = (u, rot[u][i - 1], v), (u, v, rot[u][(i + 1) % d])
            p, q = fpt(fl), fpt(fr)
            if p is None: p = np.array(perim(bt[bkey[frozenset((u, v))]]))
            if q is None: q = np.array(perim(bt[bkey[frozenset((u, v))]]))
            sides.append([u, v, [round(float(p[0]), 4), round(float(p[1]), 4)], [round(float(q[0]), 4), round(float(q[1]), 4)]])
    r4 = lambda a: [[round(float(x), 4), round(float(y), 4)] for x, y in a]
    # wall arcs: the stretch of the square's border each far-side vertex owns (perimeter parameter t in [0, 4))
    arcs = {}
    for u in f0:
        seq = rings[u]; i = [k for k, r in enumerate(seq) if r[0] == 'arc'][0]
        arcs[u] = [float(bt[seq[i - 1][1]] % 4), float(bt[seq[i + 1][1]] % 4)]
    reg = regular_positions(rot, hole, f0, np.array([p.mean(0) for p in P]), arcs)
    return {'border': list(f0), 'arcs': {str(k): [round(a, 4), round(b, 4)] for k, (a, b) in arcs.items()}, 'reg': r4(reg), 'cells': [r4(p) for p in P], 'centre': r4([p.mean(0) for p in P]), 'sides': sides,
            'cv': round(float(At.std() / At.mean()), 3)}


def arc_points(t1, t2, k=40):
    if t2 < t1: t2 += 4
    return np.array([perim(t1 + (t2 - t1) * i / k) for i in range(k + 1)])


def regular_positions(rot, hole, f0, X0, arcs):
    """Even spacing for the island tiles: every edge near one length, tiles near a wall half a length from it,
    triangles kept the right way round (planar), the crater held at the centre."""
    import torch
    n = len(rot); I = [u for u in range(n) if u not in f0]
    E = sorted({(min(u, v), max(u, v)) for u in I for v in rot[u] if v in I})
    WE = [(u, w) for u in I for w in rot[u] if w in f0]
    T = set()
    for u in I:
        d = len(rot[u])
        for i in range(d):
            a, b = rot[u][i], rot[u][(i + 1) % d]
            if a in I and b in I: k = (u, a, b); j = k.index(min(k)); T.add(k[j:] + k[:j])
    T = sorted(T)
    X = torch.tensor(X0, dtype=torch.float64, requires_grad=True)
    Lc = float(np.median([np.linalg.norm(X0[a] - X0[b]) for a, b in E]))
    AP = {w: torch.tensor(arc_points(*arcs[w]), dtype=torch.float64) for w in f0}
    Ei = torch.tensor(E); Ti = torch.tensor(T)
    opt = torch.optim.Adam([X], lr=.003)
    for step in range(3000):
        opt.zero_grad()
        d = torch.norm(X[Ei[:, 0]] - X[Ei[:, 1]], dim=1); e = torch.sum((d / Lc - 1) ** 2)
        for u, w in WE:
            dw = torch.min(torch.norm(AP[w] - X[u], dim=1)); e = e + ((dw / Lc - .7) ** 2)
        a, b, c = X[Ti[:, 0]], X[Ti[:, 1]], X[Ti[:, 2]]
        o = (b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0])
        e = e + 2000 * torch.sum(torch.clamp(.15 * Lc * Lc - o, min=0) ** 2) / Lc ** 4
        Ii = torch.tensor(I); Y = X[Ii]; D = torch.cdist(Y, Y) + torch.eye(len(I)) * 9
        e = e + 5 * torch.sum(torch.clamp(.75 - D / Lc, min=0) ** 2)
        e = e + 1e3 * torch.sum(torch.clamp(Y.abs() - (1 - .45 * Lc), min=0) ** 2) + 20 * torch.sum(X[hole] ** 2)
        e.backward(); opt.step()
    Xn = X.detach().numpy()
    d = np.array([np.linalg.norm(Xn[a] - Xn[b]) for a, b in E])
    print(f'  regular spacing: edge length CV {d.std() / d.mean():.3f} (start {np.std([np.linalg.norm(X0[a] - X0[b]) for a, b in E]) / Lc:.3f})')
    return Xn


if __name__ == '__main__':
    _, D = load_data_js(os.path.join(HERE, 'levels.js'))
    only = [a.split('=', 1)[1].split(',') for a in sys.argv[1:] if a.startswith('--only=')]
    if only:                                     # e.g. --only=w9,w13: rebuild these maps' region shapes in place
        _, LAY = load_data_js(os.path.join(HERE, 'layout.js'))
        for k in only[0]:
            g = D['graphs'][k]; print(k, g['name']); b = build(g['rot'], g['hole'], g['pos'])
            for f in ('cells', 'centre', 'sides', 'cv'): LAY[k][f] = b[f]   # border, arcs, reg (used by the game's walls) kept
        write_layout_js(os.path.join(HERE, 'layout.js'), 'LAYOUT', LAY, 'Generated by docs/game/build_layout.py from levels.js. Do not edit.')
        print('patched layout.js for', only[0]); sys.exit(0)
    out = {}; _, _old = load_data_js(os.path.join(HERE, 'layout.js'))
    for k, g in D['graphs'].items():
        if g.get('onboard'): out[k] = _old.get(k, {}); continue   # the Level -1 ponds keep their hand-drawn centres
        print(k, g['name']); out[k] = build(g['rot'], g['hole'], g['pos'])
    write_layout_js(os.path.join(HERE, 'layout.js'), 'LAYOUT', out, 'Generated by docs/game/build_layout.py from levels.js. Do not edit.')
    print('wrote layout.js')
