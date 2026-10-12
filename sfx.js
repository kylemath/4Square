// 4square win-scene sound effects: every one synthesized with WebAudio (no files), short and soft, scheduled on the audio clock.
//   const sfx = FTH_SFX.create({ ctx: () => AudioContext, on: () => bool });  sfx.sweep(); sfx.nope(); ...
// `ctx` is the shell's shared context (so the existing blip/shepard sounds and these share one device); `on()` is the sound gate:
// when it says no (or there is no AudioContext) every effect is a silent no-op. All voices go through one master bus with a
// gentle compressor, so layered effects cannot clip. sfx.trace = true records each effect fired in sfx.log ([ms, name]).
(function () {
  'use strict';
  const PENT = [0, 2, 4, 7, 9], semi = (f, n) => f * Math.pow(2, n / 12);
  function create(host) {
    let master = null, mctx = null;
    const api = { log: [], trace: false };
    function bus(name) {                           // -> { c, t } when sound is on, else null
      let c = null; try { c = host.on() ? host.ctx() : null; } catch (e) { return null; }
      if (!c) return null;
      try { if (c.state === 'suspended' && c.resume) { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } } catch (e) { /* offline or busy */ }
      if (!master || mctx !== c) {
        mctx = c; const comp = c.createDynamicsCompressor();
        comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 8; comp.attack.value = .003; comp.release.value = .15;
        master = c.createGain(); master.gain.value = .72; master.connect(comp); comp.connect(c.destination);
      }
      if (api.trace) api.log.push([performance.now(), name]);
      return { c, t: c.currentTime + .005 };
    }
    function tone(B, f0, f1, dur, type, vol, at, o) {   // one oscillator voice: pitch glide f0 -> f1, fast attack, exponential decay
      o = o || {}; const c = B.c, t = B.t + (at || 0), osc = c.createOscillator(), g = c.createGain();
      osc.type = type; osc.frequency.setValueAtTime(f0, t); if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + (o.a || .008)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); f.connect(g); } else osc.connect(g);
      g.connect(master); osc.start(t); osc.stop(t + dur + .03);
    }
    function hiss(B, dur, vol, at, f0, f1, q) {         // a band of noise whose centre glides f0 -> f1 (a click, a whoosh, a crowd)
      const c = B.c, t = B.t + (at || 0), n = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.Q.value = q || 1.2; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.03, dur / 3)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(master); src.start(t);
    }
    const E = {
      // the lights come on over the whole island: a bright rising whoosh
      sweep() { const B = bus('sweep'); if (!B) return; tone(B, 260, 1100, .38, 'sine', .035); tone(B, 520, 2200, .3, 'triangle', .012, .04); hiss(B, .3, .012, 0, 1500, 5000, 1.5); },
      // an element is tried in the goal: a short two-note boop, a different pitch per element
      tryTone(e) { const B = bus('tryTone'); if (!B) return; const f = [330, 392, 440, 523][e % 4]; tone(B, f, f * 1.07, .13, 'triangle', .045); tone(B, f * 2, f * 2.1, .08, 'sine', .012, .02); },
      // a rejected element: a soft buzzy double "nuh-uh" (sawtooth through a lowpass)
      nope() { const B = bus('nope'); if (!B) return; tone(B, 200, 125, .14, 'sawtooth', .03, 0, { lp: 750 }); tone(B, 155, 96, .18, 'sawtooth', .028, .1, { lp: 620 }); },
      // the meek flicker of the right element: three rising hopeful peeps (k = 0, 1, 2)
      hunt(k) { const B = bus('hunt'); if (!B) return; const f = 440 * Math.pow(1.19, k); tone(B, f, f * 1.18, .1, 'triangle', .03 + .008 * k); tone(B, f * 1.5, f * 1.8, .08, 'sine', .01, .01); },
      // the right element is found: a long rising sweep that shimmers
      find() { const B = bus('find'); if (!B) return; tone(B, 220, 880, .5, 'triangle', .04); tone(B, 330, 1320, .5, 'sine', .02, .03); tone(B, 660, 1760, .35, 'sine', .01, .15); },
      // the low thump on each beat of the wriggle (`at`: seconds from now)
      thump(at) { const B = bus('thump'); if (!B) return; tone(B, 125, 52, .15, 'sine', .085, at || 0, { a: .004 }); },
      // the hole fills: a thunk, a click, and a bright ding
      thunk() { const B = bus('thunk'); if (!B) return; tone(B, 175, 58, .17, 'sine', .09, 0, { a: .004 }); hiss(B, .05, .05, 0, 2400, 1400, 2); tone(B, 880, 880, .36, 'triangle', .03, .05); tone(B, 1320, 1320, .3, 'sine', .018, .05); },
      // an element lights across the map: a quick pentatonic arpeggio, each element a little higher (i = 0, 1, 2, ...)
      sparkle(i) { const B = bus('sparkle'); if (!B) return; const base = semi(392, 2 * i); for (let j = 0; j < 4; j++) tone(B, semi(base, PENT[j]) * 2, semi(base, PENT[j]) * 2.02, .12, 'triangle', .028, j * .045); },
      // ... under a soft major chord that swells
      swell(i) { const B = bus('swell'); if (!B) return; const base = semi(262, 3 * i); [1, 1.26, 1.5].forEach(m => tone(B, base * m, base * m, .5, 'sine', .022, 0, { a: .07 })); },
      // a star on the win card: a bell chime of rising pitch (got) or a dull tick (missed)
      star(i, got) { const B = bus('star'); if (!B) return; if (!got) { tone(B, 210, 190, .14, 'sine', .028); return; } const f = 660 * Math.pow(1.26, i); tone(B, f, f, .5, 'sine', .05, 0, { a: .004 }); tone(B, f * 2.76, f * 2.76, .28, 'sine', .014); tone(B, f * 4.1, f * 4.1, .16, 'sine', .007); },
      // the win card opens: a crowd "yay" (a rising band of noise) with a pair of bright notes
      cheer() { const B = bus('cheer'); if (!B) return; hiss(B, .5, .045, 0, 700, 1900, .9); tone(B, 523, 523, .28, 'triangle', .03); tone(B, 784, 784, .32, 'triangle', .03, .1); },
      // the loot has landed: a flourish, a rising major arpeggio ending on a held chord
      flourish() { const B = bus('flourish'); if (!B) return; [523, 659, 784, 1047, 1319].forEach((f, j) => tone(B, f, f, .22, 'triangle', .04, j * .07)); [1047, 1319, 1568].forEach(f => tone(B, f, f, .8, 'sine', .022, .3, { a: .02 })); },
    };
    Object.keys(E).forEach(k => { api[k] = (...a) => { try { E[k](...a); } catch (e) { /* no audio: stay quiet */ } }; });
    return api;
  }
  window.FTH_SFX = { create };
})();
