# UAEC Invasion — Playtest Notes

## Current Build

Version: UAEC Invasion v0.1.0

## What Feels Good

- Core gameplay loop is already fun.
- Player movement feels responsive.
- One-missile-at-a-time shooting works well.
- Enemy formation movement feels close to classic arcade behavior.
- Enemy shooting feels fair.
- Wave progression works.
- Screen shake improves impact feel.
- Explosions improve hit feedback.
- Audio heartbeat helps tension.
- Sprite toggle helps compare test art vs placeholders.

## Known Issues

- Current test sprites are temporary pipeline art.
- Test sprites have visible boxed/grid artifacts from sprite sheet slicing.
- Final individual transparent sprites are needed.
- Mobile controls are not implemented yet.
- No cyberpunk background music yet.
- Debug hitbox overlay was unstable and is currently disabled.

## Balance Notes

- 35-enemy formation works better than the original 55 for this perspective.
- Player movement is locked horizontally.
- Player missile speed is intentionally slow and deliberate.
- 3 lives feels correct.
- Enemy shooting currently feels good.
- Wave 3 difficulty was previously too aggressive and has been softened.

## Art Notes

- Final sprites should be created individually, not sliced from a concept sheet.
- Keep strong silhouettes.
- Preserve UAEC enemy hierarchy:
  - Officer = small
  - Shield Unit = medium
  - Armored Class = large
  - Tank = mystery target
- Keep the Citadel witness portrait mostly black and white.

## Next Priorities

1. Replace temporary test sprites with cleaner individual sprites.
2. Improve player sprite readability.
3. Improve enemy sprite scale and contrast.
4. Improve Neo Tokyo / Citadel street background.
5. Add cyberpunk music loop with mute support.
6. Add mobile controls after desktop feels polished.
