# The reference answers for tools/star_rules_check.js: for every level, its start's Kempe class from kempe_engine.HoleGame
# with each state's canon key and swap distance to a fill (dF), as JSON on stdout.   python3 tools/star_dump.py [level id ...]
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
from kempe_engine import HoleGame  # noqa: E402


def ld(p): s = open(p).read(); return json.loads(s[s.index('{'):s.rindex('}') + 1])


D = ld(os.path.join(HERE, '..', 'levels.js'))
want = set(sys.argv[1:])
out, games = {}, {}
for L in D['levels']:
    if want and L['id'] not in want: continue
    key = L['g']; g = D['graphs'][key]
    if key not in games:
        adj = [[] for _ in range(g['n'])]
        for a, b in g['edges']: adj[a].append(b); adj[b].append(a)
        games[key] = HoleGame(g['n'], adj, g['hole'], g['link'], ncol=g.get('ncol', 4), goal=g.get('goal'))
    H = games[key]; s = H.index[H.canon(L['start'])]; mem = H.classes[H.cls[s]]
    out[L['id']] = {'start': H.keys[s], 'dF': H.dF[s], 'cls': {H.keys[k]: H.dF[k] for k in mem}}
json.dump(out, sys.stdout, separators=(',', ':'))
