/* leaderboard.js: the account + leaderboard screen. Lazy-loaded (after account-config.js and account.js) the first time
 * the trophy button is tapped, so the game itself stays fast and offline-capable. Styled only with the skin's --sk-*
 * tokens (see SKIN-SPEC.md), so it looks right in every skin.   window.FTH_LB.open(skinId)
 */
(function () {
  'use strict';
  const A = window.FTH_ACCT, $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = `
#lb{position:fixed;inset:0;z-index:70;display:none;flex-direction:column;background:var(--sk-bg);color:var(--sk-ink,#fff);font-family:var(--sk-font,system-ui,sans-serif);padding:max(10px,env(safe-area-inset-top)) 14px max(12px,env(safe-area-inset-bottom));overflow:hidden}
#lb.on{display:flex}
#lb *{box-sizing:border-box}
#lb .lb-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
#lb h2{margin:0;font-size:22px;flex:1;letter-spacing:.02em}
#lb button{font:inherit;cursor:pointer;min-height:40px}
#lb .lb-x{width:44px;height:44px;border-radius:50%;border:2px solid var(--sk-edge,color-mix(in srgb,var(--sk-card-ink,#fff) 30%,transparent));background:var(--sk-btn2,var(--sk-card));color:var(--sk-btn2-ink,var(--sk-card-ink,#fff));font-size:20px;line-height:1}
#lb .lb-skins{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}
#lb .lb-skins button,#lb .lb-tabs button{flex:none;border-radius:999px;padding:6px 12px;border:2px solid color-mix(in srgb,var(--sk-ink,#fff) 35%,transparent);background:color-mix(in srgb,var(--sk-card-ink,#fff) 8%,transparent);color:var(--sk-ink,#fff);font-weight:700;font-size:14px}
#lb button[aria-checked="true"],#lb button[aria-selected="true"]{background:var(--sk-accent);color:var(--sk-btn-ink,#111);border-color:var(--sk-accent)}
#lb .lb-tabs{display:flex;gap:6px;margin-bottom:8px}
#lb .lb-body{flex:1;overflow-y:auto;border-radius:var(--sk-radius,18px);background:var(--sk-card);color:var(--sk-card-ink,#e6edf3);padding:10px 12px;-webkit-overflow-scrolling:touch}
#lb table{width:100%;border-collapse:collapse;font-size:15px;font-variant-numeric:tabular-nums}
#lb th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;opacity:.7;text-align:right;padding:2px 4px 6px;font-weight:700}
#lb td{padding:7px 4px;text-align:right;border-top:1px solid color-mix(in srgb,var(--sk-card-ink,#fff) 14%,transparent)}
#lb th:nth-child(2),#lb td:nth-child(2){text-align:left;width:100%;max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#lb th:first-child,#lb td:first-child{text-align:center;width:2.4em;font-weight:800}
#lb tr.me td{background:color-mix(in srgb,var(--sk-accent) 28%,transparent);font-weight:800}
#lb .lb-note{font-size:13px;opacity:.85;margin:8px 0 0;line-height:1.35}
#lb .lb-state{padding:26px 8px;text-align:center;opacity:.9;line-height:1.4}
#lb .lb-card{margin-top:12px;padding-top:10px;border-top:2px solid color-mix(in srgb,var(--sk-card-ink,#fff) 18%,transparent)}
#lb .lb-card h3{margin:0 0 6px;font-size:15px}
#lb .lb-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0}
#lb input[type=text]{flex:1;min-width:140px;min-height:42px;border-radius:12px;border:2px solid color-mix(in srgb,var(--sk-card-ink,#fff) 35%,transparent);background:transparent;color:inherit;padding:0 10px;font:inherit}
#lb .lb-btn{border-radius:14px;border:2px solid transparent;padding:8px 14px;font-weight:800;background:var(--sk-btn);color:var(--sk-btn-ink,#fff)}
#lb .lb-btn.alt{background:transparent;color:inherit;border-color:color-mix(in srgb,var(--sk-card-ink,#fff) 40%,transparent)}
#lb .lb-btn[disabled],#lb .lb-tabs button[disabled]{opacity:.45;cursor:not-allowed}
#lb .lb-err{color:#ff8a80;font-size:13px;min-height:1.2em}
#lb label.lb-chk{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.35}
#lb label.lb-chk input{margin-top:3px;width:18px;height:18px}
#lb details{font-size:13px;margin-top:8px}
#lb :focus-visible{outline:3px solid var(--sk-accent);outline-offset:2px}
`;
  let root, skin, scope = 'device', seq = 0, metric = 'stars';
  const skins = () => (window.FTH_SKINS && FTH_SKINS.list || []).filter(k => k.id);
  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'lb'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'lbTitle');
    root.innerHTML = '<div class="lb-head"><h2 id="lbTitle">🏆 Leaderboard</h2><button class="lb-x" aria-label="Close leaderboard">✕</button></div>' +
      '<div class="lb-skins" role="radiogroup" aria-label="Game style"></div>' +
      '<div class="lb-tabs" role="tablist" aria-label="Who to show"></div>' +
      '<div class="lb-body" id="lbBody" aria-live="polite"></div>';
    document.body.appendChild(root);
    $('.lb-x', root).onclick = close;
    root.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    addEventListener('fth-acct', () => { if (root.classList.contains('on')) render(); });
  }
  function close() { root.classList.remove('on'); if (root._from && root._from.focus) root._from.focus(); }
  async function open(skinId) {
    build(); const S = skins();
    skin = S.some(k => k.id === skinId) ? skinId : (S[0] && S[0].id) || 'islands';
    root._from = document.activeElement; root.classList.add('on');
    await A.init(); scope = A.state().kind === 'local' ? 'device' : 'everyone'; render();
    setTimeout(() => $('.lb-x', root).focus(), 30);
  }
  function chips() {
    $('.lb-skins', root).innerHTML = skins().map(k => `<button role="radio" aria-checked="${k.id === skin}" data-s="${esc(k.id)}">${esc(k.ic || '')} ${esc(k.name)}</button>`).join('');
    $('.lb-skins', root).querySelectorAll('button').forEach(b => b.onclick = () => { skin = b.dataset.s; render(); });
    const on = $('.lb-skins button[aria-checked="true"]', root); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    const s = A.state(), tabs = $('.lb-tabs', root);
    tabs.innerHTML = `<button role="tab" aria-selected="${scope === 'device'}" data-t="device">This device</button>` +
      `<button role="tab" aria-selected="${scope === 'everyone'}" data-t="everyone" ${s.kind === 'local' ? 'disabled title="Needs the online setup"' : ''}>Everyone</button>`;
    tabs.querySelectorAll('button').forEach(b => b.onclick = () => { if (b.disabled) return; scope = b.dataset.t; if (scope !== 'device') metric = 'stars'; render(); });
    const mt = $('.lb-metric', root); if (mt) mt.remove();
    if (A.metrics.some(m => m.id === 'coins')) {            // rank by: stars (verified) | wealth (unverified, this device only)
      const d = document.createElement('div'); d.className = 'lb-row lb-metric'; d.setAttribute('role', 'radiogroup'); d.setAttribute('aria-label', 'Rank by');
      d.innerHTML = `<button class="lb-btn alt" role="radio" aria-checked="${metric === 'stars'}" data-m="stars">★ Stars</button><button class="lb-btn alt" role="radio" aria-checked="${metric === 'coins'}" data-m="coins" ${scope === 'device' ? '' : 'disabled title="Wealth stays on your device"'}>💰 Wealth (unverified)</button>`;
      tabs.after(d); d.querySelectorAll('button').forEach(b => { if (b.getAttribute('aria-checked') === 'true') b.style.outline = '3px solid var(--sk-accent,#ffd84a)'; b.onclick = () => { if (b.disabled) return; metric = b.dataset.m; render(); }; });
    }
  }
  async function render() {
    const my = ++seq; chips();
    const body = $('#lbBody', root), s = A.state();
    body.innerHTML = '<div class="lb-state">Loading…</div>';
    let html = '';
    try {
      if (scope === 'everyone' && !s.online) throw Object.assign(new Error('offline'), { offline: true });
      const b = await A.board(skin, scope, metric); if (my !== seq) return;
      const name = (skins().find(k => k.id === skin) || {}).name || skin;
      const have = Object.keys((FTH_RUN.store()[skin]) || {}).length;
      if (!b.rows.length) html += `<div class="lb-state">${have && !s.signedIn ? 'You have finished ' + have + ' level' + (have === 1 ? '' : 's') + ' in ' + esc(name) + '. Join below to put ' + (have === 1 ? 'it' : 'them') + ' on the board.' : scope === 'device' ? 'No finished levels on this device in ' + esc(name) + ' yet.' : 'Nobody is on the ' + esc(name) + ' board yet.<br>Win a level and join below to be first.'}</div>`;
      else {
        const top = b.rows, meRow = b.me && !top.some(r => r.me) ? b.me : null;
        const W = metric === 'coins', tr = r => `<tr class="${r.me ? 'me' : ''}"><td>${r.rank}</td><td>${esc(r.nick)}${r.me ? ' (you)' : ''}</td><td>${r.stars}★</td><td>${r.levels}</td><td>${W ? (r.me ? Math.round(r.wealth || 0).toLocaleString('en') + ' G' : '—') : r.points}</td></tr>`;
        html += `<table aria-label="${esc(name)} leaderboard, ${scope === 'device' ? 'this device' : 'everyone'}"><thead><tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">Stars</th><th scope="col">Levels</th><th scope="col">${W ? 'Wealth*' : 'Points'}</th></tr></thead><tbody>${top.map(tr).join('')}${meRow ? '<tr><td colspan="5" style="text-align:center;opacity:.6">…</td></tr>' + tr(meRow) : ''}</tbody></table>`;
      }
      if (b.hidden) html += `<p class="lb-note">${b.hidden} entr${b.hidden === 1 ? 'y is' : 'ies are'} hidden: ${b.hidden === 1 ? 'its' : 'their'} solutions did not replay correctly.</p>`;
      html += metric === 'coins' ? '<p class="lb-note">* Wealth is unverified: it is this skin\'s coins earned on this device times their value (G), counted from the game\'s own save. It is never sent, so only your row has one, and it never affects the verified board.</p>' : '';
      html += '<p class="lb-note">Ranked by stars, then levels, then points. Stars and levels are re-checked by replaying every solution on your device; points are self-reported.</p>';
    } catch (e) {
      html += e && e.offline ? '<div class="lb-state">You are offline, so the shared board cannot load.<br>Your scores are saved and will be sent when you are back online.</div>'
        : '<div class="lb-state">Could not load the board right now.<br><button class="lb-btn alt" id="lbRetry">Try again</button></div>';
    }
    body.innerHTML = html + account();
    const rt = $('#lbRetry', body); if (rt) rt.onclick = render;
    wire(body);
  }
  function account() {
    const s = A.state(), integ = window.FTH_INT ? FTH_INT.counts() : {}, ik = Object.keys(integ);
    if (!s.signedIn) return `<div class="lb-card"><h3>Join the leaderboard</h3>
      <p class="lb-note">${s.kind === 'local' ? 'This device only: no account is created and nothing is uploaded.' : 'No sign-up needed: you play under a nickname, as an anonymous player that comes back as itself.'}</p>
      <div class="lb-row"><input type="text" id="lbNick" maxlength="16" autocomplete="off" aria-label="Nickname" placeholder="Pick a nickname" value="${esc(A.randomNick())}"><button class="lb-btn" id="lbJoin">Join</button></div>
      <div class="lb-err" id="lbErr" role="alert"></div>${notice(true)}</div>`;
    return `<div class="lb-card"><h3>You</h3>
      <div class="lb-row"><input type="text" id="lbNick" maxlength="16" autocomplete="off" aria-label="Nickname" value="${esc(s.nick)}"><button class="lb-btn alt" id="lbSave">Change name</button></div>
      <div class="lb-err" id="lbErr" role="alert">${esc(s.err)}</div>
      ${notice(false, s.submit)}
      ${s.queued ? `<p class="lb-note">${s.queued} board${s.queued === 1 ? '' : 's'} waiting to be sent${s.online ? '' : ' (offline)'}.</p>` : ''}
      <div class="lb-row">
        <button class="lb-btn" id="lbGoogle" ${s.hasGoogle && !s.linked ? '' : 'disabled'}>${s.linked ? 'Linked to Google ✓' : 'Keep my progress with Google'}</button>
        <button class="lb-btn alt" id="lbOut">Sign out</button>
      </div>
      ${s.hasGoogle ? '<p class="lb-note">Linking keeps your scores. Your Google name and email are never shown or stored by the game.</p>' : `<p class="lb-note">${esc(s.note)}</p>`}
      <details><summary>Your data</summary>
        <div class="lb-row"><button class="lb-btn alt" id="lbDel">Delete my leaderboard data</button></div>
        <p class="lb-note">Integrity notes on this device${ik.length ? ': ' + ik.map(k => esc(k) + ' ×' + integ[k]).join(', ') : ': none'}. They stay here unless you submit scores (see above).</p>
        ${ik.length ? '<div class="lb-row"><button class="lb-btn alt" id="lbClearLog">Clear notes</button></div>' : ''}
      </details></div>`;
  }
  const notice = (join, on) => `<label class="lb-chk"><input type="checkbox" id="lbSub" ${join || on ? 'checked' : ''}><span>Send my nickname, scores and a replayable record of my solutions, with any tamper warnings from this device, to the leaderboard. No real name, email or location.</span></label>`;
  function wire(body) {
    const err = m => { const e = $('#lbErr', body); if (e) e.textContent = m || ''; };
    const nickIn = () => $('#lbNick', body).value;
    const join = $('#lbJoin', body);
    if (join) join.onclick = async () => {
      const v = A.validateNick(nickIn()); if (!v.ok) return err(v.why);
      const want = $('#lbSub', body).checked;            // read before awaiting: the screen re-renders when the identity appears
      try { await A.ensureIdentity(); A.setNick(v.nick); A.setSubmit(want); } catch (e) { err('Could not start: ' + (e && e.message || 'try again')); } render();
    };
    const sv = $('#lbSave', body); if (sv) sv.onclick = () => { const r = A.setNick(nickIn()); if (!r.ok) err(r.why); else { err(''); render(); } };
    const sub = $('#lbSub', body); if (sub && !join) sub.onchange = () => A.setSubmit(sub.checked);
    const g = $('#lbGoogle', body);
    if (g) g.onclick = async () => {
      g.disabled = true;
      try {
        const r = await A.linkGoogle();
        if (r.status === 'in-use') {
          if (confirm('That Google account already has a 4square profile. Switch to it? Your solutions from this device will be added to it. (The anonymous profile you have now stays as it is.)')) await A.useCredential(r.credential);
        } else if (r.status === 'redirect') err('Opening Google…'); else if (r.status === 'unavailable') err('Google sign-in needs setup.');
      } catch (e) { err('Google sign-in did not work (' + ((e && e.code) || 'error') + ').'); }
      render();
    };
    const out = $('#lbOut', body); if (out) out.onclick = async () => { await A.signOut(); render(); };
    const del = $('#lbDel', body); if (del) del.onclick = async () => { if (confirm('Delete your leaderboard entries and profile? Your game progress on this device is kept.')) { try { await A.deleteMine(); } catch (e) { err('Could not delete right now: ' + (e && e.code || 'error')); } render(); } };
    const cl = $('#lbClearLog', body); if (cl) cl.onclick = () => { FTH_INT.clear(); render(); };
  }
  window.FTH_LB = { open, close, render };
})();
