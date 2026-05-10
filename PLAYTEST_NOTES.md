# UAEC Invasion — Playtest Notes

## Current Build

Version: UAEC Invasion v0.2.0

## What Feels Good

- Core gameplay loop is fun.
- Player movement feels responsive.
- One-missile-at-a-time shooting works well.
- Enemy formation movement feels close to classic arcade behavior.
- Enemy shooting frequency feels good.
- Wave 1–5 feel fair.
- Tank appears often enough and feels worth shooting.
- Player hitbox feels fair after lowering the collision box.
- Screen shake improves impact feel.
- Explosions improve hit feedback.
- Heartbeat audio helps tension.
- Separate music/SFX toggles are useful.
- Sprite toggle helps compare art vs placeholders.

## Current Balance Notes

- Wave 1: good
- Wave 2: good
- Wave 3: good
- Wave 4: good
- Wave 5: good
- Wave 6: slightly hard
- Wave 7: previously unfair; wave pressure has been softened
- Player missile speed feels good
- Player missile visual size has been increased
- Enemy shot frequency feels good

## Art Notes

- Player sprite direction is locked:
  - back-facing
  - hips-up
  - neon green hair
  - black Neo Tokyo hoodie
  - missile launcher
- UAEC enemy classes are now visually distinct:
  - Officer = small/basic
  - Shield = medium/defensive
  - Armored = large/heavy
  - Tank = mystery target
- Enemy visual scale has been tuned so front officers do not read smaller than middle shield units.
- Keep strong silhouettes and transparent PNGs.
- Citadel witness portrait should remain mostly black and white.

## Known Issues / Watch List

- Need more long-wave testing after Wave 7.
- Mobile controls are not implemented yet.
- Debug hitbox overlay was unstable and is disabled.
- Background depth may need another pass after more playtesting.
- Music file must be named exactly `music_loop.mp3`.
- Need browser compatibility testing.

## Next Priorities

1. Long playtest through Waves 7–10.
2. Tune late-wave difficulty if needed.
3. Update README with current controls and music setup.
4. Add mobile controls after desktop balance feels stable.
5. Prepare deployment build.
