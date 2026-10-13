/* tickets.js: skin tickets. A new player owns only Islands; every other skin is unlocked with a ticket.
 *
 * Ticket n (the first one is n = 1) can be bought once BOTH hold:
 *   - levels beaten >= GATE[n - 1]                                         (play further each time)
 *   - one wallet holds PRICE[n - 1] points' worth of its own coins          (earn more each time)
 * A price is set in points, the game's internal unit, and shown in each coin as ceil(points x FTH_SKINS.rate(skin)): the
 * same rate play pays, so every currency costs the same effort. It is paid from ONE wallet (the exchange is on the
 * feature bench, see README), never split, and each wallet pays for ONE ticket only: Islands' doubloons buy the first, and
 * every later ticket is bought with the coins of a skin a ticket unlocked. A ticket unlocks any locked skin, the player's choice.
 *
 * save.skins = { own: ['islands', ...], tickets: 0, bought: 0, paid: ['islands', ...] }   (paid: the wallets that bought a
 * ticket; sealed with the rest of the save, see integrity.js)
 *
 * The rules are pure (FTH_TICKETS.next / canBuy / buy / use work on a plain ctx and run in node: tools/tickets_check.js);
 * open() draws the shop (a full-screen showroom on the skin reel, reel.js); the deli counter that sells tickets is deli.js.
 *   ctx = { save, skins: [spec], beaten: () => n, persist(), onUnlock(id), say(text) }
 */
(function () {
  'use strict';
  const START = 'islands';
  // levels beaten before ticket n, and its price in points. Calibrated on clean 3-star play of the 29 levels, bonus rounds
  // not counted (tools/tickets_check.js prints the table against measured earnings): the first ticket is about one
  // level's pay, and each later one comes a little further on and costs 300 points more. One ticket per skin other than Islands.
  const GATE = [1, 3, 5, 7, 9, 12, 14, 16, 18, 20, 23, 26, 28];
  const PRICE = [900, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600, 3900, 4200, 4500];
  const R = (window.FTH_SKINS || {});

  // ---------------------------------------------------------------- rules
  function state(save) {
    const s = save.skins || (save.skins = { own: [START], tickets: 0, bought: 0 });
    if (!Array.isArray(s.own)) s.own = [START];
    if (!s.own.includes(START)) s.own.unshift(START);
    s.tickets = s.tickets | 0; s.bought = s.bought | 0;
    if (!Array.isArray(s.paid)) s.paid = [];
    return s;
  }
  const owns = (save, id) => state(save).own.includes(id);
  const locked = ctx => ctx.skins.filter(k => !owns(ctx.save, k.id));
  const coinsFor = (pts, spec) => Math.ceil(pts * R.rate(spec) - 1e-9);   // the price in this skin's coins
  const bal = (save, id) => ((save.wallet || {})[id] || {}).bal || 0;
  // the next ticket: null when every skin is owned or a ticket is already waiting to be used
  function next(ctx) {
    const s = state(ctx.save), n = s.bought + 1, left = locked(ctx).length;
    if (!left || s.tickets >= left || n > GATE.length) return null;
    const beaten = ctx.beaten(), pts = PRICE[n - 1], gate = GATE[n - 1];
    const pay = ctx.skins.filter(k => !s.paid.includes(k.id) && (owns(ctx.save, k.id) || bal(ctx.save, k.id) > 0))   // a wallet that has not bought a ticket yet (incl. one earned before skins were locked)
      .map(k => ({ id: k.id, spec: k, price: coinsFor(pts, k), bal: bal(ctx.save, k.id) }))
      .map(w => Object.assign(w, { ok: w.bal >= w.price, frac: Math.min(1, w.bal / w.price) }))
      .sort((a, b) => (b.ok - a.ok) || (b.frac - a.frac));
    return { n, of: GATE.length, gate, beaten, gateOk: beaten >= gate, pts, pay, used: s.paid.slice() };
  }
  const canBuy = ctx => { const t = next(ctx); return !!t && t.gateOk && t.pay.some(w => w.ok); };
  function buy(ctx, payId) {                        // spend one wallet's coins on the next ticket
    const t = next(ctx); if (!t || !t.gateOk) return false;
    const w = t.pay.find(x => x.id === payId); if (!w || !w.ok) return false;
    const s = state(ctx.save); ctx.save.wallet[payId].bal -= w.price; s.tickets++; s.bought++; s.paid.push(payId);
    ctx.persist(); log('ticket_buy', { n: t.n, pay: payId, price: w.price }); return true;
  }
  function use(ctx, id) {                           // a ticket unlocks any locked skin
    const s = state(ctx.save); if (s.tickets < 1 || owns(ctx.save, id) || !ctx.skins.some(k => k.id === id)) return false;
    s.tickets--; s.own.push(id); ctx.persist(); log('ticket_use', { skin: id, n: s.own.length }); return true;
  }
  const log = (t, d) => { if (window.FTH_LOG) FTH_LOG.ev(t, d); };

  // ---------------------------------------------------------------- the shop: a showroom of skins
  // Full screen: the skin reel (reel.js) at the bottom, and above it a live preview of the centred skin playing itself on
  // the level last played (its page with &demo=1, see lab/core.js) or, for the island board and pages that do not redraw a
  // swap made from outside, its card art drifting (Ken Burns). A locked skin gets a big [🎟️ × 1] button, or the deli
  // (deli.js) when there is no ticket to spend. Symbols and numbers only.
  //   ctx (from index.html) also has: order [spec], lvl() -> level id, current() -> skin id, onSelect(id), onPlay(id),
  //   theme(spec) -> tokens, blip(f, d, type, vol), sfx (sfx.js)
  // pages whose drawing follows g.on swaps (a swap from outside redraws); the others preview as their card
  const LIVE = { dots: 1, map: 1, spheres: 1, ions: 1, 'islands-3d': 1 };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.floor(n).toLocaleString('en');
  const RL = () => window.FTH_REEL;
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const tk = (w, n) => RL() ? RL().ticket(w, n) : '🎟️';
  const DELI_IC = '<svg viewBox="0 0 48 44" aria-hidden="true"><rect x="7" y="18" width="34" height="22" rx="3" fill="#1c1640" transform="translate(0 3)"/><rect x="7" y="18" width="34" height="22" rx="3" fill="#fff4d6" stroke="#1c1640" stroke-width="3"/>' +
    '<rect x="18" y="26" width="12" height="14" fill="#a8622e" stroke="#1c1640" stroke-width="2.4"/><path d="M4 18L9 5h30l5 13z" fill="#ff4d5e" stroke="#1c1640" stroke-width="3" stroke-linejoin="round"/><path d="M16 5l-3 13M24 5v13M32 5l3 13" stroke="#fff" stroke-width="3.4"/>' +
    '<path d="M4 18q5 6 10 0 5 6 10 0 5 6 10 0 5 6 10 0" fill="#ff4d5e" stroke="#1c1640" stroke-width="3" stroke-linejoin="round"/></svg>';
  const CSS = `
#shop{position:fixed;inset:0;z-index:70;display:none;flex-direction:column;color:#fff;font-family:var(--sk-font,system-ui,sans-serif);overflow:hidden;user-select:none;-webkit-user-select:none;
  padding:max(8px,env(safe-area-inset-top)) 0 max(6px,env(safe-area-inset-bottom));background:#14183a}
#shop.on{display:flex}
#shop *{box-sizing:border-box}
#shop button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#shop :focus-visible{outline:4px solid #ffd84a;outline-offset:3px}
#shop .rl:focus-visible{outline:none}
#shop .sh-bg{position:absolute;inset:0;z-index:0;transition:opacity .4s}
#shop .sh-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 30%,rgba(10,12,40,.15),rgba(10,12,40,.78))}
#shop .sh-top{position:relative;z-index:2;display:flex;align-items:center;gap:10px;padding:0 12px;height:56px;flex:none}
#shop .sh-x,#shop .sh-deli{width:48px;height:48px;border-radius:50%;border:4px solid #1c1640;background:#fff;color:#1c1640;font-size:22px;font-weight:900;line-height:1;box-shadow:0 4px 0 #1c1640;display:flex;align-items:center;justify-content:center;padding:0;position:relative}
#shop .sh-deli{border-radius:16px;width:58px;background:#fff4d6}
#shop .sh-deli svg{width:40px;height:auto}
#shop .sh-deli .tdot{position:absolute;top:-5px;right:-5px}
#shop .sh-tks{margin-left:auto;display:flex;align-items:center;gap:4px;height:44px;padding:0 12px 0 6px;border-radius:22px;background:#fff;border:4px solid #1c1640;color:#1c1640;font-weight:900;font-size:22px;box-shadow:0 4px 0 #1c1640}
#shop .sh-tks svg{width:42px;height:auto}
#shop .sh-stage{position:relative;z-index:1;flex:1 1 auto;min-height:0;padding:4px 16px 10px;display:flex}
#shop .sh-pv{position:relative;flex:1;border-radius:28px;border:5px solid #1c1640;background:#0d1030;overflow:hidden;box-shadow:0 8px 0 #1c1640,0 16px 30px rgba(0,0,0,.4)}
#shop .sh-pv::after{content:'';position:absolute;inset:0;border-radius:23px;box-shadow:inset 0 0 0 3px rgba(255,255,255,.25);pointer-events:none;z-index:6}
#shop .sh-art{position:absolute;inset:0;overflow:hidden;transition:filter .5s}
#shop .sh-kb{position:absolute;left:50%;top:50%;aspect-ratio:3/4;transform:translate(-50%,-50%)}
#shop .sh-kb>div{position:absolute;inset:0}
#shop .sh-kb .rl-svg,#shop .sh-kb .rl-gen{position:absolute;inset:0}
@media (prefers-reduced-motion:no-preference){#shop .sh-kb{animation:shkb 14s ease-in-out infinite alternate}}
@keyframes shkb{0%{transform:translate(-50%,-50%) scale(1.04)}50%{transform:translate(-47%,-52%) scale(1.14)}100%{transform:translate(-53%,-49%) scale(1.09)}}
#shop .sh-live{position:absolute;left:0;top:0;border:0;transform-origin:0 0;opacity:0;transition:opacity .5s;pointer-events:none;background:transparent}
#shop .sh-live.on{opacity:1}
#shop .sh-pv.lock .sh-art,#shop .sh-pv.lock .sh-live{filter:saturate(.75) brightness(.72)}
#shop .sh-lock{position:absolute;inset:0;z-index:4;display:none;align-items:center;justify-content:flex-end;padding-bottom:13%;flex-direction:column;gap:14px;background:radial-gradient(circle at 50% 50%,rgba(10,12,40,.1),rgba(10,12,40,.45))}
#shop .sh-pv.lock .sh-lock{display:flex}
#shop .sh-big{display:flex;align-items:center;gap:10px;padding:14px 26px 14px 18px;border-radius:26px;border:5px solid #1c1640;background:linear-gradient(#ffe36b,#ffc21a);color:#fff;font-weight:900;font-size:40px;line-height:1;
  -webkit-text-stroke:3px #1c1640;paint-order:stroke fill;box-shadow:0 8px 0 #1c1640,0 14px 24px rgba(0,0,0,.35)}
#shop .sh-big svg{width:84px;height:auto;display:block}
#shop .sh-big.deli{background:linear-gradient(#fff,#ffe9c4);gap:6px}
#shop .sh-big.deli svg:first-child{width:70px}
#shop .sh-big.deli .plus{font-size:44px}
#shop .sh-big:active{transform:translateY(6px);box-shadow:0 2px 0 #1c1640}
@media (prefers-reduced-motion:no-preference){#shop .sh-pv.lock .sh-big{animation:shbreathe 1.6s ease-in-out infinite}}
@keyframes shbreathe{50%{transform:scale(1.07)}}
#shop .sh-play{position:absolute;right:14px;bottom:14px;z-index:5;width:78px;height:78px;border-radius:50%;border:5px solid #1c1640;background:radial-gradient(circle at 35% 30%,#a6f59a,#3fbf4a 60%);color:#fff;font-size:34px;line-height:1;
  -webkit-text-stroke:2px #1c1640;paint-order:stroke fill;box-shadow:0 7px 0 #1c1640;display:none;align-items:center;justify-content:center;padding:0 0 0 6px}
#shop .sh-pv.own .sh-play{display:flex}
@media (prefers-reduced-motion:no-preference){#shop .sh-pv.own .sh-play{animation:shbreathe 1.8s ease-in-out infinite}}
#shop .sh-bal{position:absolute;left:12px;top:12px;z-index:5;display:none;align-items:center;gap:5px;height:38px;padding:0 12px 0 6px;border-radius:19px;background:rgba(255,255,255,.94);border:3px solid #1c1640;color:#1c1640;font-weight:900;font-size:18px;box-shadow:0 3px 0 #1c1640}
#shop .sh-bal svg{width:28px;height:28px}
#shop .sh-pv.own .sh-bal{display:flex}
#shop .sh-reel{position:relative;z-index:2;flex:none}
#shop .sh-fly{position:fixed;left:0;top:0;z-index:90;pointer-events:none}
#shop .sh-pv.opening .sh-lock{display:flex;animation:shopen .6s ease-in forwards}
@keyframes shopen{to{opacity:0;transform:scale(1.4)}}
`;
  let root = null, C = null, reel = null, cur = null, liveT = 0, liveTok = 0, built = false;
  const snd = (f, d, ty, v) => { if (C && C.blip) try { C.blip(f, d, ty, v); } catch (e) { /* no audio */ } };
  const fx = n => { const s = C && C.sfx; if (s && s[n]) try { s[n](); } catch (e) { /* no audio */ } };
  function build() {
    if (built) return; built = true;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'shop'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Skins');
    root.innerHTML = '<div class="sh-bg"></div><div class="sh-top"><button class="sh-x" aria-label="Close">✕</button>' +
      '<div class="sh-tks" role="status"></div><button class="sh-deli" aria-label="Ticket deli">' + DELI_IC + '<i class="tdot" hidden></i></button></div>' +
      '<div class="sh-stage"><div class="sh-pv"><div class="sh-art"></div><iframe class="sh-live" tabindex="-1" aria-hidden="true" allow="autoplay" title="Preview"></iframe>' +
      '<div class="sh-lock"></div><span class="sh-bal"></span><button class="sh-play">▶</button></div></div><div class="sh-reel"></div>';
    document.body.appendChild(root);
    root.querySelector('.sh-x').onclick = close;
    root.querySelector('.sh-deli').onclick = () => openDeli();
    root.querySelector('.sh-play').onclick = () => { if (cur && C.onPlay) { snd(880, .1, 'triangle', .05); C.onPlay(cur.id); } };
    root.addEventListener('keydown', e => { if (e.key === 'Escape' && !(window.FTH_DELI && FTH_DELI.isOn())) close(); });
    addEventListener('resize', () => { if (root.classList.contains('on')) fit(); });
  }
  function open(ctx, focusId) {
    C = ctx; build();
    const items = C.order || C.skins;
    if (reel) reel.destroy();
    root._from = document.activeElement; root.classList.add('on');
    const at = focusId || (C.current && C.current()) || START;
    cur = null;
    reel = RL().create(root.querySelector('.sh-reel'), { items, owns: id => owns(C.save, id), at, label: 'Skins', current: C.current,
      h: Math.round(Math.max(118, Math.min(172, innerHeight * .2))), lh: 40,
      onTick: () => snd(1250, .03, 'triangle', .018),
      onSettle: k => show(k),
      onTap: k => { if (!owns(C.save, k.id)) { const b = root.querySelector('.sh-big'); if (b) b.click(); } else snd(880, .08, 'triangle', .04); } });
    show(reel.spec()); head();
    setTimeout(() => reel.el.focus(), 40);
  }
  function close() {
    if (!root || !root.classList.contains('on')) return;
    if (window.FTH_DELI) FTH_DELI.close();
    stopLive(); root.classList.remove('on');
    if (reel) { reel.destroy(); reel = null; }
    if (C && C.onClose) C.onClose(); if (root._from && root._from.focus) root._from.focus();
  }
  function head() {
    const s = state(C.save);
    root.querySelector('.sh-tks').innerHTML = tk(42) + '×' + s.tickets;
    root.querySelector('.sh-tks').setAttribute('aria-label', 'Tickets: ' + s.tickets);
    root.querySelector('.sh-deli .tdot').hidden = !canBuy(C);
  }
  // ---- the preview of the centred skin
  function fit() {
    const pv = root.querySelector('.sh-pv'), W = pv.clientWidth, H = pv.clientHeight, kb = root.querySelector('.sh-kb');
    if (kb) { const w = Math.max(W, H * .75) * 1.02; kb.style.width = w + 'px'; kb.style.height = (w / .75) + 'px'; }
    const f = root.querySelector('.sh-live'), s = .74; f.style.width = (W / s) + 'px'; f.style.height = (H / s) + 'px'; f.style.transform = 'scale(' + s + ')';
  }
  function stopLive() { clearTimeout(liveT); liveTok++; const f = root && root.querySelector('.sh-live'); if (f) { f.classList.remove('on'); if (f.getAttribute('src') !== 'about:blank') f.src = 'about:blank'; } }
  function show(k) {
    if (!k) return;
    const same = cur && cur.id === k.id; cur = k;
    const pv = root.querySelector('.sh-pv'), own = owns(C.save, k.id), T = C.theme ? C.theme(k) : (k.theme || {});
    pv.classList.toggle('own', own); pv.classList.toggle('lock', !own);
    root.querySelector('.sh-bg').style.background = T['--sk-bg'] || '#14183a';
    if (!same) { root.querySelector('.sh-art').innerHTML = '<div class="sh-kb">' + RL().scene(k) + '</div>'; }
    const coin = R.coinOf(k);
    root.querySelector('.sh-bal').innerHTML = coin.svg(28) + fmt(bal(C.save, k.id));
    root.querySelector('.sh-bal').setAttribute('aria-label', fmt(bal(C.save, k.id)) + ' ' + coin.plural);
    root.querySelector('.sh-play').setAttribute('aria-label', 'Play ' + k.name);
    lockUi(k); fit();
    if (own && C.onSelect) { C.onSelect(k.id); if (reel) reel.refresh(); }
    if (!same) { stopLive(); if (k.src && LIVE[k.id]) { const tok = liveTok; liveT = setTimeout(() => live(k, tok), 380); } }
  }
  function lockUi(k) {
    const L = root.querySelector('.sh-lock'), s = state(C.save);
    if (owns(C.save, k.id)) { L.innerHTML = ''; return; }
    L.innerHTML = s.tickets > 0 ? '<button class="sh-big use" aria-label="Unlock ' + esc(k.name) + ' with a ticket">' + tk(84) + '×1</button>'
      : '<button class="sh-big deli" aria-label="Get a ticket at the deli">' + DELI_IC + tk(60) + '<span class="plus">+</span></button>';
    const b = L.querySelector('.sh-big');
    b.onclick = () => (s.tickets > 0 ? unlock(k) : openDeli());
  }
  function live(k, tok) {
    if (tok !== liveTok || !root.classList.contains('on')) return;
    const f = root.querySelector('.sh-live');
    f.onload = () => {
      if (tok !== liveTok) return;
      const w = f.contentWindow;
      try {                                          // the page wears its own skin's tokens, not the shell's current skin
        if (w.LAB_DEMO_ERROR) return stopLive();
        w.addEventListener('error', () => { if (tok === liveTok) stopLive(); });
        w.postMessage({ fth: 1, cmd: 'tokens', vars: C.theme ? C.theme(k) : (k.theme || {}) }, '*');
      } catch (e) { /* gone */ }
      setTimeout(() => { if (tok !== liveTok) return; try { if (w.LAB_DEMO_ERROR || !w.LAB) return stopLive(); } catch (e) { return stopLive(); } f.classList.add('on'); }, 450);
    };
    f.src = k.src + '?lvl=' + encodeURIComponent(C.lvl ? C.lvl() : 'splash') + '&embed=1&hud=minimal&demo=1';
  }
  // ---- spend a ticket: the ticket flies from the counter into the preview and the lock bursts open
  function unlock(k) {
    const from = root.querySelector('.sh-big') || root.querySelector('.sh-tks'), fr = from.getBoundingClientRect();
    if (!use(C, k.id)) { fx('nope'); return; }
    const pv = root.querySelector('.sh-pv'), pr = pv.getBoundingClientRect(), done = () => {
      pv.classList.remove('opening'); head(); reel.refresh(); cur = null; show(k);
      if (C.onUnlock) C.onUnlock(k.id);
      if (reel) reel.refresh();
      if (C.say) C.say('unlock');
    };
    fx('find'); snd(523, .1, 'triangle', .05);
    if (reduced() || !document.body.animate) return done();
    const d = document.createElement('div'); d.className = 'sh-fly'; d.innerHTML = tk(96); root.appendChild(d);
    const x0 = fr.left + fr.width / 2 - 48, y0 = fr.top + fr.height / 2 - 30, x1 = pr.left + pr.width / 2 - 48, y1 = pr.top + pr.height * .42 - 30;
    d.animate([{ transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1) rotate(0)' }, { transform: 'translate(' + x1 + 'px,' + (y1 - 60) + 'px) scale(2.2) rotate(-12deg)', offset: .55 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(1.5) rotate(4deg)', offset: .8 }, { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(0) rotate(30deg)', opacity: 0 }], { duration: 900, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => d.remove();
    setTimeout(() => { pv.classList.add('opening'); fx('thump'); burst(pr.left + pr.width / 2, pr.top + pr.height * .42); }, 620);
    setTimeout(() => { fx('flourish'); done(); }, 1180);
  }
  function burst(x, y) {
    const col = ['#ff6a45', '#4aa8ff', '#ffd84a', '#62d96a', '#fff'];
    for (let i = 0; i < 22; i++) {
      const d = document.createElement('div'); d.className = 'sh-fly';
      d.innerHTML = '<svg width="22" height="22" viewBox="-11 -11 22 22"><path d="M0-10L3-3 10 0 3 3 0 10-3 3-10 0-3-3Z" fill="' + col[i % 5] + '" stroke="#1c1640" stroke-width="1.8"/></svg>';
      root.appendChild(d);
      const a = i / 22 * Math.PI * 2 + (i % 2) * .2, r = 90 + (i * 37 % 70);
      d.animate([{ transform: 'translate(' + (x - 11) + 'px,' + (y - 11) + 'px) scale(.3)', opacity: 1 }, { transform: 'translate(' + (x - 11 + Math.cos(a) * r) + 'px,' + (y - 11 + Math.sin(a) * r) + 'px) scale(1.3) rotate(220deg)', opacity: 0 }],
        { duration: 800, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'forwards' }).onfinish = () => d.remove();
    }
  }
  function openDeli() {
    if (!window.FTH_DELI) return;
    snd(523, .08, 'triangle', .04);
    FTH_DELI.open(C, { onBought: () => { head(); if (cur) lockUi(cur); bump(); }, onClose: () => { head(); if (cur) lockUi(cur); if (reel) reel.el.focus(); } });
  }
  function bump() {
    const t = root.querySelector('.sh-tks'); fx('star');
    if (t.animate && !reduced()) t.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.3,1.7,.5,1)' });
  }

  window.FTH_TICKETS = { START, GATE, PRICE, LIVE, state, owns, next, canBuy, buy, use, coinsFor, open, close };
})();
