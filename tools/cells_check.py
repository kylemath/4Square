# Do the region shapes (layout.js cells, drawn by Line Doodle and the map skins) represent the graph exactly?
# Two regions should share a border segment exactly when the graph has that edge. Segments are matched the way
# lab/doodle.html matches them (corner coordinates rounded to 5 decimals).
#   python3 docs/game/tools/cells_check.py
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
def ld(p): s = open(p).read(); return json.loads(s[s.index('{'):s.rindex('}') + 1])
D = ld(os.path.join(HERE, '..', 'levels.js')); LAY = ld(os.path.join(HERE, '..', 'layout.js'))
def adjacency(cells):
    key = lambda p: '%.5f,%.5f' % ((p[0] + 1) / 2, (p[1] + 1) / 2)
    own = {}
    for i, c in enumerate(cells):
        for j in range(len(c)):
            a, b = key(c[j]), key(c[(j + 1) % len(c)])
            if a == b: continue
            own.setdefault(tuple(sorted((a, b))), set()).add(i)
    return {tuple(sorted(s)) for s in own.values() if len(s) == 2}, [s for s in own.values() if len(s) > 2]
bad = 0
for k, g in D['graphs'].items():
    cells = LAY.get(k, {}).get('cells')
    if not cells: print('%-8s no region shapes (Line Doodle cannot draw it)' % k); continue
    E = {tuple(sorted(e)) for e in g['edges']}; A, multi = adjacency(cells)
    miss, extra = E - A, A - E
    ok = not miss and not extra and not multi
    bad += not ok
    print('%-8s %s  edges %d  shared borders %d%s%s%s' % (k, 'exact' if ok else 'MISMATCH', len(E), len(A),
          '  missing %s' % sorted(miss)[:6] if miss else '', '  extra %s' % sorted(extra)[:6] if extra else '', '  3-way %d' % len(multi) if multi else ''))
sys.exit(1 if bad else 0)
