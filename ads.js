/* ads.js: an optional banner at the foot of the level map (#menu), never over the board or a win card. Off by default.
 *
 * Three modes:
 *   off  (default)      nothing is drawn and nothing is loaded.
 *   ?ads=test           a grey 320 x 50 placeholder where the banner would go; no network, for trying the layout.
 *   live                set window.FTH_ADS below to your AdSense publisher and ad-unit ids (AdSense > Ads > By ad unit >
 *                       Display ads, a fixed 320 x 50 unit). Off the published domains, and with ?ads=test, Google's
 *                       test flag (data-adtest="on") is set so impressions and clicks are never counted.
 *
 * window.FTH_ADS = {
 *   client: 'ca-pub-XXXXXXXXXXXXXXXX',   // AdSense > Account > Account information > Publisher ID
 *   slot: '1234567890',                  // the display ad unit's data-ad-slot
 * };
 *
 * AdSense also needs ads.txt at the site root and, for visitors in the EEA, UK and Switzerland, a Google-certified
 * consent message (AdSense > Privacy & messaging). Neither lives here.
 */
window.FTH_ADS = null;
(function () {
  const q = new URLSearchParams(location.search);
  const test = q.get('ads') === 'test', cfg = window.FTH_ADS;
  if (q.has('lab') || q.get('ads') === 'off' || !(test || cfg && cfg.client && cfg.slot)) return;
  const live = /(^|\.)4square\.studio$|^kylemath\.github\.io$/.test(location.hostname);
  const bar = document.getElementById('adBar'); if (!bar) return;
  bar.hidden = false; document.body.classList.add('ads');
  if (!cfg || !cfg.client) { bar.innerHTML = '<div class="adph">ad · 320 × 50</div>'; return; }
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.cssText = 'display:inline-block;width:320px;height:50px';
  ins.dataset.adClient = cfg.client; ins.dataset.adSlot = cfg.slot;
  if (test || !live) ins.dataset.adtest = 'on';
  bar.appendChild(ins);
  const s = document.createElement('script');
  s.async = true; s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(cfg.client);
  document.head.appendChild(s);
  (window.adsbygoogle = window.adsbygoogle || []).push({});
})();
