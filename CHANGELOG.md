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
- Extracted background image and fallback drawing into `BackgroundRenderer`.
- Extracted enemy and barricade setup into tested gameplay factory helpers.
- Extracted enemy/player collision geometry into tested pure helpers.
- Extracted collision hit-detection decisions into tested pure helpers.
- Extracted enemy shooter selection and shot cooldown logic into tested gameplay helpers.
- Extracted explosion and floating text lifecycle updates into tested gameplay helpers.
- Extracted projectile movement and cleanup into tested gameplay helpers.
- Added Supabase leaderboard schema, environment template, and typed browser client foundation.
- Added game-over initials entry, Supabase score submission, and leaderboard display.
- Added Supabase leaderboard pruning so only the top 100 scores remain stored.
- Added Up/Down, mouse wheel, and click-drag scrollbar support for the game-over leaderboard.
- Disabled pause, mute, and sprite-toggle hotkeys on the game-over screen and removed the leaderboard scroll hint text.
- Restored leaderboard placement numbers while keeping wave hidden.
- Highlighted the current submitted leaderboard row in glowing gold.
- Added responsive touch controls for movement, firing, and pause on mobile/coarse-pointer devices.
- Improved browser audio unlocking so SFX and music can recover from autoplay restrictions on key/click input.
- Fixed the enemy sprite render path so the intended crisp readable pass is actually drawn.
- Added generated barricade atlas rendering with full 6x3 barricade coverage and weathered damage visuals.
- Redrew player and enemy projectile sprites with tighter bounds and aligned collision/render sizing.
- Adjusted player visual scale and lowered the player hitbox to match the sprite position.
- Added tank rumble SFX and a procedural dust trail while the tank is active.
- Cached static atmosphere overlays and barricade rendering to reduce per-frame work.

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
