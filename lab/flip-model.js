/* lab/flip-model.js: signed diagonal flips between two triangulations of an n-gon (the maths behind lab/flip.html and
 * lab/flip-env.js). Plain JS, no dependencies: window.FTH_FLIP in a page, module.exports in Node (or a vm context).
 * Design note and verification: lab/FLIP-DESIGN.md, node tools/flip_check.js.
 *
 * The objects (Eliahou 1999, Kryuchkov 1992, Gravier-Payan 2002, as stated by Carpentier, arXiv:0906.5319):
 *   - polygon vertices 0..n-1 in counterclockwise order; a diagonal (i, j), i < j, not a side, is the code i*n + j;
 *   - a triangulation T is the sorted array of its n-3 diagonal codes; it has n-2 triangles (a < b < c, code a*n*n+b*n+c);
 *   - a SIGNED triangulation gives every TRIANGLE a sign, + or - (signs live on triangles, not on diagonals);
 *   - a SIGNED FLIP: a diagonal ac whose two triangles abc, acd have the SAME sign s may be flipped to bd; the two new
 *     triangles abd, bcd both get the sign -s; every other triangle keeps its sign. Flipping bd back is again signed;
 *   - Conjecture (Eliahou, Kryuchkov), equivalent to the Four Colour Theorem (Gravier-Payan): for any two triangulations
 *     T, T' of the same polygon there are signs for them such that a sequence of signed flips turns one into the other.
 * Why it is the 4CT: colour the vertices with F4 = {0, 1, w, w^2} (0..3 here, + is xor). Colour each edge by the sum of
 * its ends; a proper colouring makes every triangle's edges 1, w, w^2 in some order, and the triangle's sign is + when
 * they run 1 -> w -> w^2 counterclockwise. Signings of T <-> proper 4-colourings of T up to the 12 affine maps x -> ax+b
 * (normalised here to col[0] = 0, col[1] = 1); equal signs on abc, acd <=> col(b) != col(d); a signed flip keeps the
 * colouring. So a signed path T -> T' is a 4-colouring of the sphere made by gluing T inside and T' outside the n-cycle.
 * tools/flip_check.js checks all of this exhaustively for small n, against direct vertex 4-colourings and Tait
 * (rainbow-face 3-edge) colourings of the glued map.
 *
 *   const F = FTH_FLIP;
 *   F.fan(n), F.randomTriangulation(n, R), F.enumerate(n)  triangulations ({list, index: Map key -> i, nbr} for all of them)
 *   F.triangles(n, T), F.apexes(n, T, code), F.flipDiag(n, T, code)  geometry of an unsigned flip
 *   F.state(n, T, s), F.legal(st, code), F.flip(st, code)   signed states {n, T, s: {triCode: +1 | -1}}; legal -> {ok, why}
 *   F.signsFromColouring(n, T, col), F.colouringFromSigns(n, T, s), F.canon(col), F.triSign(col, a, b, c)
 *   F.goal(st, T2), F.solve(st, T2), F.bfs(st), F.rotationDistance(n, T1, T2), F.solveFree(n, T1, T2)
 *   F.generate(n, seed, {len, detour, free}) -> a puzzle {n, T, s, target, par, rot, detour, free, ...}
 *   F.rng(seed)   mulberry32 with .int(k), the same generator as lab/arena/engine.js
 */
(function (root) {
  'use strict';
  // ---------------------------------------------------------------- small things
  function rng(seed) {   // mulberry32
    let a = (seed >>> 0) || 1;
    const R = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    R.int = k => Math.floor(R() * k);
    return R;
  }
  const CAT = [1]; for (let i = 1; i < 30; i++) CAT[i] = CAT[i - 1] * 2 * (2 * i - 1) / (i + 1);
  const diag = (n, i, j) => i < j ? i * n + j : j * n + i;
  const ends = (n, d) => [Math.floor(d / n), d % n];
  const isSide = (n, i, j) => { if (i > j) { const t = i; i = j; j = t; } return j - i === 1 || (i === 0 && j === n - 1); };
  const isDiag = (n, i, j) => i !== j && !isSide(n, i, j);
  const triCode = (n, a, b, c) => { let t; if (a > b) { t = a; a = b; b = t; } if (b > c) { t = b; b = c; c = t; } if (a > b) { t = a; a = b; b = t; } return (a * n + b) * n + c; };
  const triVerts = (n, t) => [Math.floor(t / (n * n)), Math.floor(t / n) % n, t % n];
  const key = T => T.join(',');
  const same = (A, B) => A.length === B.length && A.every((x, i) => x === B[i]);
  const common = (A, B) => { const S = new Set(B); let k = 0; for (const x of A) if (S.has(x)) k++; return k; };
  function edgeMat(n, T) {   // n*n adjacency of sides + diagonals
    const M = new Uint8Array(n * n);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; M[i * n + j] = M[j * n + i] = 1; }
    for (const d of T) { const i = Math.floor(d / n), j = d % n; M[i * n + j] = M[j * n + i] = 1; }
    return M;
  }
  function fan(n, v) { v = v || 0; const T = []; for (let k = 2; k <= n - 2; k++) T.push(diag(n, v, (v + k) % n)); return T.sort((a, b) => a - b); }
  // every a<b<c with all three edges present is a face (no vertex is inside a polygon triangulation)
  function triangles(n, T) {
    const M = edgeMat(n, T), out = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { if (!M[a * n + b]) continue; for (let c = b + 1; c < n; c++) if (M[b * n + c] && M[a * n + c]) out.push([a, b, c]); }
    return out;
  }
  // the two apexes of diagonal a<c: b strictly between a and c, d on the other arc
  function apexes(n, T, d, M) {
    M = M || edgeMat(n, T);
    const a = Math.floor(d / n), c = d % n; let b = -1, e = -1;
    for (let x = a + 1; x < c; x++) if (M[a * n + x] && M[x * n + c]) { b = x; break; }
    for (let x = (c + 1) % n; x !== a; x = (x + 1) % n) if (M[a * n + x] && M[x * n + c]) { e = x; break; }
    return [b, e];
  }
  // unsigned flip of diagonal d in T -> { T, nd, quad [a, b, c, e] (counterclockwise), rem [t, t], add [t, t] } or null
  function flipDiag(n, T, d, M) {
    if (T.indexOf(d) < 0) return null;
    const a = Math.floor(d / n), c = d % n, [b, e] = apexes(n, T, d, M);
    if (b < 0 || e < 0) return null;
    const nd = diag(n, b, e), T2 = T.filter(x => x !== d); T2.push(nd); T2.sort((x, y) => x - y);
    return { T: T2, nd, quad: [a, b, c, e], rem: [triCode(n, a, b, c), triCode(n, a, c, e)], add: [triCode(n, a, b, e), triCode(n, b, c, e)] };
  }
  // ---------------------------------------------------------------- F4 colourings and triangle signs
  const LOG = [-1, 0, 1, 2], EXP = [1, 2, 3];
  const mul = (x, y) => x && y ? EXP[(LOG[x] + LOG[y]) % 3] : 0;
  const inv = x => EXP[(3 - LOG[x]) % 3];
  // sign of triangle a<b<c (counterclockwise) under colouring col: +1 if its edge colours run 1 -> w -> w^2, -1 the other
  // way round, 0 if an edge is improper
  function triSign(col, a, b, c) {
    const e1 = col[a] ^ col[b], e2 = col[b] ^ col[c], e3 = col[c] ^ col[a];
    if (!e1 || !e2 || !e3) return 0;
    return e2 === e1 % 3 + 1 ? 1 : -1;
  }
  const canon = col => { const t = col[0], m = inv(col[1] ^ t); return col.map(x => mul(m, x ^ t)); };
  function properOn(n, T, col) { const M = edgeMat(n, T); for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (M[i * n + j] && col[i] === col[j]) return false; return true; }
  function signsFromColouring(n, T, col) {
    const s = {};
    for (const [a, b, c] of triangles(n, T)) { const g = triSign(col, a, b, c); if (!g) return null; s[triCode(n, a, b, c)] = g; }
    return s;
  }
  // the colouring (col[0] = 0, col[1] = 1) whose signs are s: colour the triangle on side 01, then walk the dual tree,
  // each new apex taking the one free colour that gives its triangle the right sign
  function colouringFromSigns(n, T, s) {
    const tris = triangles(n, T), col = new Array(n).fill(-1); col[0] = 0; col[1] = 1;
    let left = tris.length;
    const done = new Uint8Array(tris.length);
    for (let pass = 0; left && pass <= tris.length; pass++) {
      tris.forEach((t, k) => {
        if (done[k]) return;
        const un = t.filter(v => col[v] < 0);
        if (un.length > 1) return;
        const want = s[triCode(n, t[0], t[1], t[2])];
        if (un.length === 1) {
          const w = un[0], used = t.filter(v => v !== w).map(v => col[v]);
          for (let x = 0; x < 4; x++) { if (used.indexOf(x) >= 0) continue; col[w] = x; if (triSign(col, t[0], t[1], t[2]) === want) break; col[w] = -1; }
          if (col[w] < 0) return;
        }
        if (triSign(col, t[0], t[1], t[2]) !== want) throw new Error('signs do not match a colouring');
        done[k] = 1; left--;
      });
    }
    return col;
  }
  // ---------------------------------------------------------------- Kauffman's vector cross product form (1990, 2005)
  // The n-1 sides (v, v+1), v = 0..n-2, are factors x_v in {i, j, k} (+-1, +-2, +-3 here; 0 is the zero vector) and T is a
  // bracketing of x_0 x x_1 x ... x x_{n-2} with the side (0, n-1) as the root: the edge (a, b) evaluates to
  // (a, c) x (c, b) for its apex c between a and b. 4CT <=> any two bracketings have an assignment making both equal and
  // non-zero (checked by tools/flip_check.js section K).
  function cross(p, q) {
    if (!p || !q) return 0;
    const a = Math.abs(p) - 1, b = Math.abs(q) - 1; if (a === b) return 0;
    return Math.sign(p) * Math.sign(q) * ((b - a + 3) % 3 === 1 ? 1 : -1) * (4 - a - b);   // i x j = k, j x k = i, k x i = j
  }
  function kauffman(n, T, x, M) {
    M = M || edgeMat(n, T);
    const ev = (a, b) => { if (b === a + 1) return x[a]; for (let c = a + 1; c < b; c++) if (M[a * n + c] && M[c * n + b]) return cross(ev(a, c), ev(c, b)); return 0; };
    return ev(0, n - 1);
  }
  // ---------------------------------------------------------------- signed states
  function state(n, T, s) { return { n, T: T.slice(), s: Object.assign({}, s) }; }
  const stKey = st => key(st.T) + '|' + triangles(st.n, st.T).map(([a, b, c]) => st.s[triCode(st.n, a, b, c)] > 0 ? '+' : '-').join('');
  // is flipping diagonal d a signed flip? {ok, why: 'side' | 'absent' | 'signs', tris [t1, t2], signs [s1, s2], quad}
  function legal(st, d) {
    const n = st.n, [i, j] = ends(n, d);
    if (!isDiag(n, i, j)) return { ok: false, why: 'side' };
    const f = flipDiag(n, st.T, d);
    if (!f) return { ok: false, why: 'absent' };
    const s1 = st.s[f.rem[0]], s2 = st.s[f.rem[1]];
    return { ok: s1 === s2, why: s1 === s2 ? '' : 'signs', tris: f.rem, signs: [s1, s2], quad: f.quad, nd: f.nd, f };
  }
  function flip(st, d) {
    const L = legal(st, d); if (!L.ok) return null;
    const s = Object.assign({}, st.s), g = -L.signs[0];
    delete s[L.f.rem[0]]; delete s[L.f.rem[1]]; s[L.f.add[0]] = g; s[L.f.add[1]] = g;
    return { n: st.n, T: L.f.T, s };
  }
  const goal = (st, T2) => same(st.T, T2);
  // ---------------------------------------------------------------- search
  // BFS over the signed states reachable from st: Map stKey -> {st, d (flips), prev (key), code (diagonal tapped)}
  function bfs(st, opt) {
    opt = opt || {};
    const k0 = stKey(st), seen = new Map([[k0, { st, d: 0, prev: null, code: -1 }]]), Q = [k0];
    for (let h = 0; h < Q.length; h++) {
      const cur = seen.get(Q[h]);
      if (opt.stop && opt.stop(cur.st)) return { seen, hit: Q[h] };
      if (opt.cap && seen.size >= opt.cap) break;
      for (const d of cur.st.T) {
        const nx = flip(cur.st, d); if (!nx) continue;
        const k = stKey(nx); if (seen.has(k)) continue;
        seen.set(k, { st: nx, d: cur.d + 1, prev: Q[h], code: d }); Q.push(k);
      }
    }
    return { seen, hit: null };
  }
  function pathTo(seen, k) { const p = []; for (let e = seen.get(k); e && e.prev != null; e = seen.get(e.prev)) p.push(e.code); return p.reverse(); }
  // an optimal signed-flip sequence (diagonal codes to tap, in order) from st to the triangulation T2, or null
  function solve(st, T2) { const r = bfs(st, { stop: x => same(x.T, T2) }); return r.hit == null ? null : pathTo(r.seen, r.hit); }
  // unsigned flip distance (rotation distance of the binary trees), by BFS
  function rotationDistance(n, T1, T2) {
    const k2 = key(T2), seen = new Map([[key(T1), 0]]), Q = [T1];
    for (let h = 0; h < Q.length; h++) {
      const T = Q[h], d0 = seen.get(key(T)); if (key(T) === k2) return d0;
      const M = edgeMat(n, T);
      for (const d of T) { const f = flipDiag(n, T, d, M), k = key(f.T); if (!seen.has(k)) { seen.set(k, d0 + 1); Q.push(f.T); } }
    }
    return -1;
  }
  function unsignedDistances(n, T1) {
    const seen = new Map([[key(T1), 0]]), Q = [T1];
    for (let h = 0; h < Q.length; h++) {
      const T = Q[h], d0 = seen.get(key(T)), M = edgeMat(n, T);
      for (const d of T) { const f = flipDiag(n, T, d, M), k = key(f.T); if (!seen.has(k)) { seen.set(k, d0 + 1); Q.push(f.T); } }
    }
    return seen;
  }
  // every signing of T (2^(n-2) of them), as sign objects
  function allSignings(n, T) {
    const tris = triangles(n, T).map(([a, b, c]) => triCode(n, a, b, c)), out = [];
    for (let m = 0; m < 1 << tris.length; m++) { const s = {}; tris.forEach((t, i) => { s[t] = m >> i & 1 ? -1 : 1; }); out.push(s); }
    return out;
  }
  // the "exists signs" form: try every signing of T1; -> {best: {s, path} | null, good (signings that reach T2), total}
  function solveFree(n, T1, T2) {
    let best = null, good = 0; const all = allSignings(n, T1), opt = [];
    for (const s of all) {
      if (!properOn(n, T2, colouringFromSigns(n, T1, s))) continue;    // necessary: the colouring must suit T2 too
      const p = solve(state(n, T1, s), T2); if (!p) continue;
      good++; opt.push({ s, path: p });
      if (!best || p.length < best.path.length) best = { s, path: p };
    }
    return { best, good, total: all.length, solutions: opt };
  }
  // ---------------------------------------------------------------- enumeration and random triangulations
  function enumerate(n) {
    const memo = new Map();
    const sub = (i, j) => {   // triangulations of the sub-polygon i..j (base i-j), as arrays of codes
      if (j - i < 2) return [[]];
      const mk = i * n + j; if (memo.has(mk)) return memo.get(mk);
      const out = [];
      for (let k = i + 1; k < j; k++) {
        const L = sub(i, k), Rr = sub(k, j), extra = [];
        if (k - i >= 2) extra.push(diag(n, i, k)); if (j - k >= 2) extra.push(diag(n, k, j));
        for (const a of L) for (const b of Rr) out.push(a.concat(b, extra));
      }
      memo.set(mk, out); return out;
    };
    const list = sub(0, n - 1).map(T => T.slice().sort((a, b) => a - b)), index = new Map(list.map((T, i) => [key(T), i]));
    const nbr = list.map(T => { const M = edgeMat(n, T); return T.map(d => { const f = flipDiag(n, T, d, M); return { code: d, j: index.get(key(f.T)), f }; }); });
    return { n, list, index, nbr };
  }
  // uniform over all Catalan(n-2) triangulations: the apex on base (i, j) is k with weight Cat(k-i-1) Cat(j-k-1)
  function randomTriangulation(n, R) {
    const T = [], stack = [[0, n - 1]];
    while (stack.length) {
      const [i, j] = stack.pop(); if (j - i < 2) continue;
      const m = j - i - 1; let r = R() * CAT[m], k = i + 1;
      for (; k < j; k++) { r -= CAT[k - i - 1] * CAT[j - k - 1]; if (r < 0) break; }
      if (k >= j) k = j - 1;
      if (k - i >= 2) T.push(diag(n, i, k)); if (j - k >= 2) T.push(diag(n, k, j));
      stack.push([i, k], [k, j]);
    }
    return T.sort((a, b) => a - b);
  }
  function randomSigns(n, T, R) { const s = {}; for (const [a, b, c] of triangles(n, T)) s[triCode(n, a, b, c)] = R() < 0.5 ? 1 : -1; return s; }
  // ---------------------------------------------------------------- puzzle generator
  // signed puzzle: a random triangulation and signing; the target is a state of its component at signed distance len
  //   (or the farthest one), preferring a "detour" (signed distance - unsigned distance) of at least opt.detour.
  // free puzzle (opt.free): a target at unsigned distance len; par is the best over every signing of the start, and
  //   pairs where fewer signings work are preferred (the sign choice matters), or a share near opt.share. Deterministic in (n, seed, opt).
  function generate(n, seed, opt) {
    opt = opt || {}; const R = rng(seed * 2654435761 + n * 97 + (opt.len || 0) * 7 + (opt.free ? 13 : 0)), len = opt.len || n - 3, tries = opt.tries || 12;
    let best = null;
    for (let t = 0; t < tries; t++) {
      const T = randomTriangulation(n, R);
      if (opt.free) {
        const U = unsignedDistances(n, T), cand = [];
        for (const [k, d] of U) if (d === len) cand.push(k);
        if (!cand.length) continue;
        const T2 = cand[R.int(cand.length)].split(',').map(Number), F = solveFree(n, T, T2);
        const P = { n, T, s: null, target: T2, par: F.best.path.length, rot: len, detour: F.best.path.length - len, free: true, good: F.good, total: F.total, seed };
        const sc = opt.share != null ? -Math.abs(F.good / F.total - opt.share) : -F.good / F.total + 0.05 * P.detour;
        if (!best || sc > best.sc) best = Object.assign(P, { sc });
        continue;
      }
      const s = randomSigns(n, T, R), B = bfs(state(n, T, s)), U = unsignedDistances(n, T);
      let far = 0; for (const e of B.seen.values()) far = Math.max(far, e.d);
      const want = Math.min(len, far), cand = [];
      for (const e of B.seen.values()) if (e.d === want) cand.push({ e, det: e.d - U.get(key(e.st.T)) });
      const det = opt.detour || 0, ok = cand.filter(c => c.det >= det), pool = ok.length ? ok : cand;
      const mx = Math.max(...pool.map(c => c.det)), pick = ok.length ? ok[R.int(ok.length)] : pool.filter(c => c.det === mx)[0];
      const P = { n, T, s, target: pick.e.st.T, par: want, rot: want - pick.det, detour: pick.det, free: false, component: B.seen.size, seed };
      const sc = (want === len ? 100 : want) + (pick.det >= det ? 10 : pick.det);
      if (!best || sc > best.sc) best = Object.assign(P, { sc });
      if (want === len && pick.det >= det) break;
    }
    if (best) delete best.sc;
    return best;
  }

  // the page's levels: chapters by n, then a free-signs chapter; len = par wanted, detour = forced extra flips wanted
  // (signed distance minus unsigned distance). Checked by tools/flip_check.js section G.
  const LEVELS = [
    { ch: 'Pentagon', n: 5, len: 1, seed: 1, name: 'First flip' }, { ch: 'Pentagon', n: 5, len: 2, seed: 2, name: 'Two in a row' },
    { ch: 'Hexagon', n: 6, len: 2, seed: 3, name: 'Six corners' }, { ch: 'Hexagon', n: 6, len: 3, seed: 4, name: 'Turn it round' }, { ch: 'Hexagon', n: 6, len: 4, seed: 5, name: 'All the way round' },
    { ch: 'Heptagon', n: 7, len: 3, seed: 6, name: 'Seven' }, { ch: 'Heptagon', n: 7, len: 4, seed: 7, name: 'Corner to corner' }, { ch: 'Heptagon', n: 7, len: 5, seed: 8, detour: 1, name: 'Fan out' },
    { ch: 'Octagon', n: 8, len: 4, seed: 9, name: 'Eight' }, { ch: 'Octagon', n: 8, len: 5, seed: 10, name: 'Sign post' }, { ch: 'Octagon', n: 8, len: 6, seed: 11, detour: 2, name: 'Around the block' }, { ch: 'Octagon', n: 8, len: 7, seed: 12, detour: 2, name: 'Full turn' },
    { ch: 'Nonagon', n: 9, len: 6, seed: 13, detour: 1, name: 'Nine' }, { ch: 'Nonagon', n: 9, len: 7, seed: 14, detour: 2, name: 'Switchback' }, { ch: 'Nonagon', n: 9, len: 8, seed: 15, detour: 2, name: 'Long shadow' }, { ch: 'Nonagon', n: 9, len: 9, seed: 16, detour: 3, name: 'Far side' },
    { ch: 'Free signs', n: 6, len: 2, seed: 17, free: true, share: 0.25, name: 'Pick your signs' }, { ch: 'Free signs', n: 7, len: 3, seed: 18, free: true, share: 0.12, name: 'Choose wisely' }, { ch: 'Free signs', n: 8, len: 4, seed: 19, free: true, name: 'Colour hidden' }, { ch: 'Free signs', n: 9, len: 5, seed: 20, free: true, name: 'Few ways through' },
    { ch: 'Decagon', n: 10, len: 8, seed: 21, detour: 2, name: 'Ten' }, { ch: 'Decagon', n: 10, len: 10, seed: 22, detour: 3, name: 'Deep water' }, { ch: 'Decagon', n: 10, len: 12, seed: 23, detour: 3, name: 'Long haul' },
    { ch: 'Beyond', n: 11, len: 12, seed: 24, detour: 3, name: 'Eleven' }, { ch: 'Beyond', n: 12, len: 14, seed: 25, detour: 3, name: 'Twelve' },
  ];

  const FTH_FLIP = { LEVELS, rng, CAT, diag, ends, isSide, isDiag, triCode, triVerts, key, same, common, edgeMat, fan, triangles, apexes, flipDiag,
    mul, inv, triSign, canon, properOn, signsFromColouring, colouringFromSigns, state, stKey, legal, flip, goal, bfs, pathTo, solve,
    rotationDistance, unsignedDistances, allSignings, cross, kauffman, solveFree, enumerate, randomTriangulation, randomSigns, generate };
  if (typeof module !== 'undefined' && module.exports) module.exports = FTH_FLIP;
  root.FTH_FLIP = FTH_FLIP;
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
