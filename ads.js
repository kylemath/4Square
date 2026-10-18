/* ads.js: Google AdSense for 4square. Two placements, each with its own switch:
 *   banner   a 320 x 50 display unit at the foot of the level map (#menu), never over the board or a win card.
 *   between  an H5 Games Ads interstitial when the player taps NEXT on the win card (adBreak type 'next'). Google decides
 *            whether an ad actually shows and caps how often (frequencyHint); the next level starts when it closes.
 *            Needs H5 Games Ads approval on the AdSense account (https://adsense.google.com/start/h5-beta/).
 *
 * URL overrides: ?ads=off (no ads at all), ?ads=test (banner placeholder, no network), ?ads=h5 (switch `between` on for
 * this visit, with Google's test ads). Off the published domains the test flags are always on, so impressions and clicks
 * are never counted. Never in lab mode (?lab=).
 *
 * The publisher id is public (it is in every ad and in ads.txt). AdSense also needs ads.txt at the site root and, for
 * visitors in the EEA, UK and Switzerland, a Google-certified consent message (AdSense > Privacy & messaging).
 */
window.FTH_ADS = {
  client: 'ca-pub-7680225514669783',
  slot: '5167792035',                  // display unit "4square level map", fixed 320 x 50; '' switches the banner off
  between: false,                      // true once H5 Games Ads is approved: an interstitial between levels
  frequencyHint: '120s',               // at most about one interstitial every two minutes
};
(function () {
  const q = new URLSearchParams(location.search), cfg = window.FTH_ADS, mode = q.get('ads');
  const test = mode === 'test' || mode === 'h5';
  const live = /(^|\.)4square\.studio$|^kylemath\.github\.io$/.test(location.hostname);
  const off = q.has('lab') || mode === 'off' || !cfg || !cfg.client;
  const banner = !off && (cfg.slot || test), between = !off && (cfg.between === true || mode === 'h5');
  const testFlags = test || !live;
  if (cfg) cfg.adBreak = (go) => go();   // replaced below when the interstitial is on

  let loaded = false;
  function load() {                    // Google's ad script, once, shared by both placements
    if (loaded) return; loaded = true;
    const s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(cfg.client);
    if (between) { s.dataset.adFrequencyHint = cfg.frequencyHint; if (testFlags) s.dataset.adbreakTest = 'on'; }
    document.head.appendChild(s);
    window.adsbygoogle = window.adsbygoogle || [];
  }

  if (between) load();                 // before the banner's push, so the script tag carries the H5 attributes

  if (banner) {
    const bar = document.getElementById('adBar');
    if (bar) {
      bar.hidden = false; document.body.classList.add('ads');
      if (!cfg.slot || mode === 'test') bar.innerHTML = '<div class="adph">ad · 320 × 50</div>';
      else {
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.cssText = 'display:inline-block;width:320px;height:50px';
        ins.dataset.adClient = cfg.client; ins.dataset.adSlot = cfg.slot;
        if (testFlags) ins.dataset.adtest = 'on';
        bar.appendChild(ins);
        load(); window.adsbygoogle.push({});
      }
    }
  }

  if (between) {
    const push = o => window.adsbygoogle.push(o);
    push({ preloadAdBreaks: 'on', sound: 'on' });                                       // adConfig
    // go() runs exactly once: when the break is done, or after 1.5 s if Google never started an ad (script blocked,
    // offline, not approved yet), so a missing ad can never strand the player on the win card
    cfg.adBreak = (go, hooks) => {
      let done = false, started = false;
      const finish = () => { if (done) return; done = true; go(); };
      setTimeout(() => { if (!started) finish(); }, 1500);
      push({ type: 'next', name: 'level-next',
        beforeAd: () => { started = true; if (hooks && hooks.pause) hooks.pause(); },
        afterAd: () => { if (hooks && hooks.resume) hooks.resume(); },
        adBreakDone: finish });
    };
  }
})();
