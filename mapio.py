# Reading maps for "Fill the Hole" (docs/game). A map JSON gives the graph in ONE of these forms:
#   "faces": [[a, b, c], ...]     triangles of a sphere triangulation (any orientation; they are oriented here)
#   "rot":   [[...], ...]         rotation system: the neighbours of each vertex in cyclic order
#   "ascii": "17 bcdef,afghc,..." plantri ascii (vertex count, then each vertex's neighbours as letters a=0)
#   "edges" + "pos"               any plane graph drawn with straight lines (pos in [-1, 1]^2, y down); the rotation
#                                 comes from the drawing. Used for the small onboarding ponds.
# Triangulations are checked: every edge in two faces, Euler characteristic 2, every vertex link a single cycle.
import collections, math


def rot_from_ascii(s):
    p = s.split(); n = int(p[0]); rows = p[1].split(',')
    assert len(rows) == n, 'plantri ascii: vertex count'
    return [[ord(ch) - 97 for ch in r] for r in rows]


def orient_faces(F):
    """orient the triangles consistently (shared edges traversed in opposite directions)"""
    F = [tuple(f) for f in F]
    edge_faces = collections.defaultdict(list)
    for i, f in enumerate(F):
        for j in range(3): edge_faces[frozenset((f[j], f[(j + 1) % 3]))].append(i)
    for e, fs in edge_faces.items():
        assert len(fs) == 2, 'edge %s lies in %d faces (need 2)' % (sorted(e), len(fs))
    out = [None] * len(F)
    for s in range(len(F)):
        if out[s] is not None: continue
        out[s] = F[s]; q = [s]
        while q:
            i = q.pop(); f = out[i]
            for j in range(3):
                a, b = f[j], f[(j + 1) % 3]
                for k in edge_faces[frozenset((a, b))]:
                    if k == i: continue
                    g = F[k]; d = [(g[t], g[(t + 1) % 3]) for t in range(3)]
                    want = g if (b, a) in d else (g[0], g[2], g[1])
                    if out[k] is None: out[k] = want; q.append(k)
                    else: assert out[k] == want, 'faces cannot be oriented (not a sphere)'
    return out


def rot_from_faces(F):
    F = orient_faces(F)
    n = 1 + max(max(f) for f in F)
    nxt = [dict() for _ in range(n)]
    for a, b, c in F:
        nxt[a][b] = c; nxt[b][c] = a; nxt[c][a] = b
    rot = []
    for v in range(n):
        assert nxt[v], 'vertex %d is in no face' % v
        s = min(nxt[v]); cyc = [s]
        while True:
            w = nxt[v][cyc[-1]]
            if w == s: break
            assert w not in cyc, 'link of %d is not one cycle' % v
            cyc.append(w)
        assert len(cyc) == len(nxt[v]), 'link of %d is not one cycle' % v
        rot.append(cyc)
    E = sum(len(r) for r in rot) // 2
    assert n - E + len(F) == 2, 'Euler characteristic is not 2 (not a sphere)'
    return rot


def check_rot(rot):
    n = len(rot)
    for u in range(n):
        assert len(set(rot[u])) == len(rot[u]), 'repeated neighbour at %d' % u
        for w in rot[u]: assert u in rot[w], 'edge %d-%d one-sided' % (u, w)
    # faces of the rotation system: Euler characteristic 2 for a sphere
    seen = set(); faces = 0
    for u in range(n):
        for w in rot[u]:
            if (u, w) in seen: continue
            faces += 1; a, b = u, w
            while (a, b) not in seen:
                seen.add((a, b)); i = rot[b].index(a); a, b = b, rot[b][(i - 1) % len(rot[b])]
    E = sum(len(r) for r in rot) // 2
    return n - E + faces == 2


def rot_from_drawing(pos, edges):
    n = len(pos); adj = [[] for _ in range(n)]
    for a, b in edges: adj[a].append(b); adj[b].append(a)
    ang = lambda u, w: math.atan2(pos[w][1] - pos[u][1], pos[w][0] - pos[u][0])
    return [sorted(adj[u], key=lambda w: ang(u, w)) for u in range(n)]


def load_map(spec):
    """spec: the map JSON (dict). Returns (rot, triangulation?)"""
    if 'faces' in spec: return rot_from_faces(spec['faces']), True
    if 'ascii' in spec: rot = rot_from_ascii(spec['ascii'])
    elif 'rot' in spec: rot = [list(r) for r in spec['rot']]
    elif 'edges' in spec and 'pos' in spec: return rot_from_drawing(spec['pos'], spec['edges']), False
    else: raise ValueError('map needs one of: faces, rot, ascii, edges+pos')
    assert check_rot(rot), 'rotation system is not a sphere'
    tri = all(len(r) >= 3 for r in rot) and _all_triangles(rot)
    return rot, tri


def _all_triangles(rot):
    for u in range(len(rot)):
        d = len(rot[u])
        for i in range(d):
            if rot[u][(i + 1) % d] not in rot[rot[u][i]]: return False
    return True


def link_word(rot, h):
    return ''.join(str(len(rot[x])) if len(rot[x]) < 10 else '(%d)' % len(rot[x]) for x in rot[h])


def pond_cells(pos, rot, fence=0.26, reach=0.40, arc=math.radians(50)):
    """Region shapes for a small hand-drawn map that is not a triangulation (the onboarding ponds), honest to the graph:
    each vertex gets a rounded blob, and two joined vertices share one straight border, a "fence" across the middle of
    their edge (perpendicular, half-length `fence` x edge length). Unjoined vertices never touch: paper between them.
    Shared fence ends are the same points in both shapes, so the renderer finds the border. Returns polygons, pos frame."""
    n = len(pos); P = [tuple(p) for p in pos]
    L = lambda u, w: math.dist(P[u], P[w])
    ang = lambda u, w: math.atan2(P[w][1] - P[u][1], P[w][0] - P[u][0])
    def fence_pt(u, w, side):                                # side +1: the end at (edge angle + 90 deg) seen from u
        a = ang(u, w); m = ((P[u][0] + P[w][0]) / 2, (P[u][1] + P[w][1]) / 2); h = fence * L(u, w)
        return (m[0] + side * h * math.cos(a + math.pi / 2), m[1] + side * h * math.sin(a + math.pi / 2))
    cells = []
    for u in range(n):
        nb = sorted(rot[u], key=lambda w: ang(u, w))
        if not nb: cells.append([(P[u][0] + .1 * math.cos(t), P[u][1] + .1 * math.sin(t)) for t in [k * math.pi / 4 for k in range(8)]]); continue
        r = reach * min(L(u, w) for w in nb)
        poly = []
        for i, w in enumerate(nb):
            x = nb[(i + 1) % len(nb)]
            a0 = ang(u, w); a1 = ang(u, x) if len(nb) > 1 else a0 + 2 * math.pi
            if a1 <= a0: a1 += 2 * math.pi
            poly += [fence_pt(u, w, -1), fence_pt(u, w, +1)]   # the fence across edge u-w (both ends, in angular order)
            # the open sector between the two edges: an arc of corner points at radius r, kept clear of both fences
            pad = math.atan2(fence * L(u, w), L(u, w) / 2); pad2 = math.atan2(fence * L(u, x), L(u, x) / 2)
            s0, s1 = a0 + pad, a1 - pad2
            if s1 > s0:
                k = max(1, int(math.ceil((s1 - s0) / arc)))
                poly += [(P[u][0] + r * math.cos(s0 + (s1 - s0) * j / k), P[u][1] + r * math.sin(s0 + (s1 - s0) * j / k)) for j in range(k + 1)]
        cells.append(poly)
    m = max(max(abs(c) for p in poly for c in p) for poly in cells)
    s = min(1.0, 0.97 / m)
    return [[[round(x * s, 5), round(y * s, 5)] for x, y in poly] for poly in cells]
