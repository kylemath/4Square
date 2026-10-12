// Islands Free: the Islands art on a board with no walls. The three far regions become tiles like the rest and the
// whole map spreads out and settles like soft bubbles; links may cross, nothing is held in place. Same renderer as
// Islands (board/island.js), another configuration. The numbers start from the dev-panel values (home and bridge
// springs 0, damping .53, swing .38, link pull .065) and were tuned over every level and screen size with
// tools/free_check.js: bubble push 2.5 (settles in ~270 steps instead of ~600), bubble size 1.15 (a hexagonal packing
// that fills about the whole island; the layout settles offline before the first frame, so the island opens at rest).
FTH_SKINS.register(FTH_SKINS.extend('islands', {
  id: 'islands-free', name: 'Islands Free', ic: '🫧', blurb: 'no walls: tiles drift like bubbles',
  coin: { name: 'pearl', plural: 'pearls', glyph: '🦪', value: 60, pitch: 1.25,   // this skin's currency (SKIN-SPEC.md section 12)
    colors: { main: '#fdf6ff', edge: '#d9587f' },
    svg: FTH_SKINS.coinArt('<path d="M-11.5 3.5C-13.5 -6 -6.5 -11.4 0 -11.8C6.5 -11.4 13.5 -6 11.5 3.5C8 10.5 -8 10.5 -11.5 3.5Z" fill="#ff9fb8" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/><path d="M0 -10.6V8M-5.6 -9.2L-4.6 8M5.6 -9.2L4.6 8M-9.6 -4.6L-8.6 6M9.6 -4.6L8.6 6" stroke="#d9587f" stroke-width="1.1" stroke-linecap="round" fill="none"/><circle cy="1.2" r="6.2" fill="#fdf6ff" stroke="#1c1640" stroke-width="2"/><path d="M-3.6 -1.2A4.4 4.4 0 0 1 -.4 -3.4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="2.2" cy="3.4" r="1.7" fill="#d6e6ff"/>') },
  look: 'islands',                    // chrome CSS scope: the Islands rules apply as they are
  board: { free: true, guard: false, live: { kH: 0, kB: 0, damp: .53, cap: .38, rep: 5, fk: .065, fr: 2.5, fl: 1.15 } },
}));
