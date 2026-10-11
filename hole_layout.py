# (Copy of docs/shared/hole_layout.py in GraphColourDeductiveSolver, so the game builds on its own.)
# hole_layout.py: the site-wide hole-centred layout used with docs/shared/kempe-draw.js (drawing convention item 1).
#
#   from hole_layout import layout, load_data_js, write_layout_js
#   pos, link, gaps = layout(rot, h)      # rot: cyclic neighbour lists (a consistent rotation system); h: degree-5 hole
#
# The hole sits at the origin, its five neighbours on a regular pentagon, everything else outside it; positions are
# normalised so max |x|, |y| = 1. Same algorithm as docs/alternation/build_data.py and docs/kempe/build_data.py
# (copied verbatim so those build scripts stay self-contained). Deterministic for a given seed.
import json, itertools, collections
import numpy as np


def load_data_js(path):
    """Parse a generated 'window.X = {...};' data file; returns (varname, object)."""
    s = open(path).read()
    i = s.index('window.'); j = s.index('=', i)
    name = s[i + 7:j].strip()
    body = s[j + 1:].strip()
    if body.endswith(';'): body = body[:-1]
    return name, json.loads(body)


def write_layout_js(path, varname, obj, header):
    with open(path, 'w') as f:
        f.write('// ' + header + '\n')
        f.write('window.' + varname + ' = ' + json.dumps(obj, separators=(',', ':')) + ';\n')


# =============================================================== layout (hole at the centre, its five neighbours as a ring)
def layout(rot, h, seed=1):
    """Hole at the origin, its five neighbours on a regular pentagon of radius 1, everything else outside it.
    Tutte drawing of T - h with the link as the outer pentagon, then an inversion about the origin (r -> r^-g) that
    turns the drawing inside out, then a spacing hill-climb with the hole and the ring fixed. Asserted planar."""
    n = len(rot); adj = [set(r) for r in rot]; link = list(rot[h])
    faces = set()
    for u in range(n):
        d = len(rot[u])
        for i in range(d):
            f = (u, rot[u][i], rot[u][(i + 1) % d]); k = f.index(min(f)); faces.add(f[k:] + f[:k])
    F = sorted(faces); Fa = np.array(F)
    edges = sorted({(min(u, w), max(u, w)) for u in range(n) for w in rot[u]}); Ea = np.array(edges)

    def gaps(P):
        dd = np.hypot(P[:, None, 0] - P[None, :, 0], P[:, None, 1] - P[None, :, 1])
        vv = dd[np.triu_indices(n, 1)].min()
        A_, B_ = P[Ea[:, 0]], P[Ea[:, 1]]; D_ = B_ - A_; L_ = (D_ * D_).sum(1)
        t = np.clip(((P[None, :, :] - A_[:, None, :]) * D_[:, None, :]).sum(2) / L_[:, None], 0, 1)
        Q_ = A_[:, None, :] + t[:, :, None] * D_[:, None, :]
        de = np.hypot(*(P[None, :, :] - Q_).transpose(2, 0, 1))
        de[np.arange(len(Ea)), Ea[:, 0]] = 9; de[np.arange(len(Ea)), Ea[:, 1]] = 9
        return float(vv), float(de.min())

    def signs(P):
        a, b, c = P[Fa[:, 0]], P[Fa[:, 1]], P[Fa[:, 2]]
        return np.sign((b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0]))

    def ccw(P, a, b, c): return (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0])

    def crosses(P):
        for (a, b), (c, d) in itertools.combinations(edges, 2):
            if len({a, b, c, d}) == 4 and ccw(P, a, b, c) * ccw(P, a, b, d) < 0 and ccw(P, c, d, a) * ccw(P, c, d, b) < 0:
                return True
        return False

    def gscore(P):
        vv, ve = gaps(P / float(np.abs(P).max())); return min(vv, 2 * ve)

    dist = {h: 0}; q = collections.deque([h])
    while q:
        u = q.popleft()
        for w in adj[u]:
            if w not in dist: dist[w] = dist[u] + 1; q.append(w)
    # annulus Tutte drawing: the hole at the origin, the link fixed on a regular pentagon of radius r0, a far face fixed
    # on the unit circle; every other vertex a weighted average of its neighbours. Planarity is not guaranteed for an
    # annulus, so every candidate is checked (no crossing, consistent face orientation) and the best spaced one kept.
    far = sorted([f for f in F if h not in f], key=lambda f: -sum(dist[v] for v in f))[:6]
    best = None
    for outer in far:
        if set(outer) & set(link): continue
        for rev in (False, True):
            lk = link[::-1] if rev else link
            for rot0 in range(10):
                for r0 in (0.16, 0.22, 0.3):
                    fixed = {h: (0.0, 0.0)}
                    for t, x in enumerate(lk):
                        a_ = np.pi * rot0 / 5 + 2 * np.pi * t / 5; fixed[x] = (r0 * np.cos(a_), r0 * np.sin(a_))
                    for k, v in enumerate(outer):
                        a_ = -np.pi / 2 + 2 * np.pi * k / 3; fixed[v] = (np.cos(a_), np.sin(a_))
                    free = [v for v in range(n) if v not in fixed]; ix = {v: i for i, v in enumerate(free)}
                    for alpha in (0.0, 0.5):
                        A = np.zeros((len(free), len(free))); b = np.zeros((len(free), 2))
                        for v in free:
                            i = ix[v]
                            for w in adj[v]:
                                wt = float(np.exp(-alpha * abs(dist[w] - dist[v]))); A[i, i] += wt
                                if w in ix: A[i, ix[w]] -= wt
                                else: b[i] += wt * np.array(fixed[w])
                        sol = np.linalg.solve(A, b); Z = np.zeros((n, 2))
                        for v, xy in fixed.items(): Z[v] = xy
                        for v in free: Z[v] = sol[ix[v]]
                        sg = signs(Z); inner_f = [i for i, f in enumerate(F) if tuple(sorted(f)) != tuple(sorted(outer))]
                        if len(set(sg[inner_f])) != 1 or 0 in sg or crosses(Z): continue
                        sc = gscore(Z)
                        if best is None or sc > best[0]: best = (sc, Z, sg)
    if best is None:
        # fallback for larger maps: a plain Tutte drawing with a far face outside (planar by Tutte's theorem), then
        # orientation-preserving moves that pull the five neighbours onto a regular pentagon around the hole
        outer = far[0]; fixed = {}
        for k, v in enumerate(outer):
            a_ = -np.pi / 2 + 2 * np.pi * k / 3; fixed[v] = (np.cos(a_), np.sin(a_))
        free = [v for v in range(n) if v not in fixed]; ix = {v: i for i, v in enumerate(free)}
        A = np.zeros((len(free), len(free))); b = np.zeros((len(free), 2))
        for v in free:
            i = ix[v]
            for w in adj[v]:
                A[i, i] += 1
                if w in ix: A[i, ix[w]] -= 1
                else: b[i] += np.array(fixed[w])
        sol = np.linalg.solve(A, b); pos = np.zeros((n, 2))
        for v, xy in fixed.items(): pos[v] = xy
        for v in free: pos[v] = sol[ix[v]]
        pos = pos - pos[h]; S0 = signs(pos); assert 0 not in S0
        # orientation of the link around the hole in this drawing
        ang = [np.arctan2(*pos[x][::-1]) for x in link]
        sgn = 1 if ((ang[1] - ang[0]) % (2 * np.pi)) < np.pi else -1

        def target(P):
            r = float(np.mean([np.hypot(*P[x]) for x in link]))
            off = np.angle(sum(np.exp(1j * (np.arctan2(P[x][1], P[x][0]) - sgn * 2 * np.pi * t / 5)) for t, x in enumerate(link)))
            return {x: r * np.array([np.cos(off + sgn * 2 * np.pi * t / 5), np.sin(off + sgn * 2 * np.pi * t / 5)]) for t, x in enumerate(link)}

        def dev(P):
            T_ = target(P); r = float(np.mean([np.hypot(*P[x]) for x in link]))
            return sum(float(np.sum((P[x] - T_[x]) ** 2)) for x in link) / r ** 2

        def obj(P): return gscore(P) - 2.0 * dev(P)
        rng0 = np.random.default_rng(seed + 7); cur = obj(pos); mov = [v for v in range(n) if v != h]
        for it in range(40000):
            v = mov[rng0.integers(len(mov))]; Z = pos.copy()
            if v in link and rng0.random() < 0.5:
                Z[v] += 0.3 * (target(pos)[v] - pos[v])
            else:
                Z[v] += rng0.normal(0, 0.02, 2) * max(1.0, float(np.hypot(*pos[v])))
            if (signs(Z) != S0).any(): continue
            s_ = obj(Z)
            if s_ >= cur: pos, cur = Z, s_
        Z = pos.copy(); T_ = target(pos)
        for x in link: Z[x] = T_[x]
        assert (signs(Z) == S0).all() and not crosses(Z), ('ring snap failed', dev(pos))
        pos = Z; cur = gscore(pos)
    else:
        cur, pos, S0 = best
    # radial expansion about the hole (r -> r^g keeps the ring regular): give the hole's neighbourhood room
    bestg = (gscore(pos) + 0.15 * float(np.hypot(*pos[link[0]]) / np.abs(pos).max()), pos)
    for g in (0.4, 0.5, 0.6, 0.7, 0.8, 0.9):
        rr = np.hypot(pos[:, 0], pos[:, 1]); rr[rr == 0] = 1
        Z = pos * (rr ** (g - 1))[:, None]
        if (signs(Z) == S0).all() and not crosses(Z):
            sc_ = gscore(Z) + 0.15 * float(np.hypot(*Z[link[0]]) / np.abs(Z).max())
            if sc_ > bestg[0]: bestg = (sc_, Z)
    pos = bestg[1]

    def rscore(P): return gscore(P) + 0.8 * float(np.hypot(*P[link[0]]) / np.abs(P).max())
    cur = rscore(pos)
    rng = np.random.default_rng(seed); movable = [v for v in range(n) if v != h and v not in link]
    for it in range(15000):
        if rng.random() < 0.05:   # gentle radial expansion about the hole (keeps the ring regular)
            rr = np.hypot(pos[:, 0], pos[:, 1]); rr[rr == 0] = 1; Z = pos * (rr ** -0.04)[:, None]
        else:
            v = movable[rng.integers(len(movable))]; Z = pos.copy(); Z[v] += rng.normal(0, 0.04, 2) * max(1.0, float(np.hypot(*pos[v])) * 0.5)
        if (signs(Z) != S0).any(): continue
        s_ = rscore(Z)
        if s_ >= cur: pos, cur = Z, s_
    assert not crosses(pos) and (signs(pos) == S0).all()
    pos = pos / float(np.abs(pos).max())
    print('  layout: hole at the centre, regular ring of 5, gap score', round(cur, 4))
    return [[round(float(x), 4), round(float(y), 4)] for x, y in pos], link, gaps(pos)
