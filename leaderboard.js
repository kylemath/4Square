/* leaderboard.js: the account + leaderboard screen. ONE standings table over every skin, Mario Kart style: slanted
 * position numbers (gold, silver, bronze, then plain), banded rows sliding in from the right, your own row lit and pulsing.
 * Ranked by overall progress, the furthest level beaten in any skin (FTH_ACCT.standings); columns: the level the player
 * is on, levels beaten summed over the skins, and their favourite skin (most levels beaten there). Two icon tabs pick
 * this device or everyone. Not joined yet: a bright join banner on top, with Google sign-in right there (disabled in LOCAL mode).
 * Lazy-loaded (after account-config.js and account.js) the first time the trophy button is tapped, so the game itself
 * stays fast and offline-capable. Styled only with the skin's --sk-* tokens (SKIN-SPEC.md), so it fits every skin.
 *   window.FTH_LB.open(skinId)
 */
(function () {
  'use strict';
  const A = window.FTH_ACCT, $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.floor(n).toLocaleString('en');
  const ROWS = 10;
  const AV = ['#ff6a45', '#4aa8ff', '#ffb31a', '#3fc35a', '#b77bff', '#ff5fa2', '#16b8a6', '#ff8a3c'];
  const GOOGLE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#ffc107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#ff3d00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4caf50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976d2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const CSS = `
#lb{position:fixed;inset:0;z-index:70;display:none;flex-direction:column;background:var(--sk-bg);color:var(--sk-ink,#fff);font-family:var(--sk-font,system-ui,sans-serif);padding:max(10px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));overflow:hidden}
#lb.on{display:flex}
#lb *{box-sizing:border-box}
#lb button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#lb .lb-head{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex:none}
#lb h2{margin:0;font-size:26px;font-weight:900;font-style:italic;flex:1;letter-spacing:.02em;text-shadow:0 3px 0 rgba(0,0,0,.18);white-space:nowrap}
#lb .lb-x{width:46px;height:46px;flex:none;border-radius:16px;border:0;background:#fff;color:#1c1640;font-size:20px;font-weight:900;box-shadow:0 5px 0 #8fa6c4,0 8px 14px rgba(0,0,0,.22)}
#lb .lb-x:active{transform:translateY(4px);box-shadow:0 1px 0 #8fa6c4}
#lb .lb-tabs{display:flex;padding:4px;gap:4px;border-radius:18px;background:rgba(0,0,0,.25);flex:none}
#lb .lb-tabs button{width:48px;height:40px;border-radius:14px;border:0;background:transparent;font-size:22px;line-height:1;opacity:.6;filter:grayscale(.6)}
#lb .lb-tabs button[aria-selected="true"]{background:#fff;opacity:1;filter:none;box-shadow:0 3px 0 #8fa6c4}
#lb .lb-tabs button[disabled]{opacity:.3;cursor:not-allowed}
#lb .lb-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;margin:0 -12px;padding:0 12px 16px;display:flex;flex-direction:column;gap:12px}
/* join banner */
#lb .lb-join{position:relative;flex:none;border-radius:var(--sk-radius,22px);border:3px solid #1c1640;background:linear-gradient(160deg,#ffe766 0%,#ffb31a 60%,#ff8a1a 100%);color:#3a1d00;padding:12px 12px 12px;box-shadow:0 6px 0 #b0600a,0 12px 22px rgba(0,0,0,.25);overflow:hidden}
#lb .lb-join::before{content:'';position:absolute;inset:-40% -10% auto auto;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.55),transparent 65%);pointer-events:none}
#lb .lb-jt{display:flex;align-items:center;gap:10px;margin-bottom:10px}
#lb .lb-jt .flag{font-size:40px;line-height:1;filter:drop-shadow(0 3px 0 rgba(0,0,0,.25))}
#lb .lb-jt b{font-size:24px;font-weight:900;font-style:italic;letter-spacing:.02em;line-height:1;text-shadow:0 2px 0 rgba(255,255,255,.6)}
#lb .lb-jrow{display:flex;gap:8px;align-items:center}
#lb .lb-in{flex:1;min-width:0;height:48px;border-radius:14px;border:3px solid #1c1640;background:#fff;color:#1c1640;padding:0 12px;font:inherit;font-weight:800;font-size:16px}
#lb .lb-dice{width:48px;height:48px;flex:none;border-radius:14px;border:3px solid #1c1640;background:#fff;font-size:22px;box-shadow:0 4px 0 #1c1640}
#lb .lb-dice:active{transform:translateY(3px);box-shadow:0 1px 0 #1c1640}
#lb .lb-jbtns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
#lb .b3{height:52px;border-radius:16px;border:3px solid #1c1640;font-weight:900;font-size:19px;font-style:italic;letter-spacing:.03em;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 5px 0 #1c1640;transition:transform .08s,box-shadow .08s}
#lb .b3:active{transform:translateY(4px);box-shadow:0 1px 0 #1c1640}
#lb .b3.go{background:linear-gradient(180deg,#8af574,#2fbf4a);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.25)}
#lb .b3.gg{background:#fff;color:#1c1640;font-style:normal;font-size:16px}
#lb .b3 svg{width:24px;height:24px;flex:none}
#lb .b3[disabled]{opacity:.5;cursor:not-allowed;box-shadow:0 2px 0 #1c1640;transform:none}
#lb .lb-chk{display:flex;gap:8px;align-items:center;font-size:12px;font-weight:700;line-height:1.25;margin-top:10px;opacity:.85}
#lb .lb-chk input{width:20px;height:20px;flex:none;accent-color:#2fbf4a}
#lb .lb-err{font-size:13px;font-weight:800;min-height:0;color:#b3001b}
#lb .lb-err:empty{display:none}
#lb .lb-card .lb-err{color:#ff8a80}
/* the standings */
#lb .lb-card{flex:none;border-radius:var(--sk-radius,22px);background:var(--sk-card);color:var(--sk-card-ink,#e6edf3);padding:10px 10px 12px;border:3px solid var(--sk-edge,rgba(0,0,0,.35));box-shadow:0 6px 0 rgba(0,0,0,.25)}
#lb .lb-bh{display:flex;align-items:center;gap:8px;padding:2px 4px 10px}
#lb .lb-bh .nm{font-weight:900;font-size:20px;font-style:italic;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#lb .lb-bh .cn{display:inline-flex;align-items:center}
#lb .lb-bh .mini{width:32px;height:32px;flex:none;border-radius:10px;overflow:hidden;display:grid;place-items:center;font-size:24px}
#lb .lb-bh .mini svg{width:100%;height:100%}
#lb .lb-shield{font-size:12px;font-weight:900;padding:3px 8px;border-radius:99px;background:color-mix(in srgb,var(--sk-card-ink,#fff) 14%,transparent)}
#lb .lb-rows{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
#lb .lb-r{position:relative;display:flex;align-items:center;gap:9px;height:54px;padding:0 12px 0 4px;font-variant-numeric:tabular-nums;clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);background:color-mix(in srgb,var(--sk-card-ink,#fff) 9%,transparent)}
#lb .lb-r:nth-child(even){background:color-mix(in srgb,var(--sk-card-ink,#fff) 17%,transparent)}
#lb .lb-r.top1{background:linear-gradient(90deg,color-mix(in srgb,#ffd84a 38%,transparent),color-mix(in srgb,var(--sk-card-ink,#fff) 9%,transparent))}
#lb .lb-r.me{background:linear-gradient(90deg,var(--sk-accent,#ffd84a),color-mix(in srgb,var(--sk-accent,#ffd84a) 55%,#fff));color:#1c1640}
#lb .lb-pos{width:50px;flex:none;display:flex;align-items:baseline;justify-content:center;transform:skewX(-14deg);font-weight:900;font-style:italic;line-height:1}
#lb .lb-pos b{font-size:32px;letter-spacing:-1px}
#lb .lb-pos i{font-size:12px;font-style:normal;margin-left:1px}
#lb .lb-pos.p1,#lb .lb-pos.p2,#lb .lb-pos.p3{height:42px;align-items:center;border-radius:8px;border:3px solid #1c1640;box-shadow:0 3px 0 #1c1640;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.35)}
#lb .lb-pos.p1{background:linear-gradient(180deg,#fff3a0,#ffd84a 45%,#e59a00)}
#lb .lb-pos.p2{background:linear-gradient(180deg,#ffffff,#cfd8e3 50%,#8d9bb0)}
#lb .lb-pos.p3{background:linear-gradient(180deg,#ffd1a6,#e08a4a 50%,#a3521c)}
#lb .lb-pos.pn{opacity:.8}
#lb .lb-av{width:38px;height:38px;flex:none;border-radius:50%;border:3px solid #1c1640;display:grid;place-items:center;color:#fff;font-weight:900;font-size:17px;text-shadow:0 2px 0 rgba(0,0,0,.3);box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),inset 0 3px 0 rgba(255,255,255,.35)}
#lb .lb-n{flex:1;min-width:0;font-weight:900;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#lb .lb-c{display:flex;align-items:center;gap:5px;font-weight:900;font-size:18px;flex:none}
#lb .lb-cols{display:flex;align-items:center;gap:7px;padding:0 12px 6px 4px;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;opacity:.7}
#lb .lb-cols .sp{flex:1}
#lb .lb-lv,#lb .lb-sum,#lb .lb-fav{flex:none;text-align:center;font-weight:900}
#lb .lb-lv{width:46px;font-size:17px}
#lb .lb-cols .lb-lv,#lb .lb-cols .lb-sum,#lb .lb-cols .lb-fav{font-size:11px;width:auto;min-width:0}
#lb .lb-cols .lb-lv{width:46px}#lb .lb-cols .lb-sum{width:36px}#lb .lb-cols .lb-fav{width:38px}
#lb .lb-cols .av{width:38px;flex:none}
#lb .lb-body .lb-r{gap:7px}
#lb .lb-body .lb-pos{width:44px}
#lb .lb-lv.done{font-size:20px}
#lb .lb-sum{width:36px;font-size:16px}
#lb .lb-fav{width:38px;height:38px;display:grid;place-items:center}
#lb .lb-fav .ic{width:34px;height:34px;border-radius:10px;overflow:hidden;display:grid;place-items:center;font-size:24px;line-height:1;background:#fff;border:2px solid #1c1640}
#lb .lb-fav .ic svg{width:100%;height:100%;display:block}
@media (max-width:380px){#lb .lb-body .lb-r,#lb .lb-cols{gap:5px}#lb .lb-body .lb-pos{width:38px}#lb .lb-pos b{font-size:26px}#lb .lb-n{font-size:15px}}
#lb .lb-r.gap{height:18px;background:none;justify-content:center;font-weight:900;letter-spacing:4px;opacity:.6;clip-path:none}
#lb .lb-r.ghost{background:none;outline:3px dashed color-mix(in srgb,var(--sk-card-ink,#fff) 28%,transparent);outline-offset:-3px;clip-path:none;border-radius:12px}
#lb .lb-r.ghost .lb-av{background:color-mix(in srgb,var(--sk-card-ink,#fff) 20%,transparent);border-style:dashed}
#lb .lb-r.ghost .bar{flex:1;height:12px;border-radius:6px;background:color-mix(in srgb,var(--sk-card-ink,#fff) 14%,transparent)}
#lb .lb-r.you{background:none;outline:3px dashed var(--sk-accent,#ffd84a);outline-offset:-3px;clip-path:none;border-radius:12px;cursor:pointer}
#lb .lb-r.you .tag{font-size:12px;font-weight:900;padding:3px 8px;border-radius:99px;background:var(--sk-accent,#ffd84a);color:#1c1640}
#lb .lb-state{padding:30px 8px;text-align:center;font-size:40px}
#lb .lb-state .b3{margin:10px auto 0;width:140px}
/* you */
#lb .lb-you{display:flex;align-items:center;gap:8px}
#lb .lb-you .lb-in{border-color:color-mix(in srgb,var(--sk-card-ink,#fff) 40%,transparent);background:color-mix(in srgb,var(--sk-card-ink,#fff) 8%,transparent);color:inherit}
#lb .lb-ib{width:48px;height:48px;flex:none;border-radius:14px;border:3px solid #1c1640;background:#fff;color:#1c1640;font-size:20px;display:grid;place-items:center;box-shadow:0 4px 0 #1c1640;padding:0}
#lb .lb-ib svg{width:24px;height:24px}
#lb .lb-ib:active{transform:translateY(3px);box-shadow:0 1px 0 #1c1640}
#lb .lb-ib[disabled]{opacity:.45;cursor:not-allowed}
#lb .lb-ib.on{background:#e4ffe9;opacity:1;cursor:default;position:relative}
#lb .lb-ib.on::after{content:'✓';position:absolute;right:-7px;top:-7px;width:20px;height:20px;border-radius:50%;background:#2fbf55;color:#fff;font:900 13px/20px system-ui;border:2px solid #1c1640}
#lb details{font-size:13px;margin-top:4px}
#lb summary{cursor:pointer;font-weight:900;font-size:16px;list-style:none;opacity:.7;width:max-content;margin-left:auto;margin-top:-4px}
#lb summary::-webkit-details-marker{display:none}
#lb .lb-note{font-size:12px;opacity:.8;margin:8px 0 0;line-height:1.35}
#lb .lb-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}
#lb .lb-btn{border-radius:12px;border:2px solid color-mix(in srgb,var(--sk-card-ink,#fff) 40%,transparent);padding:8px 12px;font-weight:800;background:transparent;color:inherit;min-height:40px}
#lb .lb-card .lb-chk{opacity:.85}
#lb :focus-visible{outline:3px solid var(--sk-accent,#ffd84a);outline-offset:2px}
@media (prefers-reduced-motion:no-preference){
#lb .lb-r{animation:lbin .42s cubic-bezier(.2,1.2,.4,1) both}
@keyframes lbin{0%{transform:translateX(110%);opacity:0}100%{transform:none;opacity:1}}
#lb .lb-r.me{animation:lbin .42s cubic-bezier(.2,1.2,.4,1) both,lbme 1.6s ease-in-out .6s infinite}
@keyframes lbme{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}
#lb .lb-r.me .lb-pos,#lb .lb-r.me .lb-av{animation:lbbob 1.6s ease-in-out .6s infinite}
@keyframes lbbob{0%,100%{scale:1}50%{scale:1.1}}
#lb .lb-join{animation:lbpop .5s cubic-bezier(.3,1.6,.5,1) both}
#lb .lb-jt .flag{animation:lbwig 2.4s ease-in-out infinite}
@keyframes lbpop{0%{transform:scale(.7);opacity:0}100%{transform:none;opacity:1}}
@keyframes lbwig{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-14deg) scale(1.1)}84%{transform:rotate(12deg) scale(1.1)}92%{transform:rotate(-6deg)}}
@keyframes lbfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}}
`;
  let root, scope = 'device', seq = 0, nickDraft = '';
  const skins = () => (window.FTH_SKINS && FTH_SKINS.list || []).filter(k => k.id);
  const specOf = id => skins().find(x => x.id === id) || { id, name: id, ic: '' };
  const iconOf = k => typeof k.icon === 'string' && /^\s*<svg[\s>]/.test(k.icon) && !/<script/i.test(k.icon) ? k.icon : '<span aria-hidden="true">' + esc(k.ic || '•') + '</span>';
  const hue = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) | 0; return AV[Math.abs(h) % AV.length]; };
  const initial = s => esc((String(s || '?').trim()[0] || '?').toUpperCase());
  const ord = r => r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th';
  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'lb'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'lbTitle');
    root.innerHTML = '<div class="lb-head"><button class="lb-x" aria-label="Close leaderboard">✕</button><h2 id="lbTitle">🏆 Scores</h2><div class="lb-tabs" role="tablist" aria-label="Who to show"></div></div>' +
      '<div class="lb-scroll"><div id="lbJoin"></div><div class="lb-card lb-body" id="lbBody" aria-live="polite"></div><div id="lbYou"></div></div>';
    document.body.appendChild(root);
    $('.lb-x', root).onclick = close;
    root.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    addEventListener('fth-acct', () => { if (root.classList.contains('on')) render(); });
    addEventListener('fth-cloud', () => { if (root.classList.contains('on') && !(window.FTH_CLOUD && FTH_CLOUD.state().busy)) render(); });
  }
  function close() { root.classList.remove('on'); if (root._from && root._from.focus) root._from.focus(); }
  async function open() {
    build();
    root._from = document.activeElement; root.classList.add('on');
    await A.init(); scope = A.state().kind === 'local' ? 'device' : 'everyone'; render();
    setTimeout(() => $('.lb-x', root).focus(), 30);
  }
  function tabs() {
    const s = A.state(), t = $('.lb-tabs', root);
    t.innerHTML = `<button role="tab" aria-selected="${scope === 'device'}" data-t="device" aria-label="This device" title="This device">📱</button>` +
      `<button role="tab" aria-selected="${scope === 'everyone'}" data-t="everyone" aria-label="Everyone" ${s.kind === 'local' ? 'disabled title="Everyone: needs the online setup"' : 'title="Everyone"'}>🌍</button>`;
    t.querySelectorAll('button').forEach(b => b.onclick = () => { if (b.disabled || scope === b.dataset.t) return; scope = b.dataset.t; render(); });
  }
  const lvNum = id => { const l = ((window.GAME && GAME.levels) || []).find(x => x.id === id); return l ? String(l.num != null ? l.num : '') : ''; };
  const lvCell = r => r.on === null && r.far >= 0 ? '<span class="lb-lv done" title="Every level beaten">🏆</span>' : `<span class="lb-lv" title="On level ${esc(lvNum(r.on))}">${esc(lvNum(r.on))}</span>`;
  const favCell = r => { const k = r.fav && specOf(r.fav); return `<span class="lb-fav" title="${k ? esc(k.name) + ': ' + r.per[r.fav] + (r.per[r.fav] === 1 ? ' level' : ' levels') : ''}">${k ? `<span class="ic">${iconOf(k)}</span>` : ''}</span>`; };
  const say = r => `${r.rank ? r.rank + ord(r.rank) + ': ' : ''}${esc(r.nick)}${r.me ? ' (you)' : ''}, ${r.on === null && r.far >= 0 ? 'every level beaten' : 'on level ' + esc(lvNum(r.on))}, ${r.sum} level${r.sum === 1 ? '' : 's'} over all skins${r.fav ? ', favourite ' + esc(specOf(r.fav).name) : ''}`;
  const row = (r, i) => `<li class="lb-r${r.me ? ' me' : ''}${r.rank === 1 ? ' top1' : ''}" style="animation-delay:${i * 70}ms${r.me ? `,${i * 70 + 600}ms` : ''}" aria-label="${say(r)}">` +
    `<span class="lb-pos ${r.rank <= 3 ? 'p' + r.rank : 'pn'}" aria-hidden="true"><b>${r.rank}</b><i>${ord(r.rank)}</i></span>` +
    `<span class="lb-av" style="background:${hue(r.nick)}" aria-hidden="true">${initial(r.nick)}</span>` +
    `<span class="lb-n" aria-hidden="true">${esc(r.nick)}${r.me ? ' ★' : ''}</span><span aria-hidden="true" style="display:contents">${lvCell(r)}<span class="lb-sum">${r.sum}</span>${favCell(r)}</span></li>`;
  const cols = `<div class="lb-cols" aria-hidden="true"><span class="lb-pos"></span><span class="av"></span><span class="sp"></span><span class="lb-lv" title="The level they are on">Level</span><span class="lb-sum" title="Levels beaten, summed over every skin">Skins</span><span class="lb-fav" title="Favourite skin">Fav</span></div>`;
  function board(T) {
    const body = $('#lbBody', root), s = A.state(), rows = T.rows.slice(0, ROWS);
    let h = `<div class="lb-bh"><span class="nm">Overall</span>` +
      (T.hidden ? `<span class="lb-shield" title="${T.hidden} hidden: solutions did not replay" aria-label="${T.hidden} hidden entries">🛡️ ${T.hidden}</span>` : '') + `</div>`;
    let li = rows.map(row).join('');
    if (T.me && !rows.some(r => r.me)) li += `<li class="lb-r gap" aria-hidden="true">•••</li>` + row(Object.assign({}, T.me, { nick: s.nick || T.me.nick }), rows.length + 1);
    if (!rows.length) li += [0, 1, 2].map(i => `<li class="lb-r ghost" style="animation-delay:${i * 70}ms" aria-hidden="true"><span class="lb-pos ${'p' + (i + 1)}" style="opacity:.35"><b>${i + 1}</b><i>${ord(i + 1)}</i></span><span class="lb-av"></span><span class="bar"></span></li>`).join('');
    const m = T.mine;
    if (!s.signedIn && m && m.lv.size) li += `<li class="lb-r you" data-join style="animation-delay:${(rows.length + 3) * 70}ms" aria-label="You: ${say(Object.assign({}, m, { rank: 0, nick: 'You' }))}. Join to get on the board"><span class="lb-pos pn"><b>?</b></span><span class="lb-av" style="background:${hue('you')}">★</span><span class="lb-n">You <span class="tag" aria-hidden="true">JOIN ↑</span></span>${lvCell(m)}<span class="lb-sum">${m.sum}</span>${favCell(m)}</li>`;
    body.innerHTML = h + cols + `<ol class="lb-rows" aria-label="Overall standings">${li}</ol>`;
    const yj = $('[data-join]', body); if (yj) yj.onclick = () => { const j = $('#lbJoin', root); j.scrollIntoView && j.scrollIntoView({ block: 'start', behavior: 'smooth' }); const n = $('#lbNick', j); if (n) n.focus(); };
  }
  async function render() {
    const my = ++seq; tabs(); join(); you();
    const body = $('#lbBody', root), s = A.state();
    body.innerHTML = '<div class="lb-state" aria-label="Loading">⏳</div>';
    try {
      if (scope === 'everyone' && !s.online) throw Object.assign(new Error('offline'), { offline: true });
      const T = await A.standings(scope); if (my !== seq) return;
      board(T);
    } catch (e) {
      if (my !== seq) return;
      body.innerHTML = e && e.offline ? '<div class="lb-state" aria-label="Offline: your scores are saved and sent later">📡✕</div>'
        : '<div class="lb-state" aria-label="Could not load the board">⚠️<button class="b3 go" id="lbRetry" aria-label="Try again">↻</button></div>';
      const rt = $('#lbRetry', body); if (rt) rt.onclick = render;
    }
  }
  // ---------------------------------------------------------------- join banner (not joined yet) and your card (joined)
  const research = () => !!(window.FTH_LOG && FTH_LOG.consent() === 'on');
  const notice = on => `<label class="lb-chk"><input type="checkbox" id="lbSub" ${on ? 'checked' : ''}><span>📤 Share nickname, scores &amp; replays. No real name or email.</span></label>`;
  function join() {
    const el = $('#lbJoin', root), s = A.state();
    if (s.signedIn) { el.innerHTML = ''; return; }
    if (!nickDraft) nickDraft = A.randomNick();
    const g = s.hasGoogle ? '' : `disabled title="${esc(s.note)}"`;
    el.innerHTML = `<div class="lb-join" role="region" aria-label="Join the leaderboard"><div class="lb-jt"><span class="flag" aria-hidden="true">🏁</span><b>JOIN THE RACE!</b></div>
      <div class="lb-jrow"><input class="lb-in" type="text" id="lbNick" maxlength="16" autocomplete="off" aria-label="Nickname" value="${esc(nickDraft)}"><button class="lb-dice" id="lbDice" aria-label="Random nickname">🎲</button></div>
      <div class="lb-jbtns"><button class="b3 go" id="lbJoinBtn">JOIN ▶</button><button class="b3 gg" id="lbGoogleJ" ${g} aria-label="Join with Google">${GOOGLE}Google</button></div>
      ${notice(true)}${research() ? '<p class="lb-note">🔬 Your moves are logged for the lab\'s puzzle research (no name or email).</p>' : ''}<div class="lb-err" id="lbErrJ" role="alert"></div></div>`;
    const err = m => { const e = $('#lbErrJ', el) || $('#lbErr', root); if (e) e.textContent = m || ''; }, nk = $('#lbNick', el);
    nk.oninput = () => { nickDraft = nk.value; };
    $('#lbDice', el).onclick = () => { nickDraft = nk.value = A.randomNick(); };
    const start = async () => {
      const v = A.validateNick(nk.value); if (!v.ok) { err(v.why); return null; }
      const want = $('#lbSub', el).checked;            // read before awaiting: the screen re-renders when the identity appears
      await A.ensureIdentity(); A.setNick(v.nick); A.setSubmit(want); nickDraft = ''; return v;
    };
    $('#lbJoinBtn', el).onclick = async () => { try { await start(); } catch (e) { err('Could not start: ' + (e && e.message || 'try again')); } render(); };
    $('#lbGoogleJ', el).onclick = async e => { e.currentTarget.disabled = true; try { if (await start()) await google(err); } catch (x) { err('Google sign-in did not work (' + ((x && x.code) || 'error') + ').'); } render(); };
  }
  async function google(err) {
    const r = await A.linkGoogle();
    if (r.status === 'in-use') {
      if (confirm('That Google account already has a 4square profile. Switch to it? Your solutions from this device will be added to it. (The anonymous profile you have now stays as it is.)')) await A.useCredential(r.credential);
    } else if (r.status === 'redirect') err('Opening Google…'); else if (r.status === 'unavailable') err('Google sign-in needs setup.');
  }
  function you() {
    const el = $('#lbYou', root), s = A.state();
    if (!s.signedIn) { el.innerHTML = ''; return; }
    const integ = window.FTH_INT ? FTH_INT.counts() : {}, ik = Object.keys(integ);
    el.innerHTML = `<div class="lb-card" role="region" aria-label="You">
      <div class="lb-you"><span class="lb-av" style="background:${hue(s.nick)}" aria-hidden="true">${initial(s.nick)}</span>
        <input class="lb-in" type="text" id="lbNickMe" maxlength="16" autocomplete="off" aria-label="Nickname" value="${esc(s.nick)}">
        <button class="lb-ib" id="lbSave" aria-label="Change name">✏️</button>
        <button class="lb-ib${s.linked ? ' on' : ''}" id="lbGoogle" ${s.hasGoogle && !s.linked ? '' : 'disabled'} aria-label="${s.linked ? 'Linked to Google' : 'Keep my progress with Google'}" title="${esc(s.linked ? 'Linked to Google' : s.hasGoogle ? 'Keep my progress with Google' : s.note)}">${GOOGLE}</button></div>
      <div class="lb-err" id="lbErr" role="alert">${esc(s.err)}</div>
      ${(() => { const c = window.FTH_CLOUD ? FTH_CLOUD.state() : null; if (!c) return '';
        const t = c.at ? new Date(c.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        return `<p class="lb-note" aria-label="Cloud save">${c.busy ? '☁️ …' : c.err ? '☁️ ⚠️ ' + esc(c.err) : c.at ? '☁️ ✓ ' + t + (s.linked ? ' · every device' : ' · 🔗 Google to play anywhere') : '☁️'}${research() ? ' · 🔬' : ''}</p>`; })()}
      ${s.queued ? `<p class="lb-note" aria-label="${s.queued} boards waiting to be sent">📤 ${s.queued}${s.online ? '' : ' · 📡✕'}</p>` : ''}
      <details><summary aria-label="Settings and your data">⚙️</summary>
        ${notice(s.submit)}
        ${window.FTH_LOG ? `<label class="lb-chk"><input type="checkbox" id="lbResearch" ${research() ? 'checked' : ''}><span>🔬 Log my moves for the lab's puzzle research (no name or email).</span></label>` : ''}
        ${s.hasGoogle ? '<p class="lb-note">Linking keeps your scores. Your Google name and email are never shown or stored by the game.</p>' : `<p class="lb-note">${esc(s.note)}</p>`}
        <p class="lb-note">Ranked by the furthest level beaten in any skin, then by levels beaten summed over every skin. Your favourite is the skin where you have beaten the most levels. Every entry's solutions are replayed on your device first; only replayed levels count.</p>
        <div class="lb-row"><button class="lb-btn" id="lbOut">⏏ Sign out</button><button class="lb-btn" id="lbDel">🗑 Delete my leaderboard data</button></div>
        <p class="lb-note">Integrity notes on this device${ik.length ? ': ' + ik.map(k => esc(k) + ' ×' + integ[k]).join(', ') : ': none'}. They stay here unless you submit scores.</p>
        ${ik.length ? '<div class="lb-row"><button class="lb-btn" id="lbClearLog">Clear notes</button></div>' : ''}
      </details></div>`;
    const err = m => { const e = $('#lbErr', root); if (e) e.textContent = m || ''; };
    $('#lbSave', el).onclick = () => { const r = A.setNick($('#lbNickMe', el).value); if (!r.ok) err(r.why); else { err(''); render(); } };
    $('#lbSub', el).onchange = e => A.setSubmit(e.target.checked);
    const rs = $('#lbResearch', el); if (rs) rs.onchange = e => { FTH_LOG.setConsent(e.target.checked); if (e.target.checked) FTH_LOG.upload(); render(); };
    $('#lbGoogle', el).onclick = async e => { e.currentTarget.disabled = true; try { await google(err); } catch (x) { err('Google sign-in did not work (' + ((x && x.code) || 'error') + ').'); } render(); };
    $('#lbOut', el).onclick = async () => { await A.signOut(); render(); };
    $('#lbDel', el).onclick = async () => { if (confirm('Delete your leaderboard entries, profile, cloud save and research log? Your game progress on this device is kept.')) { try { await A.deleteMine(); } catch (x) { err('Could not delete right now: ' + (x && x.code || 'error')); } render(); } };
    const cl = $('#lbClearLog', el); if (cl) cl.onclick = () => { FTH_INT.clear(); render(); };
  }
  window.FTH_LB = { open, close, render };
})();
