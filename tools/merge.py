# merge the per-graph opt-*.json files written by opt.js (next to this script) into the BOARD2D constant.
#   python3 merge.py           -> prints the constant's JSON (paste it over `const BOARD2D = /*BOARD2D*/...;` in index.html)
#   python3 merge.py --write   -> patches ../index.html in place
import json, glob, re, os, sys
here = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(here, '..', 'index.html')
m = {}
for f in sorted(glob.glob(os.path.join(here, 'opt-*.json'))): m.update(json.load(open(f)))
for k in m:
  for b in m[k]: m[k][b].pop('ap', None)
js = json.dumps(m, separators=(',', ':'))
if '--write' in sys.argv:
  s = open(p).read()
  s = re.sub(r'const BOARD2D = /\*BOARD2D\*/.*?;\n', lambda _: 'const BOARD2D = /*BOARD2D*/' + js + ';\n', s, count=1, flags=re.S)
  open(p, 'w').write(s); print(len(js))
else:
  print(js)
