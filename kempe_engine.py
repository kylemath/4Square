# Kempe-swap engine for "Fill the Hole" (docs/game). Pure Python, no research code.
#
# A map is a plane graph with one uncoloured vertex, the hole, whose neighbours are the rim. A state is a proper
# colouring of the map minus the hole with `ncol` elements, up to renaming the elements. A move swaps the two
# elements of one Kempe chain (a connected two-element component of the map minus the hole); a chain that is the
# only one of its pair (a "web") is not a move, because swapping it only renames. A state is filled when the rim
# uses at most `goal` elements (default ncol - 1), so the hole can take a free element.
#
# The engine enumerates every state, every move, the Kempe classes, and the swap distance dF to the nearest filled
# state. For 4 elements and a rim of 5 (the research setting) it also gives the frame, the two locks, π (Kittell's
# tangent-chain swap at a doubly locked rim), the chain count N, and whether the quickest moves are "quiet" (chains
# that touch no rim tile) or "loud".
#
# State keys are the game's canon(): elements renamed in order of first appearance along vertex ids, hole skipped.
import collections


class HoleGame:
    def __init__(self, n, adj, hole, link, ncol=4, goal=None, limit=3_000_000):
        self.n, self.hole, self.link, self.nc = n, hole, list(link), ncol
        self.adj = [sorted(set(a)) for a in adj]
        self.goal = ncol - 1 if goal is None else goal
        self.V = [u for u in range(n) if u != hole]
        self.rimset = set(link)
        self.limit = limit
        self._enumerate()
        self._moves()
        self._dist()
        if ncol == 4 and len(link) == 5:
            self._frames()

    # ------------------------------------------------------------------------------------------ states
    def canon(self, c):
        mp = {}
        return ''.join(str(mp.setdefault(c[u], len(mp))) for u in self.V)

    def _enumerate(self):
        """every proper colouring of the map minus the hole, up to renaming (backtracking in BFS order, with the
        first-new-element symmetry break; each result is re-keyed by canon())"""
        V, adj, h = self.V, self.adj, self.hole
        order, seen = [], set()
        for s in V:
            if s in seen: continue
            q = collections.deque([s]); seen.add(s)
            while q:
                u = q.popleft(); order.append(u)
                for w in adj[u]:
                    if w != h and w not in seen: seen.add(w); q.append(w)
        pos = {u: i for i, u in enumerate(order)}
        back = [[w for w in adj[u] if w != h and pos[w] < pos[u]] for u in order]
        c = [-1] * self.n
        out = {}
        nc = self.nc

        def rec(i, used):
            if i == len(order):
                k = self.canon(c)
                if k not in out:
                    out[k] = tuple(c)
                    if len(out) > self.limit: raise RuntimeError('more than %d states: map too big' % self.limit)
                return
            u = order[i]; bad = {c[w] for w in back[i]}
            for x in range(min(nc, used + 1)):
                if x in bad: continue
                c[u] = x; rec(i + 1, max(used, x + 1)); c[u] = -1

        import sys
        sys.setrecursionlimit(max(1000, 4 * self.n))
        rec(0, 0)
        self.keys = sorted(out)
        self.states = [out[k] for k in self.keys]
        self.index = {k: i for i, k in enumerate(self.keys)}
        self.S = len(self.states)

    def chains(self, c):
        """all chains of colouring c: dicts {pair, set, web, rim (rim tiles in it)}"""
        res = []
        adj, h = self.adj, self.hole
        for a in range(self.nc):
            for b in range(a + 1, self.nc):
                seen = set(); mine = []
                for s in self.V:
                    if s in seen or c[s] not in (a, b): continue
                    comp = {s}; st = [s]; seen.add(s)
                    while st:
                        u = st.pop()
                        for w in adj[u]:
                            if w != h and w not in comp and c[w] in (a, b): comp.add(w); seen.add(w); st.append(w)
                    mine.append(comp)
                for comp in mine:
                    res.append({'pair': (a, b), 'set': comp, 'web': len(mine) == 1, 'rim': comp & self.rimset})
        return res

    @staticmethod
    def flip(c, K):
        a, b = K['pair']; d = list(c)
        for u in K['set']: d[u] = b if c[u] == a else a
        return d

    def rimcount(self, c):
        return len({c[x] for x in self.link})

    def _moves(self):
        """moves[k] = list of (target state, chain size, rim tiles touched, pair); N[k] = number of chains"""
        self.moves, self.N = [], []
        self.filled = [self.rimcount(c) <= self.goal for c in self.states]
        for c in self.states:
            ch = self.chains(c); self.N.append(len(ch)); mv = []
            for K in ch:
                if K['web']: continue
                mv.append((self.index[self.canon(self.flip(c, K))], len(K['set']), len(K['rim']), K['pair']))
            self.moves.append(mv)

    def _dist(self):
        INF = -1
        self.dF = [0 if f else INF for f in self.filled]
        q = collections.deque(k for k in range(self.S) if self.filled[k])
        while q:
            k = q.popleft()
            for m in self.moves[k]:
                t = m[0]
                if self.dF[t] == INF: self.dF[t] = self.dF[k] + 1; q.append(t)
        # Kempe classes
        self.cls = [-1] * self.S; self.classes = []
        for s in range(self.S):
            if self.cls[s] >= 0: continue
            cid = len(self.classes); self.cls[s] = cid; mem = [s]; q = [s]
            while q:
                k = q.pop()
                for m in self.moves[k]:
                    if self.cls[m[0]] < 0: self.cls[m[0]] = cid; mem.append(m[0]); q.append(m[0])
            self.classes.append(mem)

    # ------------------------------------------------------------------- the research setting: 4 elements, rim of 5
    def frame(self, c):
        """(x0..x4, alpha, beta, gamma, delta) of an unfilled state: the rim reads alpha beta alpha gamma delta"""
        L = self.link; col = [c[x] for x in L]
        for t in range(5):
            if col[t] == col[(t + 2) % 5]:
                x = [L[(t + i) % 5] for i in range(5)]
                return x, col[t], col[(t + 1) % 5], col[(t + 3) % 5], col[(t + 4) % 5]
        return None

    def chain_at(self, c, u, b):
        """vertex set of the {c[u], b} chain through u"""
        a = c[u]; comp = {u}; st = [u]
        while st:
            v = st.pop()
            for w in self.adj[v]:
                if w != self.hole and w not in comp and c[w] in (a, b): comp.add(w); st.append(w)
        return comp

    def _frames(self):
        S = self.S
        self.L1 = [False] * S; self.L2 = [False] * S; self.dl = [False] * S; self.pi = [None] * S
        for k, c in enumerate(self.states):
            if self.filled[k]: continue
            x, al, be, ga, de = self.frame(c)
            l1 = x[3] in self.chain_at(c, x[1], ga)
            l2 = x[4] in self.chain_at(c, x[1], de)
            self.L1[k], self.L2[k] = l1, l2
            if l1 and l2:
                self.dl[k] = True
                K = {'pair': (al, ga), 'set': self.chain_at(c, x[2], ga)}
                self.pi[k] = self.index[self.canon(self.flip(c, K))]

    def locks(self, k):
        return int(self.L1[k]) + int(self.L2[k])

    def pi_cycles(self):
        """closed π-orbits made only of doubly locked states (the 'loops' of level 7)"""
        out, seen = [], set()
        for s in range(self.S):
            if not self.dl[s] or s in seen: continue
            path, pos, k = [], {}, s
            while k is not None and self.dl[k] and k not in pos and k not in seen:
                pos[k] = len(path); path.append(k); k = self.pi[k]
            seen.update(path)
            if k is not None and k in pos: out.append(path[pos[k]:])
        return out

    def best_moves(self, k):
        """the moves that bring dF down by one"""
        d = self.dF[k]
        return [m for m in self.moves[k] if d > 0 and self.dF[m[0]] == d - 1]

    def quiet_only(self, k):
        """every quickest first move is a quiet chain (touches no rim tile)"""
        b = self.best_moves(k)
        return bool(b) and all(m[2] == 0 for m in b)

    def pi_rule(self, k, cap=500):
        """swaps used by the no-lookahead rule 'if a lock is open take Kempe's step, else swap π'; None if it loops"""
        steps, seen = 0, set()
        while not self.filled[k]:
            if k in seen or steps > cap: return None
            seen.add(k)
            if self.dl[k]: k = self.pi[k]
            else:
                # Kempe's step: one swap fills (it exists when a lock is open)
                k = next(m[0] for m in self.moves[k] if self.filled[m[0]])
            steps += 1
        return steps

    # ------------------------------------------------------------------------------------- difficulty (heuristic)
    def difficulty(self, k):
        """a single number for level ordering: par first, then how misleading the start is.
        par (dF) dominates; traps = fraction of first moves that do not bring dF down; doubly locked and a
        π-rule that loops or overshoots make it harder; many winning first moves make it easier."""
        d = self.dF[k]
        if d <= 0: return 0.0
        mv = self.moves[k]; good = len(self.best_moves(k))
        trap = 1 - good / max(1, len(mv))
        extra = 0.0
        if self.nc == 4 and len(self.link) == 5:
            pr = self.pi_rule(k)
            extra += 0.4 * self.dl[k] + (0.6 if pr is None else min(0.6, 0.1 * max(0, pr - d)))
            extra += 0.3 * self.quiet_only(k)
        return round(d + trap + extra, 3)
