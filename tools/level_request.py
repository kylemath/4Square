# Checks a level request (a new graph plus the levels to play on it) and, with --apply, adds it to the game.
#
#     python3 tools/level_request.py REQUEST.json            dry run: validate against the real engine, print the response
#     python3 tools/level_request.py REQUEST.json --json     the same response as JSON (for the session that sent it)
#     python3 tools/level_request.py REQUEST.json --apply    also write maps/<key>.json and insert the levels into levels.json
#
# The request format, the checks and what to do after --apply are in LEVEL-REQUEST.md. Nothing is written unless every
# check passes. Warnings do not block; errors do.
import os, sys, json, re, shutil, tempfile, argparse

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)
import build_game as BG  # noqa: E402
from mapio import load_map  # noqa: E402

FORMAT = '4square-level/1'
ID_RE = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')
KEY_RE = re.compile(r'^[a-z0-9_]{1,24}$')
GRAPH_FORMS = ('faces', 'rot', 'ascii', 'edges')
MAP_FIELDS = {'key', 'name', 'source', 'hole', 'world', 'faces', 'rot', 'ascii', 'edges', 'pos', 'onboard', 'ncol', 'goal',
              'layoutSeed', 'drawSeed', 'note'}
LEVEL_FIELDS = {'id', 'place', 'num', 'map', 'kicker', 'title', 'tools', 'intro', 'pick', 'expect'}
PICK_FIELDS = {'start', 'dF', 'dl', 'locks', 'N', 'onLoop', 'exits', 'deepest', 'piRule', 'prefer'}
EXPECT_FIELDS = {'par', 'onLoop', 'loopLength', 'loops', 'N', 'unique', 'deepest', 'piRunN'}
THEMES = {'cove', 'beach', 'town', 'harbour', 'forest', 'cape', 'cave', 'volcano', 'reef'}
TOOLS = {'locks', 'pi'}
TITLE_MAX, INTRO_MAX = 32, 420


class Report:
    def __init__(self): self.errors, self.warnings, self.levels, self.map = [], [], [], None
    def err(self, m): self.errors.append(m)
    def warn(self, m): self.warnings.append(m)


def same_graph(a, b):
    """two map specs describe the same game board (same rotation system, hole, colours and goal)"""
    try:
        return load_map(a)[0] == load_map(b)[0] and a['hole'] == b['hole'] and a.get('ncol', 4) == b.get('ncol', 4) and a.get('goal') == b.get('goal')
    except Exception:
        return False


def check_map(req, R, spec):
    m = req.get('map')
    if m is None: return None                                   # levels on maps already in the game
    if not isinstance(m, dict): R.err('map: must be an object'); return None
    for f in sorted(set(m) - MAP_FIELDS): R.err('map.%s: unknown field' % f)
    key = m.get('key')
    if not isinstance(key, str) or not KEY_RE.match(key): R.err('map.key: 1-24 chars of a-z, 0-9, _'); return None
    for f in ('name', 'source'):
        if not isinstance(m.get(f), str) or not m[f].strip(): R.err('map.%s: required (a short name; where the graph came from)' % f)
    forms = [f for f in GRAPH_FORMS if f in m]
    if len(forms) != 1: R.err('map: give exactly one graph form of %s (got %s)' % ('/'.join(GRAPH_FORMS), forms or 'none'))
    if 'edges' in m and not m.get('onboard'): R.err('map.edges: hand-drawn ponds need "onboard": true and "pos"; game maps are triangulations')
    if m.get('onboard') and 'pos' not in m: R.err('map.pos: required for an onboard pond')
    if not isinstance(m.get('hole'), int): R.err('map.hole: the uncoloured region, an integer index')
    if R.errors: return None
    out = {k: v for k, v in m.items() if k != 'key'}
    path = os.path.join(BG.MAPS, key + '.json')
    if os.path.exists(path):
        old = json.load(open(path))
        if same_graph(old, out): R.warn('map %s is already in maps/ with this graph; it is reused, not rewritten' % key); return key, None
        R.err('map.key %s is taken by a different graph; choose another key' % key); return None
    for f in sorted(os.listdir(BG.MAPS)):
        if f.endswith('.json') and same_graph(json.load(open(os.path.join(BG.MAPS, f))), out):
            R.warn('this graph and hole are already in the game as maps/%s; consider "map": "%s" on the levels instead' % (f, f[:-5]))
    return key, out


def fmt_level(L):
    order = ['id', 'num', 'map', 'kicker', 'title', 'tools', 'intro', 'pick', 'expect']
    return '{' + ', '.join('"%s": %s' % (k, json.dumps(L[k], ensure_ascii=False, separators=(',', ':'))) for k in order if k in L) + '}'


def fmt_map(m):
    return '{\n' + ',\n'.join('  "%s": %s' % (k, json.dumps(v, ensure_ascii=False, separators=(',', ':'))) for k, v in m.items()) + '\n}\n'


def check(req):
    R = Report()
    spec = json.load(open(os.path.join(ROOT, 'levels.json')))
    if req.get('request') != FORMAT: R.err('request: must be "%s"' % FORMAT)
    if not isinstance(req.get('from'), str) or not req['from'].strip(): R.err('from: required (who or what produced this request)')
    for f in sorted(set(req) - {'request', 'from', 'why', 'map', 'levels', 'islands'}): R.err('%s: unknown top-level field' % f)
    got = check_map(req, R, spec)
    new_key, new_map = got if got else (None, None)
    R.map = new_key
    islands = dict(spec['islands'])
    for k, v in (req.get('islands') or {}).items():
        if k in islands: R.err('islands.%s: already exists; just use it as a kicker' % k); continue
        if not (isinstance(v, list) and len(v) == 3 and all(isinstance(x, str) for x in v)): R.err('islands.%s: [name, theme, emoji]' % k); continue
        if v[1] not in THEMES: R.err('islands.%s: theme %r is not one of %s' % (k, v[1], ' '.join(sorted(THEMES))))
        islands[k] = v
    levels = req.get('levels')
    if not isinstance(levels, list) or not levels: R.err('levels: a non-empty list'); levels = []
    ids = [L['id'] for L in spec['levels']]; seen = set()
    for i, L in enumerate(levels):
        tag = 'levels[%d]' % i
        if not isinstance(L, dict): R.err(tag + ': must be an object'); continue
        lid = L.get('id'); tag = 'level %s' % lid if isinstance(lid, str) else tag
        for f in sorted(set(L) - LEVEL_FIELDS): R.err('%s: unknown field %s' % (tag, f))
        if not isinstance(lid, str) or not ID_RE.match(lid): R.err(tag + ': id must be kebab-case a-z0-9'); continue
        if lid in ids or lid in spec['legacy'] or lid in seen: R.err(tag + ': id is already used (ids are permanent)')
        seen.add(lid)
        L.setdefault('map', new_key)
        if L['map'] is None:
            if 'map' not in req: R.err(tag + ': map: name a map in maps/ or send one in "map"')
        elif L['map'] != new_key and not os.path.exists(os.path.join(BG.MAPS, '%s.json' % L['map'])): R.err('%s: map %s is not in maps/' % (tag, L['map']))
        for f in ('num', 'kicker', 'title', 'intro'):
            if not isinstance(L.get(f), str) or not L[f].strip(): R.err('%s: %s is required' % (tag, f))
        if len(L.get('title', '')) > TITLE_MAX: R.warn('%s: title is over %d characters' % (tag, TITLE_MAX))
        if len(L.get('intro', '')) > INTRO_MAX: R.warn('%s: intro is over %d characters (it has to fit a phone card)' % (tag, INTRO_MAX))
        if L.get('kicker') and L['kicker'] not in islands: R.err('%s: kicker %r is not an island; add it under "islands"' % (tag, L['kicker']))
        if not isinstance(L.get('tools'), list) or set(L['tools']) - TOOLS: R.err('%s: tools must be a list of %s' % (tag, sorted(TOOLS)))
        pl = L.get('place')
        if pl != 'end' and not (isinstance(pl, dict) and len(pl) == 1 and list(pl)[0] in ('after', 'before')):
            R.err(tag + ': place must be "end", {"after": id} or {"before": id}')
        elif isinstance(pl, dict) and list(pl.values())[0] not in ids + [x.get('id') for x in levels[:i]]:
            R.err('%s: place refers to unknown level %s' % (tag, list(pl.values())[0]))
        p, ex = L.get('pick'), L.get('expect')
        if not isinstance(p, dict) or not p: R.err(tag + ': pick is required'); continue
        for f in sorted(set(p) - PICK_FIELDS): R.err('%s: pick.%s is not a pick field' % (tag, f))
        if not isinstance(ex, dict) or 'par' not in ex: R.err(tag + ': expect must at least give "par"'); continue
        for f in sorted(set(ex) - EXPECT_FIELDS): R.err('%s: expect.%s is not an expect field' % (tag, f))
    if R.errors: return R, spec, levels, new_key, new_map, islands
    # ---- where the levels land: the level map draws one island per run of equal kickers, so keep each island in one run
    order = place_all([(L['id'], L['kicker']) for L in spec['levels']], levels)
    runs = [order[0][1]] + [b[1] for a, b in zip(order, order[1:]) if a[1] != b[1]]
    for k in sorted({k for k in runs if runs.count(k) > 1}): R.warn('island %r would be split into %d parts on the level map' % (k, runs.count(k)))
    # ---- the maths: build each board with the real engine and resolve every pick
    tmp = tempfile.mkdtemp(); old_maps = BG.MAPS
    try:
        for f in os.listdir(old_maps): os.symlink(os.path.join(old_maps, f), os.path.join(tmp, f))
        if new_map is not None: json.dump(new_map, open(os.path.join(tmp, new_key + '.json'), 'w'))
        BG.MAPS = tmp; boards = {}
        for L in levels:
            key = L['map']
            try:
                b = boards.get(key) or boards.setdefault(key, BG.Board(key))
            except AssertionError as e: R.err('map %s: %s' % (key, e)); continue
            except Exception as e: R.err('map %s: cannot be read (%s: %s)' % (key, type(e).__name__, e)); continue
            if key == new_key and R.map and not isinstance(R.map, dict):
                H = b.H
                R.map = {'key': key, 'regions': b.n, 'hole': b.h, 'holeDegree': len(b.rot[b.h]), 'colourings': H.S,
                         'kempeClasses': len(H.classes), 'fillable': sum(H.filled), 'deepestPar': max(H.dF),
                         'doublyLocked': sum(b.dl), 'piLoops': [len(c) for c in b.loops]}
                if not b.onboard and len(b.rot[b.h]) != 5: R.warn('map %s: hole has degree %d; the game is tuned for 5' % (key, len(b.rot[b.h])))
                if H.S > 50000: R.warn('map %s: %d colourings; the build and the page get slow above ~50k' % (key, H.S))
            try:
                k = b.pick(L['pick']); BG.check_expect(b, k, L)
            except AssertionError as e: R.err('level %s: %s' % (L['id'], e)); continue
            st = b.stats(k)
            R.levels.append({'id': L['id'], 'map': key, 'par': st['dF'], 'difficulty': round(st['difficulty'], 2), 'N': st['N'],
                             'start': [-1 if u == b.h else x for u, x in enumerate(b.colouring(k))],
                             'tags': [t for t in ('dl', 'onLoop', 'quietOnly', 'loudOnly', 'piOnly') if st.get(t)]})
            if 'pi' not in L['tools'] and st.get('onLoop'): R.warn('level %s: starts on a π loop but tools has no "pi"' % L['id'])
    finally:
        BG.MAPS = old_maps; shutil.rmtree(tmp, ignore_errors=True)
    return R, spec, levels, new_key, new_map, islands


def place_all(order, levels):
    """order: [(id, ...)] in play order; returns it with each new level inserted where its "place" says"""
    order = list(order)
    for L in levels:
        pl = L['place']; ids = [o[0] for o in order]
        at = len(order) if pl == 'end' else ids.index(pl.get('after') or pl.get('before')) + (1 if 'after' in pl else 0)
        order.insert(at, (L['id'], L['kicker'], L))
    return order


def apply(req, spec, levels, new_key, new_map, islands):
    path = os.path.join(ROOT, 'levels.json'); lines = open(path, encoding='utf8').read().split('\n')
    start = lines.index('  "levels": ['); end = lines.index('  ]', start)
    rows = {json.loads(r.rstrip(','))['id']: r.rstrip(',') for r in lines[start + 1:end]}
    order = [o[0] for o in place_all([(i,) for i in rows], levels)]
    rows.update({L['id']: '    ' + fmt_level(L) for L in levels})
    rows = [rows[i] + (',' if n < len(order) - 1 else '') for n, i in enumerate(order)]
    lines[start + 1:end] = rows
    if islands != spec['islands']:
        i = next(j for j, s in enumerate(lines) if s.startswith('  "islands": '))
        lines[i] = '  "islands": ' + json.dumps(islands, ensure_ascii=False) + ','
    text = '\n'.join(lines); after = json.loads(text)
    assert [x['id'] for x in after['levels']] == order and after['legacy'] == spec['legacy'], 'levels.json would not round-trip'
    if new_map is not None: open(os.path.join(BG.MAPS, new_key + '.json'), 'w').write(fmt_map(new_map))
    open(path, 'w', encoding='utf8').write(text)
    return order


def main():
    ap = argparse.ArgumentParser(description='Check (and with --apply, add) a 4square level request; see LEVEL-REQUEST.md')
    ap.add_argument('request'); ap.add_argument('--apply', action='store_true'); ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    try: req = json.load(open(a.request, encoding='utf8'))
    except Exception as e: print('request is not valid JSON: %s' % e); sys.exit(2)
    R, spec, levels, new_key, new_map, islands = check(req)
    ok = not R.errors
    res = {'response': FORMAT, 'status': 'accepted' if ok else 'rejected', 'errors': R.errors, 'warnings': R.warnings,
           'map': R.map if isinstance(R.map, dict) else None, 'levels': R.levels}
    if ok and a.apply:
        order = apply(req, spec, levels, new_key, new_map, islands)
        res['applied'] = {'map': None if new_map is None else 'maps/%s.json' % new_key, 'levelCount': len(order),
                          'positions': {L['id']: order.index(L['id']) + 1 for L in levels}}
    if a.json: print(json.dumps(res, ensure_ascii=False, indent=1))
    else:
        print('%s: %s' % (a.request, res['status'].upper()))
        for e in R.errors: print('  error   ' + e)
        for w in R.warnings: print('  warning ' + w)
        if res['map']: print('  map     ' + ', '.join('%s %s' % kv for kv in res['map'].items()))
        for L in R.levels: print('  level   %(id)s on %(map)s: par %(par)d, difficulty %(difficulty)s, N %(N)d %(tags)s' % L)
        if 'applied' in res:
            print('  applied %s; %d levels now; positions %s' % (res['applied']['map'] or 'no new map', res['applied']['levelCount'], res['applied']['positions']))
            print('  next    python3 build_game.py, then the follow-ups in LEVEL-REQUEST.md')
        elif ok: print('  dry run: nothing written (add --apply)')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
