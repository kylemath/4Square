# Accounts, per-skin leaderboards and integrity

Files: `account-config.js` (your Firebase web config, `null` by default), `account.js` (identity + board data, Local and
Firebase adapters), `leaderboard.js` (the screen), `verify.js` (replay verifier, browser and node), `integrity.js` (run
recorder + on-device integrity log), `firestore.rules`, `firestore.indexes.json`, `tools/verify_runs.js` (bulk check),
`tools/test_accounts.js` (end-to-end test incl. every cheating route). Nothing here loads until it is needed:
`verify.js` and `integrity.js` are small and load with the page; the other three load the first time the trophy button
(title screen or level map) is tapped, or after a win when the player has submission switched on.

## What works with no setup (LOCAL mode)

`window.FTH_FIREBASE = null`: the player gets a random id kept in `localStorage` (recurring: same player on every visit),
a nickname, and a leaderboard of this device's players, one board per skin. Google sign-in is shown, disabled, with an
honest note. Nothing is uploaded. Sign-out forgets the local identity (a new anonymous player starts; the old entries
stay on the device board). "Delete my leaderboard data" removes your entries.

## Going online (Firebase) — setup steps

1. https://console.firebase.google.com > Add project (Analytics not needed). The free Spark plan is enough.
2. Build > Authentication > Get started > Sign-in method: enable **Anonymous** and **Google** (set a support email).
3. Authentication > Settings > Authorized domains: add `kylemath.github.io`.
4. Build > Firestore Database > Create database > **Production mode** (pick a region).
5. Project settings > Your apps > Web (`</>`): register; copy the config object into `account-config.js`
   (`window.FTH_FIREBASE = {...}`; these values are public identifiers, not secrets). Commit and push.
6. Deploy rules and index: `npm i -g firebase-tools` (or `npx firebase-tools`), `firebase login`,
   `firebase use --add` (pick the project), then from `docs/game/` with a `firebase.json` containing
   `{"firestore":{"rules":"firestore.rules","indexes":"firestore.indexes.json"}}`:
   `firebase deploy --only firestore`. (Or paste `firestore.rules` into Firestore > Rules, and create the composite index
   `entries: stars desc, levels desc, points desc` when the console links it from the first failed query.)
7. Open the game on kylemath.github.io, tap the trophy, join, win a level: the entry appears under
   Firestore > `boards/<skin>/entries`.

Notes. The SDK is imported lazily from `gstatic.com/firebasejs/10.12.2/` (pinned). Google linking tries `linkWithPopup`,
and falls back to `linkWithRedirect` when popups are blocked or unsupported (iOS home-screen apps). Redirect sign-in
from a GitHub Pages origin to `<project>.firebaseapp.com` can fail in browsers that partition storage; if iOS PWA
sign-in matters, host the game on Firebase Hosting (same origin as `authDomain`) or accept popup-only. The Google
consent screen shows the player's name and email to Google, not to us: the game never reads or stores them (docs hold
only the chosen nickname and the uid). If the Google account is already linked to another profile the player is asked
whether to switch to it; this device's verified runs are then merged into that profile's entry. `firestore.rules`
caps at 64 levels (`MAX_LEVELS`); raise it if the level set grows past that.

## Data model (Firestore)

| path | content | who |
|---|---|---|
| `players/{uid}` | `nick`, `linked`, `createdAt`, `v` | owner only |
| `boards/{skinId}/entries/{uid}` | best per skin: `nick, stars, levels, pars, points, updatedAt, v, app, pr, int`; `pr` = map levelId -> proof (the compact verified run set), `int` = integrity summary `{tamper, sig}` | public read, owner write |
| `runs/{uid}_{levelId}_{skinId}` | the full proof of the best run on that level + skin (below) plus `uid, at` | owner read/write; you export it with the Admin SDK |

Proof: `{v, lvl, skin, app, cnt:'all'|'net', hints, t0, ms, wall, claim:{stars,moves,pts}, ops, fin, fp, int}`. `ops` are
`type|ms|colouring` strings (Firestore cannot nest arrays; the code unpacks them): `s` swap, `w` web rename (island
board), `u` undo, `r` reset (frame skins); the colouring is one digit per region, `-` for the hole. `cnt` says how moves
are counted: `all` = every non-web swap including undo-swaps (island board), `net` = `lab/core.js` `g.moves` (frame
skins). Skin ids are never hard-coded: boards are keyed by whatever `FTH_SKINS.list` contains, and the skin recorded
is the one the level actually ran in (a skin that cannot draw a map falls back to Islands and is recorded as islands).

Rules enforce: sign-in required (anonymous counts); only your own docs; field names, types and bounds; `stars <= 3*levels`,
`levels == pr.size() <= 64`, `points <= 6000*levels`; numbers never decrease; `updatedAt == request.time` and at least
5 s between writes to the same doc; deletes only your own; the leaderboard is publicly readable.

## Anti-cheat by replay

The puzzle is deterministic, so a run is proved by replaying it. `verify.js` replays the swap list from the level's start
state using `lab/core.js` (the same code the skins play with, loaded on demand), and requires: every step is exactly one
legal Kempe chain of the colouring before it (also pre-checked step by step by `diffSwap`, which is tested against core);
no move after the win; the last state is a win (rim <= goal); the swap count gives at least the claimed stars (par from
`levels.js`; hints cap at 2 stars); timestamps monotone, >= 150 ms between swaps (400 ms to the first), and the total
>= 600 ms + 250 ms per swap; the fingerprint matches. Every reader re-verifies: the board screen replays all proofs
of the entries it loads, recomputes stars/levels/pars/points from the proofs that pass, and hides an entry (counting it
under the table) if any proof fails, if its published totals do not equal the recomputed ones, if its device had a tamper
flag, or if a proof was copied from an entry that holds it earlier. `node tools/verify_runs.js runs.json` does the same
for an export of the `runs` collection (also checks doc ids and copied fingerprints).

### What this does and does not stop

Stops: edited progress saves reaching a board, invented or hand-edited solutions, "teleporting" to a won colouring, wrong
star/move claims, impossible or zero-duration timings, moves after the win, a proof resubmitted on the same device or copied
into another profile, inflated entry totals.

Does NOT stop: a bot or person who solves the level optimally (the levels are small; the census gives the optimum) and
feeds plausible, human-paced timings through the real game or a patched client. A replay proves the *solution* is
legal, not that a human found it. **Points are not verified**: they come from the shell's score (trace bonuses, new
patterns, bonus-round), which cannot be reproduced from the swap list; they are only capped (6000 per level) and used as the
last tie-break after stars and levels. Skins with their own goal (Blank Doodle, `own: true`) report only a swap count, not
colourings, so they produce no proof and no board entry yet (the frame page would have to post its colourings). A player
who strips the integrity signals before submitting removes that evidence. Firestore rules cannot re-run the replay.
Next steps if it matters: a Cloud Function (Blaze plan, still pennies) triggered on `runs/*` that runs `verify.js` in node
and writes a `verified` flag/entry totals itself, with the rules then denying client writes to `boards`; a per-level
minimum-time distribution from real data; App Check against scripted clients.

## Integrity logging (what is recorded while people play)

Three separate things. (i) The research log (`telemetry.js`) is unchanged and opt-in; integrity signals are mirrored into
it only if the player already said yes to that. (ii) The **integrity log** is always on and stays on the device
(`localStorage` key `fth-integrity`, last 200 signals; the account screen shows counts and can clear them). A signal is
a kind, level, skin and a few numbers: no fingerprinting, no keystrokes, no IP, no free text. (iii) Only when the player is
signed in with "Send my nickname, scores and a replayable record..." ticked (one-line notice at join, toggle any time) do
the proof and the per-run signals leave the device, with the entry.

Signals: `save-edited`, `save-seal-removed` (progress save has a keyed hash chain; casual edits are detected, the player
is never locked out, the device gets a tamper count which hides its entries from shared boards), `illegal-swap`,
`msg-foreign-source`, `msg-untrusted-event`, `msg-count-mismatch`, `msg-win-claim-false`, `msg-wrong-level`,
`win-without-path`, `win-without-run`, `score-display-mismatch`, `fast-swap`, `move-while-hidden`, `clock-jump`,
`level-farm`, `proof-rejected`, `proof-flagged`, `proof-replay`, `proof-soft:*`, `skin-fallback`, `own-skin-no-proof`.
The seal key sits on the same device, so someone who reads it can forge a consistent save: it catches casual edits, not
determined ones. Because boards are built from verified proofs and never from the save, an edited save cannot raise a
board score anyway; the flag is there so the attempt is on record.

## The podium: coins earned in each skin

The leaderboard screen is one list: every skin, with its 1st, 2nd and 3rd by **lifetime coins earned in that skin**
(`FTH_ACCT.podium(scope)`). Spending coins on skin tickets does not lower it (`earned` only ever grows). Each skin's coin
balance lives in `save.wallet`, sealed with the progress save, and owned skins and tickets (`save.skins`) are sealed too
(`FTH_INT.seal/check`): a hand-edited balance or a hand-unlocked skin logs `save-edited` and adds to the tamper count.

**Coins are client state, so the replay cannot prove them.** What the podium does instead:
- an entry carries `coins` (uploaded with the proofs when you have joined); it must first pass `verifyEntry` (its levels replay,
  no tamper flags, no copied proofs), else it is hidden and counted;
- its coins count only up to a plausibility cap: `coinCap(skin, levels)` = the skin's coin rate x 12,000 points per verified level
  (a first win pays at most 6,000 points; replays pay a quarter, so twice that is generous). A capped entry ranks by the cap;
- Blank Doodle (`own: true`) makes no proofs, so its cap counts every level of the game: its podium is the weakest;
- Firestore rules: `coins` is an int, 0 to 10,000,000, and never goes down.

A player farming replays at a quarter rate, within the cap, is not stopped; neither is a forged client that reports plausible
coins with real proofs. A server-side tally (Blaze plan, see above) would be the next step.

`FTH_ACCT.board(skin, scope, metricId)` (stars, levels, points per skin, proof-verified) is still there for a detailed board;
`FTH_ACCT.registerMetric({id, label, of: entry => number})` is the hook for another metric.
