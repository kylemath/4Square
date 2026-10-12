/* tickets.js: skin tickets. A new player owns only Islands; every other skin is unlocked with a ticket.
 *
 * Ticket n (the first one is n = 1) can be bought once BOTH hold:
 *   - levels beaten >= GATE[n - 1]                                         (play further each time)
 *   - one wallet holds PRICE[n - 1] points' worth of its own coins          (earn more each time)
 * A price is set in points, the game's internal unit, and shown in each coin as ceil(points x FTH_SKINS.rate(skin)): the
 * same rate play pays, so every currency costs the same effort. It is paid from ONE wallet (the exchange is on the
 * feature bench, see README), never split. A ticket unlocks any locked skin, the player's choice.
 *
 * save.skins = { own: ['islands', ...], tickets: 0, bought: 0 }   (sealed with the rest of the save, see integrity.js)
 *
 * The rules are pure (FTH_TICKETS.next / canBuy / buy / use work on a plain ctx and run in node: tools/tickets_check.js);
 * open() draws the shop sheet with the skin's --sk-* tokens.
 *   ctx = { save, skins: [spec], beaten: () => n, persist(), onUnlock(id), say(text) }
 */
(function () {
  'use strict';
  const START = 'islands';
  // levels beaten before ticket n, and its price in points. Calibrated on clean 3-star play of the 29 levels, bonus rounds
  // not counted (tools/tickets_check.js prints the table against measured earnings): the first ticket is about one
  // level's pay, and each later one comes a little further on and costs a little more.
  const GATE = [1, 3, 5, 8, 11, 14, 17, 21, 25];
  const PRICE = [900, 1400, 1900, 2500, 3000, 3600, 4200, 4900, 5600];
  const R = (window.FTH_SKINS || {});

  // ---------------------------------------------------------------- rules
  function state(save) {
    const s = save.skins || (save.skins = { own: [START], tickets: 0, bought: 0 });
    if (!Array.isArray(s.own)) s.own = [START];
    if (!s.own.includes(START)) s.own.unshift(START);
    s.tickets = s.tickets | 0; s.bought = s.bought | 0;
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
    const pay = ctx.skins.filter(k => owns(ctx.save, k.id) || bal(ctx.save, k.id) > 0)       // any wallet with coins (incl. one earned before skins were locked)
      .map(k => ({ id: k.id, spec: k, price: coinsFor(pts, k), bal: bal(ctx.save, k.id) }))
      .map(w => Object.assign(w, { ok: w.bal >= w.price, frac: Math.min(1, w.bal / w.price) }))
      .sort((a, b) => (b.ok - a.ok) || (b.frac - a.frac));
    return { n, of: GATE.length, gate, beaten, gateOk: beaten >= gate, pts, pay };
  }
  const canBuy = ctx => { const t = next(ctx); return !!t && t.gateOk && t.pay.some(w => w.ok); };
  function buy(ctx, payId) {                        // spend one wallet's coins on the next ticket
    const t = next(ctx); if (!t || !t.gateOk) return false;
    const w = t.pay.find(x => x.id === payId); if (!w || !w.ok) return false;
    const s = state(ctx.save); ctx.save.wallet[payId].bal -= w.price; s.tickets++; s.bought++;
    ctx.persist(); log('ticket_buy', { n: t.n, pay: payId, price: w.price }); return true;
  }
  function use(ctx, id) {                           // a ticket unlocks any locked skin
    const s = state(ctx.save); if (s.tickets < 1 || owns(ctx.save, id) || !ctx.skins.some(k => k.id === id)) return false;
    s.tickets--; s.own.push(id); ctx.persist(); log('ticket_use', { skin: id, n: s.own.length }); return true;
  }
  const log = (t, d) => { if (window.FTH_LOG) FTH_LOG.ev(t, d); };

  // ---------------------------------------------------------------- the shop sheet
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.floor(n).toLocaleString('en');
  const CSS = `
#shop{position:fixed;inset:0;z-index:70;display:none;flex-direction:column;background:var(--sk-bg);color:var(--sk-ink,#fff);font-family:var(--sk-font,system-ui,sans-serif);padding:max(10px,env(safe-area-inset-top)) 14px max(12px,env(safe-area-inset-bottom));overflow:hidden}
#shop.on{display:flex}
#shop *{box-sizing:border-box}
#shop .sh-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
#shop h2{margin:0;font-size:22px;flex:1;letter-spacing:.02em}
#shop button{font:inherit;cursor:pointer;min-height:40px}
#shop .sh-x{width:44px;height:44px;border-radius:50%;border:2px solid var(--sk-edge,color-mix(in srgb,var(--sk-card-ink,#fff) 30%,transparent));background:var(--sk-btn2,var(--sk-card));color:var(--sk-btn2-ink,var(--sk-card-ink,#fff));font-size:20px;line-height:1}
#shop .sh-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:12px}
#shop .sh-card{border-radius:var(--sk-radius,18px);background:var(--sk-card);color:var(--sk-card-ink,#e6edf3);padding:12px 14px}
#shop h3{margin:0 0 8px;font-size:16px;display:flex;align-items:center;gap:8px}
#shop .sh-tk{font-size:26px;line-height:1}
#shop .sh-step{display:flex;align-items:center;gap:10px;margin:8px 0}
#shop .sh-step .ic{width:26px;text-align:center;font-size:18px;flex:none}
#shop .sh-step .lb{flex:1;font-size:14px;line-height:1.3}
#shop .sh-step .lb small{display:block;opacity:.75;font-size:12px}
#shop .sh-bar{height:10px;border-radius:99px;background:color-mix(in srgb,var(--sk-card-ink,#fff) 16%,transparent);overflow:hidden;margin-top:4px}
#shop .sh-bar i{display:block;height:100%;border-radius:99px;background:var(--sk-accent,#ffd84a)}
#shop .sh-done{color:var(--sk-accent,#ffd84a);font-weight:800}
#shop .sh-btn{border-radius:14px;border:2px solid transparent;padding:8px 14px;font-weight:800;background:var(--sk-btn);color:var(--sk-btn-ink,#fff);box-shadow:0 3px 0 var(--sk-btn-shadow,rgba(0,0,0,.35))}
#shop .sh-btn.alt{background:transparent;color:inherit;border-color:color-mix(in srgb,var(--sk-card-ink,#fff) 40%,transparent);box-shadow:none}
#shop .sh-btn[disabled]{opacity:.45;cursor:not-allowed}
#shop .sh-btn.arm{background:var(--sk-accent,#ffd84a);color:var(--sk-btn-ink,#111)}
#shop .sh-coin{display:inline-flex;vertical-align:-5px}
#shop .sh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
#shop .sh-skin{display:flex;flex-direction:column;gap:6px;align-items:flex-start;padding:10px;border-radius:14px;border:2px solid color-mix(in srgb,var(--sk-card-ink,#fff) 22%,transparent);background:color-mix(in srgb,var(--sk-card-ink,#fff) 6%,transparent);text-align:left;color:inherit}
#shop .sh-skin .nm{font-weight:800;font-size:15px;display:flex;gap:6px;align-items:center}
#shop .sh-skin .bl{font-size:12px;opacity:.8;line-height:1.3;min-height:2.6em}
#shop .sh-skin.focus{border-color:var(--sk-accent,#ffd84a)}
#shop .sh-skin.own{opacity:.75}
#shop .sh-note{font-size:13px;opacity:.85;margin:6px 0 0;line-height:1.35}
#shop :focus-visible{outline:3px solid var(--sk-accent);outline-offset:2px}
@media (prefers-reduced-motion:no-preference){#shop .sh-pop{animation:shpop .5s cubic-bezier(.3,1.6,.5,1)}@keyframes shpop{0%{transform:scale(.6)}100%{transform:scale(1)}}}
`;
  let root = null, C = null, focus = null, armed = '';
  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'shop'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'shopTitle');
    root.innerHTML = '<div class="sh-head"><h2 id="shopTitle">🎟️ Skins</h2><button class="sh-x" aria-label="Close">✕</button></div><div class="sh-body" aria-live="polite"></div>';
    document.body.appendChild(root);
    root.querySelector('.sh-x').onclick = close;
    root.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  function open(ctx, focusId) {
    C = ctx; focus = focusId || null; armed = ''; build(); render();
    root._from = document.activeElement; root.classList.add('on'); setTimeout(() => root.querySelector('.sh-x').focus(), 30);
  }
  function close() { if (!root) return; root.classList.remove('on'); if (C && C.onClose) C.onClose(); if (root._from && root._from.focus) root._from.focus(); }
  const coin = (k, z) => '<span class="sh-coin">' + R.coinOf(k).svg(z || 18) + '</span>';
  const plural = (k, n) => n === 1 ? R.coinOf(k).name : R.coinOf(k).plural;
  function render(flash) {
    const s = state(C.save), t = next(C), L = locked(C), body = root.querySelector('.sh-body');
    let h = '';
    if (flash) h += '<div class="sh-card sh-pop"><h3><span class="sh-tk">' + flash.ic + '</span>' + esc(flash.text) + '</h3>' + (flash.play ? '<button class="sh-btn" data-play="' + esc(flash.play) + '">Play ' + esc(flash.name) + ' ▶</button>' : '') + '</div>';
    if (s.tickets > 0) h += '<div class="sh-card"><h3><span class="sh-tk">🎟️</span>You have ' + s.tickets + ' skin ticket' + (s.tickets > 1 ? 's' : '') + '!</h3><p class="sh-note">Pick any locked skin below to unlock it.</p></div>';
    if (t) {
      const gb = Math.min(1, t.beaten / t.gate), best = t.pay[0];
      h += '<div class="sh-card"><h3><span class="sh-tk">🎟️</span>Ticket ' + t.n + ' of ' + t.of + '</h3>' +
        '<div class="sh-step"><span class="ic" aria-hidden="true">' + (t.gateOk ? '✅' : '🏁') + '</span><span class="lb">Beat ' + t.gate + ' level' + (t.gate > 1 ? 's' : '') +
        (t.gateOk ? ' <span class="sh-done">done</span>' : '<small>' + t.beaten + ' of ' + t.gate + ' beaten</small>') + '<span class="sh-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + t.gate + '" aria-valuenow="' + Math.min(t.beaten, t.gate) + '" aria-label="Levels beaten"><i style="width:' + (gb * 100).toFixed(1) + '%"></i></span></span></div>' +
        '<div class="sh-step"><span class="ic" aria-hidden="true">' + (best && best.ok ? '✅' : '💰') + '</span><span class="lb">Pay from one wallet<small>Coins you earn in a skin buy tickets. Any one wallet will do.</small></span></div>' +
        t.pay.map(w => {
          const go = t.gateOk && w.ok, key = 'buy:' + w.id;
          return '<div class="sh-step"><span class="ic">' + coin(w.spec, 22) + '</span><span class="lb">' + fmt(w.bal) + ' / ' + fmt(w.price) + ' ' + esc(plural(w.spec, w.price)) + '<small>' + esc(w.spec.name) + (w.ok ? '' : ': ' + fmt(w.price - w.bal) + ' more to earn') + '</small>' +
            '<span class="sh-bar" aria-hidden="true"><i style="width:' + (w.frac * 100).toFixed(1) + '%"></i></span></span>' +
            '<button class="sh-btn' + (armed === key ? ' arm' : '') + '" data-buy="' + esc(w.id) + '" ' + (go ? '' : 'disabled') + ' aria-label="Buy ticket ' + t.n + ' for ' + fmt(w.price) + ' ' + esc(plural(w.spec, w.price)) + '">' + (armed === key ? 'Sure?' : 'Buy') + '</button></div>';
        }).join('') + (t.gateOk ? '' : '<p class="sh-note">Keep playing: beat ' + (t.gate - t.beaten) + ' more level' + (t.gate - t.beaten > 1 ? 's' : '') + ' to open this ticket.</p>') + '</div>';
    } else if (!L.length) h += '<div class="sh-card"><h3><span class="sh-tk">🏆</span>Every skin is yours!</h3><p class="sh-note">Pick any of them on the title screen.</p></div>';
    if (L.length) h += '<div class="sh-card"><h3>Locked skins</h3><div class="sh-grid">' + L.map(k => {
      const key = 'use:' + k.id;
      return '<div class="sh-skin' + (k.id === focus ? ' focus' : '') + '"><span class="nm"><span aria-hidden="true">' + esc(k.ic) + '</span>' + esc(k.name) + '</span><span class="bl">' + esc(k.blurb || '') + '</span>' +
        '<span class="bl">Earns ' + coin(k, 16) + ' ' + esc(R.coinOf(k).plural) + '</span>' +
        '<button class="sh-btn' + (armed === key ? ' arm' : ' alt') + '" data-use="' + esc(k.id) + '" ' + (s.tickets > 0 ? '' : 'disabled') + '>' + (s.tickets > 0 ? (armed === key ? 'Use ticket?' : '🎟️ Unlock') : '🔒 Needs a ticket') + '</button></div>';
    }).join('') + '</div></div>';
    const own = C.skins.filter(k => owns(C.save, k.id));
    h += '<div class="sh-card"><h3>Your skins</h3><div class="sh-grid">' + own.map(k => '<div class="sh-skin own"><span class="nm"><span aria-hidden="true">' + esc(k.ic) + '</span>' + esc(k.name) + '</span><span class="bl">' + coin(k, 16) + ' ' + fmt(bal(C.save, k.id)) + ' ' + esc(R.coinOf(k).plural) + '</span></div>').join('') + '</div></div>';
    body.innerHTML = h;
    body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const key = 'buy:' + b.dataset.buy; if (armed !== key) { armed = key; return render(); }
      armed = ''; if (buy(C, b.dataset.buy)) { if (C.say) C.say('buy'); render({ ic: '🎟️', text: 'Ticket bought! Choose a skin to unlock.' }); body.scrollTop = 0; } else render();
    });
    body.querySelectorAll('[data-use]').forEach(b => b.onclick = () => {
      const key = 'use:' + b.dataset.use; if (armed !== key) { armed = key; return render(); }
      armed = ''; const k = C.skins.find(j => j.id === b.dataset.use);
      if (use(C, k.id)) { if (C.say) C.say('unlock'); render({ ic: k.ic, text: k.name + ' unlocked!', play: k.id, name: k.name }); body.scrollTop = 0; } else render();
    });
    body.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { if (C.onUnlock) C.onUnlock(b.dataset.play); close(); });
  }

  window.FTH_TICKETS = { START, GATE, PRICE, state, owns, next, canBuy, buy, use, coinsFor, open, close };
})();
