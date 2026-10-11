// Islands: the built-in board (the shell draws it). Its look is the shell's default, so the spec only names it;
// the rich animated how-to-play, the hex bonus tiles and the sea-blue exploration map are the shell's own.
FTH_SKINS.register({
  id: 'islands', name: 'Islands', ic: '🏝️', blurb: 'trace chains across a cartoon island',
  hud: 'full',
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
  },
});
