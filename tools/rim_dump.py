# The reference answers for tools/rim_check.js: every state of every level's map, from kempe_engine.HoleGame (the
# frame, the two locks, π), as JSON on stdout.   python3 docs/game/tools/rim_dump.py [map ...]
# Per map: n, hole, link, ncol and, when it is the research setting (4 elements, rim of 5), the states (one string
# each, 'h' for the hole), their frame offset t (-1 when filled), locks L1 L2, π's target (state index or -1), the
# Kempe class of each level's start (state indices) and the closed π loops (HoleGame.pi_cycles).
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
from kempe_engine import HoleGame  # noqa: E402


def ld(p): s = open(p).read(); return json.loads(s[s.index('{'):s.rindex('}') + 1])


D = ld(os.path.join(HERE, '..', 'levels.js'))
want = set(sys.argv[1:])
out = {}
for key, g in D['graphs'].items():
    if want and key not in want: continue
    lv = [L for L in D['levels'] if L['g'] == key]
    if not lv: continue
    n, h, link, nc = g['n'], g['hole'], g['link'], g.get('ncol', 4)
    adj = [[] for _ in range(n)]
    for a, b in g['edges']: adj[a].append(b); adj[b].append(a)
    m = {'n': n, 'hole': h, 'link': link, 'ncol': nc, 'levels': [L['id'] for L in lv]}
    if nc == 4 and len(link) == 5:
        H = HoleGame(n, adj, h, link, ncol=nc, goal=g.get('goal'))
        enc = lambda c: ''.join('h' if x < 0 else str(x) for x in c)
        m['states'] = [enc(c) for c in H.states]
        m['t'] = [-1 if H.filled[k] else link.index(H.frame(c)[0][0]) for k, c in enumerate(H.states)]
        m['L1'] = [int(x) for x in H.L1]; m['L2'] = [int(x) for x in H.L2]
        m['pi'] = [-1 if p is None else p for p in H.pi]
        m['filled'] = [int(x) for x in H.filled]
        m['start'] = {L['id']: H.index[H.canon(L['start'])] for L in lv}
        m['cls'] = {L['id']: H.classes[H.cls[H.index[H.canon(L['start'])]]] for L in lv}
        m['loops'] = H.pi_cycles()
    out[key] = m
json.dump(out, sys.stdout, separators=(',', ':'))
