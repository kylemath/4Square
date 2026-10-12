// Islands 3D: the Islands art as a three.js scene you can tilt and spin (lab/islands3d.html, built on lab/core.js). It
// builds its layout from the level's graph, so every level plays; without WebGL it posts an error and the shell
// plays the level on the island board instead.
FTH_SKINS.register(FTH_SKINS.extend('islands', {
  id: 'islands-3d', name: 'Islands 3D', ic: '🧊', blurb: 'tilt and spin a floating island',
  coin: { name: 'crystal shard', plural: 'crystal shards', glyph: '💎', value: 100, pitch: 1.5,   // this skin's currency (SKIN-SPEC.md section 12)
    colors: { main: '#54e0ff', edge: '#8a6cf0' },
    svg: FTH_SKINS.coinArt('<path d="M-9 -3L-4.5 -11H4.5L9 -3L0 12Z" fill="#54e0ff"/><path d="M-9 -3H-2.6L0 12Z" fill="#1f9fd0"/><path d="M2.6 -3H9L0 12Z" fill="#8a6cf0"/><path d="M-4.5 -11L-2.6 -3H2.6L4.5 -11Z" fill="#cdfbff"/><path d="M-9 -3H9M-4.5 -11L-2.6 -3L0 12L2.6 -3L4.5 -11" fill="none" stroke="#1c1640" stroke-width="1.1" stroke-linejoin="round"/><path d="M-9 -3L-4.5 -11H4.5L9 -3L0 12Z" fill="none" stroke="#1c1640" stroke-width="2" stroke-linejoin="round"/><path d="M-6.4 -4.6L-4.2 -8.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>') },
  look: 'islands',
  src: 'lab/islands3d.html',
  board: null,
}));
