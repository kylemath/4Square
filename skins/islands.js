// Islands: the built-in board (the shell draws it, board/island.js). Its look is the shell's default, so the spec only
// names it; the rich animated how-to-play, the hex bonus tiles and the sea-blue exploration map are the shell's own.
// Islands Free and Islands 3D (islands-free.js, islands-3d.js) extend this spec: same theme, art and map, other board.
FTH_SKINS.register({
  id: 'islands', name: 'Islands', ic: '🏝️', blurb: 'trace chains across a cartoon island',
  coin: { name: 'doubloon', plural: 'doubloons', glyph: '🪙', value: 10, pitch: 1,   // this skin's currency (SKIN-SPEC.md section 12)
    colors: { main: '#ffd84a', edge: '#c27a00' },
    svg: FTH_SKINS.coinArt('<circle cy="1.8" r="11" fill="#c27a00" stroke="#1c1640" stroke-width="2"/><circle r="11" fill="#ffd84a" stroke="#1c1640" stroke-width="2"/><circle r="7.4" fill="none" stroke="#f0a91c" stroke-width="1.8"/><path d="M0 -4.8L1.4 -1.4 4.8 0 1.4 1.4 0 4.8-1.4 1.4-4.8 0-1.4-1.4Z" fill="#fff6c8" stroke="#c27a00" stroke-width=".8"/><path d="M-6.5 -6A9 9 0 0 1 1 -9.2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>') },
  board: { free: false },             // the island board: three far regions as walls, tiles on their planar layout (SKIN-SPEC.md section 11)
  hud: 'full',
  eggs: [                             // SKIN-SPEC.md section 15: tap the title island five times and a whale leaps out of the sea
    { id: 'whale', on: 'title', taps: 5, run(fx) { fx.sound('whoosh'); fx.burst('🐋', .3, .34); setTimeout(() => { fx.sound('pop'); fx.burst('🐟', .72, .36); }, 700); fx.pay(40); } },
  ],
  theme: {
    '--sk-bg': 'linear-gradient(180deg, #5fd0ff 0%, #3aa6f0 48%, #2a7fdc 100%)',
    '--sk-ink': '#ffffff',
    '--sk-accent': '#ffd84a',
    '--sk-card': 'linear-gradient(170deg, #232b38, #161b22)',
    '--sk-card-ink': '#e6edf3',
    '--sk-hud': 'linear-gradient(180deg, rgba(14,52,110,.92) 0%, rgba(14,52,110,.7) 100%)',
    '--sk-btn': 'linear-gradient(180deg, #7ee26b, #2fb34a)',
    '--sk-btn-ink': '#ffffff',
    '--sk-btn-shadow': '#1c7a2e',
    '--sk-font': "system-ui, -apple-system, 'Segoe UI', sans-serif",
    '--sk-radius': '22px',
    '--sk-ctl': '#14377a', '--sk-ctl-ink': '#ffffff', '--sk-ctl-edge': '#ffd84a',
    '--sk-star-on': '#ffd84a', '--sk-star-edge': '#1c1640', '--sk-star-off': '#7b86c4', '--sk-star-off-edge': '#a3acdc',
  },
});
