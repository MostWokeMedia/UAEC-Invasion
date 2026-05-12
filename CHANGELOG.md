# Changelog

All notable project changes should be documented here.

## Unreleased

### Changed

- Repaired `README.md` so it is valid Markdown and removed the accidental pasted shell fragment.
- Added safety/revert guidance to `RELEASE_CHECKLIST.md`.
- Added lightweight verification scripts and Vitest-based logic tests.
- Added safe storage helpers for high score and audio mute preferences.
- Added cleanup hooks for global keyboard listeners and Vite hot reload.
- Extracted pure gameplay helpers for formation timing, wave advance, and tank scoring.
- Extracted cached sprite drawing into `SpriteRenderer` so `Game` owns less rendering infrastructure.
- Extracted HUD drawing into `HudRenderer` while keeping HUD state owned by `Game`.
- Extracted start, pause, transition, and game-over overlays into `ScreenRenderer`.
- Extracted rain, CRT, vignette, and gameplay readability overlays into `AtmosphereRenderer`.
- Extracted projectile and explosion drawing into `EffectsRenderer`.
- Extracted barricade drawing into `BarricadeRenderer`.
- Extracted player drawing into `PlayerRenderer`.
- Extracted tank drawing into `TankRenderer`.
- Extracted enemy drawing into `EnemyRenderer`.
- Extracted score popup drawing into `FloatingTextRenderer`.
- Improved browser audio unlocking so SFX and music can recover from autoplay restrictions on key/click input.
- Fixed the enemy sprite render path so the intended crisp readable pass is actually drawn.

### Moved

- Moved historical source snapshots from active `src/` paths into `archive/source-snapshots/`:
  - `src/main.ts.backup-*`
  - `src/game/Game.ts.before-*`

### Removed

- Removed unused Vite starter files:
  - `src/counter.ts`
  - `src/assets/vite.svg`
  - `src/assets/typescript.svg`
  - `src/assets/hero.png`

### Verification

- Intended verification command: `npm run verify`
- Manual smoke checklist: see `RELEASE_CHECKLIST.md`
- Note: this implementation environment could not run Node-based checks because `node` and `npm` were not available on `PATH`.
- Run `npm install` in a Node-enabled environment to hydrate the full `package-lock.json` entries for Vitest before using `npm ci`.
