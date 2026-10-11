# World maps for "Fill the Hole": the colouring space of one map, projected to 2D (moved here from build_levels.py).
# `b` needs: key, n, h, rot, colouring(k), canon(c), H.S, H.filled, H.dF, H.Nch, dl (as built by build_game.py's Board).
import collections


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
def world(b, signs_in):
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
    signs = signs_in
    print('world %s: %d legal + %d illegal sampled, %d land hexes, %dx%d sea grid (%d sampled cells), hex radius %.2f, badness 95%% %.0f'
          % (b.key, S, len(ill), len(hexes), cols_, rows, nsea, size, bmax))
    return {'S': S, 'M': len(ill), 'E': len(E), 'size': round(size, 4), 'canon': ''.join(canon),
            'x': [float(v) for v in Y[:S, 0]], 'y': [float(v) for v in Y[:S, 1]],
            'hex': sh, 'hexes': hexes, 'dl': ''.join('1' if b.dl[k] else '0' for k in range(S)), 'N': H.Nch, 'dF': H.dF,
            'maxdF': max(H.dF), 'sea': {'q0': q0, 'r0': r0, 'cols': cols_, 'rows': rows, 'd': ''.join(d), 'lev': lev},
            'signs': signs}
