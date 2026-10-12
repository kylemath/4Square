// Bulk-verify exported run proofs for the owner:  node docs/game/tools/verify_runs.js runs.json [--json]
// runs.json: a JSON array of run docs, or an object { docId: runDoc } (a Firestore export of the `runs` collection,
// e.g. from the console, `gcloud firestore export`, or a script using the Admin SDK), or newline-delimited JSON.
// Prints one line per run: ok / HIDDEN + reasons, and flags proofs reused by another uid.
const fs = require('fs'), path = require('path');
const V = require('../verify.js'), env = V.nodeEnv(path.join(__dirname, '..'));
const file = process.argv[2]; if (!file) { console.error('usage: node verify_runs.js runs.json [--json]'); process.exit(2); }
const txt = fs.readFileSync(file, 'utf8'); let docs;
try { const j = JSON.parse(txt); docs = Array.isArray(j) ? j.map((d, i) => [d.id || i, d]) : Object.entries(j); }
catch (e) { docs = txt.split('\n').filter(Boolean).map((l, i) => [i, JSON.parse(l)]); }
const owner = new Map(), out = []; let bad = 0;
docs.slice().sort((a, b) => (a[1].t0 || 0) - (b[1].t0 || 0)).forEach(([id, d]) => { if (d.fp && !owner.has(d.fp)) owner.set(d.fp, d.uid); });
for (const [id, d] of docs) {
  const r = V.verifyProof(d, env), why = r.hard.slice();
  if (d.fp && owner.get(d.fp) !== d.uid) why.push('copied-from-other-uid');
  if (/^(.+)_(.+)_(.+)$/.test(String(id)) && d.uid && String(id) !== d.uid + '_' + d.lvl + '_' + d.skin) why.push('doc-id-mismatch');
  const sig = (d.int || []).map(x => x[0] + 'x' + x[1]).join(',');
  if (why.length) bad++;
  out.push({ id, uid: d.uid, lvl: d.lvl, skin: d.skin, ok: !why.length, stars: r.stars, moves: r.moves, why, soft: r.soft, signals: sig });
}
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
else {
  out.forEach(o => console.log((o.ok ? 'ok     ' : 'HIDDEN ') + String(o.id).padEnd(34) + ' ' + o.stars + '*' + (o.why.length ? '  ' + o.why.join(',') : '') + (o.soft.length ? '  soft:' + o.soft.join(',') : '') + (o.signals ? '  signals:' + o.signals : '')));
  console.log('\n' + out.length + ' runs, ' + bad + ' hidden');
}
process.exit(bad ? 1 : 0);
