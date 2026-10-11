# Adds the gentle onboarding levels (Level -1: "Splash Cove") to docs/game/levels.js and docs/game/layout.js.
#
# Run AFTER build_levels.py and build_layout.py (both rewrite their file from scratch and drop these levels):
#     python3 docs/game/build_levels.py && python3 docs/game/build_layout.py && python3 docs/game/build_onboarding.py
# It is idempotent: it removes any onboarding graphs/levels already in the files, then inserts the current ones at the
# front of the level list. Everything else in levels.js / layout.js is written back unchanged (byte-identical JSON).
#
# The onboarding maps are tiny hand-drawn planar graphs, NOT triangulations, so tm_lib (which assumes a degree-5 hole
# in a 4-coloured triangulation) is not used. Everything is brute-forced here instead:
#   * every proper colouring of the map minus the hole with the level's palette (2 or 3 elements), up to renaming;
#   * the game's moves: for each pair of palette elements, each connected two-element component (a Kempe chain) of the
#     map minus the hole, except when the pair has only one component (the whole "web": flipping it only renames);
#   * filled = the rim (the hole's neighbours) uses at most `goal` elements (goal = rim elements at the start - 1);
#   * BFS distance to the nearest filled colouring, keyed by the game's canon() string (first occurrence along the
#     vertex ids, hole skipped), for hints and par.
# Graph extras read by index.html: ncol (palette size: computeChains and the swap wheel use elements 0..ncol-1), goal
# (win when the rim uses <= goal elements), onboard (no walls, no world map). layout.js gets {border: [], arcs: {},
# centre} per map: no walls, tile centres in the unit square (index.html maps them onto the island).
import os, sys, json, math, collections

HERE = os.path.dirname(os.path.abspath(__file__))
MINUS = '−'

# ---------------------------------------------------------------------------------------------------------- the maps
# pos: tile centres in [-1, 1]^2 (y down), the hole at the origin. edges: bridges (hole edges included).
GRAPHS = {
    # two little groups round the goal, two elements: swap either group and the ring is one element
    'ob1': {'name': 'two puddles', 'ncol': 2, 'hole': 0,
            'pos': [(0, 0), (-.52, -.26), (.52, -.26), (0, -.74), (0, .46), (-.56, .84), (.56, .84)],
            'edges': [(0, 1), (0, 2), (0, 4), (1, 3), (2, 3), (4, 5), (4, 6)]},
    # three rim tiles on a ring of six, three outer tiles: three elements
    'ob2': {'name': 'ring of six', 'ncol': 3, 'hole': 0,
            'pos': [(0, 0)] + [(.62 * math.cos(math.radians(a)), .56 * math.sin(math.radians(a))) for a in (-90, -30, 30, 90, 150, 210)]
                   + [(.9 * math.cos(math.radians(a)), .86 * math.sin(math.radians(a))) for a in (-60, 60, 180)],
            'edges': [(0, 1), (0, 3), (0, 5), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 1), (7, 1), (7, 2), (8, 3), (8, 4), (9, 5), (9, 6)]},
}
# a ring of eight round the goal, four rim tiles on it (top, right, bottom, left), two forked arms top and bottom
GRAPHS['ob3'] = {'name': 'forked pond', 'ncol': 3, 'hole': 0,
                 'pos': [(0, 0)] + [(round(.46 * math.cos(math.radians(a)), 4), round(.42 * math.sin(math.radians(a)), 4)) for a in range(-90, 270, 45)]
                        + [(0, -.72), (-.44, -.86), (.44, -.86), (0, .72), (-.44, .86), (.44, .86)],
                 'edges': [(0, 1), (0, 3), (0, 5), (0, 7)] + [(1 + i, 1 + (i + 1) % 8) for i in range(8)]
                          + [(9, 1), (10, 9), (11, 9), (12, 5), (13, 12), (14, 12)]}
# four rim tiles in a square round the goal, a ring of eight round that
GRAPHS['ob4'] = {'name': 'square pond', 'ncol': 3, 'hole': 0,
                 'pos': [(0, 0), (0, -.36), (.4, 0), (0, .36), (-.4, 0), (.5, -.48), (.5, .48), (-.5, .48), (-.5, -.48),
                         (0, -.84), (.86, 0), (0, .84), (-.86, 0)],
                 'edges': [(0, 1), (0, 2), (0, 3), (0, 4), (1, 2), (2, 3), (3, 4), (4, 1),
                           (5, 1), (5, 2), (6, 2), (6, 3), (7, 3), (7, 4), (8, 4), (8, 1),
                           (9, 5), (9, 8), (10, 5), (10, 6), (11, 6), (11, 7), (12, 7), (12, 8)]}


class Map:
    def __init__(self, key, spec):
        self.key = key; self.spec = spec; self.n = len(spec['pos']); self.h = spec['hole']; self.nc = spec['ncol']
        P = spec['pos']; self.adj = [[] for _ in range(self.n)]
        for a, b in spec['edges']: self.adj[a].append(b); self.adj[b].append(a)
        ang = lambda u, w: math.atan2(P[w][1] - P[u][1], P[w][0] - P[u][0])
        self.rot = [sorted(self.adj[u], key=lambda w: ang(u, w)) for u in range(self.n)]
        # the rim clockwise on screen (y down) from the top
        self.link = sorted(self.adj[self.h], key=lambda w: (ang(self.h, w) + math.pi / 2) % (2 * math.pi))
        self.V = [u for u in range(self.n) if u != self.h]
        self.enumerate()

    def canon(self, c):
        mp = {}; return ''.join(str(mp.setdefault(c[u], len(mp))) for u in range(self.n) if u != self.h)

    def rimcount(self, c): return len({c[x] for x in self.link})

    def enumerate(self):
        out = {}; c = [-1] * self.n
        def rec(i):
            if i == len(self.V):
                k = self.canon(c)
                if k not in out: out[k] = c[:]
                return
            u = self.V[i]
            for x in range(self.nc):
                if all(c[w] != x for w in self.adj[u] if w != self.h): c[u] = x; rec(i + 1); c[u] = -1
        rec(0); self.states = out

    def chains(self, c):
        """the game's computeChains(): per pair, the two-element components of the map minus the hole"""
        res = []
        for a in range(self.nc):
            for b in range(a + 1, self.nc):
                seen = set(); mine = []
                for s in self.V:
                    if s in seen or c[s] not in (a, b): continue
                    comp = {s}; st = [s]; seen.add(s)
                    while st:
                        u = st.pop()
                        for w in self.adj[u]:
                            if w != self.h and w not in comp and c[w] in (a, b): comp.add(w); seen.add(w); st.append(w)
                    mine.append(comp)
                for comp in mine: res.append({'pair': (a, b), 'set': comp, 'web': len(mine) == 1})
        return res

    @staticmethod
    def flip(c, K):
        a, b = K['pair']; d = c[:]
        for u in K['set']: d[u] = b if c[u] == a else a
        return d

    def solve(self, goal):
        self.goal = goal
        filled = lambda c: self.rimcount(c) <= goal
        nb = {k: set() for k in self.states}
        for k, c in self.states.items():
            for K in self.chains(c):
                if not K['web']: nb[k].add(self.canon(self.flip(c, K)))
        dist = {k: 0 for k, c in self.states.items() if filled(c)}; q = collections.deque(dist)
        while q:
            k = q.popleft()
            for m in nb[k]:
                if m not in dist: dist[m] = dist[k] + 1; q.append(m)
        self.dist = dist; self.filled = filled

    def describe(self, c):
        """stats of a start colouring: winning moves, their sizes, locks"""
        win, lock = [], []
        rim = set(self.link)
        for K in self.chains(c):
            if K['web']: continue
            if self.filled(self.flip(c, K)): win.append(K)
            rc = {c[x] for x in K['set'] & rim}
            if len(K['set']) > 1 and set(K['pair']) <= rc: lock.append(K)
        return win, lock

    def leaves(self, K):
        return sum(1 for u in K['set'] if sum(1 for w in self.adj[u] if w in K['set']) == 1)

    def export(self):
        P = self.spec['pos']
        dist = {k: d for k, d in self.dist.items() if d > 0}
        return {'name': self.spec['name'], 'n': self.n, 'hole': self.h, 'link': self.link,
                'pos': [[round(x, 4), round(y, 4)] for x, y in P],
                'edges': sorted((min(a, b), max(a, b)) for a, b in self.spec['edges']),
                'deg': [len(r) for r in self.rot], 'rot': self.rot, 'S': len(self.states), 'dist': dist,
                'ncol': self.nc, 'goal': self.goal, 'onboard': True}

    def layout(self):
        return {'border': [], 'arcs': {}, 'centre': [[round(x, 4), round(y, 4)] for x, y in self.spec['pos']], 'onboard': True}


M = {k: Map(k, s) for k, s in GRAPHS.items()}
M['ob1'].solve(1)
for k in ('ob2', 'ob3', 'ob4'): M[k].solve(2)


def show(m, c):
    win, lock = m.describe(c)
    return 'rim %s d=%s win=%s lock=%s' % ([c[x] for x in m.link], m.dist.get(m.canon(c)),
                                          [(K['pair'], sorted(K['set']), m.leaves(K)) for K in win],
                                          [(K['pair'], sorted(K['set'])) for K in lock])


if __name__ == '__main__' and '--explore' in sys.argv:
    for k, m in M.items():
        print('==', k, m.spec['name'], 'states', len(m.states), 'link', m.link, 'rot', m.rot)
        for c in m.states.values():
            if m.dist.get(m.canon(c), -1) >= 1: print('  ', c, show(m, c))
    sys.exit()


# ------------------------------------------------------------------------------------------------------- the levels
F, W, A = 0, 1, 2                                 # fire, water, air (earth, 3, is not used here)
KICKER = 'First steps'                            # its island on the level map is "Splash Cove" (DIST in index.html)
LEVELS = [
    ('ob1', [-1, F, F, W, W, F, F], 'Splash!', [],
     'Welcome! The grey ? tile in the middle wants an element, but its ring holds fire AND water. '
     'Drag from tile to tile along a little group of fire and water until every tile glows, then press SWAP. '
     'Make the ring all one element!'),
    ('ob2', None, 'One of each', [],
     'Now there are three elements, and the ring round the ? has one of each. Catch any chain that touches the ring '
     'and swap it: the ring keeps only two elements, and the ? can take the third.'),
    ('ob3', [-1, W, A, F, W, A, W, F, A, F, W, W, F, A, A], 'Forked path', [],
     'Fire is on the ring twice, water and air only once: swap water or air away. Some chains fork. '
     'Trace every arm until the whole chain glows, then swap it.'),
    ('ob4', [-1, F, W, F, A, A, A, W, W, F, F, F, F], 'First lock', ['locks'],
     'A chain that joins ring tiles of both its elements is a lock (\U0001F512): swapping it just shuffles the ring. '
     'Skip the big locks and find a small chain that clears an element.'),
]


def build_levels():
    out = []
    for i, (g, start, title, tools, intro) in enumerate(LEVELS):
        m = M[g]
        if start is None:                          # the map's only unfilled colouring
            (start,) = [c for c in m.states.values() if m.dist.get(m.canon(c), 0) > 0]
        k = m.canon(start)
        assert k in m.states and all(start[u] != start[w] for u in m.V for w in m.adj[u] if w != m.h), (g, 'not proper')
        assert m.dist.get(k) == 1, (g, 'start must be one swap from a filled rim', m.dist.get(k))
        assert m.rimcount(start) == m.goal + 1
        win, lock = m.describe(start)
        assert all(len(K['set']) >= 2 for K in win), (g, 'a single tile wins')
        assert (len(lock) > 0) == ('locks' in tools), (g, 'locks')
        print('level -1.%d %-4s %-12s %s' % (i + 1, g, title, show(m, start)))
        out.append({'g': g, 'title': title, 'kicker': KICKER, 'intro': intro, 'start': start, 'par': 1,
                    'num': MINUS + '1.%d' % (i + 1), 'tools': tools, 'dl': False,
                    'N': sum(1 for K in m.chains(start) if not K['web'])})
    return out


def patch(path, var, fn):
    s = open(path).read(); head = 'window.' + var + ' = '
    i = s.index(head) + len(head); j = s.rindex(';\n')
    obj = json.loads(s[i:j])
    assert json.dumps(obj, separators=(',', ':')) == s[i:j], path + ': JSON does not round-trip'
    fn(obj)
    open(path, 'w').write(s[:i] + json.dumps(obj, separators=(',', ':')) + s[j:])


def patch_levels(D):
    D['graphs'] = {k: g for k, g in D['graphs'].items() if not g.get('onboard')}
    D['levels'] = [L for L in D['levels'] if not L['num'].startswith(MINUS)]
    for k, m in M.items(): D['graphs'][k] = m.export()
    D['levels'] = build_levels() + D['levels']


def patch_layout(Lay):
    for k in [k for k, v in Lay.items() if v.get('onboard')]: del Lay[k]
    for k, m in M.items(): Lay[k] = m.layout()


patch(os.path.join(HERE, 'levels.js'), 'GAME', patch_levels)
patch(os.path.join(HERE, 'layout.js'), 'LAYOUT', patch_layout)
print('patched levels.js and layout.js:', len(LEVELS), 'onboarding levels,', ', '.join(M))
