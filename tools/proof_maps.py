# Game maps grown from the four-colour proof's hard pieces, and padded maps (levels 41+).
#
#   python3 tools/proof_maps.py anneal PIECE CENSUS N SEED [--extra K]   search for maps holding PIECE (JSON lines)
#   python3 tools/proof_maps.py write PIECE CENSUS N SEED K INDEX HOLE KEY   write maps/KEY.json from one search result
#   python3 tools/proof_maps.py pad BASEKEY K KEY                            maps/KEY.json: BASEKEY with K outer bands
#
# A piece is a vertex u of degree d, the degrees of its neighbours w0..w(d-1) in cyclic order (the link), and the
# degrees of the second-ring vertices s_i between w_i and w_(i+1) (the s word), as the proof repo writes them
# (kylemath/GraphColourDeductiveSolver, backgroundMaterial/planemap-structural/longtable/reducibility/discharge/
# wheeldis/loop). The search starts from a random census triangulation (one rotation system per line, as in
# SolvingFrameworkPlan/docs/working/Census33/out/frame-33.txt), subdivides K random faces to grow it, and walks by
# edge flips (degrees kept 4-8, Metropolis on the distance to the piece, degree-4 vertices penalised) until some
# vertex has exactly the piece's 2-ball, every degree is at least 5 and no triangle separates. The hole is then a
# degree-5 vertex of the piece, chosen with the game engine for depth (build_game.py --check KEY).
#
# Padding is the band construction of the proof repo's large-map study (.../longtable/leverage/large/large.py,
# set (c)): glue a triangle A B C onto the face (a, b, c) farthest from the hole (edges AB BC CA Aa Ab Bb Bc Cc Ca),
# then repeat on A B C. Swaps inside the bands never unlock the hole, so a padded map keeps every par and its
# colouring count grows exactly 4x per band.
import os, sys, json, random, math, argparse, collections

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

PIECES = {
    # the degree-7 arrangement R* that held the K = 2 bound at 7/27 (rounds 39-42: no known configuration forbids it)
    'rstar': (7, '5675765', '6577575'),
    # the degree-8 binder at 1/4, killed in round 43 by ring-10 to ring-14 windows (wheeldis/loop/k43)
    'binder8': (8, '85556565', '65866655'),
}


def images(link, s):
    d = len(link); out = set()
    for r in range(d):
        L = link[r:] + link[:r]; S = s[r:] + s[:r]; out.add((L, S))
        Lr = ''.join(L[(-i) % d] for i in range(d)); Sr = ''.join(S[(-i - 1) % d] for i in range(d)); out.add((Lr, Sr))
    return [(tuple(map(int, a)), tuple(map(int, b))) for a, b in out]

def score_u(rot, deg, u, d, IM):
    W = rot[u]
    if len(W) != d: return 99
    S = []
    for i in range(d):
        a, b = W[i], W[(i + 1) % d]
        # third vertex of the face (u, b, a) on the far side: in rot[a], neighbour adjacent to b other than u
        ra = rot[a]; j = ra.index(b); c1, c2 = ra[(j + 1) % len(ra)], ra[j - 1]
        c = c1 if c1 != u else c2
        S.append(deg[c])
    L = [deg[w] for w in W]
    return min(sum(abs(x - y) for x, y in zip(L, il)) + sum(abs(x - y) for x, y in zip(S, is_)) for il, is_ in IM)

def score(rot, piece, IM):
    d = PIECES[piece][0]; deg = [len(r) for r in rot]
    best = 99, -1
    for u in range(len(rot)):
        if deg[u] == d:
            s = score_u(rot, deg, u, d, IM)
            if s < best[0]: best = (s, u)
        elif abs(deg[u] - d) == 1 and best[0] >= 50:
            best = min(best, (50, u))
    pen = 3 * sum(1 for x in deg if x < 5)
    return best[0] + pen, best[1]

def flip(rot, a, b):
    ra = rot[a]; j = ra.index(b); c = ra[(j + 1) % len(ra)]; d = ra[j - 1]
    if c == d or d in rot[c]: return False
    if len(rot[a]) <= 4 or len(rot[b]) <= 4: return False
    if len(rot[c]) >= 8 or len(rot[d]) >= 8: return False
    rot[a].remove(b); rot[b].remove(a)
    rc = rot[c]
    for k in range(len(rc)):
        if {rc[k], rc[(k + 1) % len(rc)]} == {a, b}: rc.insert(k + 1, d); break
    rd = rot[d]
    for k in range(len(rd)):
        if {rd[k], rd[(k + 1) % len(rd)]} == {a, b}: rd.insert(k + 1, c); break
    return True

def sep_ok(rot):
    n = len(rot); adj = [set(r) for r in rot]
    tri = sum(1 for a in range(n) for b in adj[a] if b > a for c in adj[a] & adj[b] if c > b)
    return tri == 2 * n - 4 and all(len(set(r)) == len(r) for r in rot)

def run(rot, piece, seed, steps=150000):
    rng = random.Random(seed); IM = images(PIECES[piece][1], PIECES[piece][2])
    cur = score(rot, piece, IM)[0]; T = 2.0
    for t in range(steps):
        a = rng.randrange(len(rot)); b = rng.choice(rot[a])
        old = [list(r) for r in rot]
        if not flip(rot, a, b): continue
        s = score(rot, piece, IM)[0]
        if s <= cur or rng.random() < math.exp((cur - s) / T):
            cur = s
            if cur == 0:
                if sep_ok(rot): return rot, score(rot, piece, IM)[1]
        else:
            rot[:] = old
        T = max(0.15, T * 0.9998)
    return None



def anneal(piece, path, nstart, seed0, extra):
    """yields (start graph name, run seed, rot, u) or (name, seed, None, None), reproducibly from seed0"""
    lines = [l for l in open(path) if l.strip()]
    rng = random.Random(seed0)
    for i in range(nstart):
        p = rng.choice(lines).split(); rot = [list(map(int, r.split(','))) for r in p[2].split(';')]
        for _ in range(extra):                       # subdivide random faces; the walk lifts the new degree-3 vertices
            a = rng.randrange(len(rot)); j = rng.randrange(len(rot[a])); b = rot[a][j]; c = rot[a][(j + 1) % len(rot[a])]
            v = len(rot); rot.append([a, c, b])
            rot[a].insert(j + 1, v)
            rb = rot[b]; k = rb.index(a); rb.insert(k, v) if rb[k - 1] == c else rb.insert(k + 1, v)
            rc = rot[c]; k = rc.index(b); rc.insert(k, v) if rc[k - 1] == a else rc.insert(k + 1, v)
        r = run(rot, piece, seed0 * 1000 + i)
        yield (p[0], seed0 * 1000 + i) + (r if r else (None, None))


def faces_rot(rot):
    from mapio import rot_from_faces
    F = set()
    for v, r in enumerate(rot):
        for i in range(len(r)): F.add(tuple(sorted((v, r[i], r[(i + 1) % len(r)]))))
    return rot_from_faces(sorted(F))


def write_map(key, spec):
    path = os.path.join(ROOT, 'maps', key + '.json')
    rows = ',\n    '.join(json.dumps(r) for r in spec.pop('rot'))
    head = json.dumps(spec, indent=2, ensure_ascii=False)[:-2]
    open(path, 'w').write(head + ',\n  "rot": [\n    ' + rows + '\n  ]\n}\n')
    print('wrote', path)


def bfs(adj, s):
    dist = [-1] * len(adj); dist[s] = 0; q = collections.deque([s])
    while q:
        u = q.popleft()
        for w in adj[u]:
            if dist[w] < 0: dist[w] = dist[u] + 1; q.append(w)
    return dist


def pad_rot(rot, hole, k, face=0):
    """k bands on a face, as a rotation system. Faces are ranked farthest from the hole first (nearest vertex, then
    distance sum); face=0 is the study's choice. A band on the very farthest face can be squeezed against the border
    of the square drawing, so some maps take a nearer face (the separating triangle keeps the par either way)."""
    rot = [list(r) for r in rot]; dist = bfs(rot, hole); F = {}
    for v in range(len(rot)):
        r = rot[v]
        for i in range(len(r)):
            f = (v, r[i], r[(i + 1) % len(r)]); F.setdefault(tuple(sorted(f)), f)
    order = sorted(F.values(), key=lambda f: (min(dist[x] for x in f), sum(dist[x] for x in f), tuple(-x for x in f)), reverse=True)
    a, b, c = order[face]
    faces = set(F); faces.discard(tuple(sorted((a, b, c)))); n = len(rot)
    for _ in range(k):
        A, B, C = n, n + 1, n + 2; n += 3
        for f in ((A, a, b), (B, b, c), (C, c, a), (A, b, B), (B, c, C), (C, a, A)): faces.add(tuple(sorted(f)))
        a, b, c = A, B, C
    faces.add(tuple(sorted((a, b, c))))
    from mapio import rot_from_faces
    return rot_from_faces(sorted(faces))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd'); ap.add_argument('args', nargs='*'); ap.add_argument('--extra', type=int, default=0)
    ap.add_argument('--face', type=int, default=0)
    a = ap.parse_args()
    if a.cmd == 'anneal':
        piece, path, n, seed = a.args[0], a.args[1], int(a.args[2]), int(a.args[3])
        for name, sd, rot, u in anneal(piece, path, n, seed, a.extra):
            print(json.dumps({'piece': piece, 'from': name, 'seed': sd, 'u': u, 'n': rot and len(rot), 'rot': rot}), flush=True)
    elif a.cmd == 'write':
        piece, path, n, seed, extra, idx, hole, key = a.args[0], a.args[1], int(a.args[2]), int(a.args[3]), int(a.args[4]), int(a.args[5]), int(a.args[6]), a.args[7]
        for i, (name, sd, rot, u) in enumerate(anneal(piece, path, n, seed, extra)):
            if i == idx: break
        assert rot, 'that search run found nothing'
        d, link, s = PIECES[piece]
        write_map(key, {'name': '%s %s/%s' % ('R*' if piece == 'rstar' else 'binder', link, s),
                        'source': 'tools/proof_maps.py write %s %s %d %d %d %d %d %s: piece %s at vertex %d, census start %s' % (
                            piece, os.path.basename(path), n, seed, extra, idx, hole, key, piece, u, name),
                        'hole': hole, 'world': True, 'rot': faces_rot(rot)})
    elif a.cmd == 'pad':
        base, k, key = a.args[0], int(a.args[1]), a.args[2]
        sp = json.load(open(os.path.join(ROOT, 'maps', base + '.json')))
        from mapio import load_map
        rot, _ = load_map(sp)
        write_map(key, {'name': '%s + %d band%s' % (sp.get('name', base), k, '' if k == 1 else 's'),
                        'source': 'tools/proof_maps.py pad %s %d %s --face %d: maps/%s.json with %d band%s on face %d (0 = farthest from the hole)' % (
                            base, k, key, a.face, base, k, '' if k == 1 else 's', a.face),
                        'hole': sp['hole'], 'rot': pad_rot(rot, sp['hole'], k, a.face)})
    else:
        sys.exit('unknown command ' + a.cmd)
